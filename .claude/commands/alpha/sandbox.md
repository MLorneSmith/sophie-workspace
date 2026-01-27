---
description: "Create and manage E2B cloud sandboxes for isolated code execution"
argument-hint: 'run-claude "/feature:feature" | create | list | kill <id>'
allowed-tools: [Bash]
---

# E2B Sandbox Command

Execute E2B sandbox operations based on the provided arguments: $ARGUMENTS

## Command Execution

Run the sandbox CLI wrapper script:

```bash
./.claude/skills/e2b-sandbox/scripts/sandbox $ARGUMENTS
```

## Available Commands

### Basic Operations

| Command | Description |
|---------|-------------|
| `create [--timeout 300] [--template NAME]` | Create a new sandbox (default: slideheroes-claude-agent template) |
| `list [--json]` | List running sandboxes |
| `status <sandbox-id>` | Check if sandbox is running |
| `kill <sandbox-id>` | Kill a specific sandbox |
| `kill-all` | Kill all running sandboxes |

### Claude Code Operations

| Command | Description |
|---------|-------------|
| `run-claude "<prompt>" [--sandbox ID] [--timeout 600]` | Run Claude Code with a prompt in sandbox |

### Git Operations

| Command | Description |
|---------|-------------|
| `diff <sandbox-id>` | Show git status and diff of changes in sandbox |
| `branch <sandbox-id> "<name>"` | Create a new branch in sandbox |
| `pr <sandbox-id> "<message>" [--branch NAME]` | Create PR from sandbox changes |

### Sequential Feature Workflow (Recommended)

| Command | Description |
|---------|-------------|
| `feature "<#issue description>" [--timeout 1800]` | Phase 1: Create sandbox, run /feature:feature, open VS Code Web, PAUSE for plan review |
| `continue <sandbox-id>` | Phase 2: Run /implement and /review, start dev server, PAUSE for code review |
| `approve <sandbox-id> ["message"]` | Final: Commit, push, create PR |
| `reject <sandbox-id> [--keep]` | Discard changes and kill sandbox. Use `--keep` to keep alive |

### Legacy Mode

| Command | Description |
|---------|-------------|
| `feature "<description>" --no-review` | Skip review gates, auto-push (legacy behavior) |

### Review Commands

| Command | Description |
|---------|-------------|
| `review <sandbox-id>` | Run /review command in sandbox to review changes |

## Recommended Workflow: Sequential Feature Development

The feature workflow runs `/feature:feature`, `/implement`, and `/review` sequentially with human review gates.

**Recent Improvements (v3.1):**
- ✅ VS Code Web starts in background (no timeout blocking)
- ✅ GitHub CLI automatically configured during sandbox setup
- ✅ Smart branch naming with word-boundary truncation (max 35 chars)
- ✅ Clear progress feedback with step indicators (Step 1/4, etc.)
- ✅ Improved error handling for gh CLI auth

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SANDBOX FEATURE WORKFLOW (v3)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  /alpha:sandbox feature "#123 Add dark mode"                                 │
│       │                                                                      │
│       ├─> Create sandbox                                                     │
│       ├─> git fetch && pull origin dev                                       │
│       ├─> Create branch: sandbox/issue123-add-dark-mode                      │
│       ├─> Run Claude Code: /feature:feature "Add dark mode"                  │
│       ├─> Start VS Code Web (code-server) on port 8080                       │
│       └─> OUTPUT:                                                            │
│           • Sandbox ID: abc123                                               │
│           • VS Code: https://abc123-8080.e2b.app                             │
│           • Plan file: .ai/specs/feature-add-dark-mode.md                    │
│                                                                              │
│  ════════════════════ REVIEW GATE 1: Plan Review ════════════════════════   │
│  Human reviews plan in VS Code Web                                           │
│  ════════════════════════════════════════════════════════════════════════   │
│                                                                              │
│  /alpha:sandbox continue abc123                                              │
│       │                                                                      │
│       ├─> Run Claude Code: /implement (executes the plan)                    │
│       ├─> Start dev server: pnpm dev on port 3000                            │
│       ├─> Run Claude Code: /review (AI reviews the implementation)           │
│       └─> OUTPUT:                                                            │
│           • VS Code: https://abc123-8080.e2b.app                             │
│           • Live App: https://abc123-3000.e2b.app                            │
│           • Review report in terminal                                        │
│                                                                              │
│  ════════════════════ REVIEW GATE 2: Code Review ════════════════════════   │
│  Human reviews code in VS Code + tests app manually                          │
│  ════════════════════════════════════════════════════════════════════════   │
│                                                                              │
│  /alpha:sandbox approve abc123                                                     │
│       │                                                                      │
│       ├─> Commit all changes                                                 │
│       ├─> Push branch to origin                                              │
│       ├─> Create PR: sandbox/issue123-add-dark-mode → dev                    │
│       └─> OUTPUT: PR URL                                                     │
│                                                                              │
│  /gitmerge 456  (PR number)                                                  │
│       │                                                                      │
│       ├─> git fetch origin                                                   │
│       ├─> git checkout dev && git pull                                       │
│       ├─> git merge --no-ff origin/sandbox/issue123-add-dark-mode            │
│       ├─> git push origin dev                                                │
│       └─> gh pr close 456 --delete-branch                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Step-by-Step Guide

### Step 1: Start feature planning

```bash
/alpha:sandbox feature "#123 Add dark mode toggle"
```

This:
- Creates a sandbox with VS Code Web
- Syncs with latest `dev` branch
- Creates branch: `sandbox/issue123-add-dark-mode`
- Runs Claude Code `/feature:feature` to create a plan
- **PAUSES** for human to review the plan

### Step 2: Review plan in VS Code Web

