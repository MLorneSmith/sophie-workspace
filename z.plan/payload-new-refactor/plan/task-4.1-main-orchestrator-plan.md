# Implementation Plan: Task 4.1 - Develop Main Node.js Orchestrator

**Version:** 1.0
**Date:** May 13, 2025
**Parent Task (Master Plan):** 4.1. Develop Main Node.js Orchestrator
**Related Design Document:** `z.plan/payload-new-refactor/design/payload-refactor-design-requirements-v2.md`

## 1. Introduction

**Objective:** To create the main Node.js/TypeScript orchestrator script, `initialize-payload-data.ts`, which will manage the entire Payload CMS data initialization lifecycle. This script will handle argument parsing, environment setup, Payload client initialization/shutdown, sequential execution of staged modules, and logging.

**Location:** `apps/payload/src/init-scripts/initialize-payload-data.ts`

## 2. Prerequisites

*   Phase 1 (Payload CMS Application Setup & Stabilization) is substantially complete, meaning:
    *   `apps/payload/src/payload.config.ts` is stable enough for Payload to initialize.
    *   Core Payload CLI commands (`generate:types`, `migrate`) are working.
*   Node.js (LTS version recommended) and `pnpm` are installed.
*   A TypeScript compilation strategy for this script will be defined as part of Task 4.2, but for initial development, `tsx` or direct `ts-node` execution can be used for testing this script in isolation.

## 3. Core Script Structure & Setup

1.  **Create File:**
    *   Create `apps/payload/src/init-scripts/initialize-payload-data.ts`.
2.  **Initial Imports:**
    ```typescript
    import path from 'path';
    import fs from 'fs'; // For path existence checks if needed
    import { getPayload } from 'payload';
    import type { Payload } from 'payload';
    // Argument parsing library (e.g., yargs) will be imported after installation
    // dotenv will be imported after installation
    // Logger library (e.g., pino) will be imported after installation
    ```
3.  **Main IIFE (Immediately Invoked Function Expression):**
    *   The entire script logic will be wrapped in an `async` IIFE to use top-level `await` and manage scope.
    ```typescript
    (async () => {
      // Script logic will go here
    })();
    ```

## 4. Command-Line Argument Parsing

1.  **Install Library:**
    *   Add `yargs` (or `commander`) to `devDependencies` in `apps/payload/package.json`.
    *   `cd apps/payload && pnpm add -D yargs @types/yargs`
2.  **Define and Parse Arguments:**
    *   At the beginning of the IIFE:
    ```typescript
    // import yargs from 'yargs';
    // import { hideBin } from 'yargs/helpers';

    // const argv = await yargs(hideBin(process.argv))
    //   .option('skip-reset-schema', { type: 'boolean', default: false, description: 'Skip Stage 0: Database Reset' })
    //   .option('skip-apply-migrations', { type: 'boolean', default: false, description: 'Skip Stage 1: Apply Payload Migrations' })
    //   .option('skip-seed-core', { type: 'boolean', default: false, description: 'Skip Stage 2: Core Content Seeding' })
    //   .option('skip-populate-relationships', { type: 'boolean', default: false, description: 'Skip Stage 3: Populate Relationships' })
    //   .option('skip-verification', { type: 'boolean', default: false, description: 'Skip Stage 4: Data Verification' })
    //   .option('env-path', { type: 'string', default: '.env', description: 'Path to the .env file (relative to project root)' })
    //   .option('payload-config-path', { type: 'string', default: 'apps/payload/src/payload.config.ts', description: 'Path to Payload config file (relative to project root)' })
    //   .help()
    //   .argv;
    ```
    *   Ensure paths provided via arguments are resolved correctly relative to the project root.

## 5. Environment Variable Loading

1.  **Install Library:**
    *   Add `dotenv` to `dependencies` or `devDependencies` in `apps/payload/package.json`.
    *   `cd apps/payload && pnpm add dotenv`
