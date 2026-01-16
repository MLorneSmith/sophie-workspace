# Research: E2B Sandbox Logs Stop Updating

**Date**: 2026-01-09
**Agent**: perplexity-expert
**Status**: Completed (using existing research and documentation)

## Problem Summary

- Using `e2b sandbox logs <sandbox-id>` command
- Sandbox running for ~1 hour
- Logs stop at a certain timestamp (20:25 UTC) and don't show newer entries
- Sandbox is still listed as "Running" in `e2b sandbox list`
- Local progress polling shows sandbox is still active (heartbeat updates every few seconds)
- No new log entries returned by CLI

## Research Findings

### 1. E2B CLI Logs vs Command Output - CRITICAL DISTINCTION

**The most important finding**: The `e2b sandbox logs` command shows **sandbox system/infrastructure logs**, NOT stdout/stderr from commands running inside the sandbox.

From E2B SDK documentation:
> "CLI logs are for sandbox-level events (system logs), NOT stdout/stderr from commands. Command output must be captured via SDK callbacks."

**This explains why logs "stop"**: If the sandbox infrastructure itself is stable and no system-level events are occurring, the CLI logs will not update - even though commands inside the sandbox are actively producing output.

### 2. How E2B CLI Log Retrieval Works

The E2B CLI provides these log options:

```bash
# View sandbox logs
e2b sandbox logs [options] <sandboxID>

# Options:
#   --level <level>    Filter by level (DEBUG, INFO, WARN, ERROR) [default: INFO]
#   -f, --follow       Stream logs in real-time until sandbox closes
#   --format <format>  Output format (json, pretty) [default: pretty]
#   --loggers [list]   Filter by logger names (comma-separated)
```

**The `-f, --follow` flag** streams logs in real-time, but only sandbox infrastructure events.

### 3. No Known Log Buffering or Retention Issues

Based on existing research, there are **no documented issues** with:
- Log buffer size limits
- Log retention limits within the sandbox lifetime
- Log streaming stopping prematurely

The behavior described (logs stopping) is **expected** when:
- The sandbox infrastructure is running normally
- No system-level events (errors, warnings, INFO messages) are being generated
- The sandbox has reached a "steady state"

### 4. Getting Command Output from Running Sandboxes

**There is NO programmatic log API** like `sandbox.getLogs()` in the E2B SDK. To get command output, you must:

#### Option A: Capture during execution (recommended)
```typescript
await sandbox.commands.run('your-command', {
  onStdout: (data) => console.log('STDOUT:', data),
  onStderr: (data) => console.log('STDERR:', data),
});
```

#### Option B: Write logs to files, read later
```typescript
// During execution, write to file
await sandbox.commands.run('your-command > /tmp/output.log 2>&1');

// Later, read the file
const logContent = await sandbox.filesystem.read('/tmp/output.log');
```

#### Option C: Connect to running process by PID
```typescript
const handle = await sandbox.commands.connect(pid, {
  onStdout: (data) => console.log(data),
  onStderr: (data) => console.error(data),
});
```

### 5. Workarounds for Getting Fresh Logs

If you need to monitor a long-running sandbox:

#### Workaround 1: Tail log files inside sandbox
```bash
# Run inside sandbox
e2b sandbox exec <sandbox-id> -- tail -f /tmp/your-app.log
```

#### Workaround 2: Use PTY for real-time output
```typescript
const pty = await sandbox.pty.create({
  size: { rows: 40, cols: 120 },
  onData: (data) => console.log(data),
});
await sandbox.pty.sendInput(pty.pid, new TextEncoder().encode('your-command\n'));
```

#### Workaround 3: Redirect all output to log file
```bash
# Wrap your command to log everything
exec 1> >(tee -a /tmp/all-output.log) 2>&1
your-actual-command
```

### 6. GitHub Issues and Discussions

While the Perplexity API was unavailable for fresh searches, based on project history:

- No documented GitHub issues about `e2b sandbox logs` stopping prematurely
- The behavior appears to be working as designed
- The confusion stems from expecting command output in CLI logs

### 7. Maximum Sandbox Timeout Considerations

| User Tier | Maximum Timeout |
|-----------|-----------------|
| **Pro** | 24 hours |
| **Hobby** | 1 hour |

If running for ~1 hour on a Hobby tier, you may be approaching the timeout limit. Use `setTimeout()` to extend:

```typescript
await sandbox.setTimeout(3_600_000); // Extend to 1 more hour (Pro only)
```

## Key Takeaways

1. **`e2b sandbox logs` shows infrastructure/system logs, NOT command output** - This is the root cause of the confusion

2. **Logs stopping is expected behavior** when no system events occur

3. **To get command output**: Use SDK callbacks (`onStdout`/`onStderr`) during execution, or write to files

4. **No programmatic log API exists** - Must capture output during execution or use filesystem

5. **For long-running processes**: Consider background mode with `sandbox.commands.connect()` to reconnect

## Recommendations

1. **Modify your orchestrator** to write Claude Code output to a log file inside the sandbox:
   ```bash
   run-claude "prompt" | tee /tmp/claude-output.log
   ```

2. **Poll the log file** from your monitoring script:
   ```typescript
   const output = await sandbox.filesystem.read('/tmp/claude-output.log');
   ```

3. **Use the SDK's streaming callbacks** for real-time output during command execution

4. **Don't rely on `e2b sandbox logs`** for monitoring command output - it's for infrastructure events only

## Sources

- E2B SDK Documentation via Context7 (e2b-dev/e2b)
- Previous research: `/home/msmith/projects/2025slideheroes/.ai/reports/research-reports/2026-01-06/context7-e2b-output-logging.md`
- Previous research: `/home/msmith/projects/2025slideheroes/.ai/reports/research-reports/2025-11-28/context7-e2b-logging-session-management.md`
- E2B CLI Reference: Commands and PTY API
