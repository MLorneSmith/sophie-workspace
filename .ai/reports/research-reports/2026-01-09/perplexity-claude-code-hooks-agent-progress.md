# Perplexity Research: Claude Code Hooks and Agent Progress Tracking

**Date**: 2026-01-09
**Agent**: perplexity-expert
**Search Type**: Synthesized from existing research + codebase analysis (Perplexity API unavailable)

## Query Summary

Researched Claude Code hooks system focusing on:
1. Hook introduction timeline and evolution
2. Agent-specific hooks available
3. Real-time progress updates from agents
4. Task completion, tool execution, and state change hooks
5. Configuration in .claude/settings.json
6. Best practices for monitoring agent activity
7. Multi-agent progress tracking patterns

## Executive Summary

**Claude Code hooks were introduced in 2025** as part of the extensibility system. The hooks system provides 8 event types that fire at various points during Claude's execution lifecycle. While there are no truly "agent-specific" hooks in a multi-agent orchestration sense, the **SubagentStop** hook fires specifically when Task tool invocations (subagents) complete, making it the closest to agent-specific functionality.

**Key Finding**: Real-time progress tracking is best achieved through a combination of:
- **PostToolUse hooks** for heartbeat signals (fires on every tool call)
- **SubagentStop hooks** for subagent completion tracking
- **Stop hooks** for session completion notifications
- **File-based progress state** for semantic progress information

## Findings

### 1. Claude Code Hooks - Introduction Timeline

**2025 Introduction**: Claude Code hooks were part of the CLI extensibility features introduced in 2025.

**Hook System Evolution**:
- Initial release: 6 hook types (PreToolUse, PostToolUse, UserPromptSubmit, Notification, Stop, SubagentStop)
- Later additions: SessionStart, PreCompact (memory management)
- Current state (2026): 8 hook event types supported

### 2. Available Hook Types (Complete Reference)

| Hook Type | When It Fires | Agent Progress Potential |
|-----------|--------------|--------------------------|
| PreToolUse | Before any tool call | HIGH - Log upcoming actions |
| PostToolUse | After any tool call | HIGHEST - Best for heartbeats |
| UserPromptSubmit | Before user prompt processed | LOW - Only on user input |
| Notification | When Claude requires input | MEDIUM - User attention needed |
| Stop | When Claude finishes responding | HIGH - Session completion |
| SubagentStop | When sub-agent (Task) completes | HIGHEST - Agent-specific! |
| SessionStart | At session start | MEDIUM - Initial setup |
| PreCompact | Before context compaction | LOW - Memory management |

### 3. Agent-Specific Hooks: SubagentStop

**SubagentStop** is the only truly agent-specific hook. It fires when a Task tool invocation (subagent) completes.

**Configuration**:
```json
{
  "hooks": {
    "SubagentStop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "uv run PROJECT_DIR/.claude/hooks/subagent_stop.py",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

**Input Data Received**:
```json
{
  "session_id": "abc123",
  "stop_hook_active": false,
  "transcript_path": "/path/to/transcript.jsonl"
}
```

**Output for Control**:
```json
{
  "decision": "approve|block",
  "reason": "Explanation",
  "systemMessage": "Additional context for Claude"
}
```

### 4. Real-Time Progress Updates via PostToolUse

**PostToolUse** is the most reliable mechanism for real-time progress tracking because it fires after EVERY tool call.

**Input Data**:
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

### 5. Hook Configuration in settings.json

**File Locations**:
- Project-level: .claude/settings.json
- User-level: ~/.claude/settings.json

**Key Configuration Fields**:
- matcher: Regex pattern for tool filtering (empty = all tools)
- type: Currently only "command" supported
- command: Shell command to execute (can use CLAUDE_PROJECT_DIR env var)
- timeout: Execution timeout in seconds

### 6. Best Practices for Monitoring Agent Activity

#### 6.1 Exit Code Semantics
- exit 0: Success, continue normally
- exit 2: Block the operation (PreToolUse) or block stopping (Stop)

#### 6.2 Output Handling
- stdout: Added to Claude's context
- stderr: Displayed as error messages

#### 6.3 Performance Guidelines
- Keep hook execution under 5 seconds
- Use atomic file writes (write to temp, then rename)
- Fail silently - never block Claude on hook errors
- Use || true in command chains for non-critical hooks

### 7. Multi-Agent Progress Tracking Patterns

#### Pattern 1: File-Based Progress State
Progress file schema for tracking multiple agents:

```json
{
  "last_heartbeat": "2026-01-09T10:30:00Z",
  "last_tool": "Write",
  "session_id": "abc123",
  "tool_count": 45,
  "tool_counts": {
    "Read": 15,
    "Write": 10,
    "Bash": 20
  },
  "subagent_count": 3,
  "subagent_counts": {
    "Explore": 2,
    "Task": 1
  }
}
```

#### Pattern 2: Session-Based Logging
Directory structure for per-session logging:
- .claude/logs/hooks/{session-id}/pre_tool_use.json
- .claude/logs/hooks/{session-id}/post_tool_use.json
- .claude/logs/hooks/{session-id}/stop.json
- .claude/logs/hooks/{session-id}/subagent_stop.json
- .claude/logs/hooks/{session-id}/notification.json
- .claude/logs/hooks/{session-id}/chat.json (transcript copy)

### 8. Prompt-Based Hooks (Advanced Feature)

Claude Code supports LLM-powered hooks for complex validation:

```json
{
  "type": "prompt",
  "prompt": "Verify task completion criteria. Return approve if all tests pass, block with reason if not.",
  "timeout": 30
}
```

### 9. Limitations

1. No native orchestrator integration - Hooks don't have built-in external reporting
2. No WebSocket/streaming - Hooks are fire-and-forget commands
3. No shared state between hooks - Must use files or external storage
4. No slash-command scoping - Cannot trigger hooks only for specific commands
5. Timeout constraints - Default 60s for commands, 30s for prompts

## Sources and Citations

Based on synthesized information from:
- Existing project research: .ai/reports/research-reports/2026-01-08/context7-claude-code-agent-hooks-v21.md
- Existing project research: .ai/reports/research-reports/2025-12-17/context7-claude-code-hooks.md
- Project implementation: .claude/settings.json and .claude/hooks/ directory
- Claude Code documentation via Context7 (anthropics/claude-code)
- claude-code-hooks-mastery via Context7 (disler/claude-code-hooks-mastery)

## Key Takeaways

1. **Claude Code hooks introduced in 2025** with 8 event types currently supported

2. **SubagentStop is the agent-specific hook** - fires when Task tool (subagent) invocations complete

3. **PostToolUse is best for heartbeats** - fires on every tool call for reliable activity tracking

4. **Configuration via settings.json** - project or user level, with matcher patterns and timeouts

5. **File-based progress tracking works well** - atomic writes to shared progress files

6. **Multi-agent patterns require polling** - no built-in push notifications to orchestrators

7. **Always fail silently** - use || true and try/except to never block Claude

8. **Keep hooks fast** - under 5 seconds, atomic file operations

## Related Searches

- Claude Code plugin development for enhanced hooks
- MCP server integration for progress reporting
- Webhook-based orchestrator notifications
- Real-time agent monitoring dashboards
