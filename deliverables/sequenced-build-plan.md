# SlideHeroes Sequenced Build Plan

**Created:** 2026-02-18
**Status:** Draft v2 for Mike's review

---

## The Problem

We have ~130 open tasks across 30+ initiatives with no clear sequencing. This plan answers: **in what order do we build everything, and are we missing anything?**

## Guiding Principles

1. **Everything ships.** Every task is needed for the beta MVP. This plan is about *order*, not scope cuts.
2. **Build testable increments.** Each phase should end with something Mike can click through and validate. Human-in-the-loop testing at every stage.
3. **Front door first.** The new workflow entry point ships early — even with placeholder steps behind it — so the full flow is testable as pieces land.
4. **Dependencies drive order.** Things that unblock other things come first. Things that depend on everything come last.

---

## What Already Exists (Current App State)

- ✅ Blocks/Assemble form (presentation type, question type, SCQA fields)
- ✅ Canvas (outline editing)
- ✅ Storyboard page (exists, unclear completeness)
- ✅ Publisher/Generate page (exists, PPT generation has bugs)
- ✅ AI Gateway with prompt templates
- ✅ Supabase DB with `building_blocks_submissions`
- ✅ Portkey for model routing
- ❌ No audience profiling (just a free-text string)
- ❌ No agent layer / Mastra
- ❌ No upload/brain dump entry points
- ❌ No new workflow shell (Profile → Assemble → Outline → Storyboard → Generate)

---

## Phase 1: The Foundation (Week 1-4)
*Build the front door and fix what's broken behind it*

**Goal:** Mike can navigate the full 5-step workflow end-to-end. Some steps are the existing implementation, some are scaffolded. But the *shape* is testable.

### 1A: Implementation Audit (Week 1, first half)

Before building anything new, assess every existing implementation piece against the Product Design Bible and workflow specs. For each piece, determine:
- **✅ Use as-is** — works, just needs wiring into the new shell
- **🔧 Minor tweaks** — fundamentally sound, needs updates (e.g. new props, layout adjustments, API changes)
- **🔴 Rebuild** — conceptually misaligned or too brittle to adapt; needs redesign

| # | Task | MC Task | Depends On |
|---|------|---------|------------|
| 1.0 | **Audit existing implementation against Product Design Bible** | #530 | — |

**Audit scope:**

