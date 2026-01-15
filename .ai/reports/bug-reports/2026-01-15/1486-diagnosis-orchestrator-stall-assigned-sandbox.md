# Bug Diagnosis: Alpha Orchestrator Stall Due to Failed Feature with Assigned Sandbox

**ID**: ISSUE-pending
**Created**: 2026-01-15T17:20:00.000Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Orchestrator stalls indefinitely at ~34 minutes into execution instead of properly exiting or recovering. The root cause is that failed features retain their `assigned_sandbox` field, causing them to be skipped by `getNextAvailableFeature()` even though they should be retryable. The orchestrator's work loop continues infinitely waiting for features that will never become available.

## Environment

- **Application Version**: dev branch
- **Environment**: development
- **Node Version**: 20.x
- **Run ID**: run-mkfme9zp-hcx0 (archived at 2026-01-15T16-30-55)
- **Run ID**: run-mkfo21rg-3b2j (current, stalled)

## Reproduction Steps

1. Start the Alpha Orchestrator with `pnpm alpha:orchestrate 1362 --ui`
2. Wait for features to be executed across sandboxes
3. A feature fails due to SIGTERM (exit status 143) or timeout
4. The error is caught by the work loop's error handler in `orchestrator.ts:698-723`
5. The feature is marked as "failed" but `assigned_sandbox` is NOT cleared
6. The work loop continues but `getNextAvailableFeature()` returns null
7. Orchestrator stalls indefinitely instead of retrying or exiting

## Expected Behavior

- Failed features should have `assigned_sandbox` cleared so they can be retried
- The orchestrator should either retry the failed feature or exit if all work is blocked

## Actual Behavior

- Feature #1368 marked as "failed" with `error: "exit status 143"` but still has `assigned_sandbox: "sbx-c"`
- `getNextAvailableFeature()` skips the feature at line 115-116 because `assigned_sandbox` is set
- Work loop continues forever at `orchestrator.ts:729-754` because:
  - `activeWork.size === 0` (no sandboxes working)
  - `retryableFeatures.length > 0` (failed/pending features exist)
  - But no features are actually available (all blocked or have `assigned_sandbox` set)

## Diagnostic Data

### Manifest State at Stall

```json
{
  "id": 1368,
  "status": "failed",
  "assigned_sandbox": "sbx-c",        // BUG: Should be undefined
  "assigned_at": 1768495764088,       // BUG: Should be undefined
  "error": "exit status 143"
}
```

### Progress Files

All three sandboxes showing "idle" status with old heartbeats:
- sbx-a: 17:08:43, waiting for dependencies
- sbx-b: empty (1 byte file)
- sbx-c: 17:08:43, waiting for dependencies

### Log File Evidence

sbx-b log shows "Terminated" (SIGTERM) for Feature #1374:
```
[PTY] Sending command: run-claude "/alpha:implement 1374"
Using OAuth authentication (Max plan)
Running Claude Code with prompt: /alpha:implement 1374
Terminated
```

sbx-c log ends abruptly without any output after starting Feature #1370.

## Error Stack Traces

No stack traces - this is a logic bug, not an exception.

## Related Code
- **Affected Files**:
  - `.ai/alpha/scripts/lib/orchestrator.ts:698-723` - Work loop error handler missing cleanup
  - `.ai/alpha/scripts/lib/work-queue.ts:114-117` - Skips features with `assigned_sandbox`
  - `.ai/alpha/scripts/lib/feature.ts:676-680` - Feature error handler correctly clears assignment
  - `.ai/alpha/scripts/lib/health.ts:298-302,328-331` - Health check correctly clears assignment

## Related Issues & Context

### Direct Predecessors
- #1463 (CLOSED): "Alpha Orchestrator Premature Exit Due to Competing Retry Mechanisms" - Related timing issue
- #1469 (CLOSED): "E2B stdout Disconnect" - PTY buffering fix, similar failure patterns

