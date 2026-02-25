# SaaS Dashboard + Onboarding Design Analysis (Competitors / Inspiration)
**Product:** SlideHeroes (AI-powered presentation builder for consultants at boutique consultancies, 5–50 people)  
**Inputs:** Screenshots from **Webflow** (15 + misc), **Gamma** (7), **Beautiful.ai** (7)  
**Goal:** Extract best-practice onboarding + dashboard patterns to inform SlideHeroes’ first-run experience and ongoing workspace UI.

---

## 1. Executive Summary

Across all three products, the strongest onboarding experiences share a consistent structure:
1) **Lightweight personalization** (role, company size, goals) to tailor templates and feature emphasis.
2) **A clear “first action” choice** (start from AI, template, blank, import) that respects different user intents.
3) **A guided activation checklist** embedded inside the product (not just a pre-product questionnaire).

**Webflow** stands out as best-practice for complex tools: it combines a short personalization wizard with **in-context, step-based guidance** (checklist + micro-tutorial cards) inside the actual working surface.

### Top 3 actionable recommendations for SlideHeroes
1. **Use a two-layer onboarding model (Personalize → Activate):**
   - Layer A: 4–6 quick questions (role, firm size, what you’re creating, target audience, preferred starting point).
   - Layer B: an **in-product activation checklist** that drives users to 1–2 “aha moments” (e.g., generate first deck, apply firm theme, export to PPTX, share link).
   - Inspiration: Webflow checklist + contextual micro-tutorials (`webflow/11.png`, `webflow/12.png`, `webflow/13.png`).

2. **Offer a “Start method” chooser that includes AI + import pathways:**
   - Present mutually exclusive cards: **Generate with AI**, **Use template**, **Import existing deck**, **Blank**.
   - Inspiration: Webflow “Select a way to get started” (`webflow/07.png`), Gamma “Create with AI” start-method cards (`gamma_app/07.png`).

3. **Design for consultants: role-specific defaults + deliverable-oriented templates:**
   - Personalization should map to consultant workflows: *client deliverables, pitch decks, proposals, quarterly business reviews, transformation plans*.
   - Inspiration: Beautiful.ai “What kind of presentations will you create?” (`beautiful_ai/05.png`) and Gamma “What do you plan to do with Gamma?” (`gamma_app/05.png`).

---

## 2. Per-App Analysis

### A) Webflow (best-practice reference)

#### Onboarding flow walkthrough (from screenshots)
1. **Personalization entry:**
   - Modal card on top of product UI: “Personalize your Webflow experience…” with a progress bar at top.
   - **Name capture** (“What’s your name?” first + last). CTA: “Continue”. (`webflow/01.png`)

2. **Primary audience selection:**
   - “Who do you want to build websites for?” card choices: **My company / Myself / Clients (freelancer/agency)**.
   - CTA: Back/Continue. (`webflow/02.png`)

3. **Workplace type:**
   - “What best describes your workplace?” choices: Startup / Small business / Mid-size / Enterprise. (`webflow/03.png`)

4. **Company size:**
   - “How many people are employed at your workplace?” choices from 1–5 to 10,001+. (`webflow/04.png`)

5. **Project type / intent:**
   - “What type of site are you looking to build today?” Business / Ecommerce / Portfolio / Blog / Other. (`webflow/05.png`)

6. **Upsell / services question (optional + email opt-in):**
   - “Are you interested in hiring someone to help build your site today?” Yes/No/Don’t know.
   - Includes a marketing opt-in checkbox (subscribe to emails). (`webflow/06.png`)

7. **Start method chooser (activation fork):**
   - “Select a way to get started”: **AI site builder / Template / Blank site**.
   - Clear card descriptions; AI called out as fast path. (`webflow/07.png`)

8. **Template library browsing inside a large modal:**
   - Left-nav categories + “Recommended” plus numerous categories.
   - Main area shows grouped recommendations with “View all” links.
   - Pricing (Free / $) visible per template tile. (`webflow/08.png`)

9. **Name the site (final confirmation):**
   - Modal: “Name your site” with required field and “Create site”. (`webflow/09.png`)

