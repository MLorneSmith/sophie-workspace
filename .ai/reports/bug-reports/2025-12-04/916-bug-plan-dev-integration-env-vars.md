# Bug Fix: Dev Integration Tests Failing - Missing NODE_ENV and STRIPE_WEBHOOK_SECRET

**Related Diagnosis**: #915 (REQUIRED)
**Severity**: high
**Bug Type**: integration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: The `dev-integration-tests.yml` workflow is missing two required environment variables: `NODE_ENV=test` and `STRIPE_WEBHOOK_SECRET`
- **Fix Approach**: Add `NODE_ENV: test` to the workflow and disable billing tests in dev integration tests (recommended) OR add Stripe webhook secret to GitHub secrets
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The `dev-integration-tests.yml` workflow fails during the "Run integration test suite" step because the E2E global setup pre-flight validation rejects the test run. The validation code requires:

1. `NODE_ENV` to be set to 'test' (security measure to prevent accidental production database access)
2. `STRIPE_WEBHOOK_SECRET` when `ENABLE_BILLING_TESTS=true` (required to validate webhook signatures)

The workflow sets `ENABLE_BILLING_TESTS: true` but provides neither `NODE_ENV` nor `STRIPE_WEBHOOK_SECRET`, causing validation failures at `apps/e2e/tests/utils/e2e-validation.ts:78-94` and `196-238`.

For full details, see diagnosis issue #915.

### Solution Approaches Considered

#### Option 1: Add NODE_ENV to workflow + Disable billing tests ⭐ RECOMMENDED

**Description**:
- Add `NODE_ENV: test` to the environment variables in the "Run integration test suite" step
- Set `ENABLE_BILLING_TESTS: false` to skip billing test validation (since dev integration tests run against a deployed environment that cannot receive live Stripe webhook events)

**Pros**:
- Simple, single-line environment variable addition fixes NODE_ENV validation
- Aligns with best practice: dev integration tests should focus on user flows, not webhook processing
- Stripe webhooks require dashboard configuration and live endpoint listening that dev deployment cannot provide
- No additional GitHub secrets required
- Low risk - billing tests are better validated in staging/production
- Clears the path for all other integration tests to run

**Cons**:
- Loses webhook testing in dev integration flow (mitigated: webhook validation happens in staging/production)
- Requires workflow file modification

**Risk Assessment**: low - Changes are minimal and non-breaking. Webhook testing naturally belongs in staging/production where live Stripe can send events.

**Complexity**: simple - Single workflow modification

#### Option 2: Add NODE_ENV + Add Stripe Webhook Secret to GitHub Secrets

**Description**:
- Add `NODE_ENV: test` to workflow
- Create a Stripe webhook signing secret in GitHub secrets
- Reference it in the workflow: `STRIPE_WEBHOOK_SECRET: ${{ secrets.STRIPE_WEBHOOK_SECRET }}`

**Pros**:
- Enables billing test validation in dev integration tests
- Complete test coverage across all environments
- Preserves existing workflow design

**Cons**:
- Requires managing additional GitHub secrets
- Stripe webhook validation in dev environment is problematic: dev deployment cannot receive live Stripe webhook events from their servers
- Dev integration tests run against deployed environment, not local Stripe instance
- Adds unnecessary complexity when staging/production already validate webhooks
- Risk: false sense of security if webhook signature validation passes with test secret but would fail with production webhook payloads

**Why Not Chosen**: Adds complexity without real benefit. Dev integration tests are meant to validate deployed environment, not webhook processing. Webhook testing is better suited for staging/production where live Stripe can send events.

#### Option 3: Add NODE_ENV only, keep ENABLE_BILLING_TESTS: true with conditional validation

**Description**:
- Add `NODE_ENV: test` to workflow
- Modify validation code to gracefully handle missing `STRIPE_WEBHOOK_SECRET` in CI environments
- Keep billing tests "enabled" but skip webhook secret validation in CI

**Cons**:
- Adds code complexity with environment-specific branching
- Does not solve the real problem: dev deployment cannot meaningfully test Stripe webhooks
- Makes validation code harder to maintain

**Why Not Chosen**: Adds technical debt. Better to disable billing tests in dev integration and keep validation code clean.

### Selected Solution: Add NODE_ENV + Disable Billing Tests in Dev Integration Workflow

**Justification**: This approach is the cleanest, lowest-risk solution:

1. **NODE_ENV fix addresses security requirement** - Tests need this to prevent accidental production database access
2. **Disabling billing tests is architecturally correct** - Dev integration tests run against deployed environment which cannot receive live Stripe webhook events. Billing validation belongs in staging/production.
3. **Minimal changes** - Only two environment variable changes in the workflow
4. **Zero technical debt** - No validation code changes needed
5. **Preserves existing validation logic** - Keeps robust security checks in place for other test environments

