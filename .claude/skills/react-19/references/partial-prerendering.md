# Partial Pre-rendering (PPR)

## Overview

Partial Pre-rendering (PPR) is a Next.js 15+ feature that combines the best of **static site generation (SSG)** and **server-side rendering (SSR)** in a single page. It allows parts of a page to be pre-rendered at build time while other parts remain dynamic.

## Key Concept

PPR enables a page to have:
- **Static shell**: Pre-rendered at build time (instant load)
- **Dynamic holes**: Rendered at request time (personalized content)

This provides fast initial page loads while still supporting dynamic, personalized content.

## How It Works

### Traditional Approach (All or Nothing)

```tsx
// Either fully static (fast but no personalization)
export const dynamic = 'force-static';

// Or fully dynamic (personalized but slower)
export const dynamic = 'force-dynamic';

async function Page() {
  const user = await getCurrentUser(); // Makes entire page dynamic
  const posts = await getPosts(); // Could be static

  return (
    <div>
      <Header user={user} /> {/* Dynamic */}
      <PostList posts={posts} /> {/* Could be static */}
    </div>
  );
}
```

### PPR Approach (Best of Both)

```tsx
// Enable PPR for this route
export const experimental_ppr = true;

async function Page() {
  return (
    <div>
      {/* Static shell - pre-rendered at build time */}
      <StaticNav />
      <StaticSidebar />

      {/* Dynamic holes - rendered at request time */}
      <Suspense fallback={<UserMenuSkeleton />}>
        <UserMenu /> {/* Dynamic: awaits getCurrentUser() */}
      </Suspense>

      <Suspense fallback={<PostsSkeleton />}>
        <PostList /> {/* Could be static or dynamic */}
      </Suspense>
    </div>
  );
}
```

**Result:**
1. User sees static shell instantly (0ms)
2. Dynamic sections stream in as they're ready
3. Overall perceived performance is much better

## Enabling PPR in Next.js

### Global Configuration (next.config.js)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    ppr: 'incremental', // Enable PPR for routes that opt in
  },
};

module.exports = nextConfig;
```

### Per-Route Opt-in

```tsx
// app/dashboard/page.tsx
export const experimental_ppr = true;

export default async function DashboardPage() {
  // Page will use PPR
}
```

## PPR with Suspense Boundaries

PPR works by analyzing `<Suspense>` boundaries to determine what's static vs dynamic:

### Example: Dashboard Page

```tsx
export const experimental_ppr = true;

async function DashboardPage() {
  return (
    <div className="dashboard">
      {/* Static: Pre-rendered at build time */}
      <DashboardHeader />
      <DashboardNav />

      {/* Dynamic: User-specific data */}
      <Suspense fallback={<WelcomeSkeleton />}>
        <WelcomeMessage /> {/* Calls getCurrentUser() */}
      </Suspense>

      {/* Dynamic: Real-time data */}
      <Suspense fallback={<StatsSkeleton />}>
        <RealtimeStats /> {/* Calls getLatestStats() */}
      </Suspense>

      {/* Static: Same for all users */}
      <RecentBlogPosts />
      <Footer />
    </div>
  );
}
```

**Build Output:**
```
Static:
- <DashboardHeader />
- <DashboardNav />
- <RecentBlogPosts />
- <Footer />
- Suspense fallbacks (skeletons)

Dynamic:
- <WelcomeMessage />
- <RealtimeStats />
```

## When to Use PPR

### ✅ Perfect For

1. **Marketing pages with dynamic elements**
   - Static: Hero, features, testimonials
   - Dynamic: User menu, personalized CTAs

2. **Dashboard pages**
   - Static: Navigation, layout, help text
   - Dynamic: User data, real-time stats

3. **E-commerce product pages**
   - Static: Product details, images, reviews
   - Dynamic: Inventory status, personalized recommendations

4. **Blog posts with personalization**
   - Static: Article content, layout
   - Dynamic: Related posts, user comments

### ❌ Don't Use When

1. **Entire page is dynamic** (use SSR instead)
2. **Entire page is static** (use SSG instead)
3. **No Suspense boundaries** (PPR needs boundaries to work)

## PPR Performance Benefits

### Before PPR (Fully Dynamic)
```
Request → Wait for all data → Render entire page → Send to client
         └─────────────────┘
              1200ms
```

### After PPR
```
Request → Send static shell → Stream dynamic sections
         └────┘              └──────────────────────┘
         50ms                    1150ms (parallel)
```

**User sees content at 50ms instead of 1200ms** (24x faster perceived load)

## PPR with React 19.2 Features

### Combining PPR with `<Activity>`

```tsx
export const experimental_ppr = true;

function TabsPage() {
  return (
    <>
      {/* Static: Pre-render all tabs */}
      <Activity mode={tab === 'home' ? 'visible' : 'hidden'}>
        <HomeTab /> {/* Static content */}
      </Activity>

      <Activity mode={tab === 'profile' ? 'visible' : 'hidden'}>
        <Suspense fallback={<ProfileSkeleton />}>
          <ProfileTab /> {/* Dynamic user data */}
        </Suspense>
      </Activity>
    </>
  );
}
```

**Benefits:**
- Instant tab switching (no loading)
- Dynamic tabs still stream when needed
- Best of both worlds

## SlideHeroes Use Cases

### 1. Project Dashboard

```tsx
export const experimental_ppr = true;

