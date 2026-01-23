# Bug Fix: E2E Sharded Workflow Fails Due to Environment Variable Naming Mismatch and Localhost Validation

**Related Diagnosis**: #1625 (REQUIRED)
**Severity**: high
**Bug Type**: integration
**Risk Level**: medium
**Complexity**: simple

## Quick Reference

- **Root Cause**: Two distinct issues: (1) Environment variable naming mismatch between workflow exports and test expectations, (2) Overly restrictive localhost validation in global-setup.ts
- **Fix Approach**: Add E2E_ prefixed environment variables to workflow exports and update localhost validation logic to support local Supabase in CI
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The E2E sharded workflow (e2e-sharded.yml) fails on multiple shards despite prior fixes. Two distinct root causes were identified:

1. **Environment Variable Naming Mismatch**: The workflow extracts JWT keys from Supabase but exports them with the wrong variable names. The test setup looks for `E2E_SUPABASE_SERVICE_ROLE_KEY` but the workflow only exports `SUPABASE_SERVICE_ROLE_KEY`. When the variable is missing, the code falls back to a hardcoded HS256 key, but Supabase uses ES256 keys, causing JWT signing method validation errors.

2. **Localhost Validation Block**: The global-setup.ts validation at line 414 throws an error when CI=true and baseURL contains "localhost". This check was added to prevent testing deployed environments locally, but the sharded workflow intentionally runs Supabase locally and should be allowed to proceed.

For full details, see diagnosis issue #1625.

### Solution Approaches Considered

#### Option 1: Fix Environment Variables + Add Local Supabase Flag ⭐ RECOMMENDED

**Description**: Add the missing E2E_ prefixed environment variables to the workflow and add an environment flag to skip the localhost validation for local Supabase setups.

**Pros**:
- Minimal, surgical fix targeting the exact root causes
- E2E_ prefix aligns with test naming conventions used in test-users.ts
- Local Supabase flag is explicit and clear
- No changes needed to test code (test-users.ts is already correct)
- Easy to understand and maintain

**Cons**:
- Requires two separate changes in the workflow file
- Need to coordinate both fixes to work together

**Risk Assessment**: Low - Changes are isolated to workflow and global-setup.ts, no test code modifications needed

**Complexity**: Simple - Three lines in workflow file, minor conditional check in setup

#### Option 2: Only Fix Environment Variables

**Description**: Add E2E_ prefixed variables but remove or modify the localhost check entirely instead of adding a flag.

**Why Not Chosen**: While this would fix the env var issue, it removes a safety check entirely. The original check serves a purpose (preventing accidental CI test against production URLs). Better to keep the check but add a flag for legitimate local Supabase setups.

#### Option 3: Modify Test Code to Use Fallback

**Description**: Keep the current workflow exports but update test-users.ts to look for SUPABASE_SERVICE_ROLE_KEY (without E2E_ prefix) instead.

**Why Not Chosen**: The test code is already correct and uses the proper E2E_ prefix convention. Modifying test code to accept less explicit naming conventions would be wrong. The workflow is the source of truth that should follow the test's expectations.

### Selected Solution: Fix Environment Variables + Add Local Supabase Flag

**Justification**: This approach fixes both root causes with minimal, surgical changes. It maintains clarity by using explicit E2E_ prefixed variables, preserves the original localhost validation safety check, and requires no modifications to test code (which is already correct).

**Technical Approach**:
- Export `E2E_SUPABASE_SERVICE_ROLE_KEY` and `E2E_SUPABASE_ANON_KEY` in workflow (not SUPABASE_SERVICE_ROLE_KEY)
- Add `E2E_LOCAL_SUPABASE=true` environment variable to signal that localhost validation should be skipped
- Update localhost validation to check for this flag and skip when true
- Keep all other existing logic intact

**Architecture Changes**: None - purely configuration and validation logic

**Migration Strategy**: Not needed - this is a workflow and test setup fix with no data implications

## Implementation Plan

### Affected Files

- `.github/workflows/e2e-sharded.yml` - Add missing E2E_ prefixed environment variables
- `apps/e2e/global-setup.ts` - Update localhost validation to respect local Supabase flag

### New Files

None required

### Step-by-Step Tasks

#### Step 1: Fix Environment Variable Exports in Workflow

<describe what this step accomplishes>
Update the GitHub workflow to export environment variables with the correct E2E_ prefix that test-users.ts expects.

- Locate the section in e2e-sharded.yml that extracts JWT keys from Supabase
- Replace `echo "SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY" >> $GITHUB_ENV` with `echo "E2E_SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY" >> $GITHUB_ENV`
- Replace `echo "SUPABASE_ANON_KEY=$ANON_KEY" >> $GITHUB_ENV` with `echo "E2E_SUPABASE_ANON_KEY=$ANON_KEY" >> $GITHUB_ENV`
- Add `echo "E2E_LOCAL_SUPABASE=true" >> $GITHUB_ENV` to signal local Supabase setup

**Why this step first**: The environment variables must be correct before the tests run. This is a prerequisite for the tests to work at all.

#### Step 2: Update Localhost Validation in global-setup.ts

<describe what this step accomplishes>
Modify the localhost validation check to skip when E2E_LOCAL_SUPABASE flag is set, allowing the sharded workflow to run against local Supabase.

- Locate the validation at line 414 in apps/e2e/global-setup.ts
- Update the condition from:
  ```typescript
  if (baseURL?.includes("localhost") && process.env.CI === "true") {
    throw new Error("CI environment detected but BASE_URL points to localhost!");
  }
  ```
  to:
  ```typescript
  if (
    baseURL?.includes("localhost") &&
    process.env.CI === "true" &&
    process.env.E2E_LOCAL_SUPABASE !== "true"
  ) {
    throw new Error("CI environment detected but BASE_URL points to localhost!");
  }
  ```
