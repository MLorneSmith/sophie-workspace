# Spec: AI Gateway Migration — Portkey → Bifrost + Langfuse Cloud

> **Status:** Approved
> **Created:** 2026-03-02
> **Spec Issue:** #2212
> **Estimated Total:** ~8-12 days across 4 features

---

## 1. Problem Statement

SlideHeroes currently routes all AI calls through Portkey's managed AI gateway. This introduces:

- **Cost overhead:** 5.5% platform fee on all LLM spend, plus $49-199/mo subscription
- **Vendor lock-in:** Virtual keys, config templates, and prompt management are all Portkey-proprietary
- **Performance opacity:** No control over gateway latency (managed service)
- **Limited prompt management:** Existing Portkey prompts are basic and hard to iterate on

Bifrost (open-source Go-based gateway) offers 11µs overhead, 21 provider support, and zero cost when self-hosted. Langfuse Cloud provides superior prompt management, versioning, and observability on a generous free tier.

---

## 2. User Story

**As a** SlideHeroes developer,
**I want** our AI gateway to route through a self-hosted Bifrost instance with prompts managed in Langfuse Cloud,
**So that** we eliminate Portkey fees, reduce gateway latency, gain prompt versioning/observability, and remove vendor lock-in.

---

## 3. User Experience

_This is an infrastructure migration. The end-user experience should be identical — same AI features, same response quality, same latency or better._

### Developer Experience:

1. Developer pulls latest `dev` branch
2. Updates `.env` with Bifrost URL (`http://localhost:8080/v1`) + Langfuse Cloud keys
3. Removes Portkey env vars (`PORTKEY_API_KEY`, `PORTKEY_VIRTUAL_KEY`)
4. `packages/ai-gateway` client connects to local Bifrost instead of `api.portkey.ai`
5. Bifrost routes to OpenAI/Anthropic based on model prefix
6. Prompt templates are fetched from Langfuse Cloud via SDK at runtime
7. Usage/cost data flows to Langfuse Cloud for observability

### Deployment:

1. Bifrost runs as a Docker container on the existing EC2 instance (colocated with OpenClaw)
2. Bifrost listens on `localhost:8080` — only accessible from the EC2 host
3. Cloudflare Tunnel exposes Bifrost as `bifrost.slideheroes.com` (or similar subdomain)
4. Cloudflare Access service token secures the tunnel — only Vercel Server Actions can reach it
5. Vercel-deployed Next.js app calls Bifrost via the CF Tunnel URL (~10ms added latency, negligible vs 1-3s LLM calls)
6. Langfuse Cloud handles prompt management and observability (no self-hosting needed)

### Edge Cases:

- If Bifrost is down → app should fail gracefully with clear error messages (no silent failures)
- If Langfuse Cloud is unreachable → prompts should have local fallbacks compiled at build time
- If a provider (OpenAI/Anthropic) is down → Bifrost handles fallback routing automatically

---

## 4. Acceptance Criteria

**Must Have:**
- [ ] Bifrost deployed and running on EC2 as a Docker container
- [ ] Cloudflare Tunnel configured with CF Access service token for secure Vercel → EC2 connectivity
- [ ] `packages/ai-gateway` refactored to use Bifrost instead of Portkey
- [ ] All existing AI features work identically (title suggestions, audience suggestions, situation improvements, outline generation)
- [ ] OpenAI and Anthropic providers configured in Bifrost
- [ ] Existing prompt templates migrated to Langfuse Cloud
- [ ] Langfuse SDK integrated for prompt fetching and observability
- [ ] Usage tracking (tokens, cost) recorded via Langfuse
- [ ] Portkey dependencies (`portkey-ai` npm package) removed
- [ ] All Portkey-specific headers (`x-portkey-*`) removed
- [ ] Streaming completions work through Bifrost
- [ ] Cache namespacing per user/team preserved (via Bifrost caching)
- [ ] CI passes (typecheck, lint, format)

**Nice to Have:**
- [ ] Bifrost health check endpoint monitored
- [ ] Fallback to direct OpenAI if Bifrost is unreachable
- [ ] Cost comparison dashboard in Langfuse showing savings vs Portkey

---

## 5. Scope

**In Scope:**
- Bifrost deployment on EC2 (Docker)
- Refactor `packages/ai-gateway` to use Bifrost
- Migrate prompt templates to Langfuse Cloud
- Integrate Langfuse JS SDK for prompt management + observability
- Remove all Portkey dependencies and config
- Update `.env.example` with new env vars

