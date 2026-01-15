# Bug Fix: Vercel Deploy to Dev fails with corepack enable exit code 1

**Related Diagnosis**: #1478
**Severity**: high
**Bug Type**: integration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Missing `ENABLE_EXPERIMENTAL_COREPACK=1` environment variable in Vercel build configuration, causing `corepack enable` to fail when handling pnpm 10.14.0
- **Fix Approach**: Remove corepack from installCommand in `apps/web/vercel.json` and `apps/payload/vercel.json`, letting Vercel detect pnpm version from package.json
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Vercel deployments to dev have been failing for 34+ days (since December 12, 2025) with `Command "corepack enable && pnpm install" exited with 1`. Both Web App and Payload CMS fail during install phase. The root cause is that the `ENABLE_EXPERIMENTAL_COREPACK=1` environment variable is not set in Vercel, but the app-specific vercel.json files explicitly use `corepack enable` in their installCommand.

For full details, see diagnosis issue #1478.

### Solution Approaches Considered

#### Option 1: Remove corepack from installCommand ⭐ RECOMMENDED

**Description**: Change both `apps/web/vercel.json` and `apps/payload/vercel.json` to use the simpler install command `pnpm install --frozen-lockfile` without corepack. Vercel will automatically detect pnpm 10.14.0 from the root `package.json` packageManager field.

**Pros**:
- Simplest solution with minimal code changes (2 files, 1 line each)
- Removes dependency on experimental corepack feature
- Matches the pattern already used in root `vercel.json`
- Eliminates the problematic command entirely
- Still uses `--frozen-lockfile` for reproducible builds
- Immediate fix - no configuration changes needed in Vercel dashboard

**Cons**:
- Vercel may not detect the exact pnpm version in some scenarios (rare)

**Risk Assessment**: low - This is the standard Vercel pattern for pnpm monorepos

**Complexity**: simple - Just removing `corepack enable && ` from two files

#### Option 2: Set ENABLE_EXPERIMENTAL_COREPACK=1 environment variable

**Description**: Add the `ENABLE_EXPERIMENTAL_COREPACK=1` environment variable to Vercel project settings for both 2025slideheroes-web and 2025slideheroes-payload projects. This would enable corepack to work as intended.

**Pros**:
- Preserves the current vercel.json configuration
- Enables explicit corepack usage for version pinning
- No code changes required

**Cons**:
- Depends on experimental Vercel feature
- Requires manual configuration in Vercel dashboard (error-prone, can be missed in future projects)
- Must configure for both web and payload projects separately
- More complex than necessary
- Doesn't align with root vercel.json pattern

**Why Not Chosen**: Option 1 is simpler, more reliable, and doesn't depend on experimental features. The root vercel.json already demonstrates the recommended pattern.

#### Option 3: Hybrid approach - Keep corepack with environment variable

**Description**: Set the environment variable AND keep corepack in the installCommand.

**Why Not Chosen**: Unnecessary complexity. Option 1 achieves the same result with less moving parts.

### Selected Solution: Remove corepack from installCommand

**Justification**:
This is the simplest, most reliable, and most maintainable solution. It removes the problematic command entirely rather than trying to enable an experimental feature. Vercel's standard pnpm detection will automatically use the version specified in `packageManager` field (pnpm@10.14.0). This pattern is already used in the root `vercel.json`, demonstrating it works for this monorepo. The fix requires only 2 files to be modified, one line each.

**Technical Approach**:
- Vercel's modern build system automatically detects the package manager from package.json or vercel.json
- When installCommand is `pnpm install --frozen-lockfile`, Vercel will:
  1. Read `packageManager: "pnpm@10.14.0"` from root package.json
  2. Use Corepack internally (when available) to activate the exact version
  3. Run `pnpm install --frozen-lockfile` with the pinned version
  4. Install dependencies consistently across environments

**Architecture Changes**: None - This is a configuration simplification, not an architectural change.

**Migration Strategy**:
- Change is backwards compatible
- Vercel will detect the new config immediately on next push
- No database migrations, no data migration
- No breaking changes to build process

## Implementation Plan

### Affected Files

- `apps/web/vercel.json` - Remove `corepack enable &&` from installCommand (line 4)
- `apps/payload/vercel.json` - Remove `corepack enable &&` from installCommand (line 3)

### New Files

No new files needed.

### Step-by-Step Tasks

#### Step 1: Update apps/web/vercel.json

**What this accomplishes**: Removes the problematic corepack command from the web app's Vercel configuration.

