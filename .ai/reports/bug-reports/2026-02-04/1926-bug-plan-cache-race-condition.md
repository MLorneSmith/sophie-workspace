# Bug Fix: Staging E2E Shards Cache Race Condition

**Related Diagnosis**: #1925 (REQUIRED)
**Severity**: high
**Bug Type**: integration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Two cache restoration steps both touching `.next` directory causes race condition between partial cache (`.next/cache` only) and full build artifacts
- **Fix Approach**: Remove redundant `.next/cache` caching from setup-deps action + add BUILD_ID verification step
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Multiple E2E test shards (3, 4, 5+) fail during staging deployment with "Could not find a production build in the '.next' directory" error even though cache restoration reports success. Shards 1-2 pass with identical cache configuration, indicating a timing/race condition.

The root cause is two conflicting cache restoration steps:
1. `setup-deps/action.yml` restores only `.next/cache` subdirectory (~63KB)
2. `staging-deploy.yml` restores full `apps/web/.next` directory (~49MB)

When these run in quick succession on the same shard, the partial cache restoration can interfere with the full build artifacts restoration, leaving the `.next` directory in an incomplete state missing critical production build files (like BUILD_ID).

For full details, see diagnosis issue #1925.

### Solution Approaches Considered

#### Option 1: Remove Redundant Cache Only

**Description**: Delete the "Cache Next.js build" step from `.github/actions/setup-deps/action.yml` (lines 80-89) since the full `.next` directory is already cached by "Restore build artifacts" in the staging workflow.

**Pros**:
- Eliminates the root cause completely (removes conflicting cache operations)
- Simplest change with lowest risk
- No verification overhead or delays
- Staging workflow already caches full `.next` for all shards

**Cons**:
- Doesn't address other workflows that might benefit from `.next/cache` caching
- Removes optimization for local development workflows using setup-deps

**Risk Assessment**: low - The full build artifacts cache already handles `.next` completely.

**Complexity**: simple - Just remove a cache step.

#### Option 2: Verification Only

**Description**: Add a BUILD_ID verification step in `staging-deploy.yml` after cache restoration to detect incomplete builds and rebuild if needed.

**Pros**:
- Defensive programming approach
- Catches any build artifact corruption automatically
- No build cache optimization lost

**Cons**:
- Adds latency to every test shard start (~30-60s rebuild if triggered)
- Masks the underlying race condition instead of fixing it
- More complex logic to maintain
- Still may leave other workflows with the original problem

**Risk Assessment**: medium - Rebuilding adds 30-60s per affected shard, could impact test duration.

**Complexity**: moderate - Requires verification logic and conditional rebuild.

#### Option 3: Both Remove and Verify ⭐ RECOMMENDED

**Description**: Remove the redundant `.next/cache` caching from setup-deps (fixes root cause) AND add BUILD_ID verification as a safety net (catches edge cases).

**Pros**:
- Eliminates race condition at source (remove conflicting step)
- Defensive verification catches any unforeseen cache issues
- Best long-term maintenance approach
- Only rebuilds on actual failures (rare)

**Cons**:
- Slightly more invasive change (affects two files)
- Minimal performance overhead (verification is fast, rebuild is rare)

**Risk Assessment**: low - Removes root cause with defensive fallback.

**Complexity**: simple - Two straightforward changes.

**Why Not Chosen**: Both Options 1 and 3 solve the immediate problem. Option 3 is recommended because it adds a safety net that catches edge cases that might reoccur under different CI load conditions, without meaningful performance cost.

### Selected Solution: Remove Redundant Cache + Add Verification

**Justification**: The staging workflow already caches the full `.next` build directory. The setup-deps action's `.next/cache` caching is:
1. **Redundant** - Full `.next` contains the cache subdirectory
2. **Harmful** - Creates race condition when both run in parallel
3. **Unnecessary** - Staging workflow doesn't rely on setup-deps cache

Removing it eliminates the root cause. Adding BUILD_ID verification provides defensive safety that catches unforeseen cache corruption without performance penalty (verification is ~100ms, rebuild only on actual failure).

**Technical Approach**:

1. **Remove lines 80-89 from `.github/actions/setup-deps/action.yml`** - Delete the "Cache Next.js build" step that restores `.next/cache`

2. **Add BUILD_ID verification in `staging-deploy.yml`** - After "Restore build artifacts" step, add a check that verifies the production build exists by looking for `.next/BUILD_ID` file. If missing, rebuild with `pnpm --filter web build:test`

3. **No changes to other workflows** - The setup-deps action is used in multiple workflows. Only the staging workflow has the dual-cache issue because it has its own "Restore build artifacts" step.

