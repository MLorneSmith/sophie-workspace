---
title: SlideHeroes Design System
tags: [design, ui, css, tailwind, typography, colors, animation, accessibility]
dependencies: []
cross_references: []
priority: high
last_updated: 2026-02-18
---

# SlideHeroes Design System

> The single source of truth for all visual design decisions.
> Based on the current homepage implementation — our reference design.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Theme Architecture](#2-theme-architecture)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [Spacing & Layout](#5-spacing--layout)
6. [Border Radius](#6-border-radius)
7. [Elevation & Shadows](#7-elevation--shadows)
8. [Glass & Blur Effects](#8-glass--blur-effects)
9. [Animation System](#9-animation-system)
10. [Iconography](#10-iconography)
11. [Breakpoints](#11-breakpoints)
12. [Component Patterns](#12-component-patterns)
13. [Interaction States](#13-interaction-states)
14. [Accessibility](#14-accessibility)
15. [Implementation Reference](#15-implementation-reference)

---

## 1. Design Philosophy

### Identity

SlideHeroes uses a **dark, editorial, premium** design language. The visual identity communicates sophistication and technical capability for a B2B SaaS presentation platform.

### Core Principles

- **Dark-first**: Pure black backgrounds with blue-tinted surfaces create depth
- **Editorial restraint**: Medium-weight headings (500), generous whitespace, clean lines
- **Glass morphism**: Frosted glass cards with subtle borders over dark surfaces
- **Accent discipline**: A single cyan-blue accent color (`#24a9e0`) used consistently
- **Progressive disclosure**: Scroll-triggered animations reveal content incrementally
- **Accessibility by default**: WCAG AA minimum, reduced motion support, 44px touch targets

### What We Are Not

- Not flat/minimal — we use depth, glass effects, and subtle glow
- Not maximalist — one accent color, restrained typography weights
- Not light-mode-first — dark is the default and brand identity

---

## 2. Theme Architecture

### Marketing Pages (Always Dark)

Marketing pages enforce dark mode unconditionally:

```tsx
// apps/web/app/(marketing)/layout.tsx
<div data-marketing className="dark flex min-h-[100vh] flex-col">
  {children}
</div>
```

- `dark` class: Forces dark mode CSS variables
- `data-marketing`: Activates marketing-specific CSS tokens and typography scale
- No user toggle — marketing pages are always dark

### Application Pages (Dark Default, Light Optional)

App pages (dashboard, settings, workspace) default to dark mode but allow user preference:

```typescript
// apps/web/lib/root-theme.ts
const fallbackThemeMode = "dark";
```

- Default: Dark mode
- User toggle: Stored in user preferences
- System preference: Respected as fallback

### CSS Variable Layers

```
┌─────────────────────────────────────────────┐
│  [data-marketing] tokens                     │  Marketing-only overrides
│  --homepage-bg, --homepage-accent, etc.      │
├─────────────────────────────────────────────┤
│  .dark { } tokens                            │  Dark mode semantic colors
│  --background, --foreground, --card, etc.    │
├─────────────────────────────────────────────┤
│  @theme inline { } tokens                    │  Primitive color scales
│  --color-neutral-*, --color-white, etc.      │
└─────────────────────────────────────────────┘
```

---

## 3. Color System

### 3.1 Brand Accent

The primary accent is **cyan-blue** `#24a9e0`. This single color anchors the entire brand.

| Token | Value | Usage |
|-------|-------|-------|
| `--homepage-accent` | `#24a9e0` | Interactive elements, icons, stats, links |
| `--homepage-accent-contrast` | `#0f7ea8` | WCAG AA compliant text on dark backgrounds |
| `--homepage-accent-glow` | `rgba(36, 169, 224, 0.4)` | Glow effects, hover states |
| `--homepage-gradient-accent` | `linear-gradient(135deg, #1e9dd0, #1a6fb5)` | Gradient text, CTA orbs |

### 3.2 Accent Color Spectrum

Used cyclically for feature cards, step indicators, and bento grid:

| Index | Hex | Name | Usage |
|-------|-----|------|-------|
| 0 | `#2431E0` | Deep Blue | First card/step border + icon |
| 1 | `#246CE0` | Medium Blue | Second card/step |
| 2 | `#24A9E0` | **Brand Cyan** | Third card/step (primary accent) |
| 3 | `#24E0DD` | Cyan-Teal | Fourth card/step |
| 4 | `#24E09D` | Teal-Green | Fifth card/step |

These colors are used at low opacity for borders (20-25%) and icon backgrounds (12%), creating subtle differentiation without overwhelming the design.

### 3.3 Dark Mode Surface Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `var(--color-black)` / `#000000` | Page background |
| `--homepage-bg` | `#0a0a0f` | Near-black with blue tint |
| `--homepage-surface` | `#12121a` | Dark navy surface (cards) |
| `--homepage-surface-elevated` | `#1a1a25` | Elevated card surfaces |
| `--foreground` | `var(--color-white)` | Primary text |
| `--card` | `var(--color-neutral-900)` | Card backgrounds |
| `--muted` | `var(--color-neutral-800)` | Muted backgrounds |
| `--muted-foreground` | `oklch(71.19% 0.0129 286.07)` | Secondary text (~`#a8a8b8`) |

### 3.4 Border Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--homepage-border` | `#2a2a3a` | Standard borders |
| `--homepage-border-subtle` | `#1e1e2e` | Very subtle borders |
| `--border` | `var(--color-neutral-800)` | Default border token |
| `border-white/[0.08]` | 8% white | Card borders (showcase) |
| `border-white/10` | 10% white | Section borders, tab separators |
| `border-white/5` | 5% white | Subtle structural dividers |

### 3.5 Light Mode Surface Colors

Used for app pages when user selects light theme:

| Token | Light Value | Usage |
|-------|-------------|-------|
| `--background` | `white` | Page background |
| `--foreground` | `var(--color-neutral-950)` | Primary text |
| `--card` | `white` | Card backgrounds |
| `--muted` | `var(--color-neutral-100)` | Muted backgrounds |
| `--muted-foreground` | `var(--color-neutral-500)` | Secondary text |
| `--border` | `var(--color-neutral-200)` | Borders |
| `--input` | `var(--color-neutral-200)` | Input borders |

### 3.6 Semantic Status Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-success` / `green` | `#22c55e` | Success states |
| `--color-warning` / `amber` | `#f59e0b` | Warning states |
| `--color-error` / `red` | `#ef4444` (light) / `#dc2626` (dark) | Error states |
| `--color-info` / `blue` | `#3b82f6` (light) / `#60a5fa` (dark) | Info states |

### 3.7 Text Opacity Scale

For layered text hierarchy on dark backgrounds:

| Class | Opacity | Usage |
|-------|---------|-------|
| `text-foreground` | 100% | Headlines, active text |
| `text-foreground/80` | 80% | Emphasis paragraphs |
| `text-muted-foreground` | ~65% | Body text, subtitles |
| `text-white/60` | 60% | Panel mockup secondary |
| `text-white/50` | 50% | Tertiary text |
| `text-white/40` | 40% | Inactive items |
| `text-white/30` | 30% | Decorative text |

---

## 4. Typography

### 4.1 Font Stack

| Role | Font | Source | Variable | Weights |
|------|------|--------|----------|---------|
| **Body / Sans** | Untitled Sans | Local (Klim Type Foundry) | `--font-sans` | 300, 400, 500, 700, 900 |
| **Heading** | Untitled Sans | Local (Klim Type Foundry) | `--font-heading` | 500, 700, 900 |
| **Script** | Whisper | Google Fonts | `--font-script` | 400 |

**Key decision**: Headings and body use the same family (Untitled Sans). The distinction is in weight and scale, not in font pairing. This creates a refined, editorial feel.

**Script font**: Whisper is used exclusively for decorative signatures (Founder's Letter, testimonials).

### 4.2 Marketing Typography Scale

Used on pages wrapped with `data-marketing`:

| Token | Size | Line Height | Letter Spacing | Weight | Usage |
|-------|------|-------------|----------------|--------|-------|
| `--text-display` | 4.768rem (76px) | 1.1 | -0.02em | 500 (medium) | Hero h1 |
| `--text-display-2` | 3.75rem (60px) | 1.2 | -0.02em | 500 | Large section titles |
| `--text-h2` | 3.052rem (49px) | 1.2 | -0.02em | 500 | Section headings |
| `--text-h3` | 2.441rem (39px) | 1.2 | -0.01em | 500 | Sub-section headings |
| `--text-body-lg` | 1.563rem (25px) | 1.5 | 0 | 400 | Lead paragraphs, subtitles |
| `--text-body` | 1.25rem (20px) | 1.5 | 0 | 400 | Body text |

**Critical detail**: Marketing headings use `font-weight: 500` (medium), not bold. This is intentional — it creates the editorial, refined aesthetic. Only card titles and specific UI elements use `font-semibold` (600).

### 4.3 Application Typography Scale

For dashboard, settings, and workspace pages:

| Token | Size | Line Height | Letter Spacing | Weight | Usage |
|-------|------|-------------|----------------|--------|-------|
| `--text-app-h1` | 2.25rem (36px) | 1.2 | -0.02em | 600 | Page titles |
| `--text-app-h2` | 1.875rem (30px) | 1.25 | -0.01em | 600 | Section headings |
| `--text-app-h3` | 1.5rem (24px) | 1.3 | -0.01em | 600 | Card titles |
| `--text-app-h4` | 1.25rem (20px) | 1.4 | 0 | 600 | Sub-headings |
| `--text-app-body` | 1rem (16px) | 1.5 | 0 | 400 | Body text |
| `--text-app-sm` | 0.875rem (14px) | 1.4 | 0 | 400 | Small text, metadata |
| `--text-app-xs` | 0.75rem (12px) | 1.4 | 0.01em | 400 | Captions, badges |

### 4.4 Responsive Heading Patterns (Marketing)

Hero h1:
```
text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem]
font-medium leading-[1.1] tracking-tight
```

Section h2:
```
text-h3 sm:text-h2
```
Starts at ~39px on mobile, grows to ~49px on desktop.

Card titles:
```
text-lg font-semibold    (18px — standard cards)
text-xl lg:text-2xl      (20-24px — feature tabs)
```

### 4.5 Font Weight Usage Guide

| Weight | Class | Marketing Usage | App Usage |
|--------|-------|----------------|-----------|
| 300 | `font-light` | Testimonial quotes | — |
| 400 | `font-normal` | Body text, subtitles | Body text |
| 500 | `font-medium` | **All marketing headings**, buttons | Buttons, labels |
| 600 | `font-semibold` | Card titles, tab titles | All headings |
| 700 | `font-bold` | Statistics numbers | Strong emphasis |

---

## 5. Spacing & Layout

### 5.1 Width Hierarchy

Three levels of content width:

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| Navigation | 1280px | `max-w-7xl` | Header, footer |
| Content | 1152px | `max-w-6xl` | Standard content sections |
| Focused | 1024px | `max-w-5xl` | Hero, key messages |
| Narrow | 672px | `max-w-2xl` | Founder's letter, long-form text |
| FAQ | 768px | `max-w-3xl` | FAQ, forms |

### 5.2 Container Base

```
mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden
```

Container utility (defined in `theme.utilities.css`):
```css
@utility container {
  margin-inline: auto;
  @apply xl:max-w-[80rem] px-4 lg:px-8;  /* 1280px max */
}
```

### 5.3 Section Vertical Spacing

Standard section padding across breakpoints:

| Breakpoint | Padding | Pixels |
|------------|---------|--------|
| Base | `py-12` | 48px |
| `sm` | `py-16` | 64px |
| `md` | `py-20` | 80px |
| `lg` | `py-28` | 112px |

**Pattern**: `py-12 sm:py-16 md:py-20 lg:py-28`

Founder's Letter (extra generous):
```
py-16 sm:py-20 md:py-28 lg:py-36
```

### 5.4 Content Gaps

| Context | Pattern | Value |
|---------|---------|-------|
| Section heading → subtitle | `mb-4 sm:mb-6` | 16-24px |
| Subtitle → content | `mb-10 sm:mb-14` | 40-56px |
| Hero content stack | `gap-6` | 24px |
| Grid gaps (cards) | `gap-4 sm:gap-6 lg:gap-8` | 16-32px |
| How-it-works arrows | 40px column | Fixed |

### 5.5 Spacing Constants (Code)

```typescript
const spacing = {
  sm: "gap-4 my-4",
  md: "gap-6 my-6",
  lg: "gap-8 my-8",
  xl: "gap-12 my-12",
  section: "py-12 sm:py-16 md:py-20 lg:py-28",
};
```

---

## 6. Border Radius

| Context | Value | Tailwind |
|---------|-------|----------|
| Base/default | 8px | `rounded-md` (`--radius: 0.5rem`) |
| Cards (marketing) | 12px | `rounded-xl` |
| Browser frame outer | 16px | `rounded-2xl` |
| CTA buttons | 12px | `rounded-xl` |
| Presentation cards | 8px → 12px | `rounded-lg sm:rounded-xl` |
| Pills, avatars, tabs | 9999px | `rounded-full` |
| Step badges | 9999px | `rounded-full` |
| Testimonial nav | 9999px | `rounded-full` |
| How-it-works cards | 16px | `rounded-2xl` |

**Pattern**: Marketing uses larger radii (`rounded-xl`, `rounded-2xl`). App pages use standard radii (`rounded-md`, `rounded-lg`).

---

## 7. Elevation & Shadows

### 7.1 Standard Shadow Scale

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 3px rgb(0 0 0 / 0.1)` | Subtle lift |
| `shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1)` | Dropdowns |
| `shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1)` | Modals |
| `shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1)` | Large overlays |
| `shadow-2xl` | `0 25px 50px -12px rgb(0 0 0 / 0.25)` | Maximum depth |

### 7.2 Marketing-Specific Shadows

| Effect | Value | Usage |
|--------|-------|-------|
| Card hover glow | `0 8px 30px rgba(color, 0.25)` | Bento cards, how-it-works cards |
| Glow pulse base | `0 0 20px rgba(36, 169, 224, 0.3)` | Browser frame glow |
| Glow pulse peak | `0 0 40px rgba(36, 169, 224, 0.5)` | Browser frame glow (animated) |
| Edge vignette | `inset 0 60px 80px 40px rgba(0,0,0,0.6)` | CausticsBackground top/bottom |
| CTA glow orb | `blur-[80px]` on `#24a9e0/20` (500x500 circle) | Final CTA section |
| CTA button | `dark:shadow-primary/30 hover:shadow-2xl` | Primary CTA buttons |
| GlassCard glow | `shadow-[0_0_15px_var(--homepage-accent-glow)]` | Featured glass cards |

### 7.3 Dark Mode Shadow Rules

On dark backgrounds, traditional box-shadows are barely visible. Instead, use:
- **Colored glow shadows**: `rgba(accent-color, 0.2-0.3)` for interactive elements
- **Border emphasis**: Increase border opacity on hover rather than adding shadow
- **Blur-based glow**: Large blurred elements behind cards for ambient light effect

---

## 8. Glass & Blur Effects

Glass morphism is central to the marketing design. All glass elements need Safari fallbacks.

### 8.1 Blur Scale

| Level | Blur | Opacity | Tailwind | Usage |
|-------|------|---------|----------|-------|
| Subtle | 12px | 60% | `backdrop-blur-[12px] bg-[--homepage-surface]/60` | Default cards |
| Standard | 16px | 75% | `backdrop-blur-[16px] bg-[--homepage-surface]/75` | Elevated cards, browser frame |
| Strong | 20px | 85% | `backdrop-blur-[20px] bg-[--homepage-surface]/85` | Featured/highlighted cards |
| Navigation | `md` | 50-80% | `backdrop-blur-md bg-background/50` | Sticky header |
| Cards | `xl` | varies | `backdrop-blur-xl bg-white/5` | How-it-works, bento cards |

### 8.2 GlassCard Component

Three variants:

```
default:  backdrop-blur-[12px] bg-[--homepage-surface]/60
elevated: backdrop-blur-[16px] bg-[--homepage-surface]/75
featured: backdrop-blur-[20px] bg-[--homepage-surface]/85 border-[--homepage-accent]/20
```

### 8.3 Safari Fallback

```css
@supports not (backdrop-filter: blur(1px)) {
  .glass-element {
    background: var(--homepage-surface); /* solid fallback */
  }
}
```

---

## 9. Animation System

### 9.1 Library & Setup

- **Library**: `motion/react` (Framer Motion)
- **Loading**: `LazyMotion` with deferred feature loading via `MotionProvider`
- **Reduced motion**: `MotionConfig reducedMotion="user"` — respects `prefers-reduced-motion`

### 9.2 Standard Scroll Animation

The default reveal animation used on most sections:

```typescript
// AnimateOnScroll component
initial: { opacity: 0, y: 24 }
animate: { opacity: 1, y: 0 }
duration: 0.6
ease: [0, 0.71, 0.2, 1.01]  // custom spring-like
viewport: { once: true, amount: 0.2 }
```

### 9.3 Hero Stagger

```typescript
container: { staggerChildren: 0.15, delayChildren: 0.1 }
child: {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }
}
```

### 9.4 Card Hover

Spring-based physics for interactive cards:

```typescript
whileHover: {
  y: -4,
  boxShadow: `0 8px 30px rgba(color, 0.25)`,
  borderColor: `rgba(color, 0.5)`
}
transition: { type: "spring", stiffness: 400, damping: 20 }
```

### 9.5 Icon Float

Subtle floating animation for feature icons:

```typescript
animate: { y: [0, -3, 0] }
transition: { duration: 3 + index * 0.4, repeat: Infinity, ease: "easeInOut" }
```

### 9.6 CSS Keyframe Animations

| Name | Duration | Effect | Usage |
|------|----------|--------|-------|
| `fade-up` | 0.5s | opacity + translateY up | General reveal |
| `fade-down` | 0.5s | opacity + translateY down | Reverse reveal |
| `accordion-down` | 0.2s ease-out | height 0 → full | FAQ expand |
| `accordion-up` | 0.2s ease-out | height full → 0 | FAQ collapse |
| `glowPulse` | 2.5s infinite | opacity + scale + shadow | Browser frame glow |
| `borderRotate` | 3.5s linear infinite | conic-gradient rotation | Browser frame border |
| `marquee-left` | 45s linear infinite | translateX 0 → -50% | Presentation showcase |
| `marquee-right` | 50s linear infinite | translateX -50% → 0 | Presentation showcase |

### 9.7 Statistics Count-Up

Numbers count from 0 to target value over 2 seconds when scrolled into view.

### 9.8 Feature Tab Auto-Advance

Progress line animates from 0% to 100% width over 6 seconds per tab, then auto-advances to the next tab. Uses `bg-[#24a9e0]` accent color.

### 9.9 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

[data-marketing] [class*="animate-"] {
  /* Force-disabled for reduced motion */
}
```

---

## 10. Iconography

### 10.1 System

- **Library**: Lucide React
- **Style**: Outlined, consistent 24px grid
- **Stroke width**: 2px (default), 1.5px for smaller sizes
- **Color**: `currentColor` (inherits from text)

### 10.2 Sizes

| Token | Size | Usage |
|-------|------|-------|
| `size-3` | 12px | Inline indicators |
| `size-4` | 16px | Buttons, compact UI |
| `size-5` | 20px | Standard buttons |
| `size-6` | 24px | Default icons |
| `size-8` | 32px | Feature cards |
| `size-12` | 48px | Marketing hero icons |

### 10.3 Marketing Icon Containers

Feature icons sit inside colored containers:

```
h-11 w-11 rounded-xl
backgroundColor: rgba(accent-color, 0.12)
```

With optional float animation (see 9.5).

---

## 11. Breakpoints

| Token | Value | Target |
|-------|-------|--------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet portrait |
| `lg` | 1024px | Tablet landscape / small desktop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Large desktop |

**Approach**: Mobile-first. Base styles are mobile, breakpoints add complexity upward.

---

## 12. Component Patterns

### 12.1 Section Structure (Marketing)

Every marketing section follows this anatomy:

```tsx
<section className="bg-black py-12 sm:py-16 md:py-20 lg:py-28">
  <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
    {/* Section heading */}
    <h2 className="text-h3 sm:text-h2 mb-4 sm:mb-6 text-center text-foreground">
      {title}
    </h2>

    {/* Section subtitle */}
    <p className="mx-auto mb-10 sm:mb-14 max-w-4xl text-center text-lg sm:text-xl leading-relaxed text-muted-foreground">
      {subtitle}
    </p>

    {/* Section content */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
      {content}
    </div>
  </div>
</section>
```

### 12.2 Section Divider

Radial gradient horizontal rule between sections:

```tsx
<div style={{
  background: "radial-gradient(ellipse at center, var(--homepage-border, #2a2a3a) 0%, transparent 70%)"
}} className="h-px" />
```

### 12.3 Grid Lines

Fixed vertical lines at container edges (decorative):

```
fixed inset-0 z-[5]
bg-white/[0.06]  (6% white opacity)
dark:block only
```

### 12.4 Buttons

**Primary CTA** (marketing):
```
bg-primary text-primary-foreground
h-12 rounded-xl px-4 text-base font-medium
min-h-[44px] w-full sm:w-auto
hover:shadow-2xl dark:shadow-primary/30 transition-all
```

**Secondary/Outline** (marketing):
```
variant="outline"
border border-input bg-background hover:bg-accent
h-12 rounded-xl px-4 text-base font-medium
```

### 12.5 Bento Feature Cards

```
rounded-xl bg-white/5 p-6 sm:p-8 backdrop-blur-md
border: 1px solid rgba(accent-color, 0.2)

Hover: y: -4, boxShadow: 0 8px 30px rgba(color, 0.25)
Cursor glow: radial-gradient overlay following mouse position
```

### 12.6 How-It-Works Cards

```
rounded-2xl bg-white/5 pt-8 px-5 pb-5 backdrop-blur-xl
border: 1px solid rgba(step-color, 0.25)

Step badge: -top-4, h-8 w-8 rounded-full, linear-gradient(135deg, color, color@70%)
```

### 12.7 Testimonial Carousel

- Quote text: `text-lg sm:text-xl md:text-2xl font-light leading-relaxed text-muted-foreground`
- Highlighted words: `font-semibold text-foreground`
- Signature: `font-script text-3xl sm:text-4xl text-foreground`
- Navigation: `rounded-full border border-border p-2 sm:p-3`
- Dot indicators: active = `w-6 h-1.5 bg-foreground`, inactive = `w-1.5 h-1.5 bg-border`

### 12.8 FAQ Accordion

Standard shadcn Accordion:
```
type="single" collapsible
trigger: text-left text-base font-medium
content: text-muted-foreground text-base leading-relaxed
animation: accordion-down/up 0.2s ease-out
```

### 12.9 Sticky Header

```
sticky top-0 z-10
dark:bg-black (marketing) / bg-background/80 backdrop-blur-md (app)
h-14 (56px)
grid-cols-3: logo | navigation | actions
```

### 12.10 Footer

```
bg-black border-t border-white/10
4-column grid at md:grid-cols-4
Column dividers: absolute bg-white/10
Link colors: dark:text-white/70 dark:hover:text-white
```

---

## 13. Interaction States

### 13.1 State Definitions

| State | Treatment |
|-------|-----------|
| Default | Base appearance |
| Hover | `y: -4` lift, increased border opacity, glow shadow |
| Focus | `2px solid #24a9e0, offset 3px, shadow 0 0 0 4px rgba(36,169,224,0.25)` |
| Active | `scale(0.98)` press effect |
| Disabled | `opacity: 0.5, cursor: not-allowed` |
| Loading | `animate-pulse bg-muted rounded-md` skeleton |

### 13.2 Marketing Focus Ring

```css
[data-marketing] *:focus-visible {
  outline: 2px solid #24a9e0;
  outline-offset: 3px;
  box-shadow: 0 0 0 4px rgba(36, 169, 224, 0.25);
}
```

### 13.3 App Focus Ring

```css
*:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: 2px;
}
```

---

## 14. Accessibility

### 14.1 Color Contrast

| Context | Minimum Ratio | Standard |
|---------|--------------|----------|
| Body text on dark bg | 4.5:1 | WCAG AA |
| Large text (18px+) | 3:1 | WCAG AA |
| Interactive elements | 3:1 | WCAG AA |
| Target (ideal) | 7:1 | WCAG AAA |

`--homepage-accent-contrast` (`#0f7ea8`) exists specifically for WCAG AA compliance when accent text appears on dark backgrounds.

### 14.2 Motion

- All Framer Motion animations: disabled when `prefers-reduced-motion: reduce`
- CSS animations: forced to `0.01ms` duration
- `MotionConfig reducedMotion="user"` wraps entire app

### 14.3 Touch Targets

Minimum 44x44px for all interactive elements (WCAG 2.5.5):
```css
min-h-[44px] min-w-[44px]
```

### 14.4 Screen Reader Support

- `aria-hidden="true"` on all decorative elements (grid lines, orbs, dividers, marquee)
- `sr-only` descriptions on carousel/showcase sections
- ARIA roles: `tablist/tab/tabpanel` for feature tabs, `role="list"` for grids
- Skip-to-content link: `bg-[--homepage-accent]`, visible on focus

### 14.5 Skeleton Loading

All async sections use Suspense with structural skeletons:
```
animate-pulse bg-muted dark:bg-muted rounded-md
```
Skeletons match the exact dimensions and layout of real content.

---

## 15. Implementation Reference

### 15.1 Key Files

| Purpose | Path |
|---------|------|
| Homepage | `apps/web/app/(marketing)/page.tsx` |
| Marketing layout | `apps/web/app/(marketing)/layout.tsx` |
| Root layout | `apps/web/app/layout.tsx` |
| Global styles | `apps/web/styles/globals.css` |
| Theme tokens | `apps/web/styles/theme.css` |
| shadcn UI tokens | `apps/web/styles/shadcn-ui.css` |
| Theme utilities | `apps/web/styles/theme.utilities.css` |
| Font definitions | `apps/web/lib/fonts.ts` |
| Theme config | `apps/web/lib/root-theme.ts` |

### 15.2 Marketing-Specific CSS Tokens

Defined in `globals.css` inside `[data-marketing] { }`:

```css
[data-marketing] {
  --homepage-bg: #0a0a0f;
  --homepage-surface: #12121a;
  --homepage-surface-elevated: #1a1a25;
  --homepage-border: #2a2a3a;
  --homepage-border-subtle: #1e1e2e;
  --homepage-text: #f5f5f7;
  --homepage-text-muted: #a0a0b0;
  --homepage-accent: #24a9e0;
  --homepage-accent-contrast: #0f7ea8;
  --homepage-accent-glow: rgba(36, 169, 224, 0.4);
  --homepage-gradient-accent: linear-gradient(135deg, #1e9dd0, #1a6fb5);
  --homepage-gradient-surface: linear-gradient(180deg, var(--homepage-surface), transparent);
}
```

### 15.3 Using the Design System

**When building marketing pages**: Use `data-marketing` wrapper, `--homepage-*` tokens, marketing typography scale, glass card patterns.

**When building app pages**: Use standard shadcn/ui tokens (`--background`, `--foreground`, etc.), app typography scale, standard card and component patterns.

**When choosing colors**: Use the accent spectrum array for per-index card coloring. Always apply at low opacity (12% bg, 20-25% border). Never use the raw hex at full opacity for large surfaces.

**When adding animations**: Default to the `AnimateOnScroll` pattern (opacity 0→1, y 24→0). Use spring physics for hover states. Always test with reduced motion.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-02-18 | Complete rewrite based on current homepage implementation |
| 1.0.0 | 2026-01-28 | Initial design system (outdated) |
