# Claude Code Commands

Organized command structure for Claude Code slash commands.

## Directory Structure

```
.claude/commands/
├── core/               # Essential daily operations
├── features/           # Feature development workflow (numbered for order)
├── testing/            # Test generation commands
├── development/        # Development tools & debugging
├── deployment/         # CI/CD & deployment commands
├── project/            # Project & task management
├── infrastructure/     # System & infrastructure management
├── meta/              # Commands for managing commands & system
└── _archive/          # Archived backup files
```

## Command Reference

### Core Commands
Essential daily development operations

| Command | Description |
|---------|-------------|
| `/core/test` | Execute comprehensive test suites |
| `/core/codecheck` | Code quality validation with auto-fix |
| `/core/code-review` | Multi-aspect code review with parallel agents |
| `/core/git/commit` | Intelligent git commits with validation |
| `/core/git/push` | Safe git push with conflict resolution |
| `/core/git/checkout` | Create/switch branches with conventions |
| `/core/git/status` | Analyze repository state with insights |

### Feature Development
End-to-end feature development workflow (use in order)

| Phase | Command | Description |
|-------|---------|-------------|
| 1 | `/feature/1-discover` | Adaptive discovery process for new features |
| 1 | `/feature/1-spec` | Create comprehensive feature specifications |
| 2 | `/features/2-plan` | Convert spec to technical implementation plan |
| 2 | `/feature/2-analyze` | Identify parallel work streams |
| 3 | `/feature/3-decompose` | Break plans into parallelizable tasks |
| 3 | `/feature/3-sync` | Push plan and tasks to GitHub |
| 4 | `/feature/4-start` | Launch parallel agents for execution |
| 4 | `/feature/4-status` | Check implementation status |
| 4 | `/feature/4-update` | Post progress updates to GitHub |

### Testing Commands
Test generation and discovery

| Command | Description |
|---------|-------------|
| `/testing/unit-test-writer` | Generate Vitest unit tests |
| `/testing/integration-test-writer` | Create integration tests |
| `/testing/e2e-test-writer` | Generate Playwright E2E tests |
| `/testing/test-discovery` | Identify missing test coverage |

### Development Tools
Development environment and debugging

| Command | Description |
|---------|-------------|
| `/development/debug-issue` | Debug GitHub issues with parallel experts |
| `/workflow` | Execute professional workflows |
| `/development/cleanup` | Clean debug files and artifacts |
| **Checkpoints** | |
| `/development/checkpoints/create` | Save current work state |
| `/development/checkpoints/list` | View available checkpoints |
| `/development/checkpoints/restore` | Restore to checkpoint |
| **Worktrees** | |
| `/development/worktrees/new-worktree` | Create isolated git worktree |
| `/development/worktrees/change-worktree` | Switch to different worktree |
| `/development/worktrees/remove-worktree` | Remove worktree safely |

### Deployment Commands
CI/CD and environment management

| Command | Description |
|---------|-------------|
| `/deployment/cicd-debug` | Investigate CI/CD failures |
| `/deployment/promote-staging` | Deploy to staging environment |
| `/deployment/promote-production` | Zero-downtime production deployment |

### Project Management
Task and issue management

| Command | Description |
|---------|-------------|
| `/project/do-task` | Execute GitHub task implementation |
| `/project/log-issue` | Create comprehensive issue reports |
| `/project/log-task` | Create task specifications |
| `/project/research` | Conduct comprehensive research |

### Infrastructure
System configuration and maintenance

| Command | Description |
|---------|-------------|
| `/infrastructure/db-healthcheck` | Database health assessment |
| `/infrastructure/config/bash-timeout` | Configure command timeouts |
| `/infrastructure/updates/payload` | Update Payload CMS |
| `/infrastructure/updates/update-makerkit` | Sync Makerkit upstream |

### Meta Commands
Commands for managing the command system

| Category | Command | Description |
|----------|---------|-------------|
| **Commands** | | |
| | `/meta/commands/new` | Create new slash commands |
| | `/meta/commands/enhance` | Enhance existing commands |
| **Subagents** | | |
| | `/meta/subagents/create` | Create specialized subagents |
| | `/meta/subagents/modify` | Modify existing subagents |
| **Context** | | |
| | `/meta/context/create` | Create/modify context files |
| | `/meta/context/sync-inventory` | Sync context inventory |
| **Optimization** | | |
| | `/meta/claude-md-optimizer` | Optimize CLAUDE.md files |

## Usage Tips

1. **Feature Development**: Use the numbered feature commands in sequence (1-4)
2. **Daily Development**: Core commands are your most frequently used tools
3. **Testing**: Generate tests after implementing features
4. **Debugging**: Use `/development/debug-issue` for systematic debugging
5. **Meta Commands**: Use these to improve the command system itself

## Quick Start Examples

### Starting a New Feature
```bash
/feature/1-spec my-feature    # Create specification
/features/2-plan my-feature   # Create implementation plan
/feature/3-decompose my-feature # Break into tasks
/feature/3-sync my-feature    # Push to GitHub
/feature/4-start my-feature   # Execute implementation
```

### Daily Development Flow
```bash
/core/git/checkout feature/new-thing  # Create branch
# ... make changes ...
/core/codecheck                       # Validate code
/core/test                           # Run tests
/core/git/commit                     # Commit changes
/core/git/push                       # Push to remote
```

### Managing Work State
```bash
/development/checkpoints/create       # Save current state
/core/git/checkout main              # Switch branches
# ... do other work ...
/development/checkpoints/restore 0    # Return to saved state
```

## Maintenance

- **Backup files**: Automatically archived to `_archive/`
- **Command inventory**: Updated via `/home/msmith/projects/2025slideheroes/.claude/scripts/inventories/sync-command-inventory.cjs`
- **Adding commands**: Use `/meta/commands/new`
- **Enhancing commands**: Use `/meta/commands/enhance`