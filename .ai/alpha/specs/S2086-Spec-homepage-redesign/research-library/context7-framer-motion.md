# Context7 Research: Framer Motion / Motion for React -- Homepage Redesign Patterns

**Date**: 2026-02-13
**Agent**: alpha-context7
**Spec Directory**: .ai/alpha/specs/pending-Spec-homepage-redesign
**Libraries Researched**: motion (motion.dev) via websites/motion_dev, websites/llms_motion_dev

## Query Summary

Researched Framer Motion (now rebranded as "Motion") patterns for a Next.js 16 homepage redesign. Focused on scroll-triggered animations, stagger patterns, number counting animations, text reveals, parallax effects, performance best practices, Next.js App Router compatibility, and sticky scroll patterns.

**Important Note**: Framer Motion has been rebranded to **Motion**. The package is now `motion` (not `framer-motion`). Imports come from `motion/react` for React projects. The project does not currently have motion installed.

## Installation

```bash
pnpm add motion
```

Import pattern for React:
```typescript
import { motion } from "motion/react"
```

---

## Findings

### 1. Scroll-Triggered Animations (useInView, whileInView, viewport)

Motion provides two primary approaches for scroll-triggered animations:

#### A. Declarative: `whileInView` prop

The simplest approach -- animate when element enters viewport:

```tsx
"use client"

import { motion } from "motion/react"

// Basic fade-in on scroll
function FadeInSection({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}
```

**viewport prop options**:
- `once: true` -- animate only on first entry (recommended for homepage sections)
- `root` -- custom scrollable container ref (default: browser window)
- `margin` -- expand/shrink detection area (e.g., `"0px -20px -50px 0px"`)
- `amount` -- how much element must be visible: `"some"`, `"all"`, or number 0-1

```tsx
<motion.section
  initial={{ opacity: 0 }}
  whileInView={{ opacity: 1 }}
  viewport={{ once: true, amount: 0.3, margin: "0px 0px -100px 0px" }}
/>
```

#### B. Imperative: `useInView` hook

For more control (conditional logic, combining with other hooks):

```tsx
"use client"

import { useRef } from "react"
import { useInView } from "motion/react"

function StatSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })

  return (
    <div ref={ref}>
      {isInView && <AnimatedCounter target={1000} />}
    </div>
  )
}
```

**useInView options**:
- `once: boolean` -- stop observing after first entry
- `root: RefObject` -- custom scroll container
- `margin: string` -- IntersectionObserver rootMargin
- `amount: "some" | "all" | number` -- visibility threshold
- `initial: boolean` -- if true, returns true before measurement (prevents FOUC)

#### C. Combined: `useAnimate` + `useInView`

For complex multi-element animations triggered by scroll:

```tsx
"use client"

import { useAnimate, useInView } from "motion/react"
import { useEffect } from "react"

function AnimatedList() {
  const [scope, animate] = useAnimate()
  const isInView = useInView(scope, { once: true })

  useEffect(() => {
    if (isInView) {
      animate("li", { opacity: 1, y: 0 }, { delay: stagger(0.1) })
    }
  }, [isInView])

  return (
    <ul ref={scope}>
      <li style={{ opacity: 0, transform: "translateY(20px)" }} />
      <li style={{ opacity: 0, transform: "translateY(20px)" }} />
      <li style={{ opacity: 0, transform: "translateY(20px)" }} />
    </ul>
  )
}
```

---

### 2. Stagger Animations (staggerChildren, delayChildren)

Two approaches: variant-based (declarative) and imperative stagger.

#### A. Variants with staggerChildren (Recommended for card grids)

```tsx
"use client"

import { motion } from "motion/react"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", visualDuration: 0.4, bounce: 0.2 },
  },
}

function FeatureGrid({ features }: { features: Feature[] }) {
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {features.map((feature, i) => (
        <motion.div key={feature.id} variants={itemVariants}>
          <FeatureCard feature={feature} />
        </motion.div>
      ))}
    </motion.div>
  )
}
```

#### B. Variant Orchestration Options

```typescript
const orchestratedVariants = {
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",     // parent animates first, then children
      staggerChildren: 0.3,       // delay between each child
      staggerDirection: 1,        // 1 = forward, -1 = reverse
      delayChildren: 0.5,         // initial delay before first child
    },
  },
  hidden: {
    opacity: 0,
    transition: {
      when: "afterChildren",      // children animate first, then parent
    },
  },
}
```

