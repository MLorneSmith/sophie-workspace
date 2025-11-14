---
# Identity
id: "performance-testing-fundamentals"
title: "Performance Testing Fundamentals"
version: "2.0.0"
category: "standards"

# Discovery
description: "Core performance testing principles, metrics, and implementation patterns for web applications"
tags: ["performance", "testing", "web-vitals", "load-testing", "monitoring"]

# Relationships
dependencies: []
cross_references:
  - id: "web-vitals-testing"
    type: "related"
    description: "Detailed Core Web Vitals testing patterns"
  - id: "load-testing-patterns"
    type: "related"
    description: "Load and stress testing implementation"
  - id: "performance-monitoring"
    type: "related"
    description: "APM and RUM monitoring setup"

# Maintenance
created: "2025-09-15"
last_updated: "2025-09-15"
author: "create-context"
---

# Performance Testing Fundamentals

## Overview

Performance testing validates system behavior under various load conditions, ensuring applications meet user expectations for speed, responsiveness, and stability. This context covers core principles, key metrics, and essential patterns for implementing comprehensive performance testing.

## Key Concepts

- **Performance Testing Types**: Load, stress, spike, volume, and endurance testing serve distinct validation purposes
- **Core Web Vitals**: LCP, FID/INP, CLS are critical user-centric metrics affecting UX and SEO
- **Performance Budgets**: Enforced thresholds preventing performance regression
- **Synthetic vs RUM**: Complementary monitoring approaches for complete visibility
- **Business Impact Focus**: Prioritize revenue pages, core features, and user retention paths

## Performance Testing Types

### Load Testing

Tests expected user loads to establish baseline performance:

```javascript
// k6 example with authentication setup
export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up
    { duration: '5m', target: 100 },  // Sustain
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.02']
  }
};

// Setup authentication before test
export function setup() {
  const loginRes = http.post('/api/auth/signin', {
    email: 'test@example.com',
    password: 'password'
  });
  return { token: loginRes.json('sessionToken') };
}

// Main test function uses auth token
export default function(data) {
  const headers = { 'Authorization': `Bearer ${data.token}` };
  http.get('/api/courses', { headers });
}
```

### Stress Testing

Identifies breaking points and failure modes:

- Push beyond expected capacity
- Monitor resource exhaustion
- Validate graceful degradation

### Spike Testing

Validates resilience to traffic surges:

- Rapid load increases (10x in seconds)
- Critical for viral content/flash sales
- Tests auto-scaling effectiveness

### Volume Testing

Tests with large data volumes:

- Database performance with millions of records
- Bulk operations and batch processing
- Storage and retrieval efficiency

### Endurance Testing

Long-running tests to detect degradation:

- Memory leaks over extended periods
- Connection pool exhaustion
- Cache effectiveness over time

## Core Performance Metrics

### User-Centric Metrics (Core Web Vitals)

| Metric | Target | Impact |
|--------|--------|--------|
| LCP | ≤ 2.5s | Loading performance |
| FID/INP | ≤ 100ms | Interactivity |
| CLS | ≤ 0.1 | Visual stability |
| FCP | ≤ 1.8s | Initial render |
| TTI | ≤ 3.8s | Full interactivity |

### System Metrics

- **Response Time**: p50, p95, p99 percentiles
- **Throughput**: Requests/transactions per second
- **Error Rate**: Failed request percentage
- **Resource Utilization**: CPU, memory, I/O

### Business Priority Areas

- **Revenue Pages**: Payment flows, enrollment, subscriptions
- **Core Features**: AI canvas, storyboard, course completion
- **User Retention**: Homepage, dashboard, navigation
- **SEO Impact**: Page speed affects search rankings

## Implementation Patterns

### Playwright Performance Testing

```typescript
test('Core Web Vitals monitoring', async ({ page }) => {
  // Capture Web Vitals
  const metrics = await page.evaluate(() =>
    new Promise(resolve => {
      new PerformanceObserver(list => {
        const entries = list.getEntries();
        resolve({
          lcp: entries.find(e => e.entryType === 'largest-contentful-paint')?.startTime,
          fid: entries.find(e => e.entryType === 'first-input')?.processingStart,
          cls: entries.filter(e => e.entryType === 'layout-shift')
            .reduce((sum, e) => sum + e.value, 0)
        });
      }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
    })
  );

  await page.goto('/');
  expect(metrics.lcp).toBeLessThan(2500);
  expect(metrics.cls).toBeLessThan(0.1);
});
```

