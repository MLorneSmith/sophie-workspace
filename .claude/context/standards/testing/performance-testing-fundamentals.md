# Performance Testing Fundamentals

This document provides comprehensive guidance for performance testing in the SlideHeroes platform, covering Core Web Vitals, bundle analysis, load testing, and performance budgets.

## Core Performance Principles

### 1. User-Centric Metrics (Core Web Vitals)
- **Largest Contentful Paint (LCP)**: ≤ 2.5 seconds (loading performance)
- **First Input Delay (FID)**: ≤ 100 milliseconds (interactivity) 
- **Cumulative Layout Shift (CLS)**: ≤ 0.1 (visual stability)
- **First Contentful Paint (FCP)**: ≤ 1.8 seconds (initial render)
- **Time to Interactive (TTI)**: ≤ 3.8 seconds (full interactivity)

### 2. Business Impact Focus
- **Revenue Pages**: Payment flows, course enrollment, subscription signup
- **Core Features**: AI canvas, storyboard creation, course completion
- **User Retention**: Homepage, course dashboard, navigation performance
- **SEO Impact**: Page load times affect search rankings

### 3. Performance Budget Strategy
- **Bundle Size Limits**: Total initial JS ≤ 200KB gzipped
- **Image Optimization**: WebP format, responsive images, lazy loading
- **API Response Times**: ≤ 500ms for critical paths
- **Database Query Limits**: ≤ 100ms for individual queries

## Performance Testing Frameworks

### 1. Lighthouse CI Integration

```typescript
// lighthouse.config.js
export default {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/course/introduction-to-ai',
        'http://localhost:3000/ai/canvas',
        'http://localhost:3000/storyboard'
      ],
      startServerCommand: 'pnpm dev',
      startServerReadyPattern: 'ready started server on',
      numberOfRuns: 3
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'first-input-delay': ['error', { maxNumericValue: 100 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }]
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-reports'
    }
  }
};
```

### 2. Playwright Performance Testing

```typescript
// tests/performance/core-web-vitals.test.ts
import { test, expect } from '@playwright/test';

test.describe('Core Web Vitals', () => {
  test('homepage performance meets thresholds', async ({ page }) => {
    // Start performance monitoring
    const performanceMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const metrics = {};
          
          entries.forEach(entry => {
            if (entry.entryType === 'navigation') {
              metrics.loadComplete = entry.loadEventEnd - entry.loadEventStart;
              metrics.domComplete = entry.domComplete - entry.navigationStart;
              metrics.firstByte = entry.responseStart - entry.navigationStart;
            }
            
            if (entry.entryType === 'largest-contentful-paint') {
              metrics.lcp = entry.startTime;
            }
            
            if (entry.entryType === 'first-input') {
              metrics.fid = entry.processingStart - entry.startTime;
            }
            
            if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
              metrics.cls = (metrics.cls || 0) + entry.value;
            }
          });
          
          resolve(metrics);
        });
        
        observer.observe({ entryTypes: ['navigation', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const metrics = await performanceMetrics;
    
    // Assert Core Web Vitals
    expect(metrics.lcp).toBeLessThan(2500); // LCP < 2.5s
    expect(metrics.fid).toBeLessThan(100);  // FID < 100ms
    expect(metrics.cls).toBeLessThan(0.1);  // CLS < 0.1
  });

  test('AI canvas loading performance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/ai/canvas');
    
    // Wait for critical resources
    await page.waitForSelector('[data-testid="canvas-editor"]');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3 second budget
    
    // Test interaction responsiveness
    const interactionStart = Date.now();
    await page.getByLabel('Presentation topic').fill('Test topic');
    const interactionTime = Date.now() - interactionStart;
    
    expect(interactionTime).toBeLessThan(50); // Instant response
  });

  test('course page navigation performance', async ({ page }) => {
    await page.goto('/course/introduction-to-ai');
    
    // Measure lesson navigation performance
    const navigationTimes = [];
    
    const lessons = await page.getByRole('link', { name: /lesson/i }).all();
    
    for (let i = 0; i < Math.min(lessons.length, 3); i++) {
      const startTime = Date.now();
      await lessons[i].click();
      await page.waitForLoadState('networkidle');
      const navTime = Date.now() - startTime;
      
      navigationTimes.push(navTime);
      
      // Navigate back for next test
      await page.goBack();
      await page.waitForLoadState('networkidle');
    }
    
    // Average navigation should be under 1 second
    const averageNavTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length;
    expect(averageNavTime).toBeLessThan(1000);
  });
});
```

