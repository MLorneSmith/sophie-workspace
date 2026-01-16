# Context7 Research: E2B Sandbox Templates and Claude Code Integration

**Date**: 2026-01-06
**Agent**: context7-expert
**Libraries Researched**: e2b-dev/e2b, e2b-dev/code-interpreter, e2b-dev/claude-code-fastapi

## Query Summary

Research on E2B documentation to understand:
1. How templates work (snapshots vs runtime setup)
2. Best practices for templates with git repos
3. How to run long-running processes
4. When to use custom templates vs fresh sandboxes
5. Executing CLI tools like Claude Code inside sandboxes

## Findings

### 1. How E2B Templates Work

**Templates are NOT runtime snapshots** - they are built from Dockerfiles at build time and converted into VM images that can be instantiated as sandboxes.

#### Template Build Process

```bash
# Initialize template (creates e2b.Dockerfile)
e2b template init

# Build from Dockerfile
e2b template build [options] [template]
```

**Key Build Options:**
- `-n, --name <template-name>`: Sandbox template name (lowercase, letters/numbers/dashes/underscores)
- `-c, --cmd <start-command>`: Command executed when sandbox starts
- `--ready-cmd <ready-command>`: Command that must exit 0 for template to be ready
- `--cpu-count <cpu-count>`: Number of CPUs (default: 2)
- `--memory-mb <memory-mb>`: Memory in MB (default: 512, must be even)
- `-d, --dockerfile <file>`: Path to Dockerfile

#### Example Dockerfile

```dockerfile
# Must use E2B base image
FROM e2bdev/code-interpreter:latest

# Install system packages
RUN apt-get update && apt-get install -y git nodejs npm

# Install Python packages
RUN pip install cowsay

# Install npm packages globally
RUN npm install -g cowsay

# Pre-clone repository (optional)
RUN git clone https://github.com/example/repo /home/user/project

# Pre-install dependencies (optional)
WORKDIR /home/user/project
RUN npm install
```

#### Template Configuration (e2b.toml)

Generated automatically during build, contains template metadata.

### 2. Templates with Git Repos - Two Approaches

#### Approach A: Pre-cloned in Template (Recommended for Large Repos)

**Pros:**
- Instant startup - no clone time
- Dependencies pre-installed
- Consistent environment

**Cons:**
- Template must be rebuilt when repo changes
- Larger template size
- Cannot easily switch branches

**Example Dockerfile:**
```dockerfile
FROM e2bdev/code-interpreter:latest

# Install git and dependencies
RUN apt-get update && apt-get install -y git

# Clone repo at build time
RUN git clone https://github.com/org/monorepo /home/user/project

# Install dependencies at build time
WORKDIR /home/user/project
RUN npm install  # or pnpm install
```

#### Approach B: Clone at Runtime (Recommended for Dynamic Repos)

**Pros:**
- Always gets latest code
- Smaller template size
- Can switch branches easily

**Cons:**
- Slower startup
- Network dependency
- Must install deps each time

**Runtime Clone Example (from claude-code-fastapi):**
```bash
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Add feature X",
    "repo": "https://github.com/org/repo"
  }'
```

The API clones the repo at sandbox start time.

**Recommendation for SlideHeroes Monorepo:**
- Use **pre-cloned template** for:
  - Full monorepo with `node_modules` pre-installed
  - All pnpm dependencies cached
  - Common development tools pre-installed
- Clone at runtime for:
  - Specific branches or PRs
  - Quick experiments
  - When template rebuild is impractical

### 3. Running Long-Running Processes

#### Background Command Execution

```javascript
// JavaScript
const command = await sandbox.commands.run('npm run dev', {
  background: true,
  onStdout: (data) => console.log(data),
});

// Later: kill when done
await command.kill();
```

```python
# Python
command = sandbox.commands.run('npm run dev', background=True)

# Iterate over output
for stdout, stderr, _ in command:
    if stdout:
        print(stdout)

# Kill when done
command.kill()
```

#### Start Command in Template

