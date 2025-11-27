# E2B Sandbox Infrastructure

**Purpose**: Documentation for E2B secure cloud sandboxes used for isolated AI agent workflows, feature development with human review gates, and safe code execution environments.

## Overview

SlideHeroes uses E2B (e2b.dev) sandboxes to provide:

1. **Isolated Development Environments**: Secure cloud VMs for Claude Code agents
2. **Human-in-the-Loop Workflows**: Sequential feature development with review gates
3. **VS Code Web Integration**: Browser-based code review via code-server
4. **Live Testing**: Next.js dev server for manual testing

## Architecture

### Custom Template: `slideheroes-claude-agent`

Built with E2B v2 SDK (TypeScript-based, not Dockerfile):

| Component | Details |
|-----------|---------|
| Base | Ubuntu 24.04 |
| Node.js | v20.x |
| Package Manager | pnpm 10.x |
| Build Tool | Turbo v2.6 |
| AI Agent | Claude Code CLI |
| IDE | code-server (VS Code Web) |
| Resources | 4 CPU, 4GB RAM |

**Pre-installed in Template**:
- SlideHeroes repository cloned to `/home/user/project`
- All dependencies installed (`pnpm install`)
- Playwright browsers for E2E testing
- Helper scripts: `run-claude`, `run-tests`, `build-project`, `typecheck`, `lint-fix`, `codecheck`, `start-vscode`, `start-dev`, `git-info`

### Port Assignments

| Port | Service | URL Pattern |
|------|---------|-------------|
| 8080 | VS Code Web (code-server) | `https://{sandbox-id}-8080.e2b.app` |
| 3000 | Next.js dev server | `https://{sandbox-id}-3000.e2b.app` |

## Sequential Feature Workflow

The `/sandbox feature` command implements a human-in-the-loop workflow with two review gates:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SANDBOX FEATURE WORKFLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PHASE 1: /sandbox feature "#123 Add dark mode"                              │
│       ├─> Create sandbox from slideheroes-claude-agent template              │
│       ├─> git fetch && pull origin dev                                       │
│       ├─> Create branch: sandbox/issue123-add-dark-mode                      │
│       ├─> Run Claude Code: /feature "Add dark mode"                          │
│       ├─> Start VS Code Web (code-server) on port 8080                       │
│       └─> PAUSE: Review plan in VS Code Web                                  │
│                                                                              │
│  ════════════════════ REVIEW GATE 1: Plan Review ════════════════════════   │
│                                                                              │
│  PHASE 2: /sandbox continue <sandbox-id>                                     │
│       ├─> Run Claude Code: /implement (executes the plan)                    │
│       ├─> Start dev server: pnpm dev on port 3000                            │
│       ├─> Run Claude Code: /review (AI reviews implementation)               │
│       └─> PAUSE: Review code + test app manually                             │
│                                                                              │
│  ════════════════════ REVIEW GATE 2: Code Review ════════════════════════   │
│                                                                              │
│  PHASE 3: /sandbox approve <sandbox-id>                                      │
│       ├─> Commit all changes                                                 │
│       ├─> Push branch to origin                                              │
│       └─> Create PR: sandbox/issue123-add-dark-mode → dev                    │
│                                                                              │
│  PHASE 4: /gitmerge <pr-number>                                              │
│       ├─> git fetch origin                                                   │
│       ├─> git checkout dev && git pull                                       │
│       ├─> git merge --no-ff origin/sandbox/issue123-add-dark-mode            │
│       ├─> git push origin dev                                                │
│       └─> gh pr close <pr-number> --delete-branch                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Branch Naming Convention

Format: `sandbox/issue{N}-{slug}`

| Input | Generated Branch |
|-------|------------------|
| `#123 Add dark mode` | `sandbox/issue123-add-dark-mode` |
| `issue 456: Fix auth bug` | `sandbox/issue456-fix-auth-bug` |
| `Add dark mode` (no issue) | `sandbox/add-dark-mode-abc123` |

## Commands Reference

### /sandbox Command

