# PRD — Transjakarta Network Intelligence Pipeline

## 1. Ringkasan Proyek

Membangun pipeline data engineering berbasis **Postgres**, pola **ELT** (bukan ETL), dilengkapi **Change Data Capture (CDC)**, untuk mengolah data **GTFS Transjakarta** (routes, stops, trips, stop_times, shapes, calendar) menjadi insight jaringan transportasi publik Jakarta: coverage wilayah, frekuensi layanan (headway), jam operasional, dan **historical diff** perubahan jaringan antar versi feed GTFS.

Sumber data: GTFS Static feed resmi Transjakarta (terdaftar di Transitland, ID `f-transjakarta~id`, 236 rute, 8.421 stop, dengan puluhan versi historis) + opsional dataset satudata.jakarta.go.id.

Kenapa ini menarik secara data engineering: GTFS sering dikira "data statis", tapi feed-nya sebenarnya **berubah dari waktu ke waktu** (rute baru, stop dipindah, jadwal direvisi). Proyek ini memperlakukan setiap refresh GTFS sebagai *source of change*, ditangkap lewat CDC, bukan full reprocess tiap kali — jadi prinsip data engineering modern (incremental processing, historical lineage) beneran dipakai, bukan sekadar dekorasi.

## 2. Prinsip Arsitektur yang Dipakai

Proyek ini secara eksplisit mengikuti **9 Principles of Good Data Architecture** (Reis & Housley, *Fundamentals of Data Engineering*), dipetakan ke keputusan desain konkret:

| # | Prinsip | Penerapan di proyek ini |
|---|---|---|
| 1 | Choose common components wisely | Satu engine (Postgres) dipakai untuk raw layer, staging, dan marts — hindari nambah tools yang gak perlu (gak pakai Kafka/Spark buat skala kecil ini) |
| 2 | Plan for failure | Setiap job extract/load idempotent (upsert berbasis primary key GTFS), checkpoint versi feed terakhir yang berhasil diproses, retry dengan backoff |
| 3 | Architect for scalability | Partitioning tabel besar (`stop_times`) per feed version/tanggal, indexing di kolom join utama (`route_id`, `stop_id`, `trip_id`) |
| 4 | Architecture is leadership | Setiap keputusan besar (Postgres vs DuckDB, ELT vs ETL) didokumentasikan alasannya di README, bukan cuma "karena gitu aja" |
| 5 | Always be architecting | Desain raw layer cukup generik supaya nanti bisa nambah GTFS-Realtime tanpa rombak ulang skema |
| 6 | Build loosely coupled systems | Extract, Load, CDC-diff, Transform, Serve dipisah jadi modul/skrip independen, dihubungkan lewat orchestrator, bukan satu skrip monolitik |
| 7 | Make reversible decisions | Raw layer disimpan apa adanya (schema-on-read minim transformasi) supaya transform logic bisa diubah & di-replay tanpa fetch ulang data lama |
| 8 | Prioritize security | Credentials di `.env`, role Postgres terpisah: `etl_writer` (write ke raw/staging) vs `dashboard_reader` (read-only ke marts) |
| 9 | Embrace FinOps | Retention policy eksplisit untuk snapshot GTFS lama (misal simpan raw 6 bulan terakhir), monitoring ukuran database dari awal walau proyek personal |

## 3. Arsitektur Data

```
[GTFS Static Feed (.zip)] ---> [Extract: download + unzip] ---> [Load: raw schema Postgres]
                                                                        |
                                                          [CDC diff engine: bandingkan versi baru vs snapshot terakhir]
                                                                        |
                                                       [change_log tables: routes_added, stops_changed, dst]
                                                                        |
                                          [Transform (in-warehouse SQL): raw -> staging -> marts]
                                                                        |
                                    [Serve: FastAPI (read-only) -> Frontend React (Vite) + query analitik]
```

**Kenapa ELT bukan ETL:** raw GTFS di-*load* ke Postgres dulu apa adanya (minim transformasi), baru ditransformasi pakai SQL di dalam Postgres itu sendiri. Ini lebih fleksibel karena transform logic bisa diubah & di-replay dari raw tanpa fetch ulang dari sumber — sesuai prinsip #7 (reversible decisions).

**Kenapa CDC relevan walau sumbernya "statis":** GTFS Transjakarta di-publish ulang secara berkala dan isinya berubah (rute baru, stop dipindah/dihapus, jadwal direvisi). Alih-alih treat tiap refresh sebagai full reload, sistem ini membandingkan snapshot baru vs snapshot terakhir di raw layer dan mencatat *delta*-nya sebagai change events — prinsip incremental processing ala CDC, diimplementasikan pakai Postgres (trigger-based change tracking atau versioned snapshot diffing, tergantung pilihan teknis di Fase 3).

## 4. Skema Data (Postgres)

### Schema `raw`
Mirror struktur asli GTFS, ditambah kolom metadata:
- `raw.routes`, `raw.stops`, `raw.trips`, `raw.stop_times`, `raw.shapes`, `raw.calendar`
- Tiap tabel dapat kolom tambahan: `feed_version_id`, `loaded_at`

