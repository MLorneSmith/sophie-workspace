# Bug Fix: Tooltip Provider Missing in cost-badge.tsx and action-toolbar.tsx

**Related Diagnosis**: #1097 (REQUIRED)
**Severity**: medium
**Bug Type**: error
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `CostBadge` and `ActionToolbar` components use `Tooltip` without wrapping in `TooltipProvider`. The partial fix in #1095 added provider to `top-bar.tsx` but `CostBadge` renders outside its scope and `ActionToolbar` was not identified.
- **Fix Approach**: Wrap `Tooltip` components in each component with `TooltipProvider` following the established pattern from `kanban-board.tsx` and `top-bar.tsx`.
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The shadcn/ui `Tooltip` component requires a parent `TooltipProvider` context. Issue #1095 added `TooltipProvider` to `top-bar.tsx`, but:

1. **`CostBadge`** - Standalone component at line 22-35 of `cost-badge.tsx` uses `Tooltip` without `TooltipProvider`
2. **`ActionToolbar`** - Standalone component at line 262-324 of `action-toolbar.tsx` contains 4 `Tooltip` instances without `TooltipProvider`
3. **`top-bar.tsx`** - `CostBadge` is rendered at line 70 BEFORE the `TooltipProvider` at line 71, placing it outside the provider scope

This causes the error: `` `Tooltip` must be used within `TooltipProvider` ``

For full details, see diagnosis issue #1097.

### Solution Approaches Considered

#### Option 1: Wrap each component's Tooltip with TooltipProvider ⭐ RECOMMENDED

**Description**: Add `TooltipProvider` wrapper directly around each component's `Tooltip` usage, following the pattern already established in `kanban-board.tsx`.

**Pros**:
- Encapsulation: Each component handles its own tooltip provider
- Reusability: Components work anywhere without external provider setup
- Consistency: Matches existing `kanban-board.tsx` pattern
- Minimal changes: Only add provider wrapper, no architectural changes

**Cons**:
- Multiple provider instances if components are used together
- Slight performance overhead from extra context providers (negligible)

**Risk Assessment**: low - Shadcn/ui `TooltipProvider` is designed to handle multiple instances

**Complexity**: simple - Straightforward wrapper addition

#### Option 2: Move provider up to parent components

**Description**: Add `TooltipProvider` at the page or layout level and remove tooltip-specific providers.

**Pros**:
- Single provider instance for entire page
- Slightly more efficient

**Cons**:
- Requires modifying parent components (page.tsx, layout.tsx)
- Breaks component encapsulation
- More risky change with wider scope
- Components less portable

**Why Not Chosen**: Breaks component encapsulation and requires changes beyond affected components. The recommended approach is simpler and matches existing patterns.

#### Option 3: Keep provider in top-bar.tsx and move CostBadge inside it

**Description**: Restructure `top-bar.tsx` to move `CostBadge` inside the existing `TooltipProvider` wrapper.

**Pros**:
- Reuses existing provider in one location

**Cons**:
- Only fixes `CostBadge`, not `ActionToolbar`
- Requires JSX restructuring in `top-bar.tsx`
- Incomplete solution

**Why Not Chosen**: Partial fix that doesn't address `ActionToolbar` component.

### Selected Solution: Wrap each component's Tooltip with TooltipProvider

**Justification**: This approach provides the best balance of simplicity, safety, and component encapsulation. It matches the existing pattern in `kanban-board.tsx`, ensures components work independently, and requires minimal changes to the affected files.

**Technical Approach**:
- Import `TooltipProvider` from `@kit/ui/tooltip` in both components
- Wrap the `Tooltip` component(s) with `TooltipProvider` using component-level boundaries
- For `CostBadge`: Single provider wrapping the single Tooltip
- For `ActionToolbar`: Single provider wrapping all 4 Tooltip instances
- Fix `top-bar.tsx` positioning issue: Move `CostBadge` inside `TooltipProvider`

**Architecture Changes** (if any):
- No architectural changes - purely structural UI fix
- No data flow or state management changes
- No database or API changes

