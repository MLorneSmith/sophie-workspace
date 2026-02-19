# Perplexity Research: SaaS Homepage Redesign Best Practices (2025-2026)

**Date**: 2026-02-13
**Agent**: alpha-perplexity
**Spec Directory**: .ai/alpha/specs/pending-Spec-homepage-redesign
**Search Type**: Chat API (sonar-pro) -- 8 queries across all topics

---

## Query Summary

Comprehensive research across 8 key areas for a SaaS homepage redesign: above-the-fold optimization, section ordering, dark mode trends, performance for animated pages, accessibility, social proof placement, CTA strategy, and mobile-first responsive patterns. All queries targeted 2025-2026 best practices with citations from current web sources.

---

## 1. Above-the-Fold Hero Optimization

### Must-Have Elements

SaaS hero sections in 2025-2026 prioritize clarity, single focus, and conversion with these core components:

- **One clear value proposition headline** (H1 tag) answering "What problem do you solve?" in 5 seconds or less
- **Subheadline** connecting pain points to desirable outcomes (e.g., frustrations like "wasting hours on spreadsheets" tied to benefits like "take control of your money")
- **Single prominent primary CTA** (e.g., "Start Free Trial"), avoiding competing buttons; optional secondary CTA below
- **Product visuals**: Animated UI previews, GIFs, or short video loops showing dashboards/features in action
- **Social proof**: Logos from G2/Capterra or 1-2 testimonials for instant credibility
- **Minimal layout**: Clean spacing, F/Z-pattern alignment, simple header (5-7 nav items max, 1 header CTA)

Avoid feature dumps or multiple messages above the fold.

### Headline Formulas

Effective formulas frame benefits over features, address pain, and promise transformation:

| Formula | Example | Why It Works |
|---------|---------|--------------|
| Pain + Outcome | "Stop wasting hours on spreadsheets every payday" -> "Automate payroll in minutes" | Builds empathy, mirrors user frustration |
| Question + Benefit | "Struggling to track expenses?" -> "Take control of your money and grow savings" | Directly engages needs, focuses on results |
| Bold Promise + Proof | "Grow revenue 3x faster" -> Sub: "Join 10K+ teams using [Tool]" | Specific, outcome-driven with social proof |

### CTA Placement Above the Fold

- **Primary CTA**: Centered or right-aligned below headline/subheadline, high-contrast, full-width on mobile; single focus to reduce hesitation
- **Header CTA**: One secondary (e.g., "Login") only, non-competing
- **Input-capture variants**: Embed email/subdomain field next to CTA for frictionless flows
- Trends: No more than 1-2 total CTAs above fold; pause animations on hover for accessibility

### Hero Visual Trends

| Type | Usage Trend | Best For | Notes |
|------|-------------|----------|-------|
| **Animated UI/Video Preview** | Most common | Small/medium SaaS; builds "what it looks like" confidence | Short loops/GIFs; pause on interact; single/two-column |
| **Product Showcase** | Rising | Interactive demos on plain backgrounds | Accessibility: focus-visible, no auto-play overload |
| **Abstract/Illustrations** | Less common | Input-capture or split-column layouts | Slight motion (mouse parallax); avoids distraction |
| **Static Images** | Fallback | Quick loads; alt-optimized for SEO | Compress for Core Web Vitals |

### Conversion Benchmarks

- Optimized heroes boost conversions 20-50% via reduced bounce
- High-performers: 10-30% hero CTA click-through; aim for <40% bounce on landing
- A/B testing shows single CTA layouts lift engagement 2x vs. cluttered
- Prioritize real product over stock; mobile-first compression

---

## 2. Optimal Section Ordering

### Recommended 10-12 Section Sequence

