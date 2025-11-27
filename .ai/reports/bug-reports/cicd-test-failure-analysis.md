# CI/CD Test Failure Analysis - Dev Integration Tests

**Date:** 2025-11-11
**Workflow:** Dev Integration Tests
**Repository:** MLorneSmith/2025slideheroes
**Failed Run IDs:** 19276334138, 19275199578, 19272347641

## Executive Summary

**Root Cause:** Integration tests are experiencing **catastrophic timeouts** in deployed environments (dev.slideheroes.com), with tests consistently timing out after 15+ seconds of retrying element visibility assertions. The issue is **not** related to authentication, deployment readiness, or environment configuration - all setup steps complete successfully.

**Impact:** 100% test failure rate in CI/CD pipeline after 12+ minutes of execution
**Priority:** P0 - Blocks deployment pipeline
**Confidence:** HIGH - Pattern confirmed across 10 consecutive failed runs

---

## Failure Analysis

### What's Working ✅

1. **Deployment Readiness**
   - HTTP 200 response from dev.slideheroes.com
   - DNS resolution successful
   - Deployment verified ready within 0-2 seconds

2. **Authentication Setup** (CRITICAL SUCCESS)
   - All 3 user auth states created successfully via Supabase API:
     - test@slideheroes.com ✅
     - owner@slideheroes.com ✅
     - super-admin@slideheroes.com ✅
   - Session injection into browser storage working
   - Navigation to /home successful for all users
   - Pre-authenticated browser states saved correctly

3. **Environment Configuration**
   - Vercel bypass headers configured
   - All secrets properly set
   - BASE_URL correctly pointing to deployed environment
   - Playwright browser successfully launched

### What's Failing ❌

**Pattern:** Tests start executing, then **hang indefinitely** waiting for UI elements to appear.

#### Observed Failure Timeline

```
19:29:57 - Test suite starts (27 tests using 2 workers)
19:30:11 - First `toHaveURL` assertions timing out (15s)
19:36:25 - Multiple `toBeVisible` assertions retrying every 15s
19:37:11 - Continuous timeout retries
...
19:42:25 - Tests abandoned after 180s timeout (3 minutes per test)
```

#### Specific Failure Modes

**1. Form Element Timeouts** (Most Common)
```typescript
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  - waiting for locator('form') to be visible

Location: team-accounts.po.ts:38
```

**2. Sign-in Element Timeouts**
```typescript
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  - waiting for locator('[data-testid="sign-in-email"]') to be visible

Location: auth.po.ts:18, 22
```

**3. Account Selector Timeouts**
```typescript
Error: Test timeout of 180000ms exceeded
  at team-accounts.po.ts:89

  87 | this.page.locator('[data-test="account-selector-content"]'),
  88 | ).toBeVisible();
```

**4. Billing Plan Element Timeouts**
```typescript
Error: expect(locator).toBeVisible() failed
  Locator: locator('[data-test-plan]').first()
  Expected: visible
  Timeout: 15000ms
  Error: element(s) not found
```

---

## Root Cause Analysis

### Primary Issue: Page Load / Rendering Failure

The test execution pattern reveals that:

1. ✅ Authentication is working (sessions created and injected successfully)
2. ✅ Navigation to /home succeeds (waitForURL passes)
3. ❌ **Page content never loads or renders**

This suggests one of the following:

### Hypothesis 1: Client-Side Rendering Deadlock (HIGH CONFIDENCE)

**Evidence:**
- Page navigation succeeds (`page.goto('/home')` completes)
- `waitForURL('**/home**')` passes during global setup
- But **zero UI elements become visible** during actual tests
- Consistent across all 27 integration tests

**Possible Causes:**
- Next.js client-side hydration failing in deployed environment
- React components stuck in loading/suspense state
- JavaScript bundle loading failures (network or CSP issues)
- Unhandled JavaScript errors preventing rendering

### Hypothesis 2: Vercel Protection Interference (MEDIUM CONFIDENCE)

**Evidence:**
- Bypass headers configured in global setup work
- But tests may not be preserving bypass cookies across navigations
- Tests might be hitting Vercel's protection layer **after** initial page load

**Counter-Evidence:**
- Global setup successfully navigates to /home with same headers
- Deployment check returned HTTP 200

### Hypothesis 3: Test Data Pollution (LOW CONFIDENCE)

**Evidence:**
- Tests creating team accounts, invitations, etc.
- Production database may be in inconsistent state
- Tests expecting clean slate but encountering existing data

