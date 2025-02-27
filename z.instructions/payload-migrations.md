# Payload CMS Migration Workflow

This document outlines the workflow for managing Payload CMS schema and content migrations and deploying them to production.

## Overview

The workflow consists of two main types of migrations:

1. **Schema Migrations**: Changes to the database schema (tables, fields, etc.)
2. **Content Migrations**: Moving content from various sources to Payload CMS collections

The overall process consists of three main steps:

1. **Local Development**: Make schema/content changes locally and create migration files
2. **Deployment to Production**: Commit and push the migration files to the repository
3. **Run Migrations on Remote Database**: Automatically run migrations during deployment

## 1. Local Development

### Making Schema Changes

1. Make schema changes locally by modifying collection files in `apps/payload/src/collections/`
2. Run the app locally to test the changes:

```bash
cd apps/payload
pnpm dev
```

### Creating Migration Files

1. Generate a migration file for your schema changes:

```bash
cd apps/payload
pnpm migrate:create --name your-migration-name
```

This will create a new migration file in `apps/web/supabase/migrations/payload/` with a timestamp and the name you provided.

2. Edit the migration file if needed to customize the schema changes.

3. Test the migration locally:

```bash
cd apps/payload
pnpm migrate
```

## 2. Deployment to Production

1. Commit the migration files to your repository:

```bash
git add apps/web/supabase/migrations/payload/
git commit -m "Add migration for [your changes]"
git push
```

2. Deploy the changes to Vercel:
   - This can be done automatically via CI/CD if set up
   - Or manually from the Vercel dashboard

## 3. Run Migrations on Remote Database

Migrations will run automatically during deployment because:

1. We've updated the Vercel build command to include running migrations:

   ```
   cd ../.. && turbo run migrate build --filter=payload-app
   ```

2. We've added the `migrate` script to the Turborepo pipeline in `turbo.json`:

   ```json
   "migrate": {
     "cache": false,
     "outputs": []
   }
   ```

3. The Payload CMS app's `migrate` script is defined in `apps/payload/package.json`:
   ```json
   "migrate": "cross-env NODE_OPTIONS=--no-deprecation payload migrate"
   ```

## Checking Migration Status

To check the status of migrations:

```bash
cd apps/payload
pnpm migrate:status
```

This will show which migrations have been applied and which are pending.

## Rolling Back Migrations

If you need to roll back a migration:

```bash
cd apps/payload
pnpm migrate:down
```

This will roll back the most recent migration. You can run this multiple times to roll back multiple migrations.

## Refreshing Migrations

If you need to refresh all migrations (roll back all and then apply all):

```bash
cd apps/payload
pnpm migrate:refresh
```

This is useful during development but should be used with caution in production.

## Content Migrations

In addition to schema migrations, we use the `@kit/content-migrations` package to migrate content from various sources to Payload CMS collections.

### Environment Setup for Content Migrations

Content migration scripts require the following environment variables:

```
DATABASE_URI=postgresql://postgres:postgres@localhost:54322/postgres
PAYLOAD_SECRET=your-secret-key
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3020
```

Create a `.env` file in the root of the content-migrations package with these variables. For different environments, you can create environment-specific files:

- `.env.development`
- `.env.production`

To test that the environment variables are properly loaded:

```bash
pnpm --filter @kit/content-migrations test:env
```

### Running Content Migrations

To run all content migrations:

```bash
pnpm --filter @kit/content-migrations migrate:all
```

To run a specific migration (e.g., documentation migration):

```bash
pnpm --filter @kit/content-migrations migrate:docs
```

### Available Content Migrations

1. **Documentation Migration**: Migrates documentation from Markdown files to the Payload CMS documentation collection.

### Creating New Content Migrations

To add a new content migration:

1. Create a new script in the `packages/content-migrations/src/scripts` directory
2. Add any necessary utility functions to the `packages/content-migrations/src/utils` directory
3. Update the `migrate-all.ts` script to include the new migration
4. Add a new script to `package.json` to run the migration directly

### Content Migration Utilities

The package provides utility functions for content migrations:

- `convertMarkdownToLexical`: Converts Markdown content to a Lexical editor compatible format
- `getPayloadClient`: Gets a Payload CMS client instance for interacting with Payload CMS

## Best Practices

### Schema Migration Best Practices

1. **Always test migrations locally** before deploying to production
2. **Keep migrations small and focused** on specific changes
3. **Include both up and down migrations** to allow for rollbacks
4. **Document complex migrations** with comments
5. **Back up the database** before applying migrations in production
6. **Use descriptive names** for migration files
7. **Avoid modifying existing migration files** that have been applied to production

### Content Migration Best Practices

1. **Validate source content** before migration to ensure it meets the expected format
2. **Handle edge cases** such as missing fields or invalid content
3. **Implement error handling** to prevent migration failures from affecting the entire process
4. **Log migration results** for auditing and troubleshooting
5. **Create idempotent migrations** that can be run multiple times without duplicating content
6. **Test with a subset of data** before running full migrations
7. **Consider performance** for large datasets by implementing batching or pagination

## Integration with Deployment Process

For a complete deployment process that includes both schema and content migrations:

1. **Run schema migrations first** to ensure the database structure is ready
2. **Run content migrations second** to populate the newly created or modified collections
3. **Verify both migrations** were successful before considering the deployment complete

You can add content migrations to your Vercel deployment process by updating the build command:

```
cd ../.. && turbo run migrate build --filter=payload-app && pnpm --filter @kit/content-migrations migrate:all
```

However, for large content migrations, it may be better to run them separately after deployment to avoid timeout issues during the build process.
