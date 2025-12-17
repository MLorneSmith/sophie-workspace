# Feature Plan: Dashboard Page Layout and Data Infrastructure

**Issue**: #1269
**Parent**: #1268
**Research Manifest**: #1267
**Phase**: 1 (Foundation)
**Effort**: M (Medium)
**Dependencies**: None
**Status**: Ready for Implementation

---

## Overview

Create the dashboard page structure with responsive grid layout, Suspense boundaries for each widget slot, skeleton loading states, and the shared data loading infrastructure. This is the foundation for all dashboard widgets and establishes the page architecture pattern.

The dashboard will display 7 widgets arranged in a responsive 3-column grid (mobile: 1 column, tablet: 2 columns, desktop: 3 columns). Each widget will have:
- Individual Suspense boundary for independent loading
- Skeleton component during data fetch
- Error boundary handling
- Responsive card container

## Solution Approach

### Page Structure Pattern
Based on research manifest patterns, the page will follow the async RSC pattern:
1. Require authentication at page entry
2. Fetch page-level data in parallel using `Promise.all()`
3. Wrap each widget in Suspense boundary for progressive loading
4. Use layout grid with responsive breakpoints

```tsx
// apps/web/app/home/(user)/page.tsx
import { Suspense } from 'react';
import { requireUser } from '@kit/supabase/require-user';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

export default async function UserHomePage() {
  const client = getSupabaseServerClient();
  const auth = await requireUser(client);

  if (auth.error) {
    redirect(auth.redirectTo);
  }

  const userId = auth.data.id;

  return (
    <>
      <HomeLayoutPageHeader title="Dashboard" subtitle="Welcome back!" />
      <PageBody>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Widget 1 - Course Progress */}
          <Suspense fallback={<WidgetSkeleton />}>
            <CourseProgressWidget userId={userId} />
          </Suspense>

          {/* Widget 2 - Assessment Spider */}
          <Suspense fallback={<WidgetSkeleton />}>
            <AssessmentSpiderWidget userId={userId} />
          </Suspense>

          {/* Widget 3 - Kanban Summary */}
          <Suspense fallback={<WidgetSkeleton />}>
            <KanbanSummaryWidget userId={userId} />
          </Suspense>

          {/* Widget 4 - Quick Actions */}
          <Suspense fallback={<WidgetSkeleton />}>
            <QuickActionsWidget userId={userId} />
          </Suspense>

          {/* Widget 5 - Coaching Sessions */}
          <Suspense fallback={<WidgetSkeleton />}>
            <CoachingWidget userId={userId} />
          </Suspense>

          {/* Widget 6 - Recent Activity */}
          <Suspense fallback={<WidgetSkeleton />}>
            <RecentActivityWidget userId={userId} />
          </Suspense>

          {/* Widget 7 - Presentation Table (spans 3 columns) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <Suspense fallback={<WidgetSkeleton />}>
              <PresentationTableWidget userId={userId} />
            </Suspense>
          </div>
        </div>
      </PageBody>
    </>
  );
}
```

### Widget Skeleton Component
Provides consistent loading state for all widgets:

```tsx
// apps/web/app/home/(user)/_components/widgets/widget-skeleton.tsx
import { Skeleton } from '@kit/ui/skeleton';
import { Card, CardContent, CardHeader } from '@kit/ui/card';

export function WidgetSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}
```

### Shared Data Loader
Centralized loader for page-level data that widgets might need:

```tsx
// apps/web/app/home/(user)/_lib/server/dashboard.loader.ts
import 'server-only';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import type { SupabaseClient } from '@kit/supabase/types';

export async function loadDashboardPageData(client: SupabaseClient, userId: string) {
  // Parallel fetching for dashboard-wide data
  // Individual widgets fetch their own specific data
  // This is for shared/aggregated data if needed in future

  return {
    userId,
    fetchedAt: new Date(),
  };
}
```

## Research Applied

