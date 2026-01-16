# Bug Fix: Alpha Event Streaming - Network Unreachable from E2B Sandboxes

**Related Diagnosis**: #1438 (REQUIRED)
**Severity**: high
**Bug Type**: integration
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: E2B sandboxes (cloud VMs) cannot reach `localhost:9000` on the orchestrator machine - network is isolated
- **Fix Approach**: Move event reporting from HTTP POST to file-based progress updates (use existing polling mechanism)
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Orchestrator UI fails to display real-time tool activity in the "Output:" section of sandbox columns. The event streaming system attempts to POST events from inside E2B sandboxes to the orchestrator's `localhost:9000`, but this network path is unreachable due to E2B's network isolation. Events silently fail to reach the server, WebSocket never broadcasts, and the UI reverts to empty progress files.

For full details, see diagnosis issue #1438.

### Solution Approaches Considered

#### Option 1: Write Events to Progress Files Inside Sandbox ⭐ RECOMMENDED

**Description**: Instead of HTTP POST, modify `event_reporter.py` to write recent tool activity directly to `.initiative-progress.json` inside the sandbox. The orchestrator's existing file polling mechanism (SSH/E2B API) already reads this file, so no infrastructure changes needed.

**Pros**:
- Uses existing file-based progress mechanism that already works (heartbeats poll this same file)
- No external dependencies or network calls required
- Guaranteed to work within E2B's architecture constraints
- Minimal code changes (just modify the hook to append to JSON instead of POST)
- Leverages proven polling pattern already in `useProgressPoller.ts`
- No WebSocket infrastructure needed for this particular use case

**Cons**:
- Slightly higher latency than WebSocket (5-15 second polling interval vs real-time)
- Requires coordinating file writes from multiple hooks
- Limited to last N output lines (same as current system)

**Risk Assessment**: low - Changes are minimal, leverages existing patterns, file operations are safer than network calls

**Complexity**: simple - Single file modification, no new infrastructure

#### Option 2: Use ngrok/localtunnel to Expose Event Server

**Description**: Deploy a public tunnel (ngrok or localtunnel) to expose `localhost:9000` to the internet, making it reachable from E2B sandboxes. Update `ORCHESTRATOR_URL` to use the tunnel URL instead of localhost.

**Pros**:
- Preserves the full event streaming architecture
- True real-time updates via WebSocket
- No code changes to event reporting logic

**Cons**:
- Requires external service dependency (ngrok/localtunnel)
- Potential security concerns exposing event server publicly
- Adds latency through tunneling
- Requires manual tunnel setup/management or additional automation
- Breaks on orchestrator restart (tunnel URL changes)
- Not suitable for production deployments

**Why Not Chosen**: External dependency and operational complexity outweigh benefits for internal development tool. The polling approach is simpler and sufficient.

#### Option 3: Reverse Architecture with E2B Port Forwarding

**Description**: Have the sandbox run a WebSocket server and the orchestrator connect to it via E2B's exposed ports. Completely reverse the communication flow.

**Pros**:
- Uses E2B's native port forwarding infrastructure
- True real-time updates

**Cons**:
- Major architectural change requiring significant refactoring
- Complexity of managing multiple sandbox servers
- Each sandbox needs its own WebSocket endpoint
- Orchestrator must maintain connections to multiple sandboxes
- High risk of new bugs during transition

**Why Not Chosen**: Disproportionate complexity for marginal benefit over file-based solution.

### Selected Solution: Option 1 - File-Based Event Reporting

**Justification**:

The diagnosis shows that the event streaming infrastructure is fundamentally constrained by E2B's network isolation - this is a feature, not a bug. Rather than fight this architecture, we should embrace it. The solution leverages SlideHeroes' existing multi-stage execution pattern:

1. **Orchestrator has access to sandbox files** via E2B's file operations and SSH
2. **Progress polling already works** - heartbeats successfully update progress files
3. **File format is already defined** - `.initiative-progress.json` structure exists
4. **UI polling is already implemented** - `useProgressPoller.ts` periodically reads files

