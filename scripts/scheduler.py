#!/usr/bin/env python3
"""
Simple scheduler: run pipeline on a cron-like schedule.

Usage:
    # Run daily at 06:00 UTC
    python scripts/scheduler.py --cron "0 6 * * *"

    # Run every 6 hours
    python scripts/scheduler.py --interval 6

    # Run once now (same as run_pipeline.py)
    python scripts/scheduler.py --once
"""

import argparse
import logging
import signal
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.run_pipeline import run_pipeline

LOG_DIR = Path(__file__).parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)

running = True


def signal_handler(sig, frame):
    global running
    logging.info("Received shutdown signal, stopping...")
    running = False


signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)


def parse_cron(expr: str) -> dict:
    """Parse simple cron expression (minute hour day month weekday)."""
    parts = expr.strip().split()
    if len(parts) != 5:
        raise ValueError(f"Invalid cron expression: {expr}")
    return {
        "minute": parts[0],
        "hour": parts[1],
        "day": parts[2],
        "month": parts[3],
        "weekday": parts[4],
    }


def matches_cron(now: datetime, cron: dict) -> bool:
    """Check if current time matches cron expression. Supports * and numbers."""
    checks = [
        (now.minute, cron["minute"]),
        (now.hour, cron["hour"]),
        (now.day, cron["day"]),
        (now.month, cron["month"]),
        (now.weekday(), cron["weekday"]),
    ]
    for current, pattern in checks:
        if pattern != "*" and int(pattern) != current:
            return False
    return True


def run_scheduler(cron_expr: str | None = None, interval_hours: int | None = None):
    """Run the scheduler loop."""
    logging.info("=" * 60)
    logging.info("Transjakarta GTFS Pipeline Scheduler")
    if cron_expr:
        logging.info(f"Schedule: cron '{cron_expr}'")
    elif interval_hours:
        logging.info(f"Schedule: every {interval_hours} hours")
    logging.info("=" * 60)

    last_run_date = None

    while running:
        now = datetime.now(timezone.utc)

        should_run = False
        if cron_expr:
            cron = parse_cron(cron_expr)
            if matches_cron(now, cron):
                if last_run_date != now.date():
                    should_run = True
                    last_run_date = now.date()
        elif interval_hours:
            # Simple: check if enough time has passed
            # (In production, track last_run timestamp in DB)
            if now.hour % interval_hours == 0 and now.minute == 0:
                if last_run_date != now.date() or now.hour != last_run_hour if 'last_run_hour' in dir() else True:
                    should_run = True
                    last_run_hour = now.hour

        if should_run:
            logging.info(f"\nScheduled run triggered at {now.isoformat()}")
            try:
                run_pipeline()
            except Exception as e:
                logging.error(f"Pipeline failed: {e}")

        # Sleep for 60 seconds before checking again
        time.sleep(60)

    logging.info("Scheduler stopped.")


def main():
    parser = argparse.ArgumentParser(description="Schedule Transjakarta GTFS pipeline")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--cron", help="Cron expression (e.g., '0 6 * * *')")
    group.add_argument("--interval", type=int, help="Run every N hours")
    group.add_argument("--once", action="store_true", help="Run once now")
    args = parser.parse_args()

    log_file = LOG_DIR / f"scheduler_{datetime.now(timezone.utc).strftime('%Y%m%d')}.log"
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler(sys.stdout),
        ],
    )

    if args.once:
        run_pipeline()
    else:
        run_scheduler(cron_expr=args.cron, interval_hours=args.interval)


if __name__ == "__main__":
    main()
