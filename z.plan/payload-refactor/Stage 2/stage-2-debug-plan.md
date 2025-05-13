# Stage 2 Hang Debugging: Findings and Next Steps (As of May 13, 2025)

## 1. Issue Overview

The `Initialize-PayloadData.ps1` script hangs when executing Stage 2 (`packages/payload-local-init/stage-2-seed-core/run-stage-2.ts` via `tsx`). The hang occurs after the PowerShell script logs "Running run-stage-2.ts..." but *before* the first `console.log` statement within the `runAllStage2Seeders` async function in `run-stage-2.ts`.

This indicates the hang happens during the loading/initialization phase of `run-stage-2.ts`, likely when it imports and processes its Payload configuration (`apps/payload/src/payload.config.ts`).

## 2. Key Findings from `payload.config.ts` Modifications:

*   **Mock DB Adapter Test:**
    *   When `apps/payload/src/payload.config.ts` was configured with a **mock DB adapter** and all major plugins (`postgresAdapter`, `lexicalEditor`, `s3Storage`, `nestedDocsPlugin`) were commented out (both imports and usage), the `Initialize-PayloadData.ps1` script **did not hang** at Stage 2. Instead, it proceeded to Stage 1 (`pnpm payload migrate`) and failed with `TypeError: adapter.migrate is not a function`, which is expected due to the mock DB.
*   **Individual Plugin Tests (with Mock DB):**
    *   Reintroducing `lexicalEditor` (with mock DB, other plugins commented) did not cause the hang.
    *   Reintroducing `s3Storage` (with mock DB, other plugins commented) did not cause the hang.
    *   Reintroducing `nestedDocsPlugin` (with mock DB, other plugins commented) did not cause the hang.
*   **Real `postgresAdapter` Test:**
    *   When the real `postgresAdapter` was **reintroduced** (and its usage in the `db` property restored), while `lexicalEditor`, `s3Storage`, and `nestedDocsPlugin` remained commented out, the script **hung again** at the Stage 2 loading point.
    *   Crucially, with this same configuration (real `postgresAdapter`, other plugins commented), Stage 1 (`pnpm payload migrate`) **completed successfully**. This shows that `payload migrate` can load and use this configuration, but `tsx ./run-stage-2.ts` cannot load it without hanging.

## 3. Current Hypothesis

The hang is strongly correlated with the initialization of the **real `postgresAdapter`** when `apps/payload/src/payload.config.ts` is imported by `run-stage-2.ts` (which is executed by `tsx`). The difference in behavior between `pnpm payload migrate` (works) and `tsx ./run-stage-2.ts` (hangs) with the same config suggests an issue specific to the `tsx` execution environment or how it handles the `postgresAdapter` initialization (e.g., connection pooling, asynchronous operations during module load).

## 4. Refined Debugging Plan

The focus is now on why the `postgresAdapter` causes `run-stage-2.ts` (via `tsx`) to hang.

### Step 4.1: Verify Environment Variables
*   **Action:** User to double-check that `DATABASE_URI` is correctly set in the `.env` file and is accessible/correct for the environment where `Initialize-PayloadData.ps1` (and thus `run-stage-2.ts`) is executed.
*   **Rationale:** An incorrect or inaccessible database URI could cause the adapter to hang indefinitely during connection attempts.

### Step 4.2: Simplify `postgresAdapter` Options
*   **Action:** In `apps/payload/src/payload.config.ts`:
    *   Ensure `postgresAdapter` import and usage are active.
    *   Temporarily comment out optional parameters within the `postgresAdapter` configuration: `push`, `schemaName`, `idType`.
        ```typescript
        // apps/payload/src/payload.config.ts
        import { postgresAdapter } from '@payloadcms/db-postgres';
        // ... other imports (lexical, s3, nestedDocs should be commented for this step)

        export default buildConfig({
          // ... other config ...
          db: postgresAdapter({
            pool: {
              connectionString: process.env.DATABASE_URI,
            }
            // push: false, // Temporarily comment out
            // schemaName: 'payload', // Temporarily comment out
            // idType: 'uuid', // Temporarily comment out
          }),
          // editor, plugins (s3, nestedDocs) should be commented out
          // ...
        });
        ```
*   **Test:** Run `Initialize-PayloadData.ps1`.
*   **Expected Result:** Determine if the hang persists. If it doesn't, one of these options might be involved. If it still hangs, the issue is more fundamental to the adapter's core initialization with the connection pool.

### Step 4.3: Add Granular Logging in `run-stage-2.ts`
*   **Action:** Modify `packages/payload-local-init/stage-2-seed-core/run-stage-2.ts` to add more detailed logging around the `getPayload` call.
    ```typescript
    // packages/payload-local-init/stage-2-seed-core/run-stage-2.ts
    import type { Payload } from 'payload'; // Ensure Payload type is imported
    import config from '../../../../apps/payload/src/payload.config.js';
    import { getPayload } from 'payload';

    async function runAllStage2Seeders(payload: Payload) {
      console.log('[RUN-STAGE-2] Entered runAllStage2Seeders function.');
      // ... existing seeder logic ...
      console.log('[RUN-STAGE-2] Exiting runAllStage2Seeders function.');
    }

    (async () => {
      console.log('[RUN-STAGE-2] Starting IIFE execution.');
      try {
        console.log('[RUN-STAGE-2] About to initialize Payload (call getPayload)...');
        const payload = await getPayload({ config });
        console.log('[RUN-STAGE-2] Payload initialized successfully.');
        await runAllStage2Seeders(payload);
        console.log('[RUN-STAGE-2] Stage 2 seeders completed successfully.');
        // ... existing JSON output logic ...
        // process.exit(0); // Ensure this is removed or conditional for proper error propagation
      } catch (error) {
        console.error('[RUN-STAGE-2] Error during Stage 2 seeding process:', error);
        process.exit(1);
      }
      console.log('[RUN-STAGE-2] IIFE execution finished.');
    })();
    ```
*   **Configuration for `payload.config.ts` for this test:**
    *   `postgresAdapter` import: **UNCOMMENTED**
    *   `db` property: **USING REAL `postgresAdapter`** (with options as determined by Step 4.2).
    *   All other major plugins (`lexicalEditor`, `s3Storage`, `nestedDocsPlugin`) and `editor` property: **COMMENTED OUT** (imports and usage).
*   **Test:** Run `Initialize-PayloadData.ps1`.
*   **Expected Result:** Observe which new `console.log` messages from `run-stage-2.ts` appear. This will pinpoint if the hang occurs before, during, or after `await getPayload({ config })`.

### Step 4.4: (If hang is within `getPayload`) Further Isolate `postgresAdapter` Initialization
*   If Step 4.3 shows the hang is *inside* `await getPayload({ config })`, the issue is almost certainly the `postgresAdapter`'s interaction with `getPayload` in the `tsx` environment.
*   **Possible actions then:**
    *   Investigate `postgresAdapter`'s own initialization logs (if any, or if they can be enabled).
    *   Consider if `tsx` has known issues with specific types of I/O or native modules used by `pg` (the underlying PostgreSQL client).
    *   Temporarily replace `postgresAdapter` with a *different, simpler* DB adapter for Payload (if one exists, e.g., SQLite, for testing purposes only) to see if the issue is specific to `postgresAdapter` or any DB adapter.

## Next Immediate Action

User to perform **Step 4.1 (Verify Environment Variables)** and then **Step 4.2 (Simplify `postgresAdapter` Options)**.
Report results.
