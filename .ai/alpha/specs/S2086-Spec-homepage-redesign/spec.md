# Project Specification: Homepage Redesign

## Metadata
| Field | Value |
|-------|-------|
| **Spec ID** | S2086 |
| **GitHub Issue** | #2086 |
| **Document Owner** | msmith |
| **Created** | 2026-02-13 |
| **Status** | Draft |
| **Version** | 0.1 |

---

## 1. Executive Summary

### One-Line Description
Complete redesign of the SlideHeroes marketing homepage with a dark-mode-first design system, 12 sections (4 new + 8 redesigned), Framer Motion animations, and glass morphism effects.

### Press Release Headline
> "SlideHeroes launches redesigned homepage with premium dark-mode design, scroll-triggered animations, and conversion-optimized section flow"

### Elevator Pitch (30 seconds)
The current SlideHeroes homepage uses a functional but dated design. This redesign transforms it into a top-tier SaaS landing page with a dark-mode-first aesthetic inspired by Linear, Cargo, and OrbitAI. It introduces 4 new sections (Statistics, How It Works, Comparison, Final CTA), redesigns 8 existing sections with glass card components and scroll-triggered Framer Motion animations, and implements a comprehensive dark-mode design system with the #24a9e0 cyan accent.

---

## 2. Problem Statement

### Problem Description
The current homepage has a functional layout but lacks the visual polish, animation quality, and conversion optimization of top-tier SaaS landing pages. The design doesn't fully leverage the dark-mode aesthetic that has become standard for premium developer/productivity tools.

### Who Experiences This Problem?
- Potential customers visiting the marketing site for the first time
- The marketing team trying to improve conversion rates
- The brand, which needs to project premium quality

### Current Alternatives
The current homepage has 8 sections (Hero, Product Preview, Logo Cloud, Sticky Scroll Features, Features Grid, Testimonials, Pricing, Blog) built with Aceternity animation components and basic Tailwind styling. It works but doesn't match the visual quality of competitors like Gamma, Pitch, or Beautiful.ai.

### Impact of Not Solving
- **Business impact**: Lower conversion rates compared to polished competitors
- **User impact**: First impression doesn't match product quality
- **Competitive impact**: Falls behind modern SaaS homepage standards

---

## 3. Vision & Goals

### Product Vision
A homepage that immediately conveys premium quality, builds trust through social proof and metrics, clearly communicates the product's value proposition, and converts visitors through strategically placed CTAs - all with a cohesive dark-mode-first design language.

### Primary Goals (SMART)

| Goal | Success Metric | Target | Measurement Method |
|------|---------------|--------|-------------------|
| G1: Improve visual quality | Design quality perception | Top-tier SaaS standard (subjective review) | Manual comparison with Linear, Cargo references |
| G2: Increase page engagement | Average scroll depth | +30% vs current baseline | Analytics scroll depth tracking |
| G3: Improve conversion rate | CTA click-through rate | +20% vs current baseline | Analytics click tracking on primary CTAs |
| G4: Maintain performance | Core Web Vitals scores | LCP <2.5s, CLS <0.1, INP <200ms | Lighthouse / PageSpeed Insights |
| G5: Ensure accessibility | WCAG AA compliance | 100% AA, 80% AAA contrast ratios | Lighthouse accessibility audit |

### Strategic Alignment
This redesign directly supports SlideHeroes' brand positioning as a premium, AI-powered presentation platform. A polished homepage is critical for converting the paid traffic and organic visitors that the marketing team is driving.

---

## 4. Target Users

### Primary Persona
**Name**: Sarah, the Corporate Presenter
**Role**: Senior Manager / Director at a Fortune 500 company
**Goals**: Create high-stakes presentations faster, look professional, impress stakeholders
**Pain Points**: Spends 8+ hours on important decks, struggles with design, generic AI tools produce mediocre output
**Quote**: "I need something that makes my presentations look like they were designed by a pro, in a fraction of the time."

### Secondary Personas
- **Tom, the Consultant**: Creates 3-5 client presentations per week, values speed and consistency
- **Maria, the Startup Founder**: Preparing pitch decks, needs to look credible despite limited design resources

### Anti-Personas (Who This Is NOT For)
- Casual users making personal slideshows
- Students doing class presentations (not the target market)
- Enterprise procurement teams (they visit pricing/features pages, not homepage)

