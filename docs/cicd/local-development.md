# Local Development Setup

## Overview

This guide provides comprehensive instructions for setting up a local development environment that mirrors the
production CI/CD pipeline, enabling developers to test changes before committing.

## Prerequisites

### Required Software

```bash
# Node.js (LTS version)
node --version  # Should be >= 20.0.0

# pnpm (package manager)
pnpm --version  # Should be >= 9.0.0

# Git
git --version   # Should be >= 2.30.0

# Docker (for local services)
docker --version     # Should be >= 20.0.0
docker-compose --version  # Should be >= 2.0.0
```

### Installation Commands

**macOS (using Homebrew)**:

```bash
# Install Node.js via fnm (Fast Node Manager)
brew install fnm
fnm install 20
fnm use 20

# Install pnpm
npm install -g pnpm

# Install Docker Desktop
brew install --cask docker

# Install Git (if not already installed)
brew install git
```

**Windows (using Chocolatey)**:

```bash
# Install Node.js
choco install nodejs-lts

# Install pnpm
npm install -g pnpm

# Install Docker Desktop
choco install docker-desktop

# Install Git
choco install git
```

**Linux (Ubuntu/Debian)**:

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install Docker
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Install Git
sudo apt-get install git
```

## Repository Setup

### Clone and Initialize

```bash
# Clone the repository
git clone https://github.com/MLorneSmith/2025slideheroes.git
cd 2025slideheroes

# Install dependencies
pnpm install

# Verify installation
pnpm run --help
```

### Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit environment variables
nano .env.local  # or use your preferred editor
```

**Required Environment Variables**:

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:54322/postgres"
SUPABASE_URL="http://localhost:54321"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-key"

# Authentication
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Payments (for testing)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# AI Services (optional for development)
PORTKEY_API_KEY="your-portkey-key"
OPENAI_API_KEY="your-openai-key"
```

## Development Services

### Supabase Local Development

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase (first time only)
supabase init

# Start local Supabase services
pnpm run supabase:web:start

# Services will be available at:
# - API: http://localhost:54321
# - DB: postgresql://postgres:postgres@localhost:54322/postgres
# - Studio: http://localhost:54323
# - Inbucket: http://localhost:54324
```

**Supabase Service Ports**:

- **API Gateway**: 54321
- **PostgreSQL**: 54322
- **Studio (Admin UI)**: 54323
- **Inbucket (Email testing)**: 54324
- **Realtime**: 54325
- **Storage**: 54326

### Database Management

```bash
# Apply migrations
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > lib/database.types.ts

# Seed database with test data
supabase db seed

# View database in browser
open http://localhost:54323
```

### Stripe Local Development

```bash
# Install Stripe CLI
# macOS
brew install stripe/stripe-cli/stripe

# Windows
choco install stripe-cli

# Linux
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_*_linux_x86_64.tar.gz

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/billing/webhook

# Test webhook endpoint
stripe trigger payment_intent.succeeded
```

## Application Development

### Start Development Server

```bash
# Start main application
pnpm dev

# Application will be available at:
# - Web: http://localhost:3000
# - Payload CMS: http://localhost:3001
# - Dev Tools: http://localhost:3002
```

**Port Allocation**:

- **Web App**: 3000
- **Payload CMS**: 3001
- **Dev Tools**: 3002
- **E2E Tests**: 3003

### Development Commands

```bash
# Start all services
pnpm dev

# Start specific workspace
pnpm --filter web dev
pnpm --filter payload dev
pnpm --filter dev-tool dev

# Build applications
pnpm build

# Run tests
pnpm test               # Unit tests
pnpm test:e2e          # End-to-end tests
pnpm test:integration  # Integration tests

# Code quality
pnpm lint              # Lint code
pnpm typecheck         # Type checking
pnpm format            # Format code
```

### Hot Reloading

The development setup includes hot reloading for:

- **Next.js pages and components**
- **TypeScript files**
- **Tailwind CSS styles**
- **Environment variables** (requires restart)

