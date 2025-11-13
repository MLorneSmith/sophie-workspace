# Dev Integration Tests - Fix Action Plan

**Date**: 2025-11-12
**Issue**: 6 tests consistently failing in dev-integration-tests.yml workflow
**Status**: NOT FLAKY - Systematic failures requiring immediate fixes

---

## TL;DR - Root Causes

1. **Global setup auth state not working in CI** - localStorage key mismatch with deployed app
2. **Test selectors outdated/incorrect** - data-testid vs data-test, missing attributes
3. **Vercel protection bypass incomplete** - Cookie not persisting in storage states
4. **Environment configuration gaps** - Secrets validation needed

---

## Quick Wins (< 1 hour each)

### 1. Validate Supabase Configuration

**Problem**: `E2E_SUPABASE_URL` may not match deployed app's Supabase project

**Check**:
```bash
# Compare these values:
echo "CI Secret: $E2E_SUPABASE_URL"
echo "App Config: Check deployed app's NEXT_PUBLIC_SUPABASE_URL"

# They MUST match exactly
```

**Fix**: Update GitHub secret if mismatched

---

### 2. Audit Test Selectors

**Problem**: Tests looking for `[data-testid="..."]` but app uses `[data-test="..."]`

**Action**:
```bash
# Navigate to https://dev.slideheroes.com/auth/sign-in
# Open DevTools, inspect email input
# Verify: Does it have data-test or data-testid attribute?

# Expected: <input data-test="sign-in-email" ... />
# Test looks for: [data-testid="sign-in-email"]
```

**Fix**: Update selectors in `apps/e2e/tests/authentication/auth-simple.spec.ts`:
```typescript
// Line 20 - Change from:
'[data-testid="sign-in-email"]'
// To:
'[data-test="sign-in-email"]'

// Repeat for all data-testid references
```

---

### 3. Add Global Setup Diagnostics

**Problem**: Auth state failing silently

**Fix**: Add logging to `apps/e2e/global-setup.ts` after line 155:

```typescript
// After localStorage.setItem...
console.log(`🔍 Auth Diagnostics for ${authState.name}:`);
console.log(`   Base URL: ${baseURL}`);
console.log(`   Supabase URL: ${supabaseUrl}`);
console.log(`   Project Ref: ${projectRef}`);
console.log(`   LocalStorage Key: ${key}`);
console.log(`   Session Expires: ${new Date(data.session.expires_at! * 1000).toISOString()}`);

// Verify Vercel bypass cookie was set
const cookies = await context.cookies();
const bypassCookie = cookies.find(c => c.name === '_vercel_jwt');
console.log(`   Vercel Bypass Cookie: ${bypassCookie ? '✅ Present' : '❌ Missing'}`);
```

**Then**: Re-run workflow, check logs for actual vs expected values

---

## Priority Fixes (2-3 hours each)

### Fix 1: Correct localStorage Key Generation

**File**: `apps/e2e/global-setup.ts` line 147-155

**Current Code**:
```typescript
const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
const key = `sb-${projectRef}-auth-token`;
```

**Issue**: This assumes Supabase URL format is `https://projectref.supabase.co`

**Fix**:
```typescript
// More robust project ref extraction
const projectRef = (() => {
  const url = new URL(supabaseUrl);

  // Handle different Supabase URL formats:
  // - https://projectref.supabase.co
  // - https://projectref.supabase.in (India region)
  // - Custom domains

  const hostname = url.hostname;

  if (hostname.includes('.supabase.')) {
    return hostname.split('.')[0];
  }

  // Fallback: use full hostname as-is
  console.warn(`⚠️ Non-standard Supabase URL: ${supabaseUrl}`);
  return hostname.replace(/\./g, '-');
})();

console.log(`📝 Using project ref: "${projectRef}" from URL: ${supabaseUrl}`);
const key = `sb-${projectRef}-auth-token`;
```

---

### Fix 2: Verify Auth State Before Tests Run

**File**: Create `apps/e2e/tests/utils/verify-auth.ts`

