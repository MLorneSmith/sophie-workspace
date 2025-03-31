# Payload CMS Migrations

This directory contains database migrations for Payload CMS. These migrations are used to manage schema changes in a controlled and versioned manner.

## Important Notes on PostgreSQL Integration

When working with Payload CMS and PostgreSQL, be aware of the following:

1. **Column Naming Conventions**: Payload CMS expects relationship tables to use `_parent_id` (with underscore prefix) for parent references. Using `parent_id` without the underscore will cause errors like `cannot insert a non-DEFAULT value into column "parent_id"`.

2. **Array Fields**: Each array field in a collection requires a corresponding table in the database. For example, if a `QuizQuestions` collection has an `options` array field, there must be a `quiz_questions_options` table.

3. **Foreign Key Constraints**: All relationship tables should have proper foreign key constraints to maintain data integrity.

4. **Consistent Naming**: Use consistent naming conventions across all tables and columns. For array fields, use `_order` instead of `order` for consistency.

## Migration Workflow

### Development

In development environments, schema push is enabled by default. This means that changes to your collection definitions will automatically update the database schema. This allows for rapid development and iteration.

```typescript
// In payload.config.ts
db: postgresAdapter({
  pool: {
    connectionString: process.env.DATABASE_URI || '',
  },
  // Enable schema push in development, disable in production
  push: process.env.NODE_ENV !== 'production',
}),
```

### Creating Migrations

After finalizing collection changes, create a migration to capture the schema changes:

```bash
pnpm migrate:create <migration-name>
```

This will generate a TypeScript migration file in this directory with both `up` and `down` functions.

### Production Deployment

In production environments, schema push is disabled. Instead, migrations are run during deployment:

```bash
pnpm migrate
```

This will run all pending migrations in order.

### Checking Migration Status

To check the status of migrations:

```bash
pnpm migrate:status
```

This will show which migrations have been applied and which are pending.

### Rolling Back Migrations

To roll back the most recent migration:

```bash
pnpm migrate:down
```

For multiple rollbacks, run this command multiple times.

## Migration Files

Each migration file exports two functions:

- `up`: Applied when running migrations forward
- `down`: Applied when rolling back migrations

Example:

```typescript
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- SQL statements to apply the migration
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- SQL statements to roll back the migration
  `)
}
```

## Best Practices

1. Always create migrations for schema changes rather than modifying the database directly
2. Test migrations thoroughly in development before applying to production
3. Keep migrations small and focused on specific changes
4. Use transactions for complex migrations to ensure atomicity
5. Include both "up" and "down" functions in your migrations
6. Use descriptive names for migration files
7. Use consistent column naming conventions (`_parent_id` for relationship tables)
8. Create tables for all array fields in collections
9. Add proper foreign key constraints for all relationships
10. Run migrations using the reset-and-migrate script for a clean state

## Troubleshooting

If you encounter issues with Payload CMS and PostgreSQL:

1. **Column Naming Issues**: Check that all relationship tables use `_parent_id` instead of `parent_id`.
2. **Missing Tables**: Ensure each array field has a corresponding table in the database.
3. **Foreign Key Constraints**: Verify that all relationship tables have proper foreign key constraints.
4. **Reset and Migrate**: Use the `reset-and-migrate.ps1` script to reset the database and run all migrations in the correct order.

For more details on the fixes implemented, see `z.plan/payload-postgres-fix-implementation-2.md`.
