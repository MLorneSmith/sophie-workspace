# Bug Fix: pnpm install fails in E2B sandbox — missing CI=true causes TTY abort

**Related Diagnosis**: #2087 (REQUIRED)
**Severity**: high
**Bug Type**: error
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `getAllEnvVars()` in `environment.ts` doesn't set `CI=true`, causing pnpm to abort when it needs TTY confirmation for module removal in headless E2B sandboxes
- **Fix Approach**: Add single line `envs.CI = "true"` to `getAllEnvVars()` function
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2B sandboxes are headless cloud VMs without TTY (terminal) capability. When `pnpm install` needs to remove or modify `node_modules` directories (e.g., when lockfile changes), it normally prompts for confirmation. Without TTY, this prompt cannot be answered, and pnpm aborts with:

```
ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY — Aborted removal of modules directory due to no TTY
```

This blocks the Alpha Spec Orchestrator when resuming implementations where the `dev` branch has had dependency updates since the spec branch was created. Example: S2086 was blocked when PostHog SDK updates in commit `22ca3cf45` created lockfile differences.

For full details, see diagnosis issue #2087.

### Solution Approaches Considered

#### Option 1: Set CI=true in getAllEnvVars() ⭐ RECOMMENDED

**Description**: Add `envs.CI = "true"` to the `getAllEnvVars()` function in `environment.ts` after the `IS_SANDBOX=1` line. This tells pnpm it's running in a CI (continuous integration) non-interactive environment, which prevents TTY-dependent prompts.

**Pros**:
- Single line change, extremely simple
- Semantically correct: E2B sandboxes ARE non-interactive CI environments
- Fixes all 4 `pnpm install` code paths simultaneously (lines 973, 978, 987, 1499)
- Industry standard practice (equivalent to CI=true used in GitHub Actions, CircleCI, etc.)
- Prevents future similar issues automatically

**Cons**:
- Affects all E2B operations (but this is desired behavior for sandboxes)

**Risk Assessment**: low - Setting CI=true is a standard practice with no side effects in CI environments

**Complexity**: simple - One-line change

#### Option 2: Add --no-verify flag to pnpm install

**Description**: Pass `--no-verify` flag to all `pnpm install` commands to skip TTY checks.

**Pros**:
- Targeted to specific commands
- Doesn't affect other environment operations

**Cons**:
- Requires 4 separate changes (lines 973, 978, 987, 1499)
- Bypasses pnpm validation checks rather than signaling CI environment
- Less robust: doesn't follow industry standards
- More maintenance burden if new pnpm install locations are added

**Why Not Chosen**: Less clean than Option 1, requires multiple changes, and doesn't follow standard CI environment practices.

#### Option 3: Use --frozen-lockfile consistently

**Description**: Always use `--frozen-lockfile` flag with all `pnpm install` commands to prevent module directory modifications.

**Pros**:
- Prevents lockfile changes
- Respects exact lockfile state

**Cons**:
- Won't work when lockfile HAS changed (which is the exact trigger scenario)
- Causes failures when spec branch has older lockfile than dev branch
- Doesn't solve the problem, just avoids it

**Why Not Chosen**: This doesn't address the root issue and fails in the exact scenario that's causing the problem.

### Selected Solution: Set CI=true in getAllEnvVars()

**Justification**: This approach is the gold standard for CI/non-interactive environments. It's simple, semantically correct, fixes all code paths at once, and follows industry best practices. The E2B sandbox environment is essentially a CI environment (cloud VM without TTY), so setting CI=true accurately describes the execution context.

**Technical Approach**:
- Add `envs.CI = "true"` in `environment.ts` after the `IS_SANDBOX=1` line
- This env var propagates to all child processes spawned in the sandbox
- pnpm detects CI=true and enables non-interactive mode automatically
- All 4 pnpm install locations benefit immediately

**Architecture Changes**: None - this is a configuration value, not an architectural change.

**Migration Strategy**: Not needed - this is a pure fix with no migrations or data changes.

## Implementation Plan

### Affected Files

List files that need modification:
- `.ai/alpha/scripts/lib/environment.ts` - Add CI=true to getAllEnvVars() function (~line 450)

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Locate and verify getCurrentEnvVars() function

<describe what this step accomplishes>

- Read `.ai/alpha/scripts/lib/environment.ts` to understand current structure
- Find the `getAllEnvVars()` function (lines 426-559)
- Identify where `IS_SANDBOX=1` is set (should be around line 450)
- Verify the function returns `envs` object

**Why this step first**: Must understand current code before making changes

#### Step 2: Add CI=true environment variable

<describe what this step accomplishes>

- Add line `envs.CI = "true"` immediately after `envs.IS_SANDBOX = "1"`
- Ensure proper indentation matches existing code
- Verify no syntax errors

#### Step 3: Verify the change

- Run typecheck to ensure no TypeScript errors: `pnpm typecheck`
- Run linting: `pnpm lint`
- Verify file structure is still valid

#### Step 4: Add unit test (optional but recommended)

- Add test case to verify CI env var is set in E2B sandboxes
- Verify test passes: `pnpm test:unit`

#### Step 5: Validation

- Run all validation commands (see Validation Commands section)
- Verify zero TypeScript errors
- Verify zero linting errors

## Testing Strategy

### Unit Tests

