---
# Identity
id: "docs-mcp-server"
title: "Docs MCP Server - AI Documentation Search System"
version: "1.0.0"
category: "systems"

# Discovery
description: "Local documentation indexing and search system using docs-mcp-server with LM Studio embeddings for enhanced AI code generation accuracy"
tags: ["mcp", "documentation", "embeddings", "lm-studio", "search", "ai-context", "local-llm"]

# Relationships
dependencies: ["mcp-servers", "docker-setup"]
cross_references:
  - id: "mcp-servers"
    type: "extends"
    description: "Docs MCP server is part of the broader MCP ecosystem"
  - id: "docker-setup"
    type: "uses"
    description: "Runs as Docker container for isolation"
  - id: "lm-studio"
    type: "requires"
    description: "Uses LM Studio for local embedding generation"

# Maintenance
created: "2025-09-12"
last_updated: "2025-09-12"
author: "Claude Code Assistant"
revised: "2025-09-12 - Initial setup with LM Studio and Docker deployment"
---

# Docs MCP Server - AI Documentation Search System

## Overview

The Docs MCP Server provides an intelligent documentation search and retrieval system that enables AI assistants to access up-to-date, version-specific documentation from multiple sources. It uses local LM Studio embeddings for privacy and cost efficiency, storing indexed documentation in a persistent SQLite database that can be shared across projects.

This system dramatically reduces AI hallucinations by grounding responses in actual documentation, provides version-aware search capabilities, and ensures data privacy through local processing.

## Architecture

### System Components

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Claude Code   │────▶│ Docs MCP Server │────▶│   LM Studio     │
│  (MCP Client)   │◀────│   (Port 6280)   │◀────│  (Port 1234)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Documentation DB     │
                    │ ~/.local/share/       │
                    │ docs-mcp-server/      │
                    └──────────────────────┘
```

### Component Details

**Docs MCP Server (Docker Container)**:
- **Image**: `ghcr.io/arabold/docs-mcp-server:latest`
- **Port**: 6280 (HTTP)
- **Endpoints**:
  - Web UI: `http://localhost:6280`
  - MCP SSE: `http://localhost:6280/sse`
  - MCP HTTP: `http://localhost:6280/mcp`
- **Data Storage**: `~/.local/share/docs-mcp-server/`

**LM Studio (Windows Host)**:
- **Version**: 0.3.25+
- **API Endpoint**: `http://172.31.160.1:1234` (from WSL2)
- **Embedding Model**: `text-embedding-qwen3-embedding-4b`
- **Model Specs**:
  - Parameters: 4B
  - Context Length: 32K tokens
  - Embedding Dimensions: Up to 2560
  - Languages: 100+ supported

**Integration Points**:
- Claude Code connects via SSE protocol
- Docker container accesses LM Studio via host network
- Persistent database shared across all projects

## Configuration

### MCP Configuration (.mcp.json)

```json
{
  "docs-mcp": {
    "type": "sse",
    "url": "http://localhost:6280/sse",
    "disabled": false,
    "autoApprove": ["list_docs", "search_docs", "get_doc_content"]
  }
}
```

### Claude Settings (.claude/settings.local.json)

```json
{
  "enabledMcpjsonServers": [
    // ... other servers
    "docs-mcp"
  ]
}
```

### Docker Configuration

**Location**: `.mcp-servers/docs-mcp/docker-compose.yml`

```yaml
version: '3.8'
services:
  docs-mcp:
    image: ghcr.io/arabold/docs-mcp-server:latest
    container_name: docs-mcp-server
    ports:
      - "6280:6280"
    environment:
      - OPENAI_API_KEY=lmstudio
      - OPENAI_API_BASE=http://host.docker.internal:1234/v1
      - DOCS_MCP_EMBEDDING_MODEL=text-embedding-qwen3-embedding-4b
      - DOCS_MCP_TELEMETRY=false
    volumes:
      - ~/.local/share/docs-mcp-server:/data
      - ../../.claude/docs:/docs/slideheroes:ro
    extra_hosts:
      - "host.docker.internal:172.31.160.1"
    restart: unless-stopped
```

### LM Studio Configuration

**Requirements**:
- LM Studio running on Windows host
- "Serve on local network" enabled
- Windows Firewall allows LM Studio
- Embedding model loaded (NOT LLM model)

**Critical Limitation**: LM Studio can only run EITHER embedding models OR LLM models at once, not both simultaneously.

## Usage

### Starting the System

1. **Start LM Studio** (Windows):
   - Launch LM Studio application
   - Load `text-embedding-qwen3-embedding-4b` model
   - Go to Developer tab → Start Server
   - Enable "Serve on local network"
   - Allow Windows Firewall access

