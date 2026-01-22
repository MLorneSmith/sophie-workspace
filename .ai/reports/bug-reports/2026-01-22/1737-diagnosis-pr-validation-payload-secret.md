# Bug Diagnosis: PR Validation Workflow Fails - Missing PAYLOAD_SECRET

**ID**: ISSUE-pending
**Created**: 2026-01-22T17:25:00Z
**Reporter**: user/CI
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The PR Validation workflow fails on `bundle-size` and `accessibility-test` jobs because the `pnpm build` command triggers a Payload CMS build that requires the `PAYLOAD_SECRET` environment variable, which is not configured in these jobs. This blocks all Dependabot PRs and any PR that triggers TypeScript change detection.

## Environment

- **Application Version**: dev branch (bc5a9681e)
- **Environment**: CI (GitHub Actions)
- **Node Version**: 20
- **Workflow**: `.github/workflows/pr-validation.yml`
- **Last Working**: Unknown - issue may have existed since workflow creation

## Reproduction Steps

1. Open any PR that triggers TypeScript change detection (e.g., Dependabot PR #1728)
2. Wait for PR Validation workflow to run
3. Observe `bundle-size` and `accessibility-test` jobs fail
4. Check logs for `Error: PAYLOAD_SECRET environment variable is required`

## Expected Behavior

The `pnpm build` command should complete successfully, building all apps including Payload CMS.

## Actual Behavior

The build fails with error:
```
Error: PAYLOAD_SECRET environment variable is required
```

The `payload#build` task fails, causing the overall build to fail.

## Diagnostic Data

### Console Output
```
Error: PAYLOAD_SECRET environment variable is required
    at <unknown> (.next/server/chunks/387.js:1:20913)

> Build error occurred
Error: Failed to collect page data for /api/[...slug]
    at ignore-listed frames {
  type: 'Error'
}
 ELIFECYCLE  Command failed with exit code 1.
[ERROR] command finished with error: command (/home/runner/_work/2025slideheroes/2025slideheroes/apps/payload) /home/runner/setup-pnpm/node_modules/.bin/pnpm run build exited (1)

 Tasks:    4 successful, 6 total
Cached:    0 cached, 6 total
  Time:    1m10.671s
Failed:    payload#build
```

### Affected Workflow Jobs

| Job | Has PAYLOAD_SECRET | Runs pnpm build | Result |
|-----|-------------------|-----------------|--------|
| bundle-size | NO | YES | FAILURE |
| accessibility-test | NO | YES | FAILURE |
| typecheck | N/A | NO | SUCCESS |
| test-unit | N/A | NO | SUCCESS |

## Error Stack Traces
```
Error: PAYLOAD_SECRET environment variable is required
    at <unknown> (.next/server/chunks/387.js:1:20913)
Error: Failed to collect page data for /api/[...slug]
```

## Related Code

- **Affected Files**:
  - `.github/workflows/pr-validation.yml` (lines 314-360 bundle-size, lines 363-467 accessibility-test)
- **Recent Changes**: None - issue likely existed since workflow creation
- **Root Cause Location**: Missing `PAYLOAD_SECRET` env var in jobs that run `pnpm build`

## Related Issues & Context

### Direct Predecessors
- #1564 (CLOSED): "Bug Diagnosis: E2E Sharded Build Fails - Missing PAYLOAD_SECRET" - Same root cause, different workflow
- #1565 (CLOSED): "Bug Fix: E2E Sharded Build Fails - Missing PAYLOAD_SECRET" - Fix was applied to e2e-sharded.yml but NOT to pr-validation.yml

### Historical Context
Issue #1565 fixed the same problem in the `e2e-sharded.yml` workflow by adding test environment variables:
```yaml
PAYLOAD_SECRET: 'test_payload_secret_for_e2e_testing'
DATABASE_URL: 'postgresql://postgres:postgres@localhost:54522/postgres'
DATABASE_URI: 'postgresql://postgres:postgres@localhost:54522/postgres'
PAYLOAD_PUBLIC_SERVER_URL: 'http://localhost:3020'
```

This fix was NOT applied to `pr-validation.yml`, which has the same issue.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `bundle-size` and `accessibility-test` jobs in `pr-validation.yml` run `pnpm build` without providing the `PAYLOAD_SECRET` environment variable that Payload CMS requires at build time.

**Detailed Explanation**:
Payload CMS validates that `PAYLOAD_SECRET` is set during the build process because this secret is used to sign JWTs and other security-critical operations. When the PR Validation workflow runs `pnpm build`, Turbo orchestrates building all apps including Payload. The Payload build fails immediately because the required environment variable is not present.

The `e2e-sharded.yml` workflow was fixed in issue #1565 to include test values for these environment variables, but the `pr-validation.yml` workflow was never updated with the same fix.

**Supporting Evidence**:
- Error log explicitly states: `Error: PAYLOAD_SECRET environment variable is required`
- Code reference: `.github/workflows/pr-validation.yml` lines 320-326 (bundle-size env) and 369-385 (accessibility-test env) - neither includes `PAYLOAD_SECRET`
- Working reference: `.github/workflows/e2e-sharded.yml` includes `PAYLOAD_SECRET: 'test_payload_secret_for_e2e_testing'`

### How This Causes the Observed Behavior

1. PR is opened, triggering `pr-validation.yml` workflow
2. Change detection determines TypeScript files changed
3. `bundle-size` job starts, runs `pnpm build`
4. Turbo orchestrates parallel builds of web, payload, and packages
5. Payload build requires `PAYLOAD_SECRET` at startup
6. Environment variable is not set in the job
7. Payload build crashes with "PAYLOAD_SECRET environment variable is required"
8. Turbo reports `Failed: payload#build`
9. Job fails, PR cannot be merged

### Confidence Level

**Confidence**: High

**Reasoning**:
1. Error message explicitly identifies the missing variable
2. Same issue was previously diagnosed and fixed in another workflow (#1564, #1565)
3. Comparison of working (e2e-sharded.yml) vs failing (pr-validation.yml) workflows shows the exact difference

## Fix Approach (High-Level)

Add Payload-required environment variables to the `bundle-size` and `accessibility-test` jobs in `pr-validation.yml`, using the same test values as `e2e-sharded.yml`:

```yaml
env:
  PAYLOAD_SECRET: 'test_payload_secret_for_e2e_testing'
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:54522/postgres'
  DATABASE_URI: 'postgresql://postgres:postgres@localhost:54522/postgres'
  PAYLOAD_PUBLIC_SERVER_URL: 'http://localhost:3020'
```

## Diagnosis Determination

The root cause is definitively identified: missing `PAYLOAD_SECRET` environment variable in `pr-validation.yml` workflow jobs that run `pnpm build`. This is the same issue that was fixed in `e2e-sharded.yml` (issue #1565) but the fix was never applied to `pr-validation.yml`.

## Additional Context

This bug blocks all Dependabot PRs from passing CI, as seen with PR #1728 (tar update). The jobs are marked `continue-on-error: true` but they still show as failures, which is confusing for developers reviewing PRs.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI (workflow runs, issue search), Bash (log retrieval), Read (workflow files)*
