# Feature: Spider Chart Assessment Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1864.I2 |
| **Feature ID** | S1864.I2.F2 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 2 |

## Description
Create a dashboard widget displaying the user's self-assessment results as a spider/radar chart, visualizing scores across presentation skill categories (Content, Delivery, Visual Design, Engagement, Structure, Timing). The widget shows an overall score summary, highlights strongest/weakest categories, and provides a link to retake or view the full assessment. This adapts the existing `radar-chart.tsx` component for the dashboard context with enhanced styling and additional metadata.

## User Story
**As a** SlideHeroes learner
**I want to** see my presentation skill assessment results visualized on my dashboard
**So that** I can quickly identify my strengths and weaknesses and prioritize areas for improvement

## Acceptance Criteria

### Must Have
- [ ] Spider/radar chart with 5-7 category axes showing assessment scores
- [ ] Overall average score displayed prominently (e.g., "Overall: 72%")
- [ ] Visual indication of highest and lowest scoring categories
- [ ] Link/button to "View Assessment" or "Retake Assessment"
- [ ] Empty state when user has not completed an assessment
- [ ] Loading skeleton matching widget dimensions
- [ ] Accessible chart with screen reader support
- [ ] SSR-safe rendering (ResponsiveContainer with initialDimension)

### Nice to Have
- [ ] Tooltip on hover showing exact score per category
- [ ] Color coding for score ranges (red < 50, amber 50-70, green > 70)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `AssessmentSpiderWidget.tsx` | New |
| **Logic** | Dashboard loader assessment fetch | Modified (extends I1 loader) |
| **Data** | `survey_responses.category_scores` | Existing |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Create a new dashboard-specific widget that wraps the Recharts RadarChart with dashboard Card styling. The existing `radar-chart.tsx` is tightly coupled to the assessment survey page with its own Card layout. A new widget allows dashboard-specific UX (summary score, category highlights, CTA) while reusing the core Recharts pattern.

### Key Architectural Choices
1. Create new `AssessmentSpiderWidget.tsx` using Card layout + ChartContainer from @kit/ui
2. Use SSR-safe ResponsiveContainer with `initialDimension` for Next.js SSR compatibility
3. Transform `category_scores` JSONB to array format expected by RadarChart
4. Server Component fetches data, Client Component renders interactive chart

### Trade-offs Accepted
- Creating new widget rather than extracting/generalizing existing radar-chart.tsx - keeps dashboard widgets cohesive and allows dashboard-specific enhancements
- Client Component required for Recharts - acceptable since chart needs client-side JS for interactivity

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Card container | Card, CardHeader, CardContent | @kit/ui/card | Consistent with other dashboard widgets |
| Chart wrapper | ChartContainer | @kit/ui/chart | Automatic theming, responsive sizing |
| Radar chart | RadarChart, Radar, PolarGrid, PolarAngleAxis | recharts | Existing dependency, well-documented |
| Tooltip | ChartTooltip | @kit/ui/chart | Themed tooltip matching design system |
| Score badge | Badge | @kit/ui/badge | Highlight highest/lowest categories |
| View CTA | Button | @kit/ui/button | Standard interactive element |
| Loading state | Skeleton | @kit/ui/skeleton | Matches widget shape |

**Components to Install**: None required - all components already in packages/ui

## Required Credentials
None required - uses only local database data via Supabase with RLS.

## Dependencies

### Blocks
- None

### Blocked By
- S1864.I1.F1: Types and Data Loader (needs DashboardData type, loader extension point)
- S1864.I1.F2: Dashboard Page Shell (needs widget placement in grid)

### Parallel With
- F1: Course Progress Radial Widget (can develop simultaneously once I1 deps complete)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/assessment-spider-widget.tsx` - Widget component (client)
- `apps/web/app/home/(user)/_components/assessment-spider-widget-skeleton.tsx` - Loading skeleton

### Modified Files
- `apps/web/app/home/(user)/_lib/server/dashboard-page.loader.ts` - Add survey_responses data fetch
- `apps/web/app/home/(user)/_lib/types.ts` - Add AssessmentData type
- `apps/web/app/home/(user)/page.tsx` - Import and place widget in grid

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create AssessmentData type**: Define TypeScript interface for assessment widget data including category_scores
2. **Extend dashboard loader**: Add survey_responses query to fetch category_scores, highest/lowest categories
3. **Create data transformer**: Convert JSONB category_scores to RadarChart array format
4. **Create AssessmentSpiderWidget component**: Client component with Card, ChartContainer, RadarChart
5. **Create widget skeleton**: Loading placeholder with aspect-square for chart area
6. **Create empty state**: "Complete Assessment" CTA when no survey_responses exist
7. **Integrate widget into dashboard page**: Import, pass data props, place in grid position

### Suggested Order
1. Types (foundation)
2. Loader extension (data availability)
3. Data transformer (format conversion)
4. Widget component (main implementation)
5. Skeleton + empty state (UX polish)
6. Page integration (final assembly)

## Validation Commands
```bash
# Verify widget component exists
ls apps/web/app/home/\(user\)/_components/assessment-spider-widget.tsx

# Verify types compile
pnpm --filter web typecheck

# Verify loader fetches survey data
grep -r "survey_responses" apps/web/app/home/\(user\)/_lib/server/dashboard-page.loader.ts

# Visual check (with dev server running)
# Navigate to http://localhost:3000/home and verify widget renders
```

## Related Files
- Initiative: `../initiative.md`
- Existing radar-chart: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
- Chart components: `packages/ui/src/shadcn/chart.tsx`
- Research: `../../../research-library/context7-recharts-radar.md`
- Database types: `apps/web/lib/database.types.ts`
