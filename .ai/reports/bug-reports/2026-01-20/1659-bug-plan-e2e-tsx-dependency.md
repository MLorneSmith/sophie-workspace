# Bug Fix: E2E Sharded Workflow Fails - tsx Not Available as Dependency

**Related Diagnosis**: #1658 (REQUIRED)
**Severity**: high
**Bug Type**: integration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `tsx` is a dependency only in `apps/payload` and `scripts/package.json`, but NOT in `apps/e2e/package.json` or root `package.json`. pnpm's strict hoisting prevents the command from finding it when running the E2E health check script.
- **Fix Approach**: Add `tsx` as a devDependency to `apps/e2e/package.json` to make it available in the E2E workspace
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The E2E sharded workflow fails in the "Wait for Supabase health" step with error `sh: 1: tsx: not found`. The previous "fix" (Issue #1657) replaced `ts-node` with `tsx` in the workflow but forgot to add `tsx` as a dependency to `apps/e2e/package.json`, violating pnpm's strict hoisting rules.

For full details, see diagnosis issue #1658.

### Solution Approaches Considered

#### Option 1: Add tsx to apps/e2e/package.json ⭐ RECOMMENDED

**Description**: Add `tsx` as a devDependency to `apps/e2e/package.json` so it's available within the E2E workspace when running `npx tsx` commands.

**Pros**:
- Simple one-line change
- Explicit and clear - E2E package declares its own dependencies
- Maintains workspace isolation and clarity
- pnpm strict hoisting works as designed
- Minimal change footprint
- Future-proof if E2E needs tsx for other scripts

**Cons**:
- Slight duplication since tsx is already in payload and scripts packages
- Adds ~100KB to dependencies (tsx is already installed globally anyway)

**Risk Assessment**: low - Adding a devDependency is a non-breaking change

**Complexity**: simple - Single entry in package.json

#### Option 2: Add tsx to root package.json

**Description**: Add `tsx` to the root `package.json` as a shared devDependency instead of adding it to each workspace that needs it.

**Pros**:
- Avoids duplication across workspaces
- Single source of truth for shared tools

**Cons**:
- Less explicit - unclear which workspaces need tsx
- Makes root package.json heavier
- Violates workspace isolation principle
- Doesn't solve the fundamental issue (pnpm strict hoisting)
- May hide other dependency issues

**Why Not Chosen**: Goes against pnpm workspace best practices. The root should not be dumping ground for workspace dependencies. Each workspace should declare what it needs.

#### Option 3: Move health check script elsewhere

**Description**: Move the TypeScript health check script to a location where tsx is already available (like scripts package).

**Pros**:
- Leverages existing tsx dependency
- No new dependencies needed

**Cons**:
- More complex refactoring of workflow and scripts
- Harder to maintain (health check logic separated from E2E tests)
- Doesn't fix the root cause (missing dependency)
- Adds architectural complexity

**Why Not Chosen**: The E2E tests own the health check, so the dependency should live in E2E's package.json.

### Selected Solution: Add tsx to apps/e2e/package.json

**Justification**: This is the simplest, clearest, and most correct fix. The E2E package uses tsx to run TypeScript health check scripts, so it should declare that dependency. This maintains workspace isolation, makes dependencies explicit, and is non-breaking. pnpm's strict hoisting is designed exactly for this use case.

**Technical Approach**:
1. Add `"tsx": "^4.21.0"` as a devDependency in `apps/e2e/package.json` (matching the version used in payload and scripts packages)
2. Run `pnpm install` to update `pnpm-lock.yaml`
3. Commit both files

**Architecture Changes**: None - this is purely a dependency declaration fix.

**Migration Strategy**: Not needed - this is a forward-fix, not a migration.

## Implementation Plan

### Affected Files

- `apps/e2e/package.json` - Add tsx as devDependency (1 line change)
- `pnpm-lock.yaml` - Auto-generated, will be updated by pnpm install

### New Files

None

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add tsx dependency to apps/e2e/package.json

Edit `apps/e2e/package.json` and add `"tsx": "^4.21.0"` to the devDependencies section. Match the exact version already used in `apps/payload/package.json` and `scripts/package.json` to ensure consistency.

- Open `apps/e2e/package.json`
- Find the `devDependencies` object
- Add the line: `"tsx": "^4.21.0",`
- Keep alphabetical ordering if present, otherwise add before the closing brace

**Why this step first**: The package.json edit must happen before running `pnpm install` so the dependency declaration exists.

#### Step 2: Install dependencies

Run `pnpm install` to resolve and lock the new dependency.

- This updates `pnpm-lock.yaml` with tsx entries for the E2E workspace
- Ensures the dependency is properly resolved in the lockfile
- Makes tsx available for E2E scripts

**Why this step second**: Installation must happen after updating package.json but before validation.

#### Step 3: Verify tsx is available in E2E workspace

Quick verification that tsx is now resolvable:

- Run `pnpm --filter e2e exec which tsx` (or `pnpm --filter e2e exec npx tsx --version`)
- Should output the tsx binary path or version without "not found" error

#### Step 4: Run validation commands

Ensure no regressions:

- `pnpm typecheck` - Full type check
- `pnpm lint` - Check code quality
- `pnpm format` - Check formatting

#### Step 5: Manual workflow validation (optional but recommended)

Test that the fix resolves the original issue:

- Push changes to dev branch
- Trigger the E2E sharded workflow manually (or wait for next commit)
- Verify "Wait for Supabase health" step passes
- Verify all 12 E2E test shards execute without tsx errors

## Testing Strategy

### Unit Tests

No unit tests needed - this is a dependency configuration fix.

### Integration Tests

No changes to test code needed.

### E2E Tests

**Test the fix via the CI workflow**:
- The E2E sharded workflow at `.github/workflows/e2e-sharded.yml` is the integration test
- The "Wait for Supabase health" step uses tsx to run `apps/e2e/tests/setup/supabase-health.ts`
- This step should now pass instead of failing with "tsx: not found"

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Edit `apps/e2e/package.json` - tsx added to devDependencies
- [ ] Run `pnpm install` successfully
- [ ] Run `pnpm --filter e2e exec which tsx` or `npx tsx --version` - command works
- [ ] Run `pnpm typecheck` - passes
- [ ] Run `pnpm lint` - passes with no new issues
- [ ] Push to dev branch and trigger E2E sharded workflow
- [ ] Verify "Wait for Supabase health" step passes (no "tsx: not found" error)
- [ ] Verify all 12 E2E shards run successfully
- [ ] No new errors in workflow logs

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Version mismatch between workspaces**: If tsx version differs, could cause inconsistencies
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: Use exact same version as payload and scripts packages (^4.21.0)

2. **Lock file conflicts**: pnpm-lock.yaml might conflict if multiple commits modified it
   - **Likelihood**: low (unlikely on dev branch with single change)
   - **Impact**: medium (merge conflicts)
   - **Mitigation**: Rebase and resolve lock file conflicts if needed

3. **Unexpected behavior from tsx in E2E context**: tsx might behave differently in E2E workspace
   - **Likelihood**: very low
   - **Impact**: medium (workflow still fails)
   - **Mitigation**: Already tested by previous commit (8f9324d9d) - tsx works, just wasn't declared as dependency

**Rollback Plan**:

If this fix causes issues in production:
1. Revert the commit (git revert)
2. Go back to using `ts-node` if typescript execution is needed
3. Or, move the health check script to the scripts package where tsx is already declared

However, this is extremely unlikely - we're just declaring an existing dependency.

**Monitoring** (not needed):
- No monitoring needed - this is a build-time fix, not runtime

## Performance Impact

**Expected Impact**: none

This is purely a dependency declaration change. No runtime or performance impact.

## Security Considerations

**Security Impact**: none

Adding `tsx` as a dependency has no security implications. It's an existing, well-maintained tool already used in the project.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Trigger E2E sharded workflow or try running tsx from E2E workspace
pnpm --filter e2e exec npx tsx --version
# Expected Result: Error "tsx: not found" or "command not found"
```

**Expected Result**: tsx command not available in E2E workspace.

### After Fix (Bug Should Be Resolved)

```bash
# Type check - ensure no regressions
pnpm typecheck

# Lint - check code quality
pnpm lint

# Format - check formatting
pnpm format

# Verify tsx is available
pnpm --filter e2e exec npx tsx --version
# Expected: Shows version (e.g., "v4.21.0")

# Build - ensure build succeeds
pnpm build

# Manual verification - trigger workflow or simulate health check
pnpm --filter e2e exec tsx tests/setup/supabase-health.ts
# Expected: Script runs without "tsx: not found" error
```

**Expected Result**: All commands succeed, tsx is available in E2E workspace, no "not found" errors.

### Regression Prevention

```bash
# Full test suite
pnpm test

# Check E2E setup runs without errors
pnpm --filter e2e test:setup

# Verify lock file is valid
pnpm ls
```

## Dependencies

### New Dependencies (if any)

```bash
# Dependency added
"tsx": "^4.21.0"

# Justification
tsx is needed to execute TypeScript files directly without compilation.
The E2E health check script (apps/e2e/tests/setup/supabase-health.ts)
requires tsx to run in CI workflows. Version matches other workspaces.
```

**No new dependencies required** - tsx is already used in the project, just wasn't declared in E2E's package.json.

## Database Changes

**No database changes required**

This is a tooling/dependency fix, not a data schema change.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

The fix only affects the build/CI environment, not the application runtime.

**Feature flags needed**: no

**Backwards compatibility**: maintained

This change is fully backwards compatible - we're just adding a missing dependency that was always needed.

## Success Criteria

The fix is complete when:
- [ ] `apps/e2e/package.json` includes `"tsx": "^4.21.0"` in devDependencies
- [ ] `pnpm install` completes successfully with updated lock file
- [ ] `pnpm --filter e2e exec npx tsx --version` returns version without error
- [ ] All validation commands pass (typecheck, lint, format)
- [ ] E2E sharded workflow passes the "Wait for Supabase health" step
- [ ] All 12 E2E test shards execute successfully
- [ ] No regressions in existing functionality

## Notes

**Context from diagnosis**:
- Issue #1657 was an incomplete fix - changed ts-node to tsx in workflow but forgot the dependency
- tsx is already declared in `apps/payload/package.json` and `scripts/package.json`
- This is purely a pnpm strict hoisting compliance issue
- The actual tsx tool works fine - it just needs to be declared as a dependency in the workspace that uses it

**Related workflow file**:
- `.github/workflows/e2e-sharded.yml` line 102 - the command that needs tsx
- The "Wait for Supabase health" step runs: `npx tsx apps/e2e/tests/setup/supabase-health.ts`

**Verification of tsx version consistency**:
- `apps/payload/package.json`: `"tsx": "^4.21.0"`
- `scripts/package.json`: `"tsx": "^4.21.0"`
- This fix adds: `"tsx": "^4.21.0"` to `apps/e2e/package.json` (matching version)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1658*
