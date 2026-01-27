# Email Style Skill - Andre Chaperon Method

Write compelling email marketing in Andre Chaperon's "Art of Email" style, using annotated examples, extracted techniques, and structured workflows.

## Two-Command Workflow

Use the two-stage email creation process:

1. **`/email-campaign`** - Strategy & hook development (run once per campaign)
   - Loads product context and POVs
   - Develops compelling hooks with quality scoring
   - Creates campaign strategy document

2. **`/email-write`** - Email execution (run for each email)
   - Reads campaign strategy
   - Writes individual emails with planned hooks
   - Maintains narrative continuity

---

## Skill Overview

This skill provides reference documentation for email creation:
1. **Write Guidelines** - How to generate emails with hooks and techniques
2. **Hook Development** - How to develop compelling hooks through research
3. **Validation** - How to check drafts against Andre's style patterns
4. **Campaign Structure** - How to view and work with email sequences

The `/email-campaign` and `/email-write` commands use this skill's resources and guidelines.

## Core Resources

Always load these files before any operation:
- `core/techniques.yaml` - 24 techniques across 7 categories
- `core/best-examples.yaml` - 12 gold standard annotated emails
- `core/hooks-library.yaml` - 45 hooks across 8 categories
- `core/principles.md` - Andre's 7 core philosophy principles

## Context Resources (SlideHeroes-Specific)

Load these for SlideHeroes-specific content and voice:
- `context/slideheroes-product.yaml` - Product positioning, audience, voice guidelines
- `context/presentation-povs.yaml` - 32 belief statements on presentations (for hooks)
- `context/ai-presentation-povs.yaml` - POVs on AI + presentations (placeholder)

### When to Load Context

| Situation | Load Context? |
|-----------|---------------|
| Writing for SlideHeroes campaigns | Yes - all context files |
| Generic email style practice | No - core resources only |
| Hook development | Yes - POVs provide hook angles |
| Validation | No - core resources only |

## Hook Quality Criteria

When developing or evaluating hooks, score against these 5 criteria:

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Open Loop Power | 3 | Creates unresolved psychological tension (Zeigarnik Effect) |
| Specificity | 2 | Uses concrete details vs. generic abstractions |
| Relevance | 2 | Connects to audience's real pain points and desires |
| Bridge Potential | 2 | Naturally transitions to the email's main message |
| Authenticity | 1 | Rings true to SlideHeroes voice and experience |

**Scoring:** Rate each 1-5, multiply by weight. Total: XX/50
- 40+ = Strong hook (proceed)
- 30-39 = Needs refinement
- <30 = Rethink approach

### POV-to-Hook Mapping

Use POVs from `presentation-povs.yaml` to ground hooks in SlideHeroes beliefs:

| POV Category | Best Hook Types |
|--------------|-----------------|
| Identity ("presentations aren't speeches") | Contrarian, Pattern Interrupt |
| Structure ("answer a question") | Reframe, Question |
| Evidence ("demonstrate, don't assert") | Story (with proof), Data |
| Design ("minimalist ethos") | Contrarian, Permission |
| Delivery ("have conviction") | Tough Love, Empathy |

## Extended Corpus (On-Demand)

The `emails/` directory contains 83 annotated emails organized two ways:

### By Type (for style patterns)
```
emails/
├── welcome/     # 6 emails - Welcome sequence openers
├── nurture/     # 39 emails - Relationship-building sequences
├── story/       # 12 emails - Story-driven emails
├── sales/       # 3 emails - Sales/offer emails
└── newsletter/  # 23 emails - Newsletter issues
```

### By Campaign (for sequence context)
```
emails/campaigns/
└── bpm-onboarding/          # 16-email SlideHeroes onboarding sequence
    ├── _campaign.yaml       # Campaign manifest with narrative arc
    └── 01-*.yaml → 16-*.yaml  # Symlinks in sequence order
```

The `_campaign.yaml` manifest contains:
- Campaign metadata (name, audience, goals)
- Narrative arc description (phases and progression)
- Email sequence with position, purpose, and techniques per email

### Loading Strategy

**By Type** (learning style patterns):

| Request | What to Load |
|---------|--------------|
| Basic email with hook | `core/*` only |
| Write welcome email | `core/*` + 2-3 from `emails/welcome/` |
| Write nurture email | `core/*` + 2-3 from `emails/nurture/` |
| Write story email | `core/*` + 2-3 from `emails/story/` |
| Write sales email | `core/*` + all 3 from `emails/sales/` |
| Write newsletter | `core/*` + 2-3 from `emails/newsletter/` |
| Hook development | `core/*` + perplexity research |

