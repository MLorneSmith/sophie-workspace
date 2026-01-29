# Feature: Font Configuration

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1882.I1 |
| **Feature ID** | S1882.I1.F2 |
| **Status** | Draft |
| **Estimated Days** | 1 |
| **Priority** | 2 |

## Description
Configure Plus Jakarta Sans for display/headings and DM Sans for body text using next/font/google. Both fonts are preloaded with optimal weights for performance.

## User Story
**As a** developer
**I want to** configure Plus Jakarta Sans and DM Sans fonts
**So that** the application uses the specified typography for the Bold Geometric design system

## Acceptance Criteria

### Must Have
- [ ] Import `Plus_Jakarta_Sans` from `next/font/google`
- [ ] Import `DM_Sans` from `next/font/google`
- [ ] Configure `sans` constant with DM Sans (weights: 400, 500, 700)
- [ ] Configure `heading` constant with Plus Jakarta Sans (weights: 500, 600, 700)
- [ ] Set `variable: "--font-sans"` on body font
- [ ] Set `variable: "--font-heading"` on heading font
- [ ] Set `preload: true` for both fonts
- [ ] Set `subsets: ["latin"]` for both fonts
- [ ] Configure appropriate fallback fonts
- [ ] Export `sans` and `heading` constants
- [ ] `pnpm typecheck` passes

### Nice to Have
- [ ] Verify font preloading in browser DevTools Network tab
- [ ] Test font rendering across different browsers

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A | N/A (font config only) |
| **Logic** | fonts.ts | Modify |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |
| **CSS** | N/A | N/A (automatic via font variables) |

## Architecture Decision

**Approach**: Follow existing next/font/google pattern with new fonts

**Rationale**:
- Existing codebase uses this pattern with Inter font
- next/font/google handles preloading and optimization automatically
- Font variables are automatically applied via getFontsClassName() in layout.tsx
- No changes needed in components - they consume font variables via CSS classes

### Key Architectural Choices
1. **Use Google Font naming**: `Plus_Jakarta_Sans` (underscore, space replaced) and `DM_Sans`
2. **Separate font constants**: `sans` for body, `heading` for headings (currently aliased in code, will separate)
3. **Optimized weights**: Only load weights used in application
4. **Maintain existing exports**: Keep `export { sans, heading }` pattern
5. **No component changes**: Layout.tsx uses getFontsClassName() automatically

### Trade-offs Accepted
- Inter font will no longer be loaded (performance improvement)
- Existing font class names (`font-heading`) remain the same - no component updates needed

## Required Credentials

| Variable | Description | Source |
|----------|-------------|--------|
| None required | No external services needed for Google Fonts | N/A |

## Dependencies

### Blocks
- S1882.I1.F3: Verification & Screenshots

### Blocked By
- None

### Parallel With
- S1882.I1.F1: CSS Token Configuration

## Files to Create/Modify

### Modified Files
- `apps/web/lib/fonts.ts` - Replace Inter with Plus Jakarta Sans and DM Sans

### New Files
- None

## Task Hints
> Guidance for next decomposition phase

### Candidate Tasks
1. **Replace font imports**: Import `Plus_Jakarta_Sans` and `DM_Sans` instead of Inter
2. **Configure body font**: Create `sans` constant with DM Sans configuration
3. **Configure heading font**: Create `heading` constant with Plus Jakarta Sans configuration
4. **Update exports**: Export both `sans` and `heading` constants

### Suggested Order
1. Replace import statements
2. Configure `sans` constant (DM Sans)
3. Configure `heading` constant (Plus Jakarta Sans)
4. Export both constants
5. Run typecheck and lint

## Validation Commands
```bash
# Verify fonts imported
grep -E "(Plus_Jakarta_Sans|DM_Sans)" apps/web/lib/fonts.ts

# Verify font variables set
grep -E "variable.*--font-(sans|heading)" apps/web/lib/fonts.ts

# Typecheck
pnpm typecheck

# Lint
pnpm lint:fix
```

## Related Files
- Initiative: `../initiative.md`
- Spec: `../../spec.md`
- Layout: `apps/web/app/layout.tsx`
- CSS Tokens: `apps/web/styles/shadcn-ui.css`
