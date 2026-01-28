# Feature: Kanban Summary Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1864.I3 |
| **Feature ID** | S1864.I3.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
A dashboard widget that displays the user's current "Doing" tasks (up to 3) with subtask progress indicators, plus the next pending task from the "To Do" column. Provides a quick link to the full kanban board for task management.

## User Story
**As a** learner using SlideHeroes
**I want to** see my current in-progress tasks at a glance on my dashboard
**So that** I can quickly understand what I'm working on and what's next without navigating to the kanban board

## Acceptance Criteria

### Must Have
- [ ] Widget displays up to 3 tasks with status "doing"
- [ ] Each task shows title and subtask progress (e.g., "3/5 complete")
- [ ] Widget shows the next pending task from "do" column
- [ ] Widget includes a "View Kanban Board" link to `/home/kanban`
- [ ] Widget has a skeleton loading state during data fetch
- [ ] Widget shows empty state when no tasks exist

### Nice to Have
- [ ] Priority indicator (color-coded border matching kanban card pattern)
- [ ] Phase badge on tasks (if phase is set)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `KanbanSummaryWidget` component | New |
| **Logic** | `useTasks()` hook | Existing (reuse) |
| **Data** | Supabase tasks query | Existing (RLS-protected) |
| **Database** | `public.tasks` table | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Reuse existing `useTasks()` hook from kanban feature, which already handles data fetching, caching, and auto-seeding. No new server-side code needed - pure client-side filtering and display.

### Key Architectural Choices
1. Reuse existing `useTasks()` hook rather than creating new loader/hook
2. Client-side filtering of tasks by status (doing, do) - data volume is small enough
3. Match visual patterns from existing task-card.tsx for consistency

### Trade-offs Accepted
- Client-side filtering means fetching all tasks, but user task count is typically <100
- No server-side aggregation for subtask counts, calculated in component

## Required Credentials
> None required - uses existing authenticated Supabase client

## Dependencies

### Blocks
- None

### Blocked By
- S1864.I1.F1: Dashboard TypeScript types and loader skeleton
- S1864.I1.F3: Dashboard responsive grid layout

### Parallel With
- F2: Activity Data Aggregation (no dependency)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/kanban-summary-widget.tsx` - Main widget component

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and place widget in dashboard grid

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create widget component skeleton**: Set up component file with Card layout, loading skeleton
2. **Implement task filtering logic**: Filter doing tasks (limit 3), find next pending task
3. **Calculate subtask progress**: Count completed/total subtasks per task
4. **Add empty state**: Handle no tasks scenario with EmptyState component
5. **Integrate with dashboard page**: Add widget to grid layout
6. **Add visual polish**: Priority colors, phase badges, hover states

### Suggested Order
1 → 2 → 3 → 4 → 5 → 6

## Validation Commands
```bash
# Verify widget renders
pnpm dev --filter web
# Visit http://localhost:3000/home and check widget displays

# Verify task filtering
# Complete/add tasks in kanban board, verify widget updates

# Run type check
pnpm --filter web typecheck

# Run lint
pnpm --filter web lint
```

## Related Files
- Initiative: `../initiative.md`
- Existing useTasks hook: `apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.ts`
- Task card styling reference: `apps/web/app/home/(user)/kanban/_components/task-card.tsx`
- Task schema: `apps/web/app/home/(user)/kanban/_lib/schema/task.schema.ts`
