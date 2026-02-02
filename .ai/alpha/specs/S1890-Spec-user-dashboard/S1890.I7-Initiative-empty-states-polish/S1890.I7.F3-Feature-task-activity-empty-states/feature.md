# Feature: Task & Activity Empty States

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1890.I7 |
| **Feature ID** | S1890.I7.F3 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 3 |

## Description
Design and implement engaging empty states for the Kanban Summary Card and Recent Activity Feed widgets. The Kanban empty state optionally displays an onboarding checklist for new users. The Activity Feed empty state explains what will appear with a preview format.

## User Story
**As a** new user with no tasks or activity
**I want to** see helpful guidance about these widgets
**So that** I understand what will appear and feel welcomed rather than seeing blank spaces

## Acceptance Criteria

### Must Have
- [ ] Kanban Summary empty state displays "Track your learning tasks" heading
- [ ] Kanban Summary empty state has "View Task Board" CTA linking to `/home/kanban`
- [ ] Activity Feed empty state displays "Your activity will appear here" heading
- [ ] Activity Feed empty state shows sample activity format preview (greyed out)
- [ ] Activity Feed empty state is informational (no CTA - activity auto-populates)
- [ ] Both empty states use consistent EmptyState component styling
- [ ] Both empty states render correctly in dark mode

### Nice to Have
- [ ] Onboarding checklist in Kanban empty state for brand new users
- [ ] Checklist items: "Take skills assessment", "Start first lesson", "Create a presentation"
- [ ] Checklist links to respective features
- [ ] Activity feed preview shows timeline format example

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | 2 empty state components + optional checklist | New |
| **Logic** | Conditional rendering in parent widgets | Modify |
| **Data** | N/A (uses existing data from I2) | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic - Empty states inline with optional onboarding checklist component
**Rationale**: Kanban and Activity widgets have different empty state needs. Kanban benefits from actionable checklist while Activity is purely informational. Separate approaches serve different user intents.

### Key Architectural Choices
1. Kanban empty state includes optional OnboardingChecklist component
2. Activity Feed empty state shows preview format with muted styling
3. OnboardingChecklist tracks completion via existing user data (assessment, lessons, presentations)

### Trade-offs Accepted
- Onboarding checklist adds complexity but significantly improves new user experience
- Preview format in Activity Feed requires maintaining design sync with actual feed

## Required Credentials
> None required - empty states use existing routing and data.

## Dependencies

### Blocks
- None

### Blocked By
- F1: Loading Skeletons (skeleton patterns inform empty state structure)
- S1890.I4.F1: Kanban Summary Card (widget must exist to add empty state)
- S1890.I4.F3: Activity Feed Timeline (widget must exist to add empty state)

### Parallel With
- F2: Progress Empty States (independent widgets)
- F4: Action/Coaching Empty States (independent widgets)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/empty-states/onboarding-checklist.tsx` - New user checklist
- `apps/web/app/home/(user)/_components/empty-states/activity-preview.tsx` - Activity format preview

### Modified Files
- `apps/web/app/home/(user)/_components/kanban-summary-card.tsx` - Add empty state condition
- `apps/web/app/home/(user)/_components/recent-activity-feed.tsx` - Add empty state condition

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Onboarding Checklist component**: Create checklist with completion tracking
2. **Activity Preview component**: Create muted timeline preview
3. **Kanban Summary Empty State**: Integrate checklist + messaging
4. **Activity Feed Empty State**: Integrate preview + messaging
5. **Dark mode verification**: Test both states in dark mode

### Suggested Order
1. Onboarding Checklist component (T1) - most complex piece
2. Activity Preview component (T2)
3. Kanban empty state integration (T3)
4. Activity Feed empty state integration (T4)
5. Dark mode and accessibility verification (T5)

## Validation Commands
```bash
# Verify empty state components
test -f apps/web/app/home/\(user\)/_components/empty-states/onboarding-checklist.tsx && echo "✓ Onboarding checklist exists"
test -f apps/web/app/home/\(user\)/_components/empty-states/activity-preview.tsx && echo "✓ Activity preview exists"

# Check for empty state logic in widgets
grep -q "tasks.length === 0\|isEmpty" apps/web/app/home/\(user\)/_components/kanban-summary-card.tsx && echo "✓ Kanban empty state logic"
grep -q "activities.length === 0\|isEmpty" apps/web/app/home/\(user\)/_components/recent-activity-feed.tsx && echo "✓ Activity empty state logic"

# Typecheck and lint
pnpm typecheck && pnpm lint

# Visual verification
# Create test account with no tasks/activity and verify empty states render
```

## Empty State Design Details

### Kanban Summary Empty State
| Element | Value |
|---------|-------|
| **Heading** | "Track your learning tasks" |
| **Description** | "Your active tasks and next steps will appear here" |
| **CTA** | "View Task Board" |
| **CTA Target** | `/home/kanban` |
| **Visual** | Onboarding checklist (optional for new users) |

### Onboarding Checklist Items
| Task | Link | Completion Check |
|------|------|-----------------|
| Take skills assessment | `/home/assessment` | `survey_responses` exists |
| Start first lesson | `/home/course` | `lesson_progress` exists |
| Create a presentation | `/home/ai` | `building_blocks_submissions` exists |

### Activity Feed Empty State
| Element | Value |
|---------|-------|
| **Heading** | "Your activity will appear here" |
| **Description** | "As you complete lessons, quizzes, and presentations, your progress will be logged here" |
| **CTA** | None (informational only) |
| **Visual** | Muted preview showing activity format: icon, text, timestamp |

## Related Files
- Initiative: `../initiative.md`
- EmptyState component: `packages/ui/src/makerkit/empty-state.tsx`
- useTasks hook: `apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.ts`
- Research: `../../../research-library/perplexity-dashboard-empty-states.md`
- Tasks: `./tasks.json` (created in next phase)
