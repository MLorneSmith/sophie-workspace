# Vercel CLI Reference

**Purpose**: Comprehensive reference for Vercel CLI commands, deployment workflows, and monorepo configuration for the SlideHeroes project.

**Related Files**:
- `.claude/docs/tools/cli-references.md` - CLI tools overview
- `.claude/docs/tools/supabase-cli.md` - Supabase CLI reference
- `/vercel.json` - Vercel deployment configuration
- `.github/workflows/` - CI/CD deployment pipelines

## Installation

```bash
# pnpm (recommended for monorepos)
pnpm i -g vercel@latest

# npm
npm i -g vercel@latest

# Verify installation
vercel --version
```

## Authentication

```bash
# Login to Vercel
vercel login

# Verify current user
vercel whoami

# Logout
vercel logout
```

## Core Commands

### Project Linking

```bash
# Link current directory to Vercel project
vercel link

# Link all projects in monorepo (requires Git integration)
vercel link --repo

# Re-link project
rm -rf .vercel && vercel link

# Link with automatic yes
vercel link --yes
```

**SlideHeroes Usage**:

```bash
# From monorepo root
cd /home/msmith/projects/2025slideheroes
vercel link --repo
```

### Development

```bash
# Start local development server (automatically loads env vars)
vercel dev

# Development server with specific port
vercel dev --listen 3001

# Build project locally
vercel build
```

### Deployment

```bash
# Deploy to preview environment (default)
vercel
vercel deploy

# Deploy to production
vercel --prod
vercel deploy --prod

# Deploy to staging
vercel deploy --target=staging

# Deploy with automatic yes
vercel --yes

# Deploy without waiting for completion
vercel --no-wait

# Deploy without build cache
vercel --force

# Deploy with build logs
vercel deploy --logs

# Deploy prebuilt project
vercel deploy --prebuilt
```

**SlideHeroes CI/CD Pattern**:

```bash
# Production deployment
VERCEL_ORG_ID=$ORG_ID VERCEL_PROJECT_ID=$PROJ_ID vercel --prod --token=$TOKEN --yes

# Preview deployment for dev branch
vercel deploy --token=$TOKEN --yes
```

### Environment Variables

```bash
# Pull environment variables to .env.local
vercel env pull

# Pull for specific environment
vercel env pull --environment=production
vercel env pull --environment=preview
vercel env pull --environment=staging

# Pull for specific Git branch
vercel env pull --environment=preview --git-branch=feature-branch

# Add environment variable
vercel env add MY_KEY production
vercel env add <VARIABLE_NAME> <VALUE> <ENVIRONMENT>

# List environment variables
vercel env ls

# Remove environment variable
vercel env rm MY_KEY production
```

**SlideHeroes Workflow**:

```bash
# Pull production variables for local development
vercel env pull --environment=production

# Verify variables loaded
cat .env.local
```

### Deployment Management

```bash
# List deployments
vercel list
vercel list [project-name]
vercel list --environment=staging

# Inspect deployment
vercel inspect [deployment-id or url]
vercel inspect [deployment-url] --logs
vercel inspect [deployment-url] --wait

# Remove deployments
vercel remove [deployment-url]
vercel remove [deployment-url-1 deployment-url-2]

# Promote deployment to production
vercel promote [deployment-id or url]
```

### Domain Management

```bash
# Add custom domain
vercel domains add example.com

# Set domain alias
vercel alias set [deployment-url] [custom-domain]

# Remove domain alias
vercel alias rm [custom-domain]

# List domains
vercel domains ls
```

**SlideHeroes Configuration**:

```bash
# Main app: slideheroes.com
# Dev branch: dev.slideheroes.com (auto-assigned in CI/CD)
vercel alias set [deployment-url] dev.slideheroes.com
```

### Logs & Debugging

```bash
# View runtime logs
vercel logs [deployment-url | deployment-id]

# Output logs as JSON
vercel logs [deployment-url] --json

# Filter logs with jq
vercel logs [deployment-url] --json | jq 'select(.level == "warning")'

# Enable debug output
vercel --debug
vercel -d
```

## Monorepo Configuration

### Turborepo Detection

Vercel automatically detects Turborepo and uses optimized build commands:

```bash
# General build command
turbo run build

# Filtered build for specific app
cd ../.. && turbo run build --filter=web
```

### SlideHeroes vercel.json