**Counter-Evidence:**
- Tests use unique random emails
- Auth setup completes successfully

---

## Failed Tests Breakdown

### Tests Running (27 total)

Based on `@integration` tag grep:

1. **Account Tests** - `account-simple.spec.ts`
2. **Authentication Tests** - `auth-simple.spec.ts`
3. **Team Accounts Tests** - `team-accounts.spec.ts` (5 describe blocks)
   - Team Accounts
   - Team Account Deletion
   - Team Member Role Management
   - Team Ownership Transfer
   - Team Account Security
4. **Team Billing Tests** - `team-billing.spec.ts`
5. **User Billing Tests** - `user-billing.spec.ts`

### Timeout Locations

Most timeouts occurring in:
- `team-accounts.po.ts` lines 38, 55, 89
- `auth.po.ts` lines 18, 22
- Billing test page objects

---

## Environment Configuration (Confirmed Working)

```bash
BASE_URL: https://dev.slideheroes.com
PLAYWRIGHT_BASE_URL: https://dev.slideheroes.com
PLAYWRIGHT_API_URL: https://dev.slideheroes.com
SKIP_EMAIL_VERIFICATION: true
CI: true
PLAYWRIGHT_TEST: true (Turnstile bypass)
ENABLE_BILLING_TESTS: true
ENABLE_TEAM_ACCOUNT_TESTS: true

# All E2E credentials set
# Supabase URL and Anon Key configured
# Vercel bypass secrets present
```

### Playwright Configuration

- Workers: 2 (reduced from 4 for stability)
- Retries: 1
- Timeout: 180s per test (CI)
- Navigation timeout: 90s (CI)
- Expect timeout: 15s (CI)
- Max failures: 0 (run all tests)

---

## Diagnostic Evidence Needed

To confirm root cause, we need:

### 1. Console Logs from Failed Tests
**Command to add:**
```typescript
page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
page.on('pageerror', err => console.log('PAGE ERROR:', err));
```

### 2. Network Request Failures
**Check for:**
- Failed JavaScript bundle loads
- CSP violations
- API request failures
- Timeout on critical resources

### 3. Screenshot/Video from Failed Tests
**Already configured:** `screenshot: "only-on-failure"`
**Need to:** Download artifacts from GitHub Actions

### 4. HTML Snapshot at Timeout
**Add to tests:**
```typescript
const html = await page.content();
console.log('PAGE HTML AT TIMEOUT:', html.substring(0, 500));
```

---

## Recommended Fixes (Prioritized)

### 🔴 IMMEDIATE (P0) - Diagnostic Collection

**1. Enable Full Debug Output in CI**

Edit `/home/msmith/projects/2025slideheroes/.github/workflows/dev-integration-tests.yml` line 397:

```yaml
env:
  DEBUG: pw:api,pw:browser,pw:protocol  # Expanded debugging
  PWDEBUG: 1  # Enable Playwright inspector logs
```

**2. Add Browser Console Logging**

Create utility in `apps/e2e/tests/utils/debug-helpers.ts`:

```typescript
export function attachDebugListeners(page: Page, testName: string) {
  page.on('console', msg =>
    console.log(`[${testName}] CONSOLE:`, msg.type(), msg.text())
  );
  page.on('pageerror', err =>
    console.error(`[${testName}] PAGE ERROR:`, err.message)
  );
  page.on('requestfailed', req =>
    console.error(`[${testName}] FAILED REQUEST:`, req.url(), req.failure())
  );
}
```

**3. Capture Page State on Timeout**

Add to Page Objects before waitForSelector:

```typescript
try {
  await page.waitForSelector('[data-test="element"]', { timeout: 10000 });
} catch (error) {
  console.error('=== TIMEOUT DIAGNOSTIC ===');
  console.error('URL:', page.url());
  console.error('HTML:', await page.content());
  console.error('Network State:', await page.evaluate(() =>
    ({ readyState: document.readyState })
  ));
  throw error;
}
```

### 🟡 SHORT-TERM (P1) - Configuration Adjustments

**4. Verify Vercel Bypass Cookie Persistence**

Check if bypass cookie is preserved after navigation. In `global-setup.ts`, verify cookie is set:

```typescript
const cookies = await context.cookies();
console.log('Vercel bypass cookie set:',
  cookies.find(c => c.name.includes('vercel'))
);
```

**5. Add Explicit Wait for Hydration**

In Page Objects, before interacting with elements:

```typescript
// Wait for React hydration to complete
await page.waitForFunction(() =>
  document.readyState === 'complete' &&
  window.__NEXT_DATA__ !== undefined
, { timeout: 30000 });
```

