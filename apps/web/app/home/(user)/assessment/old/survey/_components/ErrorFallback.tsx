'use client';

export function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <h2 className="mb-4 text-2xl font-bold text-red-600">
        Error Loading Survey
      </h2>
      <p className="mb-4 text-gray-600">
        {error.message || 'An unexpected error occurred'}
      </p>
      <p className="text-sm text-gray-500">
        Please try refreshing the page or contact support if the problem
        persists.
      </p>
      <pre className="mt-4 max-w-full overflow-auto rounded bg-gray-100 p-4 text-left text-sm">
        <code>{error.stack}</code>
      </pre>
    </div>
  );
}
