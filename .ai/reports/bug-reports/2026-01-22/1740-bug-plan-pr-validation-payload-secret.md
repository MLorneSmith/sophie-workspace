# Bug Fix: PR Validation Workflow Fails - Missing PAYLOAD_SECRET

**Related Diagnosis**: #1737 (REQUIRED)
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: The `bundle-size` and `accessibility-test` jobs in `.github/workflows/pr-validation.yml` run `pnpm build` without providing the `PAYLOAD_SECRET` environment variable that Payload CMS requires at build time
- **Fix Approach**: Add Payload-required environment variables to both failing jobs
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The PR Validation workflow fails on `bundle-size` and `accessibility-test` jobs because they run `pnpm build` without the `PAYLOAD_SECRET` environment variable. This blocks all Dependabot PRs and any PR that triggers TypeScript change detection. The error explicitly states: `Error: PAYLOAD_SECRET environment variable is required`.

For full details, see diagnosis issue #1737.

### Solution Approaches Considered

#### Option 1: Add Environment Variables to Both Jobs ⭐ RECOMMENDED

**Description**: Add the required Payload CMS environment variables (`PAYLOAD_SECRET`, `DATABASE_URL`, `DATABASE_URI`, `PAYLOAD_PUBLIC_SERVER_URL`) to both the `bundle-size` and `accessibility-test` jobs' `env` sections.

**Pros**:
- Exact pattern already proven to work in `e2e-sharded.yml`
- Minimal code change (4 lines per job, 8 lines total)
- No dependencies or external configuration needed
- Consistent with existing CI patterns
- Immediate resolution with zero side effects

**Cons**:
- Duplicates environment variables across jobs (minor DRY violation)

**Risk Assessment**: low - The exact same variables work successfully in another workflow (`e2e-sharded.yml` lines 174-178 and 249)

**Complexity**: simple - Just adding 4 env vars to 2 jobs

#### Option 2: Create Reusable Workflow Composite Action

**Description**: Extract the Payload environment variables into a composite action/reusable workflow section that multiple workflows can share.

**Pros**:
- Eliminates duplication
- Centralized management of Payload configuration
- Easier to update in future

**Cons**:
- More complex than the immediate fix
- Overkill for a one-time addition of 4 variables
- Requires creating new workflow files/composites
- More work upfront

**Why Not Chosen**: While DRY is good, this would be premature abstraction for a simple, one-time fix. The direct approach is cleaner.

#### Option 3: Move Build to Separate Job

**Description**: Create a single "Build" job that both `bundle-size` and `accessibility-test` depend on, avoiding duplication.

**Pros**:
- Builds once, artifacts used by multiple jobs
- Reduces CI time

**Cons**:
- Significantly more complex
- Requires artifact management and caching strategy
- Larger architectural change
- Takes significantly longer to implement

**Why Not Chosen**: The root cause is simply missing environment variables, not inefficient job structure. This would be over-engineering.

### Selected Solution: Add Environment Variables to Both Jobs

**Justification**: The `e2e-sharded.yml` workflow already demonstrates this exact pattern works. We're simply copying a proven solution to the remaining jobs. The variables use test values that are safe for CI and match exactly what the E2E workflow uses.

**Technical Approach**:
- Add 4 environment variables to `bundle-size` job's `env` section (line 320-326)
- Add same 4 environment variables to `accessibility-test` job's `env` section (line 369-385)
- Use the same test values already proven in `e2e-sharded.yml`:
  - `PAYLOAD_SECRET: 'test_payload_secret_for_e2e_testing'`
  - `DATABASE_URL: 'postgresql://postgres:postgres@localhost:54522/postgres'`
  - `DATABASE_URI: 'postgresql://postgres:postgres@localhost:54522/postgres'`
  - `PAYLOAD_PUBLIC_SERVER_URL: 'http://localhost:3020'`

**Architecture Changes**: None - this is purely adding missing configuration to existing jobs.

## Implementation Plan

### Affected Files

- `.github/workflows/pr-validation.yml` - Add environment variables to 2 jobs

### New Files

None required.

### Step-by-Step Tasks

