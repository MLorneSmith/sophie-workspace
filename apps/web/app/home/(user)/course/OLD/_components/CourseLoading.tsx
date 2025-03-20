'use client';

import { type FC } from 'react';

interface CourseLoadingProps {
  type?: 'dashboard' | 'lesson' | 'quiz';
}

export const CourseLoading: FC<CourseLoadingProps> = ({
  type = 'dashboard',
}) => {
  if (type === 'lesson') {
    return (
      <div className="animate-pulse">
        <div className="mb-8">
          <div className="h-8 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mt-4 flex space-x-4">
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-4/6 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  if (type === 'quiz') {
    return (
      <div className="animate-pulse">
        <div className="mb-8">
          <div className="h-8 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mt-4 h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800"
            >
              <div className="mb-4 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-2">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="flex items-center space-x-2">
                    <div className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Dashboard loading state - updated to match actual layout
  return (
    <div className="container mx-auto flex max-w-4xl flex-col space-y-6 p-4">
      <div>
        <div className="mx-auto mb-4 h-8 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Progress bar skeleton */}
      <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />

      {/* Lesson cards skeleton - matches actual card layout */}
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:bg-gray-800"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="h-6 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-6 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="flex gap-4">
              <div className="h-[155px] w-[275px] rounded bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-4">
                <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseLoading;
