# Bug Fix: Staging Deploy E2E Tests Failing Due to Missing Environment Variables and Payload CMS Migrations

**Related Diagnosis**: #1825
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: The `test-shards` job in `staging-deploy.yml` is out of sync with the working `e2e-shards` job in `e2e-sharded.yml`, missing critical environment variables and Payload CMS migrations
- **Fix Approach**: Synchronize staging-deploy.yml test-shards job with e2e-sharded.yml e2e-shards job
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The staging-deploy workflow's E2E test configuration is missing critical environment variables and setup steps that exist in the working e2e-sharded workflow. This causes:

1. **Missing Payload CMS migrations** - Tests fail with "relation payload.users does not exist" errors
2. **Missing E2E test user credentials** - Authentication tests cannot run without E2E_TEST_USER_EMAIL, E2E_OWNER_EMAIL, etc.
3. **Missing environment variables** - Database URLs, Payload secrets, and billing configuration missing from job env block
4. **Fragile key extraction** - Using grep/awk parsing instead of robust `eval "$(supabase status -o env)"` method
5. **Missing E2E_ prefixed Supabase keys** - Test code requires E2E_SUPABASE_ANON_KEY and E2E_SUPABASE_SERVICE_ROLE_KEY with ES256 keys

For full details, see diagnosis issue #1825.

### Solution Approaches Considered

#### Option 1: Synchronize staging-deploy.yml with e2e-sharded.yml ⭐ RECOMMENDED

**Description**: Update the `test-shards` job in `staging-deploy.yml` to match the configuration and steps from the working `e2e-shards` job in `e2e-sharded.yml`.

**Pros**:
- Directly fixes root cause by aligning configurations
- Reuses proven working pattern from e2e-sharded
- Maintains consistency across workflows
- Simple, straightforward implementation
- Low risk - just copying working patterns

**Cons**:
- Requires careful line-by-line comparison
- Must verify all environment variables are available in staging context

**Risk Assessment**: low - The e2e-sharded workflow is proven to work; copying it verbatim minimizes risk

**Complexity**: simple - Mostly configuration synchronization, no complex logic

#### Option 2: Create a shared workflow action

**Description**: Extract the E2E test setup into a separate GitHub Actions action that both workflows could call.

**Why Not Chosen**: Over-engineering for this bug fix. The immediate need is to fix the broken tests. Creating a reusable action can be a follow-up chore after tests pass.

#### Option 3: Merge staging-deploy and e2e-sharded workflows

**Description**: Combine both workflows into a single unified workflow.

**Why Not Chosen**: Violates separation of concerns. The workflows serve different purposes (staging E2E vs PR validation). Merging would complicate the codebase.

### Selected Solution: Synchronize staging-deploy.yml with e2e-sharded.yml

**Justification**: The e2e-sharded workflow is proven to work in production PR testing. The staging-deploy workflow should use the same configuration to ensure consistency. This is the simplest, lowest-risk fix that directly addresses the root cause.

**Technical Approach**:

1. Add missing environment variables to test-shards job env block
2. Add "Run Payload CMS migrations" step before E2E tests
3. Update Supabase key extraction to use `eval "$(supabase status -o env)"` for robustness
4. Export E2E_ prefixed Supabase keys for test compatibility
5. Ensure all test user credentials are passed from secrets

**Architecture Changes**: None - this is a configuration fix, not an architectural change

**Migration Strategy**: Not needed - this is a bug fix with no data/schema implications

## Implementation Plan

### Affected Files

- `.github/workflows/staging-deploy.yml` - Update test-shards job configuration and add missing steps

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update test-shards job environment variables

Add missing environment variables to the `test-shards` job env block to match e2e-sharded.yml (lines 222-266):

- Add Supabase URL and database URLs
- Add E2E test user credentials from secrets
- Add Payload CMS configuration
- Add billing provider configuration
- Add EMAIL_SENDER for Zod schema validation

**Why this step first**: Environment variables must be available before steps execute

#### Step 2: Add "Run Payload CMS migrations" step

Insert new step after Supabase service startup (after current step at line 258) to run Payload CMS migrations:

```yaml
- name: Run Payload CMS migrations
  run: |
    echo "🔄 Running Payload CMS migrations..."
    pnpm --filter payload payload migrate --forceAcceptWarning
    echo "✅ Payload CMS migrations complete"
  env:
    DATABASE_URI: postgresql://postgres:postgres@localhost:54522/postgres
    PAYLOAD_SECRET: 'test_payload_secret_for_e2e_testing'
```

**Why this step**: Creates required Payload CMS tables before E2E tests run

#### Step 3: Update Supabase key extraction to use robust method

Replace the current grep/awk key extraction (lines 260-273) with the robust `eval "$(supabase status -o env)"` method used in e2e-sharded.yml (lines 399-431):

- Use `eval "$(supabase status -o env)"` to extract keys
- Export both regular and E2E_ prefixed variables
- Add verification checks
- Export E2E_LOCAL_SUPABASE=true flag

**Why this step**: Current grep/awk parsing is fragile and doesn't extract ES256 keys correctly

#### Step 4: Remove redundant environment variable exports from test-setup job

The test-setup job should not export Supabase keys since each test-shards job needs fresh keys from its own Supabase instance. Verify test-setup job doesn't interfere with test-shards job's key extraction.

#### Step 5: Validate configuration matches e2e-sharded.yml

Compare the updated test-shards job in staging-deploy.yml with e2e-shards job in e2e-sharded.yml to ensure:
- All environment variables are present
- All setup steps are in correct order
- Key extraction uses same robust method
- Payload CMS migration step is included
- E2E_ prefixed variables are exported

## Testing Strategy

### Unit Tests

Not applicable - this is a workflow configuration fix, not code changes.

### Integration Tests

Not applicable - this is a workflow configuration fix.

### E2E Tests

**Manual testing checklist**:

Execute these tests before considering the fix complete:

- [ ] Push to staging branch triggers deploy workflow
- [ ] Workflow reaches test-shards job without failure
- [ ] Supabase starts successfully with all services
- [ ] Payload CMS migrations run successfully (creates payload.* tables)
- [ ] E2E test user credentials load from secrets
- [ ] Supabase keys are extracted correctly (E2E_ prefixed variables available)
- [ ] All 12 shards run E2E tests
- [ ] Tests pass (or fail for legitimate reasons, not configuration issues)
- [ ] Test results upload successfully
- [ ] No errors about "relation payload.users does not exist"
- [ ] No errors about missing environment variables
- [ ] No errors about undefined JWT keys

### Validation Commands

#### Before Fix (Workflow Should Fail)

```bash
# Manually trigger staging deploy or push to staging branch
# Observe: test-shards job fails with missing environment errors
gh run view <run-id> --repo slideheroes/2025slideheroes

# Check for specific errors in logs:
# - "relation payload.users does not exist"
# - "Failed to extract JWT keys"
# - "Missing environment variable"
```

**Expected Result**: E2E tests fail due to missing configuration

#### After Fix (Workflow Should Succeed)

```bash
# Push a test commit to staging branch
git push origin dev:staging

# Monitor the workflow run
gh run watch <run-id> --repo slideheroes/2025slideheroes

# Verify test-shards job completes
gh run view <run-id> --repo slideheroes/2025slideheroes --json jobs --jq '.jobs[] | select(.name | contains("E2E Shard"))'

# Check logs for successful setup
gh run view <run-id> --repo slideheroes/2025slideheroes --log-status
```