### From Manifest
- **Page Structure Pattern**: Async RSC with `requireUser()` authentication
- **Suspense Boundaries**: Each widget gets individual Suspense boundary for progressive loading
- **Parallel Data Fetching**: Use `Promise.all()` for independent widget data loads
- **Grid Layout**: Responsive 3-column layout (mobile: 1, tablet: 2, desktop: 3)

### From Frontend Design Skill
- **shadcn/ui Foundation**: Build on Card, Skeleton, and layout components from @kit/ui
- **Responsive Design**: Use Tailwind grid system (grid-cols-1, md:grid-cols-2, lg:grid-cols-3)
- **Consistent Spacing**: Gap-6 between widgets, consistent padding in cards
- **Typography**: Use existing page header component for title/subtitle

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `apps/web/app/home/(user)/page.tsx` | Enhance existing page with layout and Suspense boundaries |
| `apps/web/app/home/(user)/_components/widgets/widget-skeleton.tsx` | Reusable skeleton component for all widget loading states |
| `apps/web/app/home/(user)/_lib/server/dashboard.loader.ts` | Shared data loader for dashboard-wide data |

### Modified Files

| File | Changes |
|------|---------|
| `apps/web/app/home/(user)/page.tsx` | Convert to async component with grid layout and Suspense boundaries |

## Implementation Tasks

### Task 1: Create Widget Skeleton Component
- [ ] Create `widget-skeleton.tsx` with Card, CardHeader, CardContent
- [ ] Use Skeleton components for header and content areas
- [ ] Ensure consistent height with actual widgets
- [ ] Test responsiveness on mobile/tablet/desktop
- [ ] Add `data-testid="widget-skeleton"` for E2E tests

### Task 2: Enhance Dashboard Page Layout
- [ ] Convert page to async server component
- [ ] Add `requireUser()` authentication check with redirect
- [ ] Create 3-column grid layout with Tailwind classes
- [ ] Implement `gap-6` spacing between widgets
- [ ] Add Suspense boundary for each widget slot
- [ ] Pass `userId` to all widget components
- [ ] Ensure responsive breakpoints (mobile: col-span-1, tablet: col-span-2, desktop: col-span-3)
- [ ] Add presentation table widget in row 3 spanning full width
- [ ] Test that skeleton displays during loading

### Task 3: Create Shared Data Loader
- [ ] Create `dashboard.loader.ts` with `'use server'` directive
- [ ] Add function signature `loadDashboardPageData(client, userId)`
- [ ] Prepare structure for future dashboard-wide data needs
- [ ] Export from loader module for widget components

### Task 4: Add Page Header
- [ ] Ensure `HomeLayoutPageHeader` component displays above grid
- [ ] Set title to "Dashboard"
- [ ] Set subtitle to welcome message
- [ ] Verify styling matches team account header pattern

## Validation Commands

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint:fix

# Build
pnpm build

# Local testing
pnpm dev
# Navigate to /home and verify layout displays correctly
# Verify skeleton appears briefly when page loads
# Verify widgets appear as they load
# Test responsive layout on different screen sizes
```

## Acceptance Criteria

- [ ] Page renders with 3-column grid layout on desktop
- [ ] Grid collapses to 2 columns on tablet, 1 column on mobile
- [ ] Suspense boundaries wrap each widget slot
- [ ] Widget skeleton components display during loading
- [ ] All 7 widget slots have placeholder Suspense boundaries
- [ ] Presentation table spans full width in row 3
- [ ] TypeScript passes with no errors
- [ ] Page requires authentication (redirects to login if not authenticated)
- [ ] Page header displays with title and subtitle
- [ ] Responsive layout tested on mobile (375px), tablet (768px), desktop (1024px+)
- [ ] Gap spacing is consistent (6 units) between all widgets
- [ ] Each widget receives `userId` prop correctly
- [ ] E2E test can select widget skeletons by data-testid

---

*Plan generated by initiative-planning agent*
*Skills used: frontend-design*
*Research conducted: No additional research needed - manifest provided patterns*
