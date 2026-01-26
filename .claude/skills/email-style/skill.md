# Email Style Skill - Andre Chaperon Method

Write compelling email marketing in Andre Chaperon's "Art of Email" style, using annotated examples, extracted techniques, and structured workflows.

## Skill Overview

This skill enables three modes of operation:
1. **Write Mode** - Generate emails with a provided hook
2. **Hook Mode** - Develop the perfect hook through interactive research
3. **Validate Mode** - Check draft emails against Andre's style patterns

## Core Resources

Always load these files before any operation:
- `core/techniques.yaml` - 24 techniques across 7 categories
- `core/best-examples.yaml` - 12 gold standard annotated emails
- `core/hooks-library.yaml` - 45 hooks across 8 categories
- `core/principles.md` - Andre's 7 core philosophy principles

## Invocation

```
/email-style write [type] "[hook or topic]"
/email-style hook "[topic or offer]"
/email-style validate [file-path]
```

---

## Mode 1: Write Email

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

#### Step 2: Review Relevant Examples
Load 2-3 best examples that match the email type from `best-examples.yaml`.

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

## Mode 2: Hook Development

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

## Mode 3: Validate Draft

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

## Example Usage

### Write a welcome email:
```
/email-style write welcome "Last Tuesday, I almost deleted my entire email list. Here's why I'm glad I didn't."
```

### Develop a hook:
```
/email-style hook "launching a course about email copywriting"
```

### Validate a draft:
```
/email-style validate ./drafts/welcome-email-v1.md
```
