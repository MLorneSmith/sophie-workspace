# Feature: Spider Chart Assessment Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1815.I2 |
| **Feature ID** | S1815.I2.F2 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 2 |

## Description
Implement a spider/radar chart widget showing skill assessment category scores from the self-assessment survey. This is the primary "What skills need work?" indicator, helping users identify strengths and areas for improvement at a glance.

## User Story
**As a** SlideHeroes learner
**I want to** see my skill assessment results visualized on my dashboard
**So that** I can quickly identify my strengths and areas needing improvement

## Acceptance Criteria

### Must Have
- [ ] Radar/spider chart displaying category_scores from survey_responses
- [ ] Category labels around chart perimeter (e.g., Structure, Delivery, Visuals)
- [ ] Empty state when no assessment completed with CTA to take assessment
- [ ] Skeleton loading state while data loads
- [ ] Responsive sizing (smaller on mobile)

### Nice to Have
- [ ] Tooltip on hover showing exact score per category
- [ ] Link to view full assessment results

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | SpiderChartWidget component | New (wraps existing) |
| **UI** | AssessmentEmptyState component | New |
| **UI** | Widget skeleton | New |
| **Logic** | loadSurveyScores loader function | New |
| **Data** | survey_responses table query | Existing (RLS protected) |
| **Database** | survey_responses table | Existing |

## Architecture Decision

**Approach**: Minimal
**Rationale**: Directly reuse existing `radar-chart.tsx` component which already handles all Recharts complexity. Just need a dashboard-specific wrapper.

### Key Architectural Choices
1. **Reuse existing RadarChart** - The assessment module's radar-chart.tsx is production-ready
2. **Server Component data fetching** - Query survey_responses in page-level loader
3. **Wrapper component** - Add dashboard-specific card styling and empty state handling

### Trade-offs Accepted
- Reusing existing component means less customization flexibility
- No benchmark comparison (out of scope per initiative)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Radar chart | RadarChart | Existing (assessment module) | Production-ready with tooltips |
| Chart container | ChartContainer | @kit/ui/chart | Theming integration |
| Widget container | Card | @kit/ui/card | Consistent with dashboard |
| Empty state CTA | Button | @kit/ui/button | Standard action |
| Loading skeleton | Skeleton | @kit/ui/skeleton | Standard loading pattern |

**Components to Install**: None - all exist

## Required Credentials
> Environment variables required for this feature to function.

None required - queries internal database tables only.

## Dependencies

### Blocks
- None (leaf widget)

### Blocked By
- S1815.I1: Dashboard Foundation (provides page shell and grid layout)

### Parallel With
- F1: Course Progress Radial Widget (can develop simultaneously)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/spider-chart-widget.tsx` - Dashboard wrapper component
- `apps/web/app/home/(user)/_components/assessment-empty-state.tsx` - Empty state component
- `apps/web/app/home/(user)/_lib/server/loaders/survey-scores.loader.ts` - Data loader

### Modified Files
- `apps/web/app/home/(user)/_lib/server/user-dashboard.loader.ts` - Add survey scores to parallel fetch
- `apps/web/app/home/(user)/page.tsx` - Integrate widget into grid

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create survey scores loader function**: Query survey_responses for category_scores where completed=true
2. **Integrate loader into dashboard**: Add to Promise.all() in user-dashboard.loader.ts
3. **Create SpiderChartWidget wrapper**: Import RadarChart, wrap in Card with dashboard styling
4. **Create assessment empty state component**: Card with message and "Take Assessment" CTA
5. **Add skeleton loading state**: Square skeleton matching chart dimensions
6. **Integrate widget into dashboard grid**: Add to page.tsx in second widget slot
7. **Add responsive styling**: Adjust outerRadius for mobile
8. **Visual validation**: Use agent-browser to verify rendering

### Suggested Order
1. Loader function first (enables data access)
2. Widget wrapper second (integrates existing chart)
3. Empty state third (handles no-data case)
4. Integration fourth (places in dashboard)
5. Polish last (skeleton, responsive)

## Validation Commands
```bash
# Verify types compile
pnpm typecheck

# Test widget renders with data
pnpm dev
# Navigate to /home as user with completed assessment

# Test empty state
# Create new user account without survey completion

# Visual validation
agent-browser open http://localhost:3000/home
agent-browser wait 2000
agent-browser screenshot .ai/alpha/specs/S1815-Spec-user-dashboard/S1815.I2-Initiative-progress-assessment-widgets/S1815.I2.F2-Feature-spider-chart-assessment-widget/validation-screenshot.png
```

## Related Files
- Initiative: `../initiative.md`
- Reference: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
- Research: `../../research-library/context7-recharts-radar.md`
- Schema: `apps/web/supabase/migrations/20250319104724_web_survey_system.sql`
- Tasks: `./tasks.json` (created in next phase)
