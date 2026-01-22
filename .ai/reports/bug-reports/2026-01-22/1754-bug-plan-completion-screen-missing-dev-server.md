# Bug Fix: Alpha UI Completion Screen Missing Dev Server URL and Progress Events

**Related Diagnosis**: #1753
**Severity**: high
**Bug Type**: race condition
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Two-phase manifest save creates race condition where UI shows completion before review sandbox operations complete
- **Fix Approach**: Add intermediate "completing" status and display completion phase events on UI
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

After implementing bug fixes #1746 (two-phase save) and #1747 (UI delay), the Alpha workflow completion screen exhibits a race condition:

1. Phase 1 save writes `status: "completed"` with empty `reviewUrls`
2. UI immediately transitions to CompletionUI (no dev server URL)
3. Phase 2 save (with populated `reviewUrls`) happens 2-10+ minutes later
4. User sees completion screen without:
   - Dev server URL for testing
   - VS Code URL for code review
   - Any indication that sandbox operations are running

The root cause is that Phase 1 transitions the UI to a fully "completed" state before Phase 2 (review sandbox/dev server setup) has completed.

### Solution Approaches Considered

#### Option 1: Intermediate "completing" Status ⭐ RECOMMENDED

**Description**: Add a new `"completing"` status between `in_progress` and `completed`. Phase 1 save sets status to `"completing"`, and only when Phase 2 completes successfully does it transition to `"completed"`. Display completion phase events during this intermediate state.

**Pros**:
- Clear user communication: "Setting up review environment..."
- Prevents premature UI transition
- Naturally fits the two-phase architecture
- Can display all completion phase events
- Graceful handling if review sandbox fails (stay in "completing" or show error)

**Cons**:
- Requires adding a new status type everywhere (types, orchestrator, UI)
- More UI states to manage
- Slightly more complex orchestrator logic

**Risk Assessment**: Low - This is an additive change that doesn't affect existing code paths

**Complexity**: Moderate - Affects types, orchestrator, and UI state management

#### Option 2: Continue Polling After Completion

**Description**: Keep the current two-phase architecture but enhance the UI to continue polling `overall-progress.json` even after seeing `status: "completed"`. Display dev server URL when it appears, show loading state while waiting.

**Pros**:
- Minimal orchestrator changes
- Works within existing architecture
- Could show a "Loading dev server..." message

**Cons**:
- User sees "Completed" but then waits for dev server
- Confusing UX (completed but still loading?)
- Hard to tell if it's actually done or still working
- No visibility into what's happening during review sandbox creation

**Why Not Chosen**: Poor UX - claiming "completed" while still loading creates confusion and doesn't give users feedback about what's happening.

#### Option 3: Delay Phase 1 Save Until Phase 2 Completes

**Description**: Remove the two-phase save entirely. Only write `status: "completed"` after Phase 2 (review sandbox and dev server) completes.

