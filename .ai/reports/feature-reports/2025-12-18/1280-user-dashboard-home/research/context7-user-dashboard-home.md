# Context7 Research: shadcn/ui Charts and Recharts

## Summary

Documentation retrieved from Context7 for shadcn/ui charts and Recharts library, focused on radial, radar, and pie chart implementations.

## shadcn/ui Charts (from shadcn-ui/ui repository)

### Chart Container Pattern

The shadcn/ui chart system wraps Recharts with a theming layer using `ChartContainer` and `ChartConfig`:

```tsx
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

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

<ChartContainer config={chartConfig} className="min-h-[200px] w-full">
  <BarChart accessibilityLayer data={chartData}>
    <CartesianGrid vertical={false} />
    <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
    <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
  </BarChart>
</ChartContainer>
```

### CSS Variables for Theming

Charts use CSS custom properties for consistent theming:

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
    /* ... */
  }
}
```

### ChartConfig Structure

```tsx
import { Monitor } from "lucide-react";
import { type ChartConfig } from "@/components/ui/chart";

const chartConfig = {
  desktop: {
    label: "Desktop",
    icon: Monitor,
    color: "#2563eb", // Direct color
    // OR theme-aware colors:
    theme: {
      light: "#2563eb",
      dark: "#dc2626",
    },
  },
} satisfies ChartConfig;
```

### Accessibility Layer

Always enable accessibility on charts:

```tsx
<LineChart accessibilityLayer />
```

## Recharts Documentation

### Radar Chart (Spider Diagram)

For self-assessment survey visualization:

```jsx
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from 'recharts';

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

### Radial Bar Chart (Progress Visualization)

For course progress radial graph:

```jsx
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

### Cell Component for Individual Styling

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
    <Cell
      key={`cell-${index}`}
      fill={getColorByStatus(entry.status)}
      onClick={() => console.log(`Clicked ${entry.name}`)}
    />
  ))}
</Bar>
```

## Key Takeaways for Dashboard Implementation

1. **Use ChartContainer** - Wrap all Recharts components with shadcn/ui's `ChartContainer` for consistent theming
2. **Define ChartConfig** - Create chart configurations with labels and theme-aware colors
3. **CSS Variables** - Use `var(--color-*)` for colors that match the design system
4. **Accessibility** - Always add `accessibilityLayer` prop to chart components
5. **ResponsiveContainer** - Wrap charts for responsive sizing
6. **RadarChart** - Perfect for spider diagram showing multiple skill categories
7. **RadialBarChart** - Ideal for progress visualization with circular design
