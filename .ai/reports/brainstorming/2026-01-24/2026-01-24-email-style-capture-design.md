# Email Style Capture System - Andre Chaperon Method

## Overview

A Claude Code skill that enables writing email marketing sequences in Andre Chaperon's "Art of Email" style, powered by annotated examples and extracted techniques.

### Components

| Component | Purpose |
|-----------|---------|
| **Gmail Export Tool** | TypeScript CLI to extract emails from Gmail to YAML |
| **Techniques Library** | Structured rules extracted from course content + email analysis |
| **Annotated Email Corpus** | 50-60 emails tagged with techniques they demonstrate |
| **Hooks Library** | Curated collection of best hooks, categorized by type |
| **Claude Code Skill** | Orchestrates everything to generate emails in style |

### Key Capabilities

1. **Write emails on demand** - Provide type + hook → get Andre-style email
2. **Hook development mode** - Interactive process to find/develop the perfect hook
3. **Technique-aware generation** - Claude consciously applies named techniques
4. **Research-augmented hooks** - Perplexity integration for external inspiration

### File Location

`.claude/skills/email-style/`

---

## File Structure

```
.claude/skills/email-style/
├── skill.md                      # Skill instructions + workflow logic
│
├── core/                         # Always loaded
│   ├── techniques.yaml           # The technique rulebook
│   ├── best-examples.yaml        # 10-15 gold standard emails
│   └── hooks-library.yaml        # Categorized hook examples
│
├── emails/                       # Extended corpus (loaded on-demand)
│   ├── welcome-sequence/
│   │   ├── 01-welcome.yaml
│   │   └── ...
│   ├── nurture-sequence/
│   └── sales-sequence/
│
└── principles.md                 # Andre's high-level philosophy

tools/email-export/
├── src/
│   ├── index.ts                  # CLI entry point
│   ├── gmail-client.ts           # Gmail API wrapper
│   ├── html-to-text.ts           # Convert HTML emails to clean text
│   └── yaml-writer.ts            # Output formatter
├── package.json
├── tsconfig.json
└── README.md                     # Setup instructions (OAuth, etc.)
```

### Loading Strategy

