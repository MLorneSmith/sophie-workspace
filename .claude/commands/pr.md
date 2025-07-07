# PR Command

Usage: `/pr [pr_reference]`

- PR number: `123` (preferred format)
- PR URL: `https://github.com/MLorneSmith/2025slideheroes/pull/123`
- Branch name: `feature/add-new-feature` (will find associated PR)

This command reviews an open pull request, analyzes changes, runs tests, and applies the PR if approved.

**CRITICAL**: Always review PR comments and CI status for the most current implementation progress and test results.

## 1. Adopt Role

Load the PR review mindset:

```
/read .claude/context/roles/pr-reviewer.md
```

## 2. Load PR Information

### 2.1 Parse PR Reference

Handle various PR reference formats:

```bash
# Extract PR number from reference
pr_number=""
if [[ "$pr_reference" =~ ^[0-9]+$ ]]; then
  # Direct PR number
  pr_number="$pr_reference"
elif [[ "$pr_reference" =~ github\.com/.*/(pull|pulls)/([0-9]+) ]]; then
  # GitHub URL format
  pr_number="${BASH_REMATCH[2]}"
elif [[ "$pr_reference" =~ ^(feature|fix|hotfix|chore|docs)/.+ ]]; then
  # Branch name - find associated PR
  pr_list=$(gh pr list --repo MLorneSmith/2025slideheroes --state open --head "$pr_reference" --json number --jq '.[0].number')
  if [ -n "$pr_list" ]; then
    pr_number="$pr_list"
  else
    echo "❌ No open PR found for branch: $pr_reference"
    exit 1
  fi
else
  echo "❌ Invalid PR reference format: $pr_reference"
  exit 1
fi

echo "📋 Reviewing PR #${pr_number}"
```

### 2.2 Fetch PR Details

Get comprehensive PR information:

```bash
# Get PR details with all metadata
gh pr view ${pr_number} --repo MLorneSmith/2025slideheroes --json \
  number,title,body,state,author,createdAt,updatedAt,baseRefName,headRefName,\
  isDraft,mergeable,mergeStateStatus,reviews,statusCheckRollup,files,additions,deletions,\
  comments,labels,milestone,assignees > /tmp/pr-${pr_number}-details.json

# Check file count first
file_count=$(jq '.files | length' /tmp/pr-${pr_number}-details.json)
echo "📊 PR contains ${file_count} changed files"

# Handle large PRs differently
if [ $file_count -gt 300 ]; then
  echo "⚠️  Large PR detected - using file list instead of diff"
  # Get file list with changes
  gh api repos/MLorneSmith/2025slideheroes/pulls/${pr_number}/files --paginate > /tmp/pr-${pr_number}-files.json
else
  # Get PR diff for detailed review
  gh pr diff ${pr_number} --repo MLorneSmith/2025slideheroes > /tmp/pr-${pr_number}.diff 2>/dev/null || {
    echo "⚠️  Could not fetch diff - using file list API"
    gh api repos/MLorneSmith/2025slideheroes/pulls/${pr_number}/files > /tmp/pr-${pr_number}-files.json
  }
fi

# Get PR comments for context
gh pr view ${pr_number} --repo MLorneSmith/2025slideheroes --comments > /tmp/pr-${pr_number}-comments.txt
```

### 2.3 Parse PR Information

