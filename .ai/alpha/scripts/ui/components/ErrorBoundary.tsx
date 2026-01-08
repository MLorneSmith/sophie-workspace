import type React from "react";
import { Component, type ReactNode } from "react";
import { Box, Text } from "ink";

/**
 * Error boundary props
 */
interface ErrorBoundaryProps {
	/** Child components to wrap */
	children: ReactNode;
	/** Optional fallback UI to display on error */
	fallback?: ReactNode;
	/** Optional error handler callback */
	onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
	/** Component name for error context */
	componentName?: string;
}

/**
 * Error boundary state
 */
interface ErrorBoundaryState {
	hasError: boolean;
	error?: Error;
	errorInfo?: React.ErrorInfo;
}

/**
 * Error boundary component for graceful error handling
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of the
 * component tree that crashed.
 *
 * @example
 * ```tsx
 * <ErrorBoundary componentName="SandboxGrid">
 *   <SandboxGrid sandboxes={state.sandboxes} />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	/**
	 * Update state when an error is caught
	 */
	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	/**
	 * Log error details
	 */
	override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
		this.setState({ errorInfo });

		// Call optional error handler
		this.props.onError?.(error, errorInfo);
	}

	override render(): ReactNode {
		if (this.state.hasError) {
			// Use custom fallback if provided
			if (this.props.fallback) {
				return this.props.fallback;
			}

			// Default error UI
			return (
				<Box
					flexDirection="column"
					borderStyle="single"
					borderColor="red"
					padding={1}
				>
					<Text bold color="red">
						Component Error
						{this.props.componentName && ` (${this.props.componentName})`}
					</Text>
					<Box marginTop={1}>
						<Text color="red">
							{this.state.error?.message ?? "Unknown error"}
						</Text>
					</Box>
					{this.state.error?.stack && (
						<Box marginTop={1}>
							<Text dimColor wrap="truncate-end">
								{this.state.error.stack.split("\n").slice(0, 3).join("\n")}
							</Text>
						</Box>
					)}
				</Box>
			);
		}

		return this.props.children;
	}
}

/**
 * Minimal error fallback component
 */
export const MinimalErrorFallback: React.FC<{ message?: string }> = ({
	message = "Error loading component",
}) => (
	<Box paddingX={1}>
		<Text color="red">{message}</Text>
	</Box>
);

/**
 * Error boundary specifically for sandbox columns
 * Shows a minimal error state that fits the grid layout
 */
export const SandboxErrorBoundary: React.FC<{
	children: ReactNode;
	label: string;
}> = ({ children, label }) => (
	<ErrorBoundary
		componentName={`Sandbox ${label}`}
		fallback={
			<Box
				flexDirection="column"
				borderStyle="round"
				borderColor="red"
				paddingX={1}
				width="33%"
				minWidth={30}
			>
				<Box justifyContent="space-between">
					<Text bold color="cyan">
						{label}
					</Text>
					<Text color="red">Error</Text>
				</Box>
				<Text dimColor>Component crashed</Text>
			</Box>
		}
	>
		{children}
	</ErrorBoundary>
);
