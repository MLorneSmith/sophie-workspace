# CI/CD Pipeline Implementation and Management

**Purpose**: Comprehensive documentation for SlideHeroes CI/CD pipeline using GitHub Actions, including workflows, testing strategies, security scanning, deployment patterns, and performance optimization.

## Overview

The SlideHeroes CI/CD system implements a 4-phase progressive pipeline achieving <5 minute PR feedback times with >95% success rates. Built on GitHub Actions with Turborepo caching, parallel execution, and multi-layer security scanning.

## Pipeline Architecture

### Branch Strategy & Environments

```
feature/* → dev → staging → main
           ↓      ↓        ↓
      dev env  staging  production
```

| Environment | Branch | URL | Purpose | Protection |
|------------|--------|-----|---------|------------|
| Development | `dev` | dev.slideheroes.com | Active development, integration testing | Basic checks |
| Staging | `staging` | staging.slideheroes.com | Pre-production validation | Full test suite |
| Production | `main` | slideheroes.com | Production release | Manual approval + all checks |

### Pipeline Phases

**Phase 0: Pre-commit (Local)**

- TruffleHog secret scanning
- Biome format & lint (staged files only)
- TypeScript quick check
- Markdown/YAML linting
- Time: < 30 seconds

**Phase 1: Pull Request Validation**

- Trigger: PR opened/updated to protected branch
- Time Target: 3-5 minutes (parallel execution)
- Jobs run in parallel:
  - Change detection & skip flags
  - Biome linting & formatting
  - TypeScript compilation
  - Semgrep SAST analysis
  - Vitest unit tests with coverage
  - Bundle size validation

**Phase 2: Development Integration**

- Trigger: Push to `dev` branch
- Time Target: 8-10 minutes
- Sequential flow:
  1. PR validation checks (reuse)
  2. Turbo cached builds
  3. Deploy to Vercel dev
  4. Playwright smoke tests
  5. Custom accessibility audit
  6. Promotion readiness check

**Phase 3: Staging Validation**

- Trigger: Push to `staging` branch
- Time Target: 15-20 minutes
- Comprehensive testing:
  1. All Phase 2 checks
  2. Full E2E suite (9-shard parallel)
  3. Lighthouse CI performance
  4. Aikido full security scan
  5. K6 load testing (when implemented)
  6. Deploy to staging
  7. Post-deployment smoke tests

**Phase 4: Production Deployment**

- Trigger: Push to `main` branch (automatic)
- Time Target: 10-12 minutes
- Deployment Flow:
  1. Check if validation needed (skip if merged from staging)
  2. Conditional security scanning (only if not from staging)
  3. Build application using reusable workflow
  4. Deploy to Vercel production environment
  5. Health checks & monitoring
  6. Auto-rollback workflow execution
  7. New Relic deployment marker
  8. Security scan (informational, non-blocking)

Note: GitHub environment protection rules can be configured via Settings for manual approvals, required reviewers, and deployment delays. The workflow supports automatic deployment on push to main, with conditional validation based on source branch.

## Workflow Structure

```
.github/workflows/
├── Core Pipelines
│   ├── pr-validation.yml          # PR checks and quality gates
│   ├── dev-deploy.yml            # Development environment deployment
│   ├── staging-deploy.yml        # Staging validation and deployment
│   └── production-deploy.yml     # Production deployment with gates
├── Testing Workflows
│   ├── e2e-sharded.yml          # Parallel E2E test execution
│   ├── e2e-smart.yml            # Affected flow testing
│   ├── dev-integration-tests.yml # Integration test suite
│   └── visual-regression.yml    # UI change detection
├── Security & Compliance
│   ├── codeql.yml               # GitHub code analysis
│   ├── semgrep.yml              # SAST scanning
│   ├── trufflehog-scan.yml      # Secret detection
│   ├── container-security.yml   # Image vulnerability scanning
│   └── security-weekly-scan.yml # Scheduled comprehensive scan
├── Performance & Monitoring
│   ├── lighthouse-ci.yml        # Web performance testing
│   ├── k6-load-test.yml        # Load and stress testing
│   ├── bundle-size-alert.yml   # Bundle size monitoring
│   ├── pipeline-metrics.yml    # CI/CD metrics collection
│   └── performance-monitor.yml # Runtime performance tracking
├── Automation & Utilities
│   ├── dependabot-auto-merge.yml # Dependency updates
│   ├── auto-rollback.yml        # Automated failure recovery
│   ├── dev-promotion-readiness.yml # Environment promotion
│   ├── scheduled-maintenance.yml # Routine maintenance tasks
│   └── artifact-sharing.yml     # Artifact management
└── Infrastructure
    ├── docker-ci-image.yml      # CI container management
    ├── codespaces-prebuild.yml  # Development environment
    ├── devcontainer-prebuild.yml # Container prebuilding
    └── workflow.yml             # Main CI/CD orchestration
```

