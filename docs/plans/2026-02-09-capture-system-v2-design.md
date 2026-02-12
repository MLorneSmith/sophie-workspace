# Capture System v2 — Design Document

**Date:** 2026-02-09
**Status:** Approved
**Author:** Sophie + Mike (brainstorm session)

---

## Overview

Replace the current best-practices-only extraction pipeline with a comprehensive information capture system that handles multiple use cases — from competitive intelligence to content inspiration to technical references.

## Problem

The current system only extracts "best practices" from links shared in Discord #capture. In reality, Mike encounters content worth saving for many different reasons, and the system needs to support all of them.

## Input Channels

### 1. Discord #capture (existing, unchanged)
- Drop a link, optionally with a note explaining why it's worth saving
- Works well for phone browsing (primary use case)

### 2. Email Forwarding (new)
- Forward any email/newsletter to `capture@slideheroes.com` (alias of sophie@slideheroes.com — already configured)
- Anything typed above the forwarded content becomes the "note"
- Links and content extracted from the forwarded email body

### Both channels:
- **Link only** → Sophie analyzes content and categorizes automatically
- **Link + note** → Note is the primary signal for categorization and tagging

### Future inputs (not v1):
- YouTube channel RSS feeds — monitor specific channels for new videos automatically
- Conversation captures ("Sophie, save that")
- SMS/iMessage forwarding
- Browser extension

## Taxonomy

Every captured item is classified along two dimensions:

### Type (what kind of content)
- Article / Blog post
- Newsletter / Email
- Video
- Social post / Thread
- Tool / Product
- Book / Report

### Intent (why it was saved)
| Intent | Description |
|--------|-------------|
| `best-practice` | Actionable technique to apply to SlideHeroes |
| `competitive-intel` | What competitors/others in our space are doing |
| `inspiration-design` | UI, visual, or UX patterns to reference |
| `inspiration-email` | Email hooks, sequences, copy worth studying |
| `inspiration-content` | Blog angles, social formats, storytelling approaches |
| `market-insight` | Trends, data points, customer behavior observations |
| `case-study` | Stories, examples, before/after narratives, proof points |
| `quote-stat` | Specific data points or quotable lines to reference |
| `technical-ref` | Libraries, tools, architecture patterns to consider |
| `automate-with-sophie` | Processes or workflows to build into our AI systems |
| `voice-context` | Tone, messaging, or positioning to inform brand voice |
| `general-learning` | Doesn't fit neatly but worth keeping |

**Rules:**
- Items can have **multiple intents**
- If Mike provides a note, map it to the closest intent(s)
- If no note, read the content and pick the best-fit intent(s)
- Auto-generate topic tags (e.g. "pricing", "onboarding", "presentations")

## Processing Pipeline

### Step 1 — Ingest
- Fetch full content (article text, YouTube transcript, email body)
- Record source metadata: URL, title, author, date, source type

### Step 2 — Classify
- Assign Type + Intent(s) using Mike's note as primary signal (if provided)
- Auto-tag with relevant topics

### Step 3 — Extract (intent-specific)

| Intent | Extraction Focus |
|--------|-----------------|
| `best-practice` | The practice, why it works, how to apply it to SlideHeroes |
| `competitive-intel` | Company, what they're doing, implications for us |
| `inspiration-*` | The specific element worth studying, why it's good, link to exact example |
| `market-insight` | The data point or trend, source credibility, relevance to us |
| `case-study` | The story arc, key numbers, what made it work |
| `quote-stat` | The exact quote/stat, attribution, where we'd use it |
| `technical-ref` | What it does, how it's relevant, complexity to adopt |
| `automate-with-sophie` | The process, how to automate it, effort estimate |
| `voice-context` | The tone/positioning element, how it relates to our voice |
| `general-learning` | Key takeaways, why it's worth keeping |

### Step 4 — Store & Confirm
- Save to Mission Control (structured, searchable)
- Reply in Discord with confirmation summary (see Confirmation Format below)

## Data Model

Every capture record contains:
- **Original URL** — always retained as ground truth
- **Raw content** — full text as fetched (or as much as possible)
- **Mike's note** — verbatim, if provided
- **Type** — content type classification
- **Intent(s)** — one or more intent tags
- **Topic tags** — auto-generated
- **Extracted insights** — structured per intent-specific extraction
- **Source metadata** — title, author, date, source type
- **Capture date**
- **Capture source** — `discord` or `email`
- **Status** — `unprocessed` → `processed` → optionally `applied`

## Storage & UI

### Mission Control: `/captures` (replaces `/practices`)

**Features:**
- Filter by intent, topic, date, status
- Full-text search across content, notes, and extractions
- Each capture expandable to show original content + extraction
- Link back to original URL always visible

### Migration
- Existing resources → capture records with appropriate type
- Existing best practices → extracted insights within parent capture, intent = `best-practice`
- No data lost

## Retrieval

Three modes:

1. **Ask Sophie** — "What did we save about email hooks?" / "Find that competitor pricing thing" — search by intent, tags, content, notes
2. **Browse Mission Control** — Filter and explore in the UI
3. **Proactive surfacing** — Sophie pulls relevant captures when context fits (e.g. writing a blog post → surface related `inspiration-content` and `quote-stat` items)

## Confirmation & Feedback

### Format (posted to Discord for all captures):

```
✅ **Captured:** "Article Title"
**Intent:** `competitive-intel`, `best-practice`
**Tags:** pricing, conversion, SaaS
**Extracted:** 4 practices, 1 competitor insight
🔗 [View in Mission Control](link)
```

### Confidence Flag
- When Sophie is uncertain about the extraction (e.g. long article with a vague note), the confirmation includes a clarification question: "I extracted X — is that what you meant, or was it something else?"
- This prevents silent misses — Mike catches errors immediately rather than discovering them later during retrieval

### Corrections
- Mike replies with correction (e.g. "that's more email inspiration")
- Sophie updates the record and learns the pattern

### Confirmation channel
- All confirmations go to Discord, regardless of capture source (Discord or email)

## Implementation Notes

- Email monitoring via `gog` (Gmail API) — check `capture@slideheroes.com` alias periodically
- Processing pipeline reuses existing content fetching (web_fetch, YouTube transcript scripts)
- Mission Control API needs new endpoints for captures CRUD
- UI needs new `/captures` page replacing `/practices`
- Migrate existing practices data as part of deployment
