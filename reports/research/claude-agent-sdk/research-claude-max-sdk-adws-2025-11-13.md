# Claude Code Max Plan + Agent SDK for ADWS Integration

**Research Date:** 2025-11-13
**Subject:** Using Claude Code Max plan with Claude Agent SDK for AI Developer Workflow System (ADWS)
**Status:** Complete with actionable implementation path

## Executive Summary

The ADWS system currently uses **Claude Code CLI** (not SDK) with **ANTHROPIC_API_KEY** authentication. To use a Claude Max plan subscription programmatically:

1. **Official Path:** Claude Agent SDK requires API key authentication and does NOT support Max plan subscriptions
2. **Community Workaround:** Remove `ANTHROPIC_API_KEY` from environment to force subscription fallback
3. **Current ADWS Status:** Already using CLI correctly; just needs authentication method change

**Recommendation:** Switch ADWS from API key to Max subscription authentication using environment variable modification.

---

## 1. Authentication & Setup

### Current ADWS Implementation

Your ADWS system (`/home/msmith/projects/2025slideheroes/.ai/adws/`) currently:
- Uses **Claude Code CLI** (`claude` command) - ✅ Correct approach
- Authenticates via `ANTHROPIC_API_KEY` environment variable
- Calls CLI with `--output-format stream-json` for programmatic usage
- Does NOT use the Python/TypeScript SDK libraries

### Authentication Methods Comparison

| Method | Works With | Billing | ADWS Compatible |
|--------|-----------|---------|-----------------|
| **ANTHROPIC_API_KEY** | API credits | Pay-per-token | ✅ Currently used |
| **Claude Max Subscription** | CLI only | $100-200/month flat | ✅ Recommended |
| **CLAUDE_CODE_OAUTH_TOKEN** | CLI (limited) | Subscription | ⚠️ Requires approval |
| **SDK Libraries** | API only | Pay-per-token | ❌ Not applicable |

### How to Switch to Max Plan Authentication

**Official Documentation:**
- "If you have an ANTHROPIC_API_KEY environment variable set on your system, Claude Code will use this API key for authentication instead of your Claude subscription (Pro, Max, Team, or Enterprise plans)"

**Implementation for ADWS:**

Current code in `agent.py` line 105:
```python
required_env_vars = {
    "ANTHROPIC_API_KEY": os.getenv("ANTHROPIC_API_KEY"),
    # ...
}
```

**Option 1: Simple Environment Change (Recommended)**
```bash
# In your .env or shell environment
# Remove/comment out:
# ANTHROPIC_API_KEY="sk-ant-xxx..."

# Authenticate Claude Code once:
claude  # Follow interactive login with Max credentials
```

**Option 2: Programmatic Workaround (Advanced)**

Based on community research (claude_max implementation):
```python
def get_claude_env() -> Dict[str, str]:
    """Force Claude Code to use subscription instead of API key."""
    env = {
        "CLAUDE_USE_SUBSCRIPTION": "true",  # Force subscription mode
        # Explicitly omit ANTHROPIC_API_KEY
        "HOME": os.getenv("HOME"),
        "USER": os.getenv("USER"),
        "PATH": os.getenv("PATH"),
        # ... other required vars
    }
    return env
```

**Option 3: OAuth Token (Requires Prior Approval)**
```bash
# Generate long-lived token
claude setup-token

# Export in environment
export CLAUDE_CODE_OAUTH_TOKEN="sk-ant-oat01-..."
```

**⚠️ Important:** Option 3 requires prior approval from Anthropic. Most users should use Option 1 or 2.

---

## 2. Feature Access

### Max Plan Features (November 2025)

**Subscription Tiers:**
- **Max 5x:** $100/month
  - 140-280 hours of Sonnet 4 per week
  - 15-35 hours of Opus 4 per week
- **Max 10x:** $200/month
  - 20x higher limits than Pro
  - Priority access to new features

**Claude Code Capabilities (All Max Plans):**
- ✅ Full CLI access with `claude` command
- ✅ Subagents for parallel task execution
- ✅ Hooks (pre/post tool execution)
- ✅ Slash commands
- ✅ MCP server integrations
- ✅ Skills and plugins
- ✅ Memory capabilities (November 2025 update)

**Additional Tool Costs (Separate from Subscription):**
- Code execution: $0.05 per session-hour
- Web search: $10 per 1,000 searches
- Token costs still apply

### Rate Limits