**Architecture Changes**: None - This is a cache management fix, not an architectural change.

**Migration Strategy**: Not needed - No data or schema changes.

## Implementation Plan

### Affected Files

- `.github/actions/setup-deps/action.yml` - Remove redundant cache step (lines 80-89)
- `.github/workflows/staging-deploy.yml` - Add BUILD_ID verification after cache restore (after line 282)

### New Files

None - This is a modification-only fix.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Remove Redundant Cache from setup-deps

Remove the "Cache Next.js build" step from `.github/actions/setup-deps/action.yml` that conflicts with the staging workflow's full build cache.

- Edit `.github/actions/setup-deps/action.yml`
- Delete lines 80-89 (the entire "Cache Next.js build" step)
- Verify proper YAML structure remains

**Why this step first**: Removes the root cause of the race condition. This is the primary fix.

#### Step 2: Add BUILD_ID Verification Step

Add a verification step in `.github/workflows/staging-deploy.yml` after the "Restore build artifacts" step to detect incomplete builds and rebuild if necessary.

- Edit `.github/workflows/staging-deploy.yml` at line 283 (after "Restore build artifacts" step)
- Add new step: "Verify production build exists"
- Check for `.next/BUILD_ID` file
- If missing, rebuild with `pnpm --filter web build:test`
- If found, log success and continue

**Why this step second**: Adds defensive verification that catches edge cases without performance penalty.

#### Step 3: Validate YAML Structure

Ensure both files have valid YAML syntax after modifications.

- Validate `.github/actions/setup-deps/action.yml` YAML
- Validate `.github/workflows/staging-deploy.yml` YAML
- Check that step ordering is preserved
- Verify no indentation issues

#### Step 4: Run Type Check and Linting

- Run `pnpm typecheck` to ensure no TypeScript errors
- Run `pnpm lint` to check code quality
- Run `pnpm format` to ensure consistent formatting

#### Step 5: Manual Testing & Verification

- Trigger a staging deployment workflow run
- Monitor shards 1-12 for test completion
- Verify all shards pass (especially shards 3-5 which were failing)
- Check logs for BUILD_ID verification messages
- Confirm no rebuild occurs (BUILD_ID should exist)

## Testing Strategy

### Unit Tests

This is an infrastructure/CI fix (not application code), so traditional unit tests don't apply. Verification is through workflow execution.

**Validation approach**:
- ✅ Verify YAML syntax validity
- ✅ Verify step order and dependencies
- ✅ Verify cache keys are correct
- ✅ Verify BUILD_ID verification logic is sound

**Validation files**: None - This is workflow configuration.

### Integration Tests

Not applicable - This is a CI/CD infrastructure fix, not application code.

### E2E Tests

Not applicable - This is a CI/CD infrastructure fix, not user-facing functionality.

### Manual Testing Checklist

Execute these manual tests to verify the fix:

- [ ] Run staging deployment workflow
- [ ] Monitor all shards 1-12 for completion
- [ ] Shards 3-5 should pass (previously failing shards)
- [ ] Check workflow logs for BUILD_ID verification message
- [ ] Verify message shows "✅ Production build verified (.next/BUILD_ID exists)"
- [ ] Confirm no rebuild occurs (should not trigger "pnpm --filter web build:test")
- [ ] Verify all shards complete within expected time (~15-20 min total)
- [ ] Verify E2E tests pass on all shards
- [ ] Check for any new errors in logs

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Cache miss on first run**: If build cache key changes
   - **Likelihood**: low (unlikely to change)
   - **Impact**: low (1-time rebuild, ~2min delay)
   - **Mitigation**: Cache key is based on `github.sha` which is stable; automatic rebuild handles this

