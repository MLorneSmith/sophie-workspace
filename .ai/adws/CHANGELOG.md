# ADWS Changelog

## 2025-11-13 - Claude Code Max Plan Integration

### Summary

Updated ADWS to support Claude Code Max plan authentication as the primary authentication method, with API key as fallback.

### Changes Made

#### 1. Enhanced Authentication (agent.py)

**New Function: `check_claude_auth()`**

- Detects available authentication methods
- Returns tuple: (has_auth: bool, auth_type: Optional[str])
- Checks for API key first, then Claude session
- Validates session by checking ~/.claude/session.json

**Updated Function: `get_claude_env()`**

- Now supports dual authentication modes
- Prioritizes Claude Code session (Max plan)
- Falls back to API key if no session found
- Displays authentication type when running
- Improved error messaging

**Key Features:**

```python
has_auth, auth_type = check_claude_auth()
# Returns:
#   (True, "session")  - Using Claude Max plan
#   (True, "api_key")  - Using Anthropic API key
#   (False, None)      - No authentication found
```

#### 2. Updated Documentation (README.md)

**New Sections:**

- Authentication Options (summary at top)
- Choose Authentication Method (Quick Start)
- Authentication (detailed configuration guide)
- test_auth.py script documentation

**Improved Content:**

- Clear comparison of Max plan vs API key
- Step-by-step setup for both methods
- Cost analysis and recommendations
- Troubleshooting guide
- Authentication testing instructions

#### 3. New Testing Tool (test_auth.py)

**Features:**

- Verifies authentication configuration
- Displays active authentication method
- Shows environment variables (with sensitive data masked)
- Provides actionable next steps
- Easy to run: `uv run test_auth.py`

**Output Example:**

```text
============================================================
ADWS Authentication Test
============================================================

✅ Authentication found: session
   Using Claude Max plan session authentication

------------------------------------------------------------
Environment Configuration
------------------------------------------------------------
  HOME: /home/user
  CLAUDE_CODE_PATH: claude
  ANTHROPIC_API_KEY: (not set)
  ...
```

### Benefits

#### For Claude Max Users

- Seamless integration with Max subscription
- No need to manage API keys
- Usage tracked in Claude dashboard
- Shared limits across web/mobile/CLI
- More cost-effective for high-volume usage

#### For API Key Users

- Backward compatible - no breaking changes
- Pay-as-you-go pricing maintained
- Automatic fallback if session not found
- Better for sporadic usage

### Migration Guide

#### Switching from API Key to Max Plan

1. **Subscribe to Claude Max**

   ```bash
   # Visit https://claude.ai/settings/billing
   # Subscribe to Max 5x or Max 10x
   ```

2. **Authenticate Claude Code**

   ```bash
   claude  # Follow login prompts
   ```

3. **Remove API Key (Optional)**

   ```bash
   # In your .env or shell profile, remove:
   # export ANTHROPIC_API_KEY="..."
   unset ANTHROPIC_API_KEY
   ```

4. **Verify Setup**

   ```bash
   uv run test_auth.py
   # Should show: ✅ Authentication found: session
   ```

5. **Test ADWS**

   ```bash
   uv run adw_plan_build.py <issue_number>
   ```

### Technical Details

#### Authentication Flow

1. Check for `ANTHROPIC_API_KEY` environment variable
2. If found and valid (starts with "sk-ant-"), use API key
3. Otherwise, check for Claude session in `~/.claude/session.json`
4. If session exists and `claude --version` succeeds, use session
5. If neither found, display helpful error message

#### Environment Variables

- **Required for session auth**: HOME, PATH, CLAUDE_CODE_PATH
- **Required for API key auth**: Same + ANTHROPIC_API_KEY
- **Optional**: GITHUB_PAT, E2B_API_KEY

#### Backward Compatibility

- Existing API key setups continue to work
- No code changes required for current users
- ADWS automatically detects authentication method
- Clear messaging about which method is active

### Testing

All changes tested with:

- ✅ API key authentication (existing method)
- ✅ Authentication detection and reporting
- ✅ Environment variable configuration
- ✅ Test script execution
- ⏳ Session authentication (requires Claude Max subscription to fully test)

### Files Modified

- `.ai/adws/agent.py` - Enhanced authentication support
- `.ai/adws/README.md` - Updated documentation
- `.ai/adws/test_auth.py` - New testing utility (created)
- `.ai/adws/CHANGELOG.md` - This file (created)

### Next Steps for Users

1. **Current API Key Users**: No action required, everything works as before
2. **Want to use Max Plan**: Follow migration guide above
3. **New Users**: Choose authentication method in Quick Start guide
4. **Having Issues**: Run `uv run test_auth.py` for diagnostics

### References

- [Claude Code Max Plan Pricing](https://claude.ai/settings/billing)
- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [ADWS README](README.md)
- [Research Report](../../reports/research/claude-agent-sdk/research-claude-max-sdk-adws-2025-11-13.md)
