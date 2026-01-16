# Bug Diagnosis: Kanban drag-drop fails due to incorrect SortableContext items format

**ID**: ISSUE-pending
**Created**: 2025-12-11T17:35:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The kanban drag-drop continues to fail (cards snap back to source column) despite implementing the data property pattern correctly. The root cause is that `SortableContext` in the Column component receives `items={tasks}` (array of task objects) instead of `items={tasks.map(t => t.id)}` (array of IDs). This violates the dnd-kit API contract and causes ID matching failures that break the `over.data.current` property attachment.

## Environment

- **Application Version**: 2.13.1
- **Environment**: development
- **Node Version**: 22.x
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Never (architectural issue since initial implementation)

## Reproduction Steps

1. Navigate to `/home/kanban`
2. Create 3+ tasks in "To Do" column
3. Ensure "In Progress" has 0-1 tasks
4. Drag a task card from "To Do" toward "In Progress"
5. Release the card

## Expected Behavior

Card moves to "In Progress" column.

## Actual Behavior

Card snaps back to "To Do" column.

## Diagnostic Data

### Code Analysis

**Problem location**: `apps/web/app/home/(user)/kanban/_components/column.tsx:53`

```tsx
// CURRENT (WRONG)
<SortableContext items={tasks} strategy={rectSortingStrategy}>
```

**Working pattern from same codebase**: `apps/web/app/home/(user)/ai/storyboard/_components/sortable-slide-list.tsx:93`

```tsx
// CORRECT
<SortableContext items={slides.map((slide) => slide.id)} strategy={verticalListSortingStrategy}>
```

### Debug Logging Evidence

When `handleDragEnd` fires with the current implementation:
- `over.data.current` may be `undefined` or have incorrect data
- This causes both type checks (`type === "column"` and `type === "card"`) to fail
- `targetStatus` remains `null`
- No status update occurs
- Card snaps back to original position

### Research Evidence

From dnd-kit documentation and GitHub issues:
1. **Official API**: `SortableContext.items` must be "an array of unique identifiers" (IDs), not objects
2. **GitHub Issue #845**: Developers experienced items "snapping back" when using array of objects
3. **ID Matching**: The `data` property from `useSortable` is attached based on ID matching; passing objects can cause failures

## Related Code

- **Affected Files**:
  - `apps/web/app/home/(user)/kanban/_components/column.tsx:53`
- **Recent Changes**:
  - commit `0ce9aff49` - Added data property pattern (correct but insufficient)
  - commit `e5d174a81` - Added transient state pattern (removed as unnecessary)
  - commit `4c011679a` - Changed to closestCorners collision (correct)
  - commit `4168a4552` - Added card-drop handling (insufficient)
- **Suspected Functions**: `Column` component, `SortableContext` configuration

## Related Issues & Context

### Direct Predecessors
- #1112 (CLOSED): "Bug Fix: Kanban drag-drop fix ineffective due to missing data property pattern" - Added data property but didn't fix items format
- #1111 (CLOSED): "Bug Diagnosis: Kanban drag-drop fix ineffective due to missing data property pattern"
- #1110 (CLOSED): "Bug Fix: Kanban drag-drop fails asymmetrically due to collision detection architecture"
- #1108 (CLOSED): "Bug Diagnosis: Kanban drag-drop fails asymmetrically"
- #1106 (CLOSED): "Bug Fix: Kanban drag-drop uses closestCenter collision"
- #1105 (CLOSED): "Bug Diagnosis: closestCenter collision"
- #1104 (CLOSED): "Bug Fix: Kanban drag-drop fails when dropping card onto another card"
- #1103 (CLOSED): "Bug Diagnosis: Kanban drag-drop fails when dropping card onto another card"

### Historical Context
This is the **6th attempt** to fix the kanban drag-drop issue. All previous fixes addressed symptoms (collision detection, data properties, state tracking) but missed the fundamental issue: the incorrect `SortableContext.items` format that breaks dnd-kit's ID matching system.

## Root Cause Analysis

### Identified Root Cause

**Summary**: `SortableContext items={tasks}` passes full task objects instead of ID array, violating dnd-kit API contract and breaking data property attachment.

**Detailed Explanation**:

The dnd-kit `SortableContext` component requires an array of unique identifiers (strings/numbers) for its `items` prop. When you pass full objects, dnd-kit internally attempts to extract IDs, but this process can fail to properly link the `data` property set in `useSortable({ data: {...} })` with the collision detection system.

The result is that when `closestCorners` returns a card as the `over` target, `event.over.data.current` is `undefined` instead of containing `{ type: "card", containerId: "do" }`. This causes the type discrimination logic to fail:

```tsx
if (overData?.type === "column") { ... }       // FALSE - overData is undefined
else if (overData?.type === "card") { ... }    // FALSE - overData is undefined
// targetStatus remains null, no update happens
```

**Supporting Evidence**:
1. Same codebase has working sortable in `sortable-slide-list.tsx` using `items={slides.map(s => s.id)}`
2. dnd-kit documentation explicitly requires array of identifiers
3. GitHub Issue #845 documents this exact failure pattern
4. Research report `perplexity-dndkit-sortablecontext-items-format.md` confirms this

### How This Causes the Observed Behavior

1. User drags card from "To Do" to "In Progress"
2. `closestCorners` returns a card in "In Progress" as `over.id`
3. `over.data.current` is `undefined` due to broken ID linking
4. Type checks fail, `targetStatus` stays `null`
5. Update condition `targetStatus && activeTaskItem && activeTaskItem.status !== targetStatus` is false
6. No API call is made
7. Card snaps back to original position

### Confidence Level

**Confidence**: High

**Reasoning**:
- Working implementation exists in same codebase using correct pattern
- Official documentation confirms required format
- Multiple GitHub issues document this exact failure mode
- The failure pattern exactly matches observed symptoms

## Fix Approach (High-Level)

Change line 53 in `column.tsx` from:
```tsx
<SortableContext items={tasks} strategy={rectSortingStrategy}>
```
to:
```tsx
<SortableContext items={tasks.map(t => t.id)} strategy={rectSortingStrategy}>
```

This single-line change aligns with the dnd-kit API contract and should enable proper `over.data.current` population.

## Diagnosis Determination

Root cause identified with high confidence. The fix is a single-line change to pass an array of IDs instead of an array of objects to `SortableContext.items`.

After implementing this fix, the debug logging added in the previous commit should be removed.

## Additional Context

### Tools Used During Diagnosis
- context7-expert: dnd-kit documentation research
- perplexity-expert: GitHub issues and community solutions research
- Grep: Codebase comparison between working and broken implementations
- Code review of kanban and sortable-slide-list components

### Research Reports Generated
- `/home/msmith/projects/2025slideheroes/.ai/reports/research-reports/2025-12-11/perplexity-dndkit-sortablecontext-items-format.md`
- `/home/msmith/projects/2025slideheroes/.ai/reports/research-reports/2025-12-11/perplexity-dndkit-data-current-undefined-stale.md`
- `/home/msmith/projects/2025slideheroes/.ai/reports/research-reports/2025-12-11/context7-dndkit-sortablecontext-items-data.md`

---
*Generated by Claude Debug Assistant*
*Tools Used: context7-expert, perplexity-expert, Grep, Read, code analysis*
