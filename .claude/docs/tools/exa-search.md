# Exa MCP Server - AI-Powered Web Search

**Purpose**: This document describes the Exa MCP Server integration, which provides AI assistants like Claude with real-time web search capabilities through the Exa AI Search API. This enables the AI to access current information beyond its training data cutoff.

## Overview

The Exa MCP Server is a Model Context Protocol (MCP) server that lets AI assistants use the Exa AI Search API for web searches. This setup allows AI models to get real-time web information in a safe and controlled way.

## Remote Exa MCP

Connect directly to Exa's hosted MCP server (instead of running it locally).

### Remote Exa MCP URL

```
https://mcp.exa.ai/mcp?exaApiKey=your-exa-api-key
```

Replace `your-exa-api-key` with your actual Exa API key from [dashboard.exa.ai/api-keys](https://dashboard.exa.ai/api-keys).

### Claude Desktop Configuration for Remote MCP

Add this to your Claude Desktop configuration file (`.mcp.json`):

```json
{
  "mcpServers": {
    "exa": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.exa.ai/mcp?exaApiKey=your-exa-api-key"
      ]
    }
  }
}
```

## Local Exa MCP Server

For the SlideHeroes project, Exa is configured as a local MCP server.

### Configuration

**File**: `.mcp.json`

```json
{
  "mcpServers": {
    "exa": {
      "command": "npx",
      "args": ["-y", "exa-mcp"],
      "env": {
        "EXA_API_KEY": "your-exa-api-key"
      }
    }
  }
}
```

**Enablement**: `.claude/settings.local.json`

```json
{
  "enabledMcpjsonServers": [
    "exa"
  ]
}
```

## Usage

### In Claude Code

Once configured, you can ask Claude to search the web using Exa:

```
Search the web for "latest Next.js 15 features"
Find recent articles about "React Server Components"
Look up "TypeScript 5.9 release notes"
```

Claude will automatically use the Exa MCP server to perform web searches and incorporate the results into its responses.

### Use Cases

1. **Technical Research**: Find up-to-date documentation and articles
2. **News and Updates**: Get current information about libraries and frameworks
3. **Problem Solving**: Search for solutions to specific technical issues
4. **Best Practices**: Find recent discussions and recommendations

## API Key Management

### Getting an API Key

1. Go to [dashboard.exa.ai](https://dashboard.exa.ai)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Generate a new API key
5. Copy the key to your configuration

### Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for sensitive keys
3. **Add `.mcp.json` to `.gitignore`** if it contains secrets
4. **Rotate keys regularly** for security
5. **Use project-scoped keys** when possible

## Troubleshooting

### MCP Server Not Available

**Check Configuration**:
```bash
# Verify MCP configuration
cat .mcp.json | jq '.mcpServers.exa'

# Check if enabled
cat .claude/settings.local.json | jq '.enabledMcpjsonServers'
```

**Restart Claude Code** after configuration changes.

### API Key Issues

1. Verify API key is correct and active
2. Check for typos in the API key
3. Ensure API key has proper permissions
4. Verify account is in good standing

### Connection Failures

1. Check internet connectivity
2. Verify Exa API service status
3. Check for rate limiting
4. Review error messages in Claude Code

## Performance Considerations

1. **Rate Limits**: Be aware of API rate limits
2. **Token Usage**: Web searches consume AI tokens for processing results
3. **Response Time**: Web searches add latency to responses
4. **Cost**: Monitor API usage if on a paid plan

## Related Files

- `/.mcp.json`: MCP server configuration
- `/.claude/settings.local.json`: MCP server enablement

## See Also

- **MCP Servers**: `.claude/docs/tools/mcp-servers.md` - General MCP architecture
- **Perplexity**: `.claude/docs/tools/perplexity.md` - Alternative AI search service
- **Context7**: `.claude/docs/tools/context7.md` - Documentation search service
- Official Documentation: [Exa MCP Server on npm](https://www.npmjs.com/package/exa-mcp-server)
- Exa API Documentation: [dashboard.exa.ai/api-keys](https://dashboard.exa.ai/api-keys)
