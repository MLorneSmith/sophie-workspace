# Build Product — Task Recovery Draft

**Date:** 2026-03-13 (v2 — corrected after PR audit)
**Source:** `2025slideheroes-audit-2026-03-10.md` gaps + `sequenced-build-plan.md` phasing + live PR verification
**Status:** Draft for Mike's review before seeding into MC
**Objective:** 🚀 Product — Build a Product Customers Love

---

## How to Read This

- **Status** reflects the *verified* state as of Mar 13 (corrected from the Mar 10 audit, which incorrectly showed 7 fork PRs as unmerged)
- **Old MC #** references the pre-crash task ID (from the sequenced build plan) — for traceability only
- **Priority** is relative within the initiative — high/medium/low

### What Changed From v1
The March 10 audit listed 7 fork PRs as "waiting." Verification showed that 5 were already promoted and merged upstream, 1 was superseded (Diffbot → Apollo.io), and only **Brain Dump (WOW #3)** is genuinely unmerged. This significantly changes the task list — several items previously marked "🏗️ In PR" are now ✅ done.

---

## Initiative: Core AI Workflow

*The 5-step flow (Profile → Assemble → Outline → Storyboard → Generate), navigation, data model, and end-to-end pipeline.*

| # | Task | Priority | Status | Old MC # | Notes |
|---|------|----------|--------|----------|-------|
| A1 | **UI Design pass for workflow** — layout, component library, interaction patterns, design language | high | ❌ Not done | #270 | Blocked the visual quality of everything downstream. Needs design spec before polish work. |
| A2 | **Remove old routes** (blocks/canvas/publisher/old storyboard) — clean up coexisting old + new code paths | high | ❌ Not done | — | Audit flagged as "concerning." Confusing codebase, potential stale paths. |
| A3 | **Quality indicators** — completion meters, nudges, stale warnings per step | medium | ❌ Not done | — | From workflow spec. Helps users know if a step is incomplete or stale. |
| A4 | **Downstream invalidation** — when earlier steps are edited, mark later steps as potentially stale | medium | ❌ Not done | — | From workflow spec. Critical for data integrity across the pipeline. |
| A5 | **Verify PPTX generation end-to-end** — confirm Generate step actually produces working PowerPoint output | high | ❓ Unknown | #333 | Audit: "No PPTX generation path verified." Old publisher exists + new save actions, but nobody confirmed it works. |
| A6 | **Restructure Assemble step layout** — (a) Remove company context box (not relevant here), (b) Add a pre-page with entry point choice: Upload Deck or Brain Dump, (c) Then "What type of presentation" page follows. Currently all three sections are crammed onto one page. | high | ❌ Not done | — | Mike feedback: current layout is "rough." Needs a two-step flow: choose entry point → then presentation type. |
| A7 | **Redesign Argument Map** — current implementation doesn't work. Needs: (a) tree/org-chart structure with rows, not freeform; Row 1 = 1 box (main argument), Row 2 = 3-7 boxes (supporting arguments), Row 3 = collapsible supporting details (shadcn Collapsible); (b) AI pre-fills the map from Audience Brief + uploaded deck content + Situation/Complication context, so user iterates rather than starts from scratch; (c) drag-and-drop reordering within rows; (d) consistent shadcn component styling. | high | ❌ Needs redesign | — | Mike feedback: "not sure what the best technology is to make the map interactive." Research task: evaluate react-flow, d3 tree, or custom shadcn-based grid for the tree UI. |
| A8 | **Auto-generate outline from Assemble context** — when user arrives at Outline step, automatically generate an initial outline using Audience Brief + SCQA + Argument Map + uploaded deck content. User should see a pre-filled outline they can iterate on, not a blank page. This is the core "transformation moment" of the product. | high | ❌ Not working | — | Mike feedback: "does not present an initial outline based on the context from the previous steps." Generate outline action exists but isn't triggered automatically or isn't wired to upstream context. |
| A9 | **Fix Outline → Storyboard transition** — submit button is greyed out, blocking the entire downstream workflow. Users cannot proceed past Outline. Storyboard, Generate, and agents are all unreachable. | critical | 🔴 Broken | — | Mike feedback: "You cannot submit the Outline. The button is greyed out." P0 — nothing downstream can be tested until this is fixed. Likely a validation check that's never satisfied. |
| A10 | **Template library** (visual themes × narrative structures) | medium | ❌ Not built | #537 | From WOW plan. Two-dimensional: look + thinking. Differentiator vs competitors. |
| A11 | **Presentation export** — PPTX + PDF required for beta. Google Slides is nice-to-have post-launch. | medium | ❌ Unknown | #329 | Depends on A5 (verify PPTX works). PDF export needs to be confirmed/built separately. |

---

## Initiative: WOW #1 — Audience Profiling

*"Know who you're presenting to." Research-backed Audience Brief from name + company.*

| # | Task | Priority | Status | Old MC # | Notes |
|---|------|----------|--------|----------|-------|
| B1 | **Company research engine** — verify completeness | medium | ❓ Partial | #510 | `CompanyBriefSchema` exists, `pollCompanyBriefAction` referenced. Needs validation. |
| B2 | **Sparse/missing data handling** — graceful fallback for unknown profiles | medium | ❌ Not built | #517 | What happens when you profile someone with no LinkedIn? No public info? |
| B3 | **Multi-audience & generic profiles** (composite + conference mode) | low | ❌ Not built | #514 | "Presenting to a room of 50" vs "presenting to Sarah Chen." |
| B4 | **Prompt audit against Context Engineering SOP** | medium | ❌ Not done | #524 | Are all prompts structured to use the new Audience Brief? Or still expecting old free-text? |

| B5 | **Brainstorm Audience Brief framework** — the current structure (Communication Profile / Strategic Recommendations / Presentation Format) is too generic. Course teaches Personality / Power / Access / Resistance. Need to design the right framework that captures political/org dynamics while remaining useful for downstream steps. | high | ❌ Not done | — | Mike feedback: current categories don't capture what matters most in consulting (power dynamics, resistance, access patterns). This is a product design task, not a code task. |
| B6 | **Audience Brief conciseness & scannability** — current output is too long, too much info, not scannable. Needs prompt engineering (concise, bullet-led, insight-first) + UI (collapsible sections, key takeaway highlights, progressive disclosure). | high | ❌ Not done | — | Mike feedback: "output is good but too long." Both a prompt fix and a UX fix. |
| B7 | **Person profile + company context information architecture** — organize enrichment data into clear hierarchical structure instead of undifferentiated text blocks | medium | ❌ Not done | — | Mike feedback: "need more structure around organizing the information" for both person and company. |
| B8 | **Profile refresh on reuse** — check for new company news when a saved profile is reused | low | ❌ Not built | — | From WOW #1 spec: "refreshed with recent company news on reuse." Saved profiles merged but no refresh mechanism. |

**Already merged upstream (removed from task list):**
- ~~Person enrichment~~ → Apollo.io (#2194 merged), supersedes Diffbot/Kscope
- ~~Saved profiles & reuse~~ → #2297 merged
- ~~Downstream context injection~~ → #2296 merged

---

## Initiative: WOW #2 — Deck Intelligence

*"Upload → rewrite + extract brand template." AI analyzes existing decks.*

| # | Task | Priority | Status | Old MC # | Notes |
|---|------|----------|--------|----------|-------|
| C1 | **Deck processing engine** — parse PPTX, extract text/structure, analyze narrative | high | ❌ Placeholder | — | `deck-processing.service.ts` is a stub. Without this, the upload entry point is non-functional. Core prerequisite for rewrite + template extraction. |
| C2 | **Content rewrite pipeline** — AI analyzes structure, identifies weaknesses, rebuilds with SCQA/pyramid | high | ❌ Not built | — | The core WOW #2 promise. Takes parsed deck → consulting-grade rewrite. |
| C3 | **Rewrite results UX** — side-by-side comparison, change annotations, accept/reject per change | medium | ❌ Not built | — | From WOW #2 spec: "We moved your conclusion to slide 2" / "We restructured around SCQA." |
| C4 | **Brand extraction from uploaded decks** — colors, fonts, layouts → reusable template | medium | ❌ Not built | #540 | The "two-for-one" value prop: proves AI + locks in brand. |
| C5 | **Template editing/customization UI** — user adjusts extracted brand template | low | ❌ Not built | — | From spec: "Editable — user can adjust colors, fonts, layouts." |
| C6 | **Ragie integration** (Upload → Extract → Populate) | medium | ❌ Not built | #330 | Document parsing/extraction pipeline for uploaded content. |

**Already merged upstream (entry point only):**
- ~~Deck Upload UI + storage~~ → #2298 merged — **but deck processing is a placeholder** (`deck-processing.service.ts` returns stub). The actual content analysis, rewrite, and template extraction are NOT implemented.

---

## Initiative: WOW #3 — Brain Dump

*"Chaos in, clarity out." Unstructured thoughts → structured SCQA outline.*

| # | Task | Priority | Status | Old MC # | Notes |
|---|------|----------|--------|----------|-------|
| D1 | **Brain Dump to Outline flow** | high | ❌ Closed upstream | #481 | Upstream PR #2274 closed — 6 unresolved CodeRabbit issues (input bounds, broken JSON prompt, no Zod validation, button routing bug, empty argument_map logic, missing re-export). Code is ~80% done on fork branch `sophie/issue-2268`. Needs: address all 6 CR issues, rebase on current dev, re-promote. |

---

## Initiative: WOW #4 — Agent Layer

*Specialized AI agents for presentations, built on Mastra.*

| # | Task | Priority | Status | Old MC # | Notes |
|---|------|----------|--------|----------|-------|
| E1 | **Bifrost gateway config** — wire PROVIDER_CONFIGS | high | 🔧 Partial | #501, #503 | `bifrost-gateway.ts` exists but config is empty `{}`. Agents may be bypassing intended routing. Note: upstream #2240 merged "Route Mastra agent LLM calls through Bifrost gateway" — may have partially addressed this. Needs verification. |
| E2 | **Agent error handling, retry & rate limiting** — verify resilience module completeness | medium | 🔧 Partial | #499 | Resilience module exists at `packages/mastra/src/resilience/` but completeness unknown. |
| E3 | **Agent side panel UI** — universal panel accessible from Outline onward | high | 🔧 Partial | #493 | Currently agent results only show in Storyboard. Mike confirmed: agents should be available starting at Outline step, not just Storyboard. |
| E4 | **Streaming progress UI** — verify scope and polish | medium | 🔧 Partial | #496 | `agent-progress.tsx` exists but scope is unclear. |
| E5 | **Accept/reject per suggestion UI** | medium | ❌ Unknown | #485 | Users need to cherry-pick agent suggestions, not just see them. |
| E6 | **Cost tracking & attribution** | low | ❌ Not built | #488 | Deferred post-launch in previous triage. Track per-agent, per-user AI costs. |
| E7 | **Agent chaining & batch execution** | low | ❓ Partial | #494 | `post-process-workflow.ts` may already cover this. Needs verification. |
| E8 | **Advanced agents** — Devil's Advocate, Auditor, Translator, Perfectionist | low | ❌ Not built | #490 | Post-launch candidates. Each is a feature announcement. |
| E9 | **Agent quality eval framework & regression tests** | low | ❌ Not built | #500 | How do we know agents are getting better, not worse? |
| E10 | **Suggested agents post-generation** — smart recommendations after deck creation | medium | ❌ Not built | — | From WOW #4 spec (Option C): "Your deck is ready. Want to run Presentation Coach or Q&A Prep?" Lowest friction path to agent adoption. |
| E11 | **Agent results display by type** — inline annotations vs. separate report vs. modified deck | medium | ❌ Not built | — | From spec: Coach = inline annotations, Q&A Prep = separate report, Editor = modified deck. Currently all agents render the same way. |

---

## Initiative: Langfuse & Observability

*Prompt management, tracing, and quality monitoring.*

| # | Task | Priority | Status | Old MC # | Notes |
|---|------|----------|--------|----------|-------|
| F1 | **PostHog event definitions for Phases 2-4** | low | ❌ Not done | #515 | What are we tracking? No analytics events defined for the new workflow steps. |
| F2 | **Observability export + agent quality evals** | low | ❌ Not done | #489 | Export traces for analysis. |

**Already merged upstream:**
- ~~Langfuse Phase 1 prompt migration~~ → #2293 merged
- ~~Langfuse Phase 2 getPrompt() wiring~~ → #2295 merged

---

## Initiative: Launch & Beta Readiness

*Getting the product ready for real users.*

| # | Task | Priority | Status | Old MC # | Notes |
|---|------|----------|--------|----------|-------|
| G1 | **Onboarding redesign** | medium | ❌ Not done | #179 | Current onboarding doesn't reflect the new workflow or WOW features. |
| G2 | **App & website testing** (pre-beta) | high | ❌ Not done | #341 | Comprehensive testing before inviting beta users. |
| G3 | **Identify people for beta feedback** | medium | ❌ Not done | #338 | Who are the first users? |
| G4 | **Beta launch** | high | ❌ Not done | #337 | The milestone. |
| G5 | **API pricing / credit system for AI usage** | medium | ❌ Not done | — | How do users pay for AI calls? Per-credit? Bundled? |
| G6 | **Test payments end-to-end** | medium | ❌ Not done | #335 | Stripe integration verification. |

---

## Summary

| Initiative | Total | 🔴 Broken | ❌ Not Done | 🔧 Partial | ❓ Unknown |
|------------|-------|----------|-----------|-----------|-----------|
| Core AI Workflow | 11 | 1 | 7 | 0 | 3 |
| WOW #1 — Audience Profiling | 8 | 0 | 6 | 0 | 2 |
| WOW #2 — Deck Intelligence | 6 | 0 | 6 | 0 | 0 |
| WOW #3 — Brain Dump | 1 | 0 | 1 | 0 | 0 |
| WOW #4 — Agent Layer | 11 | 0 | 6 | 3 | 2 |
| Langfuse & Observability | 2 | 0 | 2 | 0 | 0 |
| Launch & Beta | 6 | 0 | 6 | 0 | 0 |
| **Total** | **45** | **1** | **34** | **3** | **7** |

### Priority Tiers (from walkthrough)

**🔴 Critical / P0 — Unblock the workflow:**
- A9: Fix Outline → Storyboard transition (greyed out button)
- A8: Auto-generate outline from Assemble context (blank page)

**🟠 High — Core product quality:**
- A6: Restructure Assemble step layout (entry point choice page)
- A7: Redesign Argument Map (tree structure, pre-filled, shadcn)
- B5: Brainstorm Audience Brief framework (PPAR vs current)
- B6: Audience Brief conciseness & scannability
- D1: Brain Dump WOW#3 (address CR feedback, re-promote)
- E3: Agent side panel from Outline onward
- A5: Verify PPTX generation end-to-end

**🟡 Medium — Feature completeness:**
- A2: Remove old routes
- C1-C3: Deck processing engine + content rewrite + results UX
- B7: Person/company info architecture
- A3-A4: Quality indicators + downstream invalidation
- E1: Bifrost gateway config verification
- E5/E10/E11: Agent UX (accept/reject, suggestions, display types)

**🟢 Low / Post-launch:**
- E6-E9: Cost tracking, advanced agents, eval framework, chaining
- B3/B8: Multi-audience, profile refresh
- F1-F2: PostHog events, observability
- C4-C6: Brand extraction, template editing, Ragie

---

## Fork Branch Cleanup (Completed Mar 13)

- **44 merged branches** deleted (work landed upstream via promoted PRs)
- **65 stale branches** deleted (superseded, from overnight flood, or abandoned)
- **2 branches kept:** `sophie/issue-2268` and `sophie/issue-2281` (Brain Dump WOW#3 — the only unmerged product work)

---

## What This List Does NOT Cover

These are explicitly out of scope for this "Build Product" task recovery — they belong under other objectives or future phases:

- **Homepage redesign** (already has alpha spec S2086) → could be Product or Build Audience
- **Course refinement** → Product: Course Refinement initiative
- **Enterprise data security / local-first** → Product: Enterprise initiative
- **Email/marketing/CRM** → Build Audience or Convert Existing objectives
- **CI/CD, deployment, monitoring** → Business OS objective
- **SEO, content, LinkedIn** → Build Audience objective
