# Do Task Command

Usage: `/do-task [task_reference]`

- GitHub issue number: `124` (preferred format from log-task command)
- Task ID: `TASK-124`
- Local file: `.claude/z.archive/tasks/2025-01-06-TASK-124.md`
- GitHub URL: `https://github.com/MLorneSmith/2025slideheroes/issues/124`
- Legacy format: `TASK-1234567-xyz` (for older local-only tasks)

This command reads a task specification from GitHub and executes the implementation plan step-by-step.

**CRITICAL**: Always review GitHub issue comments for the most current status and progress updates, as task descriptions may be outdated.

## 1. Adopt Role

Load the implementation mindset:

```
/read .claude/context/roles/implementation-engineer.md
```

## 2. Load Task Specification

### 2.1 Auto-Sync and Locate Task

Use the auto-sync service to fetch/cache tasks automatically:

```bash
# Run sync to ensure we have the latest task data
node .claude/scripts/sync-task.js ${task_reference}

# The script will:
# 1. Detect if it's a GitHub issue (number, TASK-124, #124, URL)
# 2. Check local cache (1 hour freshness)
# 3. Auto-fetch from GitHub if needed
# 4. Create/update local cache file
# 5. Handle fallbacks gracefully
```

### 2.2 Parse Task Reference

The auto-sync service handles all reference formats:

```bash
# Examples of supported formats:
node .claude/scripts/sync-task.js 124               # GitHub issue #124
node .claude/scripts/sync-task.js TASK-124          # TASK-124 format
node .claude/scripts/sync-task.js "#124"            # Hash format
node .claude/scripts/sync-task.js "https://github.com/MLorneSmith/2025slideheroes/issues/124"  # Full URL
```

### 2.3 Load Synced Task

After auto-sync completes, read the local file:

```bash
# Auto-sync creates files in format: YYYY-MM-DD-TASK-{number}.md
# Find the synced file
task_file=$(find .claude/z.archive/tasks -name "*-TASK-${task_number}.md" | head -1)

if [ -z "$task_file" ]; then
  echo "❌ Task file not found after auto-sync"
  exit 1
fi

echo "📁 Using task file: $task_file"
```

### 2.4 Read and Parse Task

```typescript
// Read the task specification
const taskContent = await readFile(taskPath);
const task = parseTaskSpecification(taskContent);

// Extract key information
const {
  id,
  priority,
  type,
  implementationPlan,
  affectedFiles,
  testingStrategy,
  acceptanceCriteria,
  timeEstimate
} = task;
```

### 2.5 Review GitHub Issue Comments (Critical Step)

**IMPORTANT**: Always review GitHub issue comments for implementation updates and current progress:

```bash
# Review all comments on the GitHub issue for latest status
gh issue view ${task_number} --repo MLorneSmith/2025slideheroes --comments

# This will show:
# - Implementation progress updates
# - Completed phases
# - Current blockers
# - Technical decisions made
# - Next steps to focus on
```

**What to Look For**:
- **Progress Comments**: "Phase 1 complete", "Started Phase 2", etc.
- **Completion Checkmarks**: Updated checklist items in comments
- **Technical Context**: Decisions and discoveries during implementation
- **Current Focus**: What specifically needs to be done next

## 3. Implementation Planning

### 3.1 Create Working Branch

```bash
# Create feature branch for the task
git checkout -b task/${task_id}

# Verify clean working directory
git status
```

### 3.2 Load Context Documentation

Based on task type, load relevant documentation:

```typescript
// Read context based on task type
const contextMap = {
  feature: [
    '.claude/context/standards/code-standards.md',
    '.claude/docs/architecture/system-design.md'
  ],
  enhancement: [
    '.claude/context/standards/code-standards.md',
    // Load docs for specific area being enhanced
  ],
  refactor: [
    '.claude/docs/architecture/performance-optimization.md',
    '.claude/context/standards/code-standards.md'
  ],
  testing: [
    '.claude/docs/testing/unit-testing-patterns.md',
    '.claude/docs/testing/context/testing-fundamentals.md'
  ]
};
```

### 3.3 Review Current State

```typescript
// Check affected files current state
for (const file of task.affectedFiles) {
  const exists = await fileExists(file);
  if (exists) {
    await readFile(file);
    // Understand current implementation
  }
}

// Check for related tests
const testFiles = task.affectedFiles.map(f => f.replace(/\.(ts|tsx)$/, '.test.$1'));
for (const testFile of testFiles) {
  if (await fileExists(testFile)) {
    await readFile(testFile);
  }
}
```

