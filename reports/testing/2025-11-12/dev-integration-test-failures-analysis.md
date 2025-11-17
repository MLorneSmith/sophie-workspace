# Dev Integration Test Failures Analysis

**Date**: 2025-11-12
**Repository**: MLorneSmith/2025slideheroes
**Workflow**: dev-integration-tests.yml
**Test Suite**: Integration tests against dev.slideheroes.com
**Status**: 5 consecutive failures

## Executive Summary

The dev integration tests are experiencing **consistent failures across 6 tests** in authentication, account settings, team accounts, and billing. Analysis reveals this is **NOT a flaky test issue** but rather **systematic problems** with:

1. **Selector timeouts** (10s) - Page elements not appearing
2. **Test timeouts** (180s) - Tests hanging indefinitely
3. **Element visibility failures** - UI components missing

Root causes identified:
- **Global setup authentication state not working in CI**
- **Vercel protection bypass configuration incomplete**
- **Test selectors may be outdated or incorrect**
- **Environment-specific issues (CI vs local)**

## Test Failure Breakdown

### 1. Authentication Tests (`auth-simple.spec.ts`)

**Test**: "sign in page loads with correct elements"

```typescript
// Line 20-22: Primary failure point
await page.waitForSelector('[data-testid="sign-in-email"]', {
  state: "visible",
  timeout: 10000,
});
```

**Error Pattern**:
```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded
```

**Root Cause**: The sign-in page is either:
- Not loading at all (404, 403, or redirect)
- Loading but selectors have changed
- Behind Vercel protection that's blocking tests
- Taking >10s to render (unlikely but possible)

**Evidence**:
- Test uses `data-testid="sign-in-email"` selector
- Auth page object expects these selectors to exist
- No retry logic or `toPass()` wrapper for reliability

**Fix Priority**: **CRITICAL** - Blocks all authentication tests

---

### 2. Account Settings Tests (`account-simple.spec.ts`)

**Test**: "user profile form is visible"

```typescript
// Line 38: Failure point
await page.waitForSelector("form", { timeout: 10000 });

// Line 45-46: Element not found
await expect(displayNameInput).toBeVisible({ timeout: 10000 });
```

**Error Pattern**:
```
Test timeout of 180000ms exceeded
expect(locator).toBeVisible() failed - element(s) not found
```

**Root Cause Analysis**:

The test is using **pre-authenticated state** from global setup:
```typescript
// Line 13: Uses stored auth state
AuthPageObject.setupSession(AUTH_STATES.TEST_USER);
```

**Problem**: The stored auth state (`apps/e2e/.auth/test@slideheroes.com.json`) may be:
1. **Invalid in CI environment** - Created with localhost URL, used with dev.slideheroes.com
2. **Missing Vercel bypass cookie** - Not persisting across contexts
3. **Expired session** - Token no longer valid
4. **Wrong domain** - localStorage key mismatch (see lines 147-155 in global-setup.ts)

**Critical Code in global-setup.ts**:
```typescript
// Line 147-155: localStorage key generation
const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
const key = `sb-${projectRef}-auth-token`;
localStorage.setItem(key, JSON.stringify(session));
```

**Issue**: If `E2E_SUPABASE_URL` differs between global setup and test execution, the localStorage key won't match, causing authentication to fail silently.

**Fix Priority**: **CRITICAL** - Affects all authenticated tests

---

### 3. Team Account Tests (`team-accounts.spec.ts`)

**Tests**:
- "user can update their team name (and slug)"
- "cannot create a Team account using reserved names"

**Error Pattern**:
```
Test timeout of 180000ms exceeded
```

**Root Cause**: Same authentication state issue as account tests. Additionally:

```typescript
// Line 103-104: Requires authentication to work
await teamAccounts.openAccountsSelector();
await page.click('[data-test="create-team-account-trigger"]');
```

If authentication state is broken, these selectors will never appear, causing infinite waits.

