---
# Identity
id: "docker-setup"
title: "Docker Setup and Container Architecture"
version: "1.0.0"
category: "systems"

# Discovery
description: "Comprehensive documentation of the SlideHeroes Docker container architecture including main app, E2E testing, and MCP servers with development workflows and troubleshooting guides"
tags: ["docker", "containers", "devcontainer", "mcp", "e2e", "orchestration", "development", "testing"]

# Relationships
dependencies: []
cross_references:
  - id: "devcontainer-codespaces"
    type: "related"
    description: "Extends devcontainer configuration with Docker services"
  - id: "mcp-servers"
    type: "related"
    description: "MCP servers run in containerized environment"
  - id: "e2e-testing"
    type: "related"
    description: "E2E testing uses dedicated container with Playwright"

# Maintenance
created: "2025-09-09"
last_updated: "2025-09-09"
author: "create-context"
---

# Docker Setup and Container Architecture

## Overview

The SlideHeroes project uses a sophisticated multi-container Docker architecture optimized for development, testing, and AI-powered workflows. The setup consists of three primary container groups:

1. **2025slideheroes** - Main development container with full toolchain
2. **2025slideheroes-e2e** - Dedicated E2E testing container with Playwright
3. **mcp-servers** - Model Context Protocol servers for AI capabilities

This architecture leverages Docker's 2024-2025 performance improvements (85x faster uploads, 71% reduced build times) and implements security best practices including multi-stage builds, non-root users, and capability controls.

## Service Architecture

### Main Application Container (`app`)

**Purpose**: Primary development environment with full Node.js toolchain

**Base Image**: `node:20`

**Key Features**:
- Full development toolset (zsh, Oh My Zsh, git-delta, ripgrep, fd, bat)
- PostgreSQL and Redis clients
- Claude Code CLI integration
- Docker-in-Docker capability
- Persistent volumes for node_modules, pnpm store, build caches

**Exposed Ports**:
- 3000-3001: Next.js dev server and HMR
- 6006: Storybook
- 9229: Node.js debugger

### E2E Testing Container (`e2e`)

**Purpose**: Isolated Playwright testing environment

**Base Image**: `mcr.microsoft.com/playwright:v1.40.0-focal`

**Key Features**:
- Pre-installed Playwright browsers (Chromium, Firefox, WebKit)
- Isolated node_modules for test dependencies
- Playwright cache volume for browser binaries
- Test-optimized Node.js configuration

**Environment**:
```yaml
NODE_ENV: test
PLAYWRIGHT_BROWSERS_PATH: /home/node/.cache/ms-playwright
CI: false
```

### MCP Servers Container Group (`mcp-servers`)

**Purpose**: Containerized AI/ML model servers for Claude integration

**Services** (11 total):
- **mcp-perplexity** (3051): Perplexity AI integration
- **mcp-supabase** (3002): Supabase management
- **mcp-context7** (3003): Context management
- **mcp-postgres** (3004): PostgreSQL operations
- **mcp-browser-tools** (3005): Browser automation
- **mcp-code-reasoning** (3006): Code analysis
- **mcp-github** (3007): GitHub integration
- **mcp-exa-proxy** (3008): Exa AI proxy
- **mcp-cloudflare-observability** (3009): CF monitoring
- **mcp-cloudflare-bindings** (3010): CF bindings
- **mcp-cloudflare-playwright** (3011): CF Playwright

**Architecture Pattern**:
- Multi-stage builds for minimal image size
- Non-root user execution (`mcpuser`)
- Health check endpoints on all services
- Automatic restart policies
- Shared network for inter-service communication

### Supporting Services

**PostgreSQL** (54322):
- Supabase-optimized PostgreSQL 17.5.1
- OrioleDB support (disabled by default in Codespaces)
- Performance tuning for development

**Redis** (6379):
- Alpine-based Redis 7
- Persistent data volume
- Append-only file for durability

**Mailhog** (1025/8025):
- SMTP server for email testing
- Web UI for email inspection

**Supabase Studio** (54321):
- Optional database management UI
- Connected to local PostgreSQL

## File Structure and Key Files

### Root Configuration Files