```bash
# Parse PR details
baseRefName=$(jq -r '.baseRefName' /tmp/pr-${pr_number}-details.json)
headRefName=$(jq -r '.headRefName' /tmp/pr-${pr_number}-details.json)
author=$(jq -r '.author.login' /tmp/pr-${pr_number}-details.json)
isDraft=$(jq -r '.isDraft' /tmp/pr-${pr_number}-details.json)
mergeable=$(jq -r '.mergeable' /tmp/pr-${pr_number}-details.json)
mergeStateStatus=$(jq -r '.mergeStateStatus' /tmp/pr-${pr_number}-details.json)

# Check branch target validation
if [[ "${baseRefName}" == "main" && "${headRefName}" =~ ^(feature|fix|hotfix|chore|docs)/ ]]; then
  echo "⚠️  PR targets main branch directly"
  echo "According to the workflow, feature branches should target dev first"
  read -p "Change target to dev branch? (y/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    gh pr edit ${pr_number} --base dev
    echo "✅ PR target changed to dev branch"
    # Re-fetch PR details
    gh pr view ${pr_number} --repo MLorneSmith/2025slideheroes --json \
      mergeable,mergeStateStatus > /tmp/pr-${pr_number}-merge-status.json
    mergeable=$(jq -r '.mergeable' /tmp/pr-${pr_number}-merge-status.json)
    mergeStateStatus=$(jq -r '.mergeStateStatus' /tmp/pr-${pr_number}-merge-status.json)
    baseRefName="dev"
  fi
fi

# Check PR readiness
if [[ "${isDraft}" == "true" ]]; then
  echo "⚠️  This is a draft PR - review only, do not merge"
fi

# Handle merge conflicts
if [[ "${mergeable}" == "CONFLICTING" ]] || [[ "${mergeStateStatus}" == "DIRTY" ]]; then
  echo "❌ PR has merge conflicts"
  echo "Options:"
  echo "1. Update PR branch with base branch"
  echo "2. Provide rebase instructions to author"
  echo "3. Skip merge and notify author"
  read -p "Select option (1-3): " -n 1 -r
  echo
  case $REPLY in
    1)
      echo "Updating PR branch..."
      gh pr checkout ${pr_number}
      git pull origin ${baseRefName}
      git push || echo "⚠️  Could not push - may need manual conflict resolution"
      ;;
    2)
      echo "To resolve conflicts, the author should run:"
      echo "git checkout ${headRefName}"
      echo "git pull origin ${baseRefName}"
      echo "# Resolve conflicts"
      echo "git push"
      ;;
    3)
      echo "Skipping merge - author needs to resolve conflicts"
      ;;
  esac
fi

# Check if user can approve
current_user=$(gh api user --jq '.login')
can_approve=true
if [[ "${author}" == "${current_user}" ]]; then
  echo "ℹ️  Cannot approve own PR - will skip approval step"
  can_approve=false
fi
```

## 3. Load Context Documentation

### 3.1 Core Context (Always Load)

```
# PARALLEL READ these core PR review docs:
.claude/context/standards/code-standards.md
.claude/context/systems/cicd-pipeline.md
.claude/context/systems/cicd-pipeline-design.md
```

### 3.2 Branch-Specific Context

Based on base branch, load additional context:

```typescript
const branchContextMap = {
  main: [
    '.claude/docs/workflows/production-deployment.md',
    '.claude/docs/security/pre-production-checklist.md',
  ],
  staging: [
    '.claude/docs/workflows/staging-validation.md',
    '.claude/docs/testing/e2e-test-requirements.md',
  ],
  dev: [
    '.claude/docs/workflows/development-workflow.md',
    '.claude/docs/standards/pr-guidelines.md',
  ],
};

const contextDocs = branchContextMap[baseRefName] || [];
// PARALLEL READ contextDocs
```

## 4. PR Analysis & Review

### 4.1 Analyze Changes

Review the PR diff systematically:

```typescript
// Parse diff file
const diff = await readFile(`/tmp/pr-${prNumber}.diff`);

// Categorize changes
const changeAnalysis = {
  modifiedFiles: files.length,
  additions: additions,
  deletions: deletions,
  fileTypes: categorizeFileTypes(files),
  riskLevel: assessRiskLevel(files, additions, deletions),
  affectedAreas: identifyAffectedAreas(files),
};

// Check for sensitive changes
const sensitivePatterns = [
  /\.env/,
  /secret/i,
  /api[_-]?key/i,
  /password/i,
  /token/i,
  /supabase.*key/i,
];

for (const pattern of sensitivePatterns) {
  if (diff.match(pattern)) {
    console.warn(
      '⚠️  Potential sensitive information in PR - review carefully',
    );
  }
}
```

### 4.2 Check CI Status

Verify all CI checks have passed:

```bash
# Get detailed CI status
gh pr checks ${pr_number} --repo MLorneSmith/2025slideheroes > /tmp/pr-${pr_number}-checks.txt

# Parse CI results
ci_blocking=true
while IFS=$'\t' read -r name status conclusion url description; do
  echo "Check: ${name} - ${status}"

  # Handle common CI failure patterns
  case "${name}" in
    *"snyk"*)
      if [[ "${description}" =~ "limit" ]]; then
        echo "  ℹ️  Snyk quota exceeded - not a PR issue"
        # Don't block merge for quota issues
      elif [[ "${status}" != "pass" ]]; then
        echo "  ❌ Security scan failed"
        ci_blocking=true
      fi
      ;;
    *"Vercel"*)
      if [[ "${status}" == "pass" ]]; then
        echo "  ✅ Deployment successful: ${url}"
      else
        echo "  ❌ Deployment failed - check logs: ${url}"
        ci_blocking=true
      fi
      ;;
    *)
      if [[ "${status}" != "pass" ]]; then
        echo "  ❌ Check failed: ${description}"
        ci_blocking=true
      fi
      ;;
  esac
done < <(gh pr checks ${pr_number} --repo MLorneSmith/2025slideheroes)

if [[ "${ci_blocking}" == "true" ]]; then
  echo "⚠️  Some CI checks are failing - review required"
fi

# Check specific workflow runs
gh run list --repo MLorneSmith/2025slideheroes --branch ${headRefName} --limit 5
```

