# Bug Diagnosis: Claude CLI Startup Hang in E2B Sandboxes (Consolidated)

**ID**: ISSUE-pending
**Created**: 2026-01-13T21:45:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

Claude Code CLI consistently hangs during startup in E2B sandboxes, producing only 2 lines of output ("Using OAuth authentication (Max plan)" and "Running Claude Code with prompt: /alpha:implement XXXX") before becoming unresponsive. The retry mechanism (3 attempts with exponential backoff) is working correctly but cannot overcome the underlying startup failure. All 3 retry attempts fail identically, suggesting an environmental or authentication issue rather than a timing problem.

## Environment

- **Application Version**: dev branch (commit 150902a3b)
- **Environment**: E2B cloud sandboxes
- **E2B Template**: slideheroes-claude-agent-dev
- **Claude Code CLI**: Invoked via `run-claude` script with `unbuffer` for PTY allocation
- **Node Version**: 20.x (in sandbox)
- **Authentication**: OAuth (Max plan)
- **Last Working**: Intermittent - some sessions succeed, ~64% fail

## Reproduction Steps

1. Run the spec orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
2. Observe that 3 sandboxes are created and assigned features
3. Wait for Claude CLI to start in each sandbox
4. Observe that sandboxes produce only 2 lines of output then hang
5. Wait 60+ seconds for startup timeout detection to trigger
6. Observe that retry attempts (up to 3) all fail identically
7. Check logs - files show retry markers but all attempts produce same 2 lines

## Expected Behavior

Claude CLI should:
1. Start up successfully within 60 seconds
2. Begin processing the `/alpha:implement` slash command
3. Produce output showing task progress, tool calls, and heartbeats
4. If startup fails, retry mechanism should eventually succeed (at least 1 of 3 attempts)

## Actual Behavior

Claude CLI:
1. Outputs 2 lines ("Using OAuth authentication", "Running Claude Code with prompt:")
2. **HANGS** - no further output for 60+ seconds
3. Gets killed by startup timeout detection
4. Retry attempts (all 3) fail in exactly the same way
5. Feature is marked as failed after exhausting retries
6. Cycle repeats when orchestrator reassigns the feature

## Diagnostic Data

### Log File Evidence

```
// sbx-c-2026-01-13T21-23-12-974Z.log (latest run)
Using OAuth authentication (Max plan)
Running Claude Code with prompt: /alpha:implement 1376

=== WAITING 5s BEFORE RETRY ===

=== RETRY ATTEMPT 2/3 ===
Using OAuth authentication (Max plan)
Running Claude Code with prompt: /alpha:implement 1376

=== WAITING 10s BEFORE RETRY ===

=== RETRY ATTEMPT 3/3 ===
Using OAuth authentication (Max plan)
Running Claude Code with prompt: /alpha:implement 1376
[EOF - no further output]
```

### Log File Analysis (2026-01-13)

```
Total log files from today: 59
Log files from 21:00-21:10 window: 21 (all 3 sandboxes × ~7 cycles each)
Each log file: 2-3 lines (93 bytes) before retry markers

Pattern: Sandboxes cycling through startup attempts ~every minute
- 60s startup timeout
- 5s, 10s delays between retries
- All retries fail identically
```

### Progress File State (When Working)

```json
// sbx-c-progress.json (current - sandboxes eventually started working)
{
  "status": "running",
  "feature": "#1376 Kanban Summary Card",
  "tasks_total": 6,
  "tasks_completed": 0,
  "last_heartbeat": "2026-01-13T21:26:54.231Z"
}
```

## Error Stack Traces

