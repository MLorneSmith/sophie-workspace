# Context7 Research: E2B PTY Streaming and Connection Reliability

**Date**: 2026-01-21
**Agent**: context7-expert
**Libraries Researched**: e2b-dev/e2b, e2b-dev/code-interpreter

## Query Summary

Research into E2B SDK documentation for PTY (pseudo-terminal) handling, streaming, and connection reliability. The investigation focused on:
1. PTY/terminal API - creation, data streaming, disconnection handling
2. Sandbox connection reliability - timeouts, keepalive, reconnection
3. Streaming best practices - dropped connections, buffering
4. Long-running PTY session limitations
5. Silent stream drop detection
6. Reconnection strategies

## Findings

### 1. E2B PTY/Terminal API

#### PTY Creation

The E2B SDK provides PTY creation through the `sandbox.pty.create()` method:

```typescript
// TypeScript
const handle = await sandbox.pty.create({
  size: { cols: 80, rows: 24 },
  onData: (data: PtyOutput) => {
    console.log(data);
  },
  user: 'user',
  cwd: '/app',
  envs: { TERM: 'xterm-256color' },
  timeout: 60, // seconds
  requestTimeoutMs: 5000
});
```

```python
# Python
handle = await sandbox.pty.create(
    size=PtySize(cols=80, rows=24),
    on_data=lambda data: print(data),
    user="user",
    cwd="/app",
    envs={"TERM": "xterm-256color"},
    timeout=60,  # seconds
    request_timeout=5.0
)
```

**Key Parameters:**
- `size` (PtySize) - Required - Terminal dimensions (cols, rows)
- `on_data` (OutputHandler) - Required - Callback for PTY data
- `timeout` - Optional - PTY connection timeout (default: 60 seconds)
- `request_timeout` - Optional - HTTP request timeout

**Return:** `AsyncCommandHandle` for interacting with the PTY

#### PTY Operations

| Operation | Method | Description |
|-----------|--------|-------------|
| Send Input | `sendInput(pid, data)` | Send `Uint8Array` data to PTY stdin |
| Resize | `resize(pid, size)` | Update terminal dimensions |
| Kill | `kill(pid)` | Terminate PTY process |
| Send stdin | `send_stdin(pid, data)` | Send bytes to PTY (Python) |

### 2. Command Streaming with Callbacks

For command execution (non-PTY), E2B provides streaming callbacks:

```typescript
// TypeScript
const result = await sandbox.commands.run('echo hello; sleep 1; echo world', {
  onStdout: (data) => console.log('stdout:', data),
  onStderr: (data) => console.log('stderr:', data),
});
```

```python
# Python
result = sandbox.commands.run(
    'echo hello; sleep 1; echo world',
    on_stdout=lambda data: print(f"stdout: {data}"),
    on_stderr=lambda data: print(f"stderr: {data}")
)
```

### 3. Connection and Timeout Management

#### Sandbox Timeout Configuration

**Default timeout:** 5 minutes (300,000 ms)  
**Maximum timeout:**
- Pro users: 24 hours (86,400 seconds)
- Hobby users: 1 hour (3,600 seconds)

```typescript
// Set custom timeout on connection
const sbx = await Sandbox.connect(sandboxId, { timeoutMs: 60000 });

// Update timeout on existing sandbox
await sandbox.setTimeout(3600000); // 1 hour in ms
```

```python
# Python
sbx = Sandbox.connect(sandbox_id, timeout=60)  # 60 seconds
sandbox.set_timeout(3600)  # 1 hour in seconds
```

**Critical:** Timeout is reset to default upon connection. Always set custom timeout when connecting.

#### Command/PTY Connection Timeout

The `timeout` parameter on PTY/command operations controls the connection duration:
- `timeout: 0` - No limit on connection time
- `timeout: 60` - Default 60 second limit

```python
# Connect to running command with extended timeout
handle = await sandbox.commands.connect(
    pid=12345,
    timeout=0,  # No limit
    request_timeout=5.0
)
```

### 4. Sandbox Health Checking

#### Verify Sandbox is Running

```typescript
// TypeScript
const isRunning = await sandbox.isRunning();
```

```python
# Python
is_running = await sandbox.is_running(request_timeout=5.0)
```

#### List Running Sandboxes

```typescript
const sandboxes = await Sandbox.list();
```

```python
running_sandboxes = Sandbox.list()
```

### 5. Reconnection Strategies

