# Insights Dashboard — Build Spec

## Overview
Build a new "Insights" page for Mission Control that provides a visual analytics dashboard showing trends and metrics over time. This turns Mission Control from a task manager into a true command center.

## Repository
`~/clawd/slideheroes-internal-tools`

## Tech Stack
- Next.js 16 (App Router, `"use client"` for interactive pages)
- React 19
- Tailwind CSS v4 (using @theme inline in globals.css — chart color vars already exist)
- Prisma (SQLite) — existing schema, DO NOT modify
- **ADD: `recharts` library** for charts (`npm install recharts` in `app/` directory)
- Existing UI components: `@/components/ui/card`, `@/components/ui/badge`, `@/components/ui/button`
- Layout wrapper: `@/components/MissionControlLayout`

## What to Build

### 1. API Endpoint: `app/src/app/api/v1/insights/route.ts`

**GET /api/v1/insights?weeks=8**

Returns aggregated data for the insights dashboard. Query param `weeks` controls how many weeks of history (default 8, max 52).

**Response shape:**
```typescript
{
  generatedAt: string,
  weekCount: number,
  
  // Summary stats (current counts)
  summary: {
    totalTasks: number,
    openTasks: number,        // backlog + in_progress + in_review
    completedTasks: number,   // done, all time
    blockedTasks: number,     // has blockedReason
    totalPractices: number,
    totalResources: number,
    totalDebates: number,
    totalActivities: number,  // SophieActivity count
  },
  
  // Weekly time series (one entry per week, ordered oldest → newest)
  weekly: Array<{
    weekStart: string,        // ISO date (Monday)
    weekLabel: string,        // "Feb 3" format
    tasksCompleted: number,
    tasksCreated: number,
    practicesCaptured: number,
    resourcesCaptured: number,
    debatesCompleted: number,
    sophieActivities: number,
    feedItemsScored: number,
  }>,
  
  // Domain breakdown for practices
  practicesByDomain: Array<{
    domain: string,
    count: number,
  }>,
  
  // Task status distribution  
  tasksByStatus: Array<{
    status: string,
    count: number,
  }>,
  
  // Task priority distribution
  tasksByPriority: Array<{
    priority: string,
    count: number,
  }>,
  
  // Board breakdown
  tasksByBoard: Array<{
    boardName: string,
    boardIcon: string | null,
    total: number,
    completed: number,
    inProgress: number,
  }>,
  
  // Recent highlights (last 7 days)
  highlights: {
    tasksCompletedThisWeek: number,
    practicesCapturedThisWeek: number,
    debatesThisWeek: number,
    topDomainThisWeek: string | null,
  },
  
  // Activity heatmap data (last 8 weeks, by day)
  dailyActivity: Array<{
    date: string,    // YYYY-MM-DD
    count: number,   // total SophieActivity entries
  }>,
}
```

**Implementation notes:**
- Use `prisma` from `@/lib/db`
- Import: `import { prisma } from "@/lib/db";`
- For weekly aggregation, iterate over weeks and count records in each range
- `startOfWeekUTC` helper: Monday as start of week (see morning-brief/route.ts for reference)
- Week label format: use short month + day, e.g., "Feb 3"
- For practicesByDomain: group BestPractice by `domain` field
- For tasksByStatus: group Task (where archived=false) by `status`
- For tasksByBoard: join with Board, aggregate
- For dailyActivity: group SophieActivity by date for the last 56 days

### 2. Page: `app/src/app/insights/page.tsx`

A `"use client"` page wrapped in `<MissionControlLayout>`.

**Layout Structure:**