**Pros**:
- Simplest conceptually - one completion state
- No race condition
- Avoids frozen UI problem (was the motivation for #1746)

**Cons**:
- Reintroduces the frozen UI problem from #1720 that #1746 fixed
- Users see no progress for 2-10+ minutes during orchestrator execution
- Review sandbox creation is blocking, slowing feature execution
- Goes against the motivation for the two-phase save

**Why Not Chosen**: Would reintroduce the frozen UI bug that two-phase save was designed to fix.

### Selected Solution: Intermediate "completing" Status

**Justification**:
This approach provides:
1. Clear user feedback during review sandbox setup (5-10 minute wait)
2. Visibility into what's happening (displays completion phase events)
3. Graceful handling of review sandbox failures
4. Maintains the benefits of two-phase save (no frozen UI)
5. Minimal risk - additive changes only

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/ui/types.ts` - Add "completing" to OverallProgress status enum
- `.ai/alpha/scripts/lib/manifest.ts` - Document OverallProgress.status values
- `.ai/alpha/scripts/lib/orchestrator.ts` - Set status to "completing" in Phase 1, only transition to "completed" when reviewUrls is populated
- `.ai/alpha/scripts/ui/components/OrchestratorUI.tsx` - Create CompletingUI component to display progress events
- `.ai/alpha/scripts/ui/index.tsx` - Handle "completing" state in main UI router

### New Files

None required - all changes are to existing files.

### Step-by-Step Tasks

#### Step 1: Add "completing" status to types

Update `.ai/alpha/scripts/ui/types.ts` to add "completing" as a valid overall progress status:

- Add `"completing"` to the OverallProgress.status union type
- Ensure it's recognized as a valid state throughout the system

**Why this step first**: The type definition is foundational - all other changes depend on this being defined.

#### Step 2: Update orchestrator logic for two-phase transitions

Modify `.ai/alpha/scripts/lib/orchestrator.ts` (lines 1517-1720):

- Phase 1 save (line ~1534): Set `manifest.overallProgress.status = "completing"` instead of "completed"
- Phase 2 completion (line ~1716): Only set `manifest.overallProgress.status = "completed"` when `reviewUrls` is populated AND non-empty
- Handle edge case: If review sandbox fails and reviewUrls remains empty, set status to a failure state or keep in "completing" with error message

**Why this step now**: Orchestrator changes are the core business logic that drives the UI state.

#### Step 3: Create CompletingUI component

Add new component to `.ai/alpha/scripts/ui/components/OrchestratorUI.tsx`:

- Create `CompletingUI` component that displays:
  - "Setting up review environment..." header
  - List of completion phase events (review_sandbox_creating, dev_server_starting, dev_server_ready, etc.)
  - Each event with timestamp and status (pending/in-progress/completed)
  - Dev server URL and VS Code URL when they become available
  - Loading spinner while waiting for sandbox operations to complete

- Show recent events prominently (last 5-10 events)
- Auto-scroll to show latest events

**Why this step after orchestrator**: The UI needs to display data that the orchestrator provides.

#### Step 4: Update UI router to handle "completing" state

Modify `.ai/alpha/scripts/ui/index.tsx` (lines 451-461):

- Add new case for `status === "completing"`:
  ```typescript
  case "completing":
    return (
      <CompletingUI
        specId={specId}
        progress={enhancedState.overallProgress}
        events={enhancedState.events}
        elapsed={getElapsedTime()}
      />
    );
  ```
- Ensure "completing" state shows before "completed"

**Why this step after CompletingUI**: The UI router references the CompletingUI component.

#### Step 5: Add tests and validation

Add tests to verify:
- Orchestrator sets status to "completing" in Phase 1
- Orchestrator only transitions to "completed" when reviewUrls is populated
- UI shows CompletingUI when status is "completing"
- Events are displayed on CompletingUI
- Dev server URL appears when available
- Manual verification that the workflow behaves correctly end-to-end

**Why this step last**: Tests validate all the changes work together correctly.

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Orchestrator Phase 1 sets status to "completing"
- ✅ Orchestrator Phase 2 transitions from "completing" to "completed" only when reviewUrls is populated
- ✅ CompletingUI renders when status is "completing"
- ✅ CompletingUI displays completion phase events
- ✅ CompletingUI shows dev server URL when available

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/orchestrator.test.ts` - Orchestrator Phase 1/Phase 2 transitions
- `.ai/alpha/scripts/ui/components/__tests__/OrchestratorUI.test.tsx` - CompletingUI rendering and event display

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run spec orchestrator: `pnpm ts-node .ai/alpha/scripts/spec-orchestrator.ts S0000 --ui`
- [ ] Verify UI shows "completing" state after feature implementations finish
- [ ] Verify completion phase events appear on screen (review_sandbox_creating, dev_server_starting, etc.)
- [ ] Verify dev server URL appears when ready
- [ ] Verify VS Code URL appears when ready
- [ ] Let it run to full completion and verify "completed" state appears
- [ ] Test with review sandbox failure scenario (if possible) and verify graceful error handling

## Risk Assessment

**Overall Risk Level**: Medium

**Potential Risks**:

1. **Breaking two-phase save benefits**: Risk that adding "completing" state reintroduces frozen UI from #1720
   - **Likelihood**: Low (two-phase save still functions, we just add intermediate status)
   - **Impact**: High (frozen UI is a major UX problem)
   - **Mitigation**: Verify Phase 1 save still completes quickly and shows UI immediately (just in different state)

2. **Orchestrator timing issue**: Risk that Phase 2 completes before UI recognizes "completing" status
   - **Likelihood**: Low (Phase 2 operations take 2-10 minutes)
   - **Impact**: Medium (UI jumps directly to completed, back to original bug)
   - **Mitigation**: Test with S0000 run, verify status progression in manifest files

3. **Event polling lag**: Risk that completion events don't display in real-time
   - **Likelihood**: Medium (depends on file write frequency)
   - **Impact**: Low (UX is just less responsive, not broken)
   - **Mitigation**: Adjust polling frequency if needed, ensure events are written frequently

4. **Edge case: Empty reviewUrls**: Risk that review sandbox fails and reviewUrls stays empty
   - **Likelihood**: Medium (review sandbox can fail for various reasons)
   - **Impact**: Medium (UI stuck in "completing" state indefinitely)
   - **Mitigation**: Add timeout or explicit failure status after 30 minutes of no progress

**Rollback Plan**:

If this fix causes issues in production:
1. Remove the "completing" status handling from UI (revert to "completed")
2. Revert orchestrator Phase 1 to set status to "completed" instead of "completing"
3. UI will show original behavior (premature completion screen)
4. Investigate root cause and try alternative approach (Option 2: continue polling)

## Performance Impact

**Expected Impact**: Minimal

- No additional database queries or API calls
- Event display in CompletingUI is O(n) where n = number of events (typically 5-10)
- Polling frequency unchanged

## Security Considerations

**Security Impact**: None

No changes to authentication, authorization, or data handling. All data displayed is already part of the manifest system.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run orchestrator with S0000 spec
pnpm ts-node .ai/alpha/scripts/spec-orchestrator.ts S0000 --ui

# Expected: UI shows "Completed" screen immediately after features finish
# (without dev server URL, before Phase 2 completes)
```

**Expected Result**:
- Completion screen appears with `reviewUrls` empty/missing
- 2-10 minutes later, dev server URL appears (if visible)

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run orchestrator with S0000 spec
pnpm ts-node .ai/alpha/scripts/spec-orchestrator.ts S0000 --ui

# Verify the fix:
# - UI shows "completing" state after features finish
# - Events display: review_sandbox_creating, dev_server_starting, etc.
# - Dev server URL appears when ready
# - UI transitions to "completed" when reviewUrls is populated
```

**Expected Result**: All commands succeed, bug is resolved, zero regressions.

- UI shows "Setting up review environment..." during completion phase
- Events stream in as they occur
- Dev server URL becomes available (typically 2-3 minutes after start)
- UI gracefully transitions to "completed" when ready

### Regression Prevention

```bash
# Verify no broken builds or type errors
pnpm typecheck

# Run any existing orchestrator tests
pnpm test:unit .ai/alpha/scripts/lib/__tests__/orchestrator.test.ts

# Run any existing UI tests
pnpm test:unit .ai/alpha/scripts/ui/components/__tests__/OrchestratorUI.test.tsx

# Manual smoke test: Run a full workflow
pnpm ts-node .ai/alpha/scripts/spec-orchestrator.ts S0001 --ui
```

## Dependencies

**No new dependencies required** - All changes use existing libraries and patterns.

## Database Changes

**No database changes required** - This is a UI/orchestrator logic fix, no schema changes needed.

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**: None - this is a local orchestrator tool used in dev environments

**Feature flags needed**: No

**Backwards compatibility**: Maintained - the "completing" status is new and doesn't affect existing code paths

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Bug no longer reproduces (UI shows "completing" state with events)
- [ ] Dev server URL appears on completion screen when ready
- [ ] All tests pass (unit, manual)
- [ ] Zero regressions detected (UI still works for non-completing scenarios)
- [ ] Edge case handled: Review sandbox failure doesn't freeze UI

## Notes

### Related Issues
- #1746 - Two-phase manifest save (created this race condition)
- #1747 - UI delay fix (relies on Phase 1 save)
- #1720 - Frozen UI bug (original motivation for two-phase save)

### Architecture Context
The "completing" status fits naturally into the existing orchestrator architecture. The orchestrator already maintains fine-grained status and event information in `overall-progress.json`. This fix simply makes that information visible to the user during the critical 5-10 minute review sandbox setup phase.

### Key Design Decision: Why Not Show Estimated Time?
While tempting to add an estimated time remaining during "completing", this would be misleading since review sandbox creation time varies (2-10 minutes depending on E2B API load). Better to show events + a simple loading indicator.

---
*Bug Fix Plan for issue #1753*
*Generated by Bug Fix Planning Assistant*
