# Langfuse Prompt Management Integration with Bifrost

**Issue:** TBD (to be created after spec review)
**Epic:** Langfuse Integration
**Author:** Sophie + Mike
**Status:** Draft
**Date:** 2026-03-04

---

## Summary

Migrate all hardcoded prompts from the `ai-gateway` package to Langfuse Prompt Management,
so prompts can be versioned, A/B tested, and iterated on from the Langfuse UI without
code deployments. Prompts will be fetched at runtime via the Langfuse JS SDK, compiled
with variables, then sent through Bifrost (our LiteLLM-based AI gateway with virtual keys).

## Current State

### What we have today

1. **Hardcoded prompts** in `packages/ai-gateway/src/prompts/`:
   - 6 system prompts: `title-creator`, `audience-creator`, `ideas-creator`,
     `situation-improvements`, `text-simplifier`, `test-outline-creator`
   - Corresponding user message templates with `{{variable}}` syntax
   - Partial prompt fragments (base-instructions, improvement-format, etc.)
   - A `prompt-manager.ts` that loads templates from a local registry

2. **Langfuse SDK already integrated** (partial):
   - `langfuse-client.ts` — initializes Langfuse SDK
   - `prompt-service.ts` — has `fetchPromptFromLangfuse()` and `hasPromptInLangfuse()` functions
   - Template name mapping exists (local name → Langfuse name)
   - **BUT:** This is currently a fallback/optional path. Prompts are still primarily loaded from local files.

3. **Bifrost gateway**:
   - App sends requests to `https://bifrost.slideheroes.com/v1`
   - Uses virtual keys, CF Access headers, and feature/user/team/session metadata headers
   - The `enhanced-gateway-client.ts` handles model routing and request construction
   - Bifrost is a LiteLLM proxy — it supports native Langfuse prompt management via `prompt_id` parameter

4. **Langfuse environment** already configured:
   - `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST` env vars

### What's not working

- Prompts are still loaded from local TypeScript files as the primary source
- No versioning, A/B testing, or deployment-free prompt iteration
- The existing `fetchPromptFromLangfuse()` doesn't handle variables/compilation
- No connection between Langfuse prompt versions and observability traces

---

## Architecture Decision: SDK Fetch vs LiteLLM Native

There are **two approaches** to integrating Langfuse prompts:

### Option A: Langfuse JS SDK fetch → compile → send to Bifrost (RECOMMENDED)

```text
App → Langfuse SDK (fetch prompt + compile variables) → Bifrost (send compiled messages) → LLM
```

**How it works:**

1. At runtime, call `langfuse.prompt.get("situation-improvements", { type: "chat" })`
2. Compile with variables: `prompt.compile({ situation: userInput, context: profileData })`
3. Send the compiled messages array to Bifrost's `/v1/chat/completions` as normal
4. Langfuse tracing automatically links the generation to the prompt version used

**Pros:**

- Full control over variable compilation in our TypeScript code
- Works with our existing Bifrost virtual keys flow (no Bifrost config changes needed)
- Prompt caching in SDK (default: 1 min TTL, no added latency after first fetch)
- Can gracefully fall back to local templates if Langfuse is unavailable
- Variable types and validation stay in our codebase

**Cons:**

- Two services touched at runtime (Langfuse + Bifrost)
- Need to pass prompt metadata to Bifrost for tracing linkage

### Option B: LiteLLM native `prompt_id` (NOT recommended for us)

```text
App → Bifrost (prompt_id + prompt_variables) → Bifrost fetches from Langfuse → LLM
```

**How it works:**

1. Configure Langfuse prompts in Bifrost's `config.yaml`
2. Send `prompt_id` and `prompt_variables` in the chat completion request
3. Bifrost resolves the prompt from Langfuse, compiles variables, sends to LLM

**Why not for us:**

- Requires Bifrost config changes and restart for each new prompt
- Our prompts use complex variable injection (profile data, context blocks) that's better handled in app code
- We already have the Langfuse SDK and the partial integration
- Less control over fallback behavior
- Virtual keys + prompt_id interaction is less documented

### Decision: **Option A — SDK fetch + compile in app, send to Bifrost**

---

## Implementation Plan

### Phase 1: Migrate prompts to Langfuse Cloud (UI work, no code)

Create all prompts in Langfuse UI as **chat** type prompts:

| Prompt Name | Type | Variables | Current File |
|------------|------|-----------|--------------|
| `title-creator` | chat | `{{context}}`, `{{title}}` | `system/title-creator.ts` |
| `audience-creator` | chat | `{{context}}`, `{{audience}}` | `system/audience-creator.ts` |
| `ideas-creator` | chat | `{{context}}` | `system/ideas-creator.ts` |
| `situation-improvements` | chat | `{{situation}}`, `{{context}}` | `system/situation-improvements/` |
| `text-simplifier` | chat | `{{text}}` | `system/text-simplifier.ts` |
| `test-outline-creator` | chat | `{{context}}`, `{{outline}}` | `system/test-outline-creator.ts` |

Each prompt should have:

- System message + user message template (matching current structure)
- Variables using `{{variable_name}}` Langfuse syntax (same as our current syntax)
- `production` label on the initial version
- Config metadata: `{ model: "gpt-4o", temperature: 0.7 }` (or whatever the current defaults are)

### Phase 2: Refactor prompt-service.ts

