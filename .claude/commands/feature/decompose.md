---
description: Break feature implementation plans into parallelizable, actionable tasks with dependency tracking
allowed-tools: Bash, Read, Write, LS, Task
argument-hint: <feature_name>
---

# Feature Decompose

Transform implementation plans into concrete, parallelizable tasks optimized for multi-agent execution within the CCPM framework.

## Key Features
- **Parallel Task Creation**: Spawn multiple agents to create tasks simultaneously
- **Dependency Analysis**: Intelligent dependency and conflict detection
- **Task Sizing**: Automatic effort estimation and complexity assessment
- **GitHub-Ready**: Tasks formatted for seamless GitHub issue integration
- **Validation Checks**: Comprehensive preflight and post-creation validation

## Essential Context
<!-- Always read for this command -->
- Read .claude/context/systems/pm/ccpm-system-overview.md
- Read .claude/rules/datetime.md

## Prompt

<role>
You are the Task Decomposition Specialist, expert in breaking down complex implementation plans into optimally parallelizable tasks. You excel at dependency analysis, effort estimation, and creating clear acceptance criteria for multi-agent execution.
</role>

<instructions>
# Feature Decomposition Workflow

**CORE REQUIREMENTS**:
- Always verify implementation plan exists before proceeding
- Use REAL current datetime via `date -u +"%Y-%m-%dT%H:%M:%SZ"`
- Create tasks with proper frontmatter and dependency tracking
- Optimize for parallel execution wherever possible
- Never leave implementation in inconsistent state

## 1. Initialization & Validation
<initialization>
1. Parse feature name from arguments: `$ARGUMENTS`
2. Set implementation path: `.claude/tracking/implementations/$ARGUMENTS/`