```
┌─────────────────────────────────────────────────────────┐
│ MissionControlLayout (with nav)                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📊 Insights                          [8 weeks ▼] [↻]  │
│                                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│  │  61  │ │  22  │ │   3  │ │  12  │ │ 115  │         │
│  │Tasks │ │Pract.│ │Resrc.│ │Deba. │ │Activ.│         │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘         │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Weekly Activity (Area Chart)                    │    │
│  │  Lines: Tasks Completed, Practices, Activities   │    │
│  │  X-axis: weeks, Y-axis: counts                   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────┐ ┌────────────────────────┐    │
│  │ Tasks by Status      │ │ Practices by Domain    │    │
│  │ (Donut/Pie Chart)    │ │ (Horizontal Bar Chart) │    │
│  └──────────────────────┘ └────────────────────────┘    │
│                                                          │
│  ┌──────────────────────┐ ┌────────────────────────┐    │
│  │ Tasks by Board       │ │ Activity Heatmap       │    │
│  │ (Stacked Bar)        │ │ (Grid of colored dots) │    │
│  └──────────────────────┘ └────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Components & Charts:**

1. **Summary Cards Row** — Five metric cards in a flex row:
   - Total Tasks (icon: ListChecks)
   - Best Practices (icon: Lightbulb)
   - Resources (icon: Library)
   - Debates (icon: Users)
   - Sophie Activities (icon: Activity)
   
   Each card: Large number, label below, subtle background. Use the Card component.

2. **Weekly Activity Area Chart** (full width) — Using recharts `<AreaChart>`:
   - X-axis: weekLabel
   - Three area series: tasksCompleted (chart-1 green), practicesCaptured (chart-2 blue), sophieActivities (chart-3 amber)
   - Tooltip showing all values
   - Semi-transparent fill, solid stroke
   - Responsive container

3. **Tasks by Status** (Donut Chart) — Using recharts `<PieChart>` with `innerRadius`:
   - Segments: backlog (amber), in_progress (blue), in_review (purple), done (green)
   - Center label showing total
   - Legend below

4. **Practices by Domain** (Horizontal Bar Chart) — Using recharts `<BarChart layout="vertical">`:
   - Bars colored with chart-2 (blue)
   - Labels on Y-axis (domain names)
   - Clean, minimal

5. **Tasks by Board** (Grouped Bar Chart):
   - Each board as a group
   - Bars for: completed (green), inProgress (blue), remaining (muted)

6. **Activity Heatmap** — A CSS grid of small squares, 7 rows (Mon-Sun) × N columns (weeks):
   - Color intensity based on activity count
   - Tooltip on hover showing date + count
   - GitHub-contribution-style
   - Build this with plain divs + Tailwind, NOT recharts

**Styling:**
- Dark theme matches existing Mission Control (see globals.css)
- Use CSS variables: `var(--chart-1)` through `var(--chart-5)` for chart colors
- Card backgrounds: `bg-card`
- Text: `text-foreground` and `text-muted-foreground`
- Grid layout: `grid grid-cols-1 lg:grid-cols-2 gap-6` for the 2-column sections
- Page padding: `p-6` inside a `max-w-[1600px] mx-auto`

**Interactions:**
- Dropdown to select weeks (4, 8, 12, 24) — re-fetches with `?weeks=N`
- Refresh button (revalidates data)
- Loading skeleton while fetching

### 3. Update Navigation

In `app/src/components/MissionControlLayout.tsx`, add the Insights tab to the `TABS` array:

```typescript
{ key: "insights", label: "Insights", href: "/insights", icon: BarChart3, enabled: true },
```

Import `BarChart3` from `lucide-react`. Place it after "Resources" in the tab order.

## Important Notes

- **DO NOT modify `prisma/schema.prisma`** — read-only against existing tables
- **DO NOT modify `globals.css`** — theme is already set up
- Use `export const dynamic = "force-dynamic"` in the API route for fresh data
- All recharts components need `"use client"` (the page already has it)
- The recharts `ResponsiveContainer` needs a parent with explicit height — use `h-[300px]` or similar
- For the heatmap: generate a grid with 7 rows × ceil(days/7) columns. Empty cells for future dates.
- Use `fetch('/api/v1/insights?weeks=8')` client-side with `React.useEffect` + `useState`
- Handle loading state with skeleton placeholders

## File Checklist
1. `app/src/app/api/v1/insights/route.ts` — API endpoint
2. `app/src/app/insights/page.tsx` — Dashboard page  
3. `app/src/components/MissionControlLayout.tsx` — Add nav tab (small edit)
4. Install recharts: `cd app && npm install recharts`

## Git
- Create branch `feat/insights-dashboard`
- Commit with message: `feat(insights): add analytics dashboard with charts and weekly trends`
- Push to origin
- Open PR targeting `main` branch

## Verification
After building, run:
```bash
cd ~/clawd/slideheroes-internal-tools/app
npm run build
```
Must pass with no errors.
