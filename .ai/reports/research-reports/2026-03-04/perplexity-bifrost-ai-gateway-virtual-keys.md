# Perplexity Research: Bifrost AI Gateway Virtual Keys

**Date**: 2026-03-04
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API (multiple queries)

## Query Summary

Researched how virtual keys work in the open-source Bifrost AI Gateway (https://github.com/maximhq/bifrost), including configuration format, model name format in API requests, Authorization header setup, and practical examples.

## Findings

### 1. How Virtual Keys Work

Virtual keys are the **primary governance entity** in Bifrost. They control:

- **Request routing** to specific providers/models via weighted distribution
- **Budget limits** (spending caps with reset periods)
- **Rate limits** (request/token throttling)
- **Model restrictions** (which models can be used)
- **MCP tool filtering** (which tools agents can access)

Virtual keys are created/updated via HTTP PUT to `/api/governance/virtual-keys/<key-name>` or through the Web UI at `http://localhost:8080` under Governance > Virtual Keys.

### 2. Model Configuration per Virtual Key

Models are configured in the `provider_configs` array within each virtual key. Each entry specifies:

- `provider` (string): Provider name (e.g., "openai", "anthropic", "vllm-local")
- `allowed_models` (string array): Restricts which models can be used with that provider. If empty/omitted, ALL models from that provider's catalog are allowed.
- `weight` (float): Load balancing weight (0.0-1.0, should sum to 1.0 across configs)
- `budget` (object, optional): Per-provider budget with `max_limit` and `current_usage`
- `rate_limit` (object, optional): Per-provider rate limiting

**Example configuration:**
```json
{
  "provider_configs": [
    {
      "provider": "openai",
      "allowed_models": ["gpt-4o", "gpt-4o-mini"],
      "weight": 0.3
    },
    {
      "provider": "anthropic",
      "allowed_models": ["claude-3-5-haiku-20241022"],
      "weight": 0.7
    }
  ]
}
```

### 3. Model Name Format in API Requests

**This is a critical distinction with TWO behaviors:**

#### Without Virtual Key (direct requests):
Use `provider/model` format:
```bash
curl -X POST http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "openai/gpt-4o-mini", "messages": [...]}'
```

#### With Virtual Key (governance routing):
Use **plain model name** (no provider prefix). Bifrost adds the provider prefix automatically based on the virtual key's `provider_configs`:
```bash
curl -X POST http://localhost:8080/v1/chat/completions \
  -H "x-bf-vk: vk-prod-main" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o", "messages": [...]}'
```

The routing flow is:
1. Request arrives with `model: "gpt-4o"` and virtual key `vk-prod-main`
2. Governance checks which provider_configs allow "gpt-4o"
3. Weighted selection picks a provider (e.g., Azure at 70%)
4. Model becomes `azure/gpt-4o` internally
5. Remaining providers become fallbacks (e.g., `openai/gpt-4o`)

For custom/self-hosted providers, use `provider-name/model-name` format even with virtual keys:
```python
# vLLM through Bifrost
model="vllm-local/meta-llama/Llama-3-8B-Instruct"
```

### 4. Authorization Header Setup

Virtual keys and HTTP authentication are **independent layers**. There are multiple ways to pass virtual keys:

#### Supported Headers for Virtual Keys

| Header | Format | Notes |
|--------|--------|-------|
| `x-bf-vk` | `x-bf-vk: <VIRTUAL_KEY>` | Preferred method. Works in all scenarios. Required for old-style keys without `sk-bf-*` prefix. |
| `Authorization` | `Bearer <VIRTUAL_KEY>` | OpenAI-style. Only works when auth is **disabled** (`disable_auth_on_inference: true`). |
| `x-api-key` | `x-api-key: <VIRTUAL_KEY>` | Anthropic-style. Requires `sk-bf-*` prefix on key. |
| `x-goog-api-key` | `x-goog-api-key: <VIRTUAL_KEY>` | Google Gemini-style. Requires `sk-bf-*` prefix on key. |

#### When Auth is DISABLED (`disable_auth_on_inference: true`):

Any of the above headers work. You can use Bearer token style:
```bash
curl -X POST http://localhost:8080/v1/chat/completions \
  -H "Authorization: Bearer vk-premium" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o", "messages": [...]}'
```

Or use `x-bf-vk`:
```bash
curl -X POST http://localhost:8080/v1/chat/completions \
  -H "x-bf-vk: vk-premium" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o", "messages": [...]}'
```

**This also works with the OpenAI Python SDK** (pass virtual key as `api_key`):
```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8080/v1",
    api_key="vk-premium"  # Virtual key as api_key when auth disabled
)
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

#### When Auth is ENABLED (`disable_auth_on_inference: false`):

The `Authorization` header is consumed by authentication, so you MUST use `x-bf-vk` for the virtual key:
```bash
curl -X POST http://localhost:8080/v1/chat/completions \
  -H "Authorization: Basic <base64-credentials>" \
  -H "x-bf-vk: vk-premium" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o-mini", "messages": [...]}'
```

#### Enforcing Virtual Keys

By default, virtual keys are optional. To make them mandatory:
1. Go to Config > Security
2. Enable "Enforce Virtual Keys"

Without enforcement, requests without a virtual key are allowed but skip governance routing.

### 5. Configuration Examples

#### Create virtual key via API:
```bash
curl -X PUT http://localhost:8080/api/governance/virtual-keys/vk-engineering \
  -H "Content-Type: application/json" \
  -d '{
    "provider_configs": [
      {
        "provider": "openai",
        "allowed_models": ["gpt-4o", "gpt-4o-mini"],
        "weight": 0.7
      },
      {
        "provider": "anthropic",
        "allowed_models": ["claude-3-5-haiku-20241022"],
        "weight": 0.3
      }
    ],
    "budget": {
      "max_limit": 500,
      "reset_duration": "1M"
    },
    "rate_limit": {
      "request_max_limit": 1000,
      "request_reset_duration": "1h"
    }
  }'
