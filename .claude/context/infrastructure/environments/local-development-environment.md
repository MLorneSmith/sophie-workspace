---
id: "local-development-environment"
title: "Local Development Environment Setup"
version: "1.0.0"
category: "systems"
description: "Complete local development environment setup and daily workflows for SlideHeroes development"
tags: ["development", "setup", "workflow", "environment", "supabase", "docker"]
dependencies: ["docker-architecture"]
cross_references:
  - id: "docker-architecture"
    type: "prerequisite"
    description: "Understanding the hybrid architecture"
  - id: "docker-containers-management"
    type: "related"
    description: "Managing test containers"
  - id: "supabase-cli"
    type: "related"
    description: "Supabase CLI operations"
created: "2025-09-22"
last_updated: "2025-09-22"
author: "create-context"
---

# Local Development Environment Setup

Complete setup and workflow guide for SlideHeroes local development using the hybrid Docker architecture.

## Initial Setup

### Prerequisites
- Node.js 20+ and pnpm 8+
- Docker Desktop (Windows/macOS) or Docker Engine (Linux)
- Git and GitHub CLI
- Supabase CLI (`npm install -g supabase`)
- Claude Code (for AI features)

### Clone and Install

```bash
# 1. Clone repository
git clone https://github.com/MLorneSmith/2025slideheroes.git
cd 2025slideheroes

# 2. Install dependencies
pnpm install

# 3. Copy environment files
cp apps/web/.env.example apps/web/.env.local
cp apps/e2e/.env.example apps/e2e/.env.test
```

### Start Backend Services

```bash
# 4. Start main Supabase (from apps/web)
cd apps/web
npx supabase start  # Creates 2025slideheroes-db on 39000-39006

# 5. Start E2E Supabase (from apps/e2e)
cd ../e2e
npx supabase start  # Creates 2025slideheroes-e2e on 55321-55327

# 6. Return to project root
cd ../..
```

### Configure MCP Servers

MCP servers run natively through Claude Code:
1. Open Claude Code
2. Servers auto-start from `.mcp.json` configuration
3. Check `.claude/settings.local.json` to enable/disable servers

### Start Development Server

```bash
# 7. Start Next.js dev server (from project root)
pnpm dev  # Runs on http://localhost:3000
```

## Daily Development Workflow

### Standard Development Flow

```bash
# Morning startup
npx supabase start              # Start Supabase if not running
pnpm dev                        # Start dev server

# Development commands
pnpm lint                       # Run linting
pnpm typecheck                  # Check TypeScript
pnpm test:unit                  # Run unit tests

# Before committing
pnpm codecheck                  # Full quality check
```

### Parallel Development and Testing

```bash
# Terminal 1: Development
pnpm dev                        # Port 3000, main Supabase

# Terminal 2: Test containers
docker-compose -f docker-compose.test.yml up -d  # Ports 3001/3021

# Terminal 3: Run tests
/test                           # Auto-detects containers
```

## Environment Configuration

### Critical Variables

```bash
# apps/web/.env.local
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:39001/postgres
SUPABASE_URL=http://localhost:39000
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Keys (obtain from providers)
PERPLEXITY_API_KEY=[your-key]
GITHUB_PERSONAL_ACCESS_TOKEN=[your-token]
EXA_API_KEY=[your-key]
```

### Port Reference

| Service | Dev Port | Test Port | Purpose |
|---------|----------|-----------|---------|
| Next.js | 3000 | 3001 | Web application |
| Payload CMS | 3020 | 3021 | Content management |
| Supabase API | 39000 | 55321 | API gateway |
| PostgreSQL | 39001 | 55322 | Database |
| Studio | 39002 | 55323 | Database UI |

## Common Development Tasks

### Database Operations

```bash
# Connect to database
psql postgresql://postgres:postgres@127.0.0.1:39001/postgres

# Reset database
npx supabase db reset

# Run migrations
npx supabase migration up

# Generate types
npx supabase gen types typescript --local > apps/web/lib/database.types.ts

# Open Studio UI
open http://localhost:39002
```

### Supabase Management

```bash
# Check status
npx supabase status

# View logs
npx supabase logs

# Stop services
npx supabase stop

# Clean restart
npx supabase stop --no-backup
npx supabase start
```

### Testing Workflows

```bash
# Unit tests
pnpm test:unit

# E2E tests (requires test containers)
pnpm test:e2e

# Coverage report
pnpm test:coverage

# Quick infrastructure check
/test --quick
```

## File Structure

### Project Layout
```
2025slideheroes/
├── apps/
│   ├── web/              # Main Next.js app
│   │   ├── app/          # App Router pages
│   │   ├── supabase/     # Migrations & functions
│   │   └── .env.local    # Environment variables
│   ├── e2e/              # E2E tests
│   └── payload/          # Payload CMS
├── packages/             # Shared packages
├── .claude/              # Claude Code configs
├── .mcp.json             # MCP server config
└── docker-compose.test.yml  # Test containers
```

### Key Directories
- `apps/web/app/`: Next.js pages and API routes
- `apps/web/supabase/`: Database migrations and edge functions
- `packages/`: Shared code between apps
- `.claude/`: Claude Code commands and context

## Network Architecture

### Docker Networks
- `slideheroes-test`: Test container network
- Supabase networks managed by CLI
- Host networking for development server

### Service Communication
- Dev server → Supabase: `localhost:39000`
- Test containers → E2E Supabase: `localhost:55321`
- MCP servers: Various ports via Claude Code

## Volume Management

### Development Volumes
- `node_modules`: Package dependencies
- `pnpm_store`: Shared package cache
- `.next`: Build cache
- `.turbo`: Turborepo cache

### Database Volumes
- `supabase_data`: Local Supabase data
- `postgres_data`: PostgreSQL persistence
- Managed by Supabase CLI

## Prevention Mechanisms

### Correct Stack Creation

**Always run Supabase commands from correct directories:**

```bash
# ✅ CORRECT - Main development
cd apps/web && npx supabase start

# ✅ CORRECT - E2E testing
cd apps/e2e && npx supabase start

# ❌ WRONG - Project root (blocked by hook)
npx supabase start  # Creates wrong stack
```

The project includes a Claude Code hook that prevents incorrect stack creation from the project root.

## Related Documentation

- [[docker-architecture]]: Architecture overview
- [[docker-containers-management]]: Container operations
- [[docker-troubleshooting]]: Common issues
- [[supabase-cli]]: Supabase CLI reference