---

## 5. Solution Overview

### Proposed Solution
A complete homepage redesign implementing 12 sections with a unified dark-mode design system, glass morphism effects, scroll-triggered Framer Motion animations, and conversion-optimized CTA placement.

### Key Capabilities

1. **Dark Mode Design System**: Near-black backgrounds (#0a0a0f), cyan accent (#24a9e0), glass card components, gradient text effects, and noise/grid texture overlays
2. **Hero Section (Redesigned)**: Full-viewport hero with letter-by-letter text reveal, gradient orb background, pill badge, dual CTAs (Start Writing Free + Watch Demo), social proof micro-strip
3. **Product Preview (Redesigned)**: Static screenshot in browser-style frame with glass card styling, gradient border animation, glow beneath frame
4. **Logo Cloud (Redesigned)**: Continuous marquee with grayscale logos, hover-to-reveal, gradient edge fades
5. **Statistics Section (NEW)**: 4 animated stat blocks with count-up animation on viewport entry, accent-colored numbers
6. **Sticky Scroll Features (Redesigned)**: Two-column layout (40/60) with numbered overlines, vertical progress indicator, device-framed images
7. **How It Works (NEW)**: 4-step horizontal stepper (Assemble → Outline → Storyboard → Produce) with connecting line animation
8. **Features Grid (Redesigned)**: Bento grid with 2 large + 4 standard cards, glass + spotlight styling, cursor-following glow
9. **Comparison Section (NEW)**: Side-by-side "Without vs With SlideHeroes" cards with checkmark/cross animations
10. **Testimonials (Redesigned)**: Masonry grid with glass cards, decorative accent quotation marks, featured spanning testimonial
11. **Pricing (Redesigned)**: Monthly/annual toggle, 3-tier cards with highlighted "Most Popular" tier, glass card styling
12. **Blog/Essential Reads (Redesigned)**: 3-column grid with image thumbnails, category badges, hover-to-zoom
13. **Final CTA (NEW)**: Full-width closing section with gradient orb, headline, dual CTAs, trust badges row

### Customer Journey

1. **Hero**: Visitor sees headline, understands value prop, notices social proof strip
2. **Product Preview**: Sees the product in action, builds confidence in quality
3. **Logo Cloud + Statistics**: Trust signals and credibility metrics build confidence
4. **Sticky Scroll + How It Works**: Understands the three core offerings and the 4-step process
5. **Features Grid + Comparison**: Understands differentiators and sees clear contrast with alternatives
6. **Testimonials**: Social proof from real professionals validates the decision
7. **Pricing**: Clear pricing with recommended tier guides the purchase decision
8. **Blog + Final CTA**: Additional authority building and final conversion push

### Hypothetical Customer Quote
> "I knew SlideHeroes was different the moment I hit their homepage. The dark design, smooth animations, and clear value proposition told me this was a premium tool, not another generic AI product."
> — Sarah, Senior Director at Fortune 500

### Responsive Behavior

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| Mobile (<768px) | Single column, stacked sections, reduced animations | Touch-friendly 44px targets, simplified sticky scroll to stacked, vertical stepper for How It Works |
| Tablet (768-1024px) | 2-column grids, adapted spacing | 2-column testimonials, 2-column features, horizontal stepper |
| Desktop (>1024px) | Full layout with all animations | 3-column grids, bento grid, sticky scroll 40/60 split, parallax effects |

---

## 6. Scope Definition

### In Scope

- [x] Complete redesign of all 12 homepage sections
- [x] Dark-mode design system implementation (CSS custom properties)
- [x] Framer Motion scroll-triggered animations
- [x] Glass card, spotlight card, and stat card components
- [x] Animated statistics with count-up effect
- [x] 4-step "How It Works" stepper component
- [x] Side-by-side comparison section
- [x] Final CTA section with gradient orb
- [x] Responsive design (mobile, tablet, desktop)
- [x] `prefers-reduced-motion` accessibility support
- [x] WCAG AA contrast compliance for dark theme
- [x] Static screenshot for product preview (no video)
- [x] Hardcoded placeholder statistics (not dynamic from DB)
- [x] Pricing toggle (monthly/annual)
- [x] Updated homepage content config

### Out of Scope

- [ ] Light mode design (dark-mode only for marketing pages)
- [ ] Video production for product preview
- [ ] Dynamic statistics from database
- [ ] A/B testing infrastructure
- [ ] New Payload CMS content models
- [ ] Changes to the header/footer (SiteHeader, SiteFooter remain as-is)
- [ ] SEO changes beyond semantic HTML
- [ ] Blog page redesign (only the homepage blog section)
- [ ] Pricing logic changes (visual redesign only)
- [ ] Testimonial CMS integration changes (keep existing Supabase integration)

### Future Considerations (v2+)
- Light/dark mode toggle for marketing pages
- Dynamic statistics from Supabase
- Auto-playing video in product preview
- A/B testing different hero copy
- Personalized sections based on visitor source

---

## 7. Technical Context

### System Integration Points

| System | Integration Type | Notes |
|--------|-----------------|-------|
| `apps/web/app/(marketing)/page.tsx` | Direct modification | Main homepage file, 288 lines, will be restructured |
| `apps/web/app/(marketing)/layout.tsx` | Minor update | Add MotionProvider wrapper, keep data-marketing attribute |
| `apps/web/config/homepage-content.config.ts` | Major update | Add new section content (Statistics, How It Works, Comparison, Final CTA) |
| `packages/ui/src/aceternity/` | Reuse + extend | Keep BackgroundBoxes, LogoMarquee, StickyScrollReveal, TestimonialsMasonaryGrid, CardSpotlight |
| `packages/ui/src/shadcn/` | Reuse existing | Button, Card, Badge, Avatar, Switch, Separator, Tabs |
| `packages/ui/src/makerkit/marketing/` | Reuse + extend | Hero, Pill, CtaButton, GradientText, SecondaryHero, FeatureCard |
| `apps/web/styles/globals.css` | Update | Add dark-mode homepage CSS custom properties |
| `apps/web/styles/theme.css` | Update | Add new animation keyframes (glowPulse, borderRotate, countUp) |
| `packages/billing/gateway/src/components/pricing-table.tsx` | Reuse | Existing pricing component from `@kit/billing-gateway/marketing` |
| `apps/web/app/(marketing)/_components/home-testimonials-grid-server.tsx` | Reuse | Server component with Supabase integration |

### Technical Constraints

- **Performance**: LCP <2.5s, CLS <0.1, INP <200ms. Use LazyMotion to reduce Framer Motion bundle (~34KB → code-split). Lazy load below-fold sections.
- **Security**: No new API routes or data mutations. Hardcoded content only.
- **Compliance**: WCAG AA minimum, AAA target. All animations must respect `prefers-reduced-motion`. Dark-mode text contrast ratios verified against #0a0a0f backgrounds.
- **Scalability**: Component-based architecture allows individual section updates without full page rebuild.

### Technology Preferences/Mandates

- **Animation**: Framer Motion (`motion/react` import, NOT `framer-motion`)
- **Styling**: Tailwind CSS v4 with CSS custom properties for design tokens
- **Components**: Shadcn UI + Aceternity + new custom components
- **Images**: Next.js Image with AVIF/WEBP, blur placeholders
- **Icons**: Lucide React (already in use)
- **Fonts**: DM Sans (body) + Plus Jakarta Sans (headings) - already configured

### Dependencies

| Dependency | Owner | Risk Level | Notes |
|------------|-------|------------|-------|
| `framer-motion` (v12.23.25) | Already installed | Low | Already in use by Aceternity components |
| `react-fast-marquee` (v1.6.5) | Already installed | Low | Used by LogoMarquee |
| Customer logos | Marketing | Low | Already exist in `public/images/logos/greyscale/` |
| Product screenshot | Design/Marketing | Medium | Needs high-quality static screenshot of the canvas |
| Testimonial data | Supabase | Low | Existing integration in `home-testimonials-grid-server.tsx` |

---

## 8. Assumptions & Risks

### Key Assumptions

1. **Dark mode only for marketing**: The marketing homepage will be dark-mode only (no light/dark toggle needed) — *Validation: Confirmed by user during interview*
2. **Static screenshot suffices**: A static product screenshot provides enough "wow" factor for the product preview — *Validation: Confirmed by user during interview*
3. **Hardcoded stats are acceptable**: Using placeholder statistics (2,000+ professionals, 50,000+ presentations) is fine for launch — *Validation: Confirmed by user during interview*
4. **Existing Aceternity components are compatible**: BackgroundBoxes, LogoMarquee, StickyScrollReveal, TestimonialsMasonaryGrid work with the new dark design system — *Validation: They already use dark-compatible styling*
5. **Framer Motion `motion/react` API is stable**: The new `motion` package import path is production-ready — *Validation: Context7 research confirms stable API*

### Risk Register

| ID | Risk | Probability | Impact | Mitigation | Owner |
|----|------|-------------|--------|------------|-------|
| R1 | Performance degradation from 12 sections + animations | Medium | High | LazyMotion code-splitting, Suspense boundaries, lazy loading below-fold sections | Dev |
| R2 | Dark-mode contrast fails WCAG AA | Low | Medium | Verify all text/background combinations during implementation, use `#f5f5f7` for primary text on `#0a0a0f` (ratio 17.9:1) | Dev |
| R3 | Glass morphism effects perform poorly on mobile | Medium | Medium | Test `backdrop-filter: blur()` on iOS Safari and Android Chrome, provide fallback for low-powered devices | Dev |
| R4 | Bento grid layout breaks on edge-case screen sizes | Low | Low | Thorough responsive testing, fallback to uniform grid | Dev |
| R5 | Missing product screenshot delays launch | Medium | Medium | Use existing `video-hero-preview.avif` as placeholder until new screenshot is ready | Marketing |

### Open Questions

1. [x] Which animation library? — **Answered: Framer Motion**
2. [x] All 12 sections or phased? — **Answered: All 12**
3. [x] Product preview: screenshot, video, or animated? — **Answered: Static screenshot**
4. [x] Stats: hardcoded or dynamic? — **Answered: Hardcoded placeholder**
5. [ ] What specific testimonials should be featured in the spanning card?
6. [ ] Should the pricing section support a monthly/annual toggle, or just show annual?
7. [ ] Exact copy for the "How It Works" section steps (using brainstorming doc as baseline)

---

## 9. Success Criteria

### Definition of Done (Project Level)

- [ ] All 12 sections implemented and visually matching the design system specifications
- [ ] Scroll-triggered animations work on all 12 sections
- [ ] `prefers-reduced-motion` disables all animations gracefully
- [ ] Responsive layout works at 375px (mobile), 768px (tablet), 1280px (desktop)
- [ ] Lighthouse performance score >= 90
- [ ] Lighthouse accessibility score >= 95
- [ ] All text on dark backgrounds meets WCAG AA contrast (4.5:1)
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] No console errors in browser
- [ ] Product screenshot loads with blur placeholder

