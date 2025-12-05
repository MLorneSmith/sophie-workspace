# Bug Diagnosis: User Billing E2E Test Fails - Stripe Webhook Container Not Started

**ID**: ISSUE-895
**Created**: 2025-12-04T16:15:00Z
**Reporter**: system
**Severity**: medium
**Status**: new
**Type**: integration

## Summary

The E2E billing test (shard 9) fails because the `stripe-webhook` Docker container is not started when running billing tests. The test successfully completes the Stripe checkout flow but fails when verifying the subscription status because webhook events from Stripe are never forwarded to the local test environment. This is a follow-up to issue #885 which diagnosed the same root cause.

## Environment

- **Application Version**: dev branch (commit 07bbfcc46)
- **Environment**: E2E test (Docker containers)
- **Node Version**: 22
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: N/A - stripe-webhook container was never automatically started for billing tests

## Reproduction Steps

1. Run E2E shard 9: `/test 9`
2. Test navigates to `/home/billing` and selects a plan
3. User completes Stripe checkout with test card
4. Stripe processes payment successfully and shows success screen
5. Test clicks "Proceed to App" to return to billing page
6. Test waits 45 seconds for "Active" status badge
7. Badge never appears because webhook was never received
8. Test times out and fails

## Expected Behavior

After completing checkout:
1. `stripe-webhook` container should be running to forward events
2. Stripe webhook event (`checkout.session.completed`) should be forwarded to `http://slideheroes-app-test:3001/api/billing/webhook`
3. Subscription status should be updated to "active" in database
4. Billing page should show "Active" status badge (`[data-testid="current-plan-card-status-badge"]`)

## Actual Behavior

After completing checkout:
1. `stripe-webhook` container is NOT running (not started by test controller)
2. Stripe webhook event is sent to Stripe's registered endpoints (Vercel URLs), not localhost
3. Subscription status is never updated in database
4. Billing page shows plan selection UI instead of subscription card
5. Test times out looking for status badge that doesn't exist

## Diagnostic Data

### Test Output
```
✘  1 [chromium] › tests/user-billing/user-billing.spec.ts:6:6 › User Billing @billing @integration › user can subscribe to a plan (1.2m)
✘  2 [chromium] › tests/user-billing/user-billing.spec.ts:6:6 › User Billing @billing @integration › user can subscribe to a plan (retry #1) (58.8s)
✘  3 [chromium] › tests/user-billing/user-billing.spec.ts:6:6 › User Billing @billing @integration › user can subscribe to a plan (retry #2) (57.1s)

Error: expect(locator).toContainText(expected) failed

Locator: locator('[data-testid="current-plan-card-status-badge"]')
Expected substring: "Active"
Timeout: 5000ms
Error: element(s) not found
```

### Running Containers
```
NAMES                                      STATUS
slideheroes-app-test                       Up 2 hours (healthy)
supabase_db_2025slideheroes-db             Up 2 hours (healthy)
supabase_studio_2025slideheroes-db         Up 2 hours (healthy)
... (other Supabase containers)

NOTE: slideheroes-stripe-webhook is NOT in the list
```

### Docker Compose Configuration
```yaml
# docker-compose.test.yml
stripe-webhook:
  image: stripe/stripe-cli:latest
  container_name: slideheroes-stripe-webhook
  profiles:
    - billing  # Only start when billing tests are enabled
```

The `stripe-webhook` service has `profiles: - billing` which means it only starts when `--profile billing` is passed to docker-compose.

### Validation Output (Misleading)
```
✅ Stripe Webhook Secret: Stripe webhook secret configured
✅ Stripe Webhook Endpoint: Webhook endpoint accessible at http://localhost:3001/api/billing/webhook
```

These validations pass because they check:
1. `STRIPE_WEBHOOK_SECRET` env var exists (it does)
2. Webhook endpoint returns non-404 (it does)

But they don't verify the `stripe-webhook` container is actually running to forward events!

### Screenshots
Test screenshots show the success page ("Done! You're all set.") but the test never navigates away - the subscription status is never updated so the billing page doesn't show the subscription card.

## Error Stack Traces
```
Error: expect(locator).toContainText(expected) failed

Locator: locator('[data-testid="current-plan-card-status-badge"]')
Expected substring: "Active"
Timeout: 5000ms
Error: element(s) not found

Call Log:
- Timeout 45000ms exceeded while waiting on the predicate

  46 |       timeout: 5000,
  47 |     });
> 48 |   }).toPass({
     |      ^
  49 |     intervals: [2000, 4000, 6000, 8000, 10000],
  50 |     timeout: 45_000,

at /home/msmith/projects/2025slideheroes/apps/e2e/tests/user-billing/user-billing.spec.ts:48:6
```

