# Performance Debugging Guide

This guide provides systematic approaches for AI coding assistants to identify and resolve performance issues in web applications.

## Performance Debugging Methodology

### 1. Measurement First
- **Establish baseline**: Measure current performance before making changes
- **Use real data**: Test with production-like data volumes
- **Multiple metrics**: Don't rely on a single performance indicator
- **Consistent environment**: Use the same testing conditions

### 2. Performance Metrics to Track
```typescript
interface PerformanceMetrics {
  // Core Web Vitals
  LCP: number; // Largest Contentful Paint
  FID: number; // First Input Delay
  CLS: number; // Cumulative Layout Shift
  
  // Additional metrics
  TTFB: number; // Time to First Byte
  FCP: number;  // First Contentful Paint
  TTI: number;  // Time to Interactive
  
  // Custom metrics
  apiResponseTime: number;
  renderTime: number;
  bundleSize: number;
}
```

## Common Performance Issues

### Pattern 1: Slow Initial Load

**Symptoms:**
- High Time to First Byte (TTFB)
- Large bundle sizes
- Slow First Contentful Paint (FCP)

**Investigation Steps:**
1. **Analyze bundle size**: Use webpack-bundle-analyzer
2. **Check network requests**: Monitor initial resource loading
3. **Examine critical path**: Identify blocking resources
4. **Review server response**: Check API response times

**Diagnostic Commands:**
```bash
# Analyze bundle size
npx webpack-bundle-analyzer build/static/js/*.js

# Check lighthouse scores
npx lighthouse http://localhost:3000 --output=json

# Monitor network performance
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3000"
```

**Common Solutions:**
```typescript
// Code splitting
const LazyComponent = lazy(() => import('./HeavyComponent'));

// Preload critical resources
<link rel="preload" href="/critical.css" as="style" />
<link rel="preload" href="/hero-image.jpg" as="image" />

// Optimize images
<img 
  src="/image.webp" 
  loading="lazy"
  width="300" 
  height="200"
  alt="Description" 
/>

// Tree shaking
import { debounce } from 'lodash/debounce'; // Instead of entire lodash
```

### Pattern 2: Runtime Performance Issues

**Symptoms:**
- Janky scrolling or animations
- High CPU usage
- Unresponsive UI during interactions

**Investigation Steps:**
1. **Profile JavaScript**: Use Chrome DevTools Performance tab
2. **Check React renders**: Use React DevTools Profiler
3. **Monitor memory usage**: Look for memory leaks
4. **Analyze main thread**: Identify blocking operations

**React Performance Debugging:**
```typescript
// Identify unnecessary re-renders
const MemoizedComponent = memo(({ data }) => {
  console.log('Component rendered with:', data);
  return <div>{data.name}</div>;
});

// Profile expensive operations
const expensiveValue = useMemo(() => {
  console.time('Expensive calculation');
  const result = heavyCalculation(data);
  console.timeEnd('Expensive calculation');
  return result;
}, [data]);

// Optimize event handlers
const handleClick = useCallback((id: string) => {
  // Stable reference prevents child re-renders
  onItemClick(id);
}, [onItemClick]);
```

### Pattern 3: Database/API Performance

**Symptoms:**
- Slow API responses
- High database CPU usage
- Timeout errors

**Investigation Steps:**
1. **Analyze query performance**: Check execution plans
2. **Monitor database metrics**: CPU, memory, connections
3. **Review API endpoints**: Identify slow routes
4. **Check caching**: Verify cache hit rates

**Database Optimization:**
```sql
-- Analyze slow queries
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';

-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);

-- Optimize N+1 queries
SELECT u.*, p.* FROM users u 
LEFT JOIN profiles p ON u.id = p.user_id 
WHERE u.active = true;
```

**API Optimization:**
```typescript
// Implement caching
const getCachedData = async (key: string) => {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  
  const data = await fetchFromDatabase();
  await redis.setex(key, 300, JSON.stringify(data)); // 5 min cache
  return data;
};

// Batch API calls
const batchLoader = new DataLoader(async (ids) => {
  const results = await fetchMultipleItems(ids);
  return ids.map(id => results.find(r => r.id === id));
});
```

### Pattern 4: Memory Leaks

**Symptoms:**
- Increasing memory usage over time
- Browser becomes unresponsive
- Out of memory errors

**Investigation Steps:**
1. **Take heap snapshots**: Compare memory usage over time
2. **Check event listeners**: Look for unremoved listeners
3. **Examine closures**: Find retained references
4. **Review timers**: Ensure intervals are cleared

