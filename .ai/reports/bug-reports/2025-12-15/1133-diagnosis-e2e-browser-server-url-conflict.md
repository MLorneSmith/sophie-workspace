# Bug Diagnosis: E2E Browser-Server URL Conflict

**ID**: ISSUE-1133
**Created**: 2025-12-15T17:00:00Z
**Reporter**: system
**Severity**: high
**Status**: new
**Type**: bug

## Summary

E2E tests fail because `NEXT_PUBLIC_SUPABASE_URL` is set to `host.docker.internal:54521` which is resolvable by Docker containers (server-side code) but NOT resolvable by browsers (client-side code). The previous diagnosis (#1132) incorrectly proposed changing to `127.0.0.1`, which breaks server-side code inside Docker containers.

## Environment

- **Application Version**: latest (dev branch)
- **Environment**: Docker test environment (docker-compose.test.yml)
- **Browser**: Chromium (Playwright)
- **Node Version**: 22
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Never fully working - architectural conflict

## Reproduction Steps

1. Start Docker test environment: `docker-compose -f docker-compose.test.yml up -d`
2. Wait for health: `curl http://localhost:3001/api/health`
3. Run E2E tests: `pnpm --filter e2e test`
4. Observe failures in:
   - Password update test (timeout waiting for `/auth/v1/user`)
   - Invitation tests (empty role selector dropdown)

## Expected Behavior

- Password update form should successfully call Supabase Auth API
- Role selector should display available roles (owner, member, custom-role)

## Actual Behavior

- Password update: Browser request to `http://host.docker.internal:54521/auth/v1/user` hangs (DNS resolution fails)
- Role selector: Browser query to roles table fails silently, returns empty array

## Diagnostic Data

### Console Output
```
# Browser trying to reach host.docker.internal (fails - cannot resolve)
PUT http://host.docker.internal:54521/auth/v1/user ERR_NAME_NOT_RESOLVED

# Inside Docker container - host.docker.internal WORKS:
$ docker exec slideheroes-app-test node -e "http.get('http://host.docker.internal:54521/...')"
Result: status 200

# Inside Docker container - 127.0.0.1 FAILS:
$ docker exec slideheroes-app-test node -e "http.get('http://127.0.0.1:54521/...')"
Result: connect ECONNREFUSED 127.0.0.1:54521
```

### Network Analysis

| Context | Hostname | Resolves To | Works? |
|---------|----------|-------------|--------|
| Docker container → Host | `host.docker.internal` | Host IP via host-gateway | ✅ Yes |
| Docker container → Container itself | `127.0.0.1` | Container loopback | ❌ No (Supabase not in container) |
| Browser → Host | `127.0.0.1` | Host loopback | ✅ Yes |
| Browser → Docker hostname | `host.docker.internal` | N/A | ❌ No (DNS fails) |

### Why Previous Fix Attempt Failed

The original diagnosis (#1132) proposed:
> "Change `NEXT_PUBLIC_SUPABASE_URL` from `host.docker.internal:54521` to `127.0.0.1:54521`"

This was based on the incorrect assumption that:
> "Docker containers can reach 127.0.0.1:54521 because of the extra_hosts mapping"

**This is FALSE.** The `extra_hosts` mapping only maps `host.docker.internal` → host IP. It does NOT make `127.0.0.1` inside a container refer to the host. Inside Docker, `127.0.0.1` refers to the container's own loopback interface.

## Error Stack Traces
```
# Test timeout waiting for response that never comes
Error: Timeout 90000ms exceeded.
  at apps/e2e/tests/account/account.spec.ts:77:40
  waiting for response matching /auth\/v1\/user/

# Role query returns empty (no explicit error, just empty results)
RolesDataProvider: query returned 0 roles (expected 3)
```

## Related Code

- **Affected Files**:
  - `docker-compose.test.yml:30` - Sets `NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54521`
  - `docker-compose.test.yml:108` - Same setting for payload-test service
  - `apps/e2e/global-setup.ts:374-378` - Cookie URL logic
  - `packages/supabase/src/get-supabase-client-keys.ts` - Returns single URL for both contexts
  - `packages/supabase/src/clients/browser-client.ts` - Uses same URL as server
  - `packages/supabase/src/clients/server-client.ts` - Uses same URL as browser

- **Recent Changes**: Issue #1109 added fallback logic for Vercel preview, but didn't address local Docker testing
- **Suspected Functions**: `getSupabaseClientKeys()` - single source of truth for URL

## Related Issues & Context

### Direct Predecessors
- #1132 (OPEN): "Browser cannot resolve host.docker.internal" - Original diagnosis with incorrect fix proposal
- #714 (CLOSED): "E2E Shard 3 Tests Fail - Auth Session Not Recognized" - Cookie mismatch root cause
- #918/#920 (CLOSED): "host.docker.internal DNS Error" - Fixed for CI, not for local Docker

### Historical Context

This configuration has been changed 10+ times:

| Issue | Problem | Fix | Limitation |
|-------|---------|-----|------------|
| #714 | Cookie name mismatch | Split URLs for auth/cookies | Introduced `host.docker.internal` dependency |
| #876/#878 | E2E against dev server failed | Documented Docker test env requirement | - |
| #918/#920 | CI fails with `host.docker.internal` | Added `CI=true` fallback | Only fixes CI, not local Docker |
| #1096 | Vercel preview sessions lost | Domain-less cookies for Vercel | - |
| #1107/#1109 | Local Docker broke after Vercel fixes | Added defensive `isVercelPreview` check | - |

**The fundamental problem remains unsolved**: `NEXT_PUBLIC_*` variables are embedded at build time and used by both server (inside Docker) and browser (outside Docker).

## Root Cause Analysis

### Identified Root Cause

**Summary**: Architecture conflict - `NEXT_PUBLIC_SUPABASE_URL` is used by both server-side code (needs Docker-resolvable hostname) and browser-side code (needs host-resolvable hostname), but these requirements are mutually exclusive with a single environment variable.

**Detailed Explanation**:

1. **Docker server-side code** (SSR, middleware, API routes) runs INSIDE the Docker container
   - Must use `host.docker.internal` to reach Supabase on the host machine
   - `127.0.0.1` inside Docker refers to the container itself (where Supabase isn't running)

2. **Browser client-side code** runs in Playwright's Chromium browser on the HOST machine
   - Cannot resolve `host.docker.internal` (Docker-specific hostname)
   - Must use `127.0.0.1` or `localhost` to reach Supabase

3. **`NEXT_PUBLIC_*` variables** are embedded at build time
   - The same value is used for both server and browser bundles
   - There's no built-in mechanism for context-specific values

**Supporting Evidence**:
- Docker exec test confirms `host.docker.internal` works inside container, `127.0.0.1` does not
- Browser network tab shows DNS resolution failure for `host.docker.internal`
- Supabase client initialization uses single URL from `getSupabaseClientKeys()`

### How This Causes the Observed Behavior

1. Docker container builds Next.js with `NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54521`
2. Server-side code works (can resolve hostname)
3. Browser downloads client bundle containing this URL
4. Browser tries to make Supabase API calls to `host.docker.internal`
5. DNS resolution fails - request hangs or fails silently
6. Tests timeout or receive empty data

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct verification via `docker exec` confirms networking behavior
- Browser DevTools show DNS failure
- Implementation attempt of previous fix confirmed the failure mode

## Fix Approach (High-Level)

### Option 1: Playwright Route Interception (Recommended)

Add a global Playwright fixture that intercepts browser requests and rewrites `host.docker.internal` to `127.0.0.1`:

```typescript
// apps/e2e/playwright.fixtures.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  context: async ({ context }, use) => {
    // Intercept and rewrite Docker hostname to localhost for browser requests
    await context.route('**/*host.docker.internal*', async (route) => {
      const url = route.request().url().replace('host.docker.internal', '127.0.0.1');
      await route.continue({ url });
    });
    await use(context);
  },
});
```

**Pros**: No code changes to main app, only affects E2E tests, works consistently
**Cons**: Requires updating all test files to use custom fixture

### Option 2: Host Entry on Test Machine

Add `host.docker.internal` to `/etc/hosts` on the host machine:

```bash
# Add to /etc/hosts (Linux/Mac) or C:\Windows\System32\drivers\etc\hosts (Windows)
127.0.0.1 host.docker.internal
```

**Pros**: Simplest fix, no code changes
**Cons**: Requires system configuration, may conflict with actual Docker networking, not portable

### Option 3: Separate Server/Browser Environment Variables

Add `SUPABASE_SERVER_URL` for server-side and modify `getSupabaseClientKeys()`:

```typescript
// In get-supabase-client-keys.ts
export function getSupabaseClientKeys() {
  const isBrowser = typeof window !== 'undefined';
  const url = isBrowser
    ? process.env.NEXT_PUBLIC_SUPABASE_URL  // Browser uses public URL
    : (process.env.SUPABASE_SERVER_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  // ...
}
```

**Pros**: Clean separation of concerns
**Cons**: Requires code changes, adds complexity, need to maintain two URLs

### Option 4: Reverse Proxy (nginx)

Add nginx to Docker Compose that proxies requests:

**Pros**: Clean URL for everyone
**Cons**: Adds infrastructure complexity, more moving parts

## Recommended Solution

**Option 1 (Playwright Route Interception)** is recommended because:
1. Zero changes to production code
2. Only affects E2E test environment
3. Easy to implement and test
4. Works consistently across all test scenarios
5. Can be combined with existing global-setup pattern

## Diagnosis Determination

The root cause is an **architectural conflict** inherent in the Docker test setup:
- Server-side code REQUIRES `host.docker.internal` (Docker can't reach host via `127.0.0.1`)
- Browser-side code REQUIRES `127.0.0.1` or `localhost` (browsers can't resolve Docker hostnames)
- `NEXT_PUBLIC_*` variables provide only ONE value for both contexts

The previous diagnosis (#1132) incorrectly assumed `127.0.0.1` would work inside Docker containers. This has been disproven through direct testing.

## Additional Context

- This issue only affects local Docker E2E testing (CI uses different infrastructure)
- Production deployments don't have this problem (same hostname works everywhere)
- The Vercel preview deployment fixes (#1096, #1107, #1109) are orthogonal to this issue

---
*Generated by Claude Debug Assistant*
*Tools Used: gh issue view, docker exec verification, grep, read*
