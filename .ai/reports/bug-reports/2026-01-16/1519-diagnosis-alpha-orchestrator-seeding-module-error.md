# Bug Diagnosis: Alpha Orchestrator Seeding Fails with Module Not Found Error

**ID**: ISSUE-1519
**Created**: 2026-01-16T16:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Autonomous Coding workflow orchestrator fails during the database seeding phase with a module resolution error. The `@kit/shared/dist/logger/index.js` file cannot be found because the E2B sandbox template runs `pnpm install` but does not build workspace packages. The `@kit/shared` package exports from `./dist/` which only exists after running `pnpm build`.

## Environment

- **Application Version**: dev branch
- **Environment**: E2B Sandbox (slideheroes-claude-agent-dev template)
- **Node Version**: v20.20.0 (in sandbox)
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Unknown (new implementation)

## Reproduction Steps

1. Run the Alpha spec orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
2. Observe the error during sandbox database seeding phase

## Expected Behavior

The orchestrator should successfully run Payload migrations and seed the sandbox database before starting feature implementation.

## Actual Behavior

The orchestrator fails with the following error:

```
❌ Seeding failed: exit code 1, stderr:
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/home/user/project/apps/payload/node_modules/@kit/shared/dist/logger/index.js' imported from /home/user/project/apps/payload/src/lib/database-adapter-singleton.ts
```

## Diagnostic Data

### Console Output

```
➜  2025slideheroes git:(dev) ✗ tsx .ai/alpha/scripts/spec-orchestrator.ts 1362
❌ Seeding failed: exit code 1, stderr:
node:internal/process/promises:391
    triggerUncaughtException(err, true /* fromPromise */);
    ^
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/home/user/project/apps/payload/node_modules/@kit/shared/dist/logger/index.js' imported from /home/user/project/apps/payload/src/lib/database-adapter-singleton.ts
    at finalizeResolution (node:internal/modules/esm/resolve:283:11)
    ...
Node.js v20.20.0

❌ Database seeding failed, aborting orchestration
```

### Import Chain Analysis

1. `seedSandboxDatabase()` in `.ai/alpha/scripts/lib/database.ts` runs:
   ```bash
   pnpm run payload migrate --forceAcceptWarning
   ```

2. The `payload` script in `apps/payload/package.json` (line 22) is:
   ```json
   "payload": "cross-env PAYLOAD_CONFIG_PATH=src/payload.config.ts NODE_OPTIONS=--no-deprecation payload"
   ```

3. This loads `payload.config.ts` which imports (line 34):
   ```typescript
   import { getDatabaseAdapter } from "./lib/database-adapter-singleton";
   ```

4. `database-adapter-singleton.ts` imports (line 1):
   ```typescript
   import { createServiceLogger, type LogContext } from "@kit/shared/logger";
   ```

5. `@kit/shared` package.json exports (line 15):
   ```json
   "./logger": "./dist/logger/index.js"
   ```

6. The `dist/` directory only exists after building (`pnpm --filter @kit/shared build`)

### E2B Template Analysis

The E2B template (`packages/e2b/e2b-template/template.ts`) performs:
1. Clone repo: `git clone --depth 1 --branch dev ...`
2. Install dependencies: `pnpm install`
3. Install Playwright: `pnpm exec playwright install chromium`

**Missing step**: The template does NOT run `pnpm build` or `turbo build` to build workspace packages.

### Network Analysis

Not applicable - this is a local module resolution issue.

### Database Analysis

Not applicable - error occurs before database connection.

### Performance Metrics

Not applicable.

### Screenshots

Not applicable.

