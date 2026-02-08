# Context7 Research: Framer Motion Scroll-Triggered Animations

**Date**: 2026-02-04
**Agent**: alpha-context7
**Spec Directory**: `.ai/alpha/specs/pending-Spec-homepage-redesign`
**Libraries Researched**: Motion (Framer Motion) for React

## Query Summary

Researched scroll-triggered animations and viewport detection patterns for Next.js 15 using Motion (formerly Framer Motion). Topics covered:
1. useInView hook for intersection observer patterns
2. Scroll-triggered number counter animations (count-up effect)
3. Staggered animation with whileInView
4. Best practices for scroll-linked animations in React 19
5. Performance optimization for scroll animations
6. viewport prop configuration

## Findings

### 1. useInView Hook for Intersection Observer Patterns

The `useInView` hook provides a React-friendly wrapper around the Intersection Observer API. It returns a boolean indicating whether an element is visible in the viewport.

#### Basic Usage

```typescript
import { useRef } from "react";
import { useInView } from "motion/react";

function Component() {
  const ref = useRef(null);
  const isInView = useInView(ref);

  return <div ref={ref} />;
}
```

#### Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `once` | boolean | If `true`, stops observing after first intersection |
| `root` | HTMLElement | Scrollable ancestor to detect intersections with (instead of window) |
| `margin` | string | Margin around viewport for detection (e.g., `"0px 100px -50px 0px"`) |
| `amount` | `"some"` \| `"all"` \| number | Threshold for visibility (0-1 or keywords) |
| `initial` | boolean | Initial value before measurement |

#### Once Option (Fire Only Once)

```typescript
import { useRef } from "react";
import { useInView } from "motion/react";

function Component() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return <div ref={ref} />;
}
```

#### Custom Scroll Container

```typescript
import { useRef } from "react";
import { useInView } from "motion/react";

function Carousel() {
  const container = useRef(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { root: container });

  return (
    <div ref={container} style={{ overflow: "scroll" }}>
      <div ref={ref} />
    </div>
  );
}
```

#### Margin for Early/Late Detection

```typescript
import { useRef } from "react";
import { useInView } from "motion/react";

function Component() {
  const ref = useRef(null);
  // Trigger 100px before element enters viewport
  const isInView = useInView(ref, {
    margin: "0px 100px -50px 0px"
  });

  return <div ref={ref} />;
}
```

#### Amount Threshold

```typescript
import { useRef } from "react";
import { useInView } from "motion/react";

function Component() {
  const ref = useRef(null);
  // Only trigger when entire element is visible
  const isInView = useInView(ref, { amount: "all" });
  // Or use a number (0.5 = 50% visible)
  // const isInView = useInView(ref, { amount: 0.5 });

  return <div ref={ref} />;
}
```

### 2. Scroll-Triggered Number Counter Animations

Motion provides the `AnimateNumber` component (from Motion+) for animated counters.

#### Basic AnimateNumber Usage

```tsx
import { AnimateNumber } from "motion-plus/react"

function Counter() {
  const [count, setCount] = useState(0)

  return (
    <>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <AnimateNumber>{count}</AnimateNumber>
    </>
  )
}
```

#### Custom Count-Up with useInView and useSpring

For more control, combine `useInView` with `useSpring` and `useMotionValue`:

```tsx
import { useRef, useEffect } from "react";
import { useInView, useMotionValue, useSpring, motion } from "motion/react";

function CountUpNumber({ target, duration = 2 }: { target: number; duration?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 100,
    damping: 30,
  });

  useEffect(() => {
    if (isInView) {
      motionValue.set(target);
    }
  }, [isInView, target, motionValue]);

  return (
    <motion.span ref={ref}>
      {springValue}
    </motion.span>
  );
}
```

#### Using useTransform for Formatted Numbers

```tsx
import { useRef, useEffect } from "react";
import { useInView, useMotionValue, useSpring, useTransform } from "motion/react";

function FormattedCounter({ target }: { target: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const springCount = useSpring(count, { stiffness: 100, damping: 30 });
  const displayValue = useTransform(springCount, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    if (isInView) {
      count.set(target);
    }
  }, [isInView, target, count]);

  return <motion.span ref={ref}>{displayValue}</motion.span>;
}
```

### 3. Staggered Animation with whileInView

#### Basic whileInView Usage

```tsx
// Simple opacity animation when in viewport
<motion.div whileInView={{ opacity: 1 }} />

// With variant name
<motion.div whileInView="visible" />
```

