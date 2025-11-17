# MCP Server Configuration Guide

## Overview

This guide documents the correct configuration format for MCP (Model Context Protocol) servers in Claude Code. Following these guidelines prevents integration issues and ensures servers are properly detected.

**Related Issues:**

- #439 - Initial docs-mcp integration
- #598, #599 - First docs-mcp configuration fix (2025-11-14)
- #602 - Second regression fix (2025-11-15)
- #603, #610 - Configuration reload issue fix (2025-11-17)

## Supported MCP Server Types

Claude Code supports two types of MCP server connections:

### 1. stdio (Standard Input/Output)

For local MCP servers that communicate via standard input/output streams.

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "package-name"],
      "env": {
        "API_KEY": "value"
      }
    }
  }
}
```

**Examples:**

- `exa-mcp` - Exa search integration
- `server-perplexity-ask` - Perplexity AI integration
- `@upstash/context7-mcp` - Context7 documentation

### 2. SSE (Server-Sent Events) via mcp-remote

For remote MCP servers that communicate via SSE endpoints. **Must use `npx mcp-remote` wrapper.**

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "http://localhost:PORT/sse"
      ]
    }
  }
}
```

**Important:** The `-y` flag ensures non-interactive npx execution.

**Example: docs-mcp**

```json
{
  "mcpServers": {
    "docs-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "http://localhost:6280/sse"
      ]
    }
  }
}
```

## ❌ Unsupported Formats

### Direct HTTP Configuration (DOES NOT WORK)

```json
{
  "mcpServers": {
    "docs-mcp": {
      "type": "http",
      "url": "http://localhost:6280/mcp"
    }
  }
}
```

**Why this fails:**

- Claude Code MCP client does not support `"type": "http"` format
- Direct HTTP endpoints are not compatible with Claude Code's MCP implementation
- Must use `npx mcp-remote` wrapper for SSE-based servers

## Security Best Practices

### 1. Never Hardcode API Keys

❌ **Bad:**

```json
{
  "mcpServers": {
    "exa": {
      "command": "npx",
      "args": ["-y", "exa-mcp"],
      "env": {
        "EXA_API_KEY": "9c7c0675-4d56-4aae-a039-f93cf72a6cbb"
      }
    }
  }
}
```

✅ **Good:**

```json
{
  "mcpServers": {
    "exa": {
      "command": "npx",
      "args": ["-y", "exa-mcp"],
      "env": {
        "EXA_API_KEY": "${EXA_API_KEY}"
      }
    }
  }
}
```

Then add to `.env.local`:

```bash
EXA_API_KEY=9c7c0675-4d56-4aae-a039-f93cf72a6cbb
```

### 2. Ensure .env.local is in .gitignore

The `.gitignore` file already includes:

```
.env*.local
```

This prevents accidentally committing sensitive keys.

### 3. Document Required Keys in .env.example

Add template entries to `.env.example`:

```bash
# MCP Server API Keys
EXA_API_KEY=your_exa_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

## Adding New MCP Servers

### Step 1: Choose the Right Format

- **Local npm package**: Use stdio format with `npx`
- **Remote SSE server**: Use `npx mcp-remote <sse-url>`
- **Local Docker container with SSE**: Use `npx mcp-remote http://localhost:PORT/sse`

### Step 2: Add to .mcp.json

**Important:** Use `-y` flag for npx to ensure non-interactive execution:

```json
{
  "mcpServers": {
    "existing-server": { ... },
    "new-server": {
      "command": "npx",
      "args": ["-y", "package-name-or-mcp-remote"]
    }
  }
}
```

### Step 3: Add API Keys to .env.local (if needed)

```bash
NEW_SERVER_API_KEY=your_key_here
```

### Step 4: Restart Claude Code

**CRITICAL:** You must restart Claude Code to reload the configuration.

1. Exit Claude Code completely
2. Restart Claude Code in your project directory

### Step 5: Test the Configuration

```bash
# In Claude Code, run:
/mcp

# Expected: new-server appears in configured servers list
```

## Removing MCP Servers

1. Delete the server entry from `.mcp.json`:

```json
{
  "mcpServers": {
    "keep-this-server": { ... }
    // removed-server entry deleted
  }
}
```

2. **Restart Claude Code** to reload the configuration (see "Configuration Reload" section)

## Configuration Reload

### ⚠️ IMPORTANT: Restart Required After Configuration Changes

Claude Code **does not** automatically reload `.mcp.json` changes. After modifying the configuration file, you **must restart Claude Code** for changes to take effect.

**When restart is required:**

- Adding new MCP servers to `.mcp.json`
- Removing MCP servers from `.mcp.json`
- Modifying server configuration (args, env, etc.)
- Changing server endpoints or commands

