#!/usr/bin/env python3
"""
SubagentStop hook for tracking Task tool completions.

Updates .initiative-progress.json when a subagent (Task tool) completes.
This provides additional progress signals beyond tool-level heartbeats.

Input (JSON from stdin):
{
    "session_id": "abc123",
    "agent_type": "Explore",
    "result": "..."
}

Output (JSON to stdout):
{"decision": "approve"}  # Always approve - we don't block subagents
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

PROGRESS_FILE = Path('.initiative-progress.json')


def main():
    """Process SubagentStop hook invocation."""
    try:
        input_data = json.load(sys.stdin)
    except Exception:
        # Output approval and exit - don't block
        print(json.dumps({"decision": "approve"}))
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
    progress['last_subagent_stop'] = now

    # Track agent type if provided
    agent_type = input_data.get('agent_type', 'unknown')
    progress['last_agent_type'] = agent_type

    # Increment subagent count
    subagent_count = progress.get('subagent_count', 0) + 1
    progress['subagent_count'] = subagent_count

    # Track subagent counts by type
    subagent_counts = progress.get('subagent_counts', {})
    subagent_counts[agent_type] = subagent_counts.get(agent_type, 0) + 1
    progress['subagent_counts'] = subagent_counts

    # Preserve session ID if provided
    if input_data.get('session_id'):
        progress['session_id'] = input_data['session_id']

    # Write atomically
    temp_file = PROGRESS_FILE.with_suffix('.tmp')
    try:
        temp_file.write_text(json.dumps(progress, indent=2))
        temp_file.rename(PROGRESS_FILE)
    except Exception:
        try:
            temp_file.unlink(missing_ok=True)
        except Exception:
            pass

    # Output approval - always allow subagent completion
    print(json.dumps({"decision": "approve"}))
    sys.exit(0)


if __name__ == '__main__':
    main()
