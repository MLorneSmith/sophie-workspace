# Perplexity Research: Z.ai GLM Coding Pro Plan API Configuration

**Date**: 2026-01-28
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API (combined)

## Query Summary

Researched how to properly configure the Z.ai GLM Coding Pro-Yearly Plan for API access, specifically investigating why users get error code 1113 "Insufficient balance or no resource package" when trying to use glm-4.7 through claude-code-router despite having an active Coding Pro subscription.

## Critical Finding: The Root Cause of Error 1113

**The error 1113 occurs because the GLM Coding Plan requires a DIFFERENT API endpoint than the standard Z.ai API.**

### The Two Distinct Endpoints

| Plan Type | API Endpoint | Use Case |
|-----------|-------------|----------|
| **Pay-as-you-go API** | `https://api.z.ai/api/paas/v4` | Standard token-based billing |
| **GLM Coding Plan** (Lite/Pro/Max) | `https://api.z.ai/api/coding/paas/v4` | Subscription-based prompt quota |
| **Claude Code Compatible** | `https://api.z.ai/api/anthropic` | Anthropic-compatible endpoint for Claude Code |

**Key Insight**: When you call the standard endpoint (`/api/paas/v4`) with a Coding Plan API key, the system returns error 1113 because it doesn't recognize your subscription quota on that endpoint - only the `/api/coding/paas/v4` endpoint has access to the subscription quota.

## Answers to Specific Questions

### 1. Is there a different API endpoint for Coding Pro vs regular API?

**YES - This is the critical difference.**

| Configuration | Standard API | Coding Plan |
|---------------|-------------|-------------|
| **Base URL (direct)** | `https://api.z.ai/api/paas/v4` | `https://api.z.ai/api/coding/paas/v4` |
| **Claude Code Base URL** | N/A | `https://api.z.ai/api/anthropic` |
| **Billing** | Token-based (pay-as-you-go) | Prompt-based subscription |
| **Quota** | Based on account balance | 120/600/2400 prompts per 5-hour cycle |

### 2. What are the correct model names for Coding Pro subscription?

The GLM Coding Plan supports these models:

| Model Name | Description | Recommended For |
|------------|-------------|-----------------|
| `glm-4.7` | Latest flagship model (current default) | Complex coding, agent tasks |
| `glm-4.6` | Previous flagship | General coding, debugging |
| `glm-4.5` | Foundation model | Standard coding tasks |
| `glm-4.5-air` | Lightweight variant | Quick tasks, cost savings |
| `glm-4.6v` | Vision model | Image understanding |

**Model mapping for Claude Code:**
```json
{
  "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.7",
  "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.7",
  "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.5-air"
}
```

### 3. Is there a separate API key needed for Coding Pro vs regular API?

**NO** - The same API key works for both, but you must use the **correct endpoint** for your subscription type.

- API keys are generated at: `https://z.ai/manage-apikey/apikey-list`
- The key determines your identity, but the **endpoint** determines which quota pool is used
- A Coding Plan subscriber using the standard endpoint will get error 1113
- A pay-as-you-go user using the coding endpoint will also get errors

### 4. Are there any quota/usage limits or activation steps after subscribing?

**Quota Limits by Plan:**

| Plan | Prompts per 5-hour cycle | Monthly Price | MCP Quota |
|------|--------------------------|---------------|-----------|
| **Lite** | ~120 prompts | $6/month ($3 promo) | 100 web searches/readers |
| **Pro** | ~600 prompts | $30/month ($15 promo) | 1,000 web searches/readers |
| **Max** | ~2,400 prompts | $120/month | 4,000 web searches/readers |

**Important Notes:**
- Quota resets every 5 hours automatically
- When quota is exhausted, you wait for the next cycle - system does NOT deduct from account balance
- Coding Plan quota is ONLY usable within supported coding tools
- Direct API calls are billed separately and do NOT use Coding Plan quota

**Activation Steps:**
1. Subscribe at `https://z.ai/subscribe`
2. Generate API key at `https://z.ai/manage-apikey/apikey-list`
3. Configure the correct endpoint in your coding tool
4. No additional activation needed - quota is immediately available

### 5. How does Coding Pro differ from regular API access in configuration?

**For Claude Code (Direct Integration):**

```json
// ~/.claude/settings.json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "your_zai_api_key",
    "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
    "API_TIMEOUT_MS": "3000000",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.5-air",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.7",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.7"
  }
}
```

