# Bug Diagnosis: Tooltip must be used within TooltipProvider on canvas page

**ID**: ISSUE-1094
**Created**: 2025-12-11T00:00:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

When navigating to the AI canvas page (`/home/ai/canvas?id=[id]`) by selecting a presentation from the dropdown on `/home/ai`, a React console error appears: `'Tooltip' must be used within 'TooltipProvider'`. The error originates from the `TopBar` component which uses shadcn/ui Tooltip components without the required TooltipProvider wrapper in the component tree.

## Environment

- **Application Version**: dev branch (commit d86a0893a)
- **Environment**: development
- **Browser**: Any (React component error)
- **Node Version**: N/A (client-side issue)
- **Database**: N/A
- **Last Working**: Unknown (possibly never worked correctly)

## Reproduction Steps

1. Navigate to `/home/ai`
2. In the "Edit Existing Presentation" section, select a presentation from the "Select a presentation" dropdown
3. Get routed to `/home/ai/canvas?id=[id]`
4. Open browser console
5. Observe the error: `'Tooltip' must be used within 'TooltipProvider'`

## Expected Behavior

The canvas page should load without console errors and tooltips should function correctly on the Save and Fullscreen buttons in the TopBar.

## Actual Behavior

Console error appears:
```
`Tooltip` must be used within `TooltipProvider`

    at CanvasPage (app/home/(user)/ai/canvas/_components/canvas-page.tsx:33:3)
    at CanvasServerPage (app/home/(user)/ai/canvas/page.tsx:18:9)
```

The page likely still renders, but tooltips may not function properly and the error pollutes the console.

## Diagnostic Data

### Console Output
```
`Tooltip` must be used within `TooltipProvider`

    at CanvasPage (app/home/(user)/ai/canvas/_components/canvas-page.tsx:33:3)
    at CanvasServerPage (app/home/(user)/ai/canvas/page.tsx:18:9)

## Code Frame
  31 |
  32 |     return (
> 33 |         <ErrorBoundary
     |         ^
  34 |             fallback={
  35 |                 <Alert variant="destructive">
  36 |                     <AlertCircle className="h-4 w-4" />

Next.js version: 16.0.7 (Turbopack)
```

### Network Analysis
```
N/A - This is a React component rendering error, not a network issue
```

### Database Analysis
```
N/A - This is a React component rendering error
```

### Performance Metrics
```
N/A - Error occurs during render phase
```

### Screenshots
N/A

## Error Stack Traces
```
`Tooltip` must be used within `TooltipProvider`
    at CanvasPage (app/home/(user)/ai/canvas/_components/canvas-page.tsx:33:3)
    at CanvasServerPage (app/home/(user)/ai/canvas/page.tsx:18:9)
```

## Related Code
- **Affected Files**:
  - `apps/web/app/home/(user)/ai/canvas/_components/canvas-page.tsx` - Main canvas page component
  - `apps/web/app/home/(user)/ai/canvas/_components/top-bar.tsx` - Contains Tooltip usage without TooltipProvider
  - `apps/web/app/home/(user)/ai/canvas/page.tsx` - Server page wrapper
- **Recent Changes**: None directly related to this issue
- **Suspected Functions**: `TopBar` component (lines 66-104 in top-bar.tsx)

## Related Issues & Context

### Direct Predecessors
None found - no prior issues with this exact problem.

### Related Infrastructure Issues
None found.

### Similar Symptoms
None found.

### Same Component
None found.

### Historical Context
This appears to be a latent bug that was introduced when the canvas TopBar was created. The TopBar uses shadcn/ui Tooltip components but no TooltipProvider exists in the component tree for the canvas route.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `TopBar` component in `top-bar.tsx` uses `Tooltip`, `TooltipTrigger`, and `TooltipContent` components from `@kit/ui/tooltip` without wrapping them (or having an ancestor component wrap them) in a `TooltipProvider`.

**Detailed Explanation**:
The shadcn/ui Tooltip component (built on Radix UI) requires a `TooltipProvider` wrapper in the component tree to manage tooltip state and behavior. Looking at the component hierarchy:

1. `CanvasServerPage` (page.tsx:18) renders `CanvasPage`
2. `CanvasPage` (canvas-page.tsx:33) renders `TopBar` inside `ErrorBoundary` → `CostTrackingProvider` → `SaveContextProvider`
3. `TopBar` (top-bar.tsx:66-104) uses `Tooltip` components directly without any `TooltipProvider` ancestor

The parent layouts (`layout.tsx` for canvas, `layout.tsx` for (user)) do not include a `TooltipProvider`.

In contrast, the working `KanbanBoard` component (`kanban-board.tsx:166-182`) correctly wraps its Tooltip usage with `TooltipProvider`.

**Supporting Evidence**:
- Stack trace points directly to canvas-page.tsx:33 where TopBar is rendered
- top-bar.tsx lines 66-104 show Tooltip usage without TooltipProvider:
  ```tsx
  <Tooltip>
    <TooltipTrigger asChild>
      <Button>...</Button>
    </TooltipTrigger>
    <TooltipContent>Save</TooltipContent>
  </Tooltip>
  ```
- Grep shows no `TooltipProvider` exists anywhere in `/apps/web/app/home/(user)/ai/` directory
- kanban-board.tsx demonstrates the correct pattern at lines 166 and 182

### How This Causes the Observed Behavior

1. User navigates to canvas page with a presentation ID
2. React renders the component tree: ServerPage → CanvasPage → TopBar
3. TopBar attempts to render `Tooltip` component
4. Radix UI's Tooltip component checks for TooltipProvider context
5. No provider found → React throws error: "Tooltip must be used within TooltipProvider"
6. Error boundary may catch this, or it logs to console as a warning/error

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The error message explicitly states the problem: Tooltip needs TooltipProvider
2. Code inspection confirms TopBar uses Tooltip without TooltipProvider
3. The codebase has a working example (KanbanBoard) showing the correct pattern
4. No TooltipProvider exists in any ancestor component of the canvas route

## Fix Approach (High-Level)

Wrap the Tooltip components in TopBar with a `TooltipProvider`. Two options:

1. **Local fix (Recommended)**: Add `TooltipProvider` wrapper around the tooltip section in `top-bar.tsx` (similar to kanban-board.tsx pattern)
2. **Global fix**: Add `TooltipProvider` in canvas-page.tsx to wrap all children that might use tooltips

The local fix is simpler and follows the existing pattern in the codebase. Import `TooltipProvider` from `@kit/ui/tooltip` and wrap the tooltip elements.

## Diagnosis Determination

Root cause confirmed: The `TopBar` component uses `Tooltip` components from `@kit/ui/tooltip` without having a `TooltipProvider` wrapper in the component tree. This is a straightforward fix requiring the addition of `TooltipProvider` to wrap the tooltip elements.

## Additional Context

- The fix should follow the pattern established in `kanban-board.tsx`
- Only the TopBar component needs the provider since that's where the Tooltips are used
- No other components in the canvas route appear to use Tooltip

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Bash (git log, gh issue list)*
