# Bug Diagnosis: Kanban drag-drop fails asymmetrically due to collision detection architecture

**ID**: ISSUE-pending
**Created**: 2025-12-11T17:00:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The kanban board's drag-and-drop functionality exhibits asymmetric behavior: dragging from "To Do" to "In Progress" fails (card snaps back), while dragging from "In Progress" to "To Do" succeeds. This persists even after changing from `closestCenter` to `closestCorners` collision detection. The root cause is an architectural flaw in how the dnd-kit collision detection interacts with `useSortable` cards acting as droppables.

## Environment

- **Application Version**: dev branch (commit 4c011679a)
- **Environment**: development
- **Browser**: Chrome
- **Node Version**: 22.x
- **Database**: PostgreSQL 15
- **Last Working**: Unknown - may have always had this issue

## Reproduction Steps

1. Navigate to `/home/kanban`
2. Ensure "To Do" column has 3+ task cards
3. Ensure "In Progress" column has 0-1 task cards
4. Drag a card from "To Do" toward "In Progress"
5. Drop the card in the "In Progress" column area
6. **Observe**: Card snaps back to "To Do"
7. Now drag a card from "In Progress" to "To Do"
8. **Observe**: Card successfully moves

## Expected Behavior

Cards should move to the target column regardless of which direction they're dragged.

## Actual Behavior

Cards snap back to their original column when dragging from a column with more items to a column with fewer items.

## Diagnostic Data

### Code Analysis

**kanban-board.tsx:84-125** - handleDragEnd logic:
```typescript
const handleDragEnd = useCallback(
  async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !tasks) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    const overId = over.id as string;

    let targetStatus: TaskStatus | null = null;
    if (COLUMNS.some((col) => col.id === overId)) {
      targetStatus = overId as TaskStatus;
    } else {
      const targetTask = tasks.find((t) => t.id === overId);
      if (targetTask) {
        targetStatus = targetTask.status;
      }
    }

    // Only updates if targetStatus !== activeTask.status
    if (targetStatus && activeTask && activeTask.status !== targetStatus) {
      // ... update logic
    }
  },
  [tasks, updateStatus],
);
```

**column.tsx:25-27** - useDroppable without data prop:
```typescript
const { setNodeRef } = useDroppable({
  id, // just "do", "doing", or "done"
});
```

**task-card.tsx:31-38** - useSortable without data prop:
```typescript
const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
} = useSortable({ id: task.id });
```

### Architecture Issues

1. **No `data` prop on droppables**: Neither `useDroppable` (columns) nor `useSortable` (cards) include a `data` prop to distinguish types
2. **No `onDragOver` handler**: The board only uses `onDragEnd`, not tracking active container during drag
3. **Cards are both draggable AND droppable**: Each `useSortable` card registers as a droppable target
4. **ID-based type detection**: The code guesses whether `over.id` is a column or card by checking against `COLUMNS` array

## Error Stack Traces

No JavaScript errors occur. The bug is silent - the condition at line 108 simply evaluates to `false`.

## Related Code

- **Affected Files**:
  - `apps/web/app/home/(user)/kanban/_components/kanban-board.tsx`
  - `apps/web/app/home/(user)/kanban/_components/column.tsx`
  - `apps/web/app/home/(user)/kanban/_components/task-card.tsx`
