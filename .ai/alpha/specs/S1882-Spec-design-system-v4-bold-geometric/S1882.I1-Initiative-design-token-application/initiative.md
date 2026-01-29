# Initiative: Design Token Application

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1882 |
| **Initiative ID** | S1882.I1 |
| **Status** | Draft |
| **Estimated Weeks** | 1 |
| **Priority** | 1 |

---

## Description
Apply the "Bold Geometric" design system variation by updating CSS design tokens for brand cyan with warm amber accent, configuring Plus Jakarta Sans and DM Sans fonts, and implementing elevated shadows, sharp 4px radius, and compact spacing.

## Business Value
Establishes the "Bold Geometric" visual identity for the design system A/B experiment, enabling stakeholder evaluation of this modern, precise aesthetic against other variations. Complete token coverage ensures consistent application across all UI components.

---

## Scope

### In Scope
- [ ] Update CSS color tokens in shadcn-ui.css (primary: cyan, accent: amber)
- [ ] Update CSS shadow tokens to elevated scale
- [ ] Update CSS radius token to 4px (sharp)
- [ ] Update CSS spacing density to compact (0.85 multiplier)
- [ ] Configure Plus Jakarta Sans font for display/headings
- [ ] Configure DM Sans font for body text
- [ ] Verify WCAG AA contrast ratios for all color combinations
- [ ] Capture screenshots of home page and dashboard for evaluation
- [ ] Verify dark mode functionality

### Out of Scope
- [ ] Component structure changes
- [ ] Layout modifications
- [ ] New features or functionality
- [ ] Database changes
- [ ] Component-specific styling overrides (unless breaking)

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
| Technical complexity | Low | CSS token updates only, well-documented pattern |
| External dependencies | Low | Google Fonts (already configured pattern) |
| Unknowns | Low | All values specified in spec |
| Reuse potential | High | Extensive existing token system to extend |

---

## Feature Hints
> Guidance for next decomposition phase

### Candidate Features
1. **CSS Token Configuration**: Update shadcn-ui.css with color, shadow, radius, and spacing tokens for both light and dark modes
2. **Font Configuration**: Modify apps/web/lib/fonts.ts to load Plus Jakarta Sans and DM Sans via next/font/google
3. **Verification & Screenshots**: Capture visual validation assets on home page and team dashboard for comparison

### Suggested Order
1. CSS Token Configuration (foundation - affects all visual output)
2. Font Configuration (independent, can run parallel)
3. Verification & Screenshots (must run after tokens and fonts)

---

## Validation Commands
```bash
# Verify design tokens applied
grep -E "(--primary:|--accent:|--shadow-|--radius:)" apps/web/styles/shadcn-ui.css

# Verify fonts configured
grep -E "(Plus_Jakarta_Sans|DM_Sans)" apps/web/lib/fonts.ts

# Typecheck
pnpm typecheck

# Lint
pnpm lint
```

---

## Related Files
- Spec: `../spec.md`
- CSS Tokens: `apps/web/styles/shadcn-ui.css`
- Font Config: `apps/web/lib/fonts.ts`
- Theme Bridge: `apps/web/styles/theme.css`
- Verification Scripts: `.ai/alpha/scripts/lib/visual-validation.ts`
