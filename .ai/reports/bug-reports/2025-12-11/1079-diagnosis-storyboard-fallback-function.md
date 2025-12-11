# Bug Diagnosis: Storyboard page fails with "Functions cannot be passed to Client Components" error

**ID**: ISSUE-pending
**Created**: 2025-12-11T12:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: error

## Summary

When clicking the "Get Started" button on the `/home/ai` page to navigate to `/home/ai/storyboard`, the application crashes with a React/Next.js error: "Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with 'use server'." The error occurs because a Server Component is passing a function as a prop to a Client Component.

## Environment

- **Application Version**: dev branch (commit ebcc9992b)
- **Environment**: development
- **Browser**: All browsers
- **Node Version**: Current project version
- **Database**: PostgreSQL (Supabase)
- **Next.js Version**: 16.0.7 (Turbopack)
- **Last Working**: Unknown

## Reproduction Steps

1. Navigate to `/home/ai` in the browser
2. Click the "Get Started" button under "Build New Presentation"
3. Observe the console error immediately

## Expected Behavior

The storyboard page should load correctly and display the storyboard interface.

## Actual Behavior

The page fails to render with the error:
```
Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  <... fallback={function fallback} children=...>
                ^^^^^^^^^^^^^^^^^^^
```

## Diagnostic Data

### Console Output
```
Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  <... fallback={function fallback} children=...>
                ^^^^^^^^^^^^^^^^^^^

    at stringify (<anonymous>:1:18)
```

### Network Analysis
```
N/A - Error occurs during component serialization, not network
```

### Database Analysis
```
N/A - Error occurs before any database operations
```

### Performance Metrics
```
N/A - Page fails to load
```

### Screenshots
N/A

## Error Stack Traces
```
Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  <... fallback={function fallback} children=...>
                ^^^^^^^^^^^^^^^^^^^

    at stringify (<anonymous>:1:18)
```

## Related Code

- **Affected Files**:
  - `apps/web/app/home/(user)/ai/storyboard/page.tsx` (primary issue)
  - `apps/web/app/home/(user)/ai/storyboard/_components/error-boundary.tsx` (component definition)
  - `apps/web/app/home/(user)/ai/storyboard/_components/storyboard-page.tsx` (secondary issue)
- **Recent Changes**: No recent changes to these files (last commit: 3238538cf)
- **Suspected Functions**: The inline arrow function passed to `ErrorBoundary.fallback` prop

## Related Issues & Context

### Direct Predecessors
None found - this is a new issue.

### Related Infrastructure Issues
None found.

### Similar Symptoms
None found.

### Same Component
None found.

### Historical Context
This appears to be a longstanding bug that may have gone unnoticed or was introduced before consistent testing of this route.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `storyboard/page.tsx` Server Component passes an inline arrow function `(error) => (...)` to the `fallback` prop of the `ErrorBoundary` Client Component, which violates React Server Components serialization rules.

**Detailed Explanation**:

In Next.js 15+ with React Server Components (RSC), Server Components cannot pass functions as props to Client Components because functions are not serializable across the server-client boundary. The RSC protocol requires all props passed from Server Components to Client Components to be JSON-serializable.

The problematic code in `apps/web/app/home/(user)/ai/storyboard/page.tsx` (lines 29-51):

```tsx
// Server Component (no "use client" directive)
export default async function StoryboardServerPage(...) {
  return (
    <ErrorBoundary
      fallback={(error) => (  // ❌ ERROR: Function passed to Client Component
        <div>...</div>
      )}
    >
      <StoryboardPage />
    </ErrorBoundary>
  );
}
```

The `ErrorBoundary` component at `apps/web/app/home/(user)/ai/storyboard/_components/error-boundary.tsx` is marked with `"use client"` and expects `fallback: (error: Error | null) => ReactNode`.

**Supporting Evidence**:
- Error message explicitly states: `<... fallback={function fallback} children=...>`
- `storyboard/page.tsx` is an async Server Component (line 21: `async function StoryboardServerPage`)
- `error-boundary.tsx` has `"use client"` directive (line 1)
- The `fallback` prop type is defined as a function: `fallback: (error: Error | null) => ReactNode` (line 8)

**Secondary Issue**: The `storyboard-page.tsx` also passes a function to ErrorBoundary (line 40), but since `storyboard-page.tsx` is already a Client Component (`"use client"` on line 1), this doesn't cause an error when rendered within the client context.

### How This Causes the Observed Behavior

1. User clicks "Get Started" link on `/home/ai`
2. Next.js navigates to `/home/ai/storyboard`
3. Next.js renders `StoryboardServerPage` as a Server Component
4. Server Component attempts to serialize props for `ErrorBoundary` Client Component
5. RSC serializer encounters the inline arrow function `(error) => (...)`
6. Serialization fails because functions cannot be serialized to JSON
7. Next.js throws the error before the page can render

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The error message explicitly mentions `fallback={function fallback}` which matches the code
2. The pattern matches a well-documented Next.js/RSC limitation
3. The code structure clearly shows a Server Component passing a function to a Client Component
4. Similar `ErrorBoundary` in `canvas/_components/error-boundary.tsx` expects `fallback: ReactNode` (not a function) and works correctly

## Fix Approach (High-Level)

Two possible approaches:

**Option 1 (Recommended)**: Change the `ErrorBoundary` interface to accept `fallback: ReactNode` instead of a function, similar to the canvas ErrorBoundary. The fallback would be a static ReactNode. If error details are needed in the fallback, use a different pattern.

**Option 2**: Move the ErrorBoundary wrapper into the Client Component (`StoryboardPage`) where functions can be passed freely, and remove it from the Server Component page.

The canvas ErrorBoundary pattern (expecting `ReactNode` not a function) is the correct pattern for use with Server Components.

## Diagnosis Determination

Root cause has been conclusively identified: A Server Component (`storyboard/page.tsx`) is passing an arrow function as a prop to a Client Component (`ErrorBoundary`), violating React Server Components serialization rules. The fix requires either changing the ErrorBoundary interface or restructuring the component hierarchy.

## Additional Context

- The canvas module has a properly implemented ErrorBoundary that accepts `fallback: ReactNode` (not a function)
- The storyboard module's ErrorBoundary was designed to accept a function for more dynamic error handling, but this pattern is incompatible with RSC
- This is a Next.js App Router / React Server Components architectural constraint, not a bug in the application logic

---
*Generated by Claude Debug Assistant*
*Tools Used: Glob, Grep, Read, Bash (git log, gh issue list)*