2. **Start Docs MCP Server** (WSL2):
   ```bash
   docker start docs-mcp-server
   
   # Or if not created:
   docker run -d \
     --name docs-mcp-server \
     -e OPENAI_API_KEY="lmstudio" \
     -e OPENAI_API_BASE="http://172.31.160.1:1234/v1" \
     -e DOCS_MCP_EMBEDDING_MODEL="text-embedding-qwen3-embedding-4b" \
     -e DOCS_MCP_TELEMETRY="false" \
     -v ~/.local/share/docs-mcp-server:/data \
     -p 6280:6280 \
     ghcr.io/arabold/docs-mcp-server:latest \
     --protocol http --port 6280
   ```

3. **Restart Claude Code** to load MCP configuration

### Indexing Documentation

#### Via Web Interface

1. Open http://localhost:6280
2. Click "Queue New Scrape Job"
3. Enter:
   - **Library Name**: e.g., "react", "nextjs", "slideheroes-docs"
   - **URL**: Documentation source
     - Web: `https://react.dev/reference/react`
     - Local: `file:///home/msmith/projects/worktrees/feature-docs-mcp-server/.claude/docs`
   - **Version**: Optional version string (e.g., "19.x", "15.0.0")
4. Monitor progress in Job Queue

#### Via MCP Tools (in Claude Code)

```
Please scrape the React documentation from https://react.dev/reference/react for library "react" version "19.x"
```

#### Via CLI

```bash
# List indexed libraries
docker exec docs-mcp-server node dist/index.js list

# Search documentation
docker exec docs-mcp-server node dist/index.js search react "useState hook"

# Scrape new documentation
docker exec docs-mcp-server node dist/index.js scrape nextjs https://nextjs.org/docs
```

### Searching Documentation

In Claude Code, the AI assistant can search documentation using natural language:

```
Search the docs for "React useState hook"
Search nextjs docs for "app router"
Find documentation about TypeScript generics
```

## Documentation Sources

### Priority Documentation (Minimal Start)

1. **Internal Project Docs**:
   - Source: `.claude/docs/` directory
   - Library Name: "slideheroes-docs"
   - Version: "internal"

2. **Core Frameworks**:
   - **Next.js 15**: https://nextjs.org/docs
   - **React 19**: https://react.dev/reference/react
   - **TypeScript 5.9**: https://www.typescriptlang.org/docs/

3. **Essential Libraries** (add gradually):
   - **Supabase**: https://supabase.com/docs
   - **Tailwind CSS**: https://tailwindcss.com/docs
   - **Zod**: https://zod.dev
   - **Playwright**: https://playwright.dev/docs/intro

### Local File Indexing

