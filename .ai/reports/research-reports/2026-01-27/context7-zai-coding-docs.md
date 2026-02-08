# Context7 Research: Z.AI GLM Coding Pro Plan API Configuration

**Date**: 2026-01-28
**Agent**: context7-expert
**Libraries Researched**: websites/z_ai, llmstxt/z_ai_llms_txt, llmstxt/z_ai_llms-full_txt

## Query Summary

Researched Z.AI documentation for:
1. GLM-4.7 API setup and configuration
2. GLM Coding Pro plan / Coding subscription configuration
3. API authentication and endpoints
4. Differences between regular API and Coding Pro subscription

The user has a "GLM Coding Pro-Yearly Plan" subscription but receives error 1113 "Insufficient balance" when using the standard API endpoint.

## Critical Finding: Wrong API Endpoint

**ROOT CAUSE IDENTIFIED**: The user is using the **wrong API endpoint** for their Coding Pro subscription.

### Endpoints Comparison

| Plan Type | API Base URL |
|-----------|--------------|
| **Regular/Pay-as-you-go API** | `https://api.z.ai/api/paas/v4/` |
| **GLM Coding Pro Plan** | `https://api.z.ai/api/coding/paas/v4` |

The user's current configuration:
- Endpoint: `https://api.z.ai/api/paas/v4/chat/completions` (INCORRECT for Coding Plan)
- Model: `glm-4.7`

**The "Coding Plan" has a dedicated endpoint** that is separate from the general pay-as-you-go API. Using the wrong endpoint will result in error 1113 (insufficient balance) because the Coding Plan subscription does NOT add balance to the regular API account.

## Error Code Reference

Error code 1113 from Z.AI documentation:

| Code | Category | Message |
|------|----------|---------|
| 1113 | Account Error | "Your account is in arrears, please recharge and try again" |

This error occurs when:
- Using pay-as-you-go API without balance
- **Using the wrong endpoint for your subscription type**

## Correct Configuration for GLM Coding Pro Plan

### API Base URL

```
https://api.z.ai/api/coding/paas/v4
```

### Full Chat Completions Endpoint

```
https://api.z.ai/api/coding/paas/v4/chat/completions
```

### Authentication

Standard HTTP Bearer authentication (same for both endpoints):
```
Authorization: Bearer YOUR_API_KEY
```

### Available Models Under Coding Pro Plan

Based on documentation, GLM models available include:
- `glm-4.7` - Flagship model for SOTA performance and Agentic Coding (131K max tokens)
- `glm-4.6` - Previous flagship (131K max tokens)
- `glm-4.5` - Air variants available
- `glm-4.5-air` - Lighter/faster variant

## Code Examples

### Python with OpenAI SDK (Recommended)

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-Z.AI-api-key",
    base_url="https://api.z.ai/api/coding/paas/v4/"  # Note: CODING endpoint
)

completion = client.chat.completions.create(
    model="glm-4.7",
    messages=[
        {"role": "system", "content": "You are a helpful AI assistant."},
        {"role": "user", "content": "Hello, please introduce yourself."}
    ]
)

print(completion.choices[0].message.content)
```

### Node.js with OpenAI SDK

```javascript
import OpenAI from "openai";

const client = new OpenAI({
    apiKey: "your-Z.AI-api-key",
    baseURL: "https://api.z.ai/api/coding/paas/v4/"  // Note: CODING endpoint
});

async function main() {
    const completion = await client.chat.completions.create({
        model: "glm-4.7",
        messages: [
            { role: "system", content: "You are a helpful AI assistant." },
            { role: "user", content: "Hello, please introduce yourself." }
        ]
    });

    console.log(completion.choices[0].message.content);
}

main();
```

### Python with Native Z.AI SDK

```python
from zai import ZaiClient

# Initialize client (SDK may auto-detect coding endpoint, verify in SDK docs)
client = ZaiClient(api_key="YOUR_API_KEY")

response = client.chat.completions.create(
    model="glm-4.7",
    messages=[
        {"role": "system", "content": "You are a helpful AI assistant."},
        {"role": "user", "content": "Hello, please introduce yourself."}
    ]
)

