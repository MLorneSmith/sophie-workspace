# Context7 Research: E2B SDK Real-Time Stdout Streaming

**Date**: 2026-01-14
**Agent**: context7-expert
**Libraries Researched**: e2b-dev/e2b (E2B SDK)

## Query Summary

Researched the best approaches for capturing real-time stdout/stderr from long-running CLI processes in E2B sandboxes, specifically addressing issues with `sandbox.commands.run()` and `onStdout` callback not receiving output even when the process is producing output.

## Key Findings

### 1. commands.run() vs pty.create() - Which is Better for Interactive CLI Tools?

**Recommendation: Use `pty.create()` for interactive CLI tools like Claude Code**

| Feature | `commands.run()` | `pty.create()` |
|---------|------------------|----------------|
| Best for | Simple commands, scripts | Interactive CLI tools, shells |
| Output handling | Line-buffered (may cause delays) | Real-time, character-level |
| TTY detection | No TTY allocated | Full PTY allocated |
| Interactive input | Limited via `send_stdin()` | Full interactive support |
| Color/formatting | May not work | Full ANSI support |

**Why PTY is better for Claude Code:**
- Many CLI tools detect if they're running in a TTY and change behavior (buffering, colors, progress indicators)
- Claude Code likely checks for TTY and may buffer output differently when no TTY is present
- PTY provides a proper terminal environment that interactive tools expect

### 2. How to Properly Stream Stdout from Long-Running Node.js Processes

#### Option A: Using commands.run() with Callbacks (Current Approach)

```javascript
import { Sandbox } from '@e2b/code-interpreter'

const sandbox = await Sandbox.create()

// Foreground execution with streaming callbacks
const result = await sandbox.commands.run('node long-running-script.js', {
  onStdout: (data) => {
    console.log('stdout:', data)
  },
  onStderr: (data) => {
    console.error('stderr:', data)
  },
  timeout: 0, // No timeout - important for long-running processes
})
```

#### Option B: Background Execution with Iteration (Better for Long-Running)

```javascript
import { Sandbox } from '@e2b/code-interpreter'

const sandbox = await Sandbox.create()

// Start in background
const command = await sandbox.commands.run('node long-running-script.js', {
  background: true,
  onStdout: (data) => {
    console.log('stdout:', data)
  },
})

// Can also iterate over output
for await (const [stdout, stderr] of command) {
  if (stdout) console.log(stdout)
  if (stderr) console.error(stderr)
}

// Or wait for completion
const result = await command.wait()
```

#### Option C: Using PTY (RECOMMENDED for Interactive CLI Tools)

```javascript
import { Sandbox } from '@e2b/code-interpreter'

const sandbox = await Sandbox.create()

// Create a PTY session
const ptyHandle = await sandbox.pty.create({
  size: { cols: 120, rows: 40 },
  onData: (data) => {
    // Real-time output as it happens
    console.log('pty output:', data.toString())
  },
})

// Send the command
await sandbox.pty.sendInput(ptyHandle.pid, Buffer.from('claude --dangerously-skip-permissions\n'))

// Wait for completion or manage lifecycle
await ptyHandle.wait()
```

### 3. Known Issues and Limitations with onStdout Callback

**Issue 1: Output Buffering**
- Node.js and many CLI tools buffer stdout when not connected to a TTY
- Standard library functions like `console.log()` are line-buffered
- Output may only arrive when buffer fills or process exits

**Issue 2: TTY Detection**
- Many tools check `process.stdout.isTTY` and behave differently
- Without a PTY, `isTTY` returns `false`, potentially causing:
  - Disabled progress bars
  - Disabled colors
  - Different buffering behavior
  - Suppressed real-time output

**Issue 3: Async Callback Timing**
- Callbacks are async and may not fire immediately
- Network latency between E2B sandbox and your code adds delay

### 4. Best Practices for Running Interactive CLI Tools in E2B

#### Practice 1: Use PTY for Interactive Tools
```javascript
// For tools that expect terminal interaction
const pty = await sandbox.pty.create({
  size: { cols: 120, rows: 40 },
  envs: {
    TERM: 'xterm-256color',
    FORCE_COLOR: '1',
  },
  onData: (output) => {
    handleOutput(output)
  },
})
```

#### Practice 2: Force Unbuffered Output
```javascript
// When using commands.run(), set environment variables to disable buffering
await sandbox.commands.run('node script.js', {
  envs: {
    NODE_OPTIONS: '--no-warnings',
    PYTHONUNBUFFERED: '1',  // For Python
    FORCE_COLOR: '1',
  },
  onStdout: (data) => console.log(data),
})
```

#### Practice 3: Use Background Mode with Extended Timeout
```javascript
const command = await sandbox.commands.run('long-running-command', {
  background: true,
  timeout: 0,  // Disable timeout for long-running processes
  onStdout: handleStdout,
  onStderr: handleStderr,
})

// Can disconnect and reconnect later
const pid = command.pid
command.disconnect()

// Later...
const reconnected = await sandbox.commands.connect(pid, {
  onStdout: handleStdout,
  onStderr: handleStderr,
})
```

#### Practice 4: Use stdbuf or script Command
```javascript
// Force line buffering using stdbuf
await sandbox.commands.run('stdbuf -oL node script.js', {
  onStdout: (data) => console.log(data),
})

// Or use script to allocate a PTY
await sandbox.commands.run('script -q -c "node script.js" /dev/null', {
  onStdout: (data) => console.log(data),
})
```

