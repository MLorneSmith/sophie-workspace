# Chore: Add --force flag to bypass production safety check in seed engine

## Chore Description

The seed engine has a safety check that prevents seeding when `NODE_ENV=production`. While this is a sensible default to prevent accidental production data corruption, it blocks legitimate remote database seeding operations via the `/supabase-seed-remote` slash command.

**The Problem:**
1. The `seed:run:remote` script uses `--env=production` to load `.env.production`
2. The `.env.production` file contains `NODE_ENV=production`
3. The `dotenv` library loads this with `override: true`, replacing any shell environment variables
4. The `validateEnvironmentSafety()` function checks `NODE_ENV` and blocks seeding
5. Result: Cannot seed the remote database, even intentionally

**The Solution:**
Add a `--force` or `--allow-production` flag that explicitly bypasses the NODE_ENV safety check when the operator intentionally wants to seed a production database. This maintains the safety-by-default behavior while allowing legitimate operations.

## Relevant Files

Use these files to resolve the chore:

- `apps/payload/src/seed/seed-engine/index.ts` - Main CLI entry point containing:
  - `getEnvNameFromArgs()` (lines 38-49) - Parses `--env` flag before Commander
  - `parseArguments()` (lines 78-147) - Commander CLI argument parsing
  - `validateEnvironmentSafety()` (lines 166-188) - Safety check that blocks production
  - Needs modification to add `--force` flag and bypass safety check when specified

- `apps/payload/src/seed/seed-engine/config.ts` - Configuration constants
  - `ENV_VARS` constant (lines 319-331) - May need to add `FORCE_SEED` env var as alternative

- `apps/payload/package.json` - NPM scripts
  - `seed:run:remote` script - May need update to include `--force` flag

- `.claude/commands/supabase-seed-remote.md` - Slash command documentation
  - Needs update to use `--force` flag in seeding commands

### New Files

None required - all changes are modifications to existing files.

## Impact Analysis

### Dependencies Affected
- **Seed engine CLI** - New flag added to argument parsing
- **Slash command** - `/supabase-seed-remote` will use the new flag
- **Package scripts** - `seed:run:remote` script may be updated

No external package dependencies are affected.

### Risk Assessment
**Low Risk**:
- Isolated change to seed engine only
- No database schema changes
- No breaking changes to existing functionality
- Default behavior remains unchanged (production blocked without `--force`)
- Only affects intentional use of the `--force` flag

### Backward Compatibility
- **Fully backward compatible** - The `--force` flag is additive
- Existing commands without `--force` continue to work exactly as before
- Scripts that don't use `--force` will still be blocked from production seeding
- No migration required

## Pre-Chore Checklist

Before starting implementation:
- [x] Create feature branch: `chore/seed-safety-bypass`
- [x] Review seed engine code structure
- [x] Identify all consumers of `validateEnvironmentSafety()` function
- [x] Verify test coverage exists for safety check

## Documentation Updates Required

- **CLAUDE.md** - No changes needed (internal tooling)
- **Code comments** - Update JSDoc for `--force` flag in `parseArguments()`
- **Slash command** - Update `.claude/commands/supabase-seed-remote.md` to use `--force`
- **Help text** - Update Commander help text with `--force` flag documentation

## Rollback Plan

**Rollback procedure:**
1. Revert the commit adding `--force` flag
2. Run `pnpm install` to ensure no stale builds
3. Verify `seed:run:remote` fails with safety check (expected behavior pre-fix)

**No database migrations** - Changes are code-only, immediate rollback possible.

**Monitoring:**
- Check CI/CD pipeline passes after rollback
- Verify `pnpm test:unit` passes in `apps/payload`

## Step by Step Tasks

### Step 1: Add `--force` flag to Commander argument parsing

**File:** `apps/payload/src/seed/seed-engine/index.ts`

**Changes:**
- Add `.option('--force', 'Bypass production safety check for intentional remote seeding', false)` to the Commander program definition (around line 106, after the `--env` option)
- Update the `SeedOptions` type to include `force: boolean`

