# Feature: Empty States Polish

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1823.I5 |
| **Feature ID** | S1823.I5.F2 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 2 |

## Description
Design and implement contextual empty states for all 7 dashboard widgets with appropriate messaging and CTAs. Empty states guide new users to first actions, providing helpful onboarding and clear next steps when data is not yet available.

## User Story
**As a** new user with no activity data
**I want to** see helpful empty states with clear next steps
**So that** I understand what each widget will show and how to get started

## Acceptance Criteria

### Must Have
- [ ] Course Progress widget: Empty state with "Start Course" CTA
- [ ] Assessment Spider Chart: Empty state with "Take Assessment" CTA
- [ ] Kanban Summary: Empty state with "Create First Task" CTA
- [ ] Activity Feed: Empty state with encouraging message (no CTA needed)
- [ ] Quick Actions: Always shows actions (no empty state - contextual defaults)
- [ ] Coaching Sessions: Empty state with "Book Session" CTA (from I4)
- [ ] Presentation Table: Empty state with "Create Presentation" CTA
- [ ] Consistent visual styling across all empty states
- [ ] Icons appropriate to each widget's purpose
- [ ] Touch-friendly CTA buttons (48px+ tap targets)

### Nice to Have
- [ ] Subtle animations on empty state icons
- [ ] Localized messages using i18n

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Empty state variants for each widget | New |
| **Logic** | Conditional rendering based on data presence | Existing pattern |
| **Data** | N/A - Uses existing loaders | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic - Use existing EmptyState component
**Rationale**: Leverage the composable EmptyState component (`@kit/ui/empty-state`) which already provides Heading, Text, and Button sub-components. Follow existing patterns from home-accounts-list.tsx.

### Key Architectural Choices
1. Use `EmptyState`, `EmptyStateHeading`, `EmptyStateText`, `EmptyStateButton` from @kit/ui
2. Wrap each widget's content in conditional render (data.length > 0)
3. Use lucide-react icons for visual context (48px size for empty states)
4. CTAs link to appropriate creation/action pages

### Trade-offs Accepted
- Hardcoded CTA paths (vs. config) - simpler for 7 widgets
- English-first messages - i18n can be added later

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Container | EmptyState | @kit/ui/empty-state | Existing composable pattern |
| Heading | EmptyStateHeading | @kit/ui/empty-state | Consistent typography |
| Text | EmptyStateText | @kit/ui/empty-state | Muted foreground styling |
| CTA | EmptyStateButton | @kit/ui/empty-state | Properly spaced button |
| Icons | Various | lucide-react | Consistent icon library |

**Components to Install**: None - all components already available

## Required Credentials
> Environment variables required for this feature to function. Extracted from research files.

None required - UI-only feature.

## Dependencies

### Blocks
- F3: Accessibility compliance needs empty states for ARIA label testing
- F4: E2E tests need empty states to test against

### Blocked By
- F1: Presentation table widget for its empty state
- S1823.I1: Dashboard foundation with all widgets
- S1823.I2.F1: Course progress widget
- S1823.I2.F2: Assessment spider chart widget
- S1823.I3.F1: Kanban summary widget
- S1823.I3.F3: Activity feed widget
- S1823.I4.F2: Coaching sessions widget

### Parallel With
- None (depends on F1 completion)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/empty-states/course-progress-empty.tsx`
- `apps/web/app/home/(user)/_components/empty-states/assessment-empty.tsx`
- `apps/web/app/home/(user)/_components/empty-states/kanban-empty.tsx`
- `apps/web/app/home/(user)/_components/empty-states/activity-empty.tsx`
- `apps/web/app/home/(user)/_components/empty-states/presentations-empty.tsx`
- `apps/web/app/home/(user)/_components/empty-states/index.ts` - Barrel export

### Modified Files
- `apps/web/app/home/(user)/_components/course-progress-widget.tsx` - Add empty state conditional
- `apps/web/app/home/(user)/_components/assessment-widget.tsx` - Add empty state conditional
- `apps/web/app/home/(user)/_components/kanban-summary-widget.tsx` - Add empty state conditional
- `apps/web/app/home/(user)/_components/activity-feed-widget.tsx` - Add empty state conditional
- `apps/web/app/home/(user)/_components/presentation-table-widget.tsx` - Add empty state conditional
- Widget from I4 for coaching sessions empty state

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create empty state components**: One per widget type
2. **Define CTA paths**: Map widget to appropriate creation page
3. **Select icons**: Choose lucide-react icons for each widget
4. **Write empty state messages**: Helpful, positive copy for each
5. **Integrate into widgets**: Add conditional rendering
6. **Test with empty data**: Verify all states render correctly
7. **Visual validation**: Screenshot capture of all empty states

### Suggested Order
Group by similarity:
1. Create all empty state components (parallel work)
2. Integrate into existing widgets
3. Visual validation and polish

## Empty State Specifications

| Widget | Icon | Heading | Text | CTA |
|--------|------|---------|------|-----|
| Course Progress | `GraduationCap` | "Start your learning journey" | "Begin the Decks for Decision Makers course to track your progress here." | "Start Course" → /home/course |
| Assessment | `Target` | "Discover your strengths" | "Take the self-assessment to see your skills mapped on this spider chart." | "Take Assessment" → /home/assessment |
| Kanban | `CheckSquare` | "Organize your work" | "Create your first task to start managing your presentation workflow." | "Create Task" → /home/kanban |
| Activity | `Activity` | "No activity yet" | "Your recent lessons, quizzes, and presentations will appear here as you work." | None |
| Presentations | `FileText` | "Create your first presentation" | "Start building your presentation outline and see it listed here." | "New Presentation" → /home/ai/canvas |
| Coaching | `Calendar` | "Book a coaching session" | "Schedule time with a coach to accelerate your presentation skills." | "Book Session" → Cal.com embed |

## Validation Commands
```bash
# Test with empty database (new user scenario)
# Create test user without any data

# Visual validation - capture all empty states
agent-browser open http://localhost:3000/home
agent-browser screenshot /tmp/empty-states-dashboard.png

# Verify CTA buttons are accessible
agent-browser find role button
```

## Related Files
- Initiative: `../initiative.md`
- EmptyState Component: `packages/ui/src/makerkit/empty-state.tsx`
- Existing Usage: `apps/web/app/home/(user)/_components/home-accounts-list.tsx`
- Dashboard UX Research: `../../../research-library/perplexity-dashboard-ux.md`
