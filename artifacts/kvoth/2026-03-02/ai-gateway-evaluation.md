# AI Gateway Evaluation: Portkey vs Open Source Alternatives

**Research Date:** March 2, 2026  
**Context:** SlideHeroes currently uses Portkey AI Gateway (v3.0.1) in their `packages/ai-gateway` package, serving a Next.js 15 monorepo. This evaluation assesses alternatives for potential migration or continued use.

---

## Executive Summary

After thorough research, **LiteLLM** emerges as the strongest open-source alternative for SlideHeroes' needs, offering the best balance of provider breadth, self-hosting capability, and cost savings. However, **Portkey remains a solid choice** if the team values managed infrastructure and is willing to pay for convenience. Bifrost offers superior raw performance but lacks the community ecosystem, while Helicone is compelling but less mature.

---

## Part 1: Portkey AI Gateway — Current Solution Analysis

### 1.1 Feature Set

| Feature | Status | Notes |
|---------|--------|-------|
| **Routing** | ✅ Full | 200+ models across 50+ providers |
| **Fallbacks** | ✅ Full | Automatic failover to alternative providers |
| **Load Balancing** | ✅ Full | Weighted distribution across providers/keys |
| **Caching** | ✅ Full | Simple + semantic caching |
| **Retries** | ✅ Full | Up to 5 retries with exponential backoff |
| **Rate Limiting** | ✅ Full | Per-key, per-team, global limits |
| **Guardrails** | ✅ Full | 50+ pre-built AI guardrails |
| **Virtual Keys** | ✅ Full | Secure key management with namespacing |
| **Observability** | ✅ Full | Traces, logs, analytics, cost tracking |
| **Prompt Management** | ✅ Full | Templates, versioning, playground |

**Sources:** 
- https://github.com/Portkey-AI/gateway
- https://portkey.ai/features/ai-gateway

### 1.2 Pricing Model

| Tier | Price | What's Included |
|------|-------|-----------------|
| **Free** | $0 | 50 req/day, 25+ models, basic logging |
| **Starter** | ~$49/mo | Higher limits, extended logs |
| **Pro** | ~$199/mo | Full analytics, longer retention |
| **Enterprise** | Custom | SSO, private deployment, SLA |

Portkey charges a **5.5% platform fee on pay-as-you-go** plans in addition to pass-through LLM costs.

**Sources:**
- https://portkey.ai/pricing
- https://www.truefoundry.com/blog/portkey-pricing-guide

### 1.3 Provider Support

**200+ models** from 50+ providers including:
- OpenAI, Anthropic, Google Gemini, Mistral
- AWS Bedrock, Azure OpenAI, Google Vertex
- Cohere, AI21, Stability AI, Perplexity
- Ollama, Together AI, DeepInfra, and many more

### 1.4 Observability

- Built-in tracing (OpenTelemetry)
- Request/response logging
- Cost analytics by model, team, user
- Latency monitoring
- Error rate tracking

### 1.5 Self-Hosting Options

Portkey offers **hybrid deployment** for enterprise customers:
- **Data Plane** runs in your VPC (processes all AI traffic)
- **Control Plane** hosted by Portkey (admin, configs, analytics)
- Requires Enterprise plan — no free self-hosted option

**Not truly open-source** for self-hosting; gateway code is on GitHub but requires paid license for production use.

**Sources:**
- https://portkey.ai/docs/self-hosting/hybrid-deployments/architecture

### 1.6 Lock-in Concerns

**Medium-High Risk:**
- Virtual keys, configs, and prompt templates are Portkey-specific
- Analytics and tracing tightly coupled to their platform
- Migration would require significant refactoring of key management
- Config templates (`balanced-optimized`, `speed-optimized`, etc.) are proprietary

---

## Part 2: Alternative Evaluation

### 2.1 Bifrost (Maxim AI)

#### Overview
High-performance Go-based AI gateway emphasizing raw speed. Claims 50x faster than LiteLLM with <100µs overhead at 5k RPS.

#### GitHub Stats
- **Stars:** ~1,900
- **Forks:** ~205
- **Community:** Growing but smaller than LiteLLM/Portkey

#### Features

| Feature | Status | Notes |
|---------|--------|-------|
| **Routing** | ✅ | 15+ providers (OpenAI, Anthropic, Bedrock, Vertex, etc.) |
| **Fallbacks** | ✅ | Automatic failover between providers |
| **Load Balancing** | ✅ | Adaptive load balancing with weights |
| **Caching** | ✅ | Semantic caching support |
| **Retries** | ✅ | Built-in retry logic |
| **Rate Limiting** | ✅ | Per-key and team-based limits |
| **Guardrails** | ✅ | Enterprise guardrails available |
| **Virtual Keys** | ✅ | Budget management per key |
| **Observability** | ✅ | Prometheus metrics, OpenTelemetry, tracing |

