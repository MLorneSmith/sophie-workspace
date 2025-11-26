---
name: e2b-sandbox
description: This skill should be used when managing E2B secure cloud sandboxes for AI agent workflows, especially for running Claude Code agents to build features and run tests. Use for creating custom templates with pre-cloned repositories, managing sandbox lifecycle, and integrating AI agents with isolated execution environments. Triggers on requests like "create a template for Claude Code", "run tests in a sandbox", "set up E2B for my project", or "spin up a dev environment".
---

# E2B Sandbox Manager for AI Agents

## Overview

This skill enables Claude to manage E2B secure cloud sandboxes optimized for AI agent workflows. The **template approach** is recommended for running Claude Code agents because it provides:

- **5-10 second startup** (vs 30-120 seconds for runtime cloning)
- Pre-cloned repository ready for immediate work
- Pre-installed dependencies (no network latency)
- Deterministic, reproducible environments

## SlideHeroes Integration

This project includes a TypeScript package for E2B integration:

**Package:** `@kit/e2b` (located at `packages/e2b/`)

**Key Exports:**
- Sandbox: `createSandbox`, `connectToSandbox`, `listSandboxes`, `killSandbox`
- Code Execution: `executeCode`, `executePython`, `executeJavaScript`, `executeR`
- Commands: `runCommand`, `installPythonPackage`, `installNodePackage`, `cloneRepository`
- Files: `readFile`, `writeFile`, `listDirectory`, `fileExists`, `makeDirectory`
- Errors: `E2BError`, `AuthenticationError`, `ExecutionError`, `CommandError`

**Test Endpoint:** `GET /api/e2b-test` - Verifies E2B is working correctly

## When to Use This Skill

**Primary Use Cases:**
- Running Claude Code agents to build features
- Executing tests in isolated environments
- AI-assisted code review and refactoring
- Safe execution of AI-generated code

**Template vs Runtime Decision:**

| Approach | Startup | Use When |
|----------|---------|----------|
| **Custom Template** (recommended) | 5-10s | AI agents working on known codebase |
| Runtime Clone | 30-120s | CI/CD, testing different branches |

## Authentication

```bash
# Install E2B CLI
npm i -g @e2b/cli@latest

# Authenticate
e2b auth login

# Set API key for SDK usage
export E2B_API_KEY=e2b_***
```

Get your API key from: https://e2b.dev/dashboard

---

## Creating Custom Templates for AI Agents

### Step 1: Initialize Template

```bash
cd /path/to/your/project
e2b template init
```

This creates `e2b.Dockerfile` in your project root.

### Step 2: Create Dockerfile

Create `e2b.Dockerfile` optimized for your project:

```dockerfile
FROM e2bdev/code-interpreter:latest

# System dependencies
RUN apt-get update && apt-get install -y \
    git vim curl wget jq \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# pnpm
RUN npm install -g pnpm@latest

# Clone repository (BAKED INTO TEMPLATE)
RUN git clone https://github.com/your-org/your-project.git /home/user/project
WORKDIR /home/user/project

# Install dependencies (PRE-INSTALLED)
RUN pnpm install

# Pre-build for faster subsequent builds
RUN pnpm build || true

# Helper scripts
RUN echo '#!/bin/bash\ncd /home/user/project && pnpm test' > /usr/local/bin/run-tests && \
    chmod +x /usr/local/bin/run-tests

RUN echo '#!/bin/bash\ncd /home/user/project && pnpm build' > /usr/local/bin/build-project && \
    chmod +x /usr/local/bin/build-project

ENV PROJECT_ROOT=/home/user/project
ENV NODE_ENV=development
```

### Step 3: Configure e2b.toml

```toml
template_id = "slideheroes-dev"
dockerfile = "e2b.Dockerfile"
template_name = "slideheroes-claude-agent"

# Readiness check
ready_cmd = "pnpm --version && node --version && test -d /home/user/project/node_modules"

# Resources for AI agent workloads
cpu_count = 4
memory_mb = 2048
```

