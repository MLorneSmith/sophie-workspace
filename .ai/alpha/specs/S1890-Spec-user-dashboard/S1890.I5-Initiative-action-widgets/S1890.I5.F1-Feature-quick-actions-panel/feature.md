# Feature: Quick Actions Panel

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1890.I5 |
| **Feature ID** | S1890.I5.F1 |
| **Status** | Draft |
| **Estimated Days** | 3-4 |
| **Priority** | 1 |

## Description
Implement a Quick Actions Panel widget that displays 2-4 contextual CTA buttons based on the user's current state. The panel analyzes user progress data (course status, assessment completion, presentation drafts) to surface the most relevant next action, reducing decision fatigue and driving engagement.

## User Story
**As a** SlideHeroes learner
**I want to** see contextual action suggestions based on my current progress
**So that** I know exactly what to do next without having to think about it

## Acceptance Criteria

### Must Have
- [ ] Quick Actions Panel component renders in the dashboard grid (row 2, position 2)
- [ ] Panel displays 2-4 action buttons based on user state
- [ ] Conditional logic determines which actions to show:
  - Course not started: "Start Your Journey" → `/home/course`
  - Course in progress: "Continue Course" → `/home/course`
  - No assessment taken: "Take Skills Assessment" → `/home/assessment`
  - Has draft presentations: "Review Storyboard" → `/home/ai`
  - Always available: "New Presentation" → `/home/ai/new`
- [ ] Actions prioritized by relevance (most important first)
- [ ] Each button links to correct route and functions correctly
- [ ] Responsive layout (stacked on mobile, grid on desktop)
- [ ] Dark mode support via semantic Tailwind classes

### Nice to Have
- [ ] Subtle hover animations on action buttons
- [ ] Icons for each action type (Play, Target, FileText, Plus)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | QuickActionsPanel.tsx | New |
| **Logic** | Action determination logic | New (in component or utility) |
| **Data** | Uses UserDashboardData from loader | Existing (from I2) |
| **Database** | No direct DB access (uses loader data) | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Use server component with props from dashboard loader. Action logic is simple conditional rendering based on data flags. No need for client-side state or complex abstractions.

### Key Architectural Choices
1. Server component receives pre-fetched data from parent page
2. Conditional rendering using `<If>` component or ternary expressions
3. Use `Link` with `buttonVariants()` for navigation buttons
4. Single component file with clear action priority logic

### Trade-offs Accepted
- Server component means no real-time updates (acceptable for v1)
- Action order is hard-coded (could be configurable in future)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Container | Card, CardHeader, CardContent | shadcn/ui | Consistent with other dashboard widgets |
| Action buttons | Link + buttonVariants | shadcn/ui | Standard navigation pattern |
| Icons | Lucide icons | lucide-react | Project standard |
| Conditional | If component | @kit/ui/if | Clean conditional rendering |

**Components to Install**: None - all components available

## Required Credentials
> Environment variables required for this feature to function.

None required - all internal routing.

## Dependencies

### Blocks
- S1890.I7: Empty States & Polish (needs widget structure for empty state overlay)

### Blocked By
- S1890.I1.F1: Dashboard Page Layout (needs grid container)
- S1890.I2.F1: Dashboard Types (needs type definitions)
- S1890.I2.F2: Dashboard Data Loader (needs pre-fetched user state data)

### Parallel With
- S1890.I5.F2: Presentation Outline Table
- S1890.I3: Progress Widgets (different widgets, same grid)
- S1890.I4: Task & Activity Widgets (different widgets, same grid)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/quick-actions-panel.tsx` - Main component

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and place QuickActionsPanel in grid
- `apps/web/locales/en/home.json` - Add i18n translations for action labels

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create QuickActionsPanel component**: Scaffold component with props interface
2. **Implement action determination logic**: Conditional rendering based on user state
3. **Add i18n translations**: Translation keys for all action labels
4. **Integrate into dashboard page**: Import and place in grid position
5. **Add visual polish**: Icons, hover states, responsive layout

### Suggested Order
1. Create component scaffold with props → 2. Implement conditionals → 3. i18n → 4. Integration → 5. Polish

## Validation Commands
```bash
# Verify component exists
test -f apps/web/app/home/\(user\)/_components/quick-actions-panel.tsx && echo "✓ Component exists"

# Check for conditional logic patterns
grep -qE "hasCourse|hasAssessment|hasDrafts" apps/web/app/home/\(user\)/_components/quick-actions-panel.tsx && echo "✓ Conditional logic"

# Check component is imported in page
grep -q "QuickActionsPanel" apps/web/app/home/\(user\)/page.tsx && echo "✓ Integrated in page"

# Run typecheck
pnpm typecheck

# Visual verification
pnpm --filter web dev
# Navigate to /home and verify Quick Actions Panel renders with correct buttons
```

## Related Files
- Initiative: `../initiative.md`
- Dashboard loader: `apps/web/app/home/(user)/_lib/server/user-dashboard.loader.ts`
- Similar pattern: `apps/web/app/home/(user)/ai/_components/AIWorkspaceDashboard.tsx`
- Button component: `packages/ui/src/shadcn/button.tsx`
- Card component: `packages/ui/src/shadcn/card.tsx`
