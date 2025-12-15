# Perplexity Research: dnd-kit Multi-Container Kanban over.data.current Undefined

**Date**: 2025-12-12
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro model)

## Query Summary

Researched why `over.data.current` becomes undefined when dropping on droppable containers in dnd-kit multi-column kanban boards, and identified the correct pattern for determining which column a card was dropped into.

## Findings

### Why over.data.current is Undefined

`over.data.current` is `undefined` because the `over` target is the **droppable container** (the column wrapper), not one of the sortable items that you passed a `data` prop to via `useSortable` / `SortableContext`.

**Key insight**: Only elements that are registered as sortable (or that you explicitly give `data` to) will have `over.data.current` populated. When you drop on the bare column container, there is no `data` and `over.data.current` is `undefined`.

### Correct Pattern for Multi-Container Kanban

The pattern dnd-kit recommends:

1. **Give every column and every card its own id**
   - Column ids: `"column-1"`, `"column-2"`, etc.
   - Card ids: `"task-1"`, `"task-2"`, etc.

2. **Wrap each column in its own `SortableContext`**
   - The `items` array contains **card ids for that column only**
   - `SortableContext` is per-column, not for all columns at once

3. **Use `over.id` and your data model to resolve the column** in `onDragEnd`:

```typescript
function onDragEnd({ active, over }: DragEndEvent) {
  if (!over) return;

  const activeId = active.id;
  const overId = over.id;

  // 1. If you dropped on a card, find its column by searching
  //    the columns' items for overId.
  const overColumnId = columns.find((col) =>
    col.cardIds.includes(overId)
  )?.id;

  // 2. If you dropped on an empty column area (no card under cursor),
  //    over.id will be the column id itself (if that column is a droppable),
  //    so you can treat overId directly as the column id:
  const targetColumnId =
    isColumnId(overId) ? overId : overColumnId;

  if (!targetColumnId) return;

  // Now you know which column the card was dropped into: targetColumnId.
  // Move activeId from its previous column to targetColumnId,
  // choosing the index using your own logic (e.g. end of list).
}
```

4. **Do not rely on `over.data.current` for determining the column**
   - Use `over.id` and your own column/task state (e.g. `columns` with `cardIds`)
   - Map: card id → column OR column id → column
   - Only use `over.data.current` if you attached a `data` object via `useSortable({ id, data: { ... } })`

### When to Use over.data.current vs over.id

**Use `over.id` directly when:**
- You are in a single sortable list and just need the new index
- The ID alone is enough to decide what to do (e.g. simple reordering)
- You can derive container/column from your data model by looking up which column contains that ID

**Use `over.data.current` when:**
- You need extra semantic info about the drop target (which column/container, what type, index, metadata)
- You have multiple containers/Kanban columns and must know which column you are over
- You want to distinguish between "column header drop area" vs "item area"
- You want to avoid encoding meaning into the ID string

**Example of using data property:**
```typescript
useSortable({
  id: item.id,
  data: {
    type: 'item',
    columnId,
    item,
    index,
  },
});

// Then in onDragOver/onDragEnd:
const overType = over?.data.current?.type;
const columnId = over?.data.current?.columnId;
```

### Droppable Containers vs Sortable Items

In a multi-column Kanban with dnd-kit:

**Sortable items (cards):**
- Use `useSortable`, which is both draggable and droppable
- Their IDs appear in the `items` array of a `SortableContext` for that column
- They act as drop targets within a list (for before/after positioning)
- When you hover a card, `over.id` is the item's ID

**Droppable containers (columns):**
- Use `useDroppable` directly (or a `SortableContext` that wraps the column's children)
- They are drop targets at the container level: "drop into this column"
- May have IDs like `"column-1"` and/or `data: {type: 'column', columnId: 'column-1'}`
- When you hover an empty column, `over.id` is that column's ID

**Pattern for multi-column boards:**
- For reordering within the same column: rely on sortable item droppables, `over.id` is another card's ID
- For moving between columns: detect whether `over` is a card or column drop zone using `over.data.current.type`

## Sources & Citations

Research conducted via Perplexity Chat API (sonar-pro model) with web search grounding. Citations provided in API responses but URLs not extracted due to API client limitation.

Official dnd-kit documentation:
- https://docs.dndkit.com/presets/sortable
- https://docs.dndkit.com

Community resources:
- YouTube: "How to create an awesome Kanban board using dnd-kit"
- Blog: https://www.chetanverma.com/blog/how-to-create-an-awesome-kanban-board-using-dnd-kit

## Key Takeaways

1. **`over.data.current` is undefined when dropping on containers** because containers don't have data unless explicitly set
2. **Use `over.id` + your data model** to determine which column a card was dropped into
3. **Each column gets its own `SortableContext`** with only that column's card IDs
4. **Don't rely on `over.data.current` for column detection** - it's optional metadata, not required
5. **Derive target column by looking up which column contains `over.id`** in your state

## Implementation Strategy

The idiomatic dnd-kit pattern for multi-container kanban:

1. Maintain state with columns containing arrays of card IDs
2. Each column renders a `SortableContext` with its card IDs
3. In `onDragEnd`, use `over.id` to find which column contains that card ID
4. If `over.id` is not found in any column's cards, assume it's a column ID itself (empty drop zone)
5. Update state by moving card from source column to target column

This avoids reliance on `over.data.current` and uses the data model as the source of truth.
