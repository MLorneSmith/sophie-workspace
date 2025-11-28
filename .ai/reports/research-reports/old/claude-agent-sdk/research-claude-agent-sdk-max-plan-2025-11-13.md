# Research Report: Claude Agent SDK with Claude Code Max Plan

**Date**: 2025-11-13
**Objective**: Determine if Claude Agent SDK can be used with Claude Code Max plan to make API calls from hooks without requiring separate API keys.

---

## Executive Summary

**Short Answer: NO** - The Claude Agent SDK **cannot** leverage Claude Code Max plan credentials. It requires a separate Anthropic API key, which will incur API usage charges distinct from your Max plan subscription.

**Key Findings**:
1. Claude Agent SDK always requires an `ANTHROPIC_API_KEY` (or third-party provider credentials)
2. Claude Code Max plan uses subscription-based authentication, not API keys
3. Hooks cannot access Claude Code session credentials
4. Setting `ANTHROPIC_API_KEY` causes Claude Code to switch from subscription billing to API billing
5. Current implementation in `.claude/hooks/utils/llm/anth.py` requires a separate API key

---

## Detailed Findings

### 1. What is the Claude Agent SDK?

The **Claude Agent SDK** (formerly Claude Code SDK) is a developer toolkit that enables building production-ready AI agents. Key features include:

- **Context Management**: Automatic compaction to prevent context overflow
- **Rich Tool Ecosystem**: File operations, code execution, web search, MCP extensibility
- **Advanced Permissions**: Fine-grained control over agent capabilities
- **Production Essentials**: Built-in error handling, session management, monitoring

**Availability**: Available to all developers via:
- Python: `pip install claude-agent-sdk` (requires Python 3.10+)
- TypeScript/Node: `npm install @anthropic-ai/claude-agent-sdk`

**Official Documentation**: https://docs.claude.com/en/docs/agent-sdk/overview

### 2. Authentication Requirements

The Claude Agent SDK supports **three authentication methods**:

#### Primary Method: Anthropic API Key
```bash
export ANTHROPIC_API_KEY='your-api-key-here'
```
- Obtained from: https://console.anthropic.com/
- Requires Console account with API credits
- Billed at standard API rates (pay-as-you-go)

#### Alternative Provider #1: Amazon Bedrock
```bash
export CLAUDE_CODE_USE_BEDROCK=1
# Plus AWS credentials
```

#### Alternative Provider #2: Google Vertex AI
```bash
export CLAUDE_CODE_USE_VERTEX=1
# Plus Google Cloud credentials
```

**Critical Finding**: The SDK documentation does **not mention** using Claude Code session credentials or subscription-based authentication. This indicates the SDK operates independently from Claude Code subscriptions.

### 3. Claude Code Max Plan API Access

#### How Max Plan Authentication Works

Claude Code Max plan uses **subscription-based authentication**:
- Users log in with Claude.ai credentials during setup
- Authentication managed via encrypted macOS Keychain (on macOS)
- No API key required for normal Claude Code usage

#### Max Plan Tiers & Usage Limits

**Max 5x ($100/month)**:
- ~225 messages per 5-hour window
- OR ~50-200 prompts with Claude Code per 5-hour window

**Max 20x ($200/month)**:
- ~900 messages per 5-hour window
- OR ~200-800 prompts with Claude Code per 5-hour window
- Expected: 240-480 hours of Sonnet 4 or 24-40 hours of Opus 4 weekly

#### The Critical Distinction

From official documentation:

> "If you have an ANTHROPIC_API_KEY environment variable set on your system, Claude Code will use this API key for authentication instead of your Claude.ai subscription (Pro, Max, Team, or Enterprise plans), **resulting in API usage charges** rather than using your subscription's included usage."

**This means**:
- Max plan subscription ≠ API access
- Setting `ANTHROPIC_API_KEY` switches Claude Code from subscription billing to API billing
- API charges are **separate** from Max plan pricing
- You effectively pay twice: once for Max subscription, once for API usage

### 4. Can Hooks Access Claude Code Session Credentials?

**Answer: NO**

#### Available Environment Variables in Hooks

Hooks have access to:

**Common variables**:
- `CLAUDE_PROJECT_DIR`: Absolute path to project root
- `CLAUDE_CODE_REMOTE`: Set to "true" in web environments
- Standard system environment variables

**SessionStart-specific**:
- `CLAUDE_ENV_FILE`: File path for persisting environment variables

**Session metadata** (via stdin JSON):
- `session_id`: Session identifier
- `transcript_path`: Conversation history path
- `cwd`: Current working directory
- `permission_mode`: Current permission setting

#### Security Isolation

