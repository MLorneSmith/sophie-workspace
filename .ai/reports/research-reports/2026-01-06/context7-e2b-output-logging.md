# Context7 Research: E2B SDK Output Streaming and Logging

**Date**: 2026-01-06
**Agent**: context7-expert
**Libraries Researched**: e2b-dev/e2b (v2.x SDK)

## Query Summary

Researched E2B SDK for Node.js/TypeScript focusing on:
1. Real-time stdout/stderr streaming from `sandbox.commands.run()`
2. Built-in logging options and CLI log access
3. E2B CLI `sandbox logs` command capabilities
4. Process monitoring for long-running processes
5. Best practices for buffered vs unbuffered output

## Context

Current implementation in `alpha-orchestrator.ts`:
```typescript
await sandbox.commands.run(`stdbuf -oL -eL run-claude "${prompt}"`, {
  timeoutMs: 1800000,
  onStdout: (data) => process.stdout.write(`   │ ${data}\n`),
  onStderr: (data) => process.stderr.write(`   │ [ERR] ${data}`),
});
```

The output seems delayed/buffered despite using `stdbuf`.

---

## Findings

### 1. Standard Output Streaming with Callbacks

The E2B SDK provides `onStdout` and `onStderr` callbacks which are the **primary mechanism** for real-time output streaming. There are no better alternatives.

#### JavaScript/TypeScript Pattern
```typescript
import { Sandbox } from '@e2b/code-interpreter';

const sandbox = await Sandbox.create();
const result = await sandbox.commands.run('echo hello; sleep 1; echo world', {
  onStdout: (data) => {
    console.log(data);
  },
  onStderr: (data) => {
    console.log(data);
  },
});
```

#### Key Options in `CommandStartOpts`
```typescript
interface CommandStartOpts {
  background?: boolean;           // Run in background, return CommandHandle
  cwd?: string;                   // Working directory
  envs?: Record<string, string>;  // Environment variables
  onStderr?: (data: string) => void | Promise<void>;  // stderr callback
  onStdout?: (data: string) => void | Promise<void>;  // stdout callback
  requestTimeoutMs?: number;      // API request timeout (default: 30,000ms)
  timeoutMs?: number;             // Command timeout (default: 60,000ms)
  user?: Username;                // User to run as (default: 'user')
}
```

### 2. Background Mode with Iterator Pattern (Alternative)

For long-running processes, background mode with output iteration may provide better control:

```typescript
// Start command in background
const command = await sandbox.commands.run('long-running-process', {
  background: true,
  onStdout: (data) => console.log(data),
});

// Later: wait for completion or iterate
await command.wait();

// Or kill if needed
await command.kill();
```

**Python SDK has additional iterator pattern:**
```python
command = sandbox.commands.run('echo hello; sleep 10; echo world', background=True)

# Iterate over output as it arrives
for stdout, stderr, _ in command:
    if stdout:
        print(stdout)
    if stderr:
        print(stderr)
```

### 3. PTY (Pseudo-Terminal) Mode

For truly interactive processes that need unbuffered output, PTY mode is available:

```typescript
// Create a PTY for interactive terminal session
const pty = await sandbox.pty.create({
  size: { rows: 24, cols: 80 },
  onData: (data) => {
    // Receives raw PTY output (unbuffered)
    console.log(data);
  },
});

// Send input to PTY
await sandbox.pty.sendInput(pty.pid, new TextEncoder().encode('command\n'));

// Resize if needed
await sandbox.pty.resize(pty.pid, { rows: 40, cols: 120 });

// Kill when done
await sandbox.pty.kill(pty.pid);
```

**Python Pattern:**
```python
def handle_pty_output(data: PtyOutput):
    print(data)

pty_handle = sandbox.pty.create(
    size=PtySize(rows=24, cols=80),
    on_data=handle_pty_output,
    user="user",
    cwd="/home/user/project",
    timeout=60
)
```

### 4. E2B CLI Sandbox Logs

The E2B CLI provides comprehensive logging capabilities:

```bash
# View sandbox logs
e2b sandbox logs [options] <sandboxID>

# Options:
#   --level <level>    Filter by level (DEBUG, INFO, WARN, ERROR) [default: INFO]
#   -f, --follow       Stream logs in real-time until sandbox closes
#   --format <format>  Output format (json, pretty) [default: pretty]
#   --loggers [list]   Filter by logger names (comma-separated)
```

