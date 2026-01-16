# Perplexity Research: dnd-kit Kanban Snap-Back and Data Property Issues

**Date**: 2025-12-11
**Agent**: perplexity-expert
**Search Type**: Mixed (Search API + Chat API)

## Query Summary

Searched for recent solutions (2024-2025) to three common dnd-kit kanban board issues:
1. Cards snap back to source column instead of moving to destination
2. Cross-container drag-drop doesn't work properly
3. The `data` property on useSortable/useDroppable is undefined in dragEnd events

## Findings

### 1. Card Snap-Back Issues (Most Common Problem)

**Root Causes Identified:**

#### A. State Not Updated in `onDragEnd`
The most common cause across all sources. dnd-kit is purely presentational during drag - if you don't update state correctly, items visually snap back.

**Common mistakes:**
- Ignoring `event.over` and leaving items in the same list
- Using wrong IDs or indices when splicing arrays
- Updating only source OR destination column, not both
- Using non-functional `setState` (closing over stale state)

**Canonical fix pattern:**
```tsx
function handleDragEnd(event: DragEndEvent) {
  const {active, over} = event;
  if (!over) return; // snap back if dropped outside

  const activeId = active.id;
  const overId = over.id;
  if (activeId === overId) return;

  setColumns(prev => {
    const sourceColId = active.data.current?.columnId;
    const destColId = over.data.current?.columnId ?? overId;

    if (!sourceColId || !destColId) return prev;
    
    if (sourceColId === destColId) {
      // Reorder within same column
      const column = prev[sourceColId];
      const oldIndex = column.items.findIndex(i => i.id === activeId);
      const newIndex = column.items.findIndex(i => i.id === overId);
      
      const newItems = arrayMove(column.items, oldIndex, newIndex);
      return {...prev, [sourceColId]: {...column, items: newItems}};
    }

    // Move between columns
    const sourceCol = prev[sourceColId];
    const destCol = prev[destColId];
    
    const sourceIndex = sourceCol.items.findIndex(i => i.id === activeId);
    const [moved] = sourceCol.items.splice(sourceIndex, 1);
    
    const destIndex = destCol.items.findIndex(i => i.id === overId);
    const insertAt = destIndex === -1 ? destCol.items.length : destIndex;
    
    destCol.items.splice(insertAt, 0, moved);

    return {
      ...prev,
      [sourceColId]: {...sourceCol, items: [...sourceCol.items]},
      [destColId]: {...destCol, items: [...destCol.items]},
    };
  });
}
```

#### B. Non-Unique or Unstable IDs
**Symptoms:**
- Intermittent snap-backs
- Items reorder incorrectly
- Some columns never accept drops

**Common mistakes:**
- Using array index as `id` (changes when items move)
- Same `id` for column container and item
- Column `id` not in `SortableContext` items

**Fix:**
```tsx
// Use stable unique identifiers
<SortableContext
  id={column.id}
  items={column.items.map(item => item.id)} // Array of IDs
  strategy={verticalListSortingStrategy}
>
  {column.items.map(item => (
    <Card key={item.id} id={item.id} />
  ))}
</SortableContext>
```

#### C. Wrong Collision Detection Strategy
**Problem:** Default `rectIntersection` is unforgiving for kanban boards.

**Solution:** Use `pointerWithin` or `closestCenter` for multi-column layouts:
```tsx
<DndContext 
  collisionDetection={pointerWithin} // or closestCenter
  onDragEnd={handleDragEnd}
>
```

**Why:** `rectIntersection` requires full overlap; pointer-based detection works better for kanban where you drag over column headers/margins.

#### D. Missing Droppable Areas for Empty Columns
**Problem:** Can't drop into empty columns because there's no droppable target.

**Solution:** Always render droppable zones, even when column is empty:
```tsx
<div ref={setNodeRef} className="column">
  {items.length === 0 ? (
    <div className="empty-placeholder">Drop here</div>
  ) : (
    items.map(item => <Card key={item.id} item={item} />)
  )}
</div>
```

**Referenced in:** GitHub Issue #1680 - "When i drag sortable items over empty column sortable element returns to previous place"

### 2. `data` Property Undefined in DragEnd Events

**Root Cause:** Not passing `data` to `useSortable` or reading from wrong path.

#### A. Not Passing Data
```tsx
// ❌ Wrong - no data passed
const {attributes, listeners, setNodeRef} = useSortable({id});

// ✅ Correct - include data
const {attributes, listeners, setNodeRef} = useSortable({
  id: item.id,
  data: {
    type: 'card',
    item,
    containerId,
    index,
  },
});
```

#### B. Reading from Wrong Path
`data` is a `DataRef`, must use `.current`:

```tsx
// ❌ Wrong
event.active.data
event.active.data.item

// ✅ Correct
event.active.data.current
event.active.data.current?.item
```

#### C. Best Practice Pattern
Encode type + container + index in data:

```tsx
// For cards
useSortable({
  id: item.id,
  data: {
    type: 'card',
    itemId: item.id,
    containerId,
    index,
  },
});

// For containers (if sortable)
useSortable({
  id: container.id,
  data: {
    type: 'container',
    containerId: container.id,
  },
});

// In handleDragEnd
const activeData = active.data.current;
const overData = over.data.current;

if (activeData?.type === 'card' && overData?.type === 'card') {
  // Move card logic
}
```

