export class E2BError extends Error {
	constructor(
		message: string,
		public readonly code: E2BErrorCode,
		public readonly cause?: unknown,
	) {
		super(message);
		this.name = "E2BError";
	}
}

export type E2BErrorCode =
	| "AUTHENTICATION_ERROR"
	| "SANDBOX_CREATE_ERROR"
	| "SANDBOX_NOT_FOUND"
	| "EXECUTION_ERROR"
	| "EXECUTION_TIMEOUT"
	| "FILE_NOT_FOUND"
	| "FILE_OPERATION_ERROR"
	| "COMMAND_ERROR"
	| "RATE_LIMIT_ERROR"
	| "TEMPLATE_ERROR"
	| "UNKNOWN_ERROR";

export class AuthenticationError extends E2BError {
	constructor(message = "Invalid or missing E2B API key") {
		super(message, "AUTHENTICATION_ERROR");
		this.name = "AuthenticationError";
	}
}

export class SandboxCreateError extends E2BError {
	constructor(message: string, cause?: unknown) {
		super(message, "SANDBOX_CREATE_ERROR", cause);
		this.name = "SandboxCreateError";
	}
}

export class SandboxNotFoundError extends E2BError {
	constructor(sandboxId: string) {
		super(`Sandbox not found: ${sandboxId}`, "SANDBOX_NOT_FOUND");
		this.name = "SandboxNotFoundError";
	}
}

export class ExecutionError extends E2BError {
	constructor(
		message: string,
		public readonly executionDetails?: {
			stdout?: string;
			stderr?: string;
			exitCode?: number;
		},
	) {
		super(message, "EXECUTION_ERROR");
		this.name = "ExecutionError";
	}
}

export class ExecutionTimeoutError extends E2BError {
	constructor(timeoutMs: number) {
		super(`Execution timed out after ${timeoutMs}ms`, "EXECUTION_TIMEOUT");
		this.name = "ExecutionTimeoutError";
	}
}

export class FileNotFoundError extends E2BError {
	constructor(path: string) {
		super(`File not found: ${path}`, "FILE_NOT_FOUND");
		this.name = "FileNotFoundError";
	}
}

export class FileOperationError extends E2BError {
	constructor(operation: string, path: string, cause?: unknown) {
		super(
			`File ${operation} failed for: ${path}`,
			"FILE_OPERATION_ERROR",
			cause,
		);
		this.name = "FileOperationError";
	}
}

export class CommandError extends E2BError {
	constructor(
		command: string,
		public readonly exitCode: number,
		public readonly stderr?: string,
	) {
		super(
			`Command failed with exit code ${exitCode}: ${command}`,
			"COMMAND_ERROR",
		);
		this.name = "CommandError";
	}
}

export class RateLimitError extends E2BError {
	constructor(message = "E2B rate limit exceeded") {
		super(message, "RATE_LIMIT_ERROR");
		this.name = "RateLimitError";
	}
}

export class TemplateError extends E2BError {
	constructor(message: string, cause?: unknown) {
		super(message, "TEMPLATE_ERROR", cause);
		this.name = "TemplateError";
	}
}

export function isE2BError(error: unknown): error is E2BError {
	return error instanceof E2BError;
}

export function wrapError(error: unknown, defaultMessage: string): E2BError {
	if (isE2BError(error)) {
		return error;
	}

	const message = error instanceof Error ? error.message : defaultMessage;

	if (
		message.toLowerCase().includes("authentication") ||
		message.toLowerCase().includes("api key")
	) {
		return new AuthenticationError(message);
	}

	if (message.toLowerCase().includes("rate limit")) {
		return new RateLimitError(message);
	}

	return new E2BError(message, "UNKNOWN_ERROR", error);
}
