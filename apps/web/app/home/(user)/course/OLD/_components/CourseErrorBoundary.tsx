'use client';

import { type FC } from 'react';

import { useRouter } from 'next/navigation';

import {
  getUserFriendlyErrorMessage,
  isAuthError,
  isCMSError,
  isContentError,
  isDatabaseError,
  isNetworkError,
} from '../_lib/errors';

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export const CourseErrorBoundary: FC<ErrorProps> = ({ error, reset }) => {
  const router = useRouter();

  const handleAction = () => {
    if (isAuthError(error)) {
      // Redirect to login
      router.push('/auth/login');
    } else if (isNetworkError(error)) {
      // Try to reconnect
      reset();
    } else {
      // Default action is to retry
      reset();
    }
  };

  const getActionText = () => {
    if (isAuthError(error)) {
      return 'Sign In';
    }
    if (isNetworkError(error)) {
      return 'Reconnect';
    }
    if (isContentError(error) || isCMSError(error)) {
      return 'Go Back';
    }
    return 'Try Again';
  };

  const getIcon = () => {
    if (isAuthError(error)) {
      return (
        <svg
          className="h-6 w-6 text-yellow-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
          />
        </svg>
      );
    }
    if (isNetworkError(error)) {
      return (
        <svg
          className="h-6 w-6 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      );
    }
    return (
      <svg
        className="h-6 w-6 text-red-400"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
    );
  };

  const getBackgroundColor = () => {
    if (isAuthError(error)) {
      return 'bg-yellow-50 dark:bg-yellow-900/20';
    }
    if (isDatabaseError(error) || isNetworkError(error)) {
      return 'bg-red-50 dark:bg-red-900/20';
    }
    return 'bg-orange-50 dark:bg-orange-900/20';
  };

  const getTextColor = () => {
    if (isAuthError(error)) {
      return 'text-yellow-800 dark:text-yellow-200';
    }
    if (isDatabaseError(error) || isNetworkError(error)) {
      return 'text-red-800 dark:text-red-200';
    }
    return 'text-orange-800 dark:text-orange-200';
  };

  const getButtonColor = () => {
    if (isAuthError(error)) {
      return 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100 focus:ring-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-200 dark:hover:bg-yellow-900/30';
    }
    if (isDatabaseError(error) || isNetworkError(error)) {
      return 'bg-red-50 text-red-800 hover:bg-red-100 focus:ring-red-600 dark:bg-red-900/20 dark:text-red-200 dark:hover:bg-red-900/30';
    }
    return 'bg-orange-50 text-orange-800 hover:bg-orange-100 focus:ring-orange-600 dark:bg-orange-900/20 dark:text-orange-200 dark:hover:bg-orange-900/30';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className={`rounded-lg p-6 ${getBackgroundColor()}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">{getIcon()}</div>
          <div className="ml-3">
            <h3 className={`text-lg font-medium ${getTextColor()}`}>
              {error.name === 'AuthError'
                ? 'Authentication Required'
                : 'Something went wrong'}
            </h3>
            <div className={`mt-2 text-sm ${getTextColor()}`}>
              <p>{getUserFriendlyErrorMessage(error)}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={handleAction}
                className={`rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${getButtonColor()}`}
              >
                {getActionText()}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseErrorBoundary;
