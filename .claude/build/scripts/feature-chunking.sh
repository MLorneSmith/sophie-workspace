#!/bin/bash
# Feature Technical Chunking Utility
# Breaks PRD into implementation chunks

source "$(dirname "$0")/feature-phase-detection.sh"

create_chunks() {
    local epic_id="$1"
    local num_chunks="${2:-3}"
    
    echo "🔧 Creating chunks for Epic #$epic_id"
    
    # Get Epic details
    local epic_data
    epic_data=$(gh issue view "$epic_id" --json title,body)
    local epic_title
    epic_title=$(echo "$epic_data" | jq -r .title | sed 's/\[EPIC\] //')
    local epic_body
    epic_body=$(echo "$epic_data" | jq -r .body)
    
    echo "Epic: $epic_title"
    
    # Save PRD for analysis
    echo "$epic_body" > "/tmp/epic_${epic_id}_prd.md"
    
    echo "📊 Analyzing PRD for chunking opportunities..."
    echo "PRD saved to: /tmp/epic_${epic_id}_prd.md"
    echo ""
    echo "Use the implementation planning prompt to break this into $num_chunks chunks:"
    echo "/read .claude/build/prompt-library/implementation-planning.xml"
    echo ""
    
    # Create chunk issues
    local chunk_ids=()
    for ((i=1; i<=num_chunks; i++)); do
        echo "Creating chunk $i/$num_chunks..."
        
        local chunk_id
        chunk_id=$(gh issue create \
            --title "[CHUNK] $epic_title - Implementation Chunk $i" \
            --body "Implementation chunk $i for Epic #$epic_id

**Parent Epic**: #$epic_id

**Chunk Scope**: To be defined during technical analysis

**Dependencies**: To be identified

**Estimated Effort**: To be estimated

This chunk will be broken down into user stories during the story creation phase." \
            --label "chunk,aafd-v2,epic:$epic_id" \
            --json number \
            --jq .number)
        
        if [[ -n "$chunk_id" ]]; then
            chunk_ids+=("$chunk_id")
            echo "✅ Created Chunk #$chunk_id"
            
            # Add to project
            add_issue_to_project "$chunk_id"
            set_feature_type "$chunk_id" "Story"
        else
            echo "❌ Failed to create chunk $i"
        fi
    done
    
    # Update Epic stage
    set_aafd_stage "$epic_id" "Chunks"
    
    echo ""
    echo "✅ Created ${#chunk_ids[@]} chunks: ${chunk_ids[*]}"
    echo "CHUNK_IDS: ${chunk_ids[*]}"
    
    return 0
}

analyze_prd_for_chunks() {
    local epic_id="$1"
    
    echo "📋 PRD Analysis for Epic #$epic_id"
    echo ""
    echo "Steps to perform:"
    echo "1. Load implementation planning prompt:"
    echo "   /read .claude/build/prompt-library/implementation-planning.xml"
    echo ""
    echo "2. Analyze the PRD to identify logical implementation chunks:"
    echo "   /read /tmp/epic_${epic_id}_prd.md"
    echo ""
    echo "3. Consider these chunking strategies:"
    echo "   - By user journey (e.g., onboarding, core workflow, admin)"
    echo "   - By technical layer (e.g., backend API, frontend UI, database)"
    echo "   - By feature complexity (e.g., MVP features, advanced features)"
    echo "   - By dependencies (e.g., foundational components first)"
    echo ""
    echo "4. Recommended chunk count: 2-4 chunks"
    echo "5. Each chunk should be independently testable"
}

get_epic_chunks() {
    local epic_id="$1"
    
    gh issue list --label "epic:$epic_id" --label "chunk" --json number,title,state --jq '.[] | "\(.number): \(.title) (\(.state))"'
}

# Main execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [[ $# -eq 0 ]]; then
        echo "Usage: $0 <epic-id> [num-chunks]"
        echo "Examples:"
        echo "  $0 21                # Create 3 chunks for Epic #21"
        echo "  $0 21 4              # Create 4 chunks for Epic #21"
        echo "  $0 21 --analyze      # Show chunking analysis"
        exit 1
    fi
    
    local epic_id="$1"
    local action_or_count="$2"
    
    if [[ "$action_or_count" == "--analyze" ]]; then
        analyze_prd_for_chunks "$epic_id"
    else
        local num_chunks="${action_or_count:-3}"
        create_chunks "$epic_id" "$num_chunks"
    fi
fi