# Signal Detection System Design: Tier 2-3 Signals

**Task:** #607 — Design future signal detection system (Tier 2-3)
**Status:** Design complete, pending implementation
**Last Updated:** 2026-02-24
**Owner:** Sophie
**Dependencies:** #598 Tier 1 signals operational

---

## Executive Summary

This document designs the signal detection infrastructure for Tier 2 (LinkedIn engagement) and Tier 3 (external data sources) signals. These signals complement Tier 1 (content engagement from our owned properties) and enable proactive outbound to high-intent prospects.

**Key Decisions Needed from Mike:**
1. Sales Navigator subscription timing ($99/mo)
2. RB2B trial (free tier available, then ~$99/mo)
3. Clay evaluation priority ($149-349/mo)
4. Google Alerts setup (free, but needs account)

---

## Signal Taxonomy Recap

| Tier | Source | Detection Method | Current State |
|------|--------|------------------|---------------|
| **1** | Owned content (blog, email, website) | PostHog, Loops, BigQuery | Partially operational |
| **2** | LinkedIn engagement | Manual daily check + future automation | Designed, not implemented |
| **3** | External sources | RB2B, Clay, Sales Navigator, News | Not implemented |
| **4** | Commodity signals (funding, job changes) | Apollo, Crunchbase | Low priority, avoid alone |

This document focuses on **Tier 2** and **Tier 3**.

---

## Tier 2: LinkedIn Engagement Signals

### Philosophy

LinkedIn engagement signals are the highest-converting outbound triggers because the prospect has *already shown interest in Mike*. These are "hand-raisers" — people who engaged with content, viewed the profile, or followed.

**Detection Method (Phase 1):** Manual daily check by Mike (10 min routine)
**Detection Method (Phase 2):** Sales Navigator + Clay automation (after subscription)

### Signal Catalog

| Signal | Priority | Expected Response Rate | Detection Method | Volume Estimate | Recommended Action |
|--------|----------|------------------------|------------------|-----------------|-------------------|
| **Content shares** | Highest | 50-60% | LinkedIn notifications + manual check | 1-3/week | DM within 24h with value-add |
| **Post comments (ICP match)** | High | 45-55% | LinkedIn notifications | 5-15/week | DM acknowledging their point + offer insight |
| **Profile views (ICP match)** | Medium | 30-40% | LinkedIn analytics / Sales Navigator | 20-50/week | Connection request with personalized note |
| **Post likes (ICP match)** | Lower | 30-35% | Manual check (not notified) | 30-50/week | Connection request (batch weekly) |
| **New follows (ICP match)** | Lower | 30-40% | LinkedIn notifications | 5-10/week | Thank + engage with their content |

### ICP Matching Criteria

Before reaching out, filter engagement by ICP fit:

1. **Role match:** Partner, Director, Strategy lead, BD/proposals, CoS
2. **Company match:** Consultancy, advisory, or corporate strategy team
3. **Geography:** English-speaking markets (US, UK, CA, AU)
4. **Company size:** 10-500 employees (sweet spot)

**Non-ICP engagement:** Don't ignore — engage casually but don't invest in outbound sequence.

### Daily Routine (Manual Phase)

**Time:** 10 minutes, every morning before deep work

| Step | Action | Time |
|------|--------|------|
| 1 | Check LinkedIn notifications for shares, comments, follows | 2 min |
| 2 | Go to Analytics → Profile views, filter for ICP matches | 3 min |
| 3 | Scroll recent post engagements, note ICP likers not yet connected | 3 min |
| 4 | Queue priority actions (max 5/day to avoid LinkedIn jail) | 2 min |

### Action Playbook (Maps to Outbound SOP)

| Signal | Response Window | Action Template |
|--------|-----------------|-----------------|
| **Share** | <24h | DM: "Hey [Name], really appreciate you sharing that! [Reference their specific add]. I've got a deeper breakdown on [related topic] — want me to send it over?" |
| **Comment** | <24h | DM: "Hey [Name], your comment on [topic] was spot on, especially [specific point]. We're seeing similar things at [similar companies]. If useful, I can share what's working for them." |
| **Profile view** | <48h | Connection request: "Hi [Name], saw you stopped by my profile. I help [their company type] with [problem]. Would love to connect." |
| **Like** | Batch weekly | Connection request: "Hi [Name], thanks for the engagement on my posts. Noticed you're in [their space] — we work with similar firms. Would love to connect." |
| **Follow** | <48h | DM: "Thanks for the follow, [Name]! What brought you to my profile? Always curious what resonates." |