### Schema `cdc`
- `cdc.feed_versions` — histori tiap kali feed GTFS di-fetch (version id, fetch timestamp, hash file)
- `cdc.route_changes`, `cdc.stop_changes`, `cdc.schedule_changes` — append-only log perubahan antar versi (jenis perubahan: ADDED / REMOVED / MODIFIED + before/after value)

### Schema `staging`
Versi bersih & tertipisasi dari raw (dedup, type casting, null handling)

### Schema `marts`
Model dimensional siap analisis:
- `dim_route`, `dim_stop`, `dim_time`, `dim_feed_version`
- `fact_trip`, `fact_stop_time`
- Tabel agregat: `mart_coverage_by_area`, `mart_headway_by_route_hour`, `mart_service_span`

## 5. Fase & Task Breakdown

### Fase 1 — Foundation
- Setup Postgres (lokal/Docker) + enable extension PostGIS, buat database + 4 schema (raw, cdc, staging, marts)
- Buat role `etl_writer` dan `dashboard_reader` dengan permission terpisah (prinsip #8)
- Struktur folder proyek (extract/, load/, cdc/, transform/, api/, frontend/), git init, venv, requirements.txt
- `.env` untuk credentials Postgres

### Fase 2 — Extract & Load (EL dari ELT)
- Script download GTFS zip Transjakarta dari Transitland, unzip, parse CSV (routes.txt, stops.txt, trips.txt, stop_times.txt, shapes.txt, calendar.txt)
- Load ke schema `raw` dengan upsert idempotent (primary key sesuai spec GTFS)
- Catat setiap fetch sebagai row baru di `cdc.feed_versions`
- Test: jalankan load 2x dengan data sama, pastikan gak ada duplikat (idempotency, prinsip #2)

### Fase 3 — CDC Diff Engine
- Implementasi logic bandingkan snapshot raw versi baru vs versi sebelumnya (per tabel: routes, stops, stop_times)
- Tulis hasil diff ke `cdc.route_changes` / `cdc.stop_changes` / `cdc.schedule_changes`
- Validasi manual: cek beberapa contoh perubahan match dengan histori feed di Transitland

### Fase 4 — Transform (T dari ELT, in-warehouse)
- SQL transformation raw -> staging (cleaning, dedup, type casting)
- SQL transformation staging -> marts (dimensional model)
- Build mart agregat: coverage per wilayah (perlu join ke data batas kelurahan/kecamatan Jakarta — dicari di Fase 4), headway per rute per jam, service span per koridor

### Fase 5 — Orchestration
- Scheduler sederhana (cron atau Python scheduler) untuk jalanin Extract->Load->CDC diff->Transform secara berurutan dan otomatis
- Logging & error handling per step (prinsip #2 — plan for failure)

### Fase 6a — Serve: API Layer
- FastAPI + uvicorn, koneksi ke Postgres **hanya** pakai role `dashboard_reader` (read-only, prinsip #8)
- Endpoint minimal: `/routes`, `/routes/{route_id}/shape`, `/stops`, `/coverage`, `/headway`, `/feed-versions`, `/feed-versions/{id}/changes`
- Semua query pakai parameterized statement (psycopg/SQLAlchemy), gak ada string concat SQL
- Response model pakai Pydantic supaya kontrak API eksplisit dan gak bocorin kolom internal
- Catatan desain (prinsip #6): API layer ini yang bikin serving beneran loosely coupled — frontend gak pernah nyentuh database langsung

### Fase 6b — Serve: Frontend
- Vite + React, peta pakai MapLibre GL JS (WebGL — sanggup render ribuan stop, beda sama Folium/Leaflet yang bikin marker per DOM node)
- Chart headway per koridor pakai Recharts, data fetching pakai TanStack Query
- Timeline perubahan jaringan antar feed version dari endpoint `/feed-versions/{id}/changes` — ini fitur pembeda utama dashboard-nya
- Shapes yang dikirim ke browser pakai versi hasil `ST_Simplify` dari marts, bukan polyline mentah

**Catatan tension dengan prinsip #1:** nambah FastAPI = nambah komponen, yang secara harfiah melanggar "choose common components wisely". Trade-off ini diambil sadar: biaya satu service tambahan ditukar dengan serving layer yang decoupled (prinsip #6) dan boundary keamanan yang jelas (prinsip #8). Alasannya ditulis di README, bukan disembunyiin.

### Fase 7 — Dokumentasi & Wrap-up
- README: arsitektur, cara jalanin, keputusan desain & alasannya (prinsip #4 — architecture is leadership)
- Retention policy note untuk data raw lama (prinsip #9 — FinOps)
- Jalankan Security Checklist (Bagian 8) dan Frontend Polish Checklist (Bagian 9) sebelum dianggap selesai

## 6. Di Luar Scope (untuk sekarang)
- GTFS-Realtime (posisi bus live) — belum ada endpoint resmi publik yang stabil, jadi di-skip; arsitektur raw layer didesain supaya bisa nambah ini nanti tanpa rombak ulang (prinsip #5)
- Data transaksi/ridership riil (data ini private, gak dipublish resmi oleh Transjakarta)

## 7. Tech Stack
- **Database**: Postgres + **PostGIS** (single source of truth untuk raw, cdc, staging, marts). PostGIS di-enable sejak Fase 1, bukan Fase 4 — coverage per kelurahan itu spatial join (`ST_Contains`), jauh lebih murah dikerjain di dalam database daripada di pandas
- **Bahasa**: Python 3 (extract/load/CDC diff scripts)
- **Transform**: SQL langsung di Postgres (opsional pakai dbt-postgres kalau mau lebih terstruktur — didiskusikan di Fase 4)
- **API**: FastAPI + uvicorn (ASGI), Pydantic untuk response model
- **Frontend**: Vite + React, MapLibre GL JS (peta), Recharts (chart), TanStack Query (fetching)
- **Orchestration**: cron atau Python scheduler sederhana

## 8. Security Checklist (pre-launch)

Checklist ini **sudah difilter** sesuai bentuk aplikasinya: read-only, data publik, tanpa user account. Item soal auth, session, JWT, hashing password, reset password, CSRF, IDOR/BOLA, file upload, dan payment sengaja **tidak dimasukkan** karena permukaan serangannya memang tidak ada di sini — mencantumkannya cuma bikin checklist terasa lengkap tanpa menambah keamanan nyata. Kalau nanti ditambah fitur login (misal admin panel buat trigger manual re-ingest), item-item itu baru wajib masuk.

### Kredensial & konfigurasi
- [ ] `.env` masuk `.gitignore`, `.env.example` di-commit tanpa nilai asli
- [ ] Tidak ada connection string / password hardcoded di source (termasuk notebook dan file SQL)
- [ ] Scan histori Git untuk secret yang pernah ke-commit (gitleaks / `git log -p | grep`) — kalau ada, rotasi kredensialnya, bukan cuma hapus filenya
- [ ] Tidak ada default credential (`postgres:postgres`) yang kebawa dari fase development

### API layer
- [ ] `debug=False` / `--reload` mati di deployment; `/docs` dan `/redoc` dimatikan atau dibatasi kalau API-nya public
- [ ] Exception handler custom — traceback dan pesan error Postgres tidak pernah dikirim ke client
- [ ] CORS di-set eksplisit ke origin frontend saja, **bukan** `allow_origins=["*"]` (ini yang paling gampang kelewat karena `*` "bikin jalan" pas development)
- [ ] Validasi tipe & range semua query param lewat Pydantic (`route_id`, rentang tanggal, `limit`) — tolak yang di luar batas, jangan diteruskan ke SQL
- [ ] Parameterized query di semua endpoint; tidak ada f-string/concat untuk membangun SQL
- [ ] Pagination + hard cap pada `limit` supaya satu request tidak bisa narik seluruh `fact_stop_time`
- [ ] Rate limit sederhana (mis. slowapi) kalau API-nya diekspos ke internet

### Database
- [ ] Postgres tidak listen ke `0.0.0.0` / port 5432 tidak ter-expose ke publik; akses lewat localhost atau private network saja
- [ ] `dashboard_reader` benar-benar read-only: `GRANT SELECT` hanya ke schema `marts`, tanpa akses ke `raw`, `cdc`, dan `staging`
- [ ] `etl_writer` tidak dipakai oleh API — cek di config, bukan diasumsikan
- [ ] Verifikasi permission dengan mencoba `INSERT` sebagai `dashboard_reader` dan memastikan gagal

### Pipeline
- [ ] URL sumber GTFS di-pin ke domain Transitland yang diharapkan, tidak menerima URL arbitrer dari input eksternal (mitigasi SSRF pada job extract)
- [ ] Log tidak memuat connection string, dan file log tidak ikut ter-serve sebagai static file

## 9. Frontend Polish Checklist

Diambil dari checklist launch web umum, tapi dipangkas: item marketing (CTA above the fold, cookie banner, privacy policy, terms, thank-you page) tidak relevan untuk dashboard internal/portfolio yang tidak mengumpulkan data pribadi dan tidak menjual apa pun.

- [ ] Loading state untuk setiap fetch — peta dengan ribuan stop butuh waktu, jangan layar kosong
- [ ] Error state eksplisit kalau API mati atau query gagal, bukan komponen yang diam-diam kosong
- [ ] Empty state untuk filter yang tidak menghasilkan data (mis. rute tanpa perubahan di versi feed tertentu)
- [ ] Mobile breakpoint — minimal peta dan chart tidak pecah di layar kecil
- [ ] Custom 404 untuk route React yang tidak dikenal
- [ ] Meta title + description per halaman, favicon di-set
- [ ] Alt text pada elemen non-peta; untuk chart sediakan ringkasan teks atau tabel pendamping
- [ ] Aset di-compress, GeoJSON shapes disajikan dalam versi simplified dan idealnya di-gzip dari server
- [ ] Bundle production di-build (`vite build`) dan dicek ukurannya — MapLibre + Recharts lumayan berat
