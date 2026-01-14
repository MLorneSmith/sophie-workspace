# Bug Fix: Alpha UI Visibility Issues (Missing Events, Flickering, Task Undefined)

**Related Diagnosis**: #1452
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Early return in event generation, unpatched console output, missing null checks for task ID
- **Fix Approach**: Remove early return to generate initial events, enable console patching, add task ID validation
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Autonomous Coding workflow has three UI visibility issues: (1) Recent Events box shows "No events yet..." on startup because `generateEvents()` returns early with only 1 event, (2) console output flashes below the UI because `patchConsole: false` allows stderr to escape, and (3) "Task undefined started" appears when `current_task.id` is undefined but `current_task` exists. These are distinct UX issues with simple fixes.

For full details, see diagnosis issue #1452.

**Note**: This fix plan addresses Issues 2, 3, and 5 from the diagnosis. Issue 1 (retry display) is not a bug and requires no fix. Issue 4 (long startup times) is tracked separately in #1448 as it requires OAuth/auth changes.

### Solution Approaches Considered

#### Option 1: Comprehensive Event Generation + Console Patching + Null Checks ⭐ RECOMMENDED

**Description**: Fix all three issues with targeted, minimal changes:
1. **Missing Events**: Remove early return in `generateEvents()` and generate events for each sandbox in initial state
2. **UI Flickering**: Change `patchConsole: false` to `patchConsole: true` in Ink render options
3. **Task Undefined**: Add null check for `sandbox.currentTask.id` before generating task_start event

**Pros**:
- Addresses all actionable issues in one cohesive fix
- Minimal code changes (3 small edits in 2 files)
- Low risk - each change is independent and safe
- Improves UX immediately with visible progress during startup
- No architectural changes required

**Cons**:
- None significant - all changes are surgical and low-risk

**Risk Assessment**: low - These are defensive programming changes that only improve behavior

**Complexity**: simple - Three straightforward code changes with no dependencies

#### Option 2: Event Buffering with Delayed Rendering

**Description**: Instead of fixing event generation, buffer events during startup and render them after a delay.

**Pros**:
- Could provide smoother UI transition
- No changes to event generation logic

**Cons**:
- More complex implementation (event buffer, timing logic)
- Doesn't fix the root cause (early return)
- Adds unnecessary complexity for minimal benefit
- Still leaves task undefined issue unfixed

**Why Not Chosen**: Over-engineering. The root cause is simple (early return), so fix it directly rather than working around it.

#### Option 3: Suppress All Initial Events

**Description**: Don't show any events until after initial poll completes.

**Why Not Chosen**: Makes the problem worse - users would have even less visibility during startup. This goes against the goal of improving UX.

### Selected Solution: Comprehensive Event Generation + Console Patching + Null Checks

**Justification**: This approach directly fixes the root causes with minimal, surgical changes. Each fix is independent, low-risk, and provides immediate value. No architectural changes or complex refactoring needed. The changes follow defensive programming best practices (null checks, proper event generation, console isolation).

**Technical Approach**:
1. **Event Generation Fix**: Remove early return on line 513 and iterate through `newState.sandboxes` to generate initial events for each sandbox. This matches the pattern already used for new sandboxes (lines 521-529).
2. **Console Patching Fix**: Change single boolean value from `false` to `true` on line 315. Ink will then intercept all console output and prevent leakage.
3. **Task ID Validation**: Add `sandbox.currentTask.id` check on line 550 before the existing conditions. This prevents event generation when ID is undefined.

**Architecture Changes**: None - these are localized fixes that don't affect system design.

**Migration Strategy**: Not needed - changes are backwards compatible and don't affect data or APIs.

## Implementation Plan

### Affected Files

List files that need modification:
- `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts` - Fix event generation logic (line 503-513) and add task ID validation (line 549-553)
- `.ai/alpha/scripts/ui/index.tsx` - Enable console patching (line 315)

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Fix missing events on initial load

Modify `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts` to generate events for all sandboxes on initial state instead of returning early.

**Changes**:
- Lines 503-513: Remove early return, instead generate initial spec event PLUS events for each sandbox
- Generate "Sandbox started" events for each sandbox in `newState.sandboxes`
- Keep the "Spec started" event as the first event

**Implementation**:
```typescript
// Before (lines 503-513):
if (!previousState) {
    const firstLabel = Array.from(newState.sandboxes.keys())[0] ?? "sbx-a";
    events.push({
        id: `init-${now.getTime()}`,
        timestamp: now,
        type: "feature_start",
        sandboxLabel: firstLabel,
        message: `Spec #${newState.overallProgress.specId} started`,
    });
    return events;  // EARLY RETURN - removes visibility
}

