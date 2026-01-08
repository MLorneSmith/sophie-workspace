#!/bin/bash
#
# Install heartbeat hooks into an E2B sandbox
#
# This script copies the necessary hooks and settings to enable
# tool-based heartbeat reporting in sandboxes.
#
# Usage:
#   ./install-sandbox-hooks.sh <sandbox-id>
#
# Or from TypeScript:
#   await sandbox.commands.run("bash /path/to/install-sandbox-hooks.sh")
#

set -e

SANDBOX_ID="${1:-}"
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-/home/user/project}"
HOOKS_DIR="$PROJECT_DIR/.claude/hooks"

# Ensure hooks directory exists
mkdir -p "$HOOKS_DIR"

# Copy heartbeat hook
cat > "$HOOKS_DIR/heartbeat.py" << 'HEARTBEAT_EOF'
#!/usr/bin/env python3
"""
PostToolUse hook for heartbeat signals.
Updates .initiative-progress.json on every tool call.
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

PROGRESS_FILE = Path('.initiative-progress.json')

def main():
    try:
        input_data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    progress = {}
    if PROGRESS_FILE.exists():
        try:
            progress = json.loads(PROGRESS_FILE.read_text())
        except Exception:
            pass

    now = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    progress['last_heartbeat'] = now

    tool_name = input_data.get('tool_name', 'unknown')
    progress['last_tool'] = tool_name

    if input_data.get('session_id'):
        progress['session_id'] = input_data['session_id']

    tool_counts = progress.get('tool_counts', {})
    tool_counts[tool_name] = tool_counts.get(tool_name, 0) + 1
    progress['tool_counts'] = tool_counts
    progress['tool_count'] = sum(tool_counts.values())

    temp_file = PROGRESS_FILE.with_suffix('.tmp')
    try:
        temp_file.write_text(json.dumps(progress, indent=2))
        temp_file.rename(PROGRESS_FILE)
    except Exception:
        try:
            temp_file.unlink(missing_ok=True)
        except Exception:
            pass

    sys.exit(0)

if __name__ == '__main__':
    main()
HEARTBEAT_EOF

chmod +x "$HOOKS_DIR/heartbeat.py"

# Copy subagent completion hook
cat > "$HOOKS_DIR/subagent_complete.py" << 'SUBAGENT_EOF'
#!/usr/bin/env python3
"""
SubagentStop hook for tracking Task tool completions.
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

PROGRESS_FILE = Path('.initiative-progress.json')

def main():
    try:
        input_data = json.load(sys.stdin)
    except Exception:
        print(json.dumps({"decision": "approve"}))
        sys.exit(0)

    progress = {}
    if PROGRESS_FILE.exists():
        try:
            progress = json.loads(PROGRESS_FILE.read_text())
        except Exception:
            pass

    now = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    progress['last_heartbeat'] = now
    progress['last_subagent_stop'] = now

    agent_type = input_data.get('agent_type', 'unknown')
    progress['last_agent_type'] = agent_type

    subagent_count = progress.get('subagent_count', 0) + 1
    progress['subagent_count'] = subagent_count

    subagent_counts = progress.get('subagent_counts', {})
    subagent_counts[agent_type] = subagent_counts.get(agent_type, 0) + 1
    progress['subagent_counts'] = subagent_counts

    if input_data.get('session_id'):
        progress['session_id'] = input_data['session_id']

    temp_file = PROGRESS_FILE.with_suffix('.tmp')
    try:
        temp_file.write_text(json.dumps(progress, indent=2))
        temp_file.rename(PROGRESS_FILE)
    except Exception:
        try:
            temp_file.unlink(missing_ok=True)
        except Exception:
            pass

    print(json.dumps({"decision": "approve"}))
    sys.exit(0)

if __name__ == '__main__':
    main()
SUBAGENT_EOF

chmod +x "$HOOKS_DIR/subagent_complete.py"

# Ensure settings.json includes the hooks
SETTINGS_FILE="$PROJECT_DIR/.claude/settings.json"

if [ -f "$SETTINGS_FILE" ]; then
    # Check if heartbeat hook is already configured
    if ! grep -q "heartbeat.py" "$SETTINGS_FILE" 2>/dev/null; then
        echo "Warning: settings.json exists but may not have heartbeat hooks configured"
        echo "Please ensure hooks are configured in .claude/settings.json"
    fi
else
    echo "Warning: settings.json not found at $SETTINGS_FILE"
    echo "Hooks installed but not configured in settings"
fi

echo "Heartbeat hooks installed successfully in $HOOKS_DIR"
echo "  - heartbeat.py (PostToolUse)"
echo "  - subagent_complete.py (SubagentStop)"
