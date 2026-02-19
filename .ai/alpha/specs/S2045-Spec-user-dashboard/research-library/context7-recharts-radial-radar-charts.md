# Context7 Research: Recharts RadialBarChart and RadarChart Components

**Date**: 2026-02-09
**Agent**: alpha-context7
**Spec Directory**: .ai/alpha/specs/pending-Spec-user-dashboard
**Libraries Researched**: recharts/recharts (latest version)

## Query Summary

Researched Recharts library documentation for implementing RadialBarChart and RadarChart components for a user dashboard with focus on:
1. RadialBarChart for circular progress visualization
2. RadarChart configuration for spider/multivariate diagrams
3. Empty data state handling patterns
4. Responsive chart sizing strategies

## Findings

### 1. RadialBarChart / Circular Progress Indicators

**Note**: Recharts doesn't have a dedicated `RadialBarChart` component. For circular/radial progress indicators, use **PieChart with innerRadius** (donut chart pattern).

#### Donut Chart Pattern (Best for Progress Indicators)

```jsx
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const data = [
  { name: 'Completed', value: 75 },
  { name: 'Remaining', value: 25 }
];

const COLORS = ['#8884d8', '#e0e0e0'];

function ProgressCircle() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          fill="#8884d8"
          paddingAngle={5}
          dataKey="value"
          startAngle={90}
          endAngle={-270}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

**Key Properties for Progress Visualization**:
- `innerRadius={60}` - Creates donut shape (adjust for thicker/thinner ring)
- `outerRadius={80}` - Controls overall size
- `startAngle={90}` / `endAngle={-270}` - Start from top, go clockwise
- `paddingAngle={5}` - Small gap between segments
- `cx="50%"` / `cy="50%"` - Center the chart

**Custom Labels Inside Circle**:
```jsx
<Pie
  data={data}
  cx="50%"
  cy="50%"
  innerRadius={60}
  outerRadius={80}
  labelLine={false}
  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
  dataKey="value"
>
  {/* Cell mapping */}
</Pie>
```

### 2. RadarChart for Spider Diagrams

Full-featured RadarChart with multiple data series:

```jsx
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
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

function SimpleRadarChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis angle={30} domain={[0, 150]} />
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

**Key Components**:
- `PolarGrid` - Background radial grid lines
- `PolarAngleAxis` - Labels around the perimeter (subjects/categories)
- `PolarRadiusAxis` - Radial axis with values (angle controls label position)
- `Radar` - Data series (multiple allowed for comparison)

**Configuration Options**:
- `cx="50%"` / `cy="50%"` - Center position
- `outerRadius="80%"` - Size relative to container
- `domain={[0, 150]}` - Value range for radial axis
- `fillOpacity={0.6}` - Semi-transparent fills for overlapping series
- `angle={30}` - Label angle for radial axis

### 3. Empty Data State Handling

Recharts doesn't render anything when data is empty. Best practice: **conditional rendering**.

```jsx
function ChartWithEmptyState({ data }) {
  // Empty state check
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

**Alternative: Interactive Legend Pattern**

For toggling series visibility (not empty state, but useful for "all hidden" scenarios):

```jsx
import { useState } from 'react';

function InteractiveLegend() {
  const [hiddenLines, setHiddenLines] = useState({});

  const handleLegendClick = (dataKey) => {
    setHiddenLines(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }));
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Legend
          onClick={(e) => handleLegendClick(e.dataKey)}
          wrapperStyle={{ cursor: 'pointer' }}
        />
        <Line
          type="monotone"
          dataKey="pv"
          stroke="#8884d8"
          hide={hiddenLines.pv}
        />
        <Line
          type="monotone"
          dataKey="uv"
          stroke="#82ca9d"
          hide={hiddenLines.uv}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### 4. Responsive Chart Sizing

#### Three Primary Patterns:

**Pattern 1: Full-width Responsive (Most Common)**
```jsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <Line type="monotone" dataKey="value" stroke="#8884d8" />
  </LineChart>
</ResponsiveContainer>
```

**Pattern 2: Fixed Aspect Ratio**
```jsx
<ResponsiveContainer width="100%" aspect={2}>
  {/* aspect = width/height ratio */}
  <LineChart data={data}>
    <Line type="monotone" dataKey="value" stroke="#8884d8" />
  </LineChart>
</ResponsiveContainer>
```

**Pattern 3: Constrained with Min/Max**
```jsx
<ResponsiveContainer
  width="100%"
  height="100%"
  minWidth={300}
  minHeight={200}
  maxHeight={400}
>
  <LineChart data={data}>
    <Line type="monotone" dataKey="value" stroke="#8884d8" />
  </LineChart>
</ResponsiveContainer>
```

