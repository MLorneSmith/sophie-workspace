# Context7 Research: E2B SDK PTY (Pseudo-Terminal) API

**Date**: 2026-01-14
**Agent**: context7-expert
**Libraries Researched**: e2b-dev/e2b (v2.x JS/TS SDK)

## Query Summary

Research on the E2B SDK PTY API for migrating from `sandbox.commands.run()` to `sandbox.pty.create()`. The motivation is that `commands.run()` doesn't allocate a TTY, causing Node.js CLI tools to use block-buffering instead of line-buffering.

## Findings

### Overview

The E2B SDK provides a `Pty` module accessible via `sandbox.pty` that enables interactive terminal sessions within sandboxes. Unlike `commands.run()`, PTY allocates a true pseudo-terminal which:
- Forces line-buffered output (stdout flushes on newlines)
- Provides proper terminal semantics (colors, control characters)
- Enables interactive input/output streaming

### TypeScript PTY API

#### 1. Creating a PTY

```typescript
import { Sandbox } from 'e2b';

// Create sandbox
const sandbox = await Sandbox.create();

// Create PTY with options
const pty = await sandbox.pty.create({
  size: { cols: 80, rows: 24 },      // Terminal dimensions (required)
  onData: (data: PtyOutput) => {     // Output callback (required in async versions)
    console.log('PTY output:', data);
  },
  cwd: '/home/user/project',         // Working directory (optional)
  envs: {                            // Environment variables (optional)
    NODE_ENV: 'development',
    PATH: '/usr/bin:/usr/local/bin'
  },
  user: 'user',                      // Username (optional, default: 'user')
  timeout: 60,                       // PTY timeout in seconds (optional, default: 60)
  cmd: 'node --version'              // Command to execute (optional)
});
```

#### 2. PtyCreateOpts Interface (TypeScript)

```typescript
interface PtyCreateOpts {
  // Required
  size: {
    cols: number;  // Number of columns
    rows?: number; // Number of rows (optional)
  };
  onData: (output: PtyOutput) => void;  // Callback for PTY data
  
  // Optional
  cmd?: string;                          // Command to run
  cwd?: string;                          // Working directory
  envs?: Record<string, string>;         // Environment variables
  user?: string;                         // User to run as (default: 'user')
  timeout?: number;                      // PTY timeout in seconds (default: 60)
  requestTimeoutMs?: number;             // Request timeout in milliseconds
}

interface PtyOutput {
  data: Uint8Array | string;  // Output data
}
```

#### 3. Sending Input to PTY

```typescript
// Send input using Pty.sendInput()
await sandbox.pty.sendInput(
  pty.pid,                           // Process ID from CommandHandle
  new TextEncoder().encode('ls -la\n'), // Input as Uint8Array
  { requestTimeoutMs: 5000 }         // Optional timeout
);

// Alternative: Send string input
await sandbox.pty.sendInput(pty.pid, 'npm install\n');
```

#### 4. Receiving Output via onData Callback

```typescript
const outputBuffer: string[] = [];

const pty = await sandbox.pty.create({
  size: { cols: 80, rows: 24 },
  onData: (output: PtyOutput) => {
    // Output can be Uint8Array or string
    const text = typeof output.data === 'string' 
      ? output.data 
      : new TextDecoder().decode(output.data);
    
    outputBuffer.push(text);
    process.stdout.write(text); // Stream to console
  },
  cmd: 'npm run build'
});
```

#### 5. Waiting for PTY Command Completion

```typescript
// CommandHandle provides wait() method
const result = await pty.wait();

// result contains:
// - exitCode: number
// - stdout: string (accumulated)
// - stderr: string (accumulated)

console.log('Exit code:', result.exitCode);
console.log('Stdout:', result.stdout);
```

#### 6. Killing/Cleanup PTY

```typescript
// Kill using CommandHandle
const success = await pty.kill();
console.log('PTY killed:', success);

// Or kill by PID via Pty module
const killed = await sandbox.pty.kill(pty.pid);
console.log('PTY killed by PID:', killed);

// Always clean up sandbox when done
await sandbox.kill();
```

#### 7. Resizing PTY

```typescript
// Resize when terminal dimensions change
await sandbox.pty.resize(pty.pid, {
  cols: 120,
  rows: 40
}, { requestTimeoutMs: 5000 });
```

### Error Handling Patterns

