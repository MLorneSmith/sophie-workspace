# Bug Diagnosis: Dev Integration Tests Failing Due to Missing Environment Variables

**ID**: ISSUE-915
**Created**: 2025-12-04T19:37:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The `dev-integration-tests.yml` workflow is failing in the "Run integration test suite" step because the E2E global setup pre-flight validation rejects the test run due to two missing environment variables: `NODE_ENV` (should be 'test') and `STRIPE_WEBHOOK_SECRET` (required when `ENABLE_BILLING_TESTS=true`).

## Environment

- **Application Version**: Current dev branch
- **Environment**: CI/GitHub Actions
- **Node Version**: lts/*
- **Database**: Supabase (production instance for dev deployment tests)
- **Last Working**: Intermittent failures since billing tests were added

## Reproduction Steps

1. Push a commit to trigger the dev-deploy workflow
2. Wait for the dev-integration-tests.yml workflow to trigger after successful deployment
3. Observe the "Run integration test suite" step fails with pre-flight validation errors

## Expected Behavior

Integration tests should run successfully against the deployed dev environment with all required environment variables properly configured.

## Actual Behavior

The tests fail immediately during global setup with the following error:
```
❌ Pre-flight validation failed. See details above.
```

With specific validation failures:
1. `NODE_ENV should be 'test' but is 'undefined'`
2. `STRIPE_WEBHOOK_SECRET not set. Required for billing E2E tests.`

## Diagnostic Data

### Console Output
```
🔧 Global Setup: Creating authenticated browser states via API...

🔍 Running E2E Environment Pre-flight Validations...

❌ NODE_ENV: NODE_ENV should be 'test' but is 'undefined'
✅ CLI Path: Payload CLI path configured: apps/payload/src/seed/seed-engine/index.ts
[supabase-config-loader] Failed to fetch config: spawnSync /bin/sh ENOENT. Using fallback values.
✅ Supabase: Supabase connection validated successfully
❌ Stripe Webhook Secret: STRIPE_WEBHOOK_SECRET not set. Required for billing E2E tests.
✅ Stripe Webhook Endpoint: Webhook endpoint accessible at https://2025slideheroes-78tzm55oq-slideheroes.vercel.app/api/billing/webhook

❌ Some validations failed

Failed validations:
  - NODE_ENV should be 'test' but is 'undefined'
    Details: {}
  - STRIPE_WEBHOOK_SECRET not set. Required for billing E2E tests.
    Details: {"hint":"Set STRIPE_WEBHOOK_SECRET in your environment or use the stripe-webhook Docker service"}

Error: ❌ Pre-flight validation failed. See details above.
```

### Network Analysis
N/A - Tests fail before any network requests are made

### Database Analysis
N/A - Supabase connection validation passes successfully

### Performance Metrics
N/A - Tests fail at startup

### Screenshots
N/A - Pre-flight validation failure

## Error Stack Traces
```
Error: ❌ Pre-flight validation failed. See details above.

   at globalSetup (/home/runner/_work/2025slideheroes/2025slideheroes/apps/e2e/global-setup.ts:129:9)
```

## Related Code
- **Affected Files**:
  - `.github/workflows/dev-integration-tests.yml:436-480` - Integration test step configuration
  - `apps/e2e/global-setup.ts:119-132` - Pre-flight validation check
  - `apps/e2e/tests/utils/e2e-validation.ts:77-94` - NODE_ENV validation
  - `apps/e2e/tests/utils/e2e-validation.ts:196-238` - Stripe webhook secret validation
- **Recent Changes**: No recent changes to the workflow or validation files
- **Suspected Functions**: `validateNodeEnvironment()`, `validateStripeWebhookSecret()`

## Related Issues & Context

### Similar Issues
- #576 (CLOSED): "CI/CD: Dev integration tests failing due to missing Supabase configuration" - Similar pattern of missing env vars
- #450 (CLOSED): "CI/CD Failure: Missing E2E Test Credentials in dev-integration-tests.yml" - Previous credential configuration issue

### Historical Context
This is a recurring pattern where new validation requirements are added to the E2E tests but the CI workflow isn't updated to provide the required environment variables.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `dev-integration-tests.yml` workflow is missing two required environment variables: `NODE_ENV=test` and `STRIPE_WEBHOOK_SECRET`.

**Detailed Explanation**:

1. **NODE_ENV Missing**: The workflow step "Run integration test suite" (lines 436-480) sets many environment variables but does NOT set `NODE_ENV=test`. The E2E validation code at `apps/e2e/tests/utils/e2e-validation.ts:77-94` requires `NODE_ENV` to equal 'test' to prevent accidental production database access.

2. **STRIPE_WEBHOOK_SECRET Missing**: The workflow sets `ENABLE_BILLING_TESTS: true` (line 446) but does not provide `STRIPE_WEBHOOK_SECRET`. The validation at `apps/e2e/tests/utils/e2e-validation.ts:196-238` requires this secret when billing tests are enabled. Looking at GitHub secrets, `STRIPE_WEBHOOK_SECRET` is NOT in the secrets list.

**Supporting Evidence**:
- Workflow log shows: `❌ NODE_ENV: NODE_ENV should be 'test' but is 'undefined'`
- Workflow log shows: `❌ Stripe Webhook Secret: STRIPE_WEBHOOK_SECRET not set. Required for billing E2E tests.`
- GitHub secrets list (via `gh secret list`) confirms `STRIPE_WEBHOOK_SECRET` is NOT configured
- The workflow file at `.github/workflows/dev-integration-tests.yml:436-480` confirms `NODE_ENV` is not set

### How This Causes the Observed Behavior

1. Workflow triggers after dev deployment
2. Integration test step starts with `pnpm --filter web-e2e test:integration`
3. Playwright loads `global-setup.ts` which calls `runPreflightValidations()`
4. `validateNodeEnvironment()` fails because `process.env.NODE_ENV` is undefined (not 'test')
5. `validateStripeWebhookSecret()` fails because `STRIPE_WEBHOOK_SECRET` is missing but `ENABLE_BILLING_TESTS=true`
6. `runPreflightValidations()` returns `allValid: false`
7. `globalSetup()` throws Error at line 129
8. Playwright exits with code 1

### Confidence Level

**Confidence**: High

**Reasoning**: The error messages in the logs directly match the validation code. The missing environment variables are clearly identified, and the validation logic is straightforward. Both missing values are confirmed: NODE_ENV is not set in the workflow env block, and STRIPE_WEBHOOK_SECRET is not in GitHub secrets.

## Fix Approach (High-Level)

Two changes are needed:

1. **Add NODE_ENV to workflow**: Add `NODE_ENV: test` to the environment variables in the "Run integration test suite" step (around line 464 in dev-integration-tests.yml)

2. **Either add STRIPE_WEBHOOK_SECRET or disable billing tests**:
   - Option A: Add a Stripe webhook secret to GitHub secrets and reference it in the workflow
   - Option B: Set `ENABLE_BILLING_TESTS: false` for the dev-integration-tests workflow since billing webhook functionality cannot be tested against a remote Vercel deployment without a live Stripe webhook listener

Option B is recommended because:
- Stripe webhooks require a listening endpoint that can receive events from Stripe
- The dev deployment has the webhook endpoint, but Stripe won't send events without a properly configured webhook in the Stripe dashboard pointing to the dev URL
- Integration tests against a deployed environment typically test user flows, not webhook processing

## Diagnosis Determination

The root cause is definitively identified: two missing environment variables prevent the E2E pre-flight validation from passing. The fix requires adding `NODE_ENV=test` to the workflow and either providing `STRIPE_WEBHOOK_SECRET` or disabling billing tests for this workflow.

## Additional Context

The pre-flight validation was likely added to prevent accidental tests against production databases, which is good practice. However, the dev-integration-tests workflow was not updated to meet these new requirements.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run view, gh run list, gh secret list, Read, Bash*
