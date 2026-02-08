# Context7 Research: Recharts RadarChart and RadialBarChart

**Date**: 2026-02-03
**Agent**: alpha-context7
**Spec Directory**: .ai/alpha/specs/pending-Spec-user-dashboard
**Libraries Researched**: recharts/recharts (latest)

## Query Summary

Researched Recharts library documentation for:
1. RadarChart component props and configuration (spider diagrams)
2. RadialBarChart for circular progress indicators
3. Responsive chart containers
4. Theming and dark mode support
5. Empty state handling for charts with no data
6. Animation options

## Findings

### 1. RadarChart (Spider Diagram)

The RadarChart component visualizes multivariate data in a radar/spider chart format, ideal for comparing multiple variables across categories.

#### Key Components

| Component | Purpose |
|-----------|---------|
| `RadarChart` | Container component |
| `Radar` | Data series visualization |
| `PolarGrid` | Grid lines for the radar |
| `PolarAngleAxis` | Category labels around the perimeter |
| `PolarRadiusAxis` | Value scale from center to edge |
| `Legend` | Data series legend |
| `Tooltip` | Interactive data display |

#### RadarChart Props

```typescript
interface RadarChartProps {
  cx?: string | number;       // Center X position (default: "50%")
  cy?: string | number;       // Center Y position (default: "50%")
  outerRadius?: string | number; // Outer radius (default: "80%")
  innerRadius?: string | number; // Inner radius (default: 0)
  data: Array<object>;        // Data array
  margin?: { top, right, bottom, left }; // Chart margins
}
```

#### Radar (Data Series) Props

```typescript
interface RadarProps {
  dataKey: string;            // Key for data values
  name?: string;              // Legend display name
  stroke?: string;            // Line color
  fill?: string;              // Fill color
  fillOpacity?: number;       // Fill transparency (0-1)
  dot?: boolean | object;     // Show data points
  activeDot?: object;         // Active data point styling
  isAnimationActive?: boolean;
  animationDuration?: number;
  animationEasing?: string;
}
```

#### Complete Example

```tsx
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface SkillData {
  subject: string;
  score: number;
  fullMark: number;
}

const data: SkillData[] = [
  { subject: 'Content', score: 85, fullMark: 100 },
  { subject: 'Design', score: 72, fullMark: 100 },
  { subject: 'Delivery', score: 90, fullMark: 100 },
  { subject: 'Engagement', score: 68, fullMark: 100 },
  { subject: 'Structure', score: 78, fullMark: 100 },
  { subject: 'Confidence', score: 82, fullMark: 100 }
];

function SkillsSpiderChart({ data }: { data: SkillData[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis angle={90} domain={[0, 100]} />
        <Radar
          name="Skills"
          dataKey="score"
          stroke="#8884d8"
          fill="#8884d8"
          fillOpacity={0.6}
        />
        <Tooltip />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}
```

### 2. RadialBarChart (Circular Progress)

RadialBarChart displays data as concentric circular bars, perfect for progress indicators and percentage visualizations.

#### Key Components

| Component | Purpose |
|-----------|---------|
| `RadialBarChart` | Container component |
| `RadialBar` | Circular bar segment |
| `Legend` | Data legend |
| `Tooltip` | Interactive tooltips |

#### RadialBarChart Props

```typescript
interface RadialBarChartProps {
  cx?: string | number;       // Center X (default: "50%")
  cy?: string | number;       // Center Y (default: "50%")
  innerRadius?: string | number; // Inner radius (default: "10%")
  outerRadius?: string | number; // Outer radius (default: "80%")
  barSize?: number;           // Thickness of bars
  data: Array<object>;        // Data array with fill colors
  startAngle?: number;        // Start angle in degrees
  endAngle?: number;          // End angle in degrees
}
```

#### RadialBar Props

```typescript
interface RadialBarProps {
  dataKey: string;            // Value key
  minAngle?: number;          // Minimum angle for small values
  background?: boolean | object; // Show background track
  clockWise?: boolean;        // Direction of fill
  label?: boolean | object;   // Label configuration
  isAnimationActive?: boolean;
  animationDuration?: number;
  animationEasing?: string;
}
```

#### Complete Example - Course Progress

```tsx
import {
  RadialBarChart,
  RadialBar,
  Legend,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface ProgressData {
  name: string;
  progress: number;
  fill: string;
}

const courseProgress: ProgressData[] = [
  { name: 'Module 1', progress: 100, fill: '#82ca9d' },
  { name: 'Module 2', progress: 85, fill: '#8884d8' },
  { name: 'Module 3', progress: 45, fill: '#ffc658' },
  { name: 'Module 4', progress: 0, fill: '#ff8042' }
];

function CourseProgressChart({ data }: { data: ProgressData[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadialBarChart
        cx="50%"
        cy="50%"
        innerRadius="20%"
        outerRadius="90%"
        barSize={15}
        data={data}
        startAngle={180}
        endAngle={0}
      >
        <RadialBar
          minAngle={15}
          label={{ position: 'insideStart', fill: '#fff' }}
          background={{ fill: '#e0e0e0' }}
          clockWise
          dataKey="progress"
        />
        <Legend
          iconSize={10}
          layout="vertical"
          verticalAlign="middle"
          align="right"
        />
        <Tooltip />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}
```

