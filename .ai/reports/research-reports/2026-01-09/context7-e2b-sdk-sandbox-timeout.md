# Context7 Research: E2B SDK Sandbox Timeout Management

**Date**: 2026-01-09
**Agent**: context7-expert
**Libraries Researched**: e2b-dev/e2b (8097 stars)

## Query Summary
Research on E2B SDK (JavaScript/TypeScript) for:
1. Extending sandbox timeout using setTimeout method
2. Detecting sandbox expiration/unavailability
3. Maximum sandbox timeout limits
4. Best practices for keeping sandboxes alive for long-running operations

## Findings

### 1. Extending Sandbox Timeout with setTimeout

The E2B SDK provides a `setTimeout()` method to extend or reduce sandbox lifetimes.

#### TypeScript/JavaScript API

```typescript
// Instance method - set timeout on current sandbox
await sandbox.setTimeout(timeoutMs: number, opts?: Pick<SandboxOpts, "requestTimeoutMs">): Promise<void>

// Static method - set timeout using sandbox ID
await Sandbox.setTimeout(sandboxId: string, timeoutMs: number): Promise<void>
```

#### Usage Examples

```typescript
import { Sandbox } from 'e2b';

// Create a sandbox
const sandbox = await Sandbox.create();

// Extend timeout to 2 hours (7,200,000 milliseconds)
await sandbox.setTimeout(7_200_000);

// Or use static method with sandbox ID
await Sandbox.setTimeout('sandbox-id', 3_600_000); // 1 hour
```

**Key Points:**
- Timeout is specified in **milliseconds** (JavaScript) vs **seconds** (Python)
- Can be called multiple times to extend/reduce timeout
- Each call resets the timeout from the current moment

### 2. Detecting Sandbox Expiration/Unavailability

#### Method 1: isRunning() Check

```typescript
// Check if sandbox is still running
const isRunning = await sandbox.isRunning();

if (!isRunning) {
  console.log('Sandbox has expired or been terminated');
  // Handle reconnection or recreation
}
```

#### Method 2: Error Handling

```typescript
import { Sandbox, TimeoutError, SandboxError, RateLimitError } from 'e2b';

try {
  const result = await sandbox.commands.run('some-command');
} catch (error) {
  if (error instanceof TimeoutError) {
    console.error('Sandbox timeout occurred');
  } else if (error instanceof SandboxError) {
    console.error('General sandbox error - may be expired');
  } else if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded');
  }
}
```

#### Method 3: Connect/Reconnect Pattern

```typescript
// Try to connect to an existing sandbox
try {
  const sandbox = await Sandbox.connect(sandboxId);
  // Sandbox is still alive
} catch (error) {
  // Sandbox not found or expired - create new one
  const sandbox = await Sandbox.create();
}
```

#### Available Error Types

| Error Class | Description |
|-------------|-------------|
| `TimeoutError` | Sandbox timeout, request timeout, or command execution timeout |
| `SandboxError` | Base class for sandbox-related errors |
| `AuthenticationError` | Authentication/API key failure |
| `RateLimitError` | Rate limit exceeded |

### 3. Maximum Sandbox Timeout Limits

| User Tier | Maximum Timeout | In Seconds | In Milliseconds |
|-----------|-----------------|------------|-----------------|
| **Pro** | 24 hours | 86,400 | 86,400,000 |
| **Hobby** | 1 hour | 3,600 | 3,600,000 |

**Important Notes:**
- Attempting to set a timeout beyond the limit will be capped to the maximum
- Default timeout depends on creation options
- Timeout countdown starts from creation or last setTimeout call

### 4. Best Practices for Long-Running Operations

#### Pattern 1: Periodic Timeout Extension (Keep-Alive)

```typescript
import { Sandbox } from 'e2b';

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const REFRESH_INTERVAL = 20 * 60 * 1000; // 20 minutes (before timeout)

const sandbox = await Sandbox.create({ timeoutMs: TIMEOUT_MS });

// Set up periodic keep-alive
const keepAliveInterval = setInterval(async () => {
  try {
    const isRunning = await sandbox.isRunning();
    if (isRunning) {
      await sandbox.setTimeout(TIMEOUT_MS);
      console.log('Sandbox timeout extended');
    } else {
      clearInterval(keepAliveInterval);
      console.log('Sandbox no longer running');
    }
  } catch (error) {
    console.error('Keep-alive failed:', error);
    clearInterval(keepAliveInterval);
  }
}, REFRESH_INTERVAL);

// Clean up when done
async function cleanup() {
  clearInterval(keepAliveInterval);
  await sandbox.kill();
}
```

#### Pattern 2: Pre-Operation Timeout Extension

