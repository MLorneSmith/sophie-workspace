# Bug Fix: Kanban drag-drop fails due to incorrect SortableContext items format

**Related Diagnosis**: #1113 (REQUIRED)
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `SortableContext items={tasks}` passes full task objects instead of ID array, violating dnd-kit API contract
- **Fix Approach**: Change `items={tasks}` to `items={tasks.map(t => t.id)}` and remove debug logging
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The kanban board's drag-drop functionality continues to fail with cards snapping back to their source column after release. The root cause is that the `SortableContext` component in the Column component receives an array of full task objects instead of an array of task IDs, which violates the dnd-kit API contract. This causes ID matching failures that break the `over.data.current` property attachment, resulting in `targetStatus` remaining null and the drag operation being rejected.

For full details, see diagnosis issue #1113.

### Solution Approaches Considered

#### Option 1: Fix items prop to use ID array ⭐ RECOMMENDED

**Description**: Change line 53 in `column.tsx` to pass `tasks.map(t => t.id)` instead of the full `tasks` array to `SortableContext`.

**Pros**:
- Minimal change - one line fix
- Matches dnd-kit API contract exactly as documented
- Follows the working pattern already used in `sortable-slide-list.tsx` (same codebase)
- No architectural changes or refactoring needed
- Immediately fixes the drag-drop snap-back behavior

**Cons**:
- None identified - this is the correct fix

**Risk Assessment**: low - This is a straightforward API usage correction with no side effects.

**Complexity**: simple - Single line change, no logic changes.

#### Option 2: Add useSortable to individual task cards

**Description**: Instead of using `SortableContext` at the column level, add `useSortable` hooks to individual TaskCard components for more granular control.

**Why Not Chosen**: Overengineering. The current architecture using `SortableContext` with column droppables is correct. The only issue is the items format. Refactoring to use `useSortable` on each card would introduce unnecessary complexity and risk of new bugs.

#### Option 3: Create a custom wrapper around SortableContext

**Description**: Wrap `SortableContext` in a custom component that handles ID extraction internally.

**Why Not Chosen**: Adds unnecessary abstraction. The fix is already trivial with a simple `.map()` call.

### Selected Solution: Fix items prop to use ID array

**Justification**: This is the correct fix according to the dnd-kit API documentation. The `items` prop must be an array of identifiers, not objects. The codebase already demonstrates this pattern correctly in `sortable-slide-list.tsx` (line 93). Implementing this one-line fix addresses the root cause directly without introducing any risk or complexity.

**Technical Approach**:
- Extract IDs from task objects using `.map(t => t.id)` before passing to `SortableContext`
- Remove the debug logging from `kanban-board.tsx` (lines 88-95, 112-117, 127-132) that was added during investigation
- Verify the fix works with manual testing

**Architecture Changes** (if any):
- None - this is an API usage correction, not an architectural change

