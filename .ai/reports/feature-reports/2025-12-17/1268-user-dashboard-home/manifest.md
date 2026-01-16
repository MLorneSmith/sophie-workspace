# Research Manifest: User Dashboard Home

## Quick Reference
| Field | Value |
|-------|-------|
| **Initiative** | Create a user dashboard at /home with 7 components: Course progress radial graph, Spider diagram from self assessment, Kanban Summary Card, Recent Activity Feed, Quick Actions Panel, Coaching Sessions booking, and Presentation outline table |
| **Mode** | full |
| **Technologies** | Shadcn/ui, Recharts (RadarChart, RadialBarChart), React Server Components, Supabase |
| **Research Date** | 2025-12-17 |
| **GitHub Issue** | #pending |
| **Status** | active |

## Interview Summary
- **Technologies**: Use existing stack - Shadcn/ui, Recharts for charts, custom components for Kanban
- **Clarification**: Page load only data fetching - Server components fetch data on navigation
- **Expected Size**: Medium (4-7 features)

## Research Reports
- [Context7: Recharts Documentation](./research/context7-recharts.md)
- [Context7: shadcn/ui Charts](./research/context7-shadcn-ui.md)
- [Perplexity: Dashboard Best Practices](./research/perplexity-dashboard-patterns.md)
- [Codebase Patterns](./research/explore-codebase-patterns.md)

## Key Findings Summary

### Technology Overview
- **Recharts** is already integrated via `@kit/ui/chart` with ChartContainer, ChartConfig, ChartTooltip wrappers
- **RadarChart** pattern exists at `assessment/survey/_components/radar-chart.tsx` - can be reused for spider diagram
- **RadialProgress** custom SVG component exists at `course/_components/RadialProgress.tsx` - can be enhanced
- **React Server Components** should be used for data fetching, wrapped in Suspense for progressive loading
- **Parallel data fetching** with `Promise.all()` recommended for multiple widgets

### Recommended Patterns

#### 1. Page Structure Pattern
```tsx
// apps/web/app/home/(user)/page.tsx
import { Suspense } from 'react';
import { requireUser } from '@kit/supabase/require-user';

export default async function UserHomePage() {
  const client = getSupabaseServerClient();
  const auth = await requireUser(client);
  if (auth.error) redirect(auth.redirectTo);

  return (
    <>
      <HomeLayoutPageHeader title="Dashboard" />
      <PageBody>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Suspense fallback={<WidgetSkeleton />}>
            <CourseProgressWidget userId={auth.data.id} />
          </Suspense>
          {/* ... more widgets */}
        </div>
      </PageBody>
    </>
  );
}
```

#### 2. Widget Pattern (Server Component)
```tsx
// apps/web/app/home/(user)/_components/widgets/course-progress-widget.tsx
import 'server-only';

export async function CourseProgressWidget({ userId }: { userId: string }) {
  const client = getSupabaseServerClient();
  const { data } = await client
    .from('course_progress')
    .select('*')
    .eq('user_id', userId)
    .single();

  return (
    <Card>
      <CardHeader><CardTitle>Course Progress</CardTitle></CardHeader>
      <CardContent>
        <RadialProgressChart progress={data?.completion_percentage ?? 0} />
      </CardContent>
    </Card>
  );
}
```

#### 3. Chart Integration Pattern
```tsx
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@kit/ui/chart";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

const chartConfig = {
  progress: {
    label: "Progress",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;
```

### Code Examples

#### Radial Progress Chart (Course Progress)
```tsx
// Enhanced version using Recharts RadialBarChart
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { ChartContainer } from "@kit/ui/chart";

function CourseProgressChart({ percentage }: { percentage: number }) {
  const data = [{ value: percentage, fill: "var(--color-progress)" }];

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[200px]">
      <RadialBarChart
        cx="50%"
        cy="50%"
        innerRadius="70%"
        outerRadius="100%"
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar background clockWise dataKey="value" cornerRadius={10} />
      </RadialBarChart>
    </ChartContainer>
  );
}
```

#### Spider Diagram (Reuse existing)
```tsx
// Import from existing implementation
import { RadarChart } from "../assessment/survey/_components/radar-chart";

// Usage in dashboard widget
<RadarChart categoryScores={surveyResponse.category_scores} />
```

### Gotchas & Warnings

1. **RLS Performance**: Use subquery pattern `(select auth.uid())` instead of direct `auth.uid()` calls
2. **Empty States**: All widgets must handle null/empty data gracefully (existing components do this)
3. **Suspense Boundaries**: Each widget needs its own Suspense boundary for independent loading
4. **Chart Responsiveness**: Always wrap charts in `ResponsiveContainer` or use ChartContainer with proper sizing
5. **Cal.com iframe**: Coaching widget should use existing Calendar component - it's an iframe, not data-driven
6. **Type Safety**: Use Database types from `~/lib/database.types` for all Supabase queries

### Existing Codebase Patterns

