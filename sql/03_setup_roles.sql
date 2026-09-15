-- ============================================================
-- Transjakarta GTFS Pipeline — Role Setup
-- Run AFTER 02_setup_schemas.sql
-- ============================================================

-- ETL writer: can write to raw, cdc, staging; read-only on marts
CREATE ROLE etl_writer LOGIN PASSWORD 'etl_writer_change_me';

GRANT USAGE ON SCHEMA raw TO etl_writer;
GRANT USAGE ON SCHEMA cdc TO etl_writer;
GRANT USAGE ON SCHEMA staging TO etl_writer;
GRANT USAGE ON SCHEMA marts TO etl_writer;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA raw TO etl_writer;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cdc TO etl_writer;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA staging TO etl_writer;
GRANT SELECT ON ALL TABLES IN SCHEMA marts TO etl_writer;

ALTER DEFAULT PRIVILEGES IN SCHEMA raw
    GRANT ALL ON TABLES TO etl_writer;
ALTER DEFAULT PRIVILEGES IN SCHEMA cdc
    GRANT ALL ON TABLES TO etl_writer;
ALTER DEFAULT PRIVILEGES IN SCHEMA staging
    GRANT ALL ON TABLES TO etl_writer;
ALTER DEFAULT PRIVILEGES IN SCHEMA marts
    GRANT SELECT ON TABLES TO etl_writer;

-- Dashboard reader: read-only on marts only
CREATE ROLE dashboard_reader LOGIN PASSWORD 'dashboard_reader_change_me';

GRANT USAGE ON SCHEMA marts TO dashboard_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA marts TO dashboard_reader;

ALTER DEFAULT PRIVILEGES IN SCHEMA marts
    GRANT SELECT ON TABLES TO dashboard_reader;

-- NOTE: Change the passwords above before using in any real environment.
