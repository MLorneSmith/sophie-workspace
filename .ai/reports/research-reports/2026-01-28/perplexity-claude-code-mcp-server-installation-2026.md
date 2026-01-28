# Perplexity Research: Claude Code MCP Server Installation 2026

**Date**: 2026-01-28
**Agent**: perplexity-expert
**Search Type**: Chat API & Search API

## Query Summary

Research conducted to find the latest best practices for installing MCP (Model Context Protocol) servers into Claude Code, including:
1. Current recommended installation methods
2. Configuration file locations
3. Proper configuration procedures
4. Recent changes to MCP server installation process
5. Common pitfalls and issues to avoid

---

## Key Findings

### 1. Current Recommended Installation Methods

As of 2026, Claude Code supports **three primary methods** for installing MCP servers:

#### Method A: CLI Commands (Recommended for Most Users)

```bash
# Add HTTP/Remote server
claude mcp add --transport http <name> <url> [--header "Authorization: Bearer TOKEN"]

# Add stdio/local server
claude mcp add <name> -- <command> [args...]

# Add with JSON configuration (for complex setups)
claude mcp add-json <name> '{"command": "...", "args": [...], "env": {...}}'

# Import from Claude Desktop
claude mcp add-from-claude-desktop
```

#### Method B: Direct Config File Editing (Recommended for Power Users)

Edit `~/.claude.json` directly. This method is preferred when:
- You need to configure multiple servers at once
- Complex environment variables are involved
- You want version control of your configuration
- The CLI wizard is too restrictive for your needs

#### Method C: Project-Specific `.mcp.json`

Create `.mcp.json` in your project root for project-specific MCP servers.

---

### 2. Configuration File Locations (CRITICAL INFORMATION)

#### Claude Code CLI (Terminal-based)

| Scope | File Location | Platform | Use Case |
|--------|----------------|----------|-----------|
| **User/Local** | `~/.claude.json` | macOS/Linux | Available across all projects (default scope) |
| **User/Local** | `%USERPROFILE%\.claude.json` | Windows | Available across all projects (default scope) |
| **Project** | `.mcp.json` | All platforms | Project-specific configuration |
| **User Scope** | `~/.claude.json` | macOS/Linux | Explicitly global with `--scope user` |

#### Claude Desktop (GUI App - DIFFERENT PRODUCT!)

| Platform | File Location |
|----------|---------------|
| **macOS** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Windows** | `%APPDATA%\Claude\claude_desktop_config.json` |
| **Linux** | `~/.config/Claude/claude_desktop_config.json` |

#### IMPORTANT: Files That DON'T Work

The following files **DO NOT** work for MCP servers in Claude Code:
- `~/.claude/settings.json` (common misconception from outdated docs)
- `~/.claude/settings.local.json`
- Claude Desktop's config files (different product)
- Any nested `.claude/` directories

