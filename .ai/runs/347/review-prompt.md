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

# Context: voice/brand-voice.md

# SlideHeroes Brand Voice

**Last Updated:** 2026-02-04
**Owner:** Mike
**Used By:** all content workflows

---

## Summary

Expert but approachable, contrarian but helpful, rigorous but not academic. We're the experienced colleague who's done this a thousand times and wants to save you from the mistakes everyone makes.

## Voice Attributes

### 1. Contrarian
**Challenge bad advice that's everywhere.**

We're not afraid to say "most presentation tips are wrong." We push back against TED-talk worship, pie chart defenders, and anyone who thinks "good design" means more animations.

*Example:* "Most presentation advice will get you fired in a boardroom."

### 2. Expert
**We know what we're talking about.**

No hedging, no "it depends on your situation." We've seen enough presentations to know what works. We speak with authority because we've earned it.

*Example:* "Headlines should be assertions, not labels. Period."

### 3. Generous
**Give away valuable insights freely.**

Our best content is free. We don't gatekeep the methodology. The course is for people who want structure, practice, and depth — not secrets.

*Example:* Entire blog posts that teach complete frameworks, not teasers.

### 4. Direct
**No corporate fluff.**

Short sentences. Clear points. If something's wrong, we say it's wrong. We respect readers' time.

*Example:* "Don't use pie charts. Just don't."

### 5. Practical
**Always actionable.**

Every piece of content should leave the reader able to *do something* differently. Theory serves practice, never the reverse.

*Example:* Not "structure is important" but "limit lists to 5 items — here's why and how."

## Tone Variations by Context

| Context | Tone Adjustment |
|---------|-----------------|
| **Email to subscribers** | Warmer, more personal, first-person |
| **Blog post** | Educational, thorough, more examples |
| **Outbound cold email** | Shorter, more direct, clear value prop |
| **LinkedIn post** | Punchy, contrarian hooks, conversation-starting |
| **Course content** | Patient, encouraging, step-by-step |

## Language We Use

- "McKinsey-style" (not just "professional")
- "Sit-down presentations" (not "business presentations")
- "Demonstrate, don't assert"
- "Answer a question, don't present a topic"
- "The boardroom" (not "your meeting")
- "Structure" before "design"
- "Evidence" (not just "data")

## Language We Avoid

| Avoid | Instead |
|-------|---------|
| "Presentation tips" | "Presentation methodology" |
| "Public speaking" | "Business communication" |
| "Inspire your audience" | "Convince your audience" |
| "Make it pop" | "Make it clear" |
| "Storytelling" (overused) | "Narrative structure" |
| "Hacks" or "tricks" | "Techniques" or "approaches" |
| "Game-changer" | (just explain the benefit) |
| "Actually..." | (too Twitter-brained) |

## Grammar & Style

- **Active voice** preferred
- **Second person** ("you") in emails and blogs
- **Short paragraphs** — 2-3 sentences max
- **Oxford comma** — yes
- **Numbers** — spell out one through nine, numerals for 10+
- **Headlines** — sentence case, not Title Case

## Examples

### Good SlideHeroes Voice:
> "Your headline should clearly lay out the takeaway of your slide. Not 'Q3 Revenue.' Instead: 'Q3 Revenue exceeded forecast by 12%.' See the difference? One is a label. The other is an assertion. Labels are lazy. Assertions show you've done the thinking."

### Bad (Too Generic):
> "It's really important to have good headlines on your slides! A great headline can make all the difference in whether your audience pays attention. Try to make your headlines engaging and informative."

### Bad (Too Academic):
> "Research in cognitive psychology suggests that declarative headlines facilitate information processing by providing advance organizers that prime the audience's schema for the subsequent content."


---

# Context: voice/mike-style.md

# Mike's Personal Writing Style

**Last Updated:** 2026-02-04
**Owner:** Mike
**Used By:** email-campaign, linkedin-posts, thought-leadership content

---

## Summary

Mike's personal voice for emails, LinkedIn posts, and thought leadership. Distinct from the SlideHeroes brand voice — more personal, more opinionated, more conversational.

## Voice Characteristics

### 1. Practitioner, Not Professor
Mike speaks from experience — years in consulting, corporate strategy, and teaching. Not theoretical. Real situations, real lessons.

*Example:* "I've reviewed thousands of decks. The same mistakes show up every time."

### 2. Direct Without Being Harsh
Says what he thinks clearly. Doesn't soften everything with qualifiers. But never mean or dismissive.

*Example:* "Your headline is a label, not an assertion. Fix it." (not "Perhaps you might consider...")

### 3. Contrarian With Evidence
Challenges conventional wisdom, but backs it up. Not contrarian for shock value — contrarian because the conventional wisdom is actually wrong.

*Example:* "Everyone says storytelling is the key to presentations. They're wrong. Structure is."

### 4. Generous With Knowledge
Gives away the good stuff. Doesn't gatekeep insights behind paywalls. The course is for depth and practice, not secrets.

*Example:* Full blog posts that teach complete frameworks, not teasers.

### 5. Dry Humor
Occasional wit, never forced. Self-deprecating when appropriate. Never jokes that undermine the point.

*Example:* "I've made every mistake in this post. That's how I know they're mistakes."

## Sentence Patterns

- **Short sentences for emphasis.** Like this.
- Occasional fragments. For rhythm.
- Uses "—" for asides — like this — rather than parentheses
- Rhetorical questions to engage: "Sound familiar?"
- Direct address: "You" not "one" or "professionals"

