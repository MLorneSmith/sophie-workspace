# Perplexity Research: Dashboard Best Practices

## Query
Best practices for building a user dashboard in Next.js 15 with TypeScript and Server Components. Focus on: 1) Dashboard layout patterns with CSS Grid for component arrangement 2) Data fetching patterns with parallel loading 3) Chart component best practices (radial progress, radar/spider charts) 4) Activity feed implementation 5) Kanban summary cards 6) Performance considerations for dashboards with multiple data sources

## Response from sonar-pro

### 1. Dashboard Layout Patterns with CSS Grid
Use a responsive **CSS Grid** layout in a Server Component for the dashboard page to arrange components like sidebar, header, charts, and main content. Shadcn/ui's new "dashboard" block (introduced recently) provides a pre-built template with Grid-based cards, data tables, and sidebar—install via `npx shadcn-ui@latest add dashboard` to scaffold a `/dashboard` page with mock data in `data.json`. Structure the root layout as a Server Component wrapping children in providers (e.g., ThemeProvider), then define Grid in the dashboard page:

```tsx
// app/dashboard/page.tsx (Server Component)
import { GridLayout } from '@/components/ui/grid-layout'; // Custom or Shadcn-inspired

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 lg:grid-rows-[auto_1fr] gap-6 p-6 h-screen">
      <aside className="lg:col-span-1">Sidebar</aside>
      <header className="lg:col-span-3 row-start-1">Header with ModeToggle</header>
      <main className="lg:col-span-3 lg:col-start-2 lg:row-span-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Charts, cards, feed here */}
      </main>
    </div>
  );
}
```
This pattern ensures server-side rendering for static layout while isolating interactive Client Components (e.g., search in nav).

### 2. Data Fetching Patterns with Parallel Loading
Leverage **Server Components** for data fetching with `Promise.all` for parallel loading from multiple sources (e.g., API, database). Fetch at the page/layout level, pass data as props to child components—avoids waterfalls and enables streaming.

```tsx
// app/dashboard/page.tsx (Server Component)
async function fetchDashboardData() {
  const [userStats, activity, kanbanData] = await Promise.all([
    fetch('/api/stats', { cache: 'force-cache' }).then(res => res.json()),
    fetch('/api/activity').then(res => res.json()),
    fetch('/api/kanban').then(res => res.json())
  ]);
  return { userStats, activity, kanbanData };
}

export default async function DashboardPage() {
  const data = await fetchDashboardData();
  return <DashboardContent {...data} />;
}
```
Use `cache: 'force-cache'` for static data, `revalidate` for dynamic. Interweave Client Components for interactivity (mark with `'use client'`).

### 3. Chart Component Best Practices (Radial Progress, Radar/Spider Charts)
Build charts as **Client Components** using libraries like Recharts or Chart.js with Shadcn wrappers for theming. Place in Grid cells; fetch data server-side and pass as props. For **radial progress**, use SVG-based components:

```tsx
// components/ui/radial-progress.tsx ('use client')
'use client';
import { RadialProgress } from '@radix-ui/react-progress'; // Or custom SVG

interface RadialProgressProps {
  value: number;
  max?: number;
}

export function RadialProgressChart({ value, max = 100 }: RadialProgressProps) {
  return (
    <div className="radial-progress w-32 h-32">
      <svg>{/* Circle path with stroke-dasharray based on value/max */}</svg>
      <span>{value}%</span>
    </div>
  );
}
```
For **radar/spider charts**, use Recharts `<RadarChart>` with responsive containers and accessibility (ARIA labels). Mock data from `data.json` as in Shadcn dashboard; animate on mount with Framer Motion. Keep charts shallow in the tree for RSC optimization.

### 4. Activity Feed Implementation
Implement as a **Server Component** with Client interactivity for infinite scroll or filters. Use TanStack Table or a simple list with `Suspense` boundaries for streaming:

```tsx
// components/activity-feed.tsx (Server Component)
import { ActivityItem } from './activity-item';

export default async function ActivityFeed({ activities }: { activities: Activity[] }) {
  return (
    <ul className="space-y-4">
      {activities.map(activity => <ActivityItem key={activity.id} {...activity} />)}
    </ul>
  );
}
```
Pass `activities` from parallel fetch. Add `'use client'` to `ActivityItem` for timestamps or reactions. Use `loading.tsx` for suspense fallback.

### 5. Kanban Summary Cards
Render **Kanban summary cards** in a Grid subsection as Server Components displaying aggregated data (e.g., task counts by status). Use Shadcn Card with hover states:

```tsx
// components/kanban-summary.tsx (Server Component)
interface KanbanCardProps {
  status: string;
  count: number;
  color: string;
}

export function KanbanSummaryCard({ status, count, color }: KanbanCardProps) {
  return (
    <div className="card bg-gradient-to-r from-slate-50 p-6 rounded-xl shadow">
      <h3 className={`text-${color}-500 font-bold`}>{status}</h3>
      <span className="text-3xl">{count}</span>
    </div>
  );
}
```
Aggregate in parallel fetch (e.g., `kanbanData.statusCounts`). Arrange in `md:grid-cols-4` for "To Do", "In Progress", etc.

### 6. Performance Considerations for Dashboards with Multiple Data Sources
- **Prioritize Server Components** for initial render; limit Client Components to interactive islands (e.g., charts, forms).
- Use **parallel `Promise.all`** and `Suspense` for non-blocking fetches; stream sections independently.
- **Caching**: `fetch` with `revalidate` or `dynamic` for real-time data; static export for mock dashboards.
- **Providers deep in tree**: Wrap ThemeProvider around `{children}` only, not full `<html>`, for RSC static optimization.
- **Shadcn + Tailwind v4**: Tree-shake unused CSS; use new dashboard block for zero-config perf.
- Monitor with OpenTelemetry for RSC activity if scaling. Avoid client-side state (e.g., Zustand) unless persistent like carts. Test with Next.js 15's improved bundling.

## Token Usage
- Prompt: 84
- Completion: 1408
- Total: 1492
