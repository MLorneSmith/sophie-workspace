# Bug Fix: Kanban drag-drop fix ineffective due to missing data property pattern

**Related Diagnosis**: #1111 (REQUIRED)
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Kanban components lack dnd-kit's `data` property pattern, making it impossible to identify target container when collision detection points to a card inside that container
- **Fix Approach**: Add `data` property to `useDroppable` and `useSortable` hooks to enable proper container identification
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The kanban drag-drop implementation uses dnd-kit's collision detection (`closestCorners`), which identifies the closest droppable element. When dragging tasks, this often points to a **task card** rather than the **column container** because cards fill the column space. Without a `data` property to distinguish between different droppable types, the code cannot determine whether the target is a column or a card, making it impossible to extract the parent column ID from a card target.

Previous attempts to fix this (transient state tracking, closestCorners collision detection) failed because they didn't address the fundamental issue: the absence of dnd-kit's standard `data` property pattern.

For full details, see diagnosis issue #1111.

### Solution Approaches Considered

#### Option 1: Add dnd-kit data property pattern ⭐ RECOMMENDED

**Description**: Implement dnd-kit's standard `data` property pattern on both columns and task cards to enable proper type identification and parent container extraction.

**Implementation**:
- Column: Add `data: { type: 'column' }` to `useDroppable`
- TaskCard: Add `data: { type: 'card', containerId: task.status }` to `useSortable`
- Drag handler: Check `over.data.current.type` and extract `containerId` from card data

**Pros**:
- Standard dnd-kit pattern used across the ecosystem
- Solves root cause (type identification + parent container extraction)
- Minimal code changes (~15 lines)
- Immediately fixes asymmetric drag behavior
- Future-proof for more complex dnd-kit features
- No performance impact
- Zero breaking changes

**Cons**:
- Requires understanding dnd-kit's data pattern (well-documented)
- Removes reliance on `activeOverId` state (minor code simplification)

**Risk Assessment**: low - Standard library pattern, no side effects, fully backward compatible

**Complexity**: simple - Straightforward property additions and conditional logic

#### Option 2: Continue with transient state approach

**Description**: Enhance the existing `activeOverId` state tracking to better handle card-to-column mapping.

**Why Not Chosen**: This approach is fundamentally limited because it only tracks what was visible during drag-over events. When a user drags quickly or at angles, they may skip over column backgrounds entirely, making the column ID state unavailable during drop. The dnd-kit `data` property is the proper solution.

#### Option 3: Replace collision detection algorithm

**Description**: Switch from `closestCorners` to a custom collision detection function that prioritizes columns over cards.

**Why Not Chosen**: This adds unnecessary complexity and performance overhead. The `data` property pattern is the standard dnd-kit approach that enables proper type differentiation at the framework level.

### Selected Solution: Add dnd-kit data property pattern

**Justification**: This is the standard dnd-kit pattern recommended by the library's architecture. It directly addresses the root cause (lack of type identification) with minimal, focused code changes. The pattern is proven across thousands of dnd-kit implementations and will serve as the foundation for any future drag-drop enhancements.

**Technical Approach**:

1. **Column component** (`column.tsx`):
   - Add `data: { type: 'column' }` to `useDroppable` hook
   - This enables identification of column targets

2. **TaskCard component** (`task-card.tsx`):
   - Add `data: { type: 'card', containerId: task.status }` to `useSortable` hook
   - This enables extraction of parent column ID from card targets

3. **KanbanBoard handler** (`kanban-board.tsx`):
   - Update `handleDragEnd` to check `over.data.current?.type`
   - If `type === 'column'`: use `over.id` directly as target status
   - If `type === 'card'`: use `over.data.current.containerId` as target status
   - Remove logic that relied on `activeOverId` for column determination (no longer needed)

**Architecture Changes**:
- None at component level - purely internal hook configuration
- Simplifies drag handler logic by removing state-based fallback logic
- Makes the data flow more explicit and type-safe

