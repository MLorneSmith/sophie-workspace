---
allowed-tools: Bash, Read, Write, LS, Task
---

# Feature Decompose

Break implementation plan into concrete, actionable tasks.

## Usage
```
/feature:decompose <feature_name>
```

## Required Rules

**IMPORTANT:** Before executing this command, read and follow:
- `.claude/rules/datetime.md` - For getting real current date/time

## Preflight Checklist

Before proceeding, complete these validation steps.
Do not bother the user with preflight checks progress. Just do them and move on.

1. **Verify implementation plan exists:**
   - Check if `.claude/implementations/$ARGUMENTS/plan.md` exists
   - If not found, tell user: "❌ Implementation plan not found: $ARGUMENTS. First create it with: /feature:plan $ARGUMENTS"
   - Stop execution if plan doesn't exist

2. **Check for existing tasks:**
   - Check if any numbered task files (001.md, 002.md, etc.) already exist in `.claude/implementations/$ARGUMENTS/`
   - If tasks exist, list them and ask: "⚠️ Found {count} existing tasks. Delete and recreate all tasks? (yes/no)"
   - Only proceed with explicit 'yes' confirmation
   - If user says no, suggest: "View existing tasks with: ls .claude/implementations/$ARGUMENTS/*.md"

3. **Validate plan frontmatter:**
   - Verify plan has valid frontmatter with: name, status, created, specification
   - If invalid, tell user: "❌ Invalid plan frontmatter. Please check: .claude/implementations/$ARGUMENTS/plan.md"

4. **Check plan status:**
   - If plan status is already "completed", warn user: "⚠️ Implementation is marked as completed. Are you sure you want to decompose it again?"

## Instructions

You are decomposing an implementation plan into specific, actionable tasks for: **$ARGUMENTS**

### 1. Read the Implementation Plan
- Load the plan from `.claude/implementations/$ARGUMENTS/plan.md`
- Understand the technical approach and phases
- Review the task categories preview
- Analyze dependencies and risk factors

### 2. Analyze for Parallel Creation

Determine if tasks can be created in parallel:
- If tasks are mostly independent: Create in parallel using Task agents
- If tasks have complex dependencies: Create sequentially
- For best results: Group independent tasks for parallel creation

### 3. Parallel Task Creation (When Possible)

If tasks can be created in parallel, spawn sub-agents:

```yaml
Task:
  description: "Create task files batch {X}"
  subagent_type: "general-purpose"
  prompt: |
    Create task files for feature implementation: $ARGUMENTS
    
    Tasks to create:
    - {list of 3-4 tasks for this batch}
    
    For each task:
    1. Create file: .claude/implementations/$ARGUMENTS/{number}.md
    2. Use exact format with frontmatter and all sections
    3. Follow task breakdown from implementation plan
    4. Set parallel/depends_on fields appropriately
    5. Number sequentially (001.md, 002.md, etc.)
    
    Return: List of files created
```

### 4. Task File Format with Frontmatter
For each task, create a file with this exact structure:

```markdown
---
name: [Task Title]
status: open
created: [Current ISO date/time]
updated: [Current ISO date/time]
github: [Will be updated when synced to GitHub]
depends_on: []  # List of task numbers this depends on, e.g., [001, 002]
parallel: true  # Can this run in parallel with other tasks?
conflicts_with: []  # Tasks that modify same files, e.g., [003, 004]
type: task
---

# Task: [Task Title]

## Description
Clear, concise description of what needs to be done

## Acceptance Criteria
- [ ] Specific criterion 1
- [ ] Specific criterion 2
- [ ] Specific criterion 3

## Technical Details
### Implementation Approach
- Step-by-step approach
- Key technical decisions

### Files to Modify
- `path/to/file1.ts` - Description of changes
- `path/to/file2.tsx` - Description of changes

### New Files to Create
- `path/to/newfile.ts` - Purpose and structure

## Dependencies
- [ ] Task dependencies (reference by number)
- [ ] External dependencies (libraries, services)
- [ ] Data dependencies (migrations, seeds)

## Testing Requirements
- Unit tests to write/update
- Integration tests needed
- Manual testing steps

## Effort Estimate
- Size: XS/S/M/L/XL
- Hours: [estimated hours]
- Complexity: Low/Medium/High

## Definition of Done
- [ ] Code implemented and working
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Deployed to development environment
```

### 5. Task Naming Convention
Save tasks as: `.claude/implementations/$ARGUMENTS/{task_number}.md`
- Use sequential numbering: 001.md, 002.md, etc.
- Keep task titles short but descriptive
- Focus on the outcome, not the process

