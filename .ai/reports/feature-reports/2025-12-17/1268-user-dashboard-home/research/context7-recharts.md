# Context7 Research: Recharts Charts

**Library**: recharts/recharts
**Topic**: radar radial progress pie charts
**Date**: 2025-12-17

## Key Findings

### Radar Chart Pattern

```jsx
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { subject: 'Math', A: 120, B: 110, fullMark: 150 },
  // ... more data
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

### RadialBar Chart Pattern (For Progress Visualization)

```jsx
import { RadialBarChart, RadialBar, Legend, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: '18-24', uv: 31.47, fill: '#8884d8' },
  // ... more data
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

### Key Components

1. **RadarChart** - Spider/radar chart for multivariate data comparison
   - PolarGrid, PolarAngleAxis, PolarRadiusAxis for coordinate system
   - Radar component for each data series

2. **RadialBarChart** - Progress-style radial bars
   - RadialBar component with background option
   - Good for showing percentage/progress metrics

3. **ResponsiveContainer** - Always wrap charts for responsiveness
   - Use `width="100%"` and fixed height
   - `aspect` prop for maintaining ratio

### Data Structure Requirements

**Radar Chart**:
```ts
interface RadarData {
  category: string;  // axis label
  value: number;     // data point
  fullMark?: number; // optional max value
}
```

**RadialBar Chart**:
```ts
interface RadialBarData {
  name: string;
  value: number;
  fill: string;  // color per segment
}
```

## Relevance to Dashboard

- **Course Progress**: RadialBarChart for completion percentage
- **Self Assessment Spider**: RadarChart for category scores
- **Activity Metrics**: Bar/RadialBar for summary stats
