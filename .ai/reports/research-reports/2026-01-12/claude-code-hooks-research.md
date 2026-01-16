# Perplexity Research: Claude Code CLI Hooks System (January 2026)

**Date**: 2026-01-12
**Agent**: perplexity-expert
**Search Type**: Synthesized from codebase analysis + existing research (Perplexity API unavailable)

## Query Summary

Researched Claude Code hooks system to understand:
1. Available hook types (PreToolUse, PostToolUse, Stop, SubagentStop, UserPromptSubmit, PreCompact)
2. Hook levels (Global, Agent, SlashCommand)
3. Hook configuration (YAML frontmatter, settings.json)
4. Hook payload/context (environment variables, JSON input)
5. Recent changes (late 2025 / early 2026)
6. Best practices for progress tracking and event logging

## Executive Summary

Claude Code hooks provide **8 event types** that fire at specific lifecycle points during Claude's execution. Hooks can be configured at **two primary levels**: global (in `.claude/settings.json`) and slash command-specific (in YAML frontmatter). The hook system receives JSON input via stdin with context-specific data and supports shell commands that can block, modify, or log operations.

**Key Finding for E2B Orchestration**: Hooks are ideal for real-time monitoring because they fire synchronously at exact event points. The recommended pattern is to POST events from hook scripts to a FastAPI server for real-time WebSocket broadcasting to the UI.

---

## 1. Available Hook Types (8 Total)

Claude Code supports **8 hook event types** as of January 2026:

| Hook Type | When It Fires | Frequency | Can Block? | Best Use Case |
|-----------|--------------|-----------|------------|---------------|
| `PreToolUse` | Before any tool call executes | HIGH | Yes (exit 2) | Block dangerous commands, validate inputs, log tool use |
| `PostToolUse` | After any tool call completes | HIGH | No | Heartbeats, format output, validate results, track progress |
| `UserPromptSubmit` | Before user prompt is processed | LOW | Yes (exit 2) | Validation, security filtering, context injection |
| `Notification` | When Claude requires user input | LOW | No | Desktop notifications, audio alerts |
| `Stop` | When Claude finishes responding | MEDIUM | Yes (exit 2) | Completion messages, TTS, task validation, session logging |
| `SubagentStop` | When a sub-agent (Task tool) completes | MEDIUM | No | Agent tracking, parallel task monitoring |
| `SessionStart` | When a session begins | LOW | No | Environment setup, context loading |
| `PreCompact` | Before context compaction | LOW | No | Memory management, save critical state |

### Hook Evolution Timeline

- **2025 Initial Release**: 6 hook types (PreToolUse, PostToolUse, UserPromptSubmit, Notification, Stop, SubagentStop)
- **Late 2025 Additions**: SessionStart, PreCompact
- **January 2026**: 8 hook event types supported (current state)

---

## 2. Hook Levels and Configuration Locations

### Level 1: Global Hooks (Project or User Level)

**File Locations**:
- **Project-level**: `.claude/settings.json` (checked into repo)
- **User-level**: `~/.claude/settings.json` (personal settings)

Project-level settings take precedence over user-level.

**Configuration Structure**:
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

### Level 2: Slash Command Level (YAML Frontmatter)

**File Location**: `.claude/commands/*.md`

Slash commands can define their own hooks in YAML frontmatter. These hooks **only fire when that specific command is invoked**.

**Example from `/alpha:implement`**:
```yaml
---
description: Implement all tasks for a feature
argument-hint: <feature-id>
model: opus
allowed-tools: [Read, Write, Edit, Grep, Glob, Bash, Task, TodoWrite]
hooks:
  PostToolUse:
    - matcher: "TodoWrite"
      hooks:
        - type: command
          command: "python3 $CLAUDE_PROJECT_DIR/.claude/hooks/task_progress.py || true"
          timeout: 3
  SubagentStop:
    - matcher: ""
      hooks:
        - type: command
          command: "python3 $CLAUDE_PROJECT_DIR/.claude/hooks/subagent_complete.py || true"
          timeout: 3
  Stop:
    - matcher: ""
      hooks:
        - type: command
          command: "python3 $CLAUDE_PROJECT_DIR/.claude/hooks/feature_complete.py || true"
          timeout: 5
---
```

