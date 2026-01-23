# Bug Fix: Review Sandbox Creation Timeout During Completion Phase (Regression)

**Related Diagnosis**: #1757 (REQUIRED)
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Two issues compound: (1) timeout arithmetic doesn't account for git operations before pnpm install, and (2) review sandbox always runs pnpm install even when dependencies are pre-installed
- **Fix Approach**: Check if dependencies need syncing before install (matching implementation sandbox pattern), and increase outer timeout as safety net
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha orchestrator's completion phase fails to create a review sandbox with a 10-minute timeout. The `createReviewSandbox()` function performs sequential operations totaling 12-15+ minutes, but the outer timeout is only 600 seconds (10 minutes). This is caused by:

1. **Timeout mismatch**: Multiple git operations (fetch, checkout, pull) take 2-4 minutes but aren't fully accounted for in timeout arithmetic
2. **Unnecessary pnpm install**: The review sandbox ALWAYS runs full `pnpm install` even though the E2B template has pre-installed dependencies

For full details, see diagnosis issue #1757.

### Solution Approaches Considered

#### Option 1: Check node_modules before install, with lockfile sync logic ⭐ RECOMMENDED

**Description**: Update `createReviewSandbox()` to check if `node_modules` exists (matching the implementation sandbox pattern in `createSandbox()`). If it exists, check if the lockfile changed by comparing with HEAD~1. Only run install if dependencies are missing OR if the lockfile was modified by the branch.

