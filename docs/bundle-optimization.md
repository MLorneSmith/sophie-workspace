# Bundle Optimization Guidelines

## Overview

This document outlines best practices for maintaining optimal bundle sizes in the SlideHeroes application.
Bundle size monitoring is automatically enforced in our CI/CD pipeline using bundlewatch.

## Bundle Size Budgets

### Current Budgets

- **App Bundle** (`_app-*.js`): 400kb (gzipped)
- **Home Page** (`index-*.js`): 300kb (gzipped)
- **Framework Bundle** (`framework-*.js`): 120kb (gzipped)
- **Main Bundle** (`main-*.js`): 100kb (gzipped)
- **Webpack Runtime** (`webpack-*.js`): 50kb (gzipped)
- **CSS Files** (`*.css`): 100kb (gzipped)

### Budget Philosophy

- **5% tolerance**: Small increases are acceptable for significant features
- **Breaking changes**: Increases >5% require manual review and justification
- **Regression prevention**: Automated alerts prevent accidental bloat

## Optimization Strategies

### 1. Code Splitting

```typescript
// ✅ Good: Dynamic imports for heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// ✅ Good: Route-based splitting
const AdminDashboard = lazy(() => import('./admin/Dashboard'));
```

### 2. Tree Shaking

```typescript
// ✅ Good: Named imports
import { debounce } from 'lodash';

// ❌ Bad: Default imports
import _ from 'lodash';
```

### 3. Bundle Analysis

```bash
# Analyze bundle with visual report
pnpm --filter web analyze

# Check bundle sizes against budgets
pnpm --filter web analyze:bundle
```

### 4. Dependency Optimization

#### Modular Imports

```typescript
// ✅ Good: Tree-shakeable imports
import { format } from 'date-fns';

// ❌ Bad: Full library import
import * as dateFns from 'date-fns';
```

#### Bundle Analysis Tools

- **@next/bundle-analyzer**: Visual bundle analysis
- **bundlewatch**: Automated size monitoring
- **Webpack Bundle Analyzer**: Interactive treemap

### 5. Image Optimization

```tsx
// ✅ Good: Next.js Image component with optimization
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero image"
  width={800}
  height={600}
  priority
/>
```

### 6. CSS Optimization

- Use CSS modules for component-specific styles
- Leverage Tailwind CSS purging
- Minimize custom CSS

## Monitoring and Alerts

### Automated Checks

- **PR Validation**: Bundle size checked on every pull request
- **GitHub Status**: Failing checks block merges
- **Trend Tracking**: Historical size tracking across branches

### Alert Thresholds

- **Warning**: 3-5% increase from baseline
- **Error**: >5% increase from baseline
- **Critical**: >10% increase from baseline

## Bundle Analysis Workflow

### 1. Local Development

```bash
# Generate bundle analysis report
pnpm --filter web analyze

# Open interactive analyzer
open apps/web/.next/analyze/client.html
```

### 2. CI/CD Pipeline

- Automatic analysis on PR creation
- Size comparison with target branch
- Comment reporting on pull requests

### 3. Performance Impact

| Bundle Size | Performance Impact |
|-------------|------------------|
| < 100kb | Excellent |
| 100-200kb | Good |
| 200-400kb | Acceptable |
| > 400kb | Needs optimization |

## Common Issues and Solutions

### Large Dependencies

```typescript
// Problem: Moment.js is heavy (67kb)
import moment from 'moment';

// Solution: Use date-fns (lighter, tree-shakeable)
import { format, parseISO } from 'date-fns';
```

### Unused Code

```typescript
// Problem: Importing entire utility library
import _ from 'lodash';

// Solution: Import only needed functions
import { debounce, throttle } from 'lodash';
```

### Heavy Components

```typescript
// Problem: Large components in main bundle
import HeavyChart from './HeavyChart';

// Solution: Lazy load with loading state
const HeavyChart = lazy(() => import('./HeavyChart'));

function ChartSection() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HeavyChart />
    </Suspense>
  );
}
```

## Bundle Size Debugging

### 1. Identify Large Modules

```bash
# Analyze what's in your bundles
pnpm --filter web analyze
```

### 2. Check Webpack Stats

```bash
# Generate detailed webpack stats
ANALYZE=true pnpm --filter web build
```

### 3. Use Bundle Analyzer

- Navigate to generated report
- Identify largest modules
- Look for duplicate dependencies
- Find optimization opportunities

## Best Practices Checklist

- [ ] Use dynamic imports for heavy components
- [ ] Implement route-based code splitting
- [ ] Use tree-shakeable imports
- [ ] Optimize images with Next.js Image
- [ ] Monitor bundle size in CI/CD
- [ ] Regular dependency audits
- [ ] CSS optimization with purging
- [ ] Lazy load non-critical components

## Configuration Files

### Bundlewatch Config (`.bundlewatchrc.json`)

```json
{
  "files": [
    {
      "path": ".next/static/chunks/pages/_app-*.js",
      "maxSize": "400kb",
      "compression": "gzip"
    }
  ],
  "defaultCompression": "gzip",
  "ci": {
    "trackBranches": ["main", "staging", "dev"],
    "repoBranchBase": "main"
  }
}
```

### Next.js Bundle Analyzer

Already configured in `next.config.mjs` with `ANALYZE=true` flag.

## Maintenance

### Weekly Tasks

- Review bundle size trends
- Update budgets for new features
- Audit large dependencies
- Check for optimization opportunities

### Monthly Tasks

- Dependency updates and impact analysis
- Budget review and adjustment
- Performance benchmark updates
- Team training on optimization techniques

## Resources

- [Next.js Bundle Analysis](https://nextjs.org/docs/app/building-your-application/optimizing/bundle-analyzer)
- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- [Bundlewatch Documentation](https://github.com/bundlewatch/bundlewatch)
- [Web.dev Bundle Optimization](https://web.dev/reduce-javascript-payloads-with-code-splitting/)
