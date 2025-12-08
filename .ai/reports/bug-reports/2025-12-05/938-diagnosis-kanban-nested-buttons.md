# Bug Diagnosis: Kanban subtask checkbox causes hydration error due to nested buttons

**ID**: ISSUE-938
**Created**: 2025-12-05T00:00:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The Kanban board's TaskCard component renders subtask checkboxes inside a `<button>` wrapper element. Since the Radix UI Checkbox primitive renders as a `<button>` element, this creates invalid nested `<button>` elements in the HTML structure, causing React hydration errors and violating HTML spec.

## Environment

- **Application Version**: Latest dev
- **Environment**: development
- **Browser**: All browsers
- **Node Version**: N/A
- **Database**: N/A
- **Last Working**: Unknown (likely introduced with subtask feature)

## Reproduction Steps

1. Navigate to `/home/kanban`
2. Create or view a task that has subtasks
3. Open browser console
4. Observe hydration error: "In HTML, `<button>` cannot be a descendant of `<button>`"

## Expected Behavior

Subtask checkboxes should render without HTML validation errors and should not cause hydration mismatches.

## Actual Behavior

Console shows two errors:
1. "In HTML, `<button>` cannot be a descendant of `<button>`. This will cause a hydration error."
2. "`<button>` cannot contain a nested `<button>`."

## Diagnostic Data

### Console Output
```
In HTML, <button> cannot be a descendant of <button>.
This will cause a hydration error.

<button> cannot contain a nested <button>.
See this log for the ancestor stack trace.
```

### Network Analysis
N/A - This is a client-side rendering issue.

### Database Analysis
N/A - This is a UI component issue.

### Performance Metrics
N/A - This is an HTML validity issue.

### Screenshots
N/A

## Error Stack Traces
```
at button (<anonymous>:null:null)
at Checkbox (../../packages/ui/src/shadcn/checkbox.tsx:12:2)
at <unknown> (app/home/(user)/kanban/_components/task-card.tsx:135:14)
at Array.map (<anonymous>:null:null)
at TaskCard (app/home/(user)/kanban/_components/task-card.tsx:113:26)
at <unknown> (app/home/(user)/kanban/_components/column.tsx:55:9)
at Array.map (<anonymous>:null:null)
at Column (app/home/(user)/kanban/_components/column.tsx:53:14)
at <unknown> (app/home/(user)/kanban/_components/kanban-board.tsx:193:7)
at Array.map (<anonymous>:null:null)
at KanbanBoard (app/home/(user)/kanban/_components/kanban-board.tsx:192:15)
at KanbanPage (app/home/(user)/kanban/page.tsx:28:5)
```

## Related Code
- **Affected Files**:
  - `apps/web/app/home/(user)/kanban/_components/task-card.tsx` (lines 113-159)
  - `packages/ui/src/shadcn/checkbox.tsx` (line 12)
- **Recent Changes**: Unknown
- **Suspected Functions**: TaskCard subtask rendering loop

## Related Issues & Context

### Direct Predecessors
None found.

### Related Infrastructure Issues
None found.

### Similar Symptoms
None found.

### Same Component
None found.

### Historical Context
This appears to be the first report of this issue.

## Root Cause Analysis

### Identified Root Cause

**Summary**: A `<button>` element wrapping subtask items contains a Radix UI Checkbox component which also renders as a `<button>`, creating invalid nested buttons.

**Detailed Explanation**:

In `task-card.tsx` lines 113-159, each subtask is wrapped in a `<button>` element:

```tsx
{task.subtasks.map((subtask) => (
    <button
        key={subtask.id}
        type="button"
        className="flex items-center gap-2 w-full text-left bg-transparent border-none p-0"
        onClick={(e) => { /* toggle logic */ }}
        onMouseDown={(e) => { e.stopPropagation(); }}
        aria-label={`Toggle completion for ${subtask.title}`}
    >
        <div className="relative z-20">
            <Checkbox ... />  // <-- This renders as another <button>
        </div>
        <label>...</label>
    </button>
))}
```

The `Checkbox` component (from `packages/ui/src/shadcn/checkbox.tsx`) uses `CheckboxPrimitive.Root` from Radix UI, which renders as a `<button type="button" role="checkbox">` element internally.

This creates the invalid HTML structure:
```html
<button>              <!-- Outer wrapper for subtask click handling -->
    <div>
        <button>      <!-- Radix Checkbox primitive -->
            ...
        </button>
    </div>
</button>
```

**Supporting Evidence**:
- Stack trace clearly shows: `at Checkbox (checkbox.tsx:12:2)` inside `at TaskCard (task-card.tsx:113:26)`
- Code frame shows the outer `<button>` at line 114 of task-card.tsx
- Radix UI Checkbox always renders as a button element (standard behavior)

### How This Causes the Observed Behavior

1. Server-side rendering produces HTML with nested buttons
2. Client-side hydration detects the invalid HTML structure
3. React logs the hydration warning because the browser may auto-correct invalid HTML differently than expected
4. The browser's HTML parser may move the inner button outside the outer button, causing hydration mismatch

### Confidence Level

**Confidence**: High

**Reasoning**: The stack trace explicitly shows the nesting path, the code clearly shows a `<button>` wrapping a `<Checkbox>`, and the Radix UI Checkbox documentation confirms it renders as a button element. This is definitively the root cause.

## Fix Approach (High-Level)

Change the outer `<button>` wrapper to a `<div>` element with appropriate accessibility attributes (`role="button"`, `tabIndex={0}`, keyboard event handlers). The click handling and drag prevention logic can remain the same, but using a `<div>` instead of `<button>` will allow the inner Checkbox button to exist without HTML violation.

Alternative: Remove the outer button entirely and rely solely on the Checkbox's built-in click handling, adjusting the click target area via CSS.

## Diagnosis Determination

The root cause is definitively identified: invalid HTML nesting where a `<button>` element (subtask wrapper in task-card.tsx:114) contains another `<button>` element (Radix UI Checkbox rendered at task-card.tsx:135). The fix requires changing the outer element from `<button>` to a non-interactive element like `<div>` with appropriate accessibility attributes.

## Additional Context

This is a common pattern mistake when using Radix UI primitives, as many form controls (Checkbox, Switch, RadioGroup items) render as button elements internally. When wrapping these in custom clickable containers, always use `<div>` with `role` and `tabIndex` instead of `<button>`.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read (task-card.tsx, checkbox.tsx)*
