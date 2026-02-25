# Company Research: How It Adds Real Value Across the Workflow

**Created:** 2026-02-19
**Status:** Approved direction — feeds into Task #574 (Company Research Engine v2)

---

## Two-Profile Model

The system produces **two distinct research artifacts**:

1. **Audience Profile** (the individual) — who they are, how they think, decision-making style, what they trust, career context. Sourced from Netrows/LinkedIn person data + LLM inference.
2. **Company Profile** (the organization) — what the company is going through, industry context, competitive landscape, presentation implications. Sourced from Netrows company data + web research + LLM synthesis.

Both are **researched separately, stored separately, and editable separately**. They combine into the **Audience Brief** — the unified context document that feeds every downstream step.

---

## Core Insight

The real value isn't just *profiling the individual* — it's **understanding the organizational context that shapes what a "good presentation" looks like for this audience**. A great consultant doesn't just know who they're presenting to. They know:

1. What the company is going through right now
2. What's already been said internally (so they don't repeat it)
3. What the competitive landscape looks like
4. What keeps this audience's boss up at night

That's what transforms a generic deck into one that makes the audience think "they really did their homework."

---

## Value by Workflow Step

### 1. Profile Step — Beyond Individual Profiling

**Current:** Company data just enriches the Audience Brief (industry context, size).

**What's missing:** The company's *current situation* shapes what matters in any presentation:

- **Company in trouble** (layoffs, declining revenue, regulatory scrutiny) → the audience is risk-averse, cost-conscious, skeptical of new initiatives. Lead with risk mitigation, not growth.
- **Company growing fast** (acquisitions, new markets, hiring spree) → audience is forward-looking, open to big ideas, but time-starved. Lead with opportunity cost of inaction.
- **Company in transformation** (new CEO, digital transformation, M&A integration) → audience is dealing with change fatigue. Frame as simplification, not another initiative.
- **Industry headwinds** (regulatory changes, AI disruption, market shifts) → the audience has context you should acknowledge, not ignore.

**Value:** The brief doesn't just say "Sarah is a data-driven CFO" — it says "Sarah is a data-driven CFO at a company that just missed earnings expectations and announced a cost optimization program. Lead with ROI and payback period, not vision."

### 2. Assemble Step — Strategic Context Injection

This is where company research could be **transformative**:

- **Auto-suggest relevant frameworks** based on company situation. Company doing M&A? Suggest integration framework. Company entering new market? Suggest market entry analysis.
- **Pre-populate "What they already know"** — if the company just released an annual report mentioning AI strategy, the audience already knows the company line. Don't repeat it; build on it.
- **Inform the Question Type selection** — company in crisis → Diagnostic. Company evaluating options → Alternatives. Company post-decision → Implementation.
- **Provide relevant data points** for supporting arguments — industry benchmarks, competitor moves, market data.

### 3. Outline Step — Framing Intelligence

- **"Don't repeat what they already said"** — if the CEO just gave a keynote about digital transformation, your opening shouldn't be "digital transformation is important." Company research tells you what's already been said so you can build ON it.
- **Competitive framing** — knowing who their competitors are and what they're doing helps frame urgency ("Competitor X just launched this...").
- **Regulatory/compliance context** — especially relevant for financial services, healthcare, etc.

### 4. Storyboard Step — Content Enrichment

- **Relevant stats and data points** surfaced as suggestions for specific slides
- **Industry benchmarks** for comparison slides
- **Company-specific metrics** (if publicly available) for context slides

---

## Company Situation Archetypes

| Archetype | Signals | Presentation Implications |
|-----------|---------|--------------------------|
| **In trouble** | Layoffs, missed earnings, regulatory action | Risk-averse audience. Lead with risk mitigation, ROI, payback period. |
| **Growing fast** | Acquisitions, hiring, new markets | Forward-looking but time-starved. Lead with opportunity cost of inaction. |
| **In transformation** | New CEO, reorg, digital transformation | Change fatigue. Frame as simplification, not another initiative. |
| **Stable/mature** | Steady earnings, market leader | Audience expects polish and benchmarks. Lead with best-in-class comparisons. |
| **Industry disruption** | New regulations, AI impact, market shifts | Acknowledge the elephant in the room. Frame as navigating uncertainty. |

---

## Data Sources

