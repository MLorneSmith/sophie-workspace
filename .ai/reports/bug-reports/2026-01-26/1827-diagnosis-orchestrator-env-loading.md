# Bug Diagnosis: Alpha orchestrator prompts for E2E_SUPABASE_SERVICE_ROLE_KEY despite existing in apps/e2e/.env.local

**ID**: ISSUE-1827
**Created**: 2026-01-26T19:45:00Z
**Reporter**: User (msmith)
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The Alpha spec orchestrator (`spec-orchestrator.ts`) prompts users to provide `E2E_SUPABASE_SERVICE_ROLE_KEY` during pre-flight checks, even though this variable already exists in `apps/e2e/.env.local`. The root cause is that the orchestrator's `loadEnvFile()` function only loads environment variables from the project root `.env` file, not from app-specific `.env.local` files like `apps/e2e/.env.local`.

## Environment

- **Application Version**: Latest (dev branch)
- **Environment**: Development
- **Node Version**: N/A (TypeScript script)
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Never worked for E2E-specific env vars

## Reproduction Steps

1. Run the spec orchestrator for S1815 or S1823: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1823`
2. The orchestrator performs pre-flight environment variable checks
3. Observe that it prompts for `E2E_SUPABASE_SERVICE_ROLE_KEY` as "Missing"
4. Check `apps/e2e/.env.local` - the variable is present

## Expected Behavior

The orchestrator should detect that `E2E_SUPABASE_SERVICE_ROLE_KEY` is available (either by loading it from `apps/e2e/.env.local` or by searching multiple `.env` files) and not prompt the user.

## Actual Behavior

The orchestrator only loads `.env` from the project root, misses app-specific env files, and prompts the user to provide environment variables that already exist in the codebase.

## Diagnostic Data

### Environment File Locations

```
Project root .env: /home/msmith/projects/2025slideheroes/.env
  - Does NOT contain E2E_SUPABASE_SERVICE_ROLE_KEY

apps/e2e/.env.local: /home/msmith/projects/2025slideheroes/apps/e2e/.env.local
  - CONTAINS E2E_SUPABASE_SERVICE_ROLE_KEY (line 8)
  - Also contains E2E_TEST_USER_EMAIL, E2E_TEST_USER_PASSWORD, etc.
```

### Spec Manifest Required Variables

From `spec-manifest.json`, feature S1823.I5.F4 (E2E Dashboard Tests) requires:
- `E2E_SUPABASE_SERVICE_ROLE_KEY`
- `E2E_TEST_USER_EMAIL`
- `E2E_TEST_USER_PASSWORD`

All three exist in `apps/e2e/.env.local` but none are loaded by the orchestrator.

### Code Analysis

**`loadEnvFile()` function** (spec-orchestrator.ts:38-76):
```typescript
function loadEnvFile(): void {
  let currentDir = import.meta.dirname;
  while (currentDir !== "/") {
    const gitPath = path.join(currentDir, ".git");
    if (fs.existsSync(gitPath)) {
      const envPath = path.join(currentDir, ".env");  // <-- ONLY loads root .env
      if (fs.existsSync(envPath)) {
        // ... loads variables
      }
      return;  // <-- Returns after finding root, never checks app directories
    }
    currentDir = path.dirname(currentDir);
  }
}
```

**`validateRequiredEnvVars()` function** (env-requirements.ts:240-252):
```typescript
export function validateRequiredEnvVars(required: RequiredEnvVar[]): MissingEnvVar[] {
  return required
    .filter((v) => v.required && !process.env[v.name])  // <-- Checks process.env
    .map((v) => ({ ... }));
}
```

Since `loadEnvFile()` only loads the root `.env`, any E2E-specific variables from `apps/e2e/.env.local` are not in `process.env`, causing them to appear as "missing".

## Error Stack Traces

No errors - this is a logic issue where the environment loading is incomplete.

## Related Code
- **Affected Files**:
  - `.ai/alpha/scripts/spec-orchestrator.ts` (lines 38-76: `loadEnvFile()` function)
  - `.ai/alpha/scripts/lib/env-requirements.ts` (lines 240-252: `validateRequiredEnvVars()`)
  - `.ai/alpha/scripts/lib/pre-flight.ts` (pre-flight check UI)
- **Recent Changes**: Feature was recently added to extract env requirements from tasks.json
- **Suspected Functions**: `loadEnvFile()` in spec-orchestrator.ts

## Related Issues & Context

### Direct Predecessors

No direct predecessors found - this appears to be a gap in the original design.

### Related Infrastructure Issues

N/A

### Similar Symptoms

N/A

### Historical Context

The environment loading mechanism was designed for simplicity, loading only the root `.env` file. The E2E environment requirements were added later through the `required_env_vars` in spec manifests and task decomposition, creating a mismatch between where variables are expected (research/tasks specify `apps/e2e/.env.local`) and where variables are loaded from (only root `.env`).

## Root Cause Analysis

### Identified Root Cause

**Summary**: The orchestrator's `loadEnvFile()` function only loads environment variables from the project root `.env` file, not from app-specific `.env.local` files like `apps/e2e/.env.local` where E2E test variables are stored.

**Detailed Explanation**:

1. The `loadEnvFile()` function in `spec-orchestrator.ts` (lines 38-76) is invoked at module load time
2. It traverses up the directory tree looking for a `.git` directory to find the project root
3. Once found, it only loads `.env` from that root directory
4. It returns immediately after loading the root `.env`, never checking other locations
5. The E2E-specific environment variables (`E2E_SUPABASE_SERVICE_ROLE_KEY`, `E2E_TEST_USER_EMAIL`, etc.) are stored in `apps/e2e/.env.local`
6. When `validateRequiredEnvVars()` runs during pre-flight checks, it finds these variables missing from `process.env`

**Supporting Evidence**:
- `apps/e2e/.env.local:8` contains `E2E_SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."`
- Project root `.env` does not contain this variable
- `spec-orchestrator.ts:46-47` only loads from `path.join(currentDir, ".env")`
- Spec manifest lists `E2E_SUPABASE_SERVICE_ROLE_KEY` source as `.env.test in apps/e2e`

