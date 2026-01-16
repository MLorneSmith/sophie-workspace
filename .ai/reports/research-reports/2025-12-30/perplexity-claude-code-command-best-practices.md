# Perplexity Research: Claude Code CLI Command Best Practices

**Date**: 2025-12-30
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro) + Search API

## Query Summary

Researched best practices for writing Claude Code CLI custom commands, focusing on:
- Command design patterns and conventions
- Prompt structure in commands
- Parameterization best practices
- Reusability and maintainability
- Common mistakes to avoid
- Team organization patterns
- MCP server integration

## Key Findings

### 1. Command Design Patterns and Conventions

#### File Structure
Custom slash commands are stored as Markdown files in specific locations:

| Scope | Location | Prefix in Help |
|-------|----------|----------------|
| Project commands | `.claude/commands/` | (project) |
| Personal commands | `~/.claude/commands/` | (user) |

**Namespacing**: Use subdirectories to organize commands. For example:
- `.claude/commands/frontend/component.md` creates `/component` with description "(project:frontend)"
- `.claude/commands/backend/test.md` creates `/test` with description "(project:backend)"

Commands in different subdirectories can share names since the subdirectory distinguishes them.

#### Single Responsibility
Each command should have one well-defined purpose rather than attempting multiple operations. This follows the Unix philosophy of "do one thing well."

### 2. Effective Prompt Structure in Commands

#### Use Frontmatter for Metadata
```markdown
---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*)
argument-hint: [message]
description: Create a git commit
model: claude-3-5-haiku-20241022
---

Create a git commit with message: $ARGUMENTS
```

**Available Frontmatter Options**:
| Key | Purpose | Default |
|-----|---------|---------|
| `allowed-tools` | List of tools the command can use | Inherits from conversation |
| `argument-hint` | Arguments hint shown during autocomplete | None |
| `description` | Brief command description (shows in /help) | First line of prompt |
| `model` | Specific model to use | Inherits from conversation |
| `disable-model-invocation` | Prevent SlashCommand tool from calling this | false |

#### Include Context with @ and ! Prefixes
- **File references** (`@`): Include file contents directly
  ```markdown
  Review the implementation in @src/utils/helpers.js
  Compare @src/old-version.js with @src/new-version.js
  ```

- **Bash command execution** (`!`): Run bash commands and include output
  ```markdown
  ## Context
  - Current git status: !`git status`
  - Current branch: !`git branch --show-current`
  - Recent commits: !`git log --oneline -10`
  ```

#### Trigger Extended Thinking
Include thinking keywords to allocate more computation:
- "think" < "think hard" < "think harder" < "ultrathink"

Each level allocates progressively more thinking budget.

### 3. Parameterization Best Practices

#### All Arguments with $ARGUMENTS
Captures everything after the command:
```markdown
# fix-issue.md
Fix issue #$ARGUMENTS following our coding standards

# Usage: /fix-issue 123 high-priority
# $ARGUMENTS becomes: "123 high-priority"
```

#### Positional Arguments ($1, $2, etc.)
For structured commands with specific parameters:
```markdown
---
argument-hint: [pr-number] [priority] [assignee]
description: Review pull request
---
Review PR #$1 with priority $2 and assign to $3.
Focus on security, performance, and code style.
```

### 4. Reusability and Maintainability Tips

#### Keep CLAUDE.md Files Concise
- Document common bash commands
- Core files and utility functions
- Code style guidelines
- Testing instructions
- Repository etiquette

**Example CLAUDE.md**:
```markdown
# Bash commands
- npm run build: Build the project
- npm run typecheck: Run the typechecker

# Code style
- Use ES modules (import/export) syntax, not CommonJS
- Destructure imports when possible

# Workflow
- Be sure to typecheck after code changes
- Prefer running single tests for performance
```

#### Iterate on Command Prompts
Treat command prompts like any frequently used prompt:
- Test with different inputs
- Tune instructions (add emphasis with "IMPORTANT" or "YOU MUST")
- Run through prompt improver periodically
- Commit changes so team benefits

#### Use the # Key for Quick Memory
Press `#` to give Claude an instruction it will automatically incorporate into the relevant CLAUDE.md.

### 5. Common Mistakes to Avoid

| Mistake | Solution |
|---------|----------|
| **Negative-only constraints** | Specify what *should* be done, not just what to avoid |
| **Extensive untested content** | Iterate on effectiveness, don't just add content |
| **Skipping planning phase** | Ask Claude to make a plan before coding |
| **Large monolithic changes** | Keep diffs to 100-200 lines maximum |
| **Out-of-sync state** | Refresh files in context, sync branch before changes |
| **Vague descriptions** | Include concrete output specifications and examples |
| **Hardcoded paths** | Use parameters for flexibility |

