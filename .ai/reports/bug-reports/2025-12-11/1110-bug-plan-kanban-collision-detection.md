# Bug Fix: Kanban drag-drop fails asymmetrically due to collision detection architecture

**Related Diagnosis**: #1108 (REQUIRED)
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Collision detection algorithm selects card droppables over column droppables based on geometric proximity. When dragging from a column with many cards to one with fewer, a card in the source column becomes the closest droppable, causing the target status to match the source status and preventing the update.
- **Fix Approach**: Implement transient state pattern with `onDragOver` handler to track active drop container and provide container-aware target selection logic
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The kanban board exhibits asymmetric drag-and-drop behavior: dragging from "To Do" (many cards) to "In Progress" (few cards) fails with the card snapping back, while the reverse direction works. This persists even after switching to `closestCorners` collision detection. The root cause is architectural: `useSortable` cards act as droppables, and the collision algorithm selects the geometrically closest droppable. When dragging away from a column with many cards, another card in that column remains geometrically closer than the destination column, causing the drag operation to target the source column instead of the destination.

For full technical details, see diagnosis issue #1108.

### Solution Approaches Considered

#### Option 1: Transient State Pattern with onDragOver ⭐ RECOMMENDED

**Description**: Implement an `onDragOver` handler in `DndContext` to track which column is the active drag-over target. This handler will be called continuously during drag operations, allowing us to maintain state about which container the user is dragging over. Use this state in `handleDragEnd` to prioritize container targets over card targets when determining the target status.

**Pros**:
- Solves the asymmetric behavior at its source
- Provides visibility into drag-over container during operation
- Allows for smart prioritization logic (container targets take precedence)
- Clean separation between drag-over tracking and drag-end logic
- Minimal changes to existing architecture
- Follows dnd-kit best practices for multi-container layouts

**Cons**:
- Requires adding state management for tracking drag-over container
- Adds a new event handler to the main DndContext

**Risk Assessment**: low - only adds optional state tracking and uses existing dnd-kit APIs

**Complexity**: moderate - requires understanding onDragOver handler pattern and state synchronization

#### Option 2: Modify Collision Detection Algorithm

**Description**: Create a custom collision detection function that weights droppables differently based on type (column vs card) and prevents cards from being selected when crossing column boundaries.

**Why Not Chosen**: More complex to implement correctly across all edge cases. The transient state approach is simpler and more maintainable since it leverages dnd-kit's built-in APIs rather than replacing the collision algorithm.

#### Option 3: Add Data Props to All Droppables with Container Awareness

**Description**: Add `data: { type: 'column', columnId }` and `data: { type: 'card', columnId: task.status }` to all droppables, then use this metadata in `handleDragEnd` to intelligently select targets.

**Why Not Chosen**: Doesn't solve the core problem - collision detection still picks cards as closest droppables. Would still result in card targets being selected even with metadata awareness. The transient state pattern is more effective because it tracks the actual container being dragged over in real-time.

### Selected Solution: Transient State Pattern with onDragOver

**Justification**: This approach directly addresses the root cause by tracking which column the user is actively dragging over, then using that information in `handleDragEnd` to make intelligent decisions about target selection. It's simpler than custom collision detection, follows dnd-kit patterns, requires minimal changes to existing code, and provides a foundation for future UX improvements like visual feedback during drag-over.

**Technical Approach**:
1. Add `activeOverId` state to track the droppable ID the user is currently dragging over
2. Implement `onDragOver` handler to update `activeOverId` with `event.over?.id`
3. Modify `handleDragEnd` to check if `activeOverId` is a column ID before accepting card-based target selection
4. Add fallback logic: if active drag-over is a column, use that column regardless of where collision detection points

**Architecture Changes**:
- Add one new state variable (`activeOverId`)
- Add one new event handler (`onDragOver`)
- Modify `handleDragEnd` logic to use `activeOverId` as primary source of truth when available
- No changes to Column or TaskCard components required

**Migration Strategy**: None required - this is a pure fix with no breaking changes or data migration needs.

## Implementation Plan

### Affected Files

- `apps/web/app/home/(user)/kanban/_components/kanban-board.tsx` - Main logic for drag-and-drop handling; add `activeOverId` state, implement `onDragOver` handler, update `handleDragEnd` logic to prioritize column targets

### New Files

None required - all changes fit within existing component.

### Step-by-Step Tasks

#### Step 1: Add activeOverId state tracking

Add state to track which droppable the user is currently hovering over during drag operations.

- Add `const [activeOverId, setActiveOverId] = useState<string | null>(null);` after line 63
- This state persists during the drag operation and resets when drag ends
- Will be used to determine primary drag target in handleDragEnd

**Why this step first**: Foundation for the entire fix - we need to track the drag-over container before we can use it in logic.

#### Step 2: Implement onDragOver handler

