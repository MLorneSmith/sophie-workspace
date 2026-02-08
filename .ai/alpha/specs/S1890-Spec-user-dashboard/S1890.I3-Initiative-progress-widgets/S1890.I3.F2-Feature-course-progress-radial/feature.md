# Feature: Course Progress Radial Chart

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1890.I3 |
| **Feature ID** | S1890.I3.F2 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 2 |

## Description
Create a radial bar chart component for the user dashboard that visualizes course completion progress as a circular progress indicator. The chart shows the completion percentage prominently in the center with the lesson count displayed below. This is a new component build using Recharts RadialBarChart.

## User Story
**As a** SlideHeroes learner
**I want to** see my course progress as a visual radial chart on my dashboard
**So that** I can instantly gauge how far I've progressed through the curriculum

## Acceptance Criteria

### Must Have
- [ ] RadialBarChart displays completion percentage as single radial bar
- [ ] Center label shows percentage number (e.g., "67%")
- [ ] CardDescription shows "X of Y lessons completed"
- [ ] Chart wrapped in Card component with "Course Progress" title
- [ ] Empty state displays when completion is 0% (with CTA to start course)
- [ ] SSR-safe with ResponsiveContainer initialDimension
- [ ] TypeScript props: completionPercentage, completedLessons, totalLessons

### Nice to Have
- [ ] Animated progress on load
- [ ] Tooltip on hover showing detailed breakdown
- [ ] Link to course page

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | CourseProgressChart component | New |
| **Logic** | Center label positioning, data formatting | New |
| **Data** | Props from parent (via I2 loader) | Existing from I2 |
| **Database** | course_progress, lesson_progress tables | Existing |

## Architecture Decision

**Approach**: Pragmatic - New component following existing chart patterns
**Rationale**: No existing RadialBarChart in codebase, but research documentation provides clear implementation guidance. Follow ChartContainer pattern for consistency.

### Key Architectural Choices
1. Use RadialBarChart from Recharts with single data point for progress
2. Donut style (innerRadius="70%") to allow center label
3. Custom center label using absolute positioning (Recharts Label component is complex)
4. Use semantic colors from chart config (chart-1 for primary progress)

### Trade-offs Accepted
- Center label uses absolute positioning (simpler than Recharts Label API)
- Single-segment chart (not showing completed/in-progress/remaining separately for v1)
- Background track shows remaining progress implicitly via innerRadius sizing

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Card wrapper | Card, CardHeader, CardTitle, CardDescription, CardContent | @kit/ui/card | Consistent with dashboard design |
| Chart theming | ChartContainer | @kit/ui/chart | Theme-aware colors |
| Radial chart | RadialBarChart, RadialBar, PolarAngleAxis | recharts | Per research docs |
| Responsive wrap | ResponsiveContainer | recharts | SSR-safe with initialDimension |
| Center label | Absolute positioned div | Custom | Simpler than Recharts Label |

**Components to Install**: None - all components already available

## Required Credentials
> Environment variables required for this feature to function.

None required - all data comes from local database via server-side loader.

## Dependencies

### Blocks
- F3: Progress Widgets Integration (needs this chart component)
- S1890.I7: Empty States & Polish (will enhance empty state design)

### Blocked By
- S1890.I1.F1: Dashboard page grid layout (needs layout container)
- S1890.I2.F1: Course progress loader (needs completion data)

### Parallel With
- F1: Skills Spider Diagram (independent component)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/course-progress-chart.tsx` - Main component

### Modified Files
- None initially (page integration happens in F3)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create CourseProgressChart scaffold**: Component with props interface and Card wrapper
2. **Implement RadialBarChart**: Configure chart with innerRadius/outerRadius/barSize
3. **Add center label**: Absolute positioned percentage display
4. **Add CardDescription**: Show "X of Y lessons completed"
5. **Implement empty state**: Conditional rendering for 0% completion
6. **Configure SSR support**: ResponsiveContainer with initialDimension
7. **Add chart config**: Theme colors using ChartConfig pattern
8. **Write unit tests**: Test rendering with various percentages and empty state

### Suggested Order
T1 (scaffold) → T2 (chart) → T3 (center label) → T4 (description) → T5 (empty state) → T6 (SSR) → T7 (config) → T8 (tests)

## Validation Commands
```bash
# Verify file exists
test -f apps/web/app/home/\(user\)/_components/course-progress-chart.tsx && echo "✓ Component exists"

# Contains RadialBarChart import
grep -q "RadialBarChart" apps/web/app/home/\(user\)/_components/course-progress-chart.tsx && echo "✓ Uses Recharts RadialBarChart"

# Contains initialDimension for SSR
grep -q "initialDimension" apps/web/app/home/\(user\)/_components/course-progress-chart.tsx && echo "✓ SSR-safe"

# Contains percentage display
grep -q "completionPercentage\|%" apps/web/app/home/\(user\)/_components/course-progress-chart.tsx && echo "✓ Has percentage display"

# Contains empty state handling
grep -q "empty\|Empty\|Start\|0" apps/web/app/home/\(user\)/_components/course-progress-chart.tsx && echo "✓ Has empty state logic"

# Typecheck passes
pnpm typecheck

# Visual verification
# Start dev server: pnpm dev
# Test with mock data: { completionPercentage: 67, completedLessons: 8, totalLessons: 12 }
# Verify radial bar, center label, and description render correctly
```

## Related Files
- Initiative: `../initiative.md`
- Existing RadialProgress (different approach): `apps/web/app/home/(user)/course/_components/RadialProgress.tsx`
- ChartContainer: `packages/ui/src/shadcn/chart.tsx`
- Research: `../../research-library/context7-recharts-radial-radar.md`
