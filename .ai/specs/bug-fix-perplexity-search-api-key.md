# Bug Fix: Perplexity Search API Key Configuration

**Related Diagnosis**: #623
**Severity**: critical
**Bug Type**: integration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Perplexity Search API enforces an API key creation date cutoff policy. Current key predates the cutoff and is rejected with HTTP 451.
- **Fix Approach**: Generate a new API key from Perplexity and update environment configuration
- **Estimated Effort**: small (5-10 minutes)
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Perplexity Search API endpoint (`POST https://api.perplexity.ai/search`) is failing with HTTP 451 error code `api_key_created_before_search_api_cutoff`. This indicates that the current API key was created before Perplexity's cutoff date for the Search API. The Chat Completions API continues to work with the same key, confirming the API key is valid but the Search API has stricter requirements.

For full details, see diagnosis issue #623.

### Solution Approaches Considered

#### Option 1: Generate New API Key ⭐ RECOMMENDED

**Description**: Navigate to Perplexity's API key management portal and generate a new API key that will satisfy the Search API cutoff policy, then update the environment configuration.

**Pros**:
- Immediate resolution (5-10 minutes)
- No code changes required
- Zero risk to existing functionality
- Vendor-recommended solution
- Both Search and Chat APIs will continue working

**Cons**:
- Requires manual action to access Perplexity account
- New key must be securely stored in environment

**Risk Assessment**: Low - Straightforward credential rotation with no code impact.

**Complexity**: Simple - Configuration update only.

#### Option 2: Implement API Key Validation Detection

**Description**: Add proactive detection in `.ai/tools/perplexity/utils.py` to catch 451 errors and provide user-friendly guidance about generating a new key.

**Pros**:
- Better error messaging for future users
- Detects the issue earlier in the workflow
- Prevents silent failures

**Cons**:
- Adds error handling code that only addresses one vendor policy
- Doesn't solve the underlying problem
- Requires code changes

**Why Not Chosen**: While nice-to-have for UX, this approach doesn't fix the actual issue. The immediate blocker is the configuration, not error detection. Can be added as a follow-up improvement.

#### Option 3: Switch to Alternative Search Provider

**Description**: Replace Perplexity Search API with alternative providers (Google Custom Search, Bing Search API, etc.)

**Pros**:
- Removes dependency on Perplexity's policy
- May offer different features

**Cons**:
- Requires significant code changes
- Different API contracts and error handling
- May require re-authentication or different keys
- Out of scope for this bug fix

**Why Not Chosen**: Premature and unnecessary. The primary issue is a simple credential rotation, not a fundamental problem with the vendor relationship.

### Selected Solution: Generate New API Key

**Justification**: This is the fastest, lowest-risk solution that directly addresses the root cause. Perplexity explicitly guides users to generate a new API key, confirming this is the intended path. No code changes are needed, and the fix is immediately effective.

**Technical Approach**:
1. User navigates to https://www.perplexity.ai/account/api/keys
2. Generates a new API key (will have a recent creation date post-cutoff)
3. Updates `.ai/.env` with `PERPLEXITY_API_KEY=<new-key>`
4. Tests both Search and Chat APIs to confirm functionality

**Architecture Changes**: None. This is a pure configuration update.

**Migration Strategy**: Not applicable - this is a credential rotation, not a data migration.

## Implementation Plan

### Affected Files

- `.ai/.env` - Environment configuration file (not in git)
  - Update `PERPLEXITY_API_KEY` value with new key
  - File is already listed in `.gitignore`, no security risk

### New Files

None - this is a configuration-only fix.

### Step-by-Step Tasks

#### Step 1: Generate New API Key from Perplexity

Navigate to https://www.perplexity.ai/account/api/keys and create a new API key.

