import unittest
from contextlib import contextmanager
from unittest.mock import patch

from fastapi import HTTPException
from pydantic import ValidationError

from api.models import RouteMapShape
from api.routes import _validate_id, get_route_map_data


class FakeCursor:
    def __init__(self):
        self.queries: list[str] = []
        self.current_query = ""

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, traceback):
        return False

    def execute(self, query, params):
        self.current_query = query
        self.queries.append(query)

    def fetchall(self):
        if "JOIN staging.shapes" in self.current_query:
            return [
                ("JAK.01-0", 0, 106.81, -6.20),
                ("JAK.01-0", 0, 106.82, -6.21),
            ]
        return [
            ("STOP.01", "S01", "Jakarta Stop", -6.20, 106.81, 0),
        ]


class FakeConnection:
    def __init__(self):
        self.cursor_instance = FakeCursor()

    def cursor(self):
        return self.cursor_instance


class RouteApiTests(unittest.TestCase):
    def test_route_id_accepts_mikrotrans_period(self):
        self.assertEqual(_validate_id("JAK.01", "route_id"), "JAK.01")

    def test_route_id_rejects_unsafe_characters(self):
        with self.assertRaises(HTTPException) as raised:
            _validate_id("JAK.01' OR 1=1", "route_id")
        self.assertEqual(raised.exception.status_code, 422)

    def test_map_data_joins_shapes_to_active_feed_version(self):
        connection = FakeConnection()

        @contextmanager
        def fake_get_db():
            yield connection

        with patch("api.routes.get_db", fake_get_db):
            route_handler = getattr(get_route_map_data, "__wrapped__", get_route_map_data)
            response = route_handler(None, "JAK.01")

        shape_query = connection.cursor_instance.queries[0]
        self.assertIn("s.feed_version_id = ft.feed_version_id", shape_query)
        self.assertEqual(response.route_id, "JAK.01")
        self.assertEqual(len(response.shapes), 1)
        self.assertEqual(len(response.stops), 1)

    def test_route_coordinate_rejects_invalid_range(self):
        with self.assertRaises(ValidationError):
            RouteMapShape(
                shape_id="invalid",
                direction_id=0,
                coordinates=[(206.81, -6.20), (106.82, -6.21)],
            )


if __name__ == "__main__":
    unittest.main()
