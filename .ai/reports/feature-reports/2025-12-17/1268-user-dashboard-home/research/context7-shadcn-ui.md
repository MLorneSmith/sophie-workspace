# Context7 Research: shadcn/ui Charts

**Library**: shadcn-ui/ui
**Topic**: charts radial radar progress
**Date**: 2025-12-17

## Key Findings

### Chart Configuration Pattern

```tsx
import { type ChartConfig } from "@/components/ui/chart"

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "#2563eb",
  },
  mobile: {
    label: "Mobile",
    color: "#60a5fa",
  },
} satisfies ChartConfig
```

### ChartContainer Usage

```tsx
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

export function MyChart() {
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
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
```

### Progress Component

```tsx
import { Progress } from "@/components/ui/progress"

<Progress value={33} />
```

### Theme Color Integration

CSS variables for chart colors:
```css
@layer base {
  :root {
    --chart-1: oklch(0.646 0.222 41.116);
    --chart-2: oklch(0.6 0.118 184.704);
    /* ... */
  }
  .dark {
    --chart-1: oklch(0.488 0.243 264.376);
    /* ... */
  }
}
```

Using in components:
```tsx
<Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
<LabelList className="fill-[--color-desktop]" />
```

### Legend and Tooltip Components

```tsx
import { ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

<ChartLegend content={<ChartLegendContent />} />
<ChartTooltip content={<ChartTooltipContent />} />
```

## Codebase Integration Notes

The project already has:
- `@kit/ui/chart` - ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent
- `@kit/ui/progress` - Progress component
- Recharts installed as dependency

Existing chart usage in `/apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`:
```tsx
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
```

This is the pattern to follow for all dashboard charts.
