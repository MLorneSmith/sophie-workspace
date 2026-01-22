# Bug Fix: Sandbox restart doesn't update UI progress or reset created_at timestamp

**Related Diagnosis**: #1712 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Two bugs work together: (1) `created_at` timestamp is never reset on restart, (2) UI progress file isn't updated after restart completes
- **Fix Approach**: Reset `created_at` on restart and call `writeIdleProgress()` immediately after restart completes
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

When E2B sandboxes expire and are restarted by the orchestrator:
1. The UI dashboard shows stale data with old heartbeat timestamps (25+ minutes old)
2. The `manifest.sandbox.created_at` timestamp is never reset on sandbox restart, making freshly created sandboxes immediately appear "old"
3. UI progress files are not written immediately after restart, leaving stale progress data visible

This causes users to see misleading information about sandbox status during restarts, with old timestamps suggesting the sandbox has been running for much longer than it actually has.

For full details, see diagnosis issue #1712.

### Solution Approaches Considered

#### Option 1: Reset `created_at` + Write UI Progress ⭐ RECOMMENDED

**Description**:
- Reset `manifest.sandbox.created_at` to current time when sandbox is created (in restart code path)
- Call `writeIdleProgress()` immediately after successful restart in both restart handlers
- This ensures fresh `created_at` timestamps and current UI progress state

**Pros**:
- Fixes both root causes with minimal code changes
- Follows existing pattern: `writeIdleProgress()` is already used elsewhere for state synchronization
- No architectural changes needed
- Easy to test and verify

**Cons**:
- Requires changes in two places (two restart handlers)

**Risk Assessment**: low - Changes are isolated to restart handlers, existing logic unaffected

**Complexity**: simple - Three lines of code added to two locations

#### Option 2: Only reset `created_at`, handle progress differently

**Description**:
- Reset `created_at` on restart but don't update UI progress
- Rely on existing progress poll logic to eventually pick up the new sandbox

**Why Not Chosen**: Leaves stale progress visible to users until next session starts. Doesn't fully solve the problem.

#### Option 3: Create a special restart handler that handles both at once

**Description**:
- Extract restart logic into a dedicated function that handles both bugs
- Call this function from both restart code paths

**Why Not Chosen**: Over-engineering for a simple fix. Current approach is already duplicated, keeping it that way is fine. Adding abstraction would make code harder to follow.

### Selected Solution: Reset `created_at` + Write UI Progress

**Justification**: This is the most straightforward solution. The root causes are clear and isolated:
1. `created_at` is only set if not already set (line 527-528 in sandbox.ts) - need to remove the `|| new Date()...` guard in restart paths
2. `writeIdleProgress()` exists and is already used - just need to call it after restart

Both issues are fixed with surgical changes that don't affect surrounding code or require new abstractions.

**Technical Approach**:
- In orchestrator.ts restart handler (line ~620): Reset `manifest.sandbox.created_at = new Date().toISOString();` after sandbox creation, then call `writeIdleProgress()`
- In orchestrator.ts restart handler (line ~716): Same changes for the second restart path
- No changes to sandbox.ts - the bug is in the restart logic not calling the reset

**Architecture Changes**: None - uses existing `writeIdleProgress()` function

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/orchestrator.ts` - Two restart handlers need fixes
  - Lines ~605-626: First restart handler (preemptive restart)
  - Lines ~689-720: Second restart handler (stall timeout restart)

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Fix first restart handler (~line 605-626)

After `saveManifest(manifest)` is called (line 622), add:
1. Reset `manifest.sandbox.created_at` to current time
2. Call `writeIdleProgress()` to update UI state
3. Save manifest again if timestamp was modified

**Why this step first**: This is the preemptive restart handler - it runs when the sandbox is about to expire. The fix here establishes the pattern.

#### Step 2: Fix second restart handler (~line 689-720)

Repeat the same changes after `saveManifest(manifest)` is called (line 716):
1. Reset `manifest.sandbox.created_at` to current time
2. Call `writeIdleProgress()` to update UI state

**Why after first**: Both handlers do the same thing (restart sandbox), so consistency is important. Doing first ensures pattern is correct before copying.

#### Step 3: Add unit tests for restart behavior

- Add tests that verify `created_at` is reset on restart
- Add tests that verify UI progress file is written after restart
- Verify heartbeat timestamp in progress file is current

#### Step 4: Manual testing

- Create/start orchestration with sandboxes
- Force sandbox to reach expiration threshold
- Verify manifest `created_at` is reset
- Verify UI progress file shows current heartbeat timestamp
- Verify dashboard shows current progress (not stale data)

#### Step 5: Validation

- Run all validation commands (see Validation Commands section)
- Verify zero regressions in orchestrator behavior
- Confirm bug is fixed

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `created_at` is reset when sandbox is restarted (preemptive restart)
- ✅ `created_at` is reset when sandbox is restarted (stall timeout restart)
- ✅ `writeIdleProgress()` is called after preemptive restart
- ✅ `writeIdleProgress()` is called after stall timeout restart
- ✅ Progress file shows current heartbeat (not stale data)
- ✅ Regression test: Restart count still increments correctly
- ✅ Regression test: Restart doesn't affect other manifest properties

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/orchestrator.restart.spec.ts` - Restart behavior tests

