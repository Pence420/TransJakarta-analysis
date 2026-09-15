import hashlib
import os
import zipfile
from pathlib import Path

import requests

EXTRACT_DIR = Path(__file__).parent.parent / "data" / "gtfs_raw"


def download_gtfs(url: str, dest_dir: Path = EXTRACT_DIR) -> Path:
    """Download GTFS zip from URL, return path to downloaded file."""
    dest_dir.mkdir(parents=True, exist_ok=True)
    zip_path = dest_dir / "gtfs_transjakarta.zip"

    print(f"Downloading GTFS from {url} ...")
    resp = requests.get(url, timeout=120)
    resp.raise_for_status()

    zip_path.write_bytes(resp.content)
    size_mb = len(resp.content) / (1024 * 1024)
    print(f"Downloaded {size_mb:.2f} MB -> {zip_path}")
    return zip_path


def compute_file_hash(file_path: Path) -> str:
    """Compute SHA256 hash of a file."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def unzip_gtfs(zip_path: Path, dest_dir: Path = EXTRACT_DIR) -> Path:
    """Unzip GTFS zip, return path to extracted directory."""
    extract_to = dest_dir / "gtfs_extracted"
    extract_to.mkdir(parents=True, exist_ok=True)

    print(f"Extracting {zip_path} -> {extract_to}")
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(extract_to)

    print(f"Extracted files: {list(extract_to.iterdir())}")
    return extract_to


def get_csv_path(extracted_dir: Path, filename: str) -> Path | None:
    """Get full path to a CSV file in extracted directory."""
    path = extracted_dir / filename
    return path if path.exists() else None


if __name__ == "__main__":
    from config import GTFS_FEED_URL

    zip_path = download_gtfs(GTFS_FEED_URL)
    file_hash = compute_file_hash(zip_path)
    print(f"File hash: {file_hash}")
    extracted = unzip_gtfs(zip_path)
    print(f"Extracted to: {extracted}")
