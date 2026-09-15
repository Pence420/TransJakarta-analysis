-- ============================================================
-- Transjakarta GTFS Pipeline — CDC Change Log Tables
-- Run AFTER 04_setup_raw_tables.sql
-- ============================================================

-- Route changes between feed versions
CREATE TABLE IF NOT EXISTS cdc.route_changes (
    change_id         SERIAL PRIMARY KEY,
    feed_version_id   INT NOT NULL REFERENCES cdc.feed_versions(feed_version_id),
    prev_version_id   INT REFERENCES cdc.feed_versions(feed_version_id),
    route_id          TEXT NOT NULL,
    change_type       TEXT NOT NULL CHECK (change_type IN ('ADDED', 'REMOVED', 'MODIFIED')),
    field_changed     TEXT,
    old_value         TEXT,
    new_value         TEXT,
    detected_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stop changes between feed versions
CREATE TABLE IF NOT EXISTS cdc.stop_changes (
    change_id         SERIAL PRIMARY KEY,
    feed_version_id   INT NOT NULL REFERENCES cdc.feed_versions(feed_version_id),
    prev_version_id   INT REFERENCES cdc.feed_versions(feed_version_id),
    stop_id           TEXT NOT NULL,
    change_type       TEXT NOT NULL CHECK (change_type IN ('ADDED', 'REMOVED', 'MODIFIED')),
    field_changed     TEXT,
    old_value         TEXT,
    new_value         TEXT,
    detected_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schedule changes (trip-level) between feed versions
CREATE TABLE IF NOT EXISTS cdc.schedule_changes (
    change_id         SERIAL PRIMARY KEY,
    feed_version_id   INT NOT NULL REFERENCES cdc.feed_versions(feed_version_id),
    prev_version_id   INT REFERENCES cdc.feed_versions(feed_version_id),
    trip_id           TEXT NOT NULL,
    route_id          TEXT,
    change_type       TEXT NOT NULL CHECK (change_type IN ('ADDED', 'REMOVED', 'MODIFIED')),
    field_changed     TEXT,
    old_value         TEXT,
    new_value         TEXT,
    detected_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for CDC tables
CREATE INDEX IF NOT EXISTS idx_route_changes_version ON cdc.route_changes(feed_version_id);
CREATE INDEX IF NOT EXISTS idx_stop_changes_version ON cdc.stop_changes(feed_version_id);
CREATE INDEX IF NOT EXISTS idx_schedule_changes_version ON cdc.schedule_changes(feed_version_id);
CREATE INDEX IF NOT EXISTS idx_route_changes_route_id ON cdc.route_changes(route_id);
CREATE INDEX IF NOT EXISTS idx_stop_changes_stop_id ON cdc.stop_changes(stop_id);
CREATE INDEX IF NOT EXISTS idx_schedule_changes_trip_id ON cdc.schedule_changes(trip_id);
