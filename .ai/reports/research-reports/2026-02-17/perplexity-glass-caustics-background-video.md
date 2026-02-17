# Perplexity Research: Glass/Caustics Background Video Creation

**Date**: 2026-02-17
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro) + Search API

## Query Summary
Researched the best tools, methods, and fastest approaches to create an animated glass/caustics background video similar to Payload CMS's homepage. Target: 1920x1080, 30-second seamless loop, H.264, ~8.5MB, with slow-moving diagonal light streaks on dark background in navy blue and amber/gold colors.

## Findings

### 1. Approach Ranking by Speed and Quality

| Rank | Approach | Est. Time | Quality | Cost |
|------|----------|-----------|---------|------|
| 1 | **Stock footage purchase** | 1-5 min | High | $15-79 per clip |
| 2 | **Shadertoy/WebGL shader** (screen recorded) | 5-15 min | Medium-High | Free |
| 3 | **After Effects** (Fractal Noise + CC Caustics) | 10-30 min | Medium | $23/mo or trial |
| 4 | **AI video generation** (Runway/Pika/Kling) | 15-60 min | Medium | $12-48/mo |
| 5 | **Blender Cycles** caustics render | 30 min - 2 hrs | High | Free |
| 6 | **Houdini** procedural sim | 1-4+ hrs | High | Free (Apprentice) |

### 2. Best Software/Tools (Detailed)

#### Blender (Free, Open Source) - RECOMMENDED for Custom Results
- **Engine**: Cycles with Shadow Caustics (available since Blender 3.2+)
- **Quality**: Photorealistic, full control over colors and animation
- **Workflow** (~2 hours total):
  1. **Scene Setup (10 min)**: Glass objects with Principled BSDF (Transmission 1, Base Color navy, Transmission Color gold/amber, Roughness 0, IOR 1.1-1.45). Dark navy floor plane with "Receive Shadow Caustics" enabled.
  2. **Animation (15 min)**: Keyframe slow diagonal translation/rotation over 900 frames (30fps). Use NLA tracks for seamless loop. Add wave displacement for organic streaks.
  3. **Lighting (10 min)**: 4-8 Point Lights (Power 500-1000, Radius 0.01), enable Shadow Caustics. Area light or emissive plane above.
  4. **Render Settings**: Samples 1000-2000, OptiX denoising, Caustics Samples 512+, Max Bounces 12+
  5. **Render (1-1.5 hrs)**: GPU render with denoising. Output image sequence then compile to MP4.
- **"Cheap Caustics" Technique**: Mix Shader + Light Path node for 3x faster renders (~11s/frame optimized)
- **Node Setup for Colors**:
  ```
  Glass BSDF -> Material Output (refractor)
  Floor: Texture Coord -> Mapping -> Wave/Musgrave Texture (amber #FFBF00) 
       -> Mix RGB (navy #001F3F overlay) -> Emission -> Material Output
  ```
- **Key Tutorial**: "NEW Shadow Caustics in Blender 3.2" by Kaizen on YouTube

#### After Effects (Paid - $23/mo)
- **Technique**: Fractal Noise + CC Caustics effect + displacement maps
- **Pros**: Fast procedural generation, no render wait, easy loop via evolution keyframes
- **Cons**: Not physically accurate (faked look), requires subscription
- **Best For**: Quick prototypes or when combined with a 3D base render

#### Cinema 4D (Paid - $94/mo)
- **Technique**: Refractive animation with Redshift/Octane caustics
- **Pros**: MoGraph effectors for procedural glass movement, strong loop tools via time remapping
- **Cons**: Plugin-dependent for caustics, steeper learning curve for loops, expensive
- **Render Time**: 2-6 hours GPU-accelerated

#### Houdini (Free Apprentice Edition)
- **Technique**: Procedural refraction sim with photon mapping or Mantra/Redshift
- **Pros**: Ultimate control and flexibility for sharp caustic patterns
- **Cons**: Steep learning curve, long render times
- **Best For**: Production studios needing absolute precision

### 3. AI Video Generation Tools

Current AI tools can attempt caustics but with limitations:

| Tool | Approach | Limitation |
|------|----------|------------|
| **Runway ML Gen-3** | Text-to-video prompt | Inconsistent loops, may need manual editing |
| **Pika** | Text-to-video | Quality varies, hard to get exact style |
| **Kling AI** | Video generation | Better at natural scenes than abstract effects |
| **Sora (OpenAI)** | Text-to-video | Higher quality but limited access |

**Prompt suggestion**: "seamless looping glass caustics refraction background, slow moving diagonal light streaks, dark navy blue background with amber gold highlights, 30 seconds, abstract, smooth organic movement"

**Verdict**: AI tools are improving rapidly but still struggle with precise seamless loops and specific abstract visual styles. Best used for inspiration/prototyping rather than final output.

### 4. Open Source Alternatives

#### Shadertoy (Free, Browser-Based)
- Real-time GLSL caustics shaders available
- Search "caustics glass" or "water caustics" on shadertoy.com
- Record output with OBS Studio at 1920x1080 30fps
- Fully customizable colors and animation speed
- Can port shaders to Three.js for website use

