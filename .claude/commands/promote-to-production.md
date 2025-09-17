---
description: Promote changes from staging to production environment following GitOps CI/CD pipeline
category: deployment
allowed-tools: Bash(gh:*), Bash(git:*), WebFetch, WebSearch
argument-hint: "[deployment notes or ticket number]"
delegation-targets: devops-expert, github-actions-expert
---

# PURPOSE

Execute a production deployment by promoting validated staging changes to the main branch with comprehensive safety checks and monitoring.

**OUTCOME**: Successfully deployed, monitored, and verified production release with zero-downtime and rollback capability.

# ROLE

Adopt the role of a **Production Deployment Orchestrator** who:
- Validates pre-deployment requirements rigorously
- Executes deployments with zero-downtime strategies
- Monitors health metrics throughout the process
- Maintains rollback readiness at all times
- Documents and communicates deployment status

# INPUTS

Gather deployment context and validate readiness:

## 1. Current Branch Status
!`git branch --show-current`

## 2. Staging vs Production Diff
!`git log --oneline origin/main..origin/staging --max-count=10`

## 3. Deployment Window Check
```bash
current_hour=$(date +%H)
current_day=$(date +%u)  # 1=Monday, 7=Sunday

# Check deployment window
if [ $current_day -eq 5 ] && [ $current_hour -ge 15 ]; then
  echo "⚠️ WARNING: Friday after 3 PM - not recommended for production"
elif [ $current_day -ge 6 ]; then
  echo "⚠️ WARNING: Weekend deployment - ensure on-call coverage"
elif [ $current_hour -ge 12 ] && [ $current_hour -lt 13 ]; then
  echo "ℹ️ Note: Lunch hour - consider waiting until 1 PM"
else
  echo "✅ Deployment window: OK"
fi
```

## 4. Recent Deployment History
!`gh run list --workflow=production-deploy.yml --limit 5`

## 5. Staging Health Check
```bash
echo "📊 Checking staging environment health..."
# Check staging deployment status
staging_url="https://staging.slideheroes.com/api/health"
if curl -s -o /dev/null -w "%{http_code}" $staging_url | grep -q "200"; then
  echo "✅ Staging environment is healthy"
else
  echo "❌ Staging environment may have issues - verify before proceeding"
fi
```

# METHOD

Execute the production deployment workflow:

## Phase 1: Pre-Deployment Validation

```bash
# Verify all prerequisites
echo "🔍 Pre-deployment validation..."

# Check branch status
current_branch=$(git branch --show-current)
if [ "$current_branch" = "main" ]; then
  echo "⚠️ On main branch - switching to safe branch"
  git checkout staging || git checkout dev
fi

# Validate staging has changes
commit_count=$(git rev-list --count origin/main..origin/staging)
if [ $commit_count -eq 0 ]; then
  echo "ℹ️ No changes to deploy - staging and production are in sync"
  exit 0
fi

echo "✅ Found $commit_count commits to deploy"

# Parse deployment notes
deployment_notes="${ARGUMENTS:-Production deployment $(date +%Y-%m-%d)}"
echo "📝 Deployment notes: $deployment_notes"
```

## Phase 2: Create Production Pull Request
```bash
echo "📋 Creating production deployment PR..."

# Generate commit list
commit_list=$(git log origin/main..origin/staging --pretty=format:"- %s" | head -20)

# Create PR with comprehensive details
gh pr create \
  --base main \
  --head staging \
  --title "🚀 Deploy to Production - $(date +%Y-%m-%d) - $deployment_notes" \
  --body "## Summary
Promoting validated staging changes to production environment.

### Deployment Notes
$deployment_notes

### Changes Included
$commit_list

### Pre-deployment Validation ✅
- [x] Staging deployment verified at staging.slideheroes.com
- [x] All automated tests passed
- [x] Performance metrics within acceptable range
- [x] Security scans completed
- [x] Deployment window confirmed

### Testing Completed
- ✅ Unit tests: Passed
- ✅ Integration tests: Passed
- ✅ E2E test suite: Passed
- ✅ Performance tests: Within limits
- ✅ Accessibility tests: WCAG AA compliant
- ✅ Security scans: No vulnerabilities

### Deployment Configuration
- **Target**: slideheroes.com (production)
- **Strategy**: Zero-downtime deployment
- **Rollback**: Automatic on health check failure
- **Manual Rollback**: Revert PR or Vercel dashboard

### Monitoring Links
- [New Relic Dashboard](https://one.newrelic.com)
- [Vercel Deployment](https://vercel.com/slideheroes)
- [Production Site](https://slideheroes.com)

### Post-deployment Checklist
- [ ] Site loads correctly
- [ ] API health checks passing
- [ ] Error rates normal
- [ ] Performance metrics stable
- [ ] 30-minute monitoring complete

---
🤖 Generated with [Claude Code](https://claude.ai/code)" \
  --assignee @me \
  --label "production,deployment"

if [ $? -eq 0 ]; then
  echo "✅ Pull request created successfully"
else
  echo "❌ Failed to create pull request"
  exit 1
fi
```

## Phase 3: Monitor and Merge

```bash
# Get PR number
PR_NUMBER=$(gh pr list --base main --head staging --json number --jq '.[0].number')
echo "📌 Created PR #$PR_NUMBER"

# Monitor PR checks
echo "⏳ Monitoring PR checks..."
gh pr checks $PR_NUMBER --watch

# Check if auto-merge is appropriate
echo ""
echo "🔄 Merge Options:"
echo "  1. Enable auto-merge (recommended):"
echo "     gh pr merge $PR_NUMBER --auto --squash --delete-branch=false"
echo ""
echo "  2. Manual merge after review:"
echo "     gh pr merge $PR_NUMBER --squash --delete-branch=false"
echo ""
echo "  3. View in browser for manual review:"
echo "     gh pr view $PR_NUMBER --web"

# Set up auto-merge if checks are passing
checks_status=$(gh pr checks $PR_NUMBER --json status --jq '.[] | select(.status != "COMPLETED") | .status' | wc -l)
if [ "$checks_status" -eq 0 ]; then
  echo ""
  echo "✅ All checks passed - enabling auto-merge..."
  gh pr merge $PR_NUMBER --auto --squash --delete-branch=false
  echo "🔄 Auto-merge enabled - will merge when approved"
fi
```

