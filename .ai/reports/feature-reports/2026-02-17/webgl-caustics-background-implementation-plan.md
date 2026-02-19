# WebGL Caustics Background — Implementation Plan

## Objective

Replace the current CSS gradient hero background with a real-time WebGL shader that replicates the Payload CMS glass/caustics animation effect. No external libraries (no Three.js). Raw WebGL2 + GLSL only.

## Reference

- **Payload's effect**: Looping MP4 video of diagonal glass caustics (deep navy + amber accents on black)
- **Reference video**: `.ai/research/payload-glass-animation-reference.mp4` (1920x1080, 30s loop, H.264)
- **Payload source**: `src/components/BackgroundGradient/index.tsx` in `payloadcms/website` repo

## Architecture

### Approach: Raw WebGL2 Canvas + GLSL Fragment Shader

No Three.js needed. A single `<canvas>` element with a full-screen quad and a fragment shader that generates the caustics effect procedurally. This keeps the bundle impact near zero (~3-5 KB of shader code + WebGL boilerplate).

### Component Tree

```
layout.tsx (marketing)
└── GridLines (existing, fixed)
└── page.tsx
    └── HeroSection
        └── CausticsBackground (NEW — replaces HeroGradientEffect)
            ├── <canvas> with WebGL2 shader
            ├── Fallback: CSS gradient (if WebGL unavailable)
            └── Respects prefers-reduced-motion
```

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `apps/web/app/(marketing)/_components/caustics-background.tsx` | Main React component — manages canvas, WebGL context, animation loop, and all safeguards |
| `apps/web/app/(marketing)/_lib/caustics-shader.ts` | GLSL vertex + fragment shader source strings and WebGL setup utility |

### Modified Files

| File | Change |
|------|--------|
| `apps/web/app/(marketing)/_components/home-hero-section.tsx` | Import `CausticsBackground` instead of `HeroGradientEffect` |
| `apps/web/app/(marketing)/_components/hero-gradient-effect.tsx` | Revert to simple CSS gradient fallback (used when WebGL unavailable) |
| `apps/web/styles/globals.css` | Remove the `diagonalDrift`/`diagonalDriftReverse`/`amberPulse` keyframes (no longer needed) |

### Files to Delete (cleanup)

| File | Reason |
|------|--------|
| `apps/web/public/images/hero-beam-mask.svg` | Old beam mask approach, no longer used |
| `apps/web/app/(marketing)/_components/noise-overlay.tsx` | No longer imported anywhere |

## Implementation Steps

### Step 1: Write the GLSL Caustics Shader (~45 min)

**File**: `apps/web/app/(marketing)/_lib/caustics-shader.ts`

The fragment shader will produce the Payload-style effect with these visual elements:

1. **Caustics pattern**: Use layered 2D noise with domain warping to create organic, fluid light patterns. Technique: `fbm(position + fbm(position + time))` where `fbm` = fractional Brownian motion built from simplex/value noise.

2. **Diagonal orientation**: Rotate UV coordinates by ~35° (125° from horizontal) to create the diagonal streak direction matching Payload's video.

3. **Color palette**:
   - Base: black `(0.0, 0.0, 0.0)`
   - Primary streaks: deep navy `(0.06, 0.10, 0.25)` to `(0.10, 0.16, 0.35)`
   - Accent highlights: warm amber `(0.70, 0.50, 0.15)` at ~10-15% intensity
   - The shader mixes these based on noise values

