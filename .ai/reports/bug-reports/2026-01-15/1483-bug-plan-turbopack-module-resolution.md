# Bug Fix: Turbopack Module Resolution for pnpm Nested Dependencies

**Related Diagnosis**: #1481
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Turbopack cannot resolve pnpm's nested symlinked dependencies (`@sentry/node-core`, `@react-email/tailwind`) that aren't hoisted to root `node_modules`
- **Fix Approach**: Add missing packages to `public-hoist-pattern` in `.npmrc` to force pnpm to hoist them to root `node_modules`
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Vercel deployments fail during the build phase with Turbopack unable to resolve 39 module errors:
- 38x `Module not found: Can't resolve '@sentry/node-core'`
- 1x `Module not found: Can't resolve '@react-email/tailwind'`

The issue is that Turbopack on Vercel cannot follow pnpm's symlink structure for nested dependencies stored in `.pnpm` that aren't hoisted to root `node_modules`. Local builds with Webpack succeed because Webpack handles symlinks correctly.

For full details, see diagnosis issue #1481.

### Solution Approaches Considered

#### Option 1: Add packages to public-hoist-pattern in .npmrc ⭐ RECOMMENDED

**Description**: Modify `.npmrc` to add `@sentry/node-core` and `@react-email/tailwind` to the `public-hoist-pattern` array. This forces pnpm to hoist these packages to root `node_modules`, making them resolvable by Turbopack.

**Pros**:
- Minimal change: only 2 lines added to `.npmrc`
- Solves both current errors and prevents future similar issues
- Follows pnpm best practices for monorepo compatibility with bundlers
- No code changes needed
- Compatible with both Webpack and Turbopack
- Standard solution for pnpm + Turbopack integration

**Cons**:
- Slightly increases root `node_modules` size
- May need to add more packages if similar issues occur with other dependencies

**Risk Assessment**: low - This is a standard pnpm configuration that doesn't affect functionality

**Complexity**: simple - Configuration file change only

#### Option 2: Add packages as explicit dependencies in apps/web/package.json

**Description**: Add `@sentry/node-core` and `@react-email/tailwind` as explicit devDependencies in the web app's package.json, making them top-level dependencies.

**Pros**:
- Hoists packages automatically when installed
- Very explicit about dependencies

**Cons**:
- Package already installed transitively (adds duplication in package.json)
- Doesn't address the underlying pnpm/Turbopack compatibility issue
- Future packages with similar issues would need the same fix
- Less maintainable

**Why Not Chosen**: Option 1 is more elegant and addresses the root cause (hoisting configuration) rather than working around it with explicit dependencies.

#### Option 3: Configure Turbopack resolveAlias in next.config.mjs

**Description**: Use Turbopack's `resolveAlias` feature in `apps/web/next.config.mjs` to manually map the missing packages to their correct locations.

**Pros**:
- Doesn't require `.npmrc` changes
- Keeps configuration isolated to Next.js config

**Cons**:
- Complex to maintain (need full paths to `.pnpm` store)
- Doesn't solve the actual issue, just works around it
- Fragile: paths change if package versions update
- Hard to understand for future maintainers
- Doesn't prevent similar issues with other packages

**Why Not Chosen**: Option 1 is the standard, maintainable solution used across the ecosystem.

#### Option 4: Disable Turbopack for production builds

**Description**: Configure Next.js to use Webpack instead of Turbopack for production builds via environment variables or next.config.mjs.

**Pros**:
- Immediately resolves the issue

**Cons**:
- Loses Turbopack performance benefits (faster builds)
- Not recommended by Vercel/Next.js team
- Defeats the purpose of upgrading to Next.js 16 (which uses Turbopack by default)
- Creates technical debt

**Why Not Chosen**: We should fix the real issue (hoisting) rather than avoiding Turbopack.

### Selected Solution: Add packages to public-hoist-pattern in .npmrc