**Examples:**
```bash
# View all INFO+ logs
e2b sandbox logs sbx_abc123

# Stream logs in real-time
e2b sandbox logs -f sbx_abc123

# Filter for errors only
e2b sandbox logs --level ERROR sbx_abc123

# JSON output for parsing
e2b sandbox logs --format json sbx_abc123

# Multiple loggers
e2b sandbox logs --loggers "app,system" sbx_abc123
```

**Note:** CLI logs are for sandbox-level events (system logs), NOT stdout/stderr from commands. Command output must be captured via SDK callbacks.

### 5. No Programmatic Log API

There is **no SDK method** like `sandbox.getLogs()` to retrieve logs programmatically. Options are:
- Use CLI: `e2b sandbox logs <id>`
- Capture stdout/stderr via callbacks during execution
- Write output to files in sandbox, read later via filesystem API

### 6. Connect to Running Processes

If a process was started earlier, you can reconnect:

```typescript
// Connect to running command by PID
const handle = await sandbox.commands.connect(pid, {
  onStdout: (data) => console.log(data),
  onStderr: (data) => console.error(data),
  timeoutMs: 60000,
});

// Wait for completion
const result = await handle.wait();
```

### 7. Process Monitoring

#### Check Sandbox Health
```typescript
async function checkSandboxHealth(sandbox: Sandbox) {
  const result = await sandbox.commands.run(
    `cat /proc/loadavg && free | grep Mem | awk '{print $3/$2 * 100}'`,
    { timeoutMs: 5000 }
  );
  // Parse load average and memory usage
}
```

#### Command Properties (during execution)
```typescript
// Background command handle properties
handle.pid         // Process ID
handle.stdout      // Accumulated stdout (after completion)
handle.stderr      // Accumulated stderr (after completion)
handle.exitCode    // Exit code (null if running)
handle.error       // Error message if failed
```

### 8. Sandbox Connection and Persistence

```typescript
// Create sandbox with timeout
const sandbox = await Sandbox.create('template-name', {
  timeoutMs: 1800000,  // 30 minutes
  apiKey: 'your-key',
  envs: { ... },
});

// Connect to existing sandbox
const same = await Sandbox.connect(sandboxId);

// Extend sandbox timeout
await Sandbox.setTimeout(sandboxId, 3600000);  // 1 hour

// Check if running
const isRunning = await sandbox.isRunning();
```

---

## Key Takeaways

1. **Callbacks are the only real-time option**: `onStdout`/`onStderr` are the primary mechanism; no alternatives exist in SDK v2

2. **Buffering happens on process side**: The SDK streams data as it receives it; if output is buffered, it's from the process itself (not E2B)

3. **PTY for truly unbuffered output**: Use `sandbox.pty.create()` for interactive processes that need character-by-character streaming

4. **CLI logs != command output**: `e2b sandbox logs` shows sandbox system logs, not stdout/stderr from commands

5. **No programmatic log API**: Must use CLI or capture output during execution

6. **Background mode for long processes**: Use `background: true` for processes that may exceed timeouts, then `command.wait()`

7. **Connection reconnect available**: Can reconnect to running processes using `sandbox.commands.connect(pid)`

---

## Recommendations for Current Implementation

### Problem Analysis
The current buffering issue is likely caused by:
1. **Node.js/Claude process buffering** - The Claude process may be buffering its own output
2. **stdbuf limitations** - Only affects libc-based buffering, not application-level

### Recommended Solutions

#### Option 1: Keep Current Approach (Simplest)
The current approach is correct. Accept that some delay may occur due to application-level buffering in Claude.

```typescript
await sandbox.commands.run(`stdbuf -oL -eL run-claude "${prompt}"`, {
  timeoutMs: 1800000,
  onStdout: (data) => {
    // Current approach is fine
    process.stdout.write(`   │ ${data}\n`);
  },
  onStderr: (data) => {
    process.stderr.write(`   │ [ERR] ${data}`);
  },
});
```

#### Option 2: Use PTY Mode for Full Interactivity
If real-time output is critical, switch to PTY mode:

```typescript
const pty = await sandbox.pty.create({
  size: { rows: 40, cols: 120 },
  cwd: WORKSPACE_DIR,
  envs: getAllEnvVars(),
  timeout: 1800,  // 30 min
});

// Send command
await sandbox.pty.sendInput(
  pty.pid, 
  new TextEncoder().encode(`run-claude "${prompt}"\n`)
);

// Wait for completion (implement via PTY output parsing)
await pty.wait();
```

#### Option 3: Use `script` Command for Unbuffered Output
Force unbuffered output using script:

```typescript
await sandbox.commands.run(
  `script -q -c 'run-claude "${prompt}"' /dev/null`,
  {
    timeoutMs: 1800000,
    onStdout: (data) => process.stdout.write(`   │ ${data}`),
    onStderr: (data) => process.stderr.write(`   │ [ERR] ${data}`),
  }
);
```

#### Option 4: Force Claude to Flush Output
If you control `run-claude` script, ensure it uses unbuffered output:

```bash
#!/bin/bash
# In run-claude script
exec python -u claude_runner.py "$@"  # -u for unbuffered Python
```

Or for Node.js-based Claude:
```bash
#!/bin/bash
exec node --experimental-print-required-tla claude.js "$@"
```

#### Option 5: Background Mode with Polling
For very long processes, use background mode:

```typescript
const command = await sandbox.commands.run(
  `stdbuf -oL -eL run-claude "${prompt}"`,
  {
    background: true,
    timeoutMs: 1800000,
    onStdout: (data) => process.stdout.write(`   │ ${data}\n`),
  }
);

// Poll for completion while streaming continues
const result = await command.wait();
```

---

## Code Examples

### Complete Background Process Pattern
```typescript
import { Sandbox } from '@e2b/code-interpreter';

async function runLongProcess(sandbox: Sandbox, cmd: string) {
  const command = await sandbox.commands.run(cmd, {
    background: true,
    timeoutMs: 1800000,
    onStdout: (data) => {
      const lines = data.split('\n');
      for (const line of lines) {
        if (line.trim()) {
          console.log(`   │ ${line}`);
        }
      }
    },
    onStderr: (data) => {
      console.error(`   │ [ERR] ${data}`);
    },
  });

  console.log(`   Started process PID: ${command.pid}`);
  
  // Can disconnect and reconnect later if needed
  // command.disconnect();
  // const reconnected = await sandbox.commands.connect(command.pid);
  
  const result = await command.wait();
  return result;
}
```

### PTY Mode for Interactive Commands
```typescript
async function runInteractive(sandbox: Sandbox, cmd: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const pty = await sandbox.pty.create({
      size: { rows: 40, cols: 120 },
      timeout: 1800,
      onData: (data) => {
        // Raw PTY data - may include ANSI codes
        process.stdout.write(data);
      },
    });

    // Send the command
    await sandbox.pty.sendInput(
      pty.pid,
      new TextEncoder().encode(`${cmd}\n`)
    );

    // Send exit command after a delay (or parse output for completion)
    // This is simplified - real implementation would parse output
    setTimeout(async () => {
      await sandbox.pty.sendInput(pty.pid, new TextEncoder().encode('exit\n'));
      setTimeout(() => resolve(), 1000);
    }, 30 * 60 * 1000);  // 30 min timeout
  });
}
```

### Monitoring Running Processes
```typescript
async function monitorProcess(sandbox: Sandbox, pid: number) {
  // Check if process is running
  const psResult = await sandbox.commands.run(`ps -p ${pid} -o pid=`, {
    timeoutMs: 5000,
  });
  
  const isRunning = psResult.stdout.trim() !== '';
  
  if (isRunning) {
    // Get process stats
    const statResult = await sandbox.commands.run(
      `ps -p ${pid} -o %cpu,%mem,etime`,
      { timeoutMs: 5000 }
    );
    console.log('Process stats:', statResult.stdout);
  }
  
  return isRunning;
}
```

---

## Sources

- E2B SDK Documentation via Context7 (e2b-dev/e2b)
- SDK Reference: Commands API (JS v2.x)
- SDK Reference: PTY API
- SDK Reference: CLI v2.2.4
- Streaming documentation

---

## Related Topics for Further Research

1. **E2B Filesystem API** - For writing/reading log files within sandbox
2. **E2B Code Interpreter** - For Python/JS code execution with result streaming
3. **Sandbox Templates** - Pre-configured environments with specific tooling
4. **WebSocket Architecture** - Understanding E2B's transport layer (if deeper optimization needed)
