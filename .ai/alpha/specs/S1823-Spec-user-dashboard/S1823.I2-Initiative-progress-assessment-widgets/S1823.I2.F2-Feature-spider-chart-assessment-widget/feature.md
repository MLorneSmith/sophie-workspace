# Feature: Spider Chart Assessment Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1823.I2 |
| **Feature ID** | S1823.I2.F2 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 2 |

## Description
Create a dashboard widget that displays the user's self-assessment results using a spider/radar chart visualization. The widget shows category scores from the survey responses, helping users identify their strengths and areas for improvement in presentation skills.

## User Story
**As a** learner on the SlideHeroes platform
**I want to** see my assessment results visualized as a spider chart on my dashboard
**So that** I can quickly understand my strengths and weaknesses across presentation skill categories

## Acceptance Criteria

### Must Have
- [ ] Widget displays radar/spider chart with category labels on axes
- [ ] Chart shows scores from completed self-assessment survey
- [ ] Widget handles empty state (no assessment taken) with CTA to take assessment
- [ ] Widget uses skeleton loading state during data fetch
- [ ] Category labels are readable and properly positioned
- [ ] Widget is accessible (WCAG 2.1 AA) with proper ARIA labels

### Nice to Have
- [ ] Tooltip showing exact score on hover for each category
- [ ] Highlight highest/lowest scoring categories visually
- [ ] Link to full assessment results page

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `AssessmentSpiderWidget.tsx` (card wrapper + enhanced radar chart) | New |
| **Logic** | Data transformation from category_scores JSONB to chart data | New |
| **Data** | `loadAssessmentScoresForWidget()` loader function | New |
| **Database** | `survey_responses` table with `category_scores` JSONB | Existing |

## Architecture Decision

**Approach**: Pragmatic - Adapt existing `radar-chart.tsx` component for dashboard context

**Rationale**: The existing `radar-chart.tsx` at `/assessment/survey/_components/` already implements the Recharts RadarChart with proper configuration. We'll create a widget wrapper that:
1. Adds Card container with title
2. Passes category_scores data through
3. Handles empty/loading states
4. Optimizes sizing for dashboard grid cell

### Key Architectural Choices
1. **Reuse radar-chart**: Import existing component, adjust props for dashboard context
2. **Server Component widget**: Data loading on server, chart renders client-side (Recharts requirement)
3. **JSONB direct mapping**: category_scores JSONB maps directly to chart data format

### Trade-offs Accepted
- Single survey type ("self-assessment") hardcoded - acceptable for v1
- Fixed chart colors from existing implementation
- No trend comparison (current vs previous assessment)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Card container | Card/CardHeader/CardContent | shadcn/ui | Standard dashboard pattern |
| Spider/Radar chart | radar-chart | Existing `/assessment/survey/_components/` | Proven Recharts implementation |
| Empty state CTA | Button | shadcn/ui | Navigate to assessment |
| Loading state | Skeleton | shadcn/ui | Consistent loading UX |
| Chart wrapper | ChartContainer | @kit/ui/chart | Shadcn chart theming |

**Components to Install** (if not already in packages/ui):
- [x] Card (already exists)
- [x] Button (already exists)
- [x] Skeleton (already exists)
- [x] Chart components (already exists via Recharts + Shadcn wrapper)

## Required Credentials
> None required - Uses internal Supabase queries only

## Dependencies

### Blocks
- None

### Blocked By
- S1823.I1.F1: Types and Dashboard Loader (provides `DashboardData` type and loader infrastructure)
- S1823.I1.F3: Responsive Grid Layout (provides grid cell placement)
- F1: Course Progress Radial Widget (establishes widget patterns for this initiative)

### Parallel With
- None within this initiative

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/widgets/assessment-spider-widget.tsx` - Widget component
- `apps/web/app/home/(user)/_lib/server/loaders/assessment-scores.loader.ts` - Data loader

### Modified Files
- `apps/web/app/home/(user)/_lib/server/dashboard.loader.ts` - Import and call assessment scores loader
- `apps/web/app/home/(user)/_lib/types/dashboard.types.ts` - Add AssessmentWidgetData type

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create AssessmentWidgetData type**: Define TypeScript interface for widget data
2. **Create assessment scores loader**: Fetch from survey_responses table, extract category_scores
3. **Create AssessmentSpiderWidget component**: Server/Client hybrid with Card + radar chart
4. **Create widget skeleton**: Loading state component matching radar chart shape
5. **Handle empty state**: Design for users without completed assessment
6. **Integrate with dashboard**: Add to grid layout in second position

### Suggested Order
1. Types first (provides contracts)
2. Loader (provides data)
3. Skeleton (loading state)
4. Widget component (consumes data)
5. Empty state handling
6. Dashboard integration

## Validation Commands
```bash
# TypeScript check
pnpm --filter web typecheck

# Lint check
pnpm --filter web lint

# Unit tests (if added)
pnpm --filter web test:unit -- --grep "AssessmentSpiderWidget"

# Visual validation
pnpm dev # Navigate to /home, verify widget renders with spider chart
```

## Related Files
- Initiative: `../initiative.md`
- Existing Radar Chart: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
- Survey Responses Table: `apps/web/supabase/migrations/20250319104724_web_survey_system.sql`
- Recharts Research: `../../research-library/context7-recharts-radar.md`
- Tasks: `./tasks.json` (created in next phase)
