# Bug Diagnosis: E2E Tests Timeout During Fresh Authentication

## Summary

E2E Shard 4 tests that clear pre-authenticated storage state and attempt fresh login flows are timing out waiting for Supabase auth API responses. Tests using pre-authenticated sessions work correctly.

## Affected Tests

| Test File | Test Block | Status |
|-----------|-----------|--------|
| `admin.spec.ts` | Team Account Management (4 tests) | FAILING |
| `invitations.spec.ts` | Full Invitation Flow (2 tests) | FAILING |

**Pass Rate:** 4/10 tests pass (40%)

## Root Cause Analysis

### Primary Issue: Storage State Clearing Causes Auth Timeout

The `Team Account Management` describe block in `admin.spec.ts:265-311` explicitly clears all authentication state:

```typescript
test.describe("Team Account Management", () => {
  test.describe.configure({ mode: "serial" });
  // Start with clean session - this test performs full auth flows for different users
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    const auth = new AuthPageObject(page);
    testUserEmail = await createUser(page);  // Creates "test2@slideheroes.com"
    await auth.loginAsUser({
      email: testUserEmail,
      password: process.env.E2E_TEST_USER_PASSWORD || "",
    });
    // ^^^ TIMES OUT HERE - Auth API never responds within 15s
  });
});
```

### Evidence from Logs

```
[Phase 1] ❌ Auth API timeout after 15000ms
Credentials: test2@slideheroes.com
```

```
Test timeout of 120000ms exceeded.
Call log:
  - waiting for locator('[data-testid="account-selector-content"]')
```

### Evidence from Screenshots

1. **`admin-admin-Team-Account-Management-*.png`**: Shows sign-in page (auth never completed)
2. **`invitations-invitations-*.png`**: Shows blank white page (stuck during auth)

### Authentication Flow Analysis

The `loginAsUser()` method in `auth.po.ts`:
1. Navigates to `/auth/sign-in`
2. Fills email and password fields
3. Clicks submit button
4. Waits for response from `auth/v1/token?grant_type=password`
5. **TIMEOUT**: Supabase auth API never responds within 15000ms

### Why Pre-Authenticated Tests Pass

Tests using pre-authenticated storage state (e.g., `.auth/test1@slideheroes.com.json`) bypass the auth API call entirely - they load with valid session cookies already set.

## Hypothesis

The Supabase auth service is experiencing one or more of these issues:

1. **Rate Limiting**: Multiple concurrent tests may be hitting Supabase rate limits
2. **Cold Start Delay**: Local Supabase instance may have slow initial auth response
3. **Network Timing**: Tests not waiting long enough for auth service startup
4. **Service Not Ready**: Auth container may not be fully ready when tests start

## Reproduction Steps

1. Start the development environment: `pnpm dev`
2. Ensure Supabase is running: `pnpm supabase:web:start`
3. Run shard 4 tests: `pnpm --filter web-e2e test:shard4`
4. Observe Team Account Management tests timing out at auth step

## Verification Commands

```bash
# Check auth API responsiveness
curl -X POST http://localhost:54321/auth/v1/token?grant_type=password \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@slideheroes.com","password":"$E2E_TEST_USER_PASSWORD"}'

# Check Supabase status
npx supabase status
```

## Recommended Fixes

### Option 1: Use Pre-Authenticated State (Quick Fix)

Instead of clearing storage state and doing fresh login, use the existing pre-authenticated state file:

```typescript
// admin.spec.ts - Team Account Management
test.describe("Team Account Management", () => {
  test.describe.configure({ mode: "serial" });
  // Use pre-authenticated state instead of clearing
  test.use({ storageState: AUTH_STATES.OWNER_USER }); // test2@slideheroes.com

  // Remove createUser() call - user already exists
  test.beforeEach(async ({ page }) => {
    await page.goto("/home");
    // No login needed - already authenticated
  });
});
```

### Option 2: Increase Auth Timeout (Workaround)

Increase the auth API timeout in `auth.po.ts`:

```typescript
async loginAsUser(params: { email: string; password: string }) {
  // ... existing code ...

  // Increase timeout from 15000ms to 45000ms
  await this.page.waitForResponse(
    (resp) => resp.url().includes("auth/v1/token"),
    { timeout: 45000 }
  );
}
```

### Option 3: Add Auth Service Health Check (Robust Fix)

Add a pre-test health check to ensure Supabase auth is responsive:

```typescript
// global-setup.ts
async function ensureAuthServiceReady() {
  const maxRetries = 10;
  const retryDelay = 2000;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/health`);
      if (response.ok) return;
    } catch {
      await new Promise(r => setTimeout(r, retryDelay));
    }
  }
  throw new Error("Auth service not ready after retries");
}
```

### Option 4: Fix Test Design Pattern (Best Practice)

The core issue is mixing authentication paradigms. Tests should either:
- **Always** use pre-authenticated state (preferred for speed)
- **Or** use a dedicated "auth flow" test suite that runs separately with proper isolation

## Impact Assessment

- **Severity**: Critical (40% test failure rate)
- **Scope**: Shard 4 only (admin + invitations tests)
- **Blocking**: Yes - prevents CI/CD pipeline completion
- **Environment**: Both local and CI

## Related Files

- `apps/e2e/tests/admin/admin.spec.ts:265-311`
- `apps/e2e/tests/invitations/invitations.spec.ts`
- `apps/e2e/tests/authentication/auth.po.ts`
- `apps/e2e/tests/utils/auth-state.ts`
- `apps/e2e/.auth/*.json` (pre-authenticated state files)

## Next Steps

1. Create GitHub issue for tracking
2. Implement Option 1 (pre-authenticated state) as immediate fix
3. Consider Option 3 (health check) for long-term reliability

---
*Diagnosis completed by Claude*
*Date: 2025-11-27*
