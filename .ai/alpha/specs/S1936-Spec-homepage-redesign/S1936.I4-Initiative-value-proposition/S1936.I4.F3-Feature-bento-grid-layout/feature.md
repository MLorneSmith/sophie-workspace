# Feature: Bento Grid Layout

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1936.I4 |
| **Feature ID** | S1936.I4.F3 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 3 |

## Description
Create an asymmetric features bento grid layout for the "How we are different" section. The grid uses CSS Grid with varying column/row spans to create visual hierarchy - larger cards for primary differentiators (Fine-tuned AI, Private Coaching) and smaller cards for supporting features. This replaces the current equal-sized feature grid.

## User Story
**As a** first-time visitor
**I want to** quickly scan SlideHeroes' key differentiators in a visually engaging layout
**So that** I can understand what makes this product unique without reading every detail

## Acceptance Criteria

### Must Have
- [ ] Bento grid renders with asymmetric card sizes
- [ ] Grid uses 4-column layout on desktop with varying spans
- [ ] At least 2 "hero" cards span 2 columns
- [ ] Smaller cards fill remaining grid cells
- [ ] All cards have consistent padding, border radius, and spacing
- [ ] Grid is responsive: 2 columns on tablet, 1 column on mobile
- [ ] Cards follow existing dark theme styling (glass card aesthetic)

### Nice to Have
- [ ] Staggered fade-in animation when grid scrolls into view
- [ ] Cards support optional header images/illustrations
- [ ] Layout adapts to 5-6 feature cards without breaking

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | BentoGrid container | New (or adapt Aceternity) |
| **UI** | BentoGridItem card | New |
| **Logic** | Grid configuration props | New |
| **Data** | Features content configuration | Modify existing |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic (adapt Aceternity bento-grid with customizations)
**Rationale**: The Aceternity UI library provides a bento-grid component (`@aceternity/bento-grid`) that we can install and customize. This provides:
1. Proven CSS Grid pattern with responsive breakpoints
2. Consistent component structure matching other Aceternity components
3. Easy integration with existing CardSpotlight for hover effects (F4)

### Key Architectural Choices
1. Install Aceternity bento-grid: `npx shadcn@latest add @aceternity/bento-grid`
2. Customize styling to match SlideHeroes design system (dark theme, glass cards)
3. Define card sizes via `className` prop using Tailwind spans: `col-span-2 row-span-2`
4. Content configured in `homepage-content.config.ts` alongside other sections
5. Each card accepts header, icon, title, description props (from Aceternity API)

### Trade-offs Accepted
- Using Aceternity component adds @tabler/icons-react dependency (can be replaced with Lucide)
- Grid layout is less flexible than fully custom, but faster to implement

## Required Credentials
> None required - this is a frontend-only component

## Dependencies

### Blocks
- F4: Spotlight Feature Cards (F4 adds spotlight effect to these bento cards)

### Blocked By
- S1936.I1: Design System Foundation (color tokens, glass card styles)

### Parallel With
- F1: Sticky Scroll Enhancement
- F2: How It Works Stepper

## Files to Create/Modify

### New Files
- `packages/ui/src/aceternity/bento-grid.tsx` - Aceternity bento grid (via shadcn install)

### Modified Files
- `packages/ui/package.json` - Add bento-grid export
- `apps/web/config/homepage-content.config.ts` - Add bento features content with sizes
- `apps/web/app/(marketing)/page.tsx` - Replace current feature grid with BentoGrid
- `apps/web/app/(marketing)/_components/home-bento-features.tsx` - Optional client component wrapper

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Install Aceternity bento-grid**: Run shadcn CLI to add component
2. **Customize bento-grid styling**: Update colors, borders, shadows to match design system
3. **Define grid layout configuration**: Set up span classes for hero vs standard cards
4. **Create features content config**: Define 6 features with sizes, icons, descriptions
5. **Integrate BentoGrid into homepage**: Replace existing features section
6. **Add responsive breakpoints**: Test and adjust tablet/mobile layouts
7. **Add scroll animation**: Optional staggered fade-in using whileInView

### Suggested Order
1. Install component (foundation)
2. Styling customization (match design system)
3. Content configuration (data)
4. Homepage integration (render)
5. Responsive testing (polish)
6. Animation enhancement (if time)

## Validation Commands
```bash
# Component installed
ls packages/ui/src/aceternity/ | grep -c "bento"

# TypeScript compilation
pnpm typecheck

# Grid renders
curl -s http://localhost:3000 | grep -c "bento"

# Features present
curl -s http://localhost:3000 | grep -c "Fine-tuned AI"
curl -s http://localhost:3000 | grep -c "Private Coaching"

# Visual inspection
pnpm dev
# Check: Asymmetric grid, responsive on resize
```

## Related Files
- Initiative: `../initiative.md`
- Aceternity bento-grid: https://ui.aceternity.com/components/bento-grid
- Current features section: `apps/web/app/(marketing)/page.tsx` (lines 179-194)
- Existing CardSpotlight: `packages/ui/src/aceternity/card-spotlight.tsx`