### Launch Criteria

- [ ] All 12 sections render correctly on Chrome, Firefox, Safari, Edge
- [ ] Mobile responsiveness verified on iOS Safari and Android Chrome
- [ ] No CLS from animation loading
- [ ] Homepage loads in <3s on 3G connection (Lighthouse throttled)

### Post-Launch Validation

| Metric | Baseline | Target | Timeframe |
|--------|----------|--------|-----------|
| Scroll depth | Current baseline | +30% | 2 weeks post-launch |
| CTA click-through | Current baseline | +20% | 2 weeks post-launch |
| Bounce rate | Current baseline | -15% | 2 weeks post-launch |
| Lighthouse Performance | Current score | >= 90 | At launch |
| Lighthouse Accessibility | Current score | >= 95 | At launch |

---

## 10. Decomposition Hints

> **Note**: This section provides guidance for the next phase (initiative/feature decomposition).

### Standard Initiative Categories to Consider

1. **Foundation/Layout** (P0) - Dark-mode design system tokens, shared animation components, page structure, MotionProvider
2. **Data Layer** (P0) - Content config updates, testimonial loader, homepage data integration
3. **Core Sections** - Hero, Product Preview, Features, Pricing (redesigned existing sections)
4. **New Sections** - Statistics, How It Works, Comparison, Final CTA
5. **Polish & Edge Cases** - Responsive breakpoints, reduced-motion, loading states, performance optimization

