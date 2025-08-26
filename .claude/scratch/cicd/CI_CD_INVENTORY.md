# CI/CD Pipeline Inventory

## 📦 Build Tools & Package Management

### Core Build System
- **Turbo** (v2.5.6) - Monorepo build orchestration with caching
- **PNPM** (v10.14.0) - Fast, disk space efficient package manager
- **Node.js** (>=v18.18.0) - Runtime environment

### Frameworks
- **Next.js** (v15.5.0) - React framework for web app
- **Payload CMS** - Content management system
- **React** (v19.1.1) - UI library

## 🧪 Testing Frameworks & Tools

### Unit & Integration Testing
- **Vitest** (v3.1.2) - Fast unit test framework
  - Coverage reporting with `@vitest/coverage-v8`
  - Test files: `*.test.ts`, `*.test.tsx`
  - Scripts: `test`, `test:unit`, `test:coverage`
  
### E2E Testing
- **Playwright** (v1.55.0) - Cross-browser E2E testing
  - 9-shard parallel execution strategy
  - Smoke & integration test suites
  - Accessibility testing capabilities
  - Scripts: `test:e2e`, `test:smoke`, `test:integration`
  - Sharded execution: `test:shard1` through `test:shard9`

### Load Testing
- **K6** - Performance and load testing
  - Configuration in `load-tests/k6.config.js`
  - Thresholds: p95 < 500ms, p99 < 1s, error rate < 5%

