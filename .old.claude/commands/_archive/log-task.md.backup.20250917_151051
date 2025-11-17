---
description: Create comprehensive task specifications with GitHub integration and intelligent analysis
allowed-tools: [Read, Write, Edit, Bash, Task, Grep, Glob, TodoWrite]
argument-hint: [output_format] (github|local|file) - default: github
model: sonnet
---

# Task Planning and Specification System

Create structured task specifications with multi-round clarification, specialist analysis, and robust GitHub integration.

## Key Features
- **Interactive Clarification**: Multi-round requirements gathering via clarification-loop-engine
- **GitHub Integration**: Automatic issue creation with 3-attempt retry and fallback
- **Specialist Analysis**: Leverages domain experts for technical feasibility
- **Dynamic Context**: Task-specific documentation loading for informed planning
- **Validation First**: Comprehensive input validation and error handling
- **Progress Tracking**: Real-time task status with TodoWrite integration

## Essential Context
<!-- Always read for this command -->
- Read .claude/context/constraints.md
- Read .claude/context/database/schema.md
- Read .claude/context/standards/code-standards.md

## Prompt

<role>
You are an expert Task Planning Specialist with deep expertise in software project management, requirement analysis, and GitHub integration.
You excel at breaking down complex requirements into actionable tasks with clear acceptance criteria, using interactive clarification to ensure complete understanding.
</role>

<instructions>
# Task Planning and Specification Workflow

**CORE REQUIREMENTS**:
- Use clarification-loop-engine for ambiguous requirements
- Implement 3-attempt retry for GitHub API failures
- Load dynamic context based on task type
- Delegate to specialist agents for technical analysis
- Validate all inputs with schemas
- Track progress with TodoWrite

## 1. Discovery & Context
<discovery>
Initial assessment and context gathering:

1. **Parse Command Arguments**:
   - Format: `github` (default), `local`, or `file`
   - Validate output format parameter

2. **Initialize TodoWrite Tracking**:
   ```javascript
   const todos = [
     { content: "Gather task requirements", status: "in_progress" },
     { content: "Run clarification loop", status: "pending" },
     { content: "Analyze technical feasibility", status: "pending" },
     { content: "Create task specification", status: "pending" },
     { content: "Publish to GitHub/local", status: "pending" }
   ];
   await TodoWrite(todos);
   ```

3. **Initial User Interview**:
   Ask for basic information:
   - Task title and description
   - Priority level (critical/high/medium/low)
   - Estimated scope (hours/days/weeks)
   - Task type (feature/enhancement/refactor/documentation/testing/infrastructure)
</discovery>

## 2. Interactive Clarification
<clarification>
Use clarification-loop-engine for comprehensive requirements:

1. **Invoke Clarification Agent**:
   ```javascript
   const clarificationResult = await Task({
     subagent_type: "clarification-loop-engine",
     description: "Clarify task requirements",
     prompt: `
       Task Information:
       - Title: ${taskTitle}
       - Type: ${taskType}
       - Initial Description: ${description}

       Generate clarification questions for:
       1. Success criteria definition
       2. Technical constraints
       3. Dependencies and blockers
       4. Testing requirements
       5. Performance expectations
     `
   });
   ```

2. **Display Questions to User**:
   ```
   📋 **Clarification Required**

   [Display full agent output]

   Please answer the above questions to ensure accurate task planning.
   ```

3. **Process User Responses**:
   - Parse answers for each question
   - Update task specification with clarified requirements
   - Mark clarification todo as completed
</clarification>

## 3. Dynamic Context Loading
<context_loading>
Load relevant documentation based on task type:

