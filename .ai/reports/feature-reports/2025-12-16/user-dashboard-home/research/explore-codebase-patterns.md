# Codebase Exploration: Dashboard Patterns

## Overview
This document summarizes existing codebase patterns relevant to implementing the user dashboard at `/home`.

## Existing Dashboard Components

### 1. Dashboard Demo Charts (`dashboard-demo-charts.tsx`)
**Location**: `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx`

A comprehensive client-side dashboard demo with:
- shadcn/ui Card components for consistent styling
- Recharts integration via `@kit/ui/chart` wrapper
- Multiple chart types: LineChart, AreaChart, BarChart
- ChartContainer with responsive design
- Trend indicators with badges
- Data table integration

**Key patterns**:
```tsx
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@kit/ui/chart";
import { LineChart, AreaChart, BarChart, CartesianGrid, XAxis } from "recharts";
```

### 2. Radial Progress Component
**Location**: `apps/web/app/home/(user)/course/_components/RadialProgress.tsx`

Custom SVG-based radial progress with:
- Configurable size and stroke width
- Smooth CSS transitions
- Percentage display in center
- Accessible with title element

**Pattern**:
```tsx
"use client";
interface RadialProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
}
```

### 3. Radar Chart Component
**Location**: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`

Spider/radar chart using Recharts with:
- shadcn/ui chart wrapper integration
- PolarGrid, PolarAngleAxis, Radar components
- Empty state handling
- ChartConfig for theming

**Pattern**:
```tsx
import { RadarChart as RechartsRadarChart, PolarAngleAxis, PolarGrid, Radar } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@kit/ui/chart";
```

### 4. Course Dashboard Client
**Location**: `apps/web/app/home/(user)/course/_components/CourseDashboardClient.tsx`

Complex client component demonstrating:
- React Query for data fetching
- Progress tracking (CourseProgressBar, RadialProgress)
- Card-based lesson list
- Badge status indicators
- Image handling with fallbacks

### 5. Kanban Board
**Location**: `apps/web/app/home/(user)/kanban/_components/kanban-board.tsx`

Task management with:
- DnD Kit integration
- Status columns (do, doing, done)
- Task cards with status
- Subtask support
- React Query hooks for data

## Data Loading Patterns

### Loader Pattern (Server-Side)
**Location**: `packages/features/admin/src/lib/server/loaders/admin-dashboard.loader.ts`

Production-ready loader with:
- `cache()` from React for request deduplication
- Error boundaries with fallbacks
- Retry logic for transient failures
- Dependency injection for testing
- Structured logging

**Pattern**:
```tsx
import "server-only";
import { cache } from "react";

export const loadAdminDashboard = cache(adminDashboardLoader);

async function adminDashboardLoader(deps?: AdminDashboardLoaderDeps) {
  const client = deps?.client ?? getSupabaseServerClient();
  // ...fetch data with error handling
}
```

### Team Workspace Loader
**Location**: `apps/web/app/home/[account]/_lib/server/team-account-workspace.loader.ts`

Demonstrates:
- Parallel data fetching with `Promise.all`
- Type exports for workspace data
- Redirect handling for missing data

**Pattern**:
```tsx
export const loadTeamWorkspace = cache(workspaceLoader);

async function workspaceLoader(accountSlug: string) {
  const [workspace, user] = await Promise.all([
    api.getAccountWorkspace(accountSlug),
    requireUserInServerComponent(),
  ]);
  return { ...workspace.data, user };
}
```

## Page Structure Pattern

### Current Home Page
**Location**: `apps/web/app/home/(user)/page.tsx`

Simple structure with:
- PageHeader component
- PageBody wrapper
- i18n integration with `withI18n` HOC
- Metadata generation

**Pattern**:
```tsx
import { PageBody } from "@kit/ui/page";
import { withI18n } from "~/lib/i18n/with-i18n";
import { HomeLayoutPageHeader } from "./_components/home-page-header";

function UserHomePage() {
  return (
    <>
      <HomeLayoutPageHeader title={...} description={...} />
      <PageBody>{/* Content here */}</PageBody>
    </>
  );
}

export default withI18n(UserHomePage);
```

## Database Schema Patterns

### Available Tables for Dashboard
From migrations analysis:

1. **course_progress** - User course completion
   - `user_id`, `course_id`, `completion_percentage`, `completed_at`

2. **lesson_progress** - Individual lesson completion
   - `user_id`, `course_id`, `lesson_id`, `completed_at`

3. **quiz_attempts** - Quiz scores
   - `user_id`, `course_id`, `lesson_id`, `score`, `completed_at`

4. **survey_responses** - Assessment data
   - `user_id`, `survey_id`, `responses` (JSONB)

5. **survey_progress** - Survey completion tracking
   - `user_id`, `survey_id`, `current_question`, `completed_at`

6. **tasks** (Kanban) - Presentation workflow tasks
   - `account_id`, `title`, `status` (do/doing/done), `phase`, `subtasks`

### Presentation Workflow
**Location**: `apps/web/app/home/(user)/kanban/_lib/config/presentation-tasks.ts`

5 phases with 14 tasks and 59 subtasks:
- Phase 1: The Start (4 tasks)
- Phase 2: The Art of Storytelling (3 tasks)
- Phase 3: The Harmony of Design (2 tasks)
- Phase 4: The Science of Fact-based Persuasion (1 task)
- Phase 5: The How (4 tasks)

## UI Component Library

### shadcn/ui Chart Components
**Location**: `packages/ui/src/shadcn/chart.tsx`

Exports:
- `ChartContainer` - Responsive wrapper with theming
- `ChartTooltip` - Recharts Tooltip
- `ChartTooltipContent` - Styled tooltip content
- `ChartLegend` - Legend component
- `ChartConfig` - Type for chart configuration

### Available Recharts Components
From dashboard-demo-charts imports:
- Area, AreaChart
- Bar, BarChart
- Line, LineChart
- CartesianGrid
- XAxis

From radar-chart imports:
- RadarChart
- PolarAngleAxis
- PolarGrid
- Radar

## Key Recommendations

### Layout Pattern
```tsx
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
  {/* First row: 3 cards */}
  <Card>{/* Progress */}</Card>
  <Card>{/* Spider */}</Card>
  <Card>{/* Kanban */}</Card>

  {/* Second row: 3 cards */}
  <Card>{/* Activity */}</Card>
  <Card>{/* Quick Actions */}</Card>
  <Card>{/* Coaching */}</Card>

  {/* Third row: Full width */}
  <Card className="col-span-full">{/* Presentation Table */}</Card>
</div>
```

### Data Fetching
```tsx
// In loader file
export const loadUserDashboard = cache(async (userId: string) => {
  const [courseProgress, surveyResults, tasks, activity] = await Promise.all([
    loadCourseProgress(userId),
    loadSurveyResults(userId),
    loadKanbanSummary(userId),
    loadRecentActivity(userId),
  ]);
  return { courseProgress, surveyResults, tasks, activity };
});
```

### Component Structure
- Server Component for page and data fetching
- Client Components only for interactive charts
- Use existing RadialProgress and RadarChart components
- Follow Card/CardHeader/CardContent pattern from shadcn/ui
