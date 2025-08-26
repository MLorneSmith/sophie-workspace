# CI/CD Pipeline Context

## Overview
SlideHeroes uses a comprehensive GitOps-based CI/CD pipeline built on GitHub Actions and Vercel, designed for a multi-environment deployment strategy with automated testing, validation, and monitoring.

## Branch Strategy & Environments

### Branch Flow
- **`main`** → Production (`slideheroes.com`) - Production-ready code, protected branch
- **`staging`** → Staging (`staging.slideheroes.com`) - Pre-production testing, integration validation  
- **`dev`** → Development (`dev.slideheroes.com`) - Development integration, feature testing
- **Feature branches** → Development PRs (`feature/xyz`)
- **Hotfix branches** → Emergency production fixes (`hotfix/xyz`)

### Current Branch: `dev`
Working on active development with continuous deployment to dev environment.

## Key Workflows

### 1. PR Validation (`.github/workflows/pr-validation.yml`)
**Triggers**: PRs to `main`, `staging`, or `dev`
**Jobs**: Change detection, lint/format (Biome), TypeScript check, unit tests (Vitest), YAML/Markdown lint
**Requirements**: All jobs must pass for merge

### 2. Development Deploy (`.github/workflows/dev-deploy.yml`)
**Triggers**: Push to `dev` branch
**Flow**: PR validation → Vercel dev deploy → smoke tests → monitoring notifications

### 3. Staging Deploy (`.github/workflows/staging-deploy.yml`)
**Triggers**: Push to `staging` branch  
**Flow**: PR validation → E2E tests → Vercel staging deploy → smoke tests → performance tests

### 4. Production Deploy (`.github/workflows/production-deploy.yml`)
**Triggers**: Push to `main` branch
**Flow**: Security checks → Vercel production deploy → health checks → monitoring → auto-rollback on failure

## Technology Stack

### Build & Deploy
- **GitHub Actions**: Workflow orchestration
- **Vercel**: Hosting and deployment platform
- **Turbo**: Build system optimization with caching
- **pnpm**: Package management with workspaces

### Testing
- **Vitest**: Unit testing framework
- **Playwright**: End-to-end testing (E2E)
- **Biome**: Linting and formatting
- **axe-core**: Accessibility testing

### Monitoring
- **New Relic**: Application performance monitoring
- **Vercel Analytics**: Deployment and performance metrics
- **GitHub Deployments API**: Deployment status tracking

## Performance Optimizations

### Caching Strategy
- **pnpm Store**: Dependency caching across workflow runs
- **Turbo Cache**: Build output caching with remote cache
- **Playwright Browsers**: Browser binary caching
- **Node Modules**: Workspace dependency caching

### Change Detection
The pipeline uses intelligent change detection to skip unnecessary jobs based on which files changed, optimizing CI runtime.

## Environment Variables & Secrets

### Required Secrets
```bash
# Vercel
VERCEL_TOKEN
VERCEL_ORG_ID  
VERCEL_PROJECT_ID

# Database
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_WEBHOOK_SECRET

# Payments
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET

# Build Optimization
TURBO_TOKEN

# Monitoring
NEW_RELIC_API_KEY
NEW_RELIC_APP_ID
```

### Feature Flags
```bash
ENABLE_E2E_JOB=true
ENABLE_BILLING_TESTS=true
```

## Local Development Commands

```bash
# Development
pnpm dev                    # Start dev servers
pnpm test                   # Run unit tests
pnpm typecheck              # TypeScript checking
pnpm lint                   # Linting and formatting
pnpm lint:fix               # Auto-fix lint issues

# Database
pnpm supabase:web:start     # Start local Supabase
pnpm supabase:web:stop      # Stop local Supabase
pnpm supabase:web:reset     # Reset local database

# E2E Testing
pnpm --filter e2e test      # Run E2E tests
```

## Key Integration Points

### Database Migrations
- Supabase migrations in `apps/web/supabase/migrations/`
- Payload CMS migrations in `apps/payload/src/migrations/`
- Database reset procedures in `scripts/database-reset/`

### Monorepo Structure
- **apps/web**: Next.js main application
- **apps/payload**: Payload CMS application  
- **apps/e2e**: Playwright E2E tests
- **packages/**: Shared packages and utilities

## Deployment Status
- Currently on `dev` branch with active development
- Recent commits include bundle size monitoring and security vulnerability fixes
- CI/CD documentation recently updated and comprehensive

## Troubleshooting
- Use `docs/cicd/troubleshooting.md` for common CI/CD issues
- Check GitHub Actions logs for detailed failure information
- Vercel deployment logs available in Vercel dashboard
- New Relic alerts for production issues