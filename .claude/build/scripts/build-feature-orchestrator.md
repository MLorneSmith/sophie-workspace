# Build Feature Orchestrator Implementation Guide

This document provides the implementation details for the `/build-feature-v2` command orchestrator.

## Core Functions

### 1. Phase Detection

```typescript
interface FeaturePhase {
  current:
    | 'idea'
    | 'prd'
    | 'chunks'
    | 'stories'
    | 'ready'
    | 'implementation'
    | 'complete';
  epicId?: number;
  activeStoryId?: number;
  blockers?: string[];
}

async function detectFeaturePhase(input: string): Promise<FeaturePhase> {
  // Check if input is issue number
  if (/^\d+$/.test(input)) {
    const issue = await getGitHubIssue(Number(input));

    // Check issue labels and project fields
    const labels = issue.labels.map((l) => l.name);
    const projectFields = await getProjectFields(issue.number);

    return {
      current: projectFields['AAFD Stage']?.toLowerCase() || 'idea',
      epicId: issue.number,
      activeStoryId: findActiveStory(issue),
      blockers: findBlockers(issue),
    };
  }

  // New feature
  return { current: 'idea' };
}
```

### 2. PRD Generation

```typescript
async function generatePRD(featureName: string): Promise<string> {
  // Load feature planning prompt
  const prompt = await readFile(
    '.claude/build/prompt-library/feature-planning.xml',
  );

  // Apply prompt with context
  const prdContent = await applyPrompt(prompt, {
    feature_idea: featureName,
    project_context: await getProjectContext(),
    existing_patterns: await getCodebasePatterns(),
  });

  return prdContent;
}
```

### 3. Epic Creation

```typescript
async function createFeatureEpic(
  prd: string,
  featureName: string,
): Promise<number> {
  // Create GitHub issue with Epic template
  const epic = await createGitHubIssue({
    title: `[EPIC] ${featureName}`,
    body: prd,
    labels: ['epic', 'aafd-v2'],
    customFields: {
      'Feature Type': 'Epic',
      'AAFD Stage': 'PRD',
      Priority: determinePriority(prd),
    },
  });

  // Add to GitHub Projects
  await addToProject(epic.number, 'SlideHeroes AAFD v2.0');

  return epic.number;
}
```

### 4. Story Context Management

```typescript
async function setupStoryContext(
  storyId: number,
  epicId: number,
): Promise<void> {
  const story = await getGitHubIssue(storyId);
  const epic = await getGitHubIssue(epicId);

  // Create context directory
  const contextDir = `.claude/build/contexts/stories/story-${storyId}`;
  await createDirectory(contextDir);

  // Create context files
  await writeFile(
    `${contextDir}/context.md`,
    generateStoryContext(story, epic),
  );
  await writeFile(`${contextDir}/technical-notes.md`, '# Technical Notes\n\n');
  await writeFile(`${contextDir}/progress.md`, generateProgressTemplate(story));
  await writeFile(`${contextDir}/files.txt`, identifyRelevantFiles(story));
}
```

### 5. Implementation Guidance

```typescript
async function guideImplementation(storyId: number): Promise<void> {
  const story = await getGitHubIssue(storyId);
  const context = await loadStoryContext(storyId);

  console.log(`
💻 Implementing Story #${storyId}: ${story.title}

Loading context...
`);

  // Load appropriate role
  const role = determineRole(story);
  console.log(`✅ Loading ${role} role...`);

  // Load context files
  console.log('✅ Loading story context...');
  console.log('✅ Loading project standards...');

  // Show implementation plan
  const tasks = extractTasks(story);
  console.log(`
📋 Technical Tasks:
${tasks.map((t, i) => `${i + 1}. ${t.description}`).join('\n')}

🎯 Acceptance Criteria:
${context.acceptanceCriteria.map((c) => `- [ ] ${c}`).join('\n')}

📁 Files to modify:
${context.filesToModify.map((f) => `- ${f}`).join('\n')}

Ready to start implementation? (y/n): _
`);
}
```

## Orchestration Flow

### Main Command Handler

```typescript
async function handleBuildFeatureCommand(args: string[]): Promise<void> {
  const input = args[0];
  const flags = parseFlags(args.slice(1));

  try {
    // Detect current phase
    const phase = await detectFeaturePhase(input);

    // Route to appropriate handler
    switch (phase.current) {
      case 'idea':
        await handleNewFeature(input);
        break;

      case 'prd':
        await handlePRDRefinement(phase.epicId!);
        break;

      case 'chunks':
        await handleTechnicalChunking(phase.epicId!);
        break;

      case 'stories':
        await handleStoryCreation(phase.epicId!);
        break;

      case 'ready':
        await handleSprintPlanning(phase.epicId!);
        break;

      case 'implementation':
        await handleImplementation(phase.epicId!, phase.activeStoryId);
        break;

      case 'complete':
        await handleFeatureCompletion(phase.epicId!);
        break;
    }
  } catch (error) {
    handleError(error);
  }
}
```

### Progress Tracking