#### Staggered Children with Variants

```tsx
import { motion, stagger } from "motion/react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      delayChildren: stagger(0.1), // Stagger by 0.1s
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -100 },
  visible: { opacity: 1, x: 0 },
};

function StaggeredList() {
  return (
    <motion.ul
      initial="hidden"
      whileInView="visible"
      variants={containerVariants}
      viewport={{ once: true }}
    >
      <motion.li variants={itemVariants} />
      <motion.li variants={itemVariants} />
      <motion.li variants={itemVariants} />
    </motion.ul>
  );
}
```

#### Stagger Direction Options

```tsx
const transition = {
  // Stagger from last element
  delayChildren: stagger(0.1, { from: "last" })

  // Or from center
  // delayChildren: stagger(0.1, { from: "center" })

  // Or from specific index
  // delayChildren: stagger(0.1, { from: 2 })
}
```

#### Dynamic Variants with Custom Prop

For index-based staggering without the `stagger` function:

```tsx
const variants = {
  hidden: { opacity: 0 },
  visible: (index: number) => ({
    opacity: 1,
    transition: { delay: index * 0.1 }
  })
};

function DynamicStagger({ items }: { items: string[] }) {
  return (
    <motion.ul initial="hidden" whileInView="visible">
      {items.map((item, index) => (
        <motion.li
          key={item}
          custom={index}
          variants={variants}
        >
          {item}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

### 4. Best Practices for Scroll-Linked Animations in React 19

#### Viewport Prop Configuration

```tsx
<motion.section
  whileInView={{ opacity: 1 }}
  viewport={{
    once: true,        // Don't re-trigger on leave/enter
    amount: 0.5,       // Trigger when 50% visible
    margin: "-100px",  // Trigger 100px before entering
  }}
/>
```

#### Viewport Callbacks

```tsx
<motion.div
  onViewportEnter={(entry) => {
    console.log("Entered viewport", entry.isIntersecting);
  }}
  onViewportLeave={(entry) => {
    console.log("Left viewport", entry.intersectionRect);
  }}
/>
```

#### Combining useAnimate with useInView for Complex Animations

```tsx
import { useAnimate, useInView } from "motion/react";
import { useEffect } from "react";

function ComplexScrollAnimation() {
  const [scope, animate] = useAnimate();
  const isInView = useInView(scope, { once: true, amount: 0.3 });

  useEffect(() => {
    if (isInView) {
      // Sequential animations
      const sequence = async () => {
        await animate(scope.current, { opacity: 1 });
        await animate("li", { opacity: 1, x: 0 }, { delay: stagger(0.1) });
      };
      sequence();
    }
  }, [isInView, animate, scope]);

  return (
    <ul ref={scope} style={{ opacity: 0 }}>
      <li style={{ opacity: 0, x: -50 }} />
      <li style={{ opacity: 0, x: -50 }} />
      <li style={{ opacity: 0, x: -50 }} />
    </ul>
  );
}
```

### 5. Performance Optimization for Scroll Animations

#### Use MotionValues to Avoid Re-renders

```tsx
import { useMotionValue, motion } from "motion/react";
import { useEffect } from "react";

function PerformantAnimation() {
  const x = useMotionValue(0);

  useEffect(() => {
    // Updates without triggering React re-render
    const timeout = setTimeout(() => x.set(100), 1000);
    return () => clearTimeout(timeout);
  }, [x]);

  return <motion.div style={{ x }} />;
}
```

#### Hardware-Accelerated Transforms

```tsx
// Prefer transform properties for GPU acceleration
<motion.li
  initial={{ transform: "translateX(-100px)" }}
  animate={{ transform: "translateX(0px)" }}
  transition={{ type: "spring" }}
/>
```

#### Layout Animation Optimization

```tsx
// Use layoutDependency to control when layout measurements occur
<motion.nav layout layoutDependency={isOpen} />
```

#### Next.js App Router Optimized Import

```tsx
// For better tree-shaking in Next.js App Router
import * as motion from "motion/react-client";

export default function MyComponent() {
  return <motion.div animate={{ scale: 1.5 }} />;
}
```

#### Reduced Motion Support

```tsx
import { useReducedMotion, MotionConfig } from "motion/react";

// Automatic handling
export function App({ children }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
    </MotionConfig>
  );
}

