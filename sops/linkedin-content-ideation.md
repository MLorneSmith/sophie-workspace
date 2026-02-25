# SOP: LinkedIn Content Ideation System

**Owner:** Sophie + Mike
**Created:** 2026-02-22
**Status:** Active
**Task:** #601

---

## Purpose

Define a repeatable system for generating, evaluating, and selecting LinkedIn post ideas. Modeled on the blog writing SOP Phase 1 but adapted for LinkedIn's format, cadence, and outbound goals.

---

## Process Overview

```
1. Gather Inputs → 2. Batch Generate → 3. Score & Evaluate → 4. Select → 5. Seed Pipeline
```

Run weekly (or bi-weekly). Sophie proposes, Mike approves.

---

## Phase 1: Gather Inputs

Before generating ideas, load context:

**Required context files:**
- `.ai/contexts/content/linkedin-pillars.md` — format pillars, theme pillars, post formulas, cadence
- `.ai/contexts/content/audience-content-map.md` — persona pain points and content angles
- `.ai/contexts/content/content-pillars.md` — blog pillars (for cross-pollination)
- `.ai/contexts/messaging/pain-points.md` — customer problems we solve
- `.ai/contexts/voice/brand-voice.md` — tone and style

**Dynamic inputs (check each batch):**
- Recent #capture extractions (best practices DB) — what insights have we captured recently?
- Recent blog posts — can we repurpose/tease any?
- Industry news — anything timely in consulting/presentations/AI?
- Competitor LinkedIn activity — what are others posting? Where's the gap?
- Mike's recent conversations — any recurring questions or themes?
- LinkedIn analytics (when available) — what's performing? What's not?
- MC Content Pipeline — what's already in the LinkedIn queue? (dedup check)

**Dedup check (critical):**
```bash
# Check existing LinkedIn content in pipeline
curl -s 'http://localhost:3001/api/v1/content-pipeline?contentType=linkedin' | jq '.grouped'
```
Compare candidates against existing pipeline items. No duplicate angles.

---

## Phase 2: Batch Generate

Generate **10-15 candidate ideas** per batch.

### Generation Rules

1. **Start from pillar gaps** — check which format pillars and theme pillars are underrepresented this week/month
2. **Apply the 70-20-10 mix** — ~70% problem awareness, ~20% solution education, ~10% product
3. **Use the 5 post formulas** (Anton Maker) as starting structures:
   - Transformation Post
   - Expensive Mistake Post
   - Diagnosis Post
   - Hidden Cost Post
   - A vs B Post
4. **Mine credibility assets** — at least 2-3 ideas should leverage Mike's unique experience
5. **Cross-pollinate from blog** — can any planned/published blog posts become LinkedIn teasers?
6. **Mine #capture** — can any captured best practices become LinkedIn posts?

### Candidate Format

Each candidate must include:

```markdown
### Candidate [N]: [Working Title]

- **Format Pillar:** Tactical / Transformational / Insightful / Personal
- **Theme Pillar:** Methodology / Presentation Surgery / AI + Methodology / Founder Journey / Consulting Life / Industry Insights
- **Post Formula:** Transformation / Expensive Mistake / Diagnosis / Hidden Cost / A vs B / Freeform
- **Content Mix:** Problem Awareness / Solution Education / Product
- **Target Persona:** Solo Consultant / Boutique Consultancy / Corporate / General
- **Hook (first 2 lines):** [The line that earns the "see more" click]
- **Key Message:** [1-2 sentences — what's the takeaway?]
- **CTA Type:** Engagement (comment prompt) / DM trigger (curiosity gap) / Content offer / None
- **Credibility Lever:** [What makes Mike uniquely credible to say this?]
- **Source/Inspiration:** [Blog post, capture, experience, trend, etc.]
```

---

## Phase 3: Score & Evaluate

Score each candidate on 6 criteria (1-5 scale):

