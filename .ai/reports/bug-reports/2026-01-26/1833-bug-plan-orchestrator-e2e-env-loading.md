# Bug Fix: Alpha orchestrator should load E2E env vars from apps/e2e/.env.local

**Related Diagnosis**: #1831 (REQUIRED)
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `loadEnvFile()` only loads root `.env`, ignoring `apps/e2e/.env.local`
- **Fix Approach**: Extend `loadEnvFile()` to load from multiple env file locations in priority order
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha spec orchestrator prompts for `E2E_SUPABASE_SERVICE_ROLE_KEY`, `E2E_TEST_USER_EMAIL`, and `E2E_TEST_USER_PASSWORD` even though these variables exist in `apps/e2e/.env.local`. The `loadEnvFile()` function only loads from the root `.env` file and returns immediately without checking app-specific env files.

For full details, see diagnosis issue #1831.

### Solution Approaches Considered

#### Option 1: Multi-file env loading with helper function ⭐ RECOMMENDED

**Description**: Extract the single-file parsing logic into a reusable helper function, then call it for each known env file location in priority order. Later files can override earlier ones (standard dotenv precedence).

**Pros**:
- Clean separation of concerns (parsing vs. file discovery)
- Easily extensible for future env file locations
- Maintains existing "don't override already-set vars" behavior
- No external dependencies required
- Testable in isolation

**Cons**:
- Slightly more lines of code than minimal approach
- Hardcodes known env file paths (acceptable for internal tooling)

**Risk Assessment**: low - purely additive change, no modification to existing parsing logic

**Complexity**: simple - ~15-20 lines of new code

#### Option 2: Use dotenv package

**Description**: Replace custom env loading with the `dotenv` npm package and configure multiple file paths.

**Pros**:
- Well-tested, standard library
- Handles edge cases automatically
- Community-supported

**Cons**:
- Adds external dependency to internal tooling
- Over-engineered for this simple use case
- May have different precedence behavior than current implementation

**Why Not Chosen**: Adding a dependency for ~20 lines of simple code is unnecessary overhead for internal tooling.

#### Option 3: Minimal inline fix

**Description**: Simply duplicate the env parsing loop for `apps/e2e/.env.local` after the root `.env` loading.

**Pros**:
- Fastest to implement
- No refactoring required

**Cons**:
- Code duplication (DRY violation)
- Harder to maintain if more files needed later
- Less readable

**Why Not Chosen**: The helper function approach is only marginally more work but significantly more maintainable.

### Selected Solution: Multi-file env loading with helper function

**Justification**: This approach provides clean, maintainable code that can easily accommodate future env file locations while keeping the implementation simple and dependency-free. The existing "don't override already-set vars" behavior is preserved.

**Technical Approach**:
- Extract `parseEnvFile(filePath: string): void` helper that handles parsing a single file
- Modify `loadEnvFile()` to call helper for each known location in order
- Load files in priority order: root `.env` first, then `apps/e2e/.env.local`, then `apps/web/.env.local`
- Skip files that don't exist (graceful degradation)
- Maintain existing behavior: env vars already set take precedence

**Architecture Changes**: None - this is a localized change within the orchestrator script.

**Migration Strategy**: None needed - no data or API changes.

## Implementation Plan

### Affected Files

List files that need modification:
- `.ai/alpha/scripts/spec-orchestrator.ts` - Modify `loadEnvFile()` function (lines 38-76)

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Extract helper function for parsing a single env file

Extract the env file parsing logic (lines 48-69) into a reusable helper function.

- Create `parseEnvFile(filePath: string): void` function
- Move the file reading and line parsing logic into the helper
- Helper should skip gracefully if file doesn't exist
- Helper should preserve "don't override already-set vars" behavior

**Why this step first**: Establishes the reusable building block before adding multi-file support.

#### Step 2: Modify loadEnvFile() to call helper for multiple locations

Update `loadEnvFile()` to load from multiple env file locations.

- After finding project root, build list of env file paths to load
- Load in priority order: `.env` (root), `apps/e2e/.env.local`, `apps/web/.env.local`
- Call `parseEnvFile()` for each path
- Remove early `return` statement that prevented loading additional files

#### Step 3: Add validation/logging for debugging

Add optional debug logging to help troubleshoot env loading.

- Add comment documenting the load order
- Consider adding a `--debug-env` flag for verbose output (optional)

#### Step 4: Validate the fix

Run validation commands to ensure the fix works.

