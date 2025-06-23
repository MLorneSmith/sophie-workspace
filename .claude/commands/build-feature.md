# Build Feature Command

Usage: `/build-feature [feature-reference]`

- `feature-reference`: Can be a feature name, epic ID, story ID, or chunk ID

This command orchestrates the complete AI-Assisted Feature Development workflow using our structured methodology and prompts.

## Overview

The build-feature command guides you through our 7-phase development process:

0. **User Discovery** - Interactive interview and market research
1. **Ideation & PRD Creation** - Transform validated ideas into structured requirements
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
    return { phase: 'discovery', isNew: true, featureName: reference };
  }

  // Check existing GitHub issues
  const issue = await getGitHubIssue(reference);
  if (!issue) return { phase: 'unknown', error: 'Issue not found' };

  // Determine phase based on issue labels and state
  if (issue.labels.includes('discovery') && !issue.labels.includes('discovery-complete')) {
    return { phase: 'discovery', discoveryId: issue.number };
  }
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

### Phase 0: User Discovery & Research

**What happens:**
Conduct interactive user interview and market research to collect all information needed for PRD generation.

**Process:**

```typescript
async function executeDiscoveryPhase(featureName: string) {
  console.log(`🔍 Starting User Discovery for: ${featureName}\n`);

  // Create feature slug for file organization
  const featureSlug = featureName.toLowerCase().replace(/\s+/g, '-');
  const epicName = featureSlug; // Will be used as epic-name throughout the process
  const discoveryPath = `.claude/build/4-output/${epicName}/0-discovery`;
  const contextPath = `.claude/build/4-output/contexts/discovery/${epicName}`;

  // Load discovery prompt
  console.log('Loading user discovery prompt...');
  const discoveryPrompt = await readFile(
    '.claude/build/1-process/0-user-discovery/user-discovery-prompt.xml',
  );

  // Start interactive interview
  console.log(`
🎯 User Discovery Interview

I'll guide you through a series of questions to understand your feature idea and gather all the context needed for PRD generation.

