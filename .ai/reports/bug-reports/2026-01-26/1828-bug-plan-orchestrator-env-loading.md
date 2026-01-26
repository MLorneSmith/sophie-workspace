# Bug Fix: Alpha orchestrator should load environment variables from app-specific .env files

**Related Diagnosis**: #1827
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `loadEnvFile()` in `spec-orchestrator.ts` only loads project root `.env`, not `apps/e2e/.env.local`
- **Fix Approach**: Extend `loadEnvFile()` to load both root `.env` and app-specific `.env.local` files in sequence
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha spec orchestrator's environment loading function only loads `.env` from the project root, missing app-specific environment variables stored in `apps/e2e/.env.local`, `apps/web/.env.local`, and similar files. This causes the pre-flight check to report valid environment variables as "missing" when features require them.

For full details, see diagnosis issue #1827.

### Solution Approaches Considered

#### Option 1: Extend `loadEnvFile()` to load multiple .env locations ⭐ RECOMMENDED

**Description**: Modify `loadEnvFile()` to load `.env` files from multiple known locations in sequence:
1. Root `.env` (existing)
2. `apps/e2e/.env.local` (for E2E-specific vars)
3. `apps/web/.env.local` (for web-specific vars - optional future)

Later values take precedence over earlier ones, allowing app-specific overrides.

**Pros**:
- Simple, minimal code changes
- Follows monorepo pattern where each app has its own env file
- No new dependencies or breaking changes
- Handles all current and future app-specific vars
- Clear intent in code

**Cons**:
- Assumes fixed locations (though they match current structure)
- May load unnecessary files if they don't exist (handled gracefully with fs.existsSync checks)

**Risk Assessment**: low - Just adds file reads, skips gracefully if files missing

**Complexity**: simple - Just adds a few more `fs.readFileSync()` calls

#### Option 2: Load env files dynamically based on manifest requirements

**Description**: When pre-flight check runs, analyze the manifest's `required_env_vars[].source` field (e.g., `.env.test in apps/e2e`) and load only those specific files.

**Pros**:
- Only loads exactly what's needed
- Future-proof: adapts to new source locations

**Cons**:
- More complex: requires parsing source field, finding files dynamically
- Higher risk: breaks if source format changes
- Duplicates path logic

**Why Not Chosen**: Over-engineered for current needs. Option 1 handles all cases with simpler code.

#### Option 3: Add all app-specific vars to root .env

**Description**: Copy E2E variables from `apps/e2e/.env.local` to root `.env`.

**Pros**:
- No code changes needed

**Cons**:
- Creates duplication
- Breaks monorepo pattern
- Harder to maintain

**Why Not Chosen**: Creates duplication and violates project structure.

### Selected Solution: Extend `loadEnvFile()` to load multiple .env locations

**Justification**: This approach is simple, low-risk, maintainable, and follows the monorepo pattern where each app manages its own environment. It requires minimal code changes and handles all current and future E2E/app-specific variables.

**Technical Approach**:
- Keep root `.env` loading logic unchanged
- Add additional file reads for known app-specific locations
- Use graceful handling (fs.existsSync checks) to skip missing files
- Load files in priority order, with later files overriding earlier ones

