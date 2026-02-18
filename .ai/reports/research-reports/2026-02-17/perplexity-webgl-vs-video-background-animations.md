# Perplexity Research: WebGL2 vs Video Background Animations - Browser Compatibility

**Date**: 2026-02-17
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro) x5 queries

## Query Summary
Comprehensive browser compatibility research comparing WebGL2 shader-based background animations vs HTML5 video-based background animations for a production marketing website. Covers support percentages, mobile shader capabilities, performance issues, fallback strategies, and autoplay reliability.

---

## 1. WebGL2 Global Browser Support

**Overall: ~98-99% of active browsers in 2026.**

| Platform | WebGL2 Support |
|----------|---------------|
| Android | 99% |
| iOS | 98.96% |
| Windows | 98.18% |
| macOS | 98.83% |
| Linux | 98.3% |
| ChromeOS | 99.95% |

### Browser Version Support
- **Chrome**: 56+ (full support)
- **Edge**: 79+ (full support)
- **Firefox**: 51+ (full support)
- **Safari Desktop**: 15+ (full support)
- **Safari iOS**: 15+ (full support, enabled by default)
- **Opera**: Full support (Chromium-aligned)

### Key Notes
- iOS 26 confirms WebGPU default enablement, signaling graphics maturity beyond WebGL2
- Legacy devices pre-iOS 15 may lack WebGL2 support
- Chrome has deprecated automatic fallback to software WebGL (SwiftShader) - context creation now fails rather than falling back

---

## 2. Mobile Fragment Shader Support

**Yes, modern mobile browsers fully support WebGL2 fragment shaders including complex effects.**

### Capabilities
- WebGL2 mandates 224 vec4 uniforms for fragment shaders (up from 16 in WebGL1)
- Modern mobile GPUs handle `highp` precision reliably in WebGL2
- Perlin noise, caustics, multiple render passes all supported

### Precision Limits & Gotchas
- `highp float` was optional in WebGL1 fragment shaders on older mobile hardware
- Mobile GPUs enforce `mediump`/`lowp` strictly (desktops silently promote to highp)
- Always query `gl.getShaderPrecisionFormat()` at runtime
- 99% of devices support 4096x4096 max texture size; only 50% support larger

### Float Texture Support
- Float textures (RGBA32F) support is inconsistent on mobile
- Check `EXT_color_buffer_float` or `EXT_color_buffer_half_float` extension availability
- Without these, framebuffer operations return `FRAMEBUFFER_INCOMPLETE_ATTACHMENT`

### Texture Units
- ~97% of devices support at least 4 texture units
- Draw buffers for multiple color attachments improved in WebGL2 vs WebGL1

---

## 3. Mobile WebGL Performance Issues

### Critical Issues

**Battery Drain & Thermal Throttling**
- Continuous GPU rendering causes sustained power draw and heat generation
- No automatic pause mechanism (unlike video which pauses when off-screen)
- Mobile devices will thermal throttle, reducing frame rates

**Frame Rate Drops**
- iOS devices particularly affected: WebGL-heavy apps cause "unusable lag and crashes" on pre-iPhone 16 models
- iPhone 16 still shows "chunky" rendering in non-optimized scenarios
- Full-screen canvases scaled by `devicePixelRatio` add significant GPU load on high-DPI mobile screens

**GPU Memory Limits**
- Large textures exceed mobile GPU capabilities
- Limiting textures to 8 improved performance on iOS devices
- Compressed texture formats recommended to reduce GPU memory bandwidth

**Context Loss**
- `CONTEXT_LOST_WEBGL` can occur from thermal throttling, app backgrounding, or GPU reset
- Must handle via `webglcontextlost` event, release resources, recreate context
- Mobile exacerbates this via power-saving pauses and memory pressure
- No automatic recovery - requires robust error handling code

### iOS vs Android
| Platform | Issues |
|----------|--------|
| **iOS** | Severe lag/crashes in WebGL viewers; large textures unperformant; prefers Canvas fallback; limit textures to 8 |
| **Android** | Fewer reports; broader stability; shader switches remain costly |

### WebGPU Note
- WebGPU actually underperforms WebGL by 2-4x FPS in heavy shader scenes on mobile currently

---

## 4. WebGL Fallback Behavior

### Standard Practices
- Chrome deprecated automatic software fallback (SwiftShader) - WebGL context creation now FAILS outright
- ~1-2% of users may experience WebGL failure in 2025 (older devices, disabled GPU acceleration, corporate policies)

### Production Fallback Strategies
- Static image with CSS gradient overlay (most common)
- CSS-only animation (simpler but less visually rich)
- Canvas 2D fallback (middle ground)
- Progressive enhancement: detect `getContext('webgl2')` first, then `getContext('webgl')`, then fallback

### Detection Pattern
```javascript
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
if (!gl) {
  // Show static fallback
}
```

---

## 5. HTML5 Video Autoplay Support

**`<video autoplay muted loop playsinline>` has strong cross-browser support (95%+) with important caveats.**

