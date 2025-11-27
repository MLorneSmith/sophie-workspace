---
description: Pull sandbox branch from GitHub and merge locally with dev
argument-hint: <pr-number|branch-name>
allowed-tools: [Bash]
---

# Git Merge from Sandbox

Merge a sandbox PR into local dev branch: $ARGUMENTS

## Instructions

This command fetches a sandbox branch from GitHub and merges it into your local dev branch, then pushes and cleans up.

1. Parse the argument to determine if it's a PR number or branch name
2. Fetch the branch from origin
3. Update local dev branch
4. Merge with --no-ff to preserve history
5. Push to origin
6. Clean up: close PR and delete remote branch

## Execution

### Step 1: Determine branch name and PR number

First, determine if the argument is a PR number or branch name:

```bash
# Check if argument is a number (PR number) or string (branch name)
ARG="$ARGUMENTS"
```

If the argument is purely numeric, it's a PR number. Fetch the branch name:
```bash
gh pr view $ARG --json headRefName -q .headRefName
```

If the argument contains letters, it's a branch name. Try to find associated PR:
```bash
gh pr list --head "$ARG" --json number -q '.[0].number'
```

### Step 2: Fetch and update local dev

```bash
git fetch origin
git checkout dev
git pull origin dev
```

### Step 3: Merge the branch

Merge with no-fast-forward to preserve the branch history:
```bash
git merge origin/$BRANCH --no-ff -m "Merge $BRANCH into dev (PR #$PR_NUM)

Merged via /gitmerge command"
```

### Step 4: Handle merge result

**If merge succeeds:**
1. Push to origin: `git push origin dev`
2. Close PR and delete branch:
   ```bash
   gh pr close $PR_NUM --delete-branch --comment "Merged locally via /gitmerge"
   ```
3. Report success with files changed summary

**If merge has conflicts:**
1. List conflicting files: `git diff --name-only --diff-filter=U`
2. Provide instructions to resolve:
   - Open conflicting files in editor
   - Resolve conflicts manually
   - Run `git add .` and `git commit` to complete
   - Then run `git push origin dev`
3. Do NOT push until conflicts are resolved
4. Offer to abort: `git merge --abort`

## Report

After completion, output:
- Merge status (success/conflicts)
- Files changed summary: `git diff --stat HEAD~1`
- PR closure confirmation
- Remote branch deletion confirmation

## Error Handling

- If PR not found: Show error and list open PRs
- If branch not found: Show error and suggest `git fetch origin`
- If already on a different branch: Checkout dev first
- If local changes: Stash or commit before merging
