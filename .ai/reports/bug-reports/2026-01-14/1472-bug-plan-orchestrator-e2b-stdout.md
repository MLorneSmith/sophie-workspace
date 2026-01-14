# Bug Fix: Alpha Orchestrator E2B stdout Disconnect - PTY Buffering Issue

**Related Diagnosis**: #1469 (REQUIRED)
**Severity**: critical
**Bug Type**: regression
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: E2B `commands.run()` does NOT allocate a pseudo-terminal, causing Node.js CLI tools (Claude Code) to detect `isTTY === false` and use block-buffering instead of line-buffering. This causes stdout to be delayed or empty until the process exits.
- **Fix Approach**: Migrate from `sandbox.commands.run()` to `sandbox.pty.create()` which allocates a full pseudo-terminal for real-time interactive CLI output
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Orchestrator exits prematurely at ~5-6 minutes into execution because the startup hang detection incorrectly marks processes as "hung" even though they are actively working.

The root cause: E2B's `commands.run()` callback is NOT receiving Claude CLI output due to output buffering when no TTY is present. The startup tracker detects fewer than 5 output lines in 60 seconds and incorrectly classifies this as a hung process, triggering failed retries. Meanwhile, progress JSON files show the sandboxes ARE working (heartbeats, completed tasks, output visible).

**Evidence from diagnosis**:
- Progress files: `last_heartbeat`, `completed_tasks`, `recent_output` all show sandbox IS active ✓
- Log files: NO captured stdout - only retry messages ✗
- This disconnect causes false-positive startup hang detection after 60s

**Technical Root Cause**:
- `sandbox.commands.run()` does NOT create a pseudo-terminal
- Claude Code detects `process.stdout.isTTY === false`
- Without TTY, output is **block-buffered** (4KB buffer, only flushes on exit)
- `onStdout` callback receives no data until process exits
- Startup tracker sees <5 lines in 60s → false positive "hung" detection

For full details, see diagnosis issue #1469.

### Solution Approaches Considered

#### Option 1: Switch to `sandbox.pty.create()` ⭐ RECOMMENDED

**Description**: Replace `sandbox.commands.run()` with E2B's `sandbox.pty.create()` API which allocates a full pseudo-terminal. This forces Claude Code to detect `isTTY === true` and use line-buffered output, enabling real-time streaming through `onData` callback.

**Pros**:
- ✅ Directly fixes root cause (TTY allocation)
- ✅ Real-time character-level output streaming
- ✅ Matches E2B's recommended approach for interactive CLI tools
- ✅ Enables color output and other TTY features
- ✅ Supported by E2B SDK with documented examples
- ✅ Comprehensive control over PTY size, env vars, working directory
- ✅ Eliminates timeout/buffering issues completely

**Cons**:
- Requires refactoring output handling (from `onStdout` callback to `onData` event)
- Need to handle PTY lifecycle (create, send input, wait, kill)
- Slightly more complex setup than `commands.run()`

**Risk Assessment**: **medium** - E2B SDK is stable, PTY API is well-documented, refactoring is localized to `feature.ts`. Real-time output will improve reliability.

**Complexity**: **moderate** - Requires changes to output handling logic but is straightforward migration from E2B examples.

#### Option 2: Use `stdbuf` to Force Line Buffering

**Description**: Wrap the Claude Code command with `stdbuf -oL` to force line-buffering even without TTY.

```bash
stdbuf -oL run-claude "prompt"
```

**Pros**:
- Minimal code changes
- Works with existing `commands.run()` API
- No refactoring needed

