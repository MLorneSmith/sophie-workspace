# AI Gateway: Prompt Management + Hosting Requirements

**Research Date:** March 2, 2026  
**Context:** Follow-up research addressing Mike's questions about open-source prompt management solutions and hosting requirements for each gateway option.

---

## Question 1: Open Source Prompt Management Solutions

The key finding: **Yes, you can get Portkey-level prompt management by pairing an open-source tool with LiteLLM or Bifrost.** The leading option is **Langfuse**, which provides nearly equivalent functionality to Portkey's prompt management.

---

### 1. Langfuse

**What it does:**
- **Prompt Management** — Centralized prompt versioning, templates, and collaborative editing
- **Prompt Playground** — Built-in playground for testing prompts with different models
- **Version Control** — Full version history with diffs and rollback
- **A/B Testing** — Via datasets and evaluation features
- **Observability** — Tracing, metrics, cost tracking, latency analysis
- **Datasets & Evals** — Test datasets, LLM-as-judge evaluations

**How it integrates:**
- API-based integration with SDKs for Python, JS/TypeScript
- Native integration with LiteLLM (built-in callback support)
- Works alongside any gateway — Langfuse sits alongside, not in the request path
- Example integration with LiteLLM:

```python
from langfuse import Langfuse
from litellm import completion

langfuse = Langfuse()

# Track LLM calls automatically
response = completion(
  model="gpt-4o",
  messages=[{"role": "user", "content": "Hello"}],
  callbacks=[langfuse]
)
```

**Self-hosting:**
- **Docker Compose** — Full stack (PostgreSQL + ClickHouse + Redis)
- **Kubernetes (Helm)** — Production-grade deployment
- **Cloud** — Free tier available (generous limits)

**Community/Maturity:**
- **GitHub Stars:** ~17,000+
- **YCombinator W23** — Well-funded startup
- **Active Development** — Daily releases, large Discord community
- **Production-Ready** — Battle-tested by thousands of companies

**Pricing:**
- **Self-hosted:** Free (open-source)
- **Cloud:** Free tier (generous), Pro from $59/mo

**Verdict for SlideHeroes:** ⭐ **Highly Recommended** — Best match for LiteLLM, excellent prompt management, and integrates natively.

---

### 1.2 Pezzo

**What it does:**
- **Prompt Management** — Version control, templates, instant delivery
- **Observability** — Request logging, cost tracking
- **Caching** — Built-in caching support
- **Collaboration** — Team workflows for prompt iteration

**How it integrates:**
- SDKs for Node.js, Python
- Works as a drop-in replacement for OpenAI SDK
- Can run alongside LiteLLM or Bifrost

**Self-hosting:**
- **Docker Compose** — Requires PostgreSQL + ClickHouse + Redis + Supertokens
- **Complexity:** Higher than Langfuse — more moving parts

**Community/Maturity:**
- **GitHub Stars:** ~2,800
- **Active Development** — Regular releases
- **Smaller Community** — More limited than Langfuse

**Pricing:**
- **Open-source:** Free
- **Cloud:** Pricing not clearly published

**Verdict:** Solid option but Langfuse has better ecosystem and Next.js integration.

---

### 1.3 PromptLayer

**What it does:**
- **Prompt Management** — Store, version, and manage prompts
- **Request Logging** — Track all LLM requests
- **A/B Testing** — Compare different prompt versions
- **Analytics** — Cost and performance tracking

**How it integrates:**
- SDK wraps OpenAI/Anthropic SDKs
- Routes requests through PromptLayer's service
- Works with LiteLLM via their SDK

**Self-hosting:**
- **No self-hosted option** — Cloud-only service

**Community/Maturity:**
- Established in 2023
- Smaller community than Langfuse

**Pricing:**
- Free tier available
- Paid plans from $49/mo

**Verdict:** Cloud-only limits flexibility for self-hosting preference.

---

### 1.4 Helicone (Prompt Management Features)

**What it does:**
- **Primary:** Observability and request logging
- **Prompt Management:** Limited — mainly caching and request tracking
- **Not a full prompt management solution**

**Self-hosting:**
- Docker-based deployment
- Open-source available

**Verdict:** Not recommended as primary prompt management solution.

---

### 1.5 Humanloop

**What it does:**
- **Prompt Management** — Versioning, templates, experiments
- **Evaluation** — A/B testing, user feedback
- **Fine-tuning** — Dataset management for fine-tuning

**How it integrates:**
- SDK-based integration
- Cloud-only (no self-hosted option)

**Community/Maturity:**
- Well-funded startup
- Growing adoption

**Pricing:**
- Free tier available
- Enterprise pricing on request

**Verdict:** Good features but cloud-only limits self-hosting options.

---

### 1.6 Other Noteworthy Options

