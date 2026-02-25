# SlideHeroes — New Customer Onboarding Experience (Spec / Handoff)

**Task:** MC #179 — Design new customer onboarding experience  
**Status intent:** Design/spec complete; implementation requires product repo work (2025slideheroes) and/or Mike approval.

## Goals
1. Get users to *first value* in <5 minutes (generate/import first slide/deck).
2. Collect minimal personalization data to improve templates + AI defaults.
3. Create an in-product activation loop (checklist + contextual nudges), not an email-only flow.

## Core Principles
- **One question per screen** (single focus). 
- **5–7 steps max** before landing in the product.
- **Progress indicator** always visible.
- **Skippable** optional steps (industry, team size).
- **State persisted** (resume onboarding if user bounces).

## Proposed Flow (V1)

### 0) Signup
- Email/password + Google OAuth
- Right-side panel (desktop): mosaic of example outputs (Gamma-style), with 3–5 captions ("Client proposal", "Board update", etc.)

**Tracking:** `onboarding_signup_started`, `onboarding_signup_completed` (auth method)

### 1) Persona / Role
Prompt: **“What best describes you?”**
Options (cards, 2×2 grid):
- Solo consultant
- Boutique consultancy (2–20)
- Enterprise team
- Other

**Saves to:** `user.profile.persona`

### 2) Deliverable Types (pick up to 3)
Prompt: **“What do you create most often?”**
Card multi-select (Beautiful.ai pattern), max=3:
- Strategy deck
- Client proposal
- Board presentation
- Team update
- Pitch deck
- Other

**Saves to:** `user.profile.deliverable_types[]`

### 3) Industry (optional)
Prompt: **“Any industry focus?”**
- Searchable select (optional)
- “Skip” link

**Saves to:** `user.profile.industry`

### 4) First Project: Start point
Prompt: **“How do you want to start?”**
Two primary CTAs:
- **Try a template** (recommended)
- Start from scratch

Secondary: “Import content” (if supported)

**Routing:**
- Template → template gallery filtered by persona + deliverable types
- Scratch → blank deck with suggested outline

### 5) Activation Checklist (in-product)
Persistent widget (right sidebar or bottom-right): **“Your first win”**
4–5 items max:
1. Create your first slide
2. Try AI Assist (rewrite or outline)
3. Apply a theme/layout
4. Export (PDF/PPTX) OR Share link
5. (Optional) Invite teammate

**Checklist rules:**
- Appears immediately after landing.
- Auto-completes items based on events.
- Collapses when 3/5 completed, with “Keep going” link.

**Tracking:** `activation_checklist_shown`, `activation_step_completed` (step id), `activation_checklist_completed`

## UX Notes / Microcopy
- Headings should be confident + consultant-y (premium tone).
- Buttons: “Continue” not “Next”.
- Use short supportive subtext (1 line) per step.

Examples:
- Persona step subtext: “We’ll tailor templates and prompts to your workflow.”
- Deliverables step subtext: “Pick up to 3. You can change this later.”

## UI Wireframe Description (Implementation Guidance)
- Centered card (max width ~560px)
- Thin progress bar at top (segmented or continuous)
- Cards: icon + label; selected state with subtle glow/border
- Primary CTA fixed bottom-right of card
- Back link top-left

## Data Model / Persistence
Store onboarding state in DB so it survives refresh:
- `onboarding.version` (e.g., `v1`)
- `onboarding.current_step`
- `onboarding.completed_at`

Profile fields (persona, deliverables, industry) saved as user metadata.

## Analytics & Funnel Metrics
Minimum funnel report:
- Step completion rate per step
- Time-to-first-value (signup completed → first slide created)
- Checklist completion rate
- Template vs scratch selection rate

## Edge Cases
- User skips optional steps → do not block progress.
- User abandons after step 2+ → on next login, resume onboarding.
- User completes onboarding but doesn’t hit first value → show checklist again on next session.

## Build Plan (No-code / code-ready)
1. Build onboarding step components + route guard.
2. Persist onboarding state.
3. Add checklist widget + event wiring.
4. Add analytics events.
5. QA: mobile responsiveness, back/forward behavior, resume behavior.

## Open Questions for Mike
1. Do we want **template gallery** immediately after onboarding (recommended) or land in blank editor?
2. What’s the target “first value” metric: first slide created, first deck exported, or first AI action?
3. Should we offer “Import from doc/notes” on day 1?

---

Prepared by Sophie (OpenClaw) — 2026-02-14 (UTC)