**Location:** Lines 81-147 in `parseArguments()` function

### Step 2: Update early argument parsing to handle `--force` flag

**File:** `apps/payload/src/seed/seed-engine/index.ts`

**Changes:**
- Create `getForceFromArgs()` function similar to `getEnvNameFromArgs()` to check for `--force` flag early
- Store result in module-level variable for use in safety validation

**Rationale:** The `--force` flag needs to be available before Commander runs, similar to `--env`, because safety validation happens early in the startup sequence.

### Step 3: Modify `validateEnvironmentSafety()` to respect `--force` flag

**File:** `apps/payload/src/seed/seed-engine/index.ts`

**Changes:**
- Update function signature to accept a `force` parameter: `validateEnvironmentSafety(logger: Logger, force: boolean): boolean`
- If `force` is `true` and `NODE_ENV === 'production'`:
  - Log a warning: `logger.warn('WARNING: Production safety check bypassed with --force flag');`
  - Return `true` (allow seeding to proceed)
- If `force` is `false` and `NODE_ENV === 'production'`:
  - Keep existing behavior (block with error message)
  - Add hint: `logger.info('Use --force to bypass this check for intentional remote seeding');`

**Location:** Lines 166-188

### Step 4: Update types definition

**File:** `apps/payload/src/seed/seed-engine/types.ts`

**Changes:**
- Add `force?: boolean` to the `SeedOptions` interface

### Step 5: Update `seed:run:remote` npm script

**File:** `apps/payload/package.json`

**Changes:**
- Update the `seed:run:remote` script to include `--force`:
  ```json
  "seed:run:remote": "cross-env SKIP_STORAGE_PLUGIN=true tsx src/seed/seed-engine/index.ts --env=production --force"
  ```

### Step 6: Update slash command to use `--force` flag

**File:** `.claude/commands/supabase-seed-remote.md`

**Changes:**
- Update the seeding command in Phase 4 from:
  ```bash
  pnpm run seed:run --env=production
  ```
  to:
  ```bash
  pnpm run seed:run:remote
  ```
  (which includes `--force`)

- Add documentation note explaining the `--force` flag and its purpose

### Step 7: Add/update unit tests

**File:** `apps/payload/src/seed/seed-engine/index.test.ts`

**Changes:**
- Add test case: `--force flag bypasses production safety check`
- Add test case: `--force flag logs warning when used`
- Verify existing test: `production safety check blocks without --force`

### Step 8: Run validation commands

Execute all validation commands to ensure zero regressions.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

```bash
# 1. Type checking - ensure no TypeScript errors
pnpm --filter payload typecheck

# 2. Unit tests - verify seed engine functionality
pnpm --filter payload test:unit src/seed/seed-engine/

# 3. Lint - ensure code quality
pnpm lint --filter payload

# 4. Dry run without --force (should fail with safety check)
cd apps/payload && NODE_ENV=production pnpm run seed:dry 2>&1 | grep -q "SAFETY CHECK FAILED" && echo "PASS: Safety check still blocks without --force"

# 5. Verify --force flag is recognized (dry run)
cd apps/payload && pnpm run seed:run:remote --dry-run 2>&1 | grep -q "WARNING: Production safety check bypassed" && echo "PASS: --force flag works"

# 6. Full build - ensure no build errors
pnpm build --filter payload
```

## Notes

### Security Considerations
- The `--force` flag is intentionally verbose (`--force` not `-f`) to prevent accidental use
- The warning message clearly indicates production safety is bypassed
- The flag only affects the NODE_ENV check, not other validations (DATABASE_URI, PAYLOAD_SECRET still required)

### Alternative Considered
An alternative approach would be to add a `ALLOW_PRODUCTION_SEED=true` environment variable. This was rejected because:
1. Flags are more explicit and visible in command invocations
2. Environment variables can be accidentally set in shell profiles
3. The `--force` pattern is more common in CLI tools for "I know what I'm doing" scenarios

### Related Issues
- #1007: Bug Diagnosis for `--env` flag parsing (separate issue, but related to seed engine CLI)
