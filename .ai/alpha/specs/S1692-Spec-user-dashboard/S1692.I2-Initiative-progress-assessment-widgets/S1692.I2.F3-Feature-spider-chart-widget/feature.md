# Feature: Self-Assessment Spider Chart Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1692.I2 |
| **Feature ID** | S1692.I2.F3 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 3 |

## Description
Implement the Self-Assessment Spider/Radar Chart widget for the user dashboard. This widget displays the user's skill assessment scores across categories (from `survey_responses.category_scores`) using a Recharts RadarChart, wrapped in the shadcn/ui ChartContainer for theme support. Includes a link to the assessment page.

## User Story
**As a** SlideHeroes learner
**I want to** see a visual representation of my presentation skill strengths and weaknesses
**So that** I can identify areas to focus my learning and track improvement over time

## Acceptance Criteria

### Must Have
- [ ] Widget displays RadarChart with category scores from survey_responses
- [ ] Chart uses 5-8 categories (based on available assessment data)
- [ ] ChartContainer wrapper for theme/tooltip integration
- [ ] "View Assessment" link to `/home/assessment`
- [ ] Loading skeleton while data loads
- [ ] Widget wrapped in Card with header

### Nice to Have
- [ ] Tooltip shows category name and score on hover
- [ ] Animation on data load
- [ ] Score comparison to average (future)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `SpiderChartWidget` component | New |
| **UI** | Recharts RadarChart | Existing library |
| **UI** | ChartContainer | Existing (@kit/ui/chart) |
| **UI** | Card wrapper | Existing |
| **UI** | Loading skeleton | New (chart-specific) |
| **Logic** | Data transformation (scores → chart data) | New |
| **Data** | Dashboard progress loader | From F1 |
| **Database** | `survey_responses.category_scores` | Existing |

## Architecture Decision

**Approach**: Pragmatic - Follow existing Recharts + shadcn/ui pattern
**Rationale**: The codebase already has a RadarChart implementation in `assessment/survey/_components/radar-chart.tsx`. We follow this proven pattern, wrapping Recharts components in ChartContainer for consistent theming and tooltips.

### Key Architectural Choices
1. Server component passes data, client component renders chart
2. Use ChartContainer from @kit/ui/chart for theme integration
3. Transform `category_scores` JSONB to array format: `[{ category: string, score: number }]`
4. Use CSS variables for chart colors (`var(--chart-1)`)

### Trade-offs Accepted
- Client-side rendering required for Recharts (SSR disabled) - acceptable, standard pattern

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Card wrapper | Card, CardHeader, CardContent | @kit/ui/card | Standard widget container |
| Chart container | ChartContainer | @kit/ui/chart | Theme integration, tooltips |
| Radar chart | RadarChart, Radar, PolarGrid, PolarAngleAxis | recharts | Library component |
| Tooltip | ChartTooltip, ChartTooltipContent | @kit/ui/chart | Consistent tooltip styling |
| Assessment link | Button | @kit/ui/button | Standard link pattern |
| Loading state | Skeleton | @kit/ui/skeleton | Standard loading pattern |

## Dependencies

### Blocks
- F4: Widget Empty States (needs this widget to add empty state)

### Blocked By
- F1: Progress & Assessment Data Loader (needs data)
- S1692.I1: Dashboard Foundation (needs grid layout)

### Parallel With
- F2: Course Progress Widget (same data dependency, different display)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/spider-chart-widget.tsx` - Main widget component (client)
- `apps/web/app/home/(user)/_components/spider-chart-widget-skeleton.tsx` - Loading skeleton
- `apps/web/app/home/(user)/_lib/utils/transform-category-scores.ts` - Data transformation utility

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Add widget to dashboard grid

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create data transformer**: Utility to convert JSONB category_scores to Recharts format
2. **Create widget skeleton**: Loading state with Card + circular skeleton
3. **Create chart config**: Define ChartConfig with labels and colors
4. **Create widget component**: SpiderChartWidget with RadarChart
5. **Add to dashboard**: Import and position in dashboard grid
6. **Wire up data**: Connect to loader data, handle dynamic categories
7. **Style and polish**: Responsive sizing, label truncation, tooltips

### Suggested Order
Data transformer → Skeleton → Chart config → Widget component → Dashboard integration → Data wiring → Polish

## Validation Commands
```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Visual verification
# 1. Start dev server: pnpm dev
# 2. Navigate to /home as logged-in user with survey responses
# 3. Verify spider chart displays with category scores
# 4. Hover to verify tooltips work
# 5. Verify "View Assessment" link works
```

## Related Files
- Initiative: `../initiative.md`
- Data Loader: `../S1692.I2.F1-Feature-progress-assessment-data-loader/feature.md`
- Existing radar chart: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
- Chart components: `packages/ui/src/shadcn/chart.tsx`
- Research: `../../research-library/context7-recharts-radar.md`
