# Docker Setup and Container Architecture

**Purpose**: Documentation for SlideHeroes hybrid Docker architecture combining containerized Supabase services with host-based development and test containers, optimized for fast local iteration and production-like testing.

## Overview

SlideHeroes uses a **hybrid Docker architecture** providing optimal performance and flexibility through:

1. **Supabase CLI Stack** (Not docker-compose): Main services on ports 54321-54326 + 39006
2. **Docker Compose Stack**: Test environment with Next.js and Payload CMS containers
3. **Host-Based Development**: Next.js runs directly on WSL2/macOS/Linux for fastest hot-reload
4. **MCP Servers**: Run natively through Claude Code via `.mcp.json`

This hybrid approach provides the best of both worlds: fast local development with isolated, reproducible service dependencies.

## Service Architecture

### Supabase Services (Managed by Supabase CLI)

**Single Unified Stack (2025slideheroes-db)**:

| Service | Port | Description |
|---------|------|-------------|
| API Gateway (Kong) | 54321 | Main API access point + Edge Functions |
| PostgreSQL | 54322 | Database server |
| Studio | 54323 | Supabase web UI |
| Inbucket Web | 54324 | Email testing web interface |
| Inbucket SMTP | 54325 | Email SMTP server |
| Inbucket POP3 | 54326 | Email POP3 server |
| Analytics (Logflare) | 39006 | Analytics and logging |
| Edge Functions | 54321/functions/v1/* | Deno runtime functions |

**Container Naming Pattern**: `supabase_<service>_2025slideheroes-db`

Examples: `supabase_kong_2025slideheroes-db`, `supabase_db_2025slideheroes-db`, `supabase_analytics_2025slideheroes-db`

**Services Include**: PostgreSQL 17.x, Kong API Gateway, GoTrue Auth, S3-compatible Storage, Realtime subscriptions, Supabase Studio, Inbucket email testing, Logflare analytics, and Edge Functions Runtime (Deno)

### Test Server Containers (2025slideheroes-test stack)

**Purpose**: Isolated test environment for Next.js and Payload CMS with automatic integration to test infrastructure

**Configuration** (`docker-compose.test.yml`):

- **Project Name**: `2025slideheroes-test` (explicitly set in compose file)
- **Base Image**: `node:20-slim`
- **Containers**:
  - `slideheroes-app-test`: Next.js on port 3001 (dev uses 3000)
  - `slideheroes-payload-test`: Payload CMS on port 3021 (dev uses 3020)
- **Environment**: Connects to main Supabase stack (54321/54322)
- **Package Management**: Uses `npx pnpm@latest` to avoid permission issues
- **Volume Strategy**: Simplified mounting without isolated node_modules
- **Health Endpoints**: `/api/health` for container health verification
- **Auto-Detection**: Test infrastructure automatically detects and uses these containers

### Edge Functions (Hybrid Architecture)

**Supabase Edge Functions** (Deno Runtime):
- Location: `apps/web/supabase/functions/`
- Runtime: Integrated within Supabase Docker stack
- Access URL: `http://localhost:54321/functions/v1/{function-name}`
- Use Case: Heavy file processing and external API integrations
- Functions: powerpoint-generator, certificate-generator

**Vercel Edge Functions** (V8 Isolates):
- Location: `apps/web/app/api/` (with `export const runtime = 'edge'`)
- Runtime: Host-based development, edge-optimized for deployment
- Use Case: AI content generation and lightweight processing
- Functions: /api/ai/generate-ideas, /api/ai/simplify-text

**Integration Strategy**:
- Supabase Edge Functions: Automatically served by Supabase CLI stack
- Vercel Edge Functions: Served by Next.js development server
- Both use shared Supabase authentication and RLS policies
- 40-75% performance improvement over traditional server-side functions

## Hybrid Architecture Model

```
┌─────────────────────────────────────────────────────────────┐
│                        HOST SYSTEM                          │
│                                                             │
│  ┌──────────────────┐  ┌─────────────────────────────────┐│
│  │ Next.js Dev      │  │ Supabase CLI (Manages Containers)││
│  │ (Host Process)   │  │ ├─ PostgreSQL (54322)            ││
│  │ Port 3000        │──┼─┤ Kong API Gateway (54321)        ││
│  │                  │  │ ├─ GoTrue Auth                    ││
│  │ Fast HMR         │  │ ├─ Storage API                    ││
│  │ Native FS access │  │ └─ Analytics (39006)             ││
│  └──────────────────┘  └─────────────────────────────────┘│
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Docker Compose Test Stack (Isolated Network)        │ │
│  │ ├─ Web Test Container (3001) ─────────────┐         │ │
│  │ ├─ Payload Test Container (3021)          │         │ │
│  │ │  Connects to Supabase via ───────────────┘        │ │
│  │ │  host.docker.internal:54321                       │ │
│  │ └─ Bridge Network (slideheroes-test)                │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Development Workflow

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/MLorneSmith/2025slideheroes.git
cd 2025slideheroes

# 2. Install dependencies on host
pnpm install

# 3. Start Supabase services from apps/web directory
cd apps/web
npx supabase start  # Main stack on ports 54321-54326 + 39006
cd ../..

# 4. MCP servers start automatically with Claude Code (via .mcp.json)

# 5. Start development server on host
pnpm dev  # Runs on port 3000
```

### Daily Development (Hybrid Architecture)

```bash
# Start backend services from apps/web directory
cd apps/web && npx supabase start  # If not already running
cd ../..

# MCP servers start automatically with Claude Code

# Run development server on host
pnpm dev  # Fast hot-reload on port 3000

# For isolated testing, start test containers (recommended)
docker-compose -f docker-compose.test.yml up -d  # Runs on ports 3001 & 3021

# Verify containers are healthy
curl http://localhost:3001/api/health    # Should return {"status":"ready"}
curl http://localhost:3021/api/health    # Should return {"status":"ready"}

# Run tests (auto-detects containers)
/test --quick              # Quick infrastructure check
/test --unit              # Unit tests
/test --e2e               # E2E tests using main database
```

### Parallel Development and Testing

```bash
# Terminal 1: Development (on host)
pnpm dev  # Port 3000, uses main Supabase (54321/54322)

# Terminal 2: Test servers (in containers)
docker-compose -f docker-compose.test.yml up  # Ports 3001 & 3021

# Terminal 3: Run tests
/test  # Auto-detects port 3001 containers
```

## Container Operations

### Supabase Management

```bash
# Start Supabase services (from apps/web directory)
cd apps/web && npx supabase start

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

### Edge Functions Testing

```bash
# Test Supabase Edge Functions (within Docker stack)
curl -X POST http://localhost:54321/functions/v1/powerpoint-generator \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [auth-token]" \
  -d '{"storyboard": {...}, "userId": "test-user"}'

# Test Vercel Edge Functions (via Next.js dev server)
curl -X POST http://localhost:3000/api/ai/generate-ideas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [auth-token]" \
  -d '{"content": "test content", "submissionId": "123", "type": "situation"}'
```

## Docker Networking

### Bridge Networks

```yaml
# docker-compose.test.yml pattern
networks:
  slideheroes-test:
    driver: bridge
    name: slideheroes-test
```

**Benefits**:
- Isolated test environment
- Inter-container communication
- Predictable DNS resolution

### Host Communication

```typescript
// Test containers connecting to Supabase on host
const SUPABASE_URL = process.env.CI
  ? 'http://supabase-kong:8000'
  : 'http://host.docker.internal:54321';
```

## Performance Optimization

### tmpfs Volumes

```yaml
tmpfs:
  - /app/apps/web/.next:uid=1000,gid=1000,mode=1777
  - /app/node_modules/.cache:uid=1000,gid=1000,mode=1777
```

**Impact**: 2-10x faster builds, lost on container restart

### Resource Limits

```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 4G
    reservations:
      cpus: '1'
      memory: 2G
```

**Prevents**: OOM kills during Next.js builds and Playwright execution

### Health Checks

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
  interval: 10s
  timeout: 5s
  retries: 3
  start_period: 180s  # Critical: Allows pnpm install + Next.js build
```

## Architecture Benefits

### Development Speed

- Instant hot-reload without container overhead
- Direct filesystem access for faster builds
- Native debugging tools work seamlessly
- No Docker layer between IDE and code

### Resource Efficiency

- Lower memory usage (no container overhead for app)
- Better CPU performance for compilation
- Shared node_modules with host tools
- Optimal disk usage with pnpm

### Test Reliability

- Clean isolated environments per test run
- No state pollution between test suites
- Predictable networking and ports
- Production-like container behavior

### Flexibility

- Easy configuration switching
- Can containerize when needed (CI/CD, testing)
- Gradual migration path available
- Mix-and-match approach per service

## Troubleshooting

### Container Won't Start

1. Check port conflicts: `lsof -i :3001` or `lsof -i :54321`
2. Verify network exists: `docker network ls | grep slideheroes`
3. Check resource limits: `docker stats`
4. Review health check logs: `docker inspect --format='{{json .State.Health}}' <container>`

### Slow Build Performance

1. Enable tmpfs for build artifacts
2. Increase resource limits (4GB+ memory)
3. Use `.dockerignore` to exclude `node_modules`
4. Consider BuildKit caching

### Network Connectivity Issues

1. Verify `host.docker.internal` resolves
2. Check bridge network configuration
3. Ensure firewall allows container traffic
4. Test Supabase connectivity

### Container Permission Issues (pnpm)

**Problem**: `EACCES: permission denied` errors when starting test containers
**Solution**: Containers use `npx pnpm@latest` instead of global installation

```bash
# ✅ This works (used in containers)
npx pnpm@latest install --frozen-lockfile

# ❌ This fails (avoid in containers)
npm install -g pnpm
```

If issues persist:
1. Check container logs: `docker logs slideheroes-app-test`
2. Restart containers: `docker-compose -f docker-compose.test.yml down && docker-compose -f docker-compose.test.yml up -d`
3. Clear volumes: `docker-compose -f docker-compose.test.yml down -v`

## Expected Healthy Setup

```
Main Supabase:   API=54321, DB=54322, Studio=54323, Analytics=39006
Test Containers: slideheroes-app-test (3001), slideheroes-payload-test (3021)
Infrastructure:  All components healthy (12/12 Supabase + 2/2 test containers)
```

## Related Files

- `/home/msmith/projects/2025slideheroes/.mcp.json` - MCP servers configuration
- `/home/msmith/projects/2025slideheroes/docker-compose.test.yml` - Test server configuration
- `/home/msmith/projects/2025slideheroes/.devcontainer/docker-compose.yml` - DevContainer services
- `/home/msmith/projects/2025slideheroes/apps/web/supabase/functions/` - Supabase Edge Functions

## See Also

- docker-architecture.md: Detailed architecture overview
- docker-containers-management.md: Container operations
- docker-troubleshooting.md: Common issues and solutions
- test-architecture.md: Testing infrastructure details
