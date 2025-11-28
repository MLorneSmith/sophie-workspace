# Context7 Research: E2B Sandbox Logging and Session Management

**Date**: 2025-11-28
**Agent**: context7-expert
**Libraries Researched**: e2b-dev/e2b

## Query Summary

Researched E2B sandbox documentation to understand:
1. How to capture stdout/stderr from sandbox commands
2. How to get sandbox session metadata (start time, sandbox ID, template)
3. Built-in logging and output capture mechanisms
4. How to persist data from sandbox sessions
5. File operations in sandboxes (writing files)

## Findings

### 1. Capturing Command Output (stdout/stderr)

E2B provides multiple methods for capturing command output.

#### Real-time Streaming with Callbacks

The primary method uses callbacks during command execution.

**JavaScript/TypeScript:**
```typescript
import { Sandbox } from '@e2b/code-interpreter'

const sandbox = await Sandbox.create()
const result = await sandbox.commands.run('echo hello; sleep 1; echo world', {
  onStdout: (data) => console.log('STDOUT:', data),
  onStderr: (data) => console.log('STDERR:', data),
})
```

**Python:**
```python
from e2b_code_interpreter import Sandbox

sandbox = Sandbox.create()
result = sandbox.commands.run(
    'echo hello; sleep 1; echo world',
    on_stdout=lambda data: print('STDOUT:', data),
    on_stderr=lambda data: print('STDERR:', data)
)
```

#### Command Result Object

After command execution, the result object contains:
- `stdout` - Complete standard output as string
- `stderr` - Complete standard error as string
- `exit_code` - Command exit code

**Python Example:**
```python
result = sandbox.commands.run('ls -l /')
print(result.stdout)
print(f"Exit code: {result.exit_code}")
```

#### Iterator Pattern (Python)

For long-running commands, Python provides an iterator pattern:

```python
for output_chunk in command_handle:
    print(output_chunk)
```

### 2. Sandbox Session Metadata

E2B provides comprehensive session metadata through the `getInfo()` method.

#### Available Metadata Properties

**JavaScript/TypeScript:**
```typescript
const sandbox = await Sandbox.create()
const info = await sandbox.getInfo()

// Returns SandboxInfo object with:
{
  sandboxId: string,      // Unique identifier
  template: string,       // Template used
  metadata: object,       // Custom metadata (if provided)
  createdAt: string,      // ISO 8601 timestamp
  startedAt: string,      // ISO 8601 timestamp
  exitedAt: string | null // ISO 8601 timestamp or null if running
}
```

**Python:**
```python
info = sandbox.get_info()

# Access properties:
# - info.sandbox_id
# - info.template
# - info.metadata
# - info.created_at
# - info.started_at
# - info.exited_at
```

#### Direct Property Access

The Sandbox object also exposes:
- `sandbox.sandboxId` - Direct access to sandbox ID
- `sandbox.sandboxDomain` - Domain where sandbox is hosted

### 3. Custom Metadata Support

E2B allows attaching custom metadata when creating sandboxes.

**JavaScript:**
```javascript
import { Sandbox } from '@e2b/code-interpreter'

const sandbox = await Sandbox.create({
  metadata: {
    userId: '123',
    projectName: 'my-app',
  },
})

const runningSandboxes = await Sandbox.list()
console.log(runningSandboxes[0].metadata)
```

**Python:**
```python
from e2b_code_interpreter import Sandbox

sandbox = Sandbox.create(
    metadata={
        'userId': '123',
        'projectName': 'my-app',
    }
)

running_sandboxes = Sandbox.list()
print(running_sandboxes[0].metadata)
```

#### Filtering Sandboxes by Metadata

```javascript
const sandboxes = await Sandbox.list({
  query: {
    metadata: { 
      userId: '123' 
    },
  },
})
```

### 4. Built-in Logging System

E2B has a built-in logging system accessible via CLI.

#### CLI Logging Commands

```bash
# View sandbox logs
e2b sandbox logs <sandboxID>

# Filter by log level (DEBUG, INFO, WARN, ERROR)
e2b sandbox logs --level ERROR <sandboxID>

# Follow logs in real-time
e2b sandbox logs -f <sandboxID>

# JSON output format
e2b sandbox logs --format json <sandboxID>

# Filter by specific loggers
e2b sandbox logs --loggers logger1,logger2 <sandboxID>
```

#### Log Levels

- `DEBUG` - Most verbose
- `INFO` - Default level
- `WARN` - Warnings
- `ERROR` - Errors only

Higher levels automatically include lower levels.

#### Real-time Log Streaming

Use `-f, --follow` flag to stream logs in real-time until sandbox closes.

### 5. File Operations - Writing to Filesystem

E2B provides robust file writing capabilities.

#### Single File Write

**Python:**
```python
sandbox.filesystem.write('/path/to/file.txt', 'Hello, world!')
sandbox.filesystem.write('/path/to/file.bin', b'\x00\x01\x02')
```

**JavaScript/TypeScript:**
```typescript
await sandbox.filesystem.write('/path/to/file.txt', 'Hello, world!')
await sandbox.filesystem.write('/path/to/file.bin', arrayBuffer)
```

#### Multiple Files Write

