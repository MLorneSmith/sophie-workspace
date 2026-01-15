# Bug Fix: Alpha Orchestrator Stall Due to Failed Feature with Assigned Sandbox

**Related Diagnosis**: #1486 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Error handler in `orchestrator.ts:716-719` doesn't clear `assigned_sandbox` when marking features as failed
- **Fix Approach**: Add two lines to clear `assigned_sandbox` and `assigned_at` in the orchestrator's error handler
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Orchestrator stalls indefinitely when features fail with errors that bypass feature.ts's error handler (like PTY SIGTERM). Failed features retain their `assigned_sandbox` field, causing `getNextAvailableFeature()` to skip them permanently, leading to infinite stall where sandboxes are idle but no work is available.

For full details, see diagnosis issue #1486.

### Solution Approaches Considered

#### Option 1: Add cleanup to orchestrator.ts error handler ⭐ RECOMMENDED

**Description**: Add `feature.assigned_sandbox = undefined;` and `feature.assigned_at = undefined;` to the catch block at `orchestrator.ts:716-719`, mirroring the cleanup that feature.ts already does.

**Pros**:
- Surgical fix - only 2 lines added
- Mirrors existing pattern in feature.ts:678-679
- Zero risk of breaking existing functionality
- Immediately resolves the stall issue
- Maintains consistency across error paths

**Cons**:
- Code duplication between orchestrator.ts and feature.ts error handlers
- Doesn't address root cause of having two error paths

**Risk Assessment**: low - This is defensive programming that makes the error handler more robust. Even if feature.ts already cleared these fields, setting them to undefined again is harmless.

**Complexity**: simple - Two-line addition to existing error handler

#### Option 2: Refactor to use single error handler

**Description**: Move all error handling into feature.ts, make orchestrator.ts catch block only log and update activeWork, letting feature.ts handle all state cleanup.

**Pros**:
- Single source of truth for error handling
- Eliminates code duplication
- More maintainable long-term architecture

**Cons**:
- Larger refactoring effort
- Higher risk of introducing new bugs
- Requires careful testing of all error paths
- May need to restructure Promise handling

**Why Not Chosen**: Over-engineering for a simple bug fix. The current architecture of having dual error handlers (orchestrator for work loop failures, feature.ts for implementation failures) is intentional and works well. Option 1 simply makes both handlers complete.

#### Option 3: Fix work-queue.ts to handle failed features with assigned_sandbox

**Description**: Modify `getNextAvailableFeature()` to NOT skip failed features that have `assigned_sandbox` set, or add special handling to clear stale assignments.

**Pros**:
- Fixes the symptom at the queue level
- Could add additional robustness checks

**Cons**:
- Doesn't fix the root cause (incomplete error handler)
- Less intuitive - why should work-queue fix orchestrator's state?
- Could mask other similar bugs
- More complex logic in work-queue

**Why Not Chosen**: Treating the symptom instead of the disease. The bug is that the error handler is incomplete - we should fix the error handler, not work around it elsewhere.

### Selected Solution: Add cleanup to orchestrator.ts error handler

**Justification**: Option 1 is the correct fix because it addresses the root cause (incomplete error handler) with minimal code change and zero risk. The orchestrator's error handler should clean up the same state that feature.ts's error handler cleans up. This maintains the principle that each error path should leave the system in a clean, consistent state.

**Technical Approach**:
- Add two lines after line 718 in orchestrator.ts
- Copy the exact pattern from feature.ts:678-679
- Maintain code comment explaining why this cleanup is necessary
- No changes to logic flow or control structures

**Architecture Changes**: None - this maintains the existing dual error handler architecture while ensuring both paths perform complete cleanup.

**Migration Strategy**: Not applicable - this is a bug fix with no data migration needs.

## Implementation Plan

### Affected Files

List files that need modification:
- `.ai/alpha/scripts/lib/orchestrator.ts:716-719` - Add two lines to clear `assigned_sandbox` and `assigned_at` after marking feature as failed

### New Files

**No new files required**

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add cleanup to orchestrator error handler

Add the missing cleanup lines to the catch block in orchestrator.ts.

- Read the current orchestrator.ts file to understand context
- Locate the catch block at lines 706-722
- After line 718 (`feature.error = error instanceof Error ? error.message : String(error);`), add:
  ```typescript
  feature.assigned_sandbox = undefined;
  feature.assigned_at = undefined;
  ```
