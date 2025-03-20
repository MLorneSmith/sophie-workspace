'use client';

import { useEffect } from 'react';

interface ErrorWithMessage extends Error {
  message: string;
  stack?: string;
  cause?: unknown;
}

interface Props {
  error: ErrorWithMessage;
  reset: () => void;
}

function stringifyErrorCause(cause: unknown): string {
  try {
    return JSON.stringify(cause, null, 2);
  } catch {
    return String(cause);
  }
}

export default function DynamicParamsErrorBoundary({ error, reset }: Props) {
  useEffect(() => {
    // Log detailed error information
    console.error('Dynamic Params Error Details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
    });
  }, [error]);

  const stackTrace = error.stack
    ? String(error.stack)
    : 'No stack trace available';

  const errorCause = error.cause ? stringifyErrorCause(error.cause) : null;

  return (
    <div className="container mx-auto p-4">
      <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/10">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Dynamic Parameter Error
            </h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-200">
              <p>Error Message: {error.message}</p>
              <p className="mt-2">Stack Trace:</p>
              <pre className="mt-1 whitespace-pre-wrap text-xs">
                {stackTrace}
              </pre>
              {errorCause && (
                <>
                  <p className="mt-2">Cause:</p>
                  <pre className="mt-1 whitespace-pre-wrap text-xs">
                    {errorCause}
                  </pre>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={reset}
            className="rounded bg-red-800 px-2 py-1 text-sm text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
