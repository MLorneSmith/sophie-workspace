# Feature Plan: Recent Activity Feed Widget

**Issue**: #1273
**Parent**: #1268
**Research Manifest**: #1267
**Phase**: 3 (Activity & Actions)
**Effort**: L (Large)
**Dependencies**: #1269 (Dashboard Layout)
**Status**: Ready for Implementation

---

## Overview

Create a widget displaying recent user activity aggregated from multiple tables. This is the most complex widget due to multi-table aggregation. Data sources include: lesson_progress, quiz_attempts, tasks, building_blocks_submissions, and survey_responses. Requires a database view or RPC function for efficient aggregation.

## Solution Approach

### Database View Strategy

Create a database view that aggregates activity from multiple tables:

```sql
-- apps/web/supabase/schemas/XX-activity-feed.sql
CREATE VIEW user_activity_feed AS
SELECT
  'lesson' AS activity_type,
  lp.id,
  lp.user_id,
  lp.created_at,
  'Completed lesson: ' || l.title AS description,
  'lesson' AS icon_type
FROM lesson_progress lp
JOIN lessons l ON lp.lesson_id = l.id
WHERE lp.completed_at IS NOT NULL

UNION ALL

SELECT
  'quiz' AS activity_type,
  qa.id,
  qa.user_id,
  qa.created_at,
  'Completed quiz with score: ' || qa.score || '%' AS description,
  'quiz' AS icon_type
FROM quiz_attempts qa
WHERE qa.completed_at IS NOT NULL

UNION ALL

SELECT
  'task' AS activity_type,
  t.id,
  t.user_id,
  t.created_at,
  'Completed task: ' || t.title AS description,
  'task' AS icon_type
FROM tasks t
WHERE t.status = 'Done'

UNION ALL

SELECT
  'presentation' AS activity_type,
  bs.id,
  bs.user_id,
  bs.created_at,
  'Created presentation: ' || bs.title AS description,
  'presentation' AS icon_type
FROM building_blocks_submissions bs

UNION ALL

SELECT
  'assessment' AS activity_type,
  sr.id,
  sr.user_id,
  sr.created_at,
  'Completed assessment' AS description,
  'assessment' AS icon_type
FROM survey_responses sr;

-- Add RLS policy for user_activity_feed view
ALTER TABLE user_activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_activity_feed_select ON user_activity_feed
  FOR SELECT
  USING (user_id = auth.uid());
```

### Widget Component (Server Component)

```tsx
// apps/web/app/home/(user)/_components/widgets/recent-activity-widget.tsx
import 'server-only';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { ActivityItem } from './activity-item';

interface RecentActivityWidgetProps {
  userId: string;
}

export async function RecentActivityWidget({ userId }: RecentActivityWidgetProps) {
  const client = getSupabaseServerClient();

  // Fetch recent activities (last 5-8 items)
  const { data: activities, error } = await client
    .from('user_activity_feed')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(8);

  if (error || !activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No activity yet. Start learning to see your progress here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          {activities.length} recent items
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              isLast={index === activities.length - 1}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Activity Item Component (Client Component)

```tsx
// apps/web/app/home/(user)/_components/widgets/activity-item.tsx
'use client';

import { formatDistanceToNow } from 'date-fns';
import { BookOpen, CheckCircle2, Zap, Presentation, BarChart3, CheckSquare2 } from 'lucide-react';
import { cn } from '@kit/ui/cn';

interface ActivityItemProps {
  activity: {
    activity_type: string;
    description: string;
    created_at: string;
    icon_type: string;
  };
  isLast?: boolean;
}

const ACTIVITY_ICONS = {
  lesson: BookOpen,
  quiz: Zap,
  task: CheckSquare2,
  presentation: Presentation,
  assessment: BarChart3,
};

const ACTIVITY_COLORS = {
  lesson: 'text-blue-500',
  quiz: 'text-yellow-500',
  task: 'text-green-500',
  presentation: 'text-purple-500',
  assessment: 'text-orange-500',
};

