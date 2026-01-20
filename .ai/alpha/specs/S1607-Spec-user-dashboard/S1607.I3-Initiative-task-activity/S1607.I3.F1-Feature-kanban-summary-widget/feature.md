# Feature: Kanban Summary Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1607.I3 |
| **Feature ID** | S1607.I3.F1 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 1 |

## Description
A dashboard widget that displays the user's current "Doing" task and next "Do" task from their kanban board. Provides at-a-glance task awareness without leaving the dashboard, with a link to the full kanban board for detailed management.

## User Story
**As a** SlideHeroes user
**I want to** see my current task and next task on the dashboard
**So that** I stay focused on my presentation work without navigating away

## Acceptance Criteria

### Must Have
- [ ] Display current "Doing" task (first task with status='doing')
- [ ] Display next "Do" task (first task with status='do', ordered by created_at)
- [ ] Link to full kanban board (`/home/kanban`)
- [ ] Empty state when no active tasks exist
- [ ] Loading skeleton during data fetch
- [ ] Real-time updates when tasks change (via React Query)

### Nice to Have
- [ ] Show subtask progress indicator (e.g., "2/5 subtasks")
- [ ] Quick status toggle from widget

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | KanbanSummaryWidget, KanbanSummaryCard, TaskCardCompact | New |
| **Logic** | useTasks() hook integration, task filtering | Existing + New |
| **Data** | loadUserTasksSummary() loader function | New |
| **Database** | tasks table | Existing |

## Architecture Decision

**Approach**: Pragmatic (Hybrid SSR + Client)
**Rationale**: Leverages existing `useTasks()` React Query hook from kanban for real-time updates while providing server-rendered initial state to avoid loading flash.

### Key Architectural Choices
1. Server component wrapper fetches initial data via loader for SSR
2. Client component uses existing `useTasks()` hook for live updates
3. Initial props prevent hydration mismatch and loading flash

### Trade-offs Accepted
- Slight complexity from hybrid SSR + client pattern (justified by UX benefit)
- Dependency on kanban feature's React Query configuration

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Widget Card | Card | @kit/ui/card | Consistent with dashboard styling |
| Task Display | Custom TaskCardCompact | New | Compact task representation for widget |
| Empty State | EmptyState | @kit/ui/empty-state | Consistent empty state pattern |
| Loading | Skeleton | @kit/ui/skeleton | Standard loading pattern |
| Icons | Lucide icons | lucide-react | Existing icon library |

**Components to Install**: None - all components already available

## Dependencies

### Blocks
- None

### Blocked By
- S1607.I1: Dashboard Foundation (provides page structure and loader infrastructure)

### Parallel With
- F2: Activity Feed Widget (no dependencies between them)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/kanban-summary-widget.tsx` - Server component wrapper
- `apps/web/app/home/(user)/_components/kanban-summary-card.tsx` - Client component with useTasks() hook
- `apps/web/app/home/(user)/_components/task-card-compact.tsx` - Compact task display component

### Modified Files
- `apps/web/app/home/(user)/_lib/server/user-dashboard-page.loader.ts` - Add loadUserTasksSummary() function
- `apps/web/app/home/(user)/page.tsx` - Add KanbanSummaryWidget to grid layout

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create task summary types**: Define TaskSummary type and loader return type
2. **Implement loadUserTasksSummary loader**: Query tasks table for doing/do status
3. **Create TaskCardCompact component**: Presentational component for task display
4. **Create KanbanSummaryCard client component**: Integrate useTasks hook, handle empty state
5. **Create KanbanSummaryWidget server component**: Wrapper with loader integration
6. **Add widget to dashboard page**: Update grid layout to include widget
7. **Add loading skeleton**: Implement loading state for widget
8. **Add empty state**: Handle case when no tasks exist

### Suggested Order
1. Types → 2. Loader → 3. TaskCardCompact → 4. KanbanSummaryCard → 5. KanbanSummaryWidget → 6. Page integration → 7. Loading → 8. Empty state

## Validation Commands
```bash
# TypeScript validation
pnpm --filter web typecheck

# Verify kanban summary shows current task
# Manual: Create a task with status='doing' in kanban, verify it shows on dashboard

# Verify next task shows
# Manual: Create a task with status='do', verify it shows as "Next Up"

# Verify empty state
# Manual: Move all tasks to 'done', verify empty state displays

# Verify real-time updates
# Manual: Change task status in kanban, verify widget updates without refresh

# Verify link works
# Manual: Click "View Kanban Board" link, verify navigation to /home/kanban
```

## Related Files
- Initiative: `../initiative.md`
- Kanban Feature: `apps/web/app/home/(user)/kanban/`
- useTasks Hook: `apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.ts`
- Tasks API: `apps/web/app/home/(user)/kanban/_lib/api/tasks.ts`
