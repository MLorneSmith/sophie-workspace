# Blog Brief Command

Auto-generate a content brief from research output and strategy.

## Usage

```
/blog-brief [slug]
```

Requires:
- Strategy YAML at `.ai/content/blog/strategies/[slug]-strategy.yaml`
- Research summary at `.ai/content/blog/research/[slug]-research.md`

### Arguments: $ARGUMENTS

---

## Instructions

You synthesize research and strategy into a structured content brief — the contract between strategy and execution. If the brief is right, the outline and draft follow naturally.

---

## Step 1: Load Inputs

Read these files:
```
/home/ubuntu/clawd/.ai/content/blog/strategies/[slug]-strategy.yaml
/home/ubuntu/clawd/.ai/content/blog/research/[slug]-research.md
/home/ubuntu/clawd/.ai/contexts/content/audience-content-map.md
/home/ubuntu/clawd/.ai/contexts/content/content-pillars.md
```

Extract from strategy: title, slug, primary keyword, secondary keywords, angle, target persona, task_id.
Extract from research: key findings, data points, unique angle, sources.

---

## Step 2: Generate SEO Metadata

Using the keyword data from the strategy YAML:

- **Meta Title:** Include primary keyword, ≤60 chars, compelling
- **Meta Description:** 150-160 chars, includes keyword, action-oriented
- **URL Slug:** Short, keyword-rich, human-readable
- **Internal Links:** Identify 3-5 existing SlideHeroes pages to link to (check `content-index.json`)
- **Featured Snippet Target:** Yes/No — if yes, what format (paragraph, list, table)?
- **AEO Format:** How should the direct answer appear? (first 100 words / FAQ section / listicle)

---

## Step 3: Assemble Brief

Use this template:

```markdown
# Content Brief: [Working Title]

## At-a-Glance
| Field | Value |
|-------|-------|
| **Working Title (H1)** | [Title — includes target keyword, <60 chars] |
| **Author** | Mike Smith |
| **Target Word Count** | [2000-3000] |
| **Target Persona** | [From audience-content-map.md] |
| **Content Type** | [How-to / Thought leadership / Case study / Listicle] |
| **Task ID** | [MC task number] |

## Strategy & Audience
| Field | Value |
|-------|-------|
| **Audience Pain Points** | [3-5 specific problems this post solves] |
| **Content Goal** | [Educate / Drive leads / Build authority] |
| **Core Message** | [One sentence: key takeaway] |
| **Unique Angle** | [What's new that can't be found in top 10 results] |
| **Competitive Landscape** | [Top 3 competing posts: strengths, weaknesses, gaps] |

## SEO & AEO
| Field | Value |
|-------|-------|
| **Primary Keyword** | [exact match] |
| **Search Volume** | [from strategy YAML] |
| **Secondary Keywords** | [5-10 semantic variations] |
| **URL Slug** | [/keyword-rich-slug] |
| **Meta Title** | [50-60 chars with keyword] |
| **Meta Description** | [150-160 chars, action-oriented] |
| **Internal Links** | [3-5 related SlideHeroes posts] |
| **Featured Snippet Target** | [Yes/No — format] |
| **AEO Format** | [Direct answer / FAQ / Listicle] |

## Content Specs
| Field | Value |
|-------|-------|
| **Research Reference** | [Path to research summary] |
| **Key Data/Stats** | [Specific numbers, studies, quotes from research] |
| **SME Insights** | [Mike's personal experience to weave in — from Phase 2 notes] |
| **Tone/Voice** | [Direct, opinionated, practical — from content-pillars.md] |
| **CTA** | [Primary action + placement] |

## Success Metrics
| Metric | Target |
|--------|--------|
| **Organic Traffic (30d)** | [target visits] |
| **Keyword Ranking** | [target position] |
| **Engagement** | [time on page target] |
| **Conversions** | [signup/demo target] |

## Notes
[Additional context from Phase 2 alignment, Mike's input, edge cases]
```

---

## Step 4: Save Brief

Save to:
```
/home/ubuntu/clawd/.ai/content/blog/briefs/[slug]-brief.md
```

---

## Step 5: Update Mission Control

```bash
curl -s -X PATCH "http://localhost:3001/api/v1/tasks/[task_id]" \
  -H "Content-Type: application/json" \
  -d '{"contentPhase": "brief", "activity_note": "Content brief generated. Ready for outline."}'
```

---

## Step 6: Present to Mike (optional)

If the topic is complex or the angle is bold, present a summary for Mike's approval:

> **Brief ready for [slug]:** [One-line angle summary]. Primary keyword: [kw] ([volume]/mo). [Word count] words targeting [persona]. Ready to proceed to outline?

For straightforward topics, skip approval and proceed directly.

---

## Output Contract

- Content brief saved to `.ai/content/blog/briefs/[slug]-brief.md`
- MC task updated with `contentPhase: brief`
- Handoff: "Brief complete. Run `/blog-outline [slug]` to create the outline."