**Memory Leak Prevention:**
```typescript
// Clean up event listeners
useEffect(() => {
  const handleResize = () => setWindowSize(window.innerWidth);
  window.addEventListener('resize', handleResize);
  
  return () => window.removeEventListener('resize', handleResize);
}, []);

// Clear timers
useEffect(() => {
  const timer = setInterval(() => {
    // Do something
  }, 1000);
  
  return () => clearInterval(timer);
}, []);

// Abort fetch requests
useEffect(() => {
  const controller = new AbortController();
  
  fetch('/api/data', { signal: controller.signal })
    .then(response => response.json())
    .then(setData);
  
  return () => controller.abort();
}, []);
```

## Performance Debugging Tools

### Browser DevTools
```javascript
// Performance measurement
performance.mark('operation-start');
await heavyOperation();
performance.mark('operation-end');
performance.measure('operation', 'operation-start', 'operation-end');

// Memory monitoring
console.log('Memory usage:', performance.memory);

// Long task detection
new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.warn('Long task detected:', entry.duration);
  });
}).observe({ entryTypes: ['longtask'] });
```

### React DevTools Profiler
1. **Start profiling**: Click record button
2. **Perform actions**: Execute the slow operation
3. **Stop profiling**: Analyze the flame graph
4. **Identify issues**: Look for unnecessary renders and long operations

### Lighthouse Audits
```bash
# Run lighthouse audit
npx lighthouse http://localhost:3000 \
  --output=html \
  --output-path=./lighthouse-report.html \
  --chrome-flags="--headless"
```

## Performance Optimization Strategies

### 1. Code Splitting and Lazy Loading
```typescript
// Route-based splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// Component-based splitting
const HeavyChart = lazy(() => import('./components/HeavyChart'));

// Conditional loading
const AdminPanel = lazy(() => 
  import('./components/AdminPanel').then(module => ({
    default: module.AdminPanel
  }))
);
```

### 2. Memoization and Caching
```typescript
// Expensive calculations
const expensiveValue = useMemo(() => {
  return data.reduce((acc, item) => acc + item.value, 0);
}, [data]);

// API response caching
const useApiData = (url: string) => {
  return useQuery(url, fetchData, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Component memoization
const ExpensiveComponent = memo(({ data, onUpdate }) => {
  return <ComplexVisualization data={data} onUpdate={onUpdate} />;
}, (prevProps, nextProps) => {
  return prevProps.data.id === nextProps.data.id;
});
```

### 3. Virtual Scrolling for Large Lists
```typescript
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items }) => (
  <List
    height={600}
    itemCount={items.length}
    itemSize={50}
    itemData={items}
  >
    {({ index, style, data }) => (
      <div style={style}>
        {data[index].name}
      </div>
    )}
  </List>
);
```

### 4. Image Optimization
```typescript
// Next.js Image component
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero image"
  width={800}
  height={400}
  priority // For above-the-fold images
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>

// Responsive images
<picture>
  <source media="(min-width: 800px)" srcSet="/large.webp" />
  <source media="(min-width: 400px)" srcSet="/medium.webp" />
  <img src="/small.webp" alt="Responsive image" />
</picture>
```

## Performance Testing Workflow

### 1. Baseline Measurement
```typescript
// Automated performance testing
const performanceTest = async () => {
  const start = performance.now();
  
  // Execute operation
  await operationUnderTest();
  
  const duration = performance.now() - start;
  
  // Assert performance requirements
  expect(duration).toBeLessThan(1000); // 1 second max
};
```

### 2. Load Testing
```bash
# Using Artillery for load testing
artillery quick --count 10 --num 100 http://localhost:3000

# Using k6 for performance testing
k6 run performance-test.js
```

### 3. Continuous Monitoring
```typescript
// Performance monitoring in production
const reportPerformance = (metric: string, value: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'timing_complete', {
      name: metric,
      value: Math.round(value)
    });
  }
};

// Monitor Core Web Vitals
new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    reportPerformance(entry.name, entry.value);
  });
}).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
```

## Best Practices for AI Assistants

### 1. Systematic Performance Analysis
- Always measure before optimizing
- Focus on the biggest bottlenecks first
- Test optimizations in realistic conditions
- Monitor for regressions after changes

### 2. Performance Budget
- Set performance budgets for bundle size, load time, etc.
- Fail builds that exceed performance budgets
- Regular performance audits

### 3. Documentation
- Document performance requirements
- Record optimization decisions and trade-offs
- Maintain performance testing procedures
