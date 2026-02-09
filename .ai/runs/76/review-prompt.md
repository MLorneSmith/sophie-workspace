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

# Context: messaging/positioning.md

# SlideHeroes Positioning

**Last Updated:** 2026-02-08
**Owner:** Mike
**Used By:** all content workflows

---

## Summary

SlideHeroes is the McKinsey of presentation training — rigorous methodology for business professionals who need to communicate complex ideas to executives and decision-makers. Evolving from course to AI-powered platform.

## Positioning Statement

**For** corporate professionals, consultants, and entrepreneurs  
**Who** need to create compelling business presentations for executive audiences  
**SlideHeroes is** presentation methodology training (and soon, an AI-powered creation platform)  
**That** teaches McKinsey-style structured communication  
**Unlike** public speaking courses, design tools, or AI template generators  
**We** focus on the substance, structure, and argument quality of sit-down business presentations.

## Category

**Primary:** Professional skills training (presentations) → evolving to AI-powered presentation creation  
**Adjacent:** Business communication, consulting skills, executive presence  
**NOT in:** Public speaking, graphic design, general productivity tools

## Market Opportunity

### Why Now
1. **AI is democratizing creation, but not quality** — Anyone can generate slides with AI. Few can generate *good* slides. The thinking gap is widening.
2. **Remote/hybrid work increased presentation frequency** — More decisions happen via deck, fewer via in-person conversation. Stakes are higher.
3. **Consulting methodology has always been gated** — Only people who worked at McKinsey/BCG/Bain learned this. We're making it accessible.
4. **Existing tools miss the point** — Canva, Gamma, Tome optimize for speed and design. Nobody optimizes for argument quality.

### Market Gaps We Fill
| Gap | Who Has It | Our Solution |
|-----|-----------|-------------|
| "Tips don't work for boardroom decks" | Solo consultants, corporate professionals | Consulting methodology training |
| "My team's deliverables are inconsistent" | Boutique consultancies | Standardized methodology + training |
| "AI decks look generic and unfocused" | Anyone using AI for presentations | Methodology-informed AI generation |
| "I wasn't trained for executive presentations" | Corporate mid-career professionals | Structured learning path |

## Competitive Landscape

### Direct Competitors
| Competitor | Their Focus | Our Differentiation | Their Strength |
|------------|-------------|---------------------|----------------|
| **Toastmasters** | Public speaking practice | We're about structure, not stage presence | Strong community, brand recognition |
| **Duarte** | Design-forward presentations | We're methodology-first, design second | Beautiful visual content, strong brand |
| **Beautiful.ai** | AI design tools | We teach thinking, not just formatting | Slick product, ease of use |
| **Canva** | Easy design for everyone | We're not a tool, we're methodology + tools | Massive market reach, freemium model |
| **Gamma** | AI-powered presentation creation | We embed consulting methodology, not just templates | First-mover in AI presentations |
| **Tome** | AI storytelling for presentations | We focus on business rigor, not storytelling | Strong brand, VC-backed |
| **Generic "presentation tips"** | Surface-level advice | We go deep on consulting methodology | SEO volume, easy consumption |

### Indirect Competitors
- **Books** (Minto, Tufte, Duarte) — Great theory, but no application support
- **YouTube tutorials** — Free, but shallow and delivery-focused
- **Corporate L&D programs** — Expensive, inconsistent quality
- **MBA communication courses** — Academic, limited practical application
- **Freelance presentation designers** — They do it FOR you, we teach you to do it YOURSELF

### Competitive Moats
1. **Methodology depth** — Most competitors don't have a coherent framework. We have 5S, SCQ, MECE.
2. **Institutional validation** — Seneca College, US DoE. Hard to replicate.
3. **Practitioner credibility** — Mike's background is real and relevant.
4. **Content library** — Years of blog content teaching the methodology (SEO value).
5. **AI + methodology combination** — Nobody else is combining consulting methodology with AI creation tools.

