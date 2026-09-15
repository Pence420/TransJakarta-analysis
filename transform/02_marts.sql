-- ============================================================
-- Marts: Dimensional model for analytics
-- Run AFTER 01_staging.sql
-- ============================================================

-- ============================================================
-- DIMENSION TABLES
-- ============================================================

-- dim_route: latest snapshot of each route
DROP TABLE IF EXISTS marts.dim_route CASCADE;
CREATE TABLE marts.dim_route AS
SELECT
    route_id,
    agency_id,
    route_short_name,
    route_long_name,
    route_desc,
    route_type,
    route_url,
    route_color,
    route_text_color,
    feed_version_id,
    loaded_at
FROM staging.routes
WHERE feed_version_id = (SELECT MAX(feed_version_id) FROM staging.routes);

ALTER TABLE marts.dim_route ADD PRIMARY KEY (route_id);

-- dim_stop: latest snapshot of each stop with geometry
DROP TABLE IF EXISTS marts.dim_stop CASCADE;
CREATE TABLE marts.dim_stop AS
SELECT
    stop_id,
    stop_code,
    stop_name,
    stop_desc,
    stop_lat,
    stop_lon,
    ST_SetSRID(ST_MakePoint(stop_lon, stop_lat), 4326)::geometry(Point, 4326) AS geom,
    zone_id,
    stop_url,
    location_type,
    parent_station,
    stop_timezone,
    wheelchair_boarding,
    feed_version_id,
    loaded_at
FROM staging.stops
WHERE feed_version_id = (SELECT MAX(feed_version_id) FROM staging.stops)
  AND stop_lat IS NOT NULL AND stop_lon IS NOT NULL;

ALTER TABLE marts.dim_stop ADD PRIMARY KEY (stop_id);
CREATE INDEX IF NOT EXISTS idx_dim_stop_geom ON marts.dim_stop USING GIST (geom);

-- dim_time: service calendar expansion
DROP TABLE IF EXISTS marts.dim_time CASCADE;
CREATE TABLE marts.dim_time AS
WITH date_range AS (
    SELECT MIN(start_date) AS min_date, MAX(end_date) AS max_date
    FROM staging.calendar
    WHERE feed_version_id = (SELECT MAX(feed_version_id) FROM staging.calendar)
),
date_series AS (
    SELECT generate_series(min_date, max_date, '1 day'::interval)::date AS service_date
    FROM date_range
)
SELECT
    ROW_NUMBER() OVER (ORDER BY ds.service_date)::int AS time_key,
    ds.service_date,
    EXTRACT(DOW FROM ds.service_date)::int AS day_of_week,
    EXTRACT(MONTH FROM ds.service_date)::int AS month,
    EXTRACT(YEAR FROM ds.service_date)::int AS year,
    CASE EXTRACT(DOW FROM ds.service_date)
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END AS day_name
FROM date_series ds;

ALTER TABLE marts.dim_time ADD PRIMARY KEY (time_key);

-- dim_feed_version: feed version metadata
DROP TABLE IF EXISTS marts.dim_feed_version CASCADE;
CREATE TABLE marts.dim_feed_version AS
SELECT
    feed_version_id,
    fetch_timestamp,
    file_hash,
    file_size_bytes,
    feed_start_date,
    feed_end_date,
    notes
FROM cdc.feed_versions;

ALTER TABLE marts.dim_feed_version ADD PRIMARY KEY (feed_version_id);

-- ============================================================
-- FACT TABLES
-- ============================================================

-- fact_trip: one row per trip with route and service info
DROP TABLE IF EXISTS marts.fact_trip CASCADE;
CREATE TABLE marts.fact_trip AS
SELECT
    t.trip_id,
    t.route_id,
    t.service_id,
    t.trip_headsign,
    t.direction_id,
    t.shape_id,
    t.wheelchair_accessible,
    t.bikes_allowed,
    (SELECT COUNT(*) FROM staging.stop_times st
     WHERE st.trip_id = t.trip_id AND st.feed_version_id = t.feed_version_id
    ) AS stop_count,
    t.feed_version_id,
    t.loaded_at
FROM staging.trips t
WHERE t.feed_version_id = (SELECT MAX(feed_version_id) FROM staging.trips);

ALTER TABLE marts.fact_trip ADD PRIMARY KEY (trip_id);
CREATE INDEX IF NOT EXISTS idx_fact_trip_route ON marts.fact_trip(route_id);

-- fact_stop_time: one row per stop_time with travel distance
DROP TABLE IF EXISTS marts.fact_stop_time CASCADE;
CREATE TABLE marts.fact_stop_time AS
SELECT
    st.trip_id,
    st.stop_id,
    st.stop_sequence,
    st.arrival_time,
    st.departure_time,
    st.pickup_type,
    st.drop_off_type,
    st.shape_dist_traveled,
    st.timepoint,
    st.feed_version_id
FROM staging.stop_times st
WHERE st.feed_version_id = (SELECT MAX(feed_version_id) FROM staging.stop_times);

ALTER TABLE marts.fact_stop_time ADD PRIMARY KEY (trip_id, stop_sequence);
CREATE INDEX IF NOT EXISTS idx_fact_stop_time_stop ON marts.fact_stop_time(stop_id);

-- ============================================================
-- AGGREGATE MARTS
-- ============================================================

