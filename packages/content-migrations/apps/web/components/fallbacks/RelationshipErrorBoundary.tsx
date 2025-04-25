
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
  
  WrappedComponent.displayName = `withRelationshipErrorBoundary(${
    Component.displayName || Component.name || 'Component'
  })`;
  
  return WrappedComponent;
}
