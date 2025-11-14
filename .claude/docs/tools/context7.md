# Context7 MCP - Up-to-Date Code Documentation

**Purpose**: This document describes the Context7 MCP server integration, which provides AI assistants with access to up-to-date, version-specific documentation and code examples directly from source. This dramatically reduces hallucinations and outdated code generation by grounding AI responses in current documentation.

## Overview

Context7 MCP pulls up-to-date, version-specific documentation and code examples straight from the source and places them directly into your AI prompt. This eliminates the problems of outdated training data, hallucinated APIs, and generic answers for old package versions.

## Problem Statement

### Without Context7

LLMs rely on outdated or generic information about the libraries you use. You get:

- Code examples based on year-old training data
- Hallucinated APIs that don't exist
- Generic answers for old package versions

### With Context7

Context7 fetches up-to-date, version-specific documentation and code examples right into your LLM's context, providing:

- Current code examples from latest documentation
- Accurate API references that actually exist
- Version-specific guidance for the packages you use

## Usage

### Basic Usage in Claude Code

Add `use context7` to your prompt:

```
Create a basic Next.js project with app router. use context7
```

Context7 fetches up-to-date code examples and documentation right into your LLM's context.

### Workflow

1. Write your prompt naturally
2. Tell the LLM to `use context7`
3. Get working code answers

No tab-switching, no hallucinated APIs, no outdated code generations.

## Configuration

### MCP Configuration

**File**: `.mcp.json`

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

### Enablement

**File**: `.claude/settings.local.json`

```json
{
  "enabledMcpjsonServers": [
    "context7"
  ]
}
```

## Available Tools

Context7 MCP provides the following tools that LLMs can use:

### resolve-library-id

Resolves a general library name into a Context7-compatible library ID.

**Use Case**: Converting user-friendly names to standardized IDs

**Example**: "nextjs" → "next-js"

### get-library-docs

Fetches documentation for a library using a Context7-compatible library ID.

**Use Case**: Retrieving up-to-date documentation for a specific library

**Example**: Get docs for "react-19" or "typescript-5"

## Supported Libraries

Context7 supports a wide range of popular libraries and frameworks. The system automatically resolves library names to their documentation sources.

### Common Libraries

- **Frameworks**: Next.js, React, Vue, Svelte, Angular
- **Languages**: TypeScript, JavaScript
- **Styling**: Tailwind CSS, styled-components, Emotion
- **State Management**: Redux, Zustand, Jotai
- **Testing**: Jest, Vitest, Playwright, Cypress
- **Build Tools**: Vite, Webpack, Turbopack
- **And many more...**

### Adding New Libraries

Check out the [project addition guide](https://github.com/upstash/context7-mcp/blob/main/docs/adding-projects.md) to learn how to add or update your favorite libraries to Context7.

## Use Cases

1. **Learning New Libraries**: Get current examples and best practices
2. **Version Upgrades**: Access version-specific migration guides
3. **API References**: Find accurate, up-to-date API documentation
4. **Code Generation**: Generate code using current library patterns
5. **Problem Solving**: Get solutions based on latest library features

## Best Practices

1. **Be Specific**: Include library names and versions when known
2. **Verify Versions**: Ensure you're using documentation for your version
3. **Combine Context**: Use alongside other documentation sources
4. **Cache Results**: Context7 results are typically cached by Claude
5. **Regular Updates**: Library documentation is updated regularly

## Troubleshooting

### MCP Server Not Available

**Check Configuration**:
```bash
# Verify MCP configuration
cat .mcp.json | jq '.mcpServers.context7'

# Check if enabled
cat .claude/settings.local.json | jq '.enabledMcpjsonServers'
```

**Restart Claude Code** after configuration changes.

### Library Not Found

1. Check library name spelling
2. Try alternative name formats (e.g., "next.js" vs "nextjs")
3. Verify library is supported by Context7
4. Check Context7 documentation for supported libraries

### Outdated Documentation

1. Specify exact version in your query
2. Clear cache if documentation seems stale
3. Check if library has recent updates
4. Report issues to Context7 project

### Connection Issues

1. Check internet connectivity
2. Verify NPM package can be downloaded
3. Check for proxy or firewall issues
4. Review error messages in Claude Code

## Performance Considerations

1. **Response Time**: Documentation fetching adds minimal latency
2. **Token Usage**: Documentation adds to context window usage
3. **Caching**: Frequently used libraries are cached
4. **Network**: Requires internet connection for first fetch

## Requirements

- Node.js >= v18.0.0
- Cursor, Windsurf, Claude Desktop or another MCP Client
- Internet connection for documentation fetching

## Related Files

- `/.mcp.json`: MCP server configuration
- `/.claude/settings.local.json`: MCP server enablement

## See Also

- **MCP Servers**: `.claude/docs/tools/mcp-servers.md` - General MCP architecture
- **Docs MCP Server**: `.claude/docs/tools/docs-mcp-server.md` - Local documentation indexing
- **Exa Search**: `.claude/docs/tools/exa-search.md` - Web search capabilities
- Official Repository: [github.com/upstash/context7-mcp](https://github.com/upstash/context7-mcp)
- Website: [context7.ai](https://context7.ai)
