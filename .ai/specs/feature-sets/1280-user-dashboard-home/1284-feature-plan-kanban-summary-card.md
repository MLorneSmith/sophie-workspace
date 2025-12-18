# Feature Plan: Kanban Summary Card

**Issue**: #1284
**Parent**: #1280
**Research Manifest**: #1279
**Phase**: 2 - Core Components
**Effort**: S (Small)
**Dependencies**: #1281 (Dashboard Data Loader)

---

## Overview

Display task counts grouped by status (todo, in-progress, done) with visual badges. Prominently show the current "Doing" task and next recommended task, with a direct link to the full kanban board for detailed task management.

This lightweight summary provides quick insight into task progress without navigating to the full kanban interface.

## Solution Approach

### Component Structure

**Layout**:
- Header: Title and link to full kanban board
- Task counts row: 3 badges showing status counts
- Current task: "Doing" task title with priority indicator
- Next task: Recommended next task to start
- Footer: "View all tasks" link

**Styling Pattern**:
- Use Badge components for status counts
- Use different colors for each status (todo=gray, in_progress=blue, done=green)
- Task titles with truncation if too long
- Priority indicator with icon/color

### Data Format

Input from `loadKanbanSummary()`:
```typescript
{
  todo: number,
  in_progress: number,
  done: number,
  currentTask: { id: string; title: string; status: string; priority: string } | null,
  nextTask: { id: string; title: string; status: string; priority: string } | null,
}
```

### Key Implementation Details

1. **Client Component**
   - Add `"use client"` directive (optional - could be server if using Link)
   - Accept kanban summary prop from parent

2. **Badge Styling**
   - Todo: Gray variant
   - In Progress: Blue variant (most important)
   - Done: Green variant (success)
   - Include count number in badge

3. **Task Display**
   - Current task: Larger font, highlighted
   - Next task: Normal font, secondary color
   - Priority indicator: Icon or color coding (low/medium/high)
   - Handle null values (no current/next task)

4. **Links**
   - "View all tasks" button links to `/home/kanban`
   - Tasks clickable to task detail/editing (optional)

### Code Pattern

```typescript
'use client';

import { Badge } from '@kit/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { ArrowRight, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { If } from '@kit/ui/if';
import Link from 'next/link';

interface KanbanTask {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface KanbanSummaryData {
  todo: number;
  in_progress: number;
  done: number;
  currentTask: KanbanTask | null;
  nextTask: KanbanTask | null;
}

interface KanbanSummaryCardProps {
  summary: KanbanSummaryData;
}

export function KanbanSummaryCard({ summary }: KanbanSummaryCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Tasks</CardTitle>
          <CardDescription>Quick summary</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/home/kanban">
            View all
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4 flex-1">
        {/* Status Counts */}
        <div className="flex gap-2">
          <Badge variant="secondary">{summary.todo} Todo</Badge>
          <Badge variant="default">{summary.in_progress} Doing</Badge>
          <Badge variant="outline">{summary.done} Done</Badge>
        </div>

        {/* Current Task */}
        <If condition={summary.currentTask}>
          {(task) => (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Currently Doing
              </p>
              <div className="flex items-start gap-2">
                <Circle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Priority: {task.priority}
                  </p>
                </div>
              </div>
            </div>
          )}
        </If>

        {/* Next Task */}
        <If condition={summary.nextTask}>
          {(task) => (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Next Task
              </p>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Priority: {task.priority}
                  </p>
                </div>
              </div>
            </div>
          )}
        </If>

        {/* Empty State */
        <If condition={!summary.currentTask && !summary.nextTask}>
          <div className="flex items-center justify-center py-6">
            <p className="text-sm text-muted-foreground text-center">
              <CheckCircle2 className="w-4 h-4 inline mr-2" />
              All tasks completed!
            </p>
          </div>
        </If>
      </CardContent>
    </Card>
  );
}

function getPriorityColor(priority: string): string {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'text-red-500';
    case 'medium':
      return 'text-yellow-500';
    case 'low':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
}
```

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `apps/web/app/home/(user)/_components/dashboard/kanban-summary-card.tsx` | Task summary card with status counts |

## Implementation Tasks

### Task 1: Create component scaffold
- [ ] Create file `apps/web/app/home/(user)/_components/dashboard/kanban-summary-card.tsx`
- [ ] Add `"use client"` directive
- [ ] Import Badge, Card components from @kit/ui
- [ ] Import icons (Circle, AlertCircle, ArrowRight) from lucide-react
- [ ] Define TypeScript interfaces for props

### Task 2: Create status badge row
- [ ] Display 3 badges: todo count, in_progress count, done count
- [ ] Use different variants: secondary (todo), default (in_progress), outline (done)
- [ ] Style with consistent spacing

### Task 3: Implement current task display
- [ ] Show "Currently Doing" label
- [ ] Display current task title with truncation
- [ ] Show priority level
- [ ] Use Circle icon (blue) for in_progress status
- [ ] Handle null case (no current task)

### Task 4: Implement next task display
- [ ] Show "Next Task" label with separator
- [ ] Display next task title with truncation
- [ ] Show priority level
- [ ] Use AlertCircle icon for upcoming task
- [ ] Handle null case (no next task)

### Task 5: Implement empty state and links
- [ ] Show "All tasks completed!" message when no current/next tasks
- [ ] Add "View all" link to `/home/kanban` in header
- [ ] Use Button variant="ghost" for subtle styling

### Task 6: Testing and validation
- [ ] Run `pnpm typecheck` and verify no type errors
- [ ] Run `pnpm lint:fix` and ensure code style compliance
- [ ] Test with various task counts
- [ ] Test empty state (no tasks)
- [ ] Test with tasks that have long titles
- [ ] Verify responsive layout

## Validation Commands

```bash
pnpm typecheck
pnpm lint:fix
pnpm format:fix
```

## Acceptance Criteria

- [ ] Displays count badges for each task status
- [ ] Shows current "Doing" task prominently
- [ ] Shows next recommended task
- [ ] Priority levels displayed
- [ ] Empty state shown when no tasks exist
- [ ] Links to full kanban board work
- [ ] Task titles truncate appropriately on small screens
- [ ] All validation commands pass without errors
- [ ] No TypeScript `any` types used

---

*Plan generated by initiative-planning agent*
*Skills used: frontend-design*
*Research conducted: no*
