# Bug Diagnosis: Alpha Orchestrator Exits Prematurely With Active Work

**ID**: ISSUE-pending
**Created**: 2026-01-15T11:08:00Z
**Reporter**: msmith
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Orchestrator exited after 14 minutes 17 seconds while all 3 sandboxes were still actively working on features. The UI showed "Offline" status, the lock file remained (indicating abnormal exit), and 3 features were left in `in_progress` state with assigned sandboxes. This is a regression or new manifestation of orchestrator stability issues following fixes for #1469 and #1466.

## Environment

- **Application Version**: dev branch (commit b07068f36)
- **Environment**: development (local WSL2)
- **Node Version**: (tsx runtime)
- **Platform**: linux (WSL2)
- **Spec ID**: 1362 (user dashboard home)
- **Run ID**: run-mkfme9zp-hcx0

## Reproduction Steps

1. Run the Alpha Orchestrator with: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --ui`
2. Let it run for approximately 14 minutes with 3 active sandboxes
3. Observe the orchestrator exits unexpectedly while sandboxes are still processing features

## Expected Behavior

The orchestrator should continue running until:
- All features are completed, OR
- All features fail and cannot be retried, OR
- User explicitly terminates with Ctrl+C or 'q'

## Actual Behavior

The orchestrator exited after 14m 17s while:
- 3 features were still `in_progress` (1369, 1370, 1374)
- All 3 sandboxes had recent heartbeats (11s, 17s, 12s ago)
- The work loop exit conditions were NOT met
- The lock file was NOT released (remained at `.ai/alpha/.orchestrator-lock`)

## Diagnostic Data

### Lock File (Still Present After Exit)
```json
{
  "spec_id": 1362,
  "started_at": "2026-01-15T15:44:27.858Z",
  "pid": 72134,
  "hostname": "SlideHeroesDen"
}
```

### Manifest State at Exit
```
Features in_progress:
- #1369 (Quick Actions Panel) - assigned to sbx-a
- #1370 (Empty State System) - assigned to sbx-c
- #1374 (Activity Recording Service) - assigned to sbx-b

