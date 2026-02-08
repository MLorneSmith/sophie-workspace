# Feature: Spacing & Layout Tokens

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1936.I1 |
| **Feature ID** | S1936.I1.F3 |
| **Status** | Draft |
| **Estimated Days** | 1 |
| **Priority** | 3 |

## Description
Define CSS custom properties for consistent spacing, section gaps, and container widths specific to the homepage redesign. These tokens ensure visual consistency across all 12 homepage sections and support the responsive breakpoint strategy.

## User Story
**As a** developer implementing homepage sections
**I want to** use standardized spacing and layout tokens
**So that** all sections have consistent vertical rhythm and proper container constraints

## Acceptance Criteria

### Must Have
- [ ] Base spacing scale tokens (`--homepage-space-1` through `--homepage-space-32`)
- [ ] Section gap tokens for responsive section spacing (`--homepage-section-gap-sm`, `-md`, `-lg`)
- [ ] Container width tokens (`--homepage-width-narrow`, `-content`, `-wide`, `-max`)
- [ ] Documentation comment explaining the 4px base unit system

### Nice to Have
- [ ] Utility classes for common section spacing patterns

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A (CSS only) | N/A |
| **Logic** | N/A | N/A |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Minimal
**Rationale**: The existing Tailwind spacing scale (0.25rem increments) is already comprehensive. These homepage-specific tokens provide semantic naming for section-level spacing and container widths that match the design spec, complementing rather than replacing the existing system.

### Key Architectural Choices
1. Use rem units for accessibility (respects user font-size preferences)
2. Follow 4px (0.25rem) base unit for consistency with Tailwind
3. Container widths match existing `max-w-5xl`, `max-w-6xl`, `max-w-7xl` but with semantic names

### Trade-offs Accepted
- Some redundancy with Tailwind's built-in spacing, but semantic names improve code readability and design spec alignment

## Required Credentials
None required - this is a CSS-only feature.

## Dependencies

### Blocks
- All downstream initiatives (I2-I6) will use these tokens for section layout

### Blocked By
- F1: Color Token System (conceptually, though spacing is independent)

### Parallel With
- F2: Typography Scale (independent, can run in parallel after F1)
- F4: Animation Utilities (independent)

## Files to Create/Modify

### New Files
- None

### Modified Files
- `apps/web/styles/theme.css` - Add spacing and layout tokens in `@theme inline` block

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Add base spacing scale**: Define space-1 through space-32 tokens (4px base unit)
2. **Add section gap tokens**: Define responsive section spacing (sm/md/lg)
3. **Add container width tokens**: Define narrow, content, wide, max widths
4. **Add documentation comments**: Document the spacing system in CSS comments

### Suggested Order
1. Base spacing scale → 2. Section gaps → 3. Container widths → 4. Documentation

## Validation Commands
```bash
# Verify tokens are defined
grep -c "homepage-space" apps/web/styles/theme.css
grep -c "homepage-section-gap" apps/web/styles/theme.css
grep -c "homepage-width" apps/web/styles/theme.css

# Typecheck
pnpm typecheck

# Visual validation
pnpm dev
```

## Related Files
- Initiative: `../initiative.md`
- Design Reference: `.ai/reports/brainstorming/2026-02-04-homepage-redesign-design-system.md` (Section C: Spacing System)
- Existing patterns: Current homepage uses `max-w-5xl`, `max-w-6xl`, `max-w-7xl`
