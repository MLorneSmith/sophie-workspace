# Bug Fix: E2E Sharded Workflow Fails - ts-node Not Found in CI

**Related Diagnosis**: #1655
**Severity**: high
**Bug Type**: infrastructure
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: TypeScript health check script added in #1642 uses `npx ts-node` but `ts-node` is not a dependency of `apps/e2e` or root workspace
- **Fix Approach**: Replace `ts-node` with `tsx` (simpler, faster, no tsconfig required)
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The E2E sharded workflow fails in the "Wait for Supabase health" step with error `sh: 1: ts-node: not found`. Commit `426546f43` added a TypeScript health check script at `apps/e2e/tests/setup/supabase-health.ts`, and commit `8403ad4a8` integrated it into the workflow at `.github/workflows/e2e-sharded.yml` line 102. However, `ts-node` is not available as a dependency in the CI runner.

**Evidence**:
```
2026-01-20T23:03:09.1380084Z sh: 1: ts-node: not found
##[error]Process completed with exit code 127.
```

### Solution Approaches Considered

#### Option 1: Use `tsx` instead of `ts-node` ⭐ RECOMMENDED

**Description**: Replace `npx ts-node` with `npx tsx` in the workflow. The `tsx` package is already a dependency of the `apps/e2e` package (used for development), and it works with TypeScript files without requiring explicit tsconfig configuration for simple scripts.

**Pros**:
- `tsx` is already available in `apps/e2e` (installed via other dependencies)
- Faster execution than `ts-node`
- No tsconfig configuration needed
- Zero code changes required
- Works identically to current command

