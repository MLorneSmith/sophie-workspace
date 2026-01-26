# Feature: Kanban Summary Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1815.I3 |
| **Feature ID** | S1815.I3.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
A dashboard widget that displays the user's current kanban tasks at-a-glance. Shows tasks with status 'doing' (active work) and the next prioritized task from 'do' (backlog). Provides quick navigation to the full kanban board.

## User Story
**As a** presentation learner using SlideHeroes
**I want to** see my current tasks and next priority item on my dashboard
**So that** I can quickly understand what I should be working on without navigating away

## Acceptance Criteria

### Must Have
- [ ] Display tasks with status 'doing' (maximum 3 visible, count indicator if more)
- [ ] Display the next prioritized task from 'do' status
- [ ] Show task title and priority indicator (color-coded left border)
- [ ] Include "View Kanban Board" link to `/home/kanban`
- [ ] Widget skeleton loading state during data fetch
- [ ] Empty state when user has no active tasks

### Nice to Have
- [ ] Subtask completion count per task (e.g., "2/5 subtasks")

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `KanbanSummaryWidget` component | New |
| **Logic** | Filter tasks by status, limit results | New (simple) |
| **Data** | `loadKanbanSummary()` loader function | New |
| **Database** | `tasks` table query with status filter | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Reuse existing task query patterns from kanban module, create minimal new code for dashboard presentation. Server Component for initial load, no client-side state needed.

### Key Architectural Choices
1. Use server-side data loading in dashboard page loader (parallel with other widgets)
2. Reuse existing task types and RLS policies from kanban module
3. Simple filter logic (status 'doing', then status 'do' ordered by priority)

### Trade-offs Accepted
- No real-time updates (user must refresh page to see changes)
- Maximum 3 'doing' tasks shown to keep widget compact

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Widget card | Card | @kit/ui/card | Existing dashboard card pattern |
| Task items | Custom list | New | Simple list with priority border |
| Priority indicator | Left border color | CSS | Match existing kanban task-card pattern |
| Empty state | EmptyState | @kit/ui/empty-state | Consistent empty state UI |
| Loading | Skeleton | @kit/ui/skeleton | Consistent loading pattern |

## Required Credentials
None required - all data from internal Supabase tables with RLS protection.

## Dependencies

### Blocks
- None

### Blocked By
- S1815.I1: Dashboard Foundation (provides grid layout, dashboard types, and page shell)

### Parallel With
- F2, F3, F4: All features in this initiative can develop in parallel once F1 establishes widget pattern

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/widgets/kanban-summary-widget.tsx` - Widget component
- `apps/web/app/home/(user)/_components/widgets/kanban-summary-skeleton.tsx` - Loading skeleton
- `apps/web/app/home/(user)/_lib/server/loaders/kanban-summary.loader.ts` - Data loader

### Modified Files
- `apps/web/app/home/(user)/_lib/server/dashboard.loader.ts` - Add kanban summary to parallel fetch
- `apps/web/app/home/(user)/page.tsx` - Include widget in grid

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create kanban summary loader**: Server-side function to fetch doing/do tasks
2. **Create kanban summary widget**: React component with task list rendering
3. **Create widget skeleton**: Loading state component
4. **Integrate into dashboard**: Add to dashboard loader and grid layout
5. **Create empty state**: Handle users with no tasks

### Suggested Order
1. Loader first (data contract)
2. Widget skeleton (loading state)
3. Widget component (main UI)
4. Empty state handling
5. Dashboard integration

## Validation Commands
```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Manual testing
pnpm dev
# Navigate to /home as authenticated user
# Verify widget displays tasks correctly
# Verify empty state for user with no tasks
# Verify link to kanban board works
```

## Related Files
- Initiative: `../initiative.md`
- Reference: `apps/web/app/home/(user)/kanban/_lib/api/tasks.ts` - Existing task queries
- Reference: `apps/web/app/home/(user)/kanban/_components/task-card.tsx` - Task card styling
- Tasks: `./tasks.json` (created in next phase)
