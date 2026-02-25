# WOW #1 — Audience Profiling: Know Who You're Presenting To

**Status:** Planning  
**Owner:** Mike + Sophie  
**Task:** #436  
**Date:** 2026-02-14  

---

## The Idea

Before building a single slide, SlideHeroes asks: *"Who is this presentation for?"*

The user provides a name and company. SlideHeroes researches the person (LinkedIn) and the company (web, earnings, news), then generates an **Audience Brief** — a profile of who they're presenting to, how that person thinks, what they care about, and how the presentation should be tailored.

This brief feeds into every downstream step. The deck isn't just *about* your topic — it's *for* a specific human being.

**New workflow:** Profile → Assemble → Outline → Storyboard → Generate

---

## Why This Is WOW #1

1. **No tool does this.** Gamma, Beautiful.ai, Tome, Canva — they all ask "what's your topic?" Nobody asks "who's your audience?" That's the consultant's secret weapon — tailoring the message to the room.

2. **It's what senior consultants actually do.** Junior consultants build decks about the *content*. Senior consultants build decks about the *audience*. SlideHeroes teaches good habits while automating them.

3. **It's used on every deck.** Unlike a one-time signup wow, audience profiling is a feature users engage with on *every single presentation*. It's the habit-forming core.

4. **It's a moat.** Building a good audience profiling engine (industry knowledge, role psychology, communication preferences, real-time company research) is hard to replicate. It's domain expertise baked into the product.

5. **Research backing:** AI personalization drives 71% activation lift. This is personalization at the deepest level — not personalizing the product, but personalizing the *output* for the end audience.

---

## The Profile Step — How It Works

### Input
- **Person:** Name + company, or LinkedIn URL
- **Optional:** Role/title (if not on LinkedIn), relationship context ("my client", "my boss", "investor")

### Research Engine

**1. Person Research (LinkedIn + web)**
- Role, seniority, tenure at current company
- Career background (consulting → banking → tech tells you a lot)
- Published content, speaking topics, public positions
- Decision-making style inferred from background
- Education (MBA? Engineering? Finance? — affects communication preferences)

**2. Company Research (web, earnings, news)**
- Industry, size, stage, recent performance
- Current strategic priorities (earnings calls, press releases, annual reports)
- Competitive landscape they're navigating
- Regulatory environment
- Recent news (M&A, leadership changes, product launches)

### Output: The Audience Brief

A structured, editable document the user sees before proceeding:

**Communication Profile**
- Decision-making style: "Data-driven, risk-aware"
- Attention span: "Tight schedules — keep to 15 slides"
- What they trust: "Numbers and scenario analysis over narratives"
- Career context: "Ex-McKinsey → understands frameworks; ex-Treasury → wants financial rigor"

**Strategic Recommendations**
- Lead with: "Cost of inaction — she's been vocal about digital transformation"
- Frame as: "Acceleration, not disruption"
- Avoid: "Don't oversimplify financials. She'll lose trust if numbers feel hand-wavy"
- Include: "Scenario analysis, not just base case"

**Presentation Format**
- Structure: Pyramid principle, conclusion-first
- Executive summary: Slide 2
- Data density: High
- Tone: Formal but not academic
- Frameworks they'll recognize: NPV, risk matrices, etc.
- Length recommendation: 12-15 slides + appendix

### How It Feeds Downstream

| Step | Without Profile | With Profile |
|------|----------------|--------------|
| **Assemble** | Generic SCQA | SCQA framed for *this person's* priorities |
| **Outline** | Logical structure | Structure optimized for their attention pattern |
| **Storyboard** | Standard layouts | Data density matched to their preference |
| **Generate** | Clean deck | Language, tone, emphasis tailored to the room |

---

## Saved Profiles & Reuse

- **Save profiles:** "Sarah Chen — TD Bank CFO" saved to profile library
- **Reuse:** "Present to Sarah Chen again" → pulls up profile, asks "anything changed?" → refreshes with recent company news
- **Team sharing:** Colleagues can use the same audience profiles (future: team/workspace feature)
- **Profile evolution:** Each time you present to someone, the profile gets richer (what worked, what didn't)

---

## Open Questions

1. **LinkedIn data access** — scraping vs. API vs. user pastes the URL and we extract? Legal/TOS considerations
2. **How deep on company research?** Earnings calls and annual reports are gold for public companies, but what about private firms?
3. **Audience Brief visibility** — full editable page before Assemble, or a sidebar panel that persists through all steps?
4. **Multiple audience members?** "I'm presenting to the CFO, CTO, and CEO" — do we create composite profiles?
5. **Anonymous/generic audiences?** "Conference of 200 HR leaders" — still useful without a specific person
6. **Profile accuracy** — how do we handle when LinkedIn data is sparse or outdated?
7. **Privacy** — do we store the research? Can users delete profiles? GDPR considerations for EU audiences

---

## Technical Considerations

- LinkedIn scraping: Proxycurl API, or similar LinkedIn data provider
- Company research: web scraping + LLM summarization of public sources
- Profile storage: per-user, per-workspace
- Real-time refresh: check for new company news when profile is reused
- Context window: Audience Brief needs to be compact enough to feed into every downstream LLM call without burning tokens

---

## Success Metrics

- **Profile creation rate:** % of decks that start with an audience profile
- **Profile reuse rate:** % of profiles used more than once
- **Deck quality lift:** A/B test — decks with profiles vs. without (user satisfaction scores)
- **Activation:** Does creating a profile in the first session predict retention?
- **Time to first deck:** Profile adds a step — does the added value offset the added time?

---

## Complete WOW Roadmap

| # | WOW | Description | Priority |
|---|-----|-------------|----------|
| **1** | **Audience Profiling** | Research who you're presenting to → tailor everything | **Core — every deck** |
| 2 | Zero-Click Value | Demo deck generated at signup from company info | Signup activation |
| 3 | Brief-to-SCQA | One sentence → full consulting framework + outline | Enhances Assemble |
| 4 | Time Saved Counter | "You've saved X hours ($Y)" with consulting economics | Retention/ROI |
| 5 | URL-to-Deck | Paste any URL → instant presentation | Power feature |
| 6 | Upload-to-Upgrade | Upload existing PPT → AI audits + restructures | Acquisition hook |
| 7 | Role-Based Smart Start | Role at signup → tailored templates | Onboarding |
| 8 | Smart Suggestions | After a deck → AI suggests the next one you need | Frequency driver |

---

## Next Steps

- [ ] Mike + Sophie: Resolve open questions (especially LinkedIn data access + multiple audiences)
- [ ] Design the Profile UI/UX — what does the Audience Brief look like?
- [ ] Research LinkedIn data providers (Proxycurl, PhantomBuster, etc.)
- [ ] Define how Profile context flows into Assemble → Outline → Storyboard → Generate
- [ ] Build prototype of the research engine (person + company)
- [ ] Map to PostHog events for measuring profile usage
