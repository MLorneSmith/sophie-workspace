# Bug Diagnosis: Orchestrator UI Hang Due to In-Progress Feature State Mismatch

**ID**: ISSUE-1840
**Created**: 2026-01-26T22:50:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Orchestrator UI hung at 35 minutes 17 seconds while implementing spec S1823. Investigation reveals a state mismatch where feature `S1823.I4.F3` is marked as `in_progress` in the manifest but all sandboxes show `idle` status in their progress files. This creates a deadlock-like condition where:
1. The stuck feature blocks initiative completion
2. Dependent features (S1823.I5.F3, S1823.I5.F4) remain blocked
3. The orchestrator's work loop waits indefinitely for a promise that never resolves
4. Deadlock detection is skipped because `activeWork.size > 0`

## Environment

- **Application Version**: Alpha Orchestrator (spec-orchestrator.ts)
- **Environment**: development (E2B sandboxes)
- **Node Version**: As configured in monorepo
- **Database**: Supabase sandbox project
- **Last Working**: Previous orchestrator runs completed successfully

## Reproduction Steps

1. Run the Alpha orchestrator: `tsx spec-orchestrator.ts S1823`
2. Wait for implementation to progress through multiple features (~30+ minutes)
3. Observe UI hang when feature S1823.I4.F3 gets assigned but doesn't complete properly
4. Note that all sandboxes show "Waiting for dependencies" but one feature is stuck in `in_progress`

## Expected Behavior

When a feature's execution hangs or fails silently:
1. The stuck task detection should identify the mismatch within 60 seconds
2. The feature should be reset to `pending` for reassignment
3. The deadlock detection should catch the condition if all sandboxes are idle
4. The orchestrator should continue making progress or cleanly exit with an error

## Actual Behavior

1. Feature S1823.I4.F3 gets assigned to sbx-a at 22:31:11 UTC
2. The feature's work promise never resolves (suspected PTY hang or Claude session crash)
3. The sandbox's IN-MEMORY status remains `"busy"` indefinitely
4. The `activeWork` Map contains the pending promise, so `activeWork.size > 0`
5. `handleIdleState()` is never called (deadlock detection skipped)
6. `detectAndRecoverStuckTasks()` sees sandbox status as `"busy"`, so doesn't trigger recovery
7. Work loop hangs at `Promise.race([...this.activeWork.values(), sleep(...)])`
8. UI shows all sandboxes as "idle/waiting" because progress files are from UI polling, not in-memory state

## Diagnostic Data

### Progress Files State

All three sandbox progress files show identical "idle" state:
```json
{
  "sandbox_id": "iooonld8wjugp8a84vsf9",
  "status": "idle",
  "phase": "waiting",
  "waiting_reason": "Waiting for dependencies (2 features blocked)",
  "blocked_by": ["S1823.I5.F3", "S1823.I5.F4"]
}
```

### Manifest State

Feature S1823.I4.F3 shows `in_progress`:
```json
{
  "id": "S1823.I4.F3",
  "title": "Booking Modal Integration",
  "status": "in_progress",
  "tasks_completed": 0,
  "task_count": 4,
  "assigned_sandbox": "sbx-a",
  "assigned_at": 1769466671336
}
```

### Timeline Analysis

| Timestamp | Event |
|-----------|-------|
| 22:00:40 | Spec manifest generated |
| 22:01:28 | Sandboxes created |
| 22:31:11 | S1823.I4.F3 assigned to sbx-a |
| 22:36:03 | Last manifest checkpoint |
| 22:44:35 | Last heartbeat in progress files |
| ~22:35:17 | Reported hang time (35m17s from start) |

### Key Observation

The `blocked_by` field in progress files shows features S1823.I5.F3 and S1823.I5.F4 - these are the features **waiting to be unblocked**, NOT the feature causing the blockage. This is a cosmetic/display bug in `writeIdleProgress()` but not the root cause.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The orchestrator work loop hangs because a stuck `in_progress` feature's work promise never resolves, and the stuck task detection doesn't fire because it checks the in-memory sandbox status (which remains `"busy"`) instead of checking for promise timeout or heartbeat age.

**Detailed Explanation**:

The bug exists in the interaction between three components:

1. **Work Loop Promise Wait** (`work-loop.ts:442-445`):
   ```typescript
   await Promise.race([
     ...this.activeWork.values(),
     sleep(HEALTH_CHECK_INTERVAL_MS),
   ]);
   ```
   This waits for any active work OR health check interval. If a work promise hangs, it never completes but the `sleep()` does, causing the loop to continue.