print(response.choices[0].message.content)
```

### cURL Direct Request

```bash
curl --location 'https://api.z.ai/api/coding/paas/v4/chat/completions' \
--header 'Authorization: Bearer YOUR_API_KEY' \
--header 'Accept-Language: en-US,en' \
--header 'Content-Type: application/json' \
--data '{
    "model": "glm-4.7",
    "messages": [
        {
            "role": "user",
            "content": "Please introduce the development history of artificial intelligence"
        }
    ],
    "temperature": 1.0,
    "max_tokens": 1024
}'
```

## Configuration for Development Tools

### Claude Code Configuration

For users integrating with Claude Code using GLM Coding Plan:

```json
{
  "env": {
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.5-air",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.7",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.7"
  }
}
```

### Factory Droid Configuration

```json
{
  "custom_models": [
    {
      "model_display_name": "GLM-4.7 [Z.AI Coding Plan]",
      "model": "glm-4.7",
      "base_url": "https://api.z.ai/api/coding/paas/v4",
      "api_key": "your_api_key",
      "provider": "generic-chat-completion-api",
      "max_tokens": 131072
    }
  ]
}
```

### Crush Configuration

```json
{
  "providers": {
    "zai": {
      "id": "zai",
      "name": "ZAI Provider",
      "base_url": "https://api.z.ai/api/coding/paas/v4",
      "api_key": "your_api_key"
    }
  }
}
```

## Coding Tool Helper

Z.AI provides an automated setup tool for configuring the Coding Plan:

```bash
# Run Coding Tool Helper directly
npx @z_ai/coding-helper

# Or install globally
npm install -g @z_ai/coding-helper
coding-helper

# Commands available:
coding-helper init                    # Launch initialization wizard
coding-helper auth                    # Configure API key interactively
coding-helper auth reload claude      # Load plan into Claude Code
coding-helper doctor                  # Check system configuration
```

## Model Specifications

### GLM-4.7

| Parameter | Value |
|-----------|-------|
| Default max_tokens | 65536 |
| Maximum max_tokens | 131072 |
| Context Window | ~200K tokens |
| Features | Agentic Coding, Deep Thinking, Tool Calling |

### GLM-4.6

| Parameter | Value |
|-----------|-------|
| Default max_tokens | 65536 |
| Maximum max_tokens | 131072 |

### GLM-4.5 Variants

| Model | Default max_tokens | Maximum max_tokens |
|-------|-------------------:|-------------------:|
| glm-4.5 | 65536 | 98304 |
| glm-4.5-air | 65536 | 98304 |
| glm-4.5-x | 65536 | 98304 |
| glm-4.5-airx | 65536 | 98304 |
| glm-4.5-flash | 65536 | 98304 |

## Key Takeaways

1. **CRITICAL**: GLM Coding Pro Plan requires the dedicated coding endpoint: `https://api.z.ai/api/coding/paas/v4`

2. **Error 1113 Solution**: Switch from `/api/paas/v4/` to `/api/coding/paas/v4` in your base URL

3. **Authentication**: Same Bearer token authentication works for both endpoints, but your API key must be from a Coding Plan subscription to use the coding endpoint

4. **Model Support**: `glm-4.7` is the flagship model available under the Coding Pro plan

5. **OpenAI SDK Compatible**: Both endpoints are compatible with the OpenAI SDK - just change the `base_url`

6. **Use Coding Tool Helper**: Run `npx @z_ai/coding-helper` for automated setup assistance

## Immediate Action Required

Change your API configuration from:
```
baseURL: "https://api.z.ai/api/paas/v4/"
```

To:
```
baseURL: "https://api.z.ai/api/coding/paas/v4/"
```

This should resolve the error 1113 "Insufficient balance" issue when using your GLM Coding Pro-Yearly Plan subscription.

## Sources

- Z.AI Official Documentation via Context7 (websites/z_ai)
- Z.AI LLMs.txt Documentation via Context7 (llmstxt/z_ai_llms_txt)
- Z.AI Full Documentation via Context7 (llmstxt/z_ai_llms-full_txt)
- Documentation URLs: https://docs.z.ai/api-reference/introduction, https://docs.z.ai/devpack/quick-start, https://docs.z.ai/guides/overview/quick-start
