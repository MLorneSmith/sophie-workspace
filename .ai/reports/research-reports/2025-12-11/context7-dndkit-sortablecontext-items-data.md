# Context7 Research: dnd-kit SortableContext Items Format and Data Property Behavior

**Date**: 2025-12-11
**Agent**: context7-expert
**Libraries Researched**: @dnd-kit/core, @dnd-kit/sortable

## Query Summary

Researched four specific questions about dnd-kit SortableContext and useSortable usage:
1. What format does the `items` prop expect? Array of IDs or objects?
2. How does useSortable work when items are objects vs strings?
3. How does the `data` property get populated in the `over` object during drag events?
4. Why would `over.data.current` be undefined when we've set `data: { type: "card", containerId: status }` in useSortable?

## Key Findings

### 1. SortableContext `items` Prop Format

**Answer**: SortableContext accepts **both** formats, but with important caveats.

```typescript
// ✅ RECOMMENDED: Array of IDs (UniqueIdentifier[])
<SortableContext items={['task-1', 'task-2', 'task-3']}>
  {/* items */}
</SortableContext>

// ✅ ALSO WORKS: Array of objects with `id` property
<SortableContext items={[
  { id: 'task-1', title: 'Task 1' },
  { id: 'task-2', title: 'Task 2' },
]}>
  {/* items */}
</SortableContext>
```

**From TypeScript type definition**:

```typescript
interface SortableContextProps {
  items: (UniqueIdentifier | { id: UniqueIdentifier })[];
  // ...
}
```

**Key Insight**: When passing objects, dnd-kit **only uses the `id` property**. The rest of the object is ignored. For performance and clarity, **prefer passing just the IDs**.

**Current Implementation** (from `/home/msmith/projects/2025slideheroes/apps/web/app/home/(user)/kanban/_components/column.tsx` line 53):

```typescript
// ❌ WORKS BUT SUBOPTIMAL: Passing full task objects
<SortableContext items={tasks} strategy={rectSortingStrategy}>
  {tasks.map((task) => (
    <TaskCard key={task.id} task={task} />
  ))}
</SortableContext>

// ✅ RECOMMENDED: Pass just the IDs
<SortableContext items={tasks.map(t => t.id)} strategy={rectSortingStrategy}>
  {tasks.map((task) => (
    <TaskCard key={task.id} task={task} />
  ))}
</SortableContext>
```

**Why it matters**: Passing full objects causes unnecessary re-renders and comparison overhead. dnd-kit only needs the IDs to track sortable items.

### 2. useSortable with Objects vs Strings

**Answer**: `useSortable({ id })` works identically whether `id` is extracted from an object or passed as a string. The `id` parameter must be a `UniqueIdentifier` (string | number).

```typescript
// Pattern 1: Extract ID from object
const task = { id: 'task-1', title: 'Task 1' };
const { setNodeRef, attributes, listeners } = useSortable({
  id: task.id,  // string
  data: { type: 'card', containerId: 'todo' }
});

// Pattern 2: Direct string ID
const taskId = 'task-1';
const { setNodeRef, attributes, listeners } = useSortable({
  id: taskId,  // string
  data: { type: 'card', containerId: 'todo' }
});
```

**Key Point**: useSortable doesn't care about the source of the ID - it only requires a unique identifier. The `data` property is where you store additional metadata.

**Current Implementation** (from `/home/msmith/projects/2025slideheroes/apps/web/app/home/(user)/kanban/_components/task-card.tsx` lines 38-41):

```typescript
const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
  id: task.id,  // ✅ Correctly uses ID from task object
  data: { type: "card", containerId: task.status },  // ✅ Correct data property pattern
});
```

**This is the correct pattern** - no issues here.

### 3. How the `data` Property Gets Populated in `over.data.current`

**Answer**: The `data` property is **manually set** by you when configuring `useDroppable` or `useSortable`. It is NOT automatically populated by dnd-kit.

**The Flow**:

1. You define `data` when setting up droppables/sortables
2. dnd-kit stores this data internally
3. During drag events, dnd-kit populates `over.data.current` with the data from the drop target

