# Feature: Kanban Summary Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1877.I3 |
| **Feature ID** | S1877.I3.F1 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 1 |

## Description

A dashboard widget displaying current "doing" tasks from the kanban system with priority indicators, subtask completion counts, and a "next pending" task preview. Includes a link to the full kanban board for complete task management.

## User Story

**As a** active learner with tasks in progress
**I want to** see my current doing tasks at a glance on my dashboard
**So that** I can quickly understand what I'm working on and pick up where I left off without navigating to the full kanban board

## Acceptance Criteria

### Must Have
- [ ] Widget displays up to 5 tasks with status='doing'
- [ ] Each task shows title, priority indicator (colored dot), and subtask completion count (X/Y)
- [ ] Priority colors match kanban board (high=destructive, medium=warning, low=success)
- [ ] Shows "next pending" task from 'do' status below doing tasks
- [ ] Displays "+X more" when total doing tasks exceeds 5
- [ ] Includes "View All" link to full kanban board (`/home/kanban`)
- [ ] Loading skeleton state displays during data fetch
- [ ] Empty state shows "No active tasks" message with link to create tasks

### Nice to Have
- [ ] Hover effect on task items shows task description
- [ ] Click on task navigates directly to task edit modal

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | KanbanSummaryWidget, KanbanTaskSummaryItem | New |
| **UI** | KanbanSummaryWidgetSkeleton | New |
| **UI** | Card, Skeleton, Badge, Button | Existing |
| **Logic** | kanban-summary-widget.loader.ts | New |
| **Data** | getTasksByStatus() from kanban API | Existing |
| **Database** | `tasks`, `subtasks` tables | Existing |

## Architecture Decision

**Approach**: Server Component with Simple Loader Pattern
**Rationale**:
1. **RLS Protection** - No manual auth checks needed, server components inherit security automatically
2. **Parallel Fetching** - Can fetch doing/do tasks simultaneously for optimal performance
3. **Minimal Overhead** - No client-side query complexity for read-only widget
4. **Pattern Consistency** - Matches existing kanban board and dashboard patterns

### Key Architectural Choices
1. Server-side loader uses existing `getTasksByStatus()` function from kanban API
2. Client-side task display reuses priority indicator patterns from TaskCard component
3. Limit to 5 doing tasks with "+X more" indicator for pagination
4. Separate "Next Pending" section below doing tasks

### Trade-offs Accepted
- Server refresh required for data updates (acceptable for dashboard widget context)
- No real-time updates (can be added in v2)

## Required Credentials

> Environment variables required for this feature to function. Extracted from research files.

| Variable | Description | Source |
|----------|-------------|--------|
| None required | Uses existing Supabase tables with RLS | No external services |

## Dependencies

### Blocks
- S1877.I4.F1 - Presentation Table Widget (completes widget set, no blocking relationship)

### Blocked By
- S1877.I1.F1 - Dashboard Page & Grid Layout (requires grid container)

### Parallel With
- S1877.I3.F2 - Quick Actions Panel
- S1877.I3.F3 - Activity Feed Widget

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/kanban-summary-widget/kanban-summary-widget.tsx` - Main widget component with loading/empty states
- `apps/web/app/home/(user)/kanban-summary-widget/kanban-task-summary-item.tsx` - Reusable task display item with priority badge and subtask progress
- `apps/web/app/home/(user)/kanban-summary-widget/kanban-summary-widget-skeleton.tsx` - Loading skeleton matching widget layout
- `apps/web/app/home/(user)/kanban-summary-widget/kanban-summary-widget-empty.tsx` - Empty state with CTA to create tasks
- `apps/web/app/home/(user)/kanban-summary-widget/_lib/kanban-summary-widget.loader.ts` - Server-side data fetching function

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Add widget to grid layout in appropriate position

## Task Hints

> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create data loader function**: Implement `loadKanbanSummaryWidgetData()` that fetches doing and pending tasks using `getTasksByStatus()`
2. **Build task summary item component**: Create `KanbanTaskSummaryItem` with priority indicator, title, and subtask progress display
3. **Implement main widget**: Create `KanbanSummaryWidget` with header, doing tasks section, next pending section, and footer
4. **Add loading skeleton**: Create `KanbanSummaryWidgetSkeleton` matching the widget's visual structure
5. **Create empty state**: Build `KanbanSummaryWidgetEmpty` with message and link to create tasks
6. **Integrate into dashboard**: Add widget wrapper with Suspense boundary to `page.tsx`
7. **Add i18n translations**: Add keys for widget title, empty state, and labels

### Suggested Order
1. Create loader function and verify query returns correct task structure
2. Build task summary item component with mock data testing
3. Implement main widget connecting all subcomponents
4. Create skeleton and empty states
5. Integrate into dashboard page and test with real data
6. Add translations and accessibility refinements

## Validation Commands
```bash
# Verify doing tasks display correctly
pnpm dev:web && curl -s http://localhost:3000/home | grep -q "Current Tasks"

# Verify link to kanban board exists
pnpm dev:web && curl -s http://localhost:3000/home | grep -q "/home/kanban"

# Typecheck after implementation
pnpm typecheck

# Run linter
pnpm lint:fix

# Format code
pnpm format:fix
```

## Related Files
- Initiative: `../initiative.md`
- Foundation: `../../S1877.I1-Initiative-dashboard-foundation/`
- Kanban API: `apps/web/app/home/(user)/kanban/_lib/api/tasks.ts`
- Task Schema: `apps/web/app/home/(user)/kanban/_lib/schema/task.schema.ts`
- Paths Config: `apps/web/config/paths.config.ts`
