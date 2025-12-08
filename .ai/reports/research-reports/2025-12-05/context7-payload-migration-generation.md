# Context7 Research: Payload CMS Migration Generation

**Date**: 2025-12-05
**Agent**: context7-expert
**Libraries Researched**: payloadcms/payload

## Query Summary

Researched how Payload CMS migrate:create command works, why it might generate empty migrations, and the correct workflow for adding fields to existing collections.

## Findings

### How Payload migrate:create Works

**KEY INSIGHT**: Payload migrate:create command DOES NOT automatically detect schema changes. It only creates an empty migration template that you must manually populate.

From the documentation:

```text
npm run payload migrate:create optional-name-here
```

This command generates a new, empty migration file in the specified migrations directory.

The migration file structure is an empty template with up() and down() functions that you must manually write.

This is NOT like Django or Rails migrations that auto-generate schema changes. Payload migrations are manual.

### Why Empty Migrations Are Generated

This is the expected behavior. Payload CMS migrations are:

1. Manual only - No automatic schema diffing
2. Empty by design - You write the migration logic yourself
3. TypeScript-based - You use Drizzle ORM, Payload API, or raw SQL

### The Correct Workflow for Adding Fields

Payload uses Drizzle ORM under the hood, but does not require migrations for schema changes in development.

#### Option 1: Let Payload Auto-Push Schema (Development)

For development, Payload can automatically push schema changes to the database by setting push: true in the adapter config.

How it works:
1. Add field to collection config (e.g., QuizQuestions.ts)
2. Restart dev server
3. Payload detects schema changes and pushes them automatically
4. No migration file needed

When to use:
- Local development
- Testing new fields
- Rapid prototyping

When NOT to use:
- Production settings
- Team collaboration (causes conflicts)
- When you need migration history

#### Option 2: Manual Migrations (Production)

For production, you must write migrations manually:

1. Add field to collection config
2. Generate Drizzle schema for type safety: npx payload generate:db-schema
3. Create migration file: npm run payload migrate:create add-questiontype-field
4. Write the migration manually with SQL or Drizzle
5. Run the migration: npm run payload migrate

You write ALTER TABLE statements or use Drizzle ORM to add columns.

#### Option 3: Use beforeSchemaInit Hook (Advanced)

For custom schema modifications that Payload does not handle automatically, use the beforeSchemaInit hook to manipulate the raw schema directly.

When to use:
- Custom columns not defined in Payload fields
- Adding indexes or constraints
- Preserving existing database structures

## Key Takeaways

1. Payload does NOT auto-generate migration code - migrate:create creates empty files
2. Development: Use push: true for auto schema sync
3. Production: Write migrations manually using Drizzle/SQL
4. Schema generation: Run npx payload generate:db-schema for type safety
5. Migration structure: Payload uses Drizzle ORM under the hood
6. Transaction support: Migrations run within transactions (except SQLite)

## Production Migration Workflow

Recommended CI/CD pattern from documentation:

Run payload migrate to apply all pending migrations, then run build, then deploy.

## Troubleshooting Empty Migrations

Problem: migrate:create generates empty file

Solution: This is expected! You must:
1. Manually write the SQL/Drizzle code in the up function
2. OR use push: true in development to skip migrations
3. OR use beforeSchemaInit hooks for schema customization

Problem: Database does not have the new column

Solution: 
- In dev: Set push: true in adapter config
- In prod: Write and run a manual migration
- Check that collection config has the field defined

## Sources

- Payload CMS Migrations Documentation via Context7 (payloadcms/payload)
- Drizzle Integration Documentation
- Schema Generation Documentation

## Recommended Next Steps

1. For your current issue:
   - Option A: Enable push: true in your Postgres adapter for development
   - Option B: Write a manual migration to add the questiontype column
   
2. Long-term strategy:
   - Use push: true for local development
   - Use manual migrations for staging/production
   - Document migration workflow in your team docs

3. Schema management:
   - Run npx payload generate:db-schema after collection changes
   - Import generated schema in migration files for type safety
   - Consider using beforeSchemaInit for custom schema elements