The fix simply extends this proven pattern to include tool activity events alongside heartbeats. This is the Unix philosophy: use the right tool for the problem. Files are the right tool when networks are isolated.

**Technical Approach**:

1. **Modify hook input format**: When `event_reporter.py` receives PostToolUse events, instead of HTTP POST, append formatted tool info to `.initiative-progress.json` under `recent_output` array
2. **Maintain output format**: Keep the same emoji-based formatting (e.g., "📖 Read: dashboard.ts") for consistency with WebSocket code
3. **Manage array bounds**: Keep recent output limited to last 10-20 lines to avoid file size bloat
4. **Silent failures**: Hook still fails silently - critical to not block Claude
5. **File safety**: Use atomic writes or append operations to prevent corruption

**Architecture Changes**:

- **No API/WebSocket changes** - Remove event server HTTP listening (keep server alive for potential future use)
- **No UI changes** - Progress poller already handles `recent_output` array
- **Hook changes only** - `event_reporter.py` changes from HTTP to file operations
- **Minimal orchestrator changes** - File polling already works, no new code needed

**Migration Strategy**:

1. `event_reporter.py` updated to write to progress file first, HTTP POST second (fallback)
2. Deploy change to sandboxes via environment variable hook registration
3. Event server can remain running (might be useful later) but won't be necessary
4. Progress files immediately show tool activity via existing polling

## Implementation Plan

### Affected Files

List files that need modification:

- `.claude/hooks/event_reporter.py` - **CRITICAL**: Modify to write to progress files instead of HTTP POST
  - Add function to read/update `.initiative-progress.json` in current workspace
  - Append formatted tool events to `recent_output` array
  - Keep last 20 items, drop oldest on overflow
  - Use atomic write operations

- `.ai/alpha/scripts/lib/feature.ts` - **Reference only** - Already appends initial 2 startup lines to output via stdout callback
  - No changes needed - this mechanism continues to work alongside file-based events

- `.ai/alpha/scripts/ui/index.tsx` - **Optional**: Remove dead code
  - Remove `handleWebSocketEvent` callback and `realtimeOutput` state if WebSocket events never materialize
  - Keep if team wants to preserve WebSocket capability for future use (recommended)

- `.ai/alpha/scripts/event-server.py` - **No changes** - Server continues to run and broadcast (redundant but harmless)

### New Files

No new files required. Using existing `.initiative-progress.json` structure.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Understand Current Progress File Structure

<describe what this step accomplishes>

- Review `.initiative-progress.json` schema in `.ai/alpha/scripts/ui/types.ts` (lines 353)
- Verify `recent_output: string[]` field exists in `SandboxProgressFile` interface
- Confirm orchestrator polling mechanism in `feature.ts` handles this field
- Understand how stdout callback currently populates initial 2 lines

**Why this step first**: Must understand the target data structure before modifying hook to write to it.

#### Step 2: Modify event_reporter.py to Write to Progress Files

<describe what this step accomplishes>

