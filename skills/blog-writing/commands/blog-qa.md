# Blog QA Command

Run automated pre-publish QA checks on a blog post draft.

## Usage

```
/blog-qa [slug]
```

Requires a draft at one of:
- `.ai/content/blog/posts/[slug].md`
- `.ai/runs/<task-id>/output.md`

### Arguments: $ARGUMENTS

---

## Instructions

You are the quality gate between draft and Mike's review. Run every check below. Mike should review for voice, angle, and quality — NOT formatting, SEO mechanics, or broken links. Catch those here.

---

## Step 1: Load Files

```
# Draft (try both locations)
/home/ubuntu/clawd/.ai/content/blog/posts/[slug].md
# OR find via strategy YAML → task_id → .ai/runs/<task_id>/output.md

# Brief (for comparison)
/home/ubuntu/clawd/.ai/content/blog/briefs/[slug]-brief.md

# Strategy (for keyword data)
/home/ubuntu/clawd/.ai/content/blog/strategies/[slug]-strategy.yaml

# Content index (for dedup)
/home/ubuntu/clawd/.ai/content/content-index.json
```

---

## Step 2: Content Quality Checks

Run each check and record pass/fail:

### 2a. Factual Claims
- Scan for statistics, percentages, study references
- Verify each has an inline citation or source
- Flag any unattributed claims
- **Pass criteria:** All factual claims have sources

### 2b. Originality / Dedup
- Compare key arguments against existing SlideHeroes content (content-index.json)
- Check that the post adds genuinely new insight vs existing pages
- **Pass criteria:** No substantial overlap with published content

### 2c. Word Count
- Count words in the draft
- Compare against brief target (default 2000-3000)
- **Hard minimum: 2000 words — auto-fail if under 2000**
- **Pass criteria:** ≥2000 words AND within ±20% of brief target

### 2d. Readability
- Assess sentence complexity, jargon density, paragraph length
- Target: Flesch-Kincaid Grade Level 8-12 (B2B professional)
- Flag paragraphs longer than 150 words
- Flag sentences longer than 40 words
- **Pass criteria:** Grade level 8-12, no excessive long blocks

### 2e. CTA Present
- Check for clear call-to-action (from brief)
- Should appear at end, optionally mid-post
- **Pass criteria:** CTA present and clear

### 2f. Opening Paragraph (AEO)
- First 100 words should contain a direct answer to the core question
- Should not start with generic AI filler
- **Pass criteria:** Direct answer present in first paragraph

---

## Step 3: SEO Checks

### 3a. Primary Keyword in H1
- Extract H1 (title) from draft
- Check primary keyword (from strategy) appears in it
- **Pass criteria:** Keyword present in H1

### 3b. Primary Keyword in H2
- Scan all H2 headers
- At least one should contain primary keyword or close variant
- **Pass criteria:** Keyword in ≥1 H2

### 3c. Meta Description
- Check if meta description is present (in front matter or specified)
- Validate: 150-160 chars, includes primary keyword, action-oriented
- If missing, generate one
- **Pass criteria:** Meta description present and valid

### 3d. URL Slug
- Check slug is clean, keyword-rich, no special characters
- **Pass criteria:** Clean slug

### 3e. Internal Links
- Scan for links to other SlideHeroes pages
- Should have 2-3 minimum
- Cross-reference with content-index.json for relevant pages to link
- If missing, suggest specific internal links with placement
- **Pass criteria:** ≥2 internal links

### 3f. Header Hierarchy
- Verify clean H1 → H2 → H3 (no skipped levels)
- Only one H1
- **Pass criteria:** Clean hierarchy

---

## Step 4: Technical Checks

### 4a. External Links
- Extract all external URLs from the draft
- Test each with `web_fetch` (just check for 200 status)
- Flag any 404s or unreachable URLs
- **Pass criteria:** All external links reachable

### 4b. Markdown Formatting
- Check for broken markdown (unclosed code blocks, malformed tables, etc.)
- **Pass criteria:** Clean markdown

### 4c. Image Alt Text
- If images are referenced, check for alt text
- **Pass criteria:** All images have alt text (or no images)

---

## Step 5: Brand Checks

### 5a. Tone
- Scan for generic AI filler phrases:
  - "In today's fast-paced world..."
  - "It's important to note..."
  - "Let's dive in..."
  - "In conclusion..."
  - "Without further ado..."
  - "Are you looking for..."
  - "Look no further..."
- Flag any found
- **Pass criteria:** No AI filler detected

### 5b. Voice Match
- Compare tone against SlideHeroes brand voice (direct, opinionated, practical)
- Flag sections that feel generic or committee-written
- **Pass criteria:** Consistent voice throughout

---

## Step 6: Generate QA Report

Save report to:
```
/home/ubuntu/clawd/.ai/content/blog/qa/[slug]-qa.md
```

Format:
```markdown
# QA Report: [slug]

**Date:** [YYYY-MM-DD]
**Draft location:** [path]
**Overall:** ✅ PASS / ❌ FAIL ([X]/[total] checks passed)

## Content Quality
- [ ] ✅/❌ Factual claims sourced — [notes]
- [ ] ✅/❌ Originality check — [notes]
- [ ] ✅/❌ Word count: [actual] / [target] — [within range?]
- [ ] ✅/❌ Readability: Grade [X] — [notes]
- [ ] ✅/❌ CTA present — [notes]
- [ ] ✅/❌ AEO opening — [notes]

## SEO
- [ ] ✅/❌ Keyword in H1 — "[keyword]" in "[title]"
- [ ] ✅/❌ Keyword in H2 — found in: [which H2s]
- [ ] ✅/❌ Meta description — [present/missing, char count]
- [ ] ✅/❌ URL slug — [slug]
- [ ] ✅/❌ Internal links — [count] found: [list]
- [ ] ✅/❌ Header hierarchy — [clean/issues]

## Technical
- [ ] ✅/❌ External links — [all valid / X broken]
- [ ] ✅/❌ Markdown formatting — [clean/issues]
- [ ] ✅/❌ Image alt text — [N/A or status]

## Brand
- [ ] ✅/❌ No AI filler — [clean / found: list]
- [ ] ✅/❌ Voice match — [consistent/issues]

## Issues to Fix
1. [Issue — severity — suggested fix]
2. [Issue — severity — suggested fix]

## Auto-Generated Suggestions
- **Meta description (if missing):** [generated]
- **Internal links (if missing):** [suggested with placement]
- **Missing sources:** [flagged claims needing citation]
```

---

## Step 7: Update Mission Control

```bash
curl -s -X PATCH "http://localhost:3001/api/v1/tasks/[task_id]" \
  -H "Content-Type: application/json" \
  -d '{"contentPhase": "qa", "activity_note": "QA complete — [X]/[Y] checks passed. [Issues summary]"}'
```

---

## Step 8: Next Steps

If all pass:
> "QA passed ✅ — all [X] checks green. Draft is ready for Mike's review. Moving to `mike_review` phase."

If issues found:
> "QA found [X] issues. Fixing now..." → fix automatically where possible, then re-run.

---

## Output Contract

- QA report saved to `.ai/content/blog/qa/[slug]-qa.md`
- MC task updated with `contentPhase: qa`
- Auto-fix minor issues where possible
- Handoff to Mike review or back to revision