### Candidate Initiatives

1. **Design System Foundation**: Dark-mode CSS custom properties, glass card component, spotlight card component, stat card component, animation utilities (AnimateOnScroll wrapper, MotionProvider, count-up hook) — Maps to Capability 1
2. **Hero & Product Preview**: Redesigned hero with text reveal, gradient orb, pill badge, dual CTAs, social proof strip + product preview with browser frame — Maps to Capabilities 2-3
3. **Trust & Credibility Sections**: Logo Cloud redesign + new Statistics section with animated counters — Maps to Capabilities 4-5
4. **Feature Showcase Sections**: Sticky Scroll Features redesign + new How It Works stepper + Features Grid bento layout — Maps to Capabilities 6-8
5. **Social Proof & Conversion Sections**: Comparison section + Testimonials redesign + Pricing redesign + Blog section + Final CTA — Maps to Capabilities 9-13
6. **Responsive & Accessibility Polish**: Mobile/tablet responsive adjustments, prefers-reduced-motion, contrast verification, performance optimization — Maps to responsive behavior

### Suggested Priority Order

1. **P0**: Design System Foundation (blocking for all other initiatives)
2. **P1**: Hero & Product Preview (above-the-fold, highest impact)
3. **P1**: Trust & Credibility Sections (immediately follows hero)
4. **P2**: Feature Showcase Sections (mid-page value communication)
5. **P2**: Social Proof & Conversion Sections (lower-page conversion)
6. **P3**: Responsive & Accessibility Polish (final quality pass)

