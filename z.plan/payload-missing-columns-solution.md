# Payload CMS Missing Columns: Analysis and Solutions

## Problem Statement

We are encountering several errors in our Payload CMS integration with PostgreSQL related to missing columns:

```
error: column courses__rels.course_lessons_id does not exist
error: column "featured_image_id" does not exist
error: column posts.image_id does not exist
error: column quiz_questions.quiz_id does not exist
```

These errors prevent us from properly using Payload CMS collections and accessing content through the admin panel.

## Root Cause Analysis

### Serial Type Incompatibility

The primary issue is a compatibility problem between Payload CMS's PostgreSQL adapter and our PostgreSQL setup:

1. Payload's PostgreSQL adapter uses the "serial" type for auto-incrementing columns
2. Some PostgreSQL setups (especially cloud-hosted ones) use "identity columns" instead (introduced in PostgreSQL 10)
3. This causes the schema push to fail when trying to create tables with the "serial" type

This is a known issue documented in GitHub discussion #8096 titled "postgresql: use identity columns instead of serial":

> "I am running into 'Internal error: error: type "serial" does not exist' when setting up payload 3 beta 99 with a postgresql connection to xata.io"

### Missing Columns

The missing column errors are a direct result of the schema push failure. When schema push is disabled to avoid the serial type error, the necessary columns aren't created in the database. These columns include:

1. `courses__rels.course_lessons_id` - Relationship column for course lessons
2. `featured_image_id` - Image reference column
3. `posts.image_id` - Image reference column for posts
4. `quiz_questions.quiz_id` - Relationship column for quiz questions

## Potential Solutions

### Option 1: Use Payload Migrations Instead of Schema Push

Payload's documentation recommends:

> "The typical workflow in Payload is to build out your Payload configs, install plugins, and make progress in development mode - allowing Drizzle to push your changes to your local database for you. Once you're finished, you can create a migration."

Steps:

1. Keep schema push disabled (`push: false`)
2. Create a migration using `payload migrate:create`
3. Edit the migration to use "identity" columns instead of "serial"
4. Apply the migration with `payload migrate`

**Pros:**

- Follows Payload's recommended workflow
- Provides a repeatable, version-controlled solution
- Can be customized to use identity columns instead of serial
- Will work in all environments (development, staging, production)

**Cons:**

- Requires understanding of Payload's migration system
- May require manual editing of migration files

### Option 2: Use beforeSchemaInit Hook

Reddit discussion on r/PayloadCMS suggests:

> "Payload now has a way to use an existing database that has other tables and columns that are not managed by the CMS. All you need to do is pass your existing drizzle schema which you can use drizzle's tool to introspect the db to get it. This is done with the beforeSchemaInit hook."

Implementation:

```typescript
postgresAdapter({
  pool: {
    connectionString: process.env.DATABASE_URI || '',
  },
  schemaName: 'payload',
  push: false,
  beforeSchemaInit: [
    ({ schema, adapter }) => {
      // Add missing columns to schema
      return {
        ...schema,
        tables: {
          ...schema.tables,
          // Define tables with correct column types
        },
      };
    },
  ],
});
```

**Pros:**

- Allows fine-grained control over schema definition
- Can define columns with correct types (avoiding "serial")
- Works with schema push disabled

**Cons:**

- More complex implementation
- Requires understanding of Drizzle schema definition
- May need to be updated when collection definitions change

### Option 3: Manually Create Missing Columns

Steps:

1. Keep schema push disabled
2. Create SQL scripts to add the missing columns:

```sql
-- Add missing columns
ALTER TABLE payload.courses_rels ADD COLUMN course_lessons_id INTEGER;
ALTER TABLE payload.courses ADD COLUMN featured_image_id INTEGER;
ALTER TABLE payload.posts ADD COLUMN image_id INTEGER;
ALTER TABLE payload.quiz_questions ADD COLUMN quiz_id INTEGER;
```

**Pros:**

- Direct and straightforward approach
- Quick to implement
- No need to modify Payload configuration

**Cons:**

- Not a long-term solution
- Doesn't address the root cause
- May need to be repeated for future schema changes
- Doesn't integrate with Payload's schema management

## Recommended Approach

Based on our research, we recommend **Option 1: Use Payload Migrations** as the most robust and maintainable solution:

1. Keep schema push disabled in the configuration:

   ```typescript
   db: postgresAdapter({
     pool: {
       connectionString: process.env.DATABASE_URI || '',
     },
     push: false,
     schemaName: 'payload',
   }),
   ```

2. Create a migration:

   ```bash
   cd apps/payload
   pnpm payload migrate:create
   ```

3. Edit the generated migration file to:

   - Use "identity" columns instead of "serial"
   - Add the missing columns with appropriate types

4. Apply the migration:
   ```bash
   pnpm payload migrate
   ```

This approach follows Payload's recommended workflow, provides a repeatable solution, and addresses the root cause of the issue by using compatible column types.

## References

1. [Payload CMS Migrations Documentation](https://payloadcms.com/docs/database/migrations)
2. [GitHub Discussion #8096: postgresql: use identity columns instead of serial](https://github.com/payloadcms/payload/discussions/8096)
3. [PostgreSQL Identity Columns](https://www.postgresql.org/docs/current/sql-createtable.html#SQL-CREATETABLE-IDENTITY)
4. [Reddit Discussion: How to add Payload CMS table to an existing database?](https://www.reddit.com/r/PayloadCMS/comments/1csyp7h/how_to_add_payload_cms_table_to_an_existing/)
