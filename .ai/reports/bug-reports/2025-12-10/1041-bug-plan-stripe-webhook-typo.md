# Bug Fix: Stripe Webhook URL Typo

**Related Diagnosis**: #1039
**Severity**: critical
**Bug Type**: configuration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Stripe webhook endpoint URL has typo: `verce.app` instead of `vercel.app`
- **Fix Approach**: Update webhook URL in Stripe Dashboard from `verce.app` to correct domain
- **Estimated Effort**: small (5-10 minutes)
- **Breaking Changes**: no
- **Deadline**: December 12, 2025 at 9:21:49 PM UTC (~2 days)

## Solution Design

### Problem Recap

The Stripe webhook URL in the Stripe Dashboard is misconfigured with a typo in the domain name. The URL points to `https://slideheroes25*.verce.app/api/billing/webhook` when it should be `https://slideheroes25*.vercel.app/api/billing/webhook` (missing 'l' in 'vercel').

Since `verce.app` is not a valid domain, DNS resolution fails and Stripe cannot deliver webhook payloads. This has resulted in 55 consecutive webhook delivery failures since December 3, 2025. Stripe will automatically disable the webhook endpoint on December 12, 2025 at 9:21:49 PM UTC.

For full details, see diagnosis issue #1039.

### Solution Approaches Considered

#### Option 1: Fix Webhook URL in Stripe Dashboard ⭐ RECOMMENDED

**Description**: Log into Stripe Dashboard, navigate to the Webhooks settings, and manually correct the typo in the webhook endpoint URL from `verce.app` to `vercel.app`.

**Pros**:
- Immediate fix (5-10 minutes)
- No code changes required
- No testing needed beyond webhook validation
- No deployment required
- Directly addresses the root cause

**Cons**:
- Manual process (not automated)
- Could regress if not documented properly
- No enforcement mechanism to prevent future typos

**Risk Assessment**: low - Simple configuration change with no code impact

**Complexity**: simple - Manual dashboard update

#### Option 2: Update Environment Variables and Documentation

**Description**: Add Stripe webhook URL configuration to environment variables, update CI/CD to validate URLs before deployment, and add pre-deployment checklist to prevent similar issues.

**Pros**:
- Prevents future typos through automation
- Centralized configuration
- Documentation provides institutional knowledge
- Could prevent similar mistakes

**Cons**:
- More complex than necessary for immediate fix
- Requires Stripe Dashboard access anyway to update URL
- Deferred by the critical deadline (only 2 days)
- Would be follow-up work after immediate fix

**Why Not Chosen**: The immediate deadline (2 days) requires fixing the symptom now. Infrastructure improvements can be done as follow-up work after webhook is restored.

#### Option 3: Use Custom Domain

**Description**: Instead of Vercel default domain (`*.vercel.app`), configure the webhook to use the custom domain `slideheroes.com` if available.

**Pros**:
- More professional domain
- Easier to manage and remember
- Stable even if Vercel domain changes

**Cons**:
- Still requires manual Stripe Dashboard update
- May require DNS configuration verification
- Custom domain availability unclear from diagnosis
- Still doesn't fix the typo on current URL

**Why Not Chosen**: Requires verification of custom domain availability. The typo-based URL must be fixed first regardless. Can be optimized later.

### Selected Solution: Fix Webhook URL in Stripe Dashboard

**Justification**: The root cause is a single typo in the Stripe Dashboard configuration. The application code is correct and the infrastructure is properly deployed. The fix is a straightforward configuration correction that removes the one character preventing webhook delivery. Given the critical deadline (~48 hours), this is the only viable immediate action.

**Technical Approach**:
- Navigate to Stripe Dashboard → Webhooks section
- Locate the SlideHeroes webhook endpoint
- Edit the endpoint URL
- Change domain from `verce.app` to `vercel.app`
- Save changes
- Test webhook delivery to verify fix
- Review missed events since December 3

**Architecture Changes**: None - this is a configuration-only fix

**Migration Strategy**: Not needed - no data migration required

## Implementation Plan

### Affected Files

This fix requires **NO code changes**. It is a Stripe Dashboard configuration update only.

### New Files

No new files required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Access Stripe Dashboard

- Log into the Stripe Dashboard for SlideHeroes account
- Verify you have admin access to webhook configuration
- Ensure you're in the correct account/workspace

**Why this step first**: Must have authenticated access before making changes

#### Step 2: Locate Current Webhook Configuration

- Navigate to Developers → Webhooks
- Locate the webhook for `/api/billing/webhook`
- Document the current incorrect URL: `https://slideheroes25*.verce.app/api/billing/webhook`
- Note the webhook ID and creation date for reference

**Why this step**: Ensures you're modifying the correct webhook before making changes

#### Step 3: Correct the Webhook URL

