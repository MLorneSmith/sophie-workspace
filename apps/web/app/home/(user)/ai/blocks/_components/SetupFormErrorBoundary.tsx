'use client';

import * as React from 'react';
import { type ReactNode } from 'react';

import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';

import { useError } from '../error/ErrorContext';
import { isAuthError, isConnectionError } from '../lib/error-utils';

const ERROR_MESSAGES = {
  AUTH_ERROR: 'Your session has expired. Please refresh and try again.',
  LOAD_FAILED:
    'Failed to load the form. Please check your connection and try again.',
  RECOVERY_NEEDED:
    'An error occurred while setting up the form. Attempting to recover...',
  INVALID_STATE: 'The form is in an invalid state. Please refresh the page.',
};

const LOADING_MESSAGES = {
  INITIAL: 'Loading form...',
  RECOVERING: 'Recovering from error...',
};

export interface FallbackProps {
  error: Error;
  resetError: () => void;
}

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<FallbackProps> | ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: any[];
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isRecovering: boolean;
  retryCount: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export class SetupFormErrorBoundary extends React.Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isRecovering: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      isRecovering: false,
      retryCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Use error context to handle errors
    const { coordinator } = useError();
    coordinator.handleError(error, this.props.componentName);

    // Log error
    console.error('SetupFormErrorBoundary caught an error:', error, errorInfo);

    // Call onError prop if provided
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError) {
      const hasResetKeysChanged = (this.props.resetKeys || []).some(
        (key, index) => key !== (prevProps.resetKeys || [])[index],
      );

      if (hasResetKeysChanged) {
        this.reset();
      }
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  scheduleRetry = () => {
    if (this.state.retryCount >= MAX_RETRIES) {
      return;
    }

    this.setState({ isRecovering: true });

    this.retryTimeoutId = setTimeout(
      () => {
        this.reset();
        this.setState((prevState) => ({
          retryCount: prevState.retryCount + 1,
        }));
      },
      RETRY_DELAY * Math.pow(2, this.state.retryCount),
    );
  };

  reset = async () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    this.setState({ isRecovering: true });

    try {
      // Add a small delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // If it's a connection error, reload the page
      if (this.state.error && isConnectionError(this.state.error)) {
        window.location.reload();
        return;
      }

      this.setState({
        hasError: false,
        error: null,
        isRecovering: false,
      });
    } catch (error) {
      this.setState({
        hasError: true,
        error: error as Error,
        isRecovering: false,
      });
    }
  };

  getErrorMessage = (): string => {
    if (!this.state.error) return ERROR_MESSAGES.INVALID_STATE;

    if (isAuthError(this.state.error)) {
      return ERROR_MESSAGES.AUTH_ERROR;
    }

    if (isConnectionError(this.state.error)) {
      return ERROR_MESSAGES.LOAD_FAILED;
    }

    return this.state.error.message || ERROR_MESSAGES.INVALID_STATE;
  };

  render() {
    const componentName = this.props.componentName || 'setup-form';

    if (this.state.isRecovering) {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
              <p className="text-muted-foreground mt-4 text-center text-sm">
                {LOADING_MESSAGES.RECOVERING}
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        if (React.isValidElement(this.props.fallback)) {
          return this.props.fallback;
        }

        const FallbackComponent = this.props
          .fallback as React.ComponentType<FallbackProps>;
        return (
          <FallbackComponent error={this.state.error} resetError={this.reset} />
        );
      }

      const isAuth = isAuthError(this.state.error);
      const isConnection = isConnectionError(this.state.error);

      return (
        <Card
          className="bg-background/95 supports-[backdrop-filter]:bg-background/60 w-full max-w-md backdrop-blur"
          data-testid={`${componentName}-error`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="text-destructive h-5 w-5" />
              {isAuth
                ? 'Authentication Error'
                : isConnection
                  ? 'Connection Error'
                  : 'Form Error'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {isAuth
                  ? 'Session Expired'
                  : isConnection
                    ? 'Loading Failed'
                    : 'Error'}
              </AlertTitle>
              <AlertDescription>{this.getErrorMessage()}</AlertDescription>
            </Alert>
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={this.reset}
                className="mt-2 flex items-center gap-2"
                disabled={this.state.isRecovering}
                data-testid={`${componentName}-retry`}
              >
                {this.state.isRecovering ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {isAuth ? 'Retry' : isConnection ? 'Reload' : 'Try again'}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withSetupFormErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>,
) {
  return function WithSetupFormErrorBoundary(props: P) {
    return (
      <SetupFormErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </SetupFormErrorBoundary>
    );
  };
}
