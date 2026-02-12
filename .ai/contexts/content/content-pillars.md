# Content Pillars

**Last Updated:** 2026-02-12
**Owner:** Mike
**Used By:** content-strategy, blog-strategy, blog-ideate, social-content, email-campaign

---

## Summary

Six content pillars anchor all SlideHeroes content. Each pillar has a distinct purpose, audience appeal, and production cadence. Every blog post must map to one primary pillar (and optionally a secondary). The pillars are ordered by expected frequency.

---

## Pillar 1: How-To Guides (Methodology & Skills)

**What it is:** Comprehensive, educational guides on presentation development — design, data visualization, structure, storytelling, charts, arguments. This is the core of our SEO strategy and authority play.

**Why it matters:**
- Highest search volume — people Google "how to" questions constantly
- Establishes deep expertise and authority
- Long-tail SEO value through comprehensive coverage
- Fuels our methodology-informed AI product

**Key topics:**
- Structure: Organizing arguments, pyramid principle, MECE, SCQ framework
- Design: Slide layout, visual hierarchy, headlines as assertions
- Data Visualization: Charts, graphs, tables — when to use what
- Storytelling: Executive summaries, narrative arc, persuasion
- Delivery: Sit-down presentation skills (not TED talk advice)

**Content examples:**
- "How to Structure a 40-Page Strategy Deck (Pyramid Principle Guide)"
- "Business Charts: When to Use What (The Complete Guide)"
- "MECE Framework for Presentations: A Practical Walkthrough"

**Cadence:** 2-3 per month (highest volume)

---

## Pillar 2: Presentation Surgery

**What it is:** Detailed analysis and teardown of real presentations — consulting decks, corporate presentations, earnings reports. Shows methodology in action on real examples. This is SlideHeroes' signature content.

**Why it matters:**
- Builds massive credibility — we're not just teaching, we're demonstrating
- Highly shareable — people love before/after and expert critique
- Makes abstract methodology concrete and memorable
- Differentiates us from every other presentation blog

**Key topics:**
- Consulting firm deck teardowns (BCG, McKinsey, Bain, etc.)
- Corporate presentation analysis (earnings calls, board decks)
- Before/after transformations of real slides
- "What works and what doesn't" in specific decks

**Source material:** Presentation Library system (internal-tools API: `/api/presentations`). Automated sourcing pipeline discovers, downloads, scores, and stores decks to Cloudflare R2. Best candidates (quality score ≥7) become Surgery posts.

**Production notes:**
- Higher effort per post — requires sourcing a good deck, detailed analysis, screenshots/annotations
- Need to build efficiency: templatized analysis framework, reusable scoring rubric
- Consider a "Surgery Score Card" format for consistency

**Content examples:**
- "Presentation Surgery: How BCG Structures a Strategy Recommendation"
- "Presentation Surgery: What Goldman Sachs Gets Right (and Wrong) in Earnings Decks"
- "Presentation Surgery: A Real Consultant Pitch Deck — The Good, The Bad, The Fixable"

**Cadence:** 1-2 per month (higher effort, higher impact)

---

## Pillar 3: SlideHeroes Product Spotlight

**What it is:** Content at the intersection of AI and professional presentations, anchored around SlideHeroes specifically. How AI is changing the game, what it gets right and wrong, and how SlideHeroes uniquely combines methodology with AI. This is our product-positioning pillar.

**Why it matters:**
- Growing search category — AI presentation queries increasing rapidly
- Directly supports app positioning and product awareness
- Thought leadership in "AI for professional communications"
- Differentiates us from generic AI tools (methodology + AI, not just AI)

**Key topics:**
- Why AI generation without methodology produces fast garbage
- How consulting methodology makes AI output dramatically better
- Review/comparison of AI presentation tools (featuring SlideHeroes)
- The thinking gap AI creates — and how to close it
- Practical AI workflows for presentations (with quality guardrails)
- The future of presentations in an AI-native world

**Content examples:**
- "AI Presentation Tools Compared: Which Ones Actually Produce Board-Ready Decks?"
- "Why Your AI-Generated Presentations Look Generic (And How to Fix It)"
- "McKinsey Methodology + AI = The Future of Business Presentations"

