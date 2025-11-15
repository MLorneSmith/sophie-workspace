# Supabase CLI Reference

**Purpose**: Comprehensive reference for Supabase CLI commands, workflows, and best practices for local development, migrations, and database management in the SlideHeroes project.

**Related Files**:

- `.claude/docs/tools/cli-references.md` - CLI tools overview
- `.claude/docs/tools/vercel-cli.md` - Vercel CLI reference
- `.claude/docs/database/` - Database patterns and RLS
- `apps/web/supabase/` - Migrations and configuration

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

The SlideHeroes project provides npm scripts for common Supabase operations:

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

Complete workflow for creating and deploying database changes:

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

## Advanced Features

### Database Inspection

Performance and health monitoring commands:

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

Database branching for feature development:

```bash
supabase branches create feature/new-feature
supabase branches list
supabase db push --branch feature/new-feature
supabase branches delete feature/new-feature
```

## Troubleshooting

### Docker Connection

```bash
docker ps  # Verify Docker running
export DOCKER_HOST=unix://"$HOME/.docker/run/docker.sock"  # macOS fix
```

### Migration Conflicts

```bash
supabase migration list
supabase migration repair <id> --status applied
supabase db reset --debug  # Force reset (dev only)
```

### Type Generation

```bash
supabase status  # Verify running
supabase stop && supabase start  # Restart
supabase gen types typescript --local > types/database.types.ts
```

### Authentication

```bash
supabase login --token $SUPABASE_ACCESS_TOKEN  # CI/CD
supabase link --project-ref PROJECT_ID  # Re-link project
```

## Best Practices

### Migrations

- **Keep atomic** - Single change per migration
- **Use descriptive names** - Clear indication of purpose
- **Test locally before deploying** - Always run `supabase db reset`
- **Document rollback procedures** - Plan for migration failures
- **Use `db diff`** - For UI changes in Studio

### Local Development

- **Maintain seed data** - Keep `supabase/seed.sql` updated
- **Use `.env.local`** - For configuration
- **Regular resets** - `supabase db reset` for clean state
- **Environment variables**:

  ```
  NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  ```

### CI/CD Integration

- **Use `supabase/setup-cli@v1`** - GitHub Action
- **Token-based authentication** - No interactive login
- **Run tests before deployment** - Validate migrations
- **Automated type generation** - Update types after migrations

## Database Workflow - CRITICAL SEQUENCE

When adding new database features, ALWAYS follow this exact order:

1. **Create/modify schema file** in `apps/web/supabase/schemas/XX-feature.sql`
2. **Generate migration**: `pnpm --filter web supabase:db:diff -f <migration_name>`
3. **Apply changes**: `pnpm --filter web supabase migration up` (or `pnpm supabase:web:reset` for clean rebuild)
4. **Generate types**: `pnpm supabase:web:typegen`
5. **Verify types exist** before using in code

**NEVER skip step 2** - schema files alone don't create tables! The migration step is required to apply changes to the database.

**Migration vs Reset**:

- Use `migration up` for normal development (applies only new migrations)
- Use `reset` when you need a clean database state or have schema conflicts

## Security & RLS

### Database Security Rules

- **Always enable RLS** on new tables unless explicitly instructed otherwise
- **Create policies for all operations** - Separate policies for SELECT, INSERT, UPDATE, DELETE
- **Index RLS filter columns** - Add indexes on user_id, tenant_id, etc.
- **Use ownership patterns** - `auth.uid() = user_id` for user-specific data
- **Never use SECURITY DEFINER** without explicit access controls
- **Use security_invoker=true** for views to maintain access control
- **Use existing helper functions** - `has_role_on_account()`, `is_account_owner()`, etc.

## Related Documentation

- **Vercel CLI**: `.claude/docs/tools/vercel-cli.md` - Deployment and environment management
- **Database Operations**: `.claude/docs/database/` - Database patterns and RLS
- **Testing Strategies**: `.claude/docs/testing/` - Comprehensive testing guides
- **CI/CD Workflows**: `.github/workflows/` - Automated deployment pipelines
