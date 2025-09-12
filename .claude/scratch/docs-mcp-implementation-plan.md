# Docs MCP Server Implementation Plan

## Executive Summary

This plan outlines the implementation of the docs-mcp-server for the SlideHeroes project, running in **standalone mode** with **LM Studio** for embeddings, storing documentation in the home directory for cross-project sharing.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Claude Code   │────▶│ Docs MCP Server │────▶│   LM Studio     │
│   (MCP Client)  │◀────│  (Port 6280)    │◀────│  (Port 1234)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │ Documentation│
                        │   Database   │
                        │ (~/.local/)  │
                        └──────────────┘
```

## Phase 1: Prerequisites & Environment Setup

### 1.1 Verify LM Studio Setup
- **Check LM Studio Installation**: Ensure LM Studio is installed and running
- **Port Verification**: Confirm LM Studio API is accessible on port 1234
- **Model Selection**: Load recommended embedding model (Nomic Embed v1.5)

### 1.2 Install Recommended Embedding Model
**Primary Choice**: `nomic-embed-text-v1.5-GGUF` (Q4_K_M quantization)
- Download from: `nomic-ai/nomic-embed-text-v1.5-GGUF`
- File size: ~137MB
- VRAM requirement: 2-4GB
- Best balance of quality and performance for technical documentation

**Alternative (Lighter)**: `bge-base-en-v1.5-gguf` (Q4_K_M)
- Download from: `CompendiumLabs/bge-base-en-v1.5-gguf`
- File size: ~65MB
- VRAM requirement: 1-2GB
- Faster inference, slightly lower quality

### 1.3 Directory Structure
```
/home/msmith/
├── .local/share/docs-mcp-server/    # Shared database location
│   ├── docs.db                      # SQLite database
│   └── cache/                       # Document cache
└── projects/worktrees/feature-docs-mcp-server/
    ├── .mcp.json                    # MCP configuration
    ├── .claude/
    │   ├── docs/                    # Project documentation (to be indexed)
    │   └── settings.local.json      # Claude settings
    └── .mcp-servers/
        └── docs-mcp/                # Configuration scripts
```

## Phase 2: Server Configuration

### 2.1 Create Startup Script
Create `.mcp-servers/docs-mcp/start-server.sh`:
```bash
#!/bin/bash
export OPENAI_API_KEY="lmstudio"
export OPENAI_API_BASE="http://localhost:1234/v1"
export DOCS_MCP_EMBEDDING_MODEL="nomic-embed-text-v1.5"
export DOCS_MCP_TELEMETRY="false"

npx @arabold/docs-mcp-server@latest \
  --protocol http \
  --host 0.0.0.0 \
  --port 6280
```

### 2.2 Configure MCP Client (.mcp.json)
Add to `.mcp.json`:
```json
{
  "mcpServers": {
    "docs-mcp": {
      "type": "sse",
      "url": "http://localhost:6280/sse",
      "disabled": false,
      "autoApprove": ["list_docs", "search_docs"]
    }
  }
}
```

### 2.3 Enable in Claude Settings
Update `.claude/settings.local.json`:
```json
{
  "enabledMcpjsonServers": [
    // ... existing servers
    "docs-mcp"
  ]
}
```

## Phase 3: Initial Documentation Indexing

### 3.1 Priority Documentation Sources

**Local Project Documentation**:
- Source: `file:///home/msmith/projects/worktrees/feature-docs-mcp-server/.claude/docs`
- Library Name: "slideheroes-docs"
- Version: "internal"

**Core Framework Documentation**:
1. **Next.js 15**: `https://nextjs.org/docs`
2. **React 19**: `https://react.dev/reference/react`
3. **Supabase**: `https://supabase.com/docs`
4. **TypeScript 5.9**: `https://www.typescriptlang.org/docs/`

**Key Libraries**:
1. **Tailwind CSS**: `https://tailwindcss.com/docs`
2. **Zod**: `https://zod.dev`
3. **Turborepo**: `https://turbo.build/repo/docs`
4. **Playwright**: `https://playwright.dev/docs/intro`

