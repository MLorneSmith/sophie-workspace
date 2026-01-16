# Bug Fix: Orchestrator Preview URL Not Displayed After Completion

**Related Diagnosis**: #1498
**Severity**: High
**Bug Type**: UI/Integration
**Risk Level**: Low
**Complexity**: Simple

## Quick Reference

- **Root Cause**: Orchestrator stops UI immediately after writing preview URLs to file, before UI can poll and display them
- **Fix Approach**: Replace `uiManager.stop()` with `await uiManager.waitForExit()` to let users see and interact with preview URLs
- **Estimated Effort**: Small
- **Breaking Changes**: No

## Solution Design

### Problem Recap

When the Alpha Orchestrator completes feature development, it writes preview URLs to `overall-progress.json` but immediately stops the UI before it can poll the updated file and display the completion screen with preview URLs.

The issue is a **timing problem**: The file is written correctly, but the React UI component is unmounted before it gets a chance to detect the completion state and render the `CompletionUI`.

For full details, see diagnosis issue #1498.

### Solution Approaches Considered

#### Option 1: Use `waitForExit()` Instead of `stop()` ⭐ RECOMMENDED

**Description**: Replace `uiManager.stop()` with `await uiManager.waitForExit()`. This allows the UI to remain mounted and responsive until the user explicitly exits (presses 'q'), giving the polling mechanism time to detect and display the completion state with preview URLs.

**Pros**:
- Minimal code change (1-2 lines)
- Lets users see AND interact with preview URLs
- Natural user flow: complete workflow, review URLs, exit when ready
- No polling interval changes needed
- Aligns with human-in-the-loop design philosophy

**Cons**:
- User must manually press 'q' to exit (not automatic)
- Requires explicit user interaction (minor UX consideration)

**Risk Assessment**: Low - The `waitForExit()` method already exists and is designed for this use case

**Complexity**: Simple - Single method call replacement

#### Option 2: Add Delay Before `stop()`

**Description**: Keep `stop()` but add a delay (e.g., 6+ seconds) before calling it, giving the UI one polling cycle to update.

**Pros**:
- Automatic exit after timeout
- Simpler than tracking exit events

**Cons**:
- Arbitrary timeout is fragile (polling interval could change)
- Users can't review URLs or stay longer if needed
- Adds unnecessary waiting even if user is ready
- Doesn't align with human-in-the-loop workflow

**Why Not Chosen**: This is a workaround, not a proper solution. The diagnosis recommendation is better and more maintainable.

#### Option 3: Force Poll on Completion

**Description**: Trigger an immediate poll when `saveManifest()` completes, instead of relying on the 5-second interval.

**Pros**:
- Faster display of preview URLs

**Cons**:
- More complex refactoring of poll mechanism
- Still requires UI to remain mounted (so need `waitForExit()` anyway)
- Adds unnecessary complexity

**Why Not Chosen**: Unnecessary complexity when `waitForExit()` achieves the goal with minimal changes.

### Selected Solution: Use `waitForExit()` Instead of `stop()`

**Justification**:
This approach is the most aligned with the project's human-in-the-loop workflow philosophy. The orchestrator completes the feature development, displays the results with preview URLs, and allows the user to review them in the browser before explicitly exiting. This matches the design intent where users can:
1. See the preview URLs
2. Click and test them in a browser tab
3. Review the development output
4. Exit when satisfied (press 'q')

This is the minimal, correct fix recommended in the diagnosis and requires only a single method call change.

**Technical Approach**:
- Replace `uiManager.stop()` with `await uiManager.waitForExit()` in orchestrator.ts
- No UI component changes needed (polling already works)
- No configuration changes needed
- Method already exists in UIManager class

**Architecture Changes**: None - This is a simple control flow change using existing methods

**Migration Strategy**: Not applicable - This is a bug fix with no data/code migration needs

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/orchestrator.ts` (lines ~1156-1174) - Replace `stop()` with `await waitForExit()`
- `.ai/alpha/scripts/ui/index.tsx` - No changes needed; method already exists

### New Files

None - Using existing methods

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Understand the Completion Flow

Review the orchestrator completion logic to confirm:
- `saveManifest()` correctly writes preview URLs to `overall-progress.json`
- `overall-progress.json` structure includes `status: "completed"` and `reviewUrls` array
- UIManager has both `stop()` and `waitForExit()` methods defined

**Why this step first**: Ensures we understand the exact flow before modifying

#### Step 2: Update Orchestrator Completion Handler

In `.ai/alpha/scripts/lib/orchestrator.ts` (lines ~1156-1174):

**Current code**:
```typescript
saveManifest(manifest, reviewUrls, runId);
// ... logging ...
uiManager.stop();  // BUG: Immediately stops UI
```

**Fixed code**:
```typescript
saveManifest(manifest, reviewUrls, runId);
// ... logging ...
await uiManager.waitForExit();  // Wait for user to press 'q'
```

- Change the method call from `stop()` to `waitForExit()`
- Add `await` keyword to properly wait for user exit

#### Step 3: Add Tests for Completion Flow

Create test cases to verify:
- Orchestrator completes successfully and calls the exit handler
- preview URLs are written before exit handler is called
- UI remains responsive until user presses 'q'

**Test approach**:
- Add a simple integration test that starts the orchestrator
- Verify `overall-progress.json` is written with completed status
- Verify `waitForExit()` is called instead of `stop()`

#### Step 4: Manual Testing & Verification

Execute a real orchestrator run to verify:
- Feature development completes
- Completion UI displays with preview URLs
- User can click preview URLs to test in browser
- Pressing 'q' properly exits the orchestrator

**Manual test steps**:
1. Run the Alpha Orchestrator with a sample feature
2. Wait for completion
3. Verify preview URLs appear in the CLI output
4. Click/test the preview URLs in a browser (should be live)
5. Press 'q' to exit
6. Verify clean exit

#### Step 5: Validate & Cleanup

- Run `pnpm typecheck` - Must pass
- Run `pnpm lint:fix` - Fix any formatting issues
- Verify no other calls to `stop()` in the orchestrator flow (should only be in cleanup)
- Test with both successful and failed orchestrator runs

## Testing Strategy

### Unit Tests

Add unit tests for:
- ✅ Orchestrator completion handler properly awaits `waitForExit()`
- ✅ `saveManifest()` writes preview URLs before exit
- ✅ No race conditions between file write and UI display

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/orchestrator-completion.spec.ts` - Completion flow tests