## Testing Locally

### Unit Testing

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage

# Run specific test file
pnpm test Button.test.tsx

# Run tests matching pattern
pnpm test --grep "authentication"
```

**Test Configuration** (vitest.config.ts):

```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'test/', '**/*.d.ts'],
    },
  },
});
```

### End-to-End Testing

```bash
# Start all required services
pnpm run supabase:web:start
stripe listen --forward-to localhost:3000/api/billing/webhook &
pnpm dev &

# Run E2E tests
pnpm test:e2e

# Run E2E tests in headed mode (see browser)
pnpm test:e2e --headed

# Run specific E2E test
pnpm test:e2e auth.spec.ts

# Debug E2E tests
pnpm test:e2e --debug
```

**Playwright Configuration** (playwright.config.ts):

```typescript
export default defineConfig({
  testDir: './apps/e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    port: 3000,
  },
});
```

### Integration Testing

```bash
# Test API endpoints
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'

# Test database operations
psql "postgresql://postgres:postgres@localhost:54322/postgres" \
  -c "SELECT * FROM auth.users LIMIT 5;"

# Test Stripe integration
stripe events list --limit 10
```

## Code Quality Tools

### Linting and Formatting

```bash
# Biome (unified linter and formatter)
pnpm biome check .              # Check all files
pnpm biome format . --write     # Format all files
pnpm biome lint . --apply       # Fix linting issues

# Specific files
pnpm biome check src/components/Button.tsx
```

**Biome Configuration** (biome.json):

```json
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "error"
      }
    }
  }
}
```

### Type Checking

```bash
# TypeScript checking
pnpm typecheck

# Watch mode for continuous checking
pnpm typecheck --watch

# Check specific workspace
pnpm --filter web typecheck
```

### Pre-commit Hooks

```bash
# Install Husky for git hooks
pnpm add -D husky lint-staged

# Setup pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"
```

**Lint-staged Configuration** (package.json):

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "biome format --write",
      "biome lint --apply",
      "git add"
    ],
    "*.{md,json,yml,yaml}": ["biome format --write", "git add"]
  }
}
```

## Local CI/CD Simulation

### Workflow Simulation

```bash
# Simulate PR validation workflow
scripts/simulate-ci.sh pr-validation

# Simulate deployment workflow
scripts/simulate-ci.sh deployment

# Run full CI suite locally
pnpm run ci:full
```

**CI Simulation Script** (scripts/simulate-ci.sh):

```bash
#!/bin/bash
set -e

echo "🔄 Starting CI simulation..."

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Lint and format
echo "🧹 Linting and formatting..."
pnpm biome check .

# Type checking
echo "🔍 Type checking..."
pnpm typecheck

# Unit tests
echo "🧪 Running unit tests..."
pnpm test

# Build application
echo "🏗️ Building application..."
pnpm build

echo "✅ CI simulation completed successfully!"
```

### Performance Testing

```bash
# Lighthouse CI
npm install -g @lhci/cli

# Run Lighthouse locally
lhci autorun --upload.target=temporary-public-storage

# Bundle analysis
pnpm build --analyze
open .next/analyze/index.html
```

### Security Scanning

```bash
# Audit dependencies
pnpm audit

# Scan for secrets
trufflehog git file://. --only-verified

# SAST scanning (if configured)
semgrep --config=auto src/
```

## Development Workflow

### Feature Development Flow

```bash
# 1. Create feature branch
git checkout dev
git pull origin dev
git checkout -b feature/awesome-new-feature

# 2. Start development services
pnpm run supabase:web:start
pnpm dev

# 3. Develop feature
# ... make changes ...

# 4. Test locally
pnpm test
pnpm test:e2e --headed

# 5. Check code quality
pnpm biome check .
pnpm typecheck

# 6. Commit changes
git add .
git commit -m "feat: add awesome new feature"

# 7. Push and create PR
git push -u origin feature/awesome-new-feature
gh pr create --base dev --title "Add awesome new feature"
```

