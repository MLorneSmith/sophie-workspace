# Content Development System Design

**Status:** Draft (v2)
**Author:** Sophie
**Date:** 2026-02-04
**Updated:** 2026-02-04
**Task:** #21

---

## Executive Summary

This document outlines the design for a unified Content Development System that:
1. **Establishes a Context Foundation** — shared knowledge layer that powers all content AI
2. Integrates the existing email-marketing skill with Mission Control (newsletter/marketing emails)
3. Creates a system for **outbound email** (prospecting/sales outreach)
4. Creates a parallel system for blog post creation
5. Establishes patterns for future content types (YouTube scripts, LinkedIn posts, web pages)

---

## Goals

1. **Context Foundation** - Build once, use everywhere — rich context maximizes AI output quality
2. **Unified Workflow** - All content follows similar creation patterns
3. **Mission Control Integration** - Content tasks tracked alongside engineering work
4. **Quality Gates** - Automated checks prevent low-quality content shipping
5. **Scalability** - Easy to add new content types

---

## Context Foundation

> *"Context engineering is the delicate art and science of filling the context window with just the right information — not more, not less."* — Joe (The Workflow Company)

### Why Context Matters

Without rich context, AI produces generic content. With the right context, AI produces content that sounds like Mike, speaks to the exact audience, and reinforces SlideHeroes positioning.

**The rule:** Build the context layer ONCE, maintain it, and feed it into every content workflow.

### Context Architecture

```
.ai/contexts/
├── company/
│   ├── about.md              # What SlideHeroes is, mission, origin story
│   ├── products.md           # Product features, benefits, pricing tiers
│   ├── differentiators.md    # What makes us different from competitors
│   └── roadmap.md            # Where the product is headed (for forward-looking content)
│
├── personas/
│   ├── overview.md           # Summary of all target personas
│   ├── solo-consultant.md    # Individual consultants building pitches
│   ├── boutique-consultancy.md # Small firms (2-20 people)
│   ├── enterprise-presenter.md # Corporate presentation builders
│   └── anti-personas.md      # Who we DON'T target (avoid wasted effort)
│
├── voice/
│   ├── brand-voice.md        # SlideHeroes tone, personality, vibe
│   ├── mike-style.md         # Mike's personal writing style (for emails/thought leadership)
│   ├── pov-presentations.md  # Our takes on presentations, storytelling, consulting
│   ├── pov-ai.md             # Our takes on AI in content/presentation creation
│   └── vocabulary.md         # Words we use, words we avoid
│
├── messaging/
│   ├── positioning.md        # Core positioning statement
│   ├── value-props.md        # Key value propositions by persona
│   ├── pain-points.md        # Problems we solve (by persona)
│   ├── objections.md         # Common objections and responses
│   └── proof-points.md       # Case studies, testimonials, stats
│
├── guidelines/
│   ├── email-guidelines.md     # Andre Chaperon methodology, hook patterns (marketing)
│   ├── outbound-guidelines.md  # Cold email best practices, personalization rules, spam avoidance
│   ├── blog-guidelines.md      # SEO rules, structure, readability targets
│   ├── social-guidelines.md    # LinkedIn/Twitter voice and format
│   └── formatting.md           # Platform-specific formatting rules
│
└── campaigns/
    ├── active/               # Current campaign angles being tested
    │   └── course-launch.md  # DDM course launch messaging
    └── archive/              # Past campaigns for reference
```

### Context File Format

Each context file follows a consistent structure:

```markdown
# [Context Name]

**Last Updated:** 2026-02-04
**Owner:** Mike / Sophie
**Used By:** email-campaign, blog-write, social-post

---

## Summary
[2-3 sentence overview]

## Details
[Rich context content]

## Examples
[Real examples that demonstrate this context]

## Anti-patterns
[What to avoid]
```

### Building the Context Layer

**Phase 1: Extract from existing sources**
- Mike's emails (Gmail export)
- SlideHeroes website copy
- LinkedIn posts
- Existing course content
- Past presentations

**Phase 2: Structure and refine**
- Organize into context files
- Have Mike review and edit
- Add examples and anti-patterns

