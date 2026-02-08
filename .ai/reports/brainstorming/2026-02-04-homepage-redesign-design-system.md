# Homepage Redesign: Design System & Section Specifications

**Created:** 2026-02-04
**Goal:** Top 0.1% homepage design for SlideHeroes
**Target File:** `apps/web/app/(marketing)/page.tsx`

---

## Table of Contents

1. [Inspiration Analysis](#part-1-inspiration-analysis)
2. [Design Language Document](#part-2-design-language-document)
3. [Complete Section Definitions](#part-3-complete-section-definitions)

---

## Part 1: Inspiration Analysis

### Reference Sites Analyzed

- https://www.getcargo.ai/
- https://linear.app/
- https://formless.xyz/
- https://orbitaix.webflow.io/
- https://pre.dev/

### A. Visual Language Patterns

**Dark Mode as Foundation (All 5 sites)**

Every reference site defaults to dark mode with deep backgrounds:

| Site | Background Approach |
|------|---------------------|
| Linear | Near-black `#08090a` |
| Cargo | Neutral-925/950 spectrum |
| OrbitAI | Deep space/galaxy aesthetic |
| pre.dev | Navy/dark foundations |
| Formless | Clean white (outlier, uses dark accents) |

**Accent Color Strategy**

Each site uses ONE dominant accent sparingly:

| Site | Accent Color | Usage |
|------|--------------|-------|
| Cargo | Emerald-400 (green) | Keywords and CTAs |
| Linear | Subtle gradients | Semantic status colors |
| OrbitAI | Electric blue `#3E9CFF` | Interactive elements |
| pre.dev | Cyan/teal gradients | CTAs and highlights |

For SlideHeroes, `#24a9e0` cyan fits perfectly with this pattern.

### B. Typography Patterns

**Font Choices**

- Linear: Inter Variable (clean, professional)
- OrbitAI: Ubuntu (modern, open-source feel)
- All sites: Sans-serif dominates, no decorative fonts

**Hierarchy Approach**

- Headlines: Large display text (5xl-6xl), often with gradient or color-highlighted keywords
- Subheadings: Medium weight, muted colors
- Body: High contrast for readability, generous line-height
- Linear uses `text-wrap: balance` for optimal headline readability

**Text Effects**

- Cargo: Animated character-by-character reveal
- Linear: `background-clip: text` for gradient text effects
- OrbitAI: Text-stroke for outline typography in loaders

### C. Animation & Motion Patterns

**Scroll-Triggered Animations (Universal)**

- OrbitAI: GSAP timelines with staggered delays (0.15s between children)
- Cargo: Number counting animations for statistics
- Linear: Hardware-aware rendering (checks `navigator.hardwareConcurrency`)

**Reveal Patterns**

- Cargo: "HomeRevealHeadlineParagraph" - letter-by-letter text animation
- OrbitAI: Clip-path circular reveals for hero images
- pre.dev: Pulsing CTA buttons (`ctaPulse` keyframe)

**Smooth Scrolling**

- OrbitAI: Lenis library with 4-second duration curves
- All sites: Transition durations of 300ms for hover states

**Loading States**

- OrbitAI: Custom loader with 4s initial, 1.5s return visit (smart UX)
- Linear: Suspension boundaries for progressive enhancement

### D. Section Archetypes Identified

| Section Type | Found In | Key Characteristics |
|--------------|----------|---------------------|
| Hero with animated reveal | Cargo, OrbitAI | Full-bleed, keyword highlighting, dashboard mockup overlay |
| Logo cloud/trust strip | All 5 | Marquee animation, partner logos, "trusted by" messaging |
| Feature bento grid | OrbitAI, Linear | Asymmetric card layouts, visual garnish elements |
| Animated statistics | Cargo | "5x more leads", "80% enrichment" with counting animation |
| Step-by-step process | Cargo, pre.dev | 4-step visual journey, numbered sections |
| Testimonial carousel | OrbitAI, pre.dev | Avatar-driven, dot navigation |
| Comparison/differentiator | Linear | Side-by-side feature cards |
| Social proof stacking | pre.dev | Layered founder avatars, "Join 10,000+" |
| Integration showcase | Cargo, pre.dev | Logo grid with hover effects, categorized APIs |
| Founder/team spotlight | Formless | Imagery with philosophy quote |

---

## Part 2: Design Language Document

### A. Color System

**Background Palette (Dark Mode Default)**

```css
--background-primary:    #0a0a0f;    /* near-black with slight blue undertone */
--background-secondary:  #12121a;    /* cards, elevated surfaces */
--background-tertiary:   #1a1a24;    /* hover states, subtle highlights */
--background-accent:     rgba(36, 169, 224, 0.1); /* cyan glow areas, 10% opacity */
```

**Text Hierarchy**

```css
--text-primary:    #f5f5f7;    /* headlines, primary content */
--text-secondary:  #a1a1aa;    /* body text, descriptions */
--text-tertiary:   #71717a;    /* captions, metadata */
--text-muted:      #52525b;    /* disabled, placeholder */
```

**Accent Colors**

```css
--accent-primary:        #24a9e0;    /* existing cyan - CTAs, links, highlights */
--accent-glow:           rgba(36, 169, 224, 0.2); /* glow effects, 20% opacity */
--accent-gradient-start: #24a9e0;
--accent-gradient-end:   #0ea5e9;    /* slightly lighter cyan for gradients */
```

**Semantic Colors**

```css
--success:  #22c55e;    /* green */
--warning:  #f59e0b;    /* amber */
--error:    #ef4444;    /* red */
```

**Gradient Definitions**

```css
--gradient-hero: radial-gradient(ellipse at top, rgba(36, 169, 224, 0.15) 0%, transparent 50%);
--gradient-card-border: linear-gradient(135deg, rgba(36, 169, 224, 0.3), transparent 50%);
--gradient-text: linear-gradient(90deg, #24a9e0, #0ea5e9);
```

### B. Typography Scale

**Font Stack**

```css
--font-display: "Inter Variable", "Inter", system-ui, sans-serif;
--font-body:    "Inter Variable", "Inter", system-ui, sans-serif;
--font-mono:    "JetBrains Mono", "Fira Code", monospace;
```

**Display Headlines (Hero, Section Titles)**

```css
--text-display-xl:  clamp(3rem, 8vw, 5rem);      /* 48-80px - Main hero */
--text-display-lg:  clamp(2.5rem, 6vw, 4rem);    /* 40-64px - Section heroes */
--text-display-md:  clamp(2rem, 4vw, 3rem);      /* 32-48px - Section titles */

/* Properties */
letter-spacing: -0.02em;
line-height: 1.1;
font-weight: 700;
```

**Headings**

```css
--text-h1:  2rem;      /* 32px */
--text-h2:  1.5rem;    /* 24px */
--text-h3:  1.25rem;   /* 20px */
--text-h4:  1.125rem;  /* 18px */

/* Properties */
letter-spacing: -0.01em;
line-height: 1.3;
font-weight: 600;
```

**Body Text**

```css
--text-body-lg:  1.125rem;   /* 18px - Lead paragraphs */
--text-body:     1rem;       /* 16px - Standard body */
--text-body-sm:  0.875rem;   /* 14px - Secondary content */

/* Properties */
letter-spacing: 0;
line-height: 1.6;
font-weight: 400;
```

**Utility Text**

```css
--text-caption:  0.75rem;    /* 12px - Labels, metadata */
--text-overline: 0.75rem;    /* 12px - Section labels, ALL CAPS */

/* Overline properties */
letter-spacing: 0.1em;
text-transform: uppercase;
font-weight: 500;
```

**Text Effects**

```css
/* Gradient text for highlighted keywords */
.text-gradient {
  background: linear-gradient(90deg, #24a9e0, #0ea5e9);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

/* Highlighted word underline (like current "faster") */
.text-highlight {
  position: relative;
}
.text-highlight::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 6px;
  background: rgba(36, 169, 224, 0.4);
  transform: rotate(-1deg);
  mask-image: linear-gradient(to right, transparent, white 4%, white 96%, transparent);
}
```

### C. Spacing System

**Base Unit: 4px**

```css
--space-1:   0.25rem;   /* 4px */
--space-2:   0.5rem;    /* 8px */
--space-3:   0.75rem;   /* 12px */
--space-4:   1rem;      /* 16px */
--space-6:   1.5rem;    /* 24px */
--space-8:   2rem;      /* 32px */
--space-12:  3rem;      /* 48px */
--space-16:  4rem;      /* 64px */
--space-24:  6rem;      /* 96px */
--space-32:  8rem;      /* 128px */
```

**Section Spacing**

```css
--section-gap-sm:   4rem;     /* 64px - Mobile */
--section-gap-md:   6rem;     /* 96px - Tablet */
--section-gap-lg:   8rem;     /* 128px - Desktop */
```

**Container Widths**

```css
--width-narrow:   768px;    /* Focused content, testimonials */
--width-content:  1024px;   /* Standard sections */
--width-wide:     1280px;   /* Full-width features, navigation */
--width-max:      1440px;   /* Absolute maximum */
```

### D. Animation Principles

**Timing Functions**

```css
--ease-out-expo:    cubic-bezier(0.16, 1, 0.3, 1);     /* Primary - smooth deceleration */
--ease-out-quart:   cubic-bezier(0.25, 1, 0.5, 1);    /* Secondary - subtle ease */
--ease-in-out:      cubic-bezier(0.4, 0, 0.2, 1);     /* Symmetric transitions */
--ease-spring:      cubic-bezier(0.34, 1.56, 0.64, 1); /* Bouncy, playful */
```

**Duration Scale**

```css
--duration-instant:  75ms;    /* Micro-interactions (opacity) */
--duration-fast:     150ms;   /* Hover states, toggles */
--duration-normal:   300ms;   /* Standard transitions */
--duration-slow:     500ms;   /* Complex reveals */
--duration-slower:   750ms;   /* Section entrances */
--duration-slowest:  1000ms;  /* Hero animations */
```

**Scroll-Triggered Animations**

| Element Type | Animation | Duration | Delay Pattern |
|--------------|-----------|----------|---------------|
| Headlines | Fade up + blur clear | 750ms | 0ms |
| Subheadings | Fade up | 500ms | 100ms |
| Body text | Fade in | 300ms | 200ms |
| Cards (grid) | Fade up + scale | 500ms | stagger 100ms |
| Images | Fade + subtle zoom | 750ms | 150ms |
| Statistics | Count up | 1500ms | on viewport entry |

**Hover States**

```css
/* Cards */
transform: translateY(-4px);
box-shadow: 0 20px 40px -12px rgba(36, 169, 224, 0.15);
transition: all 300ms var(--ease-out-expo);

/* Buttons */
transform: scale(1.02);
box-shadow: 0 0 20px rgba(36, 169, 224, 0.4);

/* Links */
color: var(--accent-primary);
text-decoration-color: var(--accent-primary);
```

**Signature Animations**

```css
/* 1. Text reveal - letter by letter */
@keyframes revealLetter {
  from { opacity: 0; transform: translateY(20px) rotateX(-90deg); }
  to { opacity: 1; transform: translateY(0) rotateX(0); }
}

/* 2. Glow pulse for CTAs */
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 20px rgba(36, 169, 224, 0.3); }
  50% { box-shadow: 0 0 40px rgba(36, 169, 224, 0.6); }
}

/* 3. Gradient border rotation */
@keyframes borderRotate {
  from { --angle: 0deg; }
  to { --angle: 360deg; }
}

/* 4. Number count-up (JS-driven) */
/* Animate from 0 to target over 1500ms with easeOutExpo */
```

### E. Component Patterns

**Card Styles**

```
1. Glass Card (Primary)
   - Background: rgba(18, 18, 26, 0.6)
   - Backdrop-filter: blur(12px)
   - Border: 1px solid rgba(255, 255, 255, 0.08)
   - Border-radius: 16px

2. Spotlight Card (Feature highlights)
   - Gradient border on hover
   - Radial gradient follows cursor
   - Subtle inner glow

3. Stat Card (Metrics)
   - Large number with count-up animation
   - Accent color for the number
   - Minimal supporting text
```

**Button Hierarchy**

```
Primary:
  - Background: #24a9e0
  - Text: #0a0a0f (dark)
  - Hover: Glow pulse + slight scale
  - Padding: 12px 24px
  - Border-radius: 8px

Secondary:
  - Background: transparent
  - Border: 1px solid rgba(255, 255, 255, 0.2)
  - Text: #f5f5f7
  - Hover: Background rgba(255, 255, 255, 0.05)

Ghost:
  - Background: transparent
  - Text: #a1a1aa
  - Hover: Text #f5f5f7, underline
```

**Visual Garnishes**

```
1. Gradient orbs (background decoration)
   - Large blurred circles with accent color at 10-15% opacity
   - Positioned behind hero and key sections

2. Grid pattern overlay
   - Subtle dot or line grid at 3-5% opacity
   - Creates depth without distraction

3. Noise texture
   - Very subtle grain overlay (2-3% opacity)
   - Adds tactile quality to flat surfaces

4. Glow effects
   - Accent-colored radial gradients behind key elements
   - Creates focus and depth
```

### F. Iconography

**Style Guidelines**

- Line icons (not filled) for consistency
- Stroke width: 1.5px
- Size scale: 16px, 20px, 24px, 32px
- Color: Inherit from text or use accent for emphasis

**Recommended Library**

Continue with Lucide React (already in use), supplemented with custom icons for product-specific concepts.

**Icon Animation**

- Subtle scale on hover (1.1x)
- For feature icons: Draw-in animation on scroll entry

---

## Part 3: Complete Section Definitions

### Section Order Overview

| # | Section | Type | Purpose |
|---|---------|------|---------|
| 1 | Hero | Existing (redesigned) | Hook & primary CTA |
| 2 | Product Preview | Existing (redesigned) | Show the product |
| 3 | Logo Cloud | Existing (redesigned) | Trust signals |
| 4 | **Statistics** | **NEW** | Credibility with metrics |
| 5 | Sticky Scroll Features | Existing (redesigned) | Core value props |
| 6 | **How It Works** | **NEW** | Demystify the process |
| 7 | Features Grid | Existing (redesigned) | Differentiators |
| 8 | **Comparison** | **NEW** | Us vs. alternative |
| 9 | Testimonials | Existing (redesigned) | Social proof |
| 10 | Pricing | Existing (redesigned) | Conversion |
| 11 | Blog/Reads | Existing (redesigned) | Authority building |
| 12 | **Final CTA** | **NEW** | Closing conversion |

---

### 1. HERO SECTION

**Current Idea Retained:** Headline with "faster" highlight, subtitle about AI-powered presentations, CTA to start

**Redesigned Approach:**

```
Layout:
- Full viewport height (100vh)
- Centered content with max-width 1024px
- Background: Gradient orb (accent color) top-center, fading into darkness
- Subtle animated grid/dot pattern overlay

Content Stack:
1. Pill badge: "AI-Powered Presentation Platform" (subtle, muted)
2. Headline: "Write more impactful presentations faster"
   - "faster" gets gradient text treatment + animated underline
   - Text reveals letter-by-letter on load (750ms)
3. Subtitle: Fades in 200ms after headline completes
   - Max-width 600px, text-secondary color
4. CTA Group:
   - Primary: "Start Writing Free" (glow pulse animation)
   - Secondary: "Watch Demo" (ghost button with play icon)
5. Social proof micro-strip:
   - Stacked avatars (5 users) + "Join 2,000+ professionals"

Visual Enhancement:
- Floating gradient orbs animate slowly in background (parallax on scroll)
- Mouse-follow subtle glow effect near CTA area

Transition to Next Section:
- Hero content fades/scales slightly as user scrolls
- Product preview rises from below (parallax overlap)
```

---

### 2. PRODUCT PREVIEW SECTION

**Current Idea Retained:** Show the product/canvas in action

**Redesigned Approach:**

```
Layout:
- Overlaps hero by ~15vh (maintains current behavior)
- Product frame with glass card styling
- Subtle perspective tilt (3D effect)

Content:
1. Browser-style frame:
   - Dark frame with traffic light dots
   - Tab showing "SlideHeroes Canvas"
2. Product screenshot/video:
   - Option A: Static high-quality screenshot
   - Option B: Auto-playing muted video loop showing AI in action
   - Option C: Animated mockup with typing simulation

Visual Enhancement:
- Glow beneath the frame (accent color, 15% opacity)
- Frame has gradient border that subtly animates
- On scroll: Frame scales down slightly and gains more shadow depth
```

---

### 3. LOGO CLOUD SECTION

**Current Idea Retained:** Show trusted brands/logos

**Redesigned Approach:**

```
Layout:
- Full-width with subtle top/bottom borders (rgba white 5%)
- No section title - logos speak for themselves
- Padding: 48px vertical

Content:
1. Optional micro-label: "Trusted by professionals at" (text-tertiary, small)
2. Logo marquee:
   - Continuous scroll animation (60s loop)
   - Logos in grayscale, ~40% opacity
   - On hover: Individual logo gains full opacity
   - Gradient fade on left/right edges

Visual Enhancement:
- Logos slightly larger than current (height: 32-40px)
- Generous spacing between logos (64px+)
- No background color change - seamless with page
```

---

### 4. STATISTICS SECTION (NEW)

**Inspired by:** Cargo (animated numbers), pre.dev (stacked avatars)

**Purpose:** Build credibility with concrete metrics before diving into features

**Placement:** After Logo Cloud, before Sticky Scroll

```
Layout:
- Full-width section with subtle background accent glow (centered, large, diffuse)
- 3-4 statistics in horizontal row
- Centered, generous spacing

Content:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    "2,000+"         "50,000+"        "4.9/5"       "85%"   │
│   Professionals    Presentations     Rating     Time Saved  │
│     trained         created        (from 200+)   on average │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Stat Block Design:
1. Large number (text-display-lg, accent color or gradient text)
   - Animates counting up when scrolled into view
2. Label below (text-secondary, text-body-sm)
3. Optional: Subtle icon above number

Visual Enhancement:
- Numbers have subtle glow
- Decorative gradient orb behind center of section
- Optional: Animated particles or floating dots

Animation:
- Numbers count up with easeOutExpo (1500ms)
- Labels fade in after numbers complete
- Stagger between each stat (200ms)
```

---

### 5. STICKY SCROLL FEATURES SECTION

**Current Idea Retained:** Three main offerings (AI Canvas, Training, Coaching) with sticky reveal

**Redesigned Approach:**

```
Layout:
- Section title + subtitle at top (centered)
- Two-column layout: Left sticky text, Right scrolling images
- Desktop: 40% text / 60% image
- Mobile: Stacked, images between text blocks

Content Structure:
Each feature block:
1. Overline: "01 / 03" (numbered, accent color)
2. Title: Large, bold (text-display-md)
3. Description: Bullet points with subtle checkmark icons
4. Optional micro-CTA: "Learn more →"

Image Treatment:
- Images in device frames (laptop mockup for canvas, etc.)
- Parallax movement as they scroll
- Subtle shadow and glow beneath each

Transitions:
- Text fades/slides as user scrolls between features
- Active feature indicator on left (vertical progress line)
```

---

### 6. HOW IT WORKS SECTION (NEW)

**Inspired by:** Cargo (4-step stepper: Extract → Enrich → Qualify → Engage)

**Purpose:** Demystify the product, show clear path to value

**Placement:** After Sticky Scroll Features, before Features Grid

```
Layout:
- Section title + subtitle centered
- Horizontal stepper on desktop, vertical on mobile
- 4 steps with connecting line

Content:

Step 1: "Assemble"
  - Icon: FolderInput / Layers
  - Text: "Gather your research, data, and key messages in one place"

Step 2: "Outline"
  - Icon: ListTree / Network
  - Text: "Structure your argument with AI-powered logical frameworks"

Step 3: "Storyboard"
  - Icon: LayoutPanelTop / Columns
  - Text: "Transform your outline into a visual slide-by-slide narrative"

Step 4: "Produce"
  - Icon: Presentation / FileOutput
  - Text: "Export polished slides ready for your high-stakes meeting"

Visual Design:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   ①─────────────②─────────────③─────────────④               │
│   Assemble      Outline       Storyboard    Produce         │
│                                                              │
│   [icon]        [icon]        [icon]        [icon]          │
│   Gather your   Structure     Transform     Export polished │
│   research...   your argument your outline  slides ready... │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Step Design:
- Number in circle (accent border, or filled for active/complete)
- Connecting line (gradient from left to right, animates on scroll)
- Icon below number (48px, glass container)
- Step name (bold, accent color) + description (muted)

Animation:
- Line draws left-to-right as user scrolls
- Each step fades in when line reaches it
- Icons have subtle bounce when activated
```

---

### 7. FEATURES GRID SECTION

**Current Idea Retained:** "How we are different" - 6 differentiators

**Redesigned Approach:**

```
Layout:
- Section title + subtitle centered
- Bento grid layout (not uniform):
  - 2 large cards (span 2 columns)
  - 4 standard cards (1 column each)
  - Creates visual hierarchy

Card Design (Glass + Spotlight):
- Background: Glass card with blur
- Border: Gradient border, animates on hover
- Cursor-following radial glow effect
- Icon: 48px, accent-colored glow behind it

Content per Card:
1. Icon (top)
2. Title (bold, text-primary)
3. Description (text-secondary, 2-3 lines max)

Grid Pattern (Desktop):
┌─────────────┬───────┬───────┐
│   Card 1    │Card 2 │Card 3 │
│   (large)   │       │       │
├───────┬─────┴───────┼───────┤
│Card 4 │   Card 5    │Card 6 │
│       │   (large)   │       │
└───────┴─────────────┴───────┘
```

---

### 8. COMPARISON SECTION (NEW)

**Inspired by:** Linear (feature comparison cards), common SaaS pattern

**Purpose:** Differentiate from competitors and manual processes

**Placement:** After Features Grid, before Testimonials

```
Layout:
- Section title: "Why SlideHeroes?" or "The SlideHeroes Difference"
- Two-column comparison or feature checklist

Design: Side-by-Side Cards
┌─────────────────────┬─────────────────────┐
│   Without           │   With              │
│   SlideHeroes       │   SlideHeroes       │
│   ──────────────    │   ──────────────    │
│   ✗ Hours of        │   ✓ Minutes to      │
│     blank page      │     first draft     │
│   ✗ Inconsistent    │   ✓ Proven          │
│     structure       │     frameworks      │
│   ✗ Generic AI      │   ✓ Presentation-   │
│     outputs         │     specific AI     │
│   ✗ No guidance     │   ✓ Expert training │
│     on delivery     │     included        │
└─────────────────────┴─────────────────────┘

Card Design:
"Without" card:
- Muted, slightly darker background
- Red/muted X icons
- Text in text-tertiary

"With" card:
- Glass card with accent border glow
- Green checkmarks or accent-colored ✓
- Text in text-primary
- Subtle accent gradient overlay

Animation:
- Cards/rows fade in with stagger
- Checkmarks animate in (draw or pop)
- "With SlideHeroes" card has subtle shimmer on load
```

---

### 9. TESTIMONIALS SECTION

**Current Idea Retained:** Social proof from real users, masonry grid layout

**Redesigned Approach:**

```
Layout:
- Section title + subtitle centered
- Masonry grid maintained but refined
- 3 columns desktop, 2 tablet, 1 mobile

Card Design:
- Glass card with subtle border
- No heavy shadows - relies on border/glass effect
- Generous padding (24-32px)

Content per Card:
1. Quote text (text-body-lg for featured, text-body for others)
   - Opening quotation mark as large decorative accent (") in accent color
2. Divider line (subtle, 40px wide)
3. Author row:
   - Avatar (48px, rounded full, subtle ring)
   - Name (text-primary, font-medium)
   - Title/Company (text-tertiary)
4. Optional: Star rating or company logo

Featured Testimonial:
- One card spans 2 columns
- Larger text, more prominent styling
- Photo slightly larger (64px)

Animation:
- Cards fade up with stagger (100ms between each)
- On hover: Card lifts slightly (translateY -4px)
```

---

### 10. PRICING SECTION

**Current Idea Retained:** Free tier to start, upgrade path, "fair pricing" messaging

**Redesigned Approach:**

```
Layout:
- Section with subtle background differentiation (background-secondary)
- Pill badge + title + subtitle centered
- Pricing toggle: Monthly / Annual (Annual shows savings badge)
- Cards in horizontal row (3 tiers typical)

Card Design:
Standard Tier:
- Glass card styling
- Border: subtle white/5%
- Header: Tier name + price
- Feature list with checkmarks
- CTA button (secondary style)

Recommended Tier (Middle):
- Highlighted with accent glow border
- "Most Popular" badge (accent background)
- Slightly larger scale (1.02x)
- CTA button (primary style with glow)
- Background has subtle accent gradient

Enterprise Tier:
- "Contact Us" instead of price
- Custom messaging
- Secondary CTA

Content per Card:
1. Tier name (h3)
2. Price: Large number + "/month" small
3. Description: One-liner about who it's for
4. Divider
5. Feature list (8-10 items, checkmarks)
6. CTA button (full width)

Animation:
- Cards fade up on scroll
- Recommended card has subtle continuous glow pulse
- Price numbers count up when section enters view
```

---

### 11. BLOG/ESSENTIAL READS SECTION

**Current Idea Retained:** Curated articles to establish expertise

**Redesigned Approach:**

```
Layout:
- Section title + subtitle centered
- 3-column grid (desktop), single column stacked (mobile)
- Optional: "View All Articles →" link after grid

Card Design:
- Taller cards with image area at top
- Glass card base with hover lift

Content per Card:
1. Image/Thumbnail area:
   - 16:9 aspect ratio
   - Gradient overlay (bottom, for text readability)
   - Category badge overlaid top-left ("Guide", "Tutorial")
2. Content area:
   - Title (h4, 2 lines max, clamp)
   - Description (text-secondary, 3 lines max)
   - Meta row: Read time + icon (e.g., "15 min read")
3. Hover state:
   - Image scales subtly (1.05x)
   - Card lifts
   - "Read Article →" text appears or highlights

Animation:
- Cards fade up with stagger
- Image has slow zoom on hover (500ms)
```

---

### 12. FINAL CTA SECTION (NEW)

**Inspired by:** All reference sites have strong closing CTAs

**Purpose:** Final conversion push before footer

**Placement:** After Blog section, before Footer

```
Layout:
- Full-width section with prominent background treatment
- Large gradient orb centered behind content
- Centered content stack

Content:
1. Headline: "Ready to transform your presentations?"
   - Text-display-md, gradient text or accent highlight
2. Subtitle: "Join thousands of professionals who present with confidence"
   - Text-secondary, max-width 500px
3. CTA Buttons:
   - Primary: "Start Writing Free" (large, glow pulse)
   - Secondary: "Book a Demo" (ghost)
4. Trust badges row:
   - "No credit card required"
   - "Free plan available"
   - "Cancel anytime"

Visual Design:
┌────────────────────────────────────────────────────────────┐
│                        ·  · ·  ·                           │
│                    ·      ◉       ·                        │
│                       (glow orb)                           │
│                                                            │
│         Ready to transform your presentations?             │
│                                                            │
│     Join thousands of professionals who present            │
│                   with confidence                          │
│                                                            │
│        [ Start Writing Free ]  [ Book a Demo ]             │
│                                                            │
│     ✓ No credit card    ✓ Free plan    ✓ Cancel anytime   │
│                                                            │
└────────────────────────────────────────────────────────────┘

Animation:
- Background orb slowly pulses/breathes
- Content fades up on scroll entry
- CTA has persistent subtle glow animation
```

---

## Constraints Reminder

1. **Primary accent color:** `#24a9e0` (retained)
2. **Section ideas:** Retained from current site, design updated
3. **Dark mode:** Default theme
4. **shadcn/ui:** Use where appropriate, extend beyond when needed

---

## Next Steps

1. Review and approve this design system
2. Create/update Tailwind config with design tokens
3. Build reusable components (Glass Card, Stat Block, Process Step, etc.)
4. Implement sections one by one
5. Add animations with Framer Motion or CSS
6. Test responsive behavior across breakpoints
7. Optimize performance (lazy load, code split animations)
