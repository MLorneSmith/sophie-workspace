"""
Shared utilities for Neo Loop scripts.

Neo Loop scripts detect work (issues, PR reviews, CI failures) and write
spawn requests to state/neo-loop/spawn-queue.jsonl. Sophie picks these up
on heartbeat or via cron wake and spawns Neo sub-agents.

Alternative: scripts can directly wake Sophie via OpenClaw cron wake API.
"""

import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

# Paths
STATE_DIR = Path.home() / "clawd" / "state" / "neo-loop"
SPAWN_QUEUE = STATE_DIR / "spawn-queue.jsonl"
LOCK_FILE = STATE_DIR / "active-runs.json"
COOLDOWN_FILE = STATE_DIR / "cooldown.json"

REPO = "slideheroes/2025slideheroes"
FORK = "slideheroes/2025slideheroes-sophie"
BOT_LOGIN = "SophieLegerPA"

STATE_DIR.mkdir(parents=True, exist_ok=True)


def log(msg: str):
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"[{ts}] {msg}", flush=True)


def load_json(path: Path, default=None):
    if default is None:
        default = {}
    if path.exists():
        try:
            with open(path) as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return default
    return default


def save_json(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def gh(*args, json_output=True) -> dict | list | str | None:
    """Run a gh CLI command. Returns parsed JSON or raw string."""
    cmd = ["gh"] + list(args)
    if json_output:
        cmd_str = " ".join(cmd)
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode != 0:
            log(f"gh error: {result.stderr.strip()}")
            return None
        if json_output:
            return json.loads(result.stdout)
        return result.stdout.strip()
    except (subprocess.TimeoutExpired, json.JSONDecodeError) as e:
        log(f"gh exception: {e}")
        return None


def get_active_runs() -> dict:
    """Get currently active Neo runs. Keys are PR numbers (as strings)."""
    return load_json(LOCK_FILE, {})


def set_active_run(pr_number: int, task_type: str):
    """Mark a PR as having an active Neo run."""
    runs = get_active_runs()
    runs[str(pr_number)] = {
        "type": task_type,
        "started": datetime.now(timezone.utc).isoformat(),
    }
    save_json(LOCK_FILE, runs)


def clear_active_run(pr_number: int):
    """Clear active run for a PR."""
    runs = get_active_runs()
    runs.pop(str(pr_number), None)
    save_json(LOCK_FILE, runs)


def is_pr_active(pr_number: int) -> bool:
    """Check if a PR already has an active Neo run."""
    runs = get_active_runs()
    entry = runs.get(str(pr_number))
    if not entry:
        return False
    # Auto-expire after 45 min (safety valve)
    started = datetime.fromisoformat(entry["started"])
    age_min = (datetime.now(timezone.utc) - started).total_seconds() / 60
    if age_min > 45:
        log(f"PR #{pr_number} run expired (started {age_min:.0f}m ago), clearing")
        clear_active_run(pr_number)
        return False
    return True


def get_cooldown() -> dict:
    """Get cooldown tracker. Keys are 'PR#-type', values are attempt counts + date."""
    return load_json(COOLDOWN_FILE, {})


def check_cooldown(pr_number: int, task_type: str, max_attempts: int = 3) -> bool:
    """Check if we've hit the daily cooldown limit. Returns True if OK to proceed."""
    cooldowns = get_cooldown()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    key = f"{pr_number}-{task_type}"

    entry = cooldowns.get(key, {})
    if entry.get("date") != today:
        return True  # New day, reset
    return entry.get("attempts", 0) < max_attempts


def record_attempt(pr_number: int, task_type: str):
    """Record a spawn attempt for cooldown tracking."""
    cooldowns = get_cooldown()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    key = f"{pr_number}-{task_type}"

    entry = cooldowns.get(key, {})
    if entry.get("date") != today:
        entry = {"date": today, "attempts": 0}
    entry["attempts"] = entry.get("attempts", 0) + 1
    cooldowns[key] = entry
    save_json(COOLDOWN_FILE, cooldowns)


def is_recently_queued(pr_number: int, task_type: str, window_minutes: int = 30) -> bool:
    """Check if a spawn was already queued for this PR+type recently."""
    if not SPAWN_QUEUE.exists():
        return False
    from datetime import timedelta
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=window_minutes)
    try:
        with open(SPAWN_QUEUE) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    req = json.loads(line)
                    if (req.get("pr_number") == pr_number
                            and req.get("task_type") == task_type
                            and req.get("requested_at")):
                        req_time = datetime.fromisoformat(req["requested_at"])
                        if req_time > cutoff:
                            return True
                except (json.JSONDecodeError, ValueError):
                    continue
    except IOError:
        pass
    return False


def queue_spawn(task: str, label: str, pr_number: int, task_type: str):
    """
    Queue a Neo sub-agent spawn request.
    Writes to spawn-queue.jsonl for Sophie to pick up,
    and also tries to wake Sophie via cron wake.
    """
    if is_pr_active(pr_number):
        log(f"PR #{pr_number} already has an active run, skipping")
        return False

    if not check_cooldown(pr_number, task_type):
        log(f"PR #{pr_number} hit daily cooldown for {task_type}, skipping")
        return False

    if is_recently_queued(pr_number, task_type):
        log(f"PR #{pr_number} already queued for {task_type} in last 30 min, skipping")
        return False

    request = {
        "task": task,
        "label": label,
        "pr_number": pr_number,
        "task_type": task_type,
        "requested_at": datetime.now(timezone.utc).isoformat(),
        "model": "minimax/MiniMax-M2.5-highspeed",
        "timeout_seconds": 1800,  # 30 min
    }

    # Write to queue
    with open(SPAWN_QUEUE, "a") as f:
        f.write(json.dumps(request) + "\n")

    # Record attempt
    record_attempt(pr_number, task_type)
    set_active_run(pr_number, task_type)

    log(f"Queued spawn: {label} (PR #{pr_number})")

    # Try to wake Sophie
    wake_sophie(f"🤖 Neo Loop: {label} — spawn Neo for PR #{pr_number}")

    return True


def wake_sophie(message: str):
    """Send a cron wake event to Sophie's main session."""
    try:
        # Use openclaw CLI to send wake event
        result = subprocess.run(
            ["openclaw", "cron", "wake", "--text", message, "--mode", "now"],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode == 0:
            log(f"Wake sent: {message[:80]}")
        else:
            log(f"Wake failed: {result.stderr.strip()}")
    except Exception as e:
        log(f"Wake exception: {e}")
        # Fallback: write to notifications
        notif_file = Path.home() / "clawd" / "state" / "notifications.jsonl"
        with open(notif_file, "a") as f:
            f.write(json.dumps({
                "type": "neo_loop_spawn",
                "message": message,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }) + "\n")