- Run `tsx .ai/alpha/scripts/spec-orchestrator.ts 1823 --dry-run`
- Verify E2E vars no longer show as "Missing" in pre-flight check
- Run typecheck, lint, and format

## Testing Strategy

### Unit Tests

This is internal tooling without a formal test suite. Manual testing is appropriate.

- Verify E2E_SUPABASE_SERVICE_ROLE_KEY is loaded from apps/e2e/.env.local
- Verify E2E_TEST_USER_EMAIL is loaded
- Verify E2E_TEST_USER_PASSWORD is loaded
- Verify root .env vars still load correctly
- Verify env vars set in shell still take precedence

### Integration Tests

Not applicable for internal tooling.

### E2E Tests

Not applicable for internal tooling.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run `tsx .ai/alpha/scripts/spec-orchestrator.ts 1823 --dry-run` before fix (should show E2E vars as "Missing")
- [ ] Apply fix
- [ ] Run `tsx .ai/alpha/scripts/spec-orchestrator.ts 1823 --dry-run` after fix (E2E vars should show as present)
- [ ] Verify E2B_API_KEY still loads from root .env
- [ ] Verify ANTHROPIC_API_KEY still loads from root .env
- [ ] Test with env var set in shell (should override file values)
- [ ] Run a real spec implementation to verify end-to-end functionality

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Unexpected env var override**: If apps/e2e/.env.local has a var also in root .env
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: Load root .env first, app-specific files second. Document precedence order.

2. **File path assumptions break**: If project structure changes
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: Gracefully skip missing files. Add comment documenting expected paths.

**Rollback Plan**:

If this fix causes issues:
1. Revert the commit
2. Manually set required E2E vars in root .env or shell environment
3. Continue with workaround until fix is refined

**Monitoring**: Not needed for internal tooling.

## Performance Impact

**Expected Impact**: none

The fix adds reading 1-2 additional small text files at startup. This is negligible compared to the orchestrator's actual work (spinning up E2B sandboxes, running Claude Code sessions).

**Performance Testing**: Not needed.

## Security Considerations

**Security Impact**: none

- No new env vars are exposed
- No changes to how env vars are used
- No changes to sandboxing or external communication
- Existing precedence (shell > file) is preserved

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Show that E2E vars appear as "Missing" despite existing in apps/e2e/.env.local
tsx .ai/alpha/scripts/spec-orchestrator.ts 1823 --dry-run 2>&1 | grep -E "(E2E_SUPABASE_SERVICE_ROLE_KEY|E2E_TEST_USER_EMAIL|E2E_TEST_USER_PASSWORD|Missing)"
```

**Expected Result**: E2E vars shown as "Missing" in pre-flight check.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Verify fix
tsx .ai/alpha/scripts/spec-orchestrator.ts 1823 --dry-run 2>&1 | head -50

# Specific check for E2E vars
tsx .ai/alpha/scripts/spec-orchestrator.ts 1823 --dry-run 2>&1 | grep -E "(E2E_SUPABASE_SERVICE_ROLE_KEY|E2E_TEST_USER_EMAIL|E2E_TEST_USER_PASSWORD)"
```

**Expected Result**: All commands succeed, E2E vars recognized as present, zero regressions.

### Regression Prevention

```bash
# Ensure root .env vars still load
tsx .ai/alpha/scripts/spec-orchestrator.ts 1823 --dry-run 2>&1 | grep -E "(E2B_API_KEY|ANTHROPIC_API_KEY)"

# Full validation
pnpm typecheck && pnpm lint && pnpm format
```

## Dependencies

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: none

This is internal tooling that runs locally. No deployment needed.

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Pre-flight check recognizes E2E_SUPABASE_SERVICE_ROLE_KEY from apps/e2e/.env.local
- [ ] Pre-flight check recognizes E2E_TEST_USER_EMAIL and E2E_TEST_USER_PASSWORD
- [ ] Root .env vars (E2B_API_KEY, ANTHROPIC_API_KEY) still load correctly
- [ ] Shell-set env vars still take precedence over file values
- [ ] Code review approved (if applicable)
- [ ] Manual testing checklist complete

## Notes

**Related Issues**:
- #1827 - Original diagnosis (superseded by #1831)
- #1828 - Previous fix plan (closed but never implemented)
- #1831 - Current diagnosis (this plan is based on)

**Code Reference**: The function to modify is `loadEnvFile()` at `.ai/alpha/scripts/spec-orchestrator.ts:38-76`.

**Workaround** (until fix is implemented): Copy E2E vars to root `.env` or set them in the shell environment.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1831*
