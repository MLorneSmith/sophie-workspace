---
id: "cli-tools"
title: "CLI Tools and Utilities"
version: "1.1.0"
category: "reference"

description: "Comprehensive reference of all CLI tools, commands, and utilities available in the SlideHeroes project"
tags: ["cli", "tools", "commands", "npm-scripts", "development", "testing", "build", "utilities"]

dependencies: []
cross_references:
  - id: "testing-strategies"
    type: "related"
    description: "Testing commands and strategies"
  - id: "development-workflow"
    type: "related"
    description: "Development workflow and processes"

created: "2025-09-15"
last_updated: "2025-09-15"
author: "create-context"
---

# CLI Tools and Utilities

## Overview

Comprehensive reference of CLI tools and commands in the SlideHeroes project. Uses pnpm workspaces for monorepo management with Turbo for optimized builds.

## Core Commands

### Development & Build

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start all dev servers in parallel |
| `pnpm build` | Build production bundles |
| `pnpm start` | Start production server |
| `pnpm clean` | Clean all build artifacts |
| `pnpm analyze` | Analyze bundle size |

### Code Quality

| Command | Purpose |
|---------|---------|
| `pnpm lint` | Run all linters (Biome, YAML, Markdown) |
| `pnpm lint:fix` | Fix all linting issues |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm format` | Check formatting |
| `pnpm format:fix` | Fix formatting issues |
| `pnpm codecheck` | Combined typecheck + lint + format |

### Testing

| Command | Purpose |
|---------|---------|
| `pnpm test` | Run all tests except E2E |
| `pnpm test:unit` | Unit tests only |
| `pnpm test:coverage` | Tests with coverage report |
| `pnpm test:e2e` | Run E2E Playwright tests |
| `pnpm a11y:test` | Accessibility testing |

**Note:** Test shards (test:shard1-7) and test groups available for parallel CI execution.

### Database (Supabase)

| Command | Purpose |
|---------|---------|
| `pnpm supabase:web:start` | Start local Supabase |
| `pnpm supabase:web:stop` | Stop Supabase |
| `pnpm supabase:web:reset` | Reset database |
| `pnpm supabase:web:typegen` | Generate TypeScript types |
| `npx supabase db push` | Push migrations to remote |
| `npx supabase db diff` | Generate migration |

## Feature Development (CCPM)

| Command | Purpose |
|---------|---------|
| `/feature:spec <name>` | Create feature specification |
| `/feature:plan <name>` | Technical implementation plan |
| `/feature:decompose <name>` | Break into tasks |
| `/feature:sync <name>` | Push to GitHub issues |
| `/feature:start <name>` | Launch parallel agents |
| `/feature:status <name>` | Check progress |

## CLI Tools Reference

### Package & Dependency Management

| Tool | Common Commands |
|------|----------------|
| **pnpm** | `install`, `add`, `update`, `--filter <workspace>` |
| **manypkg** | `pnpm manypkg:check`, `pnpm manypkg:fix` |
| **syncpack** | `pnpm syncpack:list`, `pnpm syncpack:fix` |
| **knip** | `pnpm knip` (find unused), `pnpm knip:fix` |

### Build Tools

| Tool | Common Commands |
|------|----------------|
| **turbo** | `npx turbo build`, `npx turbo test`, `npx turbo clean` |
| **next** | `npx next dev`, `npx next build`, `npx next start` |
| **vite** | `npx vite`, `npx vite build`, `npx vite preview` |
| **tsx** | `npx tsx <file.ts>` (execute TypeScript directly) |

### Testing Tools

| Tool | Common Commands |
|------|----------------|
| **playwright** | `npx playwright test`, `npx playwright codegen`, `npx playwright show-report` |
| **vitest** | `npx vitest`, `npx vitest watch`, `npx vitest coverage` |
| **lighthouse** | `npx lighthouse <url>` (performance audit) |

### Code Quality

| Tool | Common Commands |
|------|----------------|
| **biome** | `npx biome check`, `npx biome format --write`, `npx biome lint --write` |
| **markdownlint** | `npx markdownlint-cli2` |
| **yamllint** | `npx yamllint` |
| **commitlint** | `npx commitlint` |

### Git & Version Control

| Tool | Common Commands |
|------|----------------|
| **husky** | `pnpm prepare` (install hooks), `npx husky add <hook>` |
| **commitizen** | `pnpm commit`, `npx cz` |
| **gh** | `gh pr create`, `gh issue create`, `gh workflow run` |
| **trufflehog** | `trufflehog filesystem .` (scan for secrets) |

## Custom Claude Tools

### Scripts (`.claude/scripts/`)

| Script | Purpose |
|--------|---------|
| `codecheck-direct.sh` | Direct code quality checks |
| `cleanup-ports.sh` | Clean test ports |
| `token-counter.cjs` | Count tokens in files |
| `inventories/sync-context-inventory.cjs` | Sync context documentation |

### Commands (`.claude/commands/`)

| Command | Purpose |
|---------|---------|
| `/codecheck` | Run code quality checks |
| `/test` | Comprehensive testing |
| `/debug-issue` | Debug issues |
| `/log-issue` | Log to tracking system |
| `/create-context` | Create context file |

## Pre-approved Commands

These commands execute without user approval:

### Git Operations
- `git status --porcelain`
- `git log --oneline -10`
- `git diff --name-only`
- `git branch --show-current`

### Testing & Development
- `pnpm --filter web test:*`
- `pnpm test:unit`
- `pnpm test:e2e`
- `.claude/scripts/codecheck-direct.sh`

### Process Management
- `pkill -f "playwright|vitest|next-server"`
- `lsof -ti:3000-3020`

## Utility Commands

| Category | Commands |
|----------|----------|
| **Environment** | `pnpm env:generate`, `pnpm env:validate` |
| **Stripe** | `pnpm stripe:listen` |
| **Payload CMS** | `pnpm payload:migrate:production` |
| **CI Metrics** | `pnpm ci-metrics:collect` |
| **Process** | `npx cross-env NODE_ENV=test <cmd>` |
| **Documentation** | `npx next-sitemap`, `npx codebase-map` |

## Docker & MCP Servers

| Type | Commands |
|------|----------|
| **Docker** | `docker-compose up`, `docker-compose down` |
| **MCP Servers** | Located in `.mcp-servers/` (docs-mcp, newrelic-mcp) |

## Tips & Best Practices

1. **Workspace commands**: Use `pnpm --filter <workspace> <command>`
2. **Parallel execution**: Most Turbo commands support `--parallel`
3. **Test sharding**: Use for parallel CI execution (test:shard1-7)
4. **Pre-commit hooks**: Automatically run via Husky
5. **Wrapper scripts**: Check `.claude/statusline/` for enhanced output

## Related Files

- `/package.json` - Root package scripts
- `/apps/web/package.json` - Web app scripts
- `/turbo.json` - Turbo configuration
- `/.claude/scripts/` - Custom Claude scripts
- `/.husky/` - Git hooks configuration