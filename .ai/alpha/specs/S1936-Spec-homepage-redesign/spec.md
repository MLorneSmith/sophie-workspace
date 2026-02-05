# Project Specification: Homepage Redesign with Design System

## Metadata
| Field | Value |
|-------|-------|
| **Spec ID** | S1936 |
| **GitHub Issue** | #1936 |
| **Document Owner** | Claude |
| **Created** | 2026-02-04 |
| **Status** | Draft |
| **Version** | 0.1 |

---

## 1. Executive Summary

### One-Line Description
A comprehensive homepage redesign implementing a dark-mode-first design system with 12 sections, scroll-triggered animations, and modern SaaS landing page patterns.

### Press Release Headline
> "SlideHeroes launches industry-leading homepage experience enabling professionals to discover AI-powered presentation tools through an immersive, high-converting marketing experience"

### Elevator Pitch (30 seconds)
SlideHeroes is redesigning its marketing homepage to achieve top 0.1% design quality. The redesign introduces a cohesive dark-mode design system with premium animations, adds four new sections (Statistics, How It Works, Comparison, Final CTA), and modernizes existing sections with scroll-triggered animations, number counters, masonry grids, and glass-card aesthetics inspired by Linear, Cargo, and OrbitAI.

---

## 2. Problem Statement

### Problem Description
The current homepage, while functional, lacks the premium visual polish and conversion optimization patterns used by best-in-class SaaS companies. It doesn't effectively communicate the full value proposition or guide visitors through a compelling journey from awareness to conversion.

### Who Experiences This Problem?
- **First-time visitors**: Professionals discovering SlideHeroes who need to quickly understand the value proposition
- **Evaluators**: Decision-makers comparing SlideHeroes to alternatives who need clear differentiation
- **Returning visitors**: Users considering upgrade who need reinforcement of value

### Current Alternatives
- Current homepage has 7 sections but lacks statistics, process explanation, and comparison content
- Testimonials exist but are fetched from database; grid layout could be more impactful
- Animations exist (Aceternity components) but not consistently applied across all sections
- Dark mode is supported but not the default, missing the premium aesthetic

### Impact of Not Solving
- **Business impact**: Lower conversion rates compared to competitors with premium homepages
- **User impact**: Visitors may not fully understand the product's value and leave without engaging
- **Competitive impact**: Competitors with better homepages (Linear, Notion) set higher expectations

---

## 3. Vision & Goals

### Product Vision
A homepage that immediately communicates SlideHeroes' premium positioning, guides visitors through a compelling narrative from problem to solution, and converts at industry-leading rates through strategic social proof, clear differentiation, and compelling calls-to-action.

### Primary Goals (SMART)

| Goal | Success Metric | Target | Measurement Method |
|------|---------------|--------|-------------------|
| G1: Increase time on page | Average session duration on homepage | +40% vs current baseline | PostHog analytics |
| G2: Improve scroll depth | Users reaching final CTA section | 60% of visitors | PostHog scroll tracking |
| G3: Boost primary CTA clicks | Click rate on "Start Writing Free" | +25% vs current | PostHog event tracking |
| G4: Reduce bounce rate | Single-page sessions without interaction | -20% vs current | PostHog analytics |

### Strategic Alignment
This redesign supports SlideHeroes' positioning as a premium AI-powered presentation platform targeting consulting, sales, and investor presentation professionals who expect polished, high-quality tools.

---

## 4. Target Users

### Primary Persona
**Name**: Executive Emma
**Role**: Senior Manager/Director at consulting firm or corporate strategy team
**Goals**: Create compelling presentations for C-suite executives quickly
**Pain Points**: Generic AI tools don't understand business presentation structure; no time for design courses
**Quote**: "I need to make my presentations as professional as my ideas, but I don't have 10 hours to spend on slides."

### Secondary Personas
- **Sales Sam**: Enterprise sales professional creating pitch decks for million-dollar deals
- **Founder Frank**: Startup founder preparing investor pitch decks with limited resources

