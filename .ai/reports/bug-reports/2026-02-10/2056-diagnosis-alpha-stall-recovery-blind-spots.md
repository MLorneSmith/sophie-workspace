# Diagnosis: Alpha Orchestrator Stall Recovery Blind Spots

## Summary

During S2045 (user dashboard) spec implementation with GPT provider, the Alpha
orchestrator stalled at ~75% completion (12/14 features, 74/99 tasks) and could
not recover. Three independent bugs in the stall/deadlock detection mechanisms
create blind spots that prevent recovery when a sandbox agent hangs on a feature
that has exhausted its retry budget.

## Observed Behavior

- **sbx-a**: Stuck on S2045.I4.F1 (Widget Empty States) with `retry_count: 3`
  and heartbeat 24+ minutes stale (from previous feature S2045.I3.F4)
- **sbx-b, sbx-c**: Idle, waiting for S2045.I4.F4 (Responsive & Accessibility
  Polish) which depends on S2045.I4.F1, F2, F3
- **Dashboard**: Heartbeat age climbing with no recovery action taken
- **Outcome**: Infinite idle loop - no deadlock detected, no exit triggered

## Root Cause Analysis

### Bug 1: `checkForStall()` returns false for null progress (progress.ts:435)

When a new feature session starts on a sandbox, the progress polling filters out
stale data from the previous session (heartbeat before session start - 5min),
setting `lastProgress` to null. `checkForStall(null, ...)` immediately returns
`{stalled: false}`, meaning the feature-level stall detection inside `feature.ts`
never fires.

```typescript
// progress.ts:431-437 — BUG
export function checkForStall(
  progress: SandboxProgress | null,
  sessionStartTime: Date = new Date(),
): StallCheckResult {
  if (!progress) {
    return { stalled: false };  // <-- Should check elapsed time instead
  }
```

**Impact**: The 60-second stall check interval inside `feature.ts` (lines
302-317) is completely ineffective when progress data hasn't been established
for the current session. The feature can hang indefinitely at this layer.

### Bug 2: `checkSandboxHealth()` false positive on pre-session heartbeat (health.ts:131)

When the health checker reads a heartbeat from a previous feature session, it
logs "Ignoring stale heartbeat" and returns `{healthy: true}`. This is incorrect
— the sandbox should be flagged as unhealthy if no heartbeat from the CURRENT
session exists and sufficient time has elapsed since the feature started.

```typescript
// health.ts:131-138 — BUG
if (heartbeatTime < featureStartTime - graceWindow) {
  // Heartbeat is from a previous session - don't flag as stale
  log(`ℹ️ [${instance.label}] Ignoring stale heartbeat...`);
  return { healthy: true, timeSinceStart };  // <-- Should check session age
}
```

**Impact**: Health checks pass indefinitely when the only heartbeat is from a
previous session, preventing the kill-and-restart recovery path.

### Bug 3: `getBlockingFailedFeatures()` misses feature-level deps (work-queue.ts:424-440)

The deadlock detector only checks initiative-level dependencies:
`initiativesWithFailures.has(depId)`. When a feature has a direct feature-level
dependency (e.g., S2045.I4.F4 depends on "S2045.I4.F1"), this comparison fails
because the set contains initiative IDs like "S2045.I4", not feature IDs like
"S2045.I4.F1".

```typescript
// work-queue.ts:431-438 — BUG
return f.dependencies.some((depId) => {
  if (completedFeatureIds.has(depId) || completedInitiativeIds.has(depId)) {
    return false;
  }
  return initiativesWithFailures.has(depId);  // <-- Misses feature-level deps
});
```

**Impact**: When a failed feature blocks another feature via a feature-level
dependency, the deadlock handler cannot detect this. The work loop enters an
infinite idle state: pending features exist (so no exit), but none can be
assigned (deps unsatisfied), and no deadlock is detected.

## Failure Chain

The three bugs combine to create an unrecoverable stall:

```
1. GPT agent hangs on S2045.I4.F1 (retry_count=3, 4th attempt)
   │
2. Progress file shows stale data from previous feature session
   │
3. checkForStall(null) returns false          ← Bug 1
   │  (feature-level stall detection blind)
   │
4. checkSandboxHealth() returns healthy       ← Bug 2
   │  (health check ignores pre-session heartbeat)
   │
5. monitorPromiseAges() fires after ~10 min
   │  (promise timeout IS working correctly)
   │
6. retry_count=3 ≥ maxRetries=3 → feature marked "failed"
   │  (correct behavior)
   │
7. Sandbox freed, activeWork empty → handleIdleState() runs
   │
8. getBlockingFailedFeatures() returns []     ← Bug 3
   │  (feature-level dep "S2045.I4.F1" invisible)
   │
9. S2045.I4.F4 is pending → retryableFeatures.length > 0
   │  (so handleIdleState doesn't exit)
   │
10. Infinite idle loop: no work assignable, no deadlock detected, no exit
```

## Files Affected

| File | Line(s) | Bug |
|------|---------|-----|
| `.ai/alpha/scripts/lib/progress.ts` | 431-437 | Null progress returns not-stalled |
| `.ai/alpha/scripts/lib/health.ts` | 131-138 | Pre-session heartbeat returns healthy |
| `.ai/alpha/scripts/lib/work-queue.ts` | 424-440 | Missing feature-level dep check |

## Proposed Fixes

### Fix 1: `checkForStall()` — Time-based stall for null progress

When progress is null, check elapsed time since session start. If more than
`STALL_TIMEOUT_MS` has passed with no progress data, report stalled.

### Fix 2: `checkSandboxHealth()` — Session age check for stale heartbeats

When heartbeat is from a previous session, check if `timeSinceStart` exceeds
`HEARTBEAT_STALE_TIMEOUT_MS`. If yes, report unhealthy with a
"no_current_session_heartbeat" issue type.

### Fix 3: `getBlockingFailedFeatures()` — Add failed feature ID check

Build a set of failed feature IDs and check `failedFeatureIds.has(depId)` in
addition to the existing `initiativesWithFailures.has(depId)` check.

## Severity

**Critical** — These bugs cause complete orchestration stalls that waste sandbox
compute time (E2B billing) and prevent spec completion. The stall persists
indefinitely with no automatic recovery or clean exit.

## Related Issues

- #1955: Centralize feature status transitions (recent refactor)
- #1956, #1957, #1959, #1961, #1962: Related refactoring
- #1952: "blocked" status from GPT agent (fixed by transition remapping)
- #1841: Promise age tracking (partially addresses this but has gaps)
- #1948: Orphaned feature detection (gate condition prevents triggering)
