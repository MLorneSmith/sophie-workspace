# Bug Diagnosis: Kanban drag-drop uses closestCenter collision detection which fails for multi-container kanban

**ID**: ISSUE-1105
**Created**: 2025-12-11T00:00:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The kanban board's drag-and-drop functionality exhibits asymmetric behavior where dragging from "To Do" to "In Progress" fails (card snaps back), but dragging from "In Progress" to "To Do" works. This is caused by using `closestCenter` collision detection, which the dnd-kit documentation explicitly warns against for kanban-style stacked container layouts.

## Environment

- **Application Version**: 2.13.1
- **Environment**: development
- **Browser**: All browsers (collision detection is library-level)
- **Node Version**: Current
- **Database**: N/A (frontend issue)
- **Last Working**: Never worked - inherent architecture issue

## Reproduction Steps

1. Navigate to `/home/kanban`
2. Create or have tasks in the "To Do" column
3. Drag a task card from "To Do" toward "In Progress" column
4. Drop onto empty column space in "In Progress"
5. Observe: Card snaps back to "To Do"
6. Now drag a task from "In Progress" to "To Do"
7. Observe: Drop works correctly

## Expected Behavior

Dropping a task card onto any column (empty space or onto cards) should move the task to that column in either direction.

## Actual Behavior

- Dragging To Do → In Progress: **FAILS** (card snaps back)
- Dragging In Progress → To Do: **WORKS**
- Dragging via Edit dialog status field: **WORKS**

## Diagnostic Data

### Code Analysis
```typescript
// kanban-board.tsx:199 - Using closestCenter collision detection
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}  // ← ROOT CAUSE
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
>
```

### dnd-kit Documentation Warning
```
Official documentation explicitly states:
"Do not use closestCenter for Kanban-style stacked containers because it tends
to pick the underlying column instead of the items within it."
```

### Collision Detection Behavior
```
closestCenter measures distance to ALL droppables:
- Column droppables (useDroppable in Column component)
- Card droppables (useSortable in TaskCard component)

When dragging right (To Do → In Progress):
- The pointer may be closer to a card's center than to the column's center
- closestCenter returns the card ID, not the column ID
- handleDragEnd only recognizes column IDs or task IDs
- If collision lands on a task in a different column, it SHOULD work with the recent fix
- BUT if collision lands on no valid target, drop fails

The asymmetry occurs because:
- Column centers are positioned differently relative to drag paths
- Dragging left might naturally pass closer to column centers
- Dragging right passes through card centers first
```

## Error Stack Traces
```
No errors thrown - the collision detection simply returns an ID that doesn't
result in a status change (same column or invalid target).
```

## Related Code
- **Affected Files**:
  - `apps/web/app/home/(user)/kanban/_components/kanban-board.tsx` (line 199)
  - `apps/web/app/home/(user)/kanban/_components/column.tsx` (lines 25-27)
  - `apps/web/app/home/(user)/kanban/_components/task-card.tsx` (lines 31-38)
- **Recent Changes**:
  - `4168a4552` - Added handling for drops onto task cards (partial fix)
- **Suspected Functions**:
  - `collisionDetection={closestCenter}` in DndContext

## Related Issues & Context

### Direct Predecessors
- #1103 (CLOSED): "Bug Diagnosis: Kanban drag-drop snap-back when dropping onto cards" - Addressed dropping onto cards but not the underlying collision algorithm issue
- #1104 (CLOSED): "Bug Fix: Kanban drag-drop fails when dropping card onto another card" - Implementation of partial fix

### Same Component
- #1103, #1104 affect the same kanban board component

### Historical Context
The previous fix (#1104) addressed one symptom (drops onto cards) but the root cause is the collision detection algorithm itself. The official dnd-kit documentation explicitly recommends against using `closestCenter` for kanban boards.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The kanban board uses `closestCenter` collision detection, which the dnd-kit documentation explicitly warns against for kanban-style stacked containers.

**Detailed Explanation**:
The `closestCenter` algorithm measures distance from the active draggable's center to the center of ALL droppables in the DndContext - both column droppables (from `useDroppable`) and card droppables (from `useSortable`).

In the kanban layout:
1. Columns are wide but their centers are positioned in specific locations
2. Cards inside columns have their own centers distributed vertically
3. When dragging from left to right, the drag path crosses through card centers before reaching the column center
4. `closestCenter` returns whichever center is mathematically closest, which may not be the intended drop target

This creates asymmetric behavior:
- Dragging left (In Progress → To Do): The column center of "To Do" may be encountered before card centers
- Dragging right (To Do → In Progress): Card centers in "In Progress" are encountered first

**Supporting Evidence**:
- dnd-kit documentation explicitly states: "Do not use `closestCenter` for Kanban-style stacked containers"
- Research report confirms `closestCorners` is the recommended algorithm for kanban boards
- Code at `kanban-board.tsx:199` shows `collisionDetection={closestCenter}`
- Asymmetric behavior matches documented collision detection behavior

### How This Causes the Observed Behavior

1. User drags task from "To Do" toward "In Progress"
2. `closestCenter` algorithm evaluates all droppables
3. During drag, a card in "In Progress" or even a card in "To Do" may be mathematically closer
4. On drop, `event.over.id` contains an unexpected ID (wrong task or column)
5. The `handleDragEnd` function may:
   - Find a task with the same status (no-op)
   - Find no valid target (early return)
6. Card appears to "snap back" because no status update occurred

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The dnd-kit documentation explicitly warns against this exact configuration
2. The reported behavior (asymmetric drops) matches the documented behavior of `closestCenter`
3. Research confirms `closestCorners` is the standard solution
4. The code clearly shows `closestCenter` being used at line 199

## Fix Approach (High-Level)

Replace `closestCenter` with `closestCorners` collision detection algorithm:

```typescript
import { closestCorners } from "@dnd-kit/core";

// In the return statement:
<DndContext
  sensors={sensors}
  collisionDetection={closestCorners}  // Changed from closestCenter
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
>
```

This is a one-line change. The `closestCorners` algorithm is specifically designed for kanban-style layouts where you want to favor the visually nearest container rather than mathematical center distances.

## Diagnosis Determination

The root cause is definitively identified: incorrect collision detection algorithm choice. The fix is straightforward - changing from `closestCenter` to `closestCorners`. This is explicitly recommended in dnd-kit documentation for kanban boards.

## Additional Context

The previous fix (#1104) addressed a related but different issue - it handled the case where drops land on task cards. This diagnosis addresses WHY drops don't reach the intended targets in the first place. Both fixes are needed for complete functionality:

1. **#1104 fix**: When collision lands on a task card, look up that task's column
2. **This fix**: Use correct collision algorithm so drops reach intended targets

---
*Generated by Claude Debug Assistant*
*Tools Used: Read (kanban-board.tsx, column.tsx, task-card.tsx), Task (perplexity-expert research), AskUserQuestion, gh issue list, git log*
