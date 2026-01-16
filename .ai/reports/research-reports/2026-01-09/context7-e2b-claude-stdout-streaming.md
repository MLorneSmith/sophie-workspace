# Context7 Research: E2B SDK and Claude Code Stdout Streaming Behavior

**Date**: 2026-01-09
**Agent**: context7-expert
**Libraries Researched**: e2b-dev/e2b, anthropics/claude-code, anthropics/claude-agent-sdk-typescript, e2b-dev/e2b-cookbook

## Query Summary

Investigated stdout streaming behavior when running Claude Code CLI in E2B sandboxes. The issue: `onStdout` callback receives only 2 initial lines, then nothing until process completion when 40+ lines dump at exit.

Context:
- Running: `stdbuf -oL -eL run-claude "prompt"` in E2B sandboxes
- The `run-claude` script: `echo "$1" | claude -p --setting-sources user,project --dangerously-skip-permissions`
- Using `sandbox.commands.run()` with `onStdout` callback

## Findings

### E2B SDK - `sandbox.commands.run()` with Streaming

The E2B SDK **does support real-time stdout streaming** via callbacks. From the documentation:

```javascript
import { Sandbox } from '@e2b/code-interpreter'

const sandbox = await Sandbox.create()
const result = await sandbox.commands.run('echo hello; sleep 1; echo world', {
  onStdout: (data) => {
    console.log(data)
  },
  onStderr: (data) => {
    console.log(data)
  },
})
```

**Key findings:**
1. **Callbacks are fully supported** - Both `onStdout` and `onStderr` can be provided
2. **Background mode available** - Use `background: true` for long-running commands
3. **PTY alternative exists** - For truly interactive/unbuffered output, use `sandbox.pty.create()`

### Root Cause Analysis: Buffering

The issue is **NOT with E2B SDK** - the SDK streams data as it receives it. The problem is **stdout buffering at the process level**:

1. **Standard C library buffering**: When stdout is not connected to a TTY, it defaults to **block buffering** (typically 4KB or 8KB blocks)
2. **`stdbuf` limitations**: While `stdbuf` sets line buffering, it only affects programs that use standard C library stdio functions. **Node.js processes (like Claude CLI) manage their own buffering internally**.
3. **Pipe behavior**: When using `echo "$1" | claude -p`, the pipe creates a non-TTY environment, triggering buffered mode.

### E2B PTY Alternative

The E2B SDK offers **pseudo-terminal (PTY) support** which forces line-buffered/unbuffered output:

```python
# Python example
from e2b import Sandbox

sandbox = Sandbox.create()
pty_handle = sandbox.pty.create(
    size={"cols": 80, "rows": 24},
    on_data=lambda data: print(data),  # Real-time output
    timeout=300
)
```

```javascript
// JavaScript - PTY has on_data callback for real-time output
const handle = await sandbox.pty.create({
  size: { cols: 80, rows: 24 },
  onData: (data) => console.log(data)
})
```

**PTY forces programs to use line buffering** because they detect a terminal environment.

### Claude Code CLI - Output Behavior

From the Claude Code documentation, there are **no specific flags** for controlling output buffering in pipe mode (`-p`). The CLI is designed primarily for interactive use.

**Relevant findings:**
- The `--dangerously-skip-permissions` flag is documented for non-interactive mode
- No `--flush` or `--unbuffered` options exist
- The SDK (`@anthropic-ai/claude-agent-sdk`) provides streaming via async iterators, but this is for programmatic use, not CLI

### Claude Agent SDK (TypeScript) - Programmatic Alternative

If CLI streaming remains problematic, the **Claude Agent SDK** provides native streaming:

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

const response = query({
  prompt: "Your task here",
  options: {
    model: "claude-sonnet-4-5",
    workingDirectory: "/path/to/project",
    permissionMode: "default"
  }
});

// Streaming via async iterator
for await (const message of response) {
  if (message.type === 'assistant') {
    console.log(message.content);  // Real-time output
  } else if (message.type === 'tool_call') {
    console.log(`Tool: ${message.tool_name}`);
  }
}
```

This approach provides **true streaming** without buffering issues.

### E2B Cookbook Example - Claude in Sandbox

From `e2b-cookbook/examples/anthropic-claude-code-in-sandbox-python`:

```python
from e2b import Sandbox

sbx = Sandbox(
    "anthropic-claude-code",
    envs={'ANTHROPIC_API_KEY': '<key>'},
    timeout=60 * 5,
)