### Same Component
- #1447 (CLOSED): "Alpha Sandbox Startup Retry Loop Implementation"
- #1472 (CLOSED): "PTY Buffering Issue" - The fix that introduced PTY usage

## Root Cause Analysis

### Identified Root Cause

**Summary**: The error handler in `orchestrator.ts:716-719` marks features as "failed" but doesn't clear `assigned_sandbox`, causing `getNextAvailableFeature()` to skip them.

**Detailed Explanation**:

When `runFeatureImplementation()` throws an error, the work loop catches it at `orchestrator.ts:698-723`:

```typescript
const workPromise = (async () => {
  try {
    await runFeatureImplementation(instance, manifest, feature, uiEnabled);
  } catch (error) {
    // Mark sandbox as ready for next feature
    instance.status = "ready";
    instance.currentFeature = null;
    // Mark feature as failed so it can be retried
    feature.status = "failed";
    feature.error = error instanceof Error ? error.message : String(error);
    saveManifest(manifest);
    // BUG: Does NOT clear feature.assigned_sandbox or feature.assigned_at
  } finally {
    activeWork.delete(instance.label);
  }
})();
```

The feature.ts error handler at line 676-680 DOES clear these fields:
```typescript
feature.status = "failed";
feature.error = finalError;
feature.assigned_sandbox = undefined;  // ✅ Correct
feature.assigned_at = undefined;       // ✅ Correct
```

But errors that propagate to the orchestrator's catch block (like PTY errors or unexpected failures) bypass feature.ts's cleanup.

**Supporting Evidence**:
- Manifest shows Feature #1368 with `status: "failed"` AND `assigned_sandbox: "sbx-c"`
- Log shows "Terminated" (SIGTERM) for Feature #1374 on sbx-b
- Both are exit status 143 (128 + SIGTERM=15)

### How This Causes the Observed Behavior

1. PTY receives SIGTERM → `ptyHandle.wait()` throws/returns with exit code 143
2. Error propagates to orchestrator.ts catch block
3. Feature marked as "failed" but `assigned_sandbox` NOT cleared
4. `getNextAvailableFeature()` skips feature at line 115-116: `if (feature.assigned_sandbox) continue;`
5. Work loop condition: `activeWork.size === 0` but `retryableFeatures.length > 0`
6. Loop continues forever with `continue;` at line 754

### Confidence Level

**Confidence**: High

**Reasoning**:
1. Manifest state directly proves the bug - failed feature with assigned_sandbox set
2. Code analysis clearly shows the missing cleanup in orchestrator.ts vs feature.ts
3. Work loop logic confirmed to stall under this state
4. Pattern matches observed ~34 minute stall timing

## Fix Approach (High-Level)

Add the missing cleanup to `orchestrator.ts:716-719`:

```typescript
feature.status = "failed";
feature.error = error instanceof Error ? error.message : String(error);
feature.assigned_sandbox = undefined;  // ADD: Clear assignment
feature.assigned_at = undefined;       // ADD: Clear assignment timestamp
saveManifest(manifest);
```

Alternative: Modify `getNextAvailableFeature()` to NOT skip failed features with `assigned_sandbox` - but this is less robust.

## UI Recovery Issue (Secondary)

The user also reported that sandbox-c's failure never showed recovery in the UI. This is likely because:
1. The sandbox was stuck in a state where `status: "ready"` but no work was available
2. UI showed the failed state but orchestrator never assigned new work (due to primary bug)
3. Recovery mechanism relies on health checks, but sandbox wasn't "busy" so health checks don't apply

## Diagnosis Determination

Root cause identified with high confidence. The bug is a missing cleanup of `assigned_sandbox` and `assigned_at` fields in the orchestrator's error handler, causing failed features to be permanently skipped from the work queue.

## Additional Context

This bug was likely introduced when the PTY-based execution was added in #1472. The PTY implementation can fail in ways that bypass feature.ts's error handling, directly throwing to the orchestrator's catch block.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash (gh issue)*
