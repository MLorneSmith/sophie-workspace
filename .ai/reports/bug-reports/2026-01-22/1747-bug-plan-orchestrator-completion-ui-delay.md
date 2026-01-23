# Bug Fix: Orchestrator completion screen delayed until review sandbox operations complete

**Related Diagnosis**: #1746
**Severity**: medium
**Bug Type**: ui
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `saveManifest()` call that writes `status: "completed"` is placed AFTER all blocking completion phase operations (kill sandboxes, create review sandbox, start dev server) instead of IMMEDIATELY after setting status in memory.
- **Fix Approach**: Call `saveManifest()` immediately after setting completion status (line 1525), then proceed with blocking operations.
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

When the Alpha Orchestrator finishes all feature implementations, the UI shows "IN PROGRESS" with 100% progress for 10+ minutes instead of immediately showing the completion screen. Users must wait for all completion phase blocking operations (killing sandboxes: ~30s each, creating review sandbox: ~10 minutes, starting dev server: ~3.5 minutes) to finish before the UI updates.

The root cause is that the completion status is set in memory at line 1525 but never persisted to `overall-progress.json` (via `saveManifest()`) until line 1709—after all blocking operations complete.

For full details, see diagnosis issue #1746.

### Solution Approaches Considered

#### Option 1: Move `saveManifest()` earlier ⭐ RECOMMENDED

**Description**: Call `saveManifest()` immediately after setting the completion status in memory (line 1525) and before starting blocking operations (line 1535).

