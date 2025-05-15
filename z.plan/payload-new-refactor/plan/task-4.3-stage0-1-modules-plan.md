# Implementation Plan: Task 4.3 - Develop Stage 0 (DB Reset) & Stage 1 (Schema Apply) Modules

**Version:** 1.0
**Date:** May 13, 2025
**Parent Task (Master Plan):** 4.3. Develop Stage 0 (DB Reset) & Stage 1 (Schema Apply) Modules
**Related Design Document:** `z.plan/payload-new-refactor/design/payload-refactor-design-requirements-v2.md`
**Depends On:**
*   Task 4.1: Main Node.js Orchestrator (`initialize-payload-data.ts`) structure in place.
*   Task 4.2: Build process for `init-scripts` configured and working.

## 1. Introduction

**Objective:** To implement the TypeScript modules responsible for Stage 0 (Database Schema Reset) and Stage 1 (Payload Schema Migration Application). These modules will be invoked by the main orchestrator (`initialize-payload-data.ts`).

**Location of Modules:** `apps/payload/src/init-scripts/stages/`

## 2. Prerequisites

*   The main orchestrator script (`initialize-payload-data.ts`) can be compiled and run (even with other stages stubbed).
*   Environment variables (especially `DATABASE_URI`) are correctly loaded by the orchestrator.
*   A logger instance (e.g., `pino.Logger`) and parsed CLI arguments are passed from the orchestrator to these stage functions.
*   Payload CLI (`payload migrate`) is functional from within the `apps/payload` directory.

## 3. Module: `stage0-reset-schema.ts`

### 3.1. File Creation
*   Create `apps/payload/src/init-scripts/stages/stage0-reset-schema.ts`.

### 3.2. Dependencies
*   Install `pg` (node-postgres) client: `pnpm --filter payload add pg`
*   Install types for `pg`: `pnpm --filter payload add -D @types/pg`

### 3.3. Function Definition
```typescript
// apps/payload/src/init-scripts/stages/stage0-reset-schema.ts
import { Client } from 'pg';
import type { Logger } from 'pino'; // Assuming pino, adjust if different

interface Stage0Args {
  skipResetSchema?: boolean;
  // Add other relevant args if any, e.g., db related if not solely from env
}

export async function runStage0_ResetSchema(
  logger: Logger,
  cliArgs: Stage0Args,
): Promise<void> {
  logger.info('Starting Stage 0: Database Schema Reset...');

  if (cliArgs.skipResetSchema) {
    logger.info('Stage 0: Skipped due to --skip-reset-schema flag.');
    return;
  }

  const dbUri = process.env.DATABASE_URI;
  if (!dbUri) {
    logger.error('DATABASE_URI environment variable is not set.');
    throw new Error('DATABASE_URI is not set for Stage 0.');
  }

  const pgClient = new Client({ connectionString: dbUri });

  try {
    logger.info('Connecting to database for schema reset...');
    await pgClient.connect();
    logger.info('Connected. Dropping "payload" schema if it exists...');
    await pgClient.query('DROP SCHEMA IF EXISTS payload CASCADE;');
    logger.info('"payload" schema dropped.');
    logger.info('Creating "payload" schema...');
    await pgClient.query('CREATE SCHEMA payload;');
    logger.info('"payload" schema created.');
    // Optionally, grant permissions if necessary for your setup
    // await pgClient.query('GRANT ALL ON SCHEMA payload TO your_user;');
    // logger.info('Permissions granted on "payload" schema.');
    logger.info('Stage 0: Database Schema Reset completed successfully.');
  } catch (error) {
    logger.error({ err: error }, 'Error during Stage 0: Database Schema Reset.');
    throw error; // Propagate error to halt orchestrator
  } finally {
    if ((pgClient as any)._connected) { // Check if client was connected
      logger.info('Closing database connection for Stage 0...');
      await pgClient.end();
      logger.info('Database connection for Stage 0 closed.');
    }
  }
}
```

### 3.4. Testing `stage0-reset-schema.ts`
1.  Temporarily modify `initialize-payload-data.ts` to *only* call `runStage0_ResetSchema`.
2.  Ensure `DATABASE_URI` in your `.env` points to a test/dev database.
3.  Run `pnpm --filter payload run init:data` (which should build and run the compiled JS).
4.  **Verification:**
    *   Check logs for success messages.
    *   Connect to the database (e.g., using Supabase Studio or `psql`) and verify that the `payload` schema has been dropped and recreated. If it existed with tables, those tables should be gone.

## 4. Module: `stage1-apply-migrations.ts`

### 4.1. File Creation
*   Create `apps/payload/src/init-scripts/stages/stage1-apply-migrations.ts`.

### 4.2. Dependencies
*   Install `execa` for robust child process execution: `pnpm --filter payload add execa`

