# Promote to Staging

Promote changes from the dev branch to staging branch following the GitOps CI/CD pipeline.

## Overview

This command follows the SlideHeroes CI/CD pipeline design:

- **dev** → **staging** via Pull Request
- Triggers full test suite including E2E tests
- Deploys to staging.slideheroes.com
- Follows branch protection rules

## Steps

1. **Verify Current State:**

   ```bash
   # Confirm we're on dev branch
   git branch --show-current

   # Check if dev is up to date with origin
   git status

   # View recent commits that will be promoted
   git log --oneline origin/staging..HEAD
   ```

2. **Create Staging Branch (if needed):**

   ```bash
   # Check if staging branch exists locally
   git branch | grep staging || git checkout -b staging origin/staging
   ```

3. **Create Pull Request to Staging:**
   ```bash
   # Create PR from dev to staging using GitHub CLI
   gh pr create \
     --base staging \
     --head dev \
     --title "Promote dev to staging - $(date +%Y-%m-%d)" \
     --body "$(cat <<'EOF'
   ```

## Summary

Promoting development changes to staging environment for pre-production testing.

### Changes Included

$(git log --oneline origin/staging..origin/dev --pretty=format:"- %s")

### Pre-deployment Checklist

- [ ] All dev tests passing
- [ ] TypeScript compilation successful
- [ ] Bundle size within limits
- [ ] Security scans clean

### Testing Plan

- [ ] E2E test suite will run automatically
- [ ] Smoke tests on staging deployment
- [ ] Performance tests via pipeline
- [ ] Manual QA review if needed

### Deployment Impact

- **Environment**: staging.slideheroes.com
- **Downtime**: None expected (zero-downtime deployment)
- **Rollback Plan**: Automatic via Vercel if health checks fail

🤖 Generated with [Claude Code](https://claude.ai/code)
EOF
)" \
 --assignee @me \
 --label "staging,deployment"

````

4. **Monitor PR Status:**
```bash
# Get PR number and check status
PR_NUMBER=$(gh pr list --base staging --head dev --json number --jq '.[0].number')
echo "Created PR #$PR_NUMBER"

# Watch PR checks
gh pr checks $PR_NUMBER --watch
````

5. **Auto-merge when Ready (Optional):**

   ```bash
   # Enable auto-merge if all checks pass
   gh pr merge $PR_NUMBER --auto --squash --delete-branch=false
   ```

6. **Manual Merge (Alternative):**
   ```bash
   # Or merge manually after review
   echo "To merge manually:"
   echo "gh pr merge $PR_NUMBER --squash"
   echo "Or use the GitHub UI: https://github.com/MLorneSmith/2025slideheroes/pull/$PR_NUMBER"
   ```

## Pipeline Behavior

When the PR is merged to staging:

1. **Triggers**: `.github/workflows/staging-deploy.yml`
2. **Jobs Executed**:
   - PR validation (lint, format, typecheck)
   - Full E2E test suite (Playwright)
   - Bundle size analysis
   - Security scans
   - Vercel staging deployment
   - Smoke tests post-deployment
   - Performance tests

3. **Deployment Target**: `staging.slideheroes.com`
4. **Monitoring**: New Relic deployment markers

## Quality Gates

The staging deployment requires:

- ✅ All CI checks passing
- ✅ TypeScript compilation successful
- ✅ Bundle size within budget
- ✅ E2E tests passing
- ✅ Security scans clean
- ✅ No critical vulnerabilities

## Troubleshooting

If the PR fails:

1. **Check CI logs**:

   ```bash
   gh pr checks $PR_NUMBER --watch
   ```

2. **View specific failure**:

   ```bash
   gh run list --branch dev --limit 1
   gh run view [RUN_ID]
   ```

3. **Fix issues and re-run**:
   ```bash
   # Push fixes to dev branch
   git push origin dev
   # The PR will auto-update and re-run checks
   ```

## Notes

- This follows the GitOps principle: all environment changes via Git
- Staging deployments are automatic when PR is merged
- Branch protection rules ensure code quality
- Use `--draft` flag for WIP PRs: `gh pr create --draft`
- Manual approval may be required based on branch protection settings

## Related Commands

- `/code-check` - Run full code quality checks before promoting
- `/create-hotfix` - For emergency fixes bypassing normal flow
- `/rollback-staging` - Rollback staging if issues found

## Success Criteria

✅ PR created and linked to staging branch
✅ All automated checks passing  
✅ Deployment successful to staging.slideheroes.com
✅ Post-deployment smoke tests passing
✅ Monitoring alerts configured