**Technical Approach**:
- Add `NODE_ENV: test` to the workflow environment block (line 437-463)
- Change `ENABLE_BILLING_TESTS: true` to `ENABLE_BILLING_TESTS: false`
- Update workflow comments to explain why billing tests are disabled in dev integration
- Billing tests will still run in staging/production where webhooks can be properly validated

**Architecture Changes**: None - validation code remains unchanged and correct.

**Migration Strategy**: Not needed - this is a workflow configuration fix, not a code migration.

## Implementation Plan

### Affected Files

List files that need modification:
- `.github/workflows/dev-integration-tests.yml` - Add `NODE_ENV: test` and change `ENABLE_BILLING_TESTS: false`

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add NODE_ENV environment variable

Modify `.github/workflows/dev-integration-tests.yml` at the "Run integration test suite" step (around line 436):

Add `NODE_ENV: test` to the environment variables section to prevent accidental production database access.

- Edit the workflow file
- Add `NODE_ENV: test` after line 437
- Ensure proper indentation (must align with other env vars)

**Why this step first**: NODE_ENV is required by validation logic; it must be set before any tests run.

#### Step 2: Disable billing tests in dev integration workflow

Modify `.github/workflows/dev-integration-tests.yml` at line 446:

Change `ENABLE_BILLING_TESTS: true` to `ENABLE_BILLING_TESTS: false`

Add explanatory comment explaining why:
```yaml
# Billing tests disabled in dev integration: dev deployment cannot receive live Stripe webhooks
# Webhook testing is validated in staging/production where events can be properly processed
```

**Why this step**: Aligns workflow with architectural reality. Dev integration tests cannot meaningfully validate Stripe webhooks against a deployed environment.

#### Step 3: Add/update tests (N/A)

No test changes needed - validation logic already handles `ENABLE_BILLING_TESTS=false`.

#### Step 4: Documentation updates

Update workflow file comments to clarify:
- Why NODE_ENV is required
- Why billing tests are disabled in dev integration
- Where billing tests are validated (staging/production)

Add comments at line ~446:
```yaml
# NOTE: Billing tests disabled in dev integration tests.
# Dev deployment cannot receive live Stripe webhook events.
# Webhook signature validation happens in staging and production deployments.
# All other integration tests (auth, team accounts, etc.) run normally.
```

#### Step 5: Validation

- Run the workflow manually or trigger with a commit to dev branch
- Verify the "Run integration test suite" step completes pre-flight validation
- Confirm all integration tests execute (except billing-specific tests)
- Verify no new validation errors appear in logs

## Testing Strategy

### Unit Tests

No unit tests needed for workflow configuration changes.

### Integration Tests

The fix enables existing integration tests to run:

**Test validation**:
- ✅ NODE_ENV validation passes (value = 'test')
- ✅ Payload CLI path validation passes
- ✅ Supabase connection validation passes
- ✅ Stripe webhook secret validation passes (disabled tests = success)
- ✅ Stripe webhook endpoint validation passes (disabled tests = success)
- ✅ All non-billing integration tests execute successfully
- ✅ Regression test: Original validation errors should not reoccur

**Test files affected**:
- `apps/e2e/global-setup.ts` - Will complete successfully with new env vars
- `apps/e2e/tests/utils/e2e-validation.ts` - Validation logic already handles this scenario

### E2E Tests

Existing E2E integration tests will now run successfully:
- Authentication tests
- Team account tests
- General integration tests
- Dashboard and core user flows

**Test files**:
- `apps/e2e/tests/**/*.spec.ts` - All non-billing tests will execute

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Manually trigger the dev-integration-tests workflow via GitHub Actions
- [ ] Verify workflow reaches "Run integration test suite" step without errors
- [ ] Confirm pre-flight validation completes successfully (no NODE_ENV error, no STRIPE_WEBHOOK_SECRET error)
- [ ] Verify integration tests begin executing (not just validation)
- [ ] Check workflow logs for "ENABLE_BILLING_TESTS: false" confirmation
- [ ] Verify non-billing integration tests pass
- [ ] Confirm no new errors appear that weren't present before
- [ ] Test a second time to ensure consistency

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Breaking billing test discovery in dev integration**:
   - **Likelihood**: low
   - **Impact**: low (acceptable - billing tests belong in staging/production)
   - **Mitigation**: Staging and production workflows keep `ENABLE_BILLING_TESTS: true` to ensure webhook tests still run where appropriate

2. **Incomplete environment variable configuration**:
   - **Likelihood**: low
   - **Impact**: medium (tests would still fail)
   - **Mitigation**: Follow the implementation steps exactly; verify NODE_ENV is added before workflow execution

