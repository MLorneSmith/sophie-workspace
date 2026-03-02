#!/usr/bin/env python3
"""
Hemingway MC Task Pickup — Detection Script

Polls Mission Control for tasks assigned to Hemingway (assignedAgent=hemingway)
with status=backlog. Queues spawn requests via shared AgentLoop infrastructure.

Hemingway uses Opus 4.6 (writing quality matters) and OpenClaw sub-agent sessions.

Runs on Linux cron every 2 hours during operating hours.
"""

import sys
from datetime import datetime
from pathlib import Path

# Add parent dir so we can import agent_loop
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from agent_loop.common import AgentLoop, log

# Hemingway's loop config
loop = AgentLoop(
    agent="hemingway",
    discord_channel="channel:1477845417717792768",  # #hemingway
    operating_hours=(9, 18),
    dedup_window_min=120,  # 2hr dedup (writing tasks are slow)
    max_daily_attempts=2,  # Writing is expensive — max 2 attempts/task/day
    default_model="anthropic/claude-opus-4-6",  # Quality matters for writing
    default_timeout=3600,  # 1 hour — writing takes time
)

HEMINGWAY_CHANNEL = "channel:1477845417717792768"


def main():
    if loop.should_skip():
        return

    if not loop.check_memory():
        return

    tasks = loop.get_mc_tasks(agent="hemingway", status="backlog")
    if not tasks:
        log("[hemingway] No MC tasks assigned")
        return

    # Only pick up one task at a time — writing needs focus
    task = tasks[0]
    task_id = task.get("id")
    task_name = task.get("name", "unnamed")
    description = task.get("description", "No description provided")
    content_type = task.get("contentType", "blog")
    task_key = f"MC#{task_id}"

    date = datetime.now().strftime("%Y-%m-%d")
    artifact_dir = f"~/clawd/artifacts/hemingway/{date}"

    prompt = f"""You are Hemingway, the content producer for SlideHeroes.

Read your identity and workflow:
1. ~/clawd/agents/hemingway/AGENTS.md — your job description and quality bar
2. ~/clawd/agents/hemingway/SOUL.md — your voice and style
3. ~/clawd/agents/hemingway/MEMORY.md — context and research links

Then complete this task:

Task #{task_id}: {task_name}

Description:
{description}

Content type: {content_type}

Process:
1. Check if Kvoth has research available (look in ~/clawd/artifacts/kvoth/ for related files)
2. Create an outline first, save to {artifact_dir}/outline-task-{task_id}.md
3. Write the full draft, save to {artifact_dir}/draft-task-{task_id}.md
4. Self-edit: cut 20%, strengthen opening and close
5. Post a summary to Discord (your channel will receive the announce)
6. Update MC task:
   curl -X PATCH http://localhost:3001/api/v1/tasks/{task_id} \\
     -H 'Content-Type: application/json' \\
     -d '{{"status":"mike_review","activity_note":"Draft complete — {artifact_dir}/draft-task-{task_id}.md"}}'
"""

    success = loop.queue_spawn(
        task=prompt,
        label=f"hemingway-mc-{task_id}",
        task_key=task_key,
        task_type=f"mc-{content_type}",
    )

    if success:
        log(f"[hemingway] Queued: {task_name}")
    else:
        log(f"[hemingway] Skipped (safety check): {task_name}")


if __name__ == "__main__":
    main()