**Pros**:
- Eliminates unnecessary installs in 90%+ of cases (most branches don't add dependencies)
- Reduces review sandbox creation from 10+ minutes to ~2-3 minutes (typical case)
- Matches proven pattern from implementation sandboxes (already working reliably)
- Handles edge cases where branch adds new dependencies
- Minimal code change (20-30 lines)
- Low risk: conservative approach (prefers install over skipping)

**Cons**:
- Slightly more complex than always installing (but justified by 7-8x speedup)
- Edge case: if lockfile is modified but dependencies removed, we still install (safe but wasteful)

**Risk Assessment**: low - The pattern is proven (implementation sandboxes use this) and the logic is conservative

**Complexity**: simple - Straightforward conditional checks

#### Option 2: Increase outer timeout only (quick fix)

**Description**: Bump outer timeout from 600s to 900s (15 minutes) or 1200s (20 minutes) to handle worst case.

**Pros**:
- Minimal code change (one number)
- Solves immediate timeout issue

**Cons**:
- Doesn't address root cause: unnecessary install still happens
- Still slow (10+ minutes vs 2-3 minutes)
- Masks the real inefficiency
- Increases latency for completion phase

**Why Not Chosen**: While this fixes the immediate timeout, it doesn't address the inefficiency. The optimization (Option 1) provides 7-8x speedup and is a proven pattern we already use.

#### Option 3: Pre-build template with latest dependencies

**Description**: Rebuild E2B template after every merge to main, ensuring template always has latest dependencies baked in.

**Why Not Chosen**: Too complex for this bug. Would require modifying CI/CD pipeline, template build process, and versioning strategy. Option 1 achieves 90%+ of the benefit with minimal code change.

### Selected Solution: Check node_modules & lockfile sync logic

**Justification**: This approach is optimal because:
- It eliminates the root cause (unnecessary install) rather than masking it with more time
- It uses a proven pattern already working reliably in `createSandbox()` (implementation sandboxes)
- It provides 7-8x speedup in typical cases (10+ minutes → 2-3 minutes)
- It handles edge cases gracefully (new dependencies added by branch)
- It's minimal code change with low risk
- It improves overall orchestrator performance significantly

**Technical Approach**:
1. Check if `node_modules` directory exists in the workspace
2. If missing: run full `pnpm install` (like implementation sandboxes)
3. If exists: check if `pnpm-lock.yaml` changed since HEAD~1
4. If lockfile changed: run `pnpm install` (branch added/removed dependencies)
5. If lockfile unchanged: skip install, use pre-installed dependencies
6. As safety net: increase outer timeout from 600s to 900s

**Architecture Changes** (if any):
- None. This is a localized improvement to `createReviewSandbox()` in sandbox.ts
- Pattern mirrors existing `createSandbox()` implementation
- No database, API, or configuration changes needed

**Migration Strategy** (if needed):
- None required. This is backwards-compatible and doesn't affect existing data

## Implementation Plan

### Affected Files

List files that need modification:
- `.ai/alpha/scripts/lib/sandbox.ts` - Update `createReviewSandbox()` function (lines 878-886) to add node_modules check and lockfile diff logic
- `.ai/alpha/scripts/lib/orchestrator.ts` - Increase outer timeout from 600s to 900s (line 1609) as safety net

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add node_modules check to createReviewSandbox

Update the dependency sync logic in `createReviewSandbox()` to check if `node_modules` exists before running install.

- Locate line 878-886 in `.ai/alpha/scripts/lib/sandbox.ts`
- Replace unconditional `pnpm install` with conditional check:
  - First, run `test -d node_modules && echo "exists" || echo "missing"`
  - If result is "missing", log "Installing dependencies..." and run `pnpm install`
  - If result is "exists", proceed to Step 2 (lockfile check)
- Log appropriate status messages for clarity

**Why this step first**: Provides the primary performance optimization by skipping install in 90%+ of cases

#### Step 2: Add lockfile change detection logic

If `node_modules` exists, check if `pnpm-lock.yaml` changed in the current branch.

- After node_modules check passes, run `git diff --name-only HEAD~1 HEAD -- pnpm-lock.yaml | wc -l` to detect lockfile changes
- If count is "0" (no changes), log "✅ Dependencies already installed (skipping pnpm install)" and skip install
- If count > "0" (lockfile changed), log "Syncing dependencies (lockfile changed)..." and run `pnpm install`
- Handle edge cases gracefully (if git diff fails, fall back to install as safety measure)

**Why this step next**: Handles the edge case where branch adds/removes dependencies

#### Step 3: Increase outer timeout as safety net

Update the outer timeout wrapper in `orchestrator.ts` to provide additional buffer.

- Locate line 1609 in `.ai/alpha/scripts/lib/orchestrator.ts`
- Change outer timeout from `600000` (10 minutes) to `900000` (15 minutes)
- Update comment to reflect new timeout and explain rationale

**Why this step last**: Provides safety margin for worst-case scenarios while primary optimization handles typical cases

#### Step 4: Test the fix locally

Validate the changes work correctly before submission.

- Run `pnpm orchestrate S0 --ui` to trigger completion phase
- Observe sandbox creation logs for new dependency check messages
- Verify timing improvement (expect 2-3 minutes for review sandbox vs previous 10+)
- Check that dev server URL appears on completion screen
- Verify no errors or unexpected behavior

**Why important**: Ensures fix works as intended before production deployment

#### Step 5: Validation

Run all validation commands to ensure no regressions.

- Type check: `pnpm typecheck` - must pass
- Lint: `pnpm lint` - must pass
- Manual verification: Create a test orchestrator run and observe timing

## Testing Strategy

### Unit Tests

The changes are in utility functions (sandbox creation) that are difficult to unit test in isolation because they require E2B API access. Instead, we rely on integration and manual testing.

**Why no unit tests**: Orchestrator sandbox functions make network calls to E2B API and execute system commands. True unit testing would require extensive mocking that would obscure the actual behavior being fixed.

### Integration Tests

<This is a deployment/integration fix that's tested through manual orchestrator runs. No formal integration test suite exists for sandbox creation.>

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run Alpha orchestrator to completion phase: `pnpm orchestrate S0 --ui`
- [ ] Observe review sandbox creation logs
- [ ] Verify you see message "Dependencies already installed (skipping pnpm install)" (if no lockfile changes)
- [ ] Confirm review sandbox creation completes in ~2-3 minutes
- [ ] Verify dev server URL appears on completion screen
- [ ] Confirm no errors in sandbox creation logs
- [ ] Verify sandbox can successfully start dev server
- [ ] Test edge case: Create feature that adds new dependency, observe install runs instead of skip

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Dependencies become stale between branches**: If branch A changes lockfile but sandbox assumes old dependencies, errors may occur
   - **Likelihood**: low - git diff check prevents this
   - **Impact**: medium - feature might fail in dev server
   - **Mitigation**: Lockfile diff check catches this before skipping install; if diff shows changes, install runs

2. **Sandbox git commands fail silently**: If `git diff` fails but we don't detect it, we might skip install unnecessarily
   - **Likelihood**: low - git should be available after checkout succeeds
   - **Impact**: medium - missing dependencies could cause dev server to fail
   - **Mitigation**: Wrap git diff in try-catch and fall back to install if it fails

3. **First run of new branch takes longer**: First time a branch with new dependencies runs, it will properly install (as intended)
   - **Likelihood**: high - expected behavior
   - **Impact**: low - correct behavior, not a risk
   - **Mitigation**: N/A - this is the designed behavior

**Rollback Plan**:

If this fix causes issues in production:
1. Revert the conditional check, restoring unconditional `pnpm install` in `createReviewSandbox()`
2. Keep outer timeout at 900s (the increased timeout is safe and doesn't cause problems)
3. This returns to ~10-minute review sandbox creation (slow but working)

## Performance Impact

**Expected Impact**: significant - 7-8x speedup in typical cases

- **Before**: Review sandbox creation takes 10+ minutes (mostly due to unnecessary `pnpm install`)
- **After**: Review sandbox creation takes ~2-3 minutes (git operations + build only)
- **Typical scenario**: 85-90% of branches don't add dependencies, so skip install most of the time

**Performance Testing**:
- Run `pnpm orchestrate S0 --ui` and measure review sandbox creation time
- Compare against baseline from before fix
- Expected: reduction from 600s+ to 150-180s

## Security Considerations

**Security Impact**: none - positive

This fix actually improves security by:
- Reducing attack surface (fewer operations = less opportunity for interference)
- Using same pattern as implementation sandboxes (vetted approach)
- Maintaining full dependency verification through git

**No security concerns**: The lockfile check via `git diff` is cryptographically safe (git ensures integrity)

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run Alpha orchestrator with UI
pnpm orchestrate S0 --ui

# Wait for all features to complete (may take 30-60 minutes for full run)
# Observe completion phase begin
# Watch for: "❌ No review sandbox available - could not start dev server"
# Or timeout after ~10 minutes

# Expected Result: Timeout or failure in review sandbox creation
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run Alpha orchestrator
pnpm orchestrate S0 --ui

# Expected Result:
# - All validation commands succeed
# - Review sandbox creation completes in ~2-3 minutes
# - Dev server URL displays on completion screen
# - Zero errors in sandbox creation logs
```

### Regression Prevention

```bash
# Run full Alpha orchestrator multiple times to ensure consistency
pnpm orchestrate S0 --ui
# (repeat 2-3 times)

# Verify each run:
# - Consistent timing improvement (2-3 minutes vs 10+)
# - Dev server starts successfully
# - No sandbox creation errors
# - No dependency-related errors in dev server logs
```

## Dependencies

### New Dependencies (if any)

No new dependencies required.

**Dependencies added**: None

## Database Changes

**Migration needed**: no

**No database changes required** - This is a client-side/orchestrator fix affecting only sandbox creation timing.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- No special steps needed
- This is a localized fix to orchestrator scripts
- No configuration changes required
- No database migrations needed

**Feature flags needed**: no

**Backwards compatibility**: maintained - Change is backwards-compatible; always safer to increase timeout and skip unnecessary installs

## Success Criteria

The fix is complete when:
- [ ] Type checking passes (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Formatting is correct (`pnpm format`)
- [ ] Review sandbox creation completes in ~2-3 minutes (7-8x faster)
- [ ] Dev server URL displays on completion screen
- [ ] Zero errors in sandbox creation logs
- [ ] No regressions in other orchestrator functions
- [ ] Manual testing confirms expected behavior
- [ ] Edge case testing (branch with new dependencies) confirms install still runs

## Notes

**Implementation notes**:
- The pattern we're implementing in `createReviewSandbox()` is taken directly from `createSandbox()` (implementation sandboxes), which has been working reliably
- The timeout increase (600s → 900s) is generous and provides safety margin even if optimization doesn't fully kick in
- Expected time breakdown after fix:
  - Sandbox.create(): 10-30s
  - Git operations: 30-50s
  - Dependency check: 5-10s
  - Build: 60-90s
  - **Total**: 2-3 minutes typical, ~4-5 minutes worst case

**Related issues**:
- #1742 (CLOSED): Original timeout fix (incomplete)
- #1739 (CLOSED): Original diagnosis
- #1749 (CLOSED): Added unconditional install to review sandbox

**File locations**:
- `.ai/alpha/scripts/lib/sandbox.ts:878-886` - Primary change
- `.ai/alpha/scripts/lib/orchestrator.ts:1609` - Secondary change

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1757*
