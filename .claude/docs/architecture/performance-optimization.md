# Performance Optimization

## Performance Optimization Strategies

Our application implements various performance optimization strategies across different layers:

1. **Build-time Optimization**
2. **Server-side Optimization**
3. **Client-side Optimization**
4. **Network Optimization**
5. **Database Optimization**

## Build-time Optimization

### Code Splitting

Use dynamic imports to split code into smaller chunks:

```tsx
// Dynamic import example
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
});
```

### Tree Shaking

Ensure proper exports to enable tree shaking:

```tsx
// Good: Named exports
export function Button() { /* ... */ }
export function Input() { /* ... */ }

// Avoid: Default exports of multiple components
export default { Button, Input };
```

## Server-side Optimization

### Static Generation

Use static generation for pages that don't need dynamic data:

```tsx
// Static generation with revalidation
export const revalidate = 3600; // Revalidate every hour

export default async function BlogPage() {
  const posts = await getBlogPosts();
  return <BlogList posts={posts} />;
}
```

### Streaming

Use streaming for progressive rendering:

```tsx
import { Suspense } from 'react';

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Critical content loads first */}
      <UserInfo />
      
      {/* Non-critical content streams in */}
      <Suspense fallback={<p>Loading stats...</p>}>
        <UserStats />
      </Suspense>
      
      <Suspense fallback={<p>Loading activity...</p>}>
        <RecentActivity />
      </Suspense>
    </div>
  );
}
```

## Client-side Optimization

### Memoization

Use memoization to prevent unnecessary re-renders:

```tsx
import { useMemo, useCallback } from 'react';

function ExpensiveComponent({ data, onAction }) {
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return expensiveCalculation(data);
  }, [data]);
  
  // Memoize callbacks
  const handleAction = useCallback(() => {
    onAction(data.id);
  }, [onAction, data.id]);
  
  return (
    <div onClick={handleAction}>
      {processedData.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### Virtualization

Use virtualization for long lists:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }) {
  const parentRef = useRef(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });
  
  return (
    <div ref={parentRef} style={{ height: '500px', overflow: 'auto' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Network Optimization

### Image Optimization

Use Next.js Image component for optimized images:

```tsx
import Image from 'next/image';

function OptimizedImage() {
  return (
    <Image
      src="/large-image.jpg"
      alt="Description"
      width={800}
      height={600}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
      priority={true} // For LCP images
    />
  );
}
```

### Font Optimization

Use Next.js Font optimization:

```tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export default function Layout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

## Database Optimization

### Query Optimization

Optimize database queries:

```tsx
// Good: Select only needed fields
const { data } = await supabase
  .from('users')
  .select('id, name, email')
  .eq('status', 'active');

// Avoid: Selecting all fields
const { data } = await supabase
  .from('users')
  .select('*');
```

### Indexing

Ensure proper database indexing:

```sql
-- Create index for frequently queried columns
CREATE INDEX idx_users_email ON users(email);

-- Create composite index for common query patterns
CREATE INDEX idx_posts_user_created_at ON posts(user_id, created_at DESC);
```

## Performance Monitoring

Implement performance monitoring:

```tsx
// Example: Custom performance metric
export function reportWebVitals(metric) {
  if (metric.label === 'web-vital') {
    console.log(metric);
    // Send to analytics
    sendToAnalytics({
      name: metric.name,
      value: metric.value,
      id: metric.id,
    });
  }
}
```

## MakerKit-Specific Optimizations

### Supabase Optimization

Optimize database queries and RLS policies:

```tsx
// Use select() to limit returned columns
const { data } = await supabase
  .from('accounts')
  .select('id, name, created_at') // Only select needed fields
  .eq('type', 'team')
  .throwOnError();

// Optimize RLS policies for performance
-- In migration file
CREATE POLICY "Users can only see their accounts" ON accounts
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM accounts_memberships 
      WHERE account_id = accounts.id
    )
  );

-- Add index to support the policy
CREATE INDEX idx_accounts_memberships_user_account 
ON accounts_memberships(user_id, account_id);
```

### React Query Configuration

Optimize React Query for better performance:

```tsx
// apps/web/components/react-query-provider.tsx
export function ReactQueryProvider(props: React.PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // MakerKit default
            gcTime: 10 * 60 * 1000, // 10 minutes
            refetchOnWindowFocus: false, // Reduce unnecessary refetches
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors
              if (error?.status >= 400 && error?.status < 500) {
                return false;
              }
              return failureCount < 3;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
    </QueryClientProvider>
  );
}
```

