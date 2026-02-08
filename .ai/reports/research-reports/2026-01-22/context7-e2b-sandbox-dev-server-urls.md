# Context7 Research: E2B Sandbox Dev Server URLs and Background Processes

**Date**: 2026-01-22
**Agent**: context7-expert
**Libraries Researched**: e2b-dev/e2b

## Query Summary

Researched E2B SDK documentation to understand:
1. How to start a dev server in an E2B sandbox
2. How to get public URLs for services running on specific ports
3. Best practices for keeping sandboxes alive after orchestration
4. How to run background processes that persist

## Findings

### 1. Getting Public URLs for Sandbox Ports

The `sandbox.getHost(port)` method returns the public URL for a service running on a specific port inside the sandbox.

**TypeScript:**
```typescript
import { Sandbox } from '@e2b/code-interpreter'

const sandbox = await Sandbox.create()

// Get the public host for port 3000
const host = sandbox.getHost(3000)
const url = `https://${host}`
console.log(`Server accessible at: ${url}`)
```

**Python:**
```python
from e2b_code_interpreter import Sandbox

sandbox = Sandbox.create()

# Get the public host for port 3000
host = sandbox.get_host(3000)
url = f"https://{host}"
print(f"Server accessible at: {url}")
```

**Key Points:**
- You MUST always pass a port number to `getHost()` / `get_host()`
- The returned host can be used to connect via HTTP or WebSocket from outside the sandbox
- Format: `https://{host}` for HTTP connections

### 2. Running Background Processes (Dev Servers)

To run a process that persists after the command returns, use `background: true` option.

**TypeScript:**
```typescript
import { Sandbox } from '@e2b/code-interpreter'

const sandbox = await Sandbox.create()

// Start dev server in background - command returns immediately
const command = await sandbox.commands.run('pnpm dev', {
  background: true,
  onStdout: (data) => {
    console.log(data)
  },
})

// Get the public URL
const host = sandbox.getHost(3000)
const url = `https://${host}`
console.log('Server started at:', url)

// Later, when done:
await command.kill()
```

**Python:**
```python
from e2b_code_interpreter import Sandbox

sandbox = Sandbox.create()

# Start command in background
command = sandbox.commands.run('pnpm dev', background=True)

# Get stdout/stderr from background process
for stdout, stderr, _ in command:
    if stdout:
        print(stdout)
    if stderr:
        print(stderr)

# Kill when done
command.kill()
```

**Key Points:**
- `background: true` makes the command run asynchronously
- Returns a `CommandHandle` that can be used to:
  - Stream stdout/stderr
  - Wait for completion with `command.wait()`
  - Kill the process with `command.kill()`
- The process persists even after the initial command returns

### 3. Keeping Sandboxes Alive (Timeout Management)

**Setting Initial Timeout on Creation:**
```typescript
const sandbox = await Sandbox.create({
  timeout: 3600  // 1 hour in seconds
})
```

**Extending Timeout After Creation:**

**TypeScript:**
```typescript
// Set/extend timeout for current sandbox instance
await sandbox.setTimeout(3600)  // 1 hour

// Or set timeout for a sandbox by ID
await Sandbox.setTimeout(sandboxId, 3600)
```

**Python:**
```python
# Set/extend timeout for current sandbox instance
sandbox.set_timeout(3600)  # 1 hour

# Or set timeout for a sandbox by ID (static method)
Sandbox.set_timeout(sandbox_id, timeout=3600)
```

**Maximum Timeout Limits:**
- **Pro users**: 24 hours (86,400 seconds)
- **Hobby users**: 1 hour (3,600 seconds)

**Key Points:**
- Default timeout is 300 seconds (5 minutes)
- `set_timeout()` can extend OR reduce existing timeout
- Sandbox is automatically killed when timeout expires
- Use `set_timeout()` to keep sandbox alive for review

### 4. Complete Dev Server Pattern

**Full Example - TypeScript:**
```typescript
import { Sandbox } from '@e2b/code-interpreter'

async function startDevServer() {
  // Create sandbox with extended timeout (1 hour)
  const sandbox = await Sandbox.create({
    timeout: 3600
  })

  // Install dependencies (foreground, wait for completion)
  await sandbox.commands.run('pnpm install')

  // Start dev server in background
  const devServer = await sandbox.commands.run('pnpm dev', {
    background: true,
    onStdout: (data) => console.log('[stdout]', data),
    onStderr: (data) => console.error('[stderr]', data),
  })

  // Wait a moment for server to start
  await new Promise(resolve => setTimeout(resolve, 5000))

  // Get public URL
  const host = sandbox.getHost(3000)
  const publicUrl = `https://${host}`

  console.log(`Dev server running at: ${publicUrl}`)
  console.log(`Sandbox ID: ${sandbox.sandboxId}`)

  return {
    sandbox,
    devServer,
    publicUrl,
    sandboxId: sandbox.sandboxId
  }
}

// Later, to extend sandbox lifetime:
async function keepAlive(sandboxId: string) {
  await Sandbox.setTimeout(sandboxId, 3600)  // Add another hour
}

// To cleanup:
async function cleanup(sandbox: Sandbox, devServer: CommandHandle) {
  await devServer.kill()
  await sandbox.kill()
}
```

**Full Example - Python:**
```python
from e2b_code_interpreter import Sandbox
import time

def start_dev_server():
    # Create sandbox with extended timeout
    sandbox = Sandbox.create(timeout=3600)  # 1 hour

    # Install dependencies
    sandbox.commands.run('pnpm install')

    # Start dev server in background
    dev_server = sandbox.commands.run('pnpm dev', background=True)

    # Wait for server to start
    time.sleep(5)

    # Get public URL
    host = sandbox.get_host(3000)
    public_url = f"https://{host}"

    print(f"Dev server running at: {public_url}")
    print(f"Sandbox ID: {sandbox.sandbox_id}")

    return sandbox, dev_server, public_url

# To extend sandbox lifetime
def keep_alive(sandbox_id: str):
    Sandbox.set_timeout(sandbox_id, timeout=3600)

# To cleanup
def cleanup(sandbox, dev_server):
    dev_server.kill()
    sandbox.kill()
```

## Key Takeaways

- **`getHost(port)`** returns the public hostname for accessing a port from outside the sandbox
- **`background: true`** runs commands asynchronously, allowing dev servers to persist
- **`set_timeout(seconds)`** extends sandbox lifetime (max 24h for Pro, 1h for Hobby)
- Default timeout is only 300 seconds (5 minutes) - always set a longer timeout for dev servers
- Use `https://{host}` format for the public URL
- The `CommandHandle` returned from background commands allows streaming output and killing the process

## API Reference Summary

| Method | Description |
|--------|-------------|
| `sandbox.getHost(port)` | Get public hostname for a sandbox port |
| `sandbox.commands.run(cmd, {background: true})` | Run command in background |
| `sandbox.setTimeout(seconds)` | Set/extend sandbox timeout |
| `Sandbox.setTimeout(sandboxId, seconds)` | Set timeout by sandbox ID |
| `commandHandle.kill()` | Kill a background process |
| `commandHandle.wait()` | Wait for background process to complete |

## Sources

- E2B SDK Documentation via Context7 (e2b-dev/e2b)
  - SDK Reference: JS SDK v1.0.0 - v2.1.5
  - SDK Reference: Python SDK v1.0.2 - v2.1.3
  - Guides: Internet Access, Background Commands