**Migration Strategy**: Not needed - this is a pure bug fix with zero breaking changes.

## Implementation Plan

### Affected Files

- `apps/web/app/home/(user)/kanban/_components/kanban-board.tsx` - Update drag handlers to use data property
- `apps/web/app/home/(user)/kanban/_components/column.tsx` - Add data property to useDroppable
- `apps/web/app/home/(user)/kanban/_components/task-card.tsx` - Add data property to useSortable

### New Files

None - this is a pure fix to existing components.

### Step-by-Step Tasks

#### Step 1: Add data property to Column component

Update the `useDroppable` hook in `column.tsx` to include the `data` property:

```typescript
const { setNodeRef } = useDroppable({
  id,
  data: { type: 'column' }  // ← ADD THIS
});
```

**Why this step first**: Column identification is the foundation for proper drop target detection. This enables the system to distinguish column targets from card targets.

- Update line 25-27 in `column.tsx`
- Add `data: { type: 'column' }` property

#### Step 2: Add data property to TaskCard component

Update the `useSortable` hook in `task-card.tsx` to include both the task identification and parent container information:

```typescript
const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
} = useSortable({
  id: task.id,
  data: { type: 'card', containerId: task.status }  // ← ADD THIS
});
```

**Why this step second**: Once columns can be identified, we need cards to carry information about their parent containers. This enables extraction of target status when a card is the collision target.

- Update line 31-38 in `task-card.tsx`
- Add `data: { type: 'card', containerId: task.status }` property

#### Step 3: Update drag handler logic in KanbanBoard

Replace the current column-detection logic with data property checks:

Current logic (lines 103-129 in `kanban-board.tsx`):
```typescript
let targetStatus: TaskStatus | null = null;
const isColumnTarget = COLUMNS.some((col) => col.id === overId);

if (isColumnTarget) {
  targetStatus = overId as TaskStatus;
} else {
  const isActiveOverColumn = COLUMNS.some(
    (col) => col.id === activeOverId,
  );

  if (activeOverId && isActiveOverColumn) {
    targetStatus = activeOverId as TaskStatus;
  } else {
    const targetTask = tasks.find((t) => t.id === overId);
    if (targetTask) {
      targetStatus = targetTask.status;
    }
  }
}
```

Replace with:
```typescript
let targetStatus: TaskStatus | null = null;
const overData = over.data.current;

if (overData?.type === 'column') {
  // Dropped directly on a column
  targetStatus = over.id as TaskStatus;
} else if (overData?.type === 'card') {
  // Dropped on a card - extract its parent column
  targetStatus = overData.containerId as TaskStatus;
}
```

**Why this step third**: With data properties in place, the drag handler can now use them to determine the target. This is more reliable and simpler than state-based logic.

- Replace lines 103-129 in `kanban-board.tsx`
- Remove the `activeOverId` check since data property now provides this information
- Simplify logic to check `over.data.current.type`

#### Step 4: Remove unused activeOverId state (cleanup)

The `activeOverId` state was added to work around the missing `data` property. With the fix in place, it's no longer needed:

- Remove `activeOverId` state initialization (line 65)
- Remove `handleDragOver` callback (lines 86-88)
- Remove `onDragOver={handleDragOver}` from DndContext (line 230)
- Remove `setActiveOverId(null)` calls from `handleDragEnd` (lines 95, 150)

**Why this step fourth**: Cleanup after the main fix to remove the workaround code. This keeps the codebase clean and maintainable.

- Update line 65 - remove `const [activeOverId, setActiveOverId] = useState<string | null>(null);`
- Remove lines 86-88 (handleDragOver function)
- Update line 230 (remove onDragOver prop)
- Remove activeOverId references from handleDragEnd

#### Step 5: Add tests to prevent regression

Create/update test file to verify:
- Dragging card to empty column works
- Dragging card to column with existing tasks works
- Multiple column targets can be identified correctly
- Drag-and-drop properly updates task status

