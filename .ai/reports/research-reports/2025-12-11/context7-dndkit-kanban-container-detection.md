# Context7 Research: dnd-kit Kanban Container Detection Patterns

**Date**: 2025-12-11
**Agent**: context7-expert
**Libraries Researched**: clauderic/dnd-kit (official website documentation)

## Query Summary

Researched dnd-kit multi-container drag and drop patterns for kanban boards where:
1. Items are sortable within columns (containers)
2. Items can be dragged between columns
3. Collision detection needs to identify which CONTAINER a dragged item is over, even when the collision points to a card inside that container

## Key Findings

### 1. Multi-Container Pattern Overview

dnd-kit supports multiple droppable containers with items that can be dragged between them. The key is understanding the relationship between:
- **DndContext**: Top-level provider
- **Droppable**: Container/column that accepts drops
- **SortableContext**: Makes items within a container sortable
- **Sortable items**: Individual draggable cards/tasks

### 2. Using `data` Properties for Container Identification

The most important pattern is using the `data` prop on droppables to identify containers vs items:

```jsx
import {useDroppable} from '@dnd-kit/core';

function Column({id, children}) {
  const {setNodeRef} = useDroppable({
    id: id,
    data: {
      type: 'container',  // Identify this as a container
      accepts: ['task']    // What types it accepts
    },
  });

  return (
    <div ref={setNodeRef}>
      {children}
    </div>
  );
}
```

For sortable items inside containers:

```jsx
import {useSortable} from '@dnd-kit/sortable';

function Task({id, containerId}) {
  const {setNodeRef, attributes, listeners} = useSortable({
    id: id,
    data: {
      type: 'task',
      parent: containerId  // Track which container this belongs to
    }
  });

  return (
    <div ref={setNodeRef} {...attributes} {...listeners}>
      {/* task content */}
    </div>
  );
}
```

### 3. The `onDragOver` Event and Container Detection

The `onDragOver` event is crucial for tracking which container the dragged item is currently over:

```jsx
function App() {
  const [containers, setContainers] = useState({
    'todo': ['task-1', 'task-2'],
    'in-progress': ['task-3'],
    'done': ['task-4', 'task-5']
  });
  
  const [activeContainer, setActiveContainer] = useState(null);

  function handleDragOver(event) {
    const {active, over} = event;
    
    if (!over) return;
    
    // Check if we're over a container or an item inside a container
    const overData = over.data.current;
    
    if (overData?.type === 'container') {
      // Directly over a container
      setActiveContainer(over.id);
    } else if (overData?.type === 'task') {
      // Over an item, get its parent container
      setActiveContainer(overData.parent);
    }
  }

  function handleDragEnd(event) {
    const {active, over} = event;
    
    if (!over) return;
    
    const activeData = active.data.current;
    const overData = over.data.current;
    
    // Determine target container
    let targetContainer;
    if (overData.type === 'container') {
      targetContainer = over.id;
    } else if (overData.type === 'task') {
      targetContainer = overData.parent;
    }
    
    // Move item to target container
    // ... update state logic
  }

  return (
    <DndContext 
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {Object.keys(containers).map(containerId => (
        <Column key={containerId} id={containerId}>
          <SortableContext items={containers[containerId]}>
            {containers[containerId].map(taskId => (
              <Task 
                key={taskId} 
                id={taskId} 
                containerId={containerId}
              />
            ))}
          </SortableContext>
        </Column>
      ))}
    </DndContext>
  );
}
```

### 4. Multi-Container Sortable Pattern

The official pattern for kanban boards with sortable items inside containers:

```jsx
import React, {useState} from 'react';
import {DndContext} from '@dnd-kit/core';
import {Droppable} from './Droppable';
import {Draggable} from './Draggable';

function App() {
  const containers = ['A', 'B', 'C'];
  const [parent, setParent] = useState(null);
  const draggableMarkup = (
    <Draggable id="draggable">Drag me</Draggable>
  );

  return (
    <DndContext onDragEnd={handleDragEnd}>
      {parent === null ? draggableMarkup : null}

      {containers.map((id) => (
        <Droppable key={id} id={id}>
          {parent === id ? draggableMarkup : 'Drop here'}
        </Droppable>
      ))}
    </DndContext>
  );

  function handleDragEnd(event) {
    const {over} = event;
    // If the item is dropped over a container, set it as the parent
    setParent(over ? over.id : null);
  }
}
```

### 5. SortableContext Structure

**Critical**: Each container must have its own `SortableContext` with its items:

```jsx
// Good: Each container has its own SortableContext
<DndContext>
  <SortableContext items={["A", "B", "C"]}>
    {/* Container 1 items */}
  </SortableContext>
  <SortableContext items={["D", "E", "F"]}>
    {/* Container 2 items */}
  </SortableContext>
</DndContext>

// Bad: Nested SortableContexts with ID collisions
<DndContext>
  <SortableContext items={["A", "B", "C"]}>
    <SortableContext items={["A", "B", "C"]}>
      {/* ID collision! */}
    </SortableContext>
  </SortableContext>
</DndContext>

// Good: Nested contexts with unique IDs
<DndContext>
  <SortableContext items={["A", "B", "C"]}>
    <SortableContext items={[1, 2, 3]}>
      {/* Unique IDs */}
    </SortableContext>
  </SortableContext>
</DndContext>
```

