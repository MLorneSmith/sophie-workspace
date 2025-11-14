# Perplexity Ask MCP Server - Real-Time AI Research

**Purpose**: This document describes the Perplexity Ask MCP Server integration, which provides Claude with real-time web-wide research capabilities through the Sonar API. This enables comprehensive web searches with AI-powered synthesis of results.

## Overview

The Perplexity Ask MCP Server is an MCP implementation that integrates the Sonar API to provide Claude with unparalleled real-time, web-wide research capabilities. Unlike simple web searches, Perplexity synthesizes information from multiple sources and provides comprehensive, well-researched answers.

## High-Level System Architecture

```
┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────┐
│   Claude Code   │────▶│ Perplexity Ask MCP  │────▶│   Sonar API     │
│  (MCP Client)   │◀────│      Server         │◀────│  (Perplexity)   │
└─────────────────┘     └─────────────────────┘     └─────────────────┘
```

## Tools

### perplexity_ask

Engage in a conversation with the Sonar API for live web searches.

**Inputs**:
- `messages` (array): An array of conversation messages
  - Each message must include:
    - `role` (string): The role of the message (e.g., `system`, `user`, `assistant`)
    - `content` (string): The content of the message

## Configuration

### Local Installation

For the SlideHeroes project, Perplexity is configured as a local MCP server.

**File**: `.mcp.json`

```json
{
  "mcpServers": {
    "perplexity-ask": {
      "command": "npx",
      "args": ["-y", "server-perplexity-ask"],
      "env": {
        "PERPLEXITY_API_KEY": "pplx-xxx"
      }
    }
  }
}
```

**Enablement**: `.claude/settings.local.json`

```json
{
  "enabledMcpjsonServers": [
    "perplexity-ask"
  ]
}
```

### Getting a Sonar API Key

1. Sign up for a [Sonar API account](https://docs.perplexity.ai/guides/getting-started)
2. Follow the account setup instructions
3. Generate your API key from the developer dashboard
4. Add the key to your `.mcp.json` configuration

## Usage

### In Claude Code

Once configured, you can ask Claude to use Perplexity for comprehensive research:

```
Use Perplexity to research "latest trends in AI-powered code generation"
Ask Perplexity about "best practices for Next.js 15 app router"
Research using Perplexity: "TypeScript performance optimization techniques 2025"
```

### Use Cases

1. **Technical Research**: Deep dives into technical topics with multiple sources
2. **Trend Analysis**: Understanding current trends and developments
3. **Comparative Analysis**: Comparing different approaches or technologies
4. **Best Practices**: Finding consensus on recommended practices
5. **Problem Solving**: Researching solutions with context and explanations

### Advantages Over Simple Search

1. **Source Synthesis**: Combines information from multiple sources
2. **Contextual Understanding**: Provides context and explanations
3. **Up-to-Date Information**: Real-time access to current web content
4. **Citation Support**: Often includes source references
5. **Conversational Interface**: Natural language queries and responses

## API Key Management

### Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for sensitive keys
3. **Add `.mcp.json` to `.gitignore`** if it contains secrets
4. **Rotate keys regularly** for security
5. **Monitor usage** to detect unauthorized access

### Key Format

Perplexity API keys typically start with `pplx-` followed by the key string.

## Troubleshooting

### MCP Server Not Available

**Check Configuration**:
```bash
# Verify MCP configuration
cat .mcp.json | jq '.mcpServers."perplexity-ask"'

# Check if enabled
cat .claude/settings.local.json | jq '.enabledMcpjsonServers'
```

**Restart Claude Code** after configuration changes.

### API Key Issues

1. Verify API key format starts with `pplx-`
2. Check for typos in the API key
3. Ensure API key is active and not expired
4. Verify account has proper permissions
5. Check account billing status

### Connection Failures

1. Check internet connectivity
2. Verify Perplexity API service status
3. Check for rate limiting
4. Review error messages in Claude Code
5. Ensure NPM package is accessible

### Performance Issues

1. **Slow Responses**: Perplexity performs comprehensive research, which takes time
2. **Rate Limits**: Monitor API usage against your plan limits
3. **Token Usage**: Research queries consume significant tokens
4. **Cost Monitoring**: Track API usage if on a paid plan

## Performance Considerations

1. **Response Time**: Expect longer response times due to comprehensive research
2. **Token Consumption**: Research queries use more tokens than simple searches
3. **API Costs**: Monitor costs if on a usage-based pricing plan
4. **Rate Limits**: Be aware of request rate limitations
5. **Context Window**: Large research results may consume significant context

## Best Practices

1. **Specific Queries**: Frame questions clearly and specifically
2. **Appropriate Use**: Use for research that benefits from synthesis
3. **Verify Information**: Cross-check critical information
4. **Monitor Costs**: Track API usage for budget management
5. **Combine Tools**: Use alongside other MCP servers for comprehensive assistance

## Related Files

- `/.mcp.json`: MCP server configuration
- `/.claude/settings.local.json`: MCP server enablement

## See Also

- **MCP Servers**: `.claude/docs/tools/mcp-servers.md` - General MCP architecture
- **Exa Search**: `.claude/docs/tools/exa-search.md` - Alternative web search service
- **Context7**: `.claude/docs/tools/context7.md` - Documentation search service
- Official Documentation: [DeepWiki - Perplexity MCP](https://deepwiki.com/ppl-ai/modelcontextprotocol)
- Perplexity API: [docs.perplexity.ai](https://docs.perplexity.ai/guides/getting-started)
