# Feature: How It Works Section

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2086.I4 |
| **Feature ID** | S2086.I4.F2 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 2 |

## Description
Implement a new "How It Works" section with a 4-step horizontal stepper (Assemble → Outline → Storyboard → Produce). Each step has an icon, title, and description. Steps are connected by an animated horizontal line that fills as the user scrolls into view. Steps reveal with a staggered animation on viewport entry.

## User Story
**As a** potential customer browsing the SlideHeroes homepage
**I want to** see a clear, step-by-step visualization of how the product workflow operates
**So that** I understand the process and feel confident the tool is easy to use

## Acceptance Criteria

### Must Have
- [ ] 4-step horizontal stepper layout on desktop (Assemble → Outline → Storyboard → Produce)
- [ ] Each step displays: numbered circle icon, step title, and step description
- [ ] Animated connecting line between steps that draws on scroll-into-view
- [ ] Staggered step reveal animation (each step fades in with slight delay)
- [ ] Section heading ("How It Works") with subtitle
- [ ] Content driven from `homepage-content.config.ts` (new `howItWorks` section)
- [ ] Dark theme styling using I1 design tokens
- [ ] `prefers-reduced-motion` respected (all steps visible immediately, no line animation)
- [ ] Section renders correctly in isolation on the homepage

### Nice to Have
- [ ] Lucide React icons per step (configurable via content config)
- [ ] Subtle icon bounce animation on reveal

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `home-how-it-works-client.tsx` (new section component) | New |
| **Logic** | Stagger animation with `whileInView` + variants, line animation with `useInView` | New |
| **Data** | `homepage-content.config.ts` howItWorks section | New |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic — Single client component using Framer Motion variants with `staggerChildren` for step reveal and a CSS-animated connecting line triggered by `useInView`.

**Rationale**: The stepper is self-contained with no complex scroll-linked behavior (unlike the sticky scroll). Framer Motion's declarative `whileInView` + `staggerChildren` pattern is the simplest and most performant approach. The connecting line uses a CSS `scaleX` transition triggered by a boolean `isInView` state.

### Key Architectural Choices
1. Container variants with `staggerChildren: 0.2` and `delayChildren: 0.3` for step reveal
2. Connecting line implemented as a `<div>` with `scaleX` transform animated from 0 to 1 via `useInView` + CSS transition (no Framer Motion needed for the line itself — keeps it simple)
3. Steps data structure in content config: `{ icon: LucideIconName, title: string, description: string }`
4. Flexbox layout with `justify-between` for even step spacing; line positioned absolutely behind steps

### Trade-offs Accepted
- Horizontal layout on desktop only; vertical stack on mobile deferred to I6 (responsive polish)
- Using CSS transition for the line instead of Framer Motion spring — simpler and performs better for a single `scaleX` animation

## Required Credentials
> None required — no external services or API keys needed.

## Dependencies

### Blocks
- None

### Blocked By
- S2086.I1: Design System Foundation (provides design tokens, MotionProvider, AnimateOnScroll)

### Parallel With
- F1: Sticky Scroll Redesign
- F3: Bento Features Grid

## Files to Create/Modify

### New Files
- `apps/web/app/(marketing)/_components/home-how-it-works-client.tsx` — How It Works stepper component (client component)

### Modified Files
- `apps/web/config/homepage-content.config.ts` — Add `howItWorks` section with 4 steps data
- `apps/web/app/(marketing)/page.tsx` — Add How It Works section between Sticky Scroll and Features Grid

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Add content config**: Add `howItWorks` section to `homepage-content.config.ts` with 4 steps (icon, title, description)
2. **Build stepper component**: Create `home-how-it-works-client.tsx` with horizontal layout, step cards, connecting line, stagger animation
3. **Integrate on homepage**: Add section to `page.tsx` between sticky scroll and features grid sections
4. **Validate and lint**: Run typecheck, lint, format

### Suggested Order
1 → 2 → 3 → 4 (sequential)

## Validation Commands
```bash
# Verify component exists
ls apps/web/app/\(marketing\)/_components/home-how-it-works-client.tsx

# Verify content config has howItWorks
grep 'howItWorks' apps/web/config/homepage-content.config.ts

# Verify section added to page
grep -i 'how.*it.*works\|HowItWorks' apps/web/app/\(marketing\)/page.tsx

# Type checking
pnpm typecheck

# Lint
pnpm lint
```

## Related Files
- Initiative: `../initiative.md`
- Framer Motion stagger patterns: `../../research-library/context7-framer-motion.md` (Section 2: Stagger Animations)
- Homepage page: `apps/web/app/(marketing)/page.tsx`
- Content config: `apps/web/config/homepage-content.config.ts`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
