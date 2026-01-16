# Codebase Exploration: User Dashboard Home

## Current Dashboard Page

**Location**: `apps/web/app/home/(user)/page.tsx`

The current user home page is minimal:
- Uses `PageBody` component (empty)
- Has `HomeLayoutPageHeader` with title/description
- Uses `withI18n` wrapper for translations

This is the target location for the dashboard implementation.

## Existing Component Patterns

### 1. Course Progress Components

**RadialProgress** (`apps/web/app/home/(user)/course/_components/RadialProgress.tsx`)
- Custom SVG-based radial progress indicator
- Takes `value` (0-100), `size`, `strokeWidth` props
- Uses CSS transition for smooth animations
- Can be reused for dashboard course progress card

**CourseProgressBar** (`apps/web/app/home/(user)/course/_components/CourseProgressBar.tsx`)
- Linear progress bar with percentage
- Shows completed/total lessons count

**CourseDashboardClient** (`apps/web/app/home/(user)/course/_components/CourseDashboardClient.tsx`)
- Fetches course data via React Query
- Shows lesson cards with completion status
- Uses `@tanstack/react-query` for data fetching

### 2. Assessment/Survey Components

**RadarChart** (`apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`)
- Spider diagram for category scores
- Uses Recharts with shadcn ChartContainer
- Takes `categoryScores` object: `{ [category: string]: number }`
- Ready to reuse for assessment spider card

**useSurveyScores Hook** (`apps/web/app/home/(user)/assessment/_lib/client/hooks/use-survey-scores.ts`)
- Fetches survey scores from `survey_responses` table
- Returns `categoryScores`, `highestCategory`, `lowestCategory`
- Requires `userId` and `surveyId`

### 3. Kanban Components

**KanbanBoard** (`apps/web/app/home/(user)/kanban/_components/kanban-board.tsx`)
- Full drag-and-drop kanban with @dnd-kit
- Three columns: To Do, In Progress, Done
- Uses `useTasks` hook for data

**Task Schema** (`apps/web/app/home/(user)/kanban/_lib/schema/task.schema.ts`):
```typescript
type TaskStatus = "do" | "doing" | "done";
type TaskPriority = "low" | "medium" | "high";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  phase?: string;
  subtasks?: Subtask[];
  account_id: string;
  created_at: string;
  updated_at: string;
}
```

**useTasks Hook** (`apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.ts`)
- Uses React Query to fetch tasks
- Auto-seeds default tasks if none exist
- Includes mutations for create, update, delete, reset

**Task API** (`apps/web/app/home/(user)/kanban/_lib/api/tasks.ts`)
- `getTasks(client)` - Get all tasks with subtasks
- `getTaskById(client, id)` - Get single task
- `getTasksByStatus(client, status)` - Filter by status

### 4. Coaching Components

**Calendar** (`apps/web/app/home/(user)/coaching/_components/calendar.tsx`)
- Embedded Cal.com iframe
- Shows 60-minute booking calendar
- For dashboard, could show "Next session" or "Book now" CTA

### 5. Dashboard Demo (Team Account)

**DashboardDemo** (`apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx`)
- Example charts: LineChart, AreaChart, BarChart
- Card layout pattern with trends
- CustomersTable with status badges
- Good reference for dashboard card patterns

### 6. UI Components Available

From `@kit/ui`:
- `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`
- `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`
- `Badge` for status indicators
- `Table` components for presentations table
- `Avatar` for activity feed
- `Button` for quick actions
- `Progress` for linear progress bars

## Data Sources Summary

### Tasks (Kanban)
- Table: `tasks` with `subtasks`
- Status enum: `do`, `doing`, `done`
- Priority enum: `low`, `medium`, `high`
- Linked to user via `account_id`

### Survey/Assessment
- Table: `survey_responses`
- Fields: `category_scores` (JSON), `highest_scoring_category`, `lowest_scoring_category`
- Linked to user via `user_id`

### Course Progress
- Table: `course_progress`
- Fields: `completion_percentage`, `completed_at`
- Table: `lesson_progress` for individual lesson tracking

### Presentations/Storyboards
- Table: `building_blocks_submissions`
- Fields: `title`, `presentation_type`, `storyboard` (JSON), `audience`, etc.
- Linked to user via `user_id`

### Coaching Sessions
- Currently using Cal.com embed
- No direct database table - external integration

## Layout Pattern

**UserHomeLayout** (`apps/web/app/home/(user)/layout.tsx`)
- Supports sidebar and header styles
- Uses `UserWorkspaceContextProvider` for user context
- `loadUserWorkspace()` provides user data

## Recommended Implementation Pattern

### Dashboard Loader Pattern
```typescript
// _lib/server/dashboard.loader.ts
import 'server-only';

export async function loadDashboardData(client, userId) {
  const [
    courseProgress,
    surveyScores,
    taskSummary,
    recentActivity,
    presentations
  ] = await Promise.all([
    getCourseProgress(client, userId),
    getSurveyScores(client, userId),
    getTaskSummary(client, userId),
    getRecentActivity(client, userId),
    getPresentations(client, userId)
  ]);

  return { courseProgress, surveyScores, taskSummary, recentActivity, presentations };
}
```

### Component Structure
```
apps/web/app/home/(user)/
  page.tsx                    # Dashboard page with data loading
  _components/
    dashboard-grid.tsx        # Layout grid for cards
    course-progress-card.tsx  # Radial chart card (client)
    assessment-spider-card.tsx # Radar chart card (client)
    kanban-summary-card.tsx   # Task counts summary
    activity-feed.tsx         # Recent activities
    quick-actions-panel.tsx   # Action buttons
    coaching-sessions-card.tsx # Next session/book CTA
    presentations-table.tsx   # Data table with shadcn
  _lib/
    server/
      dashboard.loader.ts     # Parallel data fetching
```

## Key Considerations

1. **Charts require 'use client'** - Wrap Recharts in client components
2. **Use existing hooks** - `useTasks`, `useSurveyScores` patterns
3. **Parallel data fetching** - Use `Promise.all` in loader
4. **Suspense boundaries** - Wrap slow widgets independently
5. **Reuse existing components** - RadialProgress, RadarChart
6. **Follow i18n pattern** - Use Trans component for all text
