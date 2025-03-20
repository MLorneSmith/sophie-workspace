'use client';

import { type FC } from 'react';

import { QuizContent } from '@kit/cms';

interface QuizSummaryProps {
  correctAnswers: number;
  totalQuestions: number;
  onRetry?: () => void;
  completeButton?: React.ReactNode;
}

export const QuizSummary: FC<QuizSummaryProps> = ({
  correctAnswers,
  totalQuestions,
  onRetry,
  completeButton,
}) => {
  const score = Math.round((correctAnswers / totalQuestions) * 100);
  const isPassing = score >= 70; // This could be configurable

  return (
    <div className="mt-8 rounded-lg bg-white p-8 shadow-sm">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold">Quiz Results</h2>
        <div
          className={`mb-4 text-4xl font-bold ${
            isPassing ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {score}%
        </div>
        <p className="mb-4 text-gray-600">
          You got {correctAnswers} out of {totalQuestions} questions correct
        </p>
        {isPassing ? (
          <div className="space-y-4">
            <p className="text-green-600">
              Congratulations! You passed the quiz!
            </p>
            {completeButton}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-red-600">
              You need at least 70% to pass. Would you like to try again?
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Retry Quiz
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
