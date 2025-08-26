# SlideHeroes CI/CD Pipeline - Complete LLM Context

## 🎯 Purpose & Overview

This document provides comprehensive context about the SlideHeroes CI/CD pipeline for Large Language Models. It consolidates all essential information needed to understand, troubleshoot, modify, or enhance the CI/CD system.

## 📋 Current Pipeline State (August 2025)

### Implementation Status: 70% Complete
- **✅ Fully Implemented**: Core pipeline, security scanning, deployment automation
- **🔧 In Progress**: Performance optimizations, advanced testing features
- **❌ Deferred**: Visual regression, full load testing, container scanning

### Active Priority (Issue #248)
**Objective**: Complete pipeline implementation based on updated design
**Target**: Achieve < 5min PR feedback, > 95% success rate, full automation

## 🏗️ Architecture Overview

### Branch Strategy & Environments
```
feature/* → dev → staging → main
    ↓         ↓        ↓       ↓
development  dev    staging  production
            .com    .com     .com
```

### Environment Details
| Environment | Branch    | URL                    | Purpose               | Protection Level |
|-------------|-----------|------------------------|-----------------------|------------------|
| Development | `dev`     | dev.slideheroes.com    | Active development    | Basic checks     |
| Staging     | `staging` | staging.slideheroes.com| Pre-production        | Full test suite  |
| Production  | `main`    | slideheroes.com        | Live production       | Manual approval  |

## 🚀 Pipeline Phases & Workflows

### Phase 0: Pre-commit (Local)
**Duration**: < 30 seconds
**Tools**: Husky, lint-staged, Biome, TruffleHog
```yaml
Hooks:
- TruffleHog secret scanning
- Biome format & lint (staged files only)
- TypeScript quick check
- Markdown/YAML linting
```

### Phase 1: PR Validation
**Trigger**: PR to any protected branch
**Duration Target**: 3-5 minutes
**Parallelization**: All jobs run concurrently

```yaml
Jobs:
- change-detection: Analyze file changes, set skip flags
- code-quality: Biome linting, Markdown/YAML validation, manypkg
- type-safety: TypeScript compilation, Knip unused exports
- security-quick: TruffleHog + Semgrep SAST
- test-unit: Vitest unit tests + coverage
- bundle-analysis: Size check + performance budget
```

### Phase 2: Dev Integration
**Trigger**: Push to `dev` branch
**Duration Target**: 8-10 minutes
**Flow**: Sequential with reusability

```yaml
Sequence:
1. Reuse PR validation checks
2. Build applications (Turbo cached)
3. Deploy to Vercel dev environment
4. Integration tests (Playwright smoke)
5. Accessibility audit (custom hybrid tester)
6. Trigger promotion readiness check
```

### Phase 3: Staging Validation
**Trigger**: Push to `staging` branch
**Duration Target**: 15-20 minutes
**Comprehensive testing phase**

```yaml
Extended Testing:
1. All Phase 2 validations
2. Full E2E test suite (9-shard parallel)
3. Performance testing (Lighthouse CI)
4. Deep security scan (Aikido full scan)
5. Load testing (K6 - when implemented)
6. Deploy to staging environment
7. Post-deployment smoke tests
```

### Phase 4: Production Deployment
**Trigger**: Push to `main` OR manual dispatch
**Duration Target**: 10-12 minutes
**Solo Developer Pattern** (GitHub Pro private repo limitation)

```yaml
Production Flow:
1. Confirmation required: "DEPLOY TO PRODUCTION"
2. Safety checks: staging health, recent commits
3. 30-second cancellation window
4. Security gate validation
5. Optimized production build
6. Deploy to Vercel production
7. Health checks & monitoring alerts
8. Auto-rollback capability
9. New Relic deployment marker
```

## 🔧 Technical Implementation

### Testing Strategy

#### Unit Testing (Vitest)
- **Coverage Target**: > 80%
- **Execution**: Every PR with result caching
- **Sharding**: 4-way split for package optimization
- **Command**: `pnpm test:unit`

#### E2E Testing (Playwright)
- **Strategy**: 9-shard parallel execution (matrix approach deprecated)
- **Smart Selection**: Affected flows only on PRs
- **Full Suite**: Staging/production deploys
- **Command**: `pnpm test:e2e`
- **Accessibility**: Custom hybrid tester (not axe-core)

#### Performance Testing
- **Lighthouse CI**: Automated on staging/production
- **Bundle Analysis**: Every PR with size alerts (+5% tolerance)
- **K6 Load Testing**: Weekly scheduled (to be implemented)

### Security Implementation

#### Primary Tools (Active)
1. **Aikido Security** - Comprehensive security platform
   - SCA, SAST, secrets, IaC, malware detection
   - Privacy-first local scanning
   - Replaces Snyk for better coverage

2. **Semgrep** - Additional SAST analysis
   - Custom rules for business logic vulnerabilities
   - PR and scheduled scans

