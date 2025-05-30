# Local Database Reset Guide

## Overview

This guide provides a comprehensive procedure for resetting the local development databases used in this turborepo project. It covers resetting both the Supabase database for the web app and the Payload CMS database for the content management system. Use this guide when local development environments become out of sync, or when you need a clean slate for testing or development.

## When to Use This Guide

- Local Supabase or Payload databases are corrupted or out of sync with migrations.
- You want to reset local databases to a known clean state.
- After major schema changes or migrations that require a fresh start.
- When debugging issues related to database state inconsistencies.

## Prerequisites and Safety Checks

- Ensure you are working in a local development environment. This guide is NOT for production or remote environments.
- Backup any important local data before proceeding.
- Confirm that no local development servers are running that might interfere with the reset.
- Have the Supabase CLI installed and configured for local development.
- Have Payload CLI installed and accessible.
- Be familiar with the turborepo structure and workspace directories.

## Backup Procedures (Local)

Even though this is local development, it is recommended to backup your data before resetting:

1. **Supabase Backup:**
   - Use `pg_dump` or Supabase CLI export commands to export your local database.
   - Example:
     ```bash
     pg_dump -h localhost -p 54322 -U postgres -Fc -f backups/supabase_local_backup.dump postgres
     ```
   - Adjust host, port, user, and database name as per your local setup.

2. **Payload Backup:**
   - Export your Payload CMS data using Payload export commands or database dump tools depending on your Payload database.
   - Store backups in a safe local directory.

## Step-by-Step Reset Procedure

### 1. Reset Supabase Local Database

- Navigate to the `apps/web/supabase/` directory.
- Use the existing npm script `supabase:web:reset` which runs the Supabase CLI reset command.
- This command resets the local Supabase database to the current migration state.

Example command:
```bash
pnpm --filter web run supabase:web:reset
```

Alternatively, directly use:
```bash
supabase db reset
```
Ensure you run this in the `apps/web/supabase/` directory or configure the CLI accordingly.

### 2. Reset Payload CMS Local Database

- Navigate to the `apps/payload/` directory.
- Use the existing npm script `payload:migrate:ssl` which runs Payload migration commands with SSL options.
- This will apply migrations and reset the Payload CMS schema as needed.

Example command:
```bash
pnpm --filter payload run payload:migrate:ssl
```

Alternatively, directly use:
```bash
payload migrate reset
payload migrate up
```
Run these commands in the `apps/payload/` directory.

### 3. Additional Turborepo Considerations

- Since this is a turborepo, ensure you run the above commands in the correct workspace directories.
- Use `pnpm --filter <app>` to target specific apps.
- Confirm that environment variables for local development (e.g., connection strings) are correctly set for both Supabase and Payload.

## Verification Steps

- After resetting, verify that the Supabase database is accessible and the schema matches the latest migrations.
- Verify that Payload CMS starts correctly and the schema is applied.
- Run local development servers for both apps and confirm they connect successfully to their respective databases.
- Check logs for any errors during startup or migration.

## Troubleshooting

- If Supabase CLI commands fail, check that the local Supabase Docker container is running.
- Verify local database connection strings and ports.
- For Payload, ensure the database connection is correct and the Payload CLI version matches the project requirements.
- Check for locked migrations or partial migration states and resolve by cleaning migration tables if necessary.
- Review turborepo workspace configurations if commands do not run as expected.

## Recovery Procedures

- If reset fails or data is lost unintentionally, restore from the backups created earlier.
- For Supabase, use `pg_restore` or Supabase import commands to restore the database.
- For Payload, use Payload import commands or restore the database dump.
- Re-run migrations after restoring to ensure schema consistency.

---

This guide aims to provide a safe, practical, and comprehensive approach to resetting local development databases in this project. Always backup before resetting and verify after completion.
## Surgical Environment Variable Cleanup for Payload Reset

When resetting the Payload CMS local database and migrations, it is important to avoid conflicts caused by duplicated environment variables across `.env`, `.env.development`, and `.env.production` files.

### Identifying Conflicting Variables

Conflicts typically arise when the same variables are defined with different values in `.env` and `.env.development` or `.env.production`. Common conflicting variables include:

- `NODE_ENV`
- `DATABASE_URI`
- `PAYLOAD_SECRET`
- `PAYLOAD_PUBLIC_SERVER_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_WEBHOOK_SECRET`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_ENDPOINT`
- `R2_REGION`
- `R2_ACCOUNT_ID`
- `R2_MEDIA_BUCKET`
- `R2_DOWNLOADS_BUCKET`
- `PAYLOAD_ENABLE_SSL`
- `PAYLOAD_MIGRATION_MODE`

### Comparing Environment Files

Use the following commands to compare environment files and identify overlapping variables:

```bash
# List variables in .env
cat apps/payload/.env | grep -v '^#' | cut -d '=' -f 1 | sort > env-vars.txt

# List variables in .env.development
cat apps/payload/.env.development | grep -v '^#' | cut -d '=' -f 1 | sort > env-dev-vars.txt

# List variables in .env.production
cat apps/payload/.env.production | grep -v '^#' | cut -d '=' -f 1 | sort > env-prod-vars.txt

# Compare .env and .env.development
comm -12 env-vars.txt env-dev-vars.txt

# Compare .env and .env.production
comm -12 env-vars.txt env-prod-vars.txt
```

### Surgical Cleanup Procedure

1. Remove from `.env` all variables that are duplicated in `.env.development` and `.env.production` and cause conflicts.
2. Keep unique variables in `.env` that are not present in `.env.development` or `.env.production`.
3. Example cleaned `.env` content after removal:

```env
# Added by Payload
# Environment

# Optional: Logging Configuration
LOG_LEVEL=info
PAYLOAD_DEBUG=false

# Optional: Database Health Monitoring
ENABLE_DB_HEALTH_MONITORING=true
DB_HEALTH_CHECK_INTERVAL=30000
```

### Payload Reset Procedure with Cleaned Environment

1. Clean the `.env` file as described above.
2. Run the Payload migration reset command:

```bash
pnpm --filter payload run migrate:reset
```

3. Start the Payload development server:

```bash
pnpm --filter payload run dev
```

4. Verify that Payload connects properly to the local database without environment conflicts.

### Verification Steps

- Confirm that the Payload server starts without errors related to environment variables.
- Check that the database connection string corresponds to the local development database.
- Ensure that migration mode and SSL settings are correctly applied from `.env.development` or `.env.production`.

This surgical approach preserves unique environment settings while eliminating conflicts, enabling smooth local development and migration resets.