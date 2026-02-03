#!/usr/bin/env python3
"""
Initialize .initiative-progress.json early in /alpha:implement runs.

Creates a minimal progress file if one does not exist, ensuring
PTY recovery can read a heartbeat even during startup.
"""
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

PROGRESS_FILE = Path(".initiative-progress.json")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--feature-id", dest="feature_id")
    parser.add_argument("--feature-title", dest="feature_title")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    if PROGRESS_FILE.exists() and not args.force:
        return

    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    progress = {
        "status": "in_progress",
        "phase": "starting",
        "completed_tasks": [],
        "failed_tasks": [],
        "context_usage_percent": 0,
        "last_heartbeat": now,
    }

    if args.feature_id:
        progress["feature"] = {"issue_number": args.feature_id}
        if args.feature_title:
            progress["feature"]["title"] = args.feature_title

    PROGRESS_FILE.write_text(json.dumps(progress, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
