#!/bin/bash
# Enhanced Git Worktree Creation Script with Local Config Copying
# Location: .claude/scripts/worktree/create-worktree-enhanced.sh

set -e

# Configuration
WORKTREE_BASE="$HOME/projects/worktrees"
MAIN_REPO_PATH="$(git rev-parse --show-toplevel 2>/dev/null)"

# Validate we're in a git repository
if [ -z "$MAIN_REPO_PATH" ]; then
    echo "Error: Not in a git repository"
    exit 1
fi

# Get feature name from argument
if [ -z "$1" ]; then
    echo "Error: Feature name required"
    echo "Usage: $0 <feature-name>"
    exit 1
fi

FEATURE_NAME="$1"
BRANCH_NAME="feature-${FEATURE_NAME}"
WORKTREE_PATH="${WORKTREE_BASE}/${BRANCH_NAME}"

# Check if branch already exists
if git show-ref --verify --quiet "refs/heads/${BRANCH_NAME}"; then
    echo "Error: Branch '${BRANCH_NAME}' already exists"
    echo "Please choose a different feature name or delete the existing branch"
    exit 1
fi

# Create worktree base directory if it doesn't exist
if [ ! -d "$WORKTREE_BASE" ]; then
    echo "Creating worktree base directory: $WORKTREE_BASE"
    mkdir -p "$WORKTREE_BASE"
fi

# Fetch latest changes
echo "Fetching latest changes from origin..."
git fetch origin dev --quiet

# Create the worktree with new branch
echo "Creating worktree at: $WORKTREE_PATH"
git worktree add -b "$BRANCH_NAME" "$WORKTREE_PATH" origin/dev

# Copy local configuration files
echo ""
echo "📋 Copying local configuration files..."

# Function to safely copy a file if it exists
copy_if_exists() {
    local src="$1"
    local dest="$2"
    local desc="$3"
    
    if [ -f "$src" ]; then
        cp "$src" "$dest"
        echo "   ✅ Copied $desc"
    else
        echo "   ⚠️  No $desc found (skipped)"
    fi
}

# Copy environment files
copy_if_exists "$MAIN_REPO_PATH/.env" "$WORKTREE_PATH/.env" ".env"
copy_if_exists "$MAIN_REPO_PATH/.env.local" "$WORKTREE_PATH/.env.local" ".env.local"
copy_if_exists "$MAIN_REPO_PATH/.env.station" "$WORKTREE_PATH/.env.station" ".env.station"

# Copy MCP configuration
copy_if_exists "$MAIN_REPO_PATH/.mcp.json" "$WORKTREE_PATH/.mcp.json" ".mcp.json"

# Copy Claude local settings
if [ -d "$MAIN_REPO_PATH/.claude" ]; then
    # Create .claude directory if needed
    mkdir -p "$WORKTREE_PATH/.claude"
    
    # Copy local settings files
    copy_if_exists "$MAIN_REPO_PATH/.claude/settings.local.json" \
                   "$WORKTREE_PATH/.claude/settings.local.json" \
                   "Claude local settings"
    
    # Copy any .env files in .claude directory
    if ls "$MAIN_REPO_PATH/.claude"/.env* 1> /dev/null 2>&1; then
        cp "$MAIN_REPO_PATH/.claude"/.env* "$WORKTREE_PATH/.claude/" 2>/dev/null || true
        echo "   ✅ Copied .claude environment files"
    fi
fi

# Copy other common local config files
copy_if_exists "$MAIN_REPO_PATH/.vscode/settings.json" "$WORKTREE_PATH/.vscode/settings.json" "VS Code settings"

# Create a symlink to shared node_modules if it exists (optional optimization)
# This saves disk space and install time for large projects
if [ -d "$MAIN_REPO_PATH/node_modules" ] && [ ! -d "$WORKTREE_PATH/node_modules" ]; then
    echo ""
    read -p "Link to existing node_modules to save space? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ln -s "$MAIN_REPO_PATH/node_modules" "$WORKTREE_PATH/node_modules"
        echo "   ✅ Linked node_modules (saves disk space)"
    else
        # Install dependencies
        echo ""
        echo "Installing dependencies with pnpm..."
        cd "$WORKTREE_PATH"
        pnpm install --frozen-lockfile
    fi
else
    # Install dependencies
    echo ""
    echo "Installing dependencies with pnpm..."
    cd "$WORKTREE_PATH"
    pnpm install --frozen-lockfile
fi

# Open in VS Code if available (non-blocking)
if command -v code &> /dev/null; then
    echo "Opening worktree in VS Code..."
    code -n "$WORKTREE_PATH" 2>/dev/null || true
fi

# Success message with warnings about sensitive files
echo ""
echo "✅ Successfully created worktree!"
echo "   Branch: $BRANCH_NAME"
echo "   Location: $WORKTREE_PATH"
echo "   Based on: origin/dev"
echo ""
echo "⚠️  Security Note: Local config files have been copied."
echo "   These contain sensitive data (API keys, etc.)"
echo "   Remember to:"
echo "   - Never commit .env or .mcp.json files"
echo "   - Keep different keys for dev/staging/production"
echo ""
echo "WORKTREE_PATH=$WORKTREE_PATH"