### 4.3 Review Code Quality

Perform automated code quality checks:

```bash
# Checkout PR branch
git fetch origin pull/${pr_number}/head:pr-${pr_number}
git checkout pr-${pr_number}

# Run local validation
pnpm lint
pnpm typecheck
pnpm test:unit

# Check bundle size impact (if applicable)
pnpm analyze:bundle
```

### 4.4 Security Review

Run security checks:

```bash
# Check for known vulnerabilities
pnpm audit

# Run security linting
# Look for common security issues in the diff
grep -E "(eval\(|innerHTML|dangerouslySetInnerHTML)" /tmp/pr-${pr_number}.diff

# Check for exposed secrets
trufflehog filesystem /tmp/pr-${pr_number}.diff --only-verified
```

## 5. Create Review Report

### 5.1 Generate Review Summary

```markdown
## PR Review Report

**PR #${prNumber}**: ${title}
**Author**: ${author.login}
**Branch**: ${headRefName} → ${baseRefName}
**Status**: ${state}
**Mergeable**: ${mergeable ? "✅ Yes" : "❌ No - Conflicts"}

### 📊 Change Summary

- **Files Changed**: ${files.length}
- **Additions**: +${additions}
- **Deletions**: -${deletions}
- **Risk Level**: ${riskLevel}

### ✅ CI Status

${formatCIStatus(statusCheckRollup)}

### 🔍 Code Review Findings

#### Positive Aspects

- [List positive findings]

#### Concerns

- [List any concerns or issues]

#### Suggestions

- [List improvement suggestions]

### 🔒 Security Review

- Sensitive Information: ${sensitiveInfoFound ? "⚠️ Found" : "✅ None detected"}
- Dependencies: ${dependencyIssues ? "⚠️ Issues found" : "✅ Clean"}
- Security Patterns: ${securityPatterns ? "⚠️ Review needed" : "✅ Passed"}

### 📦 Performance Impact

- Bundle Size Change: ${bundleSizeChange}
- New Dependencies: ${newDependencies.length > 0 ? newDependencies.join(", ") : "None"}

### 🧪 Test Coverage

- Unit Tests: ${unitTestStatus}
- Integration Tests: ${integrationTestStatus}
- E2E Tests: ${e2eTestStatus}
```

## 6. Interactive Review Process

### 6.1 Review Each File

For significant changes, review each file:

```typescript
// For each modified file
for (const file of files) {
  if (file.additions > 50 || file.deletions > 50) {
    console.log(`\n📄 Reviewing: ${file.filename}`);
    console.log(`   Changes: +${file.additions} -${file.deletions}`);

    // Read the file content
    const content = await readFile(file.filename);

    // Check against coding standards
    const issues = checkCodingStandards(content, file.filename);
    if (issues.length > 0) {
      console.log('   Issues found:', issues);
    }
  }
}
```

### 6.2 Test Affected Features

Based on changed files, test affected features:

```bash
# Run focused tests for affected areas
if [[ " ${affectedAreas[@]} " =~ " auth " ]]; then
  pnpm test:auth
fi

if [[ " ${affectedAreas[@]} " =~ " payments " ]]; then
  pnpm test:payments
fi

# Run E2E tests for critical paths
if [[ "${riskLevel}" == "high" ]]; then
  pnpm --filter e2e test:critical
fi
```

## 7. Apply PR (If Approved)

### 7.1 Pre-Merge Checks

Before merging, ensure:

```bash
# Update PR branch with latest base branch
gh pr checkout ${pr_number}
git pull origin ${baseRefName}
git push

# Wait for CI to complete on updated branch
gh pr checks ${pr_number} --watch

# Verify no new issues
pnpm lint && pnpm typecheck && pnpm test:unit
```

### 7.2 Merge PR

Choose appropriate merge strategy based on branch:

```bash
# Interactive merge confirmation
echo "Ready to merge PR #${pr_number}"
echo "Target branch: ${baseRefName}"
echo "Merge method will be: $([ "${baseRefName}" == "dev" ] && echo "squash" || echo "merge")"
read -p "Proceed with merge? (y/n): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Merge cancelled by user"
  exit 0
fi

# For feature → dev: Squash merge
if [[ "${baseRefName}" == "dev" ]]; then
  gh pr merge ${pr_number} --squash --delete-branch || {
    echo "❌ Merge failed"
    echo "Common issues:"
    echo "- PR may need to be updated with latest ${baseRefName}"
    echo "- CI checks may be failing"
    echo "- Branch protection rules may be blocking"
    exit 1
  }
fi

# For dev → staging: Merge commit to preserve history
if [[ "${baseRefName}" == "staging" ]]; then
  gh pr merge ${pr_number} --merge || {
    echo "❌ Merge failed - staging branch may have additional protection rules"
    exit 1
  }
fi

# For staging → main: Requires manual approval
if [[ "${baseRefName}" == "main" ]]; then
  echo "⚠️  Production merge requires manual approval"
  echo "Please review deployment checklist and merge manually"
  exit 0
fi
```

