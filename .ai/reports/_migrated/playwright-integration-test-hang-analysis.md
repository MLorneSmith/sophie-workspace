# Playwright Integration Test Hang Analysis

**Date**: 2025-09-29
**Issue**: Integration tests hanging during authentication flow in CI
**Environment**: GitHub Actions, dev.slideheroes.com deployment
**Status**: Root Cause Identified

## Executive Summary

Integration tests are hanging indefinitely during the authentication setup phase (`auth.setup.ts`), specifically during the `page.waitForURL()` calls after login attempts. The tests timeout after ~10 minutes without completing authentication or producing meaningful error messages.

## Root Cause Analysis

### Primary Issue: Indefinite `waitForURL()` Hang

**Location**: `apps/e2e/tests/authentication/auth.po.ts:244-253`

```typescript
await this.page.waitForURL(
  (url) => {
    const urlStr = url.toString();
    console.log(`Current URL during wait: ${urlStr}`);
    return !urlStr.includes("/auth/sign-in") && urlStr.includes(targetUrl);
  },
  {
    timeout: 30000, // 30 second timeout
  },
);
```

**Problem**: The `waitForURL()` predicate function is **never satisfied** during CI execution, causing tests to hang until the 30-second timeout expires, then retry via `toPass()`, creating a cascade of timeouts.

### Contributing Factors

#### 1. **Authentication Setup Uses `toPass()` Wrapper**

**Location**: `apps/e2e/tests/auth.setup.ts:36-44`

```typescript
await expect(async () => {
  await auth.loginAsUser({
    email: credentials.email,
    password: credentials.password,
  });
}).toPass({
  intervals: testConfig.getRetryIntervals("auth"), // [500, 1000, 2500, 5000, 8000, 12000] in CI
  timeout: testConfig.getTimeout("medium"), // 30000ms
});
```

**Impact**: When `loginAsUser()` hangs for 30s, `toPass()` retries with exponential backoff:

- Attempt 1: Hang for 30s, wait 500ms, retry
- Attempt 2: Hang for 30s, wait 1000ms, retry
- Attempt 3: Hang for 30s, wait 2500ms, retry
- Total: ~3+ minutes per user × 3 users = **9+ minutes** before final failure

#### 2. **Overly Strict URL Matching Predicate**

The URL predicate has two conditions that must BOTH be true:

```typescript
!urlStr.includes("/auth/sign-in") && urlStr.includes(targetUrl)
```

**Failure Scenarios**:

- If page redirects to `/onboarding` but `targetUrl = "/home"`, predicate fails
- If authentication succeeds but redirects to unexpected path, predicate fails
- If URL query parameters change during auth flow, predicate may never match
- If Vercel protection intercepts navigation, URL never changes from sign-in page

#### 3. **Missing Navigation Wait Strategies**

The `page.goto()` call for sign-in page has no explicit wait strategy:

```typescript
goToSignIn(next?: string) {
  return this.page.goto(`/auth/sign-in${next ? `?next=${next}` : ""}`);
}
```

**Missing**:

- `waitUntil` option (defaults to `load`, should use `domcontentloaded`)
- Network idle timeout for API calls
- Explicit verification that page loaded successfully before attempting sign-in

#### 4. **Aggressive Timeout Configuration in CI**

**Location**: `apps/e2e/tests/utils/test-config.ts:72-76`

```typescript
timeouts: {
  short: isCI ? 15000 : 10000,
  medium: isCI ? 30000 : 20000,  // Used for auth
  long: isCI ? 60000 : 45000,
}
```

**Problem**: 30-second timeout is reasonable, but when combined with `toPass()` retries and multiple authentication attempts (test, owner, admin), this creates compounding delays.

#### 5. **Vercel Protection May Block Navigation**

**Evidence from workflow**:

- Vercel bypass header is configured: `VERCEL_AUTOMATION_BYPASS_SECRET`
- Header is added to `extraHTTPHeaders` in playwright.config.ts
- However, header is static and applies to ALL requests

**Potential Issue**:

- Sign-in form submission may not inherit bypass header
- POST request to auth endpoint may be blocked
- Redirect after authentication may be intercepted by Vercel protection
- Result: Page navigation never completes, URL never changes

#### 6. **Console Logging Hidden in CI**

The auth flow has extensive console.log statements:

```typescript
console.log(`Current URL during wait: ${urlStr}`);
console.log(`Waiting for navigation to: ${targetUrl}`);
console.log(`Navigation complete. Final URL: ${this.page.url()}`);
```

**Problem**: In CI environment with `DEBUG: pw:api` enabled, Playwright debug logs may suppress application console logs, making it impossible to see what URL the page is actually on during the hang.

## Test Execution Flow

### Observed Sequence