**By Campaign** (sequence context):

| Request | What to Load |
|---------|--------------|
| View campaign structure | `emails/campaigns/[name]/_campaign.yaml` |
| Write for existing campaign | `core/*` + campaign manifest + adjacent emails in sequence |
| Create similar campaign | `core/*` + full campaign directory as reference |

### When to Load Extended Examples

Load additional examples from `emails/[type]/` when:
- User requests high fidelity to Andre's style
- The email type has few examples in `best-examples.yaml`
- User explicitly asks for more examples

Load from `emails/campaigns/` when:
- User is writing for an existing campaign (e.g., BPM onboarding)
- User wants to understand sequence flow before writing
- User is creating a new campaign modeled on an existing one
- Maintaining narrative continuity matters (callbacks, open loops)

### Selecting Examples to Load

**When loading by type** from `emails/[type]/`:
1. **Technique diversity** - pick emails demonstrating different techniques
2. **Recent emails** - more representative of current style
3. **Campaign match** if user specified one (LEM, ARM, TWN, etc.)

**When loading by campaign** from `emails/campaigns/[name]/`:
1. **Always load `_campaign.yaml`** first - understand the narrative arc
2. **Load adjacent emails** if writing for a specific position (e.g., emails 5-7 when writing email 6)
3. **Load phase examples** - emails from the same campaign phase
4. **Note open loops** - check what was promised in earlier emails

## Invocation

```bash
# Stage 1: Design campaign strategy
/email-campaign [campaign-name] "[audience description]"

# Stage 2: Write individual emails
/email-write [campaign-name] [position]
/email-write [campaign-name] [position] --validate  # Validate existing draft
```

## Output Locations

| Content | Location |
|---------|----------|
| Campaign strategies | `.ai/content/emails/strategies/[campaign-name]-strategy.yaml` |
| Individual emails | `.ai/content/emails/[campaign-name]/[position]-[slug].yaml` |
| Existing campaigns | `.claude/skills/email-style/emails/campaigns/` |

### Campaign-Aware Writing

When writing for an existing campaign:
```
/email-style write --campaign bpm-onboarding --position 17 "introducing the DDM course offer"
```

This loads:
1. The campaign manifest (`_campaign.yaml`)
2. Adjacent emails (positions 15-16) for context
3. Core techniques and principles

The skill will ensure:
- Continuity with previous emails (callbacks, fulfilled promises)
- Consistent subject line patterns (`[BPM]` or `[5S]` prefix)
- Appropriate phase positioning in narrative arc

---

## Writing Emails

### Input Requirements
- **type**: welcome | nurture | story | sales | newsletter
- **hook**: The opening concept/story/angle (or topic if developing hook inline)
- **context** (optional): Campaign name, sequence position, previous email summary

### Process

#### Step 1: Analyze Request
Determine email type and identify applicable techniques:

| Email Type | Primary Techniques |
|------------|-------------------|
| welcome | Personal Greeting, Campaign Abbreviation, Soft Sell, Open Loop, P.S. Subplot |
| nurture | Story Hook, Curiosity Gap, Future Pacing, Reply Prompt |
| story | Story Hook, Episode Framework, Open Loop, Conversational Asides |
| sales | Social Proof (Implicit), Future Pacing, Soft Sell, Embedded Link |
| newsletter | Campaign Abbreviation, Pattern Interrupt, P.S. Series Archive |

#### Step 2: Load Relevant Examples

**From core (always):**
Load 2-3 examples from `best-examples.yaml` that match the email type.

**From extended corpus (when beneficial):**
If more context would help, load 2-3 additional emails from `emails/[type]/`:

```
# Example: Writing a welcome email
Read: emails/welcome/2024-08-02_134851_tiny-worlds-a-new-frontier-email-1-of-7.yaml
Read: emails/welcome/2019-08-09_163739_lem-lucrative-email-marketing-prologue.yaml
```

**Selection criteria:**
- Match the campaign style if specified
- Pick emails with high technique diversity
- For sequences, load emails with similar position numbers

#### Step 3: Draft Email