### Accessibility Testing
- **Custom Hybrid Accessibility Tester** - WCAG validation with accurate contrast calculations
  - Replaced axe-core with custom solution (see issue #218)
  - Uses Lighthouse (v12.8.1) and chrome-launcher (v1.2.0) in E2E tests
  - Graceful degradation when tools aren't available
- **Lighthouse CI** - Performance and accessibility audits in CI/CD workflows
- Scripts: `a11y:test`, `a11y:test:ci`, `a11y:test:quick`

## 🔍 Code Quality Tools

### Linting & Formatting
- **Biome** (v2.0.0) - Fast formatter and linter
  - Configuration: `biome.json`
  - Scripts: `lint`, `lint:fix`, `format`, `format:fix`
  
- **Markdownlint-cli2** (v0.18.1) - Markdown linting
  - Script: `lint:md`, `lint:md:fix`
  
- **YAML-lint** (v1.7.0) - YAML file validation
  - Script: `lint:yaml`

### Type Checking
- **TypeScript** (v5.9.2) - Static type checking
  - Script: `typecheck`
  - Turbo cached with tsbuildinfo

### Dependency Management
- **Manypkg** (v0.25.0) - Monorepo package consistency
  - Scripts: `manypkg:check`, `manypkg:fix`
  
- **Syncpack** - Package version synchronization
  - Scripts: `syncpack:list`, `syncpack:fix`
  
- **Knip** (v5.61.0) - Find unused dependencies and exports
  - Configuration: `knip.json`
  - Scripts: `knip`, `knip:production`, `knip:fix`

## 🔒 Security Tools

### Vulnerability Scanning
- **Aikido Security** (v1.0.13) - Comprehensive security platform
  - Replaces Snyk (see issue #163)
  - SCA (dependencies), SAST (code), secrets, IaC, and malware detection
  - Privacy-first with local scanning options
  - GitHub workflows: `pr-validation.yml`, `security-weekly-scan.yml`, `production-deploy.yml`
  - Documentation: `docs/security/aikido-setup.md`
  - Requires `AIKIDO_SECRET_KEY` secret

- **Semgrep** - Static analysis security scanner
  - Configuration: `.semgrep.yml`
  - GitHub workflow: `semgrep.yml`

- **TruffleHog** - Secret scanning
  - Git hook integration via lint-staged
  - GitHub workflow: `trufflehog-scan.yml`

- **Trivy** - Container vulnerability scanning
  - Used in weekly security scans
  - Scans for OS, library vulnerabilities, and misconfigurations

- **Dependabot** - Automated dependency updates
  - Auto-merge workflow for safe updates

## 📊 Monitoring & Analytics

### Performance Monitoring
- **Lighthouse CI** - Web performance metrics
  - Automated performance budgets
  - GitHub workflow: `lighthouse-ci.yml`

- **Bundle Analyzer** - Next.js bundle size analysis
  - Script: `analyze`
  - GitHub workflow: `bundle-size-alert.yml`

### Application Monitoring (Multiple Providers)
- **Sentry** - Error tracking
- **New Relic** - APM and monitoring
- **Baselime** - Observability platform
- **Vercel OTEL** - OpenTelemetry integration

## 🚀 Deployment & Infrastructure

### Deployment Platforms
- **Vercel** - Primary hosting platform
  - Environment variables configuration
  - Preview deployments for PRs
  
- **Cloudflare Pages** - Alternative deployment option
- **Supabase** - Database and auth backend

### Database Tools
- **Supabase CLI** - Database management
  - Scripts: `supabase:*` commands
  - Migrations, type generation, local development

### Payment Processing
- **Stripe** - Payment integration
  - Webhook support
  - Test and production environments
- **Lemon Squeezy** - Alternative payment provider

## 🔄 CI/CD Workflows

### GitHub Actions Workflows
1. **PR Validation** (`pr-validation.yml`)
   - Runs on all PRs
   - Type checking, linting, unit tests
   - Security scanning

2. **E2E Testing** 
   - `e2e-sharded.yml` - Parallel sharded execution
   - `e2e-smart.yml` - Smart test selection
   - `e2e-matrix.yml` - Matrix strategy

3. **Deployment Pipelines**
   - `dev-deploy.yml` - Development environment
   - `staging-deploy.yml` - Staging environment
   - `production-deploy.yml` - Production deployment
   - `manual-deploy.yml` - Manual deployment trigger

4. **Security & Maintenance**
   - `security-weekly-scan.yml` - Weekly security audits
   - `scheduled-maintenance.yml` - Automated maintenance
   - `auto-rollback.yml` - Automatic rollback on failures

5. **Performance & Metrics**
   - `performance-monitor.yml` - Performance tracking
   - `pipeline-metrics.yml` - CI/CD metrics collection
   - `pipeline-alerts.yml` - Alert notifications

## 🎣 Git Hooks (Husky + lint-staged)

### Pre-commit
- TruffleHog secret scanning
- Biome formatting and linting
- TypeScript type checking for staged files
- Markdown and YAML linting

### Commit-msg
- Commitlint with conventional commits
- Commitizen support (`pnpm commit`)

## 📝 Available NPM Scripts (Root)

### Core Commands
- `build` - Build all packages
- `dev` - Start development servers
- `test` - Run all tests
- `typecheck` - Type check all packages
- `lint` - Lint all code
- `format` - Format all code

### Specialized Commands
- `codecheck` - Combined typecheck + lint + format
- `test:e2e` - Run E2E tests
- `test:coverage` - Generate coverage reports
- `supabase:web:*` - Database management commands
- `env:generate` - Generate environment variables
- `env:validate` - Validate environment configuration

## 🔧 Configuration Files

- `turbo.json` - Turbo pipeline configuration
- `biome.json` - Biome linter/formatter settings
- `knip.json` - Unused dependency detection
- `commitlint.config.js` - Commit message rules
- `playwright.config.ts` - E2E test configuration
- `vitest.config.ts` - Unit test configuration
- Various `next.config.mjs` - Next.js configurations

## 📊 Test Coverage

- **Unit Tests**: ~21 test files across packages
- **E2E Tests**: ~14 spec files including:
  - Authentication flows
  - Billing (user and team)
  - Account management
  - Accessibility (hybrid custom solution, not axe-core)
  - Smoke tests
  - Health checks
  
## 🏷️ Environment Management

### Required Environment Variables
- Supabase credentials
- Stripe/payment keys
- Email service configuration
- CMS settings
- Monitoring provider keys
- R2/S3 storage credentials

### Environment Validation
- Scripts for generating and validating env vars
- Turbo global environment configuration
- Multiple provider support for services