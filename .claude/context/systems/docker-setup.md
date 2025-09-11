---
# Identity
id: "docker-setup"
title: "Docker Setup and Container Architecture"
version: "1.0.0"
category: "systems"

# Discovery
description: "Documentation of SlideHeroes hybrid Docker architecture with Supabase CLI services, MCP servers, host-based development, and containerized testing with workflows and troubleshooting"
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
revised: "2025-09-11 - Removed MCP servers container, now using native Claude Code MCP integration"
---

# Docker Setup and Container Architecture

## Overview

The SlideHeroes project uses a **hybrid Docker architecture** that combines containerized services with host-based application development for optimal performance and flexibility. The setup consists of:

1. **Supabase CLI Stacks** (Not docker-compose):
   - **2025slideheroes** - Main Supabase services (database, auth, storage) on ports 54321/54322
   - **2025slideheroes-e2e** - E2E test Supabase services on ports 55321/55322

2. **Docker Compose Stacks** (Optional):
   - **app-test** (optional) - Isolated test server container on port 3001

3. **Host-Based Development**:
   - Next.js application runs directly on WSL2/macOS/Linux (not containerized)
   - Connects to containerized Supabase services
   - Provides fastest hot-reload and development experience

4. **MCP Servers** (via Claude Code):
   - Model Context Protocol servers now run natively through Claude Code
   - Configured in `.mcp.json` at project root
   - No longer require Docker containers

This hybrid approach provides the best of both worlds: fast local development with isolated, reproducible service dependencies.

## Service Architecture

### Supabase Services (Managed by Supabase CLI)

**Main Stack (`2025slideheroes`)**:
- **Database**: PostgreSQL 15.8 on port 54322
- **API Gateway**: Kong on port 54321
- **Auth**: GoTrue authentication service
- **Storage**: S3-compatible object storage
- **Realtime**: WebSocket-based realtime subscriptions
- **Studio**: Web-based database management on port 54323

**E2E Test Stack (`2025slideheroes-e2e`)**:
- Same services as main stack but on different ports:
  - API Gateway: 55321
  - Database: 55322
  - Studio: 55323
  - Mailpit: 55324-55326
- Isolated database for test data
- Separate auth tokens and JWT secrets

### Test Server Container (`app-test`)

**Purpose**: Isolated Next.js server for test execution

**Configuration** (`docker-compose.test.yml`):
- **Base Image**: `node:20-slim`
- **Port**: 3001 (avoids conflict with dev on 3000)
- **Environment**: Connects to E2E Supabase stack
- **Features**:
  - Isolated node_modules
  - Automatic pnpm installation
  - Health check endpoint
  - Can run parallel to development

### DevContainer Setup (Optional, in `.devcontainer/`)

**Note**: These containers are defined but typically not used in favor of host-based development.

**App Container** (`app`):
- Full development environment with tooling
- Defined in `.devcontainer/docker-compose.yml`
- Includes zsh, git-delta, ripgrep, etc.

**E2E Container** (`e2e`):
- Playwright testing environment
- Pre-installed browsers
- Isolated test dependencies

### MCP Servers (Now via Claude Code)

**Previous Setup**: MCP servers used to run as Docker containers via `docker-compose.mcp.yml`

**Current Setup**: MCP servers are now configured natively through Claude Code
- **Configuration**: Defined in `.mcp.json` at project root
- **Execution**: Managed directly by Claude Code using `npx` commands
- **Authentication**: API keys stored in `.mcp.json` (consider environment variables for production)

**Available MCP Servers** (12 total):
- **exa**: Web search via Exa API
- **perplexity-ask**: Perplexity AI for questions
- **supabase**: Database management
- **context7**: Documentation retrieval
- **cloudflare-bindings**: Cloudflare services
- **cloudflare-playwright**: Browser automation
- **postgres**: PostgreSQL database operations
- **browser-tools**: Browser debugging tools
- **code-reasoning**: Sequential thinking
- **github**: GitHub API operations
- **newrelic**: Monitoring/observability (Python-based)