**Cons**:
- ❌ Workaround, not a fix (doesn't allocate TTY)
- ❌ May not work reliably in all environments
- ❌ Claude Code may detect missing TTY for other reasons (colors, interactive features)
- ❌ E2B documentation doesn't recommend this approach

**Why Not Chosen**: This is a bandaid workaround. The real issue is no TTY. While it might improve output capture, it won't fix the underlying design conflict between interactive CLI tools and non-TTY execution. E2B explicitly recommends PTY for interactive tools.

#### Option 3: Use `script` Command for PTY Allocation

**Description**: Use the `script` command to allocate a pseudo-terminal before running Claude Code.

```bash
script -q -c "run-claude prompt" /dev/null
```

**Pros**:
- Minimal code changes
- Compatible with `commands.run()`

**Cons**:
- ❌ Workaround, not ideal solution
- ❌ `script` behavior varies across systems
- ❌ Adds another layer of indirection
- ❌ Not officially supported by E2B

**Why Not Chosen**: Less reliable than proper PTY API. E2B provides native PTY support which is the right solution.

#### Option 4: File-Watching Fallback

**Description**: Redirect Claude Code output to a file and watch it with E2B's file watcher API instead of relying on stdout callback.

```bash
run-claude "prompt" | tee /tmp/output.log
```

**Pros**:
- Decouples output capture from process stdout
- Works with existing `commands.run()`

**Cons**:
- ❌ Adds file I/O overhead
- ❌ More complex tracking logic
- ❌ Still doesn't solve underlying issue (no TTY)
- ❌ Additional failure points (file sync timing)

**Why Not Chosen**: Not recommended by E2B. Creates unnecessary complexity without addressing root cause. PTY API is the native solution.

### Selected Solution: Switch to `sandbox.pty.create()`

**Justification**:

This is the recommended approach from E2B SDK documentation and resolves the root cause completely:

1. **Directly fixes the issue**: Allocates a real TTY, forcing line-buffered output
2. **Matches E2B best practices**: Documented in E2B guides for CLI tools
3. **Real-time output**: Character-level streaming enables accurate startup detection
4. **Minimal risk**: E2B SDK is stable, refactoring is localized to `feature.ts`
5. **Future-proof**: Enables TTY features (colors, interactive prompts) for future CLI enhancements
6. **Clean code**: Replaces problematic `commands.run()` with proper API

**Technical Approach**:

1. Replace `sandbox.commands.run()` with `sandbox.pty.create()`
2. Set up PTY with proper environment variables and dimensions
3. Send command via `pty.sendInput()`
4. Stream output via `onData` callback (same pattern as stdout, just different event source)
5. Update startup detection to work with PTY output
6. Handle PTY cleanup and error cases

**Architecture Changes**:

The only architectural change is how output is captured from the sandbox:

```
BEFORE:
sandbox.commands.run()
  → process.stdout (block-buffered, empty)
  → onStdout callback (no data received)
  → startup detection fails

AFTER:
sandbox.pty.create()
  → process.stdout (line-buffered via TTY)
  → onData callback (real-time data received)
  → startup detection succeeds
```

This is a direct replacement - same functionality, better output streaming.

**Migration Strategy**:

Since `commands.run()` was the only interface using `onStdout`, migration is straightforward:
1. All reference updates are localized to `.ai/alpha/scripts/lib/feature.ts`
2. No downstream code changes needed (output handling stays the same)
3. Backward compatibility: This improves reliability without breaking existing contracts

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/feature.ts:390-437` - `onStdout` callback replaced with PTY-based output handling
- `.ai/alpha/scripts/lib/feature.ts:299-343` - Startup hang detection already works with output, no changes needed
- `.ai/alpha/scripts/lib/feature.ts` - Add PTY creation and lifecycle management

### New Files

None - all changes are within existing feature.ts

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Understand Current Implementation

**Deliverable**: Detailed understanding of existing `commands.run()` usage

- [ ] Read current `feature.ts` implementation (lines 390-437)
- [ ] Understand the `onStdout` callback contract
- [ ] Understand how `capturedStdout` is populated and used
- [ ] Review startup hang detection logic (lines 299-343)
- [ ] Identify all references to `commands.run()` in the file

**Why this step first**: Need to understand existing behavior before refactoring

#### Step 2: Create PTY-Based Output Handler

**Deliverable**: New function `runFeatureWithPTY()` that mirrors existing behavior but uses PTY

- [ ] Create new function with same signature as the command execution code
- [ ] Use `sandbox.pty.create()` instead of `commands.run()`
- [ ] Set up PTY environment variables properly:
  - `TERM: 'xterm-256color'` for color support
  - `FORCE_COLOR: '1'` to enable colored output
  - `CI: 'false'` to disable CI detection
  - `ANTHROPIC_API_KEY` or OAuth token as configured
- [ ] Configure PTY size: `cols: 120, rows: 40`
- [ ] Set working directory to `WORKSPACE_DIR`
- [ ] Implement `onData` callback to capture output (same logic as `onStdout`)
- [ ] Send command: `await pty.sendInput(Buffer.from("${prompt}\\n"))`
- [ ] Wait for completion: `await pty.wait()`
- [ ] Clean up: `await pty.kill()`

**Why this step second**: Create new implementation alongside existing code for safety

#### Step 3: Update Startup Detection

**Deliverable**: Verify startup detection works with PTY output (may need no changes)

- [ ] Review startup hang detection logic in `updateOutputTracker()` (lines 299-343)
- [ ] Verify it works with streaming `onData` output
- [ ] If needed, adjust timeout/threshold values based on PTY output patterns
- [ ] Test that real output is detected and false positives are prevented

**Why this step third**: Ensure detection logic works with new output source

#### Step 4: Replace `commands.run()` Implementation

**Deliverable**: Migrate to PTY-based execution

- [ ] Replace `sandbox.commands.run()` call with new PTY implementation
- [ ] Update all references to callback handlers
- [ ] Ensure `capturedStdout` is still populated correctly
- [ ] Verify error handling still works

**Why this step fourth**: Only replace after new implementation is proven

#### Step 5: Add Comprehensive Logging

**Deliverable**: Detailed logs for debugging PTY issues

- [ ] Log PTY creation with configuration
- [ ] Log all output received (debug level)
- [ ] Log PTY errors and cleanup
- [ ] Add markers to log when command starts/ends
- [ ] Ensure logs capture any output that might be missed

**Why this step fifth**: Logging helps catch edge cases during testing

#### Step 6: Add Tests for PTY Output Handling

**Deliverable**: Unit and integration tests for new implementation

- [ ] Unit test: PTY is created with correct configuration
- [ ] Unit test: Output callback is called with data
- [ ] Unit test: Startup detection works with PTY output
- [ ] Integration test: E2B sandbox with real Claude Code execution
- [ ] Test edge case: Empty output (should be detected)
- [ ] Test edge case: Slow startup (output arrives in chunks)
- [ ] Test edge case: PTY errors are handled gracefully

#### Step 7: Validate Against Diagnosis Requirements

**Deliverable**: Confirm fix addresses all issues from diagnosis

- [ ] Verify progress JSON files are still updated correctly
- [ ] Verify startup detection now receives real output
- [ ] Verify no more false-positive "hung" detection
- [ ] Verify orchestrator runs longer than 6 minutes
- [ ] Verify all three sandboxes complete successfully

#### Step 8: Run Full Orchestrator Test

**Deliverable**: Complete orchestrator run without premature exit

- [ ] Run full `/alpha:implement` workflow
- [ ] Monitor for the ~6 minute exit issue
- [ ] Verify all features complete successfully
- [ ] Confirm no regressions in output or error handling
- [ ] Check logs for any PTY-related warnings or errors

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ PTY creation with correct environment variables
- ✅ PTY creation with correct working directory
- ✅ Output callback receives data from PTY
- ✅ Startup detection identifies real output correctly
- ✅ Startup detection avoids false positives
- ✅ PTY error handling (create failures, data errors)
- ✅ PTY cleanup (kill, resource cleanup)
- ✅ Timeout handling with PTY

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/feature.pty.spec.ts` - PTY functionality

### Integration Tests

**Test file**: `.ai/alpha/scripts/lib/__tests__/feature.integration.spec.ts`

- ✅ E2B sandbox PTY creation and execution
- ✅ Real Claude Code execution with output capture
- ✅ Complete feature implementation via PTY
- ✅ Multiple concurrent PTYs (all three orchestrator sandboxes)
- ✅ Long-running command (verify no premature exit)

### E2E Tests

**Test scenario**: Full Alpha Orchestrator run

- ✅ Execute `/alpha:implement` with new PTY implementation
- ✅ Monitor execution for ~10+ minutes
- ✅ Verify all three sandboxes complete
- ✅ Verify no features are killed prematurely
- ✅ Verify output is captured and logged correctly

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Create test E2B sandbox
- [ ] Run simple Claude Code command via PTY
- [ ] Verify output appears in real-time in logs
- [ ] Run `/alpha:implement` for a single small feature
- [ ] Monitor logs for normal startup detection
- [ ] Run full `/alpha:implement` workflow (~30 min)
- [ ] Verify no 6-minute exit issue
- [ ] Verify all three sandboxes complete successfully
- [ ] Check logs for any PTY-related errors or warnings
- [ ] Verify progress JSON files update correctly
- [ ] Test interruption/cancellation still works
- [ ] Verify error handling (sandbox timeouts, crashes, etc.)

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **PTY API Unfamiliarity**: Team may not be familiar with PTY lifecycle management
   - **Likelihood**: medium
   - **Impact**: medium (could miss edge cases, error handling)
   - **Mitigation**: Comprehensive comments in code, clear documentation, thorough testing

2. **Output Handling Changes**: PTY `onData` vs `onStdout` callback semantics differ
   - **Likelihood**: low
   - **Impact**: high (could lose output, miss startup detection)
   - **Mitigation**: Parallel testing with both approaches, comprehensive logging

3. **Performance Impact**: PTY overhead may add latency
   - **Likelihood**: low
   - **Impact**: low (orchestrator already slow, PTY overhead minimal)
   - **Mitigation**: Monitor execution time, add performance benchmarks

4. **Environment Variable Handling**: Missing env vars could cause failures
   - **Likelihood**: low
   - **Impact**: medium (Claude Code won't run properly)
   - **Mitigation**: Comprehensive env var setup, logging of all vars

5. **Timeout Handling**: PTY timeout semantics differ from `commands.run()`
   - **Likelihood**: low
   - **Impact**: medium (commands could hang instead of timeout)
   - **Mitigation**: Proper timeout setup, monitoring, fallback kill mechanism

6. **Concurrent PTY Sessions**: Three sandboxes running PTYs simultaneously
   - **Likelihood**: low
   - **Impact**: medium (resource contention, port conflicts)
   - **Mitigation**: Proper resource cleanup, monitoring of E2B limits

**Rollback Plan**:

If PTY migration causes critical issues:

1. Revert to previous `commands.run()` implementation
2. Keep startup hang detection (from #1465, #1467 fixes) - it's correct, just needs TTY
3. Increase STARTUP_TIMEOUT_MS as temporary workaround (gives more time for buffering)
4. Plan for alternative: Use file-watching approach if PTY has deeper issues
5. Investigation: Determine if PTY API issues or implementation bugs

**Monitoring** (post-deployment):

- Monitor orchestrator execution time: Should increase from ~5-6 min (premature exit) to normal completion
- Watch for PTY-related errors in logs
- Monitor E2B API quota usage (PTY may use different quota buckets)
- Alert on orchestrator exits before expected completion time

## Performance Impact

**Expected Impact**: minimal to positive

The fix should improve performance slightly:
- **Before**: False-positive startup detection → retries (1-3 failed attempts) → slow convergence
- **After**: Real-time output detection → correct startup detection → first attempt succeeds

Potential overhead from PTY is negligible compared to benefits.

**Performance Testing**:
- Measure orchestrator total execution time (should improve, not degrade)
- Measure startup detection accuracy (false positives should drop to near-zero)
- Monitor output capture latency (should be character-level, <100ms)

## Security Considerations

**Security Impact**: none

PTY usage is standard practice for interactive CLI tools. No new security implications:

- ✅ All environment variables are controlled (no injection risks)
- ✅ All input is from internal orchestrator code (no external input)
- ✅ PTY runs in E2B sandbox (already isolated)
- ✅ Working directory is restricted to workspace
- ✅ No new file access patterns

**Security review needed**: no
**Penetration testing needed**: no

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run orchestrator with current broken implementation
pnpm --filter ./.ai/alpha/scripts test:orchestrator

# Expected: Orchestrator exits around 5-6 minutes with error messages about startup hang
# Evidence: Logs show "Startup hang detected" for sandboxes that are actually working
# Evidence: Progress JSON files show sandbox IS active but orchestrator gives up
```

**Expected Result**: Orchestrator exits prematurely, startup hang detection triggers false positives

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests for PTY implementation
pnpm --filter ./.ai/alpha/scripts test -- feature.pty.spec

# Integration tests for orchestrator
pnpm --filter ./.ai/alpha/scripts test -- feature.integration.spec

# Full orchestrator test (long-running)
pnpm --filter ./.ai/alpha/scripts test:orchestrator

# Manual test: Create sandbox and run Claude Code
E2B_API_KEY=<key> pnpm --filter ./.ai/alpha/scripts run-cli sandbox feature "#1 test" --timeout 300

# Verify orchestrator runs to completion
# Monitor logs for normal startup detection
# Verify all three sandboxes complete
```

**Expected Result**: All commands succeed, orchestrator completes without premature exit, all validation passes

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Run orchestrator-specific tests multiple times
pnpm --filter ./.ai/alpha/scripts test:orchestrator

# Monitor for consistent successful completion
# Check that startup detection still works (doesn't time out on slow startups)
# Verify no performance degradation
```

## Dependencies

### New Dependencies

```bash
# No new npm dependencies required
# Only using existing E2B SDK PTY API

# Environment setup (already required):
# E2B_API_KEY - API key from e2b.dev/dashboard
# ANTHROPIC_API_KEY or CLAUDE_CODE_OAUTH_TOKEN - Claude authentication
```

**Dependencies added**: None - using existing E2B SDK v2.x

### Existing Dependencies Used

- `e2b` (SDK v2.x) - `sandbox.pty.create()`, `sandbox.pty.sendInput()`, `pty.wait()`, `pty.kill()`
- Node.js built-ins - `Buffer`, `Stream` handling

## Database Changes

**Migration needed**: no

**No database changes required** - This is a client-side output handling fix

## Deployment Considerations

**Deployment Risk**: low

This fix is localized to the Alpha Orchestrator, which is an internal development tool:

**Special deployment steps**:
- No special deployment needed
- Changes only affect `.ai/alpha/scripts/lib/feature.ts`
- No impact on production web application
- No impact on user-facing features

**Feature flags needed**: no

**Backwards compatibility**: maintained

- ✅ Fixes don't affect any external APIs
- ✅ Outputs are identical (just captured differently)
- ✅ Orchestrator behavior unchanged (except it now works correctly)
- ✅ No breaking changes to internal interfaces

## Success Criteria

The fix is complete when:

- [ ] All validation commands pass
- [ ] Orchestrator runs beyond 5-6 minutes without premature exit
- [ ] All three sandboxes complete successfully
- [ ] All tests pass (unit, integration, E2E)
- [ ] Zero regressions detected
- [ ] Startup hang detection works correctly (no false positives)
- [ ] Output is captured and logged correctly
- [ ] Code is well-documented and maintainable
- [ ] Performance is maintained or improved
- [ ] Manual testing checklist complete

## Notes

### Key Implementation Details

1. **PTY Configuration**: The environment setup is critical for Claude Code to work properly
   - `TERM=xterm-256color` enables proper terminal rendering
   - `FORCE_COLOR=1` enables colored output
   - `CI=false` prevents CI mode detection
   - All existing env vars must be passed through

2. **Output Callback Semantics**: PTY `onData` differs from `commands.run()` `onStdout`
   - Data arrives as Buffers, not strings
   - May arrive in chunks of varying sizes
   - Empty data means connection closed, not end of output
   - Must handle incomplete UTF-8 sequences (rare but possible)

3. **Startup Detection**: Current logic should work as-is
   - It counts output lines, which will work with PTY output
   - May need minor adjustments for timing (PTY is faster)
   - Threshold of <5 lines in 60s should still work

4. **Error Handling**: PTY has different failure modes than `commands.run()`
   - PTY creation can fail (resource limits, sandbox overload)
   - PTY data events can fail (disconnection, data corruption)
   - Process exit is separate from PTY cleanup
   - Must properly handle all failure cases

### Testing Strategy

The testing approach mirrors the implementation:
1. **Unit tests** for PTY mechanics (create, send, receive, cleanup)
2. **Integration tests** for end-to-end orchestrator behavior
3. **Manual tests** for real-world validation with E2B

### Related Issues and Documentation

- **Diagnosis Issue**: #1469 - Detailed root cause analysis with research
- **Related Fixes**: #1465 (health check timeout), #1467 (exit conditions)
- **E2B Research**: `.ai/reports/research-reports/2026-01-14/context7-e2b-realtime-stdout-streaming.md`
- **E2B Examples**: E2B documentation and GitHub examples for PTY usage

### Implementation Notes for Developer

When implementing, keep these points in mind:

1. **Review E2B PTY Examples**: E2B provides examples in their documentation and GitHub repos
2. **Test with Simple Commands First**: Start with `echo` commands before Claude Code
3. **Monitor Environment Variables**: Ensure all necessary vars are passed to PTY
4. **Log Everything During Development**: PTY issues can be subtle; logging helps
5. **Test Concurrent PTYs**: Orchestrator uses 3 concurrent sandboxes
6. **Handle Slow Output**: Some commands have slow startup; don't timeout too early

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1469*