- This allows the check to pass when E2E_LOCAL_SUPABASE=true is set

**Why this step second**: Once environment variables are correct, we need to allow the validation to pass for local setups. This enables the tests to continue.

#### Step 3: Add/Update Tests

<describe the testing strategy>

No new tests needed - this fix resolves existing test failures. The current test suite (E2E sharded tests) serves as the validation.

- The E2E sharded workflow itself validates this fix
- Shards 2+ should pass without JWT signing errors after the env var fix
- The localhost validation should allow local Supabase when flag is set

#### Step 4: Validation

- Run the E2E sharded workflow and verify all shards pass
- Confirm JWT key errors no longer appear
- Confirm localhost validation no longer blocks sharded workflow
- Verify no regressions in other CI workflows

## Testing Strategy

### Validation

The primary validation is running the E2E sharded workflow end-to-end:

```bash
# Push changes to dev branch or create PR
git push origin dev

# Workflow triggers automatically
# Monitor: .github/workflows/e2e-sharded.yml

# All shards should pass without:
# - "signing method HS256 is invalid" errors
# - "CI environment detected but BASE_URL points to localhost" errors
```

### Edge Cases

- **Non-CI environments**: E2E_LOCAL_SUPABASE won't be set, localhost validation still works
- **Production workflows**: Only e2e-sharded.yml sets E2E_LOCAL_SUPABASE=true, other workflows unaffected
- **Manual local testing**: Developers can manually set E2E_LOCAL_SUPABASE=true for local runs

### Manual Testing Checklist

Execute these steps before considering the fix complete:

- [ ] Push to dev branch (or create PR)
- [ ] Monitor GitHub Actions for E2E Sharded workflow
- [ ] Verify all 4 shards pass without JWT errors
- [ ] Verify all shards pass without localhost validation errors
- [ ] Check other CI workflows still work (no regressions)
- [ ] Verify test output shows successful user creation without fallback keys

## Risk Assessment

**Overall Risk Level**: Medium

**Potential Risks**:

1. **Incorrect variable names**: If variable names don't match exactly, tests still fail
   - **Likelihood**: Low (names are clearly defined in test-users.ts)
   - **Impact**: High (workflow would still fail)
   - **Mitigation**: Triple-check variable names against test-users.ts before pushing

2. **Localhost check breaks legitimate deployments**: Adding the flag could allow unintended localhost testing in production
   - **Likelihood**: Low (flag only works with CI=true and localhost in URL)
   - **Impact**: Medium (unintended test against local Supabase)
   - **Mitigation**: Flag is explicitly named E2E_LOCAL_SUPABASE, making intent clear. Only set in specific workflow file.

3. **Missing both environment variables**: If only one variable is fixed, tests still fail partially
   - **Likelihood**: Low (fix applies both together)
   - **Impact**: Medium (some user creation works, some fails)
   - **Mitigation**: Both variables must be changed together in same commit

**Rollback Plan**:

If this fix causes issues:
1. Revert the workflow file changes (removes E2E_ variables and flag)
2. Revert global-setup.ts changes (restores original validation)
3. Rebuild and re-trigger workflow
4. Investigate what went wrong (likely variable name mismatch)

**Monitoring** (if needed):
- Monitor E2E Sharded workflow success rate for next 3 runs
- Check for any JWT-related errors in logs
- Verify all shards complete without timeout

## Performance Impact

**Expected Impact**: None

No performance changes - this is purely a configuration and validation logic fix.

## Security Considerations

**Security Impact**: None

- Environment variables are not secrets (keys are already dynamically extracted)
- Flag is explicit and only set in designated workflow
- Doesn't bypass any actual security controls
- Localhost validation still prevents CI from testing against unintended production URLs

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Trigger E2E sharded workflow
git push origin dev

# Monitor workflow execution
gh run watch -R MLorneSmith/2025slideheroes
```

**Expected Result**: Shards fail with JWT and/or localhost errors

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Trigger E2E sharded workflow
git push origin dev

# Monitor workflow execution
gh run watch -R MLorneSmith/2025slideheroes
```

**Expected Result**: All shards pass without JWT or localhost validation errors

### Regression Prevention

```bash
# Run all CI workflows to ensure no regressions
gh run list -R MLorneSmith/2025slideheroes --workflow e2e-sharded.yml --limit 1

# Check other test workflows still work
gh run list -R MLorneSmith/2025slideheroes --workflow e2e.yml --limit 1
```

## Dependencies

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**: None

**Feature flags needed**: No

**Backwards compatibility**: Maintained - no breaking changes

## Success Criteria

The fix is complete when:
- [ ] All 4 E2E shards pass in the workflow
- [ ] No JWT signing errors ("signing method HS256 is invalid")
- [ ] No localhost validation errors
- [ ] Code passes typecheck, lint, and format
- [ ] No regressions in other CI workflows
- [ ] Environment variables are correct in workflow file

## Notes

This is a straightforward configuration fix addressing the exact root causes identified in the diagnosis. The three issues from related bugs (#1609, #1621, #1518) are being resolved with a single comprehensive fix:

- #1609 (globalSetup missing) - Fixed by allowing global-setup to run with local Supabase
- #1621 (JWT extraction) - Fixed by using correct E2E_ prefixed variable names
- #1518 (localhost validation) - Fixed by adding explicit flag for local Supabase setups

**Related Issues**:
- #1625 - Diagnosis (this issue's parent)
- #1609 - globalSetup fix (partial)
- #1621 - JWT extraction (partial)
- #1615 - Original JWT mismatch diagnosis
- #1518 - Added localhost validation (root cause)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1625*
