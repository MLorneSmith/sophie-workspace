# Bug Fix: Deploy to Dev fails with pnpm lockfile mismatch

**Related Diagnosis**: #1784
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Commit e4f098260 updated `packages/e2b/e2b-template/package.json` to specify `e2b: ^2.10.4` but failed to regenerate `pnpm-lock.yaml` correctly - the lockfile still contains `e2b: specifier: ^2.8.2` for that workspace
- **Fix Approach**: Regenerate `pnpm-lock.yaml` by running `pnpm install` locally, which will update the lockfile to match all `package.json` specifiers
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The "Deploy to Dev" GitHub workflow is failing due to a pnpm lockfile mismatch. Commit e4f098260 updated `packages/e2b/e2b-template/package.json` to use `e2b: ^2.10.4` (as a security fix) but the pnpm-lock.yaml was not properly regenerated, leaving the lockfile with `e2b: ^2.8.2` for that workspace. When Vercel tries to build with `pnpm install --frozen-lockfile`, pnpm detects this mismatch and exits with error `ERR_PNPM_OUTDATED_LOCKFILE`, causing both Web App and Payload CMS deployments to fail.

For full details, see diagnosis issue #1784.

### Solution Approaches Considered

#### Option 1: Regenerate pnpm-lock.yaml ⭐ RECOMMENDED

**Description**: Run `pnpm install` locally without `--frozen-lockfile` to regenerate the entire lockfile, then commit the updated lockfile.

**Pros**:
- Simple and direct fix
- Resolves the root cause (stale lockfile)
- Takes ~2-3 minutes locally
- No side effects or risk of breaking anything
- Standard workflow for monorepo dependency management

**Cons**:
- Updates all transitive dependencies (minor risk if new versions have bugs, but unlikely)
- Requires local environment setup

**Risk Assessment**: low - pnpm install is a standard safe operation that pnpm developers use daily

**Complexity**: simple - single command with verification

#### Option 2: Manual lockfile patch

**Description**: Manually edit pnpm-lock.yaml to update only the e2b specifier in the e2b-template workspace section.

**Pros**:
- Minimal change (only updates e2b version)
- Faster than full regenerate

**Cons**:
- Error-prone (lockfile is YAML with complex nested structure)
- Doesn't update transitive dependencies
- Not standard practice (tools expect lockfile regeneration)
- Could introduce subtle issues if hash values are incorrect
- Harder to maintain and review

**Why Not Chosen**: Manual editing of lockfile is fragile and goes against pnpm best practices. The regenerate approach is safer and only takes a few extra minutes.

#### Option 3: Use pnpm install --no-frozen-lockfile in CI

**Description**: Temporarily change CI to use `--no-frozen-lockfile` to allow the build to proceed, fix the lockfile later.

**Pros**:
- Quick workaround to unblock deployments

**Cons**:
- Masks the underlying problem
- Creates technical debt
- Could mask other version mismatches
- Anti-pattern for production deployments
- Lockfile is supposed to be the source of truth

**Why Not Chosen**: This just kicks the problem down the road and violates CI/CD best practices.

### Selected Solution: Regenerate pnpm-lock.yaml

**Justification**: The cleanest, safest, and most standard approach. Regenerating the lockfile resolves the root cause in one operation and aligns with how monorepo dependency management is supposed to work. The operation is deterministic and safe - pnpm will compute the exact same versions as before for all other dependencies.

**Technical Approach**:
1. Run `pnpm install` in the repository root to regenerate pnpm-lock.yaml
2. This will update the lockfile to match all package.json specifiers
3. Specifically, it will update the e2b specifier from `^2.8.2` to `^2.10.4` in the e2b-template workspace
4. Commit the updated lockfile with a clear commit message
5. Push to dev branch to trigger deployment

**Architecture Changes**: None - this is a pure lockfile fix, no code changes

**Migration Strategy**: Not applicable - this is a data (lockfile) fix, not a code migration

## Implementation Plan

