# Bug Diagnosis: Alpha Orchestrator Premature Exit at ~5-6 Minutes

**ID**: ISSUE-1463
**Created**: 2026-01-14T16:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Orchestrator exits prematurely at approximately 5-6 minutes into execution, despite sandboxes still actively working on features. This happens deterministically at the same time across multiple runs, ruling out accidental user input. The root cause is a race condition between two competing retry/recovery mechanisms that collide at the 3-minute mark.

## Environment

- **Application Version**: dev branch
- **Environment**: development (E2B sandboxes)
- **Node Version**: 20.x
- **E2B Template**: slideheroes-claude-agent-dev
- **Authentication**: OAuth (Max plan)

## Reproduction Steps

1. Run the spec orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
2. Observe the UI showing all 3 sandboxes in "executing" phase
3. Wait approximately 5-6 minutes
4. Orchestrator exits with all sandboxes still showing as active (green indicators)

## Expected Behavior

The orchestrator should continue running until all features are completed or all retry mechanisms are exhausted. Failed features should be retried by available sandboxes.

## Actual Behavior

The orchestrator exits at approximately 5 minutes 43 seconds, with:
- All 3 sandboxes showing as active (green indicators)
- Progress at 0/110 tasks, 0/13 features
- Features still in `in_progress` state in the manifest
- No error message displayed (clean exit)

## Diagnostic Data

### Timeline Analysis

Based on timestamps from the crash:
- **16:18:33** - Orchestrator lock acquired
- **16:21:03** - Features started (after sandbox creation)
- **16:24:16** - Orchestrator exited
- **Duration**: 5 minutes 43 seconds total, **3 minutes 13 seconds** into feature execution

### Log File Evidence

All 3 sandbox log files show identical pattern - only 2 lines of output per retry:
```
Using OAuth authentication (Max plan)
Running Claude Code with prompt: /alpha:implement 1367

=== WAITING 5s BEFORE RETRY ===

=== RETRY ATTEMPT 2/3 ===
Using OAuth authentication (Max plan)
Running Claude Code with prompt: /alpha:implement 1367

=== WAITING 10s BEFORE RETRY ===

=== RETRY ATTEMPT 3/3 ===
Using OAuth authentication (Max plan)
Running Claude Code with prompt: /alpha:implement 1367
```

### Progress File State

At time of exit, progress files showed:
- `sbx-a-progress.json`: Feature #1367, phase: executing, last heartbeat 24s ago
- `sbx-b-progress.json`: Feature #1373, phase: loading_context, last heartbeat 27s ago
- `sbx-c-progress.json`: Feature #1376, phase: executing, last heartbeat 25s ago

### Critical Timeout Configurations

```typescript
// config/constants.ts
STARTUP_TIMEOUT_MS = 60 * 1000;           // 60 seconds per retry attempt
STARTUP_RETRY_DELAYS_MS = [5000, 10000, 30000];  // Backoff between retries
MAX_STARTUP_RETRIES = 3;
MIN_STARTUP_OUTPUT_LINES = 5;             // Required for "meaningful output"

// health.ts
STARTUP_OUTPUT_TIMEOUT_MS = 3 * 60 * 1000;  // 3 minutes - CRITICAL
PROGRESS_FILE_TIMEOUT_MS = 5 * 60 * 1000;   // 5 minutes
```

## Root Cause Analysis

### Identified Root Cause

**Summary**: Two competing retry/recovery mechanisms collide at the 3-minute mark, causing a race condition that results in premature orchestrator exit.

**Detailed Explanation**:

The system has TWO separate mechanisms for handling startup failures:

1. **feature.ts startup retry loop** (lines 319-432):
   - Detects startup hangs at 60s timeout (`STARTUP_TIMEOUT_MS`)
   - Retries up to 3 times with exponential backoff (5s, 10s, 30s)
   - Total cycle time: 60 + 5 + 60 + 10 + 60 = 195s (~3.25 minutes)

2. **health.ts health check** (lines 90-99):
   - Runs every 30 seconds (`HEALTH_CHECK_INTERVAL_MS`)
   - Triggers "startup hung" detection at 3 minutes (`STARTUP_OUTPUT_TIMEOUT_MS`)
   - Checks if `outputLineCount < MIN_STARTUP_OUTPUT_LINES` (5 lines)

**The Collision**:

When Claude CLI hangs during OAuth authentication (a known issue), each retry only produces 2 output lines:
```
Using OAuth authentication (Max plan)
Running Claude Code with prompt: /alpha:implement XXXX
```

At exactly 3 minutes (180s) into feature execution:
1. feature.ts is in the middle of retry #2 or #3 (which starts at ~135s)
2. Health check runs and sees only 2 output lines (< 5 required)
3. Health check declares sandbox "unhealthy" with `issue: "no_progress_file"`
4. Health check kills the Claude process via `killClaudeProcess()`
5. feature.ts retry loop catches the unexpected SIGTERM
6. Since `startupHangDetected` is false (health check killed it, not startup monitor), error propagates to outer catch
7. Feature marked as "failed", sandbox goes to "ready"
8. All 3 sandboxes fail simultaneously (same timing on all)
9. Main work loop checks `activeWork.size === 0` → exits

**Supporting Evidence**:

- Exit time of 5m 43s = ~3m 13s into feature execution
- This is immediately after the 3-minute `STARTUP_OUTPUT_TIMEOUT_MS` threshold
- Same timing on two separate runs rules out accidental 'q' keypress
- Log files show only 2 lines output (< 5 required), triggering health check failure

### How This Causes the Observed Behavior

1. OAuth authentication causes Claude CLI to hang (no output)
2. Startup retry loop begins handling this with 60s timeout + retries
3. At 3 minutes, health check fires due to `STARTUP_OUTPUT_TIMEOUT_MS`
4. Health check kills process, not knowing feature.ts is already handling it
5. feature.ts sees unexpected termination, throws error
6. Error propagates because `startupHangDetected` flag wasn't set by health check
7. All 3 sandboxes fail at the same wall-clock time (all started together)
8. Work loop finds `activeWork.size === 0` and exits

### Confidence Level

**Confidence**: High

**Reasoning**:
- Timeline matches exactly with 3-minute timeout
- Same behavior on multiple runs (deterministic)
- Log files confirm only 2 output lines (< 5 threshold)
- Code path clearly shows race condition between two retry systems

## Fix Approach (High-Level)

**Option 1 (Recommended)**: Increase `STARTUP_OUTPUT_TIMEOUT_MS` from 3 minutes to 5+ minutes

This ensures the health check's startup detection doesn't fire until AFTER the feature.ts startup retry loop has completed all 3 attempts (~4 minutes total).

```typescript
// health.ts line 57
const STARTUP_OUTPUT_TIMEOUT_MS = 5 * 60 * 1000; // Change from 3 to 5 minutes
```

**Option 2**: Add coordination flag between retry systems

Add an `instance.startupRetryInProgress` flag that health check respects:
- feature.ts sets flag when entering retry loop
- health.ts skips startup hung detection if flag is set
- feature.ts clears flag when retry loop completes

**Option 3**: Consolidate retry logic

Move all startup retry handling to one place (either feature.ts or health.ts) to eliminate the race condition entirely.

## Diagnosis Determination

The orchestrator exits prematurely due to a race condition between two competing retry mechanisms. When Claude CLI hangs during OAuth authentication, the feature.ts startup retry loop begins handling it. However, at exactly 3 minutes, the health.ts health check independently detects "startup hung" based on insufficient output lines and kills the process. This unexpected termination causes the feature.ts retry to fail without proper handling, resulting in all sandboxes marking their features as failed simultaneously and the orchestrator exiting due to the `activeWork.size === 0` check.

## Additional Context

### Related Issues

- #1446 - Bug Diagnosis: Alpha Sandbox Startup Retry Loop Not Implemented (CLOSED - fixed)
- #1447 - Bug Fix: Alpha Sandbox Startup Retry Loop Implementation (CLOSED - implemented retry loop)
- #1448 - Bug Diagnosis: Claude CLI Startup Hang in E2B Sandboxes (CLOSED)
- #1450 - Bug Diagnosis: Alpha Sandbox OAuth Startup Timeout Too Aggressive (CLOSED)

### Affected Files

- `.ai/alpha/scripts/lib/health.ts:57` - `STARTUP_OUTPUT_TIMEOUT_MS` constant
- `.ai/alpha/scripts/lib/health.ts:90-99` - Startup hung detection logic
- `.ai/alpha/scripts/lib/feature.ts:319-432` - Startup retry loop
- `.ai/alpha/scripts/lib/orchestrator.ts:700-718` - Work loop exit condition

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Bash (file inspection, timeline analysis)*
