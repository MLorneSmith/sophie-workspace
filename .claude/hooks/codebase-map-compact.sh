#!/bin/bash

# Compact Codebase Map Hook for Claude Code
# Provides maximum useful information within 9,000 character limit
# Prioritizes business logic and key architecture over test files

set -euo pipefail

PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
SESSION_DIR="${PROJECT_ROOT}/.claude/tracking/sessions"
HOOK_NAME="codebase-map"
SESSION_TIMEOUT=3600
MAX_CHARS=8800

mkdir -p "${SESSION_DIR}" 2>/dev/null || true

# Check session
is_context_provided() {
    local session_file="${SESSION_DIR}/${HOOK_NAME}-${CLAUDE_SESSION_ID:-default}.json"
    [[ -f "$session_file" ]] || return 1
    local age=$(( $(date +%s) - $(stat -f %m "$session_file" 2>/dev/null || stat -c %Y "$session_file" 2>/dev/null || echo 0) ))
    [[ $age -lt $SESSION_TIMEOUT ]]
}

mark_context_provided() {
    echo "{\"ts\": $(date +%s)}" > "${SESSION_DIR}/${HOOK_NAME}-${CLAUDE_SESSION_ID:-default}.json"
}

generate_compact_map() {
    # Ensure index is up-to-date
    pnpm exec codebase-map scan --root "${PROJECT_ROOT}" 2>/dev/null || true
    
    echo "📊 Project Stats:"
    echo "• Files: $(find . -name "*.ts" -o -name "*.tsx" 2>/dev/null | grep -cv node_modules)"
    echo "• Components: $(find . -name "*.tsx" 2>/dev/null | grep -cv "node_modules\|test")"
    echo "• Tests: $(find . -name "*.test.*" -o -name "*.spec.*" 2>/dev/null | wc -l | tr -d ' ')"
    echo ""
    
    echo "🏗️ Architecture:"
    
    # Apps (most important)
    if [[ -d "apps" ]]; then
        echo "apps/"
        for app in apps/*/; do
            [[ -d "$app" ]] || continue
            name=$(basename "$app")
            echo "├─ $name/"
            
            # Show key dirs with file counts
            for dir in app src components lib hooks api; do
                [[ -d "$app$dir" ]] || continue
                count=$(find "$app$dir" -name "*.ts" -o -name "*.tsx" 2>/dev/null | grep -cv test || echo 0)
                [[ $count -gt 0 ]] && echo "│  ├─ $dir/ ($count)"
            done
            
            # Show key files
            for file in "package.json" "next.config.*" "tsconfig.json"; do
                ls "$app"$file 2>/dev/null | head -1 | xargs -I{} basename {} | sed 's/^/│  └─ /'
            done
        done
    fi
    
    # Packages (shared code)
    if [[ -d "packages" ]]; then
        echo ""
        echo "packages/"
        for pkg in packages/*/; do
            [[ -d "$pkg" ]] || continue
            name=$(basename "$pkg")
            echo "├─ $name/"
            
            # Show main export if exists
            if [[ -f "$pkg/src/index.ts" ]] || [[ -f "$pkg/src/index.tsx" ]]; then
                exports=$(grep -E "^export" "$pkg/src/index."* 2>/dev/null | head -3 | cut -d: -f2 | sed 's/export //' | sed 's/ {.*//' | sed 's/^/│  ├─ /')
                [[ -n "$exports" ]] && echo "$exports"
            fi
        done
    fi
    
    # Key configs
    echo ""
    echo "⚙️ Config:"
    for config in package.json tsconfig.json biome.json turbo.json next.config.*; do
        ls $config 2>/dev/null | head -1 | xargs -I{} echo "├─ {}"
    done
    
    # API Routes (Next.js)
    if [[ -d "apps/web/app" ]]; then
        echo ""
        echo "🌐 API Routes:"
        find apps/web/app -name "route.ts" 2>/dev/null | head -10 | while read -r route; do
            path=${route#apps/web/app/}
            methods=$(grep -oE "export.*(GET|POST|PUT|DELETE|PATCH)" "$route" 2>/dev/null | sed 's/export.*function //' | tr '\n' ',' | sed 's/,$//')
            [[ -n "$methods" ]] && echo "├─ $path [$methods]"
        done
    fi
    
    # Database
    if [[ -d "supabase/migrations" ]] || [[ -f "prisma/schema.prisma" ]]; then
        echo ""
        echo "🗄️ Database:"
        [[ -d "supabase/migrations" ]] && echo "├─ Migrations: $(ls -1 supabase/migrations 2>/dev/null | wc -l | tr -d ' ')"
        [[ -f "prisma/schema.prisma" ]] && echo "├─ Prisma Schema"
    fi
    
    # Key features/patterns
    echo ""
    echo "🔑 Key Patterns:"
    
    # Find server actions
    actions=$(grep -r "use server" --include="*.ts" --include="*.tsx" 2>/dev/null | head -5 | cut -d: -f1 | xargs -I{} basename {} .ts | xargs -I{} basename {} .tsx | sed 's/^/├─ /')
    [[ -n "$actions" ]] && echo "$actions"
    
    # Find hooks
    hooks=$(find . -name "use*.ts" -o -name "use*.tsx" 2>/dev/null | grep -v node_modules | head -5 | xargs -I{} basename {} | sed 's/^/├─ /')
    [[ -n "$hooks" ]] && echo "$hooks"
}

main() {
    [[ "${CLAUDE_HOOK_TYPE:-}" != "UserPromptSubmit" ]] && exit 0
    is_context_provided && exit 0
    
    output="📍 Codebase Map (session-cached):"$'\n\n'
    output+=$(generate_compact_map)
    
    # Truncate if needed
    if [[ ${#output} -gt $MAX_CHARS ]]; then
        echo "${output:0:$MAX_CHARS}"
        echo "[truncated]"
    else
        echo "$output"
    fi
    
    mark_context_provided
}

main