### Anti-Personas (Who This Is NOT For)
- Casual users creating personal slideshows
- Students making school presentations
- Users looking for free-forever tools with no intent to upgrade

---

## 5. Solution Overview

### Proposed Solution
A complete homepage redesign implementing:
1. A comprehensive dark-mode-first design system with custom CSS variables
2. 12 sections total (8 existing redesigned + 4 new sections)
3. Scroll-triggered animations using Framer Motion
4. Modern UI patterns: glass cards, spotlight effects, number counters, masonry grids

### Key Capabilities

1. **Hero Section (Redesigned)**: Full-viewport hero with animated text reveal, gradient background orbs, social proof micro-strip, and prominent dual CTAs
2. **Product Preview (Redesigned)**: Browser-frame mockup with perspective tilt, gradient border animation, glow effects
3. **Logo Cloud (Redesigned)**: Continuous marquee animation with grayscale-to-color hover, gradient edge fades
4. **Statistics Section (NEW)**: 4-column animated number counters with scroll-triggered count-up animations
5. **Sticky Scroll Features (Redesigned)**: Enhanced with numbered overlines, progress indicators, parallax images
6. **How It Works Section (NEW)**: 4-step horizontal stepper with animated connecting line and icon containers
7. **Features Grid (Redesigned)**: Bento grid layout with asymmetric cards, spotlight hover effects
8. **Comparison Section (NEW)**: Side-by-side "Without/With SlideHeroes" cards with animated checkmarks
9. **Testimonials (Redesigned)**: Enhanced masonry grid with glass cards, featured quote spanning, staggered animations
10. **Pricing (Redesigned)**: Glass card pricing tiers with recommended highlight, animated price counters
11. **Blog/Reads (Redesigned)**: Taller cards with image hover zoom, category badges, read time meta
12. **Final CTA Section (NEW)**: Full-width closing section with large gradient orb, trust badges, prominent CTAs

### Customer Journey

1. **Hook** (Hero): Visitor arrives, immediately understands value prop through animated headline and sees social proof
2. **Validate** (Product Preview + Logo Cloud): Sees product in action, recognizes trusted brands
3. **Quantify** (Statistics): Concrete numbers build credibility
4. **Understand** (Sticky Scroll + How It Works): Deep dive into offerings and process
5. **Differentiate** (Features + Comparison): Clear reasons to choose SlideHeroes
6. **Trust** (Testimonials): Social proof from real users
7. **Convert** (Pricing + Final CTA): Clear path to getting started

### Hypothetical Customer Quote
> "I knew SlideHeroes was different the moment I landed on their site. The design was as polished as the presentations I want to create."
> — Executive Emma, Strategy Director

### Responsive Behavior

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| Mobile (<768px) | Single column, stacked sections | Statistics: 2x2 grid, Stepper: vertical, Features: single column |
| Tablet (768-1024px) | 2-column layouts | Testimonials: 2-col masonry, Features: 2-col grid |
| Desktop (>1024px) | Full layouts | Statistics: 4-col, Testimonials: 4-col masonry, Features: bento grid |

---

## 6. Scope Definition

### In Scope

- [x] Design system CSS variables implementation (colors, typography, spacing, animations)
- [x] All 12 homepage sections (8 redesigned + 4 new)
- [x] Scroll-triggered animations using Framer Motion
- [x] Number counter animations for statistics
- [x] Glass card and spotlight card components
- [x] Masonry grid for testimonials (pulling from existing Supabase table)
- [x] Dark mode as default (with existing light mode toggle support)
- [x] Mobile-responsive design for all sections
- [x] Accessibility compliance (prefers-reduced-motion, WCAG contrast)

### Out of Scope

- [ ] New database tables or schema changes (testimonials table already exists)
- [ ] CMS integration for homepage content (will use static content config)
- [ ] A/B testing infrastructure
- [ ] Video hero variant (static/image only)
- [ ] Internationalization of homepage copy
- [ ] Analytics event implementation (existing PostHog covers this)