### Integration Tests

- Simulate orchestration with sandbox restart
- Verify manifest state before and after restart
- Verify UI progress file is written with correct timestamps

**Test files**:
- `.ai/alpha/scripts/__tests__/orchestrator.restart.integration.spec.ts` - Integration tests

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start orchestration with sandboxes
- [ ] Verify initial manifest `created_at` is set
- [ ] Wait for sandbox to reach restart threshold or manually trigger restart
- [ ] Verify manifest `created_at` is reset (newer timestamp)
- [ ] Verify UI progress file exists with current heartbeat
- [ ] Check dashboard shows current progress (not 25+ minute old data)
- [ ] Verify restart count increments
- [ ] Verify other sandbox properties (feature, status, etc.) are not corrupted

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Manifest corruption**: If we save manifest twice in close succession
   - **Likelihood**: low
   - **Impact**: medium (would break orchestration)
   - **Mitigation**: Save once after both changes; verify manifest is valid JSON

2. **UI progress file corruption**: If `writeIdleProgress()` fails
   - **Likelihood**: low (already has error handling)
   - **Impact**: low (progress file already has error handling)
   - **Mitigation**: `writeIdleProgress()` already has try-catch, no additional handling needed

3. **Performance impact**: Writing progress file adds I/O
   - **Likelihood**: none
   - **Impact**: none (single file write is negligible)
   - **Mitigation**: Not a concern

**Rollback Plan**:

If this fix causes issues:
1. Revert the changes to orchestrator.ts
2. Restart orchestration - old behavior resumes
3. Original bug (stale progress) returns but system continues to function

**Monitoring** (if needed):
- Monitor orchestration logs for manifest corruption
- Monitor restart count in manifests for sanity
- Monitor UI progress file timestamps for correctness

## Performance Impact

**Expected Impact**: none

No performance implications - we're writing one small JSON file per restart, which is already happening elsewhere in the code.

## Security Considerations

**Security Impact**: none

No security implications - we're updating internal state files and progress tracking, not affecting authentication, authorization, or data handling.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start orchestration and let sandboxes run
pnpm --filter @kit/alpha run orchestrate --features 1 --timeout 300

# In another terminal, monitor the manifest
watch -n 1 "cat .ai/alpha/.orchestrator-lock/manifest.json | jq '.sandbox.created_at'"

# Wait for restart to occur
# Observe: created_at timestamp does NOT change (should be 25+ minutes old after restart)
```

**Expected Result**: After restart, manifest `created_at` is same as before restart (demonstrating the bug).

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run tests
pnpm --filter @kit/alpha test

# Manual verification (same as Before Fix)
# Start orchestration and let sandboxes run
pnpm --filter @kit/alpha run orchestrate --features 1 --timeout 300

# In another terminal, monitor the manifest
watch -n 1 "cat .ai/alpha/.orchestrator-lock/manifest.json | jq '.sandbox.created_at'"

# Wait for restart to occur
# Observe: created_at timestamp CHANGES to current time after restart
```

**Expected Result**:
- All commands succeed
- After restart, manifest `created_at` is updated to current time
- UI progress file shows current heartbeat timestamp
- Bug is resolved

### Regression Prevention

```bash
# Run full test suite
pnpm --filter @kit/alpha test

# Verify orchestrator behavior
pnpm --filter @kit/alpha run orchestrate-test

# Check manifest structure
node -e "const m = require('./manifest.json'); console.log(JSON.stringify(m, null, 2));"
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required** - Uses existing `writeIdleProgress()` function from progress.ts

## Database Changes

**No database changes required** - This fix only updates in-memory manifest and UI progress files.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: maintained - No changes to manifest schema or API

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Bug no longer reproduces (created_at resets on restart)
- [ ] UI progress file is updated immediately after restart
- [ ] All tests pass (unit, integration)
- [ ] Zero regressions detected (restart count still works, etc.)
- [ ] Code review approved (if applicable)
- [ ] Manual testing checklist complete
- [ ] Dashboard shows current progress (not stale data)

## Notes

**Implementation Notes:**
- Both restart handlers follow the same pattern - changes should be identical
- `writeIdleProgress()` takes `sandboxLabel` and `instance` as parameters (see progress.ts:226)
- Remember to call `saveManifest(manifest)` after resetting `created_at` if doing it separately, or reset before the existing save

**Related Code:**
- `sandbox.ts:527-528` - Where the bug originated (only-if-not-set guard)
- `orchestrator.ts:622` - First saveManifest call in restart handler
- `orchestrator.ts:716` - Second saveManifest call in restart handler
- `progress.ts:226-259` - `writeIdleProgress()` function definition

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1712*
