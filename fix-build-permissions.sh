#!/bin/bash
# Fix build permission issues for Next.js projects

# Get the current user
CURRENT_USER=$(whoami)
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)

echo "Fixing build permissions for user: $CURRENT_USER"
echo "Project root: $PROJECT_ROOT"

# Function to fix permissions for a directory
fix_permissions() {
    local dir=$1
    if [ -d "$dir" ]; then
        echo "  ✓ Fixing: $dir"
        # Change ownership to current user
        sudo chown -R $CURRENT_USER:$CURRENT_USER "$dir" 2>/dev/null
        # Set proper permissions
        find "$dir" -type d -exec chmod 755 {} \; 2>/dev/null
        find "$dir" -type f -exec chmod 644 {} \; 2>/dev/null
    else
        echo "  - Skipping (not found): $dir"
    fi
}

# Fix .next directories
fix_permissions "$PROJECT_ROOT/apps/web/.next"
fix_permissions "$PROJECT_ROOT/apps/payload/.next"
fix_permissions "$PROJECT_ROOT/apps/web/node_modules/.cache"
fix_permissions "$PROJECT_ROOT/apps/payload/node_modules/.cache"

# Fix turbo cache if it exists
fix_permissions "$PROJECT_ROOT/.turbo"
fix_permissions "$PROJECT_ROOT/node_modules/.cache"

echo "Permissions fixed. You can now run 'pnpm build'"