**Rolling 5-Hour Windows:**
- Max 5x: ~225 Claude messages OR ~50-200 Claude Code prompts per window
- Shared across web, desktop, mobile, and CLI

**Weekly Limits (Added August 2025):**
- Additional weekly caps can be applied
- Resets Sunday midnight PST
- Can trigger automatic model switching (Opus → Sonnet)

**Override Model Limits:**
```bash
/model opus  # Force Opus (consumes ~5x faster than Sonnet)
/model sonnet  # Switch back to Sonnet
```

### Subagent Capabilities

**What ADWS Can Leverage:**

1. **Parallel Execution:**
```bash
# In ADWS workflow, could run simultaneously:
claude -p "/classify_issue #123"
claude -p "/generate_branch_name feat-add-auth"
```

2. **Context Isolation:**
- Each subagent maintains separate context
- Prevents token exhaustion on large codebases

3. **Tool Inheritance:**
- Subagents inherit all MCP tools by default
- Can restrict with tool lists in agent config

**Current ADWS Usage:**
Your system already uses sequential agent execution:
1. `sdlc_planner` agent → creates plan
2. `sdlc_implementor` agent → executes plan

This could be parallelized for multiple issues.

---

## 3. SDK Integration Best Practices

### Critical Distinction: CLI vs SDK

**ADWS Currently Uses:** ✅ **Claude Code CLI** (correct)
```python
# From agent.py line 188
cmd = [CLAUDE_PATH, "-p", request.prompt]
result = subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE)
```

**What You DON'T Need:** ❌ **Claude Agent SDK Libraries**
```python
# NOT needed for ADWS:
from claude_agent_sdk import query, ClaudeAgentOptions
```

### Why This Matters

| Aspect | CLI (Your Approach) | SDK Libraries |
|--------|-------------------|---------------|
| **Installation** | `npm install -g @anthropic-ai/claude-code` | `pip install claude-agent-sdk` |
| **Authentication** | Subscription OR API key | API key only |
| **Billing** | Can use Max plan | Always API credits |
| **Features** | Full Claude Code features | Subset of capabilities |
| **Max Plan Support** | ✅ Yes | ❌ No |

**Conclusion:** ADWS architecture is already correct. You're using CLI, not SDK.

### Configuration Requirements

**CLAUDE.md File:**
- Located at project root: `/home/msmith/projects/2025slideheroes/CLAUDE.md`
- Already exists in your codebase ✅
- Defines project context, constraints, and instructions

**.claude/settings.json:**
- Located at: `/home/msmith/projects/2025slideheroes/.claude/settings.json`
- Already exists (1.9k file) ✅
- Configures hooks, permissions, MCP servers

**Your ADWS Setup:**
```
2025slideheroes/
├── CLAUDE.md                    ✅ Project instructions
├── .claude/
│   ├── settings.json            ✅ Configuration
│   ├── agents/                  ✅ Subagent definitions
│   └── commands/                ✅ Slash commands
└── .ai/adws/                    ✅ Your workflow system
    ├── agent.py                 ✅ CLI integration
    ├── adw_plan_build.py        ✅ Main orchestration
    └── README.md                ✅ Documentation
```

**No additional configuration needed** - your setup is complete.

### Standalone vs Claude Code Running

**IMPORTANT:** Claude Agent SDK **requires** Claude Code CLI installed:

```bash
# SDK dependency check from official docs:
# "If you encounter a CLINotFoundError, make sure you have
#  installed the CLI and that Claude is included in your PATH"
```

**Your ADWS Implementation:**
```python
# agent.py line 24-34
def check_claude_installed() -> Optional[str]:
    """Check if Claude Code CLI is installed."""
    try:
        result = subprocess.run(
            [CLAUDE_PATH, "--version"], capture_output=True, text=True
        )
        if result.returncode != 0:
            return f"Error: Claude Code CLI is not installed..."
```

✅ Already handles this correctly.

**Does Claude Code need to be running?**
- **No** - CLI is invoked on-demand
- Each `subprocess.run()` call starts a new Claude session
- No background daemon required

---

## 4. Billing & Usage

### Cost Comparison: API vs Max Plan

**Current ADWS (API Key):**
- Sonnet 4.5: $3 per million input tokens, $15 per million output tokens
- Opus 4: $15 per million input tokens, $75 per million output tokens
- Example: 100 issues × 50k tokens avg = $15-75 depending on model

**Switching to Max Plan:**
- **Max 5x ($100/month):** Fixed cost, ~50-200 Claude Code prompts per 5-hour window
- **Max 10x ($200/month):** 20x limits, better for high-volume automation