// Manual handling
function Sidebar({ isOpen }) {
  const shouldReduceMotion = useReducedMotion();

  const animate = isOpen
    ? shouldReduceMotion ? { opacity: 1 } : { x: 0 }
    : shouldReduceMotion ? { opacity: 0 } : { x: "-100%" };

  return <motion.div animate={animate} />;
}
```

### 6. Viewport Prop Configuration

#### Complete Viewport Options Reference

```typescript
interface ViewportOptions {
  // Stop observing after first intersection
  once?: boolean;

  // Scrollable ancestor element ref
  root?: RefObject<HTMLElement>;

  // Margin around viewport (CSS margin syntax)
  // "top right bottom left" or single value
  margin?: string;

  // Amount visible to trigger
  // "some" (default) | "all" | number (0-1)
  amount?: "some" | "all" | number;
}
```

#### Practical Examples

```tsx
// Lazy load images when 20% visible
<motion.img
  initial={{ opacity: 0 }}
  whileInView={{ opacity: 1 }}
  viewport={{ once: true, amount: 0.2 }}
/>

// Animate sections with offset
<motion.section
  initial={{ y: 50, opacity: 0 }}
  whileInView={{ y: 0, opacity: 1 }}
  viewport={{ once: true, margin: "-100px 0px" }}
  transition={{ duration: 0.6, ease: "easeOut" }}
/>

// Sticky header animation
<motion.header
  initial={{ y: -100 }}
  whileInView={{ y: 0 }}
  viewport={{ amount: "all" }}
/>
```

## Key Takeaways

- **useInView hook** is the primary tool for intersection observer patterns; supports `once`, `root`, `margin`, and `amount` options
- **AnimateNumber** from motion-plus provides built-in counter animations; for custom counters, use `useSpring` + `useMotionValue`
- **whileInView prop** enables declarative scroll-triggered animations; combine with `viewport` prop for fine-tuning
- **Stagger animations** use `delayChildren: stagger(duration)` in transition config with variant propagation
- **Performance**: Use MotionValues to avoid re-renders, prefer transform properties for GPU acceleration, use `layoutDependency` to optimize layout measurements
- **Next.js optimization**: Import from `motion/react-client` for better tree-shaking in App Router
- **Accessibility**: Use `MotionConfig` with `reducedMotion="user"` for automatic reduced motion handling

## Complete Scroll-Triggered Section Example

```tsx
"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform, stagger } from "motion/react";

// Counter component with scroll trigger
function CountUpStat({ value, label }: { value: number; label: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const count = useMotionValue(0);
  const springCount = useSpring(count, { stiffness: 50, damping: 20 });
  const display = useTransform(springCount, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    if (isInView) {
      count.set(value);
    }
  }, [isInView, value, count]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <motion.span className="text-4xl font-bold">{display}</motion.span>
      <p className="text-muted-foreground">{label}</p>
    </motion.div>
  );
}

// Staggered list component
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      delayChildren: stagger(0.15),
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 100 }
  },
};

function FeatureList({ features }: { features: string[] }) {
  return (
    <motion.ul
      initial="hidden"
      whileInView="visible"
      variants={listVariants}
      viewport={{ once: true, margin: "-50px" }}
      className="space-y-4"
    >
      {features.map((feature) => (
        <motion.li
          key={feature}
          variants={itemVariants}
          className="flex items-center gap-3"
        >
          {feature}
        </motion.li>
      ))}
    </motion.ul>
  );
}

// Usage
export function StatsSection() {
  return (
    <section className="py-20">
      <div className="grid grid-cols-3 gap-8">
        <CountUpStat value={10000} label="Users" />
        <CountUpStat value={500} label="Courses" />
        <CountUpStat value={98} label="Satisfaction %" />
      </div>

      <FeatureList features={[
        "Interactive lessons",
        "Progress tracking",
        "Certificates"
      ]} />
    </section>
  );
}
```

## Sources

- Motion (Framer Motion) React Documentation via Context7 (websites/motion_dev_react)
  - useInView Hook: https://motion.dev/docs/react/-use-in-view
  - Motion Component: https://motion.dev/docs/react/-motion-component
  - Animation: https://motion.dev/docs/react/-animation
  - Transitions: https://motion.dev/docs/react/-transitions
  - useAnimate: https://motion.dev/docs/react/-use-animate
  - useTransform: https://motion.dev/docs/react/-use-transform
  - useSpring: https://motion.dev/docs/react/-use-spring
  - AnimateNumber: https://motion.dev/docs/react/-animate-number
  - Accessibility: https://motion.dev/docs/react/-accessibility
