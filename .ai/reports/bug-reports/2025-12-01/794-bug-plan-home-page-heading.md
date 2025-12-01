# Bug Fix: Home page missing h1/h2 heading element fails accessibility test

**Related Diagnosis**: #779 (REQUIRED)
**Severity**: medium
**Bug Type**: accessibility
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `HomeLayoutPageHeader` component receives `title` prop but fails to forward it to `PageHeader` component, preventing the h1 element from rendering
- **Fix Approach**: Add `title` prop forwarding in `HomeLayoutPageHeader` wrapper component
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The home page dashboard at `/home` fails the accessibility test "All pages have proper document structure" because no heading element (`<h1>` or `<h2>`) is rendered.

The root cause is that `HomeLayoutPageHeader` (a wrapper component) receives a `title` prop but does not pass it to the underlying `PageHeader` component. Since `PageHeader` only renders a heading when it receives a `title` prop, the absence of this prop forwarding results in no heading being rendered on the page.

For full details, see diagnosis issue #779.

### Solution Approaches Considered

#### Option 1: Forward title prop in HomeLayoutPageHeader ⭐ RECOMMENDED

**Description**: Add the `title` prop to the `PageHeader` component invocation in `HomeLayoutPageHeader`. This is a one-line fix that ensures the title is passed through the wrapper component.

**Pros**:
- Minimal change (single line of code)
- Fixes the root cause directly
- No API changes or breaking changes
- Simple to test and validate
- Aligns with the wrapper component's purpose

**Cons**:
- None identified

**Risk Assessment**: low - This is a straightforward prop forwarding fix with no side effects.

**Complexity**: simple - Single-line change to existing code.

#### Option 2: Remove the wrapper component entirely

**Description**: Instead of fixing the wrapper, use `PageHeader` directly in the home page component.

**Cons**:
- Removes abstraction that may be useful for future variants
- Requires changes in the page component (additional file changes)
- More disruptive to existing code

**Why Not Chosen**: The wrapper provides abstraction for home-page-specific styling or logic. A one-line fix is simpler and preserves the component structure.

### Selected Solution: Forward title prop in HomeLayoutPageHeader

**Justification**: This is the most pragmatic solution. The `HomeLayoutPageHeader` wrapper component is designed to provide a consistent interface for the home page. The fix is a single-line addition that directly addresses the root cause without introducing complexity or breaking changes.

**Technical Approach**:
- Add `title={props.title}` to the `PageHeader` component props in `HomeLayoutPageHeader`
- The `PageHeader` component already has full support for rendering the title as an `<h1>` element
- No changes to `PageHeader` itself are needed

## Implementation Plan

### Affected Files

- `apps/web/app/home/(user)/_components/home-page-header.tsx` - Add `title` prop forwarding (primary fix)
- `apps/e2e/tests/accessibility/accessibility-hybrid-simple.spec.ts` - Test that validates the fix (no changes needed, test will pass)

### New Files

No new files required.

### Step-by-Step Tasks

#### Step 1: Fix the HomeLayoutPageHeader component

<describe what this step accomplishes>

The core fix: forward the `title` prop from `HomeLayoutPageHeader` to `PageHeader`.

- Edit `apps/web/app/home/(user)/_components/home-page-header.tsx`
- Add `title={props.title}` to the `PageHeader` component props
- Verify the change is minimal and focused

**Why this step first**: This is the only code change needed to fix the bug.

#### Step 2: Type check and lint

<describe what this step accomplishes>

Ensure the fix passes all code quality checks.

- Run `pnpm typecheck` to verify TypeScript types are correct
- Run `pnpm lint:fix` to auto-fix any linting issues
- Run `pnpm format:fix` to ensure consistent formatting

#### Step 3: Run accessibility tests

<describe what this step accomplishes>

Verify that the failing accessibility test now passes with the fix applied.

- Run the specific accessibility test shard: `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh --shard 5`
- Verify that the test "All pages have proper document structure" passes
- Verify that no new test failures are introduced

#### Step 4: Run full E2E test suite

<describe what this step accomplishes>

Ensure the fix doesn't introduce regressions in other parts of the application.

- Run the full E2E test suite: `pnpm test:e2e`
- Verify all tests pass (including the previously failing accessibility test)
- Check for any unexpected failures

#### Step 5: Manual verification

<describe what this step accomplishes>

Manually verify the fix works as expected in the browser.

- Navigate to `http://localhost:3000/home` (personal account home page)
- Open browser DevTools and inspect the DOM
- Verify that an `<h1>` element now exists with the "Home" title text
- Verify the heading is visible and properly styled
- Test keyboard navigation to ensure the heading is accessible