| # | Section | Essential? | Rationale |
|---|---------|-----------|-----------|
| 1 | **Hero** | YES | Captures attention above fold; delivers UVP, problem solved, and next step in seconds. 53% of users abandon slow/unclear pages |
| 2 | **Social Proof/Logos** | YES | Builds instant credibility post-UVP without overwhelming the Hero |
| 3 | **Features/Benefits** | YES | 3-6 modular grid blocks highlighting key features with visuals and pain points addressed |
| 4 | **How It Works** | Optional | 3-5 step visual process or demo video; ideal for complex products to reduce hesitation |
| 5 | **Testimonials** | YES | 3-5 customer quotes with photos and outcomes; provides emotional proof mid-funnel |
| 6 | **Use Cases/Integrations** | Optional | Targets specific needs post-features; strengthens relevance via topic clusters for SEO |
| 7 | **Pricing** | YES (self-serve) | Addresses "how much?" after value proof; accelerates self-serve conversions |
| 8 | **CTA Section** | YES | Standalone "Ready to start?" with primary CTA + secondary option; re-engages after objections |
| 9 | **FAQ** | Optional | 5-8 accordion questions on pricing, setup; handles bottom-funnel doubts; boosts SEO |
| 10 | **Resources/Blog CTA** | Optional | Links to guides, pillar content; nurtures non-ready visitors |
| 11 | **Final Social Proof** | Optional | Reinforce with fresh quotes or metrics; ends strong before close |
| 12 | **Footer** | YES | Nav links, support, legal, secondary CTAs; provides escape hatches without distracting main flow |

### Essential vs. Optional Summary

| Category | Sections | When to Use |
|----------|----------|-------------|
| **Essential** | Hero, Social Proof, Features, Testimonials, CTA, Footer | Core for all SaaS; drives 80% conversions via UVP-trust-action path |
| **Optional** | How It Works, Use Cases, Pricing (enterprise), FAQ, Resources | Add for complexity/SEO; test via scroll depth metrics |

Monitor engagement with heatmaps; A/B test for your audience, as optimal length varies (shorter for simple self-serve).

---

## 3. Dark Mode SaaS Homepage Trends

### Color Palette Recommendations

Dark mode is evolving into "low light aesthetics" with muted tones, dynamic theming, and functional benefits like reduced eye strain and battery savings on OLED screens.

- **Background shades**: Muted, dimmed atmospheric tones or "low light" palettes with soft neutrals like warm grays, limestone, or sand-inspired hues to minimize strain. True dark backgrounds (near-black or deep grays) for depth and power efficiency
- **Accent colors**: Vivid, strategic pops (e.g., bold hues for CTAs and highlights) to guide attention without overwhelming; vivid accents convey modernity and security
- **Text contrast ratios**: Maintain WCAG-compliant ratios (at least 4.5:1 for normal text); recalibrate hierarchies so data visualizations and subtle shading remain distinguishable

### Recommended Dark Palette

```
Background:     #0A0A0B (near-black) or #121214 (dark gray)
Surface:        #1A1A1D (elevated cards/sections)
Border:         #2A2A2E (subtle dividers)
Text Primary:   #E8E8ED (high contrast, ~14:1 ratio on #0A0A0B)
Text Secondary: #9898A0 (muted labels, ~5.5:1 ratio)
Accent:         Brand-specific vivid color (test at 4.5:1+ on surface)
```

### Gradient and Glassmorphism Trends

- Gradients add sleek depth, especially for hero sections highlighting value propositions
- **Glassmorphism** evolving via blur effects on backdrops and grain effects for tactile materiality
- Subtle additions pair with dark palettes for lively, high-quality depth without harshness

### Typography for Dark Themes

- **Bold, oversized typography** establishes hierarchy and authority
- Use assertive fonts with high contrast, accessible weights
- Scales optimized for both themes to boost clarity and confidence

### Notable Dark-Themed SaaS Examples

- **Linear**: Mature dark system with high-contrast readability, luxe feel, dynamic theming
- **Vercel**: Clean dark with strategic accent colors, product-focused hero
- **Raycast**: Dark with vivid accents and interactive elements
- **Flotorch**: Sleek dark theme with color gradients, clear visual hierarchy, defined CTAs, and interactive demos
- **Twingate**: Bold dark mode with vivid accent colors for modern, secure vibe

### Common Pitfalls to Avoid

- Inverting colors without recalibrating contrast, leading to poor legibility in data-heavy UIs
- Overusing accents that disrupt hierarchy or cause strain
- Ignoring dynamic theming, user controls, or smooth transitions
- Neglecting mobile battery optimization or accessibility in complex visuals
- Pure #000000 black backgrounds (causes halation on OLED; use #0A-#12 range instead)

---

## 4. Performance for Animated Homepages

### Core Web Vitals Targets (2026)

