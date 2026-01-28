# Feature: CSS Token Configuration

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1882.I1 |
| **Feature ID** | S1882.I1.F1 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 1 |

## Description
Update shadcn-ui.css with "Bold Geometric" design tokens for both light and dark modes. Includes primary brand cyan color, warm amber accent, elevated shadow scale, 4px border radius (sharp), and compact spacing density.

## User Story
**As a** developer
**I want to** update CSS design tokens to the Bold Geometric specification
**So that** the application has a consistent, modern, authoritative visual identity across all components

## Acceptance Criteria

### Must Have
- [ ] Update `--primary` to `hsl(195 78% 51%)` in `:root`
- [ ] Update `--primary` to `hsl(195 78% 55%)` in `.dark`
- [ ] Update `--primary-foreground` to white in light mode, dark in dark mode
- [ ] Update `--accent` to `hsl(38 92% 43%)` in `:root`
- [ ] Update `--accent` to `hsl(38 92% 50%)` in `.dark`
- [ ] Update `--accent-foreground` to white text in both modes
- [ ] Update `--ring` to match primary color
- [ ] Change `--radius` from `0.5rem` to `0.25rem` (4px)
- [ ] Add elevated shadow scale tokens (`--shadow-sm`, `--shadow-md`, `--shadow-lg`)
- [ ] Add `--spacing-density: 0.85` for compact spacing
- [ ] Verify all tokens exist in both `:root` and `.dark` selectors
- [ ] `pnpm typecheck` passes

### Nice to Have
- [ ] Update sidebar color tokens to match brand cyan theme
- [ ] Add chart color palette aligned with brand colors

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A | N/A (CSS-only change) |
| **Logic** | N/A | N/A |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |
| **CSS** | shadcn-ui.css | Modify |

## Architecture Decision

**Approach**: Direct CSS variable update following existing HSL format

**Rationale**:
- All values are explicitly specified in the spec
- Existing codebase uses HSL format for color tokens
- CSS variables are consumed automatically by Tailwind via theme.css
- No TypeScript or logic changes required

### Key Architectural Choices
1. **Maintain CSS layer structure**: Keep `@layer base` wrapper
2. **Use HSL format directly**: `hsl(195 78% 51%)` - not using `hsl()` function
3. **Update both selectors**: `:root` for light mode, `.dark` for dark mode
4. **Preserve existing neutral system**: Keep background, card, muted, secondary tokens as-is
5. **Follow spec appendix**: Use exact HSL values from spec.md section 11.D

### Trade-offs Accepted
- Shadow scale tokens may not be immediately used by existing components
- OKLCH format colors (secondary, muted) kept as-is to minimize disruption
- Sidebar colors may use blue tokens (review after verification)

## Required Credentials

| Variable | Description | Source |
|----------|-------------|--------|
| None required | No external services needed for CSS token updates | N/A |

## Dependencies

### Blocks
- S1882.I1.F3: Verification & Screenshots

### Blocked By
- None

### Parallel With
- S1882.I1.F2: Font Configuration

## Files to Create/Modify

### Modified Files
- `apps/web/styles/shadcn-ui.css` - Update design tokens in `:root` and `.dark` selectors

### New Files
- None

## Task Hints
> Guidance for next decomposition phase

### Candidate Tasks
1. **Update primary color tokens**: Replace `--primary`, `--primary-foreground`, and `--ring` with brand cyan values
2. **Update accent color tokens**: Replace `--accent` and `--accent-foreground` with warm amber values
3. **Update radius token**: Change `--radius` from `0.5rem` to `0.25rem`
4. **Add shadow scale**: Define `--shadow-sm`, `--shadow-md`, `--shadow-lg` with elevated values
5. **Add spacing density**: Define `--spacing-density: 0.85` for compact spacing
6. **Verify dark mode**: Ensure all new tokens have corresponding `.dark` selector values

### Suggested Order
1. Update color tokens (primary, accent, ring)
2. Update radius and shadow tokens
3. Add spacing density token
4. Verify both :root and .dark selectors
5. Run typecheck and lint

## Validation Commands
```bash
# Verify primary color updated
grep -E "primary.*195.*78" apps/web/styles/shadcn-ui.css

# Verify accent color updated
grep -E "accent.*38.*92" apps/web/styles/shadcn-ui.css

# Verify radius updated
grep -E "radius.*0.25rem" apps/web/styles/shadcn-ui.css

# Verify shadow tokens added
grep -E "shadow-(sm|md|lg)" apps/web/styles/shadcn-ui.css

# Typecheck
pnpm typecheck

# Lint
pnpm lint:fix
```

## Related Files
- Initiative: `../initiative.md`
- Spec: `../../spec.md`
- Theme Integration: `apps/web/styles/theme.css`
- Font Config: `apps/web/lib/fonts.ts`
