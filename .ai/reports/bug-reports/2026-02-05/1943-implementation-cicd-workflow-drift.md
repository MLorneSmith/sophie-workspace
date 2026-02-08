# Implementation Report: CI/CD Workflow Configuration Drift

**Issue**: #1943
**Related Diagnosis**: #1942
**Date**: 2026-02-05
**Status**: Complete

## Summary

Fixed configuration drift between dev-deploy.yml (working) and staging-deploy.yml/production-deploy.yml (broken) by aligning all workflows with proven dev configuration.

## Changes Made

### 1. staging-deploy.yml (11 changes)
- Fixed RunsOn syntax from `"runs-on/runner=4cpu-linux-x64"` to `runs-on=${{ github.run_id }}/runner=4cpu-linux-x64` (11 occurrences)
- Added `actions: read` permission
- Added `paths-ignore` configuration to skip doc-only changes
- Added `TURBO_REMOTE_CACHE_SIGNATURE_KEY` for cache integrity
- Changed `STRIPE_SECRET_KEY` from `${{ secrets.STRIPE_SECRET_KEY }}` to `'sk_test_dummy'` for tests (2 occurrences)

### 2. production-deploy.yml (6 changes)
- Added `actions: read` permission
- Added `paths-ignore` configuration
- Added `TURBO_REMOTE_CACHE_SIGNATURE_KEY`
- Fixed `VERCEL_PROJECT_ID` to `VERCEL_PROJECT_ID_WEB` in deploy-web job
- Fixed `VERCEL_PROJECT_ID` to `VERCEL_PROJECT_ID_WEB` in auto-rollback job
- Removed invalid workflow syntax on line 82 (cannot use `uses:` to invoke reusable workflow from a step)

### 3. staging-deploy-simple.yml (2 changes)
- Fixed RunsOn separator from comma to slash (2 occurrences)
  - `runs-on=${{ github.run_id }},runner=2cpu-linux-x64` -> `runs-on=${{ github.run_id }}/runner=2cpu-linux-x64`

### 4. test-runson-staging.yml (1 change)
- Fixed RunsOn separator from comma to slash (1 occurrence)

## Files Changed

```
.github/workflows/production-deploy.yml            |  20 +++-
.github/workflows/staging-deploy-simple.yml        |   4 +-
.github/workflows/staging-deploy.yml               |  38 ++++---
.github/workflows/test-runson-staging.yml          |   2 +-
4 files changed, 44 insertions(+), 20 deletions(-)
```

## Commits

```
3b2ad4cef fix(ci): align staging/production workflows with dev-deploy.yml config
```

## Validation Results

- YAML Lint: Passed
- All RunsOn syntax uses `/` separator (not comma)
- All RunsOn syntax includes `${{ github.run_id }}`
- No quoted RunsOn values
- `actions: read` permission present in staging and production
- `paths-ignore` configuration present and consistent
- `STRIPE_SECRET_KEY` uses `'sk_test_dummy'` in test environments
- `VERCEL_PROJECT_ID_WEB` used consistently
- Turbo cache signature key configured
- Invalid workflow syntax removed (production line 82)

## Follow-up Items

- Monitor staging workflow runs for 2-3 runs to verify no regressions
- Watch for `startup_failure` errors (should be gone)
- Verify STRIPE_SECRET_KEY is no longer empty in logs
- Verify E2E shards complete without hanging in queued state
- Consider consolidating workflows into reusable template (future chore)

## Related Issues

- #1942 - Diagnosis: CI/CD Workflow Configuration Drift
- #1897 - Bug Fix: Staging Deploy E2E Shards Stuck
- #1896 - Bug Diagnosis: Staging Deploy E2E Shards Stuck
- #1826 - Bug Fix: Staging Deploy E2E Tests Failing
- #215 - Staging deployment consistently fails with startup_failure

---
*Implementation completed by Claude*
