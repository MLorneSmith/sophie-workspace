# Build Feature Command

Usage: `/build-feature [feature-reference]`

- `feature-reference`: Can be a feature name, epic ID, story ID, or chunk ID

This command orchestrates the complete AI-Assisted Feature Development workflow using our structured methodology and prompts.

## Overview

The build-feature command guides you through our 6-phase development process:

1. **Ideation & PRD Creation** - Transform ideas into structured requirements
2. **Technical Chunking** - Break down into implementable chunks
3. **Stakeholder Validation** - Ensure alignment with business goals
4. **User Story Creation** - Create clear, user-focused stories
5. **Sprint Planning** - Plan implementation with TDD approach
6. **Implementation & Review** - Execute and validate the work

## Phase Detection & Routing

The command automatically detects which phase you're in based on the reference provided:

```typescript
// Phase detection logic
function detectPhase(reference: string) {
  // Check if it's a new feature (text description)
  if (!reference.match(/^\d+$/) && !reference.match(/^#/)) {
    return { phase: 'ideation', isNew: true, featureName: reference };
  }

  // Check existing GitHub issues
  const issue = await getGitHubIssue(reference);
  if (!issue) return { phase: 'unknown', error: 'Issue not found' };

  // Determine phase based on issue labels and state
  if (issue.labels.includes('epic') && !issue.labels.includes('prd-complete')) {
    return { phase: 'ideation', epicId: issue.number };
  }
  if (issue.labels.includes('epic') && !issue.labels.includes('chunks-complete')) {
    return { phase: 'chunking', epicId: issue.number };
  }
  if (issue.labels.includes('chunk') && !issue.labels.includes('validated')) {
    return { phase: 'validation', chunkId: issue.number };
  }
  if (issue.labels.includes('chunk') && !issue.labels.includes('stories-complete')) {
    return { phase: 'story-creation', chunkId: issue.number };
  }
  if (issue.labels.includes('story') && !issue.labels.includes('sprint-planned')) {
    return { phase: 'sprint-planning', storyId: issue.number };
  }
  if (issue.labels.includes('story') && issue.labels.includes('ready')) {
    return { phase: 'implementation', storyId: issue.number };
  }

  return { phase: 'review', issueId: issue.number };
}
```

## Phase Implementations

### Phase 1: Ideation & PRD Creation

**What happens:**
Transform your feature idea into a comprehensive Product Requirements Document (PRD).

**Process:**

```typescript
async function executeIdeationPhase(featureName: string) {
  console.log(`📋 Starting PRD creation for: ${featureName}\n`);

  // Load context
  console.log('Loading context for PRD creation...');
  await loadFiles([
    '.claude/build/2-context/project-context.md',
    '.claude/build/2-context/technical-context.md',
    '.claude/build/2-context/business-context.md',
  ]);

  // Load and apply PRD prompt
  console.log('Applying PRD creation prompt...');
  const prdPrompt = await readFile(
    '.claude/build/1-process/1-idea-to-prd/idea-to-prd-prompt.xml',
  );

  // Guide through PRD creation
  console.log(`