10. **Loading/transition state:**
   - Full-screen brand + progress indicator line. (`webflow/10.png`)

11. **In-product onboarding (post-creation): activation checklist + feature education:**
   - **Checklist panel**: “Get started (1 of 8 complete!)” with a progress bar + 8 essential tasks.
   - Items include: Create a site, Change colors/fonts/classes, Replace images, Modify layout, Connect to CMS/dynamic data, Localization, video tutorials, Publish.
   - Separate top-right announcement/toast (“Design together… real-time collaboration…”). (`webflow/11.png`)

12–13. **Contextual micro-tutorial cards + checklist updates:**
   - A tutorial overlay card with embedded short video + short explanation + “Got it / Open tutorial”. (`webflow/12.png`, `webflow/13.png`)
   - Checklist reflects completion state (e.g., “3 of 8 complete!” in `webflow/13.png`).

14. **Product update modal (optional interrupt):**
   - “What’s new at Webflow” content feed with cards + CTAs.
   - Notably includes AI positioning (“Webflow connector in Claude”, “AI site builder evolved”). (`webflow/14.png`)

15. **Dashboard / workspace home:**
   - Clean dashboard with top nav (Dashboard/Marketplace/Learn/Resources), left workspace sidebar, and main “All sites” list.
   - Strong primary CTA: “+ New site”. Search, sorting, view toggles, “Invite”.
   - Banner for email verification at top. (`webflow/15.png`)

Additional:
- A bot-check / anti-automation screen appears (`webflow/error.png`, `webflow/v2-01.png`, `webflow/v2-02.png`). Not a design target, but a reminder that friction can appear unexpectedly.

#### Key design patterns identified
- **Centered modal w/ dimmed app chrome** during questionnaire steps.
- **Linear progress indicator** (thin bar) across the top of modal.
- **Card-based selection** for multi-choice questions; large hit targets; icon + label.
- **Back/Continue** controls consistently placed bottom-right.
- **Start method chooser** (AI / Template / Blank) to align to intent.
- **Template library** with left-side taxonomy + recommended groupings.
- **In-product activation checklist** with progress (“1 of 8 complete”) and scannable next actions.
- **Contextual tutorial overlays** (small embedded video, short copy, “Got it”).
- **Lifecycle messaging**: announcements/toasts and “What’s new” modal.

#### What works well
- **Separation of concerns:** personalization is short and skimmable, then users move quickly to a real workspace.
- **Activation checklist is a power move:** it turns complexity into a guided path and reduces “blank canvas paralysis.”
- **Contextual guidance is optional and dismissible**, allowing experts to move fast.
- **Information density is high but controlled** through panels, overlays, and progressive disclosure.

#### What doesn’t / risks to avoid
- **Onboarding length** can feel long (name + multiple firm questions + project type + hiring).
- **Some questions are Webflow-business-driven** rather than purely user-driven (e.g., hiring someone + email opt-in).
- **Interruptions stack up:** checklist panel + tutorial overlay + announcement toast can compete for attention (`webflow/11.png`–`webflow/13.png`).

#### UI patterns worth adopting for SlideHeroes
- **Activation checklist panel** with progress + a finite number of steps (6–10), each framed as an outcome.
- **Micro-tutorial overlay cards** with a 10–20s clip or GIF + “Got it” / “Learn more”.
- **Start method chooser** early: AI generate vs import vs template.
- **Template library IA:** recommended sets + left-nav categories.
- **Dashboard toolbar pattern:** search + sort + view toggle + “Invite” + strong primary CTA.

---

### B) Gamma

#### Onboarding flow walkthrough (from screenshots)
1. **Account creation screen:**
   - Left: form fields for email, first name, last name, language dropdown, password.
   - Right: collage of template/creation examples (high visual inspiration). (`gamma_app/01.png`)

2. **Intent: personal vs work vs education:**
   - “How do you plan to use Gamma?” cards: For personal use / For work / For education.
   - Soft gradient background, rounded container. (`gamma_app/02.png`)