| Tool | GitHub Stars | Self-Hosted | Best For |
|------|--------------|-------------|----------|
| **Dify** | ~38k | ✅ Docker | No-code LLM apps + prompt management |
| **Langflow** | ~25k | ✅ Docker | Visual flow builder with prompts |
| **OpenWebUI** | ~20k | ✅ Docker | Chat UI with prompt management |

---

### 1.7 Summary: Can You Get Portkey-Level Prompt Management?

| Feature | Portkey | Langfuse | Pezzo | Dify |
|---------|---------|----------|-------|------|
| Prompt Versioning | ✅ | ✅ | ✅ | ✅ |
| Templates | ✅ | ✅ | ✅ | ✅ |
| Playground | ✅ | ✅ | ✅ | ✅ |
| A/B Testing | ✅ | ✅ (via evals) | ✅ | ✅ |
| Collaboration | ✅ | ✅ | ✅ | ✅ |
| Self-Hosted | ❌ (Enterprise) | ✅ | ✅ | ✅ |
| **Verdict** | — | ⭐ Best | Good | Good |

**Answer: Yes.** Pair **Langfuse** (self-hosted or cloud) with **LiteLLM** to achieve Portkey-level prompt management with full self-hosting control.

---

## Question 2: Hosting Requirements for Each Gateway

### Understanding Your Current EC2 Context

Based on typical SlideHeroes setup, your EC2 is likely a **t3.medium** or similar:
- **t3.medium:** 2 vCPU, 4 GB RAM, ~$30.42/month (on-demand us-east-1)
- **t3.small:** 2 vCPU, 2 GB RAM, ~$15.21/month (on-demand us-east-1)

---

### A. LiteLLM Proxy (Self-Hosted)

**What it needs to run:**
- **Runtime:** Python 3.9+ inside Docker
- **Database (optional but recommended for virtual keys):** PostgreSQL
- **Cache (optional):** Redis (required for high traffic 1000+ RPS)
- **Docker Compose** — Easiest deployment method

**Minimum Server Specs:**
- **Development/Minimal:** 2 vCPU, 2 GB RAM (t3.small)
- **Production:** 4 vCPU, 8 GB RAM (t3.medium minimum, t3.large recommended)
- **Storage:** 10-20 GB for logs if not using external DB

**Can it run on your existing EC2?**
- ✅ **Yes, with caveats:**
  - If t3.small (2 GB RAM): Can run LiteLLM only for testing/low traffic
  - If t3.medium (4 GB RAM): Can run LiteLLM + OpenClaw — monitor memory
  - Recommendation: Run LiteLLM alongside OpenClaw if traffic is moderate

**Docker Compose Setup:**
```bash
# Minimal setup (no DB)
docker run \
  -v $(pwd)/litellm_config.yaml:/app/config.yaml \
  -e AZURE_API_KEY=$AZURE_API_KEY \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -p 4000:4000 \
  docker.litellm.ai/berriai/litellm:main-stable \
  --config /app/config.yaml

# Full setup with PostgreSQL + Redis
docker run \
  -e DATABASE_URL=postgresql://user:pass@host:5432/litellm \
  -e LITELLM_MASTER_KEY=sk-1234 \
  -e REDIS_HOST=your-redis-host \
  -p 4000:4000 \
  docker.litellm.ai/berriai/litellm-database:main-stable
```

**Database Requirements:**
- PostgreSQL (required for virtual keys, spend tracking)
- Redis (optional, required for 1000+ RPS or multi-instance deployments)

**Estimated Monthly AWS Cost:**
| Setup | Instance | Monthly Cost |
|-------|----------|--------------|
| Minimal (colocated) | Existing EC2 | $0 additional |
| Dedicated small | t3.small | ~$15/mo |
| Production | t3.medium | ~$30-40/mo |
| With RDS (PostgreSQL) | db.t3.micro | ~$10/mo |
| With ElastiCache | cache.t3.micro | ~$10/mo |

**Total estimated: $30-60/month** for a dedicated LiteLLM setup.

---

### B. Bifrost (Self-Hosted)

**What it needs to run:**
- **Runtime:** Go binary or Docker (no Python dependency)
- **Database:** Optional — file-based config or PostgreSQL for production
- **No external dependencies** — Much simpler than LiteLLM

**Deployment Methods:**
```bash
# Quick start (NPX)
npx -y @maximhq/bifrost

# Docker (recommended for production)
docker run -p 8080:8080 -v $(pwd)/data:/app/data maximhq/bifrost
```

**Server Specs:**
- **Minimal:** 1 vCPU, 512 MB RAM — extremely lightweight
- **Production:** 2 vCPU, 2 GB RAM
- **Benchmark tested on:** t3.medium (4 vCPU, 16 GB RAM) at 5k RPS

**Can it run on your existing EC2?**
- ✅ **Yes, easily:**
  - Uses minimal resources (~64MB RAM according to benchmarks)
  - Can comfortably coexist with OpenClaw on t3.small or t3.medium
  - Recommended: 2 vCPU, 2 GB minimum

