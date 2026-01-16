# Research Manifest: User Dashboard Home

## Quick Reference
| Field | Value |
|-------|-------|
| **Initiative** | Create a user dashboard at /home with 7 main components: Course progress radial graph, Spider diagram from self assessment, Kanban Summary Card, Recent Activity Feed, Quick Actions Panel, Coaching Sessions Card, and Presentations Table |
| **Mode** | full |
| **Technologies** | shadcn/ui, Recharts, React Query, Supabase, Next.js 15 Server Components |
| **Research Date** | 2025-12-18 |
| **GitHub Issue** | #pending |
| **Status** | active |

## Interview Summary
- **Technologies**: shadcn/ui components with Recharts for charts
- **Clarification**: Kanban tasks from apps/web/app/home/(user)/kanban task cards status
- **Expected Size**: Medium (4-7 features)

## Research Reports
- [Perplexity Research](./research/perplexity-user-dashboard-home.md)
- [Context7 Documentation](./research/context7-user-dashboard-home.md)
- [Codebase Patterns](./research/explore-user-dashboard-home.md)

## Key Findings Summary

### Technology Overview

The dashboard should follow Next.js 15's RSC (React Server Components) paradigm:
- **Server Components** for the page shell, layout, and data fetching
- **Client Components** only for interactive charts (Recharts) and real-time updates
- **Parallel data fetching** with `Promise.all` in a dashboard loader
- **Suspense boundaries** for independent widget loading
- Reuse existing `RadialProgress`, `RadarChart`, and `useTasks` patterns from codebase

### Recommended Patterns

| Pattern | Implementation |
|---------|---------------|
| Data Loading | Server-side loader with `Promise.all` parallel fetching |
| Charts | Client components wrapping Recharts with shadcn ChartContainer |
| Radial Progress | Reuse existing `RadialProgress` component or Recharts RadialBarChart |
| Spider Diagram | Reuse existing `RadarChart` from assessment survey |
| Task Summary | Query task counts grouped by status |
| Activity Feed | Server component with client-side "Load More" pagination |
| Presentations Table | shadcn Table component with server data |
| Quick Actions | Simple buttons linking to key routes |

### Code Examples

#### Dashboard Loader Pattern
```typescript
// apps/web/app/home/(user)/_lib/server/dashboard.loader.ts
import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/lib/database.types';

export async function loadDashboardData(
  client: SupabaseClient<Database>,
  userId: string
) {
  const [courseProgress, surveyScores, taskCounts, presentations] = await Promise.all([
    loadCourseProgress(client, userId),
    loadSurveyScores(client, userId),
    loadTaskCounts(client, userId),
    loadPresentations(client, userId),
  ]);

  return { courseProgress, surveyScores, taskCounts, presentations };
}

async function loadTaskCounts(client: SupabaseClient<Database>, userId: string) {
  const { data, error } = await client
    .from('tasks')
    .select('status')
    .eq('account_id', userId);

  if (error) throw error;

  const counts = { do: 0, doing: 0, done: 0 };
  for (const task of data ?? []) {
    counts[task.status as keyof typeof counts]++;
  }
  return counts;
}
```

#### Radial Chart Card Pattern
```tsx
// apps/web/app/home/(user)/_components/course-progress-card.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { RadialProgress } from '../course/_components/RadialProgress';

interface CourseProgressCardProps {
  percentage: number;
  completedLessons: number;
  totalLessons: number;
}

export function CourseProgressCard({
  percentage,
  completedLessons,
  totalLessons
}: CourseProgressCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Progress</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <RadialProgress value={percentage} size={120} strokeWidth={12} />
        <p className="mt-4 text-sm text-muted-foreground">
          {completedLessons} of {totalLessons} lessons completed
        </p>
      </CardContent>
    </Card>
  );
}
```

#### Spider Diagram Card
```tsx
// apps/web/app/home/(user)/_components/assessment-spider-card.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@kit/ui/chart';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts';

interface AssessmentSpiderCardProps {
  categoryScores: Record<string, number>;
}

const chartConfig: ChartConfig = {
  score: { label: 'Score', color: 'hsl(var(--chart-1))' },
};

export function AssessmentSpiderCard({ categoryScores }: AssessmentSpiderCardProps) {
  const data = Object.entries(categoryScores).map(([category, score]) => ({
    category,
    score,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills Assessment</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <RadarChart data={data}>
            <ChartTooltip content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="category" />
            <PolarGrid />
            <Radar dataKey="score" fill="var(--color-score)" fillOpacity={0.6} />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```

### Gotchas and Warnings

| Severity | Issue | Solution |
|----------|-------|----------|
| HIGH | Recharts requires client components | Wrap charts in 'use client' components, pass data from server parent |
| HIGH | N+1 queries on dashboard load | Use `Promise.all` for parallel fetching, aggregate counts server-side |
| MEDIUM | Layout jank during loading | Use fixed-height skeleton loaders for each card |
| MEDIUM | Heavy bundle from charts | Consider dynamic imports for rarely-viewed charts |
| MEDIUM | Empty states when no data | Handle empty `survey_responses`, zero tasks, no presentations |
| LOW | Date formatting inconsistency | Use consistent date formatting via i18n or date-fns |
| LOW | Activity feed infinite scroll | Start with simple "Load More" button, not infinite scroll |

