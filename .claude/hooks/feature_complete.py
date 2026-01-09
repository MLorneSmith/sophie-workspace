#!/usr/bin/env python3
"""
Stop hook for feature implementation completion.

Updates .initiative-progress.json with final status when the /alpha:implement
command finishes (either successfully or due to error/context limit).

This ensures the orchestrator always knows when a feature session ends.

Input (JSON from stdin):
{
    "session_id": "abc123",
    "stop_reason": "end_turn" | "tool_use" | "max_tokens" | etc.
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
    """Process Stop hook invocation."""
    try:
        input_data = json.load(sys.stdin)
    except Exception:
        input_data = {}

    # Load existing progress file
    progress = {}
    if PROGRESS_FILE.exists():
        try:
            progress = json.loads(PROGRESS_FILE.read_text())
        except Exception:
            pass

    # Update heartbeat and stop timestamp
    now = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    progress['last_heartbeat'] = now
    progress['session_ended_at'] = now

    # Capture stop reason
    stop_reason = input_data.get('stop_reason', 'unknown')
    progress['stop_reason'] = stop_reason

    # Determine final status based on progress state
    completed_tasks = progress.get('completed_tasks', [])
    failed_tasks = progress.get('failed_tasks', [])
    current_status = progress.get('status', 'unknown')

    if current_status == 'completed':
        final_status = 'completed'
    elif failed_tasks:
        final_status = 'partial'  # Some tasks failed
    elif stop_reason in ('max_tokens', 'context_limit'):
        final_status = 'context_limit'
    elif current_status == 'in_progress':
        final_status = 'interrupted'  # Was in progress but stopped
    else:
        final_status = current_status

    progress['final_status'] = final_status

    # Calculate session summary
    summary = {
        'completed_count': len(completed_tasks),
        'failed_count': len(failed_tasks),
        'tool_count': progress.get('tool_count', 0),
        'subagent_count': progress.get('subagent_count', 0),
        'stop_reason': stop_reason
    }
    progress['session_summary'] = summary

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

    # Append final event to events file
    events = []
    if EVENTS_FILE.exists():
        try:
            events = json.loads(EVENTS_FILE.read_text())
        except Exception:
            events = []

    events.append({
        'timestamp': now,
        'type': 'session_end',
        'final_status': final_status,
        'stop_reason': stop_reason,
        'completed_tasks': len(completed_tasks),
        'failed_tasks': len(failed_tasks)
    })

    # Keep only last 50 events
    events = events[-50:]

    try:
        temp_events = EVENTS_FILE.with_suffix('.tmp')
        temp_events.write_text(json.dumps(events, indent=2))
        temp_events.rename(EVENTS_FILE)
    except Exception:
        try:
            temp_events.unlink(missing_ok=True)
        except Exception:
            pass

    sys.exit(0)


if __name__ == '__main__':
    main()
