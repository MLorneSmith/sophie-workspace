# Initiative: Design System Foundation

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1936 |
| **Initiative ID** | S1936.I1 |
| **Status** | Draft |
| **Estimated Weeks** | 1-2 |
| **Priority** | 1 |

---

## Description
Implement a comprehensive dark-mode-first design system with CSS custom properties for colors, typography, spacing, and animations. This foundation enables consistent styling across all 12 homepage sections and establishes the premium visual language inspired by Linear, Cargo, and OrbitAI.

## Business Value
Establishes a cohesive visual identity that communicates SlideHeroes' premium positioning. The design system reduces development time for subsequent initiatives by providing reusable tokens and ensures WCAG AA accessibility compliance across all components.

---

## Scope

### In Scope
- [ ] Dark-mode-first color palette (dark gray backgrounds, high-luminance accents)
- [ ] CSS custom properties in `apps/web/styles/shadcn-ui.css` for homepage-specific tokens
- [ ] Typography scale tokens for marketing pages
- [ ] Animation timing and easing variables
- [ ] Spacing scale tokens
- [ ] Glass card effect utilities (backdrop-blur, translucent backgrounds)
- [ ] Spotlight gradient utilities
- [ ] Dark mode as default with light mode toggle support

### Out of Scope
- [ ] Component implementation (handled in later initiatives)
- [ ] Content writing
- [ ] Database changes
- [ ] Animation component creation (CSS setup only)

---

## Dependencies

### Blocks
- S1936.I2: Hero & Product Preview
- S1936.I3: Trust Elements
- S1936.I4: Value Proposition
- S1936.I5: Conversion
- S1936.I6: Content & Polish

### Blocked By
- None

### Parallel With
- None (must complete first)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low | Extending existing CSS variables in established patterns |
| External dependencies | Low | No external services; uses existing next-themes |
| Unknowns | Low | Design spec fully documented in brainstorm file |
| Reuse potential | High | All subsequent initiatives use these tokens |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Color Token System**: Dark/light mode color variables with semantic naming
2. **Typography Scale**: Marketing-specific type scale tokens
3. **Spacing & Layout Tokens**: Consistent spacing for sections
4. **Animation Utilities**: Timing functions, durations, spring configs
5. **Glass Effect Utilities**: Backdrop blur, transparency patterns

### Suggested Order
1. Color tokens (foundation for everything)
2. Typography scale (text appearance)
3. Spacing tokens (layout consistency)
4. Animation utilities (motion patterns)
5. Glass effects (premium aesthetics)

---

## Validation Commands
```bash
# Verify CSS file contains new tokens
grep -c "homepage" apps/web/styles/shadcn-ui.css

# Check dark mode default is set
grep "defaultTheme" apps/web/config/feature-flags.config.ts

# Validate CSS syntax
pnpm typecheck

# Visual inspection
pnpm dev
```

---

## Related Files
- Spec: `../spec.md`
- Design System Reference: `.ai/reports/brainstorming/2026-02-04-homepage-redesign-design-system.md`
- Existing CSS: `apps/web/styles/shadcn-ui.css`
- Theme CSS: `apps/web/styles/theme.css`
- Features: `./<feature-#>-<slug>/` (created in next phase)
