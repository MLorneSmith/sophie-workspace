# Information Capture System: Design Document

**Prepared by Sophie | February 2026**
**Status:** ✅ Design Approved — Ready for Implementation

---

## Decisions (Confirmed 2026-02-05)

| Question | Decision |
|----------|----------|
| **Routing logic** | #capture = "extract value", Notion = "store as-is", Daily Brief 👍 = auto-capture |
| **Thumbs-up volume** | Process all async (no queue/limit) |
| **Quality threshold** | Note "nothing actionable" when content is thin (don't skip silently) |
| **Readwise integration** | Keep separate from Best Practices — different purpose, different signal |
| **Context activation** | Use practices silently in content creation |
| **Source attribution** | **Always** track source on extracted best practices |
| **Reader → Capture** | Share link to #capture for articles worth extracting |

---

## 1. Routing Logic (Confirmed)

### Send to #capture when:
- **Quick mobile capture** — you're on your phone, found something valuable, want to dump it fast
- **Links that need extraction** — articles, YouTube videos, Reddit threads where I should pull out best practices
- **"Process this for me"** — you want Sophie to do the work of extracting value
- **Readwise Reader content worth extracting** — share link to #capture

### Send to Notion directly when:
- **Already-structured content** — your own notes, meeting notes, documents you've written
- **Reference material** — things to store, not process (PDFs, contracts, resources)
- **Working documents** — drafts, plans, things you're actively editing

### Daily Brief thumbs-up:
- **👍 = Auto-capture** — triggers extraction pipeline (async, doesn't interrupt morning)
- **👎 = Not relevant** — trains feed scoring, no extraction

### Key distinction:
> **#capture = "Sophie, extract value from this"**
> **Notion = "Store this as-is"**
> **Daily Brief 👍 = Zero-friction capture**

---

## 2. Processing Objectives

### Primary Objective: Build Actionable Knowledge
Turn passive consumption into reusable assets:

```
Raw Input (article, video, thread)
    ↓
Extraction (Sophie processes)
    ↓
Best Practices (specific, actionable insights)
    ↓
Context Foundation (feeds AI content generation)
    ↓
Better Outputs (emails, blog posts, presentations)
```

### What "good extraction" looks like:
- **Specific** — "Use social proof in email subject lines" not "Marketing tips"
- **Actionable** — Something you can apply
- **Attributed** — Know where it came from (REQUIRED)
- **Tagged** — Findable by topic/category

### When content has nothing actionable:
Note "nothing actionable here" so Mike knows it was reviewed — don't skip silently.

---

## 3. Connection to Content Context System

```
┌─────────────────────────────────────────────────────────┐
│              CONTEXT FOUNDATION                         │
├─────────────────────────────────────────────────────────┤
│  company/        → Products, positioning, voice         │
│  personas/       → Target audiences, pain points        │
│  messaging/      → Key messages, angles, proof points   │
│  best-practices/ → CAPTURED KNOWLEDGE ← Feeds from here │
│  examples/       → Annotated samples, templates         │
└─────────────────────────────────────────────────────────┘
```

**The capture system feeds `best-practices/`** — which then powers:
- Email generation (what hooks work? what frameworks?)
- Blog posts (what topics resonate? what examples to cite?)
- Presentations (what storytelling patterns? what data points?)

When creating content, Sophie uses relevant practices **silently** (no explicit citation in output).

---

## 4. Daily Brief Thumbs Integration

### Thumbs Up = "Capture this"
- Triggers extraction pipeline (same as #capture)
- Article → Best Practices → Notion
- **Process ALL thumbs-ups** — no volume limit
- Async processing (doesn't interrupt morning reading)
- Summary in next day's brief: "Extracted X practices from yesterday's thumbs-ups"

### Thumbs Down = "Not relevant"
- Trains feed scoring
- Reduces similar content in future briefs
- No extraction

---

## 5. Readwise Reader Integration

### Decision: Keep Separate from Best Practices

| Type | Best Practices DB | Reading Highlights (Readwise) |
|------|-------------------|-------------------------------|
| **Source** | Sophie extracts from full content | Mike highlights while reading |
| **Format** | Actionable, distilled | Verbatim quotes + personal notes |
| **Purpose** | Feed content generation | Personal reference, deeper study |
| **Curation** | Sophie filters for quality | Everything Mike highlights |

### Workflow:
- Readwise Reader syncs highlights to its own area in Notion (existing setup)
- For articles worth full extraction: share link to #capture
- Different inputs, complementary purposes

### When to use Reader:
- ✅ Long articles (>5 min) worth focused attention
- ✅ Highlighting specific passages
- ✅ Newsletters you read regularly
- ✅ PDFs, ebooks, documents
- ✅ Content where YOUR annotation adds value

### When to use #capture instead:
- Quick links you want processed without reading yourself
- YouTube videos (Sophie extracts transcript)
- Anything from Daily Brief — just 👍 it

---

## 6. Notion Structure

**Current:**
- Resources DB (source metadata)
- Best Practices DB (extracted insights, linked to source)

**Source attribution is mandatory** — every best practice must link back to its source Resource.

---

## Implementation Roadmap

See Mission Control for task breakdown.

---

*Design approved 2026-02-05. Implementation in progress.*