## Key Differentiators

*(Detailed in `company/differentiators.md`)*

### 1. Sit-Down Focus
We teach boardroom presentations, not keynotes. This is a fundamentally different skill.

### 2. Consulting Methodology
Our approach comes from the consulting world — McKinsey, BCG, Bain — not the speaking circuit.

### 3. Structure Over Style
We spend more time on argument structure than slide design. Pretty slides don't save bad thinking.

### 4. Practical Frameworks
Everything we teach can be applied immediately. No theory without application.

### 5. AI + Methodology (Emerging)
Our AI tools don't just generate slides — they apply the same principles DDM teaches. Methodology-informed creation.

## Taglines & Hooks

**Primary Tagline:** "Slay your presentation audiences"  
**Website Headline:** "High-Stakes Presentation Training"

**Alternate Hooks:**
- "McKinsey-style presentation training for professionals"
- "Business presentations that actually land"
- "The methodology behind world-class decks"
- "Stop presenting. Start convincing."
- "The presentation skills your MBA didn't teach"
- "Structure beats style. Every time."

## Positioning by Audience

### For Solo Consultants
"Deliverables that compete with Big 4 quality — at solo prices"

### For Corporate Professionals  
"The presentation skills that get you promoted"

### For Boutique Consultancies
"Consistent, executive-ready deliverables across your entire team"

### For Entrepreneurs
"Pitch decks that get meetings — and close deals"

## What We Stand Against

These are the contrarian positions that define us. Use them in content for differentiation and engagement:

- **TED-talk worship** — Boardrooms aren't stages. The skills that make you a great keynote speaker will get you fired in a strategy review.
- **Design-first thinking** — Pretty doesn't mean persuasive. A beautifully designed deck with a bad argument still loses.
- **Generic tips** — "Make eye contact" doesn't help you structure an argument. "Use fewer words" doesn't tell you WHICH words.
- **Presentation theater** — Business is not performance art. Your CFO doesn't want to be inspired. They want to be convinced.
- **AI magic thinking** — "Just let AI do it" produces fast garbage. Methodology + AI produces fast *quality*.

## The One-Liner Test

If someone asks "What does SlideHeroes do?":

**Short:** "We teach professionals how to create McKinsey-quality business presentations."

**Medium:** "We provide presentation methodology training for professionals who present to executives and decision-makers — the McKinsey-style, boardroom-first approach that most presentation advice completely ignores."

**Long:** "Most presentation advice is actually public speaking advice — how to stand on a stage and inspire. That's useless in a boardroom. SlideHeroes teaches the methodology that top consulting firms use to create compelling, structured, evidence-backed presentations. We're also building AI tools that embed this methodology into the creation process."


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

# Best-Practice Business Presentations: Research Analysis

Based on my research of publicly available business presentations from top consulting firms (McKinsey, BCG, Bain) and corporate strategy decks, here's my evaluation of 15 exemplary presentations:

---

## 1. McKinsey - Helping Global Health Partnerships to Increase Their Impact (2009)

**Source:** https://stoptb.org/assets/documents/about/cb/meetings/17/2.09-03%20Strengthening%20Performance%20Management%20in%20the%20Partnership/2.09-03.1%20Helping%20Global%20Health%20Partnerships%20to%20Increase%20their%20Impact.pdf

**What makes it great:**
- 54-page pre-read deck for a board meeting showing complete project structure
- Excellent example of dividing a project into relevant phases
- Demonstrates detailed findings for different areas with next steps for each
- **Specific technique:** Executive summary approach for stakeholder alignment

**Evaluation:**
- Storytelling: ★★★★★ - Clear narrative arc from problem to solution
- Logical structure: ★★★★★ - Systematic presentation of findings and recommendations
- Data visualization: ★★★★ - Functional charts supporting key points
- Design quality: ★★★★ - Clean, professional consulting style
- Persuasiveness: ★★★★★ - Actionable recommendations with clear timelines

