## Implementation Complete

### Summary
- Extended `handleDragEnd` function in kanban-board.tsx to handle drops onto task cards
- Added logic to look up target task's status when `over.id` is a task UUID (not a column ID)
- Removed unused `Task` import to fix lint error
- All validation commands pass (typecheck, lint, format)

### Files Changed
```
apps/web/app/home/(user)/kanban/_components/kanban-board.tsx | 42 +++++++++-----
```

### Commits
```
4168a4552 fix(canvas): handle drag-drop onto task cards in kanban board
```

### Validation Results
All validation commands passed successfully:
- `pnpm typecheck` - passed
- `pnpm lint:fix` - passed (fixed unused import)
- `pnpm format:fix` - passed

### Technical Details
The fix modifies the `handleDragEnd` callback (lines 84-125) to:

1. Check if `over.id` is a column ID ("do", "doing", "done")
2. If not a column ID, look up the task with that ID to find its status
3. Use the resolved status as the target column for the move
4. Only update if the target status differs from current status

This allows users to drop task cards onto other cards and have them move to that card's column, rather than snapping back to the original position.

### Follow-up Items
- Consider adding unit tests for the new drop-onto-card behavior
- Manual testing recommended to verify all drop scenarios work correctly

---
*Implementation completed by Claude*
