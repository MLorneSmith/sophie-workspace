# Feature: Self-Assessment Spider Diagram

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2045.I2 |
| **Feature ID** | S2045.I2.F3 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 3 |

## Description
Build a dashboard version of the Self-Assessment Spider Diagram by adapting the existing RadarChart component from the assessment survey page. The component displays category scores from `survey_responses.category_scores` as a radar/spider chart within a dashboard card. Integrates into Row 1, Column 2 of the dashboard 3-3-1 grid.

## User Story
**As a** SlideHeroes learner
**I want to** see my self-assessment results as a spider diagram on the dashboard
**So that** I can quickly visualize my strengths and weaknesses without navigating to the assessment page

## Acceptance Criteria

### Must Have
- [ ] RadarChart renders category scores from `survey_responses.category_scores` JSONB
- [ ] Uses same `ChartContainer`/`ChartConfig` wrapper as existing RadarChart for theme consistency
- [ ] PolarGrid, PolarAngleAxis (category labels), and single Radar series with semi-transparent fill
- [ ] Wrapped in Card with CardHeader ("Self-Assessment") and CardContent
- [ ] Wrapped in ResponsiveContainer for responsive sizing
- [ ] Graceful fallback when `category_scores` is null/empty (show "No assessment data" with CTA)
- [ ] "Last taken: [date]" or "Retake Assessment" link in CardFooter
- [ ] Client component (`'use client'`) since Recharts requires browser rendering
- [ ] Dark mode supported via CSS variable color system

### Nice to Have
- [ ] Display highest/lowest scoring category as text annotation
- [ ] Subtle hover tooltip showing exact scores per category

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `assessment-spider-chart.tsx` client component | New (adapted from existing) |
| **Logic** | Transform `category_scores` object to RadarChart data array | Existing pattern (from radar-chart.tsx) |
| **Data** | `survey_responses` table query via dashboard loader | Existing (from S2045.I1) |
| **Database** | `public.survey_responses` table | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: The existing RadarChart component at `assessment/survey/_components/radar-chart.tsx` already handles data transformation (`Object.entries → [{category, score}]`), empty state detection, and ChartContainer integration. The dashboard version adapts this pattern into a more compact card format with dashboard-specific sizing (`max-h-[250px]`) and footer links. We create a new component rather than importing the existing one because the dashboard version has different card structure, sizing, and footer content.

### Key Architectural Choices
1. New component adapting existing RadarChart pattern — different card layout and sizing requirements
2. Props-driven — receives `categoryScores` object and optional `lastTakenDate` from parent
3. Same ChartConfig pattern as existing RadarChart for visual consistency

### Trade-offs Accepted
- Slight code duplication with existing RadarChart (justified by different context and card structure)
- PolarRadiusAxis omitted for cleaner dashboard look (category labels sufficient)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Card wrapper | Card, CardHeader, CardTitle, CardContent, CardFooter | @kit/ui/card | Standard dashboard card |
| Chart container | ChartContainer, ChartConfig | @kit/ui/chart | Theme-aware chart wrapper |
| Tooltip | ChartTooltip, ChartTooltipContent | @kit/ui/chart | Consistent tooltip styling |
| Radar chart | RadarChart, Radar, PolarGrid, PolarAngleAxis | recharts | Already installed |
| Responsive sizing | ResponsiveContainer | recharts | Already installed |

**Components to Install**: None (all already available)

## Required Credentials
> None required — uses only Supabase `survey_responses` table data via existing RLS-protected queries.

## Dependencies

### Blocks
- None

### Blocked By
- S2045.I1: Needs dashboard page grid layout and data loader providing survey response data

### Parallel With
- F1: Course Progress Radial Chart
- F2: Kanban Summary Card

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard/assessment-spider-chart.tsx` — Client component adapting RadarChart for dashboard

### Modified Files
- `apps/web/app/home/(user)/_components/dashboard/dashboard-widgets.tsx` (or parent grid component from I1) — Import and place AssessmentSpiderChart in grid position

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create AssessmentSpiderChart client component**: Adapt RadarChart pattern — PolarGrid, PolarAngleAxis, Radar with fill, ChartContainer, ResponsiveContainer, empty state handling
2. **Wire to dashboard grid**: Import into dashboard page/widget container, pass category_scores and metadata as props
3. **Add footer with assessment link**: "Last taken: [date]" text or "Take Assessment" CTA link
4. **Verify rendering and dark mode**: Visual test with agent-browser, typecheck, lint

### Suggested Order
1. Create component → 2. Wire to grid → 3. Add footer → 4. Verify

## Validation Commands
```bash
pnpm typecheck
pnpm lint
# Visual: navigate to /home, verify spider diagram renders in Row 1 Col 2
```

## Related Files
- Initiative: `../initiative.md`
- Existing RadarChart: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
- Chart wrapper: `packages/ui/src/shadcn/chart.tsx`
- Recharts research: `../../research-library/context7-recharts-radial-radar-charts.md`
- Survey schema: `apps/web/supabase/migrations/20250319104724_web_survey_system.sql`