Create a handler that updates `activeOverId` whenever the user drags over a new droppable.

- Add `onDragOver` handler that accepts `DragOverEvent`
- Extract the `over?.id` from the event
- Set `activeOverId` to the over ID
- Pass `onDragOver` handler to `DndContext` (add between lines 200-202)

Code pattern:
```typescript
const handleDragOver = useCallback((event: DragOverEvent) => {
  setActiveOverId(event.over?.id as string | null);
}, []);
```

**Why this step second**: With state and handler in place, we can track drag movement before implementing the logic to use it.

#### Step 3: Update handleDragEnd to prioritize column targets

Modify the logic that determines target status to prioritize column targets over card targets when appropriate.

- Keep existing logic to check if `over.id` is a column ID
- Add new logic: if `activeOverId` (from drag-over event) is a column ID and current `over.id` is NOT, use the column ID instead
- This ensures columns are prioritized when the user drags from a many-card column to a few-card column
- Clear `activeOverId` when drag ends (line 122: change to `setActiveOverId(null);`)

Pseudocode for updated logic:
```typescript
let targetStatus: TaskStatus | null = null;
const isColumnTarget = COLUMNS.some((col) => col.id === overId);

if (isColumnTarget) {
  targetStatus = overId as TaskStatus;
} else {
  // Check if we're dragging away from source column
  // If activeOverId is a column and overId is a card, prefer the column
  if (activeOverId && COLUMNS.some((col) => col.id === activeOverId)) {
    targetStatus = activeOverId as TaskStatus;
  } else {
    // Fall back to original card-based logic
    const targetTask = tasks.find((t) => t.id === overId);
    if (targetTask) {
      targetStatus = targetTask.status;
    }
  }
}
```

**Why this step third**: With state and tracking in place, we implement the core logic that fixes the bug.

#### Step 4: Add tests for drag behavior

Add tests to verify the fix works correctly for both directions.

- Test dragging from "To Do" (many cards) to "In Progress" (few cards) - should succeed
- Test dragging from "In Progress" to "To Do" - should continue to work
- Test dragging to empty columns - should work in both directions
- Test edge case: dragging within same column - should not trigger update
- Add regression test to ensure `onDragOver` state updates don't cause unnecessary renders

