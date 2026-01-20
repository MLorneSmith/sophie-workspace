# Context7 Research: Recharts Radial Progress Charts

**Date**: 2026-01-20
**Agent**: alpha-context7
**Spec Directory**: .ai/alpha/specs/pending-Spec-user-dashboard
**Libraries Researched**: recharts/recharts

## Query Summary

Researched Recharts documentation to understand:
1. How to create radial/circular progress charts
2. RadialBarChart component usage and configuration
3. Best practices for progress visualization

## Findings

### RadialBarChart Component

The RadialBarChart is the primary component for creating radial/circular progress indicators in Recharts. It renders data as concentric circular bars emanating from a center point.

**Key Properties:**
- `cx`, `cy` - Center position (can use percentages like "50%")
- `innerRadius` - Inner radius of the chart (percentage or pixels)
- `outerRadius` - Outer radius of the chart (percentage or pixels)
- `barSize` - Width of each bar
- `data` - Array of data objects with name, value, and fill color

**RadialBar Sub-component Properties:**
- `minAngle` - Minimum angle for visibility of small values
- `label` - Label configuration (position, fill, etc.)
- `background` - Whether to show background track
- `clockWise` - Direction of the bar
- `dataKey` - The data key for values

### Basic RadialBarChart Example

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

export default RadialBarChartExample;
```

### Creating a Single Progress Ring

For a simple circular progress indicator (like course completion), use a single data item with background enabled:

```jsx
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

// For a progress indicator showing 75% completion
const progressData = [
  { name: 'Progress', value: 75, fill: '#8884d8' }
];

function CircularProgress({ value, maxValue = 100, color = '#8884d8' }) {
  const data = [{ name: 'Progress', value, fill: color }];

  return (
    <ResponsiveContainer width={200} height={200}>
      <RadialBarChart
        cx="50%"
        cy="50%"
        innerRadius="60%"
        outerRadius="80%"
        barSize={10}
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <RadialBar
          background={{ fill: '#e0e0e0' }}
          clockWise
          dataKey="value"
          cornerRadius={10}
        />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}
```

### PieChart for Donut Progress

An alternative approach using PieChart with innerRadius for donut-style progress:

```jsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#e0e0e0'];

function DonutProgress({ value, maxValue = 100 }) {
  const data = [
    { name: 'Completed', value: value },
    { name: 'Remaining', value: maxValue - value },
  ];

  return (
    <ResponsiveContainer width={200} height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          startAngle={90}
          endAngle={-270}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
```

### Cell Component for Custom Coloring

The Cell component allows individual styling of each bar/slice:

```jsx
import { RadialBarChart, RadialBar, Cell, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Course 1', progress: 80, status: 'success' },
  { name: 'Course 2', progress: 45, status: 'in-progress' },
  { name: 'Course 3', progress: 20, status: 'started' },
];

const getColorByStatus = (status) => {
  switch (status) {
    case 'success': return '#00C49F';
    case 'in-progress': return '#FFBB28';
    case 'started': return '#FF8042';
    default: return '#8884d8';
  }
};

function MultipleProgressBars() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadialBarChart
        cx="50%"
        cy="50%"
        innerRadius="20%"
        outerRadius="80%"
        data={data}
      >
        <RadialBar
          background
          dataKey="progress"
          label={{ position: 'insideStart', fill: '#fff' }}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColorByStatus(entry.status)} />
          ))}
        </RadialBar>
      </RadialBarChart>
    </ResponsiveContainer>
  );
}
```

### Adding Center Text/Label

To add a centered percentage or label in the middle of a radial chart, use absolute positioning with a custom component or SVG text:

```jsx
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

