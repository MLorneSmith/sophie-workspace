'use client';

import { useEffect } from 'react';

import { Button } from '@kit/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Quiz error:', error);
  }, [error]);

  return (
    <div className="container mx-auto flex min-h-[400px] flex-col items-center justify-center px-4 py-8">
      <h2 className="mb-4 text-2xl font-bold">Something went wrong!</h2>
      <p className="mb-8 text-gray-600">
        {error.message ||
          'An unexpected error occurred while loading the quiz.'}
      </p>
      <Button
        onClick={() => {
          // Attempt to recover by trying to re-render the route
          reset();
        }}
      >
        Try again
      </Button>
    </div>
  );
}
