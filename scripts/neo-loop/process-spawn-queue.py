#!/usr/bin/env python3
"""
Process Neo Loop Spawn Queue — Reads spawn-queue.jsonl and spawns
ACP Claude Code sessions directly via acpx exec.

KEY CONSTRAINT: Only ONE session at a time (3.7GB RAM machine).
Runs each task sequentially, waiting for completion before the next.
Remaining tasks stay in queue for the next cron cycle.

Usage:
    python3 process-spawn-queue.py          # Process next task
    python3 process-spawn-queue.py --dry-run  # Show what would spawn
"""

import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

SPAWN_QUEUE = Path.home() / "clawd" / "state" / "neo-loop" / "spawn-queue.jsonl"
ARCHIVE_DIR = Path.home() / "clawd" / "state" / "neo-loop" / "archive"
ACTIVE_FILE = Path.home() / "clawd" / "state" / "neo-loop" / "active-acp.json"
NEO_CHANNEL = "channel:1477061196795478199"  # #neo Discord channel
MIN_AVAILABLE_MB = 500  # Don't spawn if less than this available

ENV_WITH_PATH = {
    **os.environ,
    "PATH": "/usr/local/bin:/home/ubuntu/.npm-global/bin:/usr/bin:/bin:" + os.environ.get("PATH", ""),
}


def log(msg: str):
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"[{ts}] {msg}", flush=True)


def get_available_memory_mb() -> int:
    """Get available memory in MB from /proc/meminfo."""
    try:
        with open("/proc/meminfo") as f:
            for line in f:
                if line.startswith("MemAvailable:"):
                    kb = int(line.split()[1])
                    return kb // 1024
    except Exception:
        pass
    return 9999  # Assume OK if can't read


def is_acp_session_running() -> bool:
    """Check if an ACP session is already running."""
    # Check for acpx exec processes
    try:
        result = subprocess.run(
            ["pgrep", "-f", "acpx.*exec"],
            capture_output=True, timeout=5,
        )
        if result.returncode == 0 and result.stdout.strip():
            return True
    except Exception:
        pass

    # Also check the active file for stale entries
    if ACTIVE_FILE.exists():
        try:
            with open(ACTIVE_FILE) as f:
                active = json.load(f)
            pid = active.get("pid")
            started = active.get("started", "")
            # Check if PID is still alive
            if pid:
                try:
                    os.kill(pid, 0)
                    return True
                except OSError:
                    # Process dead, check age for safety
                    pass
            # Clean up stale active file
            ACTIVE_FILE.unlink(missing_ok=True)
        except (json.JSONDecodeError, IOError):
            ACTIVE_FILE.unlink(missing_ok=True)

    return False


def spawn_acp_session(task: str, label: str, timeout_seconds: int = 1800) -> bool:
    """Spawn an ACP Claude Code session via acpx exec.

    Runs SYNCHRONOUSLY — waits for completion. This ensures only one
    session runs at a time to avoid OOM on the 3.7GB instance.
    """
    task_file = Path(f"/tmp/neo-task-{label}.txt")
    out_file = Path(f"/tmp/neo-output-{label}.log")
    err_file = Path(f"/tmp/neo-error-{label}.log")

    try:
        task_file.write_text(task)

        cmd = [
            "npx", "acpx",
            "--cwd", str(Path.home() / "2025slideheroes-sophie"),
            "--approve-all",
            "--non-interactive-permissions", "deny",
            "--timeout", str(timeout_seconds),
            "--format", "json",
            "--json-strict",
            "claude", "exec",
            "--file", str(task_file),
        ]

        log(f"  Spawning acpx exec for {label} (sync, timeout {timeout_seconds}s)...")

        with open(out_file, "w") as out_f, open(err_file, "w") as err_f:
            process = subprocess.Popen(
                cmd,
                stdout=out_f,
                stderr=err_f,
                env=ENV_WITH_PATH,
            )

            # Record active session
            with open(ACTIVE_FILE, "w") as f:
                json.dump({
                    "label": label,
                    "pid": process.pid,
                    "started": datetime.now(timezone.utc).isoformat(),
                }, f)

            # Wait for completion (with timeout buffer)
            try:
                exit_code = process.wait(timeout=timeout_seconds + 60)
            except subprocess.TimeoutExpired:
                log(f"  ⏰ Session timed out, killing PID {process.pid}")
                process.kill()
                process.wait(timeout=10)
                exit_code = -1

        # Clean up active file
        ACTIVE_FILE.unlink(missing_ok=True)

        # Check result
        done_count = 0
        try:
            with open(out_file) as f:
                for line in f:
                    if '"type":"done"' in line:
                        done_count += 1
        except IOError:
            pass

        if done_count > 0 and exit_code == 0:
            log(f"  ✅ Session completed for {label} (exit {exit_code})")
            return True
        else:
            err_text = ""
            try:
                err_text = err_file.read_text().strip()[-200:]
            except IOError:
                pass
            log(f"  ❌ Session failed for {label} (exit {exit_code}) {err_text}")
            return False

    except Exception as e:
        ACTIVE_FILE.unlink(missing_ok=True)
        log(f"  ❌ Spawn error: {e}")
        return False
    finally:
        task_file.unlink(missing_ok=True)


