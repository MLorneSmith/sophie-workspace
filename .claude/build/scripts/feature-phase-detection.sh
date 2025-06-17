#!/bin/bash
# Feature Phase Detection Utility
# Detects current AAFD workflow phase for a given issue or feature

# GitHub Project Configuration
GITHUB_OWNER="MLorneSmith"
PROJECT_NUMBER="1"
PROJECT_ID="PVT_kwHOAT_OfM4A7J1O"

# Field IDs from GitHub Projects
AAFD_STAGE_FIELD_ID="PVTSSF_lAHOAT_OfM4A7J1OzgviZKE"
FEATURE_TYPE_FIELD_ID="PVTSSF_lAHOAT_OfM4A7J1OzgviV-8"
PRIORITY_FIELD_ID="PVTSSF_lAHOAT_OfM4A7J1OzgviWDw"

# AAFD Stage Option IDs
IDEA_OPTION_ID="403bcee9"
PRD_OPTION_ID="3233f088"
CHUNKS_OPTION_ID="26aea163"
STORIES_OPTION_ID="8a2d592f"
READY_OPTION_ID="b295c8f5"
BLOCKED_OPTION_ID="0e32d2ac"

# Feature Type Option IDs
EPIC_OPTION_ID="fe557cfb"
STORY_OPTION_ID="1f948c43"

detect_phase() {
    local input="$1"
    
    # Check if input is a number (GitHub issue ID)
    if [[ "$input" =~ ^[0-9]+$ ]]; then
        local issue_id="$input"
        
        # Verify issue exists
        if ! gh issue view "$issue_id" >/dev/null 2>&1; then
            echo "ERROR: Issue #$issue_id not found"
            return 1
        fi
        
        # Get AAFD Stage from GitHub Projects
        local aafd_stage
        aafd_stage=$(gh project item-list "$PROJECT_NUMBER" --owner "$GITHUB_OWNER" --format json | \
            jq -r ".items[] | select(.content.number == $issue_id) | .aafdStage // \"Unknown\"")
        
        if [[ "$aafd_stage" == "Unknown" || "$aafd_stage" == "null" ]]; then
            echo "INFO: Issue #$issue_id not in GitHub Projects or AAFD Stage not set"
            echo "PHASE: idea"
            echo "ISSUE_ID: $issue_id"
            echo "NEW_FEATURE: false"
            return 0
        fi
        
        # Map AAFD Stage to phase
        local phase
        case "$aafd_stage" in
            "Idea")
                phase="epic-creation"
                ;;
            "PRD")
                phase="technical-chunking"
                ;;
            "Chunks")
                phase="story-creation"
                ;;
            "Stories")
                phase="sprint-planning"
                ;;
            "Ready")
                phase="implementation"
                ;;
            "Blocked")
                phase="unblock-resolution"
                ;;
            *)
                phase="epic-creation"
                ;;
        esac
        
        echo "PHASE: $phase"
        echo "AAFD_STAGE: $aafd_stage"
        echo "ISSUE_ID: $issue_id"
        echo "NEW_FEATURE: false"
        
    else
        # New feature
        local feature_name="$input"
        echo "PHASE: epic-creation"
        echo "AAFD_STAGE: Idea"
        echo "FEATURE_NAME: $feature_name"
        echo "NEW_FEATURE: true"
    fi
}

get_issue_details() {
    local issue_id="$1"
    gh issue view "$issue_id" --json title,labels,body,state
}

get_project_item_id() {
    local issue_id="$1"
    gh project item-list "$PROJECT_NUMBER" --owner "$GITHUB_OWNER" --format json | \
        jq -r ".items[] | select(.content.number == $issue_id) | .id"
}

add_issue_to_project() {
    local issue_id="$1"
    
    # Add to project
    gh project item-add "$PROJECT_NUMBER" --owner "$GITHUB_OWNER" \
        --url "https://github.com/$GITHUB_OWNER/2025slideheroes/issues/$issue_id"
    
    echo "Added issue #$issue_id to GitHub Projects"
}

set_aafd_stage() {
    local issue_id="$1"
    local stage="$2"
    
    local item_id
    item_id=$(get_project_item_id "$issue_id")
    
    if [[ -z "$item_id" || "$item_id" == "null" ]]; then
        echo "ERROR: Issue #$issue_id not found in GitHub Projects"
        return 1
    fi
    
    local option_id
    case "$stage" in
        "Idea")
            option_id="$IDEA_OPTION_ID"
            ;;
        "PRD")
            option_id="$PRD_OPTION_ID"
            ;;
        "Chunks")
            option_id="$CHUNKS_OPTION_ID"
            ;;
        "Stories")
            option_id="$STORIES_OPTION_ID"
            ;;
        "Ready")
            option_id="$READY_OPTION_ID"
            ;;
        "Blocked")
            option_id="$BLOCKED_OPTION_ID"
            ;;
        *)
            echo "ERROR: Unknown AAFD stage: $stage"
            return 1
            ;;
    esac
    
    gh project item-edit --id "$item_id" --project-id "$PROJECT_ID" \
        --field-id "$AAFD_STAGE_FIELD_ID" --single-select-option-id "$option_id"
    
    echo "Set AAFD Stage to '$stage' for issue #$issue_id"
}

set_feature_type() {
    local issue_id="$1"
    local type="$2"
    
    local item_id
    item_id=$(get_project_item_id "$issue_id")
    
    if [[ -z "$item_id" || "$item_id" == "null" ]]; then
        echo "ERROR: Issue #$issue_id not found in GitHub Projects"
        return 1
    fi
    
    local option_id
    case "$type" in
        "Epic")
            option_id="$EPIC_OPTION_ID"
            ;;
        "Story")
            option_id="$STORY_OPTION_ID"
            ;;
        *)
            echo "ERROR: Unknown feature type: $type"
            return 1
            ;;
    esac
    
    gh project item-edit --id "$item_id" --project-id "$PROJECT_ID" \
        --field-id "$FEATURE_TYPE_FIELD_ID" --single-select-option-id "$option_id"
    
    echo "Set Feature Type to '$type' for issue #$issue_id"
}

# Main execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [[ $# -eq 0 ]]; then
        echo "Usage: $0 <issue-id|feature-name>"
        echo "Examples:"
        echo "  $0 37                    # Detect phase for issue #37"
        echo "  $0 \"AI Slide Suggestions\" # New feature"
        exit 1
    fi
    
    detect_phase "$1"
fi