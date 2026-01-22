# Bug Fix: Missing @posthog/nextjs-config Dependency

**Related Diagnosis**: #1721 (REQUIRED)
**Severity**: high
**Bug Type**: deployment
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `@posthog/nextjs-config` imported in `apps/web/next.config.mjs` but never added to package.json or pnpm-lock.yaml
- **Fix Approach**: Add the missing dependency to apps/web package.json and lock file
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Commit `2e46c5d73` added an import for `@posthog/nextjs-config` to `apps/web/next.config.mjs` without adding the package as a dependency. This causes the "Deploy to Dev" workflow to fail because Vercel's clean build environment (`pnpm install --frozen-lockfile`) only installs declared dependencies. The error surfaces only in clean builds (local development may have the package installed from prior manual installation), making it invisible until deployment.

**Error Message**:
```
Error: Cannot find package '@posthog/nextjs-config' imported from apps/web/next.config.mjs
  code: 'ERR_MODULE_NOT_FOUND'
```

For full details, see diagnosis issue #1721.

### Solution Approaches Considered

#### Option 1: Add @posthog/nextjs-config to apps/web package.json ⭐ RECOMMENDED

**Description**: Add the missing package as a dependency in `apps/web/package.json`, then run `pnpm install` to update the lock file. This is the standard and correct fix for this type of issue.

**Pros**:
- Straightforward fix that addresses the root cause directly
- Single command to resolve the issue (`pnpm --filter web add @posthog/nextjs-config`)
- Follows monorepo best practices - dependencies declared where used
- Automatically updates pnpm-lock.yaml atomically
- No special configuration or workarounds needed
- Production-tested pattern across the codebase

**Cons**:
- Minimal (none for this approach)

**Risk Assessment**: low - Standard dependency management operation with no side effects

**Complexity**: simple - Single pnpm command, minimal risk

#### Option 2: Add to root package.json instead

**Description**: Add the package to root `package.json` as a shared dependency accessible to all workspaces.

**Why Not Chosen**: Goes against monorepo best practices. The package is only used in `apps/web`, so it should be declared there. Adding to root would pollute the dependency tree and make it unclear which apps actually require this package. All shared dependencies between apps go in `packages/*`, not root.

#### Option 3: Investigate if package should even be used

**Description**: Question whether the PostHog integration is actually needed and remove the import if not.

**Why Not Chosen**: The import was intentionally added in commit `2e46c5d73`. Removing it without understanding the requirement would be wrong. The fix is to add the missing dependency, not to second-guess the feature.

### Selected Solution: Add @posthog/nextjs-config to apps/web

**Justification**: This is the correct and standard approach for handling missing dependencies in a monorepo. The package was imported intentionally, it's just the dependency declaration was missed. Adding it to `apps/web/package.json` (where it's used) is the right place, and the operation is atomic, safe, and follows all project conventions.

**Technical Approach**:
- Use `pnpm --filter web add @posthog/nextjs-config` to install the package
- This automatically adds the dependency to `apps/web/package.json`
- pnpm atomically updates `pnpm-lock.yaml` with proper workspace resolution
- The fix is immediately deployable and unblocks the workflow

**Architecture Changes**: None - this is purely adding a declared dependency that was being used

**Migration Strategy**: Not applicable - no data or code migration needed

## Implementation Plan

### Affected Files

- `apps/web/package.json` - Will have `@posthog/nextjs-config` added to `dependencies`
- `pnpm-lock.yaml` - Will be updated with the new dependency's lock entry

### New Files

None - no new files needed

### Step-by-Step Tasks

#### Step 1: Add the missing dependency

Install the @posthog/nextjs-config package in the web app workspace:

- Run `pnpm --filter web add @posthog/nextjs-config`
- This adds the package to `apps/web/package.json` and updates `pnpm-lock.yaml`
- Verify `apps/web/package.json` now includes `"@posthog/nextjs-config": "^X.Y.Z"`
- Verify `pnpm-lock.yaml` contains entries for @posthog/nextjs-config and its dependencies

**Why this step first**: This is the only step needed to fix the root cause. The import in `next.config.mjs` will immediately become resolvable.

#### Step 2: Verify the fix locally

Test that the dependency can be resolved:

- Run `pnpm install` to ensure lock file is consistent
- Run `pnpm --filter web build` to verify next.config.mjs loads without errors
- Confirm no build failures related to module resolution

#### Step 3: Validation

Run all validation commands to ensure no regressions:

- Run `pnpm typecheck` to verify TypeScript is happy with the new import
- Run `pnpm lint` to check for style issues
- Run `pnpm format` to ensure code style is correct
- Run `pnpm build` to verify production build works

#### Step 4: Verify workflow fix

