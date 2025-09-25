# CI/CD Troubleshooting Guide

## Overview

This guide provides solutions for common CI/CD issues, debugging techniques, and escalation procedures for the
SlideHeroes deployment pipeline.

## Quick Diagnostics

### Pipeline Status Check

```bash
# Check current workflow status
gh run list --limit 10

# View specific workflow run
gh run view $RUN_ID

# Download logs for offline analysis
gh run download $RUN_ID
```

### Environment Health Check

```bash
# Development
curl -f https://dev.slideheroes.com/api/health

# Staging
curl -f https://staging.slideheroes.com/api/health

# Production
curl -f https://slideheroes.com/api/health
```

## Common Issues and Solutions

### 1. Build Failures

#### TypeScript Compilation Errors

**Symptoms**:

```text
error TS2307: Cannot find module '@/components/ui/button'
error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'
```

**Diagnosis**:

```bash
# Check TypeScript configuration
pnpm typecheck

# Verify path mappings
cat tsconfig.json | grep "paths" -A 10

# Check for missing dependencies
pnpm why @types/node
```

**Solutions**:

```bash
# Fix import paths
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "incorrect-import"

# Update TypeScript configuration
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"]
    }
  }
}

# Reinstall dependencies
rm -rf node_modules .pnpm-store
pnpm install
```

#### Linting Failures

**Symptoms**:

```text
error: Expected 2 spaces but received 4 spaces (indent)
error: Missing semicolon (semi)
```

**Solutions**:

```bash
# Auto-fix linting issues
pnpm biome format . --write
pnpm biome lint . --apply

# Check specific files
pnpm biome check path/to/file.ts

# Update Biome configuration
{
  "formatter": {
    "indentStyle": "space",
    "indentSize": 2
  },
  "linter": {
    "rules": {
      "recommended": true
    }
  }
}
```

#### Dependency Installation Issues

**Symptoms**:

```text
ERR_PNPM_OUTDATED_LOCKFILE
WARN deprecated package@1.0.0
```

**Solutions**:

```bash
# Update lockfile
pnpm install --fix-lockfile

# Clear cache and reinstall
pnpm store prune
rm -rf node_modules
pnpm install

# Check for conflicting versions
pnpm why package-name
pnpm audit --fix
```

### 2. Test Failures

#### Unit Test Failures

**Symptoms**:

```text
FAIL src/components/Button.test.tsx
Expected: "Submit"
Received: "Loading..."
```

**Diagnosis**:

```bash
# Run tests locally
pnpm test

# Run specific test file
pnpm test Button.test.tsx

# Debug test with verbose output
pnpm test --verbose --no-coverage
```

**Solutions**:

```bash
# Update test snapshots
pnpm test --updateSnapshot

# Fix async test issues
test('async operation', async () => {
  await waitFor(() => {
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });
});

# Mock external dependencies
vi.mock('@/lib/api', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: 'mock' })
}));
```

#### E2E Test Failures

**Symptoms**:

```text
TimeoutError: locator.click() timed out after 30000ms
Error: expect(page).toHaveTitle() timeout exceeded
```

**Diagnosis**:

```bash
# Run E2E tests locally
pnpm run supabase:web:start
pnpm test:e2e --headed

# Debug specific test
pnpm test:e2e --debug auth.spec.ts

# Generate test report
pnpm test:e2e --reporter=html
```

**Solutions**:

```bash
# Increase timeouts
test.setTimeout(60000);

# Add wait conditions
await page.waitForLoadState('networkidle');
await page.waitForSelector('[data-testid="submit-button"]');

# Use more stable selectors
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByTestId('login-form').fill('email@example.com');

# Fix race conditions
await page.route('**/api/auth/**', (route) => {
  route.fulfill({ status: 200, body: '{"success": true}' });
});
```

### 3. Deployment Issues

#### Vercel Deployment Failures

**Symptoms**:

```text
Error: Build failed with exit code 1
Error: Function timeout (60s) exceeded
```

**Diagnosis**:

```bash
# Check Vercel logs
vercel logs https://deployment-url --token=$VERCEL_TOKEN

# Inspect build output
vercel build --debug

# Verify environment variables
vercel env ls
```

**Solutions**:

```bash
# Optimize build performance
{
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs",
  "nodeVersion": "20.x"
}

# Increase function timeout
export const config = {
  maxDuration: 60, // seconds
};

# Fix environment variable issues
vercel env add NEXT_PUBLIC_API_URL production
vercel env add DATABASE_URL production

# Deploy with specific Node.js version
vercel --node-version 20.x
```

#### GitHub Actions Workflow Failures

**Symptoms**:

```text
Error: Process completed with exit code 1
Error: Unable to resolve action `actions/setup-node@v5`
```

**Diagnosis**:

```bash
# Check workflow syntax
gh workflow view pr-validation.yml

# Validate workflow file
yamllint .github/workflows/pr-validation.yml

# Check action versions
gh api /repos/actions/setup-node/releases/latest
```

**Solutions**:

```bash
# Fix action versions
- uses: actions/setup-node@v4  # Use stable version
  with:
    node-version: '20'
    cache: 'pnpm'

# Add error handling
- name: Build application
  run: pnpm build
  continue-on-error: false

# Fix environment variables
env:
  NODE_ENV: production
  VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}

# Debug workflow issues
- name: Debug info
  run: |
    echo "Node version: $(node --version)"
    echo "Pnpm version: $(pnpm --version)"
    echo "Working directory: $(pwd)"
    ls -la
```

### 4. Environment-Specific Issues

#### Development Environment

**Issue**: Dev environment not updating after deployment

**Solutions**:

```bash
# Check deployment status
vercel ls --scope team-name

# Force redeploy
git commit --allow-empty -m "Force redeploy"
git push origin dev

# Clear browser cache
# Clear Vercel edge cache
vercel --prod --force
```

#### Staging Environment

**Issue**: Staging deployment succeeds but application is broken

**Solutions**:

```bash
# Check staging-specific environment variables
vercel env ls --environment=staging

# Compare with working environment
diff <(vercel env ls --environment=development) <(vercel env ls --environment=staging)

# Test with production build locally
vercel dev --environment=staging
```

#### Production Environment

**Issue**: Production deployment failed health checks

**Solutions**:

```bash
# Check health endpoint
curl -v https://slideheroes.com/api/health

# Verify database connectivity
curl -v https://slideheroes.com/api/healthcheck

# Rollback if necessary
vercel rollback --token=$VERCEL_TOKEN

# Create incident issue
gh issue create --title "PRODUCTION: Health check failure" \
  --body "Deployment failed health checks at $(date)"
```

## Advanced Debugging

### Workflow Debugging

#### Enable Debug Logging

```yaml
# In workflow file
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true
```

#### SSH into Runner

```yaml
- name: Setup upterm session
  uses: lhotari/action-upterm@v1
  if: failure()
```

#### Artifact Analysis

```bash
# Download build artifacts
gh run download $RUN_ID

# Analyze build output
unzip playwright-report.zip
open playwright-report/index.html

# Check test results
cat test-results.xml
```

### Performance Debugging

#### Build Performance

```bash
# Analyze bundle size
pnpm build --analyze

# Check build cache effectiveness
TURBO_DRY_RUN=1 pnpm build

# Profile build process
time pnpm build
```

#### Runtime Performance

```bash
# Check Core Web Vitals
lighthouse https://slideheroes.com --only-categories=performance

# Monitor API performance
curl -w "@curl-format.txt" -s -o /dev/null https://slideheroes.com/api/health

# Database query analysis
echo "SELECT * FROM pg_stat_activity;" | psql $DATABASE_URL
```

### Security Debugging

#### Secret Detection

```bash
# Scan for secrets
trufflehog git file://. --only-verified

# Check for exposed API keys
grep -r "sk_live_" . --exclude-dir=node_modules
grep -r "pk_live_" . --exclude-dir=node_modules
```

#### Dependency Vulnerabilities

```bash
# Audit dependencies
pnpm audit --audit-level high

# Check for known vulnerabilities
snyk test

# Update vulnerable packages
pnpm update
```

## Monitoring and Alerts

### Real-time Monitoring

#### Deployment Status

```bash
# Watch deployment progress
watch -n 30 'gh run list --limit 5'

# Monitor health endpoints
watch -n 60 'curl -s https://slideheroes.com/api/health | jq'
```

#### Performance Monitoring

```bash
# Monitor response times
for i in {1..10}; do
  curl -w "%{time_total}\n" -s -o /dev/null https://slideheroes.com
  sleep 5
done

# Check error rates
curl -s "https://api.newrelic.com/v2/applications/$APP_ID/metrics/data.json" \
  -H "X-Api-Key: $NEW_RELIC_API_KEY"
```

### Alert Configurations

#### GitHub Actions Alerts

```yaml
# Slack notification on failure
- name: Notify Slack on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

#### Vercel Alerts

```json
{
  "alerts": [
    {
      "name": "High Error Rate",
      "condition": "error_rate > 5%",
      "duration": "5m"
    },
    {
      "name": "Slow Response Time",
      "condition": "response_time > 2s",
      "duration": "10m"
    }
  ]
}
```

## Emergency Procedures

### Production Incident Response

#### Immediate Actions (0-5 minutes)

1. **Assess Impact**:

   ```bash
   # Check error rates
   curl https://slideheroes.com/api/health

   # Verify key functionality
   curl https://slideheroes.com/api/auth/session
   ```

2. **Rollback Decision**:

   ```bash
   # If deployment-related, rollback immediately
   vercel rollback --token=$VERCEL_TOKEN

   # Verify rollback success
   curl https://slideheroes.com/api/health
   ```

3. **Communication**:

   ```bash
   # Create incident issue
   gh issue create --title "INCIDENT: Production down" \
     --label "incident,production,urgent"

   # Notify team
   echo "Production incident detected at $(date)" | \
     slack-cli -c #incidents
   ```

#### Investigation Phase (5-30 minutes)

1. **Log Analysis**:

   ```bash
   # Check deployment logs
   vercel logs https://slideheroes.com --since=1h

   # Review error tracking
   curl "https://api.newrelic.com/v2/applications/$APP_ID/errors.json"
   ```

2. **Root Cause Analysis**:

   ```bash
   # Compare with last known good state
   git diff $(git describe --tags --abbrev=0) HEAD

   # Check recent changes
   git log --oneline -10
   ```

#### Resolution Phase (30+ minutes)

1. **Fix Implementation**:

   ```bash
   # Create hotfix branch
   git checkout -b hotfix/incident-fix

   # Implement fix
   # ... make changes ...

   # Test fix locally
   pnpm build && pnpm start
   ```

2. **Deployment**:

   ```bash
   # Emergency deployment
   git push origin hotfix/incident-fix

   # Create emergency PR
   gh pr create --base main --title "HOTFIX: Critical incident fix"
   ```

### Rollback Procedures

#### Automated Rollback

```bash
# Vercel automatic rollback
vercel rollback --token=$VERCEL_TOKEN

