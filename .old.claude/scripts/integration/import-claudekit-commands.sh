#!/bin/bash

# Import ClaudeKit commands preserving their directory structure
# Imports directly into .claude/commands/

CLAUDEKIT_DIR="/tmp/claudekit/src/commands"
TARGET_BASE=".claude/commands"

echo "📦 Importing ClaudeKit commands with directory structure..."
echo "📁 Target: $TARGET_BASE"
echo ""

# Create the base directory
mkdir -p "$TARGET_BASE"

# Function to copy files preserving structure
import_directory() {
    local source_dir="$1"
    local target_subdir="$2"
    
    if [ -z "$target_subdir" ]; then
        # Root level commands
        local target_dir="$TARGET_BASE"
        local display_name="root"
    else
        # Subdirectory commands
        local target_dir="$TARGET_BASE/$target_subdir"
        local display_name="$target_subdir"
        mkdir -p "$target_dir"
    fi
    
    echo "📁 Importing $display_name commands..."
    
    # Copy all .md files from the source directory
    for file in "$source_dir"/*.md; do
        if [ -f "$file" ]; then
            local basename=$(basename "$file")
            cp "$file" "$target_dir/$basename"
            echo "  ✅ Imported: $display_name/$basename"
        fi
    done
}

# Import root-level commands
import_directory "$CLAUDEKIT_DIR" ""

# Import subdirectory commands
for subdir in agents-md checkpoint config dev gh git spec; do
    if [ -d "$CLAUDEKIT_DIR/$subdir" ]; then
        import_directory "$CLAUDEKIT_DIR/$subdir" "$subdir"
    fi
done

echo ""
echo "✅ ClaudeKit command import complete!"
echo ""
echo "📊 Import Summary:"
echo "──────────────────"

# Show the imported structure
cd "$TARGET_BASE" 2>/dev/null && {
    echo "📁 Directory structure:"
    find . -type d | sed 's/^/  /'
    echo ""
    echo "📄 Commands by category:"
    for dir in . $(find . -mindepth 1 -type d | sort); do
        local count=$(find "$dir" -maxdepth 1 -name "*.md" 2>/dev/null | wc -l)
        if [ "$count" -gt 0 ]; then
            local display_dir=$(echo "$dir" | sed 's/^\.\///' | sed 's/^\.$/root/')
            echo "  • $display_dir: $count commands"
        fi
    done
    echo ""
    local total=$(find . -name "*.md" | wc -l)
    echo "📁 Total ClaudeKit commands imported: $total"
}

echo ""
echo "💡 Usage Notes:"
echo "──────────────"
echo "• All commands are in: .claude/commands/"
echo "• Commands are organized by category (git/, spec/, etc.)"
echo "• Check for naming conflicts before importing"
echo "• Preserves ClaudeKit's organizational structure"