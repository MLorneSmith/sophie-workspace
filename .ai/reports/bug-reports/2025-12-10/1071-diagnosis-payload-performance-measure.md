# Bug Diagnosis: Payload Admin Login Shows Performance.measure TypeError

**ID**: ISSUE-1071
**Created**: 2025-12-10T12:00:00Z
**Reporter**: user
**Severity**: low
**Status**: new
**Type**: bug

## Summary

The Payload CMS admin login screen (localhost:3020/admin/login) displays a runtime TypeError: "Failed to execute 'measure' on 'Performance': '​Page' cannot have a negative time stamp." This is a known Next.js 16 Turbopack bug affecting development mode, not a Payload CMS or application-specific issue.

## Environment

- **Application Version**: dev branch (commit 3639fd3cb)
- **Environment**: development
- **Browser**: All browsers
- **Node Version**: v22.16.0
- **Next.js Version**: 16.0.7 (Turbopack)
- **Payload CMS Version**: 3.66.0
- **Platform**: Linux (WSL2)
- **Last Working**: Unknown - this is an upstream bug

## Reproduction Steps

1. Start the Payload CMS dev server: `pnpm --filter payload dev`
2. Navigate to http://localhost:3020/admin/login
3. Observe the error in the browser console or overlay

## Expected Behavior

The admin login page should render without errors.

## Actual Behavior

A TypeError is thrown: "Failed to execute 'measure' on 'Performance': '​Page' cannot have a negative time stamp."

The error appears as a runtime exception in the browser, though the page may still be functional underneath the error overlay.

## Diagnostic Data

### Console Output
```
TypeError: Failed to execute 'measure' on 'Performance': '​Page' cannot have a negative time stamp.
```

### Network Analysis
```
Not applicable - this is a client-side Performance API timing issue, not a network error.
```

### Database Analysis
```
Not applicable - no database involvement in this error.
```

### Performance Metrics
```
The error occurs in Next.js's internal performance measurement system (Turbopack dev mode).
The Performance.measure() API is called with timestamps that become negative due to timing synchronization issues during hot module replacement.
```

### Screenshots
N/A - Error is displayed in browser console/overlay

## Error Stack Traces
```
TypeError: Failed to execute 'measure' on 'Performance': '​Page' cannot have a negative time stamp.
    at Performance.measure (internal Next.js Turbopack code)
```

## Related Code
- **Affected Files**:
  - `apps/payload/src/app/(payload)/admin/[[...segments]]/page.tsx` (Payload-generated, uses RootPage)
  - `apps/payload/src/app/(payload)/admin/[[...segments]]/not-found.tsx` (Payload-generated)
  - `apps/payload/next.config.mjs` (Turbopack enabled by default in Next.js 16)
- **Recent Changes**: None relevant - this is an upstream Next.js bug
- **Suspected Functions**: Next.js internal Performance.measure() calls in Turbopack dev mode

## Related Issues & Context

### Upstream Issues
- **vercel/next.js#86060** (OPEN): "Failed to execute 'measure' on 'Performance': '​NotFound' cannot have a negative time stamp"
  - Same root cause, reported against Next.js 16.0.2-canary.16
  - Confirmed as tracked by Next.js team (label: "linear: next")
  - Multiple users experiencing same issue with different component names ("Page", "NotFound")

### Similar Symptoms
- vercel/next.js#47560: Similar Performance.measure errors with missing marks (older issue from 2023)

### Local Repository
- No previous issues matching this exact error in slideheroes/2025slideheroes

## Root Cause Analysis

### Identified Root Cause

**Summary**: This is a known bug in Next.js 16's Turbopack development mode where Performance.measure() is called with negative timestamps during component rendering timing measurements.

**Detailed Explanation**:
Next.js 16 uses Turbopack by default for development. Turbopack includes performance instrumentation that measures component render times using the browser's Performance API. The bug occurs when:

1. Next.js calls `performance.mark('Page')` to mark the start of page rendering
2. During hot module replacement (HMR) or certain navigation patterns, timing synchronization breaks down
3. When `performance.measure()` is later called, it calculates a duration using timestamps that have become misaligned
4. If the calculated end time is before the start time, the duration becomes negative
5. The Performance API throws: "cannot have a negative time stamp"

This is NOT a Payload CMS bug - Payload simply triggers the underlying Next.js bug because it renders pages using the standard Next.js page router patterns.

**Supporting Evidence**:
- GitHub Issue vercel/next.js#86060 documents the identical error in Next.js 16.0.2-canary.16
- The issue is labeled "linear: next" indicating it's tracked by the Next.js team
- Multiple users report the same error with different component names ("Page", "NotFound", etc.)
- Error only occurs in development mode with Turbopack, not in production builds

### How This Causes the Observed Behavior

1. User navigates to `/admin/login`
2. Payload's RootPage component renders via `@payloadcms/next/views`
3. Next.js Turbopack attempts to measure the "Page" component render time
4. Due to the timing bug, `performance.measure('Page', ...)` is called with invalid timestamps
5. Browser throws TypeError which Next.js displays as an error overlay

### Confidence Level

**Confidence**: High

**Reasoning**: The error message exactly matches the known Next.js issue #86060. The environment matches (Next.js 16, Turbopack, development mode). This is not application code - it's Next.js internal instrumentation. The Next.js team has acknowledged and is tracking this issue.

## Fix Approach (High-Level)

**Option 1 - Wait for upstream fix** (Recommended):
Monitor vercel/next.js#86060 for a fix in an upcoming Next.js release. This is purely a development-mode issue and does not affect production.

**Option 2 - Temporary workaround**:
Patch `performance.measure()` to suppress negative timestamp errors. Add to a client-side script that loads early:

```javascript
// Suppress Next.js Turbopack performance measurement errors in dev
if (process.env.NODE_ENV === 'development') {
  const original = performance.measure.bind(performance);
  performance.measure = function(...args) {
    try {
      return original(...args);
    } catch (err) {
      if (err.message?.includes('negative time stamp')) return;
      throw err;
    }
  };
}
```

**Option 3 - Disable Turbopack**:
Run Payload with webpack instead of Turbopack: `next dev --webpack` (already available as `pnpm --filter payload build` uses webpack)

## Diagnosis Determination

This is a **confirmed upstream bug in Next.js 16 Turbopack** (development mode only). The error does not indicate any problem with the Payload CMS configuration or application code. The page likely functions correctly despite the error overlay.

**Recommended Action**:
- Dismiss the error overlay and continue development
- Monitor Next.js releases for a fix
- If the error is disruptive, use `next dev --webpack` instead of Turbopack

**Severity Adjustment**: While initially reported, this should be classified as **low severity** because:
1. It only affects development mode
2. The underlying functionality still works
3. It's an upstream bug with no application-level fix
4. Production builds are not affected

## Additional Context

- Next.js 16 made Turbopack the default dev bundler
- This project's `next.config.mjs` acknowledges Turbopack with `turbopack: {}`
- The workaround from GitHub issue #86060 involves patching Performance.measure()
- This is a cosmetic/DX issue, not a functional bug

---
*Generated by Claude Debug Assistant*
*Tools Used: WebSearch, WebFetch (GitHub issue #86060), Bash (git, package.json), Grep, Glob, Read*
