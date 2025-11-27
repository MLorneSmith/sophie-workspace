# Exa Research: Claude Code New Features Since November 1, 2025

**Date**: 2025-11-27
**Agent**: exa-expert
**Search Types Used**: Neural, Keyword, Answer, Get Contents

## Query Summary

Searched for new Claude Code features and capabilities announced since November 1, 2025, focusing on:
- New configuration options
- Agent/subagent enhancements
- Hook system changes
- MCP server improvements
- Command frontmatter options
- Settings file changes
- New tools or parameters

## Top Results

| Title | URL | Relevance |
|-------|-----|-----------|
| Using CLAUDE.md files | https://www.claude.com/blog/using-claude-md-files-customizing-claude-code-for-your-codebase | High |
| Claude Code Plugins | https://www.claude.com/blog/claude-code-plugins | High |
| Hooks Reference | https://docs.anthropic.com/en/docs/claude-code/hooks | High |
| MCP Documentation | https://docs.anthropic.com/en/docs/claude-code/mcp | High |
| Settings Documentation | https://docs.anthropic.com/en/docs/claude-code/settings | High |
| Bypass Permission Mode | https://help.apiyi.com/claude-code-vscode-bypass-permissions-update-2025-en.html | High |
| Agent Capabilities API | https://www.claude.com/blog/agent-capabilities-api | Medium |
| New Capabilities API | https://www.claude.com/blog/agent-capabilities-api | Medium |

## Key Findings

### 1. Plugin System (October 9, 2025)

**Major Feature**: Claude Code now supports **plugins** - custom collections of slash commands, agents, MCP servers, and hooks that install with a single command.

**Key Capabilities**:
- **Slash Commands**: Create custom shortcuts for frequently-used operations
- **Subagents**: Install purpose-built agents for specialized development tasks
- **MCP Servers**: Connect to tools and data sources through Model Context Protocol
- **Hooks**: Customize Claude Code's behavior at key points in its workflow

**Installation**:
```bash
claude plugin install [plugin-name]
```

**Management**:
```bash
/plugin  # Toggle plugins on/off
```

**Use Cases**:
- Enforce coding standards
- Support developers with custom commands
- Share workflows across teams
- Connect tools through MCP servers
- Create and host plugin marketplaces

**Status**: Public beta as of October 2025

### 2. Hooks System (Comprehensive Updates)

**Hook Types Available**:

1. **PreToolUse**: Execute before tool usage
   - Validation and permission checks
   - Input transformation
   - Security enforcement
   
2. **PostToolUse**: Execute after tool completion
   - Result validation
   - Context injection
   - Auto-formatting
   - Logging

3. **PermissionRequest**: Execute when permission needed
   - Custom approval logic
   - Security policies

4. **UserPromptSubmit**: Execute when user submits prompt
   - Context injection
   - Prompt validation

5. **SessionStart/SessionEnd**: Execute at session boundaries
   - Environment setup
   - Cleanup tasks

6. **Stop**: Execute after main task completion
   - Notifications
   - Version control commits

7. **SubagentStop**: Execute when subagent completes
   - Custom logic for subagent cleanup

**Configuration Location**:
- `.claude/settings.local.json` - Local project settings (not committed)
- `.claude/settings.json` - Project settings (committed)
- `~/.claude/settings.json` - User settings

