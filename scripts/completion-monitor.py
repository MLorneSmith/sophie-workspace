#!/usr/bin/env python3
"""
Completion Monitor - Notifies Sophie when sub-agents complete tasks.

Scans ~/clawd/state/completions/ for new completion files, writes to
notification file (checked by Sophie during heartbeats), then archives.

Usage:
    python3 completion-monitor.py [--dry-run]

Cron: Every 2 minutes
"""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

# Paths
COMPLETIONS_DIR = Path.home() / "clawd" / "state" / "completions"
PROCESSED_DIR = COMPLETIONS_DIR / "processed"
STATE_FILE = Path.home() / "clawd" / "state" / "completion-monitor-state.json"
NOTIFICATIONS_FILE = Path.home() / "clawd" / "state" / "notifications.jsonl"


def load_state():
    """Load last check timestamp."""
    if STATE_FILE.exists():
        with open(STATE_FILE) as f:
            return json.load(f)
    return {"last_check": None, "processed_files": []}


def save_state(state):
    """Save state."""
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


def get_new_completions(state):
    """Get completion files that haven't been processed."""
    if not COMPLETIONS_DIR.exists():
        return []
    
    completions = []
    for f in COMPLETIONS_DIR.glob("*.json"):
        if f.name in state.get("processed_files", []):
            continue
        if f.is_file():
            try:
                with open(f) as fp:
                    data = json.load(fp)
                completions.append((f, data))
            except (json.JSONDecodeError, IOError) as e:
                print(f"Error reading {f}: {e}")
    return completions


def format_notification(completion):
    """Format a completion as a notification message."""
    agent = completion.get("agent", "unknown")
    task = completion.get("task", "unknown task")
    status = completion.get("status", "unknown")
    result = completion.get("result", "")
    timestamp = completion.get("timestamp", "")
    runtime = completion.get("runtime_seconds", "")
    
    status_emoji = "✅" if status == "done" else "❌" if status == "error" else "⏳"
    
    msg = f"[Sub-agent Complete] {status_emoji} **{agent}** - {status}\n"
    msg += f"**Task:** {task}\n"
    if result:
        msg += f"**Result:** {result}\n"
    if runtime:
        msg += f"**Runtime:** {runtime}s\n"
    if timestamp:
        msg += f"**Time:** {timestamp}"
    
    return msg


def send_to_sophie(message, dry_run=False):
    """Write notification to a file that Sophie checks during heartbeats."""
    if dry_run:
        print(f"[DRY RUN] Would send: {message[:100]}...")
        return True
    
    # Write to notification file (checked by Sophie during heartbeats)
    NOTIFICATIONS_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    notification = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "message": message
    }
    
    try:
        with open(NOTIFICATIONS_FILE, "a") as f:
            f.write(json.dumps(notification) + "\n")
        return True
    except Exception as e:
        print(f"Failed to write notification: {e}")
        return False


def archive_completion(filepath, dry_run=False):
    """Move processed completion to archive."""
    if dry_run:
        print(f"[DRY RUN] Would archive: {filepath.name}")
        return
    
    dest = PROCESSED_DIR / filepath.name
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    filepath.rename(dest)


def main():
    dry_run = "--dry-run" in sys.argv
    
    print(f"Completion monitor running (dry_run={dry_run})")
    
    # Load state
    state = load_state()
    
    # Get new completions
    completions = get_new_completions(state)
    
    if not completions:
        print("No new completions")
        return
    
    print(f"Found {len(completions)} new completion(s)")
    
    # Process each completion
    for filepath, data in completions:
        notification = format_notification(data)
        print(f"Processing: {filepath.name}")
        
        if send_to_sophie(notification, dry_run):
            archive_completion(filepath, dry_run)
            state["processed_files"].append(filepath.name)
        else:
            print(f"Failed to process {filepath.name}, will retry")
    
    # Update state
    state["last_check"] = datetime.now(timezone.utc).isoformat()
    # Keep only last 1000 processed files in state
    state["processed_files"] = state["processed_files"][-1000:]
    save_state(state)
    
    print("Done")


if __name__ == "__main__":
    main()
