# Feature: Empty States Polish

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1864.I5 |
| **Feature ID** | S1864.I5.F2 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 2 |

## Description
Standardize and refine empty state designs across all 7 dashboard widgets to provide consistent, helpful messaging that guides users toward meaningful actions. Each empty state should follow a unified pattern while being contextually appropriate for its widget.

## User Story
**As a** new SlideHeroes user with incomplete data
**I want to** see clear, helpful messages when dashboard widgets have no data
**So that** I understand what each widget shows and know what action to take to populate it

## Acceptance Criteria

### Must Have
- [ ] All 7 widgets have consistent empty state structure (icon + heading + description + CTA)
- [ ] Empty states use `@kit/ui/empty-state` components (EmptyState, EmptyStateHeading, EmptyStateText, EmptyStateButton)
- [ ] Each empty state has contextually appropriate messaging and CTA
- [ ] CTAs navigate to the correct action (e.g., "Take Assessment" → assessment page)
- [ ] Empty states render correctly on mobile, tablet, and desktop
- [ ] Icons are contextually relevant (Lucide icons, muted foreground color)

### Nice to Have
- [ ] Consistent minimum height across all widget empty states
- [ ] Animation on CTA button hover

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Empty state markup for 7 widgets | New/Modified |
| **Logic** | Conditional rendering based on data presence | Existing |
| **Data** | None - uses existing widget data | Existing |
| **Database** | None | N/A |

## Architecture Decision

**Approach**: Minimal - Standardize existing EmptyState component usage
**Rationale**: EmptyState component already exists with all needed subcomponents. This feature is about consistent application of the pattern, not new infrastructure.

### Key Architectural Choices
1. Use compound EmptyState components from `@kit/ui/empty-state`
2. Standard layout: Icon (12x12, muted) → Heading → Description → CTA Button
3. Consistent min-height (200px) to prevent layout shift
4. i18n support via Trans component for all text

### Trade-offs Accepted
- English-only text for MVP (i18n keys can be added later)
- Single CTA per empty state (simplicity over flexibility)

## Required Credentials
> None required

## Dependencies

### Blocks
- F4 (E2E Tests) - needs polished empty states to test

### Blocked By
- S1864.I1.F2 (Dashboard Page Shell) - needs widgets to exist
- S1864.I2.F1 (Course Progress Widget) - needs widget to polish
- S1864.I2.F2 (Assessment Widget) - needs widget to polish
- S1864.I3.F1 (Kanban Summary Widget) - needs widget to polish
- S1864.I3.F3 (Activity Feed Widget) - needs widget to polish
- S1864.I3.F4 (Quick Actions Panel) - needs widget to polish
- S1864.I4.F2 (Coaching Widget) - needs widget to polish
- S1864.I5.F1 (Presentation Table Widget) - needs widget to polish

### Parallel With
- F3 (Accessibility Compliance) - can work in parallel on different aspects

## Files to Create/Modify

### New Files
- None

### Modified Files
- `apps/web/app/home/(user)/_components/course-progress-widget.tsx` - Add/refine empty state
- `apps/web/app/home/(user)/_components/assessment-spider-widget.tsx` - Add/refine empty state
- `apps/web/app/home/(user)/_components/kanban-summary-widget.tsx` - Add/refine empty state
- `apps/web/app/home/(user)/_components/activity-feed-widget.tsx` - Add/refine empty state
- `apps/web/app/home/(user)/_components/quick-actions-panel.tsx` - Add/refine empty state (if applicable)
- `apps/web/app/home/(user)/_components/coaching-sessions-widget.tsx` - Add/refine empty state
- `apps/web/app/home/(user)/_components/presentations-table-widget.tsx` - Add/refine empty state

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Container | EmptyState | @kit/ui/empty-state | Standard empty state wrapper |
| Heading | EmptyStateHeading | @kit/ui/empty-state | h3 with consistent styling |
| Description | EmptyStateText | @kit/ui/empty-state | Muted text for context |
| CTA Button | EmptyStateButton | @kit/ui/empty-state | Extends Button with margin |
| Icons | Various | lucide-react | Contextual icons per widget |

**Components to Install**: None - all components already available

## Empty State Specifications

| Widget | Icon | Heading | Description | CTA | CTA Target |
|--------|------|---------|-------------|-----|------------|
| Course Progress | BookOpen | Start your learning journey | Begin the presentation skills course to track your progress | Start Course | /home/course |
| Assessment Spider | Target | Complete your assessment | Take the self-assessment to see your skill profile | Take Assessment | /home/assessment/survey |
| Kanban Summary | CheckSquare | No active tasks | Create tasks to track your presentation preparation | View Kanban | /home/kanban |
| Activity Feed | Activity | No recent activity | Your learning activities will appear here as you progress | — | None (info only) |
| Quick Actions | Zap | Get started | Choose an action below to begin | — | Dynamic |
| Coaching Sessions | Calendar | No upcoming sessions | Book a coaching session to get personalized feedback | Book Session | Cal.com embed |
| Presentations | FileText | No presentations yet | Create your first presentation to get started | New Presentation | /home/ai/canvas |

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Audit current empty states**: Review all 7 widgets for existing empty state implementations
2. **Create empty state pattern guide**: Document standard structure and styling
3. **Implement Course Progress empty state**: Add standardized empty state
4. **Implement Assessment empty state**: Add standardized empty state
5. **Implement Kanban Summary empty state**: Add standardized empty state
6. **Implement Activity Feed empty state**: Add standardized empty state (no CTA)
7. **Implement Quick Actions empty state**: Add standardized empty state (or determine if always has content)
8. **Implement Coaching Sessions empty state**: Add standardized empty state with booking CTA
9. **Implement Presentations Table empty state**: Add standardized empty state
10. **Visual QA**: Verify consistency across all widgets on all breakpoints

### Suggested Order
1. Pattern guide → 2-8. Widget implementations (can parallelize) → 9. Visual QA

## Validation Commands
```bash
# Type check
pnpm typecheck

# Lint
pnpm lint:fix

# Manual testing
# 1. Create test user with no data
# 2. Navigate to /home dashboard
# 3. Verify all 7 widgets show empty states
# 4. Check each CTA navigates correctly
# 5. Test responsive behavior (mobile/tablet/desktop)
```

## Related Files
- Initiative: `../initiative.md`
- EmptyState component: `packages/ui/src/makerkit/empty-state.tsx`
- EmptyState examples: `apps/dev-tool/app/components/components/empty-state-story.tsx`
