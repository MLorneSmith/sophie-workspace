# Bug Diagnosis: Site unreachable after sign-in when navigating to /home

**ID**: ISSUE-701
**Created**: 2025-11-26T14:45:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

After running `pnpm dev`, signing in successfully, and navigating to `/home`, the browser displays a "site can't be reached" error. The server logs show successful responses for `/` and `/auth/sign-in` but no logs appear for the `/home` request, suggesting the request either crashes the server or never completes.

## Environment

- **Application Version**: 1fb16ffd1 (dev branch)
- **Environment**: development
- **Node Version**: 22.16.0
- **pnpm Version**: 10.14.0
- **Next.js Version**: 16.0.3 (Turbopack)
- **Database**: Supabase local (running, verified)

## Reproduction Steps

1. Run `pnpm dev` to start development servers
2. Navigate to `http://localhost:3000/auth/sign-in`
3. Sign in with valid credentials
4. After successful sign-in, client-side navigation to `/home` triggers
5. Browser shows "site can't be reached" error

## Expected Behavior

After successful sign-in, user should be redirected to `/home` and see their dashboard.

## Actual Behavior

Browser displays "site can't be reached" error (ERR_CONNECTION_REFUSED or similar). No server logs appear for the `/home` request.

## Diagnostic Data

### Server Log (provided)
```
web:dev:  GET / 200 in 2.1s (compile: 659ms, proxy.ts: 129ms, render: 1297ms)
web:dev:  GET /auth/sign-in 200 in 74ms (compile: 28ms, proxy.ts: 8ms, render: 39ms)
[no further logs for /home request]
```

### Middleware/Proxy Status
- `proxy.ts` exists at `apps/web/proxy.ts` with correct Next.js 16 convention
- Export function is named `proxy` (correct)
- Compiled middleware references proxy.ts: `INNER_MIDDLEWARE_MODULE => "[project]/apps/web/proxy.ts [middleware] (ecmascript)"`
- Middleware manifest was initially empty but compiled files exist

### Supabase Status
```
supabase local development setup is running.
API URL: http://127.0.0.1:54521
Database URL: postgresql://postgres:postgres@127.0.0.1:54522/postgres
```

## Root Cause Analysis

### Identified Root Cause

**Summary**: The exact root cause could not be definitively identified due to missing error logs for the `/home` request. However, investigation reveals the issue is likely related to the proxy.ts execution or server crash during the authentication check.

**Key Findings**:

1. **proxy.ts is correctly configured** for Next.js 16:
   - File location: `apps/web/proxy.ts` (correct)
   - Export: `export async function proxy(request: NextRequest)` (correct)
   - Config with matcher defined (correct)

2. **Proxy IS executing** for other routes:
   - Server logs show `proxy.ts: 129ms` and `proxy.ts: 8ms` for `/` and `/auth/sign-in`
   - This confirms Next.js 16 is recognizing and running the proxy

3. **No logs for /home** suggests:
   - Server crashes before logging the request
   - Request hangs/times out before completing
   - Process exits during proxy handler execution

4. **Potential issue in /home handler** (proxy.ts lines 179-214):
   - Handler makes multiple async Supabase calls: `getUser()`, `auth.getUser()`, `checkRequiresMultiFactorAuthentication()`
   - Any of these could throw an unhandled exception
   - Handler doesn't explicitly return for successful auth cases (returns undefined, which is handled but unusual)

### Supporting Evidence

- URLPattern polyfill is loaded (needed - Node 22 doesn't have native URLPattern)
- Supabase is running and accessible
- Sign-in page loads successfully (200 response)
- Client-side navigation uses `router.replace('/home')` after successful auth

### How This Causes the Observed Behavior

1. User signs in successfully (client-side Supabase auth)
2. Auth cookies are set by Supabase SDK
3. `router.replace('/home')` triggers navigation
4. Request reaches proxy.ts `/home/*` handler
5. Handler calls `getUser(req, res)` which creates Supabase middleware client
6. **Possible crash/hang occurs** during Supabase auth operations
7. Server process crashes or request times out
8. Browser receives connection refused/reset

### Confidence Level

**Confidence**: Medium

**Reasoning**:
- Confirmed proxy.ts is correctly set up and running for other routes
- Confirmed Supabase is running
- Missing the actual error/crash logs to definitively identify the crash point
- Multiple possible failure points in the async handler chain

## Fix Approach (High-Level)

1. **Add error handling** to proxy.ts handlers to catch and log exceptions
2. **Add try-catch wrapper** around the Supabase calls in the `/home/*` handler
3. **Verify authentication cookies** are being set correctly after sign-in
4. **Check for any startup errors** that might indicate missing dependencies

Example defensive change for proxy.ts:
```typescript
{
  pattern: new URLPattern({ pathname: "/home/*?" }),
  handler: async (req: NextRequest, res: NextResponse) => {
    try {
      const { data } = await getUser(req, res);
      // ... rest of handler
    } catch (error) {
      console.error('Proxy /home handler error:', error);
      // Return error response instead of crashing
      return NextResponse.redirect(new URL('/auth/sign-in', req.nextUrl.origin).href);
    }
  },
},
```

## Next Steps Required

1. **Reproduce and capture full logs**: Run `pnpm dev` and attempt sign-in, capture ALL terminal output including any errors
2. **Check browser DevTools**: Look at Network tab for the actual request/response status
3. **Add console.log** at the start of `/home/*` handler to confirm if execution reaches it
4. **Check if server process crashes**: Monitor if the Node process exits when accessing /home

## Related Code

- **Affected Files**:
  - `apps/web/proxy.ts` (lines 179-214 - /home handler)
  - `packages/supabase/src/clients/middleware-client.ts`
  - `packages/features/auth/src/components/sign-in-methods-container.tsx` (line 42 - router.replace)

- **Recent Changes**: Middleware renamed from `middleware.ts` to `proxy.ts` in upstream commit `2b46314b69f02ab31438f31b35b3a07a4e7ce05d`

## Additional Context

The Makerkit version is 7 commits behind upstream. The middleware-to-proxy rename was part of the Next.js 16 upgrade in the upstream repository.

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash, Grep, Glob, Read, Task (context7-expert)*