def notify_neo(message: str):
    """Post to #neo Discord channel."""
    try:
        subprocess.run(
            ["openclaw", "message", "send",
             "--channel", "discord",
             "--target", NEO_CHANNEL,
             "--message", message],
            capture_output=True,
            text=True,
            timeout=10,
            env=ENV_WITH_PATH,
        )
    except Exception:
        pass


def main():
    dry_run = "--dry-run" in sys.argv

    if not SPAWN_QUEUE.exists() or SPAWN_QUEUE.stat().st_size == 0:
        log("No pending spawn requests.")
        return

    # Safety: check if a session is already running
    if is_acp_session_running():
        log("ACP session already running — skipping this cycle.")
        return

    # Safety: check available memory
    avail_mb = get_available_memory_mb()
    if avail_mb < MIN_AVAILABLE_MB:
        log(f"Low memory ({avail_mb}MB available, need {MIN_AVAILABLE_MB}MB) — skipping.")
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
        log("No pending spawn requests.")
        return

    log(f"{len(requests)} task(s) in queue — processing FIRST only (serial execution)")

    # Take only the first task; leave the rest for next cycle
    req = requests[0]
    remaining = requests[1:]

    label = req.get("label", "unknown")
    task = req.get("task", "")
    pr_number = req.get("pr_number", "?")
    task_type = req.get("task_type", "unknown")
    timeout = req.get("timeout_seconds", 1800)

    log(f"  [{task_type}] PR #{pr_number}: {label}")

    if dry_run:
        log(f"  [DRY RUN] Would spawn ACP session. {len(remaining)} remaining in queue.")
        return

    notify_neo(f"🧑‍💻 **Neo starting** PR #{pr_number} ({task_type}): {label}")

    success = spawn_acp_session(task, label, timeout)

    if success:
        notify_neo(f"✅ **Neo completed** PR #{pr_number} ({task_type})")
    else:
        notify_neo(f"❌ **Neo failed** PR #{pr_number} ({task_type})")

    # Archive the processed task
    ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    archive_path = ARCHIVE_DIR / f"completed-{label}-{ts}.json"
    req["result"] = "success" if success else "failed"
    req["completed_at"] = datetime.now(timezone.utc).isoformat()
    with open(archive_path, "w") as f:
        json.dump(req, f, indent=2)

    # Write remaining tasks back to queue
    if remaining:
        with open(SPAWN_QUEUE, "w") as f:
            for r in remaining:
                f.write(json.dumps(r) + "\n")
        log(f"{len(remaining)} task(s) remaining in queue for next cycle.")
    else:
        SPAWN_QUEUE.unlink(missing_ok=True)
        log("Queue empty.")


if __name__ == "__main__":
    main()
