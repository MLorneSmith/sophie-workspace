# Payload CMS Migration Clean Slate Plan

## Background

We have integrated Payload CMS into our Makerkit-based Next.js 15 app as our new CMS. However, we're encountering several database-related issues:

1. **Documentation Collection**: Error `relation "payload.documentation_breadcrumbs" does not exist`
2. **Posts Collection**: Error `column posts.image_id does not exist`
3. **Surveys Collection**: Error `relation "payload.surveys_rels" does not exist`
4. **Courses Collection**: Error `column courses__rels.course_lessons_id does not exist`

These issues stem from mismatches between our Payload CMS collection definitions and the actual database schema. Currently, we have:

- Payload CMS configured with `push: false` (preventing automatic schema creation)
- Custom SQL migration files in `apps/web/supabase/migrations/`
- Several database schema issues causing errors

## Root Cause Analysis

1. **Missing Tables/Columns**: Several required tables and columns are missing or named differently than what Payload CMS expects.
2. **Schema Push Disabled**: The PostgreSQL adapter configuration has `push: false`, which means Payload CMS won't automatically create database tables.
3. **Plugin Configuration Issues**: The nested-docs plugin for documentation collection requires specific tables that don't exist.
4. **Naming Inconsistencies**: Some fields in collections are named differently than their corresponding database columns.

## Solution: Clean Slate Approach

We'll implement a clean slate approach using Payload's native migration system instead of custom SQL migrations:

1. **Enable schema push temporarily** to allow Payload to automatically create the correct schema
2. **Generate proper TypeScript migrations** using Payload's built-in tools
3. **Replace custom SQL migrations** with Payload's native migration system
4. **Set up a proper migration workflow** for development and production

## Implementation Plan

### Step 1: Back Up Database

Before making any changes, ensure we have a backup of the current database:

```bash
# If using Supabase CLI
supabase db dump -f payload_backup.sql

# Or using pg_dump directly
pg_dump postgresql://postgres:postgres@localhost:54322/postgres -n payload > payload_backup.sql
```

### Step 2: Update Payload Configuration

Modify the Payload configuration to enable schema push:

```typescript
// In apps/payload/src/payload.config.ts
db: postgresAdapter({
  pool: {
    connectionString: process.env.DATABASE_URI || '',
  },
  // Use a custom schema to separate Payload tables from Makerkit tables
  schemaName: 'payload',
  // Enable push temporarily to fix schema issues
  push: true,
}),
```

### Step 3: Identify and Remove Payload SQL Migrations

The following Payload-specific SQL migrations will be replaced:

```
20250325160000_payload_initial_schema.sql
20250325160100_payload_course_quizzes.sql
20250325164500_payload_course_lessons.sql
20250325164600_payload_courses.sql
20250325164700_payload_posts.sql
20250325164800_payload_surveys.sql
20250325164900_payload_survey_questions.sql
20250325165000_payload_survey_responses.sql
20250325171300_payload_insert_course.sql
20250325172000_payload_fix_all_relationships.sql
20250325172500_payload_fix_courses_double_underscore_column.sql
20250325172800_payload_insert_course_lesson.sql
```

Create a backup of these files:

1. Create a backup directory: `apps/web/supabase/migrations/backup`
2. Move all Payload-related migrations to this backup directory

### Step 4: Run Payload to Generate Schema

Run Payload with schema push enabled to create the correct database schema:

```bash
cd apps/payload
pnpm dev
```

This will:

- Connect to the database
- Create all necessary tables with the correct structure
- Set up relationships properly
- Create any missing tables like `documentation_breadcrumbs`

### Step 5: Generate Payload Migrations

Once the schema is correctly created, generate TypeScript migrations:

```bash
cd apps/payload
npx payload migrate:create initial-schema
```

This creates a TypeScript migration file in `apps/payload/src/migrations/` that captures the current schema.

### Step 6: Create Data Migration (if needed)

If there's data in the Payload tables that needs to be preserved, create a data migration:

```bash
cd apps/payload
npx payload migrate:create data-migration
```

Then edit the generated migration file to include code to restore the data.

### Step 7: Update Configuration for Production

For production environments, update the configuration to disable schema push:

```typescript
db: postgresAdapter({
  pool: {
    connectionString: process.env.DATABASE_URI || '',
  },
  schemaName: 'payload',
  // Disable automatic schema pushing for production
  push: process.env.NODE_ENV !== 'production',
}),
```

### Step 8: Set Up Migration Scripts

Add migration scripts to `package.json`:

```json
{
  "scripts": {
    "migrate": "payload migrate",
    "migrate:create": "payload migrate:create",
    "migrate:down": "payload migrate:down",
    "migrate:status": "payload migrate:status"
  }
}
```

### Step 9: Document the New Workflow

#### Development Workflow

- Schema push is enabled in development
- Changes to collections automatically update the schema
- After finalizing collection changes, create migrations using `pnpm migrate:create`

#### Production Workflow

- Schema push is disabled in production
- Run migrations during deployment using `pnpm migrate`
- Always test migrations in staging before deploying to production

#### Rollback Procedure

- Use `pnpm migrate:down` to revert the last applied migration
- For multiple rollbacks, run `pnpm migrate:down` multiple times

### Step 10: Test the Solution

1. Test the admin panel to ensure all collections work correctly
2. Verify that relationships between collections work properly
3. Test creating and editing content in all collections
4. Ensure the nested-docs plugin works for the documentation collection

## Benefits of This Approach

1. **Consistency**: Database schema will always match collection definitions
2. **Type Safety**: TypeScript migrations are type-safe and easier to maintain
3. **Bidirectional**: Payload migrations include both "up" and "down" functions
4. **Integration**: Payload will track which migrations have been applied
5. **Simplicity**: No need to manually write SQL for Payload tables

## Future Considerations

1. Update CI/CD pipeline to run migrations during deployment
2. Implement a pre-deployment check to verify migrations
3. Set up regular database backups
4. Consider using Payload's migration system for content migrations as well

## References

- [Payload CMS PostgreSQL Documentation](https://payloadcms.com/docs/database/postgres)
- [Payload CMS Migrations Documentation](https://payloadcms.com/docs/database/migrations)
