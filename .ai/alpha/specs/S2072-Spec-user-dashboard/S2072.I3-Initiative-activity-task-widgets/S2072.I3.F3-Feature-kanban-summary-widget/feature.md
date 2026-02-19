# Feature: Kanban Summary Widget

## Description

Card widget that displays the user's current "doing" tasks with a count badge and preview of the next task. Links to the full kanban board for task management. Reuses existing task query patterns from the kanban feature.

## User Story
**As a** learner with active tasks
**I want to** see my current "doing" tasks at a glance on the dashboard
**So that** I'm reminded of what I'm working on without navigating to the kanban board

## Acceptance Criteria

### Must Have
- [ ] Display count of tasks with status "doing"
- [ ] Show preview of next "doing" task (title, priority indicator)
- [ ] "View Kanban" link to /home/kanban
- [ ] Card wrapper with header "Current Tasks"
- [ ] Empty state when no "doing" tasks
- [ ] Reuse existing task types from kanban schema

### Nice to Have
- [ ] Priority color indicator for next task
- [ ] Subtask progress preview for next task

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | KanbanSummaryCard component | New |
| **Logic** | Task filtering by status | Existing |
| **Data** | Uses existing kanban task loader | Existing |
| **Database** | N/A (reuses existing tasks table) | N/A |

## Architecture Decision

**Approach**: Minimal - Reuse existing patterns with thin wrapper

**Rationale**: Task query and types already exist in kanban feature. This widget is a summary view that filters existing data by status="doing". No new queries needed - can reuse data from dashboard loader.

### Key Architectural Choices
1. Reuse Task type from `kanban/_lib/schema/task.schema.ts`
2. Filter tasks client-side from dashboard loader data
3. Simple Card component with count badge
4. Link to existing kanban page

### Trade-offs Accepted
- No direct query optimization for summary (filters from full task list)
- No separate caching for task summary (relies on dashboard loader)

## Required Credentials

| Variable | Description | Source |
|----------|-------------|--------|
| None required | Uses existing task data | N/A |

> If no external credentials required, note "None required" below:
> Widget uses task data from dashboard loader - no additional credentials.

## Dependencies

### Blocks
- S2072.I6 (Empty States & Polish) - needs kanban widget for empty state design

### Blocked By
- S2072.I1.F3 (Dashboard Data Loader) - needs tasks data in loader
- S2072.I1.F2 (Responsive Grid Layout) - needs grid slot

### Parallel With
- S2072.I3.F2 (Activity Feed Widget)
- S2072.I3.F4 (Quick Actions Panel)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/kanban-summary-card.tsx` - Summary widget component

### Modified Files
- `apps/web/app/home/(user)/_lib/server/dashboard.loader.ts` - Add tasks to loader if not present
- `apps/web/app/home/(user)/page.tsx` - Add kanban summary to dashboard grid

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Import Task Types**: Reuse types from kanban schema
2. **Create Summary Card Component**: Card with header, count badge, task preview
3. **Create Task Preview Component**: Title, priority indicator, subtask count
4. **Create Empty State**: "No tasks in progress" message with link to kanban
5. **Add Tasks to Dashboard Loader**: Ensure tasks data available (if not already)
6. **Integrate with Dashboard**: Add to grid layout

### Suggested Order
1. Import Task Types (type safety)
2. Create Task Preview Component (building block)
3. Create Summary Card Component (main widget)
4. Create Empty State (edge case)
5. Add Tasks to Dashboard Loader (data availability)
6. Integrate with Dashboard (connection)

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Visual verification
pnpm dev
# Navigate to /home, verify kanban summary renders with count

# Check task data flows correctly
# Add a task in /home/kanban, return to dashboard, verify count updates
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- Reference: `apps/web/app/home/(user)/kanban/_lib/schema/task.schema.ts` (types)
- Reference: `apps/web/app/home/(user)/kanban/_components/task-card.tsx` (card pattern)
- Reference: `apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.ts` (task query)
