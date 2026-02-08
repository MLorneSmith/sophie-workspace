# Feature: Color Token System

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1936.I1 |
| **Feature ID** | S1936.I1.F1 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 1 |

## Description
Implement a comprehensive dark-mode-first color palette with CSS custom properties for the homepage redesign. This establishes the visual foundation with semantic naming for backgrounds, text hierarchy, accent colors, and gradients that all subsequent features and initiatives will use.

## User Story
**As a** developer working on the homepage redesign
**I want to** have a consistent, semantic color token system
**So that** I can build components with a cohesive visual language that automatically supports dark/light modes

## Acceptance Criteria

### Must Have
- [ ] Dark-mode-first background palette (`--homepage-bg-primary`, `--homepage-bg-secondary`, `--homepage-bg-tertiary`, `--homepage-bg-accent`)
- [ ] Text hierarchy tokens (`--homepage-text-primary`, `--homepage-text-secondary`, `--homepage-text-tertiary`, `--homepage-text-muted`)
- [ ] Accent color tokens with glow variants (`--homepage-accent-primary`, `--homepage-accent-glow`, `--homepage-accent-gradient-start/end`)
- [ ] Gradient definitions (`--homepage-gradient-hero`, `--homepage-gradient-card-border`, `--homepage-gradient-text`)
- [ ] Light mode overrides that maintain the design aesthetic
- [ ] WCAG AA compliance for text contrast ratios (4.5:1 minimum)

### Nice to Have
- [ ] CSS utility classes for common color combinations (e.g., `.homepage-card-glass`)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A (CSS only) | N/A |
| **Logic** | N/A | N/A |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Minimal/Pragmatic
**Rationale**: This feature extends the existing `@theme inline` block pattern in `apps/web/styles/theme.css` with homepage-specific tokens. Using a `--homepage-` prefix prevents conflicts with existing shadcn tokens while maintaining consistency with the established CSS variable system.

### Key Architectural Choices
1. Use `@theme inline` block in `theme.css` for Tailwind CSS 4 integration
2. Prefix all homepage tokens with `--homepage-` to namespace them
3. Define dark mode values first (default), then override for `.dark-mode-off` or light mode scenarios

### Trade-offs Accepted
- Namespace prefix adds verbosity but prevents naming conflicts with existing 50+ color tokens

## Required Credentials
None required - this is a CSS-only feature with no external service dependencies.

## Dependencies

### Blocks
- F2: Typography Scale (uses text colors)
- F3: Spacing & Layout Tokens (uses background colors)
- F4: Animation Utilities (uses accent colors for glow effects)
- F5: Glass Effect Utilities (uses background and accent colors)

### Blocked By
- None (foundation feature)

### Parallel With
- None (must complete first as foundation)

## Files to Create/Modify

### New Files
- None

### Modified Files
- `apps/web/styles/theme.css` - Add homepage color tokens in `@theme inline` block
- `apps/web/styles/shadcn-ui.css` - Add light mode overrides if needed

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Add background palette tokens**: Define 4 background color variables with dark-mode-first values
2. **Add text hierarchy tokens**: Define 4 text color variables following design spec
3. **Add accent and glow tokens**: Define accent primary, glow, and gradient endpoints
4. **Add gradient definitions**: Create hero, card-border, and text gradients
5. **Add light mode overrides**: Create `.dark-mode-off` or equivalent selector with light values
6. **Validate contrast ratios**: Test all text/background combinations against WCAG AA

### Suggested Order
1. Background palette → 2. Text hierarchy → 3. Accent colors → 4. Gradients → 5. Light mode → 6. Validation

## Validation Commands
```bash
# Verify tokens are defined in theme.css
grep -c "homepage-bg" apps/web/styles/theme.css
grep -c "homepage-text" apps/web/styles/theme.css
grep -c "homepage-accent" apps/web/styles/theme.css
grep -c "homepage-gradient" apps/web/styles/theme.css

# Typecheck
pnpm typecheck

# Visual validation
pnpm dev
# Then inspect CSS variables in browser DevTools
```

## Related Files
- Initiative: `../initiative.md`
- Design Reference: `.ai/reports/brainstorming/2026-02-04-homepage-redesign-design-system.md`
- Existing CSS: `apps/web/styles/theme.css`, `apps/web/styles/shadcn-ui.css`
