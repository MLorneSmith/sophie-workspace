# Research Manifest: User Dashboard at /home

## Quick Reference
| Field | Value |
|-------|-------|
| **Initiative** | Create a user dashboard at /home with 7 main components: Course progress radial progress graph, Spider diagram from self assessment survey, Kanban Summary Card, Recent Activity Feed, Quick Actions Panel, Book/Upcoming Coaching Sessions, and Presentation outline table. Three components in first row, three in second row, and Presentation outline table as full third row. |
| **Mode** | full |
| **Technologies** | shadcn/ui charts (Recharts-based), Next.js 15 Server Components, Tailwind CSS Grid |
| **Research Date** | 2025-12-16 |
| **GitHub Issue** | #pending - will be updated |
| **Status** | active |

## Interview Summary
- **Technologies**: shadcn charts (Recharts-based) - Already integrated with shadcn/ui, consistent styling
- **Data Source**: Static page load with Server Components - Data fetched on page load, refresh to update
- **Expected Size**: Medium (4-7 features) - Each major component or component group as a separate feature

## Research Reports
- [Perplexity Research](./research/perplexity-dashboard-best-practices.md)
- [Codebase Patterns](./research/explore-codebase-patterns.md)

## Key Findings Summary

### Technology Overview
- **shadcn/ui charts** are the recommended approach - they wrap Recharts and provide consistent theming with the existing UI library
- **Server Components** for layout and data fetching, **Client Components** only for interactive charts
- **CSS Grid** with responsive breakpoints for the 3-3-1 row layout
- Existing components (RadialProgress, RadarChart) can be reused with minimal modifications

### Recommended Patterns

| Pattern | Description | Example Location |
|---------|-------------|------------------|
| Chart Container | Use ChartContainer wrapper for theming | `@kit/ui/chart` |
| Parallel Data Fetching | Promise.all for multiple data sources | `team-account-workspace.loader.ts` |
| Cached Loaders | React cache() for request deduplication | `admin-dashboard.loader.ts` |
| Card Layout | Card/CardHeader/CardContent structure | `dashboard-demo-charts.tsx` |
| Radial Progress | SVG-based circular progress | `RadialProgress.tsx` |
| Radar Chart | Spider diagram with Recharts | `radar-chart.tsx` |

### Code Examples

**Radial Progress (Existing)**:
```tsx
// apps/web/app/home/(user)/course/_components/RadialProgress.tsx
export function RadialProgress({ value, size = 40, strokeWidth = 4 }: RadialProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  // ... SVG implementation
}
```

**Radar Chart (Existing)**:
```tsx
// apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx
import { RadarChart as RechartsRadarChart, PolarAngleAxis, PolarGrid, Radar } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@kit/ui/chart";
```

**Loader Pattern**:
```tsx
import "server-only";
import { cache } from "react";

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

### Gotchas & Warnings

1. **Client Components for Charts**: All chart components must be marked with `'use client'` - Recharts is client-only
2. **Avoid State Management Overkill**: For static page load, avoid Zustand/Redux - pass data as props from Server Components
3. **Chart Theming**: Use ChartConfig with CSS variables (`var(--chart-1)`) for dark mode support
4. **Empty States**: All components need empty state handling (see RadarChart for pattern)
5. **Image Optimization**: Use Next.js Image component with proper sizing for any dashboard images
6. **Suspense Boundaries**: Wrap individual cards in Suspense for streaming if independent loading is desired

### Existing Codebase Patterns

| Pattern | Location | Relevance |
|---------|----------|-----------|
| RadialProgress component | `apps/web/app/home/(user)/course/_components/RadialProgress.tsx` | Direct reuse for course progress |
| RadarChart component | `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx` | Direct reuse for spider diagram |
| Dashboard demo charts | `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx` | Reference for chart patterns |
| Admin dashboard loader | `packages/features/admin/src/lib/server/loaders/admin-dashboard.loader.ts` | Loader pattern with error handling |
| Team workspace loader | `apps/web/app/home/[account]/_lib/server/team-account-workspace.loader.ts` | Parallel fetching pattern |
| Kanban board | `apps/web/app/home/(user)/kanban/_components/kanban-board.tsx` | Task data structure reference |
| Presentation tasks | `apps/web/app/home/(user)/kanban/_lib/config/presentation-tasks.ts` | Task phases and structure |
| Course dashboard | `apps/web/app/home/(user)/course/_components/CourseDashboardClient.tsx` | Progress tracking pattern |
| Coaching calendar | `apps/web/app/home/(user)/coaching/_components/calendar.tsx` | Coaching sessions integration |

## Feature Mapping

### Proposed Feature Decomposition (4-7 features)

| # | Feature | Components | Data Sources |
|---|---------|------------|--------------|
| 1 | Dashboard Layout & Data Loading | Page structure, loader, grid layout | All sources via Promise.all |
| 2 | Course Progress Card | RadialProgress enhanced, progress stats | course_progress, lesson_progress |
| 3 | Assessment Spider Diagram | RadarChart with category scores | survey_responses |
| 4 | Kanban Summary Card | Task counts by status, current/next task | tasks table |
| 5 | Activity Feed & Quick Actions | Recent activity list, contextual CTAs | Multiple tables (aggregated) |
| 6 | Coaching Sessions Card | Upcoming sessions, booking CTA | Cal.com integration |
| 7 | Presentation Outline Table | Full-width table with phases and tasks | tasks with phases |

## Dependencies & Prerequisites

### Required
- shadcn/ui chart components (`@kit/ui/chart`) - Already installed
- Recharts library - Already installed
- Existing RadialProgress component
- Existing RadarChart component
- Database tables: course_progress, lesson_progress, quiz_attempts, survey_responses, tasks

### To Verify/Create
- Activity tracking mechanism (may need to aggregate from existing tables)
- Quick actions configuration (contextual CTAs based on user state)
- Cal.com integration for coaching sessions (existing at `/home/coaching`)

## Security Considerations

- All data fetching uses RLS-protected Supabase client
- User can only see their own data (enforced at database level)
- No admin/elevated access needed for dashboard
- Sensitive data (quiz scores, progress) only visible to data owner

## Performance Considerations

1. **Parallel Fetching**: Use Promise.all for all data sources to minimize load time
2. **React cache()**: Deduplicate repeated calls within same request
3. **Server Components**: Render layout and static content server-side
4. **Client Islands**: Only chart components need 'use client'
5. **Static Page Load**: Per interview, no real-time updates needed - simpler implementation
6. **CSS Grid**: Hardware-accelerated layout, no JS layout calculations
7. **Suspense Boundaries**: Optional - wrap cards for progressive loading if needed

## Recommended Implementation Order

1. **Dashboard Layout** - Create page structure with grid, empty card placeholders
2. **Data Loader** - Implement server-side data loading with parallel fetching
3. **Course Progress Card** - Reuse RadialProgress, add stats
4. **Assessment Spider** - Reuse RadarChart, connect to survey data
5. **Kanban Summary** - Aggregate task counts, show current/next
6. **Activity Feed** - Build activity aggregation query, render feed
7. **Quick Actions** - Context-aware CTAs based on user state
8. **Coaching Sessions** - Integrate with existing Cal.com
9. **Presentation Table** - Full-width table with expandable rows