### Level 3: Agent-Level Hooks (Sub-Agents)

**LIMITATION**: Sub-agents spawned via the Task tool inherit the parent's hook configuration. There is no mechanism to define hooks specific to individual sub-agents. However, `SubagentStop` fires specifically when sub-agents complete, allowing tracking of agent hierarchy.

---

## 3. Hook Configuration Details

### Matcher Patterns

The `matcher` field uses **regex patterns** to filter which tools/events trigger the hook:

| Matcher Value | Effect |
|---------------|--------|
| `""` (empty string) | Matches ALL tools/events |
| `"Bash"` | Matches only Bash tool |
| `"Bash\|Write\|Edit"` | Matches Bash, Write, or Edit tools |
| `"Read\|Grep\|Glob"` | Matches file reading tools |
| `".*"` | Matches ALL (explicit regex) |

### Hook Types

Currently only `"command"` type is supported:

```json
{
  "type": "command",
  "command": "bash .claude/hooks/my-hook.sh",
  "timeout": 5
}
```

**Future**: Claude Code may add `"prompt"` type for LLM-powered hooks:
```json
{
  "type": "prompt",
  "prompt": "Verify task completion criteria. Return approve if all tests pass.",
  "timeout": 30
}
```

### Timeout

- **Default**: 60 seconds for commands
- **Recommended**: 3-5 seconds for performance
- **Maximum**: Not explicitly documented, but long timeouts risk blocking Claude

---

## 4. Hook Payload/Context

### Input Data (JSON via stdin)

Each hook receives JSON on stdin with context-specific data:

#### PreToolUse Input
```json
{
  "tool_name": "Bash",
  "tool_input": {
    "command": "git status",
    "description": "Check git status"
  },
  "session_id": "abc123"
}
```

#### PostToolUse Input
```json
{
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.ts"
  },
  "tool_response": {
    "success": true
  },
  "session_id": "abc123"
}
```

#### UserPromptSubmit Input
```json
{
  "prompt": "/implement feature",
  "session_id": "abc123",
  "cwd": "/working/directory",
  "hook_event_name": "UserPromptSubmit"
}
```

#### Stop / SubagentStop Input
```json
{
  "session_id": "abc123",
  "stop_hook_active": false,
  "transcript_path": "/path/to/transcript.jsonl"
}
```

### Environment Variables

Hooks have access to these environment variables:

| Variable | Description |
|----------|-------------|
| `CLAUDE_PROJECT_DIR` | Project root directory |
| `CLAUDE_TOOL` | Name of the tool being used (PreToolUse/PostToolUse) |
| `CLAUDE_PARAM_*` | Tool parameters (e.g., `CLAUDE_PARAM_command`) |
| `CLAUDE_SESSION_ID` | Current session identifier |

### Exit Code Semantics

| Exit Code | Effect |
|-----------|--------|
| `0` | Success, continue normally |
| `1` | Error (logged but continues) |
| `2` | **Block operation** (PreToolUse/UserPromptSubmit) or **block stopping** (Stop) |

### Output Handling

| Stream | Effect |
|--------|--------|
| `stdout` | Content is added to Claude's context (UserPromptSubmit) or displayed in transcript |
| `stderr` | Displayed as error messages |

---

## 5. Recent Changes (Late 2025 / Early 2026)

### October 2025: Plugin System Launch
Claude Code introduced a plugin system for packaging and sharing:
- Custom slash commands
- Sub-agents
- MCP servers
- Hooks

**Install plugins**: `/plugin install <name>`
**Add marketplaces**: `/plugin marketplace add user/repo`

### November 2025: Slash Command Hooks
YAML frontmatter hooks added to slash commands, enabling command-specific hook configuration.

### December 2025: Enhanced Output Modes
- **UserPromptSubmit additionalContext**: Hook stdout can inject additional context into Claude's prompt
- **SubagentStop**: Now includes more detailed output about sub-agent execution

### January 2026: Hook Stability
No major changes - hooks system is considered stable. Focus has shifted to:
- Performance optimization (faster hook execution)
- Better error handling (graceful degradation)
- Improved documentation