3. **Role selection (broad taxonomy):**
   - “Which… best describes your role?” with many card options incl. **Consultant**, Marketing, Sales service, Engineering, Ops, etc.
   - Back link bottom-left. (`gamma_app/03.png`)

4. **Company size:**
   - “How many people work at your organization?” card grid: Just me, 2–10, 11–50, 51–500, 501–5000, 5001+.
   - Illustrated cards; consistent visual motif. (`gamma_app/04.png`)

5. **Use cases (multi-select):**
   - “What do you plan to do with Gamma? (Select all that apply)”
   - Options include: Create presentations from scratch; turn notes into presentations; enhance existing PowerPoints/PDF; build a website; create social media assets; generate images with AI; not sure yet.
   - Continue button bottom-right (disabled until selection). (`gamma_app/05.png`)

6. **Attribution question:**
   - “How did you hear about us?” with social channel options (YouTube, LinkedIn, etc.) incl. “AI tool”. (`gamma_app/06.png`)

7. **Post-onboarding home = AI start method chooser:**
   - “Create with AI — How would you like to get started?”
   - Cards: **Generate** (recommended), Paste in text, Generate from template (NEW), Import file or URL.
   - “Not sure? Start here!” tooltip with playful mascot.
   - Minimal top-left nav (Home) + bottom-right help icon. (`gamma_app/07.png`)

#### Key design patterns identified
- **Soft gradients + rounded large container** (friendly, modern, less “enterprise”).
- **Illustrated selection cards** to make otherwise-boring questions feel lightweight.
- **Role includes “Consultant” explicitly** (relevance to SlideHeroes ICP).
- **Multi-select use-case step** (important for tailoring AI flows).
- **AI start method chooser is the home screen**, not buried.

#### What works well
- **Fast path to value:** the home screen immediately offers AI creation modes (generate/paste/import).
- **Clear “recommended” tag** on the primary start method.
- **Tone is supportive** (“Not sure? Start here!”) reducing anxiety for new users.

#### What doesn’t / risks to avoid
- **Onboarding questionnaire is fairly long** (intent + role + size + use cases + attribution) before creation.
- **Attribution question** is business-driven and can feel like friction.
- UI is less information-dense; might feel less “professional tooling” for consultant deliverables (depending on brand goals).

#### UI patterns worth adopting for SlideHeroes
- **AI start method chooser** with 4 clear pathways (Generate / Paste outline / Use template / Import).
- **Recommended + New labels** on cards for guidance.
- **Consultant-specific role option** (or “Client services / Consulting”).
- **Multi-select use case step** to influence templates and default workflows.

---

### C) Beautiful.ai

#### Onboarding flow walkthrough (from screenshots)
1. **Sign-up entry:**
   - Clean landing-style signup form: work email + password.
   - SSO options (Google / Microsoft).
   - Primary CTA: “Start free trial”. (`beautiful_ai/01.png`)

2. **Work type (template recommendation driver):**
   - “What kind of work do you do?” options: Sales / Marketing / Educator or student / Other.
   - Minimal design, lots of whitespace, thin progress indicator at top. (`beautiful_ai/02.png`)

3. **Role granularity (content relevance driver):**
   - “What is your role?” options include Individual contributor, People manager, Department leader, Executive, Startup founder, **Consultant**, Freelancer, Solo-preneur.
   - Back arrow top-left; progress bar. (`beautiful_ai/03.png`)

4. **Company size:**
   - “How big is your company?” with small segmented options (Just me, 2–19, 20–49, 50–99, 100–199, 200+).
   - Very lightweight UI (no illustrations). (`beautiful_ai/04.png`)

5. **Presentation types (multi-select up to 3):**
   - “What kind of presentations will you create? (Select up to 3)”
   - Options: Sales pitches, customer deliverables, company meetings, conferences/events, fundraising decks, HR/training, personal use.
   - This is **closest to SlideHeroes’ consultant deliverables**. (`beautiful_ai/05.png`)

6. **Paywall / plan selection during onboarding:**
   - “Choose the plan that’s right for you”: Pro vs Team with features list.
   - CTA: “Try it free.” (`beautiful_ai/06.png`)