| Component | Location | Key Questions |
|-----------|----------|---------------|
| Assemble form (Blocks) | `apps/web/app/home/(user)/ai/blocks/` | Does the form structure match the new Assemble step? Are presentation types, question types, SCQ fields still correct? Can it accept an Audience Brief as input? |
| Outline / Canvas | `apps/web/app/home/(user)/ai/canvas/` | Is this a real outline editor or just a viewer? Does it support agent suggestions? Can it receive context from Profile + Assemble? |
| Storyboard | `apps/web/app/home/(user)/ai/storyboard/` | How complete is this? Does it map narrative → slides? Or is it a stub? |
| Publisher / Generate | `apps/web/app/home/(user)/ai/publisher/` | What's the current PPT generation pipeline? What's broken (#333)? Template system? |
| AI Gateway prompts | `ai-gateway/` or prompt templates | Are prompts structured for the new context flow (Audience Brief → SCQA → Outline)? Or hardcoded for the old free-text audience string? |
| Data model | `building_blocks_submissions` table | Can this evolve to support the new workflow, or does the agentic data model (#502) replace it? |
| Dashboard / Home | `apps/web/app/home/(user)/ai/page.tsx` | What's the current landing experience? Can it become the Presentations List? |
| Navigation / Routing | App router structure | Is the current routing compatible with a 5-step linear flow, or does it assume a different UX pattern? |
| Portkey / Model routing | Existing config | Working? Compatible with Mastra integration later? |

**Output:** A written audit report (`deliverables/implementation-audit.md`) with a verdict (✅/🔧/🔴) for each component, estimated effort for tweaks/rebuilds, and any surprises that affect the plan.

**Mike reviews:** The audit report. This is the first HITL checkpoint — before any code is written, we agree on what we're keeping, tweaking, and rebuilding.

---

### 1B: UI Design Pass (Week 1, second half → Week 2)

With audit findings in hand, design the visual implementation of the integrated workflow before building anything.

**Inputs:**
- `deliverables/workflow-ui-design.md` — the approved UI architecture spec (5-step wizard, Presentations List, Project Dashboard, agent side panel, quality indicators, downstream invalidation)
- `deliverables/saas-design-analysis.md` — Webflow/Gamma/Beautiful.ai pattern analysis
- `deliverables/implementation-audit.md` — what exists and what needs rebuilding
- `deliverables/audience-brief-ui-ux-editable-profile-page.md` — Profile step spec
- `deliverables/product-design-bible.md` — overall product vision

| # | Task | MC Task | Depends On |
|---|------|---------|------------|
| 1.0b | **Design visual implementation of workflow UI** — layout, component library, interaction patterns, design language for the full 5-step experience | #270 | 1.0 |

**Scope:**
- Presentations List layout (table vs grid, card design)
- Project Dashboard (step progress visualization)
- 5-step wizard chrome (top bar vs left rail, step indicator design)
- Profile step layout (search → card → adaptive questions → Brief)
- Assemble step layout (sub-steps, materials panel, Argument Map)
- Outline / Storyboard / Generate step layouts
- Agent side panel design (icon bar, streaming output, accept/reject)
- Quality indicators and invalidation warning patterns
- Responsive considerations
- Design language: colour palette, typography, spacing, component patterns (informed by Webflow analysis)

**Output:** Design spec or wireframes (`deliverables/workflow-visual-design.md` or equivalent) that the shell build follows.

**Mike reviews:** The visual design before any implementation begins. This is the second HITL checkpoint — we agree on how it looks before writing code.

---

### 1C: New Workflow Shell (Week 2-3)

| # | Task | MC Task | Depends On |
|---|------|---------|------------|
| 1.1 | Build Presentations List page (home/dashboard) | #325 | 1.0 |
| 1.2 | Build 5-step workflow navigation (Profile → Assemble → Outline → Storyboard → Generate) | #531 | 1.0 |
| 1.3 | Wire existing Assemble form into Step 2 (or scaffold replacement per audit) | #532 | 1.0, 1.2 |
| 1.4 | Wire existing Canvas/Outline into Step 3 (or scaffold per audit) | #533 | 1.0, 1.2 |
| 1.5 | Wire existing Storyboard into Step 4 (or scaffold per audit) | #534 | 1.0, 1.2 |
| 1.6 | Wire existing Publisher/Generate into Step 5 (or scaffold per audit) | #535 | 1.0, 1.2 |
| 1.7 | Profile step = placeholder (skip for now, wire later) | #536 | 1.2 |

**Mike tests:** Navigate the full flow. Create a new presentation. Step through all 5 tabs. Profile is a "coming soon" placeholder. Steps 2-5 are either the existing implementation rewired, or scaffolded replacements — depending on audit findings.

### 1D: Fix Core Bugs (Week 3)

| # | Task | MC Task | Depends On |
|---|------|---------|------------|
| 1.8 | Debug & fix PPT generation | #333 | 1.6 |
| 1.9 | Fix workflow bugs (state management, nav issues) | #331 | 1.2 |
| 1.10 | Storyboard completion (if incomplete, per audit) | #327 | 1.5 |
| 1.11 | Presentation export (PPTX/PDF working cleanly) | #329 | 1.8 |

**Mike tests:** Go through a real presentation end-to-end using the new shell. Get a working PowerPoint out. Note what breaks.

### 1E: Data Architecture (Week 3-4)

| # | Task | MC Task | Depends On |
|---|------|---------|------------|
| 1.12 | Define Zod schemas for all typed artifacts | #476 | — |
| 1.13 | Build `audience_profiles` table + API | #522 | — |
| 1.14 | Migrate audience field from free-text string → structured Brief | #519 | 1.13 |
| 1.15 | Plan `building_blocks_submissions` → agentic data model migration | #502 | 1.12 |
| 1.16 | Create Supabase migration for agentic layer DB schemas | #498 | 1.15 |

**Mike tests:** N/A (backend only) — but schemas are reviewable as specs.

---

## Phase 2: Audience Profiling — WOW #1 (Week 4-6)
*The feature that makes SlideHeroes different from every competitor*

**Goal:** The Profile step goes from placeholder to fully functional. User types a name → gets a research-backed Audience Brief → it feeds downstream.

### 2A: Research Engines (Week 4)

| # | Task | MC Task | Depends On |
|---|------|---------|------------|
| 2.1 | Build person research engine (Netrows integration) | #511 | 1.13 |
| 2.2 | Build company research engine (web, earnings, news, strategy) | #510 | — |
| 2.3 | Build person + company research tools (unified interface) | #478 | 2.1, 2.2 |
| 2.4 | Define adaptive question bank per Audience Map quadrant | #527 | — |

**Mike tests:** Call the research APIs directly (or via a test UI). Enter a real person. Review the data quality. Are the questions good? Does company research return useful context?

### 2B: Profile UI (Week 5)

| # | Task | MC Task | Depends On |
|---|------|---------|------------|
| 2.5 | Refactor flow: replace Profile placeholder with real Step 1 | #518 | 1.7, 2.1 |
| 2.6 | Build Audience Brief HITL UI (two-step: "Who?" → "What do we know?") | #479 | 2.3, 2.4 |
| 2.7 | Saved profiles & reuse system (profile library) | #513 | 1.13 |
| 2.8 | Handle sparse/missing data gracefully (fallback for unknown profiles) | #517 | 2.6 |

**Mike tests:** Full Profile step. Enter "Sarah Chen, TD Bank" → see profile card → answer adaptive questions → review the generated Brief. Try someone obscure with sparse data. Try reusing a saved profile.

### 2C: Downstream Integration (Week 6)

| # | Task | MC Task | Depends On |
|---|------|---------|------------|
| 2.9 | Update `presentation-context.ts` to inject full Audience Brief | #523 | 1.14 |
| 2.10 | Extend ai-gateway: replace audience-suggestions with research-backed profiling | #520 | 2.3, 2.9 |
| 2.11 | Audit all ai-gateway prompt templates against Context Engineering SOP | #524 | 2.9 |
| 2.12 | Leverage onboarding data to contextualize audience recommendations | #521 | 2.6 |
| 2.13 | Multi-audience & generic audience profiles (composite + conference mode) | #514 | 2.6 |
| 2.14 | Build Audience Profiling workflow (WOW #1) | #477 | 3.2, 2.3 |

**Mike tests:** Create a full presentation WITH audience profiling. Compare the outline and slides to one created without. Is the audience awareness visible? Does the SCQA framing reflect the Brief? This is the key "is it actually better?" validation.

---

## Phase 3: Agent Layer — WOW #4 (Week 8-10)
*The extensible platform that turns AI into a team of specialists*

### 3A: Mastra Foundation (Week 7)

| # | Task | MC Task | Depends On |
|---|------|---------|------------|
| 3.1 | Mastra validation spike (prove it works in our stack) | #473 | — |
| 3.2 | Set up Mastra singleton + storage + vector store | #474 | 3.1 |
| 3.3 | Integrate Mastra with existing AI Gateway + Portkey | #501 | 3.2 |
| 3.4 | Resolve Portkey ↔ Mastra model routing architecture | #503 | 3.3 |
| 3.5 | Configure Mastra memory stack for SlideHeroes | #486 | 3.2 |
| 3.6 | Align agentic layer with existing account/team multi-tenancy | #504 | 3.2, 1.16 |
| 3.7 | Build model routing policy per agent | #495 | 3.4 |

**Mike tests:** Technical review of spike output. Does Mastra work? Can it call models through Portkey? Memory working?

### 3B: First Agents (Week 8)

| # | Task | MC Task | Depends On |
|---|------|---------|------------|
| 3.8 | Implement Partner (Coach) agent | #483 | 3.2 |
| 3.9 | Implement Skeptic (Q&A Prep) agent | #483 | 3.2 |
| 3.10 | Build agent error handling, retry logic & rate limiting | #499 | 3.2 |
| 3.11 | Build agent results persistence & version history | #497 | 1.16 |
| 3.12 | Build cost tracking and attribution system | #488 | 3.2 |

**Mike tests:** Run Coach and Skeptic on a real outline (even if via CLI/API, before UI). Review the output quality. Are the suggestions useful? Does Coach sound like a senior partner? Does Skeptic ask uncomfortable questions?

### 3C: Agent UI (Week 9)

| # | Task | MC Task | Depends On |
|---|------|---------|------------|
| 3.13 | Build Agent Discovery & Launch UI (sidebar + smart suggestions) | #493 | 3.8 |
| 3.14 | Build streaming progress UI for agent runs | #496 | 3.13 |
| 3.15 | Build agent suggestions UI (accept/reject per suggestion) | #485 | 3.13 |
| 3.16 | Extend existing suggestions UI for agent output types | #507 | 3.15 |
| 3.17 | Ensure agent output → TipTap editor compatibility | #505 | 3.8 |
| 3.18 | Ensure agent modifications maintain PPTX export compatibility | #506 | 3.8, 1.11 |

**Mike tests:** Full agent experience in the app. At Outline step, open the side panel. Launch Coach. Watch streaming output. Accept a suggestion — does it update the outline? Launch Skeptic. Are the Q&A prompts realistic?

---

## Phase 3D: Chaining & Post-Process Orchestration (Week 10)
*Make agents work together and run in parallel*

| # | Task | MC Task | Depends On |
|---|------|---------|------------|
| 3.19 | Build post-process workflow (parallel agent orchestration) | #484 | 3.8, 3.9 |
| 3.20 | Implement agent chaining & batch execution | #494 | 3.8 |

**Mike tests:** Run Coach + Skeptic and then a chained/batched run. Confirm post-process orchestration can coordinate multiple agents and persist results.

---

## Phase 4: Content Intelligence & Entry Points (Week 11-12)
*RAG pipeline, brain dump, upload/deck intelligence, Ragie, template library, brand extraction*

| # | Task | MC Task | Depends On |
|---|------|---------|------------|
| 4.1 | Build RAG pipeline for deck context | #487 | Phase 2, Phase 3 |
| 4.2 | Brain Dump to Outline (WOW #3) | #481 | Phase 2, Phase 3 |
| 4.3 | Upload/Deck Intelligence — content rewrite (WOW #2) | #482 | Phase 2 |
| 4.4 | Ragie Integration (Upload → Extract → Populate) | #330 | 4.3 |
| 4.5 | Template library (visual themes + narrative structures) | #537 | Phase 1 |
| 4.6 | Brand extraction from uploaded decks | #540 | 4.3 |

**Mike tests:** Try Brain Dump: paste messy notes → does it produce a structured SCQA outline? Try Upload: upload an existing deck → does the rewrite improve it? Do both paths converge correctly into the standard flow at Outline? Confirm RAG improves outline/storyboard quality.

---

## Phase 5: Polish & Advanced Agents (Week 13-14)
*Advanced agents (Devil's Advocate, Auditor, Translator, Perfectionist), outline polish, observability, metrics*

### 5A: Advanced Agents

| # | Task | MC Task | Depends On |
|---|------|---------|------------|
| 5.1 | Implement Devil's Advocate, Auditor, Translator, Perfectionist | #490 | Phase 4 |
| 5.2 | Build agent quality eval framework & regression tests | #500 | 5.1 |

### 5B: Workflow Polish

| # | Task | MC Task | Depends On |
|---|------|---------|------------|
| 5.3 | Outline UI polish | #326 | Phase 4 |
| 5.4 | Define Phase 2–4 PostHog events & success metrics | #515 | Phase 4 |
| 5.5 | Set up observability export + agent quality evals | #489 | Phase 4 |

**Mike tests:** Run advanced agents and confirm polish/metrics are in place. Full flow feels smooth end-to-end.

---

## Phase 7: Onboarding, Homepage & Launch Prep (Week 15-16)
*Make it ready for real users*

### 7A: User-Facing

| # | Task | MC Task | Depends On |
|---|------|---------|------------|
| 7.1 | Design new customer onboarding experience | #179 | Phase 2 |
| 7.2 | Homepage design exploration | #362 | — |
| 7.3 | Website homepage implementation | #332 | 7.2 |
| 7.4 | Redesign app UI and establish design language | #270 | Phase 1 |
| 7.5 | Pricing page UI | #150 | 7.8 |

### 7B: Business & Payments

| # | Task | MC Task | Depends On |
|---|------|---------|------------|
| 7.6 | Test payments end-to-end | #335 | — |
| 7.7 | Stripe Products configuration | #343 | 7.6 |
| 7.8 | Business decisions — pricing & product config | #342 | — |
| 7.9 | Decide on trial strategy | #233 | 7.8 |

### 7C: Launch

| # | Task | MC Task | Depends On |
|---|------|---------|------------|
| 7.10 | App & website testing (pre-beta milestone) | #341 | All above |
| 7.11 | Set up Sleekplan for feedback, bugs, roadmap | #339 | — |
| 7.12 | Identify people for beta feedback | #338 | — |
| 7.13 | Beta testing & polish — E2E testing and bug fixes | #367 | 7.10 |
| 7.14 | Invite beta testers | #340 | 7.13 |
| 7.15 | Beta launch | #337 | 7.14 |

**Mike tests:** Full onboarding flow as a new user. Sign up → onboard → create first presentation → export. Payments work. Homepage makes sense. Feedback tool is live.

---

## Phase 8: Growth Infrastructure (Post-Beta)
*Everything needed to acquire, nurture, and retain users*

### 8A: Email & Marketing

| # | Task | MC Task | Depends On |
|---|------|---------|------------|
| 8.1 | Migrate email platform: ActiveCampaign → Loops | #246, #467 | — |
| 8.2 | Sign up for Loops + build BigQuery sync | #463 | — |
| 8.3 | Integrate Loops into SlideHeroes app | #464 | 8.1 |
| 8.4 | Overhaul email autoresponder series | #171, #383, #384 | 8.1 |
| 8.5 | Update autoresponder to include product-focused emails | #384 | 8.4 |
| 8.6 | Re-write Welcome email for app context | #418 | 8.4 |
| 8.7 | Create conclusion to series (offer?) | #415 | 8.4 |
| 8.8 | Remove underperforming/weak emails | #416 | 8.4 |
| 8.9 | Change font to align with new site style | #417 | 8.4 |
| 8.10 | Create new product onboarding campaign | #400 | 8.1, 7.1 |

### 8B: Outbound & Sales

| # | Task | MC Task | Depends On |
|---|------|---------|------------|
| 8.11 | Build cold outbound email engine | #185 | 8.1 |
| 8.12 | Select cold outbound email tech stack | #399 | — |
| 8.13 | Gather good cold outbound email examples | #209 | — |
| 8.14 | Import cold outbound prospects | #406 | 8.12 |
| 8.15 | Create social selling campaign | #199 | — |
| 8.16 | Develop custom outbound triggers | #472 | 8.11 |
| 8.17 | Explore tools for outbound personalization | #391 | — |

### 8C: CRM & Data

| # | Task | MC Task | Depends On |
|---|------|---------|------------|
| 8.18 | Setup CRM (folk CRM) | #402, #403 | — |
| 8.19 | Import Google Mail contacts | #405 | 8.18 |
| 8.20 | Build ICP-filtered company search in Apollo + export CSV | #470 | — |
| 8.21 | Apollo → BigQuery sync pipeline | #424 | — |
| 8.22 | BigQuery → Attio promotion pipeline | #432 | 8.21 |
| 8.23 | BigQuery → Instantly/Loops outbound triggers | #433 | 8.21 |

### 8D: Analytics & Tracking

| # | Task | MC Task | Depends On |
|---|------|---------|------------|
| 8.24 | Setup PostHog analytics end-to-end | #113 | — |
| 8.25 | Set up RB2B visitor identification | #453, #465, #466 | — |
| 8.26 | Build Loops → BigQuery Cloud Function | #455 | 8.2 |
| 8.27 | Conversion attribution dashboard | #435 | 8.24 |
| 8.28 | Design scoring-triggered motions | #437 | 8.24 |
| 8.29 | Design SlideHeroes activation moments | #436 | 8.24 |
| 8.30 | Start Airbyte EC2 instance + update DNS | #458 | — |

---

## Phase 9: Content & Brand (Post-Beta)
*Content marketing, SEO, thought leadership*

| # | Task | MC Task | Depends On |
|---|------|---------|------------|
| 9.1 | Blog fix — CMS images | #354 | — |
| 9.2 | Blog fix — public rendering | #355 | — |
| 9.3 | Run production test of Sophie Loop (blog E2E) | #347 | 9.1, 9.2 |
| 9.4 | Build Capture System v2 | #262 | — |
| 9.5 | SlideHeroes Manifesto — thought leadership | #461 | — |
| 9.6 | Create 'Local Presentation Training' content system | #155 | — |
| 9.7 | Build PowerPoint tools collection page | #157 | — |
| 9.8 | Optimize SEO | #160 | — |
| 9.9 | Add more testimonials to website | #168 | — |
| 9.10 | Consider AirOps for content optimization | #395 | — |
| 9.11 | Use Surfer SEO for content review | #396 | — |
| 9.12 | App positioning discussion — update context files | #448 | — |
| 9.13 | Re-evaluate SlideHeroes brand | #169 | — |

---

## Phase 10: Platform & Operations (Post-Beta)
*Infrastructure, security, integrations, business ops*

### 10A: Platform

| # | Task | MC Task | Depends On |
|---|------|---------|------------|
| 10.1 | Implement products, user groups, permissions | #106 | — |
| 10.2 | Fix email redirect links in Supabase | #109 | — |
| 10.3 | Setup Cloudflare Zaraz for consent management | #111 | — |
| 10.4 | Setup Makerkit email templates | #112 | — |
| 10.5 | Test supabase-seed command | #116 | — |
| 10.6 | Update model choice to Sonnet 5 (when available) | #263 | — |
| 10.7 | Segment existing subscribers & customers | #181 | 8.18 |
| 10.8 | Import existing customers | #202 | 8.18 |
| 10.9 | Import website prospects from Thinkific + old Drip | #178 | 8.18 |

### 10B: Business Operations

| # | Task | MC Task | Depends On |
|---|------|---------|------------|
| 10.10 | Sort out Xero setup (Hubdoc, receipts, updates) | #227, #407 | — |
| 10.11 | Investigate Huuman Inc for bookkeeping | #257 | — |
| 10.12 | Sort out automated HST tax filing | #258 | — |
| 10.13 | Consider affiliate program (PromoteKit) | #245 | 7.15 |

### 10C: Growth Features

| # | Task | MC Task | Depends On |
|---|------|---------|------------|
| 10.14 | Select customer feedback/roadmap tool | #117 | — |
| 10.15 | Integrate digital credentials/badges | #210 | — |
| 10.16 | Add gamification | #212 | — |
| 10.17 | Explore Video Ask for funnel | #208 | — |
| 10.18 | Brainstorm lead magnet for corporates | #207 | — |
| 10.19 | Build quote configuration page | #248 | — |
| 10.20 | Grok video for homepage | #369 | — |
| 10.21 | YouTube RSS feed integration | #370 | — |
| 10.22 | Plan phased product launch | #232 | 7.15 |
| 10.23 | Prepare Product Hunt launch | #142 | 10.22 |
| 10.24 | Soft launch to existing customers | #374 | 7.15 |
| 10.25 | Select people for beta (duplicate of #338) | #372 | — |
| 10.26 | Social media highlights | #218 | — |
| 10.27 | Explore social media management tools | #167 | — |
| 10.28 | YouTube 'productivity tool' influencers | #392, #393 | — |
| 10.29 | Deploy SlideHeroes Feedback Worker to Cloudflare | #419 | — |

---

## Summary Timeline

```
PRODUCT BUILD (Phases 1-5):
  Week 1-4:   Phase 1 — The Foundation (audit → UI design → shell → bugs → data)
  Week 5-7:   Phase 2 — Audience Profiling (research → UI → integration)
  Week 8-10:  Phase 3 — Agent Layer (Mastra → agents → agent UI → chaining)
  Week 11-12: Phase 4 — Content Intelligence & Entry Points (RAG, brain dump, upload, templates)
  Week 13-14: Phase 5 — Polish & Advanced Agents

POST-PRODUCT (covered by other initiatives):
  Phase 7  — Onboarding, homepage, payments, beta launch
  Phase 8  — Growth infrastructure
  Phase 9  — Content & brand
  Phase 10 — Platform & operations
```

---

## Key Dependencies Diagram

```
┌──────────────────────────────────────┐
│  Phase 1: THE FOUNDATION             │
│  Audit → UI design → shell → bugs →  │
│  data architecture                    │
└─────────────┬────────────────────────┘
              │
┌─────────────▼────────────────────────┐
│  Phase 2: AUDIENCE PROFILING          │
│  Research engines → Profile UI →      │
│  downstream integration               │
└─────────────┬────────────────────────┘
              │
┌─────────────▼────────────────────────┐
│  Phase 3: AGENT LAYER                 │
│  Mastra → first agents → agent UI →   │
│  chaining/post-process                │
└─────────────┬────────────────────────┘
              │
┌─────────────▼────────────────────────┐
│  Phase 4: CONTENT INTELLIGENCE        │
│  RAG + Brain Dump + Upload + templates│
└─────────────┬────────────────────────┘
              │
┌─────────────▼────────────────────────┐
│  Phase 5: POLISH & ADVANCED AGENTS    │
│  Advanced agents + metrics + polish   │
└─────────────┬────────────────────────┘
              │
       ═══════╧═══════
       POST-PRODUCT
       Phases 7-10
```

---

## HITL Testing Checkpoints

Every phase ends with a concrete test Mike can run:

| Phase | What Mike Tests | Pass Criteria |
|-------|----------------|---------------|
| 1 | **Review audit report** → **review UI visual design** → navigate 5-step flow, create deck, export PPT | Audit verdicts agreed; UI design approved; working file comes out |
| 2 | Enter real person → Audience Brief → create deck | Deck clearly reflects audience |
| 3 | Launch Coach + Skeptic at Outline stage | Useful suggestions, accept works |
| 4 | Brain dump + upload paths + content intelligence | Both converge correctly at Outline; RAG/entry points improve output |
| 5 | Run advanced agents + verify polish/metrics | Agents are useful; workflow is smooth; metrics/observability present |
| 7 | Full new-user signup → first deck | Smooth, payments work, feedback tool live |

---

## Gap Analysis: Are We Missing Anything?

### Possibly Missing (needs confirmation)

| Gap | Description | Recommendation |
|-----|-------------|----------------|
| **Template Library** | Template selection UI + starter templates for Generate. | Included: #537 |
| **Brand Template Extraction** | Extract colors/fonts/layouts from uploaded decks. | Included: #540 |
| **Argument Map UI** | Product Design Bible says Pyramid Principle tree sits at end of Assemble. No task for building this UI component. | Create task: "Build Argument Map (Pyramid Principle) UI in Assemble step" |
| **Profile → Assemble context flow** | How does the Audience Brief data physically flow into Assemble step pre-fill? Spec exists (`profile-assemble-outline-context-flow.md`) but no build task. | Create task or fold into #518 |
| **Testing/QA plan** | No dedicated testing tasks per phase. Current plan assumes Mike tests manually. | Consider: automated E2E tests for critical paths |
| **Design system** | #270 exists but is vague. The 5-step workflow needs consistent component library. | Scope #270 or create focused task |
| **Error states & loading** | No tasks for loading states during research, agent runs, generation. UX gap. | Fold into respective phase UI tasks |

### Confirmed Present (not missing)
- ✅ Audience profiling data + UI + integration (Phase 2)
- ✅ Agent infrastructure + UI + first agents (Phase 3)
- ✅ All entry points + content intelligence (Phase 4)
- ✅ Onboarding + payments + launch (Phase 7)
- ✅ All growth/marketing/ops tasks (Phases 8-10)

---

## Open Questions for Mike

1. **The shell (Phase 1A):** Is rewiring existing pages into a new 5-step navigation the right first move? Or should we redesign the UI from scratch?
2. **Template library:** Is this needed for beta? If yes, when — Phase 2 (for Generate) or Phase 6 (polish)?
3. **Brand template extraction (WOW #2):** In-scope for beta, or post-beta?
4. **Argument Map UI:** How important is the Pyramid Principle visual tree for beta? Could it be a text outline initially?
5. **Timeline reality:** Is 16 weeks realistic? Are there external deadlines?
6. **Build capacity:** Sophie (sub-agents) building everything, or are there other developers?
