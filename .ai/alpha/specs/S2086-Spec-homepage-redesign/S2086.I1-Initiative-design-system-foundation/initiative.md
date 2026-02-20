# Initiative: Design System Foundation

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S2086 |
| **Initiative ID** | S2086.I1 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 1 |

---

## Description
Establish the dark-mode-first design system for the homepage redesign, including CSS custom properties (design tokens), reusable glass/spotlight/stat card components, and animation infrastructure (MotionProvider, AnimateOnScroll wrapper, count-up hook). This initiative creates the shared visual language and tooling that all subsequent section initiatives depend on.

## Business Value
Provides a unified, premium visual foundation that ensures consistency across all 12 homepage sections. Without this foundation, each section would implement its own styling patterns, leading to inconsistency and rework. The design system also enables rapid iteration on individual sections.

---

## Scope

### In Scope
- [ ] Dark-mode CSS custom properties in `globals.css` / `theme.css` (background: #0a0a0f, surface, border, text, accent #24a9e0)
- [ ] Glass card component (backdrop-filter: blur, subtle border, background opacity)
- [ ] Spotlight card component (cursor-following radial gradient glow on hover)
- [ ] Stat card component (accent-colored number + label)
- [ ] MotionProvider with LazyMotion + MotionConfig (reducedMotion: "user")
- [ ] AnimateOnScroll reusable wrapper (whileInView + viewport once)
- [ ] useCountUp hook (animate 0 to target on viewport entry)
- [ ] Animation keyframes in theme.css (glowPulse, borderRotate)
- [ ] Gradient text utility (extending existing GradientText with cyan accent)
- [ ] Noise/grid texture overlay component
- [ ] Section container component with standardized spacing

### Out of Scope
- [ ] Light mode design tokens (dark-mode only for marketing)
- [ ] Individual homepage section implementations (done in I2-I5)
- [ ] Responsive breakpoint adjustments (done in I6)
- [ ] Content configuration changes (done per-section in I2-I5)

---

## Dependencies

### Blocks
- S2086.I2: Hero & Product Preview
- S2086.I3: Trust & Credibility Sections
- S2086.I4: Feature Showcase Sections
- S2086.I5: Social Proof & Conversion Sections

### Blocked By
- None (foundation initiative)

### Parallel With
- None (must complete before Group 1)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | New CSS custom properties + 4-5 new components + animation provider. Patterns exist in codebase to follow. |
| External dependencies | Low | Framer Motion already installed. No new packages needed. |
| Unknowns | Low | Design system spec is well-defined. Glass morphism and spotlight patterns have research backing. |
| Reuse potential | High | Existing GradientText, CardSpotlight, theme.css, shadcn-ui.css provide strong foundation. |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Dark-Mode Design Tokens**: CSS custom properties for colors, surfaces, borders, gradients
2. **Reusable Card Components**: Glass card, spotlight card, stat card as composable components
3. **Animation Infrastructure**: MotionProvider, AnimateOnScroll, useCountUp hook, keyframes
4. **Homepage Content Config Updates**: Add new section configs (Statistics, How It Works, Comparison, Final CTA)

### Suggested Order
1. Design tokens first (CSS variables used by everything)
2. Animation infrastructure (provider needed by components)
3. Card components (depend on tokens + animations)
4. Content config (independent but needed by section initiatives)

---

## Validation Commands
```bash
# Verify design tokens exist
grep '#0a0a0f' apps/web/styles/globals.css
grep '#24a9e0' apps/web/styles/globals.css

# Verify new components exist
ls apps/web/app/\(marketing\)/_components/motion-provider.tsx
ls apps/web/app/\(marketing\)/_components/animate-on-scroll.tsx

# Type checking passes
pnpm typecheck

# Lint passes
pnpm lint
```

---

## Related Files
- Spec: `../spec.md`
- Research: `../research-library/context7-framer-motion.md`
- Research: `../research-library/perplexity-saas-homepage-best-practices.md`
- Existing theme: `apps/web/styles/theme.css`
- Existing shadcn tokens: `apps/web/styles/shadcn-ui.css`
- Existing globals: `apps/web/styles/globals.css`
- Existing CardSpotlight: `packages/ui/src/aceternity/card-spotlight.tsx`
- Existing GradientText: `packages/ui/src/makerkit/marketing/gradient-text.tsx`
- Features: `./<feature-#>-<slug>/` (created in next phase)
