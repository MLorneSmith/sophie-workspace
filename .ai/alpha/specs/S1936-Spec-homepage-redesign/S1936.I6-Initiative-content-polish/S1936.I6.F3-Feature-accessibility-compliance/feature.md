# Feature: Accessibility Compliance

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1936.I6 |
| **Feature ID** | S1936.I6.F3 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 3 |

## Description
Ensure full WCAG AA compliance across the homepage with `prefers-reduced-motion` support, 4.5:1 contrast verification, keyboard navigation testing, and proper ARIA attributes. Add motion-reduce variants to all animated components.

## User Story
**As a** user with vestibular disorders or visual impairments
**I want to** experience the homepage without disorienting animations and with proper contrast
**So that** I can access all content comfortably and navigate via keyboard

## Acceptance Criteria

### Must Have
- [ ] `prefers-reduced-motion` support for all animations (CSS and Framer Motion)
- [ ] WCAG AA contrast ratio (4.5:1) verified for all text
- [ ] Keyboard navigation works for all interactive elements
- [ ] Skip link to main content added to layout
- [ ] All images have proper alt text
- [ ] Focus indicators visible on all interactive elements
- [ ] ARIA labels on icon-only buttons

### Nice to Have
- [ ] `aria-live` regions for dynamic content (stats counters)
- [ ] Reduced motion disables counter animations (shows final value immediately)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | SkipLink, motion-reduce variants | New |
| **Logic** | useReducedMotion hook, MotionConfig | New / Existing |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic - CSS-first with Framer Motion integration
**Rationale**: Use Tailwind's `motion-reduce:` variants for CSS animations, and Framer Motion's `MotionConfig reducedMotion="user"` for JS animations.

### Key Architectural Choices
1. **CSS motion-reduce variants** - Add `motion-reduce:transition-none motion-reduce:animate-none` to animated components
2. **Framer Motion MotionConfig** - Wrap homepage in `<MotionConfig reducedMotion="user">` for automatic handling
3. **Skip link component** - Add accessible skip link at top of marketing layout
4. **Axe-core audit** - Run automated accessibility testing

### Trade-offs Accepted
- Adding motion-reduce variants increases CSS class count but is essential for accessibility
- Skip link is visually hidden but adds minimal DOM weight

## Required Credentials
None required.

## Dependencies

### Blocks
- F4: Performance (accessibility score is part of Lighthouse)

### Blocked By
- F1: Blog Section (new components need accessibility review)
- F2: Loading States (skeletons need proper ARIA)

### Parallel With
- F2: Loading States (can work in parallel on different sections)

## Files to Create/Modify

### New Files
- `apps/web/app/(marketing)/_components/skip-link.tsx` - Accessible skip to content link
- `packages/ui/src/hooks/use-reduced-motion.ts` - Hook for detecting reduced motion preference (if not using Framer Motion's built-in)

### Modified Files
- `apps/web/app/(marketing)/layout.tsx` - Add SkipLink and MotionConfig wrapper
- `apps/web/app/(marketing)/page.tsx` - Add `id="main-content"` to main element
- `packages/ui/src/aceternity/blog-post-card.tsx` - Add motion-reduce variants
- `packages/ui/src/aceternity/logo-marquee.tsx` - Add motion-reduce variants (pause marquee)
- `packages/ui/src/aceternity/sticky-scroll-reveal.tsx` - Add motion-reduce variants
- `packages/ui/src/aceternity/container-scroll-animation.tsx` - Add motion-reduce variants
- `apps/web/styles/globals.css` - Add global `@media (prefers-reduced-motion: reduce)` rules

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create SkipLink component**: Visually hidden link that appears on focus
2. **Add SkipLink to marketing layout**: Position at top before navigation
3. **Add main content landmark**: Add `id="main-content"` to homepage main element
4. **Wrap homepage in MotionConfig**: Add `reducedMotion="user"` wrapper
5. **Add motion-reduce to BlogPostCard**: Disable hover animations
6. **Add motion-reduce to LogoMarquee**: Pause or disable marquee animation
7. **Add motion-reduce to StickyScrollReveal**: Disable scroll-triggered animations
8. **Add motion-reduce to ContainerScroll**: Disable perspective animations
9. **Add global reduced-motion CSS**: Catch-all for any missed animations
10. **Run axe-core audit**: Identify remaining accessibility issues
11. **Fix contrast issues**: Address any flagged contrast violations
12. **Add alt text audit**: Verify all images have descriptive alt text
13. **Test keyboard navigation**: Tab through all interactive elements
14. **Verify focus indicators**: Ensure visible focus rings on all elements

### Suggested Order
1. Create and add SkipLink (quick win)
2. Add MotionConfig wrapper (handles many animations automatically)
3. Add motion-reduce variants to each animated component
4. Run axe-core audit
5. Fix identified issues
6. Test with reduced motion enabled

## Validation Commands
```bash
# TypeScript check
pnpm typecheck

# Lint check
pnpm lint

# Accessibility audit via axe-core
npx axe-core http://localhost:3000

# Lighthouse accessibility score
npx lighthouse http://localhost:3000 --only-categories=accessibility --output=json | jq '.categories.accessibility.score'

# Test reduced motion
# In Chrome DevTools: Rendering > Emulate CSS media feature prefers-reduced-motion: reduce

# Keyboard navigation test
# Tab through page, verify all interactive elements are reachable
```

## Related Files
- Initiative: `../initiative.md`
- Accessibility guide: `.ai/ai_docs/software-docs/ui/accessibility.md`
- Design system: `.ai/ai_docs/context-docs/development/design/DesignSystem.md`
- Homepage: `apps/web/app/(marketing)/page.tsx`
- Marketing layout: `apps/web/app/(marketing)/layout.tsx`
- Global CSS: `apps/web/styles/globals.css`
