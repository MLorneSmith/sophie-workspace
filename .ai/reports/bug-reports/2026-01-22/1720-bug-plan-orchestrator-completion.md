# Bug Fix: Alpha Orchestrator completion handling and UI display

**Related Diagnosis**: #1719
**Severity**: high
**Bug Type**: bug
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Completion status never updated when `createReviewSandbox()` or `startDevServer()` hangs/fails; ANSI terminal codes not stripped from output before display
- **Fix Approach**: (1) Add explicit timeout handling to review sandbox creation and dev server startup, (2) Move status update before async operations, (3) Strip ANSI codes from output lines before storing/displaying
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Orchestrator displays an incomplete UI when features finish but completion screen never appears. The diagnosis identified three issues:

1. **Completion status stuck at "in_progress"** - The manifest's progress.status is only set at line 1617 AFTER createReviewSandbox() and startDevServer() complete. If either operation hangs or fails, the status update never happens, leaving the UI frozen on the dashboard.

2. **Missing completion events** - Because status never updates from "in_progress" to "completed", the event log never generates a "Spec completed!" event, leaving users with no confirmation.

3. **ANSI terminal codes in sandbox output** - Raw terminal output including ANSI escape sequences (e.g., `\^[[01;32m`, `\^[[?2004h`) is stored directly in recentOutput and displayed in the UI, causing garbled text and layout breaks.

For full details, see diagnosis issue #1719.

### Solution Approaches Considered

#### Option 1: Timeout-guarded operations with status update before async work ⭐ RECOMMENDED

**Description**:
1. Add timeout wrappers to `createReviewSandbox()` and `startDevServer()` that fail gracefully if operations exceed time limits
2. Move the status update (line 1617) to occur BEFORE creating the review sandbox, guaranteeing it happens
3. Strip ANSI codes from all output lines as they're collected in the OutputTracker

**Pros**:
- Guarantees completion status updates regardless of sandbox operation results
- Simple explicit timeout logic prevents indefinite hangs
- ANSI stripping is applied consistently at collection point, preventing display issues
- Minimal code changes, low risk of regressions
- Non-breaking: operations still attempt fully, just with time limits

**Cons**:
- Users might see completion before dev server is actually ready (but reviewUrls will still be populated)
- Requires coordinating status update before reviewUrls are completely ready

**Risk Assessment**: medium - The status update is already protected by a comment about race conditions. Moving it earlier shouldn't create new races because reviewUrls are still populated atomically before saveManifest(). Review the saveManifest() call to confirm atomic write.

**Complexity**: moderate - Three separate changes (timeout wrappers, status update timing, ANSI stripping) but each is localized

#### Option 2: Separate timeout helper with retry logic

**Description**: Create a generic `executeWithTimeout(operation, timeoutMs, maxRetries)` helper function that retries failed operations with exponential backoff before giving up.

