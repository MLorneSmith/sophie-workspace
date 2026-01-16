# Bug Fix: Maximum update depth exceeded on /home/ai/blocks route

**Related Diagnosis**: #1084
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Unstable `debouncedFetchSuggestions` function reference created without memoization, causing infinite useEffect trigger cycle
- **Fix Approach**: Wrap `debouncedFetchSuggestions` with `useMemo` to maintain stable reference across renders
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The `/home/ai/blocks` route crashes immediately with "Maximum update depth exceeded" error. The `BlocksForm.tsx` component enters an infinite render loop because the `debouncedFetchSuggestions` function is recreated on every render without memoization, causing the `useEffect` dependency array to change on every render, triggering the effect repeatedly and updating state in an endless cycle.

For full details, see diagnosis issue #1084.

### Solution Approaches Considered

#### Option 1: Wrap with useMemo ⭐ RECOMMENDED

**Description**: Memoize the `debouncedFetchSuggestions` function using React's `useMemo` hook with an empty dependency array. This ensures the function reference remains stable across renders, breaking the infinite loop cycle.

**Pros**:
- Minimal code change (3-5 lines)
- No external dependencies required
- Idiomatic React pattern for stable function references
- Solves the root cause directly
- Zero performance overhead
- Prevents future similar issues

**Cons**:
- None significant

**Risk Assessment**: low - This is a standard React pattern that solves the exact problem

**Complexity**: simple - Single hook addition

#### Option 2: Remove useEffect dependency on fetchSuggestions

**Description**: Refactor to not depend on `fetchSuggestions` in the useEffect, perhaps by using a ref instead or restructuring the logic.

**Pros**:
- Could work in theory
- Demonstrates understanding of closures

**Cons**:
- More complex refactoring required
- Doesn't address the root cause (unstable function reference)
- Could create stale closure bugs elsewhere
- Requires testing more code paths

**Why Not Chosen**: Option 1 directly solves the root cause with minimal change. This approach introduces unnecessary complexity.

#### Option 3: Use useCallback instead of useMemo

**Description**: Replace useMemo with useCallback for the debounced function.

**Pros**:
- Also maintains stable reference
- Semantically correct for functions

**Cons**:
- useCallback is heavier than useMemo for simple functions
- useCallback is typically used when passing functions to child components
- In this case, useMemo is more efficient and appropriate

**Why Not Chosen**: useMemo is the correct choice here since we're not passing the function to children, just using it internally for debouncing.

### Selected Solution: Wrap with useMemo

**Justification**: This approach directly addresses the root cause (unstable function reference) with the minimal, most idiomatic React pattern. It requires only 3-5 lines of code and uses zero external dependencies.

**Technical Approach**:
1. Import `useMemo` from React
2. Wrap the `debounce()` call with `useMemo`
3. Use empty dependency array `[]` so the function is created only once
4. Maintain all existing logic unchanged
5. Test that the page loads without error

**Architecture Changes**: None - this is a pure bug fix with no architectural impact.

**Migration Strategy**: Not applicable - this is a single-component fix with no data migration needs.

## Implementation Plan

### Affected Files

- `apps/web/app/home/(user)/ai/blocks/_components/BlocksForm.tsx` - Add useMemo around debouncedFetchSuggestions function creation (lines 66-105)

### New Files

None required.

### Step-by-Step Tasks

#### Step 1: Import useMemo

Add `useMemo` to the React imports in `BlocksForm.tsx`.

- Import `useMemo` from `'react'`
- Verify imports include: `useCallback`, `useMemo`, etc.

**Why this step first**: Required before using the hook.

#### Step 2: Wrap debouncedFetchSuggestions with useMemo

Locate the `useSuggestions` hook function (lines 66-105) and wrap the `debouncedFetchSuggestions` creation.

- Replace:
  ```typescript
  const debouncedFetchSuggestions = debounce(
    async (input: string) => { ... },
    300,
  );
  ```
- With:
  ```typescript
  const debouncedFetchSuggestions = useMemo(
    () =>
      debounce(
        async (input: string) => { ... },
        300,
      ),
    [],
  );
  ```
- Verify indentation is consistent
- Ensure empty dependency array `[]` is present

**Why this step**: Core fix - stabilizes the function reference.

#### Step 3: Verify the page loads

Test that the fix resolves the infinite loop.

- Navigate to `/home/ai/blocks` route
- Verify no "Maximum update depth exceeded" error
- Verify page renders successfully
- Check browser console for any new errors

#### Step 4: Test component interaction

Verify the form still works correctly after the fix.

- Type in any input fields to trigger the debounced function
- Verify suggestions appear (if applicable)
- Verify no performance issues
- Verify form submission works

#### Step 5: Run validation commands

Execute all validation to ensure no regressions.

