# Context7 Research: Recharts RadialBarChart and RadarChart

**Date**: 2026-01-29
**Agent**: alpha-context7
**Spec Directory**: .ai/alpha/specs/pending-Spec-user-dashboard
**Libraries Researched**: recharts/recharts

## Query Summary

Researched Recharts documentation for dashboard visualization components:
1. RadialBarChart component API and customization options
2. RadarChart (spider diagram) configuration
3. Responsive chart sizing in React
4. Empty state handling patterns for charts with no data

## Findings

### RadialBarChart Component

The RadialBarChart displays data as circular bars radiating from a center point, ideal for showing proportional data or progress indicators.

**Key Props:**
- `cx`, `cy` - Center position (e.g., "50%", "50%")
- `innerRadius` - Inner radius (e.g., "10%")
- `outerRadius` - Outer radius (e.g., "80%")
- `barSize` - Thickness of each bar
- `data` - Array of data objects with `name`, value, and `fill` properties

**RadialBar Sub-component Props:**
- `minAngle` - Minimum angle for small values (ensures visibility)
- `label` - Label configuration with position and styling
- `background` - Shows background track for each bar
- `clockWise` - Direction of bar rendering
- `dataKey` - Field name for the value

**Complete Example:**
```jsx
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

**Dashboard Use Cases:**
- Skill level indicators (0-100%)
- Course completion progress
- Category distribution comparisons
- Goal progress tracking

### RadarChart (Spider Diagram) Component

RadarChart displays multivariate data on axes starting from the same point, ideal for comparing entities across multiple dimensions.

**Key Components:**
- `RadarChart` - Container component
- `PolarGrid` - Circular grid lines
- `PolarAngleAxis` - Labels around the perimeter (categories)
- `PolarRadiusAxis` - Radial scale (values)
- `Radar` - The actual data shape

**RadarChart Props:**
- `cx`, `cy` - Center position
- `outerRadius` - Maximum radius
- `data` - Array of data objects

**Radar Sub-component Props:**
- `name` - Series name for legend
- `dataKey` - Field name for values
- `stroke` - Line color
- `fill` - Fill color
- `fillOpacity` - Transparency (0-1)

**Complete Example:**
```jsx
import React from 'react';
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

**Dashboard Use Cases:**
- Skills assessment visualization
- Multi-dimensional performance metrics
- Before/after comparisons
- Competency mapping

### ResponsiveContainer

ResponsiveContainer wraps charts to make them automatically adapt to parent container dimensions.

**Key Props:**
- `width` - Width value (use "100%" for responsive)
- `height` - Height value (pixels or percentage)
- `aspect` - Width/height ratio (alternative to fixed height)
- `debounce` - Delay in ms before resize callback fires
- `onResize` - Callback function `(width, height) => void`
- `initialDimension` - SSR fallback dimensions `{ width, height }`

**SSR Support Example:**
```jsx
<ResponsiveContainer
  width="100%"
  height={400}
  initialDimension={{ width: 520, height: 400 }}
>
  <LineChart {...args}>
    <Line dataKey="uv" />
  </LineChart>
</ResponsiveContainer>
```

**Aspect Ratio Example:**
```jsx
<ResponsiveContainer width="100%" aspect={2}>
  <RadarChart data={data}>
    {/* chart contents */}
  </RadarChart>
</ResponsiveContainer>
```

**With Resize Callback:**
```jsx
<ResponsiveContainer
  width="100%"
  height={400}
  debounce={300}
  onResize={(width, height) => console.log(`Chart resized to ${width}x${height}`)}
>
  <RadialBarChart data={data}>
    {/* chart contents */}
  </RadialBarChart>
</ResponsiveContainer>
```

### Empty State Handling

Recharts does not have built-in empty state handling. The recommended pattern is to wrap charts with conditional rendering.

