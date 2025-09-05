# Git Worktrees with Claude Code: Parallel Development Guide

## Overview

This guide explains how to use Git worktrees to run multiple independent Claude Code sessions simultaneously, enabling parallel development on different features without branch switching or conflicts.

## What are Git Worktrees?

Git worktrees allow you to have multiple working directories attached to a single Git repository. Each worktree:
- Has its own working directory and index
- Can check out a different branch
- Shares the same Git database (`.git` directory)
- Operates independently from other worktrees

## Benefits for Claude Code Development

- **Parallel Feature Development**: Work on multiple features simultaneously
- **No Context Switching**: Each Claude session maintains its own context
- **Isolated Changes**: Modifications in one worktree don't affect others
- **Efficient Storage**: Shared Git database vs. multiple repository clones
- **Quick Hotfixes**: Create hotfix branches without disrupting ongoing work

## Prerequisites

- Git version 2.5 or higher (check with `git --version`)
- Claude Code CLI installed and configured
- Existing Git repository with SlideHeroes project

## Setup Instructions

### Step 1: Prepare Your Main Repository

```bash
# Navigate to your main project
cd /home/msmith/projects/2025slideheroes

# Switch to the dev branch (all worktrees will branch from dev)
git checkout dev

# Ensure your dev branch is up to date
git pull origin dev

# Check current status
git status
```

### Step 2: Create Worktrees for Different Features

**IMPORTANT:** All worktrees should branch from `dev`, not `main`.

```bash
# Create worktree for authentication feature (branching from dev)
git worktree add ../2025slideheroes-auth -b feature/authentication dev

# Create worktree for API development (branching from dev)
git worktree add ../2025slideheroes-api -b feature/api-routes dev

# Create worktree for UI updates (branching from dev)
git worktree add ../2025slideheroes-ui -b feature/ui-components dev
```

Note: The `dev` at the end of each command ensures the new branch is created from the `dev` branch.

### Step 3: Set Up Each Worktree

For each worktree, you'll need to:

```bash
# Navigate to the worktree
cd ../2025slideheroes-auth

# Install dependencies
pnpm install

# Copy environment files if needed
cp ../2025slideheroes/.env.local .env.local

# Verify Supabase connection (if applicable)
npx supabase status
```

Repeat for each worktree you created.

### Step 4: Start Claude Code Sessions

Open separate terminal windows/tabs for each worktree:

**Terminal 1 - Authentication Feature:**
```bash
cd /home/msmith/projects/2025slideheroes-auth
claude
```

**Terminal 2 - API Development:**
```bash
cd /home/msmith/projects/2025slideheroes-api
claude
```

**Terminal 3 - UI Components:**
```bash
cd /home/msmith/projects/2025slideheroes-ui
claude
```

## Common Worktree Commands

### List All Worktrees
```bash
git worktree list
```
Example output:
```
/home/msmith/projects/2025slideheroes      abc1234 [dev]
/home/msmith/projects/2025slideheroes-auth def5678 [feature/authentication]
/home/msmith/projects/2025slideheroes-api  ghi9012 [feature/api-routes]
```

### Remove a Worktree
```bash
# First, exit Claude Code in that worktree
# Then remove the worktree
git worktree remove ../2025slideheroes-auth

# Force removal if there are uncommitted changes
git worktree remove --force ../2025slideheroes-auth
```

### Clean Up Stale Worktrees
```bash
# Remove references to deleted worktrees
git worktree prune
```

## Recommended Directory Structure

```
/home/msmith/projects/
├── 2025slideheroes/              # Dev branch - main development
├── 2025slideheroes-auth/         # Authentication feature (from dev)
├── 2025slideheroes-api/          # API development (from dev)
├── 2025slideheroes-ui/           # UI components (from dev)
└── 2025slideheroes-hotfix/       # Emergency fixes (from dev or main)
```

## Workflow Examples

### Example 1: Parallel Feature Development

1. **Morning Setup:**
```bash
# Ensure you're on dev branch
git checkout dev
git pull origin dev

# Create worktrees for the day's tasks (branching from dev)
git worktree add ../2025slideheroes-stripe -b feature/stripe-integration dev
git worktree add ../2025slideheroes-tests -b feature/add-tests dev
```

2. **Work in Parallel:**
- Terminal 1: Claude working on Stripe integration
- Terminal 2: Claude adding test coverage
- Terminal 3: Dev branch for code reviews

3. **End of Day:**
```bash
# Push changes from each worktree
cd ../2025slideheroes-stripe && git push -u origin feature/stripe-integration
cd ../2025slideheroes-tests && git push -u origin feature/add-tests
```

### Example 2: Emergency Hotfix

```bash
# While working on features, critical bug reported
# Hotfixes can branch from either dev or main depending on urgency
# For production hotfix:
git worktree add ../2025slideheroes-hotfix -b hotfix/critical-security-fix main

# For dev environment hotfix:
git worktree add ../2025slideheroes-hotfix -b hotfix/critical-security-fix dev

# Quick fix without disrupting other work
cd ../2025slideheroes-hotfix
claude
# "Fix the security vulnerability in user authentication"

# After fix is complete and tested
git push -u origin hotfix/critical-security-fix
# Create PR to merge into appropriate branch (main or dev)

# Clean up
git worktree remove ../2025slideheroes-hotfix
```

### Example 3: Testing Different Approaches

```bash
# Create worktrees for different implementation approaches (from dev)
git worktree add ../2025slideheroes-approach1 -b experiment/approach1 dev
git worktree add ../2025slideheroes-approach2 -b experiment/approach2 dev

# Have Claude implement different solutions
# Compare and choose the best approach
# Keep the winner, remove the others
```

