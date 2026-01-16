# Bug Fix: Kanban drag-drop uses closestCenter collision which fails for multi-container kanban

**Related Diagnosis**: #1105 (REQUIRED)
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `closestCenter` collision detection algorithm is not suitable for kanban-style multi-container layouts; it picks the mathematically closest droppable (card centers) instead of the target column
- **Fix Approach**: Replace `closestCenter` with `closestCorners` collision detection algorithm which is specifically designed for kanban-style stacked containers
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The kanban board's drag-and-drop functionality exhibits asymmetric behavior:
- **Dragging left** (In Progress → To Do): Works correctly
- **Dragging right** (To Do → In Progress): Card snaps back to original position

This asymmetry is caused by `closestCenter` collision detection algorithm, which the dnd-kit library explicitly warns against for kanban-style layouts. The algorithm measures distance to ALL droppables (both columns AND cards), returning the mathematically closest one, which leads to card centers being detected before column detection when dragging right.

For full details, see diagnosis issue #1105.

### Solution Approaches Considered

#### Option 1: Replace closestCenter with closestCorners ⭐ RECOMMENDED

**Description**: Switch from `closestCenter` to `closestCorners` collision detection. The dnd-kit library explicitly recommends `closestCorners` for kanban-style stacked container layouts because it favors the visually nearest container rather than mathematically closest point.

