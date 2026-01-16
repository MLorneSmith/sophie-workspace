# Bug Diagnosis: Kanban drag-drop still fails despite #1114 fix - missing fallback for undefined over.data.current

**ID**: ISSUE-pending
**Created**: 2025-12-12T20:15:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: regression

## Summary

Despite implementing the fix in issue #1114 (passing ID array to SortableContext), the kanban drag-drop continues to fail with cards snapping back to their source column when dropped directly on the column background. The root cause is that the `handleDragEnd` function relies exclusively on `over.data.current` to determine the target column, but this property can be `undefined` when the `closestCorners` collision detection returns an element that isn't the column's droppable node or a sortable card.

## Environment

- **Application Version**: dev branch (commit d573fec3a)
- **Environment**: development
- **Node Version**: 22.x
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Never worked consistently for column drops

## Reproduction Steps

1. Navigate to `/home/kanban`
2. Ensure there are 3+ tasks in the "To Do" column
3. Ensure "In Progress" column has at least 1-2 cards
4. Drag a task card from "To Do" toward the "In Progress" column
5. Drop the card directly on the column background (not on another card)
6. Observe that the card snaps back to "To Do"

## Expected Behavior

Card should move to the "In Progress" column and persist there.

## Actual Behavior

Card visually moves during drag but snaps back to the "To Do" column on release. No error messages in console. The mutation is never triggered.

## Diagnostic Data

### Code Analysis

The `handleDragEnd` function in `kanban-board.tsx` (lines 84-133) has a logic gap:

```typescript
// Lines 97-109
let targetStatus: TaskStatus | null = null;
const overData = over.data.current as
  | { type: "column" }
  | { type: "card"; containerId: TaskStatus }
  | undefined;

if (overData?.type === "column") {
  // Dropped on a column directly
  targetStatus = over.id as TaskStatus;
} else if (overData?.type === "card") {
  // Dropped on a card - use the card's parent container
  targetStatus = overData.containerId;
}
// BUG: No fallback when overData is undefined!
// targetStatus stays null, and nothing happens
```

### Why over.data.current is undefined

According to dnd-kit documentation and behavior:
1. `over.data.current` is only populated when the `over` element was registered with a `data` property
2. The `closestCorners` collision detection algorithm may return:
   - The column's droppable node (has `data: { type: "column" }`) ✓
   - A sortable card node (has `data: { type: "card", containerId }`) ✓
   - An internal SortableContext droppable region (has NO `data`) ✗
   - A collision point that isn't either (has NO `data`) ✗
3. When dropping on the column background but near existing cards, the algorithm may detect collision with SortableContext's internal coordinate space rather than the column's useDroppable node

### Research Evidence

From dnd-kit best practices documentation:
- "Don't rely on `over.data.current` - it's optional metadata"
- "Use `over.id` and look up which column contains that card ID in your state"
- "The data model is your source of truth, not the `data` property"

The recommended pattern for multi-container kanban:
```typescript
function onDragEnd({ active, over }: DragEndEvent) {
  if (!over) return;

  const overId = over.id;

  // Check if overId is a column ID directly
  if (isColumnId(overId)) {
    targetColumnId = overId;
  } else {
    // Find which column contains the overId (card)
    targetColumnId = columns.find((col) =>
      col.cardIds.includes(overId)
    )?.id;
  }
}
```

## Related Code

- **Affected Files**:
  - `apps/web/app/home/(user)/kanban/_components/kanban-board.tsx:97-109`
- **Recent Changes**:
  - d573fec3a - fix(canvas): pass ID array to SortableContext instead of task objects
  - 0ce9aff49 - fix(canvas): implement dnd-kit data property pattern for kanban drag-drop
- **Suspected Functions**: `handleDragEnd` callback

## Related Issues & Context

