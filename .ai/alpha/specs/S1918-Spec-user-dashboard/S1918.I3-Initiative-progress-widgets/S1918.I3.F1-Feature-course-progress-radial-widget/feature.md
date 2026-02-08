# Feature: Course Progress Radial Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1918.I3 |
| **Feature ID** | S1918.I3.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
Build a Course Progress Radial widget that displays the user's overall course completion percentage using a Recharts RadialBarChart. The widget shows a circular progress indicator with the percentage in the center, lesson count below, and a "Continue Course" CTA button.

## User Story
**As a** learning user
**I want to** see my course completion progress at a glance on the dashboard
**So that** I understand how far I've come and feel motivated to continue

## Acceptance Criteria

### Must Have
- [ ] RadialBarChart displays completion percentage (0-100%)
- [ ] Percentage text centered inside the radial chart
- [ ] Lesson count displayed below chart ("X of Y lessons completed")
- [ ] "Continue Course" CTA button linking to `/home/course`
- [ ] Widget uses Card container with proper header (title, description)
- [ ] Empty state for 0% progress with "Start Learning" CTA
- [ ] Dark mode compatible with CSS variable theming

### Nice to Have
- [ ] Smooth animation on initial render (respects reduced motion preference)
- [ ] Tooltip on hover showing lesson details

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | CourseProgressWidget component | New |
| **Logic** | Props interface for typed data | New |
| **Data** | Props from dashboard loader | Existing (I2 provides data) |
| **Database** | N/A - data from I2 loader | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Leverage existing RadialProgress pattern and Recharts RadialBarChart from research. Use ChartContainer wrapper for theming consistency.

### Key Architectural Choices
1. Use Recharts RadialBarChart (not custom SVG) for consistency with other dashboard charts
2. Use ChartContainer from @kit/ui/chart for automatic theming
3. Props-based design - widget receives typed data, doesn't fetch

### Trade-offs Accepted
- Widget is a presentational component; data fetching handled by I2 data layer
- Using RadialBarChart adds ~10KB to bundle but provides consistent API with other charts

## Required Credentials
> None required - this widget uses data passed via props from the dashboard loader

## Dependencies

### Blocks
- F2 (Skills Spider Diagram) may reuse chart configuration patterns

### Blocked By
- S1918.I1.F1: Dashboard Page & Grid (provides grid slot)
- S1918.I2.F1: Dashboard Types (provides CourseProgressData type)
- S1918.I2.F2: Dashboard Loader (provides loader data)

### Parallel With
- F2: Skills Spider Diagram Widget (independent, same initiative)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/course-progress-widget.tsx` - Main widget component

### Modified Files
- None (integration with dashboard page handled by I1/I2)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create CourseProgressWidget component**: RadialBarChart with centered percentage, ChartContainer theming
2. **Add empty state handling**: 0% progress display with "Start Learning" CTA
3. **Style and polish**: Card header, description, CTA button styling
4. **Add accessibility**: ARIA labels, reduced motion support

### Suggested Order
1. Component structure with props interface
2. RadialBarChart implementation with theming
3. Empty state handling
4. CTA button and navigation
5. Accessibility and polish

## Validation Commands
```bash
# Verify widget file exists
test -f apps/web/app/home/\(user\)/_components/course-progress-widget.tsx && echo "Widget file exists"

# Type check
pnpm typecheck

# Lint
pnpm lint

# Visual verification (manual)
# pnpm dev → navigate to /home → verify chart renders with mock data
```

## Related Files
- Initiative: `../initiative.md`
- Reference: `apps/web/app/home/(user)/course/_components/RadialProgress.tsx` (pattern)
- Reference: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx` (ChartContainer usage)
- Research: `../../research-library/context7-recharts-radar.md`
