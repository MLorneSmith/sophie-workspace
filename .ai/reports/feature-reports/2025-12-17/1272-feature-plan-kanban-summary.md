# Feature Plan: Kanban Summary Widget

**Issue**: #1272
**Parent**: #1268
**Research Manifest**: #1267
**Phase**: 2 (Data Visualization)
**Effort**: M (Medium)
**Dependencies**: #1269 (Dashboard Layout)
**Status**: Ready for Implementation

---

## Overview

Create a widget showing task counts by status (To Do, In Progress, Done) with visual indicators. Aggregates from `tasks` table grouped by status. Includes display of current "In Progress" tasks and next task suggestion. Click-through navigation to the full Kanban board.

## Solution Approach

### Component Architecture

Server component that fetches and aggregates task data:

```tsx
// apps/web/app/home/(user)/_components/widgets/kanban-summary-widget.tsx
import 'server-only';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import Link from 'next/link';
import { KanbanIcon, ChevronRight } from 'lucide-react';

interface KanbanSummaryWidgetProps {
  userId: string;
}

const KANBAN_COLUMNS = ['To Do', 'In Progress', 'Done'] as const;

export async function KanbanSummaryWidget({ userId }: KanbanSummaryWidgetProps) {
  const client = getSupabaseServerClient();

  // Fetch all tasks with their status
  const { data: tasks, error } = await client
    .from('tasks')
    .select('id, title, status, created_at')
    .eq('user_id', userId);

  if (error || !tasks) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tasks Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No tasks yet. Create your first task to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Aggregate tasks by status
  const tasksByStatus = {
    'To Do': tasks.filter(t => t.status === 'To Do').length,
    'In Progress': tasks.filter(t => t.status === 'In Progress').length,
    'Done': tasks.filter(t => t.status === 'Done').length,
  };

  // Get current doing tasks
  const doingTasks = tasks.filter(t => t.status === 'In Progress').slice(0, 2);

  // Get next task from To Do
  const nextTask = tasks.find(t => t.status === 'To Do');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tasks Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status badges */}
        <div className="grid grid-cols-3 gap-2">
          {KANBAN_COLUMNS.map(status => (
            <div key={status} className="flex flex-col items-center p-2 bg-muted rounded-lg">
              <span className="text-xs text-muted-foreground mb-1">{status}</span>
              <span className="text-2xl font-bold">{tasksByStatus[status]}</span>
            </div>
          ))}
        </div>

        {/* Current doing tasks */}
        {doingTasks.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Currently Doing</p>
            <div className="space-y-1">
              {doingTasks.map(task => (
                <div key={task.id} className="text-sm truncate">
                  <Badge variant="secondary" className="text-xs">
                    {task.title}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next task */}
        {nextTask && (
          <div className="pt-2 border-t">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Next Up</p>
            <p className="text-sm text-foreground truncate">{nextTask.title}</p>
          </div>
        )}

        {/* Link to full board */}
        <div className="pt-2">
          <Link href="/home/kanban" className="w-full">
            <Button variant="outline" className="w-full justify-between">
              <span>View Board</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
```

## Research Applied

### From Manifest
- **Kanban Board Pattern**: Existing `kanban-board.tsx` uses COLUMNS constant with status values
- **Data Source**: Query `tasks` table with `user_id` filter
- **Aggregation**: Group tasks by status (To Do, In Progress, Done)
- **Display Current**: Show up to 2 "In Progress" tasks as current context
- **Suggest Next**: Show first "To Do" task as next action
- **Navigation**: Link to full Kanban board for detailed view

### From Frontend Design Skill
- **shadcn/ui Components**: Card, Button, Badge from @kit/ui
- **Grid Layout**: 3-column grid for status badges
- **Visual Hierarchy**: Large numbers for counts, badges for task titles
- **Icons**: Use ChevronRight from lucide-react for navigation button
- **Spacing**: Section dividers with border-t for visual separation
- **Truncation**: Use truncate class for long task titles

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `apps/web/app/home/(user)/_components/widgets/kanban-summary-widget.tsx` | Server component that fetches and displays task summary |

## Implementation Tasks

### Task 1: Create Kanban Summary Widget
- [ ] Create file with `'use server'` directive
- [ ] Accept `userId` prop
- [ ] Query `tasks` table using Supabase server client
- [ ] Filter by `user_id` with `.eq('user_id', userId)`
- [ ] Select columns: id, title, status, created_at
- [ ] Handle error and empty cases with appropriate message
- [ ] Aggregate tasks by status (To Do, In Progress, Done)
- [ ] Filter "In Progress" tasks and get first 2
- [ ] Find first "To Do" task for next action
- [ ] Render Card with title and 3-column status grid
- [ ] Display task counts as large numbers
- [ ] Show current doing tasks in badge format
- [ ] Show next task title
- [ ] Add Button to link to full Kanban board
- [ ] Import ChevronRight icon from lucide-react
- [ ] Add `data-testid="kanban-summary-widget"` for E2E tests

### Task 2: Verify Status Values
- [ ] Check existing Kanban board for status column values
- [ ] Confirm status values: "To Do", "In Progress", "Done"
- [ ] Verify status is string field in tasks table
- [ ] Test with actual task data from local database
- [ ] Ensure aggregation logic handles all statuses

### Task 3: Database Query Validation
- [ ] Verify `tasks` table exists in Supabase
- [ ] Verify columns: `id`, `user_id`, `title`, `status`, `created_at`
- [ ] Verify RLS policy allows user to read their own tasks
- [ ] Test query manually in Supabase console
- [ ] Ensure query returns empty array for users with no tasks

### Task 4: Styling and Responsive Layout
- [ ] Verify 3-column grid displays correctly on mobile/tablet/desktop
- [ ] Test with different task counts (0, 1, 5, 20+)
- [ ] Verify badge truncation for long task titles
- [ ] Test button styling matches other widgets
- [ ] Ensure dark mode colors work correctly
- [ ] Verify all text is readable

### Task 5: Navigation Link
- [ ] Verify Kanban board route exists at `/home/kanban`
- [ ] Test navigation link works correctly
- [ ] Ensure link opens in same tab (not new window)

## Validation Commands

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint:fix

# Build
pnpm build

# Local testing
pnpm dev
# Navigate to /home
# Verify "Tasks Overview" widget displays
# Verify status counts are correct
# Verify current doing tasks display
# Verify next task displays
# Click "View Board" button to verify navigation
```

## Acceptance Criteria

- [ ] Widget fetches data from `tasks` table
- [ ] Task counts displayed by status (To Do, In Progress, Done)
- [ ] Counts are accurate and aggregate correctly
- [ ] Current "In Progress" tasks display as badges
- [ ] Shows up to 2 current tasks (not all)
- [ ] Next "To Do" task displays
- [ ] "View Board" button links to Kanban board
- [ ] Empty state displays for users with no tasks
- [ ] Layout responsive on mobile/tablet/desktop
- [ ] Long task titles truncate with ellipsis
- [ ] Dark mode colors work correctly
- [ ] TypeScript passes with no errors
- [ ] Card styling matches other widgets
- [ ] RLS protects query (user can only see their own tasks)
- [ ] E2E test can select widget by data-testid

---

*Plan generated by initiative-planning agent*
*Skills used: frontend-design*
*Research conducted: No - existing Kanban patterns reused*
