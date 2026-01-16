# Bug Fix: Tooltip Provider Missing on Canvas Page

**Related Diagnosis**: #1094 (REQUIRED)
**Severity**: medium
**Bug Type**: error
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: The `TopBar` component uses `Tooltip` and `TooltipContent` components without wrapping them in a `TooltipProvider`, which is required by shadcn/ui tooltip implementation
- **Fix Approach**: Wrap the Tooltip elements in `TopBar` with `TooltipProvider`, following the pattern already implemented in `kanban-board.tsx`
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The `TopBar` component (`apps/web/app/home/(user)/ai/canvas/_components/top-bar.tsx`) uses the shadcn/ui `Tooltip` component at lines 66-104 to display hover tooltips for the Save and Fullscreen buttons. However, these Tooltip components are not wrapped in a `TooltipProvider`, which is a required provider from the Radix UI tooltip primitive that `TooltipProvider` re-exports.

This causes the React console error: `'Tooltip' must be used within 'TooltipProvider'` when navigating to the canvas page.

For full details, see diagnosis issue #1094.

### Solution Approaches Considered

#### Option 1: Wrap Tooltip Elements with TooltipProvider ⭐ RECOMMENDED

**Description**: Import `TooltipProvider` from `@kit/ui/tooltip` and wrap the Tooltip components with this provider at the appropriate level in the component tree.

**Pros**:
- Follows existing pattern used in `kanban-board.tsx` (lines 126-137)
- Minimal code change (only 2 lines added)
- Zero risk - this is the standard shadcn/ui pattern
- No performance impact
- Maintains separation of concerns - provider at component level

**Cons**:
- Creates multiple TooltipProvider instances if tooltips appear in multiple places (low impact for single component)

**Risk Assessment**: low - This is the standard shadcn/ui pattern and is already used elsewhere in the codebase

**Complexity**: simple - One-line import, two lines of JSX wrapping

#### Option 2: Wrap at Canvas Page Level

**Description**: Add the `TooltipProvider` wrapper at the `CanvasPage` component level instead of within `TopBar`.

**Why Not Chosen**: While this would work, it's less modular. The `TopBar` component explicitly depends on `Tooltip`, so the provider should be at that component's level for maintainability. This approach would also require modifying `canvas-page.tsx` when the real issue is in `top-bar.tsx`.

#### Option 3: Move Tooltips to Separate Component

**Description**: Extract tooltip logic to a separate wrapper component.

**Why Not Chosen**: Over-engineering for a simple wrapper issue. The tooltips are already cleanly contained; they just need a provider wrapper.

### Selected Solution: Wrap Tooltip Elements with TooltipProvider

**Justification**: This approach directly follows the established pattern in the codebase (`kanban-board.tsx`), requires minimal changes, has zero risk, and maintains component modularity. It's the standard shadcn/ui implementation pattern.

**Technical Approach**:
- Import `TooltipProvider` from `@kit/ui/tooltip` (same import as `Tooltip`, `TooltipContent`, `TooltipTrigger`)
- Wrap the tooltip button section (lines 63-105 in top-bar.tsx) with `<TooltipProvider>` tags
- No changes to existing tooltip usage - just add the provider wrapper
- No changes to component props or behavior

**Architecture Changes**: None - this is purely adding a missing provider that should have been there