result = sbx.commands.run(
    "echo 'Create a hello world index.html' | claude -p --dangerously-skip-permissions",
    timeout=0,  # Claude can run for a long time
)
print(result.stdout)
```

**Note**: This example waits for completion - it does NOT demonstrate streaming.

## Recommendations

### Option 1: Use PTY Instead of Commands (RECOMMENDED)

Replace `sandbox.commands.run()` with `sandbox.pty.create()`:

```typescript
// Instead of:
const result = await sandbox.commands.run('stdbuf -oL run-claude "prompt"', {
  onStdout: (data) => console.log(data)
});

// Use PTY:
const pty = await sandbox.pty.create({
  size: { cols: 120, rows: 40 },
  onData: (data) => {
    // Real-time output, line by line
    process.stdout.write(data);
  }
});

// Send the command
await pty.sendInput('run-claude "prompt"\n');
await pty.wait();  // Or handle via onData
```

**Why this works**: PTY allocates a pseudo-terminal, which:
- Forces the process to detect `isatty(stdout) === true`
- Triggers line-buffered mode in most programs
- Claude CLI will behave as if in interactive mode

### Option 2: Force PTY in Node.js Script

Create a wrapper that forces PTY allocation:

```bash
#!/bin/bash
# run-claude-pty.sh
script -q /dev/null -c "echo \"$1\" | claude -p --dangerously-skip-permissions" 2>&1
```

Or use `unbuffer` from `expect` package:

```bash
#!/bin/bash
unbuffer bash -c "echo \"$1\" | claude -p --dangerously-skip-permissions"
```

### Option 3: Use Claude Agent SDK Directly

If running in a Node.js E2B sandbox, use the SDK instead of CLI:

```typescript
// In your E2B sandbox code
import { query } from "@anthropic-ai/claude-agent-sdk";

export async function runClaudeTask(prompt: string) {
  const response = query({
    prompt,
    options: { model: "claude-sonnet-4-5" }
  });

  for await (const message of response) {
    if (message.type === 'assistant') {
      // Emit to parent process or callback
      process.stdout.write(message.content);
    }
  }
}
```

### Option 4: Background Mode with Iteration

Use background mode and iterate over output:

```javascript
const command = await sandbox.commands.run('run-claude "prompt"', {
  background: true,
  onStdout: (data) => console.log(data),
});

// Iterate for background commands (Python-specific pattern)
// JS may need to use wait() or disconnect()
await command.wait();
```

## Why `stdbuf` Doesn't Work

1. **`stdbuf` intercepts libc calls**: It uses `LD_PRELOAD` to intercept `setvbuf()` calls
2. **Node.js doesn't use libc for stdout**: Node.js manages its own output streams via libuv
3. **Claude CLI is Node.js-based**: Therefore `stdbuf` has no effect on its buffering

## Key Takeaways

1. **E2B SDK streaming works correctly** - The issue is process-level buffering, not SDK limitation
2. **Use PTY for truly real-time output** - `sandbox.pty.create()` forces terminal mode
3. **`stdbuf` is ineffective for Node.js** - It only works with C programs using libc
4. **Claude Agent SDK provides native streaming** - Consider using it directly instead of CLI
5. **The `script` or `unbuffer` commands can force PTY allocation** - Alternative to SDK PTY

## Code Examples

### Recommended: E2B PTY Approach

```typescript
import { Sandbox } from 'e2b';

async function runClaudeWithStreaming(prompt: string) {
  const sandbox = await Sandbox.create('anthropic-claude-code');
  
  const pty = await sandbox.pty.create({
    size: { cols: 120, rows: 40 },
    onData: (data) => {
      // Real-time streaming output
      process.stdout.write(data.toString());
    }
  });

  // Send the Claude command
  const command = `echo '${prompt.replace(/'/g, "'\\''")}' | claude -p --dangerously-skip-permissions\n`;
  await sandbox.pty.sendStdin(pty.pid, Buffer.from(command));
  
  // Wait for completion (or set up exit detection)
  await pty.wait();
  
  await sandbox.kill();
}
```

### Alternative: unbuffer Wrapper

```bash
#!/bin/bash
# /home/user/run-claude-unbuffered.sh
# Requires: apt-get install expect
unbuffer bash -c "echo \"$1\" | claude -p --dangerously-skip-permissions"
```

Then call:
```typescript
const result = await sandbox.commands.run(
  '/home/user/run-claude-unbuffered.sh "Your prompt"',
  { onStdout: (data) => console.log(data) }
);
```

## Sources

- E2B SDK Documentation via Context7 (e2b-dev/e2b)
- Claude Code Documentation via Context7 (anthropics/claude-code)
- Claude Agent SDK TypeScript via Context7 (anthropics/claude-agent-sdk-typescript)
- E2B Cookbook Examples via Context7 (e2b-dev/e2b-cookbook)
