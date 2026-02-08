# Bug Fix: E2E Sharded Workflow - Fix tsx Execution with pnpm --filter

**Related Diagnosis**: #1678 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `pnpm exec tsx` at root cannot find tsx installed in nested `apps/e2e` workspace
- **Fix Approach**: Use `pnpm --filter web-e2e exec tsx` to run command in e2e workspace context
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The E2E sharded workflow fails with "Command tsx not found" because `pnpm exec tsx` runs at root workspace level, but `tsx` is only installed in `apps/e2e/package.json`. pnpm's `exec` at root only searches root-level binaries, not nested workspace binaries.

For full details, see diagnosis issue #1678.

### Solution Approaches Considered

#### Option 1: Use pnpm --filter to Execute in Workspace Context ⭐ RECOMMENDED

**Description**: Change `pnpm exec tsx` to `pnpm --filter web-e2e exec tsx`, which tells pnpm to run the command in the e2e workspace where tsx is installed. Adjust the file path from absolute (`apps/e2e/tests/...`) to relative (`tests/...`) since we're now executing from the e2e workspace directory.

**Pros**:
- Surgical fix - single line change in workflow
- Keeps tsx scoped to where it's actually used (e2e tests)
- No dependency pollution at root level
- Aligns with pnpm workspace best practices
- Zero risk - only changes how tsx is invoked, not what it does
- No new dependencies or package.json changes

**Cons**:
- Requires understanding pnpm --filter flag (minimal learning curve)
- Path changes from absolute to relative (but clear from context)

**Risk Assessment**: low - This is a well-documented pnpm pattern with no side effects. The --filter flag is stable and commonly used in monorepo workflows.

**Complexity**: simple - Single line change: command + path adjustment

#### Option 2: Add tsx to Root package.json

**Description**: Install tsx at root level (`pnpm add -D tsx -w`) so `pnpm exec tsx` can find it.

**Pros**:
- Simple mental model - tsx available everywhere
- No path adjustments needed
- Might be useful if other root-level scripts need tsx in the future

**Cons**:
- Adds dependency where it's not needed (only e2e uses tsx)
- Increases root bundle size unnecessarily
- Goes against workspace isolation principles
- Requires package.json modification and lockfile update
- Higher chance of version conflicts if multiple packages use tsx

**Why Not Chosen**: Violates monorepo best practices by polluting root with workspace-specific dependencies. The --filter approach is cleaner and more maintainable.

#### Option 3: Use Direct Path to Binary

**Description**: Reference tsx binary directly: `./apps/e2e/node_modules/.bin/tsx`

**Why Not Chosen**: Fragile - relies on pnpm's internal directory structure which could change. Not portable across different package managers. --filter is the officially supported approach.

### Selected Solution: Use pnpm --filter web-e2e exec tsx

**Justification**: This is the most correct solution for pnpm workspaces. It:
- Respects workspace boundaries
- Uses official pnpm features (--filter)
- Requires minimal changes (one line)
- Has zero risk of side effects
- Follows monorepo best practices

**Technical Approach**:
- Change command from `pnpm exec tsx` to `pnpm --filter web-e2e exec tsx`
- Adjust file path from `apps/e2e/tests/setup/supabase-health.ts` to `tests/setup/supabase-health.ts` (relative to e2e workspace)
- The --filter flag tells pnpm to:
  1. Change working directory to `apps/e2e`
  2. Use that workspace's node_modules/.bin
  3. Execute tsx from there

**Architecture Changes**: None - This is purely a command invocation change

**Migration Strategy**: No migration needed - This is a one-time fix with no backwards compatibility concerns

## Implementation Plan

### Affected Files

- `.github/workflows/e2e-sharded.yml` (line 102) - Change tsx execution command to use --filter flag

### New Files

None required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update the workflow file

Update `.github/workflows/e2e-sharded.yml` line 102:

- Open the file and locate the "Wait for Supabase health" step
- Find: `pnpm exec tsx apps/e2e/tests/setup/supabase-health.ts`
- Replace with: `pnpm --filter web-e2e exec tsx tests/setup/supabase-health.ts`

**Why this step first**: This is the only change needed to fix the root cause

#### Step 2: Verify the workflow syntax

- Ensure the YAML is valid by reviewing the line visually
- Confirm the path is now relative to the e2e workspace (`tests/setup/...` instead of `apps/e2e/tests/setup/...`)
- No additional syntax validation needed - this is a simple command substitution

#### Step 3: Test the fix

- Push a change to a branch that triggers the E2E sharded workflow
- Monitor the "Setup Test Server" job to confirm the "Wait for Supabase health" step succeeds
- Verify that `pnpm --filter web-e2e exec tsx` successfully finds and executes tsx
- Confirm the health check script runs to completion

**Why this step**: Confirms the fix resolves the original issue in the CI environment

#### Step 4: Verify no regressions

- Check that the entire E2E test suite runs to completion
- Ensure no new errors are introduced by the workflow change
- Confirm test results match expected behavior