### 5. Buffering Workarounds

#### For Node.js Processes
```javascript
// In the Node.js script running inside E2B:
// Option 1: Use process.stdout.write with immediate flush
process.stdout.write('output\n')

// Option 2: Disable buffering (in the script)
process.stdout._handle?.setBlocking?.(true)

// Option 3: Use console with environment variable
// Set NODE_ENV=development sometimes helps
```

#### For the E2B Client
```javascript
// Workaround: Poll file output instead of relying on callbacks
const command = await sandbox.commands.run('node script.js > /tmp/output.log 2>&1', {
  background: true,
})

// Poll the output file
const pollOutput = async () => {
  while (command.exitCode === null) {
    const content = await sandbox.files.read('/tmp/output.log')
    processNewContent(content)
    await sleep(100) // Poll every 100ms
  }
}
```

## Recommended Solution for Claude Code in E2B

Based on the documentation, here's the recommended approach for running Claude Code:

```javascript
import { Sandbox } from '@e2b/code-interpreter'

async function runClaudeCode(sandbox, prompt) {
  // Use PTY for proper terminal emulation
  const pty = await sandbox.pty.create({
    size: { cols: 120, rows: 40 },
    cwd: '/home/user/project',
    envs: {
      TERM: 'xterm-256color',
      FORCE_COLOR: '1',
      CI: 'false',  // Ensure tool doesn't think it's in CI
    },
    timeout: 0,  // No timeout for long-running sessions
  })

  let outputBuffer = ''
  
  // Set up output handler
  const outputPromise = new Promise((resolve, reject) => {
    pty.onData = (data) => {
      const text = data.toString()
      outputBuffer += text
      
      // Stream to your handler
      onOutputReceived(text)
      
      // Check for completion markers
      if (isComplete(text)) {
        resolve(outputBuffer)
      }
    }
  })

  // Send the Claude command
  await sandbox.pty.sendInput(
    pty.pid, 
    Buffer.from(`claude --dangerously-skip-permissions -p "${prompt}"\n`)
  )

  // Wait for completion
  const result = await outputPromise
  
  // Cleanup
  await pty.kill()
  
  return result
}
```

## Alternative: Hybrid Approach with File Watching

If PTY doesn't work as expected, use file watching as a fallback:

```javascript
import { Sandbox } from '@e2b/code-interpreter'

async function runClaudeCodeWithFileWatching(sandbox, prompt) {
  const outputFile = '/tmp/claude-output.log'
  
  // Set up file watcher
  const watcher = await sandbox.files.watchDir('/tmp', (event) => {
    if (event.path === outputFile) {
      // Read and process new content
      const content = await sandbox.files.read(outputFile)
      processOutput(content)
    }
  })

  // Run command with output redirected to file
  // Use 'unbuffer' or 'stdbuf' for real-time output
  const command = await sandbox.commands.run(
    `unbuffer claude --dangerously-skip-permissions -p "${prompt}" 2>&1 | tee ${outputFile}`,
    {
      background: true,
      timeout: 0,
      onStdout: (data) => {
        // This may or may not fire - file watching is the backup
        console.log('stdout callback:', data)
      },
    }
  )

  await command.wait()
  await watcher.stop()
  
  return await sandbox.files.read(outputFile)
}
```

## Key Takeaways

1. **Use PTY (`sandbox.pty.create()`) for interactive CLI tools** - It provides proper terminal emulation that tools like Claude Code expect

2. **The `onStdout` callback issue is likely due to buffering** - When no TTY is present, Node.js and many tools buffer output, causing delays or complete lack of streaming

3. **Set `timeout: 0` for long-running processes** - Default 60-second timeout will kill long processes

4. **Use environment variables to force unbuffered output**:
   - `PYTHONUNBUFFERED=1`
   - `FORCE_COLOR=1`
   - `TERM=xterm-256color`

5. **Have a fallback strategy** - File watching or polling can work when streaming callbacks fail

6. **For Claude Code specifically**, the tool likely detects TTY and changes its output behavior - PTY is essential

## Code Examples

### Complete PTY-Based Solution
```javascript
import { Sandbox } from '@e2b/code-interpreter'

class ClaudeCodeRunner {
  constructor(sandbox) {
    this.sandbox = sandbox
    this.pty = null
    this.outputHandlers = []
  }

  async start() {
    this.pty = await this.sandbox.pty.create({
      size: { cols: 120, rows: 40 },
      envs: {
        TERM: 'xterm-256color',
        FORCE_COLOR: '1',
        HOME: '/home/user',
      },
      timeout: 0,
    })
    
    return this.pty.pid
  }

  onOutput(handler) {
    this.outputHandlers.push(handler)
  }

  async sendCommand(command) {
    await this.sandbox.pty.sendInput(
      this.pty.pid,
      Buffer.from(command + '\n')
    )
  }

  async stop() {
    if (this.pty) {
      await this.pty.kill()
    }
  }
}

// Usage
const sandbox = await Sandbox.create()
const runner = new ClaudeCodeRunner(sandbox)

await runner.start()
runner.onOutput((data) => {
  console.log('Real-time output:', data)
})

await runner.sendCommand('claude --dangerously-skip-permissions')
// ... interact with Claude Code
await runner.stop()
```

## Sources

- E2B SDK Documentation via Context7 (e2b-dev/e2b)
  - Commands streaming documentation
  - PTY module documentation
  - Background execution documentation
  - JavaScript SDK reference
