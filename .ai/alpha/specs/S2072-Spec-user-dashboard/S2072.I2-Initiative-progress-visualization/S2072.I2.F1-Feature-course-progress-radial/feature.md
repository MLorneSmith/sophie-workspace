# Feature: Course Progress Radial Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2072.I2 |
| **Feature ID** | S2072.I2.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description

A dashboard widget displaying course completion as a radial/donut chart using Recharts PieChart with innerRadius. Shows percentage complete with lessons completed count. Includes zero-progress handling with engaging empty state.

## User Story
**As a** learner
**I want to** see my course progress as a visual radial chart
**So that** I can quickly understand how far along I am in my learning journey

## Acceptance Criteria

### Must Have
- [ ] Radial/donut chart showing course completion percentage (0-100%)
- [ ] Percentage displayed in center of chart
- [ ] Lessons completed count shown below chart (e.g., "12 of 18 lessons")
- [ ] Widget uses Card wrapper with header
- [ ] Zero-progress state shows empty ring with "Start Course" CTA
- [ ] Responsive sizing (works on mobile and desktop)
- [ ] Dark mode support via CSS variables

### Nice to Have
- [ ] Animated progress transition when percentage changes
- [ ] Tooltip showing exact completion stats on hover

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `CourseProgressRadial` (Card + Recharts PieChart) | New |
| **Logic** | Data transformation from course_progress to chart data | New |
| **Data** | `course_progress` table query (from I1 loader) | Existing |
| **Database** | `course_progress`, `lesson_progress` tables | Existing |

## Architecture Decision

**Approach**: Pragmatic - Reuse existing patterns with minimal abstraction

**Rationale**:
- Reuse `ChartContainer` from `@kit/ui/chart` for theming
- Adapt existing `RadialProgress.tsx` SVG pattern to Recharts for consistency
- Use Card component from `@kit/ui/card`
- Transform loader data (from I1) directly in component

### Key Architectural Choices
1. Use Recharts PieChart with innerRadius (not custom SVG) for consistency with other charts
2. Use `ChartContainer` wrapper for CSS variable theming and responsive sizing
3. Handle zero-progress as valid state with CTA, not error

### Trade-offs Accepted
- Slightly larger bundle than custom SVG, but consistent with RadarChart pattern
- No animation on initial render (can add later)

## Required Credentials
> No external credentials required for this feature.

| Variable | Description | Source |
|----------|-------------|--------|
| N/A | This feature uses only Supabase database data | N/A |

## Dependencies

### Blocks
- S2072.I6 (Empty States & Polish) - needs widget for empty state design

### Blocked By
- S2072.I1.F3 (Widget Placeholder Slots) - requires dashboard grid and card wrapper pattern

### Parallel With
- S2072.I2.F2 (Skills Spider Diagram Widget)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard/course-progress-radial.tsx` - Radial chart widget component
- `apps/web/app/home/(user)/_components/dashboard/course-progress-radial.test.tsx` - Unit tests

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and place widget in grid slot

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create CourseProgressRadial component**: Card wrapper with ChartContainer and PieChart
2. **Implement data transformation**: Convert course_progress data to chart format
3. **Add zero-progress handling**: Empty ring state with "Start Course" CTA
4. **Add lessons count display**: Show "X of Y lessons completed"
5. **Integrate with dashboard page**: Place in Row 1, Column 1 of grid

### Suggested Order
1. Create component with static mock data
2. Add data transformation logic
3. Handle zero-progress state
4. Integrate with I1 loader data
5. Add unit tests

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Unit tests
pnpm --filter web test -- --grep "course-progress-radial"

# Visual verification
pnpm dev
# Navigate to /home, verify radial chart renders in Row 1, Column 1

# Test zero-progress state
# Use fresh user account with no course progress
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- Reference: `apps/web/app/home/(user)/course/_components/RadialProgress.tsx`
- Reference: `packages/ui/src/shadcn/chart.tsx`
- Research: `../../research-library/context7-recharts-radial-radar.md`