## 4. Phase-by-Phase Execution

### 4.1 Execute Setup Phase

```typescript
// Phase 1: Setup and Preparation
const setupSteps = task.implementationPlan.phase1;

for (const step of setupSteps) {
  console.log(`📋 Executing: ${step.description}`);
  
  if (step.completed) {
    console.log('✅ Already completed (from GitHub comments)');
    continue;
  }
  
  // Execute the step
  await executeStep(step);
  
  // Update progress
  await updateGitHubProgress(task.id, step.id, 'completed');
}
```

### 4.2 Core Implementation

```typescript
// Phase 2: Core Implementation
const implementationSteps = task.implementationPlan.phase2;

for (const step of implementationSteps) {
  console.log(`🔨 Implementing: ${step.description}`);
  
  if (step.completed) {
    console.log('✅ Already completed');
    continue;
  }
  
  // Read the file to modify
  const fileContent = await readFile(step.file);
  
  // Implement the changes
  const updatedContent = await implementFeature(step, fileContent);
  
  // Write the changes
  await writeFile(step.file, updatedContent);
  
  // Run immediate validation
  await validateChanges(step.file);
  
  // Update progress
  await updateGitHubProgress(task.id, step.id, 'completed');
}
```

### 4.3 Testing Phase

```typescript
// Phase 3: Testing
const testingSteps = task.implementationPlan.phase3;

for (const step of testingSteps) {
  console.log(`🧪 Testing: ${step.description}`);
  
  if (step.testType === 'unit') {
    // Create or update unit tests
    const testFile = step.testFile;
    const testContent = await generateUnitTests(step);
    await writeFile(testFile, testContent);
    
    // Run the tests
    const testResult = await runTests(testFile);
    if (!testResult.success) {
      console.error('❌ Tests failed:', testResult.errors);
      // Fix and retry
    }
  } else if (step.testType === 'manual') {
    // Document manual testing steps
    console.log('📝 Manual testing required:');
    step.testCases.forEach(tc => console.log(`  - ${tc}`));
  }
}
```

### 4.4 Documentation and Finalization

```typescript
// Phase 4: Documentation and Review
const finalizationSteps = task.implementationPlan.phase4;

for (const step of finalizationSteps) {
  console.log(`📄 Finalizing: ${step.description}`);
  
  if (step.type === 'documentation') {
    await updateDocumentation(step);
  } else if (step.type === 'review-prep') {
    await prepareForReview(step);
  }
}
```

## 5. Progress Tracking

### 5.1 Update GitHub Issue

After each major phase or significant progress:

```typescript
async function updateGitHubProgress(taskId, phaseCompleted, notes) {
  const progressUpdate = `
## 🚀 IMPLEMENTATION PROGRESS UPDATE

**Phase Completed**: ${phaseCompleted}
**Timestamp**: ${new Date().toISOString()}

### ✅ Completed in this session:
${notes.completed.map(item => `- ${item}`).join('\n')}

### 🔄 In Progress:
${notes.inProgress.map(item => `- ${item}`).join('\n')}

### 📋 Next Steps:
${notes.nextSteps.map(item => `- ${item}`).join('\n')}

### 📊 Overall Progress:
- Phase 1 (Setup): ✅ Complete
- Phase 2 (Implementation): 🔄 ${notes.implementationProgress}% Complete
- Phase 3 (Testing): ⏳ Pending
- Phase 4 (Documentation): ⏳ Pending

---
*Updated by Claude Implementation Assistant*
`;

  await mcp__github__add_issue_comment({
    owner: 'MLorneSmith',
    repo: '2025slideheroes',
    issue_number: extractIssueNumber(taskId),
    body: progressUpdate
  });
}
```

### 5.2 Local Progress Tracking

```typescript
// Create progress file
const progressFile = `.claude/z.archive/tasks/progress/${task.id}-progress.md`;
const progress = {
  taskId: task.id,
  startTime: new Date().toISOString(),
  phases: {
    setup: { status: 'in-progress', steps: [] },
    implementation: { status: 'pending', steps: [] },
    testing: { status: 'pending', steps: [] },
    finalization: { status: 'pending', steps: [] }
  },
  currentPhase: 'setup',
  blockers: [],
  decisions: []
};

// Update after each step
await updateProgressFile(progressFile, progress);
```

## 6. Quality Assurance

