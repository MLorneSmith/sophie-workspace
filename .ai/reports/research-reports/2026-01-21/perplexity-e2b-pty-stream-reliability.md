# Perplexity Research: E2B Sandbox PTY Stream Reliability Issues

**Date**: 2026-01-21
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API (Multiple queries)

## Query Summary

Comprehensive research on E2B sandbox PTY stream disconnection issues, specifically:
- PTY `onData` callback stops firing after ~10 seconds
- Silent stream drops without error events
- Best practices for long-running commands
- Health checks, keepalives, and reconnection strategies
- Alternative approaches (commands.run vs pty.start)

## Key Findings

### 1. Root Causes of PTY Stream Disconnection

The issue where PTY `onData` callbacks stop firing after ~10 seconds is typically caused by:

1. **WebSocket Connection Drops**: The SDK can experience prolonged WebSocket reconnect times or automatic thread termination after disconnection, leading to stopped event streaming without error events.

2. **PTY-Specific Silent Disconnection**: PTY processes may disconnect silently via `pty.disconnect()`, stopping SDK event reception while keeping the process alive. No error is raised as this is designed behavior.

3. **RPC/Server Disconnects**: Fixed in SDK updates post-September 2024 (v1.0.5+), but older versions suffered from "Server disconnected without sending a response" errors during long-running streams.

4. **Timeout Configuration Issues**: Default sandbox/PTY timeouts can close streams unexpectedly. The `request_timeout` parameter alone is insufficient.

**Relevant GitHub Issues:**
- Issue #334: WebSocket failed to start (closed - fixed in Beta SDK which doesn't use WebSockets)
- Issue #727: "Certain commands not streaming full output" (OPEN as of May 2025)
- Issue #581: "Unable to run commands in sandbox through Python SDK" - streaming response access issues
- Issue #921: "Peer closed connection without sending complete message body" (OPEN)
- Issue #879: "E2B is not honoring timeout" (OPEN)

### 2. E2B Changelog Relevant Fixes