**How to restart Claude Code:**

1. **Exit Claude Code completely** (not just close the conversation)
2. **Restart Claude Code** in your project directory
3. **Verify configuration loaded**: Run `/mcp` command
4. **Expected result**: Your MCP servers should appear in the list

**Common mistake:**

Modifying `.mcp.json` and immediately running `/mcp` without restarting. This will show stale configuration because Claude Code caches server configuration on startup.

**Troubleshooting reload issues:**

If servers still don't appear after restart:

1. **Validate JSON syntax**: `jq empty .mcp.json && echo "✓ Valid JSON"`
2. **Check configuration**: `jq '.mcpServers | keys' .mcp.json`
3. **Verify server accessibility**: Test with curl or docker ps
4. **Clear cache**: Look for Claude Code cache directories:
   - `~/.config/claude-code/`
   - `~/.claude-code/`
   - `~/.cache/claude-code/`
5. **Check for errors**: Watch for startup errors or warnings in Claude Code

**Best practice for the `-y` flag:**

Add the `-y` flag to `npx` commands to ensure non-interactive execution:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "package-name"]
    }
  }
}
```

This prevents npx from prompting for package installation confirmation, which could block server initialization in automated contexts.

## Troubleshooting

### "No MCP servers configured" Error

**Symptoms:**

- `/mcp` command shows no servers
- No MCP tools available

**Common Causes:**

1. **Claude Code not restarted after configuration changes** (most common)
2. Using unsupported `"type": "http"` format
3. Wrong endpoint path (e.g., `/mcp` instead of `/sse`)
4. Server not running or not accessible
5. Invalid JSON syntax in `.mcp.json`

**Solutions:**

1. **Restart Claude Code** to reload configuration (see "Configuration Reload" section above)
2. Use `npx mcp-remote` for SSE servers
3. Verify endpoint is correct (usually `/sse`)
4. Check server is running: `docker ps` or test endpoint with `curl`
5. Validate JSON: `jq empty .mcp.json`

### docs-mcp Specific Issues

**Verify container is running:**

```bash
docker ps | grep docs-mcp
# Expected: Container shows "Up" status with "(healthy)"
```

**Verify SSE endpoint:**

```bash
timeout 3 curl -N http://localhost:6280/sse | head -3
# Expected: Shows "event: endpoint" and "data: /messages?sessionId=..."
```

**Correct configuration:**

```json
{
  "mcpServers": {
    "docs-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "http://localhost:6280/sse"
      ]
    }
  }
}
```

**Note:** The `-y` flag ensures non-interactive npx execution.

## Reference: .mcp.example.json

The `.mcp.example.json` file contains working examples for both stdio and SSE server types. Refer to it when adding new servers.

**SSE Example (lines 34-40):**

```json
{
  "mcpServers": {
    "cloudflare-server": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://example.com/sse"
      ]
    }
  }
}
```

## Configuration Validation Checklist

Before committing changes to `.mcp.json`:

- [ ] JSON syntax is valid: `jq empty .mcp.json`
- [ ] No `"type": "http"` entries (unsupported)
- [ ] SSE servers use `npx mcp-remote <sse-url>`
- [ ] No hardcoded API keys (use environment variables)
- [ ] All required environment variables documented in `.env.example`
- [ ] `.env.local` is in `.gitignore`
- [ ] Servers are accessible (test with curl or docker ps)
- [ ] Configuration tested in Claude Code (`/mcp` command)

## Historical Context

This project has experienced **four separate instances** of docs-mcp integration issues:

1. **Issue #439** - Initial integration
2. **Issues #598, #599** (2025-11-14) - First regression: Wrong configuration format
3. **Issue #602** (2025-11-15) - Second regression: Same configuration format issue
4. **Issues #603, #610** (2025-11-17) - Configuration reload issue: Correct config not detected

The root causes have been:

- **Issues #598, #599, #602**: Using unsupported `"type": "http"` format and pointing to wrong endpoint (`/mcp` instead of `/sse`)
- **Issues #603, #610**: Configuration was correct but Claude Code was not restarted to reload changes

**Lessons learned:**

1. Always use `npx mcp-remote` for SSE-based servers, regardless of whether they're remote or local Docker containers
2. **Always restart Claude Code after modifying `.mcp.json`** - configuration is not hot-reloaded
3. Add `-y` flag to npx commands for defensive non-interactive execution
4. Complete all manual validation steps before closing issues

## Additional Resources

- [MCP Specification](https://modelcontextprotocol.io/)
- [Claude Code MCP Documentation](https://code.claude.com/docs/mcp)
- [mcp-remote npm package](https://www.npmjs.com/package/mcp-remote)
- [docs-mcp Server](https://github.com/arabold/docs-mcp-server)