```
/
├── docker-compose.mcp.yml      # MCP servers orchestration
├── .dockerignore               # Build context optimization
└── .devcontainer/
    ├── devcontainer.json       # VS Code devcontainer config
    ├── docker-compose.yml      # Main services orchestration
    ├── docker-compose.codespaces.yml  # GitHub Codespaces overrides
    ├── docker-compose.local.yml       # Local development extras
    ├── Dockerfile              # Main app container
    ├── Dockerfile.e2e          # E2E testing container
    └── Dockerfile.mcp          # MCP client container
```

### MCP Server Structure

```
.mcp-servers/
├── perplexity-ask/
│   ├── Dockerfile
│   └── proxy-server.js
├── supabase/
│   ├── Dockerfile
│   └── proxy-server.js
└── [other-servers]/
    └── ...
```

### Volume Mounts

**Development Volumes**:
- `node_modules`: Isolated dependencies
- `pnpm_store`: Shared package cache
- `next_cache`: Next.js build cache
- `turbo_cache`: Turborepo cache
- `supabase_data`: Local Supabase data
- `command_history`: Shell history persistence
- `claude_config`: Claude Code configuration

**Database Volumes**:
- `postgres_data`: PostgreSQL data
- `redis_data`: Redis persistence

## Development Workflow

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/MLorneSmith/2025slideheroes.git
cd 2025slideheroes

# 2. Start all services
docker-compose -f .devcontainer/docker-compose.yml up -d

# 3. Start MCP servers
docker-compose -f docker-compose.mcp.yml up -d

# 4. Attach to main container
docker exec -it slideheroes-app zsh
```

### Daily Development

```bash
# Start development environment
docker-compose -f .devcontainer/docker-compose.yml up -d

# Run development server (inside container)
pnpm dev

# Run tests
pnpm test

# Run E2E tests
docker exec -it slideheroes-e2e pnpm test:e2e
```

### MCP Server Management

```bash
# Start all MCP services
docker-compose -f docker-compose.mcp.yml up -d

# Start specific services
docker-compose -f docker-compose.mcp.yml up mcp-perplexity mcp-github

# View logs
docker-compose -f docker-compose.mcp.yml logs -f mcp-perplexity

# Restart a service
docker-compose -f docker-compose.mcp.yml restart mcp-supabase

# Stop all services
docker-compose -f docker-compose.mcp.yml down
```

## Environment Configuration

### Network Architecture

**Bridge Network**: `slideheroes` (172.20.0.0/16)
- Isolated network for all containers
- DNS resolution between services
- Port mapping to host

**MCP Network**: `mcp-network`
- Dedicated network for MCP servers
- Service discovery by container name

### Environment Variables

**Critical Variables**:
```bash
NODE_ENV=development
POSTGRES_PASSWORD=postgres
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long
SUPABASE_ANON_KEY=[base64-encoded-jwt]
SUPABASE_SERVICE_KEY=[base64-encoded-jwt]
```

**MCP Server Credentials**:
```bash
PERPLEXITY_API_KEY=[api-key]
GITHUB_PERSONAL_ACCESS_TOKEN=[token]
EXA_API_KEY=[api-key]
MCP_AUTH_TOKEN=[bearer-token]
```

### Security Configuration

**Container Security**:
- Non-root user execution (`node` user)
- Capability restrictions
- Read-only root filesystems where possible
- Secret management via environment variables

**Network Security**:
- Isolated bridge networks
- No direct internet exposure
- Service-to-service authentication
- Health check endpoints

## Common Tasks

### Building Images

```bash
# Build with cache
docker-compose -f .devcontainer/docker-compose.yml build

# Build without cache
docker-compose -f .devcontainer/docker-compose.yml build --no-cache

# Build specific service
docker-compose -f .devcontainer/docker-compose.yml build app
```

### Database Operations

```bash
# Connect to PostgreSQL
docker exec -it slideheroes-db psql -U postgres

# Reset database
docker exec -it slideheroes-app npx supabase db reset

# Run migrations
docker exec -it slideheroes-app npx supabase migration up
```

### Debugging

```bash
# View container logs
docker logs slideheroes-app -f

# Inspect container
docker inspect slideheroes-app

# Execute commands in container
docker exec -it slideheroes-app bash -c "npm list"

# Check resource usage
docker stats
```

### Cleanup

```bash
# Stop all containers
docker-compose -f .devcontainer/docker-compose.yml down

# Remove volumes (WARNING: data loss)
docker-compose -f .devcontainer/docker-compose.yml down -v

