# Bug Diagnosis: Stripe Webhooks Not Received in E2E Test Environment

**ID**: ISSUE-885
**Created**: 2025-12-03T21:35:00Z
**Reporter**: system (follow-up from #880)
**Severity**: medium
**Status**: new
**Type**: integration

## Summary

The E2E billing test fails at the subscription status verification step because Stripe webhook events are not being forwarded to the local Docker test environment. After completing checkout, Stripe sends webhook events (e.g., `checkout.session.completed`) but these never reach `http://localhost:3001/api/billing/webhook` because Stripe cannot POST to localhost URLs. The Stripe CLI webhook forwarding feature (`stripe listen`) is not running during E2E tests.

## Environment

- **Application Version**: dev branch (commit af1f8405e)
- **Environment**: E2E test (Docker containers)
- **Node Version**: 22
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: N/A - webhook forwarding was never configured for E2E tests

## Reproduction Steps

1. Run E2E billing test: `cd apps/e2e && pnpm test -- --grep "user-billing"`
2. Test navigates to `/home/billing` and selects a plan
3. User completes Stripe checkout with test card (`4242 4242 4242 4242`)
4. Stripe processes payment successfully and sends webhook event
5. Webhook event goes to registered Vercel endpoints, not localhost
6. Local database never receives subscription status update
7. Test fails waiting for "Active" status badge

## Expected Behavior

After completing checkout:
1. Stripe webhook event should be received by local test environment
2. Subscription status should be updated in database to "active"
3. Billing page should show "Active" status badge

## Actual Behavior

After completing checkout:
1. Stripe webhook event is NOT received by local test environment
2. Subscription status remains unchanged in database (no record exists)
3. Billing page shows plan selection UI instead of "Active" status
4. Test times out looking for `[data-testid="current-plan-card-status-badge"]`

## Diagnostic Data

### Container Environment Variables
```
STRIPE_SECRET_KEY=sk_test_5102rc32RkIM... (configured correctly)
STRIPE_WEBHOOK_SECRET=whsec_eb57bde9bf2e50cc... (Stripe CLI format, but CLI not running)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_eljFaamtkdMFLip95M3BVrSF
```

### Stripe Webhook Endpoints (from `stripe webhook_endpoints list`)
```json
{
  "url": "https://slideheroes25*.verce.app/api/billing/webhook",
  "enabled_events": [
    "checkout.session.completed",
    "customer.subscription.updated",
    "customer.subscription.deleted"
  ],
  "status": "enabled"
}
```

**Note**: All registered endpoints point to Vercel deployments, not localhost.

### Server Logs (from successful checkout)
```
{"level":30,"name":"billing.stripe","msg":"Creating checkout session..."}
{"level":30,"name":"billing.stripe","msg":"Checkout session created successfully"}
{"level":30,"name":"billing.stripe","msg":"Retrieving checkout session..."}
{"level":30,"name":"billing.stripe","msg":"Checkout session retrieved successfully"}
```

**Note**: No webhook-related logs appear because webhooks never reach the local server.

### Network Analysis
- Stripe API calls: Working (checkout sessions created/retrieved successfully)
- Webhook delivery: Not reaching localhost (Stripe cannot POST to http://localhost:3001)

## Error Stack Traces
```
Error: expect(locator).toContainText(expected) failed

Locator: locator('[data-testid="current-plan-card-status-badge"]')
Expected substring: "Active"
Timeout: 10000ms
Error: element(s) not found

at /apps/e2e/tests/user-billing/user-billing.spec.ts:38:40
```

## Related Code
- **Affected Files**:
  - `apps/web/app/api/billing/webhook/route.ts` - Webhook handler endpoint
  - `packages/billing/stripe/src/services/stripe-webhook-handler.service.ts` - Webhook processing logic
  - `docker-compose.test.yml` - E2E test container configuration
  - `apps/e2e/tests/user-billing/user-billing.spec.ts` - E2E test expecting "Active" status
- **Recent Changes**:
  - af1f8405e - Added Stripe credentials to Docker container (credentials now work)
- **Suspected Functions**: N/A - code is correct, infrastructure configuration is missing

## Related Issues & Context

### Direct Predecessors
- #880 (CLOSED): "Bug Fix: Stripe Checkout Session Creation Fails" - Fixed credentials issue, revealed webhook issue
- #869 (CLOSED): "Bug Diagnosis: User Billing E2E Test - Stripe Checkout Session Creation Failure" - Original diagnosis

### Related Infrastructure Issues
- #873 (CLOSED): "Chore: Refresh Expired Stripe CLI Keys" - Related Stripe CLI configuration

### Similar Symptoms
- #654 (CLOSED): "Bug Diagnosis: Billing E2E Tests Failing - Stripe Checkout Iframe Timeout" - Earlier billing test issues
- #655 (CLOSED): "Bug Fix: Stripe Billing E2E Tests - Missing CI Secrets" - Similar credential issues

### Historical Context
This is a progression of the billing E2E test fixes. Issue #880 fixed the Stripe credentials, allowing checkout sessions to be created. Now the test progresses further but fails because webhooks cannot reach the local environment.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Stripe webhook events cannot reach the local E2E test environment because Stripe requires publicly accessible HTTPS endpoints, and the `stripe listen` CLI forwarding command is not running during E2E tests.

**Detailed Explanation**:
The E2E test environment runs on `http://localhost:3001` inside a Docker container. When a user completes checkout:

1. Stripe processes the payment and queues webhook events
2. Stripe looks up registered webhook endpoints: `https://slideheroes25*.verce.app/api/billing/webhook`
3. Stripe POSTs events to these public Vercel URLs
4. The local Docker container at `http://localhost:3001` never receives the events
5. The webhook handler (`apps/web/app/api/billing/webhook/route.ts`) is never called
6. The subscription status in the database is never updated via `upsert_subscription`

The `STRIPE_WEBHOOK_SECRET` (`whsec_...`) in the container is formatted for Stripe CLI forwarding, but the Stripe CLI `listen` command is not running to forward events from Stripe to localhost.

**Supporting Evidence**:
- Server logs show successful checkout session creation but no webhook processing
- Stripe webhook endpoint list shows only Vercel deployment URLs
- `STRIPE_WEBHOOK_SECRET` starts with `whsec_` (CLI format) but CLI not running
- Test screenshot shows billing page without subscription status badge

### How This Causes the Observed Behavior

1. User completes checkout → Stripe marks payment successful
2. Stripe sends `checkout.session.completed` webhook to Vercel URL
3. Local Docker container never receives webhook event
4. Database `subscriptions` table has no record for this user
5. Billing page queries for subscription → finds none → shows plan selection UI
6. Test expects `[data-testid="current-plan-card-status-badge"]` with "Active" text
7. Element doesn't exist → test times out and fails

### Confidence Level

**Confidence**: High

**Reasoning**:
- Server logs confirm checkout works but no webhook logs appear
- Stripe endpoint list confirms no localhost URL registered
- The webhook secret format confirms Stripe CLI was intended but isn't running
- This is the standard Stripe local development challenge well-documented in Stripe docs

## Fix Approach (High-Level)

Two possible approaches:

**Option A: Add Stripe CLI webhook forwarding to E2E test setup**
- Start `stripe listen --forward-to localhost:3001/api/billing/webhook` before E2E tests
- Use the webhook signing secret generated by `stripe listen`
- Add this to Playwright global setup or as a Docker sidecar service

**Option B: Mock webhook events in E2E tests**
- After checkout completes, directly call the webhook endpoint with simulated event
- Use Stripe test event data with valid signatures
- More complex but doesn't require Stripe CLI in CI/CD

Recommended: **Option A** - Stripe CLI forwarding is the standard approach for local development and testing.

## Diagnosis Determination

The root cause is definitively identified: Stripe webhooks are not being forwarded to the local E2E test environment. The infrastructure configuration to run `stripe listen` during E2E tests is missing.

The fix requires adding Stripe CLI webhook forwarding to the E2E test infrastructure, either as part of the Docker Compose setup or the Playwright global setup.

## Additional Context

- Stripe CLI is already installed and authenticated (used for `stripe prices create` commands)
- The webhook handler code is correct and works in Vercel deployments
- This is a common local development challenge with Stripe documented in their official guides

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (git, docker, stripe CLI), Grep, Read, GitHub CLI*