### 6. Frontmatter Guidelines
- **name**: Use a descriptive task title (action-oriented)
- **status**: Always start with "open" for new tasks
- **created**: Get REAL current datetime by running: `date -u +"%Y-%m-%dT%H:%M:%SZ"`
- **updated**: Use the same real datetime as created for new tasks
- **github**: Leave placeholder text - will be updated during sync
- **depends_on**: List task numbers that must complete before this can start
- **parallel**: Set to true if this can run alongside other tasks without conflicts
- **conflicts_with**: List task numbers that modify the same files
- **type**: Always use "task" to distinguish from other documents

### 7. Task Types to Consider
Based on the implementation plan phases:

**Foundation Tasks**:
- Environment setup
- Configuration
- Base infrastructure
- Testing framework

**Core Feature Tasks**:
- Data models/schemas
- Business logic
- API endpoints
- UI components

**Integration Tasks**:
- External service integration
- Authentication/authorization
- Data migration
- System connectivity

**Quality Tasks**:
- Unit testing
- Integration testing
- Performance optimization
- Security hardening

**Documentation Tasks**:
- API documentation
- User guides
- Technical documentation
- Deployment guides

### 8. Parallelization Strategy

Mark tasks with `parallel: true` if they:
- Work on different parts of the codebase
- Don't share data dependencies
- Can be tested independently
- Don't require sequential knowledge

Use `conflicts_with` when tasks:
- Modify the same files
- Share database migrations
- Affect the same API endpoints
- Require coordinated changes

### 9. Execution Strategy

Choose based on task count and complexity:

**Small Feature (< 5 tasks)**: Create sequentially for simplicity

**Medium Feature (5-10 tasks)**:
- Batch into 2-3 groups
- Spawn agents for each batch
- Consolidate results

**Large Feature (> 10 tasks)**:
- Analyze dependencies first
- Group independent tasks
- Launch parallel agents (max 5 concurrent)
- Create dependent tasks after prerequisites

Example for parallel execution:
```markdown
Spawning 3 agents for parallel task creation:
- Agent 1: Creating tasks 001-003 (Database layer)
- Agent 2: Creating tasks 004-006 (API layer)  
- Agent 3: Creating tasks 007-009 (UI layer)
```

### 10. Task Dependency Validation

When creating tasks with dependencies:
- Ensure referenced dependencies exist
- Check for circular dependencies
- Validate dependency chains are achievable
- If issues found, warn but continue: "⚠️ Task dependency warning: {details}"

### 11. Update Implementation Plan

After creating all tasks, update the plan file by adding this section:
```markdown
## Tasks Created
- [ ] 001.md - {Task Title} (parallel: {true/false}, size: {XS/S/M/L/XL})
- [ ] 002.md - {Task Title} (parallel: {true/false}, size: {XS/S/M/L/XL})
- etc.

### Summary
Total tasks: {count}
Parallel tasks: {parallel_count}
Sequential tasks: {sequential_count}
Estimated total effort: {sum of hours} hours

### Execution Order
1. **Parallel Batch 1**: Tasks that can start immediately
   - Task 001, 002, 003
2. **Parallel Batch 2**: After batch 1 completes
   - Task 004, 005
3. **Sequential**: Must be done in order
   - Task 006 → 007 → 008
```

Also update the plan's frontmatter progress if needed (still 0% until tasks actually start).

### 12. Quality Validation

Before finalizing tasks, verify:
- [ ] All tasks have clear acceptance criteria
- [ ] Task sizes are reasonable (4-8 hours typical, max 3 days)
- [ ] Dependencies form a valid DAG (no cycles)
- [ ] Parallel tasks don't conflict
- [ ] Combined tasks cover all plan requirements
- [ ] Testing requirements are explicit

### 13. Post-Decomposition

After successfully creating tasks:
1. Confirm: "✅ Created {count} tasks for feature: $ARGUMENTS"
2. Show summary:
   - Total tasks created
   - Parallel vs sequential breakdown
   - Total estimated effort
   - Suggested execution order
3. Suggest next step: "Ready to sync to GitHub? Run: /feature:sync $ARGUMENTS"

## Error Recovery

If any step fails:
- If task creation partially completes, list which tasks were created
- Provide option to clean up partial tasks
- Never leave the implementation in an inconsistent state
- Suggest manual verification: "Check: ls .claude/implementations/$ARGUMENTS/*.md"

## Task Sizing Guidelines

- **XS (1-2 hours)**: Simple config changes, minor updates
- **S (2-4 hours)**: Single component, simple endpoint
- **M (4-8 hours)**: Feature component, complex logic
- **L (1-2 days)**: Major feature, multiple components
- **XL (2-3 days)**: Complex system, extensive testing

Aim for most tasks to be S or M size. Break down L and XL tasks when possible.

Create well-defined, achievable tasks that can be executed efficiently in parallel where possible for the "$ARGUMENTS" feature.