## 2. McKinsey - USPS: Future Business Model (2010)

**Source:** https://about.usps.com/future-postal-service/mckinsey-usps-future-bus-model2.pdf

**What makes it great:**
- 39-page strategy document with coherent storyline
- Describes base case context and potential change levers
- **Specific technique:** "Base case vs. transformation" comparison framework

**Evaluation:**
- Storytelling: ★★★★★ - Strong "situation → complication → resolution" narrative
- Logical structure: ★★★★★ - Flows from context to options to recommendations
- Data visualization: ★★★★★ - Clear charts showing financial models
- Persuasiveness: ★★★★★ - Data-backed recommendations for government stakeholders

## 3. McKinsey - Capturing the Full Electricity Efficiency Potential of the U.K. (2012)

**Source:** https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/65626/7035-capturing-full-elec-eff-potential-edr.pdf

**What makes it great:**
- 61-page main deck + 68-page appendix
- Complete end-to-end storyline: baseline → efficiency measures → barriers → prioritization
- **Specific technique:** Systematic presentation of efficiency measures with ROI calculations

## 4. McKinsey - Five Keys to Marketing's "New Golden Age" (2017)

**Source:** https://www.slideshare.net/McKinseyCompany/five-keys-to-marketings-new-golden-age-from-mckinseys-marketing-sales-practice

**What makes it great:**
- 26-page visual presentation using mainly images, icons, and graphics
- Five main levers: Science, Substance, Story, Speed, Simplicity
- **Specific technique:** Five-framework structure with visual metaphors

**SlideHeroes Lesson:** Masterclass in visual storytelling—using light, image-driven slides to create emotional resonance while still conveying hard data.

## 5. McKinsey - Digital Luxury Experience (2017)

**Source:** https://altagamma.it/media/source/20170525_DLE%202017_Shareablepres_1.pdf

**What makes it great:**
- 24-page support deck for luxury industry presentation
- Three areas of change for luxury industry
- **Specific technique:** Luxury-focused data presentation with minimalist design

## 6. McKinsey - Refueling the Innovation Engine in Vaccines (2016)

**Source:** Available via HHS.gov

**What makes it great:**
- 40-page discussion document for NVAC
- Balances data-heavy slides with verbal/abstract slides
- **Specific technique:** Data-visualization alternation with concept slides

**SlideHeroes Lesson:** Demonstrates the "rhythm" technique—alternating between data-heavy and concept slides to maintain audience attention.

## 7. McKinsey - The Future of the Finance Function (2019)

**Source:** https://www.alexanderjarvis.com/mckinsey-the-future-of-the-finance-function-experiences-from-the-u-s-public-sector/

**What makes it great:**
- 14-page deck for government finance function conference
- Five ways to move from transaction to value management
- **Specific technique:** Maturity model presentation with data support

## 8. BCG - The Innovation Bottom Line (2013)

**Source:** https://www.slideshare.net/TheBostonConsultingGroup/the-innovation-bottom-line-presentation

**What makes it great:**
- Demonstrates business case for sustainability initiatives
- Links innovation to financial performance
- **Specific technique:** Business case storytelling with financial metrics

**SlideHeroes Lesson:** Shows how to build a financial case for initiatives that might otherwise be seen as "soft."

## 9. BCG - Smart Cities (2014)

**Source:** https://www.slideshare.net/TheBostonConsultingGroup/smart-cities-35846005

**What makes it great:**
- Framework for city development strategy with case studies
- **Specific technique:** City-specific framework application

## 10. BCG - The Electric Car Tipping Point (2017)

**Source:** https://www.slideshare.net/TheBostonConsultingGroup/the-electric-car-tipping-point-81666290

**What makes it great:**
- "Tipping point" framework creates urgency and timeline
- **Specific technique:** S-curve adoption framework

