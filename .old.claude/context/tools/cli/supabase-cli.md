---
id: "supabase-cli"
title: "Supabase CLI Tool"
version: "1.1.0"
category: "tools"

# Discovery
description: "Essential Supabase CLI commands, workflows, and best practices for local development and production deployment"
tags: ["supabase", "cli", "database", "migrations", "edge-functions", "testing", "docker", "postgresql"]

# Relationships
dependencies: []
cross_references:
  - id: "database-migrations"
    type: "related"
    description: "Database migration patterns and workflows"
  - id: "docker-setup"
    type: "prerequisite"
    description: "Docker configuration for local development"
  - id: "test-architecture"
    type: "related"
    description: "Testing strategies including pgTAP examples"

# Maintenance
created: "2025-09-15"
last_updated: "2025-09-15"
author: "create-context"
---

# Supabase CLI Tool

## Overview

The Supabase CLI manages projects locally and in production, providing Docker-based development, Git-like migrations, Edge Functions, and TypeScript type generation.

## Key Concepts

- **Local Stack**: Docker-based Supabase environment
- **Migrations**: Version-controlled schema changes
- **Edge Functions**: Deno serverless functions
- **Type Generation**: Auto-generated TypeScript types
- **Branching**: Preview environments
- **pgTAP Testing**: Database unit testing

## Quick Setup

```bash
# Install
pnpm add supabase --save-dev

# Initialize & start
supabase init
supabase start

# Link to remote
supabase link --project-ref YOUR_PROJECT_ID
```

Configuration: `supabase/config.toml` (see project file for details)

## Essential Commands

```bash
# Project management
supabase init                       # Initialize project
supabase start                      # Start local stack
supabase stop                       # Stop local stack
supabase status                     # Check service status
supabase db reset                   # Reset database with migrations

# Migration management
supabase migration new <name>       # Create migration
supabase db diff -f <name>          # Generate migration from changes
supabase migration list             # List migrations
supabase db push                    # Push to remote

# Type generation
supabase gen types typescript --local > types/database.types.ts

# Testing
supabase test db                    # Run pgTAP tests
supabase db lint                    # Lint schema

# Edge Functions
supabase functions new <name>       # Create function
supabase functions serve            # Serve locally
supabase functions deploy <name>    # Deploy function
```

## Project Scripts

```bash
# Direct CLI access
pnpm supabase <command>

# Local development
pnpm supabase:start                 # Start if not running
pnpm supabase:stop                  # Stop services
pnpm supabase:reset                 # Reset database
pnpm supabase:status                # Check status

# Database operations
pnpm supabase:test                  # Run pgTAP tests
pnpm supabase:db:lint               # Lint schema
pnpm supabase:db:diff               # Generate migration
pnpm supabase:db:dump:local         # Dump local data

# Type generation
pnpm supabase:typegen               # Generate all types
pnpm supabase:typegen:packages      # Update package types
pnpm supabase:typegen:app           # Update app types

# Deployment
pnpm supabase:deploy                # Deploy to production
```

## Migration Workflow

```bash
# 1. Make schema changes (Studio or SQL)
# 2. Generate migration
supabase db diff -f add_user_profiles

# 3. Review & apply locally
cat supabase/migrations/*_add_user_profiles.sql
supabase db reset

# 4. Commit to Git
git add supabase/migrations/
git commit -m "Add user profiles table"

# 5. Deploy (via CI/CD)
supabase db push
```

## Troubleshooting

### Common Issues

**Docker Connection**

```bash
docker ps  # Verify Docker running
export DOCKER_HOST=unix://"$HOME/.docker/run/docker.sock"  # macOS fix
```

**Migration Conflicts**

```bash
supabase migration list
supabase migration repair <id> --status applied
supabase db reset --debug  # Force reset (dev only)
```

**Type Generation**

```bash
supabase status  # Verify running
supabase stop && supabase start  # Restart
supabase gen types typescript --local > types/database.types.ts
```

**Authentication**

```bash
supabase login --token $SUPABASE_ACCESS_TOKEN  # CI/CD
supabase link --project-ref PROJECT_ID  # Re-link project
```

## Best Practices

### Migrations

- Keep atomic (single change per migration)
- Use descriptive names
- Test locally before deploying
- Document rollback procedures
- Use `db diff` for UI changes

### Local Development

- Maintain seed data: `supabase/seed.sql`
- Use `.env.local` for configuration
- Regular resets: `supabase db reset`
- Environment variables:

  ```
  NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  ```

### CI/CD Integration

- Use `supabase/setup-cli@v1` GitHub Action
- Token-based authentication
- Run tests before deployment
- See `.github/workflows/` for examples

## Advanced Features

### Database Inspection

```bash
supabase inspect db-cache-hit       # Cache hit ratio
supabase inspect db-bloat           # Table/index bloat
supabase inspect db-locks           # Current locks
supabase inspect db-long-running-queries
supabase inspect db-outliers        # Slow queries
supabase inspect db-unused-indexes  # Unused indexes
supabase inspect db-table-sizes     # Table sizes
```

### Branching

```bash
supabase branches create feature/new-feature
supabase branches list
supabase db push --branch feature/new-feature
supabase branches delete feature/new-feature
```

### Vector/Embeddings

```sql
CREATE EXTENSION IF NOT EXISTS vector;
-- See database-migrations context for implementation details
```

## Related Files

- `/apps/web/supabase/migrations/` - Migration files
- `/apps/web/supabase/tests/database/` - pgTAP tests
- `/apps/web/supabase/seed/` - Seed data
- `/apps/web/supabase/config.toml` - Configuration
- `/packages/supabase/src/database.types.ts` - Generated types

## See Also

- [[database-migrations]]: Migration patterns and SQL examples
- [[docker-setup]]: Docker configuration
- [[test-architecture]]: Testing patterns and pgTAP examples