1. ✅ **Workflow starts** - Dependencies installed, Playwright browsers cached
2. ✅ **Build step succeeds** - `@kit/shared` package built successfully
3. ✅ **Test command executes** - `pnpm --filter web-e2e test:integration`
4. ✅ **Playwright initializes** - 2 workers, chromium browser
5. ✅ **Auth setup begins** - Credentials validated successfully
6. ✅ **Browser launches** - Page context created (2 seconds)
7. ⚠️ **Navigation to /auth/sign-in** - `page.goto()` called
8. ❌ **Hang point** - `waitForURL()` never resolves
9. ⏱️ **Timeout cascade** - 30s timeout × 6 retries × 3 users
10. ❌ **Job timeout** - GitHub Actions kills job after 15 minutes

### Expected vs Actual Behavior

| Step | Expected | Actual | Status |
|------|----------|--------|--------|
| Navigate to sign-in | Page loads in <5s | Unknown - no visibility | ⚠️ |
| Fill credentials | Form fields populated | Likely succeeds | ✅ |
| Submit form | POST to auth API | May be blocked by Vercel | ❌ |
| Wait for redirect | URL changes to /home or /onboarding | URL remains at /auth/sign-in | ❌ |
| Save auth state | Storage state saved to .auth/*.json | Never reached | ❌ |

## Configuration Analysis

### Playwright Configuration

**File**: `apps/e2e/playwright.config.ts`

```typescript
use: {
  baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
  extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
    ? {
        "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
      }
    : undefined,
  navigationTimeout: 15 * 1000, // 15 seconds - SHORTER than waitForURL timeout!
  screenshot: "only-on-failure",
  trace: "on-first-retry",
}
```

**Issue**: `navigationTimeout: 15000` is shorter than the `waitForURL` timeout of 30000ms. This means:

- Initial navigation may timeout after 15s
- `waitForURL` continues waiting for another 15s
- Retry logic kicks in before navigation can complete

### Test Configuration

**CI Environment Detection**:

```typescript
const isCI = process.env.CI === "true";
const isDev = process.env.PLAYWRIGHT_BASE_URL?.includes("dev.");
```

**Current Settings**:

- Environment: CI + DEV
- Skip Email Verification: true
- Credential Validation: STRICT
- Max Retries: 3
- Base Delay: 2000ms
- Auth Timeout: 30000ms

## Why Tests Hang Instead of Failing Fast

1. **Silent Navigation Failures**: `page.goto()` doesn't throw on Vercel protection blocks
2. **Predicate Never Satisfied**: URL matching condition is too strict
3. **Retry Masking**: `toPass()` retries hide the actual failure mode
4. **Long Timeouts**: 30s timeout means each attempt takes full duration
5. **No Circuit Breaker**: No mechanism to detect repeated failures and abort early

## Evidence from Workflow Logs

### Last Visible Output

```
🔐 Authenticating owner user
🔐 Authenticating test user
```

### Missing Output (Never Logged)

```
Waiting for navigation to: /home
Current URL during wait: ...
Navigation complete. Final URL: ...
```

**Conclusion**: The `page.goto()` call or form submission is failing silently, preventing any logging from the `waitForURL` predicate function.

## Recommended Solutions

### Immediate Fixes (High Priority)

#### 1. **Add Explicit Wait Strategy to Navigation**

```typescript
goToSignIn(next?: string) {
  return this.page.goto(
    `/auth/sign-in${next ? `?next=${next}` : ""}`,
    {
      waitUntil: 'domcontentloaded', // Don't wait for all resources
      timeout: 15000 // Match navigationTimeout
    }
  );
}
```

#### 2. **Improve URL Matching Predicate**

```typescript
await this.page.waitForURL(
  (url) => {
    const urlStr = url.toString();
    console.log(`[AUTH] Current URL: ${urlStr}, Target: ${targetUrl}`);

    // Success if we're no longer on sign-in page AND on a protected route
    const notOnSignIn = !urlStr.includes("/auth/sign-in");
    const onProtectedRoute = urlStr.includes("/home") ||
                             urlStr.includes("/onboarding") ||
                             urlStr.includes(targetUrl);

    return notOnSignIn && onProtectedRoute;
  },
  {
    timeout: 20000, // Reduced from 30s
    waitUntil: 'domcontentloaded' // Don't wait for networkidle
  },
);
```

#### 3. **Add Pre-Navigation Health Check**

```typescript
async loginAsUser(params: {
  email: string;
  password: string;
  next?: string;
}) {
  // Navigate with explicit error handling
  try {
    const response = await this.goToSignIn(params.next);
    console.log(`[AUTH] Sign-in page response: ${response?.status()}`);

    // Verify we're actually on the sign-in page
    await this.page.waitForSelector('[data-test="email-input"]', {
      state: 'visible',
      timeout: 10000
    });
  } catch (error) {
    console.error(`[AUTH] Failed to load sign-in page:`, error);
    throw new Error(`Sign-in page failed to load: ${error.message}`);
  }

  // Continue with sign-in...
}
```

#### 4. **Add Circuit Breaker for Repeated Failures**

```typescript
// In auth.setup.ts
let setupAttempts = 0;
const MAX_SETUP_ATTEMPTS = 2; // Fail fast after 2 full cycles

test("authenticate as test user", async ({ page }) => {
  const auth = new AuthPageObject(page);
  const credentials = CredentialValidator.validateAndGet("test");

  console.log(`🔐 Authenticating test user: ${credentials.email} (Attempt ${++setupAttempts})`);

  if (setupAttempts > MAX_SETUP_ATTEMPTS) {
    throw new Error(
      `Auth setup failed after ${MAX_SETUP_ATTEMPTS} attempts. ` +
      `Check Vercel protection, network connectivity, and auth endpoint availability.`
    );
  }

  // Use toPass with REDUCED retry count
  await expect(async () => {
    await auth.loginAsUser({
      email: credentials.email,
      password: credentials.password,
    });
  }).toPass({
    intervals: [500, 2000, 5000], // Only 3 retries instead of 6
    timeout: testConfig.getTimeout("medium"),
  });

  await page.context().storageState({ path: testAuthFile });
});
```

#### 5. **Add Vercel Protection Diagnostic**

```typescript
// Add to auth.setup.ts before authentication attempts
test("verify Vercel protection bypass", async ({ page }) => {
  console.log("🔍 Testing Vercel protection bypass...");

  const response = await page.goto("/auth/sign-in");

  if (response?.status() === 401 || response?.status() === 403) {
    console.error("❌ Vercel protection is blocking access!");
    console.error("   Status:", response.status());
    console.error("   Headers:", response.headers());
    throw new Error(
      "Vercel protection bypass header is not working. " +
      "Check VERCEL_AUTOMATION_BYPASS_SECRET in GitHub Secrets."
    );
  }

  console.log("✅ Vercel protection bypass is working");
  console.log("   Status:", response?.status());
});
```

### Medium Priority Improvements

#### 6. **Reduce Timeout Configuration**

```typescript
// In test-config.ts
timeouts: {
  short: isCI ? 10000 : 8000,    // Reduced from 15s
  medium: isCI ? 20000 : 15000,  // Reduced from 30s
  long: isCI ? 45000 : 30000,    // Reduced from 60s
}
```

#### 7. **Improve Error Messages**

```typescript
await this.page.waitForURL(
  (url) => {
    const urlStr = url.toString();
    const matches = !urlStr.includes("/auth/sign-in") &&
                    urlStr.includes(targetUrl);

    if (!matches) {
      // Log WHY it doesn't match
      console.log(`[AUTH] URL predicate FAILED:`);
      console.log(`  Current: ${urlStr}`);
      console.log(`  Expected: ${targetUrl}`);
      console.log(`  Still on sign-in: ${urlStr.includes("/auth/sign-in")}`);
    }

    return matches;
  },
  { timeout: 20000 }
).catch(error => {
  // Enhance timeout error with context
  const currentUrl = this.page.url();
  throw new Error(
    `Navigation timeout after sign-in. ` +
    `Expected redirect to ${targetUrl}, but page is still at ${currentUrl}. ` +
    `Original error: ${error.message}`
  );
});
```

#### 8. **Add Test for Local Test Users vs CI Credentials**

The issue might be that CI is using E2E_TEST_USER_EMAIL/PASSWORD which may not exist in the dev environment:

```typescript
// Add diagnostic test
test("verify test credentials exist in target environment", async ({ page }) => {
  const credentials = CredentialValidator.validateAndGet("test");

  console.log("🔍 Verifying test user exists in dev environment...");
  console.log(`   Email: ${credentials.email}`);

  // Attempt login with diagnostic output
  const auth = new AuthPageObject(page);
  await auth.goToSignIn();
  await auth.signIn({
    email: credentials.email,
    password: credentials.password,
  });

  // Wait briefly and check for error messages
  await page.waitForTimeout(3000);

  const errorMessage = await page.locator('[role="alert"]').textContent();
  if (errorMessage?.includes("Invalid")) {
    throw new Error(
      `Test user credentials are invalid in dev environment. ` +
      `User ${credentials.email} may not exist or password is incorrect.`
    );
  }
});
```

### Low Priority (Monitoring & Observability)

#### 9. **Add Performance Monitoring**

```typescript
// Add to auth.po.ts
async loginAsUser(params: {
  email: string;
  password: string;
  next?: string;
}) {
  const startTime = Date.now();

  try {
    await this.goToSignIn(params.next);
    console.log(`[PERF] Sign-in page loaded in ${Date.now() - startTime}ms`);

    const signInStart = Date.now();
    await this.signIn({
      email: params.email,
      password: params.password,
    });
    console.log(`[PERF] Sign-in submitted in ${Date.now() - signInStart}ms`);

    const waitStart = Date.now();
    await this.page.waitForURL(...);
    console.log(`[PERF] Navigation completed in ${Date.now() - waitStart}ms`);
    console.log(`[PERF] Total auth time: ${Date.now() - startTime}ms`);
  } catch (error) {
    console.error(`[PERF] Auth failed after ${Date.now() - startTime}ms`);
    throw error;
  }
}
```

#### 10. **Add Screenshot on Hang**

```typescript
// In auth.setup.ts
await expect(async () => {
  try {
    await auth.loginAsUser({
      email: credentials.email,
      password: credentials.password,
    });
  } catch (error) {
    // Take screenshot before retry
    await page.screenshot({
      path: `.auth-debug/${credentials.email}-${Date.now()}.png`,
      fullPage: true
    });
    throw error;
  }
}).toPass({...});
```

## Risk Assessment

### Current State Risks

| Risk | Severity | Impact |
|------|----------|--------|
| Tests hang indefinitely | **CRITICAL** | Blocks deployments, wastes CI resources |
| No error diagnostics | **HIGH** | Cannot debug issues remotely |
| Vercel protection blocking | **HIGH** | Tests may never work in deployed environments |
| False positive passing | **MEDIUM** | Tests may pass locally but fail in CI |
| Resource exhaustion | **MEDIUM** | Long-running tests consume GitHub Actions minutes |

### Post-Fix Validation

After implementing fixes, verify:

1. ✅ Tests fail fast (within 60 seconds) when auth is broken
2. ✅ Error messages clearly indicate failure mode
3. ✅ Screenshots captured on failure show actual page state
4. ✅ Vercel protection bypass is working
5. ✅ Test users exist in dev environment
6. ✅ Navigation completes successfully
7. ✅ Auth state files are created

## Implementation Plan

### Phase 1: Diagnostic (30 minutes)

1. Add Vercel protection verification test
2. Add test user existence verification
3. Add performance logging
4. Run workflow to collect diagnostic data

### Phase 2: Quick Fixes (1 hour)

1. Fix `goToSignIn()` wait strategy
2. Improve URL matching predicate
3. Add pre-navigation health check
4. Reduce timeout configurations

### Phase 3: Resilience (1 hour)

1. Add circuit breaker for repeated failures
2. Improve error messages with context
3. Add screenshot capture on hang
4. Reduce `toPass()` retry count

### Phase 4: Validation (30 minutes)

1. Test locally against dev.slideheroes.com
2. Run in CI workflow
3. Verify failures are fast and descriptive
4. Document any remaining issues

## Alternative Approaches

### Option A: Skip Authentication Setup in CI

**Pros**:

- Tests run against unauthenticated endpoints only
- No dependency on test user credentials
- Fast and reliable

**Cons**:

- Cannot test authenticated flows
- Limited test coverage
- Defeats purpose of integration tests

### Option B: Use API-Based Authentication

Instead of UI-based auth, use Supabase API to create sessions:

```typescript
// In auth.setup.ts
test("authenticate as test user", async ({ page }) => {
  const credentials = CredentialValidator.validateAndGet("test");

  // Create session via API
  const response = await fetch(`${baseUrl}/api/auth/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET
    },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password
    })
  });

  const { session } = await response.json();

  // Inject session into browser
  await page.context().addCookies([{
    name: 'sb-access-token',
    value: session.access_token,
    domain: new URL(baseUrl).hostname,
    path: '/'
  }]);

  await page.context().storageState({ path: testAuthFile });
});
```

**Pros**:

- No UI interaction required
- Fast and reliable
- No navigation timeout issues

**Cons**:

- Requires API endpoint for session creation
- May not test actual user auth flow
- Session format must match application expectations

### Option C: Pre-Seed Sessions in Deployment

Store auth session files in repository, refresh periodically:

**Pros**:

- No authentication needed during tests
- Instant test startup
- No credential management

**Cons**:

- Sessions expire and need refresh
- Security risk of committed credentials
- Doesn't test authentication flow

## Conclusion

The root cause is a combination of:

1. **Indefinite `waitForURL()` hang** due to failed navigation
2. **Aggressive retry strategy** that masks the failure
3. **Possible Vercel protection blocking** authentication requests
4. **Overly strict URL matching** that prevents successful detection

The immediate fix is to:

1. Add explicit wait strategies to `page.goto()`
2. Relax URL matching predicate to accept /onboarding
3. Reduce retry counts to fail fast
4. Add diagnostic tests for Vercel protection and test user existence

Implementation time: **~3 hours** total

Risk level: **LOW** - Changes are isolated to test infrastructure, no production code affected

Success criteria: Integration tests complete within 5 minutes or fail with clear error messages within 60 seconds.