**6. Reduce Test Concurrency to 1 Worker**

In `playwright.config.ts` line 58:

```typescript
workers: process.env.CI ? 1 : undefined,  // Changed from 2
```

This eliminates any potential race conditions in deployed environment.

### 🟢 MEDIUM-TERM (P2) - Test Architecture Improvements

**7. Add Health Check Before Each Test**

```typescript
test.beforeEach(async ({ page }) => {
  // Verify app is responsive
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
});
```

**8. Implement Retry Logic with Exponential Backoff**

Use Playwright's `toPass()` for flaky operations:

```typescript
await expect(async () => {
  await page.goto('/home');
  await expect(page.locator('[data-test="main-content"]')).toBeVisible();
}).toPass({
  intervals: [1000, 2000, 5000, 10000],
  timeout: 30000
});
```

**9. Split Integration Tests into Smaller Shards**

Current: 27 tests in single job
Recommended: Split into 3-4 jobs with 7-9 tests each

This reduces timeout impact and parallelizes execution.

---

## Test Environment Comparison

| Aspect | Local (Working) | CI (Failing) |
|--------|----------------|--------------|
| Base URL | localhost:3000 | dev.slideheroes.com |
| Network | Local loopback | Internet → Vercel Edge |
| Workers | Unlimited | 2 |
| Timeout | 120s | 180s |
| Retries | 1 | 1 |
| Auth Method | API (same) | API (same) |
| Browser | Chromium (same) | Chromium (same) |

**Key Difference:** Network latency and potential Vercel edge caching issues.

---

## Action Items

### For Investigation
- [ ] Download test artifacts (screenshots/traces) from failed run 19276334138
- [ ] Check dev.slideheroes.com manually for JavaScript console errors
- [ ] Verify Next.js SSR/CSR hydration working correctly in production
- [ ] Test Vercel bypass cookie persistence across navigations
- [ ] Check for CSP headers blocking resources

### For Fixes
- [ ] Implement diagnostic logging (Fix #1-3)
- [ ] Add page state debugging on timeout
- [ ] Verify hydration wait logic
- [ ] Reduce workers to 1 for testing
- [ ] Add pre-test health checks

### For Monitoring
- [ ] Set up Vercel deployment monitoring
- [ ] Add Sentry error tracking for test failures
- [ ] Create dashboard for CI test metrics

---

## Related Files

### Configuration
- `/home/msmith/projects/2025slideheroes/.github/workflows/dev-integration-tests.yml`
- `/home/msmith/projects/2025slideheroes/apps/e2e/playwright.config.ts`
- `/home/msmith/projects/2025slideheroes/apps/e2e/global-setup.ts`

### Test Files (Failing)
- `/home/msmith/projects/2025slideheroes/apps/e2e/tests/team-accounts/team-accounts.spec.ts`
- `/home/msmith/projects/2025slideheroes/apps/e2e/tests/authentication/auth-simple.spec.ts`
- `/home/msmith/projects/2025slideheroes/apps/e2e/tests/account/account-simple.spec.ts`
- `/home/msmith/projects/2025slideheroes/apps/e2e/tests/*-billing/*.spec.ts`

### Page Objects
- `/home/msmith/projects/2025slideheroes/apps/e2e/tests/team-accounts/team-accounts.po.ts`
- `/home/msmith/projects/2025slideheroes/apps/e2e/tests/authentication/auth.po.ts`

---

## Next Steps

1. **IMMEDIATE:** Implement diagnostic logging (Fixes #1-3)
2. **RUN:** Trigger new workflow run with enhanced debugging
3. **ANALYZE:** Review detailed logs to confirm root cause
4. **FIX:** Apply targeted solution based on diagnostic results
5. **VERIFY:** Confirm tests pass in CI environment

---

## Conclusion

The CI/CD test failures are **not caused by**:
- ❌ Authentication issues (setup completes successfully)
- ❌ Deployment readiness (deployment verified ready)
- ❌ Environment configuration (all variables correct)
- ❌ Missing secrets (bypass headers configured)

The failures **are caused by**:
- ✅ Pages failing to render UI content after navigation
- ✅ Likely client-side hydration/rendering issue in deployed environment
- ✅ Potentially Vercel edge caching or CSP blocking resources

**Recommended immediate action:** Implement diagnostic logging (#1-3) and run new test to capture detailed browser state, console logs, and network activity at point of failure.

**Expected resolution time:** 2-4 hours after diagnostic data collected
