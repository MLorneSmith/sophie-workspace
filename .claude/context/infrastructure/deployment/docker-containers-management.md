---
id: "docker-containers-management"
title: "Docker Containers Management"
version: "1.0.0"
category: "systems"
description: "Container operations, edge functions, test infrastructure, and health management for SlideHeroes"
tags: ["docker", "containers", "edge-functions", "testing", "health-checks", "management"]
dependencies: ["docker-architecture", "local-development-environment"]
cross_references:
  - id: "docker-architecture"
    type: "prerequisite"
    description: "Understanding container architecture"
  - id: "test-architecture"
    type: "related"
    description: "Testing infrastructure details"
  - id: "docker-troubleshooting"
    type: "related"
    description: "Troubleshooting container issues"
created: "2025-09-22"
last_updated: "2025-09-22"
author: "create-context"
---

# Docker Containers Management

Comprehensive guide for managing Docker containers, edge functions, and test infrastructure in SlideHeroes.

## Test Container Stack

### Configuration (docker-compose.test.yml)

```yaml
# Project name: 2025slideheroes-test
# Containers: slideheroes-app-test, slideheroes-payload-test
```

**Key Features:**
- Base Image: `node:20-slim`
- Package Manager: `npx pnpm@latest` (avoids permission issues)
- Health Endpoints: `/api/health` for verification
- Environment: Connects to E2E Supabase (55321/55322)
- Auto-detection by test infrastructure

### Container Operations

```bash
# Start test containers
docker-compose -f docker-compose.test.yml up -d

# View container logs
docker logs slideheroes-app-test -f
docker logs slideheroes-payload-test -f

# Check container health
curl http://localhost:3001/api/health
curl http://localhost:3021/api/health

# Stop containers
docker-compose -f docker-compose.test.yml down

# Clean restart with volumes
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up -d
```

### Container Status Monitoring

```bash
# List running containers
docker ps --filter "name=slideheroes-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check compose stack
docker compose ls

# Inspect container
docker inspect slideheroes-app-test | jq '.[0].State'

# Resource usage
docker stats --no-stream slideheroes-app-test slideheroes-payload-test
```

## Edge Functions Management

### Supabase Edge Functions

**Location:** `apps/web/supabase/functions/`

```bash
# Test edge function locally
curl -X POST http://localhost:39000/functions/v1/powerpoint-generator \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [auth-token]" \
  -d '{"storyboard": {...}, "userId": "test-user"}'

# Check function health (should return 401 without auth)
curl -X POST http://localhost:39000/functions/v1/certificate-generator \
  -H "Content-Type: application/json" -d '{}'

# View function logs
npx supabase functions logs powerpoint-generator

# Deploy functions (production)
npx supabase functions deploy powerpoint-generator
```

### Vercel Edge Functions

**Location:** `apps/web/app/api/` with `export const runtime = 'edge'`

```bash
# Test via dev server
curl -X POST http://localhost:3000/api/ai/generate-ideas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [auth-token]" \
  -d '{"content": "test", "submissionId": "123", "type": "situation"}'

# Monitor edge function performance
curl http://localhost:3000/api/ai/simplify-text \
  -w "\n\nTime: %{time_total}s\n"
```

## Test Infrastructure Integration

### Automatic Container Detection

The test infrastructure (`infrastructure-manager.cjs`) automatically:
- Detects `slideheroes-app-test` on port 3001
- Sets `TEST_BASE_URL=http://localhost:3001`
- Falls back to host dev server if unavailable
- Validates health endpoints before use

### Test Command Integration

```bash
# Auto-detects and uses containers
/test

# Unit tests with containers
/test --unit

# E2E tests (requires containers)
/test --e2e

# Quick infrastructure check
/test --quick

# Debug mode
/test --debug
```

### Container Priority

When both servers run:
- Host dev (3000): Development work
- Test containers (3001): Test execution
- Test infrastructure prefers containers

## Volume Management

### Container Volumes

```bash
# List volumes
docker volume ls --filter "name=slideheroes"

# Inspect volume
docker volume inspect slideheroes_node_modules

# Clean unused volumes
docker volume prune -f

# Remove specific volume
docker volume rm slideheroes_pnpm_store
```

### Volume Strategy

- **Simplified mounting**: No isolated node_modules
- **Shared cache**: pnpm store between containers
- **Persistent data**: Database volumes preserved
- **Build cache**: Next.js and Turbo caches

## Health Monitoring

### Health Check Implementation

```typescript
// apps/web/app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: "ready",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
}
```

### Monitoring Commands

```bash
# Check all health endpoints
for port in 3000 3001 3021 39000 55321; do
  echo "Port $port:"
  curl -s http://localhost:$port/api/health 2>/dev/null | jq '.status' || echo "Not available"
done

# Monitor container health status
watch -n 2 'docker ps --filter "name=slideheroes-" --format "table {{.Names}}\t{{.Status}}"'

# Check Supabase services
npx supabase status --output json | jq '.services[] | {name: .name, status: .status}'
```

## Container Security

### Security Configuration

- **Non-root user**: Containers run as `node` user
- **Capability restrictions**: Limited Linux capabilities
- **Read-only filesystems**: Where possible
- **Secret management**: Environment variables only
- **Network isolation**: Bridge networks

### Security Commands

```bash
# Check container user
docker exec slideheroes-app-test whoami

# View container capabilities
docker exec slideheroes-app-test cat /proc/1/status | grep Cap

# Scan for vulnerabilities
docker scan slideheroes-app-test

# Check exposed ports
docker port slideheroes-app-test
```

## DevContainer Management

**Note**: DevContainers exist but host development is preferred.

### DevContainer Files
- `.devcontainer/devcontainer.json`: VS Code config
- `.devcontainer/docker-compose.yml`: Service orchestration
- `.devcontainer/Dockerfile`: Main app container

### DevContainer Operations

```bash
# Open in DevContainer (VS Code)
code . --devcontainer

# Build DevContainer
docker build -f .devcontainer/Dockerfile -t slideheroes-dev .

# Run DevContainer services
docker-compose -f .devcontainer/docker-compose.yml up
```

## Container Cleanup

### Regular Maintenance

```bash
# Stop all SlideHeroes containers
docker stop $(docker ps -q --filter "name=slideheroes")

# Remove stopped containers
docker rm $(docker ps -aq --filter "name=slideheroes")

# Clean build cache
docker builder prune -f

# Full cleanup (careful!)
docker system prune -a --volumes
```

### Emergency Cleanup

```bash
# Kill all test processes
pkill -f "playwright|vitest|next-server"

# Force remove containers
docker rm -f slideheroes-app-test slideheroes-payload-test

# Reset Docker
docker system prune -af --volumes
systemctl restart docker  # Linux
# or restart Docker Desktop
```

## Performance Optimization

### Container Performance

- **BuildKit**: Enable for faster builds
- **Cache mounts**: Use in Dockerfiles
- **Multi-stage builds**: Reduce image size
- **Layer caching**: Order Dockerfile commands properly

```bash
# Enable BuildKit
export DOCKER_BUILDKIT=1

# Build with cache
docker build --cache-from slideheroes-app-test -t slideheroes-app-test .

# Check image size
docker images slideheroes-* --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

## Related Documentation

- [[docker-architecture]]: Architecture overview
- [[local-development-environment]]: Development setup
- [[docker-troubleshooting]]: Common issues
- [[test-architecture]]: Testing infrastructure