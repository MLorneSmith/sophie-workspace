# Workflow Visual Design — Brainstorm Decisions

**Task:** #270
**Date:** 2026-02-18
**Status:** Brainstorm complete — ready for prototype implementation

---

## All Design Decisions

### 1. Visual Approach: Hybrid

**Marketing polish on showcase surfaces, app-standard for working steps.**

- Showcase surfaces (Presentations List, Project Modal, Profile enrichment reveal, Generate template gallery) get premium treatment — glass effects, accent spectrum, card hover animations, marketing DNA from the design system
- Working steps (Assemble, Outline, Storyboard) use clean app-standard: shadcn components, app typography scale, dark-first but functional
- Rationale: Wow factor when browsing, tool vibes when working

### 2. Wizard Chrome: Top Bar

**Horizontal step indicator across the top, below the app header.**

- Steps shown as connected dots/pills with labels: Profile → Assemble → Outline → Storyboard → Generate
- Current step highlighted, completed steps clickable (with completion indicator), future steps greyed
- Layout: existing collapsible left sidebar | top step bar | content area | agent icon rail (right, from Outline onward)
- Rationale: Maximizes horizontal workspace, especially important when agent panel is open

### 3. Presentations List: Card Grid

**Card grid designed around a slide thumbnail image.**

- Each card features the front page / title slide of the presentation as the hero image
- Card also shows: title, audience name, step progress, last updated
- Before a deck is generated: placeholder or stylized preview based on template/brand colors
- 2-3 column responsive grid
- "New Presentation" CTA prominent
- Showcase surface → gets marketing-level polish

### 4. Project Dashboard: Modal on Card Click

**Click a presentation card → modal pops up with project overview.**

Modal contains:
- **Project metadata** — Title (editable), created date, last modified
- **Audience summary** — Name, company, brief snippet from the Profile step
- **Step overview** — All 5 steps listed vertically with status (not started / in progress / complete), quality indicators
- **Jump buttons** — Small button next to each step to jump directly to that stage
- **Continue CTA** — Main button takes user to the next unfinished step in the workflow

Power user shortcut (future): Consider double-click on card to skip modal and go straight to last active step.

Rationale: Every project open gives a quick "here's where things stand" checkpoint before diving in. Removes "where was I?" friction for multi-session projects.

### 5. Agent Side Panel: Icon Rail + Run-to-Review

**Thin icon rail (~48px) on the right side, visible from Outline step onward.**

- Each agent (Coach, Skeptic, etc.) has an icon on the rail
- **Click icon → agent runs** (no expand/collapse, no browsing mode)
- Results panel slides out showing streaming output as agent works
- Suggestions appear as cards in the panel — **same accept/dismiss pattern already implemented in current outline suggestions UI**
- Accept → applied to workspace automatically
- Dismiss → removed
- All suggestions handled → panel closes (or stays for reference)
- Agent identity shown: "Coach says..." / "Skeptic asks..."
- Multiple agents: run one, review, run another from the same rail

Key insight: Reuses the existing suggestions accept/apply mechanism. New pieces are agent identity tagging, streaming output display, and the icon rail trigger.

### 6. Quality Indicators: Dot + Banner + Refresh

**Two-layer system for downstream invalidation warnings.**

- **Dot/badge on top bar** — Small colored dot on affected step indicators. Orange = "upstream changed, review recommended." Passive, always visible.
- **Banner when entering affected step** — Dismissible banner at top of the step content: "Your audience profile changed since this outline was created. **Refresh with AI** or dismiss."
- **Refresh with AI** — Re-runs relevant generation using updated upstream context. Output appears via the same accept/dismiss suggestion pattern — user reviews before anything changes.
- Non-blocking throughout. Show the info, let the consultant decide.

### 7. Step Completion: Continue Button with Minimum Requirements

**"Continue" button advances to next step and marks current step complete. Only clickable when minimum requirements are met.**

- Minimum requirements per step:
  - **Profile** → Audience Brief saved
  - **Assemble** → All stepper sub-steps completed (through Argument Map)
  - **Outline** → Outline content exists (not empty)
  - **Storyboard** → At least one slide mapped
  - **Generate** → Template selected
- Before requirements met: Continue is greyed/disabled with subtle hint of what's missing
- Clicking Continue: marks step complete + navigates to next step
- Jumping via top bar: marks step as "in progress" (visited) but not complete
- Users can always revisit completed steps via top bar
- Exact requirements per step to be refined during implementation

---

## Step-by-Step Layouts

### 8. Profile Step: Progressive Reveal with Theatrical Enrichment

**Single page, progressive reveal — the WOW moment.**

Flow:
1. Centered search input: "Who are you presenting to?" (name + company, LinkedIn URL, or role description)
2. User submits → **theatrical reveal begins**:
   - "Researching Sarah Chen at TD Bank..." with gentle pulse (not a generic spinner)
   - Skeleton card starts assembling — name appears first, then company, title, photo, career history
   - Data points animate in with fade-up pattern, each one landing reinforces "we did our homework"
   - Order of reveal: name → photo → current title → company → career highlights