3. **TruffleHog** - Secret detection
   - Pre-commit hooks for immediate feedback
   - Historical git repository scanning

4. **CodeQL** - Advanced code analysis (in progress)
   - GitHub's semantic code analysis
   - JavaScript/TypeScript configuration

#### Security Gates
- **No merge policy**: Critical vulnerabilities block merging
- **Dependency updates**: Automated via Dependabot
- **Weekly scans**: Comprehensive security reviews
- **Production validation**: Security checks before deployment

### Performance Optimization

#### Multi-layer Caching Strategy
```yaml
Cache Hierarchy (ordered by effectiveness):
1. PNPM store: ~50% faster dependency installs
2. Turbo build cache: Local + remote (when configured)
3. Next.js build cache: Framework-level optimization  
4. Playwright browsers: Cached browser binaries
5. Test results cache: Skip unchanged test suites
6. Docker layer cache: CI image optimization
```

**Critical Issue**: Turbo remote cache missing signature key (Priority 1)

#### Parallelization Approach
- **PR validation**: All jobs run concurrently
- **E2E testing**: 9-shard parallel execution
- **Deployments**: Web and Payload in parallel (to be implemented)
- **Matrix builds**: Multiple Node versions if needed

#### Resource Optimization
```yaml
Runner Sizing Strategy:
- Change detection: 2 CPU (lightweight)
- Linting/formatting: 4 CPU (moderate)
- Building applications: 8 CPU (intensive)
- Testing (per shard): 4 CPU (balanced)
- Deployment: 4 CPU (network bound)
```

## 📊 Monitoring & Quality Gates

### Pipeline Metrics (Tracked)
- Build duration per phase and job
- Cache hit rates across all layers
- Test execution times and success rates
- Failure rate by job type and cause
- Time to deployment (commit → production)

### Quality Metrics (Monitored)
- Code coverage trends and targets
- Bundle size evolution and budgets
- Performance score tracking (Lighthouse)
- Security vulnerability counts by severity
- Accessibility compliance scores

### Alerting Configuration
- **Pipeline failures**: Slack/email notifications
- **Performance degradation**: Threshold-based alerts
- **Security vulnerabilities**: Immediate notifications
- **Deployment issues**: Automatic rollback triggers
- **SLA violations**: Escalation procedures

## 🛠️ Tools & Configuration

### Required GitHub Secrets
```yaml
# Deployment & Infrastructure
VERCEL_TOKEN: Vercel deployment authorization
VERCEL_ORG_ID: Organization identifier
VERCEL_PROJECT_ID: Project identifier

# Security & Scanning
AIKIDO_SECRET_KEY: Security platform API key
SEMGREP_APP_TOKEN: SAST analysis token

# Database & Backend
SUPABASE_SERVICE_ROLE_KEY: Database service access
SUPABASE_DB_WEBHOOK_SECRET: Webhook security

# Payment Processing
STRIPE_SECRET_KEY: Payment API access
STRIPE_WEBHOOK_SECRET: Webhook validation

# Monitoring & Observability
NEW_RELIC_API_KEY: APM integration
NEW_RELIC_APP_ID: Application identifier

# Performance & Caching
TURBO_TOKEN: Build system acceleration
TURBO_REMOTE_CACHE_SIGNATURE_KEY: Cache security (MISSING - Priority 1)

# Communication
SLACK_WEBHOOK_URL: Team notifications
```

### Feature Flags (Environment Control)
```yaml
ENABLE_E2E_MATRIX: false      # Matrix approach deprecated
ENABLE_VISUAL_REGRESSION: false   # Not yet implemented
ENABLE_K6_LOAD_TESTS: false       # Planned for staging
ENABLE_CONTAINER_SCANNING: false  # Lower priority for Next.js
```

## 🚦 Quality Gates & Requirements

### PR Merge Requirements (Enforced)
- ✅ All CI pipeline checks passing
- ✅ Code coverage maintains > 80%
- ✅ Zero critical/high security vulnerabilities
- ✅ Bundle size within budget (+5% tolerance)
- ✅ TypeScript compilation successful
- ✅ Required approvals: 1 for dev, 2 for staging/main
- ✅ Linear commit history maintained

### Environment Promotion Gates

#### Dev → Staging (Automated)
- ✅ All integration tests passing
- ✅ No critical bugs in dev for 24+ hours
- ✅ Performance metrics within acceptable range
- ✅ Automated PR creation to staging branch

#### Staging → Production (Manual + Automated)
- ✅ Full E2E test suite passing (all shards)
- ✅ Manual QA sign-off required
- ✅ Zero P0/P1 incidents in staging environment
- ✅ Deployment window validation (business hours)
- ✅ Two manual approvals required
- ✅ Security scan completely clean

## 📈 Success Metrics & KPIs

