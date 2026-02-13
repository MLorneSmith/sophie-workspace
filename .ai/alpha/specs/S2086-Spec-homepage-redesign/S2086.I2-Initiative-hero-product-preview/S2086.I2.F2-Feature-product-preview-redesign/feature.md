# Feature: Product Preview Redesign

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2086.I2 |
| **Feature ID** | S2086.I2.F2 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 2 |

## Description
Replace the current ContainerScroll-based product preview with a redesigned section featuring a static product screenshot inside a browser-style glass card frame. The frame has a macOS-style title bar (three dots + title), gradient border animation using CSS `@property` or keyframes, and a glow effect beneath the frame. The screenshot uses Next.js Image with AVIF/WEBP and blur placeholder.

## User Story
**As a** potential customer visiting the SlideHeroes homepage
**I want to** see a polished, realistic preview of the product in a browser-like frame
**So that** I can visualize what the tool looks like and feel confident in its quality before scrolling further

## Acceptance Criteria

### Must Have
- [ ] Browser-style frame with macOS-inspired title bar (3 colored dots + "SlideHeroes Canvas" title text)
- [ ] Glass card styling on the frame using I1's glass card component or equivalent (backdrop-filter: blur, subtle border, background opacity)
- [ ] Static product screenshot inside the frame using Next.js `<Image>` with AVIF/WEBP auto-format and blur placeholder
- [ ] Gradient border animation on the outer frame edge (rotating gradient using CSS keyframes)
- [ ] Glow effect beneath the frame (blurred accent-colored element behind/below)
- [ ] Scroll-triggered fade-in entrance animation (using AnimateOnScroll from I1)
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Existing `video-hero-preview.avif` used as placeholder screenshot

### Nice to Have
- [ ] Subtle scale-up animation on scroll (frame grows slightly as it enters viewport)
- [ ] Responsive frame sizing (full-width on mobile, max-width constrained on desktop)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Browser frame, glass card styling, gradient border, glow effect | New |
| **Logic** | Gradient border animation (CSS keyframes), entrance animation | New / I1 reuse |
| **Data** | Product screenshot path, frame title text | Existing / Extend config |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic — Create a new `home-product-preview-section.tsx` client component that replaces the current ContainerScroll block in `page.tsx`. Includes a `home-browser-frame.tsx` sub-component for the browser-style frame with glass card styling, gradient border, and glow.

**Rationale**: The current product preview uses Aceternity's ContainerScroll with a 3D rotate effect. The redesign calls for a static browser frame with glass card and gradient border — a fundamentally different visual treatment. A new component is cleaner than modifying ContainerScroll. The browser frame is reusable for other product screenshots.

### Key Architectural Choices
1. **Browser frame as a composable component** (`home-browser-frame.tsx`) that accepts children — reusable for future product screenshots
2. **Gradient border via CSS `@keyframes borderRotate`** defined in theme.css (from I1) — pure CSS, zero JS overhead
3. **Glow effect via CSS pseudo-element** with blur + accent color — no additional components needed
4. **Remove ContainerScroll dependency** — the 3D scroll animation is replaced by simpler entrance animation via AnimateOnScroll

### Trade-offs Accepted
- Losing the 3D scroll-rotate effect of ContainerScroll in favor of a simpler but more polished browser frame treatment
- Static screenshot instead of animated/video preview — faster loading, simpler implementation, per spec decision

## Required Credentials
> None required — uses static assets and CSS styling only.

## Dependencies

### Blocks
- None

### Blocked By
- S2086.I1: Design System Foundation (provides glass card component, design tokens, AnimateOnScroll, animation keyframes)

### Parallel With
- F1: Hero Section Redesign

## Files to Create/Modify

### New Files
- `apps/web/app/(marketing)/_components/home-product-preview-section.tsx` — Product preview section with glow effect and entrance animation
- `apps/web/app/(marketing)/_components/home-browser-frame.tsx` — Browser-style frame with macOS title bar, glass card styling, gradient border animation

### Modified Files
- `apps/web/app/(marketing)/page.tsx` — Replace ContainerScroll block (lines 99-116) with `<ProductPreviewSection />`
- `apps/web/config/homepage-content.config.ts` — Add product preview config (screenshot src, frame title, alt text) if not already present

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create browser frame component**: macOS-style title bar (3 dots + title), glass card styling via backdrop-filter, children slot for screenshot
2. **Add gradient border animation**: CSS `@keyframes borderRotate` for rotating gradient on frame border, integrate with browser frame
3. **Create product preview section**: Compose browser frame + OptimizedImage + glow effect pseudo-element, wrap in AnimateOnScroll
4. **Update homepage content config**: Add product preview section data (screenshot path, alt text, frame title)
5. **Integrate into page.tsx**: Replace ContainerScroll block with new component, remove ContainerScroll import

### Suggested Order
1. Content config update (no deps)
2. Browser frame component (standalone)
3. Product preview section (depends on 1-2)
4. Integrate into page.tsx (depends on 3)

## Validation Commands
```bash
# Verify product preview components exist
ls apps/web/app/\(marketing\)/_components/home-product-preview-section.tsx
ls apps/web/app/\(marketing\)/_components/home-browser-frame.tsx

# Verify ContainerScroll removed from page imports
grep -c "ContainerScroll" apps/web/app/\(marketing\)/page.tsx  # Should be 0

# Type checking
pnpm typecheck

# Lint
pnpm lint
```

## Related Files
- Initiative: `../initiative.md`
- Current product preview: `apps/web/app/(marketing)/page.tsx` (lines 99-116)
- Current ContainerScroll: `apps/web/app/(marketing)/_components/home-container-scroll-client.tsx`
- Existing OptimizedImage: `apps/web/app/(marketing)/_components/home-optimized-image.tsx`
- Product screenshot: `public/images/video-hero-preview.avif`
- Content config: `apps/web/config/homepage-content.config.ts`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
