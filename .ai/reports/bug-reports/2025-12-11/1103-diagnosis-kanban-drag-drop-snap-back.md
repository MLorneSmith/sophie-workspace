# Bug Diagnosis: Kanban drag and drop fails when dropping card onto another card

**ID**: ISSUE-pending
**Created**: 2025-12-11T12:00:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

When dragging a task card from one kanban column to another, if the user drops the card onto another card (rather than empty space in the column), the card snaps back to its original position instead of moving to the target column. This occurs because the drag-end handler only processes drops where `event.over.id` matches a column ID, but when dropping onto a card, `over.id` contains the target task's ID.

## Environment

- **Application Version**: dev branch (commit 1b44c860a)
- **Environment**: development (localhost)
- **Browser**: Chrome
- **Node Version**: 20.x
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Unknown (may have never worked correctly for this edge case)

## Reproduction Steps

1. Navigate to the kanban board at `/home/kanban`
2. Ensure there are task cards in both "To Do" and "In Progress" columns
3. Drag a card from the "To Do" column
4. Drop the card **directly onto another card** in the "In Progress" column (not onto empty space)
5. Observe the card snaps back to "To Do" instead of moving to "In Progress"

## Expected Behavior

When dropping a task card onto another card in a different column, the dragged card should:
1. Move to the target column
2. Update its status in the database
3. Remain in the new column position

## Actual Behavior

When dropping a task card onto another card:
1. The card animates following the cursor during drag
2. Upon release, the card snaps back to its original column
3. No database update occurs
4. No error messages appear in the console

## Diagnostic Data

### Console Output
```
No errors logged - the condition silently fails
```

### Code Analysis

**File**: `apps/web/app/home/(user)/kanban/_components/kanban-board.tsx`
**Lines**: 84-113

```typescript
const handleDragEnd = useCallback(
  async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !tasks) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    const overId = over.id as Task["status"];  // BUG: Assumes overId is always a status

    // If dragging to a column
    if (COLUMNS.some((col) => col.id === overId)) {  // BUG: This check fails when overId is a task ID
      if (activeTask && activeTask.status !== overId) {
        // ... update logic
      }
    }
    // MISSING: No else branch to handle dropping onto a task card

    setActiveId(null);
  },
  [tasks, updateStatus],
);
```

### @dnd-kit Collision Detection Behavior

The `closestCenter` collision detection algorithm treats both `useDroppable` (columns) and `useSortable` (task cards) elements equally. When a dragged item's center is closer to another task card than to the column's droppable area, `event.over.id` returns the **task ID**, not the column ID.

**Example scenarios**:
- Drop on empty column space: `over.id = "doing"` (column ID) ✅ Works
- Drop on another task card: `over.id = "uuid-of-task"` (task ID) ❌ Fails silently

## Related Code
- **Affected Files**:
  - `apps/web/app/home/(user)/kanban/_components/kanban-board.tsx` (lines 84-113)
- **Recent Changes**: No recent changes to drag-drop logic
- **Suspected Functions**: `handleDragEnd` callback

## Related Issues & Context

### Similar Symptoms
- #939 (CLOSED): "Kanban subtask checkbox hydration error" - Different issue (button nesting), but same component area

### Historical Context
This appears to be an original implementation oversight rather than a regression. The code was designed assuming users would always drop onto empty column space, not accounting for the common case of dropping onto existing cards.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `handleDragEnd` function only handles drops where `event.over.id` is a column ID ("do", "doing", "done"), ignoring the case where users drop onto another task card.

**Detailed Explanation**:
The @dnd-kit library's `closestCenter` collision detection returns whichever droppable/sortable element has its center closest to the dragged item's center. When dropping a card near another card, the target card's ID is returned rather than the column's ID.

The current code at line 94 checks:
```typescript
if (COLUMNS.some((col) => col.id === overId))
```

This check fails when `overId` is a task UUID instead of "do", "doing", or "done", causing the entire status update block to be skipped.

**Supporting Evidence**:
- Code reference: `apps/web/app/home/(user)/kanban/_components/kanban-board.tsx:94`
- The condition `COLUMNS.some((col) => col.id === overId)` returns `false` when `overId` is a task UUID
- No else branch exists to handle the alternative case
- User reports card "snaps back" which matches the behavior of no update being performed

### How This Causes the Observed Behavior

1. User drags card A from "To Do" column
2. User drops card A onto card B in "In Progress" column
3. `closestCenter` algorithm determines card B is closest to drag position
4. `event.over.id` = card B's UUID (e.g., "a1b2c3d4-...")
5. `COLUMNS.some((col) => col.id === "a1b2c3d4-...")` returns `false`
6. Status update block is never entered
7. `setActiveId(null)` is called, clearing the drag state
8. React re-renders with unchanged task data
9. Card A appears in its original "To Do" position (snap-back)

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The code path is deterministic and clearly documented
2. @dnd-kit documentation confirms collision detection behavior
3. No alternative code paths exist that could handle this case
4. The symptom (silent failure, snap-back) matches expected behavior when the condition fails

## Fix Approach (High-Level)

When `overId` is not a column ID, look up the task with that ID to find which column it belongs to, then use that column as the target status:

```typescript
// Pseudocode fix:
let targetStatus: TaskStatus;

if (COLUMNS.some((col) => col.id === overId)) {
  // Dropped directly on column
  targetStatus = overId as TaskStatus;
} else {
  // Dropped on another task - find that task's column
  const targetTask = tasks.find((t) => t.id === overId);
  if (targetTask) {
    targetStatus = targetTask.status;
  } else {
    return; // Invalid drop target
  }
}

// Then use targetStatus for the update
```

## Diagnosis Determination

The root cause has been definitively identified: the `handleDragEnd` function's condition at line 94 fails to handle the case where users drop a card onto another card instead of empty column space. This is a missing code path, not a broken implementation - the existing code works correctly for its intended scenario, but that scenario doesn't cover all user interactions.

## Additional Context

- This is likely the expected behavior from users' perspective since most kanban boards allow dropping cards anywhere in the target column
- The fix is straightforward and low-risk as it only extends existing logic without modifying it
- Related @dnd-kit documentation: https://docs.dndkit.com/api-documentation/sensors/pointer#activationconstraint

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Task (Explore agent, context7-expert), gh issue list*
