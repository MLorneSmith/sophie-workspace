# Promote to Production

Promote changes from the staging branch to production (main) branch following the GitOps CI/CD pipeline.

## Overview

This command follows the SlideHeroes CI/CD pipeline design:

- **staging** → **main** via Pull Request
- Triggers production deployment to slideheroes.com
- Includes safety checks and rollback procedures
- Follows branch protection rules

## Pre-requisites

Before promoting to production:

- ✅ Staging deployment successful at staging.slideheroes.com
- ✅ All E2E tests passed on staging
- ✅ Performance tests passed
- ✅ Manual QA completed (if required)
- ✅ No critical issues in monitoring

## Steps

1. **Verify Current State:**

   ```bash
   # Confirm we're on a safe branch
   git branch --show-current

   # Check staging deployment status
   echo "Verify staging is healthy at: https://staging.slideheroes.com"

   # View recent commits on staging
   git log --oneline origin/main..origin/staging --max-count=20
   ```

2. **Check Production Deployment Window:**

   ```bash
   # Display current time and deployment windows
   echo "Current time: $(date)"
   echo "Preferred deployment windows:"
   echo "- Weekdays: 10 AM - 4 PM (avoid lunch 12-1 PM)"
   echo "- Avoid: Fridays after 3 PM, weekends, holidays"
   ```

3. **Create Pull Request to Production:**
   ```bash
   # Create PR from staging to main using GitHub CLI
   gh pr create \
     --base main \
     --head staging \
     --title "Deploy to Production - $(date +%Y-%m-%d)" \
     --body "$(cat <<'EOF'
   ```

## Summary

Promoting staging changes to production after successful testing and validation.

### Changes Included

$(git log --oneline origin/main..origin/staging --pretty=format:"- %s" | head -20)

### Pre-deployment Checklist

- [ ] Staging deployment verified at staging.slideheroes.com
- [ ] All automated tests passed
- [ ] Performance metrics within acceptable range
- [ ] Security scans completed
- [ ] Manual QA sign-off (if applicable)
- [ ] Deployment window confirmed

### Testing Completed

- ✅ Unit tests
- ✅ Integration tests
- ✅ E2E test suite
- ✅ Performance tests
- ✅ Accessibility tests
- ✅ Security scans

### Deployment Impact

- **Environment**: slideheroes.com (production)
- **Downtime**: None expected (zero-downtime deployment)
- **Rollback Plan**: Automatic via Vercel on health check failure
- **Manual Rollback**: Revert this PR or use Vercel dashboard

### Post-deployment Monitoring

- New Relic: [Dashboard](https://one.newrelic.com)
- Vercel: [Deployment Status](https://vercel.com/slideheroes)
- Error Tracking: Monitor for 30 minutes post-deploy

🤖 Generated with [Claude Code](https://claude.ai/code)
EOF
)" \
 --assignee @me \
 --label "production,deployment"

````

4. **Monitor PR Status:**
```bash
# Get PR number and check status
PR_NUMBER=$(gh pr list --base main --head staging --json number --jq '.[0].number')
echo "Created PR #$PR_NUMBER"

# Watch PR checks
gh pr checks $PR_NUMBER --watch
````

5. **Request Reviews (if required):**

   ```bash
   # Request reviews from team members
   echo "Request reviews if needed:"
   echo "gh pr view $PR_NUMBER --web"
   ```

6. **Merge to Production:**

   ```bash
   # After approvals and checks pass
   echo "Once approved, merge with:"
   echo "gh pr merge $PR_NUMBER --squash --delete-branch=false"
   echo ""
   echo "Or enable auto-merge:"
   echo "gh pr merge $PR_NUMBER --auto --squash --delete-branch=false"
   ```

7. **Monitor Production Deployment:**

   ```bash
   # Watch deployment status
   echo "Monitor deployment at:"
   echo "- Vercel: https://vercel.com/slideheroes/2025slideheroes-web"
   echo "- Production: https://slideheroes.com"
   ```

8. **Post-deployment Verification:**
   ```bash
   # After deployment completes
   echo "Post-deployment checks:"
   echo "1. Visit https://slideheroes.com"
   echo "2. Check New Relic for errors"
   echo "3. Run smoke tests"
   echo "4. Monitor for 30 minutes"
   ```

## Pipeline Behavior

When the PR is merged to main:

1. **Triggers**: `.github/workflows/production-deploy.yml`
2. **Jobs Executed**:
   - Final security scan
   - Production build optimization
   - Vercel production deployment
   - Health checks
   - Automated rollback on failure
   - Monitoring notifications

3. **Deployment Target**: `slideheroes.com`
4. **Monitoring**:
   - New Relic deployment markers
   - Error rate monitoring
   - Performance tracking

## Quality Gates

Production deployment requires:

- ✅ All CI/CD checks passing
- ✅ 2 approval reviews (based on branch protection)
- ✅ No merge conflicts
- ✅ Deployment window check
- ✅ Manual QA sign-off (if configured)

## Rollback Procedures

### Automatic Rollback

- Vercel automatically rolls back if health checks fail
- Triggered by error rate thresholds

### Manual Rollback Options

1. **Via Vercel Dashboard**:

   ```bash
   echo "Go to: https://vercel.com/slideheroes/2025slideheroes-web"
   echo "Click on the previous successful deployment and promote it"
   ```

2. **Via Git Revert**:

   ```bash
   # Create a revert PR
   gh pr view $PR_NUMBER --json mergeCommit --jq '.mergeCommit.oid' | xargs git revert -m 1
   git push origin HEAD:revert-production-deployment
   gh pr create --base main --title "Revert Production Deployment"
   ```

3. **Emergency Hotfix**:
   ```bash
   # Use /create-hotfix command for critical fixes
   echo "For emergency fixes, use: /create-hotfix"
   ```

## Monitoring Checklist

After deployment:

1. **Immediate (0-5 minutes)**:
   - [ ] Site loads correctly
   - [ ] No console errors
   - [ ] API endpoints responding
   - [ ] Authentication working

2. **Short-term (5-30 minutes)**:
   - [ ] Error rate normal in New Relic
   - [ ] Performance metrics stable
   - [ ] No spike in 4xx/5xx errors
   - [ ] Database queries performing well

3. **Extended (30+ minutes)**:
   - [ ] User reports/feedback
   - [ ] Business metrics normal
   - [ ] No memory leaks
   - [ ] CDN cache functioning

## Troubleshooting

If deployment fails:

1. **Check GitHub Actions logs**:

   ```bash
   gh run list --workflow=production-deploy.yml --limit 1
   gh run view [RUN_ID]
   ```

2. **Check Vercel logs**:

   ```bash
   echo "View logs at: https://vercel.com/slideheroes/2025slideheroes-web"
   ```

3. **Check New Relic**:
   ```bash
   echo "Error details at: https://one.newrelic.com"
   ```

## Notes

- Always deploy during business hours when team is available
- Never deploy on Friday afternoons or before holidays
- Keep Slack/communication channels open during deployment
- Have rollback plan ready before merging
- Document any manual steps or exceptions

## Related Commands

- `/promote-to-staging` - Promote dev to staging
- `/create-hotfix` - Emergency production fixes
- `/rollback-production` - Detailed rollback procedures
- `/deployment-status` - Check all environment statuses

## Success Criteria

✅ PR created and merged to main  
✅ Production deployment successful
✅ Health checks passing
✅ No increase in error rates
✅ Performance metrics stable
✅ User experience verified
