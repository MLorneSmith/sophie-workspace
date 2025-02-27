# Payload CMS Migration Workflow

This document outlines the workflow for managing Payload CMS schema changes using migrations and deploying them to production.

## Overview

The workflow consists of three main steps:

1. **Local Development**: Make schema changes locally and create migration files
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

## Best Practices

1. **Always test migrations locally** before deploying to production
2. **Keep migrations small and focused** on specific changes
3. **Include both up and down migrations** to allow for rollbacks
4. **Document complex migrations** with comments
5. **Back up the database** before applying migrations in production
6. **Use descriptive names** for migration files
7. **Avoid modifying existing migration files** that have been applied to production