From official hooks documentation:

> "Claude Code hooks execute arbitrary shell commands on your system automatically."

For security reasons, hooks do **not** receive:
- Claude Code session credentials
- Stored API keys from Keychain
- OAuth tokens
- Subscription authentication details

This isolation prevents malicious hooks from accessing sensitive credentials.

#### Environment Variable Priority

If you set `ANTHROPIC_API_KEY` as a system environment variable:
1. Claude Code **itself** will switch to API billing
2. Hooks **can** access this environment variable via `os.getenv("ANTHROPIC_API_KEY")`
3. But this defeats the purpose of using Max plan subscription

### 5. Current Implementation Analysis

**File**: `.claude/hooks/utils/llm/anth.py`

```python
def prompt_llm(prompt_text):
    load_dotenv()

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return None  # Fails silently

    client = anthropic.Anthropic(api_key=api_key)
    # ... makes API calls
```

**Current Behavior**:
- Requires `ANTHROPIC_API_KEY` in environment or `.env` file
- Returns `None` if API key not found (silent failure)
- Uses Anthropic Python SDK (not Claude Agent SDK)
- Makes direct API calls to `claude-3-5-haiku-20241022`

**Implications**:
- If `ANTHROPIC_API_KEY` is set:
  - Hook calls work ✓
  - But Claude Code switches to API billing ✗
  - You pay API rates on top of Max subscription ✗
- If `ANTHROPIC_API_KEY` is NOT set:
  - Hook calls fail silently ✗
  - Claude Code uses Max plan subscription ✓

---

## Recommendations

### Option 1: Keep Separate API Key (Current Approach)

**Pros**:
- Works reliably
- Clear separation of concerns
- Hook usage doesn't affect Max plan limits

**Cons**:
- Requires separate Console account with API credits
- Additional cost beyond Max subscription
- Manual credential management

**Cost Example**:
- Claude 3.5 Haiku (used in hooks): $0.25 per million input tokens
- 100-token prompt = $0.000025 per call
- 1,000 hook calls = $0.025
- Very inexpensive for hook usage

**Implementation**:
```bash
# Set API key ONLY for specific hook execution
ANTHROPIC_API_KEY='your-key' .claude/hooks/utils/llm/anth.py --completion

# Or in .env file (not committed to git)
ANTHROPIC_API_KEY=your-key-here
```

### Option 2: Remove Hook API Calls

**Pros**:
- No additional API costs
- Simpler credential management
- Fully leverages Max plan subscription

**Cons**:
- Lose dynamic completion message feature
- Any LLM-enhanced hook features unavailable

**Implementation**:
- Replace `anth.py` calls with static messages
- Use random selection from predefined messages
- Remove Anthropic dependency from hooks

**Example**:
```python
import random

def generate_completion_message():
    messages = [
        "Work complete!",
        "All done!",
        "Task finished!",
        "Ready for your next move!"
    ]
    return random.choice(messages)
```

### Option 3: Conditional API Usage

**Pros**:
- Works with or without API key
- Graceful degradation
- Flexibility for different environments

**Cons**:
- More complex logic
- Silent API key failures might confuse users

**Implementation**:
```python
def generate_completion_message():
    # Try API call if key available
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if api_key:
        try:
            return prompt_llm_with_api(api_key)
        except Exception:
            pass  # Fall through to static

    # Fallback to static messages
    return random.choice(STATIC_MESSAGES)
```

### Option 4: Use apiKeyHelper (Advanced)

Claude Code supports `apiKeyHelper` setting that runs a shell script to retrieve API keys dynamically. This could:
- Fetch temporary API keys from a credential management service
- Rotate keys automatically
- Track usage per hook

**Pros**:
- Centralized credential management
- Automatic key rotation
- Usage tracking possible

**Cons**:
- Complex setup
- Still requires API credits
- Overkill for simple hook usage

---

## Answers to Research Questions

### Q1: What is the Claude Agent SDK and how does it work?

The Claude Agent SDK is a developer toolkit for building production AI agents. It provides context management, tool integration, permissions, and monitoring capabilities. It works by wrapping the Anthropic Messages API with additional agent-specific features like automatic context compaction and rich tool ecosystem.

### Q2: Can Claude Agent SDK be used from within Claude Code hooks?

**Technically yes**, but it requires setting `ANTHROPIC_API_KEY`, which causes Claude Code to switch from subscription billing to API billing. This defeats the purpose of using Max plan subscription.

### Q3: Does Claude Code Max plan provide API access that can be used by the Agent SDK?

**No**. Max plan provides subscription-based access to Claude Code only. API access requires separate Console account and API credits. The two authentication systems are completely separate.

