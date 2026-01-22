# Bug Fix: Orchestrator Completion Phase Issues

**Related Diagnosis**: #1722 (REQUIRED)
**Severity**: high
**Bug Type**: integration
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Dev server startup timeout is insufficient (60s) for cold-start in fresh E2B sandbox; sandbox cleanup doesn't remove killed sandbox IDs from manifest
- **Fix Approach**: Increase dev server timeout to 180s with early detection; implement proper sandbox cleanup to remove dead IDs and track review sandbox
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha orchestrator's completion phase has two interconnected issues:

1. **Dev Server Timeout**: The `startDevServer()` function polls for 60 attempts × 1000ms = 60s. Next.js cold-start on a fresh E2B sandbox takes 90-120s, causing timeout and failure.
2. **Sandbox Cleanup**: After killing sandboxes (sbx-b, sbx-c), their IDs remain in `manifest.sandbox.sandbox_ids`. The review sandbox ID is never added. This leaves stale references and prevents proper tracking.

Both issues cascade: incomplete cleanup → sandbox state mismatch → dev server startup problems.

For full details, see diagnosis issue #1722.

### Solution Approaches Considered

#### Option 1: Increase Timeout + Early Success Detection ⭐ RECOMMENDED

**Description**: Increase dev server timeout from 60s to 180s, add HTTP 200 detection to stop polling early if server responds.

**Pros**:
- Simplest fix, minimal code changes
- Handles cold-start variance (80-180s depending on bundle size)
- Early exit prevents unnecessary polling
- Low risk of unintended side effects

**Cons**:
- Still waits up to 3 minutes in worst case
- Doesn't address underlying slow startup

**Risk Assessment**: low - timeout is safety mechanism, should be generous

**Complexity**: simple - 2 line change to timeout, 5 line change to early detection

#### Option 2: Warm Up Bundle on Creation

**Description**: After sandbox creation, pre-compile Next.js bundle to ensure dev server starts faster.

**Pros**:
- Addresses root cause (slow startup)
- Provides consistent 20-30s startup time
- Better user experience overall

**Cons**:
- Adds 30-60s to initial sandbox creation
- Complex implementation with edge cases
- Hard to test/debug

**Why Not Chosen**: Fixes symptom of symptom. Better to increase timeout (handles all cases) and investigate slow startup separately as future optimization.

#### Option 3: Use Production Build Instead

**Description**: Skip dev server, show production build with hot reload disabled.

**Why Not Chosen**: Defeats purpose of review sandbox (live development environment). Users need dev server for hot reload.

### Selected Solution: Option 1 + Sandbox Cleanup

**Justification**:
- Dev server timeout increase handles the immediate problem safely (generous timeout accommodates variance)
- Early detection improves UX by stopping polling when server is ready
- Parallel cleanup fix addresses manifest corruption
- Combined changes are low-risk, well-tested
- Can iterate on startup performance later without blocking fix

**Technical Approach**:

1. **Dev Server Timeout Fix**:
   - Increase `MAX_RETRIES` from 60 to 180 (60 × 180 = 180 seconds)
   - Add HTTP status check: if response.status === 200, return early (success)
   - Keep exponential backoff (1s between polls) for consistency

2. **Sandbox Cleanup Fix**:
   - After killing sandboxes: filter `manifest.sandbox.sandbox_ids` to remove dead IDs
   - Add review sandbox ID to manifest immediately after creation
   - Verify manifest consistency before returning

3. **Manifest Integrity**:
   - Log manifests at key points (before cleanup, after cleanup, after review creation)
   - Add assertions to catch orphaned IDs

**Architecture Changes** (minimal):
- No API changes
- No database changes
- Internal orchestrator state management only