The hook runs inside the E2B sandbox. It needs to:
1. Detect current workspace/sandbox context
2. Find `.initiative-progress.json` in the workspace
3. Read current JSON (or create if missing)
4. Parse and append to `recent_output` array
5. Keep only last 20 items (FIFO rotation)
6. Write atomically back to file
7. Still exit silently on any error (critical - don't block Claude)

**Implementation details**:

```python
# In event_reporter.py:

def find_progress_file() -> str | None:
    """Find .initiative-progress.json in workspace or sandboxed project."""
    # Check common locations
    candidates = [
        '.initiative-progress.json',
        '/home/user/project/.initiative-progress.json',
        os.path.expanduser('~/.initiative-progress.json'),
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    return None

def format_event_for_output(event: dict) -> str | None:
    """Format event for output display (matching UI formatting)."""
    tool_name = event.get('tool_name')
    if not tool_name:
        return None

    # Mirror emoji mapping from UI (ui/index.tsx line 91-104)
    TOOL_DISPLAY = {
        'Read': '📖 Read',
        'Write': '📝 Write',
        'Edit': '✏️ Edit',
        'Bash': '💻 Bash',
        'Grep': '🔍 Grep',
        'Glob': '📁 Glob',
        'TodoWrite': '📋 Todo',
        'Task': '🤖 Task',
        'WebFetch': '🌐 WebFetch',
        'WebSearch': '🔎 Search',
        'AskUserQuestion': '❓ AskUser',
        'LSP': '🔧 LSP',
    }

    display_name = TOOL_DISPLAY.get(tool_name, f'🔧 {tool_name}')

    # Add file path if available
    if event.get('file_path'):
        path = event['file_path']
        short_path = path.split('/')[-1] if '/' in path else path
        if len(path) > 40:
            short_path = short_path or path
        return f'{display_name}: {short_path}'

    # Add todo summary if available
    if event.get('todo_summary'):
        summary = event['todo_summary']
        return f'{display_name}: {summary["completed"]}/{summary["total"]} done'

    return display_name

def update_progress_file(new_output: str) -> bool:
    """Append output line to progress file's recent_output array."""
    try:
        progress_file = find_progress_file()
        if not progress_file:
            return False

        # Read existing progress
        with open(progress_file, 'r') as f:
            progress = json.load(f)

        # Initialize recent_output if missing
        if 'recent_output' not in progress:
            progress['recent_output'] = []

        # Append new output
        progress['recent_output'].append(new_output)

        # Keep only last 20 items
        if len(progress['recent_output']) > 20:
            progress['recent_output'] = progress['recent_output'][-20:]

        # Atomic write
        temp_file = f'{progress_file}.tmp'
        with open(temp_file, 'w') as f:
            json.dump(progress, f)
        os.replace(temp_file, progress_file)

        return True
    except Exception:
        return False

def main():
    """Main entry point."""
    # Try to read input
    try:
        input_data = json.load(sys.stdin)
    except:
        sys.exit(0)

    # Format and update progress file (primary method)
    output_line = format_event_for_output(input_data)
    if output_line:
        update_progress_file(output_line)

    # Keep HTTP POST as fallback (in case orchestrator is accessible)
    orchestrator_url = get_orchestrator_url()
    if orchestrator_url:
        event = build_event(input_data)
        post_event(orchestrator_url, event)

    # Always exit 0 (don't block Claude)
    sys.exit(0)
```

**Why this step critical**: Enables the core fix mechanism - writing events to accessible files instead of unreachable network

#### Step 3: Verify `.initiative-progress.json` is Writable

<describe what this step accomplishes>

- Ensure hook can find and write to progress file in all environments
- Verify file is created by orchestrator before hook runs
- Test atomic write operations work correctly
- Confirm JSON structure is compatible with polling code

**Implementation details**:

- Hook should handle missing file gracefully (create if needed, or skip)
- Test with both absolute and relative paths
- Verify permissions don't block writes

#### Step 4: Remove Dead Code (Optional but Recommended)

<describe what this step accomplishes>

- Remove WebSocket event handling code from UI since HTTP POST events won't materialize
- Or keep it for future use if team wants WebSocket capability
- Update comments to explain why HTTP POST is disabled but event server still runs

**Files affected**:
- `.ai/alpha/scripts/ui/index.tsx` - Remove `handleWebSocketEvent`, `realtimeOutput` state, WebSocket integration (lines 76-150)

**Why optional**: WebSocket infrastructure remains useful if team wants to add event streaming in future via ngrok or other tunnel mechanism.

#### Step 5: Add Tests to Prevent Regression

<describe what this step accomplishes>

- Unit test `format_event_for_output` with various tool names
- Unit test `update_progress_file` writes correctly
- Unit test file rotation (keep last 20 items)
- Integration test with real progress file
- Test that hook still exits silently on file errors

**Test location**:
- `.claude/hooks/test_event_reporter.py` - New test file with pytest tests

#### Step 6: Validation

- Run all validation commands (see Validation Commands section)
- Verify zero regressions
- Test all edge cases
- Confirm bug is fixed

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `format_event_for_output()` with each tool type (Read, Write, Edit, Bash, etc.)
- ✅ `format_event_for_output()` with file paths (various lengths)
- ✅ `format_event_for_output()` with todo summaries
- ✅ `update_progress_file()` with missing file (should create or skip gracefully)
- ✅ `update_progress_file()` with existing progress
- ✅ Array rotation: Keep only last 20 items when adding beyond limit
- ✅ Edge case: Empty input data
- ✅ Edge case: Tool without name
- ✅ Regression test: Hook exits silently even on file errors (never blocks Claude)
- ✅ Regression test: Invalid JSON in existing file is handled

**Test files**:
- `.claude/hooks/test_event_reporter.py` - Full unit test suite with pytest

### Integration Tests

- Hook is called during `PostToolUse` events while Claude Code runs
- Progress file is updated with correct format
- Multiple consecutive tool calls result in queue growth (last 20 kept)
- Progress polling in orchestrator picks up updated events

**Test approach**:
- Run orchestrator with debug logging enabled
- Monitor progress file for updates
- Verify UI displays tool activity in real-time

### E2E Tests (Optional)

- Full orchestrator run with multiple sandboxes
- UI displays tool activity for each sandbox
- Output stops and starts correctly as tools execute

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
- [ ] Wait for sandboxes to start
- [ ] Observe sandbox columns in UI
- [ ] Verify "Output:" section updates with tool activity
- [ ] Verify emoji icons match tool types (📖 for Read, 📝 for Write, etc.)
- [ ] Kill orchestrator and restart - output history preserved in file
- [ ] Test with multiple concurrent sandboxes - each shows own output
- [ ] Verify no errors in orchestrator logs
- [ ] Verify hook errors don't block Claude execution

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **File System Contention**: Multiple hooks writing to same progress file simultaneously
   - **Likelihood**: medium (parallel hook execution is possible)
   - **Impact**: medium (could corrupt JSON or lose writes)
   - **Mitigation**: Use atomic writes via temp file + os.replace(), which is atomic on all OS; File locking if needed

2. **File Not Found**: Hook can't locate `.initiative-progress.json`
   - **Likelihood**: low (file created by orchestrator before work starts)
   - **Impact**: medium (tool activity not displayed)
   - **Mitigation**: Hook gracefully skips if file missing, doesn't error

3. **Permission Denied**: Hook can't write to progress file
   - **Likelihood**: low (sandbox has write access to workspace)
   - **Impact**: high (tool activity silenced)
   - **Mitigation**: Use proper file permissions, test in sandbox environment

4. **JSON Corruption**: Hook writes invalid JSON
   - **Likelihood**: low (using standard json library)
   - **Impact**: high (UI polling breaks)
   - **Mitigation**: Atomic writes, valid JSON library, test with large outputs

5. **Hook Still Called but File Still Unreachable**: Sandbox filesystem isn't where we expect
   - **Likelihood**: low (file path discovery handles common locations)
   - **Impact**: medium (reverts to empty output)
   - **Mitigation**: Test path discovery in actual E2B environment

**Rollback Plan**:

If file-based updates cause issues:

1. Disable `event_reporter.py` hook (comment out in slash command)
2. UI reverts to stdout-only output (2 initial lines - status quo before this fix)
3. Revert hook code changes: `git checkout .claude/hooks/event_reporter.py`
4. Redeploy sandboxes
5. Investigate root cause and iterate

**Monitoring** (if needed):

- Monitor progress file modification time - should update every few seconds during execution
- Watch for file size growth (should stay <10KB with 20-item rotation)
- Log any file write errors in hook stderr for debugging

## Performance Impact

**Expected Impact**: minimal

- File I/O is much faster than HTTP POST (eliminated network latency, connection overhead)
- JSON writes are small (~50-100 bytes per line)
- File polling interval unchanged (5 seconds)
- No additional network traffic
- Reduced event server CPU usage (no HTTP processing)

**Performance Testing**:

- Measure hook execution time before/after (should be similar or faster)
- Measure file write latency (should be <10ms)
- Verify no file I/O contention with other operations

## Security Considerations

**Security Impact**: none

The fix actually improves security:
- Eliminates HTTP exposure of event server (even if localhost)
- Uses only local file operations (no network attack surface)
- Progress files already readable by orchestrator via E2B API
- Hook still fails silently - no sensitive error leakage

**Security checklist**:
- ✅ No new network endpoints
- ✅ File operations use safe APIs (json library, atomic writes)
- ✅ No sensitive data in progress file (already readable)
- ✅ Hook errors don't leak to user (silent exit)

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start orchestrator and observe output
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# In UI, check sandbox columns - output shows only 2 initial lines:
# Output:
# Using OAuth authentication...
# Running Claude Code with ...
# (never updates with tool activity)
```

**Expected Result**: UI shows stale output, tool activity never appears

### After Fix (Bug Should Be Resolved)

```bash
# Start orchestrator
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# In UI, check sandbox columns - output updates in real-time:
# Output:
# 📖 Read: dashboard.ts
# 📝 Write: loader.ts
# 💻 Bash: pnpm typecheck
# (etc.)

# Run validation suite
pnpm typecheck      # Type check passes
pnpm lint          # Linting passes
pnpm format        # Format check passes
pytest .claude/hooks/test_event_reporter.py  # Unit tests pass
```

**Expected Result**: All commands succeed, UI shows real-time tool activity, zero regressions

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# E2E tests for orchestrator
pnpm --filter e2e test:orchestrator

# Verify hook still exits silently
.claude/hooks/event_reporter.py <<< '{"broken": "json"}'  # Should exit 0

# Verify file safety
# (test concurrent writes don't corrupt file)
```

## Dependencies

**No new dependencies required**

The fix uses only standard library:
- Python `json` library (built-in)
- Python `os` library (built-in)
- File operations (built-in)

No npm packages added. Existing dependencies:
- fastapi/uvicorn (event server) - continues to run but is now optional
- WebSocket libraries (UI) - continue to work as fallback

## Database Changes

**No database changes required**

Uses existing `.initiative-progress.json` file structure in sandboxes. No schema changes needed.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- Update `.claude/hooks/event_reporter.py` on next hook sync
- No infrastructure changes required
- No configuration changes needed
- Event server can remain running (or be stopped, doesn't matter)

**Feature flags needed**: no

**Backwards compatibility**: maintained

- Old orchestrator versions will ignore new `recent_output` entries gracefully
- New orchestrator versions work with old progress files
- Hook still exits silently - no behavioral changes externally visible

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] UI displays tool activity in real-time for all sandboxes
- [ ] No WebSocket errors in browser console
- [ ] Hook doesn't block Claude execution (silent failures)
- [ ] File-based output persists across orchestrator restarts
- [ ] No file system corruption with concurrent writes
- [ ] Zero regression in other functionality
- [ ] Code review approved (if applicable)
- [ ] Manual testing checklist complete

## Notes

### Why This Approach Is Right

The fundamental constraint is that E2B sandboxes are isolated cloud VMs - they can't reach the developer's local machine. This is a feature, not a bug. Instead of fighting this architecture with tunnels or reverse proxies, we should embrace it.

SlideHeroes already has a proven pattern for this: progress files that the orchestrator polls via E2B's APIs. Heartbeats work this way successfully. We're just extending it to include tool activity.

### File Safety

The hook uses atomic writes via temp file + `os.replace()`, which is:
- **Atomic on Linux/macOS**: `rename()` is atomic
- **Atomic on Windows**: Python 3.8+ `os.replace()` handles this
- **Race-condition safe**: Multiple writers can't corrupt file

### Why Not Remove Event Server?

The event server infrastructure might be useful in future for:
- Exposing events to external monitoring systems
- Future WebSocket integration via tunnels
- Event archival/analysis

So we keep it running but no longer dependent on it. Hook tries file first, then HTTP (fallback). Eventually event server becomes optional.

### Why Keep Output Limited to 20 Items?

- Trade-off between visibility and file size
- UI only shows last 3 lines anyway (`.slice(-3)`)
- 20 items = ~2-5KB JSON (very small)
- More than 20 is excessive for progress display

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1438*
