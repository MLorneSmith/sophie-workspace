#!/usr/bin/env python3
"""
Neo MC Task Pickup — Detection Script

Polls Mission Control for tasks assigned to Neo (assigned_agent=neo)
with status=backlog or status=in_progress. Queues them for execution.

Runs on Linux cron every 30 min during operating hours.
"""

import sys
from pathlib import Path

# Import from shared agent_loop module
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from agent_loop.common import AgentLoop, log

# Neo's AgentLoop instance (extends shared with GitHub-specific config)
NEO_CHANNEL = "channel:1477061196795478199"  # #neo Discord channel

loop = AgentLoop(
    agent="neo",
    discord_channel=NEO_CHANNEL,
    operating_hours=(8, 23),
    dedup_window_min=30,
    max_daily_attempts=3,
    default_model="minimax/MiniMax-M2.5-highspeed",
    default_timeout=1800,
)


def is_recently_queued(task_id: int) -> bool:
    """Check if this task was queued recently (dedup window).

    Uses the shared is_recently_queued method with MC task key format.
    """
    task_key = f"MC#{task_id}"
    return loop.is_recently_queued(task_key)


def main():
    if loop.should_skip():
        return

    if not loop.check_memory():
        return

    # Use shared MC task polling from AgentLoop
    tasks = loop.get_mc_tasks(agent="neo", status="backlog")
    if not tasks:
        log("[neo] No MC tasks assigned to Neo")
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
        task_key = f"MC#{task_id}"

        # Use shared queue_spawn method
        queued = loop.queue_spawn(task=prompt, label=label, task_key=task_key, task_type="mc-task")
        if not queued:
            continue

        queued_count += 1

        log(f"Queued MC task #{task_id}: {task_name}")
        loop.notify(f"📋 Picking up MC task #{task_id}: {task_name}")

    log(f"MC pickup complete: {queued_count} task(s) queued from {len(tasks)} found")


if __name__ == "__main__":
    main()
