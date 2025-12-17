# Codebase Exploration: Dashboard Patterns

**Date**: 2025-12-17
**Focus**: Patterns for user dashboard at /home

## Existing Page Structure

### Current /home/(user)/page.tsx
Location: `apps/web/app/home/(user)/page.tsx`

Current implementation is minimal - just a header with empty body:
```tsx
function UserHomePage() {
  return (
    <>
      <HomeLayoutPageHeader
        title={<Trans i18nKey={"common:routes.home"} />}
        description={<Trans i18nKey={"common:homeTabDescription"} />}
      />
      <PageBody />
    </>
  );
}

export default withI18n(UserHomePage);
```

### Page Template Pattern
All pages in `apps/web/app/home/(user)/` follow this structure:
- `generateMetadata()` for SEO
- `withI18n()` wrapper for internationalization
- `HomeLayoutPageHeader` for consistent header
- `PageBody` for content

## Data Loading Patterns

### Server Component with Loader (Course Page)
Location: `apps/web/app/home/(user)/course/page.tsx`

Best example of server-side data loading:
```tsx
async function CoursePage() {
  const supabase = getSupabaseServerClient();
  const auth = await requireUser(supabase);

  if (auth.error) {
    redirect(auth.redirectTo);
  }

  const user = auth.data;

  // Parallel data fetching would be better here
  const { data: courseProgress } = await supabase
    .from("course_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("course_id", decksForDecisionMakersCourse.id)
    .maybeSingle();

  return (
    <CourseDashboardClient
      course={decksForDecisionMakersCourse}
      courseProgress={courseProgress || null}
      lessonProgress={lessonProgress || []}
      quizAttempts={quizAttempts || []}
      userId={user.id}
    />
  );
}
```

### Client-Side Data Fetching with React Query (Kanban)
Location: `apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.ts`

Pattern for client-side fetching:
```tsx
export function useTasks() {
  const client = useSupabase();
  const { user } = useUserWorkspace();

  return useQuery<Task[]>({
    queryKey: ["tasks", user.id],
    queryFn: async () => {
      const tasks = await getTasks(client, user.id);
      // Auto-seed if empty
      if (!tasks.length) {
        await seedDefaultTasksAction({});
        return getTasks(client, user.id);
      }
      return tasks;
    },
    staleTime: 60 * 1000,
    retry: false,
  });
}
```

### Loader Pattern (Team Workspace)
Location: `apps/web/app/home/[account]/_lib/server/team-account-workspace.loader.ts`

Cached server-side loader with parallel fetching:
```tsx
export const loadTeamWorkspace = cache(workspaceLoader);

async function workspaceLoader(accountSlug: string) {
  const client = getSupabaseServerClient();
  const api = createTeamAccountsApi(client);

  const [workspace, user] = await Promise.all([
    api.getAccountWorkspace(accountSlug),
    requireUserInServerComponent(),
  ]);

  return {
    ...workspace.data,
    user,
  };
}
```

## Existing Chart Components

### Radar Chart (Spider Diagram)
Location: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`

Exact pattern for spider diagram from self-assessment:
```tsx
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@kit/ui/chart";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart as RechartsRadarChart,
} from "recharts";

