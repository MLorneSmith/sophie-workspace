export interface RateLimiterOptions {
	maxTokensPerMinute?: number;
	maxRequestsPerMinute?: number;
}

type TokenEvent = {
	timestampMs: number;
	tokens: number;
};

const WINDOW_MS = 60_000;

const DEFAULT_OPTIONS: Required<RateLimiterOptions> = {
	maxTokensPerMinute: 100_000,
	maxRequestsPerMinute: 60,
};

function sleep(delayMs: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, delayMs);
	});
}

export class RateLimiter {
	private readonly maxTokensPerMinute: number;
	private readonly maxRequestsPerMinute: number;
	private readonly tokenEvents: TokenEvent[] = [];
	private readonly requestEvents: number[] = [];

	constructor(options: RateLimiterOptions = {}) {
		this.maxTokensPerMinute =
			options.maxTokensPerMinute ?? DEFAULT_OPTIONS.maxTokensPerMinute;
		this.maxRequestsPerMinute =
			options.maxRequestsPerMinute ?? DEFAULT_OPTIONS.maxRequestsPerMinute;
	}

	async acquire(estimatedTokens = 0): Promise<void> {
		const requestedTokens = Math.max(0, Math.ceil(estimatedTokens));
		if (requestedTokens > this.maxTokensPerMinute) {
			throw new Error(
				`Requested tokens (${requestedTokens}) exceed maxTokensPerMinute (${this.maxTokensPerMinute})`,
			);
		}

		while (true) {
			const nowMs = Date.now();
			this.pruneExpired(nowMs);

			if (this.hasCapacity(requestedTokens)) {
				this.requestEvents.push(nowMs);
				this.tokenEvents.push({
					timestampMs: nowMs,
					tokens: requestedTokens,
				});
				return;
			}

			const waitMs = this.getWaitTimeMs(nowMs, requestedTokens);
			await sleep(waitMs);
		}
	}

	get remaining(): { tokens: number; requests: number } {
		const nowMs = Date.now();
		this.pruneExpired(nowMs);

		const usedTokens = this.getUsedTokens();
		const usedRequests = this.requestEvents.length;

		return {
			tokens: Math.max(0, this.maxTokensPerMinute - usedTokens),
			requests: Math.max(0, this.maxRequestsPerMinute - usedRequests),
		};
	}

	private pruneExpired(nowMs: number): void {
		const cutoffMs = nowMs - WINDOW_MS;

		while (this.requestEvents.length > 0) {
			const oldestRequestMs = this.requestEvents[0];
			if (oldestRequestMs === undefined || oldestRequestMs > cutoffMs) {
				break;
			}

			this.requestEvents.shift();
		}

		while (this.tokenEvents.length > 0) {
			const oldestTokenEvent = this.tokenEvents[0];
			if (
				oldestTokenEvent === undefined ||
				oldestTokenEvent.timestampMs > cutoffMs
			) {
				break;
			}

			this.tokenEvents.shift();
		}
	}

	private getUsedTokens(): number {
		return this.tokenEvents.reduce((total, event) => total + event.tokens, 0);
	}

	private hasCapacity(requestedTokens: number): boolean {
		const requestCapacity =
			this.requestEvents.length < this.maxRequestsPerMinute;
		const tokenCapacity =
			this.getUsedTokens() + requestedTokens <= this.maxTokensPerMinute;

		return requestCapacity && tokenCapacity;
	}

	private getWaitTimeMs(nowMs: number, requestedTokens: number): number {
		const requestWaitMs = this.getRequestWaitMs(nowMs);
		const tokenWaitMs = this.getTokenWaitMs(nowMs, requestedTokens);
		return Math.max(1, requestWaitMs, tokenWaitMs);
	}

	private getRequestWaitMs(nowMs: number): number {
		if (this.requestEvents.length < this.maxRequestsPerMinute) {
			return 0;
		}

		const oldestRequestMs = this.requestEvents[0];
		if (oldestRequestMs === undefined) {
			return 0;
		}

		return Math.max(0, oldestRequestMs + WINDOW_MS - nowMs);
	}

	private getTokenWaitMs(nowMs: number, requestedTokens: number): number {
		const usedTokens = this.getUsedTokens();
		if (usedTokens + requestedTokens <= this.maxTokensPerMinute) {
			return 0;
		}

		let rollingTokens = usedTokens;
		for (const event of this.tokenEvents) {
			rollingTokens -= event.tokens;

			if (rollingTokens + requestedTokens <= this.maxTokensPerMinute) {
				return Math.max(0, event.timestampMs + WINDOW_MS - nowMs);
			}
		}

		return WINDOW_MS;
	}
}
