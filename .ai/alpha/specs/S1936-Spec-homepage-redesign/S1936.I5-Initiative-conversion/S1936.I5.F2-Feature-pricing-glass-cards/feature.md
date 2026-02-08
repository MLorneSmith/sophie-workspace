# Feature: Pricing Glass Cards

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1936.I5 |
| **Feature ID** | S1936.I5.F2 |
| **Status** | Draft |
| **Estimated Days** | 5 |
| **Priority** | 2 |

## Description
Enhance the existing PricingTable component with glass card styling, a recommended tier highlight with glow effect, and an animated monthly/annual toggle. The redesign maintains full billing-gateway compatibility while adding premium visual polish.

## User Story
**As a** visitor considering SlideHeroes pricing
**I want to** see clear, visually distinct pricing tiers with a highlighted recommendation
**So that** I can quickly identify the best plan for my needs and feel confident in the value

## Acceptance Criteria

### Must Have
- [ ] Glass card effect on all pricing tiers (backdrop blur + semi-transparent background)
- [ ] Recommended tier has prominent glow effect (gradient border or shadow)
- [ ] "Popular" badge positioned above recommended tier
- [ ] Monthly/Annual toggle with smooth animation
- [ ] Price counter animation when switching intervals (numbers transition)
- [ ] Maintains existing PricingTable functionality (checkout, features list)
- [ ] Mobile responsive: cards stack on small screens with swipe hint

### Nice to Have
- [ ] Hover lift effect on cards
- [ ] Savings badge for annual billing ("Save 20%")
- [ ] Feature comparison tooltip on hover

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Enhanced PricingSection wrapper, GlassPricingCard | New (wraps existing) |
| **Logic** | Price animation (useSpring), toggle state | New + Existing |
| **Data** | billingConfig | Existing (no changes) |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Wrap existing PricingTable with enhanced styling rather than forking/modifying the billing-gateway package. Use CSS variables and Tailwind utilities for glass effects. Leverage Framer Motion for price animations.

### Key Architectural Choices
1. Create a `HomePricingSection` wrapper component that provides enhanced container styling
2. Pass custom `CheckoutButtonRenderer` prop to PricingTable for styled buttons
3. Use CSS custom properties for glass effect consistency with design system
4. Implement price counter animation as a separate component that wraps price display

### Trade-offs Accepted
- Cannot modify PricingTable's internal card structure - styling limited to container and custom components
- Glass effect relies on backdrop-filter which has limited mobile support (graceful degradation)

## Required Credentials
> Environment variables required for this feature to function. Extracted from research files.

None required - uses existing billing configuration with no new external services.

## Dependencies

### Blocks
- F3: Final CTA Section (pricing creates conversion momentum)

### Blocked By
- S1936.I1: Design System Foundation (requires glass effect utilities, animation tokens)
- F1: Comparison Section (visual flow - comparison before pricing)

### Parallel With
- None (sequential with F1)

## Files to Create/Modify

### New Files
- `apps/web/app/(marketing)/_components/home-pricing-section.tsx` - Enhanced pricing section wrapper
- `apps/web/app/(marketing)/_components/pricing-interval-toggle.tsx` - Animated billing toggle component

### Modified Files
- `apps/web/app/(marketing)/page.tsx` - Replace PricingTable with HomePricingSection
- `apps/web/styles/shadcn-ui.css` - Add glass card utility variables (if not in I1)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create glass card CSS utilities**: Add CSS variables for glass effect if not in design system
2. **Build HomePricingSection container**: Wrapper with glass card styling for tiers
3. **Create animated interval toggle**: Monthly/Annual switch with Framer Motion
4. **Implement price counter animation**: useSpring-based number transition
5. **Add recommended tier highlight**: Gradient glow effect for "Popular" tier
6. **Integrate into homepage**: Replace existing pricing section
7. **Add mobile optimizations**: Card stacking and touch interactions

### Suggested Order
1. Glass card CSS utilities (foundation)
2. HomePricingSection container (structure)
3. Animated interval toggle (interaction)
4. Price counter animation (polish)
5. Recommended tier highlight (visual emphasis)
6. Homepage integration (assembly)
7. Mobile optimizations (responsive)

## Validation Commands
```bash
# Start dev server
pnpm dev

# Check pricing section renders
curl -s http://localhost:3000 | grep -c "pricing"

# Test interval toggle manually
# Navigate to homepage, click Monthly/Annual toggle

# Typecheck
pnpm typecheck

# Lint
pnpm lint
```

## Related Files
- Initiative: `../initiative.md`
- Existing component: `packages/billing/gateway/src/components/pricing-table.tsx`
- Billing config: `apps/web/config/billing.config.ts`
- Research: `../../research-library/context7-framer-motion-scroll.md` (useSpring for counters)
- Research: `../../research-library/perplexity-saas-homepage-patterns.md` (pricing tier best practices)
