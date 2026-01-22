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
- **VS Code Web** for browser-based code review
- **Live dev server** for manual testing

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

## Scripts - Non-Interactive Automation

The skill includes utility scripts for non-interactive automation, CI/CD pipelines, and background processes.

### Available Scripts

| Script | Language | Purpose | When to Use |
|--------|----------|---------|-------------|
| `sandbox` | Bash | Main CLI wrapper | Quick sandbox operations from terminal |
| `e2b-wrapper` | Bash | CLI non-interactive wrapper | CI/CD pipelines using E2B CLI |
| `e2b-sdk.py` | Python | SDK-based manager | Full automation, no CLI dependency |
| `sandbox-cli.ts` | TypeScript | Full-featured CLI | Complex workflows with logging |
| `sandbox_manager.py` | Python | Legacy SDK manager | Basic sandbox operations |

### Quick Start

```bash
# Using the main sandbox wrapper (recommended)
.claude/skills/e2b-sandbox/scripts/sandbox create
.claude/skills/e2b-sandbox/scripts/sandbox list
.claude/skills/e2b-sandbox/scripts/sandbox kill <id>

# Using Python SDK directly (no CLI required)
python .claude/skills/e2b-sandbox/scripts/e2b-sdk.py sandbox list --json
python .claude/skills/e2b-sandbox/scripts/e2b-sdk.py sandbox create --template base
python .claude/skills/e2b-sandbox/scripts/e2b-sdk.py sandbox exec <id> "ls -la"

# Using CLI wrapper (wraps interactive CLI for automation)
.claude/skills/e2b-sandbox/scripts/e2b-wrapper sandbox-list --json
.claude/skills/e2b-sandbox/scripts/e2b-wrapper sandbox-kill-all --force
```

### e2b-sdk.py - Python SDK Manager

**Best for:** Full automation, CI/CD, background processes, no CLI dependency

```bash
# Sandbox operations
python e2b-sdk.py sandbox create --template base --timeout 300
python e2b-sdk.py sandbox list --json
python e2b-sdk.py sandbox status <sandbox-id>
python e2b-sdk.py sandbox kill <sandbox-id>
python e2b-sdk.py sandbox kill-all --confirm
python e2b-sdk.py sandbox exec <sandbox-id> "git status"
python e2b-sdk.py sandbox url <sandbox-id> --port 3000

# File operations
python e2b-sdk.py sandbox files-read <sandbox-id> /home/user/project/package.json
python e2b-sdk.py sandbox files-write <sandbox-id> /tmp/test.txt "content"
python e2b-sdk.py sandbox files-list <sandbox-id> /home/user/project

# Auth check
python e2b-sdk.py auth check
```

**Exit Codes:**
| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General failure |
| 2 | Invalid arguments |
| 10 | Authentication failure |
| 11 | Resource not found |
| 12 | Execution timeout |

### e2b-wrapper - CLI Wrapper

**Best for:** Wrapping interactive CLI commands in automation scripts

```bash
# Auth
./e2b-wrapper auth-check

# Templates
./e2b-wrapper template-list --json
./e2b-wrapper template-build my-template --cpu 4 --memory 2048
./e2b-wrapper template-delete <template-id> --force

# Sandboxes
./e2b-wrapper sandbox-list --json --state running
./e2b-wrapper sandbox-kill <sandbox-id>
./e2b-wrapper sandbox-kill-all --force
```

### sandbox - Main CLI

**Best for:** Interactive use, complex workflows with VS Code Web integration

```bash
# Basic operations
./sandbox create --timeout 600
./sandbox list --json
./sandbox kill <sandbox-id>

# Run Claude Code
./sandbox run-claude "/feature add auth" --sandbox <id>

# Feature workflow with review gates
./sandbox feature "#123 Add dark mode"    # Phase 1: Planning
./sandbox continue <sandbox-id>            # Phase 2: Implementation
./sandbox approve <sandbox-id>             # Phase 3: PR creation

# Git operations
./sandbox diff <sandbox-id>
./sandbox pr <sandbox-id> "Fix auth bug"
```

### Environment Variables

Scripts automatically load from `.env` and `apps/web/.env.local`:

| Variable | Required | Purpose |
|----------|----------|---------|
| `E2B_API_KEY` | Yes | E2B authentication |
| `GITHUB_TOKEN` | For git ops | GitHub authentication |
| `ANTHROPIC_API_KEY` | For Claude | Claude Code API access |
| `CLAUDE_CODE_OAUTH_TOKEN` | Alternative | Claude Code OAuth (Max plan) |

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
| Heavy workloads (VS Code + dev server) | 4 | 4096 MB |

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

## Rebuilding the SlideHeroes Template

**IMPORTANT**: The SlideHeroes repository is private. The template MUST be built with `GITHUB_TOKEN` set, otherwise the repo clone will fail during template build.

### Why This Matters

The template definition in `packages/e2b/e2b-template/template.ts` uses conditional URL construction:

```typescript
const REPO_URL = GITHUB_TOKEN
  ? `https://${GITHUB_TOKEN}@github.com/MLorneSmith/2025slideheroes.git`  // ← Authenticated
  : "https://github.com/MLorneSmith/2025slideheroes.git";  // ← Fails for private repos