The change requires verifying that `CI=true` is included in E2B sandbox environment variables.

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/environment.spec.ts` (if exists) or create new test

**Test scenarios**:
- ✅ Verify `CI` environment variable is set to "true" in getAllEnvVars() output
- ✅ Verify other sandbox env vars (IS_SANDBOX, etc.) are still present
- ✅ Verify CI var is added before returning envs object

### Integration Tests

Test that pnpm install succeeds in sandbox context:
- This will be verified by the Alpha Spec Orchestrator when running subsequent specs
- S2086 resume should no longer fail on sandbox creation

### E2E Tests

The fix validates through running the Alpha Spec Orchestrator:

**Test scenario**:
- Run `tsx .ai/alpha/scripts/spec-orchestrator.ts 2086 --model sonnet --document --force-unlock`
- Verify S2086.I6 features complete without pnpm TTY abort errors

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Verify environment.ts file has `CI=true` line added
- [ ] Run `pnpm typecheck` - should pass
- [ ] Run `pnpm lint` - should pass (no errors)
- [ ] Run `pnpm format:fix` - should pass
- [ ] Run Alpha Spec Orchestrator with S2086 to verify sandbox creation succeeds
- [ ] Verify no new error messages in sandbox logs
- [ ] Confirm S2086.I6 features complete without TTY errors

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **CI=true affects all E2B operations unintentionally**:
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: CI=true is the DESIRED behavior for E2B sandboxes (they are CI environments by definition). This is not a risk but the intended outcome.

2. **pnpm behavior changes unexpectedly**:
   - **Likelihood**: low
   - **Impact**: medium
   - **Mitigation**: CI=true is a standard flag used by all major CI systems (GitHub Actions, CircleCI, Travis CI). pnpm's behavior is well-documented and stable with this flag.

3. **Existing E2B operations fail**:
   - **Likelihood**: very low
   - **Impact**: medium
   - **Mitigation**: This is a bug fix for existing failures. The only "change" is that pnpm stops aborting when it shouldn't. No working operations should be affected.

**Rollback Plan**:

If this fix causes unexpected issues:
1. Remove the line `envs.CI = "true"` from environment.ts
2. Run `pnpm typecheck` and `pnpm lint` to verify
3. Commit rollback: `git revert <commit-hash>`
4. Investigate why CI=true caused issues (very unlikely)

**Monitoring** (if needed):
- Monitor Alpha Spec Orchestrator runs for any E2B sandbox creation failures
- Watch for any pnpm-related errors in sandbox logs
- No persistent monitoring needed after fix validation (one-time fix)

## Performance Impact

**Expected Impact**: none

Setting an environment variable has zero performance impact. The fix actually IMPROVES performance by preventing pnpm from hanging/aborting.

**Performance Testing**: Not applicable - this is a compatibility fix, not a performance change.

## Security Considerations

**Security Impact**: none

Setting `CI=true` has no security implications. It's a standard practice in CI environments and is public documentation about the execution context (not a secret or credential).

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run orchestrator with S2086 - will fail on sandbox creation with TTY abort error
tsx .ai/alpha/scripts/spec-orchestrator.ts 2086 --model sonnet
```

**Expected Result**: CommandExitError at line 987 in sandbox.ts with message about "Aborted removal of modules directory due to no TTY"

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format:fix

# Build (if applicable)
pnpm build

# Manual verification - run orchestrator again
tsx .ai/alpha/scripts/spec-orchestrator.ts 2086 --model sonnet --document --force-unlock
```

**Expected Result**:
- All validation commands succeed
- Orchestrator completes without TTY abort errors
- S2086.I6 features implement successfully
- Sandbox creation succeeds for all features

### Regression Prevention

```bash
# Verify no other E2B operations are affected
# Run any existing E2B-based tests or operations that depend on sandboxes
pnpm test:alpha  # If such test suite exists
```

## Dependencies

### New Dependencies (if any)

No new dependencies required - this uses existing environment variable mechanism.

**No new dependencies**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: very low

**Special deployment steps**: None - this is a configuration change in a utility function

**Feature flags needed**: No

**Backwards compatibility**: maintained - Setting CI=true is additive and doesn't break any existing behavior

## Success Criteria

The fix is complete when:
- [ ] `environment.ts` has line `envs.CI = "true"` added
- [ ] All validation commands pass (typecheck, lint, format)
- [ ] Alpha Spec Orchestrator successfully creates E2B sandbox without TTY abort
- [ ] S2086.I6 features complete without pnpm errors
- [ ] Zero regressions in existing E2B operations
- [ ] Code review approved
- [ ] Manual testing checklist complete

## Notes

**Why CI=true is correct for E2B sandboxes:**
- E2B sandboxes are cloud VMs without TTY
- They are used for automated code execution (CI/CD equivalent)
- Setting CI=true follows industry standards and best practices
- All major CI systems (GitHub Actions, CircleCI, Travis CI) set CI=true

**Related pnpm issues:**
- This is the 3rd pnpm-related issue in E2B sandboxes
- Previous issues: timeout handling (#1846), frozen-lockfile handling (#1924)
- This fix addresses the root cause of the TTY issue

**Industry reference:**
- Node.js ecosystem standardizes on CI environment variable
- Reference: https://github.com/npm/npm/wiki/Developers#pulling-changes
- pnpm respects CI=true automatically

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #2087*
