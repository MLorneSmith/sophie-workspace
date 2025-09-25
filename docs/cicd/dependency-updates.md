# Dependency Update Automation

## Overview

SlideHeroes uses Dependabot to automate dependency updates, ensuring our project stays current with the latest
security patches and improvements while minimizing manual maintenance overhead.

## Configuration

### Dependabot Settings

Located in `.github/dependabot.yml`, our configuration:

- **Schedule**: Weekly updates every Monday at 10:00 UTC
- **Target Branch**: All PRs target the `dev` branch
- **Package Manager**: pnpm (automatically detected via pnpm-lock.yaml)
- **PR Limit**: Up to 10 npm PRs and 5 GitHub Actions PRs at a time

### Update Groups

Dependencies are grouped to reduce PR noise:

1. **Production Dependencies**: All runtime dependencies except critical ones
2. **Development Dependencies**: Build and development tools
3. **React Ecosystem**: React, React DOM, and their types
4. **Next.js**: Next.js and related packages
5. **Supabase**: All Supabase SDK packages
6. **Testing Tools**: Vitest, Playwright, Testing Library
7. **TypeScript**: TypeScript compiler and type definitions
8. **Code Quality**: Biome, Husky, lint-staged

### Auto-Merge Rules

The `dependabot-auto-merge.yml` workflow automatically handles:

- **Auto-merge**: Patch updates for development dependencies
- **Auto-merge**: Minor updates for select dev tools (types, test tools, linters)
- **Auto-approve**: All patch updates
- **Auto-approve**: Minor updates for development dependencies
- **Security labeling**: Automatic labeling and commenting on security updates

## Workflow Process

### 1. Weekly Update Cycle

Every Monday at 10:00 UTC:

- Dependabot checks for available updates
- Creates grouped PRs for related dependencies
- Applies appropriate labels and assigns reviewers

### 2. PR Review Process

**Automated Reviews**:

- Patch updates are auto-approved
- Dev dependency minor updates are auto-approved
- Security updates are labeled and prioritized

**Manual Reviews Required**:

- Major version updates
- Production dependency minor/major updates
- Critical packages (React, Next.js, Supabase, Stripe)

### 3. Merge Strategy

1. PRs run through standard CI/CD validation
2. Auto-mergeable PRs merge after passing all checks
3. Manual review PRs wait for team approval
4. All merges use squash commits for clean history

## Security Updates

Security updates bypass the weekly schedule and are created immediately when vulnerabilities are detected. They:

- Target the `dev` branch
- Receive a "security" label
- Get priority review comments
- Should be reviewed and merged ASAP

## Best Practices

### 1. Monitoring Updates

- Check the [Dependency Graph](https://github.com/MLorneSmith/2025slideheroes/network/dependencies) regularly
- Review [Security Advisories](https://github.com/MLorneSmith/2025slideheroes/security/advisories)
- Monitor failed PR checks for breaking changes

### 2. Handling Breaking Changes

When a dependency update fails CI:

1. Review the changelog for breaking changes
2. Update code to accommodate changes
3. Add migration notes to the PR
4. Consider pinning version if update is not urgent

### 3. Version Pinning Strategy

- **Production deps**: Use exact versions for critical packages
- **Dev dependencies**: Allow minor updates for better tooling
- **Types**: Always allow patch and minor updates

### 4. Emergency Rollbacks

If a merged update causes issues:

```bash
# Revert the merge commit
git revert <merge-commit-hash>

# Update package.json to pin the problematic package
pnpm add <package>@<previous-version> --save-exact

# Commit and push
git commit -m "fix: pin <package> to <version> due to regression"
git push
```

## Customization

### Adding Packages to Groups

Edit `.github/dependabot.yml` to add patterns:

```yaml
groups:
  group-name:
    patterns:
      - 'new-package'
      - '@scope/*'
```

### Excluding Packages

Add to `exclude-patterns` in relevant groups:

```yaml
exclude-patterns:
  - 'package-to-exclude'
  - '@scope/specific-package'
```

### Changing Auto-Merge Rules

Edit `.github/workflows/dependabot-auto-merge.yml` to modify:

- Which updates are auto-merged
- Approval conditions
- Additional safety checks

## Troubleshooting

### Common Issues

1. **PR Fails CI**: Check logs, may need code updates
2. **Merge Conflicts**: Manually resolve in GitHub UI
3. **Too Many PRs**: Adjust `open-pull-requests-limit`
4. **Missing Updates**: Check Dependabot logs in Insights

### Viewing Dependabot Logs

1. Go to Repository Insights
2. Select "Dependency graph"
3. Click "Dependabot" tab
4. Review recent update jobs

## Manual Dependency Updates

When needed, update dependencies manually:

```bash
# Update all dependencies
pnpm update

# Update specific package
pnpm update <package-name>

# Update to latest major version
pnpm add <package-name>@latest

# Check outdated packages
pnpm outdated
```

## Integration with CI/CD

Dependabot PRs trigger the same CI/CD pipeline as regular PRs:

1. PR validation workflow runs all checks
2. Preview deployments are created
3. Bundle size analysis is performed
4. Security scans are executed

This ensures all updates meet our quality standards before merging.
