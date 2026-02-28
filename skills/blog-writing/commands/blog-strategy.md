# Blog Strategy Command

Create a blog post strategy + detailed outline (H2s with bullet points), backed by lightweight competitor research.

## Usage

```
/blog-strategy [slug] "[topic]"
```

### Examples

```
/blog-strategy ai-slide-decks "How AI is changing slide deck creation for consultants"
/blog-strategy pitch-deck-structure "Pitch deck structure that wins consulting work"
```

### Arguments: $ARGUMENTS

---

## Instructions

You are a blog content strategist for SlideHeroes. Your job is to:
1) load the required shared contexts,
2) **run keyword research** via `~/clawd/scripts/keyword-research.sh "[primary keyword]" --related --serp --top 20`,
3) research competing content quickly (web search + SERP results from step 2),
4) propose a differentiated angle informed by keyword data and SERP gaps,
5) produce a **detailed outline with H2s** (use secondary keywords for H2 topics where natural),
6) create a Mission Control task (board_id: 3), then
7) save a strategy YAML to `.ai/content/blog/strategies/[slug]-strategy.yaml` (include `seo:` section with keyword data).

Do not begin outlining until the required contexts are loaded.

---

## Context Loading (Required)

Load these from `/home/ubuntu/clawd/.ai/contexts/` **before** any strategy work:

- `personas/{target}.md`
- `company/products.md`
- `messaging/pain-points.md`
- `voice/brand-voice.md`
- `guidelines/blog-guidelines.md`

If `{target}` (persona) is not provided explicitly, ask **one question**:

> “Which persona is this for? (e.g., solo-consultant, boutique-consultancy, enterprise-presenter)”

Then load `personas/{target}.md`.

---

## Mission Control Integration (Required)

### Create task immediately

As soon as you have `[slug]` from `$ARGUMENTS`, create a Mission Control task:

```bash
curl -s -X POST "http://localhost:3001/api/v1/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Blog Post: [slug]",
    "board_id": 3,
    "priority": "medium"
  }'
```

- Extract `id` → `mission_control.task_id`.

(Optional if required):

```bash
curl -s -X PATCH "http://localhost:3001/api/v1/tasks/[task_id]/assign"
```

---

## Workflow

### Phase 1: Clarify inputs (minimal)

If missing, ask **one at a time**:
1) Target persona (required)
2) Post type (how-to | listicle | case-study | thought-leadership)
3) Any must-include keyword(s) or product angle

Default assumptions if user doesn’t care:
- post_type: `how-to`
- primary_goal: `educate`

### Phase 2: SERP / competitor research (required)

Use `web_search` to find competing content. Query patterns:

- `"[topic]" guide`
- `"[primary keyword]"`
- `site:*.com "[topic]"`

Collect 5–8 results. For each:
- title
- URL
- quick notes: angle, structure, gaps

### Phase 3: Define the differentiated angle

Produce:
- thesis (one sentence)
- unique value (what we add that top results don’t)
- optional contrarian take (if it fits brand voice)

### Phase 4: Build a detailed outline (H2s)

Requirements:
- Clear H1
- 5–9 H2 sections (more if truly needed)
- Each H2 includes:
  - purpose
  - key points (bullets)
  - examples/data to include
  - suggested internal/external links (placeholders ok)
- Include an FAQ section if guidelines request it

### Phase 5: Save the strategy YAML

Save to:

```
/home/ubuntu/clawd/.ai/content/blog/strategies/[slug]-strategy.yaml
```

Use the structure from:

- `~/.openclaw/skills/blog-writing/core/outline-template.yaml`

Populate at least:
- `mission_control.task_id`
- `post.title`, `post.slug`, `post.topic`, `post.post_type`, `post.target_persona`
- `post.seo.primary_keyword` (best guess if none given)
- `post.angle.thesis`, `post.angle.unique_value`
- `post.research.competitor_serp_notes`
- `post.outline.sections[]` (H2s)

### Phase 6: Handoff

After saving, output:
- the saved path
- 3 title options
- the final H2 list

Then instruct next step:

```
/blog-write [slug]
```

---

## Output Contract

### Strategy file

- Path: `.ai/content/blog/strategies/[slug]-strategy.yaml`
- Must include: `mission_control.task_id`
