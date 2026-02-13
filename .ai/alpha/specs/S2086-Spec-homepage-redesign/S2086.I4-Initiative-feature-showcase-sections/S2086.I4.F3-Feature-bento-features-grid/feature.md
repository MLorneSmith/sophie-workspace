# Feature: Features Grid (Bento Layout)

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2086.I4 |
| **Feature ID** | S2086.I4.F3 |
| **Status** | Draft |
| **Estimated Days** | 5 |
| **Priority** | 3 |

## Description
Redesign the Features Grid section as a bento layout with 2 large + 4 standard glass/spotlight cards featuring a cursor-following radial glow effect. The grid uses an asymmetric layout where two cards span multiple columns for visual hierarchy. Each card displays an icon, title, and description with glass morphism + spotlight hover styling from the I1 design system.

## User Story
**As a** homepage visitor evaluating SlideHeroes
**I want to** see a visually striking grid of the product's key differentiating features
**So that** I understand what makes the product unique compared to alternatives

## Acceptance Criteria

### Must Have
- [ ] Bento grid layout: 2 large cards (spanning 2 columns) + 4 standard cards (1 column each)
- [ ] Grid layout: 3-column grid with Row 1 = [large, standard, standard], Row 2 = [standard, large, standard]
- [ ] Glass card styling (backdrop-filter: blur, subtle border, semi-transparent background) from I1
- [ ] Cursor-following radial glow effect on hover (extending existing CardSpotlight pattern)
- [ ] Each card: Lucide React icon + title + description
- [ ] 6 feature cards with updated content in `homepage-content.config.ts`
- [ ] Staggered card reveal animation on scroll using `whileInView` + `staggerChildren`
- [ ] Dark theme styling using I1 design tokens
- [ ] `prefers-reduced-motion` respected (cards visible without animation, glow disabled)
- [ ] Section renders correctly in isolation on the homepage

### Nice to Have
- [ ] Gradient border animation on large cards
- [ ] Subtle scale-up on card hover (1.02x)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `home-features-grid-client.tsx` (new bento grid), bento card component | New |
| **Logic** | Cursor tracking (mouseX/mouseY), stagger animation variants | New (extends CardSpotlight pattern) |
| **Data** | `homepage-content.config.ts` features section update | Modified |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic — New bento grid component that composes glass card styling (from I1) with the existing cursor-tracking pattern from `CardSpotlight`. Uses CSS Grid with explicit `grid-column: span 2` for large cards.

**Rationale**: The existing `CardSpotlight` already implements the cursor-following radial gradient pattern with `useMotionValue` + `useMotionTemplate`. Rather than modifying it (which would affect other usages), we create a new `BentoFeatureCard` that reuses the same cursor-tracking logic with glass morphism styling from I1. The bento grid is a CSS Grid layout problem, not a component library concern.

### Key Architectural Choices
1. CSS Grid with `grid-template-columns: repeat(3, 1fr)` and selective `col-span-2` for large cards
2. Card component combines glass card base (from I1) + cursor-following spotlight overlay (pattern from CardSpotlight)
3. Content config updated to include `size: "large" | "standard"` per feature card
4. Stagger animation using container variants with `staggerChildren: 0.15` and `whileInView`
5. Cursor glow uses `useMotionValue` for mouseX/mouseY and `useMotionTemplate` for radial gradient mask

### Trade-offs Accepted
- Duplicating the cursor-tracking logic from CardSpotlight rather than extending it — keeps the bento card self-contained and allows different glow styling (cyan accent vs CardSpotlight's neutral)
- Mobile responsive layout (single column) deferred to I6

## Required Credentials
> None required — no external services or API keys needed.

## Dependencies

### Blocks
- None

### Blocked By
- S2086.I1: Design System Foundation (provides design tokens, glass card component, spotlight card component, MotionProvider)

### Parallel With
- F1: Sticky Scroll Redesign
- F2: How It Works Stepper

## Files to Create/Modify

### New Files
- `apps/web/app/(marketing)/_components/home-features-grid-client.tsx` — Bento features grid with glass/spotlight cards (client component)

### Modified Files
- `apps/web/config/homepage-content.config.ts` — Update features section: new card content, add `size` field per card
- `apps/web/app/(marketing)/page.tsx` — Replace existing CardSpotlight grid with new bento grid component

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Update content config**: Update `features` section in `homepage-content.config.ts` — add `size` field ("large"/"standard"), update card content for 6 features
2. **Build bento feature card**: Create card component with glass styling + cursor-following glow, accepting `size` prop for large/standard variants
3. **Build bento grid component**: Create `home-features-grid-client.tsx` with CSS Grid bento layout, stagger animation, section heading
4. **Integrate on homepage**: Replace existing features section in `page.tsx` with new bento grid component
5. **Validate and lint**: Run typecheck, lint, format

### Suggested Order
1 → 2 → 3 → 4 → 5 (sequential — config → card → grid → integrate)

## Validation Commands
```bash
# Verify component exists
ls apps/web/app/\(marketing\)/_components/home-features-grid-client.tsx

# Verify content config has size field
grep -E 'size.*large|size.*standard' apps/web/config/homepage-content.config.ts

# Verify bento grid classes
grep 'col-span-2\|grid-cols-3\|bento' apps/web/app/\(marketing\)/_components/home-features-grid-client.tsx

# Type checking
pnpm typecheck

# Lint
pnpm lint
```

## Related Files
- Initiative: `../initiative.md`
- Existing CardSpotlight: `packages/ui/src/aceternity/card-spotlight.tsx`
- Existing features usage: `apps/web/app/(marketing)/page.tsx` (lines 169-196)
- Content config: `apps/web/config/homepage-content.config.ts`
- Framer Motion stagger: `../../research-library/context7-framer-motion.md` (Section 2)
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
