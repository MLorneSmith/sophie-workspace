# Perplexity Research: Next.js 15/16 Middleware and Authentication Changes

**Date**: 2025-12-11
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API

## Query Summary

Researched how Next.js 15 and 16 handle middleware, authentication routing, and cookie management. Specifically investigated:
1. Changes to middleware file conventions (middleware.ts vs proxy.ts)
2. Authentication routing and route protection patterns
3. Cookie handling changes in Next.js 15/16

## Key Findings

### 1. Middleware File Convention Changes

#### Next.js 15.x
- **File convention**: `middleware.ts` or `middleware.js` (unchanged from v14)
- **Location**: Project root or `src/middleware.*`
- **Status**: Fully supported, no deprecation
- **Runtimes**: 
  - Edge Runtime (original default)
  - Node.js Runtime (stable as of v15.4/15.5, experimental in v15.2)

#### Next.js 16.x
- **File convention**: **`proxy.ts` or `proxy.js`** (new)
- **Deprecated**: `middleware.ts` / `middleware.js` 
- **Migration**: `middleware.*` still works but shows deprecation warning
- **Codemod available**: `npx @next/codemod@canary middleware-to-proxy .`
- **Function rename**: `export function middleware()` → `export function proxy()`

**Version-Specific Summary**:

| Version | File Convention | Status |
|---------|----------------|--------|
| 12.2 – 15.5 | `middleware.ts` / `middleware.js` | Supported (standard) |
| 15.2 | Node.js runtime added (experimental) | Uses `middleware.*` |
| 15.4/15.5 | Node.js runtime stable | Uses `middleware.*` |
| 16.x | `proxy.ts` / `proxy.js` | New recommended; `middleware.*` deprecated |

### 2. Why the Rename: Security and Architecture

#### The March 2025 Vulnerability

A critical security vulnerability (CVE-2025-XXXXX) was disclosed by Rachid Allam affecting Next.js 11.1.4 through 15.2.2:
- **Exploit**: Adding `x-middleware-subrequest` header to HTTP requests bypassed ALL middleware-based authorization
- **Impact**: Complete bypass of route protection, authentication checks, and access controls
- **Root cause**: Middleware acting as security boundary is fragile in Next.js's distributed execution model

#### Architectural Philosophy Shift

The rename from `middleware` to `proxy` signals a fundamental change in Next.js's security model:

**Old Mental Model** (discouraged):
- Middleware acts as centralized gatekeeper
- All auth logic in one file
- Protected routes defined at top level
- Single point of failure

**New Mental Model** (recommended):
- `proxy.ts` handles routing, rewrites, redirects only
- Authentication/authorization at data access layer
- Every protected resource verifies access independently
- Defense in depth security

#### Why "Proxy"?

Next.js chose this name to:
1. **Clarify network boundary**: Proxy runs at edge, separated from app region
2. **Prevent misuse**: Term "middleware" confused with Express.js middleware
3. **Signal intent**: Move auth away from routing layer
4. **Discourage overuse**: Proxy should be "last resort" for tasks that can't be done elsewhere

### 3. Authentication Routing Best Practices

#### Recommended Pattern: Data Access Layer (DAL)

**Do NOT use proxy/middleware for auth** because:
- Matcher patterns can get out of sync with data access points
- Distributed execution creates bypass opportunities
- Single point of failure architecture
- Easy to make mistakes (forgetting to protect data endpoints)

**DO use Data Access Layer pattern**:

```typescript
// lib/data/posts.ts (Data Access Layer)
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { redirect } from 'next/navigation';

export async function getAllPosts() {
  // Auth check right before data access
  const { isAuthenticated } = await getKindeServerSession();
  
  if (!isAuthenticated) {
    redirect('/login');
  }
  
  // Only execute if authenticated
  const posts = await db.select().from(postsTable);
  return posts;
}
```

