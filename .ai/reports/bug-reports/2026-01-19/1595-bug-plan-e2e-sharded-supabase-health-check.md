# Bug Fix: E2E Sharded Workflow Supabase Health Check and Startup

**Related Diagnosis**: #1594
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Silent failure masking (`|| true`) and inadequate health checks allow tests to run against non-functional Supabase instances
- **Fix Approach**: Replace CLI status check with actual network connectivity verification and remove error masking
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The e2e-sharded workflow fails because each shard runs on a separate machine and attempts to start Supabase, but the `|| true` operator silently masks startup failures. The health check only verifies that `supabase status` outputs "Project URL" (which can be cached state), not that Supabase services are actually responding on ports 54521/54522.

For full details, see diagnosis issue #1594.

### Solution Approaches Considered

#### Option 1: Fix Health Check + Remove Error Masking ⭐ RECOMMENDED

**Description**: Replace the inadequate CLI status check with actual HTTP and database connectivity verification, and remove the silent failure masking to fail fast when Supabase cannot start.

**Pros**:
- Surgical fix with minimal code changes
- Fails fast instead of wasting time on broken tests
- Verifies actual service availability, not just CLI state
- Low risk - only affects startup validation logic
- Easy to test and validate

**Cons**:
- Requires adding `curl` and `pg_isready` commands (already available in runners)
- May expose underlying Supabase startup issues that were previously masked

**Risk Assessment**: low - This is a validation-only change that makes failures explicit instead of hidden

**Complexity**: simple - Modify one workflow step with straightforward bash commands

#### Option 2: Single Shared Supabase Service

**Description**: Run Supabase once in the setup-server job and make it accessible to all e2e-shard jobs through network sharing or RunsOn features.

**Pros**:
- Eliminates per-shard startup overhead
- Guarantees consistent Supabase instance across all tests
- Potentially faster overall execution

**Cons**:
- Significant architectural change
- RunsOn network sharing between machines may not be supported/reliable
- Shared state could cause test pollution issues
- More complex rollback if issues arise
- Would need database reset between shards

**Why Not Chosen**: Too complex for the immediate problem. The current per-shard isolation is actually desirable for test independence. Option 1 fixes the real issue (silent failures) without architectural changes.

#### Option 3: Pre-warmed Docker Images with Faster Startup

**Description**: Cache Supabase Docker images and pre-pull them in setup-server to reduce startup time across shards.

**Pros**:
- Faster Supabase startup on each shard
- Reduces likelihood of timeout issues
- Improves overall workflow performance

**Cons**:
- Doesn't address the root cause (silent failures)
- Adds complexity with image caching
- Still vulnerable to startup failures, just faster failures
- Requires managing cache invalidation

**Why Not Chosen**: This is an optimization, not a fix. The real problem is that failures are masked, not that startup is slow. Option 1 should be implemented first, then this can be considered as a performance optimization.

### Selected Solution: Fix Health Check + Remove Error Masking

**Justification**: This approach directly addresses the root cause (silent failure masking and inadequate validation) with minimal risk and complexity. It makes the workflow fail fast and explicitly when Supabase isn't working, rather than wasting time running tests that will inevitably fail. The fix is surgical, testable, and doesn't require architectural changes.

**Technical Approach**:
1. Remove `|| true` from `supabase start` command to propagate failures
2. Replace `supabase status | grep "Project URL"` check with actual HTTP connectivity test
3. Add database connectivity verification with `pg_isready`
4. Implement exponential backoff retry logic for transient startup issues
5. Add clear error messages when startup fails

**Architecture Changes**: None - this is a validation improvement only

**Migration Strategy**: Not applicable - backward compatible change

## Implementation Plan

### Affected Files

- `.github/workflows/e2e-sharded.yml` (lines 189-205) - Replace Supabase startup and health check logic with proper validation

### New Files

None required - all changes are inline in the workflow file

### Step-by-Step Tasks

#### Step 1: Remove Silent Failure Masking

Replace line 193 in `.github/workflows/e2e-sharded.yml`:

```yaml
# BEFORE (line 193)
supabase start --ignore-health-check || true

# AFTER
supabase start --ignore-health-check
```

**Why this step first**: We need failures to propagate so the workflow fails fast instead of continuing with broken infrastructure

#### Step 2: Implement Proper Health Check with Connectivity Verification

Replace lines 195-202 with actual connectivity checks:

```yaml
# Wait for Supabase API to be responsive
echo "⏳ Waiting for Supabase API to become responsive..."
for i in {1..30}; do
  if curl -sf http://127.0.0.1:54521/rest/v1/ \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" > /dev/null 2>&1; then
    echo "✅ Supabase API responding (attempt $i/30)"
    break
  fi

  if [ $i -eq 30 ]; then
    echo "❌ Supabase API failed to respond after 30 attempts (60 seconds)"
    echo "Last status output:"
    supabase status || true
    echo "Docker containers:"
    docker ps -a | grep supabase || true
    exit 1
  fi

  echo "⏳ Waiting for Supabase API... (attempt $i/30)"
  sleep 2
done

# Verify database is also accessible
echo "⏳ Verifying PostgreSQL database connectivity..."
if command -v pg_isready > /dev/null 2>&1; then
  if pg_isready -h localhost -p 54522 -U postgres -t 10; then
    echo "✅ PostgreSQL database is ready"
  else
    echo "❌ PostgreSQL database is not responding"
    exit 1
  fi
else
  echo "⚠️  pg_isready not available, skipping database connectivity check"
fi

echo "✅ Supabase stack is fully operational"
```

**Why this approach**:
- HTTP check verifies the API Gateway (Kong) is responding
- Database check verifies PostgreSQL is accessible
- 30 attempts with 2-second intervals = 60 seconds total wait time
- Detailed error output for debugging when failures occur
- Graceful fallback if `pg_isready` isn't available

#### Step 3: Add Diagnostic Output on Failure

The health check in Step 2 already includes diagnostic output:
- `supabase status` output
- `docker ps` to show container states
- Clear error messages indicating which service failed

#### Step 4: Test the Fix

Manually verify the fix works:

```bash
# Test the health check logic locally
cd apps/e2e
supabase start

# Test HTTP connectivity
curl -sf http://127.0.0.1:54521/rest/v1/ \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"

# Test database connectivity
pg_isready -h localhost -p 54522 -U postgres

# Clean up
supabase stop
```

#### Step 5: Validate in CI

Trigger the e2e-sharded workflow and verify:
- All shards can start Supabase successfully
- Health checks pass with actual connectivity
- Tests run without ECONNREFUSED errors
- Failed startups fail fast with clear error messages

## Testing Strategy

### Unit Tests

No unit tests required - this is infrastructure/workflow configuration.

### Integration Tests

The e2e-sharded workflow itself serves as the integration test:
- Each shard must successfully start Supabase
- Tests must be able to connect to Supabase
- No ECONNREFUSED errors should occur

### E2E Tests

The fix enables E2E tests to run properly. Manual verification:
- ✅ Shard 1 passes
- ✅ Shard 2 passes
- ✅ Shard 3 passes
- ✅ All 12 shards complete successfully

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Trigger e2e-sharded workflow manually with default settings
- [ ] Verify all shards pass health check within 60 seconds
- [ ] Verify all shards can connect to Supabase (no ECONNREFUSED)
- [ ] Check workflow logs show "✅ Supabase stack is fully operational" for each shard
- [ ] Verify tests execute without Supabase connection errors
- [ ] Test with max_parallel=6 (higher concurrency stress test)
- [ ] Intentionally break Supabase startup (comment out docker service) to verify fail-fast behavior
- [ ] Verify error messages are clear and actionable when startup fails

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Supabase startup timing variability**: Different machines may take longer to start Docker services
   - **Likelihood**: medium
   - **Impact**: low (60-second timeout should be sufficient)
   - **Mitigation**: 30 retry attempts with 2-second intervals provides generous buffer; can increase timeout if needed

2. **Missing dependencies**: `curl` or `pg_isready` might not be available on runners
   - **Likelihood**: very low (both are standard utilities)
   - **Impact**: medium (health check would fail)
   - **Mitigation**: `curl` is definitely available on GitHub/RunsOn runners; `pg_isready` check has graceful fallback if not available

