# Implementation: Alpha Orchestrator Async Race Condition

## Summary

- Fixed async race condition in orchestrator work loop where `instance.status` remained "ready" after feature assignment
- Added synchronous status update immediately after `assignFeatureToSandbox()` succeeds, BEFORE async Promise starts
- Added defensive comment to `feature.ts` explaining the dual-setting pattern
- Added 9 unit tests for race condition prevention

## Files Changed

```
.ai/alpha/scripts/lib/__tests__/orchestrator-race-prevention.spec.ts | 461 +++++++++++++++++++++
.ai/alpha/scripts/lib/feature.ts                                     |   3 +
.ai/alpha/scripts/lib/orchestrator.ts                                |  11 +
3 files changed, 475 insertions(+)
```

## Commits

```
901f0ed1e fix(tooling): prevent race condition in orchestrator sandbox status
```

## Validation Results

All validation commands passed successfully:
- `pnpm typecheck` - Passed
- `pnpm format` - Passed
- `pnpm --filter @alpha/scripts test` - 163 tests passed (including 9 new race prevention tests)
- `pnpm --filter @alpha/scripts test orchestrator-race-prevention` - 9 tests passed

## Key Changes

### orchestrator.ts (line 696-706)

Added synchronous status update after feature assignment:

```typescript
// RACE CONDITION FIX: Set sandbox status to "busy" SYNCHRONOUSLY before async Promise
// This prevents the work loop from seeing the sandbox as "ready" on the next iteration
// and calling writeIdleProgress() before runFeatureImplementation() sets status.
instance.status = "busy";
instance.currentFeature = feature.id;
instance.featureStartedAt = new Date();
```

### feature.ts (line 165-167)

Added defensive comment explaining the dual-setting pattern:

```typescript
// Defensive: set these here as well in case orchestrator didn't (rare edge case).
// Orchestrator now sets status/currentFeature/featureStartedAt synchronously before
// calling this function, but this defensive code handles unusual error paths.
```

### New Test File

Created `orchestrator-race-prevention.spec.ts` with 9 tests covering:
- Status set before async Promise executes
- writeIdleProgress not called for busy sandboxes
- Work loop iteration sees sandbox as busy after assignment
- Defensive duplication in feature.ts is safe
- Concurrent assignments to multiple sandboxes
- Second loop iteration sees all sandboxes as busy
- activeWork map correctly tracks assignments
- REGRESSION #1489: status set BEFORE async Promise
- REGRESSION #1488: writeIdleProgress overwrite prevented

## Follow-up Items

None required. The fix is complete and all tests pass.

---
*Implementation completed by Claude*
*Related issues: #1488 (diagnosis), #1489 (bug plan)*
