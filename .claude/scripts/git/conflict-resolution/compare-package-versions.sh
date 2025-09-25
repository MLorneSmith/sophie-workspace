#!/bin/bash

# Script to compare and safely merge package updates after conflict resolution
# Used after resolving merge conflicts where "ours" was chosen for package.json files

set -e

echo "📦 Package Version Comparison Tool"
echo "=================================="
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository"
    exit 1
fi

# Function to check if a merge is in progress
check_merge_status() {
    if [ -f .git/MERGE_HEAD ]; then
        echo "✅ Merge in progress detected"
        return 0
    else
        echo "⚠️  No merge in progress. This tool is most useful after merge conflict resolution."
        echo "    Continuing with comparison against the last merge commit..."
        return 1
    fi
}

# Function to find upstream package.json files
find_upstream_packages() {
    local merge_ref="${1:-MERGE_HEAD}"

    if ! git rev-parse "$merge_ref" > /dev/null 2>&1; then
        # Try to find the last merge commit
        merge_ref=$(git log --merges -1 --format=%H 2>/dev/null || echo "HEAD")
        if [ "$merge_ref" = "HEAD" ]; then
            echo "⚠️  Could not find a merge reference. Using HEAD for comparison."
        else
            echo "📍 Using last merge commit: $(git log --oneline -1 $merge_ref)"
        fi
    fi

    echo ""
    echo "📊 Analyzing package.json files..."
    echo ""

    # Find all package.json files in the repository
    local package_files=$(find . -name "package.json" -not -path "*/node_modules/*" -not -path "*/.turbo/*" 2>/dev/null)

    if [ -z "$package_files" ]; then
        echo "❌ No package.json files found"
        return 1
    fi

    local has_differences=false

    for pkg_file in $package_files; do
        # Remove leading ./ from path
        pkg_file=${pkg_file#./}

        # Try to get the upstream version
        if git show "$merge_ref:$pkg_file" > /tmp/upstream_pkg.json 2>/dev/null; then
            # Compare dependencies
            if ! diff -q "$pkg_file" /tmp/upstream_pkg.json > /dev/null 2>&1; then
                has_differences=true
                echo "📦 $pkg_file has differences from upstream"

                # Extract and compare key sections
                if command -v jq > /dev/null 2>&1; then
                    # Use jq if available for better JSON parsing
                    current_deps=$(jq -r '.dependencies // {} | keys[]' "$pkg_file" 2>/dev/null | sort)
                    upstream_deps=$(jq -r '.dependencies // {} | keys[]' /tmp/upstream_pkg.json 2>/dev/null | sort)

                    # Find dependencies only in upstream (potentially missed)
                    missed_deps=$(comm -13 <(echo "$current_deps") <(echo "$upstream_deps") 2>/dev/null)
                    if [ ! -z "$missed_deps" ]; then
                        echo "  ⚠️  Dependencies only in upstream (potentially missed):"
                        echo "$missed_deps" | sed 's/^/      - /'
                    fi
                fi
            fi
        fi
    done

    if [ "$has_differences" = false ]; then
        echo "✅ All package.json files match upstream versions"
    fi

    rm -f /tmp/upstream_pkg.json
}

# Function to run npm-check-updates analysis
run_ncu_analysis() {
    echo ""
    echo "🔍 Running dependency analysis with npm-check-updates..."
    echo ""

    # Check if npm-check-updates is available
    if ! command -v npx > /dev/null 2>&1; then
        echo "⚠️  npx not found. Skipping npm-check-updates analysis."
        return 1
    fi

    echo "📌 Current dependency status:"
    npx -y npm-check-updates --target minor 2>/dev/null || true

    echo ""
    echo "💡 Available update commands:"
    echo "  • Safe updates (patch/minor): npx npm-check-updates -u --target minor && pnpm install"
    echo "  • All updates (including major): npx npm-check-updates -u && pnpm install"
    echo "  • Interactive mode: npx npm-check-updates -i"
}

# Function to check for security vulnerabilities
check_security() {
    echo ""
    echo "🔒 Checking for security vulnerabilities..."
    echo ""

    if command -v pnpm > /dev/null 2>&1; then
        pnpm audit --audit-level moderate 2>/dev/null || true
    elif command -v npm > /dev/null 2>&1; then
        npm audit --audit-level moderate 2>/dev/null || true
    else
        echo "⚠️  No package manager found for security audit"
    fi
}

# Main execution
main() {
    check_merge_status
    find_upstream_packages
    run_ncu_analysis
    check_security

    echo ""
    echo "✅ Analysis complete!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Review the differences identified above"
    echo "2. Apply safe updates using the suggested commands"
    echo "3. Test thoroughly after applying updates"
    echo "4. Commit the updated package.json files"
}

main "$@"