## Best Practices

### 1. Naming Conventions
- Use descriptive names that match the branch purpose
- Include the project name prefix for clarity
- Examples: `2025slideheroes-auth`, `2025slideheroes-payment`

### 2. Dependency Management
```bash
# Create a setup script for new worktrees
cat > setup-worktree.sh << 'EOF'
#!/bin/bash
WORKTREE_PATH=$1
cd "$WORKTREE_PATH"
pnpm install
cp ../2025slideheroes/.env.local .env.local
echo "Worktree ready at $WORKTREE_PATH"
EOF

chmod +x setup-worktree.sh
```

### 3. Avoiding Conflicts
- Don't modify the same files in multiple worktrees
- Coordinate package.json changes
- Use feature flags for conditional code
- Communicate which files each Claude session should focus on

### 4. Token Usage Management
- Be aware that multiple sessions consume tokens faster (2-3x normal rate)
- Prioritize critical features when running multiple sessions
- Consider time-boxing each session

### 5. Regular Maintenance
```bash
# Weekly cleanup routine
git worktree list
git worktree prune
# Clean up merged branches (excluding main and dev)
git branch -d $(git branch --merged | grep -v -E "main|dev")
```

## Limitations and Considerations

### Claude Code Limitations
- Cannot navigate between worktrees within a single session
- Each session must be started from its worktree directory
- No shared context between different Claude sessions
- Security restrictions prevent parent directory access

### Git Limitations
- Cannot check out the same branch in multiple worktrees
- All worktrees depend on the main `.git` directory
- Deleting the main repository affects all worktrees

### Performance Considerations
- Each worktree needs its own `node_modules` (disk space)
- Multiple development servers may conflict on ports
- System resources divided among multiple Claude sessions

## Troubleshooting

### Problem: "Branch already checked out"
```bash
# Find which worktree has the branch
git worktree list | grep branch-name

# Either use that worktree or create a new branch
git worktree add ../2025slideheroes-feature -b feature/new-branch-name
```

### Problem: Port Conflicts
```bash
# Use different ports for each worktree's dev server
# Worktree 1
PORT=3000 pnpm dev

# Worktree 2
PORT=3001 pnpm dev

# Worktree 3
PORT=3002 pnpm dev
```

### Problem: Worktree Not Removable
```bash
# Force removal if necessary
git worktree remove --force ../2025slideheroes-feature

# Manual cleanup if needed
rm -rf ../2025slideheroes-feature
git worktree prune
```

### Problem: Environment Variables Not Working
```bash
# Ensure each worktree has its own .env files
for worktree in ../2025slideheroes-*; do
  cp .env.local "$worktree/.env.local"
done
```

## Advanced Setup: Helper Functions

Add these to your `~/.bashrc` or `~/.zshrc`:

```bash
# Create and setup SlideHeroes worktree (from dev branch)
sh-worktree() {
    local branch_name=$1
    local worktree_name=${2:-$branch_name}
    local worktree_path="../2025slideheroes-${worktree_name}"
    local base_branch=${3:-dev}  # Default to dev branch
    
    echo "Creating worktree: $worktree_path from $base_branch branch"
    git worktree add "$worktree_path" -b "$branch_name" "$base_branch"
    
    echo "Setting up dependencies..."
    cd "$worktree_path"
    pnpm install
    
    # Copy environment files
    if [ -f "../2025slideheroes/.env.local" ]; then
        cp "../2025slideheroes/.env.local" .env.local
        echo "Copied .env.local"
    fi
    
    echo "Worktree ready! Starting Claude Code..."
    claude
}

# List all SlideHeroes worktrees
sh-list() {
    git worktree list | grep slideheroes
}

# Remove SlideHeroes worktree
sh-remove() {
    local worktree_name=$1
    git worktree remove "../2025slideheroes-${worktree_name}"
}

# Switch to SlideHeroes worktree and start Claude
sh-claude() {
    local worktree_name=$1
    cd "../2025slideheroes-${worktree_name}" && claude
}
```

Usage:
```bash
# Create new worktree from dev branch (default) and start Claude
sh-worktree feature/new-auth auth

# Create worktree from main branch (for hotfixes)
sh-worktree hotfix/urgent-fix hotfix main

# List all worktrees
sh-list

# Switch to existing worktree
sh-claude auth

# Remove worktree
sh-remove auth
```

## Recommended Workflow for SlideHeroes

1. **Dev Branch**: Keep in primary directory for main development work
2. **Feature Branches**: Create worktrees from dev for each major feature
3. **Hotfix Branch**: Create from main for production fixes or dev for development fixes
4. **Experiment Branches**: Use worktrees from dev to test different approaches

### Daily Workflow
```bash
# Morning: Ensure dev branch is up to date
git checkout dev
git pull origin dev

# Create worktrees for planned work (from dev)
sh-worktree feature/user-profiles profiles
sh-worktree feature/payment-integration payment

# Work: Run Claude in each worktree
# Commit and push from each as work progresses

# Evening: Clean up completed work
git worktree remove ../2025slideheroes-profiles
```

## Summary

Git worktrees with Claude Code enable powerful parallel development workflows. By following this guide, you can:
- Develop multiple features simultaneously
- Respond quickly to urgent issues
- Test different implementations
- Maximize productivity with Claude Code

Remember to:
- Start each Claude session from its worktree directory
- Manage token usage across multiple sessions
- Clean up worktrees when features are complete
- Coordinate file changes to avoid conflicts

This setup is particularly valuable for the SlideHeroes project where you might need to work on authentication, API routes, UI components, and bug fixes simultaneously without the overhead of branch switching or stashing changes.