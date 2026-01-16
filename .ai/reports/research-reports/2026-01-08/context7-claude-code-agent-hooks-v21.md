# Context7 Research: Claude Code Agent Hooks and Progress Tracking

**Date**: 2026-01-08
**Agent**: context7-expert
**Libraries Researched**: anthropics/claude-code, disler/claude-code-hooks-mastery

## Query Summary

Researched Claude Code hooks system to understand:
1. Agent-specific hooks vs regular hooks
2. Hook configuration for progress reporting
3. Use cases for orchestrator integration
4. Heartbeat and activity tracking mechanisms

## Executive Summary

**Key Finding**: Claude Code does NOT have a separate "agent-specific hooks" feature in v2.1. The hooks system is unified across main sessions and subagents, with **SubagentStop** being the only agent-specific hook event. However, the existing hooks system CAN be leveraged for progress tracking through PostToolUse and other events.

**Recommendation for spec-orchestrator.ts**: Use a combination of:
1. **PostToolUse hooks** to write progress/heartbeat data on every tool call
2. **SubagentStop hooks** for completion notifications
3. **External progress file** (current approach is correct but can be enhanced)

## Findings

### 1. Available Hook Types (Complete List)

Claude Code supports **8 hook event types**:

| Hook Type | When It Fires | Progress Tracking Potential |
|-----------|--------------|----------------------------|
| `PreToolUse` | Before any tool call | **HIGH** - Can log activity about to happen |
| `PostToolUse` | After any tool call | **HIGHEST** - Best for heartbeat signals |
| `UserPromptSubmit` | Before user prompt is processed | LOW - Only fires on user input |
| `Notification` | When Claude requires user input | LOW - User interaction only |
| `Stop` | When Claude finishes responding | **HIGH** - Completion signals |
| `SubagentStop` | When a sub-agent completes | **HIGHEST** - Agent-specific! |
| `SessionStart` | At session start | MEDIUM - Initial setup |
| `PreCompact` | Before context compaction | LOW - Memory management |

### 2. SubagentStop Hook - The "Agent-Specific" Hook

This is the closest to "agent-specific" hooks - it fires only when a **subagent** (Task tool invocation) completes:

```json
{
  "SubagentStop": [
    {
      "matcher": "*",
      "hooks": [
        {
          "type": "command",
          "command": "uv run $CLAUDE_PROJECT_DIR/.claude/hooks/subagent_stop.py",
          "timeout": 10
        }
      ]
    }
  ]
}
```

**Input data received by SubagentStop hook**:
```json
{
  "session_id": "abc123",
  "stop_hook_active": false,
  "transcript_path": "/path/to/transcript.jsonl"
}
```

**Output for controlling behavior**:
```json
{
  "decision": "approve|block",
  "reason": "Explanation",
  "systemMessage": "Additional context for Claude"
}
```

### 3. PostToolUse for Heartbeat/Progress Signals

**Best mechanism for reliable progress tracking**. This hook fires after EVERY tool call, making it ideal for heartbeat signals.

```json
{
  "PostToolUse": [
    {
      "matcher": "",  // Empty = all tools
      "hooks": [
        {
          "type": "command",
          "command": "python3 ${CLAUDE_PROJECT_DIR}/.claude/hooks/progress_heartbeat.py",
          "timeout": 5
        }
      ]
    }
  ]
}
```

**Input data received**:
```json
{
  "session_id": "abc123",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.ts"
  },
  "tool_response": {
    "success": true
  }
}
```

**Example progress heartbeat hook** (for orchestrator integration):

```python
#!/usr/bin/env python3
import json
import sys
from datetime import datetime
from pathlib import Path

# Read hook input
input_data = json.load(sys.stdin)
session_id = input_data.get('session_id', 'unknown')
tool_name = input_data.get('tool_name', 'unknown')

# Write heartbeat to progress file
progress_file = Path('.initiative-progress.json')
progress = {}
if progress_file.exists():
    try:
        progress = json.loads(progress_file.read_text())
    except:
        pass

# Update heartbeat timestamp
progress['last_heartbeat'] = datetime.utcnow().isoformat() + 'Z'
progress['last_tool'] = tool_name
progress['tool_count'] = progress.get('tool_count', 0) + 1

progress_file.write_text(json.dumps(progress, indent=2))
sys.exit(0)
```

### 4. Hook Configuration Locations