**Test files**:
- Add to `apps/web/app/home/(user)/kanban/_components/__tests__/kanban-board.spec.ts` (create if doesn't exist)

#### Step 5: Validation and manual testing

Execute validation commands and manual testing to confirm the fix.

- Run all validation commands (see Validation Commands section)
- Perform manual testing checklist
- Verify no UI regressions
- Test all edge cases

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Drag from "To Do" to "In Progress" with multiple cards in source column
- ✅ Drag from "In Progress" to "To Do" (reverse direction)
- ✅ Drag to empty column from column with many cards
- ✅ Drag within same column (should not trigger update)
- ✅ onDragOver handler correctly tracks activeOverId
- ✅ activeOverId is cleared when drag ends
- ✅ Regression test: original bug (asymmetric behavior) should not reoccur
- ✅ Edge case: dragging from column with 1 card to column with 0 cards

**Test files**:
- `apps/web/app/home/(user)/kanban/_components/__tests__/kanban-board.spec.ts` - Tests for kanban-board logic

### Integration Tests

- ✅ Task status actually updates in database when dragged between columns
- ✅ Multiple sequential drags work correctly (no state contamination)
- ✅ Drag-and-drop works with real task data from API

### E2E Tests

- ✅ User can drag task from "To Do" to "In Progress" (asymmetric case that was failing)
- ✅ User can drag task from "In Progress" to "To Do" (symmetric case)
- ✅ Drag and drop to empty columns works
- ✅ Visual feedback (opacity, overlays) works during drag

**Test files**:
- `apps/e2e/tests/kanban.spec.ts` - Existing E2E tests

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Reproduce original bug setup: 3+ cards in "To Do", 0-1 in "In Progress"
- [ ] Try dragging card from "To Do" toward "In Progress"
- [ ] Verify card DOES NOT snap back (this was the bug)
- [ ] Verify card successfully moves to "In Progress"
- [ ] Drag a card from "In Progress" back to "To Do"
- [ ] Verify card successfully moves (this direction always worked)
- [ ] Drag card to empty "Done" column from "To Do"
- [ ] Verify it successfully moves to "Done"
- [ ] Drag within same column and release
- [ ] Verify card does NOT move (should stay in same column)
- [ ] Open browser DevTools Console
- [ ] Check for any new console errors or warnings
- [ ] Test on mobile/tablet if applicable (touch drag)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **State synchronization issues**: `activeOverId` could get out of sync with actual drag state
   - **Likelihood**: low
   - **Impact**: medium (drag would fail silently)
   - **Mitigation**: Clear `activeOverId` explicitly in `handleDragEnd` and `handleDragStart` if needed; add console logging in development mode to verify state consistency

2. **Performance impact from onDragOver handler**: Handler fires repeatedly during drag
   - **Likelihood**: low
   - **Impact**: low (handler is simple state update)
   - **Mitigation**: Handler only updates state, no expensive operations; React's batching handles multiple updates efficiently

3. **Edge case: Rapid drag operations**: User drags multiple cards very quickly
   - **Likelihood**: low
   - **Impact**: low (each drag operation is independent)
   - **Mitigation**: State is reset at end of each drag operation; no carryover between drags

**Rollback Plan**:

If this fix causes issues in production:
1. Revert commit that adds `onDragOver` handler and `activeOverId` state
2. Remove the prioritization logic from `handleDragEnd`
3. Return to version using only `over.id` for target determination
4. System returns to original behavior (asymmetric drag but no crashes)

**Monitoring** (if needed):
- Monitor task status update success rate (should remain 100%)
- Monitor console errors related to drag-and-drop
- If asymmetric behavior persists, may need to investigate if `onDragOver` is being called correctly

## Performance Impact

**Expected Impact**: none

The changes are purely architectural - we're adding lightweight state tracking and a simple handler. No changes to rendering logic, no additional queries, no performance-sensitive operations. The `onDragOver` handler is called during drag operations which already have constant event handling, so the performance cost is negligible.

## Security Considerations

**Security Impact**: none

This fix only affects client-side drag-and-drop mechanics. All server-side validation remains unchanged (server validates task status changes via RLS policies in Supabase). No new API endpoints, no new data exposure, no changes to authentication/authorization.

## Validation Commands

### Before Fix (Bug Should Reproduce)

Manual test setup:
```
1. Navigate to /home/kanban
2. Create 3+ tasks in "To Do" column
3. Ensure "In Progress" has 0-1 tasks
4. Attempt to drag task from "To Do" to "In Progress"
```

**Expected Result**: Card snaps back to "To Do" column (bug is present)

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint:fix

# Format
pnpm format:fix

# Unit tests (if created)
pnpm test:unit apps/web/app/home/(user)/kanban

# Manual verification
# Repeat the manual test setup above - card should now successfully move
```

**Expected Result**:
- All validation commands pass
- Card successfully moves from "To Do" to "In Progress" (bug is fixed)
- Reverse drag (In Progress → To Do) continues to work
- No new console errors

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Build verification
pnpm build

# E2E tests for kanban functionality
pnpm test:e2e apps/e2e/tests/kanban.spec.ts
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required** - this fix uses only existing dnd-kit APIs and React hooks.

## Database Changes

**No database changes required** - this is purely a client-side fix to how drag targets are determined. No schema changes, migrations, or data modifications needed.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None required. This is a client-side fix with no backend dependencies.

**Feature flags needed**: no

**Backwards compatibility**: maintained (no breaking changes to API or data structure)

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass (typecheck, lint, format)
- [ ] Asymmetric drag-and-drop bug is fixed (To Do → In Progress now works)
- [ ] Reverse drag (In Progress → To Do) continues to work
- [ ] No regressions detected in other kanban functionality
- [ ] Zero new console errors in development
- [ ] Code review approved
- [ ] Manual testing checklist complete
- [ ] Unit tests pass (if created)
- [ ] E2E tests pass
- [ ] Performance acceptable (no degradation)

## Notes

### Technical Implementation Details

The `onDragOver` event provides the most reliable way to track which container the user is actively dragging over. This is a standard pattern in dnd-kit for multi-container layouts where you need to distinguish between dropping on containers vs. items within those containers.

The key insight is that `over.id` in `handleDragEnd` is determined by collision detection and may not always be the user's intent when dragging across container boundaries. By tracking `activeOverId` from `onDragOver`, we have a more direct signal of user intent.

### Why Transient State Works

During a drag operation:
1. User starts drag from "To Do" card
2. As they drag toward "In Progress", `onDragOver` fires repeatedly
3. `activeOverId` updates to whichever droppable they're hovering over
4. When user is over "In Progress" column, `activeOverId` = "doing"
5. When they release, `handleDragEnd` sees `activeOverId = "doing"` (a column)
6. Even if collision detection points to a card in "To Do" (due to geometry), we use the column instead
7. Task successfully updates to "In Progress" status

### Related Previous Issues

- #1103: Original diagnosis of card-drop handling (CLOSED)
- #1104: Fixed card-drop handling (CLOSED - partial fix)
- #1106: Changed collision detection from `closestCenter` to `closestCorners` (CLOSED - didn't fix core issue)
- #1108: Identified architecture as root cause (This diagnosis)

### Future Improvements

This fix provides a foundation for additional enhancements:
- Visual feedback showing which column will receive the drop
- Snap-to-grid behavior when dropping near column boundaries
- Custom drop zones with different acceptance criteria
- Animated card previews showing destination

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1108*