### How This Causes the Observed Behavior

1. Orchestrator starts and calls `loadEnvFile()`
2. Only root `.env` is loaded into `process.env`
3. Manifest generation or loading populates `required_env_vars` from tasks.json files
4. Pre-flight check calls `validateRequiredEnvVars()`
5. Variables like `E2E_SUPABASE_SERVICE_ROLE_KEY` are not in `process.env`
6. User is prompted to provide values that already exist in `apps/e2e/.env.local`

### Confidence Level

**Confidence**: High

**Reasoning**: Direct code path analysis confirms:
1. `loadEnvFile()` only loads root `.env`
2. E2E variables exist in `apps/e2e/.env.local`
3. These locations never overlap
4. The spec manifest correctly identifies the source as `apps/e2e`

## Fix Approach (High-Level)

Three potential approaches:

1. **Extend `loadEnvFile()` to load additional env files**: Modify the function to also load `apps/e2e/.env.local`, `apps/web/.env.local`, etc. This follows the monorepo pattern where each app has its own env file.

2. **Load env files based on manifest requirements**: When a required env var specifies its source (e.g., `.env.test in apps/e2e`), dynamically load that file during pre-flight checks.

3. **Consolidate E2E env vars to root `.env`**: Add the E2E variables to the root `.env` file that the orchestrator already loads. Simplest but creates duplication.

Recommended: Option 1 - Extend `loadEnvFile()` to load both root `.env` and `apps/e2e/.env.local` (and potentially `apps/web/.env.local`) in sequence, with later values taking precedence.

## Diagnosis Determination

The root cause is a design gap in the environment loading mechanism. The orchestrator was designed to load only the root `.env` file, but the Alpha workflow's task decomposition now extracts environment requirements from feature tasks that reference app-specific env files. This mismatch causes valid environment variables to appear as "missing" during pre-flight checks.

The fix requires extending the `loadEnvFile()` function to search and load environment variables from multiple locations, matching the locations specified in the spec manifest's `required_env_vars[].source` field.

## Additional Context

The spec manifest explicitly states the correct source location:
```json
{
  "name": "E2E_SUPABASE_SERVICE_ROLE_KEY",
  "description": "Supabase service role key for test data seeding",
  "source": ".env.test in apps/e2e or local Supabase",
  ...
}
```

This information could be used to dynamically determine which env files to load.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash*
