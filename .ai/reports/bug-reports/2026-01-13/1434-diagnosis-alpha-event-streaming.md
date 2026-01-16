# Bug Diagnosis: Alpha Event Streaming UI Not Updating

**ID**: ISSUE-1434
**Created**: 2026-01-13T19:15:00Z
**Reporter**: msmith
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The Alpha Orchestrator TUI displays initial sandbox output but never updates the "Output:" section in sandbox columns, and the "Recent Events" section shows "No events yet..." despite event streaming being configured. The issue stems from three separate problems: (A) the `recent_output` field in progress JSON is only set at sandbox startup and never updated during execution, (B) the WebSocket event streaming hook is not configured in the sandbox's `.claude/settings.json`, and (C) the progress file's `recent_output` field is not being updated by any hook during task execution.

## Environment

- **Application Version**: Alpha Orchestrator v1.0
- **Environment**: development
- **Node Version**: v22.x
- **Browser**: N/A (CLI TUI)
- **Last Working**: Never (new feature)

## Reproduction Steps

1. Run `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --ui`
2. Observe sandbox columns show "Output:" with initial 2 lines
3. Wait for Claude Code sessions to run in sandboxes
4. Observe "Output:" never updates beyond initial lines
5. Observe "Recent Events" shows "No events yet..."

## Expected Behavior

1. Sandbox "Output:" sections should show recent Claude Code activity (tool calls, file writes, etc.)
2. "Recent Events" should display real-time events streamed from sandbox hooks via WebSocket

## Actual Behavior

1. "Output:" shows only initial lines: "Using OAuth authenticatio..." and "Running Claude Code with ..."
2. "Recent Events" section shows "No events yet..." permanently
3. Progress files show correct `last_heartbeat` and `current_task` updates (indicating hooks work for file-based progress)

## Diagnostic Data

### Progress File Analysis

Current sbx-a-progress.json shows:
- `last_heartbeat` is updating (hooks working)
- `recent_output` contains only initial startup lines
- No mechanism in hooks to update `recent_output` field

```json
{
  "recent_output": [
    "Using OAuth authentication (Max plan)",
    "Running Claude Code with prompt: /alpha:implement 1367"
  ]
}
```

### Event Server Status

The event server starts successfully (line 171 in orchestrator.ts):
- Port 9000
- WebSocket endpoint: `ws://localhost:9000/ws`
- HTTP endpoint: `http://localhost:9000/api/events`

### Hook Configuration Analysis

The `.claude/settings.json` does NOT include the streaming hooks:
- **Present**: `post_tool_use.py`, `heartbeat.py` (file-based progress)
- **Missing**: `task_progress_stream.py`, `feature_complete_stream.py`, `subagent_complete_stream.py`
- **Missing**: `ORCHESTRATOR_URL` environment variable injection for hooks

### UI Poller Analysis

