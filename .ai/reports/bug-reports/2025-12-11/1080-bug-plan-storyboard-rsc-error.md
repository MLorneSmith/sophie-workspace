# Bug Fix: Storyboard page fails with "Functions cannot be passed to Client Components" error

**Related Diagnosis**: #1079 (REQUIRED)
**Severity**: high
**Bug Type**: error
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Server Component passes arrow function to Client Component's `fallback` prop, violating React Server Components serialization rules
- **Fix Approach**: Change ErrorBoundary interface to accept `fallback: ReactNode` instead of function (matching the working canvas pattern)
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The `storyboard/page.tsx` Server Component attempts to pass an inline arrow function `(error) => (...)` to the `ErrorBoundary` Client Component's `fallback` prop. React Server Components cannot serialize functions across the Server/Client boundary, causing the error: "Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with 'use server'."

For full details, see diagnosis issue #1079.

### Solution Approaches Considered

#### Option 1: Change ErrorBoundary interface to accept ReactNode ⭐ RECOMMENDED

**Description**: Update the storyboard-specific `ErrorBoundary` component to accept `fallback: ReactNode` instead of `fallback: (error: Error | null) => ReactNode`. This matches the working pattern already implemented in the canvas error boundary component.

**Pros**:
- Allows Server Components to pass pre-rendered JSX directly
- Matches the proven working pattern in `canvas/_components/error-boundary.tsx`
- Simple, minimal change (3 lines in error-boundary.tsx)
- No changes needed to page.tsx
- Eliminates the need for arrow functions across Server/Client boundary
- Consistent with React Server Components best practices

**Cons**:
- Error message cannot be displayed in fallback UI (error info is only available in Client Component)
- Loss of error detail visibility compared to function approach

**Risk Assessment**: Low - Canvas component already uses this pattern successfully with no issues.

**Complexity**: simple - Straightforward interface change with no business logic modification.

#### Option 2: Move ErrorBoundary into Client Component

**Description**: Convert the ErrorBoundary wrapper into a Client Component and move it inside the StoryboardPage component. This allows the Server Component to pass props to a Client Component that internally handles error display.

**Pros**:
- Maintains ability to pass error details to fallback
- Keeps current architecture

**Cons**:
- Requires more extensive refactoring
- Violates React Server Components architecture pattern
- More complex implementation
- Requires modifying StoryboardPage component structure

**Why Not Chosen**: Option 1 is simpler, proven to work, and aligns with React Server Components best practices. The error message loss is acceptable since error boundaries are typically last-resort UI, not primary error reporting.

#### Option 3: Use 'use server' directive on fallback function

**Description**: Mark the fallback function with 'use server' directive to make it serializable.

**Why Not Chosen**: This is incorrect usage of 'use server'. The directive is meant for server actions, not for making inline functions serializable. React doesn't support this pattern for arbitrary functions in props.

### Selected Solution: Change ErrorBoundary interface to accept ReactNode

**Justification**:

The canvas component already implements this exact pattern successfully. The storyboard error boundary was incorrectly implemented compared to the canvas version. By aligning storyboard with the proven canvas pattern, we solve the serialization error while maintaining consistency across the codebase.

The tradeoff of losing error detail in the fallback UI is acceptable because:
1. Error boundaries are typically last-resort fallbacks for critical errors
2. Errors are still caught and can be logged internally
3. Users still see an error message and recovery option (retry button)

**Technical Approach**:
- Update `storyboard/_components/error-boundary.tsx` to change `fallback` prop from function to ReactNode
- Update fallback rendering logic to render the ReactNode directly instead of calling it as a function
- No changes needed to `storyboard/page.tsx` (already passes ReactNode)

**Architecture Changes**: None - this is an internal component change that maintains backward compatibility at the usage level.

**Migration Strategy**: Not needed - this is an isolated bug fix with no data migration or breaking changes.

## Implementation Plan

### Affected Files

- `apps/web/app/home/(user)/ai/storyboard/_components/error-boundary.tsx` - Update interface to accept `fallback: ReactNode` instead of function, simplify render logic
- `apps/web/app/home/(user)/ai/storyboard/page.tsx` - No changes (already passes correct JSX)

### New Files

No new files required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update ErrorBoundary interface

<describe what this step accomplishes>

Update the storyboard ErrorBoundary component to match the canvas pattern:

- Change `fallback` prop type from `(error: Error | null) => ReactNode` to `ReactNode`
- Remove the logger import and getLogger functionality (not needed for ReactNode fallback)
- Update the render method to return `this.props.fallback` directly instead of calling it as a function

**Why this step first**: This is the core fix that resolves the serialization error. Once this change is made, the storyboard page will load without errors.

#### Step 2: Verify the fix resolves the error

<describe what this step accomplishes>

Test the storyboard page to confirm the fix works:

- Navigate to `/home/ai` in the browser
- Click the "Get Started" button to navigate to `/home/ai/storyboard`
- Verify the storyboard page loads without console errors
- Verify the error boundary still functions (can be tested by triggering an error in StoryboardPage)

