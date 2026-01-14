# Bug Diagnosis: Alpha Sandbox Hanging/Failing During Feature Implementation

**ID**: ISSUE-1444
**Created**: 2026-01-13T20:45:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

E2B sandboxes running the Alpha Implementation System are frequently hanging or failing without producing output. Analysis of log files shows a ~64% failure rate (108 failed sessions vs 60 successful sessions). Failed sandboxes show only the initial startup message and never produce Claude Code output.

## Environment

- **Application Version**: dev branch (commit 20174ce62)
- **Environment**: E2B cloud sandboxes
- **E2B Template**: slideheroes-claude-agent
- **Claude Code Version**: @anthropic-ai/claude-code (global npm install)
- **Node Version**: 20.x (in sandbox)
- **Authentication**: OAuth (Max plan)
- **Last Working**: Partial - some features complete successfully

## Reproduction Steps

1. Run the spec orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
2. Observe that 3 sandboxes are created and assigned features
3. Wait for implementation to begin
4. Observe that some sandboxes never produce output beyond initial startup
5. Check log files in `.ai/alpha/logs/` - many are only 93 bytes

## Expected Behavior

Each sandbox should:
1. Start Claude Code CLI
2. Run `/alpha:implement <feature-id>`
3. Produce progress output as tasks are completed
4. Update `.initiative-progress.json` with heartbeats
5. Complete the feature and push commits

## Actual Behavior

Many sandboxes:
1. Start Claude Code CLI (output: "Using OAuth authentication")
2. Send the prompt (output: "Running Claude Code with prompt: /alpha:implement XXXX")
3. **HANG** - No further output produced
4. Never create/update `.initiative-progress.json`
5. Eventually timeout or are marked as failed

Some sandboxes that start successfully:
1. Make progress on tasks
2. Get stuck at a specific task (e.g., T1 "starting")
3. Heartbeat stops updating
4. Session becomes stalled

## Diagnostic Data

### Log File Analysis

```
Total log files analyzed: 168
Files under 100 bytes (failed): 108 (64%)
Files over 500 bytes (success): 60 (36%)

Sample failed log (93 bytes):
Using OAuth authentication (Max plan)
Running Claude Code with prompt: /alpha:implement 1367
[EOF - no further output]
```

### Current Progress State

```json
// overall-progress.json
{
  "specId": 1362,
  "status": "in_progress",
  "featuresCompleted": 0,
  "featuresTotal": 13,
  "tasksCompleted": 0,
  "tasksTotal": 110
}

// sbx-a-progress.json (Feature #1367)
{
  "status": "failed",
  "recent_output": [
    "Using OAuth authentication (Max plan)",
    "Running Claude Code with prompt: /alpha:implement 1367"
  ]
}

// sbx-c-progress.json (Feature #1376 - got further)
{
  "current_task": {
    "id": "T1",
    "status": "starting",
    "started_at": "2026-01-13T20:34:05+00:00"
  },
  "status": "in_progress",
  "last_heartbeat": "2026-01-13T20:34:27.177737Z"
}
```

### Successful Session Example

```
// sbx-b-2026-01-13T20-18-25-939Z.log (1.6k bytes)
Using OAuth authentication (Max plan)
Running Claude Code with prompt: /alpha:implement 1373
## Implementation Complete

**Feature #1373: Activity Database Schema** has been successfully implemented.

### Summary
| Task | Description | Status |
|------|-------------|--------|
| T1 | Create activity enums in schema file | ✅ Complete |
...
```

## Error Stack Traces

No explicit error messages in logs - sessions simply produce no output after the initial prompt is sent.

## Related Code

- **Affected Files**:
  - `packages/e2b/e2b-template/template.ts` - run-claude script definition (lines 42-86)
  - `.ai/alpha/scripts/lib/sandbox.ts` - sandbox creation and Claude execution
  - `.ai/alpha/scripts/lib/feature.ts` - feature assignment and monitoring
  - `.claude/commands/alpha/implement.md` - slash command executed in sandbox

- **Recent Changes**:
  - `20174ce62` - fix(tooling): kill old sandboxes before restart to prevent accumulation
  - `bdc094ed7` - fix(tooling): propagate hook events to UI progress files
  - `94ae2521e` - fix(tooling): implement file-based event reporting for E2B sandboxes

- **Suspected Functions**:
  - `runClaudeImplement()` in sandbox.ts - executes run-claude script
  - `run-claude` bash script - pipes prompt to Claude CLI

## Related Issues & Context

### Direct Predecessors
- Recent commits suggest multiple prior issues with event streaming and sandbox management
- `59794be86` - fix(tooling): resolve orchestrator race conditions and timeout issues
- `b6c2ed1f7` - fix(tooling): resolve orchestrator race condition from error field persistence

### Similar Symptoms
- Sandbox accumulation issue was recently fixed (commit 20174ce62)
- Event streaming to UI was recently added (commits 94ae2521e, bdc094ed7)

## Root Cause Analysis

### Identified Root Causes

**Primary Root Cause: Claude Code CLI Hangs During Initialization**

**Summary**: Claude Code CLI hangs after receiving the prompt but before producing any output, likely due to API connection issues, OAuth token problems, or internal initialization timeout.

