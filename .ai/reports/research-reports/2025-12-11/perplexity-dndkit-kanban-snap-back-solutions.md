# Perplexity Research: dnd-kit Kanban Snap-Back Solutions

**Date**: 2025-12-11
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API

## Query Summary

Searched for recent (2024-2025) solutions to dnd-kit kanban drag-drop failures, specifically:
- Cards snapping back when dragging between columns
- Asymmetric drag behavior (works one direction but not the other)
- Collision detection issues with multi-container layouts
- closestCorners vs closestCenter vs rectIntersection for kanban

## Key Findings

### Root Cause of Snap-Back Behavior

The snap-back issue is **almost always caused by improper state management in `onDragEnd`**, NOT a bug in dnd-kit itself. When state is not updated correctly, dnd-kit animates items back to their original positions because the rendered list never changed.

### Critical Requirements for Working Kanban

#### 1. Use closestCorners for Multi-Container Layouts

**IMPORTANT**: Use `closestCorners` instead of `closestCenter` for kanban boards.

- **closestCenter**: Picks droppable whose center is nearest. Works well for simple lists but can incorrectly choose the column container instead of specific cards in stacked layouts.
- **closestCorners**: Compares all four corners of draggable vs all droppables. Specifically recommended for kanban-style UIs where droppable containers are stacked.

```tsx
<DndContext collisionDetection={closestCorners}>
  {/* Columns and cards */}
</DndContext>
```

#### 2. Provide data to All Droppables

**Critical**: Each droppable must have a `data` object, otherwise `over.data.current` will be `null` in `onDragEnd`.

```tsx
// Column droppable
const {setNodeRef, isOver} = useDroppable({
  id: columnId,
  data: {
    type: 'column',
    columnId: id,
    columnIndex: index
  }
});

// Card droppable (sortable)
<SortableItem
  id={card.id}
  data={{
    columnId: column.id,
    index: index,
    type: 'card'
  }}
/>
```

#### 3. Correct State Update Pattern

The recommended pattern uses **transient state during drag** and **commits to canonical state on drop**.

**Data Model:**
```ts
type BoardState = Record<ColumnId, TaskId[]>;

const [columns, setColumns] = useState<BoardState>(initialColumns);
const [activeDrag, setActiveDrag] = useState<null | {
  id: TaskId;
  groups: BoardState; // transient snapshot during drag
}>(null);
```

**onDragStart** - Snapshot current state:
```ts
const handleDragStart = ({active}: DragStartEvent) => {
  setActiveDrag({
    id: active.id,
    groups: columns, // snapshot
  });
};
```

**onDragOver** - Update transient state only (optional, for live preview):
```ts
const handleDragOver = (event: DragOverEvent) => {
  if (!activeDrag) return;
  
  const updatedGroups = calculateNewGroups(activeDrag.groups, event);
  setActiveDrag(prev => prev && ({...prev, groups: updatedGroups}));
};
```

**Render** - Use transient state during drag:
```tsx
const groupsToRender = activeDrag ? activeDrag.groups : columns;

Object.entries(groupsToRender).map(([columnId, tasks]) => (
  <DnDGroup key={columnId} id={columnId} itemIds={tasks} />
));
```

**onDragEnd** - Commit to canonical state:
```ts
const handleDragEnd = (event: DragEndEvent) => {
  const {active, over} = event;
  setActiveDrag(null); // Clear transient state first!
  
  if (!over) return; // Dropped outside
  
  const fromColumn = findContainer(active.id);
  const toColumn = findContainer(over.id);
  
  if (!fromColumn || !toColumn) return;
  
  if (fromColumn === toColumn) {
    // Reorder within same column
    setColumns(prev => {
      const column = [...prev[fromColumn]];
      const oldIndex = column.indexOf(active.id);
      const newIndex = column.indexOf(over.id);
      const newColumn = arrayMove(column, oldIndex, newIndex);
      return {...prev, [fromColumn]: newColumn};
    });
  } else {
    // Move between columns
    setColumns(prev => {
      const next = structuredClone(prev); // Deep clone!
      
      // Remove from source
      const oldIndex = next[fromColumn].indexOf(active.id);
      next[fromColumn].splice(oldIndex, 1);
      
      // Add to destination
      const overIndex = next[toColumn].indexOf(over.id);
      const newIndex = overIndex === -1 ? next[toColumn].length : overIndex;
      next[toColumn].splice(newIndex, 0, active.id);
      
      return next;
    });
  }
};
```