### Direct Predecessors
- #1114 (CLOSED): "Bug Fix: Kanban drag-drop fails due to incorrect SortableContext items format" - Fixed items array format but didn't address the over.data.current fallback
- #1113 (CLOSED): "Bug Diagnosis: Kanban drag-drop fails due to incorrect SortableContext items format" - Diagnosed the items format issue
- #1112: "fix(canvas): implement dnd-kit data property pattern" - Added data properties but no fallback
- #1110: "fix(canvas): implement transient state pattern"
- #1106: "fix(canvas): Changed to closestCorners collision"
- #1104: "fix(canvas): Added card-drop handling"

### Historical Context

This is the **7th attempt** to fix kanban drag-drop. Previous fixes addressed:
1. Collision detection algorithm
2. Card-to-card drop handling
3. Transient state pattern
4. Data property pattern
5. Items array format

All previous fixes assumed `over.data.current` would always be populated, but this is not guaranteed by dnd-kit's architecture.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `handleDragEnd` function has no fallback when `over.data.current` is `undefined`, causing `targetStatus` to remain `null` and the drag-drop to be silently ignored.

**Detailed Explanation**:

The code at `kanban-board.tsx:103-109` checks `overData?.type` which uses optional chaining. When `overData` is `undefined`:
- Line 103: `overData?.type === "column"` evaluates to `false` (undefined !== "column")
- Line 106: `overData?.type === "card"` evaluates to `false` (undefined !== "card")
- Neither branch executes
- `targetStatus` stays `null`
- Line 112-116 condition fails (`targetStatus && ...` is falsy)
- No mutation is triggered
- Card snaps back to original position

**Supporting Evidence**:
1. The code explicitly handles only two cases: `type === "column"` and `type === "card"`
2. No `else` clause or fallback for when `overData` is `undefined`
3. dnd-kit documentation confirms `over.data.current` is optional and may be undefined
4. Research shows the recommended pattern uses `over.id` as the primary identifier, not `over.data.current`

### How This Causes the Observed Behavior

1. User drags card toward column
2. `closestCorners` detects collision with column area
3. `onDragEnd` fires with `over.id` = "doing" (column ID)
4. BUT `over.data.current` is `undefined` because:
   - Collision was detected with SortableContext's internal droppable, not the column's useDroppable
   - Or dnd-kit's coordinate calculations returned a different element
5. Both `if` conditions fail (neither "column" nor "card" type)
6. `targetStatus` stays `null`
7. Update condition fails (line 112: `targetStatus &&`)
8. No mutation triggered
9. React state unchanged
10. Card renders back in original position

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The code path is clear - no fallback exists
2. dnd-kit documentation confirms this is a known pattern issue
3. The working `sortable-slide-list.tsx` in the same codebase uses `over.id` directly without relying on `over.data.current`
4. Multiple research sources confirm `over.data.current` is optional metadata, not a reliable identifier

## Fix Approach (High-Level)

Add a fallback to check if `over.id` is a valid column ID when `over.data.current` is undefined:

```typescript
const COLUMN_IDS = ["do", "doing", "done"] as const;

// After the existing type checks, add:
if (!targetStatus && COLUMN_IDS.includes(over.id as TaskStatus)) {
  // Fallback: over.id is the column ID directly
  targetStatus = over.id as TaskStatus;
}
```

Alternatively, restructure to use `over.id` as the primary identifier:
1. If `over.id` is a column ID, use it directly
2. If `over.id` is a card ID, find which column contains that card
3. Use `over.data.current` only as supplementary information

## Diagnosis Determination

The root cause has been identified with high confidence. The `handleDragEnd` function fails to handle the case where `over.data.current` is `undefined`, which occurs when dropping on the column background due to how `closestCorners` collision detection interacts with nested droppable regions.

## Additional Context

- The fix in #1114 was necessary (correcting items array format) but insufficient
- The data property pattern added in #1112 was correct but incomplete
- A robust solution should not rely solely on `over.data.current` being populated

---
*Generated by Claude Debug Assistant*
*Tools Used: gh issue view, git log, git show, Read, Grep, Task (context7-expert, perplexity-expert), frontend-debugging skill*
