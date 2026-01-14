# Bug Diagnosis: Alpha Orchestrator Exits at ~6 Minutes Due to E2B stdout Disconnect

**ID**: ISSUE-1469
**Created**: 2026-01-14T18:30:00Z
**Reporter**: User
**Severity**: critical
**Status**: new
**Type**: bug

## Summary

The Alpha Orchestrator consistently exits prematurely at approximately 5-6 minutes into execution, even though sandboxes ARE producing output and making progress. The root cause is that E2B's `commands.run()` `onStdout` callback is not receiving Claude CLI output, causing the startup tracker to incorrectly detect "hung" processes and exhaust all retry attempts.

## Environment

- **Application Version**: dev branch (commit e43bc64f4)
- **Environment**: development
- **Node Version**: v20+
- **E2B Template**: slideheroes-claude-agent-dev
- **Last Working**: Unknown (issue persists across multiple fix attempts)

## Reproduction Steps

1. Run the Alpha Orchestrator with Spec #1362: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
2. Wait approximately 5-6 minutes
3. Observe orchestrator exits with all features still in_progress/pending

## Expected Behavior

- Orchestrator should continue running until features complete or genuinely fail
- Sandbox output should be captured in log files
- Startup retry logic should only trigger when Claude CLI genuinely hangs

## Actual Behavior

- Orchestrator exits at ~5-6 minutes
- Log files show ONLY retry attempt messages, no actual Claude CLI output
- Progress JSON files show sandboxes ARE active (heartbeats, tool calls visible)
- All 3 sandboxes exhaust 3 retry attempts simultaneously

## Diagnostic Data

### Console Output
```
Log files show only:
================================================================================
Alpha Orchestrator Log
Run ID: run-mkebo2er-qynk
Spec ID: 1362
Sandbox: sbx-a
Started: 2026-01-14T17:58:56.559Z
================================================================================
Using OAuth authentication (Max plan)
Running Claude Code with prompt: /alpha:implement 1367

=== WAITING 5s BEFORE RETRY ===

=== RETRY ATTEMPT 2/3 ===
Using OAuth authentication (Max plan)
Running Claude Code with prompt: /alpha:implement 1367

=== WAITING 10s BEFORE RETRY ===

=== RETRY ATTEMPT 3/3 ===
Using OAuth authentication (Max plan)
Running Claude Code with prompt: /alpha:implement 1367
```

NO actual Claude output captured despite sandboxes being active.

### Progress File Evidence (sbx-b-progress.json)
```json
{
  "sandbox_id": "iw2rck7sqheplocrc96a7",
  "runId": "run-mkebo2er-qynk",
  "feature": {
    "issue_number": 1373,
    "title": "Activity Database Schema"
  },
  "current_task": {
    "id": "T3",
    "name": "T3: Add RLS policies for user_activities",
    "status": "in_progress",
    "started_at": "2026-01-14T18:02:16.299157Z"
  },
  "completed_tasks": ["T1"],
  "status": "in_progress",
  "phase": "executing",
  "last_heartbeat": "2026-01-14T18:02:16.299157Z",
  "last_tool": "TodoWrite",
  "recent_output": [
    "💻 Bash: TIMESTAMP=$(date -Iseconds)\nca...",
    "✏️ Edit: 18-user-activities.sql",
    "💻 Bash: grep -A 15 'create table.*user...",
    "📋 Todo: 2/8 done"
  ]
}
```

This proves the sandbox IS working - it completed task T1 and was working on T3.

### Timing Analysis
```
STARTUP_TIMEOUT_MS = 60s
STARTUP_RETRY_DELAYS_MS = [5s, 10s, 30s]

Per sandbox retry sequence:
- Attempt 1: 60s timeout
- Delay: 5s
- Attempt 2: 60s timeout
- Delay: 10s
- Attempt 3: 60s timeout
Total: ~195s = ~3.25 minutes per sandbox

Orchestrator timing:
- sbx-a starts: 0s
- sbx-b starts: +60s (SANDBOX_STAGGER_DELAY_MS)
- sbx-c starts: +120s

sbx-c exhausts retries at: 120s + 195s = 315s = ~5.25 minutes

With cleanup overhead: ~5.5-6 minutes (matches observed behavior)
```

## Error Stack Traces
No explicit error stack traces - the sandboxes are killed by the startup hang detection mechanism, not by actual errors.

## Related Code
- **Affected Files**:
  - `.ai/alpha/scripts/lib/feature.ts:299-343` - Startup hang detection interval
  - `.ai/alpha/scripts/lib/feature.ts:390-437` - onStdout callback (not receiving data)
  - `.ai/alpha/scripts/lib/startup-monitor.ts` - Startup tracker utilities
  - `.ai/alpha/scripts/config/constants.ts:131-154` - Timeout constants

