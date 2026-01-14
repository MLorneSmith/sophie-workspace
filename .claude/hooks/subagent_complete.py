#!/usr/bin/env python3
"""
SubagentStop hook for tracking sub-agent task completions.

Updates .initiative-progress.json when a sub-agent (Task tool) completes.
This provides visibility into parallel task execution and agent activity.

Input (JSON from stdin):
{
    "agent_id": "abc123",
    "agent_type": "code-explorer",
    "output": "...",
    "session_id": "xyz789"
}

Output: None (exit 0 for success)
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

PROGRESS_FILE = Path('.initiative-progress.json')
EVENTS_FILE = Path('.initiative-events.json')


def main():
    """Process SubagentStop hook invocation."""
    try:
        input_data = json.load(sys.stdin)
    except Exception:
        # Fail silently if no input - don't block Claude
        sys.exit(0)

    # Load existing progress file
    progress = {}
    if PROGRESS_FILE.exists():
        try:
            progress = json.loads(PROGRESS_FILE.read_text())
        except Exception:
            pass

    # Update heartbeat timestamp
    now = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    progress['last_heartbeat'] = now

    # Track subagent stop event
    progress['last_subagent_stop'] = now
    agent_type = input_data.get('agent_type', 'unknown')
    progress['last_agent_type'] = agent_type

    # Count subagent completions
    subagent_counts = progress.get('subagent_counts', {})
    subagent_counts[agent_type] = subagent_counts.get(agent_type, 0) + 1
    progress['subagent_counts'] = subagent_counts
    progress['subagent_count'] = sum(subagent_counts.values())

    # Track parallel execution if we're in a batch
    if 'parallel_execution' in progress:
        parallel = progress['parallel_execution']
        agents = parallel.get('agents', {})

        # Find which task this agent was working on
        agent_id = input_data.get('agent_id', '')
        for task_id, agent_info in agents.items():
            if agent_info.get('agent_id') == agent_id:
                agent_info['status'] = 'completed'
                agent_info['completed_at'] = now

                # Move to completed list
                completed = parallel.get('completed', [])
                if task_id not in completed:
                    completed.append(task_id)
                parallel['completed'] = completed

                # Remove from pending
                pending = parallel.get('pending', [])
                if task_id in pending:
                    pending.remove(task_id)
                parallel['pending'] = pending
                break

    # Write progress atomically
    temp_file = PROGRESS_FILE.with_suffix('.tmp')
    try:
        temp_file.write_text(json.dumps(progress, indent=2))
        temp_file.rename(PROGRESS_FILE)
    except Exception:
        try:
            temp_file.unlink(missing_ok=True)
        except Exception:
            pass

    # Append event to events file
    events = []
    if EVENTS_FILE.exists():
        try:
            events = json.loads(EVENTS_FILE.read_text())
        except Exception:
            events = []

    events.append({
        'timestamp': now,
        'type': 'subagent_complete',
        'agent_type': agent_type,
        'agent_id': input_data.get('agent_id', 'unknown')[:20]
    })

    # Keep only last 50 events
    events = events[-50:]

    try:
        temp_events = EVENTS_FILE.with_suffix('.tmp')
        temp_events.write_text(json.dumps(events, indent="\t") + "\n")
        temp_events.rename(EVENTS_FILE)
    except Exception:
        try:
            temp_events.unlink(missing_ok=True)
        except Exception:
            pass

    sys.exit(0)


if __name__ == '__main__':
    main()