### Existing Codebase Patterns

| Pattern | Location | Relevance |
|---------|----------|-----------|
| RadialProgress component | `apps/web/app/home/(user)/course/_components/RadialProgress.tsx` | HIGH - Reuse directly for course progress |
| RadarChart component | `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx` | HIGH - Reuse pattern for spider diagram |
| useTasks hook | `apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.ts` | HIGH - Query pattern for task data |
| Task schema | `apps/web/app/home/(user)/kanban/_lib/schema/task.schema.ts` | HIGH - Task type definitions |
| useSurveyScores hook | `apps/web/app/home/(user)/assessment/_lib/client/hooks/use-survey-scores.ts` | HIGH - Survey data fetching |
| Dashboard demo charts | `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx` | MEDIUM - Chart card patterns |
| CourseDashboardClient | `apps/web/app/home/(user)/course/_components/CourseDashboardClient.tsx` | MEDIUM - Course data fetching |
| Cal.com calendar | `apps/web/app/home/(user)/coaching/_components/calendar.tsx` | LOW - Coaching integration pattern |
| HomeLayoutPageHeader | `apps/web/app/home/(user)/_components/home-page-header.tsx` | MEDIUM - Page header pattern |

## Feature Mapping

| Component | Data Source | Component Type | Priority |
|-----------|-------------|----------------|----------|
| Dashboard Data Loader | Multiple tables | Server | P0 |
| Course Progress Card | `course_progress`, `lesson_progress` | Client (chart) | P1 |
| Assessment Spider Card | `survey_responses.category_scores` | Client (chart) | P1 |
| Kanban Summary Card | `tasks` (count by status) | Server | P1 |
| Recent Activity Feed | TBD - may need new table | Server + Client | P2 |
| Quick Actions Panel | Static links | Server | P2 |
| Coaching Sessions Card | Cal.com API or static | Server/Client | P2 |
| Presentations Table | `building_blocks_submissions` | Server | P2 |
| Dashboard Integration | `page.tsx` update | Server | P0 |

## Recommended Skills

Based on initiative requirements, suggest relevant Claude Code skills:

| Feature Type | Recommended Skills | Relevance |
|-------------|-------------------|-----------|
| UI/Dashboard | `frontend-design` | HIGH - For dashboard UI components |
| Data Viz | `canvas-design` | MEDIUM - For chart components |
| Testing | `webapp-testing` | HIGH - For component testing |

**Skill Triggers**:
- Dashboard/UI components: suggest `frontend-design`
- Chart/visualization: suggest `canvas-design`
- Testing: suggest `webapp-testing`

## Dependencies and Prerequisites

### Required Before Implementation

1. **Verify survey_responses data** - Check if users have completed assessments
2. **Verify course_progress tracking** - Ensure course completion is tracked
3. **Determine activity feed source** - May need new database table for activities
4. **Coaching API integration** - Decide on Cal.com API vs. static link

### Database Tables Used

| Table | Usage | RLS |
|-------|-------|-----|
| `tasks` | Kanban summary counts | Yes - by account_id |
| `subtasks` | Task subtask counts | Yes - via tasks FK |
| `survey_responses` | Spider diagram data | Yes - by user_id |
| `course_progress` | Course completion % | Yes - by user_id |
| `lesson_progress` | Lessons completed count | Yes - by user_id |
| `building_blocks_submissions` | Presentations table | Yes - by user_id |

### New Components Needed

1. `CourseProgressCard` - Radial chart for course progress
2. `AssessmentSpiderCard` - Radar chart for assessment scores
3. `KanbanSummaryCard` - Task counts by status
4. `RecentActivityFeed` - Activity list (may need new data source)
5. `QuickActionsPanel` - CTA buttons
6. `CoachingSessionsCard` - Next session or booking CTA
7. `PresentationsTable` - Data table for presentations
8. `DashboardGrid` - Layout component for card arrangement

## Security Considerations

- All data queries use RLS-protected Supabase client
- No admin client needed - standard user queries only
- Validate user ownership through RLS policies
- No sensitive data exposed to client components

## Performance Considerations

1. **Parallel Data Fetching**: Use `Promise.all` for all dashboard data
2. **Suspense Boundaries**: Wrap each card in Suspense for independent loading
3. **Server Components**: Keep non-chart cards as server components
4. **Skeleton Loaders**: Fixed-height skeletons prevent layout shift
5. **Query Optimization**: Use aggregates (COUNT) instead of fetching all records
6. **Caching Strategy**: Consider `revalidate` for dashboard data (30-60 seconds)

## Implementation Order

1. **P0: Infrastructure**
   - Create dashboard loader with parallel fetching
   - Update page.tsx to use loader

2. **P1: Core Widgets**
   - Course Progress Card (reuse RadialProgress)
   - Assessment Spider Card (reuse RadarChart pattern)
   - Kanban Summary Card
   - Dashboard Integration

3. **P2: Secondary Widgets**
   - Recent Activity Feed
   - Quick Actions Panel
   - Coaching Sessions Card
   - Presentations Table
