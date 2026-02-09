# Blog Writing System Design

*Part of Content Development System — Board #5*

## Overview

A two-phase system for Sophie to create and publish blog posts to SlideHeroes:

- **Dev Phase**: Content goes through seeding pipeline (survives DB resets)
- **Production Phase**: Direct API publishing (when DB is stable)

---

## Context-Driven Writing

All blog content is written by loading relevant **context files** that ensure consistency with SlideHeroes brand, voice, and messaging.

### Context Foundation

Location: `~/clawd/.ai/contexts/`

```
contexts/
├── company/              # What SlideHeroes is
│   ├── about.md          # Mission, story, philosophy
│   └── products.md       # DDM course, features, pricing
│
├── personas/             # Who we serve
│   ├── overview.md       # Quick reference for all personas
│   ├── solo-consultant.md      # Primary persona
│   ├── boutique-consultancy.md # Team buyers
│   ├── corporate-professional.md # Career-focused
│   └── anti-personas.md  # Who NOT to target
│
├── voice/                # How we sound
│   ├── brand-voice.md    # SlideHeroes tone and style
│   ├── mike-style.md     # Mike's personal voice
│   ├── pov-presentations.md # 32 POVs on presentations
│   └── vocabulary.md     # Words we use/avoid
│
├── messaging/            # What we say
│   ├── positioning.md    # Market positioning
│   ├── value-props.md    # Value by persona
│   ├── pain-points.md    # Problems we solve
│   └── objections.md     # Objection handling
│
└── guidelines/           # How we write
    ├── blog-guidelines.md # Blog post rules
    └── ...
```

### Contexts Loaded for Blog Writing

The **blog-writing skill** loads these contexts before generating content:

| Stage | Contexts Loaded |
|-------|-----------------|
| **Strategy** (`/blog-strategy`) | `personas/{target}.md`, `company/products.md`, `messaging/pain-points.md`, `voice/brand-voice.md`, `guidelines/blog-guidelines.md` |
| **Writing** (`/blog-write`) | Same as strategy + any additional contexts referenced in strategy YAML |

### Why Context Matters

1. **Consistency** — Every post sounds like SlideHeroes, not generic AI
2. **Targeting** — Content speaks to specific personas and their pain points
3. **Voice** — Maintains Mike's distinctive style and vocabulary
4. **Accuracy** — Uses correct product details, pricing, positioning
5. **Efficiency** — No need to re-explain brand context each time

### Workflow Integration

```
/blog-strategy [slug] "[topic]"
    │
    ├── Load contexts (personas, voice, messaging, guidelines)
    ├── Research competing content (web search)
    ├── Define angle based on persona pain points
    ├── Create outline aligned with brand voice
    └── Save strategy YAML
    │
    ▼
/blog-write [slug]
    │
    ├── Load strategy YAML
    ├── Load required contexts
    ├── Draft section-by-section using voice guidelines
    └── Output .mdoc file ready for seeding
```

### Maintaining Contexts

- **Quarterly review:** Check for outdated information
- **After product changes:** Update `products.md`, `positioning.md`
- **After successful content:** Add learnings back to contexts
- **After failed content:** Document what didn't work

---

## Phase 1: Dev Workflow (Current Focus)

### Architecture

```
Sophie writes        Convert to          Commit to        Merge PR        DB Reset
   .mdoc         →   Lexical JSON    →    repo       →   to dev     →   seeds post
                     
seed-data-raw/       seed-data/          Git PR          Mike review     supabase-reset
posts/*.mdoc         posts.json
```

### Workflow Steps

1. **Write Content**
   - Use blog-writing skill for strategy/outline
   - Generate `.mdoc` file with frontmatter + Markdoc content
   - Save to `apps/payload/src/seed/seed-data-raw/posts/`

2. **Convert to Seed Format**
   ```bash
   cd ~/2025slideheroes-sophie/apps/payload
   pnpm seed:convert --collections posts
   ```
   - Transforms `.mdoc` → Lexical JSON
   - Updates `seed-data/posts.json`

3. **Create PR**
   - Commit both `.mdoc` source and generated JSON
   - PR to upstream dev branch
   - Mike reviews content quality

