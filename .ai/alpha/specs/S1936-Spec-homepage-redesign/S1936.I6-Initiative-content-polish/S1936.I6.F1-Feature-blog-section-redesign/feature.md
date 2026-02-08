# Feature: Blog Section Redesign

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1936.I6 |
| **Feature ID** | S1936.I6.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
Redesign the Blog/Reads section with taller cards featuring image hover zoom effects, category badges, and read time metadata. Enhance the existing `BlogPostCard` component to match the premium design system established in earlier initiatives.

## User Story
**As a** first-time visitor
**I want to** see visually appealing blog post previews with clear categorization
**So that** I can quickly identify relevant content and be enticed to explore further

## Acceptance Criteria

### Must Have
- [ ] Taller card layout (increase from h-96 to h-[28rem] or similar)
- [ ] Image hover zoom effect (scale 1.05-1.1 on hover with smooth transition)
- [ ] Category badge component with distinct styling per category
- [ ] Read time metadata clearly displayed
- [ ] Dark mode styling consistent with design system
- [ ] Cards are clickable/linked to blog posts

### Nice to Have
- [ ] Subtle card lift effect on hover (translateY -2px)
- [ ] Staggered entrance animation when scrolling into view

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | BlogPostCard, CategoryBadge | Existing / New |
| **Logic** | Hover state management | Existing (CSS) |
| **Data** | homepageContentConfig.essentialReads | Existing |
| **Database** | N/A (static config) | N/A |

## Architecture Decision

**Approach**: Pragmatic - Enhance existing BlogPostCard component
**Rationale**: Component already exists with good structure. Modifications are additive: add zoom effect to image, create badge component, adjust dimensions.

### Key Architectural Choices
1. **CSS-only hover effects** - Use Tailwind's `group-hover:scale-105` for zoom, avoiding JS state management
2. **Separate CategoryBadge component** - Reusable badge with category-specific colors stored in config

### Trade-offs Accepted
- Keeping static config data (not fetching from CMS) to maintain simplicity and avoid I6 scope creep

## Required Credentials
None required - uses only static configuration data.

## Dependencies

### Blocks
- F2: Loading & Error States (provides section wrapper)
- F3: Accessibility (applies WCAG audit fixes)
- F4: Performance (applies image optimization)

### Blocked By
- S1936.I1: Design System Foundation (provides design tokens)

### Parallel With
- None (Priority 1, no parallel features at start)

## Files to Create/Modify

### New Files
- `packages/ui/src/shadcn/badge.tsx` - If not exists, add via shadcn CLI
- `apps/web/config/blog-categories.config.ts` - Category color mapping (optional)

### Modified Files
- `packages/ui/src/aceternity/blog-post-card.tsx` - Add hover zoom, taller layout, link wrapper
- `apps/web/app/(marketing)/page.tsx` - Update blog section grid, add Link wrapper
- `apps/web/config/homepage-content.config.ts` - Add category field to posts if missing

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Add hover zoom effect to BlogPostCard**: Add `group` class to wrapper, `group-hover:scale-105 transition-transform duration-300` to image
2. **Increase card height**: Update `h-96` to `h-[28rem]` or similar
3. **Create CategoryBadge component**: Small pill badge with category-specific background color
4. **Add category badge to BlogPostCard**: Position in top-left corner over image
5. **Make cards clickable**: Wrap BlogPostCard in Next.js Link component
6. **Update homepage content config**: Add `href` and `category` fields to posts
7. **Test dark mode styling**: Verify badge colors work in both themes

### Suggested Order
1. Update card dimensions (layout change)
2. Add hover zoom effect (visual enhancement)
3. Create and integrate CategoryBadge
4. Add link wrapper to cards
5. Update config with links
6. Test across themes

## Validation Commands
```bash
# TypeScript check
pnpm typecheck

# Lint check
pnpm lint

# Visual check - start dev server
pnpm dev

# Check BlogPostCard component exports
grep -r "BlogPostCard" packages/ui/package.json
```

## Related Files
- Initiative: `../initiative.md`
- Existing component: `packages/ui/src/aceternity/blog-post-card.tsx`
- Homepage: `apps/web/app/(marketing)/page.tsx`
- Content config: `apps/web/config/homepage-content.config.ts`
