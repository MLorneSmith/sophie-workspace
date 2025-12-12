# Context7 Research: @dnd-kit DragEndEvent, Collision Detection, and Over Property

**Date**: 2025-12-11
**Agent**: context7-expert
**Libraries Researched**: @dnd-kit/core, @dnd-kit/sortable

## Query Summary

Researched how the `event.over.id` property works in @dnd-kit when using `useDroppable` and `useSortable` together, focusing on collision detection with `closestCenter` strategy and determining whether a user dropped on a droppable container vs. a sortable item.

## Key Findings

### DragEndEvent Type Structure

```typescript
export interface DragEndEvent extends DragEvent {
}

interface DragEvent {
    activatorEvent: Event;
    active: Active;
    collisions: Collision[] | null;
    delta: Translate;
    over: Over | null;
}
```

### The `over` Property

The `over` property in `DragEndEvent` has this structure:

```typescript
export interface Over {
    id: UniqueIdentifier;           // The ID of the element being hovered over
    rect: ClientRect;                // Bounding rectangle of the element
    disabled: boolean;               // Whether the droppable is disabled
    data: DataRef;                   // Custom data attached to the droppable/sortable
}
```

**Critical Insight**: `event.over.id` returns the ID of **whichever element the collision detection algorithm determines is closest** - this could be:
1. A droppable container ID (from `useDroppable`)
2. A sortable item ID (from `useSortable`)

### Collision Detection with `closestCenter`

The `closestCenter` collision detection algorithm calculates the distance between the center of the dragged element and the center of all potential drop targets, then returns the closest one.

```typescript
collisionDetection={closestCenter}
```

**Behavior**:
- Calculates center point of dragged item
- Calculates center points of all droppable containers AND sortable items
- Returns the ID of whichever element has the closest center

### How useSortable and useDroppable Interact

Both hooks register their elements as potential drop targets in the same collision detection pool:

1. **useDroppable** registers a droppable container:
```typescript
const { setNodeRef } = useDroppable({ id: 'column-id' });
```

2. **useSortable** registers a sortable item (which is also droppable):
```typescript
const { setNodeRef } = useSortable({ id: 'task-id' });
```

**Critical Understanding**: When you use `SortableContext` inside a droppable container, you have TWO types of IDs competing for `event.over.id`:
- The container ID (from `useDroppable`)
- Individual sortable item IDs (from `useSortable`)

## Code Examples from Codebase

### Kanban Board Pattern (Container Detection)

```typescript
// kanban-board.tsx - Line 84-113
const handleDragEnd = useCallback(
  async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !tasks) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    const overId = over.id as Task["status"];

    // If dragging to a column (droppable container)
    if (COLUMNS.some((col) => col.id === overId)) {
      if (activeTask && activeTask.status !== overId) {
        setUpdatingTaskId(activeTask.id);
        try {
          await updateStatus.mutateAsync({
            id: activeTask.id,
            status: overId as TaskStatus,
          });
        } catch (_error) {
          logger.error("Failed to update task status:", _error);
        } finally {
          setUpdatingTaskId(null);
        }
      }
    }

    setActiveId(null);
  },
  [tasks, updateStatus],
);
```

**Key Pattern**: Check if `over.id` matches a known container ID to determine if dropped on container vs. sortable item.

### Column Setup (Droppable + Sortable)

```typescript
// column.tsx - Line 19-68
export function Column({ id, title, tasks, updatingTaskId }: ColumnProps) {
  const { setNodeRef } = useDroppable({
    id,  // Container ID (e.g., "do", "doing", "done")
  });

  return (
    <div ref={setNodeRef}>
      <SortableContext items={tasks} strategy={rectSortingStrategy}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />  {/* Task ID (e.g., "task-123") */}
        ))}
      </SortableContext>
    </div>
  );
}
```

**Architecture**:
- Column has ID `"do"` via `useDroppable`
- Each TaskCard has ID like `"task-123"` via `useSortable`
- Both register as potential drop targets

### Sortable Item Pattern (Reordering)

```typescript
// sortable-slide-list.tsx - Line 55-76
const handleDragEnd = (event: {
  active: { id: unknown };
  over: { id: unknown } | null;
}) => {
  const { active, over } = event;

  if (over && active.id !== over.id) {
    const oldIndex = slides.findIndex((slide) => slide.id === active.id);
    const newIndex = slides.findIndex((slide) => slide.id === over.id);

    const newSlides = arrayMove(slides, oldIndex, newIndex).map(
      (slide, index) => ({
        ...slide,
        order: index,
      }),
    );

    onSlidesChange(newSlides);
  }

  setActiveId(null);
};
```

**Pattern**: When `over.id` matches another sortable item ID, reorder the items.

## Decision Logic Pattern

To determine if dropped on container vs. sortable item:

```typescript
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  
  if (!over) return; // Dropped outside any drop target
  
  // Check if dropped on a container (droppable)
  if (KNOWN_CONTAINER_IDS.includes(over.id)) {
    // Handle container drop (e.g., move to different column)
    handleContainerDrop(active.id, over.id);
  } 
  // Otherwise, it's a sortable item
  else {
    // Handle reordering within container
    handleReorder(active.id, over.id);
  }
};
```

## Common Use Cases

### 1. Kanban Board (Container + Sortable)
- **Container IDs**: Column IDs (`"todo"`, `"doing"`, `"done"`)
- **Sortable IDs**: Task IDs (`"task-1"`, `"task-2"`)
- **Logic**: If `over.id` is a column ID → move to column; else reorder within column

### 2. Pure Sortable List
- **Container IDs**: None (no `useDroppable`)
- **Sortable IDs**: Item IDs
- **Logic**: Always reorder based on `over.id`

### 3. Nested Droppables
- **Container IDs**: Multiple levels (e.g., board, column)
- **Sortable IDs**: Items at each level
- **Logic**: Check hierarchy to determine action

## Key Takeaways

1. **`event.over.id` returns the ID of the closest element** according to the collision detection algorithm - could be a droppable container OR a sortable item

2. **Collision detection is unified** - both `useDroppable` and `useSortable` register in the same pool

3. **You must explicitly check the ID type** by comparing against known container IDs to determine drop behavior

4. **`closestCenter` calculates geometric center distance** - the element with the closest center point wins

5. **No automatic distinction** - @dnd-kit doesn't differentiate between container and item drops; you implement the logic

6. **Data property is available** - Use `over.data` to attach custom metadata that helps identify the drop target type:
```typescript
useDroppable({ 
  id: 'column-1',
  data: { type: 'column', accepts: ['task'] }
});

useSortable({ 
  id: 'task-1',
  data: { type: 'task', parentId: 'column-1' }
});
```

## Recommended Pattern

```typescript
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  
  if (!over) return;
  
  // Option 1: Check against known IDs
  const isContainerDrop = CONTAINER_IDS.includes(over.id);
  
  // Option 2: Use data property
  const isContainerDrop = over.data.current?.type === 'container';
  
  if (isContainerDrop) {
    // Handle cross-container move
  } else {
    // Handle within-container reorder
  }
};
```

## Sources

- @dnd-kit/core type definitions (`types/events.d.ts`, `store/types.d.ts`)
- Kanban board implementation (`/home/msmith/projects/2025slideheroes/apps/web/app/home/(user)/kanban/_components/`)
- Sortable slide list implementation (`/home/msmith/projects/2025slideheroes/apps/web/app/home/(user)/ai/storyboard/_components/sortable-slide-list.tsx`)