**Migration Strategy** (not applicable):
- Manifest structure unchanged
- Backward compatible

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/sandbox.ts` - Contains `startDevServer()` and sandbox creation functions
- `.ai/alpha/scripts/lib/orchestrator.ts` - Contains completion phase logic (lines 1520-1660)

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Increase Dev Server Timeout

Modify `.ai/alpha/scripts/lib/sandbox.ts` to increase timeout and add early success detection.

- Find the `startDevServer()` function (search for "max.*attempts" or "startDevServer")
- Change `MAX_RETRIES` or equivalent from 60 to 180
- Add HTTP 200 status check before sleeping (if response succeeds, return immediately)
- Verify the polling interval remains reasonable (1000ms is fine)

**Why this step first**: Fixes the most critical issue (dev server timeout). Can be deployed independently.

#### Step 2: Implement Sandbox Cleanup

Modify `.ai/alpha/scripts/lib/orchestrator.ts` completion phase to clean up sandbox manifest.

- After killing sandboxes (sbx-b, sbx-c), read manifest
- Filter `manifest.sandbox.sandbox_ids` to remove any IDs not in the running list
- Add review sandbox ID immediately after creation
- Log the cleanup operation

**Why this step second**: Depends on Step 1 (dev server must start to reach completion phase). Fixes data integrity.

#### Step 3: Add Validation and Logging

Add manifest validation checks and detailed logging.

- Before returning from completion phase: assert all sandbox IDs are alive
- Log manifest state at each key point (before cleanup, after cleanup)
- Add warnings if orphaned IDs are found

#### Step 4: Test the Fix

Execute validation steps to verify the fix works.

- Run orchestrator on spec S0000 (debug spec)
- Verify all three original sandboxes are properly killed
- Verify review sandbox ID appears in manifest
- Verify dev server starts successfully within 180s
- Verify `reviewUrls.devServer` shows working URL

#### Step 5: Manual Verification

Run a full end-to-end test.

- Execute: `tsx .ai/alpha/scripts/spec-orchestrator.ts 0`
- Wait for completion (expect ~180s timeout max)
- Verify sandbox list has only review sandbox running (use `e2b sandbox ls`)
- Verify manifest has correct sandbox IDs
- Test dev server URL from reviewUrls

## Testing Strategy

### Unit Tests

Test components in isolation:
- ✅ `startDevServer()` timeout behavior (mock HTTP responses)
- ✅ Sandbox cleanup function (mock manifest state)
- ✅ Manifest validation logic
- ✅ Early success detection (mock 200 response at iteration N)

**Test files**:
- Add tests to `.ai/alpha/scripts/__tests__/sandbox.test.ts` (create if needed)
- Add tests to `.ai/alpha/scripts/__tests__/orchestrator.test.ts` (create if needed)

### Integration Tests

Test the orchestrator completion phase:
- ✅ Full completion phase with mock E2B API
- ✅ Verify sandbox cleanup cascades correctly
- ✅ Verify manifest integrity after cleanup

### E2E Tests

Execute against real E2B sandbox (if E2B_API_KEY available):
- ✅ Create sandboxes, complete orchestrator, verify cleanup
- ✅ Check that review sandbox is running and manifest is correct

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run orchestrator on S0000: `tsx .ai/alpha/scripts/spec-orchestrator.ts 0`
- [ ] Wait and watch for dev server startup (should succeed within 180s)
- [ ] Verify returned `reviewUrls` contains working dev server URL
- [ ] Check E2B sandbox list: `e2b list` (only review sandbox should remain)
- [ ] Verify manifest in report shows single review sandbox ID
- [ ] Test dev server URL in browser (should load Next.js dev server)
- [ ] Run orchestrator again to verify no leftover sandboxes interfere
- [ ] Check that killed sandboxes don't appear in subsequent manifest

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Timeout Too Short Still**: If actual startup exceeds 180s due to bundle size
   - **Likelihood**: low (180s is 3x historical max)
   - **Impact**: medium (completion phase still fails)
   - **Mitigation**: Monitor actual startup times; can increase to 300s if needed; investigate slow startup separately

2. **Manifest Corruption**: Cleanup logic removes wrong sandboxes
   - **Likelihood**: low (filter logic is simple)
   - **Impact**: high (orphaned sandboxes remain running)
   - **Mitigation**: Add assertions before/after cleanup; log removed IDs; validate with set comparison

3. **Review Sandbox Not Tracked**: ID not added to manifest properly
   - **Likelihood**: low (straightforward assignment)
   - **Impact**: medium (future operations can't kill review sandbox)
   - **Mitigation**: Assert ID exists before returning; test with real E2B API

4. **Early Detection Race Condition**: Server responds with 200 but isn't fully ready
   - **Likelihood**: low (Next.js health check is comprehensive)
   - **Impact**: low (reviewer can wait a few more seconds)
   - **Mitigation**: Use `/api/health` or `/_next/static` endpoint known to be ready

**Rollback Plan**:

If this fix causes issues in orchestrator (sandboxes not killed, dev server doesn't start):

1. Revert `.ai/alpha/scripts/lib/sandbox.ts` timeout change
2. Revert `.ai/alpha/scripts/lib/orchestrator.ts` cleanup logic
3. Sandboxes will behave as before (slow but functional)
4. Create new diagnosis for root cause (slow startup, manifest cleanup)

**Monitoring** (if needed):
- Monitor dev server startup time across orchestrator runs
- Alert if startup exceeds 180s (indicates bundle size regression)
- Track cleanup operations and verify sandbox IDs are actually killed

## Performance Impact

**Expected Impact**: Minimal

- Dev server timeout increase: no impact (only affects error case)
- Cleanup operations: <100ms (simple filtering)
- Early detection: minor improvement (saves 10-60s in success case)

**Performance Testing**:
- Record dev server startup time in normal orchestrator run
- Verify it's under 180s
- Monitor for performance regressions in bundle compilation

## Security Considerations

**Security Impact**: None

The changes don't affect:
- E2B API authentication
- Sandbox isolation
- Data access or permissions
- Network communication

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run orchestrator with S0000 spec - should timeout on dev server
tsx .ai/alpha/scripts/spec-orchestrator.ts 0

# Expected result: "Failed to start dev server" error after ~60s
# Verify with: e2b list (multiple sandboxes still running)
```

