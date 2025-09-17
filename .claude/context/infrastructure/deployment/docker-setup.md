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

**Two Isolated Stacks**:

| Service | Main Stack (2025slideheroes) | E2E Stack (2025slideheroes-e2e) |
|---------|------------------------------|----------------------------------|
| API Gateway | 54321 | 55321 |
| PostgreSQL | 54322 | 55322 |
| Studio | 54323 | 55323 |
| Mailpit | - | 55324-55326 |

**Services Include**: PostgreSQL, Kong API Gateway, GoTrue Auth, S3-compatible Storage, Realtime subscriptions, and Supabase Studio

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

### DevContainer Setup

**Note**: DevContainer configurations exist in `.devcontainer/` but host-based development is preferred for performance.

### MCP Servers (via Claude Code)

MCP servers are configured natively through Claude Code via `.mcp.json` at project root. They are managed directly by Claude Code and start automatically when Claude Code launches. The legacy `docker-compose.mcp.yml` file is no longer used.

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

### MCP Configuration

```
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


## Environment Configuration

### Network Architecture

**Bridge Network**: `slideheroes` (172.20.0.0/16)
- Isolated network for all containers
- DNS resolution between services
- Port mapping to host


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

- Use multi-stage builds and minimal base images (Alpine/slim)
- Run containers as non-root users with proper secret management
- Cache dependencies via volume mounts for faster builds
- Set resource limits and implement health checks
- Regularly update base images and prune unused resources

## Performance Optimizations

- Enable BuildKit for parallel builds
- Use cache mounts and multi-stage builds
- Configure .dockerignore to minimize context
- Use named volumes and overlay2 storage driver
- Set appropriate resource limits

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


## Related Files

- `/home/msmith/projects/2025slideheroes/.mcp.json`: MCP servers configuration (Claude Code)
- `/home/msmith/projects/2025slideheroes/docker-compose.test.yml`: Test server container configuration
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