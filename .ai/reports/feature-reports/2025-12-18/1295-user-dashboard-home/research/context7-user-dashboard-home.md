# Context7 Research: User Dashboard Home

## shadcn/ui Chart Components

### Chart Integration with Recharts

The shadcn/ui library provides a `ChartContainer` component that wraps Recharts components:

```tsx
import { Bar, BarChart, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

export function MyChart() {
  return (
    <ChartContainer>
      <BarChart data={data}>
        <Bar dataKey="value" />
        <ChartTooltip content={<ChartTooltipContent />} />
      </BarChart>
    </ChartContainer>
  )
}
```

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

### Available Chart Components

- `ChartContainer` - Wrapper with theming support
- `ChartTooltip` + `ChartTooltipContent` - Interactive tooltips
- `ChartLegend` + `ChartLegendContent` - Legend display
- CSS variables: `--chart-1` through `--chart-5` for theming

### Accessibility Layer

```tsx
<LineChart accessibilityLayer />
```

## Recharts Patterns

### Radar Chart (Spider Diagram)

```jsx
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

const data = [
  { subject: 'Math', A: 120, B: 110, fullMark: 150 },
  { subject: 'Chinese', A: 98, B: 130, fullMark: 150 },
  // ...
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
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}
```

### Bar Chart with Cell Customization

```jsx
import { BarChart, Bar, Cell } from 'recharts';

const getColorByStatus = (status) => {
  switch (status) {
    case 'success': return '#00C49F';
    case 'warning': return '#FFBB28';
    case 'error': return '#FF8042';
    default: return '#8884d8';
  }
};

<Bar dataKey="value">
  {data.map((entry, index) => (
    <Cell key={`cell-${index}`} fill={getColorByStatus(entry.status)} />
  ))}
</Bar>
```

### Radial/Circular Progress

For radial progress charts, use `RadialBarChart` from Recharts or custom SVG circles.

## Key Patterns from Codebase

### Existing RadarChart Implementation

From `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`:

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

const chartConfig = {
  score: {
    label: "Score",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const chartData = Object.entries(categoryScores).map(([category, score]) => ({
  category,
  score,
}));

<ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
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
```

### Custom Radial Progress

From `apps/web/app/home/(user)/course/_components/RadialProgress.tsx`:

```tsx
export function RadialProgress({ value, size = 40, strokeWidth = 4 }: RadialProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90 transform" width={size} height={size}>
        <title>Course Progress: {value.toFixed(1)}% complete</title>
        <circle className="text-muted-foreground/20" strokeWidth={strokeWidth} ... />
        <circle
          className="text-primary transition-all duration-300"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          ...
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
        {Math.round(value)}%
      </div>
    </div>
  );
}
```

## Dashboard Charts Example

From `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx`:

- Uses `LineChart`, `AreaChart`, `BarChart` from Recharts
- Wrapped in shadcn `Card` components
- Gradient fills with unique IDs (useId pattern)
- ChartContainer with ChartConfig for theming
