#!/bin/bash

# Optimized Codebase Map Hook for Claude Code
# Provides maximum useful information within 9,000 character limit
# Based on ClaudeKit's codebase-map implementation

set -euo pipefail

# Configuration
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
SESSION_DIR="${PROJECT_ROOT}/.claude/tracking/sessions"
HOOK_NAME="codebase-map"
SESSION_TIMEOUT=3600  # 1 hour in seconds
MAX_OUTPUT_CHARS=8500  # Leave room for headers and formatting

# Create session directory if needed
mkdir -p "${SESSION_DIR}" 2>/dev/null || true

# Function to check if session context was already provided
is_context_already_provided() {
    local session_file="${SESSION_DIR}/${HOOK_NAME}-session-${CLAUDE_SESSION_ID:-default}.json"
    
    if [[ -f "${session_file}" ]]; then
        local last_updated=$(stat -f %m "${session_file}" 2>/dev/null || stat -c %Y "${session_file}" 2>/dev/null || echo 0)
        local current_time=$(date +%s)
        local age=$((current_time - last_updated))
        
        if [[ $age -lt $SESSION_TIMEOUT ]]; then
            return 0  # Context already provided
        fi
    fi
    
    return 1  # Context not provided or expired
}

# Function to mark that context was provided
mark_context_provided() {
    local session_file="${SESSION_DIR}/${HOOK_NAME}-session-${CLAUDE_SESSION_ID:-default}.json"
    echo "{\"timestamp\": $(date +%s), \"session_id\": \"${CLAUDE_SESSION_ID:-default}\"}" > "${session_file}"
}

