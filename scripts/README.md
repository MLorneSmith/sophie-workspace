# SlideHeroes Scripts

Utility scripts for the SlideHeroes application, organized by purpose.

## Directory Structure

```
scripts/
├── ci/               # CI/CD and deployment scripts
├── dev/              # Development utilities
├── git/              # Git hooks and quality checks
├── monitoring/       # Monitoring and diagnostics
├── setup/            # Environment setup scripts
├── testing/          # Test utilities and helpers
├── package.json      # Script dependencies
├── postinstall.js    # Post-install hook (empty)
└── tsconfig.json     # TypeScript config for scripts
```

## Scripts by Category

### CI/CD (`ci/`)

**collect-ci-metrics.js**

- Collects and sends CI/CD metrics to New Relic
- Used in: `pnpm ci-metrics:collect`
- Environment: Requires `NEW_RELIC_ACCOUNT_ID` and `NEW_RELIC_INSERT_KEY`

**ignore-build-step.sh**

- Determines whether to skip Vercel builds based on file changes
- Used in: Vercel build configuration
- Skips builds for: docs, scripts, .github changes only

### Development (`dev/`)

**find-console-logs.sh**

- Finds all TypeScript/JavaScript files containing console statements
- Usage: `./scripts/dev/find-console-logs.sh`
- Output: `console-files.txt` with list of files

### Git (`git/`)

**trufflehog-scan.sh**

- Pre-commit security scanner that detects secrets
- Used in: `lint-staged` (automatic on commit)
- Auto-installs TruffleHog if not present
- Scans staged files for API keys, tokens, passwords

**type-check-staged.sh**

- Type-checks staged TypeScript files using project context
- Used in: `lint-staged` (automatic on commit)
- Smart routing to correct tsconfig per package

### Monitoring (`monitoring/`)

**monitor-resources.sh**

- WSL2 resource monitoring script for Issue #563
- Interactive monitoring of memory, CPU, processes, disk usage
- Usage: `./scripts/monitoring/monitor-resources.sh`
- Press Ctrl+C to stop, logs to `/tmp/wsl-resource-monitor.log`

**newrelic-dashboard-config.json**

- New Relic dashboard configuration
- Used by: CI metrics collection

### Setup (`setup/`)

**quick-wsl-setup.sh**

- Fast WSL development environment setup
- One-command setup for new WSL environments

**setup-dev-env.sh**

- Complete WSL development environment setup
- Sets up git, installs dependencies, configures Supabase

**setup-git-env.sh**

- Git configuration for WSL
- Called by `setup-dev-env.sh`

**setup-turbo-cache.sh**

- Interactive Turbo Remote Cache setup for Vercel
- Guides through authentication and token creation
- One-time setup per developer

**setup-vercel-environments.sh**

- Sets up Vercel environment variables for all environments
- Usage: `./scripts/setup/setup-vercel-environments.sh`
- One-time setup per project

**create-vercel-environments.sh**

- Creates Vercel deployment environments
- One-time setup per project

### Testing (`testing/`)

**load-test-env.ts**

- Loads test environment variables from `.env.test`
- Imported by: Test scripts
- Validates required test environment variables

**test-certificate-generation.ts**

- Tests certificate generation functionality
- Sets up test user with completed lessons
- Verifies certificate creation
- Usage: `tsx scripts/testing/test-certificate-generation.ts`

**update-test-user-progress.ts**

- Updates course progress for <test2@slideheroes.com>
- Marks all lessons as complete except 801, 802
- Usage: `tsx scripts/testing/update-test-user-progress.ts`
- Useful for testing certificate generation

## Common Usage Patterns

### First-Time Setup (WSL)

```bash
# Quick setup
./scripts/setup/quick-wsl-setup.sh

# Or comprehensive setup
./scripts/setup/setup-dev-env.sh
```

### Testing Certificate Generation

```bash
# 1. Update test user progress
tsx scripts/testing/update-test-user-progress.ts

# 2. Test certificate generation
tsx scripts/testing/test-certificate-generation.ts
```

### Monitoring WSL Resources

```bash
# Start interactive monitoring
./scripts/monitoring/monitor-resources.sh

# View log file
tail -f /tmp/wsl-resource-monitor.log
```

### Finding Console Statements

```bash
# Find all files with console statements
./scripts/dev/find-console-logs.sh

# View results
cat console-files.txt
```

## Prerequisites

### Required Tools

- **Node.js 18+** - For all JavaScript/TypeScript scripts
- **pnpm** - Package manager
- **git** - Version control
- **bash** - Shell scripts

### Optional Tools

- **TruffleHog** - Auto-installed by `trufflehog-scan.sh`
- **tsx** - For running TypeScript scripts directly

## Environment Variables

### CI Metrics (`.env.test`)

```bash
NEW_RELIC_ACCOUNT_ID=your_account_id
NEW_RELIC_INSERT_KEY=your_insert_key
```

### Test Scripts (`.env.test`)

```bash
TEST_SUPABASE_URL=http://localhost:54321
TEST_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
TEST_PDF_CO_API_KEY=your_pdfco_key
TEST_USER_EMAIL=test2@slideheroes.com
TEST_PAYLOAD_URL=http://localhost:3000
```

## Maintenance

### Script Organization Rules

1. **CI/CD scripts** → `ci/` - Anything related to builds, deployments, metrics
2. **Development utilities** → `dev/` - Tools for developers during coding
3. **Git hooks** → `git/` - Pre-commit checks, linting, security
4. **Monitoring** → `monitoring/` - Diagnostics and observability
5. **Setup** → `setup/` - One-time or environment setup scripts
6. **Testing** → `testing/` - Test utilities and helpers

### Adding New Scripts

1. Choose appropriate directory based on purpose
2. Make scripts executable: `chmod +x script-name.sh`
3. Add documentation to this README
4. Update package.json if script needs npm/pnpm command

### Removed Scripts (2024-11-13)

The following categories of scripts were removed during cleanup:

- **PowerShell scripts** (8 files) - Project uses WSL/Linux only
- **Migration scripts** (4 files) - Completed migrations (logger, imports)
- **One-time setup** (4 files) - Completed setups (branch protection, labels)
- **MCP Docker scripts** (3 files) - Incomplete implementation
- **Database reset scripts** (9 files) - Replaced by Supabase CLI
- **test-rollback.sh** - No longer used

## Troubleshooting

### TruffleHog scan failing

```bash
# Check TruffleHog installation
which trufflehog

# Reinstall if needed
curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | sh -s -- -b $HOME/.local/bin
```

### Type-check failing on staged files

```bash
# Check TypeScript configuration
pnpm typecheck

# Run type-check manually
./scripts/git/type-check-staged.sh path/to/file.ts
```

### Test scripts can't find environment

```bash
# Create .env.test file
cp apps/web/.env.example .env.test

# Edit with test values
nano .env.test
```

## Related Documentation

- [CLAUDE.md](/CLAUDE.md) - Project development guidelines
- [WSL Setup Guide](/docs/development/wsl-setup.md) - Detailed WSL configuration
- [CI/CD Documentation](/.github/workflows/README.md) - GitHub Actions setup