### Q4: Is there a way to use Claude Code session credentials for API calls from hooks?

**No**. For security reasons, hooks do not have access to Claude Code session credentials. Hooks can only access:
- Standard environment variables
- Variables set in `CLAUDE_ENV_FILE`
- Session metadata passed via stdin
- No keychain or OAuth tokens

### Q5: Does the current `.claude/hooks/utils/llm/anth.py` implementation work with Claude Code Max?

**Not directly**. It requires:
- Setting `ANTHROPIC_API_KEY` environment variable
- Which causes Claude Code to switch to API billing
- Meaning you pay API rates on top of Max subscription

**Alternative**: Use separate API key exclusively for hooks (don't set it globally), but this still requires Console account with API credits.

---

## Cost Analysis

### Scenario 1: Using Max Plan + Separate API Key for Hooks

**Monthly Costs**:
- Max 20x subscription: $200/month
- Hook API calls (Claude 3.5 Haiku):
  - 1,000 calls/month × 100 tokens avg = 100,000 tokens
  - Input: $0.25 per million tokens = $0.025
  - Output: $1.25 per million tokens = $0.125
  - Total hook costs: ~$0.15/month

**Total**: ~$200.15/month

### Scenario 2: Setting ANTHROPIC_API_KEY Globally

**Monthly Costs**:
- Max 20x subscription: $200/month (unused for Claude Code)
- API usage for Claude Code: Variable, potentially $200-500+/month
- Hook API calls: ~$0.15/month

**Total**: $400-700+/month (paying twice!)

### Scenario 3: No API Key (Static Messages)

**Monthly Costs**:
- Max 20x subscription: $200/month
- Hook API calls: $0

**Total**: $200/month

---

## Technical Limitations

### Why Can't Hooks Access Session Credentials?

1. **Security**: Hooks execute arbitrary shell commands. Exposing credentials would be a major security vulnerability.

2. **Isolation**: Different authentication methods:
   - Claude Code: OAuth-based subscription auth
   - Agent SDK: API key-based programmatic access
   - No bridge between the two systems

3. **Billing Separation**: Anthropic maintains strict separation between:
   - Consumer subscriptions (Pro/Max)
   - Developer API usage (Console/API)
   - Different pricing models require separate billing

### Why Doesn't Agent SDK Support Subscription Auth?

The Claude Agent SDK is designed for **programmatic access** to build autonomous agents. Subscription authentication is designed for **interactive use** of Claude Code. These are fundamentally different use cases with different:
- Authentication flows (OAuth vs API keys)
- Rate limiting mechanisms
- Billing models
- Security requirements

---

## Conclusion

**The Claude Agent SDK cannot leverage Claude Code Max plan credentials.** The two systems use completely separate authentication mechanisms:

- **Max Plan**: Subscription-based OAuth authentication for interactive Claude Code usage
- **Agent SDK**: API key-based authentication for programmatic agent development

**For your use case** (`.claude/hooks/utils/llm/anth.py`):

**Best Option**: Keep the current approach with a separate API key specifically for hooks
- Cost is negligible (~$0.15/month for hook usage)
- Maintains clean separation between interactive and programmatic usage
- Avoids accidentally switching Claude Code to API billing

**Alternative**: Replace LLM calls with static messages
- Zero additional cost
- Simpler implementation
- Loss of dynamic generation features

**Do NOT**: Set `ANTHROPIC_API_KEY` as a global environment variable
- Causes Claude Code to switch to API billing
- Results in paying twice (subscription + API)
- Can lead to unexpected costs of $200-500+/month

---

## References

1. [Claude Agent SDK Documentation](https://docs.claude.com/en/docs/agent-sdk/overview)
2. [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks)
3. [Using Claude Code with Pro/Max Plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
4. [Managing API Key Environment Variables](https://support.claude.com/en/articles/12304248-managing-api-key-environment-variables-in-claude-code)
5. [GitHub Issue #5891: SDK Documentation Inconsistency](https://github.com/anthropics/claude-code/issues/5891)

---

## Next Steps

1. **Decision**: Choose between separate API key or static messages
2. **If API key**: Create Console account and obtain API key for hooks only
3. **If static**: Update `anth.py` to use random message selection
4. **Documentation**: Update hook documentation with chosen approach
5. **Testing**: Verify hook behavior in both scenarios

---

**Report prepared by**: Claude Code (Research Agent)
**Reviewed context**: `.claude/hooks/utils/llm/anth.py`
**Full report saved to**: `/reports/research/claude-agent-sdk/research-claude-agent-sdk-max-plan-2025-11-13.md`
