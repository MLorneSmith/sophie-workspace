# Feature: Quick Actions Panel

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1823.I3 |
| **Feature ID** | S1823.I3.F4 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 4 |

## Description
A dashboard widget that displays contextual call-to-action buttons based on the user's current state. Shows the most relevant next actions (Continue Learning, Complete Quiz, View Tasks, Take Survey, Create Presentation) prioritized by what the user should do next. Reduces navigation friction by surfacing the right actions at the right time.

## User Story
**As a** learner using SlideHeroes
**I want to** see suggested next actions on my dashboard
**So that** I can quickly navigate to the most important task without searching

## Acceptance Criteria

### Must Have
- [ ] Display 3-4 contextual CTA buttons based on user state
- [ ] Prioritize actions: Continue Learning > Complete Quiz > View Tasks > Take Survey > Create Presentation
- [ ] Show relevant icon for each action (PlayCircle, CheckSquare, ListTodo, ClipboardList, Plus)
- [ ] Link each button to appropriate page (/home/course, /home/kanban, /home/assessment/survey, /home/ai/canvas)
- [ ] Always show at least "Create Presentation" as fallback CTA
- [ ] Handle loading state gracefully

### Nice to Have
- [ ] Show action descriptions on hover (desktop)
- [ ] Animate button entry for visual polish

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `quick-actions-panel.tsx` | New |
| **Logic** | Consumes `userState` from `loadDashboardData()` | Existing (from F2) |
| **Data** | Boolean flags from F2's `loadUserState()` | Existing (from F2) |
| **Database** | N/A (data provided by F2) | N/A |

## Architecture Decision

**Approach**: Conditional Rendering Client Component
**Rationale**: The Quick Actions Panel receives boolean state flags from the server and conditionally renders CTAs based on those flags. Simple conditional logic keeps the component maintainable.

### Key Architectural Choices
1. Use boolean flags (`hasIncompleteLessons`, `hasIncompleteQuizzes`, etc.) for decisions
2. Priority-ordered action list with filter for applicable actions
3. Always include at least one fallback action

### Trade-offs Accepted
- Static priority order (not personalized by ML) in v1
- 3-4 actions max to avoid choice paralysis

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Widget container | Card | @kit/ui/card | Consistent dashboard styling |
| Action buttons | Button | @kit/ui/button | Primary CTA styling |
| Action icons | Various | lucide-react | Visual clarity for each action |
| Button grid | CSS Grid | Native | Responsive 2x2 or 1x4 layout |

**Components to Install**: None required

## Required Credentials
None required - consumes data from internal service.

## Dependencies

### Blocks
- None (final feature in initiative)

### Blocked By
- F2 (Activity Data Aggregation provides userState)
- S1823.I1.F1 (Dashboard infrastructure)

### Parallel With
- F3 (Activity Feed Widget - both consume data from F2)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/quick-actions-panel.tsx` - Widget component

### Modified Files
- `apps/web/app/home/(user)/_components/dashboard-widgets.tsx` - Add QuickActionsPanel to composition

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Define action types**: Create action configuration with label, icon, href, condition
2. **Build action button component**: Single CTA button with icon and label
3. **Build panel component**: Card container with button grid
4. **Implement conditional logic**: Filter and prioritize actions based on userState
5. **Add responsive layout**: 2x2 grid on desktop, 1x4 stack on mobile
6. **Add unit tests**: Test conditional rendering logic

### Suggested Order
Action Types → Action Button → Panel Container → Conditional Logic → Responsive Layout → Tests

## Validation Commands
```bash
# Type check
pnpm typecheck

# Unit tests
pnpm --filter web test:unit -- --grep "quick-actions"

# Visual verification
pnpm dev
# Navigate to http://localhost:3000/home
# Test with different user states:
# - New user (should see "Continue Learning" or "Take Survey")
# - Active user (should see most relevant actions)
# - Completed user (should see "Create Presentation")
```

## Related Files
- Initiative: `../initiative.md`
- Dashboard UX research: `../../../research-library/perplexity-dashboard-ux.md` (F-pattern, CTA placement)
- User state: F2's `loadUserState()` function
- Tasks: `./tasks.json` (created in next phase)