**Break-Even Analysis:**
- If processing >20 issues/day: Max plan likely cheaper
- If sporadic usage (<10 issues/week): API key more cost-effective

### How Usage is Tracked

**With Max Subscription:**
- Tracked by "Claude Code prompts" (each `claude -p` invocation)
- Counts against 5-hour rolling window
- Weekly limits also apply
- Shared with interactive Claude usage

**With API Key:**
- Tracked by input/output tokens
- Billed at standard API rates
- Separate from any Claude.ai subscription
- No usage windows or resets

**ADWS Tracking:**
```python
# From data_types.py line 132-144
class ClaudeCodeResultMessage(BaseModel):
    """Claude Code JSONL result message (last line)."""
    duration_ms: int
    duration_api_ms: int
    num_turns: int
    total_cost_usd: float  # Only populated with API key
```

When using Max subscription, `total_cost_usd` will be 0.

### SDK Usage and Max Plan Limits

**Critical Finding:**
- Max plan limits apply to **Claude Code CLI usage only**
- If you use SDK libraries with API key: **billed separately** at API rates
- ADWS uses CLI: ✅ Would count toward Max limits

**From Official Documentation:**
> "Usage limits reset every five hours and are shared across Claude and Claude Code, meaning all activity in both tools counts against the same usage limits."

**Example ADWS Workflow:**
```bash
# Each of these counts as ONE Claude Code prompt:
claude -p "/classify_issue #123"     # Prompt 1
claude -p "/feature add-auth"         # Prompt 2
claude -p "/implement"                # Prompt 3

# With Max 5x: Can do ~50-200 of these per 5-hour window
# With API key: Unlimited (but pay per token)
```

### Monitoring Usage

**Check Current Usage:**
```bash
# No official CLI command for this yet
# Must check via Claude web interface:
# https://claude.ai → Settings → Usage
```

**ADWS Session Tracking:**
```python
# From agent.py line 202-213
if result_message:
    session_id = result_message.get("session_id")
    is_error = result_message.get("is_error", False)
    result_text = result_message.get("result", "")
```

Each session ID can be used to track individual invocations.

---

## 5. Documentation & Examples

### Official Documentation Links

**Core Documentation:**
- Agent SDK Overview: https://docs.claude.com/en/docs/agent-sdk/overview
- Claude Code IAM: https://code.claude.com/docs/en/iam
- Subagents Guide: https://docs.claude.com/en/docs/claude-code/sub-agents
- API Rate Limits: https://docs.claude.com/en/api/rate-limits

**GitHub Repositories:**
- Python SDK: https://github.com/anthropics/claude-agent-sdk-python
- TypeScript SDK: https://github.com/anthropics/claude-agent-sdk-typescript
- Claude Code Issues: https://github.com/anthropics/claude-code/issues

**Official Blog Posts:**
- Building Agents with SDK: https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk
- Max Plan Announcement: https://www.anthropic.com/news/max-plan
- Sonnet 4.5 Release: https://www.anthropic.com/news/claude-sonnet-4-5

### Community Resources

**Max Plan Workarounds:**
- claude_max Implementation: https://idsc2025.substack.com/p/how-i-built-claude_max-to-unlock
  - Key insight: Remove `ANTHROPIC_API_KEY` to force subscription auth
  - Adds ~17ms overhead per request
  - Enables programmatic Max subscription usage

**Practical Guides:**
- Python SDK Guide 2025: https://www.eesel.ai/blog/python-claude-code-sdk
- DataCamp Tutorial: https://www.datacamp.com/tutorial/how-to-use-claude-agent-sdk
- Subagent Best Practices: https://www.pubnub.com/blog/best-practices-for-claude-code-sub-agents/

### Example Implementation for ADWS

**Current ADWS Architecture (No Changes Needed):**

```python
# agent.py - Already correct implementation
def prompt_claude_code(request: AgentPromptRequest) -> AgentPromptResponse:
    """Execute Claude Code with the given prompt configuration."""

    # Build command - uses CLI
    cmd = [CLAUDE_PATH, "-p", request.prompt]
    cmd.extend(["--model", request.model])
    cmd.extend(["--output-format", "stream-json"])

    # Set up environment
    env = get_claude_env()

    # Execute Claude Code
    with open(request.output_file, "w") as f:
        result = subprocess.run(
            cmd, stdout=f, stderr=subprocess.PIPE, text=True, env=env
        )
```

