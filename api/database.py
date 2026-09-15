import os
from contextlib import contextmanager

import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("PGHOST", "localhost"),
    "port": int(os.getenv("PGPORT", 5432)),
    "dbname": os.getenv("PGDATABASE", "transjakarta_gtfs"),
    "user": os.getenv("PGAPI_USER", "dashboard_reader"),
    "password": os.getenv("PGAPI_PASSWORD", "dashboard_reader_change_me"),
}


def get_db():
    """Get a read-only database connection."""
    conn = psycopg2.connect(**DB_CONFIG)
    conn.set_session(readonly=True, autocommit=True)
    try:
        yield conn
    finally:
        conn.close()


@contextmanager
def get_db_context():
    """Context manager for database connection."""
    conn = psycopg2.connect(**DB_CONFIG)
    conn.set_session(readonly=True, autocommit=True)
    try:
        yield conn
    finally:
        conn.close()