**Migration Strategy** (if needed):
- Not needed - this is a bug fix with no data or API changes

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/web/app/home/(user)/kanban/_components/column.tsx:53` - Fix SortableContext items prop to use ID array instead of full objects
- `apps/web/app/home/(user)/kanban/_components/kanban-board.tsx:88-132` - Remove debug logging that was added during investigation

### New Files

No new files required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Fix the SortableContext items prop

<describe what this step accomplishes>

This step corrects the fundamental issue causing drag-drop failures by ensuring the `SortableContext` component receives the correct data format (array of IDs instead of objects).

- Edit `column.tsx` line 53
- Change `<SortableContext items={tasks}` to `<SortableContext items={tasks.map(t => t.id)}`
- Verify the change is syntactically correct

**Why this step first**: This is the root cause fix. Addressing it first ensures the drag-drop mechanism will work correctly.

#### Step 2: Remove debug logging

<describe what this step accomplishes>

Clean up the temporary debug logging that was added to `kanban-board.tsx` during the investigation phase.

- Remove console.log statements from `kanban-board.tsx` lines 88-95 (drag event logging)
- Remove console.log statements from lines 112-117 (type check logging)
- Remove console.log statements from lines 127-132 (target calculation logging)
- Keep the logger wrapper structure as it may be useful for future debugging

**Why after the fix**: Logging cleanup should happen after the fix to ensure the fix is working correctly without debug output.

#### Step 3: Add/update tests

<describe the testing strategy>

Add tests to prevent regression of this specific bug.

- Add unit test for Column component that verifies SortableContext receives ID array (not objects)
- Add E2E test that verifies drag-drop works end-to-end (card moves to different column and stays there)
- Add regression test that specifically tests dragging from "To Do" to "In Progress" column
- Verify all existing tests still pass

**Test files**:
- `apps/web/app/home/(user)/kanban/_components/column.spec.ts` - Test column component prop validation
- `apps/e2e/tests/kanban-drag-drop.spec.ts` - E2E test for drag-drop functionality

#### Step 4: Validation

- Run all validation commands (see Validation Commands section)
- Verify zero regressions
- Test all drag-drop scenarios
- Confirm bug is fixed and cards no longer snap back

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ SortableContext receives array of IDs (not objects)
- ✅ Column component renders with correct props
- ✅ Tasks are correctly filtered by status
- ✅ Loader shows when updating task status
- ✅ Task count displays correctly

**Test files**:
- `apps/web/app/home/(user)/kanban/_components/__tests__/column.spec.ts` - Column component unit tests

### Integration Tests

<if needed, describe integration test scenarios>

Not needed for this fix - it's an API usage correction with no integration complexity.

### E2E Tests

<if UI or critical user journey affected>

**Test files**:
- `apps/e2e/tests/kanban-drag-drop.spec.ts` - End-to-end drag-drop functionality:
  - Verify card can be dragged from "To Do" to "In Progress"
  - Verify card can be dragged from any column to any other column
  - Verify card remains in target column after drop (doesn't snap back)
  - Verify task status is updated in database
  - Verify UI reflects the status change immediately

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Navigate to `/home/kanban`
- [ ] Create 3+ tasks in "To Do" column (using + button)
- [ ] Create 0-1 tasks in "In Progress" column
- [ ] Drag a task card from "To Do" column
- [ ] Release it over the "In Progress" column
- [ ] **Verify**: Card moves to "In Progress" and stays there (doesn't snap back)
- [ ] Verify task status changed in database (check with browser DevTools Network tab)
- [ ] Repeat with dragging from "In Progress" to "Done"
- [ ] Repeat with dragging from "Done" back to "To Do"
- [ ] Verify no console errors appear
- [ ] Verify no new browser console errors

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Breaking change to drag-drop logic**: <description>
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: The dnd-kit documentation explicitly requires ID arrays for the items prop. This fix makes the code compliant with the API contract.

2. **Performance impact from using .map()**: <description>
   - **Likelihood**: very low
   - **Impact**: negligible - mapping 100 tasks is trivial
   - **Mitigation**: Performance is not a concern for this data volume. If it becomes an issue, could memoize with useMemo.

3. **Existing code depending on SortableContext items being objects**: <description>
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: Search codebase for other uses of SortableContext - the working example in `sortable-slide-list.tsx` shows items should always be IDs.

**Rollback Plan**:

If this fix causes issues in production (which is unlikely):
1. Revert the change to line 53 in `column.tsx` (restore `items={tasks}`)
2. Restore the debug logging if needed for investigation
3. The bug will return, but the application will still function

**Monitoring** (if needed):
- Monitor browser console for drag-drop related errors
- Watch for task update failures during drag-drop operations
- Check database logs for task status update failures

## Performance Impact

**Expected Impact**: none

The change uses `.map()` to extract IDs from the tasks array. For typical kanban boards with 20-100 tasks per column, this is negligible overhead and will be optimized by the JavaScript engine.

**Performance Testing**:
- Verify drag-drop feels responsive (no lag)
- Verify no unnecessary re-renders (use React DevTools)
- Monitor CPU usage during drag operations

## Security Considerations

No security implications. This is an internal API usage fix with no user input validation or data access changes.

**Security Impact**: none

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Commands to reproduce the bug before applying fix
# 1. Start the development server
pnpm dev

# 2. Navigate to http://localhost:3000/home/kanban
# 3. In browser DevTools Console, observe the debug logs:
#    - "[DragEnd] Event" shows activeId and overId
#    - "[DragEnd] Type check" shows overData?.type as undefined
#    - "[DragEnd] Target calculation" shows targetStatus as null (BUG!)

# 4. Manually drag a card from "To Do" to "In Progress"
# 5. Release the card - it should snap back to "To Do" (BUG CONFIRMED)
```

**Expected Result**: Debug logs show `overData?.type` as undefined and `targetStatus` as null, card snaps back after drag.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests (if added)
pnpm test:unit apps/web/app/home/\(user\)/kanban

# E2E tests
pnpm test:e2e -- kanban-drag-drop

# Build
pnpm build

# Manual verification
# 1. Drag a card from "To Do" to "In Progress"
# 2. Release - card should STAY in "In Progress" (BUG FIXED!)
# 3. Refresh page - card should still be in "In Progress" (confirms DB update)
```

**Expected Result**: All commands succeed, bug is resolved, zero regressions, card stays in target column.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Additional regression checks
# 1. Verify drag-drop works in both directions (To Do ↔ In Progress ↔ Done)
# 2. Verify drag-drop works with single card in column
# 3. Verify drag-drop works with many cards (20+) in columns
# 4. Verify no console errors appear during drag operations
# 5. Verify page refresh maintains correct task status
```

## Dependencies

No new dependencies required.

**No new dependencies required**

## Database Changes

**No database changes required** - This is a frontend bug fix that corrects API usage without changing data structures or operations.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- None - standard deployment process

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [ ] Line 53 in `column.tsx` changed from `items={tasks}` to `items={tasks.map(t => t.id)}`
- [ ] Debug logging removed from `kanban-board.tsx`
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm format` passes
- [ ] Manual drag-drop test succeeds (card stays in target column)
- [ ] E2E tests pass (if added)
- [ ] Unit tests pass (if added)
- [ ] Zero regressions detected
- [ ] Code review approved

## Notes

This bug is the result of a cascading series of attempts to fix drag-drop issues. Previous fixes addressed symptoms (collision detection, data property pattern, transient state) but missed the fundamental issue: the `SortableContext` items prop format violation.

The diagnosis process correctly identified this root cause by comparing against the working `sortable-slide-list.tsx` implementation in the same codebase.

**Related Issues**:
- #1112: Added data property pattern (correct but insufficient)
- #1110: Added transient state pattern
- #1106: Changed to closestCorners collision
- #1104: Added card-drop handling

**dnd-kit Documentation**:
- [SortableContext API](https://docs.dndkit.com/presets/sortable/sortable-context)
- Items must be an array of identifiers, not objects
- IDs are matched against `useSortable({ id })` hooks and `useDroppable({ id })` calls

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1113*
