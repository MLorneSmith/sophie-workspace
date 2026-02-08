# Feature: Comparison Section

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1936.I5 |
| **Feature ID** | S1936.I5.F1 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 1 |

## Description
Implement a conversion-focused comparison section with side-by-side "Without SlideHeroes" and "With SlideHeroes" cards. The section showcases pain points (muted styling) versus benefits (accent glow, animated checkmarks) to drive home the value proposition before pricing.

## User Story
**As a** first-time visitor evaluating SlideHeroes
**I want to** see a clear comparison of life without vs with the product
**So that** I understand the specific problems it solves and feel confident in my purchase decision

## Acceptance Criteria

### Must Have
- [ ] Two-card layout: "Without SlideHeroes" (left) and "With SlideHeroes" (right)
- [ ] Without card has muted styling (reduced opacity, grayscale icons, no accent colors)
- [ ] With card has accent glow effect and highlighted styling
- [ ] Animated checkmarks on "With" side that stagger on scroll into view
- [ ] 4-5 comparison points per card (pain vs benefit pairs)
- [ ] Section header with title "Why SlideHeroes?"
- [ ] Mobile responsive: cards stack vertically on small screens
- [ ] Supports reduced motion preference

### Nice to Have
- [ ] Subtle X marks on "Without" side that fade in
- [ ] Hover effect on cards (slight lift)
- [ ] Progress indicator connecting the two cards

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | ComparisonSection, ComparisonCard | New |
| **Logic** | Scroll animation hooks (useInView) | Existing (Framer Motion) |
| **Data** | Comparison content config | New (static in homepage-content.config.ts) |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Leverage existing Framer Motion patterns from research, create reusable ComparisonCard component that can be configured for "without" or "with" variants via props. No need for complex state management.

### Key Architectural Choices
1. Create a `ComparisonCard` component with `variant: 'without' | 'with'` prop
2. Use Framer Motion's `whileInView` and `stagger` for checkmark animations
3. Store comparison content in `homepage-content.config.ts` for easy updates
4. Apply glass effect utilities from design system (backdrop-blur + bg opacity)

### Trade-offs Accepted
- Static content (not CMS-driven) - acceptable for marketing page
- Card styling is specific to comparison use case, not generalized

## Required Credentials
> Environment variables required for this feature to function. Extracted from research files.

None required - this is a static UI component.

## Dependencies

### Blocks
- F2: Pricing Glass Cards (visually follows this section)

### Blocked By
- S1936.I1: Design System Foundation (requires color tokens, glass utilities, animation variables)

### Parallel With
- None (first feature in this initiative)

## Files to Create/Modify

### New Files
- `apps/web/app/(marketing)/_components/home-comparison-section.tsx` - Main comparison section component
- `apps/web/app/(marketing)/_components/home-comparison-card.tsx` - Reusable comparison card component

### Modified Files
- `apps/web/config/homepage-content.config.ts` - Add comparison content configuration
- `apps/web/app/(marketing)/page.tsx` - Import and render ComparisonSection

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Define comparison content schema**: Add TypeScript interface and content to config
2. **Create ComparisonCard component**: Build card with variant prop for styling differences
3. **Implement checkmark animations**: Add staggered scroll-triggered animations
4. **Create ComparisonSection container**: Layout wrapper with header and responsive grid
5. **Integrate into homepage**: Add section between features and testimonials
6. **Add reduced motion support**: Respect user preferences

### Suggested Order
1. Content schema (data contract first)
2. ComparisonCard component (building block)
3. Checkmark animations (polish)
4. ComparisonSection container (assembly)
5. Homepage integration (final wiring)
6. Reduced motion support (accessibility)

## Validation Commands
```bash
# Start dev server
pnpm dev

# Check section renders
curl -s http://localhost:3000 | grep -c "comparison"

# Typecheck
pnpm typecheck

# Lint
pnpm lint
```

## Related Files
- Initiative: `../initiative.md`
- Research: `../../research-library/perplexity-saas-homepage-patterns.md` (Section 5: Comparison Table Designs)
- Research: `../../research-library/context7-framer-motion-scroll.md` (Stagger animations)
- Existing pattern: `packages/ui/src/aceternity/card-spotlight.tsx` (spotlight effect reference)
