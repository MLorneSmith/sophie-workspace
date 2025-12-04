# Perplexity Research: Next.js 16 Global-Error Prerender Bug

**Date**: 2025-12-04
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API
**Next.js Version**: 16.0.7 with Turbopack

## Query Summary

Investigated a build error occurring during prerendering of the `global-error.tsx` page in Next.js 16:

```
TypeError: Cannot read properties of null (reading 'useContext')
    at U (.next/server/chunks/ssr/55b29_next_dist_esm_b64492b6._.js:4:15272)
Error occurred prerendering page "/_global-error"
```

The error occurs despite:
- Using `"use client"` directive
- Simple component with only inline styles and native HTML elements
- No external dependencies or context providers

## Findings

### 1. Is This a Known Bug?

**YES** - This is a known issue in Next.js that affects multiple versions (14.2.5, 15.x, and 16.x):

- **Root Cause**: Next.js attempts to prerender error pages (including `global-error.tsx`) during the build process, even though they are client components that should only be rendered dynamically at runtime
- **React Hook Issue**: The error occurs because React hooks (specifically `useContext`) are being called during static generation when no context provider is available
- **Turbopack Connection**: While not Turbopack-specific, the error manifests during the build phase regardless of bundler

### 2. Correct Pattern for global-error.tsx in Next.js 16

According to official documentation and community findings:

```tsx
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
```

**Key Requirements**:
- Must be a client component (`"use client"`)
- Must include `<html>` and `<body>` tags (replaces root layout)
- Should accept `error` and `reset` props
- **MUST NOT** be prerendered or statically exported

### 3. GitHub Issues Discussion

Multiple related issues found:

- **Issue #67697**: "TypeError: Cannot read properties of null (reading 'useContext')" - Closed as resolved by upgrading to latest Next.js 14.x
- **Issue #65447**: "Error occurred prerendering page '/_not-found'" - Related to pageExtensions config causing similar prerender errors
- **Issue #74858**: Next.js 15.1.4 build failure with same useContext error - Resolved by forcing dynamic rendering
- **Issue #84994** (referenced): Next.js 16 canary.7 useContext null during `/_global-error` SSR prerender

### 4. Recommended Workarounds

#### Solution 1: Force Dynamic Rendering (RECOMMENDED)

Add to `global-error.tsx`:

```tsx
"use client";
export const dynamic = 'force-dynamic';

export default function GlobalError({ error, reset }) {
  // ... implementation
}
```

This tells Next.js to NEVER attempt to prerender this page.

#### Solution 2: Bypass Prerendering During Build (Temporary)

Update build command in `package.json`:

```json
{
  "scripts": {
    "build": "next build --experimental-build-mode=compile"
  }
}
```

**Note**: This bypasses prerendering entirely, which may not be desirable for production.

#### Solution 3: Upgrade to Latest Next.js Version

Several users reported the issue was resolved by:
- Upgrading from 14.2.5 to 14.2.6+ (issue #67697)
- Upgrading to latest 15.x canary builds
- For Next.js 16, wait for stable release or use latest canary

#### Solution 4: Clear Build Cache

Delete the `.next` directory and rebuild to clear stale build caches.

#### Solution 5: Avoid useEffect/Hooks in Error Pages

If your `global-error.tsx` uses `useEffect` or other hooks that might access context:

```tsx
"use client";
export const dynamic = 'force-dynamic';

// ❌ AVOID - Can cause prerender issues
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("Global error:", error); // Accessing error during SSR
  }, [error]);
  
  return (/* ... */);
}

// ✅ BETTER - Minimal implementation
export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
```

## Sources & Citations

1. **Next.js Official Docs - Prerender Error**: https://nextjs.org/docs/messages/prerender-error
   - Comprehensive guide on prerendering errors and fixes

2. **GitHub Issue #54993**: "Does useContext in a page break static exports?"
   - https://github.com/vercel/next.js/discussions/54993
   - Discussion about useContext causing prerender failures

3. **GitHub Issue #67697**: "TypeError: Cannot read properties of null (reading 'useContext')"
   - https://github.com/vercel/next.js/issues/67697
   - Fixed by upgrading Next.js version

4. **GitHub Discussion #74858**: "Next build v15.1.4: Unable to run next build"
   - https://github.com/vercel/next.js/discussions/74858
   - Detailed solution using `export const dynamic = 'force-dynamic'`

5. **GitHub Issue #65447**: "Error occurred prerendering page '/_not-found'"
   - https://github.com/vercel/next.js/issues/65447
   - Related prerender issues with error pages

## Key Takeaways

1. **This is a known bug** in Next.js 14.2.5, 15.x, and 16.x where error pages are incorrectly prerendered during build
2. **Force dynamic rendering** using `export const dynamic = 'force-dynamic'` is the most reliable workaround
3. **Avoid hooks that access context** in error boundary components during prerender phase
4. **Clear build cache** (`.next` directory) if issues persist after fixes
5. **Upgrading to latest Next.js version** often resolves the issue (many reported fixed in 14.2.6+)
6. **The error is NOT Turbopack-specific** but affects all Next.js builds attempting to prerender error pages

## Recommended Solution for Your Project

Given your setup (Next.js 16.0.7 with Turbopack), implement this in `apps/web/app/global-error.tsx`:

```tsx
"use client";

// Force dynamic rendering - prevents prerender attempts
export const dynamic = 'force-dynamic';

/**
 * Global error page - renders when the root layout itself fails.
 * Must be completely self-contained with NO external dependencies.
 */
const GlobalErrorPage = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  // Remove useEffect - avoid hooks during prerender
  // Instead, log on client-side only if needed
  
  return (
    <html lang="en">
      <head>
        <title>Error - SlideHeroes</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: "#0a0a0a",
          color: "#fafafa",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Your existing error UI */}
      </body>
    </html>
  );
};

export default GlobalErrorPage;
```

**Changes needed**:
1. Add `export const dynamic = 'force-dynamic';` at top
2. Remove or guard `useEffect` hook to prevent SSR execution
3. Clear `.next` directory and rebuild

## Related Searches

- Next.js 16 error boundary best practices
- Static vs dynamic rendering in Next.js App Router
- Next.js build optimization for error pages
- Alternative error handling patterns in Next.js 16
