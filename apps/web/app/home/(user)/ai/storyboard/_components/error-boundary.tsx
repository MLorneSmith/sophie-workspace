"use client";

import { Component, type ReactNode } from "react";

// Client-safe logger wrapper
const logger = {
	error: (...args: unknown[]) => {
		if (process.env.NODE_ENV === "development") {
			// biome-ignore lint/suspicious/noConsole: Development logging is allowed
			console.error(...args);
		}
	},
};

interface Props {
	children: ReactNode;
	fallback: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(_error: Error) {
		logger.error("Error caught by boundary:", _error);
	}

	render() {
		if (this.state.hasError) {
			return this.props.fallback;
		}

		return this.props.children;
	}
}
