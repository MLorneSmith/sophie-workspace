# Context7 Research: Claude Code Hooks System

**Date**: 2025-12-17
**Agent**: context7-expert
**Libraries Researched**: anthropics/claude-code, disler/claude-code-hooks-mastery

## Query Summary

Researched Claude Code hooks system to understand:
1. Available hook types
2. Configuration format and file locations
3. Command/slash-command scoping possibilities
4. Hook events and lifecycle
5. Shell command execution from hooks
6. Notification/alert hook examples

## Findings

### 1. Available Hook Types

Claude Code supports **6 hook event types**:

| Hook Type | When It Fires | Use Case |
|-----------|--------------|----------|
| `UserPromptSubmit` | Before user prompt is processed | Validation, security filtering, context injection |
| `PreToolUse` | Before any tool call executes | Block dangerous commands, validate inputs |
| `PostToolUse` | After any tool call completes | Format output, lint code, validate results |
| `Notification` | When Claude requires user input | Desktop notifications, alerts |
| `Stop` | When Claude finishes responding | Completion messages, TTS, task validation |
| `SubagentStop` | When a sub-agent completes | Sub-agent tracking, logging |
| `SessionStart` | When a session begins | Environment setup, context loading |

### 2. Configuration Format and File Locations

**Configuration File**: `.claude/settings.json` (project-level) or `~/.claude/settings.json` (user-level)

**Basic Structure**:
```json
{
  "hooks": {
    "HookType": [
      {
        "matcher": "ToolName|Pattern|RegexPattern",
        "hooks": [
          {
            "type": "command",
            "command": "path/to/script.py",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

**Key Configuration Fields**:
- `matcher`: Regex pattern to filter which tools/events trigger the hook (empty string = all)
- `type`: Currently only `"command"` is supported
- `command`: Shell command to execute (can use `$CLAUDE_PROJECT_DIR`)
- `timeout`: Execution timeout in seconds

### 3. Command/Slash-Command Scoping

**LIMITATION DISCOVERED**: Claude Code hooks **cannot be scoped to specific slash commands**.

The hook system operates at these levels:
- **Global**: Apply to all sessions
- **Tool-level**: Filter by tool name (e.g., `"Bash"`, `"Edit|Write"`)
- **Pattern-level**: Use regex matchers for tool inputs

**No mechanism exists to:**
- Trigger hooks only for specific `/command` invocations
- Detect which slash command initiated the session
- Scope hooks to command completion

**Workaround for `/initiative` completion alert**:

The hook script would need to implement its own detection logic by parsing the transcript.

### 4. Hook Events and Input Data

Each hook receives JSON on stdin with context-specific data:

**Stop Hook Input**:
```json
{
  "session_id": "abc123",
  "stop_hook_active": false,
  "transcript_path": "/path/to/transcript.jsonl"
}
```

**PreToolUse Input**:
```json
{
  "tool_name": "Bash",
  "tool_input": {
    "command": "git status",
    "description": "Check git status"
  }
}
```

**PostToolUse Input**:
```json
{
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.ts"
  },
  "tool_response": {
    "success": true
  }
}
```

### 5. Shell Command Execution from Hooks

**Exit Codes Control Flow**:
- `exit 0`: Success, continue normally
- `exit 2`: Block the operation (PreToolUse/UserPromptSubmit) or block stopping (Stop)

**Stdout/Stderr Behavior**:
- `stdout`: Content is added to context (UserPromptSubmit) or displayed
- `stderr`: Displayed as error messages

**Playing Sounds (Linux/WSL)**:

```bash
# Using paplay (PulseAudio)
paplay /path/to/sound.wav

# Using aplay (ALSA)
aplay /path/to/sound.wav

# Using ffplay (quiet mode)
ffplay -nodisp -autoexit /path/to/sound.wav
```

**Desktop Notifications (Linux)**:

```bash
notify-send "Claude Code" "Task completed!"
```

### 6. Notification/Alert Hook Examples

**Desktop Notification Hook** (settings.json):
```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "notify-send 'Claude Code' 'Awaiting your input'"
          }
        ]
      }
    ]
  }
}
```

**Stop Hook with Command-Specific Detection** (Python):
```python
#!/usr/bin/env -S uv run --script
import json
import sys
import subprocess
from pathlib import Path

input_data = json.load(sys.stdin)
transcript_path = input_data.get('transcript_path', '')

ALERT_COMMANDS = ['/initiative']
should_alert = False

if transcript_path and Path(transcript_path).exists():
    with open(transcript_path, 'r') as f:
        for line in f:
            if line.strip():
                try:
                    entry = json.loads(line)
                    if entry.get('type') == 'user':
                        content = entry.get('content', '')
                        for cmd in ALERT_COMMANDS:
                            if cmd in content:
                                should_alert = True
                                break
                except json.JSONDecodeError:
                    pass
            if should_alert:
                break

if should_alert:
    subprocess.run(['paplay', '/path/to/initiative-complete.wav'], check=False)
    subprocess.run(['notify-send', '-u', 'critical', 
                   'Initiative Complete', 
                   'Your /initiative command has finished!'], check=False)

sys.exit(0)
```

## Key Takeaways

1. **No native command scoping**: Hooks cannot be scoped to specific slash commands. Detection must happen in the hook script itself.

2. **Stop hook is the right choice**: For completion alerts, use the `Stop` hook which fires when Claude finishes responding.

3. **Transcript analysis required**: To detect which command was used, parse the `transcript_path` JSONL file passed to the Stop hook.

4. **Exit code 2 blocks**: Using `exit 2` in a Stop hook blocks Claude from stopping (forces continuation).

5. **Sound playback options**: On Linux/WSL, use `paplay`, `aplay`, or `ffplay` for audio alerts.

6. **Project already has Stop hook**: The existing `.claude/hooks/stop.py` can be modified to add command-specific alerts.

## Recommended Implementation

To add an audible alert ONLY when `/initiative` completes:

1. Modify `.claude/hooks/stop.py` to detect `/initiative` in transcript
2. Add audio playback when detected
3. Optionally add desktop notification

**File to modify**: `/home/msmith/projects/2025slideheroes/.claude/hooks/stop.py`

**Detection approach**: Parse `transcript_path` JSONL for `/initiative` command presence.

## Sources

- Claude Code via Context7 (anthropics/claude-code)
- claude-code-hooks-mastery via Context7 (disler/claude-code-hooks-mastery)