### Automation (Phase 2 — After Sales Navigator)

**Tool:** Sales Navigator ($99/mo) + Clay ($149/mo) or Phantombuster ($69/mo)

**Workflow:**
1. Sales Navigator saved searches for ICP filters
2. Clay/Phantombuster scrapes profile viewers and engagers
3. Enrichment: Match against ICP criteria
4. Output: Daily CSV of prioritized signals → BigQuery → Attio
5. Human review before any outreach

**Build priority:** Low — manual process works at current scale. Automate when Mike has >500 followers and engagement volume exceeds 30 min/day to process.

---

## Tier 3: External Signal Sources

### 3A. Website Visitor Identification (RB2B)

**What it does:** Identifies companies visiting slideheroes.com by matching IP addresses to business domains. Some plans also identify individual visitors via LinkedIn matching.

**Signal value:** Very high — someone at a target company visited our website. Combined with ICP fit, this is a strong buying signal.

| Attribute | Detail |
|-----------|--------|
| **Tool** | RB2B (https://www.rb2b.com) |
| **Pricing** | Free tier: 25 companies/mo. Pro: ~$99/mo (50 companies), Growth: ~$199/mo (200+ companies) |
| **Detection method** | JavaScript pixel on slideheroes.com |
| **Data returned** | Company name, domain, page(s) visited, time on site. Higher tiers: individual LinkedIn profiles |
| **Expected volume** | 10-50 companies/week depending on traffic |
| **Response rate** | 25-35% (cold but highly relevant) |

**Recommended Action:**
1. ICP filter: Check fit score (industry, size, geography)
2. Page filter: Prioritize pricing page, features page, demo page visitors
3. LinkedIn search: Find decision-makers at the company
4. Outreach: Connection request + personalized note referencing their interest area (infer from pages visited)

**Implementation steps:**
1. Sign up for RB2B free tier
2. Install tracking pixel (requires access to slideheroes.com)
3. Set up webhook to BigQuery or daily CSV export
4. Build ICP scoring filter in BigQuery
5. Route high-fit visitors to Attio for outreach queue

**Dependencies:** Privacy policy update (#586) to disclose visitor identification.

**Build priority:** High — low cost, high signal value, enables proactive outreach to interested companies.

---

### 3B. Job Posting Monitoring (Clay)

**What it does:** Monitors job boards for postings that indicate presentation-heavy hiring. Signals that a company is scaling a function that produces decks.

**Signal value:** Medium-high — indicates organizational need, not individual interest. Longer sales cycle but strong ICP signal.

| Attribute | Detail |
|-----------|--------|
| **Tool** | Clay (https://www.clay.com) |
| **Pricing** | Starter: $149/mo (1,000 enrichments). Explorer: $349/mo (10,000 enrichments) |
| **Detection method** | Job board scraping + keyword matching |
| **Keywords** | "board deck", "investor deck", "pitch presentation", "consulting deliverables", "client proposals", "PowerPoint", "slide design", "narrative", "storytelling", "pyramid principle" |
| **Role filters** | Strategy, Corp Dev, Chief of Staff, BD/Proposals, FP&A, Transformation |
| **Expected volume** | 5-20 matches/week |
| **Response rate** | 15-25% (cold outreach to hiring manager) |

**Recommended Action:**
1. Research the company: Why are they hiring for this role now?
2. Identify hiring manager (often listed in job posting)
3. LinkedIn outreach: Reference the role, offer relevant insight
4. Example: "Saw you're hiring a [role]. We work with similar teams — happy to share what high-performing [roles] do differently with their decks."

**Alternative (free):** Google Alerts for job posting keywords + manual LinkedIn search. Lower coverage but zero cost.

**Build priority:** Medium — valuable signal but Clay subscription adds cost. Start with Google Alerts.

---

### 3C. News & Event Monitoring

**What it does:** Tracks news events that trigger presentation needs: new contracts, acquisitions, leadership changes, regulatory deadlines.

**Signal value:** Medium — indicates organizational moment, not individual interest. Best for warm intro or timely outreach.

| Attribute | Detail |
|-----------|--------|
| **Tool options** | Google Alerts (free), Feedly (free-$12/mo), Clay ($149+/mo), Mention ($29+/mo) |
| **Detection method** | Keyword monitoring across news sources |
| **Keywords (per trigger category)** | See detailed list below |
| **Expected volume** | 5-15 relevant alerts/week |
| **Response rate** | 20-30% (timely, relevant congratulations/insight) |

**Trigger Categories & Keywords:**

| Trigger | Keywords | Target Role | Outreach Angle |
|---------|----------|-------------|----------------|
| **Contract win** | "[consultancy name] + awarded", "wins contract", "selected for", "engagement" | Partner, BD lead | "Congrats on [contract]! Scaling pitch materials is the next challenge — happy to share what similar firms do." |
| **Acquisition/merger** | "acquires", "merger", "integration" | Corp Dev, Integration PMO | "Integration decks are brutal. We help firms align the narrative across workstreams." |
| **Strategic review** | "strategic review", "transformation", "restructuring" | Strategy, CEO, CFO | "Strategic narrative is half the battle. Happy to share a framework we use." |
| **New firm founded** | "launches consulting firm", "founded", "new advisory" | Founder | "Founder-to-founder: building your pitch materials from scratch? Let me share a shortcut." |
| **Funding round** | "raises", "Series A/B/C", "funding" (filter for advisory/consulting) | CEO, Partner | "Congrats on the raise! Investor updates are now a thing — we can help." |
| **Regulatory deadline** | "[regulation] + deadline", "compliance date", "effective date" | CISO, Compliance, Risk | "Briefing the board on [regulation] readiness? We help structure the narrative." |

**Google Alerts Setup (Free, Immediate):**

Create alerts for:
```
"consulting firm" + "wins contract"
"consulting firm" + "acquires"
"management consulting" + "strategic review"
"boutique consulting" + "founded"
"advisory firm" + "raises"
intitle:"presentation" + "consulting"
```

Frequency: Daily digest
Delivery: Email → Zapier → BigQuery (optional) or manual review

**Build priority:** High — Google Alerts is free and immediate. Start with 5-10 alerts, refine based on signal quality.

---

### 3D. Sales Navigator Alerts

**What it does:** Monitors LinkedIn for role changes, promotions, and company updates at target accounts.

**Signal value:** Medium — commoditized signal (everyone has this), but valuable for timely congratulations + relationship building.

| Attribute | Detail |
|-----------|--------|
| **Tool** | LinkedIn Sales Navigator |
| **Pricing** | Core: $99/mo. Advanced: $149/mo. Advanced Plus: $1,600/yr |
| **Detection method** | Saved searches + alerts |
| **Signal types** | Job changes, promotions, new hires, company news |
| **Expected volume** | 10-30 alerts/week (depending on saved search size) |
| **Response rate** | 25-35% (warm, timely) |

**Recommended Actions:**

| Signal | Response Window | Action |
|--------|-----------------|--------|
| **Promotion at ICP company** | <48h | Congratulate + offer insight for new role: "New scope often means new decks to build..." |
| **New hire (presentation-heavy role)** | <1 week | Welcome + offer onboarding help: "First 30 days at a consultancy = lots of decks. Happy to share a shortcut." |
| **Job change to ICP company** | <48h | Congratulate + reconnect: "Congrats on the move! [Company] is great. Let me know if I can help with anything." |
| **Company news (expansion, new practice)** | <1 week | Congratulate + relevant offer: "New practice launch means new pitch materials..." |

**Saved Search Setup:**

1. **Target accounts:** Save list of 100-200 ICP companies (consultancies, advisory, corporate strategy)
2. **Role filter:** Partner, Director, VP Strategy, CoS, BD, FP&A
3. **Geography filter:** US, UK, CA, AU
4. **Alert frequency:** Daily or real-time

**Build priority:** High — foundational tool for LinkedIn outbound. Subscribe when ready to commit to LinkedIn-first strategy.

---

## Implementation Roadmap

### Phase 1: Free & Immediate (Week 1)

| Action | Tool | Cost | Owner |
|--------|------|------|-------|
| Set up Google Alerts (5-10 queries) | Google Alerts | Free | Sophie |
| Document daily LinkedIn routine | Manual | Free | Sophie |
| Train Mike on daily engagement routine | Manual | Free | Mike |

**Deliverables:**
- [ ] Google Alerts configured and emailing Mike
- [ ] Daily routine checklist created
- [ ] Response templates documented (already in SOP)

### Phase 2: First Paid Tools (Month 1-2)

| Action | Tool | Cost | Owner | Gated By |
|--------|------|------|-------|----------|
| Subscribe to Sales Navigator | LinkedIn | $99/mo | Mike | Mike's decision |
| Sign up for RB2B free tier | RB2B | Free | Sophie | Privacy policy update (#586) |
| Install RB2B pixel | RB2B | Free | Sophie | Website access |

**Deliverables:**
- [ ] Sales Navigator saved searches configured
- [ ] RB2B tracking live
- [ ] BigQuery pipeline for RB2B events (if webhook available)

### Phase 3: Scale & Automate (Month 3+)

| Action | Tool | Cost | Owner | Gated By |
|--------|------|------|-------|----------|
| Upgrade RB2B to Pro | RB2B | $99/mo | Mike | Volume justifies |
| Evaluate Clay for job posting monitoring | Clay | $149/mo | Sophie | Budget approval |
| Build automated signal pipeline | BigQuery + Attio | Infra time | Sophie | Phase 2 operational |

**Trigger for Phase 3:** LinkedIn engagement volume exceeds 30 min/day to process manually, OR RB2B free tier hits limit.

---

## Cost Summary

| Tool | Monthly Cost | Annual Cost | Priority | Status |
|------|-------------|-------------|----------|--------|
| Google Alerts | Free | Free | Immediate | Not started |
| LinkedIn (organic) | Free | Free | Immediate | Active |
| Sales Navigator Core | $99 | $1,188 | High | Not subscribed |
| RB2B Free | Free | Free | High | Not started |
| RB2B Pro | $99 | $1,188 | Medium | After free tier |
| Clay Starter | $149 | $1,788 | Low | Defer |
| **Total (Phase 1-2)** | **$99-198** | **$1,188-2,376** | | |

---

## Success Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| **Signals detected/week** | Total Tier 2-3 signals surfaced | 30-50 |
| **ICP-matched signals/week** | Signals passing ICP filter | 10-20 |
| **Signal → outreach rate** | % of ICP signals that trigger outreach | 80%+ |
| **Signal → response rate** | % of signal-triggered outreach that gets a response | 30%+ |
| **Signal → meeting rate** | % of signals that result in a booked call | 5-10% |
| **Time to detect** | Average time from signal to awareness | <24h |
| **Time to action** | Average time from awareness to outreach | <48h |

---

## Open Questions for Mike

1. **Sales Navigator timing:** Ready to subscribe now, or wait until content cadence is established?
2. **RB2B privacy:** Task #586 (privacy policy update) is a blocker. When can this be addressed?
3. **Clay budget:** Is $149/mo justified, or should we stick with Google Alerts for job monitoring?
4. **Manual capacity:** Can you commit to 10 min/day for the manual LinkedIn routine?
5. **Signal prioritization:** Which trigger categories feel most valuable for SlideHeroes? (Contract wins? Job postings? Promotions?)

---

## Appendix A: Google Alerts Query Templates

```
# Contract wins (consultancies)
"consulting firm" AND ("wins contract" OR "awarded" OR "selected")
"management consulting" AND "engagement"
"advisory" AND ("wins" OR "awarded")

# M&A / Integration
"consulting firm" AND ("acquires" OR "merger" OR "acquisition")
"advisory" AND "integration"

# New firms / Expansion
"launches consulting firm"
"founded" AND "advisory"
"new practice" AND "consulting"

# Strategy moments
"strategic review" AND ("consulting" OR "advisory")
"transformation" AND "consulting"
"restructuring" AND "consultancy"

# Presentations (direct)
intitle:"presentation" AND "consulting"
"pitch deck" AND "consultancy"
"board presentation" AND "advisory"
```

---

## Appendix B: Signal → Action Quick Reference

| Signal Source | Signal Type | Response Window | Primary Action |
|---------------|-------------|-----------------|----------------|
| LinkedIn | Share | <24h | DM with value-add |
| LinkedIn | Comment | <24h | DM acknowledging point |
| LinkedIn | Profile view | <48h | Connection request |
| LinkedIn | Like | Weekly batch | Connection request |
| LinkedIn | Follow | <48h | Thank + engage |
| RB2B | Pricing page visit | <48h | LinkedIn search → connect |
| RB2B | Features page visit | <72h | LinkedIn search → connect |
| Sales Navigator | Promotion | <48h | Congratulate + offer |
| Sales Navigator | New hire | <1 week | Welcome + offer |
| Google Alerts | Contract win | <72h | Congratulate + offer |
| Google Alerts | New firm | <1 week | Founder outreach |
| Clay/Job boards | BD/proposals hire | <1 week | Hiring manager outreach |

---

## Changelog

- **2026-02-24:** Initial design document created (Task #607)
