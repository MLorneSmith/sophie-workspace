# Bug Diagnosis: Perplexity Search API Requires Updated API Key

**ID**: ISSUE-623
**Created**: 2025-11-17T20:30:00Z
**Reporter**: user
**Severity**: critical
**Status**: new
**Type**: integration

## Summary

The Perplexity Search API endpoint is failing with error code 451 (`api_key_created_before_search_api_cutoff`), indicating that the existing API key was created before Perplexity introduced a cutoff date for the Search API. While the Chat Completions API continues to work with the current API key, the Search API requires a newly-generated API key from https://www.perplexity.ai/account/api/keys.

## Environment

- **Application Version**: SlideHeroes (commit c45eb9a1c)
- **Environment**: development
- **Branch**: dev
- **Node Version**: v22.16.0
- **Python Version**: 3.10.12
- **Last Working**: Unknown (likely never worked with current API key)

## Reproduction Steps

1. Ensure `PERPLEXITY_API_KEY` is set in `.ai/.env` (or use existing API key)
2. Execute Perplexity Search CLI command:
   ```bash
   cd .ai && uv run -m tools.perplexity.cli_search "test query"
   ```
3. Observe error code 451 with message about API key cutoff

## Expected Behavior

The Perplexity Search API should successfully execute web searches and return ranked search results with snippets, URLs, and metadata when provided a valid API key.

## Actual Behavior

The Search API endpoint returns HTTP 451 status with error type `api_key_created_before_search_api_cutoff`, blocking all search operations. The Chat Completions API endpoint continues to function normally with the same API key.

## Diagnostic Data

### Console Output
```
API error: {'message': 'This endpoint requires a new API key. Create one at: https://www.perplexity.ai/account/api/keys', 'type': 'api_key_created_before_search_api_cutoff', 'code': 451} (status: 451, request_id: None)
Search failed: [451] {'message': 'This endpoint requires a new API key. Create one at: https://www.perplexity.ai/account/api/keys', 'type': 'api_key_created_before_search_api_cutoff', 'code': 451}
Error: [451] {'message': 'This endpoint requires a new API key. Create one at: https://www.perplexity.ai/account/api/keys', 'type': 'api_key_created_before_search_api_cutoff', 'code': 451}
```

### Network Analysis
- **Endpoint**: `POST https://api.perplexity.ai/search`
- **Status Code**: 451 (Unavailable For Legal Reasons - repurposed by Perplexity for API policy)
- **Error Type**: `api_key_created_before_search_api_cutoff`
- **Request ID**: None (not provided in 451 responses)

### Chat API Comparison Test
The Chat Completions API works successfully with the same API key:
```bash
cd .ai && uv run -m tools.perplexity.cli_chat "test query"
# Returns: Full response with citations and token usage (no errors)
```

This confirms:
- API key authentication is valid
- Network connectivity is working
- Only the Search API endpoint enforces the cutoff policy
- Chat API endpoint has no such restriction

## Error Stack Traces
```
Exit code 1
API error: {'message': 'This endpoint requires a new API key. Create one at: https://www.perplexity.ai/account/api/keys', 'type': 'api_key_created_before_search_api_cutoff', 'code': 451} (status: 451, request_id: None)
```

## Related Code

- **Affected Files**:
  - `.ai/tools/perplexity/search.py` - Search API implementation
  - `.ai/tools/perplexity/utils.py:14-30` - `get_api_key()` function
  - `.ai/bin/perplexity-search` - Search CLI wrapper script
  - `.claude/agents/research/perplexity-search-expert.md` - Agent that depends on Search API

- **Configuration Files**:
  - `.ai/.env.sample:10` - API key placeholder
  - `.ai/.env` - Actual API key configuration (needs new key)

- **Recent Changes**:
  - `ca733dd84` (2025-11-14): feat(tooling): add Perplexity API integration scripts
  - `61d215b57` (2025-11-14): fix(tooling): handle citations as URL strings in Perplexity Chat API
  - `48df90770` (2025-11-17): docs(tooling): update research tool documentation

