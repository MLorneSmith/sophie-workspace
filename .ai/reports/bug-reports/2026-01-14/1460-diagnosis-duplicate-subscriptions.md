# Bug Diagnosis: E2E Shard 10 Fails Due to Duplicate Subscription Records

**ID**: ISSUE-1460
**Created**: 2026-01-14T15:55:00Z
**Reporter**: E2E Test Suite
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The User Billing E2E test (shard 10) fails because the test user `test1@slideheroes.com` has accumulated 5 duplicate subscription records in the database from previous test runs. When the billing page loads, the `getSubscription()` API call uses `.maybeSingle()` which expects 0 or 1 row, but receives 5 rows, causing a PostgREST PGRST116 error. This crashes the billing page server-side rendering, triggering the Next.js error boundary to display "Error requesting checkout" instead of the expected billing UI elements.

## Environment

- **Application Version**: dev branch
- **Environment**: Local E2E test (Docker)
- **Browser**: Chromium (Playwright)
- **Node Version**: 20.x
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Unknown - issue accumulated over multiple test runs

## Reproduction Steps

1. Run E2E shard 10 (User Billing): `/test 10`
2. Test navigates to `/home/billing` as `test1@slideheroes.com`
3. Page attempts to load subscription data
4. Server-side error occurs, error boundary displays "Error requesting checkout"
5. Test fails waiting for `[data-test-plan]` or `h3:has-text("Your Plan")` elements

## Expected Behavior

The billing page should render either:
- Plan selection UI with `[data-test-plan]` elements (if no subscription)
- Subscription card with `h3:has-text("Your Plan")` (if subscription exists)

## Actual Behavior

- Error boundary displays: "Error requesting checkout - There was an error requesting checkout. Please try again later."
- Neither expected element is visible
- Test times out after 15 seconds waiting for billing page elements

## Diagnostic Data

### Console Output
```
[Console Monitoring] Caught exception: Error: {"code":"PGRST116","details":"Results contain 5 rows, application/vnd.pgrst.object+json requires 1 row","hint":null,"message":"JSON object requested, multiple (or no) rows returned"}
    at [3mignore-listed frames[23m {
  digest: '746789264'
} {} {
  path: '/home/billing',
  routePath: '/home/billing'
}
```

### Database Analysis
```sql
-- Duplicate subscriptions for test user
SELECT account_id, COUNT(*) FROM subscriptions
GROUP BY account_id HAVING COUNT(*) > 1;

              account_id              | count
--------------------------------------+-------
 31a03e74-1639-45b6-bfa7-77447f1a4762 |     5

-- Duplicate billing_customers
SELECT account_id, COUNT(*) FROM billing_customers
GROUP BY account_id HAVING COUNT(*) > 1;

              account_id              | count
--------------------------------------+-------
 31a03e74-1639-45b6-bfa7-77447f1a4762 |     5

-- Subscription details
SELECT id, status, created_at FROM subscriptions
WHERE account_id = '31a03e74-1639-45b6-bfa7-77447f1a4762';

              id              | status |          created_at
------------------------------+--------+-------------------------------
 sub_1ScXFy2RkIMsD46QJLOnuJQR | active | 2026-01-09 20:11:58.174982+00
 sub_1ScUfr2RkIMsD46Qes8xoLSb | active | 2026-01-09 17:26:14.214163+00
 sub_1ScSaR2RkIMsD46QJqmTAqGF | active | 2026-01-09 15:13:01.758907+00
 sub_1Sc8Sv2RkIMsD46QIoEQorne | active | 2026-01-08 17:43:28.701788+00
 sub_1Sdb4m2RkIMsD46QK0WNAn3S | active | 2025-12-12 18:28:26.344058+00
```

### Screenshots
- Test failure screenshot: `apps/e2e/test-results/user-billing-user-billing--9159e-ser-can-subscribe-to-a-plan-chromium/test-failed-1.png`
- Shows error alert with "Error requesting checkout" message and "Retry" button

## Error Stack Traces
```
Error: expect(locator).toBeVisible() failed

Locator: locator('h3:has-text("Your Plan")').or(locator('[data-test-plan]').first()).first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

   at BillingPageObject.waitForBillingPageReady (apps/e2e/tests/utils/billing.po.ts:90:5)
   at BillingPageObject.hasActiveSubscription (apps/e2e/tests/utils/billing.po.ts:101:14)
   at user-billing.spec.ts:32:52
```

## Related Code