No explicit errors - Claude CLI hangs silently without producing output after the initial 2 lines.

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/feature.ts:305-428` - Retry loop (WORKING correctly)
  - `.ai/alpha/scripts/lib/startup-monitor.ts` - Startup detection (WORKING correctly)
  - `packages/e2b/e2b-template/template.ts` - `run-claude` script definition
  - `.claude/commands/alpha/implement.md` - Slash command executed in sandbox

- **Recent Commits**:
  - `150902a3b` - fix(tooling): implement startup retry loop for Alpha sandboxes
  - `75052b277` - fix(tooling): add startup timeout and retry logic for Alpha sandboxes

- **Run-Claude Script**:
  ```bash
  unbuffer bash -c "echo \"$1\" | claude -p --setting-sources user,project --dangerously-skip-permissions"
  ```

## Related Issues & Context

### Direct Predecessors
- #1444 - Bug Diagnosis: Alpha Sandbox Hanging/Failing (64% failure rate identified)
- #1446 - Bug Diagnosis: Alpha Startup Retry Loop Not Implemented (now fixed)
- #1447 - Implementation: Startup Retry Loop (verified working)

### Research Findings

**From E2B SDK Documentation (via Context7):**
1. PTY allocation via `sandbox.pty.create()` may be more reliable than `unbuffer`
2. Environment variables like `CI=true`, `NO_COLOR=1`, `TERM=dumb` can help non-interactive execution
3. Authentication should be pre-configured via environment variables
4. `stdbuf` does NOT work with Node.js processes (they manage own buffering)

**From Perplexity Research:**
1. OAuth tokens may have session limits for concurrent connections
2. Multiple sandboxes starting simultaneously can trigger rate limiting
3. API key authentication is more reliable for automated systems

## Root Cause Analysis

### Identified Root Cause

**Summary**: Claude CLI hangs during API initialization or OAuth token validation in the E2B sandbox environment. The retry mechanism is working but cannot overcome the underlying environmental issue.

**Detailed Explanation**:

The hang occurs AFTER:
1. ✅ Claude CLI is invoked via `run-claude` script
2. ✅ OAuth authentication is detected ("Using OAuth authentication (Max plan)")
3. ✅ Prompt is received ("Running Claude Code with prompt: /alpha:implement XXXX")

The hang occurs BEFORE:
- ❌ Any Claude output (no tool calls, no slash command loading, no progress)
- ❌ Progress file creation
- ❌ Heartbeat updates

This narrow window suggests the issue is in one of:

1. **OAuth Token Validation**
   - Multiple concurrent OAuth sessions may hit session limits
   - Token refresh may fail silently in headless environment
   - OAuth callback may timeout waiting for something

2. **API Connection Establishment**
   - E2B sandbox network latency or firewall rules
   - API rate limiting when 3 sandboxes start Claude simultaneously
   - Connection pooling issues with concurrent sessions

3. **Slash Command Loading**
   - `/alpha:implement` command parsing may hang
   - File system access to read command definition may be slow
   - Large command file may cause parsing delay

4. **PTY/Terminal Issues**
   - `unbuffer` may not properly allocate PTY in E2B container
   - Claude CLI may be waiting for TTY input that never comes
   - Output buffering despite `unbuffer` wrapper

**Supporting Evidence**:
- All 3 retries fail identically (rules out transient timing issues)
- Sandboxes eventually start working (rules out permanent configuration issues)
- 64% failure rate is consistent (suggests rate limiting or session limits)
- Multiple sandboxes fail simultaneously then recover together

### How This Causes the Observed Behavior

1. **Sandbox Creation** → 3 sandboxes created with 30s stagger ✅
2. **Feature Assignment** → Each sandbox gets a feature ✅
3. **Claude Invocation** → `run-claude` script executes ✅
4. **OAuth Check** → CLI outputs "Using OAuth authentication" ✅
5. **Prompt Received** → CLI outputs "Running Claude Code with prompt:" ✅
6. **API Initialization** → **HANG** - CLI waits indefinitely ❌
7. **Timeout Detection** → 60 seconds pass, startup hang detected ✅
8. **Process Kill** → `killClaudeProcess()` terminates Claude ✅
9. **Retry Attempt** → Loop waits (5s, 10s) and retries ✅
10. **Retry Fails** → Same hang pattern on attempts 2 and 3 ❌
11. **Feature Failed** → After 3 attempts, feature marked failed ✅
12. **Reassignment** → Orchestrator eventually reassigns feature

### Confidence Level

**Confidence**: High

**Reasoning**:
- The retry loop is verified working (log files show retry markers)
- All retries fail identically (eliminates transient issues as root cause)
- The hang point is consistent (after 2 lines, before any Claude output)
- Issue is intermittent but severe when occurring
- Eventually resolves without code changes (suggests external factor)

## Fix Approach (High-Level)

### Immediate Mitigations

1. **Increase Sandbox Stagger Time**
   - Current: 30 seconds between sandbox creation
   - Proposed: 45-60 seconds to reduce API concurrent load
   - File: `.ai/alpha/scripts/config/constants.ts:SANDBOX_STAGGER_DELAY_MS`

2. **Add Pre-Authentication Health Check**
   - Before invoking Claude, verify OAuth token is valid
   - Use `claude --version` as lightweight health check
   - Fail fast if token validation fails

3. **Use PTY Instead of unbuffer**
   - E2B SDK provides native `sandbox.pty.create()` API
   - More reliable than wrapping with `unbuffer` command
   - Better output streaming behavior

### Medium-Term Fixes

4. **Switch to API Key Authentication**
   - OAuth has session limits and refresh complexity
   - API keys are simpler and more reliable for automation
   - Set `ANTHROPIC_API_KEY` environment variable in sandbox

5. **Add Startup Health Signal**
   - Claude CLI should output a "ready" signal within 30 seconds
   - Detection can key off this instead of arbitrary byte count
   - More robust than counting output lines

6. **Implement Circuit Breaker Pattern**
   - If all 3 sandboxes fail startup, pause and wait 5 minutes
   - Prevents rapid cycling that may exacerbate rate limiting
   - Alert user that system is in degraded state

## Diagnosis Determination

The root cause is **Claude CLI hanging during API initialization** in the E2B sandbox environment. This is NOT a retry mechanism bug (which is working correctly) but an underlying environmental issue likely caused by:

1. OAuth session limits with concurrent sandbox connections
2. API rate limiting when multiple sandboxes start simultaneously
3. PTY allocation issues with `unbuffer` in containerized environments

The fix requires a multi-pronged approach:
1. Reduce concurrent load (longer stagger)
2. Improve terminal handling (native PTY API)
3. Simplify authentication (API key instead of OAuth)
4. Add circuit breaker for graceful degradation

## Additional Context

- Retry mechanism was added in commit `150902a3b` and is **verified working**
- Previous diagnosis (#1446) incorrectly identified missing retry loop as root cause
- The actual issue is that retry cannot overcome the underlying startup failure
- Sandboxes eventually start working, suggesting external rate limits or quotas that reset over time

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Glob, Bash, Task (context7-expert, perplexity-expert)*
*Research Reports: .ai/alpha/research/e2b-cli-execution.md, .ai/alpha/research/e2b-cli-hanging-research.md*