## Paragraph Style

- 2-3 sentences max per paragraph
- White space is a feature, not a bug
- Lists when there are actually multiple items
- No walls of text, ever

## Common Phrases Mike Uses

- "Here's the thing..."
- "Let me be direct..."
- "I've seen this a hundred times..."
- "The real problem is..."
- "Most people get this wrong..."
- "It's not about [X], it's about [Y]"

## Phrases Mike Avoids

- "I'd love to..." (too soft)
- "In my humble opinion..." (false modesty)
- "At the end of the day..." (cliché)
- "Let's unpack that..." (consultant-speak)
- "Actually..." (Twitter-brained)
- "Game-changer" (overused)

## Email Specifics

### Opening Lines Mike Would Write
- "A quick thought on your last presentation..."
- "I keep seeing the same mistake..."
- "Here's something that took me years to learn..."
- "Let me tell you about a deck I saw last week..."

### Opening Lines Mike Would NOT Write
- "Hope this email finds you well!"
- "I wanted to reach out because..."
- "As a valued subscriber..."
- "In today's newsletter..."

### Closing Style
- Often ends with a question or challenge
- "What's your take?"
- "Try it on your next deck."
- "Hit reply if this resonates."

## LinkedIn Specifics

### Post Structure
- Hook in first 1-2 lines (before "see more")
- One idea per post
- Short paragraphs with line breaks
- End with engagement prompt or clear takeaway

### What Mike Posts About
- Contrarian takes on presentation advice
- Lessons from real (anonymized) presentations
- Behind-the-scenes of SlideHeroes
- Industry observations
- Occasional personal/founder journey

### What Mike Doesn't Post
- Humble brags disguised as lessons
- "I'm so grateful" posts
- Engagement bait without substance
- Recycled motivational content

## Calibration Examples

### ✅ Sounds Like Mike
> "Most presentation advice is for speeches. Boardroom decks are different. The skills that make you a great keynote speaker will get you fired in a strategy review. Here's why."

### ❌ Doesn't Sound Like Mike
> "I'm excited to share some thoughts on presentations! As many of you know, creating compelling slides is super important in today's business world. Let me walk you through some tips that I've found helpful!"

### ❌ Too Aggressive (Not Mike Either)
> "Everyone giving presentation advice is an idiot. Your decks suck because you listened to them. Stop being stupid and listen to me instead."


---

# Context: voice/pov-presentations.md

# SlideHeroes Points of View: Presentations

**Last Updated:** 2026-02-04
**Owner:** Mike
**Used By:** all content workflows
**Source:** SlideHeroes blog content (8 articles, 32 POVs)

---

## Summary

Our contrarian, expert beliefs about presentations. Use these to generate hooks, challenge conventional wisdom, and maintain consistent positioning across content.

---

## Identity: What Business Presentations ARE

### "Business presentations are NOT speeches"
> 'Sit-down' McKinsey-style business presentations around a board table are fundamentally different from public speaking and require a completely different approach to communication.

**Contrast:** Most 'presentation tips' are actually speech tips — and they'll get you fired in a boardroom.

**Hook angles:**
- Challenge the TED-talk obsession ruining business communication
- "Why does your boss roll their eyes when you try to 'inspire' them?"

### "This is NOT a performance — it IS business"
> Your presentation to your board, boss, customer, or investor is not a TED Talk. It is not a speech. It is not public speaking.

**Contrast:** Stop worrying about your opening joke and start worrying about your structure.

---

## Structure: How to Organize Your Argument

### "Answer a question, don't present a topic"
> Rather than presenting about 'Customer Relationship Management Software', present an answer to the question 'Our CRM software is old, does it need to be replaced?'

**Example:**
- Topic: "2022 Marketing Plan"
- Question: "What is the best plan for accelerating growth?"
- The resulting presentations would be VERY different.

### "Structure is how you help your audience follow"
> When the audience cannot follow your logic, they become frustrated. They get pissed off. They stop paying attention. Structure is how you signpost where you are going.

**Implication:** Expect half your time to be spent working on structure.

### "Limit your lists to no more than 5 items"
> If you have more than 5 items, bucket these ideas into a new set of groupings, one level of abstraction higher. Apply MECE principles.

---

## Evidence: Demonstrate, Don't Assert

### "Demonstrate, don't simply assert"
> Your credibility skyrockets when you demonstrate the truth of your assertions through data, facts, or very compelling logic.

**Contrast:** The 'because I say so' argument is surprisingly common in presentations.

### "Footnotes provide credibility"
> When you cite numbers and statistics, say where you got the data. Not providing footnotes is, at best, lazy, and at worst, dishonest.

### "State your survey population (n)"
> With survey data, state the size of the survey population. The bigger the n, the more confidence readers have. Easier to anticipate the question.

---

## Data Visualization

### "Don't use pie charts"
> Don't use pie charts, crazy animations, 3D, or random special effects. Just don't. Resist the temptation to sex things up.

### "Chart type must match the data relationship"
| Relationship | Chart |
|--------------|-------|
| Nominal comparison | Bar chart |
| Time series | Line chart |
| Ranking | Sorted bar chart |
| Part-to-whole | Stacked bar (not pie!) |
| Correlation | Scatter plot |

### "A cardinal sin: when you can't see the point in the data"
> It is a cardinal sin when you cannot actually see in the data the point being made in the headline. The chart must visually prove the headline's claim.

