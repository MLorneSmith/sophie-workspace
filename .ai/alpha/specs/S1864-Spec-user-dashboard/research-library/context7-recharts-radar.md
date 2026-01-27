# Context7 Research: Recharts RadarChart (Spider Chart)

**Date**: 2026-01-27
**Agent**: alpha-context7
**Spec Directory**: .ai/alpha/specs/pending-Spec-user-dashboard
**Libraries Researched**: recharts/recharts

## Query Summary

Research on Recharts RadarChart component for implementing spider/radar charts to visualize category scores. Focused on:
1. Basic RadarChart setup and usage
2. Props and configuration options
3. Responsive sizing patterns
4. Data format requirements
5. Customization for category scores visualization

## Findings

### RadarChart Overview

The RadarChart (also known as spider chart) in Recharts is used to visualize multivariate data across multiple categories on a polar coordinate system. It is ideal for comparing multiple entities across several dimensions.

**Core Components Required:**
- `RadarChart` - Container component
- `PolarGrid` - Grid lines in polar coordinates
- `PolarAngleAxis` - Labels around the chart (categories)
- `PolarRadiusAxis` - Radial axis showing values
- `Radar` - The actual data visualization (filled area)
- `ResponsiveContainer` - For responsive sizing
- `Legend` - Optional legend for multiple data series
- `Tooltip` - Optional interactive tooltips

### Data Format Requirements

The RadarChart expects an array of objects where each object represents a category (spoke of the chart):

```typescript
interface RadarDataPoint {
  subject: string;      // Category label (displayed on PolarAngleAxis)
  value: number;        // Score/value for this category
  fullMark?: number;    // Optional: maximum possible value for reference
  // Additional data keys for multiple series
  [key: string]: string | number;
}

// Example data structure
const data = [
  { subject: 'Math', A: 120, B: 110, fullMark: 150 },
  { subject: 'Chinese', A: 98, B: 130, fullMark: 150 },
  { subject: 'English', A: 86, B: 130, fullMark: 150 },
  { subject: 'Geography', A: 99, B: 100, fullMark: 150 },
  { subject: 'Physics', A: 85, B: 90, fullMark: 150 },
  { subject: 'History', A: 65, B: 85, fullMark: 150 }
];
```

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
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}
```

### Component Props Reference

#### RadarChart Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `Array` | Required | Array of data points |
| `cx` | `string \| number` | `"50%"` | X-coordinate of center |
| `cy` | `string \| number` | `"50%"` | Y-coordinate of center |
| `outerRadius` | `string \| number` | `"80%"` | Outer radius of chart |
| `innerRadius` | `string \| number` | `0` | Inner radius (for donut style) |
| `startAngle` | `number` | `90` | Starting angle in degrees |
| `endAngle` | `number` | `-270` | Ending angle in degrees |
| `margin` | `object` | `{top: 0, right: 0, bottom: 0, left: 0}` | Chart margins |

#### Radar Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `dataKey` | `string` | Required | Key in data for values |
| `name` | `string` | - | Name for legend/tooltip |
| `stroke` | `string` | `"#000"` | Line/border color |
| `fill` | `string` | `"#000"` | Fill color of the area |
| `fillOpacity` | `number` | `1` | Fill transparency (0-1) |
| `dot` | `boolean \| object \| element` | `false` | Show dots at data points |
| `activeDot` | `boolean \| object \| element` | `true` | Dot style on hover |
| `animationDuration` | `number` | `1500` | Animation duration in ms |
| `isAnimationActive` | `boolean` | `true` | Enable/disable animation |

#### PolarAngleAxis Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `dataKey` | `string` | Required | Key for category labels |
| `tick` | `boolean \| object \| element` | `true` | Custom tick component |
| `tickLine` | `boolean \| object` | `true` | Show tick lines |
| `axisLine` | `boolean \| object` | `true` | Show axis line |
| `tickFormatter` | `function` | - | Format tick labels |

#### PolarRadiusAxis Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `angle` | `number` | `0` | Angle for axis position |
| `domain` | `[min, max]` | `['auto', 'auto']` | Value range |
| `tick` | `boolean \| object \| element` | `true` | Custom tick component |
| `tickCount` | `number` | `5` | Number of ticks |
| `tickFormatter` | `function` | - | Format tick values |
| `axisLine` | `boolean \| object` | `true` | Show axis line |
| `orientation` | `"left" \| "right" \| "middle"` | `"right"` | Label position |

#### PolarGrid Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `gridType` | `"polygon" \| "circle"` | `"polygon"` | Grid shape |
| `polarAngles` | `number[]` | - | Custom angle positions |
| `polarRadius` | `number[]` | - | Custom radius positions |
| `stroke` | `string` | `"#ccc"` | Grid line color |

### Responsive Sizing

Always wrap RadarChart in ResponsiveContainer for responsive behavior:

```tsx
// Basic responsive setup
<ResponsiveContainer width="100%" height={400}>
  <RadarChart data={data}>
    {/* ... */}
  </RadarChart>