**Recommended Pattern:**
```tsx
interface ChartProps {
  data: DataItem[];
}

function SkillRadarChart({ data }: ChartProps) {
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        <div className="text-center">
          <Icon className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-2">No skill data available</p>
          <p className="text-sm">Complete courses to build your skill profile</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={data}>
        {/* chart contents */}
      </RadarChart>
    </ResponsiveContainer>
  );
}
```

**Minimum Data Validation:**
```tsx
// RadarChart needs at least 3 points to form a meaningful shape
const MIN_RADAR_POINTS = 3;

function validateRadarData(data: DataItem[]): boolean {
  return data.length >= MIN_RADAR_POINTS &&
         data.every(item => typeof item.value === 'number');
}

// RadialBarChart can work with any number of items
function validateRadialData(data: DataItem[]): boolean {
  return data.length > 0 &&
         data.every(item => typeof item.value === 'number' && item.value >= 0);
}
```

### Customization Patterns

**Custom Tooltip:**
```jsx
function CustomTooltip({ payload, label, active }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border rounded-md p-2 shadow-md">
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground">
          {`${payload[0].name}: ${payload[0].value}`}
        </p>
      </div>
    );
  }
  return null;
}

// Usage
<Tooltip content={<CustomTooltip />} />
```

**Custom Colors with Tailwind:**
```tsx
const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  accent: 'hsl(var(--accent))',
  muted: 'hsl(var(--muted))',
};

// Or use specific colors
const SKILL_COLORS = [
  '#8884d8', // purple
  '#83a6ed', // light blue
  '#8dd1e1', // cyan
  '#82ca9d', // green
  '#a4de6c', // light green
  '#d0ed57', // yellow-green
  '#ffc658', // orange
];
```

## Key Takeaways

1. **RadialBarChart** is ideal for showing progress/completion data with individual bars radiating from center
2. **RadarChart** excels at displaying multi-dimensional comparisons (skills, performance metrics)
3. **Always wrap charts in ResponsiveContainer** for responsive layouts
4. **Use initialDimension** for SSR/Next.js to prevent layout shifts
5. **Empty states must be handled manually** - wrap charts with conditional rendering
6. **Data validation is important** - RadarChart needs 3+ points for meaningful visualization
7. **Both charts support Legend and Tooltip** for interactivity

## Dashboard Implementation Recommendations

### Skills Radar Chart
```tsx
// For user dashboard skill visualization
const skillData = [
  { skill: 'Structure', value: 85, fullMark: 100 },
  { skill: 'Story', value: 70, fullMark: 100 },
  { skill: 'Style', value: 60, fullMark: 100 },
  { skill: 'Substance', value: 75, fullMark: 100 },
  { skill: 'Self-Confidence', value: 50, fullMark: 100 },
];

<ResponsiveContainer width="100%" height={300}>
  <RadarChart data={skillData}>
    <PolarGrid />
    <PolarAngleAxis dataKey="skill" />
    <PolarRadiusAxis domain={[0, 100]} />
    <Radar
      dataKey="value"
      stroke="hsl(var(--primary))"
      fill="hsl(var(--primary))"
      fillOpacity={0.5}
    />
  </RadarChart>
</ResponsiveContainer>
```

### Course Progress Radial Chart
```tsx
// For showing course completion progress
const progressData = [
  { name: 'Completed', value: 65, fill: 'hsl(var(--success))' },
  { name: 'In Progress', value: 20, fill: 'hsl(var(--warning))' },
  { name: 'Not Started', value: 15, fill: 'hsl(var(--muted))' },
];

<ResponsiveContainer width="100%" height={200}>
  <RadialBarChart
    cx="50%"
    cy="50%"
    innerRadius="30%"
    outerRadius="100%"
    barSize={20}
    data={progressData}
  >
    <RadialBar dataKey="value" background />
    <Legend />
  </RadialBarChart>
</ResponsiveContainer>
```

## Sources

- recharts/recharts via Context7 (latest version)
  - RadialBarChart documentation
  - RadarChart documentation
  - ResponsiveContainer documentation
  - Customization patterns