**Fix Priority**: **HIGH** - Blocks team functionality tests

---

### 4. Billing Tests (`user-billing.spec.ts`)

**Test**: "user can subscribe to a plan"

**Error Pattern**:
```
expect(locator).toBeVisible() failed - element(s) not found
```

**Root Cause**: Authentication state + billing page structure issues

```typescript
// Line 14-22: Navigation strategy
await page.goto("/home", { waitUntil: "domcontentloaded", timeout: 15000 });
await page.goto("/home/billing", {
  waitUntil: "domcontentloaded",
  timeout: 15000,
});
```

**Issues**:
1. **Auth redirect loop**: If not authenticated, redirects to `/auth/sign-in`
2. **Missing billing elements**: `po.billing.selectPlan(0)` may fail if page structure changed
3. **Stripe integration**: May require additional configuration in CI

**Fix Priority**: **MEDIUM** - Billing tests are explicitly enabled in workflow (line 384)

---

## Root Cause Analysis

### Primary Issue: Global Setup Authentication Failure in CI

**Problem Location**: `apps/e2e/global-setup.ts`

The global setup creates authenticated browser states via Supabase API, but this is **failing in CI** for several reasons:

#### 1. localStorage Key Mismatch

```typescript
// global-setup.ts line 147-155
const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
const key = `sb-${projectRef}-auth-token`;
localStorage.setItem(key, JSON.stringify(session));
```

**Issue**: The Supabase client in the deployed app uses the **deployment URL** to determine the localStorage key, but global setup uses `E2E_SUPABASE_URL`. These may differ.

**Example**:
- Global setup: `sb-abcdefgh-auth-token` (from `E2E_SUPABASE_URL`)
- App expects: `sb-xyzzy123-auth-token` (from deployed Supabase project)

**Recent Fixes (lines 7ce65b966, 703ee39b7)**: Recent commits attempted to fix this exact issue:
```
7ce65b966 fix(e2e): resolve 404 errors by using Supabase URL for localStorage key generation
703ee39b7 fix(e2e): persist Vercel bypass cookie in saved storage states
```

**But**: These fixes may not be complete or correctly configured in CI.

#### 2. Vercel Protection Bypass Not Persisting

```typescript
// global-setup.ts line 124-142
if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
  const domain = new URL(baseURL).hostname;
  await context.addCookies([
    {
      name: "_vercel_jwt",
      value: process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
      domain,
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    },
  ]);
}
```

**Issue**: Cookie may not persist in saved storage state, or may be rejected by browser due to domain/secure attribute mismatches.

#### 3. Session Expiration

**No refresh token handling**: Global setup runs once, creates sessions. If tests take longer than session lifetime, authentication fails mid-test.

---

### Secondary Issue: Test Selectors

Several tests use **outdated or incorrect selectors**:

**Auth Tests**:
```typescript
// Uses data-testid but auth forms may use data-test
'[data-testid="sign-in-email"]'  // Line 20
'[data-testid="sign-in-password"]' // Line 28
```

**Account Tests**:
```typescript
// Multiple fallback selectors - suggests uncertainty
'[data-test="account-display-name"], input[name*="name"], input[placeholder*="name"]'
```

**Recommendation**: Standardize on `data-test` attributes as specified in `apps/e2e/CLAUDE.md`.

---

### Tertiary Issue: Environment Configuration

**Workflow Configuration** (`dev-integration-tests.yml` lines 376-397):

```yaml
BASE_URL: ${{ needs.check-should-run.outputs.web_deployment_url }}
PLAYWRIGHT_BASE_URL: ${{ needs.check-should-run.outputs.web_deployment_url }}
PLAYWRIGHT_API_URL: ${{ needs.check-should-run.outputs.payload_deployment_url }}
E2E_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
```