### Performance Budget Configuration

```typescript
export const performanceBudgets = {
  coreWebVitals: {
    lcp: 2500,    // 2.5s
    fid: 100,     // 100ms
    cls: 0.1      // 0.1 score
  },
  bundleSizes: {
    totalJS: 500_000,      // 500KB
    mainChunk: 50_000,     // 50KB
    totalCSS: 100_000      // 100KB
  },
  apiResponse: {
    critical: 300,    // 300ms
    standard: 500,    // 500ms
    ai: 3000         // 3s for AI operations
  }
};

// Automated budget enforcement
export function enforcePerformanceBudgets(metrics) {
  const violations = [];
  if (metrics.lcp > performanceBudgets.coreWebVitals.lcp) {
    violations.push({ metric: 'LCP', actual: metrics.lcp, budget: 2500 });
  }
  return { passed: violations.length === 0, violations };
}
```

### Memory and Resource Monitoring

```typescript
test('memory leak detection', async ({ page }) => {
  // Get initial memory
  const initialMemory = await page.evaluate(() =>
    performance.memory?.usedJSHeapSize || 0
  );

  // Perform intensive operations
  for (let i = 0; i < 10; i++) {
    await performOperation(page);
  }

  // Check memory growth
  const finalMemory = await page.evaluate(() =>
    performance.memory?.usedJSHeapSize || 0
  );

  const growthMB = (finalMemory - initialMemory) / (1024 * 1024);
  expect(growthMB).toBeLessThan(50); // Max 50MB growth
});
```

## Testing Strategy

### 1. Continuous Monitoring

- Integrate performance tests in CI/CD pipelines
- Run lightweight tests on every PR
- Execute comprehensive tests nightly

### 2. Test Environment

- Mirror production infrastructure
- Use realistic test data volumes
- Implement proper test isolation

### 3. Progressive Testing

```yaml
# CI/CD stages
stages:
  - quick-check:    # Every commit - smoke tests
      duration: 2m
      users: 10
  - standard:       # Every PR - standard load
      duration: 10m
      users: 100
  - comprehensive:  # Nightly - full suite
      duration: 30m
      users: 500
```

## Common Performance Issues

### Bottleneck Identification

1. **Frontend**: Large bundles, render-blocking resources
2. **API**: N+1 queries, missing indexes, inefficient algorithms
3. **Infrastructure**: Insufficient resources, network latency
4. **Database**: Slow queries, connection pool exhaustion

### Resolution Patterns

- **Bundle Optimization**: Code splitting, lazy loading, tree shaking
- **API Optimization**: Caching, pagination, query optimization
- **Database Tuning**: Indexing, query optimization, connection pooling

## CI/CD Integration

```yaml
# GitHub Actions example
name: Performance Testing
on: [pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            http://localhost:3000/
            http://localhost:3000/critical-path
          budgetPath: ./performance-budgets.json
          uploadArtifacts: true
```

## Tools Ecosystem

### Open Source

- **k6**: Modern load testing with JavaScript
- **Playwright**: Browser automation with performance APIs
- **Lighthouse**: Automated Web Vitals auditing

### Commercial/Cloud

- **DataDog**: Comprehensive observability platform
- **New Relic**: APM with strong user experience monitoring
- **Grafana Cloud**: k6 cloud with integrated visualization

## Best Practices

1. **Define Clear Objectives**: Set measurable goals aligned with business requirements
2. **Test Early and Often**: Shift-left performance testing approach
3. **Monitor Production**: Combine synthetic and RUM for complete visibility
4. **Enforce Budgets**: Automated gates preventing regression
5. **Focus on User Impact**: Prioritize metrics affecting real users

## Troubleshooting

### High LCP

- Optimize critical rendering path
- Implement resource hints (preconnect, prefetch)
- Use responsive images with proper sizing

### Poor FID/INP

- Reduce JavaScript execution time
- Implement code splitting
- Use web workers for heavy computations

### Layout Shift (CLS)

- Set explicit dimensions for media
- Avoid injecting content above existing content
- Use CSS transform instead of position changes

## Related Files

- `/apps/e2e/tests/performance/` - Performance test implementations
- `/.github/workflows/performance.yml` - CI/CD configuration
- `/packages/monitoring/` - Performance monitoring utilities

## See Also

- [vitest-configuration.md](./vitest-configuration.md) - Testing framework setup
- [e2e-testing.md](./e2e-testing.md) - E2E testing integration
