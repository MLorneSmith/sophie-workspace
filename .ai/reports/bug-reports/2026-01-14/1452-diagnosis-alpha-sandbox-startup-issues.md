# Bug Diagnosis: Alpha Sandbox Startup Issues

**ID**: ISSUE-pending
**Created**: 2026-01-14T15:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Autonomous Coding workflow is experiencing multiple issues during sandbox startup: immediate retry display without proper sequencing, missing event display, UI flickering, long startup times, and undefined task IDs in event messages. These are distinct issues with separate root causes that combine to create a confusing user experience.

## Environment

- **Application Version**: dev branch (current commit)
- **Environment**: E2B cloud sandboxes with OAuth authentication
- **E2B Template**: slideheroes-claude-agent-dev
- **Claude Code CLI**: Claude Max plan with OAuth
- **Node Version**: 20.x (in sandbox)
- **UI**: Ink-based terminal UI with file-based progress polling

## Reproduction Steps

1. Run the spec orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
2. Observe the terminal UI during sandbox initialization
3. Note that "Retry Attempt 3/3" appears immediately in logs
4. Note that Recent Events box shows "No events yet..." despite sandboxes starting
5. Note occasional text flashing below the UI
6. Wait 3+ minutes for sandboxes to begin working
7. Observe "Task undefined started" message for sandbox-c

## Expected Behavior

1. Sandbox startup should display sequential retry attempts with proper delays
2. Events should populate the Recent Events box as sandboxes progress
3. No UI flickering or stray text below the interface
4. Startup time should be reasonable (<60 seconds per sandbox)
5. Task IDs should never be "undefined" in event messages

## Actual Behavior

1. Log files show all retry attempts immediately with no visible delay between them
2. Recent Events box remains empty ("No events yet...") even after sandboxes are running
3. Messages occasionally flash below the UI and disappear
4. Each sandbox takes >3 minutes to indicate it's working on a task
5. sbx-c showed "[sbx-c] ▶️ Task undefined started" event message

## Diagnostic Data

### Log File Evidence

```
// sbx-c-2026-01-14T14-50-57-146Z.log (latest run)
Using OAuth authentication (Max plan)
Running Claude Code with prompt: /alpha:implement 1376

=== WAITING 5s BEFORE RETRY ===

=== RETRY ATTEMPT 2/3 ===
Using OAuth authentication (Max plan)
Running Claude Code with prompt: /alpha:implement 1376

=== WAITING 10s BEFORE RETRY ===

=== RETRY ATTEMPT 3/3 ===
Using OAuth authentication (Max plan)
Running Claude Code with prompt: /alpha:implement 1376
```

### Progress File State (When Working)

```json
// sbx-c-progress.json (current)
{
  "sandbox_id": "iekv36hlly26m6twhnijg",
  "feature": {
    "issue_number": 1376,
    "title": "Kanban Summary Card"
  },
  "status": "running",
  "phase": "executing",
  "last_heartbeat": "2026-01-14T14:53:43.513063Z",
  "last_tool": "Grep",
  "session_id": "iekv36hlly26m6twhnijg"
}
```

### Key Observation

