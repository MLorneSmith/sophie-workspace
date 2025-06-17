# Build Feature Command v2.0 (AAFD Methodology)

Usage: `/build-feature [epic-id|feature-name]`

This command orchestrates the complete AAFD v2.0 feature development workflow, from Epic creation through implementation, using our structured methodology and GitHub Projects integration.

## EXECUTABLE IMPLEMENTATION

This command uses utility functions located in `.claude/build/scripts/` for modular, reusable workflow automation.

### STEP 1: Phase Detection & Routing

```bash
# Use phase detection utility
source .claude/build/scripts/feature-phase-detection.sh
PHASE_INFO=$(detect_phase "$1")

# Parse phase information
PHASE=$(echo "$PHASE_INFO" | grep "PHASE:" | cut -d' ' -f2)
AAFD_STAGE=$(echo "$PHASE_INFO" | grep "AAFD_STAGE:" | cut -d' ' -f2)
ISSUE_ID=$(echo "$PHASE_INFO" | grep "ISSUE_ID:" | cut -d' ' -f2)
FEATURE_NAME=$(echo "$PHASE_INFO" | grep "FEATURE_NAME:" | cut -d' ' -f2-)
NEW_FEATURE=$(echo "$PHASE_INFO" | grep "NEW_FEATURE:" | cut -d' ' -f2)

echo "🔍 Detected Phase: $PHASE"
echo "📊 AAFD Stage: $AAFD_STAGE"

# Route to appropriate phase handler
case "$PHASE" in
  "epic-creation")
    echo "🚀 Phase: Epic Creation & PRD Generation"
    ;;
  "technical-chunking")
    echo "🔧 Phase: Technical Chunking"
    ;;
  "story-creation")
    echo "📝 Phase: Story Creation"
    ;;
  "sprint-planning")
    echo "📋 Phase: Sprint Planning"
    ;;
  "implementation")
    echo "💻 Phase: Implementation"
    ;;
  "unblock-resolution")
    echo "🚫 Phase: Unblock Resolution"
    ;;
esac
```

### STEP 2: Phase Execution Using Utility Functions

**Phase 1: Epic Creation & PRD**

```bash
if [[ "$PHASE" == "epic-creation" && "$NEW_FEATURE" == "true" ]]; then
  echo "📋 Creating Epic and PRD for: $FEATURE_NAME"

  # Use epic creation utility
  .claude/build/scripts/feature-epic-creation.sh "$FEATURE_NAME"

  echo ""
  echo "Next Steps:"
  echo "1. Review and refine the generated PRD"
  echo "2. Continue with: /build-feature [epic-id]"
fi
```

**Phase 2: Technical Chunking**

```bash
if [[ "$PHASE" == "technical-chunking" ]]; then
  echo "🔧 Technical Chunking for Epic #$ISSUE_ID"

  # Use chunking utility
  .claude/build/scripts/feature-chunking.sh "$ISSUE_ID"

  echo ""
  echo "Next Steps:"
  echo "1. Review and refine chunk descriptions"
  echo "2. Continue with: /build-feature $ISSUE_ID"
fi
```

**Phase 3: Story Creation**

```bash
if [[ "$PHASE" == "story-creation" ]]; then
  echo "📝 Story Creation for Epic #$ISSUE_ID"

  # Use story creation utility
  .claude/build/scripts/feature-story-creation.sh "$ISSUE_ID"

  echo ""
  echo "Next Steps:"
  echo "1. Review and refine story details"
  echo "2. Add acceptance criteria and technical tasks"
  echo "3. Continue with: /build-feature $ISSUE_ID"
fi
```

**Phase 4: Sprint Planning**

```bash
if [[ "$PHASE" == "sprint-planning" ]]; then
  echo "📋 Sprint Planning for Epic #$ISSUE_ID"

  # List all stories for review
  echo "📊 Available Stories:"
  .claude/build/scripts/feature-story-creation.sh "$ISSUE_ID" --list

  echo ""
  echo "Sprint Planning Steps:"
  echo "1. Review story estimates and priorities"
  echo "2. Select stories for current sprint"
  echo "3. Mark Epic as Ready for implementation"

  # Use phase detection utility to update stage
  source .claude/build/scripts/feature-phase-detection.sh
  set_aafd_stage "$ISSUE_ID" "Ready"

  echo "✅ Epic #$ISSUE_ID marked as Ready for implementation"
  echo "Next: /build-feature $ISSUE_ID"
fi
```

**Phase 5: Implementation**

