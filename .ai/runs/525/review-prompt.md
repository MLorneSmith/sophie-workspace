        # Reviewer System Prompt

You are a senior quality reviewer for SlideHeroes. Your job is to evaluate
work produced by other agents before it reaches Mike for final approval.

You are the last line of defense. Be rigorous but fair.

For every review:
1. Load the same context files the builder used
2. Read the builder's output completely
3. Evaluate against the review criteria provided
4. Check for brand voice consistency (authoritative, approachable, opinionated)
5. Check for banned vocabulary and generic AI language
6. Verify factual claims where possible

Your output MUST be one of:
- **PASS** — with a brief summary of what's good and any minor notes
- **FAIL** — with specific, actionable feedback the builder can use to fix it

Never be vague. "Needs improvement" is useless. Say exactly what's wrong
and what "good" looks like.

Common failure reasons:
- Tone drift (too academic, too casual, too corporate)
- Generic advice that could apply to any product
- Missing persona specificity
- Weak hooks or buried CTAs
- Factual errors or unsupported claims
- Banned vocabulary usage

---

# Context Bundle (same as builder)

---

# Context: company/about.md

# SlideHeroes - Company Overview

**Last Updated:** 2026-02-08
**Owner:** Mike
**Used By:** all content workflows

---

## Summary

SlideHeroes teaches professionals how to create compelling McKinsey-style business presentations — and is building AI-powered tools to apply that methodology at scale. We focus on sit-down presentations around a boardroom table — not auditorium-style speeches.

## Company Direction

SlideHeroes is pivoting from a course-only business to an **AI-powered SaaS platform** for creating McKinsey-quality business presentations. The existing DDM course remains a cornerstone — it teaches the methodology. The SaaS product will embed that methodology into the creation process.

*(For product details, see `company/products.md`. For roadmap, see `company/roadmap.md`.)*

## Philosophy

We believe presentation writing skills are under-rated. They can have a profound effect on your career success.

The ability to write clear and impactful PowerPoint presentations is, for young and mid-level professionals, **one of the most valuable skills you can master**:

- PowerPoint/Keynote is the de facto paradigm for internal corporate communication today
- The ability to present ideas compellingly can be a key differentiator (frankly, many people are simply not very good at it)
- Strong communication skills make professionals more effective — they save time otherwise spent resolving miscommunication

**The problem:** Unless a professional lucks out early in their career and learns the craft from someone exceptional, their presentation skills are probably pretty poor.

SlideHeroes seeks to change that.

## Our Focus

### 1. Sit-down business presentations (not auditorium-style speeches)
The vast majority of business presentations are not made standing up in front of a crowd. They're made sitting down, around a table, updating a project team or presenting thinking/ideas/recommendations to the boss.

### 2. Creation of content (story, structure, logic, data) — not just delivery
The success of sit-down presentations relies on the clarity, crispness, and punch of the content on the page. Learning to *create*, not just *deliver*, is critical.

### 3. Mastery of a broad set of skills, not just one
Becoming exceptional at crafting board-level presentations is tough. It's a multi-disciplinary challenge requiring mastery of a SET of distinct skills:

- **The Art of Storytelling**
- **The Power of Logical Structure**  
- **The Science of Fact-based Persuasion**
- **The Harmony of Design**
- **The Drama of Performance**

## The SlideHeroes Difference

**What we're NOT:**
- TED-talk style presentation coaching
- Public speaking courses  
- Design-first tools (Canva, Beautiful.ai)
- Generic 'presentation tips' content

**What we ARE:**
- McKinsey presentation methodology
- Barbara Minto's Pyramid Principle applied
- Edward Tufte's data visualization philosophy
- Consulting firm training — without the consulting firm
- Building AI tools that embed this methodology into the creation process

*(For detailed competitive differentiation, see `company/differentiators.md`.)*

## Core Belief

> "Business presentations are NOT speeches. 'Sit-down' McKinsey-style business presentations around a board table are fundamentally different from public speaking and require a completely different approach to communication."

Most 'presentation tips' are actually speech tips — and they'll get you fired in a boardroom.

## Founder

**Mike** — The methodology behind SlideHeroes comes from decades at the intersection of strategy consulting and corporate leadership:

- **Mastercard** — Senior leader in Cyber & Intelligence Solutions / Enterprise Risk & Security. Deep expertise in payments, fraud/cybersecurity, identity/biometrics, strategy, M&A, standards, and device/application ecosystems.
- **Mastercard Advisors** — Payments consulting practice.
- **Lloyds Banking Group** — Strategy consulting.
- **Oliver Wyman** — Strategy consulting.
- **IBM** — Early career in direct marketing.
- **London Business School** — MBA (Strategy & Finance).
- **University of British Columbia** — B.Comm.

This background matters because Mike didn't learn presentations from books — he learned them by building hundreds of board-level decks for C-suite audiences across financial services, consulting, and technology. The methodology he teaches is what he *used*, not what he *read about*.

## Social Proof

**Institutional Partnerships:**
- **Seneca College** — Canada's largest community college. DDM is core curriculum in their business programs. This is institutional adoption, not a one-off workshop.
- **US Department of Energy** — Government professionals trained using our methodology.

**Customer Results:**
- Hundreds of satisfied customers across consulting, corporate, and entrepreneurial contexts
- Taught at major educational institutions
- Used by professionals who present to boards, C-suites, and investors regularly

**Why Partnerships Matter:**
Seneca didn't adopt DDM as a favor — they evaluated it against alternatives and chose it for their students. The DoE partnership demonstrates applicability beyond private sector. These are credibility markers that most competitors can't match.

## Company Details

- **Website:** https://www.slideheroes.com
- **Tagline:** "Slay your presentation audiences" *(alternate: "High-Stakes Presentation Training")*
- **Location:** Toronto, Canada
- **Stage:** Bootstrapped, pivoting from course to SaaS
- **Team:** Mike (founder) + Sophie (AI assistant/operations)


---

# Context: company/products.md

# SlideHeroes Products

**Last Updated:** 2026-02-08
**Owner:** Mike
**Used By:** email-campaign, outbound-sequence, blog-strategy, product comms

---

## Summary

SlideHeroes' current flagship is **Decks for Decision Makers (DDM)** — an online video course teaching McKinsey-style business presentation skills. An AI-powered SaaS platform is in development.

---

## Flagship Product: Decks for Decision Makers (DDM)

### What It Is
An online video course that teaches professionals how to create compelling sit-down business presentations using consulting methodology.

### Format
- 20 comprehensive video lessons
- 4+ hours of structured video training
- 20 detailed unit outlines with slides
- Free PowerPoint template (1,000+ professionally designed slides)
- Certification (shareable on LinkedIn)
- Instant access, available 24/7
- 30-day money-back guarantee

### The 5S Framework

The course teaches the **5S Framework** — a comprehensive methodology covering every dimension of presentation excellence:

| Element | Description | Key Lesson |
|---------|-------------|------------|
| **Structure** | The backbone of clear communication — organizing your argument | "Answer a question, don't present a topic" |
| **Story** | The power of narrative to engage and persuade | Use SCQ (Situation, Complication, Question) for introductions |
| **Substance** | Evidence, data, and facts that demonstrate your points | "Demonstrate, don't simply assert" |
| **Style** | Visual design that enhances rather than distracts | "Headlines should be assertions, not labels" |
| **Self-Confidence** | Presence and delivery when presenting | "If your meeting is important enough for a presentation, it's important enough for a GREAT one" |

### Key Concepts Taught

1. **"Answer a question, don't present a topic"** — Rather than presenting about "Customer Relationship Management Software," answer the question "Our CRM software is old — does it need to be replaced?"

2. **"Demonstrate, don't assert"** — Use data, facts, and compelling logic. The "because I say so" argument doesn't work in boardrooms.

3. **Barbara Minto's SCQ Framework** — Situation, Complication, Question for structuring introductions that grip the audience immediately.

4. **MECE Principle** — Mutually Exclusive, Collectively Exhaustive. Limit lists to no more than 5 items. If more, bucket them one level of abstraction higher.

5. **Headlines as assertions** — Not "Q3 Revenue" but "Q3 Revenue exceeded forecast by 12%." Labels are lazy. Assertions show you've done the thinking.

6. **Data visualization discipline** — Match chart type to data relationship. Don't use pie charts. Ensure the data visually proves the headline's claim.

7. **"McKinsey-style"** — Shorthand for structured, evidence-based, executive-ready presentations.

### Pricing

*(Current pricing tiers TBD by Mike)*

### Differentiator

