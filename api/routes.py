from fastapi import APIRouter, HTTPException, Query
import psycopg2.extras

from api.database import get_db
from api.models import (
    CoverageResponse,
    FeedVersionResponse,
    HeadwayResponse,
    PaginatedResponse,
    RouteChangeResponse,
    RouteResponse,
    RouteShapeResponse,
    ScheduleChangeResponse,
    ServiceSpanResponse,
    StopChangeResponse,
    StopResponse,
)

router = APIRouter()

MAX_LIMIT = 1000


def paginate(query: str, params: list, limit: int, offset: int, conn) -> dict:
    """Helper to add pagination to a query."""
    with conn.cursor() as cur:
        # Count total
        count_query = f"SELECT COUNT(*) FROM ({query}) sub"
        cur.execute(count_query, params)
        total = cur.fetchone()[0]

        # Fetch page
        paged_query = f"{query} LIMIT %s OFFSET %s"
        cur.execute(paged_query, params + [limit, offset])
        rows = cur.fetchall()
        colnames = [desc[0] for desc in cur.description]

    return {"data": [dict(zip(colnames, row)) for row in rows], "total": total, "limit": limit, "offset": offset}


# ============================================================
# ROUTES
# ============================================================

@router.get("/routes", response_model=PaginatedResponse)
def list_routes(
    limit: int = Query(default=50, le=MAX_LIMIT),
    offset: int = Query(default=0, ge=0),
):
    """List all routes."""
    conn = next(get_db())
    try:
        result = paginate(
            "SELECT * FROM marts.dim_route ORDER BY route_id",
            [], limit, offset, conn,
        )
        return result
    finally:
        conn.close()


@router.get("/routes/{route_id}", response_model=RouteResponse)
def get_route(route_id: str):
    """Get a specific route by ID."""
    conn = next(get_db())
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM marts.dim_route WHERE route_id = %s", (route_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Route not found")
            colnames = [desc[0] for desc in cur.description]
            return dict(zip(colnames, row))
    finally:
        conn.close()


@router.get("/routes/{route_id}/shape", response_model=RouteShapeResponse)
def get_route_shape(route_id: str):
    """Get the shape geometry for a route."""
    conn = next(get_db())
    try:
        with conn.cursor() as cur:
            # Get shape_id from trips
            cur.execute("""
                SELECT DISTINCT shape_id FROM marts.fact_trip
                WHERE route_id = %s AND shape_id IS NOT NULL
                LIMIT 1
            """, (route_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="No shape found for this route")
            shape_id = row[0]

            # Get coordinates
            cur.execute("""
                SELECT shape_pt_lon, shape_pt_lat
                FROM staging.shapes
                WHERE shape_id = %s
                ORDER BY shape_pt_sequence
            """, (shape_id,))
            coords = [[r[0], r[1]] for r in cur.fetchall()]

            return RouteShapeResponse(
                route_id=route_id,
                shape_id=shape_id,
                coordinates=coords,
            )
    finally:
        conn.close()


# ============================================================
# STOPS
# ============================================================

@router.get("/stops", response_model=PaginatedResponse)
def list_stops(
    limit: int = Query(default=100, le=MAX_LIMIT),
    offset: int = Query(default=0, ge=0),
    zone_id: str | None = Query(default=None),
):
    """List all stops, optionally filtered by zone."""
    conn = next(get_db())
    try:
        query = "SELECT * FROM marts.dim_stop"
        params = []
        if zone_id:
            query += " WHERE zone_id = %s"
            params.append(zone_id)
        query += " ORDER BY stop_id"

        result = paginate(query, params, limit, offset, conn)
        return result
    finally:
        conn.close()


@router.get("/stops/{stop_id}", response_model=StopResponse)
def get_stop(stop_id: str):
    """Get a specific stop by ID."""
    conn = next(get_db())
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM marts.dim_stop WHERE stop_id = %s", (stop_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Stop not found")
            colnames = [desc[0] for desc in cur.description]
            data = dict(zip(colnames, row))
            # Remove geom from response (not serializable)
            data.pop("geom", None)
            data.pop("feed_version_id", None)
            data.pop("loaded_at", None)
            return data
    finally:
        conn.close()


