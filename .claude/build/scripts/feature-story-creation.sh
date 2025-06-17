#!/bin/bash
# Feature Story Creation Utility
# Creates user stories from chunks and sets up context files

source "$(dirname "$0")/feature-phase-detection.sh"

create_stories_for_chunk() {
    local chunk_id="$1"
    local stories_per_chunk="${2:-2}"
    
    echo "📝 Creating stories for Chunk #$chunk_id"
    
    # Get chunk details
    local chunk_data
    chunk_data=$(gh issue view "$chunk_id" --json title,body,labels)
    local chunk_title
    chunk_title=$(echo "$chunk_data" | jq -r .title | sed 's/\[CHUNK\] //')
    
    # Extract epic ID from labels
    local epic_id
    epic_id=$(echo "$chunk_data" | jq -r '.labels[] | select(.name | startswith("epic:")) | .name' | cut -d: -f2)
    
    if [[ -z "$epic_id" ]]; then
        echo "ERROR: Could not determine Epic ID for chunk #$chunk_id"
        return 1
    fi
    
    echo "Chunk: $chunk_title"
    echo "Parent Epic: #$epic_id"
    
    # Create stories
    local story_ids=()
    for ((i=1; i<=stories_per_chunk; i++)); do
        echo "Creating story $i/$stories_per_chunk for chunk #$chunk_id..."
        
        local story_id
        story_id=$(gh issue create \
            --title "[STORY] $chunk_title - User Story $i" \
            --body "User story $i for Chunk #$chunk_id

**Parent Chunk**: #$chunk_id
**Parent Epic**: #$epic_id

**As a** [user type]
**I want** [functionality]
**So that** [benefit/value]

## Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

## Technical Tasks
- [ ] [Technical task 1]
- [ ] [Technical task 2]

## Definition of Done
- [ ] Code implemented and tested
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Code reviewed and merged
- [ ] Documentation updated

## Story Points
To be estimated during sprint planning

## Notes
Additional implementation notes and considerations will be added during development." \
            --label "story,aafd-v2,epic:$epic_id,chunk:$chunk_id" \
            --json number \
            --jq .number)
        
        if [[ -n "$story_id" ]]; then
            story_ids+=("$story_id")
            echo "✅ Created Story #$story_id"
            
            # Add to project
            add_issue_to_project "$story_id"
            set_feature_type "$story_id" "Story"
            
            # Create context directory and files
            setup_story_context "$story_id" "$epic_id"
        else
            echo "❌ Failed to create story $i for chunk #$chunk_id"
        fi
    done
    
    echo "STORY_IDS: ${story_ids[*]}"
    return 0
}

setup_story_context() {
    local story_id="$1"
    local epic_id="$2"
    
    echo "🏗️  Setting up context for Story #$story_id"
    
    # Create context directory
    local context_dir=".claude/build/contexts/stories/story-$story_id"
    mkdir -p "$context_dir"
    
    # Get story and epic details
    local story_data
    story_data=$(gh issue view "$story_id" --json title,body)
    local story_title
    story_title=$(echo "$story_data" | jq -r .title)
    
    local epic_data
    epic_data=$(gh issue view "$epic_id" --json title,body)
    local epic_title
    epic_title=$(echo "$epic_data" | jq -r .title)
    
    # Create context.md
    cat > "$context_dir/context.md" << EOF
# Story Context: $story_title

**Story ID**: #$story_id
**Epic**: #$epic_id - $epic_title
**Created**: $(date -Iseconds)
**Status**: Ready for Implementation

## Story Overview

$story_title

## Epic Context

This story is part of the larger epic: $epic_title

## Key Files to Review

- apps/web/ (main application)
- packages/ (shared packages)
- CLAUDE.md (project guidelines)

## Similar Patterns

Look for similar implementations in:
- Existing components in apps/web/app/
- Similar features in the codebase
- Test patterns in *.test.ts files

## Implementation Approach

1. **Analysis Phase**
   - Review acceptance criteria
   - Identify affected files
   - Understand existing patterns

2. **Implementation Phase**
   - Follow project code standards
   - Implement with TypeScript/React
   - Add proper error handling

3. **Testing Phase**
   - Write unit tests
   - Test integration points
   - Verify acceptance criteria

## Session Loading

When starting implementation:
1. Load this context file
2. Load technical notes
3. Load CLAUDE.md
4. Load appropriate role template
EOF

    # Create technical-notes.md
    cat > "$context_dir/technical-notes.md" << EOF
# Technical Notes: Story #$story_id

## Architecture Decisions

*Document architectural decisions made during implementation*

## Code Patterns Used

*Document specific patterns, libraries, or approaches used*

## API Changes

*Document any API changes or new endpoints created*

## Database Changes

*Document any database schema changes or migrations*

## Dependencies Added

*Document any new dependencies added to package.json*

## Performance Considerations

*Document performance implications and optimizations*

## Security Considerations

*Document security implications and measures taken*

## Testing Strategy

*Document testing approach and key test cases*

## Edge Cases Handled

*Document edge cases discovered and how they were handled*

## Future Improvements

*Document potential improvements or refactoring opportunities*
EOF

    # Create progress.md
    cat > "$context_dir/progress.md" << EOF
# Progress Tracking: Story #$story_id

**Last Updated**: $(date -Iseconds)
**Current Status**: Not Started

## Implementation Progress

### Analysis Phase
- [ ] Review story requirements
- [ ] Identify affected files
- [ ] Research existing patterns
- [ ] Plan implementation approach

### Implementation Phase
- [ ] Set up basic structure
- [ ] Implement core functionality
- [ ] Add error handling
- [ ] Implement UI components (if applicable)

### Testing Phase
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Manual testing
- [ ] Verify acceptance criteria

### Review Phase
- [ ] Code review
- [ ] Documentation review
- [ ] Final testing
- [ ] Merge to main

## Session Notes

### Session 1 - $(date -Iseconds)
*Notes from this session will be added here*

## Blockers

*Document any blockers encountered and their resolution*

## Decisions Made

*Document key decisions made during implementation*

## Time Tracking

- Analysis: 
- Implementation: 
- Testing: 
- Review: 
- Total: 

## Files Modified

*List files modified during implementation*

EOF

    echo "✅ Context setup complete: $context_dir"
}

create_all_stories() {
    local epic_id="$1"
    local stories_per_chunk="${2:-2}"
    
    echo "📚 Creating stories for all chunks in Epic #$epic_id"
    
    # Get all chunks for the epic
    local chunks
    chunks=($(gh issue list --label "epic:$epic_id" --label "chunk" --json number --jq '.[].number'))
    
    if [[ ${#chunks[@]} -eq 0 ]]; then
        echo "ERROR: No chunks found for Epic #$epic_id"
        echo "Run feature chunking first: .claude/build/scripts/feature-chunking.sh $epic_id"
        return 1
    fi
    
    echo "Found ${#chunks[@]} chunks: ${chunks[*]}"
    
    # Create stories for each chunk
    local all_stories=()
    for chunk_id in "${chunks[@]}"; do
        echo ""
        create_stories_for_chunk "$chunk_id" "$stories_per_chunk"
        # Collect story IDs (would need to parse output in real implementation)
    done
    
    # Update Epic stage to Stories
    set_aafd_stage "$epic_id" "Stories"
    
    echo ""
    echo "✅ Story creation complete for Epic #$epic_id"
    
    # Show next steps
    echo ""
    echo "Next steps:"
    echo "1. Review and refine story details in GitHub issues"
    echo "2. Estimate story points during sprint planning"
    echo "3. Run sprint planning: /build-feature $epic_id"
}

list_epic_stories() {
    local epic_id="$1"
    
    echo "📋 Stories for Epic #$epic_id"
    echo ""
    
    gh issue list --label "epic:$epic_id" --label "story" --json number,title,state,labels \
        --jq '.[] | "\(.number): \(.title) (\(.state))"'
}

# Main execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [[ $# -eq 0 ]]; then
        echo "Usage: $0 <epic-id> [stories-per-chunk] [--chunk chunk-id]"
        echo "Examples:"
        echo "  $0 21                    # Create stories for all chunks in Epic #21"
        echo "  $0 21 3                  # Create 3 stories per chunk"
        echo "  $0 21 --chunk 25         # Create stories only for Chunk #25"
        echo "  $0 21 --list             # List existing stories"
        exit 1
    fi
    
    local epic_id="$1"
    local action_or_count="$2"
    local chunk_id="$3"
    
    if [[ "$action_or_count" == "--list" ]]; then
        list_epic_stories "$epic_id"
    elif [[ "$action_or_count" == "--chunk" && -n "$chunk_id" ]]; then
        create_stories_for_chunk "$chunk_id"
    else
        local stories_per_chunk="${action_or_count:-2}"
        create_all_stories "$epic_id" "$stories_per_chunk"
    fi
fi