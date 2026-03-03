#!/usr/bin/env python3
"""
Cleanup stale active-runs locks.
Runs every 15 min via cron. Clears entries older than EXPIRE_MIN
with no matching running process.
"""

import json
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path

ACTIVE_RUNS = Path.home() / "clawd" / "state" / "neo-loop" / "active-runs.json"
ACTIVE_ACP = Path.home() / "clawd" / "state" / "neo-loop" / "active-acp.json"
EXPIRE_MIN = 45


def log(msg: str):
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"[{ts}] {msg}")


def is_pid_alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
        return True
    except (OSError, ProcessLookupError):
        return False


def cleanup_active_runs():
    if not ACTIVE_RUNS.exists():
        return
    try:
        with open(ACTIVE_RUNS) as f:
            runs = json.load(f)
    except (json.JSONDecodeError, IOError):
        return

    if not runs:
        return

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=EXPIRE_MIN)
    cleaned = 0

    to_remove = []
    for key, val in runs.items():
        started = val.get("started", "")
        try:
            started_dt = datetime.fromisoformat(started)
            if started_dt < cutoff:
                to_remove.append(key)
                cleaned += 1
        except (ValueError, TypeError):
            to_remove.append(key)
            cleaned += 1

    if to_remove:
        for key in to_remove:
            del runs[key]
            log(f"  Cleared stale lock: {key}")
        with open(ACTIVE_RUNS, "w") as f:
            json.dump(runs, f, indent=2)
        log(f"Cleaned {cleaned} stale locks from active-runs.json")


def cleanup_active_acp():
    """Clear stale active-acp.json if the PID is dead."""
    if not ACTIVE_ACP.exists():
        return
    try:
        with open(ACTIVE_ACP) as f:
            active = json.load(f)
    except (json.JSONDecodeError, IOError):
        return

    pid = active.get("pid")
    if pid and not is_pid_alive(pid):
        ACTIVE_ACP.unlink(missing_ok=True)
        log(f"  Cleared dead active-acp (pid {pid} not running)")


if __name__ == "__main__":
    cleanup_active_runs()
    cleanup_active_acp()