**Justification**:
This is the standard, maintainable solution recommended by the pnpm documentation for monorepos using bundlers like Turbopack. It addresses the root cause (packages not being hoisted) rather than working around it. The change is minimal (2 lines), low-risk, and prevents future similar issues. This approach is used across many projects using pnpm + Turbopack.

**Technical Approach**:
1. Identify all packages causing module resolution errors
2. Add them to the `public-hoist-pattern` array in `.npmrc`
3. Run `pnpm install` to re-hoist packages
4. Verify packages are now in root `node_modules`
5. Test build succeeds on both local and Vercel

**Architecture Changes**:
- Minimal change to pnpm configuration only
- No impact on source code or dependency structure
- Fully backwards compatible

**Migration Strategy**:
- No data migration needed
- Requires local `pnpm install` to re-organize packages
- Developers will get the new hoisting automatically on next install

## Implementation Plan

### Affected Files

- `.npmrc` - Add 2 packages to `public-hoist-pattern` configuration

### New Files

No new files needed.

### Step-by-Step Tasks

#### Step 1: Update .npmrc with public-hoist-pattern entries

**What this accomplishes**: Configures pnpm to hoist the two problematic packages to root `node_modules`, making them resolvable by Turbopack.

- Read current `.npmrc` to understand existing hoisting patterns
- Add `@sentry/node-core` to `public-hoist-pattern[]`
- Add `@react-email/tailwind` to `public-hoist-pattern[]`
- Verify `.npmrc` syntax is valid

**Why this step first**: pnpm needs this configuration before the next step to properly hoist packages.

#### Step 2: Reinstall dependencies to apply hoisting

**What this accomplishes**: Rebuilds `node_modules` with the new hoisting configuration.

- Run `pnpm install` to trigger re-hoisting
- Verify `node_modules/@sentry/node-core` exists
- Verify `node_modules/@react-email/tailwind` exists
- Verify `pnpm-lock.yaml` is unchanged (only organization, not versions)

#### Step 3: Verify build succeeds locally

**What this accomplishes**: Ensures the fix works before pushing to Vercel.

- Run `pnpm build` to test local build
- Confirm no module resolution errors
- Verify output directories contain expected artifacts

#### Step 4: Commit and push to dev branch

**What this accomplishes**: Triggers Vercel deployment with the fixed configuration.

- Stage `.npmrc` changes
- Create commit with conventional format
- Push to `dev` branch to trigger GitHub Actions

#### Step 5: Verify Vercel deployment succeeds

**What this accomplishes**: Confirms the fix works in the production build environment.

- Monitor GitHub Actions workflow
- Check Vercel build logs for module resolution errors
- Verify both web and payload apps deploy successfully
- Test deployment URLs are accessible

## Testing Strategy

### Unit Tests

No unit tests needed - this is a configuration change, not code logic.

### Integration Tests

No new integration tests needed - existing build process tests will verify the fix.

### Manual Testing Checklist

Execute these manual tests to verify the fix:

- [ ] Run `pnpm install` locally
- [ ] Verify `node_modules/@sentry/node-core` directory exists
- [ ] Verify `node_modules/@react-email/tailwind` directory exists
- [ ] Run `pnpm build` locally - should succeed with zero errors
- [ ] Inspect build output (`.next` directory) for completeness
- [ ] Push to `dev` branch
- [ ] Wait for GitHub Actions to complete
- [ ] Check Vercel deployment logs - should show successful install and build
- [ ] Test web app deployment URL is accessible and responsive
- [ ] Test Payload CMS deployment health check passes
- [ ] Verify no module resolution errors in Vercel logs

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Increased root node_modules size**: Adding hoisted packages increases disk space
   - **Likelihood**: low (only 2 packages)
   - **Impact**: low (minimal size increase)
   - **Mitigation**: This is normal and expected for monorepos with Turbopack

2. **Unintended side effects from hoisting**: Hoisting changes might affect other packages
   - **Likelihood**: low (only hoisting the packages that are already installed)
   - **Impact**: low (pnpm handles hoisting conflicts gracefully)
   - **Mitigation**: Existing test suite will catch issues