7. **Checkout (card required for trial):**
   - Full checkout page including billing summary; “Start free trial.” (`beautiful_ai/07.png`)

#### Key design patterns identified
- **Minimalist onboarding UI**: lots of whitespace, thin progress bar.
- **Consultant role included**.
- **Deliverable-type question** (select up to N) maps to template recommendation.
- **Early monetization gate** (plan + checkout) embedded in onboarding.

#### What works well
- **High signal questions** for presentation software: role + presentation types.
- **Constraint design** (“Select up to 3”) forces prioritization and yields better personalization.
- Clean, professional tone (fits B2B buyers).

#### What doesn’t / risks to avoid
- **Paywall friction occurs before users experience value**; requiring card details can reduce activation.
- Fewer visual cues; could feel sterile or less welcoming.

#### UI patterns worth adopting for SlideHeroes
- **“Select up to 3” deliverable types** to tailor template library and AI prompts.
- **Role and seniority** segmentation (consultant vs manager/executive) for tone and content depth.
- Minimalist progress indicator for wizard steps.

---

## 3. Cross-App Pattern Analysis

### Onboarding wizard patterns
**Common approaches**
- **Card-based selection** dominates (Webflow, Gamma, Beautiful.ai).
- **Progress indication** is present (Webflow: thin bar; Beautiful.ai: thin bar; Gamma: less explicit but consistent step container).
- **Personalization themes:**
  - Role/function (Gamma `03.png`, Beautiful.ai `03.png`)
  - Company size (all three: Webflow `04.png`, Gamma `04.png`, Beautiful.ai `04.png`)
  - Intended use cases (Gamma `05.png`, Beautiful.ai `05.png`, Webflow’s “site type” `05.png`)

**Notable differences**
- **Webflow**: personalization feeds into setup *and* then a guided checklist inside product.
- **Gamma**: personalization feeds into a “Create with AI” start screen—activation is front-and-center.
- **Beautiful.ai**: personalization quickly leads into monetization.

### Navigation patterns
- **Webflow dashboard:**
  - Global top nav + workspace left sidebar + content list in main area; strong “New” CTA (`webflow/15.png`).
- **Gamma:**
  - Minimal navigation in onboarding; post-onboarding home is a single focused start surface (`gamma_app/07.png`).
- **Beautiful.ai:**
  - Not enough dashboard screenshots here; onboarding is full-screen with a simple back arrow and progress.

### Color / typography systems
- **Webflow:** dark product chrome (editor) with white modal content; blue primary CTA.
- **Gamma:** friendly pastel gradient background; bold rounded heading typography; blue accent.
- **Beautiful.ai:** minimal white canvas; restrained blue accent; light, thin progress bar.

### Information hierarchy approaches
- **Single dominant question per screen** (all three). Large headline, short subtitle, then options.
- **Primary CTA** consistently bottom-right when present (Webflow, Gamma’s “Continue”, Beautiful.ai uses implicit selection rather than heavy buttons).
- **Labels like “Recommended” / “New”** reduce decision friction (Gamma `07.png`, Webflow `07.png`).

### Empty states and first-run experiences
- **Best-in-class first run = a focused “start” surface**:
  - Gamma’s “Create with AI” home is effectively a first-run empty state that immediately offers next actions (`gamma_app/07.png`).
  - Webflow’s editor includes an activation checklist to reduce blank-canvas overwhelm (`webflow/11.png`).
- **Webflow dashboard** provides clear “New site” CTA and list of existing sites (`webflow/15.png`).

---

## 4. Recommendations for SlideHeroes

### A) Onboarding flow design (step count, personalization, progressive disclosure)

**Recommended structure (6 steps max, then activate in-product):**
1. **Role / persona** (single select): Consultant / Analyst / Partner / Sales / Other.
   - Inspiration: Gamma role grid (`gamma_app/03.png`), Beautiful.ai role grid (`beautiful_ai/03.png`).

