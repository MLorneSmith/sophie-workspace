# Test Type Mapping to CI/CD Pipeline Stages

This document defines which test types are required at each CI/CD pipeline stage and their scoring weights for intelligent test selection.

## Pipeline Stage Overview

```
PR → Dev Branch → Staging → Production
```

## Stage 1: Pull Request Validation

**Goal**: Catch issues before code merge, fast feedback
**Time Budget**: 5-10 minutes max

### Required Tests (High Priority Scoring)
- **Unit Tests**: 15 points
  - **Requirement**: MANDATORY for all PRs
  - **Coverage**: New/modified code must have tests
  - **Focus**: Business logic, pure functions, critical calculations
  - **Failure**: Block merge

- **Accessibility Tests**: 12 points (UI changes only)
  - **Requirement**: Required for any UI component changes
  - **Coverage**: WCAG 2.1 AA compliance for modified components
  - **Focus**: Keyboard navigation, ARIA labels, color contrast
  - **Failure**: Block merge for accessibility regressions

- **Security Tests**: 10 points
  - **Requirement**: Automated scans (TruffleHog, Snyk)
  - **Coverage**: Secret detection, vulnerability scanning
  - **Focus**: No hardcoded secrets, known CVEs
  - **Failure**: Block merge for critical security issues

### Optional Tests (Lower Priority Scoring)
- **Integration Tests**: 8 points (API changes only)
  - **Requirement**: Required for API route modifications
  - **Coverage**: Modified endpoints only
  - **Focus**: Request/response validation, auth checks
  - **Failure**: Warning only, allow merge with manual review

- **E2E Tests**: 5 points (smoke tests only)
  - **Requirement**: Basic smoke tests for critical paths
  - **Coverage**: Login, core navigation, basic functionality
  - **Focus**: Nothing is completely broken
  - **Failure**: Warning only, investigate in dev

- **Performance Tests**: 3 points
  - **Requirement**: Not required for PR validation
  - **Coverage**: Bundle size checks only
  - **Focus**: Prevent massive bundle increases
  - **Failure**: Warning only

## Stage 2: Dev Branch Deployment

**Goal**: Validate feature integration, prepare for staging
**Time Budget**: 15-20 minutes

### Required Tests (High Priority Scoring)
- **Integration Tests**: 12 points
  - **Requirement**: Test service interactions
  - **Coverage**: All API endpoints, database operations, external services
  - **Focus**: Data flow, service communication, auth flows
  - **Failure**: Block staging deployment

- **E2E Tests**: 10 points (core workflows)
  - **Requirement**: Critical user journeys
  - **Coverage**: AI Canvas workflow, Course completion, Payment flow
  - **Focus**: Happy path user scenarios
  - **Failure**: Block staging deployment

- **Unit Tests**: 8 points
  - **Requirement**: Comprehensive coverage
  - **Coverage**: All business logic, edge cases
  - **Focus**: Regression prevention
  - **Failure**: Block staging deployment

### Important Tests (Medium Priority Scoring)
- **Accessibility Tests**: 8 points
  - **Requirement**: Full component testing
  - **Coverage**: All UI components, interaction patterns
  - **Focus**: Complete WCAG compliance
  - **Failure**: Block staging for critical accessibility issues

- **Security Tests**: 6 points
  - **Requirement**: Deeper security scans
  - **Coverage**: Penetration testing prep, auth flows
  - **Focus**: SQL injection, XSS, CSRF protection
  - **Failure**: Block staging for security vulnerabilities

- **Performance Tests**: 5 points
  - **Requirement**: Basic benchmarks
  - **Coverage**: Page load times, API response times
  - **Focus**: No performance regressions
  - **Failure**: Warning, monitor for trends

## Stage 3: Staging Deployment

**Goal**: Production readiness validation, final testing
**Time Budget**: 30-45 minutes

### Required Tests (High Priority Scoring)
- **E2E Tests**: 15 points (full suite)
  - **Requirement**: Complete user journey testing
  - **Coverage**: All critical workflows, edge cases, error scenarios
  - **Focus**: Production-like environment testing
  - **Failure**: Block production deployment

- **Performance Tests**: 12 points
  - **Requirement**: Core Web Vitals validation
  - **Coverage**: LCP, FID, CLS, load testing
  - **Focus**: Performance budgets, scalability
  - **Failure**: Block production deployment

- **Accessibility Tests**: 10 points
  - **Requirement**: WCAG compliance validation
  - **Coverage**: Complete accessibility audit
  - **Focus**: Legal compliance, usability
  - **Failure**: Block production for compliance issues