Despite the logs showing retry attempts, the progress files indicate all three sandboxes are now actively running and executing tasks with recent heartbeats. This suggests the startup eventually succeeds but with poor visibility.

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/feature.ts:305-428` - Retry loop logic
  - `.ai/alpha/scripts/lib/startup-monitor.ts` - Startup detection
  - `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts:559` - "Task undefined" message source
  - `.ai/alpha/scripts/ui/index.tsx` - Main UI rendering
  - `.ai/alpha/scripts/ui/hooks/useEventStream.ts` - WebSocket event handling
  - `.claude/hooks/event_reporter.py` - Event reporting to progress files

## Related Issues & Context

### Direct Predecessors
- #1448: Bug Diagnosis: Claude CLI Startup Hang in E2B Sandboxes (same underlying auth issue)
- #1444: Bug Diagnosis: Alpha Sandbox Hanging/Failing (64% failure rate)
- #1447: Implementation: Startup Retry Loop (verified working)

## Root Cause Analysis

### Issue 1: Retry Attempts Appearing Immediately in Logs

**Summary**: Log file timestamps show retries occurring sequentially as expected, but the output appears "immediate" because the log file is only updated when new output is captured.

**Root Cause**: The log viewer (or tailing the log) shows accumulated output once Claude finally outputs something. The retries ARE happening with delays (5s, 10s between attempts), but the log output doesn't flush incrementally during the wait periods.

**Evidence**:
- Log file shows "WAITING 5s BEFORE RETRY" and "RETRY ATTEMPT 2/3" but the wait is invisible in the static log view
- This is expected behavior - the delays are happening, just not visible in retrospective log review

**Confidence**: High - This is normal logging behavior, not a bug.

### Issue 2: No Events Displayed in Recent Events Box

**Summary**: The Recent Events box shows "No events yet..." because the event generation relies on state CHANGES, not initial state.

**Root Cause**: Event generation in `useProgressPoller.ts:496-675` (`generateEvents` function) only creates events when comparing previous and new states. On initial load, there's no previous state to compare against, so minimal events are generated (only a "Spec started" event on line 507-512).

**Evidence**:
```typescript
// Line 503-514 in useProgressPoller.ts
if (!previousState) {
    // Initial event - use first sandbox label or 'system'
    const firstLabel = Array.from(newState.sandboxes.keys())[0] ?? "sbx-a";
    events.push({
        id: `init-${now.getTime()}`,
        timestamp: now,
        type: "feature_start",
        sandboxLabel: firstLabel,
        message: `Spec #${newState.overallProgress.specId} started`,
    });
    return events;  // Returns early with only 1 event!
}
```

The event generation returns early after the initial state, so subsequent sandbox startups don't generate "Sandbox started" events until there's a CHANGE in state (e.g., feature assignment).

**Confidence**: High - Code clearly shows early return on first poll.

### Issue 3: Messages Flashing Below UI

**Summary**: Text occasionally appears below the Recent Events box and disappears.

**Root Cause**: This is likely stdout/stderr leaking from the orchestrator or event server processes. The Ink TUI uses console patching, but some output may escape:
- `event-server.py` prints to stderr on WebSocket errors
- Progress polling errors may be logged
- The `patchConsole: false` option in `index.tsx:314` means console output is NOT intercepted

**Evidence**:
```typescript
// Line 314 in ui/index.tsx
this.instance = render(<OrchestratorApp config={this.config} />, {
    patchConsole: false,  // Console output NOT patched!
});
```

**Confidence**: Medium - Need to verify which process is outputting, but the code supports this theory.

### Issue 4: Long Startup Times (>3 minutes)

**Summary**: Each sandbox takes 3+ minutes to indicate it's working on a task.

**Root Cause**: This is the same OAuth/API initialization issue identified in #1448. Claude CLI hangs during API initialization after outputting the auth message. The retry mechanism works but all 3 attempts may fail before eventually succeeding on a subsequent orchestrator retry cycle.

**Evidence**:
- Previous diagnosis #1448 documented 64% failure rate with identical symptoms
- Sandboxes eventually start working, indicating eventual success
- Long time is accumulated from: 60s startup timeout × 3 retry attempts + inter-retry delays

**Confidence**: High - Well-documented in previous diagnosis.

### Issue 5: "Task undefined started" Event Message

**Summary**: sbx-c showed "[sbx-c] ▶️ Task undefined started" in the event log.

**Root Cause**: The progress file was written with a `current_task` object that had an undefined `id` field. The `useProgressPoller.ts:559` generates the message:
```typescript
message: `Task ${sandbox.currentTask.id} started`
```

If `sandbox.currentTask.id` is undefined (but `sandbox.currentTask` exists), this produces "Task undefined started".

**How This Happens**:
1. The `/alpha:implement` command creates a progress file with a partial `current_task` object
2. During task loading (before task ID is known), the object exists but `id` may be undefined
3. The poller reads this intermediate state and generates an event

**Code Path** (`.ai/alpha/scripts/ui/hooks/useProgressPoller.ts:362-372`):
```typescript
let currentTask: TaskInfo | null = null;
if (progress.current_task) {
    currentTask = {
        id: progress.current_task.id,  // Can be undefined!
        name: progress.current_task.name,
        status: mapTaskStatus(progress.current_task.status),
        // ...
    };
}
```

The code doesn't validate that `id` is defined before assigning.

**Confidence**: High - Code clearly shows the issue.

## Fix Approach (High-Level)

### Issue 1: Retry Display (Not a Bug)
- No fix needed - this is expected logging behavior
- Could optionally add live timestamps to log output for clarity

### Issue 2: Missing Events
1. Remove the early return in `generateEvents` for initial state
2. Generate "Sandbox started" events for each sandbox in the initial state
3. Or: Pre-populate events from the spec manifest when UI starts

### Issue 3: UI Flickering
1. Set `patchConsole: true` in the Ink render options
2. Suppress stderr from event-server.py
3. Add error boundaries to catch and log errors cleanly

### Issue 4: Long Startup Times
1. (From #1448) Increase sandbox stagger delay to reduce OAuth contention
2. Consider switching to API key authentication for automation
3. Add pre-authentication health check before invoking Claude

### Issue 5: Task Undefined
1. Add null check in event generation: only generate task_start event if `sandbox.currentTask.id` is defined
2. Or: Validate `current_task.id` exists before assigning to `currentTask`

```typescript
// Fix in useProgressPoller.ts:549-562
if (
    sandbox.currentTask &&
    sandbox.currentTask.id &&  // Add this check
    (!prevSandbox.currentTask ||
        sandbox.currentTask.id !== prevSandbox.currentTask.id)
) {
    events.push({...});
}
```

## Diagnosis Determination

These are **5 distinct issues** affecting the Alpha Autonomous Coding workflow:

| Issue | Severity | Root Cause | Fix Complexity |
|-------|----------|------------|----------------|
| Retry display | Low | Expected behavior | None needed |
| Missing events | Medium | Early return in generateEvents | Low |
| UI flickering | Low | Console not patched | Low |
| Long startup | High | OAuth/API init hang | Medium (from #1448) |
| Task undefined | Medium | Missing null check | Low |

The most impactful issues are:
1. **Long startup times** - Same root cause as #1448, needs auth/OAuth improvements
2. **Task undefined** - Quick fix with null check, improves UX

## Additional Context

- Sandboxes ARE eventually working correctly (progress files show active execution)
- The issues are primarily visibility/UX problems during startup
- Core functionality is working - features are being assigned and executed
- Previous diagnosis #1448 remains relevant for the OAuth startup hang issue

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Glob, Grep, Bash*
