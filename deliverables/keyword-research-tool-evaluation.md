# Keyword Research Tool Evaluation

**Task:** #442  
**Date:** 2026-02-11  
**Status:** Recommendation ready  

---

## Requirement

Sophie needs programmatic keyword research capability for blog topic ideation (SOP Phase 1). Specifically:
- **Search volume** — how many people search for this term?
- **Keyword difficulty** — how hard to rank?
- **Related keywords** — semantic variations, long-tail opportunities
- **SERP analysis** — what currently ranks, what's missing?
- **API access** — Sophie must be able to call it programmatically

---

## Recommendation: DataForSEO + Google Search Console

### Why DataForSEO

| Factor | DataForSEO | Ahrefs API | SEMrush API |
|--------|-----------|------------|-------------|
| **Pricing model** | Pay-per-use, $50 min deposit | $500+/mo (API add-on) | $200-500/mo + units |
| **Monthly cost at our volume** | ~$10-20/mo | $500+/mo | $200+/mo |
| **Search volume** | ✅ Exact | ✅ Exact | ✅ Exact |
| **Keyword difficulty** | ✅ | ✅ | ✅ |
| **Related keywords** | ✅ | ✅ | ✅ |
| **SERP analysis** | ✅ Live SERPs | ✅ | ✅ |
| **API quality** | Excellent — REST, JSON, modular | Excellent | Excellent |
| **Rate limits** | Flexible (millions/day possible) | Credit-based | Unit-based |
| **Min commitment** | $50 one-time (never expires) | $500+/mo subscription | $140+/mo subscription |

**DataForSEO wins on cost.** For 4-8 blog posts/month, we need ~100-500 keyword lookups + 20-50 SERP analyses. That's roughly $10-20/month on DataForSEO vs. $500+/month on Ahrefs API. The data quality is comparable for our use case.

**Pricing breakdown:**
- Keywords Data API: $1.10 per 10,000 keywords (~$0.00011/keyword)
- SERP API: ~$0.0006/query (standard)
- $50 deposit could last 3-6 months at our volume
- Free $1 trial credit + unlimited Sandbox testing

### Why Google Search Console (free complement)

GSC gives us something no paid tool can: **our own site's real query data.**
- What queries already drive traffic to SlideHeroes
- Which pages rank for what, and at what position
- Click-through rates by query
- Low-hanging fruit: queries where we rank 5-15 (close to page 1)

**Limitation:** GSC only shows data for our site — no competitor insights or new keyword discovery. That's where DataForSEO fills the gap.

### Combined Stack

| Need | Tool | Cost |
|------|------|------|
| Keyword discovery (volume, difficulty, related) | DataForSEO Keywords API | ~$10-20/mo |
| SERP analysis (what ranks, what's missing) | DataForSEO SERP API | Included above |
| Own site performance data | Google Search Console API | Free |
| Trend analysis & seasonality | Google Trends (web_fetch) | Free |
| Idea generation | Perplexity + web_search | Already available |

**Total estimated cost: $10-20/month** (vs. $500+/month for Ahrefs or $200+/month for SEMrush)

---

## Alternatives Considered

### Tier 1: Enterprise (Rejected — too expensive)
- **Ahrefs API** ($500+/mo) — Best data quality but 25-50x our budget need
- **SEMrush API** ($200+/mo) — Comprehensive but overkill for our volume
- **Moz API** ($99-599/mo) — Smaller index, less SERP depth

### Tier 2: Budget (Considered)
- **Keywords Everywhere** ($10/10K credits) — Good for volume data, weak on difficulty and SERP analysis. No full discovery.
- **Ubersuggest API** ($29-99/mo) — Budget-tier accuracy, not robust for AI automation
- **Mangools/KWFinder** ($49/mo) — Good value but subscription model, less API flexibility

### Tier 3: Free Only (Insufficient)
- **GSC + Google Trends + Keyword Planner** — Covers ~60% of needs but no competitor data, no difficulty scores, limited bulk processing. Fine for manual research but doesn't scale for programmatic use.

### Open Source
- No viable open-source keyword research tools exist that provide search volume data. Volume data requires paid data providers underneath.

### AI-Based Estimation
- Perplexity/Claude can estimate search volumes but accuracy is 20-50% off. Good for ideation, not for data-driven decisions. We should use AI for brainstorming + DataForSEO for validation.

---

## Implementation Plan

### Step 1: DataForSEO Setup (30 min)
1. Create account at dataforseo.com
2. Deposit $50 (one-time, never expires)
3. Test via Sandbox (free, unlimited)
4. Save API credentials to `~/.clawdbot/.env`

### Step 2: Build Keyword Research Script (2-3 hours)
Create `~/clawd/scripts/keyword-research.sh` (or Python) that:
- Takes a seed keyword as input
- Calls DataForSEO Keywords Data API → returns volume, difficulty, related keywords
- Calls DataForSEO SERP API → returns top 10 results with titles, URLs, snippets
- Outputs a structured JSON/markdown file for Sophie to consume

### Step 3: Google Search Console Setup (1-2 hours)
1. Configure GSC API access via `gog` CLI (or direct OAuth)
2. Build `~/clawd/scripts/gsc-query.sh` that:
   - Fetches top queries for slideheroes.com
   - Identifies ranking gaps (positions 5-15)
   - Identifies growing/declining queries

### Step 4: Integrate into Blog Writing Pipeline
- Update `blog-writing` skill to call keyword research in Phase 1
- Feed keyword data into content brief template (Phase 4)
- Track keyword targets per post for performance measurement (Phase 9)

---

## Decision Needed

**Mike:** To proceed, I need:
1. ✅ Approval to create a DataForSEO account ($50 one-time deposit)
2. ✅ Approval to set up Google Search Console API access

Both are low-cost, low-risk. DataForSEO has a free Sandbox for testing before spending any credits.

---

## Sources
- Perplexity research (sonar-pro, 2 queries)
- DataForSEO pricing: dataforseo.com/pricing
- Tool comparison based on current 2025-2026 pricing and API documentation