---

## Design

### "Design is important — it just isn't everything"
> Your objective is not to create a pretty deck. The objective is to communicate your point. Having said this, design matters. I can't take you seriously if you can't be bothered to make your deck look good.

### "Reserve each slide for a single primary idea"
> Write concise two-line headlines that make your main assertion. One slide, one idea.

### "Headlines should be assertions, not labels"
**Before:** "Q3 Revenue"
**After:** "Q3 Revenue exceeded forecast by 12%"

### "Create slides that are scannable"
> Employ the three-second rule — people should be able to 'get' the slide in 1, 2, 3 seconds.

---

## Audience

### "Identify the Power Behind The Throne"
> Who has power? Who makes decisions? Sometimes it's not clear who the real decision makers are. Once identified, determine how they like to consume information.

### "What Is In It For Them?"
> The most effective formula to ensuring your audience connects with your material is to give a presentation about something they care about.

---

## Delivery

### "If your meeting is important enough for a presentation, it's important enough for a GREAT one"
> If your meeting is important enough to prepare a presentation for, it is important enough to prepare a great presentation for. Put in the effort.

### "Have conviction in your material — or have someone else present"
> If you don't have conviction, work harder. Demonstrate passion. If you can't fake it, have someone else present.

### "End with clear next steps"
> The objective of your presentation should be for your audience to DO SOMETHING. Identify your desired next step early and design the presentation so it's the logical consequence.

---

## Using POVs in Content

1. **Hooks:** Use contrarian POVs to challenge conventional wisdom
2. **Authority:** Reference specific rules and frameworks
3. **Examples:** Turn POVs into before/after demonstrations
4. **Controversy:** Pick fights with bad advice
5. **Teaching:** Expand POVs into full how-to content


---

# Context: voice/vocabulary.md

# SlideHeroes Vocabulary Guide

**Last Updated:** 2026-02-04
**Owner:** Mike
**Used By:** all content workflows

---

## Summary

Words and phrases we use (and avoid) to maintain consistent voice and positioning across all content.

---

## Terms We Use

### Our Methodology
| Term | Usage |
|------|-------|
| **Sit-down presentations** | Our focus — boardroom, not stage |
| **McKinsey-style** | Shorthand for structured, executive-ready |
| **Board-level** | Quality standard we aim for |
| **Structure** | The backbone — always emphasize over design |
| **Argument** | What a presentation makes (not "content") |
| **Assertion** | What a headline should be (not "title") |

### Our Frameworks
| Term | Definition |
|------|------------|
| **5S Framework** | Structure, Story, Substance, Style, Self-Confidence |
| **SCQ** | Situation, Complication, Question (Barbara Minto) |
| **MECE** | Mutually Exclusive, Collectively Exhaustive |

### Describing Presentations
| Use | Instead Of |
|-----|-----------|
| "Deck" | "Presentation" (when casual) |
| "Slide" | "Page" |
| "Headline" | "Title" (for slide titles) |
| "Takeaway" | "Point" |
| "Executive summary" | "Overview" |

### Describing Our Audience
| Use | Instead Of |
|-----|-----------|
| "Professionals" | "People" |
| "Corporate environment" | "Workplace" |
| "Executives" or "the C-suite" | "Management" |
| "Decision-makers" | "Audience" (when specific) |
| "Stakeholders" | (only when accurate) |

### Describing Quality
| Use | Instead Of |
|-----|-----------|
| "Crisp" | "Good" |
| "Compelling" | "Interesting" |
| "Clear" | "Easy to understand" |
| "Rigorous" | "Thorough" |
| "Executive-ready" | "Professional" |

---

## Terms We Avoid

### Generic/Weak
| Avoid | Why | Alternative |
|-------|-----|-------------|
| "Tips" | Too lightweight | "Techniques," "methodology" |
| "Hacks" | Gimmicky | "Approaches," "methods" |
| "Tricks" | Implies deception | "Techniques" |
| "Secrets" | Overpromises | "Principles," "lessons" |
| "Amazing" | Empty superlative | Be specific |
| "Game-changer" | Overused | Describe the actual change |

### Wrong Category
| Avoid | Why | Alternative |
|-------|-----|-------------|
| "Public speaking" | Not our focus | "Business presentations" |
| "Speech" | Wrong format | "Presentation" |
| "Audience" (vague) | Too generic | "Executives," "board," "stakeholders" |
| "Inspire" | TED-talk territory | "Convince," "persuade" |

### Corporate Jargon
| Avoid | Why | Alternative |
|-------|-----|-------------|
| "Synergy" | Cringe | Just describe the benefit |
| "Leverage" (as verb) | Overused | "Use" |
| "Circle back" | Annoying | "Follow up" |
| "Take offline" | Corporate-speak | "Discuss separately" |
| "Unpack" | Consultant cliché | "Explain," "examine" |

### Weak Intensifiers
| Avoid | Why | Alternative |
|-------|-----|-------------|
| "Very" | Weak | Find a stronger word |
| "Really" | Weak | Be specific |
| "Extremely" | Hyperbolic | Let the content speak |
| "Literally" | Often misused | Remove or use correctly |

---

## Capitalization & Formatting

### Product Names
- **Decks for Decision Makers** (full name, capitalized)
- **DDM** (abbreviation, okay after first use)
- **SlideHeroes** (one word, capital H)