**Why this step**: Validates that the fix resolves the original issue.

#### Step 3: Run code quality checks

<describe what this step accomplishes>

Ensure code quality standards are maintained:

- Run `pnpm typecheck` to verify TypeScript types
- Run `pnpm lint` to check code style
- Run `pnpm format` to ensure consistent formatting

**Why this step**: Prevents introducing lint errors or type issues.

#### Step 4: Verify no regressions

<describe what this step accomplishes>

Ensure the fix doesn't break other functionality:

- Run full test suite: `pnpm test`
- Manually test the canvas storyboard to ensure error boundary still works
- Check console for any new errors

**Why this step**: Confirms the fix doesn't introduce unintended side effects.

## Testing Strategy

### Unit Tests

No new unit tests required - error boundaries are integration-level components. The existing error handling is still tested through integration tests.

### Integration Tests

The error boundary pattern is tested through the StoryboardPage integration:
- ✅ Page loads successfully without serialization errors
- ✅ Error boundary catches errors in child components
- ✅ Fallback UI displays when error occurs

### E2E Tests

**Test files**:
- `apps/e2e/tests/storyboard.spec.ts` (if exists) - Verify storyboard page loads

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Navigate to `/home/ai` in the browser
- [ ] Click "Get Started" button to navigate to storyboard
- [ ] Confirm storyboard page loads without errors
- [ ] Check browser console - no "Functions cannot be passed to Client Components" error
- [ ] Verify all UI elements render correctly
- [ ] Test retry button functionality (navigate elsewhere and back)
- [ ] Verify canvas page still works correctly (error boundary pattern baseline)

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **Error Details Lost in Fallback**: Error message no longer displayed in fallback UI
   - **Likelihood**: Low (this is intentional, not an oversight)
   - **Impact**: Low (error boundaries are last-resort fallbacks)
   - **Mitigation**: Errors are still caught and logged; users see a message and can retry

2. **Breaking Change to ErrorBoundary API**: Applications using this component with function fallbacks will break
   - **Likelihood**: Low (only storyboard uses this component)
   - **Impact**: Medium (component would need updating)
   - **Mitigation**: Grep search confirms only storyboard uses this error boundary instance

**Rollback Plan**:

If this fix causes unexpected issues:
1. Revert the change to `storyboard/_components/error-boundary.tsx`
2. The storyboard page will show the original serialization error (acceptable regression)
3. Create a new issue to investigate why the function approach is needed

**Monitoring**: Not required - this is a straightforward UI component fix.

## Performance Impact

**Expected Impact**: none

No performance implications. This is a structural fix, not a performance optimization or regression.

## Security Considerations

**Security Impact**: none

No security implications. Error boundaries are client-side UI error handling only.

## Validation Commands

### Before Fix (Bug Should Reproduce)

The original reproduction steps from diagnosis issue #1079:

```bash
# Start development server
pnpm dev

# Navigate to /home/ai in browser, click "Get Started" button
# Expected: Console error "Functions cannot be passed directly to Client Components..."
```

**Expected Result**: Console error appears when navigating to storyboard.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run full test suite
pnpm test

# Manual verification
# Navigate to /home/ai, click "Get Started" button
# Expected: Storyboard page loads without errors
```

**Expected Result**: All commands succeed, storyboard page loads without serialization error.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify canvas error boundary still works
# Navigate to canvas page and verify it loads correctly
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

### Existing Dependencies Used

- React Server Components (built-in)
- Next.js 16 (already required)

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**: None required.

**Feature flags needed**: No

**Backwards compatibility**: Maintained - this is an internal component fix with no API breaking changes at the page level.

## Success Criteria

The fix is complete when:
- [ ] ErrorBoundary interface changed to accept `fallback: ReactNode`
- [ ] Storyboard page loads without "Functions cannot be passed to Client Components" error
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes with no regressions
- [ ] Manual testing checklist complete
- [ ] No console errors on storyboard page load
- [ ] Error boundary still catches errors in child components

## Notes

**Key Implementation Details**:
1. The canvas error boundary at `apps/web/app/home/(user)/ai/canvas/_components/error-boundary.tsx` already implements the correct pattern - use this as reference
2. The storyboard page's fallback JSX is already properly formatted and ready to use as ReactNode
3. No changes needed to `storyboard/page.tsx` - it already passes the correct JSX structure

**Why This Pattern Works**:
- Server Components can return JSX directly
- When a Server Component passes JSX to a Client Component prop, the JSX is pre-rendered on the server
- The Client Component receives serialized JSX (ReactNode), not a function
- This aligns with React Server Components architecture principles

**Reference Implementation**:
The canvas component demonstrates this pattern correctly:
- `fallback: ReactNode` in Props interface
- Direct rendering: `return this.props.fallback;`
- No function invocation needed

**Decision Log**:
- Initially, the storyboard ErrorBoundary was incorrectly designed to accept a function for dynamic error display
- Analysis of the canvas component revealed the preferred pattern: accept pre-rendered ReactNode
- This pattern is simpler, avoids serialization issues, and aligns with RSC best practices

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1079*