> **Rule**: Foundation is P0, Hero/above-fold is P1, below-fold sections are P2, polish is P3.

### Complexity Indicators

| Area | Complexity | Rationale (based on codebase findings) |
|------|------------|----------------------------------------|
| Design System Foundation | Medium | New CSS custom properties + 3-4 new reusable components. Existing `theme.css` and `shadcn-ui.css` provide patterns to follow. |
| Hero Section | High | Letter-by-letter text animation, gradient orb parallax, social proof strip. Current hero in `page.tsx` is 35 lines — new version will be 100+ with animations. |
| Statistics Section | Low | New section, straightforward count-up animation with `useInView` + `animate()`. No database dependency. |
| How It Works | Medium | New 4-step stepper with connecting line animation. Horizontal desktop / vertical mobile layout switch. |
| Bento Features Grid | High | Asymmetric grid layout with spotlight card hover effects. Cursor-following radial glow is complex. |
| Comparison Section | Low | Two-card side-by-side layout with staggered checkmark animations. Straightforward implementation. |
| Testimonials Redesign | Low | Existing `TestimonialsMasonaryGrid` component can be restyled. Server component integration already works. |
| Pricing Redesign | Medium | Monthly/annual toggle, highlighted tier, glass card styling. Existing `PricingTable` from `@kit/billing-gateway` needs visual override. |
| Responsive Polish | Medium | 12 sections across 3 breakpoints. Sticky scroll → stacked on mobile is the trickiest adaptation. |

---

## 11. Appendices

### A. Glossary

| Term | Definition |
|------|-----------|
| Glass Card | Semi-transparent card with `backdrop-filter: blur()`, subtle border, and background opacity |
| Spotlight Card | Card with cursor-following radial gradient highlight on hover |
| Bento Grid | Asymmetric grid layout where some cards span multiple columns |
| Count-up Animation | Number that animates from 0 to target value when scrolled into view |
| Gradient Orb | Large blurred circle with accent color at low opacity, used as background decoration |
| Marquee | Continuously scrolling horizontal strip of logos |

### B. Codebase Exploration Results (REQUIRED)