### 3. Bundle Size Analysis

```typescript
// tests/performance/bundle-analysis.test.ts
import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import { readFileSync, statSync } from 'fs';
import { glob } from 'glob';

test.describe('Bundle Size Analysis', () => {
  test('JavaScript bundle size within budget', async () => {
    // Build the application
    execSync('pnpm build', { stdio: 'inherit' });
    
    // Analyze bundle sizes
    const buildPath = '.next/static/chunks';
    const jsFiles = glob.sync(`${buildPath}/**/*.js`);
    
    let totalSize = 0;
    const fileSizes = [];
    
    for (const file of jsFiles) {
      const stats = statSync(file);
      const sizeKB = Math.round(stats.size / 1024);
      totalSize += sizeKB;
      
      fileSizes.push({
        file: file.replace(buildPath, ''),
        size: sizeKB
      });
    }
    
    // Bundle size assertions
    expect(totalSize).toBeLessThan(500); // Total JS < 500KB
    
    // Individual chunk size limits
    const mainChunk = fileSizes.find(f => f.file.includes('main'));
    expect(mainChunk?.size).toBeLessThan(50); // Main chunk < 50KB
    
    const vendorChunks = fileSizes.filter(f => f.file.includes('vendor'));
    vendorChunks.forEach(chunk => {
      expect(chunk.size).toBeLessThan(200); // Vendor chunks < 200KB each
    });
    
    console.log('Bundle Analysis:', {
      totalSize: `${totalSize}KB`,
      chunkCount: fileSizes.length,
      largestChunk: fileSizes.sort((a, b) => b.size - a.size)[0]
    });
  });

  test('CSS bundle optimization', async () => {
    const buildPath = '.next/static/css';
    const cssFiles = glob.sync(`${buildPath}/**/*.css`);
    
    let totalCSSSize = 0;
    
    for (const file of cssFiles) {
      const stats = statSync(file);
      const sizeKB = Math.round(stats.size / 1024);
      totalCSSSize += sizeKB;
    }
    
    expect(totalCSSSize).toBeLessThan(100); // Total CSS < 100KB
  });

  test('image optimization compliance', async ({ page }) => {
    await page.goto('/');
    
    // Check all images on the page
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const src = await img.getAttribute('src');
      const loading = await img.getAttribute('loading');
      const sizes = await img.getAttribute('sizes');
      
      // Verify modern formats and lazy loading
      if (src) {
        // Should use WebP or AVIF for modern browsers
        const isOptimizedFormat = src.includes('.webp') || src.includes('.avif') || src.startsWith('/_next/image');
        expect(isOptimizedFormat).toBe(true);
        
        // Non-critical images should be lazy loaded
        const isAboveFold = await img.evaluate(el => {
          const rect = el.getBoundingClientRect();
          return rect.top < window.innerHeight;
        });
        
        if (!isAboveFold) {
          expect(loading).toBe('lazy');
        }
        
        // Responsive images should have sizes attribute
        if (sizes) {
          expect(sizes).toMatch(/\d+(px|vw|rem)/);
        }
      }
    }
  });
});
```

### 4. API Performance Testing