- Open `apps/web/vercel.json`
- Change line 4 from: `"installCommand": "corepack enable && pnpm install",`
- Change to: `"installCommand": "pnpm install --frozen-lockfile",`
- Verify the JSON is valid

**Why this step first**: The web app is the primary deployment target and has the most detailed logs, making it easier to verify the fix works.

#### Step 2: Update apps/payload/vercel.json

**What this accomplishes**: Removes the problematic corepack command from the Payload CMS configuration, consistent with web app fix.

- Open `apps/payload/vercel.json`
- Change line 3 from: `"installCommand": "corepack enable && pnpm install"`
- Change to: `"installCommand": "pnpm install --frozen-lockfile"`
- Verify the JSON is valid

#### Step 3: Validate JSON syntax

**What this accomplishes**: Ensures both vercel.json files are syntactically correct before deployment.

- Run: `pnpm build` (includes validation of JSON files)
- Or manually: `jq empty apps/web/vercel.json && echo "Valid"`
- Or manually: `jq empty apps/payload/vercel.json && echo "Valid"`

#### Step 4: Test locally (optional)

**What this accomplishes**: Ensures local development still works with the changes (should not be affected).

- Run: `pnpm install --frozen-lockfile` locally to verify command works
- Run: `pnpm dev` to start local development server
- Confirm no errors

**Why optional**: Local changes won't affect local behavior, only Vercel deployments. This is a verification step.

#### Step 5: Commit and push to dev

**What this accomplishes**: Triggers the GitHub Actions deployment workflow.

- Stage changes: `git add apps/web/vercel.json apps/payload/vercel.json`
- Commit: `git commit -m "fix(ci): remove corepack from Vercel install commands [agent: implementation_agent]"`
- Push: `git push origin dev`

#### Step 6: Monitor deployment and verify fix

**What this accomplishes**: Confirms the deployment succeeds and the bug is fixed.

- Watch GitHub Actions: The dev-deploy workflow should now pass
- Check Vercel logs: Both web and payload builds should complete successfully
- Verify deployments: URLs from both apps should be accessible
- Health checks should pass (see Validation Commands section)

## Testing Strategy

### Unit Tests

No unit tests needed - this is a configuration change, not code change.

### Integration Tests

No new integration tests needed.

### E2E Tests

No E2E tests needed - this is infrastructure configuration.

### Manual Testing Checklist

Execute these manual tests to verify the fix:

- [ ] Push commit to dev branch
- [ ] Wait for GitHub Actions `dev-deploy.yml` workflow to start
- [ ] Verify `Pre-deployment Validation` job passes
- [ ] Verify `Deploy Web App to Dev` job completes successfully (should show `✅ Deployed to: [URL]`)
- [ ] Verify `Deploy Payload CMS to Dev` job completes successfully
- [ ] Test web app deployment:
  - Navigate to the deployment URL
  - Verify page loads without errors
  - Check browser console for errors (should be none)
- [ ] Test Payload CMS deployment:
  - Navigate to the Payload deployment URL
  - Verify API health check endpoint responds with 200
  - Check `/api/health` endpoint
- [ ] Verify both deployments show in GitHub Actions as successful
- [ ] Confirm dev.slideheroes.com alias was set correctly for the web deployment

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Vercel doesn't use pinned pnpm version**: Vercel uses a different pnpm version than specified
   - **Likelihood**: low (Vercel has good version pinning support)
   - **Impact**: medium (could cause subtle incompatibilities)
   - **Mitigation**: Vercel reads packageManager field; if issues occur, we can explicitly set Node/pnpm versions in Vercel dashboard

2. **JSON syntax error after edit**: Typo in vercel.json causes invalid JSON
   - **Likelihood**: low (simple edit)
   - **Impact**: medium (deployment fails)
   - **Mitigation**: Validate JSON syntax before pushing (use `jq` or JSON linter)

3. **Unrelated build failures**: Fix reveals other build issues
   - **Likelihood**: medium (34 days of failures may hide issues)
   - **Impact**: medium (new issues surface)
   - **Mitigation**: Fix each issue methodically; this change is safe and any new errors are legitimate

**Rollback Plan**:

If the fix causes issues:
1. Revert commit: `git revert <commit-hash>`
2. Push to dev: `git push origin dev`
3. GitHub Actions will run with previous configuration
4. Either the old failure returns (confirming rollback worked) or new error appears (pointing to actual issue)
5. Then investigate the new error with full team

