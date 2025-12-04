# Perplexity Research: Claude Code NODE_ENV Behavior

**Date**: 2025-12-03
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API

## Query Summary

Investigated whether Anthropic's Claude Code CLI tool sets `NODE_ENV=production` by default when running Bash commands, and how to configure environment variables in Claude Code.

## Findings

### Does Claude Code Set NODE_ENV=production by Default?

**No, Claude Code does NOT set NODE_ENV=production by default.**

According to the research findings:

1. **Default Behavior**: Claude Code appears to set `NODE_ENV=development` by default in some contexts, particularly for MCP server configuration
2. **Environment Isolation**: Each Bash command runs in a fresh shell environment - environment variables set in one command do NOT persist to subsequent commands
3. **User Report**: A Japanese developer documented experiencing `NODE_ENV=development` being automatically set in Claude Code, causing stricter Next.js build checks

### Key Environment Variable Behaviors

**Environment Variable Persistence**:
- **Working directory persists** between Bash commands
- **Environment variables do NOT persist** - each command runs in a fresh shell
- `NODE_ENV` and other env vars must be set per-command or configured globally

**Configuration Options**:

There are three ways to configure persistent environment variables in Claude Code:

1. **Option 1: Activate environment before starting Claude Code**
   ```bash
   export NODE_ENV=production
   claude
   ```

2. **Option 2: Use CLAUDE_ENV_FILE** (recommended for persistent setup)
   ```bash
   export CLAUDE_ENV_FILE=/path/to/env-setup.sh
   claude
   ```
   
   Where `env-setup.sh` contains:
   ```bash
   export NODE_ENV=production
   # Other environment setup
   ```

3. **Option 3: Use SessionStart hooks** in `.claude/settings.json`:
   ```json
   {
     "hooks": {
       "SessionStart": [{
         "matcher": "startup",
         "hooks": [{
           "type": "command",
           "command": "echo 'export NODE_ENV=production' >> \"$CLAUDE_ENV_FILE\""
         }]
       }]
     }
   }
   ```

### MCP Server Configuration

For MCP servers, `NODE_ENV` can be explicitly set in `.claude/settings.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "@my/server"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Environment Variables in Settings.json

All environment variables can be configured in `settings.json` for automatic application:

```json
{
  "environment": {
    "NODE_ENV": "production",
    "DEBUG": "false"
  }
}
```

### Related GitHub Issues

- **Issue #539**: Claude Code uses system Node version instead of project-specific (nodenv/nvm) versions
  - Solution: Configure `.zshrc` or `.bashrc` with appropriate `*env` initialization
  - Claude Code sources shell RC files on startup

- **Issue #401**: Claude loads project `.env` files into Bash environment
  - This is intentional behavior for convenience
  - Can be disabled if needed

### Shell Behavior

- Claude Code runs `bash` or `zsh` and sources `~/.bashrc` or `~/.zshrc`
- Shell configuration in RC files is available to Claude Code
- Each Bash tool invocation starts a fresh shell session
- Use `CLAUDE_CODE_SHELL_PREFIX` to wrap all bash commands (e.g., for logging)

## Sources & Citations

1. **Claude Code Documentation - Settings**: https://code.claude.com/docs/en/settings
   - Explains environment variable persistence behavior
   - Documents `CLAUDE_ENV_FILE` and SessionStart hooks
   - Lists all available environment variables

2. **Claude Code Documentation - Environment Variables**: https://github.com/jezweb/how-to-claude-code/blob/main/06-configuration/environment-variables.md
   - Comprehensive guide to environment variable configuration
   - Examples of setting NODE_ENV for development vs production
   - MCP server environment variable configuration

3. **Zenn.dev Article** (Japanese): https://zenn.dev/aym0546/articles/ae330568032649
   - User-documented investigation of `NODE_ENV=development` behavior
   - Confirms Claude Code sets `NODE_ENV=development` by default
   - Demonstrates how this affects Next.js builds with stricter checks

4. **GitHub Issue #539**: https://github.com/anthropics/claude-code/issues/539
   - Node version management with nodenv/nvm
   - Shell RC file sourcing behavior

5. **Anthropic Blog - Best Practices**: https://www.anthropic.com/engineering/claude-code-best-practices
   - Customization recommendations
   - CLAUDE.md file usage
   - Environment setup patterns

## Key Takeaways

- **Claude Code does NOT set NODE_ENV=production by default** - it appears to set `development` in some contexts
- **Environment variables don't persist** between Bash commands - each runs in a fresh shell
- **Three configuration methods** exist for persistent env vars: pre-start export, CLAUDE_ENV_FILE, or SessionStart hooks
- **Use `CLAUDE_ENV_FILE`** for the most reliable persistent environment setup
- **Shell RC files are sourced** on startup, so `.bashrc`/`.zshrc` configuration is available
- **MCP servers** can have their own env vars configured in settings.json

## Recommended Solution

For your specific case, to ensure `NODE_ENV=production` in Claude Code:

**Best approach: Use CLAUDE_ENV_FILE**

1. Create a file (e.g., `~/.claude-env.sh`):
   ```bash
   #!/bin/bash
   export NODE_ENV=production
   ```

2. Before starting Claude Code:
   ```bash
   export CLAUDE_ENV_FILE=~/.claude-env.sh
   claude
   ```

**Alternative: SessionStart hook** (project-specific)

Add to `.claude/settings.json`:
```json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "startup",
      "hooks": [{
        "type": "command",
        "command": "echo 'export NODE_ENV=production' >> \"$CLAUDE_ENV_FILE\""
      }]
    }]
  }
}
```

## Related Searches

- How to configure environment variables for Claude Code MCP servers
- Claude Code shell initialization and RC file sourcing
- Managing Node.js versions (nvm/nodenv) with Claude Code
- Claude Code environment variable precedence and configuration hierarchy
