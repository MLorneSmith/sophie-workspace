# Bug Fix: Stripe Checkout Session Creation Fails - Missing Server-Side Credentials

**Related Diagnosis**: #869
**Severity**: high
**Bug Type**: integration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Missing or invalid Stripe server-side environment variables (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) in the E2E test environment, causing `StripeServerEnvSchema` validation to fail
- **Fix Approach**: Configure test environment with valid Stripe test credentials before running E2E tests
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The User Billing E2E test (`shard 9`) fails when navigating to `/home/billing` and attempting to create a Stripe checkout session. The server-side checkout session creation fails because the Stripe SDK cannot initialize - the `StripeServerEnvSchema` validation rejects missing or invalid credentials. The test displays "Error requesting checkout. Please try again later." and times out waiting for the Stripe Embedded Checkout iframe to load.

**Sequence of failure**:
1. Test navigates to `/home/billing` and selects a plan
2. User clicks "Proceed to Payment" → triggers `createPersonalAccountCheckoutSession` server action
3. Server action calls `createStripeClient()` which validates env vars via `StripeServerEnvSchema`
4. Schema validation fails (credentials missing/invalid)
5. Error is caught and displayed as user-friendly message
6. Stripe iframe never loads
7. Test times out waiting for iframe element

For full details, see diagnosis issue #869.

### Solution Approaches Considered

#### Option 1: Configure E2E Test Environment with Stripe Credentials ⭐ RECOMMENDED

**Description**: Add valid Stripe test mode credentials to the test environment configuration (`.env.test` or test setup) before running E2E tests. This ensures the server action can successfully initialize the Stripe SDK and create checkout sessions.