</ResponsiveContainer>

// With aspect ratio (maintains proportions)
<ResponsiveContainer width="100%" aspect={1}>
  <RadarChart data={data}>
    {/* ... */}
  </RadarChart>
</ResponsiveContainer>

// SSR-safe with initial dimensions
<ResponsiveContainer
  width="100%"
  height={400}
  initialDimension={{ width: 400, height: 400 }}
>
  <RadarChart data={data}>
    {/* ... */}
  </RadarChart>
</ResponsiveContainer>

// With resize callback and debounce
<ResponsiveContainer
  width="100%"
  height={400}
  debounce={300}
  onResize={(width, height) => console.log(`Resized: ${width}x${height}`)}
>
  <RadarChart data={data}>
    {/* ... */}
  </RadarChart>
</ResponsiveContainer>
```

### Theming and Customization

#### Custom Colors with CSS Variables (Tailwind/shadcn compatible)

```tsx
// Use CSS custom properties for theming
const chartColors = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  muted: 'hsl(var(--muted))',
  accent: 'hsl(var(--accent))',
};

<Radar
  dataKey="score"
  stroke={chartColors.primary}
  fill={chartColors.primary}
  fillOpacity={0.5}
/>
```

#### Custom Tick Component

```tsx
const CustomTick = ({ x, y, payload }: any) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="middle"
        fill="hsl(var(--foreground))"
        fontSize={12}
        fontWeight={500}
      >
        {payload.value}
      </text>
    </g>
  );
};

<PolarAngleAxis dataKey="subject" tick={<CustomTick />} />
```

#### Custom Tooltip

```tsx
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border rounded-md p-2 shadow-md">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

<Tooltip content={<CustomTooltip />} />
```

#### Hide Radius Axis for Cleaner Look

```tsx
// Option 1: Hide the axis completely
<PolarRadiusAxis tick={false} axisLine={false} />

// Option 2: Position it at a specific angle
<PolarRadiusAxis angle={30} domain={[0, 100]} />
```

### Category Scores Visualization Example

For a presentation assessment spider chart showing scores across multiple categories:

```tsx
interface AssessmentScore {
  category: string;
  score: number;
  maxScore: number;
}

const assessmentData: AssessmentScore[] = [
  { category: 'Content', score: 85, maxScore: 100 },
  { category: 'Delivery', score: 72, maxScore: 100 },
  { category: 'Visual Design', score: 90, maxScore: 100 },
  { category: 'Engagement', score: 65, maxScore: 100 },
  { category: 'Structure', score: 78, maxScore: 100 },
  { category: 'Timing', score: 88, maxScore: 100 },
];

