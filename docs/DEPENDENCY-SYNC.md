# Dependency Sync Process

## Overview

Dependabot automatically updates dependencies on the `dev` branch weekly (Mondays 10:00 UTC). To avoid lockfile
conflicts and CI failures, follow these sync practices.

## Daily Sync Routine

### Start of Day

```bash
# Always sync before starting work
git checkout dev
git pull origin dev
pnpm install  # Critical - updates your local dependencies
```

### Before Starting Any Work

1. Check GitHub for recently merged Dependabot PRs
2. Pull latest `dev` changes
3. Run `pnpm install` to sync dependencies

### After Merging Dependabot PRs

```bash
# Immediately after a Dependabot PR is merged
git checkout dev
git pull origin dev
pnpm install --no-frozen-lockfile
git add pnpm-lock.yaml
git commit -m "chore: update lockfile after dependency updates"
git push origin dev
```

## Handling Dependabot PR Failures

### Common Issues

#### 1. PNPM Version Mismatch

- **Error**: `Multiple versions of pnpm specified`
- **Solution**: Ensure all workflow files use the same PNPM version as `package.json`
- **Current Version**: `pnpm@10.14.0`

#### 2. Outdated Lockfile

- **Error**: `ERR_PNPM_OUTDATED_LOCKFILE`
- **Solution**: The `dependabot-auto-merge.yml` workflow now automatically fixes lockfiles

#### 3. Manual Lockfile Fix (if auto-fix fails)

```bash
# Fetch the Dependabot branch
git fetch origin
git checkout [dependabot-branch-name]

# Update lockfile
pnpm install --no-frozen-lockfile

# Commit and push
git add pnpm-lock.yaml
git commit -m "fix: update lockfile for Dependabot compatibility"
git push origin [dependabot-branch-name]
```

## Automation Features

### Auto-Merge Rules

- **Patch updates**: Auto-merge for dev dependencies
- **Minor updates**: Auto-merge for specific trusted packages (@types, vitest, playwright, biome, husky, lint-staged)
- **Security updates**: Labeled and prioritized for review

### Auto-Fix Lockfile

The `dependabot-auto-merge.yml` workflow automatically:

1. Checks out the Dependabot PR branch
2. Runs `pnpm install --no-frozen-lockfile`
3. Commits and pushes lockfile changes if needed

## Best Practices

### DO

- ✅ Run `pnpm install` after every `git pull`
- ✅ Check for Dependabot PRs daily
- ✅ Keep your local environment in sync
- ✅ Review security updates promptly

### DON'T

- ❌ Ignore failing Dependabot PRs
- ❌ Manually edit `pnpm-lock.yaml`
- ❌ Skip the `pnpm install` step after pulling
- ❌ Work with outdated dependencies

## Troubleshooting

### Check Workflow Status

```bash
# List recent workflow runs
gh run list --limit 10

# Check specific Dependabot PR
gh pr view [pr-number]

# View workflow failures
gh run view [run-id] --log-failed
```

### Force Recreate Dependabot PR

If a Dependabot PR is stuck:

1. Comment `@dependabot recreate` on the PR
2. Or close and let Dependabot create a new one

### Manual Dependency Update

```bash
# Update all dependencies
pnpm update

# Update specific package
pnpm update [package-name]

# Check for outdated packages
pnpm outdated
```

## Weekly Maintenance

Every Monday after Dependabot runs:

1. Review all open Dependabot PRs
2. Prioritize security updates
3. Test major version updates locally before merging
4. Update team on any breaking changes

## Contact

For issues with the dependency update process:

- Create an issue with label `dependencies`
- Tag @MLorneSmith for urgent matters
- Check #dev-ops channel for status updates