**Cons**:
- Requires updating workflow command (one line change)
- `tsx` is not explicitly listed as a direct dependency (it's a transitive dependency)

**Risk Assessment**: low - Single command replacement, no code changes

**Complexity**: simple - One line workflow change

#### Option 2: Add `ts-node` as explicit devDependency

**Description**: Add `ts-node` and `typescript` as devDependencies to `apps/e2e/package.json`, making them explicitly available for `npx ts-node` to find.

**Pros**:
- Explicit dependency makes intent clear
- Can configure tsconfig behavior if needed in future
- Uses the tool that the script was designed for

**Cons**:
- Adds unnecessary package overhead
- `tsx` is better maintained and simpler
- Adds node_modules bloat to `apps/e2e`
- Requires two new dependencies (`ts-node` + `typescript`)

**Why Not Chosen**: Option 1 (tsx) is simpler, faster, and doesn't add unnecessary dependencies. The package is already available in the workspace.

#### Option 3: Convert to Bash with curl/pg_isready

**Description**: Replace the TypeScript health check script with a pure bash script using curl and pg_isready commands.

**Pros**:
- No TypeScript dependencies needed
- Bash is guaranteed to be available
- Simpler to understand

**Cons**:
- Loses the sophisticated multi-stage health check logic in TypeScript
- Bash is less maintainable and harder to extend
- Would require rewriting the health check script completely
- Loses structured error messages and detailed diagnostics

**Why Not Chosen**: We already have a well-designed TypeScript health check script that works well. Simply using `tsx` to run it is the pragmatic solution.

### Selected Solution: Use `tsx` instead of `ts-node`

**Justification**:
The `tsx` package is already available in the monorepo as a transitive dependency (it's used by testing and build infrastructure). Replacing `ts-node` with `tsx` is a one-line change that eliminates the CI failure with zero risk. This approach respects the existing TypeScript health check design while avoiding unnecessary dependency additions.

**Technical Approach**:
- Update `.github/workflows/e2e-sharded.yml` line 102
- Change `npx ts-node --project apps/e2e/tsconfig.json` to `npx tsx`
- The `--project` flag is not needed with `tsx` as it auto-detects tsconfig

**Architecture Changes**: None - purely a dependency resolution change

## Implementation Plan

### Affected Files

- `.github/workflows/e2e-sharded.yml` - Update the "Wait for Supabase health" step to use `tsx` instead of `ts-node`
- `apps/e2e/tests/setup/supabase-health.ts` - No changes needed

### New Files

None required.

### Step-by-Step Tasks

#### Step 1: Update workflow command

**Objective**: Replace `ts-node` with `tsx` in the CI workflow

- Open `.github/workflows/e2e-sharded.yml`
- Locate the "Wait for Supabase health" step (around line 102)
- Change the command from:
  ```yaml
  npx ts-node --project apps/e2e/tsconfig.json apps/e2e/tests/setup/supabase-health.ts
  ```
  to:
  ```yaml
  npx tsx apps/e2e/tests/setup/supabase-health.ts
  ```
- The tsconfig flag is not needed with `tsx`

**Why this step first**: This is the only change needed to resolve the issue. The health check script logic is correct and doesn't need modification.

#### Step 2: Verify workflow syntax

**Objective**: Ensure the YAML is valid and the command is correct

- Run YAML linting on the workflow file (if available)
- Verify the indentation and syntax matches surrounding steps
- Confirm the command is on a single line or properly continued

#### Step 3: Test in CI

**Objective**: Verify the fix works by running the workflow

- Push changes to a test branch
- Trigger the E2E sharded workflow
- Verify that the "Wait for Supabase health" step completes successfully
- Confirm the health check runs to completion without timeout

#### Step 4: Validation

**Objective**: Ensure fix is complete with zero regressions

- Run `pnpm typecheck` to verify no TypeScript issues
- Run `pnpm lint` to verify workflow syntax
- Verify no other workflows reference `ts-node` with similar issues
- Check git log to ensure no other commits affected the health check script

## Testing Strategy

### Unit Tests

No unit tests needed - this is a CI workflow fix that doesn't affect application code.

### Integration Tests

No integration tests needed.

### E2E Tests

The fix is verified by the E2E workflow itself:
- The "Wait for Supabase health" step must complete successfully
- The Supabase health check must properly validate the database is ready
- Subsequent test execution must proceed normally

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Review the workflow change in `.github/workflows/e2e-sharded.yml`
- [ ] Verify `npx tsx` is available in CI environment (should be via transitive dependencies)
- [ ] Push fix to a test branch and trigger E2E sharded workflow
- [ ] Confirm "Wait for Supabase health" step succeeds (previously failed with "ts-node: not found")
- [ ] Confirm subsequent health check stages execute (multi-stage check)
- [ ] Verify tests proceed to execution (no blocking errors)
- [ ] Check workflow logs for any warnings related to tsx usage
- [ ] Verify fix doesn't affect local development (developers still use `npm run` commands)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **`tsx` not available in CI runner**: Very unlikely
   - **Likelihood**: low
   - **Impact**: medium (same failure as before)
   - **Mitigation**: `tsx` is a standard package used throughout monorepo. If it's missing, the entire test infrastructure would fail. This is not a realistic concern. Fallback: add explicit `tsx` dependency.

2. **Subtle behavior differences between `tsx` and `ts-node`**: Very unlikely
   - **Likelihood**: low
   - **Impact**: low (health check is straightforward)
   - **Mitigation**: `tsx` is faster and more stable than `ts-node`. The TypeScript script is simple and has no exotic features.

3. **Breaking change for developers**: No impact
   - **Likelihood**: N/A
   - **Impact**: N/A
   - **Mitigation**: Developers continue using existing npm scripts. This is a CI-only change.

**Rollback Plan**:

If `tsx` is not available in CI (extremely unlikely):
1. Revert `.github/workflows/e2e-sharded.yml` to previous commit
2. Add `tsx` as explicit devDependency: `pnpm --filter @kit/e2e add -D tsx`
3. Reapply the workflow change
4. Re-push to trigger workflow

**Monitoring** (if needed):

None - this is a simple, low-risk fix. The workflow logs will immediately show success or failure.

## Performance Impact

**Expected Impact**: none

The command execution time is identical or slightly faster with `tsx` vs `ts-node`. No performance implications for test suite or CI pipeline.

## Security Considerations

**Security Impact**: none

This fix only changes how the health check script is executed. The script itself is unchanged. No new security vectors introduced.

## Validation Commands

### Before Fix (Bug Should Reproduce)

Unfortunately, we cannot reproduce this in local development - it only occurs in CI where `ts-node` is not available. The workflow would fail with:

```
2026-01-20T23:03:09.1380084Z sh: 1: ts-node: not found
##[error]Process completed with exit code 127.
```

### After Fix (Bug Should Be Resolved)

```bash
# Verify the workflow syntax is valid
pnpm lint

# Type check to ensure no TypeScript issues
pnpm typecheck

# View the workflow change
cat .github/workflows/e2e-sharded.yml | grep -A 2 "Wait for Supabase health"
```

**Expected Result**:

1. Workflow YAML is valid (no lint errors)
2. No TypeScript compilation errors
3. The command shows `npx tsx apps/e2e/tests/setup/supabase-health.ts`
4. E2E sharded workflow succeeds when triggered

### Regression Prevention

Push to test branch and verify:
- E2E sharded workflow completes successfully
- "Wait for Supabase health" step executes and reports success
- Subsequent test steps proceed normally
- No other workflow failures introduced

## Dependencies

### New Dependencies

**No new dependencies required**

The `tsx` package is already available in the monorepo as a transitive dependency. No package installations needed.

**Dependencies already present**:
- `tsx` (via existing build infrastructure)
- Workflow runners have Node.js and npm pre-installed

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - this only affects the E2E CI workflow.

**Feature flags needed**: no

**Backwards compatibility**: N/A - CI workflow change only

## Success Criteria

The fix is complete when:
- [ ] `.github/workflows/e2e-sharded.yml` updated to use `tsx` instead of `ts-node`
- [ ] E2E sharded workflow executes without "ts-node: not found" error
- [ ] "Wait for Supabase health" step completes successfully
- [ ] All subsequent E2E test shards proceed normally
- [ ] Zero regressions in other workflows
- [ ] Change is minimal (single command replacement)

## Notes

This fix addresses the immediate CI failure introduced in #1642. The health check script itself is well-designed and doesn't need modification - we just need the right tool to execute it.

The root cause was assuming `ts-node` would be available globally or as a workspace dependency. Using `tsx` (which is already present) is the pragmatic solution that respects the design without adding bloat.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1655*