- **Recent Changes**:
  - 4c011679a: Changed closestCenter to closestCorners (didn't fix issue)
  - 4168a4552: Added card-drop handling (partial fix)
- **Suspected Functions**:
  - `handleDragEnd` collision target resolution
  - Missing `onDragOver` for container tracking

## Related Issues & Context

### Direct Predecessors
- #1106 (CLOSED): "Bug Fix: Kanban drag-drop uses closestCenter collision" - Changed collision detection but didn't resolve the core issue
- #1105 (CLOSED): Diagnosis for #1106

### Same Component
- #1104 (CLOSED): "Bug Fix: Kanban drag-drop fails when dropping card onto another card" - Fixed card-drop detection but didn't address collision detection architecture
- #1103 (CLOSED): Diagnosis for #1104

### Historical Context

Multiple iterations have attempted to fix kanban drag-drop issues:
1. Issue #1103/#1104: Fixed handling drops onto cards (not just columns)
2. Issue #1105/#1106: Changed collision detection algorithm

Neither addressed the fundamental architecture: **collision detection selecting wrong targets when columns have different item counts**.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The collision detection algorithm selects droppable targets based on geometric proximity, but cards act as droppables via `useSortable`. When dragging from a column with many cards to one with fewer, a card in the SOURCE column is often geometrically closer than the TARGET column, causing no status change.

**Detailed Explanation**:

When a card is dragged from "To Do" (many items) toward "In Progress" (few items):

1. **Drag starts**: `active.id` = source card UUID
2. **During drag**: The collision detection evaluates ALL droppables:
   - 3 column droppables: "do", "doing", "done"
   - N card droppables: one per card (each `useSortable` creates a droppable)
3. **Collision selects closest**: `closestCorners` picks the nearest droppable by corner distance
4. **Cards in source column win**: The "To Do" column has more cards = more droppable surfaces. As the user drags away from their card, another card in "To Do" becomes the closest droppable
5. **over.id is source-column card**: The selected target is a task UUID from "To Do"
6. **Logic finds same status**: `targetTask.status === "do"`, same as `activeTask.status`
7. **No update**: The condition `activeTask.status !== targetStatus` is `false`
8. **Visual snap-back**: dnd-kit animates the card back since no state changed

**Supporting Evidence**:
- The issue is asymmetric (one direction fails, other succeeds)
- Behavior correlates with relative item counts between columns
- The handleDragEnd logic is correct IF `over.id` points to correct target
- Research confirms this is a known dnd-kit pattern issue (see perplexity research report)

### How This Causes the Observed Behavior

The collision detection's geometric selection doesn't account for drag **intent**. When dragging rightward toward "In Progress", the algorithm doesn't know that's the user's intended target. It simply picks the closest droppable, which may be a card in the source column due to higher droppable density.

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The research explicitly confirms this is a common dnd-kit pattern issue
2. The asymmetric behavior (more items → fewer items fails) matches the hypothesis
3. The code analysis shows no mechanism to track intended container during drag
4. No `data` props exist to distinguish droppable types for smarter collision handling

## Fix Approach (High-Level)

The fix requires implementing the **transient state pattern** recommended by dnd-kit for multi-container layouts:

1. **Add `data` props** to all droppables (columns AND cards) with `type: 'column'` or `type: 'card'` and `columnId`
2. **Implement `onDragOver`** to track which container the drag is currently over (not just at drop time)
3. **Use container-aware collision detection** that prioritizes containers over items when crossing boundaries
4. **Consider using `rectIntersection`** collision detection which checks for actual overlap rather than nearest distance

Alternative simpler fix: Implement custom collision detection that excludes cards from different columns than the current hover column.

## Diagnosis Determination

The root cause is confirmed: dnd-kit's collision detection selecting cards in the source column as drop targets when they are geometrically closer than the target column. This is a known architectural pattern issue, not a bug in dnd-kit itself.

The fix requires restructuring the drag-and-drop architecture to track active containers during drag, not just at drop time.

## Additional Context

### Research Report
Full dnd-kit kanban research: `.ai/reports/research-reports/2025-12-11/perplexity-dndkit-kanban-snap-back-solutions.md`

### Key Implementation Requirements (from research)

1. Add `data` prop to all droppables:
```tsx
// Column
const { setNodeRef } = useDroppable({
  id: columnId,
  data: { type: 'column', columnId }
});

// Card
const { ... } = useSortable({
  id: task.id,
  data: { type: 'card', columnId: task.status }
});
```

2. Implement onDragOver to track active container
3. Use transient state pattern (activeDrag) during drag
4. Consider pointerWithin or rectIntersection collision detection

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Task (context7-expert, perplexity-expert), Bash (gh issue list/view)*