Progress: 4/13 features completed (41%)
```

### Log File Evidence

sbx-a.log - Last session started at 15:55:42, no PTY completion logged:
```
Started: 2026-01-15T15:55:42.820Z
[PTY] Sending command: run-claude "/alpha:implement 1369"
Running Claude Code with prompt: /alpha:implement 1369
(no completion - process terminated)
```

sbx-b.log - Shows "Terminated" during feature #1374:
```
Started: 2026-01-15T15:52:14.619Z
Running Claude Code with prompt: /alpha:implement 1374
Terminated
(no PTY completion logged)
```

sbx-c.log - Last session started at 15:57:50, no PTY completion:
```
Started: 2026-01-15T15:57:50.221Z
[PTY] Sending command: run-claude "/alpha:implement 1370"
Running Claude Code with prompt: /alpha:implement 1370
(no completion - process terminated)
```

### Timeline Analysis
```
15:44:27 - Orchestrator started
15:47:00 - All 3 sandboxes created and started first features
15:52:14 - sbx-b started #1374 (Activity Recording Service)
15:55:42 - sbx-a started #1369 (Quick Actions Panel)
15:57:49 - Last manifest checkpoint
15:57:50 - sbx-c started #1370 (Empty State System)
~15:58:44 - Orchestrator exited (14m 17s elapsed)
```

## Error Stack Traces

No stack trace available - the process terminated without logging an error. The `main().catch()` handler should have printed an error message if an exception occurred.

## Related Code

**Affected Files**:
- `.ai/alpha/scripts/spec-orchestrator.ts:90-96` - Main entry point lacks lock release on error
- `.ai/alpha/scripts/lib/orchestrator.ts:632-748` - Work loop try-finally doesn't release lock
- `.ai/alpha/scripts/lib/orchestrator.ts:1142` - Lock release only happens at function end

**Key Code Sections**:

1. Main entry point (spec-orchestrator.ts:90-96):
```typescript
main().catch((error) => {
    console.error("\n❌ Orchestrator error:", error);
    process.exit(1);  // BUG: Does NOT release lock!
});
```

2. Work loop wrapper (orchestrator.ts:632-748):
```typescript
try {
    while (true) {
        // ... work loop logic ...
    }
} finally {
    // Only clears intervals, does NOT release lock
    clearInterval(healthCheckInterval);
    clearInterval(keepaliveInterval);
}
```

3. Lock release (orchestrator.ts:1142):
```typescript
// Only reached if function completes normally
releaseLock(options.ui);
```

## Related Issues & Context

### Direct Predecessors
- #1469 (CLOSED): "Alpha Orchestrator Exits at ~6 Minutes Due to E2B stdout Disconnect" - Fixed PTY streaming
- #1466 (CLOSED): "Orchestrator Premature Exit When All Sandboxes Fail Simultaneously" - Fixed exit condition

### Similar Symptoms
- #1467: Work loop exit condition bug (fixed but may have edge cases)
- #1465: Competing retry mechanisms (fixed)

### Historical Context
This appears to be a NEW bug or edge case not covered by previous fixes. The PTY fix (#1469) resolved the stdout streaming issue, but the orchestrator now has a different failure mode where it exits without proper cleanup.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The orchestrator lacks comprehensive error handling that ensures lock release on ANY exit path.

**Detailed Explanation**:

The orchestrator has multiple exit paths, but only ONE releases the lock:

1. **Normal completion** (line 1142): Lock released ✓
2. **SIGINT/SIGTERM** (lines 881-889): Lock released via `cleanupAndExit()` ✓
3. **Unhandled exception** (main catch): Lock NOT released ✗
4. **Work loop error** (try-finally): Lock NOT released ✗
5. **Process crash/kill -9**: Lock NOT released ✗

The evidence suggests the orchestrator received an unhandled exception or was killed externally:
- Lock file exists → `releaseLock()` was never called
- Features still `in_progress` → work loop didn't complete normally
- No error message logged → exception not caught by `main().catch()` OR process killed

**Most Likely Cause**: An unhandled promise rejection in the work loop's `Promise.race()` at line 740. While `runFeatureImplementation` has its own error handling, there may be an edge case where an error escapes.

**Alternative Cause**: External process termination (OOM killer, terminal disconnect, etc.).

**Supporting Evidence**:
- sbx-b log shows "Terminated" which indicates Claude Code was killed by health/stall detection
- All 3 PTY sessions were interrupted mid-execution (no completion logged)
- The UI showed "Offline" immediately when the orchestrator process died

### How This Causes the Observed Behavior

1. An error occurs somewhere in the orchestrator (possibly Promise rejection)
2. The error propagates up and is either:
   - Caught by `main().catch()` which exits without releasing lock
   - Uncaught (if async rejection) causing silent process termination
3. Lock file remains on disk
4. Features stay in `in_progress` state
5. Sandboxes continue running independently (E2B keeps them alive)
6. UI loses connection and shows "Offline"

### Confidence Level

**Confidence**: Medium

**Reasoning**:
- The evidence clearly shows abnormal termination (lock not released)
- The exact trigger is unclear without additional logging
- Could be either code bug or external kill
- The fact that no error was logged suggests it's either:
  1. An unhandled async rejection (not caught by main().catch)
  2. External SIGKILL (no handler possible)

## Fix Approach (High-Level)

1. **Add comprehensive lock release**: Wrap the entire `orchestrate()` function in a try-finally that ensures lock release
2. **Add unhandledRejection handler**: Register `process.on('unhandledRejection')` to log and cleanup
3. **Add error boundaries in work loop**: Ensure Promise rejections in `activeWork` map are caught
4. **Improve logging**: Add structured logging to capture the exact exit reason

Example fix:
```typescript
// In spec-orchestrator.ts
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
    releaseLock(false);
    process.exit(1);
});

// In orchestrate()
try {
    // ... existing code ...
} finally {
    releaseLock(options.ui);
}
```

## Diagnosis Determination

The orchestrator terminated abnormally after 14m 17s without releasing its lock or updating feature status. The root cause is **missing error handling that ensures lock release on all exit paths**. The specific trigger for this instance is unclear but is likely:

1. An unhandled promise rejection that escaped error boundaries, OR
2. External process termination

To definitively identify the trigger, additional logging needs to be added to capture:
- All promise rejections
- Process exit events
- Signal handlers
- The exact state at time of exit

## Additional Context

This bug causes issues for subsequent orchestrator runs because:
1. The stale lock prevents new runs from starting
2. The manifest is left in an inconsistent state
3. Features marked `in_progress` need manual cleanup

The existing fix for #1467 (exit condition) is working correctly - the issue is at a different level (error handling and cleanup).

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Glob, Bash (git, gh), grep*
