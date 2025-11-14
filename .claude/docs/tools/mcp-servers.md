# Model Context Protocol (MCP) Servers Architecture

**Purpose**: This document provides a comprehensive guide to the SlideHeroes MCP server implementation, covering architecture, configuration, security patterns, and integration with Claude Code. MCP enables AI assistants to access external services, databases, and APIs through a standardized protocol.

## Overview

The SlideHeroes project implements Model Context Protocol (MCP) servers through Claude Code's native integration, enabling seamless interaction with external services, databases, and APIs. Our current implementation uses Claude Code's built-in MCP client to connect directly to servers configured in `.mcp.json`, eliminating the need for Docker containerization while maintaining security and functionality.

MCP represents a standardized protocol that allows AI models to access resources, execute tools, and use prompts through a unified interface. Our implementation leverages Claude Code's native MCP support for simplified deployment and management.

## Architecture Design

### Claude Code Native MCP Architecture

```
┌─────────────────┐
│   Claude Code   │  Host Application
│   (Desktop)     │
└────────┬────────┘
         │
┌────────▼────────┐
│  Built-in MCP   │  MCP Client (Integrated)
│     Client      │
└────────┬────────┘
         │
┌────────▼────────┐
│  MCP Servers    │  Server Layer (8 services)
│  (npx/native)   │  Managed by Claude Code
└─────────────────┘
```

### Service Categories

**AI/ML Services**:

- `perplexity-ask`: Perplexity AI for questions and research
- `exa`: Web search via Exa API
- `code-reasoning`: Sequential thinking and problem-solving

**Infrastructure Services**:

- `supabase`: Database and auth management
- `postgres`: Direct PostgreSQL operations (local connection)
- `newrelic`: Application monitoring (Python-based)

**Cloudflare Services**:

- `cloudflare-playwright`: Browser automation via Workers

**Utility Services**:

- `context7`: Documentation and API reference retrieval

## Implementation Details

### Claude Code Native Configuration

MCP servers are configured in `.mcp.json` at the project root:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@package/name"],
      "env": {
        "API_KEY": "your-api-key"
      }
    }
  }
}
```

### Server Execution Patterns

**NPX-based Servers** (Most Common):

```json
{
  "perplexity-ask": {
    "command": "npx",
    "args": ["-y", "server-perplexity-ask"],
    "env": {
      "PERPLEXITY_API_KEY": "pplx-xxx"
    }
  }
}
```

**Direct Command Servers**:

```json
{
  "postgres": {
    "command": "npx",
    "args": [
      "-y",
      "@henkey/postgres-mcp-server",
      "--connection-string",
      "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
    ]
  }
}
```

**Python-based Servers**:

```json
{
  "newrelic": {
    "command": "/home/msmith/.local/bin/uv",
    "args": [
      "--directory",
      "/home/msmith/projects/2025slideheroes/.mcp-servers/newrelic-mcp",
      "run",
      "newrelic_mcp_server.py"
    ],
    "env": {
      "NEW_RELIC_API_KEY": "xxx",
      "NEW_RELIC_ACCOUNT_ID": "xxx"
    }
  }
}
```

### Server Enablement

Servers are enabled via `.claude/settings.local.json`:

```json
{
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": [
    "exa",
    "perplexity-ask",
    "supabase",
    "context7",
    "cloudflare-playwright",
    "postgres",
    "code-reasoning",
    "newrelic"
  ]
}
```

## Security Implementation

### Claude Code MCP Security Model

**1. Authentication Layer**:

```json
// .mcp.json configuration
{
  "env": {
    "MCP_AUTH_TOKEN": "Bearer xxx",
    "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxx",
    "PERPLEXITY_API_KEY": "pplx-xxx"
  }
}
```

**2. Process Isolation**:

- Each MCP server runs as separate process
- Managed by Claude Code's process supervisor
- Automatic restart on failure
- Resource limits enforced by OS

**3. Configuration Security**:

- API keys stored in `.mcp.json` (consider environment variables for production)
- `.mcp.json` should be in `.gitignore` if contains secrets
- Project-scoped servers require trust approval
- Permission system via `.claude/settings.local.json`

**4. Input Validation**:

- Claude Code validates all MCP tool calls
- Type checking on parameters
- Rate limiting built into Claude Code

**5. Secret Management Best Practices**:

- Use environment variable expansion: `${API_KEY}`
- Regular token rotation
- Consider using `.env` files with dotenv
- Never commit secrets to version control

### Security Best Practices

1. **Principle of Least Privilege**: Each service runs with minimal required permissions
2. **Defense in Depth**: Multiple security layers from container to application
3. **Zero Trust**: All inter-service communication authenticated
4. **Audit Logging**: Comprehensive logging of all MCP operations
5. **Regular Updates**: Automated vulnerability scanning and patching

## Service Management

### Claude Code MCP Management

**Automatic Startup**:

- MCP servers start automatically when Claude Code launches
- Configuration read from `.mcp.json` at startup
- Servers managed by Claude Code's process supervisor

**Manual Management**:

```bash
# List configured MCP servers
claude mcp list

