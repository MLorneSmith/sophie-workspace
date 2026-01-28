# Initiative: Design Token Application

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1881 |
| **Initiative ID** | S1881.I1 |
| **Status** | Draft |
| **Estimated Weeks** | 1 |
| **Priority** | 1 |

---

## Description
Apply the "Soft Approachable" design system variation across the application using brand cyan with coral accents, Manrope/Source Sans Pro typography, subtle shadows, and generous spacing.

## Business Value
Creates a warm, welcoming visual identity that makes SlideHeroes feel approachable to first-time users while maintaining professional standards. This supports marketing goals by providing a cohesive brand experience.

---

## Scope

### In Scope
- [ ] Update CSS custom properties in `apps/web/styles/shadcn-ui.css`
  - Brand cyan primary palette
  - Coral accent color
  - Subtle shadow scale (sm, md, lg)
  - 16px base border radius
  - Dark mode variants for all tokens
- [ ] Configure font loading in `apps/web/lib/fonts.ts`
  - Manrope for display/heading (500, 600, 700)
  - Source Sans Pro for body (400, 600, 700)
- [ ] Verify WCAG AA contrast ratios
- [ ] Visual testing on `/` (home page)
- [ ] Visual testing on `/ui-showcase` (components)
- [ ] Visual testing on `/home/[account]` (dashboard)

### Out of Scope
- [ ] Component structure changes
- [ ] Layout modifications
- [ ] New features or functionality
- [ ] Database changes
- [ ] Breakpoint or responsive layout changes

---

## Dependencies

### Blocks
- None

### Blocked By
- None

### Parallel With
- None

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low | CSS token updates only, no logic changes |
| External dependencies | Low | Google Fonts via next/font (reliable) |
| Unknowns | Low | Well-documented pattern in codebase |
| Reuse potential | High | Existing files modified in-place |

---

## Feature Hints

> Guidance for next decomposition phase

### Candidate Features
1. **CSS Token Configuration**: Update shadcn-ui.css with all color and style tokens (light/dark modes)
2. **Font Configuration**: Configure Manrope and Source Sans Pro via next/font/google
3. **Verification & Screenshots**: Capture evaluation assets and run accessibility checks

### Suggested Order
1. CSS Token Configuration (foundation)
2. Font Configuration (applies new fonts)
3. Verification & Screenshots (validates implementation)

---

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Font verification (check fonts are loading)
curl -s http://localhost:3000/ui-showcase | grep -i "manrope\|source sans"

# Contrast check (manual verification)
# Visit /ui-showcase and verify WCAG AA compliance
```

---

## Related Files
- Spec: `../spec.md`
- CSS target: `apps/web/styles/shadcn-ui.css`
- Font target: `apps/web/lib/fonts.ts`
- Layout target: `apps/web/app/layout.tsx` (no changes, applies fonts automatically)
