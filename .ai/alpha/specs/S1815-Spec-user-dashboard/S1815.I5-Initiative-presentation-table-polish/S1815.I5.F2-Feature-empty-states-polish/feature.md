# Feature: Empty States Polish

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1815.I5 |
| **Feature ID** | S1815.I5.F2 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 2 |

## Description
Implement consistent, compelling empty states across all 7 dashboard widgets. Each empty state guides users toward their first action with clear CTAs and helpful messaging. This ensures new users have a positive onboarding experience.

## User Story
**As a** new SlideHeroes user with no data
**I want to** see helpful empty states that guide me to take action
**So that** I understand what each widget displays and how to get started

## Acceptance Criteria

### Must Have
- [ ] Consistent empty state design across all 7 widgets
- [ ] Clear, action-oriented messaging for each widget type
- [ ] Compelling CTA buttons directing to appropriate actions
- [ ] Empty states for:
  - Course Progress Widget → "Start Course" CTA
  - Spider Chart Widget → "Take Assessment" CTA
  - Kanban Summary Widget → "Create Task" CTA
  - Activity Feed Widget → "Get Started" message (no CTA needed)
  - Quick Actions Panel → Always shows actions (no empty state)
  - Coaching Sessions Widget → "Book Session" CTA
  - Presentations Table Widget → "Create Presentation" CTA

### Nice to Have
- [ ] Empty state illustrations (SVG icons or simple graphics)
- [ ] Animated entrance for empty states

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Empty state variants per widget | New |
| **Logic** | Conditional rendering based on data presence | Existing |
| **Data** | Data fetching with null/empty checks | Existing |
| **Database** | N/A | Existing |

## Architecture Decision

**Approach**: Minimal
**Rationale**: Use existing EmptyState component composition pattern. Each widget already handles loading states; we add consistent empty state rendering. No new components needed, just composition of existing EmptyState, EmptyStateHeading, EmptyStateText, EmptyStateButton.

### Key Architectural Choices
1. Reuse existing `EmptyState` component with subcomponents from `@kit/ui/empty-state`
2. Create a shared empty state configuration object for consistency
3. Each widget handles its own empty state rendering (no wrapper component)

### Trade-offs Accepted
- No illustrations for v1 (text-only empty states) - keeps scope manageable
- No animations for v1 - focus on content and CTAs

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Container | EmptyState | @kit/ui/empty-state | Consistent dashed border pattern |
| Title | EmptyStateHeading | @kit/ui/empty-state | Bold, clear messaging |
| Description | EmptyStateText | @kit/ui/empty-state | Muted explanatory text |
| Action | EmptyStateButton | @kit/ui/empty-state | Primary CTA styling |
| Icons | Lucide icons | lucide-react | Consistent iconography |

**Components to Install**: None - all components already exist

## Required Credentials
> Environment variables required for this feature to function.

None required - UI-only feature.

## Dependencies

### Blocks
- F3: Accessibility Compliance (needs empty states for screen reader testing)
- F4: E2E Dashboard Tests (needs empty state scenarios for test coverage)

### Blocked By
- F1: Presentation Table Widget (provides table empty state context)
- All widget components from I1-I4 must exist

### Parallel With
- None

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/widget-empty-states.tsx` - Shared empty state configs (optional)

### Modified Files
- `apps/web/app/home/(user)/_components/course-progress-widget.tsx` - Add empty state
- `apps/web/app/home/(user)/_components/spider-chart-widget.tsx` - Add empty state
- `apps/web/app/home/(user)/_components/kanban-summary-widget.tsx` - Add empty state
- `apps/web/app/home/(user)/_components/activity-feed-widget.tsx` - Add empty state
- `apps/web/app/home/(user)/_components/coaching-sessions-widget.tsx` - Add empty state
- `apps/web/app/home/(user)/_components/presentations-table-widget.tsx` - Standardize empty state

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Define empty state content**: Create content map with heading, text, CTA for each widget
2. **Course Progress empty state**: Add empty state when no course_progress record
3. **Spider Chart empty state**: Add empty state when no survey_responses
4. **Kanban Summary empty state**: Add empty state when no tasks
5. **Activity Feed empty state**: Add message when no activities
6. **Coaching Sessions empty state**: Add empty state with Book CTA
7. **Presentations Table empty state**: Standardize to match pattern
8. **Add data-testid attributes**: For E2E empty state testing
9. **Visual QA**: Verify consistent styling across all empty states

### Suggested Order
1. Content Map → 2-7. Widget empty states (parallel) → 8. Test IDs → 9. Visual QA

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Visual verification
pnpm dev
# Create fresh user account and verify each empty state

# Verify CTAs work
# Click each CTA and verify navigation

# Lint and format
pnpm lint:fix
pnpm format:fix
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- Reference: `packages/ui/src/makerkit/empty-state.tsx`
- Reference: `apps/web/app/home/(user)/_components/home-accounts-list.tsx` (pattern)