- Add inline comment explaining why this cleanup is necessary (prevents stall when features fail with errors that bypass feature.ts handler)
- Verify the code matches the pattern in feature.ts:678-679

**Why this step first**: This is the complete fix - there's only one step needed.

#### Step 2: Add unit test for error handler cleanup

Add test to verify the orchestrator error handler properly cleans up feature state.

- Create or update test file: `.ai/alpha/scripts/lib/__tests__/orchestrator-error-handler.spec.ts`
- Test scenario: When `runFeatureImplementation()` throws an error, verify:
  - `feature.status === "failed"`
  - `feature.error` is set
  - `feature.assigned_sandbox === undefined`
  - `feature.assigned_at === undefined`
  - `instance.status === "ready"`
  - `instance.currentFeature === null`
- Mock `runFeatureImplementation` to throw an error
- Assert all cleanup is performed

#### Step 3: Add integration test for stall prevention

Add test to verify that failed features can be retried and don't cause stalls.

- Create test in `.ai/alpha/scripts/lib/__tests__/orchestrator-stall-prevention.spec.ts`
- Test scenario: Feature fails, gets marked as failed, then getNextAvailableFeature() should return it for retry
- Mock a feature failure cycle:
  1. Feature assigned to sandbox
  2. Implementation throws error
  3. Error handler marks feature as failed
  4. Verify feature is available for retry (not skipped)
- Assert orchestrator doesn't stall when all features fail once

#### Step 4: Manual validation

Test the fix with the actual orchestrator.

- Run orchestrator with `pnpm alpha:orchestrate 1362 --ui`
- Simulate or wait for a feature failure
- Verify failed feature has `assigned_sandbox: undefined` in manifest
- Verify orchestrator continues to retry the feature instead of stalling
- Check that UI correctly shows sandbox recovery

#### Step 5: Code review and verification

Ensure the fix is complete and correct.

- Run `pnpm typecheck` - should pass
- Run `pnpm lint` - should pass
- Run `pnpm format` - should pass
- Review the diff to ensure only the intended changes are present
- Verify the fix matches the pattern in feature.ts

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Orchestrator error handler clears `assigned_sandbox` when feature fails
- ✅ Orchestrator error handler clears `assigned_at` when feature fails
- ✅ Orchestrator error handler sets `feature.status = "failed"`
- ✅ Orchestrator error handler sets `feature.error` with error message
- ✅ Orchestrator error handler marks sandbox as ready (`instance.status = "ready"`)
- ✅ Edge case: Error with undefined message - should not crash
- ✅ Edge case: Error thrown after feature already failed - should be idempotent
- ✅ Regression test: Failed features must not cause stall

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/orchestrator-error-handler.spec.ts` - Error handler cleanup tests
- `.ai/alpha/scripts/lib/__tests__/orchestrator-stall-prevention.spec.ts` - Stall prevention integration test

### Integration Tests

Integration test to verify work loop behavior with failed features:

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/work-queue-failed-features.spec.ts` - Verify `getNextAvailableFeature()` returns failed features without `assigned_sandbox`

### E2E Tests