#### Connect to Existing Sandbox

```typescript
// Get sandbox ID from existing instance
const sandboxId = sandbox.sandboxId;

// Reconnect from anywhere
const sameSandbox = await Sandbox.connect(sandboxId);
```

```python
# Python
sandbox_id = sandbox.sandbox_id
same_sandbox = Sandbox.connect(sandbox_id)
```

#### Connect to Running Command/PTY

```typescript
// List processes to find PID
const processes = await sandbox.commands.list();

// Connect to running process
const handle = await sandbox.commands.connect(pid, {
  timeout: 60,
  onStdout: (data) => console.log(data),
  onStderr: (data) => console.log(data)
});
```

```python
# Python
processes = await sandbox.commands.list()
handle = await sandbox.commands.connect(
    pid=process_pid,
    timeout=60,
    on_stdout=lambda data: print(data),
    on_stderr=lambda data: print(data)
)
```

### 6. CommandHandle/AsyncCommandHandle API

The handle returned from PTY/command operations provides:

```python
class AsyncCommandHandle:
    @property
    def pid(self) -> int:
        """Process ID"""
    
    @property
    def stdout(self) -> str:
        """Accumulated stdout"""
    
    @property
    def stderr(self) -> str:
        """Accumulated stderr"""
    
    @property
    def exit_code(self) -> Optional[int]:
        """Exit code (None if still running)"""
    
    async def disconnect(self) -> None:
        """Stop receiving events without killing process"""
    
    async def wait(self) -> CommandResult:
        """Wait for completion"""
    
    async def kill(self) -> bool:
        """Send SIGKILL"""
```

**Key Method: `disconnect()`**
- Stops SDK from receiving events
- Process continues running
- Can reconnect using `sandbox.commands.connect(pid)`

### 7. Detecting Silent Stream Drops

Based on the API, there is **no built-in mechanism** for detecting silent stream drops. Recommended strategies:

#### Strategy 1: Heartbeat Pattern
```typescript
// Send periodic heartbeat commands
const heartbeat = setInterval(async () => {
  try {
    await sandbox.commands.run('echo heartbeat', { timeout: 5 });
  } catch (error) {
    // Connection lost
    clearInterval(heartbeat);
    await handleDisconnection();
  }
}, 30000);
```

#### Strategy 2: Sandbox Status Polling
```typescript
const statusCheck = setInterval(async () => {
  const isRunning = await sandbox.isRunning();
  if (!isRunning) {
    clearInterval(statusCheck);
    await handleSandboxTermination();
  }
}, 10000);
```

#### Strategy 3: PTY Activity Timeout
```typescript
let lastDataTime = Date.now();

const handle = await sandbox.pty.create({
  size: { cols: 80, rows: 24 },
  onData: (data) => {
    lastDataTime = Date.now();
    processData(data);
  }
});

// Check for activity
const activityCheck = setInterval(() => {
  const silentMs = Date.now() - lastDataTime;
  if (silentMs > 60000) { // 1 minute of silence
    // Possible stream drop
    verifyConnectionHealth();
  }
}, 10000);
```

### 8. Known Limitations

1. **PTY Timeout Default**: 60 seconds - must be explicitly extended for long-running sessions
2. **Sandbox Auto-Kill**: Sandboxes are automatically killed after timeout expires
3. **No Built-in Keepalive**: SDK does not send keepalive packets
4. **Event Buffering**: No documentation on backpressure handling for `onData` callbacks
5. **Reconnection State**: When reconnecting to a command, previous buffered output is lost

### 9. Best Practices for Long-Running PTY Sessions

```typescript
async function createReliablePty(sandbox: Sandbox) {
  // 1. Extend sandbox timeout first
  await sandbox.setTimeout(24 * 60 * 60 * 1000); // 24 hours

  // 2. Create PTY with extended timeout
  let lastActivity = Date.now();
  const handle = await sandbox.pty.create({
    size: { cols: 120, rows: 40 },
    onData: (data) => {
      lastActivity = Date.now();
      processOutput(data);
    },
    timeout: 0 // No timeout
  });

  // 3. Monitor for silent drops
  const monitor = setInterval(async () => {
    const silentMs = Date.now() - lastActivity;
    
    // Check sandbox health every 30s
    const isRunning = await sandbox.isRunning();
    if (!isRunning) {
      clearInterval(monitor);
      await handleSandboxDeath();
      return;
    }
    
    // If silent for 2 minutes, verify PTY
    if (silentMs > 120000) {
      await verifyPtyHealth(handle.pid);
    }
  }, 30000);

  return { handle, monitor };
}

async function verifyPtyHealth(pid: number) {
  try {
    const processes = await sandbox.commands.list();
    const ptyProcess = processes.find(p => p.pid === pid);
    if (!ptyProcess) {
      // PTY died, need to recreate
      await recreatePty();
    }
  } catch (error) {
    // Connection issue
    await attemptReconnection();
  }
}
```

