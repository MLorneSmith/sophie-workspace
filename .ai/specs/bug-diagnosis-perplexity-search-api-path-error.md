# Bug Diagnosis: Perplexity Search API Path Calculation Error

**ID**: ISSUE-651
**Created**: 2025-11-19T15:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Perplexity Search API returns error 451 (`api_key_created_before_search_api_cutoff`) despite the user having updated their API key in `.ai/.env`. This is caused by an incorrect path calculation in the previous fix (#624) that looks for the `.env` file in `.ai/tools/.env` instead of `.ai/.env`, causing it to fall back to an old shell environment variable with a pre-September 2025 API key.

## Environment

- **Application Version**: dev branch, commit 4c98aa988
- **Environment**: development
- **Node Version**: N/A (Python tooling)
- **Python Version**: via uv
- **Last Working**: Never worked correctly after #624 fix

## Reproduction Steps

1. Update `PERPLEXITY_API_KEY` in `.ai/.env` with a new key
2. Run `.ai/bin/perplexity-search "test query"`
3. Observe error 451: `api_key_created_before_search_api_cutoff`

## Expected Behavior

The Perplexity Search CLI should load the API key from `.ai/.env` and successfully execute search queries.

## Actual Behavior

The CLI fails with:
```
API error: {'message': 'This endpoint requires a new API key. Create one at: https://www.perplexity.ai/account/api/keys', 'type': 'api_key_created_before_search_api_cutoff', 'code': 451}
```

The Chat API works because the shell environment variable (old key) is still valid for `/chat/completions` endpoint.

## Diagnostic Data

### Console Output
```
$ .ai/bin/perplexity-search "test query"
API error: {'message': 'This endpoint requires a new API key...', 'type': 'api_key_created_before_search_api_cutoff', 'code': 451}
```

### Path Calculation Analysis
```python
# Current code in utils.py line 35:
ai_env = Path(__file__).parent.parent / ".env"

# Where __file__ = .ai/tools/perplexity/utils.py
# Path calculation:
#   .parent       = .ai/tools/perplexity
#   .parent.parent = .ai/tools
#   / ".env"      = .ai/tools/.env  (WRONG!)

# Expected:
ai_env = Path(__file__).parent.parent.parent / ".env"
# = .ai/.env (CORRECT)
```

### Environment Variable Conflict
```
Shell env:     PERPLEXITY_API_KEY=pplx-it5...6yJG (old key, pre-Sept 25, 2025)
.ai/.env:      PERPLEXITY_API_KEY=pplx-V...ekA (new key)
Loaded by CLI: pplx-it5...6yJG (shell env because .ai/tools/.env doesn't exist)
```

### API Behavior Verification
- **Chat API** (`/chat/completions`): Works with old key (no cutoff restriction)
- **Search API** (`/search`): Fails with error 451 (requires key created after Sept 25, 2025)

## Error Stack Traces

```
Search failed: [451] {'message': 'This endpoint requires a new API key. Create one at: https://www.perplexity.ai/account/api/keys', 'type': 'api_key_created_before_search_api_cutoff', 'code': 451}
Error: [451] {'message': 'This endpoint requires a new API key...', 'type': 'api_key_created_before_search_api_cutoff', 'code': 451}
```

## Related Code

- **Affected Files**:
  - `.ai/tools/perplexity/utils.py:35` - Incorrect path calculation
- **Recent Changes**:
  - `3b3a2d24a` - fix(tooling): add .env file loading (introduced the bug)
- **Suspected Functions**:
  - `get_api_key()` in utils.py

## Related Issues & Context

### Direct Predecessors
- #623 (CLOSED): "Bug Diagnosis: Perplexity Search API Requires Updated API Key" - Original diagnosis
- #624 (CLOSED): "Bug Fix: Perplexity Search API Key Configuration" - Fix that introduced this regression

### Infrastructure Issues
- #596 (CLOSED): "Feature: Perplexity API Integration Scripts" - Original implementation

### Historical Context
This is a regression of issue #623. The fix in #624 attempted to add .env file loading but used an incorrect path calculation, causing the fix to be ineffective. The bug remained latent because:
1. The shell environment variable still worked for Chat API
2. Search API wasn't tested after the fix was applied

## Root Cause Analysis

### Identified Root Cause

**Summary**: Incorrect path calculation in `utils.py` line 35 causes the `.env` loader to look in the wrong directory (`.ai/tools/.env` instead of `.ai/.env`).

**Detailed Explanation**:
The fix in commit `3b3a2d24a` added dotenv loading to `get_api_key()` but miscalculated the path by one directory level:

```python
# Line 35 in utils.py
ai_env = Path(__file__).parent.parent / ".env"
# Resolves to: .ai/tools/.env (WRONG)

# Should be:
ai_env = Path(__file__).parent.parent.parent / ".env"
# Resolves to: .ai/.env (CORRECT)
```

Because `.ai/tools/.env` doesn't exist, the `load_dotenv()` call is skipped, and the function falls back to the shell environment variable which contains the old API key (created before September 25, 2025).

**Supporting Evidence**:
- Path trace shows calculation resolves to `.ai/tools/.env`
- File verification shows `.ai/tools/.env` does not exist
- Python debugging shows key loaded is from shell env, not `.ai/.env`
- Old shell key suffix (`6yJG`) differs from new .ai/.env key suffix (`ekA`)

### How This Causes the Observed Behavior

1. User updates API key in `.ai/.env` with a new key (post-Sept 25, 2025)
2. `get_api_key()` tries to load from `Path(__file__).parent.parent / ".env"`
3. This resolves to `.ai/tools/.env` which doesn't exist
4. Falls back to shell environment variable `PERPLEXITY_API_KEY`
5. Shell has old key created before September 25, 2025
6. Old key lacks Search API permission (cutoff date was Sept 25, 2025)
7. Perplexity Search API returns error 451

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct path tracing proves the calculation is wrong
- File existence check confirms target path doesn't exist
- Environment variable debugging shows different keys are loaded
- The key suffix mismatch provides definitive proof that the wrong key is being used

## Fix Approach (High-Level)

Change line 35 in `.ai/tools/perplexity/utils.py` from:
```python
ai_env = Path(__file__).parent.parent / ".env"
```
to:
```python
ai_env = Path(__file__).parent.parent.parent / ".env"
```

This adds one more `.parent` to correctly navigate from `.ai/tools/perplexity/utils.py` to `.ai/.env`.

## Diagnosis Determination

**Root Cause Confirmed**: The path calculation bug in the previous fix (#624) causes the .env loader to look in the wrong directory. This is a one-line fix that needs to add `.parent` to the path calculation.

**Verification After Fix**:
1. Run path calculation test to confirm `.ai/.env` is found
2. Run `.ai/bin/perplexity-search "test"` to confirm Search API works
3. Verify key loaded matches the one in `.ai/.env`

## Additional Context

- The Chat API continues to work because the old shell key is still valid for `/chat/completions`
- The Search API endpoint (`/search`) was released on September 25, 2025 and requires keys created after that date
- This issue only affects users who have both a shell env variable and a `.ai/.env` file with different keys

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash, Read, Glob, Task (perplexity-search-expert), AskUserQuestion*
