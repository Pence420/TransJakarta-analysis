import psycopg2

from config import DB_CONFIG


def get_connection():
    return psycopg2.connect(**DB_CONFIG)


def get_latest_two_versions(conn) -> tuple[int | None, int | None]:
    """Return (latest_version_id, previous_version_id). None if not enough versions."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT feed_version_id
            FROM cdc.feed_versions
            ORDER BY feed_version_id DESC
            LIMIT 2
        """)
        rows = cur.fetchall()
        if len(rows) < 2:
            return (rows[0][0] if rows else None, None)
        return (rows[0][0], rows[1][0])


def diff_routes(conn, new_ver: int, old_ver: int) -> int:
    """Compare routes between two feed versions, log changes. Returns change count."""
    changes = []
    with conn.cursor() as cur:
        # ADDED routes (in new, not in old)
        cur.execute("""
            SELECT route_id FROM raw.routes
            WHERE feed_version_id = %s
            AND route_id NOT IN (
                SELECT route_id FROM raw.routes WHERE feed_version_id = %s
            )
        """, (new_ver, old_ver))
        for (route_id,) in cur.fetchall():
            changes.append((new_ver, old_ver, route_id, 'ADDED', None, None, None))

        # REMOVED routes (in old, not in new)
        cur.execute("""
            SELECT route_id FROM raw.routes
            WHERE feed_version_id = %s
            AND route_id NOT IN (
                SELECT route_id FROM raw.routes WHERE feed_version_id = %s
            )
        """, (old_ver, new_ver))
        for (route_id,) in cur.fetchall():
            changes.append((new_ver, old_ver, route_id, 'REMOVED', None, None, None))

        # MODIFIED routes (exist in both, but fields changed)
        MODIFIABLE_FIELDS = [
            'route_short_name', 'route_long_name', 'route_desc',
            'route_type', 'route_url', 'route_color', 'route_text_color',
        ]
        cur.execute("""
            SELECT n.route_id
            FROM raw.routes n
            JOIN raw.routes o ON n.route_id = o.route_id
            WHERE n.feed_version_id = %s AND o.feed_version_id = %s
        """, (new_ver, old_ver))
        route_ids = [r[0] for r in cur.fetchall()]

        for route_id in route_ids:
            for field in MODIFIABLE_FIELDS:
                cur.execute(f"""
                    SELECT {field} FROM raw.routes
                    WHERE feed_version_id = %s AND route_id = %s
                """, (new_ver, route_id))
                new_val = cur.fetchone()[0]

                cur.execute(f"""
                    SELECT {field} FROM raw.routes
                    WHERE feed_version_id = %s AND route_id = %s
                """, (old_ver, route_id))
                old_val = cur.fetchone()[0]

                if str(new_val) != str(old_val):
                    changes.append((
                        new_ver, old_ver, route_id, 'MODIFIED',
                        field, str(old_val), str(new_val)
                    ))

    if changes:
        with conn.cursor() as cur:
            psycopg2.extras.execute_values(cur, """
                INSERT INTO cdc.route_changes
                    (feed_version_id, prev_version_id, route_id, change_type,
                     field_changed, old_value, new_value)
                VALUES %s
            """, changes, page_size=1000)
        conn.commit()
        print(f"  Route changes: {len(changes)}")
    return len(changes)


def diff_stops(conn, new_ver: int, old_ver: int) -> int:
    """Compare stops between two feed versions, log changes."""
    changes = []
    with conn.cursor() as cur:
        # ADDED
        cur.execute("""
            SELECT stop_id FROM raw.stops
            WHERE feed_version_id = %s
            AND stop_id NOT IN (
                SELECT stop_id FROM raw.stops WHERE feed_version_id = %s
            )
        """, (new_ver, old_ver))
        for (stop_id,) in cur.fetchall():
            changes.append((new_ver, old_ver, stop_id, 'ADDED', None, None, None))

        # REMOVED
        cur.execute("""
            SELECT stop_id FROM raw.stops
            WHERE feed_version_id = %s
            AND stop_id NOT IN (
                SELECT stop_id FROM raw.stops WHERE feed_version_id = %s
            )
        """, (old_ver, new_ver))
        for (stop_id,) in cur.fetchall():
            changes.append((new_ver, old_ver, stop_id, 'REMOVED', None, None, None))

        # MODIFIED
        MODIFIABLE_FIELDS = [
            'stop_name', 'stop_desc', 'stop_lat', 'stop_lon',
            'zone_id', 'location_type', 'parent_station',
        ]
        cur.execute("""
            SELECT n.stop_id
            FROM raw.stops n
            JOIN raw.stops o ON n.stop_id = o.stop_id
            WHERE n.feed_version_id = %s AND o.feed_version_id = %s
        """, (new_ver, old_ver))
        stop_ids = [r[0] for r in cur.fetchall()]

        for stop_id in stop_ids:
            for field in MODIFIABLE_FIELDS:
                cur.execute(f"""
                    SELECT {field} FROM raw.stops
                    WHERE feed_version_id = %s AND stop_id = %s
                """, (new_ver, stop_id))
                new_val = cur.fetchone()[0]

                cur.execute(f"""
                    SELECT {field} FROM raw.stops
                    WHERE feed_version_id = %s AND stop_id = %s
                """, (old_ver, stop_id))
                old_val = cur.fetchone()[0]

                if str(new_val) != str(old_val):
                    changes.append((
                        new_ver, old_ver, stop_id, 'MODIFIED',
                        field, str(old_val), str(new_val)
                    ))

    if changes:
        with conn.cursor() as cur:
            psycopg2.extras.execute_values(cur, """
                INSERT INTO cdc.stop_changes
                    (feed_version_id, prev_version_id, stop_id, change_type,
                     field_changed, old_value, new_value)
                VALUES %s
            """, changes, page_size=1000)
        conn.commit()
        print(f"  Stop changes: {len(changes)}")
    return len(changes)


