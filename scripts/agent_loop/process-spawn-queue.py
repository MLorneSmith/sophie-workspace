#!/usr/bin/env python3
"""
Generic Agent Spawn Queue Processor — spawns OpenClaw sub-agent sessions.

For NON-CODING agents (Kvoth, Hemingway, Viral, Michelangelo).
Coding agents (Neo) use their own ACP/acpx-based processor.

Reads spawn-queue.jsonl from the agent's state dir and spawns one session
at a time via `openclaw cron wake` (which creates an isolated session).

KEY CONSTRAINT: Only ONE session at a time (8GB RAM machine, shared with Neo).

Usage:
    python3 process-spawn-queue.py --agent kvoth
    python3 process-spawn-queue.py --agent kvoth --dry-run
"""

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

MIN_AVAILABLE_MB = 600

ENV_WITH_PATH = {
    **os.environ,
    "PATH": "/usr/local/bin:/home/ubuntu/.npm-global/bin:/usr/bin:/bin:"
            + os.environ.get("PATH", ""),
}


def log(msg: str):
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"[{ts}] {msg}", flush=True)


def get_available_memory_mb() -> int:
    try:
        with open("/proc/meminfo") as f:
            for line in f:
                if line.startswith("MemAvailable:"):
                    return int(line.split()[1]) // 1024
    except Exception:
        pass
    return 9999


def is_session_running(agent: str) -> bool:
    """Check if an openclaw sub-agent session is already running for this agent."""
    try:
        result = subprocess.run(
            ["openclaw", "sessions", "list", "--format", "json"],
            capture_output=True, text=True, timeout=10,
            env=ENV_WITH_PATH,
        )
        if result.returncode == 0 and result.stdout.strip():
            sessions = json.loads(result.stdout)
            for s in sessions:
                label = s.get("label", "")
                if agent in label.lower() and s.get("status") == "active":
                    return True
    except Exception:
        pass
    return False


def notify_channel(channel: str, message: str):
    """Post to agent's Discord channel."""
    if not channel:
        return
    try:
        subprocess.run(
            ["openclaw", "message", "send",
             "--channel", "discord",
             "--target", channel,
             "--message", message],
            capture_output=True, text=True, timeout=10,
            env=ENV_WITH_PATH,
        )
    except Exception:
        pass


def spawn_subagent(task: str, label: str, model: str, timeout: int) -> bool:
    """
    Spawn an OpenClaw isolated sub-agent session.

    Creates a one-shot cron job via `openclaw cron add` that fires immediately,
    running the task as an isolated agentTurn session.
    """
    # Truncate task if extremely long
    if len(task) > 8000:
        task = task[:8000] + "\n\n[Task truncated — see MC task for full details]"

    # Write task to a temp file (message can be very long for CLI args)
    task_file = Path(f"/tmp/{label}-task.txt")
    try:
        task_file.write_text(task)

        # Read task back as message (openclaw cron add --message reads from arg)
        # Use --at +0m for immediate fire, --session isolated, --announce
        result = subprocess.run(
            [
                "openclaw", "cron", "add",
                "--name", label,
                "--at", "1m",
                "--session", "isolated",
                "--message", task,
                "--model", model,
                "--timeout-seconds", str(timeout),
                "--announce",
                "--delete-after-run",
            ],
            capture_output=True, text=True, timeout=30,
            env=ENV_WITH_PATH,
        )

        if result.returncode == 0:
            log(f"  ✅ Sub-agent spawned via cron job: {label}")
            return True
        else:
            err = result.stderr.strip()[:300]
            out = result.stdout.strip()[:200]
            log(f"  ❌ Cron add failed: {err} {out}")
            _write_notification(label, task)
            return False
    except Exception as e:
        log(f"  ❌ Spawn error: {e}")
        _write_notification(label, task)
        return False
    finally:
        task_file.unlink(missing_ok=True)


def _write_notification(label: str, task: str):
    """Fallback: write to Sophie's notifications file for heartbeat pickup."""
    notif_file = Path.home() / "clawd" / "state" / "notifications.jsonl"
    try:
        with open(notif_file, "a") as f:
            f.write(json.dumps({
                "type": "agent_spawn_request",
                "label": label,
                "task_preview": task[:500],
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }) + "\n")
        log(f"  📋 Wrote fallback notification for Sophie: {label}")
    except IOError:
        pass


# Agent Discord channels
AGENT_CHANNELS = {
    "kvoth": "channel:1477840192240091189",
    "hemingway": "channel:1477845417717792768",
    "michelangelo": "channel:1477848398487883776",
    "viral": "channel:1477848160746475623",
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--agent", required=True, help="Agent name (kvoth, hemingway, etc.)")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    agent = args.agent
    state_dir = Path.home() / "clawd" / "state" / f"{agent}-loop"
    spawn_queue = state_dir / "spawn-queue.jsonl"
    archive_dir = state_dir / "archive"
    channel = AGENT_CHANNELS.get(agent)

    if not spawn_queue.exists() or spawn_queue.stat().st_size == 0:
        log(f"[{agent}] No pending spawn requests.")
        return

    # Safety checks
    avail_mb = get_available_memory_mb()
    if avail_mb < MIN_AVAILABLE_MB:
        log(f"[{agent}] Low memory ({avail_mb}MB), skipping.")
        return

    # Read queue
    requests = []
    with open(spawn_queue) as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    requests.append(json.loads(line))
                except json.JSONDecodeError:
                    continue

    if not requests:
        log(f"[{agent}] No pending spawn requests.")
        return

    log(f"[{agent}] {len(requests)} task(s) in queue — processing FIRST only")

    req = requests[0]
    remaining = requests[1:]

    label = req.get("label", "unknown")
    task = req.get("task", "")
    task_key = req.get("task_key", "?")
    task_type = req.get("task_type", "unknown")
    model = req.get("model", "minimax/MiniMax-M2.5-highspeed")
    timeout = req.get("timeout_seconds", 1800)

    log(f"  [{task_type}] {task_key}: {label}")

    if args.dry_run:
        log(f"  [DRY RUN] Would spawn sub-agent. {len(remaining)} remaining.")
        return

    emoji = {"kvoth": "🔍", "hemingway": "✍️", "michelangelo": "🎨",
             "viral": "🚀"}.get(agent, "🤖")
    notify_channel(channel, f"{emoji} **{agent.capitalize()} starting:** {label}")

    success = spawn_subagent(task, label, model, timeout)

    if success:
        notify_channel(channel, f"✅ **{agent.capitalize()} spawned:** {label}")
    else:
        notify_channel(channel, f"❌ **{agent.capitalize()} spawn failed:** {label}")

    # Archive
    archive_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    archive_path = archive_dir / f"completed-{label}-{ts}.json"
    req["result"] = "success" if success else "failed"
    req["completed_at"] = datetime.now(timezone.utc).isoformat()
    with open(archive_path, "w") as f:
        json.dump(req, f, indent=2)

    # Write remaining back
    if remaining:
        with open(spawn_queue, "w") as f:
            for r in remaining:
                f.write(json.dumps(r) + "\n")
        log(f"[{agent}] {len(remaining)} task(s) remaining.")
    else:
        spawn_queue.unlink(missing_ok=True)
        log(f"[{agent}] Queue empty.")


if __name__ == "__main__":
    main()