# GitHub revert
git revert $COMMIT_SHA
git push origin main
```

#### Manual Rollback

```bash
# Find last known good deployment
vercel ls --limit 10

# Promote previous deployment
vercel promote $DEPLOYMENT_ID --token=$VERCEL_TOKEN

# Verify rollback
curl https://slideheroes.com/api/health
```

### Communication Templates

#### Incident Notification

```markdown
🚨 **PRODUCTION INCIDENT**

**Status**: Investigating
**Impact**: [High/Medium/Low]
**Affected**: [Users/Features]
**Started**: [Timestamp]

**Initial Assessment**:

- [Brief description]

**Actions Taken**:

- [List of immediate actions]

**Next Update**: [Timestamp]
```

#### Resolution Notification

```markdown
✅ **INCIDENT RESOLVED**

**Duration**: [Total time]
**Root Cause**: [Brief explanation]
**Resolution**: [What was done]

**Follow-up Actions**:

- [ ] Post-mortem scheduled
- [ ] Monitoring improvements
- [ ] Prevention measures

**Thank you for your patience.**
```

## Prevention Strategies

### Proactive Monitoring

#### Synthetic Testing

```yaml
# Add to workflow
- name: Synthetic tests
  run: |
    # Test critical user paths
    curl -f $DEPLOYMENT_URL/api/auth/signin
    curl -f $DEPLOYMENT_URL/api/courses
    curl -f $DEPLOYMENT_URL/api/payments/plans
```

#### Performance Budgets

```json
{
  "budgets": [
    {
      "path": "/**",
      "timings": [
        {
          "metric": "first-contentful-paint",
          "budget": 2000
        },
        {
          "metric": "largest-contentful-paint",
          "budget": 4000
        }
      ]
    }
  ]
}
```

### Code Quality Gates

#### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "pnpm typecheck && pnpm test"
    }
  }
}
```

#### Branch Protection

```yaml
protection_rules:
  required_status_checks:
    strict: true
    contexts:
      - 'typecheck'
      - 'lint'
      - 'test'
      - 'security-scan'
```

## Escalation Procedures

### Severity Levels

#### P0 - Critical (Production Down)

- **Response Time**: Immediate (0-15 minutes)
- **Escalation**: All hands, CEO notification
- **Communication**: Public status page update

#### P1 - High (Major Feature Broken)

- **Response Time**: 1 hour
- **Escalation**: Engineering team lead
- **Communication**: Internal team notification

#### P2 - Medium (Minor Feature Issues)

- **Response Time**: 4 hours
- **Escalation**: Standard team process
- **Communication**: Regular team channels

#### P3 - Low (Non-critical Issues)

- **Response Time**: Next business day
- **Escalation**: Regular triage process
- **Communication**: Issue tracking only

### Contact Information

```bash
# Emergency contacts
ONCALL_ENGINEER="@engineer-on-call"
TEAM_LEAD="@team-lead"
DEVOPS_TEAM="@devops"

# Notification channels
SLACK_INCIDENTS="#incidents"
SLACK_ENGINEERING="#engineering"
EMAIL_ALERTS="alerts@slideheroes.com"
```

## Continuous Improvement

### Post-Incident Reviews

#### Review Template

```markdown
# Post-Incident Review: [Date]

## Summary

- **Duration**: [Start] to [End]
- **Impact**: [Description]
- **Root Cause**: [Technical cause]

## Timeline

- [Time]: [Event]
- [Time]: [Action taken]

## What Went Well

- [Positive aspects]

## What Could Be Improved

- [Areas for improvement]

## Action Items

- [ ] [Specific action with owner and due date]
```

### Metrics Tracking

#### Deployment Metrics

```bash
# Track key metrics
DEPLOYMENT_FREQUENCY="daily"
LEAD_TIME="<2 weeks"
MTTR="<10 minutes"
CHANGE_FAILURE_RATE="<5%"
```

---

_This troubleshooting guide is updated based on real incidents and team learnings._
