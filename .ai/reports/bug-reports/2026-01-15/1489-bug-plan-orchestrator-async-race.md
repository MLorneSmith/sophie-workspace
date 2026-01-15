# Bug Fix: Alpha Orchestrator Async Race Condition

**Related Diagnosis**: #1488 (REQUIRED)
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `instance.status` is set to `"busy"` inside an async Promise instead of synchronously before the Promise starts, creating a race window where `writeIdleProgress()` overwrites correct progress
- **Fix Approach**: Set `instance.status = "busy"` and `instance.currentFeature = feature.id` synchronously immediately after `assignFeatureToSandbox()` succeeds, before starting the async Promise
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Orchestrator exhibits a race condition where `instance.status` remains "ready" for a window of time after a feature is assigned. During this window, the work loop can iterate again, see the sandbox as "ready", call `writeIdleProgress()` for an idle-appearing sandbox, and OVERWRITE the correct progress with "idle" status. This causes the UI to show all sandboxes as blocked/waiting when they should be executing.

For full details, see diagnosis issue #1488.

### Solution Approaches Considered

#### Option 1: Set Status Synchronously Before Promise ⭐ RECOMMENDED

**Description**: Set `instance.status = "busy"` and `instance.currentFeature = feature.id` synchronously in the orchestrator's work loop immediately after `assignFeatureToSandbox()` succeeds, but BEFORE creating and starting the async Promise. This eliminates the race window completely.

**Pros**:
- **Surgical fix** - only 4 lines added in orchestrator.ts
- **Zero complexity** - simple assignment operations
- **Eliminates race window entirely** - status is set before any async code runs
- **No changes needed to feature.ts** - keeps changes minimal
- **Low risk** - defensive pattern that's already used elsewhere in codebase
- **Clear intent** - code clearly shows status synchronously set before work starts
- **Performance impact: none** - just a few variable assignments

**Cons**:
- **Code duplication** - similar code exists in feature.ts:166-169
- **Doesn't consolidate state management** - two places update instance.status
- **Could be forgotten in future** - if another place spawns work, same bug could recur

**Risk Assessment**: low
- The fix is identical to existing patterns in orchestrator.ts (health check restart code)
- Setting instance.status is idempotent (safe to set even if already set)
- No logic changes, no behavior changes to existing code paths
- If feature.ts also sets status to "busy", that's harmless redundancy (last write wins)

**Complexity**: simple - straightforward variable assignment, no conditional logic

#### Option 2: Refactor to Single State Update Function

**Description**: Create a shared function `markSandboxBusy()` that both orchestrator.ts and feature.ts call to ensure consistent state management. Move all instance state updates (status, currentFeature, featureStartedAt, etc.) into this function.

**Pros**:
- **Single source of truth** - one place manages sandbox state transitions
- **Reduces code duplication** - shared function prevents divergence
- **Future-proofs** - if another place needs to mark sandbox as busy, it uses the function
- **Better maintainability** - state transition logic is centralized

**Cons**:
- **Larger refactoring** - requires extracting function, updating two call sites
- **More files modified** - changes in orchestrator.ts, feature.ts, and new utility file
- **Higher complexity** - introduces abstraction layer
- **Risk of breaking existing behavior** - refactoring could affect timing or logic
- **Over-engineering** - solution is more complex than the problem
- **Effort**: moderate - ~2-3 hours vs ~15 min for direct fix
- **Testing burden** - need tests for new shared function

**Why Not Chosen**: This is over-engineering for a simple race condition. The race condition is caused by async timing, not architectural issues. Option 1 directly addresses the root cause with minimal risk. The refactoring could introduce new bugs and requires significantly more effort. We can always refactor later if this pattern becomes more prevalent.

#### Option 3: Add Mutex/Lock to Prevent Concurrent Work Assignment

**Description**: Implement a simple mutex/lock system where `assignFeatureToSandbox()` acquires a lock that prevents the work loop from iterating until the async Promise has actually started executing (confirmed by some marker in the Promise).

**Pros**:
- **Bulletproof** - completely prevents the race condition even with future timing changes
- **Defensive** - handles unexpected timing issues
- **Educates code reviewers** - explicit synchronization intent

**Cons**:
- **Over-complicated** - adding synchronization for a simple timing issue
- **Performance impact** - locks add overhead and can cause unnecessary delays
- **Harder to debug** - synchronization bugs are notoriously difficult
- **Overkill** - the root cause is simple (missing status update)
- **Potential for deadlocks** - introducing new failure modes
- **Not idiomatic for Node.js** - unnecessary given JavaScript's async/await model

