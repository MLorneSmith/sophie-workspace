# Makerkit Validation Scripts

This directory contains Makerkit framework validation and security scripts that run automatically during development to ensure
proper project setup and prevent common issues.

## Scripts Overview

### requirements.mjs

**Purpose**: Environment validation

- Validates Node.js version (>= 18.18.0)
- Validates pnpm version (>= 9.12.0)
- Ensures project isn't in OneDrive (causes compatibility issues)

**When it runs**: Automatically on `pnpm install` via preinstall hook

### license.mjs

**Purpose**: Makerkit license validation

- Validates Makerkit license via API using git user credentials
- Checks GitHub repository visibility (must be private)
- Exits with error if repository is accidentally public to prevent license violations

**When it runs**: Part of development workflow checks

### version.mjs

**Purpose**: Makerkit upstream version tracking

- Checks if local codebase is behind Makerkit upstream
- Warns if > 5 commits behind (critical) or > 0 commits (warning)
- Provides instructions to update: `git pull upstream main`
- Calls `migrations.mjs` to check for pending Supabase migrations

**When it runs**: Part of development workflow checks

### migrations.mjs

**Purpose**: Database migration validation

- Checks for unapplied Supabase migrations
- Runs `pnpm --filter web supabase migrations list` to compare local vs remote
- Used by `version.mjs` for database health checks

**When it runs**: Called by version.mjs

### checks.mjs

**Purpose**: Security scanner for environment files

- Scans `.env`, `.env.development`, `.env.production` across all apps
- Detects sensitive keys:
  - Stripe (secret keys, webhook secrets)
  - Supabase (service role keys, webhook secrets)
  - Email passwords
  - Lemon Squeezy keys
  - Keystatic tokens
  - Captcha secrets
- Prevents accidentally committing production secrets
- Has whitelist for test/development values (e.g., `sk_test_*`)

**When it runs**: Should be run before commits (manually or via git hooks)

### dev.mjs

**Purpose**: Development workflow entry point

- Imports and runs version, license, and requirements checks
- Orchestrates all validation checks together

**When it runs**: Via `pnpm --filter scripts dev`

## Usage

### Automatic Execution

```json
// Root package.json
"preinstall": "pnpm run --filter scripts requirements"
```

The `requirements` script runs **before every pnpm install** to validate your environment.

### Manual Execution

```bash
# Run all checks
pnpm --filter scripts dev

# Run individual checks
pnpm --filter scripts checks        # Security scan only
pnpm --filter scripts requirements  # Environment validation only
pnpm --filter scripts license       # License validation only
```

## Script Locations

- Script source: `tooling/scripts/src/*.mjs`
- Package definition: `tooling/scripts/package.json`
- Executed from: Project root via pnpm workspace commands

## Exit Codes

All scripts use standard exit codes:

- `0` - Success, all checks passed
- `1` - Failure, validation or security issue detected

Scripts will display colored console output:

- 🟢 Green - Success messages
- 🟡 Yellow - Warnings
- 🔴 Red - Critical errors

## Notes

- These are **Makerkit framework maintenance tools** for ensuring proper setup
- Offline mode: License checks skip when no internet connection detected
- Whitelist: Test/development credentials are allowed via whitelist patterns
- Repository visibility: Critical for Makerkit license compliance
