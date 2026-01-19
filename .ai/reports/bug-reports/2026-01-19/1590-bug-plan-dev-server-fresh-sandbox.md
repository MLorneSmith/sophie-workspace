# Bug Fix: Alpha Orchestrator Dev Server - Fresh Sandbox for Review

**Related Diagnosis**: #1589 (REQUIRED)
**Severity**: low
**Bug Type**: performance
**Risk Level**: low
**Complexity**: moderate

## Quick Reference

- **Root Cause**: 30-second timeout insufficient for Next.js cold start in resource-exhausted sandbox after 110 tasks
- **Fix Approach**: Spin up dedicated fresh sandbox for dev server after all features complete
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Orchestrator completes spec implementation successfully (13 features, 110 tasks) but the dev server fails to start within 30 seconds on the implementation sandbox. The workspace has accumulated resource pressure from multiple Claude Code sessions, preventing the Next.js dev server from starting reliably. While the error is properly handled and users can access VS Code for review, providing a working dev server would significantly improve the review experience.

For full details, see diagnosis issue #1589.

### Solution Approaches Considered

#### Option 1: Create Dedicated Review Sandbox ⭐ RECOMMENDED

**Description**: After all features complete, create a fresh E2B sandbox, clone the completed branch, and start the dev server. This gives the dev server a clean environment with no resource contention from prior work.

**Pros**:
- Clean environment guarantees better performance
- Dev server startup is 10-20 seconds faster (no resource pressure)
- Fresh instance aligns with production-like review experience
- Keeps implementation sandbox available for debugging if needed
- VS Code can still access implementation sandbox if user wants to inspect code

**Cons**:
- Adds 60-90 seconds for sandbox creation + branch setup
- Additional E2B API usage (one more sandbox)
- More complex orchestration logic
- Requires managing two sandboxes simultaneously during review phase

**Risk Assessment**: low - Fresh sandbox creation is a proven E2B pattern, and we already handle sandbox creation reliably. The only new complexity is managing two sandboxes briefly.

**Complexity**: moderate - Requires orchestrator changes and new state management

#### Option 2: Use Production Build Instead of Dev Server

**Description**: Run `pnpm build && pnpm start` on the implementation sandbox instead of `pnpm dev`. Production build is faster and more stable.

**Pros**:
- Faster startup (20-30 seconds vs 30-60s)
- More representative of production
- No hot reload needed for review
- Single sandbox only
- Simpler to implement

**Cons**:
- Requires 5-10 minutes initial build time (not suitable for immediate review)
- Build artifact cleanup needed
- Less suitable if user wants to make quick edits during review
- Doesn't solve root cause of resource pressure

**Why Not Chosen**: While simpler, this doesn't work well for the intended use case. The build takes too long, defeating the purpose of quick review access. Users need immediate access to a working app.

#### Option 3: Increase Timeout to 90 Seconds

**Description**: Change the health check timeout from 30 to 90 seconds, giving dev server more time to start.

**Pros**:
- Simple one-line change
- No additional resources
- Minimal code complexity

**Cons**:
- Doesn't address root cause (resource exhaustion)
- 90-second wait on failure is unacceptable UX
- May still fail due to sandbox resource limits
- Temporary band-aid, not a real fix

**Why Not Chosen**: Too much downside. Waiting 90 seconds for failure is a poor user experience. The fresh sandbox approach is only slightly more complex but provides a real solution.

#### Option 4: Skip Dev Server, Rely on VS Code Only

**Description**: Don't start dev server on completion. User can manually start via VS Code terminal if needed.

**Pros**:
- No dev server startup failures
- Simplest implementation
- User has full control

**Cons**:
- Worse UX (user has to do manual work)
- Defeats the purpose of providing review URLs
- User still has to wait 30-60 seconds if they manually start
- Less professional completion experience

**Why Not Chosen**: This is giving up on solving the problem. The whole point of the orchestrator is to provide a polished, complete review experience.

### Selected Solution: Create Dedicated Review Sandbox

**Justification**: The fresh sandbox approach provides the best balance of reliability, performance, and user experience. While it adds 60-90 seconds to the orchestrator completion time, this is acceptable as a one-time cost for providing a stable, fast dev server. The implementation complexity is moderate and well within our current patterns. This aligns with our design philosophy of providing a complete, polished review experience.

**Technical Approach**:
1. Keep implementation sandbox alive (sbx-a with all code)
2. Create new "review" sandbox (sbx-review) after work loop completes
3. Pull latest branch to review sandbox
4. Start dev server on review sandbox with longer timeout
5. Return both VS Code URLs (both sandboxes) for user flexibility
6. Provide clear UI showing which sandbox is for what purpose