```typescript
import { expect, type Page } from '@playwright/test';

export async function verifyAuthState(page: Page) {
  // Navigate to protected page
  await page.goto('/home', { waitUntil: 'domcontentloaded', timeout: 15000 });

  const url = page.url();

  // If redirected to sign-in, auth state is invalid
  if (url.includes('/auth/sign-in')) {
    // Capture diagnostics
    const localStorage = await page.evaluate(() => {
      return Object.keys(window.localStorage)
        .filter(k => k.includes('supabase') || k.includes('auth'))
        .map(k => ({ key: k, value: window.localStorage.getItem(k) }));
    });

    console.error('❌ Auth state validation failed!');
    console.error('   Redirected to:', url);
    console.error('   localStorage keys:', localStorage.map(s => s.key));

    throw new Error('Authentication state invalid - no valid session found');
  }

  // Verify auth token exists
  const authKey = await page.evaluate(() => {
    return Object.keys(window.localStorage).find(k => k.includes('auth-token'));
  });

  if (!authKey) {
    throw new Error('No auth token found in localStorage');
  }

  console.log(`✅ Auth state valid (key: ${authKey})`);
}
```

**Usage**: Add to failing tests:

```typescript
import { verifyAuthState } from '../utils/verify-auth';

test('user profile form is visible', async ({ page }) => {
  // Add this FIRST
  await verifyAuthState(page);

  // Rest of test...
  await page.goto('/home/settings', { waitUntil: 'domcontentloaded' });
  // ...
});
```

---

### Fix 3: Improve Vercel Bypass Cookie Persistence

**File**: `apps/e2e/global-setup.ts` line 124-142

**Issue**: Cookie may not persist or may use wrong domain

**Fix**:
```typescript
// Enhanced cookie configuration
if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
  const url = new URL(baseURL);
  const domain = url.hostname;

  // Try both domain variants for better compatibility
  const cookieVariants = [
    {
      name: '_vercel_jwt',
      value: process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
      domain: domain,  // Exact domain
      path: '/',
      httpOnly: true,
      secure: url.protocol === 'https:',
      sameSite: 'Lax' as const,
    },
    {
      name: '_vercel_jwt',
      value: process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
      domain: `.${domain}`,  // Subdomain variant
      path: '/',
      httpOnly: true,
      secure: url.protocol === 'https:',
      sameSite: 'Lax' as const,
    },
  ];

  console.log(`🍪 Setting Vercel bypass cookies for domain: ${domain}`);
  await context.addCookies(cookieVariants);

  // Verify cookies were set
  const cookies = await context.cookies();
  const bypassCookies = cookies.filter(c => c.name === '_vercel_jwt');
  console.log(`   Set ${bypassCookies.length} bypass cookie(s)`);

  // Reload to activate cookies
  await page.reload({ waitUntil: 'load' });

  // Final verification
  const finalCookies = await context.cookies();
  const finalBypass = finalCookies.find(c => c.name === '_vercel_jwt');
  if (!finalBypass) {
    console.warn('⚠️ Vercel bypass cookie not found after reload!');
  } else {
    console.log(`✅ Vercel bypass cookie active (domain: ${finalBypass.domain})`);
  }
}
```

---

## Testing the Fixes

### Local Testing

```bash
cd apps/e2e

# Set CI environment to match GitHub Actions
export CI=true
export PLAYWRIGHT_BASE_URL=https://dev.slideheroes.com
export E2E_SUPABASE_URL=<your_actual_supabase_url>
export E2E_SUPABASE_ANON_KEY=<your_actual_key>
export VERCEL_AUTOMATION_BYPASS_SECRET=<your_bypass_secret>

# Test global setup
npx playwright test --global-setup=./global-setup.ts tests/authentication/auth-simple.spec.ts --grep "loads with correct elements"

# Check auth state file
cat .auth/test@slideheroes.com.json | jq .
```

### Verify Auth State Contents

```bash
# Expected structure:
{
  "cookies": [
    {
      "name": "_vercel_jwt",
      "value": "...",
      "domain": "dev.slideheroes.com"
    }
  ],
  "origins": [
    {
      "origin": "https://dev.slideheroes.com",
      "localStorage": [
        {
          "name": "sb-<projectref>-auth-token",
          "value": "{...}"
        }
      ]
    }
  ]
}
```

---

## Validation Checklist

Before considering this fixed:

- [ ] **Auth state validation**: `verifyAuthState()` passes in all tests
- [ ] **Selector audit**: All selectors match deployed app elements
- [ ] **Cookie persistence**: `_vercel_jwt` cookie appears in saved storage states
- [ ] **localStorage key**: `sb-*-auth-token` key matches what app expects
- [ ] **Test pass rate**: 6/6 failing tests now pass locally
- [ ] **CI pass rate**: Tests pass in GitHub Actions workflow
- [ ] **No regressions**: Other tests still pass

---

## Rollout Plan

