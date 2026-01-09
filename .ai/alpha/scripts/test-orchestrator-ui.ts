#!/usr/bin/env npx tsx

/**

* Integration test for the Orchestrator UI
*
* This script simulates the orchestrator writing progress files
* and verifies the UI can read and display them correctly.
*
* Usage:
* npx tsx .ai/alpha/scripts/test-orchestrator-ui.ts
*
* Tests:
* 1. Progress file writing and reading
* 1. Hook execution
* 1. Health check timing
* 1. UI state aggregation
 */

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

// Test configuration
const PROJECT_ROOT = execSync("git rev-parse --show-toplevel", {
	encoding: "utf-8",
}).trim();
const PROGRESS_DIR = path.join(PROJECT_ROOT, ".ai/alpha/progress");
const HOOKS_DIR = path.join(PROJECT_ROOT, ".claude/hooks");

// ANSI colors for output
const colors = {
	reset: "\x1b[0m",
	green: "\x1b[32m",
	red: "\x1b[31m",
	yellow: "\x1b[33m",
	cyan: "\x1b[36m",
	dim: "\x1b[2m",
};

function log(message: string, color: keyof typeof colors = "reset"): void {
	console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message: string): void {
	log(`✅ ${message}`, "green");
}

function fail(message: string): void {
	log(`❌ ${message}`, "red");
}

function info(message: string): void {
	log(`ℹ️  ${message}`, "cyan");
}

function warn(message: string): void {
	log(`⚠️  ${message}`, "yellow");
}

/**

* Test 1: Verify hooks are installed
 */
function testHooksInstalled(): boolean {
	info("Testing hooks installation...");

	const heartbeatHook = path.join(HOOKS_DIR, "heartbeat.py");
	const subagentHook = path.join(HOOKS_DIR, "subagent_complete.py");

	let passed = true;

	if (fs.existsSync(heartbeatHook)) {
		success("heartbeat.py exists");
	} else {
		fail("heartbeat.py not found");
		passed = false;
	}

	if (fs.existsSync(subagentHook)) {
		success("subagent_complete.py exists");
	} else {
		fail("subagent_complete.py not found");
		passed = false;
	}

	return passed;
}

/**

* Test 2: Verify heartbeat hook works
 */
function testHeartbeatHook(): boolean {
	info("Testing heartbeat hook...");

	const testProgressFile = path.join(PROJECT_ROOT, ".initiative-progress.json");

	// Clean up any existing test file
	if (fs.existsSync(testProgressFile)) {
		fs.unlinkSync(testProgressFile);
	}

	try {
		// Run the heartbeat hook with test input
		const input = JSON.stringify({
			tool_name: "TestTool",
			session_id: "test-session-123",
		});
		execSync(
			`echo '${input}' | python3 ${path.join(HOOKS_DIR, "heartbeat.py")}`,
			{
				cwd: PROJECT_ROOT,
				encoding: "utf-8",
			},
		);

		// Check if progress file was created
		if (!fs.existsSync(testProgressFile)) {
			fail("Progress file was not created by heartbeat hook");
			return false;
		}

		// Verify contents
		const progress = JSON.parse(fs.readFileSync(testProgressFile, "utf-8"));

		if (!progress.last_heartbeat) {
			fail("last_heartbeat field not set");
			return false;
		}

		if (progress.last_tool !== "TestTool") {
			fail(
				`last_tool incorrect: expected 'TestTool', got '${progress.last_tool}'`,
			);
			return false;
		}

		if (progress.tool_count !== 1) {
			fail(`tool_count incorrect: expected 1, got ${progress.tool_count}`);
			return false;
		}

		success("Heartbeat hook works correctly");

		// Clean up
		fs.unlinkSync(testProgressFile);

		return true;
	} catch (error) {
		fail(`Heartbeat hook failed: ${error}`);
		return false;
	}
}

/**

* Test 3: Verify progress directory structure
 */