**Database Requirements:**
- Optional for basic use
- PostgreSQL recommended for production with virtual keys and analytics

**Estimated Monthly AWS Cost:**
| Setup | Instance | Monthly Cost |
|-------|----------|--------------|
| Minimal (colocated) | Existing EC2 | $0 additional |
| Dedicated small | t3.small | ~$15/mo |
| Production | t3.medium | ~$30/mo |

**Total estimated: $15-30/month** — cheaper than LiteLLM due to lower resource needs.

---

### C. Portkey OSS Gateway (Self-Hosted)

**What it needs to run:**
- **Runtime:** Node.js 18+ or Docker
- **Dependencies:** Optional Redis for caching
- **Note:** Open-source gateway lacks prompt management and analytics UI (those are paid features)

**Deployment:**
```bash
# Quick start
npx @portkey-ai/gateway
# Runs on http://localhost:8787

# Docker
docker run -p 8787:8787 portkeyai/gateway
```

**Server Specs:**
- **Minimal:** 1 vCPU, 1 GB RAM
- **Production:** 2 vCPU, 2-4 GB RAM

**What You Lose (vs Managed Portkey):**
- ❌ Prompt management UI
- ❌ Analytics dashboard
- ❌ Cost tracking
- ❌ Organization management
- ❌ Compliance certifications (SOC2, HIPAA)

**Can it run on your existing EC2?**
- ✅ Yes, minimal footprint

**Estimated Monthly Cost:**
- Similar to Bifrost: ~$15-30/month

---

### D. Can Any Run on Vercel?

**Short Answer: No — all require a persistent server.**

| Gateway | Vercel Compatible? | Why |
|---------|-------------------|-----|
| **LiteLLM** | ❌ | Python runtime not supported on Vercel Functions |
| **Bifrost** | ❌ | Go binary not compatible with Vercel's Node.js edge |
| **Portkey OSS** | ⚠️ Partial | Cloudflare Workers version available, but not Vercel |

**Portkey on Cloudflare Workers:**
```bash
# Deploy to Cloudflare Workers (not Vercel)
npx @portkey-ai/gateway --platform cloudflare
```

**Vercel AI Gateway** is Vercel's own solution:
- Built into Vercel ecosystem
- Uses Vercel credits, not separate billing
- Not truly self-hostable — tied to Vercel

---

### Summary: Hosting Requirements Comparison

| Aspect | LiteLLM | Bifrost | Portkey OSS |
|--------|---------|---------|-------------|
| **Runtime** | Python/Docker | Go/Docker | Node.js/Docker |
| **Min CPU** | 2 vCPU | 1 vCPU | 1 vCPU |
| **Min RAM** | 2 GB (4 GB prod) | 512 MB | 1 GB |
| **External DB** | PostgreSQL (required) | Optional | Optional |
| **Redis** | Optional (required for scale) | Optional | Optional |
| **Can colocate?** | ⚠️ Monitor RAM | ✅ Yes | ✅ Yes |
| **Docker complexity** | Medium | Low | Low |
| **Est. Monthly** | $30-60 | $15-30 | $15-30 |

---

## Recommendations for SlideHeroes

### Option 1: LiteLLM + Langfuse (Recommended)

**Architecture:**
- **Gateway:** LiteLLM (self-hosted on EC2)
- **Prompt Management:** Langfuse (self-hosted or cloud)
- **Observability:** Built into Langfuse

**Pros:**
- Full feature parity with Portkey's prompt management
- No platform fees (5.5% savings)
- Largest community and provider support
- Native Langfuse integration with LiteLLM

**Cons:**
- Two systems to manage instead of one
- Slightly higher operational complexity

**Estimated Cost:** $30-50/month (LiteLLM on existing or new t3.medium + Langfuse cloud/free)

---

### Option 2: Bifrost + Langfuse

**Architecture:**
- **Gateway:** Bifrost (self-hosted)
- **Prompt Management:** Langfuse

**Pros:**
- Better raw performance (<15µs overhead)
- Lower resource usage
- Simpler deployment than LiteLLM

**Cons:**
- Smaller community (1.9k stars vs 37k)
- Fewer integrations than LiteLLM

**Estimated Cost:** $15-30/month

---

### Option 3: Stay with Portkey Managed

**Keep using Portkey if:**
- Prompt management is critical and you want single-pane-of-glass
- 5.5% platform fee is acceptable
- Don't want to manage two systems

**Estimated Cost:** $50-200/month + 5.5% markup on LLM spend

---

## Action Items

1. **If choosing LiteLLM:** Deploy on existing EC2 (t3.medium) alongside OpenClaw, add PostgreSQL for virtual keys
2. **If choosing Bifrost:** Even lighter — can run on t3.small
3. **For prompt management:** Deploy Langfuse (Docker Compose) or use free cloud tier
4. **Test in staging** before production migration

---

*Research compiled from GitHub repositories, official documentation, and AWS pricing as of March 2026.*
