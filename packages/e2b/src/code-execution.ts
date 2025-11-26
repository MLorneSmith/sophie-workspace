import "server-only";

import type { Sandbox } from "@e2b/code-interpreter";
import { createServiceLogger } from "@kit/shared/logger";

import { ExecutionError, ExecutionTimeoutError, wrapError } from "./errors";
import type {
	CodeExecutionOptions,
	ExecutionResult,
	SupportedLanguage,
} from "./types";

const { getLogger } = createServiceLogger("E2B");

export async function executeCode(
	sandbox: Sandbox,
	code: string,
	options: CodeExecutionOptions = {},
): Promise<ExecutionResult> {
	const logger = await getLogger();
	const {
		language = "python",
		timeoutMs = 60000,
		onStdout,
		onStderr,
	} = options;

	logger.info("Executing code", {
		sandboxId: sandbox.sandboxId,
		language,
		codeLength: code.length,
		timeoutMs,
	});

	try {
		const execution = await sandbox.runCode(code, {
			language,
			timeoutMs,
			onStdout: onStdout ? (output) => onStdout(output.line) : undefined,
			onStderr: onStderr ? (output) => onStderr(output.line) : undefined,
		});

		const result: ExecutionResult = {
			stdout: execution.logs.stdout.join("\n"),
			stderr: execution.logs.stderr.join("\n"),
			results: execution.results.map((r) => ({
				type: r.formats()[0] ?? "unknown",
				data: r.data,
				text: r.text,
			})),
			error: execution.error
				? {
						name: execution.error.name,
						value: execution.error.value,
						traceback: execution.error.traceback,
					}
				: undefined,
		};

		if (result.error) {
			logger.warn("Code execution completed with error", {
				sandboxId: sandbox.sandboxId,
				errorName: result.error.name,
				errorValue: result.error.value,
			});
		} else {
			logger.info("Code execution completed successfully", {
				sandboxId: sandbox.sandboxId,
				stdoutLength: result.stdout.length,
				stderrLength: result.stderr.length,
				resultsCount: result.results.length,
			});
		}

		return result;
	} catch (error) {
		logger.error("Code execution failed", {
			sandboxId: sandbox.sandboxId,
			error,
		});

		if (
			error instanceof Error &&
			error.message.toLowerCase().includes("timeout")
		) {
			throw new ExecutionTimeoutError(timeoutMs);
		}

		throw wrapError(error, "Code execution failed");
	}
}

export async function executePython(
	sandbox: Sandbox,
	code: string,
	options: Omit<CodeExecutionOptions, "language"> = {},
): Promise<ExecutionResult> {
	return executeCode(sandbox, code, { ...options, language: "python" });
}

export async function executeJavaScript(
	sandbox: Sandbox,
	code: string,
	options: Omit<CodeExecutionOptions, "language"> = {},
): Promise<ExecutionResult> {
	return executeCode(sandbox, code, { ...options, language: "javascript" });
}

export async function executeR(
	sandbox: Sandbox,
	code: string,
	options: Omit<CodeExecutionOptions, "language"> = {},
): Promise<ExecutionResult> {
	return executeCode(sandbox, code, { ...options, language: "r" });
}

export async function executeWithRetry(
	sandbox: Sandbox,
	code: string,
	options: CodeExecutionOptions & {
		maxRetries?: number;
		retryDelayMs?: number;
	} = {},
): Promise<ExecutionResult> {
	const logger = await getLogger();
	const { maxRetries = 3, retryDelayMs = 1000, ...execOptions } = options;

	let lastError: Error | undefined;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await executeCode(sandbox, code, execOptions);
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			if (attempt < maxRetries) {
				logger.warn("Code execution failed, retrying", {
					attempt,
					maxRetries,
					error: lastError.message,
				});
				await new Promise((resolve) =>
					setTimeout(resolve, retryDelayMs * attempt),
				);
			}
		}
	}

	throw new ExecutionError(
		`Code execution failed after ${maxRetries} attempts: ${lastError?.message}`,
		{
			stderr: lastError?.message,
		},
	);
}

export function isExecutionSuccessful(result: ExecutionResult): boolean {
	return !result.error && result.stderr.length === 0;
}

export function getLanguageFromExtension(filename: string): SupportedLanguage {
	const ext = filename.split(".").pop()?.toLowerCase();

	switch (ext) {
		case "py":
			return "python";
		case "js":
		case "ts":
		case "mjs":
		case "cjs":
			return "javascript";
		case "r":
			return "r";
		default:
			return "python";
	}
}