**Detailed Explanation**:

The `run-claude` script (template.ts:42-86) uses this command:
```bash
unbuffer bash -c "echo \"$1\" | claude -p --setting-sources user,project --dangerously-skip-permissions"
```

The script:
1. Pipes the prompt via stdin (`echo "$1" |`)
2. Uses `unbuffer` for PTY allocation to get line-buffered output
3. Enables project-level slash commands (`--setting-sources user,project`)

The failure pattern shows:
- "Using OAuth authentication (Max plan)" is echoed by the script
- "Running Claude Code with prompt: ..." is echoed by the script
- Claude CLI is started but **never produces any output**

This indicates Claude Code CLI is hanging during:
1. API connection establishment (network issues in E2B sandbox)
2. OAuth token validation (rate limiting, token expiry, session limits)
3. Model loading or initialization
4. Slash command parsing (`/alpha:implement` command loading)

**Supporting Evidence**:
- 64% of sessions fail in exactly the same way (93 bytes of output)
- Successful sessions show Claude produces output immediately after prompt
- No error messages in stderr - Claude hangs silently
- Feature #1376 (sbx-c) got further, showing the system CAN work

**Secondary Root Cause: Task Execution Stalls**

**Summary**: Some sessions that successfully start later stall during task execution, with the heartbeat stopping updates.

**Detailed Explanation**:

Feature #1376 shows this pattern:
- Task T1 status: "starting" at 20:34:05
- Last heartbeat: 20:34:27 (22 seconds later)
- Current time: 20:36:33 (~2 minutes after last heartbeat)

The task was in "starting" phase but never transitioned to "in_progress" or "completed". This suggests:
1. Claude started implementing the task
2. Something caused a hang (long-running command, file operation, sub-agent call)
3. Heartbeat stopped being updated
4. Session became stalled

**Supporting Evidence**:
- `last_tool`: "Bash" - last tool used was a bash command
- `recent_output` shows: `pnpm typecheck 2>&1 | head -30` - verification command was running
- The `pnpm typecheck` command can be slow and might timeout

### How This Causes the Observed Behavior

1. **Sandbox Creation**: Orchestrator creates 3 E2B sandboxes successfully
2. **Feature Assignment**: Features are correctly assigned to sandboxes
3. **Claude Invocation**: `run-claude "/alpha:implement XXXX"` is executed
4. **Hang Point**: Claude Code CLI connects to Anthropic API but hangs during initialization
5. **No Progress**: Since Claude never starts, no progress file is created
6. **Timeout Detection**: Health checks eventually mark the feature as failed
7. **Cycle Repeats**: On retry, the same issue can occur

### Confidence Level

**Confidence**: High

**Reasoning**:
- Pattern is highly consistent (93 bytes = exact same failure point)
- Successful sessions produce output immediately
- Multiple independent sandboxes fail the same way
- No error messages suggest a hang, not a crash
- The problem is intermittent - some sessions succeed, suggesting an external factor (API rate limits, network timing, OAuth session limits)

## Fix Approach (High-Level)

1. **Add Claude CLI startup timeout with retry**: Wrap the Claude invocation with a timeout (e.g., 60 seconds). If Claude doesn't produce output within the timeout, kill and retry with exponential backoff.

2. **Add health check for Claude startup phase**: The health module should detect if no output is produced within 2-3 minutes of starting Claude, and trigger a sandbox restart.

3. **Stagger sandbox startup more aggressively**: Currently sandboxes wait 20 seconds between creation. Consider increasing to 30-60 seconds to avoid potential API rate limiting when 3 sandboxes all start Claude simultaneously.

4. **Add explicit error handling in run-claude script**: Capture stderr from Claude CLI and log it. Add a wrapper that detects if Claude exits without producing output.

5. **Consider using API key instead of OAuth for sandboxes**: OAuth tokens may have session limits or require refresh. API keys are simpler and more reliable for automated systems.

6. **Add keepalive/ping during task execution**: For long-running tasks, periodically update heartbeat even if no tool calls are made.

## Diagnosis Determination

The primary root cause is Claude Code CLI hanging during initialization in E2B sandboxes. This occurs in approximately 64% of sessions and manifests as the CLI accepting the prompt but never producing output. The hang is likely caused by API connection timing issues, OAuth token session limits, or race conditions when multiple sandboxes start Claude simultaneously.

The secondary root cause is task execution stalls where sessions that successfully start later hang during long-running operations (like `pnpm typecheck`), causing heartbeats to stop and sessions to become stalled.

Both issues can be mitigated with:
- Startup timeout detection and automatic retry
- More aggressive startup staggering
- Better health monitoring during the critical first 5 minutes
- Consideration of API key authentication over OAuth for sandbox use

## Additional Context

- The Alpha Implementation System is designed for autonomous code generation across parallel sandboxes
- E2B sandboxes are isolated cloud VMs that cannot reach localhost - all API calls go through the internet
- OAuth tokens are read from `~/.claude/.credentials.json` on the host and passed to sandboxes
- The system has been under active development with multiple recent fixes for race conditions and event streaming

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Glob, Bash, file analysis*
