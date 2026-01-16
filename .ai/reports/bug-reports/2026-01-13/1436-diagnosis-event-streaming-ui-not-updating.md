# Bug Diagnosis: Alpha Event Streaming UI Output Not Updating

**ID**: ISSUE-pending
**Created**: 2026-01-13T19:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Orchestrator UI displays stale output in the sandbox columns. The `recent_output` field in the progress JSON files only shows the initial 2 lines from sandbox startup ("Using OAuth authentication" and "Running Claude Code with prompt...") but never updates with real-time tool activity, despite the event streaming system being implemented.

## Environment

- **Application Version**: dev branch (commit 1731e5722)
- **Environment**: development
- **Node Version**: v20.x
- **Database**: PostgreSQL (Supabase sandbox)
- **Last Working**: Never worked as intended

## Reproduction Steps

1. Start the Alpha Orchestrator with UI enabled: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
2. Observe the sandbox columns in the TUI
3. Notice the "Output:" section only shows:
   - "Using OAuth authenticatio..."
   - "Running Claude Code with ..."
4. Wait several minutes while Claude Code processes tasks
5. Output section never updates beyond the initial 2 lines

## Expected Behavior

The "Output:" section in each sandbox column should update in real-time with tool activity like:
- "📖 Read: dashboard.types.ts"
- "📝 Write: kanban-summary.loader.ts"
- "🔍 Grep: user_activities"
- "💻 Bash: pnpm typecheck"

## Actual Behavior

The output section shows only the initial startup lines and never updates, making it impossible to see what Claude Code is doing in real-time.

## Diagnostic Data

### Progress File Content
```json
{
  "sandbox_id": "i975y9v4u20fhgbdbtb9n",
  "feature": {
    "issue_number": 1367,
    "title": "Dashboard Page & Grid Layout"
  },
  "status": "running",
  "phase": "executing",
  "last_heartbeat": "2026-01-13T19:22:50.867033Z",
  "last_tool": "Grep",
  "session_id": "i975y9v4u20fhgbdbtb9n",
  "recent_output": [
    "Using OAuth authentication (Max plan)",
    "Running Claude Code with prompt: /alpha:implement 1367"
  ]
}
```

The `recent_output` array contains only the initial 2 lines captured from stdout when Claude Code starts.

### Log File Content
Most recent log files are only ~93 bytes with the same 2 initial lines:
```
Using OAuth authentication (Max plan)
Running Claude Code with prompt: /alpha:implement 1376
```

### Hook Configuration Analysis

**Local `.claude/settings.json`** (lines 60-64):
```json
{
  "type": "command",
  "command": "python3 $CLAUDE_PROJECT_DIR/.claude/hooks/update_recent_output.py || true",
  "timeout": 3
}
```

**Slash command `.claude/commands/alpha/implement.md`** (lines 6-17):
```yaml
hooks:
  PostToolUse:
    - matcher: ""
      hooks:
        - type: command
          command: "HOOK_EVENT_TYPE=post_tool_use python3 $CLAUDE_PROJECT_DIR/.claude/hooks/event_reporter.py || true"
          timeout: 3
    - matcher: "TodoWrite"
      hooks:
        - type: command
          command: "python3 $CLAUDE_PROJECT_DIR/.claude/hooks/task_progress_stream.py || true"
          timeout: 3
```

**CRITICAL FINDING**: The `update_recent_output.py` hook is NOT registered in the implement.md YAML frontmatter.

## Error Stack Traces

No errors - the system silently fails because hooks don't run in the expected context.

## Related Code
- **Affected Files**:
  - `.claude/commands/alpha/implement.md:6-29` - Missing `update_recent_output.py` hook registration
  - `.claude/hooks/update_recent_output.py:52-68` - Hook looks for local progress files
  - `.ai/alpha/scripts/lib/feature.ts:241-264` - Output capture from sandbox stdout
  - `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts:756-794` - UI reads `recent_output` from progress files
- **Recent Changes**: Event streaming feature implemented in 1731e5722
- **Suspected Functions**: `update_recent_output.py` not executing in sandbox

## Related Issues & Context

### Direct Predecessors
- #1433 (CLOSED): "Alpha Event Streaming System" - The feature that introduced this system
- #1435 (IN_PROGRESS): "Alpha Event Streaming UI Bug Fix" - Previous bug fix attempt

### Infrastructure Issues
The event streaming architecture has fundamental design flaws that need addressing.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `update_recent_output.py` hook is not registered in the slash command's YAML frontmatter and has an architectural mismatch between where it runs vs. where progress files exist.

**Detailed Explanation**:

The event streaming feature plan (#1433) intended for `update_recent_output.py` to update sandbox progress files with real-time tool activity. However, the implementation has **two critical bugs**:

1. **Hook Not Registered in Slash Command** (PRIMARY BUG)
   - The `update_recent_output.py` hook is registered in `.claude/settings.json` which only applies to the **local Claude Code session** on the developer's machine
   - Claude Code sessions running **inside E2B sandboxes** use hooks from the **slash command YAML frontmatter** in `.claude/commands/alpha/implement.md`
   - The implement.md does NOT include `update_recent_output.py` in its PostToolUse hooks
   - Therefore, the hook never executes in the sandbox

2. **Architectural Mismatch** (SECONDARY BUG)
   - Even if the hook were registered, it would fail silently
   - The hook at line 28 uses `ALPHA_PROGRESS_DIR = Path(".ai/alpha/progress")` - a **local filesystem path**
   - Progress files are written by the **orchestrator** to the **orchestrator's local filesystem**
   - Hooks running in E2B sandboxes have a **different filesystem** with no access to orchestrator's files
   - The hook's `get_progress_file_path()` function would return `None` because the directory doesn't exist in the sandbox

**Current Data Flow** (broken):
```
E2B Sandbox Claude Code → executes tool → PostToolUse hook → (update_recent_output.py NOT called)
                                                             ↓
Orchestrator → polls sandbox progress file → writes to local .ai/alpha/progress/sbx-X-progress.json
                                                             ↓
                                             UI polls local progress files → shows stale recent_output
```

**Intended Data Flow** (per feature plan):
```
E2B Sandbox Claude Code → executes tool → PostToolUse hook → event_reporter.py → HTTP POST to event server
                                                                                            ↓
Event Server (localhost:9000) → WebSocket broadcast → UI receives real-time events
```

The `update_recent_output.py` hook was created as a **fallback mechanism** to also update local progress files, but:
- It was never properly integrated into the sandbox execution flow
- Its design assumes hooks run on the orchestrator machine, not in sandboxes

**Supporting Evidence**:
- Progress file shows only 2 `recent_output` lines: `.ai/alpha/progress/sbx-a-progress.json:12-15`
- Log files are only ~93 bytes with initial startup lines
- Hook is in settings.json line 62 but NOT in implement.md hooks section
- Hook path `ALPHA_PROGRESS_DIR = Path(".ai/alpha/progress")` is local, not sandbox path

### How This Causes the Observed Behavior

1. User runs orchestrator with `--ui` flag
2. Orchestrator creates E2B sandboxes and runs `/alpha:implement` command
3. Claude Code in sandbox executes tools (Read, Write, Grep, etc.)
4. PostToolUse hooks fire, but only `event_reporter.py` and `task_progress_stream.py` are registered
5. `update_recent_output.py` never runs because it's not in the slash command hooks
6. Progress files' `recent_output` array is only populated by `feature.ts:248-256` from stdout callback
7. Claude Code produces minimal stdout (just initial auth message)
8. UI polls progress files and shows the stale 2-line output
9. UI "Output:" section appears frozen

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct code inspection confirms `update_recent_output.py` is missing from implement.md hooks
- Architecture analysis shows fundamental mismatch between hook location (sandbox) and target files (local)
- Progress file content exactly matches what `feature.ts` captures from stdout
- Feature plan document (#1433) describes intended behavior that doesn't match implementation

## Fix Approach (High-Level)

Two options exist to fix this:

**Option A: Use Event Streaming HTTP API (Recommended)**
1. The `event_reporter.py` hook IS registered and DOES run in sandboxes
2. It POSTs events to `ORCHESTRATOR_URL/api/events`
3. The event server receives events and should broadcast via WebSocket
4. Modify the UI to listen to WebSocket events instead of polling progress files
5. This is the architecture described in the feature plan

**Option B: Fix Progress File Updates**
1. Move progress file updates to the orchestrator side
2. Event server receives events via HTTP POST
3. Event server writes events to local progress files
4. UI continues polling progress files (current behavior)
5. This preserves backward compatibility

The issue is likely that **the WebSocket integration in the UI is not properly reading events** from the event server, or **the event server is not receiving/processing events correctly**.

## Diagnosis Determination

The root cause is a **missing hook registration** combined with an **architectural design flaw**. The `update_recent_output.py` hook was intended to be a fallback/redundant mechanism but was:
1. Never registered in the slash command YAML frontmatter
2. Designed to run locally rather than in sandboxes

The fix should focus on ensuring the **primary event streaming path works** (HTTP POST → Event Server → WebSocket → UI) rather than trying to make the local progress file fallback work in sandboxes.

## Additional Context

### Feature Plan Reference
The event streaming feature plan is at: `.ai/reports/feature-reports/2026-01-13/1433-feature-plan-alpha-event-streaming.md`

Key excerpts:
- Line 46-48: "Uses Claude Code native hooks - PostToolUse, SubagentStop, Stop hooks fire at exact lifecycle points"
- Line 49-50: "HTTP POST to FastAPI server - Events posted with 2-3 second timeout"
- Line 51-52: "WebSocket broadcasting - Server broadcasts events to all connected UI clients"

### Next Steps for Investigation
1. Verify event server is receiving HTTP POST events from `event_reporter.py`
2. Verify event server is broadcasting events via WebSocket
3. Verify UI is connected to WebSocket and processing events
4. If WebSocket path works, consider removing the `update_recent_output.py` hook entirely

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Bash, Grep, Glob*