Not applicable - this is orchestrator internal logic, not user-facing functionality.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run orchestrator with real spec: `pnpm alpha:orchestrate 1362 --ui`
- [ ] Wait for or simulate a feature failure (PTY timeout, SIGTERM, etc.)
- [ ] Verify failed feature in manifest has `assigned_sandbox: undefined`
- [ ] Verify failed feature in manifest has `assigned_at: undefined`
- [ ] Verify orchestrator continues to work (doesn't stall)
- [ ] Verify UI shows sandbox recovering and picking up next work
- [ ] Verify failed feature can be retried on next run
- [ ] Check orchestrator logs show proper error handling
- [ ] Verify no infinite loops or hangs

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Code duplication between error handlers could diverge over time**
   - **Likelihood**: medium
   - **Impact**: low
   - **Mitigation**: Add comment in both locations referencing each other. Consider future refactoring to consolidate error handlers.

2. **Edge case where feature.assigned_sandbox is needed for debugging**
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: The error field already captures the failure reason. If debugging needs more info, check git history or logs. Keeping stale assigned_sandbox causes actual bugs (stalls).

**Rollback Plan**:

If this fix causes issues:
1. Revert the two-line addition in orchestrator.ts
2. Deploy immediately - no migration needed
3. Re-open issue #1486 for further investigation

**Monitoring**:
- Monitor orchestrator runs for successful completion vs stalls
- Watch for failed features being retried properly
- Alert on orchestrator runs that exceed expected duration (>2 hours for typical specs)

## Performance Impact

**Expected Impact**: none

The fix adds two assignment operations (`undefined` assignments) which are negligible. No computational overhead, no I/O overhead.

**Performance Testing**: Not required - the change is two variable assignments.

## Security Considerations

**Security Impact**: none

This is an internal orchestrator state management bug with no security implications. No user input, no external APIs, no authentication/authorization changes.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run orchestrator on spec 1362 and observe stall behavior
# (This would require waiting ~34 minutes for stall to occur)
pnpm alpha:orchestrate 1362 --ui

# Check manifest for failed feature with assigned_sandbox set
cat .ai/alpha/specs/1362-Spec-user-dashboard-home/spec-manifest.json | jq '.feature_queue[] | select(.status == "failed")'
```

**Expected Result**: Failed features have `assigned_sandbox` field set, orchestrator stalls.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format check
pnpm format

# Run orchestrator unit tests
pnpm --filter @alpha/scripts test:unit orchestrator

# Build orchestrator
cd .ai/alpha/scripts && pnpm build

# Manual verification - run orchestrator
pnpm alpha:orchestrate 1362 --ui

# After a feature fails, check manifest
cat .ai/alpha/specs/1362-Spec-user-dashboard-home/spec-manifest.json | jq '.feature_queue[] | select(.status == "failed")'
```

**Expected Result**:
- All validation commands succeed
- Failed features have `assigned_sandbox: undefined` and `assigned_at: undefined`
- Orchestrator continues to work and doesn't stall
- Failed features can be retried

### Regression Prevention

```bash
# Run full orchestrator test suite
pnpm --filter @alpha/scripts test

# Verify orchestrator can complete a full spec run without stalling
pnpm alpha:orchestrate <test-spec-id> --ui

# Check for no infinite loops in orchestrator logs
grep -i "stall\|infinite\|hung" .ai/alpha/logs/run-*/sbx-*.log
```

## Dependencies

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

This is a development tooling fix that only affects the Alpha Orchestrator. No production impact.

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: maintained - this is a bug fix that makes the orchestrator more robust. No API changes, no breaking changes.

## Success Criteria

The fix is complete when:
- [ ] Code change applied to orchestrator.ts (2 lines added)
- [ ] Inline comment added explaining the cleanup
- [ ] Unit tests added and passing
- [ ] Integration test added and passing
- [ ] All validation commands pass (typecheck, lint, format, build)
- [ ] Manual testing shows failed features have no `assigned_sandbox`
- [ ] Manual testing shows orchestrator doesn't stall after feature failures
- [ ] Code review approved (if applicable)
- [ ] Orchestrator can successfully retry failed features

## Notes

### Code Pattern to Follow

The fix should mirror feature.ts:676-680:

```typescript
// feature.ts error handler (correct)
feature.status = "failed";
feature.error = finalError;
feature.assigned_sandbox = undefined;  // ✅
feature.assigned_at = undefined;       // ✅
```

Apply the same pattern to orchestrator.ts:716-719:

```typescript
// orchestrator.ts error handler (to be fixed)
feature.status = "failed";
feature.error = error instanceof Error ? error.message : String(error);
feature.assigned_sandbox = undefined;  // ADD
feature.assigned_at = undefined;       // ADD
saveManifest(manifest);
```

### Why Two Error Handlers?

The dual error handler architecture exists because:
1. **feature.ts** handles errors during feature implementation (Claude Code failures, validation errors, etc.)
2. **orchestrator.ts** handles work loop failures (Promise rejections, timeouts, orchestration errors)

Both paths need complete cleanup. This fix ensures both paths are consistent.

### Future Refactoring Consideration

While this fix is correct, a future improvement could be to extract the cleanup logic into a shared function:

```typescript
function markFeatureFailed(feature: FeatureEntry, error: unknown) {
  feature.status = "failed";
  feature.error = error instanceof Error ? error.message : String(error);
  feature.assigned_sandbox = undefined;
  feature.assigned_at = undefined;
}
```

This is NOT part of this fix (to minimize risk), but could be considered in a separate refactoring ticket.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1486*
