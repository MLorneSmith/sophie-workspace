# Feature: Pricing Redesign

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2086.I5 |
| **Feature ID** | S2086.I5.F3 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 3 |

## Description
Redesign the Pricing section with a monthly/annual toggle switch, 3-tier glass card layout with a highlighted "Most Popular" middle tier, dark theme styling, and a glow pulse animation on the primary CTA button. This is a visual redesign only - no pricing logic changes.

## User Story
**As a** prospective customer evaluating pricing
**I want to** see clear, professionally presented pricing tiers with a toggle to compare monthly vs annual costs
**So that** I can quickly find the right plan and feel confident about the value

## Acceptance Criteria

### Must Have
- [ ] Monthly/annual toggle switch with "Save X%" label on annual
- [ ] 3-tier card layout: Free, Pro (highlighted "Most Popular"), Enterprise
- [ ] Glass card styling on all pricing cards with dark theme tokens
- [ ] "Most Popular" middle tier has elevated styling (accent border, badge, slight scale)
- [ ] Glow pulse animation on the primary CTA button of the highlighted tier
- [ ] Feature checkmark list on each card
- [ ] Section title and subtitle with gradient text
- [ ] Pricing data sourced from existing `billing.config.ts` (no hardcoded prices)

### Nice to Have
- [ ] Subtle hover lift effect on pricing cards
- [ ] Animated price transition when toggling monthly/annual

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Homepage pricing wrapper with glass cards | New |
| **UI** | Monthly/annual toggle switch | New |
| **Logic** | Interval toggle state management | New |
| **Data** | `billing.config.ts` pricing data | Existing |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Create a homepage-specific pricing section wrapper that sources data from the existing `billing.config.ts` but renders custom glass card UI. The existing `PricingTable` from `@kit/billing-gateway` is 522 lines and tightly coupled to checkout flows - wrapping it with glass styling would be fragile. Instead, create a simpler presentation component that reads the same config but renders the homepage-specific visual design. The toggle switch uses React state for interval selection.

### Key Architectural Choices
1. New homepage pricing component reading from `billing.config.ts`, not wrapping `PricingTable`
2. Simple `useState` for monthly/annual toggle (no external state management)
3. CTA buttons link to sign-up/checkout paths (same as current PricingTable)

### Trade-offs Accepted
- Duplicating some pricing display logic from `PricingTable` - acceptable because homepage pricing is visual-only and the original component handles checkout flows we don't need
- Price formatting must stay in sync with billing config updates

### Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Toggle switch | shadcn/ui `Switch` | Already installed | Standard toggle pattern |
| Glass cards | Glass card styling | I1 Design System | Consistent glass morphism |
| Badge ("Most Popular") | shadcn/ui `Badge` | Already installed | Standard badge component |
| Glow pulse | CSS `@keyframes glowPulse` | I1 Design System | Animation keyframes from design system |
| Section header | `SecondaryHero` | packages/ui (existing) | Consistent section headers |

## Required Credentials
> None required - visual redesign only, no payment integration changes.

## Dependencies

### Blocks
- None

### Blocked By
- S2086.I1: Design System Foundation (provides design tokens, glass card, animation keyframes)

### Parallel With
- F1: Comparison Section
- F2: Testimonials Redesign
- F4: Blog/Essential Reads Redesign
- F5: Final CTA Section

## Files to Create/Modify

### New Files
- `apps/web/app/(marketing)/_components/home-pricing-section.tsx` - Homepage pricing section with glass cards and toggle

### Modified Files
- `apps/web/config/homepage-content.config.ts` - Update pricing section config (title, subtitle, pill text)
- `apps/web/app/(marketing)/page.tsx` - Replace existing pricing integration with new component

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Update pricing content config**: Title, subtitle, pill text in content config
2. **Create homepage pricing component**: Glass card layout with 3 tiers, reading from billing config
3. **Implement monthly/annual toggle**: Switch component with interval state
4. **Add highlighted tier and glow CTA**: "Most Popular" badge, accent border, glowPulse on CTA
5. **Integrate into homepage**: Replace existing pricing section in page.tsx

### Suggested Order
Config → Pricing component → Toggle → Highlighted tier → Page integration

## Validation Commands
```bash
# Verify component exists
ls apps/web/app/\(marketing\)/_components/home-pricing-section.tsx

# Type checking
pnpm typecheck

# Lint
pnpm lint
```

## Related Files
- Initiative: `../initiative.md`
- Billing config: `apps/web/config/billing.config.ts`
- Billing sample config: `apps/web/config/billing.sample.config.ts`
- Existing PricingTable: `packages/billing/gateway/src/components/pricing-table.tsx`
- Homepage: `apps/web/app/(marketing)/page.tsx`
