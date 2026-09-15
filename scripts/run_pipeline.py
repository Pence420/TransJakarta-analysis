#!/usr/bin/env python3
"""
Pipeline orchestrator: runs Extract -> Load -> CDC Diff -> Transform in sequence.

Usage:
    python scripts/run_pipeline.py              # run full pipeline
    python scripts/run_pipeline.py --steps el   # run only extract+load
    python scripts/run_pipeline.py --steps c    # run only cdc diff
    python scripts/run_pipeline.py --steps t    # run only transform
"""

import argparse
import logging
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

LOG_DIR = Path(__file__).parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)


def setup_logging():
    """Setup logging to both file and console."""
    log_file = LOG_DIR / f"pipeline_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.log"

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler(sys.stdout),
        ],
    )
    return log_file


def step_extract_load():
    """Run extract & load step."""
    logging.info("STEP: Extract & Load")
    from scripts.run_extract_load import run
    run()


def step_cdc_diff():
    """Run CDC diff step."""
    logging.info("STEP: CDC Diff")
    from cdc.diff_engine import run_full_diff
    run_full_diff()


def step_transform():
    """Run transform step."""
    logging.info("STEP: Transform")
    from scripts.run_transform import run
    run()


PIPELINE_STEPS = {
    "el": ("Extract & Load", step_extract_load),
    "c": ("CDC Diff", step_cdc_diff),
    "t": ("Transform", step_transform),
}


def run_pipeline(steps: list[str] | None = None):
    """Run the full pipeline or selected steps."""
    log_file = setup_logging()

    logging.info("=" * 60)
    logging.info("Transjakarta GTFS Pipeline — Starting")
    logging.info(f"Log file: {log_file}")
    logging.info("=" * 60)

    if steps is None:
        steps = ["el", "c", "t"]

    start_time = time.time()
    results = {}

    for step_key in steps:
        if step_key not in PIPELINE_STEPS:
            logging.error(f"Unknown step: {step_key}")
            continue

        step_name, step_fn = PIPELINE_STEPS[step_key]
        logging.info(f"\n--- Running: {step_name} ---")
        step_start = time.time()

        try:
            step_fn()
            elapsed = time.time() - step_start
            results[step_name] = {"status": "SUCCESS", "elapsed": elapsed}
            logging.info(f"--- {step_name} completed in {elapsed:.1f}s ---")
        except Exception as e:
            elapsed = time.time() - step_start
            results[step_name] = {"status": "FAILED", "error": str(e), "elapsed": elapsed}
            logging.error(f"--- {step_name} FAILED after {elapsed:.1f}s ---")
            logging.error(f"Error: {e}")
            # Stop pipeline on failure (plan for failure — prinsip #2)
            logging.error("Stopping pipeline due to failure.")
            break

    total_elapsed = time.time() - start_time

    logging.info("\n" + "=" * 60)
    logging.info("Pipeline Summary")
    logging.info("=" * 60)
    for step_name, result in results.items():
        status = result["status"]
        elapsed = result["elapsed"]
        if status == "SUCCESS":
            logging.info(f"  {step_name}: {status} ({elapsed:.1f}s)")
        else:
            logging.error(f"  {step_name}: {status} ({elapsed:.1f}s) — {result.get('error', '')}")
    logging.info(f"\nTotal time: {total_elapsed:.1f}s")
    logging.info("=" * 60)

    return results


def main():
    parser = argparse.ArgumentParser(description="Run Transjakarta GTFS pipeline")
    parser.add_argument(
        "--steps",
        nargs="?",
        const="all",
        default="all",
        help="Steps to run: 'all', 'el' (extract+load), 'c' (cdc), 't' (transform), or combo like 'elc'",
    )
    args = parser.parse_args()

    if args.steps == "all":
        steps = None
    else:
        steps = list(args.steps)

    results = run_pipeline(steps)

    # Exit with error if any step failed
    if any(r["status"] == "FAILED" for r in results.values()):
        sys.exit(1)


if __name__ == "__main__":
    main()
