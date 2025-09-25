---
id: "docker-architecture"
title: "Docker Architecture Overview"
version: "1.0.0"
category: "systems"
description: "Hybrid Docker architecture combining containerized services with host-based development for optimal performance"
tags: ["docker", "architecture", "containers", "supabase", "hybrid", "infrastructure"]
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
created: "2025-09-22"
last_updated: "2025-09-22"
author: "create-context"
---

# Docker Architecture Overview

SlideHeroes uses a **hybrid Docker architecture** that combines containerized services with host-based application development for optimal performance and developer experience.

## Architecture Components

### 1. Supabase CLI Stacks (Not docker-compose)
- **2025slideheroes-db**: Main development stack (ports 39000-39006)
- **2025slideheroes-e2e**: E2E testing stack (ports 55321-55327)

### 2. Docker Compose Stack
- **2025slideheroes-test**: Test environment with:
  - `slideheroes-app-test`: Next.js test server (port 3001)
  - `slideheroes-payload-test`: Payload CMS test server (port 3021)

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
| Main Supabase | Development | 39000-39006 | Supabase CLI |
| E2E Supabase | E2E Testing | 55321-55327 | Supabase CLI |
| Test Containers | Isolated Testing | 3001, 3021 | Docker Compose |
| MCP Servers | AI Integration | Various | Claude Code |

### Main Stack Services (39xxx)
- **39000**: API Gateway (Kong) + Edge Functions
- **39001**: PostgreSQL Database
- **39002**: Supabase Studio
- **39003-39005**: Inbucket Email
- **39006**: Analytics

### E2E Stack Services (55xxx)
- **55321**: API Gateway + Edge Functions
- **55322**: PostgreSQL Database
- **55323**: Supabase Studio
- **55324-55326**: Inbucket Email
- **55327**: Analytics

## Hybrid Edge Functions Architecture

SlideHeroes uses dual edge function providers for optimal performance:

### Supabase Edge Functions (Deno Runtime)
- **Location**: `apps/web/supabase/functions/`
- **Access**: `http://localhost:39000/functions/v1/{name}`
- **Use Cases**: Heavy file processing, external APIs
- **Examples**: powerpoint-generator, certificate-generator

### Vercel Edge Functions (V8 Isolates)
- **Location**: `apps/web/app/api/` with `export const runtime = 'edge'`
- **Use Cases**: AI content generation, lightweight processing
- **Examples**: /api/ai/generate-ideas, /api/ai/simplify-text

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

## Architecture Verification

```bash
# Verify entire infrastructure
echo "=== Supabase Stacks ==="
npx supabase status                    # Main: 39000/39001
cd apps/e2e && npx supabase status     # E2E: 55321/55322

echo "=== Docker Containers ==="
docker ps --filter "name=slideheroes-" --format "table {{.Names}}\t{{.Ports}}"
docker compose ls                      # Should show: 2025slideheroes-test

echo "=== Health Checks ==="
curl -s http://localhost:3001/api/health | jq '.status'
curl -s http://localhost:3021/api/health | jq '.status'
```

### Expected Healthy Setup
```
Main Supabase:   API=39000, DB=39001, Studio=39002
E2E Supabase:    API=55321, DB=55322, Studio=55323
Test Containers: slideheroes-app-test (3001), slideheroes-payload-test (3021)
Infrastructure:  All components healthy (7/7)
```

## When to Use Full Containerization

Consider full containerization when:
- Team grows and environment consistency becomes critical
- CI/CD pipeline needs exact parity with local
- Complex microservices architecture emerges
- Cross-platform development becomes essential

## Related Documentation

- [[local-development-environment]]: Daily development workflows
- [[docker-containers-management]]: Container operations
- [[docker-troubleshooting]]: Common issues and solutions
- [[test-architecture]]: Testing infrastructure details