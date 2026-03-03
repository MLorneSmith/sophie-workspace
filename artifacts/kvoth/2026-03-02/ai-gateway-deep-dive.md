# AI Gateway Deep-Dive: Follow-Up Questions

**Research Date:** March 2, 2026  
**Context:** Follow-up research addressing Mike's three specific questions about Vercel AI Gateway, Bifrost, and Portkey self-hosting.

---

## Question 1: Vercel AI Gateway — Is it included in the Vercel Pro plan?

### Short Answer: No, it's NOT included — it's a separate pay-as-you-go service.

The Vercel AI Gateway is **not bundled** with the Pro plan. It uses a completely separate credit-based billing system.

### Pricing Structure

| Tier | Price | What's Included |
|------|-------|-----------------|
| **Free** | $5/month credit | Limited to the free credit amount; once exhausted, you must purchase credits |
| **Paid** | Pay-as-you-go | Purchase AI Gateway Credits; you're billed for actual usage at provider rates |

**Key Details:**
- AI Gateway uses **credit-based billing** — you preload credits, then usage is deducted
- **No markup** on API calls (you pay provider rates + any applicable platform fees)
- Using **your own API key** (BYOK) has no markup/fee from Vercel
- Auto top-up can be configured to automatically purchase more credits when balance runs low

### What You Actually Get with Pro Plan (Unrelated to AI Gateway)

The Pro plan ($20/user/month) includes:
- 1 TB bandwidth/month
- ~1,000 GB-hours of serverless compute
- 5-minute function timeout (configurable to 13 minutes with Fluid Compute)
- Up to 30,000 concurrent executions
- Standard WAF

**This is NOT the AI Gateway** — this is standard Vercel hosting for your Next.js app.

### Critical Concerns for AI Workloads

From TrueFoundry's testing (January 2026):

1. **Duration Tax**: You pay for every millisecond a function is active. A 30-60 second LLM stream ties up serverless instances the entire time, costing 20-50x more than a 1-second API call.

2. **Hard Timeout Limits**: Even on Pro, functions timeout after 5 minutes (13 min with Fluid Compute). Multi-step agents that need 10-15 minutes will fail with 504 errors.

3. **No GPU Support**: Any heavy model inference must run off-platform. You'll need to host embeddings/RAG elsewhere.

4. **RAG Data Fees**: Fetching large documents triggers bandwidth overages — after 1 TB, it's $0.15/GB.

### Verdict for SlideHeroes

