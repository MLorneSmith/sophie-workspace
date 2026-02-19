# Feature: Kanban Summary Card

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2045.I2 |
| **Feature ID** | S2045.I2.F2 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 2 |

## Description
Build a compact Kanban Summary Card that displays the user's current "Doing" tasks (max 3) and the next "Do" task. This is a simple data display widget with Badge status indicators — no chart library required. Integrates into Row 1, Column 3 of the dashboard 3-3-1 grid.

## User Story
**As a** SlideHeroes learner
**I want to** see my active and upcoming kanban tasks on the dashboard
**So that** I can quickly understand what I'm working on and what's next without visiting the kanban board

## Acceptance Criteria

### Must Have
- [ ] Card displays up to 3 tasks with `status = 'doing'` under a "Doing" section header
- [ ] Card displays 1 task with `status = 'do'` under a "Next Up" section header
- [ ] Each task row shows title text (truncated if needed) and a status Badge
- [ ] Badge variants: `variant="warning"` for "doing" (orange), `variant="info"` for "do" (blue)
- [ ] "View Board" link in CardFooter navigating to `/home/kanban`
- [ ] Graceful fallback when no tasks exist (show "No tasks yet" with muted text)
- [ ] Server component — no interactivity needed, data comes from dashboard loader
- [ ] Dark mode supported via semantic color classes

### Nice to Have
- [ ] Show subtask progress (e.g., "2/5 subtasks") for doing tasks
- [ ] Priority indicator (dot or icon) for high-priority tasks

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `kanban-summary-card.tsx` component | New |
| **Logic** | Filter tasks by status, limit doing to 3, do to 1 | New |
| **Data** | `tasks` table query via dashboard loader | Existing (from S2045.I1) |
| **Database** | `public.tasks` table | Existing |

## Architecture Decision

**Approach**: Minimal
**Rationale**: This is the simplest of the three widgets — no charts, no client-side interactivity. Pure server component receiving filtered task data as props and rendering Card/Badge UI. Task filtering (status = 'doing' limit 3, status = 'do' limit 1) happens in the dashboard loader (S2045.I1).

### Key Architectural Choices
1. Server component — no client-side rendering needed, data is static per page load
2. Props-driven — receives `doingTasks` and `nextTask` arrays from parent, does no data fetching
3. Reuse existing task types from `kanban/_lib/schema/task.schema.ts`

### Trade-offs Accepted
- Limited to 3 doing + 1 next task (matches initiative spec, prevents card overflow)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Card wrapper | Card, CardHeader, CardTitle, CardContent, CardFooter | @kit/ui/card | Standard dashboard card |
| Status badges | Badge (warning, info) | @kit/ui/badge | Existing variants match status colors |
| Task title | Truncated text with `truncate` class | Tailwind | Standard text overflow handling |
| Footer link | Button variant="link" or anchor | @kit/ui/button | Navigate to /home/kanban |

**Components to Install**: None (all already available)

## Required Credentials
> None required — uses only Supabase `tasks` table data via existing RLS-protected queries.

## Dependencies

### Blocks
- None

### Blocked By
- S2045.I1: Needs dashboard page grid layout and data loader providing task data

### Parallel With
- F1: Course Progress Radial Chart
- F3: Self-Assessment Spider Diagram

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard/kanban-summary-card.tsx` — Server component with task display

### Modified Files
- `apps/web/app/home/(user)/_components/dashboard/dashboard-widgets.tsx` (or parent grid component from I1) — Import and place KanbanSummaryCard in grid position

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create KanbanSummaryCard component**: Card with "Doing" section (max 3 tasks), "Next Up" section (1 task), Badge status indicators, truncated titles
2. **Wire to dashboard grid**: Import into dashboard page/widget container, pass filtered task data as props
3. **Add footer navigation**: "View Board" link to `/home/kanban`
4. **Verify rendering and dark mode**: Visual test, typecheck, lint

### Suggested Order
1. Create component → 2. Wire to grid → 3. Add footer → 4. Verify

## Validation Commands
```bash
pnpm typecheck
pnpm lint
# Visual: navigate to /home, verify kanban card renders in Row 1 Col 3
```

## Related Files
- Initiative: `../initiative.md`
- Task schema: `apps/web/app/home/(user)/kanban/_lib/schema/task.schema.ts`
- Task types: `apps/web/lib/database.types.ts` (tasks table)
- Badge component: `packages/ui/src/shadcn/badge.tsx`
- Card component: `packages/ui/src/shadcn/card.tsx`
