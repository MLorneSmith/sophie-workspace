# Activation Framework Research for SlideHeroes

**Date:** 2026-02-21
**Task context:** #436 Design SlideHeroes activation moments, #437 Design scoring-triggered motions
**Sources:** Perplexity research, Lenny Rachitsky, Elena Verna, Aakash Gupta (Product Growth), GTMnow/Apollo CRO, Eli Schwartz, our RSS feed library

---

## 1. What Is Activation? (The Experts Agree)

**Activation ≠ setup.** This is the #1 mistake (Elena Verna):

> "Your 'aha' happens when value is delivered, not when setup ends. Verbs should be: publish, send, receive, share, export, deploy — NOT uploading, importing, configuring, generating, creating."

**Lenny Rachitsky's definition (from 500+ product survey):**
> "Your activation milestone (often called the 'aha moment') is the earliest point in your onboarding flow that, by showing your product's value, is predictive of long-term retention."

**Key insight:** Activation is the causal predictor of retention, not just a correlating metric. You need to test causality, not just correlation.

---

## 2. Leading Frameworks

### Lenny's 3-Step Process (Most Practical)
1. **Brainstorm** potential "aha" moments in the user journey
2. **Regression analysis** — find inflection points in retention when users hit those moments
3. **Experiment** — does increasing the % of users hitting that moment actually increase retention? (Proves causality, not just correlation)

### Aakash Gupta's 7-Layer PLG Framework (2026)
From his Mind The Product keynote — the most comprehensive PLG framework I found:
1. **Go to market** — how you acquire with your product
2. **Information for decision** — pricing, case studies, templates
3. **Free-to-paid conversion** — freemium config, billing gates
4. **Activation** — onboarding flow, in-product checklists, homepage
5. **Retention** — habit loops, product updates, ongoing value
6. **Monetization** — pricing tiers and model
7. **Expansion** — cross-user, cross-team

**Rule:** Focus on the most broken layer + 1-2 layers below. If GTM is broken, activation experiments won't have volume.

### Elena Verna's 4 Retention Levers
1. **Activation** — define the true aha moment (value delivered, not setup complete)
2. **Feature adoption** — identify top 5-10 features correlated with retention; increase discovery
3. **Churn recovery** — offboarding flows, involuntary churn (payment failures), resurrection campaigns
4. **Network effects** — shift aha to team-level when possible (Miro moved activation to "team collaborates on board")

### Apollo's Signal-Based Model (from CRO Adam Carr)
- Map customer journey by **Day 7 / Day 14 / Day 28** milestones
- Track behavioral signals to trigger human intervention
- Celebrate **value realized**, not contracts signed
- Replace traditional CSMs with "GTM Engineers" running intervention-based playbooks triggered by product signals

---

## 3. Activation Rate Benchmarks (Lenny, 500+ products)

| Product Type | Good | Great |
|-------------|------|-------|
| B2B SaaS (general) | 20-40% | 40-60% |
| B2C apps | 25-40% | 40-70% |
| Marketplace | 20-30% | 30-50% |

**The benchmark we should target: 40%+ activation rate for our aha moment.**

---

## 4. Activation in Creative/Productivity Tools (Comparable Products)

