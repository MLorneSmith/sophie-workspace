# Feature: Skills Spider Diagram Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2072.I2 |
| **Feature ID** | S2072.I2.F2 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 2 |

## Description

A dashboard widget displaying self-assessment category scores as a radar/spider diagram using the existing RadarChart component. Shows 5 skill categories (structure, story, substance, style, self-confidence) with the ability to identify strengths and growth areas. Includes no-assessment state with "Take Assessment" CTA.

## User Story
**As a** learner
**I want to** see my skills assessment results as a spider diagram
**So that** I can identify my strengths and areas for improvement at a glance

## Acceptance Criteria

### Must Have
- [ ] Radar/spider chart displaying 5 skill category scores
- [ ] Categories labeled around chart perimeter (readable orientation)
- [ ] Widget uses Card wrapper with header "Skills Assessment"
- [ ] No-assessment state shows empty spider outline with "Take Assessment" CTA
- [ ] Responsive sizing (aspect-square, works on mobile and desktop)
- [ ] Dark mode support via CSS variables
- [ ] Reuses existing `RadarChart` component pattern

### Nice to Have
- [ ] Highlight strongest category with subtle indicator
- [ ] Highlight growth area category with subtle indicator
- [ ] Tooltip showing exact score on hover

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `SkillsSpiderDiagram` (Card + RadarChart) | New |
| **Logic** | Data transformation from survey_responses to chart data | New |
| **Data** | `survey_responses` table query (from I1 loader) | Existing |
| **Database** | `survey_responses.category_scores` JSONB column | Existing |

## Architecture Decision

**Approach**: Minimal - Direct reuse of existing RadarChart component

**Rationale**:
- Existing `RadarChart` component at `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx` is production-ready
- Simply wrap in Card for dashboard context
- Reuse `ChartContainer` for theming
- Transform category_scores JSONB directly

### Key Architectural Choices
1. Create thin wrapper component that adapts RadarChart for dashboard use
2. Reuse existing `CategoryScores` interface and `chartConfig`
3. Handle null/undefined category_scores with engaging empty state

### Trade-offs Accepted
- No new chart configuration (uses existing)
- Same styling as assessment page (consistency is beneficial)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Card wrapper | Card, CardHeader, CardTitle | @kit/ui/card | Standard widget container |
| Chart container | ChartContainer | @kit/ui/chart | Theming and responsive sizing |
| Radar chart | RadarChart | Recharts via @kit/ui/chart | Existing pattern in codebase |
| Empty state | EmptyState | @kit/ui/makerkit/empty-state | Consistent with other widgets |

**Components to Install**: None (all exist)

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
- S2072.I2.F1 (Course Progress Radial Widget)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard/skills-spider-diagram.tsx` - Spider diagram widget component
- `apps/web/app/home/(user)/_components/dashboard/skills-spider-diagram.test.tsx` - Unit tests

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and place widget in grid slot

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create SkillsSpiderDiagram component**: Card wrapper with RadarChart
2. **Implement data transformation**: Convert survey_responses.category_scores to chart data
3. **Add no-assessment handling**: Empty state with "Take Assessment" CTA
4. **Integrate with dashboard page**: Place in Row 1, Column 2 of grid
5. **Add unit tests**: Test empty state, data rendering, responsive sizing

### Suggested Order
1. Create component with static mock data (copy existing RadarChart pattern)
2. Add data transformation logic
3. Handle no-assessment state
4. Integrate with I1 loader data
5. Add unit tests

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Unit tests
pnpm --filter web test -- --grep "skills-spider-diagram"

# Visual verification
pnpm dev
# Navigate to /home, verify spider diagram renders in Row 1, Column 2

# Test no-assessment state
# Use user account with no survey_responses records
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- Reference: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
- Reference: `packages/ui/src/shadcn/chart.tsx`
- Reference: `packages/ui/src/makerkit/empty-state.tsx`
- Research: `../../research-library/context7-recharts-radial-radar.md`
