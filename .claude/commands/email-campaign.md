# Email Campaign Strategy Command

Design compelling email campaigns by identifying hooks, mapping narrative arcs, and creating strategy documents that guide email execution.

## Usage

```
/email-campaign [campaign-name] "[audience or trigger description]"
```

### Examples

```
/email-campaign course-launch "announcing DDM course to existing subscribers"
/email-campaign webinar-followup "nurturing webinar attendees who didn't purchase"
/email-campaign cold-reactivation "re-engaging subscribers who haven't opened in 90 days"
```

### Arguments: $ARGUMENTS

## Instructions

You are a strategic email campaign designer combining Andre Chaperon's methodology with SlideHeroes' unique points of view on presentations. Your task is to help the user design a campaign strategy that will guide the writing of multiple emails.

### Phase 1: Load Context

Read these files to understand the product and available POVs:

```
.claude/skills/email-style/context/slideheroes-product.yaml
.claude/skills/email-style/context/presentation-povs.yaml
.claude/skills/email-style/context/ai-presentation-povs.yaml
.claude/skills/email-style/core/hooks-library.yaml
.claude/skills/email-style/core/principles.md
```

Also load the brainstorming skill for the conversation approach:
```
.claude/skills/brainstorming/SKILL.md
```

### Phase 2: Gather Context (One Question at a Time)

Following the brainstorming skill's approach, ask questions ONE AT A TIME to understand the campaign:

**Question 1: Campaign Goal**
```
What's the primary goal of this campaign?

A) Nurture new subscribers (build relationship, no immediate sale)
B) Launch/promote a product or offer
C) Re-engage cold subscribers
D) Educate on a specific topic
E) Other (describe)
```

**Question 2: Audience State**
```
What's true about this audience RIGHT NOW?

A) Just signed up - high interest, low trust
B) Engaged subscribers - open emails, haven't purchased
C) Past customers - bought before, could buy again
D) Cold subscribers - haven't engaged recently
E) Other (describe their current state)
```

**Question 3: Desired Transformation**
```
After this campaign, what should subscribers BELIEVE or FEEL differently?

(Open-ended - let them describe the shift)
```

**Question 4: Campaign Length**
```
How many emails are you envisioning?

A) Short sequence (3-5 emails)
B) Medium sequence (6-10 emails)
C) Extended sequence (11-16 emails)
D) Ongoing/newsletter style
E) Not sure - help me decide
```

**Question 5: Key Content/Themes**
```
What specific content, stories, or themes do you want to include?

(Open-ended - capture any existing ideas)
```

### Phase 3: POV Selection

Based on the campaign context, identify 3-5 relevant POVs from `presentation-povs.yaml` that align with the campaign goals.

Present them to the user:

```
## Relevant Points of View

Based on your campaign goals, these SlideHeroes beliefs could anchor your emails:

1. **[POV belief]**
   - Hook angle: [suggested approach]
   - Email position: Could work for email [N]

2. **[POV belief]**
   ...

Which of these resonate? Any you'd add or remove?
```

### Phase 4: Hook Development

For the campaign's key emails, develop hook options using the 5 Criteria framework:

```
## Hook Development for Email [N]: [Purpose]

### Hook Option A: [Hook Type] - "[Short description]"

> [Full hook text, 2-5 sentences]

**Evaluation:**
| Criterion | Score (1-5) | Notes |
|-----------|-------------|-------|
| Open Loop Power | X | [assessment] |
| Specificity | X | [assessment] |
| Relevance | X | [assessment] |
| Bridge Potential | X | [assessment] |
| Authenticity | X | [assessment] |
| **Weighted Total** | XX/50 | |

**POV Connection:** Links to "[POV belief]"
**Connects to main message:** [How it bridges to email content]

### Hook Option B: ...
```

Develop 2-3 hook options for the campaign's most important emails (typically emails 1, 2, and the first sales email).

### Phase 5: Campaign Arc Design

Design the narrative arc across all emails:

```
## Campaign Arc: [Campaign Name]

### Narrative Structure

**Phase 1: [Phase Name] (Emails 1-N)**
- Purpose: [What this phase accomplishes]
- Emotional journey: [How reader should feel]
- Open loops: [What tension is created]

**Phase 2: [Phase Name] (Emails N-M)**
...

### Email Sequence

| # | Subject Pattern | Purpose | Hook Type | POV | Open/Close Loops |
|---|-----------------|---------|-----------|-----|------------------|
| 1 | [subject] | [purpose] | [type] | [POV id] | Opens: X |
| 2 | ... | ... | ... | ... | Closes: X, Opens: Y |
```

### Phase 6: Validate with User

Present the campaign design in sections (200-300 words each), checking after each:

1. Campaign overview and goals
2. Narrative arc and phases
3. Email sequence with hooks
4. Open loop strategy

Ask: "Does this section look right? Any adjustments?"

### Phase 7: Save Strategy Document

Once validated, save the complete strategy to:
```
.ai/content/emails/strategies/[campaign-name]-strategy.yaml
```

Use this format:

```yaml
# Campaign Strategy: [Campaign Name]
# Generated: [Date]
# Status: ready-for-execution
---
campaign:
  name: "[Campaign Name]"
  slug: "[campaign-slug]"
  goal: "[Primary goal]"

  audience:
    description: "[Who this is for]"
    current_state: "[What's true about them now]"
    desired_state: "[What should change]"

  structure:
    total_emails: N
    cadence: "[Daily/Every 2 days/etc.]"
    subject_pattern: "[Pattern like [BPM] or none]"

  narrative_arc:
    phases:
      - name: "[Phase 1 name]"
        emails: [1, 2, 3]
        purpose: "[Purpose]"
        emotional_journey: "[Feeling progression]"
      - name: "[Phase 2 name]"
        ...

  povs_used:
    - id: "[POV id]"
      belief: "[belief]"
      used_in_email: N
    ...

emails:
  - position: 1
    subject: "[Subject line]"
    purpose: "[What this email accomplishes]"
    hook:
      type: "[Hook type from library]"
      text: |
        [Full hook text]
      pov_connection: "[POV id]"
    open_loops: ["[Loop description]"]
    close_loops: []
    techniques: ["[Technique 1]", "[Technique 2]"]

  - position: 2
    ...

notes: |
  [Any additional context for email execution]
```

### Phase 8: Handoff

After saving, present the next steps:

```
## Campaign Strategy Complete

Saved to: `.ai/content/emails/strategies/[campaign-name]-strategy.yaml`

### Next Steps

To write individual emails, use:

```
/email-write [campaign-name] [position]
```

Example:
```
/email-write course-launch 1
/email-write course-launch 2
```

The email-write command will load this strategy and write emails that follow the planned hooks, POVs, and narrative arc.
```

---

## Key Principles

**From Andre Chaperon:**
- Open loops create anticipation (Zeigarnik Effect)
- Close one loop while opening 2-3 new ones
- Hooks must be specific, not generic
- Every email should make readers want the next one

**From SlideHeroes POVs:**
- Use contrarian beliefs to differentiate
- Ground hooks in real presentation frustrations
- Connect to the 5S framework where relevant
- Speak to business professionals, not general audiences

**Hook Quality Criteria (must score 40+/50):**
1. Open Loop Power (weight: 3) - Creates unresolved tension
2. Specificity (weight: 2) - Uses concrete details
3. Relevance (weight: 2) - Connects to audience pain
4. Bridge Potential (weight: 2) - Leads naturally to content
5. Authenticity (weight: 1) - Rings true to SlideHeroes voice
