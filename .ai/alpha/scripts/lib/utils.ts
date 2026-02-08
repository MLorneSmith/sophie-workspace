/**

* Utility Functions
*
* Common utilities used across the orchestrator modules.
 */

/**

* Sleep for a specified number of milliseconds.
*
* @param ms - Milliseconds to sleep
* @returns Promise that resolves after the delay
 */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a promise with timeout protection.
 * If the promise doesn't resolve within the timeout, rejects with a timeout error.
 *
 * @param promise - Promise to execute
 * @param timeoutMs - Timeout in milliseconds
 * @param label - Label for logging and error messages
 * @returns Promise that resolves with the original result or rejects on timeout
 */
export async function withTimeout<T>(
	promise: Promise<T>,
	timeoutMs: number,
	label: string,
): Promise<T> {
	return Promise.race([
		promise,
		new Promise<T>((_, reject) =>
			setTimeout(() => {
				reject(new Error(`Timeout after ${timeoutMs}ms: ${label}`));
			}, timeoutMs),
		),
	]);
}

/**
 * Strip ANSI escape codes from text.
 * Removes terminal color codes, cursor movement, and other escape sequences.
 *
 * @param text - Text containing potential ANSI codes
 * @returns Text with ANSI codes removed
 */
export function stripAnsiCodes(text: string): string {
	// ANSI escape codes use ESC (0x1b) control character - biome-ignore required for each regex
	// biome-ignore lint/suspicious/noControlCharactersInRegex: Standard ANSI escape sequences ESC[...m (colors, formatting)
	const colorRegex = /\x1b\[[0-9;]*m/g;
	// biome-ignore lint/suspicious/noControlCharactersInRegex: Private mode sequences ESC[?...X (cursor modes, screen modes)
	const privateModeRegex = /\x1b\[\?[0-9;]*[A-Za-z]/g;
	// biome-ignore lint/suspicious/noControlCharactersInRegex: Other ANSI sequences ESC[...X (cursor movement, etc)
	const cursorRegex = /\x1b\[[0-9;]*[A-Za-z]/g;
	// Escaped bracket sequences from JSON output: ^[[...X
	const escapedBracketRegex = /\^\[\[[0-9;?]*[a-zA-Z]/g;
	// Alternative escape pattern with optional caret
	const altEscapeRegex = /\^?\[\[\??\d*[a-zA-Z]/g;

	return text
		.replace(colorRegex, "")
		.replace(privateModeRegex, "")
		.replace(cursorRegex, "")
		.replace(escapedBracketRegex, "")
		.replace(altEscapeRegex, "");
}
