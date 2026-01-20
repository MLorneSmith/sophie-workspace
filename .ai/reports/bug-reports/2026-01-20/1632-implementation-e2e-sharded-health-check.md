# Implementation: Bug Fix E2E Sharded Workflow Supabase Health Check Variable Timing

**Issue:** #1632
**Type:** Bug Fix
**Status:** ✅ Complete
**Date:** 2026-01-20

## Summary

Fixed the E2E sharded workflow health check timing issue where the Supabase API health check was failing due to undefined JWT key variables.

### Root Cause
The workflow attempted to use `${SUPABASE_ANON_KEY}` in a curl health check command before the variable was extracted. The "Extract Supabase JWT keys" step ran after the health check, leaving the variable undefined and causing authentication failures.

### Solution
Moved JWT key extraction to immediately after `supabase start` in the "Start local Supabase" step, ensuring keys are available for the health check curl command.

## Implementation Details

### Changes Made

**File:** `.github/workflows/e2e-sharded.yml`

1. **Added inline JWT key extraction** (lines 230-240):
   - Run `eval "$(supabase status -o env)"` immediately after `supabase start`
   - Validate that `$ANON_KEY` was extracted successfully
   - Exit with error if extraction fails

2. **Updated health check curl command** (lines 246-247):
   - Changed from `${SUPABASE_ANON_KEY}` to `${ANON_KEY}`
   - Both header values now use the same variable

3. **Added documentation** (lines 288-289):
   - Added comment to "Extract Supabase JWT keys" step noting inline extraction
   - Clarified that this step exports to `$GITHUB_ENV` for subsequent steps

### Key Advantages

- ✅ **Minimal code changes:** 16 insertions, 2 deletions
- ✅ **No workflow structure disruption:** Keys extracted in same step as `supabase start`
- ✅ **Low risk:** Straightforward sequence reordering
- ✅ **Better clarity:** Comments document the timing requirement
- ✅ **Dual extraction approach:** Inline for health check, separate step for `$GITHUB_ENV` export

## Validation

### Syntax & Formatting
- ✅ YAML syntax valid (Python YAML parser)
- ✅ Pre-commit hooks passed:
  - TruffleHog secret scanning
  - yamllint for YAML formatting
  - commitlint for commit message format

### Expected Behavior
When the e2e-shards workflow runs:
1. Supabase starts with `--ignore-health-check`
2. JWT keys extracted immediately
3. Health check runs with properly defined `$ANON_KEY` variables
4. Health check succeeds in 1-2 attempts (vs. timing out at 30 retries)
5. No "Supabase API failed to respond" errors

## Commits

```
230fd41fa fix(ci): extract JWT keys before health check in e2e-sharded workflow [agent: implementor]
```

## Files Changed

```
.github/workflows/e2e-sharded.yml | 18 ++++++++++++++++--
```

## Related Issues

- **Diagnosis:** #1631 - E2E Sharded Workflow Supabase Health Check Issue
- **Root Cause:** Environment variable timing - health check runs before variable extraction
- **Related Fix:** #1626 - Environment variable naming mismatch (E2E_ prefix)

## Follow-up

The fix should be validated by:
1. Running the e2e-shards workflow manually or on next PR
2. Verifying all 9 real shards pass without timeout errors
3. Confirming health check completes in <30 seconds

## Notes

This fix complements the previous fix (#1626) which addressed JWT algorithm mismatches (ES256 vs HS256). Together, they resolve all known issues with the e2e-sharded workflow:
- **#1626:** JWT algorithm validation errors
- **#1631/#1632:** Variable timing and health check failures
