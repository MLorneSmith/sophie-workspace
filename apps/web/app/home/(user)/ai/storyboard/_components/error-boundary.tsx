"use client";

import { Component, type ReactNode } from "react";

import { type Logger, getLogger } from "@kit/shared/logger";

interface Props {
	children: ReactNode;
	fallback: (error: Error | null) => ReactNode;
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

	componentDidCatch(error: Error) {
		getLogger().then((logger: Logger) => {
			logger.error(error, "Error caught by boundary");
		});
	}

	render() {
		if (this.state.hasError) {
			return this.props.fallback(this.state.error);
		}

		return this.props.children;
	}
}
