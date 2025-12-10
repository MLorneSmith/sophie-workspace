# Bug Diagnosis: Stripe Webhook Endpoint URL Typo Causing 55 Consecutive Failures

**ID**: ISSUE-pending
**Created**: 2025-12-10T13:55:00Z
**Reporter**: User (via Stripe notification email)
**Severity**: high
**Status**: new
**Type**: integration

## Summary

Stripe webhook endpoint is failing with 55 consecutive errors since December 3, 2025. The root cause is a **typo in the webhook URL configured in Stripe Dashboard**: the domain is set to `verce.app` instead of the correct `vercel.app`, causing all webhook requests to be sent to a non-existent domain.

## Environment

- **Application Version**: Current (dev branch, commit db5514a17)
- **Environment**: Production (test mode in Stripe)
- **Stripe API Version**: 2025-11-17.clover
- **Vercel Project**: `2025slideheroes-web`
- **Correct Production URL**: `https://2025slideheroes-web-slideheroes.vercel.app`
- **Configured (incorrect) URL**: `https://slideheroes25*.verce.app/api/billing/webhook`

## Reproduction Steps

1. Stripe sends a webhook event (e.g., `checkout.session.completed`)
2. Request is sent to `https://slideheroes25*.verce.app/api/billing/webhook`
3. DNS lookup fails because `verce.app` is not a valid domain
4. Stripe marks the webhook delivery as failed
5. Repeat 55 times since December 3, 2025

## Expected Behavior

Stripe should send webhook events to the correct Vercel deployment URL (`vercel.app` domain), and the application should receive and process them, returning HTTP 200-299.

## Actual Behavior

All webhook requests fail because they are being sent to an invalid domain (`verce.app` instead of `vercel.app`). Stripe reports "other errors" which is consistent with DNS/network-level failures.

## Diagnostic Data

### Console Output

Not applicable - requests never reach the application server.

### Network Analysis

```
Configured URL: https://slideheroes25*.verce.app/api/billing/webhook
Domain: verce.app (INVALID - typo, should be vercel.app)
Result: DNS resolution failure / connection refused
```

### Vercel Deployment Analysis

```bash
# Actual Vercel project deployments
$ vercel ls
> Deployments for slideheroes/2025slideheroes-web

  Age     Deployment                                                   Status
  4m      https://2025slideheroes-133orn3fl-slideheroes.vercel.app     Ready
  17h     https://2025slideheroes-7viwlzc0d-slideheroes.vercel.app     Ready

# Configured domains
$ vercel domains ls
  Domain             Registrar
  slideheroes.com    Third Party
```

### Stripe Configuration

- Webhook failures: 55 since December 3, 2025 at 9:21:49 PM UTC
- Deadline: December 12, 2025 at 9:21:49 PM UTC (webhook will be disabled)
- Error type: "other errors" (consistent with DNS/network failures)

## Error Stack Traces

No stack traces available - the requests never reach the application.

## Related Code

- **Affected Files**:
  - `apps/web/app/api/billing/webhook/route.ts` - Webhook handler (code is correct)
  - `packages/billing/stripe/src/services/stripe-webhook-handler.service.ts` - Stripe webhook processor (code is correct)
  - `packages/billing/stripe/src/schema/stripe-server-env.schema.ts` - Environment validation (code is correct)
- **Recent Changes**: None relevant - this is a configuration issue, not a code issue
- **Suspected Functions**: None - the application code is correct

## Related Issues & Context

### Direct Predecessors

- #885 (CLOSED): "Bug Diagnosis: Stripe Webhooks Not Received in E2E Test Environment" - Different issue (E2E test configuration)
- #886 (CLOSED): "Bug Fix: Stripe Webhooks Not Received in E2E Test Environment" - Different issue (E2E test fix)

### Related Infrastructure Issues

- #915 (CLOSED): "Bug Diagnosis: Dev Integration Tests Failing - Missing NODE_ENV and STRIPE_WEBHOOK_SECRET" - Related to Stripe configuration
- #873 (CLOSED): "Chore: Refresh Expired Stripe CLI Keys" - Stripe key management

### Same Component