**Python:**
```python
from e2b import WriteEntry

files = [
    WriteEntry(path='/path/to/file1.txt', data='Content 1'),
    WriteEntry(path='/path/to/file2.txt', data='Content 2'),
]
results = sandbox.filesystem.write(files)
```

**JavaScript:**
```javascript
await sandbox.filesystem.write([
  { path: '/path/to/file1.txt', data: 'Content 1' },
  { path: '/path/to/file2.txt', data: 'Content 2' },
])
```

#### File Write Behavior

- Creates files if they don't exist
- Overwrites files if they already exist
- Creates directories automatically if they don't exist
- User parameter - Optionally specify which user to run as (defaults to "user")
- Returns WriteInfo - Contains written bytes count and path

### 6. Persisting Sandbox Data

To persist data from sandbox sessions, combine file writes with output capture:

```typescript
const result = await sandbox.commands.run('npm test')

await sandbox.filesystem.write('/home/user/test-results.log', 
  `Exit Code: ${result.exitCode}\n\nSTDOUT:\n${result.stdout}\n\nSTDERR:\n${result.stderr}`
)

const logContent = await sandbox.filesystem.read('/home/user/test-results.log')
```

## Key Takeaways

1. Use `onStdout` and `onStderr` callbacks for streaming command output
2. All command results include full stdout/stderr strings and exit codes
3. Sandboxes track creation time, start time, template, and custom metadata
4. Attach key-value metadata during creation for tracking and filtering
5. CLI provides robust log viewing with filtering, following, and formatting
6. Write single or multiple files with automatic directory creation
7. Use `getInfo()` to retrieve comprehensive sandbox session details
8. List and filter sandboxes by custom metadata values

## Best Practices for Logging Sandbox Activity

### 1. Structured Logging
```typescript
interface SandboxLog {
  sandboxId: string
  timestamp: string
  template: string
  metadata: Record<string, string>
  commands: {
    command: string
    stdout: string
    stderr: string
    exitCode: number
    duration: number
  }[]
}

const info = await sandbox.getInfo()
const log: SandboxLog = {
  sandboxId: info.sandboxId,
  timestamp: info.startedAt,
  template: info.template,
  metadata: info.metadata,
  commands: []
}
```

### 2. Command Execution Tracking
```typescript
const startTime = Date.now()
const result = await sandbox.commands.run(cmd, {
  onStdout: (data) => logger.info({ sandboxId: sandbox.sandboxId, stream: 'stdout' }, data),
  onStderr: (data) => logger.error({ sandboxId: sandbox.sandboxId, stream: 'stderr' }, data),
})

log.commands.push({
  command: cmd,
  stdout: result.stdout,
  stderr: result.stderr,
  exitCode: result.exitCode,
  duration: Date.now() - startTime
})
```

### 3. File-based Session Logs
```typescript
await sandbox.filesystem.write(
  '/home/user/.e2b-session.log',
  JSON.stringify(log, null, 2)
)
```

### 4. Metadata for Tracking
```typescript
const sandbox = await Sandbox.create({
  metadata: {
    userId: user.id,
    sessionId: sessionId,
    taskType: 'code-execution',
    timestamp: new Date().toISOString(),
  }
})

const userSandboxes = await Sandbox.list({
  query: {
    metadata: { userId: user.id }
  }
})
```

## Event Listeners and Hooks

E2B does not provide traditional event listeners/hooks. Instead, it uses:

1. Callback-based streaming - `onStdout`, `onStderr` for real-time output
2. Iterator pattern (Python) - For processing output chunks
3. CLI log following - `-f` flag for real-time log streaming
4. Result objects - Synchronous access to complete output after execution

## Code Examples

### Complete Session Logging Example

```typescript
import { Sandbox } from '@e2b/code-interpreter'

async function executeWithLogging(command: string) {
  const sandbox = await Sandbox.create({
    metadata: {
      userId: 'user-123',
      taskId: 'task-456',
      createdAt: new Date().toISOString(),
    }
  })

  try {
    const info = await sandbox.getInfo()
    console.log(`Sandbox ${info.sandboxId} started at ${info.startedAt}`)
    
    const outputs: string[] = []
    const errors: string[] = []
    
    const result = await sandbox.commands.run(command, {
      onStdout: (data) => {
        outputs.push(data)
        console.log('[STDOUT]', data)
      },
      onStderr: (data) => {
        errors.push(data)
        console.error('[STDERR]', data)
      },
    })
    
    const sessionLog = {
      sandboxId: info.sandboxId,
      template: info.template,
      startedAt: info.startedAt,
      command,
      exitCode: result.exitCode,
      stdout: outputs,
      stderr: errors,
    }
    
    await sandbox.filesystem.write(
      '/tmp/session.json',
      JSON.stringify(sessionLog, null, 2)
    )
    
    console.log('Session log saved to /tmp/session.json')
    
    return result
  } finally {
    await sandbox.close()
  }
}
```

## Sources

- E2B SDK Documentation via Context7 (e2b-dev/e2b)
- Topics researched:
  - logging commands output (2188 tokens)
  - session metadata sandbox (1356 tokens)
  - files filesystem write (1371 tokens)
  - sandbox api create getInfo (1644 tokens)