**Phase 3: Maintain**
- Update after product changes
- Add learnings from successful content
- Prune outdated information

### Context Usage

Every content workflow loads relevant contexts before generation:

```yaml
# Example: email-campaign workflow
contexts_required:
  - company/products.md
  - personas/{target_persona}.md
  - voice/mike-style.md
  - messaging/value-props.md
  - messaging/pain-points.md
  - guidelines/email-guidelines.md
  - campaigns/active/{campaign}.md
```

The AI receives these as system context, ensuring consistent, on-brand output.

---

## Architecture

### Content Types

| Type | Audience | Purpose | Volume | Personalization |
|------|----------|---------|--------|-----------------|
| **Marketing Email** | Subscribers (opted-in) | Nurture, educate, sell | Campaigns (3-8 emails) | Segment-level |
| **Outbound Email** | Prospects (cold/warm) | Start conversations, book meetings | Per-prospect or batch | Individual-level |
| **Blog Post** | Public (SEO) | Attract, educate, establish authority | 2-4/month | None (broadcast) |
| **LinkedIn Post** | Network | Thought leadership, engagement | Daily-ish | None (broadcast) |
| **YouTube Script** | Subscribers + public | Educate, demonstrate, build trust | 1-2/month | None (broadcast) |

### Content Lifecycle

```
                    ┌─────────────────┐
                    │  Mission Control │
                    │   (Task Tracking) │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Content Request │
                    │  (User or Cron)  │
                    └────────┬────────┘
                             │
       ┌─────────────┬───────┼───────┬─────────────┐
       │             │       │       │             │
┌──────▼──────┐ ┌────▼────┐ ┌▼─────┐ ┌▼────────┐ ┌─▼───────┐
│  Marketing  │ │Outbound │ │ Blog │ │LinkedIn │ │ YouTube │
│   Email     │ │ Email   │ │ Post │ │  Post   │ │ Script  │
└──────┬──────┘ └────┬────┘ └──┬───┘ └────┬────┘ └────┬────┘
       │             │         │          │           │
       └─────────────┴─────────┴──────────┴───────────┘
                             │
                    ┌────────▼────────┐
                    │  Context Layer  │
                    │ (shared foundation) │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Two-Stage      │
                    │  Workflow       │
                    │  Strategy →     │
                    │  Execution →    │
                    │  Review →       │
                    │  Publish        │
                    └────────┬────────┘
                             │
       ┌─────────────┬───────┼───────┬─────────────┐
       │             │       │       │             │
┌──────▼──────┐ ┌────▼────┐ ┌▼─────┐ ┌▼────────┐ ┌─▼───────┐
│   Gmail/    │ │Sequencer│ │ CMS  │ │LinkedIn │ │ YouTube │
│  Broadcast  │ │ (Instantly,│ │      │ │  API    │ │ Upload  │
│             │ │  Apollo) │ │      │ │         │ │         │
└─────────────┘ └─────────┘ └──────┘ └─────────┘ └─────────┘
```

### File Structure

```
.ai/content/
├── marketing-emails/           # Newsletter/nurture campaigns (subscribers)
│   ├── strategies/
│   │   └── [campaign]-strategy.yaml
│   └── [campaign]/
│       └── [position]-[slug].yaml
│
├── outbound-emails/            # Prospecting/sales outreach
│   ├── sequences/              # Reusable sequence templates
│   │   └── [sequence-name]/
│   │       └── [step]-[variant].yaml
│   ├── personalized/           # Per-prospect customizations
│   │   └── [prospect-slug].yaml
│   └── experiments/            # A/B test variants
│       └── [experiment-name]/
│
├── blog-posts/
│   ├── strategies/
│   │   └── [slug]-strategy.yaml
│   └── posts/
│       └── [slug].md
│
├── linkedin-posts/
│   ├── ideas/
│   └── published/
│
└── youtube/
    ├── strategies/
    └── scripts/
```

---

## Mission Control Integration

### Board Structure

Create a dedicated **"Content"** board (id TBD) or use existing "Newsletter & Content" board.

### Task Creation Flow

When content work begins:

```typescript
// POST /api/v1/tasks
{
  "name": "Email Campaign: course-launch",
  "description": "6-email campaign announcing DDM to subscribers\nStrategy: .ai/content/emails/strategies/course-launch-strategy.yaml",
  "boardId": 3,  // Newsletter & Content
  "priority": "medium",
  "status": "backlog"
}
```

### Status Mapping

| Content Stage | Mission Control Status |
|---------------|------------------------|
| Strategy defined | `backlog` |
| Actively writing | `in_progress` |
| Ready for review | `in_review` |
| Published/sent | `done` |

### Activity Logging

Log key milestones:

```typescript
// POST /api/sophie/activity
{
  "summary": "Created email campaign strategy",
  "action": "content_strategy",
  "details": "course-launch: 6 emails, first send 2/15"
}
```

### API Extensions Needed

Add endpoints for content-specific operations:

```
GET  /api/content/campaigns      # List all content campaigns
POST /api/content/campaigns      # Create campaign + MC task
GET  /api/content/campaigns/:id  # Get campaign details
PATCH /api/content/campaigns/:id # Update status
```

---

## Email Campaign Integration

### Current State (email-marketing skill)

The skill already has:
- Two-stage workflow (strategy → execution)
- Hook quality scoring
- Validation scripts
- Output to `.ai/content/emails/`

### Integration Points

1. **On `/email-campaign` start:**
   - Create Mission Control task
   - Set status to `in_progress`

2. **On strategy approval:**
   - Log activity with hook scores
   - Keep status `in_progress`

3. **On each email completion:**
   - Log activity with validation results
   - Update task description with progress (e.g., "3/6 emails written")

4. **On campaign completion:**
   - Mark task `done`
   - Log summary activity

### Skill Modifications

Add to `email-campaign.md`:

```markdown
## Mission Control Integration

After creating strategy, automatically:
1. POST to /api/v1/tasks to create tracking task
2. Include strategy path in description
3. Set boardId to 3 (Newsletter & Content)

Store task ID in strategy YAML for later updates:
```yaml
mission_control:
  task_id: 42
  created_at: 2026-02-04T12:00:00Z
```
```

---

## Outbound Email System Design

> Distinct from marketing emails: outbound goes to prospects who haven't opted in. Requires higher personalization, shorter sequences, and careful spam avoidance.

### Commands

| Command | Purpose |
|---------|---------|
| `/outbound-sequence [name] "[angle]"` | Create reusable outbound sequence template |
| `/outbound-personalize [sequence] [prospect-url]` | Personalize sequence for specific prospect |
| `/outbound-experiment [sequence] "[variant-angle]"` | Create A/B test variant |

### Workflow: Creating a Sequence

**Input:**
- Target persona
- Campaign angle (pain point, trigger event, value prop)
- Number of steps (typically 3-5)

**Process:**
1. Load persona and messaging contexts
2. Generate sequence structure (timing, escalation)
3. Write each step with clear CTA
4. Validate against spam/deliverability rules

**Output:** `outbound-emails/sequences/[name]/`

```yaml
# sequence-meta.yaml
name: "ai-presentation-pain"
persona: "solo-consultant"
angle: "Time spent on presentations vs. billable work"
steps: 4
timing: [0, 2, 5, 10]  # days between emails
created: 2026-02-04
mission_control:
  task_id: null
```

```yaml
# 01-initial.yaml
subject: "Quick question about your presentation workflow"
body: |
  Hi {{first_name}},
  
  [Personalization hook based on research]
  
  I noticed consultants spend 15-20 hours per pitch deck...
  [Value prop]
  
  Worth a quick chat?
  
  Mike
personalization_slots:
  - research_hook  # Filled by prospect-research tool
  - company_reference
```

### Workflow: Personalizing for a Prospect

**Input:**
- Sequence to use
- Prospect LinkedIn URL (or enriched profile)

**Process:**
1. Run `prospect-research` tool
2. Identify personalization hooks (recent posts, company news, role changes)
3. Fill personalization slots in sequence
4. Score personalization quality
5. Human review before sending

**Output:** `outbound-emails/personalized/[prospect-slug].yaml`

### Quality Gates for Outbound

