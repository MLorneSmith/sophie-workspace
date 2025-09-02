#!/bin/bash
# Fix Git tracking issues in Codespaces by excluding large directories

set -e

echo "🔧 Fixing Git tracking issues..."

# Function to add pattern to git exclude if not already present
add_to_exclude() {
    local pattern="$1"
    local exclude_file="/workspace/.git/info/exclude"
    
    if [ -f "$exclude_file" ]; then
        if ! grep -q "^${pattern}$" "$exclude_file" 2>/dev/null; then
            echo "$pattern" >> "$exclude_file"
            echo "  Added: $pattern"
        fi
    fi
}

# Create exclude file if it doesn't exist
mkdir -p /workspace/.git/info 2>/dev/null || true
touch /workspace/.git/info/exclude 2>/dev/null || true

# Add all volume-mounted and generated directories
echo "📝 Updating Git exclude patterns..."

# Node modules at all levels
add_to_exclude "node_modules/"
add_to_exclude "**/node_modules/"
add_to_exclude "apps/*/node_modules/"
add_to_exclude "packages/*/node_modules/"

# Build outputs
add_to_exclude ".next/"
add_to_exclude "**/.next/"
add_to_exclude "apps/*/.next/"
add_to_exclude "dist/"
add_to_exclude "**/dist/"
add_to_exclude "build/"
add_to_exclude "**/build/"
add_to_exclude ".turbo/"
add_to_exclude "**/.turbo/"

# Package manager caches
add_to_exclude ".pnpm-store/"
add_to_exclude ".pnpm/"
add_to_exclude "**/.pnpm/"
add_to_exclude ".npm/"
add_to_exclude ".yarn/"
add_to_exclude ".cache/"

# Supabase
add_to_exclude ".supabase/"
add_to_exclude "apps/web/.supabase/"

# Testing
add_to_exclude "coverage/"
add_to_exclude "**/coverage/"
add_to_exclude ".nyc_output/"
add_to_exclude "test-results/"
add_to_exclude "playwright-report/"

# IDE and tools
add_to_exclude ".vscode-server/"
add_to_exclude ".vscode-remote/"
add_to_exclude ".devcontainer/volumes/"

# Temporary files
add_to_exclude "*.log"
add_to_exclude "*.tmp"
add_to_exclude "tmp/"
add_to_exclude "temp/"

# Configure Git to be more efficient
echo "⚙️ Configuring Git performance settings..."

# Increase Git buffer size for better performance
git config core.bigFileThreshold 256m 2>/dev/null || true
git config core.compression 0 2>/dev/null || true
git config core.deltaBaseCacheLimit 256m 2>/dev/null || true

# Disable automatic GC in Codespaces
git config gc.auto 0 2>/dev/null || true

# Use the exclude file
git config core.excludesFile /workspace/.git/info/exclude 2>/dev/null || true

# Mark directories as assume-unchanged if they exist
echo "🚫 Marking large directories as assume-unchanged..."

mark_assume_unchanged() {
    local dir="$1"
    if [ -d "/workspace/$dir" ]; then
        # Mark all files in directory as assume-unchanged
        find "/workspace/$dir" -type f 2>/dev/null | head -1000 | while read -r file; do
            git update-index --assume-unchanged "$file" 2>/dev/null || true
        done
        echo "  Marked: $dir"
    fi
}

# Only mark the most problematic directories
mark_assume_unchanged "node_modules"
mark_assume_unchanged ".next"
mark_assume_unchanged ".turbo"

# Clear Git index of these files if they're tracked
echo "🧹 Cleaning Git index..."
git rm -r --cached node_modules 2>/dev/null || true
git rm -r --cached .next 2>/dev/null || true
git rm -r --cached .turbo 2>/dev/null || true
git rm -r --cached .pnpm-store 2>/dev/null || true
git rm -r --cached "**/node_modules" 2>/dev/null || true
git rm -r --cached "**/.next" 2>/dev/null || true

# Reset to clean state
git reset HEAD 2>/dev/null || true

echo "✅ Git tracking fixed!"
echo ""
echo "If you still see warnings, run:"
echo "  git status --ignored"
echo "  git clean -fxd node_modules .next .turbo"