export function ActivityItem({ activity, isLast = false }: ActivityItemProps) {
  const IconComponent = ACTIVITY_ICONS[activity.activity_type as keyof typeof ACTIVITY_ICONS] || CheckCircle2;
  const iconColor = ACTIVITY_COLORS[activity.activity_type as keyof typeof ACTIVITY_COLORS] || 'text-muted-foreground';

  const timeAgo = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true });

  return (
    <div className="flex items-start gap-3">
      {/* Timeline */}
      <div className="flex flex-col items-center">
        <div className={cn('p-2 rounded-full bg-muted', iconColor)}>
          <IconComponent className="w-4 h-4" />
        </div>
        {!isLast && <div className="w-0.5 h-8 bg-border mt-1" />}
      </div>

      {/* Content */}
      <div className="flex-1 pt-0.5">
        <p className="text-sm text-foreground">{activity.description}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{timeAgo}</p>
      </div>
    </div>
  );
}
```

## Research Applied

### From Manifest
- **Activity Feed Data Sources**: lesson_progress, quiz_attempts, tasks, building_blocks_submissions, survey_responses
- **Database View Pattern**: Union query across multiple tables for efficient aggregation
- **RLS Enforcement**: View with RLS policy protecting user data
- **Limit for Performance**: Fetch last 8 items (configurable)
- **Activity Types**: Map different event types to icons and colors

### From Frontend Design Skill
- **shadcn/ui Integration**: Card, CardHeader, CardTitle, CardContent from @kit/ui
- **Icon System**: Use lucide-react icons for visual representation
- **Timeline Layout**: Vertical timeline with icons and connecting lines
- **Color Coding**: Different colors for different activity types
- **Time Display**: Use date-fns to show relative time ("2 hours ago")
- **Spacing**: Consistent gap-3 between timeline items

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `apps/web/supabase/schemas/XX-activity-feed.sql` | Database view for aggregating activity from multiple tables |
| `apps/web/app/home/(user)/_components/widgets/recent-activity-widget.tsx` | Server component that fetches aggregated activities |
| `apps/web/app/home/(user)/_components/widgets/activity-item.tsx` | Client component that renders individual activity item |

## Implementation Tasks

### Task 1: Create Database View
- [ ] Create `apps/web/supabase/schemas/XX-activity-feed.sql` file
- [ ] Use `CREATE VIEW user_activity_feed AS` with UNION queries
- [ ] Aggregate from lesson_progress table (completed lessons)
- [ ] Aggregate from quiz_attempts table (completed quizzes with scores)
- [ ] Aggregate from tasks table (completed tasks)
- [ ] Aggregate from building_blocks_submissions table (created presentations)
- [ ] Aggregate from survey_responses table (completed assessments)
- [ ] Select columns: activity_type, id, user_id, created_at, description, icon_type
- [ ] Enable RLS on view with `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- [ ] Create SELECT policy for user to read their own activities
- [ ] Test view in Supabase console

### Task 2: Create Recent Activity Widget (Server Component)
- [ ] Create file with `'use server'` directive
- [ ] Accept `userId` prop
- [ ] Query `user_activity_feed` view using Supabase server client
- [ ] Filter by `user_id` with `.eq('user_id', userId)`
- [ ] Order by `created_at` descending to get newest first
- [ ] Limit to 8 items for performance
- [ ] Handle error and empty cases with appropriate message
- [ ] Render Card with title and activity count
- [ ] Render array of ActivityItem components
- [ ] Pass `isLast` prop to last item for timeline styling
- [ ] Add `data-testid="recent-activity-widget"` for E2E tests

### Task 3: Create Activity Item Component
- [ ] Create file with `'use client'` directive
- [ ] Accept `activity` and `isLast` props
- [ ] Define icon mapping (lesson -> BookOpen, quiz -> Zap, etc.)
- [ ] Define color mapping for each activity type
- [ ] Map activity_type to appropriate icon
- [ ] Use `formatDistanceToNow()` from date-fns for time display
- [ ] Render timeline dot with icon
- [ ] Render connecting line between items (not on last item)
- [ ] Render description and relative time
- [ ] Test with different activity types

### Task 4: Database Migrations
- [ ] Run migration to create view: `pnpm --filter web supabase:db:diff -f activity-feed`
- [ ] Apply migration: `pnpm --filter web supabase migration up`
- [ ] Generate types: `pnpm supabase:web:typegen`
- [ ] Verify view exists and is queryable
- [ ] Test RLS policy restricts data correctly

### Task 5: Test Data Preparation
- [ ] Create test data in each source table (lesson_progress, quiz_attempts, etc.)
- [ ] Verify view aggregates all activity types correctly
- [ ] Test with different time ranges (today, last week, older)
- [ ] Test performance with 50+ activity items
- [ ] Verify sorting is correct (newest first)

### Task 6: Component Integration
- [ ] Test ActivityItem renders with each icon type
- [ ] Test timeline line renders correctly
- [ ] Test time display format is readable
- [ ] Test colors display correctly in light and dark mode
- [ ] Test widget responsiveness on mobile/tablet/desktop

## Validation Commands

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint:fix

# Build
pnpm build

# Database operations
pnpm --filter web supabase:db:diff -f activity-feed
pnpm --filter web supabase migration up
pnpm supabase:web:typegen

# Local testing
pnpm dev
# Navigate to /home
# Verify "Recent Activity" widget displays
# Verify activity items show with correct icons
# Verify timeline visualization is correct
# Verify relative time displays properly
# Check all activity types render
```

## Acceptance Criteria

- [ ] Database view aggregates activity from all 5 sources
- [ ] View uses RLS to protect user data
- [ ] Widget fetches recent activities correctly
- [ ] Displays up to 8 most recent activities
- [ ] Activities ordered by created_at descending (newest first)
- [ ] Timeline layout displays with icons and connecting lines
- [ ] Activity descriptions are clear and informative
- [ ] Relative time display works correctly (e.g., "2 hours ago")
- [ ] Different activity types have different icons and colors
- [ ] Empty state displays for users with no activity
- [ ] Dark mode colors work correctly
- [ ] TypeScript passes with no errors
- [ ] Card styling matches other widgets
- [ ] Performance acceptable with 50+ activities
- [ ] E2E test can select widget by data-testid

---

*Plan generated by initiative-planning agent*
*Skills used: frontend-design*
*Research conducted: No - manifest provided data sources and aggregation pattern*
