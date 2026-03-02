#!/usr/bin/env python3
"""
Neo Nightly Backlog — Detection + Queue Script

Runs at 11pm ET. Checks MC for Neo's in-progress and backlog tasks,
queues the highest priority one for ACP Claude Code execution.

This is a Linux cron job, NOT an OpenClaw cron job.
No model tokens consumed for detection.
"""

import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import (
    queue_spawn,
    should_skip,
    notify_neo_channel,
    STATE_DIR,
    log,
)

MC_API = "http://localhost:3001/api/v1"


def get_neo_tasks(status):
    """Fetch tasks assigned to Neo with given status."""
    import urllib.request
    url = f"{MC_API}/tasks?assigned_agent=neo&status={status}"
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            tasks = json.loads(resp.read())
            # Sort by priority: high > medium > low
            priority_order = {"high": 0, "medium": 1, "low": 2, "none": 3}
            tasks.sort(key=lambda t: priority_order.get(t.get("priority", "none"), 3))
            return tasks
    except Exception as e:
        log(f"Failed to fetch MC tasks ({status}): {e}")
        return []


def main():
    log("=== Nightly Backlog Run ===")
    
    # Check in-progress first, then backlog
    task = None
    
    in_progress = get_neo_tasks("in_progress")
    # GUARDRAIL: Skip Board 2 (product) tasks — must go through Rabbit Plan
    in_progress = [t for t in in_progress if t.get("objectiveId") != 2]
    if in_progress:
        task = in_progress[0]
        log(f"Found in-progress task #{task['id']}: {task['name']}")
    else:
        backlog = get_neo_tasks("backlog")
        # Skip blocked tasks and Board 2 (product) tasks
        backlog = [t for t in backlog if not t.get("blockedReason") and t.get("objectiveId") != 2]
        if backlog:
            task = backlog[0]
            log(f"Found backlog task #{task['id']}: {task['name']}")
    
    if not task:
        log("No tasks for Neo tonight")
        notify_neo_channel("🌙 Nightly backlog: no tasks to work on tonight.")
        return
    
    task_id = task["id"]
    task_name = task.get("name", "unnamed")
    description = task.get("description", "No description")
    
    prompt = (
        f"You are Neo. Read ~/clawd/agents/neo/AGENTS.md and ~/clawd/agents/neo/LEARNINGS.md first.\n\n"
        f"Implement Mission Control task #{task_id}: {task_name}\n\n"
        f"Description:\n{description}\n\n"
        f"When done, update the task:\n"
        f"curl -X PATCH http://localhost:3001/api/v1/tasks/{task_id} "
        f"-H 'Content-Type: application/json' "
        f"-d '{{\"status\":\"in_review\",\"activity_note\":\"<summary of what you did>\"}}'"
    )
    label = f"neo-nightly-{task_id}"
    
    queued = queue_spawn(prompt, label, task_id, "nightly-backlog")
    if queued:
        notify_neo_channel(f"🌙 Nightly backlog: picking up #{task_id} — {task_name}")
    log(f"Nightly backlog complete: queued={queued} #{task_id}")


if __name__ == "__main__":
    main()