**Migration Strategy** (if needed):
- None required - purely client-side component fix

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/web/app/home/(user)/ai/canvas/_components/cost-badge.tsx` - Wrap Tooltip with TooltipProvider at component level
- `apps/web/app/home/(user)/ai/canvas/_components/action-toolbar.tsx` - Wrap all Tooltip instances with single TooltipProvider
- `apps/web/app/home/(user)/ai/canvas/_components/top-bar.tsx` - Move CostBadge inside existing TooltipProvider or add separate provider (verify best pattern)

### New Files

No new files required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Fix cost-badge.tsx

Add `TooltipProvider` wrapper around the existing Tooltip component.

- Import `TooltipProvider` from `@kit/ui/tooltip`
- Wrap the `Tooltip` component with `TooltipProvider`
- Verify component still exports the same interface

**Why this step first**: This is the simplest isolated component to fix, establishing the pattern for the other component.

#### Step 2: Fix action-toolbar.tsx

Add `TooltipProvider` wrapper around all Tooltip instances.

- Import `TooltipProvider` from `@kit/ui/tooltip`
- Wrap the outer `<div className="flex gap-2">` containing all Tooltips with `TooltipProvider`
- Verify all 4 Tooltip instances are now within the provider scope

#### Step 3: Fix top-bar.tsx positioning issue

Reorganize the JSX to move `CostBadge` inside the `TooltipProvider`.

- Restructure the JSX so `CostBadge` renders within the `TooltipProvider` scope
- Alternative: Add separate `TooltipProvider` for the `CostBadge` if structural changes are not clean

#### Step 4: Validate changes

Run type checking and manual testing to ensure no regressions.

- Run `pnpm typecheck` to verify no type errors
- Verify the page loads without "Tooltip must be used within TooltipProvider" error
- Test tooltip hover interactions work correctly

#### Step 5: Run full validation suite

Execute all validation commands.

- Run `pnpm lint`
- Run `pnpm format`

## Testing Strategy

### Unit Tests

The components are visual/UI components that interact with shadcn/ui providers. Testing strategy:

- ✅ Verify `CostBadge` tooltip displays without error
- ✅ Verify `ActionToolbar` tooltips display without error
- ✅ Verify `TopBar` integration doesn't produce errors
- ✅ Verify tooltip content displays on hover (manual)
- ✅ Regression test: Original error should not reoccur

**Test approach**: E2E testing is more appropriate for these UI components since they primarily test provider context availability.

### Integration Tests

Not needed - these are provider configuration issues, not integration points.

### E2E Tests

Existing tests should be verified to ensure they don't encounter the tooltip provider error:

**Test files**:
- `apps/e2e/tests/canvas.spec.ts` or similar - Navigate to canvas page and verify no console errors

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start dev server: `pnpm dev`
- [ ] Navigate to canvas page: `/home/ai` → select a presentation → canvas page
- [ ] Open browser DevTools Console
- [ ] Verify NO error about "Tooltip must be used within TooltipProvider"
- [ ] Hover over CostBadge (shows cost tooltip)
- [ ] Hover over Reset Outline button tooltip (if outline tab)
- [ ] Hover over Simplify Text button tooltip
- [ ] Hover over Add Ideas button tooltip
- [ ] Hover over Improve Structure button tooltip (if answer tab)
- [ ] Hover over Save button tooltip
- [ ] Hover over Fullscreen button tooltip
- [ ] Verify no console errors appear during interactions
- [ ] Verify all tooltips display with correct content

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **JSX Structure Invalidation in top-bar.tsx**: Restructuring JSX might introduce unintended layout changes
   - **Likelihood**: low (simple restructuring)
   - **Impact**: medium (could break layout)
   - **Mitigation**: Verify visual layout through manual testing, ensure className and flexbox alignment unchanged

2. **Multiple Provider Instances**: Adding providers to individual components creates multiple context instances
   - **Likelihood**: high (expected pattern)
   - **Impact**: low (shadcn/ui handles this gracefully)
   - **Mitigation**: This is the standard shadcn/ui pattern, verified working in kanban-board.tsx

3. **Import Errors**: `TooltipProvider` might not be exported from `@kit/ui/tooltip`
   - **Likelihood**: low (already used in top-bar.tsx)
   - **Impact**: high (code won't compile)
   - **Mitigation**: Verify import exists in existing top-bar.tsx usage

**Rollback Plan**:

If this fix causes issues:
1. Remove the added `TooltipProvider` imports and wrappers
2. Revert changes to the three affected files
3. Return to previous behavior (tooltips won't display, but no error)

**Monitoring** (if needed):
- Monitor browser console in production for "Tooltip must be used within TooltipProvider" errors
- No additional monitoring needed after fix validation

## Performance Impact

**Expected Impact**: none

The addition of `TooltipProvider` context providers has negligible performance impact. The providers are lightweight and only manage tooltip positioning state.

**Performance Testing**:
- No specific performance testing needed
- Standard dev tools profiling if concerned about context impact

## Security Considerations

**Security Impact**: none

This is a purely UI component fix with no security implications. No auth, data, or API changes involved.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start dev server
pnpm dev

# Navigate to canvas page in browser:
# 1. Go to /home/ai
# 2. Select a presentation
# 3. You should be routed to /home/ai/canvas?id=[id]
# 4. Open DevTools Console (F12)
# 5. Look for error: "Tooltip must be used within TooltipProvider"
```

**Expected Result**: Error appears in console: `` `Tooltip` must be used within `TooltipProvider` ``

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Manual verification in browser:
# 1. pnpm dev
# 2. Navigate to canvas page
# 3. Open DevTools Console
# 4. Should see NO error about TooltipProvider
# 5. Hover over various tooltips - should display correctly
# 6. No new console errors
```

**Expected Result**: All commands succeed, no TooltipProvider errors in console, all tooltips display correctly on hover.

### Regression Prevention

```bash
# Verify no related errors in other UI components
grep -r "must be used within" . --include="*.tsx"

# Verify TooltipProvider imports are consistent
grep -r "TooltipProvider" apps/web/app --include="*.tsx" | grep import
```

## Dependencies

### New Dependencies (if any)

No new dependencies required. `TooltipProvider` is already part of `@kit/ui/tooltip` (used in `top-bar.tsx`).

## Database Changes

**No database changes required** - This is a purely UI component fix.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - standard deployment

**Feature flags needed**: no

**Backwards compatibility**: maintained - No breaking changes to component APIs or data structures

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass (`pnpm typecheck`, `pnpm lint`, `pnpm format`)
- [ ] Bug no longer reproduces (no TooltipProvider error in console)
- [ ] All Tooltip components display correctly on hover
- [ ] Manual testing checklist complete
- [ ] Zero new console errors or warnings
- [ ] No layout regressions in canvas page

## Notes

The pattern being used is already established in the codebase:
- `kanban-board.tsx` wraps multiple Tooltip instances with a single `TooltipProvider`
- This same pattern should be applied to `ActionToolbar` which has 4 Tooltip instances
- `CostBadge` is a small self-contained component that should have its own `TooltipProvider`

The issue was identified in issue #1095 but only partially fixed. This fix addresses the remaining components and the positioning issue in `top-bar.tsx`.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1097*