-- mart_coverage_by_area: stop count per zone
DROP TABLE IF EXISTS marts.mart_coverage_by_area CASCADE;
CREATE TABLE marts.mart_coverage_by_area AS
SELECT
    COALESCE(zone_id, 'Unknown') AS zone_id,
    COUNT(*) AS total_stops,
    COUNT(DISTINCT parent_station) AS unique_stations,
    feed_version_id
FROM staging.stops
WHERE feed_version_id = (SELECT MAX(feed_version_id) FROM staging.stops)
GROUP BY zone_id, feed_version_id
ORDER BY total_stops DESC;

ALTER TABLE marts.mart_coverage_by_area ADD PRIMARY KEY (zone_id, feed_version_id);

-- mart_headway_by_route_hour: average headway per route per hour
-- Headway = time gap between consecutive trips on same route
DROP TABLE IF EXISTS marts.mart_headway_by_route_hour CASCADE;
CREATE TABLE marts.mart_headway_by_route_hour AS
WITH trip_departures AS (
    SELECT
        t.route_id,
        t.trip_id,
        t.service_id,
        st.departure_time,
        st.stop_sequence,
        ROW_NUMBER() OVER (
            PARTITION BY t.route_id, st.stop_id, t.service_id
            ORDER BY st.departure_time
        ) AS seq_num
    FROM staging.trips t
    JOIN staging.stop_times st ON t.trip_id = st.trip_id AND t.feed_version_id = st.feed_version_id
    WHERE t.feed_version_id = (SELECT MAX(feed_version_id) FROM staging.trips)
      AND st.departure_time IS NOT NULL
      AND st.departure_time ~ '^\d{1,2}:\d{2}:\d{2}$'
),
consecutive_pairs AS (
    SELECT
        a.route_id,
        a.stop_id,
        a.service_id,
        a.departure_time AS dep_a,
        b.departure_time AS dep_b,
        EXTRACT(EPOCH FROM (
            TO_TIMESTAMP(b.departure_time, 'HH24:MI:SS') -
            TO_TIMESTAMP(a.departure_time, 'HH24:MI:SS')
        )) / 60.0 AS gap_minutes
    FROM trip_departures a
    JOIN trip_departures b
        ON a.route_id = b.route_id
        AND a.stop_id = b.stop_id
        AND a.service_id = b.service_id
        AND b.seq_num = a.seq_num + 1
    WHERE EXTRACT(EPOCH FROM (
        TO_TIMESTAMP(b.departure_time, 'HH24:MI:SS') -
        TO_TIMESTAMP(a.departure_time, 'HH24:MI:SS')
    )) > 0
      AND EXTRACT(EPOCH FROM (
        TO_TIMESTAMP(b.departure_time, 'HH24:MI:SS') -
        TO_TIMESTAMP(a.departure_time, 'HH24:MI:SS')
    )) < 120  -- filter outliers > 2 hours
)
SELECT
    cp.route_id,
    r.route_short_name,
    r.route_long_name,
    EXTRACT(HOUR FROM TO_TIMESTAMP(cp.dep_a, 'HH24:MI:SS'))::int AS service_hour,
    ROUND(AVG(cp.gap_minutes)::numeric, 1) AS avg_headway_minutes,
    ROUND(MIN(cp.gap_minutes)::numeric, 1) AS min_headway_minutes,
    ROUND(MAX(cp.gap_minutes)::numeric, 1) AS max_headway_minutes,
    COUNT(*) AS trip_pairs_count
FROM consecutive_pairs cp
JOIN marts.dim_route r ON cp.route_id = r.route_id
GROUP BY cp.route_id, r.route_short_name, r.route_long_name,
         EXTRACT(HOUR FROM TO_TIMESTAMP(cp.dep_a, 'HH24:MI:SS'))
ORDER BY cp.route_id, service_hour;

ALTER TABLE marts.mart_headway_by_route_hour
    ADD PRIMARY KEY (route_id, service_hour);

-- mart_service_span: first and last service time per route
DROP TABLE IF EXISTS marts.mart_service_span CASCADE;
CREATE TABLE marts.mart_service_span AS
WITH parsed_times AS (
    SELECT
        t.route_id,
        st.departure_time,
        EXTRACT(EPOCH FROM TO_TIMESTAMP(st.departure_time, 'HH24:MI:SS'))::int AS seconds
    FROM staging.trips t
    JOIN staging.stop_times st ON t.trip_id = st.trip_id AND t.feed_version_id = st.feed_version_id
    WHERE t.feed_version_id = (SELECT MAX(feed_version_id) FROM staging.trips)
      AND st.departure_time IS NOT NULL
      AND st.departure_time ~ '^\d{1,2}:\d{2}:\d{2}$'
)
SELECT
    p.route_id,
    r.route_short_name,
    r.route_long_name,
    MIN(p.departure_time) AS first_departure,
    MAX(p.departure_time) AS last_departure,
    ROUND(((MAX(p.seconds) - MIN(p.seconds)) / 3600.0)::numeric, 1) AS service_hours,
    COUNT(DISTINCT p.departure_time) AS unique_departure_times
FROM parsed_times p
JOIN marts.dim_route r ON p.route_id = r.route_id
GROUP BY p.route_id, r.route_short_name, r.route_long_name
ORDER BY service_hours DESC;

ALTER TABLE marts.mart_service_span ADD PRIMARY KEY (route_id);

-- Grant read access to dashboard_reader
GRANT USAGE ON SCHEMA marts TO dashboard_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA marts TO dashboard_reader;
