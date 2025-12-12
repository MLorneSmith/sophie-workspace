# Bug Diagnosis: Tooltip Provider Missing in cost-badge.tsx and action-toolbar.tsx

**ID**: ISSUE-1097
**Created**: 2025-12-11T14:30:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: error

## Summary

After implementing issue #1095 which added `TooltipProvider` to `top-bar.tsx`, the error "'Tooltip' must be used within 'TooltipProvider'" continues to occur. This is because two additional components in the canvas page render tree also use `Tooltip` without wrapping in `TooltipProvider`: `cost-badge.tsx` and `action-toolbar.tsx`.

## Environment

- **Application Version**: dev branch (commit 1eaa00030)
- **Environment**: development
- **Browser**: All browsers
- **Node Version**: Current project version
- **Next.js Version**: 16.0.7 (Turbopack)
- **Last Working**: Never worked - additional components were missed in #1095 fix

## Reproduction Steps

1. Start the development server with `pnpm dev`
2. Navigate to `/home/ai` and select a presentation
3. Get routed to `/home/ai/canvas?id=[id]`
4. Open browser DevTools console
5. Observe the error: `'Tooltip' must be used within 'TooltipProvider'`

## Expected Behavior

The canvas page should load without any console errors. All tooltip components should be properly wrapped in `TooltipProvider`.

## Actual Behavior

Console shows error:
```
`Tooltip` must be used within `TooltipProvider`

    at CanvasPage (app/home/(user)/ai/canvas/_components/canvas-page.tsx:33:3)
    at CanvasServerPage (app/home/(user)/ai/canvas/page.tsx:18:9)
```

## Diagnostic Data

### Code Analysis

**Component Render Tree (simplified):**
```
CanvasServerPage (page.tsx)
└── CanvasPage (canvas-page.tsx)
    └── ErrorBoundary ← Error caught here
        └── CostTrackingProvider
            └── SaveContextProvider
                ├── Toaster
                ├── HomeLayoutPageHeader
                └── PageBody
                    ├── TopBar
                    │   ├── CostBadge ← Uses Tooltip WITHOUT TooltipProvider
                    │   └── TooltipProvider (wraps only Save/Fullscreen buttons)
                    └── Tabs
                        └── EditorPanel
                            └── ActionToolbar ← Uses Tooltip WITHOUT TooltipProvider
```

**Issue #1095 Fix Location:**
- `apps/web/app/home/(user)/ai/canvas/_components/top-bar.tsx`
- Added `TooltipProvider` around Save and Fullscreen button tooltips (lines 71-111)
- **MISSED**: `CostBadge` component rendered at line 70, BEFORE the TooltipProvider

**Remaining Offending Components:**

1. **cost-badge.tsx** (lines 22-34):
   - Uses `<Tooltip>` without `TooltipProvider` wrapper
   - Rendered at `top-bar.tsx:70` BEFORE the `TooltipProvider` at line 71
   - This is the primary cause of the error

2. **action-toolbar.tsx** (lines 266-320):
   - Uses multiple `<Tooltip>` components without `TooltipProvider` wrapper
   - Contains 4 tooltips: Reset Outline, Simplify Text, Add Ideas, Improve Structure
   - Rendered inside `EditorPanel` which is inside the `Tabs` component

### Grep Evidence

```bash
$ grep -n "Tooltip" apps/web/app/home/(user)/ai/canvas/_components/cost-badge.tsx
4:import { Tooltip, TooltipContent, TooltipTrigger } from "@kit/ui/tooltip";
22:		<Tooltip>
23:			<TooltipTrigger asChild>
32:			</TooltipTrigger>
33:			<TooltipContent>API usage cost for this session</TooltipContent>
34:		</Tooltip>

$ grep -n "Tooltip" apps/web/app/home/(user)/ai/canvas/_components/action-toolbar.tsx
10:import { Tooltip, TooltipContent, TooltipTrigger } from "@kit/ui/tooltip";
266:				<Tooltip>
267:					<TooltipTrigger asChild>
272:					</TooltipTrigger>
273:					<TooltipContent>
275:					</TooltipContent>
276:				</Tooltip>
... (more tooltip usages)
```

### Screenshots
N/A - Console error is text-based

## Error Stack Traces

```
`Tooltip` must be used within `TooltipProvider`

    at CanvasPage (app/home/(user)/ai/canvas/_components/canvas-page.tsx:33:3)
    at CanvasServerPage (app/home/(user)/ai/canvas/page.tsx:18:9)
```

## Related Code

- **Affected Files**:
  - `apps/web/app/home/(user)/ai/canvas/_components/cost-badge.tsx` - Missing TooltipProvider
  - `apps/web/app/home/(user)/ai/canvas/_components/action-toolbar.tsx` - Missing TooltipProvider
  - `apps/web/app/home/(user)/ai/canvas/_components/top-bar.tsx` - CostBadge rendered outside provider scope

- **Recent Changes**:
  - Commit `dd2260fa1` - `fix(ui): add TooltipProvider to canvas page top-bar` (partial fix)

