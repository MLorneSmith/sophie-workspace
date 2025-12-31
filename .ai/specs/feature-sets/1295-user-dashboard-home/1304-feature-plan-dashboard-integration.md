# Feature Plan: Dashboard Integration

**Issue**: #1304
**Parent**: #1295
**Research Manifest**: #1294
**Phase**: 3
**Effort**: M (Medium)
**Dependencies**:
- #1296 (Dashboard Data Loader)
- #1297 (Course Progress Card)
- #1298 (Assessment Spider Card)
- #1299 (Kanban Summary Card)
- #1300 (Recent Activity Feed)
- #1301 (Quick Actions Panel)
- #1302 (Coaching Sessions Card)
- #1303 (Presentations Table)

---

## Overview

Update `apps/web/app/home/(user)/page.tsx` to integrate all dashboard components with Suspense boundaries, responsive grid layout, and proper loading states. Implement the complete dashboard layout with 3 rows of components:

**Layout:**
- Row 1: Course Progress | Assessment Spider | Kanban Summary
- Row 2: Recent Activity | Quick Actions | Coaching Sessions
- Row 3: Presentations Table (full width)

## Solution Approach

**Architecture Pattern**: RSC Page with Suspense Boundaries

- Server component page shell
- Import dashboard loader for data fetching
- Wrap each card in Suspense boundary for independent loading
- Use CSS Grid for responsive layout
- Add skeleton loaders for each card while loading
- Handle errors gracefully with error boundaries
- Mobile-responsive breakpoints

**Key Design Decisions**:
- Suspense boundaries allow parallel component loading
- Skeleton loaders prevent CLS (Cumulative Layout Shift)
- Grid layout responsive: stacks on mobile, 3-column on desktop
- Error boundaries catch individual component failures
- Page transitions smooth with streaming

## Research Applied

### From Manifest
- Use `Promise.all` in loader for parallel data fetching
- Suspense boundaries for independent widget loading
- Skeleton loaders prevent layout shift
- RSC pattern with server-side rendering

### From Skills
- React Server Components for efficient rendering
- Suspense boundaries and streaming
- Responsive CSS Grid layouts
- Error handling patterns

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `apps/web/app/home/(user)/_components/dashboard-skeleton.tsx` | Skeleton loaders for each dashboard card |
| `apps/web/app/home/(user)/_components/card-error-boundary.tsx` | Error boundary for individual cards |

### Modified Files
| File | Changes |
|------|---------|
| `apps/web/app/home/(user)/page.tsx` | Complete page implementation with layout, Suspense, and component integration |

## Implementation Tasks

### Task 1: Create Skeleton Loaders
- [ ] Create `DashboardSkeleton` component with card-sized loaders
- [ ] Create `CardSkeleton` for individual card placeholders
- [ ] Match skeleton to final card height
- [ ] Use Skeleton component from shadcn
- [ ] Prevent layout shift with fixed dimensions

**File**: `apps/web/app/home/(user)/_components/dashboard-skeleton.tsx`

```typescript
import { Card, CardContent, CardHeader } from '@kit/ui/card';
import { Skeleton } from '@kit/ui/skeleton';

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card className={`h-[320px] ${className}`}>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="flex-1">
        <Skeleton className="h-full w-full rounded" />
      </CardContent>
    </Card>
  );
}

export function TableSkeleton() {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Task 2: Create Error Boundary for Cards
- [ ] Implement error boundary component
- [ ] Catch errors from individual cards
- [ ] Display user-friendly error message
- [ ] Allow retry action
- [ ] Don't break entire page on card error

**File**: `apps/web/app/home/(user)/_components/card-error-boundary.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { Card, CardContent } from '@kit/ui/card';

interface CardErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function CardErrorBoundary({
  children,
  fallback,
}: CardErrorBoundaryProps) {
  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('Dashboard card error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <Card className="h-[320px] flex items-center justify-center">
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Failed to load this component
              </p>
            </CardContent>
          </Card>
        )
      );
    }

    return this.props.children;
  }
}
```

### Task 3: Implement Dashboard Page Layout
- [ ] Update page component with grid layout
- [ ] Import all dashboard components
- [ ] Call dashboard loader in page
- [ ] Wrap each component in Suspense boundary
- [ ] Add Suspense fallback (skeleton loaders)
- [ ] Configure responsive grid

**File**: `apps/web/app/home/(user)/page.tsx`

```typescript
import { Suspense } from 'react';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { getCurrentUser } from '@kit/auth';
import { loadDashboardData } from './_lib/server/dashboard.loader';
import { CourseProgressCard } from './_components/course-progress-card';
import { AssessmentSpiderCard } from './_components/assessment-spider-card';
import { KanbanSummaryCard } from './_components/kanban-summary-card';
import { RecentActivityFeed } from './_components/recent-activity-feed';
import { QuickActionsPanel } from './_components/quick-actions-panel';
import { CoachingSessionsCard } from './_components/coaching-sessions-card';
import { PresentationsTable } from './_components/presentations-table';
import { CardSkeleton, TableSkeleton } from './_components/dashboard-skeleton';
import { CardErrorBoundary } from './_components/card-error-boundary';