**Example**:

```typescript
// Step 1: Define data on droppable container
function Column({ id }) {
  const { setNodeRef } = useDroppable({
    id: id,
    data: { type: 'column' },  // ← You set this
  });
}

// Step 2: Define data on sortable item
function TaskCard({ task }) {
  const { setNodeRef } = useSortable({
    id: task.id,
    data: { type: 'card', containerId: task.status },  // ← You set this
  });
}

// Step 3: Access data in drag handler
function handleDragEnd(event: DragEndEvent) {
  const overData = event.over?.data.current;
  //                           ↑ dnd-kit populates this from your defined data
  
  if (overData?.type === 'column') {
    // Dropped on column
  } else if (overData?.type === 'card') {
    // Dropped on card - access containerId
    const targetColumn = overData.containerId;
  }
}
```

**CRITICAL CLARIFICATION**: There is a common misconception that `SortableContext` automatically adds `containerId` to items. **THIS IS FALSE**.

From the official dnd-kit documentation:

> The `SortableContext` component also optionally accepts an `id` prop. If an `id` is not provided, one will be auto-generated for you. The `id` prop is for advanced use cases. **If you're building custom sensors, you'll have access to each sortable element's `data` prop, which will contain the `containerId` associated to that sortable context.**

**What this actually means**:
- SortableContext CAN provide a `sortable.containerId` property in the data
- This is ONLY accessible when building custom sensors
- This is NOT available in standard `over.data.current` during drag events
- You MUST manually set `containerId` in your item's `data` property

**Correct Pattern** (what our code does):

```typescript
// ✅ CORRECT: Manually set containerId in useSortable data
const { setNodeRef } = useSortable({
  id: task.id,
  data: { type: 'card', containerId: task.status }  // ← YOU must set this
});
```

**Incorrect Assumption**:

```typescript
// ❌ WRONG: Assuming SortableContext auto-populates containerId
<SortableContext id="todo" items={tasks}>
  {/* containerId is NOT automatically added to item data */}
</SortableContext>
```

### 4. Why Would `over.data.current` Be Undefined?

**Answer**: `over.data.current` can be undefined in several scenarios:

#### Scenario 1: No `data` Property Defined (Most Common)

```typescript
// ❌ PROBLEM: No data property set
const { setNodeRef } = useSortable({
  id: task.id,
  // Missing: data property
});

// Result: event.over.data.current is undefined
```

**Solution**: Always define a `data` property:

```typescript
// ✅ SOLUTION
const { setNodeRef } = useSortable({
  id: task.id,
  data: { type: 'card', containerId: task.status }
});
```

#### Scenario 2: Collision Detection Returns No Match

```typescript
function handleDragEnd(event: DragEndEvent) {
  const { over } = event;
  
  // If no collision detected, over is null
  if (!over) {
    console.log('Dropped outside any drop target');
    return;
  }
  
  // Now safe to access over.data.current
  const overData = over.data.current;
}
```

#### Scenario 3: Timing Issues with React State Updates

If the `data` property depends on state that hasn't updated yet:

```typescript
// ⚠️ POTENTIAL ISSUE: Stale closure
useEffect(() => {
  // If containerId comes from state, ensure it's fresh
}, [task.status]);

const { setNodeRef } = useSortable({
  id: task.id,
  data: { type: 'card', containerId: task.status }  // Ensure task.status is current
});
```

#### Scenario 4: TypeScript Type Narrowing

```typescript
// ❌ PROBLEM: Type narrowing issues
const overData = over.data.current as { type: string; containerId: string } | undefined;

if (overData.type === 'card') {  // ← Error if overData is undefined
  // ...
}

// ✅ SOLUTION: Check for undefined first
if (overData?.type === 'card') {  // ← Optional chaining
  const containerId = overData.containerId;
}
```

**Current Implementation Analysis** (from `/home/msmith/projects/2025slideheroes/apps/web/app/home/(user)/kanban/_components/kanban-board.tsx` lines 98-109):

