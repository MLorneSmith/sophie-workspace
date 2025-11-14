# CLI Tools and Commands Reference

**Purpose**: Overview and index of all command-line tools used in the SlideHeroes project. For detailed documentation on specific tools, see the dedicated CLI reference files.

**Related Files**:
- `.claude/docs/tools/supabase-cli.md` - Supabase CLI complete reference
- `.claude/docs/tools/vercel-cli.md` - Vercel CLI complete reference
- `/package.json` - Root package scripts
- `/apps/web/package.json` - Web app scripts
- `/turbo.json` - Turbo configuration

## Overview

The SlideHeroes project leverages multiple CLI tools for development, deployment, and database management:

1. **Supabase CLI** - Local development, migrations, and database management ([detailed reference](.claude/docs/tools/supabase-cli.md))
2. **Vercel CLI** - Deployment and environment management ([detailed reference](.claude/docs/tools/vercel-cli.md))
3. **Project CLI Tools** - Custom scripts and pnpm workspace commands (documented below)

## Quick Reference

### Supabase CLI

Essential commands for database management:

```bash
# Start/stop services
pnpm supabase:start
pnpm supabase:stop
pnpm supabase:reset

# Migrations
pnpm supabase:db:diff
pnpm --filter web supabase migration up

# Type generation
pnpm supabase:typegen
```

**See** [supabase-cli.md](.claude/docs/tools/supabase-cli.md) for complete documentation.

### Vercel CLI

Essential commands for deployment:

```bash
# Environment variables
vercel env pull
vercel env pull --environment=production

# Deployment
vercel deploy          # Preview
vercel --prod          # Production

# Debugging
vercel logs [url]
vercel inspect [url] --logs
```

**See** [vercel-cli.md](.claude/docs/tools/vercel-cli.md) for complete documentation.

## Project CLI Tools

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

### Workspace Commands

```bash
# Run command in specific workspace
pnpm --filter <workspace> <command>

# Examples
pnpm --filter web dev
pnpm --filter web test:unit
pnpm --filter web supabase:reset
```

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

### Code Quality Tools

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

### Custom Scripts

Located in `.claude/scripts/`:

| Script | Purpose |
|--------|---------|
| `codecheck-direct.sh` | Direct code quality checks |
| `cleanup-ports.sh` | Clean test ports |
| `token-counter.cjs` | Count tokens in files |
| `inventories/sync-context-inventory.cjs` | Sync context documentation |

### Pre-approved Commands

These commands execute without user approval:

#### Git Operations

- `git status --porcelain`
- `git log --oneline -10`
- `git diff --name-only`
- `git branch --show-current`

#### Testing & Development

- `pnpm --filter web test:*`
- `pnpm test:unit`
- `pnpm test:e2e`
- `.claude/scripts/codecheck-direct.sh`

#### Process Management

- `pkill -f "playwright|vitest|next-server"`
- `lsof -ti:3000-3020`

### Utility Commands

| Category | Commands |
|----------|----------|
| **Environment** | `pnpm env:generate`, `pnpm env:validate` |
| **Stripe** | `pnpm stripe:listen` |
| **Payload CMS** | `pnpm payload:migrate:production` |
| **CI Metrics** | `pnpm ci-metrics:collect` |
| **Process** | `npx cross-env NODE_ENV=test <cmd>` |
| **Documentation** | `npx next-sitemap`, `npx codebase-map` |

## Best Practices

### Workflow Efficiency

1. **Use workspace commands** - Target specific packages with `--filter`
2. **Leverage Turborepo** - Automatic task orchestration and caching
3. **Pre-commit hooks** - Automatically enforced via Husky
4. **Parallel execution** - Use test shards for CI optimization

### Command Organization

1. **Check before deploy** - Run `pnpm codecheck` before commits
2. **Reset frequently** - Use `supabase db reset` for clean state
3. **Pull env vars** - Always `vercel env pull` before local dev
4. **Monitor builds** - Use `--debug` and `--logs` flags

### Performance Optimization

1. **Bundle analysis** - Regular `pnpm analyze` runs
2. **Type checking** - Frequent `pnpm typecheck` during development
3. **Cache management** - Clear with `pnpm clean` when needed
4. **Test sharding** - Parallel E2E test execution in CI

## Related Files

- `/package.json` - Root package scripts
- `/apps/web/package.json` - Web app scripts
- `/turbo.json` - Turbo configuration
- `/.claude/scripts/` - Custom Claude scripts
- `/.husky/` - Git hooks configuration
- `/apps/web/supabase/` - Supabase migrations and config
- `/vercel.json` - Vercel deployment configuration

## See Also

- **Database Operations**: `.claude/docs/database/` - Database patterns and RLS
- **CI/CD Workflows**: `.github/workflows/` - Automated deployment pipelines
- **Testing Strategies**: `.claude/docs/testing/` - Comprehensive testing guides
- **Monorepo Structure**: `CLAUDE.md` - Project architecture overview