- Open the provided VS Code URL (https://abc123-8080.e2b.app)
- Navigate to `.ai/specs/feature-*.md`
- Review the plan and verify it makes sense

### Step 3: Continue to implementation

```bash
/alpha:sandbox continue abc123
```

This:
- Runs Claude Code `/implement` to execute the plan
- Starts the dev server for manual testing (https://abc123-3000.e2b.app)
- Runs Claude Code `/review` for AI code review
- **PAUSES** for human to review code + test the app

### Step 4: Review code and test

- Review code changes in VS Code Web
- Test the app at the provided dev server URL
- Verify everything works as expected

### Step 5: Approve and create PR

```bash
/alpha:sandbox approve abc123
```

This:
- Commits all changes with proper attribution
- Pushes to GitHub
- Creates a PR: `sandbox/issue123-add-dark-mode` → `dev`

### Step 6: Merge locally

```bash
/gitmerge 456
```

This:
- Fetches and merges the PR to local `dev`
- Pushes to origin
- Closes PR and deletes remote branch

## Examples

```bash
# === RECOMMENDED: Sequential Feature Workflow ===

# Step 1: Start feature planning
/alpha:sandbox feature "#123 Add dark mode toggle"

# Step 2: (Review plan in VS Code Web)

# Step 3: Continue to implementation
/alpha:sandbox continue abc123

# Step 4: (Review code + test app)

# Step 5: Approve and create PR
/alpha:sandbox approve abc123

# Step 6: Merge locally
/gitmerge 456

# === Other Operations ===

# Create sandbox manually
/alpha:sandbox create

# Run Claude Code command
/alpha:sandbox run-claude "/test 1"

# View diff
/alpha:sandbox diff abc123

# Kill sandbox
/alpha:sandbox kill abc123

# === LEGACY: Skip review (auto-push) ===
/alpha:sandbox feature "Quick fix" --no-review
```

## Prerequisites

### Required for all operations
- `E2B_API_KEY` environment variable must be set
- Get E2B API key from: https://e2b.dev/dashboard

### Required for Claude Code operations
- Claude authentication (one of):
  - `CLAUDE_CODE_OAUTH_TOKEN` (for Max plan - generate with: `claude setup-token`)
  - `ANTHROPIC_API_KEY` (for API access)

### Required for Git operations (pr, approve, gitmerge)
- `GITHUB_TOKEN` environment variable must be set
- Create token at: https://github.com/settings/tokens
- Required scopes: `repo` (full control of private repositories)

## Session Logging

Every sandbox operation automatically creates a session log in `.ai/logs/sandbox-logs/YYYY-MM-DD/`.

### Log Structure

Each session creates a JSON log file with:

```json
{
  "sessionId": "session-abc123-xyz789",
  "sandboxId": "sandbox-id-here",
  "template": "slideheroes-claude-agent",
  "startTime": "2025-11-28T10:30:00.000Z",
  "endTime": "2025-11-28T10:45:00.000Z",
  "exitCode": 0,
  "command": "feature: Add dark mode",
  "environment": {
    "E2B_API_KEY": "[REDACTED]",
    "GITHUB_TOKEN": "[REDACTED]"
  },
  "entries": [
    {"timestamp": "...", "type": "info", "message": "Session started"},
    {"timestamp": "...", "type": "command", "message": "Running: /feature:feature Add dark mode"},
    {"timestamp": "...", "type": "stdout", "message": "..."},
    {"timestamp": "...", "type": "info", "message": "Session completed"}
  ],
  "gitChanges": {
    "status": "M src/components/theme.tsx\nA src/styles/dark-mode.css",
    "diffStat": "2 files changed, 150 insertions(+), 10 deletions(-)",
    "changedFiles": ["src/components/theme.tsx", "src/styles/dark-mode.css"]
  }
}
```

### What Gets Logged

- **Session metadata**: Sandbox ID, template, timestamps, exit code
- **Commands**: All Claude Code prompts executed
- **Output**: stdout/stderr from sandbox commands (streamed in real-time)
- **Git changes**: Status, diff summary, and changed files
- **Errors**: Any errors that occur during execution

### Security

- **Secrets are automatically masked**: API keys, tokens, and credentials are replaced with `[REDACTED]`
- **Log files are gitignored**: `.ai/logs/sandbox-logs/` is excluded from version control

### Log Location

After any sandbox operation, the log path is displayed:

```
Log: /path/to/project/.ai/logs/sandbox-logs/2025-11-28/session-abc123-xyz789.json
```

## Default Template

The sandbox uses `slideheroes-claude-agent` template by default, which includes:
- Pre-cloned SlideHeroes repository
- Pre-installed dependencies (pnpm install)
- Claude Code CLI installed
- **VS Code Web (code-server)** for code review
- Git pre-configured (credentials set from GITHUB_TOKEN at runtime)
- Helper scripts: `run-claude`, `run-tests`, `build-project`, `typecheck`, `lint-fix`, `codecheck`, `start-vscode`, `start-dev`

**Note**: Rebuild the template after changes with:
```bash
tsx .claude/skills/e2b-sandbox/scripts/build-template.ts
```

## Branch Naming

Format: `sandbox/issue{N}-{slug}` (with smart truncation)

**Constraints:**
- Maximum 35 characters total
- Slug limited to 20 characters (word-boundary truncation)
- Uses MMDD (month-day) suffix instead of full hash for non-issue branches

Examples:
- `sandbox/issue123-add-dark-mode`
- `sandbox/issue456-fix-auth-bug`
- `sandbox/add-dark-mode-1128` (November 28th, no issue number)
- `sandbox/implement-big-f-1128` (20-char limit with word-boundary truncation)

## Execution Instructions

1. Run the sandbox script with the provided arguments
2. If no arguments, show help
3. Report the result to the user
