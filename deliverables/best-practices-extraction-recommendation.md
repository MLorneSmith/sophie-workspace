# Best Practices Extraction System: Recommendation

*Prepared by Sophie | February 2026*

---

## Executive Summary

I recommend a **three-stage pipeline**: Capture → Extract → Surface. The system should meet you where you already consume content (browser, YouTube) and automatically extract actionable insights into a searchable database in Notion, with Sophie having read access to apply practices to our work.

---

## 1. The Problem We're Solving

You consume valuable content (articles, videos, podcasts) but insights slip away:
- You read something useful, forget the details
- You can't find that "one article" about pricing strategy
- I (Sophie) don't know what you've learned, so I can't apply it to our work
- Best practices stay trapped in your head instead of becoming reusable tools

**Goal:** Turn passive consumption into an active, searchable, applicable knowledge asset.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAPTURE LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Readwise    │  │  YouTube     │  │   Manual     │          │
│  │  Reader      │  │  "Save"      │  │   Input      │          │
│  │  (articles)  │  │  (videos)    │  │   (Discord)  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └────────────────┬┴─────────────────┘                   │
│                          ▼                                      │
├─────────────────────────────────────────────────────────────────┤
│                    EXTRACT LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│                  ┌─────────────────┐                            │
│                  │  LLM Processor  │                            │
│                  │  (GPT-4o-mini)  │                            │
│                  └────────┬────────┘                            │
│                           │                                     │
│         ┌─────────────────┼─────────────────┐                   │
│         ▼                 ▼                 ▼                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Summary    │  │   Best      │  │  Metadata   │             │
│  │             │  │  Practices  │  │  + Tags     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                           │                                     │
│                           ▼                                     │
├─────────────────────────────────────────────────────────────────┤
│                    STORE LAYER                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 NOTION DATABASE                          │   │
│  │   "Best Practices"                                       │   │
│  │   ├── Practice (title)                                   │   │
│  │   ├── Domain (Sales, Product, Marketing, Ops, Tech)      │   │
│  │   ├── Source (relation → Resources)                      │   │
│  │   ├── Context (when to apply)                            │   │
│  │   ├── Implementation Notes                               │   │
│  │   └── Date Captured                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
├─────────────────────────────────────────────────────────────────┤
│                    SURFACE LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Notion    │  │   Sophie    │  │  Weekly     │             │
│  │   Search    │  │   Memory    │  │  Review     │             │
│  │   (manual)  │  │   (auto)    │  │  (digest)   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Capture Methods

### Option A: Readwise Reader (Recommended for Articles)
**Best for:** Articles, newsletters, PDFs, Twitter threads

**How it works:**
1. Install Readwise browser extension
2. Save articles you want to process
3. Highlight key passages as you read
4. Readwise syncs highlights automatically

**Why Readwise:**
- Already optimized for this use case
- Has built-in AI features (Ghostreader)
- Exports to Notion natively
- ~$8/month (Reader included)

### Option B: YouTube Save Flow
**Best for:** Educational videos, tutorials, talks

**How it works:**
1. You share a YouTube URL with me (Discord: "extract: [url]")
2. I fetch the transcript via API
3. Process through LLM extraction
4. Add to Notion Best Practices database

**Implementation:**
```bash
# Already available tooling
youtube-transcript-api (Python)
# or
supadata.ai API (REST)
```

### Option C: Manual Input (Discord)
**Best for:** Quick captures, podcast insights, in-person learnings

**Trigger phrases:**
- "Best practice: [insight]" → I capture immediately
- "Extract from: [URL]" → I fetch and process
- "Lesson learned: [insight]" → Captures to Best Practices

---

## 4. Extraction Pipeline

### The LLM Prompt (Core Engine)

```markdown
You are extracting actionable best practices from content.

For each piece of content, identify:
1. **Best Practices** (3-7 per article/video)
   - Specific, actionable recommendations
   - Not generic advice ("work hard") but tactical ("send follow-up emails within 24 hours")
   
2. **For each practice, provide:**
   - Practice statement (1-2 sentences, actionable)
   - Domain: [Sales | Product | Marketing | Operations | Leadership | Technical | Personal]
   - Context: When/where this applies
   - Implementation: How to actually do it

3. **Source metadata:**
   - Title
   - Author/Creator
   - URL
   - Type: [Article | Video | Podcast | Book | Course]
   - Date consumed

Format as JSON for database import.
```

### Example Output

**Input:** Article about SaaS pricing strategies

**Output:**
```json
{
  "source": {
    "title": "The Ultimate Guide to SaaS Pricing",
    "author": "Patrick Campbell",
    "url": "https://...",
    "type": "Article",
    "consumed": "2026-02-02"
  },
  "practices": [
    {
      "practice": "Price on value metrics, not seats - charge based on what delivers value to the customer (API calls, projects, storage) rather than arbitrary user counts",
      "domain": "Product",
      "context": "When designing pricing tiers for a SaaS product",
      "implementation": "Identify the 1-2 metrics that correlate with value delivered. For SlideHeroes: presentations created or AI generations used"
    },
    {
      "practice": "Include a free tier that demonstrates value but creates natural upgrade pressure",
      "domain": "Product",
      "context": "Freemium SaaS products targeting individual users",
      "implementation": "Free tier: 3 presentations/month. Paid: unlimited. The limit should be low enough to hit within first week of active use"
    }
  ]
}
```

