# Bug Fix: Orchestrator UI shows wrong progress totals

**Related Diagnosis**: #1508 (REQUIRED)
**Severity**: medium
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `overall-progress.json` written AFTER UI starts, causing UI to fall back to hardcoded default values (0/1) instead of manifest totals
- **Fix Approach**: Write manifest progress file BEFORE starting the UI
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

When the Alpha Orchestrator starts, the UI displays incorrect progress totals:
- Shows "0/1" for initiatives (should show "1/1")
- Shows "0/0" or incorrect values for features and tasks
- Should show actual manifest values like "0/4 initiatives", "0/13 features", "0/110 tasks"

Root cause: The orchestrator calls `startOrchestratorUI()` at line 841 (before `saveManifest()` at line 1053). When the UI's progress poller starts reading files, `overall-progress.json` doesn't exist yet. The `useProgressPoller` hook's `aggregateProgress()` function falls back to hardcoded values (lines 483-484 in useProgressPoller.ts):

```typescript
initiativesTotal: 1, // Hardcoded!
initiativesCompleted: status === "completed" ? 1 : 0,
featuresTotal: seenFeatures.size,  // 0 initially (no features seen yet)
tasksTotal: 0,  // 0 initially
```

### Solution Approaches Considered

#### Option 1: Write manifest BEFORE UI start ⭐ RECOMMENDED

**Description**: Move `saveManifest(manifest)` call to occur BEFORE `startOrchestratorUI()`.

**Pros**:
- Simplest fix - only 2-3 lines moved
- Ensures manifest totals available immediately when UI polls
- No architecture changes needed
- Guaranteed to work on first poll
- UI gets accurate totals from the start

**Cons**:
- Minor sequencing change (non-breaking)

**Risk Assessment**: low - Moving a single function call earlier in the sequence. No state dependencies.

**Complexity**: simple - Straightforward line reordering

#### Option 2: Write initial progress before UI start

**Description**: Create an initial `overall-progress.json` file with manifest totals before starting UI.

**Pros**:
- Doesn't require changing the orchestration sequence
- Makes manifest state explicit

**Cons**:
- More verbose (extra function call needed)
- Duplicates logic that already exists in `saveManifest()`
- Creates two write operations instead of one
- Less elegant solution

**Why Not Chosen**: Option 1 is simpler and cleaner.

#### Option 3: Improve UI fallback with better defaults

**Description**: Update `aggregateProgress()` to use manifest totals as defaults.

**Pros**:
- More defensive UI code

**Cons**:
- Doesn't solve the core issue (manifest state not available)
- Adds complexity to polling code
- Requires passing manifest to UI (architectural coupling)
- UI shouldn't need to know about manifest structure

**Why Not Chosen**: Doesn't address root cause. Better to provide data to UI rather than changing UI's fallbacks.

### Selected Solution: Write manifest BEFORE UI start

**Justification**: This is the cleanest solution. The manifest state must be persisted before the UI starts polling for it. The sequence should be:

1. Create manifest from decomposed spec
2. **Write manifest state to disk** (overall-progress.json)
3. Start UI (now polling will find the file)
4. Main orchestration logic

The manifest is fully constructed at line 828 before any UI operations, so there's no ordering dependency issue. Moving the `saveManifest()` call is safe and correct.

**Technical Approach**:
- Identify the location where manifest is fully constructed and ready
- Move `saveManifest(manifest)` to just before `startOrchestratorUI()`
- Ensure no manifest mutations happen between save and UI start that would cause drift
- No changes needed to UI code

**Architecture Changes** (if any):
- None - this is correcting the sequence to match intent

**Migration Strategy** (if needed):
- None - this is a fix to initialization order

## Implementation Plan

### Affected Files

List files that need modification:
- `.ai/alpha/scripts/lib/orchestrator.ts` - Move `saveManifest()` call earlier in sequence (before UI start)

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Locate the manifest save call and understand context

<describe what this step accomplishes>

- Read orchestrator.ts around line 1053 to see current `saveManifest()` call
- Verify manifest is fully constructed and ready to save at line 828+
- Confirm there are no manifest mutations after initial construction but before UI start
- Identify correct insertion point (after manifest construction, before UI start)

**Why this step first**: Confirms we understand the current flow and can safely move the call

#### Step 2: Move saveManifest() call before UI start

<describe what this step accomplishes>

Move the `saveManifest(manifest)` call from line 1053 to just before `startOrchestratorUI()` (around line 840-841):

- Find the `if (options.ui && !options.dryRun)` block at line 841
- Add `saveManifest(manifest);` before `archiveAndClearPreviousRun(runId);`
- Ensure proper sequencing:
  1. Archive/clear old files (already happens at line 843)
  2. Generate sandbox labels
  3. **Save manifest** (NEW - before UI start)
  4. Start UI with fresh progress files ready to read

**Why this step**: Ensures manifest is persisted before UI begins polling

#### Step 3: Verify manifest isn't mutated between save and UI start

<describe what this step accomplishes>

- Check code between new save location and UI start (lines 840-877)
- Confirm no mutations to manifest that would cause drift between saved state and UI display
- Document any mutations that occur (should be none at this point)

**Why this step**: Ensures saved state matches what UI will display

#### Step 4: Clean up - Remove duplicate saveManifest() call

<describe what this step accomplishes>