### Future Considerations (v2+)
- Video testimonials integration
- Interactive product demo component
- Personalized hero based on referrer/UTM
- Multi-language homepage variants

---

## 7. Technical Context

### System Integration Points

| System | Integration Type | Notes |
|--------|-----------------|-------|
| `testimonials` table (Supabase) | Database query | Existing table with RLS, fetches approved testimonials with rating >= 3 |
| `@kit/billing-gateway/marketing` | Component import | `PricingTable` component for pricing section |
| `homepageContentConfig` | Config object | Located at `apps/web/config/homepage-content.config.ts` |
| `framer-motion` v12.23.25 | Animation library | Already in `packages/ui/package.json` |
| `react-fast-marquee` | Marquee animation | Already used in logo cloud |

### Technical Constraints

- **Performance**: Hero LCP < 2.5s, total page weight < 1MB initial, animations must not cause jank (use GPU-accelerated transforms)
- **Security**: No new RLS policies needed (testimonials already protected)
- **Compliance**: WCAG AA color contrast (4.5:1 for text), prefers-reduced-motion support
- **Scalability**: Server components for data fetching, client components only for interactive elements

### Technology Preferences/Mandates

- CSS Variables for design tokens (extend existing `shadcn-ui.css`)
- Framer Motion for all animations (already in use)
- Tailwind CSS 4 utilities
- Server Components for initial data fetching
- Dynamic imports for heavy animation components

### Dependencies

| Dependency | Owner | Risk Level | Notes |
|------------|-------|------------|-------|
| Framer Motion v12 | npm | Low | Already installed and working |
| Testimonials data | Database | Low | Table exists with seed data |
| Design system file | Dev team | Medium | New CSS variables must be added |

---

## 8. Assumptions & Risks

### Key Assumptions

1. **Dark mode toggle already works**: The existing `next-themes` implementation will correctly handle dark-as-default — *Validation: Test mode toggle after implementation*
2. **Testimonials exist in database**: Seed data or real testimonials are available — *Validation: Query testimonials table*
3. **Framer Motion animations are performant**: GPU-accelerated transforms won't cause jank — *Validation: Lighthouse performance audit*
4. **Content is finalized**: Homepage copy in brainstorm document is approved — *Validation: User confirmed*

### Risk Register

| ID | Risk | Probability | Impact | Mitigation | Owner |
|----|------|-------------|--------|------------|-------|
| R1 | Animation performance issues on low-end devices | Medium | High | Use `prefers-reduced-motion`, test on throttled CPU | Dev |
| R2 | Dark mode colors fail WCAG contrast | Low | Medium | Use contrast checker during implementation | Dev |
| R3 | Large hero images slow LCP | Medium | High | Use Next.js Image with priority, optimize images | Dev |
| R4 | Scope creep from "polish" requests | Medium | Medium | Strict adherence to spec sections | PM |

### Open Questions

1. [x] What placeholder statistics to use? — **Answered: Use estimates (2,000+, 50,000+, 4.9/5, 85%)**
2. [x] Dark mode only or both modes? — **Answered: Both modes, dark as default**
3. [x] Testimonial source? — **Answered: Existing Supabase table, review current implementation**

---

## 9. Success Criteria

### Definition of Done (Project Level)

- [ ] All 12 sections implemented and visually matching design spec
- [ ] Dark mode is default, light mode toggle works
- [ ] All animations work smoothly (60fps on mid-tier devices)
- [ ] Mobile responsive at all breakpoints
- [ ] Lighthouse performance score > 90
- [ ] Lighthouse accessibility score > 95
- [ ] No TypeScript errors, lint passes

### Launch Criteria

- [ ] Visual QA on Chrome, Firefox, Safari (desktop + mobile)
- [ ] Performance audit passes (LCP < 2.5s)
- [ ] Accessibility audit passes (axe-core, keyboard navigation)
- [ ] Stakeholder sign-off on design fidelity

### Post-Launch Validation

