# Perplexity Research: dnd-kit over.data.current Undefined/Stale Issues

**Date**: 2025-12-11
**Agent**: perplexity-expert
**Search Type**: Search API + Chat API

## Query Summary

Investigated common bugs where `over.data.current` is undefined or returns wrong/stale data in dnd-kit when using `useSortable`, specifically in Kanban board scenarios with:
1. Columns using `useDroppable({ id, data: { type: "column" } })`
2. TaskCards using `useSortable({ id: task.id, data: { type: "card", containerId: task.status } })`
3. `closestCorners` collision detection

## Findings

### Key Issue: `data` is a Snapshot, Not Reactive

**CRITICAL**: The `data` prop passed to `useSortable`/`useDraggable`/`useDroppable` is **snapshotted when the drag starts** and does **NOT** update reactively during the drag operation.

- `useSortable` wraps `useDraggable`/`useDroppable`, which accept a `data` option stored on the node
- When drag starts, dnd-kit captures the `data` snapshot and reuses it for the entire drag
- React state changes during drag **do not** re-write the stored `data` object
- Updated `data` only applies to the **next drag** when hooks re-run with new props

**Implication for Kanban Boards**:
If you update `task.status` during drag (e.g., in `onDragMove`), the `data.containerId` in `event.over.data.current` will still reflect the **original status at drag start**, not the updated value.

### Common Causes for `undefined` or Wrong `data.current`

#### 1. **Draggable/Droppable Unmounting During Drag**
- **Most common root cause**: If the active item or droppable unmounts mid-drag, `data.current` becomes `{}` or `undefined`
- Happens in Kanban when:
  - Conditionally rendering columns/cards based on drag state
  - Remapping lists in ways that change React keys
  - Removing active item from DOM during drag
- **Fix**: Ensure dragged item and all droppables **stay mounted** for entire drag
  - Use `<DragOverlay>` for visual replacement instead of unmounting
  - Don't conditionally remove/re-key items based on `active`/`over` during drag

#### 2. **ID Collisions Between Draggable and Droppable**
- When `useDraggable` and `useDroppable` share the same ID (e.g., both `"0"`), `active.data.current` can be missing
- Numeric `0` as ID can be treated as falsy in internal logic
- **Fix**: Make all IDs unique across entire DnD tree
  - Prefer string IDs with type prefixes: `card-${id}`, `column-${id}`
  - Never share IDs between items and containers

#### 3. **Passing `data` Before Refs/Props Are Ready**
- If `data` depends on values computed in `useEffect` or layout info, it may be `null`/`undefined` on first render
- **Fix**: Make `data` a **stable, serializable snapshot**
  - Avoid deriving from refs or effect-computed values
  - Don't compute from values that might be `null` on first render

#### 4. **Complex Re-renders Changing Item Identity Mid-Drag**
- Rebuilding arrays in ways that change keys or component structure while dragging
- Common in Kanban when recalculating filters/sorts/groups based on `active`/`over`
- **Fix**: Use **stable React keys** (real IDs, not indices)
  - Keep list structure stable during drag
  - Update state in `onDragEnd`, not live-mutating during drag

#### 5. **Not Passing `data` to Droppable/Sortable**
- `over.data.current` only populated if you passed `data` to `useDroppable`/`useSortable`
- **Fix**: On every droppable/sortable you inspect as `over`, pass `data` object:
  ```ts
  const { setNodeRef } = useSortable({
    id: column.id,
    data: { type: 'column', columnId: column.id }
  });
  ```

#### 6. **Wrong Node for Sortable/Droppable**
- If `listeners` element differs from `setNodeRef` element, you might read `over` for wrong element
- **Fix**: Ensure element with `setNodeRef` has the `data` you expect

#### 7. **State Updates in Drag Handlers Unmounting Active Item**
- Setting state in `onDragStart`/`onDragMove` can alter tree and unmount original node
- **Fix**: Be conservative with state updates inside drag handlers
  - Use `useDndContext()` from Overlay/mounted component instead of wiring state yourself

#### 8. **Next.js/SSR Edge Cases**
- SSR + client-only refs can cause missing rect data and node refs
- **Fix**: Ensure DnD components render **client-side only**
  - Guard with `typeof window !== 'undefined'`
  - Avoid dynamic imports that delay mounting mid-drag

### Practical Checklist for Kanban Boards

When `over.data.current` is undefined or wrong:

