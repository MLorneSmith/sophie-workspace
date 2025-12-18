# Codebase Exploration: User Dashboard Patterns

## Summary

Exploration of existing codebase patterns relevant to implementing a user dashboard with 7 components at `/home`.

## 1. Database Schema Analysis

### Course Progress (`course_progress` table)

Location: `apps/web/supabase/migrations/20250319104726_web_course_system.sql`

```sql
CREATE TABLE IF NOT EXISTS public.course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_percentage NUMERIC DEFAULT 0,
  current_lesson_id TEXT,
  certificate_generated BOOLEAN DEFAULT false,
  UNIQUE(user_id, course_id)
);
```

**Key fields for Radial Progress Chart:**
- `completion_percentage` - Directly usable for radial progress
- `completed_at` - For completion status
- `started_at`, `last_accessed_at` - For activity tracking

### Lesson Progress (`lesson_progress` table)

```sql
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_percentage NUMERIC DEFAULT 0,
  UNIQUE(user_id, lesson_id)
);
```

### Quiz Attempts (`quiz_attempts` table)

```sql
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  quiz_id TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  score NUMERIC,
  passed BOOLEAN,
  answers JSONB,
  UNIQUE(user_id, quiz_id, started_at)
);
```

### Survey Responses (for Spider Diagram)

Location: `apps/web/supabase/migrations/20250319104724_web_survey_system.sql`

```sql
CREATE TABLE IF NOT EXISTS public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  survey_id TEXT NOT NULL,
  responses JSONB DEFAULT '[]'::jsonb,
  category_scores JSONB DEFAULT '{}'::jsonb,  -- KEY: Pre-computed category scores
  highest_scoring_category TEXT,
  lowest_scoring_category TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, survey_id)
);
```

**Key fields for Spider Diagram:**
- `category_scores` (JSONB) - Already formatted for radar chart: `{"Category1": score, "Category2": score}`
- `highest_scoring_category` / `lowest_scoring_category` - Pre-computed

### Kanban Tasks

Location: `apps/web/supabase/migrations/20250221144500_web_create_kanban_tables.sql`

```sql
create type public.task_priority as enum ('low', 'medium', 'high');
create type public.task_status as enum ('do', 'doing', 'done');

create table if not exists public.tasks (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    description text,
    status public.task_status not null default 'do',
    priority public.task_priority not null default 'medium',
    image_url text,
    account_id uuid not null references auth.users(id),
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

create table if not exists public.subtasks (
    id uuid default gen_random_uuid() primary key,
    task_id uuid not null references public.tasks(id) on delete cascade,
    title text not null,
    is_completed boolean default false,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);
```

**Key for Kanban Summary Card:**
- Status enum: `do`, `doing`, `done`
- Can aggregate counts per status

### Presentations (Building Blocks Submissions)

Location: `apps/web/supabase/migrations/20250211000000_web_create_building_blocks_submissions.sql`

```sql
create table if not exists public.building_blocks_submissions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id),
    title varchar not null,
    audience text,
    presentation_type varchar,
    question_type varchar,
    situation text,
    complication text,
    answer text,
    outline text,
    storyboard JSONB,  -- Added later
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
```

**Key for Presentation Outline Table:**
- `title`, `outline`, `storyboard`
- `presentation_type`, `audience`
- `created_at`, `updated_at`

## 2. Existing Chart Implementations

### Radar Chart Component (Survey Results)

Location: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`

```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
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

export interface CategoryScores {
  [key: string]: number;
}