Use `-c` flag during build to run a command when sandbox starts:

```bash
e2b template build -c "/root/.jupyter/start-up.sh"
```

This is ideal for:
- Starting development servers
- Running VS Code server
- Initializing services

#### Ready Command

Use `--ready-cmd` to wait for services to be ready:

```bash
e2b template build \
  -c "npm run dev" \
  --ready-cmd "curl -s http://localhost:3000/health"
```

The sandbox won't be marked ready until the ready command exits 0.

### 4. Sandbox Timeout and Lifecycle

#### Creating with Timeout

```javascript
// JavaScript (milliseconds)
const sandbox = await Sandbox.create({
  timeoutMs: 60_000,  // 60 seconds
});
```

```python
# Python (seconds)
sandbox = Sandbox.create(timeout=60)
```

#### Extending Timeout

```javascript
// Reset timeout to 30 seconds from now
await sandbox.setTimeout(30_000);
```

**Maximum Timeouts:**
- **Pro users**: 24 hours (86,400 seconds)
- **Hobby users**: 1 hour (3,600 seconds)

#### Pause and Resume (Beta)

```javascript
// Pause sandbox (saves state)
await sandbox.betaPause();

// Resume later
const sameSandbox = await sandbox.connect();
```

```python
# Python
sandbox.beta_pause()
same_sandbox = sandbox.connect()
```

**Pause preserves:**
- Filesystem state
- Memory state
- Running processes (will resume)

**Pause affects:**
- Network services become inaccessible
- Active connections are terminated
- Clients must reconnect after resume

### 5. When to Use Custom Template vs Fresh Sandbox

#### Use Custom Template When:

| Scenario | Why |
|----------|-----|
| Large dependency trees | Pre-install saves minutes per sandbox |
| Consistent environment | Same tools, versions across all sandboxes |
| Monorepo development | Pre-clone + pre-install everything |
| Specialized tools | Pre-install Claude Code, VS Code server, etc. |
| Resource-intensive setup | Build caches, databases pre-configured |

#### Use Fresh Sandbox When:

| Scenario | Why |
|----------|-----|
| Quick code execution | Default `base` template is sufficient |
| Testing isolated snippets | No dependencies needed |
| Dynamic repo requirements | Different repos per request |
| Minimal resource usage | Faster to spin up default |

### 6. Running Claude Code CLI in E2B

The `e2b-dev/claude-code-fastapi` project demonstrates the pattern:

#### Environment Variables

```env
# Required
ANTHROPIC_API_KEY=your_anthropic_api_key_here
E2B_API_KEY=your_e2b_api_key_here

# Optional
E2B_SANDBOX_TEMPLATE=claude-code-dev
GITHUB_PAT=your_github_personal_access_token_here
CONTEXT7_API_KEY=your_context7_api_key_here
```

#### Template with Claude Code Pre-installed

```bash
# Build development template
cd template
python build_dev.py

# Or production template
python build.py
```

#### API Usage

```bash
# Start new session with repo
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Add GPT-3.5 to the list of models and open a PR",
    "repo": "https://github.com/e2b-dev/fragments"
  }'

# Resume existing session
curl -X POST "http://localhost:8000/chat/SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Now add a test for that feature"
  }'
```

#### Response Structure

```json
{
  "type": "result",
  "subtype": "success",
  "is_error": false,
  "duration_ms": 216401,
  "num_turns": 81,
  "result": "Completed all tasks. PR created at: ...",
  "session_id": "038b769b-4717-47ca-be02-2a49bd7da978",
  "total_cost_usd": 1.1459241,
  "usage": {
    "input_tokens": 300,
    "cache_read_input_tokens": 2087724,
    "output_tokens": 13935
  }
}
```

### 7. File Operations

#### Upload Files

```javascript
const uploadUrl = sandbox.uploadUrl("/path/to/upload/");
// POST file as multipart/form-data to uploadUrl
```