| Source | What it gives us | Cost |
|--------|-----------------|------|
| Netrows company data | Basics (description, industry, size, HQ) | Already have |
| Web search (Brave/Perplexity) | Recent news, strategy shifts, earnings | API cost per query |
| Company website | About page, press releases, leadership | Free (web fetch) |
| Annual reports / 10-K | Strategy, risks, financial metrics | Free (public companies) |
| Industry reports | Market trends, benchmarks | Varies |

---

## Proposed Architecture

```
User enters: "Sarah Chen, TD Bank"
         ↓
┌─ Person Research (Netrows) ──────→ Individual profile
│
├─ Company Research (parallel) ────→ Company brief
│   ├─ Netrows company data (existing)
│   ├─ Web search: "[company] recent news strategy"
│   ├─ Web search: "[company] [industry] trends"
│   └─ LLM synthesis → structured company brief
│
└─ Combined Brief Generation ──────→ Audience Brief
    ├─ Individual profile
    ├─ Company context & current situation
    ├─ Inferred strategic recommendations
    └─ Suggested frameworks & data points
```

### Company Brief Structure (output of company research)

```typescript
{
  companySnapshot: {
    name: string;
    industry: string;
    size: string;           // e.g. "Enterprise (50,000+ employees)"
    marketPosition: string; // e.g. "Top 5 Canadian bank by assets"
  },
  currentSituation: {
    summary: string;        // 2-3 sentence overview
    recentNews: string[];   // Key recent developments
    strategicFocus: string; // What the company is focused on right now
    challenges: string[];   // Known challenges or headwinds
    archetype: string;      // One of the situation archetypes above
  },
  industryContext: {
    trends: string[];       // Relevant industry trends
    regulatory: string;     // Regulatory environment
    competitors: string[];  // Key competitors
  },
  presentationImplications: {
    framingAdvice: string;  // How to frame your message given company context
    topicsToAcknowledge: string[]; // Things the audience already knows about
    relevantBenchmarks: string[];  // Data points worth referencing
    avoidTopics: string[];  // Sensitive areas to steer clear of
  }
}
```

---

## How This Feeds Downstream

| Step | What company research provides |
|------|-------------------------------|
| **Profile** | Enriches Audience Brief with organizational context, informs "Lead with" and "Frame as" |
| **Assemble** | Suggests Question Type, pre-fills context fields, surfaces relevant frameworks |
| **Outline** | Framing intelligence, competitive context, "don't repeat what they already said" |
| **Storyboard** | Data points, benchmarks, industry stats for content slides |
| **Generate** | Tone calibration based on company formality/culture |

---

## Implementation Plan

### Build Order & Dependencies

```
Phase A: Foundation (parallel)
  #576 — Company web research service ──┐
  #578 — company_briefs DB table ───────┤
                                        ▼
Phase B: Synthesis                      
  #577 — Company brief synthesis prompt ─┐
                                         ▼
Phase C: Integration                     
  #579 — Parallel research orchestration ─┐
                                          ▼
Phase D: Brief & UI                       
  #580 — Update Audience Brief generation ─┐
  #581 — Update Profile UI ───────────────┘
                                          
Phase E: Downstream (after core works)    
  #582 — Feed into Assemble step          
  #583 — Feed into Outline/Storyboard     
```

### Task Registry

| # | Task | Priority | Depends On |
|---|------|----------|------------|
| **#576** | Build company web research service (Brave search + web fetch → raw findings) | High | — |
| **#577** | Build company brief synthesis prompt (raw research → structured CompanyBrief) | High | #576 |
| **#578** | Add company_briefs DB table with freshness caching | High | — |
| **#579** | Parallel research orchestration — person + company research simultaneously | High | #576, #577, #578 |
| **#580** | Update Audience Brief generation to incorporate company brief | High | #579 |
| **#581** | Update Profile UI — show company context section in brief display | High | #580 |
| **#582** | Feed company brief into Assemble step context | Medium | #580, #539 |
| **#583** | Feed company brief into Outline and Storyboard prompts | Medium | #580, #523 |

### Related Tasks (from broader Phase 2)

- **#574** — Company research engine v2 (parent/umbrella — superseded by tasks above)
- **#570** — Fuzzy person matching (related — better person search)
- **#569** — Adaptive follow-up questions (can ask company-context questions when research is sparse)
- **#523** — Inject full Audience Brief into downstream prompts (consumer of this data)
- **#539** — Profile → Assemble context flow (consumer of this data)
