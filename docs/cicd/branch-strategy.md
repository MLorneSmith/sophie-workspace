# Branch Strategy

## Overview

The SlideHeroes project follows a **GitFlow-inspired branching model** optimized for continuous deployment with three main environments: development, staging, and production.

## Branch Structure

```mermaid
gitGraph
    commit id: "Initial Commit"

    branch dev
    checkout dev
    commit id: "Feature A Dev"
    commit id: "Feature B Dev"

    branch feature/user-auth
    checkout feature/user-auth
    commit id: "Add login form"
    commit id: "Add auth logic"
    checkout dev
    merge feature/user-auth
    commit id: "Merge auth feature"

    branch staging
    checkout staging
    merge dev
    commit id: "Integration Testing"

    checkout main
    merge staging
    commit id: "Production Release v1.0"
    tag: "v1.0.0"

    checkout dev
    commit id: "Next feature"

    branch hotfix/critical-bug
    checkout hotfix/critical-bug
    commit id: "Fix critical issue"

    checkout main
    merge hotfix/critical-bug
    commit id: "Hotfix v1.0.1"
    tag: "v1.0.1"

    checkout staging
    merge hotfix/critical-bug

    checkout dev
    merge hotfix/critical-bug
```

## Main Branches

### `main` (Production)

- **Purpose**: Production-ready code only
- **Environment**: `slideheroes.com`
- **Protection**: Highest level
- **Deployment**: Automatic to production
- **Source**: Only merges from `staging` or `hotfix/*`

**Protection Rules**:

- Require pull request reviews (2 reviewers)
- Require status checks to pass
- Require branches to be up to date
- Restrict pushes to admins only
- Require linear history

### `staging` (Pre-production)

- **Purpose**: Integration testing and client demos
- **Environment**: `staging.slideheroes.com`
- **Protection**: Medium level
- **Deployment**: Automatic to staging
- **Source**: Merges from `dev` and `hotfix/*`

**Protection Rules**:

- Require pull request reviews (1 reviewer)
- Require status checks to pass
- Allow force pushes by admins
- Delete head branches automatically

### `dev` (Development)

- **Purpose**: Development integration and feature testing
- **Environment**: `dev.slideheroes.com`
- **Protection**: Basic level
- **Deployment**: Automatic to development
- **Source**: Merges from feature branches, direct commits allowed

**Protection Rules**:

- Require status checks to pass
- Allow direct pushes for rapid development
- Delete head branches automatically

## Supporting Branches

### Feature Branches (`feature/*`)

**Naming Convention**: `feature/short-description`

**Examples**:

```bash
feature/user-authentication
feature/payment-integration
feature/course-builder
feature/quiz-system
```

**Lifecycle**:

1. Branch from `dev`
2. Develop feature
3. Create PR to `dev`
4. Code review and testing
5. Merge to `dev`
6. Delete feature branch

**Best Practices**:

- Keep branches small and focused
- Rebase regularly with `dev`
- Use descriptive commit messages
- Include tests with features

### Hotfix Branches (`hotfix/*`)

**Naming Convention**: `hotfix/issue-description`

**Examples**:

```bash
hotfix/payment-gateway-timeout
hotfix/memory-leak-canvas
hotfix/auth-token-refresh
```

**Lifecycle**:

1. Branch from `main`
2. Fix critical issue
3. Test thoroughly
4. Create PR to `main`
5. After merge, backport to `staging` and `dev`
6. Delete hotfix branch

**Criteria for Hotfixes**:

- Production is broken or severely degraded
- Security vulnerability discovered
- Data loss or corruption risk
- Payment system failures

### Release Branches (`release/*`) [Optional]

**Usage**: For major releases requiring extended testing

**Naming Convention**: `release/v1.2.0`

**Lifecycle**:

1. Branch from `dev`
2. Feature freeze, bug fixes only
3. Extensive testing
4. Merge to `main` and `staging`
5. Tag release
6. Delete release branch

## Workflow Patterns

### Standard Feature Development

```bash
# 1. Create feature branch
git checkout dev
git pull origin dev
git checkout -b feature/new-awesome-feature

# 2. Develop and commit
git add .
git commit -m "feat: add awesome feature component"
git push -u origin feature/new-awesome-feature

# 3. Create PR to dev
gh pr create --base dev --title "Add awesome feature" --body "Description"

# 4. After review and merge
git checkout dev
git pull origin dev
git branch -d feature/new-awesome-feature
```

### Staging Release

```bash
# 1. Create PR from dev to staging
git checkout staging
git pull origin staging
gh pr create --base staging --head dev --title "Deploy to staging"

# 2. After merge, automatic deployment to staging.slideheroes.com
# 3. Test thoroughly on staging environment
# 4. When ready, create PR to main
```

### Production Release

```bash
# 1. Create PR from staging to main
git checkout main
git pull origin main
gh pr create --base main --head staging --title "Production Release v1.2.0"

# 2. After review and merge, automatic deployment to slideheroes.com
# 3. Create and push release tag
git tag v1.2.0
git push origin v1.2.0
```

### Emergency Hotfix

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-payment-bug

# 2. Fix the issue
git add .
git commit -m "fix: resolve payment gateway timeout"
git push -u origin hotfix/critical-payment-bug

# 3. Create PR to main
gh pr create --base main --title "HOTFIX: Payment gateway timeout"

# 4. After merge and deployment, backport to staging and dev
git checkout staging
git pull origin staging
gh pr create --base staging --head hotfix/critical-payment-bug