```bash
if [[ "$PHASE" == "implementation" ]]; then
  echo "💻 Implementation Phase for Epic #$ISSUE_ID"

  # Find next story to implement
  NEXT_STORY=$(gh issue list --label "epic:$ISSUE_ID" --label "story" --state open --json number --jq '.[0].number')

  if [[ -n "$NEXT_STORY" ]]; then
    echo "🎯 Next Story: #$NEXT_STORY"

    # Check if context exists
    CONTEXT_DIR=".claude/build/contexts/stories/story-$NEXT_STORY"
    if [[ -d "$CONTEXT_DIR" ]]; then
      echo "📚 Loading story context..."
      /read "$CONTEXT_DIR/context.md"
      /read "$CONTEXT_DIR/technical-notes.md"
      /read "CLAUDE.md"

      # Load appropriate role based on story domain
      echo "🎭 Loading implementation role..."
      /read ".claude/build/contexts/session-templates/ai-engineer.md"

      echo ""
      echo "📋 Story #$NEXT_STORY Ready for Implementation"
      echo "✅ Context loaded"
      echo "✅ Role configured"
      echo "✅ Project standards loaded"
      echo ""
      echo "🚀 Begin implementation session!"

    else
      echo "⚠️  Context missing for Story #$NEXT_STORY"
      echo "Creating context files..."
      .claude/build/scripts/feature-story-creation.sh "$ISSUE_ID" --setup-context "$NEXT_STORY"
    fi

  else
    echo "✅ All stories completed for Epic #$ISSUE_ID!"
    echo "🎉 Feature implementation complete!"
  fi
fi
```

```

## Workflow Phases

### Phase 1: Epic Creation & PRD

**What happens:**

1. Load Feature Planning prompt
2. Create structured PRD from feature idea
3. Create GitHub Epic issue
4. Set up GitHub Projects tracking

**Actions:**

```

1. Load prompt: /read .claude/build/prompt-library/feature-planning.xml
2. Apply prompt with feature description
3. Create Epic issue with generated PRD
4. Add to GitHub Projects board
5. Set AAFD Stage = "PRD"

```

**Outputs:**

- GitHub Epic issue with complete PRD
- Technical requirements documented
- Cross-cutting concerns identified
- Success metrics defined

### Phase 2: Technical Chunking

**What happens:**

1. Analyze PRD structure
2. Identify logical implementation chunks
3. Create chunk issues linked to Epic
4. Document dependencies

**Actions:**

```

1. Load prompt: /read .claude/build/prompt-library/implementation-planning.xml
2. Apply prompt to PRD content
3. Create 2-4 chunk issues
4. Link chunks to parent Epic
5. Set AAFD Stage = "Chunks"

```

**Outputs:**

- 2-4 implementation chunks
- Dependency documentation
- Parallel work streams identified
- Risk assessment per chunk

### Phase 3: Story Creation & Estimation

**What happens:**

1. Break chunks into user stories
2. Create detailed technical tasks
3. Estimate story points
4. Set up context files

**Actions:**

```

1. For each chunk, create 2-5 user stories
2. Use GitHub Story template for each
3. Estimate using Fibonacci sequence
4. Create context directories:
   - .claude/build/contexts/stories/story-{id}/
   - Add context.md, technical-notes.md, progress.md
5. Set AAFD Stage = "Stories"

```

**Outputs:**

- Implementable user stories
- Story point estimates
- Context files prepared
- Technical tasks defined

### Phase 4: Sprint Planning

**What happens:**

1. Review capacity and velocity
2. Select stories for sprint
3. Order by dependencies
4. Prepare implementation contexts

**Actions:**

```

1. Calculate available capacity
2. Select stories within capacity
3. Create sprint milestone
4. Move stories to "Ready"
5. Set AAFD Stage = "Ready"

```

**Outputs:**

- Sprint backlog defined
- Implementation order set
- Context loading prepared
- Session schedule planned

### Phase 5: Implementation Execution

**What happens:**

1. Load story context
2. Implement with Claude Code
3. Track progress in real-time
4. Update GitHub Projects

**For each story:**

```

1. Load context:

   - /read .claude/build/contexts/session-templates/{role}.md
   - /read .claude/build/contexts/stories/story-{id}/context.md
   - /read CLAUDE.md

2. Implement story:

   - Follow acceptance criteria
   - Use project patterns
   - Write tests
   - Update documentation

3. Track progress:

   - Update progress.md
   - Move through project board
   - Document decisions

4. Complete story:
   - Run quality checks
   - Create PR
   - Update tracking

```

### Phase 6: Review & Verification

**What happens:**

1. Validate implementation
2. Run quality checks
3. Update documentation
4. Complete retrospective

**Actions:**

```

1. Verify all acceptance criteria
2. Run test suite
3. Check code quality
4. Update documentation
5. Complete feature retrospective
6. Close Epic and related issues

````

## Command Implementation

### Start New Feature

```typescript
async function startNewFeature(featureName: string) {
  console.log(`🚀 Starting new feature: ${featureName}`);

  // Step 1: Create Epic with PRD
  console.log('\n📋 Phase 1: Creating Epic and PRD...');
  const prd = await createPRD(featureName);
  const epic = await createGitHubEpic(prd);

  // Step 2: Guide through workflow
  console.log(`
✅ Epic created: #${epic.number}

Next steps:
1. Review the PRD in the issue description
2. Run: /build-feature ${epic.number} --continue

