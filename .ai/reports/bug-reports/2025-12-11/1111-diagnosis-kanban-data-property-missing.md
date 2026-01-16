# Bug Diagnosis: Kanban drag-drop fix ineffective due to missing data property pattern

**ID**: ISSUE-pending
**Created**: 2025-12-11T15:30:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The transient state pattern implemented in #1110 does not fix the asymmetric kanban drag-drop behavior because it tracks `over.id` during `onDragOver`, which is a **card UUID** when hovering over cards, not a **column ID**. Since cards fill the columns, users almost always hover over cards rather than column backgrounds, making the `activeOverId` state track card IDs instead of column IDs. The fix logic checks if `activeOverId` is a column ID, which it rarely is.

## Environment

- **Application Version**: 2.13.1
- **Environment**: development
- **Node Version**: 20.x
- **Database**: PostgreSQL 15
- **Last Working**: Never fully worked (issue persisted through multiple fix attempts)

## Reproduction Steps

1. Navigate to `/home/kanban`
2. Create 3+ tasks in "To Do" column
3. Ensure "In Progress" has 0-1 tasks
4. Drag a task card from "To Do" toward "In Progress"
5. Release the card

## Expected Behavior

Card should move to "In Progress" column.

## Actual Behavior

Card snaps back to "To Do" column. The asymmetric behavior persists despite the #1110 fix.

## Diagnostic Data

### Code Analysis

