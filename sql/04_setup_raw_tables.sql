-- ============================================================
-- Transjakarta GTFS Pipeline — Raw Tables + CDC Feed Versions
-- Run AFTER 03_setup_roles.sql
-- ============================================================

-- Feed version tracking
CREATE TABLE IF NOT EXISTS cdc.feed_versions (
    feed_version_id   SERIAL PRIMARY KEY,
    fetch_timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    file_hash         TEXT NOT NULL,
    file_size_bytes   BIGINT,
    feed_start_date   DATE,
    feed_end_date     DATE,
    notes             TEXT
);

-- Routes (GTFS routes.txt)
CREATE TABLE IF NOT EXISTS raw.routes (
    feed_version_id   INT NOT NULL REFERENCES cdc.feed_versions(feed_version_id),
    route_id          TEXT NOT NULL,
    agency_id         TEXT,
    route_short_name  TEXT,
    route_long_name   TEXT,
    route_desc        TEXT,
    route_type        INT,
    route_url         TEXT,
    route_color       TEXT,
    route_text_color  TEXT,
    loaded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (feed_version_id, route_id)
);

-- Stops (GTFS stops.txt)
CREATE TABLE IF NOT EXISTS raw.stops (
    feed_version_id   INT NOT NULL REFERENCES cdc.feed_versions(feed_version_id),
    stop_id           TEXT NOT NULL,
    stop_code         TEXT,
    stop_name         TEXT,
    stop_desc         TEXT,
    stop_lat          DOUBLE PRECISION,
    stop_lon          DOUBLE PRECISION,
    zone_id           TEXT,
    stop_url          TEXT,
    location_type     INT DEFAULT 0,
    parent_station    TEXT,
    stop_timezone     TEXT,
    wheelchair_boarding INT,
    loaded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (feed_version_id, stop_id)
);

-- Trips (GTFS trips.txt)
CREATE TABLE IF NOT EXISTS raw.trips (
    feed_version_id     INT NOT NULL REFERENCES cdc.feed_versions(feed_version_id),
    route_id            TEXT NOT NULL,
    service_id          TEXT NOT NULL,
    trip_id             TEXT NOT NULL,
    trip_headsign       TEXT,
    trip_short_name     TEXT,
    direction_id        INT,
    block_id            TEXT,
    shape_id            TEXT,
    wheelchair_accessible INT,
    bikes_allowed         INT,
    loaded_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (feed_version_id, trip_id)
);

-- Stop times (GTFS stop_times.txt)
CREATE TABLE IF NOT EXISTS raw.stop_times (
    feed_version_id   INT NOT NULL REFERENCES cdc.feed_versions(feed_version_id),
    trip_id           TEXT NOT NULL,
    arrival_time      TEXT,
    departure_time    TEXT,
    stop_id           TEXT NOT NULL,
    stop_sequence     INT NOT NULL,
    stop_headsign     TEXT,
    pickup_type       INT DEFAULT 0,
    drop_off_type     INT DEFAULT 0,
    shape_dist_traveled DOUBLE PRECISION,
    timepoint         INT,
    loaded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (feed_version_id, trip_id, stop_sequence)
);

-- Shapes (GTFS shapes.txt)
CREATE TABLE IF NOT EXISTS raw.shapes (
    feed_version_id       INT NOT NULL REFERENCES cdc.feed_versions(feed_version_id),
    shape_id              TEXT NOT NULL,
    shape_pt_lat          DOUBLE PRECISION NOT NULL,
    shape_pt_lon          DOUBLE PRECISION NOT NULL,
    shape_pt_sequence     INT NOT NULL,
    shape_dist_traveled   DOUBLE PRECISION,
    loaded_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (feed_version_id, shape_id, shape_pt_sequence)
);

-- Calendar (GTFS calendar.txt)
CREATE TABLE IF NOT EXISTS raw.calendar (
    feed_version_id   INT NOT NULL REFERENCES cdc.feed_versions(feed_version_id),
    service_id        TEXT NOT NULL,
    monday            BOOLEAN NOT NULL,
    tuesday           BOOLEAN NOT NULL,
    wednesday         BOOLEAN NOT NULL,
    thursday          BOOLEAN NOT NULL,
    friday            BOOLEAN NOT NULL,
    saturday          BOOLEAN NOT NULL,
    sunday            BOOLEAN NOT NULL,
    start_date        DATE NOT NULL,
    end_date          DATE NOT NULL,
    loaded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (feed_version_id, service_id)
);

-- Indexes for performance on join/filter columns
CREATE INDEX IF NOT EXISTS idx_routes_route_id ON raw.routes(route_id);
CREATE INDEX IF NOT EXISTS idx_stops_stop_id ON raw.stops(stop_id);
CREATE INDEX IF NOT EXISTS idx_trips_route_id ON raw.trips(route_id);
CREATE INDEX IF NOT EXISTS idx_trips_trip_id ON raw.trips(trip_id);
CREATE INDEX IF NOT EXISTS idx_trips_shape_id ON raw.trips(shape_id);
CREATE INDEX IF NOT EXISTS idx_stop_times_trip_id ON raw.stop_times(trip_id);
CREATE INDEX IF NOT EXISTS idx_stop_times_stop_id ON raw.stop_times(stop_id);
CREATE INDEX IF NOT EXISTS idx_shapes_shape_id ON raw.shapes(shape_id);
CREATE INDEX IF NOT EXISTS idx_calendar_service_id ON raw.calendar(service_id);