# Function to generate optimized map
generate_optimized_map() {
    local start_time=$(date +%s%3N)
    
    # First ensure the index is up to date
    if ! pnpm exec codebase-map scan --root "${PROJECT_ROOT}" 2>/dev/null; then
        echo "Error: Failed to scan codebase" >&2
        return 1
    fi
    
    # Get raw JSON data for processing
    local json_output=$(pnpm exec codebase-map format --format json 2>/dev/null || echo "{}")
    
    # Create optimized output using a custom format
    local output=""
    
    # Add summary statistics
    output+="📊 Project Overview:"$'\n'
    output+="├─ Total Files: $(echo "$json_output" | jq -r '.files | length' 2>/dev/null || echo "0")"$'\n'
    output+="├─ TypeScript: $(find "${PROJECT_ROOT}" -name "*.ts" -o -name "*.tsx" 2>/dev/null | grep -v node_modules | wc -l | tr -d ' ')"$'\n'
    output+="├─ Components: $(find "${PROJECT_ROOT}" -name "*.tsx" 2>/dev/null | grep -v node_modules | grep -v test | wc -l | tr -d ' ')"$'\n'
    output+="└─ Tests: $(find "${PROJECT_ROOT}" -name "*.test.*" -o -name "*.spec.*" 2>/dev/null | wc -l | tr -d ' ')"$'\n\n'
    
    # Priority 1: Core application structure (most important)
    output+="🏗️ Core Architecture:"$'\n'
    
    # Apps directory (main applications)
    if [[ -d "${PROJECT_ROOT}/apps" ]]; then
        output+="apps/"$'\n'
        for app in "${PROJECT_ROOT}"/apps/*/; do
            if [[ -d "$app" ]]; then
                local app_name=$(basename "$app")
                output+="├─ ${app_name}/"$'\n'
                
                # Key directories in each app
                for key_dir in "app" "src" "components" "lib" "api" "hooks" "services"; do
                    if [[ -d "${app}${key_dir}" ]]; then
                        local file_count=$(find "${app}${key_dir}" -name "*.ts" -o -name "*.tsx" 2>/dev/null | grep -v test | head -20 | wc -l | tr -d ' ')
                        if [[ $file_count -gt 0 ]]; then
                            output+="│  ├─ ${key_dir}/ (${file_count} files)"$'\n'
                        fi
                    fi
                done
            fi
        done
    fi
    
    # Packages directory (shared code)
    if [[ -d "${PROJECT_ROOT}/packages" ]]; then
        output+="\npackages/\n"
        for pkg in "${PROJECT_ROOT}"/packages/*/; do
            if [[ -d "$pkg" ]]; then
                local pkg_name=$(basename "$pkg")
                output+="├─ ${pkg_name}/\n"
                
                # Show main exports/index files
                if [[ -f "${pkg}/src/index.ts" ]] || [[ -f "${pkg}/src/index.tsx" ]]; then
                    # Get main exports from index
                    local exports=$(grep -E "^export" "${pkg}/src/index.ts" "${pkg}/src/index.tsx" 2>/dev/null | head -5 | sed 's/^/│  │  /')
                    if [[ -n "$exports" ]]; then
                        output+="│  └─ exports:\n${exports}\n"
                    fi
                fi
            fi
        done
    fi
    
    # Priority 2: Key configuration files
    output+="\n⚙️ Configuration:\n"
    local config_files=(
        "package.json"
        "tsconfig.json"
        "next.config.ts"
        "next.config.js"
        "biome.json"
        ".env.example"
        "turbo.json"
    )
    
    for config in "${config_files[@]}"; do
        if [[ -f "${PROJECT_ROOT}/${config}" ]]; then
            output+="├─ ${config}\n"
        fi
    done
    
    # Priority 3: Database and API structure
    if [[ -d "${PROJECT_ROOT}/supabase" ]] || [[ -d "${PROJECT_ROOT}/prisma" ]]; then
        output+="\n🗄️ Database:\n"
        
        if [[ -d "${PROJECT_ROOT}/supabase/migrations" ]]; then
            local migration_count=$(ls -1 "${PROJECT_ROOT}/supabase/migrations" 2>/dev/null | wc -l | tr -d ' ')
            output+="├─ Migrations: ${migration_count} files\n"
        fi
        
        if [[ -f "${PROJECT_ROOT}/prisma/schema.prisma" ]]; then
            output+="├─ Prisma Schema: present\n"
        fi
    fi
    
    # Priority 4: Key TypeScript interfaces and types
    output+="\n📝 Key Types & Interfaces:\n"
    
    # Find type definition files
    local type_files=$(find "${PROJECT_ROOT}" -name "*.types.ts" -o -name "*.d.ts" 2>/dev/null | grep -v node_modules | head -10)
    if [[ -n "$type_files" ]]; then
        echo "$type_files" | while read -r file; do
            local relative_path=${file#$PROJECT_ROOT/}
            output+="├─ ${relative_path}\n"
        done
    fi
    
    # Priority 5: API routes (if Next.js)
    if [[ -d "${PROJECT_ROOT}/apps/web/app" ]]; then
        output+="\n🌐 API Routes:\n"
        local api_routes=$(find "${PROJECT_ROOT}/apps/web/app" -name "route.ts" -o -name "route.tsx" 2>/dev/null | grep -v node_modules | head -15)
        if [[ -n "$api_routes" ]]; then
            echo "$api_routes" | while read -r route; do
                local relative_path=${route#$PROJECT_ROOT/}
                relative_path=${relative_path#apps/web/app/}
                # Extract HTTP methods from the route file
                local methods=$(grep -E "^export (async )?function (GET|POST|PUT|DELETE|PATCH)" "$route" 2>/dev/null | sed 's/export.*function //' | sed 's/(.*$//' | tr '\n' ',' | sed 's/,$//')
                if [[ -n "$methods" ]]; then
                    output+="├─ ${relative_path} [${methods}]\n"
                fi
            done
        fi
    fi
    
    # Calculate and add execution time
    local end_time=$(date +%s%3N)
    local execution_time=$((end_time - start_time))
    
    # Add footer with performance info
    output+="\n⏱️ Generated in ${execution_time}ms | Full index: .codebasemap"
    
    echo "$output"
}

# Main execution
main() {
    # Check if this hook is for UserPromptSubmit
    if [[ "${CLAUDE_HOOK_TYPE:-}" != "UserPromptSubmit" ]]; then
        exit 0
    fi
    
    # Check if we already provided context in this session
    if is_context_already_provided; then
        exit 0
    fi
    
    # Generate the optimized map
    local map_output
    if map_output=$(generate_optimized_map); then
        # Mark that we've provided context
        mark_context_provided
        
        # Calculate total output size
        local header="📍 Codebase Map (loaded once per session):\n\n"
        local full_output="${header}${map_output}"
        local output_length=${#full_output}
        
        # Output with truncation if needed
        if [[ $output_length -gt $MAX_OUTPUT_CHARS ]]; then
            echo -n "${full_output:0:$MAX_OUTPUT_CHARS}"
            echo -e "\n[truncated at ${MAX_OUTPUT_CHARS} chars]"
        else
            echo "$full_output"
        fi
    fi
    
    exit 0
}

# Run main function
main "$@"