### Important Tests (Medium Priority Scoring)
- **Integration Tests**: 10 points
  - **Requirement**: Cross-service testing
  - **Coverage**: External integrations, payment processing
  - **Focus**: Third-party service integration
  - **Failure**: Block production deployment

- **Security Tests**: 8 points
  - **Requirement**: Penetration testing
  - **Coverage**: Production security posture
  - **Focus**: Data security, privacy compliance
  - **Failure**: Block production for security issues

- **Unit Tests**: 8 points
  - **Requirement**: Regression prevention
  - **Coverage**: Complete test suite execution
  - **Focus**: Code quality, edge case coverage
  - **Failure**: Block production deployment

## Stage 4: Production Deployment

**Goal**: Final validation, monitoring setup
**Time Budget**: 10-15 minutes

### Required Tests (Critical Priority Scoring)
- **All Test Types Must Pass**: 15 points each
  - **Requirement**: No test failures allowed
  - **Coverage**: Complete test suite
  - **Focus**: Zero defect deployment
  - **Failure**: Block production deployment

- **Performance Tests**: 15 points (production load)
  - **Requirement**: Production load validation
  - **Coverage**: Real traffic simulation, stress testing
  - **Focus**: Production capacity, bottleneck identification
  - **Failure**: Block deployment or immediate rollback

- **Security Tests**: 15 points (final audit)
  - **Requirement**: Final security validation
  - **Coverage**: Production security configuration
  - **Focus**: Data protection, compliance verification
  - **Failure**: Block deployment

- **Monitoring Tests**: 10 points
  - **Requirement**: Observability validation
  - **Coverage**: Logging, metrics, alerting functionality
  - **Focus**: Operational readiness
  - **Failure**: Warning, monitor deployment closely

## Test Dependency Requirements

### Unit Tests (Foundation)
- **Depends on**: None (foundation level)
- **Enables**: All other test types
- **Prerequisite for**: Integration tests, E2E tests
- **Scoring impact**: +3 points when enabling other tests

### Integration Tests
- **Depends on**: Unit tests (recommended)
- **Enables**: E2E tests, Performance tests
- **Prerequisite for**: Production-ready E2E tests
- **Scoring impact**: +2 points when unit tests exist, -2 when missing

### E2E Tests
- **Depends on**: Unit tests + Integration tests (recommended)
- **Enables**: Production deployment confidence
- **Prerequisite for**: Performance testing accuracy
- **Scoring impact**: +2 points when prerequisites met, -1 when missing

### Accessibility Tests
- **Depends on**: Unit tests for components (recommended)
- **Enables**: Legal compliance, user experience validation
- **Prerequisite for**: Production deployment (UI components)
- **Scoring impact**: +2 points for legal compliance areas

### Performance Tests
- **Depends on**: E2E tests (for realistic scenarios)
- **Enables**: Production scalability validation
- **Prerequisite for**: Production deployment
- **Scoring impact**: +3 points for revenue-critical performance

## Intelligent Test Selection by Stage

### Algorithm Enhancement for CI/CD Stages

```typescript
function getCiCdStageRequirements(file: string, testType: string, stage: string): number {
  const stageWeights = {
    pr: {
      unit: 15,
      accessibility: 12, // UI changes only
      security: 10,
      integration: 8,    // API changes only
      e2e: 5,           // Smoke tests only
      performance: 3
    },
    dev: {
      integration: 12,
      e2e: 10,          // Core workflows
      unit: 8,
      accessibility: 8,
      security: 6,
      performance: 5
    },
    staging: {
      e2e: 15,          // Full suite
      performance: 12,   // Core Web Vitals
      accessibility: 10, // WCAG compliance
      integration: 10,   // Cross-service
      security: 8,       // Penetration testing
      unit: 8
    },
    production: {
      performance: 15,   // Production load
      security: 15,      // Final audit
      e2e: 15,          // All must pass
      integration: 15,   // All must pass
      accessibility: 15, // All must pass
      unit: 15          // All must pass
    }
  };
  
  return stageWeights[stage]?.[testType] || 0;
}
```

## Usage in /write-tests Command

The command will:
1. **Detect current CI/CD stage** from git branch and environment
2. **Apply stage-appropriate scoring** to prioritize tests needed for next deployment
3. **Respect test dependencies** by boosting prerequisite tests
4. **Show stage context** in selection rationale

Example:
```bash
$ /write-tests

Context: Preparing for staging deployment
Stage requirements: E2E tests (15 pts), Performance (12 pts)

🎯 Selected: E2E test for AI Canvas workflow
Reason: Staging deployment requires E2E validation + P1 priority
```

---
*This mapping ensures tests are prioritized based on actual CI/CD pipeline needs*