---

## 5. Storage: Notion Database

### Best Practices Database Schema

| Property | Type | Purpose |
|----------|------|---------|
| Practice | Title | The actionable insight |
| Domain | Select | Category for filtering |
| Source | Relation | Links to Resources DB |
| Context | Text | When to apply |
| Implementation | Text | How to apply |
| Applied | Checkbox | Have we used this? |
| Applied Notes | Text | How we applied it, results |
| Tags | Multi-select | Additional categorization |
| Date Captured | Date | When extracted |
| Rating | Select | ⭐-⭐⭐⭐⭐⭐ usefulness |

### Domain Categories

- **Sales** — Pricing, negotiation, outreach, closing
- **Product** — Features, UX, roadmap, prioritization
- **Marketing** — Positioning, content, channels, messaging
- **Operations** — Processes, efficiency, tools, automation
- **Leadership** — Management, hiring, culture, decision-making
- **Technical** — Architecture, coding, DevOps, AI/ML
- **Personal** — Productivity, health, learning, relationships

---

## 6. Surfacing Best Practices

### Method 1: Manual Search (Notion)
You search Notion when you need inspiration:
- "Show me all Product practices"
- "What do I know about pricing?"
- Filter by domain + search keywords

### Method 2: Sophie Memory Integration
I periodically sync relevant practices to my memory:

**Process:**
1. Weekly: Query Notion Best Practices (via API)
2. Extract practices relevant to active projects
3. Store summary in `memory/best-practices-cache.md`
4. When working on tasks, I reference this cache

**Example:**
When working on SlideHeroes pricing, I'd check:
- Domain: Product + Sales
- Tags: pricing, SaaS, freemium
- Apply relevant practices to my recommendations

### Method 3: Weekly Digest
Part of your Weekly Review in Notion:
- "New practices captured this week"
- "Practices to apply to current projects"
- "Practices you've applied (track results)"

---

## 7. Implementation Plan

### Phase 1: Foundation (Week 1)
1. **Create Notion databases:**
   - Best Practices (schema above)
   - Resources (if not exists)
2. **Set up Readwise:**
   - Create account ($8/mo)
   - Install browser extension
   - Configure Notion export
3. **Test manual flow:**
   - Read one article
   - Highlight key points
   - Manually create Best Practice entries

### Phase 2: Automation (Week 2)
1. **Build YouTube extraction:**
   - Add to slideheroes-internal-tools
   - API endpoint: POST /api/extract-practices
   - Input: URL → Output: Practices JSON
2. **Sophie integration:**
   - Notion API read access
   - Discord trigger phrases
   - Practice cache in memory/

### Phase 3: Workflow Integration (Week 3+)
1. **Establish habits:**
   - Save articles to Readwise (browser)
   - Share YouTube URLs with Sophie (Discord)
   - Weekly review of new practices
2. **Track application:**
   - Check "Applied" when you use a practice
   - Note results in "Applied Notes"
   - Review what's working quarterly

---

## 8. Alternative Approaches Considered

### Option: Build Custom from Scratch
**Pros:** Full control, no subscription costs
**Cons:** Significant development time, reinventing wheel
**Verdict:** Not recommended — Readwise already solves article capture well

### Option: Use Obsidian Instead of Notion
**Pros:** Local-first, markdown, free
**Cons:** Less accessible from mobile, no native Sophie integration
**Verdict:** Stick with Notion for second brain (already decided)

### Option: Full Automation (No Manual Review)
**Pros:** Zero effort capture
**Cons:** Garbage in, garbage out — low-quality practices flood the system
**Verdict:** Some manual curation is valuable; hybrid approach is best

---

## 9. Cost Estimate

| Item | Cost | Notes |
|------|------|-------|
| Readwise Reader | $8/mo | Article capture + highlights |
| Notion | $0-10/mo | Free tier may suffice |
| YouTube API | $0 | Free transcript APIs available |
| LLM Processing | ~$1-2/mo | GPT-4o-mini for extraction |
| **Total** | **~$10-20/mo** | |

---

## 10. Success Metrics

After 3 months, we should see:
- [ ] 50+ best practices captured
- [ ] 10+ practices actively applied to projects
- [ ] Searchable by domain and context
- [ ] Sophie referencing practices in recommendations
- [ ] Weekly review habit established

---

## Questions for You

1. **Do you already use Readwise?** (If yes, we can skip setup)
2. **What domains matter most?** (We can prioritize extraction prompts)
3. **How much manual curation do you want?** (Auto-add all vs. review queue)
4. **Should I have write access to Notion?** (To add practices automatically)

---

*This system feeds into the Notion structure (Task #15) and MC Docs (Task #13). The Best Practices database lives in Notion; Sophie accesses it via API.*