```typescript
// ✅ CORRECT PATTERN - Handles all scenarios
const overData = over.data.current as
  | { type: "column" }
  | { type: "card"; containerId: TaskStatus }
  | undefined;  // ← Explicitly handles undefined case

if (overData?.type === "column") {
  targetStatus = over.id as TaskStatus;
} else if (overData?.type === "card") {
  targetStatus = overData.containerId;
}
```

**This implementation is correct** and handles the undefined case properly with optional chaining (`overData?.type`).

## Summary of Answers

| Question | Answer |
|----------|--------|
| **1. SortableContext items format?** | Both IDs and objects work, but IDs are recommended for performance. Objects must have an `id` property. |
| **2. useSortable with objects vs strings?** | Works identically - only the `id` value matters, not its source. |
| **3. How does `data` get populated?** | You manually set it in `useDroppable`/`useSortable`. dnd-kit stores it and returns it in `over.data.current` during drag events. SortableContext does NOT auto-populate `containerId` - you must set it manually. |
| **4. Why is `over.data.current` undefined?** | Missing `data` property definition, no collision detected, or timing issues. Always use optional chaining (`overData?.type`). |

## Code Recommendations

### Current Implementation Status: ✅ CORRECT

The current kanban board implementation is correct:

1. ✅ TaskCard sets `data: { type: "card", containerId: task.status }` in useSortable
2. ✅ Column sets `data: { type: "column" }` in useDroppable  
3. ✅ handleDragEnd uses optional chaining to safely access `overData?.type`
4. ✅ Type discrimination pattern correctly identifies column vs card drops

### Potential Optimization

**Current** (column.tsx line 53):

```typescript
<SortableContext items={tasks} strategy={rectSortingStrategy}>
```

**Optimized**:

```typescript
<SortableContext items={tasks.map(t => t.id)} strategy={rectSortingStrategy}>
```

**Benefit**: Reduces unnecessary re-renders by passing only IDs instead of full task objects.

## Common Pitfalls to Avoid

1. **Don't assume SortableContext auto-populates containerId** - It doesn't. You must manually set it in `useSortable` data.

2. **Don't forget optional chaining** when accessing `over.data.current`:
   ```typescript
   // ❌ BAD
   if (over.data.current.type === 'card') { }
   
   // ✅ GOOD
   if (over.data.current?.type === 'card') { }
   ```

3. **Don't pass unnecessary data to SortableContext** - Only IDs are needed:
   ```typescript
   // ❌ SUBOPTIMAL
   <SortableContext items={fullTaskObjects} />
   
   // ✅ OPTIMAL
   <SortableContext items={taskIds} />
   ```

4. **Don't forget to type `over.data.current`** - TypeScript won't infer the structure:
   ```typescript
   const overData = over.data.current as 
     | { type: 'column' }
     | { type: 'card'; containerId: string }
     | undefined;
   ```

## Architecture Pattern Summary

```
DndContext (collision detection)
├── Column (useDroppable with data: { type: 'column' })
│   └── SortableContext (items: string[] or object[])
│       └── TaskCard (useSortable with data: { type: 'card', containerId })
├── Column
│   └── SortableContext
│       └── TaskCard
└── Column
    └── SortableContext
        └── TaskCard

During drag:
- active.data.current = data from dragged item's useSortable
- over.data.current = data from drop target's useDroppable or useSortable
```

## Related Research

This research synthesizes findings from:
- `/home/msmith/projects/2025slideheroes/.ai/reports/research-reports/2025-12-11/context7-dndkit-dragevent-collision.md`
- `/home/msmith/projects/2025slideheroes/.ai/reports/research-reports/2025-12-11/context7-dndkit-kanban-container-detection.md`
- `/home/msmith/projects/2025slideheroes/.ai/reports/research-reports/2025-12-11/perplexity-dndkit-container-identification-solutions.md`
- Current kanban implementation in `/home/msmith/projects/2025slideheroes/apps/web/app/home/(user)/kanban/_components/`

## Sources

- @dnd-kit/core type definitions
- @dnd-kit/sortable documentation
- Official dnd-kit SortableContext API documentation
- Codebase analysis of current kanban implementation
