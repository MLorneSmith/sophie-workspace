# Orchestration Command Template

Use this template for complex, multi-phase coordination commands (initiative, feature-set).

---

## Template

```markdown
---
description: <Brief description of what this command orchestrates>
argument-hint: [initiative-or-goal-description]
model: opus
allowed-tools: [Read, Write, Edit, Grep, Glob, Bash, Task, TodoWrite, Skill]
---

# <Command Title>

Orchestrate: $ARGUMENTS

## Overview

```
Phase 1: Research
    │
    ▼
Phase 2: Planning
    │
    ▼
Phase 3: Execution
    │
    ▼
Phase 4: Review
```

## Instructions

### Phase 1: Research

1. **Parse the goal**:
   ```typescript
   const initiativeName = '[Short name]';
   const initiativeGoal = '[Full description]';
   const scope = '[small|medium|large]';
   ```

2. **Research the codebase**:
   - Use Task with `subagent_type=Explore` for codebase patterns
   - Use Task with `subagent_type=context7-expert` for library docs
   - Use Task with `subagent_type=perplexity-expert` for best practices

3. **Create research manifest**:
   - Save to `.ai/reports/<type>-reports/YYYY-MM-DD/<name>/manifest.md`

### Phase 2: Planning

4. **Decompose into features/tasks**:
   - Break initiative into manageable pieces
   - Identify dependencies between pieces
   - Create dependency graph

5. **Create plans for each component**:
   - Use `/feature` for feature components
   - Use `/chore` for infrastructure components
   - Save all plans to appropriate directories

6. **Create GitHub issues** for each component:
   ```bash
   # Create parent issue
   gh issue create --title "Initiative: <name>" --body "<overview>"

   # Create child issues with parent reference
   gh issue create --title "Feature: <component>" --body "Part of #<parent>"
   ```

### Phase 3: Execution

7. **Execute in dependency order**:
   - Use `/implement` for each component
   - Run in parallel where no dependencies exist
   - Track progress with TodoWrite

8. **Coordinate parallel execution** (if applicable):
   ```
   # Launch multiple agents for independent work
   Task(subagent_type="general-purpose", prompt="Implement component A")
   Task(subagent_type="general-purpose", prompt="Implement component B")
   ```

9. **Sync after parallel work**:
   - Merge branches if using separate branches
   - Resolve any conflicts
   - Run full validation

### Phase 4: Review

10. **Run comprehensive validation**:
    ```bash
    pnpm typecheck
    pnpm lint:fix
    pnpm test:unit
    pnpm test:e2e
    pnpm build
    ```

11. **Create completion report**:
    - Summarize all work completed
    - List all issues closed
    - Note any follow-up items

12. **Update GitHub**:
    - Close parent initiative issue
    - Add summary comment with all completed work

## Dependency Management

### Dependency Graph Format

```markdown
## Dependencies

Component A (no dependencies)
    └── Component B (depends on A)
        └── Component D (depends on B)
    └── Component C (depends on A)
        └── Component D (depends on C)
```

### Execution Order

| Phase | Components | Can Parallelize |
|-------|------------|-----------------|
| 1 | A | N/A (single) |
| 2 | B, C | Yes |
| 3 | D | N/A (single) |

## Error Handling

### Component Failure

If a component fails:
1. Stop dependent components
2. Log the failure with details
3. Ask user whether to:
   - Retry the failed component
   - Skip and continue with independent components
   - Abort the initiative

### Partial Completion

If initiative cannot complete fully:
1. Document completed components
2. Create follow-up issue for remaining work
3. Provide rollback instructions if needed

## Report

After completion:

1. **Summary**:
   - Initiative name and goal
   - Total components completed
   - Time taken (if tracked)

2. **Component Status**:
   | Component | Status | Issue # |
   |-----------|--------|---------|
   | A | Complete | #123 |
   | B | Complete | #124 |

3. **Validation Results**:
   - All validation commands passed

4. **Follow-up Items**:
   - Any deferred work
   - Technical debt created
   - Future improvements
```

---

## Customization Points

1. **Phases**: Adjust phases for your workflow (e.g., add deployment phase)
2. **Parallelization**: Configure parallel execution strategy
3. **Sandbox Isolation**: Add E2B sandbox for isolated execution
4. **GitHub Integration**: Customize issue/project board integration
5. **Rollback Strategy**: Define rollback procedures for failures