```bash
# Extract keywords from task description and type
TASK_KEYWORDS=$(extractKeywords "${taskTitle} ${taskType} ${description}")

# Map task type to context query
case "$taskType" in
  feature)
    CONTEXT_QUERY="$TASK_KEYWORDS feature implementation patterns"
    ;;
  refactor)
    CONTEXT_QUERY="$TASK_KEYWORDS refactoring best practices code quality"
    ;;
  testing)
    CONTEXT_QUERY="$TASK_KEYWORDS testing strategies test patterns"
    ;;
  infrastructure)
    CONTEXT_QUERY="$TASK_KEYWORDS deployment CI/CD infrastructure"
    ;;
  database)
    CONTEXT_QUERY="$TASK_KEYWORDS database migrations schema RLS"
    ;;
  *)
    CONTEXT_QUERY="$TASK_KEYWORDS implementation patterns"
    ;;
esac

# Load dynamic context
CONTEXT_FILES=$(node .claude/scripts/context-loader.cjs \
  --query="$CONTEXT_QUERY" \
  --command="log-task" \
  --max-results=3 \
  --token-budget=4000 \
  --format=paths)

# Read each context file
for FILE in $CONTEXT_FILES; do
  eval "$FILE"
done
```
</context_loading>

## 4. Technical Analysis
<analysis>
Delegate to specialist agents for feasibility analysis:

1. **Task Complexity Assessment**:
   ```javascript
   const complexity = assessComplexity({
     fileCount: estimatedFiles.length,
     dependencies: externalDependencies.length,
     testingRequired: hasTestRequirements,
     crossCutting: affectsMultipleLayers
   });
   ```

2. **Specialist Agent Selection**:
   ```javascript
   const specialists = [];

   if (taskType === 'feature' && involvesUI) {
     specialists.push('react-expert');
   }
   if (involvesDatabase) {
     specialists.push('database-expert');
   }
   if (requiresTesting) {
     specialists.push('vitest-testing-expert');
   }
   if (involvesInfrastructure) {
     specialists.push('devops-expert');
   }
   ```

3. **Technical Feasibility Analysis**:
   ```javascript
   for (const specialist of specialists) {
     const analysis = await Task({
       subagent_type: specialist,
       description: `Analyze technical feasibility`,
       prompt: `
         Task: ${taskTitle}
         Requirements: ${clarifiedRequirements}

         Provide:
         1. Technical feasibility assessment
         2. Potential challenges
         3. Recommended approach
         4. Estimated complexity
       `
     });

     incorporateAnalysis(taskSpec, analysis);
   }
   ```
</analysis>

## 5. Task Specification Creation
<specification>
Create comprehensive task document with validation:

### Validation Schema
```typescript
interface TaskSpecification {
  id: string;
  title: string;
  type: 'feature' | 'enhancement' | 'refactor' | 'documentation' | 'testing' | 'infrastructure';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'new' | 'in_progress' | 'blocked' | 'completed';

  summary: string;
  successCriteria: string[];
  technicalRequirements: {
    dependencies: string[];
    constraints: string[];
    assumptions: string[];
  };

  implementationPlan: {
    phases: Phase[];
    estimatedHours: number;
  };

  testingStrategy: {
    unitTests: string[];
    integrationTests: string[];
    manualTests: string[];
  };

  metadata: {
    created: string;
    assignee?: string;
    dueDate?: string;
    relatedIssues?: string[];
  };
}

interface Phase {
  name: string;
  steps: Step[];
  estimatedHours: number;
}

interface Step {
  description: string;
  completed: boolean;
  files?: string[];
  dependencies?: string[];
}
```

### Task Document Format
```markdown
# Task: ${title}

**ID**: TASK-${id}
**Created**: ${timestamp}
**Priority**: ${priority}
**Status**: new
**Type**: ${type}
**Complexity**: ${complexity}
**Estimated Time**: ${totalHours} hours

## Summary
${summary}

## Success Criteria
${successCriteria.map(c => `- [ ] ${c}`).join('\n')}

## Technical Analysis
### Feasibility Assessment
${feasibilityAssessment}

### Identified Risks
${risks.map(r => `- **${r.level}**: ${r.description}`).join('\n')}

### Recommended Approach
${recommendedApproach}

## Implementation Plan
${phases.map(renderPhase).join('\n')}

## Testing Strategy
### Unit Tests
${unitTests.map(t => `- ${t}`).join('\n')}

### Integration Tests
${integrationTests.map(t => `- ${t}`).join('\n')}

### Manual Testing
${manualTests.map(t => `- [ ] ${t}`).join('\n')}

## Dependencies
${dependencies.map(d => `- ${d}`).join('\n')}

## Affected Files
${files.map(f => `- \`${f.path}\` - ${f.changeType}`).join('\n')}

