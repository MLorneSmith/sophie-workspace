'use client';

import { useEffect } from 'react';

import Link from 'next/link';

import { Button } from '@kit/ui/button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Lesson page error:', error);
  }, [error]);

  // Check if it's a params error
  const isParamsError = error.message?.includes('params.lessonSlug');
  const errorMessage = isParamsError
    ? 'Unable to load lesson. Please try again.'
    : error.message || 'An unexpected error occurred';

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="mb-4 text-2xl font-bold">Something went wrong!</h2>
        <p className="mb-4 text-muted-foreground">{errorMessage}</p>
        <div className="flex justify-center space-x-4">
          <Button onClick={reset} variant="default">
            Try again
          </Button>
          <Link href="/home/course">
            <Button variant="outline">Return to Course</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