- **Suspected Functions**:
  - `CostBadge` component - line 22 uses Tooltip without provider
  - `ActionToolbar` component - lines 266-320 use Tooltip without provider

## Related Issues & Context

### Direct Predecessors

- #1094 (CLOSED): "Bug Diagnosis: Tooltip Provider Missing on Canvas Page" - Original diagnosis that led to partial fix
- #1095 (CLOSED): "Bug Fix: Tooltip Provider Missing on Canvas Page" - Implementation that fixed only `top-bar.tsx` Save/Fullscreen buttons

### Historical Context

Issue #1095 implemented a partial fix by adding `TooltipProvider` to `top-bar.tsx`, but the fix was incomplete:
1. The `CostBadge` component is rendered BEFORE the `TooltipProvider` wrapper (line 70 vs 71)
2. The `ActionToolbar` component was not identified as using Tooltip components
3. The original diagnosis (#1094) correctly identified `top-bar.tsx` as problematic but missed the other components

## Root Cause Analysis

### Identified Root Cause

**Summary**: Two components (`cost-badge.tsx` and `action-toolbar.tsx`) use `Tooltip` without being wrapped in `TooltipProvider`, and one of them (`CostBadge`) is rendered outside the `TooltipProvider` scope in `top-bar.tsx`.

**Detailed Explanation**:

The shadcn/ui `Tooltip` component (which wraps Radix UI primitives) requires a `TooltipProvider` ancestor in the React tree. The issue #1095 fix added `TooltipProvider` to `top-bar.tsx` but made two mistakes:

1. **CostBadge positioning error**: In `top-bar.tsx`, `CostBadge` is rendered at line 70, but the `TooltipProvider` starts at line 71. This means `CostBadge` (which uses `Tooltip`) is rendered BEFORE/OUTSIDE the provider scope:

   ```tsx
   // top-bar.tsx lines 69-72
   <CostBadge className="mr-1" />     {/* LINE 70 - OUTSIDE TooltipProvider */}
   <TooltipProvider>                   {/* LINE 71 - Provider starts here */}
       <Tooltip>                       {/* Save button - correctly inside */}
   ```

2. **ActionToolbar completely missed**: The `action-toolbar.tsx` component has 4 separate `Tooltip` usages (lines 266-320) and was never identified as needing a `TooltipProvider` wrapper.

**Supporting Evidence**:
- Stack trace points to `canvas-page.tsx:33` (ErrorBoundary) indicating the error bubbles up from a child component
- `cost-badge.tsx:22-34` shows `Tooltip` usage without `TooltipProvider`
- `action-toolbar.tsx:266-320` shows 4 `Tooltip` usages without `TooltipProvider`
- `top-bar.tsx:70` shows `CostBadge` rendered before line 71's `TooltipProvider`

### How This Causes the Observed Behavior

1. React renders `CanvasPage` component
2. Inside the render tree, `TopBar` renders first
3. `TopBar` renders `CostBadge` at line 70
4. `CostBadge` tries to render a `Tooltip` component
5. `Tooltip` (from Radix UI) checks for `TooltipProvider` context - not found
6. Radix UI throws the error "'Tooltip' must be used within 'TooltipProvider'"
7. Error bubbles up to `ErrorBoundary` at `canvas-page.tsx:33`

### Confidence Level

**Confidence**: High

**Reasoning**:
- The code clearly shows `CostBadge` rendered before `TooltipProvider` in `top-bar.tsx`
- Direct code inspection confirms both `cost-badge.tsx` and `action-toolbar.tsx` use `Tooltip` without `TooltipProvider`
- This exactly matches the error message and expected Radix UI behavior
- The pattern is consistent with the previous diagnosis for #1094

## Fix Approach (High-Level)

Two approaches are viable:

**Option A: Add TooltipProvider to each component (Recommended)**
- Add `TooltipProvider` wrapper inside `cost-badge.tsx` around its `Tooltip`
- Add `TooltipProvider` wrapper inside `action-toolbar.tsx` around all its `Tooltip` components
- Follows the pattern already used in `kanban-board.tsx` and `top-bar.tsx`
- Most modular approach - each component is self-contained

**Option B: Move CostBadge inside existing TooltipProvider in top-bar.tsx**
- Move `<CostBadge className="mr-1" />` from line 70 to inside the `TooltipProvider` block
- Still need separate fix for `action-toolbar.tsx`
- Less ideal as it creates a spatial dependency on provider placement

## Diagnosis Determination

The root cause is confirmed: two components (`cost-badge.tsx` and `action-toolbar.tsx`) use `Tooltip` without `TooltipProvider`, with `CostBadge` being the primary culprit as it's rendered before the provider in `top-bar.tsx`.

The fix is straightforward: wrap the tooltip elements in both components with `TooltipProvider` following the established pattern in the codebase.

## Additional Context

This is a regression from incomplete fix implementation in #1095. The original diagnosis in #1094 correctly identified `top-bar.tsx` but the investigation didn't fully trace all tooltip usages in the component tree.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Bash (git log, git branch)*