```typescript
// tests/performance/api-performance.test.ts
import { test, expect } from '@playwright/test';

test.describe('API Performance', () => {
  test('course API response times', async ({ request }) => {
    const authToken = await createAuthenticatedUser();
    
    // Test critical API endpoints
    const endpoints = [
      '/api/courses',
      '/api/user/profile',
      '/api/user/progress',
      '/api/analytics/dashboard'
    ];
    
    for (const endpoint of endpoints) {
      const startTime = Date.now();
      
      const response = await request.get(endpoint, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      const responseTime = Date.now() - startTime;
      
      expect(response.ok()).toBe(true);
      expect(responseTime).toBeLessThan(500); // API responses < 500ms
      
      console.log(`${endpoint}: ${responseTime}ms`);
    }
  });

  test('AI service performance under load', async ({ request }) => {
    const authToken = await createAuthenticatedUser();
    
    // Mock AI service with realistic delays
    await page.route('**/api/ai/generate-ideas', async route => {
      // Simulate realistic AI processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ideas: [
            { title: 'Idea 1', content: 'Content 1' },
            { title: 'Idea 2', content: 'Content 2' }
          ]
        })
      });
    });
    
    const startTime = Date.now();
    
    const response = await request.post('/api/ai/generate-ideas', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        prompt: 'Create a presentation about performance testing',
        sessionId: 'perf-test-session'
      }
    });
    
    const totalTime = Date.now() - startTime;
    
    expect(response.ok()).toBe(true);
    expect(totalTime).toBeLessThan(3000); // AI requests < 3s including processing
  });

  test('database query performance', async ({ request }) => {
    const authToken = await createAuthenticatedUser();
    
    // Test complex analytics query
    const startTime = Date.now();
    
    const response = await request.get('/api/analytics/course-performance', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      params: {
        timeRange: '30d',
        includeDetails: 'true'
      }
    });
    
    const queryTime = Date.now() - startTime;
    
    expect(response.ok()).toBe(true);
    expect(queryTime).toBeLessThan(1000); // Complex queries < 1s
    
    const data = await response.json();
    expect(data.courses).toBeDefined();
    expect(data.analytics).toBeDefined();
  });
});
```

### 5. Load Testing with k6

```javascript
// tests/performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 10 },  // Ramp up to 10 users
    { duration: '5m', target: 10 },  // Stay at 10 users
    { duration: '2m', target: 50 },  // Ramp up to 50 users
    { duration: '5m', target: 50 },  // Stay at 50 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.02'],   // Error rate under 2%
    errors: ['rate<0.05']             // Custom error rate under 5%
  }
};

export function setup() {
  // Login and get auth token
  const loginResponse = http.post('http://localhost:3000/api/auth/signin', {
    email: 'loadtest@example.com',
    password: 'testpassword'
  });
  
  return { authToken: loginResponse.json('sessionToken') };
}

export default function(data) {
  const { authToken } = data;
  
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };
  
  // Test course listing
  const coursesResponse = http.get('http://localhost:3000/api/courses', { headers });
  check(coursesResponse, {
    'courses status is 200': (r) => r.status === 200,
    'courses response time < 500ms': (r) => r.timings.duration < 500
  }) || errorRate.add(1);
  
  sleep(1);
  
  // Test AI idea generation
  const aiResponse = http.post('http://localhost:3000/api/ai/generate-ideas', 
    JSON.stringify({
      prompt: 'Test presentation',
      sessionId: `load-test-${__VU}-${__ITER}`
    }), 
    { headers }
  );
  
  check(aiResponse, {
    'AI status is 200': (r) => r.status === 200,
    'AI response time < 3000ms': (r) => r.timings.duration < 3000
  }) || errorRate.add(1);
  
  sleep(2);
  
  // Test course progress
  const progressResponse = http.get('http://localhost:3000/api/user/progress', { headers });
  check(progressResponse, {
    'progress status is 200': (r) => r.status === 200,
    'progress response time < 300ms': (r) => r.timings.duration < 300
  }) || errorRate.add(1);
  
  sleep(1);
}

export function teardown(data) {
  // Cleanup if needed
  console.log('Load test completed');
}
```

### 6. Memory and Resource Monitoring