For local documentation:
- Use `file://` protocol
- Absolute paths required
- All text/* MIME types processed
- Example: `file:///home/msmith/projects/docs/api-reference`

## Management

### Service Commands

```bash
# Container Management
docker start docs-mcp-server       # Start server
docker stop docs-mcp-server        # Stop server
docker restart docs-mcp-server     # Restart server
docker rm -f docs-mcp-server       # Remove container (data persists)

# Monitoring
docker logs -f docs-mcp-server     # View logs
docker ps | grep docs-mcp          # Check status

# Database Management
ls -la ~/.local/share/docs-mcp-server/  # Check database files
du -sh ~/.local/share/docs-mcp-server/  # Check storage usage
```

### LM Studio Commands

```bash
# Test LM Studio connectivity (from WSL2)
curl -s http://172.31.160.1:1234/v1/models | jq '.'

# Test embedding generation
curl -X POST http://172.31.160.1:1234/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model": "text-embedding-qwen3-embedding-4b", "input": "test"}'
```

### Backup and Recovery

```bash
# Backup documentation database
tar -czf docs-mcp-backup-$(date +%Y%m%d).tar.gz \
  -C ~/.local/share docs-mcp-server/

# Restore from backup
tar -xzf docs-mcp-backup-20250912.tar.gz \
  -C ~/.local/share/
```

## Troubleshooting

### Common Issues

#### LM Studio Connection Failed

**Symptoms**: "LM Studio is not accessible" error

**Solutions**:
1. Ensure LM Studio is running on Windows
2. Enable "Serve on local network" in LM Studio
3. Allow Windows Firewall access when prompted
4. Load an embedding model (unload any LLM models)
5. Verify connectivity:
   ```bash
   curl -s http://172.31.160.1:1234/v1/models
   ```

#### Container Won't Start

**Symptoms**: Container exits immediately

**Solutions**:
1. Check logs: `docker logs docs-mcp-server`
2. Verify port 6280 is available: `lsof -i :6280`
3. Ensure Docker is running: `docker info`
4. Check disk space: `df -h`

#### Embedding Generation Fails

**Symptoms**: Indexing jobs fail with embedding errors

**Solutions**:
1. Verify only embedding model is loaded in LM Studio
2. Check model name matches configuration
3. Ensure sufficient RAM/VRAM for model
4. Test embedding endpoint directly:
   ```bash
   curl -X POST http://172.31.160.1:1234/v1/embeddings \
     -H "Content-Type: application/json" \
     -d '{"model": "text-embedding-qwen3-embedding-4b", "input": "test"}'
   ```

#### Claude Code Not Finding Docs MCP

**Symptoms**: MCP server not listed in Claude Code

**Solutions**:
1. Restart Claude Code after configuration changes
2. Verify `.mcp.json` has correct configuration
3. Check `.claude/settings.local.json` includes "docs-mcp"
4. Test MCP endpoint: `curl http://localhost:6280/sse`

### Debug Commands

```bash
# Full system check
echo "=== LM Studio Check ===" && \
curl -s --max-time 2 http://172.31.160.1:1234/v1/models && \
echo -e "\n=== Docker Check ===" && \
docker ps | grep docs-mcp && \
echo -e "\n=== MCP Server Check ===" && \
curl -s --max-time 2 http://localhost:6280/ | head -5 && \
echo -e "\n=== Database Check ===" && \
ls -la ~/.local/share/docs-mcp-server/*.db 2>/dev/null || echo "No database yet"
```

## Performance Optimization

### Indexing Optimization

1. **Batch Processing**: Index related documentation together
2. **Off-Peak Indexing**: Run large indexing jobs during low activity
3. **Version Control**: Only index versions you actively use
4. **Selective Indexing**: Focus on reference docs, not tutorials

### Search Optimization

1. **Specific Queries**: Use library names in searches
2. **Version Targeting**: Specify versions when known
3. **Caching**: Frequently accessed docs are cached
4. **Token Efficiency**: Server optimizes response size

### Resource Management

1. **Database Maintenance**:
   ```bash
   # Vacuum database monthly
   docker exec docs-mcp-server sqlite3 /data/docs.db "VACUUM;"
   ```

2. **Storage Monitoring**:
   ```bash
   # Check database size
   du -sh ~/.local/share/docs-mcp-server/
   ```

3. **Container Resources**:
   - Memory: ~512MB typical usage
   - CPU: Minimal except during indexing
   - Storage: 1-5GB depending on indexed docs

## Security Considerations

### Data Privacy

- **Local Processing**: All embeddings generated locally
- **No Cloud Dependencies**: Runs entirely on local infrastructure
- **Isolated Storage**: Database stored in user home directory
- **Read-Only Mounts**: Project docs mounted read-only

### Network Security

- **Local Only**: Server binds to localhost
- **WSL2 Isolation**: Container runs in WSL2 network namespace
- **Windows Firewall**: LM Studio requires explicit firewall approval
- **No Internet Requirement**: Can operate fully offline

### API Security

- **No Authentication**: Local-only deployment doesn't require auth
- **API Key Placeholder**: "lmstudio" used as placeholder
- **Telemetry Disabled**: No usage data sent externally

## Best Practices

### Documentation Management

1. **Start Small**: Begin with essential documentation only
2. **Version Discipline**: Index specific versions you use
3. **Regular Updates**: Re-index documentation weekly/monthly
4. **Local First**: Prioritize local project documentation
5. **Clean Obsolete**: Remove outdated versions periodically

### Integration Patterns

1. **Development Workflow**:
   - Start LM Studio with workspace
   - Docs MCP server auto-starts with Docker
   - Claude Code connects automatically

2. **Documentation Updates**:
   - Monitor library updates
   - Re-index after major version changes
   - Test search results after indexing

3. **Team Collaboration**:
   - Share database for consistency
   - Document indexed sources
   - Maintain version alignment

## Future Enhancements

### Planned Improvements

1. **Automated Indexing**: Git hooks for documentation updates
2. **Multi-Model Support**: Ollama integration as fallback
3. **Incremental Updates**: Delta indexing for large docs
4. **Search Analytics**: Track most-searched documentation
5. **Team Sync**: Shared documentation database server

### Alternative Configurations

1. **Ollama Backend**:
   ```bash
   OPENAI_API_BASE="http://localhost:11434/v1"
   DOCS_MCP_EMBEDDING_MODEL="nomic-embed-text"
   ```

2. **OpenAI Embeddings** (cloud):
   ```bash
   OPENAI_API_KEY="sk-..."
   DOCS_MCP_EMBEDDING_MODEL="text-embedding-3-small"
   ```

3. **Standalone Mode** (no Docker):
   ```bash
   npx @arabold/docs-mcp-server@latest --protocol http --port 6280
   ```

## Related Files

### Configuration Files
- `/.mcp.json`: MCP server configuration
- `/.claude/settings.local.json`: Claude Code settings
- `/.mcp-servers/docs-mcp/docker-compose.yml`: Docker orchestration
- `/.mcp-servers/docs-mcp/start-server.sh`: Startup script

### Data Storage
- `~/.local/share/docs-mcp-server/docs.db`: SQLite database
- `~/.local/share/docs-mcp-server/cache/`: Document cache
- `~/.local/share/docs-mcp-server/logs/`: Server logs

### Documentation Sources
- `/.claude/docs/`: Local project documentation
- External: Various documentation websites

## See Also

- [[mcp-servers]]: General MCP server architecture
- [[docker-setup]]: Docker container configuration
- [[enhanced-logger]]: Logging patterns for debugging
- GitHub Repository: https://github.com/arabold/docs-mcp-server
- LM Studio: https://lmstudio.ai/