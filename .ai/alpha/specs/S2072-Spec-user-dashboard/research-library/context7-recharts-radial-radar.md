# Context7 Research: Recharts Radial Progress Charts and Radar/Spider Diagrams

**Date**: 2026-02-12
**Agent**: alpha-context7
**Spec Directory**: /home/msmith/projects/2025slideheroes/.ai/alpha/specs/pending-Spec-user-dashboard
**Libraries Researched**: recharts/recharts

## Query Summary

Researched Recharts library for implementing:
1. Radial/circular progress charts using PieChart with innerRadius (donut charts)
2. RadarChart (spider diagrams) for skills assessment visualization
3. Responsive sizing patterns with ResponsiveContainer
4. Project's existing chart implementation patterns

## Findings

### 1. Radial/Circular Progress Charts (PieChart as Donut)

Recharts uses `PieChart` with `innerRadius` prop to create donut/radial progress charts:

```tsx
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// Radial progress chart - single value display
function RadialProgressChart({ progress }: { progress: number }) {
  const data = [
    { name: 'Completed', value: progress },
    { name: 'Remaining', value: 100 - progress },
  ];

  const COLORS = ['#8884d8', '#e0e0e0']; // Completed, Remaining

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}      // Creates the donut hole
          outerRadius={80}
          dataKey="value"
          startAngle={90}       // Start from top
          endAngle={-270}       // Go clockwise
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

**Key Props for Progress Charts:**
- `innerRadius`: Creates donut hole (e.g., 60)
- `outerRadius`: Outer edge size (e.g., 80)
- `startAngle={90}`: Start from 12 o'clock position
- `endAngle={-270}`: Clockwise full circle
- `paddingAngle`: Gap between segments (optional)

### 2. RadarChart (Spider Diagrams) for Skills Assessment

```tsx
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer
} from 'recharts';

const skillsData = [
  { skill: 'Communication', score: 85, fullMark: 100 },
  { skill: 'Leadership', score: 70, fullMark: 100 },
  { skill: 'Problem Solving', score: 90, fullMark: 100 },
  { skill: 'Teamwork', score: 80, fullMark: 100 },
  { skill: 'Creativity', score: 65, fullMark: 100 },
  { skill: 'Technical', score: 95, fullMark: 100 },
];

function SkillsSpiderDiagram() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillsData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="skill" />
        <PolarRadiusAxis angle={30} domain={[0, 100]} />
        <Radar
          name="Skills"
          dataKey="score"
          stroke="#8884d8"
          fill="#8884d8"
          fillOpacity={0.6}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
```

**Key RadarChart Components:**
- `PolarGrid`: The web-like grid lines
- `PolarAngleAxis`: Labels around the edge (categories)
- `PolarRadiusAxis`: Concentric circles with scale
- `Radar`: The filled shape representing data

**Multiple Data Series:**
```tsx
<RadarChart data={data}>
  <Radar name="Student A" dataKey="A" fill="#8884d8" fillOpacity={0.6} />
  <Radar name="Student B" dataKey="B" fill="#82ca9d" fillOpacity={0.6} />
  <Legend />
</RadarChart>
```

### 3. Project's Existing Chart Patterns (ChartContainer)

The project uses a custom `ChartContainer` wrapper from `@kit/ui/chart` that wraps Recharts with:

```tsx
// Project's existing radar chart implementation
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@kit/ui/chart";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart as RechartsRadarChart,
} from "recharts";

const chartConfig = {
  score: {
    label: "Score",
    color: "hsl(var(--chart-1))", // CSS variable for theming
  },
} satisfies ChartConfig;

function RadarChart({ categoryScores }: { categoryScores?: Record<string, number> }) {
  // Handle empty data
  if (!categoryScores || Object.keys(categoryScores).length === 0) {
    return <EmptyState />;
  }

  const chartData = Object.entries(categoryScores).map(([category, score]) => ({
    category,
    score,
  }));

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[250px]"
    >
      <RechartsRadarChart data={chartData}>
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <PolarAngleAxis dataKey="category" />
        <PolarGrid />
        <Radar
          dataKey="score"
          fill="var(--color-score)"
          fillOpacity={0.6}
        />
      </RechartsRadarChart>
    </ChartContainer>
  );
}
```

### 4. Responsive Sizing Patterns

**ResponsiveContainer Options:**
```tsx
// Full-width with fixed height
<ResponsiveContainer width="100%" height={300}>
  <Chart />
</ResponsiveContainer>

// Aspect ratio based (width/height)
<ResponsiveContainer width="100%" aspect={2}>
  <Chart />
</ResponsiveContainer>

