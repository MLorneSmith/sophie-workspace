# Bug Fix: Alpha Orchestrator Completion Phase Issues

**Related Diagnosis**: #1726
**Severity**: medium
**Bug Type**: bug
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Four interrelated issues: (A) dev server fails due to resource pressure on fallback sandbox, (B) no event emission during completion phase, (C) incomplete sandbox lifecycle management, (D) UI truncation from unstripped ANSI codes
- **Fix Approach**: Kill all implementation sandboxes, emit completion events, create fresh review sandbox, strip ANSI codes from UI output
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Orchestrator's completion phase has four distinct issues that prevent proper finalization and cleanup of tasks:

1. **Dev server fails to start** - Uses exhausted implementation sandbox as fallback
2. **No event emission** - Completion phase operations produce no visible events
3. **Incomplete sandbox cleanup** - Some sandboxes kept alive, others killed
4. **UI truncation** - ANSI escape sequences consume character budget

For full details, see diagnosis issue #1726.

### Solution Approaches Considered

#### Option 1: Complete Lifecycle Redesign ⭐ RECOMMENDED

**Description**: Implement a complete sandbox lifecycle management system that:
- Kills ALL implementation sandboxes (sbx-a, sbx-b, sbx-c) before review phase
- Creates a fresh review sandbox with clean resources
- Emits events for all completion phase transitions
- Strips ANSI codes from UI output before display

**Pros**:
- Solves all four issues systematically
- Fresh sandbox guarantees clean state for dev server
- Event emission provides visibility into completion phase
- ANSI stripping is a simple regex pattern
- Most maintainable long-term approach

**Cons**:
- Requires changes to three files simultaneously
- Slightly larger changeset than minimal fixes
- Need to update event-emitter type definitions

**Risk Assessment**: medium - The changes are localized to completion phase and event emission logic. No impact on core task execution.

**Complexity**: moderate - Four distinct changes that must coordinate properly.

#### Option 2: Minimal Resource Fix (Kill sbx-a as fallback)

**Description**: Only kill the implementation sandbox that's causing the resource pressure, but keep the event and lifecycle issues unfixed.

**Pros**:
- Smaller code change
- Fixes the dev server startup issue quickly

**Cons**:
- Leaves events issue unsolved
- Doesn't fully resolve sandbox lifecycle confusion
- Doesn't address UI truncation
- Incomplete solution requiring follow-up fixes

**Why Not Chosen**: Doesn't comprehensively solve the diagnosed issues. The diagnosis clearly identified all four problems that should be addressed together.

#### Option 3: Event-First Approach

**Description**: Extend event system first, then add other fixes incrementally.

**Pros**:
- Addresses visibility problem first
- Can be done in isolation

**Cons**:
- Doesn't fix dev server startup or sandbox cleanup
- Requires multiple commits/PRs
- Doesn't match the holistic diagnosis

**Why Not Chosen**: Doesn't align with the comprehensive diagnosis. Better to fix all issues together.

### Selected Solution: Complete Lifecycle Redesign

**Justification**: This approach comprehensively addresses all four issues identified in the diagnosis. It's the most maintainable long-term solution and provides complete visibility into the completion phase. The complexity is moderate and well-contained to completion phase logic.

**Technical Approach**:
- Kill all implementation sandboxes immediately when entering completion phase
- Extend `OrchestratorDatabaseEventType` with completion phase event types
- Create fresh review sandbox after cleanup
- Use regex to strip ANSI escape sequences from output before UI rendering

**Architecture Changes**:
- No fundamental architecture changes, but completion phase logic becomes cleaner and more explicit
- Event-emitter will have new event types but same underlying structure
- Sandbox lifecycle becomes clearer: implementation → cleanup → review

