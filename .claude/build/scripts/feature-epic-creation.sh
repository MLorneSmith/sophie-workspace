#!/bin/bash
# Feature Epic Creation Utility
# Creates GitHub Epic with PRD and sets up project tracking

source "$(dirname "$0")/feature-phase-detection.sh"

create_epic() {
    local feature_name="$1"
    local prd_content="$2"
    
    echo "📋 Creating Epic: $feature_name"
    
    # Create Epic issue
    local epic_id
    epic_id=$(gh issue create \
        --title "[EPIC] $feature_name" \
        --body "$prd_content" \
        --label "epic,aafd-v2" \
        --json number \
        --jq .number)
    
    if [[ -z "$epic_id" ]]; then
        echo "ERROR: Failed to create Epic issue"
        return 1
    fi
    
    echo "✅ Created Epic #$epic_id"
    
    # Add to GitHub Projects
    add_issue_to_project "$epic_id"
    
    # Set project fields
    set_feature_type "$epic_id" "Epic"
    set_aafd_stage "$epic_id" "PRD"
    
    echo "EPIC_ID: $epic_id"
    return 0
}

generate_prd_with_prompt() {
    local feature_name="$1"
    
    echo "🤖 Generating PRD using feature planning prompt..."
    
    # Load the feature planning prompt
    local prompt_file=".claude/build/prompt-library/feature-planning.xml"
    if [[ ! -f "$prompt_file" ]]; then
        echo "ERROR: Feature planning prompt not found at $prompt_file"
        return 1
    fi
    
    echo "Loading feature planning prompt from: $prompt_file"
    echo "Please apply this prompt with the feature name: $feature_name"
    echo ""
    echo "Required information to gather:"
    echo "1. Problem Statement: What problem does this solve?"
    echo "2. Target Users: Who will use this feature?"
    echo "3. Key Functionality: What are the core capabilities?"
    echo "4. Success Metrics: How will we measure success?"
    echo "5. Technical Domains: Frontend, Backend, Database, AI, etc."
    echo ""
    echo "After gathering this information, the PRD will be generated."
    
    # Return path where PRD should be saved
    echo "PRD_PATH: /tmp/generated_prd_$$.md"
}

interactive_prd_creation() {
    local feature_name="$1"
    
    echo "🚀 Creating PRD for: $feature_name"
    echo ""
    
    # Generate PRD using prompt
    generate_prd_with_prompt "$feature_name"
    
    echo ""
    echo "Next steps:"
    echo "1. Use the feature planning prompt to generate a comprehensive PRD"
    echo "2. Save the generated PRD to a file"
    echo "3. Call create_epic with the feature name and PRD content"
    echo ""
    echo "Example:"
    echo "  create_epic \"$feature_name\" \"\$(cat generated_prd.md)\""
}

# Main execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [[ $# -eq 0 ]]; then
        echo "Usage: $0 <feature-name> [prd-file]"
        echo "Examples:"
        echo "  $0 \"AI Slide Suggestions\"           # Interactive PRD creation"
        echo "  $0 \"AI Slide Suggestions\" prd.md   # Create epic with existing PRD"
        exit 1
    fi
    
    local feature_name="$1"
    local prd_file="$2"
    
    if [[ -n "$prd_file" && -f "$prd_file" ]]; then
        # Create epic with existing PRD
        local prd_content
        prd_content=$(cat "$prd_file")
        create_epic "$feature_name" "$prd_content"
    else
        # Interactive PRD creation
        interactive_prd_creation "$feature_name"
    fi
fi