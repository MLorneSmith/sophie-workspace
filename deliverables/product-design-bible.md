# SlideHeroes Product Design Bible

**Last updated:** 2026-02-18
**Status:** Living document — updated as decisions are made

---

## What We're Building

SlideHeroes transforms how consultants and business professionals create presentations. Instead of starting with a blank slide, users go through a structured workflow that ensures every deck is tailored to the audience, grounded in strong narrative structure, and polished by AI agents.

**Core insight:** Senior consultants don't build decks about content — they build decks about the audience. SlideHeroes automates this expertise.

---

## The Workflow (5 Steps)

**Profile → Assemble → Outline → Storyboard → Generate**

One path. No branching. Every presentation goes through the same flow.

### 1. Profile — "Who are you presenting to?"
- User types a name + company (e.g., "Sarah Chen, TD Bank")
- System searches Netrows API, shows profile card with photo
- User confirms the right person
- AI generates 3-4 adaptive questions based on the Audience Map (Personality, Power, Access, Resistance)
- Output: editable Audience Brief that reads like consultant's pre-meeting notes
- **Spec:** [audience-brief-ui-ux-editable-profile-page.md](audience-brief-ui-ux-editable-profile-page.md)

### 2. Assemble — "What's the problem and how do you structure your answer?"
- Sub-steps: Presentation Type → Question Type → SCQ → Argument Map
- Upload existing decks, paste brain dumps, add links — any combo of materials
- Materials pre-fill fields, they don't skip steps
- Argument Map (Pyramid Principle) sits at end of Assemble
- **Presentation Types:** General Business, Sales, Consulting, Fundraising
- **Question Types:** Strategy, Assessment, Implementation, Diagnostic, Alternatives, Post-mortem

### 3. Outline — "Nail the narrative"
- Language, messaging, supporting points in cohesive SCQA + next steps frame
- NOT about slides — about the argument
- **Agents become available here** (Coach, Skeptic, Editor)

### 4. Storyboard — "Map narrative to slides"
- Define what each slide does, takeaway headlines, content blocks
- This is where it becomes slides
- Additional agents available (Perfectionist for consistency)

### 5. Generate — "Produce and export"
- Apply selected template (brand, layout, visual style)
- Export as PowerPoint, PDF
- All agents available for final review

---

## Navigation Model

### Presentations List (Home)
- Table/grid of all presentation projects
- "New Presentation" button → always starts at Profile
- Shows: name, current step, last updated, status

### Project Dashboard
- Per-presentation progress view across all 5 steps
- Click any completed step to revisit
- Returning users land here (not mid-step)

### Step Progression
- Guided linear wizard (first time through is sequential)
- Completed steps always revisitable
- Quality indicators instead of hard locks ("Your deck will be significantly better with...")
- Editing a completed step triggers downstream invalidation warnings

---

## Entry Points

All converge into the same workflow — they're input methods, not separate paths:
- **Start fresh** → empty wizard
- **Upload existing deck** → AI extracts content, pre-fills Assemble fields
- **Brain dump** → paste notes, AI suggests SCQ and structure
- **Any combination** — upload + brain dump + links all feed into Assemble

---

## Agent Layer

Agents are NOT a workflow step — they're an always-available side panel from Outline onward.

| Agent | Available from | What it does |
|-------|---------------|-------------|
| **The Partner** (Coach) | Outline | Critiques narrative structure, messaging, audience fit |
| **The Skeptic** (Q&A Prep) | Outline | Identifies weak arguments, generates likely questions |
| **The Editor** (Shrinker) | Outline | Suggests tightening, removes redundancy |
| **The Perfectionist** | Storyboard | Checks terminology, number, and tone consistency |

**Beta ships with:** Partner + Skeptic (highest value, most differentiated)

---

## Audience Profiling (WOW #1)

**Two-step approach — feels like magic, not a form:**

1. **"Who?"** — Type name + company → Netrows search → profile card with photo → confirm
2. **"What do we know?"** — AI asks 3-4 adaptive questions drawn from the Audience Map quadrants

**Audience Map Quadrants** (from SlideHeroes course):
- **Personality:** Style, energy, decision-making approach
- **Power:** Org dynamics, who decides, consensus vs hierarchy
- **Access:** How they consume info, visual vs data, pre-reads
- **Resistance:** Allies, objections, likely questions, pushback

**Output:** Generated editable brief (not a form). Structured internally for downstream context injection.

**Enrichment:** Netrows API (€0.01/lookup, 2 credits: search + profile). No LinkedIn URLs needed.

- **Spec:** [audience-brief-ui-ux-editable-profile-page.md](audience-brief-ui-ux-editable-profile-page.md)
- **Validation:** [netrows-validation-report.md](netrows-validation-report.md)
- **Research:** [linkedin-data-providers-research.md](linkedin-data-providers-research.md)

---

## Technical Decisions

| Decision | Choice | Date |
|----------|--------|------|
| Agent orchestration | Mastra (validation spike is gate) | 2026-02-18 |
| Person enrichment | Netrows API | 2026-02-18 |
| Company research | Web search + LLM synthesis | 2026-02-18 |
| Agent pricing (beta) | Included in subscription | 2026-02-18 |
| Agent results privacy | User-only, 90-day retention | 2026-02-18 |
| DB evolution | Foreign keys to existing tables | 2026-02-18 |
| First 2 agents | Partner (Coach) + Skeptic (Q&A Prep) | 2026-02-18 |

---

## Detailed Specs & References

| Document | What it covers |
|----------|---------------|
| [workflow-ui-design.md](workflow-ui-design.md) | End-to-end workflow, navigation, entry points, agent layer |
| [audience-brief-ui-ux-editable-profile-page.md](audience-brief-ui-ux-editable-profile-page.md) | Profile step — two-step UI, adaptive questions |
| [agentic-layer-implementation-plan.md](agentic-layer-implementation-plan.md) | Technical plan, all decisions, critical path |
| [agentic-layer-db-schemas.md](agentic-layer-db-schemas.md) | DB table designs |
| [agentic-layer-infrastructure-research.md](agentic-layer-infrastructure-research.md) | Mastra vs LangGraph evaluation |
| [company-research-engine-spec.md](company-research-engine-spec.md) | Company brief engine spec |
| [netrows-validation-report.md](netrows-validation-report.md) | Netrows API validation (15 profiles) |
| [linkedin-data-providers-research.md](linkedin-data-providers-research.md) | Provider comparison |
| [wow1-audience-profiling.md](wow1-audience-profiling.md) | WOW #1 overview and rationale |
| [company-research-value-brainstorm.md](company-research-value-brainstorm.md) | How company research adds value across all 5 workflow steps |
| [wow4-agent-layer.md](wow4-agent-layer.md) | Agent catalog and UX patterns |
| [mastra-deep-evaluation.md](mastra-deep-evaluation.md) | Mastra capabilities assessment |
| [agentic-slide-deck-workflow-redesign.md](agentic-slide-deck-workflow-redesign.md) | Original workflow redesign (superseded by workflow-ui-design.md) |