**CRITICAL BUG**: As of November 2025, official documentation still incorrectly references `~/.claude/settings.json` for MCP configuration. This is a known bug (Issue #4976) and causes significant user confusion.

---

### 3. Configuration Formats

#### Stdio/Local Servers (Default)

```json
{
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/directory"],
      "env": {}
    },
    "git": {
      "type": "stdio",
      "command": "uvx",
      "args": ["mcp-server-git"],
      "env": {}
    },
    "time": {
      "type": "stdio",
      "command": "uvx",
      "args": ["mcp-server-time", "--local-timezone", "America/New_York"],
      "env": {}
    }
  }
}
```

#### HTTP/Remote Servers

```json
{
  "mcpServers": {
    "api-server": {
      "type": "http",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

#### Plugin `.mcp.json` Format

```json
{
  "database-tools": {
    "command": "${CLAUDE_PLUGIN_ROOT}/servers/db-server",
    "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"],
    "env": {
      "DB_URL": "${DB_URL}"
    }
  }
}
```

---

### 4. Configuration Scopes and Precedence

Claude Code supports three configuration scopes with clear precedence:

1. **Local Scope** (default): Stored in `~/.claude.json` - available to you across projects
2. **Project Scope**: Stored in project `.mcp.json` - project-specific, requires approval on first use
3. **User Scope**: Explicitly global - same as local in recent versions

**Precedence**: When servers with the same name exist at multiple scopes:
1. Local-scoped (highest priority)
2. Project-scoped
3. User-scoped (lowest priority)

---

### 5. Recent Changes (2025-2026)

#### Major Documentation Bug (Unresolved as of Nov 2025)

- Official docs incorrectly state MCP configuration goes in `~/.claude/settings.json`
- This location is **completely ignored** by Claude Code
- Actual location is `~/.claude.json`
- Bug tracked in GitHub Issue #4976 (reported August 2025)

#### Command Format Updates (Claude Code 2.1.1+)

For HTTP servers in newer versions, use `add-json`:

```bash
# OLD format (versions 2.1.0 and earlier)
claude mcp add --transport http github https://api.githubcopilot.com/mcp -H "Authorization: Bearer TOKEN"

# NEW format (versions 2.1.1 and later)  
claude mcp add-json github '{"type":"http","url":"https://api.githubcopilot.com/mcp","headers":{"Authorization":"Bearer TOKEN"}}'
```

#### Deprecation Notice

The npm package `@modelcontextprotocol/server-github` is deprecated as of April 2025. Use official GitHub MCP server via Docker or HTTP.

---

### 6. Common Pitfalls and Issues

#### Pitfall 1: Wrong Configuration File

**Symptom**: MCP servers don't appear when running `/mcp` despite correct configuration
**Cause**: Following outdated documentation that points to `~/.claude/settings.json`
**Fix**: Use `~/.claude.json` instead

#### Pitfall 2: Windows Path Format Issues

**Symptom**: "Windows requires 'cmd /c' wrapper" warning
**Cause**: Using `npx` directly without cmd wrapper
**Fix**:

```json
// WRONG
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "D:/path"]
}

// CORRECT
{
  "command": "cmd",
  "args": ["/c", "npx", "-y", "@modelcontextprotocol/server-filesystem", "D:/path"]
}
```

#### Pitfall 3: JSON Syntax Errors

**Symptom**: Config validation fails silently
**Cause**: Trailing commas (not allowed in JSON), missing quotes, unescaped characters
**Fix**: Validate JSON with online validator before saving

#### Pitfall 4: Environment Variable Expansion

**Symptom**: "Required environment variable not set" errors
**Cause**: Variables referenced without defaults and not set
**Fix**: Use `${VAR:-default}` syntax for defaults:

```json
{
  "url": "${API_BASE_URL:-https://api.example.com}/mcp"
}
```

#### Pitfall 5: Missing Node.js or uvx

**Symptom**: Command not found errors
**Cause**: MCP server requires runtime that isn't installed
**Fix**:
- For Node.js servers: Ensure `npx` is available (Node 16+ required)
- For Python servers: Install `uv` and use `uvx`

#### Pitfall 6: Project Scope Approval Not Prompted

**Symptom**: Project-scoped MCP servers don't load
**Cause**: Project-scoped servers require explicit approval on first use
**Fix**: Use `/mcp` command in Claude Code to approve servers, or use `claude mcp reset-project-choices` to reset approval decisions

#### Pitfall 7: Not Restarting After Config Changes

**Symptom**: Configuration changes don't take effect
**Cause**: Claude Code doesn't hot-reload configuration
**Fix**: Fully quit and restart Claude Code (Ctrl+D twice, then run `claude` again)

---

### 7. Verification Commands

```bash
# List configured servers
claude mcp list

# Get details for specific server
claude mcp get <server-name>

# Check server status inside Claude Code
/mcp

# Run diagnostics
claude /doctor

