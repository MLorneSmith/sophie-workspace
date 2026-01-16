# Perplexity Research: Dashboard Best Practices

**Query**: Best practices for building a user dashboard in Next.js 15 with React Server Components
**Model**: sonar-pro
**Date**: 2025-12-17

## Key Findings

### 1. Data Loading Patterns for Multiple Widgets

Fetch data directly in server components using `async/await` for each widget, colocating fetches close to their usage:

```tsx
// app/dashboard/page.tsx
import { verifySession } from '@/lib/dal';

export default async function DashboardPage() {
  const session = await verifySession();
  const userPosts = await getUserPosts(session.userId);
  const recentInvoices = await getUserInvoices(session.userId);

  return (
    <div>
      <PostsTable posts={userPosts} />
      <InvoicesList invoices={recentInvoices} />
    </div>
  );
}
```

### 2. Parallel Data Fetching

Use `Promise.all` for parallel fetches - reduces total fetch time significantly:

```tsx
export default async function DashboardPage() {
  const session = await verifySession();
  const [userPosts, recentActivity, invoices] = await Promise.all([
    getUserPosts(session.userId),
    getRecentActivity(session.userId),
    getUserInvoices(session.userId)
  ]);
  // Render widgets...
}
```

**Performance**: Three 200ms requests complete in ~200ms total vs. ~600ms sequential.

### 3. Progressive Loading with Suspense

Wrap widgets in `<Suspense>` boundaries for progressive rendering:

```tsx
import { Suspense } from 'react';

export default async function DashboardPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Suspense fallback={<PostsSkeleton />}>
        <PostsWidget />
      </Suspense>
      <Suspense fallback={<ActivitySkeleton />}>
        <ActivityFeed />
      </Suspense>
    </div>
  );
}
```

Each widget is an async RSC fetching its own data:

```tsx
// app/dashboard/posts-widget.tsx (Server Component)
export default async function PostsWidget() {
  const session = await verifySession();
  const posts = await getUserPosts(session.userId);
  return <PostsTable posts={posts} />;
}
```

### 4. Component Organization Patterns

Feature slices in `app/` directory:

```
app/
  dashboard/
    page.tsx          # Orchestrates layout + Suspense
    posts-widget/
      page.tsx        # RSC fetches posts
    activity-feed/
      page.tsx        # RSC fetches activity
    layout.tsx        # Shared dashboard header/nav
lib/
  dal.ts             # verifySession(), getUserPosts()
  auth.ts
```

Key principles:
- Use layouts for persistent UI
- Keep RSCs data-only
- Hoist interactivity to client boundaries

### 5. Recent Activity Feed Implementation

Build as a dedicated RSC widget with Suspense:

```tsx
// app/dashboard/activity-feed/page.tsx (Server Component)
export default async function ActivityFeed({ userId }: { userId: string }) {
  const activities = await getRecentActivity(userId, { limit: 10 });
  if (!activities?.length) return <p>No recent activity</p>;

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="p-4 border rounded">
          <p>{activity.message} - {activity.timestamp}</p>
        </div>
      ))}
    </div>
  );
}
```

## Application to SlideHeroes Dashboard

### Recommended Pattern for /home Page

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

  return (
    <>
      <HomeLayoutPageHeader title="Dashboard" description="..." />
      <PageBody>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Suspense fallback={<CourseProgressSkeleton />}>
            <CourseProgressWidget userId={auth.data.id} />
          </Suspense>
          <Suspense fallback={<AssessmentSkeleton />}>
            <AssessmentSpiderWidget userId={auth.data.id} />
          </Suspense>
          <Suspense fallback={<KanbanSkeleton />}>
            <KanbanSummaryWidget userId={auth.data.id} />
          </Suspense>
          <Suspense fallback={<ActivitySkeleton />}>
            <RecentActivityWidget userId={auth.data.id} />
          </Suspense>
          {/* ... more widgets */}
        </div>
      </PageBody>
    </>
  );
}
```

### Data Loading Strategy

Each widget as a server component:
```tsx
// apps/web/app/home/(user)/_components/course-progress-widget.tsx
import 'server-only';

export async function CourseProgressWidget({ userId }: { userId: string }) {
  const client = getSupabaseServerClient();

  const { data: courseProgress } = await client
    .from('course_progress')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  return <RadialProgressChart progress={courseProgress} />;
}
```
