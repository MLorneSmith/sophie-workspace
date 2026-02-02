# Feature: Self-Assessment Spider Diagram

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1890.I3 |
| **Feature ID** | S1890.I3.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
Create a self-assessment spider diagram (radar chart) component for the user dashboard that visualizes the user's skills across the 5S framework dimensions (Structure, Story, Style, Substance, Self-Confidence). The component adapts the existing RadarChart pattern from the assessment feature with dashboard-specific styling and empty state handling.

## User Story
**As a** SlideHeroes learner
**I want to** see my skills assessment visualized as a spider diagram on my dashboard
**So that** I can quickly understand my strengths and weaknesses across the 5S presentation dimensions

## Acceptance Criteria

### Must Have
- [ ] Radar chart displays 5 dimensions from survey_responses.category_scores
- [ ] Chart wrapped in Card component with "5S Skills Assessment" title
- [ ] Empty state displays when no survey data exists (with CTA to take assessment)
- [ ] Chart uses ChartContainer wrapper for theme consistency
- [ ] Responsive sizing with ResponsiveContainer and initialDimension for SSR
- [ ] TypeScript props interface with categoryScores: Record<string, number>

### Nice to Have
- [ ] Tooltip showing exact score on hover
- [ ] Link to full assessment results page
- [ ] Animation on data load

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | SkillsSpiderDiagram component | New |
| **Logic** | Data transformation (Object to Array) | New |
| **Data** | Props from parent (via I2 loader) | Existing from I2 |
| **Database** | survey_responses.category_scores | Existing |

## Architecture Decision

**Approach**: Pragmatic - Adapt existing RadarChart component
**Rationale**: The existing `radar-chart.tsx` in `/assessment/survey/_components/` provides 95% of the needed functionality. Adapting it reduces development time and ensures consistency with existing patterns.

### Key Architectural Choices
1. Reuse ChartContainer + Recharts RadarChart pattern from existing assessment feature
2. Server Component passes data as props (no client-side fetching in this component)
3. Handle empty state with conditional rendering inside Card wrapper

### Trade-offs Accepted
- Component is client-side only (due to Recharts interactivity) - acceptable for small data set
- Empty state design is basic for now (I7 will enhance with illustrations)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Card wrapper | Card, CardHeader, CardTitle, CardContent | @kit/ui/card | Consistent with dashboard design |
| Chart theming | ChartContainer, ChartConfig | @kit/ui/chart | Theme-aware colors |
| Radar chart | RadarChart, PolarGrid, PolarAngleAxis, Radar | recharts | Existing pattern |
| Empty state | Custom div | Custom | Simple for now, I7 will enhance |

**Components to Install**: None - all components already available

## Required Credentials
> Environment variables required for this feature to function.

None required - all data comes from local database via server-side loader.

## Dependencies

### Blocks
- F3: Progress Widgets Integration (needs this chart component)
- S1890.I7: Empty States & Polish (will enhance empty state design)

### Blocked By
- S1890.I1.F1: Dashboard page grid layout (needs layout container)
- S1890.I2.F2: Survey data loader (needs categoryScores data)

### Parallel With
- F2: Course Progress Radial Chart (independent component)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/skills-spider-diagram.tsx` - Main component

### Modified Files
- None initially (page integration happens in F3)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create SkillsSpiderDiagram component**: Copy radar-chart.tsx structure, update imports and props
2. **Implement data transformation**: Convert Record<string, number> to chart data array
3. **Add empty state handling**: Conditional rendering when categoryScores is empty
4. **Configure chart styling**: Use ChartConfig with theme colors
5. **Add SSR support**: ResponsiveContainer with initialDimension
6. **Write unit tests**: Test rendering with data and empty state

### Suggested Order
T1 (scaffold) → T2 (data transform) → T3 (empty state) → T4 (styling) → T5 (SSR) → T6 (tests)

## Validation Commands
```bash
# Verify file exists
test -f apps/web/app/home/\(user\)/_components/skills-spider-diagram.tsx && echo "✓ Component exists"

# Contains RadarChart import
grep -q "RadarChart" apps/web/app/home/\(user\)/_components/skills-spider-diagram.tsx && echo "✓ Uses Recharts"

# Contains initialDimension for SSR
grep -q "initialDimension" apps/web/app/home/\(user\)/_components/skills-spider-diagram.tsx && echo "✓ SSR-safe"

# Contains empty state handling
grep -q "empty\|Empty" apps/web/app/home/\(user\)/_components/skills-spider-diagram.tsx && echo "✓ Has empty state"

# Typecheck passes
pnpm typecheck

# Visual verification
# Start dev server: pnpm dev
# Navigate to dashboard with test data
# Verify chart renders and responds to hover
```

## Related Files
- Initiative: `../initiative.md`
- Existing RadarChart: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
- ChartContainer: `packages/ui/src/shadcn/chart.tsx`
- Research: `../../research-library/context7-recharts-radial-radar.md`
