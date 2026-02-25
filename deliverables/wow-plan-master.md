# SlideHeroes WOW Plan — Master Document

**Status:** Planning  
**Date:** 2026-02-14  
**Owner:** Mike + Sophie  

---

## Vision

SlideHeroes doesn't just make slides. It makes consultants *better at presenting*. Every WOW moment reinforces this: the product thinks like a senior consultant, knows the audience, structures the chaos, and stress-tests the output.

---

## Core Workflow

```
Profile → Assemble → Outline → Storyboard → Generate
```

**Entry Points (converge at Outline):**
- 📝 Brain Dump (WOW #3) — paste messy thoughts
- 🎯 Guided — step-by-step SCQA builder
- 📄 Upload (WOW #2) — start from existing deck

**Post-Generation:**
- 🤖 Agent Layer (WOW #4) — run specialized agents on the finished deck

---

## The Four WOWs

### WOW #1 — Audience Profiling
**"Know who you're presenting to"**

Before building a single slide, research the specific person and company you're presenting to. Generate an editable Audience Brief that tailors every downstream step — SCQA framing, slide structure, language, data density, tone.

- Input: Name + company or LinkedIn URL
- Research: Person (LinkedIn, career background, published content) + Company (industry, news, strategy, competitive landscape)
- Output: Audience Brief with communication style, what to lead with, what to avoid, format recommendations
- Saved profiles for reuse; refreshed with recent company news on reuse

**Why it's WOW #1:** Used on every single deck. No competitor does this. It's the feature that makes users think "I can't go back to doing this manually."

📄 Full spec: `deliverables/wow1-audience-profiling.md`

---

### WOW #2 — Deck Intelligence
**"Upload → rewrite + extract brand template"**

Upload an existing PowerPoint → two things happen:
1. **Content rewrite:** AI analyzes structure and narrative, identifies weaknesses, rebuilds with consulting-grade SCQA and pyramid structure
2. **Template extraction:** Reads colors, fonts, layouts, master slides → creates a reusable brand template for all future decks

**Why it's WOW #2:** Solves the #1 enterprise adoption barrier (brand templates). Immediate value from existing content. Two-for-one: proves the AI AND locks in the brand.

📄 Full spec: `deliverables/wow2-deck-intelligence.md`

---

### WOW #3 — Brain Dump to Outline
**"Chaos in, clarity out"**

User dumps unstructured thoughts → SlideHeroes transforms them into a structured SCQA framework + complete slide outline in seconds. Alternative entry point to the guided Assemble flow.

**Why it's WOW #3:** The transformation is the magic. Speed is the wow. Teaches consulting structure while automating it. User stays in control (outline, not finished deck).

📄 Full spec: `deliverables/wow3-brain-dump-to-outline.md`

---

### WOW #4 — Agent Layer
**"Specialized AI agents for presentations"**

A suite of agents that each perform a specific analysis or enhancement. Each one is a wow moment. Together, they're a platform.

**Launch candidates:**
- 🎯 **The Partner** (Presentation Coach) — the senior partner who reviews your deck at 11pm
- 📋 **The Skeptic** (Q&A Prep) — that person who asks the uncomfortable question
- 📝 **The Whisperer** (Speaker Notes) — the voice in your ear
- ✂️ **The Editor** (Deck Shrinker) — kills your darlings so you don't have to

**Post-launch:**
- ⚖️ **The Devil's Advocate** (Counter-Argument) — tries to destroy your pitch so nobody else can
- 🔍 **The Auditor** (Fact Checker) — trusts nothing, verifies everything
- 📊 **The Translator** (Data Storyteller) — speaks both numbers and human
- 📏 **The Perfectionist** (Consistency Checker) — won't let it go

**Future:**
- 🏢 **The Spy** (Competitor Scanner), 🌍 **The Diplomat** (Localization), ♿ **The Advocate** (Accessibility), ⏱️ **The Timekeeper** (Timing)

**Why it's WOW #4:** Extensible platform. Each new agent is a feature announcement. Combined with Audience Profiling, agents analyze from the *audience's perspective*.

📄 Full spec: `deliverables/wow4-agent-layer.md`

---

## Feature Requirements (Non-WOW)

### Template Library
Two-dimensional: Visual Themes (look) × Narrative Structures (thinking). Competitors separate content from design. SlideHeroes marries them.

📄 Full spec: `deliverables/feature-template-library.md`

### Future Features (backlog)
- Time Saved Counter — "You've saved X hours ($Y)"
- URL-to-Deck — paste URL → instant presentation
- Smart Suggestions — AI recommends the next deck you need

---

## How the WOWs Reinforce Each Other

```
WOW #1 (Audience Profiling)
  ↓ context feeds into
WOW #3 (Brain Dump) or WOW #2 (Upload) or Guided Assemble
  ↓ produces
Outline → Storyboard → Generate
  ↓ then
WOW #4 (Agents) review, enhance, stress-test
  ↓ using audience context from
WOW #1 (full circle)
```

The audience profile makes everything smarter: the brain dump organizer knows what to emphasize, the deck rewriter knows what tone to use, the agents know what questions the audience will ask.

---

## Competitive Differentiation

| Capability | SlideHeroes | Gamma | Tome | Beautiful.ai | Canva |
|-----------|-------------|-------|------|-------------|-------|
| Audience Profiling | ✅ WOW #1 | ❌ | ❌ | ❌ | ❌ |
| Deck Rewrite + Template Extract | ✅ WOW #2 | ❌ | ❌ | ❌ | ❌ |
| Brain Dump → SCQA Outline | ✅ WOW #3 | Partial | Partial | ❌ | ❌ |
| Specialized Agents | ✅ WOW #4 | ❌ | ❌ | ❌ | ❌ |
| Consulting-Grade Structure | ✅ Core | ❌ | ❌ | ❌ | ❌ |
| Narrative Structures (templates) | ✅ Feature | ❌ | ❌ | ❌ | ❌ |

**No competitor combines audience intelligence with consulting-grade structure and an extensible agent layer.**

---

## Documents

| File | Contents |
|------|----------|
| `deliverables/wow-plan-master.md` | This document — master overview |
| `deliverables/wow1-audience-profiling.md` | WOW #1 full spec |
| `deliverables/wow2-deck-intelligence.md` | WOW #2 full spec |
| `deliverables/wow3-brain-dump-to-outline.md` | WOW #3 full spec |
| `deliverables/wow4-agent-layer.md` | WOW #4 full spec |
| `deliverables/feature-template-library.md` | Template Library feature requirement |
