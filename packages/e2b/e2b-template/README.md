# E2B Sandbox Template

E2B sandbox template (`slideheroes-claude-agent`) for running Claude Code agents in isolated cloud environments.

## Single Source of Truth

**`template.ts`** is the canonical template definition. All build scripts import from this file.

## Features

- **Runtime**: Node.js 20, pnpm 10.14.0
- **Tools**: Claude Code CLI, Supabase CLI, Turbo CLI
- **Code Review**: VS Code Web (code-server) on port 8080
- **Git Operations**: GitHub CLI (gh) for PR automation
- **Testing**: Playwright with Chromium for E2E tests
- **Project**: Pre-cloned repository with dependencies installed

## Building the Template

From the monorepo root:

```bash
# Development template (slideheroes-claude-agent-dev)
pnpm e2b:build:dev

# Production template (slideheroes-claude-agent)
pnpm e2b:build:prod
```

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `E2B_API_KEY` | E2B API key from <https://e2b.dev/dashboard> |
| `GITHUB_TOKEN` | GitHub token with `repo` scope for private repo cloning |

## Using the Template

### Via SDK

```typescript
import { Sandbox } from 'e2b'

const sandbox = await Sandbox.create('slideheroes-claude-agent')
```

### Via CLI

```bash
/sandbox create                    # Create sandbox
/sandbox run-claude "/test 1"      # Run Claude command
/sandbox exec <id> "git status"    # Execute command
/sandbox kill <id>                 # Terminate sandbox
```

## Files

| File | Purpose |
|------|---------|
| `template.ts` | **Canonical template definition** - all features defined here |
| `build.dev.ts` | Development build script (imports from template.ts) |
| `build.prod.ts` | Production build script (imports from template.ts) |

## Template Architecture

```text
template.ts exports:
├── template           # Default template with repo cloning
├── createTemplate()   # Factory function (cloneRepo: boolean)
├── TEMPLATE_ALIAS     # "slideheroes-claude-agent"
├── DEV_TEMPLATE_ALIAS # "slideheroes-claude-agent-dev"
├── WORKSPACE_DIR      # "/home/user/project"
└── REPO_BRANCH        # "dev"
```

## Helper Scripts (Available in Sandbox)

| Script | Description |
|--------|-------------|
| `run-claude` | Run Claude Code with a prompt or slash command |
| `run-tests` | Run unit tests (`pnpm test:unit`) |
| `build-project` | Build the project (`pnpm build`) |
| `typecheck` | Run TypeScript type checking |
| `lint-fix` | Run linter and formatter |
| `codecheck` | Run full code quality check |
| `git-info` | Show git status, recent commits, and current branch |
| `start-vscode` | Start VS Code Web on port 8080 |
| `start-dev` | Start dev server on port 3000 |

## Documentation

See `.ai/ai_docs/context-docs/infrastructure/e2b-sandbox.md` for full documentation.