### Integration Tests

- ✅ End-to-end orchestrator run completes successfully
- ✅ Preview URLs are accessible and functional after display
- ✅ User can exit with 'q' key after viewing URLs

**Test files**:
- `.ai/alpha/scripts/__tests__/orchestrator-e2e.spec.ts` - Full orchestrator flow

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start a real orchestrator run with sample feature
- [ ] Verify completion screen displays (no immediate exit)
- [ ] Verify preview URLs are shown in completion UI
- [ ] Click a preview URL to verify it's live
- [ ] Press 'q' in CLI to exit
- [ ] Verify clean orchestrator shutdown
- [ ] Check no error messages in orchestrator logs
- [ ] Test with both successful and failed runs

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **User Must Explicitly Exit**: Unlike automatic exit with `stop()`, users must press 'q'
   - **Likelihood**: Low (expected behavior)
   - **Impact**: Low (minor UX change, documented in help text)
   - **Mitigation**: Add clear instructions in completion UI: "Press 'q' to exit"

2. **Hanging Process**: If `waitForExit()` doesn't properly listen for 'q' key
   - **Likelihood**: Low (method already exists and used elsewhere)
   - **Impact**: Medium (user would need Ctrl+C to exit)
   - **Mitigation**: Verify `waitForExit()` implementation is solid; test manual exit flow

3. **Terminal Input Handling**: Terminal might not properly handle input if background processes interfere
   - **Likelihood**: Low
   - **Impact**: Medium (orchestrator might hang waiting for input)
   - **Mitigation**: Test on different terminal environments (WSL, macOS, Linux)

**Rollback Plan**:

If `waitForExit()` causes issues:
1. Revert to `uiManager.stop()` call
2. Instead add a 6+ second delay: `await new Promise(r => setTimeout(r, 6000)); uiManager.stop();`
3. This gives one polling cycle (~5 sec) to display URLs before stopping

**Monitoring** (if needed):
- Monitor orchestrator exit times to ensure not adding unexpected delays
- Check for user complaints about "hanging" orchestrator
- Verify no terminal input issues reported

## Performance Impact

**Expected Impact**: Negligible to positive

- No additional computation or memory usage
- UI polling already happens at 5-second intervals (no change)
- Only change is timing of UI cleanup (deferred until user exits)
- May slightly improve user experience by allowing time for preview URLs to load

## Security Considerations

**Security Impact**: None

- No new API calls or data exposure
- Using existing, secure methods
- Preview URLs are already generated by the orchestrator
- No changes to data handling or access controls

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run orchestrator and observe it exits immediately without showing preview URLs
pnpm --filter @kit/alpha dev-tool run orchestrator --feature "test-feature"

# Expected: UI exits immediately, preview URLs not visible
```

**Expected Result**: Preview URLs written to file but UI stops before displaying them

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests (if created)
pnpm test:unit orchestrator

# Run orchestrator and verify preview URLs display
pnpm --filter @kit/alpha dev-tool run orchestrator --feature "test-feature"
```

**Expected Result**:
- All validation commands succeed
- Orchestrator completes and displays completion UI with preview URLs
- User must press 'q' to exit (expected behavior)
- Preview URLs are functional and accessible

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Test orchestrator with multiple scenarios
pnpm --filter @kit/alpha dev-tool run orchestrator --feature "test-1"
pnpm --filter @kit/alpha dev-tool run orchestrator --feature "test-2"
```

## Dependencies

### New Dependencies

**No new dependencies required**

The `waitForExit()` method is already part of the UIManager class and doesn't require any additional libraries.

## Database Changes

**No database changes required**

This fix is UI/orchestration logic only with no database schema or migration needs.

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**: None required

**Feature flags needed**: No

**Backwards compatibility**: Maintained (no breaking changes)

The orchestrator behavior changes slightly (stays running until user exits), but this is actually more correct and doesn't break any existing workflows.

## Success Criteria

The fix is complete when:
- [ ] Code change applied: `stop()` → `await waitForExit()`
- [ ] All validation commands pass
- [ ] Manual testing confirms preview URLs display correctly
- [ ] User can exit with 'q' key without errors
- [ ] No orphaned processes left after exit
- [ ] No regression in other orchestrator functionality
- [ ] Code review approved (if applicable)

## Notes

This is a straightforward bug fix with minimal changes and low risk. The diagnosis correctly identified the root cause (premature UI cleanup) and recommended the proper solution (wait for user exit instead of immediate stop).

The fix aligns well with the project's human-in-the-loop workflow philosophy where users need time to review outputs before the process exits.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1498*
