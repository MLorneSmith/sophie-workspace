# Bug Diagnosis: Playwright Authentication Fails Due to Supabase Cookie Name Mismatch

**ID**: ISSUE-pending
**Created**: 2025-12-03T20:15:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

Playwright E2E tests fail to authenticate because the auth state cookies are generated with a cookie name (`sb-host-auth-token`) that doesn't match what the web server expects when running in development mode (`sb-127-auth-token`). This is caused by a mismatch between the Supabase URL used during auth state generation and the URL the development server uses.

## Environment

- **Application Version**: Current dev branch
- **Environment**: development/local E2E testing
- **Node Version**: 22
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Unknown - may have always been an issue when running against dev server

## Reproduction Steps

1. Run `pnpm dev` to start the development server on port 3000
2. Run Playwright tests (e.g., `pnpm --filter e2e test`)
3. Global setup generates auth states with cookies named `sb-host-auth-token`
4. Tests navigate to protected pages (e.g., `/home/*`)
5. Middleware checks for auth cookies using `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54521`
6. Server expects cookies named `sb-127-auth-token` but finds `sb-host-auth-token`
7. Session not recognized → user redirected to login page

## Expected Behavior

- Playwright tests should be able to navigate to authenticated pages without being redirected to login
- Auth state cookies should match what the running server expects

## Actual Behavior

- Playwright tests are redirected to the login page when accessing authenticated routes
- Auth sessions are not recognized by the middleware
- Cookie name mismatch prevents session restoration

## Diagnostic Data

### Auth State Cookie Analysis

The generated auth state files (e.g., `.auth/test1@slideheroes.com.json`) contain:

```json
{
  "cookies": [
    {
      "name": "sb-host-auth-token",
      "value": "base64-...",
      "domain": "localhost",
      "path": "/",
      "expires": 1764796125
    }
  ],
  "origins": [
    {
      "origin": "http://localhost:3001",
      "localStorage": [...]
    }
  ]
}
```

**Key observations:**
- Cookie name: `sb-host-auth-token` (derived from `host.docker.internal`)
- Origin: `http://localhost:3001` (Docker test server port)
- Domain: `localhost`

### Cookie Name Derivation

Supabase SSR derives cookie names from the Supabase URL hostname:
- `http://127.0.0.1:54521` → `sb-127-auth-token`
- `http://host.docker.internal:54521` → `sb-host-auth-token`

### Configuration Comparison

| Configuration | Supabase URL | Cookie Name Expected | Port |
|--------------|--------------|---------------------|------|
| `pnpm dev` (web) | `http://127.0.0.1:54521` | `sb-127-auth-token` | 3000 |
| Docker (test) | `http://host.docker.internal:54521` | `sb-host-auth-token` | 3001 |
| Global Setup | `http://host.docker.internal:54521` | `sb-host-auth-token` | - |

### Playwright Config Analysis

From `apps/e2e/playwright.config.ts`:
```typescript
baseURL:
  process.env.PLAYWRIGHT_BASE_URL ||
  process.env.TEST_BASE_URL ||
  process.env.BASE_URL ||
  "http://localhost:3001",  // Default to Docker test port
```

From `apps/e2e/.env.local`:
```
TEST_BASE_URL=http://localhost:3001
```

### Global Setup Cookie URL Logic

From `apps/e2e/global-setup.ts`:
```typescript
// For cookie naming, we need the URL the SERVER uses (not the E2E setup)
// When running against Docker, the server uses host.docker.internal
const supabaseCookieUrl =
  process.env.E2E_SERVER_SUPABASE_URL || "http://host.docker.internal:54521";
```

This hardcodes the assumption that tests run against Docker, not `pnpm dev`.

## Error Stack Traces

No explicit errors - the middleware silently redirects because no valid session is found.

Debug logging (when `DEBUG_E2E_AUTH=true`) would show:
```
[DEBUG_E2E_AUTH:getUser:claims] {"path":"/home/...","hasClaims":false,"error":null}
[DEBUG_E2E_AUTH:home:redirect] {"reason":"no claims","path":"/home/..."}
```

## Related Code

- **Affected Files**:
  - `apps/e2e/global-setup.ts` (lines 159-165) - Cookie URL configuration
  - `apps/e2e/playwright.config.ts` (lines 75-79) - Base URL configuration
  - `apps/e2e/.env.local` (line 70) - TEST_BASE_URL setting
  - `packages/supabase/src/get-supabase-client-keys.ts` - URL used by middleware
  - `apps/web/proxy.ts` - Middleware that checks auth cookies

- **Recent Changes**: None specifically related - this is a configuration gap
- **Suspected Functions**: `createMiddlewareClient()` using `NEXT_PUBLIC_SUPABASE_URL` for cookie naming