- Log in to Perplexity account
- Go to Account Settings > API Keys
- Click "Generate New Key" or similar button
- Copy the new API key value
- Securely store it (don't share or commit to git)

**Why this step first**: The new key must exist before updating configuration.

#### Step 2: Update Environment Configuration

Edit `.ai/.env` and replace the old `PERPLEXITY_API_KEY` value with the new one.

- Open `.ai/.env` in an editor
- Locate the line `PERPLEXITY_API_KEY=<old-value>`
- Replace with `PERPLEXITY_API_KEY=<new-value-from-step-1>`
- Save the file
- Verify file is not staged for git commit (should be in `.gitignore`)

**Verify changes**:
```bash
grep "PERPLEXITY_API_KEY" .ai/.env
# Should show new key value
```

#### Step 3: Test Functionality

Verify both Search and Chat APIs work with the new key.

- Test Search API:
  ```bash
  cd .ai && uv run -m tools.perplexity.cli_search "test query"
  ```
  Expected: Returns ranked search results with snippets and URLs (no 451 error)

- Test Chat API:
  ```bash
  cd .ai && uv run -m tools.perplexity.cli_chat "test query"
  ```
  Expected: Returns chat response with citations (should continue working)

**Success criteria**:
- ✅ Search API returns results or citation format responses
- ✅ No HTTP 451 or `api_key_created_before_search_api_cutoff` errors
- ✅ Chat API continues to work
- ✅ Both APIs authenticate successfully

#### Step 4: Verify Agent Access

Test the Perplexity Search Expert agent can access the updated credentials.

- Run a test command that uses perplexity-search-expert:
  ```bash
  # This would be used by the research agent
  cd .ai && uv run -m tools.perplexity.cli_search "example research query"
  ```

- Verify the agent initializes without errors
- Confirm search results are returned

**Success criteria**:
- ✅ perplexity-search-expert agent initialization succeeds
- ✅ Search queries execute without 451 errors
- ✅ Results are properly formatted

#### Step 5: Validation

Confirm fix is complete and no regressions.

- Run both API tests again to verify consistency
- Check `.ai/.env` is not accidentally committed
- Confirm no new error logs in stderr output

## Testing Strategy

### Manual Testing Checklist

Execute these tests to verify the fix:

- [ ] Generate new API key from https://www.perplexity.ai/account/api/keys
- [ ] Update `.ai/.env` with new `PERPLEXITY_API_KEY` value
- [ ] Verify file is not staged for git commit (`git status`)
- [ ] Test Search API: `cd .ai && uv run -m tools.perplexity.cli_search "test query"`
  - Should return results WITHOUT HTTP 451 error
  - Should display search results with snippets and URLs
- [ ] Test Chat API: `cd .ai && uv run -m tools.perplexity.cli_chat "test query"`
  - Should continue working as before
  - Should display response with citations
- [ ] Test perplexity-search-expert agent can access API
  - Run any command that uses the research agent
  - Verify no 451 errors in logs
- [ ] Verify no UI regressions (if applicable - this is CLI/agent change)
- [ ] Confirm both APIs work consistently across multiple test runs

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **User forgets to update .env file**: If the new key isn't configured, Search API will continue failing
   - **Likelihood**: Medium (depends on user following instructions)
   - **Impact**: Medium (search functionality remains broken)
   - **Mitigation**: Clear documentation and verification steps in fix plan

2. **Accidental key exposure**: If new key is committed to git or exposed in logs
   - **Likelihood**: Low (file is in `.gitignore`)
   - **Impact**: High (API account compromise)
   - **Mitigation**: Key is only used locally in `.ai/.env`, never logged, never committed

3. **Perplexity rotates key policy again**: Future cutoff dates could affect new keys
   - **Likelihood**: Low (unlikely Perplexity will rotate policy frequently)
   - **Impact**: Would require key regeneration again
   - **Mitigation**: Document the cutoff policy in project docs for future reference

**Rollback Plan**:

If this fix doesn't resolve the issue:
1. Verify the new API key is correctly entered in `.ai/.env`
2. Check for any whitespace or formatting issues in the key value
3. Log in to Perplexity account and verify the key is still active
4. If key is invalid, generate another new key and retry
5. If problem persists, contact Perplexity support with error details from the API response

**Monitoring** (ongoing):

- Monitor for any new HTTP 451 errors in Perplexity API calls
- If 451 errors reappear, it indicates Perplexity may have introduced another cutoff policy
- Document any new API restrictions in `.ai/tools/perplexity/README.md`

## Performance Impact

**Expected Impact**: None

This is a pure configuration change with no code modifications. Performance characteristics remain identical.

## Security Considerations

**Security Impact**: Medium (credential management)

- **API Key Handling**: New key is stored in `.ai/.env` (not committed to git)
- **No exposure in logs**: Perplexity CLI tools should not log API keys
- **Environment isolation**: Key is only available to Python tools in `.ai/` context
- **Verification needed**: Confirm the API key is not logged anywhere in error messages or debugging output

### Security Checklist

- [ ] Verify `.ai/.env` is in `.gitignore` (already is)
- [ ] Confirm new API key is not displayed in console output
- [ ] Check that test runs don't leak the key in error messages
- [ ] Verify `.ai/.env` is never committed to git (`git status`)
- [ ] Document the security implications in `.ai/tools/perplexity/README.md`

## Validation Commands

### Before Fix (Bug Should Reproduce)

To demonstrate the bug exists with the current key:

```bash
cd .ai && uv run -m tools.perplexity.cli_search "test query"
```

**Expected Result Before Fix**: HTTP 451 error with message:
```
API error: {'message': 'This endpoint requires a new API key. Create one at: https://www.perplexity.ai/account/api/keys', 'type': 'api_key_created_before_search_api_cutoff', 'code': 451}
```

### After Fix (Bug Should Be Resolved)

```bash
# Test Search API with new key
cd .ai && uv run -m tools.perplexity.cli_search "test query"

# Test Chat API with new key (should still work)
cd .ai && uv run -m tools.perplexity.cli_chat "test query"

# Verify environment file is correct
grep "PERPLEXITY_API_KEY" .ai/.env
```

**Expected Result After Fix**:
- Search API returns ranked results (no 451 error)
- Chat API continues to work normally
- No API authentication errors
- Both commands complete successfully

### Regression Prevention

```bash
# Verify .env is not accidentally staged
git status .ai/.env
# Should show: nothing (file is untracked and in .gitignore)

# Verify no API keys are logged
cd .ai && uv run -m tools.perplexity.cli_search "test" 2>&1 | grep -i "perplexity_api_key"
# Should return nothing (key should not appear in output)
```

## Dependencies

### New Dependencies

**No new dependencies required** - This fix uses existing tools and credentials.

Existing dependencies used:
- `.ai/tools/perplexity/` - Already installed
- `uv` - Already available for running Python CLI tools
- Perplexity API account - Already configured

## Database Changes

**No database changes required** - This is a pure configuration update.

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**: None - this is a local configuration change.

**Feature flags needed**: No

**Backwards compatibility**: Maintained - no code changes, only credential rotation

**Local Development Impact**:
- Each developer must update their own `.ai/.env` file
- No shared configuration needed
- No database migrations required
- No environment variable changes needed beyond updating the key value

## Success Criteria

The fix is complete when:

- [ ] New API key generated from https://www.perplexity.ai/account/api/keys
- [ ] `.ai/.env` updated with new `PERPLEXITY_API_KEY` value
- [ ] `cd .ai && uv run -m tools.perplexity.cli_search "test"` succeeds (no 451 error)
- [ ] `cd .ai && uv run -m tools.perplexity.cli_chat "test"` succeeds
- [ ] perplexity-search-expert agent can execute searches
- [ ] No HTTP 451 errors in any Perplexity API calls
- [ ] `.ai/.env` is not staged for git commit (remains local-only)
- [ ] Security review: API key is not logged or exposed

## Notes

### Implementation Notes

- This fix is entirely manual configuration - no coding required
- The `.ai/.env` file is already in `.gitignore`, so no accidental commits will occur
- Both developers and CI/CD systems need to configure their own copy of `.ai/.env`
- Consider documenting this in team onboarding/setup guides

### Future Improvements (Not in Scope)

These could be added in follow-up tasks but are not required for the fix:

1. Add proactive error detection in `utils.py` to catch 451 errors with helpful messaging
2. Document the Perplexity API key cutoff policy in `.ai/tools/perplexity/README.md`
3. Add API key validation function to check key creation date (if Perplexity provides an endpoint)
4. Create setup script to guide users through initial API key generation
5. Add warning messages if API calls start returning 451 errors

### References

- Perplexity API Portal: https://www.perplexity.ai/account/api/keys
- Original Feature Issue: #596 (Perplexity API Integration)
- Integration Code: `.ai/tools/perplexity/`
- Agent Configuration: `.claude/agents/research/perplexity-search-expert.md`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #623*
