# Context7 Research: E2B PTY Handling and Process Termination Detection

**Date**: 2026-01-27
**Agent**: context7-expert
**Libraries Researched**: @e2b/code-interpreter, e2b-dev/e2b, e2b-dev/e2b-cookbook

## Query Summary

Investigated E2B SDK documentation for PTY (pseudo-terminal) handling patterns, specifically:
1. How the PTY `wait()` function works
2. What happens when a PTY process crashes or exits with an error
3. How to detect if a PTY process has terminated vs is still running
4. Events or callbacks for PTY process termination
5. Best practices for handling PTY timeouts and error recovery

**Context**: Debugging an issue where the Alpha Orchestrator hangs when Claude Code crashes inside an E2B sandbox. The PTY wait loop continues indefinitely even after the process crashes with "Error: No messages returned".

## Findings

### 1. How PTY `wait()` Function Works

The `wait()` function is available on `CommandHandle` (sync) and `AsyncCommandHandle` (async) objects returned when creating PTY sessions or running commands.

**Key Behaviors**:
- Blocks until the command finishes execution
- Returns a `CommandResult` object containing stdout, stderr, and exit_code
- Throws `CommandExitException` if the command exits with non-zero status code
- Supports optional callbacks for `on_pty`, `on_stdout`, `on_stderr` to stream output during wait

```python
# Python API
def wait(
    on_pty: Optional[Callable[[PtyOutput], None]] = None,
    on_stdout: Optional[Callable[[str], None]] = None,
    on_stderr: Optional[Callable[[str], None]] = None
) -> CommandResult

# Throws CommandExitException if exit_code != 0
```

```typescript
// TypeScript API
interface CommandHandle {
  wait(): Promise<CommandResult>;
  // When background: true, use handle.wait() to get final result
}
```

### 2. What Happens When PTY Process Crashes/Exits with Error

**Documentation indicates**:
- `wait()` throws `CommandExitException` for non-zero exit codes
- The `exit_code` property is `None` if command is still running
- The `error` property contains command execution error message
- **CRITICAL GAP**: Documentation does NOT explicitly describe behavior when PTY process crashes unexpectedly (e.g., network issues, sandbox failure)

**AsyncCommandHandle Properties**:
```python
class AsyncCommandHandle:
    @property
    def pid(self) -> int
    @property
    def stdout(self) -> str
    @property
    def stderr(self) -> str
    @property
    def error(self) -> Optional[str]  # Execution error message
    @property
    def exit_code(self) -> Optional[int]  # None if still running, 0 for success
```

### 3. Detecting Process Termination vs Running

**Available Detection Methods**:

1. **exit_code Property**: Check if `None` (running) or integer (finished)
   ```python
   if handle.exit_code is None:
       print("Still running")
   else:
       print(f"Finished with code: {handle.exit_code}")
   ```

2. **disconnect() Method**: Stops receiving events without killing process
   - Can reconnect later using `sandbox.commands.connect(pid)`
   - Does NOT terminate the command

3. **kill() Method**: Terminates using SIGKILL
   - Returns `True` if killed successfully
   - Returns `False` if process not found

**IMPORTANT**: No explicit `is_alive()` or polling method documented!

### 4. Events/Callbacks for PTY Process Termination

**Available Callbacks**:

| Callback | Purpose | When Called |
|----------|---------|-------------|
| `on_data` | PTY output handler | When PTY produces output |
| `on_stdout` | Stdout stream | When stdout data arrives |
| `on_stderr` | Stderr stream | When stderr data arrives |
| `on_error` | Execution errors | Runtime code errors |
| `on_exit` | Exit notification | **Only documented for `watch_dir`** |

**CRITICAL GAP**: No `on_exit` callback for PTY creation!

The `on_exit` callback is ONLY mentioned for file watching:
```python
# Only available for watch_dir, NOT for PTY
async def watch_dir(
    path: str,
    on_event: OutputHandler[FilesystemEvent],
    on_exit: Optional[OutputHandler[Exception]] = None,  # Exit callback
    ...
) -> AsyncWatchHandle
```

### 5. Timeout Handling

**Available Timeout Options**:

| Timeout | Purpose | Default |
|---------|---------|---------|
| `timeout` / `timeoutMs` | Command execution timeout | 60 seconds |
| `request_timeout` / `requestTimeoutMs` | API request timeout | 30-60 seconds |

**PTY Creation with Timeouts**:
```python
# Python
async def create(
    size: PtySize,
    on_data: OutputHandler[PtyOutput],
    timeout: Optional[float] = 60,          # PTY lifetime
    request_timeout: Optional[float] = None  # Creation request
) -> AsyncCommandHandle
```

```typescript
// TypeScript
interface CommandStartOpts {
  timeoutMs?: number;         // Command timeout (default: 60_000)
  requestTimeoutMs?: number;  // Request timeout (default: 30_000-60_000)
}
```

## Recommendations for Alpha Orchestrator

### Problem Analysis

The orchestrator hangs because:
1. E2B PTY `wait()` has no built-in mechanism to detect unexpected process crashes
2. There's no `on_exit` callback for PTY sessions
3. When Claude Code crashes, the PTY stream may stop producing data but `wait()` doesn't timeout

### Recommended Patterns

#### Pattern 1: Implement Custom Timeout Wrapper

