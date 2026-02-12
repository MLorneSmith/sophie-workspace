# SOP: Blog Writing Process

**Owner:** Sophie + Mike  
**Last Updated:** 2026-02-11  
**Status:** Draft v6 — added pillar-driven ideation + tent pole planning  

---

## Purpose

Define the end-to-end process for creating SlideHeroes blog posts, from topic ideation through publication. This ensures posts are original, strategically aligned, and consistently high quality.

---

## Process Overview

```
1. Topic Ideation → 2. Alignment → 3. Research → 4. Content Brief → 5. Outline → 6. Draft → 7. QA → 8. Review → 9. Publish
```

9 phases. Writing doesn't begin until phases 1–5 are complete.

**Tracking:** Every blog post is tracked as a Task in Mission Control with `contentType: blog_post`. Progress is visible on the **Content Pipeline** tab (`/content`), where each phase is a kanban column. Drag tasks between columns to advance them through phases, or update the phase via the task editor.

---

### Phase 1: Topic Ideation

**Who:** Sophie (proposes) → Mike (approves)  
**Frequency:** Batch — generate 5-10 candidates at a time  

**Context System Inputs:**
- `content-pillars.md` — ensures topics align with our 4 pillars
- `topic-clusters.md` — identifies gaps in existing cluster coverage
- `audience-content-map.md` — matches topics to persona pain points
- `content-calendar-framework.md` — timing and cadence considerations

**Pillar-First Approach:** Every topic must map to a primary pillar before proceeding. The pillars are the starting point for ideation, not an afterthought. Reference `content-pillars.md` as the governing document.

**The 6 Content Pillars:**
1. How-To Guides (2-3/mo)
2. Presentation Surgery (1-2/mo)
3. SlideHeroes Product Spotlight (1-2/mo)
4. Founder Journey (1/mo)
5. ICP Intelligence (1/mo)
6. Workflows, Productivity & AI (1-2/mo)

**Steps:**
1. Load content context files (all 5 files from `.ai/contexts/content/`)
2. **Start from pillar gaps** — check which pillars are underserved this month against the target cadence above
3. Research keyword opportunities using **keyword research tools** (see Tools section)
4. Audit existing SlideHeroes blog content to identify what's already covered
5. Analyze competitor content to find differentiation angles
6. Review audience questions (from sales calls, social media, Google Search Console queries)
7. Mine community sources: Reddit, LinkedIn, competitor blogs (see `content-pillars.md` → ICP Intelligence)
8. Cross-reference candidates against content pillars and topic clusters
9. Assign each candidate a **primary pillar** (required) and optional secondary pillar
10. Generate candidate topics with proposed angles

**Output:** Topic brief for each candidate:
- Working title
- **Primary pillar** (required) + optional secondary pillar
- Target keyword(s) + search volume + difficulty (from keyword research)
- Unique angle — what makes this different from what we've already published
- Target persona (from `audience-content-map.md`)
- Content gap it fills (what exists today vs. what this adds)

**Dedup Check (Critical):**
- Compare each candidate against published SlideHeroes posts
- Compare against `topic-clusters.md` for overlap with planned/existing content
- Check content context for similar angles already covered
- If a topic overlaps significantly with existing content, either:
  - Drop it, or
  - Reframe with a clearly differentiated angle (document the differentiation)