2. **Stuck Task Detection Condition** (`work-loop.ts:676,693`):
   ```typescript
   if (sandboxInstance.status === "busy") {
     // PTY fallback recovery...
   }
   // Later:
   if (tasksRemaining > 0 && sandboxInstance.status !== "busy" && assignedDuration > STUCK_TASK_THRESHOLD_MS)
   ```
   This checks the IN-MEMORY sandbox status. If the promise never resolved, the status remains `"busy"`, so neither branch triggers recovery.

3. **Deadlock Detection Skip** (`work-loop.ts:427-433`):
   ```typescript
   if (this.activeWork.size === 0) {
     const shouldExit = await this.handleIdleState();
     // ...
   }
   ```
   Deadlock detection is only called when NO work is active. A stuck promise keeps `activeWork.size > 0`, bypassing this entirely.

**The Gap**: There's no mechanism to detect when a work promise has been pending too long. The health check interval fires, but it doesn't check if promises are stuck - it only runs `runHealthChecks()` and `detectAndRecoverStuckTasks()`, both of which rely on sandbox status being NOT busy.

### How This Causes the Observed Behavior

1. Feature assigned → `instance.status = "busy"`, promise added to `activeWork`
2. PTY hangs or Claude crashes → promise never resolves
3. Work loop continues iterating (sleep(30s) completes)
4. Each iteration:
   - `assignWorkToIdleSandboxes()` skips sbx-a (status is "busy")
   - `activeWork.size > 0` → deadlock detection skipped
   - `detectAndRecoverStuckTasks()` sees status "busy" → no action
   - `Promise.race()` sleeps for 30s then continues
5. Result: Infinite loop with no recovery

**Why progress files show "idle"**: The UI progress files are written by the orchestrator's progress polling, which reads from the sandbox's internal progress file. When the feature work stops outputting, the last progress file state might be stale or cleared.

### Confidence Level

**Confidence**: High

**Reasoning**:
- The manifest shows `in_progress` with `assigned_sandbox` while progress files show `idle` - clear mismatch
- The timestamps show feature was assigned ~4 minutes before reported hang time
- The code analysis reveals a logical gap where hung promises bypass all recovery mechanisms
- This exact scenario (PTY timeout leading to hung promise) has been addressed before (#1767, #1786) but the work loop level wasn't fully protected

## Fix Approach (High-Level)

Add a **promise timeout monitor** to the work loop that tracks how long each work promise has been pending. If a promise exceeds a threshold (e.g., 10 minutes without the sandbox's heartbeat updating), forcibly reject it and reset the feature.

Alternatively, modify `detectAndRecoverStuckTasks()` to also check:
1. How long the work promise has been in `activeWork`
2. Whether the sandbox has any recent heartbeat activity
3. Whether the assigned feature has made any progress (tasks_completed changes)

If none of these show activity for > STUCK_TASK_THRESHOLD_MS, kill the Claude process and reset the feature regardless of in-memory status.

## Diagnosis Determination

The root cause is a logical gap in the work loop's recovery mechanisms. When a feature work promise hangs (PTY timeout, Claude crash, etc.), the promise never resolves but the sandbox's in-memory status remains `"busy"`. All existing recovery mechanisms check for `status !== "busy"` as a precondition, so none can trigger. The deadlock detection is skipped because `activeWork` contains the hung promise.

This is a design gap that became exposed with long-running features where PTY disconnects can occur silently.

## Additional Context

### Related Issues

- #1767: PTY timeout handling with progress file fallback
- #1786: PTY still-running loop to prevent killing healthy features
- #1699, #1701: PTY timeout configuration to prevent silent disconnects
- #1688: Stuck task detection initial implementation
- #1777: Deadlock detection and recovery

### Affected Files

- `.ai/alpha/scripts/lib/work-loop.ts` - Work loop with stuck detection
- `.ai/alpha/scripts/lib/feature.ts` - Feature implementation with PTY handling
- `.ai/alpha/scripts/lib/deadlock-handler.ts` - Deadlock detection
- `.ai/alpha/scripts/lib/progress.ts` - Progress file management

### Suggested Fix Location

Add to `WorkLoop.run()` or create a new interval that monitors:
1. `activeWork` promise ages
2. Manifest assigned_at timestamps vs current time
3. Progress file heartbeat ages for busy sandboxes

Forcibly reject stuck promises after threshold exceeded.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash*