2. **Firm size** (single select): 1, 2–10, 11–50, 51–200+.
   - Keep ranges aligned to SlideHeroes ICP (5–50), but allow larger.
   - Inspiration: Webflow size step (`webflow/04.png`), Gamma (`gamma_app/04.png`).

3. **What are you creating right now?** (single select): Client deliverable / Pitch / Proposal / QBR / Strategy deck / Internal update.
   - Inspiration: Beautiful.ai “presentation types” with “select up to 3” mechanic (`beautiful_ai/05.png`).

4. **Starting point** (choose one): Generate with AI / Import existing PPTX / Start from template / Blank.
   - Inspiration: Webflow start method (`webflow/07.png`), Gamma create-with-AI start methods (`gamma_app/07.png`).

5. **Brand / theme preference** (lightweight): Use my firm theme (upload logo + pick colors) / Use a clean default / Decide later.
   - Progressive disclosure: do not force brand setup before first deck.

6. **Success criteria** (optional multi-select): Need it fast; Needs to look on-brand; Need strong narrative; Need charts/data; Need speaker notes.
   - Use this to tune AI prompts and default layout density.

**Progress + trust:**
- Use a thin progress bar (Webflow/Beautiful.ai pattern) + explicit “X of Y” when helpful.
- Avoid business-driven attribution questions (Gamma `06.png`) unless you can defer them.

### B) Dashboard / home screen layout

**SlideHeroes home should behave like Gamma’s focused start surface + Webflow’s dashboard power tools:**
- A **primary “Create” area** above the fold with 3–4 big start cards:
  - Generate with AI (Recommended)
  - Import PPTX
  - Start from a template
  - Paste outline/notes
- Below: “Recent decks”, “Shared with me”, “Firm templates”.
- Provide a strong primary CTA (like Webflow “+ New site” in `webflow/15.png`).

### C) Navigation structure
- Left sidebar for: Home, Decks, Templates, Firm Library, Brand/Themes, Team, Settings.
- Keep the creation funnel accessible from anywhere via persistent “Create” button.
- Avoid overwhelming top-level nav; consultants want speed.

### D) Visual design system (colors, typography, spacing)
- **Adopt Webflow’s clarity:** restrained palette, high contrast, clear typographic hierarchy.
- Use generous whitespace and consistent corner radius like Gamma/Beautiful.ai.
- Use **one primary accent color** (SlideHeroes brand) for CTA + progress.
- Prefer card-based selection controls for onboarding (large hit targets).

### E) AI-specific UX patterns (how competitors handle AI features)
- **Make AI an explicit start method, not a hidden feature**:
  - Webflow: “AI site builder” is one of three primary start options (`webflow/07.png`).
  - Gamma: “Create with AI” is the home headline (`gamma_app/07.png`).

**For SlideHeroes:**
- Present AI as a set of *workflows* (Generate from prompt, Paste outline, Import PPTX) rather than a single “AI” button.
- Use tags like **Recommended** and **New** to steer users.
- After the first generated deck, show an **activation checklist** to reach “consultant-ready” output:
  1) Generate first deck
  2) Apply firm theme
  3) Replace placeholders with client specifics
  4) Add 1 chart/table
  5) Export PPTX
  6) Share link with client
  - Inspiration: Webflow checklist structure (`webflow/11.png`).

---

## 5. Design Pattern Library (Adopt / Adapt / Skip)