```typescript
// tests/performance/memory-usage.test.ts
import { test, expect } from '@playwright/test';

test.describe('Memory and Resource Usage', () => {
  test('memory usage stays within limits during AI generation', async ({ page }) => {
    await page.goto('/ai/canvas');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return {
        usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
        totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0
      };
    });
    
    // Perform memory-intensive operations
    for (let i = 0; i < 5; i++) {
      await page.getByLabel('Topic').fill(`Test presentation ${i}`);
      await page.getByRole('button', { name: 'Generate ideas' }).click();
      await page.waitForSelector('[data-testid="idea-card"]');
      
      // Clear generated content
      await page.getByRole('button', { name: 'Clear' }).click();
    }
    
    // Check final memory usage
    const finalMemory = await page.evaluate(() => {
      return {
        usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
        totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0
      };
    });
    
    // Memory growth should be reasonable
    const memoryGrowth = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
    const growthMB = memoryGrowth / (1024 * 1024);
    
    expect(growthMB).toBeLessThan(50); // Memory growth < 50MB
    
    console.log(`Memory usage: ${growthMB.toFixed(2)}MB growth`);
  });

  test('CPU usage during intensive operations', async ({ page }) => {
    await page.goto('/storyboard');
    
    // Monitor CPU-intensive operations
    const performanceMarks = [];
    
    await page.evaluate(() => {
      performance.mark('storyboard-start');
    });
    
    // Create a complex storyboard
    await page.getByRole('button', { name: 'Create presentation' }).click();
    await page.getByLabel('Topic').fill('Complex presentation with many slides');
    await page.getByRole('button', { name: 'Generate storyboard' }).click();
    
    // Wait for generation to complete
    await page.waitForSelector('[data-testid="slide"]');
    
    await page.evaluate(() => {
      performance.mark('storyboard-end');
      performance.measure('storyboard-generation', 'storyboard-start', 'storyboard-end');
    });
    
    const measurements = await page.evaluate(() => {
      const measures = performance.getEntriesByType('measure');
      return measures.map(m => ({
        name: m.name,
        duration: m.duration
      }));
    });
    
    const storyboardMeasure = measurements.find(m => m.name === 'storyboard-generation');
    expect(storyboardMeasure?.duration).toBeLessThan(5000); // Complex operations < 5s
  });
});
```

### 7. Performance Monitoring Integration

```typescript
// utils/performance-monitoring.ts
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  async measurePageLoad(page: Page, url: string): Promise<PerformanceMetrics> {
    const startTime = Date.now();
    
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        loadTime: Date.now() - performance.timeOrigin,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        responseTime: navigation.responseEnd - navigation.requestStart,
        renderTime: navigation.loadEventEnd - navigation.responseEnd
      };
    });
    
    return metrics;
  }
  
  async measureInteraction(page: Page, action: () => Promise<void>): Promise<number> {
    const startTime = Date.now();
    await action();
    return Date.now() - startTime;
  }
  
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }
  
  getStatistics(name: string): PerformanceStats {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return { min: 0, max: 0, avg: 0, p95: 0 };
    
    const sorted = [...values].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p95: sorted[p95Index] || sorted[sorted.length - 1]
    };
  }
  
  generateReport(): PerformanceReport {
    const report: PerformanceReport = {
      timestamp: new Date().toISOString(),
      metrics: {}
    };
    
    for (const [name, values] of this.metrics) {
      report.metrics[name] = this.getStatistics(name);
    }
    
    return report;
  }
}

interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  responseTime: number;
  renderTime: number;
}

interface PerformanceStats {
  min: number;
  max: number;
  avg: number;
  p95: number;
}

interface PerformanceReport {
  timestamp: string;
  metrics: Record<string, PerformanceStats>;
}

// Usage in tests
test('comprehensive performance monitoring', async ({ page }) => {
  const monitor = new PerformanceMonitor();
  
  // Monitor multiple page loads
  const pages = ['/home', '/course/test', '/ai/canvas'];
  
  for (const pageUrl of pages) {
    const metrics = await monitor.measurePageLoad(page, pageUrl);
    monitor.recordMetric(`${pageUrl}-load-time`, metrics.loadTime);
    monitor.recordMetric(`${pageUrl}-fcp`, metrics.firstContentfulPaint);
  }
  
  // Monitor interactions
  await page.goto('/ai/canvas');
  const interactionTime = await monitor.measureInteraction(page, async () => {
    await page.getByLabel('Topic').fill('Performance test');
    await page.getByRole('button', { name: 'Generate' }).click();
    await page.waitForSelector('[data-testid="result"]');
  });
  
  monitor.recordMetric('ai-generation-interaction', interactionTime);
  
  // Generate report
  const report = monitor.generateReport();
  console.log('Performance Report:', JSON.stringify(report, null, 2));
  
  // Assert performance requirements
  expect(report.metrics['/home-load-time'].p95).toBeLessThan(2000);
  expect(report.metrics['ai-generation-interaction'].avg).toBeLessThan(3000);
});
```

## Performance Budget Configuration

