#!/usr/bin/env python3
"""
Neo MC Task Pickup — Detection Script

Polls Mission Control for tasks assigned to Neo (assigned_agent=neo)
with status=backlog or status=in_progress. Queues them for execution.

Runs on Linux cron every 30 min during operating hours.
"""

import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

# Add parent for shared imports
sys.path.insert(0, str(Path(__file__).parent))
from common import (
    queue_spawn,
    should_skip,
    notify_neo_channel,
    STATE_DIR,
    log,
)

MC_API = "http://localhost:3001/api/v1"
DEDUP_WINDOW_MIN = 30
COOLDOWN_FILE = STATE_DIR / "neo-mc-pickup-cooldown.json"


def get_neo_tasks():
    """Fetch backlog tasks assigned to Neo from Mission Control."""
    import urllib.request
    
    url = f"{MC_API}/tasks?assigned_agent=neo&status=backlog"
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            return json.loads(resp.read())
    except Exception as e:
        log(f"Failed to fetch MC tasks: {e}")
        return []


def is_recently_queued(task_id: int) -> bool:
    """Check if this task was queued recently (dedup window)."""
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
    """Record that this task was queued."""
    cooldown = {}
    if COOLDOWN_FILE.exists():
        try:
            cooldown = json.loads(COOLDOWN_FILE.read_text())
        except Exception:
            pass
    
    cooldown[f"task-{task_id}"] = time.time()
    COOLDOWN_FILE.write_text(json.dumps(cooldown))


def main():
    if should_skip():
        return
    
    tasks = get_neo_tasks()
    if not tasks:
        log("No MC tasks assigned to Neo")
        return
    
    queued_count = 0
    for task in tasks:
        task_id = task.get("id")
        task_name = task.get("name", "unnamed")
        board_id = task.get("objectiveId")
        
        # GUARDRAIL: Board 2 (product) tasks must go through Rabbit Plan, not MC pickup
        if board_id == 2:
            log(f"⚠️ Task #{task_id} is Board 2 (product) — skipping. Must use Rabbit Plan (GitHub issue → CodeRabbit → Neo).")
            continue
        
        if is_recently_queued(task_id):
            log(f"Task #{task_id} recently queued, skipping")
            continue
        
        # Queue for execution
        prompt = (
            f"Implement Mission Control task #{task_id}: {task_name}\n\n"
            f"Description:\n{task.get('description', 'No description')}\n\n"
            f"Follow the workflow in your AGENTS.md. "
            f"/codecheck must pass. Write tests for new functionality. "
            f"Open a PR when done."
        )
        label = f"neo-mc-{task_id}"
        
        queued = queue_spawn(prompt, label, task_id, "mc-task")
        if not queued:
            continue
        mark_queued(task_id)
        queued_count += 1
        
        log(f"Queued MC task #{task_id}: {task_name}")
        notify_neo_channel(f"📋 Picking up MC task #{task_id}: {task_name}")
    
    log(f"MC pickup complete: {queued_count} task(s) queued from {len(tasks)} found")


if __name__ == "__main__":
    main()
