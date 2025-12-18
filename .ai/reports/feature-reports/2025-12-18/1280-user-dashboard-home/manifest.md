# Research Manifest: User Dashboard Home

## Quick Reference

| Field | Value |
|-------|-------|
| **Initiative** | Create a user dashboard at /home with 7 components: course progress radial graph, spider diagram from self-assessment survey, kanban summary card, recent activity feed, quick actions panel, coaching sessions booking, and presentation outline table |
| **Mode** | full |
| **Technologies** | shadcn/ui charts (Recharts), Supabase, React Query, Next.js 15 Server Components |
| **Research Date** | 2025-12-18 |
| **GitHub Issue** | #pending - updated by orchestrator |
| **Status** | active |

## Interview Summary

- **Technologies**: shadcn/ui charts (Recharts), existing Supabase tables for data
- **Clarification**: Use existing database schema for courses, quizzes, presentations, activities
- **Expected Size**: Medium (4-7 features)

## Research Reports

- [Perplexity Research](./research/perplexity-user-dashboard-home.md)
- [Context7 Documentation](./research/context7-user-dashboard-home.md)
- [Codebase Patterns](./research/explore-user-dashboard-home.md)

## Key Findings Summary

### Technology Overview

- **shadcn/ui Charts**: Provides `ChartContainer`, `ChartConfig`, `ChartTooltip`, and `ChartLegend` components that wrap Recharts with consistent theming
- **Recharts**: Core charting library supporting `RadarChart` (spider diagram), `RadialBarChart` (progress), `AreaChart`, `BarChart`, and `LineChart`
- **Data Sources**: All required tables exist in Supabase - `course_progress`, `survey_responses`, `tasks`, `building_blocks_submissions`
- **Pattern**: The codebase already has a working `RadarChart` component in the assessment survey section that can be adapted

### Recommended Patterns

1. **Grid Layout Pattern**: Use CSS Grid with responsive column spanning
   - Row 1: 3 cards (`grid-cols-1 md:grid-cols-3`)
   - Row 2: 3 cards (`grid-cols-1 md:grid-cols-3`)
   - Row 3: Full-width table (`col-span-full`)

2. **Data Loader Pattern**: Server-side parallel fetching with `Promise.all()`
   ```typescript
   // app/home/(user)/_lib/server/dashboard.loader.ts
   export async function loadDashboardData(client: SupabaseClient<Database>, userId: string) {
     return Promise.all([
       loadCourseProgress(client, userId),
       loadSurveyScores(client, userId),
       loadKanbanSummary(client, userId),
       loadRecentActivity(client, userId),
       loadPresentations(client, userId),
     ]);
   }
   ```

3. **Chart Configuration Pattern**: Use `ChartConfig` with CSS variables
   ```typescript
   const chartConfig = {
     progress: {
       label: "Progress",
       color: "var(--chart-1)",
     },
   } satisfies ChartConfig;
   ```

4. **Component Composition**: Card-based widgets with header, content, footer

### Code Examples

**Existing Radar Chart (can be reused for Spider Diagram):**

```tsx
// apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@kit/ui/chart";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart as RechartsRadarChart } from "recharts";

export function RadarChart({ categoryScores = {} }) {
  const chartData = Object.entries(categoryScores).map(([category, score]) => ({
    category,
    score,
  }));

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
      <RechartsRadarChart data={chartData}>
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <PolarAngleAxis dataKey="category" />
        <PolarGrid />
        <Radar dataKey="score" fill="var(--color-score)" fillOpacity={0.6} />
      </RechartsRadarChart>
    </ChartContainer>
  );
}
```

**Radial Progress Pattern (from Recharts docs):**

```tsx
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

const progressData = [
  { name: "Progress", value: completion_percentage, fill: "var(--chart-1)" },
];

<RadialBarChart
  cx="50%"
  cy="50%"
  innerRadius="60%"
  outerRadius="100%"
  data={progressData}
  startAngle={90}
  endAngle={-270}
>
  <RadialBar background dataKey="value" cornerRadius={10} />
</RadialBarChart>
```

### Gotchas & Warnings

| Severity | Issue | Solution |
|----------|-------|----------|
| HIGH | RadialBarChart needs specific startAngle/endAngle for progress display | Use `startAngle={90} endAngle={-270}` for clockwise progress from top |
| HIGH | Chart components must be client-side ("use client") | Keep data fetching in server components, pass data to client chart components |
| MEDIUM | CSS variables require ChartContainer wrapper | Always wrap Recharts components with `ChartContainer` |
| MEDIUM | Empty data states not handled by default | Add conditional rendering for empty/loading states in each widget |
| LOW | Responsive charts need ResponsiveContainer | Already handled by ChartContainer in shadcn/ui |
| LOW | Large data arrays can cause re-renders | Use `useMemo` for chart data transformations |

### Existing Codebase Patterns