4. **Animation**: Slow time-based evolution (`iTime * 0.03` — roughly matching Payload's 25-30s visual cycle). No abrupt changes.

5. **Edge vignette**: Built into the shader as a radial darkening from center to edges.

Shader uniforms:
- `u_time` (float) — elapsed time in seconds
- `u_resolution` (vec2) — canvas dimensions in pixels

**Vertex shader**: Minimal pass-through for a full-screen quad (4 vertices, triangle strip).

**Fragment shader structure** (~80-100 lines):
```glsl
// Noise functions (simplex or value noise + fbm)
// Domain-warped caustics function
// Diagonal rotation matrix
// Color mixing (navy streaks + amber accents)
// Vignette
// Output
```

### Step 2: Build the WebGL Boilerplate Utility (~30 min)

**File**: `apps/web/app/(marketing)/_lib/caustics-shader.ts` (same file)

Export a function `initCausticsGL(canvas: HTMLCanvasElement)` that:

1. Gets WebGL2 context (fall back to WebGL1 if needed)
2. Compiles vertex + fragment shaders
3. Creates the full-screen quad geometry (2 triangles)
4. Sets up uniform locations
5. Returns `{ render(time: number): void, destroy(): void }`

### Step 3: Create the React Component (~45 min)

**File**: `apps/web/app/(marketing)/_components/caustics-background.tsx`

```typescript
"use client";
// Canvas-based WebGL caustics with full production safeguards
```

**Component responsibilities**:

1. **Canvas ref** — `useRef<HTMLCanvasElement>` for the WebGL canvas
2. **WebGL init** — Call `initCausticsGL()` in `useEffect`, store the render/destroy handles
3. **Animation loop** — `requestAnimationFrame` loop calling `render(time)`
4. **Resolution management**:
   - Desktop: match canvas to container size × `Math.min(devicePixelRatio, 2)`
   - Mobile (width ≤ 768): cap at 1x DPR to reduce GPU load
   - Listen for `resize` events with debounce
5. **Visibility pause** — `document.addEventListener('visibilitychange')` to stop/resume `rAF` when tab is hidden
6. **Context loss handling**:
   - Listen for `webglcontextlost` → prevent default, set flag
   - Listen for `webglcontextrestored` → re-init shaders and resume
7. **Reduced motion** — Check `window.matchMedia('(prefers-reduced-motion: reduce)')`:
   - If true: render a single frame (static) and stop the animation loop
   - Listen for changes to re-enable if user toggles
8. **WebGL detection** — If `canvas.getContext('webgl2')` fails, render nothing (parent shows CSS fallback)
9. **Cleanup** — `useEffect` cleanup destroys GL context and cancels `rAF`

**Props**:
```typescript
interface CausticsBackgroundProps {
  className?: string;
  fallback?: React.ReactNode; // Shown when WebGL unavailable
}
```

**Render**:
```tsx
<div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden="true">
  {webglSupported ? (
    <canvas ref={canvasRef} className="h-full w-full" />
  ) : (
    fallback ?? <CSSFallbackGradient />
  )}
  {/* CRT scanline overlay */}
  <div className="absolute inset-0 z-[2] opacity-[0.04]" style={{...}} />
  {/* Edge vignette */}
  <div className="absolute inset-0 z-[3]" style={{...}} />
</div>
```

### Step 4: Integrate into Hero Section (~10 min)

**File**: `apps/web/app/(marketing)/_components/home-hero-section.tsx`

Replace:
```tsx
import { HeroGradientEffect } from "./hero-gradient-effect";
```
With:
```tsx
import { CausticsBackground } from "./caustics-background";
```

And in the JSX:
```tsx
<CausticsBackground fallback={<HeroGradientEffect />} />
```

The CSS gradient in `hero-gradient-effect.tsx` becomes the fallback for the ~1-2% of browsers without WebGL.

### Step 5: Revert hero-gradient-effect.tsx to Simple Fallback (~10 min)

Simplify `hero-gradient-effect.tsx` to a clean static CSS gradient fallback (no animations needed — it only shows when WebGL fails). Simple dark diagonal gradient matching the approximate color palette.

### Step 6: Clean Up CSS Keyframes (~5 min)

Remove from `globals.css`:
- `@keyframes diagonalDrift`
- `@keyframes diagonalDriftReverse`
- `@keyframes amberPulse`

These were added for the CSS gradient approach and are no longer needed.

### Step 7: Visual Tuning (~30 min)

Use agent-browser to compare our shader output against Payload's reference:

1. Screenshot our hero in dark mode
2. Compare side-by-side with Payload screenshot
3. Adjust shader parameters:
   - Noise frequency/octaves for streak width
   - Rotation angle for diagonal direction
   - Color values for navy/amber balance
   - Animation speed
   - Vignette strength
4. Test on mobile viewport (375×667)
5. Iterate until the visual matches

### Step 8: Cleanup Dead Files (~5 min)

- Delete `apps/web/public/images/hero-beam-mask.svg`
- Delete `apps/web/app/(marketing)/_components/noise-overlay.tsx`

### Step 9: Verification (~15 min)

1. `pnpm --filter web typecheck` — must pass
2. `pnpm lint:fix` — fix any issues
3. `pnpm format:fix` — format
4. Visual check in dark mode (desktop + mobile viewport)
5. Test WebGL fallback by temporarily forcing `getContext` to fail
6. Test `prefers-reduced-motion` behavior
7. Check no console errors

## Production Safeguards Checklist

- [ ] WebGL2 detection with graceful CSS fallback
- [ ] `prefers-reduced-motion`: single static frame, no animation loop
- [ ] `visibilitychange`: pause rAF when tab hidden
- [ ] `webglcontextlost` / `webglcontextrestored` handlers
- [ ] Mobile DPR cap (1x on phones, 2x max on desktop)
- [ ] Resize debounce (250ms)
- [ ] Proper cleanup on unmount (destroy GL, cancel rAF)
- [ ] `aria-hidden="true"` on container
- [ ] `pointer-events: none` on container
- [ ] No impact on LCP (canvas is decorative, not blocking)

## Performance Budget

| Metric | Target |
|--------|--------|
| Shader code size | < 5 KB (gzipped) |
| GPU frame time | < 4ms at 60fps on desktop |
| Mobile frame time | < 8ms at 30fps (capped) |
| Bundle impact | < 5 KB total (shader + boilerplate + component) |
| LCP impact | Zero (decorative, non-blocking) |

## Estimated Time

| Step | Time |
|------|------|
| 1. GLSL shader | 45 min |
| 2. WebGL boilerplate | 30 min |
| 3. React component | 45 min |
| 4. Hero integration | 10 min |
| 5. CSS fallback | 10 min |
| 6. CSS cleanup | 5 min |
| 7. Visual tuning | 30 min |
| 8. File cleanup | 5 min |
| 9. Verification | 15 min |
| **Total** | **~3 hrs** |

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Shader doesn't match Payload's look | Iterative tuning with side-by-side screenshots. Reference video available for frame comparison. |
| Poor mobile performance | DPR cap, 30fps cap on mobile, complexity-reduced shader variant if needed |
| WebGL context loss on mobile | Full context recovery handlers + CSS fallback always available |
| Increased bundle size | Raw WebGL (no Three.js) keeps impact to ~5 KB |
| Light mode appearance | Gradient is only visible in dark mode (hero uses `dark:bg-black`). Light mode shows default background. |
