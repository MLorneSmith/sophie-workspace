# Feature: CSS Token Configuration

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1881.I1 |
| **Feature ID** | S1881.I1.F1 |
| **Status** | Draft |
| **Estimated Days** | 1 |
| **Priority** | 1 |

## Description
Update CSS custom properties in `shadcn-ui.css` with the "Soft Approachable" design system tokens: brand cyan primary, coral accent, subtle shadow scale, 16px border radius, and dark mode variants.

## User Story
**As a** developer implementing the Soft Approachable design system
**I want to** update CSS tokens with warm, welcoming colors and soft visual elements
**So that** the SlideHeroes application reflects a cohesive, approachable brand identity across all components

## Acceptance Criteria

### Must Have
- [ ] Update `--primary` color to brand cyan (`195 78% 51%`) in light mode
- [ ] Update `--primary-foreground` color (`--color-white` light, `--color-neutral-900` dark)
- [ ] Update `--accent` color to coral (`25 95% 53%`) in light mode
- [ ] Update `--accent-foreground` color (`--color-neutral-950` light, `--color-neutral-900` dark)
- [ ] Update `--radius` to `1rem` (16px) for soft rounded corners
- [ ] Define subtle shadow scale (`--shadow-sm`, `--shadow-md`, `--shadow-lg`)
- [ ] Update all color tokens for dark mode (`.dark` selector)
- [ ] Verify CSS variables are properly formatted in HSL format
- [ ] `pnpm typecheck` passes after changes

### Nice to Have
- [ ] Add color scale documentation in CSS comments
- [ ] Include fallback values for older browsers

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | CSS custom properties (tokens) | Modify |
| **Logic** | N/A | N/A |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Direct CSS variable update in `shadcn-ui.css` following S1879 pattern

**Rationale**: This is a design token update, not a logic change. The existing `shadcn-ui.css` file structure with `:root` and `.dark` selectors is the correct pattern for this work. No new files or utilities are needed—tokens are consumed by existing Tailwind configuration via `theme.css`.

### Key Architectural Choices
1. Use HSL format for colors (`195 78% 51%`) consistent with S1879 pattern
2. Define both light and dark mode values in separate selectors
3. Update only color/style tokens—keep neutral palette and semantic mappings unchanged
4. Shadow scale defined as CSS variables for consistency with radius token

### Trade-offs Accepted
- No shadow scale currently exists as tokens—adding them increases consistency but adds maintenance overhead
- HSL format is less standard than HSL in CSS but matches existing pattern

## Required Credentials
> Environment variables required for this feature to function. Extracted from research files.

None required (CSS tokens use no external services)

## Dependencies

### Blocks
- S1881.I1.F3 (Feature: Verification & Screenshots)

### Blocked By
- None

### Parallel With
- S1881.I1.F2 (Feature: Font Configuration)

## Files to Create/Modify

### New Files
- None

### Modified Files
- `apps/web/styles/shadcn-ui.css` - Update color tokens, radius, shadow scale
- `apps/web/styles/theme.css` - May need to map new shadow tokens (if added)

## Task Hints
> Guidance for next decomposition phase

### Candidate Tasks
1. **Update Primary Color Tokens**: Set brand cyan values for light/dark modes
2. **Update Accent Color Tokens**: Set coral accent values for light/dark modes
3. **Update Border Radius**: Change `--radius` to `1rem` (16px)
4. **Define Shadow Scale**: Add `--shadow-sm`, `--shadow-md`, `--shadow-lg` with subtle values
5. **Update Dark Mode Values**: Mirror all token changes in `.dark` selector
6. **Validate with Type Check**: Run `pnpm typecheck` to ensure no errors

### Suggested Order
1. Update primary colors
2. Update accent colors
3. Update radius token
4. Define shadow scale
5. Update dark mode variants
6. Run typecheck validation

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Build verification
pnpm --filter web build

# Visual verification (after F2 completes)
pnpm dev
# Visit http://localhost:3000/ui-showcase to verify colors
```

## Related Files
- Initiative: `../initiative.md`
- Spec: `../../spec.md`
- Reference Implementation: `.ai/alpha/specs/S1879-Spec-design-system-v1-modern-vibrant/S1879.I1-Initiative-design-token-application/S1879.I1.F1-Feature-css-token-configuration/feature.md`
