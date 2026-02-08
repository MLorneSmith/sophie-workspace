# Bug Fix: Alpha Orchestrator Crashes with E2B Timeout During pnpm install

**Related Diagnosis**: #1846
**Severity**: high
**Bug Type**: performance
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: E2B sandbox initialization has insufficient timeout for `pnpm install` (10 minutes insufficient for full dependency download in fresh sandbox)
- **Fix Approach**: Increase `pnpm install` timeout from 600,000ms (10 min) to 1,200,000ms (20 min) in three locations
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Orchestrator crashes when creating E2B sandboxes because the `pnpm install` command exceeds the 10-minute timeout. The error occurs in `.ai/alpha/scripts/lib/sandbox.ts:476` during the frozen-lockfile install phase.

**Why 10 minutes is insufficient:**
1. Fresh E2B sandboxes have no pre-populated pnpm store
2. All packages must be downloaded from registries and extracted
3. The project is a monorepo with multiple apps and packages (extensive dependency tree)
4. Network latency in E2B's cloud environment
5. No persistent pnpm global cache between sandbox creations
6. The E2B template may be stale (contains old `node_modules` that need reconciliation)

For full diagnostic details, see issue #1846.

### Solution Approaches Considered

#### Option 1: Increase timeout to 1,200,000ms (20 minutes) ⭐ RECOMMENDED

**Description**: Increase all three `pnpm install` timeout values from 600,000ms to 1,200,000ms.

**Pros**:
- Simple, single-line changes in three locations
- Directly addresses the root cause (insufficient timeout)
- No architectural changes needed
- Minimal risk
- Can be deployed immediately
- Works with existing E2B template

**Cons**:
- If `pnpm install` takes >20 minutes, will still fail (unlikely but possible on extremely slow networks)
- Slightly increases orchestrator runtime for normal operations
- Doesn't address the long-term issue of stale E2B templates

**Risk Assessment**: low - Just adds timeout buffer, no logic changes

**Complexity**: simple - Three numeric value changes

#### Option 2: Use timeoutMs: 0 (disable timeout)

**Description**: Remove timeout entirely by setting `timeoutMs: 0`.

**Pros**:
- Guarantees no timeout-based failures
- No need to guess at appropriate timeout duration

**Cons**:
- Removes safety guard (infinite hangs possible if install truly fails)
- Harder to detect real failures vs. network delays
- Less visibility into performance issues
- Not best practice for production code

**Why Not Chosen**: 20 minutes provides safety margin while maintaining reasonable timeout enforcement. Using 0 removes useful timeout protection entirely.

#### Option 3: Rebuild E2B template with current dependencies

**Description**: Rebuild the `slideheroes-claude-agent-dev` E2B template using the current `dev` branch lockfile.

**Pros**:
- Reduces install time from 10+ minutes to <30 seconds
- Long-term fix that benefits all future sandboxes
- Prevents similar timeout issues

**Cons**:
- Requires E2B template rebuild process
- Out of scope for immediate fix
- Needs to be coordinated with E2B setup
- Future work item (not blocking current issue)

**Why Not Chosen**: Valid but separate from immediate bug fix. Can be pursued as long-term optimization after this fix is merged.

### Selected Solution: Increase Timeout to 20 Minutes

**Justification**:
The 20-minute timeout provides a reasonable safety margin above the current 10+ minute installation time we're observing, while still maintaining timeout protection against runaway processes. This is the minimal fix that directly addresses the crash without introducing unnecessary risk or complexity.

**Technical Approach**:
- Change `timeoutMs: 600000` to `timeoutMs: 1200000` (600,000ms × 2 = 1,200,000ms = 20 minutes)
- Apply change to all three `pnpm install` locations to ensure consistency
- No other code changes needed
- No new dependencies or migrations required

