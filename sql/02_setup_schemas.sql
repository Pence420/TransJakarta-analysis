-- ============================================================
-- Transjakarta GTFS Pipeline — Schema Setup
-- Run AFTER 01_setup_database.sql
-- ============================================================

-- Raw layer: mirror GTFS structure + metadata columns
CREATE SCHEMA IF NOT EXISTS raw;

-- CDC layer: change tracking and feed version history
CREATE SCHEMA IF NOT EXISTS cdc;

-- Staging layer: cleaned & typed data
CREATE SCHEMA IF NOT EXISTS staging;

-- Marts layer: dimensional models for analytics
CREATE SCHEMA IF NOT EXISTS marts;
