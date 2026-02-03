# Feature: Kanban Summary Card

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1890.I4 |
| **Feature ID** | S1890.I4.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
Create a dashboard widget that displays the user's current "Doing" task(s) and next queued items from their kanban board. This provides at-a-glance visibility into what they're working on and what's coming up next, driving engagement by showing immediate next actions.

## User Story
**As a** SlideHeroes learner
**I want to** see my current tasks and what's next on my dashboard
**So that** I can quickly understand what I'm working on without navigating to the full kanban board

## Acceptance Criteria

### Must Have
- [ ] Display "Doing" section with current in-progress tasks (max 3)
- [ ] Display "Next Up" section with queued tasks from "To Do" column (max 3)
- [ ] Show task priority with color-coded left border (high=red, medium=orange, low=green)
- [ ] Show phase badge for tasks that have a phase assigned
- [ ] Display subtask progress count (e.g., "3/5 Subtasks")
- [ ] Include "View Kanban Board" link to full board
- [ ] Responsive layout for mobile/tablet/desktop

### Nice to Have
- [ ] Show total task counts per status in header
- [ ] Priority-based sorting within each section

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `kanban-summary-card.tsx` | New |
| **Logic** | Reuse `useTasks()` hook | Existing |
| **Data** | Filter tasks by status | Existing |
| **Database** | `tasks` table with RLS | Existing |

## Architecture Decision

**Approach**: Pragmatic - Reuse existing infrastructure
**Rationale**: The `useTasks()` hook already fetches all tasks with subtasks and is RLS-protected. We only need to filter by status and limit display count. This minimizes new code while leveraging proven patterns.

### Key Architectural Choices
1. Reuse `useTasks()` hook from kanban feature - already cached with 60s stale time
2. Client-side filtering for "doing" and "do" status - cheap for typical task counts
3. Follow existing task-card patterns for priority colors and badges

### Trade-offs Accepted
- Loading all tasks instead of just doing/todo (hook fetches all) - acceptable given typical task counts

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Card container | Card, CardHeader, CardContent | @kit/ui/card | Standard dashboard card |
| Priority indicator | Border-left classes | Tailwind | Matches kanban task-card pattern |
| Phase badge | Badge variant="secondary" | @kit/ui/badge | Matches existing phase display |
| Progress text | Icon + text | lucide-react | Matches kanban subtask display |
| Section headers | Custom with muted text | Tailwind | Matches dashboard patterns |
| Link button | Button variant="ghost" | @kit/ui/button | Consistent navigation pattern |

**Components to Install**: None - all needed components exist

## Required Credentials
> Environment variables required for this feature to function. Extracted from research files.

| Variable | Description | Source |
|----------|-------------|--------|
| None required | All data from internal Supabase tables | N/A |

> No external credentials required - uses existing authenticated Supabase client.

## Dependencies

### Blocks
- F3: Activity Feed Timeline (provides pattern for dashboard widgets)

### Blocked By
- S1890.I1.F1: Dashboard Page & Grid (provides layout container)
- S1890.I2.F1: Data Layer Types (provides shared TypeScript interfaces)

### Parallel With
- None within this initiative (F1 is the starting point)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/kanban-summary-card.tsx` - Main widget component
- `apps/web/public/locales/en/dashboard.json` - Add i18n keys (if not exists, extend)

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and place widget in grid (after I1/I2)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create KanbanSummaryCard component skeleton**: Set up component file with Card structure
2. **Integrate useTasks hook**: Wire up data fetching with loading/error states
3. **Implement task filtering logic**: Filter by status, limit display, sort by priority
4. **Build task item display**: Priority border, phase badge, subtask progress
5. **Add section headers**: "Doing" and "Next Up" with task counts
6. **Add View Kanban Board link**: Button with ChevronRight icon
7. **Add i18n translations**: Add keys to dashboard namespace
8. **Write component tests**: Test filtering, display, empty states

### Suggested Order
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 (linear dependency chain)

## Validation Commands
```bash
# Verify component exists
test -f apps/web/app/home/\(user\)/_components/kanban-summary-card.tsx && echo "✓ Component exists"

# Typecheck
pnpm typecheck

# Lint
pnpm lint

# Visual verification (after integration with page)
# pnpm --filter web-e2e test:local -- -g "dashboard kanban"
```

## Related Files
- Initiative: `../initiative.md`
- Existing useTasks hook: `apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.ts`
- Existing task-card: `apps/web/app/home/(user)/kanban/_components/task-card.tsx`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
