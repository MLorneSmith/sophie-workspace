# Bug Diagnosis: E2E Sharded Build Fails - Missing PAYLOAD_SECRET

**ID**: ISSUE-pending
**Created**: 2026-01-16T21:15:00Z
**Reporter**: system/CI
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The E2E Tests (Sharded) workflow is failing on the "Build application" step because the Payload CMS build requires `PAYLOAD_SECRET` environment variable, which is not provided in the e2e-sharded.yml workflow.

## Environment

- **Application Version**: 2.13.1
- **Environment**: CI (GitHub Actions)
- **Node Version**: 20
- **Database**: PostgreSQL (local Supabase)
- **Last Working**: Unknown - this workflow may have never successfully built Payload

## Reproduction Steps

1. Push code to dev branch
2. E2E Tests (Sharded) workflow triggers
3. setup-server job starts
4. Build application step runs `pnpm build`
5. Payload build fails with "PAYLOAD_SECRET environment variable is required"

## Expected Behavior

The build should complete successfully with all required environment variables provided.

## Actual Behavior

Build fails with error:
```
Error: PAYLOAD_SECRET environment variable is required
> Build error occurred
Error: Failed to collect page data for /api/[...slug]
```

## Diagnostic Data

### Console Output
```
payload:build
cache miss, executing 4e5ce7b3891319a8

> payload@3.70.0 build /home/runner/_work/2025slideheroes/2025slideheroes/apps/payload
> cross-env NODE_ENV=production NODE_OPTIONS=--no-deprecation next build --webpack

⚠ No build cache found. Please configure build caching for faster rebuilds.
   ▲ Next.js 16.0.10 (webpack)
   Creating an optimized production build ...
 ✓ Compiled successfully in 68s
   Skipping validation of types
   Collecting page data using 1 worker ...
Error: PAYLOAD_SECRET environment variable is required
    at <unknown> (.next/server/chunks/387.js:1:20913)
Error: PAYLOAD_SECRET environment variable is required
    at <unknown> (.next/server/chunks/387.js:1:20913)

> Build error occurred
Error: Failed to collect page data for /api/[...slug]
```

### Network Analysis
N/A - This is a build-time error, not a runtime network issue.

### Database Analysis
N/A - Build fails before database operations.

### Performance Metrics
N/A - Build fails before performance can be measured.

## Error Stack Traces
```
Error: PAYLOAD_SECRET environment variable is required
    at <unknown> (.next/server/chunks/387.js:1:20913)

Error: Failed to collect page data for /api/[...slug]
    at ignore-listed frames {
  type: 'Error'
}
```

## Related Code
- **Affected Files**:
  - `.github/workflows/e2e-sharded.yml` (missing env vars)
  - `.github/workflows/reusable-build.yml` (has correct env vars as reference)
- **Recent Changes**: e2e-sharded.yml was modified to remove duplicate --cache-dir argument
- **Suspected Functions**: Build step at line 77-80 in e2e-sharded.yml

## Related Issues & Context

### Direct Predecessors
- #1563 (CLOSED): "Bug Fix: Resolve 5 Non-Essential Workflow Failures" - This issue fixed 5 other workflow problems but did not address the PAYLOAD_SECRET issue in e2e-sharded workflow.

### Related Infrastructure Issues
- #1550: Permission denied on shell scripts - Fixed with chmod
- #1552: pnpm global bin directory error - Fixed

### Same Component
- #1561: "Bug Diagnosis: 5 Non-Essential Workflow Failures" - Original diagnosis that led to #1563

### Historical Context
The e2e-sharded workflow has a different build approach than the main reusable-build.yml workflow. The reusable-build.yml correctly passes PAYLOAD_SECRET and other required environment variables, but e2e-sharded.yml was never updated to include these.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The e2e-sharded.yml workflow's "Build application" step does not pass the required environment variables (PAYLOAD_SECRET, DATABASE_URI, DATABASE_URL, PAYLOAD_PUBLIC_SERVER_URL) that Payload CMS needs at build time.

**Detailed Explanation**:
When `pnpm build` runs in the e2e-sharded workflow, it builds all packages including `apps/payload`. The Payload CMS build requires certain environment variables to be present at build time for:
1. Configuration validation (PAYLOAD_SECRET)
2. Database type generation (DATABASE_URI/DATABASE_URL)
3. Server URL configuration (PAYLOAD_PUBLIC_SERVER_URL)

The `reusable-build.yml` workflow correctly provides these variables (lines 82-93), but `e2e-sharded.yml` only provides variables for the E2E test environment (Supabase URLs, etc.) and omits the Payload-specific variables.

**Supporting Evidence**:
- Stack trace clearly shows: `Error: PAYLOAD_SECRET environment variable is required`
- Code reference: `.github/workflows/e2e-sharded.yml:77-80` - Build step has no env vars
- Code reference: `.github/workflows/reusable-build.yml:82-93` - Shows correct env vars

### How This Causes the Observed Behavior

1. E2E workflow triggers on push to dev
2. setup-server job runs
3. Build application step executes `pnpm build` without PAYLOAD_SECRET
4. Turbo runs builds for all packages in scope
5. payload:build starts compiling
6. Next.js page data collection attempts to initialize Payload config
7. Payload config validation throws error: "PAYLOAD_SECRET environment variable is required"
8. Build fails, all dependent jobs are cancelled

### Confidence Level

**Confidence**: High

**Reasoning**: 
- Error message explicitly states "PAYLOAD_SECRET environment variable is required"
- Comparison with working reusable-build.yml shows the missing variables
- The fix is straightforward: add the missing env vars to the build step

## Fix Approach (High-Level)

Add the required environment variables to the "Build application" step in `.github/workflows/e2e-sharded.yml`:
- PAYLOAD_SECRET (from secrets)
- DATABASE_URI (from secrets or use test value)
- DATABASE_URL (from secrets or use test value)
- PAYLOAD_PUBLIC_SERVER_URL (from vars or use test value)

For E2E tests, these can either use real secrets or test/dummy values since the built artifacts are only used for E2E testing, not production.

## Diagnosis Determination

**Root cause identified**: The e2e-sharded.yml workflow is missing PAYLOAD_SECRET and related environment variables required by the Payload CMS build process.

**Fix path is clear**: Add the missing environment variables to the build step, similar to how reusable-build.yml handles them.

## Additional Context

- This workflow was likely never fully working with Payload builds
- Previous runs may have used cached builds that bypassed this issue
- The fix should align with how reusable-build.yml handles these variables

---
*Generated by Claude Debug Assistant*
*Tools Used: gh workflow list, gh run view, gh run view --log-failed, file comparison*
