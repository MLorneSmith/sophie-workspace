# Bug Diagnosis: Alpha orchestrator prompts for E2E env vars that exist in apps/e2e/.env.local

**ID**: ISSUE-1831
**Created**: 2026-01-26T22:30:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The Alpha spec orchestrator prompts the user for `E2E_SUPABASE_SERVICE_ROLE_KEY`, `E2E_TEST_USER_EMAIL`, and `E2E_TEST_USER_PASSWORD` even though these variables are correctly defined in `apps/e2e/.env.local`. This occurs because the `loadEnvFile()` function in `spec-orchestrator.ts` only loads environment variables from the root `.env` file, ignoring app-specific `.env.local` files in the monorepo structure.

## Environment

- **Application Version**: dev branch (commit 70a6c5bfd)
- **Environment**: development
- **Browser**: N/A (CLI tool)
- **Node Version**: 20.x
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Never worked (fix from Issue #1828 was planned but not implemented)

## Reproduction Steps

1. Navigate to project root
2. Run: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1823 --dry-run`
3. Observe the pre-flight check output showing `E2E_SUPABASE_SERVICE_ROLE_KEY`, `E2E_TEST_USER_EMAIL`, and `E2E_TEST_USER_PASSWORD` as "Missing"
4. Verify these variables exist in `apps/e2e/.env.local`

## Expected Behavior

The orchestrator should load environment variables from both:
1. Root `.env` file (for global/shared variables)
2. `apps/e2e/.env.local` (for E2E-specific variables)

The pre-flight check should find all E2E variables and report "All required environment variable(s) are set".

## Actual Behavior

The orchestrator only loads from root `.env` and reports E2E variables as "Missing", prompting the user to enter them interactively or add them to `.env`.

## Diagnostic Data

### Environment Variable Locations

**Root `.env`** - Contains (relevant excerpt):
```
SUPABASE_URL=http://localhost:54521
SUPABASE_SERVICE_KEY=...
E2B_API_KEY=...
CALCOM_API_KEY=...
NEXT_PUBLIC_CALCOM_COACH_USERNAME=...
NEXT_PUBLIC_CALCOM_EVENT_SLUG=...
```
Note: Does NOT contain `E2E_SUPABASE_SERVICE_ROLE_KEY`, `E2E_TEST_USER_EMAIL`, or `E2E_TEST_USER_PASSWORD`

**apps/e2e/.env.local** - Contains (relevant excerpt):
```
E2E_SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
E2E_TEST_USER_EMAIL="test1@slideheroes.com"
E2E_TEST_USER_PASSWORD="aiesec1992"
```

### Code Analysis

The `loadEnvFile()` function in `.ai/alpha/scripts/spec-orchestrator.ts:38-76`:

```typescript
function loadEnvFile(): void {
  let currentDir = import.meta.dirname;
  while (currentDir !== "/") {
    const gitPath = path.join(currentDir, ".git");
    if (fs.existsSync(gitPath)) {
      const envPath = path.join(currentDir, ".env");
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        // ... parse and set process.env ...
      }
      return;  // <-- EXITS IMMEDIATELY after loading root .env
    }
    currentDir = path.dirname(currentDir);
  }
}
```

The function:
1. Finds project root by locating `.git` directory
2. Loads only the root `.env` file
3. Returns immediately without checking other locations

### Manifest Requirements

The `spec-manifest.json` for S1823 lists these as required:
- `E2E_SUPABASE_SERVICE_ROLE_KEY` - source: ".env.test in apps/e2e or local Supabase"
- `E2E_TEST_USER_EMAIL` - source: ".env.test in apps/e2e"
- `E2E_TEST_USER_PASSWORD` - source: ".env.test in apps/e2e"

All three are used by feature `S1823.I5.F4` (E2E Dashboard Tests).

## Error Stack Traces

N/A - This is a logic bug, not a runtime error.

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/spec-orchestrator.ts` (lines 38-76: `loadEnvFile()` function)
- **Recent Changes**: None (fix was planned in #1828 but not implemented)
- **Suspected Functions**: `loadEnvFile()` at spec-orchestrator.ts:38

## Related Issues & Context

### Direct Predecessors

- #1827 (OPEN): "Bug Diagnosis: Orchestrator env loading" - Original diagnosis of this issue
- #1828 (OPEN): "Bug Fix: Alpha orchestrator should load environment variables from app-specific .env files" - Planned fix, NOT YET IMPLEMENTED

### Historical Context

Issue #1828 contains a detailed bug fix plan that was created but the fix was never committed to the codebase. The diagnosis was accurate and the fix plan is ready to be implemented.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `loadEnvFile()` function in `spec-orchestrator.ts` only loads from the root `.env` file and immediately returns, without loading app-specific `.env.local` files.

**Detailed Explanation**:
The function traverses up the directory tree looking for `.git` to identify the project root, then loads only `${projectRoot}/.env`. It never checks for or loads `apps/e2e/.env.local` or other monorepo-specific environment files.

The E2E variables (`E2E_SUPABASE_SERVICE_ROLE_KEY`, `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`) are intentionally stored in `apps/e2e/.env.local` following the monorepo pattern where each app manages its own environment. The orchestrator doesn't respect this pattern.

**Supporting Evidence**:
- Code reference: `spec-orchestrator.ts:72` - `return;` exits immediately after loading root `.env`
- The variables exist in `apps/e2e/.env.local` (verified by file read)
- The `validateRequiredEnvVars()` in `env-requirements.ts:244` checks `process.env[v.name]` which is never set for E2E vars
- Bug fix plan in #1828 correctly identifies this as the root cause

### How This Causes the Observed Behavior

1. `loadEnvFile()` is called at orchestrator startup (line 78)
2. It loads only root `.env` variables into `process.env`
3. E2E variables in `apps/e2e/.env.local` are never loaded
4. When `validateRequiredEnvVars()` runs, `process.env.E2E_SUPABASE_SERVICE_ROLE_KEY` is `undefined`
5. Pre-flight check reports these as "Missing"
6. User is prompted to enter values or abort

### Confidence Level

**Confidence**: High

**Reasoning**:
- The code path is clear and deterministic
- The bug fix plan in #1828 was created specifically for this issue
- File contents confirm the variables exist in the expected location
- No code changes have been made to `loadEnvFile()` since the diagnosis

## Fix Approach (High-Level)

Extend `loadEnvFile()` to load multiple `.env` file locations in sequence:
1. Root `.env` (existing, unchanged)
2. `apps/e2e/.env.local` (new)
3. Optionally `apps/web/.env.local` (for future compatibility)

Later files should override earlier ones. Use graceful `fs.existsSync()` checks to skip missing files.

The complete implementation plan is already documented in #1828.

## Diagnosis Determination

**Root cause confirmed**: The `loadEnvFile()` function in `spec-orchestrator.ts` does not load environment variables from `apps/e2e/.env.local`, causing the pre-flight check to report E2E variables as missing.

**Fix is ready**: Issue #1828 contains a complete bug fix plan that just needs to be implemented.

## Additional Context

This is a **blocking issue** for running the Alpha orchestrator with specs that require E2E tests (like S1823 which has feature `S1823.I5.F4` - E2E Dashboard Tests).

The workaround is to either:
1. Enter the values interactively when prompted
2. Copy E2E variables to root `.env` (not recommended - breaks monorepo pattern)
3. Use `--skip-pre-flight` flag (not recommended - features may fail)

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash (git log)*