**Pros**:
- Simple and straightforward - just environment variable configuration
- No code changes required
- Follows standard testing practices (environment-specific config)
- Minimal risk - test credentials expire/rotate naturally
- Aligns with existing Stripe setup (#873 just refreshed the keys)
- Enables full end-to-end integration testing

**Cons**:
- Test environment must be maintained with fresh credentials
- Requires coordination with Stripe account access
- Credentials need periodic refresh (Stripe keys expire after 90 days)

**Risk Assessment**: low - This is standard credential management for integration testing. No code changes, no database changes.

**Complexity**: simple - Just environment variable configuration

#### Option 2: Mock Stripe SDK in E2E Tests

**Description**: Mock the Stripe SDK to bypass the need for real credentials, returning fake checkout sessions for testing the UI flow without hitting the actual Stripe API.

**Pros**:
- No credential management needed
- Faster test execution (no network calls to Stripe)
- Tests are isolated from Stripe API changes
- Works offline

**Cons**:
- Doesn't test the actual Stripe integration (the real bug)
- May miss integration issues with Stripe
- Mock setup adds complexity to test infrastructure
- Doesn't provide confidence that billing actually works
- Mocks drift from reality (Stripe API changes break real code but pass mock tests)

**Why Not Chosen**: This is a billing feature - we MUST test real Stripe integration to ensure customers can actually pay. Mocking defeats the purpose of E2E testing for critical user journeys. The real issue is missing credentials, not a code bug.

#### Option 3: Implement Fallback/Conditional Checkout Logic

**Description**: Modify the `createPersonalAccountCheckoutSession` server action to detect missing credentials and display a maintenance message or use a placeholder checkout.

**Pros**:
- App doesn't error when credentials are missing
- Could enable partial testing

**Cons**:
- Adds complexity to production code for a test/environment issue
- Hides the real problem (missing credentials)
- Doesn't enable actual billing testing
- Violates principle: don't add code to hide environment misconfigurations
- Test should fail loudly when prerequisites aren't met

**Why Not Chosen**: This would mask the real issue. The problem isn't the code - it's the environment setup. We should fix the environment, not the code.

### Selected Solution: Configure E2E Test Environment with Stripe Credentials

**Justification**: This is the cleanest, most maintainable solution. The root cause is environment misconfiguration (missing credentials), not a code bug. E2E tests must have valid integration credentials to test real integrations. This approach:
- Requires no code changes
- Treats the symptom (missing credentials) correctly (as an environment issue)
- Enables true end-to-end testing of the billing flow
- Aligns with how Stripe test credentials are already managed in development
- Is the standard practice for integration testing

**Technical Approach**:
- Stripe test credentials are already configured in `.env.local` for development (from #873)
- E2E tests need access to the same credentials
- Configure test environment to load these credentials when running tests
- Verify the Stripe client initializes successfully

**Architecture Changes** (if any):
- None - this is pure configuration, no code changes

**Migration Strategy** (if needed):
- Update test environment setup to load Stripe credentials
- No data migration needed

## Implementation Plan

### Affected Files

Files that need **verification** (no changes to these files):
- `packages/billing/stripe/src/schema/stripe-server-env.schema.ts` - Defines validation schema (confirms it requires `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`)
- `packages/billing/stripe/src/services/stripe-sdk.ts` - Stripe SDK initialization (confirms it validates env vars)
- `apps/web/app/home/(user)/billing/_lib/server/user-billing.service.ts` - Checkout session creation (confirms it calls Stripe SDK)
- `apps/e2e/tests/user-billing/user-billing.spec.ts` - The test itself

Files that **may need configuration updates**:
- `apps/e2e/.env.local` or test setup file - Where test environment variables are configured
- `apps/web/.env.test` or test configuration - Alternative location for test-specific config

### New Files

No new files required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Verify Stripe Credentials Are Available in Development

Verify that `.env.local` in `apps/web/` contains valid Stripe test credentials (should already exist from #873):

- Run `grep -E "^(STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET)=" apps/web/.env.local`
- Confirm output shows both variables with non-empty values
- Confirm values start with `sk_test_` (secret key) and `whsec_` (webhook secret)
- Note the values for use in test environment setup

**Why this step first**: We need to verify the credentials exist before configuring the test environment to use them.

#### Step 2: Configure E2E Test Environment with Stripe Credentials

E2E tests run in `apps/e2e/` directory. Configure the test environment to have access to Stripe credentials:

**Option A: Via `.env.local` in apps/e2e/**
- Copy/create `apps/e2e/.env.local`
- Add the three Stripe environment variables (same values from `apps/web/.env.local`):
  ```bash
  STRIPE_SECRET_KEY=<value from apps/web/.env.local>
  STRIPE_WEBHOOK_SECRET=<value from apps/web/.env.local>
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<value from apps/web/.env.local>
  ```
- Ensure `.env.local` is in `.gitignore` (should already be)

**Option B: Via test setup configuration**
- Update `apps/e2e/playwright.config.ts` or global test setup to load env vars from `apps/web/.env.local`
- Or update GitHub Actions CI configuration to pass Stripe secrets as environment variables

**Choose Option A** (simpler, follows standard pattern of each app having its own `.env.local`)

**Why this step second**: The test environment needs the credentials to initialize the Stripe SDK successfully.

#### Step 3: Verify Test Environment Configuration

- Run a quick check that the test environment can load the Stripe credentials:
  ```bash
  cd apps/e2e
  node -e "console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET')"
  ```
- Output should show `STRIPE_SECRET_KEY: SET`
- Repeat for `STRIPE_WEBHOOK_SECRET` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

#### Step 4: Run the Failing E2E Test

Run the specific failing test to verify the fix:

```bash
pnpm --filter web-e2e test tests/user-billing/user-billing.spec.ts
```

**Expected behavior**:
- Test navigates to `/home/billing` successfully
- Stripe client initializes without errors (no "Error requesting checkout" message)
- Stripe Embedded Checkout iframe loads
- Test proceeds to select plan and proceed to payment
- Checkout session is created successfully

**If test still fails**:
- Check server logs for actual error message
- Verify credentials are valid (not expired)
- Verify credentials format is correct (sk_test_, whsec_ prefixes)
- See Troubleshooting section below

#### Step 5: Run Full Billing Test Suite

Run all billing-related E2E tests to ensure no regressions:

```bash
pnpm --filter web-e2e test tests/user-billing/
```

**Expected result**: All billing tests pass

#### Step 6: Run Full E2E Test Suite

Run the complete E2E test suite to ensure no regressions in other areas:

```bash
pnpm --filter web-e2e test
```

**Expected result**: All E2E tests pass (or same pass rate as before)

#### Step 7: Validation

Execute validation commands (see Validation Commands section below)

## Testing Strategy

### Unit Tests

No unit tests needed for this fix - it's an environment configuration change, not code changes.

### Integration Tests

The existing E2E tests ARE the integration tests for this fix:

**Test files**:
- `apps/e2e/tests/user-billing/user-billing.spec.ts` - Tests the complete billing flow with real Stripe integration
  - ✅ Test: User can navigate to billing page
  - ✅ Test: User can select a plan
  - ✅ Test: User can initiate checkout
  - ✅ Test: Stripe Embedded Checkout iframe loads
  - ✅ Regression test: Original bug (timeout waiting for iframe) should not reoccur

### E2E Tests

The failing test (`user-billing.spec.ts:6`) is the primary E2E test for this bug fix:

```typescript
test('user can subscribe to a plan', async ({ page, context }) => {
  // Navigate to billing page
  await page.goto('/home/billing');

  // Select a plan and click proceed to payment
  // Stripe iframe should load successfully (not timeout)

  // With credentials configured:
  // - Server action creates checkout session successfully
  // - Stripe Embedded Checkout iframe loads
  // - Test continues without timing out
});
```

### Manual Testing Checklist

Execute these manual tests in development:

- [ ] Verify `apps/web/.env.local` has valid Stripe test credentials from #873
- [ ] Verify `apps/e2e/.env.local` has the same Stripe test credentials
- [ ] Start dev server: `pnpm dev`
- [ ] Navigate to `/home/billing` manually in browser
- [ ] Select a plan and click "Proceed to Payment"
- [ ] Verify Stripe Embedded Checkout iframe loads (no error message)
- [ ] Verify browser console has no Stripe-related errors
- [ ] Verify server logs show successful checkout session creation

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Credentials expire (90 days)**: Stripe test credentials expire periodically
   - **Likelihood**: high (will happen every 90 days)
   - **Impact**: low (tests will fail with clear error, easy to refresh)
   - **Mitigation**: Document credential refresh process, add calendar reminder, consider automating refresh or using persistent test keys if available

2. **Credentials accidentally committed to git**: `.env.local` files may be accidentally committed
   - **Likelihood**: low (gitignore is in place)
   - **Impact**: medium (test credentials would be exposed, though less sensitive than live keys)
   - **Mitigation**: Verify `.env.local` is in `.gitignore`, use `git pre-commit` hooks to prevent

3. **Test environment diverges from production**: Different credentials or configuration in test vs production
   - **Likelihood**: low (using same credential format/sources)
   - **Impact**: low (test would still validate the real integration works)
   - **Mitigation**: Use same Stripe account for test and dev, document credential sources

**Rollback Plan**:

If this fix causes issues:
1. Remove the Stripe credentials from `apps/e2e/.env.local`
2. Revert any configuration changes
3. Tests will fail with same error as before (expected behavior)
4. No production impact (this only affects local E2E tests)

**Monitoring** (if needed):
- Monitor test pass rate for `user-billing.spec.ts` test
- Alert if billing E2E tests start failing (likely indicates credential expiration)
- Set calendar reminder to refresh Stripe credentials every 90 days

## Performance Impact

**Expected Impact**: none

This is configuration only - no code changes that would affect performance.

## Security Considerations

**Security Impact**: low

**Considerations**:
- Stripe test credentials are low-risk (limited to test/sandbox transactions)
- Credentials should still be protected (not committed to git, not logged)
- `.env.local` files are in `.gitignore` (verified in Step 2)
- Test credentials automatically rotate/expire every 90 days
- No security review needed for environment configuration

**Security Checklist**:
- ✅ `.env.local` is in `.gitignore`
- ✅ Only test mode credentials (not live) will be used
- ✅ No code changes that could introduce vulnerabilities
- ✅ No database changes

## Validation Commands

### Before Fix (Bug Should Reproduce)

First, verify the bug exists without the fix:

```bash
# Without Stripe credentials in E2E environment:
# Run the test and it should fail with timeout
pnpm --filter web-e2e test tests/user-billing/user-billing.spec.ts
```

**Expected Result**: Test fails with timeout waiting for `[name="embedded-checkout"]` element

### After Fix (Bug Should Be Resolved)

```bash
# After configuring Stripe credentials in E2E environment:

# 1. Type check to ensure no type errors
pnpm typecheck

# 2. Lint to ensure no linting issues
pnpm lint

# 3. Format check
pnpm format

# 4. Run the specific failing test
pnpm --filter web-e2e test tests/user-billing/user-billing.spec.ts

# 5. Run all billing E2E tests
pnpm --filter web-e2e test tests/user-billing/

# 6. Run full E2E test suite
pnpm --filter web-e2e test

# 7. Manual verification - start dev server and test manually
pnpm dev
# Then navigate to http://localhost:3000/home/billing and test the flow
```

**Expected Result**:
- All commands succeed
- Specific test no longer times out
- Stripe iframe loads and checkout session is created
- Zero regressions in other tests

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Additional regression checks - verify no Stripe-related console errors
pnpm --filter web-e2e test --grep "billing"
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

This fix uses existing Stripe SDK and test infrastructure.

### Environment Variables Used

**Required**:
- `STRIPE_SECRET_KEY` - Server-side API key for Stripe operations
- `STRIPE_WEBHOOK_SECRET` - Webhook signature verification secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Public key for client-side Stripe.js

**Source**: Should be copied from `apps/web/.env.local` (populated by #873 - Stripe CLI key refresh)

## Database Changes

**No database changes required**

This is purely an environment configuration fix - no schema changes, no data migrations.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- No code changes to deploy
- Only affects local development E2E tests
- CI/CD may need Stripe credentials configured as secrets (GitHub Actions)
- Production does not need changes

**Feature flags needed**: no

**Backwards compatibility**: maintained (no breaking changes)

## Success Criteria

The fix is complete when:
- [ ] `apps/e2e/.env.local` contains valid Stripe test credentials
- [ ] `pnpm --filter web-e2e test tests/user-billing/user-billing.spec.ts` passes
- [ ] Stripe Embedded Checkout iframe loads without timeout
- [ ] No "Error requesting checkout" error messages in test output
- [ ] Full billing E2E test suite passes
- [ ] No regressions in other E2E tests
- [ ] Manual testing confirms billing flow works end-to-end

## Notes

### Related Issues
- #873 - Chore: Refresh Expired Stripe CLI Keys - Just completed, provides fresh test credentials
- #654 (CLOSED) - Previous diagnosis of similar symptom (iframe timeout) - CI-focused
- #655 (CLOSED) - CI secrets fix - May not have addressed local test environment

### Troubleshooting

**If test still fails after fix**:

1. **Verify credentials are set in test environment**:
   ```bash
   cd apps/e2e
   cat .env.local | grep STRIPE
   ```
   Should output all three Stripe variables with non-empty values

2. **Verify credentials format**:
   - `STRIPE_SECRET_KEY` should start with `sk_test_`
   - `STRIPE_WEBHOOK_SECRET` should start with `whsec_`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` should start with `pk_test_`

3. **Check credential expiration**:
   ```bash
   stripe config --list
   ```
   Look for `test_mode_key_expires_at` - if in the past, refresh with `stripe login`

4. **Verify test environment loads env vars**:
   - Check if `apps/e2e` has `.env.local` file
   - Verify it's not in `.gitignore` (it should be)
   - If using CI, verify GitHub Actions has secrets configured

5. **Check server logs**:
   - Run dev server: `pnpm dev`
   - Check terminal output for actual error from Stripe SDK validation
   - Look for error message from `StripeServerEnvSchema` validation

### Key Files for Reference
- `packages/billing/stripe/src/schema/stripe-server-env.schema.ts` - Validation schema
- `packages/billing/stripe/src/services/stripe-sdk.ts` - Stripe SDK initialization
- `apps/e2e/tests/user-billing/user-billing.spec.ts` - Failing test
- `apps/e2e/playwright.config.ts` - E2E test configuration

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #869*
