# Bug Fix: Kanban drag-drop fails when dropping card onto another card

**Related Diagnosis**: #1103 (REQUIRED)
**Severity**: medium
**Bug Type**: ui
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `handleDragEnd` function only checks if `over.id` is a column ID, not handling the case where user drops onto another task card
- **Fix Approach**: When `over.id` is a task UUID, look up that task's status to determine the target column
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Users expect to be able to drag a task card from one kanban column and drop it onto another card in a different column. Currently, this causes the card to snap back to its original position because the `handleDragEnd` function doesn't handle drops where `event.over.id` is a task UUID. The function only processes drops where `over.id` matches a column ID ("do", "doing", "done").

For full details, see diagnosis issue #1103.

### Solution Approaches Considered

#### Option 1: Extend drop target detection ⭐ RECOMMENDED

**Description**: Modify the `handleDragEnd` function to detect when a user drops onto a task card by checking if `over.id` is a task UUID, then look up that task's status to determine the target column.

**Pros**:
- Minimal code change (5-10 lines added)
- Uses existing task data to resolve the target column
- No new dependencies required
- Maintains current UI/UX behavior
- Handles all drop scenarios: empty column space, existing cards, column header

**Cons**:
- Requires an additional lookup to find the target task
- Could theoretically fail if task data is stale (but unlikely in practice)

**Risk Assessment**: low - The change is isolated to the drag-end handler and doesn't modify existing logic, only extends it.

**Complexity**: simple - Straightforward conditional logic and array lookup.

#### Option 2: Custom collision detection strategy

**Description**: Implement a custom collision detection algorithm that always returns the column ID instead of task IDs.

**Pros**:
- Prevents the issue at the library level
- More "correct" from a UX perspective

**Cons**:
- Requires deeper understanding of dnd-kit internals
- More complex implementation
- Risk of breaking other drag-related features
- Harder to maintain and explain to future developers

**Why Not Chosen**: Over-engineered for this use case. The simple lookup approach is more maintainable and has lower risk.

#### Option 3: Different UI/UX approach (placeholder for empty space)

**Description**: Add visual indicators showing the target column when dragging near card boundaries, or require users to drop in specific "drop zones" rather than on cards.

**Pros**:
- Clearer user experience
- Prevents ambiguity

**Cons**:
- Requires UI changes
- Changes expected behavior
- More development effort

**Why Not Chosen**: Users expect standard kanban behavior where dropping anywhere in a column should work.

### Selected Solution: Extend drop target detection

**Justification**: This is the simplest, lowest-risk fix that handles the most common use case. It extends existing logic without modifying it, maintains backward compatibility, and aligns with user expectations for kanban boards.

**Technical Approach**:
1. After checking if `over.id` is a column ID, add an else branch
2. If not a column ID, treat `over.id` as a potential task ID
3. Search the tasks array for a task with that ID
4. If found, extract that task's status as the target column
5. If not found, return early (invalid drop target)

**Architecture Changes** (if any):
- None - this is purely a handler logic extension

**Migration Strategy** (if needed):
- Not applicable - no data migration needed

## Implementation Plan

### Affected Files

- `apps/web/app/home/(user)/kanban/_components/kanban-board.tsx` - Fix the `handleDragEnd` function (lines 84-113)

### New Files

No new files needed.

### Step-by-Step Tasks

#### Step 1: Extend handleDragEnd to handle task card drops

Update the `handleDragEnd` function to detect when a user drops onto a task card and determine the target column:

- Extract the drop target detection logic into clearer conditional branches
- First check if `over.id` is a column ID (existing logic)
- If not a column ID, treat it as a task ID and find the corresponding task
- Extract the target task's status as the target column
- Proceed with the status update using the resolved target column
- Handle edge cases (invalid task ID, null task)

**Why this step first**: This is the core fix that enables the desired functionality. All other steps depend on this working.

#### Step 2: Add defensive validation

- Add a guard to ensure the task lookup succeeds
- Return early if the target task is not found (invalid drop)
- Add helpful error logging for debugging

#### Step 3: Add tests for the new behavior

- Add unit test for dropping onto another card in the same column (should not update)
- Add unit test for dropping onto a card in a different column (should update)
- Add unit test for invalid drop targets (should be handled gracefully)
- Add E2E test to verify the complete user flow works

#### Step 4: Validation

- Run all validation commands (see Validation Commands section)
- Verify the fix works for all drop scenarios
- Test edge cases (multiple cards, different columns, same column)
- Confirm no regressions in existing drag-drop functionality

## Testing Strategy

### Unit Tests

Add/update unit tests in `apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.test.tsx`:

- ✅ Drop onto empty column space (existing behavior should not change)
- ✅ Drop onto a card in a different column (card should move)
- ✅ Drop onto a card in the same column (should not update database)
- ✅ Drop onto invalid target (should handle gracefully)
- ✅ Drag cancelled/dropped outside columns (should reset state)
- ✅ Regression test: Dragging and dropping maintains correct task state

**Test files**:
- `apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.test.tsx` - Existing test file

### Integration Tests

- Test that database updates correctly when dropping onto a card
- Test that optimistic UI updates (if implemented)
- Test that error handling works if update fails

### E2E Tests

- Test complete user flow: drag a card from "To Do" column and drop onto a card in "In Progress" column
- Verify the card appears in the new column
- Verify the database reflects the status change
- Test with multiple cards to ensure no interference