async function ProjectDashboard({ params }: Props) {
  const slug = (await params).account;

  return (
    <div>
      {/* Static: Same for all users */}
      <DashboardNav />
      <Sidebar />

      {/* Dynamic: User-specific projects */}
      <Suspense fallback={<ProjectListSkeleton />}>
        <ProjectList accountSlug={slug} />
      </Suspense>

      {/* Dynamic: Real-time collaboration status */}
      <Suspense fallback={<ActivitySkeleton />}>
        <RecentActivity accountSlug={slug} />
      </Suspense>
    </div>
  );
}
```

### 2. AI Canvas Page

```tsx
export const experimental_ppr = true;

async function AICanvasPage() {
  return (
    <div className="canvas-container">
      {/* Static: Toolbar and UI */}
      <Toolbar />
      <ToolPalette />

      {/* Dynamic: User's canvas state */}
      <Suspense fallback={<CanvasSkeleton />}>
        <Canvas />
      </Suspense>

      {/* Dynamic: AI suggestions */}
      <Suspense fallback={<SuggestionsSkeleton />}>
        <AISuggestions />
      </Suspense>
    </div>
  );
}
```

### 3. Pricing Page

```tsx
export const experimental_ppr = true;

async function PricingPage() {
  return (
    <div>
      {/* Static: Pricing tiers and features */}
      <PricingHeader />
      <PricingTiers />
      <FeatureComparison />

      {/* Dynamic: User's current plan */}
      <Suspense fallback={<CurrentPlanSkeleton />}>
        <CurrentPlanBanner />
      </Suspense>

      {/* Static: FAQ */}
      <FAQ />
      <Footer />
    </div>
  );
}
```

## Debugging PPR

### Check What's Static vs Dynamic

```tsx
// Set environment variable to see PPR boundaries
// In .env.local:
NEXT_PUBLIC_DEBUG_PPR=true
```

### Build Analysis

```bash
pnpm build

# Output will show:
# ○ Static (pre-rendered)
# ƒ Dynamic (server-rendered)
# ⊙ Partial Pre-rendering
```

### DevTools Indicators

Next.js DevTools show PPR boundaries:
- Green: Pre-rendered static content
- Yellow: Dynamic Suspense boundaries
- Red: Blocking dynamic content (optimize with Suspense)

## Common Patterns

### Pattern 1: Static Layout + Dynamic Content

```tsx
export const experimental_ppr = true;

function BlogPost({ params }: Props) {
  return (
    <article>
      {/* Static */}
      <BlogHeader />

      {/* Dynamic */}
      <Suspense fallback={<ContentSkeleton />}>
        <BlogContent slug={params.slug} />
      </Suspense>

      {/* Static */}
      <BlogFooter />
    </article>
  );
}
```

### Pattern 2: Nested Suspense

```tsx
export const experimental_ppr = true;

function Dashboard() {
  return (
    <div>
      <Suspense fallback={<UserInfoSkeleton />}>
        <UserInfo />

        {/* Nested: More granular loading */}
        <Suspense fallback={<StatsSkeleton />}>
          <UserStats />
        </Suspense>
      </Suspense>
    </div>
  );
}
```

### Pattern 3: Parallel Loading

```tsx
export const experimental_ppr = true;

function Page() {
  return (
    <div>
      {/* These load in parallel */}
      <Suspense fallback={<Skeleton1 />}>
        <DynamicSection1 />
      </Suspense>

      <Suspense fallback={<Skeleton2 />}>
        <DynamicSection2 />
      </Suspense>

      <Suspense fallback={<Skeleton3 />}>
        <DynamicSection3 />
      </Suspense>
    </div>
  );
}
```

## Migration Strategy

### Step 1: Identify Static vs Dynamic Content

Audit your pages:
- What's the same for all users? → Static
- What's user-specific or real-time? → Dynamic

### Step 2: Add Suspense Boundaries

Wrap dynamic sections in `<Suspense>`:

```tsx
// Before
async function Page() {
  const user = await getCurrentUser();
  return <UserInfo user={user} />;
}

// After
function Page() {
  return (
    <Suspense fallback={<UserInfoSkeleton />}>
      <UserInfo />
    </Suspense>
  );
}

async function UserInfo() {
  const user = await getCurrentUser();
  return <div>{user.name}</div>;
}
```

### Step 3: Enable PPR

```tsx
export const experimental_ppr = true;
```

### Step 4: Test and Optimize

```bash
pnpm build
pnpm start

# Check Core Web Vitals:
# - LCP (Largest Contentful Paint)
# - FID (First Input Delay)
# - CLS (Cumulative Layout Shift)
```

## Best Practices

1. **Use Suspense boundaries strategically** - Don't wrap every element
2. **Create meaningful skeletons** - Match the actual content layout
3. **Optimize dynamic queries** - Use database indexes, caching
4. **Monitor performance** - Track LCP and TTFB metrics
5. **Start with high-traffic pages** - Biggest impact on user experience

## Limitations

1. **Requires Next.js 15+** (Next.js 14 has experimental support)
2. **Needs `<Suspense>` boundaries** - Won't work without them
3. **Static content can't use dynamic data** - Must choose carefully
4. **Build time increases** - More pre-rendering work

## Resources

- [Next.js PPR Documentation](https://nextjs.org/docs/app/building-your-application/rendering/partial-prerendering)
- [Vercel Blog: PPR Announcement](https://vercel.com/blog/partial-prerendering-with-next-js-creating-a-new-default-rendering-model)
