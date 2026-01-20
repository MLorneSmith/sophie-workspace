# Bug Fix: E2E Sharded Workflow Missing Test User Credentials

**Related Diagnosis**: #1636
**Severity**: high
**Bug Type**: integration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: E2E test user credential environment variables not passed to sharded workflow test steps
- **Fix Approach**: Add E2E test credentials to the e2e-shards job env section
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The E2E sharded workflow fails on shards 2-12 because GitHub workflow secrets for test user credentials (`E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`, `E2E_OWNER_EMAIL`, `E2E_OWNER_PASSWORD`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`) are not passed as environment variables to the test steps. These credentials ARE defined in GitHub Secrets and ARE properly used in `dev-integration-tests.yml`, but were never added to the sharded workflow's `env` section.

For full details, see diagnosis issue #1636.

### Solution Approaches Considered

#### Option 1: Add Missing Env Vars to e2e-shards Job ⭐ RECOMMENDED

**Description**: Add the E2E test user credential environment variables directly to the `env:` section of the `e2e-shards` job in `.github/workflows/e2e-sharded.yml`, mirroring the approach used in `dev-integration-tests.yml`.

**Pros**:
- Simple one-file change
- Direct mapping from GitHub Secrets
- Consistent with existing `dev-integration-tests.yml` pattern
- Minimal risk of unintended side effects
- Immediately fixes all shards 2-12

**Cons**:
- Duplicates env var declarations across workflows

**Risk Assessment**: low - This is a straightforward environment variable addition following an established pattern in the codebase.

**Complexity**: simple - Five lines added to a YAML file.

#### Option 2: Extract Shared Workflow Variables to Composite Action

**Description**: Create a reusable composite action that sets all E2E environment variables, which both workflows could use.

**Pros**:
- Eliminates duplication across workflows
- Single source of truth for E2E credentials
- Easier future maintenance

**Cons**:
- More complex implementation
- Requires additional file creation
- Needs testing in both workflows
- May cause temporary workflow breakage during transition

**Why Not Chosen**: Over-engineering for the current problem. The immediate need is to fix failing tests. The duplication is minimal (6 lines) and can be refactored later if additional workflows require these credentials.

### Selected Solution: Add Missing Env Vars to e2e-shards Job

**Justification**: This approach is the most direct fix to the diagnosed root cause. It's low-risk, requires minimal changes, and immediately unblocks shards 2-12. The pattern is already established and proven in `dev-integration-tests.yml`. Refactoring to a composite action can be done later as a maintenance task if more workflows require these credentials.

**Technical Approach**:
- Add six environment variable assignments to the `e2e-shards` job's `env:` section
- Each variable maps to its corresponding GitHub Secret: `${{ secrets.E2E_TEST_USER_EMAIL }}`, etc.
- Variables follow the established naming convention: `E2E_*` prefix
- Credentials are injected at workflow runtime from GitHub Secrets

## Implementation Plan

### Affected Files

- `.github/workflows/e2e-sharded.yml` - Add missing E2E test user credentials to the `e2e-shards` job's `env:` section

### New Files

No new files required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Review Current Workflow Configuration

<describe what this step accomplishes>

- Open `.github/workflows/e2e-sharded.yml` and locate the `e2e-shards` job
- Review the current `env:` section
- Compare with `dev-integration-tests.yml` to identify missing variables
- Document the exact location where variables should be added

**Why this step first**: Understanding the current state ensures we add variables in the correct location and format.

#### Step 2: Add E2E Test User Credentials to Env Section

<describe what this step accomplishes>

- Add the following six lines to the `e2e-shards` job's `env:` section:
  ```yaml
  E2E_TEST_USER_EMAIL: ${{ secrets.E2E_TEST_USER_EMAIL }}
  E2E_TEST_USER_PASSWORD: ${{ secrets.E2E_TEST_USER_PASSWORD }}
  E2E_OWNER_EMAIL: ${{ secrets.E2E_OWNER_EMAIL }}
  E2E_OWNER_PASSWORD: ${{ secrets.E2E_OWNER_PASSWORD }}
  E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
  E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
  ```
- Ensure proper YAML indentation (consistent with existing env vars)
- Verify the job structure remains valid YAML

#### Step 3: Validate Workflow Syntax

<describe what this step accomplishes>

- Use GitHub CLI to validate the workflow file has correct syntax
- Check for any YAML parsing errors
- Verify no accidental indentation issues

**Validation command**:
```bash
# Check YAML syntax
cd /home/msmith/projects/2025slideheroes
pnpm exec yaml-lint .github/workflows/e2e-sharded.yml || echo "YAML validation - review syntax"

# Git diff to review changes
git diff .github/workflows/e2e-sharded.yml
```

#### Step 4: Test Workflow Behavior (Optional Pre-Merge Check)

<describe what this step accomplishes>

- Trigger a workflow run manually to verify the fix
- Monitor shards 1-12 to ensure they all pass
- Check that no new errors occur in test output

**Why this step**: Validates the fix works end-to-end before merging.

#### Step 5: Verify Fix Against Diagnosis

<describe what this step accomplishes>

- Review the test output to confirm credential validation passes
- Verify error message "test user email is missing or empty" no longer appears
- Confirm all shards 2-12 now execute authentication steps successfully

## Testing Strategy

### Manual Workflow Validation

The primary validation for this fix is the GitHub Actions workflow execution:

- [ ] Trigger `e2e-sharded` workflow manually
- [ ] Confirm shard 1 (smoke tests) still passes
- [ ] Confirm shards 2-12 execute without "credentials missing" errors
- [ ] Verify test output shows proper E2E user authentication
- [ ] Check that no new environment variable errors appear

### Regression Testing

No regression testing needed - this is an environment variable addition that doesn't modify code logic.

### Success Criteria

- [ ] All workflow syntax is valid YAML
- [ ] All GitHub Secrets are properly referenced
- [ ] Shards 1-12 execute in CI environment
- [ ] No "E2E credential validation failed" errors appear
- [ ] Tests proceed to actual test execution (not blocked by missing credentials)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Incorrect Secret Names**: If GitHub Secrets are named differently than expected
   - **Likelihood**: low (secrets are documented in diagnosis)
   - **Impact**: medium (workflow would fail with clear "secret not found" error)
   - **Mitigation**: Verify secret names exist in GitHub repository settings before merging

2. **YAML Syntax Errors**: Indentation or formatting issues in the workflow file
   - **Likelihood**: low (simple addition following existing pattern)
   - **Impact**: medium (entire workflow would fail to parse)
   - **Mitigation**: Validate YAML syntax before committing; use GitHub's workflow validation

3. **Unintended Side Effects**: Adding env vars affects other jobs
   - **Likelihood**: very low (env vars are job-scoped in GitHub Actions)
   - **Impact**: low (only affects the e2e-shards job)
   - **Mitigation**: Review job structure to confirm env vars are properly scoped

**Rollback Plan**:

If the fix causes issues:
1. Remove the six newly added environment variable lines from `.github/workflows/e2e-sharded.yml`
2. Commit revert: `git revert [commit-hash]`
3. Push to repository
4. Diagnose why credentials didn't work as expected

**Monitoring** (if needed):

Watch the first few workflow runs after this fix for:
- Any "secret not found" errors in workflow logs
- Any "credential validation failed" errors in test output
- Overall shard execution time and success rates
- New errors that didn't appear before

## Performance Impact

**Expected Impact**: none

No performance changes are expected. This is purely an environment variable addition that makes credentials available to tests.

## Security Considerations

**Security Impact**: none

- Environment variables are already defined as GitHub Secrets
- No additional security exposure from adding them to env section
- Credentials are not hardcoded; they remain in secure GitHub Secrets storage
- Environment variables are only accessible within the job where they're defined

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Check current workflow - should show missing credentials in test output
# (Can only verify by running workflow in CI, but diagnosis confirms the issue)
git show HEAD:.github/workflows/e2e-sharded.yml | grep -A 20 "e2e-shards:"
# Should NOT contain E2E_TEST_USER_EMAIL, E2E_OWNER_EMAIL, etc.
```

**Expected Result**: Grep output shows `env:` section without E2E test credentials.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Verify workflow syntax
git diff .github/workflows/e2e-sharded.yml | grep -E "E2E_.*_EMAIL|E2E_.*_PASSWORD"

# Build
pnpm build

# Manual verification (in CI after merge)
# Trigger e2e-sharded workflow and monitor for:
# - No "E2E credential validation failed" errors
# - All shards 2-12 proceed to test execution
```

**Expected Result**: All commands succeed, workflow shows proper environment variable presence.

### Regression Prevention

```bash
# Ensure other workflows still work
# (Verify dev-integration-tests.yml still functions correctly)
git diff .github/workflows/dev-integration-tests.yml
# Should show no changes - this workflow is unaffected
```

## Dependencies

**No new dependencies required**

- All GitHub Secrets should already exist in repository settings
- No new packages needed
- No configuration changes beyond the workflow file

## Database Changes

**No database changes required**

This is purely a CI/CD workflow configuration fix.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- No deployment needed - this only affects CI/CD workflow execution
- Changes take effect on the next workflow run
- Previous workflow runs are unaffected

**Feature flags needed**: no

**Backwards compatibility**: maintained

All existing workflow configurations remain unchanged. This is a pure addition to the job env section.

## Success Criteria

The fix is complete when:
- [ ] Environment variables are properly added to `.github/workflows/e2e-sharded.yml`
- [ ] YAML syntax is valid and file parses correctly
- [ ] Workflow runs successfully in CI environment
- [ ] Shards 1-12 all execute (no longer blocked by missing credentials)
- [ ] Test output shows proper credential validation passing
- [ ] Zero regressions in other workflow steps
- [ ] GitHub Secrets are confirmed to exist in repository

## Notes

This is part of a series of missing environment variable issues in the e2e-sharded workflow:
- #1625, #1626 - E2E_ prefix env vars
- #1631, #1632 - Health check variable timing
- #1621 - JWT secret mismatch
- #1565 - Missing PAYLOAD_SECRET

After this fix is merged, consider creating a maintenance task to:
1. Audit all GitHub workflows for environment variable completeness
2. Document all required E2E environment variables in a central location
3. Consider extracting common env vars to a reusable composite action (future refactoring)

**Related Documentation**:
- CI/CD workflow patterns: `.ai/ai_docs/context-docs/infrastructure/ci-cd-complete.md`
- E2E testing setup: `.ai/ai_docs/context-docs/testing+quality/e2e-testing.md`
- GitHub Actions secrets management: [GitHub Actions Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1636*
