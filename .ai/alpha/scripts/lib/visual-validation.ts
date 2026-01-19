/**
 * Visual Validation Utilities for Alpha Workflow
 *
 * Provides agent-browser integration for validating UI implementations
 * during the Alpha autonomous coding workflow.
 */

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration for visual verification of a UI task
 */
export interface VisualVerificationConfig {
	/** Route to navigate to for verification (e.g., "/home/dashboard") */
	route: string;
	/** Base URL for the dev server (default: http://localhost:3000) */
	baseUrl?: string;
	/** Milliseconds to wait after page load before verification (default: 3000) */
	waitMs?: number;
	/** Visual checks to perform */
	checks?: VisualCheck[];
	/** Whether to capture a screenshot (default: true) */
	screenshot?: boolean;
	/** Directory to store screenshots and snapshots */
	outputDir?: string;
	/** Timeout in milliseconds for the entire verification (default: 30000) */
	timeoutMs?: number;
}

/**
 * A single visual check to perform
 */
export interface VisualCheck {
	/** The type of check to perform */
	command: "is visible" | "find role" | "find label" | "find text" | "snapshot";
	/** Target element text or role */
	target?: string;
	/** Additional flags for the command */
	flags?: string;
}

/**
 * Result of a visual verification run
 */
export interface VisualVerificationResult {
	/** Whether all checks passed */
	passed: boolean;
	/** Path to the captured screenshot, if any */
	screenshotPath?: string;
	/** Path to the accessibility snapshot, if any */
	snapshotPath?: string;
	/** Error messages for failed checks */
	errors: string[];
	/** Individual check results */
	checkResults: CheckResult[];
	/** Total duration in milliseconds */
	durationMs: number;
}

/**
 * Result of an individual check
 */