#### Single Progress Ring Example

```tsx
// Simple circular progress indicator
function SingleProgressRing({ value, max = 100, color = '#8884d8' }) {
  const data = [{ name: 'Progress', value, fill: color }];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadialBarChart
        cx="50%"
        cy="50%"
        innerRadius="60%"
        outerRadius="80%"
        barSize={20}
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <RadialBar
          background={{ fill: '#f0f0f0' }}
          dataKey="value"
          cornerRadius={10}
        />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}
```

### 3. ResponsiveContainer

Essential wrapper for responsive charts that adapt to parent container dimensions.

#### Props

```typescript
interface ResponsiveContainerProps {
  width?: string | number;    // Container width (default: "100%")
  height?: string | number;   // Container height (required number or %)
  aspect?: number;            // Width/height ratio (alternative to height)
  minWidth?: number;          // Minimum width
  minHeight?: number;         // Minimum height
  debounce?: number;          // Resize debounce delay (ms)
  onResize?: (width: number, height: number) => void;
  initialDimension?: { width: number; height: number }; // SSR fallback
}
```

#### Usage Patterns

```tsx
// Fixed height (most common)
<ResponsiveContainer width="100%" height={400}>
  <RadarChart data={data}>...</RadarChart>
</ResponsiveContainer>

// Aspect ratio constraint
<ResponsiveContainer width="100%" aspect={1.5}>
  <RadialBarChart data={data}>...</RadialBarChart>
</ResponsiveContainer>

// SSR-safe with initial dimensions (Next.js)
<ResponsiveContainer
  width="100%"
  height={400}
  initialDimension={{ width: 520, height: 400 }}
>
  <RadarChart data={data}>...</RadarChart>
</ResponsiveContainer>

// With resize callback and debounce
<ResponsiveContainer
  width="100%"
  height={400}
  debounce={300}
  onResize={(width, height) => console.log(`Resized to ${width}x${height}`)}
>
  <LineChart data={data}>...</LineChart>
</ResponsiveContainer>
```

### 4. Theming and Dark Mode Support

Recharts uses inline styles and SVG attributes for styling. Dark mode support requires explicit color configuration.

#### Approach 1: CSS Variables (Recommended for Tailwind)

```tsx
// Define colors using CSS variables
const chartColors = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  muted: 'hsl(var(--muted))',
  border: 'hsl(var(--border))',
  text: 'hsl(var(--foreground))',
  background: 'hsl(var(--background))'
};

function ThemedRadarChart({ data }) {
  return (
    <RadarChart data={data}>
      <PolarGrid stroke={chartColors.border} />
      <PolarAngleAxis
        dataKey="subject"
        tick={{ fill: chartColors.text }}
      />
      <PolarRadiusAxis
        angle={90}
        tick={{ fill: chartColors.muted }}
      />
      <Radar
        dataKey="score"
        stroke={chartColors.primary}
        fill={chartColors.primary}
        fillOpacity={0.6}
      />
    </RadarChart>
  );
}
```

#### Approach 2: Theme Hook

```tsx
import { useTheme } from 'next-themes';

function useChartColors() {
  const { resolvedTheme } = useTheme();

  return {
    text: resolvedTheme === 'dark' ? '#e5e7eb' : '#374151',
    grid: resolvedTheme === 'dark' ? '#374151' : '#e5e7eb',
    primary: resolvedTheme === 'dark' ? '#818cf8' : '#6366f1',
    background: resolvedTheme === 'dark' ? '#1f2937' : '#f9fafb'
  };
}

function DarkModeChart({ data }) {
  const colors = useChartColors();

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={data}>
        <PolarGrid stroke={colors.grid} />
        <PolarAngleAxis tick={{ fill: colors.text }} />
        <Radar
          dataKey="value"
          stroke={colors.primary}
          fill={colors.primary}
          fillOpacity={0.5}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
```

### 5. Empty State Handling

Recharts renders empty SVG containers when data is empty. Implement conditional rendering for better UX.

#### Pattern: Wrapper Component

```tsx
interface ChartWrapperProps {
  data: unknown[];
  emptyMessage?: string;
  children: React.ReactNode;
}

function ChartWrapper({
  data,
  emptyMessage = 'No data available',
  children
}: ChartWrapperProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-muted/20 rounded-lg border border-dashed">
        <div className="text-center text-muted-foreground">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return children;
}

// Usage
function SkillsChart({ skills }) {
  return (
    <ChartWrapper
      data={skills}
      emptyMessage="Complete an assessment to see your skills"
    >
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={skills}>
          {/* ... */}
        </RadarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}
```

#### Pattern: Skeleton Loading

```tsx
function ChartSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-[400px] bg-muted rounded-lg" />
    </div>
  );
}

function AsyncChart({ isLoading, data, error }) {
  if (isLoading) return <ChartSkeleton />;
  if (error) return <ChartError error={error} />;
  if (!data?.length) return <ChartEmpty />;

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={data}>
        {/* ... */}
      </RadarChart>
    </ResponsiveContainer>
  );
}
```

