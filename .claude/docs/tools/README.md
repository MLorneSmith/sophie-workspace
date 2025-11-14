# Tools Documentation

External services, CLI references, MCP servers, and specialized utilities for SlideHeroes development.

## Overview

This directory contains documentation for command-line tools, external service integrations, MCP (Model Context Protocol) servers, and development utilities that enhance the SlideHeroes development workflow.

## Files in This Category

### Command Line Tools

#### [cli-references.md](./cli-references.md)
Overview of all CLI tools with quick reference links to detailed documentation and project-specific commands.

**When to use**: Quick reference for commands, finding the right tool, project scripts overview.

#### [supabase-cli.md](./supabase-cli.md)
Complete Supabase CLI reference including setup, database commands, migration workflow, and troubleshooting.

**When to use**: Managing Supabase locally, running migrations, generating types, debugging database issues.

#### [vercel-cli.md](./vercel-cli.md)
Complete Vercel CLI reference for deployment, environment management, and monorepo configuration.

**When to use**: Deploying to Vercel, managing environments, configuring projects, pulling env vars.

### MCP Servers

#### [mcp-servers.md](./mcp-servers.md)
MCP server architecture and all 8 active servers (Exa, Perplexity, Context7, etc.) with configuration and troubleshooting.

**When to use**: Setting up MCP servers, understanding capabilities, configuring integrations, troubleshooting connections.

#### [docs-mcp-server.md](./docs-mcp-server.md)
Local documentation indexing with LM Studio for offline documentation access and semantic search.

**When to use**: Setting up local docs, indexing documentation, searching offline, managing doc collections.

### AI Services

#### [portkey-ai-gateway.md](./portkey-ai-gateway.md)
Comprehensive AI gateway implementation guide for routing, caching, fallbacks, and prompt management.

**When to use**: Configuring AI gateway, implementing fallbacks, managing prompts, optimizing costs, tracking usage.

#### [exa-search.md](./exa-search.md)
AI-powered web search integration for semantic search and content discovery.

**When to use**: Implementing semantic search, finding relevant content, research automation.

#### [perplexity.md](./perplexity.md)
Real-time AI research capabilities with up-to-date information retrieval.

**When to use**: Getting current information, fact-checking, research tasks, real-time data.

#### [context7.md](./context7.md)
Up-to-date documentation retrieval for libraries and frameworks with version-specific docs.

**When to use**: Fetching library docs, checking API references, getting up-to-date examples.

### Version Control

#### [git-aliases.md](./git-aliases.md)
Custom Git shortcuts and automation for common workflows.

**When to use**: Improving Git workflow, learning custom aliases, automating repetitive tasks.

## Common Workflows

### Local Development Setup

1. [supabase-cli.md](./supabase-cli.md) - Install and start Supabase
2. [mcp-servers.md](./mcp-servers.md) - Configure MCP servers
3. [git-aliases.md](./git-aliases.md) - Set up Git shortcuts
4. [cli-references.md](./cli-references.md) - Learn project commands

### Deploying to Production

1. [vercel-cli.md](./vercel-cli.md) - Deploy with Vercel CLI
2. [supabase-cli.md](./supabase-cli.md) - Run production migrations
3. See also: [../infrastructure/vercel-deployment.md](../infrastructure/vercel-deployment.md)

### Research & Documentation

1. [perplexity.md](./perplexity.md) - Current information
2. [context7.md](./context7.md) - Library documentation
3. [exa-search.md](./exa-search.md) - Semantic search
4. [docs-mcp-server.md](./docs-mcp-server.md) - Local docs

### AI Integration

1. [portkey-ai-gateway.md](./portkey-ai-gateway.md) - Set up gateway
2. [mcp-servers.md](./mcp-servers.md) - Configure MCP tools
3. Configure fallbacks and caching
4. Monitor usage and costs

## Prerequisites

Before using these tools:

- **Required reading**: [CLAUDE.md](./../../CLAUDE.md) for project conventions
- **Installation**: Node.js, pnpm, Docker Desktop
- **Access**: Supabase account, Vercel account, API keys for services
- **Configuration**: Environment variables set up

## Tool Categories

### Essential CLI Tools

| Tool | Purpose | Install Command |
|------|---------|-----------------|
| **Supabase CLI** | Database, auth, migrations | `npm install -g supabase` |
| **Vercel CLI** | Deployment, env management | `npm install -g vercel` |
| **pnpm** | Package management | `npm install -g pnpm` |

### MCP Servers (8 Active)