#### C. Imperative stagger with `animate` + `stagger()`

```tsx
import { stagger, animate } from "motion"

// Basic stagger
animate("li", { opacity: 1 }, { delay: stagger(0.1) })

// Stagger from center
animate(".card", { opacity: 1, y: 0 }, { delay: stagger(0.1, { from: "center" }) })

// Stagger from last element
animate(".card", { opacity: 1, y: 0 }, { delay: stagger(0.1, { from: "last" }) })

// Stagger with startDelay
stagger(0.1, { startDelay: 0.2 }) // delays: 0.2, 0.3, 0.4...

// Stagger with custom easing
stagger(0.1, { ease: "easeOut" })
stagger(0.1, { ease: [.32, .23, .4, .9] })
```

#### D. Dynamic variants with `custom` prop (index-based delay)

```tsx
const itemVariants = {
  hidden: { opacity: 0 },
  visible: (index: number) => ({
    opacity: 1,
    transition: { delay: index * 0.2 },
  }),
}

function StaggeredList({ items }: { items: string[] }) {
  return (
    <motion.ul initial="hidden" whileInView="visible">
      {items.map((item, i) => (
        <motion.li key={item} custom={i} variants={itemVariants}>
          {item}
        </motion.li>
      ))}
    </motion.ul>
  )
}
```

---

### 3. Number Counting Animations

Three approaches, from simplest to most custom:

#### A. AnimateNumber Component (Motion+ / paid)

```tsx
import { AnimateNumber } from "motion-plus/react"

function Counter({ value }: { value: number }) {
  return (
    <AnimateNumber
      transition={{
        layout: { duration: 0.3 },
        y: { type: "spring", visualDuration: 0.4, bounce: 0.2 },
        opacity: { ease: "linear" },
      }}
    >
      {value}
    </AnimateNumber>
  )
}
```

**Note**: AnimateNumber requires the `motion-plus` package (paid Motion+ subscription).

#### B. animate() with onUpdate (Free -- Recommended)

```tsx
"use client"

import { useRef, useEffect } from "react"
import { animate } from "motion"
import { useInView } from "motion/react"

function CountUp({ target, duration = 2 }: { target: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView || !ref.current) return

    const controls = animate(0, target, {
      duration,
      onUpdate: (latest) => {
        if (ref.current) {
          ref.current.textContent = Math.round(latest).toLocaleString()
        }
      },
    })

    return () => controls.stop()
  }, [isInView, target, duration])

  return <span ref={ref}>0</span>
}
```

#### C. useMotionValue + useTransform (Free -- Reactive)

```tsx
"use client"

import { useEffect } from "react"
import { motion, useMotionValue, useTransform, animate } from "motion/react"
import { useInView } from "motion/react"

function AnimatedStat({ value, label }: { value: number; label: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString())

  useEffect(() => {
    if (isInView) {
      animate(count, value, { duration: 2 })
    }
  }, [isInView, count, value])

  return (
    <div ref={ref}>
      <motion.span>{rounded}</motion.span>
      <p>{label}</p>
    </div>
  )
}
```

---

### 4. Text Reveal Animations

#### A. Word-by-Word Reveal with Variants

```tsx
"use client"

import { motion } from "motion/react"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const wordVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", visualDuration: 0.4, bounce: 0.15 },
  },
}

function TextReveal({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ")

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          variants={wordVariants}
          style={{ display: "inline-block", marginRight: "0.25em" }}
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  )
}
```

#### B. Letter-by-Letter Reveal

```tsx
"use client"

import { motion } from "motion/react"

const letterVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.03 },
  }),
}

function LetterReveal({ text }: { text: string }) {
  return (
    <motion.h1 initial="hidden" whileInView="visible" viewport={{ once: true }}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          custom={i}
          variants={letterVariants}
          style={{ display: "inline-block" }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.h1>
  )
}
```

#### C. Line-by-Line Reveal (for paragraphs)

```tsx
"use client"

import { motion } from "motion/react"

function LineReveal({ lines }: { lines: string[] }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={{
        visible: { transition: { staggerChildren: 0.15 } },
      }}
    >
      {lines.map((line, i) => (
        <motion.p
          key={i}
          variants={{
            hidden: { opacity: 0, x: -30 },
            visible: { opacity: 1, x: 0 },
          }}
        >
          {line}
        </motion.p>
      ))}
    </motion.div>
  )
}
```