### Feature Package Optimization

Use dynamic imports for feature packages:

```tsx
// Lazy load admin features
const AdminDashboard = dynamic(
  () => import('@kit/admin').then(mod => ({ default: mod.AdminDashboard })),
  {
    loading: () => <AdminDashboardSkeleton />,
    ssr: false, // Admin features don't need SSR
  }
);

// Conditional loading based on user role
function App() {
  const { user } = useUser();
  
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }
  
  return <UserDashboard />;
}
```

### AI Gateway Optimization

Optimize AI service calls:

```tsx
// Use streaming for long-running AI operations
import { getStreamingChatCompletion } from '@kit/ai-gateway';

export async function* streamAIResponse(prompt: string) {
  const stream = getStreamingChatCompletion(
    [{ role: 'user', content: prompt }],
    {
      model: 'gpt-3.5-turbo', // Use cheaper model for simple tasks
      temperature: 0.1, // Lower temperature for consistency
    }
  );

  for await (const chunk of stream) {
    yield chunk;
  }
}

// Cache AI responses
const cachedAICall = React.cache(async (prompt: string) => {
  return getChatCompletion([{ role: 'user', content: prompt }]);
});
```

### Billing Package Optimization

Optimize billing operations:

```tsx
// Batch billing operations
export async function processBatchBilling(subscriptions: Subscription[]) {
  // Process in chunks to avoid rate limits
  const chunks = chunk(subscriptions, 10);
  
  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(subscription => 
        processSubscriptionBilling(subscription)
      )
    );
    
    // Small delay between chunks
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Use webhooks for real-time updates instead of polling
export function setupBillingWebhooks() {
  // Stripe webhooks for immediate billing updates
  // Reduces need for frequent API calls
}
```

## Performance Monitoring

### MakerKit Performance Tracking

Implement comprehensive performance monitoring:

```tsx
// apps/web/instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize performance monitoring
    const { getServerMonitoringService } = await import('@kit/monitoring/api');
    
    const monitoring = getServerMonitoringService();
    
    // Track server-side performance
    monitoring.captureMessage('Server initialized');
  }
}

// Custom performance metrics
export function reportWebVitals(metric: NextWebVitalsMetric) {
  // Track Core Web Vitals
  if (metric.label === 'web-vital') {
    const monitoring = useMonitoring();
    
    monitoring.setTag('page', window.location.pathname);
    monitoring.setMeasurement(metric.name, metric.value);
    
    // Alert on poor performance
    if (metric.name === 'LCP' && metric.value > 2500) {
      monitoring.captureMessage(`Poor LCP: ${metric.value}ms`);
    }
  }
}
```

### Database Performance Monitoring

Monitor Supabase performance:

```tsx
// Track slow queries
export function trackDatabaseQuery(
  query: string,
  duration: number,
  table: string
) {
  if (duration > 1000) { // Queries over 1 second
    console.warn(`Slow query on ${table}: ${duration}ms`);
    
    // Send to monitoring service
    const monitoring = getServerMonitoringService();
    monitoring.setMeasurement('db.query.duration', duration);
    monitoring.setTag('db.table', table);
    monitoring.captureMessage(`Slow database query: ${query}`);
  }
}
```

## Performance Checklist

### MakerKit-Specific Checklist

- [ ] Optimize Supabase queries with proper select() clauses
- [ ] Add database indexes for RLS policies
- [ ] Configure React Query with appropriate stale times
- [ ] Use dynamic imports for feature packages
- [ ] Implement AI response streaming for better UX
- [ ] Cache expensive AI operations
- [ ] Set up billing webhooks to reduce API calls
- [ ] Monitor Core Web Vitals with MakerKit monitoring
- [ ] Track database query performance
- [ ] Optimize provider chain for minimal re-renders

### General Performance

- [ ] Implement code splitting for large components
- [ ] Use static generation where possible
- [ ] Implement proper caching strategies
- [ ] Optimize images with Next.js Image
- [ ] Implement virtualization for long lists
- [ ] Memoize expensive calculations
- [ ] Optimize database queries
- [ ] Implement proper database indexes
- [ ] Monitor performance metrics
- [ ] Use streaming for progressive rendering
