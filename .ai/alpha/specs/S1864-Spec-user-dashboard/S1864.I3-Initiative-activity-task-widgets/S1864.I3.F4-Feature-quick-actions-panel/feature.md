# Feature: Quick Actions Panel

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1864.I3 |
| **Feature ID** | S1864.I3.F4 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 4 |

## Description
A dashboard widget that displays 2-4 contextual call-to-action buttons based on the user's current state. Actions include "Continue Course" (if lessons incomplete), "Review Quiz" (if quiz failed), "Continue Task" (if tasks in progress), and "Complete Assessment" (if assessment not done). The panel adapts dynamically to show the most relevant next steps.

## User Story
**As a** learner using SlideHeroes
**I want to** see personalized action buttons on my dashboard
**So that** I can quickly navigate to my most important next steps without searching

## Acceptance Criteria

### Must Have
- [ ] Widget displays 2-4 contextual actions based on user data
- [ ] "Continue Course" action shown if user has incomplete lessons (links to current lesson)
- [ ] "Continue Task" action shown if user has tasks with status "doing" (links to kanban)
- [ ] "Complete Assessment" action shown if user hasn't completed self-assessment (links to assessment)
- [ ] "New Presentation" action always available (links to presentation creation)
- [ ] Actions displayed as CardButton components in 2x2 grid
- [ ] Each action has icon, title, and brief description
- [ ] Widget has skeleton loading state during data fetch
- [ ] Widget shows at least 2 default actions if no contextual ones apply

### Nice to Have
- [ ] Action priority ordering (most urgent first)
- [ ] "Retake Quiz" action if user failed recent quiz
- [ ] Visual indicator for urgency (e.g., badge with count of incomplete items)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `QuickActionsPanel` component | New |
| **Logic** | `useQuickActions()` React Query hook | New |
| **Data** | Parallel queries to course_progress, tasks, survey_progress | Existing (RLS-protected) |
| **Database** | `course_progress`, `tasks`, `survey_progress` tables | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Use parallel data fetching with Promise.all to query multiple tables efficiently. Derive action items client-side based on data presence/absence. Reuse CardButton component for consistent styling.

### Key Architectural Choices
1. Client component with React Query for parallel data fetching
2. Derive actions from data: if course_progress.current_lesson_id exists → show "Continue Course"
3. Fixed 2x2 grid layout with CardButton components
4. Default actions (New Presentation, View Dashboard) fill empty slots

### Trade-offs Accepted
- Multiple parallel queries (3-4) on page load - acceptable for dashboard
- No real-time updates - user must refresh to see state changes
- Action derivation logic in component - could extract to utility if it grows

## Required Credentials
> None required - uses existing authenticated Supabase client

## Dependencies

### Blocks
- None

### Blocked By
- S1864.I1.F1: Dashboard TypeScript types
- S1864.I1.F3: Dashboard responsive grid layout
- S1864.I3.F2: Activity Data Aggregation (optional - could use for context)

### Parallel With
- F3: Activity Feed Widget (both depend on F2)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/hooks/use-quick-actions.ts` - React Query hook with parallel fetching
- `apps/web/app/home/(user)/_components/quick-actions-panel.tsx` - Main widget component

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and place widget in dashboard grid

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create useQuickActions hook**: Parallel fetching of course_progress, tasks, survey_progress
2. **Define action derivation logic**: Rules for which actions to show based on data
3. **Create widget component skeleton**: Card layout with 2x2 CardButton grid
4. **Implement action type configuration**: Icons, titles, descriptions, hrefs for each action
5. **Add skeleton loading state**: Loading placeholders for CardButtons
6. **Add default actions**: Ensure at least 2 actions shown when no contextual ones apply
7. **Integrate with dashboard page**: Add widget to grid layout

### Suggested Order
1 → 2 → 3 → 4 → 5 → 6 → 7

## Validation Commands
```bash
# Verify widget renders
pnpm dev --filter web
# Visit http://localhost:3000/home and check quick actions panel displays

# Test contextual actions:
# - Start a lesson but don't complete it → should see "Continue Course"
# - Add a task with status "doing" → should see "Continue Task"
# - Ensure assessment not completed → should see "Complete Assessment"

# Verify links navigate correctly

# Run type check
pnpm --filter web typecheck

# Run lint
pnpm --filter web lint
```

## Related Files
- Initiative: `../initiative.md`
- CardButton component: `packages/ui/src/makerkit/card-button.tsx`
- Course progress reference: `apps/web/app/home/(user)/course/_components/CourseDashboardClient.tsx`
- Assessment page pattern: `apps/web/app/home/(user)/assessment/page.tsx`