3. While profile card enriches, adaptive questions begin generating (can start once role/industry known)
4. 3-4 adaptive questions appear below the completed profile card (driven by Audience Map quadrants: Personality, Power, Access, Resistance — but users never see the framework labels)
5. User answers questions → editable Audience Brief generates below
6. Brief reads like a consultant's pre-meeting notes, not a form. Structured internally for downstream context injection.

Key design principles:
- The 2-4 second Netrows + web research wait is turned into the magic moment, not a loading state
- Progressive build IS the experience (like Perplexity streaming answers)
- This is a showcase surface — gets marketing-level animation polish
- Sparse/missing data handled gracefully: show what we found, ask more questions to compensate

### 9. Assemble Step: Vertical Stepper

**Vertical progress stepper with sequential enforcement.**

Sub-steps in order:
1. **Materials** (optional, skippable) — Upload existing deck, brain dump text area, links/documents. AI uses these to pre-fill later sub-steps.
2. **Presentation Type** — Select from options (General, Sales, Consulting, Fundraising)
3. **SC (Situation & Complication)** — Text fields for Situation and Complication. AI suggestions available based on materials + audience context.
4. **Question Type** — Select the type of question implied by the SC (Strategy, Assessment, Implementation, Diagnostic, Alternatives, Post-mortem)
5. **Argument Map** — Pyramid Principle tree structuring the answer. Visual tree builder.

Layout:
- Vertical progress indicator on the left (dots connected by a line, like a timeline)
- Active sub-step content on the right (full width of remaining space)
- Completed sub-steps show as checked dots with one-line summary next to them
- Sequential enforcement: future sub-steps locked until current one is done
- Each sub-step gets full focus — no scrolling through multiple sections

Rationale: Stepper enforces the important sequencing (SC before Question Type, everything before Argument Map) while keeping each sub-step focused and uncluttered. Materials first so AI can use uploaded content to accelerate subsequent sub-steps.

### 10. Outline Step: Resizing Editor with Agent Panel

**TipTap editor that resizes when agent panel opens.**

- Editor takes full content width by default (minus the agent icon rail)
- Agent icon rail visible on the right (~48px)
- Click an agent icon → editor smoothly shrinks, results panel opens alongside
- Both editor and suggestions visible simultaneously — essential for reviewing suggestions in context
- Existing suggestions accept/apply mechanism reused
- When agent panel closes, editor expands back to full width

Note: This is the step where agents become available for the first time. The icon rail's appearance here (not in Profile or Assemble) signals a new capability.

### 11. Storyboard Step: Two-Column Slide List + Editor

**Left column: slide thumbnails. Right column: slide detail editor.**

- Left column: vertical list of slide thumbnail cards, reorderable via drag-and-drop
- Each thumbnail shows: slide number, takeaway headline snippet, layout indicator
- Right column: selected slide's full detail — takeaway headline, purpose, content blocks, layout choice, speaker notes
- Click a thumbnail → right side updates to that slide's details
- Agent rail available for Storyboard-level suggestions (slide reorders, better headlines, missing slides)

⚠️ **Implementation note:** The audit rated Storyboard as 🔧 minor tweaks, but populating slides with charts, graphics, data visualizations, and evidence is likely significantly more work. Flag for Phase 1D scoping.

### 12. Generate Step: Gallery → Preview → Export

**Three-stage flow within the step.**

1. **Template Gallery** — Grid of template cards showing visual previews of different design themes (color palettes, typography, layout styles). This is a showcase surface — cards get marketing polish with hover effects.
2. **Preview** — Selected template applied to the deck. Show 2-3 representative slides so the user can confirm the look before committing.
3. **Export** — Prominent export button. Format options: PPTX, PDF. Download or share link.

Rationale: The gallery is where users feel the payoff of the whole workflow — their content, beautifully designed. Template cards should feel premium. Live preview (templates updating in real-time as you click) is aspirational — start with static preview, evolve toward live.

---

## Layout Summary

```
┌──────────────────────────────────────────────────────────────────┐
│  App Header (existing)                                            │
├────────┬─────────────────────────────────────────────────┬───────┤
│        │  Step Bar: [Profile] [Assemble] [Outline] ...   │       │
│  Left  ├─────────────────────────────────────────────────┤ Agent │
│  Side  │                                                 │ Icon  │
│  bar   │              Content Area                       │ Rail  │
│  (col- │         (step-specific layout)                  │(~48px)│
│  laps- │                                                 │ From  │
│  ible) │                                                 │Outline│
│        │                                                 │onward │
│        ├─────────────────────────────────────────────────┤       │
│        │  [Continue →] (enabled when requirements met)   │       │
├────────┴─────────────────────────────────────────────────┴───────┤
```

---

## Reference Documents

- `deliverables/workflow-ui-design.md` — Approved workflow architecture
- `deliverables/implementation-audit.md` — What exists vs rebuild
- `deliverables/saas-design-analysis.md` — Webflow/Gamma/Beautiful.ai patterns
- `deliverables/audience-brief-ui-ux-editable-profile-page.md` — Profile step spec
- `deliverables/product-design-bible.md` — Product vision
- `.ai/ai_docs/context-docs/development/design/DesignSystem.md` — Design system (in 2025slideheroes repo)