**Architecture Changes**:
- New function: `createReviewSandbox()` - Minimal sandbox setup for review
- Modified: `orchestrate()` - Add review sandbox creation after work loop
- Modified: Review URL generation - Return URLs from review sandbox primarily
- No breaking changes to public APIs

**Migration Strategy**: N/A - No data migration needed. This is additive functionality.

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/sandbox.ts` - Add `createReviewSandbox()` function
- `.ai/alpha/scripts/lib/orchestrator.ts` - Orchestration flow to create review sandbox
- `.ai/alpha/scripts/lib/orchestrator.ts` - Dev server startup logic uses review sandbox
- `.ai/alpha/scripts/lib/types/index.ts` - Add ReviewSandboxInstance type if needed

### New Files

No new files needed - functionality integrates into existing modules.

### Step-by-Step Tasks

#### Step 1: Create Review Sandbox Setup Function

This step adds a lightweight sandbox creation function optimized for review (no tests, no build setup needed).

- Add `createReviewSandbox()` function to `sandbox.ts`
- Takes less than 90 seconds total (vs 5+ minutes for implementation sandbox)
- Minimal setup: just clone, checkout branch, install deps
- Returns sandbox instance ready for dev server startup

**Why this step first**: We need this foundation before modifying the orchestrator flow.

#### Step 2: Modify Orchestrator Completion Flow

Update the orchestrator to create review sandbox after work loop completes.

- After `runWorkLoop()` completes (Step 1249 in orchestrator.ts)
- Kill non-primary implementation sandboxes (sbx-b, sbx-c)
- Keep sbx-a (implementation) running for debugging
- Create new `sbx-review` sandbox
- Store reference for later cleanup

**Why this step**: Establishes the review sandbox lifecycle.

#### Step 3: Start Dev Server on Review Sandbox

Update dev server startup to use review sandbox instead of implementation sandbox.

- Pass `reviewSandbox` to `startDevServer()` instead of `reviewInstance.sandbox`
- Extend timeout to 60 seconds (review sandbox should be cleaner)
- Still provide fallback if dev server fails

**Why this step**: Ensures dev server runs on clean environment.

#### Step 4: Update Review URLs Generation

Return URLs that clearly indicate which sandbox is which.

- Primary URL from review sandbox (dev server)
- Secondary URL from implementation sandbox VS Code (for code inspection)
- Label clearly: "Dev Server (Review)" vs "Code Editor (Implementation)"
- Update overall-progress.json to include both

**Why this step**: Provides users with maximum flexibility.

#### Step 5: Add Tests

Comprehensive tests for fresh sandbox creation and dev server startup.

- Unit test: `createReviewSandbox()` successfully creates sandbox
- Unit test: Dev server starts faster on review sandbox
- Integration test: Full orchestration creates both sandboxes
- Regression test: Original issue (dev server timeout) doesn't reoccur

#### Step 6: Validation

Run all validation commands and manual testing.

- TypeScript type checking passes
- All tests pass
- Dev server starts successfully on review sandbox
- No resource leaks or sandbox hanging

## Testing Strategy

### Unit Tests

Add unit tests for:
- ✅ `createReviewSandbox()` creates and configures sandbox correctly
- ✅ Review sandbox has branch checked out
- ✅ Dev server health check respects longer timeout on review sandbox
- ✅ Dev server startup on review sandbox succeeds within 60s
- ✅ Fallback URLs still provided if dev server fails on review sandbox

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/sandbox-review.spec.ts` - Review sandbox creation tests (8 tests)

### Integration Tests