```

#### Use virtual key in request:
```bash
curl -X POST http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "x-bf-vk: vk-engineering" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

#### Python SDK with virtual key (auth disabled):
```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8080/v1",
    api_key="vk-engineering"
)

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

#### Python SDK with virtual key (auth enabled):
```python
import openai

client = openai.OpenAI(
    base_url="http://localhost:8080/v1",
    api_key="your-auth-credentials",
    default_headers={"x-bf-vk": "vk-engineering"}
)
```

## Sources & Citations

- [Bifrost GitHub Repository](https://github.com/maximhq/bifrost)
- [Bifrost Virtual Keys Documentation](https://docs.getbifrost.ai/features/governance/virtual-keys)
- [Bifrost Provider Configuration](https://docs.getbifrost.ai/quickstart/gateway/provider-configuration)
- [Bifrost Provider Routing](https://docs.getbifrost.ai/providers/provider-routing)
- [Using Bifrost as Unified Gateway (dev.to)](https://dev.to/debmckinney/using-bifrost-as-unified-gateway-for-vllm-and-openai-compatible-endpoints-8c8)
- [Securing Enterprise AI with Gateways (dev.to)](https://dev.to/debmckinney/securing-enterprise-ai-with-gateways-and-guardrails-4nmd)
- [Building Better AI Applications with Bifrost (getmaxim.ai)](https://www.getmaxim.ai/articles/building-better-ai-applications-with-bifrost-a-complete-technical-guide-for-ai-engineers/)

## Key Takeaways

- Virtual keys are governance entities that route requests to providers based on weighted configs, budgets, and rate limits
- Models are configured per provider in `allowed_models` arrays within `provider_configs`
- **With virtual keys**: use plain model names (e.g., `gpt-4o`); Bifrost adds the provider prefix automatically
- **Without virtual keys**: use `provider/model` format (e.g., `openai/gpt-4o-mini`)
- Preferred auth header: `x-bf-vk: <key-name>` (works in all scenarios)
- `Authorization: Bearer <key-name>` only works when `disable_auth_on_inference: true`
- New-style keys with `sk-bf-*` prefix work across all header types; old-style keys only work with `x-bf-vk`
- Virtual key enforcement is optional but recommended for production

## Related Searches

- Bifrost adaptive load balancing (Enterprise feature) for automatic performance-based routing
- Bifrost routing rules with CEL expressions for dynamic conditional routing
- Bifrost MCP integration for tool-calling governance
- Bifrost cluster mode for multi-instance deployments
