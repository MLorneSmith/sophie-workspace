# Bug Diagnosis: E2E Sharded Workflow Missing Test User Credentials

**ID**: ISSUE-pending
**Created**: 2026-01-20T17:20:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The E2E sharded workflow fails on shards 2-12 because the workflow does not pass GitHub secrets for E2E test user credentials (`E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`, `E2E_OWNER_EMAIL`, `E2E_OWNER_PASSWORD`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`) to the test steps. Shard 1 (smoke tests) passes because it doesn't require authenticated users.

## Environment

- **Application Version**: dev branch, commit 230fd41fa
- **Environment**: CI (GitHub Actions)
- **Node Version**: 20.10.0
- **Workflow File**: `.github/workflows/e2e-sharded.yml`
- **Last Working**: Never worked (credentials were never added to this workflow)

## Reproduction Steps

1. Push code to trigger the `e2e-sharded.yml` workflow
2. Wait for workflow to start
3. Observe Shard 1 passes (smoke tests, no auth needed)
4. Observe Shards 2-12 fail with "E2E test user credential validation failed"

## Expected Behavior

All E2E shards should pass, with test users authenticated using the credentials stored in GitHub secrets.

## Actual Behavior

Shards 2-12 fail immediately during global setup with:
```
❌ CI Environment - E2E Credential Validation Failed
   Role: test user
   Reason: test user email is missing or empty
   Email: NOT SET
   Password: NOT SET
```

## Diagnostic Data

### Console Output
```
🔐 Authenticating test user via Supabase API...
❌ CI Environment - E2E Credential Validation Failed
   Role: test user
   Reason: test user email is missing or empty
   Email: NOT SET
   Password: NOT SET

🔧 Required GitHub Secrets:
   - E2E_TEST_USER_EMAIL and E2E_TEST_USER_PASSWORD
   - E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD
   - E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD

Error: E2E test user credential validation failed: test user email is missing or empty.
```

### Workflow Configuration Analysis

**e2e-sharded.yml (MISSING credentials):**
```yaml
env:
  SUPABASE_URL: 'http://127.0.0.1:54521'
  # ... other env vars
  # NO E2E_TEST_USER_* credentials!
```

**dev-integration-tests.yml (HAS credentials):**
```yaml
env:
  E2E_TEST_USER_EMAIL: ${{ secrets.E2E_TEST_USER_EMAIL }}
  E2E_TEST_USER_PASSWORD: ${{ secrets.E2E_TEST_USER_PASSWORD }}
  E2E_OWNER_EMAIL: ${{ secrets.E2E_OWNER_EMAIL }}
  E2E_OWNER_PASSWORD: ${{ secrets.E2E_OWNER_PASSWORD }}
  E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
  E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
```

## Error Stack Traces
```
Error: E2E test user credential validation failed: test user email is missing or empty. Check GitHub Secrets configuration.
    at Function.handleError (/apps/e2e/tests/utils/credential-validator.ts:148:9)
    at Function.validateAndGet (/apps/e2e/tests/utils/credential-validator.ts:191:24)
    at globalSetup (/apps/e2e/global-setup.ts:667:44)
```

## Related Code
- **Affected Files**:
  - `.github/workflows/e2e-sharded.yml` (missing env vars)
  - `apps/e2e/global-setup.ts` (validates credentials)
  - `apps/e2e/tests/utils/credential-validator.ts` (throws error when credentials missing)
- **Recent Changes**: None to credential handling in e2e-sharded.yml
- **Suspected Functions**: Workflow env configuration section

## Related Issues & Context

### Direct Predecessors
- #1631 (CLOSED): "Bug Diagnosis: E2E Sharded Workflow API Health Check Uses Unset SUPABASE_ANON_KEY" - Same workflow, different missing variables
- #1625 (CLOSED): "Bug Diagnosis: E2E Sharded Workflow Fails Due to Env Variable Naming Mismatch" - Related E2E env var issues

### Related Infrastructure Issues
- #1632 (CLOSED): "Bug Fix: E2E Sharded Workflow Supabase Health Check Variable Timing" - Just fixed timing for JWT keys
- #1626 (CLOSED): "Bug Fix: E2E Sharded Workflow Environment Variable Naming Mismatch" - Added E2E_ prefix vars
- #1621 (CLOSED): "Bug Fix: E2E Sharded Workflow JWT Secret Mismatch" - Fixed JWT extraction

### Same Component
- #1584 (CLOSED): "Bug Fix: E2E Sharded Tests WebServer Timeout"
- #1565 (CLOSED): "Bug Fix: E2E Sharded Build Fails - Missing PAYLOAD_SECRET"

### Historical Context
The e2e-sharded.yml workflow has had multiple issues with missing environment variables. Each fix addressed one category of variables but this one (user credentials) was never added.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The e2e-sharded.yml workflow does not pass E2E test user credentials from GitHub secrets to the job environment.

**Detailed Explanation**:
The `e2e-shards` job in `.github/workflows/e2e-sharded.yml` defines an `env` section (lines 153-184) that sets various environment variables needed for tests, but it does NOT include the E2E test user credentials:
- `E2E_TEST_USER_EMAIL`
- `E2E_TEST_USER_PASSWORD`
- `E2E_OWNER_EMAIL`
- `E2E_OWNER_PASSWORD`
- `E2E_ADMIN_EMAIL`
- `E2E_ADMIN_PASSWORD`

These credentials ARE defined in GitHub Secrets (confirmed by their use in `dev-integration-tests.yml`) but are not being passed to the sharded workflow.

When tests run, `global-setup.ts` calls `CredentialValidator.validateAndGet()` which checks for these environment variables. When they're missing, it throws an error with the "email is missing or empty" message.

**Supporting Evidence**:
- Workflow logs show `Email: NOT SET` and `Password: NOT SET`
- Stack trace points to `credential-validator.ts:148:9` (handleError) called from `validateAndGet`
- Comparison with `dev-integration-tests.yml` shows the credentials ARE passed there using `${{ secrets.E2E_TEST_USER_EMAIL }}` syntax
- Shard 1 (smoke tests) passes because `playwright.smoke.config.ts` doesn't use the same global setup requiring credentials

### How This Causes the Observed Behavior

1. Workflow starts and runs the `e2e-shards` job
2. Job sets env vars from its `env:` section (no credentials included)
3. Tests start and `global-setup.ts` is invoked
4. `global-setup.ts` calls `CredentialValidator.validateAndGet('test user')`
5. Validator checks `process.env.E2E_TEST_USER_EMAIL` - finds undefined
6. Validator throws error: "test user email is missing or empty"
7. Test run fails before any tests execute

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct evidence in logs ("NOT SET")
- Clear comparison showing the env vars work in another workflow
- The credentials exist in GitHub secrets (used by dev-integration-tests.yml)
- Stack trace directly points to credential validation code

## Fix Approach (High-Level)

Add the E2E test user credentials to the `e2e-shards` job's `env:` section in `.github/workflows/e2e-sharded.yml`:

```yaml
env:
  # ... existing env vars ...
  # E2E test user credentials (from GitHub Secrets)
  E2E_TEST_USER_EMAIL: ${{ secrets.E2E_TEST_USER_EMAIL }}
  E2E_TEST_USER_PASSWORD: ${{ secrets.E2E_TEST_USER_PASSWORD }}
  E2E_OWNER_EMAIL: ${{ secrets.E2E_OWNER_EMAIL }}
  E2E_OWNER_PASSWORD: ${{ secrets.E2E_OWNER_PASSWORD }}
  E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
  E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
```

## Diagnosis Determination

**Root cause confirmed**: The e2e-sharded.yml workflow is missing the E2E test user credential environment variables that are required by `global-setup.ts` for authenticating test users. This is a configuration omission, not a code bug.

**Why tests work locally**: Locally, these credentials are typically set via `.env` files or the user has them set in their shell environment. The CI workflow needs them explicitly passed from GitHub Secrets.

## Additional Context

This is the latest in a series of environment variable issues with the e2e-sharded workflow:
1. #1565: Missing PAYLOAD_SECRET
2. #1621: JWT secret mismatch
3. #1626: E2E_ prefix env vars needed
4. #1632: JWT key timing issue
5. **Current**: Missing test user credentials

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI (workflow logs, issue search), Grep, Read*
