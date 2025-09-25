#!/bin/bash

# Import ClaudeKit agents preserving their directory structure
# Imports directly into .claude/agents/

CLAUDEKIT_AGENTS="/tmp/claudekit/src/agents"
TARGET_BASE=".claude/agents"

echo "🤖 Importing ClaudeKit agents with directory structure..."
echo "📁 Target: $TARGET_BASE"
echo ""

# Create the base directory
mkdir -p "$TARGET_BASE"

# Import all agent files preserving directory structure
echo "📦 Importing agents..."
imported_count=0
skipped_count=0

# Find all .md files and copy them preserving structure
cd "$CLAUDEKIT_AGENTS"
find . -name "*.md" -type f | while read -r file; do
    # Skip README files
    if [[ "$(basename "$file")" == "README.md" ]]; then
        skipped_count=$((skipped_count + 1))
        continue
    fi
    
    # Get the directory path and create it in target
    dir_path=$(dirname "$file")
    target_dir="$OLDPWD/$TARGET_BASE/$dir_path"
    mkdir -p "$target_dir"
    
    # Copy the file
    cp "$file" "$target_dir/"
    imported_count=$((imported_count + 1))
    
    # Display progress
    echo "  ✅ Imported: ${file#./}"
done
cd - > /dev/null

echo ""
echo "✅ ClaudeKit agent import complete!"
echo ""
echo "📊 Import Summary:"
echo "──────────────────"

# Show the imported structure
if cd "$TARGET_BASE" 2>/dev/null; then
    echo "📁 Directory structure:"
    find . -type d | sort | sed 's/^/  /'
    echo ""
    
    # Count agents by category
    echo "📄 Agents by category:"
    for dir in $(find . -type d | sort); do
        count=$(find "$dir" -maxdepth 1 -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
        if [ "$count" -gt 0 ]; then
            display_dir=$(echo "$dir" | sed 's/^\.\///' | sed 's/^\.$/root/')
            printf "  • %-30s %d agents\n" "$display_dir:" "$count"
        fi
    done
    
    echo ""
    total=$(find . -name "*.md" | wc -l | tr -d ' ')
    echo "🤖 Total ClaudeKit agents imported: $total"
    cd - > /dev/null
fi

echo ""
echo "💡 Usage Notes:"
echo "──────────────"
echo "• All agents are in: .claude/agents/"
echo "• Agents are organized by category (typescript/, testing/, etc.)"
echo "• These are specialized agent templates for various domains"
echo "• Use them with the Task tool when needed"

echo ""
echo "📚 Available Agent Categories:"
echo "──────────────────────────────"
echo "• build-tools   - Webpack, Vite experts"
echo "• code-quality  - Code review and quality"
echo "• database      - Database specialists"
echo "• devops        - DevOps and infrastructure"
echo "• documentation - Documentation experts"
echo "• e2e           - End-to-end testing"
echo "• framework     - Framework specialists"
echo "• frontend      - Frontend development"
echo "• git           - Git expertise"
echo "• nodejs        - Node.js specialists"
echo "• react         - React experts"
echo "• refactoring   - Code refactoring"
echo "• testing       - Testing specialists"
echo "• typescript    - TypeScript experts"