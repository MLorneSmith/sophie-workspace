#!/usr/bin/env python3
"""
Process Neo Loop Spawn Queue — Reads spawn-queue.jsonl and outputs
the spawn commands for Sophie to execute. This is meant to be called
by Sophie (or a cron job) to actually trigger the sub-agent spawns.

This script does NOT spawn agents itself — it formats the queue into
a notification for Sophie's session.

Usage:
    python3 process-spawn-queue.py          # Print pending spawns
    python3 process-spawn-queue.py --clear  # Print and clear queue
"""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

SPAWN_QUEUE = Path.home() / "clawd" / "state" / "neo-loop" / "spawn-queue.jsonl"
ARCHIVE_DIR = Path.home() / "clawd" / "state" / "neo-loop" / "archive"


def main():
    clear = "--clear" in sys.argv

    if not SPAWN_QUEUE.exists() or SPAWN_QUEUE.stat().st_size == 0:
        print("No pending spawn requests.")
        return

    requests = []
    with open(SPAWN_QUEUE) as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    requests.append(json.loads(line))
                except json.JSONDecodeError:
                    continue

    if not requests:
        print("No pending spawn requests.")
        return

    print(f"🤖 {len(requests)} Neo spawn request(s) pending:\n")
    for i, req in enumerate(requests, 1):
        print(f"--- Request {i} ---")
        print(f"Label: {req.get('label')}")
        print(f"PR: #{req.get('pr_number')}")
        print(f"Type: {req.get('task_type')}")
        print(f"Model: {req.get('model')}")
        print(f"Timeout: {req.get('timeout_seconds')}s")
        print(f"Requested: {req.get('requested_at')}")
        print(f"Task (first 200 chars): {req.get('task', '')[:200]}...")
        print()

    if clear:
        # Archive before clearing
        ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)
        ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
        archive_path = ARCHIVE_DIR / f"spawn-queue-{ts}.jsonl"
        SPAWN_QUEUE.rename(archive_path)
        print(f"Queue archived to {archive_path}")


if __name__ == "__main__":
    main()
