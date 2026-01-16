# Perplexity Research: dnd-kit Container Identification When Collision Detection Returns Cards

**Date**: 2025-12-11
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API

## Query Summary

Researched solutions for dnd-kit kanban board asymmetric drag behavior, specifically:
- When collision detection picks cards over columns
- How to determine target container when `over.id` is a card
- Using SortableContext's `containerId` or `data` property
- Extracting parent container from sortable item during drag

## Findings

### Core Problem

When using dnd-kit for kanban boards, collision detection often returns a **card** (item) in `over.id` instead of the column (container). This requires determining which column contains that card to know where the dragged item should be dropped.

### Solution 1: Lookup Parent Container from State (Simplest)

**Pattern**: Search through data structure to find which container owns the card.

```typescript
type Container = {
  id: UniqueIdentifier;
  items: { id: UniqueIdentifier; title: string }[];
};

const [containers, setContainers] = useState<Container[]>([]);

function findContainerByItemId(
  id: UniqueIdentifier | undefined,
  containers: Container[]
): Container | undefined {
  if (!id) return undefined;
  return containers.find(container =>
    container.items.some(item => item.id === id)
  );
}

function handleDragOver(event: DragOverEvent) {
  const { active, over } = event;
  if (!over) return;

  let targetContainerId: UniqueIdentifier | undefined;

  if (over.id.toString().includes('container')) {
    // Pointer is over a column
    targetContainerId = over.id;
  } else {
    // Pointer is over a card: resolve its parent column
    const overContainer = findContainerByItemId(over.id, containers);
    targetContainerId = overContainer?.id;
  }

  if (!targetContainerId) return;
  
  // Now use targetContainerId to decide where to move active.id
}
```

**Used in**: The "awesome Kanban board" example with dnd-kit uses `findValueOfItems` / `findContainerItems` helpers.

### Solution 2: Store containerId in Sortable Item Data (Recommended)

**Pattern**: Include the parent container ID in the sortable item's `data` property.

```tsx
// Column container
<SortableContext items={column.items.map(i => i.id)}>
  {column.items.map(item => (
    <SortableItem
      key={item.id}
      id={item.id}
      containerId={column.id}
    />
  ))}
</SortableContext>

// Sortable item
function SortableItem({ id, containerId }: { 
  id: UniqueIdentifier; 
  containerId: UniqueIdentifier 
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
    data: {
      type: 'item',
      containerId, // parent column id
    },
  });

  // ...
}
```

**Reading the data in drag handlers**:

```typescript
function handleDragOver(event: DragOverEvent) {
  const { active, over } = event;
  if (!over) return;

  let targetContainerId: UniqueIdentifier | undefined;

  const overData = over.data.current as { 
    type?: string; 
    containerId?: UniqueIdentifier 
  } | null;

  if (overData?.type === 'container') {
    targetContainerId = over.id;
  } else if (overData?.type === 'item') {
    targetContainerId = overData.containerId;
  }

  if (!targetContainerId) return;
  
  // Use targetContainerId to update your containers/items
}
```

**Benefits**:
- Avoids linear searches through containers
- Metadata stored directly on the draggable
- Recommended pattern in dnd-kit documentation
- Enables type discrimination (`type: 'item'` vs `type: 'container'`)

### SortableContext containerId Property

From the official dnd-kit documentation:

> The `SortableContext` component also optionally accepts an `id` prop. If an `id` is not provided, one will be auto-generated for you. The `id` prop is for advanced use cases. **If you're building custom sensors, you'll have access to each sortable element's `data` prop, which will contain the `containerId` associated to that sortable context.**

This means:
- Each `useSortable` item automatically gets a `containerId` in its `data`
- This `containerId` corresponds to the parent `SortableContext`'s `id`
- You can access it via `over.data.current.containerId` or `active.data.current.containerId`

### Multiple Containers Pattern

When moving items between containers:

```typescript
function handleDragOver(event: DragOverEvent) {
  const { active, over } = event;
  if (!over) return;

  const activeContainer = findContainerByItemId(active.id, containers);
  const overContainer = findContainerByItemId(over.id, containers);

  if (!activeContainer || !overContainer) return;
  if (activeContainer.id === overContainer.id) return; // Same container

  // Move item from activeContainer to overContainer
  setContainers((containers) => {
    // Remove from source
    // Add to target
    // Update state
  });
}
```

### Advanced: Custom Collision Detection

For complex nested structures (folders/files, nested containers):

```typescript
export const collisionDetectionStrategy: CollisionDetection = (args) => {
  const folderArgs = { ...args };
  const itemArgs = { ...args };
  
  // Filter droppable containers by type
  folderArgs.droppableContainers = args.droppableContainers.filter(
    (c) => c.data.current?.type === 'folder'
  );
  itemArgs.droppableContainers = args.droppableContainers.filter(
    (c) => c.data.current?.type === 'item'
  );

  // Check folder intersections first
  const folderIntersection = rectIntersection(folderArgs);
  if (folderIntersection && folderIntersection.length > 0) {
    return closestCorners(folderArgs);
  }

  // Fall back to item intersections
  return closestCorners(itemArgs);
};
```

## Key Takeaways

1. **When `over.id` is a card**: Treat it as targeting that card's column
2. **Two main approaches**:
   - Search state to find parent container (simple but O(n))
   - Store `containerId` in item's `data` (efficient, recommended)
3. **Use `data` property**: Store metadata like `type`, `containerId` for type discrimination
4. **SortableContext auto-provides**: Items get `containerId` from parent `SortableContext`
5. **For complex scenarios**: Implement custom collision detection with type filtering

## Implementation Recommendations

For our kanban board:

1. **Add `containerId` to each card's `useSortable` data**:
   ```tsx
   useSortable({
     id: card.id,
     data: {
       type: 'card',
       containerId: column.id,
     },
   });
   ```

2. **Add type to column's `useDroppable` data**:
   ```tsx
   useDroppable({
     id: column.id,
     data: {
       type: 'column',
     },
   });
   ```

3. **In `onDragOver`, check type and extract `containerId`**:
   ```typescript
   const overData = over.data.current;
   const targetContainerId = overData?.type === 'column' 
     ? over.id 
     : overData?.containerId;
   ```

4. **Consider custom collision detection** if asymmetric behavior persists with `closestCorners`

## Related Searches

- Custom collision detection strategies for nested containers
- dnd-kit performance optimization for large kanban boards
- Type-safe patterns for dnd-kit with TypeScript

## Sources & Citations

1. **Perplexity AI Response** - Comprehensive explanation of container identification patterns
2. [dnd-kit Sortable Context Documentation](https://docs.dndkit.com/presets/sortable/sortable-context) - Official `containerId` reference
3. [GitHub Discussion #1111](https://github.com/clauderic/dnd-kit/discussions/1111) - Moving data between SortableContexts
4. [GitHub Discussion #821](https://github.com/clauderic/dnd-kit/discussions/821) - Nested multiple container lists
5. [GitHub Discussion #639](https://github.com/clauderic/dnd-kit/discussions/639) - Form builder with drag/drop between containers
6. [GitHub Issue #714](https://github.com/clauderic/dnd-kit/issues/714) - Custom collision detection for folders/files
7. [Stack Overflow](https://stackoverflow.com) - Various community solutions (referenced in search results)

---

**Conclusion**: The recommended approach is to store `containerId` in each sortable item's `data` property and use type discrimination (`type: 'item'` vs `type: 'container'`) to determine the target container when `over.id` is a card. This avoids expensive linear searches and leverages dnd-kit's built-in mechanisms.