**To Use Max Subscription Instead of API Key:**

**Option 1: Environment Variable (Simple)**
```bash
# In .env file or shell:
unset ANTHROPIC_API_KEY

# Authenticate Claude once:
claude
# Follow prompts to login with Max credentials
```

**Option 2: Code Modification (Programmatic)**
```python
# agent.py - Modified get_claude_env()
def get_claude_env() -> Dict[str, str]:
    """Get environment variables for Claude Code execution."""

    # OPTION A: Use subscription (Max plan)
    env = {
        "CLAUDE_USE_SUBSCRIPTION": "true",
        # Omit ANTHROPIC_API_KEY to force subscription
        "HOME": os.getenv("HOME"),
        "USER": os.getenv("USER"),
        "PATH": os.getenv("PATH"),
    }

    # OPTION B: Use API key (pay-per-use)
    # env = {
    #     "ANTHROPIC_API_KEY": os.getenv("ANTHROPIC_API_KEY"),
    #     ...
    # }

    return {k: v for k, v in env.items() if v is not None}
```

**Option 3: Dynamic Selection (Flexible)**
```python
def get_claude_env(use_subscription: bool = None) -> Dict[str, str]:
    """Get environment variables with configurable auth method."""

    # Check environment variable for override
    if use_subscription is None:
        use_subscription = os.getenv("ADWS_USE_MAX_SUBSCRIPTION", "false").lower() == "true"

    if use_subscription:
        # Force subscription authentication
        env = {
            "CLAUDE_USE_SUBSCRIPTION": "true",
            "HOME": os.getenv("HOME"),
            "USER": os.getenv("USER"),
            "PATH": os.getenv("PATH"),
        }
    else:
        # Use API key authentication
        env = {
            "ANTHROPIC_API_KEY": os.getenv("ANTHROPIC_API_KEY"),
            "HOME": os.getenv("HOME"),
            "USER": os.getenv("USER"),
            "PATH": os.getenv("PATH"),
        }

    # Filter out None values
    return {k: v for k, v in env.items() if v is not None}
```

Then in your environment:
```bash
export ADWS_USE_MAX_SUBSCRIPTION=true
```

---

## Implementation Recommendations

### For Your ADWS System

**Immediate Actions:**

1. **Verify Current Setup:**
```bash
cd /home/msmith/projects/2025slideheroes/.ai/adws
claude --version  # Should show version 2.0.0+
```

2. **Authenticate with Max Plan:**
```bash
# Remove API key from environment
unset ANTHROPIC_API_KEY

# Login with Max credentials
claude
# Follow interactive prompts
```

3. **Test ADWS with Subscription:**
```bash
# Process a test issue
uv run adw_plan_build.py 123
# Should work with Max subscription instead of API key
```

4. **Monitor Usage:**
- Track sessions via `session_id` in JSONL output
- Check Claude web interface for usage metrics
- Compare costs vs API key billing

**Long-Term Improvements:**

1. **Add Authentication Mode Toggle:**
```python
# In agent.py or config file
ADWS_AUTH_MODE = os.getenv("ADWS_AUTH_MODE", "api_key")  # or "subscription"
```

2. **Implement Usage Tracking:**
```python
# Track prompts per 5-hour window
# Warn when approaching limits
# Fallback to API key if subscription exhausted
```

3. **Optimize for Max Plan:**
```python
# Batch multiple issues when possible
# Use Sonnet instead of Opus for routine tasks
# Implement prompt caching for repeated contexts
```

### Migration Path: API Key → Max Subscription

**Phase 1: Testing (1 week)**
- [ ] Subscribe to Max 5x ($100/month)
- [ ] Authenticate Claude CLI with Max credentials
- [ ] Test ADWS with 5-10 issues
- [ ] Monitor usage and limits
- [ ] Compare costs vs API key

**Phase 2: Gradual Migration (2 weeks)**
- [ ] Modify `get_claude_env()` to support both modes
- [ ] Add `ADWS_USE_MAX_SUBSCRIPTION` toggle
- [ ] Run 50% of issues on Max, 50% on API
- [ ] Analyze usage patterns and costs

**Phase 3: Full Migration (Ongoing)**
- [ ] Default to Max subscription
- [ ] Keep API key as fallback
- [ ] Implement usage monitoring
- [ ] Upgrade to Max 10x if needed

**Rollback Plan:**
- Keep `ANTHROPIC_API_KEY` in secure storage
- Revert `get_claude_env()` to include API key
- No code changes required