### 7.3 Post-Merge Actions

After successful merge:

```bash
# Switch back to base branch
git checkout ${baseRefName}
git pull origin ${baseRefName}

# Clean up local PR branch
git branch -d pr-${pr_number}

# Notify relevant channels
echo "✅ PR #${pr_number} successfully merged to ${baseRefName}"
```

## 8. Review Feedback

### 8.1 Add Review Comment

Post review findings as PR comment:

```bash
# Create review comment with findings
gh pr review ${pr_number} --repo MLorneSmith/2025slideheroes \
  --comment \
  --body "$(cat /tmp/pr-${pr_number}-review.md)"
```

### 8.2 Request Changes (If Needed)

If issues found:

```bash
# Request changes with specific feedback
gh pr review ${pr_number} --repo MLorneSmith/2025slideheroes \
  --request-changes \
  --body "### Changes Requested

${changesList}

Please address these issues and request re-review."
```

### 8.3 Approve PR

If all checks pass:

```bash
# Only approve if not own PR
if [[ "${can_approve}" == "true" ]]; then
  gh pr review ${pr_number} --repo MLorneSmith/2025slideheroes \
    --approve \
    --body "### ✅ Approved

All checks passed and code looks good. Ready to merge."
else
  echo "ℹ️  Skipping approval (cannot approve own PR)"
  # Add comment instead
  gh pr comment ${pr_number} --repo MLorneSmith/2025slideheroes \
    --body "### 👍 Review Complete

All checks passed and code looks good. Ready to merge.

*Note: Author cannot approve their own PR*"
fi
```

## 9. Summary Output

```
📋 PR Review Complete!

PR #${prNumber}: ${title}
Status: ${reviewStatus}
Action Taken: ${actionTaken}

Summary:
- Files Reviewed: ${filesReviewed}
- Issues Found: ${issuesFound}
- CI Status: ${ciStatus}
- Merge Status: ${mergeStatus}

Next Steps:
${nextSteps}
```

## Integration with CI/CD Pipeline

### Workflow Triggers

This command integrates with the CI/CD pipeline by:

1. Checking workflow status before merge
2. Triggering deployment workflows post-merge
3. Monitoring deployment success
4. Rolling back if deployment fails

### Branch Protection

Respects branch protection rules:

- Required reviews for staging/main
- CI checks must pass
- No direct pushes to protected branches
- Linear history enforcement

## Error Handling

### Common Issues

1. **Merge Conflicts**: Prompt to resolve conflicts
2. **CI Failures**: Show failing checks and logs
3. **Missing Permissions**: Check GitHub token permissions
4. **Network Issues**: Retry with exponential backoff

### Recovery Actions

```bash
# Save PR state before risky operations
save_pr_state() {
  echo "Saving PR state..."
  mkdir -p /tmp/pr-recovery
  cp /tmp/pr-${pr_number}-*.json /tmp/pr-recovery/
  git rev-parse HEAD > /tmp/pr-recovery/original-head.txt
}

# If merge fails, create recovery branch
recover_from_failure() {
  echo "❌ Operation failed - initiating recovery"

  # Return to original branch
  original_head=$(cat /tmp/pr-recovery/original-head.txt 2>/dev/null || echo "dev")
  git checkout ${original_head} 2>/dev/null || git checkout dev

  # Create recovery branch if changes exist
  if [ -n "$(git status --porcelain)" ]; then
    git checkout -b recovery/pr-${pr_number}-$(date +%s)
    git add .
    git commit -m "WIP: Recovery state for PR #${pr_number}"
    echo "✅ Recovery branch created"
  fi

  echo "Recovery complete. PR state saved in /tmp/pr-recovery/"
}

# Set trap for failures
trap recover_from_failure ERR
```

## Best Practices

1. **Always validate branch targets** - Feature branches should go to dev, not main
2. **Handle large PRs gracefully** - Use file list API when diff is too large
3. **Check for self-approval** - Cannot approve your own PRs
4. **Interpret CI failures** - Don't block on quota/limit issues
5. **Provide interactive options** - Let user decide on conflict resolution
6. **Save state before risky operations** - Enable recovery from failures