### Framework Names
- **5S Framework** (capitalized)
- **SCQ** (acronym)
- **Pyramid Principle** (when referencing Minto)

### Common Terms
- "McKinsey-style" (hyphenated, capital M)
- "sit-down presentations" (lowercase)
- "board-level" (hyphenated, lowercase)
- "C-suite" (hyphenated, capital C)

---

## Industry-Specific Terms

### Consulting
| Term | Our Usage |
|------|-----------|
| Deliverable | The presentation/deck as a work product |
| Engagement | A consulting project |
| Partner | Senior consulting firm leader |
| Deck review | Formal presentation critique |

### Corporate
| Term | Our Usage |
|------|-----------|
| Board meeting | Highest-stakes presentation context |
| Quarterly review | Regular business update presentation |
| Strategy presentation | Big-picture direction deck |
| Project update | Tactical progress presentation |

---

## Testing Vocabulary

When writing content, ask:
1. Would Mike say this word out loud?
2. Does it match our positioning (rigorous, not fluffy)?
3. Is it specific enough (not generic)?
4. Does it distinguish us from TED-talk advice?


---

# Context: guidelines/blog-guidelines.md

# Blog Post Guidelines

**Last Updated:** 2026-02-04
**Owner:** Mike
**Used By:** blog-strategy, blog-write, blog-validate

---

## Summary

Guidelines for creating SlideHeroes blog posts. Focused on SEO, readability, and establishing authority — while maintaining the SlideHeroes voice.

---

## Content Strategy

### Purpose of the Blog
1. **SEO:** Attract organic traffic for presentation-related searches
2. **Authority:** Establish SlideHeroes as the expert in business presentations
3. **Value:** Provide genuinely useful content (generous, not gated)
4. **Funnel:** Introduce readers to SlideHeroes methodology and courses

### Content Pillars
| Pillar | Topics |
|--------|--------|
| **Structure** | Organizing arguments, pyramid principle, MECE |
| **Data Visualization** | Charts, graphs, tables, evidence |
| **Design** | Slide layout, headlines, visual hierarchy |
| **Strategy** | Audience analysis, executive presentations, pitch decks |
| **Common Mistakes** | Teardowns, critiques, what not to do |

---

## SEO Requirements

### Keyword Strategy
- Primary keyword in title, H1, and first 100 words
- Secondary keywords in H2s
- Keyword density: 1-2% for primary keyword
- Natural usage — don't force keywords

### Technical SEO
- **Title tag:** Under 60 characters, keyword near front
- **Meta description:** 120-160 characters, include keyword, compelling
- **URL slug:** Short, includes primary keyword, hyphens not underscores
- **Internal links:** Minimum 2 links to other SlideHeroes content
- **External links:** At least 1 link to authoritative source

### Content Length
- **Minimum:** 1,000 words (for ranking)
- **Ideal:** 1,500-2,500 words (comprehensive coverage)
- **Maximum:** 3,500 words (before splitting into series)

---

## Structure Requirements

### Required Elements
- [ ] H1 title (only one)
- [ ] Opening hook (first 100 words)
- [ ] Clear thesis/promise
- [ ] Minimum 3 H2 sections
- [ ] Conclusion with CTA
- [ ] Featured image (with alt text)

### Heading Hierarchy
```
# H1: Main Title (one only)
## H2: Major Section
### H3: Subsection
#### H4: Rarely needed
```

### Paragraph Style
- Maximum 3 sentences per paragraph
- One idea per paragraph
- Use white space liberally
- Break up with subheadings, lists, images

---

## Readability Requirements

### Target Metrics
| Metric | Target | Tool |
|--------|--------|------|
| Flesch-Kincaid Grade | ≤ 8 | textstat |
| Sentence length | ≤ 20 words avg | word count |
| Paragraph length | ≤ 4 sentences | manual |
| Passive voice | < 10% | grammar checker |

### Plain Language Rules
- Use "you" and "your" (direct address)
- Active voice preferred
- Concrete examples over abstract concepts
- Short words over long ones when possible

---

## Voice & Tone

### Blog Voice (SlideHeroes Brand)
- **Expert:** Authoritative, backs up claims
- **Generous:** Gives away valuable information
- **Contrarian:** Challenges bad conventional wisdom
- **Practical:** Actionable, not theoretical

### What Works in Blog Posts
- Before/after examples
- Real presentation teardowns (anonymized)
- Specific rules ("Never use pie charts")
- Data and research citations
- Downloadable resources

### What Doesn't Work
- Vague advice ("Be more confident")
- Pure opinion without evidence
- Walls of text without formatting
- Clickbait that doesn't deliver
- Rehashing obvious tips

---

## Post Templates

### How-To Posts
```markdown
# How to [Achieve X]

Opening hook: Problem or promise

## Why [X] Matters / Why Most People Fail
Context and stakes

## Step 1: [Action]
Explanation + example

## Step 2: [Action]
Explanation + example

## Step 3: [Action]
Explanation + example

## Common Mistakes to Avoid
What to watch out for

## Conclusion
Summary + CTA
```

### Listicle Posts
```markdown
# [N] [Things] to [Achieve X]

Opening: Promise + preview

## 1. [First Item]
## 2. [Second Item]
...

## Conclusion
Summary + CTA
```

### Teardown/Critique Posts
```markdown
# [Analysis] of [Subject]

Opening: What we're analyzing and why

## Background
Context on the subject

## What Works
Positive observations

## What Doesn't Work
Critique with specifics

## Lessons to Apply
Actionable takeaways

## Conclusion
```

