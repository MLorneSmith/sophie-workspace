# Context7 Research: E2B Sandbox SDK API

**Date**: 2025-12-18
**Agent**: context7-expert
**Libraries Researched**: e2b-dev/e2b (8097 stars)

## Query Summary

Researched E2B SDK documentation for:
1. Preview URLs / Public URLs - exposing sandbox ports to the internet
2. Streaming output - real-time stdout/stderr from commands
3. Sandbox lifecycle - timeouts, keepAlive, terminated errors
4. Command timeouts - handling long-running commands

## Findings

### 1. Preview URLs / Public URLs (getHost)

The `getHost()` method generates a public URL for a specific port running inside the sandbox.

**JavaScript/TypeScript:**
```typescript
import { Sandbox } from '@e2b/code-interpreter'

const sandbox = await Sandbox.create()
// Start an HTTP server
await sandbox.commands.exec('python3 -m http.server 3000')

// Get the hostname for the HTTP server
const host = sandbox.getHost(3000)
console.log(`https://${host}`)  // Public URL accessible from internet
```

**Python:**
```python
from e2b_code_interpreter import Sandbox

sandbox = Sandbox.create()

# You MUST always pass a port number to get the host
host = sandbox.get_host(3000)
print(f'https://{host}')
```

**Key Points:**
- `getHost(port)` / `get_host(port)` returns the external host address
- Port number is **required** - cannot get a generic sandbox URL
- The returned URL can be used with HTTP or WebSocket connections
- Works for any service running on any port in the sandbox

### 2. Streaming Output (stdout/stderr)

Real-time streaming is achieved through callbacks: `onStdout`/`onStderr` (JS) or `on_stdout`/`on_stderr` (Python).

**JavaScript - Streaming Command Output:**
```typescript
import { Sandbox } from '@e2b/code-interpreter'

const sandbox = await Sandbox.create()
const result = await sandbox.commands.run('echo hello; sleep 1; echo world', {
  onStdout: (data) => {
    console.log('stdout:', data)  // Called as each line is produced
  },
  onStderr: (data) => {
    console.error('stderr:', data)
  },
})
```

**Python - Streaming Command Output:**
```python
from e2b_code_interpreter import Sandbox

sandbox = Sandbox.create()
result = sandbox.commands.run(
    'echo hello; sleep 1; echo world',
    on_stdout=lambda data: print('stdout:', data),
    on_stderr=lambda data: print('stderr:', data)
)
```

**JavaScript - Streaming Code Execution:**
```typescript
import { Sandbox } from '@e2b/code-interpreter'

const codeToRun = `
import time
import sys
print("This goes first to stdout")
time.sleep(3)
print("This goes later to stderr", file=sys.stderr)
time.sleep(3)
print("This goes last")
`

const sandbox = await Sandbox.create()
sandbox.runCode(codeToRun, {
  onError: error => console.error('error:', error),
  onStdout: data => console.log('stdout:', data),
  onStderr: data => console.error('stderr:', data),
})
```

**Background Command with Iteration (Python):**
```python
from e2b_code_interpreter import Sandbox

sandbox = Sandbox.create()

# Start the command in the background
command = sandbox.commands.run('echo hello; sleep 10; echo world', background=True)

# Iterate through output as it becomes available
for stdout, stderr, _ in command:
    if stdout:
        print(stdout)
    if stderr:
        print(stderr)

# Kill the command when done
command.kill()
```

**Key Points:**
- Callbacks fire in real-time as output is produced
- Use `onError`/`on_error` for runtime code errors
- Background commands return a handle for iteration

### 3. Sandbox Lifecycle

**Default Timeout & Limits:**
- Default sandbox timeout: 60 seconds
- Maximum timeout:
  - **Pro users**: 24 hours (86,400 seconds / 86,400,000 ms)
  - **Hobby users**: 1 hour (3,600 seconds / 3,600,000 ms)

**Creating Sandbox with Custom Timeout:**
```typescript
// JavaScript - timeout in MILLISECONDS
import { Sandbox } from '@e2b/code-interpreter'
const sandbox = await Sandbox.create({
  timeoutMs: 60_000,  // 60 seconds
})
```

```python
# Python - timeout in SECONDS
from e2b_code_interpreter import Sandbox
sandbox = Sandbox.create(timeout=60)  # 60 seconds
```

**Changing Timeout at Runtime (Keep Alive):**
```typescript
// JavaScript
const sandbox = await Sandbox.create({ timeoutMs: 60_000 })
// Reset timeout to 30 seconds FROM NOW
await sandbox.setTimeout(30_000)
```

```python
# Python
sandbox = Sandbox.create(timeout=60)
# Reset timeout to 30 seconds FROM NOW
sandbox.set_timeout(30)
```

**Explicit Shutdown:**
```typescript
// JavaScript
await sandbox.kill()
```

```python
# Python
sandbox.kill()
```

**Setting Timeout by Sandbox ID (Remote Management):**
```typescript
// JavaScript - manage a sandbox without the instance
await Sandbox.setTimeout(sandbox_id, 3600_000)  // 1 hour
```

```python
# Python
Sandbox.set_timeout(sandbox_id="your_sandbox_id", timeout=3600)
```

### 4. Reconnecting to Sandboxes

**Connect to Existing Sandbox:**
```typescript
// JavaScript
import { Sandbox } from 'e2b'