function AssessmentRadarChart({ data }: { data: AssessmentScore[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid
          gridType="polygon"
          stroke="hsl(var(--border))"
        />
        <PolarAngleAxis
          dataKey="category"
          tick={{
            fill: 'hsl(var(--foreground))',
            fontSize: 12
          }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fontSize: 10 }}
          tickCount={5}
        />
        <Radar
          name="Score"
          dataKey="score"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.4}
          dot={{ r: 4, fill: 'hsl(var(--primary))' }}
          activeDot={{ r: 6 }}
        />
        <Tooltip
          formatter={(value: number) => [`${value}%`, 'Score']}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
```

### Multiple Data Series Comparison

```tsx
// Comparing current vs target scores
const comparisonData = [
  { category: 'Content', current: 85, target: 90 },
  { category: 'Delivery', current: 72, target: 80 },
  { category: 'Visual Design', current: 90, target: 85 },
  { category: 'Engagement', current: 65, target: 75 },
  { category: 'Structure', current: 78, target: 80 },
  { category: 'Timing', current: 88, target: 85 },
];

<RadarChart data={comparisonData}>
  <PolarGrid />
  <PolarAngleAxis dataKey="category" />
  <PolarRadiusAxis domain={[0, 100]} />
  <Radar
    name="Current"
    dataKey="current"
    stroke="#8884d8"
    fill="#8884d8"
    fillOpacity={0.5}
  />
  <Radar
    name="Target"
    dataKey="target"
    stroke="#82ca9d"
    fill="#82ca9d"
    fillOpacity={0.3}
    strokeDasharray="5 5"
  />
  <Legend />
</RadarChart>
```

### Animation Configuration

```tsx
<Radar
  dataKey="score"
  isAnimationActive={true}
  animationBegin={0}
  animationDuration={1500}
  animationEasing="ease-out"
/>
```

### Accessibility Considerations

Recharts 3.0 includes built-in accessibility features:
- Keyboard navigation is enabled by default
- Screen reader support is automatic
- Add `title` prop to RadarChart for better screen reader context

```tsx
<RadarChart
  data={data}
  title="Assessment scores across 6 categories"
>
  {/* ... */}
</RadarChart>
```

## Key Takeaways

- **Data Format**: Array of objects with category label key and numeric value key(s)
- **Always use ResponsiveContainer**: Wrap RadarChart for responsive behavior
- **PolarGrid gridType**: Use `"polygon"` for classic spider chart, `"circle"` for circular grid
- **Domain control**: Set `domain={[0, maxValue]}` on PolarRadiusAxis to control scale
- **Fill opacity**: Use `fillOpacity={0.3-0.6}` for semi-transparent filled areas
- **Multiple series**: Add multiple `<Radar>` components with different dataKeys
- **SSR support**: Use `initialDimension` prop on ResponsiveContainer for Next.js SSR
- **Theming**: Use CSS custom properties for consistent styling with design system
- **Custom ticks**: Use `tick` prop with custom component for label customization

## Code Examples

### Minimal Setup
```tsx
<ResponsiveContainer width="100%" height={300}>
  <RadarChart data={data}>
    <PolarGrid />
    <PolarAngleAxis dataKey="category" />
    <Radar dataKey="score" fill="#8884d8" fillOpacity={0.6} />
  </RadarChart>
</ResponsiveContainer>
```

### Full Featured
```tsx
<ResponsiveContainer width="100%" height={400}>
  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
    <PolarGrid gridType="polygon" />
    <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
    <Radar
      name="Score"
      dataKey="score"
      stroke="hsl(var(--primary))"
      fill="hsl(var(--primary))"
      fillOpacity={0.4}
      dot={{ r: 3 }}
      activeDot={{ r: 5 }}
    />
    <Tooltip />
    <Legend />
  </RadarChart>
</ResponsiveContainer>
```

## Sources

- Recharts via Context7 (recharts/recharts)
- Version: latest (retrieved 2026-01-27)
- Topics: radar, responsive, customization, polar
