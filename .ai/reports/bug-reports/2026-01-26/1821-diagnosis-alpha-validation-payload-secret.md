# Bug Diagnosis: Alpha Validation Workflow Fails - Missing PAYLOAD_SECRET

**ID**: ISSUE-pending
**Created**: 2026-01-26T17:35:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: error

## Summary

The Alpha Branch Validation workflow fails during the build step because the `PAYLOAD_SECRET` environment variable is not configured. When Payload CMS attempts to build, it requires this secret at build time for page data collection, causing the entire workflow to fail.

## Environment

- **Application Version**: 2.13.1
- **Environment**: CI (GitHub Actions)
- **Node Version**: 22
- **pnpm Version**: 10.14.0
- **Workflow**: `.github/workflows/alpha-validation.yml`
- **Last Working**: Never (workflow missing required env vars since creation)

## Reproduction Steps

1. Push any commit to a branch matching `alpha/spec-*`
2. Alpha validation workflow triggers automatically
3. Workflow reaches "Build" step
4. Build fails with `PAYLOAD_SECRET environment variable is required`

## Expected Behavior

The alpha-validation workflow should complete successfully, validating that alpha branches can pass type checking and build.

## Actual Behavior

The workflow fails at the Build step with error:
```
Error: PAYLOAD_SECRET environment variable is required
    at <unknown> (.next/server/chunks/5797.js:1:20935)
> Build error occurred
Error: Failed to collect page data for /api/[...slug]
```

## Diagnostic Data

### Console Output
```
payload:build cache miss, executing 1cbed44ae38cbd4d

> payload@3.72.0 build /home/runner/_work/2025slideheroes/2025slideheroes/apps/payload
> cross-env NODE_ENV=production NODE_OPTIONS=--no-deprecation next build --webpack

⚠ No build cache found. Please configure build caching for faster rebuilds.
   ▲ Next.js 16.0.10 (webpack)
   Creating an optimized production build ...
 ✓ Compiled successfully in 54s
   Skipping validation of types
   Collecting page data using 1 worker ...
Error: PAYLOAD_SECRET environment variable is required
    at <unknown> (.next/server/chunks/5797.js:1:20935)

> Build error occurred
Error: Failed to collect page data for /api/[...slug]
 ELIFECYCLE  Command failed with exit code 1.
```

### Network Analysis
N/A - This is a build-time configuration error, not a network issue.

### Database Analysis
N/A - Database is not involved; this fails before any database connection is attempted.

### Performance Metrics
N/A

### Screenshots
N/A

## Error Stack Traces
```
Error: PAYLOAD_SECRET environment variable is required
    at <unknown> (.next/server/chunks/5797.js:1:20935)
Error: PAYLOAD_SECRET environment variable is required
    at <unknown> (.next/server/chunks/5797.js:1:20935)

> Build error occurred
Error: Failed to collect page data for /api/[...slug]
    at ignore-listed frames {
  type: 'Error'
}
```

## Related Code
- **Affected Files**:
  - `.github/workflows/alpha-validation.yml` (missing env vars)
- **Recent Changes**: Workflow created without Payload CMS env vars
- **Suspected Functions**: Build step in workflow (line 46-47)

## Related Issues & Context

### Direct Predecessors
- #1737 (CLOSED): "Bug Diagnosis: PR Validation Workflow Fails - Missing PAYLOAD_SECRET" - Exact same issue in pr-validation.yml
- #1740 (CLOSED): "Bug Fix: PR Validation Workflow Fails - Missing PAYLOAD_SECRET" - Fix applied to pr-validation.yml
- #1564 (CLOSED): "Bug Diagnosis: E2E Sharded Build Fails - Missing PAYLOAD_SECRET" - Same issue in e2e-sharded.yml
- #1565 (CLOSED): "Bug Fix: E2E Sharded Build Fails - Missing PAYLOAD_SECRET" - Fix applied to e2e-sharded.yml

### Historical Context
This is the **third instance** of workflows failing due to missing `PAYLOAD_SECRET`. The fix has been applied to:
1. `.github/workflows/e2e-sharded.yml` (Issue #1565)
2. `.github/workflows/pr-validation.yml` (Issue #1740)

The `alpha-validation.yml` workflow was created without these required env vars, repeating the same pattern.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `alpha-validation.yml` workflow is missing the `PAYLOAD_SECRET` and related Payload CMS environment variables required at build time.

**Detailed Explanation**:
Payload CMS requires certain environment variables at build time, not just runtime. During Next.js build, when collecting page data for API routes (specifically `/api/[...slug]`), Payload attempts to access `PAYLOAD_SECRET` from the environment. Since the alpha-validation workflow does not configure this variable, the build fails.

This is a known pattern - it has occurred twice before in other workflows:
- `e2e-sharded.yml` - Fixed in Issue #1565
- `pr-validation.yml` - Fixed in Issue #1740

The `alpha-validation.yml` workflow was not updated with the same fix pattern.

**Supporting Evidence**:
- Stack trace: `Error: PAYLOAD_SECRET environment variable is required` at `.next/server/chunks/5797.js:1:20935`
- Code reference: `.github/workflows/alpha-validation.yml:46-47` - Build step without env vars
- Working examples: Both `pr-validation.yml` and `e2e-sharded.yml` have these env vars configured

### How This Causes the Observed Behavior

1. User pushes to `alpha/spec-*` branch
2. Workflow triggers and runs setup steps successfully
3. Typecheck passes (doesn't require Payload secrets)
4. Build step starts running `pnpm build`
5. Turbo orchestrates builds; `payload:build` task starts
6. Next.js compiles Payload app successfully
7. Next.js attempts to collect page data for static generation
8. Payload config initializes and checks for `PAYLOAD_SECRET`
9. `PAYLOAD_SECRET` is undefined → throws error
10. Build fails → workflow fails

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The error message explicitly states "PAYLOAD_SECRET environment variable is required"
2. This exact issue has been diagnosed and fixed twice before (#1564/#1565, #1737/#1740)
3. The working workflows (`pr-validation.yml`, `e2e-sharded.yml`) have these env vars configured
4. The `alpha-validation.yml` workflow clearly lacks these env vars when compared

## Fix Approach (High-Level)

Add the required Payload CMS environment variables to the `validate` job in `.github/workflows/alpha-validation.yml`:

```yaml
env:
  PAYLOAD_SECRET: 'test_payload_secret_for_e2e_testing'
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:54522/postgres'
  DATABASE_URI: 'postgresql://postgres:postgres@localhost:54522/postgres'
  PAYLOAD_PUBLIC_SERVER_URL: 'http://localhost:3020'
```

This matches the pattern used in `pr-validation.yml` (bundle-size and accessibility-test jobs).

## Diagnosis Determination

The root cause is definitively identified: missing `PAYLOAD_SECRET` environment variable in the alpha-validation workflow. This is a configuration omission, not a code bug. The fix is straightforward - add the same environment variables that are used in other workflows that need to build Payload CMS.

## Additional Context

This is a recurring pattern suggesting that new workflows should be created from a template that includes all required env vars, or there should be a shared configuration/composite action for build steps that includes Payload CMS requirements.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run list, gh run view --log-failed, gh issue list, grep, Read*