**Migration Strategy**: Not needed - no data or state changes

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/web/app/home/(user)/ai/canvas/_components/top-bar.tsx` - Add TooltipProvider wrapper and import

### New Files

No new files needed

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update TopBar Component

Modify `apps/web/app/home/(user)/ai/canvas/_components/top-bar.tsx` to wrap tooltip elements with `TooltipProvider`.

- Add `TooltipProvider` to the existing import from `@kit/ui/tooltip` on line 5
- Wrap the tooltip button section (lines 63-105) with `<TooltipProvider>` tags
- Ensure proper indentation and code structure

**Why this step first**: This is the only change needed to resolve the issue

#### Step 2: Add Tests

Write tests to ensure the tooltip provider is present and tooltips render correctly.

- Add unit test to verify `TopBar` renders without errors
- Add unit test to verify tooltip content is accessible to screen readers
- Test that tooltip displays on button hover

#### Step 3: Validation

- Run the application and navigate to the canvas page
- Verify no console errors appear
- Test tooltip functionality by hovering over Save and Fullscreen buttons
- Verify tooltips display correctly with proper content

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ TopBar component renders without React console errors
- ✅ TooltipProvider is correctly wrapping tooltip elements
- ✅ Save button tooltip displays "Saving...", "Saved", or "Save" depending on state
- ✅ Fullscreen button tooltip displays "Fullscreen"
- ✅ Tooltips are accessible via keyboard and screen readers

**Test files**:
- `apps/web/app/home/(user)/ai/canvas/_components/__tests__/top-bar.spec.ts` - Unit tests for TopBar

### Integration Tests

Not needed for this fix - no integration points affected

### E2E Tests

Not needed for this fix - can be tested manually

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Navigate to `/home/ai` and select a presentation from the dropdown
- [ ] Get routed to `/home/ai/canvas?id=[id]` without console errors
- [ ] Open browser DevTools console - no `'Tooltip' must be used within 'TooltipProvider'` error
- [ ] Hover over the Save button - tooltip appears with appropriate text
- [ ] Hover over the Fullscreen button - tooltip appears with "Fullscreen" text
- [ ] Click Save button - tooltip content updates to "Saving..." then "Saved"
- [ ] Click Fullscreen button - tooltip content stays "Fullscreen"
- [ ] Exit fullscreen - tooltip still works correctly
- [ ] Verify no new console errors or warnings

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Tooltip positioning affected**: If TooltipProvider adds any styling or context that affects tooltip positioning
   - **Likelihood**: low
   - **Impact**: low - Radix tooltip provider has no default styling
   - **Mitigation**: Manual testing of tooltip positioning after fix

2. **Z-index issues with floating UI**: If other components on the page have z-index issues
   - **Likelihood**: low
   - **Impact**: low - Canvas page has no other floating elements competing
   - **Mitigation**: Visual inspection during manual testing

3. **Performance regression**: If TooltipProvider adds overhead
   - **Likelihood**: very low
   - **Impact**: none - Single provider instance is negligible
   - **Mitigation**: None needed - provider is performant

**Rollback Plan**:

If this fix causes unexpected issues in production:
1. Remove `TooltipProvider` import from top-bar.tsx
2. Remove `<TooltipProvider>` wrapper tags around tooltip section
3. Redeploy

(This is a safe, straightforward rollback)

**Monitoring**: No monitoring needed - this is a simple UI fix with no runtime dependencies

## Performance Impact

**Expected Impact**: none

No performance implications. `TooltipProvider` is a lightweight context provider from Radix UI with minimal overhead.

## Security Considerations

**Security Impact**: none

No security implications. This is purely a UI component wrapper with no user input, data access, or external API calls.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Navigate to canvas page via UI
# 1. Go to /home/ai
# 2. Select a presentation from the dropdown
# 3. Get routed to /home/ai/canvas?id=[id]
# 4. Open browser console
# Expected: Error "'Tooltip' must be used within 'TooltipProvider'"
```

**Expected Result**: Console shows the tooltip provider error when navigating to canvas page

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Build
pnpm build

# Manual verification
# 1. Start dev server: pnpm dev
# 2. Navigate to /home/ai
# 3. Select a presentation from dropdown
# 4. Verify no console errors
# 5. Hover over Save and Fullscreen buttons
# 6. Verify tooltips appear correctly
```

**Expected Result**: All commands succeed, no console errors, tooltips display correctly on canvas page

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Build test to ensure no type errors
pnpm build

# Verify canvas page loads without errors
# Navigate to /home/ai/canvas?id=[test-id]
```

## Dependencies

### New Dependencies (if any)

No new dependencies required. `TooltipProvider` is already available from the existing `@kit/ui` package.

**No new dependencies needed**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

No special deployment steps needed. This is a simple UI component wrapper fix.

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] No React console errors when navigating to canvas page
- [ ] Tooltips render correctly and display on hover
- [ ] All tests pass
- [ ] Zero regressions detected
- [ ] Manual testing checklist complete

## Notes

This is a straightforward fix following the established pattern in the codebase. The `kanban-board.tsx` component already demonstrates the correct implementation of TooltipProvider, making this fix simple and low-risk.

**Pattern Reference**: See `apps/web/app/home/(user)/kanban/_components/kanban-board.tsx` lines 126-137 for the correct TooltipProvider pattern.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1094*
