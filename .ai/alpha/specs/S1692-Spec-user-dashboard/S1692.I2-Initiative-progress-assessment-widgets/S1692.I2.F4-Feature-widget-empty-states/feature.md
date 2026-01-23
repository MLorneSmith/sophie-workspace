# Feature: Widget Empty States

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1692.I2 |
| **Feature ID** | S1692.I2.F4 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 4 |

## Description
Implement empty state designs for the Course Progress Widget and Spider Chart Widget. When users have no course progress or haven't completed the self-assessment survey, display helpful empty states with clear CTAs guiding them to start the course or take the assessment.

## User Story
**As a** new SlideHeroes user
**I want to** see helpful guidance when I haven't started the course or taken the assessment
**So that** I understand what to do next and don't encounter confusing blank widgets

## Acceptance Criteria

### Must Have
- [ ] Course Progress Widget shows "Start Your Journey" empty state when no progress
- [ ] Spider Chart Widget shows "Complete Assessment" empty state when no survey data
- [ ] Empty states use existing EmptyState component pattern
- [ ] CTAs link to appropriate pages (/home/course, /home/assessment)
- [ ] Empty states fit within widget Card bounds

### Nice to Have
- [ ] Illustrative icons for each empty state
- [ ] Motivational microcopy

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Empty state variants for each widget | New |
| **UI** | EmptyState component | Existing (reuse) |
| **UI** | Icons | Existing (Lucide) |
| **Logic** | Conditional rendering in widgets | Modification |
| **Data** | Null/undefined checks | Existing |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Minimal - Conditional rendering with existing EmptyState component
**Rationale**: The codebase has an EmptyState component in `@kit/ui/empty-state` that provides the standard pattern. We simply add conditional rendering to each widget to show the empty state when data is null/undefined.

### Key Architectural Choices
1. Inline conditional rendering in widget components
2. Reuse EmptyState, EmptyStateHeading, EmptyStateText, EmptyStateButton components
3. Lucide React icons for visual appeal

### Trade-offs Accepted
- Empty states are widget-specific, not shared - acceptable for clear messaging per widget

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Empty container | EmptyState | @kit/ui/empty-state | Standard empty state pattern |
| Heading | EmptyStateHeading | @kit/ui/empty-state | Consistent typography |
| Description | EmptyStateText | @kit/ui/empty-state | Muted secondary text |
| CTA button | EmptyStateButton | @kit/ui/empty-state | Styled action button |
| Icons | BookOpen, Target, etc. | lucide-react | Visual context |

## Dependencies

### Blocks
- None - this is polish

### Blocked By
- F2: Course Progress Widget (needs widget to add empty state)
- F3: Spider Chart Widget (needs widget to add empty state)

### Parallel With
- None - sequential after widgets complete

## Files to Create/Modify

### New Files
- None - empty states are inline modifications

### Modified Files
- `apps/web/app/home/(user)/_components/course-progress-widget.tsx` - Add empty state conditional
- `apps/web/app/home/(user)/_components/spider-chart-widget.tsx` - Add empty state conditional

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Design empty state content**: Write copy for each widget's empty state
2. **Add Course Progress empty state**: Conditional render with "Start Your Journey" message
3. **Add Spider Chart empty state**: Conditional render with "Complete Assessment" message
4. **Visual polish**: Icons, spacing, responsive behavior

### Suggested Order
Design content → Course Progress empty state → Spider Chart empty state → Polish

## Validation Commands
```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Visual verification
# 1. Start dev server: pnpm dev
# 2. Create new test user or clear progress data
# 3. Navigate to /home
# 4. Verify empty states display correctly
# 5. Click CTAs and verify navigation works
```

## Related Files
- Initiative: `../initiative.md`
- Course Progress Widget: `../S1692.I2.F2-Feature-course-progress-widget/feature.md`
- Spider Chart Widget: `../S1692.I2.F3-Feature-spider-chart-widget/feature.md`
- EmptyState component: `packages/ui/src/makerkit/empty-state.tsx`
