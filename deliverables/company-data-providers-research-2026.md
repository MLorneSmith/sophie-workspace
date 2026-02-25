# Company Data Providers Research — WOW#1 Audience Profiling Enrichment

**Date:** 2026-02-21
**Task context:** Improve company profiling for WOW#1 Audience Profiling
**Author:** Sophie

---

## Current Implementation

**Person enrichment:** Netrows API (LinkedIn person search, profile, company details)
**Company web research:** Brave Search API (news, industry context, website content)
**Company brief synthesis:** LLM (OpenAI) — takes Netrows + Brave results → structured CompanyBrief
**Storage:** Supabase `audience_profiles` + `company_briefs` tables (with caching/expiry)

### Current Data Coverage

| Data Type | Current Source | Quality |
|-----------|--------------|---------|
| Person LinkedIn profile | Netrows | ✅ Good |
| Company basic info (industry, size, HQ) | Netrows (LinkedIn company) | ✅ Good |
| Company news & strategic moves | Brave Search + LLM synthesis | ⚠️ Decent but noisy |
| Revenue / financials | None | ❌ Missing |
| Funding history / investors | None | ❌ Missing |
| Tech stack | None | ❌ Missing |
| Employee growth trends | None | ❌ Missing |
| Org chart / key executives | Limited (Netrows person only) | ⚠️ Partial |
| Competitors | LLM inference from Brave results | ⚠️ Unreliable |
| Industry benchmarks | None | ❌ Missing |

### Current Architecture

```
User input (name + company)
  → Netrows: person search → person profile + company details
  → Brave: company news search + industry search + website fetch
  → LLM: synthesize CompanyBrief (archetype, situation, implications)
  → LLM: generate Audience Brief JSON (communication profile, strategic recs, format)
  → Save to audience_profiles + company_briefs (with cache)
```

---

## Gap Analysis: What Would Improve Profiles Most?

For consultants preparing presentations, the highest-value enrichment gaps are:

1. **Revenue / financial context** — knowing if a company is $10M or $10B fundamentally changes how you frame a presentation
2. **Funding / investor context** — for private companies, knowing they just raised Series C from Sequoia changes the narrative
3. **Tech stack** — relevant when presenting technology solutions
4. **Employee growth trends** — hiring = growth signal; layoffs = cost-cutting signal
5. **Competitive landscape** — structured competitor list vs. LLM guessing

---

## Provider Comparison (Relevant to Our Use Case)

### Tier 1: Best Fit for SlideHeroes (startup-friendly, API-first)

| Provider | Strengths for Us | Pricing | API | Private Co Coverage |
|----------|-----------------|---------|-----|-------------------|
| **Crunchbase** | Funding rounds, investors, key people, news, competitors. Perfect for startup/tech clients. | ~$29/mo Pro; API from ~$500/mo+ | ✅ Full REST API | Strong for VC-backed; weak for traditional SMBs |
| **Apollo.io** | We already use it for sales. Has enrichment API with firmographics, technographics, employee count, org data. | Free tier; API ~$0.01-0.10/record; $49/mo+ paid | ✅ Enrichment API | Good breadth; estimates not deep financials |
| **Owler** | Revenue estimates, competitor graphs, news/events. Good for "company vs. competitors" context. | ~$500-2K/mo API | ✅ API available | Good estimates; crowdsourced data |
| **Clay** | Not a data source itself — orchestrates 50+ providers in one workflow. Could unify Crunchbase + Apollo + BuiltWith + Clearbit. | ~$149/mo; enterprise custom | ✅ API + no-code | Depends on underlying providers |

### Tier 2: Strong But Pricier

| Provider | Strengths | Pricing | Notes |
|----------|-----------|---------|-------|
| **People Data Labs (PDL)** | Broad person+company enrichment. Pay-per-record scales well. | ~$0.01-0.10/credit | Good for high-volume enrichment; less "context" more "data fields" |
| **Dealroom** | European startup/scaleup focus. Funding, growth signals. | €500-5K/mo | Great if targeting EU consultants/companies |
| **Harmonic.ai** | AI-powered org charts, hiring signals. Newer. | Custom pricing | Worth evaluating for org intelligence |
| **Diffbot** | AI knowledge graph from web scraping. News, events, org data. | Per-record/subscription | Unique web-derived approach; no LinkedIn dependency |