3. **Lock file changes**: pnpm-lock.yaml might show changes
   - **Likelihood**: medium (pnpm reorganizes dependencies)
   - **Impact**: low (only organization, not versions)
   - **Mitigation**: Review lock file changes carefully before committing

**Rollback Plan**:

If this fix causes issues:
1. Remove the added lines from `.npmrc`
2. Run `pnpm install` to restore old hoisting
3. Commit and push
4. Vercel will automatically re-deploy with previous configuration

**Monitoring**:
- Monitor first 3 deployments after fix for new errors
- Watch build logs for module resolution issues
- Check Sentry error rate to ensure monitoring still works

## Performance Impact

**Expected Impact**: none

The hoisting change won't affect runtime performance. Turbopack may benefit from faster module resolution since packages are in root `node_modules`.

## Security Considerations

**Security Impact**: none

- No security implications from this configuration change
- No new packages added
- No changes to code or environment

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Check current hoisting status
ls -la node_modules/@sentry/node-core 2>&1 || echo "Not hoisted"
ls -la node_modules/@react-email/tailwind 2>&1 || echo "Not hoisted"

# Try building (would fail on Vercel before fix)
pnpm build
```

**Expected Result**: Packages not in root `node_modules`, build fails on Vercel with 39 module errors.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Verify hoisting
ls -la node_modules/@sentry/node-core && echo "✅ @sentry/node-core hoisted"
ls -la node_modules/@react-email/tailwind && echo "✅ @react-email/tailwind hoisted"

# Build locally
pnpm build

# Manual verification - push to dev and monitor
git add .npmrc
git commit -m "fix(infra): add sentry/node-core and react-email/tailwind to pnpm hoisting"
git push origin dev

# Monitor deployment
gh run list --repo MLorneSmith/2025slideheroes --branch dev --limit 1
```

**Expected Result**: All commands succeed, packages are hoisted to root `node_modules`, Vercel build completes successfully.

### Regression Prevention

```bash
# Run full test suite
pnpm test

# Verify no lock file version changes (only organization)
git diff pnpm-lock.yaml | grep -E "^[+-].*version" || echo "✅ No version changes"

# Check for any new module errors in build
pnpm build 2>&1 | grep -i "module not found" || echo "✅ No module errors"
```

## Dependencies

### New Dependencies

No new dependencies required.

### Existing Dependencies

All packages already installed:
- `@sentry/node-core@10.27.0` - Already transitively installed via `@sentry/nextjs`
- `@react-email/tailwind@2.0.1` - Already installed as dependency of `@react-email/components`

## Database Changes

**No database changes required** - This is a purely configuration fix.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - standard push to dev branch triggers automatic deployment.

**Feature flags needed**: no

**Backwards compatibility**: fully maintained - Configuration change only, no breaking changes.

## Success Criteria

The fix is complete when:
- [ ] `.npmrc` updated with new hoisting patterns
- [ ] Local build succeeds with `pnpm build`
- [ ] `node_modules/@sentry/node-core` exists
- [ ] `node_modules/@react-email/tailwind` exists
- [ ] Vercel web app deployment succeeds
- [ ] Vercel payload CMS deployment succeeds
- [ ] No module resolution errors in Vercel logs
- [ ] Deployment URLs are accessible
- [ ] All existing tests pass
- [ ] No regressions detected

## Notes

**Why Both Fixes Work Together**:
1. #1479 fixed the corepack issue → install phase now passes
2. This fix resolves the Turbopack hoisting issue → build phase will now pass

**Standard Workaround Pattern**:
This hoisting configuration is the standard solution used by projects combining pnpm + Turbopack. Many Next.js monorepos use this same pattern.

**Future Prevention**:
If similar module resolution errors occur with other packages in the future, use the same approach: add to `public-hoist-pattern` in `.npmrc`. This is more maintainable than adding explicit dependencies.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1481*