Let's start with the basics:`);

  // Conduct user interview (interactive Q&A)
  const discoveryResults = await conductUserInterview();

  // Perform market research using MCP tools
  console.log('\n🔬 Conducting Market Research...');
  const marketResearch = await performMarketResearch(discoveryResults);

  // Generate context files in both locations for consistency
  console.log('\n📄 Generating Context Files...');
  await generateContextFiles(discoveryPath, discoveryResults, marketResearch);
  await generateContextFiles(contextPath, discoveryResults, marketResearch);

  // Create GitHub issue for tracking
  console.log('\n📝 Creating Discovery Issue...');
  const issue = await createDiscoveryIssue(featureName, discoveryResults);

  console.log(`\n✅ Discovery Complete!`);
  console.log(`📁 Discovery files created in: ${discoveryPath}`);
  console.log(`📁 Context files created in: ${contextPath}`);
  console.log(`🎫 GitHub issue: #${issue.number}`);
  console.log(`\n➡️  Ready for PRD generation phase`);
}
```

**Output:**

- Discovery summary with validated requirements
- Generated files in: `.claude/build/4-output/{epic-name}/0-discovery/`
- Context files in: `.claude/build/4-output/contexts/discovery/{epic-name}/`
- Files created: business-context.md, user-research.md, competitive-analysis.md, market-trends.md, discovery-summary.md
- GitHub discovery issue for tracking
- Ready for PRD generation

### Phase 1: Ideation & PRD Creation

**What happens:**
Transform discovery session results into a comprehensive Product Requirements Document (PRD).

**Process:**

```typescript
async function executeIdeationPhase(discoveryId: number) {
  console.log(`📋 Starting PRD creation from Discovery #${discoveryId}\n`);

  // Load discovery results
  const discovery = await getGitHubIssue(discoveryId);
  const featureSlug = discovery.title.toLowerCase().replace(/\s+/g, '-');
  const epicName = featureSlug; // Consistent epic-name throughout
  const discoveryPath = `.claude/build/4-output/${epicName}/0-discovery`;
  const contextPath = `.claude/build/4-output/contexts/discovery/${epicName}`;

  // Load discovery context from both locations
  console.log('Loading discovery session results...');
  await loadFiles([
    `${discoveryPath}/discovery-summary.md`,
    `${contextPath}/business-context.md`,
    `${contextPath}/user-research.md`,
    `${contextPath}/competitive-analysis.md`,
    `${contextPath}/market-trends.md`,
    'CLAUDE.md', // Project standards
  ]);

  // Load and apply PRD prompt
  console.log('Applying PRD creation prompt...');
  const prdPrompt = await readFile(
    '.claude/build/1-process/1-idea-to-prd/idea-to-prd-prompt.xml',
  );

  // Generate PRD from discovery results
  console.log(`
📊 Generating PRD from validated discovery results...

✅ User requirements validated
✅ Market research completed
✅ Competitive analysis available
✅ Business context defined

Creating comprehensive PRD...`);

  // Create GitHub Epic with PRD
  const epic = await createEpicFromDiscovery(discovery, contextPath);

  // Create PRD output directory
  const prdPath = `.claude/build/4-output/${epicName}/1-prd`;
  await createDirectory(prdPath);
  await writeFile(`${prdPath}/prd-content.md`, epic.body);

  console.log(`\n✅ PRD Generated!`);
  console.log(`🎫 Epic issue: #${epic.number}`);
  console.log(`📄 PRD saved to: ${prdPath}/prd-content.md`);
}
```

**Output:**

- GitHub Epic issue with structured PRD
- PRD saved to: `.claude/build/4-output/{epic-name}/1-prd/prd-content.md`
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
  const epicName = epic.title.toLowerCase().replace(/\s+/g, '-');
  console.log('Loading PRD content...');

  // Load PRD from file system
  const prdPath = `.claude/build/4-output/${epicName}/1-prd/prd-content.md`;
  await loadFiles([prdPath]);

  // Load chunking prompt
  const chunkingPrompt = await readFile(
    '.claude/build/1-process/2-prd-chunking/create-prd-chunks-prompt.xml',
  );

  // Apply chunking analysis
  console.log('Analyzing PRD structure for logical chunks...');
  console.log('Identifying cross-cutting concerns...');
  console.log('Creating dependency map...\n');

  // Create chunk issues
  const chunkIds = await createChunkIssues(epic);

  // Create chunks output directory
  const chunksPath = `.claude/build/4-output/${epicName}/2-chunks`;
  await createDirectory(chunksPath);

  // Validate each chunk
  console.log('\n🔍 Validating Chunks...');
  const validationPrompt = await readFile(
    '.claude/build/1-process/2-prd-chunking/validate-prd-chunks.xml',
  );

  for (const chunkId of chunkIds) {
    console.log(`Validating chunk #${chunkId}...`);
    // Apply validation prompt
    // Save chunk details
    await writeFile(`${chunksPath}/chunk-${chunkId}.md`, chunkContent);
    // Create chunk context
    const chunkContextPath = `.claude/build/4-output/contexts/chunks/chunk-${chunkId}`;
    await createDirectory(chunkContextPath);
    await writeFile(`${chunkContextPath}/context.md`, chunkContext);
  }

  // Save validation results
  const validationPath = `${chunksPath}/validation`;
  await createDirectory(validationPath);
  await writeFile(
    `${validationPath}/chunk-validation-results.md`,
    validationResults,
  );
}
```

**Output:**

- 2-4 implementation chunks with clear boundaries
- Chunk files saved to: `.claude/build/4-output/{epic-name}/2-chunks/chunk-{id}.md`
- Chunk contexts in: `.claude/build/4-output/contexts/chunks/chunk-{id}/context.md`
- Each chunk validated for completeness and feasibility
- Dependency documentation
- Risk assessment per chunk
- Parallel work streams identified
- Validation results stored in: `.claude/build/4-output/{epic-name}/2-chunks/validation/`

### Phase 3: Stakeholder Validation

**What happens:**
Validate technical chunks with stakeholders for alignment.

**Process:**

```typescript
async function executeStakeholderValidation(chunkIds: number[]) {
  console.log(`👥 Starting Stakeholder Validation\n`);

  // Get epic name from first chunk
  const firstChunk = await getGitHubIssue(chunkIds[0]);
  const epicName = firstChunk.epic_title.toLowerCase().replace(/\s+/g, '-');

  // Load validation prompt
  const validationPrompt = await readFile(
    '.claude/build/1-process/3-stakeholder-validation/stakeholder-validation-prompt.xml',
  );

  // Load chunk data for validation
  for (const chunkId of chunkIds) {
    await loadFiles([
      `.claude/build/4-output/${epicName}/2-chunks/chunk-${chunkId}.md`,
      `.claude/build/4-output/contexts/chunks/chunk-${chunkId}/context.md`,
    ]);
  }

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

  // Save validation results
  const validationPath = `.claude/build/4-output/${epicName}/3-validation`;
  await createDirectory(validationPath);
  await writeFile(
    `${validationPath}/stakeholder-feedback.md`,
    validationFeedback,
  );

  // Update chunk issues with feedback
  // Adjust priorities if needed
}
```

**Output:**

- Validated and prioritized chunks
- Validation feedback saved to: `.claude/build/4-output/{epic-name}/3-validation/stakeholder-feedback.md`
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

  // Get chunk and epic info
  const chunk = await getGitHubIssue(chunkId);
  const epicName = chunk.epic_title.toLowerCase().replace(/\s+/g, '-');

  // Load story creation prompt
  const storyPrompt = await readFile(
    '.claude/build/1-process/4-user-stories-creation/create-user-stories-prompt.xml',
  );

  // Load chunk validation results
  await loadFiles([
    `.claude/build/4-output/${epicName}/3-validation/stakeholder-feedback.md`,
    `.claude/build/4-output/${epicName}/2-chunks/chunk-${chunkId}.md`,
    `.claude/build/4-output/contexts/chunks/chunk-${chunkId}/context.md`,
    `.claude/build/4-output/${epicName}/1-prd/prd-content.md`, // For user personas
  ]);

  // Guide story creation
  console.log(
    'Creating stories in format: As a [user], I want [goal], so that [benefit]',
  );
  console.log('Each story should be:');
  console.log('- User-focused (not technical)');
  console.log('- Independently valuable');
  console.log('- Testable\n');

  // Create story issues and save to filesystem
  const storiesPath = `.claude/build/4-output/${epicName}/4-stories`;
  await createDirectory(storiesPath);

  const storyIds = await createStoryIssues(chunk);
  await writeFile(`${storiesPath}/stories-breakdown.md`, storiesBreakdown);

  // Create context files for each story
  for (const storyId of storyIds) {
    const storyContextPath = `.claude/build/4-output/contexts/stories/story-${storyId}`;
    await createDirectory(storyContextPath);
    await writeFile(`${storyContextPath}/context.md`, storyContext);
    await writeFile(`${storyContextPath}/technical-notes.md`, technicalNotes);
    await writeFile(`${storyContextPath}/progress.md`, initialProgress);
  }
}
```

