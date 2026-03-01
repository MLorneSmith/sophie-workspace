#!/usr/bin/env python3
"""
Kvoth MC Task Pickup — Detection Script

Polls Mission Control for tasks assigned to Kvoth (assigned_agent=kvoth)
with status=backlog. Spawns OpenClaw sub-agent sessions (not ACP Claude Code).

Runs on Linux cron every 60 min during operating hours.
"""

import json
import os
import sys
import time
import subprocess
from datetime import datetime
from pathlib import Path

MC_API = "http://localhost:3001/api/v1"
STATE_DIR = Path(os.path.expanduser("~/clawd/state/kvoth-loop"))
COOLDOWN_FILE = STATE_DIR / "mc-pickup-cooldown.json"
LOG_FILE = STATE_DIR / "mc-pickup.log"
DEDUP_WINDOW_MIN = 60
DISCORD_CHANNEL = "kvoth"  # Will be channel ID when created


def log(msg):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    try:
        with open(LOG_FILE, "a") as f:
            f.write(line + "\n")
    except Exception:
        pass


def get_kvoth_tasks():
    """Fetch backlog tasks assigned to Kvoth from Mission Control."""
    import urllib.request
    url = f"{MC_API}/tasks?assigned_agent=kvoth&status=backlog"
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            return json.loads(resp.read())
    except Exception as e:
        log(f"Failed to fetch MC tasks: {e}")
        return []


def is_recently_queued(task_id: int) -> bool:
    cooldown = {}
    if COOLDOWN_FILE.exists():
        try:
            cooldown = json.loads(COOLDOWN_FILE.read_text())
        except Exception:
            pass
    key = f"task-{task_id}"
    last_queued = cooldown.get(key, 0)
    return (time.time() - last_queued) < (DEDUP_WINDOW_MIN * 60)


def mark_queued(task_id: int):
    cooldown = {}
    if COOLDOWN_FILE.exists():
        try:
            cooldown = json.loads(COOLDOWN_FILE.read_text())
        except Exception:
            pass
    cooldown[f"task-{task_id}"] = time.time()
    COOLDOWN_FILE.write_text(json.dumps(cooldown))


def check_memory():
    """Check available memory — skip if < 500MB free."""
    try:
        with open("/proc/meminfo") as f:
            for line in f:
                if line.startswith("MemAvailable:"):
                    available_kb = int(line.split()[1])
                    available_mb = available_kb / 1024
                    if available_mb < 500:
                        log(f"Low memory ({available_mb:.0f}MB free), skipping")
                        return False
                    return True
    except Exception:
        return True
    return True


def spawn_research_session(task):
    """Spawn an OpenClaw sub-agent session for research."""
    task_id = task.get("id")
    task_name = task.get("name", "unnamed")
    description = task.get("description", "No description provided")
    
    date = datetime.now().strftime("%Y-%m-%d")
    artifact_dir = f"~/clawd/artifacts/kvoth/{date}"
    
    prompt = f"""You are Kvoth, the research analyst. Complete this research task:

Task #{task_id}: {task_name}

Description:
{description}

Instructions:
1. Read ~/clawd/agents/kvoth/AGENTS.md for your full workflow and quality standards
2. Research thoroughly using web_search, web_fetch, and perplexity-research
3. Save your deliverable to {artifact_dir}/task-{task_id}.md (with YAML frontmatter)
4. Update the MC task status when done:
   curl -X PATCH http://localhost:3001/api/v1/tasks/{task_id} -H 'Content-Type: application/json' -d '{{"status":"done","activity_note":"Research complete — deliverable at {artifact_dir}/task-{task_id}.md"}}'
"""
    
    # Use openclaw CLI to spawn a sub-agent
    cmd = [
        os.path.expanduser("~/.npm-global/bin/openclaw"),
        "cron", "wake",
        "--text", prompt,
        "--mode", "now"
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            log(f"Spawned research session for task #{task_id}")
        else:
            log(f"Failed to spawn for #{task_id}: {result.stderr[:200]}")
    except Exception as e:
        log(f"Spawn error for #{task_id}: {e}")


def should_skip():
    """Check operating hours (9am-6pm ET)."""
    hour = datetime.now().hour
    if hour < 9 or hour > 18:
        return True
    return False


def main():
    if should_skip():
        return
    
    if not check_memory():
        return
    
    tasks = get_kvoth_tasks()
    if not tasks:
        log("No MC tasks assigned to Kvoth")
        return
    
    queued_count = 0
    for task in tasks:
        task_id = task.get("id")
        task_name = task.get("name", "unnamed")
        
        if is_recently_queued(task_id):
            log(f"Task #{task_id} recently queued, skipping")
            continue
        
        spawn_research_session(task)
        mark_queued(task_id)
        queued_count += 1
        log(f"Queued task #{task_id}: {task_name}")
    
    log(f"MC pickup complete: {queued_count} task(s) spawned from {len(tasks)} found")


if __name__ == "__main__":
    main()
