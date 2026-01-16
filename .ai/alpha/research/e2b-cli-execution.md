# E2B SDK: CLI Execution and Process Management Research

**Date**: 2026-01-13
**Agent**: context7-expert
**Library**: e2b-dev/e2b (8097 stars)

## Executive Summary

This document provides comprehensive research findings on E2B SDK's process execution capabilities, focusing on CLI tool execution patterns, PTY/terminal allocation, streaming output handling, timeout management, and common issues with processes that hang or fail to produce output.

---

## 1. Process Execution with `sandbox.commands.run()`

### API Signature (TypeScript/JavaScript)

```typescript
run(cmd: string, opts?: CommandStartOpts & object): Promise<CommandResult>
run(cmd: string, opts: CommandStartOpts & object): Promise<CommandHandle>
```

### API Signature (Python)

```python
def run(
    cmd: str,
    background: Union[Literal[False], None] = None,
    envs: Optional[Dict[str, str]] = None,
    user: Username = "user",
    cwd: Optional[str] = None,
    on_stdout: Optional[Callable[[str], None]] = None,
    on_stderr: Optional[Callable[[str], None]] = None,
    timeout: Optional[float] = 60,
    request_timeout: Optional[float] = None
) -> CommandResult
```

### Key Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `cmd` | string | Required | Command to execute |
| `background` | boolean | `false` | Run in background (returns immediately) |
| `envs` | Dict/Record | `{}` | Environment variables (override sandbox defaults) |
| `user` | Username | `"user"` | User to run command as |
| `cwd` | string | Home dir | Working directory |
| `on_stdout` / `onStdout` | Callback | None | Real-time stdout handler |
| `on_stderr` / `onStderr` | Callback | None | Real-time stderr handler |
| `timeout` / `timeoutMs` | number | 60s / 60000ms | Command connection timeout |
| `request_timeout` / `requestTimeoutMs` | number | None / 30000ms | API request timeout |

### Return Types

**Foreground (background=false)**: Returns `CommandResult`
```typescript
interface CommandResult {
  stdout: string;      // Complete stdout output
  stderr: string;      // Complete stderr output
  exit_code: number;   // Exit code (0 = success)
}
```

**Background (background=true)**: Returns `CommandHandle`
```typescript
interface CommandHandle {
  pid: number;               // Process ID
  stdout: string;            // Accumulated stdout
  stderr: string;            // Accumulated stderr
  exit_code: number | null;  // null if still running
  error: string | null;      // Error message if any
  
  wait(): Promise<CommandResult>;   // Wait for completion
  kill(): Promise<boolean>;         // Kill with SIGKILL
  disconnect(): void;               // Stop receiving events
}
```

---

## 2. PTY/Terminal Allocation

### When to Use PTY vs Commands

**Use `sandbox.commands.run()`:**
- Non-interactive commands
- Scripts and automation
- When you just need stdout/stderr

**Use `sandbox.pty.create()`:**
- Interactive CLI tools that require a terminal
- Programs that use terminal escape codes (colors, cursor movement)
- Tools that prompt for user input
- Commands that detect non-TTY and behave differently

### PTY API (Python)

```python
class Pty:
    def create(
        self, 
        size: PtySize,                           # Required: terminal dimensions
        user: Username = "user",
        cwd: Optional[str] = None,
        envs: Optional[Dict[str, str]] = None,
        timeout: Optional[float] = 60,
        request_timeout: Optional[float] = None
    ) -> CommandHandle
    
    def send_stdin(
        self, 
        pid: int, 
        data: bytes,                             # Note: bytes, not str
        request_timeout: Optional[float] = None
    ) -> None
    
    def resize(
        self, 
        pid: int, 
        size: PtySize,
        request_timeout: Optional[float] = None
    ) -> None
    
    def kill(
        self, 
        pid: int, 
        request_timeout: Optional[float] = None
    ) -> bool
```

### PTY Creation Example

```python
from e2b import Sandbox

sandbox = Sandbox.create()

# Create PTY with specific size
pty_handle = sandbox.pty.create(
    size={"cols": 80, "rows": 24},
    user="user",
    cwd="/home/user",
    envs={"TERM": "xterm-256color"},
    timeout=120
)

# Send commands to PTY
sandbox.pty.send_stdin(pty_handle.pid, b"ls -la\n")

# Read output
for stdout, stderr, _ in pty_handle:
    if stdout:
        print(stdout)

# Clean up
pty_handle.kill()
```

