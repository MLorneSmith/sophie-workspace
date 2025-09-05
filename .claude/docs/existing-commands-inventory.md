# Existing Commands Inventory
Generated: 2025-09-05

## Total Commands: 36

## Command Categories

### Agent Management
- `/agents-md/cli` - CLI agent operations
- `/agents-md/init` - Initialize agent environment
- `/agents-md/migration` - Migrate agent configurations
- `/create-subagent` - Create new specialized agent

### Development Workflow
- `/build-feature` - Build feature implementation
- `/code-review` - Perform code review
- `/codecheck` - Check code quality
- `/write-tests` - Generate test cases
- `/validate-and-fix` - Validate and fix code issues
- `/workflow` - General workflow management

### Git Operations
- `/git/checkout` - Checkout branches
- `/git/commit` - Create commits
- `/git/push` - Push to remote
- `/git/status` - Check git status

### Checkpoint Management
- `/checkpoint/create` - Create project checkpoint
- `/checkpoint/list` - List available checkpoints
- `/checkpoint/restore` - Restore from checkpoint

### Task Management
- `/do-task` - Execute task from specification
- `/log-task` - Log new task to GitHub
- `/log-issue` - Log issue to tracking system
- `/research` - Conduct research on topics

### Specification Management (Existing)
- `/spec/create` - Create specification
- `/spec/decompose` - Decompose specification
- `/spec/execute` - Execute specification
- `/spec/validate` - Validate specification

### CI/CD & Deployment
- `/cicd-debug` - Debug CI/CD issues
- `/pr` - Create pull request
- `/promote-to-staging` - Promote to staging environment
- `/promote-to-production` - Promote to production

### Infrastructure & Config
- `/db-healthcheck` - Database health check
- `/config/bash-timeout` - Configure bash timeout
- `/dev/cleanup` - Clean development environment
- `/update-makerkit` - Update MakerKit dependencies

### Debugging & Testing
- `/debug-issue` - Debug specific issues
- `/test` - Run tests

### Utilities
- `/create-command` - Create new command

## Integration Notes

The existing `/spec/*` commands already provide some specification functionality. The CCPM integration will:
1. Enhance these with `/feature:*` namespace to avoid conflicts
2. Add GitHub synchronization capabilities
3. Introduce parent-child task relationships
4. Enable parallel agent execution framework

## Existing Infrastructure to Preserve
- All 36 existing commands must remain functional
- Current agent architecture (40+ agents)
- Existing hooks and configurations
- Current git workflow commands