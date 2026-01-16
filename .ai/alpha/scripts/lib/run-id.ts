/**
 * Run ID Generation Module
 *
 * Generates unique identifiers for orchestrator runs to distinguish
 * between different runs and correlate logs and progress files.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Metadata about an orchestrator run.
 */
export interface RunMetadata {
	/** Unique identifier for this run */
	runId: string;
	/** Spec ID being orchestrated */
	specId: number;
	/** When the run started */
	startTime: Date;
	/** Labels of sandboxes in this run */
	sandboxLabels: string[];
}

// ============================================================================
// Run ID Generation
// ============================================================================

/**
 * Generate a unique run ID.
 *
 * Format: run-{timestamp36}-{random4}
 * Example: run-m5x7k2-a3b9
 *
 * Properties:
 * - Uniqueness: timestamp + random component ensures uniqueness
 * - Sortability: timestamp portion allows chronological sorting
 * - Human readability: ~12-14 character total length
 *
 * @returns A unique run ID string
 */
export function generateRunId(): string {
	const timestamp = Date.now().toString(36);
	const random = Math.random().toString(36).substring(2, 6);
	return `run-${timestamp}-${random}`;
}

/**
 * Format a directory name for archiving a previous run.
 *
 * @param timestamp - The timestamp to use (defaults to now)
 * @returns A formatted archive directory name
 */
export function formatArchiveDirectory(timestamp: Date = new Date()): string {
	// Format: YYYY-MM-DDTHH-MM-SS (ISO without colons for filesystem safety)
	return timestamp.toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

/**
 * Create a session header for log files.
 *
 * @param runId - The run ID
 * @param specId - The spec being implemented
 * @param sandboxLabel - The sandbox label (e.g., "sbx-a")
 * @returns A formatted session header string
 */
export function createSessionHeader(
	runId: string,
	specId: number,
	sandboxLabel: string,
): string {
	const separator = "=".repeat(80);
	const now = new Date().toISOString();

	return `${separator}
Alpha Orchestrator Log
Run ID: ${runId}
Spec ID: ${specId}
Sandbox: ${sandboxLabel}
Started: ${now}
${separator}
`;
}

/**
 * Extract the timestamp portion from a run ID for display or sorting.
 *
 * @param runId - The run ID to parse
 * @returns The timestamp as a Date, or null if invalid format
 */
export function parseRunIdTimestamp(runId: string): Date | null {
	const match = runId.match(/^run-([a-z0-9]+)-[a-z0-9]+$/);
	if (!match?.[1]) {
		return null;
	}

	const timestamp = parseInt(match[1], 36);
	if (Number.isNaN(timestamp)) {
		return null;
	}

	return new Date(timestamp);
}

/**
 * Validate a run ID format.
 *
 * @param runId - The run ID to validate
 * @returns true if valid format, false otherwise
 */
export function isValidRunId(runId: string): boolean {
	return /^run-[a-z0-9]+-[a-z0-9]{4}$/.test(runId);
}