| Criterion | Weight | What It Measures |
|-----------|--------|-----------------|
| **ICP Relevance** | 25% | Does our target audience (consultants, consultancies) care about this? |
| **Signal Potential** | 20% | Will this attract the right people to engage (profile views, comments, DMs)? |
| **Differentiation** | 20% | Is this a take only Mike can credibly make? Does it stand out? |
| **Pillar Balance** | 15% | Does selecting this maintain healthy pillar distribution? |
| **Engagement Potential** | 10% | Is this shareable? Commentable? Will people have opinions? |
| **Timeliness** | 10% | Is this more relevant now than next month? |

### Scoring Formula

```
Score = (ICP × 0.25) + (Signal × 0.20) + (Differentiation × 0.20) + (Pillar × 0.15) + (Engagement × 0.10) + (Timeliness × 0.10)
```

**Minimum threshold:** Score ≥ 3.0 to be considered for selection.

### Automatic Boosts

- +0.5 if leverages Mike's unique Mastercard/consulting experience
- +0.5 if ties to a recently captured best practice
- +0.3 if repurposes existing blog content (efficiency)

### Automatic Penalties

- -1.0 if too similar to a post in the current pipeline (dedup)
- -0.5 if pillar is already overrepresented this week
- -0.5 if topic is generic (any LinkedIn coach could post this)

---

## Phase 4: Select

1. **Rank candidates by score** (highest first)
2. **Check pillar balance** — ensure the top selections cover at least 2-3 different format pillars
3. **Select top 4-5 for the week** (matching target cadence of 3-4 posts/week + 1-2 buffer)
4. **Present to Mike for approval** — share the ranked list with scores and rationale
5. **Mike approves, rejects, or swaps** — his judgment overrides scores

---

## Phase 5: Seed Pipeline

For each approved idea, create a MC task:

```bash
curl -s -X POST 'http://localhost:3001/api/v1/tasks' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "[LinkedIn] Working title of post",
    "board_id": 6,
    "contentType": "linkedin",
    "contentPhase": "ideation",
    "priority": "medium",
    "assignee": "mike",
    "description": "**Format Pillar:** ...\n**Theme Pillar:** ...\n**Post Formula:** ...\n**Hook:** ...\n**Key Message:** ...\n**CTA Type:** ...\n**Credibility Lever:** ...\n**Source:** ...\n\n**Score:** X.X/5.0\n\n---\n\n[Draft notes or outline if available]"
  }'
```

**Board:** 6 (Create Content)
**Phase flow:** Ideation → Draft → Review → Published

---

## Integration Points

### With Outbound SOP
Some LinkedIn posts are strategic outbound plays:
- Posts targeting specific signal-triggered audiences
- Content designed to attract profile views from ICP (which then triggers DM outreach per Anton Maker's framework)
- Reference: `sops/outbound-sales.md` Section 3 (Signal Taxonomy)

### With Best Practices DB
- Mine recently captured practices for post ideas
- After publishing a post based on a practice, mark it as "Applied" in the DB

### With Blog Content
- Every blog post should generate 1-2 LinkedIn derivative posts (teasers, key takeaways, contrarian angles)
- These derivatives enter the LinkedIn pipeline as "ideation" candidates with a +0.3 score boost

---

## Metrics (Track Monthly)

| Metric | What It Tells Us |
|--------|-----------------|
| Ideas generated per batch | System productivity |
| Average score of selected ideas | Quality trend |
| Ideas → Published conversion rate | Pipeline efficiency |
| Pillar distribution (actual vs target) | Content balance |
| Top-performing posts by engagement | What resonates |
| DMs/conversations triggered by posts | Business impact (the metric that matters) |

---

## Sources

- Anton Maker: 4-Pillar System, 5 Post Formulas, 70-20-10 Mix, trigger-based outreach
- Alex Boyd: Content-to-pipeline, curiosity gap principle
- Sam McKenna: C-suite content strategy, thought leadership
- Brendan Short: Signal-based selling philosophy
- Blog Writing SOP: Phase 1 ideation process (adapted)

---

*This SOP is the engine. Run it weekly. Task #600 uses its output.*
