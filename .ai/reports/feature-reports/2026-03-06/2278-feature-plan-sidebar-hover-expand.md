# Feature: Sidebar Hover-to-Expand with Pin Support

## Feature Description

Add hover-to-expand behavior to the application sidebar. The sidebar starts collapsed (icon-only mode) by default and smoothly expands when the user hovers over it on desktop. When the mouse leaves, it collapses back after a short delay (~250ms) to prevent accidental collapses. A pin/lock button allows users to keep the sidebar permanently expanded if they prefer. The pin state persists across sessions via cookies. This feature applies to desktop only; mobile behavior remains unchanged (sheet/drawer).

## User Story

As an application user
I want the sidebar to expand when I hover over it and collapse when I move away
So that I get more screen space for content while still having quick access to navigation labels on demand

## Problem Statement

The current sidebar is either permanently expanded or permanently collapsed, requiring users to manually toggle it. This creates friction: expanded sidebars waste screen real estate, while collapsed sidebars require clicking a toggle to see navigation labels. Users need a fluid, zero-click way to peek at navigation labels without permanently sacrificing content space.

## Solution Statement

Implement a hover-expand behavior on the `SidebarProvider` component that:
1. Starts collapsed by default (icon-only, 4rem width)
2. Temporarily expands to full width (16rem) on mouse enter
3. Collapses back on mouse leave after a 250ms delay
4. Provides a pin/lock button to disable hover behavior and keep the sidebar permanently expanded
5. Persists pin state in a cookie (`sidebar:pinned`) for cross-session consistency
6. Only activates on desktop (not mobile, not `collapsible="none"`)

## Relevant Files

Use these files to implement the feature:

- `packages/ui/src/shadcn/sidebar.tsx` - Core sidebar component. All hover logic, pin state, and context changes go here. This is the primary file to modify.
- `apps/web/app/home/[account]/layout.tsx` - Team account layout. Uses `SidebarProvider` with `defaultOpen`. Needs to pass pin state from cookie.
- `apps/web/app/home/(user)/layout.tsx` - Personal account layout. Same as team layout, needs pin state from cookie.
- `apps/web/app/admin/layout.tsx` - Admin layout. Uses `SidebarProvider`, needs same pin state support.
- `apps/web/.env.production` - Environment defaults. Change `NEXT_PUBLIC_HOME_SIDEBAR_COLLAPSED` and `NEXT_PUBLIC_TEAM_SIDEBAR_COLLAPSED` to `true`.
- `packages/ui/src/makerkit/navigation-config.schema.ts` - Navigation config schema. No changes needed but referenced for understanding config flow.
- `apps/web/config/team-account-navigation.config.tsx` - Team navigation config. References sidebar collapsed env vars.
- `apps/web/config/personal-account-navigation.config.tsx` - Personal navigation config. References sidebar collapsed env vars.

### New Files

None required. All changes are modifications to existing files.

## Impact Analysis

### Dependencies Affected

- `@kit/ui` package - Core sidebar component changes (non-breaking, additive)
- `apps/web` layouts - Minor changes to read pin cookie and pass as prop
- No new dependencies required
- All existing sidebar consumers will continue to work (hover is opt-in via `defaultOpen=false`)

### Risk Assessment

**Low Risk** - Changes are isolated to the sidebar component with clear boundaries:
- Hover behavior only activates when sidebar is collapsed on desktop
- Pin button is additive UI, not replacing existing toggle
- Cookie persistence follows established pattern (`sidebar:state`)
- No database changes, no API changes, no auth changes

### Backward Compatibility

- Existing behavior is fully preserved when sidebar is pinned open
- `defaultOpen=true` continues to work as before (sidebar stays expanded, no hover behavior)
- The `collapsible` prop values (`offcanvas`, `icon`, `none`) continue to work
- Keyboard shortcut (Ctrl/Cmd+B) continues to toggle; when toggled open, it acts as "pin"
- No breaking changes to any component API

### Performance Impact

- **Minimal**: Only adds mouse event listeners on the sidebar container div (already rendered)
- **No additional renders**: Hover state changes are batched with existing state
- **No bundle size increase**: Uses built-in React hooks only (no new libraries)
- **CSS transitions already exist**: Width transition is already `duration-200 ease-linear`

### Security Considerations

- Cookie storage for pin state (`sidebar:pinned`) contains only `true`/`false` - no sensitive data
- No authentication or authorization changes
- No user data exposure
- No server-side changes

## Pre-Feature Checklist