const sandbox = await Sandbox.create()
const sandboxId = sandbox.sandboxId

// Later, or from a different environment:
const sameSandbox = await Sandbox.connect(sandboxId)
```

```python
# Python
from e2b import Sandbox

sandbox = Sandbox.create()
sandbox_id = sandbox.sandbox_id

# Connect from different location
same_sandbox = Sandbox.connect(sandbox_id)
```

**Pausing and Resuming Sandboxes:**
```python
# Python - pause and resume
sandbox = Sandbox.create()
sandbox.beta_pause()

# Later, connect will auto-resume:
connected_sandbox = sandbox.connect()
# OR by ID:
connected_sandbox = Sandbox.connect(sandbox_id)
```

**Key Points for Terminated Errors:**
- Sandbox dies when timeout expires
- Use `sandbox.isRunning()` / `sandbox.is_running()` to check status
- Reconnect using `Sandbox.connect(sandbox_id)` if sandbox is still alive
- Paused sandboxes are automatically resumed on connect
- Always store `sandboxId` if you need to reconnect later

### 5. Command Timeouts

**Default Command Timeout:** 60 seconds

**Setting Command Timeout:**
```typescript
// JavaScript
const result = await sandbox.commands.run('long-running-command', {
  timeout: 300_000,  // 5 minutes in milliseconds
  onStdout: (data) => console.log(data),
})
```

```python
# Python
result = sandbox.commands.run(
    'long-running-command',
    timeout=300,  # 5 minutes in seconds
    on_stdout=lambda data: print(data)
)
```

**Background Commands (for very long processes):**
```typescript
// JavaScript
const command = await sandbox.commands.run('npm run build', {
  background: true,
  onStdout: (data) => console.log(data),
})

// Later, can wait for completion or kill:
await command.wait()  // Wait for completion
// OR
await command.kill()  // Terminate early
```

```python
# Python
command = sandbox.commands.run(
    'npm run build',
    background=True
)

# Wait for completion
result = command.wait()

# OR kill early
command.kill()
```

**Using 0 for Unlimited Timeout:**
```python
# Python - unlimited command timeout
result = sandbox.commands.run(
    'very-long-command',
    timeout=0  # No timeout limit (uses sandbox timeout as upper bound)
)
```

## Key Takeaways

1. **getHost(port)** is the only way to get public URLs - always requires a port number
2. **Streaming** uses `onStdout`/`onStderr` callbacks that fire in real-time
3. **Sandbox timeout** defaults to 60s, max 24h (Pro) or 1h (Hobby)
4. **setTimeout()** resets the countdown from NOW - use for keep-alive patterns
5. **Command timeout** defaults to 60s, use `timeout: 0` for unlimited
6. **Background commands** with `background: true` for very long processes
7. **Reconnection** via `Sandbox.connect(sandboxId)` works across environments
8. **Paused sandboxes** auto-resume on connect

## Code Examples - Complete Patterns

### Keep Sandbox Alive Pattern
```typescript
import { Sandbox } from '@e2b/code-interpreter'

const sandbox = await Sandbox.create({ timeoutMs: 300_000 })  // 5 min initial

// Periodic keep-alive
const keepAliveInterval = setInterval(async () => {
  try {
    const isRunning = await sandbox.isRunning()
    if (isRunning) {
      await sandbox.setTimeout(300_000)  // Reset to 5 more minutes
    } else {
      clearInterval(keepAliveInterval)
    }
  } catch (error) {
    console.error('Sandbox may be terminated:', error)
    clearInterval(keepAliveInterval)
  }
}, 240_000)  // Every 4 minutes
```

### Start Dev Server and Get URL Pattern
```typescript
import { Sandbox } from '@e2b/code-interpreter'

const sandbox = await Sandbox.create({ timeoutMs: 3600_000 })  // 1 hour

// Start the dev server in background
const devServer = await sandbox.commands.run('npm run dev', {
  background: true,
  onStdout: (data) => console.log('[dev]', data),
  onStderr: (data) => console.error('[dev]', data),
})

// Wait a moment for server to start
await new Promise(resolve => setTimeout(resolve, 5000))

// Get public URL
const previewUrl = `https://${sandbox.getHost(3000)}`
console.log('Preview URL:', previewUrl)

// Later: cleanup
await devServer.kill()
await sandbox.kill()
```

### Streaming Long Command Pattern
```typescript
import { Sandbox } from '@e2b/code-interpreter'

async function runWithProgress(sandbox: Sandbox, command: string) {
  const logs: string[] = []
  
  const result = await sandbox.commands.run(command, {
    timeout: 600_000,  // 10 minutes
    onStdout: (data) => {
      logs.push(data)
      process.stdout.write(data)  // Real-time output
    },
    onStderr: (data) => {
      logs.push(`[ERROR] ${data}`)
      process.stderr.write(data)
    },
  })
  
  return {
    success: result.exitCode === 0,
    logs: logs.join(''),
    exitCode: result.exitCode,
  }
}
```

## Sources

- E2B SDK Documentation via Context7 (e2b-dev/e2b)
- SDK Reference: JS SDK v2.1.5, Python SDK v2.1.4
- Topics: sandbox, commands, streaming, timeout, lifecycle
