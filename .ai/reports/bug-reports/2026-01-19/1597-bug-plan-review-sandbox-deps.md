# Bug Fix: Review Sandbox Dev Server - Dependencies Not Installed After Branch Checkout

**Related Diagnosis**: #1596 (REQUIRED)
**Severity**: medium
**Bug Type**: bug (regression)
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `createReviewSandbox()` only runs `pnpm install` if `node_modules` is missing. Since E2B templates have pre-installed dependencies from the `dev` branch, `pnpm install --frozen-lockfile` is never run after checking out a feature branch with different dependencies.
- **Fix Approach**: Always run `pnpm install --frozen-lockfile` after branch checkout in `createReviewSandbox()`, regardless of whether `node_modules` exists
- **Estimated Effort**: small (<30 minutes)
- **Breaking Changes**: no

## Solution Design

### Problem Recap

After implementing issue #1590 (fresh review sandbox for dev server), the dev server still fails to start on the review sandbox. The issue is that `createReviewSandbox()` checks if `node_modules` exists but doesn't verify dependencies match the current branch's lockfile. Since E2B templates have pre-installed dependencies from the `dev` branch, when checking out a feature branch (e.g., `alpha/spec-1362`) with different dependencies, the dependencies are mismatched and the dev server fails to start.

For full details, see diagnosis issue #1596.

### Solution Approaches Considered

#### Option 1: Always Run `pnpm install --frozen-lockfile` ⭐ RECOMMENDED

**Description**: After branch checkout, always run `pnpm install --frozen-lockfile` regardless of whether `node_modules` exists. When dependencies are already synced, this command completes in <1 second (headless mode).

**Pros**:
- Simple one-line addition to the code
- Guaranteed correct dependencies for any branch
- <1 second overhead when already synced (negligible)
- Aligns with pnpm best practices
- Prevents future regressions with different branches

**Cons**:
- Tiny overhead even when not needed

**Risk Assessment**: low - pnpm install is idempotent and safe when already synced

**Complexity**: simple - just add one command call

#### Option 2: Hash-Based Lockfile Comparison

**Description**: Compare lockfile hashes before and after checkout. Only run `pnpm install` if lockfile changed.

**Pros**:
- Slightly more efficient when lockfile hasn't changed
- Demonstrates intent clearly in code

**Cons**:
- More complex implementation (need hash comparison function)
- Hash calculation takes time
- Adds code complexity without much benefit
- Still requires running pnpm install in most cases

**Why Not Chosen**: The complexity overhead outweighs the benefit. The <1 second pnpm install on synced dependencies is negligible compared to other sandbox operations.

#### Option 3: Manual Dependency Tracking

**Description**: Keep track of the currently-installed branch and only install if different.

**Cons**:
- Very complex to implement reliably
- Requires persistent state management
- Error-prone and hard to debug
- Adds significant code complexity

**Why Not Chosen**: Too complex for the problem. The simple approach (Option 1) is better.

### Selected Solution: Always Run `pnpm install --frozen-lockfile`

**Justification**: This is the simplest, safest, and most maintainable solution. It aligns with pnpm best practices for branch switching and adds negligible overhead (<1 second when already synced). The cost-benefit analysis strongly favors this approach:
- **Cost**: <1 second additional time when synced
- **Benefit**: Guaranteed correct dependencies, prevents bugs, aligns with best practices
- **Maintainability**: Single line of code, no additional complexity

**Technical Approach**:
1. In `createReviewSandbox()` function, after the `git pull` command
2. Add `pnpm install --frozen-lockfile` call with appropriate logging
3. Use 600-second timeout (matches existing implementation sandbox timeout)
4. No error handling needed - if install fails, error should bubble up

**Architecture Changes**: None - this is purely additive

