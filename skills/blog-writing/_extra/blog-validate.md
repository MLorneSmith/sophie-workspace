# Blog Validate Command

Run quality gate checks on a blog post draft.

## Usage

```
/blog-validate [slug]
```

### Examples

```
/blog-validate presentation-structure
/blog-validate pie-charts-bad
```

### Arguments: $ARGUMENTS

## Instructions

You are a quality assurance reviewer checking a blog post against SlideHeroes standards. Your task is to validate the post meets all requirements before publication.

### Step 1: Load Post and Strategy

Read:
```
.ai/content/blog-posts/posts/[slug].md
.ai/content/blog-posts/strategies/[slug]-strategy.yaml
```

If either not found, inform user:
```
Cannot validate: [missing file]

Write the post first with:
/blog-write [slug]
```

### Step 2: Load Guidelines

Read:
```
~/.ai/contexts/guidelines/blog-guidelines.md
```

### Step 3: Run Quality Gates

**BLOCKING CHECKS (must pass):**

| Check | Requirement | Actual | Pass/Fail |
|-------|-------------|--------|-----------|
| Readability | ≤ Grade 8 | [calculated] | ✓/✗ |
| Word Count | ≥ 1,000 | [actual] | ✓/✗ |
| H2 Sections | ≥ 3 | [count] | ✓/✗ |
| Meta Description | 120-160 chars | [length] | ✓/✗ |
| Title Has Keyword | Primary keyword in title | [yes/no] | ✓/✗ |
| First 100 Words | Primary keyword present | [yes/no] | ✓/✗ |

**WARNING CHECKS (should fix):**

| Check | Requirement | Actual | Status |
|-------|-------------|--------|--------|
| Internal Links | ≥ 2 | [count] | ⚠/✓ |
| External Links | ≥ 1 | [count] | ⚠/✓ |
| Image Alt Text | All images have alt | [yes/no] | ⚠/✓ |
| Keyword Density | 1-2% | [actual]% | ⚠/✓ |

### Step 4: Content Quality Check

**Strategy Alignment:**

| Element | Strategy Says | Post Has | Match |
|---------|---------------|----------|-------|
| Thesis | [from strategy] | [found in post] | ✓/✗ |
| POV Connection | [POV id] | [present?] | ✓/✗ |
| Each Section | [key points] | [covered?] | ✓/✗ |

**Voice Check:**

| Criterion | Assessment |
|-----------|------------|
| Contrarian angle present | [yes/no/na] |
| Specific examples (not generic) | [yes/no] |
| Short paragraphs (≤3 sentences) | [yes/no] |
| Direct/confident tone | [yes/no] |
| Actionable takeaways | [yes/no] |

### Step 5: Generate Report

```markdown
## Validation Report: [Title]

**Overall Status:** [PASS / FAIL / WARNINGS]

### Blocking Issues

[List any failing blocking checks]

### Warnings

[List any warning-level issues]

### Content Quality

[Summary of content quality assessment]

### Recommendations

1. [Specific fix needed]
2. [Specific fix needed]
...

### Readability Details

- Flesch-Kincaid Grade: [X]
- Average sentence length: [X] words
- Average paragraph length: [X] sentences
- Passive voice usage: [X]%

### SEO Details

- Primary keyword: "[keyword]"
- Keyword density: [X]%
- Keyword locations: [title, H1, first 100 words, H2s]
- Internal links: [count] ([list URLs])
- External links: [count] ([list URLs])

### Word Count Breakdown

| Section | Target | Actual |
|---------|--------|--------|
| Opening | [X] | [X] |
| Section 1 | [X] | [X] |
| Section 2 | [X] | [X] |
| ... | ... | ... |
| **Total** | [X] | [X] |
```

### Step 6: Provide Fix Instructions

If there are failures or warnings:

```markdown
### How to Fix

**[Issue 1]:**
[Specific instructions]

**[Issue 2]:**
[Specific instructions]

To re-validate after fixes:
```
/blog-validate [slug]
```
```

### Step 7: If All Passes

```markdown
## ✅ Validation Passed

Post is ready for human review.

**Next Steps:**
1. Mike reviews: `~/clawd/.ai/content/blog-posts/posts/[slug].md`
2. Make any editorial changes
3. Publish to CMS

**To publish:**
[Instructions based on CMS integration]
```

### Step 8: Update Mission Control

If validation passes:
```bash
curl -s -X PATCH "http://localhost:3001/api/v1/tasks/[task_id]" \
  -H "Content-Type: application/json" \
  -d '{
    "activity_note": "Validation passed, ready for review"
  }'
```

If validation fails:
```bash
curl -s -X PATCH "http://localhost:3001/api/v1/tasks/[task_id]" \
  -H "Content-Type: application/json" \
  -d '{
    "activity_note": "Validation failed: [summary of issues]"
  }'
```

---

## Readability Calculation

Use Flesch-Kincaid Grade Level formula:
```
0.39 × (total words / total sentences) + 11.8 × (total syllables / total words) − 15.59
```

Or use Python textstat library:
```python
import textstat
grade = textstat.flesch_kincaid_grade(text)
```

Target: ≤ 8.0 (8th grade reading level)

---

## Keyword Density Calculation

```
density = (keyword_count / total_words) × 100
```

Target: 1-2%

Too low = missed SEO opportunity
Too high = keyword stuffing (bad for SEO and readability)
