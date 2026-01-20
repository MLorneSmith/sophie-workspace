# Feature: Course Progress Radial Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1607.I2 |
| **Feature ID** | S1607.I2.F2 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 2 |

## Description
Implement a radial progress chart widget that displays the user's course completion percentage using Recharts RadialBarChart. The widget includes a center label showing the percentage value and a "Continue Course" CTA button. Handles empty state for users who haven't started the course.

## User Story
**As a** learner viewing my dashboard
**I want to** see my course completion progress in a circular chart
**So that** I can quickly understand how much I've completed and continue learning

## Acceptance Criteria

### Must Have
- [ ] RadialBarChart renders correctly with completion percentage (0-100)
- [ ] Center label displays percentage with "% Complete" text
- [ ] "Continue Course" button links to current lesson or course start
- [ ] Empty state displays when user has no course progress
- [ ] Loading skeleton appears while data loads
- [ ] Responsive sizing within dashboard grid

### Nice to Have
- [ ] Progress color changes based on completion level (green > 75%, yellow > 25%, blue default)
- [ ] Animation on initial render

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | CourseProgressWidget component | New |
| **UI** | CourseProgressRadial chart | New |
| **UI** | CourseProgressEmpty state | New |
| **Logic** | Percentage formatting, CTA URL logic | New |
| **Data** | Via F1 loader | Existing (from F1) |
| **Database** | course_progress table | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Use Recharts RadialBarChart following patterns from research. Wrap in shadcn Card for consistency with dashboard layout. Keep component focused on display logic only.

### Key Architectural Choices
1. Use RadialBarChart with `startAngle={90}` and `endAngle={-270}` for top-start progress
2. Center label via absolute positioning (recommended pattern from research)
3. Wrap in Card component with CardHeader for title
4. Empty state uses existing EmptyState component from @kit/ui

### Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Card wrapper | Card, CardHeader, CardContent | @kit/ui/card | Consistent with dashboard |
| Chart | RadialBarChart, RadialBar | recharts | Documented pattern |
| Chart wrapper | ChartContainer | @kit/ui/chart | Theme integration |
| Empty state | EmptyState | @kit/ui/makerkit | Existing component |
| CTA button | Button | @kit/ui/button | Standard interaction |

### Trade-offs Accepted
- Fixed max-height for chart (250px) limits large screen impact but ensures consistent grid layout

## Dependencies

### Blocks
- None

### Blocked By
- F1: Progress Data Layer (provides data via loader)
- S1607.I1: Dashboard Foundation (provides page grid layout)

### Parallel With
- F3: Spider Diagram Widget (both consume F1 data)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard/course-progress-widget.tsx` - Main widget
- `apps/web/app/home/(user)/_components/dashboard/course-progress-radial.tsx` - Chart component
- `apps/web/app/home/(user)/_components/dashboard/course-progress-empty.tsx` - Empty state

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and render widget in grid

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create chart component**: RadialBarChart with center label and background track
2. **Create widget wrapper**: Card with header, content, and CTA button
3. **Create empty state**: Message encouraging user to start course
4. **Create loading skeleton**: Placeholder while data loads
5. **Integrate into page**: Add to dashboard grid layout
6. **Style and responsive**: Ensure proper sizing in grid

### Suggested Order
1. Chart component (core visualization)
2. Widget wrapper (Card structure)
3. Empty state
4. Loading skeleton
5. Page integration
6. Responsive testing

## Validation Commands
```bash
# TypeScript validation
pnpm --filter web typecheck

# Manual validation
# 1. Navigate to /home as user with course progress
# 2. Verify radial chart shows correct percentage
# 3. Verify "Continue Course" links correctly
# 4. Test as new user (no progress) - verify empty state
# 5. Test responsive layout on mobile/tablet
```

## Related Files
- Initiative: `../initiative.md`
- F1 loader: `../S1607.I2.F1-Feature-progress-data-layer/`
- Research: `../../research-library/context7-recharts-radial.md`
- Reference: `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx`