---

## Summary & Key Takeaways

### What You Have
✅ ADWS correctly uses Claude Code CLI (not SDK libraries)
✅ Current implementation with API key works perfectly
✅ Architecture supports both API key and subscription auth
✅ All configuration files (CLAUDE.md, .claude/settings.json) in place

### What You Need
1. **Claude Max Subscription** ($100-200/month)
2. **Authentication Change** (remove `ANTHROPIC_API_KEY` or modify code)
3. **Usage Monitoring** (track prompts per 5-hour window)

### Critical Clarifications
❌ **You DON'T need** the Claude Agent SDK Python/TypeScript libraries
❌ **Max plan doesn't work** with SDK libraries (API key only)
✅ **You DO have** the correct setup (CLI-based)
✅ **You CAN use** Max subscription with simple env changes

### Decision Matrix

**Use API Key When:**
- Processing <10 issues per week
- Sporadic, unpredictable usage
- Need strict cost control per-request
- Don't want usage limits/windows

**Use Max Subscription When:**
- Processing >20 issues per day
- Consistent, high-volume automation
- Want fixed monthly costs
- Can work within 5-hour usage windows

**Your Current Situation:**
Based on ADWS being an "AI Developer Workflow System," likely high-volume and consistent → **Max subscription recommended**.

### Next Steps

1. **Subscribe:** Get Max 5x or 10x plan
2. **Authenticate:** `claude` login with Max credentials
3. **Test:** Remove `ANTHROPIC_API_KEY`, run ADWS
4. **Monitor:** Track usage for 1-2 weeks
5. **Optimize:** Adjust based on actual usage patterns

### Questions Answered

| Question | Answer |
|----------|--------|
| How to authenticate SDK with Max plan? | Max plan uses CLI, not SDK libraries. Remove `ANTHROPIC_API_KEY` to force subscription auth. |
| Is CLAUDE_CODE_OAUTH_TOKEN correct? | Requires prior Anthropic approval. Not recommended for most users. |
| How to obtain tokens? | `claude setup-token` (for OAuth) or Console for API keys |
| Python vs TypeScript SDK auth? | Both require API keys. Max plan only works with CLI. |
| Which features with Max vs regular? | All Claude Code features available. SDK libraries don't support subscriptions. |
| Subagent limits? | Limited by 5-hour usage windows, not number of subagents |
| API rate limits for Max? | ~50-200 prompts per 5-hour window, plus weekly caps |
| SDK standalone or needs Claude running? | CLI must be installed (`claude` command), but no daemon needed |
| CLAUDE.md requirements? | Already present in your repo ✅ |
| How usage tracked? | By prompt count (subscription) or tokens (API key) |
| Does SDK count toward Max limits? | SDK uses API key billing. CLI usage counts toward Max limits. |

---

## References

### Official Anthropic Sources
- [Max Plan Announcement](https://www.anthropic.com/news/max-plan)
- [Agent SDK Overview](https://docs.claude.com/en/docs/agent-sdk/overview)
- [Claude Code IAM](https://code.claude.com/docs/en/iam)
- [Using Claude Code with Pro/Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [API Rate Limits](https://docs.claude.com/en/api/rate-limits)

### GitHub Issues
- [CLAUDE_CODE_OAUTH_TOKEN Support](https://github.com/anthropics/claude-code/issues/6536)
- [OAuth API Error 401](https://github.com/anthropics/claude-code/issues/9887)
- [Max Usage with SDK](https://github.com/anthropics/claude-agent-sdk-typescript/issues/11)

### Community Implementations
- [claude_max Library](https://idsc2025.substack.com/p/how-i-built-claude_max-to-unlock)
- [Python SDK Guide](https://www.eesel.ai/blog/python-claude-code-sdk)
- [Subagent Best Practices](https://www.pubnub.com/blog/best-practices-for-claude-code-sub-agents/)

### Technical Guides
- [DataCamp Tutorial](https://www.datacamp.com/tutorial/how-to-use-claude-agent-sdk)
- [SDK Pricing Guide](https://skywork.ai/blog/claude-code-sdk-pricing-and-api-limits-explained/)
- [Weekly Rate Limits](https://apidog.com/blog/weekly-rate-limits-claude-pro-max-guide/)

---

**Report Generated:** 2025-11-13
**Research Scope:** Authentication, billing, SDK integration, Max plan features
**Status:** Complete and actionable
**Next Action:** Test Max subscription authentication with ADWS