- Click "Edit" on the webhook endpoint
- In the Endpoint URL field, change:
  - FROM: `https://slideheroes25*.verce.app/api/billing/webhook`
  - TO: `https://slideheroes25*.vercel.app/api/billing/webhook` (add missing 'l' to 'vercel')
- Verify the corrected URL is spelled correctly
- Click "Save changes" or "Update endpoint"

**Why this step**: Applies the fix to the Stripe configuration

#### Step 4: Verify Webhook Delivery Restoration

- Still in the webhook details page, look for webhook delivery history
- Click "Send a test event" to verify the endpoint now responds correctly
- Send a test `payment_intent.succeeded` or `checkout.session.completed` event
- Verify the test event receives an HTTP 200 response

**Why this step**: Confirms the typo fix resolves the DNS resolution failure

#### Step 5: Review Missed Events

After the webhook is confirmed working:

- Review the webhook event log for failed events between December 3-12
- Check Stripe event history for events that should have been received
- Document any missed critical events (subscriptions created, payments processed)
- Plan recovery for any missed `checkout.session.completed` events

**Why this step**: Identifies what data may be out of sync due to missed webhooks

#### Step 6: Sync Database State with Stripe

- Query the database for subscription records that may be out of sync
- For critical subscriptions (paid/active), run Stripe reconciliation
- Consider webhook event replay if Stripe supports it
- Update subscription statuses to match Stripe records

**Why this step**: Restores data consistency after webhook restoration

#### Step 7: Document the Fix and Prevention

- Create a post-incident documentation in the project
- Add this incident to the onboarding checklist
- Consider automating webhook URL validation in CI/CD
- Document the correct webhook URL in code comments

**Why this step**: Prevents future occurrences of this issue

#### Step 8: Monitor Webhook Delivery

- Monitor the next 24-48 hours of webhook delivery for continued failures
- Set up alerts if webhook error rate increases
- Track webhook event volumes to ensure normal operation

**Why this step**: Confirms the fix is stable and working as expected

## Testing Strategy

### Webhook Validation

**Test**: Manual webhook test from Stripe Dashboard

Steps:
1. After updating webhook URL, go to Developers → Webhooks
2. Click the webhook endpoint
3. Click "Send a test event"
4. Select event type: `checkout.session.completed`
5. Click "Send test event"
6. Wait for response (should see HTTP 200)

**Expected Result**: HTTP 200 response, event successfully delivered to the endpoint

### Integration Testing (Post-Fix)

If the application has integration tests for billing:

- Run any existing billing webhook tests
- Verify the webhook endpoint returns expected 200 response
- Check that webhook data is properly processed

**Test files**:
- `apps/web/tests/webhooks/**` (if exists)
- Check for any billing/payment integration tests

### Manual Testing Checklist

Execute these manual tests to confirm the fix is complete:

- [ ] Log into Stripe Dashboard
- [ ] Navigate to Developers → Webhooks
- [ ] Verify webhook URL now shows `.vercel.app` (not `verce.app`)
- [ ] Send test event from Stripe Dashboard
- [ ] Confirm test event returns HTTP 200
- [ ] Check application logs for successful webhook processing
- [ ] Verify subscription data is being updated correctly
- [ ] Monitor webhook delivery for next 24 hours
- [ ] Review any failed events and reconcile with database

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Typo in corrected URL**: Editing the URL incorrectly could introduce another typo
   - **Likelihood**: low (careful editing)
   - **Impact**: high (webhooks still wouldn't work)
   - **Mitigation**: Double-check URL spelling, use copy-paste from correct source, test immediately

2. **Using wrong Vercel deployment**: Multiple Vercel deployments exist (dev, staging, prod)
   - **Likelihood**: medium (multiple domains possible)
   - **Impact**: high (wrong environment receives webhooks)
   - **Mitigation**: Verify the correct Vercel deployment domain, check which domain is currently in production, test webhook immediately

3. **Database inconsistency from missed events**: 9 days of missed webhook events may have caused data issues
   - **Likelihood**: high (depending on subscription activity)
   - **Impact**: medium (subscription status mismatches)
   - **Mitigation**: Run reconciliation query to identify out-of-sync records, consider webhook replay

4. **Stripe auto-disable webhook before fix**: Webhook might be auto-disabled before fix is applied
   - **Likelihood**: low (2 days before deadline)
   - **Impact**: high (would need to re-enable webhook)
   - **Mitigation**: Apply fix immediately, before December 12 deadline

**Rollback Plan**:

If the corrected URL is still incorrect:
1. Check the error in Stripe webhook delivery logs
2. Log back into Stripe Dashboard
3. Verify the correct Vercel deployment domain
4. Re-edit the webhook URL with the correct domain
5. Test again with Stripe's test event feature

**Monitoring** (critical given the deadline):
- Monitor webhook delivery for the next 24 hours
- Watch for any delivery failures in Stripe Dashboard
- Set reminder to check webhook status before December 12, 2025 deadline
- Alert on HTTP errors from webhook endpoint

## Performance Impact

**Expected Impact**: none (configuration change only)

No performance implications. The webhook endpoint is already implemented correctly in the application code and will process events with the same performance characteristics once delivery is restored.

## Security Considerations

**Security Impact**: none (fixing a configuration error)

The typo in the domain name was preventing legitimate webhook delivery. Correcting it improves security by:
- Restoring proper webhook authentication flow
- Ensuring legitimate Stripe webhooks are delivered
- Preventing account data drift from Stripe source of truth

No additional security review needed - this is correcting a configuration mistake, not introducing new functionality.

## Validation Commands

### Before Fix (Webhook Should Be Failing)

Stripe Dashboard will show:
- Webhook endpoint as active but with delivery failures
- Error message: "other errors" type (typically indicates DNS/network failure)
- 55+ consecutive failed delivery attempts
- Most recent failure timestamp within hours of diagnosis date

### After Fix (Webhook Should Be Delivering)

Stripe Dashboard will show:
- Webhook test event returns HTTP 200
- New webhook events are successfully delivered
- Error rate returns to 0%
- Recent events show successful delivery timestamps

### Validation Steps

```bash
# 1. Verify webhook is receiving events (check application logs)
# Looking for successful webhook processing logs after the fix is applied

# 2. If application has webhook logging:
# Check logs at: apps/web/app/api/billing/webhook
# Should see HTTP 200 responses and successful event processing

# 3. Verify subscription data consistency (if query available):
# Query subscriptions updated after fix timestamp
# Compare with Stripe subscription list

# 4. Monitor webhook delivery
# Stripe Dashboard → Developers → Webhooks
# Watch for green checkmarks on recent events
```

### Regression Prevention

```bash
# Run any existing billing/webhook tests
# (location depends on test setup)

# Monitor webhook delivery for 24 hours post-fix
# Check application error logs for webhook processing errors
# Verify no new webhook-related issues appear
```

## Dependencies

### New Dependencies (if any)

No new dependencies required.

### External Dependencies

- **Stripe Account Access**: Must have admin access to Stripe Dashboard
- **Vercel Account**: Verify the correct Vercel deployment domain
- **Application Logs**: Need access to application logs to verify webhook processing

## Database Changes

**Migration needed**: no

No database schema or migration changes required. This is a configuration fix only. However, you may need to reconcile missed data after webhooks are restored.

**Data Reconciliation** (recommended follow-up):

If subscriptions were created during the 9-day outage, run a reconciliation query to sync subscription status:

```sql
-- Identify subscriptions that may be out of sync
SELECT
  bs.id,
  bs.stripe_subscription_id,
  bs.status,
  bs.updated_at
FROM billing_subscriptions bs
WHERE bs.updated_at < NOW() - INTERVAL '9 days'
  AND bs.status NOT IN ('active', 'cancelled')
ORDER BY bs.updated_at DESC;

-- Manual verification of these records against Stripe API recommended
```

## Deployment Considerations

**Deployment Risk**: low (configuration change only)

**Special deployment steps**: None - this is not a code deployment

**Configuration Update**:
- Navigate to Stripe Dashboard (no code or server changes needed)
- Update webhook URL directly in Stripe Dashboard
- Verify with test event
- No versioning or deployment tracking needed

**Backwards compatibility**: Not applicable (configuration change)

**Feature flags needed**: no

## Success Criteria

The fix is complete when:
- [ ] Log into Stripe Dashboard and navigate to Webhooks
- [ ] Webhook URL shows `.vercel.app` (not `verce.app`)
- [ ] Send test event from Stripe Dashboard and receive HTTP 200
- [ ] Monitor webhook delivery log - recent events show successful delivery
- [ ] Application logs show successful webhook event processing
- [ ] Subscription data is being updated by incoming webhook events
- [ ] 24-hour monitoring shows 0% webhook delivery error rate
- [ ] Webhook is no longer at risk of auto-disable on December 12

## Notes

**Critical Deadline**: December 12, 2025 at 9:21:49 PM UTC - Stripe will automatically disable the webhook if not fixed before this time. Fix should be applied within the next 48 hours.

**Correct Vercel Domain**: Before making changes, verify which Vercel deployment URL is currently in production. The diagnosis mentions `slideheroes25*.vercel.app` - confirm the complete URL with the exact Vercel project name.

**Post-Fix Actions**: After confirming webhook delivery is restored, plan follow-up work:
1. Audit any missed `checkout.session.completed` events
2. Reconcile database subscription records with Stripe
3. Consider adding webhook URL validation to CI/CD
4. Update onboarding documentation to prevent similar typos

**Lessons Learned**: This configuration error highlights the value of:
- Automated webhook URL validation
- Configuration management tracking
- Webhook delivery monitoring/alerting
- Redundant delivery verification mechanisms

---

*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1039*
