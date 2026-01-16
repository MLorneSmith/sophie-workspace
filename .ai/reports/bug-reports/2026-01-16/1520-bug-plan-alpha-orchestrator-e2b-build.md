# Bug Fix: Alpha Orchestrator E2B Sandbox Build Step Missing

**Related Diagnosis**: #1519
**Severity**: high
**Bug Type**: integration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: E2B sandbox template runs `pnpm install` but not `pnpm build`, leaving workspace packages without compiled `dist/` directories
- **Fix Approach**: Add workspace package build step after `pnpm install` in sandbox initialization
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Autonomous Coding workflow orchestrator fails during the database seeding phase because the E2B sandbox template installs dependencies but does not build workspace packages. When `pnpm run payload migrate` executes, Payload's config loads the database adapter singleton, which imports `@kit/shared/logger`. Since the package was never built, the `dist/logger/index.js` file doesn't exist, causing a module resolution error.

For full details, see diagnosis issue #1519.

### Solution Approaches Considered

#### Option 1: Add Build Step to Sandbox Initialization ⭐ RECOMMENDED

**Description**: Add a `pnpm --filter @kit/shared build` command to `.ai/alpha/scripts/lib/sandbox.ts` immediately after `pnpm install` completes during sandbox setup.

**Pros**:
- Surgical fix targeting the root cause
- Minimal code change (2-3 lines)
- Builds only the affected package, keeping build times low
- Maintains sandbox isolation and reproducibility
- Can be extended to build other packages if needed

**Cons**:
- Requires modifying the orchestrator script
- Adds ~10-15 seconds to sandbox creation time

**Risk Assessment**: low - This is a straightforward initialization step with no side effects.

**Complexity**: simple - A single command line addition.

#### Option 2: Modify E2B Template to Include Build Step

**Description**: Update the E2B template definition to include a build step after the initial `pnpm install`.

**Pros**:
- Builds the package once when template is created
- Sandbox creation would be slightly faster (no rebuild needed)

**Cons**:
- Requires rebuilding/redeploying the E2B template
- Less flexible for future package changes
- Template updates are slower than code changes
- Harder to test during development

**Why Not Chosen**: Less flexible and harder to iterate on. The orchestrator script approach is better for development workflows.

#### Option 3: Pre-build All Workspace Packages

**Description**: Build all workspace packages instead of just `@kit/shared`.

**Why Not Chosen**: Overkill for this issue. Only `@kit/shared` is needed for Payload migration. Can be extended later if other packages have similar issues.

### Selected Solution: Add Build Step to Sandbox Initialization

**Justification**: This approach is the most surgical, flexible, and testable. It directly addresses the root cause without requiring template changes or unnecessary builds. It can be extended incrementally if other packages need building.

**Technical Approach**:
- After `pnpm install` completes in `.ai/alpha/scripts/lib/sandbox.ts`, add a build command
- Run `pnpm --filter @kit/shared build` with appropriate timeout (120 seconds is sufficient)
- This ensures the dist directories exist before any Payload commands execute

**Architecture Changes**: None - purely additive initialization step.