**Root Configuration** (`/vercel.json`):

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd apps/web && pnpm build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs",
  "functions": {
    "apps/web/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "preview": {
    "commandForIgnoringBuildStep": "bash scripts/ci/ignore-build-step.sh"
  }
}
```

**App Configuration** (`/apps/web/vercel.json`):

```json
{
  "buildCommand": "pnpm turbo run build --filter=web",
  "devCommand": "pnpm turbo run dev --filter=web",
  "installCommand": "pnpm install",
  "outputDirectory": ".next"
}
```

### Skip Turborepo Cache

```bash
# Bypass remote cache
TURBO_FORCE=true vercel deploy
```

## System Environment Variables

Vercel automatically injects these variables:

```bash
# Platform identification
VERCEL=1
CI=1
VERCEL_ENV=production|preview|development

# Deployment URLs
VERCEL_URL=project-name.vercel.app
VERCEL_BRANCH_URL=branch-name-project.vercel.app
VERCEL_DEPLOYMENT_ID=dpl_xyz123

# Automation
VERCEL_AUTOMATION_BYPASS_SECRET=[secret]

# Git metadata
VERCEL_GIT_COMMIT_SHA=abc123
VERCEL_GIT_COMMIT_REF=main
VERCEL_GIT_COMMIT_MESSAGE="commit message"
VERCEL_GIT_COMMIT_AUTHOR_LOGIN=username
VERCEL_GIT_COMMIT_AUTHOR_NAME="Full Name"
VERCEL_GIT_PULL_REQUEST_ID=23
VERCEL_GIT_PREVIOUS_SHA=def456

# Project identifiers
VERCEL_ORG_ID=team_123
VERCEL_PROJECT_ID=prj_456
```

## Common Workflows

### Local Development Setup

```bash
# 1. Install Vercel CLI
pnpm i -g vercel@latest

# 2. Link to project
vercel link

# 3. Pull environment variables
vercel env pull

# 4. Start development server
vercel dev
```

### Preview Deployment

```bash
# Deploy preview
vercel

# Deploy preview for specific branch
git checkout feature-branch
vercel deploy
```

### Production Deployment

```bash
# Deploy to production
vercel --prod

# Or staged deployment (no domain assignment)
vercel --prod --skip-domain
vercel promote [deployment-id]
```

### Environment Sync

```bash
# Pull latest production variables
vercel env pull --environment=production

# Add new variable
vercel env add NEW_KEY production

# Deploy with updated env
vercel --prod
```

## Troubleshooting

### Build Failures

```bash
# Force rebuild without cache
vercel --force

# Enable debug mode
vercel --debug

# View detailed build logs
vercel inspect [deployment-url] --logs

# Generate system report
VERCEL_BUILD_SYSTEM_REPORT=1 vercel deploy
```

### Environment Variable Issues

```bash
# Pull latest variables
vercel env pull

# Verify variables loaded
cat .env.local

# Check production values
vercel env ls production
```

### Project Linking Issues

```bash
# Re-link project
rm -rf .vercel
vercel link

# Link with automatic yes
vercel link --yes

# For monorepos
vercel link --repo
```

### Region Configuration

```bash
# Correct format (comma-separated, lowercase)
vercel --regions sfo,bru,gru

# NOT: vercel --regions SFO BRU GRU (uppercase fails)
```

### Package Manager Issues

Specify package manager in `package.json`:

```json
{
  "packageManager": "pnpm@8.15.0",
  "engines": {
    "pnpm": "^8.15.0"
  }
}
```

## Best Practices

1. **Use `vercel env pull`** before local development
2. **Always use `--yes` flag** in CI/CD for non-interactive mode
3. **Enable debug mode** (`--debug`) for troubleshooting
4. **Use system variables** (VERCEL_*) for environment detection
5. **Specify package manager** in package.json for consistency
6. **Use `--force` flag** sparingly (bypasses cache, slower builds)
7. **Monitor build logs** with `vercel inspect --logs`
8. **Use protection bypass** for automated health checks

## Related Documentation

- **Supabase CLI**: `.claude/docs/tools/supabase-cli.md` - Database and migration management
- **CI/CD Workflows**: `.github/workflows/` - Automated deployment pipelines
- **Monorepo Structure**: `CLAUDE.md` - Project architecture overview
- **Environment Setup**: `/apps/web/.env.example` - Environment variable templates
