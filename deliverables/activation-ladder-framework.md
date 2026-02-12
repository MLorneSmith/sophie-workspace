# Activation Ladder Framework — AI-Enabled PLG

**Source:** Aakash Gupta (former VP Product, Apollo.io) on [PLG Summit podcast](https://www.youtube.com/watch?v=csYEBY7WEtw)
**Captured:** 2026-02-10
**Status:** Reference — needs SlideHeroes-specific application

---

## The Traditional Model: Setup & Habit

Traditional PLG activation tracked two moments:
1. **Setup Moment** — User completes initial configuration (connects accounts, fills profile, imports data)
2. **Habit Moment** — User returns and performs the core action repeatedly (proves stickiness)

This was the standard "aha moment" framework. Find the action that correlates with retention, then optimize onboarding to get users there fast.

## The AI-Era Evolution: Activation Ladder

Aakash argues AI-enabled products need a **new two-rung ladder** because AI fundamentally changes time-to-value:

### Rung 1: AI-Assisted Activation
- The product uses AI to deliver value **immediately**, before the user does much work
- Goal: **1/10th the traditional time-to-value**
- The "setup" IS the AI-assisted moment — AI does the work, user sees the result

**Apollo.io example:** User signs up → AI detects their domain → infers their business and ICP → presents "Here are 10 contacts you should reach out to" → drafts personalized emails for each contact. Value delivered in minutes, not days.

**Key enabler: Profiling questions (or inference)**
- Ask the right profiling questions at signup → AI can personalize the first experience
- OR infer from domain, email, role (skip questions entirely)
- Bad profiling = hallucination, unhelpful output, failed activation
- Need AI evals to measure how correctly inferences are being made

**Modern approach:** Many companies are skipping explicit profiling questions and instead:
1. Inferring context from domain/email (via Apollo, Clearbit, etc.)
2. Using AI to personalize the first experience
3. Running AI evals to validate inference quality
4. Only asking questions when inference confidence is low

### Rung 2: User-Driven Activation
- User takes a **deliberate action** proving they found real value
- This is the traditional "aha moment" but it now comes AFTER AI has already shown value
- Proves the user has moved from "wow, cool demo" to "I'm using this for my work"

**The ladder creates a progression:**
```
Sign up
  → AI-Assisted Activation (instant value, AI does the work)
    → User-Driven Activation (user invests their own effort)
      → Habit Formation (user returns repeatedly)
```

## Broader PLG + AI Context from the Podcast

Aakash covered several PLG layers and how AI impacts each:

1. **Activation / Onboarding** — AI-assisted activation ladder (above)
2. **Pricing / Free Tiers** — Free trial or freemium model design
3. **Expansion / PQL** — Product-qualified lead signals for upsell
4. **Marketing & Sales / GTM** — How AI changes the go-to-market motion

### Key Quote on Time-to-Value
> "Your TTV should be like one-tenth if you're a regular product and you're thinking about how do I reinvent myself with AI... Somebody's going to figure out how to get people to value in one-tenth of time. So best be you."

### Profiling vs Inference Trade-off
> "The one thing I'm finding with clients that are fully AI-enabled is just the profiling questions are really, really important to get the AI-assisted activation right. If you don't, then good luck. It could be hallucinating and not that helpful."

> "A lot of cases, people I work with, they're not asking profiling questions anymore because they can infer a lot from the domain and who is joining."

## Open Questions for SlideHeroes Application

- [ ] What is our Rung 1 (AI-Assisted Activation) moment? What can we deliver instantly based on who signs up?
- [ ] What profiling questions do we need vs what can we infer from domain/role?
- [ ] What is our Rung 2 (User-Driven Activation) moment? What action proves real value?
- [ ] How do we measure the ladder? What metrics track progression through rungs?
- [ ] What does the "1/10th time-to-value" look like for presentation creation?
- [ ] How does Ragie (knowledge engine) play into AI-assisted activation?

---

## Related
- ICP Scoring Model: `deliverables/slideheroes-icp-scoring-model.md` (Circle 2: Engagement Score uses activation signals)
- Aakash Gupta's newsletter: Product Growth (Substack)
- Apollo.io case study: Activation = reveal email + send outreach