**Pros**:
- Directly follows dnd-kit library recommendation for kanban layouts
- One-line change with minimal risk
- Fixes both asymmetric drag behavior issues (#1103 and #1105 should both be resolved)
- No additional dependencies or complexity
- Immediate fix with no migration needed

**Cons**:
- None identified - this is the officially recommended approach

**Risk Assessment**: low - This is the intended use case for `closestCorners` according to dnd-kit documentation

**Complexity**: simple - Single parameter change

#### Option 2: Implement custom collision detection algorithm

**Description**: Create a custom collision detection function that explicitly targets column containers and ignores card positions during overlap detection.

**Why Not Chosen**: Over-engineered for this problem. dnd-kit already provides the correct algorithm (`closestCorners`) designed for this exact scenario. Custom implementations are harder to maintain and test.

### Selected Solution: Replace closestCenter with closestCorners

**Justification**: The dnd-kit library explicitly warns against using `closestCenter` for kanban-style layouts and recommends `closestCorners` instead. This is the officially supported solution for this exact problem. The fix is minimal (one line), low risk, and directly addresses the root cause.

**Technical Approach**:
- Import `closestCorners` from `@dnd-kit/core`
- Replace `collisionDetection={closestCenter}` with `collisionDetection={closestCorners}` in the `DndContext` component
- No changes to drop handler logic needed - the existing drop handler already correctly identifies target status

**Architecture Changes** (if any):
- None - This is a parameter change only, no architectural modifications needed

**Migration Strategy** (if needed):
- Not applicable - This is a bug fix with no data or code migration needed

## Implementation Plan

### Affected Files

- `apps/web/app/home/(user)/kanban/_components/kanban-board.tsx` - Replace collision detection algorithm (lines 4, 199)

### New Files

- None required

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update collision detection import

Update the import statement to include `closestCorners` and remove `closestCenter` if it's not used elsewhere.

- Import `closestCorners` from `@dnd-kit/core` (add to existing import on line 4)
- Keep `closestCenter` import for now (will remove in Step 2 if no other uses)

**Why this step first**: Need the new function imported before we can use it in the component

#### Step 2: Replace collision detection algorithm

Change the `DndContext` component's `collisionDetection` prop from `closestCenter` to `closestCorners` (line 199).

- Update line 199 from `collisionDetection={closestCenter}` to `collisionDetection={closestCorners}`

#### Step 3: Verify and clean up imports

Verify `closestCenter` is no longer used and remove from imports if applicable.

- Ensure no other uses of `closestCenter` in the file
- Remove `closestCenter` from imports if unused (clean code)

#### Step 4: Add/update tests

Ensure existing tests still pass and add test for the specific asymmetric behavior if not already covered.

- Run existing kanban tests to ensure nothing broke
- Manual test: Drag from To Do to In Progress (should work now)
- Manual test: Drag from In Progress to To Do (should continue working)
- Manual test: Drag onto empty column space (should work in both directions)
- Drag onto card in target column (should work - existing drag-onto-card fix from #1104)

#### Step 5: Validation

Verify the fix works and run all quality checks.

- Run all validation commands (see Validation Commands section)
- Verify zero regressions
- Test edge cases with overlapping drops
- Confirm both asymmetric behavior scenarios now work

## Testing Strategy

### Unit Tests

Existing kanban tests should continue to pass. The fix doesn't change the drop handler logic, only the collision detection algorithm.

**Tests to verify**:
- ✅ Drag from To Do to In Progress works
- ✅ Drag from In Progress to To Do works
- ✅ Drag onto another card in target column works
- ✅ Drag onto empty column space works
- ✅ Regression test: Original asymmetric behavior is fixed (right-to-left drag no longer snaps back)

### Integration Tests

No integration tests needed - this is a client-side drag-and-drop fix with no backend changes.

### E2E Tests

**Test files**:
- `apps/e2e/tests/kanban*.spec.ts` - Should include tests for drag-and-drop scenarios

**Test scenarios**:
- Drag task from To Do to In Progress (verify status updates)
- Drag task from In Progress to To Do (verify status updates)
- Drag task onto another task in different column (verify status updates)
- Verify toast/notification shows after successful drop
- Verify card updates in correct column after drop

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Navigate to `/home/kanban`
- [ ] Drag task from "To Do" column to "In Progress" column (drop on empty space)
  - Expected: Task moves to In Progress column, no snap back
- [ ] Drag task from "In Progress" column to "To Do" column (drop on empty space)
  - Expected: Task moves to To Do column
- [ ] Drag task from "To Do" onto another task in "In Progress" column
  - Expected: Task moves to In Progress column (existing behavior from #1104)
- [ ] Drag task from "In Progress" onto another task in "To Do" column
  - Expected: Task moves to To Do column (existing behavior from #1104)
- [ ] Test with multiple tasks and rapid drag operations
  - Expected: No unexpected snaps or errors
- [ ] Test keyboard navigation (if supported by dnd-kit)
  - Expected: No regressions in keyboard-based drag operations
- [ ] Verify browser console has no new errors
  - Expected: No warnings or errors related to drag-drop

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Unexpected behavior change in collision detection**: Different collision algorithm might behave differently for edge cases
   - **Likelihood**: low - `closestCorners` is officially recommended for kanban layouts
   - **Impact**: medium - Could affect drag-drop user experience
   - **Mitigation**: Thorough manual testing of all drag scenarios; `closestCorners` is proven and widely used in kanban implementations

2. **Other components using closestCenter**: If other parts of the app use `closestCenter`, removing the import could cause build failures
   - **Likelihood**: low - This is the only kanban board in the app
   - **Impact**: high - Build failure would be immediately obvious
   - **Mitigation**: Check for other uses of `closestCenter` before removing import

**Rollback Plan**:

If this fix causes issues in production:
1. Revert `collisionDetection={closestCorners}` back to `collisionDetection={closestCenter}` in `kanban-board.tsx` line 199
2. Re-import `closestCenter` if it was removed
3. Deploy rollback
4. No data loss or cleanup needed

**Monitoring** (if needed):
- Monitor for drag-drop related errors in error tracking (Sentry)
- Watch for user reports of kanban functionality issues
- No special metrics needed - this is a visual/behavioral fix

## Performance Impact

**Expected Impact**: none

- `closestCorners` has similar performance characteristics to `closestCenter`
- Both are O(n) where n = number of droppables
- No additional DOM operations or recalculations
- No bundle size impact

## Security Considerations

**Security Impact**: none

This is a collision detection algorithm change for UI drag-and-drop. No security implications.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Manual validation - bug reproduces:
# 1. Navigate to /home/kanban
# 2. Drag task from "To Do" to "In Progress" (drop on empty space)
# 3. Observe: Card snaps back to "To Do" (BUG)
# 4. Drag task from "In Progress" to "To Do" (drop on empty space)
# 5. Observe: Works correctly (ASYMMETRIC)
```

**Expected Result**: Card snaps back when dragging right (To Do → In Progress) but works when dragging left (In Progress → To Do)

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests
pnpm test:unit

# E2E tests (kanban specific)
pnpm test:e2e --grep "kanban|drag|drop"

# Build
pnpm build

# Manual verification
# 1. Navigate to /home/kanban
# 2. Drag task from "To Do" to "In Progress" (drop on empty space)
# 3. Verify: Card moves to "In Progress" (FIXED)
# 4. Drag task from "In Progress" to "To Do" (drop on empty space)
# 5. Verify: Card moves to "To Do" (still works)
```

**Expected Result**: All commands succeed, bug is resolved (symmetrical drag-drop behavior), zero regressions.

### Regression Prevention

```bash
# Run full test suite
pnpm test

# Run full E2E test suite to ensure no kanban regressions
pnpm test:e2e

# Verify no new errors in browser console
# (manual: check DevTools console while testing kanban)
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

`closestCorners` is already available in the `@dnd-kit/core` package which is already a dependency.

## Database Changes

**No database changes required**

This is a client-side UI fix with no backend data changes.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- None - This is a simple code change with no special deployment requirements

**Feature flags needed**: no

**Backwards compatibility**: maintained - No breaking changes. The fix only corrects incorrect behavior.

## Success Criteria

The fix is complete when:
- [ ] `closestCorners` imported from `@dnd-kit/core`
- [ ] `collisionDetection` prop updated to use `closestCorners`
- [ ] `closestCenter` removed from imports (if no longer used)
- [ ] All validation commands pass
- [ ] Manual testing checklist complete
- [ ] Asymmetric drag-drop behavior is fixed (both directions work equally)
- [ ] Drag onto card still works correctly (no regression from #1104 fix)
- [ ] All E2E tests pass (kanban specific)
- [ ] No new errors in browser console

## Notes

**Related Issues**:
- #1103 - Bug Diagnosis: Kanban drag-drop snap-back when dropping onto cards (related to this same root cause, may be resolved by this fix)
- #1104 - Bug Fix: Kanban drag-drop fails when dropping card onto another card (related fix for drops onto cards)

**Key Implementation Detail**:
The existing drop handler logic (lines 84-125 in `kanban-board.tsx`) already correctly identifies the target status by checking if the drop target is a column ID or a task ID. Changing the collision detection algorithm won't require changes to this logic - it will just send the correct `over.id` value because `closestCorners` will properly identify the target container.

**dnd-kit Documentation Reference**:
From dnd-kit docs: "Do not use `closestCenter` for Kanban-style stacked containers because it tends to pick the underlying column instead of the items within it." - `closestCorners` is explicitly recommended for this use case.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1105*