| Product | Aha Moment | Not the Aha Moment |
|---------|-----------|-------------------|
| **Canva** | User shares/exports a design | Creating a design (that's setup) |
| **Figma** | Team collaborates on a design | Opening the editor |
| **Miro** | Multi-user collaboration on a board | Adding elements to a board |
| **SurveyMonkey** | Getting first survey responses | Creating a survey |
| **Lovable** | Publishing and getting traffic to app | Building the app |
| **Linear** | Completing first issue/sprint | Adding tasks |

**Pattern:** The aha moment is when the user's **audience** or **stakeholder** receives value from what was created — not the creation itself.

---

## 5. SlideHeroes Activation Hypothesis

Applying the pattern above to our product:

### What Is NOT Our Aha Moment
- ❌ Signing up
- ❌ Starting a new presentation project
- ❌ Entering audience details (that's setup)
- ❌ Generating an audience brief (that's still setup)
- ❌ Generating slides (that's creation, not value delivery)

### What IS Likely Our Aha Moment
- ✅ **Exporting/downloading a presentation** — the user has something tangible they can use
- ✅ **Presenting to their audience** — the ultimate value delivery (hard to track)
- ✅ **Sharing a presentation link with someone** — their stakeholder receives value

### Proposed Activation Milestone
**"User exports or shares their first AI-generated presentation."**

This follows Elena's verb rule (export/share = value delivered) and the creative tool pattern (Canva = share/export, not create).

### Secondary Activation Signals
These may predict the primary milestone:
- Generated audience brief (strong setup signal)
- Customized/edited generated slides (engagement signal)
- Returned to the product within 48 hours (retention signal)
- Generated a second presentation (habit formation signal)

---

## 6. Activation Scoring Model

Based on the research, here's a proposed scoring framework:

### Weight Distribution
| Signal | Weight | Rationale |
|--------|--------|-----------|
| Completed onboarding profile | 10% | Setup — necessary but not sufficient |
| Generated first audience brief | 15% | Deep engagement with core value |
| Generated first presentation | 20% | Created output (but not yet value delivery) |
| Edited/customized presentation | 15% | Investment = commitment signal |
| **Exported or shared presentation** | **25%** | **Primary aha moment — value delivered** |
| Returned within 48 hours | 10% | Retention signal |
| Generated second presentation | 5% | Habit formation |

### Score Interpretation
| Score Range | Status | Action |
|-------------|--------|--------|
| 0-20 | Cold | Trigger onboarding nudge sequence |
| 21-50 | Warming | Contextual tips, show templates |
| 51-75 | Activated | Monitor for expansion signals |
| 76-100 | Power User | Trigger upgrade/upsell prompt |

### Scoring-Triggered Motions (#437)
| Score Threshold | Motion | Channel |
|----------------|--------|---------|
| User stalls at 10 for >24h | "Need help getting started?" email with tutorial | Loops transactional |
| User hits 30 (brief generated, no presentation) | "Your audience brief is ready — generate your first deck" | In-app banner |
| User hits 60 (exported first deck) | Celebration moment + "Did it go well?" feedback prompt | In-app modal |
| User hits 75 within 7 days | Upgrade prompt — "You're getting value, unlock more" | In-app + email |
| User at 20 after 7 days | Re-engagement email with case study | Loops automation |
| User reaches 90 | NPS survey + testimonial request | In-app + email |

---

## 7. Multi-Entry Point Activation (Our Specific Challenge)

SlideHeroes has 3 entry points (WOW #1-3). Research suggests:

**Route dynamically via intent detection:**
- **WOW #1 (Guided flow):** Longest setup path but most hand-holding. Activation milestone = same (export/share). Track time-to-first-export.
- **WOW #2 (Upload existing deck):** Shorter setup. Aha = seeing AI improve their existing deck. Track time-to-improvement.
- **WOW #3 (Brain dump):** Fastest to output. Aha = seeing structured presentation from raw ideas. Track time-to-first-export.

**Shared activation milestone** across all three: first export/share. But **time-to-activation** will differ by entry point — track separately.

---

## 8. Key Insight from Apollo CRO (Relevant to Our Scoring)

> "Map the customer journey by Day 7/14/28 and track behavioral signals to trigger human intervention. Whether it's expansion, rescue, or retention, GTM runs on product data. Signal clarity = execution speed."

For SlideHeroes at our stage, "human intervention" = automated email/in-app triggers (not sales reps). But the Day 7/14/28 framework is valuable for designing our scoring decay and trigger timing.

---

## 9. Sources from Our RSS Feed Library

Highly relevant articles from our Substack feeds:

1. **"How to build product-led growth in 2026 (the complete 7-layer playbook)"** — Aakash Gupta (Product Growth)
   - <https://www.news.aakashg.com/p/plg-in-2026>
   - The definitive 2026 PLG framework. Study Canva, Figma, Attio examples.

2. **"Retention: The situationship of SaaS"** — Elena Verna
   - <https://www.elenaverna.com/p/retention-the-situationship-of-saas>
   - 4 retention levers. Critical insight: "churn is a symptom of poor activation."

3. **"PLG to Enterprise: How Adam Carr Turns Product Signals into 9-Figure Revenue"** — GTMnow
   - <https://thegtmnewsletter.substack.com/p/gtm-173-plg-to-enterprise-product-signals-revenue-adam-carr>
   - Apollo CRO on signal-based GTM, Day 7/14/28 milestones, replacing CSMs with GTM engineers.

4. **"Why AI doesn't mean the end of Freemium"** — Elena Verna
   - <https://www.elenaverna.com/p/why-ai-doesnt-mean-the-end-of-freemium>
   - Directly relevant to our pricing/trial strategy (#233). Paid content but summary is key.

5. **"Leverage onboarding flows for SEO"** — Eli Schwartz (Product-Led SEO)
   - <https://www.productledseo.com/p/leverage-onboarding-flows-for-seo>
   - Interesting angle: onboarding as SEO signal.

6. **"How to determine your activation metric"** — Lenny Rachitsky
   - <https://www.lennysnewsletter.com/p/how-to-determine-your-activation>
   - The 3-step process with real examples from Figma, Slack, Airtable, Linear, Sprig.

---

## 10. Recommended Next Steps

1. **Define our aha moment hypothesis:** "User exports or shares first AI-generated presentation"
2. **Instrument PostHog events** for the scoring model signals (task #515)
3. **Build the activation scoring system** — can live in Supabase, compute on each event
4. **Wire scoring to Loops** — trigger email automations at score thresholds
5. **Wire scoring to in-app UI** — progress indicators, celebration moments, contextual nudges
6. **A/B test the aha moment** — validate that export/share correlates with 30-day retention (once we have data)

---

## Open Questions

1. Can we track "presented to audience"? (Maybe via a "presentation mode" event)
2. Should we differentiate between export formats (PPTX vs PDF vs share link)?
3. What's our target time-to-first-export? (Canva = ~5 minutes from signup to first export)
4. How do we handle the "recurring setup" problem Elena describes? (Each new presentation requires fresh audience profiling — same as SurveyMonkey's survey-by-survey problem)