**Why Not Chosen**: This violates the "simplest solution" principle. The race condition is caused by a missing synchronous status update, not a fundamental architectural concurrency issue. Adding locking introduces unnecessary complexity and potential new bugs.

### Selected Solution: Set Status Synchronously Before Promise

**Justification**: Option 1 is the correct fix because it:
1. **Directly addresses the root cause** - the missing synchronous status update before async work starts
2. **Minimal code change** - 4 lines in one place, zero risk
3. **Matches existing patterns** - same pattern used in health check restart code
4. **No new dependencies** - doesn't introduce new libraries or abstractions
5. **Preserves existing code** - feature.ts can still set status defensively (harmless redundancy)
6. **Fast to implement and review** - small, focused change
7. **Easy to test** - can verify status is set before Promise executes

This follows the principle of simplicity: fix the actual problem (missing status update) rather than adding complex synchronization mechanisms.

**Technical Approach**:
- Add synchronous status assignment after `assignFeatureToSandbox()` succeeds
- Set `instance.status = "busy"` to indicate sandbox is working
- Set `instance.currentFeature = feature.id` to track which feature is running
- Set `instance.featureStartedAt = new Date()` to track start time for health checks
- Keep the existing code in feature.ts (it will redundantly set status again, which is fine)
- Add comment explaining why status is set here AND in feature.ts

**Architecture Changes**: None - this is a fix to existing code flow, not an architectural change.

**Migration Strategy**: Not applicable - this is a bug fix with no data migration needs.

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/orchestrator.ts:681-729` - Work loop assignment code
  - Add synchronous status update after `assignFeatureToSandbox()` succeeds
  - Add comment explaining the race condition prevention
  - No other changes to orchestrator.ts

### New Files

**No new files required**

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add synchronous status update in orchestrator.ts

Set sandbox status to "busy" synchronously after feature assignment succeeds, before async Promise starts.

- Read `.ai/alpha/scripts/lib/orchestrator.ts` around lines 681-729
- Locate the code after `assignFeatureToSandbox()` call
- After line 693 (`if (!assigned) { continue; }`), add:
  ```typescript
  // Mark sandbox as busy SYNCHRONOUSLY before async Promise
  // This prevents race condition where work loop sees sandbox as "ready"
  // and calls writeIdleProgress() before runFeatureImplementation() sets status
  instance.status = "busy";
  instance.currentFeature = feature.id;
  instance.featureStartedAt = new Date();
  ```
- Add inline comment explaining why this is here AND in feature.ts:
  ```typescript
  // NOTE: feature.ts:166-169 will redundantly set these again when it runs.
  // That's intentional - this synchronous set prevents the race condition
  // by ensuring status is "busy" before async code executes. The feature.ts
  // code provides defensive duplication in case of unusual error paths.
  ```

**Why this step first**: This is the core fix. Everything else validates it works correctly.

#### Step 2: Update runFeatureImplementation to be defensive

Ensure feature.ts doesn't overwrite status if it's already "busy" (defensive programming).

- Read `.ai/alpha/scripts/lib/feature.ts` around lines 166-173
- The code currently sets status unconditionally: `instance.status = "busy";`
- Add a comment above it:
  ```typescript
  // Defensive: set status here as well in case orchestrator didn't (rare edge case)
  // Orchestrator now sets this synchronously, but this defensive code handles unusual paths
  ```
- No functional changes needed - the existing code is fine

**Why this step**: Ensures feature.ts code remains defensive and documents the dual-setting pattern.

#### Step 3: Add unit tests for race condition prevention

Create a test that verifies the fix prevents the race condition.

- Create test file: `.ai/alpha/scripts/lib/__tests__/orchestrator-race-prevention.spec.ts`
- Test scenario: "Sandbox status should be set to 'busy' before async Promise executes"
  - Setup: Create mock instances and manifest
  - Mock `assignFeatureToSandbox()` to return `true`
  - Mock `runFeatureImplementation()` with delay
  - Call work loop code with short delay before checking
  - Assert: `instance.status === "busy"` before Promise executes
  - Assert: `instance.currentFeature === feature.id`
  - Assert: `instance.featureStartedAt` is set to recent Date

- Add regression test: "Idle progress should NOT be written for busy sandboxes"
  - Scenario: After feature is assigned, loop should NOT call `writeIdleProgress()`
  - Setup: Assign feature with the new code
  - Call `getNextAvailableFeature()` which returns null (all features in_progress)
  - Assert: `writeIdleProgress()` is NOT called (mock should verify no calls)

#### Step 4: Add integration test for full work loop

Test the complete work loop with the fix applied.

- Create test file: `.ai/alpha/scripts/lib/__tests__/orchestrator-work-loop-race.spec.ts`
- Test scenario: "Work loop should correctly handle rapid feature assignments"
  - Setup: Create 3 sandboxes, 5 available features
  - Run one iteration of the work loop
  - Assert: All 3 sandboxes are assigned work with `status === "busy"`
  - Assert: `getNextAvailableFeature()` returns `null` (all assigned)
  - Assert: `writeIdleProgress()` is NOT called for any sandbox
  - Verify: activeWork has 3 promises

#### Step 5: Manual verification

Test the fix with the actual orchestrator.

- Run orchestrator with spec #1362: `pnpm alpha:orchestrate 1362 --ui --minimal-ui`
- Observe sandboxes get assigned features
- Check UI: Sandboxes should show "executing" or feature progress, NOT "idle"/"blocked"
- Check manifest: Features should show `status: "in_progress"`
- Check progress files: Should show actual progress, not "idle" status
- Wait for health check interval: Progress should continue, not revert to idle
- Verify: UI correctly tracks sandbox execution throughout

**Success criteria for manual verification**:
- ✅ Sandboxes show executing status, not idle
- ✅ Progress files show feature progress, not idle status
- ✅ UI updates as features progress
- ✅ No "blocked by" messages for unrelated features
- ✅ Work continues through health check intervals

#### Step 6: Code review and validation

Ensure all changes are correct and tests pass.

- Run `pnpm typecheck` - should pass with no errors
- Run `pnpm lint` - should pass with no errors
- Run `pnpm --filter @alpha/scripts test` - all tests should pass
- Run full lint/typecheck suite: `pnpm typecheck && pnpm lint`
- Review diff to ensure only intended changes are present
- Verify inline comments clearly explain the dual-setting pattern

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Status is set to "busy" before Promise starts
- ✅ currentFeature is set before Promise starts
- ✅ featureStartedAt is set before Promise starts
- ✅ writeIdleProgress() is NOT called when sandbox is busy
- ✅ getNextAvailableFeature() returns null when all features assigned
- ✅ activeWork map correctly tracks all assignments
- ✅ Race condition cannot occur (status already busy when loop iterates)
- ✅ feature.ts redundant status set is harmless

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/orchestrator-race-prevention.spec.ts` - Core race prevention tests
- `.ai/alpha/scripts/lib/__tests__/orchestrator-work-loop-race.spec.ts` - Work loop integration test

