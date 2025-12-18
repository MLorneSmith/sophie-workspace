# Feature Plan: Dashboard Page Integration

**Issue**: #1289
**Parent**: #1280
**Research Manifest**: #1279
**Phase**: 3 - Integration
**Effort**: M (Medium)
**Dependencies**: #1281, #1282, #1283, #1284, #1285, #1286, #1287, #1288

---

## Overview

Integrate all dashboard components into the main `/home` page with responsive 3-column grid layout and Suspense boundaries. This final integration phase assembles the individual card and table components into a cohesive dashboard experience.

The layout follows a responsive grid pattern:
- **Desktop (3 columns)**: Row 1 has 3 cards, Row 2 has 3 cards, Row 3 has full-width table
- **Mobile (1 column)**: All components stack vertically
- **Tablet (2 columns)**: Adaptable layout

## Solution Approach

### Layout Grid Pattern

**Desktop (md breakpoint and up)**:
```
┌─────────────┬─────────────┬──────────────┐
│   Course    │  Spider     │   Kanban     │  Row 1
│  Progress   │  Diagram    │   Summary    │
├─────────────┴─────────────┴──────────────┤
│   Activity Feed  │   Quick    │  Coaching │  Row 2
│                  │   Actions  │  Sessions │
├──────────────────────────────────────────┤
│      Presentations Table (Full Width)     │  Row 3
└──────────────────────────────────────────┘
```

**Mobile (single column)**:
```
┌──────────────────────┐
│  Course Progress     │
├──────────────────────┤
│  Spider Diagram      │
├──────────────────────┤
│  Kanban Summary      │
├──────────────────────┤
│  Activity Feed       │
├──────────────────────┤
│  Quick Actions       │
├──────────────────────┤
│  Coaching Sessions   │
├──────────────────────┤
│ Presentations Table  │
└──────────────────────┘
```

### Key Implementation Details

1. **Server Component Page**
   - Use async server component at `/home/(user)/page.tsx`
   - Call `loadDashboardData()` to fetch all data in parallel
   - Pass data to client components via props

2. **Suspense Boundaries**
   - Wrap each card in Suspense with skeleton fallback
   - Prevents layout shift and enables progressive rendering
   - Each card loads independently

3. **Grid Layout**
   - Use `grid-cols-1 md:grid-cols-3` for responsive columns
   - Card gap: `gap-4` for consistent spacing
   - Full-width table: `md:col-span-3`

4. **Page Header**
   - Maintain existing page title/header
   - Add optional date/greeting
   - Keep consistent with team account pages

5. **Data Passing**
   - Server component fetches all data
   - Passes each data set to respective client component
   - No client-side fetching needed

### Code Pattern

```typescript
// apps/web/app/home/(user)/page.tsx
import { Suspense } from 'react';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { getCurrentUser } from '@kit/supabase/queries';
import { loadDashboardData } from './_lib/server/dashboard.loader';
import { CourseProgressCard } from './_components/dashboard/course-progress-card';
import { AssessmentSpiderCard } from './_components/dashboard/assessment-spider-card';
import { KanbanSummaryCard } from './_components/dashboard/kanban-summary-card';
import { RecentActivityFeed } from './_components/dashboard/recent-activity-feed';
import { QuickActionsPanel } from './_components/dashboard/quick-actions-panel';
import { CoachingSessionsCard } from './_components/dashboard/coaching-sessions-card';
import { PresentationsTable } from './_components/dashboard/presentations-table';
import { CardSkeleton, FullWidthTableSkeleton } from './_components/dashboard/skeletons';

export const metadata = {
  title: 'Dashboard',
};

async function DashboardPage() {
  const client = getSupabaseServerClient();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('User not found');
  }

  const [courseProgress, surveyScores, kanbanSummary, recentActivity, presentations] =
    await loadDashboardData(client, user.id);

  return (
    <main className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground">Your learning dashboard</p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {/* Row 1: Three cards */}
        <Suspense fallback={<CardSkeleton />}>
          <CourseProgressCard progress={courseProgress} />
        </Suspense>

        <Suspense fallback={<CardSkeleton />}>
          <AssessmentSpiderCard scores={surveyScores} />
        </Suspense>

        <Suspense fallback={<CardSkeleton />}>
          <KanbanSummaryCard summary={kanbanSummary} />
        </Suspense>

        {/* Row 2: Three cards */}
        <Suspense fallback={<CardSkeleton />}>
          <RecentActivityFeed activities={recentActivity} />
        </Suspense>

        <Suspense fallback={<CardSkeleton />}>
          <QuickActionsPanel />
        </Suspense>

        <Suspense fallback={<CardSkeleton />}>
          <CoachingSessionsCard />
        </Suspense>

        {/* Row 3: Full-width table */}
        <Suspense fallback={<FullWidthTableSkeleton />}>
          <div className="md:col-span-3">
            <PresentationsTable presentations={presentations} />
          </div>
        </Suspense>
      </div>
    </main>
  );
}

export default DashboardPage;
```

### Skeleton Components

Create skeleton loaders for smooth loading states:

```typescript
// apps/web/app/home/(user)/_components/dashboard/skeletons.tsx
import { Skeleton } from '@kit/ui/skeleton';
import { Card, CardContent, CardHeader } from '@kit/ui/card';

export function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-32 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}

export function FullWidthTableSkeleton() {
  return (
    <Card className="md:col-span-3">
      <CardHeader>
        <Skeleton className="h-6 w-24" />
      </CardHeader>
      <CardContent className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}
```

## Files to Create/Modify

### Modified Files
| File | Changes |
|------|---------|
| `apps/web/app/home/(user)/page.tsx` | Import dashboard components and data loader, update page layout |

### New Files
| File | Purpose |
|------|---------|
| `apps/web/app/home/(user)/_components/dashboard/skeletons.tsx` | Loading skeleton components |

### Already Created Files
| File | Purpose |
|------|---------|
| `apps/web/app/home/(user)/_lib/server/dashboard.loader.ts` | Data fetching (#1281) |
| `apps/web/app/home/(user)/_components/dashboard/course-progress-card.tsx` | Course progress chart (#1282) |
| `apps/web/app/home/(user)/_components/dashboard/assessment-spider-card.tsx` | Spider diagram (#1283) |
| `apps/web/app/home/(user)/_components/dashboard/kanban-summary-card.tsx` | Task summary (#1284) |
| `apps/web/app/home/(user)/_components/dashboard/recent-activity-feed.tsx` | Activity timeline (#1285) |
| `apps/web/app/home/(user)/_components/dashboard/quick-actions-panel.tsx` | Action buttons (#1286) |
| `apps/web/app/home/(user)/_components/dashboard/coaching-sessions-card.tsx` | Coaching booking (#1287) |
| `apps/web/app/home/(user)/_components/dashboard/presentations-table.tsx` | Presentations list (#1288) |

## Implementation Tasks

### Task 1: Update page metadata and structure
- [ ] Open `apps/web/app/home/(user)/page.tsx`
- [ ] Update page metadata (title: "Dashboard")
- [ ] Add page header with welcome message
- [ ] Maintain responsive page structure

### Task 2: Implement data fetching
- [ ] Import `getSupabaseServerClient` from @kit/supabase
- [ ] Import `getCurrentUser` from @kit/supabase/queries
- [ ] Import `loadDashboardData` from dashboard.loader
- [ ] Call `loadDashboardData()` with user ID
- [ ] Destructure returned data tuple

### Task 3: Create skeleton loading components
- [ ] Create file `apps/web/app/home/(user)/_components/dashboard/skeletons.tsx`
- [ ] Implement `CardSkeleton` component
- [ ] Implement `FullWidthTableSkeleton` component
- [ ] Match skeleton dimensions to actual components

### Task 4: Implement main grid layout
- [ ] Create grid with `grid-cols-1 md:grid-cols-3`
- [ ] Add gap spacing: `gap-4`
- [ ] Arrange components: Row 1 (3 cards), Row 2 (3 cards), Row 3 (table)
- [ ] Use `md:col-span-3` for full-width table

### Task 5: Add Suspense boundaries
- [ ] Wrap each card in Suspense with CardSkeleton fallback
- [ ] Wrap Activity Feed in Suspense (spans full width - Row 2 first column)
- [ ] Wrap table in Suspense with FullWidthTableSkeleton fallback
- [ ] Ensure progressive rendering works correctly

### Task 6: Import all components
- [ ] Import all dashboard card components
- [ ] Import skeleton components
- [ ] Import from correct paths (_components, _lib/server)
- [ ] Verify all imports resolve

### Task 7: Testing and validation
- [ ] Run `pnpm typecheck` and verify no type errors
- [ ] Run `pnpm lint:fix` and ensure code style compliance
- [ ] Start dev server: `pnpm dev`
- [ ] Navigate to `/home`
- [ ] Verify all components render
- [ ] Test on mobile (single column)
- [ ] Test on tablet (2 columns)
- [ ] Test on desktop (3 columns)
- [ ] Verify data loads correctly
- [ ] Verify skeletons appear during loading

### Task 8: Performance verification
- [ ] Check page load time (target: < 2s)
- [ ] Verify parallel data fetching (Promise.all)
- [ ] Check Core Web Vitals
- [ ] Test with slow network (throttle in DevTools)

## Validation Commands

```bash
pnpm typecheck
pnpm lint:fix
pnpm format:fix
pnpm --filter web test:unit
pnpm build
```

## Acceptance Criteria

- [ ] All 7 components render on dashboard
- [ ] Responsive layout: 1 column mobile, 3 columns desktop
- [ ] Suspense boundaries show skeletons during loading
- [ ] Data loads in parallel (Promise.all)
- [ ] Activity Feed spans correct width (Row 2)
- [ ] Presentations Table spans full width (Row 3)
- [ ] Page metadata set correctly
- [ ] All links and buttons work
- [ ] Responsive layout tested on multiple screen sizes
- [ ] Page load time < 2 seconds
- [ ] All validation commands pass without errors

---

*Plan generated by initiative-planning agent*
*Skills used: frontend-design*
*Research conducted: no*