The fix is complete when:
- `vercel build` succeeds (simulates Vercel's clean build environment)
- "Deploy to Dev" workflow passes without the module resolution error
- No new errors are introduced

## Testing Strategy

### Unit Tests

No new unit tests needed - this is a dependency management fix, not code changes.

### Integration Tests

No changes to integration tests needed.

### E2E Tests

No changes to E2E tests needed.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run `pnpm install` - Should complete without errors
- [ ] Run `pnpm --filter web build` - Build succeeds without "Cannot find module" error
- [ ] Run `pnpm typecheck` - No TypeScript errors related to missing module
- [ ] Verify `apps/web/package.json` has the new dependency listed
- [ ] Verify `pnpm-lock.yaml` is updated with proper entries
- [ ] Run `vercel build` locally to simulate Vercel's build environment
- [ ] Verify "Deploy to Dev" workflow passes in GitHub Actions
- [ ] Check for no new build warnings or errors in console

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Incompatible version**: Wrong version of @posthog/nextjs-config could break things
   - **Likelihood**: low
   - **Impact**: low - Would cause build failure immediately, caught before deployment
   - **Mitigation**: Use pnpm's default version resolution (^X.Y.Z). If tests fail, adjust version constraint.

2. **Dependency conflicts**: The package might have incompatible peer dependencies
   - **Likelihood**: low
   - **Impact**: medium - Could cause unexpected behavior in Sentry/Monitoring integration
   - **Mitigation**: Run full test suite before merging. Pnpm will warn about peer dependency issues during install.

3. **Breaking changes in @posthog/nextjs-config**: New version might break next.config.mjs
   - **Likelihood**: low
   - **Impact**: low - Build failure would be caught immediately
   - **Mitigation**: Use caret version (^X.Y.Z) for automatic updates; manually test the build works

**Rollback Plan**:

If this fix causes issues:
1. Remove the dependency: `pnpm --filter web remove @posthog/nextjs-config`
2. This reverts `apps/web/package.json` and `pnpm-lock.yaml` to previous state
3. Remove the import from `apps/web/next.config.mjs` (if needed)
4. Commit the rollback
5. Root cause investigation would determine if PostHog integration should be removed entirely

**Monitoring** (if needed):
- Monitor "Deploy to Dev" workflow for failures related to @posthog/nextjs-config
- Watch for any Vercel build errors mentioning PostHog configuration

## Performance Impact

**Expected Impact**: none

There is no performance impact from adding this dependency. It's a Next.js configuration wrapper that runs at build time only, not at runtime.

## Security Considerations

**Security Impact**: low

The @posthog/nextjs-config package is from PostHog, an established analytics platform. Adding it as a dependency doesn't introduce new security concerns:
- PostHog is widely used and security-reviewed
- This is a build-time only dependency (not runtime)
- No API keys or sensitive data flows through this package

**Security review needed**: no
**Penetration testing needed**: no
**Security audit checklist**: Not applicable - standard third-party package addition

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Try to build - should fail with module not found error
pnpm --filter web build

# Expected Result: Error - Cannot find package '@posthog/nextjs-config'
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Build web app
pnpm --filter web build

# Simulate Vercel build environment
vercel build

# Full build (all packages)
pnpm build

# Full test suite
pnpm test
```

**Expected Result**: All commands succeed without module resolution errors. "Deploy to Dev" workflow passes.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify TypeScript has no errors
pnpm typecheck

# Build all apps to verify nothing broke
pnpm build
```

## Dependencies

### New Dependencies

```bash
# Install command
pnpm --filter web add @posthog/nextjs-config

# Justification
Required for PostHog integration in Next.js configuration (next.config.mjs).
This is a build-time configuration helper provided by PostHog.
```

**Dependencies added**:
- `@posthog/nextjs-config@^<version>` - PostHog analytics integration wrapper for Next.js

OR

**No database changes required**

## Database Changes

**Migration needed**: no

This is a dependency management fix with no database schema or migration requirements.

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- No special steps needed - this is a standard dependency addition
- CI/CD pipeline will automatically pick up the updated lock file
- Vercel will use the new lock file during build

**Feature flags needed**: no

**Backwards compatibility**: maintained

The dependency addition is backwards compatible. Existing code continues to work, and the new package enables the PostHog configuration that was already imported.

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] "Cannot find module" error no longer appears
- [ ] All tests pass (unit, integration, E2E)
- [ ] Zero regressions detected
- [ ] Code review approved (if applicable)
- [ ] Manual testing checklist complete
- [ ] "Deploy to Dev" workflow passes
- [ ] Build succeeds in Vercel environment

## Notes

This is a straightforward fix for a forgotten dependency declaration. The root cause analysis identified that the import was added without updating `package.json` and the lock file. The fix is a single pnpm command that restores consistency between the code and dependency declarations.

The fact that this only surfaced in Vercel's clean build environment is typical - local development environments often have accumulated packages from prior installation attempts, masking missing dependency declarations. This is why CI/CD systems use `--frozen-lockfile` to catch these issues.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1721*