**Test files**:
- Create or update E2E tests in `apps/e2e/tests/kanban.spec.ts` if it exists, or create new file

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Navigate to kanban board
- [ ] Drag "To Do" card and drop onto empty space in "In Progress" (should move)
- [ ] Drag "To Do" card and drop directly onto a card in "In Progress" (should move)
- [ ] Drag "In Progress" card and drop onto another "In Progress" card (should not move)
- [ ] Drag "In Progress" card and drop onto "Done" column header (should move)
- [ ] Drag "In Progress" card and drop onto a "Done" card (should move)
- [ ] Verify database updates after each drop
- [ ] Check browser console for any new errors
- [ ] Verify no UI glitches or animations are broken
- [ ] Test with keyboard navigation (Tab/Enter) if supported

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Task lookup fails or returns unexpected result**: The code searches for a task by ID but the task might not be in the tasks array
   - **Likelihood**: low - We're searching within the same tasks array used to render the UI
   - **Impact**: low - Early return prevents any database update
   - **Mitigation**: Add guard condition and log any unexpected cases

2. **Regression: Existing drop-on-column behavior breaks**: Modifying the drag-end handler could affect existing functionality
   - **Likelihood**: low - We're only adding an else branch, not modifying existing if branch
   - **Impact**: medium - Core kanban functionality would break
   - **Mitigation**: Comprehensive testing of existing behavior, careful code review

3. **Performance: Extra task lookup on every drag**: Each drag-end triggers a task lookup
   - **Likelihood**: medium - Tasks array might be large
   - **Impact**: low - Single array lookup is O(n) but acceptable for typical task counts (<100)
   - **Mitigation**: If performance becomes an issue, could optimize with a Map or index

4. **Race condition: Task status changes during drag**: User drags a card while another user updates it
   - **Likelihood**: low in current implementation (no real-time sync)
   - **Impact**: medium - Could use stale task data
   - **Mitigation**: Trust the server's RLS to enforce correctness; the server will validate the status change

**Rollback Plan**:

If this fix causes issues in production:
1. Revert the changes to `handleDragEnd` function in kanban-board.tsx
2. Clear browser cache and refresh
3. The kanban board will work as before (drops on cards will snap back)
4. No database cleanup needed (no data corruption possible)

**Monitoring** (if needed):
- Monitor for console errors related to kanban drag-drop
- Watch task status update success/failure rates
- No special alerts needed

## Performance Impact

**Expected Impact**: minimal

The fix adds a single array lookup operation per drag-end event. Array lookup is O(n) where n is the number of tasks, but:
- Most kanban boards have <100 tasks
- The lookup only happens on drop, not during drag
- Tasks are already loaded in memory

No performance regressions expected.

**Performance Testing**:
- No special performance testing needed
- Standard manual testing will reveal any lag

## Security Considerations

**Security Impact**: none

The fix doesn't introduce any security implications:
- Uses existing task data from the client
- Still relies on server-side RLS for authorization
- No changes to authentication or data validation
- The server will validate the status change before persisting

No security review needed.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Navigate to kanban board and manually test (no automated reproduction)
# Step 1: Go to http://localhost:3000/home/kanban
# Step 2: Drag a card from "To Do" column
# Step 3: Drop it directly onto a card in "In Progress" column
# Expected: Card snaps back to "To Do" (bug is present)
```

**Expected Result**: Card snaps back to its original column when dropped onto another card.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint and format
pnpm lint:fix
pnpm format:fix

# Run unit tests
pnpm --filter web test:unit

# Run E2E tests (if kanban tests exist)
pnpm test:e2e

# Build
pnpm build

# Manual verification
# 1. Navigate to http://localhost:3000/home/kanban
# 2. Drag "To Do" card onto "In Progress" card
# 3. Verify card moves to "In Progress" column
# 4. Refresh page and verify status persisted in database
```

**Expected Result**:
- All validation commands succeed
- Card moves when dropped onto another card
- Database updates correctly
- No console errors
- Zero regressions in existing kanban functionality

### Regression Prevention

```bash
# Run full test suite
pnpm test

# Additional manual checks for drag-drop functionality
# - Drop on empty column space (existing behavior)
# - Drop on column header
# - Drop on existing card in same column
# - Drop on existing card in different column
# - Cancel drag (press Escape or click away)
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required** - The fix uses only existing code and data structures.

## Database Changes

**No database changes required** - The fix only modifies the client-side drag-drop handler.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- None - Standard deployment process applies

**Feature flags needed**: no

**Backwards compatibility**: maintained - This is a bug fix that doesn't change the API or data structure.

## Success Criteria

The fix is complete when:
- [ ] Type checking passes with no errors
- [ ] Linting passes with no new issues
- [ ] All tests pass (unit, integration, E2E)
- [ ] Bug no longer reproduces (card stays in target column when dropped onto another card)
- [ ] Zero regressions in existing kanban functionality
- [ ] Manual testing checklist complete
- [ ] Code review approved (if applicable)

## Notes

This is a straightforward bug fix with minimal code changes and low risk. The approach extends existing logic rather than modifying it, which minimizes the chance of regressions.

The fix leverages the fact that the tasks array is already in memory and contains all task objects that could be drop targets. The task lookup is a simple array search with early return for invalid targets.

Reference: @dnd-kit documentation on collision detection behavior:
- `closestCenter` returns whichever droppable/sortable element is closest to the drag position
- When dropping near a sortable item (task card), that item's ID is returned instead of the droppable container's (column's) ID

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1103*
