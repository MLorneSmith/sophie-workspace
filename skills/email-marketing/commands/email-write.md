# Email Write Command

Write individual emails following a campaign strategy, using Andre Chaperon's methodology and SlideHeroes voice.

## Usage

```
/email-write [campaign-name] [position]
/email-write [campaign-name] [position] --validate
```

### Examples

```
/email-write course-launch 1
/email-write course-launch 2
/email-write bpm-onboarding 17
/email-write cold-reactivation 3 --validate
```

### Arguments: $ARGUMENTS

## Instructions

You are an email copywriter executing against a pre-defined campaign strategy. Your task is to write a single email that fits within the campaign's narrative arc, using the planned hook, POVs, and techniques.

---

## Step 1: Parse Arguments

From `$ARGUMENTS`, extract:
- `campaign-name`: the campaign slug
- `position`: the email number to write
- `--validate`: if present, validate an existing draft instead of writing

---

## Step 2: Load Campaign Strategy (and Mission Control task_id)

Read the campaign strategy file:

```
.ai/content/emails/strategies/[campaign-name]-strategy.yaml
```

From this YAML, extract:
- `campaign.structure.total_emails`
- `mission_control.task_id` (if present)

If the strategy file is not found, instruct the user:

```
No strategy found for campaign "[campaign-name]".

Create one first with:
/email-campaign [campaign-name] "[description]"
```

---

## Step 3: Load Context

### Shared Context Foundation (from `.ai/contexts/`)

Load:
- `voice/mike-style.md`
- `guidelines/email-guidelines.md`

If the strategy specifies a persona (recommended), also load:
- `personas/{target}.md`

Optionally load:
- `company/products.md`
- `messaging/*`

### Skill-Specific Resources (from the skill directory)

Load:
- `core/techniques.yaml`
- `core/best-examples.yaml`
- `core/principles.md`
- `context/slideheroes-product.yaml`

---

## Step 4: Load Adjacent Emails (continuity)

If `position > 1`, check for previous emails:

```
.ai/content/emails/[campaign-name]/[position-1]-*.yaml
.ai/content/emails/[campaign-name]/[position-2]-*.yaml
```

Load them to preserve:
- open loops that need closing
- callbacks
- tone consistency

---

## Step 5: Extract Email Spec from Strategy

From the strategy file, get for this position:
- `subject`
- `purpose`
- `hook.text`
- `hook.type`
- `hook.pov_connection`
- `open_loops`
- `close_loops`
- `techniques`

---

## Step 6: Draft Email

Mandatory elements (every email must have):
- Personal greeting ("Hey, it’s Mike…")
- Short-line rhythm (lots of white space)
- P.S. section
- Clever signature

Suggested structure:
1. Hook (from strategy)
2. Bridge to main content
3. Main content (deliver the email’s purpose)
4. Close loops (if any)
5. Open new loops (as specified)
6. Closing + soft CTA (if appropriate)
7. Signature
8. P.S.

---

## Step 7: Self-Review Checklist

- Hook matches strategy and bridges naturally
- POV angle is present
- Continuity: callbacks, closes/open loops
- Formatting: no big paragraphs
- Tone: human, contrarian (when appropriate), not pushy
- Techniques applied (natural, not forced)

---

## Step 8: Present Draft

Present:
- subject
- body
- alignment notes (hook/POV/loops/techniques)

Ask for approval before saving.

---

## Step 9: Save Email

After user approval, save to:

```
.ai/content/emails/[campaign-name]/[position]-[slug].yaml
```

Use the existing email YAML format used by this skill.

---

## Step 10: Mission Control Progress Tracking (Required)

When `/email-write` completes (i.e., **after saving the approved email**):

### A) Update the Mission Control task with progress

If `mission_control.task_id` exists in the strategy YAML, PATCH the task with:

- **Activity note:** `"Email {position}/{total} written"`

```bash
curl -s -X PATCH "http://localhost:3001/api/v1/tasks/[task_id]" \
  -H "Content-Type: application/json" \
  -d '{
    "activity_note": "Email [position]/[total] written"
  }'
```

### B) Mark the task complete when the final email is written

If `position == total`, mark done:

```bash
curl -s -X PATCH "http://localhost:3001/api/v1/tasks/[task_id]/complete"
```

If `task_id` is missing, proceed without Mission Control updates and (optionally) suggest re-running `/email-campaign` to regenerate the strategy with a `mission_control.task_id`.

---

## Validation Mode (`--validate`)

If `--validate` is present:

1. Read the existing email YAML from:
   - `.ai/content/emails/[campaign-name]/[position]-*.yaml`
2. Validate against:
   - required structural elements (greeting, rhythm, P.S., signature)
   - strategy alignment for this position
3. Output a concise validation report.