```typescript
// app/page.tsx (Server Component)
import { getAllPosts } from '@/lib/data/posts';

export default async function HomePage() {
  // Auth is bundled with data access
  const posts = await getAllPosts();
  
  return <PostsList posts={posts} />;
}
```

**Key principle**: Couple authentication checks with data access so they cannot be separated.

#### Layered Security Approach

1. **Proxy layer**: Routing, redirects, rewrites only
   - Example: Redirect `/old-path` to `/new-path`
   - Example: Localization routing
   - **NOT for**: Auth checks, session validation

2. **Server Components**: Re-verify session where needed
   - Call auth helpers (`getServerSession`, `auth()`, etc.)
   - Additional layer for sensitive pages

3. **Data Access Layer**: Primary security boundary
   - Every function that accesses protected data validates auth
   - Single source of truth for access control
   - Impossible to access data without passing checks

4. **API Routes**: Verify session in handlers
   - Don't rely only on proxy
   - Add CSRF protection
   - Input validation with Zod

#### Exception Cases (When Proxy Auth is Acceptable)

**Exception 1**: Lightweight global redirects for better UX
```typescript
// proxy.ts
export async function proxy(request: NextRequest) {
  const { isAuthenticated } = await getKindeServerSession();
  
  // Redirect unauthenticated users from /dashboard to /login
  if (!isAuthenticated && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Still need DAL checks on actual data access!
  return NextResponse.next();
}
```

**Exception 2**: Setting request headers for downstream consumption
```typescript
// proxy.ts - Add user context to headers
export async function proxy(request: NextRequest) {
  const session = await getSession();
  
  if (session?.userId) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', session.userId);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  
  return NextResponse.next();
}
```

**Critical**: Even with proxy checks, ALWAYS validate at data access layer.

### 4. Cookie Handling Changes

#### Breaking Change: Async `cookies()` API

**Next.js 14 and earlier**:
```typescript
import { cookies } from 'next/headers';

export default function Page() {
  const cookieStore = cookies(); // Synchronous
  const theme = cookieStore.get('theme');
}
```

**Next.js 15+** (breaking change):
```typescript
import { cookies } from 'next/headers';

export async function AdminPanel() {
  const cookieStore = await cookies(); // Now async!
  const token = cookieStore.get('token');
}
```

**Impact**:
- All uses of `cookies()` must be awaited
- Surrounding functions must be async
- Applies to: server components, layouts, route handlers, `generateMetadata`, middleware

#### Cookie API Methods (Unchanged)

The `CookieStore` interface remains the same:
- `get(name)` - Get single cookie
- `getAll()` - Get all cookies
- `set(name, value, options)` - Set cookie
- `delete(name)` - Delete cookie
- `has(name)` - Check existence

**Cookie options** (unchanged):
- `expires` - Expiration date
- `maxAge` - Max age in seconds
- `httpOnly` - HTTP-only flag
- `sameSite` - SameSite policy ('strict', 'lax', 'none')
- `secure` - Secure flag
- `priority` - Priority hint
- `partitioned` - Partitioned cookie flag

#### Next.js 16 Cookie Behavior with PPR

**Partial Prerendering (PPR)** changes rendering model:
- Awaiting `cookies()` marks only that segment as dynamic
- Rest of page can be statically prerendered
- Dynamic behavior isolated to components that need request data

**Before (≤14)**: Using `cookies()` made entire route dynamic
**After (16 with PPR)**: Only segment awaiting `cookies()` is dynamic

```typescript
// app/page.tsx
export default async function Page() {
  // This component is dynamic
  const cookieStore = await cookies();
  const theme = cookieStore.get('theme');
  
  return (
    <div>
      {/* Static content can still be prerendered */}
      <StaticHeader />
      
      {/* Only this part is dynamic */}
      <ThemedContent theme={theme?.value} />
    </div>
  );
}
```

#### Configuration Changes (15 → 16)

**Removed**: `experimental.dynamicIO` 
**Added**: `cacheComponents: true` in `next.config.js`

These changes affect how routes are cached when using `cookies()`, but don't change the cookie API itself.