### Universal Rules (All Modern Browsers)
- Muted videos (via `muted` attribute or no audio track): ALWAYS allowed to autoplay
- Policies apply per-element; off-screen/hidden/background-tab videos pause automatically
- Detection via `video.play()` promise is the standard approach

### iOS Safari Specifics
- **`playsinline` is MANDATORY** for inline playback (otherwise forces fullscreen)
- **Low Power Mode BLOCKS autoplay entirely** - shows play button overlay instead, no workaround exists
- **Attribute order matters**: `muted` must precede `autoplay`
- **Using `<source>` can break autoplay** unlike direct `src` attribute
- **Black/blank screen bugs** after page navigation, especially iOS 15+
- **First frame not displayed**: Requires `poster` attribute or `#t=0.001` URL hack
- **iOS 17.1+ introduced play button overlays** that mimic Low Power Mode behavior

### Android Chrome
- Follows unified policy: muted autoplay permitted without restrictions on visible elements
- No unique mobile deviations; aligns with desktop Chrome 64+ behavior

### Edge Cases
- Fails in iframes without `allow="autoplay"` attribute
- Data saver mode: generally does not block muted autoplay
- Low Power Mode on iOS: BLOCKS autoplay with no workaround

---

## 6. Production Comparison: Video vs WebGL

| Aspect | Video Background | WebGL Shader Background |
|--------|-----------------|------------------------|
| **File Size** | Large (5-50+ MB for HD loops) | Minimal (KB-MB for shader code) |
| **Initial Load** | Slower (5-15s+ on mobile); blocks rendering until buffered | Faster after assets cache; progressive loading possible |
| **Battery Impact** | High drain from constant video decoding | Lower; GPU-accelerated, frame rates adapt |
| **Accessibility** | Poor; motion triggers vestibular issues; no native pause | Better; can detect `prefers-reduced-motion`; shaders pause dynamically |
| **SEO / Core Web Vitals** | Negative; large files hurt LCP/CLS | Positive; tiny payloads boost metrics |
| **Browser Support** | Universal (~95%+) | Excellent (~98%+ for WebGL2) |
| **Fallback** | Easy: `poster` image, `<picture>`, CSS gradient | Robust: Canvas 2D/CSS fallback, progressive enhancement |
| **iOS Low Power Mode** | BLOCKED (play button shown) | WORKS (no autoplay policy applies) |
| **Context Loss Risk** | None | Yes (must handle `webglcontextlost`) |
| **Off-screen Behavior** | Auto-pauses (browser managed) | Continues running (must implement own visibility check) |

### What Major Sites Actually Use
- **Stripe**: WebGL shaders/particles (Three.js) for interactive hero effects
- **Linear**: CSS/WebGL gradients and shaders for dynamic backgrounds
- **Vercel**: Custom GLSL shader-based animations for deploy pages

---

## Key Takeaways

1. **WebGL2 has 98-99% browser support** - higher than video autoplay reliability when iOS Low Power Mode is factored in
2. **Complex fragment shaders work on modern mobile** but require precision checks (`highp` support), texture limits, and float texture extension detection
3. **Mobile WebGL performance is the main risk** - iOS devices particularly prone to lag, crashes, context loss, and thermal throttling with full-screen shaders
4. **iOS Low Power Mode kills video autoplay** with no workaround - WebGL is unaffected by autoplay policies
5. **Video has better "just works" simplicity** but worse performance metrics (file size, LCP, battery)
6. **WebGL is what production sites actually use** (Stripe, Linear, Vercel) - with proper fallbacks to static images
7. **Best hybrid approach**: Use WebGL with `prefers-reduced-motion` detection, visibility API for off-screen pause, context loss handling, and a static image/CSS gradient fallback. Avoid video for background animations on performance-conscious production sites.

---

## Recommendation for SlideHeroes

**Prefer WebGL shader approach** with these safeguards:
- Detect WebGL2 availability; fall back to static gradient/image
- Respect `prefers-reduced-motion` media query
- Implement `visibilitychange` listener to pause when tab is hidden
- Handle `webglcontextlost` and `webglcontextrestored` events
- Limit shader complexity on mobile (detect via `navigator.maxTouchPoints` or screen size)
- Consider reducing resolution on mobile (skip `devicePixelRatio` scaling)
- Keep shader under 100 lines of GLSL for mobile compatibility
- Test on iOS Safari in Low Power Mode (shader still works; video would not)

## Sources & Citations
- Web3D Survey (web3dsurvey.com) - platform support statistics
- Can I Use (caniuse.com) - WebGL2 browser version data
- MDN Web Docs (developer.mozilla.org) - WebGL2 specifications
- WebKit Blog - iOS Safari autoplay policies
- Chrome Developers (developer.chrome.com) - autoplay policy documentation
- Stack Overflow / GitHub - mobile WebGL performance reports

## Related Searches
- WebGPU browser support timeline 2025-2026 (successor to WebGL)
- Three.js vs raw GLSL performance on mobile
- `prefers-reduced-motion` adoption statistics
- iOS Low Power Mode detection via JavaScript
