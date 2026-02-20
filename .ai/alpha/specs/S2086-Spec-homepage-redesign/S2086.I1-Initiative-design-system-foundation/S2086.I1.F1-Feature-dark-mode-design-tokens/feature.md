# Feature: Dark-Mode Design Tokens & Keyframes

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2086.I1 |
| **Feature ID** | S2086.I1.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
Establish the dark-mode-first CSS custom property system for the homepage redesign. This includes color tokens (background #0a0a0f, surface, border, text, accent #24a9e0), gradient definitions, and new animation keyframes (glowPulse, borderRotate). Also extends the existing GradientText component with a cyan accent variant. These tokens are the raw materials that all subsequent components and sections build on.

## User Story
**As a** developer building homepage sections
**I want to** have a comprehensive set of dark-mode CSS custom properties and animation keyframes
**So that** I can build consistent, cohesive dark-themed components without duplicating color values or animation definitions

## Acceptance Criteria

### Must Have
- [ ] CSS custom properties defined for homepage dark-mode palette: `--homepage-bg` (#0a0a0f), `--homepage-surface`, `--homepage-surface-elevated`, `--homepage-border`, `--homepage-border-subtle`, `--homepage-text` (#f5f5f7), `--homepage-text-muted`, `--homepage-accent` (#24a9e0), `--homepage-accent-glow`
- [ ] Gradient token definitions: `--homepage-gradient-accent` (cyan-to-blue), `--homepage-gradient-surface` (surface-to-transparent)
- [ ] `glowPulse` keyframe animation (accent color pulsing glow for CTAs and highlights)
- [ ] `borderRotate` keyframe animation (rotating gradient border for featured cards)
- [ ] GradientText component extended with `variant="cyan"` prop for cyan accent gradient
- [ ] All tokens scoped under `[data-marketing]` attribute to avoid polluting app styles
- [ ] Text contrast ratios verified: primary text on bg >= 17:1, muted text on bg >= 4.5:1 (WCAG AA)
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes

### Nice to Have
- [ ] CSS custom properties for glass morphism base values (blur radius, bg opacity, border opacity)
- [ ] Tailwind v4 `@theme` utility classes referencing the new tokens

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | GradientText cyan variant | Existing (extend) |
| **Logic** | N/A | N/A |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Extend existing `globals.css` and `theme.css` files following established patterns. Scope homepage tokens under `[data-marketing]` attribute (already used by marketing layout) to avoid conflicts with app styles. Use CSS custom properties (not Tailwind config) for dynamic theming flexibility.

### Key Architectural Choices
1. Scope tokens under `[data-marketing]` selector to isolate marketing styles from the authenticated app
2. Use existing `globals.css` for token definitions (follows current pattern) and `theme.css` for keyframes (follows current pattern)
3. Extend existing GradientText rather than creating a new component

### Trade-offs Accepted
- Tokens are CSS-only (no JS token object) — simpler but less portable. Acceptable since tokens are only used by marketing page components.

## Required Credentials
None required — this feature is purely CSS/component work with no external dependencies.

## Dependencies

### Blocks
- F2: Animation Infrastructure (keyframes may be referenced)
- F3: Card Components (tokens needed for glass/stat card styling)
- F4: Section Container & Content Config (tokens needed for section styling)

### Blocked By
- None (root feature)

### Parallel With
- F2: Animation Infrastructure (can run in parallel — F2 doesn't need tokens)

## Files to Create/Modify

### New Files
- None (extending existing files)

### Modified Files
- `apps/web/styles/globals.css` — Add `[data-marketing]` scoped CSS custom properties for homepage dark-mode palette
- `apps/web/styles/theme.css` — Add `glowPulse` and `borderRotate` keyframe animations, add `--animate-glow-pulse` and `--animate-border-rotate` utilities
- `packages/ui/src/makerkit/marketing/gradient-text.tsx` — Add `variant` prop with "default" and "cyan" options

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Define homepage color tokens**: Add CSS custom properties under `[data-marketing]` in globals.css with the full dark-mode palette
2. **Add gradient token definitions**: Define gradient CSS custom properties for accent and surface gradients
3. **Create glowPulse keyframe**: Add pulsing glow animation to theme.css with utility class
4. **Create borderRotate keyframe**: Add rotating gradient border animation to theme.css with utility class
5. **Extend GradientText component**: Add `variant` prop supporting "default" | "cyan" with cyan-to-blue gradient
6. **Verify contrast ratios**: Check all text/background combinations meet WCAG AA (4.5:1) and document results

### Suggested Order
1. Color tokens first (T1) — everything references these
2. Gradient tokens (T2) — builds on color tokens
3. Keyframes (T3, T4) — independent of tokens but logically follow
4. GradientText extension (T5) — uses gradient tokens
5. Contrast verification (T6) — validates all the above

## Validation Commands
```bash
# Verify dark-mode tokens exist in globals.css
grep '#0a0a0f' apps/web/styles/globals.css
grep '#24a9e0' apps/web/styles/globals.css
grep 'data-marketing' apps/web/styles/globals.css

# Verify keyframes exist in theme.css
grep 'glowPulse' apps/web/styles/theme.css
grep 'borderRotate' apps/web/styles/theme.css

# Verify GradientText has variant prop
grep 'variant' packages/ui/src/makerkit/marketing/gradient-text.tsx

# Type checking passes
pnpm typecheck

# Lint passes
pnpm lint
```

## Related Files
- Initiative: `../initiative.md`
- Existing theme: `apps/web/styles/theme.css`
- Existing shadcn tokens: `apps/web/styles/shadcn-ui.css`
- Existing globals: `apps/web/styles/globals.css`
- Existing GradientText: `packages/ui/src/makerkit/marketing/gradient-text.tsx`
- Research: `../../research-library/perplexity-saas-homepage-best-practices.md` (Section 3: Dark Mode Trends)