| Check | Threshold | Why |
|-------|-----------|-----|
| Spam word score | < 3 flags | Deliverability |
| Subject line length | < 50 chars | Mobile + open rates |
| Personalization score | ≥ 70% | Not-a-template feel |
| CTA clarity | Single, clear | Response rate |
| Sequence length | ≤ 5 steps | Respect + reputation |

### Integration with Sequencers

Export sequences to tools like Instantly, Apollo, or Smartlead:

```typescript
// POST /api/content/outbound/export
{
  "sequence": "ai-presentation-pain",
  "prospects": ["prospect-1.yaml", "prospect-2.yaml"],
  "target": "instantly",
  "campaign_name": "AI Presentation Pain - Feb 2026"
}
```

---

## Blog Post System Design

> Blog posts are the SEO engine — they attract organic traffic, establish authority, and feed the top of funnel. Unlike emails, they're public and evergreen.

### Workflow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      BLOG POST WORKFLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │  Topic   │───▶│ Strategy │───▶│  Write   │───▶│ Optimize │  │
│  │  Idea    │    │ & Outline│    │ Sections │    │   SEO    │  │
│  └──────────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘  │
│       │               │               │               │        │
│       │         MC Task Created  Progress Logged  Quality Gate │
│       │          (backlog)       (in_progress)    (in_review)  │
│       │               │               │               │        │
│       ▼               ▼               ▼               ▼        │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ Contexts │    │ Research │    │ Validate │    │  Human   │  │
│  │  Loaded  │    │ + Outline│    │  Draft   │    │  Review  │  │
│  └──────────┘    └──────────┘    └──────────┘    └────┬─────┘  │
│                                                       │        │
│                                                       ▼        │
│                                                 ┌──────────┐   │
│                                                 │ Publish  │   │
│                                                 │  to CMS  │   │
│                                                 └──────────┘   │
│                                                  (done)        │
└─────────────────────────────────────────────────────────────────┘
```

### Commands

| Command | Purpose |
|---------|---------|
| `/blog-strategy [slug] "[topic]"` | Create blog post strategy + outline |
| `/blog-write [slug]` | Write blog post from strategy |
| `/blog-write [slug] --section [n]` | Write specific section only |
| `/blog-optimize [slug]` | SEO optimization pass |
| `/blog-validate [slug]` | Run quality gates |
| `/blog-publish [slug]` | Push to CMS |

### Strategy Stage

**Input:**
- Topic/title
- Target audience (persona)
- Key points to cover
- SEO keywords (optional — will research if not provided)

**Contexts Loaded:**
- `personas/{target_persona}.md`
- `company/products.md`
- `messaging/pain-points.md`
- `voice/brand-voice.md`
- `guidelines/blog-guidelines.md`

**Process:**
1. Research topic (web search for top-ranking content)
2. Analyze competitors — what's missing? What angle is fresh?
3. Develop unique thesis/angle
4. Generate detailed outline with H2s and key points
5. Identify internal linking opportunities
6. Create Mission Control task

**Output:** `blog-posts/strategies/[slug]-strategy.yaml`

```yaml
title: "How to Structure a Presentation That Sells"
slug: how-to-structure-presentation-sells
target_audience: "Consultants preparing client pitches"
seo_keywords:
  - presentation structure
  - sales presentation
  - pitch deck outline
thesis: "The best presentations follow a problem-solution-proof structure"
outline:
  - h2: "Why Most Presentations Fail"
    points:
      - "Data dump syndrome"
      - "No clear narrative"
  - h2: "The Problem-Solution-Proof Framework"
    points:
      - "Start with the pain"
      - "Present your solution"
      - "Prove it works"
  # ...
word_count_target: 1500
quality_gate:
  min_h2s: 3
  thesis_present: true
mission_control:
  task_id: null
```

### Execution Stage

**Input:**
- Strategy YAML

**Process:**
1. Load strategy
2. Write section by section
3. Add internal links
4. Optimize meta description
5. Self-review checklist

**Output:** `[slug].md`

```markdown
---
title: "How to Structure a Presentation That Sells"
slug: how-to-structure-presentation-sells
meta_description: "Learn the problem-solution-proof framework..."
date: 2026-02-04
author: Mike Smith
seo_keywords: [...]
---

