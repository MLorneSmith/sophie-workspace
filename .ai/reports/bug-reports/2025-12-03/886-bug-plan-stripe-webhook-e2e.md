# Bug Fix: Stripe Webhooks Not Received in E2E Test Environment

**Related Diagnosis**: #885 (REQUIRED)
**Severity**: medium
**Bug Type**: integration
**Risk Level**: low
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Stripe webhook events cannot reach `localhost:3001` in Docker test environment because Stripe requires publicly accessible HTTPS endpoints. `stripe listen` CLI webhook forwarding is not running during E2E tests.
- **Fix Approach**: Add Stripe CLI webhook forwarding to E2E test global setup and test server startup pipeline
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2E billing tests fail at subscription status verification because Stripe webhooks never reach the local Docker test environment. After checkout, Stripe sends events like `checkout.session.completed`, but these go to Vercel-configured endpoints, not `localhost:3001`. The Stripe CLI webhook forwarding (`stripe listen`) is not configured or running during E2E tests, preventing webhook delivery to the test environment.

For full details, see diagnosis issue #885.

### Solution Approaches Considered

#### Option 1: Add Stripe CLI Webhook Forwarding to Test Setup ⭐ RECOMMENDED

**Description**: Integrate `stripe listen` command into the E2E test infrastructure by starting it as part of the test server startup process. Run `stripe listen --forward-to localhost:3001/api/billing/webhook` before E2E tests begin, ensuring Stripe webhook events are forwarded to the test environment.

**Pros**:
- Uses official Stripe CLI tool (stripe listen) designed for this purpose
- Minimal code changes required
- Works seamlessly with existing test infrastructure
- Automatically updates STRIPE_WEBHOOK_SECRET for test environment
- Replicates production webhook flow accurately
- No mocking means real Stripe event behavior validation

**Cons**:
- Requires Stripe CLI to be installed and configured on CI agents
- Adds dependency on external Stripe CLI process
- Webhook secret must be captured and injected at startup
- Slightly slower test startup (webhook forwarding initialization)

**Risk Assessment**: low - Stripe CLI is stable, well-documented tool used by many teams

**Complexity**: moderate - Requires process management and environment variable coordination

#### Option 2: Mock Stripe Webhook Events Directly in Tests

**Description**: Skip Stripe webhook delivery entirely. After checkout succeeds, directly call the webhook handler (`/api/billing/webhook`) with simulated webhook events before assertions.

**Pros**:
- No external dependencies (no Stripe CLI needed)
- Fast test startup
- Complete control over webhook payload
- Easier to test edge cases (webhook failures, retries)

**Cons**:
- Doesn't validate real Stripe webhook behavior
- Bypasses the actual webhook delivery mechanism
- Less confidence in production webhook handling
- Requires maintaining mock webhook payloads
- Doesn't test idempotency or retry logic

**Why Not Chosen**: Mocking loses the benefit of validating the actual webhook flow. We need to confirm Stripe can reach our endpoint and the webhook handler processes events correctly.

#### Option 3: Use Stripe Test Webhooks via Dashboard

**Description**: Manually configure Stripe webhooks in the test environment and trigger them through the Stripe Dashboard during tests.

**Pros**:
- Real webhook delivery from Stripe
- No additional tools needed

**Cons**:
- Manual process unsuitable for automated E2E tests
- Requires switching between environments
- Cannot be integrated into CI/CD
- Not scalable for automated testing

**Why Not Chosen**: Cannot be automated and contradicts the purpose of E2E testing.

### Selected Solution: Stripe CLI Webhook Forwarding

**Justification**: Option 1 is the industry-standard approach for E2E testing Stripe integrations. It validates the complete webhook flow (Stripe → webhook endpoint → database) without mocking, providing the highest confidence in production behavior. The Stripe CLI is stable, well-maintained, and widely used for this exact purpose.

**Technical Approach**:

1. **Start Stripe CLI webhook forwarding** before E2E tests (in global setup or test container startup)
2. **Capture the dynamically generated webhook secret** from `stripe listen` output
3. **Inject the secret** into the test environment via `STRIPE_WEBHOOK_SECRET`
4. **Ensure test servers** (ports 3001/3021) can receive forwarded events
5. **Verify webhook delivery** with health checks in tests

**Architecture Changes** (if any):

- Modify test container startup script to include `stripe listen` process
- Update global setup to wait for webhook forwarding to be ready
- Add environment variable injection for dynamic webhook secret
- No database schema changes or API modifications required

**Migration Strategy** (if needed):

N/A - No data migration needed. This is infrastructure-only change.

## Implementation Plan

### Affected Files