---

## Quality Checklist

### Before Publishing
- [ ] Title includes primary keyword
- [ ] Meta description 120-160 chars
- [ ] Word count ≥ 1,000
- [ ] Readability ≤ Grade 8
- [ ] At least 3 H2 sections
- [ ] Internal links ≥ 2
- [ ] External link ≥ 1
- [ ] Featured image with alt text
- [ ] CTA in conclusion
- [ ] Proofread (no typos/grammar errors)

### Content Quality
- [ ] Clear thesis in first 100 words
- [ ] Delivers on title promise
- [ ] Specific examples included
- [ ] Actionable (reader can do something)
- [ ] On-brand voice
- [ ] Not just rehashing obvious advice

---

## Anti-Patterns

| Pattern | Problem |
|---------|---------|
| "In this post, I'm going to..." | Boring, unnecessary |
| 500-word posts | Won't rank, too thin |
| No subheadings | Hard to scan |
| Stock photo overload | Looks generic |
| CTA in every paragraph | Desperate, annoying |
| Pure SEO (no value) | Bad for brand |
| No examples | Too abstract |


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

# Context: personas/solo-consultant.md

# Persona: Solo Consultant

**Last Updated:** 2026-02-04
**Owner:** Mike
**Used By:** email-campaign, outbound-sequence, blog-strategy

---

## Summary

Independent consultants who create client deliverables and need to communicate complex recommendations clearly. They compete with big firms on quality of thinking, and presentations are how they prove their worth.

## Demographics

- **Role:** Independent consultant, freelance strategist, fractional executive
- **Experience:** 5-20+ years, often ex-Big 4 or corporate strategy
- **Company size:** Solo or small boutique (1-5 people)
- **Industry:** Management consulting, strategy, operations, finance, marketing
- **Location:** Major metros, increasingly remote
- **Income:** $150K-$500K+ annually

## Psychographics

### Goals
- Win and retain high-value clients
- Compete with larger firms on deliverable quality
- Build reputation for clear, executive-ready work
- Charge premium rates justified by output quality
- Spend more time on billable work, less on formatting

### Pain Points
- **"I spend 15-20 hours per pitch deck"** — Time that could be billable
- **"Generic presentation tips don't apply to my work"** — TED talk advice is useless in a boardroom
- **"My decks don't land the way McKinsey's do"** — Missing the polish and structure
- **"I know my content but struggle to structure it"** — Smart thinking, messy delivery
- **"Clients judge me by my deliverables"** — A bad deck undermines good advice

### Desires
- Credibility in the boardroom with senior stakeholders
- Professional-looking deliverables that match Big 4 quality
- Structured approach they can apply repeatedly
- Confidence when presenting to C-suite
- Time back from presentation creation

### Fears
- Looking unprofessional compared to larger competitors
- Losing deals because the deck didn't land
- Being seen as "just a freelancer" not a serious advisor
- Spending too much time on low-value formatting work

## Buying Behavior

### How They Find Us
- Google searches: "McKinsey presentation style," "consulting presentation template"
- LinkedIn content about presentations
- Referrals from other consultants
- Blog articles on specific presentation problems

### Decision Factors
- **Credibility:** Does this person actually know consulting presentations?
- **Practicality:** Can I use this tomorrow?
- **Time investment:** How long to see results?
- **ROI:** Will this help me win/retain clients?

### Objections
- "I already know how to present" → You know how to *speak*, not how to *structure*
- "I don't have time for a course" → You don't have time to keep losing deals
- "Templates are enough" → Templates without methodology = polished mediocrity

## Messaging That Resonates

### Hooks
- "Why your presentation skills are costing you clients"
- "The McKinsey structure your competitors are using"
- "Stop presenting topics. Start answering questions."
- "15 hours per deck → 5 hours per deck"

### Value Props
- "McKinsey-quality deliverables, solo consultant prices"
- "The methodology behind $500/hour consulting decks"
- "Win more pitches with structured, executive-ready presentations"

### Proof Points
- "Taught at Seneca College (Canada's largest community college)"
- "Used by US Department of Energy professionals"
- "Developed by ex-[Mike's background] with [X] years experience"

## Content Preferences

- **Format:** Practical how-tos, frameworks, examples
- **Tone:** Expert peer, not lecturer
- **Length:** Scannable, with depth available
- **Examples:** Real consulting situations, anonymized teardowns

## Scenario Examples (For Content Creation)

Use these scenarios to make content relatable and specific:

### Scenario 1: The Pitch That Didn't Land
> Sarah runs a boutique strategy practice. She spent 18 hours on a pitch deck for a mid-market PE firm. The meeting went fine — polite nods, "interesting approach." Then silence. She lost to a 3-person team from a Big 4 firm. When she got honest feedback, the PE partner said: "Your thinking was sharper. Their deck was clearer." She knew the methodology was the gap.

### Scenario 2: The CFO Who Pushed Back
> James is a fractional CFO advising three companies. In a board meeting, he presented his analysis of a potential acquisition. Halfway through, the lead director interrupted: "What's your actual recommendation?" James had buried the answer on slide 37. The analysis was solid. The structure lost the room.

### Scenario 3: The Template Trap
> David downloaded 15 "consulting-style" templates. His decks looked polished but felt empty. Clients complimented the design but asked probing questions his slides couldn't answer. Pretty labels instead of assertions. Charts without headlines that proved a point. He realized the gap wasn't design — it was thinking.