---

### 5. Parallax Scroll Effects (useScroll, useTransform)

#### A. Basic Parallax with useScroll + useTransform

```tsx
"use client"

import { motion, useScroll, useTransform } from "motion/react"

function ParallaxHero() {
  const { scrollY } = useScroll()

  // Move background slower than scroll (parallax effect)
  const y = useTransform(scrollY, [0, 500], [0, -150])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])

  return (
    <div className="relative h-screen overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{ y, opacity, backgroundImage: "url('/hero-bg.jpg')" }}
      />
      <div className="relative z-10">
        <h1>SlideHeroes</h1>
      </div>
    </div>
  )
}
```

#### B. Element-Scoped Scroll Progress

```tsx
"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "motion/react"

function ParallaxSection() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"], // when element enters/leaves viewport
  })

  const y = useTransform(scrollYProgress, [0, 1], [100, -100])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8])
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0])

  return (
    <section ref={ref} className="relative min-h-screen">
      <motion.div style={{ y, scale, opacity }}>
        <h2>Feature Section</h2>
      </motion.div>
    </section>
  )
}
```

#### C. useTransform with Multiple Outputs (Named Map)

```tsx
const { scrollYProgress } = useScroll({ target: ref })

const { opacity, scale, filter } = useTransform(scrollYProgress, [0, 0.5, 1], {
  opacity: [0, 1, 0.4],
  scale: [0.8, 1, 0.6],
  filter: ["blur(0px)", "blur(0px)", "blur(10px)"],
})
```

#### D. useTransform with Function (Custom Logic)

```tsx
const { scrollY } = useScroll()
const distance = 100
const y = useTransform(() => Math.sin(scrollY.get() / 500) * distance)
```

#### E. Perpetual Mapping (clamp: false)

```tsx
// Rotate element continuously based on scroll position
const rotate = useTransform(scrollY, [0, 100], [0, 360], { clamp: false })
// When scroll reaches 200px, rotation will be 720deg (continues beyond range)
```

#### F. Accessibility: Disable Parallax for Reduced Motion

```tsx
"use client"

import { motion, useScroll, useTransform, useReducedMotion } from "motion/react"

function AccessibleParallax() {
  const shouldReduceMotion = useReducedMotion()
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, -150], { clamp: false })

  return (
    <motion.div style={{ y: shouldReduceMotion ? 0 : y }} />
  )
}
```

---

### 6. Performance Best Practices

#### A. Hardware Acceleration

```tsx
// NOT hardware accelerated (uses CSS variables internally):
animate(".box", { x: 100, scale: 2 })

// HARDWARE ACCELERATED (uses CSS transform directly):
animate(".box", { transform: "translateX(100px) scale(2)" })

// For motion components, prefer transform string for performance-critical animations:
<motion.li
  initial={{ transform: "translateX(-100px)" }}
  animate={{ transform: "translateX(0px)" }}
  transition={{ type: "spring" }}
/>
```

#### B. Motion Values (Avoid Re-renders)

Motion values update styles without triggering React re-renders:

```tsx
const x = useMotionValue(0)

useEffect(() => {
  // This does NOT trigger a re-render
  const timeout = setTimeout(() => x.set(100), 1000)
  return () => clearTimeout(timeout)
}, [])

return <motion.div style={{ x }} />
```

#### C. Layout Animation Optimization

```tsx
// Only measure layout when dependency changes (saves CPU):
<motion.nav layout layoutDependency={isOpen} />

// For scrollable containers:
<motion.div layoutScroll style={{ overflow: "scroll" }}>
  <motion.div layout />
</motion.div>

// For fixed containers:
<motion.div layoutRoot style={{ position: "fixed" }}>
  <motion.div layout />
</motion.div>
```

#### D. LazyMotion (Reduce Bundle Size)

The full `motion` component preloads all features (~34KB). Use `LazyMotion` to reduce:

```tsx
// features.ts
import { domMax } from "motion/react"
export default domMax

// layout.tsx or provider
"use client"

import { LazyMotion } from "motion/react"
import * as m from "motion/react-m"  // slimmer component

const loadFeatures = () => import("./features").then((res) => res.default)

function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures}>
      {children}
    </LazyMotion>
  )
}

// Usage (use `m` instead of `motion`):
<m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
```

Feature bundles:
- `domAnimation` -- basic animations, gestures, exit animations
- `domMax` -- everything including layout animations, drag, etc.

