# Implementation Plan: Task 4.2 - Implement Build Process for Initialization Scripts

**Version:** 1.0
**Date:** May 13, 2025
**Parent Task (Master Plan):** 4.2. Implement Build Process for Initialization Scripts
**Related Design Document:** `z.plan/payload-new-refactor/design/payload-refactor-design-requirements-v2.md`
**Depends On:** Successful initial creation of `apps/payload/src/init-scripts/initialize-payload-data.ts` (Task 4.1).

## 1. Introduction

**Objective:** To configure and implement a TypeScript compilation (build) process for all scripts within the `apps/payload/src/init-scripts/` directory. This will produce executable JavaScript files in `apps/payload/dist/init-scripts/`, allowing them to be run directly with `node`, thus bypassing potential issues with on-the-fly transpilers like `tsx`.

## 2. Prerequisites

*   The main orchestrator script `apps/payload/src/init-scripts/initialize-payload-data.ts` exists (even if stage modules are just stubs).
*   `typescript` is installed as a development dependency in the workspace (or specifically in `apps/payload`).
*   `pnpm` is used as the package manager.

## 3. Task Breakdown

### 3.1. Create `tsconfig.init-scripts.json`

1.  **File Creation:**
    *   Create a new file named `tsconfig.init-scripts.json` in the `apps/payload/` directory.
2.  **Configuration Content:**
    ```json
    {
      "extends": "../../../tsconfig.json", // Extend from monorepo root tsconfig for base settings
      "compilerOptions": {
        "outDir": "./dist", // Output directory relative to this tsconfig.json (apps/payload/dist)
        "rootDir": "./src",  // Root directory of sources relative to this tsconfig.json (apps/payload/src)
        
        // Module settings for Node.js compatibility
        "module": "NodeNext", // For modern ES module output
        "moduleResolution": "NodeNext",
        "target": "ES2022", // Target modern Node.js LTS versions

        // Essential for running compiled JS
        "sourceMap": true,       // Generate source maps for debugging
        "declaration": false,    // No .d.ts files needed for these executable scripts
        "declarationMap": false,
        "esModuleInterop": true,
        "allowSyntheticDefaultImports": true,
        "resolveJsonModule": true, // If any .json files are directly imported as modules
        "isolatedModules": true, // Good practice, though may not be strictly necessary here

        // Strictness & Code Quality (inherit or set)
        "strict": true,
        "forceConsistentCasingInFileNames": true,
        "skipLibCheck": true,    // Can speed up compilation by not checking lib files

        // Ensure 'baseUrl' and 'paths' are either inherited correctly or set
        // if init-scripts use path aliases. Prefer relative paths within init-scripts.
        "baseUrl": "./src", // Relative to this tsconfig.json
        "paths": {
          // Example: if init-scripts need to reference main app aliases
          // "@/*": ["app/*"], // This would be relative to baseUrl (apps/payload/src/app/*)
          // However, it's generally safer for init-scripts to use relative paths
          // or have their own minimal set of aliases if absolutely needed.
          // For now, assume init-scripts will use relative paths to access payload.config.ts etc.
        }
      },
      "include": [
        "./src/init-scripts/**/*.ts" // Only compile files within the init-scripts directory
      ],
      "exclude": [
        "node_modules",
        "./dist" // Exclude the output directory itself
      ]
    }
    ```
    *   **Note on `module` and `target`:** `NodeNext` and `ES2022` are recommended for modern Node.js. If compatibility issues arise with Payload's dynamic config import or other dependencies, `module: "CommonJS"` and a suitable `target` (like `ES2020`) could be an alternative, but this would change how `import`/`export` and `import.meta.url` behave.
    *   **Note on `rootDir` and `outDir`:** The `outDir` will effectively become `apps/payload/dist/` and the compiled scripts will maintain their subdirectory structure from `src/`, so `initialize-payload-data.ts` would be at `apps/payload/dist/init-scripts/initialize-payload-data.js`.