### PTY vs Commands: Key Differences

| Feature | commands.run() | pty.create() |
|---------|----------------|--------------|
| Terminal allocation | No TTY | Full PTY |
| Input handling | `send_stdin(data: str)` | `send_stdin(data: bytes)` |
| Output format | Plain text | May include escape sequences |
| Interactive prompts | Not supported | Fully supported |
| Default timeout | 60s | 60s |
| Ideal for | Automation | Interactive tools |

---

## 3. Streaming stdout/stderr

### Real-time Streaming Pattern (JavaScript)

```javascript
import { Sandbox } from '@e2b/code-interpreter'

const sandbox = await Sandbox.create()

const result = await sandbox.commands.run('echo hello; sleep 1; echo world', {
  onStdout: (data) => {
    console.log('STDOUT:', data)  // Called as data arrives
  },
  onStderr: (data) => {
    console.error('STDERR:', data)
  },
})

// result.stdout contains complete output after command finishes
console.log('Final result:', result)
```

### Real-time Streaming Pattern (Python)

```python
from e2b_code_interpreter import Sandbox

sandbox = Sandbox.create()

result = sandbox.commands.run(
    'echo hello; sleep 1; echo world',
    on_stdout=lambda data: print(f'STDOUT: {data}'),
    on_stderr=lambda data: print(f'STDERR: {data}')
)

print(f'Final result: {result}')
```

### Background Command with Streaming

```python
# Start command in background
command = sandbox.commands.run(
    'tail -f /var/log/syslog',
    background=True
)

# Iterate over output as it arrives
for stdout, stderr, _ in command:
    if stdout:
        print(stdout)
    if stderr:
        print(stderr)
    
    # Check for specific condition to stop
    if "specific_log_entry" in (stdout or ""):
        break

# Kill when done
command.kill()
```

### Callback Behavior Notes

1. **Callbacks are called incrementally** - Each call receives a chunk of output, not the complete output
2. **Callbacks are synchronous in Python** - Use threads for long processing
3. **Callbacks can be async in JavaScript** - Return `Promise<void>` if needed
4. **Output is buffered** - `result.stdout` contains complete output after completion

---

## 4. Common Issues: Processes That Hang or Don't Produce Output

### Issue 1: Process Waiting for TTY

**Symptoms:**
- Command hangs indefinitely
- No stdout/stderr output
- Works fine when run manually in terminal

**Cause:** Many CLI tools detect whether they're attached to a TTY and behave differently:
- May prompt for input
- May wait for password
- May buffer output differently

**Solutions:**

```python
# Solution A: Use PTY instead of commands.run()
pty = sandbox.pty.create(size={"cols": 80, "rows": 24})
sandbox.pty.send_stdin(pty.pid, b"your-command\n")

# Solution B: Force non-interactive mode
result = sandbox.commands.run(
    "command --non-interactive --batch",
    timeout=300
)

# Solution C: Provide input via stdin
command = sandbox.commands.run("command", background=True)
sandbox.commands.send_stdin(command.pid, "input\n")
result = command.wait()

# Solution D: Use environment variables to disable prompts
result = sandbox.commands.run(
    "command",
    envs={
        "FORCE_COLOR": "0",
        "NO_COLOR": "1",
        "CI": "true",  # Many tools check this
        "TERM": "dumb"  # Disables terminal features
    }
)
```

### Issue 2: Authentication Prompts

**Symptoms:**
- Process hangs when reaching authentication step
- No output after "Enter password:" prompt

**Solutions:**

```python
# Solution A: Pre-configure authentication
result = sandbox.commands.run(
    "command",
    envs={
        "API_KEY": "your-api-key",
        "TOKEN": "your-token",
        "AWS_ACCESS_KEY_ID": "...",
        "AWS_SECRET_ACCESS_KEY": "..."
    }
)

# Solution B: Use credential files
sandbox.files.write("/home/user/.config/tool/credentials", "token=xxx")
result = sandbox.commands.run("command --config /home/user/.config/tool/credentials")

# Solution C: Use PTY for interactive auth
pty = sandbox.pty.create(size={"cols": 80, "rows": 24})
sandbox.pty.send_stdin(pty.pid, b"command\n")
# Wait for prompt...
sandbox.pty.send_stdin(pty.pid, b"password\n")
```

### Issue 3: Output Buffering

**Symptoms:**
- Output arrives all at once at the end
- `on_stdout` callbacks fire late or not at all

**Cause:** Many programs buffer stdout when not connected to a TTY.

