import psycopg2
import psycopg2.extras

from config import DB_CONFIG


def get_connection():
    """Get a Postgres connection using etl_writer role."""
    return psycopg2.connect(**DB_CONFIG)


def register_feed_version(conn, file_hash: str, file_size_bytes: int) -> int:
    """Insert a new feed version and return its ID."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO cdc.feed_versions (file_hash, file_size_bytes)
            VALUES (%s, %s)
            RETURNING feed_version_id
            """,
            (file_hash, file_size_bytes),
        )
        version_id = cur.fetchone()[0]
        conn.commit()
        print(f"Registered feed version {version_id}")
        return version_id


def upsert_routes(conn, version_id: int, rows: list[tuple]):
    """Upsert routes into raw.routes."""
    with conn.cursor() as cur:
        psycopg2.extras.execute_values(
            cur,
            """
            INSERT INTO raw.routes (
                feed_version_id, route_id, agency_id, route_short_name,
                route_long_name, route_desc, route_type, route_url,
                route_color, route_text_color
            ) VALUES %s
            ON CONFLICT (feed_version_id, route_id) DO UPDATE SET
                agency_id = EXCLUDED.agency_id,
                route_short_name = EXCLUDED.route_short_name,
                route_long_name = EXCLUDED.route_long_name,
                route_desc = EXCLUDED.route_desc,
                route_type = EXCLUDED.route_type,
                route_url = EXCLUDED.route_url,
                route_color = EXCLUDED.route_color,
                route_text_color = EXCLUDED.route_text_color,
                loaded_at = NOW()
            """,
            [(version_id,) + row for row in rows],
            page_size=1000,
        )
        conn.commit()
        print(f"Upserted {len(rows)} routes")


def upsert_stops(conn, version_id: int, rows: list[tuple]):
    """Upsert stops into raw.stops."""
    with conn.cursor() as cur:
        psycopg2.extras.execute_values(
            cur,
            """
            INSERT INTO raw.stops (
                feed_version_id, stop_id, stop_code, stop_name, stop_desc,
                stop_lat, stop_lon, zone_id, stop_url, location_type,
                parent_station, stop_timezone, wheelchair_boarding
            ) VALUES %s
            ON CONFLICT (feed_version_id, stop_id) DO UPDATE SET
                stop_code = EXCLUDED.stop_code,
                stop_name = EXCLUDED.stop_name,
                stop_desc = EXCLUDED.stop_desc,
                stop_lat = EXCLUDED.stop_lat,
                stop_lon = EXCLUDED.stop_lon,
                zone_id = EXCLUDED.zone_id,
                stop_url = EXCLUDED.stop_url,
                location_type = EXCLUDED.location_type,
                parent_station = EXCLUDED.parent_station,
                stop_timezone = EXCLUDED.stop_timezone,
                wheelchair_boarding = EXCLUDED.wheelchair_boarding,
                loaded_at = NOW()
            """,
            [(version_id,) + row for row in rows],
            page_size=1000,
        )
        conn.commit()
        print(f"Upserted {len(rows)} stops")


def upsert_trips(conn, version_id: int, rows: list[tuple]):
    """Upsert trips into raw.trips."""
    with conn.cursor() as cur:
        psycopg2.extras.execute_values(
            cur,
            """
            INSERT INTO raw.trips (
                feed_version_id, route_id, service_id, trip_id,
                trip_headsign, trip_short_name, direction_id, block_id,
                shape_id, wheelchair_accessible, bikes_allowed
            ) VALUES %s
            ON CONFLICT (feed_version_id, trip_id) DO UPDATE SET
                route_id = EXCLUDED.route_id,
                service_id = EXCLUDED.service_id,
                trip_headsign = EXCLUDED.trip_headsign,
                trip_short_name = EXCLUDED.trip_short_name,
                direction_id = EXCLUDED.direction_id,
                block_id = EXCLUDED.block_id,
                shape_id = EXCLUDED.shape_id,
                wheelchair_accessible = EXCLUDED.wheelchair_accessible,
                bikes_allowed = EXCLUDED.bikes_allowed,
                loaded_at = NOW()
            """,
            [(version_id,) + row for row in rows],
            page_size=1000,
        )
        conn.commit()
        print(f"Upserted {len(rows)} trips")


def upsert_stop_times(conn, version_id: int, rows: list[tuple]):
    """Upsert stop_times into raw.stop_times."""
    with conn.cursor() as cur:
        psycopg2.extras.execute_values(
            cur,
            """
            INSERT INTO raw.stop_times (
                feed_version_id, trip_id, arrival_time, departure_time,
                stop_id, stop_sequence, stop_headsign, pickup_type,
                drop_off_type, shape_dist_traveled, timepoint
            ) VALUES %s
            ON CONFLICT (feed_version_id, trip_id, stop_sequence) DO UPDATE SET
                arrival_time = EXCLUDED.arrival_time,
                departure_time = EXCLUDED.departure_time,
                stop_id = EXCLUDED.stop_id,
                stop_headsign = EXCLUDED.stop_headsign,
                pickup_type = EXCLUDED.pickup_type,
                drop_off_type = EXCLUDED.drop_off_type,
                shape_dist_traveled = EXCLUDED.shape_dist_traveled,
                timepoint = EXCLUDED.timepoint,
                loaded_at = NOW()
            """,
            [(version_id,) + row for row in rows],
            page_size=5000,
        )
        conn.commit()
        print(f"Upserted {len(rows)} stop_times")


def upsert_shapes(conn, version_id: int, rows: list[tuple]):
    """Upsert shapes into raw.shapes."""
    with conn.cursor() as cur:
        psycopg2.extras.execute_values(
            cur,
            """
            INSERT INTO raw.shapes (
                feed_version_id, shape_id, shape_pt_lat, shape_pt_lon,
                shape_pt_sequence, shape_dist_traveled
            ) VALUES %s
            ON CONFLICT (feed_version_id, shape_id, shape_pt_sequence) DO UPDATE SET
                shape_pt_lat = EXCLUDED.shape_pt_lat,
                shape_pt_lon = EXCLUDED.shape_pt_lon,
                shape_dist_traveled = EXCLUDED.shape_dist_traveled,
                loaded_at = NOW()
            """,
            [(version_id,) + row for row in rows],
            page_size=5000,
        )
        conn.commit()
        print(f"Upserted {len(rows)} shapes")


def upsert_calendar(conn, version_id: int, rows: list[tuple]):
    """Upsert calendar into raw.calendar."""
    with conn.cursor() as cur:
        psycopg2.extras.execute_values(
            cur,
            """
            INSERT INTO raw.calendar (
                feed_version_id, service_id, monday, tuesday, wednesday,
                thursday, friday, saturday, sunday, start_date, end_date
            ) VALUES %s
            ON CONFLICT (feed_version_id, service_id) DO UPDATE SET
                monday = EXCLUDED.monday,
                tuesday = EXCLUDED.tuesday,
                wednesday = EXCLUDED.wednesday,
                thursday = EXCLUDED.thursday,
                friday = EXCLUDED.friday,
                saturday = EXCLUDED.saturday,
                sunday = EXCLUDED.sunday,
                start_date = EXCLUDED.start_date,
                end_date = EXCLUDED.end_date,
                loaded_at = NOW()
            """,
            [(version_id,) + row for row in rows],
            page_size=1000,
        )
        conn.commit()
        print(f"Upserted {len(rows)} calendar entries")
