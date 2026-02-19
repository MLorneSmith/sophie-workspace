# Feature: Widget Empty States — Row 1

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2045.I4 |
| **Feature ID** | S2045.I4.F1 |
| **Status** | Draft |
| **Estimated Days** | 3.5 |
| **Priority** | 1 |

## Description
Implement engaging empty states for the 3 Row 1 dashboard widgets: Course Progress (grayed-out 0% ring with "Start Course" CTA), Self-Assessment Spider Diagram (axes with dashed outline at 0 values + "Take Assessment" CTA), and Kanban Summary ("No tasks yet" with "Go to Kanban Board" CTA). Each empty state uses the existing `EmptyState` component pattern from `@kit/ui/empty-state` combined with widget-specific visual treatments.

## User Story
**As a** new SlideHeroes user with no data
**I want to** see visually engaging empty states in my Row 1 dashboard widgets
**So that** I understand what each widget will show and know exactly what action to take next

## Acceptance Criteria

### Must Have
- [ ] Course Progress widget shows a grayed-out 0% donut ring (Recharts PieChart with muted colors) when `course_progress` has no record or `completion_percentage = 0`
- [ ] Course Progress empty state displays "Start your learning journey today!" heading and "Start Course" CTA linking to `/home/course`
- [ ] Spider Diagram widget shows PolarGrid axes with a dashed outline shape at 0 values when `survey_responses` has no record for user
- [ ] Spider Diagram empty state displays "Discover your strengths" heading and "Take Assessment" CTA linking to `/home/assessment`
- [ ] Kanban Summary widget shows "No tasks yet" message when `tasks` table has no records for user with status 'doing' or 'do'
- [ ] Kanban Summary empty state displays explanatory text and "Go to Kanban Board" CTA linking to `/home/kanban`
- [ ] All empty states use semantic color classes for dark mode compatibility
- [ ] All CTA buttons are keyboard-focusable and have appropriate ARIA labels

### Nice to Have
- [ ] Subtle muted color palette for empty chart visuals (gray ring, dashed spider outline)
- [ ] Smooth transition when data appears (empty → populated)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `course-progress-empty.tsx`, `spider-diagram-empty.tsx`, `kanban-summary-empty.tsx` | New |
| **Logic** | Conditional rendering in each widget based on data presence | Modified (in widget components from I2/I3) |
| **Data** | Empty data detection in dashboard loader | Modified (loader from I1) |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Reuse existing `EmptyState` component from `@kit/ui/empty-state` for text+CTA pattern. For chart empty states (Course Progress, Spider Diagram), render the actual chart components with zero/placeholder data and muted styling rather than hiding charts entirely — this gives users a visual preview of what the widget will look like with data.

### Key Architectural Choices
1. Render Recharts PieChart with 0% data and gray fill for Course Progress empty state (visual preview pattern)
2. Render RadarChart with 0-value data points and dashed `stroke-dasharray` for Spider Diagram empty state
3. Use `EmptyState` component with `EmptyStateHeading`, `EmptyStateText`, `EmptyStateButton` for Kanban (text-only pattern)

### Trade-offs Accepted
- Chart-based empty states require Recharts to be loaded even for empty widgets (acceptable — Recharts is already bundled for populated states)

## Required Credentials
None required — this feature uses only existing UI components and no external services.

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Empty state container | EmptyState | @kit/ui/empty-state | Established pattern with dashed border |
| CTA buttons | Button | @kit/ui/button | Consistent with existing CTAs |
| Donut chart (0%) | PieChart + Pie + Cell | recharts via @kit/ui/chart | Same component as populated state |
| Radar chart (0 vals) | RadarChart + Radar + PolarGrid | recharts via @kit/ui/chart | Same component as populated state |
| Card wrapper | Card, CardHeader, CardContent | @kit/ui/card | Consistent dashboard card styling |

**Components to Install**: None — all components already in packages/ui.

## Dependencies

### Blocks
- F4: Responsive & Accessibility Polish (needs empty states to exist for polish pass)

### Blocked By
- S2045.I2: Visualization widgets must exist (Course Progress and Spider Diagram components)
- S2045.I3: Interactive widgets must exist (Kanban Summary component)

### Parallel With
- F2: Widget Empty States — Row 2 & Table
- F3: Loading Skeletons & Suspense

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard/course-progress-empty.tsx` - Course Progress 0% ring empty state
- `apps/web/app/home/(user)/_components/dashboard/spider-diagram-empty.tsx` - Spider Diagram dashed axes empty state
- `apps/web/app/home/(user)/_components/dashboard/kanban-summary-empty.tsx` - Kanban "No tasks yet" empty state

### Modified Files
- `apps/web/app/home/(user)/_components/dashboard/course-progress-widget.tsx` - Add empty data conditional rendering
- `apps/web/app/home/(user)/_components/dashboard/spider-diagram-widget.tsx` - Add empty data conditional rendering
- `apps/web/app/home/(user)/_components/dashboard/kanban-summary-widget.tsx` - Add empty data conditional rendering

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create Course Progress empty state component**: Render PieChart with 0% data, gray fill, centered "0%" text, heading, and CTA button
2. **Create Spider Diagram empty state component**: Render RadarChart with 0-value data points, dashed stroke, PolarGrid axes, heading, and CTA button
3. **Create Kanban Summary empty state component**: Use EmptyState component with "No tasks yet" heading, explanatory text, and "Go to Kanban Board" CTA
4. **Integrate empty states into widget components**: Add conditional rendering (`if (!data || data.length === 0)`) in each Row 1 widget to show empty state
5. **Verify dark mode rendering for all 3 empty states**: Toggle dark mode, verify semantic color classes work correctly
6. **Add ARIA labels and keyboard navigation**: Ensure CTAs are focusable, charts have title props for screen readers

### Suggested Order
1. Course Progress empty state (simplest chart treatment)
2. Spider Diagram empty state (more complex Recharts config)
3. Kanban Summary empty state (text-only, straightforward)
4. Integration into widget components
5. Dark mode + a11y verification

## Validation Commands
```bash
pnpm typecheck
pnpm lint
# Visual: Navigate to /home with fresh user (no course_progress, no survey_responses, no tasks)
# Verify: 3 Row 1 widgets show empty states with CTAs
# Verify: Dark mode toggle renders correctly
# Verify: Keyboard Tab navigates to all CTAs
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
- EmptyState component: `packages/ui/src/makerkit/empty-state.tsx`
- Recharts chart wrapper: `packages/ui/src/shadcn/chart.tsx`
- Existing RadarChart pattern: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
- Empty states research: `../../research-library/perplexity-dashboard-empty-states-ux.md`
- Recharts research: `../../research-library/context7-recharts-radial-radar-charts.md`
