#!/bin/bash

# File Guard Hook for Claude Code
# Based on ClaudeKit's file-guard implementation
# Prevents AI from accessing sensitive files based on .aiignore patterns

set -euo pipefail

# Configuration
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
AIIGNORE_FILE="${PROJECT_ROOT}/.claude/patterns/.aiignore"
DEFAULT_AIIGNORE="${PROJECT_ROOT}/.claude/patterns/.aiignore.default"

# Default sensitive patterns
DEFAULT_PATTERNS=(
    "*.env"
    "*.env.*"
    ".env*"
    "*_key"
    "*_key.*"
    "*.key"
    "*.pem"
    "*.p12"
    "*.pfx"
    "*.cert"
    "*.crt"
    "*.der"
    "id_rsa*"
    "id_dsa*"
    "id_ecdsa*"
    "id_ed25519*"
    ".ssh/*"
    ".git/config"
    ".npmrc"
    ".netrc"
    "*.secret"
    "*secret*"
    "*password*"
    "*token*"
    "*apikey*"
    "*api_key*"
    ".aws/*"
    ".docker/config.json"
    "*.sqlite"
    "*.db"
)

# Function to create default .aiignore if it doesn't exist
create_default_aiignore() {
    if [[ ! -f "${AIIGNORE_FILE}" ]] && [[ ! -f "${DEFAULT_AIIGNORE}" ]]; then
        mkdir -p "$(dirname "${DEFAULT_AIIGNORE}")"
        {
            echo "# Default patterns to prevent AI access to sensitive files"
            echo "# Add custom patterns below"
            echo ""
            for pattern in "${DEFAULT_PATTERNS[@]}"; do
                echo "${pattern}"
            done
        } > "${DEFAULT_AIIGNORE}"
    fi
}

# Function to check if a file matches any ignore pattern
is_file_protected() {
    local file_to_check="$1"
    local filename=$(basename "${file_to_check}")
    local matched_pattern=""
    
    # Load patterns from .aiignore files
    local patterns=()
    
    # Load from default .aiignore
    if [[ -f "${DEFAULT_AIIGNORE}" ]]; then
        while IFS= read -r line; do
            # Skip comments and empty lines
            [[ "${line}" =~ ^#.*$ || -z "${line}" ]] && continue
            patterns+=("${line}")
        done < "${DEFAULT_AIIGNORE}"
    fi
    
    # Load from custom .aiignore
    if [[ -f "${AIIGNORE_FILE}" ]]; then
        while IFS= read -r line; do
            # Skip comments and empty lines
            [[ "${line}" =~ ^#.*$ || -z "${line}" ]] && continue
            patterns+=("${line}")
        done < "${AIIGNORE_FILE}"
    fi
    
    # If no patterns loaded, use defaults
    if [[ ${#patterns[@]} -eq 0 ]]; then
        patterns=("${DEFAULT_PATTERNS[@]}")
    fi
    
    # Check each pattern
    for pattern in "${patterns[@]}"; do
        # Use bash pattern matching
        if [[ "${filename}" == ${pattern} ]] || [[ "${file_to_check}" == */${pattern} ]]; then
            matched_pattern="${pattern}"
            break
        fi
        
        # Check if the full path contains the pattern
        if [[ "${file_to_check}" == *${pattern}* ]]; then
            matched_pattern="${pattern}"
            break
        fi
    done
    
    if [[ -n "${matched_pattern}" ]]; then
        echo "${matched_pattern}"
        return 0
    fi
    
    return 1
}

# Function to extract file paths from bash commands
extract_paths_from_command() {
    local command="$1"
    local paths=()
    
    # Common file-reading commands to check for
    local read_commands="cat|head|tail|less|more|grep|awk|sed|vim|vi|nano|emacs|code|open"
    
    # Check if command contains file-reading operations
    if echo "${command}" | grep -qE "(${read_commands})" ; then
        # Extract potential file paths (basic heuristic)
        # Look for .env, .key, .pem, etc.
        local sensitive_extensions="env|key|pem|p12|pfx|cert|crt|der|secret|sqlite|db"
        
        # Extract words that might be file paths
        for word in ${command}; do
            # Remove quotes if present
            word="${word%\"}"
            word="${word#\"}"
            word="${word%\'}"
            word="${word#\'}"
            
            # Check if it looks like a sensitive file
            if echo "${word}" | grep -qE "\.(${sensitive_extensions})" || \
               echo "${word}" | grep -qE "(secret|password|token|apikey|api_key)" ; then
                paths+=("${word}")
            fi
        done
    fi
    
    # Return paths as newline-separated string
    printf '%s\n' "${paths[@]}"
}

# Main execution based on tool type
main() {
    # Get tool name from environment
    local tool_name="${CLAUDE_TOOL_NAME:-}"
    local tool_input="${CLAUDE_TOOL_INPUT:-}"
    
    # Create default .aiignore if needed
    create_default_aiignore
    
    # Handle different tool types
    case "${tool_name}" in
        "Read"|"Edit"|"MultiEdit"|"Write")
            # Extract file path from tool input
            local file_path=""
            if command -v jq &> /dev/null && [[ -n "${tool_input}" ]]; then
                file_path=$(echo "${tool_input}" | jq -r '.file_path // empty' 2>/dev/null)
            fi
            
            # Check if file is protected
            if [[ -n "${file_path}" ]]; then
                if matched_pattern=$(is_file_protected "${file_path}"); then
                    echo "Access denied: '$(basename "${file_path}")' is protected by pattern '${matched_pattern}'"
                    echo "This file matches patterns that prevent AI assistant access."
                    exit 1
                fi
            fi
            ;;
            
        "Bash")
            # Extract command from tool input
            local command=""
            if command -v jq &> /dev/null && [[ -n "${tool_input}" ]]; then
                command=$(echo "${tool_input}" | jq -r '.command // empty' 2>/dev/null)
            fi
            
            # Check for sensitive file access in commands
            if [[ -n "${command}" ]]; then
                # Check for dangerous patterns
                if echo "${command}" | grep -qE "(find.*\-name.*\.env.*xargs.*cat|find.*\.env.*\-exec.*cat)" ; then
                    echo "Access denied: pipeline constructs or locates sensitive filenames for reading."
                    exit 1
                fi
                
                # Extract and check individual paths
                while IFS= read -r path; do
                    if [[ -n "${path}" ]]; then
                        if matched_pattern=$(is_file_protected "${path}"); then
                            echo "Access denied: Command references protected file '${path}'"
                            echo "This path matches pattern '${matched_pattern}' that prevents AI assistant access."
                            exit 1
                        fi
                    fi
                done <<< "$(extract_paths_from_command "${command}")"
            fi
            ;;
    esac
    
    # Allow access if no issues found
    exit 0
}

# Run main function
main