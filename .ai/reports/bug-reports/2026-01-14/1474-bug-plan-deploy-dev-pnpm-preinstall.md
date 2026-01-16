# Bug Fix: Deploy to Dev Failing - preinstall Hook Uses pnpm Workspace Filter Before Setup

**Related Diagnosis**: #1473
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: The `preinstall` hook in root `package.json` runs `pnpm run --filter scripts requirements`, but `preinstall` executes BEFORE the pnpm workspace is materialized, causing the filter command to fail and exit with code 1
- **Fix Approach**: Move requirements check from `preinstall` to `postinstall` lifecycle hook
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The "Deploy to Dev" GitHub workflow has been failing consistently since January 9, 2026. Both the "Deploy Web App to Dev" and "Deploy Payload CMS to Dev" jobs fail during the Vercel deploy step with:

```
Error: Command "pnpm install" exited with 1
```

The root cause is that the root `package.json` has a `preinstall` hook that runs `pnpm run --filter scripts requirements`. This script depends on the pnpm workspace being fully materialized, but `preinstall` runs BEFORE the workspace setup is complete, causing the filter command to fail. This failure causes `pnpm install` to exit with a non-zero code.

The `requirements` script only checks Node.js and pnpm versions - it does not need to run before dependencies are installed. It's purely a validation check that can safely run after installation completes.

### Solution Approaches Considered

#### Option 1: Move to postinstall ⭐ RECOMMENDED

**Description**: Move the requirements check from `preinstall` to `postinstall` lifecycle hook. This allows the pnpm workspace to fully materialize before running the filter command.

**Pros**:
- Solves the root cause immediately
- pnpm workspace is fully set up when `postinstall` runs
- Filter command can execute successfully
- Minimal code change (2 lines in package.json)
- Zero risk to existing functionality
- No performance impact (requirements check is instant)

**Cons**:
- Requirements check runs after install instead of before (minor semantic difference, but functionally equivalent)

**Risk Assessment**: low - `postinstall` is a standard lifecycle hook, and the requirements check only validates versions without modifying anything

**Complexity**: simple - single-line change in package.json

#### Option 2: Remove preinstall Entirely

**Description**: Delete the `preinstall` hook completely and rely on documentation/CI validation for version requirements.

**Pros**:
- Simplest change (1 line deletion)
- No workspace dependency issues

**Cons**:
- Loses automated version validation
- Requirements would only be checked via CI, not locally
- Developers could have wrong versions without immediate feedback
- Less helpful for local development experience

**Why Not Chosen**: Option 1 is better because it maintains the helpful developer experience of automatic version validation while fixing the deployment issue.

#### Option 3: Rewrite requirements Script to not Use Filter

**Description**: Create a version of the requirements script that doesn't use `--filter` and can run in `preinstall`.

**Pros**:
- Keeps the validation in preinstall

**Cons**:
- More complex implementation
- Duplicates script logic
- Harder to maintain two versions
- `--filter` is the idiomatic way to run workspace scripts

**Why Not Chosen**: Option 1 is simpler and more maintainable.

### Selected Solution: Move to postinstall

**Justification**: Moving the requirements check to `postinstall` is the cleanest solution because:
1. It's a one-line change that requires no code logic changes
2. The requirements script is purely validational and doesn't need to run before install
3. It maintains the helpful developer experience
4. It's the standard pattern for workspace setup validation in pnpm monorepos
5. It has zero risk because it only validates versions without modifying behavior

**Technical Approach**:
- Change `"preinstall": "pnpm run --filter scripts requirements"` to `postinstall` hook
- Update the `postinstall` script to run both the requirements check and the existing `manypkg fix` command
- The `manypkg fix` command should still run (currently in postinstall)

**Architecture Changes**: None - this is a pure hook lifecycle change

**Migration Strategy**: No data migration needed. This is a build-time script change with no runtime impact.

## Implementation Plan

### Affected Files

- `package.json` - Root workspace package.json (line 15-16)
  - Remove the `preinstall` hook
  - Update `postinstall` to run requirements check before manypkg fix

### New Files

- No new files needed

### Step-by-Step Tasks

#### Step 1: Update package.json scripts

Modify the root `package.json` to move requirements check from preinstall to postinstall:

**Current state (line 15-16)**:
```json
"preinstall": "pnpm run --filter scripts requirements",
"postinstall": "manypkg fix",
```

**New state**:
```json
"postinstall": "pnpm run --filter scripts requirements && manypkg fix",
```

Remove the `preinstall` line entirely.

**Why this step first**: This is the core fix and must be done before testing. The requirements check happens first (version validation), then manypkg fix (monorepo consistency).

#### Step 2: Verify the scripts package exists and works

- Ensure `packages/scripts/package.json` exists and has a `requirements` script
- Verify the script runs successfully: `pnpm --filter scripts requirements`
- This validates that the requirements check can run in postinstall

**Why this step**: Confirms the filter command will work when pnpm workspace is ready

#### Step 3: Test the fix locally

- Remove `node_modules` and `pnpm-lock.yaml`
- Run `pnpm install` to verify:
  - Install completes successfully
  - `postinstall` hook runs
  - Requirements check passes
  - manypkg fix completes
  - No errors in console

**Why this step**: Verifies the fix works in a clean environment before pushing to dev

#### Step 4: Validate no regressions

- Verify existing functionality still works:
  - Dev server starts: `pnpm dev`
  - Build completes: `pnpm build`
  - Tests pass: `pnpm test:unit`
  - Linting passes: `pnpm lint`
- Ensure all workspace scripts still function normally

**Why this step**: Confirms the lifecycle hook change doesn't break anything

#### Step 5: Push to dev branch and monitor deployment

