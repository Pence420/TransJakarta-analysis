-- ============================================================
-- Transjakarta GTFS Pipeline — Database Setup
-- Run this FIRST as a Postgres superuser
-- ============================================================

-- Create database
CREATE DATABASE transjakarta_gtfs;

-- Connect to the database, then enable PostGIS
\connect transjakarta_gtfs;

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Verify PostGIS is working
SELECT PostGIS_Full_Version();