### Phase 1: Diagnostic (1 hour)
1. Add logging to global-setup.ts
2. Run workflow, capture logs
3. Identify exact mismatch (Supabase URL, selector, cookie)

### Phase 2: Quick Fixes (2 hours)
1. Fix Supabase URL secret if mismatched
2. Update test selectors if needed
3. Add auth state verification

### Phase 3: Robust Fixes (3 hours)
1. Improve localStorage key generation
2. Enhance Vercel bypass cookie handling
3. Add comprehensive error messages

### Phase 4: Validation (1 hour)
1. Test locally with CI environment
2. Run single test in GitHub Actions
3. Run full integration suite

**Total Time**: ~7 hours

---

## Success Criteria

**Must Have**:
- ✅ 6/6 failing tests pass consistently (3+ consecutive runs)
- ✅ No new test failures introduced
- ✅ Test execution time < 10 minutes

**Nice to Have**:
- ✅ Clear error messages for any failures
- ✅ Diagnostic logs help debug future issues
- ✅ Tests resilient to minor environment changes

---

## Risk Mitigation

### If Fixes Don't Work

**Fallback 1**: Skip problematic tests temporarily
```typescript
test.skip('user profile form is visible', async ({ page }) => {
  // TODO: Re-enable after auth state issue resolved
});
```

**Fallback 2**: Use UI-based authentication instead of API
```typescript
// Instead of pre-authenticated storage state
// Do actual UI login in beforeEach
test.beforeEach(async ({ page }) => {
  await page.goto('/auth/sign-in');
  await page.fill('[data-test="email-input"]', process.env.E2E_TEST_USER_EMAIL);
  await page.fill('[data-test="password-input"]', process.env.E2E_TEST_USER_PASSWORD);
  await page.click('[data-test="submit-button"]');
  await page.waitForURL('**/home**');
});
```

**Fallback 3**: Run integration tests against local environment
```yaml
# In workflow, add local deployment step
- name: Start local app
  run: pnpm --filter web dev &

- name: Wait for local app
  run: npx wait-on http://localhost:3000

- name: Run tests against localhost
  env:
    PLAYWRIGHT_BASE_URL: http://localhost:3000
  run: pnpm --filter web-e2e test:integration
```

---

## Post-Fix Monitoring

### Add Test Health Dashboard

Track these metrics:
- Test pass rate (target: >95%)
- Average test duration (target: <5 min)
- Flakiness rate (target: <5%)
- Time to detect failures (target: <15 min from deploy)

### Alert Thresholds

- 🚨 Critical: 3+ tests failing consistently
- ⚠️ Warning: 2 tests showing flakiness >10%
- 📊 Info: Test duration increased >20%

---

## Contact / Escalation

**If stuck after 4 hours**:
- Review recent commits for similar fixes
- Check Playwright Discord/GitHub issues for auth state problems
- Consider reaching out to Vercel support about bypass cookie behavior

**If pattern continues after fixes**:
- Re-evaluate test architecture (API-based vs UI-based auth)
- Consider infrastructure issues (deployment stability)
- Assess if dev environment is suitable for integration tests

---

## Appendix: Quick Reference

### Key Files
- `apps/e2e/global-setup.ts` - Authentication setup
- `apps/e2e/playwright.config.ts` - Test configuration
- `apps/e2e/tests/authentication/auth-simple.spec.ts` - Failing auth tests
- `apps/e2e/tests/account/account-simple.spec.ts` - Failing account tests
- `apps/e2e/tests/team-accounts/team-accounts.spec.ts` - Failing team tests
- `apps/e2e/tests/user-billing/user-billing.spec.ts` - Failing billing tests

### Environment Variables
```bash
# Required for CI
PLAYWRIGHT_BASE_URL=https://dev.slideheroes.com
E2E_SUPABASE_URL=https://<projectref>.supabase.co
E2E_SUPABASE_ANON_KEY=<anon-key>
VERCEL_AUTOMATION_BYPASS_SECRET=<bypass-secret>

# Test user credentials
E2E_TEST_USER_EMAIL=test@slideheroes.com
E2E_TEST_USER_PASSWORD=<password>
```

### Useful Commands
```bash
# Run single failing test
npx playwright test tests/authentication/auth-simple.spec.ts --grep "loads with correct elements" --debug

# Inspect auth state
cat apps/e2e/.auth/test@slideheroes.com.json | jq .

# Check GitHub workflow logs
gh run view <run-id> --log-failed

# Re-run failed workflow
gh workflow run dev-integration-tests.yml
```