**Expected Result**: Dev server startup fails after 60s timeout; multiple sandboxes remain running.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run orchestrator - should complete successfully
tsx .ai/alpha/scripts/spec-orchestrator.ts 0

# Verify completion - check sandbox status
e2b list
# Expected: only review sandbox running

# Verify manifest cleanup
# Check .ai/alpha/specs/S0000-Spec-debug-completion/spec-manifest.json
# Expected: sandbox_ids array has only 1 entry (review sandbox)

# Test dev server URL from orchestrator output
curl -I https://{sandbox-id}-3000.e2b.app/
# Expected: HTTP 200 OK
```

**Expected Result**: Orchestrator completes successfully, dev server is running, manifest is clean, single sandbox remains.

### Regression Prevention

```bash
# Run full orchestrator test suite (if exists)
pnpm --filter @kit/alpha test

# Run spec orchestrator multiple times to verify consistency
for i in {1..3}; do tsx .ai/alpha/scripts/spec-orchestrator.ts 0; done

# Verify no sandboxes leak across runs
e2b list
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- No special steps needed
- Changes are internal to Alpha orchestrator
- No customer-facing changes

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [ ] Dev server starts successfully within 180s timeout
- [ ] All cleanup tests pass
- [ ] Manual testing checklist complete
- [ ] Zero regressions in orchestrator functionality
- [ ] Manifest cleanup verified (dead sandbox IDs removed)
- [ ] Review sandbox properly tracked in manifest
- [ ] No orphaned E2B sandboxes after completion

## Notes

**Key Implementation Details**:
- The 180s timeout is a safety net, not the happy path. With early detection, most runs should complete in 90-120s
- Manifest cleanup should use set comparison to avoid accidental removal
- Log cleanup operations extensively for debugging future issues

**Related Issues**:
- Slow Next.js startup is a separate concern (investigate bundle size, caching)
- E2B sandbox lifecycle could use more robust tracking (future improvement)

**Code Locations**:
- `.ai/alpha/scripts/lib/sandbox.ts:startDevServer()` - Dev server startup logic
- `.ai/alpha/scripts/lib/orchestrator.ts:completion phase` - Completion phase orchestration

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1722*