### When Writing For This Persona
- Reference specific deliverables: "pitch deck," "strategy review," "project update," "board presentation"
- Mention the competition: "the Big 4 team you're pitching against"
- Quantify time: "15 hours per deck," "2-day turnaround"
- Reference their clients: "your Fortune 500 client," "the PE partner," "the CEO"
- Acknowledge their expertise: "You know your content. The structure is the gap."

## Anti-Patterns (What Doesn't Work)

- Generic motivation ("You can do it!")
- Academic theory without application
- Consumer-focused presentation tips
- Anything that feels like "coaching" rather than "training"
- Talking down to them — they're experienced professionals, not beginners
- Ignoring the competitive dynamic — they're always competing against larger firms


---

# Context: messaging/pain-points.md

# Pain Points by Persona

**Last Updated:** 2026-02-04
**Owner:** Mike
**Used By:** email-campaign, outbound-sequence, blog-strategy

---

## Summary

The problems our audience faces, organized by intensity and frequency. Use these to craft hooks, identify angles, and ensure content addresses real needs.

## Universal Pain Points (All Personas)

### 1. "Most presentation advice doesn't apply to me"
**Intensity:** High  
**Frequency:** Every time they seek help

> "I Googled 'presentation tips' and got advice about eye contact and hand gestures. I need to know how to structure a 40-page deck for the CFO."

**Hook angles:**
- "Why TED talk advice will get you fired in a boardroom"
- "The presentation tips that actually apply to business"

### 2. "I know my content but can't structure it"
**Intensity:** High  
**Frequency:** Every major presentation

> "I understand the problem, I have the data, but when I try to put it together it's a mess. The logic doesn't flow."

**Hook angles:**
- "Smart thinking, messy delivery: the consultant's curse"
- "The structure that makes complex arguments click"

### 3. "My presentations don't land"
**Intensity:** Very High  
**Frequency:** After key failures

> "I presented to the board and could see their eyes glaze over. I lost them halfway through. I don't know what went wrong."

**Hook angles:**
- "Why your presentation lost the room (and how to get them back)"
- "The moment executives stop listening"

### 4. "I spend too much time on presentations"
**Intensity:** Medium-High  
**Frequency:** Ongoing frustration

> "I spent 15 hours on that deck. My competitor probably spent 3. There has to be a better way."

**Hook angles:**
- "15 hours per deck → 5 hours per deck"
- "Where presentation time actually goes (and how to cut it)"

### 5. "My slides look unprofessional"
**Intensity:** Medium  
**Frequency:** Ongoing insecurity

> "I know it's not about design, but my slides look amateurish compared to what I see from consultancies."

**Hook angles:**
- "Why your slides look 'off' (it's not the template)"
- "The design rules consultants actually follow"

---

## Persona-Specific Pain Points

### Solo Consultants

| Pain Point | Emotional Trigger | Hook Angle |
|------------|-------------------|------------|
| Competing with Big 4 on deliverables | Inadequacy, frustration | "How to match McKinsey quality without McKinsey resources" |
| Time spent on formatting vs. thinking | Resentment, inefficiency | "Stop formatting. Start billing." |
| Client questions they can't answer | Imposter syndrome | "When the CEO asks 'so what?' — and you freeze" |
| No feedback loop on presentations | Uncertainty | "You'll never know if your deck sucked" |

### Corporate Professionals

| Pain Point | Emotional Trigger | Hook Angle |
|------------|-------------------|------------|
| Presenting to executives who intimidate them | Anxiety, fear | "The exec presentation that determines your career" |
| Getting promoted requires visibility | Ambition, frustration | "The hidden skill that determines who advances" |
| Colleagues with better "presence" | Jealousy, self-doubt | "Presence is learnable. Here's how." |
| No training — expected to just know | Abandonment | "Nobody teaches this in business school" |

### Entrepreneurs/Founders

| Pain Point | Emotional Trigger | Hook Angle |
|------------|-------------------|------------|
| Pitch deck that doesn't get meetings | Desperation | "VCs see 5,000 pitches a year. Here's why yours gets skipped." |
| Investors say "interesting" but don't invest | Confusion | "What 'let's stay in touch' really means" |
| Can't explain what they do simply | Frustration | "If you can't explain it simply, you can't sell it" |
| Don't know what investors actually look at | Uncertainty | "Where investors spend time in your deck (data)" |

---

## Pain Point Intensity Ladder

Use this to match content to emotional state:

| Level | State | Content Need |
|-------|-------|--------------|
| 5 - Crisis | "I just bombed a major presentation" | Immediate tactical fix, empathy |
| 4 - Urgent | "I have a board meeting in 2 weeks" | Practical framework, quick wins |
| 3 - Motivated | "I want to get better at this" | Comprehensive methodology |
| 2 - Curious | "I wonder if there's a better way" | Insight, contrast with status quo |
| 1 - Unaware | "Presentations are fine, not great" | Wake-up call, reframe the problem |

---

## Pain Points We DON'T Address

- Stage fright / public speaking anxiety (not our focus)
- Keynote / conference speaking
- Webinar presentation skills
- Design software training (Keynote, PowerPoint how-to)
- Presentation delivery coaching (voice, body language)

These are adjacent but not our lane. Mentioning them = scope creep.

---

# Builder Output To Review