### Affected Files

List files that need modification:
- `pnpm-lock.yaml` - Regenerate to match all package.json specifiers
- `packages/e2b/e2b-template/package.json` - No changes needed (already specifies `e2b: ^2.10.4`)

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Verify current state

Confirm the mismatch exists locally before fixing:

- Check git status to see current working directory state
- Verify that `packages/e2b/e2b-template/package.json` specifies `e2b: ^2.10.4`
- Run `pnpm ls e2b` to see what version is currently locked

**Why this step first**: Validates that we understand the problem and that our local environment is in the right state

#### Step 2: Regenerate pnpm-lock.yaml

Regenerate the lockfile to match all package.json specifiers:

- Run `pnpm install` in repository root
- This will update pnpm-lock.yaml to match all package.json files
- The operation is deterministic - same inputs produce same output

#### Step 3: Verify the fix

Confirm that the lockfile was properly regenerated:

- Run `pnpm ls e2b` again - should now show `^2.10.4`
- Check `git diff pnpm-lock.yaml` to verify only lockfile changed (no package.json changes)
- Run `pnpm install --frozen-lockfile` to verify the lockfile is now consistent
- Confirm the command succeeds without `ERR_PNPM_OUTDATED_LOCKFILE` error

#### Step 4: Commit the fix

Create a git commit with the updated lockfile:

- Stage only `pnpm-lock.yaml` (not package.json changes if any)
- Commit with descriptive message following conventional commits
- Message format: `fix(deps): regenerate pnpm lockfile to resolve e2b version mismatch`

#### Step 5: Push and verify deployment

Push the fix to dev branch and verify the deployment succeeds:

- Push to `dev` branch
- GitHub Actions will automatically trigger "Deploy to Dev" workflow
- Monitor workflow execution to confirm it succeeds
- Verify both "Deploy Web App to Dev" and "Deploy Payload CMS to Dev" jobs complete successfully
- Confirm the Vercel preview deployments are live

## Testing Strategy

### Unit Tests

No unit tests needed - this is a dependency/lockfile fix, not code logic.

### Integration Tests

No new integration tests needed - existing tests will verify the deployment works.

### E2E Tests

No new E2E tests needed - existing E2E tests will run on the newly deployed environment.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Locally verify `pnpm install` succeeds without errors
- [ ] Locally verify `pnpm install --frozen-lockfile` succeeds without errors
- [ ] Verify git diff shows only pnpm-lock.yaml changes
- [ ] Verify commit message follows conventional commits format
- [ ] Push to dev branch and monitor GitHub Actions workflow
- [ ] Verify "Deploy to Dev" workflow completes successfully
- [ ] Verify both Web App and Payload CMS deployments succeed
- [ ] Verify Vercel preview URLs are live and responsive
- [ ] Test the dev environment functionality (login, basic flows)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Transitive dependency version changes**: Running `pnpm install` may update transitive dependencies to newer versions within the specified ranges
   - **Likelihood**: low - most deps are already at compatible versions
   - **Impact**: medium - could potentially introduce subtle bugs in dependencies
   - **Mitigation**: Test deployment thoroughly; Vercel preview environment provides safe testing; automated tests will catch regressions; can rollback easily if issues arise

2. **Network issue during pnpm install**: Network interruption could leave lockfile in partial state
   - **Likelihood**: low - unlikely on stable connection
   - **Impact**: low - can re-run the command
   - **Mitigation**: Run in stable environment; verify with `pnpm install --frozen-lockfile` after

3. **Unexpected lock conflicts**: Complex monorepo with conflicting dependency ranges
   - **Likelihood**: very low - project has been stable
   - **Impact**: medium - would need manual resolution
   - **Mitigation**: `pnpm install` is deterministic; run locally first to catch issues

**Rollback Plan**:

If this fix causes issues in production:
1. Revert the lockfile commit: `git revert <commit-hash>`
2. Push the revert to dev branch
3. GitHub Actions will automatically deploy the reverted lockfile
4. If that doesn't work, manually push previous working lockfile from git history

