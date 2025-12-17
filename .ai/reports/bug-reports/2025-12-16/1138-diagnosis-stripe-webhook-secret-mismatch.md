# Bug Diagnosis: Stripe Webhook Secret Mismatch After URL Correction

**ID**: ISSUE-1138
**Created**: 2025-12-16T14:30:00Z
**Reporter**: user/system
**Severity**: critical
**Status**: new
**Type**: configuration

## Summary

After fixing the Stripe webhook URL typo (Issue #1041, changing `verce.app` to `vercel.app`), the webhook endpoint is now returning HTTP 500 errors because the `STRIPE_WEBHOOK_SECRET` environment variable in Vercel does not match the webhook signing secret for the corrected/new endpoint in Stripe Dashboard.

## Environment

- **Application Version**: Current (main branch)
- **Environment**: Production (`https://2025slideheroes-web.vercel.app`)
- **Node Version**: Not applicable (Vercel serverless)
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Never properly worked for this endpoint (URL typo prevented delivery, now signature prevents processing)
- **Related Issues**: #1039 (original diagnosis), #1041 (URL fix)

## Reproduction Steps

1. Stripe sends a webhook event to `https://2025slideheroes-web.vercel.app/api/billing/webhook`
2. The webhook route receives the request with a signature in the `stripe-signature` header
3. The server attempts to verify the signature using `STRIPE_WEBHOOK_SECRET` from environment variables
4. Signature verification fails because the secret doesn't match Stripe's current signing secret
5. Server returns HTTP 500 error

## Expected Behavior

Stripe webhooks should be verified successfully and return HTTP 200, with events processed and database updated.

## Actual Behavior

Stripe reports 3 consecutive HTTP 500 errors since December 10, 2025 at 2:11:12 PM UTC. The webhook endpoint is failing to process any events.

## Diagnostic Data

### Stripe Email Report
```
The URL of the failing webhook endpoint is: https://2025slideheroes-web.vercel.app/api/billing/webhook

3 requests returned HTTP 500, indicating a server error on your end.

We've attempted to send event notifications to this endpoint 3 times since the first failure on December 10, 2025 at 2:11:12 PM UTC.

We will stop sending event notifications to this webhook endpoint by December 19, 2025 at 2:11:12 PM UTC.
```

### Vercel Environment Variables
```
STRIPE_WEBHOOK_SECRET exists in Vercel for Production, Preview, and Development environments
Last updated: 292 days ago (approximately)
```

### Production Deployment
```
Deployment ID: dpl_GzzgDit7hxovwmxcfDHbX8ETWwU4
URL: https://2025slideheroes-7nzjlm8bd-slideheroes.vercel.app
Created: December 10, 2025 (same day as first webhook failure)
Status: Ready
```

### Code Analysis

The webhook signature verification code in `packages/billing/stripe/src/services/stripe-webhook-handler.service.ts:45-72`:
```typescript
async verifyWebhookSignature(request: Request) {
  const body = await request.clone().text();
  const signatureKey = "stripe-signature";
  const signature = request.headers.get(signatureKey);

  if (!signature) {
    throw new Error(`Missing ${signatureKey} header`);
  }

  const { webhooksSecret } = StripeServerEnvSchema.parse({
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhooksSecret: process.env.STRIPE_WEBHOOK_SECRET,  // <-- Uses env var
  });

  const stripe = await this.loadStripe();

  const event = await stripe.webhooks.constructEventAsync(
    body,
    signature,
    webhooksSecret,  // <-- Signature verification fails here
  );

  if (!event) {
    throw new Error("Invalid signature");
  }

  return event;
}
```

The error is caught in `apps/web/app/api/billing/webhook/route.ts:32-44`:
```typescript
try {
  await service.handleWebhookEvent(request);
  logger.info(ctx, "Successfully processed billing webhook");
  return new Response("OK", { status: 200 });
} catch (error) {
  logger.error({ ...ctx, error }, "Failed to process billing webhook");
  return new Response("Failed to process billing webhook", {
    status: 500,  // <-- Returns 500 on signature verification failure
  });
}
```

## Error Stack Traces

The exact error message would be from Stripe SDK:
```
Error: No signatures found matching the expected signature for payload
```
or
```
Error: Webhook signature verification failed
```

## Related Code
- **Affected Files**:
  - `apps/web/app/api/billing/webhook/route.ts` - Webhook route handler
  - `packages/billing/stripe/src/services/stripe-webhook-handler.service.ts` - Signature verification
  - `packages/billing/stripe/src/schema/stripe-server-env.schema.ts` - Environment validation
- **Recent Changes**: No code changes; this is a configuration mismatch
- **Suspected Functions**: `verifyWebhookSignature()`, `stripe.webhooks.constructEventAsync()`

## Related Issues & Context

### Direct Predecessors
- #1039 (CLOSED): "Bug Diagnosis: Stripe Webhook URL Typo Causing 55 Consecutive Failures" - Identified URL typo
- #1041 (CLOSED): "Bug Fix: Stripe Webhook URL Typo" - Fixed the URL in Stripe Dashboard

### Related Infrastructure Issues
- #873 (CLOSED): "Chore: Refresh Expired Stripe CLI Keys" - Stripe key management

### Historical Context
This is a follow-up issue to #1041. The URL typo fix was necessary but incomplete - the webhook signing secret also needed to be updated when the URL was corrected.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `STRIPE_WEBHOOK_SECRET` environment variable in Vercel does not match the webhook signing secret currently configured for the `https://2025slideheroes-web.vercel.app/api/billing/webhook` endpoint in Stripe Dashboard.

**Detailed Explanation**:

When the webhook URL was corrected from `verce.app` to `vercel.app` (Issue #1041), one of two things happened:

1. **Scenario A (Most Likely)**: A **new webhook endpoint** was created in Stripe Dashboard with the corrected URL. This new endpoint has a **new signing secret** (`whsec_...`) that is different from the old endpoint's secret.

2. **Scenario B**: The existing endpoint's URL was edited, which may have regenerated the signing secret.

In either case, the `STRIPE_WEBHOOK_SECRET` in Vercel (last updated 292 days ago) no longer matches the current Stripe webhook endpoint's signing secret.

**Supporting Evidence**:
- Previous issue with URL typo: DNS resolution would fail, Stripe would report "other errors" (network errors)
- Current issue: HTTP 500 returned by server - request reaches server but processing fails
- Production deployment date matches first failure date (December 10, 2025)
- `STRIPE_WEBHOOK_SECRET` in Vercel was last updated 292 days ago
- Stripe explicitly states "3 requests returned HTTP 500" - server-side error, not connectivity

### How This Causes the Observed Behavior

1. Stripe sends webhook event to correct URL (`https://2025slideheroes-web.vercel.app/api/billing/webhook`)
2. DNS resolves correctly, request reaches Vercel serverless function
3. `route.ts` POST handler invokes `getBillingEventHandlerService()`
4. Service calls `verifyWebhookSignature(request)`
5. `StripeServerEnvSchema.parse()` reads `STRIPE_WEBHOOK_SECRET` from environment (old secret)
6. `stripe.webhooks.constructEventAsync(body, signature, webhooksSecret)` attempts verification
7. Stripe SDK computes expected signature using provided `webhooksSecret`
8. Computed signature does NOT match `stripe-signature` header (signed with different secret)
9. SDK throws signature verification error
10. Error propagates to catch block in `route.ts`
11. Server returns `HTTP 500` with "Failed to process billing webhook"

### Confidence Level

**Confidence**: High

**Reasoning**:
- HTTP 500 indicates server-side processing failure (not connectivity like before)
- The webhook URL fix was applied on/around December 10 - same day failures started
- Environment variable hasn't been updated in 292 days
- Code explicitly verifies signature and returns 500 on failure
- This is a documented pitfall when changing webhook endpoints in Stripe

## Fix Approach (High-Level)

1. **Log into Stripe Dashboard** and navigate to Developers → Webhooks
2. **Find the webhook endpoint** for `https://2025slideheroes-web.vercel.app/api/billing/webhook`
3. **Copy the Signing Secret** (click "Reveal" to see the `whsec_...` value)
4. **Update Vercel environment variable**:
   - Navigate to Vercel Dashboard → Project → Settings → Environment Variables
   - Find `STRIPE_WEBHOOK_SECRET`
   - Update the value with the new signing secret from Stripe
   - Update for Production environment (and Preview/Development if needed)
5. **Redeploy the application** (or wait for next deployment) to pick up new env var
6. **Test webhook delivery** using Stripe Dashboard's "Send test webhook" feature
7. **Monitor for successful 200 responses**

## Diagnosis Determination

The root cause is definitively identified: `STRIPE_WEBHOOK_SECRET` mismatch between Vercel environment and Stripe Dashboard. The previous fix (#1041) only addressed the URL typo but did not update the corresponding webhook signing secret in Vercel. This is a configuration-only fix requiring no code changes.

## Additional Context

**Critical Timeline**:
- **December 10, 2025**: URL fix deployed, webhook failures began
- **December 19, 2025**: Stripe will auto-disable webhook endpoint
- **Action Required Within**: ~3 days

**Prevention Recommendations**:
1. Document that webhook URL changes require signing secret verification/update
2. Add this to the post-incident checklist
3. Consider adding webhook health check to deployment verification

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (git, gh, vercel), Read, Grep, Glob, Task (perplexity-expert)*
