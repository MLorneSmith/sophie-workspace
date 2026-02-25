# SlideHeroes Activation Strategy Brief

**Date:** 2026-02-21
**Author:** Sophie (with Mike)
**Status:** Draft — needs collaborative design work

---

## Why This Document Exists

We have several related but disconnected workstreams:
- **WOW moments (#1-3)** define entry points but not the journey between entry and value delivery
- **Onboarding design (#179)** hasn't started — and shouldn't until this strategy exists
- **Activation scoring (#436/#437)** measures where users are but doesn't define what we're optimizing
- **Loops integration (#464)** gives us the automation layer but no playbook to automate

This strategy unifies them. It answers: **"What do we deliberately build into the product to get users from signup to retained customer as fast as possible?"**

---

## The Three Layers

| Layer | Question | Output | Tasks |
|-------|----------|--------|-------|
| **Activation Strategy** (this doc) | What moments do we design? What tactics accelerate time-to-value? | Playbook: aha moments, friction map, delight moments, re-engagement design | NEW (this task) |
| **Activation Scoring** | How do we measure if the strategy is working? | Scoring model: weighted signals, thresholds, cohort analysis | #436, #437 |
| **Scoring-Triggered Motions** | What happens when someone stalls or succeeds? | Automation rules: Loops emails, in-app nudges, celebration moments | #437, Loops integration |

**The strategy must come first.** We need to know *what* we're optimizing before we instrument *how* we measure it.

---

## Aakash Gupta's Activation Tactics (Layer 4)

From his Mind The Product keynote (full YouTube video: https://www.youtube.com/watch?v=fzoFm3so9Ps)

**The old playbook (Box, 2018):**
- Step-based onboarding — "You can only do one thing next"
- Aha moment through gamified tasks + rewards
- Problem: One-size-fits-all forced flow

**The new playbook (Calendly, Canva, 2024-2026):**

| Dimension | 2018 Playbook | 2026 Playbook |
|-----------|--------------|---------------|
| **Onboarding style** | Forced step-based | Personalized forks (3-4 types) |
| **Pacing** | Everyone sees same flow | Self-paced, skip ahead if ready |
| **Gamification** | Tasks + rewards | Rewards integrated but not forced |
| **Where activation happens** | Onboarding flow only | Onboarding + in-app homepage |
| **Goal** | Aha moment | Habit formation |
| **Homepage role** | Dashboard after onboarding | Continuation of onboarding |

**Key tactics:**

1. **Personalized onboarding forks:**
   > "They immediately try to get you personalized into the onboarding that matters for you once they figure out which you are. Are you a salesperson using Calendly? Then we need to connect you to your CRM. But if you're just a person booking a meeting, no, we'll just get you there right away."

2. **In-app homepage for continued activation:**
   > "I really want you guys to focus in on your in-app homepage for activation. Make sure you have your demo video on there. Make sure you have an ability to contact support. Make sure you have an ability to contact sales."

3. **Activation to habit, not just aha:**
   > "Customize your in-app homepage to continue onboarding so that you don't just get activation to setup or activation to aha, but you actually get activation to habit. And that's a mental model that's really important to understand."

**For SlideHeroes:**
- We already have personalized forks (WOW #1/2/3) — need intelligent routing
- In-app homepage should continue activation after first export
- Scoring model needs three tiers: setup → aha → habit

---

## Scope of the Activation Strategy

### 1. Aha Moment Definition

**Hypothesis:** "User exports or shares their first AI-generated presentation."

This follows the pattern from every comparable creative tool:
- Canva: share/export a design (not creating it)
- Figma: team collaborates on a design (not opening the editor)
- SurveyMonkey: getting survey responses (not creating the survey)
- Miro: collaborating on a board (not adding elements)

**Per entry point:**
| Entry Point | Setup Journey | Aha Moment |
|-------------|--------------|------------|
| WOW #1 (Guided) | Audience → Brief → Generate → Edit | Export/share presentation |
| WOW #2 (Upload) | Upload deck → AI analysis → Improve | Export improved presentation |
| WOW #3 (Brain dump) | Raw ideas → Structure → Generate | Export/share presentation |

**Validation approach:** Track retention curves (30-day) for users who export vs. those who don't. Does export predict retention? If yes, we've found our aha. If not, test other candidates.

### 2. Time-to-Value Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| Signup → first audience brief | < 5 min | Canva gets users to first creation in ~5 min |
| Signup → first generated presentation | < 15 min | Must feel fast; AI does the heavy lifting |
| Signup → first export/share | < 20 min | The full aha loop in one session |
| First export → return visit | < 48 hours | Habit formation window |
| First export → second export | < 7 days | Confirms product value beyond novelty |

### 3. Friction Audit

Map every step from signup to aha moment. For each step, ask:
- Is this step **necessary** for value delivery?
- Can we **defer** it to after the aha moment?
- Can we **automate** it (pre-fill, smart defaults, AI inference)?
- Can we **eliminate** it entirely?

**Known friction points to investigate:**
- Account creation (can we defer to after first generation?)
- Audience profiling inputs (how much is truly needed vs. nice-to-have?)
- Waiting for AI generation (how do we make the wait feel valuable?)
- Export format selection (can we default to the most common?)

**Design principle:** Every screen before the aha moment is a potential drop-off point. Ruthlessly minimize them.

### 4. Delight Moments (Micro-WOWs)

The journey shouldn't just be "setup → aha." There should be small surprises along the way that build excitement and demonstrate intelligence:

**Candidate delight moments:**
- **After audience name entry:** "We found that [Name] is [Title] at [Company] — here's what we know about their priorities." (Netrows/Diffbot enrichment surfaced instantly)
- **After brief generation:** "Based on [Name]'s background in [industry], we recommend leading with [approach]." (Strategic recommendations feel like having a consultant on your team)
- **During generation:** Progress indicators that show what the AI is doing ("Analyzing audience preferences... Structuring narrative... Designing visuals...")
- **After first export:** 🎉 Celebration moment — "Your first SlideHeroes presentation is ready! Consultants who use audience-tailored decks see 2x higher engagement." (Made-up stat for illustration — use real data when available)
- **On return visit:** "Welcome back! Your last deck for [Audience] was exported 3 days ago. Ready for your next one?"

### 5. Progressive Disclosure

Don't show everything at once. Reveal features as users need them:

| Session | What's Visible | What's Hidden |
|---------|---------------|---------------|
| First visit | Guided WOW #1 flow, simple inputs | Advanced editing, templates, team features |
| After first export | Upload deck (WOW #2), brain dump (WOW #3) | Team sharing, brand templates |
| After 3rd presentation | Full template library, brand customization | API access, team admin |
| After upgrade | Everything | — |

### 6. Re-engagement Design

**The "recurring setup" problem:** Unlike Amplitude (connect data once, get value forever), SlideHeroes requires fresh setup for each presentation — similar to SurveyMonkey (create survey → get responses → repeat).

**Solutions:**
- **Saved audience profiles** (#513) — reduces setup time for repeat audiences
- **Presentation history** — "Present to [same person] again? Start from your last brief."
- **Templates** — "Last time you presented financials to a CFO. Use that structure again?"
- **Triggers from calendar** — "You have a meeting with [Client] Thursday. Need a deck?"
- **Usage-based email cadence** — adapt to user's natural presentation frequency

### 7. Entry Point Routing

How do we guide users to the right WOW?

**During onboarding, ask ONE question:**
> "What brings you here today?"
> - "I need to create a presentation for a specific person" → WOW #1
> - "I have an existing deck I want to improve" → WOW #2  
> - "I have ideas but need help structuring them" → WOW #3

**Or detect intent from context:**
- User uploads a file → route to WOW #2
- User types a name/company → route to WOW #1
- User types freeform text → route to WOW #3

---

## Relationship to Other Tasks

```
Activation Strategy (THIS)
  ├── defines aha moments for → Onboarding Design (#179)
  ├── defines what to measure for → Activation Scoring (#436)
  ├── defines triggers for → Scoring-Triggered Motions (#437)
  ├── defines email playbook for → Loops Integration (#464, #584)
  ├── informs → Trial Strategy (#233)
  └── connects entry points for → WOW #1-3 implementation
```

---

## Brainstorm Decisions (2026-02-21)

Mike + Sophie brainstorm session:

| Area | Decision |
|------|----------|
| **1. Entry point routing** | Keep current WOW#1-first approach. No additional personalization for now — our workflow is already structured. |
| **2. Friction reduction** | **Investigate deferred account creation** — could be a beta enhancement. Needs technical feasibility check. |
| **3. Micro-WOWs** | ✅ Already implemented. Document what we have, identify any gaps. |
| **4. Aha moment (first export)** | **Incorporate all ideas:** celebration animation, value reinforcement copy, share encouragement, calendar/reminder prompt. |
| **5. Homepage continuation** | **Adapt current homepage** to include: personalized greeting, next-action prompts, demo video, support access, progress indicator. |
| **6. Habit formation** | **Incorporate all ideas:** calendar integration, saved audience profiles, email triggers, template unlock, streak/gamification. |
| **7. Scoring interventions** | Document as part of scoring implementation (#436/#437). |

---

## Implementation Roadmap

### Immediate (for beta)
- **Enhance first export experience** — celebration + copy + share prompt + calendar reminder → **Task #591**
- **Audit current micro-WOWs** — document what we have, identify gaps → **Task #592**

### Post-beta (near-term)
- **Homepage redesign** — personalized greeting, next-action prompts, demo video, support access, progress indicator → **Task #593**
- **Deferred account creation** — technical feasibility investigation
- **Calendar integration** — for re-engagement triggers
- **Saved audience profiles** — already on backlog (#513)
- **Scoring interventions** — wire to Loops automations

---

## How to Use This Document

1. ~~**Mike + Sophie review** this brief and refine the aha moment hypothesis~~ ✅ Done
2. ~~**Design the friction audit** — walk through each WOW flow step by step~~ Deferred — current flow works
3. ~~**Prioritize delight moments** — which ones ship in beta vs. later?~~ ✅ Done — see roadmap above
4. **Implement export experience enhancements** (new task)
5. **Audit micro-WOWs** (new task)
6. **Then** implement scoring (#436/#437) to measure what the strategy defines
7. **Then** wire Loops automations to scoring thresholds
8. **Then** homepage redesign

The strategy is the foundation. Everything else builds on it.