## Testing Strategy

### Unit Tests

The fix does not require new unit tests because:
- The component is a thin wrapper with no business logic
- The underlying `PageHeader` component already handles rendering the heading correctly
- The fix is a straightforward prop forwarding that doesn't introduce new behavior

**Validation**: The fix will be validated by the existing accessibility E2E tests.

### Integration Tests

No new integration tests needed. The fix is isolated to component prop forwarding.

### E2E Tests

The existing E2E accessibility test will validate the fix:

**Test files**:
- `apps/e2e/tests/accessibility/accessibility-hybrid-simple.spec.ts` - Tests that "All pages have proper document structure" passes

This test uses the `HybridAccessibilityTester` to validate:
- Proper heading hierarchy (h1 → h2 → h3)
- Presence of at least one heading element on pages that require them
- WCAG 2.1 AA compliance for document structure

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Navigate to home page at `/home`
- [ ] Open browser DevTools (F12)
- [ ] Verify `<h1>` element exists in the DOM with text "Home"
- [ ] Verify heading is visible and properly styled
- [ ] Check that the page structure is semantically correct
- [ ] Test keyboard navigation (Tab key) - heading should be reachable
- [ ] Verify no CSS errors in browser console related to heading styles
- [ ] Test in multiple browsers (Chrome, Firefox, Safari) if possible

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Unintended prop interference**: Adding the `title` prop might conflict with other logic
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: The `title` prop is a simple string/ReactNode that gets passed to `PageHeader`, which handles it correctly. No complex logic depends on the absence of this prop.

2. **Styling regression**: The title rendering might have unexpected visual side effects
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: The `PageHeader` component is used in other parts of the application with titles, so the styling is already tested. Manual verification will catch any visual issues.

3. **Accessibility violations introduced**: The fix might inadvertently introduce new accessibility issues
   - **Likelihood**: very low
   - **Impact**: medium
   - **Mitigation**: The accessibility test suite will immediately catch any new violations. The fix is adding a properly structured `<h1>` element, which improves accessibility rather than harming it.

**Rollback Plan**:

If this fix causes issues in production:
1. Revert the single-line change to `home-page-header.tsx`
2. The test will fail again, but the application will continue to work (as it did before the fix)
3. No database changes or complex rollback steps are needed

**Monitoring** (not needed for this fix):
- No monitoring needed - this is a straightforward UI fix with no performance implications

## Performance Impact

**Expected Impact**: none

The addition of a heading element has no performance impact:
- The `<h1>` element is a simple DOM node with no event listeners or complex logic
- CSS class application is minimal and already used elsewhere
- No network requests or data fetching involved

## Security Considerations

**Security Impact**: none

This fix introduces no security implications:
- It's purely a UI change to add a heading element
- No user input is involved
- No authentication or authorization changes
- No sensitive data is exposed

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run the specific accessibility test that fails
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh --shard 5
```

**Expected Result**: Test "All pages have proper document structure" fails because no heading element exists on the home page.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint:fix

# Format
pnpm format:fix

# Run accessibility tests (shard 5)
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh --shard 5

# Run full E2E suite
pnpm test:e2e

# Manual verification
# 1. Start dev server: pnpm dev
# 2. Navigate to http://localhost:3000/home
# 3. Inspect DOM in DevTools - verify <h1> element exists
```

**Expected Result**: All commands succeed, accessibility test passes, `<h1>` element is visible in the DOM with "Home" text.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Run accessibility tests specifically
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh --shard 5
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

The fix uses only existing code and components already imported in the file.

## Database Changes

**Migration needed**: no

No database schema changes are required. This is purely a UI/component fix.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: none

This fix can be deployed immediately:
- No feature flags needed
- No phased rollout required
- No dependent changes needed

**Backwards compatibility**: maintained

The change is fully backwards compatible. No breaking changes to any APIs or component interfaces.

## Success Criteria

The fix is complete when:
- [ ] `home-page-header.tsx` has `title={props.title}` added to the `PageHeader` component
- [ ] `pnpm typecheck` passes without errors
- [ ] `pnpm lint:fix` passes without errors
- [ ] `pnpm format:fix` passes without errors
- [ ] Accessibility test (shard 5) passes
- [ ] Full E2E test suite passes
- [ ] Manual verification confirms `<h1>` element is present and visible
- [ ] No regressions detected in other tests

## Notes

This is a straightforward accessibility fix that involves a single-line code change. The root cause was clearly identified in the diagnosis issue #779, making this an ideal candidate for quick resolution.

The fix improves accessibility compliance with WCAG 2.1 AA standards by ensuring proper document structure with heading elements present on all major pages.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #779*
