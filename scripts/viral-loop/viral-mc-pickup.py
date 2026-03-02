#!/usr/bin/env python3
"""
Viral MC Task Pickup — Detection Script

Polls Mission Control for tasks assigned to Viral (assignedAgent=viral).
Runs on Linux cron every 2 hours during operating hours.
"""

import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from agent_loop.common import AgentLoop, log

loop = AgentLoop(
    agent="viral",
    discord_channel="channel:1477848160746475623",  # #viral
    operating_hours=(9, 18),
    dedup_window_min=120,
    max_daily_attempts=3,
    default_model="minimax/MiniMax-M2.5-highspeed",
    default_timeout=1800,
)


def main():
    if loop.should_skip():
        return
    if not loop.check_memory():
        return

    tasks = loop.get_mc_tasks(agent="viral", status="backlog")
    if not tasks:
        log("[viral] No MC tasks assigned")
        return

    task = tasks[0]
    task_id = task.get("id")
    task_name = task.get("name", "unnamed")
    description = task.get("description", "No description provided")
    task_key = f"MC#{task_id}"
    date = datetime.now().strftime("%Y-%m-%d")
    artifact_dir = f"~/clawd/artifacts/viral/{date}"

    prompt = f"""You are Viral, the growth engineer for SlideHeroes.

Read your identity first:
1. ~/clawd/agents/viral/AGENTS.md — job description and quality bar
2. ~/clawd/agents/viral/SOUL.md — voice and style

Task #{task_id}: {task_name}

Description:
{description}

Save deliverable to {artifact_dir}/task-{task_id}.md with YAML frontmatter.
Update MC when done:
curl -X PATCH http://localhost:3001/api/v1/tasks/{task_id} \\
  -H 'Content-Type: application/json' \\
  -d '{{"status":"done","activity_note":"Complete — {artifact_dir}/task-{task_id}.md"}}'
"""

    loop.queue_spawn(task=prompt, label=f"viral-mc-{task_id}", task_key=task_key, task_type="mc-seo")


if __name__ == "__main__":
    main()
