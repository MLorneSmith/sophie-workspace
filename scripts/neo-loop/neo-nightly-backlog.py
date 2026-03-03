#!/usr/bin/env python3
"""
Neo Nightly Backlog — Detection + Queue Script

Runs at 11pm ET. Checks MC for Neo's in-progress and backlog tasks,
queues up to MAX_NIGHTLY_TASKS for serial ACP execution overnight.

Tasks are processed one at a time by the spawn queue processor.
In-progress tasks are prioritized, then backlog by priority.

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
MAX_NIGHTLY_TASKS = int(os.environ.get("MAX_NIGHTLY_TASKS", "3"))


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


def build_prompt(task):
    """Build the ACP prompt for a task."""
    task_id = task["id"]
    task_name = task.get("name", "unnamed")
    description = task.get("description", "No description")
    
    return (
        f"You are Neo. Read ~/clawd/agents/neo/AGENTS.md and ~/clawd/agents/neo/LEARNINGS.md first.\n\n"
        f"Implement Mission Control task #{task_id}: {task_name}\n\n"
        f"Description:\n{description}\n\n"
        f"When done, update the task:\n"
        f"curl -X PATCH http://localhost:3001/api/v1/tasks/{task_id} "
        f"-H 'Content-Type: application/json' "
        f"-d '{{\"status\":\"in_review\",\"activity_note\":\"<summary of what you did>\"}}'"
    )


def main():
    log(f"=== Nightly Backlog Run (max {MAX_NIGHTLY_TASKS} tasks) ===")
    
    # Build candidate list: in-progress first, then backlog
    candidates = []
    
    in_progress = get_neo_tasks("in_progress")
    # GUARDRAIL: Skip Board 2 (product) tasks — must go through Rabbit Plan
    in_progress = [t for t in in_progress if t.get("objectiveId") != 2]
    for t in in_progress:
        log(f"Found in-progress task #{t['id']}: {t['name']}")
    candidates.extend(in_progress)
    
    backlog = get_neo_tasks("backlog")
    # Skip blocked tasks and Board 2 (product) tasks
    backlog = [t for t in backlog if not t.get("blockedReason") and t.get("objectiveId") != 2]
    for t in backlog:
        log(f"Found backlog task #{t['id']}: {t['name']}")
    candidates.extend(backlog)
    
    if not candidates:
        log("No tasks for Neo tonight")
        notify_neo_channel("🌙 Nightly backlog: no tasks to work on tonight.")
        return
    
    # Queue up to MAX_NIGHTLY_TASKS
    tasks_to_queue = candidates[:MAX_NIGHTLY_TASKS]
    queued_ids = []
    
    for task in tasks_to_queue:
        task_id = task["id"]
        task_name = task.get("name", "unnamed")
        prompt = build_prompt(task)
        label = f"neo-nightly-{task_id}"
        
        queued = queue_spawn(prompt, label, task_id, "nightly-backlog")
        if queued:
            queued_ids.append(f"#{task_id}")
            log(f"Queued #{task_id}: {task_name}")
        else:
            log(f"Skipped #{task_id} (already queued or cooldown)")
    
    # Summary notification
    if queued_ids:
        task_list = ", ".join(queued_ids)
        remaining = len(candidates) - len(tasks_to_queue)
        msg = f"🌙 Nightly backlog: queued {len(queued_ids)} task(s) — {task_list}"
        if remaining > 0:
            msg += f" ({remaining} more in backlog)"
        notify_neo_channel(msg)
    else:
        notify_neo_channel("🌙 Nightly backlog: all candidate tasks already queued or on cooldown.")
    
    log(f"Nightly backlog complete: queued {len(queued_ids)}/{len(tasks_to_queue)} tasks")


if __name__ == "__main__":
    main()
