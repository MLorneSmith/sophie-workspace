# Context7 Research: E2B SDK for TypeScript

**Date**: 2026-01-23
**Agent**: context7-expert
**Libraries Researched**: e2b-dev/e2b, e2b-dev/code-interpreter

## Query Summary

Research on E2B SDK documentation for TypeScript focusing on:
1. Sandbox creation with `Sandbox.create()` and timeout configuration
2. The `sandbox.getHost(port)` method for public URLs
3. The `sandbox.commands.run()` method with `background: true` option
4. Sandbox lifecycle management (creation, timeout extension, destruction)
5. Common issues with sandbox timeouts or unavailability

## Findings

### 1. Sandbox Creation and Timeout Configuration

#### `Sandbox.create()` Method

Creates a new isolated cloud sandbox environment with full customization options.

```typescript
import { Sandbox } from '@e2b/code-interpreter'

// Basic creation with default 5 minute timeout
const sandbox = await Sandbox.create()

// Create with custom timeout (in milliseconds for JS)
const sandbox = await Sandbox.create({
  timeoutMs: 60_000, // 60 seconds
})

// Full options
const sandbox = await Sandbox.create({
  template: 'your-template-name',  // Custom template (optional)
  timeoutMs: 300_000,              // Timeout in milliseconds (default: 300,000 = 5 min)
  metadata: { userId: '123' },     // Custom metadata
  envs: { MY_VAR: 'value' },       // Environment variables
  secure: true,                    // Secure with access token (default: true)
  allowInternetAccess: true,       // Internet access (default: true)
})
```

**Critical Notes on Timeout:**
- **JavaScript/TypeScript uses milliseconds** (`timeoutMs`)
- **Python uses seconds** (`timeout`)
- **Default timeout**: 300,000ms (5 minutes)
- **Maximum timeout**:
  - **Pro users**: 24 hours (86,400,000 ms)
  - **Hobby users**: 1 hour (3,600,000 ms)

#### Beta Features: Auto-Pause

```typescript
import { Sandbox } from '@e2b/code-interpreter'

// Create sandbox with auto-pause enabled (Beta)
const sandbox = await Sandbox.betaCreate({
  autoPause: true,                    // Auto-pause after timeout
  timeoutMs: 10 * 60 * 1000           // 10 minutes
})
```

### 2. Extending Sandbox Timeout with `setTimeout()`

You can dynamically extend or reduce sandbox timeout during its lifecycle:

```typescript
// Instance method - extend current sandbox
await sandbox.setTimeout(3_600_000) // Set to 1 hour

// Static method - extend any sandbox by ID
await Sandbox.setTimeout('sandbox-id', 60_000) // Set to 1 minute
```

**Important**: Timeout is reset when connecting to a paused sandbox. Use `timeoutMs` option when reconnecting.

### 3. `sandbox.getHost(port)` Method

Get the public URL to access services running inside the sandbox.

```typescript
import { Sandbox } from '@e2b/code-interpreter'

const sandbox = await Sandbox.create()

// Start a service in the sandbox
await sandbox.commands.exec('python3 -m http.server 3000')

// Get the public host address
const host = sandbox.getHost(3000)

// Access the service
console.log(`Access your server at: https://${host}`)
```

**Key Points:**
- **Always requires a port number** - you cannot get a generic host URL
- Returns a string like `localhost:12345` or a public E2B domain
- Works for HTTP and WebSocket connections
- The URL format varies between local development and production

### 4. `sandbox.commands.run()` with Background Option

Run long-running commands in the background without blocking.

```typescript
import { Sandbox } from '@e2b/code-interpreter'

const sandbox = await Sandbox.create()

// Start command in background
const command = await sandbox.commands.run('echo hello; sleep 10; echo world', {
  background: true,
  onStdout: (data) => {
    console.log('stdout:', data)
  },
  onStderr: (data) => {
    console.error('stderr:', data)
  },
})

// Command continues running after method returns
// You can do other work here...

// Later, kill the background command
await command.kill()

// Or wait for it to complete
await command.wait()
```

**Background Command Options:**
```typescript
interface RunCommandOptions {
  background: true;                // Required for background execution
  envs?: Record<string, string>;   // Environment variables
  user?: string;                   // User to run as (default: "user")
  cwd?: string;                    // Working directory
  timeout?: number;                // Command timeout (default: 60s, 0 = no limit)
  onStdout?: (data: Stdout) => void;
  onStderr?: (data: Stderr) => void;
  requestTimeoutMs?: number;       // Request timeout
}
```

**Returned CommandHandle Methods:**
- `command.kill()` - Terminate the background process
- `command.wait()` - Wait for command completion
- `command.pid` - Process ID

### 5. Sandbox Lifecycle Management

#### Creating and Connecting

```typescript
// Create new sandbox
const sandbox = await Sandbox.create({ timeoutMs: 60_000 })
const sandboxId = sandbox.sandboxId