| Metric | Target | Ideal | Impact |
|--------|--------|-------|--------|
| **LCP** (Largest Contentful Paint) | < 2.5s | <= 2.0s | Sites at 1.9s see higher activation rates |
| **CLS** (Cumulative Layout Shift) | < 0.1 | < 0.05 | Prevents visual jank from animations |
| **INP** (Interaction to Next Paint) | < 200ms | <= 100ms | Critical for interactive elements |

### Framer Motion Optimization

- Prioritize GPU acceleration via `transform` and `opacity` properties (offload work from CPU)
- Set `transform: translate3D(0,0,0)` or use `will-change: transform` sparingly on animated elements
- Limit animation budgets to 60fps: cap concurrent animations at **3-5 per viewport**
- Use `useReducedMotion()` to detect user preferences and disable non-essential motion
- For scroll-triggered animations (via `useInView` or `useScroll`), debounce triggers and animate only on intersection

### Scroll-Triggered Animations and Parallax

- Use `IntersectionObserver` API for lazy entrance animations, triggering only when 10-20% of elements enter viewport
- For parallax, apply lightweight CSS `transform: translateY(var(--scroll))` with `contain: paint` to isolate effects
- Limit to **2-3 parallax layers per section**; test INP impact as scroll events can spike input latency

### Video Backgrounds and 3D Elements

- Compress videos to **WebM/VP9 format under 5MB**, set `preload="none"` and autoplay only after LCP with `playsInline muted`
- Lazy load 3D models with `loading="lazy"` and render offscreen via `Suspense`; use low-poly proxies (LOD) for initial views
- Export 3D to GLTF with DRACO compression; animate via CSS `@property` or Motion's `gpu: true` for 3x faster rendering

### Lazy Loading Strategies

| Asset Type | Strategy | Core Vitals Impact |
|------------|----------|-------------------|
| **Images** | `loading="lazy"`, responsive sizes, AVIF/WebP | Reduces LCP by 30-50% |
| **Videos** | `preload="none"`, poster image | Minimizes initial payload |
| **Animations** | `useInView` threshold 0.1 | Prevents CLS/INP spikes |
| **3D** | Dynamic import + LOD | Defers GPU load post-LCP |

### Animation Budget

- Aim for **<16ms per frame** (60fps)
- Profile with Chrome DevTools Performance tab to cap JS execution at 50ms total
- Prefer `transform/opacity` over `top/left/width/height`
- Use `contain: layout style paint` to sandbox effects
- Reduce paint/reflow: Batch DOM reads/writes; avoid animating layout properties

### Next.js Specific Optimizations

```typescript
// Dynamic imports for heavy animation components
const HeavyAnimation = dynamic(
  () => import('./HeavyAnimation'),
  { ssr: false, loading: () => <Skeleton /> }
);

// Suspense boundaries for streaming
<Suspense fallback={<div>Loading...</div>}>
  <AnimatedSection />
</Suspense>
```

- Use `generateStaticParams` for static shells
- `loading.js` for instant RSCs
- Deploy on Vercel for global CDN caching
- Optimize images with `next/image` for auto-WebP/AVIF

---

## 5. Accessibility for Animated Dark Pages

### prefers-reduced-motion Implementation

```css
/* No-motion-first approach (recommended) */
/* Default: no animations */
.animated-element {
  opacity: 1;
  transform: none;
}

/* Only animate when user has no preference */
@media (prefers-reduced-motion: no-preference) {
  .animated-element {
    animation: fadeInUp 0.6s ease-out;
  }
}

/* Or: Universal override for reduce preference */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

JavaScript detection:

```typescript
// Detect in JS for Framer Motion / programmatic animations
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

// Framer Motion hook
import { useReducedMotion } from 'framer-motion';
const shouldReduceMotion = useReducedMotion();
```

### WCAG 2.2 Compliance for Dark Themes

- WCAG 2.2 SC 1.4.10 (Reflow) and 1.4.13 (Content on Hover/Focus) apply to dark themes
- Ensure animations are decorative enhancements, not essential for understanding
- Respect `prefers-reduced-motion` to avoid motion sickness triggers
- Pair with `@media (prefers-color-scheme: dark)` for theme-aware styles

### Contrast Ratios for Dark Backgrounds

| Element | Minimum Ratio | Recommended | Standard |
|---------|--------------|-------------|----------|
| Normal text (< 18pt) | 4.5:1 | 7:1 | WCAG AA / AAA |
| Large text (>= 18pt) | 3:1 | 4.5:1 | WCAG AA / AAA |
| UI components & graphics | 3:1 | 4.5:1 | WCAG 2.2 SC 1.4.11 |
| Focus indicators | 3:1 | 4.5:1 | WCAG 2.2 SC 2.4.11 |

Common dark theme palette achieving compliance:
- `#121212` background with `#E0E0E0` text = ~13.5:1 ratio
- Test dynamically with `@media (prefers-contrast: more)` for enhanced contrast preferences

