# Perplexity Research: dnd-kit SortableContext Items Format and Data Property

**Date**: 2025-12-11
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API

## Query Summary

Investigated whether the format of `SortableContext` items prop (array of objects vs array of IDs) affects whether `useSortable`'s data property is properly attached to drag event nodes, specifically whether `over.data.current` contains the data from useSortable.

## Key Findings

### Critical Answer: Items Format Does NOT Affect Data Property

**The format of `SortableContext.items` does NOT control whether `useSortable` data is attached to `over.data.current`.**

The `data` property attachment is independent of the `items` array format. What matters is:

1. **Items prop MUST be array of IDs**: According to official documentation, `SortableContext.items` must be "a sorted array of the unique identifiers associated with the elements that use the `useSortable` hook"
2. **Data attachment is ID-based**: The `data` you pass to `useSortable({ id, data: {...} })` is attached based on the sortable's `id`, regardless of your list state structure
3. **Inherited from core hooks**: This mechanism is inherited from `useDraggable`/`useDroppable` in `@dnd-kit/core`, where data attachment is based on element ID

### When over.data.current is Undefined

If `over.data.current` is undefined, the likely causes are:

1. **No data passed to useSortable**: You didn't provide a `data` option in `useSortable({ id, data: {...} })`
2. **Over target is not sortable**: The `over` element is not a sortable item (e.g., plain droppable or empty area)
3. **ID mismatch**: The `id` used in `useSortable` doesn't match the ID in `SortableContext.items` array
4. **Multiple @dnd-kit/core versions**: Common issue causing hooks to fail silently

## Current Implementation Issue

In your kanban board (`column.tsx` line 53):

```tsx
<SortableContext items={tasks} strategy={rectSortingStrategy}>
```

**Problem**: You're passing full `Task[]` objects instead of IDs.

**Correct pattern** (see `sortable-slide-list.tsx` lines 92-93):

```tsx
<SortableContext items={slides.map((slide) => slide.id)} strategy={verticalListSortingStrategy}>
```

### Why Array of Objects Can Work But Shouldn't

While passing objects *can* work in some cases (if dnd-kit coerces them to strings), it:

1. **Violates the API contract** - Documentation explicitly requires IDs
2. **Can cause unexpected behavior** - Index/lookup bugs, performance issues
3. **May cause ID matching failures** - Leading to undefined `data` properties

## Recommended Fix

Change line 53 in `column.tsx`:

```tsx
// Before (incorrect)
<SortableContext items={tasks} strategy={rectSortingStrategy}>

// After (correct)
<SortableContext items={tasks.map(t => t.id)} strategy={rectSortingStrategy}>
```

This ensures proper ID matching between `SortableContext.items` and `useSortable({ id })`.

## Supporting Evidence from GitHub Issues

### Issue #845: Sortable not working with Array of Objects

User reported sortable items "snapping back" when using array of objects. Solution:

```typescript
// Wrong: indexOf with objects fails
const oldIndex = items.indexOf(active.id);
const newIndex = items.indexOf(over.id);

// Correct: findIndex to match IDs
const oldIndex = items.findIndex(item => item.id === active.id);
const newIndex = items.findIndex(item => item.id === over.id);
```

This demonstrates that using objects requires different handling logic and is error-prone.

### Issue #182: useSortable Not Working

Multiple users reported `useSortable` silently failing. Root cause: **multiple versions of `@dnd-kit/core`** installed.

**Diagnostic**: If `useDraggable`/`useDroppable` work but `useSortable` doesn't, check for duplicate core versions.

**Solution**: 
```bash
npx yarn-deduplicate
# or remove and reinstall @dnd-kit packages
```

### Issue #714: Drag into Sortable List Item

Advanced pattern showing `data.type` usage for mixed draggable/sortable components:

```typescript
useSortable({ id, data: { type: 'folder' } })
useSortable({ id, data: { type: 'survey' } })
```

Then in collision detection:

```typescript
const overType = overContainer?.data?.current?.type;
if (overType === 'folder') {
  // Handle folder drop
}
```

This confirms `over.data.current` works when properly configured with ID matching.

## Official Documentation Quotes

> "It requires that you pass it a sorted array of the unique identifiers associated with the elements that use the `useSortable` hook within it."
> 
> — [SortableContext Documentation](https://docs.dndkit.com/presets/sortable/sortable-context)

> "The argument passed to the `id` argument of `useSortable` should match the `id` passed in the `items` array of the parent `SortableContext` provider."
> 
> — [useSortable Documentation](https://docs.dndkit.com/presets/sortable/usesortable)

## Related Searches

- Kanban board collision detection strategies
- dnd-kit container identification patterns
- Handling drag-drop between multiple SortableContexts

## Key Takeaways

1. **Always use array of IDs** for `SortableContext.items` prop
2. **Data property attachment is ID-based**, not format-based
3. **ID matching is critical** - mismatch causes undefined `data`
4. **Check for duplicate dependencies** if hooks fail silently
5. **Your current implementation violates API contract** and should be fixed

## Implementation Checklist

- [ ] Change `<SortableContext items={tasks}>` to `items={tasks.map(t => t.id)}`
- [ ] Verify `TaskCard` uses `useSortable({ id: task.id, data: {...} })`
- [ ] Check `handleDragEnd` uses `findIndex` instead of `indexOf` if needed
- [ ] Run `pnpm list @dnd-kit/core` to verify single version
- [ ] Test drag-drop behavior after fix
