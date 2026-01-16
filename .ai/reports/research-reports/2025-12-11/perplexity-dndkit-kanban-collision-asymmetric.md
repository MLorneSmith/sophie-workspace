# Perplexity Research: dnd-kit Kanban Collision Detection - Asymmetric Drop Behavior

**Date**: 2025-12-11
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API

## Query Summary

Investigated why dnd-kit kanban boards exhibit asymmetric drop behavior where:
- Drops work in one direction (left-to-right) but not the other (right-to-left)
- Using `useDroppable` for columns and `useSortable` for cards
- `closestCenter` collision detection fails to correctly detect column drops when cards are present
- Cards "snap back" to original column when dragging in certain directions

## Root Cause Analysis

### Why closestCenter Prioritizes Sortable Items Over Droppable Containers

**The fundamental issue**: `closestCenter` measures distance from the active draggable to **all droppables in the DndContext** (both column droppables AND card droppables) and returns the nearest one. In kanban boards with stacked layouts:

1. **Column droppables and card droppables are in the same collision detection pool**
2. When dragging, if a card's center is closer than the column's center, `closestCenter` reports the card instead of the column
3. This causes **asymmetric behavior**: 
   - Dragging left-to-right might pass closer to a column center (works)
   - Dragging right-to-left might pass closer to a card center (fails, snaps back)
4. The active card never truly enters the new column as a drop target

**Official documentation explicitly states**: "Do not use `closestCenter` for Kanban-style stacked containers because it tends to pick the underlying column instead of the items within it."

## Solutions

### Solution 1: Switch to closestCorners (Recommended First Try)

**Best for**: Simple kanban boards where cards should be prioritized over columns

```tsx
import { DndContext, closestCorners } from '@dnd-kit/core';

<DndContext collisionDetection={closestCorners}>
  {/* columns with useDroppable, cards with useSortable */}
</DndContext>
```

**Why it works**: `closestCorners` favors the visually nearest card "box" instead of the big column container, which is exactly what the docs recommend when `closestCenter` misbehaves.

### Solution 2: Custom Collision Detection - Prefer Cards Over Columns

**Best for**: When you need both columns and cards to be droppable, but cards should win when both are close

```typescript
import {
  closestCenter,
  rectIntersection,
  type CollisionDetection,
} from '@dnd-kit/core';

const collisionDetection: CollisionDetection = (args) => {
  // Start with preferred algorithm
  const collisions = closestCenter(args);

  if (!collisions.length) {
    // Optional fallback
    return rectIntersection(args);
  }

  // Assume sortable card droppables have data.type = 'card'
  // and column droppables have data.type = 'column'
  const cardCollisions = collisions.filter((collision) => {
    const droppable = args.droppableContainers.get(collision.id);
    return droppable?.data?.current?.type === 'card';
  });

  // Prefer cards if any are hit; otherwise allow columns
  return cardCollisions.length ? cardCollisions : collisions;
};

<DndContext collisionDetection={collisionDetection}>
  {/* ... */}
</DndContext>
```

### Solution 3: Custom Collision Detection - Prefer Columns Over Cards

**Best for**: Empty columns need to be droppable; columns should win over cards

```typescript
import {
  closestCenter,
  rectIntersection,
  pointerWithin,
  type CollisionDetection,
} from '@dnd-kit/core';

const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);

  // If pointer is over something, try to prefer column containers
  if (pointerCollisions.length > 0) {
    const columnDroppables = pointerCollisions.filter(c => 
      c.id.toString().startsWith('column-') // or your own test
    );

    if (columnDroppables.length > 0) {
      return columnDroppables;
    }
  }

  // Fallback to standard item-level collision (for reordering cards)
  return closestCenter(args);
};
```

### Solution 4: Composed Strategy for Multi-Container Patterns

**Best for**: Complex kanban with folders, multiple types, different collision rules per type

```typescript
export const collisionDetectionStrategy: CollisionDetection = (args) => {
  const folderArgs = { ...args };
  const surveyArgs = { ...args };
  const rootArgs = { ...args };

  // Filter droppable containers by type
  rootArgs.droppableContainers = args.droppableContainers.filter(
    (c) => c.data.current?.type === 'rootFolder'
  );
  folderArgs.droppableContainers = args.droppableContainers.filter(
    (c) => c.data.current?.type === 'folder'
  );
  surveyArgs.droppableContainers = args.droppableContainers.filter(
    (c) => c.data.current?.type === 'research'
  );

  // Try folder intersections first
  const folderIntersectionId = rectIntersection(folderArgs);
  if (folderIntersectionId && folderIntersectionId.length > 0) {
    return closestCorners(folderArgs);
  }

  // Try root intersection
  const rootIntersection = rectIntersection(rootArgs);
  if (rootIntersection && rootIntersection.length > 0) {
    return rootIntersection;
  }

  // Fallback to closest corners for items
  return closestCorners(args);
};
```

