# Bug Fix: Progress Poller Race Condition

**Related Diagnosis**: #1633
**Severity**: high
**Bug Type**: race condition
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: `stop()` method doesn't await current poll iteration, allowing stale data to overwrite in-progress writes
- **Fix Approach**: Make `stop()` async and await the current poll cycle before returning
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The progress polling system in the orchestrator has a race condition where multiple pollers can write to the same progress file concurrently. When a poller is stopped, it immediately sets `isPolling = false` but doesn't wait for the current `await sandbox.commands.run()` to complete. This allows the async operation to finish and write to the file AFTER the next poller has already started writing.

Specific sequence:
1. Feature A's poller starts `await sandbox.commands.run()` (5s timeout)
2. Feature A finishes, calls `progressPoller.stop()` which sets `isPolling = false`
3. Feature B starts, creates new poller with new feature context
4. Feature A's await completes 1-2 seconds later, writes progress with Feature A's data
5. Feature B's progress file gets overwritten with stale Feature A data
6. UI shows wrong feature name and task count

The actual work is correct (sandbox is doing the right tasks), but the UI display is stale.

For full details, see diagnosis issue #1633.

### Solution Approaches Considered

#### Option 1: Await Current Poll Iteration ⭐ RECOMMENDED

**Description**: Make `stop()` an async function that waits for the current poll iteration to complete before returning. Track the in-flight poll promise and await it if `stop()` is called during an async operation.

**Pros**:
- Clean semantics: `stop()` truly stops polling when it returns
- No additional dependencies or complexity
- Prevents ALL race conditions in the polling loop
- Callers can properly synchronize: `await progressPoller.stop()`
- Most robust solution that handles all edge cases

**Cons**:
- Requires changing the API from synchronous to async
- Callers must be updated to `await` the stop call
- Minor refactoring needed in calling code

**Risk Assessment**: low - Async stop is the correct API pattern for cleanup

**Complexity**: simple - Just track and await the poll promise

#### Option 2: Add Feature ID Validation Before Write

**Description**: Before writing progress to the UI, check if the feature ID in the poller's closure still matches the current feature being processed. Skip write if mismatch detected.

**Pros**:
- Backwards compatible - doesn't change `stop()` API
- Quick to implement
- Filters out stale writes

**Cons**:
- Doesn't actually stop the background poll from running
- Still allows wasted writes and poll iterations after stop
- Only symptom relief, not root cause fix
- Another poll cycle may complete and write again immediately after
- Doesn't guarantee consistency

**Why Not Chosen**: This is a band-aid fix. The root cause is that `stop()` doesn't actually stop polling, so writes will continue happening in the background. Better to fix the root cause properly.

#### Option 3: Add Mutex Around File Writes

**Description**: Wrap all writes to the progress file with a mutex/lock to prevent concurrent writes.

**Pros**:
- Protects against concurrent writes
- Can prevent file corruption

**Cons**:
- Doesn't solve the race condition in the polling logic itself
- Just makes concurrent writes atomic, doesn't prevent them
- Adds complexity with lock management
- Still wastes CPU on unnecessary poll iterations
- Doesn't align with proper async/await patterns

**Why Not Chosen**: Mutex prevents file corruption but doesn't fix the core issue that polling should actually stop. The proper solution is to make `stop()` wait for in-flight operations.

### Selected Solution: Await Current Poll Iteration

**Justification**: This approach fixes the root cause properly. When `stop()` is called, it should ensure the current iteration completes before returning. This prevents any in-flight operations from writing stale data after new features have started. It's the correct async cleanup pattern and aligns with best practices.

The change is minimal - just tracking the current poll promise and awaiting it in `stop()`. All callers get better semantics (truly stopping when they await), and the race condition is eliminated.

**Technical Approach**:
- Add a `currentPollPromise` variable to track the in-flight poll iteration
- Wrap the async operations in a Promise that can be awaited
- Make `stop()` async and await any in-flight poll before returning
- Ensure early exit checks (`if (!isPolling) return`) after long-running operations
- Update all call sites of `progressPoller.stop()` to `await progressPoller.stop()`

**Architecture Changes**: None - just internal refactoring of the polling mechanism