#### Step 1: Add Environment Variables to bundle-size Job

Edit `.github/workflows/pr-validation.yml` at lines 320-325 (the `env:` section of the `bundle-size` job).

Add the Payload CMS environment variables after the existing env variables:

```yaml
env:
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
  SUPABASE_DB_WEBHOOK_SECRET: ${{ secrets.SUPABASE_DB_WEBHOOK_SECRET }}
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
  STRIPE_WEBHOOK_SECRET: ${{ secrets.STRIPE_WEBHOOK_SECRET }}
  DO_NOT_TRACK: 1
  PAYLOAD_SECRET: 'test_payload_secret_for_e2e_testing'
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:54522/postgres'
  DATABASE_URI: 'postgresql://postgres:postgres@localhost:54522/postgres'
  PAYLOAD_PUBLIC_SERVER_URL: 'http://localhost:3020'
```

**Why this step first**: The `bundle-size` job runs earlier and is simpler than accessibility-test. Fixing it first validates our approach.

#### Step 2: Add Environment Variables to accessibility-test Job

Edit `.github/workflows/pr-validation.yml` at lines 369-385 (the `env:` section of the `accessibility-test` job).

Add the same Payload CMS environment variables:

```yaml
env:
  # E2E Database Configuration
  E2E_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
  E2E_SUPABASE_ANON_KEY: ${{ secrets.E2E_SUPABASE_ANON_KEY }}
  E2E_SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.E2E_SUPABASE_SERVICE_ROLE_KEY }}
  E2E_DATABASE_URL: ${{ secrets.E2E_DATABASE_URL }}

  # Chrome flags for Lighthouse in CI environment
  CHROME_FLAGS: '--no-sandbox --disable-dev-shm-usage --disable-gpu'

  # Legacy environment variables (for backward compatibility)
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.E2E_SUPABASE_SERVICE_ROLE_KEY }}
  SUPABASE_DB_WEBHOOK_SECRET: ${{ secrets.SUPABASE_DB_WEBHOOK_SECRET }}
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
  STRIPE_WEBHOOK_SECRET: ${{ secrets.STRIPE_WEBHOOK_SECRET }}
  DO_NOT_TRACK: 1
  PLAYWRIGHT_SERVER_COMMAND: 'pnpm dev'
  PAYLOAD_SECRET: 'test_payload_secret_for_e2e_testing'
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:54522/postgres'
  DATABASE_URI: 'postgresql://postgres:postgres@localhost:54522/postgres'
  PAYLOAD_PUBLIC_SERVER_URL: 'http://localhost:3020'
```

#### Step 3: Validate Changes

- Verify the YAML syntax is correct
- Confirm both jobs now have identical Payload environment variables
- Ensure indentation matches existing code

#### Step 4: Test the Fix

- Trigger a PR with TypeScript changes (or wait for next Dependabot PR)
- Monitor both `bundle-size` and `accessibility-test` jobs
- Confirm `pnpm build` completes successfully
- Verify no new errors appear

## Testing Strategy

### Pre-Fix Validation

The bug is already reproducible - any PR with TypeScript changes will trigger the workflow failure.

### Post-Fix Validation

1. **Syntax Validation**:
   - YAML linter validates workflow file syntax
   - GitHub Actions parses the workflow without errors

2. **Build Success**:
   - Run any PR with TypeScript changes (or open test PR)
   - Verify `bundle-size` job completes successfully
   - Verify `accessibility-test` job completes successfully
   - Check build logs for no `PAYLOAD_SECRET` errors