## Testing Strategy

### Unit Testing (Vitest)

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      threshold: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80
      }
    },
    parallel: true,
    maxConcurrency: 4
  }
});
```

- Coverage Target: > 80%
- Execution: Every PR, cached results
- Sharding: 4-way split for packages

### E2E Testing (Playwright)

```typescript
// apps/e2e/playwright.config.ts
export default defineConfig({
  workers: 6,  // Default parallel shards (configurable 3-9)
  retries: 2,
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  }
});
```

- Strategy: 9-shard parallel execution
- Smart Selection: Only test affected flows on PRs
- Full Suite: Run on staging/production deploys
- Accessibility: Custom hybrid tester (not axe-core)

### Performance Testing

- Lighthouse CI: Automated on staging/production
- Bundle Analysis: Every PR with size alerts
- K6 Load Testing: Weekly scheduled runs (to be implemented)

## Security Implementation

### Multi-Layer Security Scanning

1. **Pre-commit**: TruffleHog for secrets detection
2. **PR Validation**: Semgrep SAST, dependency audit
3. **Staging**: Full security suite including DAST
4. **Production**: Final security gate validation

### Security Tools Configuration

**Aikido Security Platform** (Primary):

- Complete SAST/SCA/Secrets scanning
- Privacy-first local scanning
- Real-time vulnerability alerts
- SAST configured as non-blocking (free tier limitation)

**Additional Security Layers**:

- CodeQL: Semantic code analysis
- Semgrep: Custom rule enforcement
- TruffleHog: Git history scanning
- Container scanning: Trivy integration (when implemented)

### Security Gates

- No merge with critical vulnerabilities
- Automated dependency updates via Dependabot
- Weekly comprehensive security scans
- Production deployment security validation

## Performance Optimizations

### Caching Strategy (3-5x Performance Improvement)

```yaml
# Multi-layer cache hierarchy
1. PNPM store cache         # ~50% faster installs
2. Turbo build cache        # Incremental builds
3. Next.js cache           # Framework optimization
4. Playwright browsers     # Binary caching
5. Test results cache      # Skip unchanged tests
```

### Parallel Execution

```yaml
# PR Validation - Full parallelization
jobs:
  lint:              # Biome format and lint checks
  typecheck:         # TypeScript type checking
  aikido-security:   # Aikido security scanning
  test-unit:         # Vitest unit tests
  bundle-size:       # Bundle size analysis
  yaml-lint:         # YAML validation
  markdown-lint:     # Markdown validation
```

### Resource Optimization

```yaml
Runner Sizing:
  - Change detection: 2 CPU
  - Linting/formatting: 4 CPU
  - Building: 8 CPU
  - Testing: 4 CPU per shard
  - Deployment: 4 CPU
```

## Deployment Strategies

### Production Deployment Workflow Details

**Trigger Configuration**:

```yaml
on:
  push:
    branches:
      - main