**Potential Issues**:
1. **BASE_URL vs PLAYWRIGHT_BASE_URL**: Multiple URL env vars may cause confusion
2. **E2E_SUPABASE_URL**: Must match the Supabase project used by deployed app
3. **Missing secrets**: `E2E_TEST_USER_EMAIL`, `E2E_OWNER_EMAIL`, `E2E_ADMIN_EMAIL` must exist

---

## Configuration Analysis

### Playwright Config (`playwright.config.ts`)

**Good**:
- ✅ Configurable timeouts (90s navigation in CI)
- ✅ Retry enabled (retries: 1)
- ✅ Vercel bypass headers configured (lines 75-82)
- ✅ Storage state setup (line 108)

**Issues**:
- ⚠️ Test timeout (180s) may be too long - masks hanging tests
- ⚠️ Only 2 workers in CI - may cause resource contention
- ⚠️ Global setup runs once - no per-worker authentication

### Test Configuration (`test-config.ts`)

**Timeouts**:
```typescript
medium: isCI ? 90000 : 20000,  // 90s in CI
long: isCI ? 120000 : 45000,   // 120s in CI
```

**Issue**: While these are reasonable for deployed environments, they may hide actual failures. If a selector consistently times out at 90s, the test isn't flaky - it's broken.

---

## Failure Pattern Analysis

### Not Flaky - Consistently Failing

**Evidence**:
- 5 consecutive workflow failures
- Same 6 tests failing each time
- No intermittent passes
- Timeouts at consistent points (10s selector, 180s test)

**Conclusion**: These are **SYSTEMATIC FAILURES**, not flaky tests.

---

## Recommended Fixes

### Priority 1: Fix Global Setup Authentication (CRITICAL)

**Issue**: Auth state not working in CI

**Fix**:

```typescript
// global-setup.ts - Add diagnostic logging
console.log(`🔍 Authentication Diagnostics:`);
console.log(`   Base URL: ${baseURL}`);
console.log(`   Supabase URL: ${supabaseUrl}`);
console.log(`   Project Ref: ${projectRef}`);
console.log(`   LocalStorage Key: ${key}`);

// Verify auth state was saved correctly
const savedState = JSON.parse(fs.readFileSync(authState.filePath, 'utf-8'));
console.log(`   Cookies saved: ${savedState.cookies?.length || 0}`);
console.log(`   Origins: ${savedState.origins?.map(o => o.origin).join(', ')}`);
```

**Verification**:
1. Add CI job to print contents of `.auth/*.json` files
2. Verify Vercel bypass cookie is present
3. Confirm localStorage keys match what app expects

### Priority 2: Fix Test Selectors (CRITICAL)

**Issue**: Selectors not matching deployed app

**Fix**:

1. **Audit selectors against deployed app**:
```bash
# Navigate to dev.slideheroes.com/auth/sign-in
# Inspect elements, verify data-test attributes exist
```

2. **Standardize on data-test** (not data-testid):
```typescript
// Change all instances
'[data-testid="sign-in-email"]' → '[data-test="sign-in-email"]'
```

3. **Add selector fallbacks with diagnostics**:
```typescript
await page.waitForSelector('[data-test="sign-in-email"], input[name="email"]', {
  timeout: 10000,
}).catch(async () => {
  // Log page HTML for debugging
  console.error('Selector not found. Page HTML:', await page.content());
  throw new Error('Sign-in email input not found');
});
```

### Priority 3: Add Auth State Validation (HIGH)

**Issue**: Tests proceed with invalid auth state

**Fix**:

```typescript
// Add to beforeEach in tests
test.beforeEach(async ({ page }) => {
  // Verify we're authenticated
  await page.goto('/home');

  // Check if we got redirected to sign-in (auth failed)
  const url = page.url();
  if (url.includes('/auth/sign-in')) {
    throw new Error('Authentication state invalid - redirected to sign-in');
  }

  // Verify auth token exists in localStorage
  const authToken = await page.evaluate(() => {
    return Object.keys(localStorage).find(k => k.includes('auth-token'));
  });

  if (!authToken) {
    throw new Error('No auth token found in localStorage');
  }
});
```