**Not the easiest path.** While Vercel AI Gateway would be simple to enable (it's already in the dashboard), you would:
- Pay for Pro seats ($20/user/month) — you're already paying this
- Pay for AI Gateway credits on top — no free inclusion
- Face hard timeout limits unsuitable for complex AI workflows
- Need separate infrastructure for any heavy AI workloads

If you're already on Vercel Pro, enabling AI Gateway is trivial, but it's not a "free" addition to your existing plan.

---

## Question 2: Bifrost — Is the "Smaller Ecosystem" Concern Valid?

### The Star Count Reality

| Metric | Bifrost | LiteLLM |
|--------|---------|---------|
| GitHub Stars | ~1,900 | ~37,400 |
| Forks | ~205 | ~6,100 |
| Community | Growing | Massive |

**What does 1.9k vs 37k stars actually mean in practice?**

| Aspect | Impact of Smaller Community |
|--------|---------------------------|
| **Stack Overflow/Google answers** | Fewer results; more troubleshooting required |
| **Discord/community** | Smaller support channel (~Discord with ~2k members vs LiteLLM's large community) |
| **Contributors/maintenance** | Fewer external contributors; more dependent on Maxim (the company) |
| **Third-party integrations** | Fewer tutorials, plugins, and community-built tools |
| **Talent/knowledge** | Less likely developers already know Bifrost |

**But:** 1,900 stars is still a healthy, active open-source project. It's not abandoned — it's newer (2024-2025) compared to LiteLLM (2023).

### Is Bifrost Production-Ready?

**Yes.** From the GitHub and docs:

- **Enterprise deployments available** — Maxim offers private deployments with SLA
- **100% success rate at 5k RPS** in their benchmarks
- **Production use cases** — Marketed as "enterprise-grade" with private networking, custom security controls, and governance
- **Actively maintained** — Regular releases, active Discord, enterprise support options

**Who is using it?** The GitHub doesn't publicly list users, but Maxim (the company behind Bifrost) is a VC-backed AI infrastructure company. Enterprise customers exist but aren't publicly named.

### Provider Support

Bifrost supports **15+ providers** including:
- OpenAI ✅
- Anthropic ✅
- AWS Bedrock ✅
- Google Vertex ✅
- Azure ✅
- Cerebras, Cohere, Mistral, Ollama, Groq, and more

This covers SlideHeroes' needs (OpenAI + Anthropic at minimum).

### Performance Claims — Are They Verified?

Bifrost claims **11µs overhead at 5k RPS** on t3.xlarge. 

**What's NOT independently verified:**
- No third-party benchmarks published
- LiteLLM hasn't published counter-benchmarks

**What IS verifiable:**
- The code is open-source (Apache 2.0) — you can test it yourself
- The architecture is sound (Go-based, efficient)
- The metrics are plausible given Go's performance

### Feature Comparison: Bifrost vs Portkey

| Feature | Bifrost | Portkey (Managed) | SlideHeroes Uses? |
|---------|----------|-------------------|-------------------|
| Virtual Keys | ✅ | ✅ | **YES** — using now |
| Config Templates | ✅ (YAML-based) | ✅ (proprietary) | **YES** — `balanced-optimized` etc. |
| Caching | ✅ (semantic) | ✅ (simple + semantic) | Likely using |
| Prompt Management | ❌ | ✅ | Maybe |
| Guardrails | ✅ (Enterprise) | ✅ (50+ built-in) | Not heavily |
| Observability | ✅ (Prometheus, OTel) | ✅ (traces, logs, cost) | **YES** |
| Rate Limiting | ✅ | ✅ | **YES** |
| Load Balancing | ✅ (adaptive) | ✅ | **YES** |

### The Real Concern: Feature Gaps

**What you'd LOSE moving from Portkey to Bifrost:**
1. **Prompt Management** — Bifrost has no built-in prompt templates/versioning
2. **Guardrails** — Bifrost requires Enterprise tier; Portkey includes them in paid plans
3. **Config Compatibility** — Portkey configs won't translate; you'd rewrite routing logic
4. **Observability UI** — Portkey's dashboard is more polished; Bifrost's is newer

### Verdict for SlideHeroes

**The "smaller ecosystem" concern is partially valid but not disqualifying.**
- You CAN do production AI with Bifrost
- The main gap is **prompt management** — if that's critical, it's a problem
- Migration effort: Moderate (different config schema)
- Performance: Excellent if you need speed

---

## Question 3: Portkey Open Source — Can You Self-Host It?

### Short Answer: Yes, but with significant trade-offs.

Portkey has **open-sourced their gateway** (the core routing engine), but the full platform experience requires the managed service.

### What's in the Open-Source Gateway (GitHub: Portkey-AI/gateway)

**Available in open-source:**
- ✅ Multi-provider routing (200+ models)
- ✅ Automatic retries (up to 5)
- ✅ Fallbacks between providers
- ✅ Load balancing across keys/providers
- ✅ Request timeouts
- ✅ Multi-modal support (text, vision, audio)
- ✅ Guardrails (40+ pre-built)
- ✅ Basic caching
- ✅ OpenAI-compatible API
- ✅ Docker/Node.js/Cloudflare Workers deployment

**NOT available in open-source (paid/enterprise only):**
- ❌ Prompt template management UI
- ❌ Advanced analytics dashboard
- ❌ Cost optimization recommendations
- ❌ Organization/workspace management
- ❌ SOC2/HIPAA/GDPR compliance tooling
- ❌ Enterprise SSO
- ❌ Hybrid deployment (data plane in your VPC)

### Self-Hosting Complexity

**Easy path (Docker):**
```bash
npx @portkey-ai/gateway
# Runs on http://localhost:8787
```

**Production path:**
- Docker container
- Kubernetes (via Helm charts)
- Cloudflare Workers
- AWS/Azure/GCP deployments

**Infrastructure requirements:**
- Node.js 18+ or Docker
- Optional: Redis (for caching), database (for logs)
- Optional: Vault integration for API key management

**Maintenance burden:** Medium — you handle updates, scaling, and monitoring yourself.

### What You'd Lose vs Managed Portkey

| Feature | Self-Hosted | Managed |
|---------|-------------|---------|
| Core routing | ✅ | ✅ |
| Virtual keys | ✅ | ✅ |
| Observability UI | ❌ (basic logs only) | ✅ (full dashboard) |
| Cost analytics | ❌ | ✅ |
| Prompt management | ❌ | ✅ |
| Compliance (SOC2/HIPAA) | ❌ | ✅ |
| SSO/ SAML | ❌ | ✅ |
| Support | Community | Paid support |
| Auto-updates | You | Portkey handles |

### Would Self-Hosting Give You "Best of Both Worlds"?

**Pros:**
- Keep using Portkey's familiar config format
- No platform fees (5.5% markup)
- Your data stays on your infrastructure
- Full control over routing logic

**Cons:**
- Lose the analytics dashboard (critical for cost tracking)
- Lose prompt management (if you use it)
- Lose compliance certifications
- Must maintain infrastructure yourself
- No hybrid option (data plane in your VPC) without Enterprise

### Verdict for SlideHeroes

**Not recommended** as a primary strategy:
- You'd lose the analytics/cost tracking that makes AI gateways valuable
- Prompt management may matter for your templates
- The 5.5% platform fee on managed Portkey is reasonable for what you get
- Self-hosting LiteLLM gives you similar control with arguably better open-source maturity

**Consider only if:**
- You have strong infrastructure team to maintain it
- Compliance doesn't require Enterprise
- Cost tracking can be built separately

---

## Summary Recommendations

| Question | Answer | Recommendation |
|----------|--------|----------------|
| **Vercel AI Gateway in Pro?** | No — separate credit billing | Don't enable just because you're on Pro |
| **Bifrost ecosystem valid concern?** | Partially — smaller but active | Good for speed; check prompt management gap |
| **Portkey self-host?** | Possible but loses dashboard/analytics | Better to pay 5.5% than lose observability |

### For SlideHeroes Specifically

Based on your current Portkey usage (virtual keys, config templates, caching, observability):

1. **Stay with Portkey managed** — The 5.5% platform fee is worth the analytics, prompt management, and zero infrastructure overhead
2. **Or migrate to LiteLLM** — If you want to eliminate fees, the migration path is clearer than Bifrost and keeps observability (via Langfuse, etc.)

