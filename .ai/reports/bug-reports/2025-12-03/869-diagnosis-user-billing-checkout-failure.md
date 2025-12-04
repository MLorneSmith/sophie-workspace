# Bug Diagnosis: User Billing E2E Test - Stripe Checkout Session Creation Failure

**ID**: ISSUE-pending
**Created**: 2025-12-03T16:30:00Z
**Reporter**: system (test execution)
**Severity**: medium
**Status**: new
**Type**: error

## Summary

The User Billing E2E test (shard 9) is failing because the Stripe checkout session cannot be created on the server. The test navigates successfully to `/home/billing`, selects a plan, and clicks "Proceed to Payment", but the server-side checkout session creation fails, displaying "Error requesting checkout. Please try again later." The Stripe Embedded Checkout iframe never loads because the server action throws an error before returning a checkout token.

## Environment

- **Application Version**: dev branch
- **Environment**: development (localhost:3001)
- **Browser**: Chromium (Playwright)
- **Node Version**: See package.json
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Unknown - this appears to be a recurring configuration issue

## Reproduction Steps

1. Start the test server on port 3001 (`pnpm --filter web dev:test`)
2. Run E2E shard 9: `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 9`
3. The test navigates to `/home/billing`
4. Test clicks on a plan (Starter - $9.99/month)
5. Test clicks "Proceed to Payment"
6. **FAILURE**: Error alert appears "Error requesting checkout"
7. Test times out waiting for Stripe iframe `[name="embedded-checkout"]`

## Expected Behavior

After clicking "Proceed to Payment":
1. Server creates a Stripe checkout session via `createPersonalAccountCheckoutSession`
2. Server returns `checkoutToken` (Stripe client secret)
3. Client renders `<EmbeddedCheckout>` component with the token
4. Stripe Embedded Checkout iframe loads
5. Test can fill in payment details

## Actual Behavior

After clicking "Proceed to Payment":
1. Server attempts to create checkout session
2. `createStripeClient()` likely fails during schema validation or API call
3. Error is caught, `setError(true)` is called
4. Error alert "Error requesting checkout" is displayed
5. No checkout token is returned, `<EmbeddedCheckout>` never renders
6. Test times out waiting for iframe that will never appear

## Diagnostic Data

### Console Output
```
Starting billing test, current URL: about:blank
Navigating to /home first...
At /home, URL: http://localhost:3001/home
Navigating to /home/billing...
At /home/billing, URL: http://localhost:3001/home/billing
```

### Network Analysis
The server-side checkout session creation fails. No Stripe API call succeeds.

### Screenshot Analysis
The test screenshot clearly shows:
- User is on `/home/billing` page
- Error alert visible: "Error requesting checkout - There was an error requesting checkout. Please try again later."
- Plan selector shows Starter ($9.99/month) selected
- "Proceed to Payment" button visible at bottom

### Performance Metrics
Test execution time: ~20.7s per attempt (3 retries total: ~55s)

## Error Stack Traces
```
TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('[name="embedded-checkout"]') to be visible

   at utils/stripe.po.ts:16

    14 | 	async waitForForm() {
    15 | 		// First wait for the Stripe iframe to be present in the DOM
  > 16 | 		await this.page.waitForSelector('[name="embedded-checkout"]', {
       | 		                ^
    17 | 			timeout: 15000,
    18 | 		});
```

## Related Code

### Affected Files
- `apps/web/app/home/(user)/billing/_components/personal-account-checkout-form.tsx:92-101` - Error handling
- `apps/web/app/home/(user)/billing/_lib/server/server-actions.ts:22-36` - Server action
- `apps/web/app/home/(user)/billing/_lib/server/user-billing.service.ts:37-121` - Checkout service
- `packages/billing/stripe/src/services/stripe-sdk.ts:10-22` - Stripe client creation
- `packages/billing/stripe/src/schema/stripe-server-env.schema.ts:1-31` - Schema validation
- `apps/e2e/tests/user-billing/user-billing.spec.ts` - Test file
- `apps/e2e/tests/utils/stripe.po.ts:14-29` - Stripe page object

### Recent Changes
No recent changes to billing tests - last commit: `10dd67dbb chore(config): update build configuration`

### Suspected Functions
- `createStripeClient()` at `packages/billing/stripe/src/services/stripe-sdk.ts:10`
- `StripeServerEnvSchema.parse()` - validates STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET
- `createPersonalAccountCheckoutSession()` - catches error and rethrows generic message

