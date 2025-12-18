# Feature Plan: Recent Activity Feed

**Issue**: #1285
**Parent**: #1280
**Research Manifest**: #1279
**Phase**: 2 - Core Components
**Effort**: M (Medium)
**Dependencies**: #1281 (Dashboard Data Loader)

---

## Overview

Timeline component showing recent user activities with visual timeline styling. Displays activities including:
- Presentations created/updated
- Lessons completed
- Quiz scores achieved
- Assessments completed

Activities appear in reverse-chronological order (newest first) with relative timestamps (e.g., "2 hours ago").

## Solution Approach

### Component Structure

**Layout**:
- Vertical timeline with centered line
- Activity items aligned left/right alternating (optional, classic timeline pattern)
- OR simple vertical list (simpler implementation)
- Each activity: icon, title, timestamp, detail
- Limit to 5-10 most recent activities
- "View all" link for complete history

**Activity Types**:
1. `presentation_created` - New presentation outline started
2. `lesson_completed` - Lesson finished
3. `quiz_passed` - Quiz attempt passed
4. `quiz_attempted` - Quiz attempt completed
5. `assessment_completed` - Full assessment finished

### Data Format

Input from `loadRecentActivity()`:
```typescript
Array<{
  type: 'presentation_created' | 'lesson_completed' | 'quiz_passed' | 'quiz_attempted' | 'assessment_completed';
  id: string;
  title?: string;
  timestamp: string; // ISO date
  score?: number; // For quizzes
}>
```

### Key Implementation Details

1. **Client Component**
   - Add `"use client"` directive
   - Accept activities array prop

2. **Timestamp Formatting**
   - Use `formatDistanceToNow()` from date-fns for relative time
   - Format: "2 hours ago", "3 days ago", etc.
   - Fallback to absolute date on hover/tooltip

3. **Activity Icons**
   - `presentation_created`: FileText or BookOpen icon
   - `lesson_completed`: CheckCircle2 icon (green)
   - `quiz_passed`: Trophy or Star icon (gold)
   - `quiz_attempted`: AlertCircle or HelpCircle icon (orange)
   - `assessment_completed`: Award icon (purple)

4. **Color Coding**
   - Success (green) for completed/passed
   - Warning (orange) for attempted
   - Info (blue) for created
   - Icon color communicates activity type instantly

5. **Empty State**
   - "No activities yet" message
   - Link to start learning/create presentation

### Code Pattern

```typescript
'use client';

import { useId } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import {
  FileText,
  CheckCircle2,
  Trophy,
  AlertCircle,
  Award,
  ArrowRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { If } from '@kit/ui/if';

interface Activity {
  type: 'presentation_created' | 'lesson_completed' | 'quiz_passed' | 'quiz_attempted' | 'assessment_completed';
  id: string;
  title?: string;
  timestamp: string;
  score?: number;
}

interface RecentActivityFeedProps {
  activities: Activity[];
}

export function RecentActivityFeed({ activities = [] }: RecentActivityFeedProps) {
  const id = useId();
  const hasActivities = activities.length > 0;

  return (
    <Card className="col-span-1 md:col-span-3">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Your recent progress</CardDescription>
        </div>
        <If condition={hasActivities}>
          <Button variant="ghost" size="sm" asChild>
            <a href="/home/activity">
              View all
              <ArrowRight className="w-4 h-4 ml-1" />
            </a>
          </Button>
        </If>
      </CardHeader>

      <CardContent>
        <If condition={hasActivities} fallback={<EmptyState />}>
          <div className="space-y-4">
            {activities.slice(0, 10).map((activity, index) => (
              <ActivityItem key={activity.id} activity={activity} isFirst={index === 0} />
            ))}
          </div>
        </If>
      </CardContent>
    </Card>
  );
}

function ActivityItem({ activity, isFirst }: { activity: Activity; isFirst: boolean }) {
  const { icon: Icon, label, color } = getActivityConfig(activity.type);
  const timeAgo = formatDistanceToNow(new Date(activity.timestamp), {
    addSuffix: true,
  });

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center gap-2">
        <Icon className={`w-5 h-5 ${color}`} />
        {!isFirst && <div className="w-0.5 h-8 bg-border" />}
      </div>
      <div className="flex-1 pb-2">
        <div className="flex items-baseline gap-2">
          <p className="font-medium text-sm">{label}</p>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
        <If condition={activity.title}>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {activity.title}
          </p>
        </If>
        <If condition={activity.score !== undefined}>
          <p className="text-xs text-muted-foreground">
            Score: {activity.score}%
          </p>
        </If>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
      <p className="text-sm text-muted-foreground">
        No activities yet. Start learning!
      </p>
      <Button variant="outline" size="sm" asChild>
        <a href="/home/courses">Begin Course</a>
      </Button>
    </div>
  );
}

function getActivityConfig(type: string): {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
} {
  switch (type) {
    case 'presentation_created':
      return {
        icon: FileText,
        label: 'Created presentation outline',
        color: 'text-blue-500',
      };
    case 'lesson_completed':
      return {
        icon: CheckCircle2,
        label: 'Completed lesson',
        color: 'text-green-500',
      };
    case 'quiz_passed':
      return {
        icon: Trophy,
        label: 'Passed quiz',
        color: 'text-yellow-500',
      };
    case 'quiz_attempted':
      return {
        icon: AlertCircle,
        label: 'Attempted quiz',
        color: 'text-orange-500',
      };
    case 'assessment_completed':
      return {
        icon: Award,
        label: 'Completed assessment',
        color: 'text-purple-500',
      };
    default:
      return {
        icon: AlertCircle,
        label: 'Activity',
        color: 'text-gray-500',
      };
  }
}
```

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `apps/web/app/home/(user)/_components/dashboard/recent-activity-feed.tsx` | Timeline component for recent activities |

