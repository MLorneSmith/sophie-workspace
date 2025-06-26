# Log Task Command

Usage: `/log-task [output_format]` (default: github)

- `github`: Create GitHub issue as a task (default)
- `local`: Save to `.claude/z.archive/tasks/` only (no GitHub issue)
- `file`: Same as `local` (alternative syntax)

This command creates structured task specifications with clear steps, dependencies, and acceptance criteria for tracking development tasks.

## 1. Adopt Role

Load the task planner mindset:

```
/read .claude/context/roles/task-planner.md
```

## 2. Initial Information Gathering

### 2.1 User Interview

Ask the user for:

1. **Task Title**: Brief description of what needs to be done
2. **Task Type**:
   - `feature`: New functionality
   - `enhancement`: Improvement to existing functionality
   - `refactor`: Code restructuring without changing behavior
   - `documentation`: Documentation updates
   - `testing`: Test creation or updates
   - `infrastructure`: Build/deployment/tooling changes
3. **Priority**: `critical`, `high`, `medium`, `low`
4. **Scope**: Estimated effort (hours/days/weeks)
5. **Dependencies**: Other tasks or systems this depends on
6. **Success Criteria**: How we'll know when it's done
7. **Due Date**: When it needs to be completed (if applicable)

### 2.2 Automatic Task Analysis

From the user-provided information, create:

1. **Task ID**: TODO-[github_issue_number] or TODO-[timestamp]-[hash]
2. **Affected Areas**: Components, files, or systems that will be modified
3. **Technical Requirements**: Specific technical needs or constraints
4. **Testing Requirements**: What tests need to be written/updated

### 2.3 Context Collection

Gather relevant project information:

```bash
# Current project state
git branch --show-current
git status --short

# Check existing related code
# (search for files related to the task area)

# Review package dependencies if relevant
cat package.json | grep -E "(dependencies|devDependencies)" -A 20
```

## 3. Task Breakdown and Analysis

### 3.1 Prerequisite Analysis

Identify what needs to be in place before starting:

```typescript
// Check for existing patterns
const existingPatterns = await searchForSimilarImplementations();
const dependencies = await analyzeDependencies();
const potentialConflicts = await checkForConflicts();
```

### 3.2 Implementation Steps

Break down the task into clear, actionable steps:

1. **Preparation Phase**
   - Environment setup
   - Dependency installation
   - Branch creation

2. **Development Phase**
   - Core implementation steps
   - Integration points
   - Error handling

3. **Testing Phase**
   - Unit tests
   - Integration tests
   - Manual testing

4. **Finalization Phase**
   - Code review preparation
   - Documentation updates
   - Deployment considerations

### 3.3 Risk Assessment

Identify potential challenges:

- Technical complexity
- External dependencies
- Time constraints
- Knowledge gaps

## 4. Task Specification Creation

### 4.1 Standard Task Format

Create a structured task document:

```markdown
# Task: [Title]

**ID**: TASK-[github_issue_number] (or TASK-[timestamp]-[hash] if local only)
**Created**: [ISO timestamp]
**Assignee**: [user/team member]
**Priority**: [critical|high|medium|low]
**Status**: new
**Type**: [feature|enhancement|refactor|documentation|testing|infrastructure]
**Due Date**: [YYYY-MM-DD or "No deadline"]

## Summary

[One paragraph description of what needs to be accomplished and why]

## Success Criteria

- [ ] [Specific, measurable outcome 1]
- [ ] [Specific, measurable outcome 2]
- [ ] [Specific, measurable outcome 3]

## Technical Requirements

### Dependencies
- [External library/service 1]
- [Internal module/component 2]

### Constraints
- [Performance requirement]
- [Security consideration]
- [Compatibility requirement]

## Implementation Plan

### Phase 1: Setup and Preparation
- [ ] Create feature branch from `main`
- [ ] Install required dependencies
- [ ] Set up development environment
- [ ] Review existing code patterns

### Phase 2: Core Implementation
- [ ] [Step 1 with specific file/component]
- [ ] [Step 2 with specific file/component]
- [ ] [Step 3 with specific file/component]

### Phase 3: Testing
- [ ] Write unit tests for [component]
- [ ] Write integration tests for [feature]
- [ ] Manual testing checklist:
  - [ ] Test case 1
  - [ ] Test case 2
  - [ ] Edge case testing

### Phase 4: Documentation and Review
- [ ] Update README if needed
- [ ] Add inline code documentation
- [ ] Update API documentation
- [ ] Create PR with detailed description

## Affected Files

Anticipated changes:
- `src/components/[component].tsx` - [type of change]
- `src/lib/[module].ts` - [type of change]
- `src/app/[route]/page.tsx` - [type of change]

## Testing Strategy

### Unit Tests
- Test [function/component] for [behavior]
- Mock [external dependency]
- Verify [edge case]

### Integration Tests
- Test [user flow]
- Verify [system interaction]

### Manual Testing
1. [Step-by-step manual test procedure]
2. [Expected results]

## Acceptance Criteria

- [ ] All tests passing
- [ ] Code review approved
- [ ] No performance regression
- [ ] Documentation updated
- [ ] Deployed to staging

## Time Estimate

- Setup: [X hours]
- Implementation: [Y hours]
- Testing: [Z hours]
- Documentation: [W hours]
**Total**: [Sum hours]

## Notes and Considerations

[Any additional context, warnings, or helpful information]

## Related Issues/Tasks
- [Link to related issue]
- [Link to dependent task]

---
*Generated by Claude Task Assistant*
*Estimated Completion Time: [total estimate]*
```

