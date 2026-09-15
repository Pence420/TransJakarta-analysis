#!/usr/bin/env python3
"""
Run Extract & Load pipeline: download GTFS -> parse -> load to Postgres.

Usage:
    python scripts/run_extract_load.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from config import GTFS_FEED_URL
from extract.download import compute_file_hash, download_gtfs, unzip_gtfs
from extract.parser import (
    cast_calendar,
    cast_route,
    cast_shape,
    cast_stop,
    cast_stop_time,
    cast_trip,
    parse_all_gtfs,
)
from load.loader import (
    get_connection,
    register_feed_version,
    upsert_calendar,
    upsert_routes,
    upsert_shapes,
    upsert_stop_times,
    upsert_stops,
    upsert_trips,
)


def run():
    print("=" * 60)
    print("Transjakarta GTFS — Extract & Load Pipeline")
    print("=" * 60)

    # 1. Download
    print("\n[1/4] Downloading GTFS feed...")
    zip_path = download_gtfs(GTFS_FEED_URL)

    # 2. Hash & metadata
    print("\n[2/4] Computing file hash...")
    file_hash = compute_file_hash(zip_path)
    file_size = zip_path.stat().st_size
    print(f"Hash: {file_hash}")
    print(f"Size: {file_size} bytes")

    # 3. Unzip & parse
    print("\n[3/4] Extracting and parsing CSV files...")
    extracted_dir = unzip_gtfs(zip_path)
    all_data = parse_all_gtfs(extracted_dir)

    # 4. Load to Postgres
    print("\n[4/4] Loading to Postgres...")
    conn = get_connection()
    try:
        version_id = register_feed_version(conn, file_hash, file_size)

        upsert_routes(conn, version_id, [cast_route(r) for r in all_data["routes.txt"]])
        upsert_stops(conn, version_id, [cast_stop(r) for r in all_data["stops.txt"]])
        upsert_trips(conn, version_id, [cast_trip(r) for r in all_data["trips.txt"]])
        upsert_stop_times(conn, version_id, [cast_stop_time(r) for r in all_data["stop_times.txt"]])
        upsert_shapes(conn, version_id, [cast_shape(r) for r in all_data["shapes.txt"]])
        upsert_calendar(conn, version_id, [cast_calendar(r) for r in all_data["calendar.txt"]])

        print("\n" + "=" * 60)
        print(f"SUCCESS — Feed version {version_id} loaded")
        print("=" * 60)
    except Exception as e:
        conn.rollback()
        print(f"\nERROR: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    run()