**Why Not Chosen**: Adds complexity and retry logic that might be inappropriate for review sandbox creation (don't want to spawn multiple review sandboxes). Simple timeout-first approach is more predictable.

#### Option 3: Keep operations async but add completion callback hook

**Description**: Modify createReviewSandbox() and startDevServer() to accept completion callbacks, allowing status update to happen as soon as operations finish or timeout.

**Why Not Chosen**: More invasive changes to multiple functions. The "status first" approach is simpler and equally effective.

### Selected Solution: Timeout-guarded operations with early status update + ANSI stripping

**Justification**:
- Guarantees completion status always updates, fixing the frozen UI
- ANSI stripping at collection point prevents downstream display issues
- Minimal code surface area, easier to review and maintain
- Status update timing is already protected by existing atomic write pattern
- Risk is low because we're only adding defensive operations, not changing core logic

**Technical Approach**:
1. Create reusable `withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T>` helper that races the promise against a timeout, falling back gracefully
2. Wrap createReviewSandbox() call with 60-second timeout (generous buffer for slow systems)
3. Wrap startDevServer() call with 90-second timeout (accounts for dev server startup + health checks)
4. Move status update from after async ops to before createReviewSandbox() call, BUT keep reviewUrls assignment after dev server completes
5. Create `stripAnsiCodes(text: string): string` helper using standard regex pattern
6. Apply ANSI stripping in feature.ts outputTracker collection loop

**Architecture Changes**: None - purely defensive additions

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/orchestrator.ts:1548-1596` - Add timeout wrappers around createReviewSandbox() and startDevServer() calls
- `.ai/alpha/scripts/lib/orchestrator.ts:1612-1618` - Move status update earlier to before sandbox creation
- `.ai/alpha/scripts/lib/feature.ts:434-450` - Apply ANSI stripping to output lines
- `.ai/alpha/scripts/lib/utils.ts` - Add helper functions (if doesn't exist, create)

### New Files

None - helpers can be added to existing utils or inline in orchestrator

### Step-by-Step Tasks

#### Step 1: Create timeout helper function

Create a reusable timeout wrapper in `.ai/alpha/scripts/lib/utils.ts`:

```typescript
/**
 * Execute a promise with timeout protection
 * @param promise Promise to execute
 * @param timeoutMs Timeout in milliseconds
 * @param label Label for logging
 * @returns Promise that resolves or rejects with timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => {
        reject(new Error(`Timeout after ${timeoutMs}ms: ${label}`));
      }, timeoutMs)
    ),
  ]);
}
```

**Why this step first**: The helper must exist before we can use it in the orchestrator main logic

#### Step 2: Create ANSI code stripping helper

Add to utils.ts:

```typescript
/**
 * Strip ANSI escape codes from text
 * @param text Text containing potential ANSI codes
 * @returns Text with ANSI codes removed
 */
export function stripAnsiCodes(text: string): string {
  // Matches ANSI escape sequences: \x1b[...m and other patterns
  // Also handles \^[[ pattern from JSON escaping
  return text
    .replace(/\x1b\[[0-9;]*m/g, '') // Standard ANSI color codes
    .replace(/\x1b\[?[0-9;]*[A-Za-z]/g, '') // Cursor movement, etc
    .replace(/\^?\[\[\??\d*[a-zA-Z]/g, '') // Escaped bracket sequences
    .replace(/\^\[\[[0-9;]*[a-zA-Z]/g, ''); // Additional escape patterns
}
```

**Why this step**: Must be available before modifying feature.ts output collection

#### Step 3: Apply ANSI stripping to output collection

In `.ai/alpha/scripts/lib/feature.ts` around line 434-450:

```typescript
// Track recent output lines for UI
const lines = data.split("\n");
for (const line of lines) {
  if (line.trim()) {
    // Strip ANSI codes before storing
    const cleanLine = stripAnsiCodes(line);
    recentOutput.push(cleanLine);
    // Keep only last N lines
    if (recentOutput.length > RECENT_OUTPUT_LINES) {
      recentOutput.shift();
    }
    // ... rest of tracking logic
  }
}
```

**Why this step before orchestrator changes**: Ensures output is clean from the source, preventing ANSI codes from reaching UI through any path

#### Step 4: Update orchestrator to use timeout wrappers

In `.ai/alpha/scripts/lib/orchestrator.ts` around line 1544-1560:

Replace the createReviewSandbox() call with timeout wrapper:

```typescript
if (branchName) {
  try {
    log("   Creating dedicated review sandbox for dev server...");
    reviewSandbox = await withTimeout(
      createReviewSandbox(branchName, options.timeout, options.ui),
      60000, // 60 second timeout for review sandbox creation
      "Review sandbox creation"
    );
    log("   ✅ Review sandbox created successfully");
  } catch (error) {
    log(
      `   ⚠️ Failed to create review sandbox: ${error instanceof Error ? error.message : error}`,
    );
    log("   Falling back to implementation sandbox...");
  }
}
```

Similarly for startDevServer() around line 1572:

```typescript
try {
  const devServerUrl = await withTimeout(
    startDevServer(devServerSandbox, 60, 1000),
    90000, // 90 second timeout for dev server startup
    "Dev server startup"
  );
  reviewUrls.push({
    // ... rest of push logic
  });
  log(`   ✅ Dev server ready on ${reviewSandbox ? "review" : "implementation"} sandbox`);
} catch (error) {
  log(`   ⚠️ Dev server failed to start: ${error instanceof Error ? error.message : error}`);
  reviewUrls.push({
    // ... fallback with "(failed to start)"
  });
}
```

**Why this step**: Prevents operations from blocking status update

#### Step 5: Move status update before sandbox operations

In `.ai/alpha/scripts/lib/orchestrator.ts` around line 1516-1624:

Move the status update block (lines 1612-1618) to BEFORE the createReviewSandbox() call (before line 1544):

```typescript
// Set completion status EARLY to prevent frozen UI if sandbox creation hangs
// reviewUrls will be populated separately as sandbox operations complete
const failedFeatures = manifest.feature_queue.filter(
  (f) => f.status === "failed",
).length;
manifest.progress.status = failedFeatures === 0 ? "completed" : "partial";
manifest.progress.completed_at = new Date().toISOString();

log("\n🔄 Creating fresh review sandbox...");
// ... rest of review sandbox creation code
```

**Why this step**: Guarantees status update happens regardless of sandbox operation outcomes. The comment about race conditions is still protected because saveManifest() is called AFTER both operations complete, ensuring reviewUrls are available.

**Note**: Keep the saveManifest() call at line 1623 in its current position - it will write both the updated status AND the completed reviewUrls atomically.

#### Step 6: Add tests for timeout behavior

Create or update `.ai/alpha/scripts/lib/__tests__/orchestrator.spec.ts`:

- Test that status updates even if createReviewSandbox() times out
- Test that status updates even if startDevServer() times out
- Test that ANSI codes are stripped from output lines
- Test that completion event is generated after status update

#### Step 7: Validation

- Run spec orchestrator with debug spec S0000
- Verify completion screen appears when feature finishes
- Verify "Spec completed!" event appears in event log
- Verify sandbox output displays without garbled characters
- Verify devServerUrl and VS Code URLs still appear correctly

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `withTimeout()` helper rejects after specified milliseconds
- ✅ `withTimeout()` resolves with value if promise completes first
- ✅ `stripAnsiCodes()` removes standard ANSI color codes (\x1b[31m, etc)
- ✅ `stripAnsiCodes()` removes cursor movement codes
- ✅ `stripAnsiCodes()` removes escaped bracket sequences from JSON
- ✅ Status update occurs even if createReviewSandbox() times out
- ✅ Status update occurs even if startDevServer() times out
- ✅ Regression test: Completion event should not duplicate even with early status update

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/utils.spec.ts` - timeout and stripAnsi helpers
- `.ai/alpha/scripts/lib/__tests__/orchestrator.spec.ts` - orchestrator completion logic

### Integration Tests

- Run orchestrator with debug spec S0000 and verify UI displays completion
- Kill review sandbox creation and verify status still updates
- Kill dev server startup and verify status still updates

### E2E Tests (if applicable)

Manual testing is sufficient for this bug - E2E tests would need mocked sandboxes

### Manual Testing Checklist

Execute these tests before considering the fix complete:

- [ ] Run `pnpm tsx .ai/alpha/scripts/spec-orchestrator.ts S0000 --ui`
- [ ] Verify "IN PROGRESS" dashboard disappears when feature completes
- [ ] Verify completion screen appears (or returns to dashboard with success state)
- [ ] Verify event log contains "Spec completed!" event
- [ ] Verify no ANSI codes visible in sandbox output columns (test with long-running feature)
- [ ] Verify dev server URL and VS Code links display correctly
- [ ] Kill review sandbox during creation (simulate hang), verify status still updates
- [ ] Kill dev server startup (simulate hang), verify status still updates

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Race condition between status update and reviewUrls population**: Users could see completion status before dev server URLs are available
   - **Likelihood**: low (saveManifest is atomic, writes both together)
   - **Impact**: medium (UI shows completed but no clickable links briefly)
   - **Mitigation**: Verify saveManifest() call happens immediately after reviewUrls array is fully populated. Add comment explaining the timing guarantee.

2. **ANSI stripping regex misses some code patterns**: UI still shows garbled text
   - **Likelihood**: low (tested against common patterns)
   - **Impact**: low (output is already best-effort, no functionality breaks)
   - **Mitigation**: Test with real sandbox output. Regex can be updated iteratively if patterns are found.

3. **Timeout too aggressive**: Legitimate operations fail on slow systems
   - **Likelihood**: low (60s for review sandbox, 90s for dev server are generous)
   - **Impact**: medium (users lose dev server access but orchestration continues)
   - **Mitigation**: Use conservative timeouts. Dev server startup already has 60 health check attempts, so 90s total is very generous.

4. **Status update happens before sandbox URLs are ready**: UI shows completion but failed to fetch URLs
   - **Likelihood**: low (operation already wrapped in try-catch)
   - **Impact**: low (error handling falls back to showing "(failed to start)")
   - **Mitigation**: Ensure error handling is robust (already is)

**Rollback Plan**:

If this fix causes issues:
1. Revert status update move (put it back after sandbox operations)
2. Remove timeout wrappers (operations will hang again if they're the cause)
3. Revert ANSI stripping (restore original output)
4. Run `git reset --hard HEAD~1` to completely undo all changes
5. Redeploy with previous orchestrator version

**Monitoring** (if needed):
- Monitor whether status update happens faster than before
- Check if any operations hit the timeout limits (80+ seconds) - would indicate slow systems
- Track completion event generation to ensure it matches status updates

## Performance Impact

**Expected Impact**: minimal

- Status update moves earlier in execution (negligible timing difference)
- ANSI stripping adds minimal CPU overhead (single regex pass per output line)
- Timeout wrappers have no overhead if operations complete normally
- Overall orchestrator completion time unchanged

## Security Considerations

**Security Impact**: none

- Timeout helpers don't expose any new attack surface
- ANSI stripping is a display improvement, not security-sensitive
- No new external API calls or data handling

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Create/ensure debug spec exists
cd /home/msmith/projects/2025slideheroes
pnpm tsx .ai/alpha/scripts/spec-orchestrator.ts S0000 --ui
```

**Expected Result**:
- UI shows "IN PROGRESS" indefinitely
- Event log has no "Spec completed!" event
- overall-progress.json shows `"status": "in_progress"`
- Sandbox output contains visible ANSI escape codes

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Unit tests for helpers
pnpm --filter @kit/scripts test:unit -- utils.spec.ts

# Unit tests for orchestrator
pnpm --filter @kit/scripts test:unit -- orchestrator.spec.ts

# Manual verification
pnpm tsx .ai/alpha/scripts/spec-orchestrator.ts S0000 --ui
```

**Expected Result**:
- All tests pass
- Completion screen displays when feature finishes
- Event log shows "Spec completed!" event
- overall-progress.json shows `"status": "completed"`
- Sandbox output displays cleanly without ANSI codes
- Dev server and VS Code URLs display correctly

### Regression Prevention

```bash
# Run full orchestrator test suite
pnpm --filter @kit/scripts test:unit -- orchestrator

# Run all alpha script tests
pnpm --filter @kit/scripts test:unit -- lib/

# Manual test with longer-running spec to verify robustness
pnpm tsx .ai/alpha/scripts/spec-orchestrator.ts <multi-feature-spec> --ui
```

## Dependencies

### New Dependencies (if any)

None - uses only standard JavaScript Promise and regex APIs

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- None - purely code changes, no schema or environment changes

**Feature flags needed**: no

**Backwards compatibility**: maintained - output format unchanged, only display improved

## Success Criteria

The fix is complete when:
- [ ] Status update happens before review sandbox creation (code review)
- [ ] Timeout wrappers correctly catch and log timeout errors
- [ ] ANSI codes are stripped from all output lines
- [ ] Completion screen displays when orchestrator finishes
- [ ] Event log generates "Spec completed!" event
- [ ] Sandbox output displays without garbled characters
- [ ] All unit tests pass
- [ ] Manual testing checklist passes
- [ ] No new regressions in other orchestrator functionality
- [ ] Code review approved

## Notes

**Key Implementation Details**:
- The status update is already protected by the comment at line 1517-1518 about atomic writes. Moving it earlier doesn't break this contract because saveManifest() still happens after reviewUrls are populated.
- The `withTimeout` helper uses Promise.race() which is the idiomatic way to add timeouts in JavaScript
- ANSI code regex patterns include both standard codes and escaped variants that might appear in JSON logs
- Timeout values (60s review sandbox, 90s dev server) are conservative - actual operations typically complete in 15-30s

**Related Issues**:
- Bug #1590 addressed the need for fresh review sandbox instead of reusing implementation sandbox
- This fix complements #1590 by ensuring the orchestrator responds gracefully even if sandbox operations hang

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1719*