Before starting implementation:
- [ ] Verify that you have read the recommended context documents
- [ ] Create feature branch: `feature/sidebar-hover-expand`
- [ ] Review existing similar features for patterns
- [ ] Identify all integration points
- [ ] Define success metrics
- [ ] Confirm feature doesn't duplicate existing functionality
- [ ] Verify all required dependencies are available
- [ ] Plan feature flag strategy (if needed)

## Documentation Updates Required

- No documentation updates required. The feature is a UX enhancement to existing sidebar behavior.
- CLAUDE.md does not need updates as it already documents the sidebar architecture.

## Rollback Plan

- **Disable**: Revert the `defaultOpen` prop back to `true` in layout files, or set `NEXT_PUBLIC_HOME_SIDEBAR_COLLAPSED=false` and `NEXT_PUBLIC_TEAM_SIDEBAR_COLLAPSED=false`
- **No database migrations** to roll back
- **Cookie cleanup**: The `sidebar:pinned` cookie will expire naturally (7 days) or can be ignored
- **Monitoring**: Watch for user feedback on navigation usability after deployment

## Implementation Plan

### Phase 1: Foundation - Extend SidebarProvider Context

Add hover and pin state management to `SidebarProvider` in the core sidebar component. This is the foundation all other changes build on.

### Phase 2: Core Implementation - Hover Behavior & Pin Button

Implement mouse enter/leave handlers with debounced collapse, add pin toggle button to the sidebar, and persist pin state via cookies.

### Phase 3: Integration - Layout Updates & Environment Defaults

Update layout files to read the pin cookie and pass it as a prop. Change environment defaults to collapsed.

## Step by Step Tasks

### Step 1: Extend SidebarContext Type

In `packages/ui/src/shadcn/sidebar.tsx`:

- Add `pinned` and `setPinned` to the `SidebarContext` type
- Add `hoverExpanded` boolean to track temporary hover state
- Add `SIDEBAR_PINNED_COOKIE_NAME = "sidebar:pinned"` constant

### Step 2: Add Pin State to SidebarProvider

In `packages/ui/src/shadcn/sidebar.tsx`, modify `SidebarProvider`:

- Accept new `defaultPinned?: boolean` prop
- Add `pinned` state initialized from `defaultPinned` (default: `false`)
- Write pin state to cookie on change (same pattern as `sidebar:state`)
- When `pinned` is true, sidebar behaves as currently (permanently expanded/collapsed based on `open`)
- When `pinned` is false and sidebar is collapsed, enable hover-expand behavior
- Update context value to include `pinned`, `setPinned`
- Update `toggleSidebar` to also set `pinned` to `true` when toggling open (keyboard shortcut pins the sidebar)

### Step 3: Add Hover Event Handlers

In `packages/ui/src/shadcn/sidebar.tsx`, modify the `Sidebar` component (desktop branch, the `<div>` with `ref`):