| Component/Pattern Found | File Path | Reusable? | Notes |
|------------------------|-----------|-----------|-------|
| Homepage page | `apps/web/app/(marketing)/page.tsx` | Replace | 288 lines, main file to restructure |
| Marketing layout | `apps/web/app/(marketing)/layout.tsx` | Extend | 24 lines, add MotionProvider wrapper |
| ContainerScroll client | `apps/web/app/(marketing)/_components/home-container-scroll-client.tsx` | Yes | 32 lines, wraps Aceternity ContainerScroll |
| Logo Cloud client | `apps/web/app/(marketing)/_components/home-logo-cloud-client.tsx` | Yes | 15 lines, dynamic import with SSR |
| Sticky Scroll client | `apps/web/app/(marketing)/_components/home-sticky-scroll-client.tsx` | Yes | 35 lines, client-side only |
| Testimonials server | `apps/web/app/(marketing)/_components/home-testimonials-grid-server.tsx` | Yes | 106 lines, Supabase integration |
| CTA Input | `apps/web/app/(marketing)/_components/home-cta-presentation-name.tsx` | Yes | 42 lines, placeholder animation |
| Optimized Image | `apps/web/app/(marketing)/_components/home-optimized-image.tsx` | Yes | 34 lines, Next.js Image wrapper |
| Hero component | `packages/ui/src/makerkit/marketing/hero.tsx` | Extend | Pill, title, subtitle, cta, image slots |
| Pill component | `packages/ui/src/makerkit/marketing/pill.tsx` | Yes | Animated pill with gradient text |
| CtaButton | `packages/ui/src/makerkit/marketing/cta-button.tsx` | Yes | Enhanced button with hover shadow |
| GradientText | `packages/ui/src/makerkit/marketing/gradient-text.tsx` | Yes | Gradient text effect |
| SecondaryHero | `packages/ui/src/makerkit/marketing/secondary-hero.tsx` | Yes | Section title/subtitle pattern |
| FeatureCard | `packages/ui/src/makerkit/marketing/feature-card.tsx` | Extend | Needs glass card styling |
| BackgroundBoxes | `packages/ui/src/aceternity/background-boxes.tsx` | Yes | 3D animated grid, Framer Motion |
| CardSpotlight | `packages/ui/src/aceternity/card-spotlight.tsx` | Yes | Mouse-following spotlight effect |
| LogoMarquee | `packages/ui/src/aceternity/logo-marquee.tsx` | Yes | Dual-row infinite scrolling |
| StickyScrollReveal | `packages/ui/src/aceternity/sticky-scroll-reveal.tsx` | Yes | Content reveals on scroll |
| TestimonialsMasonaryGrid | `packages/ui/src/aceternity/testimonial-masonary-grid.tsx` | Yes | 4-column responsive masonry |
| BlogPostCard | `packages/ui/src/aceternity/blog-post-card.tsx` | Extend | Needs dark-mode glass styling |
| Content config | `apps/web/config/homepage-content.config.ts` | Extend | Add 4 new section configs |
| Global CSS | `apps/web/styles/globals.css` | Extend | Add homepage dark-mode variables |
| Theme CSS | `apps/web/styles/theme.css` | Extend | Add animation keyframes |
| Shadcn CSS | `apps/web/styles/shadcn-ui.css` | Reference | Existing color token patterns |
| PricingTable | `packages/billing/gateway/src/components/pricing-table.tsx` | Yes | From `@kit/billing-gateway/marketing` |
| Greyscale logos | `public/images/logos/greyscale/` | Yes | 20+ logos for marquee |
| Hero image | `public/images/video-hero-preview.avif` | Placeholder | Use until new screenshot available |

**Tables/Schemas Identified:**
| Table Name | Location | Purpose |
|------------|----------|---------|
| testimonials | Supabase (accessed via `home-testimonials-grid-server.tsx`) | Testimonial content for masonry grid |
| accounts | Supabase RLS | No direct homepage dependency |

### C. Research Integration (REQUIRED)

| Research File | Key Findings | Spec Section(s) Affected |
|--------------|--------------|-------------------------|
| context7-framer-motion.md | 1) Use `motion/react` import path, NOT `framer-motion`. 2) `whileInView` + `viewport={{ once: true }}` is simplest scroll trigger. 3) Use `animate(0, target, { onUpdate })` for free number counting. 4) LazyMotion reduces bundle from ~34KB via code-splitting. 5) CSS `position: sticky` + `useScroll` for sticky scroll patterns. | Section 7 (Technical Context), Section 10 (Decomposition - Design System Foundation) |
| perplexity-saas-homepage-best-practices.md | 1) Optimal section order: Hero → Social Proof → Features → How It Works → Testimonials → Pricing → CTA. 2) One primary CTA repeated 5-8 times across page. 3) Dark mode: true dark backgrounds with WCAG 4.5:1+ contrast. 4) Performance targets: LCP <2.5s, CLS <0.1, INP <200ms. 5) Mobile: prefer stacked layouts over carousels, fluid clamp() typography. 6) Accessibility: always implement prefers-reduced-motion. 7) Sticky header CTA for persistent conversion path. 8) Glassmorphism with blur + grain for tactile quality. | Section 3 (Goals), Section 5 (Solution Overview), Section 7 (Technical Constraints), Section 8 (Risks) |

