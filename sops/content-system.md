# SOP: Content System

## Overview

This SOP defines how we create, track, and publish content at SlideHeroes. It covers all content types, the pipeline lifecycle, where files live, and how Mike and Sophie collaborate on content.

## Content Types

| Type | Code | Description | Examples |
|------|------|-------------|----------|
| Blog Post | `blog_post` | Long-form articles for slideheroes.com/blog | SEO articles, how-tos, thought leadership |
| Email | `email` | Email campaigns and sequences | Re-engagement, onboarding, newsletters |
| LinkedIn | `linkedin` | LinkedIn posts (Mike's profile) | Insights, announcements, engagement |
| X Post | `x_post` | X/Twitter posts | Short-form, threads |
| Other | `other` | Long-form content that doesn't fit above | Manifesto, whitepapers, guides |

## Pipeline Phases

Each content type follows a phase workflow. Phases are tracked via `contentPhase` on MC tasks and visualized in the Content Kanban (`/content`).

### Blog Post Phases
1. **Ideation** — Topic identified, added to backlog
2. **Alignment** — Mike + Sophie agree on angle, audience, goals
3. **Research** — Competitor analysis, source gathering, data collection
4. **Brief** — Content brief written (target keywords, outline, CTA)
5. **Outline** — Detailed structure with section headers and key points
6. **Draft** — Full draft written
7. **QA** — Sophie reviews for quality, SEO, consistency
8. **Review** — Mike reviews and approves (or requests changes)
9. **Published** — Live on the site

### Email Phases
1. **Ideation** → 2. **Draft** → 3. **Review** → 4. **Sent**

### LinkedIn / X Post Phases
1. **Ideation** → 2. **Draft** → 3. **Review** → 4. **Published**

### Other (Manifesto, Whitepapers)
Uses the blog post phases (longest pipeline) since these are substantial pieces.

## Where Content Lives

| Location | What Goes There |
|----------|----------------|
| `content/email-campaigns/` | Email campaign drafts and final versions |
| `content/manifesto/` | Long-form thought leadership pieces |
| `content/` (future subdirs) | Blog drafts, social drafts as needed |
| `.ai/contexts/content/` | Content strategy context files (pillars, clusters, calendar) — used by writing skills |
| `.ai/content/blog/` | Blog topic backlog and ideation notes |
| `deliverables/content/blog/` | Finished blog posts ready for publishing |

**Note:** The `/content/` directory is NOT scanned by MC Docs. Content is tracked via MC tasks in the Content Kanban, not the Docs system.

## How Content Enters the Pipeline

1. **Mike shares an idea** — via Discord, conversation, or #capture channel
2. **Sophie identifies a content opportunity** — from research, competitor analysis, or content calendar
3. **Create an MC task** with:
   - Clear title describing the content piece
   - `contentType` set (blog_post, email, linkedin, x_post, other)
   - `contentPhase` set to `ideation`
   - `board_id: 6` (Create Content board)
   - Assignee: `sophie` (Sophie drives), `mike` (Mike drives), or `both`
4. Task appears in Content Kanban automatically

## Phase Transitions

| Transition | Who | What Happens |
|-----------|-----|--------------|
| Ideation → Alignment | Sophie proposes, Mike approves | Agree on angle, audience, goals |
| Alignment → Research | Sophie | Gather sources, analyze competitors |
| Research → Brief | Sophie | Write content brief with keywords, outline, CTA |
| Brief → Outline | Sophie | Detailed section structure |
| Outline → Draft | Sophie | Full draft written (blog-writing skill for blogs) |
| Draft → QA | Sophie | Self-review for quality, SEO, brand voice |
| QA → Review | Sophie → Mike | Mike reviews the piece |
| Review → Published | Mike approves | Publish to site/send/post |
| Review → Draft | Mike requests changes | Revise and re-enter QA |

**For shorter content types (email, social):** Skip intermediate phases — go from Ideation → Draft → Review → Published.

## Blog Writing Sub-Process

Blog posts follow the detailed workflow in **SOP: Blog Writing Process** (`sops/blog-writing-process.md`). That SOP covers the two-stage strategy → writing workflow, SlideHeroes voice guidelines, and competitor research.

## Content ↔ MC Task Lifecycle

- **One MC task per content piece** — the task tracks the piece through all phases
- **Phase updates** — drag the card in the Content Kanban or update via API
- **Completion** — when content is published/sent, mark the MC task as `done`
- **Blocked** — if waiting on Mike's input, set `blockedReason` on the task
- **Sub-tasks** — only for multi-part campaigns (e.g., 5-email sequence = 1 parent task + sub-tasks per email in Todoist)

## Content Calendar

Content strategy context (pillars, topic clusters, calendar framework) lives in `.ai/contexts/content/`. These files are loaded by the blog-writing skill to maintain consistency.

The content calendar is **not yet formalized** — currently driven by opportunity and Mike's priorities. A structured editorial calendar is a future initiative.
