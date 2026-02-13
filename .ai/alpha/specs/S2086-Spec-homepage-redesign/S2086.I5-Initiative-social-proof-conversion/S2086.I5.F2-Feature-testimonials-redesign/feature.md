# Feature: Testimonials Redesign

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2086.I5 |
| **Feature ID** | S2086.I5.F2 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 2 |

## Description
Redesign the existing Testimonials section with glass card styling, decorative accent-colored quotation marks, and a featured spanning testimonial card. Maintain the existing Supabase data integration via `TestimonialsMasonaryGridServer` while applying the new dark-mode design system visual treatment.

## User Story
**As a** prospective customer reading testimonials
**I want to** see polished, visually prominent social proof from real professionals
**So that** I feel confident that SlideHeroes delivers on its promises and trust the product

## Acceptance Criteria

### Must Have
- [ ] Masonry grid layout with glass card styling on each testimonial card
- [ ] Decorative accent-colored (`#24a9e0`) oversized quotation marks on cards
- [ ] Featured spanning testimonial card (spans 2 columns) with larger text and prominent avatar
- [ ] Cards use dark theme design tokens (dark backgrounds, light text, glass borders)
- [ ] Existing Supabase data integration preserved (server component fetches testimonials)
- [ ] Staggered fade-in animation when section scrolls into view
- [ ] Section title and subtitle use SecondaryHero pattern with gradient text

### Nice to Have
- [ ] Star rating display on testimonial cards
- [ ] Hover lift effect on cards

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Updated `TestimonialsMasonaryGrid` with glass cards | Existing (modify) |
| **UI** | Featured testimonial card variant | New |
| **Logic** | Featured testimonial selection logic | New |
| **Data** | Supabase testimonials query (unchanged) | Existing |
| **Database** | `testimonials` table (unchanged) | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Restyle the existing `TestimonialsMasonaryGrid` component rather than replacing it. Add a `variant` prop or create a wrapper component for the homepage-specific glass card styling. The featured spanning card can be identified by index (first item) or a flag in the data. Preserve the server component data fetching entirely.

### Key Architectural Choices
1. Create a homepage-specific testimonials wrapper that applies glass styling to existing masonry grid
2. Featured card identified by position (first testimonial) rather than database flag
3. Keep existing server component (`home-testimonials-grid-server.tsx`) with minimal changes

### Trade-offs Accepted
- Featured card selection by position (not configurable) - simple and predictable
- Modifying the shared `TestimonialsMasonaryGrid` component could affect other pages using it - mitigate with variant prop or wrapper

### Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Masonry grid | `TestimonialsMasonaryGrid` | packages/ui (existing) | Restyle, don't replace |
| Glass card | Glass card styling | I1 Design System | Consistent glass morphism |
| Quotation marks | Custom SVG/CSS | New | Decorative accent element |
| Section header | `SecondaryHero` | packages/ui (existing) | Consistent section headers |

## Required Credentials
> None required - uses existing Supabase integration (server-side, no new credentials).

## Dependencies

### Blocks
- None

### Blocked By
- S2086.I1: Design System Foundation (provides design tokens, glass card, AnimateOnScroll)

### Parallel With
- F1: Comparison Section
- F3: Pricing Redesign
- F4: Blog/Essential Reads Redesign
- F5: Final CTA Section

## Files to Create/Modify

### New Files
- `apps/web/app/(marketing)/_components/home-testimonials-section.tsx` - Homepage-specific testimonials wrapper with glass styling and featured card

### Modified Files
- `apps/web/app/(marketing)/_components/home-testimonials-grid-server.tsx` - Pass additional props for featured card, update styling classes
- `packages/ui/src/aceternity/testimonial-masonary-grid.tsx` - Add glass card variant styling, decorative quotation marks
- `apps/web/config/homepage-content.config.ts` - Update testimonials section config (title, subtitle)
- `apps/web/app/(marketing)/page.tsx` - Update Testimonials section integration

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Update testimonials content config**: Update title/subtitle in config
2. **Add glass card styling to masonry grid**: Update `TestimonialsMasonaryGrid` with dark theme glass card variant
3. **Add decorative quotation marks**: Oversized accent-colored quote marks on cards
4. **Create featured spanning testimonial card**: First testimonial spans 2 columns with larger treatment
5. **Update homepage integration**: Wire up redesigned testimonials in page.tsx

### Suggested Order
Config → Glass card styling → Quotation marks → Featured card → Page integration

## Validation Commands
```bash
# Verify server component still works with Supabase
pnpm typecheck

# Verify testimonials grid component
ls packages/ui/src/aceternity/testimonial-masonary-grid.tsx

# Lint
pnpm lint
```

## Related Files
- Initiative: `../initiative.md`
- Testimonials server: `apps/web/app/(marketing)/_components/home-testimonials-grid-server.tsx`
- Masonry grid: `packages/ui/src/aceternity/testimonial-masonary-grid.tsx`
- Homepage: `apps/web/app/(marketing)/page.tsx`
