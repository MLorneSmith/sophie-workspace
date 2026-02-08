# Feature: Kanban Summary Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1918.I4 |
| **Feature ID** | S1918.I4.F2 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 2 |

## Description
A widget showing a summary of the user's Kanban board tasks. Displays count of tasks currently "Doing", previews the next task in "Do" queue, and provides a link to the full Kanban board. This gives users visibility into their active work without leaving the dashboard.

## User Story
**As a** busy professional
**I want to** see what tasks I'm currently working on and what's next
**So that** I can stay focused without context-switching to the full Kanban board

## Acceptance Criteria

### Must Have
- [ ] Widget displays in dashboard grid slot (right column, row 1)
- [ ] Shows count of "Doing" tasks with visual badge
- [ ] Shows first 2 "Doing" task titles (truncated if long)
- [ ] Shows "Next Up" section with first "Do" task title
- [ ] "View Kanban Board →" link navigates to /home/kanban
- [ ] Empty state: "No active tasks" message with suggestion to visit Kanban
- [ ] Task counts update when data changes (server re-render)

### Nice to Have
- [ ] Progress bar showing done/total ratio
- [ ] Priority indicators on task previews
- [ ] Subtle card hover effects

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `kanban-summary-widget.tsx` | New |
| **Logic** | Filter/sort tasks by status | New |
| **Data** | Props from dashboard loader using task aggregation | Existing query |
| **Database** | tasks table | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Reuse existing task query pattern from kanban feature. Dashboard loader fetches summarized task data (counts + next tasks), widget renders it. No need for full useTasks hook - lighter weight for dashboard.

### Key Architectural Choices
1. Server component with pre-fetched task summary data
2. Reuse task status type definitions from kanban schema
3. Simple list rendering without drag-and-drop complexity

### Trade-offs Accepted
- Not real-time (requires page refresh for updates) - acceptable for dashboard overview
- Limited to preview (2 tasks) to keep widget compact

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Container | Card, CardHeader, CardContent | shadcn/ui | Consistent dashboard widget |
| Count Badge | Badge | shadcn/ui | Visual task count indicator |
| Task List | Custom list with truncation | Custom | Simple list, no library needed |
| Link | Link + Button variant="link" | next/link + shadcn | Navigation to full board |

**Components to Install**: None required

## Required Credentials
> Environment variables required for this feature to function.

None required - uses only internal database data.

## Dependencies

### Blocks
- None directly

### Blocked By
- S1918.I1.F1: Dashboard Page & Grid (provides grid slot)
- S1918.I2.F1: Dashboard Types (provides KanbanSummaryData type)
- S1918.I2.F2: Dashboard Loader (provides task summary query)

### Parallel With
- F3: Presentations Table (independent widget)
- F4: Activity Feed (independent widget)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/kanban-summary-widget.tsx` - Widget component

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and render widget in grid

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create KanbanSummaryData type**: Define interface with doingTasks, doingCount, nextTask
2. **Create kanban-summary-widget.tsx**: Build widget with task list and counts
3. **Add empty state**: Handle zero tasks gracefully
4. **Integrate with dashboard page**: Place in grid and connect to loader data
5. **Style consistency check**: Ensure visual alignment with other widgets

### Suggested Order
1. Types → 2. Component + Empty State → 3. Integration → 4. Polish

## Validation Commands
```bash
# Verify widget file exists
test -f apps/web/app/home/\(user\)/_components/kanban-summary-widget.tsx && echo "✓ Kanban summary widget exists"

# Type check
pnpm typecheck

# Lint check
pnpm lint
```

## Related Files
- Initiative: `../initiative.md`
- Reference: `apps/web/app/home/(user)/kanban/_lib/schema/task.schema.ts`
- Reference: `apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.ts`
- Pattern: `apps/web/app/home/(user)/kanban/_components/task-card.tsx`