| Pattern | App(s) | Screenshot reference | Adopt / Adapt / Skip | Notes for SlideHeroes |
|---|---|---|---|---|
| Thin progress indicator for multi-step wizard | Webflow, Beautiful.ai | `webflow/01.png`, `beautiful_ai/02.png` | **Adopt** | Low visual noise; supports “quick questions” framing. |
| Single-question-per-screen wizard | All | Multiple | **Adopt** | Keeps cognitive load low; pairs well with card options. |
| Card-based single-select options (large hit targets) | All | `webflow/02.png`, `gamma_app/02.png`, `beautiful_ai/03.png` | **Adopt** | Best for speed; mobile-friendly. |
| Company size segmentation | All | `webflow/04.png`, `gamma_app/04.png`, `beautiful_ai/04.png` | **Adopt** | Use ranges matching ICP (5–50) but allow others. |
| Role selection includes “Consultant” | Gamma, Beautiful.ai | `gamma_app/03.png`, `beautiful_ai/03.png` | **Adopt** | Strong fit; use as primary path to consultant-oriented templates. |
| Deliverable-type selection (“select up to 3”) | Beautiful.ai | `beautiful_ai/05.png` | **Adopt** | High-signal personalization; map to template sets + AI prompt defaults. |
| Multi-select use-case step | Gamma | `gamma_app/05.png` | **Adapt** | Include consultant options (proposal, QBR, strategy) + “import PPTX”. |
| Start method chooser (AI / template / blank / import) | Webflow, Gamma | `webflow/07.png`, `gamma_app/07.png` | **Adopt** | Critical to reduce mismatch between user intent and funnel. |
| Template library with left taxonomy + recommended groups | Webflow | `webflow/08.png` | **Adapt** | Replace categories with consultant deliverable taxonomy + industries. |
| “Recommended” tag on default option | Gamma | `gamma_app/07.png` | **Adopt** | Simple nudge; improves first-choice conversion. |
| In-product activation checklist with step count | Webflow | `webflow/11.png`, `webflow/13.png` | **Adopt** | Translate steps into consultant-ready output tasks. |
| Contextual micro-tutorial cards with short video | Webflow | `webflow/12.png`, `webflow/13.png` | **Adapt** | Use GIF/10s clips; ensure not too many overlays at once. |
| Post-login product update modal (“What’s new”) | Webflow | `webflow/14.png` | **Adapt** | Use sparingly; only when value-relevant (new templates, export modes). |
| Dashboard list view with search/sort/invite + strong New CTA | Webflow | `webflow/15.png` | **Adopt** | Consultants need fast retrieval and team collaboration. |
| Attribution question in onboarding | Gamma | `gamma_app/06.png` | **Skip** (or defer) | Business value, but adds friction before first value moment. |
| Forced payment + card for trial during onboarding | Beautiful.ai | `beautiful_ai/06.png`, `beautiful_ai/07.png` | **Skip** (for activation) | Consider later in lifecycle; prioritize first deck creation first. |
| Hiring/services question in onboarding | Webflow | `webflow/06.png` | **Skip** | Not aligned to SlideHeroes’ core user goal; feels like upsell. |

---

## Appendix: Quick Screenshot Index

### Webflow
- `webflow/01.png` Name capture
- `webflow/02.png` Build for (company/self/clients)
- `webflow/03.png` Workplace type
- `webflow/04.png` Employee count
- `webflow/05.png` Site type
- `webflow/06.png` Hire help + email opt-in
- `webflow/07.png` Start method chooser (AI/template/blank)
- `webflow/08.png` Template library modal
- `webflow/09.png` Name your site
- `webflow/10.png` Loading
- `webflow/11.png` Editor + checklist + announcement toast
- `webflow/12.png` Tutorial overlay + checklist
- `webflow/13.png` Replace images tutorial + checklist progress
- `webflow/14.png` What’s new modal
- `webflow/15.png` Dashboard / All sites
- `webflow/error.png` / `v2-01.png` / `v2-02.png` bot-check screen

### Gamma
- `gamma_app/01.png` Create account
- `gamma_app/02.png` Use intent (personal/work/education)
- `gamma_app/03.png` Role selection (includes Consultant)
- `gamma_app/04.png` Company size
- `gamma_app/05.png` Use cases (multi-select)
- `gamma_app/06.png` Attribution
- `gamma_app/07.png` Create with AI start methods

### Beautiful.ai
- `beautiful_ai/01.png` Signup + SSO
- `beautiful_ai/02.png` Work type
- `beautiful_ai/03.png` Role (includes Consultant)
- `beautiful_ai/04.png` Company size
- `beautiful_ai/05.png` Presentation types (select up to 3)
- `beautiful_ai/06.png` Plan selection
- `beautiful_ai/07.png` Checkout