### 3.2 Indexing Process
1. Start the docs-mcp-server
2. Access web UI at `http://localhost:6280`
3. Use "Queue New Scrape Job" form for each documentation source
4. Monitor job progress in the Job Queue
5. Verify indexed documentation via search interface

## Phase 4: Testing & Validation

### 4.1 Server Health Checks
- Verify server is running: `curl http://localhost:6280/health`
- Check MCP endpoint: `curl http://localhost:6280/sse`
- Test LM Studio connection: `curl http://localhost:1234/v1/models`

### 4.2 Claude Code Integration Test
1. Restart Claude Code after configuration
2. Run MCP command: `/mcp` to verify docs-mcp is listed
3. Test search functionality:
   ```
   Search the docs for "React useState hook"
   ```
4. Verify results include indexed React documentation

### 4.3 Performance Benchmarks
- Document indexing speed (target: <5 min per source)
- Search response time (target: <2 seconds)
- Embedding generation rate (target: >10 docs/sec)

## Phase 5: Production Setup

### 5.1 Service Management
**Option A: Systemd Service (Linux)**
```bash
# Create service file
sudo nano /etc/systemd/system/docs-mcp-server.service

# Enable and start
sudo systemctl enable docs-mcp-server
sudo systemctl start docs-mcp-server
```

**Option B: PM2 Process Manager**
```bash
pm2 start .mcp-servers/docs-mcp/start-server.sh --name docs-mcp
pm2 save
pm2 startup
```

### 5.2 Monitoring & Maintenance
- Log location: `~/.local/share/docs-mcp-server/logs/`
- Database backups: Weekly automated backup of `docs.db`
- Index updates: Schedule weekly re-indexing of external docs

### 5.3 Optimization Settings
- Cache TTL: 24 hours for external documentation
- Database vacuum: Monthly maintenance
- Embedding batch size: 32 documents

## Phase 6: Documentation Strategy

### 6.1 Documentation Organization
**Rename/Move Strategy**:
- Current: `.claude/docs/`
- Proposed: `.docs/` or `docs/internal/`
- Benefits: Clearer separation, easier discovery

### 6.2 Documentation Types
1. **API References**: Generated from TypeScript types
2. **Architecture Docs**: Markdown files in `.docs/architecture/`
3. **Component Docs**: JSDoc comments + Storybook
4. **Deployment Guides**: `.docs/deployment/`

### 6.3 Auto-indexing Workflow
- Git hook to trigger re-indexing on documentation changes
- CI/CD integration for documentation updates
- Version-specific indexing for releases

## Implementation Timeline

| Phase | Task | Duration | Dependencies |
|-------|------|----------|--------------|
| **Week 1** | | | |
| Day 1 | LM Studio setup & model installation | 2 hours | - |
| Day 1 | Server configuration & startup | 1 hour | LM Studio |
| Day 2 | Initial documentation indexing | 4 hours | Server running |
| Day 3 | Testing & validation | 2 hours | Indexed docs |
| **Week 2** | | | |
| Day 4 | Production service setup | 2 hours | Testing complete |
| Day 5 | Documentation reorganization | 1 hour | - |
| Day 6 | Monitoring & optimization | 2 hours | Production setup |
| Day 7 | Team onboarding & documentation | 1 hour | All phases |

## Risk Mitigation

### Technical Risks
1. **LM Studio Compatibility**: Test with fallback to Ollama if issues
2. **Memory Usage**: Monitor with large documentation sets
3. **Network Latency**: Consider caching strategies for remote docs

### Operational Risks
1. **Service Availability**: Implement health checks and auto-restart
2. **Data Loss**: Regular database backups
3. **Version Drift**: Scheduled documentation updates

## Success Metrics

### Immediate (Week 1)
- [ ] Server running successfully
- [ ] 5+ documentation sources indexed
- [ ] Claude Code integration working
- [ ] Search results relevant and fast

### Short-term (Month 1)
- [ ] 20+ documentation sources indexed
- [ ] Average search time <1 second
- [ ] Zero server downtime
- [ ] Team adoption >80%

### Long-term (Quarter 1)
- [ ] Automated documentation updates
- [ ] Custom project documentation integrated
- [ ] Measurable reduction in documentation lookup time
- [ ] AI code generation accuracy improvement

