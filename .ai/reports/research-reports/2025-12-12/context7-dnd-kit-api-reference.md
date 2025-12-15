# dnd-kit API Reference Documentation

**Date**: 2025-12-12
**Agent**: context7-expert
**Libraries Researched**: clauderic/dnd-kit (v6.0.8 core, v7.0.2 sortable)

## Query Summary

Retrieved comprehensive API documentation for dnd-kit focusing on:
1. DndContext and DragEndEvent - specifically the `over` property
2. useDroppable hook - specifically the `data` property and how it appears on `over.data.current`
3. SortableContext - the items prop and how it affects collision detection
4. closestCorners collision detection algorithm

**Goal**: Debug issue where dropping a card on a column's droppable area is not correctly being detected - `over.data.current` may be undefined or incorrect.

## Context7 Limitation

Context7 has **very limited** documentation for dnd-kit (only basic setup/modifier examples). The comprehensive API reference was retrieved from **local TypeScript definitions** in `node_modules/.pnpm/@dnd-kit+core@6.0.8/` and `node_modules/.pnpm/@dnd-kit+sortable@7.0.2/`.

## Key Type Definitions

### 1. DragEndEvent Structure

**Location**: `@dnd-kit/core/dist/types/events.d.ts`

```typescript
interface DragEvent {
    activatorEvent: Event;
    active: Active;
    collisions: Collision[] | null;
    delta: Translate;
    over: Over | null;  // <-- Can be null!
}

export interface DragEndEvent extends DragEvent {}
```

**CRITICAL**: `over` can be `null` if the drag operation ends without being over any droppable container.

### 2. Over Interface

**Location**: `@dnd-kit/core/dist/store/types.d.ts`

```typescript
export interface Over {
    id: UniqueIdentifier;
    rect: ClientRect;
    disabled: boolean;
    data: DataRef;  // <-- This is a MutableRefObject!
}

// DataRef definition
export declare type DataRef<T = AnyData> = MutableRefObject<Data<T> | undefined>;
export declare type Data<T = AnyData> = T & AnyData;
```

**CRITICAL FINDING**: `over.data` is a `MutableRefObject`, NOT a plain object!
- Access via: `over.data.current` (NOT `over.data`)
- `over.data.current` can be `undefined` if no data was passed to `useDroppable`

### 3. useDroppable Hook

**Location**: `@dnd-kit/core/dist/hooks/useDroppable.d.ts`

```typescript
export interface UseDroppableArguments {
    id: UniqueIdentifier;
    disabled?: boolean;
    data?: Data;  // <-- Optional! If not provided, data.current will be undefined
    resizeObserverConfig?: ResizeObserverConfig;
}

export declare function useDroppable({
    data,
    disabled,
    id,
    resizeObserverConfig,
}: UseDroppableArguments): {
    active: Active | null;
    rect: MutableRefObject<ClientRect | null>;
    isOver: boolean;
    node: MutableRefObject<HTMLElement | null>;
    over: Over | null;
    setNodeRef: (element: HTMLElement | null) => void;
};
```

**Key Points**:
1. `data` parameter is **optional**
2. If `data` is not passed, `over.data.current` will be `undefined`
3. Must pass `data` to `useDroppable` for it to appear in `over.data.current`

### 4. SortableContext Items Prop

**Location**: `@dnd-kit/sortable/dist/components/SortableContext.d.ts`

```typescript
export interface Props {
    children: React.ReactNode;
    items: (UniqueIdentifier | { id: UniqueIdentifier })[];  // <-- Array of IDs OR objects with id
    strategy?: SortingStrategy;
    id?: string;
    disabled?: boolean | Disabled;
}

interface ContextDescriptor {
    activeIndex: number;
    containerId: string;
    disabled: Disabled;
    disableTransforms: boolean;
    items: UniqueIdentifier[];  // <-- Normalized to ID array
    overIndex: number;
    useDragOverlay: boolean;
    sortedRects: ClientRect[];
    strategy: SortingStrategy;
}
```

**Key Points**:
1. `items` can be array of IDs (`UniqueIdentifier[]`) OR objects with `id` property
2. Internally normalized to `UniqueIdentifier[]`
3. SortableContext uses these IDs to determine sorting behavior
4. **Does NOT directly affect collision detection** - that's handled by DndContext

### 5. SortableData Type

**Location**: `@dnd-kit/sortable/dist/types/data.d.ts`