```

**Validation Strategy**:

The production workflow implements smart validation that checks if the code was already validated in a previous environment:

```yaml
check-validation:
  steps:
    - name: Check if already validated
      run: |
        # Skip validation if this is a merge from staging
        if git log --format=%B -n 1 | grep -q "Merge.*staging"; then
          echo "should-validate=false"
        else
          echo "should-validate=true"
        fi
```

**Conditional Security Scanning**:

Security checks only run if the code wasn't validated via staging merge:

```yaml
security-check:
  needs: check-validation
  if: needs.check-validation.outputs.should-validate == 'true'
  steps:
    - TruffleHog Secret Scan
    - Aikido Security Scan
    - Weekly Security Scan
```

**Build and Deploy Jobs**:

```yaml
build:
  needs: [check-validation, security-check]
  if: always() && !failure() && !cancelled()
  uses: ./.github/workflows/reusable-build.yml
  with:
    environment: production

deploy-web:
  needs: build
  environment:
    name: production
    url: https://slideheroes.com
    # GitHub environment protection can be configured via Settings:
    # - Required reviewers: 2
    # - Restrict deployments to specific users/teams
    # - Add deployment delay for manual review
```

**Post-Deployment Health Checks**:

```yaml
health-check:
  needs: [deploy-web, deploy-payload]
  steps:
    - Wait for deployment propagation (30 seconds)
    - Check production web health (/healthcheck)
    - Check production payload health (/api/health)
    - Run critical path tests (TODO: to be implemented)
```

**Production Security Monitoring**:

```yaml
production-security-scan:
  needs: [deploy-web, deploy-payload, health-check]
  continue-on-error: true  # Never block production
  steps:
    - Run Nuclei quick scan (critical/high severity)
    - Log security metrics (informational only)
```

**Protection Configuration**:

GitHub environment protection rules are configured via repository Settings (not in workflow YAML):

- Environment name: `production`
- Required reviewers: Can be configured (2 recommended)
- Wait timer: Can add deployment delay for manual review window
- Deployment branches: Restricted to `main`
- Environment secrets: Production credentials isolated

The workflow relies on GitHub's environment protection feature rather than custom approval steps in the workflow file. This provides native GitHub UI for approvals and deployment history.

### Blue-Green Deployment (Production)

```yaml
steps:
  - name: Deploy to Green Environment
    run: vercel deploy --prod-preview

  - name: Health Check Green
    run: ./scripts/health-check.sh $GREEN_URL

  - name: Switch Traffic to Green
    run: vercel alias set $GREEN_URL production

  - name: Monitor for Issues
    run: ./scripts/monitor-deploy.sh
```

### Canary Deployment Pattern

```yaml
# Progressive rollout with monitoring
- 5% traffic → Monitor 10min
- 25% traffic → Monitor 30min
- 50% traffic → Monitor 1hr
- 100% traffic → Full deployment
```

## Monitoring & Observability

### Pipeline Metrics

- Build duration per phase
- Cache hit rates
- Test execution times
- Failure rate by job type
- Time to deployment (commit → production)

### Quality Metrics

- Code coverage trends
- Bundle size evolution
- Performance score tracking
- Security vulnerability count
- Accessibility score

### Alerting

- Pipeline failures (Slack/email)
- Performance degradation
- Security vulnerabilities
- Deployment issues
- SLA violations

## Required GitHub Secrets

```yaml
# Deployment
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID

# Security
AIKIDO_SECRET_KEY
SEMGREP_APP_TOKEN

# Database
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_WEBHOOK_SECRET

# Payments
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET

# Monitoring
NEW_RELIC_API_KEY
NEW_RELIC_APP_ID

# Performance
TURBO_TOKEN
TURBO_REMOTE_CACHE_SIGNATURE_KEY