**Resource Guidelines:**

| Use Case | CPU | Memory |
|----------|-----|--------|
| Code execution only | 2 | 512 MB |
| Running tests | 4 | 1024 MB |
| Building + testing | 4 | 2048 MB |
| Heavy workloads | 8 | 4096 MB |

### Step 4: Build Template

```bash
e2b template build \
  -n slideheroes-claude-agent \
  --cpu-count 4 \
  --memory-mb 2048

# Output: Template ID: abc123xyz
```

### Step 5: Test Template

```bash
# Spawn interactive shell
e2b sandbox spawn <template-id>

# Verify:
# - Repo at /home/user/project
# - Dependencies installed (pnpm list)
# - Helper scripts work (run-tests, build-project)
```

---

## Using Templates with Claude Code

### Pre-built Claude Code Template

E2B provides `anthropic-claude-code` template:

```python
from e2b import Sandbox

sandbox = Sandbox(
    "anthropic-claude-code",
    envs={"ANTHROPIC_API_KEY": "<your-key>"},
    timeout=300,
)

# Run Claude Code with a prompt
result = sandbox.commands.run(
    "echo 'Add unit tests for the auth module' | claude -p --dangerously-skip-permissions",
    timeout=0,
)
print(result.stdout)

sandbox.kill()
```

### Custom Template with Your Project

```python
from e2b import Sandbox

# Create sandbox from your custom template
sandbox = Sandbox.create(
    template="slideheroes-claude-agent",
    timeout=300,
    envs={
        "ANTHROPIC_API_KEY": os.environ["ANTHROPIC_API_KEY"],
        "NODE_ENV": "development",
    },
)

# Project is ready - Claude can start immediately!
# Run tests
result = sandbox.commands.run("run-tests", timeout=120)
print(result.stdout)

# Build project
result = sandbox.commands.run("build-project", timeout=300)
print(result.stdout)

sandbox.kill()
```

### TypeScript Integration (using @kit/e2b)

**Recommended:** Use the project's `@kit/e2b` package for typed, logged operations:

```typescript
import {
  createSandbox,
  executePython,
  runCommand,
  killSandbox,
} from '@kit/e2b';

async function runClaudeAgent() {
  const sandbox = await createSandbox({
    template: 'slideheroes-claude-agent',
    timeoutMs: 300000,
    envs: {
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    },
  });

  try {
    // Run tests
    const testResult = await runCommand(sandbox, 'run-tests', {
      cwd: '/home/user/project',
      timeoutMs: 120000,
    });
    console.log('Tests:', testResult.stdout);

    // Execute Python code
    const pythonResult = await executePython(sandbox, `
      import os
      print(f"Working in: {os.getcwd()}")
    `);
    console.log('Python:', pythonResult.stdout);

    // Execute Claude Code task
    const claudeResult = await runCommand(
      sandbox,
      `echo "Implement the feature described in issue #123" | claude -p`,
      { timeoutMs: 0 }
    );
    console.log('Claude output:', claudeResult.stdout);

  } finally {
    await killSandbox(sandbox);
  }
}
```

**Server Action Example:**

```typescript
// apps/web/app/_lib/server/e2b-actions.ts
'use server';

import { createSandbox, executePython, killSandbox } from '@kit/e2b';
import { enhanceAction } from '@kit/next/actions';
import { z } from 'zod';

export const executeCodeAction = enhanceAction(
  async (data) => {
    const sandbox = await createSandbox({ timeoutMs: 60000 });

    try {
      const result = await executePython(sandbox, data.code);
      return {
        success: !result.error,
        stdout: result.stdout,
        stderr: result.stderr,
        error: result.error,
      };
    } finally {
      await killSandbox(sandbox);
    }
  },
  { schema: z.object({ code: z.string() }) }
);
```