```typescript
export declare type SortableData = {
    sortable: {
        containerId: UniqueIdentifier;
        items: UniqueIdentifier[];
        index: number;
    };
};
```

**Location**: `@dnd-kit/sortable/dist/types/type-guard.d.ts`

```typescript
export declare function hasSortableData<T extends Active | Over | DraggableNode | DroppableContainer>(
    entry: T | null | undefined
): entry is T & {
    data: {
        current: Data<SortableData>;
    };
};
```

**Key Points**:
1. `useSortable` automatically adds `sortable` data to both draggable AND droppable
2. Use `hasSortableData(over)` type guard to check if data exists
3. If using `useSortable`, `over.data.current.sortable` will contain `containerId`, `items`, and `index`

### 6. Collision Detection Algorithm

**Location**: `@dnd-kit/core/dist/utilities/algorithms/types.d.ts`

```typescript
export interface Collision {
    id: UniqueIdentifier;
    data?: Data;  // <-- Optional!
}

export interface CollisionDescriptor extends Collision {
    data: {
        droppableContainer: DroppableContainer;
        value: number;
        [key: string]: any;
    };
}

export declare type CollisionDetection = (args: {
    active: Active;
    collisionRect: ClientRect;
    droppableRects: RectMap;
    droppableContainers: DroppableContainer[];
    pointerCoordinates: Coordinates | null;
}) => Collision[];
```

**Location**: `@dnd-kit/core/dist/utilities/algorithms/closestCorners.d.ts`

```typescript
/**
 * Returns the closest rectangles from an array of rectangles to the corners of
 * another rectangle.
 */
export declare const closestCorners: CollisionDetection;
```

**Key Points**:
1. `closestCorners` finds the droppable container whose corners are closest to the dragged item
2. Returns array of `Collision` objects with `id` and optional `data`
3. The collision with the highest score becomes the `over` in drag events
4. Algorithm considers **all four corners** of both rectangles

## Common Pitfalls & Solutions

### Issue 1: `over.data.current` is undefined

**Cause**: `useDroppable` was called without passing `data` parameter

**Solution**:
```typescript
// ❌ Wrong - no data passed
const { setNodeRef } = useDroppable({ id: 'column-1' });

// ✅ Correct - data passed
const { setNodeRef } = useDroppable({
    id: 'column-1',
    data: { type: 'column', columnId: 'column-1' }
});
```

### Issue 2: Accessing data incorrectly

**Cause**: Trying to access `over.data` instead of `over.data.current`

**Solution**:
```typescript
// ❌ Wrong - data is a MutableRefObject
const columnId = over.data.columnId;

// ✅ Correct - access via .current
const columnId = over.data.current?.columnId;
```

### Issue 3: SortableContext items not affecting droppable detection

**Cause**: Misunderstanding that SortableContext items affect collision detection

**Reality**: 
- `SortableContext` only manages sorting behavior within a container
- Collision detection happens at the `DndContext` level
- To make a column droppable, you MUST use `useDroppable` or `useSortable`

**Solution**:
```typescript
// For a column that contains sortable items
function Column({ id, items }) {
    // useSortable makes this BOTH draggable AND droppable
    const { setNodeRef } = useSortable({
        id,
        data: { type: 'column', columnId: id }
    });
    
    return (
        <div ref={setNodeRef}>
            <SortableContext items={items}>
                {items.map(item => <SortableItem key={item} id={item} />)}
            </SortableContext>
        </div>
    );
}

// OR for a column that only receives drops (not draggable itself)
function Column({ id, items }) {
    const { setNodeRef } = useDroppable({
        id,
        data: { type: 'column', columnId: id }  // <-- Must pass data!
    });
    
    return (
        <div ref={setNodeRef}>
            <SortableContext items={items}>
                {items.map(item => <SortableItem key={item} id={item} />)}
            </SortableContext>
        </div>
    );
}
```

### Issue 4: Collision detection not finding droppable areas

**Causes**:
1. Droppable element not rendered or has zero size
2. `disabled: true` on the droppable
3. Ref not properly attached (`setNodeRef` not called)
4. Wrong collision detection algorithm for use case

**Solutions**:
```typescript
// 1. Ensure element has size
<div ref={setNodeRef} style={{ minHeight: '100px' }}>

// 2. Check disabled prop
const { setNodeRef } = useDroppable({ id, disabled: false });

// 3. Verify ref attachment
const { setNodeRef } = useDroppable({ id });
<div ref={setNodeRef}>  // <-- Must attach ref!

// 4. Try different collision algorithm
<DndContext collisionDetection={closestCenter}>  // Instead of closestCorners
```

