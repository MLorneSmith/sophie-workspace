# SlideHeroes App Positioning Update
## Course-to-App Pivot — Task #448

*Drafted: 2026-02-12*

---

## 1. Updated Value Proposition

**Old (Course):** "Learn proven techniques to write more impactful presentations"

**New (App):** "Rapidly prototype persuasive business presentations with AI — built on the frameworks used by McKinsey, BCG, and top investment banks"

**One-liner:** SlideHeroes is an AI-powered writing canvas that helps consultants turn messy thinking into structured, executive-ready presentations in minutes instead of hours.

---

## 2. Target Audience

| Segment | Description |
|---------|------------|
| **Primary** | Independent consultants and freelance strategists who create client-facing decks weekly |
| **Secondary** | Small/medium consultancies (5-50 people) who need consistent presentation quality across the team |
| **Tertiary** | In-house strategy, corp dev, and finance professionals at mid-market companies |

**Psychographic:** Smart professionals who know their content but struggle to structure and present it persuasively. Time-poor. They don't want training — they want a tool that embeds best practices automatically.

---

## 3. Key Messaging Pillars

### Pillar 1: "Think Faster, Not Prettier"
SlideHeroes isn't a design tool. It's a thinking tool. The AI helps you structure arguments (SCQ, MECE, pyramid principle) — the hard part that PowerPoint and Canva ignore.

### Pillar 2: "Consultant-Grade Methodology, Zero Learning Curve"
The frameworks that McKinsey consultants spend years mastering are embedded directly in the AI. You get the methodology without the training program.

### Pillar 3: "From Blank Page to First Draft in Minutes"
Stop staring at empty slides. Describe your situation and recommendation, and SlideHeroes generates a structured first draft you can refine.

### Pillar 4: "Built for High-Stakes, Not Templates"
This isn't template-fill. It's for presentations where the argument matters — board meetings, client deliverables, investment proposals, strategy reviews.

---

## 4. Suggested Copy Changes

### 4.1 `apps/web/config/app.config.ts`

| Field | Current | Suggested |
|-------|---------|-----------|
| `title` | "SlideHeroes - AI Tools & Video Training" | "SlideHeroes - AI Presentation Prototyping for Consultants" |
| `description` | "Rapidly Create Smart + Impactful Business Presentations" | "AI writing canvas that helps consultants prototype persuasive presentations in minutes" |

### 4.2 `apps/web/config/homepage-content.config.ts`

**Hero section:**
| Field | Current | Suggested |
|-------|---------|-----------|
| `hero.title` | "Write more impactful presentations" | "Prototype persuasive presentations in minutes" |
| `hero.subtitle` | "AI-powered writing canvas, video training, private coaching for high-stakes consulting, sales & investor presentations" | "AI writing canvas with built-in consulting frameworks — for strategy decks, client deliverables, and board presentations" |

**Sticky section title:**
| Current | Suggested |
|---------|-----------|
| "Everything you need to create winning presentations" | "Everything you need to go from idea to executive-ready deck" |

**Sticky content items — suggested rewrites:**

1. **"AI-Powered writing canvas"** → Keep title. Update bullets:
   - "Go from rough thinking to structured narrative in one session"
   - "AI trained on consulting-grade frameworks (SCQ, MECE, Pyramid Principle)"
   - "Purpose-built for high-stakes business presentations, not social media slides"

2. **"Web's premium online training program"** → Reframe to **"On-demand methodology library"**
   - "Reference library of presentation techniques used by top consultancies"
   - "Learn the 'why' behind the frameworks the AI applies"
   - "Case studies from real board presentations and strategy reviews"
   - *Note: Training becomes supplementary content, not the core product*

3. **"One-to-One Coaching"** → Reframe to **"Expert review (add-on)"**
   - "Get a human expert's eyes on your highest-stakes presentations"
   - "Available as an add-on for critical client pitches and board decks"

**Feature cards — suggested rewrites:**

| Current | Suggested |
|---------|-----------|
| "Fine-tuned AI" / "AI tailored to the task..." | "Purpose-Built AI" / "Trained specifically on business presentation structure — not a generic chatbot" |
| "Proven Methodology" / "AI is automating a proven..." | "Consulting Frameworks Built In" / "SCQ, MECE, Pyramid Principle — the tools top firms use, embedded in every draft" |
| "Instant Access" / "Online video lessons..." | "Start in Seconds" / "No setup, no training required. Describe your presentation and start building" |
| "Certification" / "Earn presentation excellence..." | **Remove or deprioritize** — certification is course-era. Consider replacing with "Team Workspace" / "Consistent quality across your consultancy" |
| "Private Coaching" / "One-on-one coaching..." | "Expert Review" / "Add human expert feedback for your highest-stakes decks" |
| "30-Day Money-Back Guarantee" | Keep as-is (still relevant for SaaS) |

**Pricing section:**
| Current | Suggested |
|---------|-----------|
| "Fair pricing for all types of businesses" | "Plans that scale with your practice" |
| "Get started on our free plan and upgrade when you are ready" | "Free to start. Upgrade when presentations become your competitive advantage." |

### 4.3 Marketing page metadata / SEO

Update `generateMetadata` across marketing pages to reference "AI presentation tool" rather than "presentation course/training."

### 4.4 Onboarding flow

The onboarding form (`apps/web/app/onboarding/_components/onboarding-form.tsx`) should be reviewed to ensure questions frame the user as a **tool user** (What kind of presentations do you create? Who's your audience?) rather than a **student** (What do you want to learn?).

---

## 5. Messaging Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|---------|
| "Prototype", "draft", "build" | "Learn", "study", "course" |
| "AI canvas", "writing tool", "platform" | "Training program", "lessons", "curriculum" |
| "Consultants", "professionals", "teams" | "Students", "learners" |
| "Minutes instead of hours" | "Master presentation skills" |
| "Built-in frameworks" | "We'll teach you frameworks" |
| Reference methodology as a feature | Frame methodology as the product |

---

## 6. Transition Notes

- **Training content doesn't disappear** — it repositions as a "methodology library" or "learning hub" inside the app. Supplementary, not primary.
- **Coaching repositions as "expert review"** — an add-on service, not a core offering.
- **Certification can become a differentiator later** — but for launch, it reads as "course" and should be deprioritized from the homepage.
- **Billing model shift:** $149 one-time → monthly/annual SaaS. Pricing page config (`billing.config`) will need updating separately (out of scope for this doc).
