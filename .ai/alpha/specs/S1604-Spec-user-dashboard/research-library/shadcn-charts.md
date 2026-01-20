# Context7 Research: shadcn/ui Charts for User Dashboard

**Date**: 2026-01-19
**Agent**: alpha-context7
**Spec Directory**: .ai/alpha/specs/pending-Spec-user-dashboard
**Libraries Researched**: shadcn-ui/ui, recharts/recharts

## Query Summary

Researched shadcn/ui charts documentation focusing on:
1. Radial charts / radial progress components
2. Radar charts (spider diagrams)
3. Best practices for dashboard chart layouts

## Findings

### Overview: shadcn/ui Charts Architecture

shadcn/ui charts are built on top of **Recharts** - a React charting library built with D3. The project already has the chart component installed at `packages/ui/src/shadcn/chart.tsx`.

**Key Components Available:**
- `ChartContainer` - Wrapper that provides responsive sizing and theming
- `ChartTooltip` / `ChartTooltipContent` - Interactive tooltips
- `ChartLegend` / `ChartLegendContent` - Chart legends
- `ChartConfig` - Type-safe configuration for labels, colors, icons

### 1. Radial Charts (RadialBarChart)

Radial bar charts are ideal for showing progress or comparing values in a circular format.

**Basic Implementation:**

```tsx
import React from 'react';
import { RadialBarChart, RadialBar, Legend, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: '18-24', uv: 31.47, fill: '#8884d8' },
  { name: '25-29', uv: 26.69, fill: '#83a6ed' },
  { name: '30-34', uv: 15.69, fill: '#8dd1e1' },
  { name: '35-39', uv: 8.22, fill: '#82ca9d' },
  { name: '40-49', uv: 8.63, fill: '#a4de6c' },
  { name: '50+', uv: 2.63, fill: '#d0ed57' },
  { name: 'Unknown', uv: 6.67, fill: '#ffc658' },
];

function RadialBarChartExample() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadialBarChart
        cx="50%"
        cy="50%"
        innerRadius="10%"
        outerRadius="80%"
        barSize={10}
        data={data}
      >
        <RadialBar
          minAngle={15}
          label={{ position: 'insideStart', fill: '#fff' }}
          background
          clockWise
          dataKey="uv"
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

**Key Props for RadialBarChart:**
- `cx`, `cy` - Center position (use "50%" for centered)
- `innerRadius`, `outerRadius` - Control ring size (percentages or pixels)
- `barSize` - Thickness of each bar
- `startAngle`, `endAngle` - Control arc range (default: 0-360)

**RadialBar Props:**
- `minAngle` - Minimum angle for visibility of small values
- `background` - Show background ring
- `clockWise` - Direction of bars
- `label` - Label configuration for values

**Radial Progress Pattern (Single Value):**

For a simple progress indicator, use a single data item:

```tsx
const progressData = [
  { name: 'Progress', value: 75, fill: 'var(--chart-1)' }
];

<RadialBarChart
  cx="50%"
  cy="50%"
  innerRadius="60%"
  outerRadius="80%"
  startAngle={180}
  endAngle={0}
  data={progressData}
>
  <RadialBar dataKey="value" background cornerRadius={10} />
</RadialBarChart>
```

### 2. Radar Charts (Spider Diagrams)

Radar charts visualize multivariate data across multiple axes, ideal for skill comparisons, feature comparisons, or performance metrics.

**Basic Implementation:**

```tsx
import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer
} from 'recharts';

const data = [
  { subject: 'Math', A: 120, B: 110, fullMark: 150 },
  { subject: 'Chinese', A: 98, B: 130, fullMark: 150 },
  { subject: 'English', A: 86, B: 130, fullMark: 150 },
  { subject: 'Geography', A: 99, B: 100, fullMark: 150 },
  { subject: 'Physics', A: 85, B: 90, fullMark: 150 },
  { subject: 'History', A: 65, B: 85, fullMark: 150 }
];

