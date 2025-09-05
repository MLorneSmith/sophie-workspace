#!/bin/bash

# Git Checkpoint Hook for Claude Code
# Based on ClaudeKit's create-checkpoint implementation
# Creates git stash checkpoints without modifying working directory

set -euo pipefail

# Configuration
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
PREFIX="${CHECKPOINT_PREFIX:-claude}"
MAX_CHECKPOINTS="${MAX_CHECKPOINTS:-10}"

# Function to load configuration from settings.json
load_config() {
    local config_file="${PROJECT_ROOT}/.claude/settings.json"
    
    if [[ -f "${config_file}" ]] && command -v jq &> /dev/null; then
        # Extract checkpoint config if it exists
        local config=$(jq -r '.hooks."create-checkpoint" // {}' "${config_file}" 2>/dev/null || echo '{}')
        
        # Override defaults with config values
        PREFIX=$(echo "$config" | jq -r '.prefix // "claude"' 2>/dev/null)
        MAX_CHECKPOINTS=$(echo "$config" | jq -r '.maxCheckpoints // 10' 2>/dev/null)
    fi
}

# Function to check if there are changes to checkpoint
has_changes() {
    # Check if there are any changes (staged or unstaged)
    local changes=$(git -C "${PROJECT_ROOT}" status --porcelain 2>/dev/null)
    [[ -n "${changes}" ]]
}

# Function to create checkpoint
create_checkpoint() {
    local timestamp=$(date -Iseconds)
    local message="${PREFIX}-checkpoint: Auto-save at ${timestamp}"
    
    # Add all files temporarily (including untracked)
    git -C "${PROJECT_ROOT}" add -A 2>/dev/null
    
    # Create stash object without modifying working directory
    local stash_sha=$(git -C "${PROJECT_ROOT}" stash create "${message}" 2>/dev/null)
    
    if [[ -n "${stash_sha}" ]]; then
        # Store the stash in the stash list
        git -C "${PROJECT_ROOT}" stash store -m "${message}" "${stash_sha}" 2>/dev/null
        
        # Reset index to unstage files (restore original state)
        git -C "${PROJECT_ROOT}" reset --quiet 2>/dev/null
        
        if [[ "${DEBUG:-false}" == "true" ]]; then
            echo "Created checkpoint: ${message}" >&2
        fi
        
        return 0
    else
        return 1
    fi
}

# Function to clean up old checkpoints
cleanup_old_checkpoints() {
    # Get list of all checkpoints
    local checkpoints=()
    local stash_list=$(git -C "${PROJECT_ROOT}" stash list 2>/dev/null || echo "")
    
    if [[ -z "${stash_list}" ]]; then
        return 0
    fi
    
    # Count checkpoints with our prefix
    local checkpoint_count=0
    while IFS= read -r line; do
        if [[ "${line}" == *"${PREFIX}-checkpoint"* ]]; then
            checkpoint_count=$((checkpoint_count + 1))
        fi
    done <<< "${stash_list}"
    
    # Remove old checkpoints if over limit
    if [[ ${checkpoint_count} -gt ${MAX_CHECKPOINTS} ]]; then
        local to_remove=$((checkpoint_count - MAX_CHECKPOINTS))
        local removed=0
        local index=0
        
        # Process stash list in reverse (oldest first)
        while IFS= read -r line; do
            if [[ "${line}" == *"${PREFIX}-checkpoint"* ]] && [[ ${removed} -lt ${to_remove} ]]; then
                # Extract stash reference (e.g., stash@{0})
                local stash_ref="stash@{${index}}"
                git -C "${PROJECT_ROOT}" stash drop "${stash_ref}" 2>/dev/null
                removed=$((removed + 1))
                
                if [[ "${DEBUG:-false}" == "true" ]]; then
                    echo "Removed old checkpoint: ${stash_ref}" >&2
                fi
            fi
            index=$((index + 1))
        done <<< "${stash_list}"
    fi
}

# Main execution
main() {
    # Load configuration
    load_config
    
    # Check if we're in a git repository
    if ! git -C "${PROJECT_ROOT}" rev-parse --git-dir &>/dev/null; then
        # Not a git repo, silently exit
        exit 0
    fi
    
    # Check if there are any changes to checkpoint
    if ! has_changes; then
        # No changes, silently exit
        exit 0
    fi
    
    # Create the checkpoint
    if create_checkpoint; then
        # Clean up old checkpoints
        cleanup_old_checkpoints
    fi
    
    # Always exit successfully to not interrupt workflow
    exit 0
}

# Run main function
main