# Perplexity Research: Supabase SSR Authentication Errors in Next.js 15/16

**Date**: 2025-12-01
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API

## Query Summary

Researched recent (last 3 months) issues, discussions, and solutions related to:
1. Supabase SSR "Invalid Refresh Token: Refresh Token Not Found" errors
2. Next.js 15/16 + Supabase auth errors on public/marketing pages
3. `getUser()` throwing errors for unauthenticated users in server components
4. `@supabase/ssr` package issues with stale cookies

Focus: GitHub issues in supabase/supabase, supabase/ssr, and Stack Overflow discussions

## Findings

### Root Causes

#### 1. Race Conditions in Middleware and Multiple Server Clients

**Primary Issue**: When `serverClient` is instantiated in multiple places (layouts, middleware, server components), competing refresh requests occur. The first request successfully refreshes the token, but subsequent refresh requests from other routes attempt to use an already-consumed refresh token.

**Error**: `AuthApiError: Invalid Refresh Token: Already Used`

**Why It Happens**:
- Middleware calls `supabase.auth.getUser()` to refresh tokens
- API routes simultaneously call `supabase.auth.getUser()`
- Both try to refresh the token at the same time
- First one succeeds, second one fails with "Already Used"

**Source**: GitHub Issue #18981 (supabase/supabase)

#### 2. Stale Tokens and Cookie Synchronization Issues

**Critical Problem**: When a token is refreshed on the server, it must be passed back to the browser via `response.cookies.set()`. If this doesn't happen correctly, the browser retains a stale token.

**What Happens**:
1. Middleware refreshes token successfully
2. Token stored in server-side `request.cookies`
3. BUT: Token not written to `response.cookies`
4. Browser keeps old stale token
5. Next server request triggers another refresh attempt
6. Collision occurs → session terminated

**Key Discovery**: Developers found that the `response` object was being overwritten when `set()` was called multiple times, resulting in only the last cookie being set.

**Source**: Multiple GitHub discussions

#### 3. Improper Middleware Configuration

**Common Mistake**: Using `getSession()` instead of `getUser()` in middleware.

**Why It's Wrong**:
- `getSession()` doesn't validate the JWT signature
- Can be spoofed/tampered with
- May trigger unnecessary refresh attempts
- Official docs now recommend `getUser()` or better yet `getClaims()` which validates JWT signature

**Warning from Docs**: "Never trust `supabase.auth.getSession()` inside server code such as middleware. It isn't guaranteed to revalidate the Auth token."

#### 4. Missing or Expired Refresh Tokens

**Error**: `AuthApiError: Invalid Refresh Token: Refresh Token Not Found`

**Occurs When**:
- Users logged out automatically (often daily)
- Refresh token missing from session state
- Cookies not properly persisted
- Session state corrupted

**Root Cause**: Middleware attempting to refresh a session that doesn't exist or has already expired, without proper error handling.

**Source**: GitHub Issue #68 (supabase/ssr)

#### 5. Conflicting Authentication Libraries

**Critical Discovery**: Having both old and new Supabase auth libraries installed simultaneously causes conflicts.

**Problematic Combination**:
- `@supabase/auth-helpers-nextjs` (deprecated)
- `@supabase/ssr` (new approach)

**Why**: Creates competing authentication mechanisms with different cookie management strategies.

#### 6. Cookie Encoding Issues

**Recent Discovery**: Session cookies were always being set in legacy base64 format despite using `cookieEncoding: 'none'` configuration.

**Expected**: JWT format cookies
**Actual**: `sb-<project-ref>-auth-token=base64-...` (base64-encoded JSON)

**Impact**: Can cause compatibility issues and unexpected behavior with token refresh logic.

**Source**: GitHub Discussion #35553

### API Breaking Changes

#### Major @supabase/ssr Rewrite (v0.4.0, June 2024)

**Changed From**:
```typescript
createServerClient(URL, KEY, {
  cookies: {
    get: async (name) => { /* ... */ },
    set: async (name, value, options) => { /* ... */ },
    remove: async (name) => { /* ... */ }
  }
})
```

**Changed To**:
```typescript
createServerClient(URL, KEY, {
  cookies: {
    getAll: async () => { /* return all cookies */ },
    setAll: async (cookiesToSet) => { /* set all cookies at once */ }
  }
})
```

**Reason for Change**: 
- The old `set()` method was being called multiple times
- Each call would overwrite the `response` object
- Only the last cookie would actually be set
- New `setAll()` approach allows atomic cookie setting

**Migration Required**: All SSR implementations needed updating.

**Source**: GitHub PR #1, GitHub Discussion #27037

#### Cookie Library Version Bump (v0.7.0, August 2025)

**Change**: Underlying `cookie` library version bumped to 1.0.2

**Impact**: Minor version bump due to dependency change, but should be safe to upgrade.

**Source**: GitHub Release v0.7.0

### getUser() Errors for Unauthenticated Users

#### The Problem

`supabase.auth.getUser()` throws `AuthSessionMissingError` when called without an active session:

```
[AuthSessionMissingError: Auth session missing!] {
  __isAuthError: true,
  name: 'AuthSessionMissingError',
  status: 400,
  code: undefined
}
```

**Why It's Problematic**:
- Occurs on public/marketing pages where users aren't logged in
- Crashes server components that call `getUser()` unconditionally
- Common with OAuth providers (Google social login) where user value becomes null in middleware

#### Performance Impact

Beyond errors, `getUser()` can cause significant latency:
- New pages taking nearly 0.5 seconds to load
- Substantially impacts user experience
- Happens because middleware makes HTTP request to validate JWT on every route

### Recommended Fixes

#### Fix #1: Proper Middleware Pattern (Most Important)

**DO THIS**:
```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function middleware(request) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  
  if (!data.user && 
      request.nextUrl.pathname !== "/signin" && 
      request.nextUrl.pathname !== "/") {
    return NextResponse.redirect(new URL("/signin", request.url));
  }
  
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
}
```

**Key Points**:
- Check if `data.user` exists before proceeding
- Handle unauthenticated state gracefully
- Only redirect from protected routes

#### Fix #2: Reset to Official Documentation

**Most Reliable Solution**: Reset all middleware and Supabase-related files to match exactly what appears in official Supabase documentation.

**Why**: Ensures no deprecated patterns or custom configurations that create race conditions.

**What Was Fixed for Many**: 
- Cookies not being refreshed properly
- New access token received from refresh token but not saved to cookies
- Middleware code not matching latest docs (updated November 2024)

**Source**: Multiple resolved GitHub issues

#### Fix #3: Properly Propagate Refreshed Tokens

**Critical Implementation**:
```typescript
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(URL, KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        // Set on request for Server Components
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        
        // Create fresh response
        response = NextResponse.next({ request });
        
        // Set on response for browser
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  await supabase.auth.getUser(); // Triggers refresh if needed

  return response;
}
```

**Three Critical Steps**:
1. Middleware refreshes token (via `getUser()`)
2. Refreshed token passed to Server Components (`request.cookies.set`)
3. Refreshed token passed to browser (`response.cookies.set`)

#### Fix #4: Remove Conflicting Dependencies

**Action Required**:
```bash
npm uninstall @supabase/auth-helpers-nextjs
```

**Why**: The auth-helpers package is deprecated and conflicts with the newer `@supabase/ssr` package.

**Verify**:
```bash
npm ls @supabase
```

Should only show:
- `@supabase/supabase-js`
- `@supabase/ssr`

#### Fix #5: Use getClaims() Instead of getSession()

**NEVER DO THIS** in server code:
```typescript
const { data: { session } } = await supabase.auth.getSession();
```

**DO THIS INSTEAD**:
```typescript
await supabase.auth.getClaims()
```

**Why**:
- `getSession()` can be spoofed (reads from cookies without validation)
- `getClaims()` validates JWT signature against project's public keys
- `getUser()` also validates but makes additional database call

**Official Guidance**: "Always use `supabase.auth.getClaims()` to protect pages and user data."

#### Fix #6: Defer Server-Side Auth When Necessary

**For Persistent Issues**:
- Defer rendering to the browser
- Let client library access up-to-date refresh tokens
- Avoids server-side refresh complications entirely

**Implementation**:
```typescript
// Server Component
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ClientAuthComponent />
    </Suspense>
  );
}

// Client Component
'use client';
export function ClientAuthComponent() {
  const supabase = createClient(); // Browser client
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });
  }, []);
  
  // ...
}
```

#### Fix #7: Client-Side Authentication State Monitoring

**For Client Components**:
```typescript
import { createClient } from "@/utils/supabase/component";
import { useState, useEffect } from "react";

const Page = () => {
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return <div>{/* Your content */}</div>;
};
```

**Benefits**:
- No errors for unauthenticated users
- Automatically updates when auth state changes
- Proper cleanup on unmount

#### Fix #8: Optimize Supabase Call Frequency

**Issue**: Making numerous consecutive Supabase requests triggers multiple token refresh attempts.

**Solutions**:
- Consolidate database queries (use joins, aggregations)
- Implement request batching
- Use React Query or SWR for client-side caching
- Rate limit can be triggered if too many refresh token requests hit API in short timeframe

#### Fix #9: Email Confirmation Settings

**Check This**: Supabase → Authentication → Providers → Email → "Confirm Email" setting

**Issue**: When "Confirm Email" is enabled, it can prevent proper authentication and cause `getUser()` to return null or errors.

**Action**: Turn off unless explicitly needed for your use case.

#### Fix #10: Sign In/Out State Management

**After Server-Side Auth Actions**:
```typescript
// "/app/auth/actions.ts"

export async function signIn(currentState, formData) {
  const supabase = await createClient();
  
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };
  
  const { error } = await supabase.auth.signInWithPassword(data);
  
  if (error) {
    return { message: error.message };
  }
  
  revalidatePath('/', 'layout');
  redirect("/?refresh_browser_auth"); // Query param triggers client refresh
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  
  redirect("/?refresh_browser_auth");
}
```

