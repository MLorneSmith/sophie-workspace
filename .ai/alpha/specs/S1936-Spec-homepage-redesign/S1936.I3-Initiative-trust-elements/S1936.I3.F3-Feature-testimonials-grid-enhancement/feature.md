# Feature: Testimonials Grid Enhancement

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1936.I3 |
| **Feature ID** | S1936.I3.F3 |
| **Status** | Draft |
| **Estimated Days** | 5 |
| **Priority** | 3 |

## Description
Enhance the existing testimonials masonry grid with glass card styling, a featured testimonial spanning 2 columns, star ratings, and staggered fade-in animations on scroll. The existing component at `packages/ui/src/aceternity/testimonial-masonary-grid.tsx` provides the foundation; this feature adds premium visual polish.

## User Story
**As a** potential customer
**I want to** read authentic testimonials from real users
**So that** I feel confident that SlideHeroes delivers on its promises

## Acceptance Criteria

### Must Have
- [ ] Glass card design for all testimonial cards (semi-transparent background, backdrop blur)
- [ ] Star rating display (1-5 stars) on each card
- [ ] Featured testimonial card spans 2 columns on desktop
- [ ] Staggered fade-in animation when section scrolls into view
- [ ] Masonry grid: 4 columns desktop, 2 tablet, 1 mobile
- [ ] Consistent 32px gap between cards
- [ ] Avatar image with fallback initials

### Nice to Have
- [ ] Hover effect with subtle card lift
- [ ] Quote icon decoration
- [ ] Company logo on featured card
- [ ] Animation respects prefers-reduced-motion

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `TestimonialsMasonaryGrid` | Existing - Enhance |
| **UI** | Testimonial card (internal) | Existing - Enhance |
| **Logic** | Stagger animation with whileInView | New |
| **Data** | Testimonials from Supabase | Existing |
| **Database** | `testimonials` table | Existing |

## Architecture Decision

**Approach**: Enhancement of Existing Component
**Rationale**: The masonry grid component already works well with database integration and fallback data. Enhancements focus on visual styling (glass effect, star ratings) and animation (stagger). Minimal structural changes needed.

### Key Architectural Choices
1. Use CSS classes from S1936.I1 for glass effect (backdrop-blur, translucent background)
2. Add star rating component inline (simple SVG stars)
3. Use framer-motion `whileInView` with `stagger()` for fade-in animation
4. Featured card detection via database flag or array position
5. Keep existing server component for data fetching

### Trade-offs Accepted
- Featured card logic adds complexity but significantly improves visual impact

## Required Credentials
> Environment variables required for this feature to function.

None required - uses existing Supabase connection with RLS.

## Dependencies

### Blocks
- None within initiative

### Blocked By
- S1936.I1: Design System Foundation (needs glass effect utilities, animation variables)

### Parallel With
- F1: Logo Cloud Marquee Enhancement
- F2: Statistics Counter Section

## Files to Create/Modify

### New Files
- `packages/ui/src/aceternity/star-rating.tsx` - Simple star rating display component

### Modified Files
- `packages/ui/src/aceternity/testimonial-masonary-grid.tsx` - Add glass styling, featured card, stagger animation
- `apps/web/app/(marketing)/_components/home-testimonials-grid-server.tsx` - Update props for featured testimonial
- `packages/ui/package.json` - Export star-rating if separate component

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Add glass card styling**: Apply backdrop-blur and translucent background to cards
2. **Create StarRating component**: Display 1-5 stars based on rating value
3. **Implement featured card**: Logic and styling for 2-column span
4. **Add stagger animation**: Use whileInView with stagger() for fade-in
5. **Add hover effects**: Subtle card lift on hover
6. **Responsive refinements**: Verify 4/2/1 column layout works
7. **Reduced motion support**: Skip animations when preference set
8. **Quote icon decoration**: Add decorative quote mark to cards

### Suggested Order
1. Glass card styling (visual foundation)
2. StarRating component (needed for all cards)
3. Featured card implementation
4. Stagger animation
5. Hover effects
6. Responsive refinements
7. Quote icon decoration
8. Reduced motion support

## Validation Commands
```bash
# Check existing component
ls packages/ui/src/aceternity/testimonial-masonary-grid.tsx

# Verify server component
ls apps/web/app/(marketing)/_components/home-testimonials-grid-server.tsx

# Check database testimonials
pnpm supabase:web:start
# Then query: SELECT * FROM testimonials WHERE status = 'approved';

# Run dev server and scroll test
pnpm dev

# Typecheck
pnpm typecheck

# Check animation performance
# Use Chrome DevTools Performance tab
```

## Related Files
- Initiative: `../initiative.md`
- Existing Grid: `packages/ui/src/aceternity/testimonial-masonary-grid.tsx`
- Server Component: `apps/web/app/(marketing)/_components/home-testimonials-grid-server.tsx`
- Animation Research: `../../research-library/context7-framer-motion-scroll.md` (Section 3: Staggered animation)
- SaaS Patterns: `../../research-library/perplexity-saas-homepage-patterns.md` (Section 6: Masonry grids)
- Database Schema: `apps/web/supabase/migrations/20250210190138_web_testimonials.sql`

## Implementation Reference

From Context7 research, the stagger animation pattern:

```typescript
import { motion, stagger } from "motion/react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      delayChildren: stagger(0.1),
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 }
  },
};

// In component:
<motion.div
  initial="hidden"
  whileInView="visible"
  variants={containerVariants}
  viewport={{ once: true, margin: "-50px" }}
>
  {testimonials.map((t) => (
    <motion.div key={t.id} variants={cardVariants} className="glass-card">
      {/* Card content */}
    </motion.div>
  ))}
</motion.div>
```

## Glass Card CSS Reference

Requires CSS utilities from S1936.I1:

```css
.glass-card {
  background: hsl(var(--card) / 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid hsl(var(--border) / 0.3);
  border-radius: var(--radius-lg);
}
```
