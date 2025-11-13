---
id: "docker-architecture"
title: "Docker Architecture Overview"
version: "2.1.0"
category: "systems"
description: "Hybrid Docker architecture combining containerized services with host-based development for optimal performance"
tags: ["docker", "architecture", "containers", "supabase", "hybrid", "infrastructure", "testing", "performance"]
dependencies: []
cross_references:
  - id: "local-development-environment"
    type: "related"
    description: "Development workflows using this architecture"
  - id: "docker-containers-management"
    type: "related"
    description: "Container operations and management"
  - id: "mcp-servers"
    type: "related"
    description: "MCP servers configuration details"
  - id: "test-architecture"
    type: "related"
    description: "Testing infrastructure and patterns"
created: "2025-09-22"
last_updated: "2025-11-06"
author: "create-context"
---

# Docker Architecture Overview

SlideHeroes uses a **hybrid Docker architecture** that combines containerized services with host-based application development for optimal performance and developer experience.

## Architecture Components

### 1. Supabase CLI Stack (Main Development)

- **Stack Name**: `2025slideheroes-db` (managed by Supabase CLI, not docker-compose)
- **Ports**: 54321-54326 (+ analytics at 39006)
- **Usage**: Primary development database and auth services

### 2. Docker Compose Test Stack

- **Stack Name**: `2025slideheroes-test`
- **Services**:
  - `slideheroes-app-test`: Next.js test server (port 3001)
  - `slideheroes-payload-test`: Payload CMS test server (port 3021)
- **Purpose**: Isolated containerized testing environment

### 3. Host-Based Development

- Next.js application runs directly on WSL2/macOS/Linux
- Provides fastest hot-reload and development experience
- Connects to containerized Supabase services

### 4. MCP Servers

- Run natively through Claude Code via `.mcp.json`
- No Docker containers required
- Auto-start with Claude Code

## Service Port Architecture

| Service Stack | Purpose | Port Range | Management |
|--------------|---------|------------|------------|
| Main Supabase | Development | 54321-54326 + 39006 | Supabase CLI |
| Test Containers | Isolated Testing | 3001, 3021 | Docker Compose |
| MCP Servers | AI Integration | Various | Claude Code |

### Main Supabase Stack Services

- **54321**: API Gateway (Kong) + Edge Functions
- **54322**: PostgreSQL Database
- **54323**: Supabase Studio (Web UI)
- **54324**: Inbucket Email Web Interface
- **54325**: Inbucket SMTP Server
- **54326**: Inbucket POP3 Server
- **39006**: Analytics (Logflare)

**Container Naming Pattern**: `supabase_<service>_2025slideheroes-db`

- Example: `supabase_kong_2025slideheroes-db`, `supabase_db_2025slideheroes-db`

### E2E Testing Infrastructure

**Note**: E2E tests currently use the **main Supabase stack** (54321/54322). A separate E2E Supabase stack on ports 55321-55327 is configured in test scripts but not currently deployed.

**E2E Test Approach**:

- Playwright tests run against main Supabase services
- Database reset/seeding performed before test runs
- Test isolation achieved through data cleanup, not separate containers

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

## Hybrid Edge Functions Architecture

SlideHeroes uses dual edge function providers for optimal performance:

### Supabase Edge Functions (Deno Runtime)

- **Location**: `apps/web/supabase/functions/`
- **Access**: `http://localhost:54321/functions/v1/{name}`
- **Use Cases**: Heavy file processing, external APIs
- **Examples**: powerpoint-generator, certificate-generator

### Vercel Edge Functions (V8 Isolates)

- **Location**: `apps/web/app/api/` with `export const runtime = 'edge'`
- **Use Cases**: AI content generation, lightweight processing
- **Examples**: /api/ai/generate-ideas, /api/ai/simplify-text

## Docker Networking Patterns

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

## Architecture Tradeoffs

### Consistency Challenges

- Potential "works on my machine" issues
- Need to manage Node.js versions on host
- Dependencies between host and containers

### Complexity

- Multiple tools (Supabase CLI, Docker, pnpm)
- Different commands for different services
- Need to understand both patterns

### Container Communication

- `host.docker.internal` required for host access
- Network configuration complexity
- Port conflict management

## Common Operations

### Verify Infrastructure

```bash
# Check Supabase services
npx supabase status                    # Main: 54321/54322

# Check Docker containers
docker ps --filter "name=slideheroes-" --format "table {{.Names}}\t{{.Ports}}"
docker ps --filter "name=supabase_" --format "table {{.Names}}\t{{.Ports}}" | head -15

# Check Docker Compose stacks
docker compose ls

# Health checks
curl -s http://localhost:3001/api/health | jq '.status'
curl -s http://localhost:3021/api/health | jq '.status'
curl -s http://localhost:54321/health | jq
```

### Start/Stop Services

```bash
# Supabase services
npx supabase start                     # Start main stack
npx supabase stop                      # Stop services
npx supabase status                    # Check status

# Test containers
docker compose -f docker-compose.test.yml up -d
docker compose -f docker-compose.test.yml down
docker compose -f docker-compose.test.yml ps
```

### Debug Containers

```bash
# View logs
docker compose logs slideheroes-app-test -f
docker logs supabase_kong_2025slideheroes-db -f

# Execute commands
docker compose exec slideheroes-app-test pnpm typecheck

# Shell access
docker compose exec slideheroes-app-test sh
docker exec -it supabase_db_2025slideheroes-db psql -U postgres
```

## Expected Healthy Setup

```
Main Supabase:   API=54321, DB=54322, Studio=54323, Analytics=39006
Test Containers: slideheroes-app-test (3001), slideheroes-payload-test (3021)
Infrastructure:  All components healthy (12/12 Supabase + 2/2 test containers)
```

## When to Use Full Containerization

Consider full containerization when:

- Team grows and environment consistency becomes critical
- CI/CD pipeline needs exact parity with local
- Complex microservices architecture emerges
- Cross-platform development becomes essential
- Docker Desktop stability improves on WSL2

## Troubleshooting Quick Reference

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

1. Verify `host.docker.internal` resolves: `docker exec <container> ping host.docker.internal`
2. Check bridge network configuration
3. Ensure firewall allows container traffic
4. Test Supabase connectivity: `curl http://host.docker.internal:54321/health`

### Supabase Container Issues

```bash
# Check all Supabase containers
docker ps --filter "name=supabase_" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# View Supabase logs
npx supabase logs -f

# Restart Supabase stack
npx supabase stop && npx supabase start
```

## Related Documentation

- [[local-development-environment]]: Daily development workflows
- [[docker-containers-management]]: Container operations
- [[docker-troubleshooting]]: Common issues and solutions
- [[test-architecture]]: Testing infrastructure details
- [[database-seeding-strategy]]: Database initialization patterns