### Debugging Techniques

#### Application Debugging

```bash
# Enable debug logging
DEBUG=* pnpm dev

# Next.js debugging
NODE_OPTIONS='--inspect' pnpm dev
# Then open chrome://inspect in Chrome

# Database debugging
SUPABASE_DB_DEBUG=true pnpm dev
```

#### Network Debugging

```bash
# Monitor API calls
open http://localhost:3000
# Open DevTools > Network tab

# Test API endpoints directly
curl -v http://localhost:3000/api/health
curl -v http://localhost:3000/api/auth/session
```

#### Performance Debugging

```bash
# Bundle analyzer
pnpm build --analyze

# Memory usage monitoring
node --inspect --max-old-space-size=4096 .next/server.js

# Profile React components
# Add ?debug to any URL in development
open http://localhost:3000/dashboard?debug
```

## Environment Sync

### Sync with Remote Environments

```bash
# Pull environment variables from Vercel
vercel env pull .env.local

# Sync database schema from staging
supabase db pull --linked

# Download latest database backup
supabase db dump --linked > backup.sql
psql "postgresql://postgres:postgres@localhost:54322/postgres" < backup.sql
```

### Data Management

```bash
# Reset local database to clean state
supabase db reset

# Seed with development data
pnpm run db:seed

# Import specific dataset
psql "postgresql://postgres:postgres@localhost:54322/postgres" \
  -c "\copy courses FROM 'data/courses.csv' CSV HEADER"
```

## Troubleshooting Local Setup

### Common Issues

#### Port Conflicts

```bash
# Check what's using a port
lsof -i :3000
netstat -an | grep 3000

# Kill process using port
kill -9 $(lsof -t -i:3000)

# Use different port
PORT=3001 pnpm dev
```

#### Database Connection Issues

```bash
# Check Supabase status
supabase status

# Restart Supabase services
supabase stop
supabase start

# Check database connectivity
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "SELECT 1;"
```

#### Build Issues

```bash
# Clear Next.js cache
rm -rf .next

# Clear pnpm cache
pnpm store prune

# Reinstall dependencies
rm -rf node_modules
pnpm install
```

#### Docker Issues

```bash
# Check Docker status
docker ps

# Restart Docker service
sudo systemctl restart docker  # Linux
# or restart Docker Desktop app

# Clean Docker cache
docker system prune -a
```

### Performance Optimization

#### Development Performance

```bash
# Use SWC instead of Babel (already configured)
# Enable experimental features in next.config.js
experimental: {
  swcMinify: true,
  turbotrace: true,
}

# Optimize pnpm store
pnpm store prune
pnpm install --prefer-offline
```

#### Memory Management

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=8192"

# Monitor memory usage
node --inspect .next/server.js
# Open chrome://inspect
```

## IDE Configuration

### VS Code Setup

**Recommended Extensions**:

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "biomejs.biome",
    "ms-playwright.playwright",
    "supabase.supabase",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

**Settings** (.vscode/settings.json):

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.experimental.classRegex": [["cn\\(([^)]*)\\)", "'([^']*)'"]]
}
```

### JetBrains (WebStorm/IntelliJ)

**Configuration**:

1. Enable Node.js integration
2. Configure Biome as default formatter
3. Set up Playwright run configurations
4. Configure TypeScript service

## Monitoring and Logging

### Local Monitoring

```bash
# Application logs
tail -f .next/server.log

# Database logs
supabase logs --db

# Container logs
docker logs supabase_db_container
```

### Performance Monitoring

```bash
# Monitor build performance
ANALYZE=true pnpm build

# Monitor runtime performance
NODE_ENV=development NEXT_TELEMETRY_DEBUG=1 pnpm dev

# Database performance
echo "SELECT * FROM pg_stat_activity;" | \
  psql "postgresql://postgres:postgres@localhost:54322/postgres"
```

---

_This local development setup is continuously improved based on developer feedback and tooling updates._