## Acceptance Criteria
- [ ] All tests passing
- [ ] Code review approved
- [ ] Documentation updated
- [ ] No performance regression
${additionalCriteria.map(c => `- [ ] ${c}`).join('\n')}

## Notes
${additionalNotes}

---
*Generated by Task Planning System*
*Technical Analysis by: ${specialists.join(', ')}*
```
</specification>

## 6. GitHub Integration with Error Handling
<github_integration>
Robust GitHub issue creation with retry logic:

```javascript
async function createGitHubIssue(taskSpec, retries = 3) {
  let attempt = 0;
  let lastError = null;

  while (attempt < retries) {
    try {
      attempt++;
      console.log(`GitHub API attempt ${attempt}/${retries}...`);

      // Use gh CLI for issue creation
      const result = await Bash(`
        gh issue create \
          --repo MLorneSmith/2025slideheroes \
          --title "[TASK] ${taskSpec.title}" \
          --body "${escapeForBash(taskSpec.markdown)}" \
          --label "task,${taskSpec.priority},${taskSpec.type}" \
          ${taskSpec.assignee ? `--assignee ${taskSpec.assignee}` : ''}
      `);

      // Parse issue number and URL from output
      const issueNumber = extractIssueNumber(result);
      const issueUrl = `https://github.com/MLorneSmith/2025slideheroes/issues/${issueNumber}`;

      return {
        success: true,
        issueNumber,
        issueUrl,
        taskId: `TASK-${issueNumber}`
      };

    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed: ${error.message}`);

      if (error.message.includes('rate limit')) {
        // Wait exponentially for rate limits
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Rate limited. Waiting ${waitTime}ms...`);
        await sleep(waitTime);
      } else if (error.message.includes('authentication')) {
        // Authentication failure - no point retrying
        break;
      } else {
        // Network or other transient error
        await sleep(1000 * attempt);
      }
    }
  }

  // All retries failed - prompt for manual intervention
  console.error(`GitHub issue creation failed after ${retries} attempts`);

  return {
    success: false,
    error: lastError,
    fallback: await handleGitHubFailure(taskSpec)
  };
}

async function handleGitHubFailure(taskSpec) {
  console.log(`
⚠️ **GitHub Issue Creation Failed**

The system attempted to create a GitHub issue ${retries} times but failed.
Error: ${lastError.message}

**Options:**
1. Save task locally and retry later
2. Fix the issue and retry now
3. Cancel task creation

Automatically saving to local file as backup...
  `);

  // Save to local file as fallback
  const timestamp = Date.now();
  const hash = Math.random().toString(36).substr(2, 9);
  const localId = `TASK-${timestamp}-${hash}`;
  const filename = `.claude/z.archive/tasks/${new Date().toISOString().split('T')[0]}-${localId}.md`;

  await Write(filename, taskSpec.markdown);

  return {
    localFile: filename,
    localId: localId,
    message: "Task saved locally. Use /publish-task to retry GitHub creation later."
  };
}
```
</github_integration>

## 7. Output and Completion
<output>
Final task creation summary:

**GitHub Success Output:**
```
✅ Task Specification Created Successfully!

📋 **Task Summary**
Title: ${taskTitle}
Type: ${taskType}
Priority: ${priority}
Complexity: ${complexity}
Estimated Time: ${totalHours} hours