2.  **Load Environment Variables:**
    *   After argument parsing:
    ```typescript
    // import dotenv from 'dotenv';
    // const projectRoot = path.resolve(__dirname, '../../../../'); // Adjust based on compiled output structure
    // const envPath = path.resolve(projectRoot, argv.envPath as string);
    // if (fs.existsSync(envPath)) {
    //   dotenv.config({ path: envPath });
    //   // logger.info(`Loaded environment variables from: ${envPath}`);
    // } else {
    //   // logger.warn(`Environment file not found at: ${envPath}. Using system environment variables.`);
    // }
    ```
    *   Note: `__dirname` behavior differs between ES modules and CommonJS. If using ES modules, alternative path resolution might be needed (e.g., `import.meta.url`). This needs to be robust for the compiled JS output.

## 6. Structured Logging Setup

1.  **Install Library (Recommended: `pino`):**
    *   `cd apps/payload && pnpm add pino pino-pretty` (`pino-pretty` for dev).
2.  **Initialize Logger:**
    ```typescript
    // import pino from 'pino';
    // const logger = pino({
    //   level: process.env.LOG_LEVEL || 'info',
    //   transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
    // });
    // logger.info('Orchestrator script started.');
    ```
    *   Replace all `console.log/warn/error` with `logger.info/warn/error`.

## 7. Central Payload Client Initialization & Shutdown

1.  **Initialization (within main `try` block):**
    ```typescript
    // let payloadClient: Payload | null = null; // Declare at a higher scope
    // try {
    //   logger.info('Initializing Payload client...');
    //   const resolvedPayloadConfigPath = path.resolve(projectRoot, argv.payloadConfigPath as string);
    //   logger.info(`Using Payload config from: ${resolvedPayloadConfigPath}`);

    //   // Dynamically import the Payload config
    //   // Ensure the path is correct for the compiled JS structure
    //   const { default: payloadConfig } = await import(resolvedPayloadConfigPath);

    //   payloadClient = await getPayload({
    //     config: payloadConfig, // Pass the imported config object
    //     // Optionally pass logger to Payload if supported, or configure Payload logging separately
    //   });
    //   logger.info('Payload client initialized successfully.');
    //   // ... rest of the stages
    // } catch (error) { /* ... */ }
    // finally { /* ... */ }
    ```
2.  **Shutdown (within `finally` block):**
    ```typescript
    // finally {
    //   if (payloadClient) {
    //     logger.info('Attempting to shut down Payload client...');
    //     try {
    //       const db = payloadClient.db;
    //       if (db && typeof (db.drizzle as any)?.$client?.end === 'function') {
    //         await (db.drizzle as any).$client.end();
    //         logger.info('Database connection (Drizzle $client) closed successfully.');
    //       } else if (db && typeof (db.drizzle as any)?.end === 'function') { // Fallback for direct postgres.js
    //         await (db.drizzle as any).end({ timeout: 5000 });
    //         logger.info('Database connection (Drizzle instance) ended successfully.');
    //       } else {
    //         logger.warn('Could not determine how to close DB connection via Payload client.');
    //       }
    //     } catch (e) {
    //       logger.error({ err: e }, 'Error during Payload client shutdown.');
    //     }
    //   } else {
    //     logger.info('Payload client was not initialized, no shutdown needed.');
    //   }
    //   logger.info('Orchestrator script finished.');
    // }
    ```

## 8. Staged Execution Flow (Stubs)

1.  **Define Placeholder Stage Functions:**
    *   Create stub async functions for each stage. These will later import and call the actual stage modules.
    ```typescript
    // interface StageArgs {
    //   skipResetSchema?: boolean;
    //   skipApplyMigrations?: boolean;
    //   // ... other skip flags
    // }
    // interface IdMaps { /* define structure for ID maps */ }

    // async function runStage0_ResetSchema(payload: Payload, log: pino.Logger, cliArgs: StageArgs): Promise<void> {
    //   log.info('Executing Stage 0: Reset Schema (stub)...');
    //   if (cliArgs.skipResetSchema) { log.info('Skipped.'); return; }
    //   // Placeholder for actual logic
    // }
    // // ... similar stubs for runStage1, runStage2, runStage3, runStage4
    // // runStage2 should return Promise<IdMaps>
    // // runStage3 should accept IdMaps
    ```