**Migration Strategy**: Not needed - this is forward-looking only.

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/sandbox.ts` - Add build step after `pnpm install`

### New Files

None required.

### Step-by-Step Tasks

#### Step 1: Add Build Step to Sandbox Initialization

Add the package build command to `.ai/alpha/scripts/lib/sandbox.ts` immediately after the `pnpm install` completes.

**Why this step first**: The build must happen after dependencies are installed but before any Payload commands that might load the shared packages.

- Read `.ai/alpha/scripts/lib/sandbox.ts` to understand the current initialization flow
- Locate the section where `pnpm install` is executed
- Add `pnpm --filter @kit/shared build` command with 120-second timeout
- Ensure the command runs synchronously before proceeding

#### Step 2: Test Sandbox Creation and Database Seeding

Verify the fix resolves the module resolution error.

- Create a test E2B sandbox instance
- Verify `pnpm install` runs successfully
- Verify `pnpm --filter @kit/shared build` builds the package
- Verify the dist directories are created
- Run database seeding to confirm it no longer fails with module resolution error

#### Step 3: Run Alpha Orchestrator End-to-End

Verify the complete workflow functions without errors.

- Run `tsx .ai/alpha/scripts/spec-orchestrator.ts` with a test spec
- Observe successful sandbox creation
- Observe successful database seeding phase
- Verify no "Cannot find module" errors occur

#### Step 4: Code Review and Validation

Ensure code quality and no regressions.

- Review the code change for clarity and correctness
- Verify error handling (timeout, command failure)
- Confirm logging/output is informative
- Run `pnpm typecheck` and `pnpm lint` to ensure no issues

## Testing Strategy

### Unit Tests

Not applicable - this is initialization code without unit-testable logic.

### Integration Tests

**Scenario 1**: Sandbox creation with build step
- Create sandbox with template
- Verify `pnpm install` succeeds
- Verify `pnpm --filter @kit/shared build` succeeds
- Verify dist directories exist

**Test execution**: Manual testing via `tsx .ai/alpha/scripts/spec-orchestrator.ts`

### Manual Testing Checklist

Execute these tests to validate the fix:

- [ ] Create E2B sandbox instance successfully
- [ ] Verify `pnpm install` completes without errors
- [ ] Verify build command executes and succeeds
- [ ] Verify `@kit/shared/dist/logger/index.js` exists after build
- [ ] Run `pnpm run payload migrate` - should not fail with module error
- [ ] Run full Alpha orchestrator workflow without seeding errors
- [ ] Verify no new errors or warnings in sandbox output

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Build Command Timeout**: If `@kit/shared` build takes longer than expected
   - **Likelihood**: low
   - **Impact**: medium (sandbox creation fails)
   - **Mitigation**: Set timeout to 120 seconds (should be plenty for a single package build); monitor build times during testing

2. **Build Command Failure**: If the package has unresolved dependencies or build errors
   - **Likelihood**: low (package builds successfully in local dev)
   - **Impact**: high (orchestrator workflow broken)
   - **Mitigation**: Test thoroughly in sandbox; add clear error messages; consider fallback strategies if build fails

3. **Sandbox Creation Time**: Additional build step adds 10-15 seconds to initialization
   - **Likelihood**: high
   - **Impact**: low (minimal user impact)
   - **Mitigation**: Not a concern; worth the reliability improvement

**Rollback Plan**:

If the build step causes issues:
1. Remove the `pnpm --filter @kit/shared build` command from `.ai/alpha/scripts/lib/sandbox.ts`
2. Revert to the previous version of the file
3. Return to the original error state (which is acceptable since this is a bug fix)

**Monitoring**: N/A for this fix - success is deterministic (build succeeds or fails).

## Performance Impact

**Expected Impact**: minimal

- Adds ~10-15 seconds to sandbox creation time (one-time cost)
- Builds only a single small package (`@kit/shared`)
- Pays off immediately on first Payload command execution

## Security Considerations

**Security Impact**: none

This is a build step for an internal utility package. No security implications.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# The Alpha orchestrator fails during seeding phase
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362
```

**Expected Result**: Error message containing "Cannot find module '/home/user/project/apps/payload/node_modules/@kit/shared/dist/logger/index.js'"

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run Alpha orchestrator
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362
```

**Expected Result**:
- All commands succeed
- Sandbox creation completes successfully
- Database seeding phase completes without module resolution errors
- Orchestrator workflow progresses to next phase

### Regression Prevention

```bash
# Verify no changes to other orchestrator functionality
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --dry-run

# Verify sandbox still functions for other operations
# (E2B CLI commands if available)
```

## Dependencies

### New Dependencies

None required.

### Existing Dependencies

- Sandbox instance must have `pnpm` installed (already in template)
- `@kit/shared` package must have build script in `package.json` (already defined)

## Database Changes

None required - this is purely an initialization fix.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - this change is to the orchestrator script, not production code.

**Feature flags needed**: No

**Backwards compatibility**: Maintained - only adds a build step during initialization.

## Success Criteria

The fix is complete when:
- [ ] `.ai/alpha/scripts/lib/sandbox.ts` includes the build step
- [ ] Build command runs after `pnpm install` during sandbox creation
- [ ] Database seeding no longer fails with "Cannot find module" error
- [ ] Alpha orchestrator workflow completes successfully
- [ ] No new errors or regressions introduced
- [ ] Code passes linting and type checking

## Notes

This is a straightforward fix addressing a clear root cause. The E2B sandbox template needs to build workspace packages after installation to ensure all imports resolve correctly. The fix is minimal, low-risk, and solves the immediate issue while maintaining flexibility for future enhancements.

The build command uses `--filter @kit/shared` for precision, but could be extended to other packages if similar issues arise. Consider documenting this pattern for future use.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1519*
