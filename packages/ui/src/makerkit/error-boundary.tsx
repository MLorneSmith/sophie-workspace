"use client";

import React, { type ReactNode } from "react";

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: (error: Error, reset: () => void) => ReactNode;
	onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

/**
 * Error Boundary Component
 *
 * Catches errors during render and displays a fallback UI.
 * Used to handle Performance API errors and other render-time issues.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary fallback={(error, reset) => <div>Error: {error.message}</div>}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
		};
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return {
			hasError: true,
			error,
		};
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
		if (this.props.onError) {
			this.props.onError(error, errorInfo);
		}

		if (process.env.NODE_ENV === "development") {
			// biome-ignore lint/suspicious/noConsole: Intentional error logging for debugging
			console.error("Error caught by boundary:", error, errorInfo);
		}
	}

	handleReset = (): void => {
		this.setState({
			hasError: false,
			error: null,
		});
	};

	render(): ReactNode {
		if (this.state.hasError && this.state.error) {
			if (this.props.fallback) {
				return this.props.fallback(this.state.error, this.handleReset);
			}

			// Default fallback UI
			return (
				<div style={{ padding: "20px", textAlign: "center" }}>
					<h2>Something went wrong</h2>
					<details style={{ whiteSpace: "pre-wrap", marginTop: "10px" }}>
						{this.state.error.toString()}
					</details>
					<button
						type="button"
						onClick={this.handleReset}
						style={{
							marginTop: "10px",
							padding: "8px 16px",
							cursor: "pointer",
						}}
					>
						Try again
					</button>
				</div>
			);
		}

		return this.props.children;
	}
}