**Mobile-Friendly Margin Adjustments**:
```jsx
<LineChart
  data={data}
  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
>
  {/* Smaller margins for mobile */}
</LineChart>
```

### 5. Accessibility Features (Recharts 3.0+)

Keyboard navigation and screen reader support are **enabled by default** in Recharts 3.0:

```jsx
<ResponsiveContainer width="100%" height={400}>
  <LineChart data={pageData} title="Line chart showing UV values for pages">
    <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
  </LineChart>
</ResponsiveContainer>
```

**Key Accessibility Features**:
- Users can navigate data points using arrow keys
- Tooltip feedback on keyboard focus
- Screen reader support (add `title` prop to chart)
- No explicit `accessibilityLayer` configuration needed

### 6. Custom Hooks for Advanced Usage

Recharts provides hooks to access internal chart state:

```jsx
import {
  useActiveTooltipDataPoints,
  usePlotArea,
  useChartWidth,
  useChartHeight
} from 'recharts';

// Must be inside chart component tree
function ChartInfo() {
  const activePoints = useActiveTooltipDataPoints();
  const plotArea = usePlotArea();
  const chartWidth = useChartWidth();
  const chartHeight = useChartHeight();

  return (
    <text x={10} y={20} fontSize={12}>
      {`Chart: ${chartWidth}x${chartHeight}, Plot: ${plotArea?.width}x${plotArea?.height}`}
    </text>
  );
}
```

**Use Cases**:
- Custom tooltips with precise positioning
- Dynamic annotations based on plot dimensions
- Conditional rendering based on active data points

## Key Takeaways

1. **No RadialBarChart Component**: Use `PieChart` with `innerRadius` to create circular progress indicators (donut charts). Control thickness via `innerRadius`/`outerRadius` difference.

2. **RadarChart is Well-Supported**: Full-featured with `PolarGrid`, `PolarAngleAxis`, `PolarRadiusAxis`, and multiple `Radar` series. Perfect for multivariate comparisons.

3. **Empty States Require Manual Handling**: Recharts renders nothing on empty data. Implement conditional rendering with fallback UI.

4. **ResponsiveContainer is Essential**: Always wrap charts in `ResponsiveContainer` for responsive behavior. Use `width="100%"` for full-width, `aspect` for aspect ratio, or min/max constraints.

5. **Mobile Optimization**: Adjust margins for smaller screens and consider using `aspect` prop instead of fixed heights.

6. **Accessibility Built-In (v3.0+)**: Keyboard navigation and screen reader support work by default. Add `title` prop for better screen reader descriptions.

7. **Color Customization**: Use `Cell` component inside `Pie`/`Bar` for per-item colors. Define color arrays and map with index modulo.

## Code Examples for User Dashboard

### Circular Progress Indicator (Skills Completion)

```jsx
function SkillsProgress({ completed, total }) {
  const data = [
    { name: 'Completed', value: completed },
    { name: 'Remaining', value: total - completed }
  ];

  const COLORS = ['#10b981', '#e5e7eb']; // Green for completed, gray for remaining

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        <p>No skills tracked yet</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={70}
          startAngle={90}
          endAngle={-270}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index]} />
          ))}
        </Pie>
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={24}
          fontWeight="bold"
        >
          {`${Math.round((completed / total) * 100)}%`}
        </text>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

### Learning Progress Radar Chart

```jsx
function LearningProgressRadar({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        <p>Complete lessons to see your progress</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tick={{ fill: '#6b7280' }}
        />
        <Radar
          name="Your Progress"
          dataKey="score"
          stroke="#8b5cf6"
          fill="#8b5cf6"
          fillOpacity={0.6}
        />
        <Radar
          name="Target"
          dataKey="target"
          stroke="#d1d5db"
          fill="#d1d5db"
          fillOpacity={0.3}
        />
        <Legend />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// Example data structure:
const exampleData = [
  { category: 'Reading', score: 85, target: 90 },
  { category: 'Writing', score: 70, target: 90 },
  { category: 'Speaking', score: 65, target: 90 },
  { category: 'Listening', score: 90, target: 90 },
  { category: 'Grammar', score: 75, target: 90 }
];
```

## Sources

- Recharts via Context7 (recharts/recharts)
- Official documentation: https://recharts.org
- GitHub: https://github.com/recharts/recharts
- Context7 LLMs.txt compilation
- Recharts 3.0 Migration Guide
- Recharts Storybook examples