- Commit the change with conventional commit format
- Push to `dev` branch
- Monitor the "Deploy to Dev" GitHub workflow
- Verify both "Deploy Web App to Dev" and "Deploy Payload CMS to Dev" jobs succeed
- Confirm Vercel deployment completes without errors

**Why this step**: Validates the fix in the actual CI/CD pipeline where the original issue occurred

## Testing Strategy

### Unit Tests

No unit tests needed - this is a build-time script configuration change with no runtime code changes.

### Integration Tests

No integration tests needed - the fix doesn't affect application logic.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Clean install works: `rm -rf node_modules pnpm-lock.yaml && pnpm install` (no errors)
- [ ] Requirements check runs in postinstall (check console output)
- [ ] manypkg fix runs after requirements (check console output)
- [ ] Dev server starts: `pnpm dev` (FORCE_COLOR=1 turbo dev runs successfully)
- [ ] Build succeeds: `pnpm build` (turbo build completes)
- [ ] Type checking passes: `pnpm typecheck` (no errors)
- [ ] Linting passes: `pnpm lint` (no errors)
- [ ] GitHub workflow "Deploy to Dev" succeeds after push to dev branch
- [ ] Both web and payload deployment jobs complete without "pnpm install" errors
- [ ] Verify no console warnings about lifecycle hooks

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **postinstall runs after install completes**: The requirements check happens after packages are already downloaded
   - **Likelihood**: low
   - **Impact**: low (only fails if versions are wrong, which would fail in preinstall anyway)
   - **Mitigation**: The requirements script is just a validation check; it doesn't prevent anything. Developers with wrong versions will get a clear error message. CI will catch this before anything goes to production.

2. **Unexpected interaction with other postinstall hooks**: Other tools might also use postinstall
   - **Likelihood**: low (only manypkg fix currently)
   - **Impact**: low (requirements runs first, should not conflict)
   - **Mitigation**: If issues arise, the change is easily reversible (one-line fix)

**Rollback Plan**:

If this fix causes unexpected issues:
1. Revert the package.json change: restore original `preinstall` and `postinstall` hooks
2. Push to dev branch
3. Re-diagnose the original issue if preinstall approach is truly needed

**Monitoring**: None needed - this is a one-time fix with no ongoing dependencies to monitor

## Performance Impact

**Expected Impact**: none

The requirements check is a simple version validation that completes in <100ms. Moving it from preinstall to postinstall has no measurable performance impact. The pnpm install itself is the time-consuming operation, and that's unaffected.

## Security Considerations

**Security Impact**: none

The requirements script only validates Node.js and pnpm versions. It doesn't run any external commands or install packages. Moving it to postinstall has no security implications.

## Validation Commands

### Before Fix (Bug Should Reproduce)

To verify the bug exists before applying the fix:

1. Check the current package.json:
   ```bash
   cat package.json | grep -A 2 '"preinstall"'
   ```
   Should show: `"preinstall": "pnpm run --filter scripts requirements"`

2. In a clean Vercel/remote environment, run:
   ```bash
   pnpm install
   ```
   Should fail with: `Error: Command "pnpm install" exited with 1`

**Expected Result**: pnpm install fails because preinstall hook tries to use workspace filter before workspace is ready

### After Fix (Bug Should Be Resolved)

```bash
# Verify the fix is applied
cat package.json | grep -A 2 '"postinstall"'
# Should show: "postinstall": "pnpm run --filter scripts requirements && manypkg fix"

# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
# Expected: Clean install completes successfully

# Type check
pnpm typecheck
# Expected: No errors

# Lint
pnpm lint
# Expected: No errors

# Format
pnpm format
# Expected: No changes needed (or shows formatting)

# Build
pnpm build
# Expected: Build succeeds

# Deploy simulation (push to dev branch and monitor GitHub workflow)
git push origin dev
# Expected: "Deploy to Dev" workflow succeeds, both web and payload jobs complete
```

**Expected Result**: All commands succeed, pnpm install completes without errors, GitHub deployment workflow succeeds.

### Regression Prevention

```bash
# Run full test suite to ensure nothing breaks
pnpm test

# Verify all workspace scripts still work
pnpm dev &  # Start dev server in background
# Wait a few seconds, then ctrl+C to stop

# Verify requirements script still works
pnpm --filter scripts requirements
# Expected: Version check passes and returns cleanly
```

## Dependencies

### New Dependencies

**No new dependencies required**

The fix uses existing pnpm lifecycle hooks and existing scripts. No new packages need to be installed.

## Database Changes

**No database changes required**

This is a build-time script fix with no impact on database schema or migrations.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None needed - this is a configuration change that doesn't require coordination

**Feature flags needed**: No

**Backwards compatibility**: Fully maintained - the fix is transparent to all users

## Success Criteria

The fix is complete when:
- [ ] package.json preinstall hook is removed
- [ ] package.json postinstall hook includes requirements check
- [ ] Local clean install succeeds: `pnpm install`
- [ ] All local validation commands pass (typecheck, lint, build, test)
- [ ] GitHub workflow "Deploy to Dev" succeeds after push to dev branch
- [ ] Both "Deploy Web App to Dev" and "Deploy Payload CMS to Dev" jobs complete
- [ ] No "pnpm install" errors in deployment logs
- [ ] Vercel deployment URLs are accessible and working

## Notes

**Implementation is straightforward**: This is a simple one-line change in package.json. The entire fix takes <5 minutes to implement and test.

**Why this happened**: pnpm workspace materialization is asynchronous. The `preinstall` hook runs before this process completes, so `--filter` commands fail. This is a known pnpm pattern (issues #7387, #6289). The fix follows standard pnpm monorepo best practices.

**Future prevention**: If new preinstall logic is ever needed, ensure it doesn't depend on the workspace being materialized. Use `postinstall` for anything that needs the workspace ready.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1473*