---
meta_description: "Learn the SCQ and pyramid structure that consulting firms use to build boardroom presentations executives actually read and act on."
featured_image: "https://www.slideheroes.com/images/boardroom-presentation.jpg"
featured_image_alt: "Executive team reviewing a structured boardroom presentation around a conference table"
---

# How to Structure a Boardroom Presentation (That Executives Actually Read)

You walk into the boardroom. Seven executives around the table. The CFO is checking email. The CEO has their notebook open. You have 40 minutes to make your case.

Five slides in, you lose them.

Not because your thinking is weak. Not because your data is wrong. Because your boardroom presentation structure failed.

I've reviewed thousands of decks over two decades in consulting and corporate strategy. The same mistake shows up every time: smart consultants bury their argument under piles of information, then wonder why executives stopped listening.

Here's the truth: executives don't read presentations. They scan them. If they can't follow your logic in three seconds per slide, they're gone.

## The Problem: Most Presentations Are Topics, Not Arguments

Think about the last presentation you created. What was the deck titled?

"Q3 Revenue Update"
"Customer Retention Analysis"
"Marketing Strategy 2025"

These aren't presentations. They're topics.

A presentation should answer a specific question. "Should we expand into the European market?" "What's driving our customer churn?" "How do we accelerate growth next quarter?"

The difference matters because structure follows purpose. When you present a topic, you organize information. When you answer a question, you build an argument.

Executives don't want information. They can get that from a spreadsheet. They want your thinking. They want to know what you recommend and why.

## The Insight: Boardroom Presentations Are Not Speeches

Most presentation advice is actually public speaking advice. Make eye contact. Use hand gestures. Tell a story. Open with a joke.

This will get you fired in a boardroom.

Sit-down presentations around a table are fundamentally different from standing on a stage. In a keynote, the speaker controls the flow. In a boardroom, the audience does. They interrupt. They challenge. They jump ahead.

Your structure is your defense system. When an executive asks, "But what about X?" you need to know exactly where that fits in your argument. When they say, "Skip to the recommendation," you need to be able to land the plane.

The pyramid principle is that defense system.

## The Framework: SCQ and the Pyramid Structure

