# Feature: Social Proof Strip & Dual CTA Block

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1936.I2 |
| **Feature ID** | S1936.I2.F3 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 3 |

## Description
Implement the social proof micro-strip with avatar stack showing "Join 2,000+ professionals" and dual CTA buttons (primary: "Start Writing Free", secondary: "Watch Demo"). This provides immediate social validation and clear conversion paths above the fold.

## User Story
**As a** visitor evaluating SlideHeroes
**I want to** see proof that others use this product and have clear action paths
**So that** I feel confident clicking through and understand my options

## Acceptance Criteria

### Must Have
- [ ] Avatar stack showing 5 overlapping user avatars
- [ ] "Join 2,000+ professionals" text with subtle count-up animation
- [ ] Primary CTA button: "Start Writing Free" with prominent styling
- [ ] Secondary CTA button: "Watch Demo" with outline/ghost styling
- [ ] Proper spacing and alignment between elements
- [ ] Responsive layout (stack vertically on mobile)
- [ ] Accessible button labels and ARIA attributes

### Nice to Have
- [ ] Hover animation on avatar stack (slight expansion)
- [ ] Button hover micro-interactions (scale, glow)
- [ ] Subtle pulse animation on primary CTA to draw attention

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | AvatarStack, DualCtaBlock, SocialProofStrip | New (uses @magicui/avatar-circles) |
| **Logic** | Count-up animation with useInView | New |
| **Data** | Static avatar images, CTA routes | Config |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Use `@magicui/avatar-circles` for the avatar stack and custom number counter following Framer Motion research patterns. Per Perplexity research, limit social proof to key metrics and place near CTAs for maximum impact.

### Key Architectural Choices
1. Use MagicUI's `avatar-circles` component for professional overlapping avatars
2. Implement number counter using `useSpring` + `useMotionValue` pattern from research
3. Use shadcn Button variants (default for primary, outline for secondary)
4. Flex layout with gap for responsive spacing

### Trade-offs Accepted
- Using placeholder avatars initially (can be replaced with real user avatars later)
- Count animation triggers on page load, not scroll (above fold)

## Required Credentials
> None required - static content with frontend animations

## Dependencies

### Blocks
- None

### Blocked By
- F1: Hero Section Foundation (provides container and positioning)
- S1936.I1: Design System Foundation (requires button color tokens)

### Parallel With
- F2: Animated Headline (can be developed simultaneously after F1)

## Files to Create/Modify

### New Files
- `apps/web/app/(marketing)/_components/home-social-proof-strip.tsx` - Avatar stack + user count
- `apps/web/app/(marketing)/_components/home-hero-cta-block.tsx` - Dual CTA buttons
- `apps/web/public/images/avatars/` - Placeholder avatar images (5 images)

### Modified Files
- `apps/web/app/(marketing)/page.tsx` - Integrate social proof and CTAs into hero
- `packages/ui/package.json` - Add @magicui/avatar-circles if not present

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Avatar stack | avatar-circles | @magicui | Professional overlapping design, ready to use |
| Buttons | Button | shadcn/ui | Consistent with existing button patterns |
| Counter animation | Custom | Framer Motion | Per research, useSpring + useMotionValue |

**Components to Install** (if not already in packages/ui):
- [ ] `cd packages/ui && npx shadcn@latest add @magicui/avatar-circles`

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Install avatar-circles component**: Add from MagicUI registry
2. **Create SocialProofStrip component**: Avatar stack + animated counter
3. **Create HeroCtaBlock component**: Primary + secondary buttons with proper styling
4. **Add placeholder avatars**: Create/source 5 professional-looking avatar images
5. **Implement count-up animation**: Number animates from 0 to 2,000+ on load
6. **Integrate with homepage**: Place below headline in hero section
7. **Add responsive styles**: Stack vertically on mobile

### Suggested Order
1. Install avatar-circles
2. Create placeholder avatars
3. SocialProofStrip component
4. HeroCtaBlock component
5. Count-up animation
6. Homepage integration
7. Responsive polish

## Validation Commands
```bash
# Type check
pnpm typecheck

# Dev server visual inspection
pnpm dev
# Visit http://localhost:3000
# Verify: Avatars overlap correctly, count animates, both CTAs visible

# Button accessibility
# Tab through page - both CTAs should be focusable with visible focus ring
# Screen reader: buttons should announce their purpose

# Mobile responsive
# Chrome DevTools > Toggle device toolbar > iPhone 14 Pro
# Verify: Elements stack vertically, text readable, buttons full-width

# CTA links work
# Click "Start Writing Free" - should navigate to signup/app
# Click "Watch Demo" - should navigate to demo page or open modal
```

## Related Files
- Initiative: `../initiative.md`
- Hero Foundation: `../S1936.I2.F1-Feature-hero-section-foundation/`
- Existing CTA: `packages/ui/src/makerkit/marketing/cta-button.tsx`
- Framer Motion Research: `../../research-library/context7-framer-motion-scroll.md`
- SaaS Patterns Research: `../../research-library/perplexity-saas-homepage-patterns.md`