**Hook Structure**:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "command": "/path/to/script.sh",
        "description": "Validate bash commands"
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "command": "black ${file}",
        "description": "Auto-format Python files"
      }
    ]
  }
}
```

**Return Values**:
- **Exit Code 0**: Approve/continue
- **Exit Code 1**: General error
- **Exit Code 2**: Deny with error message
- **JSON Output**: Structured response with approval/denial and context

**Security Note**: Hooks run automatically with your environment's credentials

### 3. MCP (Model Context Protocol) Enhancements

**Server Types**:
- **Remote HTTP servers**: Connect to HTTP-based MCP servers
- **Remote SSE servers**: Connect to Server-Sent Events servers
- **Local stdio servers**: Connect to local command-line servers

**Server Scopes**:
- **Local**: `.claude/mcp_servers.json` (project-specific, not committed)
- **Project**: `.claude/settings.json` (shared with team)
- **User**: `~/.claude/mcp_servers.json` (user-wide)

**Configuration Methods**:
1. JSON configuration files
2. Import from Claude Desktop
3. Interactive `/mcp` command

**Authentication**:
- API Key authentication
- Bearer Token
- Basic Auth
- OAuth with Dynamic Client Registration (DCR)

**Popular MCP Servers**:
- **GitHub**: PR management, issue tracking
- **Perplexity**: Smart research
- **Sequential Thinking**: Break down complex tasks
- **Context7**: Real-time documentation access
- **Sentry**: Error monitoring
- **PostgreSQL**: Database queries

**Example Configuration**:
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

### 4. Settings File Enhancements

**Hierarchical Settings Structure**:

1. **Enterprise Managed Policy Settings** (highest priority)
   - Windows: `C:\ProgramData\ClaudeCode\managed-settings.json`
   - macOS: `/Library/Application Support/ClaudeCode/managed-settings.json`
   - Linux/WSL: `/etc/claude-code/managed-settings.json`

2. **User Settings**
   - `~/.claude/settings.json` - Applies to all projects

3. **Project Settings**
   - `.claude/settings.json` - Shared with team (committed)
   - `.claude/settings.local.json` - Personal preferences (not committed)

**New Configuration Options**:

```json
{
  "apiKeyHelper": "path/to/custom-auth-script.sh",
  "cleanupPeriodDays": 30,
  "env": {
    "CUSTOM_VAR": "value"
  },
  "permissions": {
    "allowed": ["Read", "Bash"],
    "denied": ["Web"],
    "requested": ["Write"]
  },
  "hooks": {
    "PreToolUse": [...],
    "PostToolUse": [...]
  },
  "model": "claude-sonnet-4-5-20250929",
  "mcpServers": {...}
}
```

**Interactive Configuration**:
```bash
/config  # Opens tabbed Settings interface
```

### 5. Bypass Permission Mode (VS Code Extension)

**Feature**: Skip all permission confirmation prompts for faster development

**Performance Gain**: 3-5x faster coding efficiency

**Configuration Methods**:

1. **VS Code Settings UI**:
   - Settings > Extensions > Claude Code > Bypass Permissions

2. **Configuration File**:
   ```json
   {
     "claude.bypassPermissions": true
   }
   ```

3. **Project-Level** (`.vscode/settings.json`):
   ```json
   {
     "claude.bypassPermissions": true
   }
   ```

**Security Recommendations**:
- Use project-level configuration
- Use VS Code Dev Containers for isolation
- Only enable in development environments

### 6. Subagent System Enhancements

**Performance Improvements**:
- 90.2% performance improvement over single-agent models
- 3-4x efficiency gains in real-world applications
- Up to 10 concurrent operations per session
- Intelligent queuing for 100+ tasks

**Architecture**:
- **Orchestrator-Worker Pattern**: Lead agent (Opus 4) coordinates specialized subagents (Sonnet 4)
- **Independent Context Windows**: 200K tokens per subagent
- **Parallel Execution**: True parallel processing without interference

**Configuration** (YAML frontmatter in `.claude/agents/[name].md`):

```yaml
---
name: database-architect
description: Specialized database design and optimization
tools:
  - Read
  - Write
  - Bash
planModeBehavior: auto
model: claude-sonnet-4-5
---

# Database Architect Agent

Your role is to design and optimize database schemas...
```

**Delegation Methods**:
1. **Automatic**: Based on description matching
2. **Explicit**: Call by name

**Common Subagent Types**:
- Code Reviewer
- Debugging Specialist
- Test Automation Expert
- Documentation Writer
- Data Analyst
- Security Guardian

### 7. Model Selection & Switching

**Available Models**:
- Claude Sonnet 4.5 (default)
- Claude 4.5 Opus
- Claude 4 Opus
- Claude 3.5 Haiku

**Configuration**:
```bash
# Environment variable
export ANTHROPIC_MODEL=claude-sonnet-4-5-20250929

# Settings file
{
  "model": "claude-opus-4-20250514"
}
```

**Interactive Switching**:
```bash
/model  # Opens model selection menu
```

### 8. Agent Capabilities API (October 31, 2025)

**New API Features**:

1. **Code Execution Tool**: Run Python in sandboxed environment
   - Financial modeling
   - Scientific computing
   - Business intelligence
   - Document processing

2. **MCP Connector**: Connect to remote MCP servers without custom client code

3. **Files API**: Store and access files across sessions

4. **Extended Prompt Caching**: Maintain context for up to 60 minutes

### 9. Command Frontmatter Options

**YAML Frontmatter Fields** (for custom commands/agents):

**Required**:
- `name`: Unique identifier (string)
- `description`: Natural language trigger (max 200 chars)

**Optional**:
- `tools`: Array of allowed tools
- `planModeBehavior`: Controls behavior in plan mode (`auto`, `manual`, `disabled`)
- `model`: Specific model to use
- `version`: Track iterations (e.g., "1.0.0")
- `dependencies`: Required packages (e.g., "python>=3.8")

**Example**:
```yaml
---
name: security-guardian
description: Security audit and vulnerability scanning
tools:
  - Read
  - Bash
  - Grep
planModeBehavior: auto
model: claude-sonnet-4-5
version: 1.2.0
dependencies:
  - bandit>=1.7
  - safety>=2.0
---

# Security Guardian

You are a security specialist...
```

### 10. Environment Variables

**New Environment Variables**:

- `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`: Disable telemetry
- `BASH_MAX_OUTPUT_LENGTH`: Control bash output size
- `ANTHROPIC_MODEL`: Specify default model
- `ANTHROPIC_API_KEY`: Authentication
- Custom environment variables via `settings.json` `env` field

## Code Examples

### Hook Example: Validate Commit Messages

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "command": "/home/user/.claude/hooks/validate-commit-message.sh",
        "description": "Validate commit message format"
      }
    ]
  }
}
```

