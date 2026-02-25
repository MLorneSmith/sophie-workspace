# Portkey ↔ Mastra Model Routing Architecture — Task #503

## Status: RECOMMENDATION — Pending Mike's Review

---

## The Problem

We have two systems that both manage LLM calls:

1. **`@kit/ai-gateway`** — The existing AI Gateway used by the app's server actions (Assemble, Outline, Storyboard, Generate steps). Routes through Portkey's proxy (`https://api.portkey.ai/v1/proxy`) using OpenAI SDK with custom headers for virtual keys, provider routing, caching, and retry.

2. **`@kit/mastra`** — The new agent framework (spike validated). Agents use Mastra's native model format (`"openai/gpt-4o"`) which calls providers directly via AI SDK's built-in provider registry.

**The gap:** Mastra agent calls bypass Portkey entirely. No cost tracking, no fallbacks, no caching, no unified observability.

---

## Architecture Options

### Option A: Portkey MastraModelGateway (Recommended)

Create a custom `MastraModelGateway` that routes all Mastra model resolutions through Portkey's proxy.

**How it works:**
- Implement `PortkeyGateway extends MastraModelGateway`
- `resolveLanguageModel()` creates an OpenAI-compatible provider pointing at Portkey's proxy URL
- Portkey headers (`x-portkey-api-key`, `x-portkey-virtual-key`, `x-portkey-provider`) are injected per request
- Model routing table (`model-routing.ts`) stays as-is — the gateway intercepts at the provider level

```typescript
// packages/mastra/src/gateway/portkey-gateway.ts
import { MastraModelGateway } from "@mastra/core";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export class PortkeyGateway extends MastraModelGateway {
  readonly id = "portkey";
  readonly name = "Portkey AI Gateway";

  async resolveLanguageModel({ modelId, providerId, apiKey, headers }) {
    const provider = createOpenAICompatible({
      baseURL: "https://api.portkey.ai/v1",
      headers: {
        "x-portkey-api-key": process.env.PORTKEY_API_KEY,
        "x-portkey-virtual-key": getVirtualKeyForProvider(providerId),
        "x-portkey-provider": providerId,
        ...headers,
      },
    });
    return provider.chatModel(modelId);
  }
}
```

**Register in Mastra singleton:**
```typescript
new Mastra({
  gateways: {
    portkey: new PortkeyGateway(),
  },
  // agents use "portkey/openai/gpt-4o" or we configure portkey as default
})
```

**Pros:**
- Clean integration using Mastra's official gateway extension point
- All agent calls automatically route through Portkey
- Cost tracking, fallbacks, caching all work
- Model routing table (`model-routing.ts`) unchanged
- App's existing `@kit/ai-gateway` continues working for non-Mastra calls

**Cons:**
- Need to verify `createOpenAICompatible` works with Portkey's proxy for all providers (OpenAI, Anthropic)
- Model IDs may need prefixing (`portkey/openai/gpt-4o` vs `openai/gpt-4o`)

---

### Option B: Replace model-routing.ts with Portkey Virtual Keys

Instead of a gateway, change the model routing table to use Portkey virtual keys directly via OpenAI-compatible SDK.

**How it works:**
- Each agent gets an OpenAI SDK client pointing at Portkey's proxy
- Virtual keys handle provider routing (OpenAI key, Anthropic key, etc.)
- Remove Mastra's native `"provider/model"` format, use Portkey's model names

**Pros:**
- Simpler — no custom gateway class
- Direct control over per-agent Portkey configs

**Cons:**
- Breaks Mastra's native model resolution
- Agents can't use Mastra's built-in provider features
- More coupling between agent definitions and Portkey specifics
- Harder to test without Portkey

---

### Option C: Parallel Systems (Minimal Integration)

Keep both systems separate. `@kit/ai-gateway` for app server actions, Mastra native for agents. Add manual cost recording.

**Pros:**
- No integration work
- Each system stays independent

**Cons:**
- No unified cost tracking
- No fallbacks for agent calls
- No caching for agent calls
- Two separate billing/observability stories

---

## Recommendation: Option A — PortkeyGateway

**Why:**
1. Uses Mastra's official extension point (`MastraModelGateway`)
2. Minimal code change — agents don't change, model routing doesn't change
3. All calls get Portkey's benefits (cost tracking, fallbacks, caching)
4. Clean separation — gateway handles routing, agents handle logic
5. Testable — can disable gateway in tests, agents still work with mocked models

**Implementation scope:**
- 1 new file: `packages/mastra/src/gateway/portkey-gateway.ts` (~100 lines)
- Update `mastra.ts` singleton to register the gateway
- Update `model-routing.ts` to optionally prefix model IDs with `portkey/`
- Add env vars: `PORTKEY_API_KEY`, `PORTKEY_VIRTUAL_KEY_OPENAI`, `PORTKEY_VIRTUAL_KEY_ANTHROPIC`
- Test with real Portkey calls

**Virtual key mapping:**
| Provider | Virtual Key Env Var | Used by |
|----------|-------------------|---------|
| OpenAI | `PORTKEY_VIRTUAL_KEY_OPENAI` | Research, Partner, Brief Generator, Storyboard, Whisperer, Editor |
| Anthropic | `PORTKEY_VIRTUAL_KEY_ANTHROPIC` | Validator, reasoning tasks |

**Fallback strategy (Portkey config):**
- Primary: designated provider
- Fallback: alternate provider (e.g., OpenAI → Anthropic for non-reasoning, Anthropic → OpenAI for reasoning)
- Retry: 2 attempts on 429/500/503

---

## What Happens to @kit/ai-gateway?

**Short term:** Both coexist. `@kit/ai-gateway` serves the existing app server actions (getChatCompletion, structured output for Assemble/Outline/etc.). Mastra agents go through PortkeyGateway.

**Medium term:** As we migrate app server actions to Mastra workflows (e.g., audience profiling already moving), `@kit/ai-gateway` usage shrinks naturally.

**Long term:** `@kit/ai-gateway` becomes a thin wrapper or gets deprecated. All LLM calls go through Mastra + PortkeyGateway.

---

## Open Questions for Mike

1. **Do you have Portkey virtual keys set up?** We need one per provider (OpenAI, Anthropic). If not, I can help configure them.
2. **Portkey caching** — Do we want semantic caching for agent calls? (Useful for repeated similar queries in research, could save cost)
3. **Portkey config IDs** — The existing `@kit/ai-gateway` has use-case-specific configs (audience-suggestions, outline-generation, etc.). Should Mastra agents get similar per-use-case configs, or is a single default config sufficient for now?
4. **Rate limiting** — Any concerns about hitting provider rate limits with parallel agent calls? Portkey can enforce rate limits per virtual key.

---

## Next Step

Once architecture is approved, Task #501 implements it:
1. Build `PortkeyGateway` class
2. Wire into Mastra singleton
3. Add env vars and virtual key mapping
4. Test with a real agent call through Portkey
5. Verify cost tracking shows up in Portkey dashboard