# How to Structure a Presentation That Sells

Opening hook...

## Why Most Presentations Fail

...
```

### Quality Gates

| Check | Threshold | Tool | Blocking? |
|-------|-----------|------|-----------|
| Readability | ≤ Grade 8 | `textstat` | Yes |
| Word count | ≥ 1000 | word count | Yes |
| H2 count | ≥ 3 | markdown parse | Yes |
| Meta description | 120-160 chars | length check | Yes |
| Internal links | ≥ 2 | link parser | Warning |
| External links | ≥ 1 (authority source) | link parser | Warning |
| Image alt text | All images have alt | markdown parse | Warning |
| Keyword density | 1-2% for primary | keyword counter | Warning |
| No orphan post | Linked from ≥1 other post | link graph | Warning |

### Integration Points

1. **On `/blog-strategy` start:**
   - Create Mission Control task
   - Set status to `backlog`
   - Log activity: "Blog strategy created: [title]"

2. **On strategy approval (Mike reviews outline):**
   - Update task status to `in_progress`
   - Log activity with outline summary

3. **On `/blog-write` completion:**
   - Log activity with word count, section count
   - Keep status `in_progress`

4. **On `/blog-validate` pass:**
   - Update task status to `in_review`
   - Log activity with quality scores
   - Notify Mike for review

5. **On `/blog-publish`:**
   - Push to CMS
   - Mark task `done`
   - Log activity with published URL

### CMS Integration

**Option A: SlideHeroes Blog (Next.js/MDX)**
```typescript
// POST /api/content/blog/publish
{
  "slug": "how-to-structure-presentation-sells",
  "source": "blog-posts/posts/how-to-structure-presentation-sells.md",
  "publishDate": "2026-02-10T09:00:00Z",
  "author": "mike",
  "category": "presentations"
}

// Copies MDX to content directory, triggers rebuild
```

**Option B: External CMS (Ghost, WordPress)**
```typescript
// POST /api/content/blog/publish
{
  "slug": "how-to-structure-presentation-sells",
  "source": "blog-posts/posts/how-to-structure-presentation-sells.md",
  "target": "ghost",  // or "wordpress"
  "publishDate": "2026-02-10T09:00:00Z",
  "status": "draft"  // or "published"
}

// Uses Ghost/WP API to create post
```

**Decision Needed:** Where does the SlideHeroes blog live? (Affects integration approach)

### Skill Structure

```
skills/blog-writing/
├── SKILL.md                    # Main skill documentation
├── commands/
│   ├── blog-strategy.md        # Strategy/outline workflow
│   ├── blog-write.md           # Writing workflow
│   ├── blog-optimize.md        # SEO optimization
│   ├── blog-validate.md        # Quality gate checks
│   └── blog-publish.md         # CMS publishing
├── core/
│   ├── outline-template.yaml   # Standard outline structure
│   ├── seo-checklist.yaml      # SEO requirements
│   ├── internal-links.yaml     # Map of existing posts for linking
│   └── slideheroes-style.md    # Writing style guide (or load from contexts)
├── scripts/
│   ├── validate_post.py        # Run all quality gates
│   ├── seo_score.py            # Calculate SEO score
│   ├── readability.py          # Flesch-Kincaid scoring
│   ├── keyword_density.py      # Check keyword usage
│   └── link_checker.py         # Validate internal/external links
└── templates/
    ├── how-to.md               # Template for how-to posts
    ├── listicle.md             # Template for list posts
    ├── case-study.md           # Template for case studies
    └── thought-leadership.md   # Template for POV/opinion pieces
```

### Skill Modifications

Add to `blog-strategy.md`:

```markdown
## Mission Control Integration

After creating strategy, automatically:
1. POST to /api/v1/tasks to create tracking task
2. Include strategy path and outline in description
3. Set boardId to 3 (Newsletter & Content)
4. Set priority based on SEO opportunity score

Store task ID in strategy YAML:
```yaml
mission_control:
  task_id: 45
  created_at: 2026-02-04T12:00:00Z
  status: backlog
```

## Context Loading

Before generating strategy, load:
- personas/{target_persona}.md
- company/products.md  
- messaging/pain-points.md
- voice/brand-voice.md
- guidelines/blog-guidelines.md

