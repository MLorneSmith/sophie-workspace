# Bug Fix: Alpha Orchestrator Console Messages Leaking Above UI

**Related Diagnosis**: #1456
**Severity**: low
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `work-queue.ts` and `lock.ts` use raw `console.log()` instead of conditional logger pattern
- **Fix Approach**: Add `uiEnabled` parameter and conditional logger to all logging modules
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

When running the Alpha Spec Orchestrator with UI mode enabled, console.log messages appear above the Ink UI dashboard and disrupt the visual experience. Messages like `✅ Feature #1367 assigned to sbx-a` and `🔒 Acquired orchestrator lock` escape the Ink UI framework's control.

The root cause is that `work-queue.ts` and `lock.ts` use raw `console.log()` calls without checking if UI mode is enabled, whereas other modules (`orchestrator.ts`, `sandbox.ts`, `feature.ts`, `progress.ts`) correctly implement a `createLogger(uiEnabled)` pattern.

For full details, see diagnosis issue #1456.

### Solution Approaches Considered

#### Option 1: Add Conditional Logger to Affected Modules ⭐ RECOMMENDED

**Description**:
- Create a `createLogger(uiEnabled: boolean)` function in each affected module
- Replace all `console.log()` calls with conditional logger calls
- Pass `uiEnabled` parameter through the call chain from `orchestrator.ts`

**Pros**:
- Follows established pattern already used in other modules
- Minimal code changes required
- Clear and maintainable approach
- Enables easy debugging by adding a module-level flag

**Cons**:
- Requires parameter threading through multiple function calls
- Slightly increases function signatures

**Risk Assessment**: Low - This pattern is already proven in 4+ modules

**Complexity**: simple - Copy the pattern from existing modules

#### Option 2: Module-Level Flag Approach

**Description**:
- Add a module-level `setUiEnabled(enabled: boolean)` function
- Export it and call from orchestrator.ts at startup
- Use the flag in conditional logger without parameter threading

**Pros**:
- No need to modify function signatures
- Simpler call sites

**Cons**:
- Less explicit (flag is hidden in module state)
- Harder to test in isolation
- Could be confusing for future maintainers

**Risk Assessment**: Low but less clear

**Complexity**: simple

#### Option 3: Use Environment Variable

**Description**:
- Set an environment variable `UI_ENABLED=true/false`
- Check it in conditional loggers

**Pros**:
- Single place to check
- No parameter threading needed

**Cons**:
- Less type-safe
- Harder to debug
- Less testable

**Risk Assessment**: Low but not recommended

**Complexity**: simple but poor design

### Selected Solution: Option 1 - Add Conditional Logger to Affected Modules

**Justification**:
This approach is already proven in the codebase and ensures consistency. It makes the intent explicit (every function that logs knows it might be in UI mode), it's type-safe, and it's easy to test and debug. The minimal overhead of parameter threading is worth the clarity and consistency it provides.

**Technical Approach**:
1. Add `createLogger(uiEnabled: boolean)` function to `work-queue.ts`
2. Add `createLogger(uiEnabled: boolean)` function to `lock.ts`
3. Modify function signatures to accept `uiEnabled` parameter where needed
4. Replace all `console.log()` calls with `log()` from the conditional logger
5. Thread `uiEnabled` from `orchestrator.ts` down to these functions
6. Ensure all 9 affected call sites in `work-queue.ts` are updated
7. Ensure all 5 affected call sites in `lock.ts` are updated

**Architecture Changes**:
- No architectural changes needed
- Function signatures will include `uiEnabled` parameter where needed
- No new dependencies or files required

