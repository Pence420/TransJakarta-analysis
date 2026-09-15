-- ============================================================
-- Staging: Clean & typed version of raw data
-- Run AFTER raw tables are populated
-- ============================================================

-- Staging routes: dedup, trim strings
DROP TABLE IF EXISTS staging.routes CASCADE;
CREATE TABLE staging.routes AS
SELECT DISTINCT ON (feed_version_id, route_id)
    feed_version_id,
    route_id,
    agency_id,
    TRIM(route_short_name) AS route_short_name,
    TRIM(route_long_name) AS route_long_name,
    route_desc,
    route_type,
    route_url,
    UPPER(TRIM(route_color)) AS route_color,
    UPPER(TRIM(route_text_color)) AS route_text_color,
    loaded_at
FROM raw.routes
ORDER BY feed_version_id, route_id, loaded_at DESC;

CREATE INDEX IF NOT EXISTS idx_staging_routes_id ON staging.routes(route_id);

-- Staging stops: dedup, trim, cast lat/lon
DROP TABLE IF EXISTS staging.stops CASCADE;
CREATE TABLE staging.stops AS
SELECT DISTINCT ON (feed_version_id, stop_id)
    feed_version_id,
    stop_id,
    TRIM(stop_code) AS stop_code,
    TRIM(stop_name) AS stop_name,
    TRIM(stop_desc) AS stop_desc,
    stop_lat,
    stop_lon,
    TRIM(zone_id) AS zone_id,
    stop_url,
    COALESCE(location_type, 0) AS location_type,
    TRIM(parent_station) AS parent_station,
    TRIM(stop_timezone) AS stop_timezone,
    wheelchair_boarding,
    loaded_at
FROM raw.stops
ORDER BY feed_version_id, stop_id, loaded_at DESC;

CREATE INDEX IF NOT EXISTS idx_staging_stops_id ON staging.stops(stop_id);

-- Staging trips: dedup
DROP TABLE IF EXISTS staging.trips CASCADE;
CREATE TABLE staging.trips AS
SELECT DISTINCT ON (feed_version_id, trip_id)
    feed_version_id,
    route_id,
    service_id,
    trip_id,
    TRIM(trip_headsign) AS trip_headsign,
    TRIM(trip_short_name) AS trip_short_name,
    direction_id,
    TRIM(block_id) AS block_id,
    TRIM(shape_id) AS shape_id,
    wheelchair_accessible,
    bikes_allowed,
    loaded_at
FROM raw.trips
ORDER BY feed_version_id, trip_id, loaded_at DESC;

CREATE INDEX IF NOT EXISTS idx_staging_trips_id ON staging.trips(trip_id);
CREATE INDEX IF NOT EXISTS idx_staging_trips_route ON staging.trips(route_id);

-- Staging stop_times: dedup, cast time strings to interval
DROP TABLE IF EXISTS staging.stop_times CASCADE;
CREATE TABLE staging.stop_times AS
SELECT DISTINCT ON (feed_version_id, trip_id, stop_sequence)
    feed_version_id,
    trip_id,
    arrival_time,
    departure_time,
    stop_id,
    stop_sequence,
    TRIM(stop_headsign) AS stop_headsign,
    COALESCE(pickup_type, 0) AS pickup_type,
    COALESCE(drop_off_type, 0) AS drop_off_type,
    shape_dist_traveled,
    timepoint,
    loaded_at
FROM raw.stop_times
ORDER BY feed_version_id, trip_id, stop_sequence, loaded_at DESC;

CREATE INDEX IF NOT EXISTS idx_staging_stop_times_trip ON staging.stop_times(trip_id);

-- Staging shapes: dedup
DROP TABLE IF EXISTS staging.shapes CASCADE;
CREATE TABLE staging.shapes AS
SELECT DISTINCT ON (feed_version_id, shape_id, shape_pt_sequence)
    feed_version_id,
    shape_id,
    shape_pt_lat,
    shape_pt_lon,
    shape_pt_sequence,
    shape_dist_traveled,
    loaded_at
FROM raw.shapes
ORDER BY feed_version_id, shape_id, shape_pt_sequence, loaded_at DESC;

CREATE INDEX IF NOT EXISTS idx_staging_shapes_id ON staging.shapes(shape_id);

-- Staging calendar: dedup
DROP TABLE IF EXISTS staging.calendar CASCADE;
CREATE TABLE staging.calendar AS
SELECT DISTINCT ON (feed_version_id, service_id)
    feed_version_id,
    service_id,
    monday,
    tuesday,
    wednesday,
    thursday,
    friday,
    saturday,
    sunday,
    start_date,
    end_date,
    loaded_at
FROM raw.calendar
ORDER BY feed_version_id, service_id, loaded_at DESC;

CREATE INDEX IF NOT EXISTS idx_staging_calendar_id ON staging.calendar(service_id);