## Key Takeaways

1. **PTY sessions have a 60-second default timeout** - Always set `timeout: 0` for long-running sessions
2. **Sandbox timeout resets on connection** - Always call `setTimeout()` after connecting
3. **No built-in keepalive or heartbeat** - Implement your own health monitoring
4. **Use `disconnect()` for graceful stream management** - Process continues, can reconnect
5. **`commands.connect(pid)` enables reconnection** - Use this to resume monitoring
6. **`isRunning()` checks sandbox health** - Poll this periodically
7. **`commands.list()` returns all processes** - Use to verify PTY is still alive
8. **Silent drops are not detected automatically** - Implement activity timeout monitoring

## Recommended Architecture for Reliable PTY

```
┌─────────────────────────────────────────────────────────────┐
│                     Orchestrator UI                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ PTY Manager  │  │ Health Check │  │ Reconnect Handler│  │
│  │              │  │   (30s poll) │  │                  │  │
│  │ - onCreate   │  │              │  │ - onDisconnect   │  │
│  │ - onData     │◄─┤ - isRunning  │  │ - onTimeout      │  │
│  │ - onTimeout  │  │ - listProcs  │  │ - reconnectPty   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                      E2B SDK Layer                           │
│  - sandbox.pty.create({ timeout: 0 })                       │
│  - sandbox.setTimeout(86400000)                             │
│  - sandbox.isRunning()                                      │
│  - sandbox.commands.list()                                  │
│  - sandbox.commands.connect(pid)                            │
└─────────────────────────────────────────────────────────────┘
```

## Code Examples

### Complete Resilient PTY Implementation

```typescript
import { Sandbox } from '@e2b/code-interpreter';

interface PtyManager {
  handle: AsyncCommandHandle;
  healthCheck: NodeJS.Timeout;
  activityCheck: NodeJS.Timeout;
  lastActivity: number;
}

async function createResilientPty(
  sandboxId: string,
  onData: (data: string) => void,
  onDisconnect: () => void
): Promise<PtyManager> {
  // Connect to sandbox with extended timeout
  const sandbox = await Sandbox.connect(sandboxId, {
    timeoutMs: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  // Ensure sandbox timeout is extended
  await sandbox.setTimeout(24 * 60 * 60 * 1000);
  
  let lastActivity = Date.now();
  
  // Create PTY with no timeout
  const handle = await sandbox.pty.create({
    size: { cols: 120, rows: 40 },
    onData: (data) => {
      lastActivity = Date.now();
      onData(data.toString());
    },
    timeout: 0 // Critical: no timeout
  });
  
  // Health check - verify sandbox is running
  const healthCheck = setInterval(async () => {
    try {
      const isRunning = await sandbox.isRunning();
      if (!isRunning) {
        clearInterval(healthCheck);
        onDisconnect();
      }
    } catch (error) {
      // Network error - connection lost
      clearInterval(healthCheck);
      onDisconnect();
    }
  }, 30000);
  
  // Activity check - detect silent drops
  const activityCheck = setInterval(async () => {
    const silentMs = Date.now() - lastActivity;
    if (silentMs > 120000) { // 2 minutes of silence
      // Verify PTY process is still alive
      const processes = await sandbox.commands.list();
      const ptyAlive = processes.some(p => p.pid === handle.pid);
      if (!ptyAlive) {
        clearInterval(activityCheck);
        onDisconnect();
      }
    }
  }, 30000);
  
  return {
    handle,
    healthCheck,
    activityCheck,
    lastActivity
  };
}

// Usage
const pty = await createResilientPty(
  'sandbox-123',
  (data) => updateUI(data),
  () => showReconnectDialog()
);
```

## Sources

- E2B SDK via Context7 (e2b-dev/e2b)
- E2B Code Interpreter via Context7 (e2b-dev/code-interpreter)
- SDK Reference versions: v1.0.1 through v2.1.4 (Python and TypeScript)
