#!/usr/bin/env python3
"""
PostToolUse hook for task progress tracking (triggered on TodoWrite).

Updates .initiative-progress.json with task state changes from TodoWrite calls.
This provides more granular progress tracking for the orchestrator UI.

Input (JSON from stdin):
{
    "tool_name": "TodoWrite",
    "tool_input": {
        "todos": [
            {"content": "Task description", "status": "completed", "activeForm": "..."}
        ]
    },
    "session_id": "abc123"
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
    """Process PostToolUse hook for TodoWrite calls."""
    try:
        input_data = json.load(sys.stdin)
    except Exception:
        # Fail silently if no input - don't block Claude
        sys.exit(0)

    # Only process TodoWrite calls
    tool_name = input_data.get('tool_name', '')
    if tool_name != 'TodoWrite':
        sys.exit(0)

    # Get the todos from the input
    tool_input = input_data.get('tool_input', {})
    todos = tool_input.get('todos', [])

    if not todos:
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
    progress['last_tool'] = 'TodoWrite'

    # Count todo statuses
    completed_count = sum(1 for t in todos if t.get('status') == 'completed')
    in_progress_count = sum(1 for t in todos if t.get('status') == 'in_progress')
    pending_count = sum(1 for t in todos if t.get('status') == 'pending')

    # Find the current in-progress task
    in_progress_tasks = [t for t in todos if t.get('status') == 'in_progress']
    if in_progress_tasks:
        current_todo = in_progress_tasks[0]
        # Update current task info if we can extract task ID
        content = current_todo.get('content', '')
        active_form = current_todo.get('activeForm', content)

        # Try to extract task ID from content (e.g., "T1: Task name" or "[T1] Task name")
        task_id = None
        for prefix in ['T', '[T']:
            if prefix in content:
                try:
                    start = content.index(prefix)
                    end = start + 1
                    while end < len(content) and (content[end].isdigit() or content[end] in ':]'):
                        end += 1
                    task_id = content[start:end].strip(':] ')
                    if task_id.startswith('['):
                        task_id = task_id[1:]
                    if task_id.endswith(']'):
                        task_id = task_id[:-1]
                    break
                except ValueError:
                    continue

        if 'current_task' not in progress:
            progress['current_task'] = {}

        progress['current_task']['name'] = content[:100]
        progress['current_task']['status'] = 'in_progress'
        progress['current_task']['started_at'] = now
        if task_id:
            progress['current_task']['id'] = task_id

    # Store todo counts for reference
    progress['todo_summary'] = {
        'completed': completed_count,
        'in_progress': in_progress_count,
        'pending': pending_count,
        'total': len(todos)
    }

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

    # Also append an event to the events file
    events = []
    if EVENTS_FILE.exists():
        try:
            events = json.loads(EVENTS_FILE.read_text())
        except Exception:
            events = []

    events.append({
        'timestamp': now,
        'type': 'todo_update',
        'completed': completed_count,
        'in_progress': in_progress_count,
        'pending': pending_count
    })

    # Keep only last 50 events
    events = events[-50:]

    try:
        temp_events = EVENTS_FILE.with_suffix('.tmp')
        temp_events.write_text(json.dumps(events, indent="\t"))
        temp_events.rename(EVENTS_FILE)
    except Exception:
        try:
            temp_events.unlink(missing_ok=True)
        except Exception:
            pass

    sys.exit(0)


if __name__ == '__main__':
    main()