| Pattern | Location | Relevance |
|---------|----------|-----------|
| Radar Chart | `assessment/survey/_components/radar-chart.tsx` | HIGH - Exact pattern for spider diagram widget |
| Radial Progress | `course/_components/RadialProgress.tsx` | HIGH - Base for course progress widget |
| Course Dashboard | `course/_components/CourseDashboardClient.tsx` | HIGH - Data loading and state management |
| Kanban Board | `kanban/_components/kanban-board.tsx` | HIGH - Task counts for summary widget |
| Task Hooks | `kanban/_lib/hooks/use-tasks.ts` | MEDIUM - React Query pattern if needed |
| Workspace Loader | `[account]/_lib/server/team-account-workspace.loader.ts` | MEDIUM - Cached loader pattern |
| Calendar | `coaching/_components/calendar.tsx` | HIGH - Exact component for coaching widget |
| Survey Summary | `assessment/survey/_components/survey-summary.tsx` | MEDIUM - Assessment display patterns |
| Chart Component | `packages/ui/src/shadcn/chart.tsx` | HIGH - Base chart infrastructure |

## Component Mapping

| Dashboard Component | Data Source | Existing Pattern | Complexity |
|---------------------|-------------|------------------|------------|
| Course Progress Radial | `course_progress` table | `RadialProgress.tsx` + enhance with RadialBarChart | MEDIUM |
| Spider Diagram | `survey_responses.category_scores` | `radar-chart.tsx` (reuse directly) | LOW |
| Kanban Summary Card | `tasks` table (aggregate counts) | `kanban-board.tsx` (extract summary) | MEDIUM |
| Recent Activity Feed | New - aggregate from multiple tables | New component | HIGH |
| Quick Actions Panel | Static + navigation | New component | LOW |
| Coaching Sessions | Cal.com iframe | `calendar.tsx` (embed mini version) | LOW |
| Presentation Table | `building_blocks_submissions` table | New component | MEDIUM |

## Feature Mapping
*Will be populated after decomposition*

## Recommended Skills

Based on initiative requirements:

| Feature Type | Recommended Skills | Relevance |
|-------------|-------------------|-----------|
| UI/Dashboard | `frontend-design` | HIGH - For all dashboard widgets |
| Data Viz | `canvas-design` | MEDIUM - For static visualizations |
| Testing | `webapp-testing` | HIGH - For widget testing |

## Dependencies & Prerequisites

### Technical Prerequisites
- [ ] Existing `@kit/ui/chart` components are working
- [ ] Recharts dependency installed (verified: yes)
- [ ] Database tables exist (course_progress, survey_responses, tasks, building_blocks_submissions)

### Data Requirements
- Course progress: `course_progress` table with `completion_percentage`
- Assessment scores: `survey_responses` table with `category_scores` JSONB
- Kanban tasks: `tasks` table with `status` enum (do, doing, done)
- Presentations: `building_blocks_submissions` table
- Coaching: Cal.com embed (no data needed)

### New Components Needed
1. `CourseProgressWidget` - Server component with RadialBarChart
2. `AssessmentSpiderWidget` - Server component wrapping existing RadarChart
3. `KanbanSummaryWidget` - Server component with task counts
4. `RecentActivityWidget` - Server component with aggregated activity
5. `QuickActionsPanel` - Client component with navigation buttons
6. `CoachingWidget` - Mini Cal.com embed card
7. `PresentationTableWidget` - Server component with table

### Activity Feed Data Source Options
Activity feed will need to aggregate from:
- `lesson_progress` - lesson completions
- `quiz_attempts` - quiz completions
- `tasks` - task status changes
- `building_blocks_submissions` - presentation creations/updates
- `survey_responses` - assessment completions

Consider creating a database view or RPC function for efficient aggregation.

## Security Considerations

1. All queries use RLS-protected tables - user can only see their own data
2. Use `requireUser()` to verify authentication before data fetching
3. No admin client needed - standard Supabase client with RLS is sufficient
4. Cal.com embed is public (user's own calendar link)

## Performance Considerations

1. **Parallel Data Fetching**: Use `Promise.all()` or independent Suspense boundaries
2. **Suspense Streaming**: Each widget loads independently - fast widgets appear first
3. **Database Indexes**: Existing indexes on `user_id` columns are sufficient
4. **Activity Feed**: May need pagination or limit for performance
5. **Skeleton Loading**: Each widget should have a skeleton fallback

## Implementation Order Recommendation

1. **Phase 1 - Quick Wins** (reuse existing):
   - Quick Actions Panel (static)
   - Coaching Widget (existing iframe)
   - Spider Diagram (existing component)

2. **Phase 2 - Medium Effort**:
   - Course Progress Radial (enhance existing)
   - Kanban Summary Card (aggregate from existing)
   - Presentation Table (simple CRUD)

3. **Phase 3 - Higher Effort**:
   - Recent Activity Feed (new aggregation logic)
