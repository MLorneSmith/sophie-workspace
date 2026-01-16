# Bug Fix: Alpha Event Streaming UI Not Updating

**Related Diagnosis**: #1434 (REQUIRED)
**Severity**: medium
**Bug Type**: integration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Event streaming hooks not registered in `.claude/settings.json` and `recent_output` field not updated during execution
- **Fix Approach**: Register streaming hooks in sandbox settings and add hook to update progress file with recent tool output
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Orchestrator TUI displays initial sandbox output but never updates the "Output:" section, and the "Recent Events" section shows "No events yet..." despite event streaming being configured. The root cause is:

1. The `.claude/settings.json` PostToolUse hooks do not include calls to the event streaming scripts
2. The `recent_output` field in progress JSON files is only set at startup and never updated
3. The event reporter hook is not called, so no WebSocket events are sent to the UI

For full details, see diagnosis issue #1434.

### Solution Approaches Considered

#### Option 1: Add Hook Registration + Output Update ⭐ RECOMMENDED

**Description**: Register the streaming hooks in `.claude/settings.json` and create a dedicated hook to update the `recent_output` field with the most recent tool calls from the session logs.

**Pros**:
- Minimal changes required (2-3 file edits)
- Leverages existing streaming hook infrastructure
- Maintains separation of concerns (streaming, progress tracking, output updates are separate hooks)
- Low risk - hooks are already in the codebase, just not enabled
- Addresses root cause directly

**Cons**:
- Requires coordination: hooks need ORCHESTRATOR_URL environment variable (already available)
- May need slight adjustment to output capture format

**Risk Assessment**: low - We're enabling existing code that's already been written and tested, just not integrated.

**Complexity**: simple - Mostly configuration changes with a small utility script to capture output.

#### Option 2: Merge All Functionality into Single Hook

**Description**: Create a single comprehensive hook that handles heartbeat, streaming, and output updates in one call.

**Pros**:
- Fewer separate hook executions
- Single point of maintenance

**Cons**:
- More complex hook logic
- Harder to debug individual concerns
- Higher risk of side effects
- Violates separation of concerns principle

**Why Not Chosen**: Unnecessary complexity when existing hooks are designed to work together.

#### Option 3: Use Log File Polling Instead of Hooks

**Description**: Instead of updating progress JSON, read log files directly in the UI.

**Pros**:
- Avoids modifying hooks

**Cons**:
- Log files are not being appended to (stuck at initial lines)
- Would require fixing log file output first
- More I/O intensive
- Less reliable than structured progress files

**Why Not Chosen**: Root cause is hook integration, not log file reading.

### Selected Solution: Add Hook Registration + Output Update

**Justification**: This approach directly addresses the root cause by integrating existing, proven hook infrastructure. It's minimal, low-risk, and leverages code that's already written. The streaming hooks exist and work—they just need to be registered in settings.json. Similarly, capturing recent output is a small utility function to append to progress files.

**Technical Approach**:

1. Register PostToolUse hooks in `.claude/settings.json` to call:
   - `task_progress_stream.py` - sends events to event server
   - `update_recent_output.py` (new) - captures recent tool activity and updates progress JSON

2. Create `update_recent_output.py` hook that:
   - Reads the last N lines from Claude Code logs (or from hook stdin/environment)
   - Filters for meaningful tool calls (Write, Bash, Read, etc.)
   - Appends to `recent_output` array in progress JSON
   - Keeps last 5-10 items to prevent file bloat

3. Ensure ORCHESTRATOR_URL environment variable is available (already done)

**Architecture Changes** (if any):

The `.claude/settings.json` will gain two new PostToolUse hook entries:

```json
{
  "type": "command",
  "command": "python3 $CLAUDE_PROJECT_DIR/.claude/hooks/task_progress_stream.py || true",
  "timeout": 3
},
{
  "type": "command",
  "command": "python3 $CLAUDE_PROJECT_DIR/.claude/hooks/update_recent_output.py || true",
  "timeout": 3
}
```

This maintains the existing hook pattern and doesn't modify any core functionality.

**Migration Strategy** (if needed):

No data migration needed. Progress files will automatically populate with recent_output starting on next execution.

## Implementation Plan

### Affected Files

- `.claude/settings.json` - Add PostToolUse hooks for event streaming and output update
- `.claude/hooks/update_recent_output.py` - Create new hook to capture and update progress file
- `.ai/alpha/scripts/lib/environment.ts` - Verify ORCHESTRATOR_URL is injected (should already be done)

### New Files

- `.claude/hooks/update_recent_output.py` - Python hook script to update progress JSON with recent tool output

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Create the output update hook script

Create a new Python hook that:
- Reads tool output from environment/stdin
- Filters for meaningful activity
- Updates progress JSON file's `recent_output` field
- Handles file locking gracefully

