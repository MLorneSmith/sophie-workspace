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


def extract_task_id(text: str) -> str | None:
    """Extract task ID from text using pattern matching.

    Matches patterns in order of priority:
    1. Semantic IDs: "[S1692.I1.F1.T1] Task name" or "S1692.I1.F1.T1: Task name"
    2. Legacy IDs: "[T1] Task name", "T1: Task name", "T1 Task name"

    Returns the task ID (semantic or legacy format) or None if no match.
    """
    import re

    if not text:
        return None

    # Priority 1: Match semantic task IDs (S#.I#.F#.T#)
    # Matches: [S1692.I1.F1.T1], S1692.I1.F1.T1:, S1692.I1.F1.T1 (space)
    semantic_patterns = [
        r'\[(S\d+\.I\d+\.F\d+\.T\d+)\]',  # [S1692.I1.F1.T1]
        r'(S\d+\.I\d+\.F\d+\.T\d+):',      # S1692.I1.F1.T1:
        r'(S\d+\.I\d+\.F\d+\.T\d+)\s',     # S1692.I1.F1.T1 (followed by space)
    ]

    for pattern in semantic_patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1)

    # Priority 2: Match legacy task IDs (T#)
    legacy_patterns = [
        r'\[(T\d+)\]',  # [T1]
        r'(T\d+):',      # T1:
        r'(T\d+)\s',     # T1 (followed by space)
    ]

    for pattern in legacy_patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1)

    return None


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

        # Try to extract task ID from content or activeForm
        task_id = extract_task_id(content) or extract_task_id(active_form)

        # Fallback: Generate placeholder ID from todo index if no pattern match
        if not task_id:
            # Find this todo's position among all todos
            for idx, todo in enumerate(todos):
                if todo.get('status') == 'in_progress':
                    task_id = f"T{idx + 1}"
                    break

        if 'current_task' not in progress:
            progress['current_task'] = {}

        progress['current_task']['name'] = content[:100]
        progress['current_task']['status'] = 'in_progress'
        progress['current_task']['started_at'] = now
        # Always set task ID (never leave undefined)
        progress['current_task']['id'] = task_id or 'T1'

    # Extract completed task IDs and populate completed_tasks array
    # This is CRITICAL for orchestrator progress tracking
    completed_task_ids = []
    for todo in todos:
        if todo.get('status') == 'completed':
            content = todo.get('content', '')
            active_form = todo.get('activeForm', content)
            task_id = extract_task_id(content) or extract_task_id(active_form)
            if task_id:
                completed_task_ids.append(task_id)

    # Update completed_tasks array (this is what the orchestrator uses for progress)
    progress['completed_tasks'] = completed_task_ids

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
