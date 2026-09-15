#!/usr/bin/env python3
"""
Run Transform pipeline: staging -> marts.

Usage:
    python scripts/run_transform.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import psycopg2
from config import DB_CONFIG

TRANSFORM_DIR = Path(__file__).parent.parent / "transform"


def run_sql_file(conn, filepath: Path):
    """Execute a SQL file."""
    print(f"Running {filepath.name} ...")
    with conn.cursor() as cur:
        cur.execute(filepath.read_text())
    conn.commit()
    print(f"  Done: {filepath.name}")


def run():
    print("=" * 60)
    print("Transform Pipeline: raw -> staging -> marts")
    print("=" * 60)

    conn = psycopg2.connect(**DB_CONFIG)
    try:
        run_sql_file(conn, TRANSFORM_DIR / "01_staging.sql")
        run_sql_file(conn, TRANSFORM_DIR / "02_marts.sql")

        # Quick stats
        with conn.cursor() as cur:
            for schema in ["staging", "marts"]:
                cur.execute(f"""
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = '{schema}'
                    ORDER BY table_name
                """)
                tables = [r[0] for r in cur.fetchall()]
                print(f"\n{schema} tables: {', '.join(tables)}")

                for table in tables:
                    cur.execute(f"SELECT COUNT(*) FROM {schema}.{table}")
                    count = cur.fetchone()[0]
                    print(f"  {schema}.{table}: {count:,} rows")

        print("\n" + "=" * 60)
        print("Transform complete!")
        print("=" * 60)
    finally:
        conn.close()


if __name__ == "__main__":
    run()