const chartConfig = {
  score: {
    label: "Score",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function RadarChart({ categoryScores = {} }) {
  const chartData = Object.entries(categoryScores).map(([category, score]) => ({
    category,
    score,
  }));

  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <CardTitle>Survey Results</CardTitle>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RechartsRadarChart data={chartData}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="category" />
            <PolarGrid />
            <Radar
              dataKey="score"
              fill="var(--color-score)"
              fillOpacity={0.6}
            />
          </RechartsRadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```

### Radial Progress
Location: `apps/web/app/home/(user)/course/_components/RadialProgress.tsx`

Custom SVG-based progress indicator:
```tsx
export function RadialProgress({ value, size = 40, strokeWidth = 4 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90 transform" width={size} height={size}>
        {/* Background circle */}
        <circle
          className="text-muted-foreground/20"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className="text-primary transition-all duration-300"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
        {Math.round(value)}%
      </div>
    </div>
  );
}
```

## Kanban Board Components

### Task Schema
Location: `apps/web/app/home/(user)/kanban/_lib/schema/task.schema.ts`

Key types for kanban:
```tsx
type TaskStatus = 'do' | 'doing' | 'done';
type TaskPriority = 'low' | 'medium' | 'high';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  phase?: string;
  subtasks?: Subtask[];
}
```

### Kanban Phases
Location: `apps/web/app/home/(user)/kanban/_lib/config/presentation-tasks.ts`

```tsx
export const PRESENTATION_PHASES: PresentationPhase[] = [
  { id: "phase-1-the-start", name: "The Start", taskCount: 4 },
  { id: "phase-2-storytelling", name: "The Art of Storytelling", taskCount: 3 },
  { id: "phase-3-design", name: "The Harmony of Design", taskCount: 2 },
  { id: "phase-4-persuasion", name: "The Science of Fact-based Persuasion", taskCount: 1 },
  { id: "phase-5-the-how", name: "The How", taskCount: 4 },
];
```

## Database Tables

### Course Progress
```sql
CREATE TABLE course_progress (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id TEXT NOT NULL,
  completion_percentage NUMERIC DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  current_lesson_id TEXT
);
```

### Survey Responses
```sql
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  survey_id TEXT NOT NULL,
  category_scores JSONB DEFAULT '{}'::jsonb,
  highest_scoring_category TEXT,
  lowest_scoring_category TEXT,
  completed BOOLEAN DEFAULT false
);
```

### Tasks (Kanban)
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'do',
  priority task_priority NOT NULL DEFAULT 'medium',
  phase TEXT,
  account_id UUID NOT NULL
);
```

### Building Blocks Submissions (Presentations)
```sql
CREATE TABLE building_blocks_submissions (
  id UUID PRIMARY KEY,
  user_id UUID,
  title VARCHAR NOT NULL,
  audience TEXT,
  presentation_type VARCHAR,
  outline TEXT,
  storyboard JSONB
);
```

## Coaching Calendar
Location: `apps/web/app/home/(user)/coaching/_components/calendar.tsx`

Simple Cal.com iframe embed:
```tsx
export default function Calendar() {
  return (
    <iframe
      title="SlideHeroes Coaching Calendar"
      src="https://cal.com/slideheroes.com/60min?embed=true&layout=month_view"
      style={{
        width: "100%",
        height: "100%",
        minHeight: "600px",
        border: "none",
      }}
    />
  );
}
```

## UI Component Patterns

### Card Layout
Standard pattern across all pages:
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Widget Title</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Widget content */}
  </CardContent>
</Card>
```

### Loading States
Skeleton pattern from Kanban:
```tsx
<div className="grid h-full grid-cols-1 gap-4 md:grid-cols-3">
  {COLUMNS.map((column) => (
    <div key={column.id} className="flex h-full flex-col space-y-4">
      <div className="bg-muted/40 h-6 w-20 animate-pulse rounded" />
      <div className="bg-muted/40 flex-1 animate-pulse rounded-lg p-4">
        <div className="space-y-4">
          <div className="bg-background/40 h-24 animate-pulse rounded-lg" />
        </div>
      </div>
    </div>
  ))}
</div>
```

## Summary: Relevant Files

| Component Type | File Path | Relevance |
|---------------|-----------|-----------|
| Radar Chart | `assessment/survey/_components/radar-chart.tsx` | HIGH - Exact pattern for spider diagram |
| Radial Progress | `course/_components/RadialProgress.tsx` | HIGH - Course progress visualization |
| Course Dashboard | `course/_components/CourseDashboardClient.tsx` | HIGH - Data loading pattern |
| Kanban Board | `kanban/_components/kanban-board.tsx` | HIGH - Task summary source |
| Task Hooks | `kanban/_lib/hooks/use-tasks.ts` | MEDIUM - React Query pattern |
| Task Schema | `kanban/_lib/schema/task.schema.ts` | MEDIUM - Task types |
| Workspace Loader | `[account]/_lib/server/team-account-workspace.loader.ts` | MEDIUM - Loader pattern |
| Calendar | `coaching/_components/calendar.tsx` | HIGH - Cal.com integration |
| Survey Summary | `assessment/survey/_components/survey-summary.tsx` | HIGH - Assessment display |