- Run `pnpm typecheck`
- Run `pnpm lint:fix`
- Run `pnpm format:fix`
- Run relevant tests (see Testing Strategy)

## Testing Strategy

### Unit Tests

The fix itself doesn't require new unit tests, but verify existing tests still pass:

- ✅ Any existing tests for `useSuggestions` hook
- ✅ Any existing tests for `BlocksForm` component
- ✅ Regression test: The component should render without errors on mount

**Test files**:
- Look for existing test files in `_components/__tests__/` or `.spec.ts` files

### Integration Tests

- ✅ Navigate to `/home/ai/blocks` route without errors
- ✅ Form renders with all fields visible
- ✅ Debounce functionality works (if form has input fields)
- ✅ Form submission works correctly

### E2E Tests

- ✅ User can navigate to `/home/ai/blocks` route
- ✅ Page loads without crashes
- ✅ No infinite redirect loops
- ✅ UI elements are interactive

**Test files**:
- Check `apps/e2e/tests/` for existing blocks-related tests
- Add test if missing: Navigate to blocks route and verify page renders

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Navigate to `/home/ai/blocks` route
- [ ] Verify page loads without "Maximum update depth exceeded" error
- [ ] Verify no React warnings in browser console
- [ ] Verify page content displays correctly
- [ ] Interact with form elements (if any)
- [ ] Verify form submission works (if form exists)
- [ ] Test in multiple browsers (Chrome, Firefox, Safari)
- [ ] Verify no performance degradation

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Function recreated more often than expected**: If the dependency array accidentally includes variables that change, the function could still be recreated
   - **Likelihood**: low (empty array is standard pattern)
   - **Impact**: low (would just revert to original bug)
   - **Mitigation**: Ensure dependency array is empty `[]`, add comment explaining why

2. **Closure issues in debounced function**: The debounced function captures variables from scope
   - **Likelihood**: low (pattern already used in original code)
   - **Impact**: low (same behavior as before)
   - **Mitigation**: Test that debounce logic works correctly

**Rollback Plan**:

If this fix causes issues:
1. Remove the `useMemo` wrapper
2. Revert to original `debouncedFetchSuggestions` assignment
3. Commit rollback and investigate alternative approaches
4. The original code will be in git history if needed

**Monitoring** (if needed): None - this is a client-side UI fix with no monitoring requirements.

## Performance Impact

**Expected Impact**: None to minimal positive

- Eliminates constant function recreation (slight performance improvement)
- No additional memory overhead
- Memoization creates function once, reuses it (very efficient)

**Performance Testing**:
- Use browser DevTools Performance tab to verify render time is improved or unchanged
- No specific performance tests needed for this small fix

## Security Considerations

**Security Impact**: None

This fix has no security implications. It's a pure rendering logic fix with no impact on authentication, authorization, or data handling.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Navigate to the broken route using the development server
# Expected: Page crashes with "Maximum update depth exceeded" error in console
pnpm dev
# Then open http://localhost:3000/home/ai/blocks in browser
# Check browser console for React error
```

**Expected Result**: "Maximum update depth exceeded. This can happen when a component calls setState inside useEffect..." error appears in console, page does not render.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint and fix formatting
pnpm lint:fix
pnpm format:fix

# Run tests (if they exist for this component)
pnpm test:unit

# Build verification
pnpm build

# Manual verification
pnpm dev
# Then open http://localhost:3000/home/ai/blocks in browser
# Verify page loads without errors
```

**Expected Result**: All commands succeed, page loads without "Maximum update depth exceeded" error, no console errors.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify no new warnings
pnpm typecheck
pnpm lint
```

## Dependencies

**No new dependencies required** - This fix uses only React's built-in `useMemo` hook.

## Database Changes

**No database changes required** - This is a pure UI component fix.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - standard deployment.

**Feature flags needed**: No

**Backwards compatibility**: Maintained - no API or data structure changes.

## Success Criteria

The fix is complete when:
- [ ] `useMemo` is imported from React
- [ ] `debouncedFetchSuggestions` is wrapped with `useMemo` with empty dependency array
- [ ] `/home/ai/blocks` page loads without "Maximum update depth exceeded" error
- [ ] All validation commands pass (typecheck, lint, format)
- [ ] Browser console shows no React errors or warnings
- [ ] Form elements (if any) are interactive
- [ ] No performance degradation
- [ ] All existing tests pass
- [ ] Code review approved (if applicable)

## Notes

This is a classic React hooks infinite loop pattern. The root cause is a missing memoization that causes the dependency array to change on every render. The fix is minimal, idiomatic, and directly solves the problem.

The `debounce` function from the library likely doesn't change, but without memoization, we're creating a new debounce instance every render, which is wasteful and breaks the useEffect dependency tracking.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1084*