**Project-level** (`.claude/settings.json`):
```json
{
  "hooks": {
    "PostToolUse": [...],
    "SubagentStop": [...]
  }
}
```

**Plugin-level** (`hooks/hooks.json` in plugin directory):
```json
{
  "description": "Progress tracking hooks",
  "hooks": {
    "PostToolUse": [...],
    "SubagentStop": [...]
  }
}
```

### 5. Hook Output Capabilities

Hooks can:
- **Write to files**: Yes - via command hooks (bash/python/etc.)
- **Send HTTP requests**: Yes - via command hooks with curl/requests
- **Write to stdout**: Yes - content goes to Claude's context
- **Block operations**: Exit code 2 blocks the operation
- **Modify context**: stdout content is added to conversation

**Standard hook output format**:
```json
{
  "continue": true,
  "suppressOutput": false,
  "systemMessage": "Message for Claude"
}
```

### 6. Prompt-Based Hooks (New Feature)

Claude Code now supports **LLM-powered hooks** that use Claude for complex validation:

```json
{
  "type": "prompt",
  "prompt": "Verify task completion, check tests passed. Return 'approve' to stop or 'block' with reason.",
  "timeout": 30
}
```

This could be used for intelligent progress verification.

### 7. Parallel Hook Execution

Multiple hooks on the same event run **in parallel**, not seeing each other's output:

```json
{
  "PostToolUse": [
    {
      "matcher": "",
      "hooks": [
        {"type": "command", "command": "progress-heartbeat.sh", "timeout": 2},
        {"type": "command", "command": "log-activity.sh", "timeout": 2},
        {"type": "prompt", "prompt": "Check operation safety", "timeout": 10}
      ]
    }
  ]
}
```

### 8. Key Limitations Discovered

1. **No native orchestrator integration**: Hooks don't have built-in reporting to external orchestrators
2. **No WebSocket/streaming**: Hooks are fire-and-forget commands
3. **No shared state between hooks**: Must use files or external storage
4. **Timeout constraints**: Default 60s for commands, 30s for prompts
5. **No slash-command scoping**: Cannot trigger hooks only for specific `/commands`

## Recommendations for spec-orchestrator.ts

### Current Implementation Analysis

The current orchestrator uses:
- Progress file polling (`PROGRESS_FILE = ".initiative-progress.json"`)
- 30-second poll interval
- 10-minute stall timeout
- Heartbeat-based health checks

**Current weaknesses**:
1. Progress updates depend on the `/alpha:implement` command writing to the file
2. No guarantee of update frequency
3. Stale data from previous sessions can cause false positives

### Recommended Hook Enhancement

Add a `PostToolUse` hook to the E2B sandbox template that writes heartbeats on every tool call:

```json
// .claude/settings.json in sandbox template
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ${CLAUDE_PROJECT_DIR}/.claude/hooks/heartbeat.py",
            "timeout": 3
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
            "command": "python3 ${CLAUDE_PROJECT_DIR}/.claude/hooks/subagent_complete.py",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

**Benefits**:
1. **Guaranteed heartbeats**: Every tool call updates the timestamp
2. **Activity visibility**: Know exactly what Claude is doing
3. **Better stall detection**: Can distinguish "stuck" from "inactive"
4. **Subagent tracking**: Know when Task tool invocations complete

### Hook Implementation for Heartbeats

```python
#!/usr/bin/env python3
# .claude/hooks/heartbeat.py
import json
import sys
from datetime import datetime
from pathlib import Path

PROGRESS_FILE = Path('.initiative-progress.json')

def main():
    try:
        input_data = json.load(sys.stdin)
    except:
        sys.exit(0)  # Fail silently
    
    # Load existing progress
    progress = {}
    if PROGRESS_FILE.exists():
        try:
            progress = json.loads(PROGRESS_FILE.read_text())
        except:
            pass
    
    # Update heartbeat fields
    progress['last_heartbeat'] = datetime.utcnow().isoformat() + 'Z'
    progress['last_tool'] = input_data.get('tool_name', 'unknown')
    progress['session_id'] = input_data.get('session_id', progress.get('session_id'))
    
    # Track tool usage
    tool_counts = progress.get('tool_counts', {})
    tool_name = input_data.get('tool_name', 'unknown')
    tool_counts[tool_name] = tool_counts.get(tool_name, 0) + 1
    progress['tool_counts'] = tool_counts
    
    # Write atomically
    temp_file = PROGRESS_FILE.with_suffix('.tmp')
    temp_file.write_text(json.dumps(progress, indent=2))
    temp_file.rename(PROGRESS_FILE)
    
    sys.exit(0)

