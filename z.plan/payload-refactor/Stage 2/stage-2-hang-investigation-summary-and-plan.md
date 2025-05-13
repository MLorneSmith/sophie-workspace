# Stage 2 Hang Investigation: Summary and Revised Plan (As of May 13, 2025 - 10:30 AM)

## 1. Issue Overview

The `Initialize-PayloadData.ps1` script consistently hangs when executing Stage 2 (`packages/payload-local-init/stage-2-seed-core/run-stage-2.ts` via `tsx`). The hang occurs *after* the PowerShell script initiates the `pnpm run stage2:seed-all` command but *before* any `console.log` statements within the main execution block of `run-stage-2.ts` are reached. This indicates the hang happens during the module loading and initial processing phase of `run-stage-2.ts`, likely when it imports and processes its Payload configuration (`apps/payload/src/payload.config.ts`).

## 2. Key Findings & Analysis

1.  **`payload migrate` (Stage 1) Success:**
    *   With `apps/payload/src/payload.config.ts` configured with the active `postgresAdapter` (and `schemaName: 'payload'` uncommented, other plugins/optional adapter params commented), Stage 1 (`pnpm payload migrate`) **completes successfully**. This demonstrates that Payload's CLI can load and utilize this configuration with the real database adapter.

2.  **`run-stage-2.ts` (Stage 2) Hang:**
    *   With the *exact same* `payload.config.ts` that Stage 1 uses successfully, `run-stage-2.ts` (executed by `tsx`) **does hang**.
    *   Logging within `payload.config.ts` shows that the script reaches the point of initializing the `postgresAdapter` within the `buildConfig` call:
        *   `[PAYLOAD-CONFIG] Starting payload.config.ts loading.`
        *   `[PAYLOAD-CONFIG] About to call buildConfig.`
        *   `[PAYLOAD-CONFIG] About to initialize postgresAdapter.`
    *   Logging within `run-stage-2.ts` (e.g., `[RUN-STAGE-2] Starting IIFE execution.`) is *not* reached, indicating the hang occurs before the main logic of `run-stage-2.ts` begins.

3.  **Isolated `postgresAdapter` Test Success:**
    *   A minimal test script (`packages/payload-local-init/scripts/test-postgres-adapter.ts`), which *only* imports and initializes `postgresAdapter` (with `schemaName: 'payload'`), runs successfully via `pnpm exec tsx ./scripts/test-postgres-adapter.ts` without hanging. This shows that `tsx` can execute a script that initializes the adapter in isolation.

## 3. Conclusions

*   The hang is specific to the execution of `run-stage-2.ts` via `tsx` when it loads the full `payload.config.ts` containing the active `postgresAdapter`.
*   The `postgresAdapter` itself is not inherently problematic for `tsx` when initialized in isolation.
*   The issue likely stems from an interaction between the `postgresAdapter` initialization and other elements or the overall structure of the `buildConfig` object within `payload.config.ts`, specifically when processed by `tsx` during the module loading phase of `run-stage-2.ts`.
*   The previous debugging approach of uncommenting sections while the script was already hanging was flawed. A more logical approach is to first achieve a non-hanging baseline for `run-stage-2.ts` and then incrementally reintroduce parts of the configuration.

## 4. Revised Debugging Plan

The primary goal is to get `run-stage-2.ts` to a state where it *starts executing its internal logs* when called by `Initialize-PayloadData.ps1`, even if subsequent Payload operations fail. This will establish a non-hanging baseline.

### Step 4.A: Achieve a Non-Hanging Baseline for `run-stage-2.ts`

1.  **Action:** Modify `apps/payload/src/payload.config.ts` to aggressively simplify it by commenting out the `db: postgresAdapter(...)` definition entirely.
    *   The `collections` array and other basic config properties (secret, serverURL, typescript, globals, bin) should remain active.
    *   All plugins (`lexicalEditor`, `s3Storage`, `nestedDocsPlugin`) and the `editor` property should remain commented out.
    ```typescript
    // Example snippet for apps/payload/src/payload.config.ts
    // ...
    export default buildConfig({
      secret: process.env.PAYLOAD_SECRET,
      serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
      collections: [ Users, Media, /* ...all collections... */ ],
      // db: (() => { // ENTIRE DB SECTION COMMENTED OUT
      //   console.log('[PAYLOAD-CONFIG] About to initialize postgresAdapter.');
      //   return postgresAdapter({ /* ... */ });
      // })(),
      // ... other minimal config ...
    });
    ```
2.  **Test:** Run `Initialize-PayloadData.ps1`.
3.  **Expected Outcome & Observation:**
    *   Stage 1 (`payload migrate`) will likely fail (this is acceptable for this test, as no DB adapter is configured).
    *   **Crucially, observe if Stage 2 (`run-stage-2.ts`) now starts and prints its initial internal logs** (e.g., `[RUN-STAGE-2] Starting IIFE execution.`, `[RUN-STAGE-2] About to initialize Payload (call getPayload)...`). The `getPayload` call itself will fail due to the missing DB adapter, but the script should not hang before these logs.

### Step 4.B: Reintroduce `postgresAdapter` (If Step 4.A is successful)

1.  **Action:** If `run-stage-2.ts` no longer hangs at startup in Step 4.A (i.e., it starts logging):
    *   In `apps/payload/src/payload.config.ts`, uncomment the `db: postgresAdapter(...)` section.
    *   Ensure the `postgresAdapter` configuration is minimal:
        ```typescript
        db: (() => {
          console.log('[PAYLOAD-CONFIG] About to initialize postgresAdapter.');
          return postgresAdapter({
            pool: {
              connectionString: process.env.DATABASE_URI,
            },
            schemaName: 'payload', // Keep this as it was needed for migrate
            // push: false, // Keep commented
            // idType: 'uuid', // Keep commented
          });
        })(),
        ```
2.  **Test:** Run `Initialize-PayloadData.ps1` again.
3.  **Expected Outcome & Observation:**
    *   Observe if the hang at Stage 2 (during the loading of `run-stage-2.ts`) reappears.
    *   If it hangs now, it strongly confirms the `postgresAdapter` initialization *within the `buildConfig` context* is the trigger when `run-stage-2.ts` is executed by `tsx`.

### Step 4.C: Further Isolation (If hang reappears in Step 4.B)

If the hang returns in Step 4.B, the next steps would involve investigating deeper into the `postgresAdapter`'s behavior within `tsx` or potential conflicts with other minimal parts of the `buildConfig` (though most are already very simple like `secret`, `serverURL`, `typescript`). This might involve:
*   Looking for ways to get more verbose logging from the `postgresAdapter` itself during its initialization.
*   Researching known issues with `tsx` and native Node.js modules used by `pg` (the underlying PostgreSQL client).
*   Trying alternative ways to structure the `payload.config.ts` if `tsx` has specific sensitivities to how modules are initialized or exported.

This revised plan aims to first establish a working (non-hanging) baseline for `run-stage-2.ts` execution and then pinpoint the exact configuration that reintroduces the hang.
