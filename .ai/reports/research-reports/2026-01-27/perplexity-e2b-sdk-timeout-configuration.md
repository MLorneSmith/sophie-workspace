# Perplexity Research: E2B SDK Timeout Configuration and Context Deadline Exceeded Errors

**Date**: 2026-01-27
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API (multiple queries)

## Query Summary

Researched E2B SDK timeout configurations, including:
1. Default sandbox command timeout values
2. Global sandbox timeout vs command-level timeoutMs parameter
3. Handling of "context deadline exceeded" errors
4. Known issues with pnpm install taking longer than expected in E2B sandboxes

## Key Findings

### 1. E2B Timeout Hierarchy (Three Distinct Timeouts)

E2B SDK has **three separate timeout mechanisms** that operate independently:

| Timeout Type | Parameter | Default | Max Value | Purpose |
|--------------|-----------|---------|-----------|---------|
| **Sandbox Lifetime** | `timeoutMs` (create) | 5 minutes (300,000ms) | 24h (Pro) / 1h (Hobby) | How long sandbox stays alive |
| **Command Execution** | `timeoutMs` (process) | 60 seconds (60,000ms) | N/A | How long a command can run |
| **API Request** | `requestTimeoutMs` | 30 seconds (30,000ms) | N/A | SDK-to-server communication |

### 2. Default Timeout Values

- **SDK Default Timeout**: 60 seconds for all API calls/responses
- **Sandbox Lifetime Default**: 5 minutes (300,000ms) - auto-shutdown after this period
- **Auto-pause (Beta)**: 10 minutes inactivity timeout with state preservation

### 3. Critical Bug: Timeout on `start()` vs `wait()`

**GitHub Issue #275** documents a critical confusion in the JS SDK:

```typescript
// THIS WILL TIMEOUT AFTER 60 SECONDS (default):
const proc = await sandbox.process.start({
  cmd: 'pnpm install',
  timeout: 3 * 60 * 1000, // 3 minutes - ONLY for STARTING
});
await proc.wait(); // Uses default 60s timeout!

// CORRECT: Set timeout on BOTH start AND wait:
const timeout = 10 * 60 * 1000; // 10 minutes
const proc = await sandbox.process.start({
  cmd: 'pnpm install',
  timeout: timeout,
});
await proc.wait(timeout); // ALSO set timeout here!
```

**Key Insight**: The `timeout` on `start()` controls only the **process startup time**, not the total execution time. You MUST also pass a timeout to `wait()` for long-running commands.

### 4. Context Deadline Exceeded Error

The "context deadline exceeded" error is a **gRPC-level timeout error** that occurs when:

1. **API Request Timeout**: The SDK-to-server request exceeds `requestTimeoutMs` (default 30s)
2. **Deadline Propagation**: gRPC propagates deadlines across service boundaries - if an upstream caller times out, downstream calls get cancelled with "context deadline exceeded"
3. **Clock Skew**: System clock differences between client and server can cause premature timeouts

**Error Patterns**:
- `DEADLINE_EXCEEDED: context timed out` - Typically from an intermediary service
- `DEADLINE_EXCEEDED: deadline exceeded after Xs` - Original client timeout
- 502 Bad Gateway with TimeoutError - Sandbox timeout or request timeout

### 5. Handling Long-Running Commands (pnpm install)

**Recommended Configuration for pnpm install**:

```typescript
import { Sandbox } from '@e2b/code-interpreter';

// Create sandbox with extended lifetime
const sandbox = await Sandbox.create({
  template: 'base',
  timeoutMs: 30 * 60 * 1000,  // 30 min sandbox lifetime
  requestTimeoutMs: 120 * 1000,  // 2 min API timeout
});

// Run pnpm install with proper timeout handling
const timeout = 10 * 60 * 1000; // 10 minutes

const proc = await sandbox.process.start({
  cmd: 'pnpm install',
  timeout: timeout,  // Start timeout
  onStdout: (data) => console.log(data.line),
  onStderr: (data) => console.error(data.line),
});

// CRITICAL: Match timeout on wait()
await proc.wait(timeout);

// Extend sandbox if more work needed
await sandbox.setTimeout(20 * 60 * 1000);

await sandbox.close();
```