if __name__ == '__main__':
    main()
```

### Orchestrator Polling Enhancement

Update health check to use tool-based heartbeats:

```typescript
// Enhanced health check
async function checkSandboxHealth(instance: SandboxInstance): Promise<HealthCheckResult> {
  // ... existing code ...
  
  // Check tool-based heartbeat (more reliable than custom heartbeat)
  if (progress.last_tool && progress.last_heartbeat) {
    const heartbeatTime = new Date(progress.last_heartbeat).getTime();
    const timeSinceActivity = now - heartbeatTime;
    
    // Tool-based heartbeat should update every few seconds during active work
    if (timeSinceActivity > HEARTBEAT_STALE_TIMEOUT_MS) {
      return {
        healthy: false,
        issue: 'stale_heartbeat',
        message: `No tool activity for ${Math.round(timeSinceActivity / 60000)} minutes`,
        lastTool: progress.last_tool,
        timeSinceHeartbeat: timeSinceActivity
      };
    }
  }
  
  return { healthy: true };
}
```

## Alternative Approaches

### 1. MCP-Based Progress Reporting

Create an MCP server that the Claude session can call to report progress:

```typescript
// progress-reporter MCP server
const server = new Server({
  name: "progress-reporter",
  version: "1.0.0"
});

server.setRequestHandler("tools/call", async (request) => {
  if (request.params.name === "report_progress") {
    const { feature_id, task_id, status } = request.params.arguments;
    // Write to shared storage / notify orchestrator
    await notifyOrchestrator({ feature_id, task_id, status });
    return { success: true };
  }
});
```

**Pros**: Claude can proactively report progress
**Cons**: Requires MCP server setup in sandbox, more complex

### 2. Webhook-Based Notifications

Use a PostToolUse hook to POST progress to an HTTP endpoint:

```python
#!/usr/bin/env python3
import json
import sys
import requests
from os import environ

ORCHESTRATOR_URL = environ.get('ORCHESTRATOR_WEBHOOK_URL')

def main():
    if not ORCHESTRATOR_URL:
        sys.exit(0)
    
    input_data = json.load(sys.stdin)
    
    try:
        requests.post(ORCHESTRATOR_URL, json={
            'event': 'tool_use',
            'tool_name': input_data.get('tool_name'),
            'session_id': input_data.get('session_id'),
            'timestamp': datetime.utcnow().isoformat()
        }, timeout=2)
    except:
        pass  # Don't block on webhook failure
    
    sys.exit(0)

if __name__ == '__main__':
    main()
```

**Pros**: Real-time notifications
**Cons**: Requires webhook endpoint accessible from E2B sandbox

## Key Takeaways

1. **No "v2.1 agent-specific hooks" feature exists** - The existing hook system is comprehensive and applies to all sessions including subagents.

2. **SubagentStop is the agent-specific event** - Use it for tracking when Task tool invocations complete.

3. **PostToolUse is the best heartbeat mechanism** - Fires on every tool call, providing guaranteed activity signals.

4. **Current file-based progress approach is valid** - But can be enhanced with hooks for more reliable heartbeats.

5. **Hooks can write to files** - The existing progress file pattern works well with hooks.

6. **5-second timeout is sufficient for heartbeats** - Keep hook execution fast to not slow down Claude.

7. **Prompt-based hooks enable smart validation** - Can use Claude to verify task completion.

## Files to Modify for Implementation

1. **E2B Sandbox Template**:
   - Add `.claude/settings.json` with PostToolUse and SubagentStop hooks
   - Add `.claude/hooks/heartbeat.py` for progress updates

2. **spec-orchestrator.ts**:
   - Update health check to use tool-based heartbeats
   - Reduce stall detection timeout (hooks provide frequent signals)
   - Add tool activity logging for debugging

3. **alpha:implement command**:
   - Continue writing task-level progress (complement to heartbeats)
   - Hooks handle low-level activity, command handles semantic progress

## Sources

- Claude Code via Context7 (anthropics/claude-code)
- claude-code-hooks-mastery via Context7 (disler/claude-code-hooks-mastery)
- Existing project hooks: `/home/msmith/projects/2025slideheroes/.claude/hooks/`
- Existing orchestrator: `/home/msmith/projects/2025slideheroes/.ai/alpha/scripts/spec-orchestrator.ts`