### Focus Indicators on Dark Backgrounds

- Must be at least **3:1 contrast** against both background and adjacent colors (WCAG 2.2 SC 2.4.11)
- Use **2px thick bright outline** (e.g., `outline: 2px solid #00FF00`) on dark elements
- Use `:focus-visible` to show only on keyboard navigation

```css
:focus-visible {
  outline: 2px solid #58A6FF; /* bright blue on dark */
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(88, 166, 255, 0.3);
}
```

### Accessible Animation Patterns

- Design animations as **non-essential enhancements** (subtle fades over parallax)
- Limit duration to **5 seconds max** (WCAG 2.1 SC 2.2.2) and use `ease-out` timing
- In `prefers-reduced-motion`: replace spins with static icons or instant transitions
- Ensure animated elements maintain contrast during motion

### Screen Reader Considerations

- Mark decorative animations with `aria-hidden="true"` to prevent verbosity
- For meaningful animations (status changes), use `aria-live="polite"` on containers
- Avoid auto-advancing carousels; provide pause controls announced as "carousel paused"

### ARIA Best Practices for Interactive Sections

- Use semantic HTML first (`<button>` over `<div role="button">`)
- For animated interactive sections (modals), apply `aria-expanded`, `aria-label`, and `aria-describedby`
- Dynamic updates: `aria-live="assertive"` for urgent changes with `role="status"`
- Always validate with axe or WAVE tools

---

## 6. Social Proof Placement Strategy

### Optimal Placements by Element

| Element | Best Placement | Impact |
|---------|---------------|--------|
| **Customer logos** | Above the fold, immediately below hero | Immediate credibility; 90%+ of top SaaS use this |
| **Testimonial cards** | Near pricing tables or sign-up forms | Overcomes hesitation at decision points |
| **Statistics/metrics** | Near CTAs or hero sections | Highlights scale and results |
| **Case study snippets** | Post-hero or near use-case sections | Deeper trust via stories; link to full case studies |
| **Trust badges** (G2, Capterra) | Near pricing or page bottom | Third-party credibility at decision point |
| **Video testimonials** | Prominently near CTAs | Outperform text by 34%; prioritize in high-traffic areas |

### Above vs. Below the Fold

- **Above the fold**: Logos, key stats for quick trust in first impressions
- **Below the fold**: Full testimonials, case studies near pricing to sustain engagement for scrollers
- **Combined approach**: Above for credibility, below for persuasion; avoids overwhelming users
- Studies show 15-30% sales spikes from optimized positioning and up to **62% conversion lifts** near CTAs

### Rule of Thirds for Trust Signals

- **Top third** (above fold): Primary trust signals -- logos or badges
- **Middle third** (near CTAs): Testimonials and outcomes
- **Bottom third** (pre-footer): Deeper proof -- videos, metrics, case studies
- Guides eye flow and reduces bounce rates

### High-Converting Examples

| Site | Key Social Proof Placement | Impact |
|------|---------------------------|--------|
| **HubSpot** | Testimonials and case studies with multiple CTAs | Builds trust via personalization |
| **Notion** | User-generated templates and screenshots mid-page | Drives community trust |
| **Loom** | Scale-focused proof immediately visible, expanding on scroll | Emphasizes adoption |
| **Zoom** | Logos and benefits above fold | Instant credibility |
| **Salesforce** | Logos for credibility, progressive disclosure below fold | Balances initial and deep trust |

---

## 7. CTA Strategy for Long-Scroll Pages

### Primary vs Secondary CTA Design

- **Primary CTAs**: Drive high-value actions (free trials, demos); bold contrasting colors, large size, prominent placement. Convert 30% better than lower-placed ones
- **Secondary CTAs**: Lower-commitment steps ("Learn More", "View Pricing"); smaller, less contrasting, below primary to avoid distraction