# Prune unused resources
docker system prune -a --volumes
```

## Troubleshooting

### Container Won't Start

**Symptoms**: Container exits immediately or fails to start

**Solutions**:
1. Check logs: `docker logs [container-name]`
2. Verify port availability: `lsof -i :3000`
3. Check Docker daemon: `docker info`
4. Ensure sufficient resources: `docker system df`

### Network Connectivity Issues

**Symptoms**: Services can't communicate, timeouts

**Solutions**:
1. Verify network: `docker network ls`
2. Check DNS: `docker exec -it [container] nslookup postgres`
3. Test connectivity: `docker exec -it [container] ping postgres`
4. Recreate network: `docker-compose down && docker-compose up`

### Volume Permission Problems

**Symptoms**: Permission denied errors, can't write to volumes

**Solutions**:
1. Check ownership: `docker exec -it [container] ls -la /workspace`
2. Fix permissions: `docker exec -it [container] chown -R node:node /workspace`
3. Reset volumes: `docker-compose down -v && docker-compose up`

### MCP Server Failures

**Symptoms**: MCP servers unhealthy, connection refused

**Solutions**:
1. Check health: `docker-compose -f docker-compose.mcp.yml ps`
2. View logs: `docker-compose -f docker-compose.mcp.yml logs [service]`
3. Verify environment variables are set
4. Restart service: `docker-compose -f docker-compose.mcp.yml restart [service]`

### Performance Issues

**Symptoms**: Slow builds, high memory usage

**Solutions**:
1. Enable BuildKit: `export DOCKER_BUILDKIT=1`
2. Increase Docker resources (Docker Desktop settings)
3. Use `.dockerignore` to reduce context size
4. Clear caches: `docker builder prune`
5. Use multi-stage builds for smaller images

## Best Practices

### Image Optimization

1. **Multi-stage Builds**: Separate build and runtime environments
2. **Layer Caching**: Order Dockerfile commands by change frequency
3. **Minimal Base Images**: Use Alpine or slim variants
4. **Single Process**: One concern per container

### Security

1. **Non-root Users**: Always run as non-privileged user
2. **Secret Management**: Use Docker secrets or environment files
3. **Network Isolation**: Use custom networks, not default bridge
4. **Vulnerability Scanning**: Regular image scanning with Docker Scout

### Development Efficiency

1. **Volume Mounts**: Cache dependencies and build artifacts
2. **Hot Reload**: Configure for instant code updates
3. **Parallel Services**: Start only needed services
4. **Resource Limits**: Set memory/CPU limits to prevent resource exhaustion

### Maintenance

1. **Regular Updates**: Keep base images current
2. **Cleanup**: Prune unused images and volumes regularly
3. **Documentation**: Document all environment variables
4. **Health Checks**: Implement for all services

## Performance Optimizations

### Build Performance

- **BuildKit**: 71% faster builds with parallel execution
- **Cache Mounts**: Reuse package manager caches
- **Multi-stage**: 90% smaller final images
- **.dockerignore**: Reduce context upload time

### Runtime Performance

- **Volume Strategy**: Named volumes for persistent data
- **Network Mode**: Bridge for isolation, host for performance
- **Resource Allocation**: Appropriate CPU/memory limits
- **Storage Driver**: Use overlay2 for best performance

## Future Enhancements

1. **Kubernetes Migration**: Prepare for K8s orchestration
2. **Service Mesh**: Implement for microservices communication
3. **Observability**: Add Prometheus/Grafana monitoring
4. **CI/CD Integration**: Automated image building and testing
5. **Registry Caching**: Local registry mirror for faster pulls

## Related Files

- `/home/msmith/projects/2025slideheroes/docker-compose.mcp.yml`: MCP servers configuration
- `/home/msmith/projects/2025slideheroes/.devcontainer/docker-compose.yml`: Main services
- `/home/msmith/projects/2025slideheroes/.devcontainer/devcontainer.json`: VS Code integration
- `/home/msmith/projects/2025slideheroes/.devcontainer/scripts/`: Setup and lifecycle scripts
- `/home/msmith/projects/2025slideheroes/.dockerignore`: Build optimization

## See Also

- [[devcontainer-codespaces]]: GitHub Codespaces configuration
- [[mcp-servers]]: Model Context Protocol server details
- [[e2e-testing]]: End-to-end testing setup
- [[local-development]]: Local development workflow