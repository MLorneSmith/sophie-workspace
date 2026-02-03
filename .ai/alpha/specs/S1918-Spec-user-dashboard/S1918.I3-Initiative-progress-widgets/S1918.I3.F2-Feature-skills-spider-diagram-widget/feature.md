# Feature: Skills Spider Diagram Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1918.I3 |
| **Feature ID** | S1918.I3.F2 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 2 |

## Description
Build a Skills Spider Diagram widget that displays the user's self-assessment category scores using a Recharts RadarChart. The widget visualizes 6+ skill dimensions (Content, Design, Delivery, Engagement, Structure, Confidence) with scores from 0-100, includes proper empty state for users who haven't taken an assessment, and provides a "Take Assessment" CTA.

## User Story
**As a** learning user
**I want to** see my presentation skill strengths and weaknesses visualized as a spider/radar chart
**So that** I can identify areas to improve and track my progress over time

## Acceptance Criteria

### Must Have
- [ ] RadarChart displays category scores from survey_responses.category_scores JSONB
- [ ] PolarGrid, PolarAngleAxis with category labels visible around perimeter
- [ ] Filled radar area with primary color at 60% opacity
- [ ] Widget uses Card container with "Skills Assessment" title
- [ ] Empty state with muted spider web outline and "Take Assessment" CTA
- [ ] Dark mode compatible with CSS variable theming
- [ ] Links to `/home/assessment` for assessment actions

### Nice to Have
- [ ] Tooltip showing exact score on hover
- [ ] Category label truncation for long names on mobile
- [ ] Animation on initial render (respects reduced motion preference)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | SkillsSpiderWidget component | New |
| **Logic** | CategoryScores type interface | Existing (from radar-chart.tsx) |
| **Data** | Props from dashboard loader | Existing (I2 provides data) |
| **Database** | N/A - data from I2 loader | Existing |

## Architecture Decision

**Approach**: Pragmatic - Adapt existing RadarChart
**Rationale**: The existing `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx` already implements a RadarChart with ChartContainer. Adapt this pattern for the dashboard widget context.

### Key Architectural Choices
1. Reuse RadarChart pattern from assessment survey (81 lines, proven implementation)
2. Adapt to dashboard widget context (Card wrapper, different empty state messaging)
3. Use ChartContainer and ChartConfig for consistent theming
4. Props-based design matching CourseProgressWidget pattern

### Trade-offs Accepted
- Creating new widget rather than reusing radar-chart.tsx directly to allow dashboard-specific customization
- Slight code duplication acceptable for widget-specific behavior (different empty state, CTAs)

## Required Credentials
> None required - this widget uses data passed via props from the dashboard loader

## Dependencies

### Blocks
- None

### Blocked By
- S1918.I1.F1: Dashboard Page & Grid (provides grid slot)
- S1918.I2.F1: Dashboard Types (provides CategoryScores type)
- S1918.I2.F2: Dashboard Loader (provides loader data)
- F1: Course Progress Radial Widget (share chart configuration patterns)

### Parallel With
- None within this initiative (F1 is a soft dependency for patterns)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/skills-spider-widget.tsx` - Main widget component

### Modified Files
- None (integration with dashboard page handled by I1/I2)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create SkillsSpiderWidget component**: RadarChart with ChartContainer, based on existing radar-chart.tsx pattern
2. **Add empty state handling**: Muted spider web outline with "Take Assessment" CTA
3. **Configure chart theming**: ChartConfig with CSS variables, PolarGrid/PolarAngleAxis styling
4. **Add CTA navigation**: "Take Assessment" / "Retake Assessment" based on state
5. **Add accessibility**: ARIA labels, reduced motion support

### Suggested Order
1. Copy and adapt radar-chart.tsx structure
2. Create widget props interface (CategoryScores compatible)
3. Implement RadarChart with ChartContainer
4. Add empty state with styled muted web
5. Add CTA button and navigation
6. Polish styling and accessibility

## Validation Commands
```bash
# Verify widget file exists
test -f apps/web/app/home/\(user\)/_components/skills-spider-widget.tsx && echo "Widget file exists"

# Type check
pnpm typecheck

# Lint
pnpm lint

# Visual verification (manual)
# pnpm dev → navigate to /home → verify spider chart renders with mock data
```

## Related Files
- Initiative: `../initiative.md`
- Reference: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx` (direct adaptation)
- Research: `../../research-library/context7-recharts-radar.md`