[Barbara Minto](https://en.wikipedia.org/wiki/Minto_Pyramid_Principle) developed the pyramid principle during her 17 years at McKinsey. It's now the standard for structured consulting communication. Here's how it works.

### Start with SCQ

Every boardroom presentation should open with SCQ:

**S = Situation:** Where are we now? Establish the shared context that everyone in the room agrees on. This gets them nodding before you ask them to think.

*Example: "Our customer acquisition cost has risen 23% over the past six months, while lifetime value has remained flat."*

**C = Complication:** What's changed? What's the problem? The complication creates tension — the reason you're having this conversation.

*Example: "At current CAC levels, we'll exhaust our marketing budget by Q3 without improving conversion."*

**Q = Question:** What should we do? This is the question your presentation will answer.

*Example: "How do we reduce customer acquisition cost while maintaining growth targets?"*

The SCQ does three things: it establishes relevance, creates urgency, and sets expectations. Everyone in the room now knows why they're there and what you're solving for.

### Build a Single Pyramid

Your entire presentation should be one pyramid. The answer to your question sits at the top. Each supporting argument forms the next level. The evidence sits at the base.

The pyramid has one rule: every point must answer the question "so what?" for the point above it.

If your top-level answer is "We should reduce CAC by 20% through improved ad targeting," your second-level points might be:

1. Current targeting is inefficient
2. New targeting technology is available
3. Competitors using similar tech have reduced costs

Each of these must support the top-level claim. The third level — the evidence — supports the second level.

### Apply MECE

MECE stands for Mutually Exclusive, Collectively Exhaustive. It's the consulting secret sauce for structuring arguments.

**Mutually Exclusive:** Points don't overlap. If you say "reduce costs through better targeting" and "reduce costs through creative optimization," you might be double-counting the same ad spend.

**Collectively Exhaustive:** Together, your points cover the whole problem. If you present three options for growth but miss the fourth that's actually viable, your analysis looks incomplete.

When I see consultants fail MECE, it's usually because they started writing before they finished thinking. They dumped their brain onto slides instead of structuring the argument first.

### Limit Lists to Five Items

Here's a hard rule: never present more than five items in a list. Never.

Your brain can process about seven chunks of information. Five is safe. Six is pushing it. Seven is chaos.

If you have more than five points, bucket them. Create a level of abstraction higher. "Reduce CAC" might become "Improve marketing efficiency." Under that heading, you can list targeting, creative, and channel optimization — but the slide structure stays clean.

### Headlines Are Assertions, Not Labels

Every slide needs a headline. Not a title. A headline.

"Q3 Revenue" is a label. It tells me what's on the page. It forces me to do the work of figuring out what it means.

"Q3 Revenue exceeded forecast by 12%, driven by unexpected enterprise sales" is an assertion. It tells me the takeaway. I can read the headline and get your point without looking at the chart.

This is the three-second rule. In three seconds, an executive should understand your slide. If they need to hunt for the point, they've already tuned out.

For more on writing headlines that work, see our guide to [assertive headlines](https://www.slideheroes.com/blog/headlines-assertions-not-labels).

## Application: Structure in Practice

Let me show you how this plays out with a real scenario.

### The Wrong Way

A solo consultant I know — let's call him James — was pitching a retail strategy project. His deck opened with:

"Retail Strategy Proposal"

Next slide: market analysis. Then competitor analysis. Then customer demographics. Then technology trends. Then... finally, 32 slides later... his recommendations.

The client's CEO stopped him on slide 8. "James, what are you actually proposing we do?"

James hadn't answered the question yet. He was still presenting the topic.

### The Right Way

Here's how James should have structured that deck:

**Slide 1 (SCQ):**
*Situation:* The retail client operates 120 stores with declining same-store sales.
*Complication:* New e-commerce competitors are capturing 40% of the market while store traffic drops 15% annually.
*Question:* How should the client restructure its retail strategy to compete effectively?

**Slide 2 (Top-Level Answer):**
"The client should restructure around three priorities: close underperforming stores, invest in omnichannel capabilities, and launch a premium loyalty program."

That's it. One slide. The CEO now knows where James is going.

**Slide 3 (Supporting Point 1):**
"Closing 18 underperforming stores will save $12M annually while losing only 5% of revenue."

**Slide 4 (Supporting Point 2):**
"Omnichannel investment will capture $8M in additional revenue within 18 months."

**Slide 5 (Supporting Point 3):**
"A premium loyalty program will increase customer lifetime value by 22% for the top 20% of customers."

Then evidence for each point. Then financial projections. Then implementation timeline.

The executive can follow the logic. They can jump ahead to financials if they want. They know where James is going at all times.

Notice the difference? In the wrong version, you're taking the board on a journey and hoping they reach the right destination. In the right version, you start at the destination and show them how you got there.

Executives prefer the latter. They've seen the journey before. They want the conclusion first.

## Common Structural Mistakes

I see these mistakes constantly. Avoid them.

### The Mystery Novel Deck

You present background, then analysis, then more analysis, then... ta-da! Your recommendation on the final slide.

This is not storytelling. It's withholding information. Executives aren't reading for entertainment. They're there for decisions. Give them the answer upfront.

### The Laundry List

You have 10 supporting points and you list them all. The pyramid becomes a blob.

Group them. If you have 10 points, you probably have 3-4 categories. Use the categories as your second level. List the 10 points as evidence.

### The Orphan Slide

A slide that doesn't connect to the main argument. It's there because you did the analysis and it's interesting data, but it doesn't answer the question.

Cut it. Or move it to an appendix. Every slide must pull its weight. If it doesn't advance your argument, delete it.

### The Assumption Trap

You assume the audience sees what you see. "This chart shows we're gaining market share." But the chart actually shows revenue growth — and revenue could grow from price increases while market share shrinks.

Make your assertions explicit. Don't let the data do the talking. You do the talking. The data proves you're right.

### The Missing So What

You present evidence without connecting it to your argument. "Our NPS score is 42." So what? Is that good? Bad? What does it mean for your recommendation?

Every piece of evidence must connect to an argument, and every argument must connect to your main answer. The so what chain cannot have gaps.

## How to Structure Your Next Deck

Here's your step-by-step process:

1. **Define the question.** Not the topic. The question. What specific problem are you answering? Write it down.

2. **Draft your answer.** One sentence. If you can't state your recommendation in one sentence, you don't have a recommendation.

3. **Identify your supporting arguments.** What are the 3-5 reasons your answer is correct? Check that they're MECE.

4. **Gather evidence.** Data, facts, examples that prove each supporting argument.

5. **Build your SCQ.** Situation (context everyone agrees on), Complication (why we're here), Question (what you're answering).

6. **Outline your deck:**
   - Slide 1: SCQ
   - Slide 2: Main answer
   - Slides 3-7: Supporting arguments
   - Slides 8-20: Evidence for each argument
   - Slides 21-25: Implications, risks, next steps

7. **Write headlines.** For every slide, write a headline that's an assertion. Not a label.

8. **Review the pyramid.** Does every point answer "so what?" for the point above it? If not, fix the structure.

9. **Cut ruthlessly.** Delete any slide that doesn't advance the main argument. Move non-essential analysis to appendices.

10. **Present.** Start with the answer. Then show your work.

## The Result: Executives Who Actually Read Your Deck

When you structure your boardroom presentation this way, something shifts.

Executives stop checking email. They stop asking "where are we going?" because they know. They engage with your argument instead of struggling to find it.

I've seen this happen hundreds of times. A consultant walks in with a tightly structured pyramid. The CEO leans forward. The CFO looks at the data and nods. The conversation moves from "what are you saying?" to "how do we make this happen?"

That's the difference between a presentation that gets ignored and a presentation that drives decisions.

Your next deck can be one of them.

Ready to build boardroom presentations that actually land? Learn the complete methodology in [Decks for Decision Makers](https://www.slideheroes.com/courses) — the same structure training used by consultants and corporate teams worldwide. From SCQ to execution, we'll show you exactly how to craft presentations executives read, respect, and act on.

Explore more of our [presentation methodology](https://www.slideheroes.com/blog) to master every aspect of boardroom communication.

---

# Review Criteria
- Does the content match our brand voice (authoritative, approachable, opinionated)?
- Does it address the target persona's specific pain points?
- Does it follow our blog guidelines (structure, length, formatting)?
- Is there a clear, actionable takeaway the reader can use immediately?
- Is the headline compelling, specific, and benefit-oriented?
- Does it avoid banned vocabulary and generic AI-sounding language?
- Would Mike be comfortable publishing this under his name?

---

# Required Output
Return either PASS or FAIL as specified in your system prompt.