**Note**: The `docker-compose.mcp.yml` file remains in the project for reference but is no longer actively used.

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
├── .mcp.json                   # MCP servers configuration (Claude Code)
├── docker-compose.mcp.yml      # Legacy MCP servers orchestration (not in use)
├── docker-compose.test.yml     # Test server container configuration
├── .dockerignore               # Build context optimization
└── .devcontainer/
    ├── devcontainer.json       # VS Code devcontainer config
    ├── docker-compose.yml      # Main services orchestration
    ├── docker-compose.codespaces.yml  # GitHub Codespaces overrides
    ├── docker-compose.local.yml       # Local development extras
    ├── Dockerfile              # Main app container
    ├── Dockerfile.e2e          # E2E testing container
    └── Dockerfile.mcp          # Legacy MCP client container (not in use)
```

### MCP Server Structure (Legacy - Not in Use)

```
.mcp-servers/              # Legacy Docker-based MCP servers (kept for reference)
├── perplexity-ask/
│   ├── Dockerfile
│   └── proxy-server.js
├── supabase/
│   ├── Dockerfile
│   └── proxy-server.js
└── [other-servers]/
    └── ...

.mcp.json                  # Current MCP configuration (Claude Code)
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

# 2. Install dependencies on host
pnpm install

# 3. Start Supabase services
npx supabase start  # Main stack on ports 54321/54322

# 4. Start E2E Supabase services (in apps/e2e directory)
cd apps/e2e && npx supabase start  # E2E stack on ports 55321/55322

# 5. Configure MCP servers (for AI features)
# MCP servers are now managed by Claude Code via .mcp.json
# No Docker commands needed - they run automatically when Claude Code starts

# 6. Start development server on host
pnpm dev  # Runs on port 3000
```

### Daily Development (Hybrid Architecture)

```bash
# Start backend services
npx supabase start  # If not already running

# MCP servers start automatically with Claude Code (configured in .mcp.json)

# Run development server on host
pnpm dev  # Fast hot-reload on port 3000

# For isolated testing, start test container
docker-compose -f docker-compose.test.yml up -d  # Runs on port 3001

# Run tests
pnpm test  # Unit tests on host
/test  # Comprehensive test suite
```

### Parallel Development and Testing

```bash
# Terminal 1: Development (on host)
pnpm dev  # Port 3000, uses main Supabase (54321/54322)

# Terminal 2: Test server (in container)
docker-compose -f docker-compose.test.yml up  # Port 3001, uses E2E Supabase (55321/55322)

# Terminal 3: Run tests
node .claude/scripts/test/test-controller.cjs  # Runs against port 3001
```

### MCP Server Management (Now via Claude Code)

MCP servers are now managed directly by Claude Code through the `.mcp.json` configuration file.

**Configuration Location**: `.mcp.json` at project root

**Management**:
- Servers start automatically when Claude Code launches
- Configuration changes require Claude Code restart
- Check status with `claude mcp list` command
- Enable/disable servers in `.claude/settings.local.json`

**Legacy Docker Commands** (no longer used):
```bash
# These commands are kept for reference only
# docker-compose -f docker-compose.mcp.yml up -d    # Start all
# docker-compose -f docker-compose.mcp.yml down     # Stop all
# docker-compose -f docker-compose.mcp.yml logs     # View logs
```

## Environment Configuration

### Network Architecture

**Bridge Network**: `slideheroes` (172.20.0.0/16)
- Isolated network for all containers
- DNS resolution between services
- Port mapping to host

**MCP Network**: `mcp-network` (Legacy - Not in Use)
- Previously used for MCP server containers
- MCP servers now run through Claude Code, not Docker

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

### Supabase Management

```bash
# Start main Supabase services
npx supabase start

# Start E2E Supabase services
cd apps/e2e && npx supabase start

# Stop Supabase services
npx supabase stop

# Check Supabase status
npx supabase status

# Reset database
npx supabase db reset

# Run migrations
npx supabase migration up

# Generate TypeScript types
npx supabase gen types typescript --local
```

### Database Operations

```bash
# Connect to main PostgreSQL
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Connect to E2E PostgreSQL
psql postgresql://postgres:postgres@127.0.0.1:55322/postgres