```typescript
interface ImplementationProgress {
  epicId: number;
  totalStories: number;
  completedStories: number;
  currentStory?: number;
  blockers: string[];
  lastUpdated: Date;
}

async function trackProgress(epicId: number): Promise<ImplementationProgress> {
  const epic = await getGitHubIssue(epicId);
  const stories = await getLinkedStories(epicId);

  return {
    epicId,
    totalStories: stories.length,
    completedStories: stories.filter((s) => s.state === 'closed').length,
    currentStory: stories.find((s) => hasLabel(s, 'in-progress'))?.number,
    blockers: stories.filter((s) => hasLabel(s, 'blocked')).map((s) => s.title),
    lastUpdated: new Date(),
  };
}
```

## Interactive Prompts

### Feature Information Gathering

```typescript
async function gatherFeatureInfo(featureName: string): Promise<FeatureInfo> {
  console.log(`
🚀 Let's plan your feature: ${featureName}

I'll need some information to create a comprehensive PRD.
`);

  const info: FeatureInfo = {
    name: featureName,
    problem: await prompt('What problem does this feature solve? '),
    users: await prompt('Who are the target users? '),
    keyFunctionality: await prompt(
      'What is the key functionality? (comma-separated) ',
    ),
    businessValue: await prompt('What is the business value? '),
    technicalDomains: await selectMultiple([
      'Frontend',
      'Backend',
      'Database',
      'AI',
      'DevOps',
    ]),
  };

  return info;
}
```

### Context Loading Confirmation

```typescript
async function confirmContextLoading(storyId: number): Promise<boolean> {
  const context = await loadStoryContext(storyId);

  console.log(`
📚 Context Loading Summary:

Story: #${storyId} - ${context.title}
Role: ${context.primaryRole}
Files: ${context.filesToRead.length} files identified
Similar Patterns: ${context.similarImplementations.length} references found

Would you like to:
1. Load all context and begin implementation
2. Review context files first
3. Skip context loading

Choice: _
`);

  const choice = await prompt('');
  return choice === '1';
}
```

## Error Handling

### Common Error Scenarios

```typescript
function handleError(error: any): void {
  if (error.code === 'GITHUB_ISSUE_NOT_FOUND') {
    console.error(`
❌ GitHub issue not found!

Please check the issue number and try again.
To start a new feature, use: /build-feature-v2 "Feature Name"
`);
  } else if (error.code === 'PROJECT_NOT_CONFIGURED') {
    console.error(`
❌ GitHub Projects not configured!

Please set up GitHub Projects:
1. Go to repository settings
2. Create project "SlideHeroes AAFD v2.0"
3. Configure custom fields as documented

See: .claude/build/docs/methodology/getting-started.md
`);
  } else if (error.code === 'CONTEXT_MISSING') {
    console.error(`
⚠️ Story context missing or incomplete!

Run: /build-feature-v2 --setup-context ${error.storyId}
`);
  } else {
    console.error(`
❌ Unexpected error: ${error.message}

Please check the logs and try again.
If the issue persists, create a bug report.
`);
  }
}
```

## Utility Functions

### GitHub Integration

```typescript
async function getProjectFields(
  issueNumber: number,
): Promise<Record<string, any>> {
  // Implementation to fetch GitHub Projects custom fields
  // This would use GitHub GraphQL API
}

async function updateProjectField(
  issueNumber: number,
  fieldName: string,
  value: any,
): Promise<void> {
  // Implementation to update custom field
}

async function moveToColumn(
  issueNumber: number,
  columnName: string,
): Promise<void> {
  // Implementation to move issue in project board
}
```

### Context Management

```typescript
async function loadStoryContext(storyId: number): Promise<StoryContext> {
  const contextDir = `.claude/build/contexts/stories/story-${storyId}`;

  return {
    story: await readFile(`${contextDir}/context.md`),
    technicalNotes: await readFile(`${contextDir}/technical-notes.md`),
    progress: await readFile(`${contextDir}/progress.md`),
    files: await readFile(`${contextDir}/files.txt`),
  };
}

async function updateProgress(
  storyId: number,
  updates: Partial<Progress>,
): Promise<void> {
  const progressFile = `.claude/build/contexts/stories/story-${storyId}/progress.md`;
  const current = await readFile(progressFile);
  const updated = mergeProgress(current, updates);
  await writeFile(progressFile, updated);
}
```

## Usage Examples

### Complete Feature Flow

```bash
# Start new feature
/build-feature-v2 "AI-Powered Slide Suggestions"
# Creates Epic #21

# Continue with chunking
/build-feature-v2 21
# Creates chunk issues

# Continue with story creation
/build-feature-v2 21
# Creates user stories

# Start implementation
/build-feature-v2 21
# Guides through story implementation

# Check progress
/build-feature-v2 21 --status
# Shows implementation progress
```

### Recovery Scenarios

```bash
# Refresh stale context
/build-feature-v2 --refresh-context 125

# Resume after break
/build-feature-v2 21 --resume

# Fix blocked story
/build-feature-v2 125 --unblock

# Jump to implementation
/build-feature-v2 21 --jump-to implementation
```

This orchestrator ensures smooth feature development following the AAFD v2.0 methodology!