### 3.2. Update `apps/payload/package.json` Scripts

1.  **Add Build Script:**
    ```json
    "scripts": {
      // ... other scripts ...
      "build:init-scripts": "tsc --project tsconfig.init-scripts.json",
    }
    ```
2.  **Add Main Execution Script (`init:data`):**
    ```json
    "scripts": {
      // ... other scripts ...
      "build:init-scripts": "tsc --project tsconfig.init-scripts.json",
      "init:data": "node ./dist/init-scripts/initialize-payload-data.js"
    }
    ```
    *   This script will run the compiled JavaScript output.
    *   Command-line arguments can be passed to it as usual (e.g., `pnpm --filter payload run init:data -- --skip-reset-schema`). Note the `--` to separate pnpm args from script args.
3.  **Add `preinit:data` Script (Recommended):**
    ```json
    "scripts": {
      // ... other scripts ...
      "build:init-scripts": "tsc --project tsconfig.init-scripts.json",
      "preinit:data": "pnpm run build:init-scripts",
      "init:data": "node ./dist/init-scripts/initialize-payload-data.js"
    }
    ```
    *   This ensures that `build:init-scripts` is automatically run before `init:data`.
4.  **Add `clean:init-scripts` Script (Optional but useful):**
    *   Install `rimraf`: `pnpm add -D rimraf` (workspace root or `apps/payload`).
    ```json
    "scripts": {
      // ... other scripts ...
      "clean:init-scripts": "rimraf ./dist/init-scripts",
      "build:init-scripts": "pnpm run clean:init-scripts && tsc --project tsconfig.init-scripts.json",
      // ...
    }
    ```
    *   Modify `build:init-scripts` to clean first.

### 3.3. Adjust Path Resolutions in `initialize-payload-data.ts`

The compiled JavaScript will run from `apps/payload/dist/init-scripts/`. Paths, especially for dynamic imports or `dotenv`, need to be resolved correctly from this new execution context.

1.  **Project Root Calculation:**
    *   If using `module: "NodeNext"` (ES Modules):
        ```typescript
        import { fileURLToPath } from 'url';
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        // Assuming initialize-payload-data.js is at dist/init-scripts/initialize-payload-data.js
        const projectRoot = path.resolve(__dirname, '../../../'); // Adjust if script is nested deeper
        ```
    *   If using `module: "CommonJS"`: `__dirname` will point to `apps/payload/dist/init-scripts/`.
        `const projectRoot = path.resolve(__dirname, '../../');`
2.  **Path for `dotenv.config()`:**
    *   `const envPath = path.resolve(projectRoot, (argv.envPath as string) || '.env');`