## Related Code
- **Affected Files**:
  - `docker-compose.test.yml:172-233` - stripe-webhook service definition
  - `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs` - test controller (missing billing profile activation)
  - `apps/e2e/tests/user-billing/user-billing.spec.ts` - failing test
  - `apps/e2e/tests/utils/e2e-validation.ts:123-187` - validation functions (incomplete)
- **Recent Changes**: None affecting this issue
- **Suspected Functions**: Test controller infrastructure startup

## Related Issues & Context

### Direct Predecessors
- #885 (OPEN): "Bug Diagnosis: Stripe Webhooks Not Received in E2E Test Environment" - Original diagnosis of this same issue

### Related Infrastructure Issues
- #880 (CLOSED): "Bug Fix: Stripe Checkout Session Creation Fails" - Fixed credentials, revealed webhook issue
- #873 (CLOSED): "Chore: Refresh Expired Stripe CLI Keys" - Related Stripe CLI configuration

### Historical Context
Issue #885 diagnosed this exact problem but a fix was never implemented. The stripe-webhook container exists in docker-compose.test.yml but is gated behind the `billing` profile which is never activated.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `stripe-webhook` Docker container is not started because the test controller doesn't activate the `billing` docker-compose profile when running billing tests (shards 9/10).

**Detailed Explanation**:
The `docker-compose.test.yml` file defines a `stripe-webhook` service that runs `stripe listen` to forward webhook events from Stripe to the local test environment. However, this service is configured with `profiles: - billing`, which means it only starts when docker-compose is invoked with `--profile billing`.

The test controller (`e2e-test-runner.cjs`) does not:
1. Detect when billing shards (9, 10) are being run
2. Start the docker-compose `billing` profile before tests
3. Wait for the `stripe-webhook` container to be healthy

As a result:
1. Test completes Stripe checkout successfully (uses Stripe test mode)
2. Stripe sends `checkout.session.completed` webhook to registered endpoints
3. Registered endpoints are Vercel URLs, not localhost
4. Local `stripe-webhook` container isn't running to intercept and forward
5. Database never receives subscription update
6. Billing page shows plan selection instead of subscription details
7. Test times out waiting for "Active" badge

**Supporting Evidence**:
- `docker ps` shows `slideheroes-stripe-webhook` container is NOT running
- `docker-compose.test.yml:176-177` shows `profiles: - billing` configuration
- Test logs show validation passes but webhook is never received
- Screenshots show success page, but test fails on status verification

### How This Causes the Observed Behavior

1. User completes Stripe checkout -> Success page shown
2. Test clicks "Proceed to App" -> Navigates to billing page
3. Billing page queries database for subscription -> None found
4. Page renders plan selection UI (fallback when no subscription)
5. `CurrentSubscriptionCard` never renders -> No status badge
6. Test waits 45s for `[data-testid="current-plan-card-status-badge"]`
7. Element never appears -> Test times out

### Confidence Level

**Confidence**: High

**Reasoning**:
- Docker container list confirms stripe-webhook is not running
- This is a repeat of the exact issue diagnosed in #885
- The docker-compose profile mechanism is well-documented
- Screenshots and error logs are consistent with webhook not being received

## Fix Approach (High-Level)

Modify the test controller to:
1. Detect when billing shards (9, 10) are requested
2. Start docker-compose with `--profile billing` flag
3. Wait for `slideheroes-stripe-webhook` container to be healthy before running tests
4. Optionally: Enhance validation to check if stripe-webhook container is running

Alternative: Add a new startup hook in the E2E test infrastructure that checks shard numbers and conditionally starts the billing profile.

## Diagnosis Determination

The root cause is definitively identified: The `stripe-webhook` container is not started because the `billing` docker-compose profile is never activated. This was previously diagnosed in issue #885 but never fixed.

The fix requires modifying the test controller to detect billing test shards and start the appropriate docker-compose profile.

## Additional Context

- The stripe-webhook container configuration is complete and correct
- The webhook handler code works correctly when webhooks are received
- This only affects local E2E testing, not production deployments
- Team billing tests (shard 10) will have the same issue

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (docker ps, grep), Read, Grep, GitHub CLI*