Apply these MANDATORY elements (every email must have):
- [ ] **Personal Greeting** - "Hey, it's [Name]..." opener
- [ ] **Short Line Rhythm** - Single sentences, heavy white space
- [ ] **P.S. Section** - Always include, serves strategic purpose
- [ ] **Clever Signature** - "Name 'phrase' LastName" format

Apply these SITUATIONAL elements (based on type):
- [ ] **Open Loop** - If email has follow-up
- [ ] **Story Hook** - For story/nurture emails
- [ ] **Campaign Abbreviation** - If part of named series
- [ ] **Reply Prompt** - To encourage engagement
- [ ] **Soft Sell** - If product mention is relevant

#### Step 4: Self-Review Checklist

Before presenting the draft, verify:

**Hook Quality**
- [ ] Specific and concrete (not generic)
- [ ] Creates genuine curiosity
- [ ] Connects naturally to main content

**Structure**
- [ ] Clear opening → body → closing flow
- [ ] Episode framework: hook → development → insight → next hook
- [ ] P.S. serves a purpose (not just repeated CTA)

**Formatting**
- [ ] Line length: 1-10 words typical
- [ ] Paragraph spacing: blank line between most sentences
- [ ] No walls of text

**Tone**
- [ ] Reads like a person, not a marketer
- [ ] Conversational asides add personality
- [ ] No pushy sales language

**Technique Application**
- [ ] At least 3 named techniques consciously applied
- [ ] Techniques feel natural, not forced

#### Step 5: Present Draft

Present the email with technique annotations:

```
## Draft Email

**Subject:** [Subject line]
**Type:** [type] | **Techniques:** [list of 3-5 applied]

---

[Full email content]

---

### Technique Annotations

| Technique | Location | Notes |
|-----------|----------|-------|
| [technique] | [opening/body/closing/P.S.] | [how it was applied] |
| ... | ... | ... |

### Suggested Variations
- [Alternative subject line]
- [Alternative hook]
- [Alternative P.S.]
```

---

## Developing Hooks

When the user needs help finding the right hook, enter interactive hook development mode.

### Process

#### Step 1: Gather Context (ask user)

```
## Hook Development Mode

Let's find the perfect hook for your email.

**1. What's the core message or offer?**
   What do you want readers to understand/do after reading?

**2. Any initial ideas or angles?**
   Personal stories, observations, metaphors you've considered?

**3. What emotion or response are you aiming for?**
   Curiosity? Recognition? Inspiration? Urgency?

**4. Who specifically is this for?**
   Help me understand their situation and mindset.
```

#### Step 2: Research Phase (optional)

If the user wants research-augmented hooks, use the perplexity-expert agent:

**Search queries to try:**
- "Stories about [topic] that illustrate [concept]"
- "Surprising facts about [topic]"
- "Famous quotes about [theme]"
- "Analogies for [concept]"
- "Contrarian views on [common belief]"

#### Step 3: Generate Hook Options

Present 3 hook concepts mixing user ideas + research:

```
## Hook Options

### Option 1: [Hook Type] - "[Short Description]"
> [Full hook text, 2-5 sentences]

**Why it could work:** [Brief analysis]
**Connects to:** [How it leads to main message]
**Risk:** [Potential weakness]

### Option 2: [Hook Type] - "[Short Description]"
> [Full hook text]
...

### Option 3: [Hook Type] - "[Short Description]"
> [Full hook text]
...

---

**Which direction resonates? Or should we explore something else?**
```

#### Step 4: Refine Chosen Hook

Once user selects direction:
- Strengthen specific details
- Ensure natural transition to main content
- Check against hooks-library.yaml for patterns
- Finalize hook text

#### Step 5: Proceed to Write Mode

With refined hook, offer to write the full email.

---

## Validating Drafts

Check a draft email against Andre's style patterns.

### Process

#### Step 1: Read Draft
Load the draft from provided file path or inline content.

#### Step 2: Technique Analysis

Check for presence of mandatory elements:
- [ ] Personal Greeting
- [ ] Short Line Rhythm
- [ ] P.S. Section

Check for technique application:
- List all techniques detected
- Note techniques that could be added

#### Step 3: Formatting Check

Analyze against style patterns:
- **Line length**: Average words per line (target: 3-8)
- **Paragraph spacing**: Ratio of blank lines to content
- **Sentence structure**: Fragment usage, rhythm variation

#### Step 4: Style Comparison