// After:
if (!previousState) {
    // Generate spec started event
    const firstLabel = Array.from(newState.sandboxes.keys())[0] ?? "sbx-a";
    events.push({
        id: `init-${now.getTime()}`,
        timestamp: now,
        type: "feature_start",
        sandboxLabel: firstLabel,
        message: `Spec #${newState.overallProgress.specId} started`,
    });

    // Generate sandbox started events for each sandbox
    for (const [label, sandbox] of newState.sandboxes) {
        events.push({
            id: `sandbox-init-${label}-${now.getTime()}`,
            timestamp: now,
            type: "feature_start",
            sandboxLabel: label,
            message: `Sandbox ${label} initializing`,
        });
    }
    // NO EARLY RETURN - continue to check for features/tasks
}
```

**Why this step first**: This establishes proper event generation foundation. Without this, users have no visibility into what's happening during startup.

#### Step 2: Add task ID validation

Modify `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts` line 549-553 to validate task ID exists before generating task_start event.

**Changes**:
- Add `sandbox.currentTask.id &&` check after `sandbox.currentTask &&` on line 550
- Ensures `id` is defined (not undefined, null, or empty string)

**Implementation**:
```typescript
// Before (lines 549-553):
if (
    sandbox.currentTask &&
    (!prevSandbox.currentTask ||
        sandbox.currentTask.id !== prevSandbox.currentTask.id)
) {

// After:
if (
    sandbox.currentTask &&
    sandbox.currentTask.id &&  // Add ID validation
    (!prevSandbox.currentTask ||
        sandbox.currentTask.id !== prevSandbox.currentTask.id)
) {
```

**Why this step second**: Builds on event generation fix. Now that events are being generated, we need to ensure they're valid. This prevents "Task undefined started" messages.

#### Step 3: Enable console patching

Modify `.ai/alpha/scripts/ui/index.tsx` line 315 to enable console patching.

**Changes**:
- Change `patchConsole: false` to `patchConsole: true`

**Implementation**:
```typescript
// Before (line 315):
this.instance = render(<OrchestratorApp config={this.config} />, {
    patchConsole: false,
});

// After:
this.instance = render(<OrchestratorApp config={this.config} />, {
    patchConsole: true,  // Prevent console output from leaking below UI
});
```

**Why this step third**: UI rendering fix. Once events and validation are correct, ensure the UI displays cleanly without flickering text.

#### Step 4: Add regression tests

Add unit tests to prevent these issues from recurring.

**Tests to add**:
- Test that `generateEvents()` produces events for each sandbox on initial state
- Test that `generateEvents()` handles undefined task IDs gracefully
- Test that console patching is enabled in production config

**Test files**:
- `.ai/alpha/scripts/ui/hooks/useProgressPoller.spec.ts` - Event generation tests
- `.ai/alpha/scripts/ui/index.spec.ts` - UI manager configuration tests

#### Step 5: Validation

Run all validation commands to ensure no regressions.

**Commands**:
```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format check
pnpm format

# Build to ensure no compilation errors
pnpm build

# Manual verification
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362
# - Verify Recent Events box populates immediately with sandbox events
# - Verify no text flashes below UI
# - Verify no "Task undefined" messages appear
```

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `generateEvents()` returns events for all sandboxes on initial state (not just 1)
- ✅ `generateEvents()` handles missing `previousState` correctly
- ✅ `generateEvents()` skips task_start event when `currentTask.id` is undefined
- ✅ `generateEvents()` generates task_start event when `currentTask.id` is defined
- ✅ Edge case: Empty sandboxes map on initial state
- ✅ Edge case: Task with undefined ID after state change
- ✅ Regression test: Initial state generates multiple events

**Test files**:
- `.ai/alpha/scripts/ui/hooks/useProgressPoller.spec.ts` - New file for event generation tests

### Integration Tests

Not required - these are isolated UI changes with no cross-system dependencies.

### E2E Tests

Not required - this is internal UI rendering logic. Manual testing is sufficient.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
- [ ] Verify Recent Events box shows "Spec #1362 started" immediately
- [ ] Verify Recent Events box shows "Sandbox sbx-a initializing", "Sandbox sbx-b initializing", "Sandbox sbx-c initializing"
- [ ] Watch for 5 minutes, verify no text flashes below Recent Events box
- [ ] Verify no "Task undefined started" messages appear in any sandbox
- [ ] Verify events continue to populate as features are assigned
- [ ] Test edge case: Kill and restart orchestrator, verify events regenerate correctly
- [ ] Check terminal for clean output (no stray console.log messages)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Console patching breaks debugging**: Enabling `patchConsole: true` intercepts console output
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: This is the intended behavior for production. During development, can temporarily set to `false`. Add comment explaining this.

2. **Too many initial events flood the UI**: Generating events for all sandboxes might overwhelm the event log
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: Event log already limits to 100 events with FIFO rotation. Three sandbox events won't cause issues. The MAX_DISPLAY_EVENTS=8 limit ensures only recent events are shown.

3. **Task ID check too strict**: Adding null check might hide legitimate events
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: The check is defensive - if ID is undefined, there's nothing meaningful to display. Events will generate once ID is available.

**Rollback Plan**:

If this fix causes issues:
1. Revert `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts` changes (git revert or restore from backup)
2. Revert `.ai/alpha/scripts/ui/index.tsx` change (single line)
3. Redeploy previous version
4. No data migration needed - these are UI-only changes

**Monitoring**:
- Monitor orchestrator logs for any new console errors after enabling console patching
- Watch for user reports of missing events (would indicate ID check is too strict)
- No production monitoring needed - this is a development/build tool

## Performance Impact

**Expected Impact**: none

The changes have negligible performance impact:
- **Event generation**: Adding 3 sandbox events on initial load is trivial (microseconds)
- **Console patching**: Ink's console patching is already optimized, enabling it has no measurable overhead
- **Task ID check**: Single boolean check has zero performance impact

**Performance Testing**: Not required - changes are UI rendering only with no computational overhead.

## Security Considerations

**Security Impact**: none

These changes affect only UI rendering and have no security implications. No data handling, no API changes, no authentication/authorization changes.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start orchestrator and observe UI
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Expected behavior (bugs present):
# - Recent Events box shows only "Spec #1362 started" (missing sandbox events)
# - Text occasionally flashes below UI
# - "Task undefined started" may appear
```

**Expected Result**: Recent Events box empty except for 1 spec event, UI flickering visible, possible task undefined messages.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Build
pnpm build

# Start orchestrator
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Expected behavior (bugs fixed):
# - Recent Events box shows "Spec started" + 3 "Sandbox initializing" events immediately
# - No text flashing below UI
# - No "Task undefined started" messages
# - Events continue populating as sandboxes progress
```

**Expected Result**: All commands succeed, Recent Events box populates immediately with 4+ events, no UI flickering, no undefined task messages.

### Regression Prevention

```bash
# Run full test suite (when tests are added)
pnpm test

# Type check to ensure no type errors introduced
pnpm typecheck

# Build to ensure no compilation errors
pnpm build

# Manual smoke test
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362
# Watch for 2 minutes to verify stable behavior
```

## Dependencies

**No new dependencies required**

All fixes use existing TypeScript/React/Ink APIs. No package installations needed.

## Database Changes

**No database changes required**

These are UI-only fixes with no database interaction.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - these are code-only changes

**Feature flags needed**: no

**Backwards compatibility**: maintained - no breaking changes, no API modifications

**Rollout strategy**: Can deploy immediately. If issues arise, single commit revert restores previous behavior.

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass (typecheck, lint, format, build)
- [ ] Manual test shows Recent Events box populates immediately with 4+ events
- [ ] No UI flickering observed during 5-minute test
- [ ] No "Task undefined started" messages appear
- [ ] Zero regressions detected in other UI features
- [ ] Code review approved (if applicable)
- [ ] Unit tests added and passing

## Notes

**Design Decision - Initial Event Generation**:
The fix generates "Sandbox initializing" events on initial load rather than "Sandbox started" because the sandboxes may not have started Claude CLI yet. "Initializing" is more accurate and sets proper expectations.

**Design Decision - Console Patching**:
Enabling `patchConsole: true` is the recommended Ink configuration for production UIs. During development, if console debugging is needed, temporarily set to `false` in the code. This is better than having flickering text in production.

**Design Decision - Task ID Validation**:
The null check is defensive programming. If `current_task` exists but `id` is undefined, there's incomplete data and nothing meaningful to display. Events will generate naturally once the ID is available on the next poll.

**Related Issues**:
- #1448: Long startup times (OAuth/API init hang) - tracked separately, not addressed by this fix
- This fix improves visibility into the startup process but doesn't change startup performance

**Future Enhancements** (not included in this fix):
- Add phase-specific events (e.g., "Loading context", "Analyzing parallelism")
- Add color-coding for event types in the UI
- Add event filtering/search functionality
- Add timestamp display for events

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1452*
