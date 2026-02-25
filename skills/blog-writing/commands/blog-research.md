# Blog Research Command

Execute 3-layer deep research for a blog topic and produce a research dossier.

## Usage

```
/blog-research [slug]
```

Requires a strategy YAML at `.ai/content/blog/strategies/[slug]-strategy.yaml` (from `/blog-strategy`).

### Arguments: $ARGUMENTS

---

## Instructions

You are a research analyst for SlideHeroes. Your job is to conduct deep, 3-layer research that surfaces genuinely new insights — not a rehash of the top search results.

---

## Step 1: Load Strategy

Read the strategy YAML from:
```
/home/ubuntu/clawd/.ai/content/blog/strategies/[slug]-strategy.yaml
```

Extract: topic, primary keyword, angle, target persona, competitor SERP notes.

Also load:
```
/home/ubuntu/clawd/.ai/contexts/content/content-pillars.md
/home/ubuntu/clawd/.ai/contexts/content/audience-content-map.md
```

---

## Step 2: Layer 1 — Landscape Scan

Read the top 10-15 existing posts on the topic using `web_search` and `web_fetch`.

For each result, document:
- Title, URL, author/publication
- Main argument or angle
- Structure (H2s, length, format)
- Strengths and weaknesses
- What's missing or oversimplified

**Output:** The "consensus view" — what everyone is saying, and what gaps exist.

**Queries to run:**
- `"[primary keyword]" guide`
- `"[primary keyword]" best practices`
- `"[primary keyword]" framework`
- `"[primary keyword]" examples`
- `[topic] site:mckinsey.com OR site:hbr.org OR site:bcg.com`

---

## Step 3: Layer 2 — Deep Source Mining

Go beyond blog posts. Use `perplexity-research` skill or `web_search` to find:

- **Academic/research papers** — studies, data, frameworks with evidence
- **Industry reports** — McKinsey, BCG, Gartner, Forrester insights
- **Books** — relevant concepts from authoritative sources
- **Expert talks/podcasts** — first-person practitioner insights
- **Contrarian viewpoints** — people who disagree with consensus (with good reasons)
- **Data** — original statistics, survey results, benchmarks
- **Case studies** — real examples with specific outcomes

Use the Perplexity API for deep research:
```bash
# Via perplexity-research skill
# Query: "[topic] research data statistics"
# Query: "[topic] expert opinion contrarian"
# Query: "[topic] case study examples results"
```

**Academic sources via Semantic Scholar (free, no API key):**
```bash
~/clawd/scripts/semantic-scholar.sh "[topic] presentation" --limit 10
~/clawd/scripts/semantic-scholar.sh "[topic] cognitive load visual" --limit 5
```

Look for papers with high citation counts (>20) — these are foundational. Include relevant findings as evidence that elevates our content above blog-level competitors.

**Output:** Research dossier — 5-10 high-quality sources with extracted insights.

---

## Step 4: Layer 3 — Original Angle Development

Synthesize Layers 1 and 2:
1. What is our unique POV that nobody else is saying?
2. Why should the reader care about our angle?
3. Apply the test: "If someone read the top 5 posts on this topic, would they learn something NEW from ours?"

If the answer is no, flag to Mike that the topic may lack differentiation.

---

## Step 5: Check Best Practices Database

Query Mission Control for relevant captured best practices:
```bash
curl -s 'http://localhost:3001/api/v1/practices?domain=Marketing&limit=10' 2>/dev/null
curl -s 'http://localhost:3001/api/v1/practices?domain=Sales&limit=10' 2>/dev/null
```

Include any relevant practices as supporting evidence.

---

## Step 6: Save Research Summary

Save to:
```
/home/ubuntu/clawd/.ai/content/blog/research/[slug]-research.md
```

Format:
```markdown
# Research Summary: [Title]

## Landscape (Layer 1)
- **Consensus view:** [What everyone says]
- **Gaps identified:** [What's missing]
- **Top competitors:** [3-5 best existing posts with URLs]

## Deep Sources (Layer 2)
### Source 1: [Title]
- **Type:** [Academic / Report / Book / Expert / Data]
- **Key insight:** [One paragraph]
- **Quotable:** [Specific quote or stat]
- **URL:** [link]

[Repeat for 5-10 sources]

## Original Angle (Layer 3)
- **Our POV:** [One sentence]
- **What's new here:** [One sentence — what this adds to the conversation]
- **Supporting evidence:** [Which sources from Layer 2 back this up]

## Key Data Points
- [Stat 1 — with source]
- [Stat 2 — with source]
- [Stat 3 — with source]

## Recommended Content Structure
- [Based on research, suggest how to structure the post]
```

---

## Step 7: Update Mission Control

Update the task with research progress:
```bash
curl -s -X PATCH "http://localhost:3001/api/v1/tasks/[task_id]" \
  -H "Content-Type: application/json" \
  -d '{"contentPhase": "research", "activity_note": "Research complete — [X] sources found, angle: [summary]"}'
```

---

## Output Contract

- Research summary saved to `.ai/content/blog/research/[slug]-research.md`
- MC task updated with `contentPhase: research`
- Clear handoff: "Research complete. Run `/blog-brief [slug]` to generate the content brief."