- **Affected Files**:
  - `packages/features/accounts/src/server/api.ts:75-86` - `getSubscription()` uses `.maybeSingle()`
  - `packages/features/accounts/src/server/api.ts:113-118` - `getCustomerId()` uses `.maybeSingle()`
  - `apps/web/app/home/(user)/billing/page.tsx` - Billing page that calls loaders
  - `apps/web/app/home/(user)/billing/error.tsx` - Error boundary showing the error
  - `apps/e2e/tests/utils/billing.po.ts:78-93` - `waitForBillingPageReady()` expecting elements

- **Recent Changes**: Multiple test runs created duplicate records over Dec 12, 2025 - Jan 9, 2026

- **Suspected Functions**:
  - `getSubscription()` at `api.ts:75`
  - `getCustomerId()` at `api.ts:113`

## Related Issues & Context

### Similar Symptoms
- #869 (CLOSED): "Bug Diagnosis: User Billing E2E Test Fails - Stripe Checkout Session Creation Error" - Different root cause (missing credentials)
- #880 (CLOSED): "Bug Fix: Stripe Checkout Session Creation Fails" - Related billing test failure, different cause

### Historical Context
Previous billing test failures (#869, #880) were caused by missing Stripe credentials. This is a NEW issue caused by test data pollution - duplicate database records accumulating over time without cleanup.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The test user `test1@slideheroes.com` has 5 duplicate subscription and billing_customer records, causing `.maybeSingle()` queries to fail with PGRST116.

**Detailed Explanation**:
The E2E billing tests run against a shared local Supabase database. Each successful test run creates a new Stripe subscription via webhook events. However, there is no cleanup mechanism to remove subscriptions after tests complete, nor is there a unique constraint preventing duplicate subscriptions per account.

Over multiple test runs (Dec 12, 2025 through Jan 9, 2026), 5 subscriptions accumulated for the same test account. When the billing page loads:

1. `loadPersonalAccountBillingPageData()` calls `api.getSubscription(userId)`
2. `getSubscription()` executes: `client.from("subscriptions").select("*").eq("account_id", accountId).maybeSingle()`
3. `.maybeSingle()` expects 0 or 1 row, but receives 5 rows
4. PostgREST throws PGRST116: "Results contain 5 rows, application/vnd.pgrst.object+json requires 1 row"
5. Error propagates to Next.js error boundary
6. Error boundary renders "Error requesting checkout" instead of billing UI
7. Test fails because expected elements are not visible

**Supporting Evidence**:
- Docker logs show PGRST116 error on `/home/billing` path
- Database query confirms 5 subscription rows for account `31a03e74-1639-45b6-bfa7-77447f1a4762`
- Screenshot shows error boundary UI, not billing form
- Code at `api.ts:80` uses `.maybeSingle()` which fails on multiple rows

### How This Causes the Observed Behavior

```
Multiple test runs → Duplicate subscriptions created
                  ↓
getSubscription().maybeSingle() receives 5 rows
                  ↓
PostgREST throws PGRST116 error
                  ↓
Server component throws during render
                  ↓
error.tsx boundary catches and displays error UI
                  ↓
Test can't find expected elements → FAIL
```

### Confidence Level

**Confidence**: High

**Reasoning**:
1. Database queries definitively show 5 duplicate records
2. Docker logs show exact PGRST116 error with "5 rows" detail
3. Code path clearly uses `.maybeSingle()` which cannot handle multiple rows
4. Error boundary screenshot matches the error.tsx component output

## Fix Approach (High-Level)

Three complementary fixes are needed:

1. **Immediate cleanup**: Delete duplicate subscription and billing_customer records, keeping only the most recent per account

2. **Test cleanup**: Add cleanup logic to E2E global-setup.ts or test teardown to remove test billing data after each run

3. **Prevention**: Consider adding a unique constraint on `subscriptions(account_id)` or modifying webhook handlers to update existing subscriptions instead of creating new ones

## Diagnosis Determination

Root cause definitively identified: Test data pollution from multiple E2E runs created duplicate subscription records. The `.maybeSingle()` query pattern cannot handle duplicates, causing server-side rendering failure that triggers the error boundary.

This is NOT related to GitHub issue #1138 (production webhook secret mismatch) - that is a separate configuration issue affecting production.

## Additional Context

- The billing tests (shards 10-11) were added with Stripe integration
- Stripe webhook events create subscription records on successful checkout
- No mechanism exists to clean up these records between test runs
- The issue will recur each time billing tests run successfully without cleanup

---
*Generated by Claude Debug Assistant*
*Tools Used: Docker logs, PostgreSQL queries via psql, Playwright test output analysis, File inspection*