## Related Issues & Context

### Historical Context

This issue stems from the Docker testing infrastructure design. The global-setup.ts was written to support Docker-based testing (port 3001) which uses `host.docker.internal` for container networking. However, developers may also want to run Playwright tests against the standard dev server (port 3000).

## Root Cause Analysis

### Identified Root Cause

**Summary**: The auth state generation in `global-setup.ts` hardcodes `host.docker.internal` for cookie naming, but when tests run against `pnpm dev` (which uses `127.0.0.1`), the server expects differently-named cookies.

**Detailed Explanation**:

1. Supabase SSR derives authentication cookie names from the Supabase URL hostname:
   - `http://127.0.0.1:54521` → cookie name `sb-127-auth-token`
   - `http://host.docker.internal:54521` → cookie name `sb-host-auth-token`

2. The global-setup.ts file (`apps/e2e/global-setup.ts:163-165`) defaults to:
   ```typescript
   const supabaseCookieUrl =
     process.env.E2E_SERVER_SUPABASE_URL || "http://host.docker.internal:54521";
   ```

3. When running `pnpm dev`, the web app uses `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54521` (from `apps/e2e/.env.local:9`).

4. The middleware in `proxy.ts` creates a Supabase client using `getSupabaseClientKeys()` which reads `NEXT_PUBLIC_SUPABASE_URL`. This means the middleware expects cookies named `sb-127-auth-token`.

5. But the auth states contain cookies named `sb-host-auth-token` (generated for Docker).

6. Result: Cookie name mismatch → session not found → redirect to login.

**Supporting Evidence**:
- Auth state file shows cookie named `sb-host-auth-token` (line 4 of `.auth/test1@slideheroes.com.json`)
- `E2E_SUPABASE_URL=http://127.0.0.1:54521` in `.env.local` (used by dev server)
- Default `supabaseCookieUrl` is `http://host.docker.internal:54521` in global-setup.ts

### How This Causes the Observed Behavior

1. User runs `pnpm dev` → server starts on port 3000 with `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54521`
2. User runs Playwright tests with default `TEST_BASE_URL=http://localhost:3001` but tests actually hit port 3000 (or mismatch occurs)
3. Global setup creates auth states with `sb-host-auth-token` cookies (for Docker)
4. Tests navigate to `/home/*` routes
5. Middleware reads cookies looking for `sb-127-auth-token` (because that's what `127.0.0.1` generates)
6. Middleware finds only `sb-host-auth-token` → doesn't recognize it as valid session
7. `getUser()` returns no claims → redirect to login

### Confidence Level

**Confidence**: High

**Reasoning**:
- The Supabase SSR cookie naming convention is well-documented
- The auth state files clearly show `sb-host-auth-token` as the cookie name
- The configuration explicitly uses `127.0.0.1` for dev but `host.docker.internal` for cookie generation
- This exact pattern (cookie name mismatch) is a known issue when switching between Docker and non-Docker environments

## Fix Approach (High-Level)

**Option 1: Use Docker for E2E Tests (Recommended)**
- Ensure Playwright tests run against the Docker test environment (`docker-compose.test.yml`)
- Docker uses `host.docker.internal` for Supabase URL, matching the auth state cookies
- This is the intended design of the testing infrastructure

**Option 2: Make Cookie URL Configurable**
- Add environment variable `E2E_SERVER_SUPABASE_URL` to control which URL is used for cookie naming
- When running against `pnpm dev`, set `E2E_SERVER_SUPABASE_URL=http://127.0.0.1:54521`
- When running against Docker, use the default `http://host.docker.internal:54521`

**Option 3: Detect Running Environment**
- Modify global-setup.ts to detect whether it's connecting to Docker or dev server
- Automatically set cookie URL based on detected environment

## Diagnosis Determination

The root cause is definitively identified as a **cookie name mismatch** between:
1. Auth states generated by global-setup.ts (using `host.docker.internal` → `sb-host-auth-token`)
2. What the dev server expects (using `127.0.0.1` → `sb-127-auth-token`)

**Answer to user's question**: Yes, you should use the Docker testing infrastructure on port 3001 for Playwright tests. The auth states are generated specifically for the Docker environment. Running tests against `pnpm dev` (port 3000) requires either:
- Regenerating auth states with the correct Supabase URL, or
- Using the Docker test environment as designed

## Additional Context

The Docker test infrastructure (`docker-compose.test.yml`) is specifically designed to provide an isolated, consistent testing environment:
- Web app on port 3001
- Payload CMS on port 3021
- Both use `host.docker.internal` for Supabase connectivity
- Auth states are pre-generated for this environment

---
*Generated by Claude Debug Assistant*
*Tools Used: Glob, Grep, Read, file analysis*