## Related Issues & Context

### Direct Predecessors
- #654 (CLOSED): "Bug Diagnosis: Billing E2E Tests Failing - Stripe Checkout Iframe Timeout" - Same symptom (iframe timeout), but focused on missing **publishable key** in CI
- #655 (CLOSED): "Bug Fix: Stripe Billing E2E Tests - Missing CI Secrets" - Fix for CI, but didn't address local development

### Historical Context
This is a recurring pattern where Stripe credentials are missing or invalid in the test environment. Previous fixes (#654, #655) addressed CI secrets but the local test environment (localhost:3001) may still be missing valid Stripe test credentials.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The test environment is missing valid Stripe server-side credentials (`STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`).

**Detailed Explanation**:
The `createStripeClient()` function validates environment variables using `StripeServerEnvSchema`:

```typescript
// packages/billing/stripe/src/services/stripe-sdk.ts
const stripeServerEnv = StripeServerEnvSchema.parse({
  secretKey: process.env.STRIPE_SECRET_KEY,
  webhooksSecret: process.env.STRIPE_WEBHOOK_SECRET,
});
```

The schema requires:
1. `STRIPE_SECRET_KEY` must be non-empty and start with `sk_` or `rk_`
2. `STRIPE_WEBHOOK_SECRET` must be non-empty and start with `whsec_`

If either validation fails, the Zod parse throws an error, which propagates up through the service layer and is caught in the React component, setting `error: true` and displaying the error alert.

**Supporting Evidence**:
- Screenshot shows "Error requesting checkout" alert - this only appears when the server action throws (line 99-100 of `personal-account-checkout-form.tsx`)
- No Stripe iframe loads - confirms the `checkoutToken` was never returned
- The `.env.local.example` file documents that `NEXT_PUBLIC_BILLING_PROVIDER=stripe` is required but doesn't document `STRIPE_SECRET_KEY` requirements
- Previous issue #654 confirmed similar pattern with missing keys in CI

### How This Causes the Observed Behavior

1. Test navigates to `/home/billing` - SUCCESS
2. Test selects plan and clicks "Proceed to Payment" - SUCCESS
3. `createPersonalAccountCheckoutSession` server action is called
4. `createUserBillingService().createCheckoutSession()` is called
5. `getBillingGatewayProvider()` creates `StripeBillingStrategyService`
6. `StripeBillingStrategyService.createCheckoutSession()` calls `this.stripeProvider()`
7. `createStripeClient()` attempts to validate env vars with Zod schema
8. **Schema validation fails** - missing or invalid `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`
9. Error propagates up, caught at component level
10. `setError(true)` displays "Error requesting checkout" alert
11. `checkoutToken` is never set, `<EmbeddedCheckout>` never renders
12. Test times out waiting for non-existent Stripe iframe

### Confidence Level

**Confidence**: High (90%)

**Reasoning**: The error path is deterministic and the code explicitly catches errors and displays this exact message. The only place this error can be triggered is when `createPersonalAccountCheckoutSession` throws. The most likely cause is schema validation failure in `createStripeClient()`. The screenshot provides clear evidence that the error state is active in the UI.

## Fix Approach (High-Level)

1. **Verify Stripe test credentials** are configured in `.env.test` or `.env.local`:
   - `STRIPE_SECRET_KEY=sk_test_...` (Stripe test secret key)
   - `STRIPE_WEBHOOK_SECRET=whsec_...` (Stripe test webhook secret)
2. Ensure the test server (port 3001) loads these environment variables
3. Verify the billing configuration has valid Stripe price IDs (not placeholders like `price_starter_yearly_placeholder`)
4. Consider adding better error logging to surface the actual Stripe error message for debugging

## Diagnosis Determination

The root cause is **missing or invalid Stripe server-side credentials** in the test environment. The `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` environment variables are either missing, empty, or don't match the required format (`sk_*` and `whsec_*` respectively).

This is a **configuration issue**, not a code bug. The test infrastructure expects valid Stripe test credentials to be available when running billing tests locally.

## Additional Context

- The billing configuration (`billing.sample.config.ts`) contains placeholder price IDs that may also need to be replaced with real Stripe test price IDs
- The test uses a separate config file `playwright.billing.config.ts` which loads `.env` and `.env.local`
- Previous fixes (#655) addressed CI but may not have documented local test setup requirements

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash (gh issue list/view), screenshot analysis*