Pass as system context to ensure on-brand output.
```

### Post Templates

Different post types have different structures:

**How-To Post:**
```markdown
# How to [Achieve X]
Opening hook (problem/promise)

## Why [X] Matters (or Why Most People Fail)
## Step 1: [Action]
## Step 2: [Action]
## Step 3: [Action]
## Common Mistakes to Avoid
## Conclusion + CTA
```

**Listicle:**
```markdown
# [N] [Things] to [Achieve X]
Opening hook + promise

## 1. [Item]
## 2. [Item]
...
## Conclusion + CTA
```

**Thought Leadership:**
```markdown
# [Contrarian Take / Bold Claim]
Opening hook (challenge conventional wisdom)

## The Conventional Wisdom
## Why It's Wrong
## A Better Way
## What This Means for You
## Conclusion + CTA
```

---

## Implementation Plan

### Phase 0: Context Foundation (Week 1) ⭐ NEW
- [ ] Create `.ai/contexts/` directory structure
- [ ] Extract raw material from existing sources:
  - [ ] Export Mike's best emails (Gmail export tool)
  - [ ] Pull SlideHeroes website copy
  - [ ] Gather LinkedIn posts
  - [ ] Collect course content excerpts
- [ ] Build initial context files:
  - [ ] `company/about.md` and `company/products.md`
  - [ ] `personas/solo-consultant.md` (primary persona first)
  - [ ] `voice/mike-style.md` and `voice/brand-voice.md`
  - [ ] `messaging/positioning.md` and `messaging/pain-points.md`
  - [ ] `guidelines/email-guidelines.md` (from email-marketing skill)
- [ ] Mike review pass — refine voice, add examples
- [ ] Test context loading in a simple generation task

### Phase 1: Email Integration (Week 2)
- [ ] Update email-campaign command to load contexts
- [ ] Add Mission Control task creation
- [ ] Add task update on strategy approval
- [ ] Add progress logging for each email
- [ ] Test end-to-end with sample campaign using new contexts

### Phase 2: Blog System Foundation (Week 3)
- [ ] Add blog-specific contexts (`guidelines/blog-guidelines.md`)
- [ ] Create blog-writing skill structure
- [ ] Implement `/blog-strategy` command (loads contexts)
- [ ] Create outline template
- [ ] Add Mission Control integration

### Phase 3: Blog Execution (Week 4)
- [ ] Implement `/blog-write` command
- [ ] Create validation scripts
- [ ] Add SEO optimization pass
- [ ] Test with real blog post

### Phase 4: Unified Dashboard (Week 5)
- [ ] Add "Content" view to Mission Control UI
- [ ] Show content-specific metrics
- [ ] Calendar view for publishing schedule

### Ongoing: Context Maintenance
- [ ] Set up quarterly context review reminder
- [ ] Add learnings from successful content back to contexts
- [ ] Update after product/positioning changes

---

## API Contracts

### Create Content Campaign

```http
POST /api/content/campaigns
Content-Type: application/json

{
  "type": "email" | "blog" | "youtube",
  "name": "course-launch",
  "title": "DDM Course Launch Campaign",
  "description": "6-email sequence to announce new course",
  "targetDate": "2026-02-15"
}

Response: 201 Created
{
  "id": "abc123",
  "type": "email",
  "name": "course-launch",
  "missionControlTaskId": 42,
  "strategyPath": ".ai/content/emails/strategies/course-launch-strategy.yaml",
  "status": "strategy",
  "createdAt": "2026-02-04T12:00:00Z"
}
```

### Update Campaign Status

```http
PATCH /api/content/campaigns/:id
Content-Type: application/json

{
  "status": "writing",
  "progress": {
    "completed": 3,
    "total": 6
  }
}

Response: 200 OK
```

### List Campaigns

```http
GET /api/content/campaigns?type=email&status=writing

