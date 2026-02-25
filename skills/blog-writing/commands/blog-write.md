# Blog Write Command

Draft a blog post from an existing strategy YAML.

## Usage

```
/blog-write [slug]
```

### Example

```
/blog-write ai-slide-decks
```

### Arguments: $ARGUMENTS

---

## Instructions

You are a blog writer executing a pre-approved strategy.

Your job is to:
1) load the strategy YAML created by `/blog-strategy`,
2) load required shared contexts,
3) draft the post in Markdown **section by section** (H2 by H2),
4) update Mission Control progress as you go,
5) save the final post to `.ai/content/blog/posts/[slug].md`.

Do not reinvent the outline unless the user explicitly asks.

---

## Inputs

### Strategy YAML (required)

Load:

```
/home/ubuntu/clawd/.ai/content/blog/strategies/[slug]-strategy.yaml
```

Read values:
- `mission_control.task_id`
- `post.title`, `post.slug`
- `post.seo.*` (keyword + meta description draft)
- `post.outline.*` (H1, intro bullets, H2s)

---

## Context Loading (Required)

Load these from `/home/ubuntu/clawd/.ai/contexts/` (same set as strategy):

- `personas/{target}.md` (from strategy `post.target_persona`)
- `company/products.md`
- `messaging/pain-points.md`
- `voice/brand-voice.md`
- `guidelines/blog-guidelines.md`

---

## Mission Control Integration (Required)

Use `mission_control.task_id` from the strategy.

### Progress updates

After each major milestone, PATCH the task with an activity note:

```bash
curl -s -X PATCH "http://localhost:3001/api/v1/tasks/[task_id]" \
  -H "Content-Type: application/json" \
  -d '{
    "activity_note": "Draft progress: intro + H2 1/7 complete."
  }'
```

When the draft is saved, optionally:

```bash
curl -s -X PATCH "http://localhost:3001/api/v1/tasks/[task_id]" \
  -H "Content-Type: application/json" \
  -d '{
    "activity_note": "Draft complete: saved to .ai/content/blog/posts/[slug].md"
  }'
```

(Do not mark complete unless explicitly asked or the workflow defines 'draft complete' as done.)

---

## Writing Workflow

### Phase 1: Prepare post frontmatter

Create Markdown with YAML frontmatter:

```markdown
---
title: "..."
slug: "..."
meta_description: "..."
seo_keywords:
  - "..."
  - "..."
date: "YYYY-MM-DD"
---

# H1...
```

### Phase 2: Draft intro

Use the strategy intro bullets:
- Hook (short, specific)
- Establish stakes/pain
- Promise a clear outcome
- Set expectations (what the reader will learn)

### Phase 3: Draft each H2 section

For each `outline.sections[]`:
- Write the H2 heading exactly
- Cover all key points
- Use short paragraphs and scannable formatting
- Add examples where specified
- Include links placeholders where specified

After each H2, update Mission Control with progress (e.g., `H2 3/7 complete`).

### Phase 4: FAQ + conclusion

If `include_faq` is true, write the FAQ with the strategy questions.

Write conclusion:
- recap key points
- soft CTA aligned with SlideHeroes (no hard sell)

### Phase 5: Save output

Save to:

```
/home/ubuntu/clawd/.ai/content/blog/posts/[slug].md
```

---

## Output Contract

- Must follow the strategy outline order
- Must include all H2s
- Must be saved to `.ai/content/blog/posts/[slug].md`