### 6.1 Continuous Validation

After each file modification:

```bash
# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run affected tests
npm test -- --findRelatedTests ${modified_files}
```

### 6.2 Acceptance Criteria Verification

```typescript
// Check each acceptance criterion
const results = [];
for (const criterion of task.acceptanceCriteria) {
  const result = await verifyCriterion(criterion);
  results.push({
    criterion: criterion.description,
    status: result.passed ? '✅' : '❌',
    details: result.details
  });
}

// Report results
console.log('\n📋 Acceptance Criteria Results:');
results.forEach(r => console.log(`${r.status} ${r.criterion}`));
```

## 7. Completion and Handoff

### 7.1 Final Validation

```bash
# Full test suite
npm test

# Build verification
npm run build

# Final type check
npm run typecheck
```

### 7.2 Create Pull Request

```bash
# Stage all changes
git add -A

# Commit with descriptive message
git commit -m "feat: implement ${task.title}

- ${task.acceptanceCriteria[0]}
- ${task.acceptanceCriteria[1]}
- ${task.acceptanceCriteria[2]}

Implements #${task.githubNumber}"

# Push branch
git push -u origin task/${task.id}

# Create PR
gh pr create \
  --title "Implement: ${task.title}" \
  --body "## Summary\n\n${task.summary}\n\n## Implementation\n\n- ✅ All acceptance criteria met\n- ✅ Tests passing\n- ✅ Documentation updated\n\n## Testing\n\n${testingSummary}\n\nCloses #${task.githubNumber}" \
  --assignee @me
```

### 7.3 Final Status Update

```typescript
const completionUpdate = `
## ✅ TASK COMPLETED

**Task ID**: ${task.id}
**Completion Time**: ${new Date().toISOString()}
**Total Time**: ${calculateTotalTime(startTime)}

### 🎯 All Acceptance Criteria Met:
${task.acceptanceCriteria.map(ac => `- ✅ ${ac}`).join('\n')}

### 📁 Files Modified:
${modifiedFiles.map(f => `- ${f}`).join('\n')}

### 🧪 Tests Added/Updated:
${testFiles.map(f => `- ${f}`).join('\n')}

### 🔗 Pull Request:
${prUrl}

### 📝 Implementation Notes:
${implementationNotes}

---
*Task completed by Claude Implementation Assistant*
`;

await mcp__github__add_issue_comment({
  owner: 'MLorneSmith',
  repo: '2025slideheroes',
  issue_number: task.githubNumber,
  body: completionUpdate
});
```

## 8. Error Handling and Recovery

### 8.1 Implementation Blockers

When encountering blockers:

```typescript
// Document the blocker
const blocker = {
  phase: currentPhase,
  step: currentStep,
  description: errorDescription,
  timestamp: new Date().toISOString(),
  attemptedSolutions: [],
  needsHelp: true
};

// Update GitHub
await updateGitHubWithBlocker(task.id, blocker);

// Attempt recovery strategies
const recoveryStrategies = [
  checkForMissingDependencies,
  reviewSimilarImplementations,
  consultDocumentation,
  suggestAlternativeApproach
];
```

### 8.2 Partial Progress Handling

If unable to complete all phases:

```typescript
// Save progress state
const partialProgress = {
  taskId: task.id,
  completedPhases: getCompletedPhases(),
  currentPhase: getCurrentPhase(),
  nextSteps: getNextSteps(),
  blockers: getBlockers(),
  resumeInstructions: generateResumeInstructions()
};

// Create resume file
await writeFile(
  `.claude/z.archive/tasks/resume/${task.id}-resume.md`,
  formatResumeInstructions(partialProgress)
);
```

## Context Management

### Task Focus

1. **Single Task Focus**: Work on one task at a time
2. **Relevant Files Only**: Only load files mentioned in task
3. **Incremental Progress**: Complete one phase before starting next
4. **Regular Commits**: Commit after each significant step

### When to Pause

- Completed a full phase
- Encountered a blocker needing user input
- Reached context limits
- Need to run extensive manual tests
- Significant architectural decision needed

## Integration with Log-Task

### Feedback Loop

- Update task estimates based on actual time
- Document discovered subtasks
- Refine implementation patterns
- Improve testing strategies

### Pattern Library

Build implementation patterns:

```
.claude/z.archive/tasks/patterns/
├── react-component-pattern.md
├── api-endpoint-pattern.md
├── database-migration-pattern.md
└── test-creation-pattern.md
```