---

## 6. Best Practices for Progress Tracking

### Pattern 1: File-Based Progress State

Write progress to a JSON file that can be polled by external systems:

```python
#!/usr/bin/env python3
"""PostToolUse hook for heartbeat signals."""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

PROGRESS_FILE = Path('.initiative-progress.json')

def main():
    try:
        input_data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)  # Fail silently

    # Load existing progress
    progress = {}
    if PROGRESS_FILE.exists():
        progress = json.loads(PROGRESS_FILE.read_text())

    # Update heartbeat
    now = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    progress['last_heartbeat'] = now
    progress['last_tool'] = input_data.get('tool_name', 'unknown')

    # Track tool counts
    tool_counts = progress.get('tool_counts', {})
    tool_name = input_data.get('tool_name', 'unknown')
    tool_counts[tool_name] = tool_counts.get(tool_name, 0) + 1
    progress['tool_counts'] = tool_counts
    progress['tool_count'] = sum(tool_counts.values())

    # Atomic write
    temp_file = PROGRESS_FILE.with_suffix('.tmp')
    temp_file.write_text(json.dumps(progress, indent=2))
    temp_file.rename(PROGRESS_FILE)

    sys.exit(0)

if __name__ == '__main__':
    main()
```

### Pattern 2: HTTP POST to Orchestrator

For E2B sandbox monitoring, POST events directly to FastAPI server:

```python
#!/usr/bin/env python3
"""PostToolUse hook that POSTs events to orchestrator."""

import json
import sys
import urllib.request
from datetime import datetime, timezone

ORCHESTRATOR_URL = "http://localhost:9000/api/events"

def main():
    try:
        input_data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    event = {
        "type": "tool_use",
        "tool_name": input_data.get("tool_name"),
        "tool_input": input_data.get("tool_input"),
        "session_id": input_data.get("session_id"),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    try:
        req = urllib.request.Request(
            ORCHESTRATOR_URL,
            data=json.dumps(event).encode('utf-8'),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=2) as resp:
            pass  # Fire and forget
    except Exception:
        pass  # Don't block Claude on HTTP errors

    sys.exit(0)

if __name__ == '__main__':
    main()
```

### Pattern 3: Session-Based Logging

Organize logs by session ID for easy debugging:

```
.claude/logs/hooks/{session-id}/
├── pre_tool_use.json
├── post_tool_use.json
├── stop.json
├── subagent_stop.json
├── notification.json
└── chat.json (transcript copy)
```

### Pattern 4: SubagentStop for Parallel Task Tracking

Track completion of parallel sub-agents (Task tool invocations):

```python
#!/usr/bin/env python3
"""SubagentStop hook for tracking parallel task completions."""

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
        progress = json.loads(PROGRESS_FILE.read_text())

    now = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    progress['last_heartbeat'] = now
    progress['last_subagent_stop'] = now

    # Count subagent completions
    subagent_count = progress.get('subagent_count', 0) + 1
    progress['subagent_count'] = subagent_count

    # Atomic write
    temp_file = PROGRESS_FILE.with_suffix('.tmp')
    temp_file.write_text(json.dumps(progress, indent=2))
    temp_file.rename(PROGRESS_FILE)

    sys.exit(0)

if __name__ == '__main__':
    main()
```

---

## 7. E2B Sandbox Integration Pattern

For monitoring Claude Code sessions in E2B sandboxes, use this architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                     E2B Sandbox (Claude Code)                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Claude Code Session                                        │ │
│  │   ↓                                                        │ │
│  │ PreToolUse Hook → POST /api/events → FastAPI Server        │ │
│  │ PostToolUse Hook → POST /api/events → FastAPI Server       │ │
│  │ SubagentStop Hook → POST /api/events → FastAPI Server      │ │
│  │ Stop Hook → POST /api/events → FastAPI Server              │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                              │
                              ↓ HTTP POST