**Why `?refresh_browser_auth`**: 
- Signals browser client to sync with server-side session changes
- Prevents stale session state in browser
- Critical for proper SSR/client synchronization

### Additional Considerations

#### Middleware Scope Configuration

**Be Careful With Matchers**:
```typescript
export const config = {
  matcher: [
    '/',
    '/:path((?!_next/static|favicon.ico|_next/image|icons|manifest|api).*)',
  ],
};
```

**Issues**:
- Running middleware on too many routes increases collision likelihood
- Running on API routes can cause double-refresh attempts
- Consider excluding more paths if auth not needed

**Alternative**: Only run middleware on protected routes.

#### Next.js Prefetching Can Logout Users

**Gotcha**: If you have logout links that get prefetched, NextJS will prefetch the logout route, causing the server to immediately delete the auth cookie.

**Solution**:
```typescript
<Link href="/logout" prefetch={false}>
  Sign Out
</Link>
```

**How To Identify**: Check Network tab for unexpected prefetch requests to logout endpoints.

#### Cross-Origin Cookie Issues

**Problem**: If redirect response's `Location` header differs in origin from original request URL, browser ignores `Set-Cookie` header in redirect response.

**Example**:
```
GET http://127.0.0.1:3000/auth/confirm?token_hash=...
↓
307 Redirect to http://localhost:3000/auth/update-password
Set-Cookie: sb-127-auth-token=... (IGNORED by browser)
```

**Why**: Different origins (`127.0.0.1` vs `localhost`), and cookie has `SameSite=lax` without `Secure` flag.

**Solution**: Ensure consistent domain/origin usage across auth flows.

## Key Takeaways

1. **Race conditions are the #1 cause**: Multiple Supabase clients trying to refresh tokens simultaneously
2. **Cookie synchronization is critical**: Refreshed tokens must be set on both request and response
3. **Use getClaims() or getUser()**: Never trust getSession() in server code
4. **Remove deprecated packages**: Uninstall @supabase/auth-helpers-nextjs
5. **Follow official docs exactly**: Many issues resolved by resetting to official examples
6. **Handle unauthenticated gracefully**: Always check if user exists before accessing properties
7. **API changed significantly in v0.4.0**: Moved from get/set/remove to getAll/setAll
8. **Middleware can be removed**: If all Supabase calls are client-side via API routes
9. **Base64 cookie encoding issues**: May persist even with cookieEncoding: 'none'
10. **Performance impact**: getUser() adds ~500ms latency per request

## Related Searches

- Supabase SSR middleware optimization strategies
- Next.js 15/16 App Router authentication patterns
- Alternative auth solutions (NextAuth.js, Clerk) comparison
- JWT validation best practices in Next.js
- Cookie management in Next.js middleware

## Sources & Citations

1. [Refresh token errors in @supabase/ssr · Issue #18981 · supabase/supabase](https://github.com/supabase/supabase/issues/18981)
2. [AuthApiError: Invalid Refresh Token: Refresh Token Not Found · Issue #68 · supabase/ssr](https://github.com/supabase/ssr/issues/68)
3. [Invalid Refresh Token: Already Used: SSR NextJS - Answer Overflow](https://www.answeroverflow.com/m/1327003519747887257)
4. [Nextjs + SSR Access Token Not Refreshing · Discussion #26757 · supabase](https://github.com/orgs/supabase/discussions/26757)
5. [Cookies not setting properly supabase ssr · Issue #36 · supabase/ssr](https://github.com/supabase/ssr/issues/36)
6. [supabase/ssr updates and roadmap towards v1.0.0 #27037](https://github.com/orgs/supabase/discussions/27037)
7. [feat: full rewrite using getAll and setAll cookie methods · PR #1 · supabase/ssr](https://github.com/supabase/ssr/pull/1)
8. [SSR Session Cookie Always Set in Legacy base64 Format · Discussion #35553](https://github.com/orgs/supabase/discussions/35553)
9. [Server-Side Rendering | Supabase Docs](https://supabase.com/docs/guides/auth/server-side)
10. [Creating a Supabase client for SSR | Supabase Docs](https://supabase.com/docs/guides/auth/server-side/creating-a-client)

## Implementation Checklist

For the 2025slideheroes project, consider these immediate actions:

- [ ] Verify no @supabase/auth-helpers-nextjs installed
- [ ] Check middleware uses getUser() not getSession()
- [ ] Ensure cookies are set on both request and response
- [ ] Add error handling for unauthenticated state in middleware
- [ ] Review middleware matcher to exclude unnecessary routes
- [ ] Confirm using @supabase/ssr v0.7+ with getAll/setAll pattern
- [ ] Add prefetch={false} to logout links
- [ ] Validate consistent origin usage across auth flows
- [ ] Consider moving auth checks to client for public pages
- [ ] Test with expired tokens (set JWT expiry to 1 min)