### 5. Best Practices Summary

#### For Middleware/Proxy
1. **Use for routing only**: Rewrites, redirects, URL normalization
2. **Keep it lightweight**: No database calls, minimal logic
3. **Use matchers carefully**: Exclude static assets, API routes where appropriate
4. **Avoid auth as primary security**: Use for UX redirects only

#### For Authentication
1. **Implement Data Access Layer**: All protected data access goes through validated functions
2. **Defense in depth**: Multiple verification layers, not single gatekeeper
3. **Explicit security**: Auth checks visible in code, not "magical"
4. **Co-locate checks**: Authentication right before data access

#### For Cookies
1. **Await everywhere**: Always `await cookies()` in Next.js 15+
2. **Use secure options**: `httpOnly`, `secure`, `sameSite` for session cookies
3. **Understand PPR impact**: Cookie access makes segments dynamic in Next.js 16
4. **Single helper function**: Centralize session decode/verify logic

## Migration Checklist

### Upgrading to Next.js 15
- [ ] Change all `cookies()` calls to `await cookies()`
- [ ] Make all functions using cookies async
- [ ] Test middleware still works with async request data
- [ ] Update TypeScript types if needed

### Upgrading to Next.js 16
- [ ] Run codemod: `npx @next/codemod@canary middleware-to-proxy .`
- [ ] Rename `middleware.ts` → `proxy.ts`
- [ ] Rename `export function middleware()` → `export function proxy()`
- [ ] Review auth patterns - move to DAL if in proxy
- [ ] Remove `experimental.dynamicIO` from config
- [ ] Add `cacheComponents: true` if using component caching
- [ ] Test PPR behavior with cookies

## Sources & Citations

1. [Next.js - Renaming Middleware to Proxy](https://nextjs.org/docs/messages/middleware-to-proxy)
2. [Next.js - File Conventions: proxy.js](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
3. [Build with Matija - Why Next.js is Moving Away from Middleware](https://www.buildwithmatija.com/blog/nextjs16-middleware-change)
4. [YouTube - Next.js 16 Middleware DEPRECATED - Authentication In Proxy Or Data Access Layer?](https://www.youtube.com/watch?v=zNgCFXZLoRk)
5. Next.js 15 Release Notes (various sources)
6. Next.js 16 Beta Documentation
7. Perplexity Sonar Pro API responses (December 2025)

## Key Takeaways

1. **Next.js 16 deprecates `middleware.ts` in favor of `proxy.ts`** - signals architectural shift away from auth-in-middleware pattern

2. **March 2025 security vulnerability** exposed fundamental weakness in using middleware as security boundary in distributed execution model

3. **Data Access Layer (DAL) pattern is now recommended** for authentication - couple auth checks with data access for defense in depth

4. **Cookies became async in Next.js 15** - breaking change requiring `await cookies()` everywhere

5. **Proxy should be lightweight** - use for routing, rewrites, redirects only, not complex auth logic

6. **PPR in Next.js 16** changes how cookie access affects rendering - only segments awaiting cookies become dynamic

## Related Searches

- Next.js Data Access Layer patterns and examples
- NextAuth.js v5 integration with Next.js 16 proxy
- Supabase auth with Next.js 16 DAL pattern
- Next.js 16 Partial Prerendering (PPR) with authentication
- Migration strategies from middleware auth to DAL

## Implementation Recommendations for SlideHeroes

Based on this research, the SlideHeroes project should:

1. **Current state** (Next.js 16): Check if using `middleware.ts` or `proxy.ts`
2. **Auth architecture**: Review current auth pattern - if in middleware, plan DAL migration
3. **Cookie usage**: Verify all `cookies()` calls are awaited
4. **Supabase integration**: Implement DAL pattern for Supabase auth checks
5. **Testing**: E2E tests should verify auth at data layer, not just routing layer

Would you like a follow-up investigation of the current SlideHeroes middleware/auth implementation?
