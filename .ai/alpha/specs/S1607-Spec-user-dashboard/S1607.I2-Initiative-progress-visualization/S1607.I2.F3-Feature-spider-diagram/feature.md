# Feature: Spider Diagram Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1607.I2 |
| **Feature ID** | S1607.I2.F3 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 3 |

## Description
Implement a spider diagram (radar chart) widget that displays the user's self-assessment category scores. Adapts the existing RadarChart component from the assessment survey module for dashboard use. Handles empty state for users who haven't completed an assessment.

## User Story
**As a** learner viewing my dashboard
**I want to** see my presentation skill scores in a spider diagram
**So that** I can identify my strengths and areas for improvement at a glance

## Acceptance Criteria

### Must Have
- [ ] RadarChart renders correctly with category scores from survey_responses
- [ ] Category names display on each axis
- [ ] Empty state displays when user has no assessment data
- [ ] Loading skeleton appears while data loads
- [ ] Responsive sizing within dashboard grid
- [ ] Link to assessment page for users to retake/complete assessment

### Nice to Have
- [ ] Highlight highest and lowest scoring categories
- [ ] Tooltip shows exact score on hover

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | AssessmentScoresWidget component | New |
| **UI** | RadarChart | Existing (reuse/adapt) |
| **UI** | AssessmentScoresEmpty state | New |
| **Logic** | Category score formatting | Existing (from RadarChart) |
| **Data** | Via F1 loader | Existing (from F1) |
| **Database** | survey_responses table | Existing |

## Architecture Decision

**Approach**: Minimal
**Rationale**: The existing RadarChart at `assessment/survey/_components/radar-chart.tsx` is directly reusable with minimal modification. Only need to create a widget wrapper and empty state.

### Key Architectural Choices
1. Import and reuse existing RadarChart component directly
2. Pass category_scores from F1 loader as props
3. Wrap in Card for dashboard consistency
4. Add "View Assessment" or "Take Assessment" CTA based on data availability

### Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Card wrapper | Card, CardHeader, CardContent | @kit/ui/card | Dashboard consistency |
| Radar chart | RadarChart | assessment/survey/_components | Direct reuse |
| Empty state | EmptyState | @kit/ui/makerkit | Existing component |
| CTA button | Button | @kit/ui/button | Standard interaction |

### Trade-offs Accepted
- Depends on assessment module component (creates coupling, but reduces duplication)

## Dependencies

### Blocks
- None

### Blocked By
- F1: Progress Data Layer (provides data via loader)
- S1607.I1: Dashboard Foundation (provides page grid layout)

### Parallel With
- F2: Course Progress Radial Widget (both consume F1 data)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard/assessment-scores-widget.tsx` - Widget wrapper
- `apps/web/app/home/(user)/_components/dashboard/assessment-scores-empty.tsx` - Empty state

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and render widget in grid

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create widget wrapper**: Card with header and content containing RadarChart
2. **Create empty state**: Message encouraging user to take assessment
3. **Create loading skeleton**: Placeholder while data loads
4. **Integrate into page**: Add to dashboard grid layout
5. **Test with real data**: Verify rendering with actual assessment scores

### Suggested Order
1. Widget wrapper (imports existing RadarChart)
2. Empty state
3. Loading skeleton
4. Page integration
5. Testing with real assessment data

## Validation Commands
```bash
# TypeScript validation
pnpm --filter web typecheck

# Manual validation
# 1. Navigate to /home as user with completed assessment
# 2. Verify spider diagram shows correct category scores
# 3. Verify "View Assessment" links correctly
# 4. Test as new user (no assessment) - verify empty state
# 5. Test responsive layout on mobile/tablet
```

## Related Files
- Initiative: `../initiative.md`
- F1 loader: `../S1607.I2.F1-Feature-progress-data-layer/`
- Existing RadarChart: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
- Research: `../../research-library/perplexity-dashboard-patterns.md`