**Output:**

- User stories with acceptance criteria
- Stories breakdown saved to: `.claude/build/4-output/{epic-name}/4-stories/stories-breakdown.md`
- Story context files created in: `.claude/build/4-output/contexts/stories/story-{id}/`
  - `context.md` - Story details and requirements
  - `technical-notes.md` - Implementation approach
  - `progress.md` - Progress tracking file
- Technical tasks identified
- Dependencies documented

### Phase 5: Sprint Planning with TDD

**What happens:**
Plan implementation sprints using Test-Driven Development approach.

**Process:**

```typescript
async function executeSprintPlanning(storyIds: number[]) {
  console.log(`📅 Sprint Planning with TDD Approach\n`);

  // Get epic name from first story
  const firstStory = await getGitHubIssue(storyIds[0]);
  const epicName = firstStory.epic_title.toLowerCase().replace(/\s+/g, '-');

  // Load sprint planning prompt
  const sprintPrompt = await readFile(
    '.claude/build/1-process/5-sprint-planning/create-sprints-prompt.xml',
  );

  // Load story contexts for planning
  for (const storyId of storyIds) {
    await loadFiles([
      `.claude/build/4-output/contexts/stories/story-${storyId}/context.md`,
      `.claude/build/4-output/contexts/stories/story-${storyId}/technical-notes.md`,
    ]);
  }

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

  // Create sprint milestone and save plan
  const sprintNumber = await getNextSprintNumber(epicName);
  const sprintsPath = `.claude/build/4-output/${epicName}/5-sprints`;
  await createDirectory(sprintsPath);

  await createSprintMilestone(epicName, sprintNumber, storyIds);
  await writeFile(`${sprintsPath}/sprint-${sprintNumber}.md`, sprintPlan);

  // Update story status to 'ready'
  for (const storyId of storyIds) {
    await updateStoryStatus(storyId, 'ready');
  }
}
```

**Output:**

- Sprint backlog with selected stories
- Sprint plan saved to: `.claude/build/4-output/{epic-name}/5-sprints/sprint-{number}.md`
- Test specifications for each story
- Implementation sequence planned
- Context requirements documented
- GitHub sprint milestone created
- Stories marked as 'ready' for implementation

### Phase 6: Implementation & Review

**What happens:**
Execute the implementation with continuous tracking and review.

**Process:**