### Dependencies
| Package | Version | Note |
|---------|---------|------|
| `date-fns` | ^2.30.0 | Should already be installed |
| `lucide-react` | ^0.263.0 | Should already be installed |

## Implementation Tasks

### Task 1: Create component scaffold
- [ ] Create file `apps/web/app/home/(user)/_components/dashboard/recent-activity-feed.tsx`
- [ ] Add `"use client"` directive
- [ ] Import Card components from @kit/ui
- [ ] Import icons (FileText, CheckCircle2, Trophy, etc.) from lucide-react
- [ ] Import `formatDistanceToNow` from date-fns
- [ ] Define TypeScript interfaces for Activity and props

### Task 2: Create activity configuration
- [ ] Implement `getActivityConfig()` function
- [ ] Define icon, label, and color for each activity type
- [ ] Ensure colors are semantic (green for success, orange for warning, etc.)

### Task 3: Implement activity item component
- [ ] Create `ActivityItem` component displaying single activity
- [ ] Show icon with activity type color
- [ ] Display activity label and relative timestamp
- [ ] Show activity title if available
- [ ] Show score if quiz attempt

### Task 4: Implement timeline styling
- [ ] Create vertical timeline with separator lines
- [ ] Connect items with thin vertical line
- [ ] First item doesn't show line below (optional, for cleaner look)
- [ ] Responsive spacing for mobile/desktop

### Task 5: Implement main feed layout
- [ ] List activities in order (newest first)
- [ ] Limit to 10 most recent items
- [ ] Show "View all" button if more than 10 items
- [ ] Implement empty state with CTA

### Task 6: Testing and validation
- [ ] Run `pnpm typecheck` and verify no type errors
- [ ] Run `pnpm lint:fix` and ensure code style compliance
- [ ] Test with various activity types
- [ ] Test with activities having/missing optional fields
- [ ] Test empty state
- [ ] Test relative timestamp formatting
- [ ] Verify responsive layout

## Validation Commands

```bash
pnpm typecheck
pnpm lint:fix
pnpm format:fix
```

## Acceptance Criteria

- [ ] Displays recent activities in reverse-chronological order
- [ ] Shows appropriate icon and color for each activity type
- [ ] Displays relative timestamps (e.g., "2 hours ago")
- [ ] Shows activity titles and scores when available
- [ ] Timeline styling with connecting lines
- [ ] Limits display to 10 items with "View all" button
- [ ] Empty state shown when no activities
- [ ] Links to relevant pages work correctly
- [ ] All validation commands pass without errors
- [ ] No TypeScript `any` types used

---

*Plan generated by initiative-planning agent*
*Skills used: frontend-design*
*Research conducted: no*
