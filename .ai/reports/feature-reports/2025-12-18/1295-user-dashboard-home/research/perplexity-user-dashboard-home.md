# Perplexity Research: User Dashboard Best Practices

## Server Components vs Client Components for Dashboard Widgets

### Default to Server Components

- Make the **page**, **layout**, and most **cards/tables/stat tiles** Server Components
- They can fetch directly from DB/internal APIs without extra client roundtrips
- They stream and cache well with Next.js data cache

### Use Client Components Only When Needed

- Charts (Recharts), complex filters, search boxes, date pickers
- Anything using `useState`, `useEffect`, browser APIs, or contexts

### RSC Shell with Client Islands Pattern

```tsx
// app/dashboard/page.tsx (Server Component)
import { Suspense } from "react";
import { ChartWidget } from "./_components/chart-widget"; // client
import { StatsCards } from "./_components/stats-cards";   // server

export default async function DashboardPage() {
  const statsPromise = getStats();

  return (
    <div className="space-y-6">
      <StatsCards stats={await statsPromise} />
      <Suspense fallback={<div>Loading chart...</div>}>
        <ChartWidget />
      </Suspense>
    </div>
  );
}
```

## Data Fetching Patterns with Loaders

### Parallel Promise.all for Multiple Data Sources

```tsx
const [stats, revenue, activity, notifications] = await Promise.all([
  getStats(),
  getRevenue(),
  getActivityFeed(),
  getNotifications(),
]);
```

### Suspense for Independent Widgets

```tsx
// app/dashboard/_components/revenue-card.tsx (Server Component)
export async function RevenueCard() {
  const revenue = await getRevenue();
  return <Card>...</Card>;
}

// In page.tsx
<Suspense fallback={<SkeletonCard />}>
  <RevenueCard />
</Suspense>
```

### Next.js Caching Strategies

- `fetch(..., { cache: "no-store" })` or `revalidate: 0` for real-time panels
- `export const revalidate = 60` for near real-time
- Static or long-lived data gets default caching

## Recharts Integration with shadcn/ui

### Client Component Wrapper Pattern

```tsx
"use client";

import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Props = { data: Array<{ date: string; value: number }> };

export function RevenueChart({ data }: Props) {
  return (
    <Card className="p-4 h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#0f172a" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
```

### Feed Data from Server Parent

```tsx
// server component
import { RevenueChart } from "./revenue-chart";

export async function RevenueChartSection() {
  const data = await getRevenueChartData();
  return <RevenueChart data={data} />;
}
```

## Performance Optimization Strategies

### Key Tactics

1. **Parallelize** all network/DB calls with `Promise.all`
2. **Segment Suspense boundaries** - slower panels get their own Suspense
3. **Incremental revalidation** - different widgets can have different revalidate options
4. **Client-side polling only when required** - for truly live widgets
5. **Avoid N+1 queries** - query aggregates in one DB call per widget
6. **Code splitting** - dynamic import for heavy chart libraries

### Dynamic Imports for Charts

```tsx
const RevenueChart = dynamic(() => import("./revenue-chart"), { ssr: false });
```

## Activity Feed Implementation Patterns

### Data Model

```typescript
interface Activity {
  id: string;
  createdAt: Date;
  type: string;
  actor: string;
  target: string;
  metadata: Record<string, unknown>;
}
```

### Server-Rendered Initial Feed

```tsx
// Server Component
export async function ActivityFeed({ limit = 20 }) {
  const activities = await getActivities({ limit });
  return (
    <div className="space-y-2">
      {activities.map((a) => (
        <ActivityItem key={a.id} activity={a} />
      ))}
    </div>
  );
}
```

### Pagination Pattern

- Accept `cursor` (activity ID or timestamp)
- `GET /api/activity?cursor=...&limit=20`
- Start with SSR list, then client "Load more" to append

### Real-time Options

- Poll `/api/activity?since=...` every N seconds and prepend
- Keep feed container as client component, but initial data from server

### UI Components

- Use shadcn's `Avatar`, `Badge`, `ScrollArea`, `Separator`
- Group by date (Today/Yesterday) on the server

## Common Dashboard Gotchas to Avoid

1. **Making whole dashboard a Client Component** - loses RSC benefits
2. **Heavy charts blocking initial render** - use Suspense and skeletons
3. **Unbounded live polling** - centralize intervals, increase period for less critical cards
4. **Inconsistent types** - define shared types in `/types` or `_lib/types.ts`
5. **Over-coupling widgets** - keep data APIs widget-aligned, not global
6. **Layout jank** - use fixed-height skeletons
7. **Ignoring accessibility** - provide numeric summaries alongside visuals

## Recommended Architecture

```
app/dashboard/
  page.tsx                    # Server Component - orchestrator
  loading.tsx                 # Loading skeleton
  _components/
    stats-cards.tsx           # Server Component
    course-progress-card.tsx  # Client Component (Recharts)
    activity-feed.tsx         # Server Component with client pagination
    kanban-summary.tsx        # Server Component
  _lib/
    server/
      dashboard.loader.ts     # Parallel data fetching
    types.ts                  # Shared types
```