function ProgressWithCenterLabel({ value }) {
  const data = [{ name: 'Progress', value, fill: '#8884d8' }];

  return (
    <div style={{ position: 'relative', width: 200, height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="90%"
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar
            background={{ fill: '#e0e0e0' }}
            dataKey="value"
            cornerRadius={10}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{value}%</div>
        <div style={{ fontSize: '0.875rem', color: '#666' }}>Complete</div>
      </div>
    </div>
  );
}
```

### Key Configuration Options

| Property | Description | Common Values |
|----------|-------------|---------------|
| `startAngle` | Starting angle in degrees | 90 (top), 0 (right) |
| `endAngle` | Ending angle in degrees | -270 (full circle from top) |
| `innerRadius` | Inner radius | "60%", 40 (pixels) |
| `outerRadius` | Outer radius | "80%", 80 (pixels) |
| `barSize` | Width of the bar | 10, 20 (pixels) |
| `cornerRadius` | Rounded corners | 5, 10 (pixels) |
| `background` | Show background track | true, { fill: '#e0e0e0' } |

### Best Practices for Progress Visualization

1. **Use background tracks**: Always enable `background` prop to show the full range
2. **Start from top**: Use `startAngle={90}` and `endAngle={-270}` for intuitive top-start
3. **Add corner radius**: Use `cornerRadius` for modern rounded appearance
4. **Consistent sizing**: Wrap in `ResponsiveContainer` for responsive behavior
5. **Color coding**: Use semantic colors (green for complete, yellow for in-progress)
6. **Center labels**: Add percentage text in center for quick readability
7. **Appropriate sizing**: Keep innerRadius/outerRadius ratio around 0.7-0.8 for aesthetics

### SunburstChart for Hierarchical Progress

For nested/hierarchical progress (e.g., course with lessons), consider SunburstChart:

```jsx
import React from 'react';
import { SunburstChart, ResponsiveContainer } from 'recharts';

const courseData = {
  name: 'Course',
  children: [
    {
      name: 'Module 1',
      value: 100,
      fill: '#00C49F', // Completed
      children: [
        { name: 'Lesson 1', value: 30, fill: '#00C49F' },
        { name: 'Lesson 2', value: 40, fill: '#00C49F' },
        { name: 'Lesson 3', value: 30, fill: '#00C49F' },
      ],
    },
    {
      name: 'Module 2',
      value: 60,
      fill: '#FFBB28', // In progress
      children: [
        { name: 'Lesson 1', value: 30, fill: '#00C49F' },
        { name: 'Lesson 2', value: 30, fill: '#e0e0e0' },
      ],
    },
  ],
};

function HierarchicalProgress() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <SunburstChart
        data={courseData}
        dataKey="value"
        innerRadius="20%"
        outerRadius="80%"
      />
    </ResponsiveContainer>
  );
}
```

## Key Takeaways

- **RadialBarChart** is the primary component for circular progress indicators
- Use **single data item** with `background` enabled for simple progress rings
- **PieChart with innerRadius** provides an alternative donut-style approach
- **Cell component** enables per-item custom coloring based on status
- Configure **startAngle/endAngle** (90 to -270) for intuitive top-start progress
- Add **cornerRadius** for modern rounded appearance
- Use **absolute positioning** for center labels (percentage text)
- Wrap in **ResponsiveContainer** for responsive behavior
- **SunburstChart** works for hierarchical/nested progress visualization

## Code Examples

### Simple Course Progress Ring (Recommended Pattern)

```tsx
'use client';

import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

interface CourseProgressProps {
  progress: number; // 0-100
  size?: number;
  color?: string;
  trackColor?: string;
  strokeWidth?: number;
}

export function CourseProgress({
  progress,
  size = 120,
  color = '#3b82f6', // blue-500
  trackColor = '#e5e7eb', // gray-200
  strokeWidth = 8,
}: CourseProgressProps) {
  const data = [{ name: 'Progress', value: progress, fill: color }];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius={`${100 - (strokeWidth / size) * 100 * 2}%`}
          outerRadius="100%"
          barSize={strokeWidth}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar
            background={{ fill: trackColor }}
            dataKey="value"
            cornerRadius={strokeWidth / 2}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-semibold">{progress}%</span>
      </div>
    </div>
  );
}
```

## Sources

- Recharts via Context7 (recharts/recharts)
- Topics: RadialBarChart, radial, progress, circular, pie
- Token usage: ~6000 tokens across 3 queries