### MCP Example: GitHub Integration

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

### Subagent Example: Test Writer

```yaml
---
name: test-writer
description: Generate comprehensive unit and integration tests
tools:
  - Read
  - Write
  - Bash
  - Grep
planModeBehavior: auto
---

# Test Writer Agent

You are a testing specialist focused on writing comprehensive test coverage.

## Responsibilities
- Generate unit tests with high coverage
- Create integration tests for API endpoints
- Ensure tests follow project conventions
- Use appropriate testing frameworks

## Tools
- Jest/Vitest for JavaScript/TypeScript
- Pytest for Python
- Follow existing test patterns in the codebase
```

## Extracted Content

### From Hooks Documentation

Key highlights from the official hooks reference:

- **Matchers**: Pattern matching is case-sensitive and applies only to PreToolUse, PermissionRequest, and PostToolUse hooks
- **Timeout**: All hooks have a 60-second execution limit
- **Execution Model**: Synchronous - blocks agent loop until completion
- **Bidirectional Control**: Can approve, deny, or modify tool usage
- **Debugging**: Can enable debug logging for hook execution

### From MCP Documentation

Key MCP capabilities:

- **Implement features from issue trackers**: "Add the feature described in JIRA issue ENG-4521 and create a PR on GitHub"
- **Analyze monitoring data**: "Check Sentry and Statsig to check the usage of the feature described in ENG-4521"
- **Query databases**: "Find emails of 10 random users who used feature ENG-4521, based on our Postgres database"

## Sources

### Official Documentation
- [Claude Code Plugins Blog Post](https://www.claude.com/blog/claude-code-plugins)
- [Hooks Reference](https://docs.anthropic.com/en/docs/claude-code/hooks)
- [MCP Documentation](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Settings Documentation](https://docs.anthropic.com/en/docs/claude-code/settings)
- [Agent Capabilities API](https://www.claude.com/blog/agent-capabilities-api)

### Community Resources
- [ClaudeLog - Hooks Guide](https://claudelog.com/faqs/what-is-hooks-in-claude-code)
- [ClaudeLog - MCP Setup](https://www.claudelog.com/faqs/how-to-setup-claude-code-mcp-servers/)
- [ClaudeLog - Configuration](https://www.claudelog.com/configuration/)
- [Bypass Permission Mode Guide](https://help.apiyi.com/claude-code-vscode-bypass-permissions-update-2025-en.html)

### Deep Dive Articles
- [Claude Code Subagents Guide](https://www.cursor-ide.com/blog/claude-code-subagents)
- [Claude Agents & Subagents Complete Guide](https://vibecodingconsultant.com/blog/claude-agents-subagents-guide/)
- [Developer's Guide to Claude Code Hooks](https://www.eesel.ai/blog/claude-code-hooks)
- [7 Powerful Claude Code Subagents](https://www.eesel.ai/blog/claude-code-subagents)

## Related Resources

- **Command Profiles**: `.claude/config/command-profiles.yaml`
- **Plugin Marketplace**: Expected to launch with community-contributed plugins
- **MCP Server Registry**: Hundreds of available MCP servers
- **Skills System**: Custom Skills with Skill.md files (related feature)

## Implementation Recommendations

### For This Project

Based on the research, here are recommended implementations for the SlideHeroes project:

1. **Enable Hooks**:
   - Add commit message validation hook (already exists at `.claude/hooks/validate-commit-message.sh`)
   - Add auto-formatting hook for TypeScript/React files
   - Add database migration validation hook

2. **Configure MCP Servers**:
   - GitHub for PR/issue management
   - PostgreSQL for database queries
   - Context7 for documentation access

3. **Create Project-Specific Subagents**:
   - `e2e-test-writer`: Specialized for Playwright E2E tests
   - `database-migration-expert`: For Supabase migrations
   - `security-auditor`: For RLS policy validation

4. **Update Settings Hierarchy**:
   - Use `.claude/settings.json` for team-wide settings
   - Use `.claude/settings.local.json` for personal preferences
   - Document configuration in `CLAUDE.md`

5. **Leverage Bypass Permission Mode**:
   - Configure for development environment only
   - Use VS Code Dev Containers for isolation

## Gaps & Limitations

- **Plugin Marketplace**: Still in beta, limited plugins available
- **SSE Support**: May be deprecated for MCP (use HTTP instead)
- **Hook Timeout**: 60-second limit may be restrictive for complex operations
- **Subagent Limits**: 10 concurrent operations may not be sufficient for very large tasks
- **Documentation**: Some features lack comprehensive examples

## Next Steps

1. Test plugin installation and configuration
2. Implement recommended hooks for commit validation and auto-formatting
3. Set up MCP servers for GitHub and PostgreSQL
4. Create and test project-specific subagents
5. Document new features in project `CLAUDE.md`
6. Share findings with team for feedback

