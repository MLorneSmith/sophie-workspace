# Feature: Kanban Summary Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1823.I3 |
| **Feature ID** | S1823.I3.F1 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 1 |

## Description
A dashboard widget that displays the user's current "Doing" tasks and their next "Do" task from the Kanban board. Shows subtask progress and provides quick navigation to the full Kanban board. This widget gives users immediate visibility into their active work without leaving the dashboard.

## User Story
**As a** learner using SlideHeroes
**I want to** see my current tasks and next task at a glance on the dashboard
**So that** I can quickly understand what I'm working on and what's coming next

## Acceptance Criteria

### Must Have
- [ ] Display up to 3 "Doing" status tasks with their titles
- [ ] Display the next "Do" task (first in queue) as suggested next action
- [ ] Show subtask completion progress for each task (e.g., "2/5 subtasks")
- [ ] Include "View Board" link to navigate to `/home/kanban`
- [ ] Handle empty state when no tasks exist with appropriate message

### Nice to Have
- [ ] Show task priority indicators if available
- [ ] Truncate long task titles with ellipsis

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `kanban-summary-widget.tsx` | New |
| **Logic** | Part of `load-dashboard-data.ts` | New |
| **Data** | Supabase query on `tasks` table | Existing |
| **Database** | `tasks` table with RLS | Existing |

## Architecture Decision

**Approach**: Server Component with Client Widget
**Rationale**: Data is fetched server-side via the dashboard loader (avoiding client-side waterfalls), while the widget component handles presentation with client interactivity.

### Key Architectural Choices
1. Use existing `getTasksByStatus()` pattern from Kanban API
2. Limit to 3 "doing" and 1 "next" task for dashboard context
3. Server-side data fetching integrated with dashboard loader

### Trade-offs Accepted
- Simpler subtask display (count only) vs full subtask list to keep widget compact

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Widget container | Card | @kit/ui/card | Consistent with other dashboard widgets |
| Status badges | Badge | @kit/ui/badge | Visual distinction for task status |
| Progress indicator | Text | Native | Simple "2/5" format, no bar needed |
| Task icons | CheckCircle2Icon | lucide-react | Matches existing Kanban UI |

**Components to Install**: None required (all already in packages/ui)

## Required Credentials
None required - uses internal database queries only.

## Dependencies

### Blocks
- F3 (Activity Feed Widget depends on loader patterns established here)
- F4 (Quick Actions needs task state from loader)

### Blocked By
- S1823.I1.F1 (Dashboard types and loader infrastructure)

### Parallel With
- None (first feature to implement in this initiative)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/kanban-summary-widget.tsx` - Widget component
- `apps/web/app/home/(user)/_lib/server/load-dashboard-data.ts` - Dashboard data loader (partial - tasks portion)
- `apps/web/app/home/(user)/_lib/types/dashboard.types.ts` - Shared type definitions

### Modified Files
- None (new feature)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create dashboard types**: Define `TaskWithSubtasks` and `DashboardData` types
2. **Implement task loader**: Create `loadTasksSummary()` function using existing patterns
3. **Build widget component**: Create `KanbanSummaryWidget` with card structure
4. **Add empty state**: Handle no tasks scenario gracefully
5. **Add unit tests**: Test loader and component rendering

### Suggested Order
Types → Loader → Component → Empty State → Tests

## Validation Commands
```bash
# Type check
pnpm typecheck

# Unit tests (after implementation)
pnpm --filter web test:unit -- --grep "kanban-summary"

# Visual verification
pnpm dev
# Navigate to http://localhost:3000/home and verify widget renders
```

## Related Files
- Initiative: `../initiative.md`
- Existing Kanban API: `apps/web/app/home/(user)/kanban/_lib/api/tasks.ts`
- Task schema: `apps/web/app/home/(user)/kanban/_lib/schema/task.schema.ts`
- Tasks: `./tasks.json` (created in next phase)