- `docker-compose.test.yml` - Add Stripe CLI webhook forwarding service or startup command
- `apps/e2e/global-setup.ts` - Ensure webhook forwarding is ready before tests run
- `apps/e2e/playwright.config.ts` - Configure environment variables for webhook secret
- `.env.example` (E2E) - Document Stripe test credentials needed
- (Optional) E2E test helper files - Add webhook readiness verification

### New Files

If creating a dedicated webhook forwarding service:
- `scripts/stripe-webhook-forward.sh` - Script to start and monitor Stripe CLI forwarding

OR use existing infrastructure without new files.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Verify Stripe CLI and Test Credentials

<describe what this step accomplishes>

Ensure the Stripe CLI is available and test credentials are configured for the E2E test environment. This is foundational for webhook forwarding.

- Verify `stripe` CLI is installed: `which stripe` or `stripe --version`
- Confirm Stripe test API keys are set: Check environment variables `STRIPE_SECRET_KEY` and `STRIPE_PUBLIC_KEY`
- Test Stripe authentication: `stripe login` (if not already authenticated on CI)
- Document in `.env.example` what Stripe credentials are needed for E2E tests

**Why this step first**: Without Stripe CLI and credentials, webhook forwarding cannot be set up. This is the prerequisites check.

#### Step 2: Integrate Stripe CLI Webhook Forwarding into Test Setup

<describe what this step accomplishes>

Integrate `stripe listen --forward-to localhost:3001/api/billing/webhook` into the test server startup process. This makes webhook forwarding automatic when tests start.

- Modify `docker-compose.test.yml` to include `stripe listen` in the test environment
  - Add either as a separate service or as part of the web container startup
  - Ensure it runs alongside Next.js and Payload services
  - Capture `STRIPE_WEBHOOK_SECRET` from `stripe listen` output
- Update container health checks to verify webhook forwarding is ready
- Configure process management (supervisor, custom entrypoint, etc.) to ensure both Next.js and Stripe CLI stay running

**Technical decision**: Determine best approach:
- **Option A**: Separate Docker service in compose file (cleaner separation)
- **Option B**: Part of web container startup (simpler, one container)

Recommend **Option A** (separate service) for clarity and isolation.

#### Step 3: Update Global Setup to Wait for Webhook Forwarding

<describe what this step accomplishes>

Ensure E2E tests don't start until Stripe webhook forwarding is fully initialized and ready to receive events.

- Modify `apps/e2e/global-setup.ts` to verify webhook forwarding health
  - Add check that `STRIPE_WEBHOOK_SECRET` is available
  - Test that webhook endpoint responds at `http://localhost:3001/api/billing/webhook`
  - Add retry logic if forwarding isn't ready yet
- Log webhook forwarding status so you can see setup progress
- Fail explicitly with clear error message if webhook forwarding cannot be established

#### Step 4: Update Playwright Configuration

<describe what this step accomplishes>

Configure Playwright to use the correct Stripe webhook secret when running E2E tests.

- Modify `apps/e2e/playwright.config.ts` to inject `STRIPE_WEBHOOK_SECRET` into test environment
  - Read from the dynamically generated secret (from docker-compose or global setup)
  - Or pass through from environment variable set by test startup
- Document how the webhook secret is provided (auto-generated by Stripe CLI vs. static test value)

#### Step 5: Add/Update E2E Billing Tests

<describe what this step accomplishes>

Update or add E2E billing tests to validate the complete webhook flow now that forwarding is set up.

- Locate existing billing test: `apps/e2e/tests/billing/*.spec.ts` or `apps/e2e/tests/payment/*.spec.ts`
- Update test to verify subscription status updates after checkout (currently failing)
- Add explicit wait for webhook processing:
  - Either poll for subscription status with timeout
  - Or verify webhook was received at the endpoint
- Add test comment explaining this now validates the full webhook flow

**Test scenario**:
```typescript
test('should update subscription status after checkout completes', async ({ page }) => {
  // Navigate to billing page
  // Select plan and complete Stripe checkout
  // Wait for webhook to be received and processed
  // Verify subscription status changes to "active"
});
```

#### Step 6: Verify Webhook Delivery (Manual Validation)

<describe what this step accomplishes>

Before tests run, verify the complete webhook flow works end-to-end locally.

- Start test environment manually: `docker-compose -f docker-compose.test.yml up -d`
- Verify Stripe CLI webhook forwarding is active: Check logs show "Ready to accept events"
- Create a test charge/checkout event manually in Stripe test dashboard
- Verify webhook is received at `http://localhost:3001/api/billing/webhook`
- Check database to confirm subscription status was updated
- Stop environment: `docker-compose -f docker-compose.test.yml down`

#### Step 7: Run E2E Billing Tests

<describe what this step accomplishes>

Execute the billing tests to confirm the webhook flow is working and the original bug is fixed.

- Run billing test suite: `cd apps/e2e && pnpm test -- --grep "billing"`
- Verify tests pass (previously failed at webhook status check)
- Check logs to confirm webhook events were received during test