**Migration Strategy**: Since `stop()` becomes async, all callers must be updated to await it. The locations are:
- `.ai/alpha/scripts/lib/feature.ts` - Feature execution cleanup
- Feature loop cleanup logic in orchestrator

This is low-risk because the change makes the API more correct, and the updates are straightforward.

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/progress.ts:startProgressPolling()` - Add poll promise tracking, make stop() async, add early exit checks
- `.ai/alpha/scripts/lib/feature.ts` - Update calls to `progressPoller.stop()` to use await
- Any other callers of `progressPoller.stop()` - Add await

### New Files

None - this is a pure fix with no new components.

### Step-by-Step Tasks

#### Step 1: Understand current polling implementation

Read and understand:
- `progress.ts:startProgressPolling()` function (lines 320-394)
- How `stop()` is called from feature.ts
- The poll cycle timing and error handling

**Why this step first**: Need to understand the full context before making changes to ensure we don't miss any call sites.

#### Step 2: Modify `startProgressPolling()` to track poll promise

**Changes to `.ai/alpha/scripts/lib/progress.ts`**:
1. Add `let currentPollPromise: Promise<void> | null = null;` before the poll function
2. Wrap the poll loop body in a Promise assignment: `currentPollPromise = (async () => { ... })()`
3. Await each iteration: `await currentPollPromise;`
4. Clear the promise after await: `currentPollPromise = null;`
5. Add early exit check after `await sandbox.commands.run()`: `if (!isPolling) return;`

This ensures the stop() method can track any in-flight operations.

#### Step 3: Make `stop()` async and await current poll

**Changes to `.ai/alpha/scripts/lib/progress.ts`**:
1. Change `stop: () => { ... }` to `stop: async () => { ... }`
2. Add await logic: `if (currentPollPromise) await currentPollPromise;`
3. Set `isPolling = false` before awaiting (already correct)

The new stop function:
```typescript
stop: async () => {
  isPolling = false;
  if (currentPollPromise) {
    await currentPollPromise;
  }
}
```

#### Step 4: Update all callers to await stop()

**Changes to `.ai/alpha/scripts/lib/feature.ts` and other files**:
1. Find all calls to `progressPoller.stop()`
2. Change `progressPoller.stop()` to `await progressPoller.stop()`
3. Ensure calling functions are async (they should be already in orchestrator context)

#### Step 5: Add regression test

Add test covering:
- Rapid feature succession (Feature A stops, Feature B starts immediately)
- Verify no stale data in progress file after stop
- Verify new feature data is not overwritten

#### Step 6: Run validation

Run all validation commands and verify zero regressions.

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `stop()` awaits in-flight poll before returning
- ✅ Multiple rapid stop/start cycles don't cause stale writes
- ✅ Progress file contains only current feature data after stop
- ✅ Edge case: `stop()` called during sandbox.commands.run() (5s timeout)
- ✅ Edge case: `stop()` called between poll iterations
- ✅ Regression test: Original bug - Feature A data doesn't overwrite Feature B data

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/progress.test.ts` - Add tests for polling race condition

### Integration Tests

Test in context of feature execution:
- Feature completes and calls `progressPoller.stop()` during next feature start
- Verify progress file consistency across feature transitions
- Verify no corrupted/stale data in progress output

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run orchestrator with multiple features
- [ ] Monitor progress file during feature transitions
- [ ] Verify feature name in UI matches current executing feature
- [ ] Verify task count updates correctly as tasks complete
- [ ] Check no stale feature data appears in progress file
- [ ] Run with rapid feature succession (quick-completing features)
- [ ] Monitor for any console errors or unhandled promise rejections
- [ ] Verify type safety with TypeScript build

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Async API Change**: `stop()` becoming async requires updating all call sites
   - **Likelihood**: high (certain to require changes)
   - **Impact**: medium (straightforward updates, no complex coordination)
   - **Mitigation**: Carefully audit all usages, add TypeScript type checking, test thoroughly

2. **Deadlock from Awaiting**: If stop() is called incorrectly, could cause event loop issues
   - **Likelihood**: low (async/await pattern is standard)
   - **Impact**: medium (would hang orchestrator)
   - **Mitigation**: Add timeout to await in stop() if needed, ensure no circular awaits, test edge cases

