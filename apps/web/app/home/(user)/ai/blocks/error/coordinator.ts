import { createServiceLogger } from "@kit/shared/logger";

// Initialize service logger
const { getLogger } = createServiceLogger("HOME-(USER)");

type ErrorHandler = (error: Error) => Promise<boolean>;

export class ErrorCoordinator {
	private handlers = new Map<string, ErrorHandler>();
	private globalHandlers: ErrorHandler[] = [];

	register(component: string, handler: ErrorHandler): () => void {
		this.handlers.set(component, handler);
		return () => {
			this.handlers.delete(component);
		};
	}

	registerGlobal(handler: ErrorHandler): () => void {
		this.globalHandlers.push(handler);
		return () => {
			const index = this.globalHandlers.indexOf(handler);
			if (index > -1) {
				this.globalHandlers.splice(index, 1);
			}
		};
	}

	async handleError(error: Error, component?: string): Promise<void> {
		// First try component-specific handler
		if (component && this.handlers.has(component)) {
			const handled = await this.handlers.get(component)?.(error);
			if (handled) return;
		}

		// Then try global handlers
		for (const handler of this.globalHandlers) {
			const handled = await handler(error);
			if (handled) return;
		}

		// If no handler handled it, log to console
		// TODO: Async logger needed
		// (await getLogger()).error("Unhandled error:", {
			data: error,
		});
	}

	clear(): void {
		this.handlers.clear();
		this.globalHandlers = [];
	}
}