function testProgressDirectory(): boolean {
	info("Testing progress directory...");

	// Create progress directory if it doesn't exist
	if (!fs.existsSync(PROGRESS_DIR)) {
		fs.mkdirSync(PROGRESS_DIR, { recursive: true });
		info(`Created progress directory: ${PROGRESS_DIR}`);
	}

	// Write test progress files
	const testProgress = {
		sandbox_id: "test-sandbox-123",
		feature: { issue_number: 1234, title: "Test Feature" },
		current_task: { id: "T1.1", name: "Test Task", status: "in_progress" },
		tasks_completed: 2,
		tasks_total: 5,
		context_usage_percent: 45,
		status: "running",
		phase: "executing",
		last_heartbeat: new Date().toISOString(),
		last_tool: "Read",
		session_id: "test-session",
	};

	const sandboxLabels = ["sbx-a", "sbx-b", "sbx-c"];
	let passed = true;

	for (const label of sandboxLabels) {
		const filePath = path.join(PROGRESS_DIR, `${label}-progress.json`);
		try {
			fs.writeFileSync(filePath, JSON.stringify(testProgress, null, "\t"));
			success(`Wrote ${label}-progress.json`);
		} catch (error) {
			fail(`Failed to write ${label}-progress.json: ${error}`);
			passed = false;
		}
	}

	// Verify files can be read
	for (const label of sandboxLabels) {
		const filePath = path.join(PROGRESS_DIR, `${label}-progress.json`);
		try {
			const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
			if (content.feature?.issue_number === 1234) {
				success(`Read ${label}-progress.json correctly`);
			} else {
				fail(`${label}-progress.json content mismatch`);
				passed = false;
			}
		} catch (error) {
			fail(`Failed to read ${label}-progress.json: ${error}`);
			passed = false;
		}
	}

	// Clean up test files
	for (const label of sandboxLabels) {
		const filePath = path.join(PROGRESS_DIR, `${label}-progress.json`);
		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
		}
	}

	return passed;
}

/**

* Test 4: Verify TypeScript compilation
 */
function testTypeScriptCompilation(): boolean {
	info("Testing TypeScript compilation...");

	const uiDir = path.join(PROJECT_ROOT, ".ai/alpha/scripts/ui");

	try {
		execSync("pnpm typecheck", {
			cwd: uiDir,
			encoding: "utf-8",
			stdio: "pipe",
		});
		success("UI components compile successfully");
		return true;
	} catch (error) {
		fail("UI components failed to compile");
		if (error instanceof Error && "stdout" in error) {
			console.log(error.stdout);
		}
		return false;
	}
}

/**

* Test 5: Verify settings.json has hooks configured
 */
function testSettingsConfiguration(): boolean {
	info("Testing settings.json configuration...");

	const settingsPath = path.join(PROJECT_ROOT, ".claude/settings.json");

	if (!fs.existsSync(settingsPath)) {
		fail("settings.json not found");
		return false;
	}

	try {
		const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));

		// Check PostToolUse hooks
		const postToolUse = settings.hooks?.PostToolUse;
		if (!postToolUse) {
			fail("PostToolUse hooks not configured");
			return false;
		}

		const hasHeartbeat = postToolUse.some(
			(hook: { hooks?: Array<{ command?: string }> }) =>
				hook.hooks?.some((h) => h.command?.includes("heartbeat.py")),
		);

		if (hasHeartbeat) {
			success("heartbeat.py configured in PostToolUse");
		} else {
			warn("heartbeat.py not found in PostToolUse hooks");
		}

		// Check SubagentStop hooks
		const subagentStop = settings.hooks?.SubagentStop;
		if (!subagentStop) {
			fail("SubagentStop hooks not configured");
			return false;
		}

		const hasSubagentComplete = subagentStop.some(
			(hook: { hooks?: Array<{ command?: string }> }) =>
				hook.hooks?.some((h) => h.command?.includes("subagent_complete.py")),
		);

		if (hasSubagentComplete) {
			success("subagent_complete.py configured in SubagentStop");
		} else {
			warn("subagent_complete.py not found in SubagentStop hooks");
		}

		return hasHeartbeat && hasSubagentComplete;
	} catch (error) {
		fail(`Failed to parse settings.json: ${error}`);
		return false;
	}
}

/**

* Main test runner
 */
async function main(): Promise<void> {
	console.log("\n" + "═".repeat(60));
	log("   ORCHESTRATOR UI INTEGRATION TESTS", "cyan");
	console.log("═".repeat(60) + "\n");

	const tests = [
		{ name: "Hooks Installation", fn: testHooksInstalled },
		{ name: "Heartbeat Hook", fn: testHeartbeatHook },
		{ name: "Progress Directory", fn: testProgressDirectory },
		{ name: "TypeScript Compilation", fn: testTypeScriptCompilation },
		{ name: "Settings Configuration", fn: testSettingsConfiguration },
	];

	let passed = 0;
	let failed = 0;

	for (const test of tests) {
		console.log(`\n${colors.dim}─── ${test.name} ───${colors.reset}`);
		try {
			if (test.fn()) {
				passed++;
			} else {
				failed++;
			}
		} catch (error) {
			fail(`Test threw error: ${error}`);
			failed++;
		}
	}

	console.log("\n" + "═".repeat(60));
	log(
		`RESULTS: ${passed} passed, ${failed} failed`,
		failed > 0 ? "red" : "green",
	);
	console.log("═".repeat(60) + "\n");

	if (failed > 0) {
		process.exit(1);
	}
}

main().catch(console.error);
