# Feature: Kanban Summary Card

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | #1365 |
| **Feature ID** | 1365-F4 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
Build the Kanban Summary Card for the dashboard showing the current "doing" task and the next highest-priority "to do" task. Provides quick visibility into active work and links to the full kanban board.

## User Story
**As a** user
**I want to** see my current and next task on the dashboard
**So that** I can quickly resume work without navigating to the kanban board

## Acceptance Criteria

### Must Have
- [ ] Server component `KanbanSummaryCard` displays in dashboard card format
- [ ] Loader queries tasks table for current task (status='doing' LIMIT 1)
- [ ] Loader queries tasks table for next task (status='do' ORDER BY priority DESC LIMIT 1)
- [ ] Parallel queries via Promise.all for performance
- [ ] Current task highlighted with primary background color
- [ ] Priority badge with color coding (low/medium/high)
- [ ] Link to full kanban board in card footer
- [ ] Empty state shown when no tasks exist
- [ ] i18n translations for all text

### Nice to Have
- [ ] Task description with line-clamp-2 for long text
- [ ] Skeleton loader for progressive rendering

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | KanbanSummaryCard, KanbanSummaryEmpty | New |
| **Logic** | Priority color mapping | New |
| **Data** | kanban-summary.loader.ts with React.cache | New |
| **Database** | Queries existing tasks table | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Leverage existing tasks table schema; minimal new code; follow dashboard card patterns established by other features.

### Key Architectural Choices
1. **Parallel Query Pattern**: Promise.all fetches current + next tasks simultaneously
2. **Priority Ordering**: Next task query orders by priority DESC to surface highest priority
3. **Visual Hierarchy**: Current task gets primary background color for emphasis
4. **Direct Link**: Footer button navigates to full kanban board

### Trade-offs Accepted
- Only shows one "doing" task (acceptable for personal task management)
- No real-time updates (acceptable - refresh on navigation)

## Dependencies

### Blocks
- None (end feature)

### Blocked By
- None (queries existing tasks table created by kanban feature)

### Parallel With
- F1: Activity Database Schema (can develop in parallel - different tables)
- F3: Activity Feed Component (can develop UI in parallel)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/server/kanban-summary.loader.ts` - Data loader
- `apps/web/app/home/(user)/_components/kanban-summary-card.tsx` - Main server component
- `apps/web/app/home/(user)/_components/kanban-summary-empty.tsx` - Empty state

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Add KanbanSummaryCard to dashboard
- `apps/web/public/locales/en/common.json` - Add kanban summary translations

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create Loader**: kanban-summary.loader.ts with parallel queries
2. **Create Card Component**: KanbanSummaryCard server component
3. **Create Empty State**: KanbanSummaryEmpty with create task CTA
4. **Add Translations**: i18n keys for kanban summary text
5. **Integrate into Dashboard**: Add to page.tsx with Suspense
6. **Write Unit Tests**: Test priority color mapping, empty state logic

### Suggested Order
Loader → Card → Empty → Translations → Integration → Tests

## Validation Commands
```bash
# Verify component renders
pnpm dev
# Navigate to /home/[account] and check kanban summary card

# Test with no tasks
# Clear tasks table and verify empty state

# Test with tasks
# Create "doing" and "do" tasks and verify display

# Run unit tests
pnpm --filter web test:unit -- kanban-summary

# Verify typecheck
pnpm typecheck

# Run linter
pnpm lint:fix
```

## Related Files
- Initiative: `../initiative.md`
- Existing tasks table: `apps/web/supabase/migrations/20250221144500_web_create_kanban_tables.sql`
- Existing kanban page: `apps/web/app/home/(user)/kanban/page.tsx`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
