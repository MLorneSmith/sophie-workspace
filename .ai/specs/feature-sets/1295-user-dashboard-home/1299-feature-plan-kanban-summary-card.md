# Feature Plan: Kanban Summary Card

**Issue**: #1299
**Parent**: #1295
**Research Manifest**: #1294
**Phase**: 2
**Effort**: S (Small)
**Dependencies**: #1296 (Dashboard Data Loader)

---

## Overview

Server component displaying task counts by status (To Do, In Progress, Done) with visual indicators. Shows current 'Doing' task and next task in queue. Includes link to full Kanban board for workflow management.

## Solution Approach

**Component Pattern**: Server Component with Status Visualization

- Display task counts grouped by status
- Visual indicators (badges, color-coded status boxes)
- Show current task being worked on
- Show next task in queue
- Link to full Kanban board
- Static server component (no interactivity)

**Key Design Decisions**:
- Server component for no client-side overhead
- Reuse task count data from dashboard loader
- Color-coded status indicators for quick scanning
- Fixed height prevents layout shift
- Handle empty task lists

## Research Applied

### From Manifest
- Task counts queried from `tasks` and `subtasks` tables
- Reuse `useTasks` hook pattern for query structure
- Group counts by status (to do, in_progress, done)
- Handle empty task states

### From Skills
- Server components for static content
- Shadcn components for consistent styling
- Tailwind CSS for color-coded status indicators

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `apps/web/app/home/(user)/_components/kanban-summary-card.tsx` | Kanban task summary card |

### Modified Files
| File | Changes |
|------|---------|
| `apps/web/app/home/(user)/page.tsx` | Import and render KanbanSummaryCard in dashboard |

## Implementation Tasks

### Task 1: Create Kanban Summary Card Component
- [ ] Import Card components from shadcn
- [ ] Accept `TaskCounts` data as props
- [ ] Display task counts in status columns (To Do, In Progress, Done)
- [ ] Use badges with color-coded status indicators
- [ ] Show current task title if available
- [ ] Show next task in queue
- [ ] Include link to full Kanban board
- [ ] Style with grid layout for status columns

**File**: `apps/web/app/home/(user)/_components/kanban-summary-card.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { ArrowRight } from 'lucide-react';
import type { TaskCounts } from '../_lib/types/dashboard.types';

interface KanbanSummaryCardProps {
  data: TaskCounts;
}

export function KanbanSummaryCard({ data }: KanbanSummaryCardProps) {
  const totalTasks = data.todo + data.inProgress + data.done;

  if (totalTasks === 0) {
    return (
      <Card className="h-[320px] flex items-center justify-center">
        <CardContent>
          <p className="text-muted-foreground text-center">
            No tasks yet. Create your first task to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[320px] flex flex-col">
      <CardHeader>
        <CardTitle>Task Summary</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center gap-2">
            <Badge variant="secondary">{data.todo}</Badge>
            <span className="text-xs text-muted-foreground">To Do</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Badge variant="default">{data.inProgress}</Badge>
            <span className="text-xs text-muted-foreground">In Progress</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Badge variant="outline">{data.done}</Badge>
            <span className="text-xs text-muted-foreground">Done</span>
          </div>
        </div>

        {data.currentTask && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Now Doing</p>
            <p className="font-medium truncate">{data.currentTask.title}</p>
          </div>
        )}

        <Button variant="outline" className="w-full mt-auto gap-2">
          View All Tasks
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Task 2: Handle Empty States
- [ ] Display message when no tasks exist
- [ ] Test with zero tasks in database
- [ ] Provide CTA to create first task

### Task 3: Status Indicators
- [ ] Use color-coded badges for visual scanning
- [ ] Ensure colors match Kanban board design
- [ ] Maintain consistency with existing UI

### Task 4: Current/Next Task Display
- [ ] Show current task being worked on
- [ ] Show next task in queue
- [ ] Handle missing task data gracefully

### Task 5: Type Safety
- [ ] Ensure `TaskCounts` type correctly imported
- [ ] Add TypeScript interfaces for props
- [ ] No `any` types

## Validation Commands

```bash
pnpm typecheck
pnpm lint:fix
pnpm format:fix
pnpm build
```

## Acceptance Criteria

- [ ] Component exists at `apps/web/app/home/(user)/_components/kanban-summary-card.tsx`
- [ ] Displays task counts by status
- [ ] Color-coded status indicators visible
- [ ] Shows current task being worked on
- [ ] Includes link to full Kanban board
- [ ] Empty state displayed when no tasks
- [ ] Component receives data from dashboard loader via props
- [ ] Fixed height prevents layout jank
- [ ] TypeScript strict mode passes
- [ ] All validation commands pass

---
*Plan generated by initiative-planning agent*
*Skills used: frontend-design*
*Research conducted: no*
