#!/usr/bin/env python3
"""
PostToolUse hook for heartbeat signals.

Updates .initiative-progress.json on every tool call to provide
reliable heartbeat signals for the orchestrator UI.

This hook runs after EVERY tool invocation, ensuring the orchestrator
can detect agent activity with sub-minute precision.

Input (JSON from stdin):
{
    "tool_name": "Read",
    "tool_input": {...},
    "session_id": "abc123"
}

Output: None (exit 0 for success)
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

PROGRESS_FILE = Path('.initiative-progress.json')


def main():
    """Process PostToolUse hook invocation."""
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
            # Start fresh if file is corrupted
            pass

    # Update heartbeat timestamp (ISO 8601 format with Z suffix)
    now = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    progress['last_heartbeat'] = now

    # Track the tool that was just used
    tool_name = input_data.get('tool_name', 'unknown')
    progress['last_tool'] = tool_name

    # Preserve session ID if provided
    if input_data.get('session_id'):
        progress['session_id'] = input_data['session_id']

    # Track tool usage counts for analytics
    tool_counts = progress.get('tool_counts', {})
    tool_counts[tool_name] = tool_counts.get(tool_name, 0) + 1
    progress['tool_counts'] = tool_counts
    progress['tool_count'] = sum(tool_counts.values())

    # Write atomically using temp file + rename
    # This prevents partial writes if the process is interrupted
    temp_file = PROGRESS_FILE.with_suffix('.tmp')
    try:
        temp_file.write_text(json.dumps(progress, indent=2))
        temp_file.rename(PROGRESS_FILE)
    except Exception:
        # Clean up temp file if rename fails
        try:
            temp_file.unlink(missing_ok=True)
        except Exception:
            pass
        # Don't fail the hook - just log and continue
        pass

    sys.exit(0)


if __name__ == '__main__':
    main()
