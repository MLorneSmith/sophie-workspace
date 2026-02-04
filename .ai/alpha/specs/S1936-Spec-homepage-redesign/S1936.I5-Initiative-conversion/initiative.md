# Initiative: Conversion

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1936 |
| **Initiative ID** | S1936.I5 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 5 |

---

## Description
Implement the conversion-focused sections: a new comparison section with side-by-side "Without/With SlideHeroes" cards featuring animated checkmarks, a redesigned pricing section with glass card tiers and recommended highlight, and a new final CTA section with large gradient orb and trust badges.

## Business Value
These sections drive the final conversion decision. The comparison clearly differentiates SlideHeroes from alternatives (research shows comparison tables need consistent attributes), pricing transparency reduces friction, and the final CTA reinforces the value proposition with a last push toward sign-up.

---

## Scope

### In Scope
- [ ] Comparison section with "Without/With" cards
- [ ] Animated checkmarks (✓) on "With" side
- [ ] Muted styling on "Without" side
- [ ] Accent glow on "With" card
- [ ] Pricing section with glass card styling
- [ ] 3 pricing tiers (Free, Professional, Enterprise)
- [ ] Recommended tier highlight with glow effect
- [ ] Monthly/Annual toggle
- [ ] Final CTA section (full-width)
- [ ] Large gradient orb animation
- [ ] Trust badges (No credit card, Free plan, Cancel anytime)
- [ ] Dual CTAs (Start Writing Free, Book a Demo)
- [ ] Mobile responsive design

### Out of Scope
- [ ] Actual payment processing
- [ ] Subscription management
- [ ] Feature comparison matrix
- [ ] Competitor-specific comparison pages

---

## Dependencies

### Blocks
- S1936.I6: Content & Polish

### Blocked By
- S1936.I1: Design System Foundation (requires color tokens, glass effect utilities)

### Parallel With
- S1936.I2: Hero & Product Preview
- S1936.I3: Trust Elements
- S1936.I4: Value Proposition

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | Glass cards and comparison layout are straightforward |
| External dependencies | Low | Uses existing PricingTable component from @kit/billing-gateway |
| Unknowns | Low | Pricing tiers already defined in config |
| Reuse potential | High | Comparison pattern and final CTA reusable for landing pages |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Comparison Section Container**: Side-by-side card layout
2. **Comparison Card**: Without/With styling variants
3. **Animated Checkmark List**: Staggered check animations
4. **Pricing Glass Cards**: Enhanced styling for tiers
5. **Pricing Toggle**: Monthly/Annual with animation
6. **Final CTA Section**: Gradient orb, trust badges, dual CTAs

### Suggested Order
1. Comparison section container (layout)
2. Comparison card variants (content)
3. Animated checkmark list (polish)
4. Pricing glass cards (core)
5. Pricing toggle (interaction)
6. Final CTA section (closing)

---

## Validation Commands
```bash
# Check comparison section renders
curl -s http://localhost:3000 | grep -c "comparison"

# Check pricing section renders
curl -s http://localhost:3000 | grep -c "pricing"

# Check final CTA renders
curl -s http://localhost:3000 | grep -c "final-cta"

# Scroll depth test (should reach 60%+ to final CTA)
pnpm dev
```

---

## Related Files
- Spec: `../spec.md`
- Pricing Table: `packages/billing-gateway/src/components/pricing-table.tsx`
- Homepage: `apps/web/app/(marketing)/page.tsx`
- Feature Flags: `apps/web/config/feature-flags.config.ts`
- SaaS Patterns Research: `../research-library/perplexity-saas-homepage-patterns.md`
