# Feature: Dashboard Page & Layout

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1890.I1 |
| **Feature ID** | S1890.I1.F1 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 1 |

## Description
Create the core dashboard page structure in `/home/(user)/page.tsx` with responsive 3-3-1 grid layout, proper PageBody container, semantic header, and i18n integration. This establishes the structural foundation for all widget placements.

## User Story
**As a** SlideHeroes learner
**I want to** see a well-organized dashboard layout when I log in
**So that** I can quickly scan all my progress metrics and take action

## Acceptance Criteria

### Must Have
- [ ] Page renders with responsive 3-3-1 grid layout (1 column mobile, 2 tablet, 3 desktop)
- [ ] PageBody container with proper spacing wraps all content
- [ ] Dashboard title and description display via HomeLayoutPageHeader
- [ ] Page metadata generated via generateMetadata with i18n
- [ ] withI18n wrapper applied to exported component
- [ ] Dark mode support via semantic Tailwind classes (bg-background, text-foreground)

### Nice to Have
- [ ] Semantic section landmarks for accessibility

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Dashboard grid layout with Card placeholders | New |
| **Logic** | None (static layout) | N/A |
| **Data** | None (data fetching in I2) | N/A |
| **Database** | None | N/A |

## Architecture Decision

**Approach**: Pragmatic - Use existing PageBody/Card components with minimal new code
**Rationale**: All required UI primitives exist; we're composing them into the dashboard layout

### Key Architectural Choices
1. Use Tailwind grid (`grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3`) for responsive layout
2. Full-width bottom row uses `lg:col-span-3` for the presentations table
3. Reuse existing `HomeLayoutPageHeader` component - no modifications needed

### Trade-offs Accepted
- Not using CSS Grid areas (named regions) - Tailwind classes are simpler and match codebase patterns

## Required Credentials
> Environment variables required for this feature to function.

None required - this is a static layout feature.

## Dependencies

### Blocks
- F2: Widget Placeholder Grid (needs page structure to place placeholders)
- F3: Navigation & Routing (needs page to exist)

### Blocked By
- None (first feature in initiative)

### Parallel With
- None (must complete first)

## Files to Create/Modify

### New Files
- None (modifying existing page)

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Add grid layout structure with placeholder divs

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Update page.tsx imports**: Add Card components from @kit/ui/card
2. **Add responsive grid container**: Inside PageBody with Tailwind grid classes
3. **Add 6 widget placeholder Cards**: For rows 1-2 (3 per row)
4. **Add full-width presentations section**: Row 3 with lg:col-span-3
5. **Verify dark mode**: Test with dark mode toggle
6. **Run validation**: pnpm typecheck && pnpm lint

### Suggested Order
1 → 2 → 3 → 4 → 5 → 6 (sequential)

## Validation Commands
```bash
# Verify page exists and has grid layout
grep -q "grid-cols-1.*md:grid-cols-2.*lg:grid-cols-3" apps/web/app/home/\(user\)/page.tsx && echo "✓ Responsive grid"

# Verify PageBody wrapper
grep -q "PageBody" apps/web/app/home/\(user\)/page.tsx && echo "✓ PageBody wrapper"

# Verify withI18n export
grep -q "withI18n" apps/web/app/home/\(user\)/page.tsx && echo "✓ i18n wrapper"

# Run typecheck
pnpm typecheck

# Run lint
pnpm lint
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- Reference: `apps/web/app/home/[account]/page.tsx` (team dashboard pattern)
- Components: `packages/ui/src/shadcn/card.tsx`