### 6. Animation Options

All chart components support animation configuration.

#### Animation Props (Common to all components)

```typescript
interface AnimationProps {
  isAnimationActive?: boolean;  // Enable/disable animations (default: true)
  animationBegin?: number;      // Delay before animation starts (ms)
  animationDuration?: number;   // Animation length (ms, default: 1500)
  animationEasing?: AnimationTiming; // Easing function
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
}

type AnimationTiming =
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'linear';
```

#### Example: Controlled Animation

```tsx
import { useState } from 'react';

function AnimatedRadarChart({ data }) {
  const [animationKey, setAnimationKey] = useState(0);

  const replayAnimation = () => {
    setAnimationKey(prev => prev + 1);
  };

  return (
    <div>
      <button onClick={replayAnimation}>Replay Animation</button>
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={data} key={animationKey}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis />
          <Radar
            dataKey="score"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
            isAnimationActive={true}
            animationDuration={2000}
            animationEasing="ease-in-out"
            animationBegin={0}
            onAnimationStart={() => console.log('Animation started')}
            onAnimationEnd={() => console.log('Animation ended')}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

#### Disable Animation (Performance)

```tsx
// For reduced motion preference or performance
function StaticChart({ data }) {
  return (
    <RadarChart data={data}>
      <Radar
        dataKey="value"
        isAnimationActive={false}
      />
    </RadarChart>
  );
}

// Respect user preference
import { useReducedMotion } from '@/hooks/use-reduced-motion';

function AccessibleChart({ data }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <RadarChart data={data}>
      <Radar
        dataKey="value"
        isAnimationActive={!prefersReducedMotion}
        animationDuration={prefersReducedMotion ? 0 : 1500}
      />
    </RadarChart>
  );
}
```

## Key Takeaways

1. **RadarChart Structure**: Requires `RadarChart` container with `PolarGrid`, `PolarAngleAxis`, `PolarRadiusAxis`, and `Radar` components for proper visualization

2. **RadialBarChart for Progress**: Use `innerRadius`/`outerRadius` percentages, `barSize` for thickness, and `startAngle`/`endAngle` for arc control. Set `background` prop for track visualization

3. **Always Use ResponsiveContainer**: Wrap all charts in `ResponsiveContainer` with explicit `height` (number or percentage). Use `initialDimension` for SSR/Next.js

4. **Dark Mode**: Pass CSS variables or computed colors to `stroke`, `fill`, and `tick.fill` props. Consider creating a theme hook for consistency

5. **Empty States**: Implement conditional rendering wrapper - Recharts renders empty SVG when data is empty/undefined

6. **Animation Control**: Use `isAnimationActive`, `animationDuration`, and `animationEasing` props. Respect `prefers-reduced-motion` for accessibility

7. **Data Shape**: RadarChart expects array with label key and numeric value keys. RadialBarChart expects array with `fill` color in each data item

## Code Examples

### Production-Ready Skills Spider Chart

```tsx
'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface SkillScore {
  skill: string;
  score: number;
  maxScore: number;
}

interface SkillsSpiderChartProps {
  data: SkillScore[];
  isLoading?: boolean;
  className?: string;
}

export function SkillsSpiderChart({
  data,
  isLoading,
  className
}: SkillsSpiderChartProps) {
  if (isLoading) {
    return (
      <div className="h-[300px] animate-pulse bg-muted rounded-lg" />
    );
  }

  if (!data?.length) {
    return (
      <div className="flex items-center justify-center h-[300px] border border-dashed rounded-lg">
        <p className="text-muted-foreground text-sm">
          Complete an assessment to view your skills
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.5}
            isAnimationActive={true}
            animationDuration={1000}
            animationEasing="ease-out"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### Production-Ready Course Progress Radial

```tsx
'use client';

import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis
} from 'recharts';

interface CourseProgressProps {
  completed: number;
  total: number;
  isLoading?: boolean;
  className?: string;
}

export function CourseProgressRadial({
  completed,
  total,
  isLoading,
  className
}: CourseProgressProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const data = [{
    name: 'Progress',
    value: percentage,
    fill: 'hsl(var(--primary))'
  }];

  if (isLoading) {
    return (
      <div className="h-[200px] w-[200px] animate-pulse bg-muted rounded-full" />
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={200}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="90%"
          barSize={12}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background={{ fill: 'hsl(var(--muted))' }}
            dataKey="value"
            cornerRadius={10}
            isAnimationActive={true}
            animationDuration={1000}
          />
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground text-2xl font-bold"
          >
            {percentage}%
          </text>
        </RadialBarChart>
      </ResponsiveContainer>
      <p className="text-center text-sm text-muted-foreground mt-2">
        {completed} of {total} lessons completed
      </p>
    </div>
  );
}
```

## Sources

- Recharts via Context7 (recharts/recharts)
- Storybook documentation examples
- Context7 llms.txt documentation
- GitHub wiki (axis-domains-and-ticks, 3.0-migration-guide)