export interface CheckResult {
	/** The check that was performed */
	check: VisualCheck;
	/** Whether this check passed */
	passed: boolean;
	/** Output from the check command */
	output?: string;
	/** Error message if check failed */
	error?: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_BASE_URL = "http://localhost:3000";
const DEFAULT_WAIT_MS = 3000;
const DEFAULT_TIMEOUT_MS = 30000;
const AGENT_BROWSER_CMD = "agent-browser";

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if agent-browser is available
 */
export function isAgentBrowserAvailable(): boolean {
	try {
		execSync(`${AGENT_BROWSER_CMD} --version`, { stdio: "pipe" });
		return true;
	} catch {
		return false;
	}
}

/**
 * Get agent-browser version
 */
export function getAgentBrowserVersion(): string | null {
	try {
		const output = execSync(`${AGENT_BROWSER_CMD} --version`, {
			encoding: "utf-8",
		});
		return output.trim();
	} catch {
		return null;
	}
}

/**
 * Execute an agent-browser command with timeout protection
 */
function runAgentBrowserCommand(
	args: string[],
	timeoutMs: number,
): { success: boolean; output: string; error?: string } {
	try {
		const output = execSync(`${AGENT_BROWSER_CMD} ${args.join(" ")}`, {
			encoding: "utf-8",
			timeout: timeoutMs,
			stdio: ["pipe", "pipe", "pipe"],
		});
		return { success: true, output: output.trim() };
	} catch (error) {
		const err = error as Error & { stderr?: Buffer; stdout?: Buffer };
		const stderr = err.stderr?.toString() || err.message;
		const stdout = err.stdout?.toString() || "";
		return {
			success: false,
			output: stdout,
			error: stderr,
		};
	}
}

/**
 * Ensure output directory exists
 */
function ensureOutputDir(dir: string): void {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

/**
 * Generate a timestamp-based filename
 */
function generateFilename(prefix: string, extension: string): string {
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	return `${prefix}-${timestamp}.${extension}`;
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Run visual verification for a UI task
 *
 * @param config - Visual verification configuration
 * @returns Verification result with pass/fail status and captured artifacts
 *
 * @example
 * ```typescript
 * const result = await runVisualVerification({
 *   route: "/home/dashboard",
 *   checks: [
 *     { command: "is visible", target: "Dashboard" },
 *     { command: "find role", target: "heading" }
 *   ],
 *   screenshot: true,
 *   outputDir: ".ai/alpha/validation/feature-123/"
 * });
 *
 * if (!result.passed) {
 *   console.error("Visual verification failed:", result.errors);
 * }
 * ```
 */
export async function runVisualVerification(
	config: VisualVerificationConfig,
): Promise<VisualVerificationResult> {
	const startTime = Date.now();
	const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
	const waitMs = config.waitMs ?? DEFAULT_WAIT_MS;
	const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const screenshot = config.screenshot ?? true;
	const outputDir = config.outputDir ?? ".ai/alpha/validation/";
	const checks = config.checks ?? [];

	const errors: string[] = [];
	const checkResults: CheckResult[] = [];
	let screenshotPath: string | undefined;
	let snapshotPath: string | undefined;

	// Check if agent-browser is available
	if (!isAgentBrowserAvailable()) {
		return {
			passed: false,
			errors: [
				"agent-browser is not available. Install with: pnpm add -g agent-browser && agent-browser install",
			],
			checkResults: [],
			durationMs: Date.now() - startTime,
		};
	}

	// Ensure output directory exists
	ensureOutputDir(outputDir);

	// Build full URL
	const fullUrl = `${baseUrl}${config.route}`;

	// Step 1: Open the page
	const openResult = runAgentBrowserCommand(["open", fullUrl], timeoutMs);
	if (!openResult.success) {
		return {
			passed: false,
			errors: [`Failed to open page ${fullUrl}: ${openResult.error}`],
			checkResults: [],
			durationMs: Date.now() - startTime,
		};
	}

	// Step 2: Wait for page to load
	if (waitMs > 0) {
		runAgentBrowserCommand(["wait", waitMs.toString()], timeoutMs);
	}

	// Step 3: Run each check
	for (const check of checks) {
		const checkResult = await runCheck(check, timeoutMs);
		checkResults.push(checkResult);
		if (!checkResult.passed && checkResult.error) {
			errors.push(
				`Check failed [${check.command} ${check.target ?? ""}]: ${checkResult.error}`,
			);
		}
	}

	// Step 4: Capture snapshot if requested or if any check requires it
	const needsSnapshot = checks.some((c) => c.command === "snapshot");
	if (needsSnapshot) {
		const snapshotFilename = generateFilename("snapshot", "txt");
		snapshotPath = path.join(outputDir, snapshotFilename);
		const snapshotResult = runAgentBrowserCommand(
			["snapshot", "-i", "-c"],
			timeoutMs,
		);
		if (snapshotResult.success) {
			fs.writeFileSync(snapshotPath, snapshotResult.output);
		} else {
			errors.push(`Failed to capture snapshot: ${snapshotResult.error}`);
		}
	}

	// Step 5: Capture screenshot if enabled
	if (screenshot) {
		const screenshotFilename = generateFilename("screenshot", "png");
		screenshotPath = path.join(outputDir, screenshotFilename);
		const screenshotResult = runAgentBrowserCommand(
			["screenshot", screenshotPath],
			timeoutMs,
		);
		if (!screenshotResult.success) {
			errors.push(`Failed to capture screenshot: ${screenshotResult.error}`);
			screenshotPath = undefined;
		}
	}

	// Determine overall pass/fail
	const passed = checkResults.every((r) => r.passed) && errors.length === 0;

	return {
		passed,
		screenshotPath,
		snapshotPath,
		errors,
		checkResults,
		durationMs: Date.now() - startTime,
	};
}

/**
 * Run a single visual check
 */
async function runCheck(
	check: VisualCheck,
	timeoutMs: number,
): Promise<CheckResult> {
	const target = check.target ?? "";
	const flags = check.flags ?? "";

	let args: string[];
	switch (check.command) {
		case "is visible":
			args = ["is", "visible", `"${target}"`];
			break;
		case "find role":
			args = ["find", "role", target];
			if (flags) args.push(flags);
			break;
		case "find label":
			args = ["find", "label", `"${target}"`];
			if (flags) args.push(flags);
			break;
		case "find text":
			args = ["find", "text", `"${target}"`];
			if (flags) args.push(flags);
			break;
		case "snapshot":
			args = ["snapshot", "-i", "-c"];
			break;
		default:
			return {
				check,
				passed: false,
				error: `Unknown check command: ${check.command}`,
			};
	}

	const result = runAgentBrowserCommand(args, timeoutMs);

	// Determine pass/fail based on command type
	if (check.command === "is visible") {
		// "is visible" returns exit code 0 if visible, non-zero if not
		return {
			check,
			passed: result.success,
			output: result.output,
			error: result.success ? undefined : `Element "${target}" is not visible`,
		};
	}

	if (check.command === "snapshot") {
		// Snapshot always "passes" if it can be captured
		return {
			check,
			passed: result.success,
			output: result.output,
			error: result.error,
		};
	}

	// For find commands, success means the element was found
	return {
		check,
		passed: result.success,
		output: result.output,
		error: result.success
			? undefined
			: `Could not find ${check.command.replace("find ", "")} "${target}"`,
	};
}

/**
 * Quick validation - just check if a page loads without errors
 *
 * @param route - The route to validate
 * @param baseUrl - Optional base URL (default: http://localhost:3000)
 * @returns True if page loads successfully
 */
export async function quickValidate(
	route: string,
	baseUrl?: string,
): Promise<boolean> {
	const result = await runVisualVerification({
		route,
		baseUrl,
		screenshot: false,
		checks: [],
		waitMs: 2000,
	});
	return result.passed;
}

/**
 * Capture a screenshot of a route
 *
 * @param route - The route to capture
 * @param outputPath - Path to save the screenshot
 * @param baseUrl - Optional base URL (default: http://localhost:3000)
 * @returns Path to the saved screenshot, or null if failed
 */
export async function captureScreenshot(
	route: string,
	outputPath: string,
	baseUrl?: string,
): Promise<string | null> {
	const dir = path.dirname(outputPath);
	ensureOutputDir(dir);

	const result = await runVisualVerification({
		route,
		baseUrl,
		screenshot: true,
		outputDir: dir,
		checks: [],
		waitMs: 2000,
	});

	if (result.screenshotPath) {
		// Rename to the requested output path
		if (result.screenshotPath !== outputPath) {
			fs.renameSync(result.screenshotPath, outputPath);
		}
		return outputPath;
	}

	return null;
}

/**
 * Get an accessibility snapshot of a page
 *
 * @param route - The route to snapshot
 * @param baseUrl - Optional base URL (default: http://localhost:3000)
 * @returns The accessibility tree as a string, or null if failed
 */
export async function getAccessibilitySnapshot(
	route: string,
	baseUrl?: string,
): Promise<string | null> {
	if (!isAgentBrowserAvailable()) {
		return null;
	}

	const fullUrl = `${baseUrl ?? DEFAULT_BASE_URL}${route}`;
	const openResult = runAgentBrowserCommand(
		["open", fullUrl],
		DEFAULT_TIMEOUT_MS,
	);
	if (!openResult.success) {
		return null;
	}

	runAgentBrowserCommand(["wait", "2000"], DEFAULT_TIMEOUT_MS);

	const snapshotResult = runAgentBrowserCommand(
		["snapshot", "-i", "-c"],
		DEFAULT_TIMEOUT_MS,
	);
	return snapshotResult.success ? snapshotResult.output : null;
}
