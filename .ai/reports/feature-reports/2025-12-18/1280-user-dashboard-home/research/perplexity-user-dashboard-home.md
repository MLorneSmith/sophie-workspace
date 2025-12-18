# Perplexity Research: Dashboard Best Practices

## Summary

Research on best practices for building user dashboards in Next.js 15 with React 19 and TypeScript, focusing on layout patterns, component composition, loading states, data fetching, and performance optimization.

## 1. Dashboard Layout Patterns (Grid-Based, Responsive)

### App Router Layout as Shell

Use the App Router layout as the shell and CSS grid for the main content area:

```tsx
// app/(dashboard)/layout.tsx
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-50">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-slate-800 hidden lg:block">
        {/* nav items */}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-14 border-b border-slate-800 flex items-center gap-4 px-4">
          <h1 className="font-semibold text-lg">Dashboard</h1>
        </header>

        {/* Content grid */}
        <main className="flex-1 p-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 auto-rows-[minmax(120px,auto)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

### Grid Column Spanning

Let cards span columns via utility classes:

```tsx
// app/(dashboard)/page.tsx
export default function DashboardPage() {
  return (
    <>
      <RevenueCard className="xl:col-span-2" />
      <ActiveUsersCard />
      <ConversionCard />
      <ActivityChartCard className="md:col-span-2 xl:col-span-4" />
    </>
  );
}
```

## 2. Component Composition for Data Visualization Cards

### Generic Card Primitive

Define a reusable card component:

```tsx
// components/dashboard/card.tsx
import type { ReactNode } from "react";
import clsx from "clsx";

export type DashboardCardProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function DashboardCard({
  title,
  description,
  icon,
  footer,
  children,
  className,
}: DashboardCardProps) {
  return (
    <section
      className={clsx(
        "flex flex-col rounded-xl border border-slate-800 bg-slate-900/60",
        "backdrop-blur-sm shadow-sm p-4 gap-3",
        className
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="text-sm font-medium text-slate-300">{title}</div>
          {description && (
            <p className="text-xs text-slate-500">{description}</p>
          )}
        </div>
        {icon && <div className="text-slate-500">{icon}</div>}
      </header>

      {children && <div className="flex-1">{children}</div>}

      {footer && (
        <footer className="pt-2 mt-auto border-t border-slate-800 text-xs text-slate-500">
          {footer}
        </footer>
      )}
    </section>
  );
}
```

### Metric Card Pattern

```tsx
// app/(dashboard)/widgets/revenue-card.tsx
"use client";

import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/card";

type Props = {
  amount: number;
  deltaPercent: number;
  className?: string;
};

export function RevenueCard({ amount, deltaPercent, className }: Props) {
  const formatted = useMemo(
    () => amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }),
    [amount]
  );

  const positive = deltaPercent >= 0;

  return (
    <DashboardCard
      title="Revenue"
      description="Last 30 days"
      icon={<TrendingUp className="h-4 w-4" />}
      className={className}
      footer={`${positive ? "Up" : "Down"} ${Math.abs(deltaPercent).toFixed(1)}% vs previous period`}
    >
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold">{formatted}</span>
        <span className={positive ? "text-emerald-400 text-xs" : "text-rose-400 text-xs"}>
          {positive ? "+" : "-"}{Math.abs(deltaPercent).toFixed(1)}%
        </span>
      </div>
    </DashboardCard>
  );
}
```

## 3. Loading States and Skeleton UI Patterns

### Skeleton Components

```tsx
// components/dashboard/skeleton.tsx
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <section className={clsx(
      "rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 animate-pulse",
      className
    )}>
      <div className="h-4 w-1/2 bg-slate-700 rounded" />
      <div className="h-3 w-3/4 bg-slate-800 rounded" />
      <div className="h-8 w-full bg-slate-800 rounded" />
      <div className="h-32 w-full bg-slate-800 rounded" />
    </section>
  );
}
```

### Page-level Loading with Suspense

```tsx
// app/(dashboard)/page.tsx
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <>
      <Suspense fallback={<CardSkeleton className="xl:col-span-2" />}>
        <RevenueCard />
      </Suspense>
      <Suspense fallback={<CardSkeleton />}>
        <ActiveUsersCard />
      </Suspense>
      <Suspense fallback={<CardSkeleton className="md:col-span-2 xl:col-span-4" />}>
        <ActivityChartCard />
      </Suspense>
    </>
  );
}
```

### React Query Loading States

```tsx
function ChartCard() {
  const { data, isLoading, error, isFetching, isStale } = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: fetchActivityData,
    staleTime: 30_000,
  });

  if (isLoading) {
    return <CardSkeleton />;
  }

  return (
    <DashboardCard title="Activity" className={isFetching ? 'opacity-70' : ''}>
      <AreaChart data={data} />
    </DashboardCard>
  );
}
```

## 4. Data Fetching Strategies for Multiple Dashboard Widgets

### Server-Side Parallel Fetching

```tsx
// app/(dashboard)/data.ts
import { cache } from "react";