Use `strict` prop to enforce `m` usage:
```tsx
<LazyMotion features={loadFeatures} strict>
  {/* Using <motion.div> here will throw an error */}
</LazyMotion>
```

#### E. Scroll Animation Performance

Hardware-accelerated scroll animations using the `scroll()` function:
```typescript
import { animate, scroll } from "motion"

// This uses ScrollTimeline when available (hardware accelerated)
const animation = animate(element, { opacity: [0, 1] })
scroll(animation)
```

#### F. MotionConfig for Global Defaults

```tsx
import { MotionConfig } from "motion/react"

<MotionConfig transition={{ duration: 0.6 }} reducedMotion="user">
  {/* All child motion components inherit this transition */}
</MotionConfig>
```

---

### 7. Next.js App Router Compatibility

#### A. "use client" Directive (Required)

All motion components require client-side JavaScript. Mark files with `"use client"`:

```tsx
"use client"

import { motion } from "motion/react"

export default function AnimatedSection() {
  return <motion.div animate={{ scale: 1.5 }} />
}
```

#### B. Optimized Client Import (Reduces JS bundle)

For components that do not need full interactivity, import from `motion/react-client`:

```tsx
import * as motion from "motion/react-client"

export default function StaticMotionComponent() {
  return <motion.div animate={{ scale: 1.5 }} />
}
```

This approach reduces client-side JavaScript by leveraging server-side rendering for initial state.

#### C. RSC + Client Component Architecture

**Pattern**: Keep data-fetching in Server Components, wrap interactive parts in Client Components.

```tsx
// page.tsx (Server Component - no "use client")
async function HomePage() {
  const features = await loadFeatures()
  const stats = await loadStats()

  return (
    <>
      <HeroSection />          {/* Client Component */}
      <FeatureGrid features={features} />  {/* Client Component */}
      <StatsSection stats={stats} />       {/* Client Component */}
    </>
  )
}

// _components/hero-section.tsx (Client Component)
"use client"
import { motion } from "motion/react"

export function HeroSection() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Hero content */}
    </motion.section>
  )
}
```

#### D. Server-Side Spring CSS (Zero JS)

For simple hover effects that do not need JS:

```tsx
import { spring } from "motion"

// Server Component - no "use client" needed
function Button() {
  return (
    <button style={{ transition: "all " + spring() }}>
      Hover me
    </button>
  )
}
```

#### E. Server-Side Rendering Compatibility

Motion components render their initial state on the server:

```tsx
// Server will output `translateX(100px)` in the HTML
<motion.div initial={false} animate={{ x: 100 }} />
```

---

### 8. Sticky Scroll Patterns

Motion does not have a dedicated "sticky scroll" component, but you can build sticky scroll-linked animations using `useScroll` + `useTransform` with CSS `position: sticky`.

#### A. Sticky Section with Scroll-Linked Animation

```tsx
"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "motion/react"

function StickyScrollSection() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  // Map scroll progress to different states
  const activeStep = useTransform(scrollYProgress, [0, 0.33, 0.66, 1], [0, 1, 2, 3])
  const opacity1 = useTransform(scrollYProgress, [0, 0.2, 0.33], [1, 1, 0])
  const opacity2 = useTransform(scrollYProgress, [0.2, 0.4, 0.66], [0, 1, 0])
  const opacity3 = useTransform(scrollYProgress, [0.5, 0.7, 1], [0, 1, 1])

  return (
    <div ref={containerRef} className="relative h-[300vh]">
      <div className="sticky top-0 h-screen flex items-center">
        <div className="relative w-full">
          <motion.div style={{ opacity: opacity1 }} className="absolute inset-0">
            <h2>Step 1: Create</h2>
          </motion.div>
          <motion.div style={{ opacity: opacity2 }} className="absolute inset-0">
            <h2>Step 2: Design</h2>
          </motion.div>
          <motion.div style={{ opacity: opacity3 }} className="absolute inset-0">
            <h2>Step 3: Present</h2>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
```

#### B. Sticky Scroll with Progress Bar

```tsx
"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "motion/react"

function StickyWithProgress() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1])
  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    ["#3b82f6", "#8b5cf6", "#ec4899"]
  )

  return (
    <div ref={containerRef} className="relative h-[400vh]">
      <div className="sticky top-0">
        <motion.div
          className="h-1 origin-left"
          style={{ scaleX, backgroundColor }}
        />
      </div>
      {/* Scrollable content sections */}
    </div>
  )
}
```