| Server | Purpose | Documentation |
|--------|---------|---------------|
| **Exa** | AI-powered semantic search | [exa-search.md](./exa-search.md) |
| **Perplexity** | Real-time research | [perplexity.md](./perplexity.md) |
| **Context7** | Library documentation | [context7.md](./context7.md) |
| **Docs MCP** | Local doc indexing | [docs-mcp-server.md](./docs-mcp-server.md) |
| **+4 more** | Various integrations | [mcp-servers.md](./mcp-servers.md) |

### AI Services

| Service | Purpose | Documentation |
|---------|---------|---------------|
| **Portkey** | AI gateway & routing | [portkey-ai-gateway.md](./portkey-ai-gateway.md) |
| **Exa Search** | Semantic web search | [exa-search.md](./exa-search.md) |
| **Perplexity** | Real-time AI research | [perplexity.md](./perplexity.md) |
| **Context7** | Documentation retrieval | [context7.md](./context7.md) |

## Quick Reference

### Most Used Commands

```bash
# Supabase
supabase start              # Start local Supabase
supabase migration up       # Apply migrations
supabase db diff -f name    # Create migration
supabase gen types          # Generate TypeScript types

# Vercel
vercel                      # Deploy preview
vercel --prod               # Deploy production
vercel env pull             # Pull environment variables

# Project Scripts
pnpm dev                    # Start development
pnpm build                  # Build for production
pnpm test                   # Run all tests
pnpm lint:fix               # Fix linting issues
```

See [cli-references.md](./cli-references.md) for complete project command reference.

### Environment Variables

Key environment variables for external services:

```bash
# Supabase (see supabase-cli.md)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Services (see individual docs)
PORTKEY_API_KEY=
EXA_API_KEY=
PERPLEXITY_API_KEY=
CONTEXT7_API_KEY=
```

## Configuration

### MCP Server Setup

1. Install MCP CLI: `npm install -g @modelcontextprotocol/cli`
2. Configure servers in `~/.config/mcp/config.json`
3. Set API keys in environment variables
4. Test connections: `mcp test [server-name]`

See [mcp-servers.md](./mcp-servers.md) for detailed setup.

### CLI Tool Setup

1. Install tools globally or per-project
2. Authenticate: `supabase login`, `vercel login`
3. Link projects: `supabase link`, `vercel link`
4. Pull configuration: `vercel env pull`

## Troubleshooting

### Common Issues

| Issue | Solution | Reference |
|-------|----------|-----------|
| Supabase won't start | Check Docker, ports 54321-54324 | [supabase-cli.md](./supabase-cli.md) |
| Vercel deploy fails | Check build logs, env vars | [vercel-cli.md](./vercel-cli.md) |
| MCP server timeout | Check API keys, network | [mcp-servers.md](./mcp-servers.md) |
| Git aliases not working | Check shell config | [git-aliases.md](./git-aliases.md) |

### Getting Help

1. Check the specific tool's documentation file
2. Review [cli-references.md](./cli-references.md) for project commands
3. Consult official tool documentation
4. Check GitHub issues for known problems

## Related Documentation

- **Development**: [../development/](../development/) - Feature implementation
- **Testing**: [../testing+quality/](../testing+quality/) - Testing workflows
- **Infrastructure**: [../infrastructure/](../infrastructure/) - Deployment and CI/CD

## Best Practices

### CLI Usage

- **Use project scripts**: Prefer `pnpm dev` over direct CLI commands
- **Check status first**: Run `git status`, `supabase status` before operations
- **Commit regularly**: Small, frequent commits with good messages
- **Pull before push**: Always `git pull` before `git push`

### API Keys

- **Never commit**: Use `.env.local` for local development
- **Use secret stores**: Vercel/Supabase for production
- **Rotate regularly**: Change keys periodically
- **Least privilege**: Use read-only keys when possible

### MCP Servers

- **Start needed servers**: Don't run all 8 if not needed
- **Monitor usage**: Track API calls and costs
- **Cache responses**: Reduce redundant API calls
- **Handle failures**: Implement timeouts and fallbacks

## Advanced Usage

### Custom Scripts

Create custom npm scripts in `package.json`:

```json
{
  "scripts": {
    "db:reset": "pnpm supabase:web:reset && pnpm supabase:web:typegen",
    "deploy:preview": "vercel",
    "deploy:prod": "vercel --prod"
  }
}
```

### Git Workflow Automation

See [git-aliases.md](./git-aliases.md) for custom aliases that automate:
- Branch creation with proper naming
- Commit message formatting
- Pull request creation
- Upstream syncing

### AI Service Optimization

See [portkey-ai-gateway.md](./portkey-ai-gateway.md) for:
- Request caching strategies
- Fallback configurations
- Cost optimization
- Usage analytics

---

*Last updated: 2025-11-14*