**Expected Result**: All validation commands succeed, test-shards completes with E2E tests running

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Incorrect environment variable values**: If test credentials or secrets are misconfigured
   - **Likelihood**: low
   - **Impact**: medium (tests fail but don't break anything)
   - **Mitigation**: Copy exact variable names from e2e-sharded.yml; validate in code review

2. **Payload CMS migration incompatibility**: If Payload version differs between environments
   - **Likelihood**: low
   - **Impact**: medium (tests fail but don't break anything)
   - **Mitigation**: Payload version is locked in package.json; migration command is identical to working setup

3. **Port conflicts**: If Supabase or app ports are already in use
   - **Likelihood**: very low (RunsOn runners are fresh)
   - **Impact**: low (just restart services)
   - **Mitigation**: Existing wait-on and health check logic handles this

**Rollback Plan**:

If this fix causes issues in staging tests:

1. Revert the changes to `.github/workflows/staging-deploy.yml`
2. Push to staging branch to re-trigger workflow with old config
3. Tests revert to previous failure state
4. Investigate what went wrong in fix code review

**Monitoring** (if needed):

After fix is deployed:
- Monitor staging workflow run times (should be similar to before)
- Monitor test pass rate (should improve from current failure rate)
- Watch for new error patterns in logs

## Performance Impact

**Expected Impact**: none

The configuration changes do not affect performance. The Payload CMS migration step adds ~2-5 seconds to overall workflow time, which is negligible in the 15-minute timeout.

## Security Considerations

**Security Impact**: none

- All test credentials come from GitHub Secrets (not hardcoded)
- Test Payload secret is a test-only value
- No production data affected
- No new secrets introduced

**Security review needed**: no

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Monitor the current failing workflow
gh run view https://github.com/slideheroes/2025slideheroes/actions/runs/21368444612

# Expected: test-shards matrix jobs fail with one of these:
# - "relation payload.users does not exist"
# - "Failed to extract JWT keys"
# - Missing environment variable errors
```

**Expected Result**: E2E test-shards jobs fail

### After Fix (Bug Should Be Resolved)

```bash
# Push a test commit to staging to trigger workflow
git checkout staging
git pull origin staging
git commit --allow-empty -m "test: trigger staging deploy workflow"
git push origin staging

# Wait for workflow to complete
gh run watch --repo slideheroes/2025slideheroes

# Verify test-shards jobs complete successfully
gh run view <run-id> --repo slideheroes/2025slideheroes --json jobs \
  --jq '.jobs[] | select(.name | contains("E2E Shard")) | {name: .name, conclusion: .conclusion}'

# Expected output shows: conclusion: "success" for all shards
```

**Expected Result**: All test-shards matrix jobs succeed (or pass E2E test execution)

### Regression Prevention

```bash
# Run full validation on the updated workflow file
pnpm lint

# Type check (if applicable)
pnpm typecheck

# No tests to run (workflow validation happens via GitHub Actions)
```

## Dependencies

### New Dependencies

No new dependencies required. The fix uses existing tooling:
- GitHub Actions (already available)
- pnpm (already available)
- Supabase CLI (already available)
- Payload CMS (already installed)

**No new dependencies needed**

## Database Changes

**Database changes needed**: no

The Payload CMS migration runs within the E2E test environment (local Supabase Docker container). No production database changes needed.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: none

**Feature flags needed**: no

**Backwards compatibility**: maintained

This fix only updates the staging deploy workflow. No changes to production code or dependencies. Staging environment will continue to work after fix, just with better E2E test support.

## Success Criteria

The fix is complete when:

- [ ] `.github/workflows/staging-deploy.yml` test-shards job environment matches e2e-shards job environment
- [ ] "Run Payload CMS migrations" step added to test-shards job
- [ ] Supabase key extraction uses robust `eval "$(supabase status -o env)"` method
- [ ] E2E_ prefixed variables are exported from keys
- [ ] E2E_LOCAL_SUPABASE flag is exported
- [ ] Code review approved
- [ ] Next staging deploy workflow completes successfully
- [ ] All test-shards matrix jobs (1-12) complete or run E2E tests
- [ ] No errors about missing environment variables
- [ ] No errors about missing database relations
- [ ] No errors about undefined JWT keys

## Notes

**Key differences between workflows**:

The e2e-sharded.yml workflow is designed for PR validation with matrix jobs that run in parallel. The staging-deploy.yml workflow is designed for pre-production validation before deployment. Both need the same E2E test setup, which is what this fix provides.

**Related issues**:

- #1626 - E2E_ prefix requirement for Supabase keys
- #1636, #1637 - E2E test user credentials requirement
- #1813, #1814 - Payload CMS migrations requirement
- #1583, #1584 - Server startup configuration
- #1631, #1632 - Health check timing

**Testing**:

The best way to verify this fix works is to:
1. Merge the fix to dev
2. Merge dev to staging
3. Observe that staging-deploy workflow E2E tests complete successfully
4. Compare test results with e2e-sharded workflow runs (should be similar)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1825*
