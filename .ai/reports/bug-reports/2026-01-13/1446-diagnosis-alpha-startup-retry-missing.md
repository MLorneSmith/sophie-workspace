# Bug Diagnosis: Alpha Sandbox Startup Retry Loop Not Implemented

**ID**: ISSUE-1446
**Created**: 2026-01-13T21:15:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Implementation System's startup hang detection mechanism correctly identifies when Claude Code CLI hangs during initialization, but the retry logic was never fully implemented. When a hang is detected, the system kills the Claude process and sets flags indicating retry should occur, but there's no actual retry loop. The feature is immediately marked as "failed" and depends on the orchestrator to retry, but the orchestrator doesn't properly reset the feature's `in_progress` status for re-assignment.

## Environment

- **Application Version**: dev branch (commit 75052b277)
- **Environment**: E2B cloud sandboxes
- **E2B Template**: slideheroes-claude-agent-dev
- **Claude Code Version**: @anthropic-ai/claude-code (global npm install)
- **Node Version**: 20.x (in sandbox)
- **Authentication**: OAuth (Max plan)
- **Last Working**: Partial - startup detection works, retry does not

## Reproduction Steps

1. Run the spec orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
2. Observe that 3 sandboxes are created and assigned features
3. Wait for Claude CLI to start in each sandbox
4. Observe that some sandboxes produce only 2 lines of output then hang
5. Wait 60+ seconds for startup timeout detection
6. Observe that the process is killed but **no retry occurs**
7. Feature remains in `in_progress` status with assigned sandbox
8. Check logs - multiple log files created ~1 minute apart, all with only 2 lines

## Expected Behavior

When a startup hang is detected (no meaningful output within 60 seconds):
1. Kill the Claude process
2. Wait the configured retry delay (5s, 10s, 30s exponential backoff)
3. Restart Claude CLI with the same prompt
4. Retry up to 3 times (MAX_STARTUP_RETRIES)
5. Only mark feature as failed after all retries exhausted
6. If retries fail, properly reset feature status to allow orchestrator retry

## Actual Behavior

When a startup hang is detected:
1. Kill the Claude process ✅ (works)
2. Log "Will retry startup" message ✅ (logs correctly)
3. **NO RETRY LOOP** - Execution falls through to catch block ❌
4. Feature immediately marked as "failed" ❌
5. Feature's `assigned_sandbox` cleared but status remains problematic
6. Same sandbox gets feature again on next health check cycle
7. Endless loop of 2-line logs with no progress

## Diagnostic Data

### Log File Analysis

```
Log files from sbx-c in latest run (all only 2 lines each):
sbx-c-2026-01-13T21-02-11-162Z.log
sbx-c-2026-01-13T21-03-22-273Z.log (+1:11)
sbx-c-2026-01-13T21-04-30-266Z.log (+1:08)
sbx-c-2026-01-13T21-05-38-369Z.log (+1:08)
sbx-c-2026-01-13T21-06-46-314Z.log (+1:08)
sbx-c-2026-01-13T21-07-54-059Z.log (+1:08)
sbx-c-2026-01-13T21-09-01-869Z.log (+1:07)

Each log contains exactly:
Line 1: "Using OAuth authentication (Max plan)"
Line 2: "Running Claude Code with prompt: /alpha:implement 1376"
[EOF - no more output]
```

The ~1 minute gap between log files matches the STARTUP_TIMEOUT_MS of 60 seconds, indicating the timeout detection IS working. However, instead of retrying with exponential backoff delays (would show +65s, +70s, +90s gaps), we see consistent ~1 minute gaps - suggesting new sessions without backoff.

### Manifest State

```json
{
  "id": 1376,
  "title": "Kanban Summary Card",
  "status": "in_progress",
  "assigned_sandbox": "sbx-c",
  "assigned_at": 1768338540844
}
```

Feature #1376 remains assigned to sbx-c despite multiple failed startup attempts.

### Progress Files State

```json
// sbx-c-progress.json
{
  "status": "running",
  "feature": "#1376 Kanban Summary Card",
  "current_task": null,
  "tasks_completed": 0,
  "tasks_total": 6
}
```

Progress file shows "running" but no task has ever started.

## Error Stack Traces

