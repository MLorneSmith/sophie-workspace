# Feature: Hero Section Redesign

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2086.I2 |
| **Feature ID** | S2086.I2.F1 |
| **Status** | Draft |
| **Estimated Days** | 5 |
| **Priority** | 1 |

## Description
Replace the current hero section (BackgroundBoxes + Hero component + CtaPresentationName) with a full-viewport redesigned hero featuring a gradient orb background, letter-by-letter text reveal animation, gradient text on the keyword "faster", a pill badge ("AI-Powered Presentation Platform"), dual CTA buttons (primary: "Start Writing Free", secondary: "Watch Demo"), and a social proof micro-strip with avatar stack and "Join 2,000+ professionals" text.

## User Story
**As a** first-time visitor to the SlideHeroes homepage
**I want to** immediately see a polished, animated hero with a clear value proposition and trust signals
**So that** I understand what SlideHeroes does, feel confident in its quality, and know what action to take next

## Acceptance Criteria

### Must Have
- [ ] Full-viewport hero section (100vh min-h-[600px]) with gradient orb background
- [ ] Letter-by-letter text reveal animation for headline using Framer Motion variants with stagger
- [ ] Gradient text effect on the word "faster" using cyan accent (#24a9e0)
- [ ] Pill badge component displaying "AI-Powered Presentation Platform" using existing Pill component
- [ ] Primary CTA button: "Start Writing Free" (links to sign-up)
- [ ] Secondary CTA button: "Watch Demo" (outline/ghost variant)
- [ ] Social proof micro-strip: 5 avatar images stacked + "Join 2,000+ professionals" text
- [ ] All animations respect `prefers-reduced-motion` via MotionProvider from I1
- [ ] Subtitle text below headline with fade-in animation
- [ ] Homepage content config updated with hero section data (pill text, CTAs, social proof)

### Nice to Have
- [ ] Subtle parallax on gradient orb using `useScroll` + `useTransform`
- [ ] Staggered entrance animation for pill → headline → subtitle → CTAs → social proof

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Hero section, letter reveal, gradient orb, social proof strip, pill badge, dual CTAs | New |
| **Logic** | Letter-by-letter animation (Framer Motion variants), gradient orb positioning | New |
| **Data** | Homepage content config (hero section data) | Existing / Extend |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic — Create a new dedicated `home-hero-section.tsx` client component that replaces the current BackgroundBoxes + Hero + CtaPresentationName block in `page.tsx`. Compose from existing Pill and CtaButton components, add new sub-components for letter reveal and gradient orb.

**Rationale**: The current hero uses BackgroundBoxes (Aceternity) + the MakerKit Hero component. The redesign is fundamentally different (gradient orb bg, letter-by-letter animation, social proof strip), so a new component is cleaner than trying to extend the existing Hero component. Sub-components keep the main hero file manageable.

### Key Architectural Choices
1. **Single hero client component** (`home-hero-section.tsx`) that imports sub-components for letter reveal, gradient orb, and social proof — keeps page.tsx clean
2. **Reuse existing Pill and CtaButton** components rather than creating new button variants — maintains consistency
3. **Letter-by-letter animation via Framer Motion `custom` prop + variants** — free, performant pattern from research (context7-framer-motion.md line 396-425)
4. **Gradient orb as CSS-only background element** with optional parallax — avoids unnecessary JS for a decorative effect

### Trade-offs Accepted
- Replacing BackgroundBoxes (Aceternity 3D grid) with simpler gradient orb loses 3D effect but is more performant and on-brand with dark-mode design
- Letter-by-letter animation on long headlines can be slow; mitigated by fast stagger delay (0.03s per char)

## Required Credentials
> None required — this feature uses only hardcoded content and existing UI components.

## Dependencies

### Blocks
- None (F2 is independent)

### Blocked By
- S2086.I1: Design System Foundation (provides MotionProvider, AnimateOnScroll, design tokens, section container)

### Parallel With
- F2: Product Preview Redesign

## Files to Create/Modify

### New Files
- `apps/web/app/(marketing)/_components/home-hero-section.tsx` — Main hero section client component with gradient orb, layout, CTAs
- `apps/web/app/(marketing)/_components/home-hero-letter-reveal.tsx` — Letter-by-letter text animation component using Framer Motion variants
- `apps/web/app/(marketing)/_components/home-hero-social-proof.tsx` — Avatar stack + "Join 2,000+ professionals" micro-strip

### Modified Files
- `apps/web/app/(marketing)/page.tsx` — Replace current hero block (lines 63-97) with `<HeroSection />`
- `apps/web/config/homepage-content.config.ts` — Add hero pill text, CTA labels/hrefs, social proof data, subtitle text

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create letter-by-letter text reveal component**: Client component with Framer Motion `custom` prop + letter variants, `whileInView` trigger, `prefers-reduced-motion` fallback
2. **Create gradient orb background**: CSS-positioned decorative gradient orb(s) with blur and accent color, optional parallax via `useScroll`
3. **Create social proof micro-strip**: Avatar stack (5 overlapping circles) + text, staggered fade-in
4. **Compose hero section component**: Assemble pill badge, letter reveal headline, gradient text "faster", subtitle, dual CTAs, social proof strip into `home-hero-section.tsx`
5. **Update homepage content config**: Add hero section data to `homepage-content.config.ts`
6. **Integrate hero into page.tsx**: Replace current hero block with new component, remove BackgroundBoxes and CtaPresentationName imports

### Suggested Order
1. Content config update (no deps, provides data)
2. Letter reveal component (standalone, most complex)
3. Gradient orb background (standalone CSS/animation)
4. Social proof strip (standalone)
5. Compose hero section (depends on 1-4)
6. Integrate into page.tsx (depends on 5)

## Validation Commands
```bash
# Verify hero component exists
ls apps/web/app/\(marketing\)/_components/home-hero-section.tsx
ls apps/web/app/\(marketing\)/_components/home-hero-letter-reveal.tsx
ls apps/web/app/\(marketing\)/_components/home-hero-social-proof.tsx

# Verify content config updated
grep -c "socialProof\|pillText\|ctaPrimary" apps/web/config/homepage-content.config.ts

# Type checking
pnpm typecheck

# Lint
pnpm lint
```

## Related Files
- Initiative: `../initiative.md`
- Current hero: `apps/web/app/(marketing)/page.tsx` (lines 63-97)
- Existing Hero component: `packages/ui/src/makerkit/marketing/hero.tsx`
- Existing Pill: `packages/ui/src/makerkit/marketing/pill.tsx`
- Existing CtaButton: `packages/ui/src/makerkit/marketing/cta-button.tsx`
- Existing GradientText: `packages/ui/src/makerkit/marketing/gradient-text.tsx`
- Content config: `apps/web/config/homepage-content.config.ts`
- Research: `../../research-library/context7-framer-motion.md` (letter reveal pattern)
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