3. **Performance**: Polling delay increases if stop() waits for long-running sandbox operation
   - **Likelihood**: medium (sandbox.commands.run has 5s timeout)
   - **Impact**: low (acceptable to wait 5 seconds for clean shutdown)
   - **Mitigation**: Use timeouts in stop() if needed, measure in testing

4. **Incomplete Call Site Updates**: Missing a `progressPoller.stop()` call that doesn't get updated
   - **Likelihood**: low (grep search will find them all)
   - **Impact**: high (silent race condition continues)
   - **Mitigation**: Comprehensive grep, code review, TypeScript will catch missing awaits

**Rollback Plan**:

If this fix causes issues in production:
1. Revert `.ai/alpha/scripts/lib/progress.ts` to previous version
2. Revert `.ai/alpha/scripts/lib/feature.ts` to previous version
3. Restart orchestrator
4. Race condition will return but orchestrator will be stable
5. File a new bug report with more context on the issues encountered

**Monitoring** (if deployed):
- Monitor for TypeScript compilation errors (missing await on stop calls)
- Watch for "Promise rejection" errors in logs
- Check for orchestrator hangs or timeouts
- Verify progress file correctness across feature transitions

## Performance Impact

**Expected Impact**: minimal

The fix doesn't change the polling frequency or sandbox operations. The only change is that we properly wait for in-flight operations to complete during shutdown. This is the CORRECT behavior and shouldn't degrade performance - it actually prevents wasted writes and improves correctness.

There may be a slight delay during feature transitions (up to 5 seconds worst case if sandbox command times out), but this is acceptable and necessary for correctness.

## Security Considerations

**Security Impact**: none

This is a pure fix to eliminate a race condition. No security boundaries are crossed, no authentication/authorization changes, no external API changes. The fix properly enforces shutdown semantics which is more correct from a security perspective (proper resource cleanup).

## Validation Commands

### Before Fix (Bug Should Reproduce)

The race condition is probabilistic, but can be observed by:

```bash
# Run orchestrator and watch progress file during feature transitions
# Look for progress file containing stale feature data while new feature is executing

# Monitor progress.json during feature completion
watch -n 0.5 'cat .ai/alpha/ui/progress.json | jq .feature.issue_number'

# See if feature number jumps to old feature temporarily
```

**Expected Result**: Occasional stale feature numbers in progress file during rapid feature transitions.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests
pnpm test:unit --run progress

# Build
pnpm build

# Manual verification
# Run orchestrator multiple times and verify:
# - Feature display always matches executing feature
# - No stale data in progress.json
# - All feature transitions clean
```

**Expected Result**: All commands succeed, bug is eliminated, zero regressions.

### Regression Prevention

```bash
# Run full test suite
pnpm test

# Run orchestrator with multiple features
.ai/alpha/scripts/orchestrate.sh

# Verify progress file consistency
# Check no stale feature data appears
```

## Dependencies

### New Dependencies

**No new dependencies required**

This fix uses standard TypeScript/JavaScript async/await patterns available in all supported Node.js versions.

## Database Changes

**No database changes required**

This is a pure fix to the polling logic with no database schema or data changes.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - this is a safe code fix with no infrastructure changes.

**Feature flags needed**: no

**Backwards compatibility**: Breaking change to `progressPoller.stop()` API - must update all call sites. All updates are straightforward `stop()` → `await stop()` changes.

## Success Criteria

The fix is complete when:
- [ ] `startProgressPolling()` properly tracks poll promise
- [ ] `stop()` is async and awaits current poll iteration
- [ ] All callers of `stop()` properly `await` the call
- [ ] Type checking passes (TypeScript will enforce the async API)
- [ ] Unit tests verify no race condition with rapid feature succession
- [ ] Manual testing shows stable feature display with no stale data
- [ ] Zero regressions in other orchestrator functionality
- [ ] Code review approved

## Notes

**Important considerations**:
1. The diagnosis issue was closed as "expected behavior" but the underlying race condition is still real and worth fixing for code quality
2. The race is more likely when features complete quickly in succession
3. The actual work is progressing correctly - this is purely a display issue
4. Consider this when prioritizing: it's a correctness issue with low user impact but high code quality value

**Related documentation**:
- Diagnosis issue #1633 contains detailed timeline of race condition
- Progress polling is part of orchestrator's real-time UI updates
- Similar async cleanup patterns used throughout the codebase

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1633*
