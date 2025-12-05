# Bug Diagnosis: Dev Integration Tests Failing - Auth and Billing Tests

**ID**: ISSUE-923
**Created**: 2025-12-05T16:30:00Z
**Reporter**: system
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The dev-integration-tests.yml workflow is failing with 3 test failures out of 27 tests. The failures affect authentication and billing integration tests running against the deployed dev environment (https://dev.slideheroes.com). All failures are timeout-related, suggesting either page rendering issues, missing elements, or authentication state problems in the deployed environment.

## Environment

- **Application Version**: dev branch (commit d86e8baf3)
- **Environment**: dev deployment on Vercel
- **Browser**: Chromium (Playwright)
- **Node Version**: CI runner default
- **Database**: Production Supabase
- **Workflow Run**: 19968604517
- **Last Working**: Unknown (recent commits show similar failures)

## Reproduction Steps

1. Push to dev branch or manually trigger dev-integration-tests.yml workflow
2. Workflow deploys to Vercel and runs integration tests
3. Tests fail with timeouts for auth-simple and billing tests

## Expected Behavior

All 27 integration tests should pass when running against the deployed dev environment.

## Actual Behavior

- 11 tests passed
- 4 tests skipped
- 3 tests failed (with retries, so 6 total failures)

Failed tests:
1. `auth-simple.spec.ts:13` - "sign in page loads with correct elements"
2. `team-billing.spec.ts:6` - "a team can subscribe to a plan"
3. `user-billing.spec.ts:6` - "user can subscribe to a plan"

## Diagnostic Data

### Console Output
```
Running 27 tests using 3 workers

F×F
  1) [chromium] › tests/authentication/auth-simple.spec.ts:13:6 › Authentication - Simple Tests @auth @integration › sign in page loads with correct elements
     TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
     - waiting for locator('[data-testid="sign-in-email"]') to be visible

  2) [chromium] › tests/team-billing/team-billing.spec.ts:6:6 › Team Billing @billing @integration › a team can subscribe to a plan
     TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
     - waiting for locator('[name="embedded-checkout"]') to be visible

  3) [chromium] › tests/user-billing/user-billing.spec.ts:6:6 › User Billing @billing @integration › user can subscribe to a plan
     Error: strict mode violation: locator('h3:has-text("Your Plan")').or(locator('[data-test-plan]').first()) resolved to 2 elements

  4 skipped
  11 passed (1.2m)
```

### Network Analysis
- Vercel protection bypass is configured with `VERCEL_AUTOMATION_BYPASS_SECRET`
- Global setup successfully authenticated all test users via Supabase API
- Cookies and localStorage session injection reported as successful

### Environment Configuration
```
DEPLOYMENT_URL: https://dev.slideheroes.com
BASE_URL: https://2025slideheroes-l7vebjwm4-slideheroes.vercel.app
PLAYWRIGHT_BASE_URL: https://2025slideheroes-l7vebjwm4-slideheroes.vercel.app
ENABLE_BILLING_TESTS: false
ENABLE_TEAM_ACCOUNT_TESTS: true
NODE_ENV: test
```

## Error Stack Traces

### Failure 1: Auth Simple Test
```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('[data-testid="sign-in-email"]') to be visible

at /home/runner/_work/2025slideheroes/2025slideheroes/apps/e2e/tests/authentication/auth-simple.spec.ts:17:14
```

### Failure 2: Team Billing Test
```
TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('[name="embedded-checkout"]') to be visible

at StripePageObject.waitForForm (/home/runner/_work/2025slideheroes/2025slideheroes/apps/e2e/tests/utils/stripe.po.ts:16:19)
```

### Failure 3: User Billing Test
```
Error: strict mode violation: locator('h3:has-text("Your Plan")').or(locator('[data-test-plan]').first()) resolved to 2 elements:
    1) <h3 class="text-lg font-semibold">Your Plan</h3>
    2) <div data-test-plan=true data-selected=false...>
```

## Related Code
- **Affected Files**:
  - `apps/e2e/tests/authentication/auth-simple.spec.ts:17`
  - `apps/e2e/tests/team-billing/team-billing.spec.ts:6`
  - `apps/e2e/tests/user-billing/user-billing.spec.ts:6`
  - `apps/e2e/tests/utils/billing.po.ts:87`
  - `apps/e2e/tests/utils/stripe.po.ts:16`
- **Recent Changes**: Various CI/testing improvements in recent commits
- **Suspected Functions**:
  - `waitForBillingPageReady()` in billing.po.ts - locator may match multiple elements
  - Test navigation and authentication flow

## Related Issues & Context

### Direct Predecessors
- #915 (CLOSED): "Bug Diagnosis: Dev Integration Tests Failing - Missing NODE_ENV and STRIPE_WEBHOOK_SECRET"
- #920 (CLOSED): "Bug Fix: Dev Integration Tests Fail with host.docker.internal DNS Error"
- #643 (CLOSED): "Bug Diagnosis: Dev Integration Tests Failing - networkidle Timeout"

### Historical Context
Integration tests have had recurring issues with:
1. Environment configuration mismatches
2. Authentication state persistence
3. Vercel deployment protection
4. Cookie naming mismatches between test setup and server

## Root Cause Analysis

### Identified Root Causes

**Root Cause 1: Auth Simple Test - Page Not Rendering Sign-In Form**

**Summary**: The sign-in page at `/auth/sign-in` is not rendering the email input element with `data-testid="sign-in-email"` within the 10 second timeout.

**Detailed Explanation**:
The test navigates to `/auth/sign-in` and waits for `[data-testid="sign-in-email"]` to be visible. This element exists in the codebase (`packages/features/auth/src/components/password-sign-in-form.tsx:68`), so either:
1. The page is rendering a different sign-in method (OTP, Magic Link, OAuth) instead of password form
2. The page is stuck on server-side rendering or hydration
3. Vercel edge function cold start is causing slow initial render
4. An error is preventing the form from rendering

**Supporting Evidence**:
- The `data-testid="sign-in-email"` exists in `password-sign-in-form.tsx` which is only rendered when password auth is configured
- The test uses `waitUntil: "domcontentloaded"` which may complete before React hydration finishes
- Other tests in the same run passed, suggesting intermittent timing issues

**Root Cause 2: Billing Tests - Wrong Test Execution**

**Summary**: Billing tests are running despite `ENABLE_BILLING_TESTS: false` because the `--grep @integration` flag matches the `@billing @integration` tag, bypassing the `testIgnore` configuration.

**Detailed Explanation**:
The playwright.config.ts sets `testIgnore: ["*-billing.spec.ts"]` when `ENABLE_BILLING_TESTS` is false. However, the test command uses `--grep @integration` which selects tests by tag, not by file pattern. Tests tagged with both `@billing` and `@integration` will still run because they match the `@integration` grep pattern.

The billing tests then fail because:
1. They expect Stripe checkout flow to work, but dev environment doesn't receive live Stripe webhooks
2. The `user-billing.spec.ts` test finds 2 elements matching the billing page locator (strict mode violation)

**Supporting Evidence**:
- Workflow config shows `ENABLE_BILLING_TESTS: false` but billing tests ran
- `playwright.config.ts` uses `testIgnore` array which is file-pattern based
- Test command: `playwright test --grep @integration` matches by test name/tags
- Team billing test file includes `@billing @integration` tag

**Root Cause 3: User Billing - Locator Ambiguity**

**Summary**: The billing page object's `waitForBillingPageReady()` uses a locator that matches multiple elements on the billing page.

**Detailed Explanation**:
The `billing.po.ts:87` uses:
```typescript
await expect(subscriptionIndicator.or(planSelectionIndicator)).toBeVisible()
```

Where:
- `subscriptionIndicator` = `page.locator('h3:has-text("Your Plan")')`
- `planSelectionIndicator` = `page.locator("[data-test-plan]").first()`

The `.or()` locator in strict mode fails when both elements are visible because it resolves to 2 elements. The error shows both `<h3>Your Plan</h3>` AND `<div data-test-plan=true>` are present.

**Supporting Evidence**:
- Error message explicitly shows "resolved to 2 elements"
- Both elements are listed in the error output
- The locator uses `.or()` which in strict mode requires exactly 1 match

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The billing test execution despite `ENABLE_BILLING_TESTS: false` is definitively a configuration bug - the grep pattern bypasses file ignoring
2. The strict mode violation is clearly shown in the error output with both matching elements listed
3. The auth test failure is timing-related but the root cause (Vercel cold start or page rendering) needs screenshot analysis to confirm

## Fix Approach (High-Level)

1. **Fix billing test execution**: Add `test.skip()` checks inside billing test files to respect `ENABLE_BILLING_TESTS` environment variable, OR remove `@integration` tag from billing tests so they don't run with `--grep @integration`

2. **Fix strict mode violation**: Update `billing.po.ts` `waitForBillingPageReady()` to use more specific locators that don't result in multiple matches:
   ```typescript
   // Option A: Use .first() on the entire OR expression
   await expect(subscriptionIndicator.or(planSelectionIndicator).first()).toBeVisible()

   // Option B: Check each separately instead of OR
   const hasSubscription = await subscriptionIndicator.isVisible().catch(() => false);
   const hasPlanSelection = await planSelectionIndicator.isVisible().catch(() => false);
   if (!hasSubscription && !hasPlanSelection) throw new Error('...');
   ```

3. **Fix auth test timing**: Add more robust waiting in auth-simple test or investigate why sign-in page isn't rendering (check screenshots from failed test artifacts)

## Diagnosis Determination

The failures have three distinct root causes:

1. **Primary Issue**: Billing tests running despite being disabled due to grep pattern bypassing testIgnore
2. **Secondary Issue**: Locator ambiguity in billing page object causing strict mode violations
3. **Tertiary Issue**: Auth page rendering timing issues in deployed environment

The most impactful fix is ensuring billing tests don't run when `ENABLE_BILLING_TESTS=false`, which would eliminate 2 of the 3 failures.

## Additional Context

- Test artifacts (screenshots, traces) are available in workflow run 19968604517
- Previous similar issues (#915, #920) were related to different root causes
- The workflow uses `--max-failures=0` to run all tests even after failures

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, Read, Grep, Bash*
