# Email Write Command

Write individual emails following a campaign strategy, using Andre Chaperon's methodology and SlideHeroes voice.

## Usage

```
/content/email-write [campaign-name] [position]
/content/email-write [campaign-name] [position] --validate
```

### Examples

```
/content/email-write course-launch 1
/content/email-write course-launch 2
/content/email-write bpm-onboarding 17
/content/email-write cold-reactivation 3 --validate
```

### Arguments: $ARGUMENTS

## Instructions

You are an email copywriter executing against a pre-defined campaign strategy. Your task is to write a single email that fits within the campaign's narrative arc, using the planned hook, POVs, and techniques.

### Step 1: Parse Arguments

From $ARGUMENTS, extract:
- `campaign-name`: The campaign slug
- `position`: The email number to write
- `--validate`: If present, validate an existing draft instead of writing

### Step 2: Load Campaign Strategy

Read the campaign strategy file:
```
.ai/content/emails/strategies/[campaign-name]-strategy.yaml
```

If not found, inform user:
```
No strategy found for campaign "[campaign-name]".

Create one first with:
/content/email-campaign [campaign-name] "[description]"

Or write a standalone email with:
/email-style write [type] "[hook]"
```

### Step 3: Load Core Resources

```
.claude/skills/email-style/skill.md
.claude/skills/email-style/core/techniques.yaml
.claude/skills/email-style/core/best-examples.yaml
.claude/skills/email-style/core/principles.md
.claude/skills/email-style/context/slideheroes-product.yaml
```

### Step 4: Load Adjacent Emails (for context)

If position > 1, check if previous emails exist:
```
.ai/content/emails/[campaign-name]/[position-1]-*.yaml
.ai/content/emails/[campaign-name]/[position-2]-*.yaml
```

Load them for:
- Open loops that need to be closed
- Callbacks to reference
- Tone consistency

### Step 5: Extract Email Spec from Strategy

From the strategy file, get for this position:
- `subject`: Planned subject line
- `purpose`: What this email accomplishes
- `hook.text`: The developed hook
- `hook.type`: Hook category
- `hook.pov_connection`: Which POV anchors this email
- `open_loops`: Loops to open
- `close_loops`: Loops to close from previous emails
- `techniques`: Techniques to apply

### Step 6: Draft Email

Apply these MANDATORY elements (every email must have):
- [ ] **Personal Greeting** - "Hey, it's [Name]..." opener
- [ ] **Short Line Rhythm** - Single sentences, heavy white space
- [ ] **P.S. Section** - Always include, serves strategic purpose
- [ ] **Clever Signature** - "Name 'phrase' LastName" format

Apply the planned hook and techniques from the strategy.

**Structure:**
1. Hook (from strategy)
2. Bridge to main content
3. Main content (develop the email's purpose)
4. Open loops (as specified)
5. Close loops (if any from previous emails)
6. Closing + soft CTA if appropriate
7. Signature
8. P.S. (strategic purpose)

### Step 7: Self-Review Checklist

Before presenting, verify:

**Hook Quality (from strategy)**
- [ ] Uses the planned hook text
- [ ] Connects naturally to main content
- [ ] POV is reflected in the angle

**Narrative Continuity**
- [ ] Callbacks to previous emails (if position > 1)
- [ ] Closes loops as specified
- [ ] Opens new loops as specified

**Formatting**
- [ ] Line length: 1-10 words typical
- [ ] Paragraph spacing: blank line between most sentences
- [ ] No walls of text

**Tone**
- [ ] Reads like a person, not a marketer
- [ ] Conversational asides add personality
- [ ] No pushy sales language
- [ ] Reflects SlideHeroes voice (expert, contrarian, generous)

**Technique Application**
- [ ] All planned techniques consciously applied
- [ ] Techniques feel natural, not forced

### Step 8: Present Draft

```markdown
## Draft Email: [Campaign Name] - Email [Position]

**Subject:** [Subject line]
**Type:** [email type] | **Position:** [N] of [total]

---

[Full email content with proper formatting]

---

### Strategy Alignment

| Element | Planned | Executed |
|---------|---------|----------|
| Hook | [planned hook type] | ✓ Applied |
| POV | [POV id] | ✓ Reflected in [location] |
| Open Loops | [list] | ✓ Opened at [location] |
| Close Loops | [list] | ✓ Closed at [location] |
| Techniques | [list] | ✓ Applied |

### Technique Annotations

| Technique | Location | How Applied |
|-----------|----------|-------------|
| [technique] | [opening/body/closing/P.S.] | [description] |
| ... | ... | ... |

### Continuity Notes

- **Callbacks:** [What this email references from previous]
- **Setup:** [What this email sets up for future emails]

### Suggested Variations
- Alternative subject: [option]
- Alternative P.S.: [option]
```

### Step 9: Save Email

After user approval, save to:
```
.ai/content/emails/[campaign-name]/[position]-[slug].yaml
```

Format:
```yaml
# Email: [Campaign Name] - Position [N]
# Written: [Date]
# Status: draft | approved | sent
---
metadata:
  campaign: "[campaign-name]"
  position: N
  subject: "[Subject line]"
  written_date: "[Date]"
  status: "draft"

content:
  subject: "[Subject line]"
  body: |
    [Full email content]

strategy_alignment:
  hook_type: "[type]"
  pov_used: "[POV id]"
  techniques: ["technique1", "technique2"]
  open_loops: ["loop1"]
  close_loops: ["loop2"]

annotations:
  - technique: "[technique]"
    location: "[where]"
    notes: "[how applied]"

variations:
  subjects:
    - "[Alternative 1]"
  ps_options:
    - "[Alternative P.S.]"
```

---

## Validation Mode (--validate)

If `--validate` flag is present:

1. Read the existing email from `.ai/content/emails/[campaign-name]/[position]-*.yaml`
2. Run the validation checklist from `skill.md` Mode 3
3. Check alignment with campaign strategy
4. Generate validation report

---

## Standalone Mode (No Strategy)

If no campaign strategy exists and user wants to write anyway:

```
No strategy found. Would you like to:

A) Create a campaign strategy first (/content/email-campaign)
B) Write a standalone email (provide hook and type)
```

If B, fall back to the original email-style write mode:
- Ask for email type (welcome, nurture, story, sales, newsletter)
- Ask for hook
- Write without campaign context

---

## Quick Reference: SlideHeroes Voice

**Do:**
- Use "Hey, it's [Name]" openings
- Write in short, punchy lines
- Include conversational asides in parentheses
- End with clever signature
- Reference SlideHeroes POVs naturally
- Challenge bad presentation advice

**Don't:**
- Use formal corporate language
- Write long paragraphs
- Push hard sells
- Use generic hooks that could be from any company
- Forget the P.S.

**Signature Phrases:**
- "Here's the thing..."
- "Anyhoo..."
- "Just saying."
- "(But only if you PROMISE to use it responsibly...)"