### 6. Event Handler Patterns

dnd-kit provides these event handlers for the drag lifecycle:

```jsx
<DndContext
  onDragStart={handleDragStart}   // When drag begins
  onDragMove={handleDragMove}     // Continuously during drag
  onDragOver={handleDragOver}     // When over a droppable
  onDragEnd={handleDragEnd}       // When drag completes
  onDragCancel={handleDragCancel} // When drag is canceled
>
```

For kanban boards, the most important are:
- **onDragOver**: Track which container the item is currently over
- **onDragEnd**: Execute the final move operation

### 7. Collision Detection Strategies

Use `closestCenter` or `closestCorners` for kanban boards:

```jsx
import {closestCenter, closestCorners} from '@dnd-kit/core';

<DndContext collisionDetection={closestCorners}>
  {/* containers */}
</DndContext>
```

**Note**: The recent fix in the codebase switched from `closestCenter` to `closestCorners` for better kanban collision detection.

## Code Examples

### Complete Kanban Board Pattern

```jsx
import React, {useState} from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

function KanbanBoard() {
  const [columns, setColumns] = useState({
    'todo': ['task-1', 'task-2'],
    'in-progress': ['task-3'],
    'done': ['task-4', 'task-5']
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragOver(event) {
    const {active, over} = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find which containers these items belong to
    const activeContainer = findContainer(activeId);
    const overContainer = over.data.current?.type === 'container' 
      ? over.id 
      : findContainer(overId);

    if (activeContainer !== overContainer) {
      // Move item between containers during drag
      setColumns(prev => {
        const activeItems = prev[activeContainer];
        const overItems = prev[overContainer];

        const activeIndex = activeItems.indexOf(activeId);
        const overIndex = overItems.indexOf(overId);

        return {
          ...prev,
          [activeContainer]: activeItems.filter(id => id !== activeId),
          [overContainer]: [...overItems.slice(0, overIndex), activeId, ...overItems.slice(overIndex)]
        };
      });
    }
  }

  function handleDragEnd(event) {
    const {active, over} = event;
    if (!over) return;

    // Final sort logic
  }

  function findContainer(id) {
    if (id in columns) return id;
    
    return Object.keys(columns).find(key => 
      columns[key].includes(id)
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {Object.entries(columns).map(([columnId, tasks]) => (
        <Column key={columnId} id={columnId}>
          <SortableContext 
            items={tasks}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map(taskId => (
              <Task 
                key={taskId} 
                id={taskId}
                containerId={columnId}
              />
            ))}
          </SortableContext>
        </Column>
      ))}
    </DndContext>
  );
}
```

### Using Data Properties for Type Checking

```jsx
function handleDragEnd(event) {
  const {active, over} = event;
  
  if (!over) return;

  // Use data properties to check compatibility
  if (
    over.data.current?.type === 'container' &&
    active.data.current?.supports?.includes(over.data.current.accepts)
  ) {
    // Valid drop - execute logic
  }
}

// Setup:
<Droppable
  id="column-1"
  data={{
    type: 'container',
    accepts: 'task'
  }}
/>

<Sortable
  id="task-1"
  data={{
    type: 'task',
    supports: ['container']
  }}
/>
```

## Key Takeaways

1. **Use `data` properties** on droppables and sortables to identify types and relationships
2. **`onDragOver` is critical** for tracking which container an item is over during drag
3. **Access container info via `over.data.current`** when collision points to an item
4. **Each container needs its own `SortableContext`** with unique item IDs
5. **Use `closestCorners` collision detection** for kanban boards (better than `closestCenter`)
6. **Track parent containers** in sortable item data for easy container resolution

## Architecture Pattern

```
DndContext
├── Column (useDroppable with data.type = 'container')
│   └── SortableContext (items for this column)
│       └── Task (useSortable with data.parent = columnId)
├── Column
│   └── SortableContext
│       └── Task
└── Column
    └── SortableContext
        └── Task
```

## Sources

- dnd-kit via Context7 (websites/dndkit - official documentation)
- https://docs.dndkit.com/introduction/getting-started
- https://docs.dndkit.com/presets/sortable
- https://docs.dndkit.com/api-documentation/context-provider

## Related Codebase Files

Recent fixes in the project:
- `/home/msmith/projects/2025slideheroes/.ai/reports/bug-reports/2025-12-11/1104-implementation-kanban-drag-drop-snap-back.md`
- `/home/msmith/projects/2025slideheroes/.ai/reports/bug-reports/2025-12-11/1106-implementation-kanban-closestcenter-collision.md`
