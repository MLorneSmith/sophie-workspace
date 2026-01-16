# Bug Diagnosis: Orchestrator Premature Exit When All Sandboxes Fail Simultaneously

**ID**: ISSUE-pending
**Created**: 2026-01-14T17:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Orchestrator exits prematurely at approximately 6 minutes when all three sandboxes experience startup failures simultaneously. Despite the fix in issue #1465 (increasing `STARTUP_OUTPUT_TIMEOUT_MS` from 3 to 5 minutes), the orchestrator still exits early because of a separate bug in the work loop exit condition. The work loop exits when `activeWork.size === 0` without checking if there are retryable (failed) features that could be re-assigned.

## Environment

- **Application Version**: dev branch (commit ec2f53f3e)
- **Environment**: development
- **Node Version**: v22.x
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Never (this is a separate bug from #1463/#1465)

## Reproduction Steps

1. Start the orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
2. Have OAuth authentication configured (which can cause startup hangs)
3. Wait ~6 minutes
4. All 3 sandboxes exhaust their startup retries (60s × 3 + delays = ~4 min each, staggered by 60s)
5. When the last sandbox completes its retries, `activeWork.size === 0`
6. Work loop exits at the `if (activeWork.size === 0) { break; }` check

## Expected Behavior

When all sandboxes fail their startup retries:
1. Features should be marked as `failed` (this happens correctly)
2. The work loop should continue and re-assign failed features to ready sandboxes
3. The failed features should be retried

## Actual Behavior

When all sandboxes complete (fail) nearly simultaneously:
1. All 3 work promises delete themselves from `activeWork`
2. `activeWork.size === 0` triggers the exit condition at line 702-718
3. The work loop breaks and the orchestrator exits
4. Features remain in `in_progress` or `failed` state without retry

## Diagnostic Data

### Log Analysis

All 3 sandbox logs show the same pattern - 3 retry attempts exhausted:
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

### Timing Analysis

With the current configuration:
- `STARTUP_TIMEOUT_MS` = 60 seconds (feature.ts retry detection)
- `MAX_STARTUP_RETRIES` = 3
- `STARTUP_RETRY_DELAYS_MS` = [5s, 10s, 30s]
- `SANDBOX_STAGGER_DELAY_MS` = 60 seconds

Timeline:
- T+0: sbx-a starts feature
- T+60s: sbx-b starts feature
- T+120s: sbx-c starts feature
- T+~225s: sbx-a exhausts retries (60s×3 + 5s + 10s + 30s = 225s = 3m45s)
- T+~285s: sbx-b exhausts retries
- T+~345s: sbx-c exhausts retries (~5m45s from start)

At ~6 minutes, all sandboxes have failed and `activeWork.size === 0`.

### Manifest State at Exit

```json
{
  "id": 1367,
  "status": "in_progress",
  "assigned_sandbox": "sbx-a"
}
```

Features remain `in_progress` because the orchestrator exits before the feature status is updated to `failed` in the error handler.

## Error Stack Traces

No stack trace - the exit is a normal flow through the `break` statement at line 717.

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/orchestrator.ts:702-718` - Work loop exit condition
  - `.ai/alpha/scripts/lib/feature.ts:319-432` - Startup retry loop
  - `.ai/alpha/scripts/lib/work-queue.ts:59-157` - getNextAvailableFeature()

- **Recent Changes**:
  - Issue #1465 increased `STARTUP_OUTPUT_TIMEOUT_MS` but didn't address this exit condition

- **Suspected Functions**:
  - `runWorkLoop()` in orchestrator.ts lines 347-730

## Related Issues & Context

### Direct Predecessors
- #1463 (CLOSED): "Bug Diagnosis: Alpha Orchestrator Premature Exit Due to Competing Retry Mechanisms" - Similar symptoms but different root cause
- #1465 (CLOSED): "Bug Fix: Alpha Orchestrator Premature Exit Due to Competing Retry Mechanisms" - Fixed the competing timeout issue but not this exit condition bug

### Historical Context
Issue #1463 identified a race condition between feature.ts startup retry (3 min total) and health.ts health check (3 min timeout). Issue #1465 fixed this by increasing the health check timeout to 5 minutes. However, a SEPARATE bug exists in the work loop exit condition that causes premature exit when all sandboxes fail simultaneously.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The work loop exits when `activeWork.size === 0` without checking if there are retryable (failed) features that should be re-assigned to sandboxes.

**Detailed Explanation**:

The work loop in `runWorkLoop()` has this exit condition at lines 702-718:

```typescript
// If no work is active and no features available, we might be stuck
if (activeWork.size === 0) {
    const blockedFeatures = manifest.feature_queue.filter(
        (f) =>
            (f.status === "pending" || f.status === "failed") &&
            f.dependencies.length > 0,  // <-- Only checks features WITH dependencies!
    );

    if (blockedFeatures.length > 0) {
        log("\n⚠️ Features blocked by incomplete dependencies:");
        // ...
    }
    break;  // <-- EXITS regardless of retryable features!
}
```

The problems:
1. The `blockedFeatures` filter only considers features WITH dependencies
2. Features #1367, #1373, #1376 have NO dependencies (they are the first features)
3. The `break` executes unconditionally when `activeWork.size === 0`

**Supporting Evidence**:
- All 3 assigned features have empty dependencies: `"dependencies": []`
- The exit happens at ~6 minutes (when all 3 sandbox retries complete)
- Features remain in `in_progress` state in the manifest (not updated before exit)

### How This Causes the Observed Behavior

1. All 3 sandboxes start features with staggered timing (0s, 60s, 120s)
2. Each sandbox experiences startup hangs (OAuth issues)
3. Each sandbox exhausts 3 retry attempts (~225s per sandbox)
4. When the last sandbox completes retries, all 3 work promises have deleted themselves from `activeWork`
5. Next loop iteration: `activeWork.size === 0` is true
6. The `if (activeWork.size === 0)` block executes
7. `blockedFeatures` is empty (failed features have no dependencies)
8. `break` executes unconditionally
9. Orchestrator exits without retrying failed features

### Confidence Level

**Confidence**: High

**Reasoning**:
- The code path is deterministic and clearly shows the bug
- The timing matches the observed ~6 minute exit
- The exit condition comment says "we might be stuck" but then unconditionally exits
- The `blockedFeatures` filter logic is clearly wrong for features without dependencies

## Fix Approach (High-Level)

The exit condition at lines 702-718 should be modified to:
1. Check if there are ANY retryable features (pending OR failed, regardless of dependencies)
2. Only exit if there are no retryable features AND `activeWork.size === 0`

Proposed fix:
```typescript
// If no work is active, check if there's retryable work
if (activeWork.size === 0) {
    const retryableFeatures = manifest.feature_queue.filter(
        (f) => f.status === "pending" || f.status === "failed"
    );

    if (retryableFeatures.length === 0) {
        // No work to do - exit
        break;
    }

    // There are retryable features but getNextAvailableFeature() returned null
    // This means features are blocked by dependencies
    const blockedFeatures = retryableFeatures.filter(
        (f) => f.dependencies.length > 0
    );

    if (blockedFeatures.length > 0) {
        log("\n⚠️ Features blocked by incomplete dependencies:");
        for (const f of blockedFeatures.slice(0, 5)) {
            log(`   #${f.id}: blocked by ${f.dependencies.map((d) => `#${d}`).join(", ")}`);
        }
    }

    // Continue loop - sandboxes should pick up retryable features
    continue;  // <-- Changed from break to continue!
}
```

## Diagnosis Determination

The root cause has been definitively identified: the work loop exit condition at lines 702-718 in `orchestrator.ts` unconditionally exits when `activeWork.size === 0`, without checking if there are retryable (failed) features without dependencies that should be re-assigned to sandboxes.

This is a SEPARATE bug from the competing retry mechanism issue fixed in #1465. Both bugs can cause premature exit at ~6 minutes, but through different code paths.

## Additional Context

- The bug only manifests when ALL sandboxes fail their startup retries simultaneously
- With working OAuth/API authentication, sandboxes would succeed and the bug wouldn't trigger
- The 60-second stagger delay between sandboxes causes them to complete retries within a ~2 minute window, making simultaneous completion likely
- This bug has likely existed since the work queue pattern was implemented

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Bash (gh issue view), AskUserQuestion*