**Migration Strategy**:
- No data migration needed
- Only affects new orchestrator runs
- Completion phase will behave differently but not break existing data

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/orchestrator.ts` - Modify completion phase logic (lines 1531-1700)
- `.ai/alpha/scripts/lib/event-emitter.ts` - Extend event types (lines 21-31)
- `.ai/alpha/scripts/lib/sandbox.ts` - Add sandbox destruction helper (lines 565-615)
- `.ai/alpha/scripts/ui/components/SandboxColumn.tsx` - Strip ANSI from output (lines 291-299)

### New Files

No new files needed. All changes are to existing files.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Extend Event-Emitter Types

Add completion phase event types to the event-emitter system.

- Read `.ai/alpha/scripts/lib/event-emitter.ts` to understand current event type structure
- Add new event types to `OrchestratorDatabaseEventType` enum:
  - `completion_phase_start`
  - `sandbox_killing`
  - `review_sandbox_creating`
  - `dev_server_starting`
  - `dev_server_ready`
  - `dev_server_failed`
- Verify types are exported properly
- Add JSDoc comments explaining each event type

**Why this step first**: Event types must exist before emitting them in the orchestrator.

#### Step 2: Update Orchestrator Completion Phase Logic

Rewrite the completion phase in orchestrator.ts to implement the new lifecycle.

- Read `.ai/alpha/scripts/lib/orchestrator.ts` (lines 1531-1700) to understand current implementation
- Replace the logic that keeps sbx-a alive with logic that kills all sandboxes:
  - Emit `completion_phase_start` event
  - Loop through implementation sandboxes and emit `sandbox_killing` event for each
  - Kill all implementation sandboxes (sbx-a, sbx-b, sbx-c)
  - Emit `review_sandbox_creating` event
  - Create fresh review sandbox (don't reuse old one)
- Add error handling for sandbox destruction
- Emit `dev_server_starting` event before starting dev server
- Emit `dev_server_ready` or `dev_server_failed` based on outcome
- Update vs code URL to point to new review sandbox only

**Why this step second**: Build on the event types created in Step 1.

#### Step 3: Add Sandbox Destruction Helper

Add a reusable helper function for destroying sandboxes.

- Read `.ai/alpha/scripts/lib/sandbox.ts` to understand sandbox management patterns
- Add a `destroySandbox()` function that:
  - Takes sandbox ID and client as parameters
  - Handles errors gracefully (non-blocking)
  - Returns success/failure status
- Use this helper in the orchestrator completion phase

**Why this step third**: Extracted function is used in Step 2 logic, so helpers should be ready.

#### Step 4: Fix UI ANSI Code Truncation

Strip ANSI escape sequences from output before rendering in UI.

- Read `.ai/alpha/scripts/ui/components/SandboxColumn.tsx` (lines 291-299) to see current output rendering
- Before passing `recentOutput` to the truncate function, strip ANSI codes using regex or library:
  - Option A: Use regex pattern `/\x1b\[[0-9;]*m/g` to remove ANSI codes
  - Option B: Import a library like `strip-ansi` (check if already available)
- Apply stripping to each output line in the `recentOutput` array
- Test that output displays correctly without escape sequences

**Why this step fourth**: UI fix is independent and can be done last.

#### Step 5: Add Tests & Validation

Add tests to prevent regression of completion phase issues.

- Add unit tests for:
  - Completion phase event emission (all 6 event types)
  - Sandbox destruction logic
  - ANSI code stripping
- Add integration test for complete completion phase flow
- Verify no regressions in other orchestrator phases
- Run the debug spec S0000 to verify fix works end-to-end

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Event emission for `completion_phase_start`
- ✅ Event emission for each sandbox destruction
- ✅ Event emission for review sandbox creation
- ✅ Event emission for dev server startup/ready/failed states
- ✅ ANSI code stripping from output strings
- ✅ Sandbox destruction error handling
- ✅ Sandbox destruction with various error conditions

**Test files**:
- `.ai/alpha/scripts/__tests__/event-emitter.spec.ts` - Event type tests
- `.ai/alpha/scripts/__tests__/orchestrator-completion.spec.ts` - Completion phase tests
- `.ai/alpha/scripts/__tests__/sandbox.spec.ts` - Sandbox destruction tests

### Integration Tests

- Test complete completion phase with all sandboxes and events
- Verify dev server starts on review sandbox
- Verify all implementation sandboxes are killed
- Verify events appear in UI event log
- Verify output displays without ANSI artifacts

**Test files**:
- `.ai/alpha/scripts/__tests__/orchestrator-completion-integration.spec.ts`

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run debug spec with S0000: `tsx .ai/alpha/scripts/spec-orchestrator.ts 0 --ui`
- [ ] Wait for all tasks to complete
- [ ] Verify "completion phase start" event appears in Recent Events
- [ ] Verify "sandbox killing" events appear for sbx-a, sbx-b, sbx-c
- [ ] Verify "review sandbox creating" event appears
- [ ] Verify "dev server starting" event appears
- [ ] Verify "dev server ready" event appears (not "failed")
- [ ] Verify dev server is accessible on review sandbox
- [ ] Verify sbx-a, sbx-b, sbx-c are gone (killed)
- [ ] Verify review sandbox is the only remaining sandbox
- [ ] Verify UI displays sandbox output without truncated escape sequences
- [ ] Verify progress shows 100% with proper completion
- [ ] Check that no errors in browser console
- [ ] Test manual VS Code navigation via review sandbox URL

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Sandbox destruction timing**: If sandboxes are destroyed too quickly, dev server startup might fail
   - **Likelihood**: low
   - **Impact**: high
   - **Mitigation**: Add proper async/await for sandbox destruction, verify completion before moving forward

2. **Event emission overhead**: Emitting 6 events per run might cause performance issues
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: Events are lightweight database operations, shouldn't impact performance

3. **ANSI stripping regex**: Complex regex might miss some ANSI sequences or strip legitimate content
   - **Likelihood**: low
   - **Impact**: medium
   - **Mitigation**: Use well-tested regex pattern, test with various output types

4. **Breaking change for existing review sandboxes**: Creating fresh sandbox instead of reusing old one
   - **Likelihood**: medium
   - **Impact**: low
   - **Mitigation**: This is the intended behavior - not a regression but an improvement

**Rollback Plan**:

If completion phase breaks critically:
1. Revert changes to orchestrator.ts completion phase logic
2. Keep event-emitter type changes (they're non-breaking additions)
3. Falls back to original behavior of reusing sbx-a
4. Dev server might still fail to start, but at least cleanup isn't broken

**Monitoring** (if needed):
- Monitor dev server startup success rate in orchestrator
- Watch for sandbox destruction errors in logs
- Track event emission counts in database

## Performance Impact

**Expected Impact**: minimal

The changes add minimal performance overhead:
- Event emission is a fast database operation
- Sandbox destruction happens after tasks complete
- ANSI stripping is a simple regex operation

**Performance Testing**:
- Measure completion phase duration before and after fix
- Verify no impact on task execution phase
- Test with various sandbox counts

## Security Considerations

No security implications.

**Security Impact**: none

## Validation Commands

### Before Fix (Bugs Should Reproduce)

```bash
# Run debug spec to reproduce issues
tsx .ai/alpha/scripts/spec-orchestrator.ts 0 --ui

# Expected issues:
# 1. Dev server shows "(failed to start)"
# 2. Recent Events log is empty during completion
# 3. sbx-a remains running while sbx-b/sbx-c killed
# 4. UI output shows "u..." truncation in sandbox columns
```

**Expected Result**: All four issues should be visible.

### After Fix (Bugs Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run unit tests for orchestrator
pnpm --filter .ai test

# Manual verification
tsx .ai/alpha/scripts/spec-orchestrator.ts 0 --ui

# Expected results:
# 1. Dev server shows "(ready)" or actual status
# 2. Recent Events log shows completion phase events
# 3. Only review sandbox remains after completion
# 4. UI output displays without truncation
```

**Expected Result**: All commands succeed, all four issues resolved, zero regressions.

### Regression Prevention

```bash
# Run full orchestrator test suite if it exists
pnpm --filter .ai test:orchestrator

# Verify debug spec still works
tsx .ai/alpha/scripts/spec-orchestrator.ts 0 --ui --skip-to-completion

# Check that task execution phase is unaffected
tsx .ai/alpha/scripts/spec-orchestrator.ts 0 --ui
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**.

Optional: Consider `strip-ansi` library for ANSI stripping if regex becomes too complex:
```bash
pnpm add strip-ansi
```

But this should not be necessary - a simple regex should suffice.

## Database Changes

**No database changes required**.

The new event types are added to the enum only - no schema migrations needed.

## Deployment Considerations

**Deployment Risk**: low

No special deployment steps needed.

**Feature flags needed**: no

**Backwards compatibility**: maintained

The changes only affect new orchestrator runs. Existing data and completed runs are unaffected.

## Success Criteria

The fix is complete when:
- [ ] All four issues from diagnosis are resolved
- [ ] All validation commands pass
- [ ] Dev server starts successfully in completion phase
- [ ] Events are emitted for all completion phase transitions
- [ ] All implementation sandboxes are killed
- [ ] Fresh review sandbox is created for dev server
- [ ] UI displays output without ANSI truncation
- [ ] No regressions in other orchestrator phases
- [ ] All tests pass (unit, integration, manual)
- [ ] Code review approved (if applicable)
- [ ] Zero errors in orchestrator logs

## Notes

This fix addresses all four issues comprehensively. The changes are localized to the completion phase and event system, with minimal impact on other areas. The ANSI stripping fix is particularly important for UX as users can now see full output without truncation artifacts.

The decision to kill all implementation sandboxes (rather than keep sbx-a) follows the diagnosis recommendation and is the right approach for resource management. The fresh review sandbox will have clean resources and won't suffer from accumulated pressure.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1726*