### Common Mistakes That Cause Snap-Back

1. **Not updating state in `onDragEnd`**: If you never move the item in state, dnd-kit animates back to original position.

2. **Mutating state directly**: Using `prev[sourceId].splice(...)` without cloning → React doesn't detect change.

3. **Unstable IDs**: IDs changing or being recreated on every render → dnd-kit can't reconcile items.

4. **Not clearing activeDrag**: Continuing to render transient state after drag ends → stale visual state.

5. **Missing `data` on droppables**: `over.data.current` is `null` → can't determine destination.

6. **Not using `setNodeRef`**: Droppable never registered → `over` is always `null`.

7. **Updating in `onDragOver` without `onDragEnd` commit**: Partial updates without final state commit.

### Empty Column Handling

For empty columns to accept drops:

1. Make the column itself a droppable with `useDroppable`:
```tsx
const {setNodeRef} = useDroppable({
  id: columnId,
  data: {type: 'column', columnId}
});
```

2. Check for column drops in `onDragEnd`:
```tsx
if (over.data.current?.type === 'column') {
  const targetColumnId = over.data.current.columnId;
  // Add item to empty column
}
```

3. Ensure empty columns render with height/width so they have collision area.

## Related Issues & Discussions

- **GitHub Issue #1680**: "When i drag sortable items over empty column sortable element returns to previous place" - Confirmed that missing column droppables and data props cause this.
- **GitHub Issue #849**: Custom modifiers for snapping behavior
- **GitHub Issue #531**: Incorrect drag position after state update (virtualized lists)
- **GitHub Discussion #809**: Complex interactions guide - explains data prop pattern
- **GitHub Discussion #1531**: Re-renders in other containers during drag

## Best Practices Summary

1. Use `closestCorners` collision detection for kanban
2. Provide `data` prop to all droppables (columns and cards)
3. Use transient state during drag, commit on drop
4. Always clone state objects (use `structuredClone` or spread operators)
5. Clear transient state (`setActiveDrag(null)`) before updating canonical state
6. Make columns droppable for empty column support
7. Use `over.data.current` to distinguish between column and card drops
8. Ensure stable, unique IDs for all draggables

## Testing Recommendations

- Test dragging to empty columns
- Test dragging first item out of column (leaving it empty)
- Test dragging between columns in both directions
- Test dragging within same column (reordering)
- Test dropping outside all droppables (should snap back)
- Test with 3+ columns to verify collision detection

## References & Sources

- Radzion Dev's Kanban Tutorial (2024): Pattern using transient state during drag
- dnd-kit Documentation: Collision detection algorithms
- GitHub Issues: #1680, #849, #531
- GitHub Discussions: #809 (complex interactions), #1531 (re-renders)
- Stack Overflow: Multiple kanban snap-back questions

## Implementation Checklist

- [ ] Change collision detection to `closestCorners`
- [ ] Add `data` prop to all column droppables
- [ ] Add `data` prop to all card sortables
- [ ] Implement transient state pattern (`activeDrag`)
- [ ] Update `onDragStart` to snapshot state
- [ ] Update `onDragEnd` to clear transient state first
- [ ] Ensure state cloning (no mutations)
- [ ] Handle empty column drops
- [ ] Verify stable IDs across renders
- [ ] Test all drag scenarios
