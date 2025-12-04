# Perplexity Research: Next.js/React Regression Bug Investigation

**Date**: 2025-12-04
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API

## Query Summary

Researched a RECENT regression bug affecting Next.js 16.0.7 and React 19.2.1 that causes build failures with `TypeError: Cannot read properties of null (reading 'useContext')` during prerendering of the `/_global-error` page.

## Findings

### Latest Versions Available (as of December 4, 2025)

**Next.js:**
- **Latest stable: 16.0.7** (released December 3, 2025)
- **No newer versions**: 16.0.8, 16.0.9, or 16.1.0 have NOT been released yet
- Next.js 16.0.7 includes critical security patch for CVE-2025-66478

**React:**
- **Latest stable: 19.2.1** (released December 2025)
- **No newer versions**: 19.2.2 or 19.2.3 have NOT been released yet
- React 19.2.1 addresses critical security vulnerabilities in React Server Components

### Bug Status

**Key Finding: This is a KNOWN, RECURRING issue across multiple Next.js versions**

The `TypeError: Cannot read properties of null (reading 'useContext')` error during `global-error` prerendering has been reported across:
- Next.js 13.4.9 - 13.4.10
- Next.js 14.x series
- Next.js 15.1.4 - 15.1.6
- Next.js 16.0.7 (current version)

**Error Characteristics:**
- Occurs during `next build` (production build)
- Works fine in `next dev` (development mode)
- Happens during prerendering of `/_global-error` page
- Error digest: `899594500` (or similar digests like `910671031`)
- Can affect `/_error`, `/404`, `/500` pages as well

### Root Causes Identified

1. **Context Provider Issues**:
   - `useContext` hooks being called outside of proper React component trees
   - Missing or improperly configured context providers during prerendering
   - Context providers not wrapped correctly in `global-error.tsx`

2. **Server vs Client Component Mismatch**:
   - Components using hooks like `useContext` without `'use client'` directive
   - Static prerendering attempting to execute client-side code

3. **React Version Conflicts** (most common in monorepos):
   - Multiple versions of React in dependency tree
   - Mismatched React/React-DOM versions
   - pnpm hoisting issues with React packages

4. **Global Error File Location**:
   - `global-error.tsx` placed incorrectly (e.g., inside `app/[lang]` for i18n)
   - Should be at root `app/` directory level
   - Works in dev but fails during static generation at build time

### Workarounds & Solutions

**Immediate Workarounds:**

1. **Set NODE_ENV=production before build** (most common fix):
   ```bash
   NODE_ENV=production next build
   ```

2. **Use experimental build mode** (bypasses prerendering):
   ```bash
   next build --experimental-build-mode=compile
   ```

3. **Add force-dynamic to global-error**:
   ```typescript
   'use client';
   export const dynamic = 'force-dynamic';
   ```

**Permanent Fixes:**

1. **Fix React version conflicts** (for monorepos):
   - Remove all node_modules and lockfiles
   - Reinstall dependencies
   - Verify single React version with `npm ls react`

2. **For pnpm monorepos**, create `.npmrc`:
   ```ini
   public-hoist-pattern[]=!react
   public-hoist-pattern[]=!react-dom
   ```

3. **Ensure proper global-error.tsx structure**:
   ```typescript
   'use client';
   
   import Error from 'next/error';
   import { useEffect } from 'react';
   
   export default function GlobalError({
     error,
     reset,
   }: {
     error: Error & { digest?: string };
     reset: () => void;
   }) {
     useEffect(() => {
       console.error(error);
     }, [error]);
   
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

4. **Remove global-error.tsx entirely**:
   - Next.js will use default error handling
   - Avoids prerendering issues during build

5. **Debug with build flags**:
   ```bash
   next build --debug
   # or
   next build --debug-prerender
   # or
   NODE_ENV=development next build
   ```

### Specific to Your Issue

Since you're using:
- Next.js 16.0.7 (latest available)
- React 19.2.1 (latest available)
- Turbopack for builds
- Error occurs even with minimal/no global-error.tsx

**Recommended Actions:**

1. **No newer versions available** - You're already on the latest releases
2. **This bug has NOT been fixed** in any release after 16.0.7
3. **Try these in order**:
   - Delete `global-error.tsx` entirely
   - Use `NODE_ENV=production next build` as build command
   - Check for React version conflicts
   - If in monorepo, add pnpm `.npmrc` configuration
   - Try webpack instead of Turbopack: `next build --webpack`

4. **Consider filing a GitHub issue** if none of these work

### GitHub Issues Reference

**Related Open/Closed Issues:**
- #82499 - "TypeError: Cannot read properties of null (reading 'useContext') when running next build"
- #74858 - "Unable to run next build - Error occurred prerendering page"
- #64887 - "TypeError: Cannot read properties of null (reading 'useContext')"
- #43577 - Same error across multiple versions
- #59053 - "Build error while using global-error file inside app/[lang] folder"
- #53756 - "Global-error.js not catching exceptions as expected"

## Sources & Citations

- Next.js GitHub Releases: https://github.com/vercel/next.js/releases
- Next.js Blog: https://nextjs.org/blog
- React Versions: https://react.dev/versions
- React GitHub Releases: https://github.com/facebook/react/releases
- Next.js Prerender Error Docs: https://nextjs.org/docs/messages/prerender-error

## Key Takeaways

- **No newer versions available**: Next.js 16.0.7 and React 19.2.1 are latest (Dec 4, 2025)
- **Bug is not fixed**: Known recurring regression across many versions
- **Most common fix**: Delete `global-error.tsx` or use `NODE_ENV=production next build`
- **Root cause**: Usually React version conflicts or improper prerendering of client hooks
- **Turbopack may contribute**: Try `--webpack` flag as alternative

## Related Searches

- Monitor Next.js releases for 16.0.8+ which may include a fix
- Check React 19.2.2+ releases when available
- Search GitHub issues for "global-error prerender useContext" for updates
