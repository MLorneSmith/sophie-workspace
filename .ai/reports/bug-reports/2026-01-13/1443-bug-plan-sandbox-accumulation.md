# Bug Fix: Alpha Orchestrator Sandbox Accumulation

**Related Diagnosis**: #1442
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Sandbox restart logic creates new E2B instances without killing old ones in two of three code paths
- **Fix Approach**: Add `sandbox.kill()` calls before creating replacement sandboxes in health check and keepalive paths
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Spec Orchestrator creates new E2B sandbox instances during restarts (health check failures, keepalive expiration) but fails to kill the old sandbox instances in two of three code paths, causing sandbox accumulation beyond the configured limit.

For full details, see diagnosis issue #1442.

### Solution Approaches Considered

#### Option 1: Add Explicit Kill Calls to Missing Paths ⭐ RECOMMENDED

**Description**: Add `await instance.sandbox.kill()` wrapped in try/catch before `createSandbox()` calls in the health check restart and keepalive expired restart paths, matching the pattern already used in the preemptive restart path.

**Pros**:
- Minimal code change (2 locations, ~5 lines each)
- Follows existing pattern (preemptive restart already does this correctly)
- Low risk - uses defensive try/catch to ignore already-dead sandboxes
- Fixes root cause directly
- No architectural changes needed
- Easy to verify and test

**Cons**:
- Doesn't address why health checks are triggering so frequently (secondary issue)
- Kill operations may add slight latency to restart process (~1-2 seconds)

**Risk Assessment**: low - The kill operation is already proven in the preemptive restart path. Try/catch ensures robustness even if sandbox is already dead.

**Complexity**: simple - Direct code addition with no logic changes, follows established pattern.

#### Option 2: Refactor to Centralized Sandbox Replacement Function

**Description**: Extract sandbox replacement logic into a single function (`replaceSandbox()`) that handles kill + create atomically, then call this function from all three restart paths.

**Pros**:
- Eliminates code duplication
- Ensures all restart paths follow the same pattern
- Easier to maintain long-term
- Single place to add logging/telemetry for restarts

**Cons**:
- More invasive refactoring (requires extracting ~50 lines to new function)
- Higher risk of introducing bugs in refactor
- Increases scope beyond fixing the immediate bug
- Harder to verify atomicity guarantees

**Why Not Chosen**: While this is better long-term architecture, it increases risk and scope. The bug fix should be surgical. This refactoring can be done separately as a code quality improvement.

#### Option 3: Add Sandbox Lifecycle Tracking and Cleanup Job

**Description**: Track all created sandbox IDs in a persistent store and run a periodic cleanup job that kills any sandboxes not in the current `sandbox_ids` array.

**Pros**:
- Defensive cleanup catches any missed kills
- Resilient to future bugs in restart logic
- Can clean up sandboxes left from crashed orchestrator runs

**Cons**:
- Over-engineered for this specific bug
- Adds complexity (persistent tracking, background job)
- Doesn't fix root cause - just mitigates symptoms
- Cleanup job could kill sandboxes mid-work if tracking is wrong

**Why Not Chosen**: This is solving a different problem (orphaned sandboxes from crashes). The root cause here is explicit - missing kill calls. Fix the root cause, not symptoms.

### Selected Solution: Option 1 - Add Explicit Kill Calls

**Justification**: This is the simplest, lowest-risk fix that directly addresses the root cause. The pattern already exists in the preemptive restart path and works correctly. By replicating this pattern to the other two paths, we ensure consistency and fix the bug with minimal code changes.

**Technical Approach**:
- Add `try/catch` wrapped `sandbox.kill()` call before `createSandbox()` in health check restart (line ~376)
- Add identical `try/catch` wrapped `sandbox.kill()` call before `createSandbox()` in keepalive expired restart (line ~546)
- Use the exact same error handling pattern as preemptive restart (lines 461-465)
- No changes to manifest cleanup logic (already correct)
- No changes to sandbox creation logic (already correct)

**Architecture Changes**: None - this is a bug fix that restores intended behavior.

