# Context7 Research: Recharts Radar/Spider Chart Implementation

**Date**: 2026-01-21
**Agent**: alpha-context7
**Spec Directory**: .ai/alpha/specs/pending-Spec-user-dashboard
**Libraries Researched**: recharts/recharts

## Query Summary

Researched Recharts radar/spider chart implementation for React dashboards, focusing on:
1. How to create radar charts with Recharts
2. Best practices for displaying skill assessment data in radar format
3. Responsive radar chart configurations
4. Customizing radar chart styling (colors, labels, grid)

## Findings

### Core Radar Chart Implementation

Recharts provides a dedicated `RadarChart` component for creating radar/spider charts. The chart uses a polar coordinate system with three key axis components:

**Required Components:**
- `RadarChart` - Container component
- `PolarGrid` - Renders the circular/polygonal grid lines
- `PolarAngleAxis` - Displays category labels around the perimeter
- `PolarRadiusAxis` - Shows the scale values from center to edge
- `Radar` - The actual data visualization layer

**Basic Structure:**
```jsx
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

### Skill Assessment Data Structure

For skill assessment displays, the data should follow this pattern:

```typescript
interface SkillData {
  subject: string;      // The skill/category name (displayed on angle axis)
  value: number;        // The score/level for this skill
  fullMark: number;     // Maximum possible value (for domain calculation)
}

// Example for presentation skills assessment
const skillData = [
  { subject: 'Content Structure', value: 85, fullMark: 100 },
  { subject: 'Visual Design', value: 72, fullMark: 100 },
  { subject: 'Delivery', value: 90, fullMark: 100 },
  { subject: 'Engagement', value: 78, fullMark: 100 },
  { subject: 'Technical Skills', value: 65, fullMark: 100 },
  { subject: 'Storytelling', value: 88, fullMark: 100 }
];
```

### Responsive Configuration

**Using ResponsiveContainer (Recommended):**
```jsx
// Percentage-based sizing - adapts to parent container
<ResponsiveContainer width="100%" height={400}>
  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
    {/* ... chart components */}
  </RadarChart>
</ResponsiveContainer>

// Aspect ratio constraint - maintains proportions
<ResponsiveContainer width="100%" aspect={1}>
  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
    {/* ... chart components */}
  </RadarChart>
</ResponsiveContainer>

// With resize callback and debounce for performance
<ResponsiveContainer
  width="100%"
  height={400}
  debounce={300}
  onResize={(width, height) => console.log(`Resized to ${width}x${height}`)}
>
  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
    {/* ... chart components */}
  </RadarChart>
</ResponsiveContainer>
```

**Key Sizing Properties:**
- `cx` / `cy` - Center position (use "50%" for centered)
- `outerRadius` - Chart radius (use "80%" to leave room for labels)
- `width` / `height` on ResponsiveContainer for container sizing

### Styling and Customization

**Radar Area Styling:**
```jsx
<Radar
  name="Skills"
  dataKey="value"
  stroke="#8884d8"        // Border color
  fill="#8884d8"          // Fill color
  fillOpacity={0.6}       // Fill transparency (0-1)
  strokeWidth={2}         // Border thickness
  dot={true}              // Show data points
  activeDot={{ r: 8 }}    // Hover state dot size
/>
```

**Grid Customization:**
```jsx
<PolarGrid
  stroke="#ccc"
  strokeDasharray="3 3"   // Dashed grid lines
/>
```

**Angle Axis (Category Labels):**
```jsx
<PolarAngleAxis
  dataKey="subject"
  tick={{ fill: '#666', fontSize: 12 }}
  tickLine={false}
/>
```

**Radius Axis (Scale):**
```jsx
<PolarRadiusAxis
  angle={90}              // Position of the axis line
  domain={[0, 100]}       // Min and max values
  tick={{ fill: '#999' }}
  axisLine={false}        // Hide the axis line
  tickCount={5}           // Number of tick marks