I'll help you create a comprehensive PRD for "${featureName}".`);
  console.log('Please provide the following information:');
  console.log('1. Problem Statement - What problem does this solve?');
  console.log('2. Target Users - Who will use this feature?');
  console.log('3. Key Functionality - Core features needed?');
  console.log('4. Success Metrics - How will we measure success?');

  // Create GitHub Epic with PRD
  // Add to GitHub Projects
  // Set labels: ['epic', 'needs-prd']
}
```

**Output:**

- GitHub Epic issue with structured PRD
- Technical requirements documented
- Cross-cutting concerns identified
- Success metrics defined

### Phase 2: Technical Chunking & Analysis

**What happens:**
Break down the PRD into logical implementation chunks.

**Process:**

```typescript
async function executeTechnicalChunking(epicId: number) {
  console.log(`🔧 Starting Technical Chunking for Epic #${epicId}\n`);

  // Load Epic PRD
  const epic = await getGitHubIssue(epicId);
  console.log('Loading PRD content...');

  // Load chunking prompt
  const chunkingPrompt = await readFile(
    '.claude/build/1-process/2-prd-chunking/create-prd-chunks-prompt.xml',
  );

  // Apply chunking analysis
  console.log('Analyzing PRD structure for logical chunks...');
  console.log('Identifying cross-cutting concerns...');
  console.log('Creating dependency map...\n');

  // Create chunk issues
  // Link to parent Epic
  // Document dependencies
}
```

**Output:**

- 2-4 implementation chunks with clear boundaries
- Dependency documentation
- Risk assessment per chunk
- Parallel work streams identified

### Phase 3: Stakeholder Validation

**What happens:**
Validate technical chunks with stakeholders for alignment.

**Process:**

```typescript
async function executeStakeholderValidation(chunkIds: number[]) {
  console.log(`👥 Starting Stakeholder Validation\n`);

  // Load validation prompt
  const validationPrompt = await readFile(
    '.claude/build/1-process/3-stakeholder-validation/stakeholder-validation-prompt.xml',
  );

  // Prepare validation materials
  console.log('Preparing chunk overview for stakeholders...');
  console.log('Documenting technical approach...');
  console.log('Highlighting risks and dependencies...\n');

  // Guide through validation
  console.log('Validation checklist:');
  console.log('- [ ] Business value confirmed');
  console.log('- [ ] Technical approach approved');
  console.log('- [ ] Resources and timeline acceptable');
  console.log('- [ ] Risks understood and mitigated');

  // Update chunk issues with feedback
  // Adjust priorities if needed
}
```

**Output:**

- Validated and prioritized chunks
- Adjusted scope based on feedback
- Risk mitigation strategies
- Go/no-go decision for each chunk

### Phase 4: User Story Creation

**What happens:**
Create user-focused stories from technical chunks.

**Process:**

```typescript
async function executeStoryCreation(chunkId: number) {
  console.log(`📝 Creating User Stories for Chunk #${chunkId}\n`);

  // Load story creation prompt
  const storyPrompt = await readFile(
    '.claude/build/1-process/4-user-stories-creation/create-user-stories-prompt.xml',
  );

  // Guide story creation
  console.log(
    'Creating stories in format: As a [user], I want [goal], so that [benefit]',
  );
  console.log('Each story should be:');
  console.log('- User-focused (not technical)');
  console.log('- Independently valuable');
  console.log('- Testable\n');

  // Create story issues
  // Add acceptance criteria
  // Link to parent chunk
  // Create context files
}
```

**Output:**

- User stories with acceptance criteria
- Story context files created
- Technical tasks identified
- Dependencies documented

### Phase 5: Sprint Planning with TDD

**What happens:**
Plan implementation sprints using Test-Driven Development approach.

**Process:**

```typescript
async function executeSprintPlanning(storyIds: number[]) {
  console.log(`📅 Sprint Planning with TDD Approach\n`);

  // Load sprint planning prompt
  const sprintPrompt = await readFile(
    '.claude/build/1-process/5-sprint-planning/create-sprints-prompt.xml',
  );

  // Calculate capacity
  console.log('Sprint planning considerations:');
  console.log('- Available capacity: X story points');
  console.log('- Story priorities and dependencies');
  console.log('- Test-first implementation approach\n');

  // Plan test specifications
  console.log('TDD Planning for each story:');
  console.log('1. Write test specifications first');
  console.log('2. Define expected behaviors');
  console.log('3. Plan implementation to pass tests\n');

  // Create sprint milestone
  // Assign stories to sprint
  // Update story status to 'ready'
}
```

**Output:**

- Sprint backlog with selected stories
- Test specifications for each story
- Implementation sequence planned
- Context requirements documented

### Phase 6: Implementation & Review

**What happens:**
Execute the implementation with continuous tracking and review.

**Process:**

```typescript
async function executeImplementation(storyId: number) {
  console.log(`💻 Starting Implementation for Story #${storyId}\n`);

  // Load implementation prompt
  const implPrompt = await readFile(
    '.claude/build/1-process/6-sprint-execution/implementation-prompt.xml',
  );

  // Load story context
  console.log('Loading story context...');
  await loadFiles([
    `.claude/build/contexts/stories/story-${storyId}/context.md`,
    `.claude/build/contexts/stories/story-${storyId}/technical-notes.md`,
    'CLAUDE.md',
  ]);

  // Execute TDD cycle
  console.log('TDD Implementation Cycle:');
  console.log('1. RED - Write failing tests');
  console.log('2. GREEN - Implement to pass tests');
  console.log('3. REFACTOR - Improve code quality\n');

  // Track progress
  // Update GitHub issues
  // Document decisions
}
```

**Output:**

- Working, tested implementation
- Documentation updated
- PR created and reviewed
- Story marked as complete

## Command Entry Point

```typescript
async function buildFeature(reference: string) {
  console.log('🚀 Build Feature Command\n');

  // Detect current phase
  const phaseInfo = await detectPhase(reference);

  if (phaseInfo.error) {
    console.error(`❌ Error: ${phaseInfo.error}`);
    return;
  }

  console.log(`📊 Current Phase: ${phaseInfo.phase}`);
  console.log(`📍 Reference: ${reference}\n`);

  // Route to appropriate phase handler
  switch (phaseInfo.phase) {
    case 'ideation':
      await executeIdeationPhase(phaseInfo.featureName || reference);
      break;

    case 'chunking':
      await executeTechnicalChunking(phaseInfo.epicId);
      break;

    case 'validation':
      await executeStakeholderValidation([phaseInfo.chunkId]);
      break;

    case 'story-creation':
      await executeStoryCreation(phaseInfo.chunkId);
      break;

    case 'sprint-planning':
      await executeSprintPlanning([phaseInfo.storyId]);
      break;

    case 'implementation':
      await executeImplementation(phaseInfo.storyId);
      break;

    case 'review':
      await executeReview(phaseInfo.issueId);
      break;

    default:
      console.log('Unable to determine phase. Please check the issue status.');
  }
}

