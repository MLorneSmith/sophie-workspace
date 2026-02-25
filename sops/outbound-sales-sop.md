# Outbound Sales SOP — Signal-Based Selling

**Version:** 1.0 (Draft)
**Created:** 2026-02-21
**Philosophy:** Based on Brendan J Short's "Signal-Based Selling" framework (The Signal newsletter)
**Status:** Draft — to be enriched with additional expert research

---

## Core Principle

> "Timing is 10x more important than copy. Maybe 100x." — Brendan J Short

We do NOT do spray-and-pray. We use **signal-based micro-campaigns** — small, highly-targeted lists (50-250 contacts) triggered by specific signals that make outreach relevant THIS WEEK.

---

## 1. Signal Taxonomy (SlideHeroes-Specific)

### Tier 1: Alpha Signals (Our IP — Not Commoditized)
- Product usage data (signed up but didn't complete first presentation)
- Marketing email engagement (opened/clicked but didn't convert)
- Website visitors who viewed pricing but didn't sign up
- Closed-lost deals being resurrected
- Free tool usage (presentation audit, template downloads)
- Course alumni activity

### Tier 2: Niche Signals (Industry-Specific)
- Consulting firm hiring for "presentation" or "proposal" roles
- Companies posting RFPs or pitch competitions
- New consulting practice launches
- Conference speaking submissions opening
- Firms expanding to new markets (need pitch decks)

### Tier 3: Commodity Signals (Use Sparingly)
- Job changes (new consulting partner, new BD role)
- Funding rounds (need investor decks)
- General intent data
- LinkedIn engagement with presentation content

**Rule:** Every outreach must be triggered by a Tier 1 or Tier 2 signal. Tier 3 only supplements.

---

## 2. Cold Email Framework

### Structure: Connection → Pain → Gain → CTA

```
1. CONNECTION POINT — Why you, why now? (Reference the signal)
2. PAIN — What problem do they have? (Related to the signal)
3. GAIN — What value/insight can we offer? (Give, don't ask)
4. CTA — Next step (Proactive value, NOT "worth 15 min?")
```

### CTA Rules
- ❌ Never: "Worth a quick chat?" / "Open to a call?" / "Want a demo?"
- ✅ Always: Give something first — an audit, an insight, a resource
- Example: "Put together a quick teardown of your latest deck's structure — want me to send it over?"

### Copy Rules
- Short subject lines (3 words or fewer ideal)
- Conversational tone — write like a human text, not a marketing email
- No AI tells: avoid "Was reading...", "That's exactly...", "Curious if your team's explored..."
- No M-dash overuse
- Text-only signatures on outbound domains
- Disable open/click tracking (hurts deliverability)

---

## 3. Micro-Campaign Process

### Step 1: Signal Detection
- Monitor signals daily/weekly using tools (Clay, BigQuery triggers, product analytics)
- Each signal generates a micro-campaign of 50-250 contacts

### Step 2: List Building & Enrichment
- Filter by ICP criteria (individual consultants, small/medium consultancies)
- Enrich with context (what specifically triggered, their situation)
- Verify emails

### Step 3: Draft & Review
- AI drafts personalized emails (90% of work)
- Human reviews and tweaks (10% — the part that matters)
- For high-value accounts: fully manual personalization

### Step 4: Send & Monitor
- Send via warmed domains/mailboxes
- Track: signal → reply → meeting conversion rate
- Campaign lifespan: 1-2 weeks (signals are perishable)

### Step 5: Iterate
- Review campaign performance weekly
- Retire stale signals, add new ones
- Update templates based on what converts

---

## 4. Channel Priority (2026)

1. **LinkedIn first** — Build connections with ICPs, DM for feedback, founder brand content
2. **Cold email second** — Signal-triggered micro-campaigns only
3. **Warm intros third** — Through network, partnerships, community

---

## 5. Tech Stack (Planned)

| Layer | Tool | Status |
|-------|------|--------|
| Signal detection | BigQuery + custom triggers | Partially built |
| Data enrichment | Clay (TBD) | Not started |
| Email sending | Instantly or Smartlead (TBD) | Not selected |
| CRM | Attio | Initial setup done |
| Email engagement | Loops → BigQuery webhook | Code complete, config pending |
| Deliverability | Lavender (TBD) | Not started |

---

## 6. Human-in-the-Loop Rules

| Account Tier | Automation Level |
|-------------|-----------------|
| Enterprise / Dream accounts | AI researches + drafts, human writes final email |
| Mid-market targets | AI drafts, human reviews before send |
| High-volume / inbound follow-up | AI sends, human reviews replies |

---

## 7. Key Metrics

- **Signal → Meeting rate** (target: 10% for Tier 1 signals)
- **Micro-campaign reply rate** (target: 15-25%)
- **Deliverability** (>95% inbox placement)
- **Time-to-outreach** from signal detection (<48 hours)

---

## Sources & Further Reading

- Brendan J Short, "The Signal" — thesignal.club (core framework)
- Research report: `~/clawd/deliverables/cold-email-research-brendan-short.md`
- *Additional expert research pending (Eric Nowoslawski, Becc Holland, Matt Redler, Will Allred)*

---

*This SOP will be enriched as we complete expert research. See Mission Control tasks for progress.*