No explicit errors - the Claude CLI hangs silently without producing output.

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/feature.ts:258-302` - Startup check interval (detection only, no retry loop)
  - `.ai/alpha/scripts/lib/feature.ts:480-522` - Catch block that marks feature failed
  - `.ai/alpha/scripts/lib/startup-monitor.ts` - Utility functions for detection (not execution)
  - `.ai/alpha/scripts/config/constants.ts:129-146` - Retry config defined but unused

- **Recent Changes**:
  - `75052b277` - fix(tooling): add startup timeout and retry logic for Alpha sandboxes
  - This commit added detection and configuration but NOT the actual retry loop

- **Suspected Functions**:
  - `runFeatureImplementation()` in feature.ts - Missing retry loop wrapper
  - `startupCheckInterval` callback - Detects hang, kills process, but doesn't retry

## Related Issues & Context

### Direct Predecessors
- #1444 - Bug Diagnosis: Alpha Sandbox Hanging/Failing During Feature Implementation
- #1445 - Bug Fix Plan: Add startup timeout and retry logic (planned but incomplete)

### Implementation Gap
The bug fix #1445 planned:
> "Modify `.ai/alpha/scripts/lib/sandbox.ts` to implement exponential backoff retry:
> - Wrap `runClaudeImplement()` call in retry loop"

This was never implemented. The implementation (#1445-implementation) added:
- `startup-monitor.ts` with utility functions
- Configuration constants
- Detection logic in `feature.ts`

**Missing**: The actual retry loop that wraps the `sandbox.commands.run()` call.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The startup retry loop was designed but never implemented. Detection works, retry does not.

**Detailed Explanation**:

Looking at `.ai/alpha/scripts/lib/feature.ts:258-302`:

```typescript
// Startup hang detection interval
const startupCheckInterval = setInterval(async () => {
  // ... detection logic ...

  if (elapsedMs > STARTUP_TIMEOUT_MS) {
    if (startupTracker.lineCount >= 5 || startupTracker.byteCount >= 100) {
      // Success - startup completed
      clearInterval(startupCheckInterval);
      return;
    }

    // Hang detected
    startupHangDetected = true;

    // Check if we SHOULD retry (logs message)
    if (startupAttemptRecord.totalAttempts < MAX_STARTUP_RETRIES) {
      log(`Will retry startup (attempt ${startupAttemptRecord.totalAttempts + 1}/${MAX_STARTUP_RETRIES})`);
    }

    // Kill process - but NO RETRY LOOP
    await killClaudeProcess(instance);
  }
}, 10000);
```

After `killClaudeProcess()`:
1. The `sandbox.commands.run()` promise rejects with an error
2. Execution jumps to the catch block at line 480
3. Feature is marked as `"failed"` at line 501
4. Function returns `{ success: false }` at line 517

**There is no loop that would restart the `sandbox.commands.run()` call.**

**Supporting Evidence**:
- Log files created exactly ~60 seconds apart (timeout interval)
- No exponential backoff visible in timestamps (would show +65s, +70s, +90s)
- Config defines `STARTUP_RETRY_DELAYS_MS = [5000, 10000, 30000]` but it's never used for actual delays
- `startupAttemptRecord.totalAttempts` never increments beyond 1

### How This Causes the Observed Behavior

1. **Sandbox starts Claude CLI** → Outputs 2 lines, then hangs
2. **60 seconds pass** → Startup check detects no meaningful output
3. **Log message** → "Will retry startup (attempt 2/3)"
4. **Kill process** → `killClaudeProcess(instance)` called
5. **Promise rejects** → Execution jumps to catch block
6. **Feature marked failed** → But NO retry actually happens
7. **Health check runs** → Sees feature "failed", sandbox gets another chance
8. **Cycle repeats** → Another log file, another 60-second hang

### Confidence Level

**Confidence**: High

**Reasoning**:
- The code path is clear and traceable
- Log timestamps prove detection works (60s gaps)
- Log timestamps prove retry doesn't happen (no backoff delays visible)
- Implementation report (#1445) lists "detection" but not "retry loop"
- The `totalAttempts` variable is initialized to 1 and never incremented

## Fix Approach (High-Level)

**Option A (Recommended)**: Wrap `sandbox.commands.run()` in a retry loop inside `runFeatureImplementation()`:

```typescript
// Pseudo-code for fix
let attempt = 0;
let result;
while (attempt < MAX_STARTUP_RETRIES) {
  attempt++;
  startupTracker = createStartupOutputTracker(); // Reset tracker
  startupHangDetected = false;

  try {
    result = await sandbox.commands.run(...);
    break; // Success
  } catch (error) {
    if (startupHangDetected && attempt < MAX_STARTUP_RETRIES) {
      const delay = STARTUP_RETRY_DELAYS_MS[attempt - 1];
      log(`Retrying in ${delay}ms...`);
      await sleep(delay);
      continue; // Retry
    }
    throw error; // Exhausted retries or different error
  }
}
```

**Option B**: Move retry logic to orchestrator level, properly resetting feature status to "pending" after startup hang failure so it can be re-assigned.

## Diagnosis Determination

The root cause is a partially implemented feature. The startup timeout detection mechanism from bug fix #1445 was added, but the actual retry loop was never implemented. The system detects hangs correctly but then falls through to the error handler which marks the feature as failed without actually retrying.

The fix requires adding a retry loop wrapper around the `sandbox.commands.run()` call that:
1. Catches startup hang errors
2. Waits the configured backoff delay
3. Resets the startup tracker
4. Retries the Claude invocation
5. Only propagates failure after exhausting retries

## Additional Context

- This bug was introduced in commit `75052b277` which added detection but not retry
- The implementation report (#1445-implementation) claimed success but only implemented half the solution
- The configuration for retry delays exists and is correct: `[5000, 10000, 30000]`
- The detection logic is correct and working
- The utility functions in `startup-monitor.ts` are correct
- Only the retry loop wrapper is missing

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Glob, Bash, file analysis*