#### Step 8: Update Documentation

<describe what this step accomplishes>

Document the Stripe webhook forwarding setup for future developers and CI/CD teams.

- Update `apps/e2e/README.md` with Stripe CLI setup instructions
- Document required Stripe test credentials in `.env.example`
- Add troubleshooting section for common Stripe CLI issues
- Update project CLAUDE.md if webhook forwarding impacts development workflow

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Webhook signature validation (verify STRIPE_WEBHOOK_SECRET is used correctly)
- ✅ Webhook handler processes events correctly (subscription creation, updates)
- ✅ Idempotency key handling (duplicate events don't duplicate subscriptions)
- ✅ Error handling (invalid events are rejected gracefully)

**Test files**:
- `apps/web/app/api/billing/webhook/__tests__/handler.spec.ts` - Webhook handler tests

### Integration Tests

Verify webhook signature validation and event processing in isolated environment:

**Test files**:
- `apps/web/app/api/billing/__tests__/integration.spec.ts` - Webhook integration tests

### E2E Tests

Validate the complete user journey from checkout to subscription status update:

**Test files**:
- `apps/e2e/tests/billing/user-billing.spec.ts` - Primary billing test (currently failing)
  - Update: Remove skips, verify subscription status updates
  - Add explicit wait for webhook processing
  - Validate billing page shows "Active" subscription badge

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start test environment: `docker-compose -f docker-compose.test.yml up -d`
- [ ] Verify Stripe CLI webhook forwarding started: Check logs for "Ready to accept events"
- [ ] Start Next.js app (if not in container): `pnpm dev` or verify test container is healthy
- [ ] Navigate to billing page and complete checkout with test card (`4242 4242 4242 4242`)
- [ ] Observe webhook in Stripe CLI logs: Should see `checkout.session.completed` event forwarded
- [ ] Wait 5-10 seconds for webhook processing
- [ ] Verify subscription status displays as "Active" on billing page (no longer shows "Pending")
- [ ] Check database directly: `SELECT * FROM subscriptions WHERE user_id = 'test-user'` should show `status = 'active'`
- [ ] Re-run E2E billing test: Should pass (previously failed at status check)
- [ ] Verify no new errors in webhook handler logs

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Stripe CLI Not Available on CI Agents**: <description>
   - **Likelihood**: medium (if CI environment not properly configured)
   - **Impact**: high (tests cannot run, blocks CI pipeline)
   - **Mitigation**:
     - Install Stripe CLI in CI Docker images or use `npm install -g @stripe/cli` as part of setup
     - Document Stripe CLI requirement clearly in README
     - Provide explicit error message if CLI is missing

2. **Webhook Secret Not Captured Correctly**: <description>
   - **Likelihood**: low (straightforward output parsing)
   - **Impact**: high (webhook signature validation fails, events rejected)
   - **Mitigation**:
     - Test secret capture locally before deploying
     - Add logging to show captured secret for debugging
     - Validate webhook endpoint accepts requests with captured secret

3. **Race Condition: Tests Start Before Webhook Forwarding Ready**: <description>
   - **Likelihood**: low (added explicit wait in global setup)
   - **Impact**: medium (tests fail intermittently)
   - **Mitigation**:
     - Implement explicit health check in global setup
     - Retry webhook forwarding readiness check with timeout
     - Log readiness status clearly

4. **Port 3001 Conflicts or Unavailable**: <description>
   - **Likelihood**: low (ports isolated in Docker compose)
   - **Impact**: medium (webhook forwarding fails)
   - **Mitigation**:
     - Verify port 3001 is available before starting test containers
     - Use error message to guide user to kill conflicting processes
     - Allow configurable port via environment variable

**Rollback Plan**:

If this fix causes issues in production or CI:

1. Disable webhook forwarding temporarily: Comment out `stripe listen` from docker-compose
2. Revert to old billing test (skip webhook verification) temporarily
3. Investigate root cause (missing Stripe CLI, credential issues, etc.)
4. Restore once root cause is fixed

**Monitoring** (if needed):

- Monitor webhook delivery latency: Should be <1s in tests
- Alert if webhook events fail to forward
- Track webhook secret refresh frequency (if using dynamic secrets)

## Performance Impact

**Expected Impact**: minimal

The addition of `stripe listen` adds:
- ~2-3 seconds to test startup (webhook forwarding initialization)
- Negligible runtime overhead (event forwarding happens in parallel)
- No database performance impact
- No API response time impact

Total impact: E2E test suite startup time increases by ~2-3 seconds, execution time unchanged.

## Security Considerations

**Security Impact**: low

The Stripe webhook secret is sensitive and should be handled carefully:

- ✅ Secret is auto-generated by `stripe listen` (unique per run)
- ✅ Secret only used in test environment (not production)
- ✅ Secret rotated with each test run (not persisted)
- ✅ Webhook signature validation remains in place (prevents unauthorized events)

**Security requirements**:
- Ensure test containers cannot access production Stripe credentials
- Use separate test API keys for E2E tests
- Verify webhook handler validates signatures even in test environment
- Never log or expose webhook secrets in output

**Security checklist**:
- [ ] Test Stripe credentials are different from production
- [ ] Webhook endpoint validates signature before processing
- [ ] No secrets are logged in test output
- [ ] CI environment has Stripe test credentials only (not production)

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start test environment without stripe listen
docker-compose -f docker-compose.test.yml up -d

# Run billing test (should fail at subscription status check)
cd apps/e2e && pnpm test -- --grep "user-billing"
```

**Expected Result**: Test fails with timeout waiting for "Active" subscription status (webhook never arrived)

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Start test environment (now includes stripe listen)
docker-compose -f docker-compose.test.yml up -d

# Wait for startup to complete
sleep 5

# Verify webhook forwarding is ready
curl -X POST http://localhost:3001/api/billing/webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: test" \
  -d '{"type":"test.event"}'

# Run billing test (should now pass)
cd apps/e2e && pnpm test -- --grep "user-billing"

# Verify subscription was created/updated via webhook
docker-compose -f docker-compose.test.yml exec slideheroes-app-test \
  curl -X GET http://localhost:3001/api/user/billing
```

**Expected Result**: All commands succeed, billing test passes, subscription status shows "Active"

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test:e2e

# Verify Stripe-related functionality still works
cd apps/e2e && pnpm test -- --grep "billing|payment|subscription"

# Check webhook handler error handling
cd apps/web && pnpm test -- webhook
```

## Dependencies

### New Dependencies (if any)

**No new npm dependencies required** - Uses existing `@stripe/cli` (or installs globally via `npm install -g @stripe/cli`)

System requirement:
- `stripe` CLI must be installed: `npm install -g @stripe/cli` or `apt-get install stripe-cli`
- Stripe account with test API keys configured

**Installation on CI**:
```bash
# For Docker images
RUN npm install -g @stripe/cli

# For CI agents
- name: Install Stripe CLI
  run: npm install -g @stripe/cli
```

OR

**No new dependencies required**

## Database Changes

**Migration needed**: no

No database schema changes required. Webhook handler already exists and processes subscription events correctly. This fix only ensures webhook events are delivered to the test environment.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- This is a test infrastructure change, not a production code change
- No backend or frontend code changes affect production
- Safe to deploy independently (no blocking changes)

**Feature flags needed**: no

**Backwards compatibility**: maintained

The webhook handler is already production-ready. This fix only adds webhook forwarding to the test environment. Existing production webhook behavior remains unchanged.

## Success Criteria

The fix is complete when:
- [ ] `stripe listen` webhook forwarding starts automatically with test containers
- [ ] Webhook secret is captured and injected into test environment
- [ ] Billing E2E test passes (subscription status updates after checkout)
- [ ] No new errors in webhook handler logs
- [ ] Manual testing confirms subscription status shows as "Active" after checkout
- [ ] Full E2E test suite passes without regressions
- [ ] Stripe CLI is available in CI environment
- [ ] Documentation updated with setup instructions

## Notes

### Implementation Approach Decision

Two main approaches to implement webhook forwarding:

1. **Separate Docker Service** (Recommended)
   - Add `stripe-webhook` service to `docker-compose.test.yml`
   - Cleaner separation of concerns
   - Easier to monitor and troubleshoot
   - Can restart independently if needed

2. **Add to Web Container Startup**
   - Simpler compose file (fewer services)
   - Single container health check
   - Tightly coupled with app startup
   - Less flexibility but less complexity

**Recommendation**: Use Option 1 (separate service) for maintainability and clarity.

### Stripe CLI Process Management

The Stripe CLI must run continuously to forward events. Options:

1. **Direct process in Docker** (`stripe listen ...` as entry point)
2. **Supervisor/systemd** to manage process
3. **Custom shell script** to handle startup and logging

**Recommendation**: Use Docker CMD/ENTRYPOINT directly (simplest for containerized approach).

### Webhook Event Validation

The webhook handler (`/api/billing/webhook`) must:
- Validate Stripe signature using `STRIPE_WEBHOOK_SECRET`
- Handle events idempotently (same event twice = same result)
- Process specific events (`checkout.session.completed`, `customer.subscription.created`, etc.)

Existing implementation should already do this. Verify during testing.

### Testing with Real Stripe Events

For highest confidence, test with actual Stripe events in test environment:
1. Start webhook forwarding locally
2. Trigger test events in Stripe Dashboard
3. Verify endpoint receives events correctly
4. Check database updates are correct

This was likely how #880 verified Stripe credentials worked.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #885*