```

If `GITHUB_TOKEN` is not set during build, the unauthenticated URL is baked into the template, causing "fatal: not a git repository" errors when sandboxes are created.

### Prerequisites

1. **E2B API Key**: Get from https://e2b.dev/dashboard
2. **GitHub Token**: Create at https://github.com/settings/tokens
   - Needs `repo` scope for private repository access
   - Can use a fine-grained token scoped to MLorneSmith/2025slideheroes

### Rebuild Steps

```bash
# 1. Set required environment variables
export E2B_API_KEY="e2b_***"
export GITHUB_TOKEN="ghp_***"  # or GH_TOKEN

# 2. Navigate to project root
cd /home/msmith/projects/2025slideheroes

# 3. Build production template
pnpm e2b:build:prod

# Or build development template
pnpm e2b:build:dev

# Alternative: Use the script directly
.claude/skills/e2b-sandbox/scripts/build-template.ts
.claude/skills/e2b-sandbox/scripts/build-template.ts --dev
```

### Verification

After rebuilding, verify the template works:

```bash
# Create a test sandbox
.claude/skills/e2b-sandbox/scripts/sandbox create

# Check the output for:
# ✓ GitHub auth: Configured
# ✓ Repository: /home/user/project exists

# Verify repo is present
.claude/skills/e2b-sandbox/scripts/sandbox run-claude "git status"

# Kill the test sandbox
.claude/skills/e2b-sandbox/scripts/sandbox list
.claude/skills/e2b-sandbox/scripts/sandbox kill <sandbox-id>
```

### Template Aliases

| Environment | Alias | pnpm Command |
|-------------|-------|--------------|
| Production | `slideheroes-claude-agent` | `pnpm e2b:build:prod` |
| Development | `slideheroes-claude-agent-dev` | `pnpm e2b:build:dev` |

### Troubleshooting

**"fatal: not a git repository" in sandbox**
- Template was built without GITHUB_TOKEN
- Rebuild with GITHUB_TOKEN set

**"GitHub auth: Not set" when creating sandbox**
- Add GITHUB_TOKEN to `.env` or export it
- The sandbox wrapper now loads from .env automatically

**Template build fails**
- Verify GITHUB_TOKEN has `repo` scope
- Check E2B_API_KEY is valid
- Ensure token hasn't expired

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
4. **Set appropriate resources** - 4 CPU / 4GB RAM for VS Code + dev server workflows
5. **Use `ready_cmd`** - Verify environment is ready before use
6. **Always cleanup** - Use context managers or try-finally

---

## VS Code Web Integration

The sandbox includes code-server (VS Code Web) for reviewing code in a full IDE:

- **Port 8080**: VS Code Web interface
- **Port 3000**: Next.js dev server (when running)

### Features Available in VS Code Web

- Full file tree navigation
- Syntax highlighting and IntelliSense
- Search across files (Cmd/Ctrl+Shift+F)
- Git diff viewer
- Integrated terminal access
- Extensions (pre-installed: ESLint, Prettier, TypeScript)

### Starting Services Manually

```bash
# In sandbox terminal:
start-vscode    # Start VS Code Web on port 8080
start-dev       # Start pnpm dev on port 3000
```

### Accessing Services

When using the `/sandbox feature` workflow, URLs are provided automatically:

```
VS Code Web: https://{sandbox-id}-8080.e2b.app
Dev Server:  https://{sandbox-id}-3000.e2b.app
```

### Python/SDK Access

```python
# Get external URL for VS Code Web
vscode_host = sandbox.get_host(8080)
# Returns: "sandbox-id-8080.e2b.app"

# Get external URL for dev server
dev_host = sandbox.get_host(3000)
# Returns: "sandbox-id-3000.e2b.app"
```

---

## Sequential Feature Workflow

The `/sandbox feature` command implements a human-in-the-loop workflow:

### Workflow Phases

```
Phase 1: /sandbox feature "#123 Add dark mode"
  ├── Create sandbox
  ├── Sync with dev branch
  ├── Create branch: sandbox/issue123-add-dark-mode
  ├── Run Claude Code: /feature (creates plan)
  ├── Start VS Code Web
  └── PAUSE for plan review

Phase 2: /sandbox continue <sandbox-id>
  ├── Run Claude Code: /implement (executes plan)
  ├── Start dev server
  ├── Run Claude Code: /review (AI reviews code)
  └── PAUSE for code review

Phase 3: /sandbox approve <sandbox-id>
  ├── Commit all changes
  ├── Push branch to origin
  └── Create PR → dev
```

### Branch Naming Convention

Branches follow the format: `sandbox/issue{N}-{slug}`

Examples:
- `sandbox/issue123-add-dark-mode`
- `sandbox/issue456-fix-auth-bug`

If no issue number is provided, a timestamp is used:
- `sandbox/add-dark-mode-abc123`

### Commands Reference

| Command | Description |
|---------|-------------|
| `feature "<#N description>"` | Phase 1: Plan review gate |
| `continue <sandbox-id>` | Phase 2: Code review gate |
| `approve <sandbox-id>` | Final: Commit, push, create PR |
| `reject <sandbox-id>` | Discard changes, kill sandbox |
| `diff <sandbox-id>` | Show git status and diff |
| `pr <sandbox-id> "<message>"` | Manually create PR |

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