function RadarChartExample() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis angle={90} domain={[0, 150]} />
        <Radar
          name="Student A"
          dataKey="A"
          stroke="#8884d8"
          fill="#8884d8"
          fillOpacity={0.6}
        />
        <Radar
          name="Student B"
          dataKey="B"
          stroke="#82ca9d"
          fill="#82ca9d"
          fillOpacity={0.6}
        />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}
```

**Key Components:**
- `PolarGrid` - Background grid lines
- `PolarAngleAxis` - Labels around the perimeter (categories)
- `PolarRadiusAxis` - Scale from center outward
- `Radar` - The actual data polygon

**Radar Props:**
- `dataKey` - Which data field to plot
- `stroke` - Line color
- `fill` - Fill color
- `fillOpacity` - Transparency (0.3-0.6 works well for overlapping)
- `dot` - Show dots at vertices (boolean or custom component)

### 3. Dashboard Chart Layout Best Practices

#### Integration with shadcn/ui

**Using ChartContainer (Recommended):**

```tsx
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { type ChartConfig } from "@/components/ui/chart";

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

function MyChart() {
  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
```

#### CSS Color Variables for Theming

```css
@layer base {
  :root {
    --chart-1: oklch(0.646 0.222 41.116);
    --chart-2: oklch(0.6 0.118 184.704);
    --chart-3: oklch(0.398 0.07 227.392);
    --chart-4: oklch(0.828 0.189 84.429);
    --chart-5: oklch(0.769 0.188 70.08);
  }

  .dark {
    --chart-1: oklch(0.488 0.243 264.376);
    --chart-2: oklch(0.696 0.17 162.48);
    --chart-3: oklch(0.769 0.188 70.08);
    --chart-4: oklch(0.627 0.265 303.9);
    --chart-5: oklch(0.645 0.246 16.439);
  }
}
```

#### Accessibility

**Always enable accessibility layer:**

```tsx
<LineChart accessibilityLayer />
<BarChart accessibilityLayer data={data} />
```

This enables keyboard navigation and screen reader support.

#### Responsive Sizing

**Always wrap charts in ResponsiveContainer:**

```tsx
<ResponsiveContainer width="100%" height={400}>
  <BarChart data={data}>
    {/* chart contents */}
  </BarChart>
</ResponsiveContainer>
```

**Or use ChartContainer which includes ResponsiveContainer:**

```tsx
<ChartContainer config={chartConfig} className="h-[200px] w-full">
  {/* chart contents */}
</ChartContainer>
```

#### Dashboard Grid Layout Patterns

**Using CSS Grid with Cards:**

```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {/* Summary cards */}
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">$45,231.89</div>
      <p className="text-xs text-muted-foreground">+20.1% from last month</p>
    </CardContent>
  </Card>

  {/* Chart spanning 2 columns */}
  <Card className="col-span-2">
    <CardHeader>
      <CardTitle>Performance Overview</CardTitle>
    </CardHeader>
    <CardContent>
      <ChartContainer config={chartConfig} className="h-[300px]">
        {/* chart */}
      </ChartContainer>
    </CardContent>
  </Card>
</div>
```

#### Chart Sizing Guidelines

| Chart Type | Recommended Height | Use Case |
|------------|-------------------|----------|
| Radial Progress | 150-200px | Single KPI indicator |
| RadialBarChart | 300-400px | Multiple category comparison |
| RadarChart | 350-450px | Multi-axis comparison |
| BarChart | 200-300px | Time series, comparisons |
| LineChart | 200-300px | Trends over time |

### 4. Sunburst Charts (Hierarchical Data)

For hierarchical data visualization:

```tsx
import { SunburstChart, ResponsiveContainer } from 'recharts';

const data = {
  name: 'Root',
  children: [
    {
      name: 'Sales',
      value: 4000,
      fill: '#8884d8',
      children: [
        { name: 'Q1', value: 1200, fill: '#8884d8' },
        { name: 'Q2', value: 1000, fill: '#83a6ed' },
      ],
    },
    // ... more children
  ],
};

function SunburstExample() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <SunburstChart
        data={data}
        dataKey="value"
        fill="#8884d8"
        startAngle={0}
        endAngle={360}
        innerRadius="20%"
        outerRadius="80%"
      />
    </ResponsiveContainer>
  );
}
```

### 5. Pie Charts (Alternative to Radial)

```tsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Group A', value: 400 },
  { name: 'Group B', value: 300 },
  { name: 'Group C', value: 300 },
  { name: 'Group D', value: 200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

function PieChartExample() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={120}
          innerRadius={60}  // Makes it a donut chart
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

## Key Takeaways

1. **Use ChartContainer** - The project's existing `@kit/ui/chart` wraps Recharts with proper theming and responsive sizing

2. **RadialBarChart for progress** - Best for showing completion percentages or comparing values in a circular format
   - Use `innerRadius` and `outerRadius` to create rings
   - `startAngle`/`endAngle` to control arc (180/0 for half-circle progress)

3. **RadarChart for multi-dimensional data** - Perfect for skill assessments or feature comparisons
   - Requires `PolarGrid`, `PolarAngleAxis`, `PolarRadiusAxis` components
   - Use `fillOpacity` (0.3-0.6) for overlapping polygons

4. **Theming** - Use CSS variables (`var(--chart-1)`, etc.) for consistent light/dark mode support

5. **Accessibility** - Always add `accessibilityLayer` prop to chart components

6. **Responsive** - Either use `ResponsiveContainer` wrapper or the project's `ChartContainer`

7. **Performance** - Charts are client components (`"use client"` directive required)

## Code Examples

### User Dashboard Progress Ring

```tsx
"use client";

import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { ChartContainer, type ChartConfig } from "@kit/ui/chart";

const chartConfig = {
  progress: {
    label: "Course Progress",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface ProgressRingProps {
  value: number; // 0-100
  label?: string;
}

export function ProgressRing({ value, label }: ProgressRingProps) {
  const data = [{ name: label || 'Progress', value, fill: 'var(--color-progress)' }];

  return (
    <ChartContainer config={chartConfig} className="h-[150px] w-[150px]">
      <RadialBarChart
        cx="50%"
        cy="50%"
        innerRadius="70%"
        outerRadius="100%"
        startAngle={90}
        endAngle={-270}
        data={data}
      >
        <RadialBar
          dataKey="value"
          background
          cornerRadius={10}
          max={100}
        />
      </RadialBarChart>
    </ChartContainer>
  );
}
```

### Skills Radar Chart

```tsx
"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer
} from 'recharts';
import { ChartContainer, type ChartConfig } from "@kit/ui/chart";

const chartConfig = {
  current: {
    label: "Current Level",
    color: "var(--chart-1)",
  },
  target: {
    label: "Target Level",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

interface SkillData {
  skill: string;
  current: number;
  target: number;
}

interface SkillsRadarProps {
  data: SkillData[];
}

export function SkillsRadar({ data }: SkillsRadarProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[350px] w-full">
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="skill" />
        <Radar
          name="Current Level"
          dataKey="current"
          stroke="var(--color-current)"
          fill="var(--color-current)"
          fillOpacity={0.5}
        />
        <Radar
          name="Target Level"
          dataKey="target"
          stroke="var(--color-target)"
          fill="var(--color-target)"
          fillOpacity={0.3}
        />
      </RadarChart>
    </ChartContainer>
  );
}
```

## Sources

- shadcn/ui (shadcn-ui/ui) via Context7
- Recharts (recharts/recharts) via Context7
- Existing project implementation: `/home/msmith/projects/2025slideheroes/packages/ui/src/shadcn/chart.tsx`