**Migration Strategy**: N/A - no data migration needed

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/sandbox.ts` - `createReviewSandbox()` function (lines 526-530)

### New Files

None needed.

### Step-by-Step Tasks

#### Step 1: Add pnpm install after git pull

In `createReviewSandbox()` function, after the `git pull origin "${branchName}"` command (line 528), add:

```typescript
// Sync dependencies with branch's lockfile
log("   Syncing dependencies with branch lockfile...");
await sandbox.commands.run(
  `cd ${WORKSPACE_DIR} && pnpm install --frozen-lockfile`,
  { timeoutMs: 600000 },
);
```

**Why this step first**: This is the core fix that addresses the root cause. It must be done after branch checkout but before building.

#### Step 2: Verify build still works

After adding the install, the existing build step (lines 550-558) should continue to work correctly because dependencies are now installed.

#### Step 3: Add unit tests

Add tests to verify the install happens after branch checkout:
- Test that `pnpm install --frozen-lockfile` is called
- Test that it's called after `git pull`
- Test that build succeeds after install

#### Step 4: Add integration tests

Test the full `createReviewSandbox()` flow:
- Verify sandbox can checkout feature branch with different dependencies
- Verify dev server can start after sandbox setup
- Verify no dependency errors occur

#### Step 5: Validation

Run all validation commands and verify dev server starts on review sandbox.

## Testing Strategy

### Unit Tests

Add tests to `.ai/alpha/scripts/lib/__tests__/sandbox-review.spec.ts`:

- ✅ `createReviewSandbox()` calls pnpm install after branch checkout
- ✅ pnpm install uses `--frozen-lockfile` flag
- ✅ pnpm install has appropriate timeout (600s)
- ✅ Install happens after git pull, before build
- ✅ Error from pnpm install properly bubbles up
- ✅ Build succeeds after pnpm install

### Integration Tests

Add to `.ai/alpha/scripts/lib/__tests__/orchestrator-review-sandbox.spec.ts`:

- ✅ Full `createReviewSandbox()` flow with actual command execution
- ✅ Review sandbox can checkout branch with dependencies different from template
- ✅ Dev server health check passes after full sandbox setup
- ✅ Regression: Original bug (dev server timeout) doesn't reoccur

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Build the E2B template fresh (ensures template is clean state)
- [ ] Run orchestrator with a spec that modifies package.json or pnpm-lock.yaml
- [ ] Observe that review sandbox successfully creates and starts dev server
- [ ] Dev server is accessible at the review URL within 20 seconds
- [ ] Run multiple orchestrations back-to-back to verify no state issues
- [ ] Verify VS Code URL still works for code review
- [ ] Check that pnpm install output shows appropriate messages
- [ ] Monitor resource usage during pnpm install (should be <1 second when synced)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Performance Impact**: Adding pnpm install could slow down sandbox creation
   - **Likelihood**: low (when already synced, <1 second)
   - **Impact**: low (minor slowdown in non-critical path)
   - **Mitigation**: Measure timing before/after; headless mode means minimal overhead

2. **Network Issues During Install**: pnpm install could fail due to network connectivity
   - **Likelihood**: low (pnpm uses cache for already-downloaded packages)
   - **Impact**: medium (sandbox creation fails)
   - **Mitigation**: Use `--frozen-lockfile` to avoid network access, 600s timeout is generous

3. **Incompatible Lockfile**: Branch's lockfile could be incompatible with template Node version
   - **Likelihood**: very low (template is regularly updated)
   - **Impact**: medium (sandbox creation fails)
   - **Mitigation**: If this occurs, template needs rebuilding (separate process)

**Rollback Plan**:

If this fix causes issues:

1. Remove the `pnpm install --frozen-lockfile` call from `createReviewSandbox()`
2. Revert to previous behavior (only install if `node_modules` missing)
3. Dev server will likely fail to start again (reverting to pre-1590 bug)
4. No data cleanup needed - no state was changed

**Monitoring**:
- Monitor dev server startup time on review sandbox (should be 10-20s)
- Alert if review sandbox creation fails >10% of the time
- Track pnpm install duration (should be <1s when synced)

## Performance Impact

**Expected Impact**: minimal (positive overall)

- Implementation sandbox: no change
- Review sandbox creation: +<1 second (when dependencies already synced)
- Dev server startup: improved reliability, likely faster startup due to correct dependencies
- Overall orchestrator completion time: negligible increase

**Performance Testing**:
- Measure time from sandbox creation start to dev server ready
- Expected: no degradation from current 60-second timeout
- Actual result should be 10-20 seconds

## Security Considerations

**Security Impact**: none

- `pnpm install --frozen-lockfile` enforces lockfile integrity
- No new security holes introduced
- Actually improves security by ensuring exact dependency versions

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run orchestrator for a spec
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Observe: dev server shows "(failed to start)"
```

**Expected Result**: Dev server URL fails, VS Code works

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests for sandbox module
pnpm test:unit .ai/alpha/scripts/lib/__tests__/sandbox-review.spec.ts

# Integration tests for orchestrator
pnpm test:unit .ai/alpha/scripts/lib/__tests__/orchestrator-review-sandbox.spec.ts

# Full validation
pnpm codecheck

# Manual verification - run orchestrator
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362
```

**Expected Result**: All commands succeed, dev server URL works on review sandbox

### Regression Prevention

```bash
# Run all orchestrator tests to ensure no regressions
pnpm test:unit .ai/alpha/scripts/lib/__tests__/orchestrator*.spec.ts

# Verify no broken functionality in sandbox module
pnpm test:unit .ai/alpha/scripts/lib/__tests__/sandbox*.spec.ts

# Manual regression: Verify original implementation flow (features complete, code pushed)
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362
```

## Dependencies

### New Dependencies

**No new dependencies required** - Uses existing pnpm CLI available in sandbox template.

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - this is a code fix with no infrastructure changes

**Feature flags needed**: no

**Backwards compatibility**: fully maintained - this is a bugfix

## Success Criteria

The fix is complete when:
- [ ] `pnpm install --frozen-lockfile` is called after branch checkout in `createReviewSandbox()`
- [ ] All validation commands pass
- [ ] Dev server starts within 20 seconds on review sandbox
- [ ] Dev server URL is accessible and displays the application
- [ ] No performance regressions detected
- [ ] Zero regressions in core orchestrator flow
- [ ] Manual testing checklist complete
- [ ] Code review approved

## Notes

### Why This Regression Wasn't Caught in Testing

The unit tests for `createReviewSandbox()` mock the sandbox commands, so they don't actually test dependency installation. The code changes from issue #1590 were tested with mocked commands but not with real E2B sandbox state where the `dev` branch template had different dependencies than feature branches.

### Why This Didn't Affect `createSandbox()`

The implementation sandbox function has the same dependency check issue, but it works because:
1. Implementation sandboxes typically checkout existing branches from prior spec work
2. Feature implementation runs on branches based on `dev` (template's branch) with compatible dependencies
3. Any new dependencies needed by features are discovered and installed during feature implementation

The review sandbox is different because it's created fresh from template and checks out a different branch that may have accumulated many dependency changes.

### Post-Implementation Monitoring

After deploying this fix, monitor:
- Review sandbox creation success rate (should be >99%)
- Dev server startup time (should be <20 seconds)
- No regressions in spec implementation flow

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1596*