### Integration Tests

Integration test to verify orchestrator work loop behavior with the fix:

**Test file**:
- `.ai/alpha/scripts/lib/__tests__/orchestrator-work-loop-race.spec.ts` - Full work loop with concurrent assignments

### E2E Tests

Not applicable - this is an internal orchestrator mechanism, not user-facing functionality.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run orchestrator with spec #1362 and confirm features execute without UI showing idle
- [ ] Verify progress files show actual feature progress, not idle status
- [ ] Wait for health check interval and confirm UI doesn't revert to idle
- [ ] Check that all 3 sandboxes work concurrently without race conditions
- [ ] Verify no unexpected errors in orchestrator logs
- [ ] Test with different feature dependencies to ensure no side effects
- [ ] Confirm orchestrator completes features correctly with the fix applied
- [ ] Run full orchestrator suite (if available) to ensure no regressions

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Race condition could still occur in undiscovered edge case**
   - **Likelihood**: low
   - **Impact**: medium (orchestrator would stall again)
   - **Mitigation**: Comprehensive unit and integration tests verify status is set before Promise executes. Manual testing with spec #1362 confirms fix works. The synchronous assignment is bulletproof against timing variations.

2. **Feature.ts code might have side effects if status is already set**
   - **Likelihood**: low
   - **Impact**: low (setting to same value is harmless)
   - **Mitigation**: This is intentional defensive duplication. Setting `status = "busy"` twice is safe. Comments explain why both locations set it.

3. **Other code might depend on status NOT being set until feature.ts**
   - **Likelihood**: very low
   - **Impact**: medium (could cause unexpected behavior)
   - **Mitigation**: Search codebase for all uses of `instance.status`. Verify no code depends on status being "ready" while work is active. The orchestrator work loop already checks `instance.status !== "ready"`, so this is safe.

**Rollback Plan**:

If this fix causes issues:
1. Remove the 4 lines added to orchestrator.ts (lines ~696-699)
2. Remove the explanatory comment
3. Deploy immediately - no migration needed
4. Reopen issue #1488 for further investigation

**Monitoring** (if this pattern recurs):

- Monitor orchestrator runs for sandbox status changes
- Watch progress files for unexpected "idle" overwrites
- Alert if sandboxes remain "waiting" while features are in_progress
- Track if work loop ever calls `writeIdleProgress()` when `activeWork.size > 0`

