# Feature Plan: Recent Activity Feed

**Issue**: #1300
**Parent**: #1295
**Research Manifest**: #1294
**Phase**: 2
**Effort**: M (Medium)
**Dependencies**: #1296 (Dashboard Data Loader)

---

## Overview

Server component with optional client-side Load More button displaying recent user activities. Shows presentations created/updated, lessons completed, quiz scores achieved, and assessments completed. Provides timeline view of user progress over time.

## Solution Approach

**Component Pattern**: Hybrid Server + Client Component with Pagination

- Server component renders initial activity list (first 5-8 items)
- Client-side "Load More" button for additional activities
- Activity items with icons indicating activity type
- Timestamp display (relative time like "2 hours ago")
- Link from each activity to related feature (presentation, lesson, quiz)

**Key Design Decisions**:
- Start with "Load More" button, not infinite scroll (simpler, better performance)
- Server component for initial render
- Client component for Load More interaction
- Activity types indicated by icons/colors
- Fixed height with scroll for many activities
- Aggregated activity types from multiple tables

## Research Applied

### From Manifest
- Activity feed data from multiple tables: presentations, lesson_progress, quiz_submissions, survey_responses
- Handle empty states when no activities
- Use relative timestamps ("2 hours ago")
- Simple "Load More" instead of infinite scroll

### From Skills
- Hybrid server/client pattern
- Tailwind CSS for timeline styling
- Icons from lucide-react for activity types

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `apps/web/app/home/(user)/_components/recent-activity-feed.tsx` | Recent activity feed component |
| `apps/web/app/home/(user)/_lib/server/activity.loader.ts` | Server function for loading more activities |

### Modified Files
| File | Changes |
|------|---------|
| `apps/web/app/home/(user)/page.tsx` | Import and render RecentActivityFeed in dashboard |

## Implementation Tasks

### Task 1: Create Recent Activity Feed Component
- [ ] Import Card, Button components from shadcn
- [ ] Accept `ActivityItem[]` data as props
- [ ] Display activity timeline with icons
- [ ] Show relative timestamps
- [ ] Include links to related features
- [ ] Add "Load More" button at bottom
- [ ] Style with timeline indicators (vertical line, dots)

**File**: `apps/web/app/home/(user)/_components/recent-activity-feed.tsx`

```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import {
  FileText,
  BookOpen,
  CheckCircle,
  Award,
  ChevronDown,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ActivityItem } from '../_lib/types/dashboard.types';
import { useState } from 'react';

interface RecentActivityFeedProps {
  initialActivities: ActivityItem[];
  hasMore: boolean;
}

function getActivityIcon(type: ActivityItem['type']) {
  switch (type) {
    case 'presentation':
      return <FileText className="w-4 h-4" />;
    case 'lesson':
      return <BookOpen className="w-4 h-4" />;
    case 'quiz':
      return <CheckCircle className="w-4 h-4" />;
    case 'assessment':
      return <Award className="w-4 h-4" />;
  }
}

function getActivityColor(type: ActivityItem['type']) {
  switch (type) {
    case 'presentation':
      return 'bg-blue-500/10 text-blue-600';
    case 'lesson':
      return 'bg-green-500/10 text-green-600';
    case 'quiz':
      return 'bg-purple-500/10 text-purple-600';
    case 'assessment':
      return 'bg-amber-500/10 text-amber-600';
  }
}

export function RecentActivityFeed({
  initialActivities,
  hasMore,
}: RecentActivityFeedProps) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    // TODO: Implement load more functionality with server action
    setIsLoadingMore(false);
  };

  if (initialActivities.length === 0) {
    return (
      <Card className="h-[320px] flex items-center justify-center">
        <CardContent>
          <p className="text-muted-foreground text-center">
            No recent activity yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[320px] flex flex-col">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto flex flex-col gap-4">
        {initialActivities.map((activity, idx) => (
          <div key={activity.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`p-2 rounded-lg ${getActivityColor(
                  activity.type,
                )}`}
              >
                {getActivityIcon(activity.type)}
              </div>
              {idx !== initialActivities.length - 1 && (
                <div className="w-0.5 h-8 bg-border mt-2" />
              )}
            </div>
            <div className="flex-1 pt-1">
              <p className="font-medium text-sm">{activity.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.timestamp), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        ))}

        {hasMore && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="w-full mt-2 gap-2"
          >
            <ChevronDown className="w-4 h-4" />
            {isLoadingMore ? 'Loading...' : 'Load More'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

### Task 2: Create Activity Loader Server Function
- [ ] Query activities from presentation, lesson, quiz, assessment tables
- [ ] Aggregate into single activity stream
- [ ] Sort by timestamp descending
- [ ] Paginate results (5-8 per page)
- [ ] Return typed ActivityItem[] data

**File**: `apps/web/app/home/(user)/_lib/server/activity.loader.ts`

```typescript
import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/lib/database.types';
import type { ActivityItem } from '../types/dashboard.types';

export async function loadRecentActivity(
  client: SupabaseClient<Database>,
  userId: string,
  limit: number = 8,
): Promise<ActivityItem[]> {
  try {
    // Query activities from multiple tables
    // Convert to ActivityItem format
    // Sort by timestamp
    // Limit to specified count
    return [];
  } catch (error) {
    console.error('Failed to load recent activity:', error);
    return [];
  }
}

export async function loadMoreActivity(
  client: SupabaseClient<Database>,
  userId: string,
  offset: number = 8,
  limit: number = 8,
): Promise<ActivityItem[]> {
  try {
    // Load additional activities with offset pagination
    return [];
  } catch (error) {
    console.error('Failed to load more activity:', error);
    return [];
  }
}
```

### Task 3: Handle Activity Types and Icons
- [ ] Map activity types to appropriate icons
- [ ] Create color-coded indicators for each type
- [ ] Display activity-specific information

### Task 4: Timestamps and Formatting
- [ ] Use `formatDistanceToNow` from date-fns for relative times
- [ ] Handle timezone considerations
- [ ] Display user-friendly format ("2 hours ago", "yesterday")

### Task 5: Load More Implementation
- [ ] Implement server action for loading more activities
- [ ] Add pagination offset logic
- [ ] Update component state on load
- [ ] Disable button when no more activities available

## Validation Commands

```bash
pnpm typecheck
pnpm lint:fix
pnpm format:fix
pnpm build
```

## Acceptance Criteria

- [ ] Component exists at `apps/web/app/home/(user)/_components/recent-activity-feed.tsx`
- [ ] Displays recent activities from multiple tables
- [ ] Shows activity type icons and color indicators
- [ ] Displays relative timestamps
- [ ] Load More button functions correctly
- [ ] Empty state displayed when no activities
- [ ] Component receives data from dashboard loader via props
- [ ] Fixed height with scroll for many activities
- [ ] TypeScript strict mode passes
- [ ] All validation commands pass

---
*Plan generated by initiative-planning agent*
*Skills used: frontend-design*
*Research conducted: no*