# Add a new MCP server
claude mcp add server-name --scope project

# Remove an MCP server
claude mcp remove server-name

# View MCP server details
/mcp  # Within Claude Code session
```

### Configuration Management

**Enable/Disable Servers**:

Edit `.claude/settings.local.json`:

```json
{
  "enableAllProjectMcpServers": true,  // Enable all at once
  "enabledMcpjsonServers": [           // Or specify individual servers
    "perplexity-ask",
    "supabase",
    "postgres"
  ]
}
```

**Update Server Configuration**:

1. Edit `.mcp.json` with new settings
2. Restart Claude Code to apply changes
3. Verify with `claude mcp list`

### Monitoring and Debugging

**Check MCP Status**:

```bash
# From command line
claude mcp list

# Within Claude Code
/mcp
```

**Debug MCP Issues**:

```bash
# Launch Claude with debug flag
claude --mcp-debug

# Check for configuration errors
claude --debug
```

**View Permissions**:

```bash
# Within Claude Code
/permissions
```

## Performance Optimization

### Token Efficiency

Critical for AI context window management:

1. **Response Optimization**: Minimize JSON payload sizes
2. **Selective Field Returns**: Only return required data
3. **Pagination**: Implement for large datasets
4. **Caching**: Multi-level caching for repeated queries

### Parallel Execution

Achieving 3-5x performance improvements:

```javascript
// Parallel MCP tool calls
const results = await Promise.all([
    mcpClient.callTool('supabase', { operation: 'list_tables' }),
    mcpClient.callTool('postgres', { query: 'SELECT...' }),
    mcpClient.callTool('perplexity', { question: '...' })
]);
```

### Resource Management

```yaml
# Container resource limits
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 256M
```

## Current MCP Server Configuration

### Active Servers in SlideHeroes

The following 8 MCP servers are configured in `.mcp.json`:

1. **exa** - Web search via Exa API
   - Command: `npx -y exa-mcp`
   - Purpose: Advanced web search capabilities

2. **perplexity-ask** - Perplexity AI integration
   - Command: `npx -y server-perplexity-ask`
   - Purpose: AI-powered Q&A and research

3. **supabase** - Supabase management
   - Command: `npx -y @supabase/mcp-server-supabase@latest`
   - Purpose: Database and auth management

4. **context7** - Documentation retrieval
   - Command: `npx -y @upstash/context7-mcp`
   - Purpose: Up-to-date library documentation

5. **cloudflare-playwright** - Browser automation
   - Command: `npx -y mcp-remote https://slideheroes-playwright-mcp.slideheroes.workers.dev/sse`
   - Purpose: Playwright testing via Workers

6. **postgres** - PostgreSQL operations
   - Command: `npx -y @henkey/postgres-mcp-server`
   - Connection: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
   - Purpose: Direct database operations

7. **code-reasoning** - Sequential thinking
   - Command: `npx -y @mettamatt/code-reasoning`
   - Purpose: Complex problem-solving

8. **newrelic** - Application monitoring
   - Command: `uv run newrelic_mcp_server.py`
   - Purpose: Performance monitoring and observability
   - Note: Python-based server

## Claude Code Integration

### Configuration Files

**Primary Configuration** (`.mcp.json`):

```json
{
  "mcpServers": {
    "exa": {
      "command": "npx",
      "args": ["-y", "exa-mcp"],
      "env": { "EXA_API_KEY": "xxx" }
    },
    "perplexity-ask": {
      "command": "npx",
      "args": ["-y", "server-perplexity-ask"],
      "env": { "PERPLEXITY_API_KEY": "xxx" }
    },
    // ... other servers
  }
}
```

**Enablement Control** (`.claude/settings.local.json`):

```json
{
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": [
    "exa",
    "perplexity-ask",
    "supabase",
    "context7",
    "cloudflare-playwright",
    "postgres",
    "code-reasoning",
    "newrelic"
  ]
}
```

### Configuration Hierarchy