Compare against best examples for:
- **Tone**: Conversational vs. formal
- **Structure**: Episode framework adherence
- **Vocabulary**: Andre's common phrases and patterns

#### Step 5: Generate Report

```
## Email Validation Report

### Mandatory Elements
✓ Personal Greeting: [found/missing]
✓ Short Line Rhythm: [assessment]
✓ P.S. Section: [found/missing]

### Technique Analysis
**Detected:**
- [Technique]: [location]
- ...

**Suggested additions:**
- [Technique]: [where and why]
- ...

### Formatting Metrics
- Average line length: [X] words (target: 3-8)
- White space ratio: [X]% (target: 40-60%)
- P.S. length: [X] words

### Style Assessment
| Dimension | Score | Notes |
|-----------|-------|-------|
| Tone | X/10 | [assessment] |
| Structure | X/10 | [assessment] |
| Rhythm | X/10 | [assessment] |
| Hook strength | X/10 | [assessment] |

### Improvement Suggestions
1. [Specific, actionable suggestion]
2. [Specific, actionable suggestion]
3. [Specific, actionable suggestion]

### Overall: [Ready / Ready with tweaks / Needs work]
```

---

## Viewing Campaigns

View the structure and narrative arc of an existing campaign.

### Process

#### Step 1: Load Campaign Manifest

```
Read: emails/campaigns/[name]/_campaign.yaml
```

#### Step 2: Present Campaign Overview

```
## Campaign: [Campaign Name]

**Trigger:** [What causes someone to enter this sequence]
**Audience:** [Who this campaign is for]
**Length:** [N] emails over [timeframe]

### Narrative Arc

**Phase 1: [Phase Name] (Emails 1-N)**
[Description of this phase's purpose and content]

**Phase 2: [Phase Name] (Emails N-M)**
[Description]

...

### Email Sequence

| # | Subject | Phase | Purpose |
|---|---------|-------|---------|
| 1 | [subject] | [phase] | [one-line purpose] |
| 2 | ... | ... | ... |

### Key Techniques Used
- [Technique patterns across the campaign]
- [Subject line conventions]
- [Open loop strategies]

---

**What would you like to do?**
- Write the next email in this sequence
- Write a specific position (e.g., email 17)
- Create a similar campaign for a different product
```

#### Step 3: Offer Next Actions

Based on campaign view, offer to:
1. Write the next email in sequence
2. Write for a specific position
3. Extend the campaign with new emails
4. Create a parallel campaign for different product/audience

---

## Quick Reference: Andre's Voice

### Do:
- Use "Hey, it's [Name]" openings
- Write in short, punchy lines
- Include conversational asides in parentheses
- End with clever signature "Name 'phrase' LastName"
- Always include a P.S. with purpose
- Create open loops for follow-up emails
- Use specific details over generic statements
- Ask for replies to build relationship

### Don't:
- Use "Dear subscriber" or formal openings
- Write long paragraphs or walls of text
- Push hard sells or create fake urgency
- Use corporate marketing language
- Skip the P.S.
- Start with "I" as the first word
- Use generic, vague hooks
- Overuse techniques to the point of manipulation

### Signature Phrases:
- "Here's the thing..."
- "But wait, there's more..." (used ironically)
- "Anyhoo..."
- "Just saying."
- "Same time, same place."
- "(But only if you PROMISE to use it responsibly...)"

---

## Available Campaigns

### BPM Onboarding (`bpm-onboarding`)
16-email SlideHeroes onboarding sequence for Lesson Zero signups.

| Phase | Emails | Content |
|-------|--------|---------|
| Welcome & Framework | 1-5 | Welcome + Presentations Reinvented trilogy |
| Credibility | 6-9 | Case studies + DDM errors & omissions |
| 5S Deep Dive | 10-16 | Structure, Story, Substance, Style, Self-Confidence |

**Subject patterns:** `[BPM] ...` or `[5S] ...`

---

## Example Usage

**Step 1: Design campaign strategy**
```bash
/email-campaign course-launch "announcing DDM to existing subscribers"
```
This creates `.ai/content/emails/strategies/course-launch-strategy.yaml`

**Step 2: Write individual emails**
```bash
/email-write course-launch 1
/email-write course-launch 2
/email-write course-launch 3
```
Each email is saved to `.ai/content/emails/course-launch/`

**Validate a draft**
```bash
/email-write course-launch 3 --validate
```
