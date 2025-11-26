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

| Command | Description |
|---------|-------------|
| `create [--timeout 300] [--template NAME]` | Create a new sandbox (default: slideheroes-claude-agent template) |
| `list [--json]` | List running sandboxes |
| `status <sandbox-id>` | Check if sandbox is running |
| `kill <sandbox-id>` | Kill a specific sandbox |
| `kill-all` | Kill all running sandboxes |
| `run-claude "<prompt>" [--sandbox ID] [--timeout 600]` | Run Claude Code with a prompt in sandbox |

## Examples

```bash
# Create sandbox with slideheroes template (default)
./.claude/skills/e2b-sandbox/scripts/sandbox create

# Create sandbox with 10 minute timeout
./.claude/skills/e2b-sandbox/scripts/sandbox create --timeout 600

# Run Claude Code slash command /test 1 in a new sandbox
./.claude/skills/e2b-sandbox/scripts/sandbox run-claude "/test 1"

# Run Claude Code prompt in existing sandbox
./.claude/skills/e2b-sandbox/scripts/sandbox run-claude "Fix the auth bug" --sandbox abc123

# List all running sandboxes
./.claude/skills/e2b-sandbox/scripts/sandbox list

# Kill a sandbox
./.claude/skills/e2b-sandbox/scripts/sandbox kill <sandbox-id>
```

## Prerequisites

- `E2B_API_KEY` environment variable must be set
- Claude authentication (one of):
  - `CLAUDE_CODE_OAUTH_TOKEN` (for Max plan - generate with: `claude setup-token`)
  - `ANTHROPIC_API_KEY` (for API access)
- Get E2B API key from: https://e2b.dev/dashboard

## Default Template

The sandbox uses `slideheroes-claude-agent` template by default, which includes:
- Pre-cloned SlideHeroes repository
- Pre-installed dependencies (pnpm install)
- Claude Code CLI installed
- Helper scripts: `run-claude`, `run-tests`, `build-project`, `typecheck`, `lint-fix`, `codecheck`

**Note**: Build the template first with `e2b template build` before using.

## Execution Instructions

1. Run the sandbox script with the provided arguments
2. If no arguments, show help
3. Report the result to the user