# View Supabase Studio
open http://localhost:54323  # Main
open http://localhost:55323  # E2E
```

### Test Container Management

```bash
# Start test container
docker-compose -f docker-compose.test.yml up -d

# View test server logs
docker logs slideheroes-app-test -f

# Access test server
curl http://localhost:3001/api/health

# Stop test container
docker-compose -f docker-compose.test.yml down
```

### Debugging

```bash
# Check what's running on ports
lsof -i :3000  # Dev server
lsof -i :3001  # Test server
lsof -i :54321  # Main Supabase
lsof -i :55321  # E2E Supabase

# View Supabase container logs
docker logs supabase_db_2025slideheroes -f

# Check Docker compose stacks
docker compose ls

# List all containers with labels
docker ps --format "table {{.Names}}\t{{.Labels}}"
```

### Cleanup

```bash
# Stop Supabase services
npx supabase stop
cd apps/e2e && npx supabase stop

# Stop test container (if running)
docker-compose -f docker-compose.test.yml down

# MCP servers stop automatically when Claude Code exits

# Prune unused Docker resources
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

### MCP Server Issues (Now Claude Code)

**Symptoms**: MCP servers not responding, tool failures in Claude Code

**Solutions**:
1. Check MCP status: `claude mcp list`
2. Verify configuration in `.mcp.json`
3. Check API keys and environment variables
4. Restart Claude Code to reload MCP servers
5. Check `.claude/settings.local.json` for enabled servers

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

## Hybrid Architecture: Benefits and Tradeoffs

### Benefits of Current Approach

**Development Speed**:
- Instant hot-reload without container overhead
- Direct filesystem access for faster builds
- No Docker layer between IDE and code
- Native debugging tools work seamlessly

**Resource Efficiency**:
- Lower memory usage (no container overhead for app)
- Better CPU performance for compilation
- Shared node_modules with host tools

**Flexibility**:
- Easy to switch between configurations
- Can containerize when needed (CI/CD, testing)
- Gradual migration path available

### Tradeoffs

**Consistency**:
- Potential "works on my machine" issues
- Need to manage Node.js versions on host
- Dependencies between host and containers

**Complexity**:
- Multiple tools (Supabase CLI, Docker, pnpm)
- Different commands for different services
- Need to understand both patterns

### When to Use Full Containerization

Consider moving to full containerization when:
- Team grows and environment consistency becomes critical
- CI/CD pipeline needs exact parity with local
- Complex microservices architecture emerges
- Cross-platform development becomes essential

## Future Enhancements

1. **Unified Container Orchestration**: Migrate Supabase CLI projects to docker-compose
2. **Development Containers**: Optional full containerization for consistency
3. **Kubernetes Migration**: Prepare for K8s orchestration
4. **Service Mesh**: Implement for microservices communication
5. **Observability**: Add Prometheus/Grafana monitoring

## Related Files

- `/home/msmith/projects/2025slideheroes/.mcp.json`: MCP servers configuration (Claude Code)
- `/home/msmith/projects/2025slideheroes/docker-compose.test.yml`: Test server container configuration
- `/home/msmith/projects/2025slideheroes/docker-compose.mcp.yml`: Legacy MCP servers configuration (not in use)
- `/home/msmith/projects/2025slideheroes/.devcontainer/docker-compose.yml`: DevContainer services (optional)
- `/home/msmith/projects/2025slideheroes/.devcontainer/devcontainer.json`: VS Code integration
- `/home/msmith/projects/2025slideheroes/apps/e2e/supabase/config.toml`: E2E Supabase configuration
- `/home/msmith/projects/2025slideheroes/.dockerignore`: Build optimization
- `/home/msmith/projects/2025slideheroes/.claude/settings.local.json`: Claude Code MCP enablement settings

## See Also

- [[devcontainer-codespaces]]: GitHub Codespaces configuration
- [[mcp-servers]]: Model Context Protocol server details
- [[e2e-testing]]: End-to-end testing setup
- [[local-development]]: Local development workflow