4. **Merge & Seed**
   - After merge, next `supabase-reset` includes new post
   - Post appears in Payload CMS

### File Format: `.mdoc`

```markdown
---
title: Your Post Title
status: published
description: >-
  SEO meta description for the post.
authors:
  - michael
image: /cms/images/post-slug/image.png
categories:
  - Presentations
tags:
  - Tag One
  - Tag Two
publishedAt: 2024-04-10
language: en
order: 0
---

## Introduction

Your content here in Markdoc format...

{% cta
   ctatext="Ready to get started?"
   ctadescription="Call to action description."
   ctabuttontext="Button text" /%}
```

### Markdoc Components Available

- `{% highlight variant="blue" %}text{% /highlight %}` — Highlighted text
- `{% cta ctatext="..." ctadescription="..." ctabuttontext="..." /%}` — Call to action
- `{% bunny bunnyvideoid="..." /%}` — Video embed
- Standard markdown: headings, lists, bold, italic, links, images

---

## Phase 2: Images (Future)

### Requirements
- Images uploaded to Cloudflare R2 storage
- `media.json` updated with R2 URLs
- Posts reference via `{ref:media:path}`

### Workflow (TBD)
1. Generate/source images
2. Upload to R2 bucket
3. Add to `media-references.json`
4. Reference in `.mdoc` file

---

## Phase 3: Production Workflow (Future)

### Requirements
- Stable production database (no frequent resets)
- Sophie API user in Payload (PR #1967)
- Stored credentials on EC2

### Workflow
1. Write content (same as dev)
2. Authenticate via Sophie API credentials
3. POST to Payload REST/GraphQL API
4. Content live immediately

---

## Batch Management

### Tracking Posts for PRs

Maintain a tracking file to manage which posts are ready for PR:

```
apps/payload/src/seed/seed-data-raw/posts/
├── _tracking.json          # Batch status tracking
├── published-post.mdoc     # Already in dev
├── draft-new-post.mdoc     # In progress
└── ready-for-pr.mdoc       # Ready for next batch
```

**_tracking.json format:**
```json
{
  "batches": [
    {
      "id": "batch-2026-02-06",
      "posts": ["post-slug-1", "post-slug-2"],
      "prNumber": 1970,
      "status": "merged"
    }
  ],
  "pending": ["post-slug-3", "post-slug-4"]
}
```

### Batch Workflow
1. Write multiple posts, mark as pending
2. When batch ready, create single PR with all pending posts
3. Update tracking with PR number
4. After merge, move to completed

---

## Quality Gates

Before PR submission, posts must pass:

1. **SEO Check** (blog-post-optimizer skill)
   - Meta description present and optimal length
   - Title optimized for keywords
   - Heading structure (H2, H3)
   - Internal/external links

2. **Readability Check**
   - Flesch reading ease score
   - Sentence/paragraph length
   - Passive voice percentage

3. **Content Check**
   - SlideHeroes voice consistency
   - Factual accuracy
   - CTA placement

---

## Integration Points

### Skills Used
- `blog-writing` — Strategy and content generation
- `blog-post-optimizer` — SEO and readability analysis
- `alpha-orchestrator` — PR workflow for 2025slideheroes

### Mission Control
- Tasks tracked on Board #5 (Content Development System)
- Activity logged after each post batch

### Payload CMS
- Collection: `posts`
- Format: Lexical JSON (converted from Markdoc)
- Schema defined in `apps/payload/src/collections/Posts.ts`

---

## Open Questions

1. **Image sourcing**: Stock photos? AI-generated? Screenshots?
2. **R2 upload automation**: Can Sophie upload directly or manual step?
3. **Author attribution**: Always "michael" or create Sophie author?
4. **Categories/tags**: Use existing or can Sophie create new ones?
5. **Featured image requirements**: Dimensions? Format? Style guidelines?

---

## Revision History

| Date | Change | Author |
|------|--------|--------|
| 2026-02-06 | Added Context-Driven Writing section | Sophie |
| 2026-02-06 | Initial design | Sophie |