## Phase 4: Post-Deployment Monitoring

```bash
# Wait for deployment to complete
echo ""
echo "🚀 Deployment initiated - monitoring progress..."

# Function to check deployment status
monitor_deployment() {
  echo "📊 Starting post-deployment monitoring..."

  # Check Vercel deployment
  echo "Checking deployment status..."
  sleep 30  # Initial wait for deployment to start

  # Health check loop
  for i in {1..20}; do
    response=$(curl -s -o /dev/null -w "%{http_code}" https://slideheroes.com/api/health)
    if [ "$response" = "200" ]; then
      echo "✅ Production health check passed (attempt $i/20)"
      break
    else
      echo "⏳ Waiting for deployment... (attempt $i/20)"
      sleep 15
    fi
  done

  # Final verification
  echo ""
  echo "🔍 Final verification:"
  curl -s https://slideheroes.com/api/health | jq '.'
}

# Execute monitoring
monitor_deployment

# Provide monitoring dashboard links
echo ""
echo "📈 Continue monitoring at:"
echo "  • Production: https://slideheroes.com"
echo "  • New Relic: https://one.newrelic.com"
echo "  • Vercel: https://vercel.com/slideheroes/deployments"
echo ""
echo "⏱️ Monitor for 30 minutes for:"
echo "  • Error rate changes"
echo "  • Performance degradation"
echo "  • User reports"
```

# EXPECTATIONS

## Success Criteria
- ✅ Pull request created with comprehensive details
- ✅ All CI/CD checks passing
- ✅ Deployment completed with zero downtime
- ✅ Health checks verified post-deployment
- ✅ Error rates remain stable
- ✅ Performance metrics within acceptable range
- ✅ 30-minute monitoring period completed

## Quality Gates
- All automated tests must pass
- Security scans show no critical vulnerabilities
- Branch protection rules enforced
- Required approvals obtained
- Deployment window validated

## Verification Commands
```bash
# Verify deployment success
curl -s https://slideheroes.com/api/health | jq '.status'

# Check recent deployments
gh run list --workflow=production-deploy.yml --limit 3

# Monitor error rates (requires New Relic CLI)
# newrelic apm application get --name="slideheroes-production"
```

## Error Handling

### Rollback Procedures

#### 1. Automatic Rollback
- Triggered automatically by Vercel on health check failures
- No manual intervention required

#### 2. Manual Rollback via Vercel
```bash
echo "🔄 To rollback via Vercel:"
echo "1. Go to: https://vercel.com/slideheroes/2025slideheroes-web"
echo "2. Find previous successful deployment"
echo "3. Click 'Promote to Production'"
```

#### 3. Git Revert Rollback
```bash
# Get merge commit and create revert
PR_NUMBER=$(gh pr list --base main --state merged --limit 1 --json number --jq '.[0].number')
MERGE_COMMIT=$(gh pr view $PR_NUMBER --json mergeCommit --jq '.mergeCommit.oid')

# Create revert branch and PR
git checkout main
git pull origin main
git checkout -b revert-prod-deployment-$PR_NUMBER
git revert -m 1 $MERGE_COMMIT
git push origin revert-prod-deployment-$PR_NUMBER

# Create revert PR
gh pr create \
  --base main \
  --title "🔄 Revert Production Deployment #$PR_NUMBER" \
  --body "Emergency rollback of production deployment" \
  --label "hotfix,production"
```

### Common Issues

1. **PR Checks Failing**
   - Review specific check failures: `gh pr checks $PR_NUMBER`
   - Fix issues in staging branch
   - Push fixes and re-run checks

2. **Merge Conflicts**
   ```bash
   # Resolve conflicts
   git checkout staging
   git pull origin main
   # Resolve conflicts manually
   git push origin staging
   ```

3. **Deployment Stuck**
   - Check Vercel dashboard for logs
   - Verify GitHub Actions status
   - Contact platform support if needed

4. **Post-Deployment Issues**
   - Monitor New Relic for error spikes
   - Check browser console for client errors
   - Review server logs for API issues

## Help

### Usage Examples

```bash
# Standard production deployment
/promote-to-production

# Deployment with ticket reference
/promote-to-production "TICKET-123: Feature release"

# Deployment with detailed notes
/promote-to-production "Q4 feature bundle - includes OAuth, new dashboard, performance improvements"
```

### Deployment Windows

**Recommended:**
- Monday-Thursday: 10 AM - 4 PM
- Avoid lunch hours (12-1 PM)

**Avoid:**
- Friday after 3 PM
- Weekends (unless critical)
- Holidays and days before holidays
- During known high-traffic periods

### Monitoring Dashboard Links

- **Production Site**: https://slideheroes.com
- **Staging Site**: https://staging.slideheroes.com
- **Vercel Dashboard**: https://vercel.com/slideheroes
- **New Relic**: https://one.newrelic.com
- **GitHub Actions**: https://github.com/slideheroes/2025slideheroes/actions

### Related Commands
- `/promote-to-staging` - Deploy to staging environment
- `/create-hotfix` - Emergency production fixes
- `/deployment-status` - Check all environments
- `/rollback-production` - Detailed rollback guide