Response: 200 OK
{
  "campaigns": [
    {
      "id": "abc123",
      "type": "email",
      "name": "course-launch",
      "status": "writing",
      "progress": { "completed": 3, "total": 6 }
    }
  ]
}
```

---

## Open Questions

1. **CMS Integration:** Where do blog posts ultimately publish? (Ghost, WordPress, custom?)
2. **Review Workflow:** Should content go through Mike's approval before publishing?
3. **Scheduling:** How to handle publish dates and automated scheduling?
4. **Templates:** Should we have pre-built campaign templates for common scenarios?
5. **Context Source of Truth:** Should contexts live in `.ai/contexts/` in the clawd workspace, or in a dedicated repo that can be versioned/shared?
6. **Context Update Triggers:** What events should prompt a context refresh? (Product launch, positioning shift, successful campaign learnings?)

---

## Design Principles

### From PRM: Qualify Before Publishing
Just as Prospect Relationship Management separates raw leads from sales-ready opportunities, content should be qualified before publishing:

- **Raw content** = drafts, ideas, outlines (like cold prospects)
- **Qualified content** = passes quality gates, reviewed, ready to publish (like MQLs)
- Don't publish half-baked content — run it through validation first

### From Context Engineering: Foundation Powers Everything
Build the context layer once, maintain it well, and every content workflow benefits:

- Same contexts power emails, blogs, social posts, scripts
- Updates propagate to all content types automatically
- New content types just need to specify which contexts to load

### From Agentic Workflows: Start Deterministic, Add Agency Gradually
1. **Phase 1:** Deterministic workflows with AI steps (structured inputs → structured outputs)
2. **Phase 2:** Human-in-the-loop everywhere (review before publish)
3. **Phase 3:** Gradually reduce oversight for proven workflows
4. **Future:** Full agentic content creation with feedback loops

---

## Modular Skills → Agent Tools

### The Evolution Path

```
TODAY                           FUTURE
─────                           ──────
Human orchestrates              Content Agent orchestrates
     │                               │
     ▼                               ▼
┌─────────────┐               ┌─────────────┐
│ /email-     │               │  "Create a  │
│  campaign   │               │  6-email    │
└──────┬──────┘               │  campaign"  │
       │                      └──────┬──────┘
       ▼                             │
┌─────────────┐                      ▼
│ /email-     │    ───────►   ┌─────────────┐
│  write x6   │               │Content Agent│
└──────┬──────┘               │ calls tools │
       │                      └──────┬──────┘
       ▼                             │
┌─────────────┐         ┌────────────┼────────────┐
│  Review &   │         ▼            ▼            ▼
│  Send       │    [research]  [strategy]  [write-email]
└─────────────┘         │            │            │
                        ▼            ▼            ▼
                   [validate]   [schedule]   [publish]