2.  **Call Stubs Sequentially:**
    *   In the main `try` block, after `payloadClient` is initialized:
    ```typescript
    // const idMaps: IdMaps = {}; // Or a more specific initial type

    // await runStage0_ResetSchema(payloadClient, logger, argv);
    // await runStage1_ApplyMigrations(payloadClient, logger, argv);

    // const stage2Maps = await runStage2_SeedCore(payloadClient, logger, argv);
    // Object.assign(idMaps, stage2Maps); // Merge maps

    // await runStage3_PopulateRelationships(payloadClient, logger, argv, idMaps);
    // await runStage4_VerifyData(payloadClient, logger, argv, idMaps);
    ```

## 9. Error Handling & Exit Codes

1.  **Main `catch` Block:**
    ```typescript
    // catch (error) {
    //   logger.error({ err: error }, 'Fatal error in orchestrator script.');
    //   process.exit(1);
    // }
    ```
2.  **Successful Completion:**
    *   If all stages complete without throwing an error, add at the end of the `try` block:
    ```typescript
    // logger.info('All stages completed successfully.');
    // process.exit(0); // Explicit success exit, after finally block attempts DB closure.
    ```
    *   Note: `process.exit(0)` here is acceptable as it's the very end of the script, after the `finally` block for DB closure has run or attempted to run.

## 10. Initial `package.json` Scripts and `tsconfig`

1.  **`apps/payload/package.json`:**
    ```json
    {
      "scripts": {
        // "build:init-scripts": "tsc --project tsconfig.init-scripts.json", // Define this later
        // "preinit:data": "pnpm run build:init-scripts",
        // "init:data": "node dist/init-scripts/initialize-payload-data.js"
      }
    }
    ```
2.  **`apps/payload/tsconfig.init-scripts.json` (Example - to be created in Task 4.2):**
    *   This will configure `tsc` to compile the `init-scripts` directory.
    *   It should specify `outDir`, `rootDir`, `module` (e.g., `NodeNext` or `CommonJS`), `moduleResolution` (e.g., `NodeNext` or `Node`), and other necessary compiler options for Node.js execution.

## 11. Initial Testing

1.  **Run with Skips:** Execute the script (initially via `tsx` or `ts-node` for development, e.g., `pnpm tsx apps/payload/src/init-scripts/initialize-payload-data.ts --skip-reset-schema --skip-apply-migrations --skip-seed-core --skip-populate-relationships --skip-verification`).
2.  **Expected Behavior:**
    *   Script parses arguments.
    *   Environment variables are loaded (verify with logs).
    *   Logger is initialized and logs messages.
    *   Payload client initializes and attempts shutdown.
    *   Stubbed stage functions log their "Executing (stub)..." and "Skipped" messages correctly.
    *   Script exits with code 0.
3.  **Test Error Path:** Introduce a deliberate `throw new Error('Test error')` before Payload init to see if `process.exit(1)` is called.

## 12. Deliverables for Task 4.1

*   The `apps/payload/src/init-scripts/initialize-payload-data.ts` file with the described structure: argument parsing, env loading, logging, Payload client init/shutdown, and stubbed stage execution logic.
*   Updated `apps/payload/package.json` with dependencies for `yargs` (or `commander`), `dotenv`, and `pino`.
*   Initial (placeholder) `package.json` scripts for building and running the orchestrator.
*   Basic documentation (comments within the script) on its usage and arguments.

This plan provides a detailed roadmap for creating the foundational orchestrator script.