// With min/max constraints
<ResponsiveContainer
  width="100%"
  height="100%"
  minWidth={300}
  minHeight={200}
  maxHeight={400}
>
  <Chart />
</ResponsiveContainer>

// Using ChartContainer with aspect-square (project pattern)
<ChartContainer
  config={chartConfig}
  className="mx-auto aspect-square max-h-[250px]"
>
  <Chart />
</ChartContainer>
```

### 5. Handling Empty/Zero Data Gracefully

```tsx
function RadialProgressWidget({ progress }: { progress?: number }) {
  // Early return with empty state
  if (progress === undefined || progress === null) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground">No progress data available</p>
        </CardContent>
      </Card>
    );
  }

  // Handle zero progress - show empty ring
  if (progress === 0) {
    return (
      <Card>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={[{ name: 'Empty', value: 100 }]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                dataKey="value"
                fill="#e0e0e0"
              />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-center text-muted-foreground">0% Complete</p>
        </CardContent>
      </Card>
    );
  }

  // Normal rendering with data
  return <RadialProgressChart progress={progress} />;
}
```

### 6. Styling with Tailwind CSS and CSS Variables

The project uses CSS variables for theming (supports light/dark mode):

```tsx
// ChartConfig with CSS variables
const chartConfig = {
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-1))",  // Primary chart color
  },
  remaining: {
    label: "Remaining",
    color: "hsl(var(--muted))",    // Muted/background color
  },
} satisfies ChartConfig;

// In Tailwind classes
<div className="text-muted-foreground">  {/* Secondary text */}
<div className="bg-background">          {/* Background color */}
<div className="border-border">          {/* Border color */}

// Chart container styling
<ChartContainer
  config={chartConfig}
  className="mx-auto aspect-square max-h-[250px] w-full"
>
```

**Available CSS Variables:**
- `--chart-1` through `--chart-5`: Chart color palette
- `--background`, `--foreground`: Primary colors
- `--muted`, `--muted-foreground`: Secondary colors
- `--border`: Border color

## Key Takeaways

1. **Use PieChart with innerRadius for radial progress** - This creates the donut effect perfect for showing percentage completion
2. **Use RadarChart for spider diagrams** - Ideal for skills assessment with multiple categories
3. **Leverage ChartContainer from @kit/ui/chart** - Provides theming, responsive sizing, and consistent styling
4. **Handle empty data early** - Return empty states before attempting to render charts
5. **Use CSS variables for colors** - Ensures proper light/dark mode support
6. **aspect-square works well for dashboard widgets** - Maintains 1:1 ratio for circular charts

## Code Examples

### Complete Radial Progress Widget for Dashboard

```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import { type ChartConfig, ChartContainer } from "@kit/ui/chart";
import { PieChart, Pie, Cell } from "recharts";

interface CourseProgressRadialProps {
  progress: number; // 0-100
  title?: string;
}

const chartConfig = {
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-1))",
  },
  remaining: {
    label: "Remaining",
    color: "hsl(var(--muted))",
  },
} satisfies ChartConfig;

export function CourseProgressRadial({
  progress,
  title = "Course Progress"
}: CourseProgressRadialProps) {
  // Handle edge cases
  const safeProgress = Math.max(0, Math.min(100, progress));

  const data = [
    { name: 'Completed', value: safeProgress },
    { name: 'Remaining', value: 100 - safeProgress },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[180px]"
        >
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              <Cell fill="var(--color-completed)" />
              <Cell fill="var(--color-remaining)" />
            </Pie>
          </PieChart>
        </ChartContainer>
        <p className="text-center text-2xl font-bold mt-2">
          {safeProgress}%
        </p>
      </CardContent>
    </Card>
  );
}
```

### Complete Skills Spider Diagram Widget

```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@kit/ui/chart";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

interface SkillScore {
  skill: string;
  score: number;
}

interface SkillsSpiderDiagramProps {
  skills: SkillScore[];
  title?: string;
}

const chartConfig = {
  score: {
    label: "Score",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function SkillsSpiderDiagram({
  skills,
  title = "Skills Assessment"
}: SkillsSpiderDiagramProps) {
  // Handle empty data
  if (!skills || skills.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-8">
          No skills data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadarChart data={skills}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent />}
            />
            <PolarGrid />
            <PolarAngleAxis
              dataKey="skill"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            />
            <Radar
              dataKey="score"
              fill="var(--color-score)"
              fillOpacity={0.6}
              stroke="var(--color-score)"
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```

## Sources

- Recharts via Context7 (recharts/recharts)
- Project codebase: `packages/ui/src/shadcn/chart.tsx`
- Project codebase: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
- Project codebase: `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx`