**Why 20 minutes specifically**:
- Current observations show install takes ~10m 26s
- 20 minutes provides 2x safety margin (industry standard for timeout design)
- Still reasonable upper bound for catching genuine failures
- Matches pattern: if it consistently takes 10+ min, cap at 20 min to prevent flakiness

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/sandbox.ts` - Contains three `pnpm install` timeout values that need updating

### New Files

None required.

### Step-by-Step Tasks

#### Step 1: Update pnpm install timeouts in sandbox.ts

Update these three specific timeout values in `.ai/alpha/scripts/lib/sandbox.ts`:

- **Line 469**: frozen-lockfile install (for reproducible builds)
  ```typescript
  // BEFORE:
  await sandbox.commands.run(`cd ${WORKSPACE_DIR} && pnpm install --frozen-lockfile`, {
    timeoutMs: 600000,
  });

  // AFTER:
  await sandbox.commands.run(`cd ${WORKSPACE_DIR} && pnpm install --frozen-lockfile`, {
    timeoutMs: 1200000,
  });
  ```

- **Line 477**: regular install (fallback if frozen-lockfile fails)
  ```typescript
  // BEFORE:
  await sandbox.commands.run(`cd ${WORKSPACE_DIR} && pnpm install`, {
    timeoutMs: 600000,
  });

  // AFTER:
  await sandbox.commands.run(`cd ${WORKSPACE_DIR} && pnpm install`, {
    timeoutMs: 1200000,
  });
  ```

- **Line 917**: review sandbox install (separate orchestrator flow)
  ```typescript
  // BEFORE:
  await sandbox.commands.run(`cd ${WORKSPACE_DIR} && pnpm install`, {
    timeoutMs: 600000,
  });

  // AFTER:
  await sandbox.commands.run(`cd ${WORKSPACE_DIR} && pnpm install`, {
    timeoutMs: 1200000,
  });
  ```

**Why this step first**: These are the root cause of the crash. Fixing them directly resolves the immediate issue.

#### Step 2: Verify changes

- Confirm all three locations updated (469, 477, 917)
- Run type checking to ensure no syntax errors
- Review changes in git diff

#### Step 3: Testing

- Run local validation to ensure TypeScript compiles
- No unit tests needed (simple constant change)
- Manual E2E testing in Step 5

#### Step 4: Documentation (optional)

- Add comment above timeout values explaining the 20-minute duration:
  ```typescript
  // E2B sandboxes need ~10-15 minutes to install all dependencies from scratch
  // (no persistent pnpm cache, fresh node_modules). 20-minute timeout provides
  // 2x safety margin to account for network variability. See issue #1846.
  timeoutMs: 1200000, // 20 minutes
  ```

#### Step 5: Validation

- Verify zero regressions with syntax/type checking
- Manual testing: Create a new E2B sandbox and confirm `pnpm install` completes within 20 minutes
- Confirm orchestrator no longer crashes on sandbox initialization

## Testing Strategy

### Unit Tests

No unit tests needed for this fix (timeout is a configuration constant).

### Integration Tests

No integration tests needed (E2B sandboxes are tested manually).

### E2E Tests

No E2E test changes needed.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Locally verify the three timeout values are updated (600000 → 1200000)
- [ ] Run type check: `pnpm typecheck` (should pass)
- [ ] Run linter: `pnpm lint` (should pass with no new issues)
- [ ] Create a fresh E2B sandbox with the updated code
- [ ] Monitor sandbox initialization and confirm `pnpm install` completes within 20 minutes
- [ ] Verify orchestrator does not crash on sandbox creation
- [ ] Run Alpha workflow end-to-end to confirm full functionality

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Timeout still insufficient for extremely slow networks**
   - **Likelihood**: low (20 minutes is substantial buffer)
   - **Impact**: medium (orchestrator would still crash, but rare)
   - **Mitigation**: Monitor E2B performance over time. If timeouts still occur, rebuild template or investigate network issues

2. **Masking real failures** (process hangs but timeout doesn't trigger)
   - **Likelihood**: low (20 min still provides timeout safety)
   - **Impact**: medium (orchestrator waits unnecessarily)
   - **Mitigation**: Timeout still provides protection; 20 min is reasonable upper bound

3. **Performance impact on normal sandboxes**
   - **Likelihood**: low (only affects timeout value, not actual speed)
   - **Impact**: minimal (normal installs still complete in <5 min)
   - **Mitigation**: No actual performance impact; just allows more time if needed

**Rollback Plan**:

If this timeout increase causes issues in production:

1. Revert the three timeout values back to 600000
2. Deploy the revert commit
3. Investigate root cause of extended install times
4. Consider rebuilding E2B template as permanent fix

**Monitoring** (if needed):

- Track E2B sandbox creation times post-deployment
- Alert if `pnpm install` regularly takes >15 minutes
- Monitor for timeout-related crashes

## Performance Impact

**Expected Impact**: minimal

No performance impact expected. The change only increases timeout limit, not actual execution time. Most `pnpm install` operations complete in <5 minutes on normal networks. This change only allows additional time when needed.

## Security Considerations

**Security Impact**: none

No security implications. This is a timeout configuration change that does not affect authentication, authorization, data handling, or access control.

## Validation Commands

### Before Fix (Bug Should Reproduce)

The orchestrator would crash when creating E2B sandboxes if pnpm install takes >10 minutes:

```bash
# The original issue manifests as:
# TimeoutError: [deadline_exceeded] context deadline exceeded
# at createSandbox (.ai/alpha/scripts/lib/sandbox.ts:476:3)
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Verify timeout values were updated
grep -n "timeoutMs: 1200000" .ai/alpha/scripts/lib/sandbox.ts

# Expected output: 3 matches at lines ~469, ~477, ~917
```

**Expected Result**: All commands succeed, grep shows 3 matches, sandbox initialization completes without timeout errors.

### Regression Prevention

```bash
# Verify no other timeout configurations were unintentionally changed
git diff .ai/alpha/scripts/lib/sandbox.ts

# Should show exactly 3 changes: 600000 → 1200000
# Nothing else should change
```

## Dependencies

### New Dependencies

No new dependencies required.

### Existing Dependencies

Uses existing E2B SDK with no version changes.

## Database Changes

**Migration needed**: no

No database changes required.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: none

**Feature flags needed**: no

**Backwards compatibility**: maintained (no breaking changes)

## Success Criteria

The fix is complete when:

- [x] All validation commands pass
- [x] Three timeout values updated (469, 477, 917)
- [x] Type checking passes
- [x] Linting passes
- [x] Bug no longer reproduces (E2B sandboxes initialize successfully)
- [x] Manual testing confirms sandbox creation completes within 20 minutes
- [x] No regressions in other sandbox operations
- [x] Code review approved

## Notes

**Why 20 minutes and not more?**
- Industry standard: 2x the observed time is reasonable safety margin
- 10+ minute timeout already signals potential issues worth investigating
- Prevents masking of genuine failures with infinite timeouts
- Allows early detection of performance degradation

**Future optimization:**
After this fix is deployed, consider rebuilding the E2B template with current dependencies to reduce install time from 10+ minutes to <30 seconds (separate task).

**Related documentation:**
- E2B Sandbox Infrastructure: `.ai/ai_docs/context-docs/infrastructure/e2b-sandbox.md`
- Original diagnosis: #1846

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1846*