- **Suspected Functions**:
  - `PerplexityClient.search()` in `.ai/tools/perplexity/search.py`
  - `get_api_key()` in `.ai/tools/perplexity/utils.py`

## Related Issues & Context

### Direct Predecessors
- #596 (CLOSED): "Feature: Perplexity API Integration Scripts" - Original integration implementation
  - This issue implemented the Perplexity integration but may have used an older API key for testing

### Related Infrastructure Issues
- #602 (CLOSED): "Bug Fix: MCP Servers Not Appearing in Claude Code" - Related to tooling configuration
- #599 (CLOSED): "Bug Fix: docs-mcp MCP Server Not Loading in Claude Code" - Similar integration issues
- #601 (CLOSED): "Bug Diagnosis: MCP Servers Not Appearing in Claude Code" - Integration troubleshooting

### Same Component
- #327 (CLOSED): "Migrate Perplexity and Exa Search Servers" - Earlier Perplexity integration work
- #595 (CLOSED): "Feature: Context7 API Integration Scripts" - Similar API integration pattern
- #324 (CLOSED): "Configure API Keys and Environment" - Environment configuration task

### Historical Context
The Perplexity API integration was recently added (Issue #596, closed 2025-11-14) as part of the research tooling infrastructure. The integration includes both Search and Chat Completions APIs. This is the first reported issue with the Search API specifically, suggesting either:
1. The Search API cutoff policy was introduced recently by Perplexity
2. The original API key used during development was created before the cutoff date
3. Testing primarily focused on Chat API functionality

No similar "API key cutoff" issues found in project history, indicating this is either a new Perplexity policy or a previously undetected issue.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Perplexity introduced an API key cutoff policy specifically for the Search API endpoint, requiring API keys to be created after a specific date. The current API key in use predates this cutoff.

**Detailed Explanation**:

Perplexity has implemented a breaking change in their Search API (`POST https://api.perplexity.ai/search`) that enforces an API key creation date policy. The error type `api_key_created_before_search_api_cutoff` explicitly indicates that API keys created before a certain date are no longer authorized to access the Search API endpoint, even though they remain valid for other endpoints like Chat Completions.

The root cause is **NOT** a configuration issue, authentication failure, or network problem. The API key itself is valid (as proven by successful Chat API calls), but Perplexity has imposed a temporal restriction on Search API access based on key creation date.

This is a vendor-imposed breaking change that affects:
1. **Search API endpoint** (`/search`) - BLOCKED with 451 error
2. **Chat Completions API endpoint** (`/chat/completions`) - WORKS normally

The implementation in `.ai/tools/perplexity/utils.py:14-30` correctly retrieves and validates the API key format, but has no way to detect that the key predates Perplexity's cutoff policy until an actual API call is made.

**Supporting Evidence**:
1. **Error message explicitly states the solution**: "This endpoint requires a new API key. Create one at: https://www.perplexity.ai/account/api/keys"
2. **Error type is specific**: `api_key_created_before_search_api_cutoff` - not a generic auth error
3. **Status code 451**: "Unavailable For Legal Reasons" - typically used for policy-based restrictions
4. **Chat API works**: Same API key successfully authenticates and returns data from Chat endpoint
5. **Code is correct**: The integration code has proper error handling and authentication logic

### How This Causes the Observed Behavior

**Causal Chain**:
1. User or agent invokes Perplexity Search via `.ai/bin/perplexity-search` or the research agent
2. CLI script calls `PerplexityClient.search()` in `.ai/tools/perplexity/search.py`
3. Client retrieves API key via `get_api_key()` from `.ai/.env`
4. HTTP POST request sent to `https://api.perplexity.ai/search` with API key in Authorization header
5. Perplexity backend checks API key creation date against cutoff policy
6. **Policy violation detected**: Key creation date < cutoff date
7. Server returns HTTP 451 with error type `api_key_created_before_search_api_cutoff`
8. Client raises exception and prints error message
9. **Impact**: All Search API functionality unavailable, blocking:
   - `perplexity-search-expert` agent operations
   - Domain-filtered web searches
   - Time-filtered research queries
   - Any workflow relying on ranked search results

**Why Chat API Still Works**:
The Chat Completions endpoint (`/chat/completions`) does not enforce this cutoff policy, allowing existing API keys to continue functioning. This creates a partial service degradation where only Search-specific features are affected.

### Confidence Level

**Confidence**: High

**Reasoning**:
1. **Explicit vendor communication**: Error message directly states the issue and solution
2. **Specific error type**: Not a generic 401/403 auth error, but a named policy violation
3. **Reproducible**: 100% failure rate on Search API, 0% failure rate on Chat API with same credentials
4. **No code defects found**: Review of integration code shows proper authentication and error handling
5. **Clear remediation path**: Vendor provides exact URL to generate compliant API key
6. **External dependency**: This is a Perplexity-side policy change, not a SlideHeroes code issue

The only uncertainty is the specific cutoff date, which Perplexity does not disclose in the error message. However, the existence and enforcement of the policy is certain.

## Fix Approach (High-Level)

**Immediate fix** (1-2 minutes):
1. Navigate to https://www.perplexity.ai/account/api/keys
2. Generate a new API key (created after Perplexity's cutoff date)
3. Update `PERPLEXITY_API_KEY` in `.ai/.env` with the new key
4. Test both Search and Chat APIs to verify functionality

**Long-term considerations**:
- Document the API key cutoff policy in `.ai/tools/perplexity/README.md` and `INSTALL.md`
- Add proactive detection in `utils.py` to catch 451 errors and provide clearer user guidance
- Consider adding API key creation date validation if Perplexity provides an endpoint to check key metadata
- Update `.ai/ai_docs/tool-docs/perplexity-api-integration.md` with troubleshooting guidance for this error

**No code changes required** - this is purely a configuration update (API key rotation).

## Diagnosis Determination

**ROOT CAUSE CONCLUSIVELY IDENTIFIED**: Perplexity's Search API enforces an API key creation date cutoff policy. The current API key was created before this cutoff and is therefore rejected by the Search endpoint (HTTP 451, error type `api_key_created_before_search_api_cutoff`), while remaining valid for the Chat Completions endpoint.

**Resolution**: Generate a new API key from https://www.perplexity.ai/account/api/keys and update `.ai/.env` configuration.

**Impact**:
- **CRITICAL** for search-dependent workflows (perplexity-search-expert agent)
- **NO IMPACT** on Chat API functionality
- **BLOCKS**: Domain/time-filtered research, ranked search results, search-based research automation

## Additional Context

### API Key Configuration Location
The API key is configured in `.ai/.env` (not committed to git) based on the template in `.ai/.env.sample:10`:
```
PERPLEXITY_API_KEY=your-perplexity-api-key-here
```

### Environment File Status
Current state:
- `.ai/.env.sample` exists (template with placeholder)
- `.ai/.env` may or may not exist (depends on manual setup)
- No `.gitignore` rule needed (`.ai/.env` already excluded from git)

### Testing Commands Used
```bash
# Reproduced Search API failure
cd .ai && uv run -m tools.perplexity.cli_search "test query"

# Verified Chat API success
cd .ai && uv run -m tools.perplexity.cli_chat "test query"
```

### Documentation References
- Integration guide: `.ai/ai_docs/tool-docs/perplexity-api-integration.md`
- Installation instructions: `.ai/tools/perplexity/INSTALL.md`
- Feature implementation: `.ai/specs/perplexity-api-integration.md`
- Agent configuration: `.claude/agents/research/perplexity-search-expert.md`

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (git log, gh issue search, version checks, API testing), Read (README, INSTALL, utils.py, agent config), Grep (PERPLEXITY_API_KEY search), Glob (env files, perplexity files)*