**Migration Strategy**: Not needed - no data or API changes.

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/orchestrator.ts` - Add kill calls in two locations (lines ~376 and ~546)

### New Files

None required.

### Step-by-Step Tasks

#### Step 1: Add Kill Call to Health Check Restart Path

Add explicit sandbox kill before creating replacement sandbox in health check restart logic.

**Location**: `orchestrator.ts` lines 366-411 (specifically before line 377)

**Changes**:
```typescript
// After line 376: "if (instance.status === "failed") {"
log(`   🔄 Attempting to restart failed sandbox ${instance.label}...`);
try {
  // Capture old ID before reassignment for cleanup
  const oldSandboxId = instance.id;

  // CRITICAL: Kill the old sandbox before creating new one
  // This prevents accumulation of running E2B instances
  try {
    await instance.sandbox.kill();
  } catch {
    // Ignore kill errors - sandbox may already be dead
  }

  const newInstance = await createSandbox(
    manifest,
    instance.label,
    timeoutSeconds,
    uiEnabled,
  );
  // ... rest of existing code
```

**Why this step first**: Health check restart is the most frequently triggered path (every 30 seconds), so fixing this has the highest impact.

#### Step 2: Add Kill Call to Keepalive Expired Restart Path

Add explicit sandbox kill before creating replacement sandbox in keepalive expired restart logic.

**Location**: `orchestrator.ts` lines 527-594 (specifically before line 547)

**Changes**:
```typescript
// After line 546: "try {"
log(`   🔄 Restarting sandbox ${label}...`);

// Capture old ID before reassignment for cleanup
const oldSandboxId = instance.id;

// CRITICAL: Kill the old sandbox before creating new one
// This prevents accumulation of running E2B instances
try {
  await instance.sandbox.kill();
} catch {
  // Ignore kill errors - sandbox may already be dead
}

const newInstance = await createSandbox(
  manifest,
  label,
  timeoutSeconds,
  uiEnabled,
);
// ... rest of existing code
```

**Why second**: Keepalive expiration is less frequent (every 15 minutes) but still important for preventing long-running accumulation.

#### Step 3: Verify Consistency Across All Three Paths

Manually review all three restart paths to ensure they now follow the same pattern:

- [ ] Health check restart: has kill call ✅ (after Step 1)
- [ ] Keepalive expired restart: has kill call ✅ (after Step 2)
- [ ] Preemptive restart: already has kill call ✅ (existing)

Verify each path:
1. Calls `sandbox.kill()` wrapped in try/catch
2. Captures `oldSandboxId` before reassignment
3. Creates new sandbox via `createSandbox()`
4. Updates instance properties
5. Cleans up `sandbox_ids` array in manifest

#### Step 4: Add Comments for Clarity

Add explanatory comments at each kill site to document why this is critical:

```typescript
// CRITICAL: Kill the old sandbox before creating new one
// This prevents accumulation of running E2B instances
// Bug fix for #1442 - ensure all restart paths clean up old sandboxes
```

**Why**: Future maintainers need to understand this is not optional - prevents regression.

#### Step 5: Run Validation Commands

Execute all validation commands to ensure:
- TypeScript compilation succeeds
- Linting passes
- Code is properly formatted
- No regressions introduced

## Testing Strategy

### Unit Tests

**No new unit tests required** - this is a bug fix to existing orchestration logic. The behavior is already tested through integration testing (orchestrator runs).

However, we should verify:
- ✅ TypeScript compilation succeeds (types are correct)
- ✅ Linting passes (no code quality issues)
- ✅ No runtime errors when calling `sandbox.kill()`

### Integration Tests

**Manual integration testing required**:

Test the fix by triggering sandbox restarts:

1. **Health Check Restart Test**:
   - Start orchestrator with 3 sandboxes
   - Manually kill a Claude Code process inside one sandbox
   - Wait for health check to detect failure (~30s)
   - Verify old sandbox is killed before new one created
   - Check E2B dashboard shows only 3 running sandboxes

2. **Keepalive Expired Test**:
   - Start orchestrator with 3 sandboxes
   - Wait for keepalive interval (~15 min)
   - Monitor keepalive logic execution
   - Verify old sandboxes are killed if they fail keepalive
   - Check E2B dashboard shows only 3 running sandboxes

3. **Preemptive Restart Test** (should still work as before):
   - Start orchestrator and run for 50+ minutes
   - Verify preemptive restart still kills old sandbox
   - Confirm no regression in this path

### E2E Tests

Not applicable - this is orchestration infrastructure, not user-facing functionality.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start orchestrator with `tsx spec-orchestrator.ts 1362`
- [ ] Monitor sandbox count in E2B dashboard (`npx e2b sandbox list`)
- [ ] Verify initial sandbox count is 3
- [ ] Trigger health check restart by killing a Claude process in sandbox
- [ ] After restart, verify sandbox count is still 3 (not 4)
- [ ] Wait for keepalive interval (15 min)
- [ ] After keepalive, verify sandbox count is still 3
- [ ] Run orchestrator for extended period (30+ min)
- [ ] Verify sandbox count never exceeds 3
- [ ] Check logs for successful kill operations before sandbox creation
- [ ] Verify no "sandbox limit exceeded" errors from E2B

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Kill Operation Fails for Already-Dead Sandbox**:
   - **Likelihood**: medium (sandbox may have already timed out)
   - **Impact**: low (try/catch handles this gracefully)
   - **Mitigation**: Already handled - try/catch ignores kill errors, which is the correct behavior

2. **Kill Takes Too Long and Blocks Restart**:
   - **Likelihood**: low (E2B kill is fast, typically <2 seconds)
   - **Impact**: low (slight delay in restart, but health check runs every 30s anyway)
   - **Mitigation**: If kill hangs, E2B SDK has internal timeouts. No additional handling needed.

3. **Race Condition: Kill Happens While Sandbox is Working**:
   - **Likelihood**: very low (only kill when status is "failed" or keepalive failed)
   - **Impact**: medium (could lose in-progress work)
   - **Mitigation**: Already handled - restarts only happen when sandbox is detected as failed/expired, not during active work

**Rollback Plan**:

If this fix causes issues in production:
1. Revert the two commits that added kill calls
2. Deploy previous version of `orchestrator.ts`
3. Manually kill accumulated sandboxes with `npx e2b sandbox kill <id>`

Note: Rollback is unlikely to be needed - this fix makes the code match the already-working preemptive restart path.

**Monitoring**:
- Monitor E2B dashboard for sandbox count over first 24 hours
- Watch orchestrator logs for any errors during kill operations
- Alert if sandbox count exceeds `sandboxCount + 1` (allowing for brief overlap during restart)

## Performance Impact

**Expected Impact**: minimal

The `sandbox.kill()` operation adds a small delay to the restart process:
- Kill operation: ~1-2 seconds per sandbox
- Only happens during restarts (not normal operation)
- Restarts are infrequent (health check failures, keepalive expiration)

**Performance benefit**: Preventing sandbox accumulation reduces E2B resource usage and prevents hitting account limits, which would cause orchestrator failures.

**Performance Testing**:
- Measure restart time before and after fix
- Expected: <2 second increase in restart duration
- Acceptable: Restart completes within 5 seconds

## Security Considerations

**Security Impact**: none

This fix does not change authentication, authorization, or data handling. It only affects internal E2B sandbox lifecycle management.

**Security review needed**: no
**Penetration testing needed**: no

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start orchestrator
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# In another terminal, monitor sandbox count
watch -n 5 'npx e2b sandbox list | grep -c "slideheroes-claude-agent-dev"'

# Wait 10 minutes
# Expected: Sandbox count increases beyond 3 (bug present)
```

**Expected Result**: Sandbox count grows beyond configured `sandboxCount` (3) as restarts occur.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint:fix

# Format
pnpm format:fix

# Start orchestrator with fix
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Monitor sandbox count
watch -n 5 'npx e2b sandbox list | grep -c "slideheroes-claude-agent-dev"'

# Trigger health check restart by killing Claude in sandbox
# (requires access to sandbox terminal)

# Wait and verify count stays at 3
```

**Expected Result**:
- All validation commands succeed
- Sandbox count remains at 3 even after restarts
- Logs show "killing" messages before sandbox creation
- No "sandbox limit exceeded" errors

### Regression Prevention

```bash
# Verify orchestrator still works end-to-end
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --dry-run

# Check that preemptive restart path still works
# (requires running orchestrator for 50+ minutes)

# Verify no new TypeScript errors
pnpm typecheck

# Verify manifest updates still work correctly
cat .ai/alpha/specs/1362-Spec-user-dashboard-home/spec-manifest.json | jq '.sandbox.sandbox_ids | length'
# Should output: 3
```

## Dependencies

**No new dependencies required**

The `sandbox.kill()` method is already part of the `@e2b/code-interpreter` SDK used by the project.

## Database Changes

**No database changes required**

This fix only affects in-memory orchestration logic and E2B sandbox lifecycle management.

## Deployment Considerations

**Deployment Risk**: low

This fix changes internal orchestration logic but does not affect:
- User-facing features
- Database schema
- API contracts
- Authentication/authorization
- File system operations

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: maintained (no breaking changes)

## Success Criteria

The fix is complete when:
- [x] Code changes applied to both restart paths
- [ ] TypeScript compilation succeeds
- [ ] Linting passes
- [ ] Code properly formatted
- [ ] Manual testing confirms sandbox count stays at 3
- [ ] E2B dashboard shows no sandbox accumulation after 30+ min run
- [ ] Logs show kill operations before sandbox creation
- [ ] No "sandbox limit exceeded" errors occur
- [ ] All three restart paths follow consistent pattern

## Notes

### Why Try/Catch for Kill?

The try/catch around `sandbox.kill()` is not just defensive programming - it's necessary because:
1. The sandbox may have already timed out (E2B has a 1-hour default timeout)
2. The sandbox may have crashed or been manually killed
3. Network issues may prevent the kill RPC from completing

By ignoring kill errors, we ensure the orchestrator can always create a replacement sandbox even if cleanup fails.

### Secondary Issue: Frequent Restarts

The diagnosis revealed 15 sandbox instances created in 8 minutes (5 per label). This suggests:
- Health checks may be too aggressive
- Detection criteria may be too sensitive
- Features may be failing frequently

**This fix does NOT address the restart frequency** - it only prevents accumulation. Investigating why restarts are so frequent should be a separate issue.

### Related Code Patterns

The preemptive restart path (lines 461-465) already implements the correct pattern:
```typescript
try {
  await instance.sandbox.kill();
} catch {
  // Ignore kill errors - sandbox may already be dead
}
```

This fix simply replicates this proven pattern to the other two paths.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1442*
