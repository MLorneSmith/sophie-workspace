# Update Makerkit

Updates the codebase with the latest changes from the Makerkit upstream repository.

## What this command does

1. Checks for uncommitted changes and stops if any are found
2. Pulls the latest changes from the upstream Makerkit repository
3. Helps resolve any merge conflicts that arise
4. Validates that the update was successful

## Steps

### 1. Check for uncommitted changes

First, ensure there are no uncommitted changes in your working directory:

```bash
git status --porcelain
```

If there are uncommitted changes, either:

- Commit them: `git add . && git commit -m "WIP: Save work before makerkit update"`
- Stash them: `git stash push -m "Stashing before makerkit update"`

### 2. Create a backup branch (recommended)

Create a backup of your current state before making any changes:

```bash
git branch backup-before-makerkit-update-$(date +%Y%m%d-%H%M%S)
```

### 3. Pull upstream changes

Pull the latest changes from the Makerkit upstream (this will fetch and merge):

```bash
git pull upstream main
```

### 4. Handle merge conflicts (if any)

If merge conflicts occur, you'll see a message like "Automatic merge failed; fix conflicts and then commit the result."

#### a. Identify conflicted files

```bash
git status
```

Look for files marked as "both modified" or "unmerged paths".

#### b. Review each conflict

For each conflicted file, open it and look for conflict markers:

```
<<<<<<< HEAD
Your local changes
=======
Upstream makerkit changes
>>>>>>> upstream/main
```

#### c. Resolve conflicts

For each conflict, decide whether to:

- Keep your changes (delete the upstream section)
- Keep upstream changes (delete your section)
- Merge both (combine the changes appropriately)

Common conflict patterns and resolutions:

**Package.json conflicts:**

- Usually keep both sets of dependencies
- Ensure version numbers are compatible
- Run `pnpm install` after resolution

**Configuration files:**

- Keep your environment-specific settings
- Accept upstream structural changes
- Merge new configuration options

**Component updates:**

- Review upstream improvements
- Preserve your customizations
- Test thoroughly after merging

#### d. Mark conflicts as resolved

After editing each file:

```bash
git add <resolved-file>
```

#### e. Complete the merge

Once all conflicts are resolved:

```bash
git commit -m "Merge upstream makerkit updates - $(date +%Y-%m-%d)"
```

### 5. Verify the update

After successful merge:

```bash
# Install any new dependencies
pnpm install

# Run type checking
pnpm typecheck

# Run linting
pnpm lint

# Run tests if available
pnpm test

# Start development server to verify
pnpm dev
```

### 6. Clean up (if you created a backup)

If everything works correctly and you created a backup branch:

```bash
# List backup branches
git branch | grep backup-before-makerkit

# Delete the backup once confirmed working (replace with actual branch name)
git branch -d backup-before-makerkit-update-YYYYMMDD-HHMMSS
```

## Troubleshooting

### If merge goes wrong

Abort the merge and return to previous state:

```bash
git merge --abort
```

Or if you have a backup branch:

```bash
git reset --hard backup-before-makerkit-update-YYYYMMDD-HHMMSS
```

### If upstream is not configured

Add the Makerkit repository as upstream:

```bash
git remote add upstream https://github.com/makerkit/next-supabase-saas-kit.git
```

Verify upstream is configured:

```bash
git remote -v
```

### Common issues after update

1. **TypeScript errors**: Run `pnpm generate:types` to regenerate types
2. **Missing dependencies**: Run `pnpm install`
3. **Database schema changes**: Check for new migrations in `supabase/migrations/`
4. **Environment variables**: Check if new variables were added to `.env.example`

## Best practices

1. **Always backup before updating**: Create a branch or at least stash your changes
2. **Review changes first (optional)**: Use `git fetch upstream main && git log HEAD..upstream/main` to preview changes before pulling
3. **Update regularly**: Frequent small updates are easier than infrequent large ones
4. **Document customizations**: Keep track of your modifications to make conflict resolution easier
5. **Test thoroughly**: After updating, test all critical paths in your application

## Quick command summary

For experienced users, here's the essential flow:

```bash
# Ensure clean state
git status --porcelain || echo "Working directory clean"

# Backup current state
git branch backup-$(date +%Y%m%d-%H%M%S)

# Pull upstream
git pull upstream main

# If conflicts, resolve them then:
git add .
git commit -m "Merge upstream makerkit updates"

# Verify
pnpm install && pnpm typecheck && pnpm lint
```
