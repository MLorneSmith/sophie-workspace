# Blog Ideation Command

Generate original blog topic ideas with keyword data, dedup against existing content, and present for Mike's approval.

## Usage

```
/blog-ideate [count] "[theme/focus area]"
```

### Examples

```
/blog-ideate 5 "consulting presentations"
/blog-ideate 3 "AI and presentations"
/blog-ideate 10
```

### Arguments: $ARGUMENTS

- `count` (optional, default 5): Number of topic ideas to generate
- `theme` (optional): Focus area to constrain ideation. If omitted, generate across all SlideHeroes domains.

---

## Instructions

You generate original, high-potential blog topic ideas for SlideHeroes. Each idea must be:
1. **Original** — not overlapping with existing published content
2. **Keyword-backed** — validated with search volume data
3. **Aligned** — fits SlideHeroes brand, audience, and content strategy

---

## Step 1: Load Context

Load these files before ideating:

```
/home/ubuntu/clawd/.ai/contexts/company/products.md
/home/ubuntu/clawd/.ai/contexts/messaging/pain-points.md
/home/ubuntu/clawd/.ai/contexts/voice/brand-voice.md
/home/ubuntu/clawd/.ai/contexts/guidelines/blog-guidelines.md
/home/ubuntu/clawd/.ai/content/content-index.json
```

The `content-index.json` contains all existing published pages with their topics. **You must not propose topics that substantially overlap with these.**

---

## Step 2: Generate Seed Keywords

Based on the theme (or SlideHeroes domains if no theme), brainstorm 8-15 seed keywords. Use these categories:

**Core domains:**
- Business presentations / consulting presentations
- Slide design / deck structure
- Presentation delivery / public speaking
- Data visualization / charts
- AI + presentations
- Pitch decks / investor presentations
- Presentation tools / software

**Angle modifiers:**
- "how to...", "best...", "why...", "[company] style..."
- Teardowns, comparisons, frameworks, templates
- Industry-specific (consulting, finance, tech, sales)

---

## Step 3: Keyword Research

For each seed keyword, run:

```bash
~/clawd/scripts/keyword-research.sh "[seed keyword]" --related --top 10
```

Collect:
- Search volume for seed keyword
- Top related keywords with volume
- Competition level

**Budget:** Run 3-5 keyword research calls max per ideation session (~$0.30-0.50 total).

Pick the highest-potential keywords (volume > 100/mo, competition LOW or MEDIUM preferred).

---

## Step 4: Community & Social Research

Mine these sources for topic ideas and audience pain points:

**Reddit:**
- Search `web_search` for: `site:reddit.com r/consulting "presentation"`, `site:reddit.com r/powerpoint`, `site:reddit.com r/dataisbeautiful`
- Look for: frequently asked questions, complaints, "how do I..." posts
- Note the actual language people use (valuable for SEO targeting)

**LinkedIn:**
- Search for: `site:linkedin.com "business presentation" OR "consulting deck" OR "slide design"`
- Look for: posts with high engagement, debates, trending topics

**Competitor blogs:**
- Check recent posts from: Beautiful.ai, Gamma, Tome, Pitch, Canva
- Use `web_fetch` on their blog pages
- Note: topics they're covering, what's getting engagement, gaps they're missing

**Output:** Community insights — real questions and pain points from the audience, plus competitor content gaps.

---

## Step 5: Check GSC for Opportunity Keywords

Run:

```bash
python3 ~/clawd/scripts/gsc-query.py --days 90 --limit 50 --json
```

Look for queries where SlideHeroes already gets impressions but low clicks (CTR < 2%) or poor position (> 10). These are **opportunity keywords** — we're already ranking but could do better with dedicated content.

---

## Step 6: Dedup Against Existing Content

For each potential topic, check `content-index.json`:
- Does an existing page already cover this topic?
- Would this cannibalize an existing page's keywords?
- Could this be a **complementary** piece that links to existing content?

**Rules:**
- ❌ REJECT if >70% topic overlap with existing page
- ⚠️ FLAG if partial overlap — note which existing page it relates to
- ✅ APPROVE if genuinely new angle or topic

---

## Step 7: Score & Rank

Score each surviving topic (1-10) on:

| Factor | Weight | Description |
|--------|--------|-------------|
| Search Volume | 3x | Monthly searches for primary keyword |
| Competition Gap | 2x | Low competition = easier to rank |
| Brand Fit | 2x | How well it fits SlideHeroes positioning |
| Uniqueness | 2x | How differentiated from existing SERP results |
| Conversion Potential | 1x | Could this drive product signups? |
| Pillar Fit | 1x | Maps clearly to one of 5 content pillars? |

---

## Step 8: Present Ideas

Output a ranked table:

```
## 🎯 Blog Topic Ideas: [theme]

### #1: [Proposed Title]
- **Primary keyword:** [keyword] ([volume]/mo, [competition])
- **Secondary keywords:** [kw1] ([vol]), [kw2] ([vol])
- **Angle:** [One sentence on what makes this unique]
- **Post type:** [how-to | listicle | teardown | thought-leadership | case-study]
- **Target persona:** [solo-consultant | boutique-consultancy | enterprise-presenter]
- **Content pillar:** [How-To | Surgery | AI & Presentations | Founder Journey | ICP Intelligence]
- **Score:** [X/10]
- **Dedup check:** ✅ No overlap | ⚠️ Related to [existing-page] | ❌ Too close

[Repeat for each idea]

### GSC Opportunity Keywords (bonus)
- [query] — [impressions] impressions, position [X], current page: [page]
  → Recommendation: [new post | optimize existing | ignore]
```

Then ask:

> "Which topics would you like me to develop into full strategies? Reply with the numbers (e.g., 1, 3, 5) and I'll run `/blog-strategy` for each."

---

## Step 9: Save Ideas

Save the full ideation output to:

```
/home/ubuntu/clawd/.ai/content/blog/ideation/[date]-[theme-slug].md
```

This creates a record for future reference and prevents re-proposing rejected ideas.

---

## Output Contract

- Ranked topic ideas with keyword data
- Dedup status for each
- GSC opportunity keywords section
- Saved to `.ai/content/blog/ideation/`
- Clear next step: `/blog-strategy [slug] "[topic]"`