3. **Manual Testing Checklist**:
   - [ ] Open a PR with TypeScript file changes
   - [ ] Wait for PR Validation workflow to run
   - [ ] Verify `bundle-size` job passes (green ✅)
   - [ ] Verify `accessibility-test` job passes (green ✅)
   - [ ] No "PAYLOAD_SECRET environment variable is required" errors in logs
   - [ ] Other jobs still pass (lint, typecheck, tests, etc.)
   - [ ] Verify no side effects on other workflows

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **YAML Syntax Error**: Incorrect indentation or typo in YAML
   - **Likelihood**: low
   - **Impact**: low (workflow won't parse, easy to fix)
   - **Mitigation**: GitHub Actions will show parse error immediately, fix and retry

2. **Unintended Configuration**: Environment variables could affect other parts of build
   - **Likelihood**: low
   - **Impact**: medium (unexpected build behavior)
   - **Mitigation**: These are test-only values, same as used in `e2e-sharded.yml` which works fine

3. **Secret Exposure**: Hardcoded secrets in workflow
   - **Likelihood**: none
   - **Impact**: none
   - **Mitigation**: Using test values `'test_payload_secret_for_e2e_testing'`, not real secrets. This is the same pattern used in `e2e-sharded.yml`

**Rollback Plan**:

If the fix causes issues:
1. Remove the added Payload environment variables from both jobs
2. Revert to previous `.github/workflows/pr-validation.yml`
3. Jobs will fail again but at least we know what caused it

**Monitoring** (if needed):
- Watch for unexpected build behavior in subsequent PRs
- Monitor for any new errors in workflow logs
- The fix is low-risk, so no special monitoring needed

## Performance Impact

**Expected Impact**: minimal

- The Payload environment variables don't add overhead, they just provide required configuration
- Both jobs already run `pnpm build`, just now with complete environment
- No performance degradation expected

## Security Considerations

**Security Impact**: none (positive)

- Using test values, not real secrets
- `test_payload_secret_for_e2e_testing` is intentionally designed for CI use
- Same pattern proven safe in `e2e-sharded.yml` for months
- No credentials exposed, no security boundaries crossed

## Validation Commands

### Before Fix (Bug Should Reproduce)

Open a PR with TypeScript changes (e.g., any PR from Dependabot that touches `.ts`/`.tsx` files):

```bash
# View the failing workflow run
gh run view <run-id> -R slideheroes/2025slideheroes
gh run view <run-id> --log -R slideheroes/2025slideheroes | grep -i "PAYLOAD_SECRET"
```

**Expected Result**: Error message appears: `Error: PAYLOAD_SECRET environment variable is required`

### After Fix (Bug Should Be Resolved)

```bash
# Create a test PR or wait for next Dependabot PR
# Then check the workflow
gh workflow run pr-validation.yml -R slideheroes/2025slideheroes

# Monitor the jobs
gh run list -R slideheroes/2025slideheroes --workflow=pr-validation.yml --limit 1

# Check specific jobs pass
gh run view <run-id> --log -R slideheroes/2025slideheroes | grep -E "bundle-size|accessibility-test"
```

**Expected Result**:
- `bundle-size` job shows ✅ or ⏭️ (skipped)
- `accessibility-test` job shows ✅ or ⏭️ (skipped)
- No error messages about PAYLOAD_SECRET

### Regression Prevention

```bash
# Full workflow should still work on future PRs with TypeScript changes
# No new errors should appear
# Existing error pattern should be gone
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

The fix uses environment variables that are already available in the workflow context.

## Database Changes

**No database changes required**

This is a CI/CD workflow configuration only.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

- This is a workflow file change, not application code
- Changes take effect immediately on next push to PR branches
- No staging or approval needed

**Feature flags needed**: no

**Backwards compatibility**: maintained

- No breaking changes
- Existing workflows unaffected
- Environment variables are additive only

## Success Criteria

The fix is complete when:
- [ ] YAML syntax is valid (GitHub Actions accepts the workflow)
- [ ] `bundle-size` job no longer fails with PAYLOAD_SECRET error
- [ ] `accessibility-test` job no longer fails with PAYLOAD_SECRET error
- [ ] Both jobs complete successfully on next PR with TypeScript changes
- [ ] No new errors or side effects
- [ ] Code review approved (if applicable)
- [ ] All other jobs continue to pass

## Notes

- This fix mirrors the exact solution already implemented in `e2e-sharded.yml` (commit 1565)
- Related issue #1564 had the same root cause in a different workflow, fixed in #1565
- This represents applying that same fix to the remaining affected workflow
- The `e2e-sharded.yml` workflow has been running successfully with these environment variables, proving they work

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1737*