## Debugging Checklist

When `over.data.current` is undefined or incorrect:

1. **Check if `over` exists at all**:
   ```typescript
   function handleDragEnd(event: DragEndEvent) {
       console.log('over:', event.over);  // Is this null?
       if (!event.over) {
           console.log('No droppable detected!');
           return;
       }
   }
   ```

2. **Check if data was passed to useDroppable**:
   ```typescript
   const { setNodeRef } = useDroppable({
       id: columnId,
       data: { type: 'column', columnId }  // <-- Is this here?
   });
   ```

3. **Access data correctly via .current**:
   ```typescript
   console.log('over.data:', event.over.data);           // MutableRefObject
   console.log('over.data.current:', event.over.data.current);  // Actual data
   ```

4. **Verify ref is attached**:
   ```typescript
   <div ref={setNodeRef}>  // <-- Is this present?
   ```

5. **Check droppable is not disabled**:
   ```typescript
   console.log('over.disabled:', event.over.disabled);  // Should be false
   ```

6. **Verify collision detection is working**:
   ```typescript
   function handleDragMove(event: DragMoveEvent) {
       console.log('collisions:', event.collisions);  // Are any detected?
   }
   ```

## Code Examples

### Example 1: Kanban Board with Droppable Columns

```typescript
import { DndContext, closestCorners, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';

function KanbanBoard() {
    const columns = ['todo', 'in-progress', 'done'];
    
    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        
        // Check if dropped over a valid droppable
        if (!over) {
            console.log('Dropped outside any droppable area');
            return;
        }
        
        // Access data via .current
        const overData = over.data.current;
        
        if (!overData) {
            console.log('No data attached to droppable!');
            return;
        }
        
        console.log('Dropped on column:', overData.columnId);
    }
    
    return (
        <DndContext 
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
        >
            {columns.map(columnId => (
                <Column key={columnId} id={columnId} />
            ))}
        </DndContext>
    );
}

function Column({ id }: { id: string }) {
    // useSortable makes column both draggable and droppable
    const { setNodeRef } = useSortable({
        id,
        data: { 
            type: 'column',
            columnId: id 
        }  // <-- This appears in over.data.current
    });
    
    const tasks = useTasksForColumn(id);
    
    return (
        <div ref={setNodeRef}>
            <h3>{id}</h3>
            <SortableContext items={tasks.map(t => t.id)}>
                {tasks.map(task => (
                    <Task key={task.id} task={task} />
                ))}
            </SortableContext>
        </div>
    );
}
```

### Example 2: Using Type Guards

```typescript
import { hasSortableData } from '@dnd-kit/sortable';

function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (!over) return;
    
    // Type guard checks if over.data.current exists and has sortable data
    if (hasSortableData(over)) {
        console.log('Dropped on sortable:', over.data.current.sortable.containerId);
        console.log('At index:', over.data.current.sortable.index);
    } else {
        console.log('Dropped on non-sortable droppable');
        console.log('Custom data:', over.data.current);
    }
}
```

## Sources

- **@dnd-kit/core@6.0.8** - TypeScript definitions
- **@dnd-kit/sortable@7.0.2** - TypeScript definitions
- **Location**: `/home/msmith/projects/2025slideheroes/node_modules/.pnpm/`

## Key Takeaways

1. **`over.data` is a MutableRefObject** - Always access via `over.data.current`
2. **`data` parameter is optional** - If not passed to `useDroppable`, `over.data.current` is `undefined`
3. **`over` can be null** - Always check `if (!over) return;` before accessing properties
4. **SortableContext items don't make columns droppable** - Must use `useDroppable` or `useSortable`
5. **useSortable automatically adds sortable data** - Includes `containerId`, `items`, and `index`
6. **Collision detection happens at DndContext level** - SortableContext only manages sorting within containers
7. **closestCorners checks all four corners** - Use `closestCenter` for different behavior

## Next Steps for Debugging

1. Add extensive logging to `handleDragEnd`:
   ```typescript
   console.log('Full event:', event);
   console.log('over:', event.over);
   console.log('over.data:', event.over?.data);
   console.log('over.data.current:', event.over?.data.current);
   ```

2. Verify `useDroppable`/`useSortable` is called with `data` parameter

3. Check that `setNodeRef` is attached to the droppable element

4. Ensure droppable element has measurable size (not display:none or 0px height)

5. Try different collision detection algorithms if needed

