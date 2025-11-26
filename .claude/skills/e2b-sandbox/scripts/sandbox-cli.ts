#!/usr/bin/env tsx
/**
 * E2B Sandbox CLI - TypeScript CLI for managing E2B cloud sandboxes
 *
 * Usage:
 *   tsx sandbox-cli.ts create [--timeout 300] [--template TEMPLATE]
 *   tsx sandbox-cli.ts list [--json]
 *   tsx sandbox-cli.ts status <sandbox-id>
 *   tsx sandbox-cli.ts kill <sandbox-id>
 *   tsx sandbox-cli.ts kill-all
 *
 * Requires:
 *   E2B_API_KEY environment variable
 */

import { Sandbox } from "@e2b/code-interpreter";

const API_KEY = process.env.E2B_API_KEY;

// Claude authentication - OAuth token takes precedence (for Max plan users)
// Generate OAuth token with: claude setup-token
const CLAUDE_CODE_OAUTH_TOKEN = process.env.CLAUDE_CODE_OAUTH_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Default template for SlideHeroes project
const DEFAULT_TEMPLATE = "slideheroes-claude-agent";

function checkApiKey(): void {
	if (!API_KEY) {
		console.error("ERROR: E2B_API_KEY environment variable not set");
		console.error("Get your API key from: https://e2b.dev/dashboard");
		process.exit(1);
	}
}

function checkClaudeAuth(): void {
	if (!CLAUDE_CODE_OAUTH_TOKEN && !ANTHROPIC_API_KEY) {
		console.error("ERROR: No Claude authentication found");
		console.error("Set one of:");
		console.error(
			"  - CLAUDE_CODE_OAUTH_TOKEN (for Max plan - generate with: claude setup-token)",
		);
		console.error("  - ANTHROPIC_API_KEY (for API access)");
		process.exit(1);
	}
}

function getClaudeEnvVars(): Record<string, string> {
	// OAuth token takes precedence (for Max plan users)
	if (CLAUDE_CODE_OAUTH_TOKEN) {
		return { CLAUDE_CODE_OAUTH_TOKEN };
	}
	if (ANTHROPIC_API_KEY) {
		return { ANTHROPIC_API_KEY };
	}
	return {};
}

function getClaudeAuthType(): string {
	if (CLAUDE_CODE_OAUTH_TOKEN) return "OAuth (Max plan)";
	if (ANTHROPIC_API_KEY) return "API Key";
	return "None";
}