## Cost Analysis

### One-time Costs
- Setup time: ~15 hours
- LM Studio: Free
- Embedding models: Free (open source)

### Ongoing Costs
- Server resources: Minimal (runs locally)
- Storage: ~1-5GB for documentation database
- API costs: $0 (using local LM Studio)

### Comparison with Cloud Alternatives
- OpenAI embeddings: ~$0.02 per 1M tokens
- Estimated savings: $50-200/month for active development team

## Next Steps

1. **Immediate Actions**:
   - Install Nomic Embed v1.5 model in LM Studio
   - Create startup scripts in `.mcp-servers/docs-mcp/`
   - Configure `.mcp.json` for docs-mcp server

2. **Documentation Preparation**:
   - Audit current `.claude/docs/` content
   - Plan reorganization structure
   - Identify priority external documentation

3. **Team Communication**:
   - Announce new documentation search capability
   - Create usage guide for developers
   - Schedule training session

## Appendix A: Configuration Templates

### A.1 Complete .mcp.json Addition
```json
{
  "docs-mcp": {
    "type": "sse",
    "url": "http://localhost:6280/sse",
    "disabled": false,
    "autoApprove": [
      "list_docs",
      "search_docs",
      "get_doc_content"
    ]
  }
}
```

### A.2 Environment Variables (.env)
```bash
# LM Studio Configuration
OPENAI_API_KEY=lmstudio
OPENAI_API_BASE=http://localhost:1234/v1
DOCS_MCP_EMBEDDING_MODEL=nomic-embed-text-v1.5

# Server Configuration
DOCS_MCP_PORT=6280
DOCS_MCP_HOST=0.0.0.0
DOCS_MCP_TELEMETRY=false

# Database Location
DOCS_MCP_DATA_DIR=~/.local/share/docs-mcp-server
```

### A.3 Docker Alternative (if needed)
```yaml
version: '3.8'
services:
  docs-mcp:
    image: ghcr.io/arabold/docs-mcp-server:latest
    ports:
      - "6280:6280"
    environment:
      - OPENAI_API_KEY=lmstudio
      - OPENAI_API_BASE=http://host.docker.internal:1234/v1
      - DOCS_MCP_EMBEDDING_MODEL=nomic-embed-text-v1.5
    volumes:
      - ~/.local/share/docs-mcp-server:/data
      - ./docs:/docs:ro
    command: --protocol http --host 0.0.0.0 --port 6280
```

## Appendix B: Troubleshooting Guide

### Common Issues & Solutions

1. **LM Studio Connection Failed**
   - Verify LM Studio is running: `ps aux | grep LMStudio`
   - Check API endpoint: `curl http://localhost:1234/v1/models`
   - Ensure embedding model is loaded (not LLM)

2. **Slow Indexing Performance**
   - Reduce batch size in configuration
   - Use quantized model (Q4_K_M instead of F16)
   - Check available RAM/VRAM

3. **Search Results Not Relevant**
   - Verify correct task prefix usage (`search_document:` for Nomic)
   - Re-index with proper chunking settings
   - Consider upgrading to larger embedding model

4. **Database Location Issues**
   - Check permissions: `ls -la ~/.local/share/docs-mcp-server`
   - Ensure sufficient disk space
   - Verify path in environment variables

## Appendix C: Model Performance Comparison

| Model | Quality | Speed | Resource Usage | Recommendation |
|-------|---------|-------|----------------|----------------|
| **Nomic v1.5 (F16)** | 10/10 | 6/10 | High (4GB) | Best quality |
| **Nomic v1.5 (Q4_K_M)** | 9/10 | 8/10 | Medium (2GB) | **Recommended** |
| **BGE Base (Q4_K_M)** | 8/10 | 9/10 | Low (1GB) | Fast alternative |
| **BGE Small (Q4_K_M)** | 7/10 | 10/10 | Very Low (<1GB) | Resource-constrained |

---

**Document Version**: 1.0
**Last Updated**: 2025-01-11
**Author**: Claude Code Assistant
**Status**: Ready for Implementation