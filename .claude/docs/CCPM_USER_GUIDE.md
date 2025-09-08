# CCPM User Guide - Feature-Centric Workflow

**Version**: 1.0
**Updated**: 2025-09-08
**Audience**: Development Team

## Table of Contents

1. [Quick Start](#quick-start)
2. [Core Concepts](#core-concepts)
3. [Command Reference](#command-reference)
4. [Workflow Examples](#workflow-examples)
5. [Parallel Execution](#parallel-execution)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

---

## Quick Start

### Your First Feature in 5 Steps

```bash
# 1. Create a feature specification
/feature:spec user-profile-page

# 2. Convert to implementation plan
/feature:plan user-profile-page

# 3. Break down into tasks
/feature:decompose user-profile-page

# 4. Sync to GitHub (creates issues)
/feature:sync user-profile-page

# 5. Execute with parallel agents
/feature:start user-profile-page
```

That's it! Your feature is now being implemented by specialized agents working in parallel.

---

## Core Concepts

### What is CCPM?

**Claude Code Project Management (CCPM)** is a structured workflow that:
- Transforms feature ideas into executable tasks
- Persists context in GitHub for unlimited memory
- Executes work in parallel using specialized agents
- Reduces feature delivery time by 3x

### Key Terms

| Term | Definition | Example |
|------|------------|---------|
| **Feature Specification** | High-level description of what to build | "Add dark mode toggle" |
| **Implementation Plan** | Technical approach and architecture | "Use React Context for state" |
| **Task** | Atomic unit of work | "Create theme provider component" |
| **Parallel Stream** | Independent work that runs simultaneously | "UI, Backend, Database" |
| **Agent** | Specialized AI assistant | "react-expert", "css-expert" |

### The Three-Stage Workflow

```
📋 SPECIFICATION → 🔨 IMPLEMENTATION → ✅ EXECUTION
      (What)            (How)            (Do)
```

1. **Specification Stage**: Define the problem and success criteria
2. **Implementation Stage**: Design the technical solution
3. **Execution Stage**: Build with parallel agents

---

## Command Reference

### Core Commands

#### `/feature:spec <name>`
Creates a feature specification document.

```bash
/feature:spec dark-mode-toggle

# Creates: .claude/specs/dark-mode-toggle.md
# Contains: Problem, goals, success criteria, user stories
```

#### `/feature:plan <name>`
Converts specification into technical implementation plan.

```bash
/feature:plan dark-mode-toggle

# Creates: .claude/implementations/dark-mode-toggle/plan.md
# Contains: Architecture, phases, technical decisions
```

#### `/feature:decompose <name>`
Breaks implementation into executable tasks.

```bash
/feature:decompose dark-mode-toggle

# Creates: .claude/implementations/dark-mode-toggle/001.md, 002.md, etc.
# Contains: Individual task specifications with dependencies
```

#### `/feature:sync <name>`
Pushes feature and tasks to GitHub as issues.

```bash
/feature:sync dark-mode-toggle

# Creates: GitHub issues with proper labels and relationships
# Updates: Task files with issue numbers
```

#### `/feature:start <name>`
Launches parallel execution with multiple agents.

```bash
/feature:start dark-mode-toggle

# Launches: Multiple specialized agents working in parallel
# Returns: Progress updates and results
```

### Status Commands

#### `/feature:status <name>`
Check implementation progress.

```bash
/feature:status dark-mode-toggle

# Shows: Task completion status, blockers, next steps
```

#### `/feature:update <name>`
Post progress update to GitHub.

```bash
/feature:update dark-mode-toggle

# Updates: GitHub issue with current progress
```

### Analysis Commands

#### `/feature:analyze <name>`
Analyze parallelization opportunities.

```bash
/feature:analyze dark-mode-toggle

# Shows: Which tasks can run in parallel, time savings
```

---

## Workflow Examples

### Example 1: Simple Feature (Authentication)

```bash
# Step 1: Specify what we're building
/feature:spec user-authentication
# -> Describe login, logout, session management

# Step 2: Create technical plan
/feature:plan user-authentication
# -> Design auth flow, JWT strategy, security

# Step 3: Break into tasks
/feature:decompose user-authentication
# -> Creates 5 tasks: auth context, login form, API routes, etc.

# Step 4: Sync to GitHub
/feature:sync user-authentication
# -> Creates GitHub issues #101-#105

# Step 5: Execute in parallel
/feature:start user-authentication
# -> 3 agents work simultaneously on frontend, backend, database
```

### Example 2: Complex Feature (Real-time Chat)

```bash
# More complex features benefit even more from parallelization

/feature:spec realtime-chat
/feature:plan realtime-chat
/feature:decompose realtime-chat
# -> Creates 12 tasks across multiple components

/feature:analyze realtime-chat
# -> Identifies 8 tasks can run in parallel (4x speedup)

/feature:sync realtime-chat
/feature:start realtime-chat
# -> 5 agents work on: WebSocket server, UI, Database, State, Tests
```

### Example 3: Bug Fix (Sequential Work)

```bash
# Not everything benefits from parallelization

/feature:spec fix-payment-calculation
/feature:plan fix-payment-calculation
/feature:decompose fix-payment-calculation
# -> Creates 2 sequential tasks (fix bug, add tests)

/feature:analyze fix-payment-calculation
# -> Reports: "Limited parallelization opportunity"

# In this case, might be better to use traditional approach
/do-task fix-payment-calculation
```

---

## Parallel Execution

### How It Works

```
Traditional (Sequential):
Task 1 (2hr) → Task 2 (2hr) → Task 3 (2hr) = 6 hours

Parallel:
Task 1 (2hr) ─┐
Task 2 (2hr) ─┼─ = 2 hours (3x faster!)
Task 3 (2hr) ─┘
```

### Parallelization Rules

#### ✅ CAN Run in Parallel
- Different files/components
- Independent features
- Separate test suites
- Documentation updates
- Style/CSS changes

#### ❌ CANNOT Run in Parallel
- Same file modifications
- Dependent state changes
- Sequential business logic
- Database migrations (usually)
- Integration points

### Agent Specialization

| Task Type | Best Agent | Parallel Safe |
|-----------|------------|---------------|
| React Components | react-expert | ✅ Yes |
| CSS/Styling | css-styling-expert | ✅ Yes |
| API Routes | nodejs-expert | ✅ Yes |
| Database Schema | database-expert | ⚠️ Usually |
| State Management | react-expert | ❌ No |
| Authentication | nodejs-expert | ❌ No |

### Monitoring Parallel Execution

```bash
# Check progress of parallel execution
/feature:status my-feature

# Output:
┌─────────────────────────────────────┐
│ Feature: my-feature                 │
│ Status: IN PROGRESS                 │
├─────────────────────────────────────┤
│ Stream 1 (UI):       ████████░░ 80% │
│ Stream 2 (Backend):  ██████░░░░ 60% │
│ Stream 3 (Database): ████████ 100%  │
└─────────────────────────────────────┘
```

---

## Best Practices

### 1. Feature Specification

#### ✅ DO
- Be specific about success criteria
- Include user stories
- Define scope clearly
- List non-goals explicitly

#### ❌ DON'T
- Leave requirements vague
- Skip acceptance criteria
- Include implementation details
- Mix multiple features

### 2. Task Decomposition

#### ✅ DO
- Keep tasks under 4 hours
- Minimize dependencies
- Group by component/layer
- Specify file ownership

#### ❌ DON'T
- Create giant tasks
- Have circular dependencies
- Mix concerns in one task
- Share files between parallel tasks

### 3. Parallel Execution

#### ✅ DO
- Review parallelization analysis
- Monitor progress regularly
- Handle conflicts promptly
- Test integration points

#### ❌ DON'T
- Force parallelization
- Ignore dependency warnings
- Skip integration testing
- Modify shared files simultaneously

### 4. GitHub Integration

#### ✅ DO
- Keep issues updated
- Use proper labels
- Link related issues
- Close completed tasks

#### ❌ DON'T
- Create duplicate issues
- Leave issues stale
- Skip progress updates
- Ignore GitHub comments

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Agents are conflicting on the same file"

**Solution**: Stop execution, redesign tasks to avoid file overlap:
```bash
# Stop current execution
/feature:stop my-feature

# Redesign tasks
/feature:decompose my-feature --redesign

# Restart with better separation
/feature:start my-feature
```

#### Issue: "Feature is too complex to parallelize"

**Solution**: Break into smaller features:
```bash
# Instead of one giant feature
/feature:spec entire-dashboard

# Break into multiple features
/feature:spec dashboard-layout
/feature:spec dashboard-widgets
/feature:spec dashboard-analytics
```

#### Issue: "GitHub sync failed"

**Solution**: Check authentication and retry:
```bash
# Verify GitHub CLI is authenticated
gh auth status

# If not authenticated
gh auth login

# Retry sync
/feature:sync my-feature
```

#### Issue: "Agent got stuck or produced errors"

**Solution**: Check status and restart specific task:
```bash
# Check which task failed
/feature:status my-feature

# Restart specific task
/do-task 003  # Restart task 003
```

---

## FAQ

### Q: When should I use CCPM vs traditional development?

**Use CCPM when:**
- Building new features (4+ hours)
- Multiple components involved
- Clear separation possible
- Time is critical

**Use traditional when:**
- Quick bug fixes (<2 hours)
- Single file changes
- Heavy interdependencies
- Exploratory work

### Q: How do I handle dependencies between tasks?

Tasks specify dependencies in their frontmatter:
```yaml
Dependencies: [001, 002]  # This task depends on 001 and 002
Parallel: false           # Cannot run in parallel
```

The system automatically respects these when parallelizing.

### Q: Can I modify the generated tasks?

Yes! Tasks are just markdown files. Edit them before running:
```bash
# Edit task file
edit .claude/implementations/my-feature/003.md

# Then execute
/feature:start my-feature
```

### Q: What happens if parallel execution fails?

The system is resilient:
1. Other parallel streams continue
2. Failed task is marked as blocked
3. You're notified of the issue
4. Can restart individual tasks

### Q: How do I add tasks to an existing feature?

```bash
# Add new task manually
edit .claude/implementations/my-feature/005.md

# Or re-decompose
/feature:decompose my-feature --append

# Sync new tasks to GitHub
/feature:sync my-feature
```

### Q: Can I use this with existing GitHub issues?

Yes, you can import:
```bash
# Import existing issue as feature
/feature:import --issue 123

# This creates local spec/plan from GitHub issue
```

---

## Advanced Topics

### Custom Agent Mapping

Override default agent selection:
```yaml
# In task file frontmatter
Agent: typescript-expert  # Instead of default
```

### Conditional Parallelization

```yaml
# In task file
Parallel: 
  with: [001, 002]      # Can run with these
  not_with: [003]       # But not with this
```

### Performance Tuning

```bash
# Analyze before execution
/feature:analyze my-feature --detailed

# Shows:
# - Optimal parallelization strategy
# - Predicted time savings
# - Potential conflicts
# - Resource requirements
```

---

## Getting Help

### Resources

1. **This Guide**: `.claude/docs/CCPM_USER_GUIDE.md`
2. **Command Help**: `/help feature:*`
3. **Examples**: `.claude/examples/features/`
4. **Team Chat**: #ccpm-help channel

### Support Process

1. Check this guide
2. Try `/feature:status` for current state
3. Review error messages
4. Ask team for help
5. Create issue if bug found

---

## Appendix: Command Cheat Sheet

```bash
# Full Feature Workflow
/feature:spec <name>        # Create specification
/feature:plan <name>        # Create implementation plan
/feature:decompose <name>   # Break into tasks
/feature:sync <name>        # Push to GitHub
/feature:start <name>       # Execute in parallel

# Status and Monitoring
/feature:status <name>      # Check progress
/feature:update <name>      # Update GitHub
/feature:analyze <name>     # Analyze parallelization

# Task Execution
/do-task <number>          # Execute specific task
/task:in-progress <number> # Mark as in progress
/task:complete <number>    # Mark as complete
/task:blocked <number>     # Mark as blocked

# Utilities
/feature:list              # List all features
/feature:import --issue N  # Import from GitHub
/feature:archive <name>    # Archive completed feature
```

---

**Remember**: The goal is to ship features faster with higher quality. CCPM is a tool to achieve that - use it when it helps, skip it when it doesn't.

*Happy parallel coding! 🚀*