**Monitoring** (optional but recommended):

- Monitor first 3 deployments after fix for errors
- Watch GitHub Actions workflow runs
- Verify Vercel deployment logs show successful install
- Check that health checks pass immediately after deployment

## Performance Impact

**Expected Impact**: none

The `--frozen-lockfile` flag may be slightly faster than `corepack enable && pnpm install` because it skips unnecessary steps. No performance regression expected.

## Security Considerations

**Security Impact**: none

- No secrets or credentials in configuration
- Removing corepack doesn't affect security (it's just a tool for version management)
- `--frozen-lockfile` actually improves security by preventing lockfile changes

## Validation Commands

### Before Fix (Bug Should Reproduce)

The following would have failed before the fix (you can skip running these):

```bash
# If deployment still had old config:
# 1. Push to dev would trigger GitHub Actions
# 2. Workflow would reach "Deploy to Vercel" step
# 3. Vercel build would fail with: Error: Command "corepack enable && pnpm install" exited with 1
# 4. GitHub Actions job would fail with exit code 1
```

**Expected Result**: Deployment fails during Vercel install phase.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint - verify JSON files are valid
pnpm lint

# Format
pnpm format

# Verify JSON syntax specifically
jq empty apps/web/vercel.json && echo "✅ apps/web/vercel.json valid"
jq empty apps/payload/vercel.json && echo "✅ apps/payload/vercel.json valid"

# Build
pnpm build

# Push to dev to trigger deployment
git add apps/web/vercel.json apps/payload/vercel.json
git commit -m "fix(ci): remove corepack from Vercel install commands [agent: implementation_agent]"
git push origin dev

# Monitor deployment
# 1. GitHub Actions workflow should complete successfully
# 2. Check deployment URLs are accessible
# 3. Verify health checks pass
```

**Expected Result**:
- All local commands succeed
- GitHub Actions workflow completes successfully
- Both deployments show as successful
- Vercel logs show: `✅ Deployment successful`
- Web app and Payload CMS are accessible at their deployment URLs

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify no other vercel.json files need updating
find . -name "vercel.json" -type f | head -20

# Check that root vercel.json still matches recommended pattern
cat vercel.json | grep installCommand
# Should show: "installCommand": "pnpm install --frozen-lockfile"
```

## Dependencies

### New Dependencies

No new dependencies required.

### Existing Dependencies

All existing dependencies remain unchanged. The pnpm 10.14.0 version is already specified in `package.json`:

```json
{
  "packageManager": "pnpm@10.14.0"
}
```

## Database Changes

**No database changes required** - This is purely a configuration fix.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - just a normal push to dev branch.

**Feature flags needed**: no

**Backwards compatibility**: fully maintained - This is a configuration simplification.

## Success Criteria

The fix is complete when:
- [ ] Both vercel.json files updated with new installCommand
- [ ] JSON syntax validated
- [ ] Local build and lint pass
- [ ] Commit created and pushed to dev branch
- [ ] GitHub Actions workflow runs to completion
- [ ] Pre-deployment Validation job passes
- [ ] Deploy Web App to Dev job shows ✅ success
- [ ] Deploy Payload CMS to Dev job shows ✅ success
- [ ] Web deployment URL is accessible
- [ ] Payload deployment health check passes
- [ ] No new errors in Vercel build logs
- [ ] Zero regressions in other functionality

## Notes

### Why This Fix Works

The root cause was that `corepack enable` requires `ENABLE_EXPERIMENTAL_COREPACK=1` to be set in Vercel's environment. Rather than add this experimental dependency, we remove the explicit corepack command and let Vercel's built-in pnpm detection handle version pinning through the `packageManager` field.

### Why The Root vercel.json Works

The root `vercel.json` uses `"installCommand": "pnpm install --frozen-lockfile"` without corepack, and it's been working reliably. The app-specific vercel.json files inherited the corepack pattern, likely from outdated templates or documentation.

### Consistency

After this fix, all three vercel.json files (root, web, payload) will use the same pattern:
```json
{
  "installCommand": "pnpm install --frozen-lockfile"
}
```

This consistency makes the configuration easier to maintain.

### Future Prevention

To prevent similar issues:
1. Keep vercel.json files minimal and consistent
2. Let Vercel auto-detect package manager when possible
3. Use standard patterns from Vercel documentation
4. Review all vercel.json files during dependencies updates
5. Test deployment configuration in pull requests when changed

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1478*
