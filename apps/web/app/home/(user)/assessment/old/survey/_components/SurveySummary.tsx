import React from 'react';

import { Button } from '@kit/ui/button';

import { CategoryScores } from '../../../_types/survey';
import { RadarChart } from './radarChart';

export interface SurveySummaryProps {
  categoryScores: CategoryScores;
  onRetry: () => void;
  highestScoringCategory: string;
  lowestScoringCategory: string;
  totalQuestions: number;
  submitButton: React.ReactNode;
}

export function SurveySummary({
  categoryScores,
  onRetry,
  highestScoringCategory,
  lowestScoringCategory,
  totalQuestions,
  submitButton,
}: SurveySummaryProps) {
  return (
    <div className="mt-8 flex flex-col items-center">
      <div className="mb-6 w-full max-w-2xl rounded-lg bg-white p-6 shadow-md">
        <p className="mb-4 text-lg font-semibold text-green-600">
          Your strength appears to be with {highestScoringCategory}
        </p>
        <p className="mb-6 text-lg font-semibold text-orange-600">
          It looks like your biggest area of opportunity is in developing your
          skills with {lowestScoringCategory}
        </p>
        <div className="w-full">
          <RadarChart categoryScores={categoryScores} />
        </div>
      </div>
      <div className="mt-6">
        <Button onClick={onRetry} variant="default">
          Retake Survey
        </Button>
      </div>
    </div>
  );
}
