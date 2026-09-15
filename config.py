import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("PGHOST", "localhost"),
    "port": int(os.getenv("PGPORT", 5432)),
    "dbname": os.getenv("PGDATABASE", "transjakarta_gtfs"),
    "user": os.getenv("PGUSER", "etl_writer"),
    "password": os.getenv("PGPASSWORD", ""),
}

GTFS_FEED_URL = os.getenv(
    "GTFS_FEED_URL",
    "https://transitland.com/api/v2/rest/datafeeds/f-transjakarta~id",
)