// Connect to existing sandbox (resumes if paused)
const sameSandbox = await Sandbox.connect(sandboxId, {
  timeoutMs: 60_000  // Reset timeout on connect
})
```

#### Checking Status

```typescript
// Check if sandbox is running
const isRunning = await sandbox.isRunning()
console.log(`Sandbox running: ${isRunning}`)
```

#### Pausing (Beta)

```typescript
// Pause a sandbox (preserves state)
await sandbox.betaPause()

// Or by ID
await Sandbox.betaPause(sandboxId)

// Later, connect to resume
const resumed = await Sandbox.connect(sandboxId)
```

#### Killing/Destroying

```typescript
// Kill instance
await sandbox.kill()

// Kill by ID (static method)
const wasKilled = await Sandbox.kill('sandbox-id')
console.log(`Sandbox killed: ${wasKilled}`)
```

### 6. Error Handling and Common Issues

#### Error Types

```typescript
import { 
  SandboxError,
  TimeoutError,
  AuthenticationError,
  RateLimitError,
  NotFoundError 
} from '@e2b/code-interpreter'

try {
  const sandbox = await Sandbox.create()
} catch (error) {
  if (error instanceof TimeoutError) {
    console.error('Sandbox creation timed out')
  } else if (error instanceof AuthenticationError) {
    console.error('Invalid API key')
  } else if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded')
  } else if (error instanceof NotFoundError) {
    console.error('Sandbox or template not found')
  } else if (error instanceof SandboxError) {
    console.error('General sandbox error:', error.message)
  }
}
```

#### Common Issues and Solutions

**1. Sandbox Creation Timeout**
- **Cause**: Network issues, API overload, or slow template initialization
- **Solution**: Increase `requestTimeoutMs` in options, implement retry logic

**2. Sandbox Becomes Unavailable**
- **Cause**: Sandbox timeout expired, sandbox was killed, or network disconnection
- **Solution**: 
  - Check with `isRunning()` before operations
  - Extend timeout with `setTimeout()` for long-running tasks
  - Implement reconnection logic with `connect()`

**3. Timeout Reset on Connect**
- **Behavior**: When connecting to a sandbox, timeout resets to default (5 min)
- **Solution**: Always pass `timeoutMs` when reconnecting

```typescript
// Wrong - timeout resets to 5 minutes
const sandbox = await Sandbox.connect(sandboxId)

// Correct - specify desired timeout
const sandbox = await Sandbox.connect(sandboxId, { timeoutMs: 3_600_000 })
```

**4. Background Command Cleanup**
- **Issue**: Background commands continue after your script ends
- **Solution**: Always clean up with `command.kill()` or use `try/finally`

```typescript
const command = await sandbox.commands.run('long-running-task', { background: true })
try {
  // Your logic here
  await someOperation()
} finally {
  await command.kill()
  await sandbox.kill()
}
```

## Key Takeaways

1. **Timeout units differ**: JavaScript uses milliseconds (`timeoutMs`), Python uses seconds (`timeout`)

2. **Default timeout is 5 minutes** - Always set appropriate timeout for long-running tasks

3. **Maximum sandbox duration**:
   - Pro: 24 hours
   - Hobby: 1 hour

4. **`getHost(port)` always requires a port** - No way to get generic sandbox URL

5. **Background commands** must be explicitly killed or they continue running

6. **Timeout resets on connect** - Always specify `timeoutMs` when reconnecting

7. **Use `isRunning()` to check sandbox health** before critical operations

8. **Auto-pause (beta)** preserves sandbox state and reduces costs for long-idle sandboxes

## Code Examples

### Complete Sandbox Lifecycle Example

```typescript
import { Sandbox } from '@e2b/code-interpreter'

async function runSandboxTask() {
  // Create sandbox with 30 minute timeout
  const sandbox = await Sandbox.create({
    timeoutMs: 30 * 60 * 1000,
    envs: { NODE_ENV: 'development' }
  })

  try {
    // Run a background server
    const server = await sandbox.commands.run('python3 -m http.server 8080', {
      background: true
    })

    // Get the public URL
    const host = sandbox.getHost(8080)
    console.log(`Server available at: https://${host}`)

    // Extend timeout if needed
    await sandbox.setTimeout(60 * 60 * 1000) // 1 hour

    // Do work with the server...
    await doWorkWithServer(host)

    // Check if still running
    if (await sandbox.isRunning()) {
      console.log('Sandbox still active')
    }

  } finally {
    // Clean up
    await sandbox.kill()
  }
}
```

### Robust Connection with Retry

```typescript
async function connectWithRetry(sandboxId: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const sandbox = await Sandbox.connect(sandboxId, {
        timeoutMs: 60_000,
        requestTimeoutMs: 30_000
      })
      
      if (await sandbox.isRunning()) {
        return sandbox
      }
    } catch (error) {
      console.warn(`Connection attempt ${attempt} failed:`, error)
      if (attempt === maxRetries) throw error
      await new Promise(r => setTimeout(r, 1000 * attempt)) // Backoff
    }
  }
}
```

## Sources

- E2B SDK via Context7 (e2b-dev/e2b)
- E2B Code Interpreter SDK via Context7 (e2b-dev/code-interpreter)
- Official documentation: https://github.com/e2b-dev/e2b
