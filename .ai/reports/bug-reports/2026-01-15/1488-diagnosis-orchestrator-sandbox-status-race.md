# Bug Diagnosis: Alpha Orchestrator Sandbox Status Race Condition

**ID**: ISSUE-pending (GitHub issue to be created)
**Created**: 2026-01-15T17:45:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The Alpha Orchestrator exhibits a race condition where sandboxes are marked as "idle" and "blocked" even while they have active work assigned. This causes the UI to show all sandboxes as waiting/blocked when they should be executing features. This is a regression from the fix implemented in Issue #1487.

## Environment

- **Application Version**: Current dev branch
- **Environment**: development
- **Node Version**: 20.x
- **Last Working**: Before Issue #1487 fix (commit a00fecc48)

## Reproduction Steps

1. Run the Alpha Orchestrator with `pnpm alpha:orchestrate 1362 --ui`
2. Observe all 3 sandboxes get assigned features (#1367, #1374, #1377)
3. Wait for `HEALTH_CHECK_INTERVAL_MS` (health check interval)
4. Observe all sandboxes now show "idle" and "blocked by #1371, #1372" in the UI
5. Actual work is still running, but progress files are overwritten with idle status

## Expected Behavior

Sandboxes that have been assigned work should show their actual status ("busy", "executing") and not be overwritten with "idle" status. The UI should display the correct progress for each sandbox.

## Actual Behavior

All sandboxes show as "idle" with `phase: "waiting"` and are reported as "blocked" by features #1371, #1372 - even though:
1. Features #1367, #1374, #1377 ARE assigned to sandboxes sbx-a, sbx-b, sbx-c
2. Features #1371, #1372 are NOT blocking work - they're features with unmet dependencies (blocking themselves from running, not blocking other sandboxes)

## Diagnostic Data

### Progress File State (sbx-a-progress.json)

```json
{
  "sandbox_id": "iltp3mrk64",
  "runId": "run-mkfo21rg-3b2j",
  "feature": undefined,
  "status": "idle",
  "phase": "waiting",
  "waiting_reason": "Waiting for dependencies (7 features blocked)",
  "blocked_by": [1371, 1372]
}
```

### Manifest State (spec-manifest.json excerpt)

```json
{
  "id": 1367,
  "title": "Dashboard Page & Grid Layout",
  "status": "in_progress",
  "assigned_sandbox": "sbx-a",
  "assigned_at": 1768497908857
}
```

### Timestamp Analysis

- Features assigned at: 12:25 PM (1768497908857 = Thu Jan 15 12:25:08 PM EST 2026)
- Manifest last modified: 12:32:26 PM
- Progress files last modified: 12:35:30 PM (showing idle status)

The progress files were OVERWRITTEN with "idle" status 10 minutes AFTER features were assigned to sandboxes.

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/orchestrator.ts:650-730` - Work loop with race condition
  - `.ai/alpha/scripts/lib/feature.ts:166-167` - Status change inside async Promise
  - `.ai/alpha/scripts/lib/progress.ts:226-259` - writeIdleProgress function

- **Recent Changes**: Issue #1487 fix (commit a00fecc48) added error handler cleanup but did not address the root cause race condition

## Related Issues & Context

### Direct Predecessors
- #1487 (CLOSED): "Bug Fix: Alpha Orchestrator Stall Due to Failed Feature with Assigned Sandbox" - The fix from this issue added `instance.status = "ready"` cleanup in the error handler, but the root cause race condition existed before this fix.
- #1486 (CLOSED): "Diagnosis: Alpha Orchestrator Stall" - Original diagnosis that led to #1487

### Same Component
- #1472, #1469: PTY-related fixes for output buffering
- #1465: Health check race condition fixes

### Historical Context
This bug exposes a latent race condition that has likely existed since the orchestrator was created. The #1487 fix didn't cause this bug directly - it just happened to reveal it by making sandboxes return to "ready" state faster after errors.

## Root Cause Analysis

### Identified Root Cause

**Summary**: `instance.status` is not set to `"busy"` until INSIDE the async Promise that runs `runFeatureImplementation`, creating a race window where the work loop can see the sandbox as "ready" and overwrite its progress with idle status.

**Detailed Explanation**:

The work loop in `orchestrator.ts` has this sequence (lines 681-729):

```typescript
const assigned = assignFeatureToSandbox(feature, instance.label, manifest, uiEnabled);
if (!assigned) {
    continue;
}
// NOTE: instance.status is still "ready" here!

const workPromise = (async () => {
    try {
        await runFeatureImplementation(...);  // Status set to "busy" INSIDE this function
    } catch (error) {
        instance.status = "ready";  // Fix from #1487
    }
})();

activeWork.set(instance.label, workPromise);
```

The problem is that `instance.status = "busy"` happens INSIDE `runFeatureImplementation()` at feature.ts:167, which is called inside an async Promise. There's no synchronous status change BEFORE the Promise starts.

**Race condition timeline**:

```
t0: assignFeatureToSandbox() succeeds - feature.assigned_sandbox = "sbx-a"
t1: workPromise created (async, non-blocking)
t2: activeWork.set("sbx-a", workPromise)
t3: Loop continues to sleep
t4: Promise.race returns (sleep completes OR work finishes)
t5: Loop starts new iteration
t6: For sbx-a: instance.status is STILL "ready" (Promise hasn't set it to "busy" yet)
t7: getNextAvailableFeature() returns null (all features are in_progress)
t8: writeIdleProgress() called for sbx-a - OVERWRITES correct progress!
```

**Supporting Evidence**:

1. Timestamp analysis shows progress files (idle) written AFTER manifest (work assigned)
2. Manifest shows correct state: features in_progress with assigned_sandbox
3. Progress files show wrong state: sandboxes idle and blocked
4. The `status = "busy"` assignment is at feature.ts:167 INSIDE runFeatureImplementation

**Code reference**:
- `.ai/alpha/scripts/lib/orchestrator.ts:694-698` - No status change between assignment and Promise
- `.ai/alpha/scripts/lib/feature.ts:166-167` - Status change inside async function

### How This Causes the Observed Behavior

1. Feature is assigned to sandbox in manifest (correct)
2. Async Promise starts but hasn't executed `status = "busy"` yet
3. Work loop continues, `Promise.race` returns after health check interval
4. Loop checks sandbox status - still "ready" (async hasn't run yet)
5. `getNextAvailableFeature()` returns null (all features assigned)
6. `writeIdleProgress()` called, overwriting any existing progress
7. UI shows "idle" and "blocked" for all sandboxes

### Confidence Level

**Confidence**: High

**Reasoning**:
- The code path clearly shows the race condition
- Timestamps prove progress files are overwritten AFTER feature assignment
- The state mismatch (manifest correct, progress files wrong) is consistent with this explanation
- This is a textbook async race condition pattern

## Fix Approach (High-Level)

Set `instance.status = "busy"` and `instance.currentFeature = feature.id` SYNCHRONOUSLY immediately after `assignFeatureToSandbox()` succeeds, BEFORE starting the async Promise. This eliminates the race window.

```typescript
const assigned = assignFeatureToSandbox(feature, instance.label, manifest, uiEnabled);
if (!assigned) {
    continue;
}

// FIX: Set status BEFORE starting async Promise
instance.status = "busy";
instance.currentFeature = feature.id;
instance.featureStartedAt = new Date();

const workPromise = (async () => {
    // runFeatureImplementation can still update other fields, but status is already "busy"
    await runFeatureImplementation(...);
})();
```

Also need to update `runFeatureImplementation()` to NOT overwrite `instance.status` if it's already "busy" (defensive programming).

## Diagnosis Determination

The root cause is a classic async race condition. The fix is straightforward: move the status change to BEFORE the async Promise starts. This is a low-risk fix that follows the same pattern used elsewhere in the orchestrator for sandbox state management.

## Additional Context

This bug may have been present since the orchestrator was first created, but was masked by the fact that sandboxes usually get to "busy" state quickly. The health check interval (~30s) creates a window where this race can be observed. The #1487 fix didn't cause this bug, but the error handling changes may have made it more likely to be observed by changing timing characteristics.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Bash (timestamp analysis), git status*