**Architecture Changes**: None - purely additive to `loadEnvFile()` function

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/spec-orchestrator.ts` (lines 38-76: modify `loadEnvFile()` function)
  - Add loading of `apps/e2e/.env.local` after root `.env`
  - Add loading of `apps/web/.env.local` for future compatibility

### New Files

None required.

### Step-by-Step Tasks

#### Step 1: Update `loadEnvFile()` function

Modify the function in `spec-orchestrator.ts` to load additional env files:

- Keep the existing root `.env` loading logic intact
- After loading root `.env`, add a helper function call to load app-specific env files
- Helper function loads `apps/e2e/.env.local`, then `apps/web/.env.local`
- Each file's variables are loaded into `process.env` in order
- Later files override earlier ones (standard .env precedence)

**Why this step first**: This is the core fix that enables the pre-flight check to find all required variables.

#### Step 2: Extract env file loading into helper function (optional refactoring)

Extract the "read and parse .env file into process.env" logic into a reusable helper function:

```typescript
function loadEnvFileIntoProcess(filePath: string): void {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf-8");
  // ... existing parsing logic
}
```

**Why separate**: Improves code maintainability and allows easy addition of more env files in future.

#### Step 3: Test the fix

- Verify orchestrator loads variables from `apps/e2e/.env.local`
- Run pre-flight check and confirm E2E variables are recognized
- Test that root `.env` values aren't overridden unexpectedly
- Test that missing files don't cause errors

#### Step 4: Validation

- Run full validation commands (see Validation Commands section)
- Manually test orchestrator startup with a spec

## Testing Strategy

### Unit Tests

The `loadEnvFile()` function currently doesn't have unit tests. For this fix:

- ✅ Test that root `.env` is loaded
- ✅ Test that `apps/e2e/.env.local` is loaded when present
- ✅ Test that missing files don't cause errors
- ✅ Test that later files override earlier ones
- ✅ Edge case: Both root and app-specific have same variable

**Rationale**: These test cases ensure the multi-file loading works correctly and handles edge cases.

**Test approach**: Create `.ai/alpha/scripts/lib/__tests__/environment-loading.spec.ts` with mock file system scenarios.

### Integration Tests

- ✅ Run orchestrator startup and verify pre-flight check finds E2E_SUPABASE_SERVICE_ROLE_KEY
- ✅ Run orchestrator startup with S1823 and confirm no "missing" prompts for E2E vars

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Orchestrator starts and loads root `.env` (existing behavior unchanged)
- [ ] Orchestrator also loads `apps/e2e/.env.local`
- [ ] Pre-flight check recognizes `E2E_SUPABASE_SERVICE_ROLE_KEY` from `apps/e2e/.env.local`
- [ ] Pre-flight check recognizes `E2E_TEST_USER_EMAIL` and `E2E_TEST_USER_PASSWORD`
- [ ] Missing `apps/e2e/.env.local` doesn't cause orchestrator to fail
- [ ] Environment variables from root `.env` are still available
- [ ] Run full orchestrator workflow with S1823 without pre-flight prompts for E2E vars

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Environment variable precedence confusion**: If same var exists in both root and app `.env.local`, which takes precedence?
   - **Likelihood**: low (unlikely to have duplicates)
   - **Impact**: low (clear ordering: app-specific overrides root)
   - **Mitigation**: Document the loading order in code comments. Test with duplicates.

2. **Missing file paths**: Hard-coded paths might break if monorepo structure changes
   - **Likelihood**: low (structure is stable)
   - **Impact**: medium (env vars silently not loaded)
   - **Mitigation**: Use graceful fs.existsSync checks. Add informational logging.

3. **Performance**: Multiple fs.readFileSync calls
   - **Likelihood**: low (file I/O happens once at startup)
   - **Impact**: negligible (milliseconds at most)
   - **Mitigation**: None needed - acceptable trade-off

**Rollback Plan**:

If this fix causes issues:
1. Revert `spec-orchestrator.ts` to previous version
2. Environment loading returns to root `.env` only
3. Users would need to add E2E vars to root `.env` as workaround

**Monitoring** (if needed):
- No production monitoring needed for this change
- If issues, check orchestrator logs for env loading messages

## Performance Impact

**Expected Impact**: none

Environment variable loading happens once during orchestrator startup (before any sandboxes are created). Adding 1-2 additional file reads has negligible performance impact (microseconds).

## Security Considerations

**Security Impact**: none

- This fix doesn't expose or store any new credentials
- The files being read already exist in the monorepo structure
- No new permissions or access patterns introduced
- Standard environment variable handling with no additional risk

## Validation Commands

### Before Fix (Verify Bug)

```bash
# Start orchestrator - should show E2E vars as missing
tsx .ai/alpha/scripts/spec-orchestrator.ts 1823 --dry-run

# Expected: Pre-flight check shows E2E_SUPABASE_SERVICE_ROLE_KEY as missing
```

### After Fix (Verify Resolution)

```bash
# Type check
pnpm typecheck

# Format
pnpm format

# Lint
pnpm lint

# Run orchestrator dry-run - should NOT show E2E vars as missing
tsx .ai/alpha/scripts/spec-orchestrator.ts 1823 --dry-run

# Expected: Pre-flight check shows all E2E vars as found
# If any are still missing, the fix is incomplete

# Full validation (optional)
pnpm --filter web test  # Run web tests to ensure no regressions
```

### Regression Prevention

```bash
# Verify environment loading didn't break anything
# Run a quick orchestrator startup check
tsx .ai/alpha/scripts/spec-orchestrator.ts 1815 --dry-run  # Different spec

# Verify both root .env and app-specific .env.local work correctly
```

## Dependencies

No new dependencies required.

## Database Changes

No database changes required.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: none

**Feature flags needed**: no

**Backwards compatibility**: maintained (only adds new file loading, doesn't remove anything)

## Success Criteria

The fix is complete when:
- [ ] `loadEnvFile()` loads both root `.env` and `apps/e2e/.env.local`
- [ ] Pre-flight check doesn't report E2E_SUPABASE_SERVICE_ROLE_KEY as missing
- [ ] Pre-flight check doesn't report E2E_TEST_USER_EMAIL as missing
- [ ] Pre-flight check doesn't report E2E_TEST_USER_PASSWORD as missing
- [ ] All validation commands pass
- [ ] No regressions in environment loading
- [ ] Code is well-commented explaining the multi-file loading strategy
- [ ] Manual testing checklist complete

## Notes

**Implementation details**:

The fix is straightforward - add ~10 lines of code to load additional env files. The existing logic for parsing `.env` format already exists and works correctly, so we just apply it to more files.

**Future enhancements**:

- Add similar support for `apps/web/.env.local` if needed
- Add environment loading logging (debug level) for visibility
- Document env file precedence in project CLAUDE.md

**Related code**:
- `spec-orchestrator.ts:78` - Calls `loadEnvFile()` at module load time
- `env-requirements.ts:240-252` - `validateRequiredEnvVars()` checks `process.env`
- `pre-flight.ts:109-230` - Pre-flight check displays missing vars

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1827*