**Migration Strategy**:
- This fix is backward compatible
- No data migration needed
- No breaking changes to public APIs

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/work-queue.ts` - 9 console.log calls at lines 76, 101-102, 161-165, 174-176, 192-194, 235-238, 262
- `.ai/alpha/scripts/lib/lock.ts` - 5 console.log calls at lines 117-118, 122, 136-137, 150, 162
- `.ai/alpha/scripts/lib/orchestrator.ts` - Add uiEnabled parameter pass-through

### New Files

None - existing modules will be updated in place.

### Step-by-Step Tasks

#### Step 1: Update `lock.ts` to support conditional logging

Add conditional logger pattern and modify `acquireLock()`, `releaseLock()`, and `updateLockResetState()` functions to accept and use `uiEnabled` parameter.

- Add `createLogger(uiEnabled: boolean)` function at module start
- Modify `acquireLock(specId: number, uiEnabled: boolean = false)` signature
- Replace `console.log()` calls with `log()` from conditional logger
- Modify `releaseLock(uiEnabled: boolean = false)` signature
- Update `updateLockResetState()` to accept `uiEnabled` for consistency (though it doesn't currently log)

**Why this step first**: Lock operations happen early in orchestration, so we need this working before the main orchestrator calls these functions.

#### Step 2: Update `work-queue.ts` to support conditional logging

Add conditional logger pattern and modify affected functions to accept and use `uiEnabled` parameter.

- Add `createLogger(uiEnabled: boolean)` function at module start
- Modify `getNextAvailableFeature()` to accept `uiEnabled` parameter
- Modify `assignFeatureToSandbox()` to accept `uiEnabled` parameter
- Modify `cleanupStaleState()` to accept `uiEnabled` parameter
- Replace all 9 `console.log()` calls with conditional `log()` calls
- Update all call sites to pass `uiEnabled` parameter

**Why this step second**: Work queue functions are called from orchestrator, so we handle them after lock module is updated.

#### Step 3: Update `orchestrator.ts` to pass `uiEnabled` flag

Thread the `uiEnabled` flag from `orchestrator()` function through to all affected function calls.

- In `orchestrator()` function, pass `options.ui` to `acquireLock(specId, options.ui)`
- In `runWorkLoop()` function, pass `uiEnabled` to `getNextAvailableFeature()`, `assignFeatureToSandbox()`, and `cleanupStaleState()`
- Ensure all call sites receive the flag

**Why this step third**: This connects all the pieces together and ensures the flag flows through the call chain.

#### Step 4: Add tests to prevent regression

Create unit tests to verify conditional logging works correctly.

- Add unit test for `createLogger(uiEnabled)` in work-queue.ts module
- Add unit test for `createLogger(uiEnabled)` in lock.ts module
- Verify that when `uiEnabled=true`, no console.log output is produced
- Verify that when `uiEnabled=false`, console.log output is produced as expected

**Why this step**: Tests prevent future developers from accidentally breaking this pattern.

#### Step 5: Manual verification

Run the orchestrator with and without UI mode to verify the fix works.

- Run `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362` and verify NO messages appear above UI
- Run `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --no-ui` and verify all messages appear in console
- Verify the UI dashboard displays correctly with no visual artifacts

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `createLogger(true)` returns logger that suppresses output
- ✅ `createLogger(false)` returns logger that allows output
- ✅ Race condition detection messages are suppressed in UI mode
- ✅ Lock acquisition messages are suppressed in UI mode
- ✅ Feature assignment messages are suppressed in UI mode
- ✅ Stale state cleanup messages are suppressed in UI mode

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/work-queue.spec.ts` - Add tests for work-queue conditional logging
- `.ai/alpha/scripts/lib/__tests__/lock.spec.ts` - Add tests for lock conditional logging (if test file doesn't exist, create it)

### Integration Tests

- ✅ Orchestrator calls work-queue functions with correct `uiEnabled` flag
- ✅ Orchestrator calls lock functions with correct `uiEnabled` flag
- ✅ When UI mode enabled, orchestrator output is suppressed

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/orchestrator.spec.ts` - Add integration tests

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run orchestrator in UI mode: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
  - Verify NO messages appear above the UI box
  - Verify NO messages appear before the UI starts
  - Verify the UI renders correctly with no visual artifacts

- [ ] Run orchestrator in non-UI mode: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --ui false`
  - Verify "Acquired orchestrator lock" message appears in console
  - Verify "Feature #xxxx assigned to sbx-X" messages appear in console
  - Verify race condition/stale state messages appear in console

- [ ] Test lock acquisition with active lock:
  - Start orchestrator, quickly start another instance
  - Verify second instance shows error (not bypassed by console suppression)
  - Verify error messages still appear in non-UI mode

- [ ] Test with multiple features:
  - Run orchestrator with 3+ features
  - Verify no feature assignment messages leak above UI
  - Verify UI shows all features being assigned and executed

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Parameter threading mistakes**: May accidentally pass `false` instead of `uiEnabled` to a function
   - **Likelihood**: low
   - **Impact**: low (just means some messages appear when they shouldn't)
   - **Mitigation**: Code review, unit tests, manual verification

2. **Missed console.log calls**: May miss some console.log calls during refactoring
   - **Likelihood**: low (code is well-organized)
   - **Impact**: low (only those calls would leak)
   - **Mitigation**: Grep for remaining console.log calls, unit tests verify pattern

3. **Function signature incompatibility**: Changing function signatures could break existing callers
   - **Likelihood**: very low (only called from orchestrator.ts)
   - **Impact**: low (would be caught immediately by type checking)
   - **Mitigation**: TypeScript ensures all callers updated, grep for function calls

**Rollback Plan**:

If this fix causes issues:
1. Revert changes to work-queue.ts, lock.ts, and orchestrator.ts
2. This is a simple revert - no data migrations or complex state to handle
3. Orchestrator will return to previous behavior with console messages leaking

**Monitoring** (if needed):
- N/A - This is a UI fix with no production impact
- Verify locally that UI renders cleanly after deployment

## Performance Impact

**Expected Impact**: none

No performance changes expected. This is a pure logging behavior fix.

**Performance Testing**:
- N/A - Conditional logger has negligible performance impact
- Verify no slowdown in feature assignment or orchestration progress

## Security Considerations

**Security Impact**: none

No security implications. This is a console output suppression fix.

## Validation Commands

### Before Fix (Messages Should Leak)

```bash
# Run orchestrator with UI mode - messages will appear above UI
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Look for messages like:
# 🔒 Acquired orchestrator lock
# ✅ Feature #XXXX assigned to sbx-X at TIMESTAMP
```

**Expected Result**: Messages appear above the Ink UI box before UI renders

### After Fix (Messages Should Be Suppressed)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests (if tests added)
pnpm test:unit .ai/alpha/scripts/lib/__tests__/work-queue.spec.ts
pnpm test:unit .ai/alpha/scripts/lib/__tests__/lock.spec.ts

# Manual verification - UI mode (no console messages)
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362
# Verify NO messages appear above the UI

# Manual verification - non-UI mode (all messages appear)
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --ui false
# Verify messages appear in console output
```

**Expected Result**:
- With UI mode: No console messages leak, UI renders cleanly
- Without UI mode: All console messages appear as expected
- All tests pass, zero type errors, code is properly formatted

### Regression Prevention

```bash
# Run full test suite
pnpm test

# Run orchestrator multiple times to verify consistency
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362  # Verify second run also works

# Verify no new console.log calls added without checking uiEnabled
grep -r "console\.log" .ai/alpha/scripts/lib/*.ts | grep -v "createLogger" | grep -v "uiEnabled"
# Should return empty or only expected calls
```

## Dependencies

### New Dependencies

None - This fix uses only standard Node.js APIs and existing patterns.

**No new dependencies required**

## Database Changes

**No database changes required**

This is a UI/logging fix that doesn't involve schema changes or data migration.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - This is a simple code update with no infrastructure changes.

**Feature flags needed**: no

**Backwards compatibility**: maintained - Function signatures have `uiEnabled = false` defaults for any callers not yet updated.

## Success Criteria

The fix is complete when:
- [ ] All console.log calls in work-queue.ts check uiEnabled before logging (9 calls)
- [ ] All console.log calls in lock.ts check uiEnabled before logging (5 calls)
- [ ] TypeScript compilation passes (pnpm typecheck)
- [ ] Linting passes (pnpm lint)
- [ ] Code formatting correct (pnpm format)
- [ ] Unit tests pass (if tests added)
- [ ] Manual testing shows NO messages leak above UI in UI mode
- [ ] Manual testing shows ALL messages appear in non-UI mode
- [ ] Zero regressions detected
- [ ] Code review approved

## Notes

This is a straightforward fix that follows an established pattern in the codebase. The conditional logger pattern is already used in 4+ modules (`orchestrator.ts`, `sandbox.ts`, `feature.ts`, `progress.ts`), so we're just extending it to the remaining modules.

The fix is low-risk because:
1. It only affects console output, not functionality
2. The pattern is proven and tested in other modules
3. Default parameter values provide backward compatibility
4. Changes are localized to 2 modules + 1 orchestrator caller
5. No breaking changes to public APIs

Implementation should be straightforward - copy the pattern from existing modules and adapt it to the new modules.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1456*
