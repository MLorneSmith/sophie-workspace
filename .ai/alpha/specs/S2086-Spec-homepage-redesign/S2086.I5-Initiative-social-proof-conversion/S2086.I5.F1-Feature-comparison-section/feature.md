# Feature: Comparison Section

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2086.I5 |
| **Feature ID** | S2086.I5.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
Implement the new Comparison section that displays side-by-side "Without SlideHeroes" and "With SlideHeroes" cards. The "without" card uses muted/dim styling while the "with" card uses accent-colored styling with checkmarks. Staggered entrance animations reveal each comparison point sequentially.

## User Story
**As a** prospective customer evaluating SlideHeroes
**I want to** see a clear side-by-side comparison of life without vs with the product
**So that** I understand the specific pain points the product solves and feel motivated to sign up

## Acceptance Criteria

### Must Have
- [ ] Two-card side-by-side layout: "Without SlideHeroes" (muted) and "With SlideHeroes" (accent)
- [ ] "Without" card shows 4-6 pain points with cross (✗) icons in muted/red styling
- [ ] "With" card shows 4-6 benefits with checkmark (✓) icons in accent/green styling
- [ ] Staggered entrance animation: items reveal one-by-one on viewport entry
- [ ] Section uses dark theme design tokens from I1 design system
- [ ] Content defined in `homepage-content.config.ts` (not hardcoded in component)
- [ ] Section wrapped with AnimateOnScroll for scroll-triggered fade-in
- [ ] Integrated into homepage `page.tsx` after Features Grid section

### Nice to Have
- [ ] Subtle glass card background on both cards
- [ ] Connecting "VS" badge between the two cards

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `home-comparison-section.tsx` (client) | New |
| **Logic** | Stagger animation variants (Framer Motion) | New |
| **Data** | `homepage-content.config.ts` comparison section | New (extend) |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Simple two-card layout using Framer Motion variants with `staggerChildren` for the item reveals. No complex data fetching needed - all content from config. Use the glass card component from I1 for card backgrounds.

### Key Architectural Choices
1. Client component with `"use client"` for Framer Motion animations
2. Content-driven: comparison items defined as arrays in content config, not hardcoded

### Trade-offs Accepted
- Hardcoded comparison items (not CMS-driven) - acceptable per spec scope

### Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Section wrapper | AnimateOnScroll | I1 Design System | Consistent scroll-triggered animation |
| Card backgrounds | Glass card styling | I1 Design System | Consistent glass morphism |
| Check/Cross icons | Lucide React (Check, X) | Already installed | Consistent icon library |

## Required Credentials
> None required - all content is static configuration.

## Dependencies

### Blocks
- None

### Blocked By
- S2086.I1: Design System Foundation (provides design tokens, glass card, AnimateOnScroll)

### Parallel With
- F2: Testimonials Redesign
- F3: Pricing Redesign
- F4: Blog/Essential Reads Redesign
- F5: Final CTA Section

## Files to Create/Modify

### New Files
- `apps/web/app/(marketing)/_components/home-comparison-section.tsx` - Comparison section client component

### Modified Files
- `apps/web/config/homepage-content.config.ts` - Add comparison section content config
- `apps/web/app/(marketing)/page.tsx` - Insert Comparison section after Features Grid

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Add comparison content config**: Define comparison items in `homepage-content.config.ts`
2. **Create comparison section component**: Build the two-card layout with staggered animations
3. **Integrate into homepage**: Add Comparison section to `page.tsx` with Suspense boundary

### Suggested Order
Config first → Component → Page integration

## Validation Commands
```bash
# Verify component exists
ls apps/web/app/\(marketing\)/_components/home-comparison-section.tsx

# Type checking
pnpm typecheck

# Lint
pnpm lint
```

## Related Files
- Initiative: `../initiative.md`
- Content config: `apps/web/config/homepage-content.config.ts`
- Homepage: `apps/web/app/(marketing)/page.tsx`
