# Initiative: Design Token Application

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1879 |
| **Initiative ID** | S1879.I1 |
| **Status** | Draft |
| **Estimated Weeks** | 1-2 |
| **Priority** | 1 |

---

## Description
Apply the "Modern Vibrant" design system variation tokens across the SlideHeroes application. This includes configuring brand cyan with warm orange accent colors, Outfit/Nunito Sans typography, elevated shadows, 12px border radius, and spacious layout tokens.

---

## Business Value
Establishes a distinctive visual identity that makes SlideHeroes memorable and professional. The bold color combination and contemporary typography creates an energetic, modern feel that balances approachability with professionalism.

---

## Scope

### In Scope
- [ ] Update CSS custom properties in `apps/web/styles/shadcn-ui.css` with brand cyan primary and warm orange accent
- [ ] Update dark mode color variants for all new colors
- [ ] Configure font loading in `apps/web/lib/fonts.ts` for Outfit (headings) and Nunito Sans (body)
- [ ] Apply elevated shadow scale to CSS variables
- [ ] Update base border radius to 12px (0.75rem)
- [ ] Verify WCAG AA contrast ratios for all color combinations
- [ ] Test visual rendering on key pages (home, dashboard, ui-showcase)
- [ ] Capture screenshots for A/B evaluation

### Out of Scope
- [ ] Component structure changes
- [ ] Layout modifications
- [ ] New features or functionality
- [ ] Database changes

---

## Dependencies

### Blocks
- None

### Blocked By
- None

### Parallel With
- None (single initiative)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low | CSS variable updates only - well-defined pattern |
| External dependencies | Low | Google Fonts for Outfit/Nunito Sans - standard Next.js pattern |
| Unknowns | Low | Design tokens are fully specified in spec |
| Reuse potential | High | Existing CSS variable structure and font loading patterns |

---

## Feature Hints
> Guidance for next decomposition phase

### Candidate Features
1. **CSS Token Configuration**: Update shadcn-ui.css with all color and style tokens (primary, accent, shadows, radius)
2. **Font Configuration**: Configure font loading in fonts.ts for Outfit and Nunito Sans
3. **Verification & Screenshots**: Capture evaluation assets and verify accessibility compliance

### Suggested Order
1. CSS Token Configuration (foundation - colors, shadows, radius)
2. Font Configuration (typography application)
3. Verification & Screenshots (validation and documentation)

---

## Validation Commands
```bash
# Type check to ensure no TypeScript errors
pnpm typecheck

# Lint to ensure code quality
pnpm lint:fix

# Build to verify production readiness
pnpm build

# Start dev server for visual verification
pnpm dev

# Visit verification pages
# http://localhost:3001/ui-showcase
# http://localhost:3001/test-colors
```

---

## Related Files
- Spec: `../spec.md`
- CSS Variables: `apps/web/styles/shadcn-ui.css`
- Font Config: `apps/web/lib/fonts.ts`
- Verification Pages: `apps/web/app/ui-showcase/page.tsx`, `apps/web/app/test-colors/page.tsx`