```typescript
async function executeImplementation(storyId: number) {
  console.log(`💻 Starting Implementation for Story #${storyId}\n`);

  // Get story and epic info
  const story = await getGitHubIssue(storyId);
  const epicName = story.epic_title.toLowerCase().replace(/\s+/g, '-');

  // Load implementation prompt
  const implPrompt = await readFile(
    '.claude/build/1-process/6-sprint-execution/implementation-prompt.xml',
  );

  // Load story context and any existing progress
  console.log('Loading story context...');
  await loadFiles([
    `.claude/build/4-output/contexts/stories/story-${storyId}/context.md`,
    `.claude/build/4-output/contexts/stories/story-${storyId}/technical-notes.md`,
    `.claude/build/4-output/contexts/stories/story-${storyId}/progress.md`,
    `.claude/build/4-output/${epicName}/5-sprints/sprint-${story.sprint_number}.md`,
    'CLAUDE.md',
  ]);

  // Execute TDD cycle
  console.log('TDD Implementation Cycle:');
  console.log('1. RED - Write failing tests');
  console.log('2. GREEN - Implement to pass tests');
  console.log('3. REFACTOR - Improve code quality\n');

  // Track progress throughout implementation
  const progressPath = `.claude/build/4-output/contexts/stories/story-${storyId}/progress.md`;

  // Update progress file after each session
  await updateProgressFile(progressPath, {
    phase: 'Implementation',
    completion: percentComplete,
    lastSession: new Date().toISOString(),
    completedTasks: completedTasks,
    technicalDecisions: decisions,
    filesModified: modifiedFiles,
    nextSessionPlan: nextSteps,
  });

  // Update GitHub issues
  await updateStoryStatus(storyId, 'in_progress');
  await addImplementationComment(storyId, progressUpdate);
}
```

**Output:**

- Working, tested implementation
- Progress tracked in: `.claude/build/4-output/contexts/stories/story-{id}/progress.md`
- Documentation updated
- PR created and reviewed
- Story marked as complete
- Technical decisions documented for future reference

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
    case 'discovery':
      await executeDiscoveryPhase(phaseInfo.featureName || reference);
      break;

    case 'ideation':
      await executeIdeationPhase(phaseInfo.discoveryId || phaseInfo.epicId);
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
Loading: .claude/build/4-output/contexts/stories/story-456/context.md
Loading: .claude/build/4-output/contexts/stories/story-456/technical-notes.md
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
├── 0-agents/            # Agent role definitions
├── 1-process/           # Process prompts
│   ├── 0-user-discovery/
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
└── 4-output/            # Generated outputs
    ├── {epic-name}/     # Per-epic outputs
    │   ├── 0-discovery/
    │   ├── 1-prd/
    │   ├── 2-chunks/
    │   │   └── validation/
    │   ├── 3-validation/
    │   ├── 4-stories/
    │   └── 5-sprints/
    └── contexts/        # Reusable contexts
        ├── discovery/
        │   └── {epic-name}/
        ├── chunks/
        │   └── chunk-{id}/
        └── stories/
            └── story-{id}/
                ├── context.md
                ├── technical-notes.md
                └── progress.md
```

### Loading Context

Each phase loads specific context files:

```typescript
// Phase-specific context loading
const contextMap = {
  discovery: [
    '.claude/build/2-context/project-context.md',
    '.claude/build/2-context/business-context.md',
    '.claude/build/2-context/technical-context.md',
  ],
  ideation: [
    `.claude/build/4-output/${epicName}/0-discovery/*`,
    `.claude/build/4-output/contexts/discovery/${epicName}/*`,
    'CLAUDE.md',
  ],
  chunking: [
    `.claude/build/4-output/${epicName}/1-prd/prd-content.md`,
    '.claude/build/2-context/technical-context.md',
  ],
  validation: [
    `.claude/build/4-output/${epicName}/2-chunks/chunk-${id}.md`,
    `.claude/build/4-output/contexts/chunks/chunk-${id}/context.md`,
  ],
  'story-creation': [
    `.claude/build/4-output/${epicName}/3-validation/stakeholder-feedback.md`,
    `.claude/build/4-output/${epicName}/2-chunks/chunk-${id}.md`,
    `.claude/build/4-output/${epicName}/1-prd/prd-content.md`,
  ],
  'sprint-planning': [
    `.claude/build/4-output/${epicName}/4-stories/stories-breakdown.md`,
    `.claude/build/4-output/contexts/stories/story-${id}/*`,
  ],
  implementation: [
    `.claude/build/4-output/contexts/stories/story-${id}/*`,
    `.claude/build/4-output/${epicName}/5-sprints/sprint-${number}.md`,
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
