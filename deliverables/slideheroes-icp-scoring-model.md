# SlideHeroes ICP Scoring Model

**Status:** Draft — evolving
**Initiative:** #105 — Customer Data Ecosystem
**Task:** #422 — Define ICP scoring model v1
**Last Updated:** 2026-02-10
**Owner:** Mike + Sophie

---

## Framework: Three-Circle Venn Model

Based on the GTM Signals framework (source: [Sohom's GTM Summit talk](https://youtu.be/zuCh9jTgz8g)), we score prospects across three independent dimensions. **No single dimension is actionable alone** — the power is in the overlap.

```
         ┌─────────────┐
        │  ICP / FIT   │
        │  (who they   │
        │    are)      │
        └──────┬───────┘
               │
       ┌───────┼───────┐
      │       │       │
┌─────┴──┐  ┌─┴──┐  ┌─┴────────┐
│ENGAGE- │  │ ★★ │  │READINESS │
│ MENT   │  │ALL │  │(ready to │
│(know   │  │ 3  │  │ buy now) │
│ us)    │  └─┬──┘  │          │
└─────┬──┘    │     └─┬────────┘
      │       │       │
      └───────┼───────┘
              │
        ★★ = Priority accounts
        (all three circles overlap)
```

### Why Three Separate Scores

| Single composite score | Three separate scores |
|---|---|
| High-fit + zero engagement = high score (misleading) | See clearly: great fit, not engaged — nurture campaign |
| Low-fit + high engagement = moderate score (hidden) | See clearly: wrong fit, very engaged — disqualify or reframe |
| Hides WHERE the gap is | Shows exactly what to do next |

**Decision rule:** Only accounts scoring above threshold in **all three circles** get promoted to Attio for active outbound. Two-circle overlaps trigger specific automated workflows.

---

## Circle 1: ICP / Firmographic Fit Score

*"Are they the right company/person for SlideHeroes?"*

This score is **relatively static** — it changes when we learn new info about the company, not based on their behavior.

### Company-Level Signals

| Signal | Criteria | Points | Rationale |
|--------|----------|--------|-----------|
| **Industry** | Strategy/management consulting | +30 | Core ICP — presentations are their deliverable |
| | IT/technology consulting | +25 | High volume of client presentations |
| | Financial advisory / accounting | +20 | Regular pitch decks and client reports |
| | Corporate strategy teams | +20 | Building exec decks daily, high internal need |
| | Professional services (legal, HR, etc.) | +15 | Some presentation needs |
| | Business development teams | +10 | Pitch decks and proposals |
| | Other | 0 | Not target market |
| **Company size** | 10-100 employees | +25 | Sweet spot: enough volume, no in-house design team |
| | 5-9 or 101-500 employees | +15 | Small practices or growing firms |
| | 1-4 employees | +5 | Solo consultant — price sensitive but high pain |
| | 500+ employees | 0 | Other signals (enterprise tools, design teams) will filter |
| **Geography** | English-speaking markets (US, UK, CA, AU, NZ) | +10 | Product is English-first |
| | Western Europe | +5 | Secondary market |
| | Other | 0 | |
| **Revenue** | $1M-$50M | +10 | Can afford $39-49/user/mo without enterprise procurement |
| | $50M-$200M | +5 | May need enterprise features |
| | <$1M or >$200M | 0 | Too small to pay or too large (enterprise sales cycle) |

### Presentation Intensity Signals

*Note: Technographic detection of presentation tools (PowerPoint, Google Slides) is unreliable — nearly every company has M365/Workspace, and desktop app usage can't be observed externally. We use proxy signals instead.*

| Signal | Criteria | Points | Rationale |
|--------|----------|--------|-----------|
| **Presentation-heavy role density** | >50% of staff in consulting/analyst/strategy roles | +20 | High deck volume — these roles build presentations daily |
| | 25-50% in presentation-heavy roles | +15 | Moderate deck volume |
| | 10-25% in presentation-heavy roles | +10 | Some deck work |
| | <10% | 0 | Low presentation intensity |
| **Known competitor usage** | Uses Beautiful.ai, Gamma, Tome (if detectable) | -10 | Switching cost, but also validates need |
| | Has Templafy or enterprise presentation tool | -15 | Locked into enterprise stack |
| **Adjacent tools** | Uses CRM (Salesforce, HubSpot, Attio) | +5 | Sales-oriented, data-driven |
| | Uses proposal tools (Proposify, Qwilr) | +5 | Presentation-adjacent need |

*"Presentation-heavy role density" is calculated from Apollo job title data — reliable and available at scale.*

### Person-Level Signals

| Signal | Criteria | Points | Rationale |
|--------|----------|--------|-----------|
| **Role/Title** | Partner / Principal / Managing Director | +25 | Buyer + feels the pain |
| | Director / VP / Practice Lead | +20 | Budget authority, quality conscious |
| | Manager / Senior Consultant | +10 | User, may champion internally |
| | Analyst / Associate / Junior | +5 | End user, no budget authority |
| **Function** | Strategy / Consulting / Advisory | +10 | Core function |
| | Sales / Business Development | +5 | Pitch decks |
| | Other | 0 | |

### Fit Score Calculation
- **Max possible:** ~140 points
- **Tiers:** A (90+) | B (65-89) | C (40-64) | D (<40)

### Negative / Disqualification Signals
- Personal email domain (gmail, yahoo, hotmail) → -20
- Company is a direct competitor → Disqualify
- Student / academic institution → Disqualify
- Company in decline (layoffs, bankruptcy news) → -15

---

## Circle 2: Engagement Score

*"Do they know we exist, and are they paying attention?"*

This score is **dynamic** — it changes based on interactions with our content, website, brand, and product. Signals **decay over time** (half-life: 14 days).

### Pre-Signup Engagement (awareness & interest)

| Signal | Points | Decay |
|--------|--------|-------|
| Visited homepage | +5 | 14d |
| Visited product/features page | +10 | 14d |
| Visited blog post | +5 per post (max +20) | 21d |
| Visited case studies / testimonials | +10 | 14d |
| Returned visit (2+ sessions) | +15 | 14d |
| Time on site > 3 minutes | +10 | 14d |
| Downloaded lead magnet / resource | +20 | 30d |
| Subscribed to newsletter / on our list | +15 | No decay |
| Opened email (per email, max 5) | +3 | 14d |
| Clicked email link | +10 | 14d |
| Watched video / webinar | +15 | 21d |
| Engaged on social (liked, commented, shared) | +5 | 14d |
| Attended webinar / event | +20 | 30d |
| Referred someone | +25 | 60d |

### Product Activation Ladder (post-signup)

*Based on the AI-Era Activation Ladder framework (Aakash Gupta). See full reference: `deliverables/activation-ladder-framework.md`*

Product activation signals follow a two-rung ladder:
- **Rung 1 — AI-Assisted Activation:** Product delivers value immediately using AI, before user invests significant effort. Goal: 1/10th traditional time-to-value.
- **Rung 2 — User-Driven Activation:** User takes deliberate action proving they found real value for their own work.

**⚠️ SlideHeroes-specific activation moments are TBD.** The exact Rung 1 and Rung 2 moments need dedicated design work — what does our "instant wow" look like? What user action proves real value? See Task #436.

Placeholder scoring (to be refined after activation design):

| Signal | Ladder Rung | Points | Decay |
|--------|-------------|--------|-------|
| Signed up for trial | — | +10 | 30d |
| Completed profiling (role, firm, use case) | Setup | +15 | 30d |
| Experienced AI-assisted activation moment | Rung 1 (AI) | +20 | 14d |
| Completed user-driven activation moment | Rung 2 (User) | +30 | 14d |
| Exported PPTX/PDF | Rung 2 (User) | +20 | 14d |
| Invited team member | Rung 2 (User) | +35 | 21d |
| Returned within 7 days for 2nd session | Habit | +25 | 14d |

### Engagement Score Calculation
- **Tiers:** Hot (60+) | Warm (30-59) | Cool (10-29) | Cold (<10)
- **Time decay:** Score halves every 14 days without new activity (configurable per signal)

---

## Circle 3: Readiness Score

*"Are they ready to BUY right now?"*

This is the **narrowest but most powerful** set of signals. Purely about **buying intent** — not product usage (that's Circle 2). These indicate someone is actively evaluating whether to pay. High readiness + low fit = still disqualify. High readiness + high fit + low engagement = fast-track outbound.

*Note: Product usage signals (created presentation, uploaded materials, exported, invited team) live in Circle 2 (Engagement/Activation Ladder). Circle 3 is strictly buying signals.*

### Phase 1 — Available at Beta (our own data)

| Signal | Points | Decay |
|--------|--------|-------|
| Visited pricing page | +25 | 7d |
| Visited pricing page 2+ times | +40 | 7d |
| Plan comparison / billing page views | +20 | 7d |
| Demo request / "Contact sales" click | +50 | 7d |
| Trial-to-paid conversion page visited | +30 | 7d |
| Asked about team/enterprise pricing | +20 | 7d |

### Phase 2 — Available Soon After (low cost, external)

| Signal | Points | Decay | Source |
|--------|--------|-------|--------|
| Job posting mentions "presentations" or "client deliverables" | +20 | 14d | LinkedIn/Indeed scraping |
| Job posting velocity increasing (week over week) | +15 | 7d | LinkedIn/Indeed scraping |
| Recently raised funding | +15 | 30d | Crunchbase / Apollo |
| Recently hired consultants/analysts | +10 | 21d | Apollo |

### Phase 3 — Defer (expensive, post-traction)

| Signal | Points | Decay | Source |
|--------|--------|-------|--------|
| Browsing competitor G2/Capterra pages | +25 | 7d | G2 Buyer Intent (paid) |
| Searched branded terms ("SlideHeroes") | +30 | 7d | SEMrush/Ahrefs (paid) |
| Searched high-intent keywords ("AI presentation tool for consultants") | +20 | 7d | Bombora / similar (paid) |

### Readiness Score Calculation
- **Tiers:** Now (80+) | Soon (40-79) | Later (10-39) | Not yet (<10)
- **Faster decay:** Readiness signals decay faster (7-14 day half-life) because buying windows close quickly
- **Phase 1 only at beta:** Score will initially be driven by our own product data. External signals layer in as we grow.

---

## The Overlap Matrix: What To Do

| Fit | Engagement | Readiness | Action |
|-----|-----------|-----------|--------|
| A/B | Hot/Warm | Now/Soon | **★ PROMOTE TO ATTIO** — immediate outbound, assign to rep |
| A/B | Hot/Warm | Later | Nurture — they know us, fit is good, stay top of mind |
| A/B | Cool/Cold | Now/Soon | **Fast-track outbound** — they're ready but don't know us. Cold outreach with urgency. |
| A/B | Cool/Cold | Later | Long-term nurture — add to content campaigns |
| C/D | Hot/Warm | Now/Soon | Evaluate — engaged and ready but poor fit. Worth a conversation? Or disqualify. |
| C/D | Any | Any | **Do not promote** — stay in BigQuery TAM only |

### Promotion Threshold (BigQuery → Attio)
- **Automatic:** Fit A/B + Engagement Hot/Warm + Readiness Now/Soon
- **Fast-track:** Fit A/B + Readiness Now (regardless of engagement)
- **Review queue:** Fit C + any two circles high (manual review before promotion)
- **Never promote:** Fit D or disqualified

---

## Implementation Notes

### Where Each Score Lives
- **Fit Score:** Calculated in BigQuery via dbt model. Inputs from Apollo (firmographics, technographics) + enrichment APIs.
- **Engagement Score:** Calculated in BigQuery. Inputs from PostHog (website), email platform (Loops), social listening tools.
- **Readiness Score:** Calculated in BigQuery. Inputs from Supabase (product events), intent data providers, job board scrapers, G2/Capterra intent.

### BigQuery Table
References `icp_scores` table from unified entity model (#421):
```sql
-- Scores stored separately, composite calculated at query time
SELECT
  company_id,
  fit_score,
  fit_tier,           -- A/B/C/D
  engagement_score,
  engagement_tier,    -- Hot/Warm/Cool/Cold
  readiness_score,
  readiness_tier,     -- Now/Soon/Later/Not yet
  CASE
    WHEN fit_tier IN ('A','B')
     AND engagement_tier IN ('Hot','Warm')
     AND readiness_tier IN ('Now','Soon')
    THEN 'promote'
    WHEN fit_tier IN ('A','B')
     AND readiness_tier = 'Now'
    THEN 'fast_track'
    ELSE 'nurture'
  END AS action
FROM icp_scores
```

### Calibration Plan (Early Stage)
1. **Month 1:** Set thresholds based on gut + competitive intel (this document)
2. **Month 2-3:** Collect data from beta users — who converts, who churns?
3. **Month 4+:** Adjust weights based on actual conversion data. Which signals predicted conversion?
4. **Month 6+:** Consider predictive ML if we have 100+ closed deals

---

## Open Questions
- [ ] What weight should technographic signals have vs. industry? (e.g., a non-consulting company that uses PowerPoint heavily)
- [ ] Should we score at account level, person level, or both?
- [ ] What's our data source for engagement tracking pre-PostHog?
- [ ] Do we need an intent data provider (Bombora, G2 Buyer Intent) or can we bootstrap with organic signals?
- [ ] How do we handle "consultant" as a job title at non-consulting companies (e.g., internal strategy teams)?

---

## Changelog
- **2026-02-10:** Initial draft. Three-circle framework adopted from GTM Signals podcast. 6 hypotheses mapped to circles. Scoring tables drafted.
