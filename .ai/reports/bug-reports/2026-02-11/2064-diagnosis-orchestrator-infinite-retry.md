# Bug Diagnosis: Alpha orchestrator infinite retry loop prevents completion phase

**ID**: ISSUE-2064
**Created**: 2026-02-11T17:30:00Z
**Reporter**: system/investigation
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha orchestrator enters an infinite retry loop when a feature exceeds `DEFAULT_MAX_RETRIES` (3). After max retries are exhausted, the feature is marked "failed" with `assigned_sandbox` cleared, but neither the work queue nor the main loop excludes permanently-failed features. This causes the feature to be re-assigned, re-fail, and re-cycle indefinitely. Additionally, an orphaned promise race condition after sandbox restarts can cause the completion phase to never execute, even when all features eventually complete.

## Environment

- **Application Version**: dev branch @ 893c5cf1b
- **Environment**: development (E2B sandboxes)
- **Node Version**: v22.x
- **Last Working**: N/A (latent bug since #1858 refactor)

## Reproduction Steps

1. Run Alpha orchestrator with spec S2045 (14 features, 97 tasks)
2. Feature S2045.I4.F4 encounters PTY timeouts on a degraded sandbox
3. Feature fails 3 times, reaching `retry_count = 3` (DEFAULT_MAX_RETRIES)
4. `resetFeatureForRetryOnSandboxDeath()` marks feature as "failed", clears `assigned_sandbox`
5. On next loop iteration, `assignWorkToIdleSandboxes()` picks up the "failed" feature (no retry check)
6. Feature is assigned again → fails → `resetFeatureForRetryOnSandboxDeath()` → already at max retries → marked "failed" again
7. Cycle repeats indefinitely (7+ attempts observed in logs vs 3 max)

## Expected Behavior

After a feature exceeds `DEFAULT_MAX_RETRIES` (3), it should be permanently excluded from the work queue and main loop. The orchestrator should:
1. Not re-assign permanently-failed features
2. Exit the main loop when only permanently-failed features remain
3. Execute the completion phase to finalize progress

## Actual Behavior

- Feature S2045.I4.F4 was attempted 7+ times on the same degraded sandbox despite `DEFAULT_MAX_RETRIES = 3`
- The orchestrator never reached `executeCompletionPhase()` — `completed_at` remains `null`
- All 14 features eventually completed (after sandbox restart), but the orchestrator never terminated properly

## Diagnostic Data

### Console Output

```
sbx-a.log timeline for S2045.I4.F4:
16:46:36 - Attempt 1: 1 heartbeat iteration → "Progress file indicates feature failed"
16:47:45 - Attempt 2: 1 iteration → failed
16:48:57 - Attempt 3: 2 iterations → failed
16:50:40 - Attempt 4: 3 iterations → failed (should have stopped here at retry_count=3)
16:52:57 - Attempt 5: 7 iterations → failed
16:57:29 - Attempt 6: 0 iterations → failed
16:58:05 - Attempt 7: 3 iterations → sandbox restart triggered
17:08:59 - Attempt 8 (NEW sandbox): 20 iterations → SUCCESS
```

### Progress File Evidence

```json
// overall-progress.json — orchestrator never completed
{
  "status": "in_progress",
  "featuresCompleted": 14,
  "featuresTotal": 14,
  "tasksCompleted": 97,
  "tasksTotal": 97,
  "lastCheckpoint": "2026-02-11T17:20:50.031Z"
  // completed_at: null — MISSING, should have been set
}
```

```json
// spec-manifest.json
{
  "progress": {
    "completed_at": null,  // executeCompletionPhase() never called
    "status": "in_progress"
  }
}
```

## Error Stack Traces

```
PTYTimeoutError: Progress file indicates feature failed
  at attemptProgressFileRecovery (pty-wrapper.ts:236-243)
  → re-thrown in feature.ts:583-589
  → caught in work-loop.ts runFeatureWork():637
  → resetFeatureForRetryOnSandboxDeath() called
  → shouldRetryFailedFeature() returns false (retry_count >= 3)
  → feature status set to "failed", assigned_sandbox cleared
  → BUT: work queue picks it up again on next iteration (no retry check)
```

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/work-queue.ts` (line 105) - Missing retry limit check in `getNextAvailableFeature()`
  - `.ai/alpha/scripts/lib/work-loop.ts` (line 522) - Missing retry limit check in `assignWorkToIdleSandboxes()`
  - `.ai/alpha/scripts/lib/work-loop.ts` (lines 452-456) - `mainLoop()` counts permanently-failed features as "workable"
  - `.ai/alpha/scripts/lib/work-loop.ts` (line 213) - `restartFailedSandbox()` orphans old promise in `activeWork`
- **Recent Changes**: 893c5cf1b (race condition fix #2063), feature transition logic from #1858
- **Suspected Functions**:
  - `getNextAvailableFeature()` - No retry limit enforcement
  - `assignWorkToIdleSandboxes()` - No retry limit enforcement
  - `mainLoop()` - Termination condition includes permanently-failed features
  - `restartFailedSandbox()` - Doesn't clean up `activeWork` map

## Related Issues & Context

### Direct Predecessors

- #1858 (CLOSED): "Reset feature for retry on sandbox death" - Introduced the retry logic but didn't guard against exceeding max retries in the work queue
- #2062 (CLOSED): "Stale progress file race condition" - Related timing issue in progress file reading
- #2063 (CLOSED): "Prevent stale progress file race" - Three-layer defense for progress file races

### Related Infrastructure Issues

- #1952 (CLOSED): "GPT agent blocked status creates unrecoverable state" - Similar pattern: unrecoverable state from status mutation
- #1816 (CLOSED): "Extract work loop from orchestrator" - Created the WorkLoop class structure
- #1841 (CLOSED): "Promise age tracker" - Added promise tracking but didn't cover sandbox restart case

### Similar Symptoms

- #2057-2058 (CLOSED): "S2045 deadlock from impossible database tasks" - Same spec, different root cause
- #1777 (CLOSED): "Deadlock detection" - Related loop termination issue

### Historical Context

This is the third manifestation of the "unrecoverable state" pattern in the orchestrator:
1. S1918: GPT "blocked" status (#1952) → 33% completion deadlock
2. S2045 attempt 1: Impossible database tasks (#2057-2058) → 12/14 features blocked
3. S2045 attempt 2: Infinite retry loop (this issue) → orchestrator never terminates

All three share the same root cause family: the work queue and main loop don't properly exclude features that can never be completed.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Three interacting bugs prevent the orchestrator from terminating after all retryable features have been exhausted.

**Detailed Explanation**:

**RC1 (PRIMARY) — No retry limit enforcement in work queue and assignment logic**

`getNextAvailableFeature()` (work-queue.ts:105) and `assignWorkToIdleSandboxes()` (work-loop.ts:522) both check `feature.status === "failed"` to allow retries, but neither checks whether `retry_count >= DEFAULT_MAX_RETRIES`. After max retries, `resetFeatureForRetryOnSandboxDeath()` correctly marks the feature as "failed" and clears `assigned_sandbox` via `transitionFeatureStatus()`. But on the next loop iteration, the work queue picks up the feature again because:
- `status === "failed"` → passes the status check
- `assigned_sandbox === undefined` → passes the assignment check
- No retry_count check exists → infinite loop

The feature enters an infinite cycle: assigned → fails → marked "failed" → cleared → re-assigned.

**RC2 (SECONDARY) — mainLoop termination check includes permanently-failed features**

`mainLoop()` (work-loop.ts:452-456) counts "workable features" as `status === "pending" || "in_progress" || "failed"`. Permanently-failed features (retry_count >= max) are counted as "workable", so the loop never exits even when no retryable work remains.

**RC3 (TERTIARY) — Orphaned promise after sandbox restart**

`restartFailedSandbox()` (work-loop.ts:213-262) creates a new sandbox but doesn't clean up the old promise from `activeWork`. When the old promise's `finally` block executes `activeWork.delete(label)`, it deletes the NEW promise. The new promise becomes untracked, which can cause the main loop's `Promise.race([...activeWork.values()])` to miss it.

**Supporting Evidence**:
- sbx-a.log shows 7+ attempts vs DEFAULT_MAX_RETRIES=3
- overall-progress.json shows `completed_at: null` despite 14/14 features completed
- work-queue.ts:105 — no `shouldRetryFailedFeature()` guard
- work-loop.ts:522 — no `shouldRetryFailedFeature()` guard
- work-loop.ts:452-456 — no retry limit in workable features filter

### How This Causes the Observed Behavior

1. Feature S2045.I4.F4 fails on degraded sandbox → retry 1, 2, 3
2. After retry 3: `retry_count = 3`, `shouldRetryFailedFeature()` returns false
3. Feature marked "failed", `assigned_sandbox` cleared
4. RC1: Work queue picks it up again → assigns → fails → marks "failed" → repeat
5. This continues for 4+ more attempts until sandbox health check triggers restart
6. On new sandbox, feature finally succeeds (attempt 8)
7. All 14 features now completed in manifest
8. RC2: mainLoop still counts the feature as "workable" (even though it's now completed, the loop would have been stuck on RC1 first)
9. RC3: If sandbox restart orphaned a promise, the completion check may also be broken
10. Net result: `executeCompletionPhase()` never called, `completed_at` stays null

### Confidence Level

**Confidence**: High

**Reasoning**: The code paths are unambiguous — `getNextAvailableFeature()` has no retry check (confirmed by reading work-queue.ts:105), `assignWorkToIdleSandboxes()` has no retry check (confirmed at work-loop.ts:522), and the log evidence shows 7+ attempts for a feature with MAX_RETRIES=3. The `completed_at: null` with 14/14 features completed confirms the completion phase was never reached.

## Fix Approach (High-Level)

Four targeted code changes:

1. **work-queue.ts line ~105**: Add `shouldRetryFailedFeature()` guard — skip "failed" features that have exceeded `DEFAULT_MAX_RETRIES`
2. **work-loop.ts line ~522**: Add same `shouldRetryFailedFeature()` guard in `assignWorkToIdleSandboxes()`
3. **work-loop.ts lines ~452-456**: Exclude permanently-failed features from `workableFeatures` filter in `mainLoop()`
4. **work-loop.ts line ~213**: In `restartFailedSandbox()`, delete the old promise from `activeWork` before creating the new sandbox to prevent orphaned promises

## Diagnosis Determination

Root cause is confirmed with high confidence. The infinite retry loop (RC1) is the primary bug, with the mainLoop termination issue (RC2) as its direct consequence and the orphaned promise (RC3) as a contributing factor. All three should be fixed together.

## Additional Context

- The `shouldRetryFailedFeature()` function already exists in work-queue.ts:464-470 and is already imported in work-loop.ts
- The fix only adds guard checks using existing infrastructure — no new abstractions needed
- This is the same class of bug as #1952 (unrecoverable state from missing guard checks)

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash (gh issue list, git log), Task (Explore agent)*