- Locate the second `saveManifest(manifest)` at line 1072
- This call happens AFTER manifest status is updated (line 1069-1071)
- Remove or keep this call? Need to check if status change is important
- If status update needs persistence, keep only the line 1072 call for status change
- If not needed, can remove to avoid duplicate saves

**Context**: The manifest has status changes later in the flow (line 1069). The second save at line 1072 captures those changes. We should:
- Keep the new save before UI (provides initial state)
- Keep the save at line 1072 (captures status change)
- Both are needed and don't duplicate

**Why this step**: Ensures clean flow without unnecessary duplication

#### Step 5: Run type check and verify compilation

<describe what this step accomplishes>

- Run TypeScript type checker to ensure no syntax errors
- Verify no import/export issues
- Run linter on modified file
- Run formatter on modified file

#### Step 6: Verify the fix with manual test

<describe what this step accomplishes>

- Run the orchestrator with a known spec that has multiple features/tasks
- Observe that UI shows correct totals immediately on startup
- Verify "Waiting for work..." doesn't appear (or appears only for unused sandboxes)
- Check that progress numbers match manifest totals

## Testing Strategy

### Unit Tests

No new unit tests needed - this is a sequencing fix in the main orchestrator loop. Existing tests cover:
- ✅ Manifest creation and structure
- ✅ saveManifest() file writing
- ✅ UI initialization
- ✅ useProgressPoller() file reading

### Integration Tests

Verify the complete flow:
- ✅ Manifest created with correct totals
- ✅ Manifest file written before UI starts
- ✅ UI reads file and displays correct totals
- ✅ No race conditions with file I/O

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start orchestrator with a multi-feature spec (e.g., 4 initiatives, 13 features, 110 tasks)
- [ ] Verify UI displays correct totals immediately on startup
- [ ] Verify UI does NOT show "0/1" initially
- [ ] Verify "Waiting for work..." only appears for unused sandboxes (not at top level)
- [ ] Watch the progress update as sandboxes start working
- [ ] Verify no console errors related to file I/O
- [ ] Check that initial progress display matches manifest.metadata totals

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **State Drift**: Manifest file saved, then mutated before UI reads it
   - **Likelihood**: low - manifest is constructed once and not mutated at this point in the flow
   - **Impact**: low - if it happens, UI would show slightly stale data (recovers after next poll)
   - **Mitigation**: Code review to confirm no mutations between save and UI start

2. **File I/O Timing**: saveManifest() fails or is slow, blocking UI start
   - **Likelihood**: low - saveManifest() is synchronous and file I/O on local filesystem is fast
   - **Impact**: low - UI has ~15s poll timeout, can recover from missing file
   - **Mitigation**: Existing error handling in UI's file reader

3. **Breaking Change**: Existing code depends on manifest NOT being saved before UI start
   - **Likelihood**: very low - no code should depend on this detail
   - **Impact**: low - would only affect initialization sequence
   - **Mitigation**: No known dependencies

**Rollback Plan**:

If this fix causes unexpected issues:
1. Revert the move of `saveManifest()` call back to line 1053
2. UI will handle missing file and fall back to aggregateProgress() defaults
3. This returns to the current (buggy) behavior but doesn't break anything

**Monitoring** (if needed):
- None - this is a straightforward sequencing fix

## Performance Impact

**Expected Impact**: none

No performance change. Moving a single synchronous file write operation earlier in the sequence doesn't affect performance. File is written once at both locations.

## Security Considerations

No security implications. The manifest file is already written to disk in both cases. Moving the write earlier doesn't expose any new information or vulnerabilities.

**Security Impact**: none

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start orchestrator with a spec that has multiple features
# Look for "0/1" in UI display instead of correct totals
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Expected Result: UI shows "0/1" for initiatives, "0/0" for features, "0/0" for tasks
#                   (instead of "0/4", "0/13", "0/110" from manifest)
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Manual verification
# Run orchestrator with multi-feature spec
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Expected Result:
# ✅ UI shows correct manifest totals immediately (e.g., "0/4 initiatives", "0/13 features", "0/110 tasks")
# ✅ No "0/1" display
# ✅ Progress updates as work happens
```

### Regression Prevention

```bash
# Ensure manifest structure is preserved
# Ensure file I/O doesn't fail
# Ensure UI polling works with pre-written manifest file
# These are covered by existing tests, no new regression tests needed
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required** - uses existing saveManifest() function

### Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

This is a local tooling fix. No deployment needed - only affects local orchestrator runs.

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: maintained - existing saved manifests will still be read correctly

## Success Criteria

The fix is complete when:
- [ ] orchestrator.ts compiles without errors
- [ ] saveManifest() is called before startOrchestratorUI()
- [ ] UI displays correct manifest totals on startup
- [ ] Manual testing shows "0/1" no longer appears
- [ ] Code review confirms no manifest mutations between save and UI start
- [ ] No regressions in existing tests

## Notes

This is a simple sequencing fix - moving a single function call earlier in the initialization process. The manifest state must be persisted to disk before the UI begins polling for it. The fix is safe because:

1. Manifest is fully constructed at this point (no early mutations)
2. saveManifest() is idempotent - calling it multiple times is safe
3. UI already handles missing files gracefully (falls back to aggregateProgress)
4. No architectural changes or new dependencies

The bug likely exists because the code was originally written with UI starting after all manifest saves, but was refactored to start UI earlier without updating the saveManifest() call sequence.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1508*