#### C. Sticky Image/Phone Mockup with Content Swap

```tsx
"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "motion/react"

function StickyProductShowcase() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, -200])
  const rotate = useTransform(scrollYProgress, [0, 0.5, 1], [0, 5, -5])

  return (
    <div ref={containerRef} className="relative h-[300vh]">
      <div className="sticky top-20 flex gap-12">
        {/* Sticky visual */}
        <motion.div className="w-1/2" style={{ y, rotate }}>
          <img src="/product-mockup.png" alt="Product" />
        </motion.div>

        {/* Scrolling content */}
        <div className="w-1/2 space-y-[100vh]">
          <div className="h-screen flex items-center">
            <p>Feature description 1</p>
          </div>
          <div className="h-screen flex items-center">
            <p>Feature description 2</p>
          </div>
          <div className="h-screen flex items-center">
            <p>Feature description 3</p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## useScroll API Reference

```typescript
const { scrollX, scrollY, scrollXProgress, scrollYProgress } = useScroll({
  // Track a specific element's scroll position in the viewport
  target?: RefObject<HTMLElement>,

  // Track a specific scrollable container's scroll position
  container?: RefObject<HTMLElement>,

  // Define the scroll offsets that map to 0-1 progress
  // Format: ["start end", "end start"]
  // First value: target element edge + viewport edge where progress = 0
  // Second value: target element edge + viewport edge where progress = 1
  offset?: [string, string],
})
```

**Return values**:
- `scrollX` / `scrollY` -- absolute scroll position in pixels (MotionValue)
- `scrollXProgress` / `scrollYProgress` -- 0-1 progress between offsets (MotionValue)

**Common offset patterns**:
- `["start end", "end start"]` -- track element from entering to leaving viewport
- `["start start", "end end"]` -- track element from top of viewport to bottom
- `["start start", "end start"]` -- track while element is at top of viewport
- `["start 0.5", "end 0.5"]` -- track relative to viewport center

---

## Key Takeaways

- **Package**: Install `motion` (not `framer-motion`). Import from `motion/react`.
- **"use client"**: All motion components require the `"use client"` directive in Next.js App Router.
- **RSC pattern**: Keep data fetching in Server Components; wrap animated UI in Client Components.
- **whileInView + viewport={{ once: true }}**: Simplest scroll-triggered animation for homepage sections.
- **Variants + staggerChildren**: Best pattern for animating card grids and feature lists.
- **animate(0, target, { onUpdate })**: Free approach for number counting animations.
- **useScroll + useTransform**: Core hooks for parallax and scroll-linked animations.
- **useReducedMotion**: Always respect user preference for reduced motion.
- **LazyMotion + domAnimation**: Reduce bundle size by lazy-loading motion features.
- **Hardware acceleration**: Use `transform` string values for best GPU performance.
- **layoutDependency**: Optimize layout animations by only measuring when dependencies change.
- **CSS spring()**: Use server-side spring CSS for simple hover effects without JS overhead.
- **Sticky scroll**: Combine CSS `position: sticky` with `useScroll({ offset })` for scroll-linked sticky sections.

## Code Examples

### Recommended Homepage Animation Provider

```tsx
// apps/web/app/(marketing)/_components/motion-provider.tsx
"use client"

import { LazyMotion, MotionConfig } from "motion/react"

const loadFeatures = () =>
  import("./motion-features").then((res) => res.default)

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadFeatures} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  )
}

// apps/web/app/(marketing)/_components/motion-features.ts
import { domMax } from "motion/react"
export default domMax
```

### Recommended Reusable Animation Wrapper

```tsx
// apps/web/app/(marketing)/_components/animate-on-scroll.tsx
"use client"

import { motion, type Variants } from "motion/react"

interface AnimateOnScrollProps {
  children: React.ReactNode
  className?: string
  variants?: Variants
  delay?: number
}

const defaultVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export function AnimateOnScroll({
  children,
  className,
  variants = defaultVariants,
  delay = 0,
}: AnimateOnScrollProps) {
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay, ease: [0, 0.71, 0.2, 1.01] }}
    >
      {children}
    </motion.div>
  )
}
```

## Sources

- Motion for React via Context7 (websites/motion_dev)
- Motion LLM docs via Context7 (websites/llms_motion_dev)
- Motion official docs: https://motion.dev/docs