**Why this step first**: The hook needs to exist before we can register it in settings.json.

- Create `.claude/hooks/update_recent_output.py` with:
  - Function to parse HOOK_TOOL_CALLS or similar environment variable
  - Function to read existing progress JSON
  - Function to append new items to recent_output array (keeping last 10 items)
  - Function to write updated progress JSON safely
  - Error handling for file locking/permissions

#### Step 2: Register streaming hooks in settings.json

Update `.claude/settings.json` PostToolUse hooks section to include the new hook registrations.

- Locate PostToolUse hooks array (lines 41-54)
- Add hook for `task_progress_stream.py` (already exists, just not registered)
- Add hook for `update_recent_output.py` (new hook)
- Both hooks should have timeout of 2-3 seconds
- Add `|| true` to prevent failures from blocking tool execution

#### Step 3: Verify environment variable injection

Confirm ORCHESTRATOR_URL is available in sandbox environment for hooks to use.

- Read `environment.ts` to verify ORCHESTRATOR_URL injection (line 228-229)
- Check that hooks will have access to this variable
- Verify event server URL format is correct

**Why this step here**: Before we can test, we need to ensure the environment setup is correct.

#### Step 4: Add/update tests

Create tests to verify hook functionality without running full orchestrator.

- Unit test for output update logic (can run locally)
- Integration test verifying hooks are called when tools execute
- Verify progress JSON is updated correctly
- Verify event server receives WebSocket events

#### Step 5: Manual testing and validation

Execute the full workflow to verify all three issues are fixed.

- Run orchestrator with test feature plan
- Verify "Output:" section updates with recent tool calls
- Verify "Recent Events" section shows incoming WebSocket events
- Verify no regressions in other sandbox functionality

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Output update hook correctly parses tool calls
- ✅ Hook correctly reads and writes progress JSON
- ✅ Hook appends items and maintains rolling buffer (last 10 items)
- ✅ Hook handles file locking gracefully
- ✅ Hook handles missing progress file gracefully (edge case)
- ✅ Recent_output field is properly formatted as array
- ✅ Regression test: Progress file updates don't break heartbeat functionality

**Test files**:
- `test/hooks/update_recent_output.spec.ts` - Hook functionality tests
- `test/orchestrator/event-streaming.spec.ts` - Integration tests

### Integration Tests

Integration tests for:
- Event streaming hook sends correct events to event server
- Multiple hooks execute without race conditions
- Progress file updates don't corrupt JSON
- ORCHESTRATOR_URL environment variable available to hooks

**Test files**:
- `test/orchestrator/event-streaming.integration.ts` - Full streaming integration

### E2E Tests

E2E tests for:
- TUI displays updated "Output:" section (uses Ink/React testing)
- "Recent Events" section updates with WebSocket events
- No regressions in feature implementation

**Test files**:
- `e2e/orchestrator/ui-event-updates.spec.ts` - UI update testing

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start orchestrator with test feature plan: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --ui`
- [ ] Verify sandbox "Output:" section shows "Using OAuth..." initial lines
- [ ] Wait 5-10 seconds for Claude Code to execute tools
- [ ] Verify "Output:" section updates with new tool calls (should see Write, Bash, Read, etc.)
- [ ] Verify "Output:" shows last 5-10 most recent tool calls (rolling buffer)
- [ ] Verify "Recent Events" section populates with WebSocket events (not "No events yet...")
- [ ] Verify events show task progress (task completion, task start, etc.)
- [ ] Run full orchestrator for multiple features to ensure stability
- [ ] Check browser console for WebSocket connection errors
- [ ] Verify log files still work as fallback if progress JSON unavailable

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Hook execution failures causing slowdown**: If hooks fail, they could delay tool execution
   - **Likelihood**: low (hooks have existing timeout and `|| true` prevents blocking)
   - **Impact**: low (tools execute regardless, only monitoring affected)
   - **Mitigation**: Hooks have 2-3 second timeout and use `|| true` to suppress errors; test with timeout disabled first

2. **File locking on progress JSON**: Multiple hooks writing simultaneously could cause conflicts
   - **Likelihood**: medium (multiple hooks access same file)
   - **Impact**: low (progress file corruption unlikely due to atomic JSON writes)
   - **Mitigation**: Implement file locking in hook, use atomic writes (write-to-temp-then-rename pattern)

3. **Progress file size growth**: Appending to recent_output indefinitely could bloat file
   - **Likelihood**: low (implementation limits to rolling buffer of 10 items)
   - **Impact**: low (file stays small)
   - **Mitigation**: Keep rolling buffer at 5-10 items maximum

4. **ORCHESTRATOR_URL not available in sandbox hooks**: Event streaming won't work without this
   - **Likelihood**: low (already injected in environment.ts)
   - **Impact**: medium (streaming fails silently)
   - **Mitigation**: Add debug logging to verify URL is available, add fallback

5. **Backward compatibility**: Existing progress files without recent_output field
   - **Likelihood**: high (existing files won't have this field)
   - **Impact**: low (hook initializes if missing)
   - **Mitigation**: Hook checks for field existence and initializes empty array if needed

**Rollback Plan**:

If this fix causes issues in production:
1. Remove the two new hook entries from `.claude/settings.json` PostToolUse array
2. Delete `.claude/hooks/update_recent_output.py` (or rename to .bak)
3. Restart orchestrator - will revert to old behavior (static output, no events)
4. Investigate specific hook failure before retry

This is a safe rollback since hooks are optional and failure-tolerant.

**Monitoring** (if needed):

- Monitor hook execution time (should be <1 second each)
- Watch for event server HTTP error responses from hooks
- Alert if `recent_output` field not updating after 10 tool calls
- Monitor progress file sizes (should stay <5KB)

## Performance Impact

**Expected Impact**: minimal

The two new hooks execute after each tool use and take ~1-2 seconds combined (including timeouts). Since they run asynchronously and have `|| true` fallback, they don't block tool execution or slow down the workflow.

**Performance Testing**:

- Run orchestrator with and without hooks, measure tool execution time
- Verify hooks don't increase average tool execution time by >10%
- Monitor event server CPU/memory under load

## Security Considerations

**Security Impact**: none

The hooks are local Python scripts with no network access (event_reporter POSTs to localhost:9000 only). No new security boundaries are crossed. The ORCHESTRATOR_URL is localhost-only.

**Security Assessment**:
- Hooks execute in sandbox environment (isolated from main machine)
- No credentials or sensitive data passed to hooks
- No external network calls except to event server (localhost)
- File operations are local only

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start orchestrator and observe stuck output
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --ui

# Expected Result:
# - "Output:" shows only 2 initial lines
# - "Recent Events" shows "No events yet..."
```