### Tier 3: Enterprise (Likely Too Expensive for Now)

| Provider | Why Not Now |
|----------|-----------|
| **ZoomInfo** | $15-30K+/year minimum. Best-in-class but enterprise pricing. |
| **PitchBook** | $25K+/year. Deep private equity data. Overkill for beta. |
| **PrivCo** | $10-50K/year. Best private company financials. Future consideration. |
| **6sense / Bombora** | Intent data platforms. ABM-focused, not presentation-focused. |
| **S&P Capital IQ** | $30K+/year. Financial terminal. Wrong product category. |
| **D&B** | $5K+/mo. Legacy enterprise data. |

### Specialist Providers (Complementary)

| Provider | Data Type | Pricing | When to Add |
|----------|-----------|---------|-------------|
| **BuiltWith** | Tech stack detection | ~$295/mo | When "what tech do they use?" matters for presentations |
| **Clearbit (Breeze/HubSpot)** | Real-time enrichment from email/domain | Free tier via HubSpot | Already may have access via HubSpot |
| **SimilarWeb** | Website traffic, digital presence | ~$10K/year | When presenting to digital/marketing companies |

---

## Recommendation: Phased Approach

### Phase 1 — Quick Win (now)
**Add Apollo.io enrichment** to the existing pipeline.
- We already have Apollo and use it for sales.
- Their enrichment API returns: employee count, estimated revenue, industry, tech stack, funding info.
- Per-record pricing means no big upfront commitment.
- Augments Netrows (person data) with richer company firmographics.

**Implementation:** Add an `apollo-enrichment.service.ts` alongside `netrows.service.ts` in the research-audience action. Merge Apollo company data into the `enrichmentData` JSON.

### Phase 2 — Structured Company Intelligence (next quarter)
**Add Crunchbase API** for funding/investor/competitor data.
- Covers the biggest gap: financial context for private companies.
- Structured competitor lists (not LLM guesses).
- News/events from authoritative source.
- ~$500/mo for API access.

### Phase 3 — Orchestration Layer (future)
**Evaluate Clay as an orchestration layer** that unifies multiple providers.
- Instead of calling Netrows + Apollo + Crunchbase + Brave individually, route through Clay.
- Clay handles deduplication, waterfall enrichment (try source A, fall back to B), and caching.
- Reduces implementation complexity as we add more providers.

### Phase 4 — Premium Data (when revenue supports it)
- **BuiltWith** for technographics (when presenting tech solutions)
- **Dealroom** for European company coverage
- **PrivCo** for deep private financials (when serving enterprise consultants)

---

## Impact on CompanyBrief Schema

Adding new data providers would enrich these currently-weak sections:

```typescript
// Enhanced CompanyBrief (additions marked with +)
interface CompanyBrief {
  companySnapshot: {
    name: string;
    industry: string;
    size: string;
    marketPosition: string;
    estimatedRevenue: string;      // + from Apollo/Owler
    employeeGrowth: string;        // + from Apollo (trend)
    fundingStage: string;          // + from Crunchbase
    totalFunding: string;          // + from Crunchbase
    lastFundingRound: {            // + from Crunchbase
      amount: string;
      date: string;
      investors: string[];
    };
  };
  currentSituation: {
    // ... existing fields ...
    techStack: string[];           // + from Apollo/BuiltWith
    hiringTrends: string;          // + from Apollo/Harmonic
  };
  industryContext: {
    // ... existing fields ...
    competitors: CompetitorInfo[]; // + structured from Crunchbase (not LLM-guessed)
  };
}
```

---

## Open Questions

1. **Apollo API access** — do we have API access on our current plan, or is it a separate add-on?
2. **Crunchbase pricing** — need to validate current API pricing for startups (may have changed)
3. **Data freshness** — how often do we need to re-fetch? Current company_briefs cache has an expiry but no refresh trigger.
4. **Compliance** — do any of these providers have restrictions on embedding their data in our product's output (vs. internal use only)?
5. **Rate limits** — at scale, how many enrichment calls per presentation? Currently ~3-5 API calls per profile.