| Metric | Baseline | Target | Timeframe |
|--------|----------|--------|-----------|
| Time on page | TBD (measure pre-launch) | +40% | 2 weeks post-launch |
| Scroll depth to Final CTA | TBD | 60% | 2 weeks post-launch |
| Primary CTA click rate | TBD | +25% | 2 weeks post-launch |

---

## 10. Decomposition Hints

### Standard Initiative Categories to Consider

1. **Foundation/Layout** (P0) - Design system CSS variables, page structure, container widths
2. **Data Layer** (P0) - Testimonials loader, homepage content config updates
3. **Core Components** (P1) - New section components, reusable animated components
4. **Integrations** (P1) - Framer Motion scroll triggers, number counters
5. **Polish & Edge Cases** (P2) - Loading states, error boundaries, reduced motion

### Candidate Initiatives

1. **Design System Foundation**: Implement CSS variables for colors, typography, spacing, animations; update Tailwind config
2. **Hero & Product Preview**: Full-viewport hero with animated reveal, product frame with perspective
3. **Trust Elements**: Logo cloud marquee, statistics counters, testimonials masonry
4. **Value Proposition**: Sticky scroll features, how-it-works stepper, features bento grid
5. **Conversion Optimization**: Comparison section, pricing redesign, final CTA
6. **Content & Polish**: Blog section, loading states, accessibility, performance optimization

### Suggested Priority Order

| Priority | Initiative | Rationale |
|----------|------------|-----------|
| P0 | Design System Foundation | All components depend on design tokens |
| P0 | Data Layer (testimonials loader) | Required for testimonials section |
| P1 | Hero & Product Preview | Above-the-fold, highest impact |
| P1 | Trust Elements (Logo, Stats, Testimonials) | Critical for credibility |
| P1 | Value Proposition (Sticky, How It Works, Features) | Core content sections |
| P2 | Conversion (Comparison, Pricing, Final CTA) | Can launch without but important |
| P2 | Content & Polish (Blog, Edge Cases) | Final refinements |

### Complexity Indicators

| Area | Complexity | Rationale |
|------|------------|-----------|
| Design System | Medium | Extending existing CSS variables in `shadcn-ui.css`, well-documented patterns |
| Number Counter | Medium | Custom implementation with `useInView` + `useSpring`, per research docs |
| Masonry Grid | Low | Aceternity component exists at `packages/ui/src/aceternity/testimonial-masonary-grid.tsx` |
| Sticky Scroll | Low | Existing component at `packages/ui/src/aceternity/sticky-scroll-reveal.tsx` |
| How It Works Stepper | Medium | New component, but follows standard patterns |
| Comparison Section | Low | Static content, simple card layout |
| Bento Grid | Medium | Asymmetric grid requires careful CSS grid work |

---

## 11. Appendices

### A. Glossary

| Term | Definition |
|------|------------|
| **Glass Card** | Card with semi-transparent background, backdrop blur, and subtle border |
| **Spotlight Effect** | Radial gradient that follows cursor position on hover |
| **Bento Grid** | Asymmetric grid layout where some cards span multiple columns/rows |
| **Masonry Grid** | Grid where items have variable heights, filling vertical space efficiently |
| **LCP** | Largest Contentful Paint - Core Web Vital measuring load performance |

### B. Codebase Exploration Results (REQUIRED)

| Component/Pattern Found | File Path | Reusable? | Notes |
|------------------------|-----------|-----------|-------|
| BackgroundBoxes | `packages/ui/src/aceternity/background-boxes.tsx` | Yes | Hero background animation |
| CardSpotlight | `packages/ui/src/aceternity/card-spotlight.tsx` | Yes | Feature cards with spotlight |
| StickyScrollReveal | `packages/ui/src/aceternity/sticky-scroll-reveal.tsx` | Yes | Sticky feature section |
| ContainerScrollAnimation | `packages/ui/src/aceternity/container-scroll-animation.tsx` | Yes | Product preview animation |
| LogoMarquee | `packages/ui/src/aceternity/logo-marquee.tsx` | Yes | Logo cloud section |
| TestimonialsMasonaryGrid | `packages/ui/src/aceternity/testimonial-masonary-grid.tsx` | Yes | Testimonials layout |
| Hero | `packages/ui/src/makerkit/marketing/hero.tsx` | Pattern only | Marketing hero pattern |
| GradientText | `packages/ui/src/makerkit/marketing/gradient-text.tsx` | Yes | Gradient text effect |
| SecondaryHero | `packages/ui/src/makerkit/marketing/secondary-hero.tsx` | Yes | Section headers |
| homepageContentConfig | `apps/web/config/homepage-content.config.ts` | Yes | Content configuration |
| Current homepage | `apps/web/app/(marketing)/page.tsx` | Pattern only | Structure reference |
| Theme CSS | `apps/web/styles/shadcn-ui.css` | Extend | Design token location |
| Typography CSS | `apps/web/styles/theme.css` | Extend | Typography scale |