Replace the current `fetchPromptFromLangfuse()` with a proper SDK-based approach:

```typescript
import { LangfuseClient } from "@langfuse/client";

const langfuse = new LangfuseClient();

export async function getPrompt(
  promptName: string,
  variables: Record<string, string>,
  options?: { label?: string; version?: number }
): Promise<ChatMessage[]> {
  try {
    // Fetch prompt from Langfuse (cached, ~0ms after first call)
    const prompt = await langfuse.prompt.get(promptName, {
      type: "chat",
      label: options?.label ?? "production",
      version: options?.version,
    });

    // Compile variables into the prompt template
    const compiled = prompt.compile(variables);
    
    // Return as ChatMessage[] (Langfuse chat prompts are OpenAI-compatible)
    return compiled;
  } catch (error) {
    logger.warn("Langfuse prompt fetch failed, falling back to local", { promptName, error });
    // Graceful fallback to local template
    return loadAndCompileLocalTemplate(promptName, variables);
  }
}
```

### Phase 3: Update gateway request flow

In `enhanced-gateway-client.ts` or wherever the chat completion is built, pass Langfuse
prompt metadata so tracing links correctly:

```typescript
const response = await fetch(`${BIFROST_GATEWAY_URL}/chat/completions`, {
  method: "POST",
  headers: buildHeaders(virtualKey, userId, teamId, feature),
  body: JSON.stringify({
    model: resolvedModel,
    messages: compiledMessages, // From Langfuse prompt.compile()
    metadata: {
      prompt: {
        name: promptName,
        version: prompt.version,
        // This links the Langfuse generation trace to the prompt version
      }
    }
  })
});
```typescript
```

### Phase 4: Update each workflow caller

Update each place that currently calls `loadTemplate()` or builds messages manually:

**Before:**

```typescript
import { loadTemplate, compileTemplate } from "./prompts/prompt-manager";
const template = loadTemplate("situation-improvements");
const messages = template.map(m => ({
  ...m,
  content: compileTemplate(m.content, { situation: userSituation })
}));
```

**After:**

```typescript
import { getPrompt } from "./langfuse/prompt-service";
const messages = await getPrompt("situation-improvements", {
  situation: userSituation,
  context: profileContext,
});
```

### Phase 5: Deprecate local prompt files

Once all prompts are confirmed working via Langfuse:

1. Keep local files as fallback templates (read-only, not edited)
2. Add a startup health check that verifies Langfuse connectivity
3. Log when fallback is used (should be rare/never in production)

---

## Prompt Partials / Composability

Langfuse supports **prompt references** — one prompt can include another:

```text
{{#prompt:base-instructions}}
```

This maps to our current "partials" (`base-instructions.ts`, `improvement-format.ts`, etc.). We should:

1. Create partials as separate Langfuse prompts (text type)
2. Reference them from parent prompts using Langfuse's `{{#prompt:partial-name}}` syntax
3. This replaces our manual partial injection in TypeScript

---

## Observability Linkage

When using Langfuse SDK to fetch prompts AND Langfuse for tracing (via Bifrost/LiteLLM OTEL callback):

- The `prompt` metadata in the generation trace auto-links to the prompt version
- Enables: "which prompt version produced this output?" analysis
- Enables: evaluation of prompt version performance over time

Ensure Bifrost has `langfuse_otel` callback configured:

```yaml
litellm_settings:
  callbacks: ["langfuse_otel"]
```

---

## Testing Strategy

1. **Unit tests:** Mock Langfuse SDK, verify compile + fallback behavior
2. **Integration test:** Fetch real prompt from Langfuse staging, verify messages format
3. **E2E:** Run one workflow (e.g., situation-improvements) through Langfuse prompt → Bifrost → LLM
4. **Rollback test:** Verify local fallback works when Langfuse is unreachable

---

## Migration Checklist

- [ ] Create all 6 prompts in Langfuse Cloud UI with `production` label
- [ ] Create partial prompts (base-instructions, improvement-format, etc.)
- [ ] Upgrade `@langfuse/client` to latest version
- [ ] Refactor `prompt-service.ts` with new `getPrompt()` function
- [ ] Update `enhanced-gateway-client.ts` to pass prompt metadata
- [ ] Update each template caller (6 workflows)
- [ ] Add Langfuse connectivity health check
- [ ] Add fallback logging/alerting
- [ ] Verify Bifrost OTEL callback links traces to prompt versions
- [ ] Test with one prompt end-to-end before migrating all
- [ ] Remove/deprecate old `prompt-manager.ts` and `loadTemplate()`

---

## Files to Modify

| File | Change |
|------|--------|
| `packages/ai-gateway/src/langfuse/prompt-service.ts` | Rewrite with SDK fetch + compile |
| `packages/ai-gateway/src/prompts/prompt-manager.ts` | Deprecate, keep as fallback |
| `packages/ai-gateway/src/enhanced-gateway-client.ts` | Add prompt metadata to requests |
| `packages/ai-gateway/src/index.ts` | Update exports |
| Each template caller in workflows | Switch to `getPrompt()` |
| `packages/ai-gateway/package.json` | Upgrade `@langfuse/client` |

---

## Out of Scope

- Langfuse Evaluations / Datasets (future work)
- Mastra agent prompts (separate from ai-gateway — Phase 2)
- Prompt playground testing in Langfuse (nice-to-have, not blocking)
- Bifrost native `prompt_id` approach (decided against)