**Monitoring** (if needed):
- No special monitoring needed - deployment success is immediate indicator
- Check Vercel logs for any build or runtime errors post-deployment
- Existing error tracking (Sentry, New Relic) will catch any runtime issues

## Performance Impact

**Expected Impact**: none

No performance impact - this is purely a lockfile fix. The actual dependency versions may change, but only within the ranges already specified in package.json.

## Security Considerations

**Security Impact**: medium (positive)

This fix enables the earlier security vulnerability patch (commit e4f098260) that updated e2b from `^2.8.2` to `^2.10.4`. By regenerating the lockfile, we ensure the production deployment actually uses the secure version that was intended by that commit.

**Security review needed**: no - this is purely a lockfile consistency fix, no code changes

**Security audit checklist**:
- The e2b library update was already reviewed (commit e4f098260)
- This fix just ensures it's actually deployed
- No new code or security-relevant changes introduced

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Try to run deployment locally with frozen lockfile
pnpm install --frozen-lockfile

# Expected Result: Command fails with:
# ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with "frozen-lockfile"
# because pnpm-lock.yaml is not up to date with ...
# specifiers in the lockfile don't match specifiers in package.json:
# * 1 dependencies are mismatched:
#   - e2b (lockfile: ^2.8.2, manifest: ^2.10.4)
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Verify lockfile consistency
pnpm install --frozen-lockfile

# Build
pnpm build

# Manual verification
git log -1 --oneline  # Verify fix commit exists
pnpm ls e2b           # Verify e2b version is ^2.10.4
```

**Expected Result**: All commands succeed, lockfile is consistent, e2b version is ^2.10.4, GitHub Actions deployment succeeds.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify E2E tests pass on deployed dev environment
pnpm test:e2e --project=web

# Additional regression checks
pnpm --filter web build     # Web app builds
pnpm --filter payload build # Payload CMS builds
```

## Dependencies

### New Dependencies (if any)

No new dependencies required.

### Existing Dependency Updates

`e2b` in `packages/e2b/e2b-template/package.json` is being updated to use version `^2.10.4` (already updated in commit e4f098260, just finalizing in lockfile).

## Database Changes

**No database changes required** - this is purely a lockfile fix.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- No special steps needed beyond the standard commit → push → GitHub Actions workflow
- Vercel will automatically deploy when code is pushed to dev branch
- Monitor the "Deploy to Dev" workflow to confirm success

**Feature flags needed**: no

**Backwards compatibility**: fully maintained - no code changes, just lockfile consistency

## Success Criteria

The fix is complete when:
- [ ] `pnpm install --frozen-lockfile` succeeds locally without errors
- [ ] All validation commands pass
- [ ] Lockfile diff shows only version updates (no package.json changes)
- [ ] Commit message follows conventional commits format
- [ ] GitHub Actions "Deploy to Dev" workflow completes successfully
- [ ] Both Web App and Payload CMS deployments succeed
- [ ] Vercel preview environment is live and responsive
- [ ] No regressions detected in automated tests
- [ ] Deployment issue #1784 can be closed

## Notes

**Key Context**:
- This is a regression caused by incomplete lockfile generation in commit e4f098260
- The security fix (e2b update) was committed, but the lockfile wasn't properly regenerated
- Vercel's frozen-lockfile requirement (standard for production) caught this issue
- The fix is simple, safe, and aligns with monorepo best practices

**Decision Rationale**:
- Regenerating the full lockfile is the standard, safest approach for pnpm monorepos
- One command, deterministic output, resolves the issue completely
- No need for manual lockfile patching (error-prone) or CI workarounds (anti-pattern)

**Related Context**:
- Commit e4f098260: "fix(security): resolve high severity dependency vulnerabilities"
- Issue #1478, #1479: Previous Deploy to Dev failures (different root causes)
- Issue #1721, #1723: Previous dependency sync issues

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1784*
