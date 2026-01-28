# Feature: Assessment Spider Chart Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1877.I2 |
| **Feature ID** | S1877.I2.F2 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 2 |

## Description

Radar/spider chart visualizing self-assessment scores across presentation skill categories. Displays multi-axis chart showing strengths and areas for improvement, with "Complete Assessment" CTA when no data exists.

## User Story

**As a** Learning Lauren (active course participant)
**I want to** see my assessment scores displayed as a radar/spider chart
**So that** I can identify my strengths and areas for improvement at a glance

## Acceptance Criteria

### Must Have
- [ ] Radar chart displays category scores from `survey_responses.category_scores` JSONB
- [ ] Chart axes labeled with category names (Content, Structure, Delivery, Timing, Visuals, Audience)
- [ ] Score scale is 0-100 with clear visual representation
- [ ] Empty state shows "Complete Assessment" CTA when no survey response exists
- [ ] Loading skeleton shows during data fetch
- [ ] Responsive layout (scales proportionally on mobile/tablet/desktop)
- [ ] Tooltip displays category name and score on hover

### Nice to Have
- [ ] Click on chart sections to filter activity feed by that skill
- [ ] Previous assessment overlay (for comparison - future v2)
- [ ] Export as PNG functionality

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | AssessmentSpiderWidget | New |
| **Logic** | AssessmentDataLoader | New |
| **Data** | survey_responses table | Existing |
| **Database** | None (existing tables only) | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Adapt existing `radar-chart.tsx` from assessment page. It already uses Recharts RadarChart with category_scores JSONB pattern. Minimal changes needed for dashboard integration.

### Key Architectural Choices

1. **Re-use existing RadarChart component** - Copy from `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx` with minimal adaptation
2. **Server component for data loading** - Query survey_responses for latest user response, parse category_scores JSONB
3. **Adaptive empty state** - When no survey response exists, show CTA to complete assessment instead of empty chart
4. **Rechart RadarChart from @kit/ui/chart** - Uses existing ChartContainer wrapper with theming support

### Trade-offs Accepted
- No historical comparison (current assessment only)
- Limited to most recent survey response (v1 scope)
- Chart size fixed at max 250px height for layout consistency

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Radar/spider chart | Adapted from `radar-chart.tsx` | Existing assessment page | Recharts RadarChart with JSONB parsing already working |
| Widget container | `Card`, `CardHeader`, `CardContent` from `@kit/ui/card` | shadcn/ui | Standard card pattern across dashboard |
| Loading state | `Skeleton` from `@kit/ui/skeleton` | shadcn/ui | Consistent loading patterns |
| Empty state CTA | Custom with `Button`, `ArrowRight` from `lucide-react` | Custom | Guided action to complete assessment |

**Components to Install** (if not already in packages/ui):
- None (all required components confirmed existing)

## Required Credentials

| Variable | Description | Source |
|----------|-------------|--------|
| None required | No external APIs or services used | N/A |

## Dependencies

### Blocks
- None (foundation feature)

### Blocked By
- S1877.I1 (Dashboard Foundation - provides grid container and page structure)

### Parallel With
- S1877.I2.F1 (Course Progress Widget - both use loader states)
- S1877.I2.F3 (Widget States - provides shared patterns)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard/assessment-spider-widget.tsx` - Main widget component
- `apps/web/app/home/(user)/_lib/server/assessment-data.loader.ts` - Data loader for survey responses

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and render AssessmentSpiderWidget

## Task Hints

> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create assessment data loader**: Query survey_responses table for latest user response, parse category_scores JSONB
2. **Build AssessmentSpiderWidget component**: Adapt existing radar-chart.tsx, add empty state with CTA
3. **Integrate ChartContainer**: Ensure proper theming and responsive sizing
4. **Add empty state CTA**: Route to assessment survey page

### Suggested Order
1. Create loader function first (data dependencies)
2. Adapt existing radar-chart component
3. Add empty state with navigation
4. Connect real data via loader
5. Add loading/empty states

## Validation Commands

```bash
# Verify spider chart displays on dashboard
pnpm dev:web && curl -s http://localhost:3000/home | grep -q "Survey Results"

# Verify radar chart renders
pnpm dev:web && curl -s http://localhost:3000/home | grep -q "Radar"

# Typecheck after implementation
pnpm typecheck

# Verify empty state CTA displays when no assessment data
# Verify tooltip on hover (manual testing)
```

## Related Files

- Initiative: `../initiative.md`
- Foundation: `../../S1877.I1-Initiative-dashboard-foundation/`
- Reusable Components: `RadarChart` at `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