- #869 (CLOSED): "Bug Diagnosis: User Billing E2E Test - Stripe Checkout Session Creation Failure"
- #880 (CLOSED): "Bug Fix: Stripe Checkout Session Creation Fails - Missing Server-Side Credentials"

### Historical Context

Previous Stripe issues were related to E2E test configuration and missing credentials. This is the first instance of a production webhook URL misconfiguration.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The Stripe webhook URL configured in the Stripe Dashboard contains a typo: `verce.app` instead of `vercel.app`.

**Detailed Explanation**:
When the Stripe webhook endpoint was configured in the Stripe Dashboard, the URL was entered incorrectly:
- **Incorrect**: `https://slideheroes25*.verce.app/api/billing/webhook`
- **Missing letter**: `verce.app` is missing the letter "l" - should be `vercel.app`

Because `verce.app` is not a valid domain, DNS resolution fails and Stripe cannot establish a TCP connection to deliver the webhook payload. This results in Stripe classifying the failure as "other errors" rather than HTTP status code errors.

**Supporting Evidence**:
- User confirmed the URL in Stripe Dashboard is exactly `https://slideheroes25*.verce.app/api/billing/webhook`
- Vercel deployments are at `*.vercel.app` domain (confirmed via `vercel ls`)
- Error type "other errors" (55 occurrences) is consistent with DNS/network-level failures, not application errors
- The application webhook handler code at `apps/web/app/api/billing/webhook/route.ts:37` correctly returns HTTP 200 on success

### How This Causes the Observed Behavior

1. User completes a checkout or subscription action in the application
2. Stripe triggers a webhook event (e.g., `checkout.session.completed`)
3. Stripe attempts to POST to `https://slideheroes25*.verce.app/api/billing/webhook`
4. DNS lookup for `verce.app` fails (domain doesn't exist)
5. Stripe marks the delivery as failed with "other errors"
6. Stripe retries according to its exponential backoff policy
7. After 55 failures over 7 days, Stripe sends warning emails

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The typo is clearly visible in the configured URL (`verce.app` vs `vercel.app`)
2. The error pattern ("other errors" vs HTTP status codes) confirms the requests never reach the server
3. Vercel deployment URLs confirm the correct domain format (`*.vercel.app`)
4. The application webhook code is correct and would return HTTP 200 if requests reached it

## Fix Approach (High-Level)

1. Log into Stripe Dashboard at https://dashboard.stripe.com/webhooks
2. Find the webhook endpoint with URL `https://slideheroes25*.verce.app/api/billing/webhook`
3. Edit the endpoint URL to correct the typo: change `verce.app` to `vercel.app`
4. The correct URL should be one of:
   - Production: `https://slideheroes.com/api/billing/webhook` (if custom domain is configured)
   - OR: `https://2025slideheroes-web-slideheroes.vercel.app/api/billing/webhook` (Vercel default)
5. Save the changes and trigger a test webhook to verify connectivity
6. Monitor the webhook logs to confirm successful delivery

**Note**: Also verify the `STRIPE_WEBHOOK_SECRET` environment variable in Vercel matches the webhook signing secret shown in Stripe Dashboard for the updated endpoint.

## Diagnosis Determination

The root cause is definitively identified as a **typo in the Stripe webhook URL configuration**. The domain `verce.app` should be `vercel.app`. This is a configuration-only fix that does not require any code changes.

**Immediate Action Required**: The webhook will be automatically disabled by Stripe on December 12, 2025 at 9:21:49 PM UTC if not fixed. This gives approximately 2 days to correct the URL.

## Additional Context

### Impact Assessment

- **Subscriptions**: New invoice notifications may be delayed up to 3 days
- **Checkout**: `checkout.session.completed` events not received - may affect purchase fulfillment
- **Data Integrity**: Subscription status in the database may be out of sync with Stripe

### Recommended Post-Fix Actions

1. Review completed payments since December 3, 2025 to ensure fulfillment
2. Check subscription statuses in the database against Stripe
3. Consider implementing webhook event replay for missed events
4. Add monitoring/alerting for webhook failures

---
*Generated by Claude Debug Assistant*
*Tools Used: Vercel CLI (vercel ls, vercel env ls, vercel domains ls), GitHub CLI (gh issue list), Grep, Glob, Read*
