---
name: linkedin-content
description: "LinkedIn content workflow: ideate, draft, and QA LinkedIn posts for SlideHeroes. Use when asked to generate LinkedIn post ideas, draft LinkedIn posts, review LinkedIn drafts, or manage the LinkedIn content pipeline. Triggers: 'linkedin post', 'draft a linkedin', 'linkedin ideas', 'linkedin ideation', 'linkedin content', '/linkedin-ideate', '/linkedin-draft', '/linkedin-qa'."
---

# LinkedIn Content Skill

End-to-end LinkedIn content system: ideation → drafting → QA → pipeline management.

## Commands

| Command | What It Does |
|---------|-------------|
| `/linkedin-ideate [N]` | Generate N scored post candidates (default: 12) |
| `/linkedin-draft [task-id]` | Draft a post from an MC Content Pipeline task |
| `/linkedin-qa [task-id]` | Run QA checklist on a draft |
| `/linkedin-batch-draft [N]` | Draft the top N posts from the pipeline (default: 3) |
| `/linkedin-status` | Show current pipeline status |

---

## Context Files (Load Order)

Every command loads context in this order. Do not skip files.

| # | File | Purpose |
|---|------|---------|
| 1 | `references/linkedin-guidelines.md` | Style rules, hook formulas, pre-publish checklist |
| 2 | `references/linkedin-pillars.md` | Format pillars, theme pillars, post formulas, cadence |
| 3 | `.ai/contexts/voice/brand-voice.md` | SlideHeroes voice and tone |
| 4 | `.ai/contexts/content/audience-content-map.md` | Persona pain points (for targeting) |

Load additional context per command as noted below.

---

## `/linkedin-ideate [N]`

Generate N scored LinkedIn post candidates.

**Process:** Follow `references/ideation-sop.md` exactly.

1. Load all 4 context files above
2. Load `references/ideation-sop.md`
3. Check existing pipeline for dedup:
   ```bash
   curl -s 'http://localhost:3001/api/v1/content-pipeline?contentType=linkedin' | jq '.grouped'
   ```
4. Check pillar balance — which format and theme pillars are underrepresented?
5. Generate N candidates using the batch generation rules in the ideation SOP
6. Score each candidate using the 6-criterion scoring system
7. Rank and recommend top 5
8. Present to user for approval

**On approval:** Seed approved ideas into MC Content Pipeline:
```bash
curl -s -X POST 'http://localhost:3001/api/v1/tasks' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "[LinkedIn] Post title",
    "board_id": 6,
    "contentType": "linkedin",
    "contentPhase": "ideation",
    "priority": "medium",
    "assignee": "mike",
    "description": "Format Pillar: ...\nTheme Pillar: ...\n..."
  }'
```

---

## `/linkedin-draft [task-id]`

Draft a publishable LinkedIn post from an MC task.

**Process:** Follow `references/drafting-sop.md` exactly.

1. Load all 4 context files above
2. Load `references/drafting-sop.md`
3. Fetch the task:
   ```bash
   curl -s "http://localhost:3001/api/v1/tasks/[task-id]" | jq '.name, .description'
   ```
4. Extract: pillar, hook direction, key message, CTA type, credibility lever
5. Write 2-3 hook variations using formulas from the style guide
6. Draft the post body following the template structure
7. Select content type (carousel / image+text / text-only) based on content type table
8. Add 3-5 hashtags
9. Run the 14-point QA checklist (auto — see below)
10. Present draft to user with hook options

**On approval:** Update MC task with draft text and move to review:
```bash
curl -s -X PATCH "http://localhost:3001/api/v1/tasks/[task-id]" \
  -H "Content-Type: application/json" \
  -d '{"contentPhase": "review", "description": "[updated with draft text]"}'
```

---

## `/linkedin-qa [task-id]`

Run the 14-point pre-publish checklist on a draft.

1. Load `references/linkedin-guidelines.md`
2. Fetch the task and extract the draft text
3. Run each checklist item, reporting pass/fail:
   - [ ] Hook earns "see more" click
   - [ ] One idea only
   - [ ] 800-1,000 characters
   - [ ] Max 2 sentences per paragraph
   - [ ] Empty lines between all paragraphs
   - [ ] No AI tells or corporate jargon
   - [ ] 4th grade reading level
   - [ ] Active voice throughout
   - [ ] Specific details (numbers, names, examples)
   - [ ] CTA at the end
   - [ ] 3-5 hashtags at the bottom
   - [ ] No external links in post body
   - [ ] Mobile-friendly length and formatting
   - [ ] Credibility lever present
4. Report results with specific fix suggestions for any failures
5. If all pass → recommend moving to Review phase

---

## `/linkedin-batch-draft [N]`

Draft multiple posts from the pipeline.

1. Fetch all LinkedIn tasks in "ideation" phase:
   ```bash
   curl -s 'http://localhost:3001/api/v1/content-pipeline?contentType=linkedin' | jq '.grouped.ideation'
   ```
2. Sort by priority (high → medium → low)
3. Draft top N using the `/linkedin-draft` process for each
4. Vary hooks — don't use the same formula twice in a row
5. Check pillar balance across the batch
6. Present all drafts for review

---

## `/linkedin-status`

Show pipeline overview.

```bash
curl -s 'http://localhost:3001/api/v1/content-pipeline?contentType=linkedin' | jq '.grouped | to_entries[] | "\(.key): \(.value | length) posts"'
```

Report: tasks per phase, pillar distribution, any gaps.

---

## Key Principles

- **Sophie drafts, Mike makes it his.** Drafts should be 80% there. Mike's edit is the 20% that makes it authentic.
- **One idea per post.** Never two.
- **Saves > likes.** Write content worth saving (frameworks, checklists, lists).
- **Engagement and leads are two different games.** Optimize for leads.
- **300-day commitment.** This is a long game. Don't judge results for months.
- **No AI tells.** If it sounds like AI wrote it, rewrite it.
