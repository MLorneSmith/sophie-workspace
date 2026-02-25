# Blog Outline Command

Create a detailed structural outline optimized for clarity, SEO, and AEO.

## Usage

```
/blog-outline [slug]
```

Requires:
- Content brief at `.ai/content/blog/briefs/[slug]-brief.md`
- Research summary at `.ai/content/blog/research/[slug]-research.md`

### Arguments: $ARGUMENTS

---

## Instructions

You translate the content brief (the *what*) into a structural blueprint (the *how*). The outline is not just a list of sections — it's a structural decision about how to present the argument most effectively.

---

## Step 1: Load Inputs

```
/home/ubuntu/clawd/.ai/content/blog/briefs/[slug]-brief.md
/home/ubuntu/clawd/.ai/content/blog/research/[slug]-research.md
/home/ubuntu/clawd/.ai/content/blog/strategies/[slug]-strategy.yaml
/home/ubuntu/clawd/.ai/contexts/content/content-pillars.md
```

---

## Step 2: Apply Structure Best Practices

**Clarity:**
- Lead with the insight — don't bury the lede
- One idea per H2 section
- Pyramid structure — most important info first
- Concrete before abstract — start with example, then generalize
- Progressive disclosure — build complexity gradually

**SEO:**
- Target keyword in H1 and at least one H2
- Related keywords in other H2s (semantic variations, not stuffing)
- Clean H1 → H2 → H3 hierarchy (no skipped levels)

**AEO (Answer Engine Optimization):**
- Direct answer in first 100 words
- Question-format H2s where natural ("How do you...?", "What is...?")
- Structured definitions for key concepts (1-2 sentences)
- Numbered/bulleted lists for steps, tips, principles (highly extractable)
- Cite specific data/sources (AI engines prioritize verifiable claims)

---

## Step 3: Build Outline

Use this structure:

```markdown
# [Title — from content brief, includes primary keyword]

**Meta Title:** [from brief]
**Meta Description:** [from brief]
**Primary Keyword:** [keyword] ([volume]/mo)
**Secondary Keywords:** [list]
**Target Word Count:** [from brief]

---

## Hook (first 100 words)
- **Direct answer:** [Concise answer to the core question — AEO optimized]
- **Why it matters:** [Stakes — what happens if you get this wrong]
- **Unique angle setup:** [Tease the insight that makes this post different]
- **Transition:** [Bridge to the first H2]

## H2: [Section 1 — strongest point first]
- **Key argument:** [One sentence]
- **Supporting evidence:** [Data point or source from research]
- **Example:** [Concrete, specific example]
- **Secondary keyword:** [If naturally fits]
- **Word count target:** [~300-400 words]
- **Transition:** [Bridge to next section]

## H2: [Section 2]
- **Key argument:**
- **Supporting evidence:**
- **Example:**
- **Word count target:**
- **Transition:**

[Continue for 5-8 H2 sections]

## H2: FAQ / Common Questions (AEO section)
- **Q:** [Natural language question matching search queries]
  **A:** [Direct, concise answer — 2-3 sentences max]
- **Q:** [Second question]
  **A:** [Answer]
- **Q:** [Third question]
  **A:** [Answer]

## Conclusion & Next Steps
- **Summary:** [3-4 bullet recap of key points]
- **Action step:** [Specific thing the reader should do next]
- **CTA:** [From content brief — product mention or resource link]

---

## Internal Links Plan
- Link TO: [existing SlideHeroes page] — from [which section]
- Link TO: [existing SlideHeroes page] — from [which section]
- Link TO: [existing SlideHeroes page] — from [which section]

## Sources to Cite
- [Source 1 — from research Layer 2]
- [Source 2]
- [Source 3]
```

---

## Step 4: Validate Outline

Check before saving:
- [ ] H1 contains primary keyword
- [ ] At least one H2 contains primary keyword
- [ ] Other H2s use secondary keywords naturally
- [ ] Each H2 has a clear single argument
- [ ] Hook includes direct answer (AEO)
- [ ] FAQ section included with 3+ questions
- [ ] Internal links identified
- [ ] Total estimated word count matches brief target
- [ ] Sections flow logically (strongest point first, progressive complexity)

---

## Step 5: Save Outline

```
/home/ubuntu/clawd/.ai/content/blog/outlines/[slug]-outline.md
```

---

## Step 6: Update Mission Control

```bash
curl -s -X PATCH "http://localhost:3001/api/v1/tasks/[task_id]" \
  -H "Content-Type: application/json" \
  -d '{"contentPhase": "outline", "activity_note": "Outline complete — [N] H2 sections, [word count] target"}'
```

---

## Output Contract

- Outline saved to `.ai/content/blog/outlines/[slug]-outline.md`
- MC task updated with `contentPhase: outline`
- Handoff: "Outline complete. Run `/blog-write [slug]` to draft the post."
