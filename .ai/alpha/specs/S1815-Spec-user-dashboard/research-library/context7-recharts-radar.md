# Context7 Research: Recharts Radar/Spider Chart

**Date**: 2026-01-26
**Agent**: alpha-context7
**Spec Directory**: .ai/alpha/specs/pending-Spec-user-dashboard
**Libraries Researched**: recharts/recharts

## Query Summary

Researched Recharts radar/spider chart implementation for Next.js, covering:
1. RadarChart API and props
2. PolarGrid, PolarAngleAxis, PolarRadiusAxis usage
3. Styling with CSS variables
4. Responsive implementation
5. Tooltip and label customization

## Findings

### RadarChart Core Components

The RadarChart uses a polar coordinate system with three essential axis components:

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `RadarChart` | Container component | `cx`, `cy`, `outerRadius`, `data` |
| `PolarGrid` | Background grid lines | `gridType` (polygon/circle) |
| `PolarAngleAxis` | Category labels around perimeter | `dataKey`, `tick` |
| `PolarRadiusAxis` | Value scale from center | `angle`, `domain`, `tickCount` |
| `Radar` | Data visualization area | `dataKey`, `stroke`, `fill`, `fillOpacity` |

### Basic Implementation

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
  category: string;
  score: number;
  fullMark: number;
}

const data: SkillData[] = [
  { category: 'Structure', score: 85, fullMark: 100 },
  { category: 'Delivery', score: 72, fullMark: 100 },
  { category: 'Visuals', score: 90, fullMark: 100 },
  { category: 'Content', score: 78, fullMark: 100 },
  { category: 'Engagement', score: 65, fullMark: 100 },
  { category: 'Timing', score: 88, fullMark: 100 }
];

function SpiderChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="category" />
        <PolarRadiusAxis angle={90} domain={[0, 100]} />
        <Radar
          name="Score"
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

### RadarChart Props Reference

```tsx
<RadarChart
  cx="50%"           // Center X position (% or px)
  cy="50%"           // Center Y position (% or px)
  outerRadius="80%"  // Outer radius (% or px)
  innerRadius={0}    // Inner radius for donut effect
  data={data}        // Data array
  margin={{ top: 5, right: 30, bottom: 5, left: 0 }}
>
```

### PolarGrid Configuration

```tsx
// Default polygon grid
<PolarGrid />

// Circle grid (smoother appearance)
<PolarGrid gridType="circle" />

// Custom styling
<PolarGrid
  stroke="#e0e0e0"
  strokeDasharray="3 3"
/>
```

### PolarAngleAxis (Category Labels)

```tsx
// Basic usage
<PolarAngleAxis dataKey="category" />

// With custom tick styling
<PolarAngleAxis
  dataKey="category"
  tick={{ fill: '#666', fontSize: 12 }}
  tickLine={false}
/>

// Custom tick component for advanced formatting
<PolarAngleAxis
  dataKey="category"
  tick={({ payload, x, y, cx, cy }) => (
    <text
      x={x}
      y={y}
      textAnchor={x > cx ? 'start' : 'end'}
      fill="#333"
      fontSize={11}
    >
      {payload.value}
    </text>
  )}
/>
```

### PolarRadiusAxis (Value Scale)

```tsx
// Standard configuration
<PolarRadiusAxis
  angle={90}           // Angle where axis is drawn (90 = top)
  domain={[0, 100]}    // Min and max values
  tickCount={5}        // Number of tick marks
/>

// Hidden axis (cleaner look)
<PolarRadiusAxis
  angle={90}
  domain={[0, 100]}
  tick={false}
  axisLine={false}
/>

// Custom tick formatting
<PolarRadiusAxis
  angle={90}
  domain={[0, 100]}
  tickFormatter={(value) => `${value}%`}
/>
```

### Radar Component Styling

```tsx
// Single series
<Radar
  name="Current Score"
  dataKey="score"
  stroke="#8884d8"
  fill="#8884d8"
  fillOpacity={0.6}
  dot={true}              // Show data points
  activeDot={{ r: 8 }}    // Active point styling
/>

// Multiple series comparison
<Radar
  name="Before"
  dataKey="before"
  stroke="#82ca9d"
  fill="#82ca9d"
  fillOpacity={0.3}
/>
<Radar
  name="After"
  dataKey="after"
  stroke="#8884d8"
  fill="#8884d8"
  fillOpacity={0.6}
/>
```

### Styling with CSS Variables (Tailwind/shadcn Pattern)

For integration with Tailwind CSS and shadcn/ui theming:

```tsx
// Using CSS custom properties
const chartColors = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  muted: 'hsl(var(--muted))',
  border: 'hsl(var(--border))',
};

function ThemedSpiderChart({ data }: { data: SkillData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }}
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
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
          labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
```

### Custom Tooltip Implementation

```tsx
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    payload: SkillData;
  }>;
  label?: string;
}

function CustomRadarTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;

  const data = payload[0];

  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md">
      <p className="font-medium text-popover-foreground">
        {data.payload.category}
      </p>
      <p className="text-sm text-muted-foreground">
        Score: <span className="font-semibold">{data.value}%</span>
      </p>
    </div>
  );
}

// Usage
<Tooltip content={<CustomRadarTooltip />} />
```