- Add `onMouseEnter` handler: if `!pinned && state === "collapsed" && !isMobile`, call `setOpen(true)` and set `hoverExpanded = true`
- Add `onMouseLeave` handler: if `hoverExpanded && !pinned`, start a 250ms timeout, then call `setOpen(false)` and set `hoverExpanded = false`
- Clear the timeout on mouse re-enter to prevent flickering
- Use `useRef` for the timeout ID to avoid stale closures
- Ensure hover-expand does NOT write to the `sidebar:state` cookie (it's temporary)

### Step 4: Prevent Cookie Write During Hover

In `packages/ui/src/shadcn/sidebar.tsx`, modify the `setOpen` callback:

- Add a parameter or ref to distinguish between "user toggled" and "hover triggered" opens
- Only write to `sidebar:state` cookie when the user explicitly toggles (click/keyboard), not on hover
- This ensures refreshing the page restores the correct collapsed state

### Step 5: Add Pin/Lock Toggle Button

In `packages/ui/src/shadcn/sidebar.tsx`:

- Create a new `SidebarPinButton` component (exported)
- Uses `Pin` icon from lucide-react (rotated 45deg when unpinned, upright when pinned)
- On click: toggles `pinned` state
- When pinning: if currently hover-expanded, transition to permanently expanded
- When unpinning: collapse the sidebar (let hover take over)
- Style: small icon button, positioned in the sidebar header area
- Only visible on desktop (`hidden md:flex`), hidden when sidebar is in `collapsible="none"` mode
- Add tooltip: "Pin sidebar" / "Unpin sidebar"

### Step 6: Integrate Pin Button in Application Sidebars

In the following files, add the `SidebarPinButton` to the header area:

- `apps/web/app/home/[account]/_components/team-account-layout-sidebar.tsx`
- `apps/web/app/home/(user)/_components/home-sidebar.tsx`
- `apps/web/app/admin/_components/admin-sidebar.tsx`

Position the pin button in the `SidebarHeader` alongside existing controls.

### Step 7: Update Layouts to Read Pin Cookie

In layout files, read the `sidebar:pinned` cookie and pass it to `SidebarProvider`:

- `apps/web/app/home/[account]/layout.tsx`: Read `sidebar:pinned` cookie in `getLayoutState()`, pass as `defaultPinned` prop to `SidebarProvider`
- `apps/web/app/home/(user)/layout.tsx`: Same change
- `apps/web/app/admin/layout.tsx`: Same change

### Step 8: Update Environment Defaults

In `apps/web/.env.production`:

- Change `NEXT_PUBLIC_HOME_SIDEBAR_COLLAPSED=true`
- Change `NEXT_PUBLIC_TEAM_SIDEBAR_COLLAPSED=true`

This makes the sidebar start collapsed by default, enabling the hover-expand behavior.

### Step 9: Refine Transitions & Polish

- Ensure the width transition (already `duration-200 ease-linear`) feels smooth during hover expand/collapse
- Test that tooltips on `SidebarMenuButton` hide when sidebar is hover-expanded (they should, since `open` becomes `true`)
- Verify the `data-minimized` attribute toggles correctly during hover
- Ensure `SidebarHeader`, `SidebarGroupLabel`, and other content that hides on collapse appears smoothly during hover-expand

### Step 10: Run Validation Commands

Run all validation commands to ensure zero regressions.

## Testing Strategy

### Unit Tests

- Test `SidebarProvider` context: verify `pinned` and `hoverExpanded` states
- Test cookie persistence: pin/unpin writes to `sidebar:pinned` cookie
- Test hover-expand does NOT write to `sidebar:state` cookie
- Test `toggleSidebar` (keyboard shortcut) sets `pinned=true`

### Integration Tests

- Test `SidebarProvider` with `defaultPinned=true`: sidebar stays expanded, no hover behavior
- Test `SidebarProvider` with `defaultPinned=false`: hover events trigger expand/collapse
- Test pin button click toggles between pinned and unpinned states

### E2E Tests

- Navigate to team dashboard, verify sidebar is collapsed by default
- Hover over sidebar, verify it expands with animation
- Move mouse away, verify it collapses after delay
- Click pin button, verify sidebar stays expanded
- Refresh page, verify pinned state persists
- Use Ctrl+B keyboard shortcut, verify it pins the sidebar open

### Edge Cases

- Rapid mouse enter/leave (debounce should prevent flickering)
- Clicking a navigation link while hover-expanded (should navigate, sidebar collapses)
- Mobile viewport: hover behavior should not activate
- `collapsible="none"` mode: hover behavior should not activate
- `collapsible="offcanvas"` mode: hover behavior should work (expand from off-canvas)
- Window resize from desktop to mobile while hover-expanded
- Multiple rapid pin/unpin clicks

## Acceptance Criteria

- [ ] Sidebar is collapsed by default on desktop (icon-only, 4rem)
- [ ] Sidebar expands to full width (16rem) when user hovers over it
- [ ] Sidebar collapses back ~250ms after mouse leaves
- [ ] Rapid mouse movements don't cause flickering
- [ ] Pin button is visible in expanded sidebar header
- [ ] Clicking pin keeps sidebar permanently expanded
- [ ] Pin state persists across page refreshes (cookie)
- [ ] Ctrl/Cmd+B keyboard shortcut pins the sidebar open
- [ ] Mobile behavior unchanged (sheet/drawer)
- [ ] All existing sidebar functionality works (tooltips, navigation, submenus)
- [ ] Smooth CSS transitions during expand/collapse
- [ ] No regressions in typecheck, lint, or tests

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

- `pnpm typecheck` - Run type checking to validate the feature works with zero type errors
- `pnpm lint` - Run linting to catch code quality issues
- `pnpm format:fix` - Format code to project standards
- `pnpm build` - Run production build to validate the feature builds successfully

## Notes

- The existing `SidebarRail` component (click-to-toggle rail) can coexist with hover-expand. Clicking the rail should pin/unpin rather than just toggle.
- The `NEXT_PUBLIC_SIDEBAR_COLLAPSIBLE_STYLE` env var controls the collapse style (`icon` vs `offcanvas`). Hover-expand works with both styles but `icon` mode provides the best UX (users see icons as affordance to hover).
- Future enhancement: add a user preference (stored in DB) for hover-expand vs. always-expanded, allowing per-user customization beyond the cookie.
- No new dependencies required.