- **Key Functions**:
  - `startupCheckInterval` (feature.ts:299) - Kills Claude when output < 5 lines after 60s
  - `updateOutputTracker` (startup-monitor.ts:217) - Updates line/byte counts from stdout
  - `onStdout` callback (feature.ts:395) - Should receive data but isn't

## Related Issues & Context

### Direct Predecessors
- #1465 (CLOSED): "Alpha Orchestrator Premature Exit Due to Competing Retry Mechanisms" - Fixed health.ts timeout
- #1467 (CLOSED): "Orchestrator Premature Exit When All Sandboxes Fail Simultaneously" - Fixed exit condition
- #1459 (CLOSED): "Suppress Console Logging in UI Mode" - Suppressed conditional logging

### Related Infrastructure Issues
- #1445 (CLOSED): "Alpha Sandbox Hanging During Claude Code CLI Startup" - Implemented startup retry logic
- #1431 (CLOSED): "Alpha Orchestrator Recurring Issues" - Previous comprehensive fix attempt

### Historical Context
This is a recurring pattern where the orchestrator exits prematurely. Previous fixes addressed:
1. Health check timeout conflicts (#1465)
2. Exit condition for failed features without dependencies (#1467)
3. Console logging interference (#1459)

None of these addressed the fundamental issue: **E2B stdout not being captured**.

## Root Cause Analysis

### Identified Root Cause

**Summary**: E2B `commands.run()` `onStdout` callback is not receiving Claude CLI output, causing false-positive startup hang detection.

**Detailed Explanation**:

The startup hang detection in `feature.ts:299-343` monitors output received via the `onStdout` callback. When fewer than 5 lines are received within 60 seconds, it assumes Claude CLI has hung and kills the process.

However, the **progress files prove the sandboxes ARE working**:
- `last_heartbeat` timestamps are updating
- `completed_tasks` array shows tasks being completed
- `recent_output` shows tool calls being executed

This means Claude CLI is running and producing output, but that output is NOT reaching the `onStdout` callback. The disconnect is between:

1. **What Claude writes internally** (progress files - working)
2. **What E2B streams back to orchestrator** (onStdout - not working)

**Possible causes for stdout disconnect**:

1. **PTY/buffering issue with unbuffer**: The `run-claude` script uses `unbuffer` to force PTY allocation, but this may not be working correctly in the E2B container environment. Node.js applications have their own buffering layer that `unbuffer` cannot fully control.

2. **E2B commands.run() limitation**: The E2B SDK's `commands.run()` may have issues with long-running processes that use PTY. Their documentation suggests using `sandbox.pty.create()` for interactive tools.

3. **OAuth authentication latency**: The OAuth flow may introduce delays before Claude starts producing output, but once it does, the output isn't being captured.

4. **Network buffering**: Output may be buffered at the network level between E2B sandbox and orchestrator.

**Supporting Evidence**:
- Log files: Only contain retry messages, no Claude output
- Progress files: Show active heartbeats and completed tasks
- Pattern: All 3 sandboxes exhibit identical behavior
- Timing: Exactly matches 3 × 60s timeout + delays

### How This Causes the Observed Behavior

1. Orchestrator starts 3 sandboxes with 60s stagger
2. Each sandbox starts Claude CLI via `run-claude` script
3. Claude CLI starts, begins working, writes progress file
4. BUT stdout is not reaching onStdout callback
5. Startup tracker sees 0-2 lines after 60s
6. startupCheckInterval kills Claude (false positive hang detection)
7. Retry loop starts, same issue repeats
8. After 3 attempts (~3+ minutes), each sandbox exhausts retries
9. sbx-c (last to start) exhausts retries at ~5.5-6 minutes
10. Work loop sees all sandboxes with no active work
11. Orchestrator exits

### Confidence Level

**Confidence**: High

**Reasoning**: The evidence conclusively proves that:
1. Sandboxes ARE working (progress files with heartbeats, completed tasks)
2. Output is NOT being captured (empty logs except retry messages)
3. This directly triggers the startup hang detection
4. The timing matches perfectly with the retry logic

## Fix Approach (High-Level)

Several approaches could address this, in order of recommended priority:

1. **Switch from commands.run() to sandbox.pty.create()**: Use E2B's PTY API instead of commands.run() for running Claude CLI. PTY provides more reliable real-time output streaming for interactive tools. This is explicitly recommended in E2B documentation for long-running interactive processes.

2. **Monitor progress file instead of stdout**: Instead of relying on stdout for startup detection, poll the progress file directly (already being done for progress updates). If progress file shows heartbeat updates, startup is successful regardless of stdout capture.

3. **Use API key instead of OAuth**: OAuth may have session limits or latency issues. Using ANTHROPIC_API_KEY could reduce startup latency and avoid authentication-related hangs.

4. **Increase startup timeout significantly**: Set STARTUP_TIMEOUT_MS to 120-180s to give more time for initial output. However, this is a workaround, not a fix.

5. **Add stdout capture diagnostics**: Before retry, log what was captured vs what progress file shows, to better understand the disconnect.

## Diagnosis Determination

The Alpha Orchestrator's ~6-minute exit is caused by E2B's `commands.run()` `onStdout` callback not receiving Claude CLI output, despite the sandboxes actively working. This triggers false-positive startup hang detection, exhausting all retry attempts for all 3 sandboxes within ~6 minutes.

The fix requires either:
- Switching to E2B's PTY API for more reliable output streaming
- Using progress file heartbeats (which work) for startup detection instead of stdout (which doesn't)

## Additional Context

### Previous Fix History
This issue has been investigated multiple times:
- Issue #1445 implemented startup retry logic
- Issue #1465 adjusted health check timeouts
- Issue #1467 fixed exit condition for failed features

Each fix addressed symptoms but not the root cause: the fundamental stdout capture failure.

### Research References
- `.ai/alpha/research/e2b-cli-hanging-research.md` - Documents known E2B output streaming issues
- E2B SDK documentation recommends `sandbox.pty.create()` for interactive tools

## Research Update (2026-01-14)

Research conducted via **context7-expert** and **exa-expert** agents confirms the root cause and provides detailed implementation guidance.

### E2B SDK Documentation Findings

The root cause is **output buffering when no TTY is present**:
- `sandbox.commands.run()` does NOT allocate a pseudo-terminal
- Node.js CLI tools detect `process.stdout.isTTY === false`
- Without TTY, output is block-buffered (4KB chunks) instead of line-buffered
- Output only arrives when buffer fills or process exits

### API Comparison

| Aspect | `commands.run()` (current) | `pty.create()` (recommended) |
|--------|----------------------------|------------------------------|
| TTY allocation | ❌ None | ✅ Full pseudo-terminal |
| Output streaming | Block-buffered, delayed | Real-time, character-level |
| `isTTY` detection | `false` | `true` |
| Interactive tools | ❌ Limited | ✅ Full support |
| Use case | Simple scripts | Interactive CLI tools |

### Recommended Implementation

```typescript
// Replace commands.run() with pty.create()
const pty = await instance.sandbox.pty.create({
  size: { cols: 120, rows: 40 },
  cwd: WORKSPACE_DIR,
  envs: {
    ...getAllEnvVars(),
    TERM: 'xterm-256color',
    FORCE_COLOR: '1',
    CI: 'false',
  },
  timeout: 0,  // No timeout for long-running
  onData: (data) => {
    const text = data.toString();
    capturedStdout += text;
    logStream.write(text);
    updateOutputTracker(startupTracker, text);
  },
});

// Send command to PTY
await instance.sandbox.pty.sendInput(
  pty.pid,
  Buffer.from(`run-claude "${prompt}"\n`)
);

// Wait for completion
await pty.wait();
await pty.kill();
```

### Alternative Workarounds

If PTY migration is complex, these may help:

1. **stdbuf wrapper**: `stdbuf -oL run-claude "prompt"`
2. **script wrapper**: `script -q -c "run-claude prompt" /dev/null`
3. **File watching**: Redirect to file and watch for changes

### Environment Variables

Set these to encourage unbuffered output:
```typescript
envs: {
  TERM: 'xterm-256color',
  FORCE_COLOR: '1',
  CI: 'false',
  PYTHONUNBUFFERED: '1',
}
```

### Research Reports

- `.ai/reports/research-reports/2026-01-14/context7-e2b-realtime-stdout-streaming.md`
- `.ai/reports/research-reports/2026-01-14/exa-e2b-pty-sandbox-cli.md`

### External Resources

- [E2B Streaming Guide](https://e2b.dev/docs/commands/streaming)
- [E2B Claude Code JS Guide](https://e2b.dev/blog/javascript-guide-run-claude-code-in-an-e2b-sandbox)
- [E2B Claude Code FastAPI Example](https://github.com/e2b-dev/claude-code-fastapi)

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Bash (log inspection), Glob (file discovery)*
*Research Agents: context7-expert, exa-expert*
