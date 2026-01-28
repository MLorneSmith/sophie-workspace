# Initiative: Design Token Application

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1880 |
| **Initiative ID** | S1880.I1 |
| **Status** | Draft |
| **Estimated Weeks** | 0.3-0.5 (1-2 days) |
| **Priority** | 1 |

---

## Description
Apply "Clean Professional" design system variation by updating CSS custom properties in `shadcn-ui.css` with brand cyan primary color, cool purple accent, balanced shadows, and standard border radius. Verify Inter font configuration and capture visual validation assets.

## Business Value
Delivers a complete design system variation ready for A/B testing. Establishes a trustworthy, professional visual identity that balances familiarity with brand distinction through the cyan + purple color combination.

---

## Scope

### In Scope
- [ ] Update CSS custom properties in `apps/web/styles/shadcn-ui.css` with all design tokens
- [ ] Configure brand cyan primary color (`195 78% 51%`)
- [ ] Configure cool purple accent color (`258 90% 66%`)
- [ ] Apply balanced shadow scale (sm, md, lg)
- [ ] Apply 8px base border radius
- [ ] Verify/optimize Inter font loading in `apps/web/lib/fonts.ts`
- [ ] Verify WCAG AA contrast ratios for new colors
- [ ] Test visual appearance on home page (`/`)
- [ ] Test visual appearance on dashboard (`/home/[account]`)
- [ ] Capture screenshots for evaluation comparison

### Out of Scope
- [ ] Component structure changes
- [ ] Layout modifications
- [ ] New features or functionality
- [ ] Database changes
- [ ] Custom font selection (keeping Inter)

---

## Dependencies

### Blocks
- None

### Blocked By
- None

### Parallel With
- None (single initiative - complete work stream)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low | CSS variable updates only; no logic changes |
| External dependencies | Low | No APIs or external services |
| Unknowns | Very Low | Color values specified; pattern well-established |
| Reuse potential | High | Existing `shadcn-ui.css` pattern and file structure |

---

## Feature Hints
> Guidance for next decomposition phase

### Candidate Features
1. **CSS Token Configuration**: Update all color, shadow, radius, and spacing tokens in `shadcn-ui.css`
2. **Font Verification**: Verify Inter font configuration is optimized (minimal changes expected)
3. **Visual Verification**: Test on target pages and capture evaluation screenshots

### Suggested Order
1. CSS Token Configuration (primary work)
2. Font Verification (quick validation)
3. Visual Verification (capture artifacts for A/B comparison)

---

## Validation Commands
```bash
# Verify CSS tokens are applied correctly
cat apps/web/styles/shadcn-ui.css | grep -E "(--primary|--accent|--radius|--shadow)"

# Verify font configuration
cat apps/web/lib/fonts.ts | grep -A 5 "const sans"

# Run typecheck to ensure no regressions
pnpm typecheck

# Run linter
pnpm lint

# Check contrast ratios (manual or automated)
# Open /apps/web/app/test-colors/page.tsx or /debug-colors/page.tsx
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./<feature-#>-<slug>/` (created in next phase)
- Target CSS: `apps/web/styles/shadcn-ui.css`
- Target Fonts: `apps/web/lib/fonts.ts`
- Verification Pages: `apps/web/app/page.tsx`, `apps/web/app/home/[account]/page.tsx`
