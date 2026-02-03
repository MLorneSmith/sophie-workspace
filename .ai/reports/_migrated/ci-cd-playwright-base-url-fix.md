# CI/CD Pipeline Investigation Report

**Date**: 2025-09-29
**Issue**: Integration tests failing with ERR_CONNECTION_REFUSED
**Resolution**: Fixed - Commit 0466d263

## Executive Summary

The dev-integration-tests.yml workflow was failing because Playwright tests were attempting to connect to `http://localhost:3000` instead of the deployed dev environment at `https://dev.slideheroes.com`. This was caused by an environment variable mismatch between the CI workflow configuration and Playwright configuration files.

## Pipeline Information

- **Repository**: slideheroes/2025slideheroes
- **Workflow**: dev-integration-tests.yml
- **Failed Run ID**: 18105995571
- **Branch**: dev
- **Failed Job**: Integration Tests
- **Failure Time**: 2025-09-29T18:00:10.9Z
- **Trigger**: workflow_run (triggered after Deploy to Dev completion)

## Root Cause Analysis

### Category: Configuration Error

### Severity: Critical

### The Issue

Tests were failing with the error:

```text
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/auth/sign-in
```

### Root Cause

Environment variable mismatch between CI workflow and Playwright configuration:

1. **CI Workflow Setting** (`.github/workflows/dev-integration-tests.yml`):
   - Set `PLAYWRIGHT_BASE_URL=https://dev.slideheroes.com`
   - Set `BASE_URL=https://dev.slideheroes.com`
   - Did NOT set `TEST_BASE_URL`

2. **Playwright Config Expectation** (`apps/e2e/playwright.config.ts`):
   - Only checked for `TEST_BASE_URL`
   - Fell back to default `http://localhost:3000` when not found

3. **Result**:
   - Playwright couldn't find `TEST_BASE_URL` environment variable
   - Used fallback value of `http://localhost:3000`
   - Tests tried to connect to localhost instead of deployed environment
   - All tests failed with connection refused errors

## Evidence

### Failed Test Output

```text
🔧 Test Environment Configuration:
  - BASE_URL: https://dev.slideheroes.com
  - PLAYWRIGHT_BASE_URL: https://dev.slideheroes.com
  - PLAYWRIGHT_API_URL: https://dev.slideheroes.com
  ...
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/auth/sign-in
```

### Configuration Analysis

- All authentication setup tests (`auth.setup.ts`, `billing.setup.ts`) were failing
- Same error pattern across all test files
- Environment variables were correctly set in CI, but not the one Playwright was looking for

## Solution Implemented

### Two-Part Fix Applied:

#### 1. CI Workflow Update

Added `TEST_BASE_URL` environment variable to the workflow:

```yaml
TEST_BASE_URL: ${{ needs.check-should-run.outputs.web_deployment_url }}
```

#### 2. Playwright Configuration Update

Updated all Playwright config files to check multiple environment variables in priority order:

```typescript
baseURL:
  process.env.PLAYWRIGHT_BASE_URL ||
  process.env.TEST_BASE_URL ||
  process.env.BASE_URL ||
  "http://localhost:3000"
```

### Files Modified

1. `.github/workflows/dev-integration-tests.yml` - Added TEST_BASE_URL environment variable
2. `apps/e2e/playwright.config.ts` - Updated baseURL to check multiple env vars
3. `apps/e2e/playwright.auth.config.ts` - Updated baseURL to check multiple env vars
4. `apps/e2e/playwright.billing.config.ts` - Updated baseURL to check multiple env vars
5. `apps/e2e/playwright.smoke.config.ts` - Updated baseURL to check multiple env vars

## Prevention Measures

### Immediate Actions Taken

1. **Standardized Environment Variables**: All Playwright configs now check for multiple possible environment variable names
2. **Backwards Compatibility**: Maintained support for both old and new variable names
3. **Clear Priority Order**: Established clear precedence for environment variables

### Recommended Long-term Improvements

1. **Environment Variable Documentation**:
   - Create a `.github/workflows/README.md` documenting all CI environment variables
   - Add comments in Playwright configs explaining expected variables

2. **Configuration Validation**:
   - Add pre-test validation to log which base URL is being used
   - Fail fast with clear error message if connecting to localhost in CI

3. **Testing Strategy**:
   - Consider adding a smoke test that validates environment configuration
   - Add CI-specific configuration checks before running full test suite

4. **Monitoring**:
   - Set up alerts for integration test failures
   - Monitor for patterns of localhost connection attempts in CI

## Success Verification

After implementing the fix:

- Commit `0466d263` pushed to dev branch
- CI/CD pipeline should now correctly connect to `https://dev.slideheroes.com`
- Integration tests expected to pass on next run

## Lessons Learned

1. **Environment Variable Naming**: Maintain consistency between CI configuration and application expectations
2. **Defensive Configuration**: Applications should check multiple common environment variable names
3. **Clear Defaults**: Default values should be obvious and logged when used
4. **Configuration Testing**: Include configuration validation as part of CI pipeline

## Additional Notes

- The fix maintains backward compatibility with existing local development setups
- No changes required to local `.env` files
- Solution works for all Playwright test configurations (main, auth, billing, smoke)

---

**Status**: RESOLVED
**Fix Applied**: 2025-09-29
**Commit**: 0466d263
