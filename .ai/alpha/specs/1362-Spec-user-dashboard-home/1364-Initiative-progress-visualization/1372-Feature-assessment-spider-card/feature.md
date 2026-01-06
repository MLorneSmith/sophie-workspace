# Feature: Assessment Spider Card

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | #1364 |
| **Feature ID** | 1364-F2 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 2 |

## Description
Dashboard card displaying self-assessment category scores using the existing RadarChart (spider diagram) component. Shows skill distribution across categories. Includes empty state with CTA for users who haven't taken the assessment.

## User Story
**As a** SlideHeroes user
**I want to** see my self-assessment results at a glance on my dashboard
**So that** I understand my strengths and areas for improvement

## Acceptance Criteria

### Must Have
- [ ] RadarChart displays category scores from latest assessment
- [ ] All categories visible on spider diagram axes
- [ ] Empty state displays when no assessment exists
- [ ] "Take Assessment" CTA button links to /home/assessment
- [ ] Card integrates with dashboard grid layout from I1

### Nice to Have
- [ ] Highest/lowest category highlight
- [ ] Last assessment date displayed

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `AssessmentSpiderCard` component | New |
| **Logic** | `loadLatestAssessmentScores` loader | New |
| **Data** | `survey_responses.category_scores` | Existing |
| **Database** | RLS policies on survey_responses | Existing |

## Architecture Decision

**Approach**: Minimal Extension Pattern
**Rationale**: RadarChart already exists with perfect dimensions (max-h-[250px]), Server Component for faster initial load, null return triggers graceful empty state.

### Key Architectural Choices
1. Reuse existing RadarChart component as-is (includes Card wrapper)
2. Server Component with async data loading
3. Query latest survey_responses ordered by created_at DESC

### Trade-offs Accepted
- No real-time updates (acceptable for assessment results)
- RadarChart has built-in Card wrapper (slightly different from other cards if empty)

## Dependencies

### Blocks
- None

### Blocked By
- I1: Dashboard Foundation #1363 (provides dashboard grid layout)

### Parallel With
- F1: Course Progress Card (can develop simultaneously)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/assessment-spider-card.tsx` - Dashboard card component (~50 lines)
- `apps/web/app/home/(user)/_lib/server/load-latest-assessment-scores.ts` - Data loader (~30 lines)

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Add import and component to dashboard grid (~4 lines)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create data loader**: Implement `loadLatestAssessmentScores()` with Supabase query
2. **Create card component**: Build `AssessmentSpiderCard` with RadarChart integration
3. **Implement empty state**: Add EmptyState with "Take Assessment" CTA
4. **Integrate into dashboard**: Modify page.tsx to include the card
5. **Add tests**: Unit tests for loader, component rendering

### Suggested Order
1. Data loader (foundation)
2. Card component with RadarChart
3. Empty state handling
4. Dashboard integration
5. Verification and tests

## Validation Commands
```bash
# TypeScript check
pnpm typecheck

# Lint and format
pnpm lint:fix && pnpm format:fix

# Unit tests for components
pnpm --filter web test:unit -- assessment-spider

# E2E test for dashboard
pnpm --filter web-e2e test -- dashboard-assessment
```

## Related Files
- Initiative: `../initiative.md`
- RadarChart: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
- Empty State: `packages/ui/src/shadcn/empty-state.tsx`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
