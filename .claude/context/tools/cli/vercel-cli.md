
---
id: "vercel-cli"
title: "Vercel CLI Tool Reference"
version: "1.0.0"
category: "tool"
description: "Comprehensive Vercel CLI reference for deployment, environment management, and development workflows in monorepo environments"
tags: ["vercel", "cli", "deployment", "monorepo", "turborepo", "pnpm", "nextjs", "devops"]
dependencies: ["vercel-deployment-guide", "cicd-llm-context"]
cross_references:
  - id: "vercel-deployment-guide"
    type: "related"
    description: "Complete Vercel deployment guide with architecture patterns"
  - id: "project-architecture"
    type: "prerequisite"
    description: "Monorepo structure and build configuration"
created: "2025-09-30"
last_updated: "2025-09-30"
author: "create-context"
---

# Vercel CLI Tool Reference

## Overview

The Vercel CLI is the command-line interface for deploying and managing applications on the Vercel platform. This guide provides comprehensive coverage of CLI commands, workflows, and best practices for the SlideHeroes monorepo environment with Turborepo integration.

## Key Concepts

- **Project Linking**: Connect local directories to Vercel projects
- **Environment Management**: Sync production/preview/development variables
- **Monorepo Support**: Turborepo automatic detection and optimized builds
- **Deployment Targets**: Preview, staging, and production environments
- **System Variables**: Auto-injected environment metadata

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

### Project Management

```bash
# Create new project
vercel project add

# Initialize from template
vercel init
vercel init <example>
vercel init <example> <name>

# View project info
vercel project ls
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

### turbo.json Configuration

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "env": ["NEXT_PUBLIC_*"],
      "outputs": [
        ".next/**",
        "!.next/cache/**",
        ".vercel/**",
        ".vercel/output/**"
      ]
    },
    "web#build": {
      "dependsOn": ["^build"],
      "env": ["DATABASE_URL", "SUPABASE_*"],
      "outputs": [".next/**", "!.next/cache/**"]
    }
  },
  "globalEnv": ["VERCEL_*"],
  "globalDependencies": ["tsconfig.json"]
}
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
    "commandForIgnoringBuildStep": "bash scripts/ignore-build-step.sh"
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

## CI/CD Integration

### GitHub Actions Pattern

```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main, staging, dev]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Vercel CLI
        run: npm install -g vercel@latest

      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=${{ inputs.environment }} --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Deploy
        run: vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }} --yes
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

### SlideHeroes Custom Action

The project uses a reusable action at `.github/actions/vercel-deploy/action.yml`:

```yaml
- name: Deploy to Vercel
  uses: ./.github/actions/vercel-deploy
  with:
    token: ${{ secrets.VERCEL_TOKEN }}
    org-id: ${{ secrets.VERCEL_ORG_ID }}
    project-id: ${{ secrets.VERCEL_PROJECT_ID }}
    environment: production
    health-check-url: /api/health
    protection-bypass-secret: ${{ secrets.VERCEL_PROTECTION_BYPASS }}
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

### Turborepo Cache Issues

```bash
# Bypass Turborepo remote cache
TURBO_FORCE=true vercel deploy
```

## SlideHeroes-Specific Patterns

### Monorepo Structure

```
/
├── apps/
│   ├── web/               # Main Next.js app
│   │   └── vercel.json    # App-specific config
│   └── payload/           # Payload CMS
│       └── vercel.json
├── .vercel/               # Project link metadata
│   └── project.json
├── vercel.json            # Root config
└── turbo.json             # Turborepo config
```

### Deployment Strategy

- **main** branch → Production (`slideheroes.com`)
- **staging** branch → Staging environment
- **dev** branch → Dev environment (`dev.slideheroes.com`)
- **feature branches** → Preview deployments

### Build Optimization

The project uses `scripts/ignore-build-step.sh` to skip builds for:
- Documentation-only changes (`*.md`, `docs/`)
- CI/CD configuration changes (`.github/`)
- Claude AI files (`.claude/`)
- Scripts that don't affect app code

### Health Checks

Post-deployment verification:

```bash
# Health check endpoint
curl https://slideheroes.com/api/health \
  -H "x-vercel-protection-bypass: $SECRET"
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

## Related Files

- `/vercel.json` - Root Vercel configuration
- `/apps/web/vercel.json` - Web app configuration
- `/turbo.json` - Turborepo build configuration
- `/.github/actions/vercel-deploy/action.yml` - Reusable deployment action
- `/scripts/ignore-build-step.sh` - Build optimization script

## See Also

- [[vercel-deployment-guide]] - Complete deployment architecture
- [[cicd-llm-context]] - CI/CD pipeline patterns
- [[project-architecture]] - Monorepo structure
