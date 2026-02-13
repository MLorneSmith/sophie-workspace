# Feature: Statistics Section

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2086.I3 |
| **Feature ID** | S2086.I3.F2 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 2 |

## Description
Implement a new Statistics section with 4 animated stat blocks in a responsive grid. Each block features a count-up animation triggered on viewport entry using the `useCountUp` hook from I1, accent-colored (#24a9e0) numbers with configurable suffixes (+, /5, %), descriptive labels, and staggered fade-in using Framer Motion variants.

## User Story
**As a** potential customer evaluating SlideHeroes
**I want to** see concrete metrics about product adoption and satisfaction
**So that** I have quantitative evidence that the product is trusted and effective

## Acceptance Criteria

### Must Have
- [ ] 4 stat blocks displayed in responsive grid (4-col desktop, 2-col tablet, 1-col mobile)
- [ ] Count-up animation from 0 to target value on viewport entry using `useCountUp` from I1
- [ ] Accent-colored (#24a9e0) numbers with suffix characters: "2,000+" / "50,000+" / "4.9/5" / "85%"
- [ ] Descriptive label text beneath each number (e.g., "Professionals", "Presentations Created")
- [ ] Staggered fade-in animation using `whileInView` with `staggerChildren` variants
- [ ] Section placed on homepage after Logo Cloud, before Sticky Scroll Features
- [ ] Statistics data driven from `homepage-content.config.ts`
- [ ] Uses AnimateOnScroll wrapper from I1 for section entrance
- [ ] Dark mode styling using I1 design tokens
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes

### Nice to Have
- [ ] Subtle glassmorphism card background on each stat block
- [ ] Numbers formatted with locale-aware thousand separators (e.g., "2,000")

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Statistics section client component + stat blocks | New |
| **Logic** | Count-up animation hook, stagger variants | From I1 / New |
| **Data** | Statistics array in content config | New |
| **Database** | N/A (hardcoded placeholders) | N/A |

## Architecture Decision

**Approach**: Pragmatic — new client component using I1 building blocks
**Rationale**: This is a new section with no existing component to restyle. Build a focused client component that composes I1's `useCountUp` hook and `AnimateOnScroll` wrapper with Framer Motion `staggerChildren` variants for the grid animation.

### Key Architectural Choices
1. Single client component `home-statistics-section.tsx` that handles the entire section
2. Use Framer Motion `containerVariants` / `itemVariants` pattern with `whileInView` for staggered grid animation
3. Each stat block uses `useCountUp` hook from I1 for the number animation
4. Statistics data defined in `homepage-content.config.ts` for easy content updates
5. Responsive grid via Tailwind: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`

### Trade-offs Accepted
- Hardcoded placeholder values rather than dynamic from database (per spec scope)
- Single component file rather than extracting stat-block sub-component (keeps it simple for 4 items)

### Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Section entrance | AnimateOnScroll | I1 (new) | Unified viewport animation |
| Count-up numbers | useCountUp hook | I1 (new) | Shared animation utility |
| Stagger grid | motion.div variants | motion/react | Standard Framer Motion pattern |
| Stat block | Inline or stat card from I1 | I1 (new) | Reusable across sections if needed |

## Required Credentials
> None required — all statistics are hardcoded placeholder values.

## Dependencies

### Blocks
- S2086.I6: Responsive & Accessibility Polish

### Blocked By
- S2086.I1: Design System Foundation (useCountUp hook, stat card component, AnimateOnScroll, MotionProvider, design tokens)

### Parallel With
- F1: Logo Cloud Redesign

## Files to Create/Modify

### New Files
- `apps/web/app/(marketing)/_components/home-statistics-section.tsx` — Client component with count-up stats grid

### Modified Files
- `apps/web/config/homepage-content.config.ts` — Add `statistics` section config with 4 stat items
- `apps/web/app/(marketing)/page.tsx` — Add Statistics section after Logo Cloud

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Add statistics config to content config**: Define 4 stat items (value, suffix, label) in `homepage-content.config.ts`
2. **Create statistics section component**: Client component with count-up grid using I1 hooks/components
3. **Integrate statistics into homepage**: Add section to `page.tsx` after logo cloud with Suspense boundary
4. **Validate statistics section**: Visual verification, typecheck, lint

### Suggested Order
Config → Component → Homepage integration → Validation

## Validation Commands
```bash
# Verify statistics component exists
ls apps/web/app/\(marketing\)/_components/home-statistics-section.tsx

# Verify content config updated
grep -l "statistics" apps/web/config/homepage-content.config.ts

# Type checking
pnpm typecheck

# Lint
pnpm lint
```

## Related Files
- Initiative: `../initiative.md`
- Content config: `apps/web/config/homepage-content.config.ts`
- Homepage: `apps/web/app/(marketing)/page.tsx`
- I1 hooks (to be created): `apps/web/app/(marketing)/_lib/hooks/use-count-up.ts`
- I1 components (to be created): AnimateOnScroll, stat card
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
