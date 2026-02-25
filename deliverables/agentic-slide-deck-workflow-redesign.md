# Agentic Slide Deck Workflow — Flow + UI Redesign

**Task:** #438  
**Owner:** Sophie  
**Date:** 2026-02-15  
**Status:** Draft deliverable (for Mike review)

---

## 1) What we’re designing

An end-to-end, **agent-led** workflow where the user provides direction and constraints, and the system:
- turns ambiguous input into a structured plan,
- produces a storyboard before producing slides,
- generates slides *as an editable artifact*,
- continuously proposes improvements via specialized agents,
- supports quick iteration and confident export.

The key shift: **the “unit of progress” is an artifact** (Brief → Outline → Storyboard → Deck), not a chat thread.

---

## 2) Design principles (non-negotiables)

1. **Artifact-first**: every step produces a concrete, named object that can be revisited.
2. **Two-speed control**: users can go “Autopilot” (AI drives) or “Guided” (user approves checkpoints).
3. **Progress is visible**: always show where you are in the workflow, what’s done, what’s next.
4. **Decisions are explicit**: audience, tone, goal, structure choices are captured, not implied.
5. **Editable at every stage**: users can intervene at Brief/Outline/Storyboard without “starting over.”
6. **Local reasoning, global consistency**: slides can be generated incrementally while maintaining narrative + design coherence.

---

## 3) Proposed workflow (phases + checkpoints)