/>
```

**Custom Tooltip:**
```jsx
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
        <p style={{ margin: '5px 0 0 0', color: payload[0].color }}>
          {`Score: ${payload[0].value}`}
        </p>
      </div>
    );
  }
  return null;
};

// Usage
<Tooltip content={<CustomTooltip />} />
```

**Legend Styling:**
```jsx
<Legend
  width={100}
  wrapperStyle={{
    top: 40,
    right: 20,
    backgroundColor: '#f5f5f5',
    border: '1px solid #d5d5d5',
    borderRadius: 3,
    lineHeight: '40px'
  }}
/>
```

### Multiple Data Series Comparison

For comparing multiple entities (e.g., current vs target skills):

```jsx
const comparisonData = [
  { skill: 'Content', current: 75, target: 90 },
  { skill: 'Design', current: 80, target: 85 },
  { skill: 'Delivery', current: 65, target: 80 },
  { skill: 'Engagement', current: 70, target: 85 },
  { skill: 'Technical', current: 85, target: 90 },
];

<RadarChart data={comparisonData}>
  <PolarGrid />
  <PolarAngleAxis dataKey="skill" />
  <PolarRadiusAxis domain={[0, 100]} />
  <Radar
    name="Current Level"
    dataKey="current"
    stroke="#8884d8"
    fill="#8884d8"
    fillOpacity={0.5}
  />
  <Radar
    name="Target Level"
    dataKey="target"
    stroke="#82ca9d"
    fill="#82ca9d"
    fillOpacity={0.3}
  />
  <Legend />
  <Tooltip />
</RadarChart>
```

### Best Practices for Skill Assessment Radar Charts

1. **Limit Categories**: 5-8 skills/categories work best for readability
2. **Consistent Scale**: Use a consistent domain (e.g., 0-100) across all skills
3. **Color Contrast**: Use distinct colors for multiple data series
4. **Fill Opacity**: Use 0.4-0.6 opacity to see overlapping areas
5. **Labels**: Keep axis labels short or use abbreviations
6. **Responsive Sizing**: Always use ResponsiveContainer for dashboard integration
7. **Domain Padding**: Set outerRadius to ~80% to ensure labels fit

### TypeScript Types

```typescript
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

interface SkillDataPoint {
  subject: string;
  value: number;
  fullMark: number;
}

interface RadarChartProps {
  data: SkillDataPoint[];
  width?: string | number;
  height?: number;
  colors?: {
    stroke: string;
    fill: string;
  };
}
```

## Key Takeaways

- Use `RadarChart` with `PolarGrid`, `PolarAngleAxis`, and `PolarRadiusAxis` for proper radar chart setup
- Always wrap in `ResponsiveContainer` for responsive dashboards
- Use percentage values for `cx`, `cy`, and `outerRadius` for flexibility
- Set explicit `domain` on `PolarRadiusAxis` to control the scale
- `fillOpacity` between 0.4-0.6 provides good visibility while allowing overlap comparison
- Limit to 5-8 categories for optimal readability
- Custom tooltips enhance user experience with detailed skill information

## Complete Implementation Example

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
  ResponsiveContainer,
} from 'recharts';

interface SkillData {
  skill: string;
  score: number;
  maxScore: number;
}

interface SkillRadarChartProps {
  data: SkillData[];
  title?: string;
  color?: string;
  height?: number;
}

export function SkillRadarChart({
  data,
  title = 'Skills Assessment',
  color = '#8884d8',
  height = 400,
}: SkillRadarChartProps) {
  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            tickCount={5}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke={color}
            fill={color}
            fillOpacity={0.5}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
            formatter={(value: number) => [`${value}%`, 'Score']}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

## Sources

- recharts/recharts via Context7 (recharts/recharts)
- Topics fetched: "radar chart", "customization styling", "polar axis api"
- Total tokens used: ~4,229