> Most presentation advice focuses on PUBLIC SPEAKING (TED talks, keynotes, stage performances). SlideHeroes focuses on SIT-DOWN BUSINESS PRESENTATIONS — the McKinsey-style decks you present around a boardroom table. These require a fundamentally different approach.

---

## Team Training

Designed for boutique consultancies and corporate teams that need consistent deliverable quality:

- **Online learning model** takes 40-50% less employee time to learn concepts (vs. traditional workshops)
- **Proven methodology** ensures consistency across team — partner decks and associate decks match
- **Optional small group, live coaching** to receive feedback on real-world work
- **Scalable** — train new hires without partner time drain

**Positioning vs. alternatives:**
| Us | Big 4 Training | In-House |
|----|----------------|----------|
| ~$X per seat | $50K+ per workshop | Partner's time (most expensive resource) |
| Self-paced, always available | One-off event | Inconsistent, key-person dependent |
| Proven methodology | Varies by facilitator | Often tribal knowledge |

---

## Free Resources (Lead Generation)

These serve both as value-first marketing and as credibility builders:

- **Presentation Accelerator Kit** — Comprehensive collection of all resources we've ever made. Primary lead magnet.
- **Advanced Guide to Business Presentations** — eBook covering core methodology
- **PowerPoint Template** — 1,000+ professionally designed slides. High perceived value.
- **Blog articles** — Deep-dive content on specific presentation techniques. SEO-driven. Foundation of our methodology (give away the *what*, course teaches the *how*).
- **Presentation reviews** — Detailed teardowns of real consultancy decks (BCG, etc.) published on the blog. Demonstrates expertise.

**Content strategy:** Our free content is better than most competitors' paid content. This is intentional. Generosity builds trust and authority.

---

## AI-Powered SaaS Platform (In Development)

*(See `company/roadmap.md` for full details)*

The next evolution of SlideHeroes: an AI platform that embeds our methodology into the presentation creation process.

**Key difference from other AI tools:** Most AI presentation tools optimize for speed and visual polish. Ours will optimize for *argument quality* — structure, logic, evidence. The methodology DDM teaches, applied by AI.

---

## Product Landscape

| Product | Status | Revenue Model | Audience |
|---------|--------|---------------|----------|
| DDM Course | Live ✅ | One-time purchase | Individuals |
| Team Training | Live ✅ | Per-seat licensing | Consultancies, teams |
| Free Resources | Live ✅ | Lead gen (free) | All |
| AI SaaS Platform | In development 🔧 | Subscription (planned) | Individuals + teams |

---

## Anti-Patterns (What We DON'T Offer)

- One-on-one speech coaching (not our format)
- Design services — we teach, not do
- Public speaking anxiety therapy (not our domain)
- Keynote/TED talk preparation (different skill set entirely)
- "Make it pretty" template-only solutions (design without methodology)

---

## For Content Agents

When referencing products:
- **DDM** can be used after first introducing "Decks for Decision Makers"
- Always mention the **5S Framework** when describing the course
- Reference **free resources** generously — don't gatekeep
- The AI SaaS can be teased ("we're building tools") but don't over-promise features
- **Seneca College** and **US DoE** are the strongest proof points for course quality

---

# Builder Output To Review

Implemented Apollo CSV → BigQuery import tool in slideheroes-internal-tools.

Changes:
- Added API route: app/src/app/api/apollo/import/route.ts
  - Accepts multipart/form-data: file, dataset, table, skipLeadingRows, optional project
  - Validates dataset/table IDs, checks file size (<=50MB)
  - Writes uploaded file to /tmp and executes /home/ubuntu/clawd/scripts/import-apollo-csv-to-bigquery.sh
  - Returns JSON { ok, stdout, stderr, exitCode } with appropriate HTTP status
- Added UI page: app/src/app/apollo-import/page.tsx
  - Simple form for CSV upload + params
  - Shows stdout/stderr on completion
- Added link from /setup page to /apollo-import

Verification:
- npm run lint (warnings only)
- npm run typecheck (pass)
- Committed and pushed: feat: add Apollo CSV import UI (commit 0d8f78c)

---

# Review Criteria
- Does the code compile without type errors?
- Do lint checks pass?
- Does it follow existing project patterns and conventions?
- Are there appropriate error boundaries and loading states?
- Is the implementation complete relative to the issue spec?
- Are there any security concerns (exposed secrets, SQL injection, XSS)?

---

# Required Output
Return either PASS or FAIL as specified in your system prompt.