**Solutions:**

```python
# Solution A: Use unbuffered mode
result = sandbox.commands.run(
    "python -u script.py",  # -u = unbuffered
    on_stdout=lambda d: print(d)
)

# Solution B: Use stdbuf
result = sandbox.commands.run(
    "stdbuf -oL command",  # Line-buffered output
    on_stdout=lambda d: print(d)
)

# Solution C: Use script command for PTY emulation
result = sandbox.commands.run(
    "script -q -c 'command' /dev/null",
    on_stdout=lambda d: print(d)
)

# Solution D: Set PYTHONUNBUFFERED for Python scripts
result = sandbox.commands.run(
    "python script.py",
    envs={"PYTHONUNBUFFERED": "1"}
)
```

### Issue 4: Process Exits Immediately

**Symptoms:**
- exit_code is 0 or non-zero immediately
- No useful output

**Debugging:**

```python
# Check if command exists
result = sandbox.commands.run("which command")
print(result.stdout)  # Empty = command not found

# Check exit code
result = sandbox.commands.run("command --help")
print(f"Exit code: {result.exit_code}")
print(f"Stderr: {result.stderr}")

# List running processes
processes = sandbox.commands.list()
for p in processes:
    print(f"PID: {p.pid}, CMD: {p.cmd}")
```

---

## 5. Timeout Handling and Process Lifecycle

### Timeout Types

| Timeout | Default | Purpose |
|---------|---------|---------|
| `timeout` (Python) / `timeoutMs` (JS) | 60s / 60000ms | Maximum time for command to complete |
| `request_timeout` (Python) / `requestTimeoutMs` (JS) | None / 30000ms | API call timeout |

### Timeout Behavior

```python
# Command with extended timeout
result = sandbox.commands.run(
    "long-running-command",
    timeout=300  # 5 minutes
)

# Unlimited timeout (use with caution!)
result = sandbox.commands.run(
    "streaming-command",
    timeout=0  # No timeout
)

# Background command with timeout control
command = sandbox.commands.run("command", background=True, timeout=600)
try:
    result = command.wait()  # Respects timeout
except TimeoutError:
    command.kill()
```

### Process Lifecycle Management

```python
# Start background process
command = sandbox.commands.run("long-process", background=True)
print(f"Started PID: {command.pid}")

# Check if still running
print(f"Exit code: {command.exit_code}")  # None if running

# Disconnect without killing (process continues)
command.disconnect()

# Reconnect later
command = sandbox.commands.connect(pid=command.pid)

# Wait for completion
result = command.wait(
    on_stdout=lambda d: print(f"OUT: {d}"),
    on_stderr=lambda d: print(f"ERR: {d}")
)

# Or kill if needed
success = command.kill()  # Uses SIGKILL
```

### Listing and Managing Processes

```python
# List all running processes
processes = sandbox.commands.list()
for p in processes:
    print(f"PID: {p.pid}, CMD: {p.cmd}, User: {p.user}")

# Kill specific process
killed = sandbox.commands.kill(pid=12345)

# Send input to running process
sandbox.commands.send_stdin(pid=12345, data="input\n")
```

---

## 6. Best Practices for CLI Tools

### Pre-Authentication Pattern

```python
# Set up environment before running commands
sandbox = Sandbox.create(
    envs={
        "API_KEY": os.getenv("API_KEY"),
        "HOME": "/home/user",
        "PATH": "/usr/local/bin:/usr/bin:/bin"
    }
)

# Write config files
sandbox.files.write(
    "/home/user/.config/tool/config.json",
    json.dumps({"api_key": os.getenv("API_KEY")})
)

# Now run commands
result = sandbox.commands.run("tool --operation")
```

### Robust Command Execution

```python
def run_command_safely(sandbox, cmd, timeout=120):
    """Execute command with proper error handling."""
    output_lines = []
    
    def capture_output(data):
        output_lines.append(data)
        print(f">> {data}")
    
    try:
        result = sandbox.commands.run(
            cmd,
            timeout=timeout,
            on_stdout=capture_output,
            on_stderr=capture_output,
            envs={
                "CI": "true",
                "TERM": "dumb",
                "NO_COLOR": "1"
            }
        )
        
        if result.exit_code != 0:
            raise Exception(f"Command failed with exit code {result.exit_code}: {result.stderr}")
        
        return result
        
    except Exception as e:
        print(f"Command failed: {e}")
        print(f"Output so far: {''.join(output_lines)}")
        raise
```