```typescript
async function waitWithTimeout(
  handle: CommandHandle,
  timeoutMs: number,
  onTimeout: () => void
): Promise<CommandResult | null> {
  const timeoutPromise = new Promise<null>((resolve) => {
    setTimeout(() => {
      onTimeout();
      resolve(null);
    }, timeoutMs);
  });
  
  return Promise.race([
    handle.wait(),
    timeoutPromise
  ]);
}
```

#### Pattern 2: Activity-Based Timeout

```typescript
let lastActivityTime = Date.now();
const INACTIVITY_TIMEOUT = 60_000; // 60 seconds of no output = dead

handle.wait({
  onStdout: (data) => {
    lastActivityTime = Date.now();
    // process output
  },
  onStderr: (data) => {
    lastActivityTime = Date.now();
    // process output
  }
});

// Separate monitor
const monitor = setInterval(() => {
  if (Date.now() - lastActivityTime > INACTIVITY_TIMEOUT) {
    console.log("No activity detected, killing process");
    handle.kill();
    clearInterval(monitor);
  }
}, 10_000);
```

#### Pattern 3: Exit Code Polling (Fallback)

```typescript
async function pollForExit(handle: CommandHandle, intervalMs: number = 1000) {
  return new Promise<CommandResult>((resolve, reject) => {
    const poll = setInterval(async () => {
      // Access exit_code to check if process finished
      if (handle.exit_code !== undefined) {
        clearInterval(poll);
        if (handle.exit_code === 0) {
          resolve({ stdout: handle.stdout, stderr: handle.stderr, exit_code: 0 });
        } else {
          reject(new Error(`Process exited with code ${handle.exit_code}`));
        }
      }
    }, intervalMs);
  });
}
```

#### Pattern 4: Graceful Shutdown Detection

```typescript
const SHUTDOWN_MARKERS = [
  "Error: No messages returned",
  "Connection closed",
  "Process terminated"
];

handle.wait({
  onStderr: (data) => {
    for (const marker of SHUTDOWN_MARKERS) {
      if (data.includes(marker)) {
        console.log("Detected crash marker, initiating cleanup");
        handle.kill();
        return;
      }
    }
  }
});
```

## Key Takeaways

1. **No built-in crash detection**: E2B PTY `wait()` blocks until process exits normally or timeout
2. **exit_code = None means running**: Poll this property for status
3. **CommandExitException for non-zero exits**: Handle this exception for graceful error handling
4. **No on_exit callback for PTY**: Unlike `watch_dir`, PTY sessions lack exit notifications
5. **Implement custom monitoring**: Use activity-based timeouts or output parsing to detect crashes
6. **kill() returns boolean**: Use return value to confirm termination

## Code Examples

### Robust PTY Monitoring (Recommended Implementation)

```typescript
import { Sandbox } from '@e2b/code-interpreter';

async function runWithMonitoring(
  sandbox: Sandbox,
  command: string,
  opts: {
    maxInactivityMs?: number;
    maxTotalMs?: number;
    onOutput?: (data: string) => void;
  } = {}
) {
  const { 
    maxInactivityMs = 120_000,  // 2 minutes no activity
    maxTotalMs = 3600_000,      // 1 hour total
    onOutput 
  } = opts;

  let lastActivity = Date.now();
  let isComplete = false;
  let result: CommandResult | null = null;
  let error: Error | null = null;

  const handle = await sandbox.commands.run(command, {
    background: true,
    onStdout: (data) => {
      lastActivity = Date.now();
      onOutput?.(data);
    },
    onStderr: (data) => {
      lastActivity = Date.now();
      onOutput?.(data);
    }
  });

  // Start monitoring
  const monitor = setInterval(() => {
    const now = Date.now();
    
    // Check inactivity timeout
    if (now - lastActivity > maxInactivityMs) {
      error = new Error(`Process inactive for ${maxInactivityMs}ms`);
      handle.kill();
      clearInterval(monitor);
    }
  }, 5000);

  // Total timeout
  const totalTimeout = setTimeout(() => {
    if (!isComplete) {
      error = new Error(`Process exceeded ${maxTotalMs}ms total time`);
      handle.kill();
    }
  }, maxTotalMs);

  try {
    result = await handle.wait();
    isComplete = true;
  } catch (e) {
    error = e as Error;
  } finally {
    clearInterval(monitor);
    clearTimeout(totalTimeout);
  }

  if (error) throw error;
  return result;
}
```

### Error Recovery Pattern

```typescript
async function runWithRetry(
  sandbox: Sandbox,
  command: string,
  maxRetries: number = 3
): Promise<CommandResult> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await runWithMonitoring(sandbox, command, {
        maxInactivityMs: 60_000,
        maxTotalMs: 600_000
      });
    } catch (error) {
      lastError = error as Error;
      console.log(`Attempt ${attempt} failed: ${lastError.message}`);
      
      // Check if sandbox is still healthy
      try {
        await sandbox.commands.run("echo 'health check'", { timeoutMs: 5000 });
      } catch {
        console.log("Sandbox unhealthy, recreating...");
        await sandbox.kill();
        sandbox = await Sandbox.create();
      }
    }
  }
  
  throw lastError;
}
```

## Sources

- E2B SDK (@e2b-dev/e2b) via Context7
- E2B Code Interpreter (@e2b-dev/code-interpreter) via Context7
- E2B Cookbook (@e2b-dev/e2b-cookbook) via Context7

## Related Documentation

- Python SDK: sandbox_async, sandbox_sync modules
- TypeScript SDK: commands module
- API endpoints: /sandbox/pty/*, /sandbox/commands/*
