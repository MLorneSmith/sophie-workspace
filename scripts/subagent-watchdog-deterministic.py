#!/usr/bin/env python3
"""
Sub-agent Watchdog (Deterministic)

Detects stuck/looping sub-agents and kills them. No LLM calls.

Detection criteria:
1. Node process running >5 minutes (sub-agent)
2. AND no git progress in monitored repos

Actions:
- Kill stuck sub-agent process
- Notify Discord channel

Exit codes:
0 = No stuck agents
1 = Killed one or more stuck agents
2 = Error occurred
"""

import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

# Configuration
THRESHOLD_MINUTES = 5
DISCORD_CHANNEL = "1466532593754312899"  # #general

# Repos to check for git progress
REPO_PATHS = [
    Path.home() / "2025slideheroes-sophie",
    Path.home() / "clawd",
    Path.home() / "slideheroes-internal-tools",
]


def get_subagent_processes() -> list[dict]:
    """Find running sub-agent node processes."""
    try:
        result = subprocess.run(
            ["ps", "aux"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        processes = []
        for line in result.stdout.split("\n"):
            # Look for node processes that might be sub-agents
            # OpenClaw sub-agents typically have "agent:" in their identifier
            if "node" in line and ("agent:" in line or "subagent" in line.lower()):
                parts = line.split()
                if len(parts) >= 2:
                    try:
                        pid = int(parts[1])
                        # Get process start time
                        stat_result = subprocess.run(
                            ["stat", "-c", "%Y", f"/proc/{pid}"],
                            capture_output=True,
                            text=True,
                            timeout=5
                        )
                        if stat_result.returncode == 0:
                            start_time = int(stat_result.stdout.strip())
                            processes.append({
                                "pid": pid,
                                "cmdline": line,
                                "started_at": start_time
                            })
                    except (ValueError, subprocess.SubprocessError):
                        continue
        
        return processes
    except subprocess.SubprocessError as e:
        print(f"Failed to list processes: {e}", file=sys.stderr)
        return []


def check_git_progress(repo_path: Path, since_minutes: int) -> bool:
    """Check if repo has recent commits or uncommitted changes."""
    if not repo_path.exists():
        return False
    
    try:
        # Check for uncommitted changes
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.stdout.strip():
            return True  # Has uncommitted changes = progress
        
        # Check for recent commits
        since_time = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(time.time() - since_minutes * 60))
        result = subprocess.run(
            ["git", "log", "--oneline", "--since", since_time],
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.stdout.strip():
            return True  # Has recent commits = progress
        
        return False
    except (subprocess.TimeoutExpired, subprocess.SubprocessError):
        return False


def kill_process(pid: int) -> bool:
    """Kill a process by PID."""
    try:
        # Try graceful termination first
        subprocess.run(["kill", str(pid)], timeout=5)
        time.sleep(2)
        
        # Check if still running
        result = subprocess.run(
            ["kill", "-0", str(pid)],
            capture_output=True,
            timeout=5
        )
        
        if result.returncode == 0:
            # Still running, force kill
            subprocess.run(["kill", "-9", str(pid)], timeout=5)
            time.sleep(1)
        
        return True
    except subprocess.SubprocessError as e:
        print(f"Failed to kill process {pid}: {e}", file=sys.stderr)
        return False


def notify_discord(message: str) -> bool:
    """Send notification to Discord via message tool (using subprocess)."""
    try:
        # Use the openclaw message CLI if available
        result = subprocess.run(
            ["openclaw", "message", "send", 
             "--channel", "discord",
             "--target", DISCORD_CHANNEL,
             "--message", message],
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.returncode == 0
    except subprocess.SubprocessError as e:
        print(f"Discord notification failed: {e}", file=sys.stderr)
        return False


def extract_agent_label(cmdline: str) -> str:
    """Extract agent label from process command line."""
    # Look for patterns like "agent:main:subagent:xxx" or similar
    match = re.search(r"agent:([a-zA-Z0-9_-]+)", cmdline)
    if match:
        return match.group(1)
    
    # Fallback to PID
    parts = cmdline.split()
    if len(parts) >= 2:
        return f"pid-{parts[1]}"
    
    return "unknown"


def main():
    subagents = get_subagent_processes()
    
    if not subagents:
        # No active subagents = nothing to do
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] watchdog: no active subagents")
        sys.exit(0)
    
    now = int(time.time())
    killed = []
    warned = []
    
    for proc in subagents:
        runtime_sec = now - proc["started_at"]
        runtime_min = runtime_sec / 60
        
        # Skip if not running long enough
        if runtime_min < THRESHOLD_MINUTES:
            continue
        
        label = extract_agent_label(proc["cmdline"])
        
        # Check for git progress
        has_progress = any(check_git_progress(repo, int(runtime_min)) for repo in REPO_PATHS)
        
        # Decision
        if not has_progress:
            # Kill it
            if kill_process(proc["pid"]):
                killed.append({
                    "label": label,
                    "pid": proc["pid"],
                    "runtime_min": round(runtime_min, 1),
                    "reason": "no git progress"
                })
            else:
                print(f"Failed to kill sub-agent: {label} (pid {proc['pid']})", file=sys.stderr)
        else:
            # Just warn if running very long
            if runtime_min > 10:
                warned.append({
                    "label": label,
                    "pid": proc["pid"],
                    "runtime_min": round(runtime_min, 1)
                })
    
    # Send notifications
    if killed:
        msg_lines = ["⚠️ **Sub-agent Watchdog Report**\n"]
        for k in killed:
            msg_lines.append(f"🔪 Killed `{k['label']}` (pid {k['pid']}) after {k['runtime_min']}min — {k['reason']}")
        
        notify_discord("\n".join(msg_lines))
        print(f"Killed {len(killed)} stuck sub-agent(s)")
        sys.exit(1)
    
    if warned:
        msg_lines = ["⏳ **Sub-agent Watchdog Warning**\n"]
        for w in warned:
            msg_lines.append(f"`{w['label']}` running {w['runtime_min']}min but has git progress — monitoring")
        
        notify_discord("\n".join(msg_lines))
        print(f"Warned about {len(warned)} long-running sub-agent(s)")
    
    # No action needed
    sys.exit(0)


if __name__ == "__main__":
    main()
