# Existing Commands Inventory
Last Updated: 2025-09-05T22:30:00Z
Version: 2.0.0 (Post-CCPM Integration)

## Total Commands: 43

## Command Categories

### Agent Management (4 commands)
- `/agents-md/cli` - CLI agent operations
- `/agents-md/init` - Initialize agent environment
- `/agents-md/migration` - Migrate agent configurations
- `/create-subagent` - Create new specialized agent

### Feature Development (8 commands) - **NEW**
- `/feature/spec` - Create comprehensive feature specification
- `/feature/plan` - Convert specification to technical implementation plan
- `/feature/decompose` - Break implementation into executable tasks
- `/feature/sync` - Push feature and tasks to GitHub as issues
- `/feature/start` - Launch parallel agents for task execution
- `/feature/status` - Check feature implementation progress
- `/feature/update` - Update feature specification or plan
- `/feature/discover` - Run discovery phase for new features

### Development Workflow (5 commands)
- `/code-review` - Perform code review
- `/codecheck` - Check code quality
- `/write-tests` - Generate test cases
- `/validate-and-fix` - Validate and fix code issues
- `/workflow` - General workflow management

### Git Operations (4 commands)
- `/git/checkout` - Checkout branches
- `/git/commit` - Create commits
- `/git/push` - Push to remote
- `/git/status` - Check git status

### Checkpoint Management (3 commands)
- `/checkpoint/create` - Create project checkpoint
- `/checkpoint/list` - List available checkpoints
- `/checkpoint/restore` - Restore from checkpoint

### Task & Issue Management (4 commands)
- `/do-task` - Execute task from specification
- `/log-task` - Log new task to GitHub
- `/log-issue` - Log issue to tracking system
- `/research` - Conduct research on topics

### Specification Management (4 commands)
- `/spec/create` - Create specification
- `/spec/decompose` - Decompose specification
- `/spec/execute` - Execute specification
- `/spec/validate` - Validate specification

### CI/CD & Deployment (4 commands)
- `/cicd-debug` - Debug CI/CD issues
- `/pr` - Create pull request
- `/promote-to-staging` - Promote to staging environment
- `/promote-to-production` - Promote to production

### Infrastructure & Configuration (4 commands)
- `/db-healthcheck` - Database health check
- `/config/bash-timeout` - Configure bash timeout
- `/dev/cleanup` - Clean development environment
- `/update-makerkit` - Update MakerKit dependencies

### Debugging & Testing (2 commands)
- `/debug-issue` - Debug specific issues
- `/test` - Run tests

### Utilities (1 command)
- `/create-command` - Create new command

## Recent Changes & Deprecations

### Deprecated Commands (v2.0.0)
- **`/build-feature`** - Replaced by modular `/feature/*` commands
  - Migration: Use `/feature/spec` → `/feature/plan` → `/feature/decompose` workflow

### New in v2.0.0 (CCPM Integration)
- Complete `/feature/*` command suite for enhanced workflow management
- GitHub synchronization capabilities
- Parent-child task relationships
- Parallel agent execution framework

## Integration Notes

### CCPM Integration Features
The new `/feature/*` commands provide:
1. **Structured Workflow**: spec → plan → decompose → sync → start
2. **GitHub Integration**: Direct synchronization with GitHub issues
3. **Parallel Execution**: Multi-agent task execution capability
4. **Progress Tracking**: Real-time status monitoring

### Relationship with `/spec/*` Commands
- `/spec/*` commands remain for standalone specification management
- `/feature/*` commands provide end-to-end feature development workflow
- Both can be used independently based on needs

## Command Usage Patterns

### For Feature Development
```bash
/feature/spec <name>      # Create specification
/feature/plan <name>      # Technical planning
/feature/decompose <name> # Task breakdown
/feature/sync <name>      # GitHub sync
/feature/start <name>     # Parallel execution
```

### For Quick Tasks
```bash
/do-task <specification>  # Single task execution
/log-issue <description>  # Issue tracking
```

## Infrastructure Preserved
- All 43 commands remain functional
- Current agent architecture (40+ agents)
- Existing hooks and configurations
- Current git workflow commands

## Command Count Summary
- **Total Commands**: 43
- **New Commands**: 8 (`/feature/*` suite)
- **Deprecated Commands**: 1 (`/build-feature`)
- **Categories**: 10

---
*Note: This inventory is manually maintained. Run a command audit periodically to ensure accuracy.*