export const metadata = {
  title: 'Dashboard',
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const client = getSupabaseServerClient();

  const dashboardData = await loadDashboardData(client, user.id);

  return (
    <div className="space-y-8 pb-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your learning overview.
        </p>
      </div>

      {/* Row 1: Course Progress, Assessment, Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CardErrorBoundary>
          <Suspense fallback={<CardSkeleton />}>
            <CourseProgressCard data={dashboardData.courseProgress} />
          </Suspense>
        </CardErrorBoundary>

        <CardErrorBoundary>
          <Suspense fallback={<CardSkeleton />}>
            <AssessmentSpiderCard data={dashboardData.surveyScores} />
          </Suspense>
        </CardErrorBoundary>

        <CardErrorBoundary>
          <Suspense fallback={<CardSkeleton />}>
            <KanbanSummaryCard data={dashboardData.taskCounts} />
          </Suspense>
        </CardErrorBoundary>
      </div>

      {/* Row 2: Recent Activity, Quick Actions, Coaching Sessions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CardErrorBoundary>
          <Suspense fallback={<CardSkeleton />}>
            <RecentActivityFeed
              initialActivities={dashboardData.recentActivity}
              hasMore={dashboardData.recentActivity.length >= 8}
            />
          </Suspense>
        </CardErrorBoundary>

        <CardErrorBoundary>
          <Suspense fallback={<CardSkeleton />}>
            <QuickActionsPanel
              courseInProgress={
                dashboardData.courseProgress.completionPercentage > 0
              }
              assessmentCompleted={
                dashboardData.surveyScores.completedAt !== null
              }
              hasPresentationDrafts={dashboardData.presentations.length > 0}
            />
          </Suspense>
        </CardErrorBoundary>

        <CardErrorBoundary>
          <Suspense fallback={<CardSkeleton />}>
            <CoachingSessionsCard sessions={dashboardData.upcomingCoachingSessions} />
          </Suspense>
        </CardErrorBoundary>
      </div>

      {/* Row 3: Presentations Table (full width) */}
      <div className="grid grid-cols-1">
        <CardErrorBoundary>
          <Suspense fallback={<TableSkeleton />}>
            <PresentationsTable presentations={dashboardData.presentations} />
          </Suspense>
        </CardErrorBoundary>
      </div>
    </div>
  );
}
```

### Task 4: Responsive Grid Configuration
- [ ] Configure grid for 1 column on mobile (md: breakpoint)
- [ ] Configure 3 columns on tablet/desktop
- [ ] Test responsive layout on multiple viewports
- [ ] Ensure spacing (gap-6) matches design
- [ ] Test full-width table row

### Task 5: Suspense and Error Handling
- [ ] Wrap each component in Suspense
- [ ] Provide appropriate skeleton fallback
- [ ] Wrap each component in error boundary
- [ ] Test error scenarios (API failure, etc.)
- [ ] Verify page doesn't break on single card error

### Task 6: Metadata and Page Title
- [ ] Add page metadata with title
- [ ] Update breadcrumb navigation if needed
- [ ] Add welcome message
- [ ] Verify page header displays correctly

### Task 7: Type Safety and Integration
- [ ] Run typecheck on full page
- [ ] Verify all component props match types
- [ ] Test data flow from loader to components
- [ ] No `any` types

### Task 8: Performance and Optimization
- [ ] Verify page uses streaming with Suspense
- [ ] Check that parallel fetching is working
- [ ] Test Core Web Vitals with Lighthouse
- [ ] Optimize image loading if needed
- [ ] Verify no N+1 queries

## Validation Commands

```bash
pnpm typecheck
pnpm lint:fix
pnpm format:fix
pnpm build
pnpm dev        # Test in development to verify layout
```

## Acceptance Criteria

- [ ] Page file updated at `apps/web/app/home/(user)/page.tsx`
- [ ] Implements 3-row grid layout
- [ ] Row 1: Course Progress | Assessment | Kanban
- [ ] Row 2: Recent Activity | Quick Actions | Coaching Sessions
- [ ] Row 3: Presentations Table (full width)
- [ ] Each component wrapped in Suspense boundary
- [ ] Skeleton loaders display while loading
- [ ] Error boundaries prevent individual card failures
- [ ] Grid responsive: 1 col mobile, 3 col desktop
- [ ] Page header with title and welcome message
- [ ] Metadata includes page title
- [ ] All components receive correct data from loader
- [ ] TypeScript strict mode passes
- [ ] All validation commands pass
- [ ] Dashboard loads in <2s (measured with Lighthouse)
- [ ] No layout shift during loading (CLS compliant)

---
*Plan generated by initiative-planning agent*
*Skills used: frontend-design*
*Research conducted: no*
