# Feature: Blog/Essential Reads Redesign

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2086.I5 |
| **Feature ID** | S2086.I5.F4 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 4 |

## Description
Redesign the Blog/Essential Reads section as a 3-column grid with glass card styling, image thumbnails, category badges, and a hover-to-zoom image effect. Updates the existing `BlogPostCard` component to support the new dark-mode design system visual treatment.

## User Story
**As a** prospective customer browsing the homepage
**I want to** see curated essential reads with attractive thumbnails and clear categorization
**So that** I can explore relevant content that builds my confidence in SlideHeroes' expertise

## Acceptance Criteria

### Must Have
- [ ] 3-column grid layout displaying 3 featured blog posts
- [ ] Glass card styling on each blog card (dark theme, glass border, backdrop blur)
- [ ] Image thumbnail at top of each card with proper aspect ratio
- [ ] Hover-to-zoom effect on card thumbnails (CSS scale transform)
- [ ] Category badge on each card (e.g., "Technology", "Product Launch", "Strategy")
- [ ] Title, description, and read time displayed on each card
- [ ] Section title "Essential Reads" with gradient text
- [ ] Content sourced from `homepage-content.config.ts`
- [ ] Staggered fade-in animation when section scrolls into view

### Nice to Have
- [ ] "Read more" arrow link on each card
- [ ] Subtle gradient overlay on image thumbnails

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Homepage blog section wrapper | New |
| **UI** | Updated `BlogPostCard` with glass variant | Existing (modify) |
| **Logic** | Hover zoom CSS transition | New (CSS only) |
| **Data** | `homepage-content.config.ts` blog posts | Existing (extend) |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: The existing `BlogPostCard` (97 lines) uses a dark overlay approach with background images. For the redesign, create a homepage-specific blog card that uses glass card styling with a separate image thumbnail area (not background image). This avoids modifying the shared `BlogPostCard` that may be used elsewhere. The 3-column grid uses Tailwind responsive classes.

### Key Architectural Choices
1. New homepage blog card component rather than modifying shared `BlogPostCard`
2. Image thumbnail as a separate element (not background-image) for better accessibility and hover zoom
3. Content config extended with `categoryBadge` and `thumbnailSrc` fields

### Trade-offs Accepted
- Creating a new blog card component instead of extending the existing one - avoids regression risk on shared component
- Thumbnail images may need to be sourced/created for the 3 featured posts

### Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Glass cards | Glass card styling | I1 Design System | Consistent glass morphism |
| Category badge | shadcn/ui `Badge` | Already installed | Standard badge |
| Image | Next.js `Image` | Already installed | Optimized image loading |
| Section header | `SecondaryHero` | packages/ui (existing) | Consistent section headers |
| Stagger animation | AnimateOnScroll + variants | I1 Design System | Consistent scroll animation |

## Required Credentials
> None required - static content from config.

## Dependencies

### Blocks
- None

### Blocked By
- S2086.I1: Design System Foundation (provides design tokens, glass card, AnimateOnScroll)

### Parallel With
- F1: Comparison Section
- F2: Testimonials Redesign
- F3: Pricing Redesign
- F5: Final CTA Section

## Files to Create/Modify

### New Files
- `apps/web/app/(marketing)/_components/home-blog-section.tsx` - Homepage blog section with glass card grid

### Modified Files
- `apps/web/config/homepage-content.config.ts` - Extend blog posts config with `categoryBadge` and `thumbnailSrc` fields
- `apps/web/app/(marketing)/page.tsx` - Replace existing blog section with new component

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Extend blog content config**: Add `categoryBadge` and `thumbnailSrc` to essentialReads config
2. **Create homepage blog section component**: Glass card grid with image thumbnails, badges, hover zoom
3. **Integrate into homepage**: Replace existing blog section in page.tsx with new component

### Suggested Order
Config → Blog section component → Page integration

## Validation Commands
```bash
# Verify component exists
ls apps/web/app/\(marketing\)/_components/home-blog-section.tsx

# Type checking
pnpm typecheck

# Lint
pnpm lint
```

## Related Files
- Initiative: `../initiative.md`
- Existing BlogPostCard: `packages/ui/src/aceternity/blog-post-card.tsx`
- Content config: `apps/web/config/homepage-content.config.ts`
- Homepage: `apps/web/app/(marketing)/page.tsx`