**Tables/Schemas Identified:**

| Table Name | Location | Purpose |
|------------|----------|---------|
| `testimonials` | `apps/web/supabase/migrations/20250210190138_web_testimonials.sql` | Stores customer testimonials with ratings, status |

**Testimonials Schema:**
- `id`: UUID primary key
- `customer_name`: VARCHAR(255) NOT NULL
- `customer_company_name`: VARCHAR(255)
- `customer_avatar_url`: VARCHAR(255)
- `content`: VARCHAR(5000) NOT NULL
- `rating`: INTEGER (1-5)
- `status`: ENUM ('pending', 'approved', 'rejected')

### C. Research Integration (REQUIRED)

| Research File | Key Findings | Spec Section(s) Affected |
|--------------|--------------|-------------------------|
| `context7-framer-motion-scroll.md` | 1. `useInView` hook with `once: true` for scroll triggers; 2. Counter animations via `useSpring` + `useMotionValue`; 3. `whileInView` + `stagger()` for lists; 4. Import from `motion/react-client` for tree-shaking; 5. `MotionConfig reducedMotion="user"` for accessibility | Section 5 (Key Capabilities), Section 7 (Technical Context), Section 10 (Complexity) |
| `perplexity-saas-homepage-patterns.md` | 1. Hero must load <3s with clear UVP; 2. Limit stats to 3-5 animated counters; 3. Logo bars with 6-12 clients, grayscale-to-color hover; 4. How It Works: 3-5 numbered steps; 5. Comparison tables need consistent attributes; 6. Masonry: 4-6 cols desktop, variable heights; 7. Dark gray (not pure black) for backgrounds | Section 5 (Solution Overview), Section 7 (Technical Constraints), Section 10 (Candidate Initiatives) |

### D. External References

- **Inspiration sites**: Linear.app, Cargo.ai, Formless.xyz, OrbitAI, Pre.dev
- **Design spec source**: `.ai/reports/brainstorming/2026-02-04-homepage-redesign-design-system.md`
- **Framer Motion docs**: https://motion.dev/docs/react
- **SaaS homepage inspiration**: Saaspo, HUEMOR, Webflow galleries

### E. Visual Assets

**ASCII Layout Mockup:**