- ✅ Full orchestration creates implementation + review sandboxes
- ✅ Both sandboxes have correct branches
- ✅ Dev server fails gracefully if review sandbox setup fails
- ✅ Implementation sandbox still usable if review sandbox fails

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/orchestrator-review-sandbox.spec.ts` - Orchestration tests (6 tests)

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run full spec orchestration: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
- [ ] Observe two sandboxes in completion screen (sbx-a impl, sbx-review)
- [ ] Click dev server URL from review sandbox - should load within 10 seconds
- [ ] Click code editor URL from sbx-a - should also work
- [ ] Kill review sandbox manually, verify sbx-a still running
- [ ] Verify no resource leaks (check E2B sandbox list after completion)
- [ ] Test with different spec sizes (small: 2 features, large: 15 features)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **E2B API Rate Limiting**: Creating additional sandboxes may hit API rate limits
   - **Likelihood**: low (we already create multiple sandboxes during implementation)
   - **Impact**: medium (blocks orchestrator completion)
   - **Mitigation**: Reuse E2B SDK connection, add rate limit backoff, cache review sandbox creation

2. **Stale Branch Sync**: Review sandbox checks out branch before final push completes
   - **Likelihood**: low (we wait for push before creating review sandbox)
   - **Impact**: medium (review sandbox has stale code)
   - **Mitigation**: Explicit `git pull` after checkout to ensure latest

3. **Resource Limits**: Two simultaneous sandboxes may exceed E2B account limits
   - **Likelihood**: low (review sandbox is lightweight)
   - **Impact**: high (review sandbox fails to create)
   - **Mitigation**: Check available sandbox slots before creating review sandbox, fail gracefully

4. **Extended Completion Time**: Adding 60-90 seconds to orchestrator completion
   - **Likelihood**: high (expected and acceptable)
   - **Impact**: low (acceptable trade-off for improved review experience)
   - **Mitigation**: Document timing, show progress during review sandbox creation

**Rollback Plan**:

If this feature causes production issues:

1. Revert review sandbox creation logic in `orchestrator.ts`
2. Restore original dev server startup on implementation sandbox
3. Re-enable 30-second timeout as fallback
4. Users will experience original behavior (dev server "(failed to start)")

This is a safe rollback because the changes are isolated to the completion phase and don't affect the core implementation flow.

**Monitoring** (if deployed):
- Monitor dev server startup time on review sandbox (should be 10-20s)
- Alert if review sandbox creation fails more than 10% of the time
- Track E2B sandbox API errors during review sandbox creation

## Performance Impact

**Expected Impact**: Positive

- Implementation phase: no change (same as before)
- Completion phase: +60-90 seconds to create review sandbox, but dev server starts in 10-20s instead of failing
- User review experience: dev server accessible instantly vs currently unavailable

**Performance Testing**:
- Measure dev server startup time on review sandbox vs implementation sandbox
- Expected: 10-20s (review) vs 30+ s (implementation with resource pressure)
- Target: dev server responsive within 20 seconds on completion screen

## Security Considerations

**Security Impact**: none

Review sandbox doesn't have special security requirements - it's temporary and contains only cloned repo code. Same RLS and auth policies apply as implementation sandbox.

## Validation Commands

### Before Fix (Current Behavior - Dev Server Fails)

```bash
# Run orchestrator for spec 1362
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Observe: dev server shows "(failed to start)"
# VS Code works: https://8080-<sbx-a-id>.e2b.app
```

**Expected Result**: Dev server URL fails, VS Code works (current broken state)

### After Fix (Dev Server Works)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Unit tests
pnpm test:unit .ai/alpha/scripts/lib/__tests__/sandbox-review.spec.ts

# Integration tests
pnpm test:unit .ai/alpha/scripts/lib/__tests__/orchestrator-review-sandbox.spec.ts

# Manual verification
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362
```

**Expected Result**: All commands succeed, dev server URL works on review sandbox

### Regression Prevention

```bash
# Full test suite for orchestrator
pnpm test:unit .ai/alpha/scripts/lib/__tests__/orchestrator*.spec.ts

# Verify no sandbox leaks
npx e2b sandbox list  # Should clean up after orchestration

# Manual regression: Verify original implementation flow still works
# (features still complete, code still pushed, etc.)
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required** - Uses existing E2B SDK and orchestrator patterns.

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - code change is isolated to orchestrator completion flow

**Feature flags needed**: no

**Backwards compatibility**: fully maintained - this is additive functionality

## Success Criteria

The fix is complete when:
- [ ] Review sandbox created successfully after spec implementation
- [ ] Dev server starts within 20 seconds on review sandbox
- [ ] Dev server URL is accessible and displays application
- [ ] Both sandboxes shown in completion screen with clear labels
- [ ] All validation commands pass
- [ ] No resource leaks or sandbox hangs
- [ ] Zero regressions in core implementation flow
- [ ] Manual testing checklist complete
- [ ] Code review approved

## Notes

### User Experience Improvement

With fresh sandbox approach:
- **Before**: Dev server "(failed to start)", VS Code works, user must manually start dev server
- **After**: Dev server "https://...", loads in 10 seconds, user sees working application immediately

### E2B Cost Impact

Creates one additional temporary sandbox per orchestrator run:
- Sandbox lifespan: ~90 seconds (duration of orchestrator cleanup phase)
- After orchestrator completes, review sandbox expires with default timeout
- Negligible cost increase for significantly improved UX

### Future Enhancement

After this fix is stable, consider:
- Production build option for even faster startup (no compilation)
- Persistent review sandboxes (keep alive for longer review time)
- Automatic cleanup of old review sandboxes

---
*Bug Fix Plan for #1589 - Fresh Sandbox Solution*
*Estimated Implementation Time: 2-3 hours including tests*