**Expected Result**: Output section frozen, no recent events displayed.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests
pnpm test:unit .claude/hooks/update_recent_output.spec.ts

# Integration tests
pnpm test:integration orchestrator/event-streaming.integration.ts

# E2E tests (if applicable)
pnpm test:e2e orchestrator/ui-event-updates.spec.ts

# Build
pnpm build

# Manual orchestrator test
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --ui
# Wait 10 seconds and verify:
# - "Output:" updates with new tool calls
# - "Recent Events" shows WebSocket events
```

**Expected Result**: All commands succeed, orchestrator displays updated output and events, no regressions.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Run orchestrator with multiple features to verify stability
for i in {1360..1362}; do
  echo "Testing feature $i..."
  tsx .ai/alpha/scripts/spec-orchestrator.ts $i --ui --timeout 30
done
```

## Dependencies

### New Dependencies

No new dependencies required. The fix uses existing Python standard library and Node.js tooling.

**No new dependencies required** - All required libraries already available:
- Python: `json`, `os` (standard library)
- Node.js: Existing progress file handling already implemented

### Existing Hook Dependencies

- `.claude/hooks/task_progress_stream.py` - Already exists, just needs registration
- `.claude/hooks/heartbeat.py` - Already exists and working
- Event server (orchestrator.ts) - Already running on port 9000

## Database Changes

**No database changes required** - This fix only updates local progress JSON files in `.ai/alpha/progress/` directory. No Supabase schema changes needed.

## Deployment Considerations

**Deployment Risk**: low

This fix only affects the Alpha Orchestrator tooling (local development). No production impact.

**Special deployment steps**: None - hooks are loaded from `.claude/` on sandbox startup, changes take effect immediately.

**Feature flags needed**: no

**Backwards compatibility**: maintained - Existing progress files work as-is; new field is optional.

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] "Output:" section updates with recent tool calls every 2-3 seconds
- [ ] "Recent Events" section displays WebSocket events from sandbox
- [ ] Rolling buffer keeps last 5-10 tool calls (old entries roll off)
- [ ] All tests pass (unit, integration, E2E)
- [ ] Zero regressions in other orchestrator functionality
- [ ] Manual testing checklist complete
- [ ] No performance degradation (<10% tool execution time increase)
- [ ] No security issues introduced

## Notes

- The streaming hooks (`task_progress_stream.py`, `event_reporter.py`) already exist in the codebase and were designed to work together. This fix simply registers them and adds the missing output update functionality.
- The ORCHESTRATOR_URL is already injected into sandbox environment (see environment.ts:228-229), so hooks will have access to the event server.
- The UI already handles WebSocket events and progress file updates (useProgressPoller.ts, useEventStream.ts). No UI changes needed.
- The event server is already running and working; it just needs to receive events from the hooks (currently no events are sent).

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1434*
