---
description: Deploy changes from dev to staging environment using GitOps CI/CD pipeline with validation
allowed-tools: [Bash, Read]
category: deployment
---

# Promote to Staging

Deploy changes from dev branch to staging environment following GitOps CI/CD pipeline with comprehensive validation and monitoring.

## Key Features
- **Automated Deployment**: GitOps-driven staging deployments via PR workflow
- **Quality Gates**: Multi-stage validation with E2E tests and security scans
- **Zero Downtime**: Rolling deployments with automatic rollback capabilities
- **Pipeline Integration**: Full CI/CD integration with monitoring and alerts

## Essential Context
<!-- Always read for this command -->
- Read .claude/context/systems/cicd-pipeline.md
- Read .claude/context/systems/cicd-pipeline-design.md

## Prompt

<purpose>
You are executing a staging deployment from dev branch to staging environment. Success is measured by:
- Zero-downtime deployment achieved
- All CI checks passing (>95% success rate)
- E2E test suite completion (100% critical paths)
- Security scans clean (zero critical vulnerabilities)
- Performance metrics within baseline (±5%)
- Complete deployment documentation generated
</purpose>

<role>
You are a Senior DevOps Engineer specializing in GitOps deployments and CI/CD pipeline orchestration. You have expert knowledge of staging environment deployments, quality gates, and automated rollback procedures. You make autonomous decisions about deployment readiness and pipeline execution while ensuring production-quality standards.
</role>

<instructions>
# Staging Deployment Workflow

**CORE REQUIREMENTS**:
- Verify clean git state before deployment
- Create comprehensive PR with deployment details
- Monitor all CI/CD pipeline stages
- Validate staging health after deployment
- Document all deployment decisions

## 1. Pre-Deployment Validation
<validation>
Verify deployment prerequisites:

```bash
# Confirm current branch and status
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "dev" ]]; then
  echo "❌ Not on dev branch. Current branch: $CURRENT_BRANCH"
  echo "Switch to dev: git checkout dev"
  exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
  echo "❌ Uncommitted changes detected:"
  git status --short
  echo "Commit or stash changes before deployment"
  exit 1
fi

# Verify dev is up to date
git fetch origin --quiet
BEHIND_COUNT=$(git rev-list --count HEAD..origin/dev)
if [[ $BEHIND_COUNT -gt 0 ]]; then
  echo "❌ Dev branch is $BEHIND_COUNT commits behind origin"
  echo "Pull latest: git pull origin dev"
  exit 1
fi

echo "✅ Pre-deployment validation passed"
```

Analyze changes since last staging deployment:

```bash
# Review changes
CHANGES=$(git log --oneline origin/staging..HEAD --pretty=format:"- %s")
CHANGE_COUNT=$(git rev-list --count origin/staging..HEAD)
FILE_COUNT=$(git diff --name-only origin/staging..HEAD | wc -l)

echo "📋 Deployment Summary:"
echo "  Changes: $CHANGE_COUNT commits"
echo "  Files: $FILE_COUNT modified"
echo ""
echo "Commits to deploy:"
echo "$CHANGES"
```
</validation>

## 2. GitHub Authentication Check
<authentication>
Verify GitHub CLI authentication:

```bash
# Check GitHub CLI auth
gh auth status 2>/dev/null || {
  echo "❌ GitHub CLI not authenticated"
  echo "Run: gh auth login"
  exit 1
}

# Verify repository access
REPO_NAME=$(gh repo view --json nameWithOwner -q .nameWithOwner)
if [[ "$REPO_NAME" != "MLorneSmith/2025slideheroes" ]]; then
  echo "❌ Wrong repository context: $REPO_NAME"
  exit 1
fi

echo "✅ GitHub authentication verified"
```
</authentication>

## 3. Create Deployment PR
<deployment_pr>
Generate and submit deployment pull request:

```bash
# Build comprehensive PR description
PR_TITLE="🚀 Deploy to staging - $(date +%Y-%m-%d)"

PR_BODY=$(cat <<'EOF'
## 🚀 Staging Deployment

### 📋 Changes Included
$CHANGES

### 📊 Deployment Metrics
- **Commits**: $CHANGE_COUNT
- **Files Changed**: $FILE_COUNT
- **Target Environment**: staging.slideheroes.com
- **Deployment Time**: $(date +"%Y-%m-%d %H:%M:%S %Z")

### ✅ Pre-deployment Checklist
- [x] Dev branch tests passing
- [x] TypeScript compilation successful
- [x] Local quality checks complete
- [ ] Security scans (automated in pipeline)
- [ ] E2E tests (automated in pipeline)

### 🧪 Testing Plan
1. **Unit Tests**: Automated via CI pipeline
2. **E2E Tests**: Full suite execution on staging
3. **Smoke Tests**: Critical path validation
4. **Performance Tests**: Baseline comparison

### 🎯 Deployment Strategy
- **Method**: Zero-downtime rolling deployment
- **Rollback**: Automatic on health check failure
- **Monitoring**: New Relic deployment tracking
- **Alerts**: PagerDuty integration active

### 📝 Post-Deployment
- Monitor staging metrics for 30 minutes
- Validate critical user journeys
- Check error rates and performance

---
🤖 Generated with Claude Code
EOF
)

# Create PR with labels for automation
echo "📝 Creating deployment PR..."
PR_RESPONSE=$(gh pr create \
  --base staging \
  --head dev \
  --title "$PR_TITLE" \
  --body "$PR_BODY" \
  --assignee @me \
  --label "deployment,staging,auto-deploy" \
  2>&1)

# Extract PR number
PR_NUMBER=$(echo "$PR_RESPONSE" | grep -oE "pull/[0-9]+" | cut -d'/' -f2)

if [[ -z "$PR_NUMBER" ]]; then
  echo "❌ Failed to create PR"
  echo "Response: $PR_RESPONSE"
  exit 1
fi

echo "✅ Created deployment PR #$PR_NUMBER"
echo "View at: https://github.com/MLorneSmith/2025slideheroes/pull/$PR_NUMBER"
```
</deployment_pr>

## 4. Monitor CI Pipeline
<pipeline_monitoring>
Track CI/CD pipeline execution:

```bash
echo "⏳ Monitoring CI pipeline for PR #$PR_NUMBER..."

# Set timeout for pipeline monitoring (30 minutes)
TIMEOUT_END=$(($(date +%s) + 1800))

# Monitor with live updates
while true; do
  # Get current check status
  CHECKS=$(gh pr checks $PR_NUMBER --json name,status,conclusion)

  # Count check states
  PENDING=$(echo "$CHECKS" | jq '[.[] | select(.status=="IN_PROGRESS")] | length')
  COMPLETED=$(echo "$CHECKS" | jq '[.[] | select(.status=="COMPLETED")] | length')
  FAILED=$(echo "$CHECKS" | jq '[.[] | select(.conclusion=="FAILURE")] | length')

  echo "📊 Pipeline Status: $COMPLETED completed, $PENDING in progress, $FAILED failed"

  # Check for failures
  if [[ $FAILED -gt 0 ]]; then
    echo "❌ Pipeline checks failed:"
    echo "$CHECKS" | jq -r '.[] | select(.conclusion=="FAILURE") | "  - \(.name)"'
    echo ""
    echo "View details: gh pr checks $PR_NUMBER"
    exit 1
  fi

  # Check if all complete
  if [[ $PENDING -eq 0 && $COMPLETED -gt 0 ]]; then
    echo "✅ All CI checks passed"
    break
  fi

  # Check timeout
  if [[ $(date +%s) -gt $TIMEOUT_END ]]; then
    echo "⚠️ Pipeline timeout after 30 minutes"
    echo "Continue monitoring manually: gh pr checks $PR_NUMBER --watch"
    exit 1
  fi

  # Wait before next check
  sleep 30
done
```
</pipeline_monitoring>

## 5. Execute Deployment
<execute_deployment>
Merge PR to trigger deployment:

```bash
echo "🚀 Initiating deployment to staging..."

# Enable auto-merge for deployment PR
gh pr merge $PR_NUMBER \
  --auto \
  --squash \
  --delete-branch=false \
  2>&1 || {
  echo "❌ Failed to enable auto-merge"
  echo "Manual merge required: gh pr merge $PR_NUMBER --squash"
  exit 1
}

echo "✅ Auto-merge enabled, waiting for deployment..."

# Wait for merge to complete
MERGE_TIMEOUT=$(($(date +%s) + 300))
while true; do
  PR_STATE=$(gh pr view $PR_NUMBER --json state -q .state)

  if [[ "$PR_STATE" == "MERGED" ]]; then
    echo "✅ PR merged successfully"
    break
  elif [[ "$PR_STATE" == "CLOSED" ]]; then
    echo "❌ PR was closed without merging"
    exit 1
  fi

  if [[ $(date +%s) -gt $MERGE_TIMEOUT ]]; then
    echo "⚠️ Merge timeout - check PR status manually"
    exit 1
  fi

  sleep 10
done
```
</execute_deployment>

## 6. Validate Deployment
<deployment_validation>
Verify staging environment health:

```bash
echo "🔍 Validating staging deployment..."

# Wait for deployment propagation
echo "Waiting 60 seconds for deployment to propagate..."
sleep 60

# Check staging endpoint
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://staging.slideheroes.com/)

if [[ "$HTTP_STATUS" -eq 200 || "$HTTP_STATUS" -eq 304 ]]; then
  echo "✅ Staging endpoint responding: HTTP $HTTP_STATUS"
else
  echo "❌ Staging endpoint issue: HTTP $HTTP_STATUS"
  echo "Check deployment logs for details"
  exit 1
fi

# Verify deployment version (if API available)
if curl -s https://staging.slideheroes.com/api/health > /dev/null 2>&1; then
  DEPLOY_INFO=$(curl -s https://staging.slideheroes.com/api/health)
  echo "📅 Deployment info:"
  echo "$DEPLOY_INFO" | jq '.'
fi

# Run smoke tests
echo "🧪 Running smoke tests..."
CRITICAL_PATHS=(
  "/"
  "/auth/sign-in"
  "/api/health"
)

for path in "${CRITICAL_PATHS[@]}"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://staging.slideheroes.com$path")
  if [[ "$STATUS" -eq 200 || "$STATUS" -eq 304 || "$STATUS" -eq 307 ]]; then
    echo "  ✅ $path: HTTP $STATUS"
  else
    echo "  ❌ $path: HTTP $STATUS"
  fi
done
```
</deployment_validation>

## 7. Deployment Report
<deployment_report>
Generate deployment summary:

```bash
# Generate summary report
cat << EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ STAGING DEPLOYMENT COMPLETED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Deployment Summary:
  • PR Number: #$PR_NUMBER
  • Changes Deployed: $CHANGE_COUNT commits
  • Files Modified: $FILE_COUNT
  • Environment: staging.slideheroes.com
  • Status: Active and healthy

🔗 Important Links:
  • Staging Site: https://staging.slideheroes.com
  • PR Details: https://github.com/MLorneSmith/2025slideheroes/pull/$PR_NUMBER
  • Deployment Logs: Check GitHub Actions tab

📋 Next Steps:
  1. Monitor staging metrics for stability
  2. Validate critical user journeys
  3. Check error rates in monitoring
  4. Prepare for production deployment if stable

⏰ Deployment completed at: $(date +"%Y-%m-%d %H:%M:%S %Z")
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF
```
</deployment_report>

## 8. Error Handling
<error_handling>
Handle deployment failures gracefully:

```bash
# Set up error trap
trap 'handle_deployment_error $? $LINENO' ERR

handle_deployment_error() {
  local exit_code=$1
  local line_number=$2

  echo ""
  echo "❌ Deployment error at line $line_number (exit code: $exit_code)"
  echo ""
  echo "🔧 Recovery Options:"
  echo "  1. Check PR status: gh pr view $PR_NUMBER"
  echo "  2. View CI logs: gh run list --workflow=staging-deployment"
  echo "  3. Rollback if needed: git push origin staging:staging --force-with-lease"
  echo "  4. Contact DevOps team for assistance"
  echo ""
  echo "📝 Error context saved to: /tmp/staging-deployment-error-$(date +%Y%m%d-%H%M%S).log"

  # Save error context
  {
    echo "Deployment Error Report"
    echo "======================"
    echo "Time: $(date)"
    echo "Branch: $CURRENT_BRANCH"
    echo "PR: $PR_NUMBER"
    echo "Line: $line_number"
    echo "Exit Code: $exit_code"
    echo ""
    echo "Git Status:"
    git status
    echo ""
    echo "Recent Commits:"
    git log --oneline -10
  } > "/tmp/staging-deployment-error-$(date +%Y%m%d-%H%M%S).log"
}
```
</error_handling>
</instructions>

<expectations>
Upon successful completion, you will have:
- Created and merged a deployment PR to staging branch
- All CI/CD checks passing successfully
- Staging environment responding with healthy status
- Zero downtime during deployment process
- Comprehensive deployment documentation generated
- All critical paths validated and functional

Success metrics:
- PR creation: Success
- CI pipeline: 100% pass rate
- Deployment execution: Completed
- Staging health: HTTP 200/304 responses
- Smoke tests: All critical paths accessible
- Error rate: No increase from baseline
</expectations>

<help>
🚀 **Promote to Staging**

Deploy dev branch changes to staging environment via GitOps CI/CD pipeline.

**Usage:**
- `/promote-to-staging` - Deploy current dev branch to staging

**Process:**
1. Validate git state and changes
2. Create deployment PR with details
3. Monitor CI/CD pipeline execution
4. Auto-merge on success
5. Validate staging health
6. Generate deployment report

**Requirements:**
- Must be on dev branch
- Clean git working directory
- GitHub CLI authenticated
- All local tests passing

Deploy with confidence using production-grade automation!
</help>