# ============================================================
# ANALYTICS
# ============================================================

@router.get("/coverage", response_model=list[CoverageResponse])
def get_coverage():
    """Get stop coverage by zone."""
    conn = next(get_db())
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT zone_id, total_stops, unique_stations
                FROM marts.mart_coverage_by_area
                ORDER BY total_stops DESC
            """)
            colnames = [desc[0] for desc in cur.description]
            return [dict(zip(colnames, row)) for row in cur.fetchall()]
    finally:
        conn.close()


@router.get("/headway", response_model=list[HeadwayResponse])
def get_headway(
    route_id: str | None = Query(default=None),
):
    """Get headway data per route per hour."""
    conn = next(get_db())
    try:
        with conn.cursor() as cur:
            query = """
                SELECT route_id, route_short_name, route_long_name,
                       service_hour, avg_headway_minutes,
                       min_headway_minutes, max_headway_minutes,
                       trip_pairs_count
                FROM marts.mart_headway_by_route_hour
            """
            params = []
            if route_id:
                query += " WHERE route_id = %s"
                params.append(route_id)
            query += " ORDER BY route_id, service_hour"

            cur.execute(query, params)
            colnames = [desc[0] for desc in cur.description]
            return [dict(zip(colnames, row)) for row in cur.fetchall()]
    finally:
        conn.close()


@router.get("/service-span", response_model=list[ServiceSpanResponse])
def get_service_span():
    """Get service span (first/last departure) per route."""
    conn = next(get_db())
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT route_id, route_short_name, route_long_name,
                       first_departure, last_departure,
                       service_hours, unique_departure_times
                FROM marts.mart_service_span
                ORDER BY service_hours DESC
            """)
            colnames = [desc[0] for desc in cur.description]
            return [dict(zip(colnames, row)) for row in cur.fetchall()]
    finally:
        conn.close()


# ============================================================
# FEED VERSIONS & CHANGES
# ============================================================

@router.get("/feed-versions", response_model=list[FeedVersionResponse])
def list_feed_versions():
    """List all feed versions."""
    conn = next(get_db())
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT feed_version_id, fetch_timestamp, file_hash, file_size_bytes
                FROM marts.dim_feed_version
                ORDER BY feed_version_id DESC
            """)
            colnames = [desc[0] for desc in cur.description]
            return [dict(zip(colnames, row)) for row in cur.fetchall()]
    finally:
        conn.close()


@router.get("/feed-versions/{version_id}/changes")
def get_feed_version_changes(
    version_id: int,
    change_type: str | None = Query(default=None, description="Filter: ADDED, REMOVED, MODIFIED"),
):
    """Get all changes for a specific feed version."""
    conn = next(get_db())
    try:
        result = {"route_changes": [], "stop_changes": [], "schedule_changes": []}

        with conn.cursor() as cur:
            # Route changes
            query = "SELECT * FROM cdc.route_changes WHERE feed_version_id = %s"
            params = [version_id]
            if change_type:
                query += " AND change_type = %s"
                params.append(change_type)
            query += " ORDER BY detected_at DESC"
            cur.execute(query, params)
            colnames = [desc[0] for desc in cur.description]
            result["route_changes"] = [dict(zip(colnames, row)) for row in cur.fetchall()]

            # Stop changes
            query = "SELECT * FROM cdc.stop_changes WHERE feed_version_id = %s"
            params = [version_id]
            if change_type:
                query += " AND change_type = %s"
                params.append(change_type)
            query += " ORDER BY detected_at DESC"
            cur.execute(query, params)
            colnames = [desc[0] for desc in cur.description]
            result["stop_changes"] = [dict(zip(colnames, row)) for row in cur.fetchall()]

            # Schedule changes
            query = "SELECT * FROM cdc.schedule_changes WHERE feed_version_id = %s"
            params = [version_id]
            if change_type:
                query += " AND change_type = %s"
                params.append(change_type)
            query += " ORDER BY detected_at DESC"
            cur.execute(query, params)
            colnames = [desc[0] for desc in cur.description]
            result["schedule_changes"] = [dict(zip(colnames, row)) for row in cur.fetchall()]

        return result
    finally:
        conn.close()