┌─────────────────────────────────────────────────────────────────┐
│                     FastAPI Orchestrator                        │
│  ┌────────────┐    ┌──────────────┐    ┌─────────────────────┐ │
│  │ /api/events│ →  │ Event Router │ →  │ WebSocket Manager   │ │
│  │ (POST)     │    │              │    │ broadcast_event()   │ │
│  └────────────┘    └──────────────┘    └─────────────────────┘ │
│                                                 │               │
│                                                 ↓               │
│                                        ┌─────────────────────┐ │
│                                        │ PostgreSQL Database │ │
│                                        │ (Event Persistence) │ │
│                                        └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓ WebSocket
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React/Vue)                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Real-Time Event Stream                                     │ │
│  │ - Tool use events (PreToolUse)                             │ │
│  │ - Completion events (PostToolUse)                          │ │
│  │ - Sub-agent completions (SubagentStop)                     │ │
│  │ - Session completions (Stop)                               │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Notes

1. **Hook scripts must be lightweight**: Use `urllib.request` (built-in) instead of `requests` to avoid dependency issues
2. **Always fail silently**: HTTP errors should not block Claude Code execution
3. **Use short timeouts**: 2-3 seconds for HTTP requests, 3-5 seconds for hook timeout
4. **Include `|| true`**: Prevent hook failures from blocking Claude
5. **Atomic file writes**: Use temp file + rename pattern for file-based progress

---

## 8. Complete settings.json Example

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/validate-commit-message.sh",
            "timeout": 5
          },
          {
            "type": "command",
            "command": "uv run $CLAUDE_PROJECT_DIR/.claude/hooks/pre_tool_use.py",
            "timeout": 5
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "uv run $CLAUDE_PROJECT_DIR/.claude/hooks/post_tool_use.py || true",
            "timeout": 5
          },
          {
            "type": "command",
            "command": "python3 $CLAUDE_PROJECT_DIR/.claude/hooks/heartbeat.py || true",
            "timeout": 3
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "uv run $CLAUDE_PROJECT_DIR/.claude/hooks/notification.py --notify || true",
            "timeout": 5
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "uv run $CLAUDE_PROJECT_DIR/.claude/hooks/stop.py --chat || true",
            "timeout": 5
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "uv run $CLAUDE_PROJECT_DIR/.claude/hooks/subagent_stop.py || true",
            "timeout": 5
          },
          {
            "type": "command",
            "command": "python3 $CLAUDE_PROJECT_DIR/.claude/hooks/subagent_complete.py || true",
            "timeout": 3
          }
        ]
      }
    ]
  }
}
```

---

## Sources & Citations

Based on synthesized information from:

1. **Project Implementation**: `.claude/settings.json` and `.claude/hooks/` directory
2. **Existing Research**: `.ai/reports/research-reports/2025-12-17/context7-claude-code-hooks.md`
3. **Existing Research**: `.ai/reports/research-reports/2026-01-09/perplexity-claude-code-hooks-agent-progress.md`
4. **Existing Research**: `.ai/reports/research-reports/2026-01-12/multi-agent-orchestration-streaming-analysis.md`
5. **Slash Command Example**: `.claude/commands/alpha/implement.md`
6. **Claude Code Documentation**: Via Context7 (anthropics/claude-code)
7. **Hook Mastery Guide**: Via Context7 (disler/claude-code-hooks-mastery)

---

## Key Takeaways

1. **8 hook types available**: PreToolUse, PostToolUse, UserPromptSubmit, Notification, Stop, SubagentStop, SessionStart, PreCompact

2. **Two configuration levels**: Global (settings.json) and slash command-specific (YAML frontmatter)

3. **JSON input via stdin**: All hooks receive structured JSON with context-specific data

4. **Exit code 2 blocks operations**: Use for validation hooks that need to prevent dangerous actions

5. **Best for E2B monitoring**: PostToolUse (heartbeats) + SubagentStop (parallel tracking) + Stop (completion)

6. **HTTP POST pattern works**: Hook scripts can POST events to external servers for real-time monitoring

7. **Always fail silently**: Use `|| true` and try/except to never block Claude on hook errors

8. **Keep hooks fast**: 3-5 second timeout recommended, atomic file operations for writes

---

## Related Searches

- Claude Code plugin development for enhanced hooks
- MCP server integration for progress reporting
- WebSocket-based orchestrator notifications
- Real-time agent monitoring dashboards
- E2B sandbox stdout/stderr streaming patterns