## Error Stack Traces

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/home/user/project/apps/payload/node_modules/@kit/shared/dist/logger/index.js' imported from /home/user/project/apps/payload/src/lib/database-adapter-singleton.ts
    at finalizeResolution (node:internal/modules/esm/resolve:283:11)
    at moduleResolve (node:internal/modules/esm/resolve:952:10)
    at defaultResolve (node:internal/modules/esm/resolve:1188:11)
    at nextResolve (node:internal/modules/esm/hooks:864:28)
    at resolveBase (file:///home/user/project/node_modules/.pnpm/tsx@4.20.3/node_modules/tsx/dist/esm/index.mjs?1768575707070:2:3811)
    at resolveDirectory (file:///home/user/project/node_modules/.pnpm/tsx@4.20.3/node_modules/tsx/dist/esm/index.mjs?1768575707070:2:4310)
    at resolveTsPaths (file:///home/user/project/node_modules/.pnpm/tsx@4.20.3/node_modules/tsx/dist/esm/index.mjs?1768575707070:2:5051)
    at async resolve (file:///home/user/project/node_modules/.pnpm/tsx@4.20.3/node_modules/tsx/dist/esm/index.mjs?1768575707070:2:5422)
    at async nextResolve (node:internal/modules/esm/hooks:864:22)
    at async Hooks.resolve (node:internal/modules/esm/hooks:306:24) {
  code: 'ERR_MODULE_NOT_FOUND',
  url: 'file:///home/user/project/apps/payload/node_modules/@kit/shared/dist/logger/index.js'
}
```

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/database.ts` (line 216-227 - migration command)
  - `apps/payload/package.json` (line 22 - payload script)
  - `apps/payload/src/payload.config.ts` (line 34 - imports database-adapter)
  - `apps/payload/src/lib/database-adapter-singleton.ts` (line 1 - imports @kit/shared/logger)
  - `packages/shared/package.json` (line 15 - exports ./dist/logger)
  - `packages/e2b/e2b-template/template.ts` (line 358-360 - missing build step)

- **Recent Changes**: The Alpha orchestrator was recently developed; this is a design gap in the E2B template setup.

- **Suspected Functions**:
  - `seedSandboxDatabase()` in `database.ts`
  - `createTemplate()` in `template.ts`

## Related Issues & Context

### Direct Predecessors

None identified - this appears to be a new issue with the Alpha orchestrator implementation.

### Related Infrastructure Issues

- The E2B template was designed for running Claude Code with pre-installed dependencies, but workspace package builds were not considered.

### Similar Symptoms

None identified.

### Same Component

- `.ai/alpha/` orchestrator system is newly developed

### Historical Context

This is the first deployment of the Alpha Autonomous Coding workflow with database seeding requirements.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The E2B sandbox template runs `pnpm install` but not `pnpm build`, leaving workspace packages like `@kit/shared` without their compiled `dist/` directories.

**Detailed Explanation**:

The `@kit/shared` package is a TypeScript library that compiles from `src/` to `dist/`. The package.json exports reference the compiled output:
```json
"exports": {
  "./logger": "./dist/logger/index.js"
}
```

When `pnpm install` runs in the E2B sandbox, it creates symlinks for workspace dependencies but does NOT compile TypeScript packages. The `dist/` directory is only generated by running the build script:
```bash
pnpm --filter @kit/shared build
# or
turbo build
```

The `payload.config.ts` file uses `database-adapter-singleton.ts` which imports `@kit/shared/logger`. When the migration command runs, Node.js tries to resolve the import path `@kit/shared/logger` → `./dist/logger/index.js`, but this file doesn't exist.

**Supporting Evidence**:
1. Error message explicitly states: `Cannot find module '.../@kit/shared/dist/logger/index.js'`
2. Package exports configuration: `"./logger": "./dist/logger/index.js"`
3. E2B template only runs `pnpm install`, not build commands
4. Turbo.json shows `@kit/shared#build` as a dependency for `payload#build`

### How This Causes the Observed Behavior

1. Orchestrator creates E2B sandbox
2. Sandbox has repo cloned with `pnpm install` completed
3. `seedSandboxDatabase()` calls `pnpm run payload migrate`
4. Payload script sets `PAYLOAD_CONFIG_PATH=src/payload.config.ts`
5. Payload loads the config, which imports `database-adapter-singleton.ts`
6. `database-adapter-singleton.ts` imports `@kit/shared/logger`
7. Node.js resolves `@kit/shared/logger` to `./dist/logger/index.js`
8. File doesn't exist → `ERR_MODULE_NOT_FOUND`
9. Migration fails → Seeding aborts → Orchestrator exits

### Confidence Level

**Confidence**: High

**Reasoning**: The import chain is clear and directly traceable. The error message explicitly shows the missing file path. The E2B template code confirms no build step is executed. This is not a transient or environmental issue but a fundamental design gap.

## Fix Approach (High-Level)

Two potential solutions:

**Option A (Recommended): Add build step to sandbox creation**
Add a build step to the sandbox creation in `.ai/alpha/scripts/lib/sandbox.ts` after `pnpm install`:
```typescript
// After pnpm install completes
await sandbox.commands.run(
  `cd ${WORKSPACE_DIR} && pnpm --filter @kit/shared build`,
  { timeoutMs: 120000 }
);
```

**Option B: Add build step to E2B template**
Modify `packages/e2b/e2b-template/template.ts` to include a build step after install:
```typescript
.runCmd(["pnpm install"])
.runCmd(["pnpm turbo build --filter=@kit/shared"]) // Add this line
```

Option A is faster to implement and test. Option B provides a more complete sandbox but increases template build time significantly.

## Diagnosis Determination

The root cause is confirmed: The E2B sandbox template and orchestrator sandbox setup do not build workspace packages after `pnpm install`. The `@kit/shared` package exports from `./dist/` which only exists after compilation. When Payload migrations run, they load the full config which requires `@kit/shared/logger`, causing the module resolution failure.

## Additional Context

- The `payload.seeding.config.ts` deliberately avoids importing `database-adapter-singleton.ts` and creates its own direct postgres adapter, but the migration command uses the main `payload.config.ts`
- The local development environment works because builds have been run during normal development
- This is a bootstrap/clean-environment issue that only manifests in fresh E2B sandboxes

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash*
