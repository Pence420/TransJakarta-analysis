from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, Field


Longitude = Annotated[float, Field(ge=-180, le=180)]
Latitude = Annotated[float, Field(ge=-90, le=90)]
RouteCoordinate = tuple[Longitude, Latitude]


class RouteResponse(BaseModel):
    route_id: str
    agency_id: str | None
    route_short_name: str | None
    route_long_name: str | None
    route_desc: str | None
    route_type: int | None
    route_url: str | None
    route_color: str | None
    route_text_color: str | None


class StopResponse(BaseModel):
    stop_id: str
    stop_code: str | None
    stop_name: str | None
    stop_desc: str | None
    stop_lat: float | None
    stop_lon: float | None
    zone_id: str | None
    location_type: int | None
    parent_station: str | None


class RouteShapeResponse(BaseModel):
    route_id: str
    shape_id: str | None
    coordinates: list[RouteCoordinate]


class RouteMapShape(BaseModel):
    shape_id: str
    direction_id: int | None
    coordinates: list[RouteCoordinate]


class RouteMapStop(BaseModel):
    stop_id: str
    stop_code: str | None
    stop_name: str | None
    stop_lat: float
    stop_lon: float
    location_type: int | None


class RouteMapDataResponse(BaseModel):
    route_id: str
    shapes: list[RouteMapShape]
    stops: list[RouteMapStop]


class CoverageResponse(BaseModel):
    zone_id: str
    total_stops: int
    unique_stations: int


class HeadwayResponse(BaseModel):
    route_id: str
    route_short_name: str | None
    route_long_name: str | None
    service_hour: int
    avg_headway_minutes: float
    min_headway_minutes: float
    max_headway_minutes: float
    trip_pairs_count: int


class ServiceSpanResponse(BaseModel):
    route_id: str
    route_short_name: str | None
    route_long_name: str | None
    first_departure: str | None
    last_departure: str | None
    service_hours: float | None
    unique_departure_times: int


class FeedVersionResponse(BaseModel):
    feed_version_id: int
    fetch_timestamp: datetime
    file_hash: str
    file_size_bytes: int | None


class RouteChangeResponse(BaseModel):
    change_id: int
    feed_version_id: int
    prev_version_id: int | None
    route_id: str
    change_type: str
    field_changed: str | None
    old_value: str | None
    new_value: str | None
    detected_at: str


class StopChangeResponse(BaseModel):
    change_id: int
    feed_version_id: int
    prev_version_id: int | None
    stop_id: str
    change_type: str
    field_changed: str | None
    old_value: str | None
    new_value: str | None
    detected_at: str


class ScheduleChangeResponse(BaseModel):
    change_id: int
    feed_version_id: int
    prev_version_id: int | None
    trip_id: str
    route_id: str | None
    change_type: str
    field_changed: str | None
    old_value: str | None
    new_value: str | None
    detected_at: str


class PaginatedResponse(BaseModel):
    data: list
    total: int
    limit: int
    offset: int