---

## Sandbox Lifecycle Operations

### Create Sandbox

```python
from e2b import Sandbox

# From custom template
sandbox = Sandbox.create(
    template="slideheroes-claude-agent",
    timeout=600,
    metadata={"task": "feature-build", "issue": "123"},
)

# From base template (slower - no pre-installed deps)
sandbox = Sandbox.create(timeout=300)
```

### List Running Sandboxes

```python
sandboxes = Sandbox.list()
for s in sandboxes:
    print(f"ID: {s.sandbox_id}, Template: {s.template_id}")
```

### Check Status & Reconnect

```python
# Check if running
is_running = sandbox.is_running()

# Reconnect to existing sandbox
sandbox = Sandbox.connect(sandbox_id="existing-id")
```

### Terminate

```python
sandbox.kill()
```

---

## Template Management

### List Templates

```bash
e2b template list
e2b template list -f json
```

### Update Template

1. Modify `e2b.Dockerfile`
2. Rebuild: `e2b template build -n <name>`
3. New sandboxes use updated template

### Delete Template

```bash
e2b template delete <template-id> -y
```

---

## File & Command Operations

### File Operations

```python
# Write file
sandbox.files.write("/home/user/project/new-file.ts", code)

# Read file
content = sandbox.files.read("/home/user/project/package.json")

# List directory
files = sandbox.files.list("/home/user/project/src")

# Check exists
exists = sandbox.files.exists("/home/user/project/config.json")
```

### Command Execution

```python
# Run command
result = sandbox.commands.run("pnpm test", cwd="/home/user/project")
print(result.stdout)
print(result.exit_code)

# Long-running command (no timeout)
result = sandbox.commands.run("pnpm dev", timeout=0)
```

### Get Host URL (for dev servers)

```python
# Get external URL for port 3000
host = sandbox.get_host(3000)
# Returns: "sandbox-id-3000.e2b.app"
```

---

## Best Practices for AI Agent Templates

1. **Pre-clone repository** - Fastest startup for known codebases
2. **Pre-install dependencies** - Eliminate network latency
3. **Create helper scripts** - `run-tests`, `build-project`, etc.
4. **Set appropriate resources** - 4 CPU / 2GB RAM for most dev workflows
5. **Use `ready_cmd`** - Verify environment is ready before use
6. **Always cleanup** - Use context managers or try-finally

---

## Resources

### packages/e2b/ (TypeScript - Recommended)

The `@kit/e2b` package provides typed wrappers for the E2B SDK with logging:

```typescript
// Import from the package
import {
  createSandbox,
  executePython,
  runCommand,
  killSandbox
} from '@kit/e2b';

// All operations are logged via @kit/shared/logger
```

**Source files:**
- `packages/e2b/src/sandbox.ts` - Sandbox lifecycle
- `packages/e2b/src/code-execution.ts` - Code execution helpers
- `packages/e2b/src/commands.ts` - Shell commands & package installation
- `packages/e2b/src/files.ts` - File operations
- `packages/e2b/src/errors.ts` - Typed error classes

### scripts/ (Python CLI)

Contains `sandbox_manager.py` - CLI tool for sandbox operations:

```bash
python scripts/sandbox_manager.py create --timeout 600
python scripts/sandbox_manager.py list
python scripts/sandbox_manager.py kill <sandbox-id>
python scripts/sandbox_manager.py kill-all --confirm
```

### references/

- `e2b-api-reference.md` - Complete API documentation
- `e2b-templates-reference.md` - Template creation deep dive

Read references when needing:
- Complete configuration options
- All error types and handling
- Advanced patterns (parallel execution, caching)
- Security configurations
- Dockerfile examples for different tech stacks

### Test Endpoint

Verify E2B is working:

```bash
curl http://localhost:3000/api/e2b-test
```

Located at `apps/web/app/api/e2b-test/route.ts`