```typescript
// performance-budgets.config.ts
export const performanceBudgets = {
  // Core Web Vitals
  coreWebVitals: {
    lcp: 2500,      // Largest Contentful Paint < 2.5s
    fid: 100,       // First Input Delay < 100ms
    cls: 0.1,       // Cumulative Layout Shift < 0.1
    fcp: 1800,      // First Contentful Paint < 1.8s
    tti: 3800       // Time to Interactive < 3.8s
  },
  
  // Bundle Sizes (gzipped)
  bundleSizes: {
    totalJS: 500 * 1024,        // 500KB total JS
    mainChunk: 50 * 1024,       // 50KB main chunk
    vendorChunk: 200 * 1024,    // 200KB vendor chunks
    totalCSS: 100 * 1024,       // 100KB total CSS
    images: 2 * 1024 * 1024     // 2MB total images per page
  },
  
  // API Performance
  apiResponse: {
    critical: 300,      // Critical APIs < 300ms
    standard: 500,      // Standard APIs < 500ms
    heavy: 1000,        // Heavy operations < 1s
    ai: 3000           // AI operations < 3s
  },
  
  // Page Load Times
  pageLoad: {
    homepage: 2000,     // Homepage < 2s
    coursePages: 2500,  // Course pages < 2.5s
    aiCanvas: 3000,     // AI Canvas < 3s
    storyboard: 3000    // Storyboard < 3s
  }
};

// Automated budget enforcement
export function enforcePerformanceBudgets(metrics: PerformanceMetrics): BudgetResults {
  const results: BudgetResults = {
    passed: true,
    violations: []
  };
  
  // Check Core Web Vitals
  if (metrics.lcp > performanceBudgets.coreWebVitals.lcp) {
    results.violations.push({
      metric: 'LCP',
      actual: metrics.lcp,
      budget: performanceBudgets.coreWebVitals.lcp,
      impact: 'high'
    });
    results.passed = false;
  }
  
  // Check bundle sizes
  if (metrics.bundleSize > performanceBudgets.bundleSizes.totalJS) {
    results.violations.push({
      metric: 'Bundle Size',
      actual: metrics.bundleSize,
      budget: performanceBudgets.bundleSizes.totalJS,
      impact: 'medium'
    });
    results.passed = false;
  }
  
  return results;
}
```

## CI/CD Integration

```yaml
# .github/workflows/performance-testing.yml
name: Performance Testing

on:
  pull_request:
    branches: [main, staging]
  schedule:
    - cron: '0 2 * * *' # Nightly performance tests

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build application
        run: pnpm build
      
      - name: Run Lighthouse CI
        run: pnpm lhci autorun
      
      - name: Upload Lighthouse reports
        uses: actions/upload-artifact@v4
        with:
          name: lighthouse-reports
          path: ./lighthouse-reports

  bundle-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Analyze bundle size
        uses: preactjs/compressed-size-action@v2
        with:
          repo-token: '${{ secrets.GITHUB_TOKEN }}'
          pattern: '.next/static/**/*.js'
          exclude: '{**/*.map,**/node_modules/**}'

  load-testing:
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule' # Only run nightly
    steps:
      - uses: actions/checkout@v4
      - name: Run k6 load test
        uses: grafana/k6-action@v0.3.1
        with:
          filename: tests/performance/load-test.js
      
      - name: Upload load test results
        uses: actions/upload-artifact@v4
        with:
          name: load-test-results
          path: ./k6-results.json
```

## Best Practices Summary

### 1. Testing Strategy
- **Continuous Monitoring**: Integrate performance tests in CI/CD
- **User-Centric Metrics**: Focus on Core Web Vitals
- **Budget Enforcement**: Set and enforce performance budgets
- **Regular Auditing**: Schedule comprehensive performance audits

### 2. Priority Areas
- **Critical User Paths**: Payment, course completion, AI generation
- **Bundle Optimization**: Code splitting, lazy loading, tree shaking
- **Image Optimization**: WebP/AVIF formats, responsive images
- **API Performance**: Response time optimization, caching strategies

### 3. Tools Integration
- **Lighthouse CI**: Automated Core Web Vitals monitoring
- **Bundle Analyzer**: Track JavaScript/CSS bundle sizes
- **k6/Artillery**: Load testing for peak traffic scenarios
- **Real User Monitoring**: Production performance insights

### 4. Performance Culture
- **Shift Left**: Test performance early in development
- **Budget Awareness**: Developers understand performance costs
- **Monitoring**: Continuous tracking of performance regressions
- **Optimization**: Regular performance improvement initiatives

Performance testing ensures your application delivers excellent user experience under all conditions. Focus on user-centric metrics, maintain performance budgets, and integrate testing throughout your development pipeline.