### 6. Team Organization Patterns

#### Hierarchical Command Organization
```
.claude/
├── commands/
│   ├── frontend/
│   │   ├── component.md
│   │   └── test.md
│   ├── backend/
│   │   ├── api.md
│   │   └── test.md
│   ├── deploy/
│   │   ├── staging.md
│   │   └── production.md
│   └── shared/
│       ├── commit.md
│       └── review.md
└── settings.json
```

#### Version Control Best Practices
- Check commands into git for team sharing
- Use `.claude/settings.local.json` for personal/sensitive settings
- Include CLAUDE.md changes in commits

#### Recommended Command Categories
- **Development**: setup-dev, clean-build, update-deps
- **Testing**: test-coverage, test-ci, test-performance
- **Deployment**: deploy-staging, rollback, health-check
- **Git**: commit, review-pr, fix-issue
- **Analysis**: analyze-code, security-review, optimize

### 7. MCP Server Integration

#### Configuration Scopes
| Scope | Use Case |
|-------|----------|
| Local (default) | Sensitive credentials, testing |
| Project (.mcp.json) | Team sharing via version control |
| Global (~/.claude.json) | Broadly needed tools only |

#### Adding MCP Servers
```bash
# Local executable
claude mcp add myserver -- npx server

# Python server with env
claude mcp add myserver --env KEY=value -- python server.py --port 8080

# HTTP remote server
claude mcp add --transport http --scope local my-mcp-server \
  https://your-mcp-server.com \
  --env API_KEY="your-api-key" \
  --header "API_Key: ${API_KEY}"
```

#### Using MCP Tools in Commands
- Start session with `claude`
- Connect via `/mcp` to list/browse available tools
- Reference tools in prompts naturally
- MCP tools appear in allowed-tools frontmatter as `mcp__server__tool_name`

#### Best Practices for MCP
- Use local scope for dev/experiments with secrets
- Use project scope for team collaboration
- Implement dev/prod environment separation via scopes
- Test permissions and verify connections

### 8. Advanced Command Patterns

#### Complete Workflow Command Example
```markdown
---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*)
description: Create a git commit
---

## Context
- Current git status: !`git status`
- Current git diff (staged and unstaged changes): !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -10`

## Your task
Based on the above changes, create a single git commit.
```

#### GitHub Issue Fix Command
```markdown
---
argument-hint: <issue-number>
description: Fix a GitHub issue
allowed-tools: Bash(gh issue view:*), Read, Write, Bash(git:*)
---

1. Fetch issue #$ARGUMENTS details using: gh issue view $ARGUMENTS
2. Analyze the issue requirements
3. Find relevant files in the codebase
4. Implement the fix following our coding standards
5. Write tests for the fix
6. Create a commit with conventional format
```

## Sources & Citations

1. [Claude Code: Best practices for agentic coding - Anthropic](https://www.anthropic.com/engineering/claude-code-best-practices)
2. [Slash commands - Claude Code Docs](https://code.claude.com/docs/en/slash-commands)
3. [Claude Code CLI Cheatsheet - Shipyard](https://shipyard.build/blog/claude-code-cheat-sheet/)
4. [How I use Claude Code - Builder.io](https://www.builder.io/blog/claude-code)
5. [Claude Code: Best Practices and Pro Tips - htdocs](https://htdocs.dev/posts/claude-code-best-practices-and-pro-tips/)
6. [Your complete guide to slash commands Claude Code - eesel AI](https://www.eesel.ai/blog/slash-commands-claude-code)
7. [Claude Code Tutorial #6 - Slash Commands (Video)](https://www.youtube.com/watch?v=52KBhQqqHuc)
8. [Custom Commands - claudecode101.com](https://www.claudecode101.com/en/tutorial/tools-integration/custom-commands)

## Key Takeaways

1. **Structure commands as Markdown files** in `.claude/commands/` (project) or `~/.claude/commands/` (personal)

2. **Use frontmatter** for metadata: `allowed-tools`, `description`, `argument-hint`, `model`

3. **Parameterize with `$ARGUMENTS`** for all args or `$1`, `$2` for positional arguments

4. **Include context** with `@` (file references) and `!` (bash command output)

5. **Organize by domain** using subdirectories (frontend/, backend/, deploy/)

6. **Iterate on prompts** like any frequently used prompt - test and refine

7. **Avoid negative constraints** - specify what should be done, not just what to avoid

8. **Integrate MCP servers** for external tools using scope-appropriate configurations

9. **Use thinking keywords** ("think hard", "ultrathink") for complex tasks

10. **Keep commands focused** - single responsibility, clear outcomes

## Related Searches

- Claude Code hooks configuration best practices
- Claude Code subagents and task delegation patterns
- Claude Code permission system security configuration
- Claude Code headless mode automation workflows