```typescript
import { Sandbox, TimeoutError, SandboxError } from 'e2b';

async function runWithPty(command: string): Promise<string> {
  let sandbox: Sandbox | null = null;
  let pty: CommandHandle | null = null;
  
  try {
    sandbox = await Sandbox.create({ timeout: 300 });
    
    const output: string[] = [];
    
    pty = await sandbox.pty.create({
      size: { cols: 80, rows: 24 },
      onData: (data) => {
        const text = typeof data.data === 'string'
          ? data.data
          : new TextDecoder().decode(data.data);
        output.push(text);
      },
      cmd: command,
      timeout: 120
    });
    
    const result = await pty.wait();
    
    if (result.exitCode !== 0) {
      throw new Error(`Command failed with exit code ${result.exitCode}`);
    }
    
    return output.join('');
    
  } catch (error) {
    if (error instanceof TimeoutError) {
      console.error('PTY operation timed out');
    } else if (error instanceof SandboxError) {
      console.error('Sandbox error:', error.message);
    }
    throw error;
    
  } finally {
    // Always clean up
    if (pty) {
      try {
        await pty.kill();
      } catch {
        // PTY may already be terminated
      }
    }
    if (sandbox) {
      await sandbox.kill();
    }
  }
}
```

### Complete PTY Lifecycle Example

```typescript
import { Sandbox } from 'e2b';

async function executePtyCommand() {
  const sandbox = await Sandbox.create();
  
  try {
    // Collect all output
    const allOutput: string[] = [];
    
    // Create PTY with shell
    const pty = await sandbox.pty.create({
      size: { cols: 120, rows: 30 },
      onData: (output) => {
        const text = typeof output.data === 'string'
          ? output.data
          : new TextDecoder().decode(output.data);
        allOutput.push(text);
        process.stdout.write(text); // Real-time streaming
      },
      cwd: '/home/user',
      envs: {
        TERM: 'xterm-256color',
        NODE_ENV: 'production'
      },
      cmd: '/bin/bash'  // Start interactive shell
    });
    
    // Send commands to the shell
    await sandbox.pty.sendInput(pty.pid, 'cd /tmp\n');
    await sandbox.pty.sendInput(pty.pid, 'npm init -y\n');
    await sandbox.pty.sendInput(pty.pid, 'npm install express\n');
    await sandbox.pty.sendInput(pty.pid, 'exit\n');  // Exit shell
    
    // Wait for completion
    const result = await pty.wait();
    
    console.log('\n--- Execution Complete ---');
    console.log('Exit code:', result.exitCode);
    console.log('Total output length:', allOutput.join('').length);
    
    return result;
    
  } finally {
    await sandbox.kill();
  }
}
```

### Comparison: commands.run() vs pty.create()

| Feature | commands.run() | pty.create() |
|---------|---------------|--------------|
| TTY allocation | No | Yes |
| Output buffering | Block buffered | Line buffered |
| Color support | Limited | Full (TERM env) |
| Interactive input | Limited | Full support |
| Real-time streaming | Via callbacks | Via onData |
| Terminal dimensions | N/A | Configurable |
| Control characters | Limited | Full support |

## Key Takeaways

1. **PTY allocates a real TTY** - Forces line-buffered output, solving the buffering issue with Node.js CLI tools
2. **onData callback is required** for async PTY creation - Must handle output streaming
3. **sendInput requires Uint8Array** - Use TextEncoder for string conversion
4. **Always include newlines** when sending commands - PTY expects terminal input semantics
5. **Clean up with kill()** - Always kill PTY and sandbox when done
6. **Set TERM environment** - Use `TERM: 'xterm-256color'` for full color support
7. **CommandHandle provides wait()** - Returns exit code and accumulated output

## Code Examples

### Minimal PTY Usage

```typescript
import { Sandbox } from 'e2b';

const sandbox = await Sandbox.create();
const pty = await sandbox.pty.create({
  size: { cols: 80, rows: 24 },
  onData: (data) => process.stdout.write(data.data),
  cmd: 'node --version'
});
await pty.wait();
await sandbox.kill();
```

### PTY with Full Error Handling

See "Error Handling Patterns" section above for complete example.

## Sources

- E2B SDK via Context7 (e2b-dev/e2b)
- SDK Reference: JS SDK v2.x commands/pty documentation
- API endpoints: /pty/create, /sendInput, /resize, /kill

## Notes

- The JS/TS SDK API differs slightly from Python SDK (Python uses `send_stdin` with bytes, JS uses `sendInput` with Uint8Array)
- Most PTY documentation in Context7 is Python-focused; TypeScript patterns were inferred from API documentation
- `PtyCreateOpts` interface may vary between SDK versions; always check latest SDK types
