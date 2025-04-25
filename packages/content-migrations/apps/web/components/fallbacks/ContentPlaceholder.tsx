
'use client';

import React from 'react';

/**
 * Component that provides a placeholder for content
 * when the real content fails to load
 */
export const ContentPlaceholder: React.FC<{
  type: 'text' | 'title' | 'paragraph' | 'image' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
  children?: React.ReactNode; // Optional children to display instead of default skeleton
  message?: string; // Custom message to display
}> = ({ 
  type, 
  width = 'auto', 
  height = 'auto', 
  lines = 3, 
  className = '',
  children,
  message
}) => {
  // If children are provided, return them with a notification badge
  if (children) {
    return (
      <div className={`relative ${className}`} style={{ width, height }}>
        <div className="opacity-70">{children}</div>
        <div className="absolute top-0 right-0 bg-amber-100 text-amber-800 px-2 py-1 text-xs rounded">
          {message || 'Fallback content'}
        </div>
      </div>
    );
  }
  
  // Otherwise return appropriate skeleton loader based on type
  return (
    <div 
      className={`animate-pulse ${className}`} 
      aria-label="Loading content"
      style={{ width, height }}
    >
      {type === 'title' && (
        <div className="h-7 bg-gray-200 rounded w-3/4 mb-4"></div>
      )}
      
      {type === 'text' && (
        <div className="h-4 bg-gray-200 rounded w-full"></div>
      )}
      
      {type === 'paragraph' && (
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <div 
              key={i} 
              className="h-4 bg-gray-200 rounded" 
              style={{ width: `${100 - (i * 5)}%` }}
            ></div>
          ))}
        </div>
      )}
      
      {type === 'image' && (
        <div className="flex items-center justify-center bg-gray-200 rounded" style={{ height: height || '200px' }}>
          <svg className="w-12 h-12 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 16H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h12c.55 0 1 .45 1 1v12c0 .55-.45 1-1 1zm-4.44-6.44l-2.35 3.02-1.56-1.88c-.2-.25-.58-.24-.78.01l-1.74 2.23c-.2.25-.02.61.29.61h8.98c.3 0 .48-.36.29-.61l-2.55-3.21c-.19-.26-.59-.26-.78 0z" />
          </svg>
        </div>
      )}
      
      {type === 'card' && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="h-24 bg-gray-200 rounded mb-4"></div>
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${90 - (i * 10)}%` }}></div>
            ))}
          </div>
        </div>
      )}
      
      {message && (
        <div className="mt-2 text-xs text-center text-gray-500">
          {message}
        </div>
      )}
    </div>
  );
};
