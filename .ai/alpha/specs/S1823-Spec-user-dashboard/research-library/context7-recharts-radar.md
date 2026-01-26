# Context7 Research: Recharts RadarChart Component

**Date**: 2026-01-26
**Agent**: alpha-context7
**Spec Directory**: .ai/alpha/specs/pending-Spec-user-dashboard
**Libraries Researched**: recharts/recharts

## Query Summary

Researched Recharts RadarChart component for creating spider/radar diagrams, focusing on:
1. RadarChart component props and configuration
2. Multiple data series on same radar chart
3. Customizing axis labels and tick formatting
4. Responsive sizing
5. Animation and interaction options

## Findings

### RadarChart Component Overview

RadarChart (also known as spider chart) is a Recharts component for visualizing multivariate data across categories. It uses a polar coordinate system with the following key sub-components:

- **RadarChart** - Container component
- **Radar** - Data series representation (filled polygon)
- **PolarGrid** - Background grid lines
- **PolarAngleAxis** - Category labels around the perimeter
- **PolarRadiusAxis** - Value scale from center to edge
- **Legend** - Series identification
- **Tooltip** - Interactive data display

### 1. RadarChart Component Props and Configuration

#### Basic RadarChart Setup

```jsx
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer
} from 'recharts';

<RadarChart
  cx="50%"           // Center X position (percentage or number)
  cy="50%"           // Center Y position (percentage or number)
  outerRadius="80%"  // Radius from center (percentage or number)
  data={data}        // Data array
>
  <PolarGrid />
  <PolarAngleAxis dataKey="subject" />
  <PolarRadiusAxis />
  <Radar dataKey="value" />
</RadarChart>
```

#### Key RadarChart Props

| Prop | Type | Description |
|------|------|-------------|
| `cx` | string \| number | Center X coordinate ("50%" or 200) |
| `cy` | string \| number | Center Y coordinate ("50%" or 200) |
| `outerRadius` | string \| number | Outer radius ("80%" or 150) |
| `innerRadius` | string \| number | Inner radius for donut effect |
| `startAngle` | number | Starting angle in degrees (default: 90) |
| `endAngle` | number | Ending angle in degrees |
| `data` | array | Data array for the chart |

#### Radar (Data Series) Props

| Prop | Type | Description |
|------|------|-------------|
| `dataKey` | string | Key in data for values |
| `name` | string | Name for legend/tooltip |
| `stroke` | string | Line/border color |
| `fill` | string | Fill color |
| `fillOpacity` | number | Fill transparency (0-1) |
| `dot` | boolean \| object | Show data points |
| `activeDot` | boolean \| object | Active state styling |
| `legendType` | string | Legend icon type |

### 2. Multiple Data Series on Same Radar Chart

Multiple series are achieved by adding multiple `<Radar>` components, each with a different `dataKey`:

```jsx
const data = [
  { subject: 'Math', A: 120, B: 110, fullMark: 150 },
  { subject: 'Chinese', A: 98, B: 130, fullMark: 150 },
  { subject: 'English', A: 86, B: 130, fullMark: 150 },
  { subject: 'Geography', A: 99, B: 100, fullMark: 150 },
  { subject: 'Physics', A: 85, B: 90, fullMark: 150 },
  { subject: 'History', A: 65, B: 85, fullMark: 150 }
];

function MultiSeriesRadarChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis angle={90} domain={[0, 150]} />

        {/* First data series */}
        <Radar
          name="Student A"
          dataKey="A"
          stroke="#8884d8"
          fill="#8884d8"
          fillOpacity={0.6}
        />

        {/* Second data series */}
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

**Key Points for Multiple Series:**
- Each `<Radar>` reads from a different `dataKey` in the same data array
- Use distinct colors for stroke and fill
- Set `fillOpacity` < 1 to see overlapping areas
- Add `<Legend>` to identify series by name

### 3. Customizing Axis Labels and Tick Formatting

#### PolarAngleAxis (Category Labels)

```jsx
<PolarAngleAxis
  dataKey="subject"           // Key for category labels
  tick={{ fill: '#666' }}     // Tick text styling
  tickLine={false}            // Hide tick lines
  axisLine={false}            // Hide axis line
  orientation="outer"         // Label position
/>
```

#### Custom Tick Formatter for PolarAngleAxis

```jsx
// Custom tick component for rotated labels
const CustomizedAxisTick = ({ x, y, payload }) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="end"
        fill="#666"
        transform="rotate(-35)"
      >
        {payload.value}
      </text>
    </g>
  );
};

<PolarAngleAxis
  dataKey="subject"
  tick={<CustomizedAxisTick />}
/>
```

#### PolarRadiusAxis (Value Scale)

```jsx
<PolarRadiusAxis
  angle={90}                  // Position of the axis (degrees)
  domain={[0, 150]}           // Min/max values [min, max]
  tick={{ fill: '#999' }}     // Tick styling
  tickCount={5}               // Number of ticks
  axisLine={false}            // Hide axis line
  tickFormatter={(value) => `${value}%`}  // Custom format
/>
```

#### Custom Tick Formatter Function

```jsx
// Format values with units
function formatValue(value) {
  return `${value.toFixed(0)}pts`;
}

<PolarRadiusAxis
  angle={90}
  domain={[0, 100]}
  tickFormatter={formatValue}
/>
```

#### Domain Configuration

```jsx
// Auto-calculate domain from data
<PolarRadiusAxis domain={['auto', 'auto']} />