`useProgressPoller.ts` lines 757-770 show:
- Prefers `recent_output` from JSON progress file
- Falls back to log files only when JSON has no `recent_output`
- Log files only contain 2-3 initial lines (they're not being appended to)

## Root Cause Analysis

### Identified Root Cause

**Summary**: Three interconnected issues prevent event streaming from working:

1. **`recent_output` not updated during execution** - The `recent_output` field in `sbx-*-progress.json` is set at sandbox creation in `feature.ts` (lines 85-90) but no hook updates it during Claude Code execution. The field should be updated by a hook on each tool use to show recent activity.

2. **Event streaming hooks not registered** - The sandbox's `.claude/settings.json` hooks configuration (lines 41-54) does not include calls to `task_progress_stream.py` or the event reporter. The `ORCHESTRATOR_URL` environment variable is injected into sandbox env (environment.ts line 228-229), but hooks aren't configured to call the streaming scripts.

3. **WebSocket events never sent** - Because hooks don't call `event_reporter.py` with the `ORCHESTRATOR_URL` and `HOOK_EVENT_TYPE` environment variables, no events are POSTed to the event server, so the WebSocket never broadcasts anything to the UI.

**Supporting Evidence**:

1. Progress files update correctly (`last_heartbeat`, `current_task`) - proves hooks run in sandbox
2. `recent_output` never changes from initial values - proves no hook updates this field
3. Event server has 0 events stored (verified by architecture analysis)
4. Log files (`.ai/alpha/logs/sbx-a-*.log`) only contain startup lines - no stdout capture

### How This Causes the Observed Behavior

1. **Output section frozen**: UI reads `recent_output` from progress JSON (line 757-770 useProgressPoller.ts) → JSON never updated → shows stale initial lines
2. **No events**: Hooks don't call `event_reporter.py` → no HTTP POST to `/api/events` → WebSocket never broadcasts → UI shows "No events yet..."

### Confidence Level

**Confidence**: High

**Reasoning**:
- The architecture is well-documented in the feature plan
- Code paths are clearly traceable
- Progress files prove partial hook functionality (heartbeats work)
- The streaming hooks exist but aren't registered in settings.json

## Fix Approach (High-Level)

**Issue A & B (Output and Events):**

1. Update `.claude/settings.json` PostToolUse hooks to include streaming:
   ```json
   {
     "type": "command",
     "command": "python3 $CLAUDE_PROJECT_DIR/.claude/hooks/task_progress_stream.py || true",
     "timeout": 3
   }
   ```

2. Create a new hook or extend `heartbeat.py` to capture and update `recent_output` field in progress JSON with the last 3-5 tool calls/activities.

3. Ensure `ORCHESTRATOR_URL` is available in sandbox environment (already done in `getAllEnvVars()`)

**Issue C (Recommendation on Output vs Events):**

Keep BOTH but with different purposes:
- **Sandbox Output**: Shows recent tool activity (Write, Bash, etc.) - useful for debugging stuck sandboxes
- **Recent Events**: Shows orchestrator-level events (task completions, feature starts) - useful for overall progress tracking

They serve complementary purposes and removing either reduces observability.

## Additional Context

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    LOCAL MACHINE (Orchestrator)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    WebSocket    ┌────────────────────────┐   │
│  │   Ink TUI    │◄───────────────►│   Event Server        │   │
│  │ (React/Ink)  │                 │   (FastAPI/uvicorn)   │   │
│  └──────────────┘                 │   Port 9000           │   │
│         ▲                         └───────────▲────────────┘   │
│         │ File Read                           │ HTTP POST      │
│         │ (polling)                           │ (not working)  │
│  ┌──────┴───────┐                            │                 │
│  │ .ai/alpha/   │                            │                 │
│  │ progress/    │◄────File Write─────┐       │                 │
│  │ sbx-*.json   │                    │       │                 │
│  └──────────────┘                    │       │                 │
│                                      │       │                 │
└──────────────────────────────────────┼───────┼─────────────────┘
                                       │       │
                              ┌────────┴───────┴──────────┐
                              │    E2B SANDBOX (Cloud)    │
                              ├───────────────────────────┤
                              │  Claude Code Session      │
                              │         │                 │
                              │         ▼                 │
                              │  hooks/heartbeat.py ✓     │
                              │  hooks/task_progress.py ✓ │
                              │  hooks/event_reporter.py ✗│
                              │  (not called)             │
                              └───────────────────────────┘
```

### Related Files

- `.ai/alpha/scripts/lib/orchestrator.ts:102-177` - Event server startup
- `.ai/alpha/scripts/lib/environment.ts:228-229` - ORCHESTRATOR_URL injection
- `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts:757-770` - recent_output parsing
- `.ai/alpha/scripts/ui/hooks/useEventStream.ts` - WebSocket connection
- `.claude/hooks/task_progress_stream.py` - Exists but not registered
- `.claude/hooks/event_reporter.py` - Exists but not called
- `.claude/settings.json:41-54` - PostToolUse hooks (missing streaming)

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Glob, Bash, Code Analysis*