#### Three.js + GLSL Shaders (Free)
- Port Shadertoy shaders directly into Three.js
- Use `ShaderMaterial` with `iTime`, `iResolution` uniforms
- Can be used as real-time website background (no video needed)
- Reference: threejs.org/manual/en/shadertoy.html

#### Blender (Free)
- Full professional 3D suite with Cycles caustics
- PolySuite.app offers free Blender caustics material downloads

#### DaVinci Resolve (Free)
- Can apply Fractal Noise effects similar to After Effects
- Free version handles 1080p output

### 5. Fastest/Easiest Methods

#### Option A: Stock Footage (Fastest - 5 minutes)
1. Search Shutterstock, Pond5, Storyblocks, or Envato for "caustics loop dark background"
2. Storyblocks has 135+ caustics motion backgrounds
3. iStock has 2,700+ caustic light clips
4. Videezy.com offers some free caustic backgrounds
5. Color-grade with free DaVinci Resolve to match navy/amber palette
6. Trim/loop to 30 seconds

#### Option B: Shadertoy + OBS (15 minutes, Free)
1. Find caustics shader on Shadertoy.com
2. Modify colors to navy blue/amber gold in GLSL code
3. Set browser to fullscreen 1920x1080
4. Record 30 seconds with OBS Studio
5. Export as H.264 MP4

#### Option C: Blender Quick Workflow (2 hours, Free, Best Quality)
1. Create scene with tinted glass objects
2. Animate slow diagonal movement
3. Enable Cycles shadow caustics
4. Render with GPU + OptiX denoising
5. Composite with navy/amber color grading

### 6. Blender-Specific Resources

#### Tutorials
- **"NEW Shadow Caustics in Blender 3.2"** by Kaizen (YouTube) - Covers enabling caustics, glass shader setup, IOR settings, water caustics
- **Key Blender Settings**:
  - Render Engine: Cycles
  - Enable: Shadow Caustics (Experimental) on lights
  - Object Properties > Shading: "Cast Shadow Caustics" (glass), "Receive Shadow Caustics" (floor)
  - Glass BSDF: Roughness 0, IOR 1.1-1.45
  - Render Properties > Light Paths: Max Bounces 12+

#### Free Resources
- PolySuite.app free Blender caustics material
- Poly Haven (free HDRIs and textures for lighting)
- Gumroad free packs (search "caustics blender")

### 7. Stock Footage Sources

| Source | Quantity | Pricing | Notes |
|--------|----------|---------|-------|
| Shutterstock | 1,632+ lake caustic clips | $29-199/clip or subscription | 4K available, seamless loops |
| iStock | 2,700+ caustic light clips | $15-79/clip | Good selection of abstract caustics |
| Storyblocks | 135+ caustics backgrounds | $17/mo subscription | Unlimited downloads |
| Videezy | 15+ free caustic clips | Free | Limited but usable |
| MotionElements | Many clips | From $1/clip | Budget-friendly |
| Adobe Stock | Large library | $30/mo subscription | Integration with AE/Premiere |

## Recommendation

**For the SlideHeroes project**, given the specific Payload CMS-inspired aesthetic (dark background, navy blue + amber/gold diagonal streaks), here is the recommended approach:

### Primary Recommendation: Blender Cycles (Best Quality-to-Cost Ratio)
- Free software, photorealistic results
- Full control over exact colors (#001F3F navy, #FFBF00 amber)
- 2-hour investment for custom, unique result
- Can generate multiple variations

### Fallback: Stock Footage + Color Grading
- If time-constrained, purchase from Storyblocks ($17/mo) or Shutterstock
- Color-grade in DaVinci Resolve (free) to match exact palette
- 15-minute total workflow

### Alternative for Real-Time: Three.js Shader
- Could implement caustics directly as a WebGL shader background
- No video file needed, infinite loop, smaller payload
- More complex to implement but eliminates video bandwidth

## Sources & Citations
- Kaizen YouTube Tutorial: "NEW Shadow Caustics in Blender 3.2" (https://www.youtube.com/watch?v=nF3xvlAC8Lg)
- Three.js Shadertoy Manual: (https://threejs.org/manual/en/shadertoy.html)
- Storyblocks Caustics Collection: (https://www.storyblocks.com/motion-graphics/search/caustics)
- iStock Caustic Light Collection: (https://www.istockphoto.com/videos/caustic-light)
- Shutterstock Lake Caustic: (https://www.shutterstock.com/video/search/lake-caustic)
- Videezy Free Caustics: (https://www.videezy.com/free-video/caustic)
- GitHub Shader-toy Extension: (https://github.com/stevensona/shader-toy/issues/189)

## Key Takeaways
- **Blender is the best free option** with native Cycles caustics support since v3.2
- **Stock footage is fastest** if exact custom colors are not critical
- **Shadertoy/WebGL is the clever middle ground** - free, fast, customizable
- **AI video generation is not yet reliable** for this specific use case
- **After Effects is good for faked caustics** but requires paid subscription
- **Three.js shader approach** could eliminate video entirely for web use
- The Payload CMS effect appears to be either a 3D render (likely Blender/C4D) or a professionally produced stock clip with custom color grading

## Related Searches
- Specific Blender Geometry Nodes setups for procedural caustics animation
- Three.js caustics shader implementations for real-time web backgrounds
- WebGL water/glass refraction shaders optimized for performance
- Comparison of video background vs WebGL shader for website performance