🔗 **GitHub Issue**: ${issueUrl}
🏷️ **Task ID**: ${taskId}

📊 **Technical Analysis**
- Feasibility: ${feasibilityScore}/10
- Risk Level: ${riskLevel}
- Specialists Consulted: ${specialists.join(', ')}

📁 **Affected Areas**
- Files: ${fileCount} files
- Components: ${components.join(', ')}
- Tests Required: ${testCount} tests

🚀 **Next Steps**
1. Start implementation: /do-task ${issueNumber}
2. View on GitHub: ${issueUrl}
3. Update progress: Edit GitHub issue directly

The task has been thoroughly analyzed and documented.
```

**Local Fallback Output:**
```
⚠️ Task Saved Locally (GitHub Unavailable)

📁 **Local Storage**: ${filename}
🏷️ **Task ID**: ${localId}

The task specification has been saved locally due to GitHub issues.

**To publish to GitHub later:**
/publish-task ${localId}

**To start work immediately:**
/do-task ${localId}
```

Update TodoWrite to mark all tasks completed:
```javascript
await TodoWrite(todos.map(t => ({ ...t, status: 'completed' })));
```
</output>
</instructions>

<patterns>
### Task Type Detection Patterns
- **Feature**: New functionality, UI components, API endpoints
- **Enhancement**: Performance improvements, UX updates, optimizations
- **Refactor**: Code reorganization, technical debt reduction
- **Testing**: Test coverage, E2E tests, test infrastructure
- **Infrastructure**: CI/CD, deployment, tooling, monitoring
- **Documentation**: README updates, API docs, user guides

### Complexity Assessment
- **Simple** (<4 hours): Single file, minimal dependencies
- **Medium** (4-16 hours): Multiple files, some integration
- **Complex** (16-40 hours): Cross-cutting, multiple systems
- **Epic** (40+ hours): Should be broken into sub-tasks

### Agent Selection Matrix
| Task Aspect | Specialist Agent | When to Use |
|------------|-----------------|-------------|
| UI Components | react-expert | React components, hooks, state |
| Styling | css-styling-expert | CSS, Tailwind, responsive design |
| Backend | nodejs-expert | API routes, server logic |
| Database | database-expert | Schema, migrations, queries |
| Testing | vitest-testing-expert | Test strategy, coverage |
| Infrastructure | devops-expert | CI/CD, deployment |
| TypeScript | typescript-expert | Type issues, generics |
| Performance | refactoring-expert | Optimization, code quality |
</patterns>

<error_handling>
### Common Issues
1. **GitHub Authentication**: Ensure GITHUB_TOKEN is set in environment
2. **Rate Limiting**: Automatic exponential backoff and retry
3. **Network Failures**: 3-attempt retry with fallback to local storage
4. **Invalid Input**: Validation schemas catch before processing
5. **Missing Context**: Dynamic loading ensures relevant documentation

### Recovery Strategies
- **Automatic Retry**: For transient failures (network, rate limits)
- **Local Fallback**: Save locally when GitHub unavailable
- **Manual Intervention**: Prompt user for critical failures
- **Validation First**: Prevent errors with upfront validation
- **Progress Tracking**: TodoWrite ensures no lost state
</error_handling>

<help>
📋 **Task Planning System**

Create comprehensive task specifications with interactive clarification and specialist analysis.

**Usage:**
- `/log-task` - Create GitHub issue (default)
- `/log-task local` - Save locally only
- `/log-task file` - Alternative local syntax

**Process:**
1. Gather initial requirements
2. Run interactive clarification
3. Load relevant context
4. Conduct specialist analysis
5. Create detailed specification
6. Publish to GitHub or save locally

**Features:**
- Multi-round clarification for complete understanding
- Domain expert analysis for technical feasibility
- Automatic GitHub issue creation with retry logic
- Dynamic context loading based on task type
- Comprehensive validation and error handling

Ready to plan your next task with precision!
</help>