## Performance Impact

**Expected Impact**: none

The fix adds only 3 simple variable assignments before starting async work. Zero computational overhead, zero I/O overhead, zero network overhead.

**Performance Testing**: Not required - the change is 3 variable assignments with measurable microsecond-level impact (negligible).

## Security Considerations

**Security Impact**: none

This is an internal orchestrator state management bug with no security implications. No user input, no external APIs, no authentication/authorization changes.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run orchestrator on spec 1362 and observe stall behavior
pnpm alpha:orchestrate 1362 --ui --minimal-ui

# While running, check progress files
cat .ai/alpha/progress/sbx-a-progress.json | jq '.'

# Expected: Progress files show "idle" and "blocked" status even though
# manifest shows features as "in_progress" with assigned_sandbox set
```

**Expected Result**: All 3 sandboxes show idle/blocked in progress files, but manifest shows work assigned.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format check
pnpm format

# Run orchestrator unit tests
pnpm --filter @alpha/scripts test orchestrator-race-prevention

# Run orchestrator work loop tests
pnpm --filter @alpha/scripts test orchestrator-work-loop-race

# Build orchestrator
cd .ai/alpha/scripts && pnpm build

# Manual verification - run orchestrator
pnpm alpha:orchestrate 1362 --ui --minimal-ui

# While running, check progress files
cat .ai/alpha/progress/sbx-a-progress.json | jq '.'

# Expected: Progress files show actual feature progress, not idle status
# Expected: UI shows executing features, not waiting/blocked
```

**Expected Result**:
- All validation commands succeed
- Bug is resolved (sandboxes show executing, not idle)
- Progress files show correct feature progress
- UI correctly tracks sandbox work
- No regressions in other orchestrator functionality

### Regression Prevention

```bash
# Run full orchestrator test suite
pnpm --filter @alpha/scripts test

# Run full typecheck/lint
pnpm typecheck && pnpm lint

# Verify no infinite loops or hangs
pnpm alpha:orchestrate 1362 --ui --minimal-ui

# Monitor orchestrator logs for unexpected issues
tail -f .ai/alpha/logs/*/sbx-*.log
```

## Dependencies

**No new dependencies required**

The fix uses only existing TypeScript features and the existing instance object properties.

## Database Changes

**No database changes required**

This is purely an orchestrator state management fix affecting only the runtime instance state.

## Deployment Considerations

**Deployment Risk**: low

This is a development tooling fix that only affects the Alpha Orchestrator. No production impact, no customer-facing changes.

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: maintained - this is a bug fix that makes the orchestrator more robust. No API changes, no breaking changes.

## Success Criteria

The fix is complete when:
- [ ] Code change applied to orchestrator.ts (4 lines added)
- [ ] Inline comments explain the dual-setting pattern
- [ ] Unit tests added and passing (race prevention tests)
- [ ] Integration tests added and passing (work loop tests)
- [ ] Manual testing shows sandboxes execute, don't show idle
- [ ] All validation commands pass (typecheck, lint, format, build)
- [ ] Progress files show correct feature progress
- [ ] UI correctly displays executing features, not blocked
- [ ] No regressions detected in other orchestrator features
- [ ] Code review approved (if applicable)

## Notes

### Implementation Sequence

1. **First**: Add the 4-line synchronous status update to orchestrator.ts
2. **Second**: Run manual test with spec #1362 to verify the fix works
3. **Third**: Add unit tests to prevent regression
4. **Fourth**: Run full test suite
5. **Fifth**: Code review

This sequence ensures the fix works before investing in test infrastructure.

### Why Both orchestrator.ts AND feature.ts?

The dual-setting of status might seem redundant, but it's intentional defensive programming:

- **orchestrator.ts**: Sets status synchronously before async work starts - prevents race condition
- **feature.ts**: Sets status again when work actually starts - defensive in case of unusual error paths

The orchestrator.ts code is the **critical** part that prevents the race. The feature.ts code is **safe defensive duplication** that documents the pattern.

### Future Prevention

To prevent similar race conditions in the future:

1. **Pattern**: Whenever spawning async work for a managed object, set the object's status synchronously before the Promise
2. **Comment**: Document why status is set both before and inside the async code
3. **Test**: Add tests verifying status is set before async code executes

### Related Bug Patterns

This race condition is a classic async timing issue. Similar patterns appear in:
- Event handlers that spawn async work
- State management systems with async mutations
- Distributed systems handling concurrent requests

The fix applies the principle: **synchronous setup, asynchronous execution**.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1488*