**Current flow in handleDragEnd (after #1110 fix):**
```typescript
// handleDragOver sets activeOverId to event.over?.id
// But event.over.id is a CARD UUID when hovering over cards!

const isActiveOverColumn = COLUMNS.some((col) => col.id === activeOverId);

// This is almost always FALSE because activeOverId is a card UUID like
// "550e8400-e29b-41d4-a716-446655440000", not "doing"

if (activeOverId && isActiveOverColumn) {
  targetStatus = activeOverId as TaskStatus;  // Never executes
} else {
  // Falls back to original broken logic
  const targetTask = tasks.find((t) => t.id === overId);
  if (targetTask) {
    targetStatus = targetTask.status;  // Gets source column status, not target
  }
}
```

**Why the fallback logic fails:**
When collision detection points to a card in the source column (due to geometric proximity), `overId` is that card's UUID, and `targetTask.status` is the **source column's status**, not the target column's status. This causes `targetStatus === activeTaskItem.status`, so no update occurs.

### Missing Pattern

The code is missing dnd-kit's `data` property pattern that enables container identification:

```typescript
// Column should have:
useDroppable({
  id: 'doing',
  data: { type: 'column' }
});

// TaskCard should have:
useSortable({
  id: task.id,
  data: { type: 'card', containerId: task.status }
});

// Then in handleDragEnd:
const overData = over.data.current;
if (overData?.type === 'column') {
  targetStatus = over.id as TaskStatus;
} else if (overData?.type === 'card') {
  targetStatus = overData.containerId as TaskStatus;  // Get parent column!
}
```

## Error Stack Traces

No errors thrown - the bug manifests as incorrect behavior (card returning to source column).

## Related Code

- **Affected Files**:
  - `apps/web/app/home/(user)/kanban/_components/kanban-board.tsx:86-154`
  - `apps/web/app/home/(user)/kanban/_components/column.tsx:25-27`
  - `apps/web/app/home/(user)/kanban/_components/task-card.tsx:31-38`
- **Recent Changes**:
  - `e5d174a81` - Added onDragOver handler (ineffective fix)
  - `4c011679a` - Changed to closestCorners (partial improvement)
  - `4168a4552` - Added card-drop handling (partial improvement)
- **Suspected Functions**:
  - `handleDragOver` - Tracks wrong ID type
  - `handleDragEnd` - Logic assumes activeOverId is column ID

## Related Issues & Context

### Direct Predecessors
- #1110 (CLOSED): "Bug Fix: Kanban drag-drop fails asymmetrically due to collision detection architecture" - Same problem, fix was ineffective
- #1108 (CLOSED): "Bug Diagnosis: Kanban drag-drop fails asymmetrically due to collision detection architecture" - Identified architecture issue but proposed wrong solution

### Same Component
- #1106 (CLOSED): "Bug Fix: Kanban drag-drop uses closestCenter collision" - Changed collision algorithm
- #1104 (CLOSED): "Bug Fix: Kanban drag-drop fails when dropping card onto another card" - Added card-drop handling
- #1103 (CLOSED): "Bug Diagnosis: Kanban drag-drop fails when dropping card onto another card" - Initial diagnosis

### Historical Context
This is the 4th attempt at fixing this issue. Previous fixes (#1104, #1106, #1110) addressed symptoms but not the root cause. The fundamental architectural gap - missing `data` properties on droppables - has persisted through all fixes.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The kanban components lack dnd-kit's `data` property pattern, making it impossible to identify the target container when collision detection points to a card inside that container.

**Detailed Explanation**:

dnd-kit's collision detection returns the geometrically closest droppable. When dragging across kanban columns:
1. `closestCorners` collision algorithm evaluates all droppables (columns AND cards)
2. Cards inside columns often have closer corners than the column background
3. `over.id` becomes a card UUID, not a column ID
4. Without the `data` property pattern, there's no way to determine which column a card belongs to during the drag operation
5. The code must search tasks array to find the card, then get its status (which is the CURRENT status, not the intended TARGET)

The #1110 fix tracked `activeOverId` during `onDragOver`, but this still receives card UUIDs (not column IDs) because cards are the closest droppables during drag-over events.

**Supporting Evidence**:
- Code at `column.tsx:25-27`: `useDroppable({ id })` - No `data` property
- Code at `task-card.tsx:38`: `useSortable({ id: task.id })` - No `data` property
- dnd-kit documentation recommends `data` property for multi-container layouts
- Research agents confirmed this is the standard pattern for kanban implementations

### How This Causes the Observed Behavior

1. User drags card from "To Do" (many cards) toward "In Progress" (few cards)
2. `onDragOver` fires with `over.id` = UUID of a card (whichever is closest)
3. `activeOverId` is set to this UUID (not a column ID)
4. User releases - `handleDragEnd` fires
5. `over.id` is another card's UUID (possibly in source column due to geometry)
6. `isColumnTarget` = false (UUID is not "do", "doing", or "done")
7. `isActiveOverColumn` = false (`activeOverId` is also a UUID, not a column ID)
8. Falls back to `tasks.find((t) => t.id === overId)` which finds a card in source column
9. `targetStatus` = source card's status = "do" (same as dragged card)
10. `activeTaskItem.status !== targetStatus` is FALSE, so no update occurs
11. Card snaps back to original position

### Confidence Level

**Confidence**: High

**Reasoning**:
- Multiple research agents confirm the `data` property pattern is the standard solution
- Code inspection confirms `data` property is missing from both Column and TaskCard
- The logic flow clearly shows why `activeOverId` receives card UUIDs
- This explains why all previous fixes were ineffective

## Fix Approach (High-Level)

The fix requires adding dnd-kit's `data` property pattern to both components:

1. **Column**: Add `data: { type: 'column' }` to `useDroppable`
2. **TaskCard**: Add `data: { type: 'card', containerId: task.status }` to `useSortable`
3. **handleDragEnd**: Check `over.data.current.type` to distinguish columns from cards, and extract `containerId` from card data when needed

This is roughly 15 lines of code changes across 3 files.

## Diagnosis Determination

The root cause is definitively identified: **missing dnd-kit `data` property pattern** that enables container identification in multi-container drag-and-drop layouts.

The #1110 fix was architecturally sound (transient state pattern) but implemented incorrectly because it tracked `over.id` directly instead of using `data` properties to identify container types. The fix needs to be revised to use the `data` property pattern.

## Additional Context

### Research Sources
- dnd-kit official documentation on multi-container patterns
- Research report: `.ai/reports/research-reports/2025-12-11/context7-dndkit-kanban-container-detection.md`
- Research report: `.ai/reports/research-reports/2025-12-11/perplexity-dndkit-container-identification-solutions.md`

### Why Previous Fixes Failed
1. **#1104**: Added card-drop handling but still couldn't identify target container
2. **#1106**: Changed collision detection but cards are still closest droppables
3. **#1110**: Added state tracking but tracked wrong values (card UUIDs vs column IDs)

---
*Generated by Claude Debug Assistant*
*Tools Used: git log, gh issue list, code reading, Task (context7-expert, perplexity-expert)*
