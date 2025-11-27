---
description: "Create and manage E2B cloud sandboxes for isolated code execution"
argument-hint: 'run-claude "/test 1" | create | list | kill <id>'
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

### Feature Workflow (with review by default)

| Command | Description |
|---------|-------------|
| `feature "<description>" [--timeout 1800] [--no-review]` | Create sandbox, run /feature, PAUSE for review. Add `--no-review` to auto-push |

### Review Commands

| Command | Description |
|---------|-------------|
| `review <sandbox-id>` | Run /review command in sandbox to review changes |
| `approve <sandbox-id> ["message"]` | Approve changes: commit, push, create PR |
| `reject <sandbox-id> [--keep]` | Reject changes: discard and kill sandbox. Use `--keep` to keep sandbox alive |

## Examples

```bash
# === Basic Operations ===

# Create sandbox with slideheroes template (default)
/sandbox create

# Create sandbox with 10 minute timeout
/sandbox create --timeout 600

# List all running sandboxes
/sandbox list

# Kill a sandbox
/sandbox kill abc123

# === Claude Code Operations ===

# Run Claude Code slash command /test 1 in a new sandbox
/sandbox run-claude "/test 1"

# Run Claude Code prompt in existing sandbox
/sandbox run-claude "Fix the auth bug" --sandbox abc123

# === Git Operations ===

# View changes in sandbox
/sandbox diff abc123

# Create a feature branch in sandbox
/sandbox branch abc123 "feature/dark-mode"

# Create PR from sandbox changes
/sandbox pr abc123 "Fix authentication bug"

# Create PR with custom branch name
/sandbox pr abc123 "Add dark mode" --branch feature/dark-mode-v2

# === Feature Workflow (DEFAULT: pauses for review) ===

# Run feature workflow - PAUSES for review before pushing
/sandbox feature "Add dark mode toggle to settings"

# With longer timeout for complex features
/sandbox feature "Implement user dashboard" --timeout 3600

# === Review Workflow ===

# After /sandbox feature completes, you'll get:
#   - Sandbox ID: abc123
#   - Review URL: https://abc123-8080.e2b.app (browse files)
#   - Changed files list

# Run Claude Code /review command on the changes
/sandbox review abc123

# If satisfied, approve to commit, push, and create PR
/sandbox approve abc123

# Or provide a custom commit message
/sandbox approve abc123 "feat: improved dark mode implementation"

# If not satisfied, reject and discard changes
/sandbox reject abc123

# Reject but keep sandbox running for debugging
/sandbox reject abc123 --keep

# === Skip Review (auto-push like before) ===

# Use --no-review to skip the review step and auto-push
/sandbox feature "Quick fix for typo" --no-review
```

## Prerequisites

### Required for all operations
- `E2B_API_KEY` environment variable must be set
- Get E2B API key from: https://e2b.dev/dashboard

### Required for Claude Code operations
- Claude authentication (one of):
  - `CLAUDE_CODE_OAUTH_TOKEN` (for Max plan - generate with: `claude setup-token`)
  - `ANTHROPIC_API_KEY` (for API access)

### Required for Git operations (pr, approve, feature --no-review)
- `GITHUB_TOKEN` environment variable must be set
- Create token at: https://github.com/settings/tokens
- Required scopes: `repo` (full control of private repositories)

## Default Template

The sandbox uses `slideheroes-claude-agent` template by default, which includes:
- Pre-cloned SlideHeroes repository
- Pre-installed dependencies (pnpm install)
- Claude Code CLI installed
- Git pre-configured (credentials set from GITHUB_TOKEN at runtime)
- Helper scripts: `run-claude`, `run-tests`, `build-project`, `typecheck`, `lint-fix`, `codecheck`

**Note**: Build the template first with `e2b template build` before using.

## Workflow: Feature Development in Sandbox

The `feature` command provides a workflow with human review by default:

```
┌─────────────────────────────────────────────────────────────────┐
│ /sandbox feature "Add dark mode toggle"                         │
├─────────────────────────────────────────────────────────────────┤
│ Step 1: Create sandbox with git credentials                     │
│ Step 2: Create feature branch (sandbox/add-dark-mode-xyz123)    │
│ Step 3: Run Claude Code /feature command                        │
│ Step 4: Stage changes (but don't commit)                        │
│ Step 5: Start review server, output:                            │
│         - Sandbox ID                                            │
│         - Review URL (browse files in browser)                  │
│         - Changed files list                                    │
│                                                                 │
│ ─── PAUSE FOR HUMAN REVIEW ───                                  │
│                                                                 │
│ /sandbox review abc123   (optional: run /review)                │
│ /sandbox approve abc123  (commit, push, create PR)              │
│   - OR -                                                        │
│ /sandbox reject abc123   (discard changes, kill sandbox)        │
└─────────────────────────────────────────────────────────────────┘
```

After the review step:
- Use `/sandbox approve <id>` to commit, push, and create a PR
- Use `/sandbox reject <id>` to discard changes and kill the sandbox
- The review URL allows browsing the codebase in your browser

## Execution Instructions

1. Run the sandbox script with the provided arguments
2. If no arguments, show help
3. Report the result to the user
