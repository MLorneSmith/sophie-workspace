# SOP: LinkedIn Post Drafting

**Owner:** Sophie + Mike
**Created:** 2026-02-22
**Status:** Active

---

## Purpose

Turn approved LinkedIn post ideas into publishable drafts that pass the style guide quality gate. Every draft follows the same process.

---

## Process

```
1. Load Context → 2. Draft → 3. QA Check → 4. Move to Review → 5. Mike Edits → 6. Publish
```

---

## Phase 1: Load Context

**Before writing a single word, load these files:**

1. `.ai/contexts/guidelines/linkedin-guidelines.md` — style rules, hook formulas, checklist
2. `.ai/contexts/content/linkedin-pillars.md` — format pillars, theme pillars, post formulas
3. `.ai/contexts/voice/brand-voice.md` — SlideHeroes voice and tone
4. The MC task description for this post (contains: pillar, hook, key message, CTA type, credibility lever)

**Do not draft without loading all four.** This is the quality control.

---

## Phase 2: Draft

### Step 1: Choose the hook
- Reference the 10 hook formulas in the style guide
- Write 2-3 hook variations
- Pick the one that creates the most tension/curiosity
- Test: would YOU click "see more"?

### Step 2: Write the body
Follow the post template:
```
HOOK (2 lines)

Setup (2-3 short paragraphs)

The Insight (the value)

Key Takeaways (optional bullets)

CTA (question or invitation)

#Hashtag1 #Hashtag2 #Hashtag3
```

**Writing rules (from style guide):**
- One idea only
- Max 2 sentences per paragraph
- Empty line between every paragraph
- 800-1,000 characters target
- Active voice, contractions, conversational
- Specific details (numbers, names, examples)
- Use the 1-3-1 sentence rhythm (short, medium, medium, short)
- Include the credibility lever from the task description

### Step 3: Choose content type
- Default: text + image or carousel (text-only is weakest format)
- Frameworks/step-by-steps → carousel
- Personal stories → photo of Mike
- Hot takes → text + simple graphic
- Reference the content type multiplier table in the style guide

### Step 4: Select hashtags
- 3-5 hashtags at the end
- Mix: 1 broad + 2-3 niche + 1 branded (#SlideHeroes)
- PascalCase format

---

## Phase 3: QA Check

Run the draft through the **14-point pre-publish checklist** (from linkedin-guidelines.md):

- [ ] Hook earns the "see more" click
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
- [ ] Previewed on mobile (or character count verified)
- [ ] Credibility lever present

**If any item fails:** Fix before moving forward. No exceptions.

**AI tell scan:** Re-read the draft specifically looking for:
- "In today's..." / "It's important to note..." / "Let's dive in"
- Overuse of m-dashes (—)
- "Here are X ways to..." as an opener
- Corporate jargon (leverage, synergy, circle back)
- Overly structured, assembled-feeling sentences

---

## Phase 4: Move to Review

Update the MC task:
```bash
curl -s -X PATCH "http://localhost:3001/api/v1/tasks/{id}" \
  -H "Content-Type: application/json" \
  -d '{"contentPhase": "review"}'
```

Add the draft text to the task description so Mike can read it in MC.

**Include with the draft:**
- The post text (ready to copy-paste into LinkedIn)
- Recommended content type (text-only / image / carousel)
- Image suggestion if applicable
- 2-3 hook variations Mike can choose from

---

## Phase 5: Mike Edits

Mike reviews in MC Content Pipeline or Discord:
- Edits for his voice (Sophie drafts, Mike makes it his)
- Picks preferred hook
- Approves or sends back with notes
- If approved → move to Published phase when posted

**Key principle:** Sophie writes the structure and ideas. Mike adds the personality and lived experience. The draft should be 80% there — Mike's edit is the final 20% that makes it authentic.

---

## Phase 6: Publish

When Mike posts on LinkedIn:
- Update MC task: `contentPhase: "published"`
- Note the post URL in the task description
- Log for analytics tracking

---

## Batch Drafting

When drafting multiple posts (e.g., building the initial backlog):
- Draft in priority order (highest-scored ideas first)
- Vary the hooks — don't use the same formula twice in a row
- Check pillar balance across the batch
- Aim for 3-5 drafts per batch

---

*This SOP works with: sops/linkedin-content-ideation.md (generates ideas) and .ai/contexts/guidelines/linkedin-guidelines.md (quality standard).*
