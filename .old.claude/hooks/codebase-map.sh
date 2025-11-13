#!/bin/bash

# Codebase Map Hook for Claude Code
# Based on ClaudeKit's codebase-map implementation
# Provides project structure to Claude at session start or first prompt

set -euo pipefail

# Configuration
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
CLAUDE_DATA_DIR="${HOME}/.claude"
HOOK_NAME="codebase-map"
SESSION_DIR="${CLAUDE_DATA_DIR}/sessions"
OUTPUT_DIR="${PROJECT_ROOT}/.claude/data"

# Ensure directories exist
mkdir -p "${SESSION_DIR}" "${OUTPUT_DIR}"

# Get session ID from environment or use timestamp
SESSION_ID="${CLAUDE_SESSION_ID:-unknown}"
SESSION_FILE="${SESSION_DIR}/${HOOK_NAME}-session-${SESSION_ID}.json"

# Function to check if context was already provided
has_provided_context() {
    if [[ "${SESSION_ID}" == "unknown" ]]; then
        return 1  # Always generate for unknown sessions
    fi
    
    if [[ -f "${SESSION_FILE}" ]]; then
        # Check if contextProvided flag is true
        grep -q '"contextProvided":\s*true' "${SESSION_FILE}" 2>/dev/null && return 0
    fi
    
    return 1
}

# Function to mark context as provided
mark_context_provided() {
    if [[ "${SESSION_ID}" != "unknown" ]]; then
        cat > "${SESSION_FILE}" <<EOF
{
  "sessionId": "${SESSION_ID}",
  "contextProvided": true,
  "timestamp": "$(date -Iseconds)",
  "hookName": "${HOOK_NAME}"
}
EOF
    fi
}

# Function to load configuration from settings.json
load_config() {
    local config_file="${PROJECT_ROOT}/.claude/settings.json"
    local include_patterns=""
    local exclude_patterns=""
    local format="auto"
    
    if [[ -f "${config_file}" ]]; then
        # Extract codebase-map config if it exists
        if command -v jq &> /dev/null; then
            local config=$(jq -r '.hooks."codebase-map" // {}' "${config_file}" 2>/dev/null || echo '{}')
            
            # Extract include patterns
            local includes=$(echo "$config" | jq -r '.include[]? // empty' 2>/dev/null)
            if [[ -n "$includes" ]]; then
                while IFS= read -r pattern; do
                    include_patterns="${include_patterns} --include \"${pattern}\""
                done <<< "$includes"
            fi
            
            # Extract exclude patterns
            local excludes=$(echo "$config" | jq -r '.exclude[]? // empty' 2>/dev/null)
            if [[ -n "$excludes" ]]; then
                while IFS= read -r pattern; do
                    exclude_patterns="${exclude_patterns} --exclude \"${pattern}\""
                done <<< "$excludes"
            fi
            
            # Extract format
            format=$(echo "$config" | jq -r '.format // "auto"' 2>/dev/null)
        fi
    fi
    
    echo "${include_patterns}|${exclude_patterns}|${format}"
}

# Function to generate codebase map
generate_map() {
    local config=$(load_config)
    IFS='|' read -r include_patterns exclude_patterns format <<< "$config"
    
    # Performance timing
    local start_time=$(date +%s%3N)
    
    # First, scan the project to create/update the index
    if ! pnpm exec codebase-map scan --root "${PROJECT_ROOT}" 2>/dev/null; then
        echo "Error: Failed to scan codebase" >&2
        return 1
    fi
    
    # Then format and get the result with filtering
    local format_cmd="pnpm exec codebase-map format --format ${format}"
    
    # Add include/exclude patterns if provided
    if [[ -n "${include_patterns}" ]]; then
        format_cmd="${format_cmd} ${include_patterns}"
    fi
    if [[ -n "${exclude_patterns}" ]]; then
        format_cmd="${format_cmd} ${exclude_patterns}"
    fi
    
    # Execute and capture output
    local output
    if output=$(eval "${format_cmd}" 2>/dev/null); then
        # Calculate execution time
        local end_time=$(date +%s%3N)
        local execution_time=$((end_time - start_time))
        
        # Log performance in debug mode
        if [[ "${DEBUG:-false}" == "true" ]]; then
            echo "Codebase map generated in ${execution_time}ms" >&2
        fi
        
        # Check performance requirement (<500ms)
        if [[ $execution_time -gt 500 ]] && [[ "${DEBUG:-false}" == "true" ]]; then
            echo "Warning: Performance target missed (${execution_time}ms > 500ms)" >&2
        fi
        
        echo "${output}"
        return 0
    else
        echo "Error: Failed to format codebase map" >&2
        return 1
    fi
}

# Function to clean old session files (older than 24 hours)
clean_old_sessions() {
    if command -v find &> /dev/null; then
        find "${SESSION_DIR}" -name "${HOOK_NAME}-session-*.json" -type f -mtime +1 -delete 2>/dev/null || true
    fi
}

# Main execution
main() {
    # Skip if context was already provided for this session
    if has_provided_context; then
        exit 0
    fi
    
    # Generate the codebase map
    local map_output
    if map_output=$(generate_map); then
        # Mark that we've provided context
        mark_context_provided
        
        # Clean old sessions (async, non-blocking)
        clean_old_sessions &
        
        # Output the map with header
        echo "📍 Codebase Map (loaded once per session):"
        echo ""
        
        # Truncate if needed for UserPromptSubmit (10,000 char limit)
        local output_length=${#map_output}
        if [[ $output_length -gt 9000 ]]; then
            # Output only the first 9000 characters
            echo "${map_output:0:9000}"
            echo ""
            echo "[output truncated - exceeded 9000 characters]"
        else
            # Output full content if under limit
            echo "${map_output}"
        fi
    else
        # Silent failure - don't block user prompt
        exit 0
    fi
}

# Run main function
main