export interface CircuitBreakerOptions {
	failureThreshold?: number;
	resetTimeMs?: number;
}

type CircuitState = "closed" | "open" | "half-open";

const DEFAULT_OPTIONS: Required<CircuitBreakerOptions> = {
	failureThreshold: 5,
	resetTimeMs: 60_000,
};

export class CircuitBreakerOpenError extends Error {
	public readonly retryAfterMs: number;

	constructor(name: string, retryAfterMs: number) {
		const ms = Math.max(0, Math.ceil(retryAfterMs));
		super(`Circuit "${name}" is open. Retry after ${ms}ms.`);
		this.name = "CircuitBreakerOpenError";
		this.retryAfterMs = ms;
	}
}

export class CircuitBreaker {
	private readonly failureThreshold: number;
	private readonly resetTimeMs: number;
	private failureCount = 0;
	private openedAtMs: number | null = null;
	private halfOpenProbeInFlight = false;
	private internalState: CircuitState = "closed";

	constructor(
		private readonly name: string,
		options: CircuitBreakerOptions = {},
	) {
		this.failureThreshold =
			options.failureThreshold ?? DEFAULT_OPTIONS.failureThreshold;
		this.resetTimeMs = options.resetTimeMs ?? DEFAULT_OPTIONS.resetTimeMs;
	}

	get state(): CircuitState {
		if (
			this.internalState === "open" &&
			this.openedAtMs !== null &&
			Date.now() - this.openedAtMs >= this.resetTimeMs
		) {
			return "half-open";
		}

		return this.internalState;
	}

	reset(): void {
		this.failureCount = 0;
		this.openedAtMs = null;
		this.halfOpenProbeInFlight = false;
		this.internalState = "closed";
	}

	async execute<T>(fn: () => Promise<T>): Promise<T> {
		if (this.internalState === "open") {
			if (this.canTransitionToHalfOpen()) {
				this.internalState = "half-open";
			} else {
				throw new CircuitBreakerOpenError(this.name, this.getRemainingOpenMs());
			}
		}

		if (this.internalState === "half-open") {
			if (this.halfOpenProbeInFlight) {
				throw new CircuitBreakerOpenError(
					this.name,
					Math.max(1000, this.getRemainingOpenMs()),
				);
			}

			this.halfOpenProbeInFlight = true;

			try {
				const result = await fn();
				this.reset();
				return result;
			} catch (error) {
				this.openCircuit();
				throw error;
			} finally {
				this.halfOpenProbeInFlight = false;
			}
		}

		try {
			const result = await fn();
			this.failureCount = 0;
			return result;
		} catch (error) {
			this.failureCount += 1;
			if (this.failureCount >= this.failureThreshold) {
				this.openCircuit();
			}
			throw error;
		}
	}

	private openCircuit(): void {
		this.internalState = "open";
		this.failureCount = this.failureThreshold;
		this.openedAtMs = Date.now();
		this.halfOpenProbeInFlight = false;
	}

	private canTransitionToHalfOpen(): boolean {
		return (
			this.openedAtMs !== null &&
			Date.now() - this.openedAtMs >= this.resetTimeMs
		);
	}

	private getRemainingOpenMs(): number {
		if (this.openedAtMs === null) {
			return this.resetTimeMs;
		}

		const elapsedMs = Date.now() - this.openedAtMs;
		return Math.max(0, this.resetTimeMs - elapsedMs);
	}
}
