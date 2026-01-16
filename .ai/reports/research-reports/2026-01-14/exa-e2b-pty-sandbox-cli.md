# Exa Research: E2B Sandbox PTY API for Interactive CLI Tools

**Date**: 2026-01-14
**Agent**: exa-expert
**Search Types Used**: Neural, Answer, Get Contents

## Query Summary

Research on best practices and examples for using E2B sandbox PTY API for running interactive CLI tools, focusing on:
1. E2B PTY create examples for Node.js CLI tools
2. E2B sandbox streaming stdout from long-running processes
3. GitHub discussions/issues about E2B commands.run vs pty.create
4. Examples of running AI CLI tools (like Claude Code) in E2B sandboxes

## Key Findings

### commands.run vs pty.create - Key Differences

| Aspect | `commands.run` | `pty.create` |
|--------|----------------|--------------|
| **Purpose** | Fire-and-forget or streamed command | Persistent interactive terminal |
| **Output** | stdout/stderr via callbacks or final result | Raw terminal output with prompts and control sequences |
| **Interactivity** | Cannot handle commands requiring user input after start | Write to PTY anytime (prompts, REPLs) |
| **Lifecycle** | Ends when process exits | Continues until explicitly killed |
| **Use Case** | Simple, non-interactive tasks | Fully interactive CLI experience |

### When to Use Which

**Use `commands.run` for:**
- One-shot commands
- Scripts that don't require user input
- Commands where you only need final output or line-by-line streaming

**Use `pty.create` for:**
- Interactive CLI tools (like Claude Code)
- Commands that expect terminal input
- Long-running processes with prompts
- REPLs and shell sessions

## Code Examples

### Example 1: Streaming Command Output with callbacks (JavaScript)

```javascript
import { Sandbox } from '@e2b/code-interpreter';

const sbx = await Sandbox.create();

await sbx.commands.run('ls -la', {
  onStdout: (data) => {
    console.log('stdout:', data);
  },
  onStderr: (data) => {
    console.error('stderr:', data);
  }
});

await sbx.close();
```

### Example 2: Streaming Command Output (Python)

```python
from e2b_code_interpreter import Sandbox

sbx = Sandbox()

def on_stdout(data):
    print(f"stdout: {data}")

def on_stderr(data):
    print(f"stderr: {data}")

sbx.commands.run('ls -la', on_stdout=on_stdout, on_stderr=on_stderr)

sbx.close()
```

### Example 3: Creating a PTY Session (Python Sync)

```python
from e2b import Sandbox

# Create sandbox
sandbox = Sandbox.create()

# Create PTY with custom size
pty = sandbox.pty.create(
    cols=80,
    rows=24,
    on_data=lambda data: print(f"PTY output: {data}")
)

# Send input to PTY
sandbox.pty.send_stdin(pty.pid, "echo hello\n")

# Resize PTY if needed
sandbox.pty.resize(pty.pid, cols=120, rows=40)

# Kill PTY when done
sandbox.pty.kill(pty.pid)

sandbox.close()
```

### Example 4: Running Claude Code in E2B Sandbox (JavaScript)

```javascript
import { Sandbox } from 'e2b';

// Use prebuilt Claude Code template
const sandbox = await Sandbox.create('claude-code-template');

// Set up environment with API key from environment variable
// Run Claude Code with prompt
const result = await sandbox.commands.run(
  'claude --print "Create a hello-world.html file"',
  {
    onStdout: (data) => console.log(data),
    onStderr: (data) => console.error(data)
  }
);

// Download generated files
const file = await sandbox.files.read('/home/user/hello-world.html');
console.log('Generated file:', file);

await sandbox.close();
```

### Example 5: Running Claude Code in E2B Sandbox (Python)

```python
import os
from e2b import Sandbox

# Create sandbox with Claude Code template
sandbox = Sandbox.create('claude-code-template')

# Run Claude Code (API key should be set in sandbox environment)
result = sandbox.commands.run(
    'claude --print "Create a hello-world.html file"',
    on_stdout=lambda data: print(data),
    on_stderr=lambda data: print(data, file=sys.stderr)
)

# Read generated file
content = sandbox.files.read('/home/user/hello-world.html')
print(f"Generated content: {content}")

sandbox.close()
```

### Example 6: Interactive PTY for Long-Running CLI Tool (JavaScript)