```python
# Write directly
sandbox.files.write("/path/to/file.txt", "content")

# Multiple files
sandbox.files.write([
  {"path": "/file1.txt", "data": "content1"},
  {"path": "/file2.txt", "data": "content2"}
])
```

#### Download Files

```javascript
const downloadUrl = sandbox.downloadUrl("/path/to/file.txt");
// GET from downloadUrl
```

```python
content = sandbox.files.read("/path/to/file.txt")
```

### 8. Process Management

#### List Running Processes

```python
processes = sandbox.commands.list()
for p in processes:
    print(f"PID: {p.pid}, Command: {p.command}")
```

#### Kill Process

```python
# Kill by PID
success = sandbox.commands.kill(pid=12345)

# Kill via handle
command.kill()
```

#### Send Input to Running Process

```python
sandbox.commands.send_stdin(pid=12345, data="input\n")
```

### 9. Reconnecting to Sandboxes

```javascript
// Create and save ID
const sandbox = await Sandbox.create();
const sandboxId = sandbox.sandboxId;
// Store sandboxId in database

// Later: reconnect
const sameSandbox = await Sandbox.connect(sandboxId);
```

This is crucial for:
- Long-running tasks
- Resuming after API restarts
- Multi-step workflows

## Key Takeaways

1. **Templates are Docker-based**, built at build time, not runtime snapshots
2. **For monorepos, pre-clone and pre-install** dependencies in template for fastest startup
3. **Use background: true** for long-running processes like dev servers
4. **Set appropriate timeouts** - Pro allows 24 hours, extend with `setTimeout()`
5. **Use pause/resume (beta)** for cost-effective long sessions
6. **Store sandbox IDs** for reconnection in multi-step workflows
7. **Claude Code integration** works via template with pre-installed tools + API wrapper

## Recommended SlideHeroes Template

```dockerfile
FROM e2bdev/code-interpreter:latest

# Install Node.js and pnpm
RUN apt-get update && apt-get install -y \
    git \
    curl \
    nodejs \
    npm

RUN npm install -g pnpm

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# Pre-clone monorepo
RUN git clone https://github.com/org/slideheroes /home/user/project

# Pre-install all dependencies
WORKDIR /home/user/project
RUN pnpm install

# Set working directory
WORKDIR /home/user/project
```

Build with:
```bash
e2b template build \
  -n slideheroes-dev \
  --cpu-count 4 \
  --memory-mb 4096
```

## Code Examples

### Complete Sandbox Session

```javascript
import { Sandbox } from '@e2b/code-interpreter';

// Create sandbox from custom template
const sandbox = await Sandbox.create({
  template: 'slideheroes-dev',
  timeoutMs: 3600_000,  // 1 hour
});

try {
  // Start dev server in background
  const devServer = await sandbox.commands.run('pnpm dev', {
    background: true,
    cwd: '/home/user/project',
    onStdout: (data) => console.log('[dev]', data),
  });

  // Run Claude Code
  const result = await sandbox.commands.run(
    'claude-code "Implement feature X in apps/web/src/features/..."',
    { timeout: 600 }  // 10 minutes
  );

  console.log('Claude Code output:', result.stdout);

  // Run tests
  const tests = await sandbox.commands.run('pnpm test:unit');
  console.log('Tests:', tests.exitCode === 0 ? 'PASSED' : 'FAILED');

} finally {
  await sandbox.kill();
}
```

### Pause/Resume Pattern

```javascript
// Initial session
const sandbox = await Sandbox.create({ template: 'slideheroes-dev' });
const sandboxId = sandbox.sandboxId;

// Do work...
await sandbox.commands.run('git checkout -b feature-branch');

// Pause for cost savings
await sandbox.betaPause();

// Later: resume
const resumedSandbox = await Sandbox.connect(sandboxId);
await resumedSandbox.commands.run('git status');
```

## Sources

- E2B SDK documentation via Context7 (e2b-dev/e2b)
- E2B Code Interpreter SDK via Context7 (e2b-dev/code-interpreter)
- Claude Code FastAPI integration via Context7 (e2b-dev/claude-code-fastapi)
