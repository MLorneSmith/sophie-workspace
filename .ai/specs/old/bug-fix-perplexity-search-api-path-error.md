# Bug Fix: Perplexity Search API Path Calculation Error

**Related Diagnosis**: #651 (REQUIRED)
**Severity**: high
**Bug Type**: bug (regression)
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Incorrect path calculation in utils.py line 35 resolves to `.ai/tools/.env` instead of `.ai/.env`
- **Fix Approach**: Add one more `.parent` to the path calculation to correctly resolve to `.ai/.env`
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Perplexity Search API returns error 451 (`api_key_created_before_search_api_cutoff`) because the `get_api_key()` function in `.ai/tools/perplexity/utils.py` calculates the wrong path for the `.ai/.env` file, causing it to fall back to an outdated API key from shell environment variables.

For full details, see diagnosis issue #651.

### Solution Approaches Considered

#### Option 1: Fix Path Calculation ⭐ RECOMMENDED

**Description**: Add one additional `.parent` call to the path calculation on line 35 to correctly resolve from `.ai/tools/perplexity/utils.py` to `.ai/.env`.

**Pros**:
- Minimal change (one word addition)
- Directly addresses root cause
- Maintains existing code structure and logic
- Easy to verify correctness

**Cons**:
- None significant

**Risk Assessment**: low - Single line change with deterministic behavior

**Complexity**: simple - Trivial one-word fix

#### Option 2: Use Absolute Path Calculation

**Description**: Calculate path from git root or use `__file__` with explicit directory traversal to `.ai/.env`.

**Pros**:
- More explicit path resolution
- Could be more robust to file relocations

**Cons**:
- Over-engineering for a simple fix
- Requires additional logic to find git root
- Current relative approach is appropriate for this use case

**Why Not Chosen**: The current relative path approach is correct; only the calculation was off by one directory level.

#### Option 3: Environment Variable Priority Change

**Description**: Change the priority to prefer shell environment variables over `.env` files.

**Why Not Chosen**: This would break the intended behavior where `.ai/.env` should override shell variables for development flexibility.

### Selected Solution: Fix Path Calculation

**Justification**: This is a clear one-line regression introduced in PR #624. The original intent was correct (load from `.ai/.env` first), but the path calculation was off by one directory level. The fix maintains all existing behavior and intent.

**Technical Approach**:
- Change `.parent.parent` to `.parent.parent.parent` on line 35
- This correctly resolves: `utils.py → perplexity/ → tools/ → .ai/`
- No other changes needed; all surrounding logic remains valid

**Architecture Changes**: None

**Migration Strategy**: None needed

## Implementation Plan

### Affected Files

List files that need modification:
- `.ai/tools/perplexity/utils.py` - Fix path calculation on line 35 from `.parent.parent` to `.parent.parent.parent`

### New Files

None required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Fix the path calculation

Fix the one-line bug in `.ai/tools/perplexity/utils.py`.

- Change line 35 from:
  ```python
  ai_env = Path(__file__).parent.parent / ".env"
  ```
- To:
  ```python
  ai_env = Path(__file__).parent.parent.parent / ".env"
  ```

**Why this step first**: This is the only substantive change needed.

#### Step 2: Add regression test

Create a test to verify the path calculation is correct and prevent future regressions.

- Add test in `.ai/tools/perplexity/tests/` to verify `get_api_key()` resolves correct path
- Test should verify the path resolves to `.ai/.env`

#### Step 3: Validation

- Run validation commands to ensure fix works
- Verify Perplexity Search API calls succeed with new key
- Confirm no regressions in other functionality

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Path resolution: Verify `ai_env` resolves to `.ai/.env`
- ✅ API key loading: Verify key is loaded from correct file when `.ai/.env` exists
- ✅ Fallback behavior: Verify fallback to shell env when `.ai/.env` doesn't exist
- ✅ Regression test: Path calculation should be three levels up from `utils.py`

**Test files**:
- `.ai/tools/perplexity/tests/test_utils.py` - Add path calculation verification

### Integration Tests

Not needed - this is a path calculation fix with unit test coverage.

### E2E Tests

Not needed - the Perplexity tools are internal CLI utilities.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Reproduce original bug (should fail before fix): Run `.ai/bin/perplexity-search "test query"` with outdated shell env key and new key in `.ai/.env`
- [ ] Apply fix and verify bug is resolved
- [ ] Test edge case: `.ai/.env` doesn't exist (should fall back to shell env)
- [ ] Test edge case: Shell env has no key (should raise ValueError)
- [ ] Verify path calculation is correct by adding debug output
- [ ] Test actual search query works with new API key

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Incorrect path calculation (still wrong)**:
   - **Likelihood**: low
   - **Impact**: high
   - **Mitigation**: Verify path resolves correctly before committing; add debug output during testing

2. **Unintended side effects in other tools**:
   - **Likelihood**: very low
   - **Impact**: low
   - **Mitigation**: The `utils.py` module is only used by Perplexity tools; change is isolated

**Rollback Plan**:

If this fix causes issues:
1. Revert the single-line change
2. Manually set correct API key in shell environment as workaround

**Monitoring**: None needed - this is a developer tooling fix, not production code.

## Performance Impact

**Expected Impact**: none

No performance implications - same number of file system operations.

## Security Considerations

**Security Impact**: none

This fix improves security by ensuring the correct API key file is loaded, preventing use of potentially leaked keys in shell environment.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Verify the path calculation is wrong
python3 -c "from pathlib import Path; print(Path('.ai/tools/perplexity/utils.py').resolve().parent.parent / '.env')"
# Should show: .ai/tools/.env (WRONG)

# Test search fails with old key
.ai/bin/perplexity-search "test query"
# Should get error 451
```

**Expected Result**: Path resolves to `.ai/tools/.env` (wrong) and search returns error 451.

### After Fix (Bug Should Be Resolved)

```bash
# Verify the path calculation is correct
python3 -c "from pathlib import Path; print(Path('.ai/tools/perplexity/utils.py').resolve().parent.parent.parent / '.env')"
# Should show: .ai/.env (CORRECT)

# Test search succeeds with new key
.ai/bin/perplexity-search "test query"
# Should return results without error

# Type check (if applicable)
# N/A - Python tooling

# Run Perplexity tests
cd .ai/tools/perplexity && python -m pytest tests/ -v
```

**Expected Result**: Path resolves to `.ai/.env`, search succeeds with new API key.

### Regression Prevention

```bash
# Verify path explicitly
python3 -c "
from pathlib import Path
utils_path = Path('.ai/tools/perplexity/utils.py').resolve()
expected = utils_path.parent.parent.parent / '.env'
print(f'Expected .ai/.env path: {expected}')
assert expected.name == '.env'
assert expected.parent.name == '.ai'
print('✅ Path calculation is correct')
"
```

## Dependencies

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

This is internal developer tooling, not deployed to production.

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [x] Path calculation is corrected (`.parent.parent.parent`)
- [ ] Path resolves to `.ai/.env`
- [ ] Perplexity Search API calls succeed with key from `.ai/.env`
- [ ] Unit tests added for path calculation
- [ ] Manual testing checklist complete

## Notes

This is a regression introduced in #624 when fixing the original Perplexity API integration. The fix is straightforward - one word change (`parent` added).

The docstring on line 19 correctly states the intended behavior ("1. .ai/.env") - only the implementation was incorrect.

**File path trace**:
- `__file__` = `.ai/tools/perplexity/utils.py`
- `.parent` = `.ai/tools/perplexity/`
- `.parent.parent` = `.ai/tools/`
- `.parent.parent.parent` = `.ai/` ✅

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #651*