1. **`.mcp.json`** (project root) - Server definitions
2. **`.claude/settings.local.json`** - Local overrides and enablement
3. **`~/.claude.json`** - Global settings (lower priority)

### Tool Usage Patterns

**Best Practices**:

1. Batch operations when possible
2. Use appropriate timeout values
3. Handle partial failures gracefully
4. Implement retry logic with exponential backoff

## Troubleshooting

### Common Issues and Solutions

**MCP Server Not Available**:

```bash
# Check if server is configured
claude mcp list

# Verify in .mcp.json
cat .mcp.json | jq '.mcpServers."server-name"'

# Check enablement in settings
cat .claude/settings.local.json | grep enabledMcpjsonServers
```

**Server Connection Failures**:

1. Restart Claude Code to reload configuration
2. Check API keys in `.mcp.json`
3. Verify network connectivity
4. Run with debug flag: `claude --mcp-debug`

**Authentication Failures**:

1. Verify API keys are correctly set in `.mcp.json`
2. Check token format (Bearer tokens need prefix)
3. Test API keys independently
4. Review service-specific auth requirements

**Performance Issues**:

1. Check Claude Code token usage with `/cost`
2. Monitor system resources
3. Reduce number of active MCP servers
4. Check for API rate limiting

**Configuration Not Loading**:

1. Ensure `.mcp.json` is valid JSON
2. Check file permissions
3. Verify Claude Code has read access
4. Look for syntax errors in configuration

## Production Considerations

### Configuration Best Practices

**Development**:

- Store API keys in `.mcp.json` for convenience
- Use `.gitignore` to exclude sensitive files
- Enable all servers for testing

**Production**:

- Use environment variables for secrets
- Implement secret rotation policies
- Enable only required MCP servers
- Consider rate limiting and quotas

### Security Hardening

1. **Secret Management**:
   - Never commit API keys to version control
   - Use environment variable expansion
   - Implement regular key rotation
   - Audit access logs

2. **Access Control**:
   - Use project-scoped configuration
   - Require explicit trust approval
   - Implement principle of least privilege
   - Regular permission audits

### Performance Optimization

1. **Token Efficiency**:
   - Monitor usage with `/cost` command
   - Optimize MCP tool calls
   - Batch operations when possible
   - Cache frequently accessed data

2. **Resource Management**:
   - Limit concurrent MCP servers
   - Monitor system resources
   - Implement timeout policies
   - Use connection pooling where applicable

## Related Files

### Current Configuration

- `/.mcp.json`: Primary MCP server configuration
- `/.claude/settings.local.json`: Local enablement settings
- `/.claude/settings/mcp.json`: MCP settings (if exists)
- `~/.claude.json`: Global Claude Code configuration

### Legacy Docker Files (Reference Only)

- `/docker-compose.mcp.yml`: Legacy Docker orchestration
- `/.mcp-servers/*/`: Legacy container definitions
- `/scripts/mcp-status.sh`: Legacy health monitoring

### Documentation

- `/.claude/docs/systems/docker-setup.md`: Current Docker architecture
- `/CLAUDE.md`: Project-specific Claude Code instructions

## Best Practices Summary

1. **Use Claude Code's native MCP integration** for simplified management
2. **Store configuration in `.mcp.json`** at project root
3. **Never commit API keys** to version control
4. **Enable only required servers** to optimize performance
5. **Monitor token usage** with `/cost` command
6. **Use parallel MCP tool calls** for independent operations
7. **Document server purposes** and API requirements
8. **Regular security audits** of API keys and access
9. **Implement proper error handling** in tool usage
10. **Keep Claude Code updated** for latest MCP features

## Future Enhancements

1. **Environment Variable Management**: Migrate all secrets to `.env` files
2. **Custom MCP Servers**: Develop project-specific MCP servers
3. **OAuth Integration**: Implement OAuth for applicable services
4. **Caching Layer**: Add Redis caching for frequently accessed data
5. **Rate Limiting**: Implement intelligent rate limiting
6. **Monitoring Integration**: Add telemetry for MCP usage
7. **Cost Tracking**: Detailed per-server cost analysis

## See Also

- **Docker Setup**: `.claude/docs/systems/docker-setup.md` - Complete Docker container architecture
- **Portkey AI Gateway**: `.claude/docs/tools/portkey-ai-gateway.md` - AI model integration patterns
- **Docs MCP Server**: `.claude/docs/tools/docs-mcp-server.md` - Local documentation indexing
- Research Report: `/reports/research/mcp/research-mcp-comprehensive-guide-2025-09-09.md`
