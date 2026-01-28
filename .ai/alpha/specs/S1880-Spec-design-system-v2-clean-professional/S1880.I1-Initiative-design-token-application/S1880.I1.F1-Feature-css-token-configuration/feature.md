# Feature: CSS Token Configuration

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1880.I1 |
| **Feature ID** | S1880.I1.F1 |
| **Status** | Draft |
| **Estimated Days** | 0.5 |
| **Priority** | 1 |

## Description
Update CSS custom properties in `apps/web/styles/shadcn-ui.css` and `apps/web/styles/theme.css` to apply the "Clean Professional" design system variation. This includes brand cyan primary color, cool purple accent, balanced shadow scale, and 8px border radius.

## User Story
**As a** developer
**I want to** update the design tokens to apply the Clean Professional visual identity
**So that** the application displays the brand cyan primary color with cool purple accents and professional styling

## Acceptance Criteria

### Must Have
- [ ] Update `--primary` and `--primary-foreground` to brand cyan (`195 78% 51%` / white)
- [ ] Update `--accent` and `--accent-foreground` to cool purple (`258 90% 66%` / white)
- [ ] Add balanced shadow scale tokens (`--shadow-sm`, `--shadow-md`, `--shadow-lg`) to theme.css
- [ ] Verify `--radius` is `0.5rem` (8px standard)
- [ ] Update dark mode primary/accent colors for proper contrast
- [ ] Update sidebar theme colors to match new primary/accent scheme
- [ ] Verify all color tokens have proper light/dark variants

### Nice to Have
- [ ] Document token values in code comments for future reference
- [ ] Add color palette visual reference to debug-colors page

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | shadcn-ui.css tokens | Modify in place |
| **Logic** | N/A | N/A |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Direct token update following existing pattern
**Rationale**: The CSS token structure is well-established in the codebase. Direct modification of `shadcn-ui.css` maintains consistency with existing pattern and minimizes risk.

### Key Architectural Choices
1. Modify `:root` block in shadcn-ui.css for light mode tokens
2. Modify `.dark` block in shadcn-ui.css for dark mode tokens
3. Add shadow scale to `@theme inline` in theme.css (not present currently)
4. Keep existing `oklch` format for secondary/muted colors (works well)
5. Use HSL format for primary/accent as specified in S1880 spec

### Trade-offs Accepted
- Shadow scale added to theme.css (separate from other tokens) - accepted as it follows current pattern
- Keeping `oklch` for some colors while using HSL for others - accepted for brand color requirements

## Required Credentials
> Environment variables required for this feature to function.

None required - this is a CSS-only change.

## Dependencies

### Blocks
- F3: Visual Verification (tokens must exist before verification screenshots are meaningful)

### Blocked By
- None

### Parallel With
- F2: Font Verification (can run in parallel after CSS tokens are updated)

## Files to Create/Modify

### New Files
- None

### Modified Files
- `apps/web/styles/shadcn-ui.css` - Update primary/accent colors in :root and .dark blocks
- `apps/web/styles/theme.css` - Add shadow scale tokens to @theme inline

## Task Hints
> Guidance for next decomposition phase

### Candidate Tasks
1. **Update light mode primary tokens**: Change `--primary` from neutral-950 to `195 78% 51%` and add `--primary-foreground: 0 0% 100%`
2. **Update light mode accent tokens**: Change `--accent` from oklch format to `258 90% 66%` and add `--accent-foreground: 0 0% 100%`
3. **Update dark mode primary tokens**: In `.dark` block, update primary/accent with adjusted values for dark contrast
4. **Add shadow scale**: Add `--shadow-sm`, `--shadow-md`, `--shadow-lg` to theme.css with balanced values
5. **Update sidebar theme**: Modify sidebar-primary, sidebar-accent colors to match new scheme
6. **Verify token propagation**: Check debug-colors page renders new colors

### Suggested Order
1. Light mode tokens (primary, accent)
2. Dark mode tokens (primary, accent)
3. Shadow scale (theme.css)
4. Sidebar theme updates
5. Visual verification

## Validation Commands
```bash
# Verify CSS tokens are applied correctly
cat apps/web/styles/shadcn-ui.css | grep -E "(--primary|--accent|--radius)"
cat apps/web/styles/theme.css | grep -E "(--shadow)"

# Run typecheck to ensure no regressions
pnpm typecheck

# Run linter
pnpm lint

# Verify colors render on debug page
# Visit /debug-colors to see new colors applied
```

## Related Files
- Initiative: `../initiative.md`
- Spec: `../spec.md`
- Target CSS: `apps/web/styles/shadcn-ui.css`
- Target Theme: `apps/web/styles/theme.css`