### Performance Targets (Measured)
- **PR Feedback Time**: < 5 minutes (current: varies)
- **Dev Deploy Time**: < 10 minutes (current: ~8-12 minutes)
- **Production Deploy Time**: < 15 minutes (current: varies)
- **Pipeline Success Rate**: > 95% (current: ~90%)
- **Cache Hit Rate**: > 80% (current: suboptimal due to missing key)

### Quality Targets (Monitored)
- **Test Coverage**: > 80% maintained (current: meeting target)
- **Security Vulnerabilities**: Zero in production (current: meeting target)
- **Lighthouse Performance Score**: > 90 (current: meeting target)
- **Bundle Size Growth**: < 5% per quarter (current: monitoring)

### Operational Targets (SLAs)
- **Mean Time to Recovery (MTTR)**: < 30 minutes
- **Deployment Frequency**: 
  - Dev: Multiple daily deployments
  - Staging: Daily deployments
  - Production: 2-3 times weekly
- **Lead Time**: < 2 hours (commit to production)
- **Change Failure Rate**: < 5%

## 🚨 Current Issues & Priorities

### Priority 1: Critical Issues (Week 1)
1. **Turbo Remote Cache Missing**: Generate and add `TURBO_REMOTE_CACHE_SIGNATURE_KEY`
2. **Sequential Deployments**: Implement parallel Web/Payload deployment
3. **Suboptimal Runner Sizes**: Right-size CPU allocation per job type
4. **Promotion Testing**: Verify dev → staging automation

### Priority 2: Security & Quality (Weeks 2-3)
1. **CodeQL Implementation**: Add advanced code analysis
2. **Production Approvals**: Configure GitHub environment protection
3. **E2E Strategy**: Finalize sharded approach, remove matrix workflow

### Priority 3: Performance Features (Month 2)
1. **K6 Load Testing**: Integrate performance testing in staging
2. **Visual Regression**: Implement UI change detection
3. **Container Scanning**: Add Trivy for image security

### Known Issues & Workarounds
- **Turbo Remote Cache**: Missing signature key → 50-70% slower builds
- **E2E Matrix Disabled**: Using sharded approach instead
- **GitHub Pro Limitations**: Custom production protection for private repos

## 🔄 Common Workflow Patterns

### Typical Development Flow
```
1. Developer creates feature branch from dev
2. Makes changes, commits trigger pre-commit hooks
3. Opens PR → triggers Phase 1 validation (3-5 min)
4. PR approved and merged to dev
5. Dev deploy triggered → Phase 2 integration (8-10 min)
6. Automated promotion readiness check
7. If ready, automated PR created to staging
8. Staging merge → Phase 3 comprehensive testing (15-20 min)
9. Manual promotion to main (production)
10. Production deployment with approval gates (10-12 min)
```

### Emergency Hotfix Flow
```
1. Create hotfix branch from main
2. Implement fix with accelerated testing
3. Direct merge to main with emergency approval
4. Production deployment with enhanced monitoring
5. Backport to dev and staging branches
```

## 📁 Key File Locations

### Workflow Files
```
.github/workflows/
├── pr-validation.yml          # Phase 1: PR checks
├── dev-deploy.yml            # Phase 2: Dev integration
├── dev-integration-tests.yml # Dev environment testing
├── dev-promotion-readiness.yml # Automated promotion
├── staging-deploy.yml        # Phase 3: Staging validation
├── production-deploy.yml     # Phase 4: Production deployment
├── production-deploy-gated.yml # Solo developer protection
├── security-weekly.yml       # Scheduled security scans
└── e2e-matrix.yml           # DEPRECATED: Matrix E2E approach
```

### Configuration Files
```
turbo.json                    # Build system configuration
vitest.config.ts             # Unit test configuration
playwright.config.ts         # E2E test configuration
.pre-commit-config.yaml      # Pre-commit hook setup
package.json                 # Script definitions and dependencies
```

### Documentation
```
.claude/context/systems/cicd/
├── cicd-pipeline-updated-design.md  # Complete design document
├── cicd-llm-context.md              # This file
└── [other related documentation]
```

## 💡 LLM Guidance

### When Working with CI/CD
1. **Always check current status** via issue #248 or recent commits
2. **Prioritize based on the 3-tier system** (Critical → Security → Performance)
3. **Test changes incrementally** - CI/CD changes affect the entire team
4. **Maintain backward compatibility** when modifying workflows
5. **Document all changes** in commit messages and relevant issues

### Common Tasks & Approaches
- **Workflow modifications**: Test in feature branch first
- **Security updates**: Always validate with multiple scanning tools
- **Performance optimization**: Measure before and after changes
- **Deployment issues**: Check logs in GitHub Actions and New Relic

### Red Flags to Watch For
- **Increased pipeline duration** beyond target SLAs
- **Decreased cache hit rates** indicating configuration issues
- **Security scan failures** requiring immediate attention
- **Test flakiness** affecting pipeline reliability

---

*This context document is maintained in sync with the implementation. Last updated: August 2025*
*For the most current status, check issue #248 and recent workflow runs*