// Helper function to load multiple files
async function loadFiles(filePaths: string[]) {
  for (const path of filePaths) {
    console.log(`Loading: ${path}`);
    // In actual implementation, this would use /read command
  }
}
```

## Usage Examples

### Starting a New Feature

```bash
# Start with a feature idea
/build-feature "AI-powered slide title suggestions"

# Output:
🚀 Build Feature Command

📊 Current Phase: ideation
📍 Reference: AI-powered slide title suggestions

📋 Starting PRD creation for: AI-powered slide title suggestions

Loading context for PRD creation...
Loading: .claude/build/2-context/project-context.md
Loading: .claude/build/2-context/technical-context.md
Loading: .claude/build/2-context/business-context.md

Applying PRD creation prompt...

I'll help you create a comprehensive PRD for "AI-powered slide title suggestions".
Please provide the following information:
1. Problem Statement - What problem does this solve?
2. Target Users - Who will use this feature?
3. Key Functionality - Core features needed?
4. Success Metrics - How will we measure success?
```

### Continuing an Existing Feature

```bash
# Continue with an epic ID
/build-feature 123

# Output:
🚀 Build Feature Command

📊 Current Phase: chunking
📍 Reference: 123

🔧 Starting Technical Chunking for Epic #123

Loading PRD content...
Analyzing PRD structure for logical chunks...
Identifying cross-cutting concerns...
Creating dependency map...

Suggested chunks:
1. AI Service Integration - Backend setup with Portkey
2. Frontend Components - User interface for suggestions
3. Usage Tracking - Billing and analytics integration

Would you like to proceed with these chunks? (yes/no)
```

### Implementation Phase

```bash
# Start implementing a story
/build-feature 456

# Output:
🚀 Build Feature Command

📊 Current Phase: implementation
📍 Reference: 456

💻 Starting Implementation for Story #456

Loading story context...
Loading: .claude/build/contexts/stories/story-456/context.md
Loading: .claude/build/contexts/stories/story-456/technical-notes.md
Loading: CLAUDE.md

TDD Implementation Cycle:
1. RED - Write failing tests
2. GREEN - Implement to pass tests
3. REFACTOR - Improve code quality

Story: As a user, I want AI title suggestions so that I can create better slides faster

Acceptance Criteria:
✓ User can request title suggestions from slide editor
✓ System generates 3-5 relevant suggestions
✓ Suggestions appear within 5 seconds
✓ User can apply suggestion with one click

Ready to begin implementation? Let's start with the tests!
```

## Context Management

The command uses a structured context system to maintain continuity across sessions:

### Context Directory Structure

```
.claude/build/
├── 1-process/           # Process prompts
│   ├── 1-idea-to-prd/
│   ├── 2-prd-chunking/
│   ├── 3-stakeholder-validation/
│   ├── 4-user-stories-creation/
│   ├── 5-sprint-planning/
│   └── 6-sprint-execution/
├── 2-context/           # Project context files
│   ├── project-context.md
│   ├── technical-context.md
│   └── business-context.md
└── contexts/            # Feature-specific contexts
    ├── epics/
    ├── chunks/
    └── stories/
