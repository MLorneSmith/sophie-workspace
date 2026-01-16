# Perplexity Research: Supabase CLI Remote Operations Without Docker

**Date**: 2026-01-08
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API

## Query Summary

Researched whether Supabase CLI can run migrations and generate types against remote Supabase projects without requiring Docker or `supabase start`. The goal was to identify which CLI commands work in Docker-free environments (e.g., CI/CD pipelines, devcontainers without Docker-in-Docker).

## Key Findings

### 1. Can `supabase db push` Work Against Remote Without Docker?

**YES** - `supabase db push` works against remote databases without Docker.

**Commands that work:**
```bash
# Using linked project (requires prior `supabase link`)
supabase db push --linked

# Using explicit connection string
supabase db push --db-url <connection-string>

# Include seed data
supabase db push --include-seed
```

**Key points:**
- Docker is only required when targeting `--local` (the local development stack)
- Remote operations communicate directly with the hosted Supabase project via API/connection strings
- The `--linked` flag uses the project linked via `supabase link`
- The `--db-url` flag can target any PostgreSQL database (Supabase or otherwise)

### 2. Can `supabase db diff` Generate Migrations Against Remote?

**YES** - `supabase db diff` can generate migrations by comparing against a remote database.

**Commands that work:**
```bash
# Diff against linked remote project
supabase db diff --linked -f migration_name

# Diff with migra (more accurate SQL generation)
supabase db diff --use-migra -f migration_name --linked

# Diff against any remote Postgres via connection string
supabase db diff --db-url <connection-string> -f migration_name
```

**Alternative workflow with `db pull`:**
```bash
# Pull remote schema into a migration file
supabase db pull

# Pull specific schemas
supabase db pull --schema auth
supabase db pull --schema storage
```

### 3. Commands That Work WITHOUT Docker

| Command | Description | Requires Docker? |
|---------|-------------|------------------|
| `supabase login` | Authenticate with Supabase | No |
| `supabase link` | Link local config to remote project | No |
| `supabase db push --linked` | Push migrations to remote | No |
| `supabase db push --db-url` | Push migrations to any Postgres | No |
| `supabase db pull` | Pull remote schema to migration file | No |
| `supabase db diff --linked` | Diff against remote | No |
| `supabase migration up --linked` | Apply migrations to remote | No |
| `supabase migration list --linked` | List remote migrations | No |
| `supabase gen types typescript --linked` | Generate types from remote | No |
| `supabase gen types typescript --project-id` | Generate types from remote | No |

**Commands that REQUIRE Docker (local stack):**
| Command | Description |
|---------|-------------|
| `supabase start` | Start local Supabase stack |
| `supabase stop` | Stop local Supabase stack |
| `supabase db reset` | Reset local database |
| `supabase db reset --local` | Reset local database |
| `supabase db diff --local` | Diff local database |
| `supabase gen types typescript --local` | Generate types from local |

### 4. TypeScript Type Generation Without Docker

**YES** - Types can be generated from a remote Supabase project without Docker.

**Commands that work:**
```bash
# Using linked project
supabase gen types typescript --linked > database.types.ts

# Using explicit project ID
supabase gen types typescript --project-id abcdefghijklmnopqrst > database.types.ts

# Using remote database URL (any reachable Postgres)
supabase gen types typescript --db-url <connection-string> > database.types.ts
```

**Available flags for `supabase gen types`:**
- `--linked` - Generate from linked remote project (no Docker)
- `--project-id <id>` - Generate from specific project (no Docker)
- `--db-url <url>` - Generate from any Postgres connection (no Docker for remote URLs)
- `--local` - Generate from local database (REQUIRES Docker)
- `--lang <typescript|go|swift>` - Output language
- `--schema <name>` - Specific schema to generate

## Complete Docker-Free Workflow

### Initial Setup
```bash
# 1. Login to Supabase CLI
supabase login

# 2. Link to your remote project
supabase link --project-ref <project-id>
```

### Migration Development Workflow
```bash
# 3. Pull current remote schema (creates migration file)
supabase db pull

# 4. Write new migrations manually in supabase/migrations/

# 5. Preview what will be applied
supabase db push --dry-run

# 6. Apply migrations to remote
supabase db push

# 7. Apply with seed data
supabase db push --include-seed
```

### Type Generation in CI/CD
```bash
# Generate types from remote in CI pipeline
supabase gen types typescript --project-id "$PROJECT_REF" > database.types.ts

# Or using linked project
supabase gen types typescript --linked > database.types.ts
```

### GitHub Actions Example (No Docker Required)
```yaml
name: Update Database Types
on:
  schedule:
    - cron: '0 0 * * *'
jobs:
  update:
    runs-on: ubuntu-latest
    env:
      SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm install supabase --save-dev
      - run: npx supabase gen types typescript --project-id "${{ secrets.PROJECT_REF }}" > database.types.ts
      - name: Commit changes
        run: |
          git add database.types.ts
          git commit -m "Update database types" || exit 0
          git push
```

## Important Caveats

1. **`--db-url` with localhost requires Docker**: Using `--db-url` with a localhost connection (e.g., `postgresql://postgres:pass@localhost:5432/postgres`) will trigger Docker checks because the CLI assumes local databases run in Docker containers.

2. **Remote `db diff` requires linked project or `--db-url`**: You cannot diff against a remote database without either linking the project first or providing a connection string.

3. **`db reset` is local-only**: The `supabase db reset` command is designed for local development and requires Docker. For remote databases, use `supabase db push` to apply migrations.

4. **Seed data to remote**: Use `supabase db push --include-seed` to apply seed data to remote databases.

## Sources & Citations

- https://supabase.com/docs/guides/local-development/overview
- https://supabase.com/docs/guides/deployment/database-migrations
- https://supabase.com/docs/guides/api/rest/generating-types
- https://github.com/orgs/supabase/discussions/18483
- https://github.com/supabase/cli/issues/2536
- https://github.com/orgs/supabase/discussions/13832
- https://www.codu.co/articles/creating-supabase-migrations-from-remote-instance-mqbaqjl6

## Key Takeaways

- **Docker is only required for local development stack** (`supabase start`)
- **All remote operations work without Docker** when using `--linked`, `--project-id`, or `--db-url` flags
- **Type generation from remote is fully supported** via `--linked` or `--project-id`
- **Migration workflow can be fully Docker-free** using `db pull` and `db push --linked`
- **CI/CD pipelines can use Supabase CLI** without Docker for type generation and migrations

## Related Searches

- Supabase CLI in CI/CD pipelines without Docker
- Supabase migration strategies for multiple environments
- Supabase type generation in GitHub Actions