**Preflight Validation** (silent - don't report to user):
```bash
# Check implementation plan exists
if [[ ! -f ".claude/tracking/implementations/$ARGUMENTS/plan.md" ]]; then
  echo "❌ Implementation plan not found: $ARGUMENTS"
  echo "First create it with: /feature:plan $ARGUMENTS"
  exit 1
fi

# Check for existing tasks
EXISTING_TASKS=$(ls .claude/tracking/implementations/$ARGUMENTS/[0-9][0-9][0-9].md 2>/dev/null | wc -l)
if [[ $EXISTING_TASKS -gt 0 ]]; then
  echo "⚠️ Found $EXISTING_TASKS existing tasks. Delete and recreate all tasks? (yes/no)"
  # Wait for user confirmation
  # Only proceed with explicit 'yes'
fi

# Get real current datetime
CURRENT_DATETIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
```
</initialization>

## 2. Dynamic Context Loading
<context_loading>
Load relevant context based on implementation domain:
```bash
# Extract domain keywords from plan
PLAN_CONTENT=$(cat ".claude/tracking/implementations/$ARGUMENTS/plan.md")
DOMAIN_QUERY=$(echo "$PLAN_CONTENT" | grep -E "(frontend|backend|database|api|ui|auth)" -o | tr '\n' ' ')

# Load dynamic context
node .claude/scripts/context-loader.cjs \
  --query="task decomposition $DOMAIN_QUERY parallel dependencies" \
  --command="feature-decompose" \
  --max-results=3 \
  --format=paths
```
</context_loading>

## 3. Plan Analysis & Strategy
<analysis>
1. **Load Implementation Plan**:
   - Read `.claude/tracking/implementations/$ARGUMENTS/plan.md`
   - Extract phases, technical approach, risk factors
   - Identify task categories from plan

2. **Parallelization Assessment**:
   ```yaml
   Parallelizable When:
     - Different files/components
     - Independent features
     - Separate test suites
     - Documentation tasks
     - CSS/styling work

   Sequential When:
     - Same file modifications
     - Shared state changes
     - Database migrations
     - Core library changes
     - Integration points
   ```

3. **Execution Strategy Selection**:
   - **< 5 tasks**: Sequential creation for simplicity
   - **5-10 tasks**: Batch into 2-3 parallel groups
   - **> 10 tasks**: Maximum parallelization with dependency chains
</analysis>

## 4. Task Creation Execution
<task_creation>
### Sequential Mode (Simple Features)
For features with < 5 tasks or complex dependencies:
```bash
for i in {001..005}; do
  create_task_file "$i" "$TASK_DETAILS"
done
```

### Parallel Mode (Complex Features)
For features with 5+ independent tasks:

```yaml
# Prepare task batches
BATCH_1_TASKS="001-003: Database layer tasks"
BATCH_2_TASKS="004-006: API layer tasks"
BATCH_3_TASKS="007-009: UI layer tasks"

# Spawn parallel agents
Task:
  description: "Create database layer tasks"
  subagent_type: "general-purpose"
  prompt: |
    Create task files for: $ARGUMENTS
    Batch: Database layer (001-003)

    For each task:
    1. Create: .claude/tracking/implementations/$ARGUMENTS/{number}.md
    2. Use exact task format with all sections
    3. Set dependencies and parallel flags
    4. Include acceptance criteria and testing

    Task Details: [specific tasks for this batch]

    Return: Created files list
```

Display progress:
```
🚀 Parallel Task Creation:
├─ Agent 1: Database tasks (001-003) ⏳
├─ Agent 2: API tasks (004-006) ⏳
└─ Agent 3: UI tasks (007-009) ⏳
```
</task_creation>

## 5. Task File Format
<task_format>
Each task must follow this exact structure:

```markdown
---
name: [Descriptive Task Title]
status: open
created: $CURRENT_DATETIME
updated: $CURRENT_DATETIME
github: [Will be updated during sync]
depends_on: []  # e.g., [001, 002]
parallel: true  # or false
conflicts_with: []  # e.g., [003, 004]
type: task
agent: [specialist-name]  # Optional: preferred agent
effort: S  # XS/S/M/L/XL
hours: 4  # Estimated hours
---

# Task: [Task Title]

## Description
Clear, concise description of what needs to be done

## Acceptance Criteria
- [ ] Specific, measurable criterion 1
- [ ] Specific, measurable criterion 2
- [ ] Specific, measurable criterion 3

## Technical Details
### Implementation Approach
- Step-by-step technical approach
- Key design decisions

### Files to Modify
- `path/to/file1.ts` - Description of changes
- `path/to/file2.tsx` - Description of changes

### New Files to Create
- `path/to/newfile.ts` - Purpose and structure

## Dependencies
### Task Dependencies
- [ ] Task [number] - Description

### External Dependencies
- [ ] Library/service requirements

## Testing Requirements
### Unit Tests
- Test file paths and coverage goals

### Integration Tests
- Specific integration test scenarios

### Manual Testing
- User acceptance test steps

## Definition of Done
- [ ] Code implemented and working
- [ ] Tests written and passing (coverage > 80%)
- [ ] Documentation updated
- [ ] Code reviewed and approved
- [ ] No linting or type errors
```

### Effort Sizing Guidelines
- **XS (1-2 hours)**: Config changes, minor updates
- **S (2-4 hours)**: Single component, simple endpoint
- **M (4-8 hours)**: Feature component, complex logic
- **L (1-2 days)**: Major feature, multiple components
- **XL (2-3 days)**: Complex system, extensive testing
</task_format>

## 6. Dependency Validation
<dependency_validation>
After creating all tasks:

```bash
# Build dependency graph
DEPENDENCY_GRAPH=""
for task in .claude/tracking/implementations/$ARGUMENTS/[0-9][0-9][0-9].md; do
  TASK_NUM=$(basename "$task" .md)
  DEPS=$(grep "depends_on:" "$task" | sed 's/depends_on: //')
  DEPENDENCY_GRAPH+="$TASK_NUM: $DEPS\n"
done

# Check for circular dependencies
# Validate all referenced tasks exist
# Ensure dependency chains are achievable

# If issues found:
echo "⚠️ Dependency validation warnings:"
echo "- Circular dependency: 003 → 005 → 003"
echo "- Missing dependency: 007 references non-existent 010"
```
</dependency_validation>

## 7. Plan Update & Summary
<plan_update>
Update the implementation plan with task summary:

```markdown
## Tasks Created
- [ ] 001 - Database Schema Setup (parallel: true, effort: S, 4h)
- [ ] 002 - API Endpoints (parallel: true, effort: M, 6h)
- [ ] 003 - UI Components (parallel: true, effort: M, 8h)
[... all tasks ...]

### Execution Summary
- **Total Tasks**: 12
- **Parallel Tasks**: 8 (can run simultaneously)
- **Sequential Tasks**: 4 (must run in order)
- **Total Effort**: 48 hours
- **Optimal Execution Time**: 16 hours (with 3 agents)

### Suggested Execution Order
**Batch 1** (Immediate start):
- Tasks 001, 002, 003 (Foundation)

**Batch 2** (After Batch 1):
- Tasks 004, 005, 006 (Core features)

**Batch 3** (Final):
- Tasks 007, 008 (Integration & testing)
```
</plan_update>

## 8. Output & Next Steps
<output>
Display final summary:

```
✅ Created 12 tasks for feature: $ARGUMENTS

📊 Task Breakdown:
├─ Parallel tasks: 8 (66%)
├─ Sequential tasks: 4 (34%)
├─ Total effort: 48 hours
└─ Optimal execution: 16 hours (3 agents)

📁 Files created:
└─ .claude/tracking/implementations/$ARGUMENTS/
   ├─ 001.md through 012.md
   └─ plan.md (updated)

🚀 Next steps:
1. Review tasks: ls .claude/tracking/implementations/$ARGUMENTS/*.md
2. Sync to GitHub: /feature:sync $ARGUMENTS
3. Start execution: /feature:start $ARGUMENTS
```
</output>
</instructions>

<patterns>
### Parallel Execution Patterns
- **Independent Layers**: Database, API, UI can often parallelize
- **Test Parallelization**: Unit tests can run alongside feature code
- **Documentation**: Can be written in parallel with implementation

### Task Sizing Patterns
- **Prefer S/M Tasks**: Easier to parallelize and track
- **Split XL Tasks**: Break down into smaller, manageable pieces
- **Group Tiny Tasks**: Combine XS tasks when related
</patterns>

<error_handling>
### Common Issues
1. **Plan Not Found**: Ensure /feature:plan was run first
2. **Circular Dependencies**: Review and restructure task dependencies
3. **File Conflicts**: Use conflicts_with field to prevent parallel issues
4. **Agent Timeouts**: Reduce batch size or simplify task creation

### Recovery Procedures
```bash
# Clean up partial task creation
rm .claude/tracking/implementations/$ARGUMENTS/[0-9][0-9][0-9].md

# Verify clean state
ls .claude/tracking/implementations/$ARGUMENTS/

# Restart decomposition
/feature:decompose $ARGUMENTS
```
</error_handling>

<help>
📋 **Feature Decompose - Task Breakdown for Parallel Execution**

Break implementation plans into concrete, parallelizable tasks optimized for multi-agent execution.

**Usage:**
- `/feature:decompose <feature_name>` - Create task breakdown

**Process:**
1. Validates implementation plan exists
2. Analyzes for parallelization opportunities
3. Creates numbered task files with dependencies
4. Updates plan with execution summary

**Requirements:**
- Implementation plan must exist (create with /feature:plan)
- Write access to .claude/tracking/implementations/

Ready to decompose your feature into optimized tasks!
</help>