3.  **Path for Dynamic Payload Config Import:**
    *   The `payload.config.ts` is in `apps/payload/src/`. The compiled `initialize-payload-data.js` is in `apps/payload/dist/init-scripts/`.
    *   If `payload.config.ts` is also compiled by the main app's build process (e.g., to `apps/payload/dist/payload.config.js`), the import path should target that compiled version.
    *   If importing the `.ts` file directly and relying on Node's loader for `.ts` (less ideal for production/CI runs), the path needs to be relative from `dist` to `src`.
    *   **Recommended:** Ensure `payload.config.ts` is compiled to JS by Payload's default build or your app's build, and import the JS version.
        ```typescript
        // Example assuming payload.config.js exists at apps/payload/dist/payload.config.js
        const resolvedPayloadConfigPath = path.resolve(projectRoot, 'apps/payload/dist/payload.config.js'); // Adjust as per actual compiled config location
        const { default: payloadConfig } = await import(resolvedPayloadConfigPath);
        ```
        If `payload.config.ts` itself is not part of a separate compilation step that `init-scripts` can rely on, you might need to adjust `tsconfig.init-scripts.json` to also compile it or use a path relative to the source structure if Node.js is run with a TS loader (which we are trying to avoid for the main execution).
        **Simplest for now:** Assume `payload.config.ts` can be resolved from `apps/payload/src/` by Node.js if using a loader, or adjust path to its compiled `.js` version. For `node` execution of compiled JS, you *must* import a `.js` file. This implies `payload.config.ts` should also be compiled.
        **Revised approach for config import:**
        The `payload.config.ts` is typically compiled by Next.js or Payload's build process. The `init-scripts` should import the *source* `.ts` file, and the `tsconfig.init-scripts.json` should be configured to output it correctly, or the main `apps/payload/tsconfig.json` should handle its compilation to a location `init-scripts` can import.
        Let's assume for now `tsconfig.init-scripts.json` will also process `payload.config.ts` if it's imported.
        The `import config from '../../../../apps/payload/src/payload.config.js';` in `run-stage-2.ts` (from previous logs) suggests it was trying to import a JS file.
        The `initialize-payload-data.ts` should import `payload.config.ts` using a relative path from its location in `src` to `apps/payload/src/payload.config.ts`. `tsc` will then compile both and adjust paths.
        ```typescript
        // In apps/payload/src/init-scripts/initialize-payload-data.ts
        import payloadConfig from '../payload.config'; // tsc will resolve this from src to src
        ```
        Then `tsconfig.init-scripts.json` needs to include `../payload.config.ts` or ensure `rootDir` allows it.
        A safer `rootDir` might be `apps/payload/src` and `include` be `["./init-scripts/**/*.ts", "./payload.config.ts"]`. `outDir` would then be `apps/payload/dist`, and compiled files would be `dist/init-scripts/...` and `dist/payload.config.js`.

### 3.4. Testing the Build and Execution

1.  **Run Build:**
    *   `pnpm --filter payload run build:init-scripts`
    *   **Expected:** No TypeScript errors. The `apps/payload/dist/init-scripts/` directory should be created, containing `initialize-payload-data.js` and any other `.js` files compiled from `src/init-scripts/`. Source maps (`.js.map`) should also be present.
2.  **Inspect Output:**
    *   Briefly check the contents of `apps/payload/dist/init-scripts/initialize-payload-data.js` to see how imports (especially for `payload.config`) and paths were handled.
3.  **Run Compiled Script (with skips):**
    *   `pnpm --filter payload run init:data -- --skip-reset-schema --skip-apply-migrations --skip-seed-core --skip-populate-relationships --skip-verification`
    *   **Expected:**
        *   The script executes using `node`.
        *   Initial log messages from the orchestrator appear.
        *   Payload client initialization is attempted.
        *   Payload client shutdown is attempted in the `finally` block.
        *   Script exits cleanly (exit code 0).
        *   No hangs occur.
4.  **Troubleshooting:**
    *   **Module Not Found Errors:** Adjust `module`, `moduleResolution` in `tsconfig.init-scripts.json`. Verify relative paths in compiled JS. If `payload.config.ts` is not found, ensure `tsconfig.init-scripts.json`'s `include` and `rootDir` correctly process it alongside `init-scripts`.
    *   **Path Issues for `.env` or Config:** Double-check `projectRoot` calculation and how `path.resolve` is used with `argv.envPath` and the config path. Add logging for resolved paths.

## 4. Deliverables for Task 4.2

*   A correctly configured `apps/payload/tsconfig.init-scripts.json` file.
*   Updated `apps/payload/package.json` with functional `build:init-scripts` and `init:data` scripts (and related `pre*` or `clean*` scripts).
*   Confirmation that `pnpm --filter payload run init:data` successfully executes the *compiled* orchestrator script using `node`, with the script performing its basic setup, Payload client init/shutdown, and exiting cleanly (when all stages are skipped).
*   Any necessary adjustments to path resolution logic within `initialize-payload-data.ts` to ensure it works correctly when compiled and run from the `dist` directory.

This task ensures that the core execution mechanism for the new initialization system is stable and free from `tsx`-related runtime issues.
