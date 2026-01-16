## Implementation Complete

### Summary

- Replaced `closestCenter` with `closestCorners` collision detection in kanban board
- Updated import statement on line 4 to import `closestCorners` instead of `closestCenter`
- Updated `collisionDetection` prop on line 199 to use `closestCorners`

### Files Changed

```
apps/web/app/home/(user)/kanban/_components/kanban-board.tsx | 4 +- (2 lines changed)
```

### Commits

```
4c011679a fix(canvas): use closestCorners collision detection for kanban board
```

### Validation Results

All validation commands passed successfully:

- `pnpm typecheck` - Passed (37 packages, 36 cached)
- `pnpm lint` - Passed (no new errors, pre-existing warnings unrelated to change)

### Technical Details

The `closestCenter` algorithm measured distance from the drag pointer to the center of ALL droppables (both columns AND task cards). For kanban layouts with asymmetrically-sized columns, this caused:

- Dragging from "To Do" (many items) to "In Progress" (few items) to fail because the algorithm would select a card in the source column rather than the target column
- Dragging from "In Progress" to "To Do" would work because the larger "To Do" column's center was closer

The `closestCorners` algorithm is explicitly recommended by dnd-kit for multi-container layouts like kanban boards because it considers the corners of droppables, making it more reliable for determining the intended drop target.

### Follow-up Items

None - this is a complete fix that addresses the root cause identified in issue #1105.

---

*Implementation completed by Claude*