### Phase 0 — Start: Choose a path
**Entry options (cards):**
- **Start from a brief** (most common)
- **Start from notes / brain dump** (WOW #3)
- **Start from an existing deck** (import + transform)
- **Start from a template** (industry / use case)

**Primary CTA:** “Create a new deck”

---

### Phase 1 — Brief Builder (5–7 minutes)
Goal: convert user intent into a durable spec.

**Inputs:**
- What are you trying to achieve? (persuade / inform / align / pitch)
- Audience (roles, seniority, what they care about) (WOW #1)
- Context + constraints (time, #slides, format, brand/theme, do/don’t)
- Raw material (paste notes, upload doc, link)

**AI behaviors:**
- Ask 3–6 “high-leverage questions” max.
- Propose a **draft brief** that the user can edit.

**Output artifact:** `Deck Brief` (versioned)

**Checkpoint:** user approves brief OR selects “Proceed with assumptions.”

---

### Phase 2 — Narrative Architecture (Outline)
Goal: lock structure before visuals.

**UI:** split view
- Left: outline tree (sections + slide titles)
- Right: rationale + gaps + suggested evidence

**AI behaviors:**
- Propose 2–3 outline options (e.g., SCQA vs “problem-solution-proof”) with tradeoffs.
- Highlight missing proof points (“You claim X—need metric / case / source”).

**Output artifact:** `Deck Outline` (slide list with purpose + key message)

**Checkpoint:** user selects an outline + can reorder/rename.

---

### Phase 3 — Storyboard (the “contract”)
Goal: define what each slide *does* before generating visuals.

**Storyboard fields per slide (simple but sufficient):**
- **Purpose** (what this slide accomplishes)
- **Takeaway headline** (one sentence)
- **Content blocks** (bullets / chart placeholder / table / diagram)
- **Evidence needed** (if any)
- **Speaker intent** (optional)

**AI behaviors:**
- Generate storyboards quickly.
- Mark slides that need data/images.
- Offer “tighten to 8 slides” / “expand to 12” transformations.

**Output artifact:** `Storyboard`

**Checkpoint:** user approves storyboard (or approves slide-by-slide).

---

### Phase 4 — Generate Slides (incremental, controllable)
Goal: turn storyboard → designed deck.

**Key change:** generation should be **progressive** and **inspectable**.

**Generation modes:**
- **All at once** (fast)
- **Section-by-section** (safer)
- **Slide-by-slide** (highest control)

**UI:**
- Center: slide canvas
- Left: slide navigator with status (Draft/Reviewed/Locked)
- Right: Copilot panel with:
  - “Next suggested action”
  - Regenerate controls (layout / tone / density)
  - “Apply across deck” actions

**Output artifact:** `Deck v1` (editable)

**Checkpoint:** “Deck ready for review”

---

### Phase 5 — Review & Refinement (agentic layer)
Goal: improve quality, consistency, and readiness to present.

**Suggested agents (post-generation):**
1. **Presentation Coach (Partner)** — clarity + narrative
2. **Consistency Checker (Perfectionist)** — terms, numbers, style
3. **Deck Shrinker (Editor)** — remove redundancy, tighten
4. **Q&A Prep (Skeptic)** — anticipate objections

**UX pattern:**
- After Deck v1: show a *single* “Polish this deck” step with 2–3 recommended agents.
- Allow running additional agents from an on-demand menu.

**Results presentation:**
- Inline annotations on slides (accept/reject)
- “Changeset” view (like PR diffs) for deck-wide edits

**Output artifact:** `Deck v2` + `Review Report`

---

### Phase 6 — Export & Delivery
Goal: ensure export is predictable and branded.

**Export options:**
- PowerPoint
- PDF
- Google Slides (later)

**Pre-export checklist:**
- Brand/theme locked
- Fonts/spacing pass
- Accessibility pass (optional agent)

**Output artifact:** exported files + “presenter pack” (speaker notes + Q&A)

---

## 4) UI information architecture (what lives where)

### A) Persistent left rail: Workflow stages
A vertical rail (or top stepper) always visible:
1. Brief
2. Outline
3. Storyboard
4. Slides
5. Polish
6. Export

Each stage has:
- status (not started / in progress / complete)
- last updated time
- quick “re-open” action

### B) Main canvas: the current artifact
- In Brief/Outline/Storyboard: forms + structured editor
- In Slides: slide editor + thumbnails

### C) Right panel: Copilot + Agents
Two tabs:
- **Copilot**: next action, clarifying questions, small edits
- **Agents**: run a specialized agent, see results, apply changes

### D) Versioning (quiet but essential)
- Each artifact is versioned automatically at checkpoints.
- Provide “Compare versions” for Storyboard and Deck.

---

## 5) Where the AI “drives” vs user “steers”

**AI drives by default:**
- first draft generation (brief/outline/storyboard/slides)
- pointing out gaps, risks, inconsistencies
- proposing improvements with rationale

**User steering points (high leverage):**
- audience + objective confirmation
- outline selection
- storyboard approval
- choose generation mode (all/section/slide)
- accept/reject polish changesets

**Anti-pattern to avoid:** endless chat where the user can’t see progress or revert.

---

## 6) Key interactions to make “agentic” feel real (not gimmicky)

1. **Assumption management** (visible): “Proceed with assumptions” creates an “Assumptions” block in the brief.
2. **Deck TODOs**: auto-created from missing evidence (“Need metric for claim X”).
3. **Changesets**: deck-wide edits are applied as a bundle with a preview.
4. **Slide status**: Draft/Reviewed/Locked; agents don’t touch Locked slides unless asked.
5. **Global controls**: tone, density, visual style applied across deck.

---

## 7) MVP vs later

### MVP (supports the full loop)
- Brief → Outline → Storyboard → Generate Slides
- Basic slide editor + regenerate
- 2 polish agents (Coach + Consistency)
- Export PPTX/PDF

### Later (differentiators)
- Agent catalog expansion (WOW #4)
- Import existing decks
- Evidence retrieval / citations
- “Meeting pack” output (Q&A, talk track, appendix suggestions)

---

## 8) Open questions for Mike

1. **Default path:** should “Start from brief” always be default, or “Start from notes” (brain dump) for creator types?
2. **Storyboard strictness:** do we require storyboard approval before slide generation, or allow skipping?
3. **UI form factor:** stepper wizard vs always-available rail (I recommend always-available rail).
4. **Export promise:** do we guarantee pixel-perfect PPTX parity early, or treat PPTX as “good enough” until later?

---

## 9) Recommended next step

If Mike agrees with this structure, next deliverable would be a **screen-by-screen wireflow** (10–14 screens) showing:
- New deck entry
- Brief builder
- Outline selection
- Storyboard editor
- Slide generation view
- Polish step with changesets
- Export
