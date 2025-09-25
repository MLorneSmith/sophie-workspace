# Issue: Docs MCP Server Integration Not Working in Claude Code

**ID**: ISSUE-[pending]
**Created**: 2025-09-12T12:12:00-05:00
**Reporter**: User
**Severity**: high
**Status**: new
**Type**: integration

## Summary

The docs-mcp-server MCP integration is not functioning properly in Claude Code. While the Docker container is running, the web interface is accessible, and document retrieval/chunking with embeddings works through the web interface at `http://localhost:6280`, Claude Code is unable to read any documents via the MCP protocol. MCP tool calls appear to hang indefinitely when invoked from Claude Code.

## Environment

- **Application Version**: 2025slideheroes (dev branch)
- **Environment**: development
- **Browser**: N/A (Claude Code CLI)
- **Node Version**: Not specified
- **Database**: SQLite (docs-mcp-server internal)
- **Last Working**: Never worked (initial setup)
- **Git Commit**: e3e40a87 (refactor: reorganize context inventory system with updated scripts)

## Reproduction Steps

1. Start LM Studio with text-embedding-qwen3-embedding-4b model loaded
2. Start docs-mcp-server Docker container with proper configuration
3. Verify web interface works at `http://localhost:6280`
4. Restart Claude Code to load MCP configuration
5. Attempt to use MCP tools like `mcp__docs-mcp__list_libraries`
6. Tool call hangs indefinitely without response

## Expected Behavior

MCP tools should successfully communicate with the docs-mcp-server and return results. For example:

- `list_libraries` should return indexed documentation libraries
- `search_docs` should search and return relevant documentation
- `scrape_docs` should queue indexing jobs

## Actual Behavior

- MCP tool calls hang indefinitely when invoked from Claude Code
- No response or error message is returned
- The Docker container logs show normal activity (scraping documents)
- Web interface at `http://localhost:6280` works correctly

## Diagnostic Data

### System Status

```text
Branch: dev
Last Commit: e3e40a87 refactor: reorganize context inventory system with updated scripts
Timestamp: Fri Sep 12 12:11:45 PM EDT 2025
```

### Docker Container Status

```text
Container ID: 3989b8d43916
Image: ghcr.io/arabold/docs-mcp-server:latest
Status: Up 3 hours
Ports: 0.0.0.0:6280->6280/tcp, [::]:6280->6280/tcp
Container Name: docs-mcp-server
```

### Network Connectivity

- Web Interface (HTTP): ✅ Accessible at `http://localhost:6280`
- SSE Endpoint: ✅ Returns 200 OK with session ID
- LM Studio: ✅ Accessible at `http://172.31.160.1:1234/v1`
- Embedding Models Available: text-embedding-qwen3-embedding-4b, text-embedding-nomic-embed-text-v1.5

### MCP Configuration (.mcp.json)

```json
"docs-mcp": {
  "type": "sse",
  "url": "http://localhost:6280/sse",
  "disabled": false,
  "autoApprove": ["list_docs", "search_docs", "get_doc_content"]
}
```

### Claude Settings (.claude/settings.local.json)

```json
"enabledMcpjsonServers": [
  "exa",
  "perplexity-ask",
  "context7",
  "postgres",
  "code-reasoning",
  "newrelic",
  "docs-mcp"
]
```

### Docker Container Logs (Recent Activity)

The container is actively processing documents and appears to be functioning normally:

- Successfully scraping and chunking documents from various sources
- Splitting documents into appropriate chunks
- Some Playwright rendering errors for certain pages (expected for some sites)
- Search attempts show "Library 'makerkit' not found" indicating the search functionality works

### MCP Protocol Testing

Direct HTTP endpoint testing reveals:

1. Server requires both `application/json` and `text/event-stream` Accept headers
2. Returns SSE (Server-Sent Events) format for responses
3. Method "mcp/list_tools" returns "Method not found" error
4. The server appears to use a different protocol format than expected

## Error Stack Traces

No explicit error messages in Claude Code - the tool calls simply hang without response.

## Related Code

- **Affected Files**:
  - `.mcp.json` - MCP server configuration
  - `.claude/settings.local.json` - Claude Code settings
  - `.claude/context/systems/docs-mcp-server.md` - System documentation
  
- **Recent Changes**: Initial setup of docs-mcp-server integration
- **Suspected Components**: MCP SSE protocol implementation in Claude Code

## Related Issues & Context

### Potential Root Causes

1. **Protocol Mismatch**: The server uses SSE (Server-Sent Events) but Claude Code may not be handling the SSE protocol correctly
2. **Method Names**: The MCP method names may be different than what Claude Code expects
3. **Authentication/Headers**: Missing or incorrect headers in Claude Code's MCP client
4. **Timeout Issues**: SSE connections may be timing out without proper keep-alive handling

### Similar Symptoms

This appears to be a new integration, so no prior issues exist. However, the symptoms suggest:

- Communication protocol mismatch between client and server
- Possible incompatibility with the SSE transport type in Claude Code

## Initial Analysis

Based on the diagnostic data:

1. **Infrastructure is Working**: Docker container, LM Studio, and web interface all function correctly
2. **Configuration Appears Correct**: Both .mcp.json and Claude settings have proper entries
3. **Protocol Issue Likely**: The SSE endpoint responds but Claude Code cannot properly communicate with it
4. **Not a Network Issue**: Local connectivity is confirmed working

The issue appears to be specifically with how Claude Code handles the SSE-based MCP protocol for this server. The server is expecting SSE communication patterns that may not be fully supported or properly implemented in Claude Code's MCP client.

## Suggested Investigation Areas

1. Verify Claude Code's SSE MCP client implementation supports the docs-mcp-server protocol
2. Check if there are alternative connection methods (stdio vs SSE vs HTTP)
3. Review the docs-mcp-server source code for exact MCP method names and parameters
4. Test with a simpler MCP configuration or different transport type
5. Check Claude Code logs for any hidden error messages about MCP connections
6. Consider if the autoApprove array needs different method names

## Additional Context

- Repository with source code available at: `/home/msmith/projects/docs-mcp-server`
- The server successfully indexes and searches documents via web interface
- This is a critical integration for AI-assisted documentation search
- The setup follows the official documentation from the docs-mcp-server README

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash, Read, ListMcpResourcesTool, mcp__docs-mcp__list_libraries*
*Session Type: Diagnostic investigation for MCP integration issue*
