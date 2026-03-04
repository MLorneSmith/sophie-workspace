---
name: blog-writing
description: "Two-stage blog post workflow (strategy → writing) with SlideHeroes context loading, competitor research, and Mission Control progress tracking."
license: MIT
metadata:
  version: 1.0.0
  model: opus
  domains: [content, blog, seo, writing]
  type: workflow
  inputs: [slug, topic]
  outputs: [strategy-yaml, blog-post-markdown]
---

# Blog Writing Skill

Create high-quality, on-brand blog posts using a **two-stage workflow**:

1) **Topic Ideation** → `/blog-ideate`
2) **Strategy & Outline** → `/blog-strategy`
3) **Deep Research** → `/blog-research`
4) **Content Brief** → `/blog-brief`
5) **Outline** → `/blog-outline`
6) **Draft Writing** → `/blog-write`
7) **QA** → `/blog-qa`

This mirrors the email-marketing skill pattern: separate *thinking* (strategy) from *execution* (writing) to reduce drift and improve consistency.

---

## Quick Start

**Generate topic ideas (start here):**
```
/blog-ideate 5 "consulting presentations"
```

**Create a strategy + outline:**
```
/blog-strategy [slug] "[topic]"
```

**Write the post from the strategy:**
```
/blog-write [slug]
```

---

## Triggers

- `/blog-ideate [count] "[theme]"` — Generate keyword-backed topic ideas with dedup
- `/blog-strategy [slug] "[topic]"` — Research + create strategy/outline YAML
- `/blog-research [slug]` — 3-layer deep research (landscape → deep sources → original angle)
- `/blog-brief [slug]` — Auto-generate content brief from research
- `/blog-outline [slug]` — Detailed structural outline with SEO + AEO optimization
- `/blog-write [slug]` — Draft blog post from outline
- `/blog-qa [slug]` — Automated pre-publish QA (content, SEO, technical, brand)
- `blog writing skill` — Natural language activation
- `write a blog post about ...` — Natural language activation

---

## Two-Stage Workflow

```
Topic Ideation (/blog-ideate)
    │
    ├── Load contexts + content index
    ├── Generate seed keywords from theme
    ├── Keyword research (DataForSEO: volume + related)
    ├── Check GSC for opportunity keywords
    ├── Dedup against existing content
    ├── Score & rank topics
    └── Present for Mike's approval
    │
    ▼
Blog Strategy (/blog-strategy)
    │
    ├── Load shared contexts (.ai/contexts/*)
    ├── Keyword research (DataForSEO: volume + related + SERP)
    ├── Define angle/thesis + SEO intent
    ├── Create Mission Control task
    └── Save strategy YAML
    │
    ▼
Deep Research (/blog-research)
    │
    ├── Layer 1: Landscape scan (top 10-15 posts)
    ├── Layer 2: Deep source mining (papers, reports, experts)
    ├── Layer 3: Original angle development
    └── Save research summary
    │
    ▼
Content Brief (/blog-brief)
    │
    ├── Synthesize strategy + research into brief
    ├── Generate SEO metadata (title, description, slug)
    ├── Define success metrics
    └── Save content brief
    │
    ▼
Outline (/blog-outline)
    │
    ├── Translate brief into structural blueprint
    ├── Apply clarity + SEO + AEO best practices
    ├── Validate structure
    └── Save detailed outline
    │
    ▼
Blog Writing (/blog-write)
    │
    ├── Load outline + brief + research
    ├── Draft via Sophie Loop (writer → reviewer iteration)
    ├── Update Mission Control progress
    └── Save draft
    │
    ▼
QA (/blog-qa)
    │
    ├── Content quality checks (sources, originality, readability)
    ├── SEO checks (keywords, meta, links, hierarchy)
    ├── Technical checks (broken links, formatting)
    ├── Brand checks (no AI filler, voice match)
    └── Generate QA report → handoff to Mike review
```

---

## Context Foundation

### SOP (Source of Truth)

The authoritative process doc is `~/clawd/sops/blog-writing-process.md`. This skill implements that SOP. If the SOP and this skill diverge, update both to stay aligned.

### Shared Contexts (.ai/contexts)

