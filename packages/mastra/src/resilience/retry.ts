export interface RetryOptions {
	maxAttempts?: number;
	initialDelayMs?: number;
	maxDelayMs?: number;
	backoffMultiplier?: number;
	retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, "retryableErrors">> = {
	maxAttempts: 3,
	initialDelayMs: 1_000,
	maxDelayMs: 30_000,
	backoffMultiplier: 2,
};

const DEFAULT_RETRYABLE_PATTERNS = [
	"rate limit",
	"too many requests",
	"timeout",
	"timed out",
	"temporar",
	"unavailable",
	"service unavailable",
	"econnreset",
	"etimedout",
	"5xx",
	"internal server error",
];

const NON_RETRYABLE_PATTERNS = [
	"invalid api key",
	"authentication",
	"unauthorized",
	"forbidden",
	"validation",
	"invalid request",
	"bad request",
	"malformed",
];

type ErrorRecord = {
	code?: unknown;
	message?: unknown;
	name?: unknown;
	response?: {
		status?: unknown;
	};
	status?: unknown;
	statusCode?: unknown;
};

function sleep(delayMs: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, delayMs);
	});
}

function normalizeString(value: unknown): string {
	if (typeof value === "string") {
		return value;
	}

	if (value instanceof Error) {
		return value.message;
	}

	return String(value);
}

function getErrorRecord(error: unknown): ErrorRecord {
	if (!error || typeof error !== "object") {
		return {};
	}

	return error as ErrorRecord;
}

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	const record = getErrorRecord(error);
	if (typeof record.message === "string") {
		return record.message;
	}

	return normalizeString(error);
}

function getErrorStatus(error: unknown): number | undefined {
	const record = getErrorRecord(error);
	const candidates = [
		record.status,
		record.statusCode,
		record.response?.status,
	];

	for (const candidate of candidates) {
		if (typeof candidate === "number" && Number.isFinite(candidate)) {
			return candidate;
		}
	}

	return undefined;
}

function matchesPattern(message: string, patterns: string[]): boolean {
	const lowerMessage = message.toLowerCase();

	for (const pattern of patterns) {
		const normalizedPattern = pattern.trim();
		if (!normalizedPattern) {
			continue;
		}

		if (lowerMessage.includes(normalizedPattern.toLowerCase())) {
			return true;
		}
	}

	return false;
}

function isNonRetryableError(error: unknown): boolean {
	const status = getErrorStatus(error);
	if (
		status === 400 ||
		status === 401 ||
		status === 403 ||
		status === 404 ||
		status === 422
	) {
		return true;
	}

	const record = getErrorRecord(error);
	const name = normalizeString(record.name ?? "");
	if (name.toLowerCase().includes("zod")) {
		return true;
	}

	return matchesPattern(getErrorMessage(error), NON_RETRYABLE_PATTERNS);
}

function isRetryableError(error: unknown, retryableErrors?: string[]): boolean {
	if (isNonRetryableError(error)) {
		return false;
	}

	const status = getErrorStatus(error);
	if (
		status === 408 ||
		status === 409 ||
		status === 425 ||
		status === 429 ||
		(status !== undefined && status >= 500 && status <= 599)
	) {
		return true;
	}

	const message = getErrorMessage(error);
	const patterns =
		retryableErrors !== undefined
			? retryableErrors
			: DEFAULT_RETRYABLE_PATTERNS;

	if (matchesPattern(message, patterns)) {
		return true;
	}

	const record = getErrorRecord(error);
	const code = normalizeString(record.code ?? "");
	return /^(ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN)$/i.test(code);
}

function computeDelayMs(
	attemptNumber: number,
	initialDelayMs: number,
	maxDelayMs: number,
	backoffMultiplier: number,
): number {
	const exponentialDelay =
		initialDelayMs * backoffMultiplier ** Math.max(0, attemptNumber - 1);
	const boundedDelay = Math.min(maxDelayMs, exponentialDelay);
	const jitterFactor = 0.5 + Math.random();

	return Math.max(
		1,
		Math.min(maxDelayMs, Math.round(boundedDelay * jitterFactor)),
	);
}

export async function withRetry<T>(
	fn: () => Promise<T>,
	options: RetryOptions = {},
): Promise<T> {
	const maxAttempts = options.maxAttempts ?? DEFAULT_OPTIONS.maxAttempts;
	const initialDelayMs =
		options.initialDelayMs ?? DEFAULT_OPTIONS.initialDelayMs;
	const maxDelayMs = options.maxDelayMs ?? DEFAULT_OPTIONS.maxDelayMs;
	const backoffMultiplier =
		options.backoffMultiplier ?? DEFAULT_OPTIONS.backoffMultiplier;

	if (
		!Number.isFinite(maxAttempts) ||
		!Number.isInteger(maxAttempts) ||
		maxAttempts < 1
	) {
		throw new Error("Retry maxAttempts must be >= 1");
	}

	for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
		try {
			return await fn();
		} catch (error) {
			const shouldRetry = isRetryableError(error, options.retryableErrors);
			const canRetry = attempt < maxAttempts;

			if (!shouldRetry || !canRetry) {
				throw error;
			}

			const delayMs = computeDelayMs(
				attempt,
				initialDelayMs,
				maxDelayMs,
				backoffMultiplier,
			);

			// biome-ignore lint/suspicious/noConsole: Retry attempts must be logged for resilience diagnostics.
			console.warn(
				`[withRetry] retry ${attempt + 1}/${maxAttempts} in ${delayMs}ms: ${getErrorMessage(error)}`,
			);

			await sleep(delayMs);
		}
	}

	throw new Error("Retry failed without completing an attempt");
}
