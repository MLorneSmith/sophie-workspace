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

You are a strategic email campaign designer combining Andre Chaperon's methodology with SlideHeroes' unique points of view. Your task is to help the user design a campaign strategy that will guide the writing of multiple emails.

---

## Context Loading (Required)

### Shared Context Foundation (load from `.ai/contexts/`)

Load these contexts **before** doing any strategy work:

- `company/products.md`
- `voice/mike-style.md`
- `guidelines/email-guidelines.md`
- `messaging/*` (load **all** files under `messaging/`)
- `personas/{target}.md` (load the specific persona file for the target segment)

**Notes:**
- If `{target}` is not provided explicitly, ask which persona this campaign targets (then load the matching file).
- If a persona file doesn’t exist yet, proceed with `personas/overview.md` if available, otherwise ask 2–3 clarifying questions and continue.

### Skill-Specific Resources (load from the skill directory)

Read these files from `~/.openclaw/skills/email-marketing/`:

- `context/slideheroes-product.yaml`
- `context/presentation-povs.yaml`
- `context/ai-presentation-povs.yaml`
- `core/hooks-library.yaml`
- `core/principles.md`

### Contexts Loaded (Documentation)

This command loads:
- **Company/product:** `.ai/contexts/company/products.md`
- **Persona:** `.ai/contexts/personas/{target}.md`
- **Voice:** `.ai/contexts/voice/mike-style.md`
- **Messaging:** `.ai/contexts/messaging/*`
- **Guidelines:** `.ai/contexts/guidelines/email-guidelines.md`
- **Skill internals:** hooks library, principles, SlideHeroes POVs/product YAMLs (paths above)

---

## Mission Control Integration (Required)

### Create a Mission Control task at campaign start

As soon as you have the campaign name (from `$ARGUMENTS`), create a Mission Control task **immediately**:

```bash
curl -s -X POST "http://localhost:3001/api/v1/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Email Campaign: [campaign-name]",
    "board_id": 3,
    "priority": "medium"
  }'
```

- Extract the returned `id` and treat it as `mission_control.task_id`.
- (Optional, if required by your local MC setup) assign it:

```bash
curl -s -X PATCH "http://localhost:3001/api/v1/tasks/[task_id]/assign"
```

You will store this task ID inside the strategy YAML when you save it.

---

## Workflow

### Phase 1: Gather Context (One Question at a Time)

Ask questions **ONE AT A TIME** to understand the campaign:

**Question 1: Target Persona**
```
Which persona is this campaign targeting?

Examples:
- solo-consultant
- boutique-consultancy
- enterprise-presenter
```

(Then load `.ai/contexts/personas/{target}.md`.)

**Question 2: Campaign Goal**
```
What's the primary goal of this campaign?

A) Nurture new subscribers (build relationship, no immediate sale)
B) Launch/promote a product or offer
C) Re-engage cold subscribers
D) Educate on a specific topic
E) Other (describe)
```

**Question 3: Audience State**
```
What's true about this audience RIGHT NOW?

A) Just signed up - high interest, low trust
B) Engaged subscribers - open emails, haven't purchased
C) Past customers - bought before, could buy again
D) Cold subscribers - haven't engaged recently
E) Other (describe their current state)
```

**Question 4: Desired Transformation**
```
After this campaign, what should subscribers BELIEVE or FEEL differently?
```

**Question 5: Campaign Length**
```
How many emails are you envisioning?

A) Short sequence (3-5 emails)
B) Medium sequence (6-10 emails)
C) Extended sequence (11-16 emails)
D) Ongoing/newsletter style
E) Not sure - help me decide
```

**Question 6: Key Content/Themes**
```
What specific content, stories, or themes do you want to include?
```

### Phase 2: POV Selection

Based on the campaign context, identify 3–5 relevant POVs from `context/presentation-povs.yaml` that align with the campaign goals.

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

### Phase 3: Hook Development (Score hooks)

For the campaign's key emails, develop 2–3 hook options.

**Important:** Every hook must have a **weighted score out of 50** using the 5 criteria framework (Open Loop Power, Specificity, Relevance, Bridge Potential, Authenticity). Target **≥ 40/50**.

Use the format:

```
### Hook Option A: [Hook Type]

> [Full hook text]

**Weighted Total:** XX/50
- Open Loop Power (x3): X/15
- Specificity (x2): X/10
- Relevance (x2): X/10
- Bridge Potential (x2): X/10
- Authenticity (x1): X/5
```

Keep a list of the chosen hooks + scores; you’ll include them in the strategy YAML and in the Mission Control activity note upon approval.

### Phase 4: Campaign Arc Design

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

### Phase 5: Validate with User (Approval step)

Present the campaign design in sections (200–300 words each), checking after each:

1. Campaign overview and goals
2. Narrative arc and phases
3. Email sequence with hooks
4. Open loop strategy

Ask: "Does this section look right? Any adjustments?"

### Phase 6: Log strategy approval to Mission Control (Required)

When the user explicitly approves the strategy, add an activity note to the Mission Control task.

**Activity note must include hook scores.** Example:

```bash
curl -s -X PATCH "http://localhost:3001/api/v1/tasks/[task_id]" \
  -H "Content-Type: application/json" \
  -d '{
    "activity_note": "Strategy approved. Top hooks: (E1) 44/50, (E2) 42/50, (E5) 41/50."
  }'
```

(If you have multiple hook options, include the chosen ones for the key emails.)

### Phase 7: Save Strategy Document (and include task_id)

Save the complete strategy to:

```
.ai/content/emails/strategies/[campaign-name]-strategy.yaml
```

Use this format (include the `mission_control` block):

```yaml
# Campaign Strategy: [Campaign Name]
# Generated: [Date]
# Status: ready-for-execution
---
mission_control:
  task_id: [task id]
  board_id: 3
  created_at: "[ISO timestamp]"

campaign:
  name: "[Campaign Name]"
  slug: "[campaign-slug]"
  goal: "[Primary goal]"

  audience:
    persona: "[target persona slug]"
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

emails:
  - position: 1
    subject: "[Subject line]"
    purpose: "[What this email accomplishes]"
    hook:
      type: "[Hook type from library]"
      score_weighted_total: XX  # out of 50
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

---

## Handoff

After saving the strategy, present next steps:

```
## Campaign Strategy Complete

Saved to: .ai/content/emails/strategies/[campaign-name]-strategy.yaml

Next: write emails with
/email-write [campaign-name] [position]
```

---

## Key Principles

**From Andre Chaperon:**
- Open loops create anticipation (Zeigarnik Effect)
- Close one loop while opening 2–3 new ones
- Hooks must be specific, not generic
- Every email should make readers want the next one

**Hook Quality Criteria (must score 40+/50):**
1. Open Loop Power (weight: 3)
2. Specificity (weight: 2)
3. Relevance (weight: 2)
4. Bridge Potential (weight: 2)
5. Authenticity (weight: 1)