async function createSandbox(
	timeout: number = 300,
	template: string = DEFAULT_TEMPLATE,
): Promise<Sandbox> {
	checkApiKey();

	const claudeEnvVars = getClaudeEnvVars();
	const hasClaudeAuth = Object.keys(claudeEnvVars).length > 0;

	console.log(
		`Creating sandbox (timeout: ${timeout}s, template: ${template})...`,
	);
	if (hasClaudeAuth) {
		console.log(`Claude auth: ${getClaudeAuthType()}`);
	}

	try {
		const opts = {
			timeoutMs: timeout * 1000,
			apiKey: API_KEY,
			envs: hasClaudeAuth ? claudeEnvVars : undefined,
		};

		const sandbox = await Sandbox.create(template, opts);

		console.log("\n=== Sandbox Created ===");
		console.log(`ID:       ${sandbox.sandboxId}`);
		console.log(`Timeout:  ${timeout} seconds`);
		console.log(`Template: ${template}`);
		console.log("\nTo connect: /sandbox status " + sandbox.sandboxId);
		console.log("To kill:    /sandbox kill " + sandbox.sandboxId);

		return sandbox;
	} catch (error) {
		console.error(
			"Failed to create sandbox:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

async function runClaude(
	prompt: string,
	sandboxId?: string,
	timeout: number = 600,
): Promise<void> {
	checkApiKey();
	checkClaudeAuth();

	let sandbox: Sandbox;
	let createdSandbox = false;

	try {
		if (sandboxId) {
			console.log(`Connecting to sandbox ${sandboxId}...`);
			sandbox = await Sandbox.connect(sandboxId, { apiKey: API_KEY });
		} else {
			sandbox = await createSandbox(timeout);
			createdSandbox = true;
		}

		console.log(`\nRunning Claude Code with prompt: "${prompt}"`);
		console.log(`Authentication: ${getClaudeAuthType()}`);
		console.log("This may take a while...\n");

		// Run Claude Code in the sandbox
		const result = await sandbox.commands.run(
			`run-claude "${prompt.replace(/"/g, '\\"')}"`,
			{
				timeoutMs: 0, // No timeout for long-running Claude tasks
				envs: getClaudeEnvVars(),
			},
		);

		console.log("=== Claude Code Output ===\n");
		if (result.stdout) {
			console.log(result.stdout);
		}
		if (result.stderr) {
			console.error("\n=== Errors ===");
			console.error(result.stderr);
		}
		console.log(`\nExit code: ${result.exitCode}`);

		if (createdSandbox) {
			console.log(`\nSandbox ${sandbox.sandboxId} is still running.`);
			console.log(
				"To continue using it: /sandbox run-claude --sandbox " +
					sandbox.sandboxId +
					' "your prompt"',
			);
			console.log("To kill it: /sandbox kill " + sandbox.sandboxId);
		}
	} catch (error) {
		console.error(
			"Failed to run Claude:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

async function listSandboxes(jsonOutput: boolean = false): Promise<void> {
	checkApiKey();

	try {
		const sandboxes = await Sandbox.list({ apiKey: API_KEY });

		if (sandboxes.length === 0) {
			console.log("No running sandboxes found");
			return;
		}

		if (jsonOutput) {
			const output = sandboxes.map((s) => ({
				id: s.sandboxId,
				templateId: s.templateId,
				startedAt: s.startedAt?.toISOString(),
				metadata: s.metadata,
			}));
			console.log(JSON.stringify(output, null, 2));
		} else {
			console.log(`Found ${sandboxes.length} sandbox(es):\n`);
			console.log(
				`${"ID".padEnd(40)} ${"Template".padEnd(20)} ${"Started".padEnd(25)}`,
			);
			console.log("-".repeat(90));

			for (const s of sandboxes) {
				const started = s.startedAt
					? s.startedAt.toISOString().replace("T", " ").slice(0, 19)
					: "N/A";
				const template = s.templateId || "default";
				console.log(
					`${s.sandboxId.padEnd(40)} ${template.padEnd(20)} ${started.padEnd(25)}`,
				);
			}
		}
	} catch (error) {
		console.error(
			"Failed to list sandboxes:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

async function checkStatus(sandboxId: string): Promise<void> {
	checkApiKey();

	try {
		const sandbox = await Sandbox.connect(sandboxId, { apiKey: API_KEY });
		const isRunning = await sandbox.isRunning();

		console.log(`Sandbox ${sandboxId}: ${isRunning ? "RUNNING" : "STOPPED"}`);
	} catch (error) {
		console.error(
			`Failed to check sandbox ${sandboxId}:`,
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

async function killSandbox(sandboxId: string): Promise<void> {
	checkApiKey();

	try {
		const sandbox = await Sandbox.connect(sandboxId, { apiKey: API_KEY });
		await sandbox.kill();
		console.log(`Killed sandbox: ${sandboxId}`);
	} catch (error) {
		console.error(
			`Failed to kill sandbox ${sandboxId}:`,
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

async function killAllSandboxes(): Promise<void> {
	checkApiKey();

	try {
		const sandboxes = await Sandbox.list({ apiKey: API_KEY });

		if (sandboxes.length === 0) {
			console.log("No running sandboxes to kill");
			return;
		}

		console.log(`Killing ${sandboxes.length} sandbox(es)...`);

		let killed = 0;
		for (const s of sandboxes) {
			try {
				const sandbox = await Sandbox.connect(s.sandboxId, { apiKey: API_KEY });
				await sandbox.kill();
				console.log(`  Killed: ${s.sandboxId}`);
				killed++;
			} catch {
				console.log(`  Failed: ${s.sandboxId}`);
			}
		}

		console.log(`\nKilled ${killed}/${sandboxes.length} sandboxes`);
	} catch (error) {
		console.error(
			"Failed to kill sandboxes:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

function showHelp(): void {
	console.log(`
E2B Sandbox Manager - Commands:

  create [--timeout 300] [--template NAME]  Create a new sandbox
                                            (default template: ${DEFAULT_TEMPLATE})
  list [--json]                             List running sandboxes
  status <sandbox-id>                       Check sandbox status
  kill <sandbox-id>                         Kill a specific sandbox
  kill-all                                  Kill all sandboxes
  run-claude "<prompt>" [--sandbox ID]      Run Claude Code with a prompt
                                            [--timeout 600]

Examples:
  /sandbox create                           Create sandbox with slideheroes template
  /sandbox run-claude "/test 1"             Run /test 1 in new sandbox
  /sandbox run-claude "Fix auth bug" --sandbox abc123
                                            Run in existing sandbox

Requirements:
  - E2B_API_KEY environment variable must be set
  - Claude authentication (one of):
    - CLAUDE_CODE_OAUTH_TOKEN (for Max plan - generate with: claude setup-token)
    - ANTHROPIC_API_KEY (for API access)

Get E2B API key: https://e2b.dev/dashboard
`);
}

// Parse arguments
async function main(): Promise<void> {
	const args = process.argv.slice(2);
	const command = args[0];

	switch (command) {
		case "create": {
			let timeout = 300;
			let template: string | undefined;

			for (let i = 1; i < args.length; i++) {
				if (args[i] === "--timeout" && args[i + 1]) {
					timeout = parseInt(args[i + 1], 10);
					i++;
				} else if (args[i] === "--template" && args[i + 1]) {
					template = args[i + 1];
					i++;
				}
			}

			await createSandbox(timeout, template);
			break;
		}

		case "list": {
			const jsonOutput = args.includes("--json");
			await listSandboxes(jsonOutput);
			break;
		}

		case "status": {
			const sandboxId = args[1];
			if (!sandboxId) {
				console.error("Usage: sandbox-cli.ts status <sandbox-id>");
				process.exit(1);
			}
			await checkStatus(sandboxId);
			break;
		}

		case "kill": {
			const sandboxId = args[1];
			if (!sandboxId) {
				console.error("Usage: sandbox-cli.ts kill <sandbox-id>");
				process.exit(1);
			}
			await killSandbox(sandboxId);
			break;
		}

		case "kill-all":
			await killAllSandboxes();
			break;

		case "run-claude": {
			let prompt: string | undefined;
			let sandboxId: string | undefined;
			let timeout = 600;

			for (let i = 1; i < args.length; i++) {
				if (args[i] === "--sandbox" && args[i + 1]) {
					sandboxId = args[i + 1];
					i++;
				} else if (args[i] === "--timeout" && args[i + 1]) {
					timeout = parseInt(args[i + 1], 10);
					i++;
				} else if (!args[i].startsWith("--") && !prompt) {
					prompt = args[i];
				}
			}

			if (!prompt) {
				console.error(
					'Usage: sandbox run-claude "<prompt>" [--sandbox ID] [--timeout 600]',
				);
				console.error('Example: sandbox run-claude "/test 1"');
				console.error(
					'Example: sandbox run-claude "Fix the auth bug" --sandbox abc123',
				);
				process.exit(1);
			}

			await runClaude(prompt, sandboxId, timeout);
			break;
		}
		default:
			showHelp();
			break;
	}
}

main().catch((error) => {
	console.error("Unexpected error:", error);
	process.exit(1);
});