From the E2B Changelog (https://e2b-changelog.framer.website):

| Date | Fix |
|------|-----|
| Sept 2024 (Week #61) | Fix RPC issue causing "Server disconnected without sending a response" |
| Aug 2024 (Week #57) | Fixed a bug with starting process with PTY more than once |
| Aug 2024 (Week #56) | Fixed a memory bug causing 504 and 502 errors when interacting with the sandbox |
| June 2024 | Add max retries to websocket reconnect in Python SDK |
| Jan 2024 (Week #26) | Python SDK Websocket reconnect sometimes takes unnecessarily long (fixed) |

### 3. Critical Difference: commands.run() vs pty.start()

| Method | Execution Type | State Persistence | Real-time Streaming | Best For |
|--------|----------------|-------------------|---------------------|----------|
| `commands.run()` | Non-interactive process | No (per-call) | Limited (post-completion callbacks) | Simple, one-off commands |
| `pty.start()` | Interactive PTY/shell | Yes (session) | Full bidirectional | Terminal emulators, LLM agents |
| `runCode()` | Code execution (Jupyter) | N/A | Structured output | Code interpretation |

**Key Insight**: Each `commands.run()` call creates a **separate session** - `cd` commands don't persist. PTY maintains shell state but requires more careful management.

**E2B Developer Recommendation** (from Issue #442):
> "If you want just to execute a command, the `sandbox.process.start_and_wait` (or `sandbox.commands.run` in Beta SDK) might be a better solution here — the terminal/pty is made to be connected to an actual terminal emulator, outputting all the colored output and taking into account things like terminal size, which might not be relevant for you."

### 4. Best Practices for Long-Running Commands

#### a) Timeout Configuration

```typescript
// JavaScript - Multiple layers of timeout
const sandbox = await Sandbox.create({
  timeoutMs: 300_000,      // 5 minutes sandbox lifetime
  requestTimeoutMs: 120_000 // 2 minute request timeout
});

// Extend during runtime
await sandbox.setTimeout(600_000); // Extend to 10 minutes
```

```python
# Python
sandbox = Sandbox.create(timeout=300)  # 5 min sandbox timeout

# Command-level timeout
result = sandbox.commands.run(
    "long_running_command",
    timeout=120  # Command timeout in seconds
)
```

**Important**: There are TWO separate timeouts:
- `start`/`request_timeout`: Time to START the process
- `wait` timeout: Time for the process to COMPLETE

Both must be configured for long-running commands.

#### b) Health Check Implementation (Client-Side)

E2B does NOT provide built-in health checks for PTY sessions. Implement client-side:

```python
import time

sandbox = Sandbox()
proc = sandbox.pty.start(size=(80, 24), cmd="your_long_cmd", timeout=3600)
last_health = time.time()

def on_stdout(data):
    global last_health
    if "HEALTH:" in data:
        last_health = time.time()
    print(data)

# Health check loop
while True:
    if time.time() - last_health > 60:  # 1 minute timeout
        print("Health check failed; restarting...")
        sandbox.pty.kill(proc.pid)
        proc = sandbox.pty.start(...)  # Restart
    
    # Send periodic health probe
    sandbox.pty.send_stdin(proc.pid, b"echo 'HEALTH:" + str(int(time.time())).encode() + b"'\n")
    time.sleep(30)
```

#### c) Keepalive Pattern

Send periodic no-op input to prevent TCP idle timeouts:

```typescript
// Send newline every 30 seconds
const keepaliveInterval = setInterval(() => {
  sandbox.pty.sendStdin(pid, '\n');
}, 30000);

// Or send a comment/no-op
const keepaliveInterval = setInterval(() => {
  sandbox.pty.sendStdin(pid, '# keepalive\n');
}, 30000);
```

#### d) Reconnection Strategy

```python
from e2b import Sandbox

# Store sandbox ID for reconnection
sandbox_id = sandbox.sandbox_id

# If stream stops, reconnect
try:
    # ... use PTY
except Exception as e:
    # Reconnect to existing sandbox
    sandbox = await Sandbox.connect(sandbox_id, timeout=300)
    # Restart PTY (can reuse PID if known)
    pty = sandbox.pty.start(...)
```

### 5. Alternative Approaches

#### Use `commands.run()` Instead of PTY for Non-Interactive Commands

If you don't need interactive terminal features, `commands.run()` is more reliable:

```typescript
// Preferred for non-interactive long-running commands
const result = await sandbox.commands.run('long_command', {
  timeout: 300_000,  // 5 minutes
  onStdout: (data) => console.log(data),
  onStderr: (data) => console.error(data),
});
```

#### Use `runCode()` to Bypass PTY Issues

User workaround from Issue #581:
```python
# Using run_code bypasses some PTY/streaming bugs
result = sandbox.run_code(f'ls -l {remote_dir}', 'bash')
```

### 6. SDK Version Requirements

**Critical**: Use the latest SDK version (v1.5.0+ for Python, latest for JS):

```bash
pip install e2b --upgrade
npm install @e2b/code-interpreter@latest
```

The Beta SDK (now stable) does NOT use WebSockets, eliminating many streaming issues. WebSocket-related bugs are "no longer relevant" per E2B team.

### 7. Known Open Issues (As of Research Date)

| Issue # | Title | Status | Relevance |
|---------|-------|--------|-----------|
| #727 | Certain commands not streaming full output | OPEN | High - directly related |
| #879 | E2B is not honoring timeout | OPEN | High - timeout issues |
| #921 | Peer closed connection without sending complete message body | OPEN | High - connection drops |
| #899 | Getting 404 errors when connecting to paused sandboxes | OPEN | Medium - reconnection |
| #736 | Resume bug | OPEN | Medium - state persistence |

## Recommended Implementation

Based on research findings, here's the recommended approach for your orchestrator:

1. **Prefer `commands.run()` over PTY** unless you need interactive shell features
2. **Configure multiple timeout layers**: sandbox timeout, request timeout, and command timeout
3. **Implement client-side health checks** with periodic probes
4. **Add keepalive pings** every 15-30 seconds
5. **Use reconnection with exponential backoff** when streams drop
6. **Update to latest SDK version** to benefit from RPC and WebSocket fixes
7. **Monitor for the open Issue #727** - this appears to match your symptoms exactly

## Sources & Citations

### E2B Official Documentation
- https://e2b.dev/docs/commands/streaming
- https://e2b.dev/docs/code-interpreting/streaming
- https://e2b.dev/docs/sandbox
- https://e2b.dev/docs/legacy/sandbox/api/timeouts

### GitHub Issues
- https://github.com/e2b-dev/E2B/issues/727 (Streaming output issues)
- https://github.com/e2b-dev/E2B/issues/581 (Commands SDK issues)
- https://github.com/e2b-dev/E2B/issues/334 (WebSocket issues - resolved)
- https://github.com/e2b-dev/E2B/issues/442 (PTY vs commands.run)
- https://github.com/e2b-dev/E2B/issues/275 (Timeout configuration)
- https://github.com/e2b-dev/E2B/issues/592 (502 Timeout errors)
- https://github.com/e2b-dev/E2B/issues/879 (Timeout not honored)
- https://github.com/e2b-dev/E2B/issues/921 (Connection drops)

### Changelog
- https://e2b-changelog.framer.website

### SDK Repositories
- https://github.com/e2b-dev/E2B
- https://github.com/e2b-dev/code-interpreter

## Key Takeaways

1. **PTY stream drops after ~10 seconds are a known issue** - Issue #727 is open with 6 comments as of May 2025
2. **The Beta SDK eliminated WebSocket issues** - upgrade if using legacy SDK
3. **No built-in health checks exist** - must implement client-side
4. **Two types of timeouts must be configured** - start/request AND wait/command
5. **`commands.run()` is more reliable than PTY** for non-interactive commands
6. **Reconnection is supported** via `Sandbox.connect(sandbox_id)`
7. **Silent disconnects are by design** - PTY can disconnect without errors

## Related Searches

- E2B sandbox pause/resume reliability
- E2B sandbox connection pooling patterns
- Alternative sandboxing solutions (Modal, Fly.io, etc.)
- WebSocket keepalive best practices for cloud sandboxes
