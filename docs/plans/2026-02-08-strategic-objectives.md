# SlideHeroes Strategic Objectives

**Date:** 2026-02-08
**Status:** Draft — for Mike's review
**Author:** Sophie

---

## Overview

Seven strategic objectives covering the full scope of SlideHeroes work. Designed to be MECE — every initiative and task should fit cleanly under exactly one objective.

These objectives are organized from **core product outward** — starting with what we build, then how we reach people, then the systems that make it all work.

---

## The Seven Objectives

### 1. 🚀 Build the Product
**Develop and ship the SlideHeroes AI-powered SaaS platform.**

Everything related to the `2025slideheroes` codebase, product features, UX, infrastructure, and the pivot from course-only to AI-powered presentation tool. This is the core of the business.

**Scope includes:**
- AI presentation generation and editing features
- Alpha Orchestrator and spec implementation
- Dashboard, onboarding, user flows
- Template system and presentation library
- Product infrastructure (hosting, CI/CD, deployment)
- Pricing, packaging, product-market fit experiments

**Scope excludes:** Internal tools (→ #5), content (→ #3), marketing site (→ #2)

**Current MC board:** 🚀 Build Product

---

### 2. 📢 Grow the Audience
**Attract, engage, and convert the right people through content and marketing.**

Everything customer-facing that isn't the product itself — the blog, email marketing, social media, SEO, outbound, and any campaigns that bring people to SlideHeroes or nurture them toward purchase.

**Scope includes:**
- Blog posts, email sequences, social media content
- SEO strategy and optimization
- Outbound email campaigns
- Landing pages and conversion optimization
- Newsletter and subscriber growth
- Content calendar and cadence management
- Partnerships and co-marketing (Seneca, DoE, etc.)

**Scope excludes:** Content *system* tooling (→ #5), brand/positioning strategy (→ #4)

**Current MC boards:** ✍️ Create Content, 📰 Build Content System (the output side)

---

### 3. 🧠 Sharpen the Strategy
**Define and refine SlideHeroes' positioning, messaging, and strategic direction.**

The thinking work — who we are, who we serve, what we stand for, how we're positioned competitively. This is the context layer in human form: the strategy that informs everything else.

**Scope includes:**
- Market positioning and competitive analysis
- Persona development and validation
- Pricing strategy
- Product roadmap and prioritization decisions
- Brand voice and messaging framework
- Manifesto / POV development
- Financial planning and business model
- Best practices capture and synthesis (from #capture)

**Scope excludes:** Executing on strategy (→ other objectives), tool-building (→ #5)

---

### 4. 📚 Build the Knowledge Base
**Curate and maintain the information, examples, and research that fuel quality output.**

The raw material — presentation examples, competitive intelligence, industry research, customer insights, and the Context Foundation files. This is what makes our content and product decisions informed rather than guesswork.

**Scope includes:**
- Context Foundation (`~/.ai/contexts/`) — audit, expand, maintain
- Presentation examples discovery, evaluation, and storage
- Competitive research and monitoring
- Best practices database (Notion)
- Resources database (captured articles, videos, research)
- Customer feedback and insights
- Notion Second Brain maintenance

**Scope excludes:** Creating content from this knowledge (→ #2), strategic decisions derived from it (→ #3)

---

### 5. ⚙️ Build the Systems
**Create and improve the internal tools, workflows, and infrastructure that make everything else efficient.**

The meta-work — Mission Control, Sophie Loop, agent profiles, content pipelines, deployment infrastructure, monitoring, and automation. This is the machinery that lets a two-person team (one human, one AI) punch above its weight.

**Scope includes:**
- Mission Control (UI, features, API)
- Sophie Loop implementation (loop runner, agent profiles, orchestration)
- Content system tooling (skills, workflows, templates)
- Internal tools (`slideheroes-internal-tools` repo)
- Clawdbot/Sophie configuration and capabilities
- Monitoring, alerts, cron jobs
- Morning Brief and reporting
- CI/CD and deployment pipelines

**Scope excludes:** Product infrastructure (→ #1), content output (→ #2)

**Current MC boards:** 🎯 Mission Control, 🔧 Build Sophie, 📰 Build Content System (the tooling side)

---

### 6. 🤝 Validate with Customers
**Get SlideHeroes in front of real users and learn from their experience.**

Everything related to customer discovery, beta testing, feedback loops, and market validation. The bridge between what we build and what people actually need.

**Scope includes:**
- Beta user recruitment and management
- User testing and feedback collection
- Product Hunt and launch planning
- Customer interviews and discovery calls
- Usage analytics and behavior analysis
- Testimonial and case study development
- Community building (if applicable)

**Scope excludes:** Building features based on feedback (→ #1), marketing to non-beta audiences (→ #2)

---

### 7. 🏠 Run the Business
**Handle the operational, financial, and administrative work that keeps things running.**

The housekeeping — legal, finance, accounts, vendor management, personal productivity systems, and anything that doesn't directly build product or audience but is necessary to operate.

**Scope includes:**
- Financial management (accounting, taxes, cash flow)
- Legal and compliance
- Vendor and subscription management
- Domain, hosting, and account administration
- Personal productivity (Todoist, calendar, GTD)
- Mike's professional development and learning

**Scope excludes:** Strategic financial planning (→ #3), infrastructure tooling (→ #5)

---

## MECE Validation

| Question | Objective |
|----------|-----------|
| "Should we add dark mode to the app?" | 1. Build the Product |
| "Let's write a blog post on data viz" | 2. Grow the Audience |
| "Are we positioned right against Tome?" | 3. Sharpen the Strategy |
| "Audit and expand the context files" | 4. Build the Knowledge Base |
| "Add a Ready for Review column to MC" | 5. Build the Systems |
| "Get 10 beta testers this month" | 6. Validate with Customers |
| "Renew the AWS account" | 7. Run the Business |

### Boundary Cases

| Task | Could Be... | Belongs In... | Why |
|------|-------------|---------------|-----|
| SEO audit of the blog | #2 or #5 | **#2** Grow the Audience | It's about the content ranking, not the tool |
| Build email-marketing skill | #2 or #5 | **#5** Build the Systems | It's tooling that enables content creation |
| Write the manifesto | #2 or #3 | **#3** Sharpen the Strategy | It's defining our position, not marketing it |
| Publish the manifesto on the site | #2 or #3 | **#2** Grow the Audience | Now it's customer-facing content |
| Presentation examples pipeline | #4 or #5 | **#5** Build the Systems | The pipeline is a tool; the examples are #4 |
| Customer interview notes | #6 or #4 | **#6** Validate with Customers | It's about learning from users |

---

## How This Maps to Current MC Boards

| Current Board | Maps To |
|---------------|---------|
| 🚀 Build Product | 1. Build the Product |
| ✍️ Create Content | 2. Grow the Audience |
| 📰 Build Content System | Split: tooling → #5, output → #2 |
| 🔧 Build Sophie | 5. Build the Systems |
| 🎯 Mission Control | 5. Build the Systems |
| *(new)* | 3. Sharpen the Strategy |
| *(new)* | 4. Build the Knowledge Base |
| *(new)* | 6. Validate with Customers |
| *(new)* | 7. Run the Business |

**Recommendation:** When we implement the three-level hierarchy (Sophie Loop Phase 3), these 7 objectives become the top level. Boards could either map 1:1 to objectives or be deprecated in favor of the new hierarchy.

---

*Draft for Mike's review. These objectives should be stable for 6-12 months — they describe what we're doing, not how or when.*
