"""
Neo Loop utilities — extends shared AgentLoop with GitHub-specific helpers.

Neo-specific detection scripts import from here. The shared safety rails,
spawn queue, and notification logic live in agent_loop.common.

Usage:
    from common import neo, gh, log, REPO, FORK, BOT_LOGIN
    if neo.should_skip():
        sys.exit(0)
    neo.queue_spawn(task="...", label="fix-ci-123", task_key="PR#123-ci-fix")
"""

import json
import subprocess
import sys
from pathlib import Path

# Add scripts/ to path so agent_loop is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from agent_loop.common import AgentLoop, log, load_json, save_json  # noqa: F401, E402

# ---------------------------------------------------------------------------
# Neo's AgentLoop instance
# ---------------------------------------------------------------------------

NEO_CHANNEL = "channel:1477061196795478199"  # #neo Discord channel
REPO = "slideheroes/2025slideheroes"
FORK = "slideheroes/2025slideheroes-sophie"
BOT_LOGIN = "SophieLegerPA"

neo = AgentLoop(
    agent="neo",
    discord_channel=NEO_CHANNEL,
    operating_hours=(8, 23),
    dedup_window_min=30,
    max_daily_attempts=3,
    default_model="minimax/MiniMax-M2.5-highspeed",
    default_timeout=1800,
)


# ---------------------------------------------------------------------------
# GitHub CLI helper (Neo-specific)
# ---------------------------------------------------------------------------

def gh(*args, json_output=True) -> dict | list | str | None:
    """Run a gh CLI command. Returns parsed JSON or raw string."""
    cmd = ["gh"] + list(args)
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


# ---------------------------------------------------------------------------
# Backward-compatible aliases (for existing detection scripts)
# ---------------------------------------------------------------------------
# These map the old function signatures to AgentLoop methods so we don't
# have to rewrite every detection script at once.

STATE_DIR = neo.state_dir
SPAWN_QUEUE = neo.spawn_queue
LOCK_FILE = neo.lock_file
COOLDOWN_FILE = neo.cooldown_file


def get_active_runs() -> dict:
    return neo.get_active_runs()


def set_active_run(pr_number: int, task_type: str):
    neo.set_active_run(str(pr_number), task_type)


def clear_active_run(pr_number: int):
    neo.clear_active_run(str(pr_number))


def is_pr_active(pr_number: int) -> bool:
    return neo.is_active(str(pr_number))


def get_cooldown() -> dict:
    return load_json(neo.cooldown_file, {})


def check_cooldown(pr_number: int, task_type: str, max_attempts: int = 3) -> bool:
    # Use the task_key format the old scripts expect
    task_key = f"{pr_number}-{task_type}"
    return neo.check_cooldown(task_key)


def record_attempt(pr_number: int, task_type: str):
    task_key = f"{pr_number}-{task_type}"
    neo.record_attempt(task_key)


def is_recently_queued(pr_number: int, task_type: str, window_minutes: int = 30) -> bool:
    task_key = f"PR#{pr_number}-{task_type}"
    return neo.is_recently_queued(task_key)


def queue_spawn(task: str, label: str, pr_number: int, task_type: str) -> bool:
    """Backward-compatible queue_spawn that maps PR-based args to AgentLoop."""
    return neo.queue_spawn(
        task=task,
        label=label,
        task_key=f"PR#{pr_number}-{task_type}",
        task_type=task_type,
        extra={"pr_number": pr_number},  # Keep for process-spawn-queue.py
    )


def should_skip() -> bool:
    return neo.should_skip()


def notify_neo_channel(message: str):
    neo.notify(message)


def wake_sophie(message: str):
    neo.wake_sophie(message)
