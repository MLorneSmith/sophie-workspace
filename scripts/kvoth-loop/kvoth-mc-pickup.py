#!/usr/bin/env python3
"""
Kvoth MC Task Pickup — Detection Script

Polls Mission Control for tasks assigned to Kvoth (assignedAgent=kvoth)
with status=backlog. Queues spawn requests via shared AgentLoop infrastructure.

Runs on Linux cron every 60 min during operating hours.
"""

import sys
from datetime import datetime
from pathlib import Path

# Add parent dir so we can import agent_loop
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from agent_loop.common import AgentLoop, log

# Kvoth's loop config
loop = AgentLoop(
    agent="kvoth",
    discord_channel="channel:1477840192240091189",  # #kvoth
    operating_hours=(9, 18),
    dedup_window_min=60,
    default_model="minimax/MiniMax-M2.5-highspeed",
    default_timeout=1800,
)


def main():
    if loop.should_skip():
        return

    if not loop.check_memory():
        return

    tasks = loop.get_mc_tasks(agent="kvoth", status="backlog")
    if not tasks:
        log("[kvoth] No MC tasks assigned")
        return

    queued = 0
    for task in tasks:
        task_id = task.get("id")
        task_name = task.get("name", "unnamed")
        description = task.get("description", "No description provided")
        task_key = f"MC#{task_id}"

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
   curl -X PATCH http://localhost:3001/api/v1/tasks/{task_id} \\
     -H 'Content-Type: application/json' \\
     -d '{{"status":"done","activity_note":"Research complete — deliverable at {artifact_dir}/task-{task_id}.md"}}'
"""

        success = loop.queue_spawn(
            task=prompt,
            label=f"kvoth-mc-{task_id}",
            task_key=task_key,
            task_type="mc-research",
        )

        if success:
            queued += 1

    log(f"[kvoth] MC pickup complete: {queued} queued from {len(tasks)} found")


if __name__ == "__main__":
    main()