| Subcommand | Description |
|------------|-------------|
| `create [--timeout 300] [--template NAME]` | Create new sandbox |
| `list [--json]` | List running sandboxes |
| `status <sandbox-id>` | Check sandbox status |
| `kill <sandbox-id>` | Kill specific sandbox |
| `kill-all` | Kill all running sandboxes |
| `run-claude "<prompt>"` | Run Claude Code with prompt |
| `feature "#N description"` | Phase 1: Plan + VS Code Web |
| `continue <sandbox-id>` | Phase 2: Implement + Review |
| `approve <sandbox-id>` | Phase 3: Commit, Push, PR |
| `reject <sandbox-id> [--keep]` | Discard changes |
| `diff <sandbox-id>` | Show git status and diff |
| `pr <sandbox-id> "<message>"` | Manually create PR |

### /gitmerge Command

Merges sandbox PRs locally:

```bash
/gitmerge <pr-number>    # Merge by PR number
/gitmerge <branch-name>  # Merge by branch name
```

Process:
1. Fetch branch from origin
2. Checkout and update local dev
3. Merge with `--no-ff`
4. Push to origin
5. Close PR and delete remote branch

## Prerequisites

### Environment Variables

| Variable | Required For | Description |
|----------|--------------|-------------|
| `E2B_API_KEY` | All operations | API key from e2b.dev/dashboard |
| `CLAUDE_CODE_OAUTH_TOKEN` | Claude Code (Max plan) | Generate with `claude setup-token` |
| `ANTHROPIC_API_KEY` | Claude Code (API) | Alternative to OAuth token |
| `GITHUB_TOKEN` | Git operations | Token with `repo` scope |

### Template Building

Rebuild template after changes:

```bash
tsx .claude/skills/e2b-sandbox/scripts/build-template.ts
```

## Helper Scripts in Sandbox

| Script | Description |
|--------|-------------|
| `run-claude "<prompt>"` | Run Claude Code with prompt |
| `run-tests` | Run unit tests |
| `build-project` | Build the project |
| `typecheck` | Run type checking |
| `lint-fix` | Run linter and formatter |
| `codecheck` | Full code quality check |
| `start-vscode` | Start VS Code Web on port 8080 |
| `start-dev` | Start dev server on port 3000 |
| `git-info` | Show git status, recent commits, current branch |

## File Locations

| Path | Description |
|------|-------------|
| `.claude/commands/sandbox.md` | Slash command definition |
| `.claude/commands/gitmerge.md` | Git merge command definition |
| `.claude/skills/e2b-sandbox/SKILL.md` | Skill documentation |
| `.claude/skills/e2b-sandbox/scripts/sandbox-cli.ts` | Main CLI implementation |
| `.claude/skills/e2b-sandbox/scripts/build-template.ts` | Template builder |
| `packages/e2b/` | TypeScript SDK wrapper |

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Sandbox won't create | Check `E2B_API_KEY` is set |
| Claude Code fails | Verify `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY` |
| Git push fails | Check `GITHUB_TOKEN` has `repo` scope |
| VS Code Web not loading | Wait 10-15s, check port 8080 URL |
| Dev server slow | Compilation takes 10-30s on first load |

### Debugging Commands

```bash
# Check sandbox status
/sandbox list --json

# View changes in sandbox
/sandbox diff <sandbox-id>

# Kill all sandboxes
/sandbox kill-all
```

## Security Considerations

- **Sandboxes are isolated**: No access to local machine
- **Git credentials**: Injected at runtime, not baked into template
- **OAuth tokens**: Short-lived, scoped to repository
- **Sandbox timeout**: Default 300s, max 1800s
- **Network isolation**: Only outbound HTTPS allowed

## Related Documentation

- **Development**: [../development/](../development/) - Feature implementation patterns
- **Docker**: [docker-setup.md](./docker-setup.md) - Local container architecture
- **CI/CD**: [ci-cd-complete.md](./ci-cd-complete.md) - Pipeline integration

---

*Last updated: 2025-11-27*