### 4.2 GitHub Issue Creation

```typescript
let taskId, issueNumber, githubUrl;

if (outputFormat === 'local' || outputFormat === 'file') {
  // Local-only mode
  const timestamp = Date.now();
  const hash = Math.random().toString(36).substr(2, 9);
  taskId = `TASK-${timestamp}-${hash}`;
  
  taskContent = taskContent.replace(
    '**ID**: TASK-[github_issue_number]',
    `**ID**: ${taskId}`
  );
  
  // Save local file
  const datePrefix = new Date().toISOString().split('T')[0];
  const filename = `.claude/z.archive/tasks/${datePrefix}-${taskId}.md`;
  await writeFile(filename, taskContent);
} else {
  // GitHub-first approach (default)
  const issue = await mcp__github__create_issue({
    owner: 'MLorneSmith',
    repo: '2025slideheroes',
    title: `[TASK] ${taskTitle}`,
    body: taskContent,
    labels: ['task', priority, taskType],
    assignees: assignee ? [assignee] : []
  });
  
  issueNumber = issue.number;
  taskId = `TASK-${issueNumber}`;
  githubUrl = issue.html_url;
}
```

## 5. Post-Creation Actions

### 5.1 Summary Output

**GitHub Mode (Default):**
```
✅ Task logged to GitHub successfully!

🔗 GitHub Issue: https://github.com/MLorneSmith/2025slideheroes/issues/124
🏷️ Task ID: TASK-124
⏱️ Estimated Time: 8 hours
📅 Due Date: 2025-01-15

Next Steps:
1. To start this task: /do-task 124
2. To update progress: Edit the GitHub issue
3. To break down further: /refine-task 124

The task has been created with a detailed implementation plan.
```

**Local Mode:**
```
✅ Task logged locally!

📁 Local File: .claude/z.archive/tasks/2025-01-06-TASK-1234567-xyz.md
🏷️ Task ID: TASK-1234567-xyz
⏱️ Estimated Time: 8 hours

Next Steps:
1. To start this task: /do-task TASK-1234567-xyz
2. To convert to GitHub issue: /publish-task TASK-1234567-xyz
```

### 5.2 Index Update

Update `.claude/z.archive/tasks/index.md` with:
- Task ID
- Title
- Priority
- Status
- Due date
- Estimated time
- File path

## 6. Task Planning Patterns

### Common Task Types

#### Feature Implementation
- UI component creation
- API endpoint development
- Database schema changes
- Service integration

#### Enhancement Tasks
- Performance optimization
- UX improvements
- Feature extensions
- Code refactoring

#### Infrastructure Tasks
- Build process updates
- Deployment configuration
- Tool integration
- Development environment setup

### Step Generation Guidelines

1. **Be Specific**: Reference actual files and functions
2. **Be Sequential**: Order steps logically
3. **Be Complete**: Include setup, implementation, and cleanup
4. **Be Testable**: Each step should have a clear completion criteria

## 7. Integration with Other Commands

### For Do-Task Command
The do-task command expects:
- Clear implementation steps
- Defined success criteria
- Identified files to modify
- Testing requirements

### For Team Collaboration
- GitHub integration for assignment
- Progress tracking through issue updates
- Detailed steps for handoffs
- Clear acceptance criteria

## Context Management

### Task Complexity Levels

1. **Simple** (< 4 hours): Basic changes, single file
2. **Medium** (4-16 hours): Multiple files, some testing
3. **Complex** (16+ hours): Architecture changes, extensive testing
4. **Epic** (Multi-week): Break into sub-tasks

### Output Guidelines
- Keep task specs focused and actionable
- Include enough detail for implementation
- Avoid over-engineering simple tasks
- Link to relevant documentation