
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
last_updated: "2025-09-19"
author: "create-context"
revised: "2025-09-19 - Updated port configuration to 39xxx range to resolve Windows/WSL2 port binding issues, added test infrastructure integration documentation, fixed container permission issues, added hybrid Edge Functions architecture documentation (GitHub issue #29)"
---

# Docker Setup and Container Architecture

## Overview

The SlideHeroes project uses a **hybrid Docker architecture** that combines containerized services with host-based application development for optimal performance and flexibility. The setup consists of:

1. **Supabase CLI Stacks** (Not docker-compose):
   - **2025slideheroes-db** - Main Supabase services (database, auth, storage) on ports 39000-39006
   - **2025slideheroes-e2e** - E2E test Supabase services on ports 55321/55322

2. **Docker Compose Stack** (`docker-compose.test.yml`):
   - **2025slideheroes-test** - Test environment stack with two containers:
     - `slideheroes-app-test`: Next.js test server on port 3001
     - `slideheroes-payload-test`: Payload CMS test server on port 3021

3. **Host-Based Development**:
   - Next.js application runs directly on WSL2/macOS/Linux (not containerized)
   - Connects to containerized Supabase services
   - Provides fastest hot-reload and development experience

4. **MCP Servers** (via Claude Code):
   - Model Context Protocol servers now run natively through Claude Code
   - Configured in `.mcp.json` at project root
   - No longer require Docker containers

This hybrid approach provides the best of both worlds: fast local development with isolated, reproducible service dependencies.

## Recent Updates (2025-09-19)

### Port Configuration Changes
- **Main Stack**: Migrated from 54xxx to 39xxx port range to resolve Windows/WSL2 conflicts
- **New URLs**:
  - Studio: http://localhost:39002 (was 54323)
  - API: http://localhost:39000 (was 54321)
  - Database: postgresql://postgres:postgres@localhost:39001/postgres (was 54322)

### RLS Performance Optimizations
- Consolidated 45+ duplicate RLS policies across 15 tables
- Applied optimizations to both main and E2E databases
- Expected 2-10x query performance improvement

### Windows/WSL2 Compatibility
- Documented port binding issues and solutions
- Recommended WSL 2.6.1+ with mirrored networking mode
- Implemented safe port range (39xxx) to avoid Hyper-V conflicts

### Docker Compose Naming Clarity
- Renamed Docker Compose project to `2025slideheroes-test` for clear distinction
- Naming convention:
  - `-db` suffix: Main Supabase development stack
  - `-e2e` suffix: E2E Supabase testing stack
  - `-test` suffix: Docker Compose test containers

## Service Architecture

### Supabase Services (Managed by Supabase CLI)

**Two Isolated Stacks**:

| Service | Main Stack (2025slideheroes-db) | E2E Stack (2025slideheroes-e2e) |
|---------|----------------------------------|----------------------------------|
| API Gateway | 39000 | 55321 |
| PostgreSQL | 39001 | 55322 |
| Studio | 39002 | 55323 |
| Inbucket | 39003-39005 | 55324-55326 |
| Analytics | 39006 | 55327 |
| **Edge Functions** | 39000/functions/v1/* | 55321/functions/v1/* |

**Services Include**: PostgreSQL, Kong API Gateway, GoTrue Auth, S3-compatible Storage, Realtime subscriptions, Supabase Studio, and **Edge Functions Runtime**

### Test Server Containers (`2025slideheroes-test` stack)

**Purpose**: Isolated test environment for Next.js and Payload CMS with automatic integration to test infrastructure

**Configuration** (`docker-compose.test.yml`):
- **Project Name**: `2025slideheroes-test` (explicitly set in compose file)
- **Base Image**: `node:20-slim`
- **Containers**:
  - `slideheroes-app-test`: Next.js on port 3001 (dev uses 3000)
  - `slideheroes-payload-test`: Payload CMS on port 3021 (dev uses 3020)
- **Environment**: Connects to E2E Supabase stack (55321/55322)
- **Package Management**: Uses `npx pnpm@latest` to avoid permission issues
- **Volume Strategy**: Simplified mounting without isolated node_modules to prevent permission conflicts
- **Health Endpoints**: `/api/health` for container health verification
- **Auto-Detection**: Test infrastructure automatically detects and uses these containers
- **Integration**: Can run parallel to development, automatically used by `/test` command

### DevContainer Setup

**Note**: DevContainer configurations exist in `.devcontainer/` but host-based development is preferred for performance.

### MCP Servers (via Claude Code)

MCP servers are configured natively through Claude Code via `.mcp.json` at project root. They are managed directly by Claude Code and start automatically when Claude Code launches. The legacy `docker-compose.mcp.yml` file is no longer used.

### Edge Functions (Hybrid Architecture)

**Implementation**: SlideHeroes uses a hybrid edge functions architecture combining both Vercel Edge Functions and Supabase Edge Functions for optimal performance across different use cases.

**Supabase Edge Functions** (Deno Runtime):
- **Location**: `apps/web/supabase/functions/`
- **Runtime**: Integrated within Supabase Docker stack
- **Access URL**: `http://localhost:39000/functions/v1/{function-name}`
- **Use Case**: Heavy file processing and external API integrations
- **Functions**:
  - `powerpoint-generator`: PowerPoint file generation with memory optimization
  - `certificate-generator`: PDF certificate generation via PDF.co API integration

**Vercel Edge Functions** (V8 Isolates):
- **Location**: `apps/web/app/api/` (with `export const runtime = 'edge'`)
- **Runtime**: Host-based development, edge-optimized for deployment
- **Use Case**: AI content generation and lightweight processing
- **Functions**:
  - `/api/ai/generate-ideas`: AI-powered content suggestions via Portkey Gateway
  - `/api/ai/simplify-text`: Text simplification and optimization

**Integration Strategy**:
- **Supabase Edge Functions**: Automatically served by Supabase CLI stack (no separate deployment needed for local development)
- **Vercel Edge Functions**: Served by Next.js development server with edge runtime
- **Authentication**: Both use shared Supabase authentication and RLS policies
- **Performance**: 40-75% performance improvement over traditional server-side functions
- **Development**: Both functions are available during local development without additional setup

### Test Infrastructure Integration

**Automatic Container Detection**: The test infrastructure in `.claude/scripts/testing/infrastructure/` automatically detects and integrates with Docker test containers:

- **Container Detection**: `infrastructure-manager.cjs` checks for `slideheroes-app-test` container on port 3001
- **Automatic Configuration**: Sets `TEST_BASE_URL=http://localhost:3001` when container is healthy
- **Fallback Strategy**: Uses host-based dev server on port 3000 if containers unavailable
- **Health Verification**: Validates `/api/health` endpoints before using containers

**Test Command Integration**:
```bash
/test                    # Auto-detects containers, uses port 3001 if available
/test --unit            # Uses containers for unit tests when available
/test --e2e             # Requires containers for E2E tests (port 3001)
/test --quick           # Quick infrastructure check, shows container status
```

**Container Priority**: When both host development server (port 3000) and test containers (port 3001) are running, the test infrastructure will automatically prefer containers for testing to avoid conflicts.

### Supporting Services

**PostgreSQL** (39001 for main, 55322 for E2E):
- Supabase-optimized PostgreSQL 15.8
- OrioleDB support (disabled by default in Codespaces)
- Performance tuning for development

**Redis** (6379):
- Alpine-based Redis 7
- Persistent data volume
- Append-only file for durability

**Mailhog** (1025/8025):
- SMTP server for email testing
- Web UI for email inspection

**Supabase Studio** (39002 for main, 55323 for E2E):
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

## Windows/WSL2 Port Binding Issues

### Known Issue
Windows with WSL2 and Docker Desktop can experience port binding conflicts due to Hyper-V dynamically reserving port ranges. This commonly affects ports in the 50000-60000 range.

**Error Message**: `bind: An attempt was made to access a socket in a way forbidden by its access permissions`

### Solutions

1. **Port Range Change (Implemented)**: The main stack now uses ports 39000-39006 to avoid the problematic range.

2. **WSL Update**: Update to WSL 2.6.1+ and enable mirrored networking mode:
   ```powershell
   wsl --update
   ```
   Then create/edit `C:\Users\[Username]\.wslconfig`:
   ```ini
   [wsl2]
   networkingMode=mirrored
   ```

3. **Quick Fix**: Restart WSL and Docker:
   ```powershell
   wsl --shutdown
   # Then restart Docker Desktop
   ```

## Development Workflow

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/MLorneSmith/2025slideheroes.git
cd 2025slideheroes

# 2. Install dependencies on host
pnpm install

# 3. Start Supabase services
npx supabase start  # Main stack on ports 39000/39001

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
npx supabase start  # If not already running (ports 39000-39006)

# MCP servers start automatically with Claude Code (configured in .mcp.json)

# Run development server on host
pnpm dev  # Fast hot-reload on port 3000

# For isolated testing, start test containers (recommended)
docker-compose -f docker-compose.test.yml up -d  # Runs on ports 3001 & 3021

# Verify containers are healthy
curl http://localhost:3001/api/health    # Should return {"status":"ready"}
curl http://localhost:3021/api/health    # Should return {"status":"ready"}

# Run tests (auto-detects containers)
/test --quick              # Quick infrastructure check, uses containers if available
/test --unit              # Unit tests, uses containers if available
/test --e2e               # E2E tests, requires containers for full suite
```

### Parallel Development and Testing

```bash
# Terminal 1: Development (on host)
pnpm dev  # Port 3000, uses main Supabase (39000/39001)

# Terminal 2: Test servers (in containers)
docker-compose -f docker-compose.test.yml up  # Ports 3001 & 3021, uses E2E Supabase (55321/55322)

# Terminal 3: Run tests
/test                                           # Auto-detects port 3001 containers
# OR run test controller directly:
node .claude/scripts/testing/infrastructure/test-controller.cjs  # Runs against port 3001
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

**Bridge Networks**:
- `slideheroes-test`: Test container network (Docker Compose)
- Supabase networks are managed separately by Supabase CLI
- Isolated network for all containers
- DNS resolution between services
- Port mapping to host


### Environment Variables

**Critical Variables (Updated for new ports)**:
```bash
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:39001/postgres  # Main stack
# DATABASE_URL=postgresql://postgres:postgres@localhost:55322/postgres  # E2E stack
SUPABASE_URL=http://localhost:39000  # Main API (was 54321)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
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
psql postgresql://postgres:postgres@127.0.0.1:39001/postgres

# Connect to E2E PostgreSQL
psql postgresql://postgres:postgres@127.0.0.1:55322/postgres

# View Supabase Studio
open http://localhost:39002  # Main
open http://localhost:55323  # E2E
```

### Edge Functions Testing

```bash
# Test Supabase Edge Functions (within Docker stack)
curl -X POST http://localhost:39000/functions/v1/powerpoint-generator \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [auth-token]" \
  -d '{"storyboard": {...}, "userId": "test-user"}'

curl -X POST http://localhost:39000/functions/v1/certificate-generator \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [auth-token]" \
  -d '{"userId": "test-user", "courseId": "course-123", "fullName": "Test User"}'

# Test Vercel Edge Functions (via Next.js dev server)
curl -X POST http://localhost:3000/api/ai/generate-ideas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [auth-token]" \
  -d '{"content": "test content", "submissionId": "123", "type": "situation"}'

curl -X POST http://localhost:3000/api/ai/simplify-text \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [auth-token]" \
  -d '{"content": "complex text", "userId": "test-user", "canvasId": "123", "sectionType": "situation"}'

# Check Edge Functions are responding (should return 401 without auth)
curl -X POST http://localhost:39000/functions/v1/powerpoint-generator -H "Content-Type: application/json" -d '{}'
curl -X POST http://localhost:39000/functions/v1/certificate-generator -H "Content-Type: application/json" -d '{}'
```

### Test Container Management

```bash
# Start test containers (2025slideheroes-test stack)
docker-compose -f docker-compose.test.yml up -d

# View test server logs
docker logs slideheroes-app-test -f      # Next.js logs
docker logs slideheroes-payload-test -f  # Payload CMS logs

# Access test servers
curl http://localhost:3001/api/health    # Next.js health check
curl http://localhost:3021/health        # Payload CMS health check

# Check stack status
docker compose ls  # Should show: 2025slideheroes-test

# Stop test containers
docker-compose -f docker-compose.test.yml down
```

### Debugging

```bash
# Check what's running on ports
lsof -i :3000  # Dev server
lsof -i :3001  # Test server (Next.js)
lsof -i :3021  # Test server (Payload CMS)
lsof -i :39000  # Main Supabase API
lsof -i :55321  # E2E Supabase

# View Supabase container logs
docker logs supabase_db_2025slideheroes-db -f  # Main stack
docker logs supabase_db_2025slideheroes-e2e -f  # E2E stack

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

# Stop test containers (if running)
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

### Container Permission Issues (pnpm)

**Problem**: `EACCES: permission denied` errors when starting test containers
**Symptoms**:
- Container exits with code 243
- Logs show `npm error EACCES: permission denied, mkdir '/usr/local/lib/node_modules/pnpm'`
- Containers fail to install pnpm globally

**Root Cause**: Test containers run as non-root user (`node`) and cannot install global packages

**Solution**: The containers now use `npx pnpm@latest` instead of global installation:
```bash
# ✅ This works (used in containers)
npx pnpm@latest install --frozen-lockfile

# ❌ This fails (avoid in containers)
npm install -g pnpm
corepack enable  # Also fails with permission errors
```

**If you encounter this issue**:
1. **Check container logs**: `docker logs slideheroes-app-test`
2. **Restart containers**: `docker-compose -f docker-compose.test.yml down && docker-compose -f docker-compose.test.yml up -d`
3. **Clear problematic volumes**: `docker-compose -f docker-compose.test.yml down -v`
4. **Verify fix**: Wait for containers to show "Ready" status

**Volume Permission Issues**: If you encounter node_modules permission errors:
```bash
# Remove problematic volumes and restart
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up -d
```

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

## Architecture Verification

### Complete Setup Verification

Use these commands to verify your entire Docker infrastructure is working correctly:

```bash
# === Supabase Stacks ===
echo "=== Main Supabase Stack ==="
npx supabase status                           # Should show API on 39000, DB on 39001

echo "=== E2E Supabase Stack ==="
cd apps/e2e && npx supabase status            # Should show API on 55321, DB on 55322
cd ../..

# === Docker Containers ===
echo "=== Test Containers ==="
docker ps --filter "name=slideheroes-" --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"

echo "=== MCP Integration ==="
docker ps --filter "name=docs-mcp" --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"

echo "=== Compose Stacks ==="
docker compose ls                             # Should show: 2025slideheroes-test running(2)

# === Health Checks ===
echo "=== Container Health ==="
curl -s http://localhost:3001/api/health | jq '.status'  # Should return "ready"
curl -s http://localhost:3021/api/health | jq '.status'  # Should return "ready"

# === Test Infrastructure Integration ===
echo "=== Infrastructure Health Check ==="
node .claude/scripts/testing/infrastructure/test-controller.cjs --quick
```

### Expected Results

**✅ Healthy Setup Should Show**:
```
Main Supabase:   API=39000, DB=39001, Studio=39002
E2E Supabase:    API=55321, DB=55322, Studio=55323
Test Containers: slideheroes-app-test (3001), slideheroes-payload-test (3021)
MCP Server:      docs-mcp-server (6280)
Infrastructure:  All infrastructure healthy (7/7)
```

**❌ Common Issues**:
- **Port conflicts**: Check `lsof -i :3001` and restart containers
- **Container exits**: Check logs with `docker logs slideheroes-app-test`
- **Supabase not running**: Run `npx supabase start` in main and `apps/e2e`
- **Infrastructure check fails**: Run `/test --debug` for detailed diagnostics

### Quick Diagnostic Commands

```bash
# Check what's using key ports
lsof -i :3000 :3001 :3021 :39000 :39001 :55321 :55322

# View all running containers
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}"

# Check container logs for issues
docker logs slideheroes-app-test --tail 20
docker logs slideheroes-payload-test --tail 20

# Test container health endpoints
curl http://localhost:3001/api/health
curl http://localhost:3021/api/health

# Verify test infrastructure integration
/test --quick --debug
```

## Prevention Mechanisms for Incorrect Stack Creation

### Issue #348 Resolution

After resolving RLS performance issues, we implemented multiple prevention mechanisms to stop the creation of incorrect Supabase stacks:

**Problem**: Running `npx supabase start` from project root creates wrong stack:
- ❌ Stack: `2025slideheroes` (ports 54321/54322)
- ✅ Correct: `2025slideheroes-db` (ports 39000-39006) or `2025slideheroes-e2e` (ports 55321/55322)

### 1. Claude Code Hook Guard

**Location**: `.claude/settings.local.json` and `.claude/hooks/supabase-directory-guard.sh`

**How it works**: Intercepts all Bash commands containing "supabase" and blocks execution if run from project root.

**Example Warning**:
```
🚨 SUPABASE DIRECTORY WARNING
❌ You're running a Supabase command from the project root.
🛑 Command blocked to prevent incorrect stack creation.

✅ Correct usage:
   cd apps/web && npx supabase start    # For main development
   cd apps/e2e && npx supabase start    # For E2E testing
```

### 2. Root-Level Warning Config

**Location**: `supabase/config.toml` (project root)

**Purpose**: Creates invalid configuration with ports 99999/99998 to prevent accidental usage and shows clear warnings.

### 3. Directory-Specific Best Practices

**Always run Supabase commands from the correct directories**:

```bash
# ✅ CORRECT - Main development
cd apps/web
npx supabase start    # Creates 2025slideheroes-db on ports 39000-39006

# ✅ CORRECT - E2E testing
cd apps/e2e
npx supabase start    # Creates 2025slideheroes-e2e on ports 55321-55322

# ❌ WRONG - Project root (blocked by hook)
cd /home/msmith/projects/2025slideheroes
npx supabase start    # Would create wrong stack, now blocked
```

### 4. Container Cleanup Commands

If incorrect stacks are accidentally created:

```bash
# Stop incorrect stack (from any directory)
npx supabase stop

# List and remove incorrect volumes
docker volume ls --filter "label=com.supabase.cli.project=2025slideheroes"
docker volume rm supabase_db_2025slideheroes supabase_config_2025slideheroes

# Verify correct stacks are running
docker ps --filter "name=2025slideheroes-db" --format "table {{.Names}}\t{{.Ports}}"
docker ps --filter "name=2025slideheroes-e2e" --format "table {{.Names}}\t{{.Ports}}"
```

## Related Files

- `/home/msmith/projects/2025slideheroes/.mcp.json`: MCP servers configuration (Claude Code)
- `/home/msmith/projects/2025slideheroes/docker-compose.test.yml`: Test server container configuration
- `/home/msmith/projects/2025slideheroes/.claude/scripts/testing/infrastructure/test-controller.cjs`: Main test orchestration script
- `/home/msmith/projects/2025slideheroes/.claude/scripts/testing/infrastructure/infrastructure-manager.cjs`: Container detection and integration
- `/home/msmith/projects/2025slideheroes/.claude/commands/core/test.md`: Test command documentation
- `/home/msmith/projects/2025slideheroes/.devcontainer/docker-compose.yml`: DevContainer services (optional)
- `/home/msmith/projects/2025slideheroes/.devcontainer/devcontainer.json`: VS Code integration
- `/home/msmith/projects/2025slideheroes/apps/e2e/supabase/config.toml`: E2E Supabase configuration
- `/home/msmith/projects/2025slideheroes/.dockerignore`: Build optimization
- `/home/msmith/projects/2025slideheroes/.claude/settings.local.json`: Claude Code MCP enablement settings
- `/home/msmith/projects/2025slideheroes/apps/web/supabase/functions/powerpoint-generator/index.ts`: Supabase Edge Function for PowerPoint generation
- `/home/msmith/projects/2025slideheroes/apps/web/supabase/functions/certificate-generator/index.ts`: Supabase Edge Function for certificate generation
- `/home/msmith/projects/2025slideheroes/apps/web/app/api/ai/generate-ideas/route.ts`: Vercel Edge Function for AI content generation
- `/home/msmith/projects/2025slideheroes/apps/web/app/api/ai/simplify-text/route.ts`: Vercel Edge Function for text simplification
- `/home/msmith/projects/2025slideheroes/apps/web/app/home/(user)/ai/canvas/_actions/generate-ideas-edge.ts`: Client action for generate-ideas edge function
- `/home/msmith/projects/2025slideheroes/apps/web/app/home/(user)/ai/canvas/_actions/simplify-text-edge.ts`: Client action for simplify-text edge function

## See Also

- [[devcontainer-codespaces]]: GitHub Codespaces configuration
- [[mcp-servers]]: Model Context Protocol server details
- [[e2e-testing]]: End-to-end testing setup
- [[local-development]]: Local development workflow