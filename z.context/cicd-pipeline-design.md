# SlideHeroes CI/CD Pipeline Design

## 🎯 Overview

A comprehensive, multi-stage CI/CD pipeline leveraging GitHub Actions, Vercel, and modern DevOps practices to ensure code quality, security, and reliable deployments.

## 🌳 Branch Strategy & Environments

### Branch Structure:

- **main** → Production (slideheroes.com)
- **staging** → Staging (staging.slideheroes.com)
- **dev** → Development (dev.slideheroes.com)
- **feature/** → Feature branches (preview deployments)
- **hotfix/** → Emergency fixes (fast-track to production)

### Environment Configuration:

1. **Production**: Full monitoring, optimized builds, caching enabled
2. **Staging**: Production-like, synthetic monitoring, pre-release testing
3. **Development**: Frequent deployments, verbose logging, debug enabled
4. **Preview**: Ephemeral environments for PRs

## 📋 CI/CD Pipeline Phases

### Phase 1: Pre-commit (Local)

**Tools**: Husky, Biome, Commitizen

- Code formatting (Biome)
- Linting (Biome)
- Quick type checking (30s timeout)
- Commit message validation (Commitizen)

### Phase 2: PR Validation

**Triggers**: Pull request opened/updated
**Jobs**:

1. **Code Quality** (2-3 min)
   - Biome linting & formatting check
   - TypeScript compilation
   - Package dependency validation (manypkg)
   - Bundle size analysis
2. **Testing Suite** (5-10 min)
   - Unit tests (Vitest) with coverage
   - Integration tests (critical paths)
   - Accessibility tests (axe-core)
3. **Security Scanning** (3-5 min)
   - Dependency vulnerabilities (Snyk)
   - Secret scanning (TruffleHog)
   - SAST analysis (CodeQL)

### Phase 3: Merge to Dev

**Triggers**: Push to dev branch
**Jobs**:

1. All Phase 2 checks
2. Full E2E tests (Playwright)
3. Performance budgets check
4. Deploy to dev environment

### Phase 4: Staging Release

**Triggers**: Push to staging branch
**Jobs**:

1. All previous checks
2. Full test suite (all scenarios)
3. Visual regression tests
4. Load testing (k6)
5. Deploy to staging
6. Smoke tests post-deployment

### Phase 5: Production Release

**Triggers**: Push to main branch
**Jobs**:

1. Production build optimization
2. Final security scan
3. Deploy to Vercel production
4. Post-deployment monitoring
5. Automated rollback on failures

## 🛠️ Recommended Tools & Actions

### Core CI/CD Tools:

- **actions/cache@v4**: Cache dependencies & build artifacts
- **pnpm/action-setup@v4**: PNPM package manager
- **actions/setup-node@v4**: Node.js environment
- **vercel/action@v25**: Vercel deployments

### Quality & Testing:

- **vitest**: Unit & integration testing
- **playwright**: E2E testing
- **axe-core/cli**: Accessibility testing
- **codecov/codecov-action@v4**: Code coverage reporting

### Security:

- **snyk/actions@v0**: Vulnerability scanning
- **trufflesecurity/trufflehog@v3**: Secret detection
- **github/codeql-action@v3**: SAST analysis

### Performance:

- **bundlewatch**: Bundle size monitoring
- **lighthouse-ci**: Performance audits
- **k6-action**: Load testing

### Additional Linters:

- **yamllint**: YAML validation
- **markdownlint-cli2**: Markdown formatting
- **hadolint**: Dockerfile linting

## 🚦 Quality Gates

### PR Merge Requirements:

- ✅ All CI checks passing
- ✅ Code coverage > 80%
- ✅ No critical security vulnerabilities
- ✅ Bundle size within budget (+5% tolerance)
- ✅ 2 approvals for staging/main branches
- ✅ No merge conflicts

### Staging → Production Gates:

- ✅ All E2E tests passing
- ✅ Performance metrics within thresholds
- ✅ Security scan clean
- ✅ Manual QA sign-off
- ✅ Deployment window check

## 📊 Test Execution Strategy

### Local Development:

- Pre-commit: Formatting, linting, quick type check
- Pre-push: Unit tests for changed files
- On-demand: Full test suite

### CI Pipeline:

- **Every PR**: Linting, type checking, unit tests
- **Dev merges**: + Integration tests, E2E smoke tests
- **Staging**: + Full E2E suite, performance tests
- **Production**: + Security audit, load tests

## 🔍 Monitoring & Observability

### Build Metrics:

- Build times per phase
- Test execution times
- Cache hit rates
- Failure rates by job

### Deployment Metrics:

- Deployment frequency
- Lead time for changes
- MTTR (Mean Time To Recovery)
- Change failure rate

### Integration with New Relic:

- Deployment markers
- Performance baseline tracking
- Error rate monitoring
- Custom CI/CD dashboards

## 📦 Bundle Analysis Strategy

### Tools:

- **@next/bundle-analyzer**: Webpack bundle visualization
- **bundlewatch**: Size tracking & budgets
- **size-limit**: Modular size checking

### Metrics:

- Total bundle size
- Per-route bundle size
- First Load JS
- CSS size
- Image optimization

## 🔐 Security Best Practices

1. **Secrets Management**:

   - GitHub Secrets for all credentials
   - Environment-specific secrets
   - Regular rotation schedule

2. **Dependency Management**:

   - Weekly dependency updates
   - Automated security patches
   - License compliance checks

3. **Code Security**:
   - No secrets in code
   - Input validation
   - SQL injection prevention
   - XSS protection

## 📝 Implementation Plan

### Week 1: Foundation

1. Set up branch protection rules
2. Configure Vercel environments
3. Create base GitHub Actions workflows
4. Implement YAML/Markdown linting

### Week 2: Testing & Quality

1. Enhance test configurations
2. Add coverage reporting (CodeCov)
3. Implement bundle size tracking
4. Set up accessibility testing

### Week 3: Security & Performance

1. Integrate Snyk scanning
2. Add TruffleHog secret detection
3. Implement performance budgets
4. Configure SonarQube (future)

### Week 4: Optimization & Documentation

1. Optimize caching strategies
2. Create CI/CD documentation
3. Set up monitoring dashboards
4. Team training & handoff

## 🎯 Success Metrics

- **Build Time**: < 10 minutes for full pipeline
- **Test Coverage**: > 80% across all packages
- **Deployment Frequency**: Multiple times daily
- **Lead Time**: < 2 hours from commit to production
- **MTTR**: < 30 minutes with auto-rollback

## 📚 Addressing Your Questions

### 1. When should we run what tests?

- **Local**: Quick checks (lint, format, type) on pre-commit
- **PR**: Unit tests, integration tests, security scans
- **Dev**: All above + E2E smoke tests
- **Staging**: Full test suite including performance
- **Production**: Final security audit + monitoring

### 2. How to use a PR request?

- Feature branches create PR to dev
- Dev → Staging via PR with full testing
- Staging → Main via PR with approvals
- Use PR templates for consistency
- Require linear history for clean commits

### 3. Should all tests be run locally before pushing?

- **No** - Focus on fast feedback locally
- Pre-commit: Format & lint only
- Pre-push: Unit tests for changed modules
- Full suite runs in CI to save developer time

### 4. How to leverage logging?

- Use Pino structured logging
- Log deployment events to New Relic
- Track CI/CD metrics in dashboards
- Error logs trigger alerts
- Performance logs for optimization

### 5. Bundle Analysis Types:

- **Bundle size tests**: Track total size over time
- **Bundle budget tests**: Enforce size limits per route
- **Bundle analysis**: Visualize what's in bundles
- **Bundle visualization**: Interactive dependency graphs
- **Bundle optimization**: Code splitting recommendations
- **Bundle minification**: Already handled by Next.js

### 6. Should we use CodeCov?

- **Yes** - Provides:
  - PR coverage reports
  - Coverage trends
  - Branch coverage
  - Uncovered code highlights
  - Integration with GitHub checks

### 7. Should we use TruffleHog OSS?

- **Yes** - Essential for:
  - Pre-commit secret scanning
  - Historical git scanning
  - Custom regex patterns
  - Prevents credential leaks

### 8. Should we use GitHub Actions cache?

- **Yes** - Cache these:
  - PNPM store (~50% faster installs)
  - Next.js build cache
  - Playwright browsers
  - Turbo cache
  - Test results

## 🚀 Next Steps

1. Review and approve this design
2. Create GitHub issues for implementation tasks
3. Set up staging environment in Vercel
4. Configure branch protection rules
5. Implement Phase 1 workflows
6. Gradually roll out remaining phases

## 📋 Implementation with GitHub Issues

### What are implementation tickets?

Implementation "tickets" refer to **GitHub Issues** - these are tasks that track work items in your repository. Each issue represents a specific piece of work that needs to be completed.

### GitHub Issues Structure:

1. **Title**: Clear, actionable description
2. **Labels**: `ci/cd`, `infrastructure`, `testing`, etc.
3. **Assignee**: Team member responsible
4. **Milestone**: Week 1, Week 2, etc.
5. **Description**: Detailed requirements and acceptance criteria

### Example GitHub Issues for Week 1:

**Issue #1: Configure Branch Protection Rules**

```markdown
## Description

Set up branch protection rules for main, staging, and dev branches

## Acceptance Criteria

- [ ] Main branch requires 2 reviews
- [ ] Staging branch requires 1 review
- [ ] All branches require status checks to pass
- [ ] Enforce linear history
- [ ] Dismiss stale reviews on new commits

## Resources

- GitHub Docs: Branch Protection
```

**Issue #2: Set Up Vercel Staging Environment**

```markdown
## Description

Create and configure staging environment in Vercel

## Acceptance Criteria

- [ ] Create staging.slideheroes.com subdomain
- [ ] Link to staging branch
- [ ] Configure environment variables
- [ ] Set up preview protection
- [ ] Test deployment pipeline

## Dependencies

- Access to Vercel team account
- DNS configuration access
```

**Issue #3: Create Base GitHub Actions Workflow**

```markdown
## Description

Create foundational CI/CD workflow for PR validation

## Acceptance Criteria

- [ ] Workflow triggers on PR open/update
- [ ] Runs Biome linting and formatting
- [ ] Runs TypeScript compilation
- [ ] Caches dependencies with pnpm
- [ ] Reports status to PR

## Technical Details

- Use workflow path: .github/workflows/pr-validation.yml
- Implement job matrix for parallel execution
```

### Using GitHub Projects

Consider creating a **GitHub Project** board with columns:

- **Backlog**: All planned work
- **Ready**: Issues ready to start
- **In Progress**: Active development
- **Review**: In code review
- **Done**: Completed and merged

### Issue Templates

Create `.github/ISSUE_TEMPLATE/cicd-task.md`:

```yaml
---
name: CI/CD Task
about: Template for CI/CD implementation tasks
title: '[CI/CD] '
labels: 'ci/cd'
assignees: ''
---

## Description
Brief description of what needs to be done

## Acceptance Criteria
- [ ] Specific measurable outcome
- [ ] Another measurable outcome

## Technical Details
Any specific technical requirements

## Dependencies
List any blocking dependencies

## Testing
How to verify this works correctly
```

This design provides a robust, scalable CI/CD pipeline that balances speed with quality, security, and reliability.