```typescript
async function runLongOperation(sandbox: Sandbox, estimatedDurationMs: number) {
  // Extend timeout before starting long operation
  // Add buffer (e.g., 50% extra time)
  const timeoutMs = Math.min(estimatedDurationMs * 1.5, 86_400_000);
  await sandbox.setTimeout(timeoutMs);
  
  // Now run the operation
  return await sandbox.commands.run('long-running-command');
}
```

#### Pattern 3: Pause/Resume for Very Long Operations

```typescript
// For operations spanning multiple sessions (Pro feature)
const sandbox = await Sandbox.create();

// Do some work...
await sandbox.commands.run('setup-task');

// Pause sandbox (preserves state, stops billing)
await sandbox.betaPause();
const sandboxId = sandbox.sandboxId;

// Later, resume the sandbox
const resumedSandbox = await Sandbox.connect(sandboxId);
// Sandbox resumes with preserved state
```

#### Pattern 4: Robust Sandbox Manager Class

```typescript
import { Sandbox, TimeoutError, SandboxError } from 'e2b';

class SandboxManager {
  private sandbox: Sandbox | null = null;
  private sandboxId: string | null = null;
  private keepAliveTimer: NodeJS.Timer | null = null;
  
  private readonly timeoutMs: number;
  private readonly keepAliveIntervalMs: number;
  
  constructor(timeoutMinutes: number = 30) {
    this.timeoutMs = timeoutMinutes * 60 * 1000;
    this.keepAliveIntervalMs = (timeoutMinutes - 5) * 60 * 1000;
  }
  
  async ensureSandbox(): Promise<Sandbox> {
    // Try to reconnect to existing sandbox
    if (this.sandboxId) {
      try {
        const isRunning = await this.sandbox?.isRunning();
        if (isRunning) {
          return this.sandbox!;
        }
      } catch {
        // Sandbox expired, create new one
      }
    }
    
    // Create new sandbox
    this.sandbox = await Sandbox.create({ timeoutMs: this.timeoutMs });
    this.sandboxId = this.sandbox.sandboxId;
    this.startKeepAlive();
    return this.sandbox;
  }
  
  private startKeepAlive() {
    this.stopKeepAlive();
    
    this.keepAliveTimer = setInterval(async () => {
      try {
        if (this.sandbox && await this.sandbox.isRunning()) {
          await this.sandbox.setTimeout(this.timeoutMs);
        } else {
          this.stopKeepAlive();
        }
      } catch (error) {
        console.error('Keep-alive error:', error);
        this.stopKeepAlive();
      }
    }, this.keepAliveIntervalMs);
  }
  
  private stopKeepAlive() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }
  
  async cleanup() {
    this.stopKeepAlive();
    if (this.sandbox) {
      try {
        await this.sandbox.kill();
      } catch {
        // Ignore errors during cleanup
      }
    }
    this.sandbox = null;
    this.sandboxId = null;
  }
}
```

## Key Takeaways

- **setTimeout()** accepts milliseconds in JS/TS (seconds in Python) and can extend or reduce timeout
- **Maximum limits**: 24 hours (Pro) / 1 hour (Hobby)
- **Detection methods**: `isRunning()`, error handling with `TimeoutError`/`SandboxError`, or try `connect()`
- **Keep-alive pattern**: Set interval to call `setTimeout()` before current timeout expires
- **Pause/Resume**: Use `betaPause()` and `connect()` for very long operations (preserves state)
- **Always handle errors**: Wrap sandbox operations in try/catch for timeout scenarios
- **Reconnection**: Use `Sandbox.connect(sandboxId)` to reconnect to existing sandboxes

## Code Examples

### Complete Keep-Alive Example

```typescript
import { Sandbox, TimeoutError } from 'e2b';

async function runWithKeepAlive() {
  const THIRTY_MINUTES = 30 * 60 * 1000;
  const TWENTY_MINUTES = 20 * 60 * 1000;
  
  const sandbox = await Sandbox.create({ timeoutMs: THIRTY_MINUTES });
  
  // Keep-alive loop
  const keepAlive = setInterval(async () => {
    try {
      if (await sandbox.isRunning()) {
        await sandbox.setTimeout(THIRTY_MINUTES);
      }
    } catch (e) {
      clearInterval(keepAlive);
    }
  }, TWENTY_MINUTES);
  
  try {
    // Your long-running operations here
    const result = await sandbox.commands.run('your-command');
    return result;
  } catch (error) {
    if (error instanceof TimeoutError) {
      console.error('Operation timed out');
    }
    throw error;
  } finally {
    clearInterval(keepAlive);
    await sandbox.kill();
  }
}
```

## Sources
- E2B SDK via Context7 (e2b-dev/e2b)
- SDK Reference: js-sdk/v1.2.3/sandbox
- SDK Reference: js-sdk/v2.1.4/sandbox
- SDK Reference: js-sdk/v1.0.7/errors
