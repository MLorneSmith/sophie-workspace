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

### 2.1 Parse Task Reference

Parse the task reference to extract issue number:

```bash
# Parse various input formats
task_ref="${ARGUMENTS}"

# Extract issue number from different formats
if [[ "$task_ref" =~ ^[0-9]+$ ]]; then
  # Direct number: 124
  issue_number="$task_ref"
elif [[ "$task_ref" =~ ^TASK-([0-9]+)$ ]]; then
  # TASK-124 format
  issue_number="${BASH_REMATCH[1]}"
elif [[ "$task_ref" =~ ^#([0-9]+)$ ]]; then
  # #124 format
  issue_number="${BASH_REMATCH[1]}"
elif [[ "$task_ref" =~ github\.com/[^/]+/[^/]+/issues/([0-9]+) ]]; then
  # GitHub URL format
  issue_number="${BASH_REMATCH[1]}"
else
  echo "❌ Invalid task reference format: $task_ref"
  exit 1
fi

echo "📋 Loading task #$issue_number"
```

### 2.2 Get Issue from GitHub

Use gh CLI to fetch issue details directly (following CCPM pattern):

```bash
# Get issue details from GitHub
gh issue view $issue_number --json number,title,body,state,labels,assignees,createdAt,milestone > /tmp/task-$issue_number.json

if [ $? -ne 0 ]; then
  echo "❌ Cannot access issue #$issue_number. Check number or run: gh auth login"
  exit 1
fi

# Get issue state
issue_state=$(jq -r '.state' /tmp/task-$issue_number.json)
issue_title=$(jq -r '.title' /tmp/task-$issue_number.json)

echo "📋 Task: $issue_title"
echo "📊 Status: $issue_state"
```

### 2.3 Check for Local Task File

Look for corresponding local task file (if using feature workflow):

```bash
# Check if this is a feature task with local file
# First check new naming convention (issue number as filename)
task_file=".claude/implementations/*/${issue_number}.md"
if ! test -f $task_file 2>/dev/null; then
  # Check old naming convention (001.md, 002.md, etc.)
  task_file=$(grep -l "github:.*issues/${issue_number}" .claude/implementations/*/*.md 2>/dev/null | head -1)
fi

if [ -f "$task_file" ]; then
  echo "📁 Found local task file: $task_file"
  # Read local task for additional context
else
  echo "📋 Working directly from GitHub issue #$issue_number"
fi
```

### 2.4 Read and Parse Task

```bash
# Extract task information from GitHub issue
task_body=$(jq -r '.body' /tmp/task-$issue_number.json)
task_labels=$(jq -r '.labels[].name' /tmp/task-$issue_number.json | tr '\n' ' ')

# Determine task type from labels
if [[ "$task_labels" =~ "feature" ]]; then
  task_type="feature"
elif [[ "$task_labels" =~ "enhancement" ]]; then
  task_type="enhancement"
elif [[ "$task_labels" =~ "bug" ]]; then
  task_type="bug"
elif [[ "$task_labels" =~ "refactor" ]]; then
  task_type="refactor"
else
  task_type="task"
fi

echo "🏷️ Type: $task_type"
echo "🏷️ Labels: $task_labels"
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