```
┌────────────────────────────────────────────────────────────────────────┐
│                          HERO SECTION (100vh)                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │   [Pill Badge: AI-Powered Presentation Platform]                 │  │
│  │                                                                  │  │
│  │   Write more impactful presentations ════faster════              │  │
│  │                         (gradient text + underline)              │  │
│  │                                                                  │  │
│  │   AI-powered writing canvas, video training, private coaching    │  │
│  │                                                                  │  │
│  │   [Start Writing Free]  [Watch Demo]                             │  │
│  │                                                                  │  │
│  │   👤👤👤👤👤 Join 2,000+ professionals                           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                      (Background: gradient orbs + grid)                │
├────────────────────────────────────────────────────────────────────────┤
│                       PRODUCT PREVIEW SECTION                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ┌─────────────────────────────────────────────────────────────┐ │  │
│  │  │ ● ● ●  SlideHeroes Canvas                                   │ │  │
│  │  ├─────────────────────────────────────────────────────────────┤ │  │
│  │  │                                                             │ │  │
│  │  │               [Product Screenshot/Video]                    │ │  │
│  │  │               (3D perspective tilt effect)                  │ │  │
│  │  │                                                             │ │  │
│  │  └─────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                      (Glow effect underneath frame)                    │
├────────────────────────────────────────────────────────────────────────┤
│                        LOGO CLOUD SECTION                              │
│  ──────────────────────────────────────────────────────────────────    │
│    Trusted by professionals at                                         │
│    [Logo] [Logo] [Logo] [Logo] [Logo] [Logo] ◀══════ marquee ═══════▶  │
│  ──────────────────────────────────────────────────────────────────    │
├────────────────────────────────────────────────────────────────────────┤
│                      STATISTICS SECTION (NEW)                          │
│                                                                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │    2,000+    │ │   50,000+    │ │    4.9/5     │ │     85%      │  │
│  │ Professionals│ │ Presentations│ │   Rating     │ │  Time Saved  │  │
│  │   trained    │ │   created    │ │ (from 200+)  │ │  on average  │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
│                   (Numbers count up on scroll into view)               │
├────────────────────────────────────────────────────────────────────────┤
│                   STICKY SCROLL FEATURES SECTION                       │
│  ┌────────────────────────────────┬───────────────────────────────┐   │
│  │  Everything you need to create │                               │   │
│  │     winning presentations      │                               │   │
│  ├────────────────────────────────┤                               │   │
│  │  01 / 03                       │     ┌─────────────────────┐   │   │
│  │  AI-Powered Writing Canvas     │     │                     │   │   │
│  │  ✓ AI writing canvas           │     │   [Feature Image]   │   │   │
│  │  ✓ Fine-tuned, task-specific   │     │   (sticky scroll)   │   │   │
│  │  ✓ Proven methodologies        │     │                     │   │   │
│  │  Learn more →                  │     └─────────────────────┘   │   │
│  └────────────────────────────────┴───────────────────────────────┘   │
├────────────────────────────────────────────────────────────────────────┤
│                     HOW IT WORKS SECTION (NEW)                         │
│                                                                        │
│        ①───────────────②───────────────③───────────────④              │
│     Assemble        Outline       Storyboard       Produce             │
│                                                                        │
│     [Icon]          [Icon]          [Icon]          [Icon]             │
│     Gather your     Structure       Transform       Export polished    │
│     research...     your argument   your outline    slides ready...    │
│                                                                        │
│               (Line draws left-to-right on scroll)                     │
├────────────────────────────────────────────────────────────────────────┤
│                      FEATURES GRID SECTION                             │
│                     How we are different                               │
│                                                                        │
│  ┌─────────────────────────────┬──────────────┬──────────────┐        │
│  │        Fine-tuned AI        │   Proven     │   Instant    │        │
│  │    (Large spotlight card)   │ Methodology  │   Access     │        │
│  │                             │              │              │        │
│  ├──────────────┬──────────────┴──────────────┼──────────────┤        │
│  │Certification │     Private Coaching        │  30-Day      │        │
│  │              │    (Large spotlight card)   │  Guarantee   │        │
│  └──────────────┴─────────────────────────────┴──────────────┘        │
│                        (Bento grid layout)                             │
├────────────────────────────────────────────────────────────────────────┤
│                     COMPARISON SECTION (NEW)                           │
│                       Why SlideHeroes?                                 │
│                                                                        │
│  ┌─────────────────────────────┬─────────────────────────────┐        │
│  │   Without SlideHeroes       │   With SlideHeroes          │        │
│  │   ─────────────────────     │   ─────────────────────     │        │
│  │   ✗ Hours of blank page     │   ✓ Minutes to first draft  │        │
│  │   ✗ Inconsistent structure  │   ✓ Proven frameworks       │        │
│  │   ✗ Generic AI outputs      │   ✓ Presentation-specific   │        │
│  │   ✗ No guidance on delivery │   ✓ Expert training included│        │
│  │   (muted styling)           │   (accent glow, checkmarks) │        │
│  └─────────────────────────────┴─────────────────────────────┘        │
├────────────────────────────────────────────────────────────────────────┤
│                      TESTIMONIALS SECTION                              │
│                     What our Users Say                                 │
│                                                                        │
│  ┌─────────┬─────────┬─────────────────────┬─────────┐                │
│  │ Quote 1 │ Quote 2 │    Featured Quote    │ Quote 4 │                │
│  │  ★★★★★  │  ★★★★☆  │    (spans 2 cols)    │  ★★★★★  │                │
│  │ Avatar  │ Avatar  │       Avatar         │ Avatar  │                │
│  ├─────────┼─────────┼─────────┬───────────┼─────────┤                │
│  │ Quote 5 │ Quote 6 │ Quote 7 │  Quote 8  │ Quote 9 │                │
│  │  ★★★★★  │  ★★★★★  │  ★★★★☆  │   ★★★★★   │  ★★★★★  │                │
│  └─────────┴─────────┴─────────┴───────────┴─────────┘                │
│                      (4-column masonry grid)                           │
├────────────────────────────────────────────────────────────────────────┤
│                        PRICING SECTION                                 │
│              Fair pricing for all types of businesses                  │
│                                                                        │
│  [Monthly]  [Annual - Save 20%]                                        │
│                                                                        │
│  ┌──────────────┐  ┌────────────────────┐  ┌──────────────┐           │
│  │    Free      │  │  ⭐ Professional   │  │   Enterprise │           │
│  │   $0/mo      │  │     $29/mo         │  │   Contact Us │           │
│  │              │  │  (Most Popular)    │  │              │           │
│  │ ✓ Feature    │  │  ✓ All Free +      │  │ ✓ All Pro +  │           │
│  │ ✓ Feature    │  │  ✓ Feature         │  │ ✓ Custom     │           │
│  │              │  │  ✓ Feature         │  │              │           │
│  │ [Start Free] │  │ [Get Started]      │  │ [Contact]    │           │
│  └──────────────┘  └────────────────────┘  └──────────────┘           │
│                     (Glass cards, glow on recommended)                 │
├────────────────────────────────────────────────────────────────────────┤
│                     BLOG/READS SECTION                                 │
│         Go Deeper, Learn Faster with these Essential Reads             │
│                                                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│  │ [Image 16:9]    │  │ [Image 16:9]    │  │ [Image 16:9]    │        │
│  │ [Guide]         │  │ [Tutorial]      │  │ [Guide]         │        │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤        │
│  │ McKinsey-style  │  │ Pitch Decks &   │  │ BCG Teardown    │        │
│  │ Business...     │  │ Funding...      │  │ Review...       │        │
│  │ 15 min read     │  │ 12 min read     │  │ 18 min read     │        │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘        │
│                    (Hover: image zoom, card lift)                      │
├────────────────────────────────────────────────────────────────────────┤
│                      FINAL CTA SECTION (NEW)                           │
│                                                                        │
│                           ·  · ·  ·                                    │
│                       ·      ◉       ·                                 │
│                          (glow orb)                                    │
│                                                                        │
│            Ready to transform your presentations?                      │
│                                                                        │
│        Join thousands of professionals who present                     │
│                      with confidence                                   │
│                                                                        │
│           [Start Writing Free]  [Book a Demo]                          │
│                                                                        │
│        ✓ No credit card    ✓ Free plan    ✓ Cancel anytime            │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### F. Decision Log

| Date | Decision | Rationale | Decided By |
|------|----------|-----------|------------|
| 2026-02-04 | All 12 sections in MVP | User confirmed complete redesign preferred | User |
| 2026-02-04 | Use placeholder statistics | Real metrics not available yet | User |
| 2026-02-04 | Dark mode default, light mode supported | Existing toggle works, matches design spec | User |
| 2026-02-04 | Testimonials from existing DB | Table already exists with RLS | Code exploration |
| 2026-02-04 | Framer Motion for animations | Already in use, research confirms best practices | Research |