| Scenario | Files loaded |
|----------|--------------|
| Basic email request with hook provided | skill.md + core/* |
| Hook development mode | skill.md + core/* + perplexity search |
| Request for specific sequence type | skill.md + core/* + relevant emails/* |

---

## Gmail Export Tool

### CLI Interface

```bash
# Export all emails with specific label
pnpm email-export --label "Art of Email" --output ./emails/raw

# Export with date range
pnpm email-export --label "Art of Email" --after 2023-01-01 --output ./emails/raw

# Export specific thread (for sequences)
pnpm email-export --thread-id abc123 --output ./emails/welcome-sequence
```

### Output Format

```yaml
email:
  id: "msg-17f8a2b3c4d5"
  subject_line: "The weird thing about Tuesday..."
  date: "2024-03-15"
  thread_id: "thread-abc123"
  thread_position: 3

  content: |
    Hey,

    Last Tuesday, something strange happened...

    [preserves line breaks and formatting]

  # Empty fields for manual annotation
  campaign: ""
  position: null
  purpose: ""
  techniques_used: []
```

### Key Features

- **HTML → Text conversion** - Strips HTML but preserves Andre's intentional formatting (short lines, spacing)
- **Thread awareness** - Detects sequence position within email threads
- **Idempotent** - Re-running won't duplicate emails (uses message ID)

---

## Techniques Library

### Schema

```yaml
techniques:
  - name: "Open Loop"
    category: "engagement"
    description: |
      Create curiosity by starting a story or idea but deliberately
      not resolving it. The reader must open the next email to find out.

    when_to_use:
      - "End of any email that has a follow-up"
      - "Subject lines to drive opens"
      - "Mid-email to maintain attention"

    formatting:
      line_length: "Short, punchy - often just a few words"
      spacing: "Extra line break before and after the hook"
      example_layout: |
        And then she said something unexpected.

        (I'll tell you what it was tomorrow.)

    variations:
      - name: "Soft open loop"
        description: "Hints at future content without explicit cliffhanger"
        example: "There's more to this story..."
      - name: "Nested loop"
        description: "Opens a new loop before closing the previous one"
        example: "But before I tell you what happened, I need to explain something else first."

    mistakes:
      - "Resolving the loop in the same email (kills anticipation)"
      - "Too many open loops creating confusion"
      - "Loops that feel manipulative rather than genuine"

    examples:
      - source_email: "welcome-seq-03"
        text: "But what happened next surprised even me..."
      - source_email: "nurture-seq-07"
        text: "I'll share the exact framework tomorrow."
```

### Expected Techniques (Initial List)

| Category | Techniques |
|----------|------------|
| **Engagement** | Open Loop, Curiosity Gap, Story Hook |
| **Structure** | Soap Opera Sequence, Episode Framework |
| **Subject Lines** | Pattern Interrupt, Specificity, Intrigue |
| **Persuasion** | Social Proof, Future Pacing, Implied Scarcity |
| **CTAs** | Soft Ask, Direct Ask, Embedded Command |
| **Formatting** | Short Line Rhythm, Strategic Spacing, PS Usage |

---

## Hooks Library

### Schema

```yaml
hooks:
  personal_anecdote:
    description: "Stories from personal experience that create relatability"
    characteristics:
      - "Specific details (day, place, sensory elements)"
      - "Vulnerability or admission of struggle"
      - "Unexpected twist or realization"
    examples:
      - source_email: "welcome-seq-02"
        hook_text: |
          Last Tuesday, I was staring at a blank screen.

          Three cups of coffee in. Zero words written.

          Then my 7-year-old walked in and said something
          that completely changed how I think about writing.
        why_it_works: "Specific details create scene. Relatable struggle. Child's wisdom is unexpected source."
        connects_to: "Lesson about simplicity in writing"

  contrarian:
    description: "Challenges conventional wisdom to create intrigue"
    characteristics:
      - "Direct opposition to common belief"
      - "Confident tone"
      - "Promise of alternative perspective"
    examples:
      - source_email: "sales-seq-01"
        hook_text: |
          Everyone says you need to email your list more often.

          They're wrong.
        why_it_works: "Pattern interrupt. Creates curiosity about the alternative. Bold stance."
        connects_to: "Quality over quantity argument"

  observation:
    description: "Noticing something about the reader or world that resonates"
    # ... same structure

  cultural_reference:
    description: "Movies, books, news, quotes that illuminate a point"
    # ... same structure

  analogy:
    description: "Unexpected comparisons that make concepts click"
    # ... same structure
```

---

## Annotated Email Schema

```yaml
email:
  id: "welcome-seq-03"
  campaign: "Welcome Sequence"
  position: 3
  purpose: "Build curiosity for core offer"
  subject_line: "The weird thing about Tuesday..."

  content: |
    [full email body here]

  techniques_used:
    - technique: "Open Loop"
      location: "closing"
      notes: "Sets up story continued in email 4"
    - technique: "Pattern Interrupt"
      location: "subject line"
      notes: "Unexpected day reference creates curiosity"
```

---

## Skill Workflow

### Invocation Modes

1. **Full Email (hook provided)** - User provides email type + hook → proceed to writing
2. **Hook Development (no hook)** - Enter interactive hook development mode
3. **Sequence Planning** - Plan full sequence arc before writing individual emails

### Hook Development Mode

```
Hook Development Mode
         │
         ▼
┌─────────────────────────────────┐
│ 1. Core message/offer?          │
│ 2. Any initial ideas/angles?    │
│ 3. Target emotion/response?     │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ 4. Research phase (optional)    │
│    → Perplexity-expert search   │
│    → "Stories about [topic]"    │
│    → "Analogies for [concept]"  │
│    → "Surprising facts about X" │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ 5. Present 2-3 hook concepts    │
│    mixing user ideas + research │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ 6. Refine chosen hook           │
└─────────────────────────────────┘
```

### Hook Inspiration Sources

- Personal anecdotes
- Observations about the reader
- Cultural references (movies, books, news, quotes)
- Analogies/metaphors
- Contrarian takes

### Writing Process

1. Identify applicable techniques based on email type + position
2. Draft email applying techniques consciously
3. Self-review checklist:
   - Hook is compelling and specific
   - Open loops placed appropriately
   - Line length follows Andre's rhythm
   - CTA is clear but not pushy
   - Reads like a human, not a marketer
4. Present draft with annotations showing which techniques were applied where

---

## Annotation Workflow

### Phase 1: Manual Annotation (10-15 emails)

You annotate the first batch to establish patterns and train Claude on your interpretation.

### Phase 2: Claude-Assisted Annotation (40-50 emails)

```bash
/email-style annotate --file emails/raw/msg-xyz.yaml
```

Claude proposes annotations, you review and approve:

```
## Proposed Annotation for msg-xyz

**Campaign:** Nurture Sequence
**Position:** Mid-sequence
**Purpose:** Deepen relationship through vulnerability

**Techniques identified:**

| Technique | Location | Confidence | Notes |
|-----------|----------|------------|-------|
| Personal Anecdote | Opening | High | Specific story with sensory details |
| Open Loop | Closing | High | "Tomorrow I'll share..." |
| Curiosity Gap | Para 3 | Medium | Teases framework without revealing |

**Approve this annotation?** [Y / Edit / Skip]
```

---

## Curation Commands

### Select Best Examples

```bash
/email-style curate best-examples
```

Claude analyzes all 50-60 emails, ranks by technique clarity + diversity, proposes top 15 for your approval.

### Extract Hooks

```bash
/email-style curate hooks
```

Claude extracts all hooks, categorizes by type, drafts "why it works" analysis for your review.

### Draft Principles

```bash
/email-style curate principles --source ./course-materials/
```

Claude reads course content and drafts principles.md for your refinement.

---

## Validation Command

```bash
/email-style validate --draft ./draft-email.md
```

Output:

```
## Email Validation Report

### Technique Analysis
✓ Open Loop detected in closing
✓ Short Line Rhythm maintained (avg 5.2 words/line)
⚠ No clear hook identified in opening - consider strengthening

### Formatting Check
✓ Line length: Good (max 9 words)
✓ Paragraph spacing: Good
⚠ PS section: Missing (Andre often uses PS)

### Style Comparison
Similarity scores:
- Tone: 8.1/10
- Structure: 7.5/10
- Vocabulary: 8.4/10

### Suggestions
1. Opening could be more specific - add sensory detail
2. Consider adding PS with secondary CTA
3. Final open loop could be stronger

Overall: **Ready with minor tweaks**
```

---

## Implementation Roadmap

### Phase 1: Foundation (Gmail Export Tool)

- Set up `tools/email-export/` TypeScript project
- Implement Gmail API auth (OAuth2)
- Build export command with label filtering, HTML→text, YAML output
- Test with sample export

### Phase 2: Techniques Extraction

- Review Andre's course content
- Draft initial techniques.yaml (15-20 core techniques)
- Define and validate technique schema

### Phase 3: Email Corpus

- Label emails in Gmail by campaign/sequence
- Run export (50-60 emails → raw YAML)
- Manual annotation (10-15 emails)
- Claude-assisted annotation (remaining 40-50)
- Review and finalize all annotations

### Phase 4: Curation

- Run `curate best-examples` (Claude proposes, you approve)
- Run `curate hooks` (extract and categorize)
- Run `curate principles` (draft philosophy doc)
- Final quality check on all core files

### Phase 5: Skill Development

- Write skill.md orchestration logic
- Implement Hook Development Mode
- Add Perplexity integration for research-augmented hooks
- Add curation commands
- Add validation command

### Phase 6: Testing & Refinement

- Generate test emails across all types
- Validate against real examples (A/B comparison)
- Refine techniques/examples based on results
- Document usage patterns

---

## Estimated Artifacts

| Artifact | Est. Size |
|----------|-----------|
| Gmail Export Tool | ~400 lines TypeScript |
| techniques.yaml | ~500 lines |
| best-examples.yaml | ~800 lines (15 full emails) |
| hooks-library.yaml | ~400 lines |
| principles.md | ~200 lines |
| skill.md | ~300 lines |
| Annotated email corpus | ~50-60 files |

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storage format | YAML | Human-readable, easy to edit |
| File organization | Multi-file by sequence | Manageable, version control friendly |
| Loading strategy | Two-tier (core always, extended on-demand) | Token efficient |
| Annotation approach | Hybrid (manual start, Claude-assisted) | Quality + speed |
| Sample size | 50-60 emails | Sufficient diversity, manageable curation |
| Skill architecture | Technique-aware generation | Claude consciously applies named methods |