**Pros**:
- Minimal code change (3-5 lines moved)
- UI updates immediately while operations run in background
- Completion phase operations run asynchronously (don't block UI)
- Zero performance overhead
- Maintains current behavior for all async operations

**Cons**:
- Review URLs won't be available in first manifest write (need second write after review sandbox created)
- Need to update code comment to explain two-phase manifest writes

**Risk Assessment**: low
- Moving code is low-risk
- Review URLs are optional (dev server can fail and UI still shows completion)
- Code already handles `reviewUrls = []` as initial value

**Complexity**: simple - move 1 function call

#### Option 2: Save manifest without review URLs, update after

**Description**: Same as Option 1 but explicitly document the two-phase approach with initial empty `reviewUrls` array.

**Pros**:
- Clear two-phase approach
- UI updates first, review URLs added later
- Same low-risk profile

**Cons**:
- Requires saving manifest twice (minor performance cost)
- Slightly more code changes

**Why Not Chosen**: Option 1 is cleaner and already does this implicitly.

#### Option 3: Use async manifest writes (Event-based)

**Description**: Emit an event when status changes, separate event handler persists to disk asynchronously.

**Pros**:
- Decouples status updates from I/O
- More scalable for future features

**Cons**:
- Over-engineered for this fix
- Requires event system changes
- Higher complexity and risk

**Why Not Chosen**: Current codebase doesn't have async event patterns; would be over-engineering.

### Selected Solution: Move `saveManifest()` earlier

**Justification**: This is the simplest, lowest-risk fix that directly addresses the root cause. The orchestrator is a sequential, blocking process, so moving one function call earlier is a surgical fix with zero architectural implications. The two-phase manifest writes (initial with empty `reviewUrls`, updated after review sandbox creation) are already implicit in the current code and don't require additional handling.

**Technical Approach**:
1. Move `saveManifest(manifest, [], runId)` call from line 1709 to line 1527 (immediately after setting status)
2. Call `saveManifest()` again at line 1709 with `reviewUrls` populated (preserves existing behavior)
3. Update code comments to document the two-phase approach
4. No changes to manifest structure, data, or external APIs

**Architecture Changes**: None - this is a pure code movement fix.

**Migration Strategy**: Not needed - this is a bug fix with no data migration.

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/orchestrator.ts` - Move `saveManifest()` call from line 1709 to line 1527; update comments

### New Files

None

### Step-by-Step Tasks

#### Step 1: Add early manifest save call

<describe what this step accomplishes>

Move the completion status persistence to happen immediately after the status is set in memory.

- Insert `saveManifest(manifest, [], runId)` at line 1527 (after line 1526's completed_at assignment)
- This writes the completion status to `overall-progress.json` with empty review URLs initially
- UI can now display completion screen immediately

**Why this step first**: Status must be persisted before any blocking operations begin, so the UI can update without waiting.

#### Step 2: Keep second manifest save with review URLs

<describe what this step accomplishes>

Ensure review URLs are added to the manifest once they're available.

- Keep the existing `saveManifest(manifest, reviewUrls, runId)` call at line 1709 (now line 1712 after insertion)
- This updates the manifest with review URLs after the review sandbox is created and dev server started
- Users can click on review URLs once they appear (optional - dev server can fail)

**Why in this order**: Second write updates the first write with additional data; no conflicts since both writes use the same function and manifest object.

#### Step 3: Update code comments

<describe what this step accomplishes>

Document the two-phase manifest write approach for future maintainers.

- Update the comment at line 1517-1521 to clarify:
  - Phase 1: Save manifest with completion status immediately (prevents frozen UI)
  - Phase 2: Save manifest again with review URLs when available
- Reference bug #1746 (UI delay) and explain why this approach was needed

#### Step 4: Validate no UI/UX regressions

<describe what this step accomplishes>

Ensure the fix doesn't cause unexpected behavior or edge cases.

- Verify manifest file is created with `"status": "completed"` or `"status": "partial"` BEFORE sandbox operations
- Verify the second save at line 1712 updates manifest with review URLs
- Check that manifest file is not corrupted if review sandbox creation fails (first save already persisted status)
- Ensure no manifest file locking issues (Node.js fs calls are atomic enough for this use case)

#### Step 5: Run validation commands

- Run `pnpm typecheck` to ensure no type errors
- Run `pnpm lint` to ensure code style is correct
- Manual test: Run `pnpm orchestrate` with small spec and observe manifest file updates during execution

## Testing Strategy

### Unit Tests

This fix doesn't require new unit tests since:
- `saveManifest()` is already tested separately
- The change is a pure code movement with no new logic

Add/update unit tests for:
- ✅ `saveManifest()` is called at least twice during completion
- ✅ First call happens before blocking operations begin
- ✅ Second call updates with review URLs after review sandbox created

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/orchestrator-events.spec.ts` - Add tests for manifest save timing

### Integration Tests

<if needed, describe integration test scenarios>

Manual integration tests:
- Run `pnpm orchestrate S0` (or any spec)
- Monitor `overall-progress.json` with file watcher:
  - `watch -n 1 'cat overall-progress.json | jq .progress.status'`
- Verify status changes to "completed" or "partial" BEFORE sandbox operations finish
- Verify status is readable from file (not just in memory)

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/orchestrator-events.spec.ts` - Integration test for manifest persistence

### E2E Tests

Not applicable - orchestrator is internal tooling, not user-facing UI.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run orchestrator with single feature (e.g., `pnpm orchestrate S0:F1`)
- [ ] Watch `overall-progress.json` in file system during execution
- [ ] Verify status changes to "completed" BEFORE "Creating dedicated review sandbox" log message
- [ ] Verify status persists to disk (can read via `cat overall-progress.json`)
- [ ] Allow orchestrator to complete fully
- [ ] Verify review URLs appear in manifest AFTER review sandbox created
- [ ] Test edge case: Kill orchestrator mid-completion phase
  - Verify manifest status is "completed" (not stuck on "running")
  - Verify next orchestrator run can read the completion status
- [ ] Check browser console for any new errors

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Manifest file written twice**: If first write fails silently, second write might not happen
   - **Likelihood**: low (fs writes are reliable on modern systems)
   - **Impact**: low (manifest is retry-safe; orchestrator can re-run)
   - **Mitigation**: Add error logging if either `saveManifest()` call fails

2. **Review URLs missing from first write**: If second write fails, review URLs won't be available
   - **Likelihood**: medium (review sandbox can fail to create)
   - **Impact**: low (review URLs are nice-to-have; core feature is status update)
   - **Mitigation**: Already handled - code catches review sandbox creation errors and adds vscode-only URL

3. **Manifest corruption if sandboxes killed during second write**: Unlikely due to file atomicity
   - **Likelihood**: very low (process is sequentially blocking)
   - **Impact**: low (can be recovered on next run)
   - **Mitigation**: No additional mitigation needed; Node.js fs module handles this

**Rollback Plan**:

If this fix causes issues in production:
1. Revert the commit moving `saveManifest()` call
2. Status will revert to being saved AFTER blocking operations (original bug returns)
3. Restart orchestrator instances that are in-flight

**Monitoring** (if needed):
- Monitor `orchestrator.ts` logs for "saveManifest" errors
- Alert on repeated orchestrator runs with same spec (indicates stuck completions)
- Check `overall-progress.json` mtime to verify writes are happening

## Performance Impact

**Expected Impact**: none

This fix moves a function call earlier but doesn't add new work. The `saveManifest()` function is called the same number of times (twice), just in different order. File I/O timing remains the same.

No performance testing needed.

## Security Considerations

No security implications. The fix doesn't change:
- File permissions (manifest still written to same location with same perms)
- Data being persisted (same manifest structure)
- Who can access the manifest (no auth changes)

**Security Impact**: none

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run orchestrator with a small spec
pnpm orchestrate S0:F1

# Watch manifest status in another terminal
watch -n 0.5 'cat overall-progress.json | jq .progress.status'

# Observe:
# - Status remains "in_progress" for ~10+ minutes
# - Status only changes to "completed" AFTER sandbox operations finish
# - UI remains stuck on "IN PROGRESS" screen
```

**Expected Result**: Status takes 10+ minutes to change from "in_progress" to "completed".

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run orchestrator again
pnpm orchestrate S0:F1

# Watch manifest status in another terminal
watch -n 0.5 'cat overall-progress.json | jq .progress.status'

# Observe:
# - Status changes to "completed" IMMEDIATELY after feature queue finishes
# - Status is readable BEFORE "Creating dedicated review sandbox" message
# - UI updates immediately while sandbox operations run asynchronously
# - Sandbox operations continue in background and add review URLs later
```

**Expected Result**: Status changes to "completed" within 5-10 seconds of feature queue completion, not 10+ minutes.

### Regression Prevention

```bash
# Run full orchestrator to completion
pnpm orchestrate S0

# Verify:
# 1. Check manifest has proper status (completed or partial)
# 2. Check manifest has reviewUrls populated (after review sandbox created)
# 3. Check no errors in logs related to saveManifest
# 4. Verify all features completed correctly
# 5. Run again immediately - should start fresh (no stuck status)
```

## Dependencies

### New Dependencies (if any)

No new dependencies required.

### Existing Dependencies Used

- Node.js `fs` module (already used by `saveManifest()`)
- `manifest` object (already exists)
- `runId` parameter (already passed to orchestrator)

## Database Changes

No database changes required - this is a file-based manifest system, not database-backed.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

**Feature flags needed**: No

**Backwards compatibility**: Maintained - manifest format unchanged, only timing of writes changes

## Success Criteria

The fix is complete when:
- [ ] `saveManifest()` is called at line 1527 (after status set)
- [ ] `saveManifest()` is called again at line 1712 (with review URLs)
- [ ] TypeScript compilation passes (`pnpm typecheck`)
- [ ] Linter passes (`pnpm lint`)
- [ ] Manual testing shows status changes immediately (not 10+ minutes later)
- [ ] Review URLs still appear after review sandbox creation (second write works)
- [ ] No new errors in logs
- [ ] Code comments updated to document two-phase approach

## Notes

This fix is a follow-up to #1720, which attempted to address the UI delay by setting status in memory but didn't persist to disk immediately. The root issue was that even though status was set in memory, the UI reads from `overall-progress.json` (persisted to disk), which only gets written at line 1709—after all blocking operations.

The fix is surgical: move one function call from line 1709 to line 1527. This ensures the status is persisted to disk immediately while blocking operations run asynchronously.

**Related Issues**:
- #1720 - Previous incomplete fix attempt (set status in memory but didn't save)
- #1727 - Related completion phase redesign (fixes sandbox killing logic)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1746*
