# CI/CD Pipeline Inventory

## 📦 Build Tools & Package Management

### Core Build System

- **Turbo** (v2.5.6) - Monorepo build orchestration with caching
  - Remote caching enabled
  - Turbo generators for scaffolding (`turbo gen`)
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
  - **Codecov** integration for coverage reporting (uploads to codecov.com)
  - Test files: `*.test.ts`, `*.test.tsx`
  - Scripts: `test`, `test:unit`, `test:coverage`

- **Testing Library** - React testing utilities
  - `@testing-library/react` (v16.3.0)
  - `@testing-library/user-event` (v14.6.1)
  - `@testing-library/jest-dom` (v6.7.0)

### E2E Testing

- **Playwright** (v1.55.0) - Cross-browser E2E testing
  - 9-shard parallel execution strategy
  - Smoke & integration test suites
  - Accessibility testing capabilities
  - Scripts: `test:e2e`, `test:smoke`, `test:integration`
  - Sharded execution: `test:shard1` through `test:shard9`
  - **Supporting packages:**
    - `totp-generator` (v1.0.0) - For 2FA testing
    - `dotenv` (v17.2.1) - Environment variable management
    - `node-html-parser` (v7.0.1) - HTML parsing in tests

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
- **Vercel OTEL** (v1.13.0) - OpenTelemetry integration

### UI & Utility Libraries

- **@tanstack/react-query** (v5.85.5) - Data fetching and caching
- **@tanstack/react-table** (v8.21.3) - Table components
- **Pino** (v9.8.0) - Logging with pino-pretty
- **PPTXGenJS** (v4.0.1) - PowerPoint generation (in web app)
- **Tailwind CSS** (v4.1.12) - CSS framework
- **PostCSS** - CSS processing
- **cssnano** (v7.1.0) - CSS optimization

## 🚀 Deployment & Infrastructure

### Deployment Platforms

- **Vercel** - Primary hosting platform
  - Vercel CLI used in manual deployments
  - Environment variables configuration
  - Preview deployments for PRs

- **Cloudflare Pages** - Alternative deployment option
  - Wrangler CLI support (via Turbo generator templates)

- **Supabase** - Database and auth backend
  - Supabase CLI (`supabase/setup-cli` action)
  - Scripts: `supabase:*` commands
  - Migrations, type generation, local development

### Container & Infrastructure

- **Docker** - Containerization
  - Docker Buildx for multi-platform builds
  - GitHub Container Registry integration
  - CI Docker image workflow (`docker-ci-image.yml`)
  - Docker Compose for local Supabase

### Security Scanning

- **Nuclei** - Security vulnerability scanner
  - Custom GitHub action (`.github/actions/nuclei-scan`)
  - Used in staging and production deployments

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

## 🔧 GitHub Actions Tools

### Workflow Utilities

- **actions/github-script** (v7) - GitHub API automation
  - Used for PR comments, issue creation, workflow coordination
- **actions/cache** (v4) - Build and dependency caching
- **actions/upload-artifact** (v4) - Artifact management
- **actions/download-artifact** - Artifact retrieval
- **pnpm/action-setup** (v4) - PNPM installation
- **actions/setup-node** (v4) - Node.js setup
- **actions/checkout** (v4) - Repository checkout

### Third-party Actions

- **github/codeql-action** - Upload security scan results
- **docker/setup-buildx-action** (v3) - Docker build setup
- **docker/login-action** (v3) - Container registry login
- **docker/build-push-action** (v5) - Build and push images
- **docker/metadata-action** (v5) - Generate Docker metadata

## 🎣 Git Hooks (Husky + lint-staged)

### Pre-commit

- TruffleHog secret scanning
- Biome formatting and linting  
- TypeScript type checking for staged files
- Markdown and YAML linting
- Payload-specific linting for `apps/payload`

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