**For claude-code-router:**

The issue is that claude-code-router needs to be configured to use the coding endpoint. Check your `~/.claude-code-router/config.json`:

```json
{
  "Providers": [
    {
      "name": "zai-coding",
      "api_base_url": "https://api.z.ai/api/coding/paas/v4/chat/completions",
      "api_key": "your_zai_api_key",
      "models": ["glm-4.7", "glm-4.6", "glm-4.5", "glm-4.5-air"]
    }
  ],
  "Router": {
    "default": "zai-coding,glm-4.7"
  }
}
```

**Alternative: Use the Anthropic-compatible endpoint:**

```json
{
  "Providers": [
    {
      "name": "zai",
      "api_base_url": "https://api.z.ai/api/anthropic/messages",
      "api_key": "your_zai_api_key",
      "models": ["glm-4.7", "glm-4.6", "glm-4.5"]
    }
  ]
}
```

## Supported Coding Tools

The GLM Coding Plan is designed for use ONLY with these specific coding tools:
- Claude Code
- Roo Code
- Kilo Code
- Cline
- OpenCode
- Crush
- Goose
- Cursor
- Gemini CLI
- Grok CLI
- Cherry Studio

**Important**: The coding plan quota is NOT available for:
- Direct API integrations
- Custom applications
- SaaS products
- Bots or automated systems

## Troubleshooting Guide

### Error 1113: "Insufficient balance or no resource package"

**Cause**: Using the wrong endpoint for your subscription type

**Solution**:
1. Verify you have an active Coding Plan subscription at `https://z.ai/subscribe`
2. Change your base URL from:
   - `https://api.z.ai/api/paas/v4` (wrong for Coding Plan)
   - To: `https://api.z.ai/api/coding/paas/v4` or `https://api.z.ai/api/anthropic`
3. Verify with curl:
   ```bash
   curl -X POST "https://api.z.ai/api/coding/paas/v4/chat/completions" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model": "glm-4.7", "messages": [{"role": "user", "content": "test"}]}'
   ```

### Error 1309: "GLM Coding Plan package has expired"

**Cause**: Subscription has lapsed

**Solution**: Renew subscription at `https://z.ai/subscribe`

### Configuration Not Taking Effect

1. Close all Claude Code windows
2. Open new terminal window
3. Run `claude` again
4. Use `/status` to verify model configuration

## Sources & Citations

1. Z.AI Developer Documentation - Error Codes: https://docs.z.ai/api-reference/api-code
2. Z.AI Quick Start Guide: https://docs.z.ai/devpack/quick-start
3. Z.AI Claude Code Setup: https://docs.z.ai/devpack/tool/claude
4. Z.AI FAQ: https://docs.z.ai/devpack/faq
5. GitHub Issue - Cline Z AI Coding Plan Endpoints: https://github.com/cline/cline/issues/6761
6. Answer Overflow - Z.ai Coding Endpoint Discussion: https://www.answeroverflow.com/m/1459789839590232236
7. AI Engineer Guide - Claude Code Z.ai Setup: https://aiengineerguide.com/blog/claude-code-z-ai-glm-4-7/
8. Roo Code Z AI Provider Documentation: https://docs.roocode.com/providers/zai
9. Claude Code Router GitHub: https://github.com/musistudio/claude-code-router
10. Z.ai Subscription Page: https://z.ai/subscribe

## Key Takeaways

1. **ERROR 1113 ROOT CAUSE**: Using standard API endpoint instead of coding endpoint
2. **CORRECT ENDPOINT**: `https://api.z.ai/api/coding/paas/v4` for direct API calls, or `https://api.z.ai/api/anthropic` for Claude Code compatibility
3. **SAME API KEY**: Works for both endpoints - the endpoint determines quota type
4. **SUPPORTED TOOLS ONLY**: Coding Plan quota only works within designated coding tools
5. **QUOTA SYSTEM**: Prompt-based (not token-based), resets every 5 hours
6. **MODEL NAMES**: Use `glm-4.7`, `glm-4.6`, `glm-4.5`, `glm-4.5-air` (case-insensitive usually works)

## Related Searches

For follow-up research if needed:
- claude-code-router custom provider configuration
- Z.ai Vision MCP Server setup
- Z.ai Web Search MCP configuration
- GLM-4.7 vs Claude Sonnet performance comparison
