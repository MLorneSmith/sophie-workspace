# Feature: Course Progress Radial Chart

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2045.I2 |
| **Feature ID** | S2045.I2.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
Build a donut-style radial progress chart showing the user's overall course completion percentage. Uses Recharts PieChart with innerRadius to create a circular progress indicator with the percentage displayed in the center and a "X of Y lessons" subtitle. Integrates into the top-left position of the dashboard 3-3-1 grid (Row 1, Column 1).

## User Story
**As a** SlideHeroes learner
**I want to** see my course progress as a visual donut chart on the dashboard
**So that** I can immediately understand how far I've progressed without navigating to the course page

## Acceptance Criteria

### Must Have
- [ ] PieChart donut renders with completion percentage from `course_progress.completion_percentage`
- [ ] Center label shows percentage (e.g., "72%") with large bold text
- [ ] Subtitle below donut shows "X of Y lessons" (derived from Payload CMS course data)
- [ ] Chart uses `startAngle={90}` / `endAngle={-270}` for clockwise fill from top
- [ ] Uses `ChartContainer` with `ChartConfig` for theme-aware colors (chart-1 for completed, muted for remaining)
- [ ] Wrapped in `ResponsiveContainer` for responsive sizing
- [ ] Renders inside a Card with CardHeader ("Course Progress") and CardContent
- [ ] Graceful fallback when `course_progress` is null/undefined (shows 0% ring)
- [ ] Dark mode supported via CSS variable color system
- [ ] Client component (`'use client'`) since Recharts requires browser rendering

### Nice to Have
- [ ] "Continue Course" link in CardFooter when course is in progress
- [ ] Subtle animation on initial render (Recharts built-in)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `course-progress-chart.tsx` client component | New |
| **Logic** | Data transformation (completion % to PieChart data array) | New |
| **Data** | `course_progress` table query via dashboard loader | Existing (from S2045.I1) |
| **Database** | `public.course_progress` table | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Recharts PieChart with innerRadius is the documented donut pattern (confirmed by research). Reuse the existing `ChartContainer`/`ChartConfig` wrapper from `@kit/ui/chart` for automatic dark mode and tooltip support. Data comes from the dashboard loader (S2045.I1), so this component just receives props.

### Key Architectural Choices
1. Client component wrapping PieChart — Recharts requires DOM access for SVG rendering
2. Props-driven design — receives `completionPercentage`, `completedLessons`, `totalLessons` from parent server component (no direct data fetching)

### Trade-offs Accepted
- Client component boundary required for Recharts (small bundle impact)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Card wrapper | Card, CardHeader, CardTitle, CardContent | @kit/ui/card | Standard dashboard card pattern |
| Chart container | ChartContainer, ChartConfig | @kit/ui/chart | Theme-aware chart wrapper with dark mode |
| Tooltip | ChartTooltip, ChartTooltipContent | @kit/ui/chart | Consistent tooltip styling |
| Donut chart | PieChart, Pie, Cell | recharts | Donut via innerRadius pattern |
| Responsive sizing | ResponsiveContainer | recharts | Already installed |

**Components to Install**: None (all already available)

## Required Credentials
> None required — uses only Supabase data via existing RLS-protected queries and Payload CMS course metadata.

## Dependencies

### Blocks
- None

### Blocked By
- S2045.I1: Needs dashboard page grid layout and data loader providing course progress data

### Parallel With
- F2: Kanban Summary Card
- F3: Self-Assessment Spider Diagram

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard/course-progress-chart.tsx` — Client component with PieChart donut

### Modified Files
- `apps/web/app/home/(user)/_components/dashboard/dashboard-widgets.tsx` (or parent grid component from I1) — Import and place CourseProgressChart in grid position

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create CourseProgressChart client component**: PieChart with innerRadius, Cell colors, center text label, ResponsiveContainer, ChartContainer wrapper
2. **Wire to dashboard grid**: Import into dashboard page/widget container, pass loader data as props
3. **Add course metadata display**: Show "X of Y lessons" subtitle using Payload CMS course data
4. **Verify rendering and dark mode**: Visual test with agent-browser, typecheck, lint

### Suggested Order
1. Create component → 2. Wire to grid → 3. Add metadata → 4. Verify

## Validation Commands
```bash
pnpm typecheck
pnpm lint
# Visual: navigate to /home, verify donut chart renders in Row 1 Col 1
```

## Related Files
- Initiative: `../initiative.md`
- Existing chart wrapper: `packages/ui/src/shadcn/chart.tsx`
- Recharts research: `../../research-library/context7-recharts-radial-radar-charts.md`
- Course progress schema: `apps/web/supabase/migrations/20250319104726_web_course_system.sql`
- Team dashboard pattern: `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx`