### D. External References

- **Inspiration sites**: Cargo (getcargo.ai), Linear (linear.app), Formless (formless.xyz), OrbitAI (orbitaix.webflow.io), pre.dev
- **Brainstorming document**: `.ai/reports/brainstorming/2026-02-04-homepage-redesign-design-system.md`
- **Motion docs**: https://motion.dev/docs
- **Existing design system**: `.ai/ai_docs/context-docs/development/design/DesignSystem.md`

### E. Visual Assets

**ASCII Layout Mockup (Desktop):**
```
┌──────────────────────────────────────────────────────────────────┐
│                     HERO SECTION (100vh)                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  [Pill Badge: "AI-Powered Presentation Platform"]           │ │
│  │                                                             │ │
│  │  Write more impactful presentations *faster*                │ │
│  │  (letter-by-letter reveal, "faster" = gradient text)        │ │
│  │                                                             │ │
│  │  AI helps you structure, design, and deliver...             │ │
│  │                                                             │ │
│  │  [Start Writing Free]  [Watch Demo]                         │ │
│  │                                                             │ │
│  │  👤👤👤👤👤 Join 2,000+ professionals                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  (gradient orb background, animated grid/dot overlay)            │
├──────────────────────────────────────────────────────────────────┤
│                  PRODUCT PREVIEW SECTION                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ ● ● ●  SlideHeroes Canvas                                  │ │
│  │ ┌───────────────────────────────────────────────────────┐   │ │
│  │ │                                                       │   │ │
│  │ │           [Static Product Screenshot]                 │   │ │
│  │ │                                                       │   │ │
│  │ └───────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  (glass card frame, gradient border, glow beneath)               │
├──────────────────────────────────────────────────────────────────┤
│                    LOGO CLOUD SECTION                             │
│  Trusted by professionals at                                     │
│  ←  [Logo] [Logo] [Logo] [Logo] [Logo] [Logo] [Logo]  →         │
│  (continuous marquee, grayscale, hover = full opacity)           │
├──────────────────────────────────────────────────────────────────┤
│                   STATISTICS SECTION (NEW)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  2,000+  │  │ 50,000+  │  │  4.9/5   │  │   85%    │        │
│  │Profession│  │Presentat.│  │  Rating  │  │Time Saved│        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│  (count-up animation, accent color numbers, staggered fade-in)  │
├──────────────────────────────────────────────────────────────────┤
│              STICKY SCROLL FEATURES SECTION                      │
│  ┌─────────────────────┬───────────────────────────────────────┐ │
│  │ 01 / 03             │                                       │ │
│  │ AI Canvas           │    [Device-framed screenshot]         │ │
│  │ ✓ Feature point 1   │                                       │ │
│  │ ✓ Feature point 2   │                                       │ │
│  │ Learn more →        │                                       │ │
│  │                     │                                       │ │
│  │ ─── progress bar    │                                       │ │
│  └─────────────────────┴───────────────────────────────────────┘ │
│  (40% text / 60% image, sticky text, scrolling images)          │
├──────────────────────────────────────────────────────────────────┤
│                HOW IT WORKS SECTION (NEW)                         │
│                                                                  │
│    ①─────────────②─────────────③─────────────④                   │
│   Assemble      Outline       Storyboard    Produce              │
│   [icon]        [icon]        [icon]        [icon]               │
│   Gather your   Structure     Transform     Export polished      │
│   research...   your logic    outline to    slides ready         │
│                                slides       for meeting          │
│  (animated connecting line, stagger reveal, icon bounce)         │
├──────────────────────────────────────────────────────────────────┤
│                  FEATURES GRID (BENTO)                            │
│  ┌──────────────────────┬──────────┬──────────┐                  │
│  │   Card 1 (large)     │ Card 2   │ Card 3   │                  │
│  │   [icon] Title        │ [icon]   │ [icon]   │                  │
│  │   Description         │ Title    │ Title    │                  │
│  ├──────────┬────────────┴──────────┼──────────┤                  │
│  │ Card 4   │   Card 5 (large)     │ Card 6   │                  │
│  │ [icon]   │   [icon] Title        │ [icon]   │                  │
│  │ Title    │   Description         │ Title    │                  │
│  └──────────┴──────────────────────┴──────────┘                  │
│  (glass + spotlight cards, cursor-following glow)                │
├──────────────────────────────────────────────────────────────────┤
│                  COMPARISON SECTION (NEW)                         │
│  ┌─────────────────────┬──────────────────────┐                  │
│  │   Without            │   With               │                  │
│  │   SlideHeroes        │   SlideHeroes        │                  │
│  │   ──────────         │   ──────────         │                  │
│  │   ✗ Hours of blank   │   ✓ Minutes to       │                  │
│  │   ✗ Inconsistent     │   ✓ Proven frameworks│                  │
│  │   ✗ Generic AI       │   ✓ Presentation AI  │                  │
│  │   ✗ No delivery help │   ✓ Expert training  │                  │
│  └─────────────────────┴──────────────────────┘                  │
│  (muted "without" card, accent "with" card, stagger animation)  │
├──────────────────────────────────────────────────────────────────┤
│                   TESTIMONIALS SECTION                            │
│  ┌──────────┬──────────┬──────────────────────┐                  │
│  │ Quote 1  │ Quote 2  │    Featured Quote     │                  │
│  │ Avatar   │ Avatar   │    (spans 2 cols)     │                  │
│  │ Name     │ Name     │    Large avatar       │                  │
│  ├──────────┼──────────┼──────────┬───────────┤                  │
│  │ Quote 3  │ Quote 4  │ Quote 5  │ Quote 6   │                  │
│  └──────────┴──────────┴──────────┴───────────┘                  │
│  (masonry grid, glass cards, decorative " marks)                │
├──────────────────────────────────────────────────────────────────┤
│                     PRICING SECTION                              │
│            [Monthly]  ●──────  [Annual - Save 20%]               │
│  ┌──────────┐  ┌────────────────┐  ┌──────────┐                 │
│  │  Free     │  │ ★ Most Popular │  │Enterprise│                 │
│  │  $0/mo    │  │   Pro $29/mo   │  │ Contact  │                 │
│  │  ────     │  │   ────         │  │  ────    │                 │
│  │  ✓ feat   │  │   ✓ feat       │  │  ✓ feat  │                 │
│  │  ✓ feat   │  │   ✓ feat       │  │  ✓ feat  │                 │
│  │ [Start]   │  │  [Upgrade]     │  │ [Contact]│                 │
│  └──────────┘  └────────────────┘  └──────────┘                 │
│  (glass cards, highlighted middle tier, glow pulse on CTA)      │
├──────────────────────────────────────────────────────────────────┤
│                  BLOG / ESSENTIAL READS                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │ [Thumbnail]  │ │ [Thumbnail]  │ │ [Thumbnail]  │             │
│  │ [Category]   │ │ [Category]   │ │ [Category]   │             │
│  │ Title        │ │ Title        │ │ Title        │             │
│  │ Description  │ │ Description  │ │ Description  │             │
│  │ 15 min read  │ │ 10 min read  │ │ 8 min read   │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
│  (glass cards, image zoom on hover, category badges)            │
├──────────────────────────────────────────────────────────────────┤
│                    FINAL CTA SECTION (NEW)                       │
│                       (gradient orb)                             │
│                                                                  │
│         Ready to transform your presentations?                   │
│     Join thousands of professionals who present                  │
│                    with confidence                               │
│                                                                  │
│        [Start Writing Free]  [Book a Demo]                       │
│                                                                  │
│     ✓ No credit card    ✓ Free plan    ✓ Cancel anytime          │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                        FOOTER                                    │
│  (existing SiteFooter component - no changes)                   │
└──────────────────────────────────────────────────────────────────┘
```

### F. Decision Log

| Date | Decision | Rationale | Decided By |
|------|----------|-----------|------------|
| 2026-02-13 | All 12 sections in one spec | User prefers complete redesign over phased approach | User |
| 2026-02-13 | Framer Motion for animations | React-native, great DX, already in use via Aceternity | User |
| 2026-02-13 | Static screenshot for product preview | Simplest, fastest to implement, easy to update | User |
| 2026-02-13 | Hardcoded placeholder statistics | Avoids database complexity, easy to update later | User |
| 2026-02-13 | Dark-mode only (no toggle) | Marketing pages are dark-themed per design system | Implied by brainstorming doc |
| 2026-02-13 | Keep existing header/footer | Focus redesign effort on homepage content sections | Spec author |
