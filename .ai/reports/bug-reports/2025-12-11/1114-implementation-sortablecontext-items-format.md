## ✅ Implementation Complete

### Summary
- Fixed `SortableContext items` prop to pass ID array instead of task objects
- Changed `items={tasks}` to `items={tasks.map(t => t.id)}` in Column component (line 53)
- Added comprehensive unit tests for Column component verifying SortableContext receives ID array
- All validation commands passed: typecheck, lint, format, unit tests

### Root Cause
The `SortableContext` component from dnd-kit requires an array of string IDs for its `items` prop. Passing full task objects caused ID matching failures that broke the `over.data.current` property attachment, resulting in `targetStatus` remaining null and cards snapping back to their source column.

### Files Changed
```
apps/web/app/home/(user)/kanban/_components/column.tsx - Fixed SortableContext items prop
apps/web/app/home/(user)/kanban/_components/column.test.tsx - New unit tests (6 tests)
```

### Commits
```
d573fec3a fix(canvas): pass ID array to SortableContext instead of task objects
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm typecheck` - All 37 packages passed
- `pnpm lint` - No errors
- `pnpm format` - No issues
- Unit tests - 714 tests passed (including 6 new Column tests)

### Test Coverage
Added 6 unit tests for Column component:
1. Verifies SortableContext receives ID array, not task objects
2. Verifies empty tasks array shows drop hint (no SortableContext)
3. Verifies IDs are passed in correct order
4. Verifies task count badge renders
5. Verifies all task cards render
6. Verifies loading overlay shows for updating task

---
*Implementation completed by Claude*