#### Performance Benchmarks
- 11µs overhead at 5k RPS (vs LiteLLM's ~60ms)
- 100% success rate at scale
- Sub-microsecond queue wait times

#### Pricing
- **Self-hosted:** Free (open-source)
- **Enterprise:** 14-day free trial, then custom pricing
- No per-request markup

#### TypeScript/Next.js Compatibility
- OpenAI SDK compatible (drop-in replacement)
- Can be used as sidecar or embedded via Go SDK
- REST API for any language

#### Migration from Portkey
- Config-based (YAML), different schema than Portkey
- Virtual key concept similar but implementation differs
- Would need to rebuild routing configs

**Sources:**
- https://github.com/maximhq/bifrost
- https://www.getmaxim.ai/bifrost

---

### 2.2 LiteLLM (BerriAI)

#### Overview
The most popular open-source AI gateway. Python-based with massive community adoption and comprehensive provider support.

#### GitHub Stats
- **Stars:** ~37,400
- **Forks:** ~6,100
- **Community:** Very active (daily releases, large Discord)

#### Features

| Feature | Status | Notes |
|---------|--------|-------|
| **Routing** | ✅ | 100+ providers (largest of any gateway) |
| **Fallbacks** | ✅ | Automatic retries with custom fallbacks |
| **Load Balancing** | ✅ | Multiple strategies (latency, weighted, simple) |
| **Caching** | ✅ | Redis, database backends |
| **Retries** | ✅ | Configurable with exponential backoff |
| **Rate Limiting** | ✅ | Per-key, per-model, per-user limits |
| **Guardrails** | ✅ | Output parsing, valid JSON enforcement |
| **Virtual Keys** | ✅ | Multi-tenant with spend tracking |
| **Observability** | ✅ | Langfuse, Lunary, MLflow, Prometheus, custom callbacks |
| **Prompt Management** | ⚠️ | Via config, not as robust as Portkey |

#### Provider Support (100+)
OpenAI, Anthropic, Azure, AWS Bedrock, Google Vertex/Gemini, Cohere, Mistral, Ollama, HuggingFace, Replicate, Together AI, Fireworks, Groq, and 80+ more.

#### Pricing
- **Self-hosted:** Free (open-source)
- **Enterprise:** Self-managed with license key + support channel
- **Managed:** Available via AWS Marketplace
- No markup on API calls

#### TypeScript/Next.js Compatibility
- Python proxy runs server-side (perfect for Next.js Server Actions)
- OpenAI SDK compatible
- Can embed in Python apps or run as standalone proxy
- Node.js SDK also available for direct integration

#### Migration from Portkey
- **Easy:** Both use similar virtual key + config concepts
- Portkey config templates would need rewriting (different schema)
- Key management patterns are similar
- Logging/observability callbacks require adapter changes

**Sources:**
- https://github.com/BerriAI/litellm
- https://docs.litellm.ai/docs/proxy/custom_pricing
- https://docs.litellm.ai/docs/enterprise

---

### 2.3 Helicone AI Gateway

#### Overview
Rust-based, performance-focused gateway with strong observability heritage (from Helicone observability platform). Lightest and fastest gateway by benchmarks.

#### GitHub Stats
- **Stars:** ~480 (ai-gateway repo)
- **Forks:** ~32
- **Community:** Smaller but active

#### Features

| Feature | Status | Notes |
|---------|--------|-------|
| **Routing** | ✅ | 20+ providers |
| **Fallbacks** | ✅ | Health-aware load balancing |
| **Load Balancing** | ✅ | Multiple strategies (latency, weighted, cost) |
| **Caching** | ✅ | Redis + S3 backends |
| **Retries** | ✅ | Configurable |
| **Rate Limiting** | ✅ | Per-user, per-team, global |
| **Guardrails** | ⚠️ | Limited compared to Portkey |
| **Virtual Keys** | ✅ | Via cloud or self-hosted |
| **Observability** | ✅ | Built-in Helicone integration + OpenTelemetry |

#### Performance
- <5ms P95 latency overhead
- ~64MB memory usage
- ~3,000 req/sec capacity
- 30MB binary size

#### Pricing
- **Self-hosted:** Free (open-source)
- **Cloud-hosted:** Free tier (10K requests), Pro $79/mo, Team $799/mo
- Zero markup on API calls

#### TypeScript/Next.js Compatibility
- OpenAI SDK compatible
- Self-host via Docker/npx
- Works with any OpenAI SDK-compatible client

#### Migration from Portkey
- Moderate complexity
- Different config format (YAML-based)
- Routing strategies similar but syntax differs

**Sources:**
- https://github.com/Helicone/ai-gateway
- https://www.helicone.ai/pricing

---

## Part 3: Additional Alternatives

### 3.1 Vercel AI Gateway

**Best for:** Teams already on Vercel/Next.js

- **Provider Support:** 350+ models via OpenRouter
- **Pricing:** Free tier + pay-as-you-go, no markup
- **Features:** Load balancing, caching, rate limiting, observability
- **Pros:** Tight integration with Vercel AI SDK, simplest for Next.js teams
- **Cons:** Tied to Vercel ecosystem, less control

**Source:** https://vercel.com/docs/ai-gateway

### 3.2 OpenRouter

**Best for:** Quick access to many models without infrastructure

- **Provider Support:** 300+ models
- **Pricing:** 5% markup on requests
- **Pros:** Fastest setup, extensive model access
- **Cons:** Not a full gateway (no caching, limited routing), vendor lock-in

### 3.3 Kong AI Gateway

**Best for:** Enterprises with existing Kong infrastructure

- **Provider Support:** Extensible via plugins
- **Pricing:** Enterprise pricing
- **Pros:** Mature API gateway with LLM plugins
- **Cons:** Complex setup, overkill for small teams

---

## Part 4: Comparison Matrix

| Criteria | Portkey | Bifrost | LiteLLM | Helicone |
|----------|---------|---------|---------|----------|
| **GitHub Stars** | 10.7k | 1.9k | 37.4k | 480 |
| **Provider Count** | 200+ | 15+ | 100+ | 20+ |
| **Self-Hosted Free** | ❌ | ✅ | ✅ | ✅ |
| **Open-Source** | Partial | ✅ | ✅ | ✅ |
| **TypeScript/Next.js** | ✅ | ✅ | ✅ | ✅ |
| **Virtual Keys** | ✅ | ✅ | ✅ | ✅ |
| **Caching** | ✅ | ✅ | ✅ | ✅ |
| **Rate Limiting** | ✅ | ✅ | ✅ | ✅ |
| **Load Balancing** | ✅ | ✅ | ✅ | ✅ |
| **Observability** | Excellent | Good | Good | Good |
| **Guardrails** | 50+ | ✅ | ✅ | Limited |
| **Prompt Management** | ✅ | ❌ | ⚠️ | ❌ |
| **Cost (Self-Hosted)** | N/A | Free | Free | Free |
| **Cost (Managed)** | ~$49/mo+ | Custom | Free tier | $79/mo+ |
| **Migration Ease** | — | Moderate | Easy | Moderate |

---

## Recommendations

### For SlideHeroes (Small Team, Cost-Sensitive, Next.js 15)

#### Option A: Stay with Portkey (If Convenience > Cost)
**Keep using Portkey if:**
- Current setup works well
- Team values managed infrastructure
- Budget can accommodate ~$50-200/mo
- Prompt management and guardrails are critical

**Action:** Continue with current setup; re-evaluate annually.

---

#### Option B: Migrate to LiteLLM (Recommended)
**Migrate if:**
- Team wants to reduce vendor dependency
- Cost savings are important (no platform fees)
- Comfortable with self-hosting Python app
- Need maximum provider flexibility

**Migration Path:**
1. Deploy LiteLLM proxy alongside existing Portkey setup
2. Migrate virtual keys → LiteLLM virtual keys
3. Rewrite config templates (balanced-optimized → LiteLLM routing config)
4. Switch Next.js Server Actions to point to LiteLLM
5. Run in parallel for 2-4 weeks
6. Decommission Portkey

**Estimated Effort:** 2-4 days for initial setup, 1-2 weeks for full migration

---

#### Option C: Consider Vercel AI Gateway
**If:**
- Already heavily invested in Vercel ecosystem
- Want simplest possible integration
- Don't need advanced routing/caching

---

## Key Takeaways

1. **Portkey** = Most feature-rich managed solution, but comes with cost and lock-in
2. **LiteLLM** = Best open-source option with largest community and provider support
3. **Bifrost** = Best raw performance, but smaller ecosystem
4. **Helicone** = Best for pure speed, good if you already use Helicone observability
5. **Vercel AI Gateway** = Simplest for Next.js-only teams

For SlideHeroes' size and needs, **LiteLLM offers the best balance** of cost control (free self-host), flexibility (100+ providers), and manageable migration effort.

---

*Research compiled from GitHub repositories, official documentation, and community resources as of March 2026.*