```javascript
import { Sandbox } from 'e2b';

const sandbox = await Sandbox.create();

// Create PTY for interactive session
const pty = await sandbox.pty.create({
  cols: 80,
  rows: 24,
  onData: (data) => {
    // Stream output in real-time
    process.stdout.write(data);
  }
});

// Start interactive CLI tool
await sandbox.pty.sendStdin(pty.pid, 'node\n');  // Start Node REPL

// Send commands
await sandbox.pty.sendStdin(pty.pid, 'console.log("Hello from PTY")\n');

// Later, exit
await sandbox.pty.sendStdin(pty.pid, '.exit\n');

// Clean up
await sandbox.pty.kill(pty.pid);
await sandbox.close();
```

## GitHub Issues Found

### Issue #442: Terminal Can't Execute "cd" Command
- **URL**: https://github.com/e2b-dev/E2B/issues/442
- **Status**: Closed (not planned)
- **Problem**: The `cd` command fails in terminal due to fixed parameter in `TerminalManager` initialization
- **Impact**: Cannot change directories or set environment variables in some contexts
- **Workaround**: Use absolute paths or run commands in the desired directory directly

### Issue #581: Unable to Run Commands in Sandbox (Python SDK)
- **URL**: https://github.com/e2b-dev/E2B/issues/581
- **Status**: Closed
- **Problem**: Running commands returns streaming response; accessing result directly causes RuntimeError
- **Solution**: Must read the stream first before accessing response content

### Issue #275: Timeout Doesn't Work as Expected (JS SDK)
- **URL**: https://github.com/e2b-dev/E2B/issues/275
- **Status**: Bug/Improvement
- **Problem**: Timeout only triggers correctly when specified for both `start()` and `wait()` methods
- **Impact**: Long-running processes may not timeout as expected

## Best Practices

### For Streaming Output

1. **Always use callbacks for real-time output**:
   ```javascript
   await sandbox.commands.run('long-command', {
     onStdout: (data) => handleOutput(data),
     onStderr: (data) => handleError(data)
   });
   ```

2. **Handle buffering issues**: Output may be buffered in 4096-byte chunks. For unbuffered Python output, set `PYTHONUNBUFFERED=1`.

3. **Set appropriate timeouts**: Specify timeout for both command start and wait operations.

### For Interactive CLI Tools

1. **Use PTY for interactive sessions**:
   - Commands requiring user input need PTY
   - Claude Code should use PTY for interactive mode

2. **Handle PTY lifecycle**:
   - Create PTY at start
   - Send input as needed
   - Kill PTY when done

3. **Buffer management**:
   - PTY output includes control sequences
   - Parse terminal escape codes if needed

### For Claude Code in E2B

1. **Use prebuilt template**: `claude-code-template` is available
2. **Non-interactive mode**: Use `--print` flag for non-interactive execution
3. **Environment variables**: Set API key in sandbox environment
4. **File access**: Read generated files after execution completes

## Resources

### Official Documentation
- E2B Streaming Guide: https://e2b.dev/docs/commands/streaming
- E2B Python SDK Reference: https://e2b.dev/docs/sdk-reference/python-sdk/
- E2B JS SDK Reference: https://e2b.dev/docs/sdk-reference/js-sdk/

### Claude Code in E2B
- JavaScript Guide: https://e2b.dev/blog/javascript-guide-run-claude-code-in-an-e2b-sandbox
- Python Guide: https://e2b.dev/blog/python-guide-run-claude-code-in-an-e2b-sandbox
- Claude Code Template: https://e2b.dev/docs/template/examples/claude-code
- FastAPI Example: https://github.com/e2b-dev/claude-code-fastapi

### Related Repositories
- E2B SDK: https://github.com/e2b-dev/e2b
- E2B Cookbook: https://github.com/e2b-dev/e2b-cookbook
- Claude Code FastAPI: https://github.com/e2b-dev/claude-code-fastapi

## Summary

For running interactive CLI tools like Claude Code in E2B sandboxes:

1. **For non-interactive execution**: Use `commands.run()` with `onStdout`/`onStderr` callbacks for streaming output
2. **For interactive sessions**: Use `pty.create()` to get a full pseudo-terminal
3. **For Claude Code specifically**: Use the prebuilt `claude-code-template` and run with `--print` flag for non-interactive mode
4. **Watch for buffering**: Set `PYTHONUNBUFFERED=1` for Python, handle 4096-byte buffer boundaries
5. **Handle timeouts carefully**: Specify timeouts for both start and wait operations

The key insight is that `commands.run` is suitable for most automation tasks where you just need streaming output, while `pty.create` is necessary when the CLI tool expects true terminal interaction (prompts, REPLs, interactive editors).