```

### Designing Skills as Future Tools

Every skill should be built with these properties so it can become an agent tool:

| Property | Why It Matters | Example |
|----------|----------------|---------|
| **Clear Input Schema** | Agent needs to know what to pass | `{persona: string, campaign: string, position: number}` |
| **Clear Output Schema** | Agent needs to parse the result | `{email: EmailYAML, validation: ValidationResult}` |
| **Single Responsibility** | Agent can compose small tools | `research-prospect` ≠ `write-email` ≠ `validate-email` |
| **Context-Aware** | Tool loads its own contexts | Skill knows to load `personas/`, `voice/`, etc. |
| **Idempotent** | Safe to retry on failure | Running twice doesn't create duplicates |
| **Stateless** | No hidden dependencies | All state passed in or saved to files |

### Content Skills Inventory

Skills we'll build (each becomes a tool):

```yaml
# Research & Strategy Tools
research-topic:
  input: { topic: string, depth: "shallow" | "deep" }
  output: { findings: [], sources: [], angles: [] }
  contexts: [company/products, personas/*, messaging/pain-points]

campaign-strategy:
  input: { type: "email" | "blog" | "social", goal: string, persona: string }
  output: { strategy: StrategyYAML, hooks: [], sequence: [] }
  contexts: [personas/*, messaging/*, voice/*, campaigns/active/*]

# Marketing Email Tools (newsletters, nurture)
marketing-email-write:
  input: { strategy: path, position: number, context_overrides?: {} }
  output: { email: EmailYAML, hook_score: number }
  contexts: [loaded from strategy] + guidelines/email-guidelines

marketing-email-validate:
  input: { email: path }
  output: { valid: boolean, issues: [], score: number }
  contexts: [guidelines/email-guidelines]

# Outbound Email Tools (prospecting, sales)
prospect-research:
  input: { linkedin_url: string, company_url?: string, depth: "quick" | "deep" }
  output: { profile: ProspectProfile, angles: [], personalization_hooks: [] }
  contexts: [personas/*, messaging/pain-points, company/products]

outbound-sequence-create:
  input: { persona: string, angle: string, steps: number }
  output: { sequence: SequenceYAML, variants: [] }
  contexts: [personas/*, messaging/*, voice/*, guidelines/outbound-guidelines]

outbound-email-personalize:
  input: { sequence: path, step: number, prospect: ProspectProfile }
  output: { email: PersonalizedEmail, personalization_score: number }
  contexts: [loaded from sequence] + prospect research

outbound-email-validate:
  input: { email: path }
  output: { valid: boolean, spam_score: number, issues: [] }
  contexts: [guidelines/outbound-guidelines]

# Blog Tools
blog-outline:
  input: { topic: string, keywords?: [], persona: string }
  output: { outline: OutlineYAML, seo_recommendations: [] }
  contexts: [personas/*, messaging/*, guidelines/blog-guidelines]

blog-write-section:
  input: { outline: path, section: number }
  output: { content: markdown, word_count: number }
  contexts: [voice/*, loaded from outline]

blog-validate:
  input: { post: path }
  output: { valid: boolean, readability: number, seo_score: number, issues: [] }
  contexts: [guidelines/blog-guidelines]

# Publishing Tools
schedule-content:
  input: { content: path, publish_date: date, channel: string }
  output: { scheduled: boolean, calendar_entry: {} }
  contexts: []

publish-content:
  input: { content: path, channel: "email" | "blog" | "social" }
  output: { published: boolean, url?: string }
  contexts: []
```

### The Content Agent (Future State)

Once skills are proven and stable, we can create a **Content Agent** that:

1. **Receives high-level goals:** "Create a 4-email sequence for the course launch targeting solo consultants"

2. **Plans the work:**
   ```
   1. Load campaign context (campaigns/active/course-launch.md)
   2. Call campaign-strategy tool
   3. For each email in sequence:
      - Call email-write tool
      - Call email-validate tool
      - If validation fails, revise
   4. Present to human for review
   5. On approval, call schedule-content tool
   ```

3. **Executes with tools:** Calls each skill/tool as needed

4. **Handles failures:** Retries, asks for help, or flags for human review

5. **Learns:** Proposes context updates based on what worked (like Joe's persona addition example)

### When to Graduate: Skill → Tool

A skill becomes an agent tool when:

- [ ] Used successfully 5+ times manually
- [ ] Input/output schemas are stable
- [ ] Edge cases are handled
- [ ] Validation catches failures
- [ ] Human review shows consistent quality

Until then, keep it as a human-invoked skill with human-in-the-loop.

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Content tasks tracked in MC | 100% |
| Average hook score | ≥42/50 |
| Blog posts passing validation | ≥90% |
| Time from strategy to publish | <7 days for emails, <14 days for blogs |

---

## Appendix: Existing Email Skill Structure

Reference: `/home/ubuntu/.clawdbot/skills/email-marketing/`

```
email-marketing/
├── SKILL.md              # Main skill documentation
├── commands/
│   ├── email-campaign.md # Campaign strategy workflow
│   └── email-write.md    # Individual email workflow
├── core/
│   ├── techniques.yaml   # 24 copywriting techniques
│   ├── hooks-library.yaml # 45 hook templates
│   ├── best-examples.yaml # 12 gold standard emails
│   └── principles.md     # Andre's philosophy
├── context/
│   ├── slideheroes-product.yaml
│   ├── presentation-povs.yaml
│   └── ai-presentation-povs.yaml
├── corpus/
│   ├── by-type/          # 118 emails by category
│   └── campaigns/        # Campaign sequences
├── scripts/
│   ├── validate_email.py
│   ├── score_hook.py
│   └── organize_corpus.py
└── tools/
    └── gmail-export/     # TypeScript CLI
```