## Collision Detection Algorithm Comparison

| Algorithm | Best Use Case | Multi-Container Support | Precision |
|-----------|--------------|------------------------|-----------|
| `rectIntersection` | Default, requires direct contact | Limited | High |
| `closestCenter` | Forgiving, but problematic for kanban | Yes | Medium |
| `closestCorners` | **Recommended for kanban** | Yes | Medium-High |
| `pointerWithin` | High precision, pointer-based only | Yes | Very High |

**Key Insight**: `closestCorners` tends to favor the visually nearest card "box" instead of the big column container, which is exactly what kanban boards need.

## Architecture Pattern for Working Kanban

### Required Setup

1. **Give columns their own droppable IDs and areas**
   ```tsx
   const { setNodeRef: setColumnDroppableRef } = useDroppable({ 
     id: columnId 
   });
   ```
   Attach that ref to an element that spans the whole column (usually the column body, behind/around the cards).

2. **Keep cards only in SortableContext, not as column droppables**
   ```tsx
   <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
     {cards.map(card => <Card key={card.id} id={card.id} />)}
   </SortableContext>
   ```

3. **Use collision detection that prioritizes correctly**
   - Use `closestCorners` for simple kanban
   - Use custom collision detection for complex multi-type boards

4. **In `onDragOver`/`onDragEnd`, resolve the column from the collision target**
   ```tsx
   const handleDragOver = ({ active, over }) => {
     if (!over) return;

     const overId = over.id;
     const overColumnId = overId.toString().startsWith('column-')
       ? overId
       : findColumnFromCardId(overId);

     // Move the card into overColumnId's card list
   };
   ```

## Working Examples & References

### Multi-Container Sortable Lists
- **Official docs**: https://next.dndkit.com/react/guides/multiple-sortable-lists
- Uses `CollisionPriority.Low` for columns to prioritize items over containers
- Shows proper separation of column droppables and card sortables

### Drag Into Sortable List Item (Issue #714)
- **GitHub Issue**: https://github.com/clauderic/dnd-kit/issues/714
- Real-world implementation of folders/files pattern
- Shows custom collision detection with type filtering
- Uses `data.current?.type` to differentiate droppable types

### Collision Detection Composition (Issue #127)
- **GitHub Issue**: https://github.com/clauderic/dnd-kit/issues/127
- Shows how to compose multiple algorithms
- Example: `pointerWithin` with `closestCenter` fallback

## Common Pitfalls

### 1. Using closestCenter for Stacked Layouts
**Problem**: Column droppables compete with card droppables in same collision pool
**Solution**: Use `closestCorners` or custom collision detection

### 2. Not Giving Columns Dedicated Droppable Areas
**Problem**: Empty columns can't accept drops
**Solution**: Use `useDroppable` on column container element

### 3. Nesting DndContext Providers
**Problem**: Draggables/droppables don't know about each other's existence across contexts
**Solution**: Use single `DndContext` with conditional collision detection based on active item type

### 4. Rendering Sortable Components in DragOverlay
**Problem**: ID collision between two components both calling `useDraggable` with same ID
**Solution**: Create presentational version of component for overlay, separate from sortable version

## Key Takeaways

1. **Never use `closestCenter` for kanban boards** - explicitly not recommended by docs
2. **Use `closestCorners` as default** for stacked container layouts
3. **Compose collision algorithms** for complex multi-type boards
4. **Filter droppables by type** in custom collision detection
5. **Give columns their own droppable areas** separate from card sortables
6. **Use `data.current?.type`** to differentiate between droppable types
7. **Handle `onDragOver` for intermediate transformations**, `onDragEnd` for final state
8. **Avoid nested `DndContext` providers** - use single context with conditional logic

## Related Research

- **Official Collision Detection Docs**: https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms
- **Multi-Container Guide**: https://next.dndkit.com/react/guides/multiple-sortable-lists
- **Sortable Preset Docs**: https://docs.dndkit.com/presets/sortable
- **GitHub Issue #714**: Drag into sortable list item (folders/files pattern)
- **GitHub Discussion #210**: Canceling drag operations with closest center/corners

## Next Steps for Implementation

1. Replace `closestCenter` with `closestCorners` in `DndContext`
2. Verify columns have `useDroppable` with unique IDs
3. Ensure cards use `useSortable` within `SortableContext` per column
4. Test drop behavior in both directions
5. If issues persist, implement custom collision detection with type filtering
6. Add `data: { type: 'column' }` to column droppables and `data: { type: 'card' }` to card sortables