This skill depends on the shared context layer in:

```
/home/ubuntu/clawd/.ai/contexts/
```

### Contexts loaded by `/blog-strategy` (Required)

- `personas/{target}.md`
- `company/products.md`
- `messaging/pain-points.md`
- `voice/brand-voice.md`
- `guidelines/blog-guidelines.md`

If `{target}` is not explicitly provided in the request, the command will ask which persona to target.

### Contexts loaded by `/blog-write`

- Same as strategy (plus any additional context explicitly referenced in the strategy YAML)

---

## Mission Control Integration

This skill creates and updates a Mission Control task to track content progress.

**Board:** `board_id = 1` (Business OS) with `contentType` field set

### Task creation (during `/blog-strategy`)

Create a task immediately once you have the slug/topic:

```bash
curl -s -X POST "http://localhost:3001/api/v1/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Blog Post: [slug]",
    "board_id": 1,
    "contentType": "blog_post",
    "contentPhase": "ideation",
    "priority": "medium"
  }'
```

(Optional if required by your MC setup):

```bash
curl -s -X PATCH "http://localhost:3001/api/v1/tasks/[task_id]/assign"
```

Store the returned `id` in the strategy YAML:

```yaml
mission_control:
  task_id: 123
  board_id: 1
  created_at: "2026-02-05T12:34:56Z"
```

### Progress updates (during `/blog-write`)

As sections are completed, PATCH the task with an `activity_note`:

```bash
curl -s -X PATCH "http://localhost:3001/api/v1/tasks/[task_id]" \
  -H "Content-Type: application/json" \
  -d '{
    "activity_note": "Draft progress: wrote H2 3/7 (\"Common mistakes\")."
  }'
```

When the draft is complete, optionally mark the task complete:

```bash
curl -s -X PATCH "http://localhost:3001/api/v1/tasks/[task_id]/complete"
```

---

## Keyword Research (DataForSEO)

During `/blog-strategy`, run keyword research to inform SEO targeting:

```bash
# Get volume + related keywords + SERP analysis for primary keyword
~/clawd/scripts/keyword-research.sh "primary keyword" --related --serp --top 20
```

**Script features:**
- `--related` — discover related keywords (up to 1000+), sorted by volume
- `--serp` — analyze current top-10 SERP results for competitive gaps
- `--top N` — limit related keywords returned (default 20)
- `--location CODE` — location code (default 2840 = US)

**Cost:** ~$0.15-0.23 per full research call (volume + related + SERP)

**Use the output to:**
1. Confirm primary keyword has meaningful volume (>100/mo)
2. Identify secondary/long-tail keywords for H2s and FAQ sections
3. Assess competition level and CPC (high CPC = commercial intent)
4. Review SERP to find content gaps and angle differentiation

**Include in strategy YAML:**
```yaml
seo:
  primary_keyword: "business presentation"
  search_volume: 1300
  competition: "LOW"
  secondary_keywords:
    - keyword: "pitch deck template"
      volume: 3600
    - keyword: "business presentation tips"
      volume: 480
  serp_gap: "No results focus on AI-powered approach"
```

---

## Output Locations

| Asset | Path |
|------|------|
| Ideation output | `.ai/content/blog/ideation/[date]-[theme].md` |
| Strategy YAML | `.ai/content/blog/strategies/[slug]-strategy.yaml` |
| Research summary | `.ai/content/blog/research/[slug]-research.md` |
| Content brief | `.ai/content/blog/briefs/[slug]-brief.md` |
| Outline | `.ai/content/blog/outlines/[slug]-outline.md` |
| Draft post | `.ai/content/blog/posts/[slug].md` |
| QA report | `.ai/content/blog/qa/[slug]-qa.md` |

---

## Command Files

- `commands/blog-ideate.md`
- `commands/blog-strategy.md`
- `commands/blog-research.md`
- `commands/blog-brief.md`
- `commands/blog-outline.md`
- `commands/blog-write.md`
- `commands/blog-qa.md`
- `commands/blog-publish.md`

---

## Core Resources

- `core/outline-template.yaml` — standard structure used for strategies
- `templates/*.md` — post-type templates (how-to, listicle, case study, thought leadership)