### Number of CTAs on a 10-12 Section Page

Limit to **one primary CTA per key section** for a total of **5-8 instances**, focusing on a single main action per page. Repeat the primary CTA strategically rather than adding many variants.

### CTA Rhythm Throughout the Page

| Section Range | CTA Type | Purpose |
|---------------|----------|---------|
| Hero (Section 1) | Primary | Capture early converters above fold |
| Social Proof/Benefits (2-4) | Primary (repeat) | Reinforce after trust signals |
| How It Works/Use Cases (5-7) | Secondary + Primary | "Learn More" for explorers, Primary for ready users |
| Pricing/FAQ (8-10) | Strong Primary | Decision point with full transparency |
| Footer (12) | Primary + Secondary links | Last chance capture |

### Sticky Header CTA Pattern

- Implement a **sticky primary CTA in the header** that persists on scroll
- Keep navigation minimal (5-7 items) and the CTA always visible
- Pairs with F- or Z-pattern layouts to direct eyes naturally

### CTA Button Colors on Dark Backgrounds

- Use **high-contrast colors** (bright orange, green, or white on dark) to make buttons pop
- Surround with whitespace for emphasis -- boosts conversions by up to 34%
- Ensure nothing else matches the CTA color; prioritize readability and visual hierarchy

### CTA Copy Best Practices

- Use **action verbs with specificity and urgency**: "Start Your Free Trial in 30 Seconds", "Book a Demo Now"
- Avoid vague phrases like "Get Started" or "Learn More" for primary CTAs
- Add time-bound urgency to prompt immediate action

### Free Trial vs Demo vs Sign Up

| CTA Type | Best For | Key Consideration |
|----------|----------|-------------------|
| **Free Trial** | Self-serve users | Low-friction with minimal fields (Google sign-in) |
| **Demo** | Enterprise/complex products | Pair with clear expectations |
| **Sign Up for Free** | Versatile primary | Simplicity-focused like Dropbox's model |

---

## 8. Mobile-First Responsive Patterns

### Section Collapsing Strategies

- Use **progressive disclosure** to collapse non-essential sections behind expandable accordions or tap-to-reveal triggers
- On mobile, limit visible sections to **4-6 at initial load**, dynamically expanding based on scroll or interest
- Reduces initial scroll length while prioritizing UVP, CTAs, and trust signals above the fold

### Touch-Friendly Interaction Patterns

- **Minimum 44x44px touch targets** for buttons, CTAs, and menus
- Support one-handed thumb use
- Minimize text inputs with toggles or sliders
- Implement thumb-friendly navigation with hamburger menus that expand vertically

### Mobile Navigation for Long Pages

- Employ a **sticky footer navigation bar** with 4-5 icons (Home, Features, Pricing, CTA) that persists at screen bottom
- Or a progressive nav that reveals on scroll-up
- Use logical hierarchy: UVP -> social proof -> CTAs with clear labels and no jargon

### Image and Animation Optimization for Mobile

- Compress images to **WebP/SVGs** with lazy loading for below-the-fold content
- Limit animations to subtle **micro-interactions** (scale on tap) using CSS transforms
- Leverage CDNs and server-side rendering for <3s loads, prefetching critical hero assets

### Swipeable Carousels vs Stacked Layouts

| Pattern | Pros | Cons | Best Use |
|---------|------|------|----------|
| **Stacked Layouts** | Thumb-scroll native, full visibility, faster scans | Longer scroll | Features, testimonials (10-12 sections) |
| **Swipeable Carousels** | Space-saving | Swipe fatigue, missed content (users miss 70% of slides) | 3-4 hero items only |

**Recommendation**: Prefer stacked layouts over swipeable carousels for mobile. Carousels increase cognitive load and abandonment.

### Sticky Elements on Mobile

- Apply **sticky headers sparingly** (slim logo + CTA only) to avoid viewport obstruction
- Favor **sticky CTAs in bottom-right** or footer bars that dock on scroll
- Test for iOS Safari compatibility with `position: sticky` and safe-area insets

### Typography Scaling