**Skill:** `blog-writing` (to be extended with ideation step — Task #441)  
**Tools:** Keyword research tool (Task #442), Google Search Console, web_search  

---

### Tent Pole Research Planning (Quarterly)

Tent pole research pieces follow a separate planning cadence from regular monthly ideation. These are original, data-driven research assets that anchor a quarter's content.

**Cadence:** 3-4 per year, planned one quarter ahead  
**Who:** Mike (selects topic) + Sophie (executes research + production)  
**Governing document:** `content-pillars.md` → "Tent Pole Research" section  

**Quarterly Planning Steps:**
1. At the start of each quarter, review what data we can realistically gather (surveys, product usage data, public datasets, Surgery library analysis)
2. Select one tent pole topic that maps to a pillar and has available data
3. Plan the content cascade — derivative posts that will reference the tent pole over the following 4-8 weeks
4. Create MC tasks for: the tent pole itself + 3-4 derivative posts
5. Build research timeline: data gathering → analysis → writing → design → launch

**Content Cascade (per tent pole):**
- **Pre-launch (2-3 weeks before):** Teaser posts, "what we're researching" founder journey post
- **Launch week:** Full report + summary blog post + social campaign + email blast
- **Post-launch (4-8 weeks):** Derivative posts exploring specific findings, Surgery posts using the data, How-To posts applying the insights

**Success targets per tent pole:**
- 20+ backlinks acquired
- Email signups from gated full report
- 8-12 derivative content pieces produced

---

### Phase 2: Topic Alignment

**Who:** Mike  
**Timing:** Before any research or writing begins  

**Steps:**
1. Sophie presents topic candidates (batch of 5-10) via Discord or MC Docs
2. Mike selects which topics to pursue
3. Mike may refine the angle, add personal insights, or suggest a different take
4. Mike may share source material, references, or personal experiences relevant to the topic
5. Agreed topics go into the content calendar (`content-calendar-framework.md`)

**Output:** Approved topic with confirmed angle and any notes/sources from Mike

---

### Phase 3: Research

**Who:** Sophie  
**Goal:** Find insight, data, and perspectives that are genuinely valuable — not a rehash of the top 10 search results on the topic.

This is the phase that separates a good post from a forgettable one. The research must surface things the reader can't easily find themselves.

**Context System Inputs:**
- `content-pillars.md` — positioning guardrails
- `audience-content-map.md` — what the audience already knows vs. needs to learn
- Best practices database (Notion) — previously captured insights

**Research Layers (work through in order):**

#### Layer 1: Landscape Scan
- Read the top 10–15 existing posts on the topic
- Document the "consensus view" — what everyone is saying
- Identify what's missing, wrong, or oversimplified in the consensus
- Note common structures and angles (so we can deliberately differ)

**Output:** Landscape brief — what exists, what's consensus, what's missing

#### Layer 2: Deep Source Mining
Go beyond blog posts. Find the good stuff that hasn't been recycled:
- **Academic / research papers** — studies, data, frameworks with evidence
- **Industry reports** — McKinsey, BCG, Gartner, Forrester, niche consultancies
- **Books** — extract relevant concepts from authoritative books on the topic
- **Expert interviews / podcasts / talks** — first-person insights from practitioners
- **Contrarian viewpoints** — people who disagree with the consensus and have good reasons
- **Data** — original statistics, survey results, benchmarks
- **Case studies** — real examples with specific outcomes, not generic "Company X did Y"

**Output:** Research dossier — 5-10 high-quality sources with extracted insights

#### Layer 3: Original Angle Development
- Synthesize findings from Layers 1 and 2
- Identify the unique POV for our post — what can we say that nobody else is saying?
- Develop the "so what" — why should the reader care about our angle?
- Test the angle: "If I read this to someone who's read the top 5 posts on this topic, would they learn something new?"

**Output:** Research summary with:
- Key findings (data, insights, quotes)
- Proposed unique angle with supporting evidence
- Sources with attribution
- "What's new here" statement — one sentence on what this post adds to the conversation

**Quality Bar:** If the research doesn't surface anything genuinely new or insightful, go back to Layer 2 or flag to Mike that the topic may not have enough differentiation potential.

**Skills:** `perplexity-research` (deep web research with citations), `web_search`, `web_fetch`  
**Tools:** Perplexity API, web_search, Google Scholar, industry report databases  
**Future:** Best practices database search, content library search  

---

### Phase 4: Content Brief

**Who:** Sophie (assembles) → Mike (approves or skips)  
**Goal:** Consolidate research findings and strategic decisions into a single document that guides the outline and writing. Reduces revision cycles and ensures alignment before any structural decisions are made.

The content brief is the contract between strategy and execution. If the brief is right, the outline and draft should follow naturally.

**Context System Inputs:**
- Research summary from Phase 3
- `audience-content-map.md` — persona details for audience section
- `content-pillars.md` — voice and positioning

**Template:**

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
| **Content Goal** | [Educate / Drive leads / Build authority — tie to business KPI] |
| **Core Message** | [One sentence: what's the key takeaway?] |
| **Unique Angle** | [What's new here that the reader can't find in the top 10 results?] |
| **Competitive Landscape** | [Top 3 competing posts: strengths, weaknesses, gaps we exploit] |

## SEO & AEO
| Field | Value |
|-------|-------|
| **Primary Keyword** | [exact match] |
| **Secondary Keywords** | [5-10 semantic variations] |
| **URL Slug** | [/keyword-rich-slug] |
| **Meta Title** | [50-60 chars with keyword] |
| **Meta Description** | [150-160 chars, action-oriented] |
| **Internal Links** | [3-5 related SlideHeroes posts to link from] |
| **Featured Snippet Target** | [Yes/No — what format?] |
| **AEO Format** | [Direct answer in first 100 words / FAQ section / Listicle] |

## Content Specs
| Field | Value |
|-------|-------|
| **Research Reference** | [Link to research summary from Phase 3] |
| **Key Data/Stats to Include** | [Specific numbers, studies, quotes from research] |
| **SME Insights** | [Mike's personal experience or anecdotes to weave in] |
| **Tone/Voice** | [From content-pillars.md — direct, opinionated, practical] |
| **CTA** | [Primary action + placement: mid-post and/or end] |

## Success Metrics
| Metric | Target |
|--------|--------|
| **Organic Traffic (30 days)** | [e.g., 500 visits] |
| **Keyword Ranking** | [Target position for primary keyword] |
| **Engagement** | [Time on page, scroll depth] |
| **Conversions** | [Sign-ups, demo requests, downloads] |

## Notes
[Any additional context, edge cases, or Mike's specific input from Phase 2]
```

**Output:** Content brief in `~/clawd/.ai/runs/<task-id>/brief.md`

**Skill:** `blog-writing` (to be updated with brief generation — Task #441)  
**Tools:** None additional — this is a synthesis of Phase 3 research  

---

### Phase 5: Outline

**Who:** Sophie  
**Goal:** Create a detailed structural blueprint that optimizes for clarity, SEO, and AI Engine Optimization (AEO). The outline translates the *what* (content brief) into the *how* (structure).

The outline is not just a list of sections — it's a structural decision about how to present the argument most effectively.

**Context System Inputs:**
- Content brief from Phase 4 (primary input)
- Research summary from Phase 3
- `content-types.md` — format and structure guidelines
- Blog post structure best practices (see below)

#### Blog Post Structure Best Practices

**Clarity:**
- **Lead with the insight.** Don't bury the lede. The reader should know what they'll learn in the first 2-3 sentences.
- **One idea per section.** Each H2 should make a single, clear point. If a section is making two points, split it.
- **Pyramid structure.** Most important information first, supporting detail beneath. Executives skim — reward skimming.
- **Concrete before abstract.** Start sections with a specific example, then generalize. Never the reverse.
- **Progressive disclosure.** Build complexity gradually — don't front-load jargon.

**SEO:**
- **Target keyword in H1** (title) and at least one H2
- **Related keywords in other H2s** — use semantic variations, not keyword stuffing
- **Meta description** — 150-160 chars, includes target keyword, compelling enough to click
- **Internal links** — link to 2-3 related SlideHeroes posts where relevant
- **URL slug** — short, keyword-rich, human-readable

**AEO (AI Engine Optimization):**
- **Direct answer format.** Include a clear, concise answer to the core question early in the post (ideally in the first 100 words). AI engines pull from this.
- **FAQ-style sections.** Use question-format H2s where natural ("How do you...?", "What is...?", "Why does...?"). These map directly to AI search queries.
- **Structured definitions.** When introducing a concept, define it clearly in 1-2 sentences. AI models extract these as knowledge.
- **Listicle sections.** Numbered or bulleted lists of steps, tips, or principles are highly extractable by AI engines.
- **Schema-friendly structure.** Clear H1 → H2 → H3 hierarchy. Each H2 is a self-contained answer unit.
- **Cite sources.** Reference specific data, studies, or experts. AI engines prioritize content with verifiable claims.

#### Outline Template

```markdown
# [Title — from content brief]

## Hook (first 100 words)
[Direct answer to the core question + why the reader should care]
[Setup the unique angle from research]

## H2: [Section 1 — strongest point first]
- Key argument:
- Supporting evidence/data:
- Example:
- Transition to next section:

## H2: [Section 2]
...

## H2: [Section 3]
...

## H2: [Optional — FAQ or "Common Mistakes" section]
- Q: [Natural language question]
- A: [Direct, concise answer]

## Conclusion / Action Steps
- Summary of key points
- Specific next steps for the reader
- CTA (from content brief)
```

**Output:** Detailed outline in `~/clawd/.ai/runs/<task-id>/outline.md`

**Skill:** `blog-writing` (to be updated with outline template — Task #441)  
**Tools:** None additional — this is a structural synthesis of the content brief  

---

### Phase 6: Draft Writing

**Who:** Sophie (writer agent → reviewer loop)  
**System:** Sophie Loop (`loop-runner.py`) with writer + reviewer agents  

**Context System Inputs:**
- Outline from Phase 5 (primary structural input)
- Content brief from Phase 4 (strategic input)
- Research summary from Phase 3
- `content-pillars.md` — tone consistency check
- Corrections log (`.ai/contexts/corrections-log.md`) — apply learned lessons

**Steps:**
1. Writer agent produces first draft from outline + research
2. Automated checks run (word count, readability, SEO basics)
3. Reviewer agent evaluates and provides feedback
4. Writer revises based on feedback
5. Loop continues until reviewer approves (typically 1-2 iterations)

**Quality Gates:**
- On-brand voice (matches SlideHeroes tone from content pillars)
- Original content (verified against research — uses unique sources, not just consensus)
- Actionable — reader can apply the advice
- Specific — includes concrete examples from research, not just theory
- SEO-optimized — target keyword in title, H2s, meta description
- AEO-optimized — direct answers, structured definitions, FAQ sections

**Skill:** `blog-writing` (`/blog-write` command), `blog-post-optimizer` (SEO scoring)  
**Tools:** Sophie Loop (`loop-runner.py`), writer agent (`writer.yaml`), reviewer  
**Output:** Draft blog post in `~/clawd/.ai/runs/<task-id>/output.md`

---

### Phase 7: Pre-Publish QA

**Who:** Sophie (automated + manual checks)  
**Timing:** After Sophie Loop approves the draft, before sending to Mike  
**Goal:** Catch issues before they reach Mike's review. Mike should review for voice, angle, and quality — not missing meta tags or broken links.

**Checklist:**

#### Content Quality
- [ ] All factual claims are verifiable — sources cited inline
- [ ] No rehashed content from existing SlideHeroes posts (compare against dedup check from Phase 1)
- [ ] Word count ≥2000 words (hard minimum) and within target range (from content brief, default 2000-3000)
- [ ] Readability score acceptable (Flesch-Kincaid Grade 8-12 for B2B)
- [ ] CTA present and clear (matches content brief)
- [ ] Opening paragraph delivers direct answer to core question (AEO)

#### SEO
- [ ] Target keyword appears in H1 (title)
- [ ] Target keyword appears in at least one H2
- [ ] Meta description written (150-160 chars, includes keyword)
- [ ] URL slug is clean and keyword-rich
- [ ] Internal links to 2-3 related SlideHeroes posts included
- [ ] No orphan pages created
- [ ] Header hierarchy is clean (H1 → H2 → H3, no skipped levels)

#### Technical
- [ ] All external links are valid (not 404)
- [ ] Images have descriptive alt-text (if applicable)
- [ ] Article schema markup defined
- [ ] No broken markdown formatting
- [ ] Code blocks / tables render correctly (if any)

#### Brand
- [ ] Tone matches SlideHeroes voice (direct, opinionated, practical)
- [ ] No generic AI filler ("In today's fast-paced world...", "It's important to note...")
- [ ] Post reads like something Mike would write, not a committee

**Output:** QA report appended to `~/clawd/.ai/runs/<task-id>/qa-checklist.md`  
**Action:** If all checks pass → move to Phase 8 (Mike Review). If issues found → fix and re-check.

**Skill:** `blog-post-optimizer` (SEO scoring), automated checks in Sophie Loop  
**Tools:** Readability scorer, link checker, SEO validator  

---

### Phase 8: Review

**Who:** Mike  
**Location:** MC Docs tab  

**Steps:**
1. Sophie moves task to `mike_review` status
2. Sophie provides: draft + QA checklist (all green) + content brief for reference
3. Mike reads draft and provides feedback:
   - **Approve** → move to publish
   - **Revise** → specific feedback, Sophie revises and re-runs QA
   - **Kill** → topic isn't working, archive and move on
4. If revisions needed, Sophie updates and re-submits
5. Feedback captured in corrections log for future improvement

**Mike's review focus:** Voice, angle, quality, originality — not formatting or SEO mechanics (those are caught in QA).

**Tools:** MC Docs tab, Discord for feedback discussion  

---

### Phase 9: Publish

**Who:** Mike (or Sophie with approval)  
**Platform:** SlideHeroes blog (CMS TBD)  

**Steps:**
1. Final proofread
2. Add featured image
3. Set SEO metadata (from outline)
4. Add schema markup where applicable
5. Publish and share on social channels
6. Update `topic-clusters.md` with new published content (Phase 9, Step 6)
7. Log in Mission Control as completed
8. Track performance in Google Search Console / PostHog

**Tools:** CMS (TBD), social media tools, Google Search Console, PostHog  

---

## Tracking in Mission Control

All blog posts are tracked on the **Content Pipeline** tab in Mission Control (`/content`).

**Setting up a new blog post:**
1. Create a Task in MC (or have Sophie create it)
2. Set `contentType` to `blog_post`
3. Set `contentPhase` to `ideation` (starting phase)
4. Assign to Sophie, Mike, or Both
5. The task appears on the Content Pipeline kanban

**Advancing through phases:**
- Drag the task card to the next column on the Content Pipeline, or
- Sophie updates the phase programmatically as she completes each step

**Phase → Status mapping:**
| Content Phase | MC Task Status |
|--------------|----------------|
| Ideation – QA (Phases 1-7) | `in_progress` |
| Review (Phase 8) | `mike_review` |
| Published (Phase 9) | `done` |

Sophie updates both `contentPhase` (for pipeline visibility) and `status` (for the main Tasks/Kanban boards) at each transition.

**Where to find things:**
- Content Pipeline: `/content` — phase-based kanban for all content
- Task details: click any card to edit title, description, phase, type
- SOP reference: MC Docs tab → filter by "SOP" tag
- Deliverables: MC Docs tab → search by task ID or title

---

## Tools Required

| Tool | Phase | Purpose | Status |
|------|-------|---------|--------|
| **Content Context System** | 1, 3, 4, 5, 6 | Topic alignment, voice consistency, dedup | ✅ Built (Task #159) |
| **web_search / web_fetch** | 1, 3 | Competitor research, SERP analysis | ✅ Available |
| **Perplexity Research** | 3 | Deep research with citations — academic, reports, contrarian views | ✅ Skill installed |
| **Blog Writing Skill** | 4, 5, 6 | Outline, brief, + writing workflow | ✅ Skill installed (needs update) |
| **Blog Post Optimizer** | 6, 7 | SEO scoring and recommendations | ✅ Skill installed |
| **Sophie Loop** | 6 | Builder → reviewer iteration | ✅ Built |
| **SEO Audit Skill** | 1, 4 | Technical SEO + on-page analysis | ✅ Skill installed |
| **Keyword Research Tool** | 1 | Search volume, difficulty, opportunities | ❌ Needed (Task #442) |
| **Google Search Console** | 1, 9 | Query data, ranking gaps, performance | ❌ Need access |
| **PostHog** | 9 | Content performance analytics | ❌ Need access |
| **Google Scholar** | 3 | Academic papers and research | ✅ Available via web_search |

---

## Skills Used

| Skill | Phase | Purpose |
|-------|-------|---------|
| `blog-writing` | 1, 4, 5, 6 | Core workflow — ideation, outline, brief, writing |
| `blog-post-optimizer` | 6, 7 | SEO scoring, meta tag generation, readability, QA |
| `seo-audit` | 1, 4 | On-page SEO analysis, structure validation |
| `perplexity-research` | 3 | Deep web research with source citations |
| `brainstorming` | 1 | Structured ideation for topic candidates |
| **Research Skill** | 3 | Dedicated deep-source mining — ❌ Evaluate if needed or extend `perplexity-research` |
| **Topic Ideation Skill** | 1 | Keyword research + topic generation — ❌ To be built or found (Task #441) |

---

## Context System Integration

The Content Context System (Task #159) is central to this process. Five context files feed into multiple phases:

| Context File | Used In | Purpose |
|-------------|---------|---------|
| `content-pillars.md` | Phases 1, 3, 4, 5, 6 | Brand voice, positioning, pillar alignment |
| `topic-clusters.md` | Phase 1 | Dedup check, cluster gap analysis |
| `audience-content-map.md` | Phases 1, 3, 5 | Persona targeting, pain point alignment |
| `content-calendar-framework.md` | Phases 1, 2 | Timing, cadence, editorial planning |
| `content-types.md` | Phase 4 | Format selection, structure guidelines |

**Context maintenance:** These files should be updated after each published post (Phase 9, Step 6) to keep the dedup check and topic clusters current. See `deliverables/context-maintenance-process.md` for the maintenance schedule.

---

## Key Principles

1. **Differentiation first.** Every post must add something new — a fresh angle, original framework, or insight not already on the blog. If we can't articulate what's new, we don't write it.
2. **Research depth matters.** The top 10 Google results are the floor, not the ceiling. Go deeper — academic papers, industry reports, expert POVs, contrarian takes. If the research only surfaces what everyone already knows, the post isn't ready.
3. **Align before writing.** No draft should be a surprise. Mike approves the topic and angle upfront.
4. **Structure is strategy.** The outline isn't a formality — it's where we decide how to present the argument for maximum clarity, SEO, and AI discoverability.
5. **Context-driven.** Every phase loads relevant context files. The system gets smarter as context is maintained.
6. **Tool-assisted.** Use keyword data and analytics to inform decisions, not just intuition.
7. **Voice consistency.** The SlideHeroes voice is Mike's voice — direct, opinionated, practical.
8. **Quality over quantity.** One excellent post beats three mediocre ones.

---

## Open Items

- [ ] **#441** — Add topic ideation + dedup step to blog-writing skill (Phase 1)
- [ ] **#442** — Evaluate and set up keyword research tool (Phase 1)
- [ ] **#443** — Build research template/skill for 3-layer process (Phase 3)
- [ ] **#444** — Auto-generate content brief from research output (Phase 4)
- [ ] **#445** — Update blog-writing skill: outline template + AEO best practices (Phase 5)
- [ ] **#446** — Automate pre-publish QA checks (Phase 7)
- [ ] **#447** — Set up Google Search Console API access (Phases 1, 9)
- [ ] Set up PostHog API access for Sophie (Phase 9)
- [ ] Define content performance tracking process (separate SOP?)

---

## Revision History

| Date | Change |
|------|--------|
| 2026-02-11 | Initial draft based on Sophie Loop production test feedback |
| 2026-02-11 | v2: Added context system integration, tools matrix, skills mapping, keyword research task |
| 2026-02-11 | v3: Split Strategy & Outline into Research (Phase 3) + Outline (Phase 4). Added 3-layer research process, blog post structure best practices (clarity + SEO + AEO), outline template |
| 2026-02-11 | v4: Added Content Brief + Pre-Publish QA Checklist. Reordered: Brief (Phase 4) before Outline (Phase 5). Now 9 phases. |
| 2026-02-11 | v5: Added MC Content Pipeline tracking instructions — how to create, track, and advance blog posts through phases on the `/content` tab. |
| 2026-02-12 | v6: Pillar-driven ideation (pillar-first approach, 6 pillars listed, primary pillar required per topic). Added Tent Pole Research quarterly planning section between Phase 1 and Phase 2. Community source mining added to ideation steps. |