# Remove a server
claude mcp remove <server-name>

# Reset project approval choices
claude mcp reset-project-choices

# Use Claude Code as an MCP server
claude mcp serve
```

---

### 8. Platform-Specific Notes

#### macOS
- File location: `~/.claude.json`
- Use `npx` directly (no wrapper needed)
- First run of filesystem MCP prompts for folder access permission

#### Linux
- File location: `~/.claude.json`
- Use `npx` directly (no wrapper needed)
- Same behavior as macOS

#### Windows
- File location: `%USERPROFILE%\.claude.json`
- **MUST** use `cmd /c` wrapper for npx commands
- Path format: Use forward slashes `D:/path` instead of `D:\\path`
- WSL not required for Claude Code (unlike Claude Desktop)

#### Windows (WSL)
- Config is in Linux file system (not Windows file system)
- Use `~/.claude.json` location inside WSL

---

### 9. Organization/Managed Configuration

For centralized control, Claude Code supports two approaches:

#### Exclusive Control (`managed-mcp.json`)

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    },
    "sentry": {
      "type": "http",
      "url": "https://mcp.sentry.dev/mcp"
    }
  }
}
```

Deploy to system-wide directory. Users cannot add/modify other servers.

#### Policy-Based Control (Allowlists/Denylists)

```json
{
  "allowedMcpServers": [
    { "serverName": "github" },
    { "serverName": "sentry" },
    { "serverCommand": ["npx", "-y", "approved-package"] },
    { "serverUrl": "https://mcp.company.com/*" },
    { "serverUrl": "https://*.internal.corp/*" }
  ],
  "deniedMcpServers": [
    { "serverUrl": "http://localhost:*/*" }
  ]
}
```

Users can add their own servers within policy constraints.

---

## Sources & Citations

1. **Connect Claude Code to tools via MCP** - https://code.claude.com/docs/en/mcp
   - Official documentation for MCP server installation
   - CLI commands, scopes, configuration formats

2. **Configuring MCP Tools in Claude Code - The Better Way** - https://scottspence.com/posts/configuring-mcp-tools-in-claude-code
   - Community guide on direct config file editing
   - Practical examples and workflows

3. **The Claude Code MCP Configuration Bug That's Wasting Everyone's Time** - https://www.petegypps.uk/blog/claude-code-mcp-configuration-bug-documentation-error-november-2025
   - Documents the critical settings.json bug (Issue #4976)
   - Correct file locations and troubleshooting

4. **Claude Code MCP Setup Guide for Windows** - https://lobehub.com/mcp/bunprinceton-claude-mcp-windows-guide
   - Windows-specific installation issues and solutions
   - cmd /c wrapper requirements

5. **Install GitHub MCP Server** - https://github.com/github/github-mcp-server/blob/main/docs/installation-guides/install-claude.md
   - GitHub-specific installation instructions
   - Remote vs local server setup

---

## Key Takeaways

1. **Right Config File**: Use `~/.claude.json` for Claude Code CLI, NOT `~/.claude/settings.json`
2. **Platform Differences**: Claude Code CLI and Claude Desktop use completely different config files - don't mix them up
3. **Windows Wrapper**: On Windows, always use `cmd /c` wrapper for npx commands
4. **Verification**: Always use `/mcp` inside Claude Code to verify servers are connected
5. **Restart Required**: Configuration changes only take effect after full restart
6. **Use CLI or Direct Edit**: For complex setups, editing `~/.claude.json` directly is more reliable than the CLI wizard
7. **Variable Expansion**: Use `${VAR:-default}` syntax for environment variable defaults
8. **Organization Control**: Use `managed-mcp.json` or allowlists/denylists for enterprise deployments

---

## Related Searches

- Claude Code as MCP server (`claude mcp serve`)
- MCP server authentication with OAuth 2.0
- Building custom MCP servers with @modelcontextprotocol/sdk
- MCP server security best practices for production deployments