This will guide you through:
- Technical chunking
- Story creation
- Sprint planning
- Implementation
`);
}
````

### Continue Existing Feature

```typescript
async function continueFromPhase(phase: string, issue: Issue) {
  switch (phase) {
    case 'prd-refinement':
      console.log('📋 Continuing: PRD Refinement...');
      await guidePRDRefinement(issue);
      break;

    case 'technical-chunking':
      console.log('🔧 Continuing: Technical Chunking...');
      await guideTechnicalChunking(issue);
      break;

    case 'story-creation':
      console.log('📝 Continuing: Story Creation...');
      await guideStoryCreation(issue);
      break;

    case 'implementation':
      console.log('💻 Continuing: Implementation...');
      await guideImplementation(issue);
      break;
  }
}
```

## Interactive Guidance

### PRD Creation Example

```
🚀 Creating PRD for: AI Slide Title Suggestions

I'll help you create a comprehensive PRD. Please provide:

1. **Problem Statement**: What problem does this solve?
   > Users spend too much time thinking of slide titles

2. **Target Users**: Who will use this feature?
   > SlideHeroes users creating presentations

3. **Key Functionality**: Core features needed?
   > Generate 3-5 title suggestions based on slide content
   > Allow customization of suggestions
   > Track AI usage for billing

[Generating PRD...]

✅ PRD Created! Review at: https://github.com/MLorneSmith/2025slideheroes/issues/21

Next: Run `/build-feature-v2 21 --continue` to proceed with technical chunking
```

### Story Implementation Example

```
💻 Implementing Story: Generate AI Slide Title Suggestions

Loading context...
✅ AI Engineer role loaded
✅ Story context loaded
✅ Project standards loaded

Current Task: Create OutlineGeneratorDialog component

Files to modify:
- apps/web/app/home/(user)/editor/_components/SlideSuggestionsDialog.tsx
- apps/web/app/home/(user)/editor/_actions/slide-suggestions.action.ts

Would you like me to:
1. Show the implementation plan
2. Start implementing the component
3. Review similar patterns first

Choice: _
```

## Progress Tracking

The command maintains progress through:

1. **GitHub Projects Board**

   - Visual progress tracking
   - Automated status updates
   - Dependency visualization

2. **Context Files**

   - Story progress in `.claude/build/contexts/stories/`
   - Decision documentation
   - Session continuity

3. **Todo List**
   - Real-time task tracking
   - Progress indicators
   - Next action guidance

## Error Handling

### Missing Prerequisites

```
❌ GitHub Projects not configured!

Please set up GitHub Projects first:
1. Go to: https://github.com/MLorneSmith/2025slideheroes/projects
2. Create project "SlideHeroes AAFD v2.0"
3. Configure custom fields as documented
4. Run command again

Need help? See: .claude/build/docs/methodology/getting-started.md
```

### Incomplete Context

```
⚠️ Story context incomplete!

Missing required context files:
- [ ] .claude/build/contexts/stories/story-123/context.md
- [x] .claude/build/contexts/stories/story-123/progress.md
- [ ] .claude/build/contexts/stories/story-123/technical-notes.md

Would you like me to:
1. Create missing files from issue data
2. Guide you through context creation
3. Skip and continue anyway

Choice: _
```

### Implementation Blocked

```
🚫 Implementation blocked!

Blocker: Missing API endpoint specification
Story: #125 - AI Title Generation

Options:
1. Document blocker and switch stories
2. Research and resolve blocker
3. Create spike story for investigation

Choice: _
```

## Advanced Features

### Batch Story Implementation

```
/build-feature-v2 --batch-implement 21
```

Implements multiple stories from Epic #21 in sequence.

### Context Refresh

```
/build-feature-v2 --refresh-context 125
```

Refreshes stale context for story #125.

### Phase Jump

```
/build-feature-v2 21 --jump-to implementation
```

Skips to specific phase (use with caution).

### Dry Run

```
/build-feature-v2 "New Feature" --dry-run
```

Shows what would happen without creating issues.

## Integration with Other Commands

- **`/write-unit-tests`** - Automatically triggered for test implementation
- **`/deep-debug`** - Used when implementation issues arise
- **`/log-issue`** - For bugs discovered during implementation

## Best Practices

1. **Always start with Epic creation** - Don't skip the PRD phase
2. **Keep chunks small** - 2-4 chunks maximum per Epic
3. **Maintain context** - Update progress files after each session
4. **Follow the workflow** - The methodology is designed for success
5. **Document decisions** - Use technical-notes.md for important choices

## Quick Reference

```bash
# Start new feature
/build-feature-v2 "AI Slide Suggestions"

# Continue existing feature
/build-feature-v2 21

# Continue with specific phase
/build-feature-v2 21 --continue

# Refresh stale context
/build-feature-v2 --refresh-context 125

# Batch implement stories
/build-feature-v2 --batch-implement 21
```

## Methodology Benefits

Using this command ensures:

- ✅ Structured planning before implementation
- ✅ Context preserved across sessions
- ✅ GitHub Projects integration
- ✅ Quality standards enforcement
- ✅ Systematic progress tracking
- ✅ AI-optimized development flow

The AAFD v2.0 methodology transforms feature development from ad-hoc coding to systematic, high-quality delivery!
