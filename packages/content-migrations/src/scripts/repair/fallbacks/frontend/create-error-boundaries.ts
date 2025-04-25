/// <reference types="node" />
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { getLogger } from '../../../../utils/logging.js';

// Create logger for frontend components
const logger = getLogger('fallbacks:frontend');

/**
 * Creates React error boundary components for frontend relationship issues.
 * These components provide graceful fallbacks for content display when
 * relationship data is missing or corrupted.
 */
export async function createErrorBoundaries() {
  logger.info('Creating frontend error boundary components...', {
    module: 'fallbacks',
    component: 'frontend',
  });

  try {
    // Create directory for frontend fallback components
    const componentsDir = path.join(
      process.cwd(),
      'apps/web/components/fallbacks',
    );
    if (!fs.existsSync(componentsDir)) {
      fs.mkdirSync(componentsDir, { recursive: true });
    }

    // Create relationship error boundary component
    const errorBoundaryPath = path.join(
      componentsDir,
      'RelationshipErrorBoundary.tsx',
    );
    const errorBoundaryContent = `
'use client';

import React, { ErrorInfo } from 'react';

interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ComponentType<FallbackProps> | React.ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  relationshipType?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

const DefaultFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => (
  <div className="py-4 px-6 bg-gray-50 rounded-lg border border-gray-200">
    <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
    <p className="text-sm text-gray-500 mb-4">{error.message}</p>
    <button
      onClick={resetErrorBoundary}
      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
    >
      Try again
    </button>
  </div>
);

/**
 * Error boundary component for relationship issues in the frontend
 * Provides graceful fallbacks for content display
 */
export class RelationshipErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
    this.resetErrorBoundary = this.resetErrorBoundary.bind(this);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('RelationshipErrorBoundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Send error to server logging endpoint
    try {
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message,
          stack: error.stack,
          type: 'relationship',
          relationshipType: this.props.relationshipType || 'unknown',
          componentStack: errorInfo.componentStack,
          url: window.location.href
        })
      });
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  }

  resetErrorBoundary() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      if (React.isValidElement(fallback)) {
        return fallback;
      }
      
      if (typeof fallback === 'function') {
        const FallbackComponent = fallback as React.ComponentType<FallbackProps>;
        return <FallbackComponent error={error} resetErrorBoundary={this.resetErrorBoundary} />;
      }
      
      return <DefaultFallback error={error} resetErrorBoundary={this.resetErrorBoundary} />;
    }

    return children;
  }
}

/**
 * Higher order component to wrap components with relationship error boundary
 */
export function withRelationshipErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    fallback?: React.ComponentType<FallbackProps> | React.ReactNode;
    relationshipType?: string;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  } = {}
) {
  const { 
    fallback = DefaultFallback, 
    relationshipType, 
    onError 
  } = options;
  
  const WrappedComponent: React.FC<P> = (props) => (
    <RelationshipErrorBoundary
      fallback={fallback}
      relationshipType={relationshipType}
      onError={onError}
    >
      <Component {...props} />
    </RelationshipErrorBoundary>
  );
  
  WrappedComponent.displayName = \`withRelationshipErrorBoundary(\${
    Component.displayName || Component.name || 'Component'
  })\`;
  
  return WrappedComponent;
}
`;

    fs.writeFileSync(errorBoundaryPath, errorBoundaryContent);
    logger.info(`Created relationship error boundary at ${errorBoundaryPath}`, {
      module: 'fallbacks',
      component: 'frontend',
    });

    // Create media fallback component
    const mediaFallbackPath = path.join(componentsDir, 'MediaFallback.tsx');
    const mediaFallbackContent = `
'use client';

import Image from 'next/image';
import React, { useState } from 'react';

/**
 * Component that provides fallbacks for media files
 * with automatic fallback to placeholder images
 */
export const MediaFallback: React.FC<{
  src: string;
  alt: string;
  width: number;
  height: number;
  fallbackSrc?: string;
  className?: string;
}> = ({ 
  src, 
  alt, 
  width, 
  height, 
  fallbackSrc = '/assets/fallbacks/image-placeholder.webp',
  className = '' 
}) => {
  const [error, setError] = useState(false);
  
  // Use the original source if no error, otherwise use fallback
  const imageSrc = !error ? src : fallbackSrc;
  
  return (
    <div className={\`relative \${className}\`}>
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        onError={() => setError(true)}
        className={\`\${error ? 'opacity-70' : ''} transition-opacity\`}
      />
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm text-gray-500 bg-white/80 px-2 py-1 rounded">
            Image unavailable
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Component that provides fallbacks for downloadable files
 * with automatic fallback to placeholder content
 */
export const DownloadFallback: React.FC<{
  href: string;
  filename: string;
  fallbackHref?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ 
  href, 
  filename, 
  fallbackHref = '/assets/fallbacks/download-placeholder.pdf',
  children,
  className = ''
}) => {
  const [error, setError] = useState(false);
  
  // Use the original href if no error, otherwise use fallback
  const downloadHref = !error ? href : fallbackHref;
  
  // Check if the file exists before download
  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (error) return; // Already using fallback
    
    e.preventDefault();
    
    try {
      // Attempt a HEAD request to check if file exists
      const response = await fetch(href, { method: 'HEAD' });
      
      if (!response.ok) {
        // File doesn't exist, use fallback
        setError(true);
        window.location.href = fallbackHref;
      } else {
        // File exists, proceed with download
        window.location.href = href;
      }
    } catch {
      // Network error, use fallback
      setError(true);
      window.location.href = fallbackHref;
    }
  };
  
  return (
    <a
      href={downloadHref}
      download={filename}
      onClick={!error ? handleClick : undefined}
      className={\`\${className} \${error ? 'opacity-70' : ''}\`}
    >
      {children}
      {error && (
        <span className="ml-2 text-sm text-gray-500 bg-white/80 px-2 py-1 rounded">
          Using fallback
        </span>
      )}
    </a>
  );
};
`;

    fs.writeFileSync(mediaFallbackPath, mediaFallbackContent);
    logger.info(`Created media fallback component at ${mediaFallbackPath}`, {
      module: 'fallbacks',
      component: 'frontend',
    });

    // Create content placeholder component
    const contentPlaceholderPath = path.join(
      componentsDir,
      'ContentPlaceholder.tsx',
    );
    const contentPlaceholderContent = `
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
      <div className={\`relative \${className}\`} style={{ width, height }}>
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
      className={\`animate-pulse \${className}\`} 
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
              style={{ width: \`\${100 - (i * 5)}%\` }}
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
              <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: \`\${90 - (i * 10)}%\` }}></div>
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
`;

    fs.writeFileSync(contentPlaceholderPath, contentPlaceholderContent);
    logger.info(
      `Created content placeholder component at ${contentPlaceholderPath}`,
      { module: 'fallbacks', component: 'frontend' },
    );

    // Create components index
    const indexPath = path.join(componentsDir, 'index.ts');
    const indexContent = `
/**
 * Frontend components for fallback and error handling
 */

export {
  RelationshipErrorBoundary,
  withRelationshipErrorBoundary,
} from './RelationshipErrorBoundary';
export { MediaFallback, DownloadFallback } from './MediaFallback';
export { ContentPlaceholder } from './ContentPlaceholder';

/**
 * Initialize fallback components
 * This should be called in the app's main layout
 */
export function initializeFallbacks() {
  if (typeof window === 'undefined') return;

  // Register error handlers
  window.addEventListener('error', (event) => {
    // If the error is a relationship error, log it
    if (
      event.error?.message?.includes('relationship') ||
      event.message?.includes('relationship')
    ) {
      try {
        fetch('/api/log-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: event.error?.message || event.message,
            stack: event.error?.stack,
            type: 'relationship',
            url: window.location.href,
          }),
        }).catch(console.error);
      } catch (error) {
        console.error('Failed to log error:', error);
      }
    }
  });

  // Add a fetch interceptor to handle S3/R2 404 errors
  const originalFetch = window.fetch;
  window.fetch = async function(input, init) {
    try {
      const response = await originalFetch(input, init);
      
      // If this is a media file (likely from S3/R2) and it's a 404, look for a fallback
      if (
        !response.ok && 
        response.status === 404 &&
        typeof input === 'string' &&
        (
          input.includes('.jpg') || 
          input.includes('.png') || 
          input.includes('.webp') || 
          input.includes('.pdf') ||
          input.includes('download') ||
          input.includes('uploads') ||
          input.includes('.mp4')
        )
      ) {
        console.warn(\`Resource not found: \${input}, attempting fallback\`);
        
        // Try to fetch a fallback URL instead
        const fallbackUrl = input.includes('.pdf') 
          ? '/assets/fallbacks/download-placeholder.pdf'
          : '/assets/fallbacks/image-placeholder.webp';
          
        // Only try the fallback if it's different from the original
        if (fallbackUrl !== input) {
          try {
            const fallbackResponse = await originalFetch(fallbackUrl);
            if (fallbackResponse.ok) {
              console.log(\`Using fallback for \${input}: \${fallbackUrl}\`);
              return fallbackResponse;
            }
          } catch (fallbackError) {
            console.error('Error fetching fallback:', fallbackError);
          }
        }
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };
}
`;

    fs.writeFileSync(indexPath, indexContent);
    logger.info(`Created components index at ${indexPath}`, {
      module: 'fallbacks',
      component: 'frontend',
    });

    // Create error logging API route
    const apiLogDir = path.join(process.cwd(), 'apps/web/app/api/log-error');
    if (!fs.existsSync(apiLogDir)) {
      fs.mkdirSync(apiLogDir, { recursive: true });
    }

    const apiRoutePath = path.join(apiLogDir, 'route.ts');
    const apiRouteContent = `
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@kit/shared/logger';

/**
 * API route to log frontend errors for monitoring
 */
export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json();
    
    // Create logging context
    const ctx = {
      service: 'frontend',
      type: errorData.type || 'unknown',
      url: errorData.url || 'unknown',
      relationshipType: errorData.relationshipType || 'unknown',
    };
    
    // Log the error
    logger.error(ctx, \`Frontend error: \${errorData.error}\`, {
      stack: errorData.stack,
      componentStack: errorData.componentStack,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ service: 'api' }, 'Error logging frontend error', { error });
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
`;

    fs.writeFileSync(apiRoutePath, apiRouteContent);
    logger.info(`Created error logging API route at ${apiRoutePath}`, {
      module: 'fallbacks',
      component: 'frontend',
    });

    return { success: true };
  } catch (error) {
    logger.error('Error creating frontend error boundary components', {
      module: 'fallbacks',
      component: 'frontend',
      error,
    });
    throw error;
  }
}

// If this script is run directly
// ES modules don't have a direct equivalent to require.main === module
// Use this pattern for direct execution detection
const isMainModule =
  typeof process !== 'undefined' &&
  process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  createErrorBoundaries()
    .then(() => {
      console.log('Frontend error boundary components created successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error(
        'Error creating frontend error boundary components:',
        error,
      );
      process.exit(1);
    });
}