### Priority 4: Improve Error Messages (MEDIUM)

**Issue**: Generic timeout errors don't help debugging

**Fix**:

```typescript
// Replace bare waitForSelector with diagnostic wrapper
async function waitForSelectorWithDiagnostics(
  page: Page,
  selector: string,
  options?: { timeout?: number }
) {
  try {
    return await page.waitForSelector(selector, options);
  } catch (error) {
    // Capture diagnostics
    const url = page.url();
    const title = await page.title();
    const bodyText = await page.textContent('body').catch(() => 'N/A');

    console.error(`
❌ Selector Timeout Diagnostics:
   Selector: ${selector}
   Current URL: ${url}
   Page Title: ${title}
   Body Preview: ${bodyText.slice(0, 200)}
    `);

    throw error;
  }
}
```

### Priority 5: Add Smoke Test Before Integration Tests (MEDIUM)

**Issue**: Integration tests run even if basic page load fails

**Fix**: Add job dependency in workflow:

```yaml
# In dev-integration-tests.yml
smoke-test:
  name: Basic Connectivity Test
  needs: wait-for-deployment
  runs-on: ubuntu-latest
  steps:
    - name: Test sign-in page loads
      run: |
        curl -f "${{ needs.check-should-run.outputs.web_deployment_url }}/auth/sign-in" \
          -H "x-vercel-protection-bypass: ${{ secrets.VERCEL_AUTOMATION_BYPASS_SECRET }}" \
          || exit 1

integration-tests:
  needs: [wait-for-deployment, smoke-test]  # Add smoke-test dependency
  ...
```

### Priority 6: Review Environment Secrets (HIGH)

**Issue**: Required secrets may be missing or incorrect

**Verification Needed**:

```bash
# Check these secrets exist and are correct:
E2E_SUPABASE_URL                 # Must match deployed app's Supabase project
E2E_SUPABASE_ANON_KEY           # Must match deployed app
E2E_TEST_USER_EMAIL             # test@slideheroes.com
E2E_TEST_USER_PASSWORD          # Valid password
E2E_OWNER_EMAIL                 # owner@slideheroes.com
E2E_OWNER_PASSWORD              # Valid password
E2E_ADMIN_EMAIL                 # super-admin@slideheroes.com
E2E_ADMIN_PASSWORD              # Valid password
VERCEL_AUTOMATION_BYPASS_SECRET # Valid bypass token
```

**Risk**: If any of these are wrong, **all tests will fail**.

---

## Diagnostic Commands

### 1. Test Authentication Locally

```bash
# Set CI environment variables
export CI=true
export PLAYWRIGHT_BASE_URL=https://dev.slideheroes.com
export E2E_SUPABASE_URL=<actual_supabase_url>
export E2E_SUPABASE_ANON_KEY=<actual_key>
export E2E_TEST_USER_EMAIL=test@slideheroes.com
export E2E_TEST_USER_PASSWORD=<password>
export VERCEL_AUTOMATION_BYPASS_SECRET=<secret>

# Run global setup
cd apps/e2e
npx playwright test --global-setup=./global-setup.ts --debug
```

### 2. Inspect Auth State Files

```bash
# After global setup runs
cat apps/e2e/.auth/test@slideheroes.com.json | jq .

# Check for:
# - cookies array (should include _vercel_jwt)
# - origins[].localStorage (should have sb-*-auth-token)
# - cookies[].domain (should match dev.slideheroes.com)
```

### 3. Test Individual Failing Test

```bash
cd apps/e2e

# Run single test with debug mode
npx playwright test tests/authentication/auth-simple.spec.ts \
  --grep "loads with correct elements" \
  --debug

# Or with headed mode to see what's happening
npx playwright test tests/authentication/auth-simple.spec.ts \
  --grep "loads with correct elements" \
  --headed
```

### 4. Validate Selectors Against Deployed App

