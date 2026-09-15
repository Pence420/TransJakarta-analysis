import csv
from pathlib import Path
from typing import Any


def parse_gtfs_csv(file_path: Path) -> list[dict[str, Any]]:
    """Parse a GTFS CSV file and return list of dicts."""
    if not file_path.exists():
        print(f"File not found: {file_path}")
        return []

    rows = []
    with open(file_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cleaned = {k.strip(): v.strip() if v else None for k, v in row.items()}
            rows.append(cleaned)

    print(f"Parsed {len(rows)} rows from {file_path.name}")
    return rows


def parse_all_gtfs(extracted_dir: Path) -> dict[str, list[dict]]:
    """Parse all GTFS CSV files, return dict keyed by filename."""
    GTFS_FILES = [
        "routes.txt",
        "stops.txt",
        "trips.txt",
        "stop_times.txt",
        "shapes.txt",
        "calendar.txt",
    ]

    result = {}
    for filename in GTFS_FILES:
        csv_path = extracted_dir / filename
        result[filename] = parse_gtfs_csv(csv_path)

    return result


def cast_route(row: dict) -> tuple:
    """Cast route row values to correct types."""
    return (
        row.get("route_id"),
        row.get("agency_id"),
        row.get("route_short_name"),
        row.get("route_long_name"),
        row.get("route_desc"),
        int(row["route_type"]) if row.get("route_type") else None,
        row.get("route_url"),
        row.get("route_color"),
        row.get("route_text_color"),
    )


def cast_stop(row: dict) -> tuple:
    """Cast stop row values to correct types."""
    return (
        row.get("stop_id"),
        row.get("stop_code"),
        row.get("stop_name"),
        row.get("stop_desc"),
        float(row["stop_lat"]) if row.get("stop_lat") else None,
        float(row["stop_lon"]) if row.get("stop_lon") else None,
        row.get("zone_id"),
        row.get("stop_url"),
        int(row["location_type"]) if row.get("location_type") else 0,
        row.get("parent_station"),
        row.get("stop_timezone"),
        int(row["wheelchair_boarding"]) if row.get("wheelchair_boarding") else None,
    )


def cast_trip(row: dict) -> tuple:
    """Cast trip row values to correct types."""
    return (
        row.get("route_id"),
        row.get("service_id"),
        row.get("trip_id"),
        row.get("trip_headsign"),
        row.get("trip_short_name"),
        int(row["direction_id"]) if row.get("direction_id") else None,
        row.get("block_id"),
        row.get("shape_id"),
        int(row["wheelchair_accessible"]) if row.get("wheelchair_accessible") else None,
        int(row["bikes_allowed"]) if row.get("bikes_allowed") else None,
    )


def cast_stop_time(row: dict) -> tuple:
    """Cast stop_time row values to correct types."""
    return (
        row.get("trip_id"),
        row.get("arrival_time"),
        row.get("departure_time"),
        row.get("stop_id"),
        int(row["stop_sequence"]) if row.get("stop_sequence") else None,
        row.get("stop_headsign"),
        int(row["pickup_type"]) if row.get("pickup_type") else 0,
        int(row["drop_off_type"]) if row.get("drop_off_type") else 0,
        float(row["shape_dist_traveled"]) if row.get("shape_dist_traveled") else None,
        int(row["timepoint"]) if row.get("timepoint") else None,
    )


def cast_shape(row: dict) -> tuple:
    """Cast shape row values to correct types."""
    return (
        row.get("shape_id"),
        float(row["shape_pt_lat"]) if row.get("shape_pt_lat") else None,
        float(row["shape_pt_lon"]) if row.get("shape_pt_lon") else None,
        int(row["shape_pt_sequence"]) if row.get("shape_pt_sequence") else None,
        float(row["shape_dist_traveled"]) if row.get("shape_dist_traveled") else None,
    )


def cast_calendar(row: dict) -> tuple:
    """Cast calendar row values to correct types."""
    def to_bool(val):
        if val is None:
            return None
        return val.strip() == "1"

    return (
        row.get("service_id"),
        to_bool(row.get("monday")),
        to_bool(row.get("tuesday")),
        to_bool(row.get("wednesday")),
        to_bool(row.get("thursday")),
        to_bool(row.get("friday")),
        to_bool(row.get("saturday")),
        to_bool(row.get("sunday")),
        row.get("start_date"),
        row.get("end_date"),
    )