git checkout dev
git pull origin dev
gh pr create --base dev --head hotfix/critical-payment-bug
```

## Branch Protection Configuration

### GitHub Branch Protection Settings

**Main Branch (`main`)**:

```yaml
protection_rules:
  required_status_checks:
    strict: true
    contexts:
      - 'PR Status Check'
      - 'Final Security Check'
  enforce_admins: false
  required_pull_request_reviews:
    required_approving_review_count: 2
    dismiss_stale_reviews: true
    require_code_owner_reviews: true
  restrictions:
    users: []
    teams: ['core-team']
  required_linear_history: true
  allow_force_pushes: false
  allow_deletions: false
```

**Staging Branch (`staging`)**:

```yaml
protection_rules:
  required_status_checks:
    strict: true
    contexts:
      - 'PR Status Check'
      - 'Full Test Suite'
  required_pull_request_reviews:
    required_approving_review_count: 1
    dismiss_stale_reviews: true
  allow_force_pushes: true # For admins only
  allow_deletions: false
```

**Development Branch (`dev`)**:

```yaml
protection_rules:
  required_status_checks:
    strict: false
    contexts:
      - 'PR Status Check'
  required_pull_request_reviews:
    required_approving_review_count: 0 # Allow direct pushes
  allow_force_pushes: true
  allow_deletions: false
```

## Environment Mapping

| Branch      | Environment | URL                       | Auto-Deploy | Testing Level               |
| ----------- | ----------- | ------------------------- | ----------- | --------------------------- |
| `main`      | Production  | `slideheroes.com`         | ✅          | Health checks, smoke tests  |
| `staging`   | Staging     | `staging.slideheroes.com` | ✅          | Full E2E, performance tests |
| `dev`       | Development | `dev.slideheroes.com`     | ✅          | Smoke tests only            |
| `feature/*` | None        | Preview URLs              | ❌          | Unit tests in PR            |

## Release Process

### Version Numbering

**Semantic Versioning (SemVer)**: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

**Examples**:

- `1.0.0` → `1.0.1` (bug fix)
- `1.0.1` → `1.1.0` (new feature)
- `1.1.0` → `2.0.0` (breaking change)

### Release Tagging

```bash
# Create annotated tag
git tag -a v1.2.0 -m "Release version 1.2.0

- Added course builder feature
- Improved quiz performance
- Fixed payment integration bugs"

# Push tag
git push origin v1.2.0
```

### Release Notes

Generated automatically from commit messages and PR descriptions:

```markdown
## v1.2.0 (2025-01-15)

### ✨ Features

- Course builder with drag-and-drop interface (#45)
- Advanced quiz analytics dashboard (#47)
- Export presentations to PDF (#52)

### 🐛 Bug Fixes

- Fixed payment gateway timeout issues (#49)
- Resolved memory leak in canvas editor (#51)
- Corrected auth token refresh logic (#53)

### 🔧 Improvements

- Improved quiz rendering performance by 40%
- Enhanced error handling in course creation
- Updated dependencies for security patches
```

## Conflict Resolution

### Merge Conflicts

1. **Pull latest changes**:

   ```bash
   git checkout dev
   git pull origin dev
   git checkout feature/my-feature
   git rebase dev
   ```

2. **Resolve conflicts manually**
3. **Test thoroughly**
4. **Force push** (if rebased):
   ```bash
   git push --force-with-lease origin feature/my-feature
   ```

### Divergent Branches

When `staging` and `dev` diverge significantly:

1. **Assess the divergence**
2. **Create alignment PR**
3. **Coordinate with team**
4. **Test thoroughly after alignment**

## Best Practices

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add user authentication system
fix: resolve payment gateway timeout
docs: update API documentation
test: add unit tests for quiz component
refactor: optimize database queries
style: fix linting issues
chore: update dependencies
```

### Pull Request Guidelines

1. **Descriptive titles** following conventional commit format
2. **Detailed descriptions** explaining what and why
3. **Link related issues** using keywords (fixes #123)
4. **Include screenshots** for UI changes
5. **Self-review** before requesting review
6. **Keep PRs small** and focused

### Branch Hygiene

1. **Delete merged branches** immediately
2. **Regular cleanup** of stale feature branches
3. **Rebase feature branches** regularly
4. **Squash commits** when appropriate
5. **Use draft PRs** for work in progress

## Troubleshooting

### Common Scenarios

**Scenario**: Feature branch is far behind dev

```bash
git checkout feature/my-feature
git rebase dev
# Resolve conflicts
git push --force-with-lease origin feature/my-feature
```

**Scenario**: Accidental commit to main

```bash
# Revert the commit
git revert <commit-hash>
git push origin main
```

**Scenario**: Need to undo last commit

```bash
# Soft reset (keeps changes)
git reset --soft HEAD~1

# Hard reset (discards changes)
git reset --hard HEAD~1
```

### Emergency Procedures

**Production is broken**:

1. Create hotfix branch from main
2. Fix issue with minimal changes
3. Test fix locally
4. Create emergency PR with 2 approvals
5. Deploy immediately
6. Backport to staging and dev

**Staging deployment failed**:

1. Check deployment logs
2. Rollback if necessary
3. Fix issues in dev
4. Redeploy to staging

## Monitoring and Metrics

### Branch Metrics

- **Feature branch lifetime**: Target < 7 days
- **PR review time**: Target < 24 hours
- **Deployment frequency**: Multiple per day
- **Lead time**: Feature to production < 2 weeks

### Health Indicators

- **Build success rate**: Target > 95%
- **Test coverage**: Target > 80%
- **Deployment success rate**: Target > 99%
- **Rollback frequency**: Target < 5%

---

_This branch strategy evolves with team needs and is reviewed quarterly for effectiveness._