Test file: `apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.test.tsx` (already exists)

- Add test: "should identify column as target when dragging over column background"
- Add test: "should extract column from card when dragging over task card"
- Add test: "should not update status when dropping in source column"
- Add test: "should handle rapid consecutive drags correctly"

#### Step 6: Validation and manual testing

Run all validation commands and manually test the kanban board:

- Run typecheck to ensure no type errors
- Run linter to ensure code quality
- Run format check for consistency
- Start dev server and manually test the kanban workflow
- Verify drag behavior works correctly across all columns
- Test edge cases (empty columns, single task, many tasks)

## Testing Strategy

### Unit Tests

Test the data property functionality at the component level:

- ✅ Column component renders with correct data property
- ✅ TaskCard component renders with correct data property including containerId
- ✅ Data properties are accessible during drag operations

**Test files**:
- `apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.test.tsx` - Add unit tests for drag logic

### Integration Tests

Test the complete drag-drop flow:

- ✅ Dragging task from "To Do" to "In Progress" - status updates correctly
- ✅ Dragging task from "To Do" to "Done" - status updates correctly
- ✅ Dragging within same column - no change (expected)
- ✅ Dragging to empty column - status updates correctly
- ✅ Dragging to column with many tasks - status updates correctly

### E2E Tests

Verify the user-facing drag-drop workflow works end-to-end:

- ✅ Navigate to `/home/kanban`
- ✅ Create 3+ tasks in "To Do"
- ✅ Drag task to "In Progress" column
- ✅ Verify task moves and appears in "In Progress"
- ✅ Drag task to "Done" column
- ✅ Verify task moves and appears in "Done"
- ✅ Drag task back to "To Do"
- ✅ Verify task moves back correctly
- ✅ Drag to empty column and verify it works
- ✅ Verify no snap-back behavior

**Test files**:
- Update E2E tests in `apps/e2e/tests/` to cover kanban drag-drop scenarios

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Navigate to `/home/kanban`
- [ ] Create 3+ tasks in "To Do" column
- [ ] Ensure "In Progress" has 0-1 tasks
- [ ] Drag a task card from "To Do" toward "In Progress"
- [ ] Release the card - **should move to "In Progress"** (was snapping back before)
- [ ] Verify task appears in "In Progress" list
- [ ] Drag same task from "In Progress" to "Done"
- [ ] Verify task appears in "Done" list
- [ ] Drag task back to "To Do"
- [ ] Verify task appears back in "To Do"
- [ ] Try dragging to an empty column
- [ ] Verify it moves correctly (not snapping back)
- [ ] Test with 5+ tasks in source column
- [ ] Verify all drags work smoothly without snap-back
- [ ] Check browser console for any errors or warnings
- [ ] Test on mobile/tablet if applicable
- [ ] Verify animations/transitions are smooth

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Type mismatch in drag handler**: If `over.data.current` is undefined or malformed
   - **Likelihood**: low (dnd-kit guarantees data structure)
   - **Impact**: medium (drag operation would fail)
   - **Mitigation**: Use optional chaining (`?.`) to safely access data property; add null checks

2. **Removing activeOverId breaks other logic**: State was relied upon elsewhere
   - **Likelihood**: low (only used in handleDragEnd)
   - **Impact**: low (only affects drag behavior)
   - **Mitigation**: Grep for `activeOverId` usage before removal to ensure no other references

3. **Task status string differs from column ID**: `task.status` might not match COLUMNS IDs
   - **Likelihood**: low (schema validation ensures consistency)
   - **Impact**: high (would fail to update status)
   - **Mitigation**: Verify task.schema.ts defines TaskStatus with correct values matching COLUMNS

**Rollback Plan**:

If this fix causes issues in production:

1. Revert commits that added `data` properties to useDroppable and useSortable
2. Restore the `activeOverId` state and `handleDragOver` callback
3. Revert the simplified drag handler logic back to the column detection approach
4. Verify drag-drop works with the old logic
5. Investigate the issue and create a new fix plan