```bash
# Use Playwright codegen to inspect deployed app
npx playwright codegen https://dev.slideheroes.com/auth/sign-in \
  --extra-http-headers "x-vercel-protection-bypass=<secret>"

# This opens browser with Playwright inspector
# Navigate to elements, verify data-test attributes
```

---

## Expected Outcomes After Fixes

### Immediate (Priority 1-2):
- ✅ Global setup creates valid auth states
- ✅ Selectors correctly match deployed app elements
- ✅ Basic auth tests pass

### Short-term (Priority 3-4):
- ✅ All account/team tests pass
- ✅ Clear error messages for any failures
- ✅ Faster failure detection

### Long-term (Priority 5-6):
- ✅ Billing tests operational
- ✅ Comprehensive environment validation
- ✅ Zero false negatives

---

## Test Stability Metrics

**Current State**:
- Success Rate: 0% (5/5 failures)
- Flakiness: 0% (consistent failures)
- Average Duration: ~15-20 minutes (until timeout)

**Target State After Fixes**:
- Success Rate: >95%
- Flakiness: <5%
- Average Duration: 3-5 minutes

---

## Next Steps

1. **Immediate**: Validate `E2E_SUPABASE_URL` matches deployed app (**30 min**)
2. **Immediate**: Audit test selectors against dev.slideheroes.com (**1 hour**)
3. **Today**: Implement Priority 1 fix (auth state diagnostics) (**2 hours**)
4. **Today**: Implement Priority 2 fix (selector updates) (**1 hour**)
5. **Tomorrow**: Implement Priority 3-4 fixes (validation + errors) (**3 hours**)
6. **This Week**: Implement Priority 5-6 fixes (smoke test + secrets) (**2 hours**)

**Total Estimated Effort**: 9.5 hours

---

## Related Issues

- #7ce65b966 - "fix(e2e): resolve 404 errors by using Supabase URL for localStorage key generation"
- #703ee39b7 - "fix(e2e): persist Vercel bypass cookie in saved storage states"
- #efb99a5f3 - "fix(ci): use VERCEL_ENV for Turnstile test key detection"
- #a3e32f0fb - "fix(ci): bypass Cloudflare Turnstile challenges in integration tests"

**Pattern**: Multiple recent attempts to fix auth issues, suggesting this is a known problem area.

---

## Appendix: Test Configuration Summary

### Timeouts
- **Selector timeout**: 10s (line 22 in auth-simple.spec.ts)
- **Test timeout**: 180s (line 11 in account-simple.spec.ts)
- **Navigation timeout**: 90s in CI (playwright.config.ts line 91)
- **Auth timeout**: 90s in CI (test-config.ts line 79)

### Retry Strategy
- **Test retries**: 1 (playwright.config.ts line 56)
- **Workers**: 2 in CI (playwright.config.ts line 58)

### Environment Variables Required
- `PLAYWRIGHT_BASE_URL` - Deployment URL
- `E2E_SUPABASE_URL` - Supabase project URL
- `E2E_SUPABASE_ANON_KEY` - Supabase anon key
- `E2E_TEST_USER_EMAIL` - Test user email
- `E2E_TEST_USER_PASSWORD` - Test user password
- `VERCEL_AUTOMATION_BYPASS_SECRET` - Vercel bypass token

---

## Conclusion

The dev integration test failures are **NOT flaky** but represent **systematic authentication and selector issues** that prevent tests from running in CI. The primary culprit is the global setup authentication state not working correctly with deployed environments, likely due to localStorage key mismatches and Vercel protection bypass issues.

**Confidence Level**: **HIGH** (90%)

**Risk if Not Fixed**:
- ❌ No integration test coverage on dev deployments
- ❌ Bugs may reach staging/production undetected
- ❌ False sense of security from passing unit tests only
- ❌ Manual testing burden increases

**Recommended Action**: Implement Priority 1-2 fixes immediately (estimated 3 hours), validate with test run, then proceed with remaining priorities.