def diff_schedules(conn, new_ver: int, old_ver: int) -> int:
    """Compare trips/schedules between two feed versions, log changes."""
    import psycopg2.extras
    changes = []
    with conn.cursor() as cur:
        # ADDED trips
        cur.execute("""
            SELECT trip_id, route_id FROM raw.trips
            WHERE feed_version_id = %s
            AND trip_id NOT IN (
                SELECT trip_id FROM raw.trips WHERE feed_version_id = %s
            )
        """, (new_ver, old_ver))
        for trip_id, route_id in cur.fetchall():
            changes.append((new_ver, old_ver, trip_id, route_id, 'ADDED', None, None, None))

        # REMOVED trips
        cur.execute("""
            SELECT trip_id, route_id FROM raw.trips
            WHERE feed_version_id = %s
            AND trip_id NOT IN (
                SELECT trip_id FROM raw.trips WHERE feed_version_id = %s
            )
        """, (old_ver, new_ver))
        for trip_id, route_id in cur.fetchall():
            changes.append((new_ver, old_ver, trip_id, route_id, 'REMOVED', None, None, None))

        # MODIFIED trips
        MODIFIABLE_FIELDS = ['route_id', 'service_id', 'trip_headsign', 'direction_id', 'shape_id']
        cur.execute("""
            SELECT n.trip_id
            FROM raw.trips n
            JOIN raw.trips o ON n.trip_id = o.trip_id
            WHERE n.feed_version_id = %s AND o.feed_version_id = %s
        """, (new_ver, old_ver))
        trip_ids = [r[0] for r in cur.fetchall()]

        for trip_id in trip_ids:
            for field in MODIFIABLE_FIELDS:
                cur.execute(f"""
                    SELECT {field} FROM raw.trips
                    WHERE feed_version_id = %s AND trip_id = %s
                """, (new_ver, trip_id))
                new_val = cur.fetchone()[0]

                cur.execute(f"""
                    SELECT {field} FROM raw.trips
                    WHERE feed_version_id = %s AND trip_id = %s
                """, (old_ver, trip_id))
                old_val = cur.fetchone()[0]

                if str(new_val) != str(old_val):
                    # Get route_id from new version
                    cur.execute("""
                        SELECT route_id FROM raw.trips
                        WHERE feed_version_id = %s AND trip_id = %s
                    """, (new_ver, trip_id))
                    route_row = cur.fetchone()
                    route_id = route_row[0] if route_row else None

                    changes.append((
                        new_ver, old_ver, trip_id, route_id, 'MODIFIED',
                        field, str(old_val), str(new_val)
                    ))

    if changes:
        with conn.cursor() as cur:
            psycopg2.extras.execute_values(cur, """
                INSERT INTO cdc.schedule_changes
                    (feed_version_id, prev_version_id, trip_id, route_id,
                     change_type, field_changed, old_value, new_value)
                VALUES %s
            """, changes, page_size=5000)
        conn.commit()
        print(f"  Schedule changes: {len(changes)}")
    return len(changes)


def run_full_diff():
    """Run diff for all entity types between the two latest feed versions."""
    print("=" * 60)
    print("CDC Diff Engine")
    print("=" * 60)

    conn = get_connection()
    try:
        new_ver, old_ver = get_latest_two_versions(conn)

        if new_ver is None:
            print("No feed versions found. Run extract & load first.")
            return
        if old_ver is None:
            print(f"Only one feed version ({new_ver}). Need at least 2 for diff.")
            return

        print(f"\nComparing version {old_ver} -> {new_ver}")

        total = 0
        total += diff_routes(conn, new_ver, old_ver)
        total += diff_stops(conn, new_ver, old_ver)
        total += diff_schedules(conn, new_ver, old_ver)

        print(f"\nTotal changes detected: {total}")
        print("=" * 60)
    finally:
        conn.close()