### 4.3. Function Definition
```typescript
// apps/payload/src/init-scripts/stages/stage1-apply-migrations.ts
import path from 'path';
import { execa } from 'execa';
import type { Logger } from 'pino';

interface Stage1Args {
  skipApplyMigrations?: boolean;
  // Potentially PAYLOAD_CONFIG_PATH if needed by payload migrate explicitly
}

// Helper to determine monorepo root for correct CWD for pnpm filter
function getMonorepoRoot(): string {
  // Assuming this script (when compiled) is in apps/payload/dist/init-scripts/stages/
  return path.resolve(__dirname, '../../../../../'); 
}

export async function runStage1_ApplyMigrations(
  logger: Logger,
  cliArgs: Stage1Args,
): Promise<void> {
  logger.info('Starting Stage 1: Apply Payload Migrations...');

  if (cliArgs.skipApplyMigrations) {
    logger.info('Stage 1: Skipped due to --skip-apply-migrations flag.');
    return;
  }

  const monorepoRoot = getMonorepoRoot();
  const payloadAppDir = path.join(monorepoRoot, 'apps/payload');

  logger.info(`Running 'pnpm --filter payload payload migrate --yes' from ${monorepoRoot}`);
  logger.info(`Targeting Payload app in: ${payloadAppDir}`);

  // Ensure PAYLOAD_SECRET and DATABASE_URI are in the environment for the child process
  // The orchestrator should have loaded .env, so they should be inherited.

  try {
    const { stdout, stderr, exitCode } = await execa(
      'pnpm',
      ['--filter', 'payload', 'payload', 'migrate', '--yes'], // '--yes' to auto-confirm prompts
      { 
        cwd: monorepoRoot, // Run pnpm filter from monorepo root
        // shell: true, // May be needed on Windows for pnpm
        env: {
          ...process.env, // Inherit current environment
          // PAYLOAD_CONFIG_PATH: 'src/payload.config.ts' // if payload migrate needs it relative to apps/payload
        }
      }
    );

    logger.info({ stdoutFromMigrate: stdout }, 'Payload migrate stdout:');
    if (stderr) {
      logger.warn({ stderrFromMigrate: stderr }, 'Payload migrate stderr:');
    }

    if (exitCode !== 0) {
      throw new Error(`Payload migrate command failed with exit code ${exitCode}.`);
    }

    logger.info('Stage 1: Apply Payload Migrations completed successfully.');
  } catch (error) {
    logger.error({ err: error }, 'Error during Stage 1: Apply Payload Migrations.');
    throw error; // Propagate error
  }
}
```
*   **Note on `getMonorepoRoot()` and `cwd` for `execa`:** The `pnpm --filter payload ...` command should generally be run from the monorepo root for `pnpm` to correctly identify the `payload` workspace. The `payload migrate` command itself will then operate within the context of `apps/payload`.
*   **`--yes` flag:** Added to `payload migrate` to attempt non-interactive execution. Verify if your Payload version supports this or if there's an equivalent.
*   **Environment for `execa`:** `payload migrate` needs `DATABASE_URI` and `PAYLOAD_SECRET`. These should be inherited from the main orchestrator's process if `dotenv` loaded them. Explicitly passing them via `env` option in `execa` can be a fallback.

### 4.4. Testing `stage1-apply-migrations.ts`
1.  Ensure Stage 0 (`runStage0_ResetSchema`) has been run successfully, resulting in an empty `payload` schema.
2.  Temporarily modify `initialize-payload-data.ts` to call `runStage0_ResetSchema` then `runStage1_ApplyMigrations`.
3.  Run `pnpm --filter payload run init:data --skip-seed-core ...`.
4.  **Verification:**
    *   Check logs for success messages from Stage 1.
    *   Inspect the `payload` schema in your database. The `_payload_migrations` table should be present and populated. Collection tables (e.g., `users`, `media`, and any others defined in your (simplified) `payload.config.ts` from Phase 1) should now exist.

## 5. Integration with Main Orchestrator

1.  **Import and Call:**
    *   In `apps/payload/src/init-scripts/initialize-payload-data.ts`:
        ```typescript
        // ... other imports ...
        // import { runStage0_ResetSchema } from './stages/stage0-reset-schema';
        // import { runStage1_ApplyMigrations } from './stages/stage1-apply-migrations';

        // ... inside the main async IIFE, after payloadClient init (though these stages might not need it)
        // if (!argv.skipResetSchema) { // Check skip flags from argv
        //   await runStage0_ResetSchema(logger, argv);
        // }
        // if (!argv.skipApplyMigrations) {
        //   await runStage1_ApplyMigrations(logger, argv);
        // }
        ```
    *   Ensure the `logger` and `argv` (parsed CLI arguments) are correctly passed.

## 6. Deliverables for Task 4.3

*   A functional `apps/payload/src/init-scripts/stages/stage0-reset-schema.ts` module.
*   A functional `apps/payload/src/init-scripts/stages/stage1-apply-migrations.ts` module.
*   Updated `apps/payload/src/init-scripts/initialize-payload-data.ts` to correctly import and invoke these stage modules.
*   Successful test runs demonstrating that the orchestrator can execute these two stages, resulting in a reset schema followed by the application of Payload migrations.
*   Any new dependencies (e.g., `pg`, `execa`) added to `apps/payload/package.json`.