3. **False negatives**: Health check might pass but tests still fail
   - **Likelihood**: low (we're checking actual service endpoints)
   - **Impact**: medium (tests would still fail, but at least we'd know Supabase is running)
   - **Mitigation**: HTTP check verifies Kong API, database check verifies PostgreSQL - covers both critical services

**Rollback Plan**:

If this fix causes issues:
1. Revert the workflow file change via PR
2. Re-add `|| true` to restore silent failure behavior
3. Workflow immediately returns to previous (broken but non-blocking) state
4. Investigate what specific startup issue was revealed by the fix

**Monitoring**:
- Watch e2e-sharded workflow success rate for 1 week after deployment
- Monitor for new failures related to health check timeouts
- Track Supabase startup time across shards (available in workflow logs)

## Performance Impact

**Expected Impact**: minimal - adds 2-10 seconds for health check validation

The health check will typically complete in 2-4 seconds (first retry succeeds). In worst case, it waits up to 60 seconds before failing. This is significantly better than the current behavior where tests run for 2+ minutes before timing out.

**Performance Testing**:
- Measure time from "Start local Supabase" to "✅ Supabase stack is fully operational"
- Compare workflow duration before and after fix
- Expected: No significant change in successful runs, 1.5-2 minute improvement in failed runs (fail fast)

## Security Considerations

**Security Impact**: none

This change only affects startup validation logic. No security-sensitive operations are modified.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Clone repo and check out branch with bug
git checkout dev
cd apps/e2e

# Start Supabase
supabase start

# Check status (this would show "ready" even if services aren't responding)
supabase status | grep "Project URL"
```

**Expected Result**: Status check passes even if services aren't fully operational

### After Fix (Bug Should Be Resolved)

```bash
# Apply the fix
git checkout <fix-branch>

# Run workflow via GitHub Actions or test locally
gh workflow run e2e-sharded.yml --ref <fix-branch>

# Or test health check logic locally
cd apps/e2e
supabase start

# Test HTTP connectivity (from fix)
curl -sf http://127.0.0.1:54521/rest/v1/ \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"

# Test database connectivity (from fix)
pg_isready -h localhost -p 54522 -U postgres

# All validation commands
# (No typecheck/lint needed - workflow file only)

# Manual verification
gh run list --workflow=e2e-sharded.yml --limit 5
gh run view <run-id> --log
```

**Expected Result**:
- All shards pass health check
- No ECONNREFUSED errors in logs
- All 12 shards complete successfully
- Clear error messages if startup fails

### Regression Prevention

```bash
# Run full e2e-sharded workflow
gh workflow run e2e-sharded.yml

# Monitor for 1 week
gh run list --workflow=e2e-sharded.yml --limit 20

# Verify success rate > 90%
# (Some failures expected due to flaky tests, but not infrastructure)
```

## Dependencies

**No new dependencies required**

Both `curl` and `pg_isready` are standard utilities available on GitHub Actions and RunsOn runners.

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

This is a workflow file change that takes effect immediately when merged to any branch.

**Special deployment steps**:
- Merge PR to dev branch first
- Trigger e2e-sharded workflow manually to validate
- Monitor 2-3 runs to ensure stability
- Then merge to staging/main

**Feature flags needed**: no

**Backwards compatibility**: maintained (workflow-only change)

## Success Criteria

The fix is complete when:
- [ ] All 12 e2e-shards pass health check within 60 seconds
- [ ] No ECONNREFUSED errors appear in workflow logs
- [ ] All shards successfully connect to Supabase and run tests
- [ ] Failed Supabase startups fail fast with clear error messages
- [ ] Workflow success rate improves to >90% (from current ~10-20%)
- [ ] No increase in workflow duration for successful runs
- [ ] Manual testing checklist complete

## Notes

### Alternative Performance Optimization

After this fix is validated, consider implementing Option 3 (Pre-warmed Docker Images) as a follow-up optimization:

```yaml
# In setup-server job, cache Supabase images
- name: Cache Supabase Docker images
  uses: actions/cache@v4
  with:
    path: |
      ~/.cache/supabase/cli
      ~/.cache/docker
    key: supabase-images-${{ hashFiles('apps/e2e/supabase/config.toml') }}
```

This would reduce startup time from 10-15 seconds to 2-3 seconds per shard, but should be done AFTER the health check fix is validated.

### Related Issues

- #1583: Previous e2e-sharded webserver startup issues (fixed)
- #1584: E2E Sharded No Webserver bug fix (related pattern)
- #1569, #1570: Similar infrastructure diagnosis and fix

### Documentation References

- CI/CD Pipeline: `.ai/ai_docs/context-docs/infrastructure/ci-cd-complete.md`
- Docker Setup: `.ai/ai_docs/context-docs/infrastructure/docker-setup.md`
- Docker Troubleshooting: `.ai/ai_docs/context-docs/infrastructure/docker-troubleshooting.md`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1594*