### 6. Known Issues and Workarounds

#### Issue: 502 Timeout Errors (GitHub Issue #592)
- Common on self-hosted E2B instances
- Can indicate sandbox timeout reached
- Solution: Increase `timeoutMs` on sandbox creation

#### Issue: pnpm E2BIG Error (GitHub Issue #6106)
- Not E2B-specific, but affects pnpm in constrained environments
- Occurs with `node-linker=hoisted` configuration
- Related to large environment variable sizes

#### Issue: Inconsistent Timeout Behavior
- Beta SDK (v1.0+) separates "start/request" timeout from "wait" timeout
- Legacy SDK had confusing single `timeout` parameter
- Migration guide: https://e2b.dev/docs/guide/beta-migration#timeouts

### 7. Best Practices for Long-Running Commands

1. **Always set timeouts on BOTH `start()` and `wait()`**
2. **Use streaming callbacks** (`onStdout`, `onStderr`) to monitor progress
3. **Extend sandbox lifetime** with `setTimeout()` for interactive sessions
4. **Pre-install dependencies** using custom sandbox templates when possible
5. **Use `requestTimeoutMs`** for API-level timeout control (separate from command timeout)

### 8. Timeout Configuration Reference

```typescript
// Sandbox creation options
Sandbox.create({
  template: 'base',
  timeoutMs: 300_000,        // Sandbox lifetime (default 5 min)
  requestTimeoutMs: 30_000,  // API request timeout (default 30s)
});

// Process execution options
sandbox.process.start({
  cmd: 'long-running-command',
  timeout: 180_000,          // Command START timeout
  requestTimeoutMs: 30_000,  // API timeout for this call
});

// Wait options
proc.wait(180_000);          // Command EXECUTION timeout

// Runtime timeout adjustment
sandbox.setTimeout(600_000, {
  requestTimeoutMs: 30_000,
});

// Code execution (Code Interpreter SDK)
sandbox.runCode('code', {
  timeoutMs: 180_000,        // Code execution timeout
  requestTimeoutMs: 30_000,  // API timeout
});
```

## Sources & Citations

1. E2B Timeout Documentation (Legacy): https://e2b.dev/docs/legacy/sandbox/api/timeouts
2. E2B Sandbox Lifecycle: https://e2b.dev/docs/sandbox
3. E2B Quickstart: https://e2b.dev/docs/quickstart
4. GitHub Issue #275 - Timeout doesn't work as expected: https://github.com/e2b-dev/E2B/issues/275
5. GitHub Issue #592 - 502 Timeout Error: https://github.com/e2b-dev/E2B/issues/592
6. GitHub Issue #568 - Auto-pause SDK PR: https://github.com/e2b-dev/E2B/pull/568
7. gRPC Deadlines Documentation: https://grpc.io/docs/guides/deadlines/
8. pnpm E2BIG Issue: https://github.com/pnpm/pnpm/issues/6106
9. E2B Beta Migration Guide: https://e2b.dev/docs/guide/beta-migration#timeouts

## Key Takeaways

1. **Default command timeout is 60 seconds** - insufficient for `pnpm install` in most projects
2. **Three independent timeouts exist**: sandbox lifetime, command execution, and API request
3. **Set timeout on BOTH `start()` AND `wait()`** - this is the most common mistake
4. **"Context deadline exceeded" is a gRPC error** indicating timeout at the SDK/server communication level
5. **Use custom templates** for pre-installed dependencies to avoid long runtime installations
6. **Hobby tier limits sandbox to 1 hour max** - Pro tier allows up to 24 hours

## Related Searches

For follow-up research, consider investigating:
- E2B custom template creation for pre-installed Node.js dependencies
- E2B auto-pause feature (beta) for long-running sandboxes
- pnpm `--prefer-offline` flag for faster installs in sandboxes
- E2B streaming APIs for real-time command output