### Responsive Implementation Patterns

```tsx
// Basic responsive wrapper
<ResponsiveContainer width="100%" height={400}>
  <RadarChart ...>
    ...
  </RadarChart>
</ResponsiveContainer>

// Aspect ratio constraint (maintains shape)
<ResponsiveContainer width="100%" aspect={1}>
  <RadarChart ...>
    ...
  </RadarChart>
</ResponsiveContainer>

// With debounce for performance
<ResponsiveContainer
  width="100%"
  height={300}
  debounce={300}
>
  <RadarChart ...>
    ...
  </RadarChart>
</ResponsiveContainer>

// Responsive with min/max height
<div className="h-[300px] min-h-[250px] max-h-[400px] w-full">
  <ResponsiveContainer width="100%" height="100%">
    <RadarChart ...>
      ...
    </RadarChart>
  </ResponsiveContainer>
</div>
```

### Mobile-Optimized Configuration

```tsx
function ResponsiveSpiderChart({ data }: { data: SkillData[] }) {
  // Adjust outer radius and font sizes for mobile
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart
        cx="50%"
        cy="50%"
        outerRadius="65%"  // Smaller for label space
        data={data}
      >
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis
          dataKey="category"
          tick={{
            fontSize: 10,  // Smaller text on mobile
            fill: 'hsl(var(--foreground))'
          }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={false}  // Hide for cleaner mobile view
          axisLine={false}
        />
        <Radar
          dataKey="score"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.5}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
```

### Label Customization

```tsx
// Labels on radar points
<Radar
  dataKey="score"
  stroke="#8884d8"
  fill="#8884d8"
  fillOpacity={0.6}
  label={{
    position: 'outside',
    fill: '#666',
    fontSize: 10,
    formatter: (value: number) => `${value}%`
  }}
/>

// Custom label component
<Radar
  dataKey="score"
  stroke="#8884d8"
  fill="#8884d8"
  fillOpacity={0.6}
  label={({ x, y, value }) => (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fill="#333"
      fontSize={10}
    >
      {value}
    </text>
  )}
/>
```

### Legend Configuration

```tsx
// Basic legend
<Legend />

// Custom positioning
<Legend
  layout="horizontal"
  verticalAlign="bottom"
  align="center"
  wrapperStyle={{ paddingTop: 20 }}
/>

// Vertical legend (sidebar style)
<Legend
  layout="vertical"
  verticalAlign="middle"
  align="right"
  iconSize={10}
  iconType="circle"
/>

// Custom legend content
<Legend
  content={({ payload }) => (
    <ul className="flex gap-4 justify-center">
      {payload?.map((entry, index) => (
        <li key={index} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm">{entry.value}</span>
        </li>
      ))}
    </ul>
  )}
/>
```

## Key Takeaways

1. **Always use ResponsiveContainer** - Wrap RadarChart for responsive behavior with width="100%" and fixed or aspect-based height

2. **PolarRadiusAxis angle** - Set to 90 to place the radius axis at the top; adjust domain to match your data range

3. **CSS variable integration** - Use `hsl(var(--css-variable))` for stroke, fill, and tick colors to match shadcn theming

4. **fillOpacity is critical** - Use 0.5-0.7 for single series, 0.3-0.4 for overlapping series to maintain visibility

5. **Mobile optimization** - Reduce outerRadius to 65-70% and hide PolarRadiusAxis ticks for cleaner mobile display

6. **Custom tooltips** - Use the `content` prop with a React component for full styling control

7. **Data structure** - Each data point needs a category key (for PolarAngleAxis) and numeric value(s) for Radar components

## Code Examples

### Complete Dashboard Spider Chart Widget

```tsx
'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface SkillAssessment {
  category: string;
  score: number;
  benchmark: number;
}

interface SpiderChartWidgetProps {
  data: SkillAssessment[];
  showBenchmark?: boolean;
}

export function SpiderChartWidget({
  data,
  showBenchmark = false
}: SpiderChartWidgetProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          cx="50%"
          cy="50%"
          outerRadius="70%"
          data={data}
        >
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="category"
            tick={{
              fontSize: 11,
              fill: 'hsl(var(--foreground))'
            }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          {showBenchmark && (
            <Radar
              name="Benchmark"
              dataKey="benchmark"
              stroke="hsl(var(--muted-foreground))"
              fill="hsl(var(--muted))"
              fillOpacity={0.3}
              strokeDasharray="4 4"
            />
          )}
          <Radar
            name="Your Score"
            dataKey="score"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.5}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0].payload as SkillAssessment;
              return (
                <div className="rounded-lg border bg-popover p-2 shadow-md">
                  <p className="font-medium">{item.category}</p>
                  <p className="text-sm text-muted-foreground">
                    Score: {item.score}%
                  </p>
                  {showBenchmark && (
                    <p className="text-sm text-muted-foreground">
                      Benchmark: {item.benchmark}%
                    </p>
                  )}
                </div>
              );
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

## Sources

- recharts/recharts via Context7 (version: latest)
- Topics: "radar chart", "tooltip customization", "styling css"
- Retrieved: 2026-01-26