// Fixed domain
<PolarRadiusAxis domain={[0, 100]} />

// Domain with overflow handling
<PolarRadiusAxis
  domain={[0, 150]}
  allowDataOverflow={true}  // Clip data outside domain
/>
```

### 4. Responsive Sizing

Use `ResponsiveContainer` to make charts responsive:

```jsx
import { ResponsiveContainer } from 'recharts';

// Percentage-based sizing (recommended)
<ResponsiveContainer width="100%" height={400}>
  <RadarChart data={data}>
    {/* ... */}
  </RadarChart>
</ResponsiveContainer>

// Aspect ratio constraint
<ResponsiveContainer width="100%" aspect={1}>
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

**ResponsiveContainer Props:**

| Prop | Type | Description |
|------|------|-------------|
| `width` | string \| number | Width ("100%" or 500) |
| `height` | string \| number | Height (required if no aspect) |
| `aspect` | number | Width/height ratio (alternative to height) |
| `debounce` | number | Resize debounce in ms |
| `onResize` | function | Callback on resize (width, height) |

### 5. Animation and Interaction Options

#### Animation Props on Radar Component

```jsx
<Radar
  dataKey="A"
  stroke="#8884d8"
  fill="#8884d8"
  fillOpacity={0.6}
  // Animation props
  isAnimationActive={true}        // Enable/disable animation
  animationDuration={2000}        // Duration in ms
  animationEasing="ease-in-out"   // Easing function
  animationBegin={0}              // Delay before start
  onAnimationStart={() => console.log('Animation started')}
  onAnimationEnd={() => console.log('Animation ended')}
/>
```

#### Animation Easing Options

```typescript
type AnimationTiming = 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
```

#### Replay Animation Pattern

```jsx
function AnimatedRadarChart() {
  const [animationKey, setAnimationKey] = useState(0);

  const replayAnimation = () => {
    setAnimationKey(prev => prev + 1);
  };

  return (
    <div>
      <button onClick={replayAnimation}>Replay Animation</button>
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart key={animationKey} data={data}>
          <Radar
            dataKey="A"
            isAnimationActive={true}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### Custom Tooltip for RadarChart

```jsx
const CustomRadarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ margin: '5px 0 0 0', color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

<RadarChart data={data}>
  {/* ... */}
  <Tooltip content={<CustomRadarTooltip />} />
</RadarChart>
```

### Custom Legend for RadarChart

```jsx
const renderCustomLegend = ({ payload }) => {
  return (
    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', justifyContent: 'center' }}>
      {payload.map((entry, index) => (
        <li key={index} style={{ marginRight: '20px', display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '12px',
            height: '12px',
            backgroundColor: entry.color,
            marginRight: '5px',
            borderRadius: '50%'
          }} />
          <span style={{ color: '#666' }}>{entry.value}</span>
        </li>
      ))}
    </ul>
  );
};

<Legend
  content={renderCustomLegend}
  verticalAlign="bottom"
  height={36}
  onClick={(data) => console.log('Legend clicked:', data)}
/>
```

### Legend Props

```jsx
<Legend
  width={100}
  layout="horizontal"         // or "vertical"
  verticalAlign="bottom"      // "top", "middle", "bottom"
  align="center"              // "left", "center", "right"
  iconSize={10}
  iconType="circle"           // "line", "square", "rect", etc.
  wrapperStyle={{
    backgroundColor: '#f5f5f5',
    border: '1px solid #d5d5d5',
    borderRadius: 3,
  }}
/>
```

## Key Takeaways

1. **RadarChart Structure**: Use `RadarChart` as container with `PolarGrid`, `PolarAngleAxis`, `PolarRadiusAxis`, and `Radar` as children

2. **Multiple Series**: Add multiple `<Radar>` components with different `dataKey` props pointing to different fields in the same data array

3. **Axis Customization**: Use `tickFormatter` prop for value formatting, or provide custom tick components via `tick` prop

4. **Responsive Charts**: Always wrap in `ResponsiveContainer` with `width="100%"` and explicit height

5. **Animation Control**: Use `isAnimationActive`, `animationDuration`, and `animationEasing` props on `Radar` component

6. **TypeScript Support**: Recharts provides TypeScript definitions; use typed props for better IDE support

## Complete Example

```jsx
import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const assessmentData = [
  { skill: 'Communication', current: 85, target: 90 },
  { skill: 'Technical', current: 70, target: 85 },
  { skill: 'Leadership', current: 60, target: 75 },
  { skill: 'Problem Solving', current: 80, target: 85 },
  { skill: 'Creativity', current: 75, target: 80 },
  { skill: 'Teamwork', current: 90, target: 95 }
];

function SkillsRadarChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={assessmentData}>
        <PolarGrid gridType="polygon" />
        <PolarAngleAxis
          dataKey="skill"
          tick={{ fill: '#666', fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
        />
        <Radar
          name="Current Score"
          dataKey="current"
          stroke="#8884d8"
          fill="#8884d8"
          fillOpacity={0.6}
          isAnimationActive={true}
          animationDuration={1000}
        />
        <Radar
          name="Target Score"
          dataKey="target"
          stroke="#82ca9d"
          fill="#82ca9d"
          fillOpacity={0.3}
          strokeDasharray="5 5"
        />
        <Legend verticalAlign="bottom" height={36} />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export default SkillsRadarChart;
```

## Sources

- recharts/recharts via Context7
  - Storybook API documentation
  - Official examples and code snippets
  - Wiki documentation on axis domains and ticks
