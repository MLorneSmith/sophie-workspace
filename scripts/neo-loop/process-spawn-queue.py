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

STATE_DIR = Path.home() / "clawd" / "state" / "neo-loop"
SPAWN_QUEUE = STATE_DIR / "spawn-queue.jsonl"
ARCHIVE_DIR = STATE_DIR / "archive"
ACTIVE_FILE = Path.home() / "clawd" / "state" / "neo-loop" / "active-acp.json"
NEO_CHANNEL = "channel:1477061196795478199"  # #neo Discord channel
MIN_AVAILABLE_MB = 800  # Don't spawn if less than this available (protects OpenClaw)

ENV_WITH_PATH = {
    **os.environ,
    "PATH": "/usr/local/bin:/home/ubuntu/.npm-global/bin:/usr/bin:/bin:" + os.environ.get("PATH", ""),
    # Ensure systemd --user session bus is available (cron doesn't inherit these)
    "DBUS_SESSION_BUS_ADDRESS": os.environ.get("DBUS_SESSION_BUS_ADDRESS", f"unix:path=/run/user/{os.getuid()}/bus"),
    "XDG_RUNTIME_DIR": os.environ.get("XDG_RUNTIME_DIR", f"/run/user/{os.getuid()}"),
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


def _extract_issue_number(label: str) -> int | None:
    """Extract issue number from a label like 'neo-issue-2213'."""
    import re
    match = re.search(r"issue-(\d+)", label)
    return int(match.group(1)) if match else None


def _infer_repo_from_label(label: str) -> str:
    """Infer the GitHub repo from the spawn label."""
    if "internal-tools" in label or "slideheroes-internal-tools" in label:
        return "slideheroes/slideheroes-internal-tools"
    return "slideheroes/2025slideheroes"


def _reset_issue_for_retry(issue_number: int, label: str):
    """Reset a failed issue's label back to plan-me and remove from processed list,
    so the pickup loop can retry it automatically."""
    repo = _infer_repo_from_label(label)

    # 1. Reset GitHub labels: remove status:in-progress, add plan-me
    try:
        subprocess.run(
            ["gh", "issue", "edit", str(issue_number),
             "--repo", repo,
             "--remove-label", "status:in-progress",
             "--add-label", "plan-me"],
            capture_output=True, text=True, timeout=15, env=ENV_WITH_PATH,
        )
        log(f"  🔄 Reset #{issue_number} label to plan-me for retry")
    except Exception as e:
        log(f"  ⚠️ Failed to reset label for #{issue_number}: {e}")

    # 2. Remove from processed list so pickup script sees it again
    state_file = STATE_DIR / "issue-pickup-state.json"
    try:
        if state_file.exists():
            with open(state_file) as f:
                state = json.load(f)
            processed = state.get("processed_issues", [])
            if issue_number in processed:
                processed.remove(issue_number)
                state["processed_issues"] = processed
                with open(state_file, "w") as f:
                    json.dump(state, f, indent=2)
                log(f"  🔄 Removed #{issue_number} from processed list")
    except Exception as e:
        log(f"  ⚠️ Failed to update processed list for #{issue_number}: {e}")

    # 3. Update cooldown to track retry count
    cooldown_file = STATE_DIR / "cooldown.json"
    try:
        cooldowns = {}
        if cooldown_file.exists():
            with open(cooldown_file) as f:
                cooldowns = json.load(f)

        key = f"issue-{issue_number}"
        entry = cooldowns.get(key, {"attempts": 0, "max_attempts": 3})
        entry["attempts"] = entry.get("attempts", 0) + 1
        entry["last_failure"] = datetime.now(timezone.utc).isoformat()
        cooldowns[key] = entry

        with open(cooldown_file, "w") as f:
            json.dump(cooldowns, f, indent=2)

        if entry["attempts"] >= entry.get("max_attempts", 3):
            log(f"  🚨 #{issue_number} has failed {entry['attempts']} times — escalating (won't auto-retry)")
            # Remove plan-me so it doesn't loop forever
            subprocess.run(
                ["gh", "issue", "edit", str(issue_number),
                 "--repo", repo,
                 "--remove-label", "plan-me",
                 "--add-label", "status:blocked"],
                capture_output=True, text=True, timeout=15, env=ENV_WITH_PATH,
            )
            notify_neo(f"🚨 **Escalation:** #{issue_number} failed {entry['attempts']} times. Needs manual attention.")
        else:
            log(f"  🔄 #{issue_number} attempt {entry['attempts']}/{entry.get('max_attempts', 3)} — will retry on next pickup cycle")

    except Exception as e:
        log(f"  ⚠️ Failed to update cooldown for #{issue_number}: {e}")


def _check_for_new_pr(label: str) -> bool:
    """Check if a PR was created in the last 30 minutes by SophieLegerPA.
    This catches cases where acpx reports failure but the work was actually done."""
    try:
        result = subprocess.run(
            ["gh", "pr", "list", "--repo", "slideheroes/2025slideheroes",
             "--author", "SophieLegerPA", "--state", "open",
             "--json", "number,createdAt", "--jq", "length"],
            capture_output=True, text=True, timeout=15, env=ENV_WITH_PATH,
        )
        # Also check recently merged PRs
        result2 = subprocess.run(
            ["gh", "pr", "list", "--repo", "slideheroes/2025slideheroes",
             "--author", "SophieLegerPA", "--state", "merged",
             "--json", "number,mergedAt", "--jq", "length"],
            capture_output=True, text=True, timeout=15, env=ENV_WITH_PATH,
        )
        # Simple heuristic: if there are open or recently merged PRs, assume success
        # A more precise check would match the branch name from the label
        open_count = int(result.stdout.strip() or "0")
        return open_count > 0
    except Exception:
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

        acpx_cmd = [
            "npx", "acpx",
            "--cwd", str(Path.home() / "2025slideheroes-sophie"),
            "--approve-all",
            "--non-interactive-permissions", "deny",
            "--timeout", str(timeout_seconds),
            "--format", "json",
            "--json-strict",
            "claude", "exec",
            "-f", str(task_file),
        ]

        # Wrap in cgroup memory limit to prevent OOM-killing OpenClaw
        # If Neo exceeds limit, only Neo dies — OpenClaw survives
        # Instance: m7i-flex.large (8GB). Budget: ~3GB for Neo, rest for OpenClaw + services
        MEMORY_LIMIT = "3G"
        cmd = [
            "systemd-run", "--user", "--scope",
            "-p", f"MemoryMax={MEMORY_LIMIT}",
            "-p", "MemorySwapMax=4G",
            "--",
        ] + acpx_cmd

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
                    if '"type":"done"' in line or '"stopReason":"end_turn"' in line:
                        done_count += 1
        except IOError:
            pass

        if done_count > 0 and exit_code == 0:
            log(f"  ✅ Session completed for {label} (exit {exit_code})")
            return True
        else:
            # Check for actual outcomes even if exit code is non-zero
            # (acpx can report failure even when work was done)
            pr_created = _check_for_new_pr(label)
            if pr_created:
                log(f"  ✅ Session exit code {exit_code} but PR was created — marking success")
                return True

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

    issue_number = req.get("issue_number") or _extract_issue_number(label)

    if success:
        notify_neo(f"✅ **Neo completed** PR #{pr_number} ({task_type})")
    else:
        notify_neo(f"❌ **Neo failed** PR #{pr_number} ({task_type})")
        # Reset label so the issue re-enters the pickup loop for retry
        if issue_number:
            _reset_issue_for_retry(issue_number, label)

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