**Monitoring** (if needed):
- Monitor for console errors related to drag-drop operations
- Watch error tracking for exceptions in kanban board
- Monitor user reports of drag-drop issues on feedback channels

## Performance Impact

**Expected Impact**: none

The `data` property approach has no performance implications:
- Data is stored in dnd-kit's internal structure (no additional DOM attributes)
- Drag handler logic is actually simpler (fewer conditionals)
- No additional renders or re-evaluations
- Removes the `onDragOver` callback which could have minor overhead

## Security Considerations

**Security Impact**: none

- No user input is being processed
- No data is exposed that wasn't already accessible
- The `data` property is internal to dnd-kit and not visible to users
- No authentication or authorization changes

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Navigate to kanban board
# Create 3+ tasks in "To Do" column
# Ensure "In Progress" has 0-1 tasks
# Drag a task card from "To Do" toward "In Progress"
# Release the card

# Expected: Card snaps back to "To Do" (bug present)
```

**Expected Result**: Dragged card returns to its original column (snap-back behavior indicates bug exists)

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Start dev server
pnpm dev

# Manual drag-drop test:
# Navigate to /home/kanban
# Create 3+ tasks in "To Do"
# Drag task to "In Progress"
# Release - should STAY in "In Progress" (bug fixed)
# Drag to "Done"
# Release - should STAY in "Done"
# Drag back to "To Do"
# Release - should STAY in "To Do"
```

**Expected Result**: All commands succeed, drag-drop works correctly, no snap-back behavior

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Additional regression check: ensure other dnd-kit features still work
# Test any other drag-drop features (if they exist)
# Verify no console errors in browser dev tools
```

## Dependencies

### New Dependencies

No new dependencies required - uses existing dnd-kit library.

### Existing Dependencies Used

- `@dnd-kit/core` - Already installed (v6.x)
- `@dnd-kit/sortable` - Already installed (v7.x)
- `@dnd-kit/utilities` - Already installed (v3.x)

All required packages are already in the project.

## Database Changes

**No database changes required** - This is a pure UI/interaction fix.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - this is a client-side fix with no backend implications.

**Feature flags needed**: no

**Backwards compatibility**: fully maintained - no API or data structure changes

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass (`pnpm typecheck`, `pnpm lint`, `pnpm format`)
- [ ] Drag-drop no longer exhibits snap-back behavior
- [ ] Tasks can be moved between all column combinations (To Do ↔ In Progress ↔ Done)
- [ ] Dragging to empty columns works correctly
- [ ] All existing tests pass (zero regressions)
- [ ] New regression tests added and passing
- [ ] Manual testing checklist completed successfully
- [ ] Code review approved (if applicable)
- [ ] No console errors or warnings during drag operations
- [ ] Performance is acceptable (no perceived lag)

## Notes

### Code Comments for Implementation

Add comments explaining the data pattern:

```typescript
// dnd-kit data property pattern:
// - Columns have type: 'column' to identify column drop targets
// - Cards have type: 'card' + containerId to extract parent column
// This enables proper drop target identification when collision detection
// returns a card instead of the column background.
```

### Related Commits

- #1110 (CLOSED): Attempted fix with transient state pattern
- #1108 (CLOSED): Previous diagnosis identifying architecture issue
- #1106 (CLOSED): Changed collision detection algorithm
- #1104 (CLOSED): Added card-drop handling

### dnd-kit Data Pattern References

The `data` property is a standard pattern in dnd-kit for passing metadata about draggable/droppable elements. This enables distinguishing between different droppable types and extracting contextual information.

Example from dnd-kit documentation:
```typescript
// Droppable
useDroppable({ id: 'container', data: { type: 'container' } });

// Draggable
useSortable({ id: 'item', data: { type: 'item', parentId: 'container' } });

// Handler
const overData = over.data.current;
if (overData?.type === 'container') { /* handle container */ }
```

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1111*