3. **Workflow syntax errors**:
   - **Likelihood**: low
   - **Impact**: medium (workflow won't run)
   - **Mitigation**: Use YAML editor with validation; compare with existing environment blocks to ensure proper indentation

**Rollback Plan**:

If this fix causes issues:
1. Revert the workflow file to previous version: `git revert <commit-sha>`
2. Push to dev branch to trigger new workflow run
3. Investigate any remaining validation errors
4. Re-open issue #915 with updated findings

**Monitoring** (if needed):
- Monitor dev-integration-tests workflow runs for the next 5 runs
- Watch for any new validation errors in logs
- Verify billing tests still run in staging (lines 62-73 of CI/CD documentation)

## Performance Impact

**Expected Impact**: none

No performance implications - changes are environment variable configuration only. Test execution timing should be identical or slightly faster (fewer tests if billing tests were previously blocking).

## Security Considerations

**Security Impact**: low (positive improvement)

Setting `NODE_ENV=test` is a security best practice:
- Prevents accidental production database access if tests fail
- Matches Node.js convention for test environments
- Already enforced by validation logic as a safety measure

No security audit needed - this fix improves existing security posture.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# View current workflow environment variables
grep -A 30 "Run integration test suite" .github/workflows/dev-integration-tests.yml

# Expected: NODE_ENV is not set, ENABLE_BILLING_TESTS: true is present
```

**Expected Result**: NODE_ENV line does not exist; ENABLE_BILLING_TESTS shows true

### After Fix (Bug Should Be Resolved)

```bash
# Verify workflow configuration
grep -A 30 "Run integration test suite" .github/workflows/dev-integration-tests.yml

# Manually trigger workflow
gh workflow run dev-integration-tests.yml --ref dev

# Monitor workflow execution
gh run list --workflow dev-integration-tests.yml --limit 1 --json status,name

# Check for validation success
gh run view <run-id> --log | grep -E "NODE_ENV|Stripe|validation"
```

**Expected Result**:
- NODE_ENV: test is set in workflow
- ENABLE_BILLING_TESTS: false is set
- Workflow completes pre-flight validation successfully
- Integration tests begin executing
- No validation errors in logs

### Regression Prevention

```bash
# Ensure other workflows still have billing tests enabled
grep "ENABLE_BILLING_TESTS" .github/workflows/*.yml

# Expected: staging-deploy.yml and production-deploy.yml still have ENABLE_BILLING_TESTS: true
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

The fix only modifies workflow environment variables; no new packages or services are needed.

## Database Changes

**No database changes required**

This is a workflow configuration fix; no schema migrations or data migrations needed.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

This is a workflow configuration change that:
- Does not affect application code
- Does not require code deployment to production
- Can be merged and deployed independently
- Is safe to deploy at any time

**Feature flags needed**: no

**Backwards compatibility**: maintained

The fix maintains compatibility with all environments. Each workflow can independently control whether to enable billing tests:
- Dev integration tests: `ENABLE_BILLING_TESTS: false` (cannot process live webhooks)
- Staging tests: `ENABLE_BILLING_TESTS: true` (validates webhook processing)
- Production: `ENABLE_BILLING_TESTS: true` (validates webhook processing)

## Success Criteria

The fix is complete when:
- [ ] `NODE_ENV: test` is added to dev-integration-tests.yml environment section
- [ ] `ENABLE_BILLING_TESTS: false` is set in dev-integration-tests.yml
- [ ] Workflow syntax is valid (verified by GitHub)
- [ ] Pre-flight validation completes successfully
- [ ] Integration tests execute without environment validation errors
- [ ] No regression in staging/production workflows (they still have billing tests enabled)
- [ ] Workflow runs consistently (multiple runs all succeed at same point)

## Notes

**Related Workflow Files** (for reference):
- `.github/workflows/dev-integration-tests.yml` - The file being fixed (dev integration tests)
- `.github/workflows/staging-deploy.yml` - Should keep `ENABLE_BILLING_TESTS: true` for webhook validation
- `.github/workflows/production-deploy.yml` - Should keep `ENABLE_BILLING_TESTS: true` for webhook validation

**Why billing tests don't belong in dev integration**:
1. Dev deployment runs on Vercel, not locally with Stripe mocking
2. Cannot configure Stripe to send webhooks to ephemeral dev deployment
3. Staging/production have stable URLs where Stripe can send real events
4. False security: test secrets won't validate against production webhook payloads

**Validation Code Reference**:
- NODE_ENV validation: `apps/e2e/tests/utils/e2e-validation.ts:78-94`
- Stripe webhook validation: `apps/e2e/tests/utils/e2e-validation.ts:196-238`
- Pre-flight runner: `apps/e2e/global-setup.ts:119-132`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #915*