export const getDashboardData = cache(async () => {
  const [revenue, users, activity] = await Promise.all([
    fetch(`${process.env.API_BASE_URL}/analytics/revenue`, {
      next: { revalidate: 60 }
    }).then(r => r.json()),
    fetch(`${process.env.API_BASE_URL}/analytics/users`, {
      next: { revalidate: 60 }
    }).then(r => r.json()),
    fetch(`${process.env.API_BASE_URL}/analytics/activity`, {
      next: { revalidate: 30 }
    }).then(r => r.json()),
  ]);

  return { revenue, users, activity };
});
```

### Server Component with Data Loading

```tsx
// app/(dashboard)/page.tsx
export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <>
      <RevenueCard
        amount={data.revenue.amount}
        deltaPercent={data.revenue.deltaPercent}
        className="xl:col-span-2"
      />
      <ActivityChartCard
        data={data.activity}
        className="md:col-span-2 xl:col-span-4"
      />
    </>
  );
}
```

### Client-Side Filter State

For user-controlled filters:
- Keep filter state in a client provider
- Server components read filters from search params or cookies
- Actions or URL updates trigger re-render and refetch with `revalidatePath`

## 5. Performance Optimization for Dashboards with Charts

### Server-Side Data Shaping

Send only what the chart needs:

```tsx
export const getActivitySeries = cache(async () => {
  const res = await fetch(`${process.env.API_BASE_URL}/analytics/activity`, {
    next: { revalidate: 60 },
  });
  const raw = await res.json();

  // Strip unused fields and downsample server-side
  return raw.map(({ ts, sessions }) => ({ date: ts, sessions }));
});
```

### Dynamic Import of Chart Libraries

```tsx
// components/charts/area-chart.tsx
"use client";

import dynamic from "next/dynamic";

const InnerAreaChart = dynamic(
  () => import("./area-chart-inner").then((mod) => mod.AreaChartInner),
  {
    ssr: false,
    loading: () => (
      <div className="h-[220px] w-full rounded-md bg-slate-900/80 animate-pulse" />
    ),
  }
);

export function AreaChart(props) {
  return <InnerAreaChart {...props} />;
}
```

### Avoid Unnecessary Re-renders

- Charts should be pure; parent widgets pass stable props
- Use `useMemo` for derived arrays or color scales
- Wrap chart components in `React.memo` if needed

```tsx
import { memo } from "react";

export const MemoAreaChart = memo(AreaChartInner);
```

### Caching and Revalidation

- Use `next: { revalidate: 30 }` on fetch for near-real-time cards
- For heavy queries, increase revalidation and provide a manual refresh button

```tsx
// app/(dashboard)/actions.ts
"use server";

import { revalidatePath } from "next/cache";

export async function refreshDashboard() {
  revalidatePath("/dashboard");
}
```

## Key Takeaways

1. **Layout Shell Pattern** - Use App Router layout for sidebar/header, CSS Grid for widget placement
2. **Composable Card Primitives** - Create generic card components that can be specialized
3. **Skeleton UI** - Match skeleton shape to actual component dimensions
4. **Parallel Data Fetching** - Use `Promise.all` for independent data fetches
5. **Dynamic Chart Imports** - Lazy-load chart libraries to reduce initial bundle
6. **Server-Side Data Shaping** - Transform data on the server, not client
7. **Caching Strategy** - Different revalidation times for different data freshness needs
