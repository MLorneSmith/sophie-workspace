# Steps Taken to Fix Payload Migration Command

This document outlines the issues encountered and the steps taken to successfully run the `pnpm --filter payload run payload migrate` command in the new Payload CMS application setup.

## Issues and Resolutions

1.  **Initial Error: `ERR_PACKAGE_PATH_NOT_EXPORTED: Package subpath './config' is not defined`**

    - **Problem:** The command failed because the import `import { buildConfig } from 'payload/config'` in `apps/payload/src/payload.config.ts` could not be resolved at runtime. This was likely due to a conflict between custom type declarations/path mappings and the actual package exports in `node_modules`.
    - **Resolution:**
      - Changed the import in `apps/payload/src/payload.config.ts` to `import { buildConfig } from 'payload'`.
      - Removed the custom type declaration for `payload/config` in `apps/payload/types/payload.d.ts`.
      - Removed the path mapping `"payload/config": ["./types/payload"]` from `apps/payload/tsconfig.json`.
      - Removed the path mapping `"payload": ["./types/payload"]` from `apps/payload/tsconfig.json` as the custom type file was removed.

2.  **Error: `ReferenceError: __dirname is not defined in ES module scope`**

    - **Problem:** The command failed because `__dirname` was used in `apps/payload/src/collections/Downloads.ts`, but it's not available in ES modules by default.
    - **Resolution:** Modified `apps/payload/src/collections/Downloads.ts` to define `dirname` using `fileURLToPath(import.meta.url)` and `path.dirname(filename)`, and replaced `__dirname` with `dirname`.

3.  **Persistent Error: `Error: Error: missing secret key. A secret key is needed to secure Payload.`**

    - **Problem:** The command failed repeatedly because the `PAYLOAD_SECRET` environment variable was not being loaded and made available to the Payload process, despite being in `.env` files and `turbo.json`. This indicated an issue with environment variable propagation in the specific Turborepo/pnpm/cross-env/PowerShell setup.
    - **Resolution:**
      - Added `dotenv-cli` as a development dependency to `apps/payload`.
      - Modified the `payload` script in `apps/payload/package.json` to use `dotenv -e ../../.env --` before the `cross-env` command. This explicitly loads the root `.env` file before executing the Payload binary.

4.  **TypeScript Errors after `generate:types`:**
    - **Problem:** Errors like `Object literal may only specify known properties, and 'downloads' does not exist...` and `Type '"documentation"' is not assignable to type 'CollectionSlug'.` appeared after running `generate:types`.
    - **Resolution:** Running `pnpm --filter payload run payload generate:types` and potentially restarting the VS Code TypeScript server resolved these errors, indicating they were likely due to the language server not picking up the newly generated types correctly.

## Verification

After implementing these fixes, the command `pnpm --filter payload run payload migrate` executed successfully, confirming that the basic Payload configuration is valid and environment variables are being loaded correctly.

## Next Steps

With the migration command working, the initial setup phase (Task 22 and initial collections) is considered complete. The next steps involve testing the running Payload application and its admin UI.