# Notifications
SLACK_WEBHOOK_URL
```

## Quality Gates

### PR Merge Requirements

- All CI checks passing
- Code coverage > 80%
- No security vulnerabilities (critical/high)
- Bundle size within budget (+5% tolerance)
- TypeScript compilation successful
- 1 approval for dev, 2 for staging/main
- Linear commit history

### Environment Promotion

**Dev → Staging**:

- All integration tests passing
- No critical bugs in dev for 24 hours
- Performance metrics acceptable
- Automated PR creation

**Staging → Production**:

- Full E2E suite passing
- Manual QA sign-off
- No P0/P1 incidents in staging
- Deployment window check
- 2 manual approvals
- Security scan clean

## Success Metrics & KPIs

### Performance Targets

- PR Feedback Time: < 5 minutes
- Dev Deploy Time: < 10 minutes
- Production Deploy Time: < 15 minutes
- Pipeline Success Rate: > 95%
- Cache Hit Rate: > 80%

### Quality Targets

- Test Coverage: > 80%
- Zero security vulnerabilities in production
- Lighthouse Score: > 90
- Bundle Size Growth: < 5% per quarter

### Operational Targets

- MTTR: < 30 minutes
- Deployment Frequency: Multiple daily (dev), Daily (staging), 2-3x weekly (production)
- Lead Time: < 2 hours (commit to production)
- Change Failure Rate: < 5%

## Troubleshooting

### Slow Pipeline Performance

**Symptoms**: PR validation taking >10 minutes
**Cause**: Cache misses, sequential execution, oversized runners

**Solution**:

```yaml
# Enable caching
- uses: actions/cache@v4
  with:
    path: ~/.pnpm-store
    key: pnpm-${{ hashFiles('pnpm-lock.yaml') }}

# Parallelize jobs
jobs:
  test:
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
```

### Flaky E2E Tests

**Symptoms**: Random test failures, inconsistent results
**Cause**: Race conditions, timing issues, external dependencies

**Solution**:

```typescript
// Add proper waits and retries
await page.waitForLoadState('networkidle');
await expect(element).toBeVisible({ timeout: 10000 });

// Use test isolation
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});
```

### Security Scan Failures

**Symptoms**: Pipeline blocked by security vulnerabilities
**Cause**: Outdated dependencies, new vulnerability disclosures

**Solution**:

```bash
# Update dependencies
pnpm update --latest --interactive

# Audit and fix
pnpm audit --fix

# Override if false positive
echo "vulnerability-id" >> .aikido-ignore
```

### Deployment Rollback Needed

**Symptoms**: Production issues after deployment
**Cause**: Untested edge cases, configuration issues

**Solution**:

```yaml
# Automated rollback workflow
- name: Monitor Deployment
  id: monitor
  run: ./scripts/monitor-health.sh

- name: Rollback if Failed
  if: failure()
  run: |
    vercel rollback --yes
    gh issue create --title "Deployment rolled back" --body "${{ steps.monitor.outputs.errors }}"
```

## Best Practices

### Security

- Never commit secrets - Use GitHub Secrets
- Enable branch protection - Require PR reviews
- Scan dependencies - Automated vulnerability checks
- Rotate credentials - Regular token rotation

### Performance

- Cache aggressively - Dependencies, builds, test results
- Parallelize everything - Matrix builds, job concurrency
- Optimize runner size - Match resources to workload
- Use artifacts wisely - Share between jobs, cleanup old artifacts

### Reliability

- Implement retries - Network calls, flaky tests
- Add monitoring - Health checks, performance metrics
- Document failures - Clear error messages, troubleshooting guides
- Practice rollbacks - Automated recovery procedures

## Related Files

- `/turbo.json` - Build system configuration with caching rules
- `/vitest.config.ts` - Unit test configuration with coverage thresholds
- `/apps/e2e/playwright.config.ts` - E2E test configuration with sharding
- `/package.json` - Script definitions and CI/CD commands
- `/.claude/scripts/cleanup-ports.sh` - Port management for testing
- `/.claude/scripts/codecheck-direct.sh` - Direct code quality checks
- `/scripts/health-check.sh` - Deployment health validation

## See Also

- CI_CD_INVENTORY.md: Complete workflow inventory
- pipeline-design.md: Updated design with implementation status
- PRODUCTION_PROTECTION_PRIVATE_REPO.md: Solo developer deployment safety
