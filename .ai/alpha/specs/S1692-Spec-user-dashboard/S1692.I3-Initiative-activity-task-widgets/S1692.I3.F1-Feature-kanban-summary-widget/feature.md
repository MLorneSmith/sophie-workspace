# Feature: Kanban Summary Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1692.I3 |
| **Feature ID** | S1692.I3.F1 |
| **Status** | Draft |
| **Estimated Days** | 3-4 |
| **Priority** | 1 |

## Description
A compact dashboard widget displaying the user's current "Doing" task with subtask progress and the next recommended "To Do" task. Provides quick navigation to the full Kanban board for detailed task management.

## User Story
**As a** SlideHeroes user
**I want to** see my current task and next task at a glance on my dashboard
**So that** I can stay focused on my immediate priorities without navigating to the full Kanban board

## Acceptance Criteria

### Must Have
- [ ] Display current "Doing" task with title and description preview
- [ ] Show subtask progress bar (completed / total subtasks)
- [ ] Display next recommended "To Do" task
- [ ] Link to full Kanban board (/home/kanban)
- [ ] Empty state when no tasks exist
- [ ] Loading skeleton state while fetching

### Nice to Have
- [ ] Click on task to navigate to Kanban with task selected
- [ ] Show task priority badge (high/medium/low)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `kanban-summary-widget.tsx` | New |
| **Logic** | `useTasks()` hook | Existing |
| **Data** | Tasks filtered by status | Existing |
| **Database** | `tasks` table | Existing |

## Architecture Decision

**Approach**: Client Component with Existing Hook
**Rationale**: Reuse the battle-tested `useTasks()` React Query hook from the Kanban feature. Client-side filtering is simple and performant for the small dataset (user's own tasks).

### Key Architectural Choices
1. Use existing `useTasks()` hook - no duplication of data fetching logic
2. Client-side filtering for `status === 'doing'` and `status === 'do'`
3. Calculate subtask progress inline: `completedSubtasks / totalSubtasks`

### Trade-offs Accepted
- Client component increases JS bundle slightly, but hook is already loaded for authenticated users

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Container | Card | @kit/ui/card | Standard widget container |
| Progress | Progress | @kit/ui/progress | Subtask completion visual |
| Badge | Badge | @kit/ui/badge | Priority indicator (optional) |
| Link | Link | next/link | Navigation to Kanban |

**Components to Install**: None - all components already available

## Dependencies

### Blocks
- None

### Blocked By
- None (uses existing Kanban infrastructure)

### Parallel With
- F2: Activity Data Aggregation
- F4: Quick Actions Panel

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/kanban-summary-widget.tsx` - Main widget component

### Modified Files
- None

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create widget component**: Set up client component with useTasks hook
2. **Implement task filtering**: Filter for doing/do status
3. **Add progress calculation**: Calculate subtask completion percentage
4. **Design empty state**: Handle no tasks scenario
5. **Add loading skeleton**: Show placeholder while loading
6. **Style and layout**: Match dashboard grid design

### Suggested Order
1. Create component skeleton with hook integration
2. Implement filtering and display logic
3. Add progress bar and styling
4. Add empty state and loading state
5. Test with various task scenarios

## Validation Commands
```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Visual test (manual)
# 1. Visit /home and verify widget renders
# 2. Test with no tasks (empty state)
# 3. Test with doing + do tasks
# 4. Click link to Kanban board
```

## Related Files
- Initiative: `../initiative.md`
- Kanban hooks: `apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.ts`
- Task schema: `apps/web/app/home/(user)/kanban/_lib/schema/task.schema.ts`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
