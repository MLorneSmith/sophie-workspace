# Feature: Responsive Grid Layout

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1815.I1 |
| **Feature ID** | S1815.I1.F3 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 3 |

## Description
Implement the responsive 3-row dashboard grid layout using Tailwind CSS breakpoints. Create the `DashboardGrid` component that orchestrates all 7 widget placeholders. Row 1: Course Progress + Spider Chart + Kanban Summary. Row 2: Activity Feed + Quick Actions + Coaching Sessions. Row 3: Presentations Table (full width).

## User Story
**As a** SlideHeroes user on any device
**I want to** see my dashboard widgets in an organized, responsive layout
**So that** I can quickly find information regardless of screen size

## Acceptance Criteria

### Must Have
- [ ] `DashboardGrid` component receives and distributes `DashboardData` to widgets
- [ ] Row 1: 3 columns on xl+, 2 on md-lg, 1 on mobile (Course Progress, Spider Chart, Kanban Summary)
- [ ] Row 2: 3 columns on xl+, 2 on md-lg, 1 on mobile (Activity Feed, Quick Actions, Coaching Sessions)
- [ ] Row 3: Full width presentations table on all breakpoints
- [ ] All 7 widget placeholder components created with Card structure
- [ ] Empty states shown when data is null/empty
- [ ] Gap spacing consistent at 4 (gap-4)

### Nice to Have
- [ ] Entry animation (`animate-in fade-in`)
- [ ] Bottom padding for fixed elements (`pb-36`)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `dashboard-grid.tsx` + 7 widget components | New |
| **Logic** | Data distribution to widgets | New |
| **Data** | Use DashboardData types | Existing (F1) |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Client Component Grid with Server-Rendered Widgets
**Rationale**: Grid component uses 'use client' for future interactivity. Widget placeholders are simple Card-based components. Follow dashboard-demo-charts.tsx pattern exactly.

### Key Architectural Choices
1. Grid breakpoints: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`
2. Each widget as separate file in `_components/widgets/` directory
3. Widget props interface accepts specific data slice (e.g., `CourseProgressData | null`)
4. Empty states use `text-muted-foreground` styling pattern

### Trade-offs Accepted
- Widgets are placeholders only - rich visualizations (charts, tables) deferred to I2-I5
- No widget customization or drag-and-drop in this phase

## Required Credentials
> None required

## Dependencies

### Blocks
- F4: Skeleton Loading (needs grid structure to match)

### Blocked By
- F1: Types & Data Loader (needs DashboardData type)
- F2: Dashboard Page Shell (needs page to render grid)

### Parallel With
- None

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard-grid.tsx` - Main grid layout component
- `apps/web/app/home/(user)/_components/widgets/course-progress-widget.tsx` - Course progress placeholder
- `apps/web/app/home/(user)/_components/widgets/spider-chart-widget.tsx` - Spider chart placeholder
- `apps/web/app/home/(user)/_components/widgets/kanban-summary-widget.tsx` - Kanban summary placeholder
- `apps/web/app/home/(user)/_components/widgets/activity-feed-widget.tsx` - Activity feed placeholder
- `apps/web/app/home/(user)/_components/widgets/quick-actions-widget.tsx` - Quick actions placeholder
- `apps/web/app/home/(user)/_components/widgets/coaching-sessions-widget.tsx` - Coaching sessions placeholder
- `apps/web/app/home/(user)/_components/widgets/presentations-table-widget.tsx` - Presentations table placeholder
- `apps/web/public/locales/en/dashboard.json` - Dashboard-specific i18n translations

### Modified Files
- None

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Widget containers | Card, CardHeader, CardContent | @kit/ui/card | Consistent with existing dashboard patterns |
| Grid layout | Tailwind grid utilities | Built-in | Standard responsive pattern |
| Empty text | text-muted-foreground | Tailwind | Consistent styling |
| i18n | Trans component | @kit/ui/trans | Internationalization support |

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create dashboard-grid.tsx**: Main grid component with responsive Tailwind classes
2. **Create course-progress-widget.tsx**: Card placeholder with empty state
3. **Create spider-chart-widget.tsx**: Card placeholder with empty state
4. **Create kanban-summary-widget.tsx**: Card placeholder with empty state
5. **Create activity-feed-widget.tsx**: Card placeholder with empty state
6. **Create quick-actions-widget.tsx**: Card with button placeholders
7. **Create coaching-sessions-widget.tsx**: Card placeholder with empty state
8. **Create presentations-table-widget.tsx**: Card placeholder with empty state
9. **Create dashboard i18n file**: Add all widget title/description keys
10. **Test responsive breakpoints**: Manually verify mobile, tablet, desktop layouts

### Suggested Order
T9 (i18n) first, then T1 (grid) as the orchestrator, then T2-T8 (widgets) can be parallelized.

## Validation Commands
```bash
# Verify components compile
pnpm typecheck

# Start dev server and test breakpoints
pnpm dev
# Manually test:
# - Mobile (<768px): Single column
# - Tablet (768-1024px): 2 columns
# - Desktop (>1024px): 3 columns
```

## Related Files
- Initiative: `../initiative.md`
- Reference: `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx`
- Card: `packages/ui/src/shadcn/card.tsx`
- Types: `apps/web/app/home/(user)/_lib/types/dashboard.types.ts` (from F1)