const chartConfig = {
  score: {
    label: "Score",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function RadarChart({ categoryScores = {} }: { categoryScores?: CategoryScores }) {
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
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <RechartsRadarChart data={chartData}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="category" />
            <PolarGrid />
            <Radar dataKey="score" fill="var(--color-score)" fillOpacity={0.6} />
          </RechartsRadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```

**Pattern: This is exactly what we need for the Spider Diagram component.**

### Dashboard Demo Charts

Location: `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx`

Key patterns observed:
- Line charts for metrics (MRR, Revenue, Fees, Customers)
- Area charts with gradients
- Bar charts with date-based X-axis
- Table for displaying customer data
- Card composition with header, content, footer
- Trend badges (up/down indicators)

```tsx
// Chart configuration pattern
const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

// Gradient definitions for area charts
<defs>
  <linearGradient id={fillDesktopId} x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor="var(--color-desktop)" stopOpacity={0.8} />
    <stop offset="95%" stopColor="var(--color-desktop)" stopOpacity={0.1} />
  </linearGradient>
</defs>
```

## 3. Data Loader Pattern

Location: `apps/web/app/home/[account]/members/_lib/server/members-page.loader.ts`

```typescript
import "server-only";

import { createServiceLogger } from "@kit/shared/logger";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadTeamWorkspace } from "~/home/[account]/_lib/server/team-account-workspace.loader";
import type { Database } from "~/lib/database.types";

const { getLogger } = createServiceLogger("MEMBERS-PAGE-LOADER");

export async function loadMembersPageData(
  client: SupabaseClient<Database>,
  slug: string,
) {
  return Promise.all([
    loadAccountMembers(client, slug),
    loadInvitations(client, slug),
    canAddMember,
    loadTeamWorkspace(slug),
  ]);
}

async function loadAccountMembers(
  client: SupabaseClient<Database>,
  account: string,
) {
  const { data, error } = await client.rpc("get_account_members", {
    account_slug: account,
  });

  if (error) {
    const logger = await getLogger();
    logger.error("Error loading account members", {
      operation: "load_account_members",
      error,
      account,
    });
    throw error;
  }

  return data ?? [];
}
```

**Key Pattern:**
- Use `"server-only"` import
- Create typed Supabase client
- Use `Promise.all` for parallel fetching
- Use RPC for complex queries
- Proper error handling with logging

## 4. Page Structure Pattern

### Current Home Page

Location: `apps/web/app/home/(user)/page.tsx`

```tsx
import { PageBody } from "@kit/ui/page";
import { Trans } from "@kit/ui/trans";

import { createI18nServerInstance } from "~/lib/i18n/i18n.server";
import { withI18n } from "~/lib/i18n/with-i18n";
import { HomeLayoutPageHeader } from "./_components/home-page-header";

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t("account:homePage");
  return { title };
};

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

**Note:** Currently empty `PageBody` - perfect canvas for dashboard components.

### Coaching Page Pattern

Location: `apps/web/app/home/(user)/coaching/page.tsx`

```tsx
import { PageBody } from "@kit/ui/page";
import { Trans } from "@kit/ui/trans";

function CoachingPage() {
  return (
    <>
      <HomeLayoutPageHeader
        title={<Trans i18nKey={"common:routes.coaching"} />}
        description={<Trans i18nKey={"common:coachingTabDescription"} />}
      />
      <PageBody><Calendar /></PageBody>
    </>
  );
}

export default withI18n(CoachingPage);
```

## 5. Kanban Board Patterns

Location: `apps/web/app/home/(user)/kanban/_components/kanban-board.tsx`

Key patterns:
- React Query hook: `useTasks()` for data fetching
- Loading skeleton pattern
- Error handling with retry
- DnD context for drag-and-drop
- Column-based layout

```tsx
const COLUMNS = [
  { id: "do", title: "To Do" },
  { id: "doing", title: "In Progress" },
  { id: "done", title: "Done" },
] as const;

// Loading state pattern
if (isLoading) {
  return (
    <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-3">
      {COLUMNS.map((column) => (
        <div key={column.id} className="flex h-full w-full flex-col space-y-4">
          <div className="bg-muted/40 h-6 w-20 animate-pulse rounded" />
          <div className="bg-muted/40 flex-1 animate-pulse rounded-lg p-4">
            <div className="space-y-4">
              <div className="bg-background/40 h-24 animate-pulse rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

## 6. UI Components Available

Location: `packages/ui/src/shadcn/chart.tsx`

Available exports:
- `ChartContainer` - Wrapper with theming
- `ChartTooltip` - Recharts Tooltip
- `ChartTooltipContent` - Styled tooltip content
- `ChartLegend` - Recharts Legend
- `ChartLegendContent` - Styled legend content
- `ChartConfig` type - Configuration type

## Relevant Files Summary

| Component | Relevant Files |
|-----------|----------------|
| Course Progress Radial | `migrations/20250319104726_web_course_system.sql` |
| Spider Diagram | `assessment/survey/_components/radar-chart.tsx`, `migrations/20250319104724_web_survey_system.sql` |
| Kanban Summary | `kanban/_components/kanban-board.tsx`, `kanban/_lib/hooks/use-tasks.ts` |
| Recent Activity | `course_progress`, `lesson_progress`, `quiz_attempts` tables |
| Quick Actions | Use existing navigation patterns |
| Coaching Sessions | `coaching/_components/calendar.tsx` |
| Presentation Table | `migrations/20250211000000_web_create_building_blocks_submissions.sql` |
| Charts Framework | `packages/ui/src/shadcn/chart.tsx`, `dashboard-demo-charts.tsx` |
| Data Loading | `members/_lib/server/members-page.loader.ts` |

## Recommended Approach

1. **Create dashboard loader** at `app/home/(user)/_lib/server/dashboard.loader.ts`
2. **Parallel fetch all data** using `Promise.all()`
3. **Create component directory** at `app/home/(user)/_components/dashboard/`
4. **Reuse existing patterns:**
   - RadarChart component for spider diagram
   - ChartContainer/ChartConfig for all charts
   - Card composition from dashboard-demo-charts
   - Table patterns from kanban and customers table
5. **Grid layout**: 3 columns on large screens, responsive for mobile
