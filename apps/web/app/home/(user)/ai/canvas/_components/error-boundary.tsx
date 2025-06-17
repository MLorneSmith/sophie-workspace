"use client";

import { Component, type ReactNode } from "react";

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

	componentDidCatch(error: Error) {
		// TODO: Async logger needed
		// (await getLogger()).error("Error caught by boundary:", {
		// data: error,
		// });
	}

	render() {
		if (this.state.hasError) {
			return this.props.fallback;
		}

		return this.props.children;
	}
}