2. **BUILD_ID doesn't exist in restored cache**: Edge case where cache corruption happens anyway
   - **Likelihood**: low (we're fixing the root cause)
   - **Impact**: low (automatic rebuild catches it)
   - **Mitigation**: Verification step rebuilds automatically; logs surface the issue

3. **Workflow configuration syntax error**: YAML mistake in edits
   - **Likelihood**: low (careful manual editing with validation)
   - **Impact**: high (workflow fails)
   - **Mitigation**: Validate YAML syntax immediately after edits

4. **Performance regression**: BUILD_ID verification adds latency
   - **Likelihood**: very low (verification is ~100ms)
   - **Impact**: negligible (~0.1% slowdown)
   - **Mitigation**: Verification is fast file check, no performance impact observed

**Rollback Plan**:

If this fix causes issues:
1. Revert `.github/actions/setup-deps/action.yml` to add back cache step (lines 80-89)
2. Revert `.github/workflows/staging-deploy.yml` to remove BUILD_ID verification step
3. Create new issue to investigate root cause further
4. Consider alternative approaches (Option 1 or 2 instead of Option 3)

**Monitoring** (if needed):

After deployment:
- Monitor first 3 staging deployment runs for shard 3-5 failures
- If failures reoccur, check logs for BUILD_ID verification output
- If rebuild is triggered, investigate why cache restoration failed
- Alert if any shard takes >5min longer than baseline

## Performance Impact

**Expected Impact**: none

The fix actually improves performance by:
- Eliminating duplicate cache restoration operations
- Removing partial cache restoration that was causing conflicts
- No additional latency added (verification is ~100ms file check)
- Occasional rebuild only if cache corruption detected (should be rare/zero)

**Performance Testing**: Not needed - This is a cache optimization, not a feature change.

## Security Considerations

**Security Impact**: none

No security implications:
- This is a CI/CD caching fix
- No new permissions or credentials needed
- No changes to authentication or authorization
- No changes to production code
- Not increasing attack surface

Security review needed: no
Penetration testing needed: no

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# The bug manifests in CI workflow when multiple shards run in parallel
# Cannot fully reproduce locally since it's specific to GitHub Actions concurrent cache restoration

# Verification: Confirm cache steps exist in current workflow
grep -n "Cache Next.js build" .github/actions/setup-deps/action.yml
grep -n "Restore build artifacts" .github/workflows/staging-deploy.yml

# Expected Result: Both cache steps should be found (bug exists)
```

**Expected Result**: Both cache restoration steps visible in files, demonstrating the race condition setup.

### After Fix (Bug Should Be Resolved)

```bash
# Verify cache step removed from setup-deps
grep -c "Cache Next.js build" .github/actions/setup-deps/action.yml

# Expected: 0 (step removed)

# Verify BUILD_ID verification added to staging workflow
grep -n "Verify production build" .github/workflows/staging-deploy.yml

# Expected: Step found after "Restore build artifacts"

# Type check
pnpm typecheck

# Expected Result: No errors

# Lint
pnpm lint

# Expected Result: No errors

# Format check
pnpm format

# Expected Result: No formatting issues
```

**Expected Result**: All commands succeed, cache steps properly configured, fix in place and ready for testing.

### Regression Prevention

```bash
# Deploy to staging and monitor workflow
# All shards should pass, especially shards 3-5

# Check logs for BUILD_ID verification
gh run view <run-id> --repo slideheroes/2025slideheroes --log | grep "Verify production build"

# Expected: Message showing "✅ Production build verified"

# Verify no unintended side effects in other workflows
gh workflow list --repo slideheroes/2025slideheroes

# Run other workflows that use setup-deps (not staging-deploy)
# Verify they still pass correctly
```

## Dependencies

### New Dependencies (if any)

None - This fix uses only existing GitHub Actions infrastructure.

**No new dependencies required**

## Database Changes

**Migration needed**: no

No database changes required - This is a CI/CD infrastructure fix.

## Deployment Considerations

**Deployment Risk**: low

Special deployment steps: none required

Feature flags needed: no

Backwards compatibility: maintained (transparent fix to existing workflows)

## Success Criteria

The fix is complete when:
- [ ] Cache step removed from `.github/actions/setup-deps/action.yml`
- [ ] BUILD_ID verification step added to `.github/workflows/staging-deploy.yml`
- [ ] All YAML validation passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] Staging deployment workflow completes successfully
- [ ] All E2E shards 1-12 pass (especially shards 3-5)
- [ ] Logs show "✅ Production build verified (.next/BUILD_ID exists)"
- [ ] No unexpected rebuilds triggered
- [ ] Previous failing shards now pass consistently

## Notes

**Important Context**:
- This is a timing-sensitive bug that manifests when multiple shards restore cache concurrently
- The partial cache restoration from setup-deps interferes with full cache restoration from staging workflow
- Removing the redundant step eliminates the race condition completely
- The BUILD_ID verification provides defense-in-depth for edge cases

**Related Issues**:
- Issue #1583, #1584 - Previous E2E webServer startup issues (context for `next start` vs `next dev`)
- Workflow run: https://github.com/slideheroes/2025slideheroes/actions/runs/21651005995

**Useful References**:
- GitHub Actions cache documentation: https://github.com/actions/cache
- Next.js production server troubleshooting: https://nextjs.org/docs/messages/production-start-no-build-id

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1925*