| Pattern | Location | Relevance |
|---------|----------|-----------|
| RadarChart component | `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx` | HIGH - Direct reuse for spider diagram |
| Dashboard demo charts | `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx` | HIGH - Card composition, chart patterns |
| Data loader pattern | `apps/web/app/home/[account]/members/_lib/server/members-page.loader.ts` | HIGH - Parallel data fetching pattern |
| Kanban board hooks | `apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.ts` | HIGH - Task data hooks for summary |
| Page structure | `apps/web/app/home/(user)/page.tsx` | HIGH - Target file to modify |
| Survey scores hook | `apps/web/app/home/(user)/assessment/_lib/client/hooks/use-survey-scores.ts` | MEDIUM - Survey data fetching |
| Coaching calendar | `apps/web/app/home/(user)/coaching/_components/calendar.tsx` | MEDIUM - Coaching booking pattern |
| shadcn/ui chart | `packages/ui/src/shadcn/chart.tsx` | HIGH - Core chart components |

## Database Tables Reference

| Table | Key Fields | Dashboard Component |
|-------|------------|---------------------|
| `course_progress` | `completion_percentage`, `started_at`, `completed_at` | Course Progress Radial |
| `lesson_progress` | `completed_at`, `course_id` | Recent Activity Feed |
| `quiz_attempts` | `score`, `passed`, `completed_at` | Recent Activity Feed |
| `survey_responses` | `category_scores` (JSONB), `highest_scoring_category` | Spider Diagram |
| `tasks` | `status`, `priority`, `title` | Kanban Summary Card |
| `building_blocks_submissions` | `title`, `outline`, `storyboard`, `created_at` | Presentation Table |

## Feature Mapping

| Component | Data Source | Chart Type | Priority |
|-----------|-------------|------------|----------|
| Course Progress Radial | `course_progress.completion_percentage` | RadialBarChart | P1 |
| Spider Diagram | `survey_responses.category_scores` | RadarChart | P1 |
| Kanban Summary Card | `tasks` aggregated by status | Text/Badge counts | P1 |
| Recent Activity Feed | `lesson_progress`, `quiz_attempts` union | List with timestamps | P2 |
| Quick Actions Panel | Static links | Button group | P2 |
| Coaching Sessions | External Cal.com embed | Embed component | P2 |
| Presentation Table | `building_blocks_submissions` | Table component | P1 |

## Recommended Skills

Based on initiative requirements, suggest relevant Claude Code skills:

| Feature Type | Recommended Skills | Relevance |
|-------------|-------------------|-----------|
| UI/Dashboard | `frontend-design` | HIGH - For dashboard UI components |
| Data Viz | `canvas-design` | MEDIUM - For static visualizations |
| Testing | `webapp-testing` | HIGH - For frontend debugging |

**Skill Triggers**:
- Dashboard, charts, components: `frontend-design`
- Visualization: `canvas-design`
- Integration testing: `webapp-testing`

## Implementation Recommendations

### Directory Structure

```
apps/web/app/home/(user)/
├── page.tsx                          # Modified to include dashboard
├── _components/
│   └── dashboard/
│       ├── index.tsx                 # Dashboard container
│       ├── course-progress-card.tsx  # Radial progress chart
│       ├── assessment-spider.tsx     # Radar chart for survey scores
│       ├── kanban-summary-card.tsx   # Task status counts
│       ├── recent-activity-feed.tsx  # Activity list
│       ├── quick-actions-panel.tsx   # Action buttons
│       ├── coaching-sessions.tsx     # Cal.com embed
│       └── presentations-table.tsx   # Table of presentations
└── _lib/
    └── server/
        └── dashboard.loader.ts       # Parallel data fetching
```

### Layout Grid

```tsx
<div className="grid gap-4 grid-cols-1 md:grid-cols-3">
  {/* Row 1 */}
  <CourseProgressCard progress={courseProgress} />
  <AssessmentSpiderCard scores={surveyScores} />
  <KanbanSummaryCard tasks={kanbanSummary} />

  {/* Row 2 */}
  <RecentActivityFeed activities={recentActivity} />
  <QuickActionsPanel />
  <CoachingSessionsCard />

  {/* Row 3 - Full width */}
  <div className="md:col-span-3">
    <PresentationsTable presentations={presentations} />
  </div>
</div>
```

## Dependencies & Prerequisites

1. **Database tables exist** - All required tables already exist in Supabase
2. **shadcn/ui chart component** - Already installed at `packages/ui/src/shadcn/chart.tsx`
3. **Recharts** - Already installed as dependency
4. **React Query** - Already configured in the application
5. **No new migrations required** - Using existing schema

## Security Considerations

- All tables have RLS policies enforcing `auth.uid() = user_id`
- Data loader uses standard Supabase client (RLS applies automatically)
- No admin client usage needed for this feature

## Performance Considerations

1. **Parallel Data Fetching**: Use `Promise.all()` in server component loader
2. **Client-side Charts**: Keep charts as client components, fetch data server-side
3. **Skeleton Loading**: Implement skeleton UI matching card dimensions
4. **Memoization**: Use `useMemo` for chart data transformations
5. **Suspense Boundaries**: Wrap each card in Suspense for streaming
