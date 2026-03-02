#!/usr/bin/env python3
"""
Michelangelo MC Task Pickup — Detection Script

Polls Mission Control for tasks assigned to Michelangelo (assignedAgent=michelangelo).
Purely reactive — runs on cron every hour during operating hours.
"""

import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from agent_loop.common import AgentLoop, log

loop = AgentLoop(
    agent="michelangelo",
    discord_channel="channel:1477848398487883776",  # #michelangelo
    operating_hours=(9, 21),  # Extended hours for design work
    dedup_window_min=60,
    max_daily_attempts=3,
    default_model="minimax/MiniMax-M2.5-highspeed",
    default_timeout=1800,
)


def main():
    if loop.should_skip():
        return
    if not loop.check_memory():
        return

    tasks = loop.get_mc_tasks(agent="michelangelo", status="backlog")
    if not tasks:
        log("[michelangelo] No MC tasks assigned")
        return

    task = tasks[0]
    task_id = task.get("id")
    task_name = task.get("name", "unnamed")
    description = task.get("description", "No description provided")
    task_key = f"MC#{task_id}"
    date = datetime.now().strftime("%Y-%m-%d")
    artifact_dir = f"~/clawd/artifacts/michelangelo/{date}"

    prompt = f"""You are Michelangelo, the visual designer for SlideHeroes.

Read your identity first:
1. ~/clawd/agents/michelangelo/AGENTS.md — job description and quality bar
2. ~/clawd/agents/michelangelo/SOUL.md — voice and style

Task #{task_id}: {task_name}

Description:
{description}

Generate the requested visual assets using the nano-banana-pro skill.
Save to {artifact_dir}/ with descriptive filenames.
Update MC when done:
curl -X PATCH http://localhost:3001/api/v1/tasks/{task_id} \\
  -H 'Content-Type: application/json' \\
  -d '{{"status":"done","activity_note":"Assets delivered — {artifact_dir}/"}}'
"""

    loop.queue_spawn(task=prompt, label=f"michelangelo-mc-{task_id}", task_key=task_key, task_type="mc-design")


if __name__ == "__main__":
    main()
