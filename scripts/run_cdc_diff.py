#!/usr/bin/env python3
"""
Run CDC Diff Engine: compare latest two feed versions and log changes.

Usage:
    python scripts/run_cdc_diff.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from cdc.diff_engine import run_full_diff

if __name__ == "__main__":
    run_full_diff()