**Out of Scope:**
- Optimizing routing configs (balanced, speed, cost, quality) — *deferred to Phase 2*
- Fine-tuning Bifrost load balancing strategies — *deferred to Phase 2*
- Advanced Langfuse features (A/B testing, evals, datasets) — *deferred to Phase 2*
- Self-hosting Langfuse — *using Cloud free tier for now*
- Migrating usage tracking from Supabase to Langfuse (keep both for now)

---

## 6. Visual Mockup

_No UI changes. This is a backend infrastructure migration._

Architecture diagram:

```
┌─────────────────────┐
│  Next.js App         │
│  (Vercel)            │
│                      │
│  Server Actions call │
│  ai-gateway package  │
└──────────┬───────────┘
           │ HTTP (OpenAI SDK)
           ▼
┌─────────────────────┐     ┌──────────────────────┐
│  Bifrost Gateway     │     │  Langfuse Cloud       │
│  (EC2, Docker)       │     │  (Managed)            │
│  localhost:8080      │     │                       │
│                      │     │  • Prompt templates    │
│  • Routing           │     │  • Version control     │
│  • Fallbacks         │     │  • Observability       │
│  • Caching           │     │  • Cost tracking       │
│  • Rate limiting     │     │                       │
└──────┬───────┬───────┘     └───────────────────────┘
       │       │
       ▼       ▼
   ┌──────┐ ┌──────────┐
   │OpenAI│ │Anthropic  │
   └──────┘ └──────────┘
```

---

## 7. Feature Breakdown

| # | Feature Name | Priority | Est. Days | Dependencies | Description |
|---|-------------|----------|-----------|--------------|-------------|
| F1 | Bifrost Deployment | 1 | 2-3 | None | Deploy Bifrost on EC2 via Docker, configure OpenAI + Anthropic providers, set up Cloudflare Tunnel + Access service token, verify routing from Vercel |
| F2 | Gateway Client Refactor | 2 | 3-4 | F1 | Refactor `gateway-client.ts`, `enhanced-gateway-client.ts`, and `index.ts` to use Bifrost. Remove Portkey SDK, headers, and virtual key logic. Preserve all existing exports and interfaces. |
| F3 | Langfuse Prompt Migration | 3 | 2-3 | None | Set up Langfuse Cloud account, migrate all prompt templates (title-creator, audience-creator, ideas-creator, situation-improvements, text-simplifier, test-outline-creator), integrate Langfuse JS SDK |
| F4 | Integration & Cleanup | 4 | 2-3 | F1, F2, F3 | End-to-end testing of all AI features, remove `portkey-ai` from package.json, update `.env.example`, update README, verify streaming + caching + usage tracking |

**Dependency Notes:**
- F1 and F3 can run in parallel (Bifrost deploy + Langfuse setup are independent)
- F2 depends on F1 (needs a running Bifrost to test against)
- F4 depends on all three being complete

**Parallel Opportunities:**
- F1 + F3 can be built simultaneously by different agents or in parallel branches

---

## 8. Risks & Open Questions

**Risks:**

| Risk | Impact | Mitigation |
|------|--------|------------|
| Bifrost community is small (1.9k stars) — fewer resources if we hit edge cases | Medium | Go binary is simple; fewer moving parts than Python alternatives. Can fall back to LiteLLM if Bifrost proves unreliable. |
| Vercel → EC2 connectivity for Bifrost | Low | Cloudflare Tunnel + CF Access service token. ~10ms latency overhead, negligible vs 1-3s LLM calls. Already use CF for other services. |
| Langfuse Cloud free tier limits | Low | 50k observations/mo on free tier. Well within our current volume. Upgrade path is $59/mo if needed. |
| Prompt template migration quality | Low | Existing templates are basic. Migration is mostly copy-paste into Langfuse. |

**Open Questions:**
- [x] ~~How does the Vercel-deployed Next.js app reach Bifrost on EC2?~~ → **Cloudflare Tunnel + CF Access service token** (~10ms added latency, negligible)
- [ ] Does Bifrost support semantic caching, or only simple caching? (Need to verify)
- [ ] What Langfuse Cloud free tier limits apply? (50k observations/mo — confirm this is sufficient)

---

## 9. Success Metrics

- All existing AI features pass regression testing (title suggestions, audience suggestions, situation improvements, outline generation)
- Gateway latency ≤ Portkey baseline (expect significant improvement with 11µs overhead)
- Zero Portkey dependencies in codebase
- Prompt templates visible and editable in Langfuse Cloud dashboard
- Monthly gateway cost reduced to ~$0 (self-hosted) from ~$49-199/mo + 5.5% fee

---

_Spec created via Rabbit Plan process. See SOP: `~/clawd/docs/sops/rabbit-plan.md`_