```

### Loading Context

Each phase loads specific context files:

```typescript
// Phase-specific context loading
const contextMap = {
  ideation: [
    '.claude/build/2-context/project-context.md',
    '.claude/build/2-context/business-context.md',
  ],
  chunking: [
    '.claude/build/2-context/technical-context.md',
    'Epic PRD from GitHub issue',
  ],
  implementation: [
    `.claude/build/contexts/stories/story-${id}/context.md`,
    `.claude/build/contexts/stories/story-${id}/technical-notes.md`,
    'CLAUDE.md',
  ],
};
```

## Progress Tracking

### GitHub Integration

The command tracks progress through GitHub:

- **Labels**: Track phase completion (`prd-complete`, `chunks-complete`, etc.)
- **Milestones**: Group stories into sprints
- **Projects**: Visual progress on project board
- **Comments**: Document decisions and progress

### Local Tracking

For each story, maintain:

- `context.md` - Story details and requirements
- `technical-notes.md` - Implementation decisions
- `progress.md` - Current status and next steps

## Error Handling

### Common Issues

```typescript
// Missing context files
if (!contextExists(storyId)) {
  console.log('⚠️  Context files missing for story #' + storyId);
  console.log('\nOptions:');
  console.log('1. Create context from GitHub issue');
  console.log('2. Skip context (not recommended)');
  console.log('3. Exit and create manually');
}

// Phase mismatch
if (expectedPhase !== actualPhase) {
  console.log('⚠️  Phase mismatch detected');
  console.log(`Expected: ${expectedPhase}`);
  console.log(`Actual: ${actualPhase}`);
  console.log('\nThis might indicate incomplete work from previous phase.');
}

// Missing dependencies
if (missingDependencies.length > 0) {
  console.log('🚫 Missing dependencies:');
  missingDependencies.forEach((dep) => {
    console.log(`- ${dep.type}: ${dep.description}`);
  });
}
```

## Advanced Usage

### Flags and Options

```bash
# Force a specific phase
/build-feature 123 --phase=chunking

# Skip validation checks
/build-feature 123 --skip-validation

# Load additional context
/build-feature 123 --context=ai-integration

# Dry run mode
/build-feature "New Feature" --dry-run
```

### Batch Operations

```bash
# Process multiple stories
/build-feature --stories=123,124,125 --phase=sprint-planning

# Validate all chunks for an epic
/build-feature --epic=100 --validate-all
```

### Context Refresh

```bash
# Refresh stale context
/build-feature 123 --refresh-context

# Force reload all context
/build-feature 123 --force-reload
```

## Integration Points

### With Other Commands

- **`/log-issue`** - Document bugs found during implementation
- **`/debug-issue`** - Debug problems that arise
- **`/write-unit-tests`** - Generate tests during TDD phase

### With GitHub

- Issues track all work items
- Projects provide visual progress
- PRs link to implementation stories
- Actions automate workflow transitions

### With Context System

- Prompts guide each phase
- Context files maintain continuity
- Progress tracking ensures completion
- Decision documentation preserves knowledge

## Best Practices

1. **Complete Each Phase** - Don't skip steps, they build on each other
2. **Maintain Context** - Update progress files after each session
3. **Use TDD Approach** - Write tests first for better code quality
4. **Document Decisions** - Future you will thank present you
5. **Regular Reviews** - Check progress against original PRD

## Troubleshooting

### Phase Detection Issues

```bash
# If phase detection fails, specify manually
/build-feature 123 --phase=implementation

# Check issue labels and status
gh issue view 123
```

### Context Loading Problems

```bash
# Verify context files exist
ls -la .claude/build/contexts/stories/story-123/

# Recreate missing context
/build-feature 123 --recreate-context
```

### Workflow Blockages

```bash
# Skip to next viable story
/build-feature --epic=100 --next-available

# Mark story as blocked
/build-feature 123 --mark-blocked="Waiting for API specs"
```

## Quick Reference

```bash
# Start new feature
/build-feature "AI-powered slide suggestions"

# Continue from any reference
/build-feature 123              # Issue number
/build-feature epic-123         # Epic reference
/build-feature story-456        # Story reference

# Phase-specific commands
/build-feature 123 --phase=chunking
/build-feature 123 --phase=validation
/build-feature 123 --phase=implementation

# Utility commands
/build-feature --list-active    # Show all active features
/build-feature --show-progress  # Display progress dashboard
/build-feature --help          # Show detailed help
```

## Summary

The build-feature command orchestrates our complete AI-Assisted Feature Development workflow:

1. **Structured Process** - 6 phases from idea to implementation
2. **Context Preservation** - Maintains continuity across sessions
3. **GitHub Integration** - Uses issues and projects for tracking
4. **Quality Focus** - TDD approach and validation steps
5. **AI Optimization** - Prompts and context designed for Claude Code

By following this systematic approach, you ensure high-quality, well-documented features that align with business goals and user needs.
