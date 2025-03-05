'use client';

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart as RechartsRadarChart,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@kit/ui/chart';

export interface CategoryScores {
  [key: string]: number;
  Structure: number;
  Story: number;
  Substance: number;
  'Self-Confidence': number;
  Style: number;
}

const chartConfig = {
  score: {
    label: 'Score',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function RadarChart({
  categoryScores,
}: {
  categoryScores: CategoryScores;
}) {
  const chartData = Object.entries(categoryScores).map(([category, score]) => ({
    category,
    score,
  }));

  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <CardTitle>Survey Results</CardTitle>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
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
      </CardContent>
    </Card>
  );
}