### Interactive Tool Pattern (PTY)

```python
def run_interactive_command(sandbox, commands_sequence, timeout=120):
    """Run commands that require interactive input."""
    
    pty = sandbox.pty.create(
        size={"cols": 120, "rows": 40},
        timeout=timeout,
        envs={"TERM": "xterm-256color"}
    )
    
    output_buffer = []
    
    def collect_output():
        for stdout, stderr, _ in pty:
            if stdout:
                output_buffer.append(stdout)
            if stderr:
                output_buffer.append(stderr)
    
    # Start output collection in background
    import threading
    collector = threading.Thread(target=collect_output)
    collector.start()
    
    # Send commands
    for cmd in commands_sequence:
        sandbox.pty.send_stdin(pty.pid, f"{cmd}\n".encode())
        time.sleep(0.5)  # Wait for command to process
    
    # Wait and clean up
    time.sleep(2)
    pty.kill()
    collector.join(timeout=5)
    
    return "".join(output_buffer)
```

---

## 7. Environment Variables

### Setting Environment Variables

```python
# Global (at sandbox creation)
sandbox = Sandbox.create(
    envs={
        "MY_VAR": "global_value",
        "API_KEY": "xxx"
    }
)

# Per-command (overrides global)
result = sandbox.commands.run(
    "echo $MY_VAR",
    envs={
        "MY_VAR": "command_specific_value"
    }
)

# Per-PTY
pty = sandbox.pty.create(
    size={"cols": 80, "rows": 24},
    envs={"TERM": "xterm-256color"}
)
```

### Default E2B Environment Variables

These are available in the sandbox as dot files:

```bash
/run/e2b/.E2B_SANDBOX      # "true" if in sandbox
/run/e2b/.E2B_SANDBOX_ID   # Sandbox ID
/run/e2b/.E2B_TEAM_ID      # Team ID
/run/e2b/.E2B_TEMPLATE_ID  # Template ID
```

Check if running in sandbox:
```python
result = sandbox.commands.run("echo $E2B_SANDBOX_ID")
print(result.stdout)  # Outputs the sandbox ID
```

---

## 8. Error Handling

### CommandExitException

Thrown when a command exits with non-zero exit code during `wait()`:

```python
from e2b import CommandExitException

command = sandbox.commands.run("exit 1", background=True)

try:
    result = command.wait()
except CommandExitException as e:
    print(f"Command failed with exit code: {e.exit_code}")
    print(f"Stderr: {e.stderr}")
```

### Timeout Handling

```python
import asyncio

try:
    result = await sandbox.commands.run(
        "sleep 300",  # Long command
        timeout=10     # Short timeout
    )
except asyncio.TimeoutError:
    print("Command timed out")
    # Clean up any orphaned processes
    processes = sandbox.commands.list()
    for p in processes:
        sandbox.commands.kill(p.pid)
```

### Connection Recovery

```python
# If disconnected, reconnect to running process
try:
    handle = sandbox.commands.connect(
        pid=existing_pid,
        timeout=60,
        on_stdout=lambda d: print(d),
        on_stderr=lambda d: print(d)
    )
    result = handle.wait()
except Exception as e:
    print(f"Failed to reconnect: {e}")
    # Process may have exited
```

---

## 9. Summary: Key Takeaways

### When Commands Hang

1. **Check for TTY requirements** - Use PTY if tool needs terminal
2. **Check for auth prompts** - Pre-configure credentials via env vars or config files
3. **Check output buffering** - Use unbuffered mode or stdbuf
4. **Add proper timeouts** - Don't let commands run forever

### Timeout Configuration

- **Default command timeout**: 60 seconds
- **Default API timeout**: 30 seconds (JS) / None (Python)
- **Set `timeout=0`** for unlimited (streaming scenarios)

### Output Streaming

- Use `on_stdout`/`on_stderr` callbacks for real-time output
- Callbacks receive chunks, not complete lines
- Final `result.stdout`/`result.stderr` contains complete output

### PTY vs Commands

- **Commands**: Simple, non-interactive, automated scripts
- **PTY**: Interactive tools, password prompts, colored output

### Environment Variables

- Global at sandbox creation
- Override per-command
- Common CI variables: `CI=true`, `NO_COLOR=1`, `TERM=dumb`

---

## References

- E2B SDK Documentation: https://github.com/e2b-dev/e2b
- Context7 Library ID: `/e2b-dev/e2b`
- Documentation retrieved via Context7 CLI on 2026-01-13
