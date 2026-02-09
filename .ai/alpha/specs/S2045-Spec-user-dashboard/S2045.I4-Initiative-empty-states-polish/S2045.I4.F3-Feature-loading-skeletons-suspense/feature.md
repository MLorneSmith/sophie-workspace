# Feature: Loading Skeletons & Suspense Boundaries

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2045.I4 |
| **Feature ID** | S2045.I4.F3 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 3 |

## Description
Create loading skeleton layouts for all 7 dashboard widget cards that match each widget's visual shape, and wrap each widget in a Suspense boundary for progressive loading. Users see accurate placeholder skeletons while data loads, preventing layout shift and improving perceived performance.

## User Story
**As a** SlideHeroes user loading the dashboard
**I want to** see placeholder skeletons that match the shape of each widget while data loads
**So that** I perceive the page as fast and don't experience jarring content shifts

## Acceptance Criteria

### Must Have
- [ ] Course Progress skeleton shows a circular placeholder (matching donut ring dimensions) with text placeholders below
- [ ] Spider Diagram skeleton shows a rectangular placeholder matching RadarChart container dimensions
- [ ] Kanban Summary skeleton shows 2-3 list item placeholders with status indicators
- [ ] Activity Feed skeleton shows 3-4 timeline item placeholders with dot + line pattern
- [ ] Quick Actions skeleton shows 4 button placeholders in a grid
- [ ] Coaching Sessions skeleton shows a rectangular iframe placeholder
- [ ] Presentations Table skeleton shows a table header + 3 row placeholders
- [ ] Each skeleton uses `animate-pulse` class for loading animation
- [ ] Each widget wrapped in `<Suspense fallback={<WidgetSkeleton />}>` boundary
- [ ] No layout shift (CLS) when skeleton transitions to actual content (matching dimensions)
- [ ] Skeletons use `bg-primary/10` (existing Skeleton component style) for dark mode compatibility

### Nice to Have
- [ ] Staggered skeleton appearance (slight delay between cards for visual flow)
- [ ] Skeleton dimensions exactly match populated widget dimensions to eliminate all CLS

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | 7 skeleton components + 1 dashboard skeleton wrapper | New |
| **Logic** | Suspense boundary wiring in dashboard page | Modified (page.tsx from I1) |
| **Data** | Async widget component wrappers for Suspense compatibility | Modified (widget wrappers from I2/I3) |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Create individual skeleton components per widget for accurate shape matching. Use React Suspense boundaries around each widget so they can load independently — fast widgets appear first while slow ones (e.g., Activity Feed with DB query, Coaching with iframe) still show skeletons. Follow the established SectionLoader pattern from `apps/web/app/(marketing)/page.tsx`.

### Key Architectural Choices
1. One skeleton component per widget type (7 total) rather than a generic skeleton — ensures accurate shape matching and zero CLS
2. Suspense boundaries at the widget level (not page level) for progressive/independent loading
3. Use existing `Skeleton` component from `@kit/ui/skeleton` as the primitive building block
4. Dashboard page uses `<Suspense>` for each async widget server component

### Trade-offs Accepted
- 7 skeleton components adds some file count, but ensures accurate loading placeholders and is the established pattern in the codebase
- Widget components may need to be async server components (or wrapped in async wrappers) for Suspense to work

## Required Credentials
None required — this feature uses only existing UI components.

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Skeleton primitive | Skeleton | @kit/ui/skeleton | Existing `bg-primary/10 animate-pulse rounded-md` |
| Card wrapper | Card, CardHeader, CardContent | @kit/ui/card | Consistent with widget card structure |
| Suspense boundary | React.Suspense | react | Built-in progressive loading |

**Components to Install**: None — all components already available.

## Dependencies

### Blocks
- F4: Responsive & Accessibility Polish (needs skeletons to exist for responsive testing)

### Blocked By
- S2045.I2: Visualization widget components must exist (to know exact dimensions for skeleton matching)
- S2045.I3: Interactive widget components must exist (to know exact dimensions for skeleton matching)

### Parallel With
- F1: Widget Empty States — Row 1
- F2: Widget Empty States — Row 2 & Table

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard/skeletons/course-progress-skeleton.tsx` - Circular ring skeleton
- `apps/web/app/home/(user)/_components/dashboard/skeletons/spider-diagram-skeleton.tsx` - Rectangular chart skeleton
- `apps/web/app/home/(user)/_components/dashboard/skeletons/kanban-summary-skeleton.tsx` - List items skeleton
- `apps/web/app/home/(user)/_components/dashboard/skeletons/activity-feed-skeleton.tsx` - Timeline items skeleton
- `apps/web/app/home/(user)/_components/dashboard/skeletons/quick-actions-skeleton.tsx` - Button grid skeleton
- `apps/web/app/home/(user)/_components/dashboard/skeletons/coaching-skeleton.tsx` - Iframe placeholder skeleton
- `apps/web/app/home/(user)/_components/dashboard/skeletons/presentations-table-skeleton.tsx` - Table rows skeleton

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Add Suspense boundaries wrapping each widget component

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create Row 1 widget skeletons**: Course Progress (circular), Spider Diagram (rectangular), Kanban Summary (list items) — 3 skeleton components
2. **Create Row 2 widget skeletons**: Activity Feed (timeline), Quick Actions (button grid), Coaching (iframe placeholder) — 3 skeleton components
3. **Create Presentations Table skeleton**: Table header + 3 row placeholders matching DataTable structure
4. **Add Suspense boundaries to dashboard page**: Wrap each widget in `<Suspense fallback={<WidgetSkeleton />}>` in page.tsx
5. **Verify skeleton-to-content transitions**: Ensure no layout shift by matching skeleton dimensions to actual widget dimensions
6. **Test progressive loading behavior**: Throttle network, verify each widget loads independently with its skeleton

### Suggested Order
1. Row 1 skeletons (3 components)
2. Row 2 skeletons (3 components)
3. Presentations Table skeleton
4. Suspense boundary wiring
5. Dimension matching + CLS verification

## Validation Commands
```bash
pnpm typecheck
pnpm lint
# Visual: Navigate to /home with network throttling (Slow 3G in DevTools)
# Verify: All 7 skeleton placeholders appear before data loads
# Verify: Skeletons match widget shape (no jarring size change on load)
# Verify: Widgets load independently (fast widgets appear while slow ones still show skeletons)
# Verify: Dark mode skeletons render with appropriate muted colors
# Performance: Check CLS score < 0.1 in Lighthouse
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
- Skeleton component: `packages/ui/src/shadcn/skeleton.tsx`
- SectionLoader pattern: `apps/web/app/(marketing)/page.tsx` (lines 47-57)
- Storyboard skeleton pattern: `apps/web/app/home/(user)/ai/storyboard/_components/presentation-selector.tsx`