**SlideHeroes Lesson:** Demonstrates the "tipping point" narrative technique—using adoption curves to create urgency around emerging technologies.

## 11. McKinsey - Using AI to Prevent Healthcare Errors (2017)

**Source:** https://www.bundesgesundheitsministerium.de/fileadmin/Dateien/3_Downloads/P/Patientensicherheit/WS3-2017/01_WS3_Henke_20170328_Using_AI_to_prevent_healthcare_errors_from_occuring.pdf

**What makes it great:**
- 25-page dense deck on AI/ML in healthcare
- Creates one-pagers on specific use cases
- **Specific technique:** Use case quantification with impact summaries

**SlideHeroes Lesson:** Shows how to present complex technical topics—using one-page use case summaries and quantification.

## 12. McKinsey - Women in the Workplace (2022)

**Source:** https://www.slideshare.net/McKinseyCompany/2022-women-in-the-workplace-briefing-254242515

**What makes it great:**
- Long-running research series with updated data
- **Specific technique:** Benchmarking with year-over-year trend lines

**SlideHeroes Lesson:** Masterclass in presenting research findings—using benchmarking and clear data visualization.

## 13. McKinsey - Moving Laggards to Early Adopters (2018)

**Source:** https://polytechnic.purdue.edu/sites/default/files/files/Krish%20-%20Moving%20Laggards%20to%20Early%20Adopters%2C%20NcKinsey%20%26%20Co.pdf

**What makes it great:**
- 18-page deck on digitalization in manufacturing
- **Specific technique:** Innovation adoption curve positioning

## 14. BCG - The Great Mobility Tech Race (2018)

**Source:** https://www.slideshare.net/slideshow/the-great-mobility-tech-race-winning-the-battle-for-future-profits/86039492

**What makes it great:**
- "Race" metaphor creates competitive urgency
- **Specific technique:** Competitive race framework

**SlideHeroes Lesson:** Demonstrates competitive urgency storytelling—using "race" metaphors to create urgency.

## 15. McKinsey - Jobs Lost, Jobs Gained (2017)

**Source:** https://www.alexanderjarvis.com/mckinsey-jobs-lost-jobs-gained-workforce-transitions-in-time-of-automation/

**What makes it great:**
- 16-page deck on automation and job transitions
- **Specific technique:** Historical vs. future comparison

**SlideHeroes Lesson:** Shows how to present controversial or sensitive topics—balancing opportunities and challenges with data.

---

# Cross-Analysis: Key Techniques

1. **Action Titles as Takeaways** - Slide titles state the main point
2. **SCQA Framework** - Situation → Complication → Question → Answer
3. **Data-Driven Decision Making** - Every recommendation supported by data
4. **Visual Hierarchy** - One main point per slide
5. **Appendices for Details** - Main deck stays focused
6. **Executive Summaries** - Complete story in condensed form
7. **Framework-Based Problem Solving** - McKinsey 7S, BCG Matrix, etc.
8. **Consistent Design Language** - Color, typography, visual elements
9. **Context Before Content** - "Why" before "what"
10. **Quantified Recommendations** - Specific, measurable actions

# Presentation Styles

- **Data-Heavy Analysis** (UK Electricity, Jobs Lost) - 60+ pages, extensive appendices
- **Executive Presentation** (USPS, Women in Workplace) - 15-40 pages, key messages
- **Visual Storytelling** (Five Keys, Digital Luxury) - Image/icon-driven, minimal text
- **Workshop/Interactive** (Vaccines, AI Healthcare) - Mix of data and concept slides

---

# Review Criteria
- Are sources credible and recent?
- Are facts clearly distinguished from opinions/speculation?
- Is the synthesis actionable (not just a data dump)?
- Does it answer the original research question?
- Are gaps and uncertainties explicitly noted?
- Is the formatting clear and scannable?

---

# Required Output
Return either PASS or FAIL as specified in your system prompt.