```css
/* Fluid typography with clamp() */
h1 { font-size: clamp(1.75rem, 5vw, 3.5rem); }
h2 { font-size: clamp(1.25rem, 3.5vw, 2.25rem); }
body { font-size: clamp(1rem, 2.5vw, 1.125rem); }
p { line-height: 1.6; } /* 1.5-2x line-height for scannability */
```

- Use **variable fonts** for proportional scaling across devices without zooming
- Base on 16px root with 1.5-2x line-height for scannability on long scrolls

---

## Key Takeaways

### Critical Design Decisions

1. **Hero must have exactly one primary CTA** with a benefit-driven headline, subheadline, product visual, and social proof logos. No feature dumps.

2. **Section order matters**: Hero -> Social Proof -> Features -> How It Works -> Testimonials -> Use Cases -> Pricing -> CTA -> FAQ -> Footer. This progressive trust-building flow drives 80%+ of conversions.

3. **Dark theme is not just inverting colors**: Use near-black backgrounds (#0A-#12 range), 4.5:1+ contrast ratios, vivid accent colors for CTAs, and recalibrate the entire visual hierarchy.

4. **Animation budget is real**: Cap at 3-5 concurrent animations per viewport, use transform/opacity only, lazy load everything below the fold, and dynamic import heavy components in Next.js.

5. **Accessibility is non-negotiable**: Implement prefers-reduced-motion as a "no-motion-first" approach, maintain WCAG 2.2 contrast ratios, and use aria-hidden on decorative animations.

6. **Social proof placement follows the Rule of Thirds**: Logos above fold, testimonials near CTAs/pricing, video testimonials near decision points. Up to 62% conversion lift.

7. **5-8 CTAs across a 10-12 section page**: One primary per key section, sticky header CTA, high-contrast buttons on dark backgrounds. "Start Free Trial" outperforms "Get Started".

8. **Mobile prefers stacked over swiped**: Collapse non-essential sections, use 44px+ touch targets, fluid typography with clamp(), and sticky bottom-bar navigation.

### Performance Checklist for Implementation

- [ ] LCP < 2.5s (hero image/video optimized, preloaded)
- [ ] CLS < 0.1 (no layout shifts from lazy-loaded animations)
- [ ] INP < 200ms (debounced scroll handlers, GPU-accelerated transforms)
- [ ] All below-fold animations use IntersectionObserver
- [ ] Video backgrounds compressed to WebM < 5MB with poster images
- [ ] Heavy components (3D, complex animations) use `dynamic()` with `ssr: false`
- [ ] `next/image` for all images with AVIF/WebP auto-format
- [ ] Framer Motion components wrapped in Suspense boundaries

### Accessibility Checklist for Implementation

- [ ] prefers-reduced-motion: "no-motion-first" approach implemented
- [ ] All text passes 4.5:1 contrast on dark backgrounds
- [ ] Focus indicators are 3:1+ contrast with 2px outlines
- [ ] Decorative animations have `aria-hidden="true"`
- [ ] No auto-playing carousels without pause controls
- [ ] Animations limited to 5 seconds max duration
- [ ] Semantic HTML used throughout (not div soup)
- [ ] Tested with axe/WAVE and screen readers

---

## Sources and Citations

Note: The Perplexity CLI had a citation formatting bug (str.url attribute error) during this session. Citations were referenced as numbered footnotes in the API responses but URLs could not be extracted. Key source domains referenced by the AI model include:

- SaaS landing page optimization guides (2025-2026 publications)
- WCAG 2.2 specification documentation
- Core Web Vitals documentation (Google)
- Framer Motion performance documentation
- Next.js optimization guides
- Case studies from: HubSpot, Notion, Loom, Zoom, Salesforce, Linear, Vercel, Raycast, Ramp, ClickUp, Flotorch, Twingate

---

## Related Searches

For follow-up research if needed:

- **Next.js 16 App Router** specific animation patterns and server component streaming
- **Framer Motion v12** performance benchmarks and new APIs
- **Tailwind CSS 4** dark mode implementation patterns
- **Shadcn/ui** dark theme component customization
- **Competitor analysis**: Specific SaaS presentation tools (Pitch, Gamma, Beautiful.ai) homepage teardowns
- **A/B testing frameworks** for homepage section ordering experiments
- **Conversion rate optimization (CRO)** benchmarks specific to B2B SaaS in 2025-2026