1. **Verify IDs**
   - No shared ID between draggable and droppable
   - No numeric `0` IDs; use strings like `"card-0"`

2. **Verify `data` is Set**
   - Every `useSortable`/`useDroppable` used in `over` has a `data` object, not `undefined`

3. **Check for Unmounts**
   - Add `useEffect` cleanup to log unmounts:
     ```ts
     useEffect(() => {
       return () => console.log('UNMOUNT', id);
     }, [id]);
     ```
   - If active item logs "UNMOUNT" during drag, that's the cause

4. **Stabilize Keys and Structure**
   - Keys are stable IDs, not indices
   - Don't conditionally hide/recreate active/over node during drag

5. **Minimize State Churn During Drag**
   - Avoid heavy list/state reshapes in `onDragStart`/`onDragMove`
   - Prefer `useDndContext().active`/`.over` for transient UI instead of app state

6. **Derive Latest State in Handlers**
   - Don't rely on `data.current` for updated values
   - Look up current state by `id` in your store/state instead

### Workarounds for Stale `data.containerId`

Since `data` is a snapshot:

**Option 1: Derive in Handlers**
```ts
const handleDragEnd = (event) => {
  const { active, over } = event;
  
  // Don't trust data.current for current state
  const currentTask = tasks.find(t => t.id === active.id);
  const currentContainer = currentTask?.status; // Get from app state
  
  // Use this instead of active.data.current.containerId
};
```

**Option 2: Use `useDndContext()` in Overlay**
```ts
function DragOverlayContent() {
  const { active } = useDndContext();
  
  if (!active || !active.data.current?.content) return null;
  
  const content = active.data.current.content;
  // Access latest state directly, don't rely on stale data
  return <DraggedItem {...content} />;
}
```

**Option 3: Context Pattern for Dragged Props**
Create a React context to track dragged entity props, updated when `isDragging` is true from `useSortable`.

### Re-render Performance Issues

Related findings on re-renders with `useSortable`:

- **Every sortable item re-renders** on drag start, even with `React.memo()`
- Caused by `DndContext` updating `activeSensor`/`activatorEvent` state on mousedown
- All consumers of `DndContext` re-render (including via `SortableContext`)
- **Workarounds**:
  - Wrap items with `React.memo()` and custom comparison function
  - Debounce `onDragOver` (75ms balanced performance vs UX)
  - Remove `items` array changes in `onDragMove`, rely on `DragOverlay` instead
  - Move everything beside `useSortable` to memoized component

## Sources & Citations

1. [dnd-kit Documentation - useSortable](https://docs.dndkit.com/presets/sortable/usesortable)
2. [dnd-kit Documentation - Sortable](https://docs.dndkit.com/presets/sortable)
3. [GitHub Issue #182: Documentation code for Sortable with Typescript not working](https://github.com/clauderic/dnd-kit/issues/182)
4. [GitHub Issue #714: Drag into a Sortable list item](https://github.com/clauderic/dnd-kit/issues/714)
5. [GitHub Issue #794: active.data.current gets lost "on drag end"](https://github.com/clauderic/dnd-kit/issues/794)
6. [GitHub Issue #1379: useSortable re-renders all items even with just clicking one item, affecting performance](https://github.com/clauderic/dnd-kit/issues/1379)
7. [GitHub Issue #994: Sortable functionality causes every item to be re-rendered during dragging](https://github.com/clauderic/dnd-kit/issues/994)
8. [Zenn Article: React drag & drop library, dnd kit preset (Japanese)](https://zenn.dev/castingone_dev/articles/dndkit_sortalbe)

## Key Takeaways

1. **`data` is a snapshot at drag start, not reactive** - derive latest state from app store instead
2. **Unmounting during drag is #1 cause of `undefined` data** - use `<DragOverlay>` and stable structure
3. **ID collisions cause data loss** - use prefixed string IDs (`card-${id}`, `column-${id}`)
4. **Always pass `data` to droppables you inspect** - `over.data.current` only exists if you set it
5. **Stabilize keys and minimize state changes during drag** - update in `onDragEnd`, not `onDragMove`
6. **Performance degrades with >50 items** - use `React.memo()`, debounce `onDragOver`, minimize re-renders

## Related Searches

For Kanban-specific collision detection and container identification:
- See `perplexity-dndkit-container-identification-solutions.md`
- See `perplexity-dndkit-kanban-collision-asymmetric.md`
- See `perplexity-dndkit-kanban-snap-back-solutions.md`