**Cadence:** 1-2 per month

---

## Pillar 4: Founder Journey (Building SlideHeroes)

**What it is:** Authentic, personal content about building SlideHeroes as a solopreneur. The journey from course to AI-powered SaaS. Decisions, lessons, wins, struggles.

**Why it matters:**
- A portion of our ICP (consultants) are themselves solopreneurs — this resonates
- Builds trust and personal connection that no competitor can replicate
- Humanizes the brand — people buy from people they relate to
- Creates content that's impossible to commoditize (our story is unique)

**Tone:** Authentic. Not polished corporate, not raw unfiltered — somewhere in between. Honest about challenges, thoughtful about lessons, generous with insights. The reader should feel like they're getting real talk from someone who's been through it.

**Key topics:**
- The pivot from course to AI-powered app
- Building an AI product as a non-technical founder
- Decisions and trade-offs in early-stage SaaS
- What I've learned about content marketing, product development, GTM
- The solopreneur toolkit — tools, processes, AI assistants (meta!)

**Content examples:**
- "Why I'm Rebuilding SlideHeroes from a Course into an AI App"
- "What I Learned Launching to My First 50 Beta Users"
- "The Solopreneur's Dilemma: Build vs. Ship"

**Cadence:** 1 per month (personal, can't be mass-produced)

---

## Pillar 5: ICP Intelligence (What Our Audience Cares About)

**What it is:** Content informed by research into what our ICP (consultants, corporate professionals) actually reads, discusses, and struggles with. This pillar is research-driven — topics emerge from community mining, competitor analysis, and audience signals.

**Why it matters:**
- Ensures we're writing what the audience wants, not what we assume they want
- Surfaces topics we'd never think of from inside our own bubble
- Can produce unexpected viral content (topics with existing community energy)

**Research sources:**
- Reddit: r/consulting, r/powerpoint, r/dataisbeautiful
- LinkedIn: presentation and consulting discussions
- Competitor blogs: what's performing well for Beautiful.ai, Gamma, Tome
- Google Search Console: queries with high impressions but low CTR
- Community questions: Quora, Stack Exchange, industry forums

**Production notes:**
- Topics here emerge from research, not from our existing content strategy
- Each post should cite the community insight that sparked it
- This pillar feeds the others — a community insight might become a How-To or Surgery

**Cadence:** 1 per month, or as research surfaces strong candidates

---

## Pillar Distribution (Target Monthly Mix)

| Pillar | Posts/Month | Share |
|--------|-------------|-------|
| How-To Guides | 2-3 | ~40% |
| Presentation Surgery | 1-2 | ~20% |
| SlideHeroes Product Spotlight | 1-2 | ~15% |
| Workflows, Productivity & AI | 1-2 | ~15% |
| Founder Journey | 1 | ~10% |
| ICP Intelligence | 1 | ~5% |
| **Total** | **8-12** | 100% |

**Plus:** 1 Tent Pole Research piece per quarter (3-4/year), planned separately.

---

## Pillar 6: Workflows, Productivity & AI

**What it is:** Practical content about presentation workflows, productivity techniques, and how AI tools fit into real work processes. Bridges the gap between methodology knowledge and daily execution — how to actually get things done faster and better.

**Why it matters:**
- High search demand — professionals constantly seek efficiency gains
- Natural product integration — SlideHeroes workflows as examples without being salesy
- Covers the "AI in practice" angle that Product Spotlight doesn't (tool-agnostic, workflow-focused)
- Appeals to time-pressed consultants and professionals who value speed + quality

**Key topics:**
- Presentation workflows: from brief to final deck, efficient review cycles
- AI-assisted workflows: prompt engineering for presentations, human + AI collaboration patterns
- Tool stacks: what tools work together, integration tips
- Productivity frameworks applied to presentation work
- Templates, checklists, and repeatable processes
- Time management for high-stakes deliverables

**Content examples:**
- "The 90-Minute Strategy Deck: A Step-by-Step Workflow"
- "How I Use AI to Cut Presentation Prep Time in Half (Without Cutting Quality)"
- "The Consultant's Presentation Toolkit: 7 Tools That Actually Work Together"
- "Stop Starting from Scratch: A Template System for Recurring Presentations"

**Cadence:** 1-2 per month

---

## Tent Pole Research (Quarterly)

**What it is:** Original, data-driven research pieces published quarterly. These are high-effort, high-impact assets that anchor an entire quarter's content — surrounding blog posts, social, email, and outreach all reference back to the tent pole.

**Why it matters:**
- Original research attracts backlinks and media citations that no regular blog post can
- Positions SlideHeroes as a primary source, not a secondary commentator
- Creates a "gravity well" — pulls in links, social shares, email signups
- Each piece generates 8-12 derivative content assets (social snippets, email series, infographics)

**Production reality:** These take 3-4 weeks each and require real data gathering (surveys, dataset analysis, product usage data, public filing analysis). 3-4 per year is the sustainable cadence.

**Quarterly theme examples (illustrative — pick based on available data):**
- **Q1:** State of AI in Business Presentations (survey consultants + analyze tool landscape)
- **Q2:** Consultant Presentation Benchmarks (deck length, chart usage, structure patterns from Surgery library)
- **Q3:** Presentation Win Rates — What Actually Correlates with Client Wins (if we can gather data)
- **Q4:** Year-End Trends & Predictions for Professional Communications

**How tent poles feed the content engine:**
1. **Pre-launch:** Teaser posts, methodology posts, "what we're researching" founder journey
2. **Launch week:** Full report + summary blog post + social campaign + email blast
3. **Post-launch (4-8 weeks):** Derivative posts exploring specific findings, Surgery posts using the data, How-To posts applying the insights

**Success metrics:**
- Backlinks acquired (target: 20+ per piece)
- Email signups from gated full report
- Social shares and mentions
- Derivative content produced (target: 8-12 pieces per tent pole)

**Cadence:** 3-4 per year (quarterly), planned one quarter ahead

---

## Cross-Pillar Integration

Strongest content connects multiple pillars:

| Combination | Example |
|-------------|---------|
| How-To + Surgery | "How to Fix the 3 Most Common Chart Mistakes (With Real Examples)" |
| Spotlight + How-To | "How to Use AI to Build a Consulting-Quality Strategy Deck" |
| Surgery + Spotlight | "I Fed a Real BCG Deck to 5 AI Tools. Here's What Happened." |
| Founder + Spotlight | "I Built an AI Presentation Tool. Here's What Surprised Me." |
| Workflow + How-To | "The 5-Step Workflow for Turning Research into a Strategy Deck" |
| Workflow + Spotlight | "How SlideHeroes Fits Into Your Existing Presentation Workflow" |
| ICP + How-To | "Reddit's Most-Asked Presentation Questions, Answered by an Expert" |

---

## Content Voice (All Pillars)

**Core voice attributes:**
- **Authentic** — real opinions, real experiences, not corporate-speak
- **Direct** — say what we mean, no hedging or filler
- **Opinionated** — we have a point of view and we defend it
- **Generous** — share the good stuff freely, don't gate basic knowledge
- **Practical** — every post should leave the reader with something actionable

**Anti-patterns (never do this):**
- "In today's fast-paced business environment..."
- "It's important to note that..."
- Generic listicles with no depth
- Content that could have been written by anyone about anything
- Filler to hit word count — every paragraph should earn its place

---

## Anti-Pillars: What We DON'T Write About

| Topic | Why | Exception |
|-------|-----|-----------|
| Public speaking / stage fright | Wrong skill set — we're about document creation | Contrast with sit-down focus (rarely) |
| PowerPoint button-by-button tutorials | Tool-specific, not methodology-focused | When demonstrating a specific technique |
| Design-only content (colors, fonts) | Design without structure = pretty mediocrity | When design supports communication |
| Generic productivity tips | Too broad, undifferentiated | Presentation-specific workflows only |
| Motivation / mindset | Not our lane | In founder journey (rarely) |

---

*Aligns with: `messaging/positioning.md`, `voice/brand-voice.md`, `company/about.md`*