### 3. Cross-Container Drag-Drop Issues

**Key Architecture Pattern from GitHub Discussion #181:**

The library requires all draggables/droppables within same `DndContext`. Cannot accept draggables from outside parent `DndContext`.

**Recommended architecture for sidebar + board:**

```tsx
<DndContext
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
  collisionDetection={collisionDetection}
>
  <Sidebar items={sidebarItems} />
  <Board items={boardItems} />
</DndContext>
```

**Conditionally change config based on active draggable:**
```tsx
const collisionDetection = isSidebarItem(activeId)
  ? sidebarCollisionDetectionStrategy
  : boardCollisionDetectionStrategy;
```

**Future API (proposed but not yet implemented):**
```tsx
<DndContext>
  <DndConfig sensors={sidebarSensors}>
    <Sidebar />
  </DndConfig>
  <DndConfig sensors={boardSensors}>
    <Board />
  </DndConfig>
</DndContext>
```

### 4. Handling "Drop into Column vs Drop onto Card"

**Problem:** `over.id` sometimes references column, sometimes card.

**Solution:** Encode type in data and branch:

```tsx
// Column droppable
useDroppable({
  id: column.id,
  data: {
    type: 'column',
    columnId: column.id,
  },
});

// Card sortable
useSortable({
  id: item.id,
  data: {
    type: 'card',
    columnId,
  },
});

// Handler
const overType = over.data.current?.type;
if (overType === 'card') {
  // Insert before/after this card
} else if (overType === 'column') {
  // Append to end of column
}
```

### 5. CSS/Layout Issues

**Common problems from GitHub #1098:**
- `overflow: hidden` on parent prevents dragging outside container
- Items appear zoomed/scaled in `DragOverlay`
- Items get clipped

**Solutions:**
- **Use DragOverlay for scrollable containers:**
  ```tsx
  <DragOverlay>
    {draggingItem ? <CardPreview item={draggingItem} /> : null}
  </DragOverlay>
  ```
- **Fix scaling issues:** Use absolute units (`px`, `rem`) not relative (`em`) for item styles
- **Avoid wrapper nodes:** Use ref forwarding pattern instead of extra divs

### 6. SortableContext Items Array

**Critical requirement:** `items` prop must be array of IDs matching render order.

```tsx
// ✅ Correct
<SortableContext items={column.items.map(i => i.id)}>
  {column.items.map(item => <Card key={item.id} id={item.id} />)}
</SortableContext>

// ❌ Wrong - array of objects
<SortableContext items={column.items}>

// ❌ Wrong - doesn't match render order
<SortableContext items={allItemIds}>
  {filteredItems.map(item => <Card ... />)}
</SortableContext>
```

## Sources & Citations

### GitHub Issues
- [Issue #1680: Empty column snap-back](https://github.com/clauderic/dnd-kit/issues/1680) - Cards return to source when dragged over empty columns
- [Issue #1098: Can't drag outside container](https://github.com/clauderic/dnd-kit/issues/1098) - Overflow hidden prevents cross-container drag
- [Discussion #181: Cross-context draggables](https://github.com/clauderic/dnd-kit/discussions/181) - Architecture patterns for sidebar + board

### Tutorials & Articles
- [LogRocket: Build Kanban Board with dnd-kit](https://blog.logrocket.com/build-kanban-board-dnd-kit-react/) - Comprehensive tutorial with state update patterns
- [Dev.to: How to implement drag and drop](https://dev.to/arshadayvid/how-to-implement-drag-and-drop-in-react-using-dnd-kit-204h) - 2024 tutorial with handleDragEnd examples
- [YouTube: Master Drag-and-Drop with dnd-kit](https://www.youtube.com/watch?v=GEaRjSpgycg) - Video tutorial covering multi-container setup

### Official Documentation
- [dnd-kit.com: useSortable hook](https://docs.dndkit.com/presets/sortable/usesortable) - Official API documentation
- [dnd-kit.com: Sortable preset](https://docs.dndkit.com/presets/sortable) - Architecture overview and best practices

## Key Takeaways

1. **Always update state in `onDragEnd`** - Use functional setState to avoid stale closures
2. **Use stable, unique IDs** - Never use array indices
3. **Pass data to useSortable** - Include columnId, type, and other context needed in handlers
4. **Read data.current** - Not just data
5. **Use appropriate collision detection** - `pointerWithin` or `closestCenter` for kanban
6. **Render droppables for empty columns** - Always provide drop target
7. **Match SortableContext.items to render order** - Array of IDs only
8. **Use DragOverlay for scrollable containers** - Prevents clipping issues
9. **Single DndContext for related draggables** - Cannot drag across context boundaries
10. **Encode type in data** - Distinguish between column vs card drops

## Debugging Checklist

When cards snap back:
1. Log `event.active` and `event.over` in `onDragEnd`
2. Verify `over` is not null (collision detection issue if null)
3. Check `over.id` matches expected column/card ID
4. Confirm state update creates new arrays (no mutations)
5. Verify IDs are stable and unique
6. Try `pointerWithin` collision detection
7. Check `SortableContext.items` matches render order
8. Ensure all columns have droppable zones

## Related Searches

- dnd-kit multiple containers state management
- dnd-kit virtual scrolling kanban
- dnd-kit accessibility keyboard navigation kanban
- dnd-kit drag handle patterns
- dnd-kit optimistic updates server sync