## Testing Strategy

### Unit Tests

No unit tests needed - this is a workflow configuration change with no application code changes.

### Integration Tests

No integration tests needed - the workflow itself serves as the integration test.

### E2E Tests

The E2E test suite will automatically validate this fix when the workflow runs successfully.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Push to a branch to trigger E2E sharded workflow
- [ ] Monitor GitHub Actions for workflow execution
- [ ] Confirm "Setup Test Server" job completes without errors
- [ ] Verify "Wait for Supabase health" step outputs successful execution (no "tsx not found" error)
- [ ] Confirm entire E2E test suite runs to completion
- [ ] Check for any new error messages in workflow logs
- [ ] Verify no changes to test execution or results

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **pnpm version compatibility**: Different pnpm versions might behave differently with --filter
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: The --filter flag has been stable across pnpm versions for years. It's a core feature. Workflow uses pnpm 10.14.0 explicitly.

2. **Path resolution issues**: Relative path might not resolve correctly
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: pnpm --filter changes working directory to the filtered workspace, so relative paths are expected. This is documented pnpm behavior.

3. **Environment differences**: Local development vs CI environment might execute differently
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: pnpm --filter works identically in both environments - this is the whole point of using it

**Rollback Plan**:

If this fix causes unexpected issues:
1. Revert the change: Replace `pnpm --filter web-e2e exec tsx tests/...` back to `pnpm exec tsx apps/e2e/tests/...`
2. Investigate alternative solutions (Option 2: add tsx to root)
3. No data loss or configuration changes are involved

**Monitoring** (if needed):

None required - This is a low-risk infrastructure change that either works or doesn't. Monitor the first workflow run after the fix to confirm success.

## Performance Impact

**Expected Impact**: none

No performance implications. The command execution is identical, just invoked from the correct workspace context. If anything, performance might marginally improve by avoiding the "command not found" error retry logic.

## Security Considerations

**Security Impact**: none

This is a purely internal workflow change with no security implications. No new dependencies, no external APIs, no data handling changes.

## Validation Commands

### Before Fix (Bug Should Reproduce)

To confirm the bug exists on the current dev branch:
1. Push to `dev` branch
2. Watch GitHub Actions workflow execution
3. Look for error: `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command "tsx" not found` in "Wait for Supabase health" step

**Expected Result**: Workflow fails with `tsx: not found` error

### After Fix (Bug Should Be Resolved)

```bash
# Verify workflow YAML syntax (local validation)
# You can use yamllint or just review the file manually

# Trigger workflow via git push
git push origin <branch>

# Monitor GitHub Actions:
# - Setup Test Server job should complete successfully
# - Wait for Supabase health step should execute without errors
# - Full E2E test suite should run to completion
```

**Expected Result**:
- Workflow completes successfully
- No `tsx: not found` errors
- No `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL` errors
- E2E tests execute normally

### Regression Prevention

```bash
# No additional regression tests needed for a one-line YAML change
# The workflow itself serves as the validation that the fix works
```

## Dependencies

**No new dependencies required**

The tsx package is already installed in `apps/e2e/package.json` from issue #1659. This fix simply changes how we invoke it.

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

This is a workflow file change only - it affects CI/CD execution, not application deployment.

**Feature flags needed**: no

**Backwards compatibility**: maintained

The change is backwards compatible and doesn't affect any deployed code. It only changes how the CI workflow invokes tsx.

## Success Criteria

The fix is complete when:
- [ ] `.github/workflows/e2e-sharded.yml` line 102 updated to use `pnpm --filter web-e2e exec tsx`
- [ ] File path updated to be relative (`tests/setup/...` instead of `apps/e2e/tests/setup/...`)
- [ ] GitHub Actions workflow executes successfully on next push
- [ ] "Setup Test Server" job completes without errors
- [ ] "Wait for Supabase health" step finds and executes tsx command successfully
- [ ] E2E test suite runs to completion
- [ ] No new errors introduced

## Notes

This fix completes the tsx migration chain:
1. #1657: Replaced ts-node with tsx, used `npx tsx` (npx incompatible with pnpm)
2. #1659: Added tsx as devDependency to apps/e2e (not sufficient for npx)
3. #1676: Changed to `pnpm exec tsx` (wrong workspace context)
4. **#1678 (this fix)**: Use `pnpm --filter` to execute in correct workspace

**pnpm --filter flag documentation**:
- The `--filter` flag tells pnpm to execute a command in the context of a specific workspace package
- Syntax: `pnpm --filter <package-name> <command>`
- When used, pnpm:
  1. Changes the working directory to the specified workspace
  2. Uses that workspace's node_modules/.bin for command resolution
  3. Executes the command from there

This is the standard pnpm pattern for running workspace-scoped commands in monorepos.

**Related pnpm documentation**:
- https://pnpm.io/filtering
- https://pnpm.io/cli/exec

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1678*
